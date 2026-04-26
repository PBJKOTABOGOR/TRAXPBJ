const APP_ROUTES = {
  dashboard: {
    title: 'Dashboard TRAXPBJ',
    subtitle: 'Ringkasan informasi utama untuk monitoring dan analisis pengadaan.',
    type: 'internal'
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
    type: 'module',
    html: 'modules/monitoring/itkp-ekatalog/itkp-ekatalog.html',
    css: 'modules/monitoring/itkp-ekatalog/itkp-ekatalog.css',
    js: 'modules/monitoring/itkp-ekatalog/itkp-ekatalog.js'
  },

  'monitoring-etendering': {
    title: 'Monitoring eTendering',
    subtitle: 'Halaman ini disiapkan untuk monitoring indikator pemanfaatan eTendering.',
    type: 'module',
    html: 'modules/monitoring/itkp-etendering/itkp-etendering.html',
    css: 'modules/monitoring/itkp-etendering/itkp-etendering.css',
    js: 'modules/monitoring/itkp-etendering/itkp-etendering.js'
  },

  'monitoring-ekontrak': {
    title: 'Monitoring eKontrak',
    subtitle: 'Halaman ini disiapkan untuk monitoring indikator pemanfaatan eKontrak.',
    type: 'module',
    html: 'modules/monitoring/itkp-ekontrak/itkp-ekontrak.html',
    css: 'modules/monitoring/itkp-ekontrak/itkp-ekontrak.css',
    js: 'modules/monitoring/itkp-ekontrak/itkp-ekontrak.js'
  },

  'monitoring-nontender': {
    title: 'Monitoring Non Tender',
    subtitle: 'Halaman ini disiapkan untuk monitoring Non eTendering/Non ePurchasing.',
    type: 'placeholder'
  },

  'rapor-pbj': {
    title: 'Rapor PBJ',
    subtitle: 'Portal laporan Rapor PBJ perangkat daerah.',
    type: 'iframe',
    url: 'https://pbjkotabogor.github.io/raporpbj/'
  },

  'monitoring-perencanaan': {
    title: 'Monitoring Realisasi',
    subtitle: 'Pemantauan progres realisasi paket pengadaan perangkat daerah.',
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

  'simulasi-procurement-stacker': {
    title: 'Procurement Stacker',
    subtitle: 'Game edukasi interaktif untuk memahami alur, metode, risiko, adendum, dan keputusan PBJ.',
    type: 'module',
    html: 'modules/simulasi/procurement-stacker/procurement-stacker.html',
    css: 'modules/simulasi/procurement-stacker/procurement-stacker.css',
    js: 'modules/simulasi/procurement-stacker/procurement-stacker.js'
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
let activePageKey = '';
let loadingPageKey = '';
let scrollAnimationDestroy = null;

let dashboardPanjiDestroy = null;
let dashboardPanjiClosedUntilReload = false;
let dashboardPanjiPaused = false;
let dashboardPanjiLastMessage = '';
let dashboardPanjiIdleTimer = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cacheBust(url) {
  const joiner = url.includes('?') ? '&' : '?';
  return `${url}${joiner}v=${Date.now()}`;
}

function showModuleLoading(title = 'Memuat modul...') {
  contentArea.innerHTML = `
    <section class="card">
      <h3>${escapeHtml(title)}</h3>
      <p>Mohon tunggu sebentar, sistem sedang menyiapkan tampilan dan data.</p>
    </section>
  `;
}

function initScrollAnimation() {
  if (typeof scrollAnimationDestroy === 'function') {
    scrollAnimationDestroy();
    scrollAnimationDestroy = null;
  }

  let progress = document.getElementById('luxScrollProgress');

  if (!progress) {
    progress = document.createElement('div');
    progress.id = 'luxScrollProgress';
    progress.className = 'lux-scroll-progress';
    document.body.appendChild(progress);
  }

  const updateProgress = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    progress.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  };

  const revealItems = contentArea.querySelectorAll(
    '.hero-card, .card, .quick-card, .embed-card, .module-page--native > *'
  );

  revealItems.forEach((item, index) => {
    item.classList.add('lux-reveal');
    item.style.transitionDelay = `${Math.min(index * 45, 260)}ms`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -30px 0px'
  });

  revealItems.forEach((item) => observer.observe(item));

  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });

  scrollAnimationDestroy = () => {
    window.removeEventListener('scroll', updateProgress);
    observer.disconnect();
  };
}

const DASHBOARD_SHEETS = {
  itkp: {
    title: 'FIX ITKP OPD',
    spreadsheetId: '18SSLHINReP4mpMYLFhFGVGjsbspQSs0xHZ4weSjvE3A',
    gid: '1217577518'
  },
  itkpSubOpd: {
    title: 'FIX ITKP SUB OPD',
    spreadsheetId: '18SSLHINReP4mpMYLFhFGVGjsbspQSs0xHZ4weSjvE3A',
    gid: '1682485707'
  },
  perencanaan: {
    title: 'D_PERENCANAAN',
    spreadsheetId: '1ccDgtXNATxSYMZuDgd3polvRiTFNiFnjIGMP7b9qmrU',
    gid: '1819757327'
  },
  realisasi: {
    title: 'D_REALISASI',
    spreadsheetId: '1ccDgtXNATxSYMZuDgd3polvRiTFNiFnjIGMP7b9qmrU',
    gid: '325886021'
  }
};

const DASHBOARD_STATE = {
  loading: false,
  loadedAt: null,
  error: null,
  raw: null,
  data: null,
  selectedItkpSatker: 'PEMERINTAH KOTA BOGOR'
};

function normalizeHeader(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s%()-]/g, '')
    .trim();
}

function getField(row, candidates) {
  const map = row.__normalized || {};

  for (const candidate of candidates) {
    const key = normalizeHeader(candidate);
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      return map[key];
    }
  }

  const candidateText = candidates.map(normalizeHeader);

  for (const [key, value] of Object.entries(map)) {
    if (candidateText.some((item) => key.includes(item) || item.includes(key))) {
      return value;
    }
  }

  return '';
}

function toNumber(value) {
  if (value === null || value === undefined) return 0;

  const raw = String(value)
    .trim()
    .replace(/\s/g, '');

  if (!raw || raw === '-' || raw.toLowerCase() === 'nan') return 0;

  const hasComma = raw.includes(',');
  const hasDot = raw.includes('.');

  let cleaned = raw.replace(/[^\d,.-]/g, '');

  if (hasComma && hasDot) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasComma && !hasDot) {
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      cleaned = `${parts[0]}.${parts[1]}`;
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (!hasComma && hasDot) {
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = cleaned.replace(/\./g, '');
    }
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value) {
  return Math.round(toNumber(value)).toLocaleString('id-ID');
}

function formatMoney(value) {
  const number = toNumber(value);
  if (number >= 1_000_000_000_000) return `Rp ${(number / 1_000_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} T`;
  if (number >= 1_000_000_000) return `Rp ${(number / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`;
  if (number >= 1_000_000) return `Rp ${(number / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Jt`;
  return `Rp ${formatNumber(number)}`;
}

