const APP_CONFIG = {
  userSheet: {
    spreadsheetId: '1DYsqMtvwhPn-IEA3te9fFukD_iMMDRqUNPamktuPz2U',
    gid: '574346425',
    title: 'USERID'
  },
  sessionKey: 'pemenang_pengadaan_login_session_v1'
};

const APP_ROUTES = {
  dashboard: {
    title: 'Dashboard Pemenang Pengadaan',
    subtitle: 'Ringkasan akses utama untuk memulai pencarian penyedia dan pemantauan paket aktif.',
    type: 'internal'
  },
  'provider-search': {
    title: 'Pencarian Paket Penyedia',
    subtitle: 'Tahap berikutnya untuk pencarian nama penyedia dari sheet tender dan non tender.',
    type: 'placeholder'
  },
  'active-packages': {
    title: 'Paket Pengadaan Aktif',
    subtitle: 'Tahap berikutnya untuk pencarian nama paket, instansi, satker, LPSE, serta filter status proses.',
    type: 'placeholder'
  }
};

const loginShell = document.getElementById('loginShell');
const appShell = document.getElementById('appShell');
const contentArea = document.getElementById('contentArea');
const sidebar = document.getElementById('sidebar');
const sidebarToggleButton = document.getElementById('sidebarToggleButton');
const loginForm = document.getElementById('loginForm');
const loginUserId = document.getElementById('loginUserId');
const loginPassword = document.getElementById('loginPassword');
const loginSubmitButton = document.getElementById('loginSubmitButton');
const loginError = document.getElementById('loginError');
const logoutButton = document.getElementById('logoutButton');
const sidebarUserName = document.getElementById('sidebarUserName');

let activePageKey = 'dashboard';
let currentSession = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeHeader(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s-]/g, '')
    .trim();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(value);
      value = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value);
      if (row.some((cell) => String(cell).trim() !== '')) rows.push(row);
      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cell) => String(cell).trim() !== '')) rows.push(row);

  return rows;
}

async function fetchSheetRows(config) {
  const url = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/gviz/tq?tqx=out:csv&gid=${config.gid}&v=${Date.now()}`;
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Gagal mengambil ${config.title}. HTTP ${response.status}`);
  }

  const text = await response.text();
  if (/googlevisualization|DOCTYPE html|<html/i.test(text.slice(0, 300))) {
    throw new Error(`${config.title} belum bisa dibaca publik. Pastikan spreadsheet viewer aktif.`);
  }

  const matrix = parseCsv(text);
  const headers = matrix.shift() || [];

  return matrix.map((cells) => {
    const row = {};
    const normalized = {};

    headers.forEach((header, index) => {
      const cleanHeader = String(header || '').trim();
      const cellValue = String(cells[index] || '').trim();
      row[cleanHeader] = cellValue;
      normalized[normalizeHeader(cleanHeader)] = cellValue;
    });

    row.__normalized = normalized;
    return row;
  }).filter((row) => Object.values(row.__normalized).some((value) => String(value).trim() !== ''));
}

function getField(row, candidates) {
  const map = row && row.__normalized ? row.__normalized : {};
  for (const candidate of candidates) {
    const key = normalizeHeader(candidate);
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      return map[key];
    }
  }
  return '';
}

function setLoginError(message = '') {
  loginError.textContent = message;
  loginError.classList.toggle('show', Boolean(message));
}

function persistSession(session) {
  currentSession = session;
  localStorage.setItem(APP_CONFIG.sessionKey, JSON.stringify(session));
}

function clearSession() {
  currentSession = null;
  localStorage.removeItem(APP_CONFIG.sessionKey);
}

