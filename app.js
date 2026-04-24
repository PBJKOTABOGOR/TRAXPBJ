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

const STACKER_LEVELS = [
  {
    title: 'Level 1 — Paket Dasar',
    caseTitle: 'Belanja ATK Kantor',
    caseDesc: 'Paket sederhana dengan nilai kecil. Fokus utama: pahami urutan dasar dari RUP sampai realisasi.',
    budget: 'Rp45.000.000',
    deadline: '60 hari',
    difficulty: 'Pemula',
    ideal: [
      'rup',
      'kak',
      'hps',
      'metode-pl',
      'transaksi',
      'kontrak',
      'bast',
      'realisasi'
    ],
    cards: [
      { id: 'rup', label: 'RUP', icon: '📋', note: 'Pastikan paket masuk dan diumumkan.' },
      { id: 'kak', label: 'KAK / Spek', icon: '🧩', note: 'Susun kebutuhan dan spesifikasi.' },
      { id: 'hps', label: 'HPS', icon: '💰', note: 'Susun estimasi harga.' },
      { id: 'metode-pl', label: 'Pengadaan Langsung', icon: '⚙️', note: 'Metode sesuai paket sederhana.' },
      { id: 'transaksi', label: 'Transaksi', icon: '🛒', note: 'Laksanakan proses pengadaan.' },
      { id: 'kontrak', label: 'SPK / Kontrak', icon: '📑', note: 'Ikat hasil proses.' },
      { id: 'bast', label: 'BAST', icon: '📦', note: 'Serah terima barang/jasa.' },
      { id: 'realisasi', label: 'Realisasi', icon: '✅', note: 'Catat realisasi paket.' },
      { id: 'kontrak-awal', label: 'Kontrak Dulu', icon: '🚨', note: 'Jebakan: terlalu cepat kontrak.' }
    ],
    hints: {
      rup: 'Benar. RUP adalah titik awal sebelum paket diproses.',
      kak: 'Benar. Spesifikasi/KAK perlu jelas sebelum menyusun HPS.',
      hps: 'Benar. HPS disiapkan setelah kebutuhan dan spesifikasi jelas.',
      'metode-pl': 'Benar. Nilai kecil dan sederhana cocok diarahkan ke Pengadaan Langsung.',
      transaksi: 'Benar. Proses transaksi dilakukan setelah metode ditetapkan.',
      kontrak: 'Benar. SPK/Kontrak mengikuti hasil proses.',
      bast: 'Benar. BAST dilakukan setelah barang/jasa diterima.',
      realisasi: 'Benar. Paket selesai harus dicatat realisasinya.'
    }
  },

  {
    title: 'Level 2 — Paket Katalog',
    caseTitle: 'Pengadaan Laptop Pelayanan Publik',
    caseDesc: 'Paket barang bernilai menengah, tersedia di e-Katalog, dan dibutuhkan cukup cepat.',
    budget: 'Rp350.000.000',
    deadline: '45 hari',
    difficulty: 'Menengah',
    ideal: [
      'rup',
      'kak',
      'hps',
      'cek-katalog',
      'metode-epurchasing',
      'negosiasi',
      'kontrak',
      'bast',
      'realisasi'
    ],
    cards: [
      { id: 'rup', label: 'RUP', icon: '📋', note: 'Cek paket dan jadwal.' },
      { id: 'kak', label: 'KAK / Spek', icon: '🧩', note: 'Pastikan spek tidak mengarah.' },
      { id: 'hps', label: 'Referensi Harga / HPS', icon: '💰', note: 'Bandingkan harga wajar.' },
      { id: 'cek-katalog', label: 'Cek e-Katalog', icon: '🔎', note: 'Pastikan produk tersedia.' },
      { id: 'metode-epurchasing', label: 'e-Purchasing', icon: '🛒', note: 'Gunakan katalog.' },
      { id: 'negosiasi', label: 'Negosiasi / Klarifikasi', icon: '🤝', note: 'Pastikan harga dan spesifikasi.' },
      { id: 'kontrak', label: 'SPK / Kontrak', icon: '📑', note: 'Dokumen ikatan.' },
      { id: 'bast', label: 'BAST', icon: '📦', note: 'Serah terima.' },
      { id: 'realisasi', label: 'Realisasi', icon: '✅', note: 'Catat selesai.' },
      { id: 'metode-pl', label: 'Pengadaan Langsung', icon: '⚠️', note: 'Jebakan: nilai paket melewati batas umum.' },
      { id: 'tender', label: 'Tender', icon: '⏳', note: 'Bisa terlalu lama jika katalog tersedia.' }
    ],
    hints: {
      rup: 'Benar. Cek RUP dulu sebelum memilih jalur proses.',
      kak: 'Benar. Spek harus jelas sebelum mencari produk katalog.',
      hps: 'Benar. Referensi harga tetap penting walaupun melalui katalog.',
      'cek-katalog': 'Benar. Karena barang tersedia di katalog, cek katalog menjadi langkah penting.',
      'metode-epurchasing': 'Benar. e-Purchasing menjadi pilihan efisien jika barang tersedia dan sesuai.',
      negosiasi: 'Benar. Klarifikasi/negosiasi membantu memastikan harga dan spesifikasi.',
      kontrak: 'Benar. SPK/Kontrak dibuat setelah proses e-Purchasing.',
      bast: 'Benar. BAST setelah barang diterima dan sesuai.',
      realisasi: 'Benar. Realisasi wajib dicatat setelah selesai.'
    }
  },

  {
    title: 'Level 3 — Deadline Mepet',
    caseTitle: 'Meubelair Ruang Layanan',
    caseDesc: 'Paket harus selesai cepat. Salah urutan akan membuat risiko keterlambatan naik.',
    budget: 'Rp180.000.000',
    deadline: '25 hari',
    difficulty: 'Menengah',
    ideal: [
      'rup',
      'kak',
      'hps',
      'cek-katalog',
      'metode-epurchasing',
      'kontrak',
      'bast',
      'realisasi'
    ],
    cards: [
      { id: 'rup', label: 'RUP', icon: '📋', note: 'Cek dulu status paket.' },
      { id: 'kak', label: 'KAK / Spek', icon: '🧩', note: 'Perjelas kebutuhan.' },
      { id: 'hps', label: 'Referensi Harga / HPS', icon: '💰', note: 'Harga pembanding.' },
      { id: 'cek-katalog', label: 'Cek e-Katalog', icon: '🔎', note: 'Cari jalur cepat.' },
      { id: 'metode-epurchasing', label: 'e-Purchasing', icon: '🛒', note: 'Lebih cepat jika barang tersedia.' },
      { id: 'kontrak', label: 'SPK / Kontrak', icon: '📑', note: 'Ikat transaksi.' },
      { id: 'bast', label: 'BAST', icon: '📦', note: 'Terima barang.' },
      { id: 'realisasi', label: 'Realisasi', icon: '✅', note: 'Catat realisasi.' },
      { id: 'tender', label: 'Tender', icon: '⏳', note: 'Jebakan: terlalu lama untuk deadline mepet.' },
      { id: 'tunda-dokumen', label: 'Tunda Dokumen', icon: '🧨', note: 'Jebakan: risiko makin tinggi.' }
    ],
    hints: {
      rup: 'Benar. Walau mepet, RUP tetap harus dicek.',
      kak: 'Benar. Dokumen kebutuhan harus cepat dirapikan.',
      hps: 'Benar. Harga pembanding tetap dibutuhkan.',
      'cek-katalog': 'Benar. Untuk waktu mepet, katalog perlu dicek lebih awal.',
      'metode-epurchasing': 'Benar. Jika tersedia, e-Purchasing membantu mengejar waktu.',
      kontrak: 'Benar. Kontrak dibuat setelah jalur proses jelas.',
      bast: 'Benar. Serah terima setelah barang sesuai.',
      realisasi: 'Benar. Jangan lupa catat realisasi.'
    }
  },

  {
    title: 'Level 4 — Jebakan Pecah Paket',
    caseTitle: 'Pengadaan Komputer Beberapa Bidang',
    caseDesc: 'Total kebutuhan besar. Ada kartu jebakan yang terlihat cepat tapi menurunkan kepatuhan.',
    budget: 'Rp650.000.000',
    deadline: '70 hari',
    difficulty: 'Sulit',
    ideal: [
      'rup',
      'identifikasi-kebutuhan',
      'konsolidasi',
      'kak',
      'hps',
      'cek-katalog',
      'metode-epurchasing',
      'kontrak',
      'bast',
      'realisasi'
    ],
    cards: [
      { id: 'rup', label: 'RUP', icon: '📋', note: 'Cek rencana paket.' },
      { id: 'identifikasi-kebutuhan', label: 'Identifikasi Kebutuhan', icon: '🧠', note: 'Kelompokkan kebutuhan sejenis.' },
      { id: 'konsolidasi', label: 'Konsolidasi', icon: '🧲', note: 'Gabungkan paket sejenis jika tepat.' },
      { id: 'kak', label: 'KAK / Spek', icon: '🧩', note: 'Susun spesifikasi.' },
      { id: 'hps', label: 'Referensi Harga / HPS', icon: '💰', note: 'Hitung harga wajar.' },
      { id: 'cek-katalog', label: 'Cek e-Katalog', icon: '🔎', note: 'Cek produk tersedia.' },
      { id: 'metode-epurchasing', label: 'e-Purchasing', icon: '🛒', note: 'Jika sesuai katalog.' },
      { id: 'kontrak', label: 'SPK / Kontrak', icon: '📑', note: 'Ikat hasil proses.' },
      { id: 'bast', label: 'BAST', icon: '📦', note: 'Serah terima.' },
      { id: 'realisasi', label: 'Realisasi', icon: '✅', note: 'Catat selesai.' },
      { id: 'pecah-paket', label: 'Pecah Paket', icon: '💣', note: 'Jebakan: rawan salah strategi.' },
      { id: 'metode-pl', label: 'Pengadaan Langsung', icon: '⚠️', note: 'Jebakan jika hanya untuk mengejar batas nilai.' }
    ],
    hints: {
      rup: 'Benar. Mulai dari RUP untuk membaca paket dan jadwal.',
      'identifikasi-kebutuhan': 'Benar. Kebutuhan sejenis harus diidentifikasi dulu.',
      konsolidasi: 'Benar. Paket sejenis dapat dipertimbangkan untuk konsolidasi.',
      kak: 'Benar. Setelah kebutuhan jelas, susun KAK/spek.',
      hps: 'Benar. HPS disusun berdasarkan kebutuhan yang sudah jelas.',
      'cek-katalog': 'Benar. Katalog perlu dicek untuk barang sejenis.',
      'metode-epurchasing': 'Benar. e-Purchasing dapat dipilih jika katalog sesuai.',
      kontrak: 'Benar. Kontrak setelah proses benar.',
      bast: 'Benar. BAST setelah barang diterima.',
      realisasi: 'Benar. Catat realisasi agar monitoring tidak bolong.'
    }
  },

  {
    title: 'Final Level — PPK Master Challenge',
    caseTitle: 'Alat Kesehatan Bernilai Besar',
    caseDesc: 'Paket kompleks: nilai besar, risiko teknis, katalog perlu dicek, dokumen harus kuat.',
    budget: 'Rp1.200.000.000',
    deadline: '90 hari',
    difficulty: 'Boss Level',
    ideal: [
      'rup',
      'identifikasi-kebutuhan',
      'kak',
      'hps',
      'cek-pdn',
      'cek-katalog',
      'pilih-metode',
      'klarifikasi-teknis',
      'kontrak',
      'bast',
      'realisasi'
    ],
    cards: [
      { id: 'rup', label: 'RUP', icon: '📋', note: 'Cek rencana dan jadwal.' },
      { id: 'identifikasi-kebutuhan', label: 'Identifikasi Kebutuhan', icon: '🧠', note: 'Pastikan kebutuhan valid.' },
      { id: 'kak', label: 'KAK / Spek', icon: '🧩', note: 'Spesifikasi teknis harus kuat.' },
      { id: 'hps', label: 'HPS', icon: '💰', note: 'Harga harus punya dasar.' },
      { id: 'cek-pdn', label: 'Cek PDN/TKDN', icon: '🇮🇩', note: 'Perhatikan produk dalam negeri.' },
      { id: 'cek-katalog', label: 'Cek e-Katalog', icon: '🔎', note: 'Cari ketersediaan katalog.' },
      { id: 'pilih-metode', label: 'Pilih Metode', icon: '⚙️', note: 'Tentukan jalur sesuai kondisi.' },
      { id: 'klarifikasi-teknis', label: 'Klarifikasi Teknis', icon: '🧪', note: 'Validasi spesifikasi dan dukungan.' },
      { id: 'kontrak', label: 'SPK / Kontrak', icon: '📑', note: 'Ikat hasil proses.' },
      { id: 'bast', label: 'BAST', icon: '📦', note: 'Cek barang sebelum diterima.' },
      { id: 'realisasi', label: 'Realisasi', icon: '✅', note: 'Catat realisasi.' },
      { id: 'spek-mengarah', label: 'Spek Mengarah', icon: '🚫', note: 'Jebakan: risiko tinggi.' },
      { id: 'kontrak-awal', label: 'Kontrak Dulu', icon: '🚨', note: 'Jebakan: lompat proses.' }
    ],
    hints: {
      rup: 'Benar. Paket kompleks tetap dimulai dari membaca RUP.',
      'identifikasi-kebutuhan': 'Benar. Kebutuhan harus valid sebelum dokumen teknis dibuat.',
      kak: 'Benar. KAK/spek menjadi kunci untuk paket teknis.',
      hps: 'Benar. HPS harus kuat untuk paket bernilai besar.',
      'cek-pdn': 'Benar. PDN/TKDN perlu diperhatikan.',
      'cek-katalog': 'Benar. Cek katalog sebelum menentukan metode final.',
      'pilih-metode': 'Benar. Metode dipilih setelah kebutuhan, harga, PDN, dan katalog dicek.',
      'klarifikasi-teknis': 'Benar. Klarifikasi teknis mengurangi risiko barang tidak sesuai.',
      kontrak: 'Benar. Kontrak dibuat setelah proses dan klarifikasi aman.',
      bast: 'Benar. BAST tidak boleh asal tanda tangan.',
      realisasi: 'Benar. Realisasi adalah tahap akhir yang wajib dicatat.'
    }
  }
];