function formatPercent(value) {
  const number = toNumber(value);
  return `${number.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function formatScore(value) {
  return toNumber(value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quote = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quote && next === '"') {
      value += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      quote = !quote;
      continue;
    }

    if (char === ',' && !quote) {
      row.push(value);
      value = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !quote) {
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
    throw new Error(`${config.title} belum bisa dibaca publik. Pastikan spreadsheet/share link dapat diakses viewer.`);
  }

  const matrix = parseCsv(text);
  const headers = matrix.shift() || [];

  return matrix.map((cells) => {
    const row = {};
    const normalized = {};

    headers.forEach((header, index) => {
      const cleanHeader = String(header || '').trim();
      const cell = String(cells[index] || '').trim();
      row[cleanHeader] = cell;
      normalized[normalizeHeader(cleanHeader)] = cell;
    });

    row.__normalized = normalized;
    return row;
  }).filter((row) => {
    return Object.values(row.__normalized).some((item) => String(item).trim() !== '');
  });
}

function groupSum(rows, keyGetter, valueGetter) {
  const map = new Map();

  rows.forEach((row) => {
    const key = String(keyGetter(row) || 'Tidak Terisi').trim() || 'Tidak Terisi';
    const prev = map.get(key) || { name: key, count: 0, value: 0 };

    prev.count += 1;
    prev.value += toNumber(valueGetter(row));
    map.set(key, prev);
  });

  return Array.from(map.values()).sort((a, b) => b.value - a.value);
}

function avg(values) {
  const cleaned = values.map(toNumber).filter((value) => Number.isFinite(value));
  if (!cleaned.length) return 0;
  return cleaned.reduce((total, value) => total + value, 0) / cleaned.length;
}

function sum(values) {
  return values.reduce((total, value) => total + toNumber(value), 0);
}

function isCityAggregateName(name) {
  return String(name || '').trim().toUpperCase() === 'PEMERINTAH KOTA BOGOR';
}

function findNumericByHeader(row, requiredWords = [], optionalWords = []) {
  const map = row && row.__normalized ? row.__normalized : {};
  const required = requiredWords.map(normalizeHeader).filter(Boolean);
  const optional = optionalWords.map(normalizeHeader).filter(Boolean);

  let bestValue = 0;
  let bestWeight = -1;

  Object.entries(map).forEach(([key, value]) => {
    const number = toNumber(value);

    if (!Number.isFinite(number) || number <= 0) {
      return;
    }

    const isMatch = required.every((word) => key.includes(word));

    if (!isMatch) {
      return;
    }

    let weight = 0;
    optional.forEach((word) => {
      if (key.includes(word)) weight += 1;
    });

    if (weight > bestWeight) {
      bestWeight = weight;
      bestValue = number;
    }
  });

  return bestValue;
}

function getLastReasonableItkpNumber(row) {
  const map = row && row.__normalized ? row.__normalized : {};
  const values = Object.entries(map)
    .filter(([key]) => {
      return !key.includes('total rup')
        && !key.includes('total komitmen')
        && !key.includes('total pagu')
        && !key.includes('total realisasi')
        && !key.includes('paket')
        && !key.includes('pagu');
    })
    .map(([, value]) => toNumber(value))
    .filter((value) => Number.isFinite(value) && value > 0 && value <= 30);

  return values.length ? values[values.length - 1] : 0;
}

function getItkpScore(row) {
  const exactValue = toNumber(getField(row, [
    'Nilai ITKP Indikator Pemanfaatan Sistem - skor maksimal 30 (point)',
    'Nilai ITKP - Pemanfaatan Sistem - skor maksimal 30 (point)',
    'Nilai ITKP Pemanfaatan Sistem - skor maksimal 30 (point)',
    'Nilai ITKP Pemanfaatan Sistem',
    'Nilai ITKP Indikator Pemanfaatan Sistem',
    'Pemanfaatan Sistem - skor maksimal 30',
    'Pemanfaatan Sistem'
  ]));

  if (exactValue > 0) {
    return exactValue;
  }

  const headerValue = findNumericByHeader(
    row,
    ['nilai itkp', 'pemanfaatan sistem'],
    ['skor maksimal 30', '30', 'point']
  );

  if (headerValue > 0) {
    return headerValue;
  }

  if (isCityAggregateName(getField(row || {}, ['Satuan Kerja', 'Nama Satuan Kerja', 'nama_satker']))) {
    return getLastReasonableItkpNumber(row || {});
  }

  return 0;
}

function getIndicatorStatus(value, max) {
  const number = toNumber(value);
  const maximum = toNumber(max);
  const percent = maximum > 0 ? (number / maximum) * 100 : 0;

  if (number <= 0 || maximum <= 0) {
    return {
      label: 'Belum Terdeteksi',
      tone: 'danger',
      mood: 'sad',
      percent: 0
    };
  }

  if (percent >= 85) {
    return {
      label: 'Sangat Baik',
      tone: 'success',
      mood: 'happy',
      percent
    };
  }

  if (percent >= 70) {
    return {
      label: 'Baik',
      tone: 'good',
      mood: 'happy',
      percent
    };
  }

  if (percent >= 50) {
    return {
      label: 'Cukup',
      tone: 'warning',
      mood: 'thinking',
      percent
    };
  }

  return {
    label: 'Butuh Perhatian',
    tone: 'danger',
    mood: 'sad',
    percent
  };
}

function buildItkpProfile(row, fallbackName = 'PEMERINTAH KOTA BOGOR') {
  const name = getField(row || {}, ['Satuan Kerja', 'Nama Satuan Kerja', 'nama_satker']) || fallbackName;

  return {
    name,
    __sourceRow: row || {},
    score: getItkpScore(row || {}),
    dimensions: [
      {
        id: 'sirup',
        name: 'SiRUP',
        value: toNumber(getField(row || {}, ['Nilai ITKP - skor maksimal 10 (point) (SIRUP)', 'SIRUP'])),
        max: 10,
        accent: 'blue',
        route: 'monitoring-sirup',
        hint: 'Klik untuk buka Monitoring SiRUP'
      },
      {
        id: 'tokoDaring',
        name: 'Toko Daring',
        value: toNumber(getField(row || {}, ['Nilai ITKP - skor maksimal 1 (point) (Toko Daring)', 'Toko Daring'])),
        max: 1,
        accent: 'teal',
        route: 'monitoring-ekatalog',
        hint: 'Klik untuk buka Monitoring eKatalog/Toko Daring'
      },
      {
        id: 'epurchasing',
        name: 'e-Purchasing',
        value: toNumber(getField(row || {}, ['Nilai ITKP - skor maksimal 4 (point) (Epurchasing)', 'Epurchasing', 'ePurchasing'])),
        max: 4,
        accent: 'purple',
        route: 'monitoring-ekatalog',
        hint: 'Klik untuk buka Monitoring eKatalog'
      },
      {
        id: 'etendering',
        name: 'e-Tendering',
        value: toNumber(getField(row || {}, ['Nilai ITKP - skor maksimal 5 (point) (etendering)', 'eTendering'])),
        max: 5,
        accent: 'orange',
        route: 'monitoring-etendering',
        hint: 'Klik untuk buka Monitoring eTendering'
      },
      {
        id: 'ekontrak',
        name: 'e-Kontrak',
        value: toNumber(getField(row || {}, ['Nilai ITKP - skor maksimal 5 (point) (ekontrak)', 'eKontrak'])),
        max: 5,
        accent: 'green',
        route: 'monitoring-ekontrak',
        hint: 'Klik untuk buka Monitoring eKontrak'
      },
      {
        id: 'nontender',
        name: 'Non Tender',
        value: toNumber(getField(row || {}, ['Nilai ITKP - skor maksimal 5 (point) (Non etendering & Non ePurchasing)', 'Non etendering', 'Non ePurchasing', 'Non Tender'])),
        max: 5,
        accent: 'red',
        route: 'monitoring-nontender',
        hint: 'Klik untuk buka Monitoring Non Tender'
      }
    ]
  };
}

function analyzeDashboardData(raw) {
  const itkpAllRows = raw.itkp || [];
  const subOpdAllRows = raw.itkpSubOpd || [];
  const planningRows = raw.perencanaan || [];
  const realRows = raw.realisasi || [];

  const getSatker = (row) => getField(row, ['Satuan Kerja', 'Nama Satuan Kerja', 'nama_satker']);
  const getMetode = (row) => getField(row, ['Metode Pengadaan', 'mtd_pemilihan', 'Sumber Transaksi']);
  const getPagu = (row) => getField(row, ['Nilai Pagu', 'Pagu', 'Total Pagu']);
  const getRealisasi = (row) => getField(row, ['Nilai Realisasi', 'Total Realisasi', 'nilai_realisasi']);
  const getStatus = (row) => getField(row, ['Status Paket', 'status_paket', 'Status']);

  const itkpOpdRows = itkpAllRows.filter((row) => !isCityAggregateName(getSatker(row)));
  const subOpdRows = subOpdAllRows.filter((row) => !isCityAggregateName(getSatker(row)));
  const cityRow = itkpAllRows.find((row) => isCityAggregateName(getSatker(row))) || null;
  const cityProfile = buildItkpProfile(cityRow || {}, 'PEMERINTAH KOTA BOGOR');

  const profiles = [cityProfile]
    .concat(itkpOpdRows.map((row) => buildItkpProfile(row, getSatker(row))))
    .filter((profile) => profile.name);

  const selectedName = DASHBOARD_STATE.selectedItkpSatker || cityProfile.name;
  const selectedProfile = profiles.find((profile) => profile.name === selectedName) || cityProfile;
  DASHBOARD_STATE.selectedItkpSatker = selectedProfile.name;

  const selectedIsCity = isCityAggregateName(selectedProfile.name);
  const normalizeSatkerName = (value) => String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');

  const selectedSatkerKey = normalizeSatkerName(selectedProfile.name);
  const isSelectedSatkerRow = (row) => {
    if (selectedIsCity) return true;
    return normalizeSatkerName(getSatker(row)) === selectedSatkerKey;
  };

  const scopedPlanningRows = planningRows.filter(isSelectedSatkerRow);
  const scopedRealRows = realRows.filter(isSelectedSatkerRow);

  const totalPagu = sum(scopedPlanningRows.map(getPagu));
  const totalRealisasi = sum(scopedRealRows.map(getRealisasi));
  const realisasiPersen = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;

  const selesaiRows = scopedRealRows.filter((row) => /selesai|completed|paket selesai/i.test(getStatus(row)));
  const processRows = scopedRealRows.filter((row) => /process|proses|berlangsung|sedang/i.test(getStatus(row)));
  const bastRows = scopedRealRows.filter((row) => String(getField(row, ['BAST', 'dok_realisasi'])).trim() && String(getField(row, ['BAST', 'dok_realisasi'])).trim() !== '-');

  const byMetodePlanning = groupSum(scopedPlanningRows, getMetode, getPagu);
  const byMetodeReal = groupSum(scopedRealRows, getMetode, getRealisasi);
  const bySatkerPlanning = groupSum(scopedPlanningRows, getSatker, getPagu);
  const bySatkerReal = groupSum(scopedRealRows, getSatker, getRealisasi);

  const rankingSourceRows = subOpdRows.length ? subOpdRows : itkpOpdRows;
  const scoreRows = rankingSourceRows.map((row) => ({
    name: getSatker(row) || getField(row, ['Satuan Kerja']),
    score: getItkpScore(row)
  })).filter((item) => item.name && !isCityAggregateName(item.name));

  const topItkp = [...scoreRows].sort((a, b) => b.score - a.score).slice(0, 8);
  const lowItkp = [...scoreRows].sort((a, b) => a.score - b.score).slice(0, 8);

  return {
    itkpRows: itkpOpdRows,
    itkpSubOpdRows: subOpdRows,
    planningRows,
    realRows,
    totalOpd: itkpOpdRows.length,
    totalSubOpd: subOpdRows.length,
    scopeName: selectedProfile.name,
    scopeIsCity: selectedIsCity,
    scopedPlanningRows,
    scopedRealRows,
    totalPaketRup: scopedPlanningRows.length,
    totalPaketRealisasi: scopedRealRows.length,
    totalPagu,
    totalRealisasi,
    realisasiPersen,
    selesaiCount: selesaiRows.length,
    processCount: processRows.length,
    bastCount: bastRows.length,
    itkpOverall: cityProfile.score,
    dimensions: selectedProfile.dimensions,
    cityProfile,
    selectedProfile,
    itkpProfiles: profiles,
    byMetodePlanning,
    byMetodeReal,
    bySatkerPlanning,
    bySatkerReal,
    topItkp,
    lowItkp
  };
}

async function loadDashboardData(force = false) {
  if (DASHBOARD_STATE.data && !force) return DASHBOARD_STATE.data;
  if (DASHBOARD_STATE.loading) return DASHBOARD_STATE.data;

  DASHBOARD_STATE.loading = true;
  DASHBOARD_STATE.error = null;

  try {
    const [itkp, itkpSubOpd, perencanaan, realisasi] = await Promise.all([
      fetchSheetRows(DASHBOARD_SHEETS.itkp),
      fetchSheetRows(DASHBOARD_SHEETS.itkpSubOpd),
      fetchSheetRows(DASHBOARD_SHEETS.perencanaan),
      fetchSheetRows(DASHBOARD_SHEETS.realisasi)
    ]);

    DASHBOARD_STATE.raw = { itkp, itkpSubOpd, perencanaan, realisasi };
    DASHBOARD_STATE.data = analyzeDashboardData(DASHBOARD_STATE.raw);
    DASHBOARD_STATE.loadedAt = new Date();
    return DASHBOARD_STATE.data;
  } catch (error) {
    DASHBOARD_STATE.error = error;
    throw error;
  } finally {
    DASHBOARD_STATE.loading = false;
  }
}

function getTotalStatus(score) {
  const value = toNumber(score);

  if (value >= 24) {
    return {
      label: 'Sangat Baik',
      tone: 'success',
      mood: 'happy',
      icon: '🏆'
    };
  }

  if (value >= 18) {
    return {
      label: 'Baik',
      tone: 'good',
      mood: 'happy',
      icon: '✅'
    };
  }

  if (value >= 12) {
    return {
      label: 'Cukup',
      tone: 'warning',
      mood: 'thinking',
      icon: '⚠️'
    };
  }

  return {
    label: 'Butuh Perhatian',
    tone: 'danger',
    mood: 'sad',
    icon: '🚨'
  };
}

function getStrongestIndicators(profile) {
  return [...(profile.dimensions || [])]
    .map((item) => ({
      ...item,
      status: getIndicatorStatus(item.value, item.max)
    }))
    .sort((a, b) => b.status.percent - a.status.percent)
    .slice(0, 3);
}

function getWeakestIndicators(profile) {
  return [...(profile.dimensions || [])]
    .map((item) => ({
      ...item,
      status: getIndicatorStatus(item.value, item.max)
    }))
    .sort((a, b) => a.status.percent - b.status.percent)
    .slice(0, 3);
}

function renderDashboardSkeleton() {
  contentArea.innerHTML = `
    <section class="hero-card">
      <h3>Dashboard TRAXPBJ</h3>
      <p>Memuat data ITKP, perencanaan, realisasi, dan indikator pemanfaatan sistem pengadaan.</p>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">Status</div>
          <div class="value">Memuat</div>
          <div class="desc">PANJI sedang membaca data dashboard.</div>
        </div>

        <div class="stat-card">
          <div class="label">ITKP</div>
          <div class="value">...</div>
          <div class="desc">Mengambil data pemanfaatan sistem.</div>
        </div>

        <div class="stat-card">
          <div class="label">RUP</div>
          <div class="value">...</div>
          <div class="desc">Mengambil data perencanaan.</div>
        </div>

        <div class="stat-card">
          <div class="label">Realisasi</div>
          <div class="value">...</div>
          <div class="desc">Mengambil data realisasi.</div>
        </div>
      </div>
    </section>
  `;
}

function renderDashboardError(error) {
  destroyDashboardPanji();

  contentArea.innerHTML = `
    <section class="hero-card">
      <h3>Data dashboard belum bisa dimuat</h3>
      <p>${escapeHtml(error.message || 'Terjadi kendala saat mengambil data dashboard.')}</p>

      <div style="margin-top:18px;">
        <button class="help-button" type="button" id="retryDashboardButton">Coba Muat Ulang</button>
      </div>
    </section>

    <section class="card">
      <h3>Yang perlu dicek</h3>

      <div class="placeholder-grid">
        <div class="placeholder-box">
          <h4>Akses Google Sheet</h4>
          <p>Pastikan spreadsheet dapat dibaca sebagai viewer/public, terutama sheet ITKP, Perencanaan, dan Realisasi.</p>
        </div>

        <div class="placeholder-box">
          <h4>Header Data</h4>
          <p>Pastikan header Satuan Kerja, Nilai ITKP, Pagu, Realisasi, dan Metode tidak berubah.</p>
        </div>
      </div>
    </section>
  `;

  const retryButton = document.getElementById('retryDashboardButton');

  if (retryButton) {
    retryButton.addEventListener('click', () => {
      DASHBOARD_STATE.data = null;
      renderDashboard(true);
    });
  }
}

async function renderDashboard(force = false) {
  renderDashboardSkeleton();

  try {
    const data = await loadDashboardData(force);

    renderDashboardReady(data);
    bindDashboardEvents();
    initDashboardPanji(data);
    requestAnimationFrame(initScrollAnimation);
  } catch (error) {
    console.error('Dashboard gagal dimuat:', error);
    renderDashboardError(error);
  }
}

function renderDashboardReady(data) {
  const profile = data.selectedProfile;
  const totalStatus = getTotalStatus(profile.score);
  const strongestIndicators = getStrongestIndicators(profile);
  const weakestIndicators = getWeakestIndicators(profile);

  data.strongestIndicators = strongestIndicators;
  data.weakestIndicators = weakestIndicators;

  const lastUpdate = DASHBOARD_STATE.loadedAt
    ? DASHBOARD_STATE.loadedAt.toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
    : '-';

  contentArea.innerHTML = `
    <section class="hero-card" data-panji-topic="dashboard">
      <h3>Dashboard TRAXPBJ</h3>
      <p>
        Ringkasan pemanfaatan sistem ITKP, perencanaan, realisasi, dan profil satuan kerja.
        PANJI akan membantu membaca indikator SiRUP, Toko Daring, e-Purchasing, e-Tendering,
        e-Kontrak, dan Non Tender.
      </p>

      <div class="stats-grid">
        ${renderDashboardKpiCard('ITKP', formatScore(profile.score), `${totalStatus.icon} ${totalStatus.label} · ${profile.name}`, 'itkp')}
        ${renderDashboardKpiCard('Pagu RUP', formatMoney(data.totalPagu), `${formatNumber(data.totalPaketRup)} paket perencanaan`, 'pagu')}
        ${renderDashboardKpiCard('Realisasi', formatMoney(data.totalRealisasi), `${formatPercent(data.realisasiPersen)} dari pagu`, 'realisasi')}
        ${renderDashboardKpiCard('Paket Realisasi', formatNumber(data.totalPaketRealisasi), `${formatNumber(data.selesaiCount)} selesai · ${formatNumber(data.processCount)} proses`, 'paket')}
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:18px;">
        <button class="help-button" type="button" id="refreshDashboardButton">Refresh Data</button>
        <button class="help-button" type="button" data-quick="monitoring-sirup">Buka SiRUP</button>
        <button class="help-button" type="button" data-quick="monitoring-ekatalog">Buka eKatalog</button>
        <button class="help-button" type="button" data-quick="simulasi-procurement-stacker">Buka PANJI Game</button>
      </div>
    </section>

    <section class="grid-main">
      <div class="card" data-panji-topic="itkp">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:16px;">
          <div>
            <h3>Profil ITKP Satuan Kerja</h3>
            <div class="page-note">Update data: ${escapeHtml(lastUpdate)}</div>
          </div>

          <label style="display:grid; gap:6px; min-width:320px;">
            <span style="font-weight:800; color:#64748b; font-size:12px;">Pilih Satuan Kerja</span>
            <select id="itkpSatkerSelect" style="min-height:42px; border-radius:14px; border:1px solid #dbe5f0; padding:0 12px; color:#102544; font-weight:800;">
              ${data.itkpProfiles.map((item) => `
                <option value="${escapeHtml(item.name)}" ${item.name === profile.name ? 'selected' : ''}>
                  ${escapeHtml(item.name)}
                </option>
              `).join('')}
            </select>
          </label>
        </div>

        <div class="summary-panels">
          <div class="mini-card" data-panji-topic="score-ring">
            <h4>${escapeHtml(profile.name)}</h4>
            <div class="big-number">${formatScore(profile.score)}</div>
            <div class="page-note">Skor ITKP dari maksimal 30 poin · ${escapeHtml(totalStatus.label)}</div>

            <div class="progress-scale">
              <div class="progress-track">
                <div class="progress-bar" style="width:${Math.min(100, (profile.score / 30) * 100)}%"></div>
              </div>
            </div>

            <div class="page-note">
              Penilaian PANJI: ${escapeHtml(buildShortTotalAssessment(profile.score))}
            </div>
          </div>

          <div class="mini-card">
            <h4>Indikator Pemanfaatan Sistem</h4>
            <div class="dimensions">
              ${profile.dimensions.map(renderDashboardDimension).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="card" data-panji-topic="analysis">
        <h3>Analisis PANJI</h3>

        <div class="activities">
          ${renderPanjiAnalysis(data)}
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px;">
          <button class="help-button" type="button" id="panjiExplainButton">PANJI Jelaskan</button>
          <button class="help-button" type="button" id="panjiAdviceButton">Saran PANJI</button>
        </div>
      </div>
    </section>

    <section class="grid-main">
      <div class="card" data-panji-topic="weakest">
        <h3>Prioritas Perbaikan</h3>
        <div class="activities">
          ${weakestIndicators.map(renderIndicatorInsight).join('')}
        </div>
      </div>

      <div class="card" data-panji-topic="strongest">
        <h3>Capaian Terbaik</h3>
        <div class="activities">
          ${strongestIndicators.map(renderIndicatorInsight).join('')}
        </div>
      </div>
    </section>

    <section class="grid-main">
      <div class="card" data-panji-topic="metode-perencanaan">
        <h3>Komposisi Pagu Perencanaan per Metode</h3>
        ${renderLiteTable(data.byMetodePlanning, 'Metode', 'Pagu', 'value', formatMoney)}
      </div>

      <div class="card" data-panji-topic="metode-realisasi">
        <h3>Komposisi Realisasi per Metode</h3>
        ${renderLiteTable(data.byMetodeReal, 'Metode', 'Realisasi', 'value', formatMoney)}
      </div>
    </section>

    <section class="grid-main">
      <div class="card" data-panji-topic="ranking-top">
        <h3>Nilai ITKP Tertinggi</h3>
        ${renderRanking(data.topItkp, false)}
      </div>

      <div class="card" data-panji-topic="ranking-low">
        <h3>Nilai ITKP Terendah</h3>
        ${renderRanking(data.lowItkp, true)}
      </div>
    </section>

    <section class="quick-grid" data-panji-topic="quick-menu">
      ${renderQuickCard('📊', 'linear-gradient(135deg,#1d4ed8,#22d3ee)', 'ITKP - SiRUP', 'Cek pengumuman RUP dan indikator SiRUP.', 'monitoring-sirup')}
      ${renderQuickCard('🛒', 'linear-gradient(135deg,#0f766e,#22c55e)', 'eKatalog', 'Cek Toko Daring dan e-Purchasing.', 'monitoring-ekatalog')}
      ${renderQuickCard('🏗️', 'linear-gradient(135deg,#f97316,#f59e0b)', 'eTendering', 'Pantau tender dan seleksi.', 'monitoring-etendering')}
      ${renderQuickCard('📑', 'linear-gradient(135deg,#111827,#2563eb)', 'eKontrak', 'Pantau pencatatan kontrak.', 'monitoring-ekontrak')}
    </section>

    <div class="footer-note">© 2026 TRAXPBJ - Dashboard dibantu PANJI Pengadaan Jitu</div>
  `;
}

function buildShortTotalAssessment(score) {
  const status = getTotalStatus(score);

  if (status.label === 'Sangat Baik') {
    return 'pemanfaatan sistem sudah kuat, tinggal menjaga konsistensi data dari RUP sampai realisasi.';
  }

  if (status.label === 'Baik') {
    return 'fondasi sistem sudah berjalan, tetapi beberapa indikator masih bisa dikuatkan.';
  }

  if (status.label === 'Cukup') {
    return 'sistem sudah mulai dimanfaatkan, tetapi belum merata di semua tahapan PBJ.';
  }

  return 'perlu perhatian karena pemanfaatan sistem belum cukup kuat untuk menopang monitoring PBJ.';
}

function renderDashboardKpiCard(label, value, desc, topic) {
  return `
    <div class="stat-card" data-panji-topic="${escapeHtml(topic)}">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(value)}</div>
      <div class="desc">${escapeHtml(desc)}</div>
    </div>
  `;
}

function renderDashboardDimension(item) {
  const status = getIndicatorStatus(item.value, item.max);
  const width = Math.min(100, Math.max(0, status.percent));

  return `
    <button class="dim-row dim-row--button" type="button" data-indicator-id="${escapeHtml(item.id)}" data-route="${escapeHtml(item.route)}" data-panji-topic="${escapeHtml(item.id)}">
      <div>
        <b>${escapeHtml(item.name)}</b>
        <div style="font-size:11px; color:#64748b; margin-top:2px;">${escapeHtml(status.label)}</div>
      </div>

      <div class="bar">
        <span style="width:${width}%"></span>
      </div>

      <div>
        ${formatScore(item.value)}
        <div style="font-size:11px; color:#64748b;">/ ${formatScore(item.max)}</div>
      </div>
    </button>
  `;
}

function renderPanjiAnalysis(data) {
  const profile = data.selectedProfile;
  const status = getTotalStatus(profile.score);
  const strongest = data.strongestIndicators && data.strongestIndicators[0];
  const weakest = data.weakestIndicators && data.weakestIndicators[0];

  return `
    <div class="activity-item">
      <div class="activity-icon" style="background:#2563eb">PJ</div>

      <div>
        <div class="activity-title">${escapeHtml(profile.name)} · ${escapeHtml(status.label)}</div>
        <div class="activity-text">
          Skor ITKP ${formatScore(profile.score)} dari 30.
          Indikator kuat: ${escapeHtml(strongest ? strongest.name : '-')}.
          Prioritas pembenahan: ${escapeHtml(weakest ? weakest.name : '-')}.
        </div>
      </div>

      <div class="activity-time">${escapeHtml(status.icon)}</div>
    </div>
  `;
}

function renderIndicatorInsight(item) {
  const status = getIndicatorStatus(item.value, item.max);

  return `
    <button class="activity-item insight-item--button" type="button" data-indicator-id="${escapeHtml(item.id)}" data-route="${escapeHtml(item.route)}" data-panji-topic="${escapeHtml(item.id)}">
      <div class="activity-icon" style="background:${status.tone === 'danger' ? '#dc2626' : status.tone === 'warning' ? '#f59e0b' : '#16a34a'}">
        ${status.tone === 'danger' ? '!' : '✓'}
      </div>

      <div>
        <div class="activity-title">${escapeHtml(item.name)} · ${escapeHtml(status.label)}</div>
        <div class="activity-text">
          ${formatScore(item.value)} dari ${formatScore(item.max)} poin (${formatPercent(status.percent)}).
        </div>
      </div>

      <div class="activity-time">${status.tone === 'danger' ? 'Perlu' : 'OK'}</div>
    </button>
  `;
}

function renderLiteTable(rows, firstLabel, secondLabel, valueKey, formatter) {
  const cleanRows = rows.slice(0, 8);

  if (!cleanRows.length) {
    return `<div class="page-note">Belum ada data yang bisa ditampilkan.</div>`;
  }

  return `
    <div class="table-lite">
      <div class="table-row table-head">
        <div>${escapeHtml(firstLabel)}</div>
        <div>${escapeHtml(secondLabel)}</div>
      </div>

      ${cleanRows.map((row) => `
        <div class="table-row">
          <div>${escapeHtml(row.name)}</div>
          <div>${escapeHtml(formatter(row[valueKey]))}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderRanking(rows, lowMode = false) {
  if (!rows.length) {
    return `<div class="page-note">Belum ada data ranking.</div>`;
  }

  return `
    <div class="table-lite">
      <div class="table-row table-head">
        <div>Satuan Kerja</div>
        <div>Skor</div>
      </div>

      ${rows.map((item) => {
        const status = getTotalStatus(item.score);

        return `
          <div class="table-row">
            <div>
              ${lowMode ? '⚠️ ' : '🏆 '}
              ${escapeHtml(item.name)}
              <span style="color:#64748b;">· ${escapeHtml(status.label)}</span>
            </div>
            <div>${formatScore(item.score)}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function bindDashboardEvents() {
  contentArea.querySelectorAll('[data-quick]').forEach((item) => {
    item.addEventListener('click', () => loadPage(item.dataset.quick));
  });

  contentArea.querySelectorAll('[data-route]').forEach((item) => {
    item.addEventListener('click', () => {
      const route = item.dataset.route;
      if (route) loadPage(route);
    });
  });

  const select = document.getElementById('itkpSatkerSelect');

  if (select) {
    select.addEventListener('change', () => {
      DASHBOARD_STATE.selectedItkpSatker = select.value;

      if (DASHBOARD_STATE.raw) {
        DASHBOARD_STATE.data = analyzeDashboardData(DASHBOARD_STATE.raw);
      }

      renderDashboardReady(DASHBOARD_STATE.data);
      bindDashboardEvents();
      initDashboardPanji(DASHBOARD_STATE.data, true);
      requestAnimationFrame(initScrollAnimation);
    });
  }

  const refresh = document.getElementById('refreshDashboardButton');
  if (refresh) {
    refresh.addEventListener('click', () => {
      DASHBOARD_STATE.data = null;
      renderDashboard(true);
    });
  }

  const panjiExplainButton = document.getElementById('panjiExplainButton');
  if (panjiExplainButton) {
    panjiExplainButton.addEventListener('click', () => {
      if (!DASHBOARD_STATE.data) return;
      dashboardPanjiPaused = false;
      dashboardPanjiSpeak(buildPanjiDashboardExplanation(DASHBOARD_STATE.data), 'talking');
      highlightPanjiTarget(document.querySelector('[data-panji-topic="dashboard"]'));
    });
  }

  const panjiAdviceButton = document.getElementById('panjiAdviceButton');
  if (panjiAdviceButton) {
    panjiAdviceButton.addEventListener('click', () => {
      if (!DASHBOARD_STATE.data) return;
      dashboardPanjiPaused = false;
      dashboardPanjiSpeak(buildPanjiRecommendation(DASHBOARD_STATE.data), 'thinking');
      focusWeakestIndicator(DASHBOARD_STATE.data);
    });
  }
}

/* =========================================================
   PANJI DASHBOARD
   ========================================================= */

function initDashboardPanji(data, fromSelection = false) {
  if (activePageKey !== 'dashboard') return;
  if (dashboardPanjiClosedUntilReload) return;

  injectDashboardPanjiCss();

  if (typeof dashboardPanjiDestroy === 'function') {
    dashboardPanjiDestroy();
    dashboardPanjiDestroy = null;
  }

  const panji = ensureDashboardPanjiElement();

  const closeButton = panji.querySelector('#dashPanjiClose');
  const closeActionButton = panji.querySelector('#dashPanjiCloseAction');
  const characterButton = panji.querySelector('#dashPanjiCharacter');
  const explainButton = panji.querySelector('#dashPanjiExplain');
  const analyzeButton = panji.querySelector('#dashPanjiAnalyze');
  const adviceButton = panji.querySelector('#dashPanjiAdvice');

  const closePanji = () => {
    dashboardPanjiClosedUntilReload = true;
    clearDashboardPanjiHighlight();
    destroyDashboardPanji();
  };

  const togglePause = () => {
    if (dashboardPanjiClosedUntilReload) return;

    dashboardPanjiPaused = !dashboardPanjiPaused;

    if (dashboardPanjiPaused) {
      panji.classList.remove('dash-panji-talking', 'dash-panji-happy', 'dash-panji-sad', 'dash-panji-thinking');
      setDashboardPanjiText('Baik, PANJI diam dulu. Klik karakter PANJI lagi kalau ingin saya lanjut membaca dashboard.');
      setDashboardPanjiEmote('🤐');
      clearDashboardPanjiHighlight();
      return;
    }

    dashboardPanjiSpeak(
      dashboardPanjiLastMessage || buildPanjiSatkerAnalysis(data),
      getPanjiMoodByData(data)
    );
  };

  if (closeButton) closeButton.addEventListener('click', closePanji);
  if (closeActionButton) closeActionButton.addEventListener('click', closePanji);
  if (characterButton) characterButton.addEventListener('click', togglePause);

  if (explainButton) {
    explainButton.addEventListener('click', () => {
      dashboardPanjiPaused = false;
      dashboardPanjiSpeak(buildPanjiDashboardExplanation(data), 'talking');
      highlightPanjiTarget(document.querySelector('[data-panji-topic="dashboard"]'));
    });
  }

  if (analyzeButton) {
    analyzeButton.addEventListener('click', () => {
      dashboardPanjiPaused = false;
      dashboardPanjiSpeak(buildPanjiSatkerAnalysis(data), getPanjiMoodByData(data));
      highlightPanjiTarget(document.querySelector('[data-panji-topic="itkp"]'));
    });
  }

  if (adviceButton) {
    adviceButton.addEventListener('click', () => {
      dashboardPanjiPaused = false;
      dashboardPanjiSpeak(buildPanjiRecommendation(data), 'thinking');
      focusWeakestIndicator(data);
    });
  }

  bindDashboardPanjiHover(data);
  initDashboardPanjiAutoPosition();
  startDashboardPanjiIdleTips(data);

  if (fromSelection) {
    dashboardPanjiSpeak(buildPanjiSatkerAnalysis(data), getPanjiMoodByData(data));
  } else {
    dashboardPanjiSpeak(buildPanjiWelcome(data), 'intro');
  }

  dashboardPanjiDestroy = () => {
    const existing = document.getElementById('dashboardPanji');
    if (existing) existing.remove();

    clearDashboardPanjiHighlight();

    if (dashboardPanjiIdleTimer) {
      clearTimeout(dashboardPanjiIdleTimer);
      dashboardPanjiIdleTimer = null;
    }
  };
}

function ensureDashboardPanjiElement() {
  let panji = document.getElementById('dashboardPanji');

  if (!panji) {
    panji = document.createElement('div');
    panji.id = 'dashboardPanji';
    panji.className = 'dash-panji dash-panji-intro';

    panji.innerHTML = `
      <div class="dash-panji-bubble">
        <button type="button" class="dash-panji-close" id="dashPanjiClose" title="Tutup PANJI">×</button>

        <div class="dash-panji-top">
          <div class="dash-panji-name">PANJI · Pengadaan Jitu</div>
          <div class="dash-panji-emote" id="dashPanjiEmote">👋</div>
        </div>

        <div class="dash-panji-text" id="dashPanjiText"></div>

        <div class="dash-panji-actions">
          <button type="button" id="dashPanjiExplain">Jelaskan Dashboard</button>
          <button type="button" id="dashPanjiAnalyze">Analisis OPD</button>
          <button type="button" id="dashPanjiAdvice">Saran PANJI</button>
          <button type="button" id="dashPanjiCloseAction">Tutup PANJI</button>
        </div>
      </div>

      <button type="button" class="dash-panji-character" id="dashPanjiCharacter" title="Klik PANJI untuk diam / lanjut bicara">
        <div class="dash-panji-glow"></div>

        <div class="dash-panji-head">
          <div class="dash-panji-hat">PBJ</div>
          <div class="dash-panji-eye dash-panji-eye-left"></div>
          <div class="dash-panji-eye dash-panji-eye-right"></div>
          <div class="dash-panji-mouth"></div>
        </div>

        <div class="dash-panji-body">
          <div class="dash-panji-badge">PJ</div>
        </div>

        <div class="dash-panji-hand dash-panji-hand-left"></div>
        <div class="dash-panji-hand dash-panji-hand-right"></div>
      </button>
    `;

    document.body.appendChild(panji);
  }

  return panji;
}

function destroyDashboardPanji() {
  if (typeof dashboardPanjiDestroy === 'function') {
    dashboardPanjiDestroy();
    dashboardPanjiDestroy = null;
  } else {
    const panji = document.getElementById('dashboardPanji');
    if (panji) panji.remove();
  }

  clearDashboardPanjiHighlight();

  if (dashboardPanjiIdleTimer) {
    clearTimeout(dashboardPanjiIdleTimer);
    dashboardPanjiIdleTimer = null;
  }
}

function dashboardPanjiSpeak(message, mood = 'talking') {
  if (dashboardPanjiClosedUntilReload || dashboardPanjiPaused) return;

  const panji = document.getElementById('dashboardPanji');
  const textEl = document.getElementById('dashPanjiText');

  if (!panji || !textEl) return;

  const cleanMessage = String(message || '').trim();
  if (!cleanMessage) return;

  dashboardPanjiLastMessage = cleanMessage;

  panji.classList.remove(
    'dash-panji-happy',
    'dash-panji-sad',
    'dash-panji-thinking',
    'dash-panji-talking',
    'dash-panji-intro'
  );

  if (mood === 'happy') {
    panji.classList.add('dash-panji-happy', 'dash-panji-talking');
    setDashboardPanjiEmote('😄');
  } else if (mood === 'sad') {
    panji.classList.add('dash-panji-sad', 'dash-panji-talking');
    setDashboardPanjiEmote('😢');
  } else if (mood === 'thinking') {
    panji.classList.add('dash-panji-thinking', 'dash-panji-talking');
    setDashboardPanjiEmote('🤔');
  } else if (mood === 'intro') {
    panji.classList.add('dash-panji-intro', 'dash-panji-talking');
    setDashboardPanjiEmote('👋');
  } else {
    panji.classList.add('dash-panji-talking');
    setDashboardPanjiEmote('🤖');
  }

  setDashboardPanjiText(cleanMessage);

  clearTimeout(panji._talkTimer);
  panji._talkTimer = setTimeout(() => {
    panji.classList.remove('dash-panji-talking');
  }, Math.min(7200, Math.max(2400, cleanMessage.length * 38)));
}

function setDashboardPanjiText(text) {
  const textEl = document.getElementById('dashPanjiText');
  if (!textEl) return;

  textEl.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
}

function setDashboardPanjiEmote(icon) {
  const emote = document.getElementById('dashPanjiEmote');
  if (!emote) return;

  emote.textContent = icon;
}

function getPanjiMoodByData(data) {
  const profile = data.selectedProfile || data.cityProfile;
  const status = getTotalStatus(profile.score);
  return status.mood || 'thinking';
}

function bindDashboardPanjiHover(data) {
  const targets = contentArea.querySelectorAll(
    '[data-panji-topic], .stat-card, .dim-row--button, .quick-card, .activity-item, .table-row'
  );

  targets.forEach((target) => {
    if (target.dataset.panjiHoverBound) return;

    target.dataset.panjiHoverBound = '1';

    let hoverTimer = null;

    const enter = () => {
      if (dashboardPanjiClosedUntilReload || dashboardPanjiPaused) return;

      clearTimeout(hoverTimer);

      hoverTimer = setTimeout(() => {
        const message = buildPanjiElementExplanation(target, data);

        if (!message) return;

        highlightPanjiTarget(target);
        dashboardPanjiSpeak(message, detectPanjiMoodFromTarget(target, data));
      }, 320);
    };

    const leave = () => {
      clearTimeout(hoverTimer);
    };

    target.addEventListener('mouseenter', enter);
    target.addEventListener('focus', enter);
    target.addEventListener('mouseleave', leave);
  });
}

function buildPanjiElementExplanation(target, data) {
  const topic = target.dataset.panjiTopic || '';
  const indicatorId = target.dataset.indicatorId || '';

  if (indicatorId) {
    return buildPanjiIndicatorExplanation(indicatorId, data);
  }

  if (topic === 'dashboard') return buildPanjiDashboardExplanation(data);
  if (topic === 'itkp') return buildPanjiSatkerAnalysis(data);
  if (topic === 'score-ring') return buildPanjiSatkerAnalysis(data);
  if (topic === 'analysis') return buildPanjiSatkerAnalysis(data);
  if (topic === 'weakest') return buildPanjiRecommendation(data);
  if (topic === 'strongest') return buildPanjiStrongestAnalysis(data);

  if (topic === 'pagu') {
    return 'Pagu RUP menunjukkan beban rencana pengadaan yang harus dikawal sejak perencanaan. Nilai besar bukan otomatis baik; yang penting paket sudah diumumkan, metode tepat, jadwal wajar, dan tidak berhenti sebelum proses pemilihan.';
  }

  if (topic === 'realisasi') {
    return 'Realisasi menunjukkan seberapa jauh rencana pengadaan sudah bergerak menjadi pelaksanaan. Capaian yang sehat harus tersambung ke kontrak, BAST, pembayaran, dan pencatatan akhir.';
  }

  if (topic === 'paket') {
    return 'Jumlah paket perlu dibaca bersama nilai dan metode. Banyak paket tidak selalu buruk, tetapi perlu dicermati apakah ada kebutuhan sejenis yang seharusnya dikonsolidasikan atau paket kecil yang rawan luput pencatatan.';
  }

  if (topic === 'metode-perencanaan') {
    return 'Komposisi metode pada perencanaan membantu melihat cara OPD memetakan kebutuhan. PANJI akan curiga kalau banyak paket sejenis tersebar tanpa konsolidasi atau metode tidak sejalan dengan nilai dan jenis pekerjaan.';
  }

  if (topic === 'metode-realisasi') {
    return 'Komposisi realisasi per metode menunjukkan kanal mana yang benar-benar digunakan. Perencanaan yang baik harus terlihat nyambung ke transaksi, kontrak, BAST, dan realisasi.';
  }

  if (topic === 'ranking-top') {
    return 'Ranking tertinggi menunjukkan OPD yang pemanfaatan sistemnya relatif tertib. Jadikan pembanding praktik baik, bukan sekadar daftar juara.';
  }

  if (topic === 'ranking-low') {
    return 'Ranking terendah perlu dibaca sebagai prioritas pembinaan. Fokusnya bukan menyalahkan OPD, tetapi mencari indikator yang paling lemah dan memperbaiki alur datanya.';
  }

  if (topic === 'quick-menu') {
    return 'Menu akses cepat membantu masuk ke modul detail. Kalau angka dashboard terlihat lemah, jangan berhenti di ringkasan; buka modul terkait untuk menelusuri paket dan sumber datanya.';
  }

  if (topic === 'monitoring-sirup') {
    return 'Menu SiRUP dipakai untuk menelusuri perencanaan. RUP adalah pintu awal sebelum bicara metode, kontrak, BAST, dan realisasi.';
  }

  if (topic === 'monitoring-ekatalog') {
    return 'Menu eKatalog membaca Toko Daring dan e-Purchasing. Untuk paket yang tersedia di katalog, cek spesifikasi, harga, PDN/TKDN, penyedia, dan dokumentasi sebelum berpindah metode.';
  }

  if (topic === 'monitoring-etendering') {
    return 'Menu eTendering penting untuk paket tender dan seleksi. Perhatikan nilai, jenis pekerjaan, metode, dokumen pemilihan, jadwal, dan kesinambungan ke kontrak.';
  }

  if (topic === 'monitoring-ekontrak') {
    return 'Menu eKontrak membaca apakah hasil pemilihan sudah tersambung ke kontrak. Titik ini krusial karena kontrak mengikat pelaksanaan, pemeriksaan, BAST, pembayaran, dan realisasi.';
  }

  if (topic === 'simulasi-procurement-stacker') {
    return 'Procurement Stacker adalah ruang latihan. Di sana PANJI menguji urutan PBJ, jebakan metode, katalog tidak tersedia, kontrak, adendum, BAST, dan realisasi.';
  }

  const text = cleanText(target.textContent).toLowerCase();

  if (text.includes('sirup')) return buildPanjiIndicatorExplanation('sirup', data);
  if (text.includes('toko daring')) return buildPanjiIndicatorExplanation('tokoDaring', data);
  if (text.includes('purchasing') || text.includes('katalog')) return buildPanjiIndicatorExplanation('epurchasing', data);
  if (text.includes('tendering') || text.includes('tender')) return buildPanjiIndicatorExplanation('etendering', data);
  if (text.includes('kontrak')) return buildPanjiIndicatorExplanation('ekontrak', data);
  if (text.includes('non tender')) return buildPanjiIndicatorExplanation('nontender', data);

  return '';
}

function detectPanjiMoodFromTarget(target, data) {
  const indicatorId = target.dataset.indicatorId || target.dataset.panjiTopic;
  const profile = data.selectedProfile || data.cityProfile;
  const indicator = (profile.dimensions || []).find((item) => item.id === indicatorId);

  if (indicator) {
    return getIndicatorStatus(indicator.value, indicator.max).mood;
  }

  if (indicatorId === 'weakest' || indicatorId === 'ranking-low') return 'thinking';
  if (indicatorId === 'strongest' || indicatorId === 'ranking-top') return 'happy';

  return 'thinking';
}

function buildPanjiWelcome(data) {
  return 'Halo, saya PANJI — Pengadaan Jitu. Saya akan membaca dashboard ini seperti pendamping PBJ. Pilih satuan kerja, nanti saya nilai SiRUP, Toko Daring, e-Purchasing, e-Tendering, e-Kontrak, dan Non Tender dengan bahasa pengadaan yang lebih tajam.';
}

function buildPanjiDashboardExplanation(data) {
  return 'Dashboard ini adalah peta kendali PBJ. ITKP membaca pemanfaatan sistem dari SiRUP sampai Non Tender, sedangkan pagu dan realisasi menunjukkan apakah rencana sudah bergerak menjadi pelaksanaan. Fokusnya bukan sekadar angka, tapi kesinambungan data: RUP, metode, transaksi, kontrak, BAST, pembayaran, dan realisasi harus tersambung.';
}

function buildPanjiSatkerAnalysis(data) {
  const profile = data.selectedProfile || data.cityProfile;
  const status = getTotalStatus(profile.score);
  const strongest = data.strongestIndicators && data.strongestIndicators[0];
  const weakest = data.weakestIndicators && data.weakestIndicators[0];

  let text = `${profile.name} berada pada kategori ${status.label} dengan skor ITKP ${formatScore(profile.score)} dari 30. `;

  if (strongest) {
    text += `Indikator paling kuat adalah ${strongest.name}, artinya bagian itu relatif lebih tertib. `;
  }

  if (weakest) {
    text += `Titik yang perlu dikawal adalah ${weakest.name}. ${buildPanjiIndicatorExplanation(weakest.id, data)}`;
  } else {
    text += 'Belum ada indikator yang terbaca rinci. Cek kembali struktur data agar analisis bisa lebih tajam.';
  }

  return text;
}

function buildPanjiStrongestAnalysis(data) {
  const strongest = data.strongestIndicators && data.strongestIndicators[0];

  if (!strongest) {
    return 'Belum ada indikator kuat yang bisa dibaca. Pastikan data ITKP per indikator sudah tersedia.';
  }

  return `${strongest.name} menjadi capaian terkuat. ${buildPanjiIndicatorExplanation(strongest.id, data)} Pertahankan pola kerja ini dan pastikan indikator lain ikut tersambung ke rantai PBJ yang sama.`;
}

function buildPanjiRecommendation(data) {
  const weak = data.weakestIndicators || [];
  const profile = data.selectedProfile || data.cityProfile;

  if (!weak.length) {
    return `Belum cukup data untuk menentukan prioritas ${profile.name}. Mulai dari cek RUP, metode, transaksi katalog atau tender, kontrak, BAST, dan realisasi. Data yang rapi membuat evaluasi OPD jauh lebih akurat.`;
  }

  const first = weak[0];
  const second = weak[1];

  let text = `Prioritas pertama untuk ${profile.name} adalah ${first.name}. ${buildPanjiIndicatorExplanation(first.id, data)} `;

  if (second) {
    text += `Setelah itu kawal ${second.name}, karena indikator lemah kedua sering menjadi penyebab rantai data tidak utuh.`;
  }

  return text;
}

function buildPanjiIndicatorExplanation(indicatorId, data) {
  const profile = data.selectedProfile || data.cityProfile;
  const indicator = (profile.dimensions || []).find((item) => item.id === indicatorId);

  if (!indicator) {
    return 'Indikator ini belum terbaca dari data dashboard. Cek header dan sumber data agar PANJI bisa memberi analisis yang tepat.';
  }

  const status = getIndicatorStatus(indicator.value, indicator.max);
  const nilai = `${formatScore(indicator.value)} dari ${formatScore(indicator.max)} poin`;

  if (indicatorId === 'sirup') {
    if (status.label === 'Sangat Baik' || status.label === 'Baik') {
      return `SiRUP sudah ${status.label.toLowerCase()} (${nilai}). Perencanaan dan pengumuman RUP terlihat relatif tertib sebagai pintu awal PBJ. Yang perlu dijaga adalah konsistensi RUP dengan metode, jadwal, kontrak, BAST, dan realisasi.`;
    }

    if (status.label === 'Belum Terdeteksi') {
      return `SiRUP belum terbaca kuat (${nilai}). Periksa apakah paket sudah diumumkan di RUP, metode sudah tepat, jadwal pemilihan wajar, dan pagu tidak berhenti sebagai rencana saja.`;
    }

    return `SiRUP masih ${status.label.toLowerCase()} (${nilai}). Risiko utamanya adalah paket berjalan tanpa pijakan perencanaan yang rapi. Rapikan RUP terlebih dahulu sebelum masuk ke pemilihan, kontrak, dan realisasi.`;
  }

  if (indicatorId === 'tokoDaring') {
    if (status.label === 'Sangat Baik' || status.label === 'Baik') {
      return `Toko Daring sudah ${status.label.toLowerCase()} (${nilai}). Kanal belanja digital sederhana mulai dimanfaatkan. Tetap pastikan kebutuhan, kewajaran harga, dan dokumen pertanggungjawaban tetap rapi.`;
    }

    if (status.label === 'Belum Terdeteksi') {
      return `Toko Daring belum terlihat (${nilai}). Untuk kebutuhan sederhana yang tersedia melalui kanal toko daring, OPD dapat mengoptimalkannya sepanjang sesuai kebutuhan, ketentuan, dan kewajaran harga.`;
    }

    return `Toko Daring masih ${status.label.toLowerCase()} (${nilai}). Ini bukan sekadar memakai aplikasi, tetapi memilih kanal pengadaan yang tepat untuk belanja sederhana.`;
  }

  if (indicatorId === 'epurchasing') {
    if (status.label === 'Sangat Baik' || status.label === 'Baik') {
      return `e-Purchasing sudah ${status.label.toLowerCase()} (${nilai}). Paket yang tersedia di katalog tampaknya diarahkan ke kanal yang tepat. Tetap jaga kesesuaian spesifikasi, kewajaran harga, PDN/TKDN, penyedia, dan dokumentasi klarifikasi atau negosiasi.`;
    }

    if (status.label === 'Belum Terdeteksi') {
      return `e-Purchasing belum terlihat (${nilai}). Untuk barang/jasa yang tersedia di katalog, jangan langsung memakai metode lain. Cek katalog lebih dulu, dokumentasikan hasilnya, baru evaluasi metode bila katalog tidak sesuai.`;
    }

    return `e-Purchasing masih ${status.label.toLowerCase()} (${nilai}). Risiko yang sering muncul adalah paket katalog tidak dimanfaatkan atau pindah metode tanpa bukti cek katalog. Pastikan perubahan metode punya dokumentasi jelas.`;
  }

  if (indicatorId === 'etendering') {
    if (status.label === 'Sangat Baik' || status.label === 'Baik') {
      return `e-Tendering sudah ${status.label.toLowerCase()} (${nilai}). Proses tender atau seleksi relatif tercatat melalui sistem. Tetap perhatikan kesesuaian metode, dokumen pemilihan, jadwal, evaluasi, dan kesinambungan ke kontrak.`;
    }

    if (status.label === 'Belum Terdeteksi') {
      return `e-Tendering belum terlihat (${nilai}). Bila ada paket yang seharusnya melalui tender atau seleksi, pastikan prosesnya tercatat di sistem dan tidak berhenti di luar pemantauan.`;
    }

    return `e-Tendering masih ${status.label.toLowerCase()} (${nilai}). Cek apakah paket bernilai besar atau jasa konsultansi sudah memakai metode yang tepat. Jangan memaksakan metode sederhana hanya karena ingin cepat.`;
  }

  if (indicatorId === 'ekontrak') {
    if (status.label === 'Sangat Baik' || status.label === 'Baik') {
      return `e-Kontrak sudah ${status.label.toLowerCase()} (${nilai}). Pencatatan kontrak terlihat cukup tertib setelah pemilihan. Tahap berikutnya yang harus dijaga adalah monitoring pelaksanaan, pemeriksaan hasil, BAST, pembayaran, dan realisasi.`;
    }

    if (status.label === 'Belum Terdeteksi') {
      return `e-Kontrak belum terbaca (${nilai}). Ini perlu dicek, karena kontrak adalah penghubung antara hasil pemilihan dan pelaksanaan pekerjaan. Tanpa pencatatan kontrak, data BAST dan realisasi bisa ikut lemah.`;
    }

    return `e-Kontrak masih ${status.label.toLowerCase()} (${nilai}). Biasanya masalahnya bukan paket tidak ada, tetapi kontrak belum tertib dicatat. Risiko utamanya adalah proses pemilihan tidak tersambung ke pelaksanaan, BAST, dan realisasi.`;
  }

  if (indicatorId === 'nontender') {
    if (status.label === 'Sangat Baik' || status.label === 'Baik') {
      return `Non Tender sudah ${status.label.toLowerCase()} (${nilai}). Pengadaan langsung atau proses non tender tampaknya cukup tertib dicatat. Tetap pastikan paket kecil tidak diremehkan: dokumen, SPK atau bukti transaksi, BAST, dan realisasi harus rapi.`;
    }

    if (status.label === 'Belum Terdeteksi') {
      return `Non Tender belum terlihat (${nilai}). Pengadaan langsung dan paket non tender sering dianggap kecil, padahal tetap harus tercatat. Pastikan paket, penyedia, bukti transaksi, BAST, dan realisasi tidak bolong.`;
    }

    return `Non Tender masih ${status.label.toLowerCase()} (${nilai}). Banyak paket bernilai kecil justru rawan luput dari pencatatan. Rapikan pengadaan langsung, bukti transaksi, BAST, dan realisasi agar monitoring tidak timpang.`;
  }

  return `${indicator.name} berada pada kategori ${status.label} (${nilai}). Baca indikator ini sebagai bagian dari rantai PBJ, bukan angka berdiri sendiri.`;
}

function startDashboardPanjiIdleTips(data) {
  if (dashboardPanjiIdleTimer) {
    clearTimeout(dashboardPanjiIdleTimer);
    dashboardPanjiIdleTimer = null;
  }

  const tips = [
    'Catatan PANJI: nilai ITKP yang bagus tetap harus dibaca bersama realisasi. Sistem boleh aktif, tapi kontrak, BAST, pembayaran, dan realisasi tetap harus tertib.',
    'Dalam PBJ, cepat saja tidak cukup. Metode harus tepat, bukti harus ada, dan alur data jangan putus dari RUP sampai realisasi.',
    'Kalau indikator katalog rendah, jangan langsung menyimpulkan OPD buruk. Cek dulu apakah kebutuhannya memang tersedia di katalog dan apakah hasil ceknya terdokumentasi.',
    'Paket non tender sering terlihat kecil, tapi justru rawan luput. Pencatatan tetap penting agar monitoring tidak bolong.'
  ];

  const run = () => {
    if (activePageKey !== 'dashboard') return;
    if (dashboardPanjiClosedUntilReload || dashboardPanjiPaused) return;

    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    dashboardPanjiSpeak(randomTip, 'thinking');

    dashboardPanjiIdleTimer = setTimeout(run, 32000);
  };

  dashboardPanjiIdleTimer = setTimeout(run, 24000);
}

function highlightPanjiTarget(target) {
  clearDashboardPanjiHighlight();

  if (!target || !target.classList) return;

  target.classList.add('panji-elegant-focus');

  try {
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });
  } catch (error) {
    console.warn('PANJI gagal scroll ke elemen:', error);
  }
}

function focusWeakestIndicator(data) {
  const weak = data.weakestIndicators && data.weakestIndicators[0];
  if (!weak) return;

  const target =
    contentArea.querySelector(`[data-indicator-id="${weak.id}"]`) ||
    contentArea.querySelector(`[data-panji-topic="${weak.id}"]`);

  highlightPanjiTarget(target);
}

function clearDashboardPanjiHighlight() {
  document.querySelectorAll('.panji-elegant-focus').forEach((item) => {
    item.classList.remove('panji-elegant-focus');
  });
}

function initDashboardPanjiAutoPosition() {
  const panji = document.getElementById('dashboardPanji');
  if (!panji) return;

  let ticking = false;

  const update = () => {
    const baseBottom = 86;
    const maxBottom = 280;
    const gap = 22;
    let nextBottom = baseBottom;

    const footer = document.querySelector('.footer-note');

    if (footer) {
      const footerRect = footer.getBoundingClientRect();
      const panjiRect = panji.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const panjiNormalTop = viewportHeight - baseBottom - panjiRect.height;
      const overlap = footerRect.bottom - panjiNormalTop;

      if (footerRect.top < viewportHeight && overlap > 0) {
        nextBottom = baseBottom + overlap + gap;
      }
    }

    nextBottom = Math.max(baseBottom, Math.min(maxBottom, Math.round(nextBottom)));
    panji.style.setProperty('--dash-panji-bottom', `${nextBottom}px`);

    ticking = false;
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  update();

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);

  const oldDestroy = dashboardPanjiDestroy;

  dashboardPanjiDestroy = () => {
    window.removeEventListener('scroll', requestUpdate);
    window.removeEventListener('resize', requestUpdate);

    if (typeof oldDestroy === 'function') {
      oldDestroy();
    }
  };
}

function injectDashboardPanjiCss() {
  if (document.getElementById('dashboard-panji-css')) return;

  const style = document.createElement('style');
  style.id = 'dashboard-panji-css';
  style.textContent = `
    .dim-row--button,
    .insight-item--button{
      border:0;
      background:transparent;
      text-align:left;
      cursor:pointer;
    }

    .dim-row--button:hover,
    .insight-item--button:hover{
      transform:translateY(-1px);
    }

    .dash-panji{
      position:fixed;
      right:34px;
      bottom:var(--dash-panji-bottom, 86px);
      z-index:999999;
      display:flex;
      align-items:flex-end;
      gap:14px;
      pointer-events:none;
      transition:bottom .22s ease;
    }

    .dash-panji *{
      pointer-events:auto;
    }

    .dash-panji-bubble{
      width:350px;
      min-height:116px;
      max-height:260px;
      overflow-y:auto;
      overflow-x:hidden;
      position:relative;
      padding:16px;
      border-radius:22px;
      background:
        radial-gradient(circle at top left, rgba(59,130,246,.14), transparent 38%),
        rgba(255,255,255,.97);
      border:1px solid rgba(219,234,254,.95);
      box-shadow:0 22px 48px rgba(15,23,42,.18);
      backdrop-filter:blur(14px);
      -webkit-backdrop-filter:blur(14px);
      animation:dashPanjiBubbleIdle 3.8s ease-in-out infinite;
    }

    .dash-panji-bubble::after{
      content:"";
      position:absolute;
      right:-10px;
      bottom:34px;
      width:20px;
      height:20px;
      background:rgba(255,255,255,.97);
      border-right:1px solid rgba(219,234,254,.95);
      border-bottom:1px solid rgba(219,234,254,.95);
      transform:rotate(-45deg);
    }

    @keyframes dashPanjiBubbleIdle{
      0%,100%{transform:translateY(0);}
      50%{transform:translateY(-4px);}
    }

    .dash-panji-top{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      margin-bottom:10px;
    }

    .dash-panji-name{
      display:inline-flex;
      align-items:center;
      min-height:26px;
      padding:0 10px;
      border-radius:999px;
      background:linear-gradient(135deg,#123a72,#2563eb);
      color:#fff;
      font-size:11px;
      font-weight:950;
      letter-spacing:.08em;
      box-shadow:0 8px 18px rgba(37,99,235,.22);
    }

    .dash-panji-emote{
      width:34px;
      height:34px;
      border-radius:999px;
      display:flex;
      align-items:center;
      justify-content:center;
      background:#eef4fb;
      font-size:18px;
      animation:dashPanjiEmote 2s ease-in-out infinite;
    }

    @keyframes dashPanjiEmote{
      0%,100%{transform:scale(1);}
      50%{transform:scale(1.12);}
    }

    .dash-panji-text{
      color:#102544;
      font-size:14px;
      line-height:1.68;
      font-weight:750;
    }

    .dash-panji-actions{
      display:flex;
      gap:8px;
      margin-top:12px;
      flex-wrap:wrap;
    }

    .dash-panji-actions button{
      border:none;
      min-height:34px;
      padding:0 11px;
      border-radius:11px;
      cursor:pointer;
      font-size:11px;
      font-weight:900;
      background:#eef4fb;
      color:#123a72;
      border:1px solid #dbeafe;
      transition:.18s ease;
    }

    .dash-panji-actions button:hover{
      transform:translateY(-1px);
      background:#dbeafe;
    }

    .dash-panji-close{
      position:absolute;
      right:-8px;
      top:-8px;
      width:28px;
      height:28px;
      z-index:5;
      border:none;
      border-radius:999px;
      cursor:pointer;
      background:#102544;
      color:#fff;
      font-size:18px;
      font-weight:900;
      box-shadow:0 8px 18px rgba(15,23,42,.22);
    }

    .dash-panji-character{
      width:108px;
      height:138px;
      position:relative;
      border:none;
      background:transparent;
      cursor:pointer;
      padding:0;
      flex-shrink:0;
      animation:
        dashPanjiFloat 2.8s ease-in-out infinite,
        dashPanjiTilt 4.2s ease-in-out infinite;
      transform-origin:center bottom;
    }

    @keyframes dashPanjiFloat{
      0%,100%{transform:translateY(0);}
      50%{transform:translateY(-8px);}
    }

    @keyframes dashPanjiTilt{
      0%,100%{rotate:0deg;}
      25%{rotate:-2deg;}
      75%{rotate:2deg;}
    }

    .dash-panji-glow{
      position:absolute;
      inset:22px 4px 0;
      border-radius:999px;
      background:radial-gradient(circle, rgba(37,99,235,.28), transparent 68%);
      filter:blur(10px);
      animation:dashPanjiGlow 2.4s ease-in-out infinite;
    }

    @keyframes dashPanjiGlow{
      0%,100%{opacity:.65;transform:scale(.96);}
      50%{opacity:1;transform:scale(1.08);}
    }

    .dash-panji-head{
      position:absolute;
      left:16px;
      top:8px;
      width:76px;
      height:76px;
      border-radius:28px 28px 25px 25px;
      background:
        radial-gradient(circle at 28% 22%, rgba(255,255,255,.95), transparent 18%),
        linear-gradient(135deg,#f8fbff,#c7ddff);
      border:2px solid #123a72;
      box-shadow:
        0 14px 28px rgba(18,58,114,.20),
        inset 0 -8px 18px rgba(37,99,235,.10);
      animation:dashPanjiHead 3.4s ease-in-out infinite;
    }

    @keyframes dashPanjiHead{
      0%,100%{transform:translateY(0);}
      50%{transform:translateY(-3px);}
    }

    .dash-panji-hat{
      position:absolute;
      left:9px;
      top:-14px;
      width:58px;
      height:26px;
      border-radius:12px 12px 8px 8px;
      background:linear-gradient(135deg,#123a72,#2563eb);
      color:#fff;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:11px;
      font-weight:950;
      letter-spacing:.08em;
      box-shadow:0 8px 16px rgba(18,58,114,.22);
    }

    .dash-panji-eye{
      position:absolute;
      top:34px;
      width:12px;
      height:16px;
      border-radius:999px;
      background:#102544;
      animation:dashPanjiBlink 4.8s infinite;
    }

    .dash-panji-eye-left{left:21px;}
    .dash-panji-eye-right{right:21px;}

    @keyframes dashPanjiBlink{
      0%,91%,100%{transform:scaleY(1);}
      94%{transform:scaleY(.12);}
      96%{transform:scaleY(1);}
    }

    .dash-panji-mouth{
      position:absolute;
      left:31px;
      bottom:17px;
      width:16px;
      height:8px;
      border-bottom:3px solid #102544;
      border-radius:0 0 999px 999px;
    }

    .dash-panji-body{
      position:absolute;
      left:24px;
      top:84px;
      width:60px;
      height:45px;
      border-radius:21px 21px 17px 17px;
      background:linear-gradient(135deg,#123a72,#2f9a8f);
      border:2px solid rgba(255,255,255,.88);
      box-shadow:0 14px 24px rgba(15,23,42,.18);
      animation:dashPanjiBreath 2.6s ease-in-out infinite;
    }

    @keyframes dashPanjiBreath{
      0%,100%{transform:scale(1);}
      50%{transform:scale(1.025);}
    }

    .dash-panji-badge{
      position:absolute;
      left:50%;
      top:50%;
      transform:translate(-50%,-50%);
      width:30px;
      height:30px;
      border-radius:999px;
      background:#fff;
      color:#123a72;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:11px;
      font-weight:950;
    }

    .dash-panji-hand{
      position:absolute;
      top:94px;
      width:18px;
      height:34px;
      border-radius:999px;
      background:linear-gradient(135deg,#c7ddff,#f8fbff);
      border:2px solid #123a72;
    }

    .dash-panji-hand-left{
      left:8px;
      transform:rotate(24deg);
    }

    .dash-panji-hand-right{
      right:8px;
      transform-origin:top center;
      animation:dashPanjiWave 1.8s ease-in-out infinite;
    }

    @keyframes dashPanjiWave{
      0%,100%{transform:rotate(-18deg);}
      50%{transform:rotate(-46deg);}
    }

    .dash-panji-talking .dash-panji-mouth{
      animation:dashPanjiTalk .22s ease-in-out infinite;
    }

    @keyframes dashPanjiTalk{
      0%,100%{
        height:5px;
        width:15px;
        left:31px;
        bottom:17px;
        border-bottom:3px solid currentColor;
        border-top:none;
        border-left:none;
        border-right:none;
        border-radius:0 0 999px 999px;
        background:transparent;
      }

      50%{
        height:15px;
        width:20px;
        left:28px;
        bottom:12px;
        border:3px solid currentColor;
        border-radius:999px;
        background:rgba(15,23,42,.08);
      }
    }

    .dash-panji-happy .dash-panji-head{
      background:
        radial-gradient(circle at 28% 22%, rgba(255,255,255,.95), transparent 18%),
        linear-gradient(135deg,#ecfdf5,#bbf7d0);
      border-color:#16a34a;
    }

    .dash-panji-happy .dash-panji-eye{
      height:8px;
      top:40px;
      background:transparent;
      border-bottom:4px solid #166534;
      animation:none;
    }

    .dash-panji-sad .dash-panji-head{
      background:
        radial-gradient(circle at 28% 22%, rgba(255,255,255,.95), transparent 18%),
        linear-gradient(135deg,#fff1f2,#fecdd3);
      border-color:#dc2626;
    }

    .dash-panji-sad .dash-panji-eye-left::after,
    .dash-panji-sad .dash-panji-eye-right::after{
      content:"";
      position:absolute;
      left:3px;
      top:13px;
      width:6px;
      height:10px;
      border-radius:999px;
      background:linear-gradient(180deg,#93c5fd,#38bdf8);
      animation:dashPanjiTear 1.1s ease-in-out infinite;
    }

    @keyframes dashPanjiTear{
      0%{opacity:0;transform:translateY(-4px) scale(.7);}
      25%{opacity:1;}
      100%{opacity:0;transform:translateY(16px) scale(1);}
    }

    .dash-panji-thinking .dash-panji-character::after{
      content:"?";
      position:absolute;
      right:0;
      top:0;
      width:28px;
      height:28px;
      border-radius:999px;
      display:flex;
      align-items:center;
      justify-content:center;
      background:#fef3c7;
      color:#92400e;
      font-weight:950;
      box-shadow:0 8px 18px rgba(15,23,42,.14);
      animation:dashPanjiQuestion 1.1s ease-in-out infinite;
    }

    @keyframes dashPanjiQuestion{
      0%,100%{transform:translateY(0) scale(1);}
      50%{transform:translateY(-7px) scale(1.08);}
    }

    .dash-panji-intro .dash-panji-character{
      animation:dashPanjiIntro .85s cubic-bezier(.2,.8,.2,1);
    }

    @keyframes dashPanjiIntro{
      0%{opacity:0;transform:translateY(38px) scale(.82) rotate(-8deg);}
      60%{opacity:1;transform:translateY(-10px) scale(1.05) rotate(4deg);}
      100%{opacity:1;transform:translateY(0) scale(1) rotate(0deg);}
    }

    .panji-elegant-focus{
      position:relative !important;
      z-index:20 !important;
      outline:3px solid rgba(37,99,235,.88) !important;
      outline-offset:5px !important;
      box-shadow:
        0 0 0 8px rgba(37,99,235,.12),
        0 0 28px rgba(37,99,235,.30),
        0 18px 36px rgba(15,23,42,.12) !important;
      border-radius:18px !important;
      animation:panjiElegantPulse 1.2s ease-in-out infinite !important;
    }

    @keyframes panjiElegantPulse{
      0%,100%{
        outline-color:rgba(37,99,235,.88);
        box-shadow:
          0 0 0 7px rgba(37,99,235,.12),
          0 0 22px rgba(37,99,235,.25),
          0 18px 36px rgba(15,23,42,.10);
      }

      50%{
        outline-color:rgba(14,165,233,.95);
        box-shadow:
          0 0 0 12px rgba(14,165,233,.14),
          0 0 34px rgba(14,165,233,.32),
          0 18px 36px rgba(15,23,42,.12);
      }
    }

    @media(max-width:1400px){
      .dash-panji{
        right:24px;
      }

      .dash-panji-bubble{
        width:320px;
        max-height:240px;
      }

      .dash-panji-character{
        width:102px;
        height:132px;
      }
    }

    @media(max-width:900px){
      .dash-panji{
        right:12px;
        bottom:var(--dash-panji-bottom, 92px);
      }

      .dash-panji-bubble{
        width:286px;
      }
    }
  `;

  document.head.appendChild(style);
}

function renderIframePage(page) {
  destroyDashboardPanji();

  contentArea.innerHTML = `
    <section class="embed-card">
      <h3>${escapeHtml(page.title)}</h3>
      <div class="page-note">Halaman dimuat dari project/modul yang sudah ada.</div>

      <div class="embed-frame-wrap">
        <iframe
          class="embed-frame"
          src="${escapeHtml(page.url)}"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade">
        </iframe>
      </div>
    </section>
  `;

  requestAnimationFrame(initScrollAnimation);
}

function renderPlaceholderPage(pageKey, page) {
  destroyDashboardPanji();

  contentArea.innerHTML = `
    <section class="card">
      <h3>${escapeHtml(page.title)}</h3>

      <div class="placeholder-grid">
        <div class="placeholder-box">
          <h4>Modul belum dihubungkan</h4>
          <p>
            Halaman ini sudah disiapkan di portal utama.
            Route aktif: <b>${escapeHtml(pageKey)}</b>.
          </p>
        </div>

        <div class="placeholder-box">
          <h4>Langkah berikutnya</h4>
          <p>
            Ubah route ini menjadi <b>module</b> atau <b>iframe</b>
            saat halaman detail sudah tersedia.
          </p>
        </div>
      </div>
    </section>
  `;

  requestAnimationFrame(initScrollAnimation);
}

function renderQuickCard(icon, bg, title, text, route) {
  return `
    <button class="quick-card" type="button" data-quick="${escapeHtml(route)}" data-panji-topic="${escapeHtml(route)}">
      <div class="quick-icon" style="background:${escapeHtml(bg)}">${escapeHtml(icon)}</div>

      <div>
        <div class="quick-title">${escapeHtml(title)}</div>
        <div class="quick-text">${escapeHtml(text)}</div>
      </div>

      <div class="quick-arrow">›</div>
    </button>
  `;
}

/* =========================================================
   MODULE LOADER
   ========================================================= */

function cleanupDynamicModule() {
  closeFlyout();
  destroyDashboardPanji();

  if (typeof scrollAnimationDestroy === 'function') {
    scrollAnimationDestroy();
    scrollAnimationDestroy = null;
  }

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
  showModuleLoading(page.title || 'Memuat modul...');

  try {
    if (Array.isArray(page.externalScripts) && page.externalScripts.length) {
      for (const src of page.externalScripts) {
        await loadExternalScriptOnce(src);
      }
    }

    const response = await fetch(cacheBust(page.html), {
      cache: 'no-cache'
    });

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
        link.href = cacheBust(page.css);
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

        script.src = cacheBust(page.js);
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

    requestAnimationFrame(initScrollAnimation);
  } catch (error) {
    console.error('Gagal memuat module:', error);

    contentArea.innerHTML = `
      <section class="card">
        <h3>Gagal memuat modul</h3>
        <p>File modul tidak bisa dimuat. Cek path HTML, CSS, JS, atau inisialisasi modul.</p>
        <p><b>Detail:</b> ${escapeHtml(error.message)}</p>
      </section>
    `;
  }
}

/* =========================================================
   ROUTER
   ========================================================= */

async function loadPage(key) {
  if (loadingPageKey === key) return;

  const page = APP_ROUTES[key] || APP_ROUTES.dashboard;

  loadingPageKey = key;
  activePageKey = key;

  updateActiveMenu(key);

  if (page.type !== 'module') {
    cleanupDynamicModule();
    contentArea.classList.remove('module-mode');
  } else {
    contentArea.classList.add('module-mode');
  }

  try {
    if (page.type === 'iframe') {
      renderIframePage(page);
    } else if (page.type === 'module') {
      await renderModulePage(page);
    } else if (page.type === 'placeholder') {
      renderPlaceholderPage(key, page);
    } else {
      await renderDashboard();
    }
  } finally {
    loadingPageKey = '';

    if (window.innerWidth <= 980 && sidebar) {
      sidebar.classList.remove('mobile-open');
    }
  }
}

/* =========================================================
   SIDEBAR + MENU
   ========================================================= */

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
    if (group) {
      group.classList.add('open');
    }
  }
}

function closeFlyout() {
  if (activeFlyout) {
    activeFlyout.remove();
    activeFlyout = null;
  }
}

function bindMenu() {
  document.querySelectorAll('[data-page]').forEach((button) => {
    if (button.dataset.menuBound === '1') return;

    button.dataset.menuBound = '1';

    button.addEventListener('click', () => {
      const pageKey = button.dataset.page;
      if (pageKey) {
        loadPage(pageKey);
      }
    });
  });

  document.querySelectorAll('[data-toggle-group]').forEach((button) => {
    if (button.dataset.toggleBound === '1') return;

    button.dataset.toggleBound = '1';

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

  if (sidebarToggleButton && sidebar && sidebarToggleButton.dataset.sidebarBound !== '1') {
    sidebarToggleButton.dataset.sidebarBound = '1';

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
    simulasi: 'Simulasi',
    itkp: 'ITKP',
    realisasi: 'Realisasi Paket'
  };

  flyout.innerHTML = `
    <div class="sidebar-flyout-title">${escapeHtml(titleMap[groupName] || 'Menu')}</div>

    ${Array.from(submenuLinks).map((link) => {
      const isActive = link.classList.contains('active') ? ' active' : '';

      return `
        <button class="flyout-link${isActive}" type="button" data-page="${escapeHtml(link.dataset.page)}">
          ${escapeHtml(link.textContent)}
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

      const pageKey = btn.dataset.page;
      if (pageKey) {
        loadPage(pageKey);
      }
    });
  });

  activeFlyout = flyout;
}

/* =========================================================
   BOOT
   ========================================================= */

bindMenu();
loadPage('dashboard');
