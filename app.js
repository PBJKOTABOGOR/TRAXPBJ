const APP_ROUTES = {
  dashboard: {
    title: 'Dashboard TRAXPBJ',
    subtitle: 'Ringkasan informasi utama untuk monitoring dan analisis pengadaan.',
    type: 'internal'
  },

  'monitoring-perencanaan': {
    title: 'Monitoring Perencanaan',
    subtitle: 'Pemantauan progres perencanaan pengadaan perangkat daerah.',
    type: 'module',
    html: 'modules/monitoring/perencanaan/monitoring.html',
    css: 'modules/monitoring/perencanaan/monitoring.css',
    js: 'modules/monitoring/perencanaan/monitoring.js',
    externalScripts: [
      'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js'
    ]
  },

  'monitoring-konsolidasi': {
    title: 'Monitoring Paket Konsolidasi',
    subtitle: 'Halaman ini disiapkan untuk monitoring paket konsolidasi.',
    type: 'placeholder'
  },

  'monitoring-sirup': {
    title: 'Monitoring SiRUP',
    subtitle: 'Monitoring paket perencanaan yang diumumkan di SIRUP dan indikator ITKP SIRUP.',
    type: 'module',
    html: 'modules/monitoring/itkp-sirup/itkp-sirup.html',
    css: 'modules/monitoring/itkp-sirup/itkp-sirup.css',
    js: 'modules/monitoring/itkp-sirup/itkp-sirup.js'
  },

  'monitoring-ekatalog': {
    title: 'Monitoring eKatalog',
    subtitle: 'Halaman ini disiapkan untuk monitoring indikator pemanfaatan eKatalog.',
    type: 'placeholder'
  },

  'monitoring-etendering': {
    title: 'Monitoring eTendering',
    subtitle: 'Halaman ini disiapkan untuk monitoring indikator pemanfaatan eTendering.',
    type: 'placeholder'
  },

  'monitoring-nontender': {
    title: 'Monitoring Non Tender',
    subtitle: 'Halaman ini disiapkan untuk monitoring Non eTendering/Non ePurchasing.',
    type: 'placeholder'
  },

  'monitoring-ekontrak': {
    title: 'Monitoring eKontrak',
    subtitle: 'Halaman ini disiapkan untuk monitoring indikator pemanfaatan eKontrak.',
    type: 'placeholder'
  },

  'rapor-pbj': {
    title: 'Rapor PBJ',
    subtitle: 'Portal laporan Rapor PBJ perangkat daerah.',
    type: 'iframe',
    url: 'https://pbjkotabogor.github.io/raporpbj/'
  },

  'simulasi-timeline': {
    title: 'Simulasi Timeline Pengadaan',
    subtitle: 'Simulasi penyusunan timeline pengadaan barang dan jasa.',
    type: 'module',
    html: 'modules/timeline/simulasi-timeline.html',
    css: 'modules/timeline/simulasi-timeline.css',
    js: 'modules/timeline/simulasi-timeline.js'
  },

  'simulasi-nontender': {
    title: 'Pencatatan Non Tender',
    subtitle: 'Simulasi PPK untuk pencatatan paket non tender.',
    type: 'iframe',
    url: 'https://pbjkotabogor.github.io/SIMPPK/login.html'
  }
};

const contentArea = document.getElementById('contentArea');
const sidebar = document.getElementById('sidebar');
const sidebarToggleButton = document.getElementById('sidebarToggleButton');

let activeModuleToken = 0;
let currentModuleDestroy = null;
let activeFlyout = null;

