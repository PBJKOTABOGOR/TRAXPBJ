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
  identifikasi: ['identifikasi', 'Identifikasi Kebutuhan', '🧠', 'Validasi kebutuhan, volume, lokasi, jadwal, dan pengguna.'],
  konsolidasi: ['konsolidasi', 'Konsolidasi', '🧲', 'Gabungkan kebutuhan sejenis bila tepat.'],
  kak: ['kak', 'KAK / Spesifikasi', '🧩', 'Susun kebutuhan teknis secara jelas, wajar, dan tidak mengarah.'],
  reviewSpek: ['review-spek', 'Review Spesifikasi', '🧐', 'Cek apakah spesifikasi terlalu mengarah atau tidak relevan.'],
  hps: ['hps', 'HPS / Referensi Harga', '💰', 'Susun harga perkiraan dengan dasar yang wajar.'],
  cekPdn: ['cek-pdn', 'Cek PDN / TKDN', '🇮🇩', 'Perhatikan produk dalam negeri dan TKDN/BMP.'],
  cekKatalog: ['cek-katalog', 'Cek e-Katalog', '🔎', 'Pastikan barang/jasa tersedia dan sesuai kebutuhan.'],
  pilihMetode: ['pilih-metode', 'Pilih Metode', '⚙️', 'Tentukan metode berdasarkan jenis, nilai, kondisi, dan karakter paket.'],
  metodePl: ['metode-pl', 'Pengadaan Langsung', '🛠️', 'Digunakan bila kondisi dan nilai paket sesuai.'],
  metodeEpurchasing: ['metode-epurchasing', 'e-Purchasing', '🛒', 'Gunakan katalog bila tersedia dan sesuai kebutuhan.'],
  tender: ['tender', 'Tender', '🏗️', 'Untuk paket yang membutuhkan proses pemilihan formal.'],
  seleksi: ['seleksi', 'Seleksi', '📐', 'Umumnya untuk jasa konsultansi.'],
  swakelola: ['swakelola', 'Swakelola', '🤲', 'Dipilih jika pelaksanaan memenuhi kriteria swakelola.'],
  klarifikasi: ['klarifikasi', 'Klarifikasi / Negosiasi', '🤝', 'Pastikan harga, spesifikasi, dan kemampuan pelaksanaan.'],
  proses: ['proses', 'Proses Pemilihan', '🚦', 'Laksanakan proses sesuai metode.'],
  kontrak: ['kontrak', 'SPK / Kontrak', '📑', 'Ikat hasil proses secara tertulis.'],
  monitoringKontrak: ['monitoring-kontrak', 'Monitoring Kontrak', '📡', 'Pantau waktu, mutu, volume, dan kewajiban penyedia.'],
  teguran: ['teguran', 'Teguran / Evaluasi', '📣', 'Digunakan saat ada keterlambatan atau masalah pelaksanaan.'],
  pemeriksaan: ['pemeriksaan', 'Pemeriksaan Hasil', '🔬', 'Cek kesesuaian sebelum diterima.'],
  bast: ['bast', 'BAST', '📦', 'Serah terima setelah barang/jasa sesuai.'],
  pembayaran: ['pembayaran', 'Pembayaran', '💳', 'Pembayaran sesuai dokumen pendukung.'],
  realisasi: ['realisasi', 'Catat Realisasi', '✅', 'Pastikan realisasi tercatat dalam monitoring.'],

  kontrakAwal: ['kontrak-awal', 'Kontrak Dulu', '🚨', 'Jebakan: lompat proses sebelum dokumen/metode siap.'],
  pecahPaket: ['pecah-paket', 'Pecah Paket', '💣', 'Jebakan: rawan menghindari metode yang seharusnya.'],
  spekMengarah: ['spek-mengarah', 'Spek Mengarah', '🚫', 'Jebakan: risiko persaingan tidak sehat.'],
  abaikanKatalog: ['abaikan-katalog', 'Abaikan Katalog', '⚠️', 'Jebakan: tidak cek kanal pengadaan yang tersedia.'],
  lewatiRup: ['lewati-rup', 'Lewati RUP', '⛔', 'Jebakan: proses tanpa cek perencanaan.'],
  bastTanpaCek: ['bast-tanpa-cek', 'BAST Tanpa Pemeriksaan', '📦', 'Jebakan: menerima tanpa verifikasi.'],
  bayarDulu: ['bayar-dulu', 'Bayar Dulu', '💸', 'Jebakan: pembayaran sebelum bukti memadai.'],
  tundaDokumen: ['tunda-dokumen', 'Tunda Dokumen', '🧨', 'Jebakan: risiko administrasi meningkat.'],
  metodeAsalCepat: ['metode-asal-cepat', 'Metode Asal Cepat', '🏃', 'Jebakan: cepat belum tentu tepat.'],
  realisasiLupa: ['realisasi-lupa', 'Lupakan Realisasi', '🕳️', 'Jebakan: monitoring jadi bolong.']
};

