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

const CARD_LIBRARY_RAW = {
  rup: ['rup', 'Cek RUP', '📋', 'Pastikan paket, pagu, metode, dan jadwal sesuai.'],
  identifikasi: ['identifikasi', 'Identifikasi Kebutuhan', '🧠', 'Pastikan kebutuhan jelas, valid, dan tidak dobel.'],
  konsolidasi: ['konsolidasi', 'Konsolidasi', '🧲', 'Gabungkan kebutuhan sejenis bila tepat.'],
  kak: ['kak', 'KAK / Spesifikasi', '🧩', 'Susun kebutuhan teknis secara jelas dan adil.'],
  reviewSpek: ['review-spek', 'Review Spesifikasi', '🧐', 'Cek apakah spek terlalu mengarah atau tidak relevan.'],
  hps: ['hps', 'HPS / Referensi Harga', '💰', 'Susun harga perkiraan dengan dasar yang wajar.'],
  cekKatalog: ['cek-katalog', 'Cek e-Katalog', '🔎', 'Pastikan barang/jasa tersedia dan sesuai kebutuhan.'],
  cekPdn: ['cek-pdn', 'Cek PDN/TKDN', '🇮🇩', 'Perhatikan produk dalam negeri.'],
  pilihMetode: ['pilih-metode', 'Pilih Metode', '⚙️', 'Tentukan metode berdasarkan jenis, nilai, dan kondisi paket.'],
  metodePl: ['metode-pl', 'Pengadaan Langsung', '🛠️', 'Digunakan bila kondisi dan nilai paket sesuai.'],
  metodeEpurchasing: ['metode-epurchasing', 'e-Purchasing', '🛒', 'Gunakan katalog bila tersedia dan sesuai.'],
  tender: ['tender', 'Tender', '🏗️', 'Untuk paket yang membutuhkan proses pemilihan formal.'],
  seleksi: ['seleksi', 'Seleksi', '📐', 'Umumnya untuk jasa konsultansi.'],
  swakelola: ['swakelola', 'Swakelola', '🤲', 'Dipilih jika pelaksanaan memenuhi kriteria swakelola.'],
  klarifikasi: ['klarifikasi', 'Klarifikasi / Negosiasi', '🤝', 'Pastikan harga, spek, dan kemampuan pelaksanaan.'],
  proses: ['proses', 'Proses Pemilihan', '🚦', 'Laksanakan proses sesuai metode.'],
  kontrak: ['kontrak', 'SPK / Kontrak', '📑', 'Ikat hasil proses secara tertulis.'],
  monitoringKontrak: ['monitoring-kontrak', 'Monitoring Kontrak', '📡', 'Pantau waktu, mutu, dan kewajiban penyedia.'],
  teguran: ['teguran', 'Teguran / Evaluasi', '📣', 'Digunakan saat ada keterlambatan atau masalah.'],
  pemeriksaan: ['pemeriksaan', 'Pemeriksaan Hasil', '🔬', 'Cek kesesuaian sebelum diterima.'],
  bast: ['bast', 'BAST', '📦', 'Serah terima setelah barang/jasa sesuai.'],
  pembayaran: ['pembayaran', 'Pembayaran', '💳', 'Pembayaran sesuai dokumen pendukung.'],
  realisasi: ['realisasi', 'Catat Realisasi', '✅', 'Pastikan realisasi tercatat dalam monitoring.'],

  qRup: ['q-rup', 'Soal: Ruang Lingkup PBJ', '❓', 'PBJ dimulai dari identifikasi kebutuhan sampai serah terima hasil pekerjaan.'],
  qPerencanaan: ['q-perencanaan', 'Soal: Perencanaan PBJ', '❓', 'Identifikasi kebutuhan dan anggaran meningkatkan kualitas perencanaan.'],
  qKak: ['q-kak', 'Soal: KAK / Spesifikasi', '❓', 'KAK menjelaskan apa, mengapa, siapa, kapan, di mana, bagaimana, dan biaya.'],
  qSpek: ['q-spek', 'Soal: Spesifikasi Teknis', '❓', 'Spesifikasi teknis memberi informasi kebutuhan kepada pelaku usaha.'],
  qHps: ['q-hps', 'Soal: HPS', '❓', 'HPS tidak digunakan sebagai dasar perhitungan kerugian negara.'],
  qRab: ['q-rab', 'Soal: RAB', '❓', 'RAB disusun dari data, komponen pekerjaan, harga satuan, lalu rincian.'],
  qKatalog: ['q-katalog', 'Soal: Katalog Elektronik', '❓', 'Katalog sektoral dikelola oleh kementerian/lembaga tertentu.'],
  qPdn: ['q-pdn', 'Soal: PDN / TKDN', '❓', 'TKDN/BMP menunjukkan keberpihakan pada produk dalam negeri.'],
  qMetode: ['q-metode', 'Soal: Cara Pengadaan', '❓', 'Metode dipilih berdasarkan jenis, nilai, kondisi, dan karakter paket.'],
  qPelaku: ['q-pelaku', 'Soal: Pelaku PBJ', '❓', 'PPK menetapkan spesifikasi teknis/KAK, HPS, dan rancangan kontrak.'],
  qEtika: ['q-etika', 'Soal: Etika PBJ', '❓', 'Intervensi memenangkan pihak tertentu menciptakan persaingan tidak sehat.'],
  qPrinsip: ['q-prinsip', 'Soal: Prinsip PBJ', '❓', 'Barang tidak sesuai kebutuhan berarti prinsip efektif tidak terpenuhi.'],
  qSanggah: ['q-sanggah', 'Soal: Sanggah Tender', '❓', 'Sanggah pada proses pemilihan dijawab oleh Pokja Pemilihan.'],
  qKontrak: ['q-kontrak', 'Soal: Aspek Hukum Kontrak', '❓', 'Sengketa pelaksanaan kontrak pada dasarnya merupakan hubungan perdata.'],
  qKonsolidasi: ['q-konsolidasi', 'Soal: Konsolidasi', '❓', 'Konsolidasi dapat dilakukan sejak tahap perencanaan oleh KPA/PPK.'],
  qPemaketan: ['q-pemaketan', 'Soal: Pemaketan', '❓', 'Pemaketan mempertimbangkan output, volume, ketersediaan, pelaku usaha, dan anggaran.'],
  qSwakelola: ['q-swakelola', 'Soal: Swakelola', '❓', 'Swakelola dipilih bila pelaksanaan memenuhi kriteria.'],
  qBast: ['q-bast', 'Soal: Pemeriksaan & BAST', '❓', 'BAST dilakukan setelah hasil pekerjaan diperiksa dan sesuai.'],
  qRealisasi: ['q-realisasi', 'Soal: Realisasi', '❓', 'Pencatatan realisasi membuat data monitoring tidak bolong.'],

  kontrakAwal: ['kontrak-awal', 'Kontrak Dulu', '🚨', 'Jebakan: lompat proses.'],
  pecahPaket: ['pecah-paket', 'Pecah Paket', '💣', 'Jebakan: rawan menghindari metode.'],
  spekMengarah: ['spek-mengarah', 'Spek Mengarah', '🚫', 'Jebakan: risiko persaingan tidak sehat.'],
  abaikanKatalog: ['abaikan-katalog', 'Abaikan Katalog', '⚠️', 'Jebakan: tidak cek kanal tersedia.'],
  lewatiRup: ['lewati-rup', 'Lewati RUP', '⛔', 'Jebakan: proses tanpa cek perencanaan.'],
  bastTanpaCek: ['bast-tanpa-cek', 'BAST Tanpa Pemeriksaan', '📦', 'Jebakan: menerima tanpa verifikasi.'],
  bayarDulu: ['bayar-dulu', 'Bayar Dulu', '💸', 'Jebakan: pembayaran sebelum bukti memadai.'],
  tundaDokumen: ['tunda-dokumen', 'Tunda Dokumen', '🧨', 'Jebakan: risiko administrasi meningkat.'],
  metodeAsalCepat: ['metode-asal-cepat', 'Metode Asal Cepat', '🏃', 'Jebakan: cepat belum tentu tepat.'],
  realisasiLupa: ['realisasi-lupa', 'Lupakan Realisasi', '🕳️', 'Jebakan: monitoring bolong.']
};