function renderDashboard() {
  contentArea.innerHTML = `
    <section class="premium-hero">
      <div class="premium-hero-content">
        <div class="hero-kicker">
          <span class="kicker-dot"></span>
          TRAXPBJ • Monitoring & Analisis Pengadaan
        </div>

        <h3>Selamat datang di TRAXPBJ</h3>

        <p>
          Portal pemantauan pengadaan barang/jasa Kota Bogor untuk melihat indikator ITKP,
          progres perencanaan, realisasi paket, konsolidasi, simulasi, dan Rapor PBJ.
        </p>

        <div class="premium-stats-grid">
          <div class="premium-stat-card">
            <div class="label">Skor ITKP</div>
            <div class="value">86,42%</div>
            <div class="desc">Indikator pemanfaatan sistem pengadaan</div>
          </div>

          <div class="premium-stat-card">
            <div class="label">Konsolidasi</div>
            <div class="value">128</div>
            <div class="desc">Paket terindikasi / termonitor konsolidasi</div>
          </div>

          <div class="premium-stat-card">
            <div class="label">Paket Belum Berjalan</div>
            <div class="value">6.666</div>
            <div class="desc">Berdasarkan progres monitoring perencanaan</div>
          </div>

          <div class="premium-stat-card">
            <div class="label">Rapor PBJ</div>
            <div class="value">44</div>
            <div class="desc">Laporan rapor perangkat daerah tersedia</div>
          </div>
        </div>
      </div>
    </section>

    <section class="premium-section">
      <div class="premium-section-head">
        <div>
          <h3>Profil Pengadaan Barang/Jasa Kota Bogor</h3>
          <p>Ringkasan cepat performa indikator dan paket pengadaan.</p>
        </div>
      </div>

      <div class="premium-profile-grid">
        <div class="premium-card profile-main-card">
          <div class="mini-label">Skor ITKP</div>
          <div class="premium-big-number">86,42%</div>

          <div class="premium-progress-track">
            <div class="premium-progress-bar" style="width:86.42%"></div>
          </div>

          <div class="premium-dimensions dimensions">
            ${renderDimension('SIRUP', 92.10)}
            ${renderDimension('eKatalog', 84.33)}
            ${renderDimension('eTendering', 83.21)}
            ${renderDimension('eKontrak', 79.45)}
            ${renderDimension('Non Tender', 88.60)}
          </div>
        </div>

        <div class="premium-card">
          <div class="premium-card-title-row">
            <div>
              <div class="mini-label">Paket Belum Berjalan</div>
              <h4>per Metode Pengadaan</h4>
            </div>
          </div>

          <div class="premium-table-lite">
            <div class="premium-table-row premium-table-head">
              <div>Metode</div>
              <div>Jumlah</div>
            </div>
            <div class="premium-table-row"><div>Pengadaan Langsung</div><div>3.821</div></div>
            <div class="premium-table-row"><div>e-Purchasing</div><div>1.744</div></div>
            <div class="premium-table-row"><div>Tender</div><div>633</div></div>
            <div class="premium-table-row"><div>Seleksi</div><div>214</div></div>
            <div class="premium-table-row"><div>Lainnya</div><div>254</div></div>
          </div>
        </div>
      </div>
    </section>

    <section class="premium-section dashboard-itkp-embed-card">
      <div class="premium-section-head">
        <div>
          <h3>Dashboard ITKP Kota Bogor 2026</h3>
          <p>Visualisasi indikator pemanfaatan sistem pengadaan melalui Looker Studio.</p>
        </div>

        <a
          class="premium-open-link"
          href="https://datastudio.google.com/reporting/d940ac07-c54f-4ff8-af5e-36424698d5a2/page/ycoYF"
          target="_blank"
          rel="noopener noreferrer"
        >
          Buka Looker Studio
          <span>›</span>
        </a>
      </div>

      <div class="looker-frame-shell desktop-itkp-frame">
        <iframe
          src="https://datastudio.google.com/embed/reporting/d940ac07-c54f-4ff8-af5e-36424698d5a2/page/ycoYF"
          frameborder="0"
          allowfullscreen
          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox">
        </iframe>
      </div>
    </section>

    <section class="premium-grid-two">
      <div class="premium-section premium-section-flat">
        <div class="premium-section-head">
          <div>
            <h3>Aktivitas / Informasi</h3>
            <p>Informasi terbaru dari portal monitoring pengadaan.</p>
          </div>
        </div>

        <div class="activities premium-activities">
          ${renderActivity('#dc2626', '✓', 'Rapor PBJ Bulan April 2026 telah tersedia', 'Laporan rapor untuk perangkat daerah telah berhasil dibuat.', '2 jam lalu')}
          ${renderActivity('#b91c1c', '📊', 'Update Dashboard ITKP', 'Data monitoring ITKP diperbarui pada portal.', '3 jam lalu')}
          ${renderActivity('#ef4444', '📌', 'Monitoring Realisasi diperbarui', 'Sinkronisasi data realisasi paket berhasil dimuat.', '5 jam lalu')}
          ${renderActivity('#f97316', '🧾', 'Konsolidasi sedang disiapkan', 'Menu konsolidasi masih dalam proses pengembangan.', '1 hari lalu')}
          ${renderActivity('#0f766e', '📄', 'Rapor PBJ aktif', 'Portal rapor PBJ tetap dapat diakses.', '1 hari lalu')}
        </div>
      </div>

      <div class="premium-section premium-section-flat">
        <div class="premium-section-head">
          <div>
            <h3>Akses Cepat</h3>
            <p>Menu utama yang sering digunakan.</p>
          </div>
        </div>

        <div class="premium-quick-list">
          ${renderQuickCard('📊', 'linear-gradient(135deg,#b91c1c,#ef4444)', 'ITKP - SIRUP', 'Lihat monitoring indikator ITKP dari modul SIRUP.', 'monitoring-sirup')}
          ${renderQuickCard('📋', 'linear-gradient(135deg,#7f1d1d,#dc2626)', 'Monitoring Perencanaan', 'Pantau progres perencanaan pengadaan perangkat daerah.', 'monitoring-perencanaan')}
          ${renderQuickCard('🧾', 'linear-gradient(135deg,#991b1b,#f97316)', 'Rapor PBJ', 'Lihat dan unduh laporan rapor kinerja PBJ.', 'rapor-pbj')}
          ${renderQuickCard('🗓️', 'linear-gradient(135deg,#111827,#b91c1c)', 'Simulasi Timeline', 'Simulasikan jadwal pengadaan secara terstruktur.', 'simulasi-timeline')}
        </div>
      </div>
    </section>

    <div class="footer-note">© 2026 TRAXPBJ - Simulasi & Monitoring Pengadaan Barang/Jasa</div>
  `;

  contentArea.querySelectorAll('[data-quick]').forEach((item) => {
    item.addEventListener('click', () => loadPage(item.dataset.quick));
  });
}

