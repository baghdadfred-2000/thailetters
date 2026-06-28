/* ============================================================
   ThaiLetters.com — cookie consent
   - Injects a consent banner (first visit) and a settings modal.
   - Stores the choice in localStorage so it isn't asked repeatedly.
   - Any element with [data-cookie-settings] re-opens the modal.
   - Exposes window.ThaiLettersConsent { get(), open(), onChange(fn) }.

   Wiring real ad/analytics scripts: read ThaiLettersConsent.get() and only
   load Google AdSense / analytics when the relevant flag is true. A
   simple hook is provided via the 'thailetters:consent' window event.
   ============================================================ */
(function () {
  "use strict";

  var KEY = "thailetters-consent-v1";
  var listeners = [];

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function write(prefs) {
    prefs.ts = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {}
    listeners.forEach(function (fn) { try { fn(prefs); } catch (e) {} });
    try {
      window.dispatchEvent(new CustomEvent("thailetters:consent", { detail: prefs }));
    } catch (e) {}
  }

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  }

  // ---- Banner ----
  function buildBanner() {
    var b = el("div", { "class": "cc-banner", role: "dialog", "aria-label": "Cookie consent", "aria-live": "polite" });
    b.innerHTML =
      '<h2>We value your privacy</h2>' +
      '<p>We use essential cookies to run this site and, with your consent, advertising (Google AdSense) and analytics cookies to support our free service. ' +
      'See our <a href="cookie-policy.html">Cookie Policy</a> and <a href="privacy.html">Privacy Policy</a>.</p>' +
      '<div class="cc-actions">' +
        '<button type="button" class="cc-btn primary" data-cc="accept">Accept all</button>' +
        '<button type="button" class="cc-btn" data-cc="reject">Reject non-essential</button>' +
        '<button type="button" class="cc-btn" data-cc="customize">Customize</button>' +
      '</div>';
    return b;
  }

  // ---- Modal ----
  function buildModal() {
    var m = el("div", { "class": "cc-modal", role: "dialog", "aria-modal": "true", "aria-label": "Cookie settings" });
    m.innerHTML =
      '<div class="cc-modal-card">' +
        '<h2>Cookie settings</h2>' +
        '<p>Choose which cookies we may use. Essential cookies are always on because the site cannot work without them. You can change this anytime via "Cookie settings" in the footer.</p>' +
        '<div class="cc-cat">' +
          '<div class="cc-cat-text"><strong>Essential</strong><span>Required for the site to function and to remember this choice. Always on.</span></div>' +
          '<label class="cc-switch"><input type="checkbox" checked disabled aria-label="Essential cookies (always on)"><span class="cc-track"></span></label>' +
        '</div>' +
        '<div class="cc-cat">' +
          '<div class="cc-cat-text"><strong>Advertising</strong><span>Google AdSense cookies used to show and measure ads that keep the site free.</span></div>' +
          '<label class="cc-switch"><input type="checkbox" data-cc-cat="advertising" aria-label="Advertising cookies"><span class="cc-track"></span></label>' +
        '</div>' +
        '<div class="cc-cat">' +
          '<div class="cc-cat-text"><strong>Analytics</strong><span>Anonymous, aggregated usage statistics to help us improve the trainer.</span></div>' +
          '<label class="cc-switch"><input type="checkbox" data-cc-cat="analytics" aria-label="Analytics cookies"><span class="cc-track"></span></label>' +
        '</div>' +
        '<div class="cc-modal-actions">' +
          '<button type="button" class="cc-btn" data-cc="reject">Reject non-essential</button>' +
          '<button type="button" class="cc-btn" data-cc="save">Save preferences</button>' +
          '<button type="button" class="cc-btn primary" data-cc="accept">Accept all</button>' +
        '</div>' +
      '</div>';
    return m;
  }

  var bannerEl = null, modalEl = null;

  function showBanner() { if (bannerEl) bannerEl.style.display = "block"; }
  function hideBanner() { if (bannerEl) bannerEl.style.display = "none"; }

  function openModal() {
    var prefs = read() || { advertising: false, analytics: false };
    modalEl.querySelectorAll("[data-cc-cat]").forEach(function (input) {
      input.checked = !!prefs[input.getAttribute("data-cc-cat")];
    });
    modalEl.classList.add("open");
    var first = modalEl.querySelector("[data-cc-cat]");
    if (first) first.focus();
  }
  function closeModal() { modalEl.classList.remove("open"); }

  function applyAndStore(prefs) {
    write({ essential: true, advertising: !!prefs.advertising, analytics: !!prefs.analytics });
    hideBanner();
    closeModal();
  }

  function handleAction(action) {
    if (action === "accept") {
      applyAndStore({ advertising: true, analytics: true });
    } else if (action === "reject") {
      applyAndStore({ advertising: false, analytics: false });
    } else if (action === "customize") {
      openModal();
    } else if (action === "save") {
      var prefs = {};
      modalEl.querySelectorAll("[data-cc-cat]").forEach(function (input) {
        prefs[input.getAttribute("data-cc-cat")] = input.checked;
      });
      applyAndStore(prefs);
    }
  }

  function init() {
    bannerEl = buildBanner();
    modalEl = buildModal();
    document.body.appendChild(bannerEl);
    document.body.appendChild(modalEl);

    [bannerEl, modalEl].forEach(function (root) {
      root.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-cc]");
        if (btn) { handleAction(btn.getAttribute("data-cc")); return; }
        if (e.target === modalEl) closeModal(); // click backdrop to close
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modalEl.classList.contains("open")) closeModal();
    });

    // footer "Cookie settings" triggers (works on every page)
    document.querySelectorAll("[data-cookie-settings]").forEach(function (t) {
      t.addEventListener("click", function (e) { e.preventDefault(); openModal(); });
    });

    if (!read()) showBanner(); else hideBanner();
  }

  // public API
  window.ThaiLettersConsent = {
    get: function () { return read() || { essential: true, advertising: false, analytics: false }; },
    open: openModal,
    onChange: function (fn) { if (typeof fn === "function") listeners.push(fn); }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
