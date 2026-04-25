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

const STACKER_CARD_LIBRARY_RAW = {
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

const LEVEL_DATA = [
  [
    'Level 1 — Dasar Pengadaan',
    'Belanja ATK Kantor',
    'Paket sederhana nilai kecil. Fokus: alur dasar dari RUP sampai realisasi.',
    'Tahapan dasar pengadaan dan pencatatan realisasi.',
    'Rp45.000.000',
    '60 hari',
    'Pemula',
    ['rup', 'kak', 'hps', 'metodePl', 'proses', 'kontrak', 'bast', 'realisasi'],
    ['kontrakAwal', 'lewatiRup']
  ],
  [
    'Level 2 — Paket Katalog',
    'Laptop Pelayanan Publik',
    'Barang tersedia di e-Katalog, pagu menengah, dan dibutuhkan cepat.',
    'Pemanfaatan e-Katalog dan pemilihan metode yang efisien.',
    'Rp350.000.000',
    '45 hari',
    'Pemula+',
    ['rup', 'kak', 'hps', 'cekKatalog', 'metodeEpurchasing', 'klarifikasi', 'kontrak', 'bast', 'realisasi'],
    ['metodePl', 'tender', 'abaikanKatalog']
  ],
  [
    'Level 3 — Deadline Mepet',
    'Meubelair Ruang Layanan',
    'Waktu pendek. Pilih jalur realistis dan jangan menunda dokumen.',
    'Pengendalian risiko waktu dan kesiapan dokumen.',
    'Rp180.000.000',
    '25 hari',
    'Menengah',
    ['rup', 'kak', 'hps', 'cekKatalog', 'metodeEpurchasing', 'kontrak', 'bast', 'realisasi'],
    ['tender', 'tundaDokumen', 'kontrakAwal']
  ],
  [
    'Level 4 — Konsolidasi',
    'Komputer Beberapa Bidang',
    'Kebutuhan sejenis tersebar di beberapa bidang. Tentukan langkah aman.',
    'Konsolidasi pengadaan dan risiko pemecahan paket.',
    'Rp650.000.000',
    '70 hari',
    'Menengah',
    ['rup', 'identifikasi', 'konsolidasi', 'kak', 'hps', 'cekKatalog', 'metodeEpurchasing', 'kontrak', 'bast', 'realisasi'],
    ['pecahPaket', 'metodePl', 'metodeAsalCepat']
  ],
  [
    'Level 5 — Spek Mengarah',
    'Laptop dengan Spek Terlalu Spesifik',
    'Spesifikasi awal terlalu mengarah. Perbaiki proses agar fair.',
    'Spesifikasi berbasis kebutuhan, bukan mengarah pada merek tertentu.',
    'Rp420.000.000',
    '50 hari',
    'Menengah',
    ['rup', 'reviewSpek', 'kak', 'hps', 'cekKatalog', 'metodeEpurchasing', 'klarifikasi', 'kontrak', 'bast', 'realisasi'],
    ['spekMengarah', 'kontrakAwal', 'abaikanKatalog']
  ],
  [
    'Level 6 — Jasa Konsultansi',
    'Kajian Teknis Perencanaan',
    'Paket jasa konsultansi membutuhkan metode dan dokumen yang tepat.',
    'Karakteristik jasa konsultansi dan metode seleksi.',
    'Rp280.000.000',
    '75 hari',
    'Menengah',
    ['rup', 'identifikasi', 'kak', 'hps', 'seleksi', 'proses', 'kontrak', 'monitoringKontrak', 'bast', 'realisasi'],
    ['metodeEpurchasing', 'metodePl', 'kontrakAwal']
  ],
  [
    'Level 7 — Jasa Kebersihan',
    'Jasa Kebersihan Gedung',
    'Paket jasa lainnya rutin dengan kebutuhan layanan berkelanjutan.',
    'KAK layanan, HPS, metode, kontrak, dan pengawasan.',
    'Rp480.000.000',
    '80 hari',
    'Menengah',
    ['rup', 'identifikasi', 'kak', 'hps', 'pilihMetode', 'proses', 'kontrak', 'monitoringKontrak', 'bast', 'realisasi'],
    ['metodeAsalCepat', 'pecahPaket', 'bastTanpaCek']
  ],
  [
    'Level 8 — Konstruksi Ringan',
    'Rehabilitasi Ruang Pelayanan',
    'Pekerjaan konstruksi membutuhkan dokumen teknis dan pemeriksaan kuat.',
    'Konstruksi, dokumen teknis, metode, kontrak, dan pemeriksaan.',
    'Rp760.000.000',
    '100 hari',
    'Sulit',
    ['rup', 'identifikasi', 'kak', 'hps', 'tender', 'proses', 'kontrak', 'monitoringKontrak', 'pemeriksaan', 'bast', 'realisasi'],
    ['metodePl', 'kontrakAwal', 'bastTanpaCek']
  ],
  [
    'Level 9 — Swakelola',
    'Kegiatan Pelatihan Internal',
    'Kegiatan lebih tepat dikelola secara swakelola.',
    'Kapan swakelola dipertimbangkan dan bagaimana alurnya.',
    'Rp95.000.000',
    '40 hari',
    'Menengah',
    ['rup', 'identifikasi', 'kak', 'hps', 'swakelola', 'proses', 'bast', 'realisasi'],
    ['metodeEpurchasing', 'tender', 'kontrakAwal']
  ],
  [
    'Level 10 — PDN/TKDN',
    'Pengadaan Perangkat Elektronik',
    'Tersedia pilihan produk, tetapi status PDN/TKDN harus diperhatikan.',
    'Perhatian pada produk dalam negeri dalam pengadaan.',
    'Rp510.000.000',
    '55 hari',
    'Menengah',
    ['rup', 'kak', 'hps', 'cekPdn', 'cekKatalog', 'metodeEpurchasing', 'klarifikasi', 'kontrak', 'bast', 'realisasi'],
    ['abaikanKatalog', 'metodeAsalCepat', 'kontrakAwal']
  ],
  [
    'Level 11 — RUP Belum Sinkron',
    'Paket Mau Jalan tapi RUP Belum Sesuai',
    'OPD ingin segera proses, tetapi data RUP perlu dicek.',
    'Kesesuaian RUP sebelum proses pengadaan.',
    'Rp220.000.000',
    '45 hari',
    'Sulit',
    ['rup', 'identifikasi', 'kak', 'hps', 'cekKatalog', 'pilihMetode', 'proses', 'kontrak', 'bast', 'realisasi'],
    ['lewatiRup', 'kontrakAwal', 'metodeAsalCepat']
  ],
  [
    'Level 12 — Katalog Tidak Sesuai',
    'Barang Ada di Katalog tapi Spek Tidak Cocok',
    'Katalog ditemukan, tetapi barang tidak sepenuhnya sesuai.',
    'Kesesuaian spesifikasi dan evaluasi kanal pengadaan.',
    'Rp330.000.000',
    '60 hari',
    'Sulit',
    ['rup', 'kak', 'hps', 'cekKatalog', 'klarifikasi', 'pilihMetode', 'proses', 'kontrak', 'bast', 'realisasi'],
    ['metodeEpurchasing', 'abaikanKatalog', 'kontrakAwal']
  ],
  [
    'Level 13 — Penyedia Terlambat',
    'Penyedia Terlambat Mengirim Barang',
    'Proses sudah kontrak, tetapi penyedia terlambat.',
    'Pengendalian kontrak dan respons atas keterlambatan.',
    'Rp190.000.000',
    'Sisa 10 hari',
    'Sulit',
    ['kontrak', 'monitoringKontrak', 'teguran', 'pemeriksaan', 'bast', 'pembayaran', 'realisasi'],
    ['bastTanpaCek', 'bayarDulu', 'realisasiLupa']
  ],
  [
    'Level 14 — BAST Bermasalah',
    'Barang Dikirim tapi Tidak Sesuai',
    'Barang datang, tetapi belum sesuai. Jangan langsung BAST.',
    'Pemeriksaan hasil sebelum serah terima.',
    'Rp155.000.000',
    'Sisa 7 hari',
    'Sulit',
    ['kontrak', 'pemeriksaan', 'teguran', 'klarifikasi', 'pemeriksaan', 'bast', 'pembayaran', 'realisasi'],
    ['bastTanpaCek', 'bayarDulu', 'realisasiLupa']
  ],
  [
    'Level 15 — Realisasi Lupa Dicatat',
    'Paket Selesai tapi Monitoring Kosong',
    'Paket selesai fisik, tapi realisasi belum dicatat.',
    'Pentingnya pencatatan realisasi untuk monitoring dan evaluasi.',
    'Rp72.000.000',
    'Selesai',
    'Pemula+',
    ['kontrak', 'bast', 'pembayaran', 'realisasi'],
    ['realisasiLupa', 'bastTanpaCek', 'bayarDulu']
  ]
];

const QUESTION_DATA = [
  ['Rantai Pasok', 'Segmen rantai pasok yang dilakukan oleh organisasi/korporasi/institusi pemasok disebut sebagai apa?', ['Rantai pasok hilir', 'Rantai pasok hulu', 'Rantai pasok eksternal', 'Rantai pasok internal'], 1, 'Pemasok berada pada sisi hulu karena menyediakan input sebelum digunakan organisasi pembeli.'],
  ['Rantai Pasok', 'Pembangunan puskesmas oleh pemerintah daerah termasuk contoh rantai pasok pengadaan dengan kategori apa?', ['Rantai pasok panjang', 'Rantai pasok kompleks', 'Rantai pasok pendek', 'Rantai pasok sederhana'], 0, 'Pekerjaan pembangunan melibatkan banyak tahapan, material, pelaksana, dan pengawasan.'],
  ['Manajemen Rantai Pasok', 'Penyusunan regulasi dan prosedur pendukung proses operasionalisasi Manajemen Rantai Pasok termasuk penerapan MRP pada level apa?', ['Perencanaan', 'Strategis', 'Taktis', 'Operasional'], 1, 'Regulasi dan prosedur menjadi arah kebijakan sehingga termasuk level strategis.'],
  ['Ruang Lingkup PBJ', 'PBJ Pemerintah dimulai dari tahap apa sampai tahap apa?', ['Identifikasi kebutuhan sampai kontrak', 'Perencanaan sampai serah terima', 'Identifikasi kebutuhan sampai serah terima hasil pekerjaan', 'Identifikasi kebutuhan sampai pemeriksaan hasil'], 2, 'PBJ dimulai dari identifikasi kebutuhan sampai serah terima hasil pekerjaan.'],
  ['Ruang Lingkup PBJ', 'Manakah yang bukan termasuk ruang lingkup PBJ Pemerintah?', ['PBJ bersumber APBN', 'PBJ bersumber APBD', 'PBJ bersumber APBDes', 'PBJ bersumber pinjaman/hibah'], 2, 'APBDes memiliki tata kelola tersendiri.'],
  ['Tujuan PBJ', 'PPK membeli laptop melalui katalog elektronik dengan TKDN + BMP 42%. Tujuan PBJ yang didukung adalah?', ['Menghasilkan barang sesuai nilai uang', 'Meningkatkan penggunaan produk dalam negeri', 'Meningkatkan peran UMK', 'Meningkatkan pelaku usaha nasional'], 1, 'TKDN/BMP menunjukkan keberpihakan pada produk dalam negeri.'],
  ['Tujuan PBJ', 'Pokja membuka persyaratan secara luas agar banyak pelaku usaha dapat ikut. Tujuan PBJ yang sesuai?', ['Meningkatkan industri kreatif', 'Meningkatkan pelaku usaha nasional', 'Meningkatkan UMK', 'Pemerataan ekonomi dan perluasan kesempatan berusaha'], 3, 'Kesempatan luas mendukung pemerataan ekonomi dan kesempatan berusaha.'],
  ['Perencanaan PBJ', 'Identifikasi kebutuhan dan penyediaan anggaran mendukung kebijakan apa?', ['PBJ transparan', 'Meningkatkan kualitas perencanaan PBJ', 'Mendorong PDN dan SNI', 'Mengembangkan e-marketplace'], 1, 'Identifikasi kebutuhan dan anggaran adalah bagian dari peningkatan kualitas perencanaan.'],
  ['Spesifikasi Teknis', 'Spesifikasi kertas dengan ekolabel mendukung tujuan apa?', ['Mendorong PDN/SNI', 'Mendorong industri kreatif', 'Melaksanakan PBJ berkelanjutan', 'Meningkatkan kualitas perencanaan'], 2, 'Ekolabel dan ramah lingkungan berkaitan dengan PBJ berkelanjutan.'],
  ['Prinsip PBJ', 'Barang tidak sesuai spesifikasi sehingga tidak dapat digunakan. Prinsip PBJ yang tidak terpenuhi adalah?', ['Efisien', 'Efektif', 'Akuntabel', 'Transparan'], 1, 'Efektif berarti barang/jasa harus sesuai kebutuhan dan tujuan.'],
  ['Prinsip PBJ', 'Pokja melakukan evaluasi yang sama kepada seluruh penyedia. Prinsip PBJ yang diterapkan adalah?', ['Transparan', 'Terbuka', 'Bersaing', 'Adil'], 3, 'Perlakuan yang sama kepada peserta mencerminkan prinsip adil.'],
  ['Etika PBJ', 'PA menginstruksikan Pokja memenangkan PT tertentu. Hal ini bertentangan dengan etika apa?', ['Tertib dan bertanggung jawab', 'Profesional dan menjaga rahasia', 'Tidak saling mempengaruhi yang menyebabkan persaingan tidak sehat', 'Menghindari konflik kepentingan'], 2, 'Intervensi memenangkan pihak tertentu adalah pengaruh tidak sehat.'],
  ['Etika PBJ', 'PPK memiliki koperasi pegawai yang ikut sebagai calon penyedia pada paket di dinasnya. Etika yang relevan dijaga adalah?', ['Menghindari konflik kepentingan', 'Mencegah pemborosan', 'Mencegah kolusi', 'Bertanggung jawab'], 0, 'Keterkaitan PPK dengan calon penyedia berpotensi konflik kepentingan.'],
  ['Aspek Hukum', 'Perselisihan PPK dan penyedia pada pelaksanaan kontrak konstruksi terutama aspek hukum apa?', ['Hukum pidana', 'Hukum perdata', 'Hukum persaingan usaha', 'Hukum administrasi negara'], 1, 'Sengketa pelaksanaan kontrak pada dasarnya hubungan perdata.'],
  ['Pelaku PBJ', 'Pihak yang berwenang menetapkan spesifikasi teknis/KAK, HPS, dan rancangan kontrak adalah?', ['PA', 'Pokja Pemilihan', 'PPK', 'Pejabat Pengadaan'], 2, 'Kewenangan tersebut berada pada PPK.'],
  ['Pelaku PBJ', 'Siapa pelaku pengadaan yang melaksanakan e-Purchasing seragam batik senilai Rp250 juta?', ['PA/KPA', 'PPK', 'Pejabat Pengadaan', 'Pokja Pemilihan'], 1, 'Untuk nilai tersebut pelaksanaan e-Purchasing berada pada PPK.'],
  ['Sanggah', 'Perusahaan kalah tender dan mengajukan sanggah. Pihak yang menjawab sanggah adalah?', ['PA', 'KPA', 'PPK', 'Pokja Pemilihan'], 3, 'Sanggah pada proses pemilihan dijawab Pokja Pemilihan.'],
  ['UMK dan Koperasi', '40% dari belanja barang/jasa Rp2 miliar adalah?', ['Rp200.000.000', 'Rp400.000.000', 'Rp600.000.000', 'Rp800.000.000'], 3, '40% x Rp2 miliar = Rp800 juta.'],
  ['Katalog Elektronik', 'Katalog obat yang dikelola Kementerian Kesehatan termasuk katalog elektronik apa?', ['Nasional', 'Sektoral', 'Lokal', 'Regional'], 1, 'Katalog yang dikelola kementerian/lembaga tertentu termasuk sektoral.'],
  ['Ekosistem PBJ', 'Yang termasuk sumber daya pendukung ekosistem PBJ adalah?', ['Pengelola PBJ', 'Pemberi Keterangan Ahli', 'Pengelola LPSE', 'Personil lainnya'], 1, 'Pemberi keterangan ahli termasuk sumber daya pendukung.'],
  ['Pemilihan Penyedia', 'Peserta pemilihan mengundurkan diri dengan alasan yang tidak diterima Pokja. Sanksi yang dapat diberikan?', ['Digugurkan', 'Ganti kerugian', 'Daftar hitam 1 tahun', 'Daftar hitam 2 tahun'], 2, 'Pengunduran diri tanpa alasan yang dapat diterima dapat dikenakan daftar hitam 1 tahun.'],
  ['Identifikasi Kebutuhan', 'Dalam identifikasi kebutuhan kendaraan dinas, aspek yang perlu diperhatikan adalah?', ['Jumlah tenaga ahli', 'Jadwal kebutuhan', 'Jumlah produsen', 'Keinginan PA/KPA'], 1, 'Jadwal kebutuhan penting untuk menentukan kapan barang/jasa diperlukan.'],
  ['Konstruksi', 'Dalam identifikasi kebutuhan pekerjaan konstruksi, hal yang perlu diperhatikan adalah?', ['Kontrak pekerjaan konstruksi', 'Kompleksitas pekerjaan konstruksi', 'Dokumen pengadaan', 'RAB'], 1, 'Kompleksitas pekerjaan menjadi pertimbangan awal.'],
  ['Jenis Pengadaan', 'Penyusunan studi kelayakan pembangunan bendungan termasuk jenis pengadaan apa?', ['Barang', 'Pekerjaan konstruksi', 'Jasa lainnya', 'Jasa konsultansi'], 3, 'Studi kelayakan merupakan jasa profesional/keahlian sehingga termasuk jasa konsultansi.'],
  ['Spesifikasi Teknis', 'Salah satu fungsi spesifikasi teknis adalah?', ['Membandingkan harga penawaran', 'Mengetahui TKDN', 'Memberikan informasi kebutuhan kepada pelaku usaha', 'Menentukan jumlah tenaga ahli'], 2, 'Spesifikasi teknis memberi informasi kebutuhan yang harus dipenuhi pelaku usaha.'],
  ['Spesifikasi Teknis', 'Informasi yang dapat digunakan PPK dalam menyusun spesifikasi teknis/KAK adalah?', ['Produk usaha non-kecil', 'Produk ramah lingkungan', 'Produk impor', 'Penyebutan merek untuk tender'], 1, 'Produk ramah lingkungan dapat digunakan untuk mendukung PBJ berkelanjutan.'],
  ['Penyebutan Merek', 'Kondisi yang memungkinkan PPK menyebut merek dalam PBJ adalah?', ['Laptop melalui katalog elektronik', 'Mobil melalui tender', 'Jasa konsultansi seleksi', 'Alat berat tender cepat'], 0, 'Penyebutan merek dimungkinkan antara lain pada e-Purchasing melalui katalog.'],
  ['Spesifikasi Teknis', 'Yang bukan menjadi pertimbangan PPK dalam menyusun spesifikasi teknis pengadaan mobil dinas adalah?', ['Spesifikasi mutu', 'Spesifikasi pelayanan', 'Spesifikasi kualitas', 'Spesifikasi penyedia'], 3, 'Spesifikasi teknis berfokus pada barang/jasa, bukan spesifikasi penyedia.'],
  ['Spesifikasi Fungsi/Kinerja', 'Contoh spesifikasi teknis yang mendefinisikan fungsi dan kinerja adalah?', ['Kadar maksimal zat berbahaya', 'Mampu mengangkat beban 100 ton', 'Kapasitas 128 GB SSD', 'Bahan ramah lingkungan'], 1, 'Kemampuan mengangkat beban menggambarkan fungsi/kinerja.'],
  ['KAK', 'Dokumen perencanaan yang menjelaskan apa, mengapa, siapa, kapan, di mana, bagaimana, dan biaya pada jasa konsultansi disebut?', ['Spesifikasi teknis', 'Kerangka Acuan Kerja', 'HPS', 'Dokumen pemilihan'], 1, 'KAK menjelaskan ruang lingkup, tujuan, output, metode, waktu, dan kebutuhan biaya.'],
  ['Spesifikasi Pelayanan', 'Contoh penerapan spesifikasi pelayanan adalah?', ['Pengiriman laptop 10 unit', 'Garansi purna jual 1 tahun', 'Ukuran layar 42 inch', 'Ketepatan lokasi pengiriman'], 1, 'Garansi purna jual adalah bentuk spesifikasi pelayanan.'],
  ['KAK Jasa Konsultansi', 'Hal yang harus tercantum dalam KAK jasa konsultansi kajian kelayakan lingkungan adalah?', ['Kompetensi tenaga ahli', 'HPS', 'Spesifikasi peralatan', 'Remunerasi tenaga ahli'], 0, 'Kompetensi tenaga ahli merupakan unsur penting dalam KAK jasa konsultansi.'],
  ['HPS', 'Manakah ketentuan yang benar dalam penyusunan dan penetapan HPS?', ['Menjadi batas tertinggi penawaran jasa konsultansi', 'Nilai HPS bersifat rahasia', 'Tidak dapat digunakan sebagai dasar perhitungan kerugian negara', 'Memperhitungkan pajak termasuk PPh'], 2, 'HPS tidak digunakan sebagai dasar perhitungan kerugian negara.'],
  ['RAB', 'Tahapan penyusunan RAB yang paling tepat adalah?', ['Pengumpulan data, identifikasi komponen, harga satuan, rincian RAB', 'Harga satuan, rincian RAB, pengumpulan data, identifikasi komponen', 'Identifikasi komponen, harga satuan, RAB, pengumpulan data', 'Identifikasi komponen, pengumpulan data, RAB, harga satuan'], 0, 'Urutan logis: kumpulkan data, identifikasi komponen, tentukan harga satuan, susun rincian RAB.'],
  ['Perkiraan Harga', 'Komponen biaya langsung personel jasa konsultansi meliputi?', ['Gaji dasar, biaya sosial, biaya tidak langsung, dan profit', 'Gaji personel, biaya ekonomi, biaya tidak langsung, dan profit', 'Gaji pegawai, biaya ekonomi, biaya tidak langsung, dan profit', 'Gaji tim konsultan, biaya sosial, biaya langsung, dan profit'], 0, 'Komponen biaya langsung personel mencakup gaji dasar, biaya sosial, biaya tidak langsung, dan profit.'],
  ['HPS', 'Contoh pengadaan yang menggunakan HPS adalah?', ['Tender jasa lainnya senilai Rp201 juta', 'Pengadaan langsung ATK Rp10 juta', 'e-Purchasing APAR Rp210 juta', 'Pekerjaan terintegrasi Rp300 miliar'], 0, 'Tender jasa lainnya memerlukan HPS dalam proses pengadaannya.'],
  ['Cara Pengadaan', 'Contoh pengadaan yang dapat dilakukan secara swakelola adalah?', ['Pemeliharaan kendaraan tempur', 'Pembangunan gedung kantor', 'Pengadaan laptop pegawai', 'Pengadaan ATK kantor'], 0, 'Kegiatan tertentu dapat dipertimbangkan sebagai swakelola bila sesuai kriteria.'],
  ['Tujuan PBJ', 'Strategi pengadaan untuk meningkatkan peran pelaku usaha nasional adalah?', ['Mengalokasikan minimal 40% untuk UMK/koperasi', 'Mendorong inovasi pengadaan', 'Menyelenggarakan LPSE semua jenis pengadaan', 'Memperkuat SDM dan kelembagaan'], 0, 'Alokasi untuk UMK/koperasi mendukung peran pelaku usaha nasional.'],
  ['Strategi Pemaketan', 'Pemaketan barang/jasa dilakukan dengan mempertimbangkan apa?', ['Keluaran, volume, ketersediaan, kemampuan pelaku usaha, dan anggaran', 'Keluaran, volume, tenaga ahli, swakelola, dan anggaran', 'Keluaran, volume, barang, pelaku pengadaan, dan anggaran', 'Keluaran, volume, barang, dan tata kelola anggaran'], 0, 'Pemaketan mempertimbangkan output, volume, ketersediaan barang/jasa, kemampuan pelaku usaha, dan anggaran.'],
  ['Konsolidasi', 'Konsolidasi pengadaan dapat dilakukan oleh?', ['KPA/PPK pada tahap perencanaan', 'KPA/PA pada tahap persiapan pengadaan', 'PPK/PA pada tahap persiapan pemilihan', 'PPK/UKPBJ pada tahap pemilihan'], 0, 'Konsolidasi dapat dilakukan sejak tahap perencanaan oleh KPA/PPK.'],
  ['UKPBJ', 'Pembentukan UKPBJ secara struktural berdasarkan kebutuhan dan regulasi dilakukan oleh?', ['Kepala Daerah', 'Kuasa Pengguna Anggaran', 'Pengguna Anggaran', 'PPK'], 0, 'Pembentukan UKPBJ secara struktural dilakukan oleh Kepala Daerah.'],
  ['UKPBJ', 'Bidang UKPBJ yang menjalankan fungsi pengelolaan sistem informasi PBJ adalah?', ['Pengelolaan LPSE', 'Pengelolaan PBJ', 'Pembinaan SDM dan kelembagaan', 'Pendampingan/konsultasi/bimtek'], 0, 'Fungsi sistem informasi pengadaan berada pada pengelolaan LPSE.'],
  ['UKPBJ', 'Dari empat bidang UKPBJ, bidang yang dapat digabungkan adalah?', ['Bidang 3 dan 4', 'Bidang 2 dan 3', 'Bidang 2 dan 1', 'Bidang 1 dan 4'], 0, 'Bidang pembinaan SDM/kelembagaan dan pendampingan/konsultasi dapat digabungkan.'],
  ['Persiapan Pemilihan', 'Reviu dokumen persiapan pengadaan oleh Pokja merupakan aktivitas pada tahap apa?', ['Perencanaan pengadaan', 'Persiapan pemilihan', 'Pemilihan penyedia', 'Pelaksanaan pengadaan'], 1, 'Reviu dokumen persiapan pengadaan oleh Pokja dilakukan pada tahap persiapan pemilihan.']
];

const STACKER_CARD_LIBRARY = Object.fromEntries(
  Object.entries(STACKER_CARD_LIBRARY_RAW).map(([key, item]) => [
    key,
    {
      id: item[0],
      label: item[1],
      icon: item[2],
      note: item[3]
    }
  ])
);

function c(key) {
  return STACKER_CARD_LIBRARY[key];
}

function makeLevel(config) {
  const idealCards = config.ideal
    .map(id => c(id))
    .filter(Boolean);

  const trapCards = (config.traps || [])
    .map(id => c(id))
    .filter(Boolean);

  return {
    ...config,
    ideal: idealCards.map(card => card.id),
    cards: [...idealCards, ...trapCards]
  };
}

const STACKER_LEVELS = LEVEL_DATA.map(row => makeLevel({
  title: row[0],
  caseTitle: row[1],
  caseDesc: row[2],
  concept: row[3],
  budget: row[4],
  deadline: row[5],
  difficulty: row[6],
  ideal: row[7],
  traps: row[8]
}));

const TRYOUT_QUESTIONS = QUESTION_DATA.map((row, index) => ({
  id: index + 1,
  topic: row[0],
  question: row[1],
  options: row[2],
  answer: row[3],
  explanation: row[4]
}));

const STACKER_STATE = {
  levelIndex: 0,
  placed: [],
  compliance: 0,
  risk: 0,
  progress: 0,
  wrong: 0,
  finished: false,
  shuffledCards: [],
  shuffledLevelIndex: null,
  logs: [],
  awaitingQuiz: false,
  currentQuiz: null,
  currentQuizAnswered: false,
  currentQuizSelected: null,
  usedQuestionIds: []
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

    .ps-slot.pending{
      border-style:solid;
      border-color:#facc15;
      background:#fefce8;
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
      max-height:360px;
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

    .quiz-box{
      border-radius:22px;
      padding:14px;
      background:
        radial-gradient(circle at top right, rgba(34,211,238,.16), transparent 30%),
        #f8fbff;
      border:1px solid #dbeafe;
      margin-bottom:14px;
    }

    .quiz-topic{
      display:inline-flex;
      min-height:28px;
      align-items:center;
      padding:0 10px;
      border-radius:999px;
      background:#eff6ff;
      color:#123a72;
      border:1px solid #dbeafe;
      font-size:11px;
      font-weight:900;
      margin-bottom:10px;
    }

    .quiz-question{
      color:#102544;
      font-size:14px;
      font-weight:950;
      line-height:1.55;
      margin-bottom:12px;
    }

    .quiz-options{
      display:grid;
      grid-template-columns:1fr;
      gap:8px;
    }

    .quiz-option{
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

    .quiz-option:hover{
      transform:translateY(-1px);
      box-shadow:0 10px 22px rgba(15,23,42,.08);
    }

    .quiz-option.correct{
      background:#dcfce7;
      border-color:#86efac;
      color:#166534;
    }

    .quiz-option.wrong{
      background:#fee2e2;
      border-color:#fecaca;
      color:#991b1b;
    }

    .quiz-explanation{
      margin-top:12px;
      padding:12px;
      border-radius:16px;
      background:#fff;
      border:1px solid #e5edf5;
      color:#475569;
      font-size:12px;
      line-height:1.6;
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

function getStackerLevel() {
  return STACKER_LEVELS[STACKER_STATE.levelIndex] || STACKER_LEVELS[0];
}

function resetStackerLevel() {
  const level = getStackerLevel();

  STACKER_STATE.placed = Array(level.ideal.length).fill(null);
  STACKER_STATE.compliance = 0;
  STACKER_STATE.risk = 0;
  STACKER_STATE.progress = 0;
  STACKER_STATE.wrong = 0;
  STACKER_STATE.finished = false;
  STACKER_STATE.shuffledCards = shuffleArray(level.cards);
  STACKER_STATE.shuffledLevelIndex = STACKER_STATE.levelIndex;
  STACKER_STATE.logs = [];
  STACKER_STATE.awaitingQuiz = false;
  STACKER_STATE.currentQuiz = null;
  STACKER_STATE.currentQuizAnswered = false;
  STACKER_STATE.currentQuizSelected = null;
  STACKER_STATE.usedQuestionIds = [];

  addStackerLog({
    type: 'info',
    title: 'Misi dimulai',
    text: `${level.caseTitle}. Kartu sudah diacak. Setelah langkah benar, jawab soal validasi sebelum lanjut.`
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

function addStackerLog(item) {
  STACKER_STATE.logs.unshift(item);
  STACKER_STATE.logs = STACKER_STATE.logs.slice(0, 12);
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
            <div class="ps-mode-pill">Pipeline + Tryout</div>
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
            <label>Validasi</label>
            <strong>${STACKER_STATE.awaitingQuiz ? 'Soal' : 'OK'}</strong>
          </div>
        </div>

        <div class="ps-progress-track">
          <div class="ps-progress-bar" style="width:${STACKER_STATE.progress}%"></div>
        </div>

        <div class="ps-pipeline" id="psPipeline">
          ${level.ideal.map((stepId, index) => renderStackerSlot(index)).join('')}
        </div>

        <div class="ps-card-head">
          <div>
            <h3>Kartu Aksi Acak</h3>
            <p>
              Drag kartu ke pipeline. Setelah langkah benar, kamu wajib jawab soal validasi.
              Kalau belum jawab soal, pipeline dikunci sementara.
            </p>
          </div>
          <button type="button" class="ps-btn ps-btn-soft" id="psShuffleBtn" ${STACKER_STATE.awaitingQuiz ? 'disabled' : ''}>
            Acak Ulang Kartu
          </button>
        </div>

        <div class="ps-bank" id="psCardBank">
          ${STACKER_STATE.shuffledCards.map(card => renderStackerCard(card, placedIds.has(card.id))).join('')}
        </div>

        <div class="ps-finish ${STACKER_STATE.finished ? 'show' : ''}">
          ${renderStackerFinish()}
        </div>
      </div>

      <aside class="ps-side lux-sticky-side">
        <div class="ps-card">
          <div class="ps-card-head">
            <div>
              <h3>Challenge Validasi</h3>
              <p>Soal tryout masuk langsung ke pipeline. Jawab soal untuk membuka step berikutnya.</p>
            </div>
          </div>

          ${renderCurrentQuizPanel()}

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
              <p>Setiap aksi dan jawaban soal masuk ke log pembelajaran.</p>
            </div>
          </div>

          <div class="ps-log" id="psLog">
            ${renderStackerLogs()}
          </div>
        </div>
      </aside>
    </section>
  `;

  bindStackerEvents();
}

function renderStackerSlot(index) {
  const placed = STACKER_STATE.placed[index];
  const isPendingSlot = STACKER_STATE.awaitingQuiz && index === STACKER_STATE.placed.filter(Boolean).length - 1;

  if (placed) {
    return `
      <div class="ps-slot ${isPendingSlot ? 'pending' : 'correct'}" data-slot-index="${index}">
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
      draggable="${used || locked || STACKER_STATE.awaitingQuiz ? 'false' : 'true'}"
      data-card-id="${escapeHtml(card.id)}"
    >
      <div class="ps-card-icon">${card.icon}</div>
      <strong>${escapeHtml(card.label)}</strong>
      <span>${escapeHtml(card.note)}</span>
    </div>
  `;
}

function renderCurrentQuizPanel() {
  if (!STACKER_STATE.awaitingQuiz || !STACKER_STATE.currentQuiz) {
    return `
      <div class="quiz-box">
        <div class="quiz-topic">Belum ada soal</div>
        <div class="quiz-question">
          Susun satu kartu yang benar ke pipeline. Setelah itu soal validasi akan muncul di sini.
        </div>
      </div>
    `;
  }

  const q = STACKER_STATE.currentQuiz;

  return `
    <div class="quiz-box">
      <div class="quiz-topic">${escapeHtml(q.topic)} • Soal ${q.id}</div>
      <div class="quiz-question">${escapeHtml(q.question)}</div>

      <div class="quiz-options">
        ${q.options.map((option, index) => {
          let cls = '';

          if (STACKER_STATE.currentQuizAnswered) {
            if (index === q.answer) cls = 'correct';
            else if (index === STACKER_STATE.currentQuizSelected) cls = 'wrong';
          }

          return `
            <button
              type="button"
              class="quiz-option ${cls}"
              data-quiz-answer="${index}"
              ${STACKER_STATE.currentQuizAnswered ? 'disabled' : ''}
            >
              ${String.fromCharCode(65 + index)}. ${escapeHtml(option)}
            </button>
          `;
        }).join('')}
      </div>

      ${STACKER_STATE.currentQuizAnswered ? `
        <div class="quiz-explanation">
          <strong>Pembahasan:</strong><br>
          ${escapeHtml(q.explanation)}
        </div>

        <div class="ps-buttons" style="margin-top:12px;">
          <button type="button" class="ps-btn ps-btn-primary" id="btnContinueAfterQuiz">
            Lanjutkan Pipeline
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

function renderStackerLogs() {
  if (!STACKER_STATE.logs.length) {
    return `
      <div class="ps-log-item">
        <div class="ps-log-icon info">i</div>
        <div>
          <div class="ps-log-title">Mulai susun kartu</div>
          <div class="ps-log-sub">Drag kartu aksi ke pipeline dari kiri ke kanan.</div>
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

      handleStackerDrop(cardId, slotIndex);
    });
  });

  document.querySelectorAll('[data-quiz-answer]').forEach(btn => {
    btn.addEventListener('click', () => {
      handleQuizAnswer(Number(btn.dataset.quizAnswer));
    });
  });

  const continueBtn = document.getElementById('btnContinueAfterQuiz');
  if (continueBtn) {
    continueBtn.addEventListener('click', continueAfterQuiz);
  }

  const resetBtn = document.getElementById('psResetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetStackerLevel);
  }

  const nextBtn = document.getElementById('psNextBtn');
  if (nextBtn) {
    nextBtn.addEventListener('click', nextStackerLevel);
  }

  const shuffleBtn = document.getElementById('psShuffleBtn');
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

function handleStackerDrop(cardId, slotIndex) {
  if (STACKER_STATE.finished) return;

  if (STACKER_STATE.awaitingQuiz) {
    showToast('Jawab soal validasi dulu sebelum lanjut pipeline.', 'bad');
    addStackerLog({
      type: 'bad',
      title: 'Pipeline dikunci sementara',
      text: 'Kamu harus menjawab soal validasi dari langkah sebelumnya sebelum lanjut.'
    });
    renderStackerGame();
    return;
  }

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
  STACKER_STATE.progress = Math.round((STACKER_STATE.placed.filter(Boolean).length / level.ideal.length) * 100);
  STACKER_STATE.awaitingQuiz = true;
  STACKER_STATE.currentQuiz = pickQuizForStep(cardId);
  STACKER_STATE.currentQuizAnswered = false;
  STACKER_STATE.currentQuizSelected = null;

  addStackerLog({
    type: 'ok',
    title: `${card.label} benar`,
    text: `${getCorrectMessage(cardId)} Jawab soal validasi agar bisa lanjut ke langkah berikutnya.`
  });

  showToast(`Benar: ${card.label}. Jawab soal validasi.`, 'ok');
  renderStackerGame();
}

function wrongStackerMove(cardId, message) {
  STACKER_STATE.risk += 10;
  STACKER_STATE.compliance = Math.max(0, STACKER_STATE.compliance - 5);
  STACKER_STATE.wrong += 1;

  addStackerLog({
    type: 'bad',
    title: 'Langkah belum tepat',
    text: message
  });

  showToast('Belum tepat. Risiko naik.', 'bad');
  renderStackerGame();

  requestAnimationFrame(() => {
    const cardEl = document.querySelector(`.ps-action-card[data-card-id="${cardId}"]`);
    if (cardEl) {
      cardEl.classList.add('wrong');
      setTimeout(() => cardEl.classList.remove('wrong'), 360);
    }
  });
}

function pickQuizForStep(cardId) {
  const topicMap = {
    rup: ['Perencanaan PBJ', 'Ruang Lingkup PBJ', 'Identifikasi Kebutuhan'],
    identifikasi: ['Identifikasi Kebutuhan', 'Perencanaan PBJ'],
    konsolidasi: ['Konsolidasi', 'Strategi Pemaketan'],
    kak: ['KAK', 'Spesifikasi Teknis', 'Spesifikasi Pelayanan'],
    'review-spek': ['Spesifikasi Teknis', 'Penyebutan Merek', 'Spesifikasi Fungsi/Kinerja'],
    hps: ['HPS', 'RAB', 'Perkiraan Harga'],
    'cek-katalog': ['Katalog Elektronik', 'Penyebutan Merek'],
    'cek-pdn': ['Tujuan PBJ'],
    'pilih-metode': ['Cara Pengadaan', 'Jenis Pengadaan'],
    'metode-pl': ['Cara Pengadaan', 'Pelaku PBJ'],
    'metode-epurchasing': ['Katalog Elektronik', 'Pelaku PBJ'],
    tender: ['Pemilihan Penyedia', 'Sanggah'],
    seleksi: ['Jenis Pengadaan', 'KAK Jasa Konsultansi'],
    swakelola: ['Cara Pengadaan'],
    klarifikasi: ['Prinsip PBJ', 'Etika PBJ'],
    proses: ['Pemilihan Penyedia', 'Prinsip PBJ'],
    kontrak: ['Aspek Hukum', 'Pelaku PBJ'],
    'monitoring-kontrak': ['Aspek Hukum', 'Etika PBJ'],
    teguran: ['Etika PBJ', 'Aspek Hukum'],
    pemeriksaan: ['Prinsip PBJ', 'Spesifikasi Teknis'],
    bast: ['Prinsip PBJ', 'Pelaku PBJ'],
    pembayaran: ['Prinsip PBJ', 'Etika PBJ'],
    realisasi: ['Ruang Lingkup PBJ', 'Perencanaan PBJ']
  };

  const topics = topicMap[cardId] || [];
  let candidates = TRYOUT_QUESTIONS.filter(q =>
    topics.includes(q.topic) && !STACKER_STATE.usedQuestionIds.includes(q.id)
  );

  if (!candidates.length) {
    candidates = TRYOUT_QUESTIONS.filter(q => !STACKER_STATE.usedQuestionIds.includes(q.id));
  }

  if (!candidates.length) {
    STACKER_STATE.usedQuestionIds = [];
    candidates = TRYOUT_QUESTIONS;
  }

  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  STACKER_STATE.usedQuestionIds.push(picked.id);

  return picked;
}

function handleQuizAnswer(selectedIndex) {
  if (!STACKER_STATE.awaitingQuiz || !STACKER_STATE.currentQuiz || STACKER_STATE.currentQuizAnswered) return;

  const q = STACKER_STATE.currentQuiz;
  STACKER_STATE.currentQuizSelected = selectedIndex;
  STACKER_STATE.currentQuizAnswered = true;

  if (selectedIndex === q.answer) {
    STACKER_STATE.compliance += 10;

    addStackerLog({
      type: 'ok',
      title: 'Jawaban validasi benar',
      text: q.explanation
    });

    showToast('Jawaban benar. Kepatuhan naik.', 'ok');
    spawnConfetti();
  } else {
    STACKER_STATE.risk += 5;
    STACKER_STATE.wrong += 1;

    addStackerLog({
      type: 'bad',
      title: 'Jawaban validasi belum tepat',
      text: q.explanation
    });

    showToast('Jawaban belum tepat. Risiko naik, tapi pembahasan terbuka.', 'bad');
  }

  renderStackerGame();
}

function continueAfterQuiz() {
  if (!STACKER_STATE.currentQuizAnswered) {
    showToast('Jawab soal dulu sebelum lanjut.', 'bad');
    return;
  }

  STACKER_STATE.awaitingQuiz = false;
  STACKER_STATE.currentQuiz = null;
  STACKER_STATE.currentQuizAnswered = false;
  STACKER_STATE.currentQuizSelected = null;

  const level = getStackerLevel();
  const completed = STACKER_STATE.placed.filter(Boolean).length === level.ideal.length;

  if (completed) {
    STACKER_STATE.finished = true;
    STACKER_STATE.compliance += 10;

    addStackerLog({
      type: 'ok',
      title: 'Pipeline selesai',
      text: 'Semua langkah selesai dan validasi pembelajaran sudah dijawab. Lanjutkan ke level berikutnya.'
    });

    showToast('Mission Complete. Pipeline selesai.', 'ok');
    spawnConfetti();
  } else {
    addStackerLog({
      type: 'info',
      title: 'Pipeline terbuka lagi',
      text: 'Lanjutkan drag kartu berikutnya ke slot pipeline.'
    });

    showToast('Lanjut ke langkah berikutnya.', 'info');
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
          <div class="ps-kicker">TRAXPBJ Academy • Pipeline + Tryout Mode</div>
          <h3>Procurement Stacker</h3>
          <p>
            Game edukasi pengadaan berbasis studi kasus. Drag kartu aksi ke pipeline yang benar,
            lalu jawab soal validasi agar bisa lanjut ke langkah berikutnya. Jadi bukan cuma hafal urutan,
            tapi juga paham konsep PBJ.
          </p>
        </div>
      </section>

      <div class="lux-section-label lux-reveal">Interactive Procurement Game</div>

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

      <div class="footer-note lux-reveal">© 2026 TRAXPBJ - Procurement Stacker Pipeline + Tryout Mode</div>
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