function renderIframePage(page) {
  contentArea.innerHTML = `
    <section class="embed-card">
      <h3>${page.title}</h3>
      <div class="page-note">Halaman dimuat dari project/modul yang sudah ada.</div>
      <div class="embed-frame-wrap">
        <iframe
          class="embed-frame"
          src="${page.url}"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade">
        </iframe>
      </div>
    </section>
  `;
}

function renderPlaceholderPage(pageKey, page) {
  contentArea.innerHTML = `
    <section class="card">
      <h3>${page.title}</h3>
      <div class="placeholder-grid">
        <div class="placeholder-box">
          <h4>Modul belum dihubungkan</h4>
          <p>Halaman ini sudah disiapkan di portal utama. Nanti saat project GitHub/halaman monitoring selesai, tinggal isi URL atau module path di file <b>app.js</b>.</p>
        </div>
        <div class="placeholder-box">
          <h4>Langkah berikutnya</h4>
          <p>Cari route <b>${pageKey}</b> pada objek <b>APP_ROUTES</b>, lalu ubah <b>type</b> menjadi <b>iframe</b> atau <b>module</b>.</p>
        </div>
      </div>
    </section>
  `;
}

function renderDimension(name, value) {
  return `
    <div class="dim-row">
      <div>${name}</div>
      <div class="bar"><span style="width:${value}%"></span></div>
      <div>${value.toFixed(2).replace('.', ',')}%</div>
    </div>
  `;
}

