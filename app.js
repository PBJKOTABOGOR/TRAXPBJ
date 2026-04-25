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
let scrollLuxuryDestroy = null;

/* =========================================================
   UTIL
========================================================= */

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function shuffleArray(items) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('id-ID');
}

/* =========================================================
   PROCUREMENT STACKER DATA
========================================================= */

const STACKER_CARD_LIBRARY = {
  rup: {
    id: 'rup',
    label: 'Cek RUP',
    icon: '📋',
    note: 'Pastikan paket, pagu, metode, dan jadwal sesuai.'
  },
  identifikasi: {
    id: 'identifikasi',
    label: 'Identifikasi Kebutuhan',
    icon: '🧠',
    note: 'Pastikan kebutuhan jelas, valid, dan tidak dobel.'
  },
  konsolidasi: {
    id: 'konsolidasi',
    label: 'Konsolidasi',
    icon: '🧲',
    note: 'Gabungkan kebutuhan sejenis bila tepat.'
  },
  kak: {
    id: 'kak',
    label: 'KAK / Spesifikasi',
    icon: '🧩',
    note: 'Susun kebutuhan teknis secara jelas dan adil.'
  },
  reviewSpek: {
    id: 'review-spek',
    label: 'Review Spesifikasi',
    icon: '🧐',
    note: 'Cek apakah spek terlalu mengarah atau tidak relevan.'
  },
  hps: {
    id: 'hps',
    label: 'HPS / Referensi Harga',
    icon: '💰',
    note: 'Susun harga perkiraan dengan dasar yang wajar.'
  },
  cekKatalog: {
    id: 'cek-katalog',
    label: 'Cek e-Katalog',
    icon: '🔎',
    note: 'Pastikan barang/jasa tersedia dan sesuai kebutuhan.'
  },
  cekPdn: {
    id: 'cek-pdn',
    label: 'Cek PDN/TKDN',
    icon: '🇮🇩',
    note: 'Perhatikan produk dalam negeri.'
  },
  pilihMetode: {
    id: 'pilih-metode',
    label: 'Pilih Metode',
    icon: '⚙️',
    note: 'Tentukan metode berdasarkan jenis, nilai, dan kondisi paket.'
  },
  metodePl: {
    id: 'metode-pl',
    label: 'Pengadaan Langsung',
    icon: '🛠️',
    note: 'Digunakan bila kondisi dan nilai paket sesuai.'
  },
  metodeEpurchasing: {
    id: 'metode-epurchasing',
    label: 'e-Purchasing',
    icon: '🛒',
    note: 'Gunakan katalog bila tersedia dan sesuai.'
  },
  tender: {
    id: 'tender',
    label: 'Tender',
    icon: '🏗️',
    note: 'Untuk paket yang membutuhkan proses pemilihan formal.'
  },
  seleksi: {
    id: 'seleksi',
    label: 'Seleksi',
    icon: '📐',
    note: 'Umumnya untuk jasa konsultansi.'
  },
  swakelola: {
    id: 'swakelola',
    label: 'Swakelola',
    icon: '🤲',
    note: 'Dipilih jika pelaksanaan memenuhi kriteria swakelola.'
  },
  klarifikasi: {
    id: 'klarifikasi',
    label: 'Klarifikasi / Negosiasi',
    icon: '🤝',
    note: 'Pastikan harga, spek, dan kemampuan pelaksanaan.'
  },
  proses: {
    id: 'proses',
    label: 'Proses Pemilihan',
    icon: '🚦',
    note: 'Laksanakan proses sesuai metode.'
  },
  kontrak: {
    id: 'kontrak',
    label: 'SPK / Kontrak',
    icon: '📑',
    note: 'Ikat hasil proses secara tertulis.'
  },
  monitoringKontrak: {
    id: 'monitoring-kontrak',
    label: 'Monitoring Kontrak',
    icon: '📡',
    note: 'Pantau waktu, mutu, dan kewajiban penyedia.'
  },
  teguran: {
    id: 'teguran',
    label: 'Teguran / Evaluasi',
    icon: '📣',
    note: 'Digunakan saat ada keterlambatan atau masalah.'
  },
  pemeriksaan: {
    id: 'pemeriksaan',
    label: 'Pemeriksaan Hasil',
    icon: '🔬',
    note: 'Cek kesesuaian sebelum diterima.'
  },
  bast: {
    id: 'bast',
    label: 'BAST',
    icon: '📦',
    note: 'Serah terima setelah barang/jasa sesuai.'
  },
  pembayaran: {
    id: 'pembayaran',
    label: 'Pembayaran',
    icon: '💳',
    note: 'Pembayaran sesuai dokumen pendukung.'
  },
  realisasi: {
    id: 'realisasi',
    label: 'Catat Realisasi',
    icon: '✅',
    note: 'Pastikan realisasi tercatat dalam monitoring.'
  },

  kontrakAwal: {
    id: 'kontrak-awal',
    label: 'Kontrak Dulu',
    icon: '🚨',
    note: 'Jebakan: lompat proses.'
  },
  pecahPaket: {
    id: 'pecah-paket',
    label: 'Pecah Paket',
    icon: '💣',
    note: 'Jebakan: rawan menghindari metode.'
  },
  spekMengarah: {
    id: 'spek-mengarah',
    label: 'Spek Mengarah',
    icon: '🚫',
    note: 'Jebakan: risiko persaingan tidak sehat.'
  },
  abaikanKatalog: {
    id: 'abaikan-katalog',
    label: 'Abaikan Katalog',
    icon: '⚠️',
    note: 'Jebakan: tidak cek kanal tersedia.'
  },
  lewatiRup: {
    id: 'lewati-rup',
    label: 'Lewati RUP',
    icon: '⛔',
    note: 'Jebakan: proses tanpa cek perencanaan.'
  },
  bastTanpaCek: {
    id: 'bast-tanpa-cek',
    label: 'BAST Tanpa Pemeriksaan',
    icon: '📦',
    note: 'Jebakan: menerima tanpa verifikasi.'
  },
  bayarDulu: {
    id: 'bayar-dulu',
    label: 'Bayar Dulu',
    icon: '💸',
    note: 'Jebakan: pembayaran sebelum bukti memadai.'
  },
  tundaDokumen: {
    id: 'tunda-dokumen',
    label: 'Tunda Dokumen',
    icon: '🧨',
    note: 'Jebakan: risiko administrasi meningkat.'
  },
  metodeAsalCepat: {
    id: 'metode-asal-cepat',
    label: 'Metode Asal Cepat',
    icon: '🏃',
    note: 'Jebakan: cepat belum tentu tepat.'
  },
  realisasiLupa: {
    id: 'realisasi-lupa',
    label: 'Lupakan Realisasi',
    icon: '🕳️',
    note: 'Jebakan: monitoring bolong.'
  }
};

function c(key) {
  return STACKER_CARD_LIBRARY[key];
}

function makeLevel(config) {
  const idealCards = config.ideal.map(id => c(id));
  const trapCards = (config.traps || []).map(id => c(id));

  return {
    ...config,
    cards: [...idealCards, ...trapCards].filter(Boolean)
  };
}