const STACKER_STATE = {
  levelIndex: 0,
  placed: [],
  compliance: 0,
  risk: 0,
  progress: 0,
  wrong: 0,
  finished: false
};

function injectProcurementStackerCss() {
  if (document.getElementById('procurement-stacker-css')) return;

  const style = document.createElement('style');
  style.id = 'procurement-stacker-css';
  style.textContent = `
    .ps-dashboard{
      display:flex;
      flex-direction:column;
      gap:16px;
    }

    .ps-hero{
      position:relative;
      overflow:hidden;
      border-radius:32px;
      padding:34px;
      color:#fff;
      background:
        radial-gradient(circle at top right, rgba(34,211,238,.24), transparent 30%),
        radial-gradient(circle at 15% 10%, rgba(255,255,255,.10), transparent 24%),
        linear-gradient(135deg,#102544 0%,#123a72 48%,#245a9b 78%,#0f766e 100%);
      box-shadow:0 24px 60px rgba(18,58,114,.20);
    }

    .ps-kicker{
      display:inline-flex;
      align-items:center;
      min-height:30px;
      padding:0 12px;
      border-radius:999px;
      background:rgba(255,255,255,.12);
      border:1px solid rgba(255,255,255,.18);
      color:#dff7ff;
      font-size:12px;
      font-weight:900;
      letter-spacing:.08em;
      text-transform:uppercase;
    }

    .ps-hero h3{
      margin:16px 0 0;
      font-size:42px;
      line-height:1.05;
      font-weight:950;
      letter-spacing:-.05em;
    }

    .ps-hero p{
      margin:12px 0 0;
      max-width:930px;
      color:rgba(255,255,255,.84);
      font-size:14px;
      line-height:1.75;
    }

    .ps-game-grid{
      display:grid;
      grid-template-columns:minmax(0,1.45fr) minmax(360px,.75fr);
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

    .ps-level-pill{
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
      font-size:24px;
      line-height:1;
      font-weight:950;
    }

    .ps-progress-track{
      height:10px;
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
    }

    .ps-pipeline{
      display:grid;
      grid-template-columns:repeat(6,minmax(0,1fr));
      gap:10px;
      margin-bottom:16px;
    }

    .ps-slot{
      min-height:116px;
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
    }

    .ps-slot.correct{
      border-style:solid;
      border-color:#86efac;
      background:#ecfdf5;
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
      min-height:96px;
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
    }

    .ps-action-card:active{
      cursor:grabbing;
    }

    .ps-action-card:hover{
      transform:translateY(-2px);
      box-shadow:0 14px 26px rgba(15,23,42,.10);
    }

    .ps-action-card.used{
      opacity:.36;
      pointer-events:none;
      transform:scale(.98);
    }

    .ps-action-card.wrong{
      animation:psShake .28s ease;
      border-color:#fecaca;
      background:#fff1f2;
    }

    .ps-action-card.correct-card{
      background:#dcfce7;
      border-color:#86efac;
    }

    @keyframes psShake{
      0%{transform:translateX(0)}
      25%{transform:translateX(-6px)}
      50%{transform:translateX(6px)}
      75%{transform:translateX(-4px)}
      100%{transform:translateX(0)}
    }

    .ps-card-icon{
      width:34px;
      height:34px;
      display:flex;
      align-items:center;
      justify-content:center;
      border-radius:12px;
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
      min-height:92px;
      cursor:default;
      box-shadow:none;
    }

    .ps-side{
      display:flex;
      flex-direction:column;
      gap:16px;
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

    .ps-log{
      display:flex;
      flex-direction:column;
      gap:9px;
      max-height:390px;
      overflow:auto;
      padding-right:4px;
    }

    .ps-log::-webkit-scrollbar{
      width:6px;
    }

    .ps-log::-webkit-scrollbar-thumb{
      border-radius:999px;
      background:#cbd5e1;
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

    .ps-log-icon.ok{
      background:#16a34a;
    }

    .ps-log-icon.bad{
      background:#dc2626;
    }

    .ps-log-icon.info{
      background:#2563eb;
    }

    .ps-finish{
      display:none;
      border-radius:22px;
      padding:16px;
      background:
        radial-gradient(circle at top right, rgba(34,211,238,.20), transparent 32%),
        linear-gradient(135deg,#102544,#123a72);
      color:#fff;
      margin-top:16px;
    }

    .ps-finish.show{
      display:block;
    }

    .ps-finish h3{
      margin:0;
      color:#fff;
      font-size:22px;
      font-weight:950;
    }

    .ps-stars{
      margin-top:10px;
      font-size:26px;
      letter-spacing:3px;
    }

    .ps-finish p{
      color:rgba(255,255,255,.78);
    }

    .ps-quick-grid{
      display:grid;
      grid-template-columns:repeat(4,minmax(0,1fr));
      gap:12px;
    }

    .ps-quick-grid .quick-card{
      background:rgba(255,255,255,.88);
      border:1px solid rgba(255,255,255,.72);
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

function injectScrollLuxuryCss() {
  if (document.getElementById('scroll-luxury-css')) return;

  const style = document.createElement('style');
  style.id = 'scroll-luxury-css';
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

    .lux-dashboard{
      position:relative;
      isolation:isolate;
    }

    .lux-dashboard::before{
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
      from{
        transform:translate3d(0,0,0) scale(1);
        opacity:.85;
      }
      to{
        transform:translate3d(0,-16px,0) scale(1.04);
        opacity:1;
      }
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

    .lux-hero{
      min-height:360px;
      display:flex;
      align-items:center;
      position:relative;
      overflow:hidden;
    }

    .lux-hero::after{
      content:"";
      position:absolute;
      width:420px;
      height:420px;
      right:-120px;
      top:-140px;
      border-radius:999px;
      background:radial-gradient(circle, rgba(34,211,238,.26), transparent 65%);
      filter:blur(4px);
      transform:translateY(var(--hero-parallax,0px));
    }

    .lux-hero .ps-kicker,
    .lux-hero h3,
    .lux-hero p{
      position:relative;
      z-index:2;
    }

    .lux-sticky-side{
      position:sticky;
      top:18px;
    }

    .lux-section-label{
      display:flex;
      align-items:center;
      gap:10px;
      margin:4px 0 14px;
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

    .lux-premium-card{
      position:relative;
      overflow:hidden;
    }

    .lux-premium-card::before{
      content:"";
      position:absolute;
      left:0;
      top:0;
      right:0;
      height:1px;
      background:linear-gradient(90deg,transparent,rgba(37,99,235,.45),rgba(34,211,238,.45),transparent);
    }

    .lux-premium-card:hover{
      transform:translateY(-2px);
      box-shadow:0 18px 42px rgba(15,23,42,.11);
      transition:.22s ease;
    }

    .lux-game-stage{
      position:relative;
    }

    .lux-game-stage::before{
      content:"";
      position:absolute;
      inset:-10px;
      border-radius:34px;
      background:
        linear-gradient(135deg, rgba(37,99,235,.12), transparent 32%),
        radial-gradient(circle at 90% 10%, rgba(34,211,238,.16), transparent 30%);
      pointer-events:none;
      z-index:-1;
    }

    .lux-scroll-hint{
      display:inline-flex;
      align-items:center;
      gap:8px;
      margin-top:18px;
      color:rgba(255,255,255,.78);
      font-size:12px;
      font-weight:800;
    }

    .lux-scroll-hint span{
      width:20px;
      height:34px;
      border:2px solid rgba(255,255,255,.36);
      border-radius:999px;
      position:relative;
    }

    .lux-scroll-hint span::after{
      content:"";
      position:absolute;
      left:50%;
      top:7px;
      width:4px;
      height:7px;
      border-radius:999px;
      background:#fff;
      transform:translateX(-50%);
      animation:luxWheel 1.4s ease-in-out infinite;
    }

    @keyframes luxWheel{
      0%{opacity:0; transform:translate(-50%,0)}
      35%{opacity:1}
      100%{opacity:0; transform:translate(-50%,10px)}
    }
  `;

  document.head.appendChild(style);
}