function renderActivity(color, icon, title, text, time) {
  return `
    <div class="activity-item">
      <div class="activity-icon" style="background:${color}">${icon}</div>
      <div>
        <div class="activity-title">${title}</div>
        <div class="activity-text">${text}</div>
      </div>
      <div class="activity-time">${time}</div>
    </div>
  `;
}

function renderQuickCard(icon, bg, title, text, route) {
  return `
    <button class="quick-card" type="button" data-quick="${route}">
      <div class="quick-icon" style="background:${bg}">${icon}</div>
      <div>
        <div class="quick-title">${title}</div>
        <div class="quick-text">${text}</div>
      </div>
      <div class="quick-arrow">›</div>
    </button>
  `;
}

function updateActiveMenu(key) {
  document.querySelectorAll('.nav-link, .submenu-link').forEach((el) => {
    el.classList.remove('active');
  });

  const directButton = document.querySelector(`.nav-link[data-page="${key}"]`);
  const subButton = document.querySelector(`.submenu-link[data-page="${key}"]`);

  if (directButton) {
    directButton.classList.add('active');
  }

  if (subButton) {
    subButton.classList.add('active');
    const group = subButton.closest('.nav-group');
    if (group) group.classList.add('open');
  }
}

function closeFlyout() {
  if (activeFlyout) {
    activeFlyout.remove();
    activeFlyout = null;
  }
}

function cleanupDynamicModule() {
  closeFlyout();

  if (typeof currentModuleDestroy === 'function') {
    try {
      currentModuleDestroy();
    } catch (err) {
      console.error('Gagal destroy module lama:', err);
    }
  }

  currentModuleDestroy = null;
  window.__moduleInit = undefined;

  document.querySelectorAll('[data-dynamic-module-css]').forEach((el) => el.remove());
  document.querySelectorAll('[data-dynamic-module-js]').forEach((el) => el.remove());
}

function loadExternalScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-dynamic-external-script="true"][src="${src}"]`);

    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Gagal memuat ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.dynamicExternalScript = 'true';
    script.dataset.loaded = 'false';

    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };

    script.onerror = () => reject(new Error(`Gagal memuat ${src}`));
    document.body.appendChild(script);
  });
}

async function renderModulePage(page) {
  const token = ++activeModuleToken;
  cleanupDynamicModule();

  try {
    if (Array.isArray(page.externalScripts) && page.externalScripts.length) {
      for (const src of page.externalScripts) {
        await loadExternalScriptOnce(src);
      }
    }

    const response = await fetch(page.html, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} saat memuat ${page.html}`);
    }

    const rawHtml = await response.text();
    if (token !== activeModuleToken) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    const moduleContent = doc.body && doc.body.innerHTML.trim()
      ? doc.body.innerHTML
      : rawHtml;

    contentArea.innerHTML = `
      <section class="module-page module-page--native">
        ${moduleContent}
      </section>
    `;

    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (token !== activeModuleToken) return;

    if (page.css) {
      await new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${page.css}?v=${Date.now()}`;
        link.setAttribute('data-dynamic-module-css', 'true');

        link.onload = resolve;
        link.onerror = () => reject(new Error(`Gagal memuat CSS ${page.css}`));

        document.head.appendChild(link);
      });
    }

    if (token !== activeModuleToken) return;

    if (page.js) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${page.js}?v=${Date.now()}`;
        script.defer = true;
        script.setAttribute('data-dynamic-module-js', 'true');

        script.onload = resolve;
        script.onerror = () => reject(new Error(`Gagal memuat JS ${page.js}`));

        document.body.appendChild(script);
      });
    }

    if (token !== activeModuleToken) return;

    if (typeof window.__moduleInit === 'function') {
      const destroyFn = window.__moduleInit({
        container: contentArea,
        route: page
      });

      currentModuleDestroy = typeof destroyFn === 'function' ? destroyFn : null;
    } else {
      currentModuleDestroy = null;
    }
  } catch (error) {
    console.error('Gagal memuat module:', error);
    contentArea.innerHTML = `
      <section class="card">
        <h3>Gagal memuat modul</h3>
        <p>File modul tidak bisa dimuat. Cek path HTML, CSS, JS, atau inisialisasi modul.</p>
        <p><b>Detail:</b> ${error.message}</p>
      </section>
    `;
  }
}