const STACKER_LEVELS = [
  makeLevel({
    title: 'Level 1 — Dasar Pengadaan',
    caseTitle: 'Belanja ATK Kantor',
    caseDesc: 'Paket sederhana nilai kecil. Fokus: alur dasar dari RUP sampai realisasi.',
    concept: 'Tahapan dasar pengadaan dan pencatatan realisasi.',
    budget: 'Rp45.000.000',
    deadline: '60 hari',
    difficulty: 'Pemula',
    ideal: ['rup', 'kak', 'hps', 'metodePl', 'proses', 'kontrak', 'bast', 'realisasi'],
    traps: ['kontrakAwal', 'lewatiRup']
  }),

  makeLevel({
    title: 'Level 2 — Paket Katalog',
    caseTitle: 'Laptop Pelayanan Publik',
    caseDesc: 'Barang tersedia di e-Katalog, pagu menengah, dan dibutuhkan cukup cepat.',
    concept: 'Pemanfaatan e-Katalog dan pemilihan metode yang efisien.',
    budget: 'Rp350.000.000',
    deadline: '45 hari',
    difficulty: 'Pemula+',
    ideal: ['rup', 'kak', 'hps', 'cekKatalog', 'metodeEpurchasing', 'klarifikasi', 'kontrak', 'bast', 'realisasi'],
    traps: ['metodePl', 'tender', 'abaikanKatalog']
  }),

  makeLevel({
    title: 'Level 3 — Deadline Mepet',
    caseTitle: 'Meubelair Ruang Layanan',
    caseDesc: 'Waktu pendek. Pilih jalur realistis dan jangan menunda dokumen.',
    concept: 'Pengendalian risiko waktu dan kesiapan dokumen.',
    budget: 'Rp180.000.000',
    deadline: '25 hari',
    difficulty: 'Menengah',
    ideal: ['rup', 'kak', 'hps', 'cekKatalog', 'metodeEpurchasing', 'kontrak', 'bast', 'realisasi'],
    traps: ['tender', 'tundaDokumen', 'kontrakAwal']
  }),

  makeLevel({
    title: 'Level 4 — Konsolidasi',
    caseTitle: 'Komputer Beberapa Bidang',
    caseDesc: 'Kebutuhan sejenis tersebar di beberapa bidang. Tentukan langkah aman.',
    concept: 'Konsolidasi pengadaan dan risiko pemecahan paket.',
    budget: 'Rp650.000.000',
    deadline: '70 hari',
    difficulty: 'Menengah',
    ideal: ['rup', 'identifikasi', 'konsolidasi', 'kak', 'hps', 'cekKatalog', 'metodeEpurchasing', 'kontrak', 'bast', 'realisasi'],
    traps: ['pecahPaket', 'metodePl', 'metodeAsalCepat']
  }),

  makeLevel({
    title: 'Level 5 — Spek Mengarah',
    caseTitle: 'Laptop dengan Spek Terlalu Spesifik',
    caseDesc: 'Spesifikasi awal terlalu mengarah. Perbaiki proses agar fair.',
    concept: 'Spesifikasi berbasis kebutuhan, bukan mengarah pada merek tertentu.',
    budget: 'Rp420.000.000',
    deadline: '50 hari',
    difficulty: 'Menengah',
    ideal: ['rup', 'reviewSpek', 'kak', 'hps', 'cekKatalog', 'metodeEpurchasing', 'klarifikasi', 'kontrak', 'bast', 'realisasi'],
    traps: ['spekMengarah', 'kontrakAwal', 'abaikanKatalog']
  }),

  makeLevel({
    title: 'Level 6 — Jasa Konsultansi',
    caseTitle: 'Kajian Teknis Perencanaan',
    caseDesc: 'Paket jasa konsultansi membutuhkan metode dan dokumen yang tepat.',
    concept: 'Karakteristik jasa konsultansi dan metode seleksi.',
    budget: 'Rp280.000.000',
    deadline: '75 hari',
    difficulty: 'Menengah',
    ideal: ['rup', 'identifikasi', 'kak', 'hps', 'seleksi', 'proses', 'kontrak', 'monitoringKontrak', 'bast', 'realisasi'],
    traps: ['metodeEpurchasing', 'metodePl', 'kontrakAwal']
  }),

  makeLevel({
    title: 'Level 7 — Jasa Kebersihan',
    caseTitle: 'Jasa Kebersihan Gedung',
    caseDesc: 'Paket jasa lainnya rutin dengan kebutuhan layanan berkelanjutan.',
    concept: 'KAK layanan, HPS, metode, kontrak, dan pengawasan.',
    budget: 'Rp480.000.000',
    deadline: '80 hari',
    difficulty: 'Menengah',
    ideal: ['rup', 'identifikasi', 'kak', 'hps', 'pilihMetode', 'proses', 'kontrak', 'monitoringKontrak', 'bast', 'realisasi'],
    traps: ['metodeAsalCepat', 'pecahPaket', 'bastTanpaCek']
  }),

  makeLevel({
    title: 'Level 8 — Konstruksi Ringan',
    caseTitle: 'Rehabilitasi Ruang Pelayanan',
    caseDesc: 'Pekerjaan konstruksi membutuhkan dokumen teknis dan pemeriksaan kuat.',
    concept: 'Konstruksi, dokumen teknis, metode, kontrak, dan pemeriksaan.',
    budget: 'Rp760.000.000',
    deadline: '100 hari',
    difficulty: 'Sulit',
    ideal: ['rup', 'identifikasi', 'kak', 'hps', 'tender', 'proses', 'kontrak', 'monitoringKontrak', 'pemeriksaan', 'bast', 'realisasi'],
    traps: ['metodePl', 'kontrakAwal', 'bastTanpaCek']
  }),

  makeLevel({
    title: 'Level 9 — Swakelola',
    caseTitle: 'Kegiatan Pelatihan Internal',
    caseDesc: 'Kegiatan lebih tepat dikelola secara swakelola.',
    concept: 'Kapan swakelola dipertimbangkan dan bagaimana alurnya.',
    budget: 'Rp95.000.000',
    deadline: '40 hari',
    difficulty: 'Menengah',
    ideal: ['rup', 'identifikasi', 'kak', 'hps', 'swakelola', 'proses', 'bast', 'realisasi'],
    traps: ['metodeEpurchasing', 'tender', 'kontrakAwal']
  }),

  makeLevel({
    title: 'Level 10 — PDN/TKDN',
    caseTitle: 'Pengadaan Perangkat Elektronik',
    caseDesc: 'Tersedia pilihan produk, tetapi status PDN/TKDN harus diperhatikan.',
    concept: 'Perhatian pada produk dalam negeri dalam pengadaan.',
    budget: 'Rp510.000.000',
    deadline: '55 hari',
    difficulty: 'Menengah',
    ideal: ['rup', 'kak', 'hps', 'cekPdn', 'cekKatalog', 'metodeEpurchasing', 'klarifikasi', 'kontrak', 'bast', 'realisasi'],
    traps: ['abaikanKatalog', 'metodeAsalCepat', 'kontrakAwal']
  }),

  makeLevel({
    title: 'Level 11 — RUP Belum Sinkron',
    caseTitle: 'Paket Mau Jalan tapi RUP Belum Sesuai',
    caseDesc: 'OPD ingin segera proses, tetapi data RUP perlu dicek.',
    concept: 'Kesesuaian RUP sebelum proses pengadaan.',
    budget: 'Rp220.000.000',
    deadline: '45 hari',
    difficulty: 'Sulit',
    ideal: ['rup', 'identifikasi', 'kak', 'hps', 'cekKatalog', 'pilihMetode', 'proses', 'kontrak', 'bast', 'realisasi'],
    traps: ['lewatiRup', 'kontrakAwal', 'metodeAsalCepat']
  }),

  makeLevel({
    title: 'Level 12 — Katalog Tidak Sesuai',
    caseTitle: 'Barang Ada di Katalog tapi Spek Tidak Cocok',
    caseDesc: 'Katalog ditemukan, tetapi barang tidak sepenuhnya sesuai.',
    concept: 'Kesesuaian spesifikasi dan evaluasi kanal pengadaan.',
    budget: 'Rp330.000.000',
    deadline: '60 hari',
    difficulty: 'Sulit',
    ideal: ['rup', 'kak', 'hps', 'cekKatalog', 'klarifikasi', 'pilihMetode', 'proses', 'kontrak', 'bast', 'realisasi'],
    traps: ['metodeEpurchasing', 'abaikanKatalog', 'kontrakAwal']
  }),

  makeLevel({
    title: 'Level 13 — Penyedia Terlambat',
    caseTitle: 'Penyedia Terlambat Mengirim Barang',
    caseDesc: 'Proses sudah kontrak, tetapi penyedia terlambat.',
    concept: 'Pengendalian kontrak dan respons atas keterlambatan.',
    budget: 'Rp190.000.000',
    deadline: 'Sisa 10 hari',
    difficulty: 'Sulit',
    ideal: ['kontrak', 'monitoringKontrak', 'teguran', 'pemeriksaan', 'bast', 'pembayaran', 'realisasi'],
    traps: ['bastTanpaCek', 'bayarDulu', 'realisasiLupa']
  }),

  makeLevel({
    title: 'Level 14 — BAST Bermasalah',
    caseTitle: 'Barang Dikirim tapi Tidak Sesuai',
    caseDesc: 'Barang datang, tetapi belum sesuai. Jangan langsung BAST.',
    concept: 'Pemeriksaan hasil sebelum serah terima.',
    budget: 'Rp155.000.000',
    deadline: 'Sisa 7 hari',
    difficulty: 'Sulit',
    ideal: ['kontrak', 'pemeriksaan', 'teguran', 'klarifikasi', 'pemeriksaan', 'bast', 'pembayaran', 'realisasi'],
    traps: ['bastTanpaCek', 'bayarDulu', 'realisasiLupa']
  }),

  makeLevel({
    title: 'Level 15 — Realisasi Lupa Dicatat',
    caseTitle: 'Paket Selesai tapi Monitoring Kosong',
    caseDesc: 'Paket selesai fisik, tapi realisasi belum dicatat.',
    concept: 'Pentingnya pencatatan realisasi untuk monitoring dan evaluasi.',
    budget: 'Rp72.000.000',
    deadline: 'Selesai',
    difficulty: 'Pemula+',
    ideal: ['kontrak', 'bast', 'pembayaran', 'realisasi'],
    traps: ['realisasiLupa', 'bastTanpaCek', 'bayarDulu']
  }),

  makeLevel({
    title: 'Level 16 — Konsumsi Rapat',
    caseTitle: 'Konsumsi Rapat Berkala',
    caseDesc: 'Kebutuhan berulang. Jangan langsung transaksi tanpa perencanaan.',
    concept: 'Kebutuhan rutin, RUP, HPS, dan metode sesuai.',
    budget: 'Rp35.000.000',
    deadline: '30 hari',
    difficulty: 'Pemula',
    ideal: ['rup', 'identifikasi', 'kak', 'hps', 'metodePl', 'proses', 'bast', 'realisasi'],
    traps: ['lewatiRup', 'kontrakAwal', 'bayarDulu']
  }),

  makeLevel({
    title: 'Level 17 — Servis AC',
    caseTitle: 'Jasa Servis AC Kantor',
    caseDesc: 'Jasa lainnya nilai kecil, tetap perlu bukti hasil.',
    concept: 'Jasa sederhana dan dokumen minimal yang tetap rapi.',
    budget: 'Rp28.000.000',
    deadline: '20 hari',
    difficulty: 'Pemula+',
    ideal: ['rup', 'identifikasi', 'kak', 'hps', 'metodePl', 'proses', 'pemeriksaan', 'bast', 'realisasi'],
    traps: ['bastTanpaCek', 'bayarDulu', 'tundaDokumen']
  }),

  makeLevel({
    title: 'Level 18 — Event Publikasi',
    caseTitle: 'Jasa Event dan Publikasi',
    caseDesc: 'Output layanan, jadwal ketat, dan dokumen harus jelas.',
    concept: 'KAK output, HPS, metode, kontrak, dan pemeriksaan hasil jasa.',
    budget: 'Rp310.000.000',
    deadline: '35 hari',
    difficulty: 'Sulit',
    ideal: ['rup', 'identifikasi', 'kak', 'hps', 'pilihMetode', 'proses', 'kontrak', 'monitoringKontrak', 'pemeriksaan', 'bast', 'realisasi'],
    traps: ['metodeAsalCepat', 'kontrakAwal', 'tundaDokumen']
  }),

  makeLevel({
    title: 'Level 19 — Paket Akhir Tahun',
    caseTitle: 'Belanja Modal Menjelang Akhir Tahun',
    caseDesc: 'Waktu sempit, nilai cukup besar, dan risiko administrasi tinggi.',
    concept: 'Pengendalian waktu, metode realistis, dan dokumen lengkap.',
    budget: 'Rp540.000.000',
    deadline: '28 hari',
    difficulty: 'Boss',
    ideal: ['rup', 'identifikasi', 'kak', 'hps', 'cekKatalog', 'pilihMetode', 'klarifikasi', 'kontrak', 'pemeriksaan', 'bast', 'realisasi'],
    traps: ['tender', 'kontrakAwal', 'tundaDokumen', 'metodeAsalCepat']
  }),

  makeLevel({
    title: 'Level 20 — Master Challenge',
    caseTitle: 'Alat Kesehatan Bernilai Besar',
    caseDesc: 'Paket kompleks: nilai besar, teknis, PDN/TKDN, katalog, metode, kontrak, pemeriksaan, dan realisasi.',
    concept: 'Studi kasus campuran seperti latihan komprehensif sertifikasi PBJ.',
    budget: 'Rp1.200.000.000',
    deadline: '90 hari',
    difficulty: 'Final Boss',
    ideal: ['rup', 'identifikasi', 'reviewSpek', 'kak', 'hps', 'cekPdn', 'cekKatalog', 'pilihMetode', 'klarifikasi', 'kontrak', 'monitoringKontrak', 'pemeriksaan', 'bast', 'pembayaran', 'realisasi'],
    traps: ['spekMengarah', 'pecahPaket', 'kontrakAwal', 'bastTanpaCek', 'bayarDulu']
  })
];

const STACKER_STATE = {
  levelIndex: 0,
  placed: [],
  compliance: 0,
  risk: 0,
  progress: 0,
  wrong: 0,
  finished: false,
  shuffledCards: [],
  shuffledLevelIndex: null
};

/* =========================================================
   TRYOUT QUESTIONS
   Catatan: soal diparafrasekan jadi bank latihan interaktif.
========================================================= */

