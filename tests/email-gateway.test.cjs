const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const rows = [
  ['Correo', 'Acceso'],
  ['owner@example.com', 'APROBADO'],
  ['blocked@example.com', 'DENEGADO'],
  ['duplicate@example.com', 'APROBADO'],
  ['duplicate@example.com', 'APROBADO'],
];
const sent = [];
const patches = [];
const cache = new Map();
const sheet = {
  getLastRow: () => rows.length,
  getRange: (row, col, height, width) => ({
    getValues: () => rows.slice(row - 1, row - 1 + height).map(item => item.slice(col - 1, col - 1 + width)),
    setValue: value => { rows[row - 1][col - 1] = value; },
  }),
};
const context = {
  SpreadsheetApp: {getActiveSpreadsheet: () => ({getSheetByName: () => sheet})},
  Utilities: {
    DigestAlgorithm: {SHA_256: 'SHA_256'},
    computeDigest: (_algorithm, value) => [...crypto.createHash('sha256').update(value).digest()],
    base64EncodeWebSafe: bytes => Buffer.from(bytes).toString('base64url'),
  },
  CacheService: {getScriptCache: () => ({get: key => cache.get(key), put: (key, value) => cache.set(key, value)})},
  UrlFetchApp: {fetch: () => ({getResponseCode: () => 200, getContentText: () => JSON.stringify({oobLink: 'https://example.com/email-link?code=abc'})})},
  ScriptApp: {getOAuthToken: () => 'test-token'},
  MailApp: {sendEmail: message => sent.push(message)},
  PropertiesService: {getScriptProperties: () => ({getProperty: () => 'test-public-key'})},
  firestoreUrl_: route => 'https://firestore.example/' + route,
  googleFetch_: (url, options) => {patches.push({url, options});return {};},
  HtmlService: {},
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'integrations', 'google-apps-script', 'EmailGateway.gs'), 'utf8'), context);

assert.equal(context.championApprovedRow_('owner@example.com'), 2);
assert.equal(context.championApprovedRow_('blocked@example.com'), 0);
assert.equal(context.championApprovedRow_('duplicate@example.com'), 0);
assert.equal(context.championApprovedRow_('missing@example.com'), 0);
context.requestPortalLink({email: 'owner@example.com', language: 'es'});
context.requestPortalLink({email: 'owner@example.com', language: 'es'});
context.requestPortalLink({email: 'blocked@example.com', language: 'es'});
context.requestPortalLink({email: 'duplicate@example.com', language: 'es'});
assert.equal(sent.length, 1);
assert.equal(sent[0].to, 'owner@example.com');
assert.match(sent[0].htmlBody, /Tu biblioteca Champion te espera/);
rows[1][1] = 'DENEGADO';
assert.equal(context.championApprovedRow_('owner@example.com'), 0);
context.championLookupUser_ = () => ({uid: 'owner-uid', email: 'owner@example.com'});
assert.equal(context.confirmPortalSession({idToken: 'x'.repeat(120)}).approved, false);
assert.match(patches.at(-1).options.payload, /"suspended"/);
console.log('email-gateway-ok');