const CARD_LIBRARY = Object.fromEntries(
  Object.entries(CARD_LIBRARY_RAW).map(([key, item]) => [
    key,
    {
      id: item[0],
      key,
      label: item[1],
      icon: item[2],
      note: item[3],
      type: [
        'kontrakAwal',
        'pecahPaket',
        'spekMengarah',
        'abaikanKatalog',
        'lewatiRup',
        'bastTanpaCek',
        'bayarDulu',
        'tundaDokumen',
        'metodeAsalCepat',
        'realisasiLupa'
      ].includes(key) ? 'trap' : 'action'
    }
  ])
);

function c(key) {
  return CARD_LIBRARY[key];
}

const QUESTION_LEVELS_RAW = [
  {
    no: 1,
    title: 'Soal 1 — Dasar Pengadaan',
    caseTitle: 'Belanja ATK Kantor',
    caseDesc: 'OPD akan melakukan belanja ATK kantor senilai Rp45 juta. Susun alur pengadaan paling aman dari awal sampai realisasi.',
    budget: 'Rp45.000.000',
    deadline: '60 hari',
    difficulty: 'Pemula',
    concept: 'Alur dasar: RUP, KAK, HPS, metode, proses, kontrak, BAST, dan realisasi.',
    pipeline: ['rup', 'kak', 'hps', 'metodePl', 'proses', 'kontrak', 'bast', 'realisasi'],
    traps: ['kontrakAwal', 'lewatiRup', 'bayarDulu'],
    question: 'PBJ Pemerintah dimulai dari tahap apa sampai tahap apa?',
    options: [
      'Identifikasi kebutuhan sampai kontrak',
      'Perencanaan sampai pembayaran',
      'Identifikasi kebutuhan sampai serah terima hasil pekerjaan',
      'Penyusunan HPS sampai serah terima'
    ],
    answer: 2,
    explanation: 'PBJ Pemerintah dimulai dari identifikasi kebutuhan sampai serah terima hasil pekerjaan. Karena itu pipeline tidak boleh langsung lompat ke kontrak atau pembayaran.'
  },

  {
    no: 2,
    title: 'Soal 2 — Paket Katalog',
    caseTitle: 'Pengadaan Laptop Pelayanan Publik',
    caseDesc: 'OPD membutuhkan laptop untuk layanan publik. Barang tersedia di e-Katalog dan nilai paket Rp350 juta.',
    budget: 'Rp350.000.000',
    deadline: '45 hari',
    difficulty: 'Pemula+',
    concept: 'Cek PDN/TKDN, cek katalog, e-Purchasing, klarifikasi/negosiasi, kontrak, BAST, realisasi.',
    pipeline: ['rup', 'kak', 'hps', 'cekPdn', 'cekKatalog', 'metodeEpurchasing', 'klarifikasi', 'kontrak', 'bast', 'realisasi'],
    traps: ['metodePl', 'tender', 'abaikanKatalog', 'kontrakAwal'],
    question: 'PPK membeli laptop melalui katalog elektronik dengan TKDN + BMP 42%. Tujuan PBJ yang paling didukung adalah?',
    options: [
      'Menghasilkan barang sesuai nilai uang',
      'Meningkatkan penggunaan produk dalam negeri',
      'Meningkatkan peran UMK',
      'Meningkatkan peran pelaku usaha lokal'
    ],
    answer: 1,
    explanation: 'TKDN/BMP menunjukkan keberpihakan pada produk dalam negeri, sehingga tujuan yang paling kuat adalah meningkatkan penggunaan produk dalam negeri.'
  },

  {
    no: 3,
    title: 'Soal 3 — Deadline Mepet',
    caseTitle: 'Meubelair Ruang Layanan',
    caseDesc: 'OPD butuh meubelair untuk ruang layanan. Waktu tinggal 25 hari, nilai paket Rp180 juta, dan barang tersedia di katalog.',
    budget: 'Rp180.000.000',
    deadline: '25 hari',
    difficulty: 'Menengah',
    concept: 'Saat waktu terbatas, pastikan dokumen siap dan pilih kanal/metode yang realistis.',
    pipeline: ['rup', 'kak', 'hps', 'cekKatalog', 'metodeEpurchasing', 'kontrak', 'bast', 'realisasi'],
    traps: ['tender', 'tundaDokumen', 'kontrakAwal', 'abaikanKatalog'],
    question: 'Dalam kondisi barang tersedia di katalog dan dibutuhkan cepat, langkah penting sebelum e-Purchasing adalah?',
    options: [
      'Langsung kontrak agar cepat',
      'Abaikan katalog dan lakukan tender',
      'Pastikan spesifikasi, HPS/referensi harga, dan kesesuaian barang di katalog',
      'Pecah paket agar bisa pengadaan langsung'
    ],
    answer: 2,
    explanation: 'Cepat bukan berarti boleh lompat proses. Spesifikasi, referensi harga, dan kesesuaian barang tetap harus dicek.'
  },

  {
    no: 4,
    title: 'Soal 4 — Konsolidasi',
    caseTitle: 'Komputer Beberapa Bidang',
    caseDesc: 'Beberapa bidang mengusulkan komputer dengan kebutuhan sejenis. Total nilai Rp650 juta.',
    budget: 'Rp650.000.000',
    deadline: '70 hari',
    difficulty: 'Menengah',
    concept: 'Identifikasi kebutuhan, pemaketan, dan konsolidasi untuk mencegah pemecahan paket tidak wajar.',
    pipeline: ['rup', 'identifikasi', 'konsolidasi', 'kak', 'hps', 'cekKatalog', 'metodeEpurchasing', 'kontrak', 'bast', 'realisasi'],
    traps: ['pecahPaket', 'metodePl', 'metodeAsalCepat', 'kontrakAwal'],
    question: 'Pemaketan barang/jasa dilakukan dengan mempertimbangkan apa?',
    options: [
      'Keluaran, volume, ketersediaan, kemampuan pelaku usaha, dan anggaran',
      'Keinginan bidang, kecepatan proses, dan kemudahan administrasi',
      'Jumlah penyedia yang dikenal PPK',
      'Nilai paket agar selalu bisa pengadaan langsung'
    ],
    answer: 0,
    explanation: 'Pemaketan perlu mempertimbangkan keluaran, volume, ketersediaan, kemampuan pelaku usaha, dan anggaran. Memecah paket demi metode tertentu adalah risiko.'
  },

  {
    no: 5,
    title: 'Soal 5 — Spek Mengarah',
    caseTitle: 'Laptop dengan Spek Terlalu Spesifik',
    caseDesc: 'Spesifikasi awal mengarah ke merek tertentu. Nilai paket Rp420 juta.',
    budget: 'Rp420.000.000',
    deadline: '50 hari',
    difficulty: 'Menengah',
    concept: 'Review spesifikasi agar berbasis kebutuhan dan tidak mengarah.',
    pipeline: ['rup', 'reviewSpek', 'kak', 'hps', 'cekKatalog', 'metodeEpurchasing', 'klarifikasi', 'kontrak', 'bast', 'realisasi'],
    traps: ['spekMengarah', 'kontrakAwal', 'abaikanKatalog', 'metodeAsalCepat'],
    question: 'Salah satu fungsi spesifikasi teknis adalah?',
    options: [
      'Menentukan pemenang sebelum proses',
      'Memberikan informasi kebutuhan kepada pelaku usaha',
      'Mengunci merek tertentu agar barang sesuai selera',
      'Menghindari persaingan agar proses cepat'
    ],
    answer: 1,
    explanation: 'Spesifikasi teknis harus memberi informasi kebutuhan kepada pelaku usaha, bukan mengunci merek atau mempersempit persaingan secara tidak wajar.'
  },

  {
    no: 6,
    title: 'Soal 6 — Jasa Konsultansi',
    caseTitle: 'Kajian Teknis Perencanaan',
    caseDesc: 'OPD akan menyusun kajian teknis perencanaan dengan nilai Rp280 juta.',
    budget: 'Rp280.000.000',
    deadline: '75 hari',
    difficulty: 'Menengah',
    concept: 'Jasa konsultansi membutuhkan KAK, HPS, metode seleksi, proses, kontrak, monitoring, BAST, realisasi.',
    pipeline: ['rup', 'identifikasi', 'kak', 'hps', 'seleksi', 'proses', 'kontrak', 'monitoringKontrak', 'bast', 'realisasi'],
    traps: ['metodeEpurchasing', 'metodePl', 'kontrakAwal', 'abaikanKatalog'],
    question: 'Penyusunan studi kelayakan/kajian teknis termasuk jenis pengadaan apa?',
    options: [
      'Barang',
      'Pekerjaan konstruksi',
      'Jasa lainnya',
      'Jasa konsultansi'
    ],
    answer: 3,
    explanation: 'Kajian teknis/studi kelayakan merupakan jasa profesional berbasis keahlian, sehingga termasuk jasa konsultansi.'
  },

  {
    no: 7,
    title: 'Soal 7 — Konstruksi Ringan',
    caseTitle: 'Rehabilitasi Ruang Pelayanan',
    caseDesc: 'Pekerjaan konstruksi ringan dengan nilai Rp760 juta membutuhkan proses formal dan pemeriksaan hasil yang kuat.',
    budget: 'Rp760.000.000',
    deadline: '100 hari',
    difficulty: 'Sulit',
    concept: 'Konstruksi membutuhkan dokumen teknis, HPS, tender, kontrak, monitoring, pemeriksaan, BAST, realisasi.',
    pipeline: ['rup', 'identifikasi', 'kak', 'hps', 'tender', 'proses', 'kontrak', 'monitoringKontrak', 'pemeriksaan', 'bast', 'realisasi'],
    traps: ['metodePl', 'kontrakAwal', 'bastTanpaCek', 'bayarDulu'],
    question: 'Barang/pekerjaan tidak sesuai spesifikasi sehingga tidak dapat digunakan. Prinsip PBJ yang tidak terpenuhi adalah?',
    options: [
      'Efisien',
      'Efektif',
      'Transparan',
      'Akuntabel'
    ],
    answer: 1,
    explanation: 'Efektif berarti barang/jasa harus sesuai kebutuhan dan tujuan. Jika tidak bisa digunakan, prinsip efektif tidak terpenuhi.'
  },

  {
    no: 8,
    title: 'Soal 8 — Swakelola',
    caseTitle: 'Pelatihan Internal Pegawai',
    caseDesc: 'Kegiatan pelatihan internal lebih tepat dikelola sendiri karena berkaitan dengan kapasitas internal OPD.',
    budget: 'Rp95.000.000',
    deadline: '40 hari',
    difficulty: 'Menengah',
    concept: 'Swakelola dipilih bila memenuhi kriteria, tetap perlu perencanaan, KAK, biaya, pelaksanaan, BAST, realisasi.',
    pipeline: ['rup', 'identifikasi', 'kak', 'hps', 'swakelola', 'proses', 'bast', 'realisasi'],
    traps: ['metodeEpurchasing', 'tender', 'kontrakAwal', 'bayarDulu'],
    question: 'Contoh pengadaan yang dapat dilakukan secara swakelola adalah?',
    options: [
      'Kegiatan yang memenuhi kriteria swakelola dan dapat dilaksanakan sendiri/oleh pihak sesuai ketentuan',
      'Semua pengadaan barang elektronik',
      'Semua pekerjaan yang ingin dipercepat',
      'Paket yang sengaja dipecah agar nilainya kecil'
    ],
    answer: 0,
    explanation: 'Swakelola tidak dipilih asal cepat. Swakelola dipilih bila karakter kegiatan dan pelaksanaannya memenuhi kriteria.'
  },

  {
    no: 9,
    title: 'Soal 9 — Penyedia Terlambat',
    caseTitle: 'Penyedia Terlambat Mengirim Barang',
    caseDesc: 'Kontrak sudah berjalan, namun penyedia terlambat mengirim barang. Jangan langsung BAST atau bayar.',
    budget: 'Rp190.000.000',
    deadline: 'Sisa 10 hari',
    difficulty: 'Sulit',
    concept: 'Saat kontrak bermasalah, lakukan monitoring, teguran/evaluasi, pemeriksaan, BAST jika sesuai, pembayaran, realisasi.',
    pipeline: ['kontrak', 'monitoringKontrak', 'teguran', 'pemeriksaan', 'bast', 'pembayaran', 'realisasi'],
    traps: ['bastTanpaCek', 'bayarDulu', 'realisasiLupa'],
    question: 'Perselisihan PPK dan penyedia dalam pelaksanaan kontrak terutama termasuk aspek hukum apa?',
    options: [
      'Hukum pidana',
      'Hukum perdata',
      'Hukum persaingan usaha',
      'Hukum tata negara'
    ],
    answer: 1,
    explanation: 'Hubungan PPK dan penyedia dalam pelaksanaan kontrak pada dasarnya adalah hubungan perdata.'
  },

  {
    no: 10,
    title: 'Soal 10 — Final Boss',
    caseTitle: 'Pengadaan Alat Kesehatan Bernilai Besar',
    caseDesc: 'Kasus campuran: spesifikasi, PDN, katalog, metode, kontrak, pemeriksaan, pembayaran, dan realisasi.',
    budget: 'Rp1.200.000.000',
    deadline: '90 hari',
    difficulty: 'Boss',
    concept: 'Pahami alur besar pengadaan dan hindari jebakan: spek mengarah, pecah paket, kontrak dulu, BAST tanpa cek, bayar dulu.',
    pipeline: ['rup', 'identifikasi', 'reviewSpek', 'kak', 'hps', 'cekPdn', 'cekKatalog', 'pilihMetode', 'klarifikasi', 'kontrak', 'monitoringKontrak', 'pemeriksaan', 'bast', 'pembayaran', 'realisasi'],
    traps: ['spekMengarah', 'pecahPaket', 'kontrakAwal', 'bastTanpaCek', 'bayarDulu', 'realisasiLupa'],
    question: 'PA menginstruksikan Pokja memenangkan penyedia tertentu. Hal ini bertentangan dengan etika apa?',
    options: [
      'Tertib dan bertanggung jawab',
      'Tidak saling mempengaruhi yang menyebabkan persaingan tidak sehat',
      'Mempercepat proses pengadaan',
      'Mendahulukan pengalaman penyedia'
    ],
    answer: 1,
    explanation: 'Intervensi untuk memenangkan penyedia tertentu merupakan bentuk pengaruh yang menyebabkan persaingan tidak sehat.'
  }
];

