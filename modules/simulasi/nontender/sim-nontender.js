(function () {
  const MODULE_BASE = 'modules/simulasi/nontender/pages/';
  const PAGE_MAP = {
    'login.html': 'login.html',
    'home.html': 'home.html',
    'pencatatannontender.html': 'pencatatannontender.html',
    'rencanapencatatan.html': 'rencanapencatatan.html',
    'editpaket.html': 'editpaket.html',
    'editpaketpencatatan.html': 'editpaketpencatatan.html',
    'formrealisasi.html': 'formrealisasi.html',
    'penyedianonsikap.html': 'penyedianonsikap.html',
    'index.html': 'login.html'
  };

  let hostElement = null;
  let shadowRootRef = null;
  let appInstalled = false;
  let destroyed = false;
  let currentPageName = 'login.html';
  let currentSearch = '';
  let cssText = '';
  let appText = '';
  let navToken = 0;
  let appExportNames = [];

  function normalizePageName(input) {
    const raw = String(input || '').trim() || 'login.html';
    const clean = raw.split('#')[0].split('?')[0].split('/').pop() || 'login.html';
    return PAGE_MAP[clean] || 'login.html';
  }

  function getSearchFromUrl(input) {
    const raw = String(input || '').trim();
    const qIndex = raw.indexOf('?');
    if (qIndex < 0) return '';
    const hashIndex = raw.indexOf('#', qIndex);
    return hashIndex >= 0 ? raw.slice(qIndex, hashIndex) : raw.slice(qIndex);
  }

  function resolveAsset(path) {
    return MODULE_BASE + path;
  }

  async function fetchText(path) {
    const response = await fetch(path + (path.includes('?') ? '&' : '?') + 'v=' + Date.now(), {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Gagal memuat file ' + path + ' HTTP ' + response.status);
    }

    return response.text();
  }

  function makeDocumentProxy(shadowRoot) {
    const proxy = Object.create(document);

    proxy.getElementById = function (id) {
      return shadowRoot.getElementById(id);
    };

    proxy.querySelector = function (selector) {
      return shadowRoot.querySelector(selector);
    };

    proxy.querySelectorAll = function (selector) {
      return shadowRoot.querySelectorAll(selector);
    };

    proxy.createElement = function (tagName, options) {
      return document.createElement(tagName, options);
    };

    proxy.createTextNode = function (text) {
      return document.createTextNode(text);
    };

    proxy.addEventListener = function () {
      return document.addEventListener.apply(document, arguments);
    };

    proxy.removeEventListener = function () {
      return document.removeEventListener.apply(document, arguments);
    };

    Object.defineProperty(proxy, 'body', {
      get() {
        return shadowRoot.querySelector('[data-spse-page-root]') || hostElement;
      }
    });

    return proxy;
  }

  function makeLocationProxy() {
    return {
      get href() {
        return currentPageName + currentSearch;
      },
      set href(value) {
        navigate(value);
      },
      get search() {
        return currentSearch || '';
      },
      set search(value) {
        currentSearch = String(value || '');
      },
      get pathname() {
        return '/' + currentPageName;
      },
      assign(value) {
        navigate(value);
      },
      replace(value) {
        navigate(value);
      },
      reload() {
        navigate(currentPageName + currentSearch);
      }
    };
  }

  function exposeAppFunctions(code) {
    const names = [];
    const regex = /function\s+([A-Za-z_$][\w$]*)\s*\(/g;
    let match;

    while ((match = regex.exec(code))) {
      if (!names.includes(match[1])) {
        names.push(match[1]);
      }
    }

    appExportNames = names;

    const exportNames = names.length
      ? `Object.assign(window, { ${names.join(', ')} });`
      : '';

    return `
;window.APP_CONFIG = APP_CONFIG;
window.METHOD_MAP = METHOD_MAP;
window.STORAGE_KEYS = STORAGE_KEYS;
${exportNames}
`;
  }

  function patchScriptNavigation(code) {
    return String(code || '')
      .replace(/window\.location\.href\s*=\s*([^;]+);/g, 'window.__spseNavigate($1);')
      .replace(/location\.href\s*=\s*([^;]+);/g, 'window.__spseNavigate($1);');
  }

  function patchAppCode(code) {
    return String(code || '')
      .replace(/location\.href\s*=\s*'login\.html';/g, "window.__spseNavigate('login.html');")
      .replace(/location\.href\s*=\s*"login\.html";/g, "window.__spseNavigate('login.html');");
  }

  function executeScript(code, label) {
    if (destroyed) return;

    const documentProxy = makeDocumentProxy(shadowRootRef);
    const locationProxy = makeLocationProxy();
    const patched = patchScriptNavigation(code);

    const safeNames = (appExportNames || []).filter((name) => {
      return /^[A-Za-z_$][\w$]*$/.test(name);
    });

    const bridge = safeNames
      .map((name) => `const ${name} = window.${name};`)
      .join('\n');

    const bridgeConfig = `
const APP_CONFIG = window.APP_CONFIG;
const METHOD_MAP = window.METHOD_MAP;
const STORAGE_KEYS = window.STORAGE_KEYS;
`;

    try {
      const runner = new Function(
        'window',
        'document',
        'location',
        'localStorage',
        'sessionStorage',
        'Papa',
        bridgeConfig + '\n' + bridge + '\n' + patched + '\n//# sourceURL=spse-module-' + label + '.js'
      );

      runner(
        window,
        documentProxy,
        locationProxy,
        window.localStorage,
        window.sessionStorage,
        window.Papa
      );
    } catch (error) {
      console.error('Gagal menjalankan script SPSE module:', label, error);
      renderModuleError(error);
    }
  }

  function installBaseApp() {
    if (appInstalled) return;

    const documentProxy = makeDocumentProxy(shadowRootRef);
    const locationProxy = makeLocationProxy();
    const patchedApp = patchAppCode(appText);
    const exportBlock = exposeAppFunctions(patchedApp);

    try {
      const runner = new Function(
        'window',
        'document',
        'location',
        'localStorage',
        'sessionStorage',
        'Papa',
        patchedApp + exportBlock + '\n//# sourceURL=spse-module-app.js'
      );

      runner(
        window,
        documentProxy,
        locationProxy,
        window.localStorage,
        window.sessionStorage,
        window.Papa
      );

      appInstalled = true;
    } catch (error) {
      console.error('Gagal memasang app SPSE module:', error);
      renderModuleError(error);
    }
  }

  function extractPageParts(rawHtml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');
    const scripts = [];

    doc.querySelectorAll('script').forEach((script) => {
      if (!script.src && script.textContent.trim()) {
        scripts.push(script.textContent);
      }

      script.remove();
    });

    doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      link.remove();
    });

    return {
      body: doc.body ? doc.body.innerHTML : rawHtml,
      scripts
    };
  }

  function installLinkInterceptor() {
    shadowRootRef.addEventListener('click', function (event) {
      const target = event.target && event.target.closest
        ? event.target.closest('a[href]')
        : null;

      if (!target) return;

      const href = target.getAttribute('href') || '';

      if (!href || href === '#') {
        return;
      }

      if (/\.html(\?|#|$)/i.test(href)) {
        event.preventDefault();
        navigate(href);
      }
    });
  }

  function renderShell() {
    shadowRootRef.innerHTML = `
      <style>
        :host{
          display:block;
          width:100%;
        }

        ${cssText}

        .spse-module-native-root{
          width:100%;
          max-width:none;
          margin:0;
          padding:0;
          background:#efefef;
          color:#222;
          min-height:calc(100vh - 30px);
        }

        .spse-module-native-root .topbar-inner,
        .spse-module-native-root .nav,
        .spse-module-native-root .system-bar,
        .spse-module-native-root .menu-tabs,
        .spse-module-native-root .content-block,
        .spse-module-native-root .edit-block,
        .spse-module-native-root .panel,
        .spse-module-native-root .strip,
        .spse-module-native-root .hero-area{
          width:100% !important;
          max-width:none !important;
          margin-left:0 !important;
          margin-right:0 !important;
        }

        .spse-module-native-root .content-block,
        .spse-module-native-root .edit-block,
        .spse-module-native-root .panel{
          border-radius:18px;
          box-shadow:0 18px 40px rgba(15,23,42,.08);
        }

        .spse-module-native-root .topbar{
          border-radius:22px 22px 0 0;
          overflow:hidden;
        }

        .spse-module-error{
          padding:18px;
          border-radius:22px;
          background:#fff;
          border:1px solid #fecaca;
          color:#991b1b;
          box-shadow:0 14px 30px rgba(15,23,42,.08);
          font-weight:800;
        }
      </style>

      <div class="spse-module-native-root" data-spse-page-root>
        <div style="min-height:180px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#123a72;">
          Memuat halaman...
        </div>
      </div>
    `;
  }

  function renderModuleError(error) {
    if (!shadowRootRef) return;

    const root = shadowRootRef.querySelector('[data-spse-page-root]');
    if (!root) return;

    root.innerHTML = `
      <div class="spse-module-error">
        Gagal memuat Simulasi Pencatatan Non Tender.<br>
        <span style="font-weight:600;">${String(error && error.message ? error.message : error)}</span>
      </div>
    `;
  }

  async function renderPage(pageName, search) {
    const token = ++navToken;
    const cleanPage = normalizePageName(pageName);

    currentPageName = cleanPage;
    currentSearch = search || '';
    window.__spseCurrentSearch = currentSearch;

    const root = shadowRootRef.querySelector('[data-spse-page-root]');
    if (!root) return;

    root.innerHTML = `
      <div style="min-height:180px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#123a72;">
        Memuat ${cleanPage}...
      </div>
    `;

    try {
      const rawHtml = await fetchText(resolveAsset(cleanPage));

      if (destroyed || token !== navToken) {
        return;
      }

      const parts = extractPageParts(rawHtml);
      root.innerHTML = parts.body;

      installBaseApp();

      parts.scripts.forEach((scriptText, index) => {
        if (!destroyed && token === navToken) {
          executeScript(scriptText, cleanPage.replace(/\.html$/i, '') + '-' + index);
        }
      });
    } catch (error) {
      console.error(error);
      renderModuleError(error);
    }
  }

  function navigate(rawUrl) {
    if (destroyed) return;

    const target = String(rawUrl || '').trim() || 'login.html';
    const pageName = normalizePageName(target);
    const search = getSearchFromUrl(target);

    renderPage(pageName, search);
  }

  async function preloadAssets() {
    const loaded = await Promise.all([
      fetchText(resolveAsset('style.css')),
      fetchText(resolveAsset('app.js'))
    ]);

    cssText = loaded[0];
    appText = loaded[1];
  }

  window.__moduleInit = function ({ container }) {
    destroyed = false;
    appInstalled = false;
    appExportNames = [];

    hostElement = container.querySelector('[data-spse-native-host]') || container;

    if (!hostElement.shadowRoot) {
      shadowRootRef = hostElement.attachShadow({ mode: 'open' });
    } else {
      shadowRootRef = hostElement.shadowRoot;
    }

    window.__spseNavigate = navigate;

    preloadAssets()
      .then(() => {
        if (destroyed) return;

        renderShell();
        installLinkInterceptor();

        const startPage = localStorage.getItem('spse_logged_in') === '1'
          ? 'home.html'
          : 'login.html';

        navigate(startPage);
      })
      .catch((error) => {
        console.error(error);
        renderShell();
        renderModuleError(error);
      });

    return function destroy() {
      destroyed = true;
      navToken += 1;

      if (window.__spseNavigate === navigate) {
        try {
          delete window.__spseNavigate;
        } catch (error) {
          window.__spseNavigate = undefined;
        }
      }
    };
  };
})();