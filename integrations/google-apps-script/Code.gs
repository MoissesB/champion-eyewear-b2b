// Sheet-bound registry. Maintenance and trigger handlers end in _ so the
// anonymous web app exposes only the two checked EmailGateway functions.
const TAB = 'Clientes';
const SIMPLE_HEADERS = ['Correo', 'Acceso', 'Inicios de sesión', 'Accesos al portal', 'Descargas iniciadas', 'Recursos solicitados', 'Última actividad', 'UID', 'Error'];

function firestoreUrl_(path) {
  const projectId = PropertiesService.getScriptProperties().getProperty('FIREBASE_PROJECT_ID');
  if (!projectId) throw new Error('Falta FIREBASE_PROJECT_ID');
  return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(projectId) + '/databases/(default)/documents/' + path;
}

function googleFetch_(url, options) {
  const response = UrlFetchApp.fetch(url, Object.assign({
    muteHttpExceptions: true,
    headers: {Authorization: 'Bearer ' + ScriptApp.getOAuthToken()}
  }, options || {}));
  const code = response.getResponseCode();
  if (code < 200 || code >= 300) throw new Error(code + ': ' + response.getContentText().slice(0, 400));
  const body = response.getContentText();
  return body ? JSON.parse(body) : {};
}

function field_(document, name) {
  const value = document.fields?.[name];
  return value?.stringValue || value?.timestampValue || '';
}

function sheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB);
  if (!sheet) throw new Error('Falta la pestaña Clientes');
  return sheet;
}

function listClients_() {
  let token = '';
  const clients = [];
  do {
    const url = firestoreUrl_('clients') + '?pageSize=300' + (token ? '&pageToken=' + encodeURIComponent(token) : '');
    const page = googleFetch_(url);
    for (const document of page.documents || []) {
      clients.push({
        uid: document.name.split('/').pop(),
        email: field_(document, 'email'),
        createdAt: field_(document, 'createdAt'),
        status: field_(document, 'status')
      });
    }
    token = page.nextPageToken || '';
  } while (token);
  return clients;
}

function patchStatus_(uid, status) {
  const url = firestoreUrl_('clients/' + encodeURIComponent(uid)) + '?updateMask.fieldPaths=status';
  return googleFetch_(url, {
    method: 'patch', contentType: 'application/json',
    payload: JSON.stringify({fields: {status: {stringValue: status}}})
  });
}

function simpleEvents_(uid) {
  const all = [];
  let token = '';
  do {
    const url = firestoreUrl_('clients/' + encodeURIComponent(uid) + '/events') + '?pageSize=300' + (token ? '&pageToken=' + encodeURIComponent(token) : '');
    const page = googleFetch_(url);
    for (const document of page.documents || []) {
      all.push({
        kind: field_(document, 'kind'),
        type: field_(document, 'resourceType'),
        id: field_(document, 'resourceId'),
        at: field_(document, 'createdAt')
      });
    }
    token = page.nextPageToken || '';
  } while (token);
  return all.sort((a, b) => a.at.localeCompare(b.at));
}

function configureTriggers_() {
  const sheet = sheet_();
  sheet.getRange(1, 1, 1, 9).setValues([SIMPLE_HEADERS]);
  sheet.setFrozenRows(1);
  sheet.getRange(2, 2, sheet.getMaxRows() - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['PENDIENTE', 'APROBADO', 'DENEGADO'], true).setAllowInvalid(false).build()
  );
  sheet.hideColumns(8, 2);
  for (const trigger of ScriptApp.getProjectTriggers()) {
    if (['syncClients', 'onClientAction', 'syncSimple', 'onSimpleEdit', 'syncSimple_', 'onSimpleEdit_'].includes(trigger.getHandlerFunction())) {
      ScriptApp.deleteTrigger(trigger);
    }
  }
  ScriptApp.newTrigger('syncSimple_').timeBased().everyMinutes(15).create();
  ScriptApp.newTrigger('onSimpleEdit_').forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet()).onEdit().create();
  syncSimple_();
}

function syncSimple_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const sheet = sheet_();
    const old = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues() : [];
    const byEmail = {};
    old.forEach((row, index) => {if (row[0]) byEmail[String(row[0]).trim().toLowerCase()] = index + 2;});
    for (const client of listClients_()) {
      const email = String(client.email).trim().toLowerCase();
      if (!email) continue;
      const row = byEmail[email] || sheet.getLastRow() + 1;
      let access = String(sheet.getRange(row, 2).getValue() || 'PENDIENTE').trim().toUpperCase();
      if (!['APROBADO', 'DENEGADO', 'PENDIENTE'].includes(access)) access = 'PENDIENTE';
      const desired = access === 'APROBADO' ? 'approved' : access === 'DENEGADO' ? 'suspended' : 'pending';
      if (client.status !== desired) patchStatus_(client.uid, desired);
      const events = simpleEvents_(client.uid);
      const downloads = events.filter(e => e.kind === 'download');
      byEmail[email] = row;
      sheet.getRange(row, 1).setValue(email);
      sheet.getRange(row, 2).setValue(access);
      sheet.getRange(row, 3, 1, 7).setValues([[
        events.filter(e => e.kind === 'login').length,
        events.filter(e => e.kind === 'visit').length,
        downloads.length,
        downloads.slice(-10).reverse().map(e => e.type + ':' + e.id).join('\n').slice(0, 1000),
        events.length ? new Date(events[events.length - 1].at) : (client.createdAt ? new Date(client.createdAt) : ''),
        client.uid, ''
      ]]);
    }
  } finally { lock.releaseLock(); }
}

function onSimpleEdit_(event) {
  if (!event || !event.range || event.range.getSheet().getName() !== TAB || event.range.getColumn() !== 2 || event.range.getRow() < 2) return;
  const action = String(event.value || '').trim().toUpperCase();
  if (!['PENDIENTE', 'APROBADO', 'DENEGADO'].includes(action)) return;
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  const sheet = event.range.getSheet();
  const row = event.range.getRow();
  try {
    const email = String(sheet.getRange(row, 1).getValue()).trim().toLowerCase();
    const uid = String(sheet.getRange(row, 8).getValue());
    if (!email) throw new Error('Falta correo');
    if (uid) {
      const current = googleFetch_(firestoreUrl_('clients/' + encodeURIComponent(uid)));
      if (field_(current, 'email').toLowerCase() !== email) throw new Error('Correo no coincide con Firestore');
      patchStatus_(uid, action === 'APROBADO' ? 'approved' : action === 'DENEGADO' ? 'suspended' : 'pending');
    }
    sheet.getRange(row, 7).setValue(new Date());
    sheet.getRange(row, 9).clearContent();
  } catch (error) {
    sheet.getRange(row, 9).setValue(String(error).slice(0, 500));
    throw error;
  } finally { lock.releaseLock(); }
}