const CARD_LIBRARY = Object.fromEntries(
  Object.entries(CARD_LIBRARY_RAW).map(([key, item]) => [
    key,
    {
      id: item[0],
      label: item[1],
      icon: item[2],
      note: item[3],
      type: item[0].startsWith('q-') ? 'quiz' : item[0].includes('awal') || item[0].includes('pecah') || item[0].includes('mengarah') || item[0].includes('abaikan') || item[0].includes('lewati') || item[0].includes('tanpa') || item[0].includes('bayar') || item[0].includes('tunda') || item[0].includes('asal') || item[0].includes('lupa') ? 'trap' : 'action'
    }
  ])
);

function c(key) {
  return CARD_LIBRARY[key];
}

const LEVEL_DATA = [
  {
    title: 'Level 1 — Dasar Pengadaan',
    caseTitle: 'Belanja ATK Kantor',
    caseDesc: 'Paket sederhana nilai kecil. Bukan cuma urutan dokumen, tapi juga konsep dasar PBJ.',
    concept: 'RUP, KAK, HPS, metode, kontrak, BAST, dan realisasi.',
    budget: 'Rp45.000.000',
    deadline: '60 hari',
    difficulty: 'Pemula',
    ideal: [
      'rup',
      'qRup',
      'kak',
      'qKak',
      'hps',
      'qHps',
      'metodePl',
      'proses',
      'qPrinsip',
      'kontrak',
      'bast',
      'qBast',
      'realisasi',
      'qRealisasi'
    ],
    traps: ['kontrakAwal', 'lewatiRup', 'bayarDulu']
  },

  {
    title: 'Level 2 — Paket Katalog',
    caseTitle: 'Laptop Pelayanan Publik',
    caseDesc: 'Barang tersedia di e-Katalog. User harus paham e-Purchasing dan PDN/TKDN.',
    concept: 'Katalog elektronik, PDN, e-Purchasing, negosiasi, kontrak, BAST.',
    budget: 'Rp350.000.000',
    deadline: '45 hari',
    difficulty: 'Pemula+',
    ideal: [
      'rup',
      'qPerencanaan',
      'kak',
      'hps',
      'cekPdn',
      'qPdn',
      'cekKatalog',
      'qKatalog',
      'metodeEpurchasing',
      'klarifikasi',
      'kontrak',
      'bast',
      'realisasi'
    ],
    traps: ['metodePl', 'tender', 'abaikanKatalog', 'kontrakAwal']
  },

  {
    title: 'Level 3 — Deadline Mepet',
    caseTitle: 'Meubelair Ruang Layanan',
    caseDesc: 'Waktu pendek. Pemain harus memilih jalur realistis dan tidak menunda dokumen.',
    concept: 'Kontrol waktu, kesiapan dokumen, dan pemilihan metode.',
    budget: 'Rp180.000.000',
    deadline: '25 hari',
    difficulty: 'Menengah',
    ideal: [
      'rup',
      'kak',
      'qSpek',
      'hps',
      'cekKatalog',
      'qKatalog',
      'metodeEpurchasing',
      'kontrak',
      'bast',
      'realisasi'
    ],
    traps: ['tender', 'tundaDokumen', 'kontrakAwal']
  },

  {
    title: 'Level 4 — Konsolidasi',
    caseTitle: 'Komputer Beberapa Bidang',
    caseDesc: 'Kebutuhan sejenis tersebar di beberapa bidang. Pemain harus menghindari pecah paket.',
    concept: 'Identifikasi kebutuhan, pemaketan, konsolidasi, dan katalog.',
    budget: 'Rp650.000.000',
    deadline: '70 hari',
    difficulty: 'Menengah',
    ideal: [
      'rup',
      'identifikasi',
      'qPemaketan',
      'konsolidasi',
      'qKonsolidasi',
      'kak',
      'hps',
      'cekKatalog',
      'metodeEpurchasing',
      'kontrak',
      'bast',
      'realisasi'
    ],
    traps: ['pecahPaket', 'metodePl', 'metodeAsalCepat']
  },

  {
    title: 'Level 5 — Spek Mengarah',
    caseTitle: 'Laptop dengan Spek Terlalu Spesifik',
    caseDesc: 'Spesifikasi awal terlalu mengarah. Pemain harus memperbaiki dulu sebelum proses.',
    concept: 'Review spesifikasi dan pencegahan persaingan tidak sehat.',
    budget: 'Rp420.000.000',
    deadline: '50 hari',
    difficulty: 'Menengah',
    ideal: [
      'rup',
      'reviewSpek',
      'qSpek',
      'kak',
      'hps',
      'cekKatalog',
      'metodeEpurchasing',
      'klarifikasi',
      'qEtika',
      'kontrak',
      'bast',
      'realisasi'
    ],
    traps: ['spekMengarah', 'kontrakAwal', 'abaikanKatalog']
  },

  {
    title: 'Level 6 — Jasa Konsultansi',
    caseTitle: 'Kajian Teknis Perencanaan',
    caseDesc: 'Paket jasa konsultansi membutuhkan KAK, HPS, dan metode seleksi yang tepat.',
    concept: 'Jasa konsultansi, KAK, seleksi, dan kontrak.',
    budget: 'Rp280.000.000',
    deadline: '75 hari',
    difficulty: 'Menengah',
    ideal: [
      'rup',
      'identifikasi',
      'kak',
      'qKak',
      'hps',
      'qHps',
      'seleksi',
      'proses',
      'kontrak',
      'qKontrak',
      'monitoringKontrak',
      'bast',
      'realisasi'
    ],
    traps: ['metodeEpurchasing', 'metodePl', 'kontrakAwal']
  },

  {
    title: 'Level 7 — Konstruksi Ringan',
    caseTitle: 'Rehabilitasi Ruang Pelayanan',
    caseDesc: 'Pekerjaan konstruksi membutuhkan dokumen teknis, pemilihan, kontrak, dan pemeriksaan.',
    concept: 'Konstruksi, tender, pemeriksaan hasil, BAST, dan realisasi.',
    budget: 'Rp760.000.000',
    deadline: '100 hari',
    difficulty: 'Sulit',
    ideal: [
      'rup',
      'identifikasi',
      'kak',
      'hps',
      'tender',
      'qSanggah',
      'proses',
      'kontrak',
      'monitoringKontrak',
      'pemeriksaan',
      'qBast',
      'bast',
      'realisasi'
    ],
    traps: ['metodePl', 'kontrakAwal', 'bastTanpaCek', 'bayarDulu']
  },

  {
    title: 'Level 8 — Swakelola',
    caseTitle: 'Kegiatan Pelatihan Internal',
    caseDesc: 'Kegiatan lebih tepat dikelola swakelola. Pemain harus memilih cara pengadaan yang sesuai.',
    concept: 'Swakelola, KAK, HPS, pelaksanaan, BAST, dan realisasi.',
    budget: 'Rp95.000.000',
    deadline: '40 hari',
    difficulty: 'Menengah',
    ideal: [
      'rup',
      'identifikasi',
      'qSwakelola',
      'kak',
      'hps',
      'swakelola',
      'proses',
      'bast',
      'realisasi'
    ],
    traps: ['metodeEpurchasing', 'tender', 'kontrakAwal']
  },

  {
    title: 'Level 9 — Penyedia Terlambat',
    caseTitle: 'Penyedia Terlambat Mengirim Barang',
    caseDesc: 'Proses sudah kontrak, tetapi penyedia terlambat. Jangan langsung BAST atau bayar.',
    concept: 'Monitoring kontrak, teguran, pemeriksaan, BAST, pembayaran, realisasi.',
    budget: 'Rp190.000.000',
    deadline: 'Sisa 10 hari',
    difficulty: 'Sulit',
    ideal: [
      'kontrak',
      'monitoringKontrak',
      'qKontrak',
      'teguran',
      'pemeriksaan',
      'qBast',
      'bast',
      'pembayaran',
      'realisasi'
    ],
    traps: ['bastTanpaCek', 'bayarDulu', 'realisasiLupa']
  },

  {
    title: 'Level 10 — Final Boss',
    caseTitle: 'Alat Kesehatan Bernilai Besar',
    caseDesc: 'Kasus campuran: spesifikasi, PDN, katalog, metode, kontrak, pemeriksaan, dan realisasi.',
    concept: 'Studi kasus komprehensif PBJ.',
    budget: 'Rp1.200.000.000',
    deadline: '90 hari',
    difficulty: 'Boss',
    ideal: [
      'rup',
      'qRup',
      'identifikasi',
      'reviewSpek',
      'qSpek',
      'kak',
      'hps',
      'qHps',
      'cekPdn',
      'qPdn',
      'cekKatalog',
      'qKatalog',
      'pilihMetode',
      'qMetode',
      'klarifikasi',
      'kontrak',
      'monitoringKontrak',
      'pemeriksaan',
      'bast',
      'pembayaran',
      'realisasi',
      'qRealisasi'
    ],
    traps: ['spekMengarah', 'pecahPaket', 'kontrakAwal', 'bastTanpaCek', 'bayarDulu']
  }
];

