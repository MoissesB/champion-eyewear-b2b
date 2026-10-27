const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'product.html'), 'utf8');
const locator = `    <section class="optics-locator-section" id="findOptics" aria-labelledby="opticsLocatorTitle">
      <div class="container optics-locator-inner">
        <div><span class="eyebrow" data-optics-kicker>Para ti</span><h2 id="opticsLocatorTitle" data-optics-title>Busca una óptica cerca de ti</h2><p data-optics-intro>Elige tu país y ciudad para buscar ópticas en Google Maps.</p></div>
        <div class="optics-locator-controls">
          <label for="opticsCountry" data-optics-country-label>País o territorio</label>
          <select id="opticsCountry" autocomplete="country-name"><option value="">Selecciona tu país</option></select>
          <label for="opticsCity" data-optics-city-label>Ciudad o zona</label>
          <input id="opticsCity" type="text" autocomplete="address-level2" placeholder="Escribe tu ciudad">
          <a class="button button-primary" id="opticsMapLink" href="#findOptics" target="_blank" rel="noopener noreferrer">Buscar ópticas en Google Maps</a>
          <p class="optics-search-status" id="opticsSearchStatus" role="status" aria-live="polite"></p>
          <p class="optics-locator-note" data-optics-note>La búsqueda muestra ópticas generales. No confirma disponibilidad Champion.</p>
        </div>
      </div>
    </section>`;

const result = source
  .replace('<html lang="es-419">', '<html lang="es-419" data-champion-route-profile="b2c">')
  .replace('<body data-page="product">', '<body data-page="product" data-audience="b2c">')
  .replace('<title>Producto Champion Eyewear</title>', '<title>Explora un modelo Champion Eyewear</title>')
  .replace('INNOVA EYEWEAR · Catálogo profesional para ópticas, cadenas y distribuidores', 'CHAMPION EYEWEAR · Explora modelos y descubre dónde buscarlos')
  .replace(/Catálogo profesional distribuido por Innova Eyewear\./g, 'Modelos Champion para tu estilo.')
  .replace('Antes de enviar el pedido', 'Información útil')
  .replace('Resuelva aquí sus preguntas', 'Preguntas sobre tus monturas Champion')
  .replace('Compra mínima, proceso de revisión, garantía, cobertura, despacho y condiciones comerciales en un solo lugar.', 'Explora el catálogo y consulta a una óptica por el modelo y color que te interesa.')
  .replace('<strong data-i18n="footerConditions">Condiciones del pedido</strong>', '<strong>Dónde buscar Champion</strong>')
  .replace('<span data-i18n="footerMinimum">Pedido inicial mínimo: 24 piezas</span>', '<span>Busca ópticas en tu país y ciudad</span>')
  .replace('<span data-i18n="footerMix">Combine modelos, colores y cantidades</span>', '<span>Confirma con la óptica la disponibilidad del modelo</span>')
  .replace(/<a href="https:\/\/wa\.me\/17542360600"[^>]*>WhatsApp Innova<\/a>/, '')
  .replace('<a href="mailto:sales@innova-eyewear.com">sales@innova-eyewear.com</a>', '<span>Pregunta en una óptica cercana por Champion.</span>')
  .replace(/\s*<script defer src="\.\/assets\/request-loader\.min\.js[^\"]*"><\/script>/, '')
  .replace(/\s*<button type="button" data-request-open><span data-i18n="requestShort">[\s\S]*?<\/button>/, '')
  .replace(/    <section class="product-contact-section"[\s\S]*?    <\/section>/, locator)
  .replace(/\s*<div id="requestPortal"><\/div>/, '')
  .replace(/\s*<div id="interestPortal"><\/div>/, '')
  .replace(/(<script defer src="\.\/assets\/product\.min\.js[^\"]*"><\/script>)/, '$1\n  <script defer src="./assets/optics-locator.min.js?v=optics-20261027-6"></script>');

if (!result.includes('id="findOptics"') || result.includes('id="productContact"') || result.includes('data-request-open>')) {
  throw new Error('La ficha personal no quedó separada del pedido profesional.');
}
fs.writeFileSync(path.join(root, 'product-consumer.html'), result, 'utf8');
console.log('consumer-product-ok (ficha personal independiente)');
