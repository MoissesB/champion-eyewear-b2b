(() => {
  const pixelId = '1470645117637084';
  if (['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) || location.protocol === 'file:') return;
  if (window.__championMetaPixelId === pixelId) return;
  window.__championMetaPixelId = pixelId;
  if (!window.fbq) {
    !function (win, doc, tag, url, fbq, script, first) {
      if (win.fbq) return;
      fbq = win.fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
      if (!win._fbq) win._fbq = fbq;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = '2.0';
      fbq.queue = [];
      script = doc.createElement(tag);
      script.async = true;
      script.src = url;
      first = doc.getElementsByTagName(tag)[0];
      first.parentNode.insertBefore(script, first);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  }
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
})();