function makeLevel(config) {
  const idealCards = config.ideal.map(key => c(key)).filter(Boolean);
  const trapCards = (config.traps || []).map(key => c(key)).filter(Boolean);

  return {
    ...config,
    ideal: idealCards.map(card => card.id),
    cards: [...idealCards, ...trapCards]
  };
}

const STACKER_LEVELS = LEVEL_DATA.map(makeLevel);

const STACKER_STATE = {
  levelIndex: 0,
  placed: [],
  compliance: 0,
  risk: 0,
  progress: 0,
  wrong: 0,
  finished: false,
  shuffledCards: [],
  selectedCardId: null,
  logs: []
};

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

function getLevel() {
  return STACKER_LEVELS[STACKER_STATE.levelIndex] || STACKER_LEVELS[0];
}

function getPlacedCount() {
  return STACKER_STATE.placed.filter(Boolean).length;
}

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
      min-height:340px;
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
      grid-template-columns:minmax(0,1.55fr) minmax(360px,.7fr);
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

    .ps-level-pill.warn{
      background:#fef3c7;
      color:#92400e;
      border-color:#fde68a;
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

    .ps-case-box label,
    .ps-score-card label,
    .ps-concept-box label{
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
      grid-template-columns:repeat(4,minmax(0,1fr));
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

    .ps-score-card strong{
      display:block;
      margin-top:8px;
      color:#102544;
      font-size:25px;
      line-height:1;
      font-weight:950;
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
      min-height:126px;
      border-radius:20px;
      border:2px dashed #c9d8e8;
      background:#f8fbff;
      padding:10px;
      position:relative;
      transition:.18s ease;
      cursor:pointer;
    }

    .ps-slot.drag-over,
    .ps-slot.click-ready{
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
      min-height:96px;
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
      width:152px;
      min-height:104px;
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
      -webkit-user-select:none;
      touch-action:none;
      position:relative;
      overflow:hidden;
    }

    .ps-action-card:hover{
      transform:translateY(-2px);
      box-shadow:0 14px 26px rgba(15,23,42,.10);
    }

    .ps-action-card.selected{
      border-color:#2563eb;
      box-shadow:
        0 0 0 4px rgba(37,99,235,.13),
        0 16px 28px rgba(37,99,235,.14);
      transform:translateY(-3px);
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

    .ps-action-card.quiz-card{
      background:linear-gradient(180deg,#ffffff 0%,#fefce8 100%);
      border-color:#fde68a;
    }

    .ps-action-card.trap-card{
      background:linear-gradient(180deg,#ffffff 0%,#fff1f2 100%);
      border-color:#fecaca;
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
      min-height:102px;
      cursor:default;
      box-shadow:none;
      touch-action:auto;
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
      max-height:420px;
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

    .ps-quick-grid{
      display:grid;
      grid-template-columns:repeat(4,minmax(0,1fr));
      gap:12px;
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

      .ps-score-grid{
        grid-template-columns:repeat(2,minmax(0,1fr));
      }

      .ps-quick-grid{
        grid-template-columns:repeat(2,minmax(0,1fr));
      }
    }
  `;

  document.head.appendChild(style);
}

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
  if (!target || !target.getBoundingClientRect) return;

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

function pulseSlot(slotIndex) {
  requestAnimationFrame(() => {
    const slot = document.querySelector(`.ps-slot[data-slot-index="${slotIndex}"]`);

    if (!slot) return;

    slot.classList.add('fx-correct');

    setTimeout(() => {
      slot.classList.remove('fx-correct');
    }, 520);
  });
}

function shakeCard(cardId) {
  requestAnimationFrame(() => {
    const cardEl = document.querySelector(`.ps-action-card[data-card-id="${cardId}"]`);

    if (!cardEl) return;

    cardEl.classList.remove('wrong');
    void cardEl.offsetWidth;
    cardEl.classList.add('wrong');

    setTimeout(() => cardEl.classList.remove('wrong'), 360);
  });
}

function resetStackerLevel() {
  const level = getLevel();

  STACKER_STATE.placed = Array(level.ideal.length).fill(null);
  STACKER_STATE.compliance = 0;
  STACKER_STATE.risk = 0;
  STACKER_STATE.progress = 0;
  STACKER_STATE.wrong = 0;
  STACKER_STATE.finished = false;
  STACKER_STATE.shuffledCards = shuffleArray(level.cards);
  STACKER_STATE.selectedCardId = null;
  STACKER_STATE.logs = [];

  addLog({
    type: 'info',
    title: 'Misi dimulai',
    text: `${level.caseTitle}. Susun kartu aksi dan kartu soal dalam urutan pipeline yang benar.`
  });

  renderStackerGame();
}

function nextStackerLevel() {
  if (STACKER_STATE.levelIndex < STACKER_LEVELS.length - 1) {
    STACKER_STATE.levelIndex += 1;
  } else {
    STACKER_STATE.levelIndex = 0;
  }

  resetStackerLevel();
}

function addLog(item) {
  STACKER_STATE.logs.unshift(item);
  STACKER_STATE.logs = STACKER_STATE.logs.slice(0, 14);
}

function renderStackerGame() {
  const root = document.getElementById('procurementStackerRoot');

  if (!root) return;

  const level = getLevel();
  const placedIds = new Set(STACKER_STATE.placed.filter(Boolean).map(item => item.id));

  root.innerHTML = `
    <section class="ps-game-grid">
      <div class="ps-card">
        <div class="ps-card-head">
          <div>
            <h3>${escapeHtml(level.title)}</h3>
            <p>${escapeHtml(level.caseDesc)}</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
            <div class="ps-mode-pill">Pipeline Cards</div>
            <div class="ps-level-pill">${STACKER_STATE.levelIndex + 1} / ${STACKER_LEVELS.length}</div>
            ${STACKER_STATE.selectedCardId ? '<div class="ps-level-pill warn">Kartu dipilih</div>' : ''}
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
          <div class="ps-score-card">
            <label>Progress</label>
            <strong>${STACKER_STATE.progress}%</strong>
          </div>
          <div class="ps-score-card">
            <label>Kepatuhan</label>
            <strong>${STACKER_STATE.compliance}</strong>
          </div>
          <div class="ps-score-card">
            <label>Risiko</label>
            <strong>${STACKER_STATE.risk}</strong>
          </div>
          <div class="ps-score-card">
            <label>Salah</label>
            <strong>${STACKER_STATE.wrong}</strong>
          </div>
        </div>

        <div class="ps-progress-track">
          <div class="ps-progress-bar" style="width:${STACKER_STATE.progress}%"></div>
        </div>

        <div class="ps-pipeline" id="psPipeline">
          ${level.ideal.map((stepId, index) => renderSlot(index)).join('')}
        </div>

        <div class="ps-card-head">
          <div>
            <h3>Kartu Acak</h3>
            <p>
              Ada kartu aksi, kartu soal, dan kartu jebakan. Susun semuanya dalam urutan pipeline yang benar.
              Bisa drag-drop atau klik kartu lalu klik slot biru.
            </p>
          </div>
          <button type="button" class="ps-btn ps-btn-soft" id="psShuffleBtn">
            Acak Ulang Kartu
          </button>
        </div>

        <div class="ps-bank" id="psCardBank">
          ${STACKER_STATE.shuffledCards.map(card => renderCard(card, placedIds.has(card.id))).join('')}
        </div>

        <div class="ps-finish ${STACKER_STATE.finished ? 'show' : ''}">
          ${renderFinish()}
        </div>
      </div>

      <aside class="ps-side lux-sticky-side">
        <div class="ps-card">
          <div class="ps-card-head">
            <div>
              <h3>Petunjuk Level</h3>
              <p>Soal sekarang bukan panel terpisah. Soal adalah kartu yang ikut disusun di pipeline.</p>
            </div>
          </div>

          <div class="ps-concept-box">
            <label>Konsep yang dilatih</label>
            <strong>${escapeHtml(level.concept)}</strong>
          </div>

          <div class="ps-concept-box">
            <label>Mode Main</label>
            <strong>
              1. Pilih kartu aksi atau soal.<br>
              2. Letakkan ke slot pipeline berikutnya.<br>
              3. Kartu soal harus berada pada titik konsep yang tepat.<br>
              4. Kartu jebakan akan menaikkan risiko.
            </strong>
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
              <p>Setiap kartu yang benar/salah akan dijelaskan di sini.</p>
            </div>
          </div>

          <div class="ps-log" id="psLog">
            ${renderLogs()}
          </div>
        </div>
      </aside>
    </section>
  `;

  bindStackerEvents();
}

function renderSlot(index) {
  const placed = STACKER_STATE.placed[index];
  const nextEmptyIndex = STACKER_STATE.placed.findIndex(item => item === null);
  const isClickReady = STACKER_STATE.selectedCardId && !placed && index === nextEmptyIndex;

  if (placed) {
    return `
      <div class="ps-slot correct" data-slot-index="${index}">
        <div class="ps-slot-number">${index + 1}</div>
        ${renderCard(placed, false, true)}
      </div>
    `;
  }

  return `
    <div class="ps-slot ${isClickReady ? 'click-ready' : ''}" data-slot-index="${index}">
      <div class="ps-slot-number">${index + 1}</div>
      <div class="ps-slot-placeholder">
        ${isClickReady ? 'Klik untuk pasang kartu' : `Slot pipeline ${index + 1}`}
      </div>
    </div>
  `;
}

function renderCard(card, used = false, locked = false) {
  const selected = STACKER_STATE.selectedCardId === card.id ? 'selected' : '';
  const quizClass = card.type === 'quiz' ? 'quiz-card' : '';
  const trapClass = card.type === 'trap' ? 'trap-card' : '';

  return `
    <div
      class="ps-action-card ${used ? 'used' : ''} ${locked ? 'correct-card' : ''} ${selected} ${quizClass} ${trapClass}"
      draggable="${used || locked ? 'false' : 'true'}"
      data-card-id="${escapeHtml(card.id)}"
    >
      <div class="ps-card-icon">${card.icon}</div>
      <strong>${escapeHtml(card.label)}</strong>
      <span>${escapeHtml(card.note)}</span>
    </div>
  `;
}

function renderLogs() {
  if (!STACKER_STATE.logs.length) {
    return `
      <div class="ps-log-item">
        <div class="ps-log-icon info">i</div>
        <div>
          <div class="ps-log-title">Mulai susun kartu</div>
          <div class="ps-log-sub">Drag kartu aksi dan kartu soal ke pipeline dari kiri ke kanan.</div>
        </div>
      </div>
    `;
  }

  return STACKER_STATE.logs.map(item => `
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

function renderFinish() {
  if (!STACKER_STATE.finished) return '';

  const stars = getStars();
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

function getStars() {
  if (STACKER_STATE.risk <= 10 && STACKER_STATE.wrong === 0) return 3;
  if (STACKER_STATE.risk <= 35 && STACKER_STATE.wrong <= 2) return 2;
  return 1;
}

function bindStackerEvents() {
  document.querySelectorAll('.ps-action-card[draggable="true"]').forEach(card => {
    card.addEventListener('dragstart', event => {
      event.dataTransfer.setData('text/plain', card.dataset.cardId);
      event.dataTransfer.effectAllowed = 'move';
      card.classList.add('selected');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('selected');
    });

    card.addEventListener('click', () => {
      selectCard(card.dataset.cardId);
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

      placeCard(cardId, slotIndex, slot);
    });

    slot.addEventListener('click', () => {
      if (!STACKER_STATE.selectedCardId) return;

      const slotIndex = Number(slot.dataset.slotIndex);
      placeCard(STACKER_STATE.selectedCardId, slotIndex, slot);
    });
  });

  const resetBtn = document.getElementById('psResetBtn');
  const nextBtn = document.getElementById('psNextBtn');
  const shuffleBtn = document.getElementById('psShuffleBtn');

  if (resetBtn) resetBtn.addEventListener('click', resetStackerLevel);
  if (nextBtn) nextBtn.addEventListener('click', nextStackerLevel);

  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      STACKER_STATE.shuffledCards = shuffleArray(getLevel().cards);
      STACKER_STATE.selectedCardId = null;
      renderStackerGame();
      showToast('Kartu diacak ulang.', 'info');
    });
  }
}

function selectCard(cardId) {
  if (STACKER_STATE.finished) return;

  STACKER_STATE.selectedCardId = STACKER_STATE.selectedCardId === cardId ? null : cardId;

  if (STACKER_STATE.selectedCardId) {
    const card = getLevel().cards.find(item => item.id === cardId);
    showToast(`Kartu dipilih: ${card ? card.label : cardId}. Klik slot biru.`, 'info');
  }

  renderStackerGame();
}

function placeCard(cardId, slotIndex, slotEl) {
  if (STACKER_STATE.finished) return;

  const level = getLevel();
  const expectedId = level.ideal[slotIndex];
  const card = level.cards.find(item => item.id === cardId);

  if (!card) return;

  const alreadyPlaced = STACKER_STATE.placed.some(item => item && item.id === cardId);
  if (alreadyPlaced) return;

  const nextEmptyIndex = STACKER_STATE.placed.findIndex(item => item === null);

  if (slotIndex !== nextEmptyIndex) {
    wrongMove(cardId, `Isi pipeline dari kiri ke kanan. Slot berikutnya adalah nomor ${nextEmptyIndex + 1}.`);
    return;
  }

  if (cardId !== expectedId) {
    wrongMove(cardId, getWrongMessage(cardId, expectedId));
    return;
  }

  STACKER_STATE.placed[slotIndex] = card;
  STACKER_STATE.selectedCardId = null;
  STACKER_STATE.progress = Math.round((getPlacedCount() / level.ideal.length) * 100);

  if (card.type === 'quiz') {
    STACKER_STATE.compliance += 12;
  } else {
    STACKER_STATE.compliance += 10;
  }

  addLog({
    type: 'ok',
    title: `${card.label} benar`,
    text: getCorrectMessage(card)
  });

  showToast(`Benar: ${card.label}`, 'ok');
  flashScreen('ok');
  popScore(slotEl || document.body, card.type === 'quiz' ? '+12 Konsep' : '+10 Step', 'ok');

  const completed = getPlacedCount() === level.ideal.length;

  if (completed) {
    STACKER_STATE.finished = true;
    STACKER_STATE.compliance += 10;

    addLog({
      type: 'ok',
      title: 'Pipeline selesai',
      text: 'Semua kartu aksi dan kartu soal sudah tersusun benar. Lanjutkan ke level berikutnya.'
    });

    showToast('Mission Complete. Pipeline selesai.', 'ok');
    spawnConfetti();
  }

  renderStackerGame();
  pulseSlot(slotIndex);
}

function wrongMove(cardId, message) {
  STACKER_STATE.risk += 10;
  STACKER_STATE.compliance = Math.max(0, STACKER_STATE.compliance - 5);
  STACKER_STATE.wrong += 1;
  STACKER_STATE.selectedCardId = null;

  addLog({
    type: 'bad',
    title: 'Urutan belum tepat',
    text: message
  });

  showToast('Belum tepat. Risiko naik.', 'bad');
  flashScreen('bad');

  renderStackerGame();
  shakeCard(cardId);
}

function getCorrectMessage(card) {
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
    realisasi: 'Pencatatan realisasi memastikan data monitoring tidak bolong.',
    'q-rup': 'Soal RUP tepat ditempatkan setelah konsep RUP agar user paham ruang lingkup PBJ.',
    'q-perencanaan': 'Soal perencanaan tepat ditempatkan pada bagian awal sebelum persiapan teknis.',
    'q-kak': 'Soal KAK tepat ditempatkan setelah KAK/spesifikasi.',
    'q-spek': 'Soal spesifikasi tepat untuk menguji apakah spek sudah berbasis kebutuhan.',
    'q-hps': 'Soal HPS tepat ditempatkan setelah penyusunan HPS/referensi harga.',
    'q-rab': 'Soal RAB tepat setelah konsep biaya dan harga satuan.',
    'q-katalog': 'Soal katalog tepat setelah cek e-Katalog.',
    'q-pdn': 'Soal PDN tepat setelah cek PDN/TKDN.',
    'q-metode': 'Soal metode tepat saat pemain akan memilih cara/metode pengadaan.',
    'q-pelaku': 'Soal pelaku PBJ tepat untuk menguji kewenangan PA/KPA/PPK/Pokja/PP.',
    'q-etika': 'Soal etika tepat saat ada risiko intervensi atau persaingan tidak sehat.',
    'q-prinsip': 'Soal prinsip PBJ tepat setelah proses pemilihan untuk menguji efektif, efisien, adil, transparan.',
    'q-sanggah': 'Soal sanggah tepat pada area tender/proses pemilihan.',
    'q-kontrak': 'Soal kontrak tepat pada area pelaksanaan kontrak.',
    'q-konsolidasi': 'Soal konsolidasi tepat setelah pemain melakukan konsolidasi.',
    'q-pemaketan': 'Soal pemaketan tepat setelah identifikasi kebutuhan.',
    'q-swakelola': 'Soal swakelola tepat saat memilih cara pengadaan swakelola.',
    'q-bast': 'Soal BAST tepat sebelum/sekitar pemeriksaan dan serah terima.',
    'q-realisasi': 'Soal realisasi tepat di akhir pipeline agar monitoring tidak bolong.'
  };

  return messages[card.id] || card.note || 'Kartu ini tepat pada posisi pipeline saat ini.';
}

function getWrongMessage(cardId, expectedId) {
  const level = getLevel();
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

  return trapMessages[cardId] || `Belum tepat. Kamu memilih "${cardLabel}", padahal posisi ini seharusnya "${expectedLabel}". Konsep level: ${level.concept}`;
}

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

function renderDashboard() {
  injectProcurementCss();

  contentArea.innerHTML = `
    <div class="lux-scroll-progress" id="luxScrollProgress"></div>

    <section class="ps-dashboard">
      <section class="ps-hero lux-reveal">
        <div>
          <div class="ps-kicker">TRAXPBJ Academy • Pipeline Cards Mode</div>
          <h3>Procurement Stacker</h3>
          <p>
            Game edukasi pengadaan berbasis studi kasus. Sekarang soal tidak dipisah lagi.
            Kartu soal ikut masuk ke pipeline, sehingga pemain harus paham urutan proses sekaligus konsep PBJ.
          </p>
        </div>
      </section>

      <div class="lux-section-label lux-reveal">Interactive Procurement Pipeline</div>

      <div class="lux-reveal" id="procurementStackerRoot"></div>

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

      <div class="footer-note lux-reveal">© 2026 TRAXPBJ - Procurement Stacker Pipeline Cards Mode</div>
    </section>
  `;

  resetStackerLevel();

  contentArea.querySelectorAll('[data-quick]').forEach(item => {
    item.addEventListener('click', () => loadPage(item.dataset.quick));
  });

  requestAnimationFrame(() => {
    initScrollLuxuryAnimation();
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