const TRYOUT_QUESTIONS = [
  {
    id: 1,
    topic: 'Rantai Pasok',
    question: 'Segmen rantai pasok yang dilakukan oleh organisasi/korporasi/institusi pemasok disebut sebagai apa?',
    options: ['Rantai pasok hilir', 'Rantai pasok hulu', 'Rantai pasok eksternal', 'Rantai pasok internal'],
    answer: 1,
    explanation: 'Pemasok berada pada sisi hulu dalam rantai pasok karena menyediakan input sebelum digunakan organisasi pembeli.'
  },
  {
    id: 2,
    topic: 'Rantai Pasok',
    question: 'Pembangunan puskesmas oleh pemerintah daerah termasuk contoh rantai pasok pengadaan dengan kategori apa?',
    options: ['Rantai pasok panjang', 'Rantai pasok kompleks', 'Rantai pasok pendek', 'Rantai pasok sederhana'],
    answer: 0,
    explanation: 'Pembangunan melibatkan banyak tahapan, material, pelaksana, dan pengawasan sehingga termasuk rantai pasok panjang.'
  },
  {
    id: 3,
    topic: 'Manajemen Rantai Pasok',
    question: 'Penyusunan regulasi dan prosedur pendukung proses operasionalisasi Manajemen Rantai Pasok termasuk penerapan MRP pada level apa?',
    options: ['Perencanaan', 'Strategis', 'Taktis', 'Operasional'],
    answer: 1,
    explanation: 'Regulasi/prosedur menjadi arah kebijakan, sehingga berada pada level strategis.'
  },
  {
    id: 4,
    topic: 'Ruang Lingkup PBJ',
    question: 'Pengadaan Barang/Jasa Pemerintah adalah kegiatan PBJ oleh K/L/PD yang dibiayai APBN/APBD, dimulai dari tahap apa sampai tahap apa?',
    options: ['Identifikasi kebutuhan sampai kontrak', 'Perencanaan sampai serah terima', 'Identifikasi kebutuhan sampai serah terima hasil pekerjaan', 'Identifikasi kebutuhan sampai pemeriksaan hasil'],
    answer: 2,
    explanation: 'PBJ dimulai sejak identifikasi kebutuhan sampai dengan serah terima hasil pekerjaan.'
  },
  {
    id: 5,
    topic: 'Ruang Lingkup PBJ',
    question: 'Manakah yang bukan termasuk ruang lingkup Pengadaan Barang/Jasa Pemerintah?',
    options: ['PBJ bersumber APBN', 'PBJ bersumber APBD', 'PBJ bersumber APBDes', 'PBJ bersumber pinjaman/hibah dalam dan luar negeri'],
    answer: 2,
    explanation: 'APBDes memiliki tata kelola tersendiri dan bukan ruang lingkup utama PBJ K/L/PD.'
  },
  {
    id: 6,
    topic: 'Tujuan PBJ',
    question: 'PPK membeli laptop melalui katalog elektronik dengan TKDN + BMP sebesar 42%. Tujuan PBJ yang didukung adalah?',
    options: ['Menghasilkan barang/jasa sesuai nilai uang', 'Meningkatkan penggunaan produk dalam negeri', 'Meningkatkan peran UMK dan koperasi', 'Meningkatkan peran pelaku usaha nasional'],
    answer: 1,
    explanation: 'TKDN/BMP menunjukkan keberpihakan pada produk dalam negeri.'
  },
  {
    id: 7,
    topic: 'Tujuan PBJ',
    question: 'Pokja membuka persyaratan pemilihan secara luas agar banyak pelaku usaha dapat mengikuti pemilihan. Tujuan PBJ yang paling sesuai adalah?',
    options: ['Meningkatkan industri kreatif', 'Meningkatkan pelaku usaha nasional', 'Meningkatkan UMK', 'Pemerataan ekonomi dan perluasan kesempatan berusaha'],
    answer: 3,
    explanation: 'Pembukaan kesempatan luas mendukung pemerataan ekonomi dan perluasan kesempatan berusaha.'
  },
  {
    id: 8,
    topic: 'Perencanaan PBJ',
    question: 'Pengguna Anggaran melakukan identifikasi kebutuhan dan menyediakan anggaran secara sekaligus. Hal ini sesuai dengan kebijakan PBJ yang mana?',
    options: ['PBJ transparan dan kompetitif', 'Meningkatkan kualitas perencanaan PBJ', 'Mendorong PDN dan SNI', 'Mengembangkan e-marketplace PBJ'],
    answer: 1,
    explanation: 'Identifikasi kebutuhan dan anggaran merupakan bagian dari peningkatan kualitas perencanaan PBJ.'
  },
  {
    id: 9,
    topic: 'Spesifikasi Teknis',
    question: 'PPK menyusun spesifikasi kertas dengan persyaratan ekolabel untuk produk ramah lingkungan. Tujuan PBJ yang didukung adalah?',
    options: ['Mendorong PDN dan SNI', 'Mendorong penelitian dan industri kreatif', 'Melaksanakan PBJ berkelanjutan', 'Meningkatkan kualitas perencanaan'],
    answer: 2,
    explanation: 'Ekolabel dan ramah lingkungan berkaitan dengan pengadaan berkelanjutan.'
  },
  {
    id: 10,
    topic: 'Prinsip PBJ',
    question: 'Laptop yang dibeli tidak sesuai spesifikasi sehingga tidak dapat digunakan. Prinsip PBJ yang tidak terpenuhi adalah?',
    options: ['Efisien', 'Efektif', 'Akuntabel', 'Transparan'],
    answer: 1,
    explanation: 'Efektif berarti barang/jasa harus sesuai kebutuhan dan tujuan pengadaan.'
  },
  {
    id: 11,
    topic: 'Prinsip PBJ',
    question: 'Pokja melakukan evaluasi yang sama kepada seluruh penyedia. Prinsip PBJ yang diterapkan adalah?',
    options: ['Transparan', 'Terbuka', 'Bersaing', 'Adil'],
    answer: 3,
    explanation: 'Perlakuan yang sama kepada peserta mencerminkan prinsip adil.'
  },
  {
    id: 12,
    topic: 'Etika PBJ',
    question: 'Pengguna Anggaran menginstruksikan Pokja untuk memenangkan PT tertentu. Hal ini tidak sesuai etika PBJ karena bertentangan dengan prinsip apa?',
    options: ['Tertib dan bertanggung jawab', 'Profesional dan menjaga kerahasiaan', 'Tidak saling mempengaruhi yang menyebabkan persaingan tidak sehat', 'Menghindari konflik kepentingan'],
    answer: 2,
    explanation: 'Intervensi untuk memenangkan pihak tertentu merupakan pengaruh tidak sehat.'
  },
  {
    id: 13,
    topic: 'Etika PBJ',
    question: 'PPK memiliki koperasi pegawai yang ikut sebagai calon penyedia pada paket di dinasnya. Etika yang relevan dijaga adalah?',
    options: ['Menghindari pertentangan kepentingan', 'Mencegah pemborosan keuangan negara', 'Mencegah kolusi', 'Bertanggung jawab mencapai sasaran'],
    answer: 0,
    explanation: 'Keterkaitan PPK dengan calon penyedia berpotensi konflik kepentingan.'
  },
  {
    id: 14,
    topic: 'Aspek Hukum',
    question: 'Perselisihan antara PPK dan penyedia pada pelaksanaan kontrak konstruksi terutama berkaitan dengan aspek hukum apa?',
    options: ['Hukum pidana', 'Hukum perdata', 'Hukum persaingan usaha', 'Hukum administrasi negara'],
    answer: 1,
    explanation: 'Sengketa pelaksanaan kontrak pada dasarnya merupakan hubungan perdata para pihak.'
  },
  {
    id: 15,
    topic: 'Pelaku PBJ',
    question: 'Pihak yang berwenang menetapkan spesifikasi teknis/KAK, HPS, dan rancangan kontrak adalah?',
    options: ['PA', 'Pokja Pemilihan', 'PPK', 'Pejabat Pengadaan'],
    answer: 2,
    explanation: 'PPK berwenang menyusun/menetapkan spesifikasi teknis/KAK, HPS, dan rancangan kontrak.'
  },
  {
    id: 16,
    topic: 'Pelaku PBJ',
    question: 'Siapa pelaku pengadaan yang melaksanakan e-Purchasing seragam batik senilai Rp250 juta?',
    options: ['PA/KPA', 'PPK', 'Pejabat Pengadaan', 'Pokja Pemilihan'],
    answer: 1,
    explanation: 'Untuk e-Purchasing pada nilai tersebut, pelaksanaan berada pada PPK sesuai kewenangan.'
  },
  {
    id: 17,
    topic: 'Sanggah',
    question: 'Perusahaan kalah tender dan mengajukan sanggah. Pihak yang berwenang menjawab sanggah tersebut adalah?',
    options: ['PA', 'KPA', 'PPK', 'Pokja Pemilihan'],
    answer: 3,
    explanation: 'Sanggah pada proses pemilihan dijawab oleh Pokja Pemilihan.'
  },
  {
    id: 18,
    topic: 'UMK dan Koperasi',
    question: 'DIPA memiliki belanja barang/jasa Rp2 miliar. Alokasi minimal 40% untuk usaha kecil/koperasi produk dalam negeri adalah?',
    options: ['Rp200.000.000', 'Rp400.000.000', 'Rp600.000.000', 'Rp800.000.000'],
    answer: 3,
    explanation: '40% x Rp2.000.000.000 = Rp800.000.000.'
  },
  {
    id: 19,
    topic: 'Katalog Elektronik',
    question: 'Katalog obat yang dikelola oleh Kementerian Kesehatan termasuk jenis katalog elektronik apa?',
    options: ['Nasional', 'Sektoral', 'Lokal', 'Regional'],
    answer: 1,
    explanation: 'Katalog yang dikelola kementerian/lembaga tertentu termasuk katalog sektoral.'
  },
  {
    id: 20,
    topic: 'Ekosistem PBJ',
    question: 'Yang termasuk sumber daya pendukung ekosistem PBJ adalah?',
    options: ['Pengelola PBJ', 'Pemberi Keterangan Ahli', 'Pengelola LPSE', 'Personil lainnya'],
    answer: 1,
    explanation: 'Pemberi keterangan ahli termasuk sumber daya pendukung dalam ekosistem PBJ.'
  },
  {
    id: 21,
    topic: 'Pemilihan Penyedia',
    question: 'Peserta pemilihan mengundurkan diri dengan alasan yang tidak dapat diterima Pokja. Sanksi yang dapat diberikan adalah?',
    options: ['Digugurkan dalam pemilihan', 'Ganti kerugian', 'Daftar hitam 1 tahun', 'Daftar hitam 2 tahun'],
    answer: 2,
    explanation: 'Pengunduran diri tanpa alasan yang dapat diterima dapat dikenakan sanksi daftar hitam 1 tahun.'
  },
  {
    id: 22,
    topic: 'Identifikasi Kebutuhan',
    question: 'Dalam identifikasi kebutuhan kendaraan dinas, aspek yang perlu diperhatikan adalah?',
    options: ['Jumlah tenaga ahli', 'Jadwal kebutuhan', 'Jumlah produsen', 'Keinginan PA/KPA'],
    answer: 1,
    explanation: 'Jadwal kebutuhan penting untuk menentukan kapan barang/jasa diperlukan.'
  },
  {
    id: 23,
    topic: 'Konstruksi',
    question: 'Dalam identifikasi kebutuhan pekerjaan konstruksi, hal yang perlu diperhatikan antara lain?',
    options: ['Kontrak pekerjaan konstruksi', 'Kompleksitas pekerjaan konstruksi', 'Dokumen pengadaan konstruksi', 'Rencana anggaran biaya konstruksi'],
    answer: 1,
    explanation: 'Kompleksitas pekerjaan menjadi pertimbangan awal dalam identifikasi kebutuhan konstruksi.'
  },
  {
    id: 24,
    topic: 'Jenis Pengadaan',
    question: 'Penyusunan studi kelayakan pembangunan bendungan termasuk jenis pengadaan apa?',
    options: ['Barang', 'Pekerjaan konstruksi', 'Jasa lainnya', 'Jasa konsultansi'],
    answer: 3,
    explanation: 'Studi kelayakan merupakan jasa profesional/keahlian sehingga termasuk jasa konsultansi.'
  },
  {
    id: 25,
    topic: 'Spesifikasi Teknis',
    question: 'Salah satu fungsi penetapan spesifikasi teknis dalam pembangunan gedung adalah?',
    options: ['Membandingkan harga penawaran', 'Mengetahui TKDN', 'Memberikan informasi kebutuhan pembeli kepada pelaku usaha', 'Menentukan jumlah tenaga ahli'],
    answer: 2,
    explanation: 'Spesifikasi teknis memberi informasi kepada pelaku usaha mengenai kebutuhan yang harus dipenuhi.'
  },
  {
    id: 26,
    topic: 'Spesifikasi Teknis',
    question: 'Informasi yang dapat digunakan PPK dalam menyusun spesifikasi teknis/KAK adalah?',
    options: ['Produk usaha non-kecil', 'Produk ramah lingkungan', 'Produk impor', 'Penyebutan merek untuk tender'],
    answer: 1,
    explanation: 'Produk ramah lingkungan dapat digunakan untuk mendukung pengadaan berkelanjutan.'
  },
  {
    id: 27,
    topic: 'Penyebutan Merek',
    question: 'Kondisi yang memungkinkan PPK menyebut merek dalam PBJ adalah?',
    options: ['Pengadaan laptop melalui katalog elektronik', 'Pengadaan mobil melalui tender', 'Pengadaan jasa konsultansi melalui seleksi', 'Pengadaan alat berat melalui tender cepat'],
    answer: 0,
    explanation: 'Penyebutan merek dimungkinkan antara lain pada e-Purchasing melalui katalog elektronik.'
  },
  {
    id: 28,
    topic: 'Spesifikasi',
    question: 'Yang bukan menjadi pertimbangan PPK dalam menyusun spesifikasi teknis pengadaan mobil dinas adalah?',
    options: ['Spesifikasi mutu', 'Spesifikasi pelayanan', 'Spesifikasi kualitas', 'Spesifikasi penyedia'],
    answer: 3,
    explanation: 'Spesifikasi teknis berfokus pada barang/jasa, bukan menyusun spesifikasi penyedia.'
  },
  {
    id: 29,
    topic: 'Spesifikasi Fungsi/Kinerja',
    question: 'Contoh spesifikasi teknis yang mendefinisikan fungsi dan kinerja adalah?',
    options: ['Kadar maksimal zat berbahaya', 'Mampu mengangkat beban 100 ton', 'Kapasitas ruang penyimpanan 128 GB SSD', 'Menggunakan bahan ramah lingkungan'],
    answer: 1,
    explanation: 'Kemampuan mengangkat beban menggambarkan fungsi/kinerja yang harus dicapai.'
  },
  {
    id: 30,
    topic: 'KAK',
    question: 'Dokumen perencanaan yang menjelaskan apa, mengapa, siapa, kapan, di mana, bagaimana, dan perkiraan biaya pada jasa konsultansi disebut?',
    options: ['Spesifikasi teknis', 'Kerangka acuan kerja', 'Harga perkiraan sendiri', 'Dokumen pemilihan'],
    answer: 1,
    explanation: 'KAK menjelaskan ruang lingkup, tujuan, output, metode, waktu, dan kebutuhan biaya.'
  },
  {
    id: 31,
    topic: 'Spesifikasi Pelayanan',
    question: 'Contoh penerapan spesifikasi pelayanan dalam spesifikasi teknis adalah?',
    options: ['Pengiriman laptop sebanyak 10 unit', 'Garansi purna jual selama 1 tahun', 'Ukuran layar 42 inch', 'Ketepatan lokasi pengiriman'],
    answer: 1,
    explanation: 'Garansi purna jual adalah bentuk spesifikasi pelayanan.'
  },
  {
    id: 32,
    topic: 'KAK Jasa Konsultansi',
    question: 'Hal yang harus tercantum dalam KAK jasa konsultansi penyusunan kajian kelayakan lingkungan adalah?',
    options: ['Kompetensi tenaga ahli', 'Harga perkiraan sendiri', 'Spesifikasi peralatan', 'Remunerasi tenaga ahli'],
    answer: 0,
    explanation: 'Kompetensi tenaga ahli merupakan unsur penting dalam KAK jasa konsultansi.'
  },
  {
    id: 33,
    topic: 'HPS',
    question: 'Manakah ketentuan yang benar dalam penyusunan dan penetapan HPS?',
    options: ['Menjadi batas tertinggi penawaran jasa konsultansi', 'Nilai HPS bersifat rahasia', 'Tidak dapat digunakan sebagai dasar perhitungan kerugian negara', 'Memperhitungkan pajak termasuk PPh'],
    answer: 2,
    explanation: 'HPS tidak digunakan sebagai dasar perhitungan kerugian negara.'
  },
  {
    id: 34,
    topic: 'RAB',
    question: 'Tahapan penyusunan RAB pengadaan barang/jasa yang paling tepat adalah?',
    options: ['Pengumpulan data, identifikasi komponen pekerjaan, penentuan harga satuan, penyusunan rincian RAB', 'Penentuan harga satuan, rincian RAB, pengumpulan data, identifikasi komponen', 'Identifikasi komponen, harga satuan, RAB, pengumpulan data', 'Identifikasi komponen, pengumpulan data, RAB, harga satuan'],
    answer: 0,
    explanation: 'RAB disusun dari pengumpulan data, identifikasi komponen, penentuan harga satuan, lalu rincian RAB.'
  },
  {
    id: 35,
    topic: 'Perkiraan Harga',
    question: 'Komponen biaya langsung personel pada pengadaan jasa konsultansi meliputi?',
    options: ['Gaji dasar, biaya sosial, biaya tidak langsung, dan profit', 'Gaji personel, biaya ekonomi, biaya tidak langsung, dan profit', 'Gaji pegawai, biaya ekonomi, biaya tidak langsung, dan profit', 'Gaji tim konsultan, biaya sosial, biaya langsung, dan profit'],
    answer: 0,
    explanation: 'Komponen biaya langsung personel mencakup gaji dasar, biaya sosial, biaya tidak langsung, dan profit.'
  },
  {
    id: 36,
    topic: 'HPS',
    question: 'Contoh pengadaan yang menggunakan HPS adalah?',
    options: ['Tender jasa lainnya senilai Rp201 juta', 'Pengadaan langsung ATK senilai Rp10 juta', 'e-Purchasing APAR senilai Rp210 juta', 'Pekerjaan terintegrasi senilai Rp300 miliar'],
    answer: 0,
    explanation: 'Tender jasa lainnya memerlukan HPS dalam proses pengadaannya.'
  },
  {
    id: 37,
    topic: 'Cara Pengadaan',
    question: 'Contoh pengadaan yang dapat dilakukan secara swakelola adalah?',
    options: ['Pemeliharaan kendaraan tempur', 'Pembangunan gedung kantor', 'Pengadaan laptop pegawai', 'Pengadaan ATK kantor'],
    answer: 0,
    explanation: 'Kegiatan tertentu yang lebih tepat dilakukan oleh instansi/kelompok terkait dapat dipertimbangkan sebagai swakelola.'
  },
  {
    id: 38,
    topic: 'Tujuan PBJ',
    question: 'Strategi pengadaan untuk meningkatkan peran pelaku usaha nasional adalah?',
    options: ['Mengalokasikan minimal 40% anggaran untuk UMK/koperasi', 'Mendorong inovasi pengadaan', 'Menyelenggarakan LPSE untuk semua jenis pengadaan', 'Memperkuat SDM dan kelembagaan'],
    answer: 0,
    explanation: 'Alokasi untuk UMK/koperasi mendukung peran pelaku usaha nasional.'
  },
  {
    id: 39,
    topic: 'Strategi Pemaketan',
    question: 'Pemaketan barang/jasa dilakukan dengan mempertimbangkan hal-hal berikut?',
    options: ['Keluaran, volume, ketersediaan, kemampuan pelaku usaha, dan anggaran', 'Keluaran, volume, tenaga ahli, kemampuan swakelola, dan anggaran', 'Keluaran, volume, barang, kemampuan pelaku pengadaan, dan anggaran', 'Keluaran, volume, barang, dan tata kelola anggaran'],
    answer: 0,
    explanation: 'Pemaketan mempertimbangkan output, volume, ketersediaan, kemampuan pelaku usaha, dan anggaran.'
  },
  {
    id: 40,
    topic: 'Konsolidasi',
    question: 'Konsolidasi pengadaan dapat dilakukan oleh?',
    options: ['KPA/PPK pada tahap perencanaan', 'KPA/PA pada tahap persiapan pengadaan', 'PPK/PA pada tahap persiapan pemilihan', 'PPK/UKPBJ pada tahap pemilihan'],
    answer: 0,
    explanation: 'Konsolidasi dapat dilakukan sejak tahap perencanaan oleh KPA/PPK sesuai kebutuhan.'
  },
  {
    id: 41,
    topic: 'UKPBJ',
    question: 'Pembentukan UKPBJ secara struktural berdasarkan kebutuhan dan regulasi dilakukan oleh?',
    options: ['Kepala Daerah', 'Kuasa Pengguna Anggaran', 'Pengguna Anggaran', 'Pejabat Pembuat Komitmen'],
    answer: 0,
    explanation: 'Pembentukan UKPBJ secara struktural dilakukan oleh Kepala Daerah.'
  },
  {
    id: 42,
    topic: 'UKPBJ',
    question: 'Bidang UKPBJ yang menjalankan fungsi pengelolaan sistem informasi PBJ adalah?',
    options: ['Pengelolaan LPSE', 'Pengelolaan PBJ', 'Pembinaan SDM dan kelembagaan', 'Pendampingan, konsultasi, dan bimtek'],
    answer: 0,
    explanation: 'Fungsi sistem informasi pengadaan berada pada pengelolaan LPSE.'
  },
  {
    id: 43,
    topic: 'UKPBJ',
    question: 'Dari empat bidang UKPBJ, bidang yang dapat digabungkan adalah?',
    options: ['Bidang 3 dan 4', 'Bidang 2 dan 3', 'Bidang 2 dan 1', 'Bidang 1 dan 4'],
    answer: 0,
    explanation: 'Bidang pembinaan SDM/kelembagaan dan pendampingan/konsultasi dapat digabungkan.'
  },
  {
    id: 44,
    topic: 'Persiapan Pemilihan',
    question: 'Reviu dokumen persiapan pengadaan oleh Pokja merupakan aktivitas pada tahap apa?',
    options: ['Perencanaan pengadaan', 'Persiapan pemilihan', 'Pemilihan penyedia', 'Pelaksanaan pengadaan'],
    answer: 1,
    explanation: 'Reviu dokumen persiapan pengadaan oleh Pokja dilakukan pada tahap persiapan pemilihan.'
  }
];

