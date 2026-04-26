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
    subtitle: 'Monitoring indikator pemanfaatan eKatalog, Toko Daring, dan e-Purchasing.',
    type: 'module',
    html: 'modules/monitoring/itkp-ekatalog/itkp-ekatalog.html',
    css: 'modules/monitoring/itkp-ekatalog/itkp-ekatalog.css',
    js: 'modules/monitoring/itkp-ekatalog/itkp-ekatalog.js'
  },

  'monitoring-etendering': {
    title: 'Monitoring eTendering',
    subtitle: 'Monitoring indikator pemanfaatan eTendering.',
    type: 'module',
    html: 'modules/monitoring/itkp-etendering/itkp-etendering.html',
    css: 'modules/monitoring/itkp-etendering/itkp-etendering.css',
    js: 'modules/monitoring/itkp-etendering/itkp-etendering.js'
  },

  'monitoring-ekontrak': {
    title: 'Monitoring eKontrak',
    subtitle: 'Monitoring indikator pemanfaatan eKontrak.',
    type: 'module',
    html: 'modules/monitoring/itkp-ekontrak/itkp-ekontrak.html',
    css: 'modules/monitoring/itkp-ekontrak/itkp-ekontrak.css',
    js: 'modules/monitoring/itkp-ekontrak/itkp-ekontrak.js'
  },

  'monitoring-nontender': {
    title: 'Monitoring Non Tender',
    subtitle: 'Monitoring Non eTendering/Non ePurchasing.',
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
const sidebarToggleButton =
  document.getElementById('sidebarToggleButton') ||
  document.getElementById('menuButton');

let activeModuleToken = 0;
let currentModuleDestroy = null;
let activeFlyout = null;
let activePageKey = '';
let loadingPageKey = '';
let scrollAnimationDestroy = null;
let dashboardPanjiDestroy = null;

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
  data: null,
  selectedItkpSatker: 'PEMERINTAH KOTA BOGOR'
};

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

function normalizeHeader(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s%()-]/g, '')
    .trim();
}