function initScrollLuxuryAnimation() {
  if (typeof scrollLuxuryDestroy === 'function') {
    scrollLuxuryDestroy();
    scrollLuxuryDestroy = null;
  }

  const progress = document.getElementById('luxScrollProgress');
  const hero = document.querySelector('.lux-hero');

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
    entries.forEach((entry) => {
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

  renderStackerGame();

  if (!keepLog) {
    setStackerLog([
      {
        type: 'info',
        text: `Misi dimulai: ${level.caseTitle}. Susun kartu aksi sesuai pipeline yang benar.`
      }
    ]);
  }
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

  root.innerHTML = `
    <section class="ps-game-grid">
      <div class="ps-card lux-premium-card">
        <div class="ps-card-head">
          <div>
            <h3>${level.title}</h3>
            <p>${level.caseDesc}</p>
          </div>
          <div class="ps-level-pill">${STACKER_STATE.levelIndex + 1} / ${STACKER_LEVELS.length}</div>
        </div>

        <div class="ps-case-panel">
          <div class="ps-case-box">
            <label>Kasus</label>
            <strong>${level.caseTitle}</strong>
            <span>${level.caseDesc}</span>
          </div>
          <div class="ps-case-box">
            <label>Pagu</label>
            <strong>${level.budget}</strong>
          </div>
          <div class="ps-case-box">
            <label>Deadline</label>
            <strong>${level.deadline}</strong>
          </div>
          <div class="ps-case-box">
            <label>Tingkat</label>
            <strong>${level.difficulty}</strong>
          </div>
        </div>

        <div class="ps-score-grid">
          <div class="ps-score-card">
            <label>Progress</label>
            <strong id="psProgressText">${STACKER_STATE.progress}%</strong>
          </div>
          <div class="ps-score-card">
            <label>Kepatuhan</label>
            <strong id="psComplianceText">${STACKER_STATE.compliance}</strong>
          </div>
          <div class="ps-score-card">
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
            <h3>Kartu Aksi</h3>
            <p>Drag kartu ke slot pipeline. Kalau urutannya salah, kartu akan mental balik dan risiko naik.</p>
          </div>
        </div>

        <div class="ps-bank" id="psCardBank">
          ${level.cards.map(card => renderStackerCard(card, placedIds.has(card.id))).join('')}
        </div>

        <div class="ps-finish" id="psFinishBox">
          ${renderStackerFinish()}
        </div>
      </div>

      <aside class="ps-side lux-sticky-side">
        <div class="ps-card lux-premium-card">
          <div class="ps-card-head">
            <div>
              <h3>Kontrol Level</h3>
              <p>Ulang level atau lanjut ke kasus berikutnya.</p>
            </div>
          </div>

          <div class="ps-buttons">
            <button type="button" class="ps-btn ps-btn-soft" id="psResetBtn">Reset Level</button>
            <button type="button" class="ps-btn ps-btn-primary" id="psNextBtn" ${STACKER_STATE.finished ? '' : 'disabled'}>
              Level Berikutnya
            </button>
          </div>
        </div>

        <div class="ps-card lux-premium-card">
          <div class="ps-card-head">
            <div>
              <h3>Log Keputusan</h3>
              <p>Setiap aksi langsung memberi feedback.</p>
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
      data-card-id="${card.id}"
    >
      <div class="ps-card-icon">${card.icon}</div>
      <strong>${card.label}</strong>
      <span>${card.note}</span>
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
  if (STACKER_STATE.risk <= 30 && STACKER_STATE.wrong <= 2) return 2;
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

      handleStackerDrop(cardId, slotIndex);
    });
  });

  const resetBtn = document.getElementById('psResetBtn');
  const nextBtn = document.getElementById('psNextBtn');

  if (resetBtn) {
    resetBtn.addEventListener('click', () => resetStackerLevel(false));
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', nextStackerLevel);
  }
}

function handleStackerDrop(cardId, slotIndex) {
  if (STACKER_STATE.finished) return;

  const level = getStackerLevel();
  const expectedId = level.ideal[slotIndex];
  const card = level.cards.find(item => item.id === cardId);

  if (!card) return;

  const alreadyPlaced = STACKER_STATE.placed.some(item => item && item.id === cardId);
  if (alreadyPlaced) return;

  const nextEmptyIndex = STACKER_STATE.placed.findIndex(item => item === null);

  if (slotIndex !== nextEmptyIndex) {
    wrongStackerMove(cardId, `Isi pipeline dari kiri ke kanan. Slot berikutnya adalah nomor ${nextEmptyIndex + 1}.`);
    return;
  }

  if (cardId !== expectedId) {
    wrongStackerMove(cardId, getWrongMessage(cardId, expectedId));
    return;
  }

  STACKER_STATE.placed[slotIndex] = card;
  STACKER_STATE.compliance += 10;
  STACKER_STATE.progress = Math.round((STACKER_STATE.placed.filter(Boolean).length / level.ideal.length) * 100);

  addStackerLog({
    type: 'ok',
    text: level.hints[cardId] || `Benar. ${card.label} berada di posisi yang tepat.`
  });

  if (STACKER_STATE.placed.filter(Boolean).length === level.ideal.length) {
    STACKER_STATE.finished = true;
    STACKER_STATE.compliance += 10;

    addStackerLog({
      type: 'ok',
      text: 'Pipeline selesai. Paket berhasil disusun sampai realisasi.'
    });
  }

  renderStackerGame();
}

function wrongStackerMove(cardId, message) {
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
    }, 320);
  }

  addStackerLog({
    type: 'bad',
    text: message
  });

  refreshStackerScore();
  restoreStackerLog();
}

function getWrongMessage(cardId, expectedId) {
  const level = getStackerLevel();
  const card = level.cards.find(item => item.id === cardId);
  const expectedCard = level.cards.find(item => item.id === expectedId);

  const cardLabel = card ? card.label : cardId;
  const expectedLabel = expectedCard ? expectedCard.label : expectedId;

  const trapMessages = {
    'kontrak-awal': 'Jangan kontrak dulu sebelum dokumen, metode, dan prosesnya jelas. Risiko naik.',
    'pecah-paket': 'Pecah paket tanpa alasan yang tepat rawan menurunkan kepatuhan. Pertimbangkan konsolidasi.',
    'spek-mengarah': 'Spesifikasi yang terlalu mengarah meningkatkan risiko. Susun spesifikasi yang adil dan berbasis kebutuhan.',
    'tunda-dokumen': 'Menunda dokumen saat deadline mepet akan menaikkan risiko keterlambatan.',
    tender: 'Tender tidak selalu salah, tapi pada kasus ini urutannya atau kebutuhannya belum tepat.',
    'metode-pl': 'Pengadaan Langsung tidak tepat untuk kondisi level ini. Cek nilai, katalog, dan konteks paket.'
  };

  return trapMessages[cardId] || `Belum tepat. Kamu memilih "${cardLabel}", padahal langkah berikutnya seharusnya "${expectedLabel}".`;
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
        <div>Mulai susun kartu aksi ke pipeline.</div>
      </div>
    `;
    return;
  }

  logEl.innerHTML = logs.map(item => `
    <div class="ps-log-item">
      <div class="ps-log-icon ${item.type === 'ok' ? 'ok' : item.type === 'bad' ? 'bad' : 'info'}">
        ${item.type === 'ok' ? '✓' : item.type === 'bad' ? '!' : 'i'}
      </div>
      <div>${item.text}</div>
    </div>
  `).join('');
}

function renderDashboard() {
  injectProcurementStackerCss();
  injectScrollLuxuryCss();

  contentArea.innerHTML = `
    <div class="lux-scroll-progress" id="luxScrollProgress"></div>

    <section class="ps-dashboard lux-dashboard">
      <section class="ps-hero lux-hero lux-reveal">
        <div>
          <div class="ps-kicker">TRAXPBJ Academy • Interactive Game</div>
          <h3>Procurement Stacker</h3>
          <p>
            Game edukasi pengadaan untuk menyusun pipeline paket dari RUP sampai realisasi.
            Drag kartu aksi ke jalur proses yang benar. Kalau tepat, skor kepatuhan naik.
            Kalau salah, risiko paket naik dan kartu mental balik.
          </p>

          <div class="lux-scroll-hint">
            <span></span>
            Scroll untuk mulai simulasi
          </div>
        </div>
      </section>

      <div class="lux-section-label lux-reveal">Interactive Procurement Game</div>

      <div class="lux-game-stage lux-reveal" id="procurementStackerRoot"></div>

      <section class="ps-card lux-premium-card lux-reveal">
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

      <div class="footer-note lux-reveal">© 2026 TRAXPBJ - Procurement Stacker</div>
    </section>
  `;

  if (!Array.isArray(STACKER_STATE.placed) || !STACKER_STATE.placed.length) {
    resetStackerLevel(false);
  } else {
    renderStackerGame();
  }

  contentArea.querySelectorAll('[data-quick]').forEach((item) => {
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