const TRYOUT_STATE = {
  current: 0,
  score: 0,
  answered: false,
  selected: null,
  order: []
};

/* =========================================================
   CSS INJECT
========================================================= */

function injectProcurementCss() {
  if (document.getElementById('procurement-stacker-css')) return;

  const style = document.createElement('style');
  style.id = 'procurement-stacker-css';
  style.textContent = `
    .lux-scroll-progress{
      position:fixed;
      left:0;
      top:0;
      width:0%;
      height:4px;
      z-index:99999;
      background:linear-gradient(90deg,#123a72,#2563eb,#22d3ee);
      box-shadow:0 0 22px rgba(34,211,238,.55);
      transition:width .08s linear;
    }

    .ps-dashboard{
      display:flex;
      flex-direction:column;
      gap:16px;
      position:relative;
      isolation:isolate;
    }

    .ps-dashboard::before{
      content:"";
      position:fixed;
      inset:0;
      pointer-events:none;
      background:
        radial-gradient(circle at 12% 8%, rgba(37,99,235,.12), transparent 28%),
        radial-gradient(circle at 90% 18%, rgba(34,211,238,.10), transparent 26%),
        radial-gradient(circle at 50% 92%, rgba(15,118,110,.08), transparent 34%);
      z-index:-1;
      animation:luxBgMove 12s ease-in-out infinite alternate;
    }

    @keyframes luxBgMove{
      from{transform:translate3d(0,0,0) scale(1);opacity:.85;}
      to{transform:translate3d(0,-16px,0) scale(1.04);opacity:1;}
    }

    .lux-reveal{
      opacity:0;
      transform:translateY(34px) scale(.985);
      filter:blur(8px);
      transition:
        opacity .75s cubic-bezier(.2,.8,.2,1),
        transform .75s cubic-bezier(.2,.8,.2,1),
        filter .75s cubic-bezier(.2,.8,.2,1);
      transition-delay:var(--lux-delay,0ms);
    }

    .lux-reveal.is-visible{
      opacity:1;
      transform:translateY(0) scale(1);
      filter:blur(0);
    }

    .ps-hero{
      min-height:360px;
      display:flex;
      align-items:center;
      position:relative;
      overflow:hidden;
      border-radius:34px;
      padding:36px;
      color:#fff;
      background:
        radial-gradient(circle at top right, rgba(34,211,238,.25), transparent 30%),
        radial-gradient(circle at 12% 12%, rgba(255,255,255,.11), transparent 24%),
        linear-gradient(135deg,#102544 0%,#123a72 48%,#245a9b 78%,#0f766e 100%);
      box-shadow:0 26px 68px rgba(18,58,114,.22);
    }

    .ps-hero::before{
      content:"";
      position:absolute;
      inset:-40%;
      background:linear-gradient(115deg, transparent 0%, rgba(255,255,255,.14) 46%, transparent 56%);
      transform:rotate(10deg);
      animation:psHeroShine 5.8s ease-in-out infinite;
      pointer-events:none;
    }

    .ps-hero::after{
      content:"";
      position:absolute;
      width:460px;
      height:460px;
      right:-120px;
      top:-140px;
      border-radius:999px;
      background:radial-gradient(circle, rgba(34,211,238,.27), transparent 65%);
      filter:blur(4px);
      transform:translateY(var(--hero-parallax,0px));
    }

    @keyframes psHeroShine{
      0%,70%{transform:translateX(-24%) rotate(10deg);opacity:0;}
      78%{opacity:1;}
      100%{transform:translateX(24%) rotate(10deg);opacity:0;}
    }

    .ps-kicker{
      position:relative;
      z-index:2;
      display:inline-flex;
      align-items:center;
      min-height:31px;
      padding:0 12px;
      border-radius:999px;
      background:rgba(255,255,255,.13);
      border:1px solid rgba(255,255,255,.20);
      color:#dff7ff;
      font-size:12px;
      font-weight:900;
      letter-spacing:.08em;
      text-transform:uppercase;
    }

    .ps-hero h3{
      position:relative;
      z-index:2;
      margin:16px 0 0;
      font-size:44px;
      line-height:1.03;
      font-weight:950;
      letter-spacing:-.05em;
    }

    .ps-hero p{
      position:relative;
      z-index:2;
      margin:12px 0 0;
      max-width:980px;
      color:rgba(255,255,255,.84);
      font-size:14px;
      line-height:1.75;
    }

    .lux-section-label{
      display:flex;
      align-items:center;
      gap:10px;
      margin:4px 0 0;
      color:#64748b;
      font-size:12px;
      font-weight:900;
      letter-spacing:.12em;
      text-transform:uppercase;
    }

    .lux-section-label::before{
      content:"";
      width:34px;
      height:2px;
      border-radius:999px;
      background:linear-gradient(90deg,#123a72,#22d3ee);
      box-shadow:0 0 14px rgba(34,211,238,.38);
    }

    .ps-game-grid{
      display:grid;
      grid-template-columns:minmax(0,1.45fr) minmax(370px,.75fr);
      gap:16px;
      align-items:start;
    }

    .ps-card{
      background:rgba(255,255,255,.88);
      border:1px solid rgba(255,255,255,.72);
      border-radius:28px;
      padding:18px;
      box-shadow:0 10px 28px rgba(15,23,42,.07);
      backdrop-filter:blur(12px);
      position:relative;
      overflow:hidden;
    }

    .ps-card::before{
      content:"";
      position:absolute;
      left:0;
      top:0;
      right:0;
      height:1px;
      background:linear-gradient(90deg,transparent,rgba(37,99,235,.45),rgba(34,211,238,.45),transparent);
    }

    .ps-card-head{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:16px;
      margin-bottom:16px;
    }

    .ps-card h3{
      margin:0;
      color:#102544;
      font-size:22px;
      line-height:1.2;
      font-weight:950;
      letter-spacing:-.02em;
    }

    .ps-card p{
      margin:6px 0 0;
      color:#64748b;
      font-size:13px;
      line-height:1.65;
    }

    .ps-level-pill,
    .ps-mode-pill{
      display:inline-flex;
      align-items:center;
      min-height:36px;
      padding:0 12px;
      border-radius:999px;
      background:#eff6ff;
      color:#123a72;
      font-size:12px;
      font-weight:900;
      white-space:nowrap;
      border:1px solid #dbeafe;
    }

    .ps-case-panel{
      display:grid;
      grid-template-columns:1fr 120px 110px 110px;
      gap:10px;
      margin-bottom:16px;
    }

    .ps-case-box{
      min-height:76px;
      padding:12px;
      border-radius:18px;
      background:#f8fbff;
      border:1px solid #dbeafe;
    }

    .ps-case-box label{
      display:block;
      color:#64748b;
      font-size:11px;
      font-weight:850;
      text-transform:uppercase;
      letter-spacing:.06em;
      margin-bottom:7px;
    }

    .ps-case-box strong{
      display:block;
      color:#102544;
      font-size:15px;
      font-weight:950;
      line-height:1.25;
    }

    .ps-case-box span{
      display:block;
      color:#475569;
      font-size:12px;
      line-height:1.45;
      margin-top:4px;
    }

    .ps-score-grid{
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:10px;
      margin-bottom:16px;
    }

    .ps-score-card{
      position:relative;
      overflow:hidden;
      border-radius:18px;
      padding:12px;
      background:#f8fbff;
      border:1px solid #dbeafe;
    }

    .ps-score-card label{
      display:block;
      color:#64748b;
      font-size:11px;
      font-weight:850;
      text-transform:uppercase;
      letter-spacing:.06em;
    }

    .ps-score-card strong{
      display:block;
      margin-top:8px;
      color:#102544;
      font-size:25px;
      line-height:1;
      font-weight:950;
    }

    .ps-score-card.fx-pop strong{
      animation:psScorePop .38s ease;
    }

    @keyframes psScorePop{
      0%{transform:scale(1);}
      50%{transform:scale(1.18);}
      100%{transform:scale(1);}
    }

    .ps-progress-track{
      height:11px;
      border-radius:999px;
      background:#e5edf5;
      overflow:hidden;
      margin-bottom:16px;
    }

    .ps-progress-bar{
      height:100%;
      width:0%;
      background:linear-gradient(90deg,#123a72,#2563eb,#22d3ee);
      border-radius:999px;
      transition:.25s ease;
      box-shadow:0 0 18px rgba(34,211,238,.32);
    }

    .ps-pipeline{
      display:grid;
      grid-template-columns:repeat(5,minmax(0,1fr));
      gap:10px;
      margin-bottom:16px;
    }

    .ps-slot{
      min-height:118px;
      border-radius:20px;
      border:2px dashed #c9d8e8;
      background:#f8fbff;
      padding:10px;
      position:relative;
      transition:.18s ease;
    }

    .ps-slot.drag-over{
      border-color:#2563eb;
      background:#eff6ff;
      box-shadow:0 0 0 4px rgba(37,99,235,.10);
      transform:translateY(-2px);
    }

    .ps-slot.correct{
      border-style:solid;
      border-color:#86efac;
      background:#ecfdf5;
    }

    .ps-slot.fx-correct{
      animation:psSlotCorrect .46s ease;
    }

    @keyframes psSlotCorrect{
      0%{transform:scale(.96);box-shadow:0 0 0 rgba(34,197,94,0);}
      55%{transform:scale(1.04);box-shadow:0 0 0 8px rgba(34,197,94,.14);}
      100%{transform:scale(1);box-shadow:0 0 0 rgba(34,197,94,0);}
    }

    .ps-slot-number{
      position:absolute;
      top:8px;
      right:9px;
      width:24px;
      height:24px;
      border-radius:9px;
      display:flex;
      align-items:center;
      justify-content:center;
      color:#64748b;
      background:#e5edf5;
      font-size:11px;
      font-weight:950;
      z-index:3;
    }

    .ps-slot-placeholder{
      height:100%;
      min-height:88px;
      display:flex;
      align-items:center;
      justify-content:center;
      text-align:center;
      color:#94a3b8;
      font-size:12px;
      font-weight:850;
      padding:10px;
    }

    .ps-bank{
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      min-height:130px;
      padding:14px;
      border-radius:22px;
      background:#f8fbff;
      border:1px solid #dbeafe;
    }

    .ps-action-card{
      width:150px;
      min-height:98px;
      border:none;
      cursor:grab;
      border-radius:18px;
      padding:12px;
      background:#fff;
      border:1px solid #dbe5f0;
      box-shadow:0 8px 20px rgba(15,23,42,.06);
      text-align:left;
      transition:.18s ease;
      user-select:none;
      position:relative;
      overflow:hidden;
    }

    .ps-action-card:hover{
      transform:translateY(-2px);
      box-shadow:0 14px 26px rgba(15,23,42,.10);
    }

    .ps-action-card.used{
      opacity:.33;
      pointer-events:none;
      transform:scale(.98);
      filter:grayscale(.35);
    }

    .ps-action-card.wrong{
      animation:psShake .30s ease;
      border-color:#fecaca;
      background:#fff1f2;
    }

    .ps-action-card.correct-card{
      background:#dcfce7;
      border-color:#86efac;
    }

    @keyframes psShake{
      0%{transform:translateX(0);}
      20%{transform:translateX(-8px);}
      40%{transform:translateX(8px);}
      60%{transform:translateX(-6px);}
      80%{transform:translateX(4px);}
      100%{transform:translateX(0);}
    }

    .ps-card-icon{
      width:35px;
      height:35px;
      display:flex;
      align-items:center;
      justify-content:center;
      border-radius:13px;
      background:#eff6ff;
      margin-bottom:8px;
      font-size:17px;
    }

    .ps-action-card strong{
      display:block;
      color:#102544;
      font-size:13px;
      font-weight:950;
      line-height:1.2;
    }

    .ps-action-card span{
      display:block;
      margin-top:5px;
      color:#64748b;
      font-size:11px;
      line-height:1.35;
    }

    .ps-slot .ps-action-card{
      width:100%;
      min-height:94px;
      cursor:default;
      box-shadow:none;
    }

    .ps-side{
      display:flex;
      flex-direction:column;
      gap:16px;
    }

    .lux-sticky-side{
      position:sticky;
      top:18px;
    }

    .ps-buttons{
      display:flex;
      gap:10px;
      flex-wrap:wrap;
    }

    .ps-btn{
      border:none;
      min-height:40px;
      padding:0 14px;
      border-radius:14px;
      cursor:pointer;
      font-size:12px;
      font-weight:900;
      transition:.18s ease;
    }

    .ps-btn-primary{
      background:linear-gradient(135deg,#123a72,#2563eb);
      color:#fff;
      box-shadow:0 12px 24px rgba(18,58,114,.16);
    }

    .ps-btn-soft{
      background:#eef4fb;
      color:#123a72;
      border:1px solid #d9e6f4;
    }

    .ps-btn:hover{
      transform:translateY(-1px);
    }

    .ps-btn:disabled{
      opacity:.45;
      cursor:not-allowed;
      transform:none;
    }

    .ps-concept-box{
      border-radius:18px;
      padding:12px;
      background:#f8fbff;
      border:1px solid #dbeafe;
      margin-bottom:12px;
    }

    .ps-concept-box label{
      display:block;
      color:#64748b;
      font-size:11px;
      font-weight:900;
      text-transform:uppercase;
      letter-spacing:.08em;
      margin-bottom:7px;
    }

    .ps-concept-box strong{
      color:#102544;
      font-size:13px;
      line-height:1.55;
      display:block;
    }

    .ps-log{
      display:flex;
      flex-direction:column;
      gap:9px;
      max-height:410px;
      overflow:auto;
      padding-right:4px;
    }

    .ps-log-item{
      display:grid;
      grid-template-columns:34px 1fr;
      gap:10px;
      align-items:start;
      padding:11px;
      border-radius:16px;
      background:#f8fbff;
      border:1px solid #dbeafe;
      color:#334155;
      font-size:12px;
      line-height:1.5;
      animation:psLogIn .25s ease;
    }

    @keyframes psLogIn{
      from{opacity:0;transform:translateY(8px);}
      to{opacity:1;transform:translateY(0);}
    }

    .ps-log-icon{
      width:34px;
      height:34px;
      border-radius:12px;
      display:flex;
      align-items:center;
      justify-content:center;
      color:#fff;
      font-weight:950;
    }

    .ps-log-icon.ok{background:#16a34a;}
    .ps-log-icon.bad{background:#dc2626;}
    .ps-log-icon.info{background:#2563eb;}

    .ps-log-title{
      font-weight:950;
      color:#102544;
      margin-bottom:3px;
    }

    .ps-log-sub{
      color:#64748b;
      line-height:1.55;
    }

    .ps-finish{
      display:none;
      border-radius:24px;
      padding:18px;
      background:
        radial-gradient(circle at top right, rgba(34,211,238,.22), transparent 32%),
        linear-gradient(135deg,#102544,#123a72);
      color:#fff;
      margin-top:16px;
      overflow:hidden;
      position:relative;
    }

    .ps-finish.show{
      display:block;
      animation:psFinishPop .38s ease;
    }

    @keyframes psFinishPop{
      from{opacity:0;transform:translateY(16px) scale(.98);}
      to{opacity:1;transform:translateY(0) scale(1);}
    }

    .ps-finish h3{
      margin:0;
      color:#fff;
      font-size:23px;
      font-weight:950;
    }

    .ps-finish p{
      color:rgba(255,255,255,.78);
    }

    .ps-stars{
      margin-top:10px;
      font-size:28px;
      letter-spacing:3px;
      color:#fde68a;
    }

    .ps-quick-grid{
      display:grid;
      grid-template-columns:repeat(4,minmax(0,1fr));
      gap:12px;
    }

    .ps-toast{
      position:fixed;
      right:22px;
      bottom:22px;
      z-index:99999;
      min-width:280px;
      max-width:420px;
      padding:14px 16px;
      border-radius:18px;
      color:#fff;
      box-shadow:0 18px 42px rgba(15,23,42,.22);
      transform:translateY(20px);
      opacity:0;
      pointer-events:none;
      transition:.22s ease;
      font-size:13px;
      line-height:1.55;
      font-weight:800;
    }

    .ps-toast.show{
      transform:translateY(0);
      opacity:1;
    }

    .ps-toast.ok{background:linear-gradient(135deg,#15803d,#16a34a);}
    .ps-toast.bad{background:linear-gradient(135deg,#991b1b,#dc2626);}
    .ps-toast.info{background:linear-gradient(135deg,#123a72,#2563eb);}

    .ps-screen-flash{
      position:fixed;
      inset:0;
      z-index:99998;
      pointer-events:none;
      opacity:0;
    }

    .ps-screen-flash.ok{
      background:rgba(34,197,94,.14);
      animation:psFlash .34s ease;
    }

    .ps-screen-flash.bad{
      background:rgba(220,38,38,.13);
      animation:psFlash .34s ease;
    }

    @keyframes psFlash{
      0%{opacity:0;}
      35%{opacity:1;}
      100%{opacity:0;}
    }

    .ps-floating-score{
      position:fixed;
      z-index:99999;
      font-size:13px;
      font-weight:950;
      color:#fff;
      padding:8px 11px;
      border-radius:999px;
      pointer-events:none;
      animation:psFloatScore .75s ease forwards;
      box-shadow:0 12px 28px rgba(15,23,42,.18);
    }

    .ps-floating-score.ok{background:#16a34a;}
    .ps-floating-score.bad{background:#dc2626;}

    @keyframes psFloatScore{
      from{opacity:0;transform:translateY(8px) scale(.92);}
      20%{opacity:1;}
      to{opacity:0;transform:translateY(-34px) scale(1.05);}
    }

    .ps-confetti{
      position:fixed;
      width:8px;
      height:12px;
      z-index:99999;
      pointer-events:none;
      animation:psConfettiFall .9s ease forwards;
      border-radius:2px;
    }

    @keyframes psConfettiFall{
      from{opacity:1;transform:translateY(0) rotate(0deg);}
      to{opacity:0;transform:translateY(110px) rotate(220deg);}
    }

    .tryout-options{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:10px;
      padding:14px;
      border-radius:22px;
      background:#f8fbff;
      border:1px solid #dbeafe;
    }

    .tryout-option{
      width:100%;
      min-height:84px;
      cursor:pointer;
    }

    .tryout-option:disabled{
      cursor:not-allowed;
      opacity:.95;
    }

    .tryout-topic-grid{
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      margin-top:12px;
    }

    .tryout-topic-chip{
      display:inline-flex;
      align-items:center;
      min-height:30px;
      padding:0 10px;
      border-radius:999px;
      background:#eff6ff;
      border:1px solid #dbeafe;
      color:#123a72;
      font-size:11px;
      font-weight:850;
    }

    .quick-card{
      width:100%;
      border:none;
      cursor:pointer;
      background:rgba(255,255,255,.88);
      border:1px solid rgba(255,255,255,.72);
      border-radius:22px;
      padding:16px;
      box-shadow:0 8px 20px rgba(15,23,42,.06);
      display:grid;
      grid-template-columns:54px 1fr 18px;
      gap:12px;
      align-items:center;
      text-align:left;
    }

    .quick-icon{
      width:54px;
      height:54px;
      border-radius:18px;
      color:#fff;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:22px;
      box-shadow:0 12px 22px rgba(15,23,42,.14);
    }

    .quick-title{
      font-size:16px;
      font-weight:900;
      color:#102544;
    }

    .quick-text{
      margin-top:4px;
      font-size:13px;
      line-height:1.55;
      color:#64748b;
    }

    .quick-arrow{
      font-size:22px;
      color:#94a3b8;
      font-weight:900;
    }

    .footer-note{
      text-align:center;
      color:#64748b;
      font-size:13px;
      margin:12px 0 8px;
    }

    @media (max-width:1280px){
      .ps-game-grid{
        grid-template-columns:1fr;
      }

      .ps-pipeline{
        grid-template-columns:repeat(4,minmax(0,1fr));
      }

      .ps-case-panel{
        grid-template-columns:1fr 1fr;
      }

      .ps-quick-grid{
        grid-template-columns:repeat(2,minmax(0,1fr));
      }
    }
  `;

  document.head.appendChild(style);
}