function makeQuestionLevel(config) {
  const pipelineCards = config.pipeline.map(key => c(key)).filter(Boolean);
  const trapCards = (config.traps || []).map(key => c(key)).filter(Boolean);

  return {
    ...config,
    ideal: pipelineCards.map(card => card.id),
    cards: [...pipelineCards, ...trapCards]
  };
}

const QUESTION_LEVELS = QUESTION_LEVELS_RAW.map(makeQuestionLevel);

const STACKER_STATE = {
  questionIndex: 0,
  placed: [],
  shuffledCards: [],
  selectedCardId: null,
  stage: 'pipeline',
  compliance: 0,
  risk: 0,
  progress: 0,
  wrong: 0,
  quizSelected: null,
  quizAnswered: false,
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

function getCurrentQuestion() {
  return QUESTION_LEVELS[STACKER_STATE.questionIndex] || QUESTION_LEVELS[0];
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
      grid-template-columns:minmax(0,1.55fr) minmax(390px,.75fr);
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

    .ps-slot.locked{
      opacity:.58;
      pointer-events:none;
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

    .ps-bank.locked{
      opacity:.56;
      pointer-events:none;
      filter:grayscale(.25);
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

    .ps-concept-box,
    .ps-quiz-box{
      border-radius:18px;
      padding:12px;
      background:#f8fbff;
      border:1px solid #dbeafe;
      margin-bottom:12px;
    }

    .ps-quiz-box{
      background:
        radial-gradient(circle at top right, rgba(34,211,238,.12), transparent 34%),
        linear-gradient(180deg,#ffffff 0%,#f8fbff 100%);
    }

    .ps-concept-box label,
    .ps-quiz-box label{
      display:block;
      color:#64748b;
      font-size:11px;
      font-weight:850;
      text-transform:uppercase;
      letter-spacing:.06em;
      margin-bottom:8px;
    }

    .ps-concept-box strong{
      color:#102544;
      font-size:13px;
      line-height:1.55;
      display:block;
    }

    .ps-quiz-question{
      color:#102544;
      font-size:14px;
      font-weight:950;
      line-height:1.55;
      margin-bottom:12px;
    }

    .ps-quiz-options{
      display:grid;
      grid-template-columns:1fr;
      gap:8px;
    }

    .ps-quiz-option{
      border:none;
      cursor:pointer;
      border-radius:14px;
      background:#fff;
      border:1px solid #dbe5f0;
      padding:11px 12px;
      text-align:left;
      color:#102544;
      font-size:12px;
      line-height:1.45;
      font-weight:800;
      transition:.18s ease;
    }

    .ps-quiz-option:hover{
      transform:translateY(-1px);
      box-shadow:0 10px 22px rgba(15,23,42,.08);
    }

    .ps-quiz-option.correct{
      background:#dcfce7;
      border-color:#86efac;
      color:#166534;
    }

    .ps-quiz-option.wrong{
      background:#fee2e2;
      border-color:#fecaca;
      color:#991b1b;
    }

    .ps-explanation{
      margin-top:12px;
      padding:12px;
      border-radius:16px;
      background:#fff;
      border:1px solid #e5edf5;
      color:#475569;
      font-size:12px;
      line-height:1.6;
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

function addLog(item) {
  STACKER_STATE.logs.unshift(item);
  STACKER_STATE.logs = STACKER_STATE.logs.slice(0, 14);
}

function resetCurrentQuestion() {
  const q = getCurrentQuestion();

  STACKER_STATE.placed = Array(q.ideal.length).fill(null);
  STACKER_STATE.shuffledCards = shuffleArray(q.cards);
  STACKER_STATE.selectedCardId = null;
  STACKER_STATE.stage = 'pipeline';
  STACKER_STATE.progress = 0;
  STACKER_STATE.quizSelected = null;
  STACKER_STATE.quizAnswered = false;
  STACKER_STATE.logs = [];

  addLog({
    type: 'info',
    title: `${q.title} dimulai`,
    text: 'Susun pipeline sampai selesai. Setelah pipeline benar semua, pertanyaan ABCD akan muncul.'
  });

  renderStackerGame();
}

function nextQuestion() {
  if (STACKER_STATE.questionIndex < QUESTION_LEVELS.length - 1) {
    STACKER_STATE.questionIndex += 1;
  } else {
    STACKER_STATE.questionIndex = 0;
  }

  resetCurrentQuestion();
}

function restartGame() {
  STACKER_STATE.questionIndex = 0;
  STACKER_STATE.compliance = 0;
  STACKER_STATE.risk = 0;
  STACKER_STATE.wrong = 0;
  resetCurrentQuestion();
}

function renderStackerGame() {
  const root = document.getElementById('procurementStackerRoot');

  if (!root) return;

  const q = getCurrentQuestion();
  const placedIds = new Set(STACKER_STATE.placed.filter(Boolean).map(item => item.id));
  const pipelineLocked = STACKER_STATE.stage !== 'pipeline';

  root.innerHTML = `
    <section class="ps-game-grid">
      <div class="ps-card">
        <div class="ps-card-head">
          <div>
            <h3>${escapeHtml(q.title)}</h3>
            <p>${escapeHtml(q.caseDesc)}</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
            <div class="ps-mode-pill">${STACKER_STATE.stage === 'pipeline' ? 'Susun Pipeline' : 'Jawab ABCD'}</div>
            <div class="ps-level-pill">${q.no} / ${QUESTION_LEVELS.length}</div>
            ${STACKER_STATE.selectedCardId ? '<div class="ps-level-pill warn">Kartu dipilih</div>' : ''}
          </div>
        </div>

        <div class="ps-case-panel">
          <div class="ps-case-box">
            <label>Kasus</label>
            <strong>${escapeHtml(q.caseTitle)}</strong>
            <span>${escapeHtml(q.caseDesc)}</span>
          </div>
          <div class="ps-case-box">
            <label>Pagu</label>
            <strong>${escapeHtml(q.budget)}</strong>
          </div>
          <div class="ps-case-box">
            <label>Deadline</label>
            <strong>${escapeHtml(q.deadline)}</strong>
          </div>
          <div class="ps-case-box">
            <label>Tingkat</label>
            <strong>${escapeHtml(q.difficulty)}</strong>
          </div>
        </div>

        <div class="ps-score-grid">
          <div class="ps-score-card">
            <label>Progress Pipeline</label>
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
          ${q.ideal.map((stepId, index) => renderSlot(index, pipelineLocked)).join('')}
        </div>

        <div class="ps-card-head">
          <div>
            <h3>Kartu Pipeline Acak</h3>
            <p>
              Susun kartu aksi dari kiri ke kanan sesuai kasus. Setelah semua slot benar,
              baru pertanyaan ABCD muncul di kanan.
            </p>
          </div>
          <button type="button" class="ps-btn ps-btn-soft" id="psShuffleBtn" ${pipelineLocked ? 'disabled' : ''}>
            Acak Ulang Kartu
          </button>
        </div>

        <div class="ps-bank ${pipelineLocked ? 'locked' : ''}" id="psCardBank">
          ${STACKER_STATE.shuffledCards.map(card => renderCard(card, placedIds.has(card.id), false)).join('')}
        </div>
      </div>

      <aside class="ps-side lux-sticky-side">
        <div class="ps-card">
          <div class="ps-card-head">
            <div>
              <h3>${STACKER_STATE.stage === 'pipeline' ? 'Misi Pipeline' : 'Pertanyaan ABCD'}</h3>
              <p>
                ${STACKER_STATE.stage === 'pipeline'
                  ? 'Selesaikan pipeline dulu. Pertanyaan ABCD belum muncul sebelum pipeline benar.'
                  : 'Pipeline sudah benar. Sekarang jawab pertanyaan konsep dari kasus ini.'}
              </p>
            </div>
          </div>

          <div class="ps-concept-box">
            <label>Konsep yang dilatih</label>
            <strong>${escapeHtml(q.concept)}</strong>
          </div>

          ${renderQuizPanel()}

          <div class="ps-buttons">
            <button type="button" class="ps-btn ps-btn-soft" id="psResetBtn">Reset Soal Ini</button>
            <button type="button" class="ps-btn ps-btn-soft" id="psRestartBtn">Ulang dari Soal 1</button>
            <button type="button" class="ps-btn ps-btn-primary" id="psNextBtn" ${STACKER_STATE.quizAnswered ? '' : 'disabled'}>
              Lanjut Soal Berikutnya
            </button>
          </div>
        </div>

        <div class="ps-card">
          <div class="ps-card-head">
            <div>
              <h3>Pembahasan</h3>
              <p>Setiap langkah pipeline dan jawaban ABCD dijelaskan di sini.</p>
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

function renderSlot(index, locked) {
  const placed = STACKER_STATE.placed[index];
  const nextEmptyIndex = STACKER_STATE.placed.findIndex(item => item === null);
  const isClickReady = STACKER_STATE.selectedCardId && !placed && index === nextEmptyIndex && STACKER_STATE.stage === 'pipeline';

  if (placed) {
    return `
      <div class="ps-slot correct ${locked ? 'locked' : ''}" data-slot-index="${index}">
        <div class="ps-slot-number">${index + 1}</div>
        ${renderCard(placed, false, true)}
      </div>
    `;
  }

  return `
    <div class="ps-slot ${isClickReady ? 'click-ready' : ''} ${locked ? 'locked' : ''}" data-slot-index="${index}">
      <div class="ps-slot-number">${index + 1}</div>
      <div class="ps-slot-placeholder">
        ${isClickReady ? 'Klik untuk pasang kartu' : `Slot pipeline ${index + 1}`}
      </div>
    </div>
  `;
}

function renderCard(card, used = false, locked = false) {
  const selected = STACKER_STATE.selectedCardId === card.id ? 'selected' : '';
  const trapClass = card.type === 'trap' ? 'trap-card' : '';

  return `
    <div
      class="ps-action-card ${used ? 'used' : ''} ${locked ? 'correct-card' : ''} ${selected} ${trapClass}"
      draggable="${used || locked || STACKER_STATE.stage !== 'pipeline' ? 'false' : 'true'}"
      data-card-id="${escapeHtml(card.id)}"
    >
      <div class="ps-card-icon">${card.icon}</div>
      <strong>${escapeHtml(card.label)}</strong>
      <span>${escapeHtml(card.note)}</span>
    </div>
  `;
}

function renderQuizPanel() {
  const q = getCurrentQuestion();

  if (STACKER_STATE.stage === 'pipeline') {
    return `
      <div class="ps-quiz-box">
        <label>Status</label>
        <div class="ps-quiz-question">
          Pertanyaan ABCD terkunci. Selesaikan pipeline dulu sampai 100%.
        </div>
      </div>
    `;
  }

  return `
    <div class="ps-quiz-box">
      <label>Pertanyaan setelah pipeline benar</label>
      <div class="ps-quiz-question">${escapeHtml(q.question)}</div>

      <div class="ps-quiz-options">
        ${q.options.map((option, index) => {
          let cls = '';

          if (STACKER_STATE.quizAnswered) {
            if (index === q.answer) cls = 'correct';
            else if (index === STACKER_STATE.quizSelected) cls = 'wrong';
          }

          return `
            <button
              type="button"
              class="ps-quiz-option ${cls}"
              data-quiz-option="${index}"
              ${STACKER_STATE.quizAnswered ? 'disabled' : ''}
            >
              ${String.fromCharCode(65 + index)}. ${escapeHtml(option)}
            </button>
          `;
        }).join('')}
      </div>

      ${STACKER_STATE.quizAnswered ? `
        <div class="ps-explanation">
          <strong>Pembahasan:</strong><br>
          ${escapeHtml(q.explanation)}
        </div>
      ` : ''}
    </div>
  `;
}

function renderLogs() {
  if (!STACKER_STATE.logs.length) {
    return `
      <div class="ps-log-item">
        <div class="ps-log-icon info">i</div>
        <div>
          <div class="ps-log-title">Mulai susun pipeline</div>
          <div class="ps-log-sub">Drag kartu ke slot dari kiri ke kanan.</div>
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
      if (STACKER_STATE.stage !== 'pipeline') return;

      event.preventDefault();
      slot.classList.add('drag-over');
    });

    slot.addEventListener('dragleave', () => {
      slot.classList.remove('drag-over');
    });

    slot.addEventListener('drop', event => {
      if (STACKER_STATE.stage !== 'pipeline') return;

      event.preventDefault();
      slot.classList.remove('drag-over');

      const cardId = event.dataTransfer.getData('text/plain');
      const slotIndex = Number(slot.dataset.slotIndex);

      placeCard(cardId, slotIndex, slot);
    });

    slot.addEventListener('click', () => {
      if (STACKER_STATE.stage !== 'pipeline') return;
      if (!STACKER_STATE.selectedCardId) return;

      const slotIndex = Number(slot.dataset.slotIndex);
      placeCard(STACKER_STATE.selectedCardId, slotIndex, slot);
    });
  });

  document.querySelectorAll('[data-quiz-option]').forEach(button => {
    button.addEventListener('click', () => {
      answerQuiz(Number(button.dataset.quizOption), button);
    });
  });

  const resetBtn = document.getElementById('psResetBtn');
  const restartBtn = document.getElementById('psRestartBtn');
  const nextBtn = document.getElementById('psNextBtn');
  const shuffleBtn = document.getElementById('psShuffleBtn');

  if (resetBtn) resetBtn.addEventListener('click', resetCurrentQuestion);
  if (restartBtn) restartBtn.addEventListener('click', restartGame);
  if (nextBtn) nextBtn.addEventListener('click', nextQuestion);

  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      STACKER_STATE.shuffledCards = shuffleArray(getCurrentQuestion().cards);
      STACKER_STATE.selectedCardId = null;
      renderStackerGame();
      showToast('Kartu diacak ulang.', 'info');
    });
  }
}

