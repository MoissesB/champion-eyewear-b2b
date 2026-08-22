(function () {
  'use strict';

  // Convenience-only review link. This is intentionally not strong
  // authentication: possession of the link grants the review session.
  const ENTRY_PARAM = 'champion_review';
  const EXIT_PARAM = 'champion_review_exit';
  const SESSION_KEY = 'champion-review-session-v1';
  const EXPECTED_FINGERPRINT = 'bc2eb01951c4eb88';

  function fingerprint(value) {
    let hash = 0xcbf29ce484222325n;
    const bytes = new TextEncoder().encode(String(value || ''));
    bytes.forEach((byte) => {
      hash ^= BigInt(byte);
      hash = BigInt.asUintN(64, hash * 0x100000001b3n);
    });
    return hash.toString(16).padStart(16, '0');
  }

  function readSession() {
    try { return sessionStorage.getItem(SESSION_KEY) === 'active'; } catch (_error) { return false; }
  }

  function writeSession(active) {
    try {
      if (active) sessionStorage.setItem(SESSION_KEY, 'active');
      else sessionStorage.removeItem(SESSION_KEY);
    } catch (_error) { /* The current page still receives the selected mode. */ }
  }

  function setNoIndex() {
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.content = 'noindex, nofollow, noarchive';

    let referrer = document.querySelector('meta[name="referrer"]');
    if (!referrer) {
      referrer = document.createElement('meta');
      referrer.name = 'referrer';
      document.head.appendChild(referrer);
    }
    referrer.content = 'no-referrer';
  }

  const url = new URL(window.location.href);
  let active = readSession();
  let cleanUrl = false;

  if (url.searchParams.has(EXIT_PARAM)) {
    active = false;
    writeSession(false);
    url.searchParams.delete(EXIT_PARAM);
    cleanUrl = true;
  } else if (url.searchParams.has(ENTRY_PARAM)) {
    const candidate = url.searchParams.get(ENTRY_PARAM);
    if (fingerprint(candidate) === EXPECTED_FINGERPRINT) {
      active = true;
      writeSession(true);
    }
    url.searchParams.delete(ENTRY_PARAM);
    cleanUrl = true;
  }

  if (active) {
    document.documentElement.setAttribute('data-champion-review', '');
    setNoIndex();
  }

  if (cleanUrl && window.history?.replaceState) {
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }

  window.ChampionReview = {
    isActive: () => active,
    exitUrl: () => `${window.location.origin}/?${EXIT_PARAM}=1`,
  };
})();