/* =========================================================
   FX
========================================================= */

function showToast(message, type = 'info') {
  let toast = document.getElementById('psToast');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'psToast';
    toast.className = 'ps-toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `ps-toast ${type}`;

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 1800);
}

function flashScreen(type) {
  let flash = document.getElementById('psScreenFlash');

  if (!flash) {
    flash = document.createElement('div');
    flash.id = 'psScreenFlash';
    flash.className = 'ps-screen-flash';
    document.body.appendChild(flash);
  }

  flash.className = `ps-screen-flash ${type}`;

  setTimeout(() => {
    flash.className = 'ps-screen-flash';
  }, 360);
}

function popScore(target, text, type) {
  const rect = target.getBoundingClientRect();
  const el = document.createElement('div');

  el.className = `ps-floating-score ${type}`;
  el.textContent = text;
  el.style.left = `${rect.left + Math.min(80, rect.width / 2)}px`;
  el.style.top = `${rect.top + 8}px`;

  document.body.appendChild(el);

  setTimeout(() => el.remove(), 850);
}

function spawnConfetti() {
  const colors = ['#2563eb', '#22d3ee', '#16a34a', '#f59e0b', '#ef4444'];
  const centerX = window.innerWidth / 2;
  const startY = 90;

  for (let i = 0; i < 42; i++) {
    const piece = document.createElement('div');
    piece.className = 'ps-confetti';
    piece.style.left = `${centerX + (Math.random() * 520 - 260)}px`;
    piece.style.top = `${startY + Math.random() * 40}px`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * .18}s`;

    document.body.appendChild(piece);

    setTimeout(() => piece.remove(), 1100);
  }
}

function pulseScoreCard(id) {
  const el = document.getElementById(id);

  if (!el) return;

  el.classList.remove('fx-pop');
  void el.offsetWidth;
  el.classList.add('fx-pop');

  setTimeout(() => el.classList.remove('fx-pop'), 420);
}

/* =========================================================
   STACKER LOGIC
========================================================= */

function getStackerLevel() {
  return STACKER_LEVELS[STACKER_STATE.levelIndex] || STACKER_LEVELS[0];
}

function resetStackerLevel(keepLog = false) {
  const level = getStackerLevel();

  STACKER_STATE.placed = Array(level.ideal.length).fill(null);
  STACKER_STATE.compliance = 0;
  STACKER_STATE.risk = 0;
  STACKER_STATE.progress = 0;
  STACKER_STATE.wrong = 0;
  STACKER_STATE.finished = false;
  STACKER_STATE.shuffledCards = shuffleArray(level.cards);
  STACKER_STATE.shuffledLevelIndex = STACKER_STATE.levelIndex;

  renderStackerGame();

  if (!keepLog) {
    setStackerLog([
      {
        type: 'info',
        title: 'Misi dimulai',
        text: `${level.caseTitle}. Kartu sudah diacak. Susun pipeline sesuai konsep: ${level.concept}`
      }
    ]);
  }

  showToast('Kartu diacak. Level dimulai.', 'info');
}

function nextStackerLevel() {
  if (STACKER_STATE.levelIndex < STACKER_LEVELS.length - 1) {
    STACKER_STATE.levelIndex += 1;
  } else {
    STACKER_STATE.levelIndex = 0;
  }

  resetStackerLevel(false);
}

function renderStackerGame() {
  const root = document.getElementById('procurementStackerRoot');

  if (!root) return;

  const level = getStackerLevel();
  const placedIds = new Set(STACKER_STATE.placed.filter(Boolean).map(item => item.id));

  if (!STACKER_STATE.shuffledCards.length || STACKER_STATE.shuffledLevelIndex !== STACKER_STATE.levelIndex) {
    STACKER_STATE.shuffledCards = shuffleArray(level.cards);
    STACKER_STATE.shuffledLevelIndex = STACKER_STATE.levelIndex;
  }

  root.innerHTML = `
    <section class="ps-game-grid">
      <div class="ps-card">
        <div class="ps-card-head">
          <div>
            <h3>${escapeHtml(level.title)}</h3>
            <p>${escapeHtml(level.caseDesc)}</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
            <div class="ps-mode-pill">Sertifikasi Mode</div>
            <div class="ps-level-pill">${STACKER_STATE.levelIndex + 1} / ${STACKER_LEVELS.length}</div>
          </div>
        </div>

        <div class="ps-case-panel">
          <div class="ps-case-box">
            <label>Kasus</label>
            <strong>${escapeHtml(level.caseTitle)}</strong>
            <span>${escapeHtml(level.caseDesc)}</span>
          </div>
          <div class="ps-case-box">
            <label>Pagu</label>
            <strong>${escapeHtml(level.budget)}</strong>
          </div>
          <div class="ps-case-box">
            <label>Deadline</label>
            <strong>${escapeHtml(level.deadline)}</strong>
          </div>
          <div class="ps-case-box">
            <label>Tingkat</label>
            <strong>${escapeHtml(level.difficulty)}</strong>
          </div>
        </div>

        <div class="ps-score-grid">
          <div class="ps-score-card" id="psProgressCard">
            <label>Progress</label>
            <strong id="psProgressText">${STACKER_STATE.progress}%</strong>
          </div>
          <div class="ps-score-card" id="psComplianceCard">
            <label>Kepatuhan</label>
            <strong id="psComplianceText">${STACKER_STATE.compliance}</strong>
          </div>
          <div class="ps-score-card" id="psRiskCard">
            <label>Risiko</label>
            <strong id="psRiskText">${STACKER_STATE.risk}</strong>
          </div>
        </div>

        <div class="ps-progress-track">
          <div class="ps-progress-bar" id="psProgressBar" style="width:${STACKER_STATE.progress}%"></div>
        </div>

        <div class="ps-pipeline" id="psPipeline">
          ${level.ideal.map((stepId, index) => renderStackerSlot(index)).join('')}
        </div>

        <div class="ps-card-head">
          <div>
            <h3>Kartu Aksi Acak</h3>
            <p>Drag kartu ke slot pipeline. Tidak semua kartu harus dipakai. Kartu jebakan akan menaikkan risiko.</p>
          </div>
          <button type="button" class="ps-btn ps-btn-soft" id="psShuffleBtn">Acak Ulang Kartu</button>
        </div>

        <div class="ps-bank" id="psCardBank">
          ${STACKER_STATE.shuffledCards.map(card => renderStackerCard(card, placedIds.has(card.id))).join('')}
        </div>

        <div class="ps-finish" id="psFinishBox">
          ${renderStackerFinish()}
        </div>
      </div>

      <aside class="ps-side lux-sticky-side">
        <div class="ps-card">
          <div class="ps-card-head">
            <div>
              <h3>Kontrol Level</h3>
              <p>Ulang level, acak kartu, atau lanjut studi kasus berikutnya.</p>
            </div>
          </div>

          <div class="ps-concept-box">
            <label>Konsep yang dilatih</label>
            <strong>${escapeHtml(level.concept)}</strong>
          </div>

          <div class="ps-buttons">
            <button type="button" class="ps-btn ps-btn-soft" id="psResetBtn">Reset Level</button>
            <button type="button" class="ps-btn ps-btn-primary" id="psNextBtn" ${STACKER_STATE.finished ? '' : 'disabled'}>
              Level Berikutnya
            </button>
          </div>
        </div>

        <div class="ps-card">
          <div class="ps-card-head">
            <div>
              <h3>Pembahasan</h3>
              <p>Setiap aksi memberi alasan seperti latihan studi kasus.</p>
            </div>
          </div>

          <div class="ps-log" id="psLog"></div>
        </div>
      </aside>
    </section>
  `;

  bindStackerEvents();
  refreshStackerScore();
  restoreStackerLog();

  const finishBox = document.getElementById('psFinishBox');

  if (finishBox && STACKER_STATE.finished) {
    finishBox.classList.add('show');
  }
}

function renderStackerSlot(index) {
  const placed = STACKER_STATE.placed[index];

  if (placed) {
    return `
      <div class="ps-slot correct" data-slot-index="${index}">
        <div class="ps-slot-number">${index + 1}</div>
        ${renderStackerCard(placed, false, true)}
      </div>
    `;
  }

  return `
    <div class="ps-slot" data-slot-index="${index}">
      <div class="ps-slot-number">${index + 1}</div>
      <div class="ps-slot-placeholder">Drop aksi ke-${index + 1}</div>
    </div>
  `;
}

function renderStackerCard(card, used = false, locked = false) {
  return `
    <div
      class="ps-action-card ${used ? 'used' : ''} ${locked ? 'correct-card' : ''}"
      draggable="${used || locked ? 'false' : 'true'}"
      data-card-id="${escapeHtml(card.id)}"
    >
      <div class="ps-card-icon">${card.icon}</div>
      <strong>${escapeHtml(card.label)}</strong>
      <span>${escapeHtml(card.note)}</span>
    </div>
  `;
}

function renderStackerFinish() {
  if (!STACKER_STATE.finished) return '';

  const stars = getStackerStars();
  const title = stars >= 3
    ? 'Mission Complete — PPK Aman'
    : stars === 2
      ? 'Mission Complete — Aman dengan Catatan'
      : 'Mission Complete — Perlu Pembinaan';

  return `
    <h3>${title}</h3>
    <div class="ps-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
    <p>
      Kepatuhan ${STACKER_STATE.compliance}, Risiko ${STACKER_STATE.risk}, salah langkah ${STACKER_STATE.wrong}.
      Ulangi level untuk mengejar 3 bintang.
    </p>
  `;
}

function getStackerStars() {
  if (STACKER_STATE.risk <= 10 && STACKER_STATE.wrong === 0) return 3;
  if (STACKER_STATE.risk <= 35 && STACKER_STATE.wrong <= 2) return 2;
  return 1;
}

function bindStackerEvents() {
  document.querySelectorAll('.ps-action-card[draggable="true"]').forEach(card => {
    card.addEventListener('dragstart', event => {
      event.dataTransfer.setData('text/plain', card.dataset.cardId);
      event.dataTransfer.effectAllowed = 'move';
    });
  });

  document.querySelectorAll('.ps-slot').forEach(slot => {
    slot.addEventListener('dragover', event => {
      event.preventDefault();
      slot.classList.add('drag-over');
    });

    slot.addEventListener('dragleave', () => {
      slot.classList.remove('drag-over');
    });

    slot.addEventListener('drop', event => {
      event.preventDefault();
      slot.classList.remove('drag-over');

      const cardId = event.dataTransfer.getData('text/plain');
      const slotIndex = Number(slot.dataset.slotIndex);

      handleStackerDrop(cardId, slotIndex, slot);
    });
  });

  const resetBtn = document.getElementById('psResetBtn');
  const nextBtn = document.getElementById('psNextBtn');
  const shuffleBtn = document.getElementById('psShuffleBtn');

  if (resetBtn) resetBtn.addEventListener('click', () => resetStackerLevel(false));
  if (nextBtn) nextBtn.addEventListener('click', nextStackerLevel);

  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      const level = getStackerLevel();
      STACKER_STATE.shuffledCards = shuffleArray(level.cards);
      STACKER_STATE.shuffledLevelIndex = STACKER_STATE.levelIndex;
      renderStackerGame();
      showToast('Kartu diacak ulang.', 'info');
    });
  }
}

function handleStackerDrop(cardId, slotIndex, slotEl) {
  if (STACKER_STATE.finished) return;

  const level = getStackerLevel();
  const expectedId = level.ideal[slotIndex];
  const card = level.cards.find(item => item.id === cardId);

  if (!card) return;

  const alreadyPlaced = STACKER_STATE.placed.some(item => item && item.id === cardId);
  if (alreadyPlaced) return;

  const nextEmptyIndex = STACKER_STATE.placed.findIndex(item => item === null);

  if (slotIndex !== nextEmptyIndex) {
    wrongStackerMove(cardId, `Isi pipeline dari kiri ke kanan. Slot berikutnya adalah nomor ${nextEmptyIndex + 1}.`, true);
    return;
  }

  if (cardId !== expectedId) {
    wrongStackerMove(cardId, getWrongMessage(cardId, expectedId), true);
    return;
  }

  STACKER_STATE.placed[slotIndex] = card;
  STACKER_STATE.compliance += 10;
  STACKER_STATE.progress = Math.round((STACKER_STATE.placed.filter(Boolean).length / level.ideal.length) * 100);

  addStackerLog({
    type: 'ok',
    title: `${card.label} tepat`,
    text: getCorrectMessage(cardId)
  });

  showToast(`Benar: ${card.label}`, 'ok');
  flashScreen('ok');
  popScore(slotEl || document.body, '+10 Kepatuhan', 'ok');
  pulseScoreCard('psComplianceCard');

  if (STACKER_STATE.placed.filter(Boolean).length === level.ideal.length) {
    STACKER_STATE.finished = true;
    STACKER_STATE.compliance += 10;

    addStackerLog({
      type: 'ok',
      title: 'Pipeline selesai',
      text: 'Paket berhasil disusun sampai realisasi. Lanjutkan ke studi kasus berikutnya atau ulangi untuk mengejar 3 bintang.'
    });

    showToast('Mission Complete. Pipeline selesai.', 'ok');
    spawnConfetti();
  }

  renderStackerGame();

  requestAnimationFrame(() => {
    const latestSlot = document.querySelector(`.ps-slot[data-slot-index="${slotIndex}"]`);

    if (latestSlot) {
      latestSlot.classList.add('fx-correct');
      setTimeout(() => latestSlot.classList.remove('fx-correct'), 500);
    }
  });
}

function wrongStackerMove(cardId, message, withFx = false) {
  STACKER_STATE.risk += 10;
  STACKER_STATE.compliance = Math.max(0, STACKER_STATE.compliance - 5);
  STACKER_STATE.wrong += 1;

  const cardEl = document.querySelector(`.ps-action-card[data-card-id="${cardId}"]`);

  if (cardEl) {
    cardEl.classList.remove('wrong');
    void cardEl.offsetWidth;
    cardEl.classList.add('wrong');

    setTimeout(() => {
      cardEl.classList.remove('wrong');
    }, 340);

    if (withFx) {
      popScore(cardEl, '+10 Risiko', 'bad');
    }
  }

  addStackerLog({
    type: 'bad',
    title: 'Langkah belum tepat',
    text: message
  });

  showToast('Belum tepat. Risiko naik.', 'bad');
  flashScreen('bad');
  pulseScoreCard('psRiskCard');

  refreshStackerScore();
  restoreStackerLog();
}

function getCorrectMessage(cardId) {
  const messages = {
    rup: 'RUP menjadi pintu awal untuk memastikan paket, jadwal, pagu, dan metode.',
    identifikasi: 'Identifikasi kebutuhan mencegah paket dobel, tidak relevan, atau tidak sesuai prioritas.',
    konsolidasi: 'Konsolidasi membantu mengelola kebutuhan sejenis agar tidak terpecah tanpa alasan.',
    kak: 'KAK/spesifikasi harus berbasis kebutuhan dan tidak mengarah.',
    'review-spek': 'Review spesifikasi penting agar persaingan sehat.',
    hps: 'HPS/referensi harga menjadi dasar kewajaran biaya.',
    'cek-katalog': 'Cek katalog membantu menentukan apakah e-Purchasing dapat digunakan.',
    'cek-pdn': 'PDN/TKDN perlu diperhatikan untuk mendukung produk dalam negeri.',
    'pilih-metode': 'Metode dipilih setelah kebutuhan, nilai, jadwal, dan pasar dipahami.',
    'metode-pl': 'Pengadaan Langsung tepat bila nilai dan kondisi paket sesuai.',
    'metode-epurchasing': 'e-Purchasing tepat jika tersedia di katalog dan sesuai kebutuhan.',
    tender: 'Tender dipakai saat karakter paket membutuhkan proses pemilihan formal.',
    seleksi: 'Seleksi relevan untuk jasa konsultansi.',
    swakelola: 'Swakelola dapat dipilih jika memenuhi kriteria.',
    klarifikasi: 'Klarifikasi/negosiasi memastikan harga, spesifikasi, dan kemampuan pelaksanaan.',
    proses: 'Proses pemilihan dilakukan setelah dokumen dan metode siap.',
    kontrak: 'Kontrak/SPK menjadi dasar pelaksanaan setelah proses pengadaan.',
    'monitoring-kontrak': 'Monitoring kontrak mengendalikan waktu, mutu, dan kewajiban penyedia.',
    teguran: 'Teguran/evaluasi diperlukan saat penyedia terlambat atau bermasalah.',
    pemeriksaan: 'Pemeriksaan hasil mencegah barang/jasa tidak sesuai langsung diterima.',
    bast: 'BAST dilakukan setelah hasil diperiksa dan sesuai.',
    pembayaran: 'Pembayaran dilakukan setelah dokumen pendukung memadai.',
    realisasi: 'Pencatatan realisasi memastikan data monitoring tidak bolong.'
  };

  return messages[cardId] || 'Langkah ini tepat untuk posisi pipeline saat ini.';
}

function getWrongMessage(cardId, expectedId) {
  const level = getStackerLevel();
  const card = level.cards.find(item => item.id === cardId);
  const expectedCard = level.cards.find(item => item.id === expectedId);

  const cardLabel = card ? card.label : cardId;
  const expectedLabel = expectedCard ? expectedCard.label : expectedId;

  const trapMessages = {
    'kontrak-awal': 'Kontrak dilakukan sebelum dokumen, metode, dan proses jelas. Ini risiko administrasi.',
    'pecah-paket': 'Memecah paket untuk menyesuaikan nilai/metode dapat menurunkan kepatuhan.',
    'spek-mengarah': 'Spesifikasi terlalu mengarah dapat mengganggu fairness dan persaingan.',
    'tunda-dokumen': 'Menunda dokumen saat deadline mepet menaikkan risiko keterlambatan.',
    'abaikan-katalog': 'Mengabaikan katalog membuat analisis metode kurang lengkap.',
    'lewati-rup': 'RUP perlu dicek sebelum paket berjalan.',
    'bast-tanpa-cek': 'BAST tanpa pemeriksaan berisiko menerima barang/jasa yang tidak sesuai.',
    'bayar-dulu': 'Pembayaran perlu didukung dokumen yang benar.',
    'metode-asal-cepat': 'Metode tidak dipilih hanya karena cepat.',
    'realisasi-lupa': 'Realisasi yang tidak dicatat membuat monitoring tidak lengkap.'
  };

  return trapMessages[cardId] || `Belum tepat. Kamu memilih "${cardLabel}", padahal langkah berikutnya seharusnya "${expectedLabel}". Konsep: ${level.concept}`;
}

function refreshStackerScore() {
  const progressText = document.getElementById('psProgressText');
  const complianceText = document.getElementById('psComplianceText');
  const riskText = document.getElementById('psRiskText');
  const progressBar = document.getElementById('psProgressBar');

  if (progressText) progressText.textContent = `${STACKER_STATE.progress}%`;
  if (complianceText) complianceText.textContent = STACKER_STATE.compliance;
  if (riskText) riskText.textContent = STACKER_STATE.risk;
  if (progressBar) progressBar.style.width = `${STACKER_STATE.progress}%`;
}

function getStackerLogStoreKey() {
  return `ps_log_level_${STACKER_STATE.levelIndex}`;
}

function getStackerLog() {
  try {
    return JSON.parse(sessionStorage.getItem(getStackerLogStoreKey()) || '[]');
  } catch (error) {
    return [];
  }
}

function setStackerLog(items) {
  sessionStorage.setItem(getStackerLogStoreKey(), JSON.stringify(items));
  restoreStackerLog();
}

function addStackerLog(item) {
  const logs = getStackerLog();
  logs.unshift(item);
  setStackerLog(logs.slice(0, 12));
}

function restoreStackerLog() {
  const logEl = document.getElementById('psLog');

  if (!logEl) return;

  const logs = getStackerLog();

  if (!logs.length) {
    logEl.innerHTML = `
      <div class="ps-log-item">
        <div class="ps-log-icon info">i</div>
        <div>
          <div class="ps-log-title">Mulai susun kartu</div>
          <div class="ps-log-sub">Drag kartu aksi ke pipeline dari kiri ke kanan.</div>
        </div>
      </div>
    `;
    return;
  }

  logEl.innerHTML = logs.map(item => `
    <div class="ps-log-item">
      <div class="ps-log-icon ${item.type === 'ok' ? 'ok' : item.type === 'bad' ? 'bad' : 'info'}">
        ${item.type === 'ok' ? '✓' : item.type === 'bad' ? '!' : 'i'}
      </div>
      <div>
        <div class="ps-log-title">${escapeHtml(item.title || 'Catatan')}</div>
        <div class="ps-log-sub">${escapeHtml(item.text || '')}</div>
      </div>
    </div>
  `).join('');
}

/* =========================================================
   TRYOUT LOGIC
========================================================= */

function renderTryoutBankPanel() {
  const total = TRYOUT_QUESTIONS.length;
  const topics = [...new Set(TRYOUT_QUESTIONS.map(q => q.topic))];

  return `
    <section class="ps-card lux-reveal">
      <div class="ps-card-head">
        <div>
          <h3>Tryout PBJ Level 1</h3>
          <p>
            Bank soal latihan berbasis materi kompetensi PBJ. Soal dibuat dalam bentuk latihan interaktif,
            bukan sekadar membaca kunci jawaban.
          </p>
        </div>
        <div class="ps-level-pill">${total} Soal</div>
      </div>

      <div class="ps-case-panel">
        <div class="ps-case-box">
          <label>Mode</label>
          <strong>Latihan Sertifikasi</strong>
          <span>Pilih jawaban, lihat pembahasan, lalu lanjut soal berikutnya.</span>
        </div>
        <div class="ps-case-box">
          <label>Topik</label>
          <strong>${topics.length}</strong>
          <span>Materi PBJ</span>
        </div>
        <div class="ps-case-box">
          <label>Soal</label>
          <strong>${total}</strong>
          <span>Butir latihan</span>
        </div>
        <div class="ps-case-box">
          <label>Status</label>
          <strong>Aktif</strong>
          <span>Siap dimainkan</span>
        </div>
      </div>

      <div class="tryout-topic-grid">
        ${topics.map(topic => `<span class="tryout-topic-chip">${escapeHtml(topic)}</span>`).join('')}
      </div>

      <div style="height:14px"></div>

      <div id="tryoutQuizRoot"></div>
    </section>
  `;
}

function initTryoutQuiz() {
  TRYOUT_STATE.current = 0;
  TRYOUT_STATE.score = 0;
  TRYOUT_STATE.answered = false;
  TRYOUT_STATE.selected = null;
  TRYOUT_STATE.order = shuffleArray(TRYOUT_QUESTIONS.map((_, index) => index));

  renderTryoutQuiz();
}

function getCurrentTryoutQuestion() {
  const index = TRYOUT_STATE.order[TRYOUT_STATE.current] ?? 0;
  return TRYOUT_QUESTIONS[index];
}

function renderTryoutQuiz() {
  const root = document.getElementById('tryoutQuizRoot');

  if (!root) return;

  const q = getCurrentTryoutQuestion();
  const nomor = TRYOUT_STATE.current + 1;
  const total = TRYOUT_QUESTIONS.length;
  const progress = Math.round((TRYOUT_STATE.current / total) * 100);

  root.innerHTML = `
    <div class="ps-progress-track">
      <div class="ps-progress-bar" style="width:${progress}%"></div>
    </div>

    <div class="ps-score-grid">
      <div class="ps-score-card">
        <label>Nomor</label>
        <strong>${nomor}/${total}</strong>
      </div>
      <div class="ps-score-card">
        <label>Skor</label>
        <strong>${TRYOUT_STATE.score}</strong>
      </div>
      <div class="ps-score-card">
        <label>Topik</label>
        <strong style="font-size:16px;line-height:1.25;">${escapeHtml(q.topic)}</strong>
      </div>
    </div>

    <div class="ps-concept-box">
      <label>Soal</label>
      <strong>${escapeHtml(q.question)}</strong>
    </div>

    <div class="tryout-options">
      ${q.options.map((option, index) => {
        let cls = '';

        if (TRYOUT_STATE.answered) {
          if (index === q.answer) cls = 'correct-card';
          else if (index === TRYOUT_STATE.selected) cls = 'wrong';
        }

        return `
          <button
            type="button"
            class="ps-action-card tryout-option ${cls}"
            data-tryout-answer="${index}"
            ${TRYOUT_STATE.answered ? 'disabled' : ''}
          >
            <div class="ps-card-icon">${String.fromCharCode(65 + index)}</div>
            <strong>${escapeHtml(option)}</strong>
          </button>
        `;
      }).join('')}
    </div>

    ${TRYOUT_STATE.answered ? `
      <div class="ps-finish show" style="margin-top:14px;">
        <h3>${TRYOUT_STATE.selected === q.answer ? 'Jawaban Benar' : 'Jawaban Belum Tepat'}</h3>
        <p>${escapeHtml(q.explanation)}</p>
      </div>
    ` : ''}

    <div class="ps-buttons" style="margin-top:14px;">
      <button type="button" class="ps-btn ps-btn-soft" id="tryoutResetBtn">Acak Ulang Soal</button>
      <button type="button" class="ps-btn ps-btn-primary" id="tryoutNextBtn" ${TRYOUT_STATE.answered ? '' : 'disabled'}>
        ${nomor >= total ? 'Selesai / Ulangi' : 'Soal Berikutnya'}
      </button>
    </div>
  `;

  root.querySelectorAll('[data-tryout-answer]').forEach(btn => {
    btn.addEventListener('click', () => {
      handleTryoutAnswer(Number(btn.dataset.tryoutAnswer));
    });
  });

  const nextBtn = document.getElementById('tryoutNextBtn');
  const resetBtn = document.getElementById('tryoutResetBtn');

  if (nextBtn) nextBtn.addEventListener('click', nextTryoutQuestion);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      initTryoutQuiz();
      showToast('Soal tryout diacak ulang.', 'info');
    });
  }
}

function handleTryoutAnswer(selectedIndex) {
  if (TRYOUT_STATE.answered) return;

  const q = getCurrentTryoutQuestion();

  TRYOUT_STATE.selected = selectedIndex;
  TRYOUT_STATE.answered = true;

  if (selectedIndex === q.answer) {
    TRYOUT_STATE.score += 10;
    showToast('Benar. Skor naik.', 'ok');
    flashScreen('ok');
    spawnConfetti();
  } else {
    showToast('Belum tepat. Baca pembahasan.', 'bad');
    flashScreen('bad');
  }

  renderTryoutQuiz();
}

function nextTryoutQuestion() {
  if (TRYOUT_STATE.current >= TRYOUT_QUESTIONS.length - 1) {
    initTryoutQuiz();
    showToast('Tryout selesai. Soal diulang dan diacak lagi.', 'info');
    return;
  }

  TRYOUT_STATE.current += 1;
  TRYOUT_STATE.answered = false;
  TRYOUT_STATE.selected = null;

  renderTryoutQuiz();
}

/* =========================================================
   SCROLL FX
========================================================= */

function initScrollLuxuryAnimation() {
  if (typeof scrollLuxuryDestroy === 'function') {
    scrollLuxuryDestroy();
    scrollLuxuryDestroy = null;
  }

  const progress = document.getElementById('luxScrollProgress');
  const hero = document.querySelector('.ps-hero');

  const updateProgress = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    if (progress) {
      progress.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    }

    if (hero) {
      const move = Math.min(80, scrollTop * 0.12);
      hero.style.setProperty('--hero-parallax', `${move}px`);
    }
  };

  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });

  const revealItems = document.querySelectorAll('.lux-reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.16,
    rootMargin: '0px 0px -40px 0px'
  });

  revealItems.forEach((item, index) => {
    item.style.setProperty('--lux-delay', `${Math.min(index * 70, 420)}ms`);
    observer.observe(item);
  });

  scrollLuxuryDestroy = () => {
    window.removeEventListener('scroll', updateProgress);
    observer.disconnect();
  };
}

/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {
  injectProcurementCss();

  contentArea.innerHTML = `
    <div class="lux-scroll-progress" id="luxScrollProgress"></div>

    <section class="ps-dashboard">
      <section class="ps-hero lux-reveal">
        <div>
          <div class="ps-kicker">TRAXPBJ Academy • Interactive Sertifikasi Mode</div>
          <h3>Procurement Stacker</h3>
          <p>
            Game edukasi pengadaan berbasis studi kasus gaya sertifikasi PBJ.
            Drag kartu aksi ke pipeline yang benar, lalu lanjut ke tryout interaktif.
            Kartu diacak, ada kartu jebakan, dan setiap kesalahan langsung diberi pembahasan.
          </p>
        </div>
      </section>

      <div class="lux-section-label lux-reveal">Interactive Procurement Game</div>

      <div class="lux-reveal" id="procurementStackerRoot"></div>

      ${renderTryoutBankPanel()}

      <section class="ps-card lux-reveal">
        <div class="ps-card-head">
          <div>
            <h3>Akses Cepat TRAXPBJ</h3>
            <p>Setelah latihan, lanjut ke modul monitoring dan simulasi yang tersedia.</p>
          </div>
        </div>

        <div class="ps-quick-grid">
          ${renderQuickCard('📊', 'linear-gradient(135deg,#1d4ed8,#22d3ee)', 'ITKP - SIRUP', 'Monitoring indikator ITKP dari modul SIRUP.', 'monitoring-sirup')}
          ${renderQuickCard('📋', 'linear-gradient(135deg,#123a72,#3b82f6)', 'Monitoring Perencanaan', 'Pantau progres paket perangkat daerah.', 'monitoring-perencanaan')}
          ${renderQuickCard('🧾', 'linear-gradient(135deg,#0f766e,#22c55e)', 'Rapor PBJ', 'Lihat laporan rapor kinerja PBJ.', 'rapor-pbj')}
          ${renderQuickCard('🗓️', 'linear-gradient(135deg,#111827,#2563eb)', 'Simulasi Timeline', 'Simulasikan jadwal pengadaan.', 'simulasi-timeline')}
        </div>
      </section>

      <div class="footer-note lux-reveal">© 2026 TRAXPBJ - Procurement Stacker Sertifikasi Mode</div>
    </section>
  `;

  if (!Array.isArray(STACKER_STATE.placed) || !STACKER_STATE.placed.length) {
    resetStackerLevel(false);
  } else {
    renderStackerGame();
  }

  initTryoutQuiz();

  contentArea.querySelectorAll('[data-quick]').forEach(item => {
    item.addEventListener('click', () => loadPage(item.dataset.quick));
  });

  requestAnimationFrame(() => {
    initScrollLuxuryAnimation();
  });
}

/* =========================================================
   ROUTER PAGE RENDER
========================================================= */

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
  document.querySelectorAll('.nav-link, .submenu-link').forEach(el => {
    el.classList.remove('active');
  });

  const directButton = document.querySelector(`.nav-link[data-page="${key}"]`);
  const subButton = document.querySelector(`.submenu-link[data-page="${key}"]`);

  if (directButton) directButton.classList.add('active');

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

  if (typeof scrollLuxuryDestroy === 'function') {
    scrollLuxuryDestroy();
    scrollLuxuryDestroy = null;
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

  document.querySelectorAll('[data-dynamic-module-css]').forEach(el => el.remove());
  document.querySelectorAll('[data-dynamic-module-js]').forEach(el => el.remove());
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

    await new Promise(resolve => requestAnimationFrame(resolve));

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
  document.querySelectorAll('[data-page]').forEach(button => {
    button.addEventListener('click', () => loadPage(button.dataset.page));
  });

  document.querySelectorAll('[data-toggle-group]').forEach(button => {
    button.addEventListener('click', event => {
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

  document.addEventListener('click', event => {
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
    ${Array.from(submenuLinks).map(link => {
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

  flyout.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeFlyout();
      loadPage(btn.dataset.page);
    });
  });

  activeFlyout = flyout;
}

bindMenu();
loadPage('dashboard');