function selectCard(cardId) {
  if (STACKER_STATE.stage !== 'pipeline') return;

  STACKER_STATE.selectedCardId = STACKER_STATE.selectedCardId === cardId ? null : cardId;

  if (STACKER_STATE.selectedCardId) {
    const card = getCurrentQuestion().cards.find(item => item.id === cardId);
    showToast(`Kartu dipilih: ${card ? card.label : cardId}. Klik slot biru.`, 'info');
  }

  renderStackerGame();
}

function placeCard(cardId, slotIndex, slotEl) {
  if (STACKER_STATE.stage !== 'pipeline') return;

  const q = getCurrentQuestion();
  const expectedId = q.ideal[slotIndex];
  const card = q.cards.find(item => item.id === cardId);

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
  STACKER_STATE.progress = Math.round((getPlacedCount() / q.ideal.length) * 100);
  STACKER_STATE.compliance += 10;

  addLog({
    type: 'ok',
    title: `${card.label} benar`,
    text: getCorrectMessage(card.id)
  });

  showToast(`Benar: ${card.label}`, 'ok');
  flashScreen('ok');
  popScore(slotEl || document.body, '+10 Pipeline', 'ok');

  const completed = getPlacedCount() === q.ideal.length;

  if (completed) {
    STACKER_STATE.stage = 'quiz';

    addLog({
      type: 'ok',
      title: 'Pipeline selesai',
      text: 'Pipeline sudah benar 100%. Sekarang jawab pertanyaan ABCD di panel kanan.'
    });

    showToast('Pipeline benar. Pertanyaan ABCD terbuka.', 'ok');
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

function answerQuiz(selectedIndex, buttonEl) {
  const q = getCurrentQuestion();

  if (STACKER_STATE.stage !== 'quiz') return;
  if (STACKER_STATE.quizAnswered) return;

  STACKER_STATE.quizSelected = selectedIndex;
  STACKER_STATE.quizAnswered = true;

  if (selectedIndex === q.answer) {
    STACKER_STATE.compliance += 20;

    addLog({
      type: 'ok',
      title: 'Jawaban ABCD benar',
      text: q.explanation
    });

    showToast('Jawaban benar. Kepatuhan naik.', 'ok');
    flashScreen('ok');
    popScore(buttonEl || document.body, '+20 Konsep', 'ok');
    spawnConfetti();
  } else {
    STACKER_STATE.risk += 8;
    STACKER_STATE.wrong += 1;

    addLog({
      type: 'bad',
      title: 'Jawaban ABCD belum tepat',
      text: q.explanation
    });

    showToast('Jawaban belum tepat. Pembahasan terbuka.', 'bad');
    flashScreen('bad');
    popScore(buttonEl || document.body, '+8 Risiko', 'bad');
  }

  renderStackerGame();
}

function getCorrectMessage(cardId) {
  const messages = {
    rup: 'RUP menjadi pintu awal untuk memastikan paket, jadwal, pagu, dan metode.',
    identifikasi: 'Identifikasi kebutuhan mencegah paket dobel, tidak relevan, atau tidak sesuai prioritas.',
    konsolidasi: 'Konsolidasi membantu mengelola kebutuhan sejenis agar tidak terpecah tanpa alasan.',
    kak: 'KAK/spesifikasi harus berbasis kebutuhan dan tidak mengarah.',
    'review-spek': 'Review spesifikasi penting agar persaingan sehat.',
    hps: 'HPS/referensi harga menjadi dasar kewajaran biaya.',
    'cek-pdn': 'PDN/TKDN perlu diperhatikan untuk mendukung produk dalam negeri.',
    'cek-katalog': 'Cek katalog membantu menentukan apakah e-Purchasing dapat digunakan.',
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

  return messages[cardId] || 'Langkah ini tepat pada posisi pipeline saat ini.';
}

function getWrongMessage(cardId, expectedId) {
  const q = getCurrentQuestion();
  const card = q.cards.find(item => item.id === cardId);
  const expectedCard = q.cards.find(item => item.id === expectedId);

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

  return trapMessages[cardId] || `Belum tepat. Kamu memilih "${cardLabel}", padahal posisi ini seharusnya "${expectedLabel}". Konsep soal: ${q.concept}`;
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
          <div class="ps-kicker">TRAXPBJ Academy • Case Pipeline + ABCD</div>
          <h3>Procurement Stacker</h3>
          <p>
            Setiap nomor adalah satu kasus. Selesaikan susunan pipeline dulu sampai benar 100%,
            lalu jawab pertanyaan ABCD dari kasus tersebut. Setelah itu baru lanjut ke soal berikutnya.
          </p>
        </div>
      </section>

      <div class="lux-section-label lux-reveal">Interactive Procurement Case</div>

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

      <div class="footer-note lux-reveal">© 2026 TRAXPBJ - Procurement Stacker Case Pipeline + ABCD</div>
    </section>
  `;

  restartGame();

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