function getField(row, candidates) {
  const map = row && row.__normalized ? row.__normalized : {};

  for (const candidate of candidates) {
    const key = normalizeHeader(candidate);
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      return map[key];
    }
  }

  const wanted = candidates.map(normalizeHeader);

  for (const [key, value] of Object.entries(map)) {
    if (wanted.some((item) => key.includes(item) || item.includes(key))) {
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

function formatScore(value) {
  return toNumber(value).toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatPercent(value) {
  return `${toNumber(value).toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}%`;
}

function formatMoney(value) {
  const number = toNumber(value);

  if (number >= 1_000_000_000_000) {
    return `Rp ${(number / 1_000_000_000_000).toLocaleString('id-ID', {
      maximumFractionDigits: 2
    })} T`;
  }

  if (number >= 1_000_000_000) {
    return `Rp ${(number / 1_000_000_000).toLocaleString('id-ID', {
      maximumFractionDigits: 2
    })} M`;
  }

  if (number >= 1_000_000) {
    return `Rp ${(number / 1_000_000).toLocaleString('id-ID', {
      maximumFractionDigits: 2
    })} Jt`;
  }

  return `Rp ${formatNumber(number)}`;
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

      if (row.some((cell) => String(cell).trim() !== '')) {
        rows.push(row);
      }

      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  row.push(value);

  if (row.some((cell) => String(cell).trim() !== '')) {
    rows.push(row);
  }

  return rows;
}

async function fetchSheetRows(config) {
  const url = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/gviz/tq?tqx=out:csv&gid=${config.gid}&v=${Date.now()}`;
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Gagal mengambil ${config.title}. HTTP ${response.status}`);
  }

  const text = await response.text();

  if (/googlevisualization|DOCTYPE html|<html/i.test(text.slice(0, 400))) {
    throw new Error(`${config.title} belum bisa dibaca publik. Pastikan spreadsheet dapat diakses viewer.`);
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

function sum(values) {
  return values.reduce((total, value) => total + toNumber(value), 0);
}

function groupSum(rows, keyGetter, valueGetter) {
  const map = new Map();

  rows.forEach((row) => {
    const key = String(keyGetter(row) || 'Tidak Terisi').trim() || 'Tidak Terisi';
    const prev = map.get(key) || {
      name: key,
      count: 0,
      value: 0
    };

    prev.count += 1;
    prev.value += toNumber(valueGetter(row));
    map.set(key, prev);
  });

  return Array.from(map.values()).sort((a, b) => b.value - a.value);
}

function normalizeSatkerName(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

function isCityAggregateName(name) {
  return normalizeSatkerName(name) === 'PEMERINTAH KOTA BOGOR';
}

function findNumericByHeader(row, requiredWords = [], optionalWords = []) {
  const map = row && row.__normalized ? row.__normalized : {};
  const required = requiredWords.map(normalizeHeader).filter(Boolean);
  const optional = optionalWords.map(normalizeHeader).filter(Boolean);

  let bestValue = 0;
  let bestWeight = -1;

  Object.entries(map).forEach(([key, value]) => {
    const number = toNumber(value);

    if (!Number.isFinite(number) || number <= 0) return;

    const matched = required.every((word) => key.includes(word));
    if (!matched) return;

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
      return !key.includes('total rup') &&
        !key.includes('total komitmen') &&
        !key.includes('total pagu') &&
        !key.includes('total realisasi') &&
        !key.includes('paket') &&
        !key.includes('pagu');
    })
    .map(([, value]) => toNumber(value))
    .filter((value) => Number.isFinite(value) && value > 0 && value <= 30);

  return values.length ? values[values.length - 1] : 0;
}

function getItkpScore(row) {
  const exactValue = toNumber(getField(row || {}, [
    'Nilai ITKP Indikator Pemanfaatan Sistem - skor maksimal 30 (point)',
    'Nilai ITKP - Pemanfaatan Sistem - skor maksimal 30 (point)',
    'Nilai ITKP Pemanfaatan Sistem - skor maksimal 30 (point)',
    'Nilai ITKP Pemanfaatan Sistem',
    'Nilai ITKP Indikator Pemanfaatan Sistem',
    'Pemanfaatan Sistem - skor maksimal 30',
    'Pemanfaatan Sistem'
  ]));

  if (exactValue > 0) return exactValue;

  const headerValue = findNumericByHeader(
    row || {},
    ['nilai itkp', 'pemanfaatan sistem'],
    ['skor maksimal 30', '30', 'point']
  );

  if (headerValue > 0) return headerValue;

  if (isCityAggregateName(getField(row || {}, ['Satuan Kerja', 'Nama Satuan Kerja', 'nama_satker']))) {
    return getLastReasonableItkpNumber(row || {});
  }

  return 0;
}

function getIndicatorStatus(value, max) {
  const percent = max > 0 ? (toNumber(value) / max) * 100 : 0;

  if (toNumber(value) <= 0) {
    return {
      label: 'Belum Terdeteksi',
      tone: 'danger',
      text: 'Data belum terlihat atau masih nol. Perlu cek sumber data dan pencatatan.'
    };
  }

  if (percent >= 85) {
    return {
      label: 'Sangat Baik',
      tone: 'success',
      text: 'Capaian sudah kuat dan perlu dipertahankan.'
    };
  }

  if (percent >= 70) {
    return {
      label: 'Baik',
      tone: 'good',
      text: 'Capaian cukup aman, tetapi masih bisa dioptimalkan.'
    };
  }

  if (percent >= 50) {
    return {
      label: 'Cukup',
      tone: 'warning',
      text: 'Capaian belum rendah, tetapi perlu penguatan.'
    };
  }

  return {
    label: 'Butuh Perhatian',
    tone: 'danger',
    text: 'Capaian masih rendah dan perlu diprioritaskan.'
  };
}

function getTotalStatus(score) {
  const value = toNumber(score);

  if (value >= 24) {
    return {
      label: 'Sangat Baik',
      tone: 'success',
      icon: '🏆'
    };
  }

  if (value >= 18) {
    return {
      label: 'Baik',
      tone: 'good',
      icon: '✅'
    };
  }

  if (value >= 12) {
    return {
      label: 'Cukup',
      tone: 'warning',
      icon: '⚠️'
    };
  }

  return {
    label: 'Butuh Perhatian',
    tone: 'danger',
    icon: '🚨'
  };
}

function buildItkpProfile(row, fallbackName = 'PEMERINTAH KOTA BOGOR') {
  const name = getField(row || {}, [
    'Satuan Kerja',
    'Nama Satuan Kerja',
    'nama_satker'
  ]) || fallbackName;

  const dimensions = [
    {
      name: 'SiRUP',
      value: toNumber(getField(row || {}, [
        'Nilai ITKP - skor maksimal 10 (point) (SIRUP)',
        'SIRUP',
        'sirup'
      ])),
      max: 10,
      route: 'monitoring-sirup',
      desc: 'Menggambarkan pemanfaatan SiRUP/RUP sebagai dasar perencanaan dan pengumuman paket.'
    },
    {
      name: 'Toko Daring',
      value: toNumber(getField(row || {}, [
        'Nilai ITKP - skor maksimal 1 (point) (Toko Daring)',
        'Toko Daring',
        'toko daring'
      ])),
      max: 1,
      route: 'monitoring-ekatalog',
      desc: 'Menggambarkan pemanfaatan kanal belanja digital sederhana melalui Toko Daring.'
    },
    {
      name: 'e-Purchasing',
      value: toNumber(getField(row || {}, [
        'Nilai ITKP - skor maksimal 4 (point) (Epurchasing)',
        'Epurchasing',
        'ePurchasing',
        'e-Purchasing'
      ])),
      max: 4,
      route: 'monitoring-ekatalog',
      desc: 'Menggambarkan pemanfaatan e-Katalog/e-Purchasing untuk paket yang sesuai katalog.'
    },
    {
      name: 'e-Tendering',
      value: toNumber(getField(row || {}, [
        'Nilai ITKP - skor maksimal 5 (point) (etendering)',
        'eTendering',
        'e-Tendering'
      ])),
      max: 5,
      route: 'monitoring-etendering',
      desc: 'Menggambarkan pemanfaatan SPSE untuk proses tender/seleksi.'
    },
    {
      name: 'e-Kontrak',
      value: toNumber(getField(row || {}, [
        'Nilai ITKP - skor maksimal 5 (point) (ekontrak)',
        'eKontrak',
        'e-Kontrak'
      ])),
      max: 5,
      route: 'monitoring-ekontrak',
      desc: 'Menggambarkan pencatatan kontrak secara elektronik setelah proses pemilihan selesai.'
    },
    {
      name: 'Non Tender',
      value: toNumber(getField(row || {}, [
        'Nilai ITKP - skor maksimal 5 (point) (Non etendering & Non ePurchasing)',
        'Non etendering',
        'Non ePurchasing',
        'Non Tender'
      ])),
      max: 5,
      route: 'monitoring-nontender',
      desc: 'Menggambarkan ketertiban pencatatan paket Non Tender/Non e-Purchasing.'
    }
  ];

  return {
    name,
    score: getItkpScore(row || {}),
    dimensions,
    __sourceRow: row || {}
  };
}

function analyzeDashboardData(raw) {
  const itkpAllRows = raw.itkp || [];
  const itkpSubRows = raw.itkpSubOpd || [];
  const planningRows = raw.perencanaan || [];
  const realRows = raw.realisasi || [];

  const getSatker = (row) => getField(row, [
    'Satuan Kerja',
    'Nama Satuan Kerja',
    'nama_satker'
  ]);

  const getMetode = (row) => getField(row, [
    'Metode Pengadaan',
    'mtd_pemilihan',
    'Sumber Transaksi',
    'Metode'
  ]);

  const getPagu = (row) => getField(row, [
    'Nilai Pagu',
    'Pagu',
    'Total Pagu',
    'pagu'
  ]);

  const getRealisasi = (row) => getField(row, [
    'Nilai Realisasi',
    'Total Realisasi',
    'nilai_realisasi',
    'Realisasi'
  ]);

  const getStatus = (row) => getField(row, [
    'Status Paket',
    'status_paket',
    'Status'
  ]);

  const itkpOpdRows = itkpAllRows.filter((row) => !isCityAggregateName(getSatker(row)));
  const cityRow = itkpAllRows.find((row) => isCityAggregateName(getSatker(row))) || null;
  const cityProfile = buildItkpProfile(cityRow || {}, 'PEMERINTAH KOTA BOGOR');

  const profiles = [cityProfile]
    .concat(itkpOpdRows.map((row) => buildItkpProfile(row, getSatker(row))))
    .filter((profile) => profile.name);

  const selectedName = DASHBOARD_STATE.selectedItkpSatker || cityProfile.name;
  const selectedProfile = profiles.find((profile) => profile.name === selectedName) || cityProfile;

  DASHBOARD_STATE.selectedItkpSatker = selectedProfile.name;

  const selectedIsCity = isCityAggregateName(selectedProfile.name);
  const selectedKey = normalizeSatkerName(selectedProfile.name);

  const isSelectedSatkerRow = (row) => {
    if (selectedIsCity) return true;
    return normalizeSatkerName(getSatker(row)) === selectedKey;
  };

  const scopedPlanningRows = planningRows.filter(isSelectedSatkerRow);
  const scopedRealRows = realRows.filter(isSelectedSatkerRow);

  const totalPagu = sum(scopedPlanningRows.map(getPagu));
  const totalRealisasi = sum(scopedRealRows.map(getRealisasi));
  const realisasiPersen = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;

  const selesaiRows = scopedRealRows.filter((row) => /selesai|completed|paket selesai/i.test(getStatus(row)));
  const processRows = scopedRealRows.filter((row) => /process|proses|berlangsung|sedang/i.test(getStatus(row)));
  const bastRows = scopedRealRows.filter((row) => {
    const value = String(getField(row, ['BAST', 'dok_realisasi', 'Dokumen Realisasi'])).trim();
    return value && value !== '-';
  });

  const rankingSourceRows = itkpSubRows.length ? itkpSubRows : itkpOpdRows;

  const scoreRows = rankingSourceRows
    .map((row) => ({
      name: getSatker(row),
      score: getItkpScore(row)
    }))
    .filter((item) => item.name && !isCityAggregateName(item.name));

  const topItkp = [...scoreRows].sort((a, b) => b.score - a.score).slice(0, 8);
  const lowItkp = [...scoreRows].sort((a, b) => a.score - b.score).slice(0, 8);

  const byMetodePlanning = groupSum(scopedPlanningRows, getMetode, getPagu);
  const byMetodeReal = groupSum(scopedRealRows, getMetode, getRealisasi);
  const weakestIndicators = getWeakestIndicators(selectedProfile);
  const strongestIndicators = getStrongestIndicators(selectedProfile);

  return {
    cityProfile,
    selectedProfile,
    itkpProfiles: profiles,
    itkpOverall: cityProfile.score,
    scopeName: selectedProfile.name,
    scopeIsCity: selectedIsCity,
    totalOpd: itkpOpdRows.length,
    totalSubOpd: itkpSubRows.length,
    totalPaketRup: scopedPlanningRows.length,
    totalPaketRealisasi: scopedRealRows.length,
    totalPagu,
    totalRealisasi,
    realisasiPersen,
    selesaiCount: selesaiRows.length,
    processCount: processRows.length,
    bastCount: bastRows.length,
    scopedPlanningRows,
    scopedRealRows,
    byMetodePlanning,
    byMetodeReal,
    topItkp,
    lowItkp,
    weakestIndicators,
    strongestIndicators
  };
}

function getWeakestIndicators(profile) {
  return [...(profile.dimensions || [])]
    .map((item) => ({
      ...item,
      percent: item.max > 0 ? (item.value / item.max) * 100 : 0,
      status: getIndicatorStatus(item.value, item.max)
    }))
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 3);
}

function getStrongestIndicators(profile) {
  return [...(profile.dimensions || [])]
    .map((item) => ({
      ...item,
      percent: item.max > 0 ? (item.value / item.max) * 100 : 0,
      status: getIndicatorStatus(item.value, item.max)
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3);
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

    DASHBOARD_STATE.data = analyzeDashboardData({
      itkp,
      itkpSubOpd,
      perencanaan,
      realisasi
    });

    DASHBOARD_STATE.loadedAt = new Date();
    return DASHBOARD_STATE.data;
  } catch (error) {
    DASHBOARD_STATE.error = error;
    throw error;
  } finally {
    DASHBOARD_STATE.loading = false;
  }
}

function renderDashboardSkeleton() {
  contentArea.innerHTML = `
    <section class="hero-card hero-card--dashboard">
      <div class="hero-kicker">TRAXPBJ · Procurement Intelligence</div>
      <h3>Dashboard Profil Pengadaan Barang/Jasa Kota Bogor</h3>
      <p>Memuat data ITKP, perencanaan, realisasi, dan indikator pemanfaatan sistem.</p>

      <div class="dashboard-loading">
        <div class="loading-orb"></div>
        <div>
          <b>Memuat data dashboard...</b>
          <span>PANJI sedang membaca data satuan kerja.</span>
        </div>
      </div>
    </section>
  `;
}

function renderDashboardError(error) {
  destroyDashboardPanji();

  contentArea.innerHTML = `
    <section class="hero-card hero-card--dashboard">
      <div class="hero-kicker">TRAXPBJ · Dashboard</div>
      <h3>Data dashboard belum bisa dimuat</h3>
      <p>${escapeHtml(error.message || 'Terjadi kendala saat mengambil data.')}</p>
      <div class="hero-actions">
        <button class="lux-button lux-button--light" type="button" id="retryDashboardButton">Coba Muat Ulang</button>
      </div>
    </section>

    <section class="card">
      <h3>Yang perlu dicek</h3>
      <div class="insight-list">
        <div class="insight-item">
          <b>1. Akses Google Sheet</b>
          <span>Pastikan sheet bisa dibaca sebagai viewer.</span>
        </div>
        <div class="insight-item">
          <b>2. GID dan header</b>
          <span>Pastikan header ITKP, Satuan Kerja, Nilai Pagu, Nilai Realisasi, dan Metode tidak berubah.</span>
        </div>
      </div>
    </section>
  `;

  const retry = document.getElementById('retryDashboardButton');
  if (retry) {
    retry.addEventListener('click', () => {
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
  const lastUpdate = DASHBOARD_STATE.loadedAt
    ? DASHBOARD_STATE.loadedAt.toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
    : '-';

  const profile = data.selectedProfile;
  const totalStatus = getTotalStatus(profile.score);
  const scopeLabel = data.scopeIsCity ? 'Kota Bogor' : profile.name;

  contentArea.innerHTML = `
    <section class="hero-card hero-card--dashboard">
      <div class="hero-topline">
        <div>
          <div class="hero-kicker">TRAXPBJ · Dashboard Satuan Kerja</div>
          <h3>Dashboard Profil Pengadaan Barang/Jasa Kota Bogor</h3>
          <p>Dashboard ini membaca Pemanfaatan Sistem ITKP, profil perencanaan, realisasi, metode pengadaan, dan kondisi satuan kerja. PANJI akan membantu menjelaskan capaian dan prioritas perbaikannya.</p>
        </div>

        <div class="hero-badge">
          <span>Update</span>
          <b>${escapeHtml(lastUpdate)}</b>
        </div>
      </div>

      <div class="stats-grid dashboard-kpi-grid">
        ${renderKpiCard('Skor ITKP', formatScore(profile.score), `${escapeHtml(totalStatus.label)} · ${escapeHtml(scopeLabel)}`, totalStatus.icon)}
        ${renderKpiCard('Pagu Perencanaan', formatMoney(data.totalPagu), `${formatNumber(data.totalPaketRup)} paket`, '🧾')}
        ${renderKpiCard('Realisasi', formatMoney(data.totalRealisasi), `${formatPercent(data.realisasiPersen)} dari pagu`, '💰')}
        ${renderKpiCard('Paket Realisasi', formatNumber(data.totalPaketRealisasi), `${formatNumber(data.selesaiCount)} selesai · ${formatNumber(data.processCount)} proses`, '📦')}
      </div>

      <div class="hero-actions">
        <button class="lux-button lux-button--light" type="button" id="refreshDashboardButton">Refresh Data</button>
        <button class="lux-button lux-button--ghost" type="button" data-quick="monitoring-sirup">Buka SiRUP</button>
        <button class="lux-button lux-button--ghost" type="button" data-quick="monitoring-ekatalog">Buka eKatalog</button>
        <button class="lux-button lux-button--ghost" type="button" data-quick="simulasi-procurement-stacker">Buka PANJI Game</button>
      </div>
    </section>

    <section class="dashboard-grid dashboard-grid--main">
      <div class="card procurement-map-card">
        <div class="section-title-row section-title-row--select">
          <div>
            <span class="section-kicker">Pemanfaatan Sistem ITKP</span>
            <h3>Profil Satuan Kerja</h3>
            <p class="section-subnote">Pilih satuan kerja, lalu PANJI akan menjelaskan capaian SiRUP, Toko Daring, e-Purchasing, e-Tendering, e-Kontrak, dan Non Tender.</p>
          </div>

          <label class="satker-select-wrap">
            <span>Pilih Satuan Kerja</span>
            <select id="itkpSatkerSelect" class="satker-select">
              ${data.itkpProfiles.map((item) => `
                <option value="${escapeHtml(item.name)}" ${item.name === profile.name ? 'selected' : ''}>
                  ${escapeHtml(item.name)}
                </option>
              `).join('')}
            </select>
          </label>
        </div>

        <div class="itkp-radar-layout">
          <div class="score-orbit">
            <div class="score-ring" style="--score:${Math.min(100, (profile.score / 30) * 100)}">
              <div class="score-core">
                <span>${escapeHtml(totalStatus.label)}</span>
                <b>${formatScore(profile.score)}</b>
                <small>dari 30 poin</small>
              </div>
            </div>
            <div class="score-caption">${escapeHtml(profile.name)}</div>
          </div>

          <div class="dimensions dimensions--lux dimensions--clickable">
            ${profile.dimensions.map(renderDimension).join('')}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="section-title-row">
          <div>
            <span class="section-kicker">Analisis PANJI</span>
            <h3>Kondisi Singkat</h3>
          </div>
          <span class="soft-pill soft-pill--${escapeHtml(totalStatus.tone)}">${escapeHtml(totalStatus.label)}</span>
        </div>

        <div class="panji-analysis-box">
          ${renderDashboardAnalysis(data)}
        </div>

        <div class="hero-actions hero-actions--compact">
          <button class="lux-button lux-button--light" type="button" id="panjiExplainDashboardButton">PANJI Jelaskan Dashboard</button>
          <button class="lux-button lux-button--ghost" type="button" id="panjiRecommendationButton">Minta Rekomendasi</button>
        </div>
      </div>
    </section>

    <section class="dashboard-grid dashboard-grid--two">
      <div class="card">
        <div class="section-title-row">
          <div>
            <span class="section-kicker">Prioritas Perbaikan</span>
            <h3>Indikator yang Perlu Diperhatikan</h3>
          </div>
        </div>

        <div class="insight-list">
          ${data.weakestIndicators.map(renderIndicatorInsight).join('')}
        </div>
      </div>

      <div class="card">
        <div class="section-title-row">
          <div>
            <span class="section-kicker">Capaian Kuat</span>
            <h3>Indikator Terbaik</h3>
          </div>
        </div>

        <div class="insight-list">
          ${data.strongestIndicators.map(renderIndicatorInsight).join('')}
        </div>
      </div>
    </section>

    <section class="dashboard-grid dashboard-grid--two">
      <div class="card">
        <div class="section-title-row">
          <div>
            <span class="section-kicker">Perencanaan · ${escapeHtml(scopeLabel)}</span>
            <h3>Komposisi Pagu per Metode</h3>
          </div>
        </div>
        ${renderLiteTable(data.byMetodePlanning, 'Metode', 'Pagu', 'value', formatMoney)}
      </div>

      <div class="card">
        <div class="section-title-row">
          <div>
            <span class="section-kicker">Realisasi · ${escapeHtml(scopeLabel)}</span>
            <h3>Komposisi Realisasi per Metode</h3>
          </div>
        </div>
        ${renderLiteTable(data.byMetodeReal, 'Metode', 'Realisasi', 'value', formatMoney)}
      </div>
    </section>

    <section class="dashboard-grid dashboard-grid--two">
      <div class="card">
        <div class="section-title-row">
          <div>
            <span class="section-kicker">Ranking</span>
            <h3>Nilai ITKP Tertinggi</h3>
          </div>
        </div>
        ${renderRanking(data.topItkp, false)}
      </div>

      <div class="card">
        <div class="section-title-row">
          <div>
            <span class="section-kicker">Perlu Pembinaan</span>
            <h3>Nilai ITKP Terendah</h3>
          </div>
        </div>
        ${renderRanking(data.lowItkp, true)}
      </div>
    </section>

    <section class="quick-grid">
      ${renderQuickCard('📊', 'linear-gradient(135deg,#1d4ed8,#22d3ee)', 'ITKP - SiRUP', 'Cek pengumuman RUP dan indikator SiRUP.', 'monitoring-sirup')}
      ${renderQuickCard('🛒', 'linear-gradient(135deg,#0f766e,#22c55e)', 'eKatalog', 'Cek Toko Daring dan e-Purchasing.', 'monitoring-ekatalog')}
      ${renderQuickCard('🏗️', 'linear-gradient(135deg,#f97316,#f59e0b)', 'eTendering', 'Pantau tender dan seleksi.', 'monitoring-etendering')}
      ${renderQuickCard('📑', 'linear-gradient(135deg,#111827,#2563eb)', 'eKontrak', 'Pantau pencatatan kontrak.', 'monitoring-ekontrak')}
    </section>

    <div class="footer-note">© 2026 TRAXPBJ - Dashboard dibantu PANJI Pengadaan Jitu</div>
  `;
}

function renderKpiCard(label, value, desc, icon) {
  return `
    <div class="stat-card">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(value)}</div>
      <div class="desc">${escapeHtml(icon)} ${escapeHtml(desc)}</div>
    </div>
  `;
}

function renderDimension(item) {
  const percent = item.max > 0 ? Math.min(100, (item.value / item.max) * 100) : 0;
  const status = getIndicatorStatus(item.value, item.max);

  return `
    <button class="dim-row dim-row--button" type="button" data-indicator="${escapeHtml(item.name)}" data-route="${escapeHtml(item.route)}">
      <div>
        <b>${escapeHtml(item.name)}</b>
        <small>${escapeHtml(status.label)}</small>
      </div>
      <div class="bar">
        <span class="bar-fill bar-fill--${escapeHtml(status.tone)}" style="width:${percent}%"></span>
      </div>
      <div class="dim-score">
        ${formatScore(item.value)}
        <small>/ ${formatScore(item.max)}</small>
      </div>
    </button>
  `;
}

function renderDashboardAnalysis(data) {
  const profile = data.selectedProfile;
  const totalStatus = getTotalStatus(profile.score);
  const weak = data.weakestIndicators[0];
  const strong = data.strongestIndicators[0];

  return `
    <div class="analysis-main">
      <b>${escapeHtml(profile.name)}</b> berada pada kategori <b>${escapeHtml(totalStatus.label)}</b> dengan skor <b>${formatScore(profile.score)} dari 30</b>.
    </div>

    <div class="analysis-sub">
      Indikator terkuat saat ini adalah <b>${escapeHtml(strong ? strong.name : '-')}</b>.
      Indikator yang paling perlu perhatian adalah <b>${escapeHtml(weak ? weak.name : '-')}</b>.
      PANJI menyarankan satuan kerja mengecek kembali kelengkapan perencanaan, pemilihan metode, transaksi katalog/tender, kontrak, BAST, dan pencatatan realisasi.
    </div>
  `;
}

function renderIndicatorInsight(item) {
  const percent = item.max > 0 ? (item.value / item.max) * 100 : 0;
  const status = getIndicatorStatus(item.value, item.max);

  return `
    <button class="insight-item insight-item--click" type="button" data-indicator="${escapeHtml(item.name)}" data-route="${escapeHtml(item.route)}">
      <b>${escapeHtml(item.name)} · ${escapeHtml(status.label)}</b>
      <span>${formatScore(item.value)} dari ${formatScore(item.max)} poin (${formatPercent(percent)}). ${escapeHtml(item.desc)}</span>
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
    <div class="ranking-list">
      ${rows.map((item, index) => {
        const status = getTotalStatus(item.score);

        return `
          <div class="ranking-item ranking-item--${lowMode ? 'low' : 'top'}">
            <div class="ranking-number">${index + 1}</div>
            <div>
              <b>${escapeHtml(item.name)}</b>
              <span>${escapeHtml(status.label)}</span>
            </div>
            <strong>${formatScore(item.score)}</strong>
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

      if (DASHBOARD_STATE.data) {
        DASHBOARD_STATE.data = analyzeDashboardData({
          itkp: DASHBOARD_STATE.rawItkp || [],
          itkpSubOpd: DASHBOARD_STATE.rawItkpSubOpd || [],
          perencanaan: DASHBOARD_STATE.rawPerencanaan || [],
          realisasi: DASHBOARD_STATE.rawRealisasi || []
        });
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

  const panjiExplain = document.getElementById('panjiExplainDashboardButton');
  if (panjiExplain) {
    panjiExplain.addEventListener('click', () => {
      if (DASHBOARD_STATE.data) {
        dashboardPanjiSpeak(buildPanjiDashboardIntro(DASHBOARD_STATE.data), 'talking');
      }
    });
  }

  const panjiRecommendation = document.getElementById('panjiRecommendationButton');
  if (panjiRecommendation) {
    panjiRecommendation.addEventListener('click', () => {
      if (DASHBOARD_STATE.data) {
        dashboardPanjiSpeak(buildPanjiRecommendation(DASHBOARD_STATE.data), 'thinking');
      }
    });
  }
}

/* =========================================================
   PANJI DASHBOARD
   ========================================================= */

function initDashboardPanji(data, fromSelection = false) {
  injectDashboardPanjiCss();

  if (typeof dashboardPanjiDestroy === 'function') {
    dashboardPanjiDestroy();
    dashboardPanjiDestroy = null;
  }

  let panji = document.getElementById('dashboardPanji');

  if (!panji) {
    panji = document.createElement('div');
    panji.id = 'dashboardPanji';
    panji.className = 'dash-panji dash-panji-intro';
    document.body.appendChild(panji);
  }

  panji.innerHTML = `
    <div class="dash-panji-bubble">
      <button type="button" class="dash-panji-close" id="dashPanjiClose">×</button>

      <div class="dash-panji-top">
        <div class="dash-panji-name">PANJI · Pengadaan Jitu</div>
        <div class="dash-panji-emote" id="dashPanjiEmote">🤖</div>
      </div>

      <div class="dash-panji-text" id="dashPanjiText"></div>

      <div class="dash-panji-actions">
        <button type="button" id="dashPanjiExplain">Jelaskan Dashboard</button>
        <button type="button" id="dashPanjiAnalyze">Analisis OPD</button>
        <button type="button" id="dashPanjiAdvice">Rekomendasi</button>
        <button type="button" id="dashPanjiMini">Minimize</button>
      </div>
    </div>

    <button type="button" class="dash-panji-character" id="dashPanjiCharacter" title="PANJI Pengadaan Jitu">
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

  const close = document.getElementById('dashPanjiClose');
  const mini = document.getElementById('dashPanjiMini');
  const character = document.getElementById('dashPanjiCharacter');
  const explain = document.getElementById('dashPanjiExplain');
  const analyze = document.getElementById('dashPanjiAnalyze');
  const advice = document.getElementById('dashPanjiAdvice');

  const showBubble = () => {
    panji.classList.remove('dash-panji-minimized');
  };

  const minimize = () => {
    panji.classList.add('dash-panji-minimized');
  };

  close.addEventListener('click', minimize);
  mini.addEventListener('click', minimize);
  character.addEventListener('click', () => {
    showBubble();
    dashboardPanjiSpeak(buildPanjiDashboardIntro(data), 'talking');
  });

  explain.addEventListener('click', () => {
    showBubble();
    dashboardPanjiSpeak(buildPanjiDashboardIntro(data), 'talking');
  });

  analyze.addEventListener('click', () => {
    showBubble();
    dashboardPanjiSpeak(buildPanjiSatkerAnalysis(data), getPanjiMoodByData(data));
  });

  advice.addEventListener('click', () => {
    showBubble();
    dashboardPanjiSpeak(buildPanjiRecommendation(data), 'thinking');
  });

  initDashboardPanjiAutoPosition(panji);

  const firstText = fromSelection
    ? buildPanjiSatkerAnalysis(data)
    : buildPanjiWelcome(data);

  dashboardPanjiSpeak(firstText, fromSelection ? getPanjiMoodByData(data) : 'intro');

  dashboardPanjiDestroy = () => {
    if (panji && panji.parentNode) panji.remove();
  };
}

function destroyDashboardPanji() {
  if (typeof dashboardPanjiDestroy === 'function') {
    dashboardPanjiDestroy();
    dashboardPanjiDestroy = null;
  }
}

function dashboardPanjiSpeak(text, mood = 'talking') {
  const panji = document.getElementById('dashboardPanji');
  const textEl = document.getElementById('dashPanjiText');
  const emote = document.getElementById('dashPanjiEmote');

  if (!panji || !textEl) return;

  panji.classList.remove(
    'dash-panji-happy',
    'dash-panji-sad',
    'dash-panji-thinking',
    'dash-panji-talking',
    'dash-panji-intro'
  );

  if (mood === 'happy') {
    panji.classList.add('dash-panji-happy', 'dash-panji-talking');
    if (emote) emote.textContent = '😄';
  } else if (mood === 'sad') {
    panji.classList.add('dash-panji-sad', 'dash-panji-talking');
    if (emote) emote.textContent = '😢';
  } else if (mood === 'thinking') {
    panji.classList.add('dash-panji-thinking', 'dash-panji-talking');
    if (emote) emote.textContent = '🤔';
  } else if (mood === 'intro') {
    panji.classList.add('dash-panji-intro', 'dash-panji-talking');
    if (emote) emote.textContent = '👋';
  } else {
    panji.classList.add('dash-panji-talking');
    if (emote) emote.textContent = '🤖';
  }

  textEl.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');

  clearTimeout(panji._talkTimer);
  panji._talkTimer = setTimeout(() => {
    panji.classList.remove('dash-panji-talking');
  }, Math.min(6500, Math.max(2200, String(text).length * 35)));
}

function getPanjiMoodByData(data) {
  const status = getTotalStatus(data.selectedProfile.score);

  if (status.tone === 'success' || status.tone === 'good') return 'happy';
  if (status.tone === 'danger') return 'sad';
  return 'thinking';
}

function buildPanjiWelcome(data) {
  return `Halo, saya PANJI — Pengadaan Jitu. Saya akan bantu membaca Dashboard TRAXPBJ.

Saat ini dashboard menampilkan ${data.scopeName}. Saya bisa menjelaskan skor ITKP, SiRUP, Toko Daring, e-Purchasing, e-Tendering, e-Kontrak, Non Tender, realisasi, dan prioritas perbaikannya.

Pilih satuan kerja di dropdown, nanti saya bantu analisis kondisi OPD itu.`;
}

function buildPanjiDashboardIntro(data) {
  return `Dashboard ini membaca kondisi pengadaan dari beberapa sisi.

Pertama, Pemanfaatan Sistem ITKP dengan skor maksimal 30 poin. Di dalamnya ada SiRUP, Toko Daring, e-Purchasing, e-Tendering, e-Kontrak, dan Non Tender.

Kedua, dashboard membandingkan pagu perencanaan dengan realisasi. Ketiga, dashboard menampilkan metode pengadaan dan ranking OPD.

Untuk ${data.scopeName}, skor ITKP saat ini ${formatScore(data.selectedProfile.score)} dari 30.`;
}

function buildPanjiSatkerAnalysis(data) {
  const profile = data.selectedProfile;
  const status = getTotalStatus(profile.score);
  const weak = data.weakestIndicators || [];
  const strong = data.strongestIndicators || [];

  const weakText = weak.map((item) => {
    const itemStatus = getIndicatorStatus(item.value, item.max);
    return `${item.name}: ${formatScore(item.value)} dari ${formatScore(item.max)} (${itemStatus.label})`;
  }).join('; ');

  const strongText = strong.map((item) => {
    const itemStatus = getIndicatorStatus(item.value, item.max);
    return `${item.name}: ${formatScore(item.value)} dari ${formatScore(item.max)} (${itemStatus.label})`;
  }).join('; ');

  return `Analisis PANJI untuk ${profile.name}.

Skor Pemanfaatan Sistem ITKP adalah ${formatScore(profile.score)} dari 30, kategori ${status.label}.

Capaian yang paling kuat: ${strongText || '-'}.

Indikator yang perlu diperhatikan: ${weakText || '-'}.

Artinya, satuan kerja ini perlu memastikan data dari perencanaan RUP, transaksi katalog/tender, kontrak, BAST, dan realisasi sudah masuk dengan tertib.`;
}

function buildPanjiRecommendation(data) {
  const weak = data.weakestIndicators || [];
  const profile = data.selectedProfile;

  const priority = weak.map((item, index) => `${index + 1}. ${item.name}`).join('\n');

  const details = weak.map((item) => {
    if (item.name === 'SiRUP') {
      return 'SiRUP: cek kembali paket RUP, metode, jadwal, pagu, dan konsistensi dengan kebutuhan.';
    }

    if (item.name === 'Toko Daring') {
      return 'Toko Daring: dorong belanja sederhana yang sesuai kanal Toko Daring jika tersedia.';
    }

    if (item.name === 'e-Purchasing') {
      return 'e-Purchasing: pastikan paket yang tersedia di katalog diproses melalui e-Katalog dan terdokumentasi.';
    }

    if (item.name === 'e-Tendering') {
      return 'e-Tendering: pastikan tender/seleksi tercatat sesuai metode dan tahapan SPSE.';
    }

    if (item.name === 'e-Kontrak') {
      return 'e-Kontrak: pastikan kontrak/SPK hasil pemilihan sudah tercatat dan tidak berhenti di tahap pemilihan.';
    }

    if (item.name === 'Non Tender') {
      return 'Non Tender: pastikan pengadaan langsung/non tender/non e-purchasing tetap dicatat sampai realisasi.';
    }

    return `${item.name}: cek sumber data dan kelengkapan pencatatan.`;
  }).join('\n');

  return `Rekomendasi PANJI untuk ${profile.name}.

Prioritas perbaikan:
${priority || '-'}

Langkah praktis:
${details || '-'}

Fokusnya bukan hanya menaikkan skor, tapi memastikan alur PBJ tertib: RUP jelas, metode tepat, transaksi tercatat, kontrak ada, BAST ada, dan realisasi tidak bolong.`;
}

function initDashboardPanjiAutoPosition(panji) {
  let ticking = false;

  const update = () => {
    if (!panji) return;

    const baseBottom = 86;
    const maxBottom = 280;
    const gap = 22;
    const footer = document.querySelector('.footer-note');
    const panjiRect = panji.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    let nextBottom = baseBottom;

    if (footer) {
      const footerRect = footer.getBoundingClientRect();
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
    if (typeof oldDestroy === 'function') oldDestroy();
  };
}

function injectDashboardPanjiCss() {
  if (document.getElementById('dashboard-panji-css')) return;

  const style = document.createElement('style');
  style.id = 'dashboard-panji-css';
  style.textContent = `
    .panji-analysis-box{
      display:grid;
      gap:12px;
      padding:16px;
      border-radius:20px;
      border:1px solid #dbeafe;
      background:#f8fbff;
      color:#334155;
      line-height:1.65;
    }

    .analysis-main{
      font-size:16px;
      color:#102544;
      font-weight:700;
    }

    .analysis-sub{
      font-size:14px;
      color:#475569;
    }

    .soft-pill--success,
    .soft-pill--good{
      background:#dcfce7;
      color:#166534;
      border-color:#86efac;
    }

    .soft-pill--warning{
      background:#fef3c7;
      color:#92400e;
      border-color:#fde68a;
    }

    .soft-pill--danger{
      background:#fee2e2;
      color:#991b1b;
      border-color:#fecaca;
    }

    .dim-row--button,
    .insight-item--click{
      width:100%;
      border:0;
      text-align:left;
      cursor:pointer;
      background:transparent;
    }

    .dim-row--button:hover,
    .insight-item--click:hover{
      transform:translateY(-1px);
      background:rgba(37,99,235,.04);
    }

    .bar-fill--success,
    .bar-fill--good{
      background:linear-gradient(90deg,#16a34a,#22c55e) !important;
    }

    .bar-fill--warning{
      background:linear-gradient(90deg,#f59e0b,#facc15) !important;
    }

    .bar-fill--danger{
      background:linear-gradient(90deg,#dc2626,#fb7185) !important;
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
      width:380px;
      min-height:136px;
      max-height:330px;
      overflow:auto;
      padding:16px;
      border-radius:22px;
      background:
        radial-gradient(circle at top left, rgba(59,130,246,.14), transparent 38%),
        rgba(255,255,255,.97);
      border:1px solid rgba(219,234,254,.95);
      box-shadow:0 22px 48px rgba(15,23,42,.18);
      backdrop-filter:blur(14px);
      -webkit-backdrop-filter:blur(14px);
      position:relative;
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

    .dash-panji-minimized .dash-panji-bubble{
      opacity:0;
      visibility:hidden;
      width:0;
      min-width:0;
      min-height:0;
      max-height:0;
      padding:0;
      border:0;
      overflow:hidden;
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

    @media(max-width:1400px){
      .dash-panji{
        right:24px;
      }

      .dash-panji-bubble{
        width:320px;
        max-height:280px;
      }

      .dash-panji-character{
        width:102px;
        height:132px;
      }
    }
  `;

  document.head.appendChild(style);
}

/* =========================================================
   MODULE LOADER
   ========================================================= */

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
          <p>Halaman ini sudah disiapkan di portal utama. Nanti saat modul siap, tinggal isi route <b>${escapeHtml(pageKey)}</b> pada objek <b>APP_ROUTES</b>.</p>
        </div>
        <div class="placeholder-box">
          <h4>Saran PANJI</h4>
          <p>Untuk indikator ITKP, sebaiknya modul membaca data sumber langsung agar dashboard dan detail OPD konsisten.</p>
        </div>
      </div>
    </section>
  `;

  requestAnimationFrame(initScrollAnimation);
}

function renderQuickCard(icon, bg, title, text, route) {
  return `
    <button class="quick-card" type="button" data-quick="${escapeHtml(route)}">
      <div class="quick-icon" style="background:${escapeHtml(bg)}">${escapeHtml(icon)}</div>
      <div>
        <div class="quick-title">${escapeHtml(title)}</div>
        <div class="quick-text">${escapeHtml(text)}</div>
      </div>
      <div class="quick-arrow">›</div>
    </button>
  `;
}

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

    const response = await fetch(cacheBust(page.html), { cache: 'no-cache' });

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
      loadPage(btn.dataset.page);
    });
  });

  activeFlyout = flyout;
}

bindMenu();
loadPage('dashboard');