function getStoredSession() {
  try {
    const raw = localStorage.getItem(APP_CONFIG.sessionKey);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function updateSidebarUser() {
  sidebarUserName.textContent = currentSession?.userId || '-';
}

function showApp() {
  loginShell.classList.add('hidden');
  appShell.classList.remove('app-hidden');
  updateSidebarUser();
}

function showLogin() {
  loginShell.classList.remove('hidden');
  appShell.classList.add('app-hidden');
  loginPassword.value = '';
  setLoginError('');
}

async function handleLogin(event) {
  event.preventDefault();
  const userId = loginUserId.value.trim();
  const password = loginPassword.value;

  if (!userId || !password) {
    setLoginError('User ID dan password wajib diisi.');
    return;
  }

  loginSubmitButton.disabled = true;
  loginSubmitButton.textContent = 'Memeriksa akses...';
  setLoginError('');

  try {
    const rows = await fetchSheetRows(APP_CONFIG.userSheet);
    const matched = rows.find((row) => {
      const rowUserId = getField(row, ['USERID', 'user id', 'user']);
      const rowPassword = getField(row, ['PASSWORD', 'password', 'pass']);
      return rowUserId === userId && rowPassword === password;
    });

    if (!matched) {
      throw new Error('User ID atau password tidak sesuai.');
    }

    persistSession({
      userId,
      loginAt: Date.now()
    });

    showApp();
    loadPage('dashboard');
  } catch (error) {
    setLoginError(error.message || 'Login gagal.');
  } finally {
    loginSubmitButton.disabled = false;
    loginSubmitButton.textContent = 'Masuk ke Portal';
  }
}

function logout() {
  clearSession();
  showLogin();
}

function updateActiveMenu(pageKey) {
  document.querySelectorAll('[data-page]').forEach((button) => {
    button.classList.toggle('active', button.dataset.page === pageKey);
  });
}

function renderDashboard() {
  contentArea.innerHTML = `
    <section class="portal-hero lux-hero">
      <div class="portal-hero-grid"></div>
      <div class="portal-hero-reflex"></div>
      <div class="portal-hero-inner">
        <div class="portal-hero-copy">
          <span class="portal-kicker">Portal Data Pengadaan</span>
          <h2>Pemenang Pengadaan</h2>
          <p>Dashboard premium untuk membuka akses pencarian penyedia dan pemantauan paket aktif. Tahap ini sudah menyiapkan login, dashboard utama, dan panel sumber data.</p>
          <div class="portal-hero-actions">
            <button type="button" class="portal-button portal-button--light" data-page="provider-search">Buka Pencarian Penyedia</button>
            <button type="button" class="portal-button portal-button--ghost" data-page="active-packages">Lihat Paket Aktif</button>
          </div>
        </div>

        <div class="portal-hero-stats">
          <div class="portal-stat-card">
            <span class="portal-stat-label">Status Portal</span>
            <strong class="portal-stat-value">Stage 1</strong>
            <small>Login + dashboard + disclaimer aktif</small>
          </div>
          <div class="portal-stat-card">
            <span class="portal-stat-label">Menu Utama</span>
            <strong class="portal-stat-value">2 Menu</strong>
            <small>Pencarian penyedia dan paket aktif</small>
          </div>
          <div class="portal-stat-card">
            <span class="portal-stat-label">Akses Login</span>
            <strong class="portal-stat-value">Sheet USERID</strong>
            <small>Validasi langsung dari spreadsheet Anda</small>
          </div>
        </div>
      </div>
    </section>

    <section class="portal-panel-grid">
      <button type="button" class="feature-panel feature-panel--blue" data-page="provider-search">
        <div class="feature-panel-icon">🔎</div>
        <div class="feature-panel-copy">
          <div class="feature-panel-kicker">FITUR UTAMA</div>
          <h3>Pencarian Paket Penyedia</h3>
          <p>Telusuri profil penyedia, jejak paket tender dan non tender, sebaran daerah, LPSE, dan daftar paket pemenang.</p>
        </div>
        <div class="feature-panel-arrow">→</div>
      </button>

      <button type="button" class="feature-panel feature-panel--teal" data-page="active-packages">
        <div class="feature-panel-icon">📦</div>
        <div class="feature-panel-copy">
          <div class="feature-panel-kicker">FITUR UTAMA</div>
          <h3>Paket Pengadaan Aktif</h3>
          <p>Pantau paket tender dan non tender yang sedang berjalan, fase aktif, jenis pengadaan, instansi, satker, dan LPSE.</p>
        </div>
        <div class="feature-panel-arrow">→</div>
      </button>
    </section>

    <section class="disclaimer-card" id="disclaimerCard">
      <button type="button" class="disclaimer-toggle" id="disclaimerToggle" aria-expanded="false">
        <span class="disclaimer-toggle-left">
          <span class="disclaimer-badge">!</span>
          <span>
            <strong>Sumber Data & Disclaimer</strong>
            <small>Panel informasi sumber data portal</small>
          </span>
        </span>
        <span class="disclaimer-caret">⌄</span>
      </button>

      <div class="disclaimer-body" id="disclaimerBody">
        <div class="disclaimer-section">
          <h4>Tentang dashboard ini</h4>
          <p>Portal ini disiapkan sebagai alat bantu analisis internal. Data diambil dari spreadsheet hasil scraping dan pengolahan yang Anda kelola sendiri, sehingga tampilannya bisa dibuat lebih cepat, lebih rapi, dan lebih fokus ke kebutuhan kerja.</p>
        </div>

        <div class="disclaimer-grid">
          <div class="disclaimer-box disclaimer-box--blue">
            <div class="disclaimer-box-title">Sumber Data Utama</div>
            <ul>
              <li>Sheet <b>USERID</b> untuk validasi login user internal.</li>
              <li>Sheet <b>SCRAPTENDER</b> untuk data paket tender.</li>
              <li>Sheet <b>SCRAPNONTENDER</b> untuk data paket non tender.</li>
            </ul>
          </div>

          <div class="disclaimer-box disclaimer-box--gold">
            <div class="disclaimer-box-title">Catatan Pemakaian</div>
            <ul>
              <li>Dashboard ini menampilkan data sesuai hasil pengambilan yang tersedia di spreadsheet.</li>
              <li>Perubahan data sumber tidak selalu real time, tergantung pembaruan sheet.</li>
              <li>Informasi di portal ini sebaiknya tetap dikonfirmasi ke sumber resmi bila dipakai untuk keputusan penting.</li>
            </ul>
          </div>
        </div>

        <div class="disclaimer-footnote">Tahap ini baru menyiapkan fondasi portal: login, dashboard utama, dan panel sumber data. Fitur pencarian dan detail paket akan kita lanjutkan pada tahap berikutnya.</div>
      </div>
    </section>
  `;

  bindInlineRouteButtons();
  bindDisclaimerToggle();
}

function renderPlaceholder(pageKey) {
  const page = APP_ROUTES[pageKey];
  contentArea.innerHTML = `
    <section class="placeholder-hero">
      <span class="portal-kicker">Tahap Berikutnya</span>
      <h2>${escapeHtml(page.title)}</h2>
      <p>${escapeHtml(page.subtitle)}</p>
    </section>

    <section class="placeholder-card">
      <div class="placeholder-card-head">
        <h3>Kerangka halaman sudah disiapkan</h3>
        <button type="button" class="portal-button portal-button--light" data-page="dashboard">Kembali ke Dashboard</button>
      </div>
      <div class="placeholder-grid">
        <div class="placeholder-box">
          <h4>Yang akan dibangun</h4>
          <p>${pageKey === 'provider-search'
            ? 'Search nama penyedia, hasil daftar paket, tampilan kartu, dan detail lengkap identitas paket dari sheet SCRAPTENDER dan SCRAPNONTENDER.'
            : 'Search nama paket/instansi/satker/LPSE, filter jenis paket, filter tahap proses, daftar paket aktif, dan detail expand seperti referensi Anda.'}</p>
        </div>
        <div class="placeholder-box">
          <h4>Status saat ini</h4>
          <p>Fondasi portal sudah aman dipasang: login dari sheet USERID, dashboard utama premium, dan panel sumber data & disclaimer yang bisa dibuka-tutup.</p>
        </div>
      </div>
    </section>
  `;
  bindInlineRouteButtons();
}

function bindInlineRouteButtons() {
  contentArea.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      const pageKey = button.dataset.page;
      if (pageKey) loadPage(pageKey);
    });
  });
}

function bindDisclaimerToggle() {
  const card = document.getElementById('disclaimerCard');
  const button = document.getElementById('disclaimerToggle');
  if (!card || !button) return;

  button.addEventListener('click', () => {
    const isOpen = card.classList.toggle('open');
    button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

function loadPage(pageKey) {
  if (!currentSession) {
    showLogin();
    return;
  }

  activePageKey = pageKey in APP_ROUTES ? pageKey : 'dashboard';
  updateActiveMenu(activePageKey);

  if (activePageKey === 'dashboard') {
    renderDashboard();
    return;
  }

  renderPlaceholder(activePageKey);
}

function bindMenu() {
  document.querySelectorAll('.sidebar [data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      const pageKey = button.dataset.page;
      if (pageKey) loadPage(pageKey);
    });
  });

  if (sidebarToggleButton) {
    sidebarToggleButton.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', logout);
  }

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
}

function boot() {
  bindMenu();
  const session = getStoredSession();
  if (session?.userId) {
    currentSession = session;
    showApp();
    loadPage('dashboard');
    return;
  }
  showLogin();
}

boot();