async function loadPage(key) {
  const page = APP_ROUTES[key] || APP_ROUTES.dashboard;
  updateActiveMenu(key);

  if (page.type !== 'module') {
    cleanupDynamicModule();
    contentArea.classList.remove('module-mode');
  } else {
    contentArea.classList.add('module-mode');
  }

  if (page.type === 'iframe') {
    renderIframePage(page);
  } else if (page.type === 'module') {
    await renderModulePage(page);
  } else if (page.type === 'placeholder') {
    renderPlaceholderPage(key, page);
  } else {
    renderDashboard();
  }

  if (window.innerWidth <= 980 && sidebar) {
    sidebar.classList.remove('mobile-open');
  }
}

function bindMenu() {
  document.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => loadPage(button.dataset.page));
  });

  document.querySelectorAll('[data-toggle-group]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const groupName = button.dataset.toggleGroup;
      const group = document.querySelector(`.nav-group[data-group="${groupName}"]`);
      if (!group) return;

      if (sidebar && sidebar.classList.contains('collapsed') && window.innerWidth > 980) {
        event.preventDefault();
        toggleFlyout(button, groupName);
        return;
      }

      group.classList.toggle('open');
    });
  });

  if (sidebarToggleButton && sidebar) {
    sidebarToggleButton.addEventListener('click', () => {
      if (window.innerWidth <= 980) {
        sidebar.classList.toggle('mobile-open');
      } else {
        sidebar.classList.toggle('collapsed');
        closeFlyout();
      }
    });
  }

  document.addEventListener('click', (event) => {
    if (!activeFlyout) return;

    const clickedInsideFlyout = activeFlyout.contains(event.target);
    const clickedToggle = event.target.closest('[data-toggle-group]');
    if (!clickedInsideFlyout && !clickedToggle) {
      closeFlyout();
    }
  });

  window.addEventListener('resize', () => {
    closeFlyout();

    if (window.innerWidth > 980 && sidebar) {
      sidebar.classList.remove('mobile-open');
    }
  });
}

function toggleFlyout(toggleButton, groupName) {
  if (!toggleButton) return;

  if (activeFlyout && activeFlyout.dataset.group === groupName) {
    closeFlyout();
    return;
  }

  closeFlyout();

  const group = document.querySelector(`.nav-group[data-group="${groupName}"]`);
  if (!group) return;

  const submenuLinks = group.querySelectorAll('.submenu-link');
  if (!submenuLinks.length) return;

  const flyout = document.createElement('div');
  flyout.className = 'sidebar-flyout';
  flyout.dataset.group = groupName;

  const titleMap = {
    monitoring: 'Monitoring',
    simulasi: 'Simulasi'
  };

  flyout.innerHTML = `
    <div class="sidebar-flyout-title">${titleMap[groupName] || 'Menu'}</div>
    ${Array.from(submenuLinks).map((link) => {
      const isActive = link.classList.contains('active') ? ' active' : '';
      return `
        <button class="flyout-link${isActive}" type="button" data-page="${link.dataset.page}">
          ${link.textContent}
        </button>
      `;
    }).join('')}
  `;

  document.body.appendChild(flyout);

  const rect = toggleButton.getBoundingClientRect();
  flyout.style.top = `${rect.top}px`;
  flyout.style.left = `${rect.right + 12}px`;

  flyout.querySelectorAll('[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeFlyout();
      loadPage(btn.dataset.page);
    });
  });

  activeFlyout = flyout;
}

bindMenu();
loadPage('dashboard');
