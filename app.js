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
    js: 'modules/monitoring/perencanaan/monitoring.js'
  },
  'monitoring-konsolidasi': {
    title: 'Monitoring Paket Konsolidasi',
    subtitle: 'Halaman ini disiapkan untuk monitoring paket konsolidasi.',
    type: 'placeholder'
  },
  'monitoring-sirup': {
    title: 'Monitoring SiRUP',
    subtitle: 'Halaman ini disiapkan untuk monitoring indikator pemanfaatan SiRUP.',
    type: 'placeholder'
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
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');
const menuButton = document.getElementById('menuButton');
const sidebar = document.getElementById('sidebar');
const portalPageHeader = document.getElementById('portalPageHeader');

function renderDashboard() {
  contentArea.innerHTML = `
    <section class="hero-card">
      <h3>Selamat datang di TRAXPBJ</h3>
      <p>Ringkasan utama untuk monitoring, analisis, simulasi, dan pelaporan pengadaan barang/jasa.</p>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">ITKP</div>
          <div class="value">86,42%</div>
          <div class="desc">Tingkat kematangan PBJ</div>
        </div>
        <div class="stat-card">
          <div class="label">Konsolidasi</div>
          <div class="value">128</div>
          <div class="desc">Paket terkonsolidasi</div>
        </div>
        <div class="stat-card">
          <div class="label">Modul Monitoring</div>
          <div class="value">7</div>
          <div class="desc">Modul aktif dalam portal</div>
        </div>
        <div class="stat-card">
          <div class="label">Rapor PBJ</div>
          <div class="value">44</div>
          <div class="desc">Laporan rapor tersedia</div>
        </div>
      </div>
    </section>

    <section class="grid-main">
      <div class="card">
        <h3>Ringkasan Dashboard</h3>
        <div class="summary-panels">
          <div class="mini-card">
            <h4>ITKP</h4>
            <div class="big-number">86,42%</div>
            <div class="progress-scale">
              <div class="progress-track">
                <div class="progress-bar" style="width:86.42%"></div>
              </div>
            </div>
            <div class="dimensions">
              ${renderDimension('Perencanaan', 92.10)}
              ${renderDimension('Pengadaan', 84.33)}
              ${renderDimension('Pengelolaan Kontrak', 83.21)}
              ${renderDimension('Manajemen Risiko', 79.45)}
              ${renderDimension('Kelembagaan', 88.60)}
            </div>
          </div>

          <div class="mini-card">
            <h4>Konsolidasi</h4>
            <div class="donut-wrap">
              <div class="donut"></div>
              <div class="legend">
                <span><i class="dot" style="background:#1f60e0"></i> Terkonsolidasi 45,1%</span>
                <span><i class="dot" style="background:#27b0c2"></i> Dalam proses 26,1%</span>
                <span><i class="dot" style="background:#cfd8e5"></i> Belum konsolidasi 28,8%</span>
              </div>
            </div>
            <div class="table-lite">
              <div class="table-row table-head"><div>OPD</div><div>Jumlah Paket</div></div>
              <div class="table-row"><div>Badan Kepegawaian</div><div>24</div></div>
              <div class="table-row"><div>Dinas PUPR</div><div>18</div></div>
              <div class="table-row"><div>Dinas Kesehatan</div><div>15</div></div>
              <div class="table-row"><div>Dinas Pendidikan</div><div>14</div></div>
              <div class="table-row"><div>Sekretariat Daerah</div><div>11</div></div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Aktivitas / Informasi</h3>
        <div class="activities">
          ${renderActivity('#2ab56f', '✓', 'Rapor PBJ Bulan April 2026 telah tersedia', 'Laporan rapor untuk 10 OPD telah berhasil dibuat.', '2 jam lalu')}
          ${renderActivity('#4c7df2', '👥', 'Paket konsolidasi baru ditambahkan', 'Dinas Kesehatan menambahkan 5 paket baru.', '3 jam lalu')}
          ${renderActivity('#8e61e9', '📝', 'Update ITKP', 'Nilai ITKP bulan April meningkat 4,12%.', '5 jam lalu')}
          ${renderActivity('#ef8d21', '🛒', 'Proses eTendering dimulai', 'Paket pembangunan RSUD memasuki tahap tender.', '1 hari lalu')}
          ${renderActivity('#12a8a1', '📄', 'Kontrak ditandatangani', 'Paket pengadaan alat laboratorium selesai dikontrak.', '1 hari lalu')}
        </div>
      </div>
    </section>

    <section class="quick-grid">
      ${renderQuickCard('📋', 'linear-gradient(135deg,#2665df,#3a8bff)', 'Monitoring Perencanaan', 'Pantau progres perencanaan pengadaan di seluruh OPD.', 'monitoring-perencanaan')}
      ${renderQuickCard('🧾', 'linear-gradient(135deg,#11a6a2,#4cc7bc)', 'Rapor PBJ', 'Lihat dan unduh laporan rapor kinerja PBJ per OPD.', 'rapor-pbj')}
      ${renderQuickCard('🗓️', 'linear-gradient(135deg,#7c54e9,#a075f3)', 'Simulasi Timeline', 'Simulasikan jadwal pengadaan secara terstruktur.', 'simulasi-timeline')}
      ${renderQuickCard('✍️', 'linear-gradient(135deg,#ef8d21,#f8b14c)', 'Pencatatan Non Tender', 'Catat dan kelola paket pengadaan non tender.', 'simulasi-nontender')}
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
      <div class="page-note">Halaman dimuat dari project/modul yang sudah ada. Jika tinggi iframe dirasa kurang, tinggal ubah CSS pada <b>.embed-frame</b>.</div>
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
          <p>Halaman ini sudah disiapkan di portal utama. Nanti saat project GitHub/halaman monitoring selesai, tinggal isi URL modulnya di file <b>app.js</b>.</p>
        </div>
        <div class="placeholder-box">
          <h4>Langkah berikutnya</h4>
          <p>Cari route <b>${pageKey}</b> pada objek <b>APP_ROUTES</b>, lalu ubah <b>type</b> menjadi <b>iframe</b> atau <b>module</b> dan isi path/URL halaman milik kamu.</p>
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
  document.querySelectorAll('.nav-link, .submenu-link').forEach((el) => el.classList.remove('active'));

  const directButton = document.querySelector(`.nav-link[data-page="${key}"]`);
  const subButton = document.querySelector(`.submenu-link[data-page="${key}"]`);

  if (directButton) directButton.classList.add('active');
  if (subButton) {
    subButton.classList.add('active');
    const group = subButton.closest('.nav-group');
    if (group) group.classList.add('open');
  }
}

function cleanupDynamicModule() {
  document.querySelectorAll('[data-dynamic-module-css]').forEach((el) => el.remove());
  document.querySelectorAll('[data-dynamic-module-js]').forEach((el) => el.remove());
}

async function renderModulePage(page) {
  cleanupDynamicModule();

  try {
    const response = await fetch(page.html, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} saat memuat ${page.html}`);
    }

    const rawHtml = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    let moduleContent = '';
    if (doc.body && doc.body.innerHTML.trim()) {
      moduleContent = doc.body.innerHTML;
    } else {
      moduleContent = rawHtml;
    }

    contentArea.innerHTML = `
      <section class="module-page">
        ${moduleContent}
      </section>
    `;

    if (page.css) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = page.css + '?v=' + Date.now();
      link.setAttribute('data-dynamic-module-css', 'true');
      document.head.appendChild(link);
    }

    if (page.js) {
      const script = document.createElement('script');
      script.src = page.js + '?v=' + Date.now();
      script.defer = true;
      script.setAttribute('data-dynamic-module-js', 'true');
      document.body.appendChild(script);
    }
  } catch (error) {
    console.error('Gagal memuat module:', error);
    contentArea.innerHTML = `
      <section class="card">
        <h3>Gagal memuat modul</h3>
        <p>File modul tidak bisa dimuat. Cek path HTML, CSS, dan JS pada <b>APP_ROUTES</b>.</p>
        <p><b>Detail:</b> ${error.message}</p>
      </section>
    `;
  }
}

async function loadPage(key) {
  const page = APP_ROUTES[key] || APP_ROUTES.dashboard;
  pageTitle.textContent = page.title;
  pageSubtitle.textContent = page.subtitle;
  updateActiveMenu(key);

  if (page.type !== 'module') {
    cleanupDynamicModule();
  }

  if (portalPageHeader) {
    portalPageHeader.style.display = page.type === 'module' ? 'none' : '';
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

  if (window.innerWidth <= 980) {
    sidebar.classList.remove('mobile-open');
  }
}

function bindMenu() {
  document.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => loadPage(button.dataset.page));
  });

  document.querySelectorAll('[data-toggle-group]').forEach((button) => {
    button.addEventListener('click', () => {
      const group = document.querySelector(`.nav-group[data-group="${button.dataset.toggleGroup}"]`);
      if (group) group.classList.toggle('open');
    });
  });

  menuButton.addEventListener('click', () => {
    if (window.innerWidth <= 980) {
      sidebar.classList.toggle('mobile-open');
    } else {
      document.body.classList.toggle('sidebar-collapsed');
    }
  });
}

bindMenu();
loadPage('dashboard');
