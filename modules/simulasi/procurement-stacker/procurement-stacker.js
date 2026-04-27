(() => {
  const AUTO_NEXT_DELAY_MS = 1800;
  const HINT_PENALTY = 3;
  const LEADERBOARD_API_URL = 'https://script.google.com/macros/s/AKfycbzE0c_eBIooXcKLmiMGm6o6cqtjfRsfIewmD6Hx5BCdmEYZmljquJiDOA0PJh6e9P_mOg/exec';
  const PLAYER_STORAGE_KEY = 'procstack_player_profile_v1';


const BONUS_RUN_COLLECTIBLES = [
  { key: 'star', label: 'Bintang Semangat', icon: '⭐', points: 4, yRange: [118, 215], useLogo: true, panjiLines: ['Bintang semangat masuk!', 'Mantap, semangat naik lagi!'] },
  { key: 'coin', label: 'Koin PANJI', icon: '🪙', points: 4, yRange: [84, 180], useLogo: true, panjiLines: ['Koin PANJI aman!', 'Sip, koin semangat dapat lagi!'] },
  { key: 'coffee', label: 'Kopi Pagi', icon: '☕', points: 5, yRange: [42, 112], panjiLines: ['Wah, nyawa balik lagi!', 'Kopi masuk, fokus balik!'] },
  { key: 'mie', label: 'Mie Rebus Lembur', icon: '🍜', points: 5, yRange: [42, 110], panjiLines: ['Mode lembur aktif!', 'Mie rebus siap, gas terus!'] },
  { key: 'doc', label: 'Dokumen Aman', icon: '📄', points: 4, yRange: [88, 176], panjiLines: ['Dokumen aman, hati tenang!', 'Arsip rapi, mood happy!'] },
  { key: 'gift', label: 'Bonus Poin', icon: '🎁', points: 6, yRange: [110, 198], panjiLines: ['Yeay, bonus poin!', 'Hadiah masuk, lanjut lari!'] }
];

const BONUS_RUN_HAZARDS = [
  { key: 'sleep', label: 'Ngantuk', icon: '💤', penalty: 3, risk: 1, yRange: [36, 82], panjiLine: 'Aduh, ngantuk menyerang!' },
  { key: 'berkas', label: 'Berkas Numpuk', icon: '📚', penalty: 4, risk: 1, yRange: [36, 86], panjiLine: 'Aduh, ketiban administrasi!' },
  { key: 'deadline', label: 'Deadline', icon: '🔥', penalty: 5, risk: 2, yRange: [36, 88], panjiLine: 'Deadline menyerang!' },
  { key: 'revisi', label: 'Revisi Dadakan', icon: '😵', penalty: 4, risk: 1, yRange: [36, 88], panjiLine: 'Yah, revisi dadakan datang lagi!' },
  { key: 'loading', label: 'Loading Lama', icon: '🐌', penalty: 3, risk: 1, yRange: [36, 84], panjiLine: 'Sabar... sistem sedang kontemplasi.' }
];



const BONUS_RUN_CHALLENGE = {
  type: 'bonusRun',
  bonusMode: 'auditWolf4',
  title: 'Level 4 — Audit Wolf: Siapa Perusak Paket?',
  caseTitle: 'Bonus Werewolf PBJ — Paket Berubah Aneh',
  desc: 'Bonus investigasi ringan. Malam hari ada paket dirusak penyusup. Pagi hari PANJI memberi laporan. Tebak aktor risiko yang paling mungkin menjadi pelaku.',
  budget: 'Bonus Investigasi',
  difficulty: 'Level 4 - Bonus',
  timeLimit: 0,
  explanation: 'Audit Wolf adalah bonus level single player vs bot. Tujuannya melatih insting membaca risiko PBJ lewat alur malam, pagi, diskusi, voting, dan hasil.'
};


const BONUS_PLANE_CHALLENGE = {
  type: 'bonusRun',
  bonusMode: 'auditWolf8',
  title: 'Level 8 — Audit Wolf: Sidang Paket Bermasalah',
  caseTitle: 'Bonus Werewolf PBJ — Penyusup Makin Licin',
  desc: 'Bonus investigasi lanjutan. Penyusup menyamar di antara tim aman. Baca laporan PANJI, dengarkan bot berdiskusi, lalu voting siapa perusak paket.',
  budget: 'Bonus Investigasi',
  difficulty: 'Level 8 - Bonus',
  timeLimit: 0,
  explanation: 'Audit Wolf level 8 menambah variasi kasus dan bot yang lebih ramai. Kalau tebakan benar, risiko turun; kalau salah, paket makin rawan.'
};



  let containerRef = null;
  let root = null;
  let destroyed = false;
  let toastEl = null;
  let autoNextTimer = null;
  let panjiIntroTimers = [];
  let panjiTalkTimer = null;

  let panjiEl = null;
  let panjiTextEl = null;
  let panjiEmoteEl = null;
  let panjiBubbleEl = null;
  let panjiHintBtn = null;
  let panjiMiniBtn = null;
  let panjiCharacterBtn = null;
  let panjiCloseBtn = null;
  let panjiUserMinimized = false;
  let panjiIntroAlreadyShown = false;

  let leaderboardModalEl = null;
  let leaderboardRefreshTimer = null;

  let levelTimer = null;
  let levelTimerStartedAt = 0;

  let tenderRushTimer = null;
  let tenderRushNextTimer = null;
  let tenderRushKeyHandler = null;

  let bonusRunFrame = null;
  let bonusRunKeyHandler = null;

  const CARD_LIBRARY = {
    rup: {
      id: 'rup',
      label: 'Cek RUP',
      icon: '📋',
      note: 'Pastikan paket sudah ada dan sesuai perencanaan.'
    },
    identifikasi: {
      id: 'identifikasi',
      label: 'Identifikasi Kebutuhan',
      icon: '🧠',
      note: 'Validasi kebutuhan, volume, lokasi, dan jadwal.'
    },
    konsolidasi: {
      id: 'konsolidasi',
      label: 'Konsolidasi',
      icon: '🧲',
      note: 'Gabungkan kebutuhan sejenis bila tepat.'
    },
    reviewSpek: {
      id: 'review-spek',
      label: 'Review Spesifikasi',
      icon: '🧐',
      note: 'Cegah spesifikasi mengarah.'
    },
    kak: {
      id: 'kak',
      label: 'KAK / Spesifikasi',
      icon: '🧩',
      note: 'Susun kebutuhan teknis secara jelas dan adil.'
    },
    hps: {
      id: 'hps',
      label: 'HPS / Referensi Harga',
      icon: '💰',
      note: 'Susun harga perkiraan dengan dasar wajar.'
    },
    cekPdn: {
      id: 'cek-pdn',
      label: 'Cek PDN / TKDN',
      icon: '🇮🇩',
      note: 'Perhatikan produk dalam negeri dan TKDN/BMP.'
    },
    cekUmkk: {
      id: 'cek-umkk',
      label: 'Cek UMK/Koperasi',
      icon: '🏪',
      note: 'Perhatikan afirmasi usaha mikro, kecil, dan koperasi.'
    },
    cekKatalog: {
      id: 'cek-katalog',
      label: 'Cek e-Katalog',
      icon: '🔎',
      note: 'Pastikan barang/jasa tersedia dan sesuai.'
    },
    katalogTidakSesuai: {
      id: 'katalog-tidak-sesuai',
      label: 'Katalog Tidak Sesuai',
      icon: '🛑',
      note: 'Produk/penyedia tidak tersedia atau tidak sesuai kebutuhan.'
    },
    dokumentasiGagalKatalog: {
      id: 'dokumentasi-gagal-katalog',
      label: 'Dokumentasi Hasil Cek',
      icon: '📝',
      note: 'Catat bukti hasil pengecekan katalog sebelum ganti metode.'
    },
    evaluasiMetode: {
      id: 'evaluasi-metode',
      label: 'Evaluasi Metode',
      icon: '🧭',
      note: 'Evaluasi metode awal bila kondisi pasar tidak sesuai rencana.'
    },
    pilihMetode: {
      id: 'pilih-metode',
      label: 'Pilih Metode',
      icon: '⚙️',
      note: 'Tentukan metode berdasarkan nilai, jenis, dan kondisi paket.'
    },
    metodePl: {
      id: 'metode-pl',
      label: 'Pengadaan Langsung',
      icon: '🛠️',
      note: 'Digunakan bila nilai dan kondisi paket sesuai.'
    },
    metodeEpurchasing: {
      id: 'metode-epurchasing',
      label: 'e-Purchasing',
      icon: '🛒',
      note: 'Gunakan katalog bila tersedia dan sesuai.'
    },
    miniKompetisi: {
      id: 'mini-kompetisi',
      label: 'Mini Kompetisi',
      icon: '🏁',
      note: 'Kompetisikan penyedia katalog bila diwajibkan/tepat.'
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
      note: 'Dipilih bila memenuhi kriteria swakelola.'
    },
    timPersiapan: {
      id: 'tim-persiapan',
      label: 'Tim Persiapan',
      icon: '🧑‍💼',
      note: 'Siapkan rencana, KAK, jadwal, dan kebutuhan swakelola.'
    },
    timPelaksana: {
      id: 'tim-pelaksana',
      label: 'Tim Pelaksana',
      icon: '👷',
      note: 'Laksanakan pekerjaan swakelola.'
    },
    timPengawas: {
      id: 'tim-pengawas',
      label: 'Tim Pengawas',
      icon: '🕵️',
      note: 'Awasi mutu, waktu, dan output swakelola.'
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
      note: 'Pantau waktu, mutu, volume, dan kewajiban.'
    },
    uangMuka: {
      id: 'uang-muka',
      label: 'Uang Muka / Jaminan',
      icon: '🧾',
      note: 'Kelola uang muka, jaminan, dan syarat kontraktual.'
    },
    identifikasiPerubahan: {
      id: 'identifikasi-perubahan',
      label: 'Identifikasi Perubahan',
      icon: '🔍',
      note: 'Cek perubahan volume, waktu, spesifikasi, atau kondisi lapangan.'
    },
    kajiKontrak: {
      id: 'kaji-kontrak',
      label: 'Kaji Klausul Kontrak',
      icon: '📖',
      note: 'Pastikan perubahan memungkinkan secara kontraktual.'
    },
    justifikasiTeknis: {
      id: 'justifikasi-teknis',
      label: 'Justifikasi Teknis',
      icon: '🧾',
      note: 'Susun alasan teknis dan administrasi perubahan.'
    },
    negosiasiPerubahan: {
      id: 'negosiasi-perubahan',
      label: 'Negosiasi Perubahan',
      icon: '🤝',
      note: 'Bahas dampak harga, waktu, volume, dan mutu.'
    },
    adendumKontrak: {
      id: 'adendum-kontrak',
      label: 'Adendum Kontrak',
      icon: '✍️',
      note: 'Tuangkan perubahan kontrak secara tertulis.'
    },
    teguran: {
      id: 'teguran',
      label: 'Teguran / Evaluasi',
      icon: '📣',
      note: 'Dilakukan saat ada keterlambatan atau masalah.'
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
      note: 'Dilakukan sesuai dokumen pendukung.'
    },
    realisasi: {
      id: 'realisasi',
      label: 'Catat Realisasi',
      icon: '✅',
      note: 'Pastikan realisasi tercatat.'
    },

    kontrakAwal: {
      id: 'kontrak-awal',
      label: 'Kontrak Dulu',
      icon: '🚨',
      note: 'Jebakan: lompat proses.',
      type: 'trap'
    },
    pecahPaket: {
      id: 'pecah-paket',
      label: 'Pecah Paket',
      icon: '💣',
      note: 'Jebakan: rawan menghindari metode.',
      type: 'trap'
    },
    spekMengarah: {
      id: 'spek-mengarah',
      label: 'Spek Mengarah',
      icon: '🚫',
      note: 'Jebakan: persaingan tidak sehat.',
      type: 'trap'
    },
    abaikanKatalog: {
      id: 'abaikan-katalog',
      label: 'Abaikan Katalog',
      icon: '⚠️',
      note: 'Jebakan: tidak cek kanal tersedia.',
      type: 'trap'
    },
    lanjutEpurchasingPaksa: {
      id: 'lanjut-epurchasing-paksa',
      label: 'Paksa e-Purchasing',
      icon: '🚧',
      note: 'Jebakan: tetap memaksa katalog padahal tidak sesuai.',
      type: 'trap'
    },
    gantiMetodeTanpaBukti: {
      id: 'ganti-metode-tanpa-bukti',
      label: 'Ganti Metode Tanpa Bukti',
      icon: '⚡',
      note: 'Jebakan: perubahan metode tanpa dokumentasi hasil cek.',
      type: 'trap'
    },
    lewatiRup: {
      id: 'lewati-rup',
      label: 'Lewati RUP',
      icon: '⛔',
      note: 'Jebakan: proses tanpa cek perencanaan.',
      type: 'trap'
    },
    bastTanpaCek: {
      id: 'bast-tanpa-cek',
      label: 'BAST Tanpa Pemeriksaan',
      icon: '📦',
      note: 'Jebakan: menerima tanpa verifikasi.',
      type: 'trap'
    },
    bayarDulu: {
      id: 'bayar-dulu',
      label: 'Bayar Dulu',
      icon: '💸',
      note: 'Jebakan: pembayaran sebelum bukti memadai.',
      type: 'trap'
    },
    tundaDokumen: {
      id: 'tunda-dokumen',
      label: 'Tunda Dokumen',
      icon: '🧨',
      note: 'Jebakan: risiko administrasi meningkat.',
      type: 'trap'
    },
    metodeAsalCepat: {
      id: 'metode-asal-cepat',
      label: 'Metode Asal Cepat',
      icon: '🏃',
      note: 'Jebakan: cepat belum tentu tepat.',
      type: 'trap'
    },
    realisasiLupa: {
      id: 'realisasi-lupa',
      label: 'Lupakan Realisasi',
      icon: '🕳️',
      note: 'Jebakan: monitoring bolong.',
      type: 'trap'
    },
    adendumTanpaDasar: {
      id: 'adendum-tanpa-dasar',
      label: 'Adendum Tanpa Dasar',
      icon: '🔥',
      note: 'Jebakan: perubahan kontrak tanpa kajian/justifikasi.',
      type: 'trap'
    },
    bayarSebelumAdendum: {
      id: 'bayar-sebelum-adendum',
      label: 'Bayar Sebelum Adendum',
      icon: '💸',
      note: 'Jebakan: pembayaran sebelum perubahan kontrak tertib.',
      type: 'trap'
    },
    swakelolaTanpaTim: {
      id: 'swakelola-tanpa-tim',
      label: 'Swakelola Tanpa Tim',
      icon: '🙈',
      note: 'Jebakan: tim swakelola tidak dibentuk jelas.',
      type: 'trap'
    },
    abaikanPdn: {
      id: 'abaikan-pdn',
      label: 'Abaikan PDN',
      icon: '🚫',
      note: 'Jebakan: tidak memperhatikan afirmasi PDN/TKDN.',
      type: 'trap'
    }
  };

  function card(key) {
    const item = CARD_LIBRARY[key];

    if (!item) return null;

    return {
      ...item,
      type: item.type || 'action'
    };
  }

  const CHALLENGE_RAW = [
    {
      type: 'pipeline',
      title: 'Soal 1 — Susun Pipeline Dasar Pengadaan',
      caseTitle: 'Belanja ATK Kantor',
      desc: 'OPD akan melakukan belanja ATK kantor senilai Rp45 juta. Susun alur pengadaan paling aman dari awal sampai realisasi.',
      budget: 'Rp45.000.000',
      difficulty: 'Level 1 - Pemula',
      ideal: ['rup', 'kak', 'hps', 'metodePl', 'proses', 'kontrak', 'bast', 'realisasi'],
      traps: ['kontrakAwal', 'lewatiRup', 'bayarDulu'],
      explanation: 'Alur dasar dimulai dari cek RUP, penyusunan KAK/spesifikasi, HPS, penentuan metode, proses pengadaan, kontrak, BAST, lalu realisasi.'
    },
    {
      type: 'quiz',
      title: 'Soal 2 — Ruang Lingkup PBJ',
      caseTitle: 'Konsep Dasar PBJ',
      desc: 'Jawab pertanyaan berikut berdasarkan konsep dasar PBJ Pemerintah.',
      question: 'PBJ Pemerintah dimulai dari tahap apa sampai tahap apa?',
      options: [
        'Identifikasi kebutuhan sampai kontrak',
        'Perencanaan sampai pembayaran',
        'Identifikasi kebutuhan sampai serah terima hasil pekerjaan',
        'Penyusunan HPS sampai serah terima'
      ],
      answer: 2,
      hint: 'Fokus pada ruang lingkup PBJ yang paling lengkap, bukan yang berhenti di kontrak.',
      explanation: 'PBJ Pemerintah adalah proses dari identifikasi kebutuhan sampai dengan serah terima hasil pekerjaan.'
    },
    {
      type: 'tenderRush',
      title: 'Soal 3 — Tender Rush: Pilih Jalur Metode',
      caseTitle: 'Arcade Metode Pengadaan',
      desc: 'Paket akan muncul satu per satu. Masukkan paket ke jalur metode yang paling tepat sebelum waktu habis.',
      budget: 'Simulasi cepat',
      difficulty: 'Level 2 - Arcade',
      timeLimit: 10,
      packages: [
        {
          title: 'Belanja Laptop Pelayanan Publik',
          type: 'Barang',
          pagu: 350000000,
          clue: 'Barang tersedia di e-Katalog dan perlu memperhatikan PDN/TKDN.',
          correct: 'ekatalog',
          explanation: 'Laptop yang tersedia dan sesuai di e-Katalog lebih aman diarahkan ke e-Purchasing. Jangan asal masuk Pengadaan Langsung karena nilainya besar dan kanal katalog tersedia.'
        },
        {
          title: 'Belanja ATK Kegiatan Kantor',
          type: 'Barang',
          pagu: 45000000,
          clue: 'Nilai kecil, kebutuhan sederhana, dan tidak kompleks.',
          correct: 'pengadaanLangsung',
          explanation: 'Paket kecil dan sederhana dapat menggunakan Pengadaan Langsung sepanjang sesuai batas nilai, tidak dipecah, dan administrasinya tertib.'
        },
        {
          title: 'Rehabilitasi Gedung Pelayanan',
          type: 'Pekerjaan Konstruksi',
          pagu: 760000000,
          clue: 'Pekerjaan konstruksi bernilai besar dan butuh proses formal.',
          correct: 'tenderSeleksi',
          explanation: 'Pekerjaan konstruksi bernilai besar tidak tepat dipaksa menjadi Pengadaan Langsung. Gunakan Tender/Seleksi atau mekanisme yang sesuai.'
        },
        {
          title: 'Pelatihan Internal Pegawai oleh Tim OPD',
          type: 'Jasa Lainnya',
          pagu: 95000000,
          clue: 'Kegiatan dilaksanakan sendiri dengan tim persiapan, pelaksana, dan pengawas.',
          correct: 'swakelola',
          explanation: 'Jika kegiatan memenuhi kriteria dan dilaksanakan sendiri/bersama pihak yang sesuai, Swakelola bisa dipilih dengan tim dan pertanggungjawaban yang jelas.'
        },
        {
          title: 'Pembayaran Listrik Kantor',
          type: 'Jasa Lainnya',
          pagu: 300000000,
          clue: 'Layanan utilitas rutin/tertentu.',
          correct: 'dikecualikan',
          explanation: 'Pembayaran utilitas tertentu dapat masuk kategori dikecualikan, tetapi tetap perlu dasar, bukti, dan pencatatan yang tertib.'
        }
      ],
      explanation: 'Tender Rush melatih refleks membaca jenis paket, pagu, ketersediaan katalog, dan kondisi pelaksanaan sebelum memilih metode.'
    },
    {
      type: 'quiz',
      title: 'Soal 4 — Tujuan PBJ',
      caseTitle: 'Laptop TKDN + BMP 42%',
      desc: 'PPK membeli laptop melalui katalog elektronik dengan TKDN + BMP 42%.',
      question: 'Tujuan PBJ yang paling didukung oleh kondisi tersebut adalah?',
      options: [
        'Menghasilkan barang sesuai nilai uang',
        'Meningkatkan penggunaan produk dalam negeri',
        'Meningkatkan peran konsultan perencana',
        'Mengurangi jumlah paket pengadaan'
      ],
      answer: 1,
      hint: 'Kata kunci utama ada pada TKDN dan BMP.',
      explanation: 'TKDN/BMP menunjukkan keberpihakan pada produk dalam negeri.'
    },
    {
      type: 'pipeline',
      title: 'Soal 5 — Susun Pipeline Konsolidasi',
      caseTitle: 'Komputer Beberapa Bidang',
      desc: 'Beberapa bidang mengusulkan komputer dengan kebutuhan sejenis. Total nilai Rp650 juta.',
      budget: 'Rp650.000.000',
      difficulty: 'Level 3 - Menengah',
      ideal: ['rup', 'identifikasi', 'konsolidasi', 'kak', 'hps', 'cekKatalog', 'metodeEpurchasing', 'kontrak', 'bast', 'realisasi'],
      traps: ['pecahPaket', 'metodePl', 'metodeAsalCepat', 'kontrakAwal'],
      explanation: 'Kebutuhan sejenis perlu diidentifikasi dan dapat dikonsolidasikan agar tidak terjadi pemecahan paket yang tidak wajar.'
    },
    {
      type: 'quiz',
      title: 'Soal 6 — Pemaketan',
      caseTitle: 'Strategi Pemaketan PBJ',
      desc: 'Jawab pertanyaan tentang dasar pemaketan barang/jasa.',
      question: 'Pemaketan barang/jasa dilakukan dengan mempertimbangkan apa?',
      options: [
        'Keluaran, volume, ketersediaan, kemampuan pelaku usaha, dan anggaran',
        'Keinginan bidang, kecepatan proses, dan kemudahan administrasi',
        'Jumlah penyedia yang dikenal PPK',
        'Nilai paket agar selalu bisa pengadaan langsung'
      ],
      answer: 0,
      hint: 'Pilih jawaban yang paling objektif dan menyangkut kebutuhan + kondisi pasar.',
      explanation: 'Pemaketan perlu mempertimbangkan output, volume, ketersediaan, kemampuan pelaku usaha, dan anggaran.'
    },
    {
      type: 'pipeline',
      title: 'Soal 7 — Susun Pipeline Spek Mengarah',
      caseTitle: 'Laptop dengan Spek Terlalu Spesifik',
      desc: 'Spesifikasi awal mengarah ke merek tertentu. Susun langkah korektif sebelum proses.',
      budget: 'Rp420.000.000',
      difficulty: 'Level 4 - Menengah',
      ideal: ['rup', 'reviewSpek', 'kak', 'hps', 'cekPdn', 'cekKatalog', 'metodeEpurchasing', 'klarifikasi', 'kontrak', 'bast', 'realisasi'],
      traps: ['spekMengarah', 'kontrakAwal', 'abaikanKatalog', 'metodeAsalCepat'],
      explanation: 'Jika spesifikasi mengarah, lakukan review spek dulu agar kebutuhan teknis lebih fair sebelum lanjut HPS dan metode.'
    },
    {
      type: 'quiz',
      title: 'Soal 8 — Spesifikasi Teknis',
      caseTitle: 'Fungsi Spesifikasi',
      desc: 'Jawab pertanyaan tentang fungsi spesifikasi teknis dalam PBJ.',
      question: 'Salah satu fungsi spesifikasi teknis adalah?',
      options: [
        'Menentukan pemenang sebelum proses',
        'Memberikan informasi kebutuhan kepada pelaku usaha',
        'Mengunci merek tertentu agar barang sesuai selera',
        'Menghindari persaingan agar proses cepat'
      ],
      answer: 1,
      hint: 'Spesifikasi teknis seharusnya menjelaskan kebutuhan, bukan mengunci penyedia.',
      explanation: 'Spesifikasi teknis harus memberi informasi kebutuhan kepada pelaku usaha.'
    },
    {
      type: 'pipeline',
      title: 'Soal 9 — Susun Pipeline Jasa Konsultansi',
      caseTitle: 'Kajian Teknis Perencanaan',
      desc: 'OPD akan menyusun kajian teknis perencanaan dengan nilai Rp280 juta.',
      budget: 'Rp280.000.000',
      difficulty: 'Level 5 - Menengah',
      ideal: ['rup', 'identifikasi', 'kak', 'hps', 'seleksi', 'proses', 'kontrak', 'monitoringKontrak', 'bast', 'realisasi'],
      traps: ['metodeEpurchasing', 'metodePl', 'kontrakAwal', 'abaikanKatalog'],
      explanation: 'Jasa konsultansi menggunakan pendekatan KAK, HPS, seleksi, proses, kontrak, monitoring, BAST, dan realisasi.'
    },
    {
      type: 'quiz',
      title: 'Soal 10 — Jenis Pengadaan',
      caseTitle: 'Kajian Teknis / Studi Kelayakan',
      desc: 'Jawab pertanyaan tentang jenis pengadaan.',
      question: 'Penyusunan studi kelayakan/kajian teknis termasuk jenis pengadaan apa?',
      options: [
        'Barang',
        'Pekerjaan konstruksi',
        'Jasa lainnya',
        'Jasa konsultansi'
      ],
      answer: 3,
      hint: 'Perhatikan sifat pekerjaannya: kajian/studi berbasis keahlian.',
      explanation: 'Kajian teknis/studi kelayakan merupakan jasa profesional berbasis keahlian, sehingga termasuk jasa konsultansi.'
    },
    {
      type: 'pipeline',
      title: 'Soal 11 — Susun Pipeline Konstruksi Ringan',
      caseTitle: 'Rehabilitasi Ruang Pelayanan',
      desc: 'Pekerjaan konstruksi ringan dengan nilai Rp760 juta membutuhkan proses formal dan pemeriksaan hasil.',
      budget: 'Rp760.000.000',
      difficulty: 'Level 6 - Sulit',
      ideal: ['rup', 'identifikasi', 'kak', 'hps', 'tender', 'proses', 'kontrak', 'monitoringKontrak', 'pemeriksaan', 'bast', 'realisasi'],
      traps: ['metodePl', 'kontrakAwal', 'bastTanpaCek', 'bayarDulu'],
      explanation: 'Pekerjaan konstruksi membutuhkan dokumen teknis, HPS, pemilihan, kontrak, monitoring, pemeriksaan hasil, BAST, dan realisasi.'
    },
    {
      type: 'quiz',
      title: 'Soal 12 — Prinsip PBJ',
      caseTitle: 'Barang Tidak Sesuai',
      desc: 'Barang/pekerjaan tidak sesuai spesifikasi sehingga tidak dapat digunakan.',
      question: 'Prinsip PBJ yang tidak terpenuhi adalah?',
      options: [
        'Efisien',
        'Efektif',
        'Transparan',
        'Akuntabel'
      ],
      answer: 1,
      hint: 'Kalau hasilnya tidak sesuai kebutuhan, prinsip yang gagal adalah terkait tercapainya tujuan.',
      explanation: 'Efektif berarti barang/jasa harus sesuai kebutuhan dan tujuan.'
    },
    {
      type: 'pipeline',
      title: 'Soal 13 — Susun Pipeline Swakelola',
      caseTitle: 'Pelatihan Internal Pegawai',
      desc: 'OPD akan melaksanakan kegiatan pelatihan internal pegawai. Susun alur yang sesuai untuk skema swakelola.',
      budget: 'Rp95.000.000',
      difficulty: 'Level 7 - Menengah',
      ideal: ['rup', 'identifikasi', 'kak', 'hps', 'timPersiapan', 'timPelaksana', 'timPengawas', 'swakelola', 'bast', 'realisasi'],
      traps: ['metodeEpurchasing', 'tender', 'kontrakAwal', 'swakelolaTanpaTim'],
      explanation: 'Swakelola tetap perlu perencanaan, identifikasi kebutuhan, KAK, anggaran/HPS, tim persiapan/pelaksana/pengawas, pelaksanaan, BAST, dan realisasi.'
    },
    {
      type: 'quiz',
      title: 'Soal 14 — Swakelola',
      caseTitle: 'Kriteria Swakelola',
      desc: 'Jawab pertanyaan tentang penggunaan swakelola.',
      question: 'Ruang lingkup pedoman swakelola meliputi apa?',
      options: [
        'Perencanaan, persiapan, pelaksanaan, pengawasan, dan serah terima hasil pekerjaan',
        'Tender, seleksi, katalog, dan kontrak',
        'Perencanaan, tender, evaluasi harga, dan pembayaran',
        'KAK, HPS, sanggah, kontrak, dan pembayaran'
      ],
      answer: 0,
      hint: 'Swakelola tidak hanya pelaksanaan; ada persiapan, pengawasan, dan serah terima.',
      explanation: 'Ruang lingkup swakelola mencakup perencanaan pengadaan melalui swakelola, persiapan, pelaksanaan, pengawasan, dan serah terima hasil pekerjaan.'
    },
    {
      type: 'pipeline',
      title: 'Soal 15 — Susun Pipeline Penyedia Terlambat',
      caseTitle: 'Penyedia Terlambat Mengirim Barang',
      desc: 'Kontrak sudah berjalan, namun penyedia terlambat mengirim barang. Jangan langsung BAST atau bayar.',
      budget: 'Rp190.000.000',
      difficulty: 'Level 8 - Sulit',
      ideal: ['kontrak', 'monitoringKontrak', 'teguran', 'pemeriksaan', 'bast', 'pembayaran', 'realisasi'],
      traps: ['bastTanpaCek', 'bayarDulu', 'realisasiLupa'],
      explanation: 'Saat kontrak bermasalah, lakukan monitoring kontrak, teguran/evaluasi, pemeriksaan hasil, BAST jika sesuai, pembayaran, dan realisasi.'
    },
    {
      type: 'quiz',
      title: 'Soal 16 — Aspek Hukum Kontrak',
      caseTitle: 'Sengketa Pelaksanaan Kontrak',
      desc: 'PPK dan penyedia berselisih dalam pelaksanaan kontrak.',
      question: 'Perselisihan PPK dan penyedia dalam pelaksanaan kontrak terutama termasuk aspek hukum apa?',
      options: [
        'Hukum pidana',
        'Hukum perdata',
        'Hukum persaingan usaha',
        'Hukum tata negara'
      ],
      answer: 1,
      hint: 'Perhatikan hubungan antara PPK dan penyedia dalam kontrak.',
      explanation: 'Hubungan PPK dan penyedia dalam pelaksanaan kontrak pada dasarnya adalah hubungan perdata.'
    },
    {
      type: 'pipeline',
      title: 'Soal 17 — Susun Pipeline Ganti Metode dari e-Purchasing',
      caseTitle: 'e-Purchasing Tidak Bisa Dilanjutkan',
      desc: 'Paket awalnya direncanakan e-Purchasing, tetapi setelah dicek tidak ada produk/penyedia yang sesuai di katalog. Susun langkah paling aman sebelum mengganti metode.',
      budget: 'Rp480.000.000',
      difficulty: 'Level 9 - Sulit',
      ideal: [
        'rup',
        'kak',
        'hps',
        'cekPdn',
        'cekKatalog',
        'katalogTidakSesuai',
        'dokumentasiGagalKatalog',
        'evaluasiMetode',
        'pilihMetode',
        'proses',
        'kontrak',
        'bast',
        'realisasi'
      ],
      traps: [
        'lanjutEpurchasingPaksa',
        'gantiMetodeTanpaBukti',
        'kontrakAwal',
        'metodeAsalCepat'
      ],
      explanation: 'Jika rencana awal e-Purchasing tidak bisa dilakukan karena tidak ada produk/penyedia sesuai di katalog, PPK perlu mendokumentasikan hasil pengecekan, mengevaluasi metode, lalu memilih metode lain yang sesuai nilai, jenis, dan kondisi paket.'
    },
    {
      type: 'quiz',
      title: 'Soal 18 — Perubahan Metode dari e-Purchasing',
      caseTitle: 'Tidak Ada Penyedia di Katalog',
      desc: 'Rencana awal paket adalah e-Purchasing, namun hasil cek katalog menunjukkan produk/penyedia tidak sesuai kebutuhan.',
      question: 'Langkah paling aman sebelum mengganti metode dari e-Purchasing adalah?',
      options: [
        'Langsung tunjuk penyedia yang dikenal agar cepat',
        'Tetap memaksa e-Purchasing walaupun produk tidak sesuai',
        'Dokumentasikan hasil cek katalog, evaluasi metode, lalu pilih metode yang sesuai',
        'Pecah paket agar bisa memakai metode yang lebih sederhana'
      ],
      answer: 2,
      hint: 'Jangan lompat ganti metode. Harus ada dasar dan dokumentasinya dulu.',
      explanation: 'Perubahan metode harus didasarkan pada hasil cek dan dokumentasi yang jelas. Setelah itu baru dilakukan evaluasi dan pemilihan metode yang sesuai.'
    },
    {
      type: 'pipeline',
      title: 'Soal 19 — Susun Pipeline Adendum Kontrak',
      caseTitle: 'Perubahan Volume dan Waktu Pelaksanaan',
      desc: 'Kontrak sedang berjalan. Terdapat kebutuhan perubahan volume dan penyesuaian waktu pelaksanaan. Susun alur adendum kontrak yang tertib.',
      budget: 'Nilai kontrak berjalan',
      difficulty: 'Level 10 - Expert',
      ideal: [
        'kontrak',
        'monitoringKontrak',
        'identifikasiPerubahan',
        'kajiKontrak',
        'justifikasiTeknis',
        'negosiasiPerubahan',
        'adendumKontrak',
        'pemeriksaan',
        'bast',
        'pembayaran',
        'realisasi'
      ],
      traps: [
        'adendumTanpaDasar',
        'bayarSebelumAdendum',
        'bastTanpaCek',
        'realisasiLupa'
      ],
      explanation: 'Adendum kontrak harus didahului identifikasi perubahan, kajian klausul kontrak, justifikasi teknis/administratif, dan negosiasi dampak perubahan. Setelah adendum tertib, pelaksanaan dapat dilanjutkan sampai pemeriksaan, BAST, pembayaran, dan realisasi.'
    },
    {
      type: 'quiz',
      title: 'Soal 20 — Adendum Kontrak',
      caseTitle: 'Perubahan Kontrak Berjalan',
      desc: 'Dalam pelaksanaan kontrak ditemukan kebutuhan perubahan volume dan waktu.',
      question: 'Apa yang paling tepat dilakukan sebelum membuat adendum kontrak?',
      options: [
        'Membayar dulu agar penyedia tetap bekerja',
        'Membuat justifikasi dan memastikan perubahan sesuai ketentuan/klausul kontrak',
        'Langsung BAST agar pekerjaan cepat selesai',
        'Membiarkan perubahan terjadi tanpa dokumen'
      ],
      answer: 1,
      hint: 'Adendum butuh dasar, bukan sekadar kesepakatan lisan.',
      explanation: 'Adendum kontrak membutuhkan dasar yang jelas, termasuk kajian kontrak dan justifikasi perubahan. Perubahan tidak boleh berjalan tanpa dasar dan dokumen yang tertib.'
    },
    {
      type: 'pipeline',
      title: 'Soal 21 — Katalog Konstruksi dengan Mini Kompetisi',
      caseTitle: 'Produk Konstruksi di Katalog Elektronik',
      desc: 'OPD akan membeli produk sektor konstruksi melalui katalog elektronik. Susun alur yang lebih aman dengan memperhatikan kewajiban mini kompetisi.',
      budget: 'Rp1.200.000.000',
      difficulty: 'Level 11 - Expert',
      ideal: [
        'rup',
        'identifikasi',
        'kak',
        'hps',
        'cekPdn',
        'cekKatalog',
        'miniKompetisi',
        'klarifikasi',
        'kontrak',
        'monitoringKontrak',
        'pemeriksaan',
        'bast',
        'realisasi'
      ],
      traps: [
        'abaikanKatalog',
        'kontrakAwal',
        'metodeAsalCepat',
        'bayarDulu'
      ],
      explanation: 'Untuk produk sektor konstruksi di katalog, perlu memperhatikan tata kelola katalog, persaingan sehat, mini kompetisi bila diwajibkan, kontrak, monitoring, pemeriksaan, BAST, dan realisasi.'
    },
    {
      type: 'quiz',
      title: 'Soal 22 — Afirmasi Belanja',
      caseTitle: 'Belanja Melalui Katalog',
      desc: 'Dalam belanja katalog, pemerintah mendorong afirmasi tertentu.',
      question: 'Afirmasi belanja melalui e-Purchasing terutama diarahkan untuk mendukung apa?',
      options: [
        'Produk dalam negeri serta usaha mikro, kecil, dan koperasi',
        'Penyedia yang paling dekat dengan kantor',
        'Barang impor karena lebih cepat',
        'Pemilihan penyedia tanpa kompetisi'
      ],
      answer: 0,
      hint: 'Ingat kata kunci PDN, UMK, dan koperasi.',
      explanation: 'Afirmasi belanja melalui e-Purchasing diarahkan untuk mendukung produk dalam negeri serta usaha mikro, kecil, dan koperasi.'
    }
  ];


  function getTenderRushTimeLimitByLevel(levelNo) {
    if (levelNo <= 3) return 10;
    if (levelNo <= 6) return 8;
    if (levelNo <= 9) return 7;
    if (levelNo <= 12) return 6;
    return 5;
  }

  function getTenderRushFailLimitByLevel(levelNo) {
    if (levelNo <= 3) return 5;
    if (levelNo <= 6) return 3;
    if (levelNo <= 9) return 2;
    return 1;
  }

  function getCurrentLevelNumber() {
    return Math.max(1, Number(GAME_STATE.index || 0) + 1);
  }


  function stripOldQuestionPrefix(title) {
    return String(title || '')
      .replace(/^\s*(Soal|Level)\s*\d+\s*[—-]\s*/i, '')
      .trim();
  }

  function getRenderedChallengeTitle(challenge) {
    const levelNo = getCurrentLevelNumber();

    if (!challenge) return `Level ${levelNo}`;

    if (challenge.type === 'bonusRun') {
      return `Level ${levelNo} — ${challenge.bonusMode === 'plane' ? 'PANJI Sky Shooter' : 'PANJI Power Run'}`;
    }

    const cleanTitle = stripOldQuestionPrefix(challenge.title || challenge.caseTitle || 'Challenge');
    return `Level ${levelNo} — ${cleanTitle}`;
  }

  function cloneTenderRushChallenge(template, levelNo, variantIndex) {
    const variants = [
      {
        title: `Level ${levelNo} — Tender Rush: Pilih Jalur Metode`,
        caseTitle: 'Arcade Metode Pengadaan',
        difficulty: `Level ${levelNo} - Arcade`,
        packages: template.packages
      },
      {
        title: `Level ${levelNo} — Tender Rush: Paket Makin Cepat`,
        caseTitle: 'Arcade Pagu dan Metode',
        difficulty: `Level ${levelNo} - Arcade+`,
        packages: [
          { title: 'Belanja Kendaraan Operasional Katalog', type: 'Barang', pagu: 650000000, clue: 'Barang pabrikan dan tersedia di katalog elektronik.', correct: 'ekatalog', explanation: 'Jika kendaraan tersedia dan sesuai di katalog, e-Purchasing lebih tepat daripada memaksa metode manual.' },
          { title: 'Konsumsi Rapat Koordinasi Kecil', type: 'Jasa Lainnya', pagu: 12000000, clue: 'Nilai kecil, sederhana, dan tidak kompleks.', correct: 'pengadaanLangsung', explanation: 'Konsumsi bernilai kecil dapat menggunakan Pengadaan Langsung sepanjang sesuai batas nilai dan administrasi tertib.' },
          { title: 'Jasa Konsultan DED Gedung', type: 'Jasa Konsultansi', pagu: 420000000, clue: 'Membutuhkan keahlian profesional dan evaluasi teknis.', correct: 'tenderSeleksi', explanation: 'Jasa konsultansi dengan nilai dan kompleksitas tertentu lebih tepat melalui Seleksi, bukan Pengadaan Langsung.' },
          { title: 'Pelatihan Internal oleh Tim OPD', type: 'Jasa Lainnya', pagu: 90000000, clue: 'Dikerjakan sendiri dengan tim pelaksana dan pengawas.', correct: 'swakelola', explanation: 'Kegiatan yang dilaksanakan sendiri dapat menggunakan Swakelola jika tim, rencana, dan pertanggungjawabannya jelas.' },
          { title: 'Pembayaran Air dan Listrik Kantor', type: 'Jasa Lainnya', pagu: 240000000, clue: 'Layanan utilitas rutin/tertentu.', correct: 'dikecualikan', explanation: 'Utilitas tertentu dapat dikecualikan sesuai dasar ketentuan, tetapi tetap wajib tertib bukti dan pencatatan.' }
        ]
      },
      {
        title: `Level ${levelNo} — Tender Rush: Risiko Akhir Tahun`,
        caseTitle: 'Arcade Risiko Metode',
        difficulty: `Level ${levelNo} - Sulit`,
        packages: [
          { title: 'Laptop Pelayanan Publik TKDN Tersedia', type: 'Barang', pagu: 480000000, clue: 'Ada produk katalog dan perlu afirmasi PDN/TKDN.', correct: 'ekatalog', explanation: 'Katalog yang tersedia dan sesuai mendukung e-Purchasing serta afirmasi PDN/TKDN.' },
          { title: 'Souvenir Kegiatan Sosialisasi', type: 'Barang', pagu: 35000000, clue: 'Nilai kecil, sederhana, tidak dipecah dari kebutuhan besar.', correct: 'pengadaanLangsung', explanation: 'Nilai kecil dan sederhana dapat masuk Pengadaan Langsung jika tidak digunakan untuk memecah paket.' },
          { title: 'Pemeliharaan Jalan Lingkungan', type: 'Pekerjaan Konstruksi', pagu: 900000000, clue: 'Konstruksi nilai besar, perlu proses formal.', correct: 'tenderSeleksi', explanation: 'Konstruksi bernilai besar tidak cocok dipaksa ke Pengadaan Langsung. Jalur formal lebih aman.' },
          { title: 'Kajian Data oleh Perguruan Tinggi Negeri', type: 'Jasa Konsultansi', pagu: 250000000, clue: 'Dilaksanakan bersama instansi/perguruan tinggi.', correct: 'swakelola', explanation: 'Kolaborasi dengan instansi/perguruan tinggi dapat masuk Swakelola jika memenuhi ketentuan dan struktur tim jelas.' },
          { title: 'Layanan Pos/Pengiriman Dokumen Resmi', type: 'Jasa Lainnya', pagu: 70000000, clue: 'Layanan tertentu yang memiliki karakter khusus.', correct: 'dikecualikan', explanation: 'Layanan tertentu bisa dikecualikan, namun dasar dan pencatatan tetap wajib rapi.' }
        ]
      }
    ];

    const selected = variants[variantIndex % variants.length];

    return {
      ...template,
      ...selected,
      type: 'tenderRush',
      desc: 'Paket akan muncul satu per satu. Masukkan paket ke jalur metode yang paling tepat sebelum waktu habis. Batas salah makin ketat di level tinggi.',
      budget: 'Simulasi cepat',
      timeLimit: getTenderRushTimeLimitByLevel(levelNo),
      explanation: 'Tender Rush melatih refleks membaca jenis paket, pagu, ketersediaan katalog, dan kondisi pelaksanaan sebelum memilih metode.'
    };
  }

  function expandChallengeFlow(rawList) {
    const rushTemplate = rawList.find(item => item.type === 'tenderRush');
    const baseList = rawList.filter(item => item.type !== 'tenderRush');
    const rushLevels = new Set([3, 6, 9, 12, 15]);
    const expanded = [];
    let baseIndex = 0;
    let rushIndex = 0;
    let levelNo = 1;

    while (baseIndex < baseList.length || (rushTemplate && rushLevels.has(levelNo))) {
      if (rushTemplate && rushLevels.has(levelNo)) {
        expanded.push(cloneTenderRushChallenge(rushTemplate, levelNo, rushIndex));
        rushIndex += 1;
      } else if (baseIndex < baseList.length) {
        expanded.push(baseList[baseIndex]);
        baseIndex += 1;
      }

      levelNo += 1;

      if (levelNo > baseList.length + rushLevels.size + 8) break;
    }

    return expanded;
  }

  function buildChallenge(raw) {
    if (raw.type === 'quiz' || raw.type === 'tenderRush' || raw.type === 'bonusRun') {
      return raw;
    }

    const idealCards = raw.ideal.map(key => card(key)).filter(Boolean);
    const trapCards = (raw.traps || []).map(key => card(key)).filter(Boolean);

    return {
      ...raw,
      idealIds: idealCards.map(item => item.id),
      cards: [...idealCards, ...trapCards]
    };
  }

  const CHALLENGES = expandChallengeFlow(CHALLENGE_RAW).map(buildChallenge);
  // Total 20 level: Level 4 = platformer ringan, Level 8 = shooter pesawat jadul.
  CHALLENGES.splice(3, 0, buildChallenge(BONUS_RUN_CHALLENGE));
  CHALLENGES.splice(7, 0, buildChallenge(BONUS_PLANE_CHALLENGE));
  CHALLENGES.length = 20;

  const TENDER_RUSH_METHODS = {
    ekatalog: {
      key: '1',
      label: 'e-Katalog',
      short: 'Katalog',
      icon: '🛒',
      hint: 'Tekan 1 untuk barang/jasa yang tersedia dan sesuai di katalog elektronik.'
    },
    pengadaanLangsung: {
      key: '2',
      label: 'Pengadaan Langsung',
      short: 'PL',
      icon: '🛠️',
      hint: 'Tekan 2 untuk paket kecil/sederhana yang memenuhi batas nilai dan tidak dipecah.'
    },
    tenderSeleksi: {
      key: '3',
      label: 'Tender/Seleksi',
      short: 'Tender',
      icon: '🏗️',
      hint: 'Tekan 3 untuk paket besar/kompleks atau jasa konsultansi yang perlu proses formal.'
    },
    swakelola: {
      key: '4',
      label: 'Swakelola',
      short: 'Swakelola',
      icon: '🤲',
      hint: 'Tekan 4 untuk pekerjaan yang dilaksanakan sendiri/bersama sesuai kriteria swakelola.'
    },
    dikecualikan: {
      key: '5',
      label: 'Dikecualikan',
      short: 'Dikecualikan',
      icon: '⚖️',
      hint: 'Tekan 5 untuk pengadaan yang punya dasar pengecualian, tetap tertib dan tercatat.'
    }
  };

  function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  const GAME_STATE = {
    order: [],
    index: 0,
    current: null,
    stage: 'ready',
    placed: [],
    shuffledCards: [],
    selectedCardId: null,
    answered: false,
    selectedAnswer: null,
    score: 0,
    risk: 0,
    wrong: 0,
    correct: 0,
    progress: 0,
    logs: [],
    finished: false,
    hintUsed: false,
    hasSeenIntro: false,
    runId: '',
    gameStartedAt: 0,
    scoreSubmitted: false,
    tenderRush: null,
    bonusRun: null,
    levelTimeLeft: 0,
    levelTimeLimit: 0,
    stoppedReason: '',
    stoppedLevel: 0
  };

  const PLAYER_STATE = {
    nama: '',
    instansi: '',
    leaderboard: [],
    loadingLeaderboard: false,
    savingScore: false,
    lastSaveMessage: ''
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function readStoredPlayer() {
    try {
      const saved = JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY) || '{}');
      PLAYER_STATE.nama = String(saved.nama || '').trim();
      PLAYER_STATE.instansi = String(saved.instansi || '').trim();
    } catch (error) {
      PLAYER_STATE.nama = '';
      PLAYER_STATE.instansi = '';
    }
  }

  function hasPlayerProfile() {
    return Boolean(String(PLAYER_STATE.nama || '').trim() && String(PLAYER_STATE.instansi || '').trim());
  }

  function savePlayerProfile(nama, instansi) {
    PLAYER_STATE.nama = String(nama || '').trim();
    PLAYER_STATE.instansi = String(instansi || '').trim();

    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify({
      nama: PLAYER_STATE.nama,
      instansi: PLAYER_STATE.instansi,
      updatedAt: new Date().toISOString()
    }));
  }

  function getCurrentResultSummary() {
    const maxScore = calculateMaxScore();
    const percent = maxScore > 0 ? Math.round((GAME_STATE.score / maxScore) * 100) : 0;
    const totalSoal = CHALLENGES.length;
    const benar = Math.max(0, Math.min(totalSoal, Number(GAME_STATE.correct || 0)));
    const salah = Math.max(0, Number(GAME_STATE.wrong || 0));
    const durasiDetik = GAME_STATE.gameStartedAt
      ? Math.max(0, Math.round((Date.now() - GAME_STATE.gameStartedAt) / 1000))
      : 0;

    const levelDicapai = GAME_STATE.stoppedLevel || Math.min(CHALLENGES.length, GAME_STATE.index + 1);
    const levelSelesai = GAME_STATE.stoppedReason ? Math.max(0, levelDicapai - 1) : (GAME_STATE.finished ? CHALLENGES.length : Math.max(0, levelDicapai - 1));

    return {
      maxScore,
      percent,
      totalSoal,
      benar,
      salah,
      durasiDetik,
      skor: GAME_STATE.score,
      risiko: GAME_STATE.risk,
      levelDicapai,
      levelSelesai
    };
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Number(seconds || 0));
    const minutes = Math.floor(total / 60);
    const rest = total % 60;

    if (minutes <= 0) return `${rest} detik`;
    return `${minutes} menit ${String(rest).padStart(2, '0')} detik`;
  }

  async function fetchLeaderboard() {
    if (!LEADERBOARD_API_URL) return [];

    PLAYER_STATE.loadingLeaderboard = true;
    renderLeaderboardModalContent();

    try {
      const response = await fetch(`${LEADERBOARD_API_URL}?action=leaderboard&v=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store'
      });

      const json = await response.json();
      const rows = Array.isArray(json) ? json : Array.isArray(json.leaderboard) ? json.leaderboard : [];
      PLAYER_STATE.leaderboard = sortLeaderboardRows(rows);
      return PLAYER_STATE.leaderboard;
    } catch (error) {
      PLAYER_STATE.lastSaveMessage = `Leaderboard belum bisa dimuat: ${error.message || error}`;
      return [];
    } finally {
      PLAYER_STATE.loadingLeaderboard = false;
      renderLeaderboardModalContent();
    }
  }

  async function submitFinalScoreToLeaderboard() {
    if (GAME_STATE.scoreSubmitted || PLAYER_STATE.savingScore) return;

    if (!hasPlayerProfile()) {
      PLAYER_STATE.lastSaveMessage = 'Isi nama dan instansi dulu agar skor bisa masuk leaderboard.';
      openLeaderboardModal('player', true);
      return;
    }

    PLAYER_STATE.savingScore = true;
    PLAYER_STATE.lastSaveMessage = 'Menyimpan skor ke leaderboard...';
    renderLeaderboardModalContent();

    const result = getCurrentResultSummary();
    const payload = {
      nama: PLAYER_STATE.nama,
      instansi: PLAYER_STATE.instansi,
      skor: result.skor,
      benar: result.benar,
      salah: result.salah,
      risiko: result.risiko,
      total_soal: result.totalSoal,
      level_dicapai: result.levelDicapai,
      level_selesai: result.levelSelesai,
      durasi_detik: result.durasiDetik
    };

    try {
      const response = await fetch(LEADERBOARD_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();

      if (!json.ok) {
        throw new Error(json.message || 'Skor gagal disimpan.');
      }

      GAME_STATE.scoreSubmitted = true;
      PLAYER_STATE.lastSaveMessage = 'Skor berhasil disimpan ke leaderboard.';
      PLAYER_STATE.leaderboard = Array.isArray(json.leaderboard) ? json.leaderboard : PLAYER_STATE.leaderboard;

      if (!PLAYER_STATE.leaderboard.length) {
        await fetchLeaderboard();
      }
    } catch (error) {
      PLAYER_STATE.lastSaveMessage = `Skor belum tersimpan: ${error.message || error}`;
    } finally {
      PLAYER_STATE.savingScore = false;
      renderLeaderboardModalContent();
    }
  }

  function ensureLeaderboardModal() {
    if (leaderboardModalEl && document.body.contains(leaderboardModalEl)) return leaderboardModalEl;

    leaderboardModalEl = document.createElement('div');
    leaderboardModalEl.id = 'procstackLeaderboardModal';
    leaderboardModalEl.className = 'ps-leaderboard-modal ps-hidden';
    leaderboardModalEl.innerHTML = `
      <div class="ps-leaderboard-backdrop" data-leaderboard-close></div>
      <div class="ps-leaderboard-panel">
        <button type="button" class="ps-leaderboard-close" data-leaderboard-close aria-label="Tutup">×</button>
        <div class="ps-leaderboard-content" id="psLeaderboardContent"></div>
      </div>
    `;

    document.body.appendChild(leaderboardModalEl);

    leaderboardModalEl.querySelectorAll('[data-leaderboard-close]').forEach(button => {
      button.addEventListener('click', () => {
        closeLeaderboardModal();
      });
    });

    return leaderboardModalEl;
  }

  function attachPanjiToLeaderboardModal() {
    if (!leaderboardModalEl) return;

    const panel = leaderboardModalEl.querySelector('.ps-leaderboard-panel');
    const panji = document.querySelector('.panji-assistant');

    if (!panel || !panji) return;

    const rect = panel.getBoundingClientRect();

    const right = Math.max(10, window.innerWidth - rect.right - 8);
    const bottom = Math.max(10, window.innerHeight - rect.bottom + 10);

    panji.classList.add('panji-leaderboard-mode');
    panji.style.setProperty('--panji-lb-right', `${right}px`);
    panji.style.setProperty('--panji-lb-bottom', `${bottom}px`);
  }

  function detachPanjiFromLeaderboardModal() {
    const panji = document.querySelector('.panji-assistant');

    if (!panji) return;

    panji.classList.remove('panji-leaderboard-mode');
    panji.style.removeProperty('--panji-lb-right');
    panji.style.removeProperty('--panji-lb-bottom');
  }

  function openLeaderboardModal(tab = 'player', force = false) {
    ensureLeaderboardModal();
    leaderboardModalEl.dataset.activeTab = tab;
    leaderboardModalEl.dataset.force = force ? 'true' : 'false';
    leaderboardModalEl.classList.remove('ps-hidden');
    renderLeaderboardModalContent();

    if (panjiEl) {
      panjiEl.classList.toggle('panji-result-mode', GAME_STATE.stage === 'result' || GAME_STATE.finished);
    }

    setTimeout(() => {
      attachPanjiToLeaderboardModal();

      if (typeof showPanji === 'function') {
        if (GAME_STATE.stage === 'result' || GAME_STATE.finished) {
          const reaction = getPanjiFinalReaction();
          panjiUserMinimized = false;

          if (panjiEl) {
            panjiEl.classList.remove('panji-hidden', 'panji-minimized');
          }

          showPanji(reaction.text, reaction.mood);

          if (panjiEl) {
            panjiEl.classList.remove('panji-celebrate', 'panji-cry');
            void panjiEl.offsetWidth;
            panjiEl.classList.add(reaction.anim);
          }
        } else {
          showPanji(
            'Halo! PANJI di sini. Isi dulu nama dan instansi kamu ya. Setelah selesai main, skor otomatis masuk leaderboard.',
            'happy'
          );
        }

        setTimeout(attachPanjiToLeaderboardModal, 80);
        setTimeout(attachPanjiToLeaderboardModal, 250);
        setTimeout(attachPanjiToLeaderboardModal, 600);
      }
    }, 120);

    if (tab === 'leaderboard' || !PLAYER_STATE.leaderboard.length) {
      fetchLeaderboard();
    }
  }

  function closeLeaderboardModal() {
    if (!leaderboardModalEl) return;
    leaderboardModalEl.classList.add('ps-hidden');
    if (panjiEl) panjiEl.classList.remove('panji-result-mode');
    detachPanjiFromLeaderboardModal();
  }

  function getLeaderboardPanjiMood(result) {
    const score = Number(result && result.percent || 0);
    const risk = Number(result && result.risiko || 0);

    if (score >= 75 && risk <= 45) return 'happy';
    if (score < 55 || risk >= 80) return 'sad';
    return 'thinking';
  }

  function getLeaderboardPanjiNarrative(result) {
    const mood = getLeaderboardPanjiMood(result);
    const levelText = 'Level ' + result.levelDicapai + '/' + result.totalSoal;

    if (mood === 'happy') {
      return 'Mantap! Kamu mencapai ' + levelText + ' dengan skor ' + result.skor + '. Alur PBJ kamu sudah makin rapi. Kalau mau kejar ranking lebih tinggi, klik tombol “Main Lagi dari Soal 1” dan coba kurangi kesalahan.';
    }

    if (mood === 'sad') {
      return 'Yah, hasilnya masih perlu latihan. Kamu mencapai ' + levelText + ' dengan skor ' + result.skor + '. Coba ulangi lagi dari tombol “Main Lagi dari Soal 1”, baca kasus lebih pelan, dan jangan buru-buru pilih metode.';
    }

    return 'Lumayan! Kamu mencapai ' + levelText + ' dengan skor ' + result.skor + '. Masih ada ruang perbaikan. Klik “Main Lagi dari Soal 1” kalau mau coba naik leaderboard.';
  }

  function renderLeaderboardModalContent() {
    if (!leaderboardModalEl || leaderboardModalEl.classList.contains('ps-hidden')) return;

    const content = leaderboardModalEl.querySelector('#psLeaderboardContent');
    if (!content) return;

    const activeTab = leaderboardModalEl.dataset.activeTab || 'player';
    const result = getCurrentResultSummary();
    const isResult = GAME_STATE.stage === 'result' || GAME_STATE.finished;

    content.innerHTML = `
      <div class="ps-lb-hero">
        <div>
          <div class="ps-lb-kicker">Procurement Mini Game</div>
          <h3>${isResult ? 'Nilai Akhir & Leaderboard' : 'Masuk Pemain'}</h3>
          <p>${isResult ? 'Skor selesai main otomatis dikirim ke Google Sheet dan ditampilkan di leaderboard.' : 'Isi nama dan instansi dulu. Setelah selesai main, skor otomatis masuk leaderboard.'}</p>
        </div>
        ${isResult ? `<div class="ps-lb-score"><span>Nilai</span><b>${result.percent}%</b></div>` : ''}
      </div>

      <div class="ps-lb-tabs">
        <button type="button" class="${activeTab === 'player' ? 'active' : ''}" data-lb-tab="player">Masuk Pemain</button>
        <button type="button" class="${activeTab === 'leaderboard' ? 'active' : ''}" data-lb-tab="leaderboard">Leaderboard</button>
      </div>

      ${isResult ? `
        <div class="ps-lb-summary">
          <div><span>Pemain</span><b>${escapeHtml(PLAYER_STATE.nama || '-')}</b></div>
          <div><span>Instansi</span><b>${escapeHtml(PLAYER_STATE.instansi || '-')}</b></div>
          <div><span>Skor</span><b>${result.skor}/${result.maxScore}</b></div>
          <div><span>Benar</span><b>${result.benar}/${result.totalSoal}</b></div>
          <div><span>Salah</span><b>${result.salah}</b></div>
          <div><span>Risiko</span><b>${result.risiko}</b></div>
          <div><span>Level Dicapai</span><b>${result.levelDicapai}/${result.totalSoal}</b></div>
          <div><span>Durasi</span><b>${formatDuration(result.durasiDetik)}</b></div>
        </div>
      ` : ''}

      <div class="ps-lb-message ${PLAYER_STATE.lastSaveMessage ? '' : 'empty'}">
        ${escapeHtml(PLAYER_STATE.lastSaveMessage || 'Data pemain disimpan di browser ini dan skor akhir disimpan ke Google Sheet.')}
      </div>

      ${activeTab === 'player' ? renderPlayerTab() : renderLeaderboardTab()}
    `;

    content.querySelectorAll('[data-lb-tab]').forEach(button => {
      button.addEventListener('click', () => {
        leaderboardModalEl.dataset.activeTab = button.dataset.lbTab;
        renderLeaderboardModalContent();

        if (button.dataset.lbTab === 'leaderboard') {
          fetchLeaderboard();
        }
      });
    });

    const form = content.querySelector('#psPlayerForm');
    if (form) {
      form.addEventListener('submit', event => {
        event.preventDefault();
        const nama = form.querySelector('[name="nama"]')?.value || '';
        const instansi = form.querySelector('[name="instansi"]')?.value || '';

        if (!String(nama).trim() || !String(instansi).trim()) {
          PLAYER_STATE.lastSaveMessage = 'Nama dan instansi wajib diisi.';
          renderLeaderboardModalContent();
          return;
        }

        savePlayerProfile(nama, instansi);
        PLAYER_STATE.lastSaveMessage = 'Data pemain tersimpan. Silakan lanjut main.';

        if (GAME_STATE.stage === 'result' || GAME_STATE.finished) {
          leaderboardModalEl.dataset.activeTab = 'leaderboard';
          submitFinalScoreToLeaderboard();
        } else {
          closeLeaderboardModal();

          if (!GAME_STATE.current || GAME_STATE.stage === 'ready') {
            showPanji('Data pemain sudah tersimpan. Sekarang PANJI mulai perkenalan dulu, lalu kita masuk ke soal pertama.', 'happy');
            setTimeout(() => {
              if (!destroyed) startGame();
            }, 650);
          } else {
            showPanjiHowToPlayAfterPlayerSaved();
          }
        }

        renderLeaderboardModalContent();
      });
    }

    const refreshBtn = content.querySelector('#psRefreshLeaderboard');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => fetchLeaderboard());
    }
  }

  function renderPlayerTab() {
    return `
      <form class="ps-player-form" id="psPlayerForm">
        <label>
          <span>Nama Pemain</span>
          <input type="text" name="nama" value="${escapeHtml(PLAYER_STATE.nama)}" placeholder="Contoh: Benni Ramadhan" autocomplete="name" required>
        </label>
        <label>
          <span>Instansi / OPD</span>
          <input type="text" name="instansi" value="${escapeHtml(PLAYER_STATE.instansi)}" placeholder="Contoh: UKPBJ Kota Bogor" required>
        </label>
        <button type="submit" class="ps-btn ps-btn-primary">Simpan & Mulai</button>
      </form>
    `;
  }

  function renderLeaderboardTab() {
    const rows = PLAYER_STATE.leaderboard || [];

    return `
      <div class="ps-lb-toolbar">
        <strong>Top Leaderboard</strong>
        <button type="button" class="ps-btn ps-btn-soft" id="psRefreshLeaderboard" ${PLAYER_STATE.loadingLeaderboard ? 'disabled' : ''}>
          ${PLAYER_STATE.loadingLeaderboard ? 'Memuat...' : 'Refresh'}
        </button>
      </div>

      <div class="ps-lb-list">
        ${rows.length ? rows.map(renderLeaderboardRow).join('') : `
          <div class="ps-lb-empty">
            ${PLAYER_STATE.loadingLeaderboard ? 'Memuat leaderboard...' : 'Belum ada skor tersimpan.'}
          </div>
        `}
      </div>
    `;
  }

  function getRowLevelValue(row) {
    return Number(row.level_dicapai || row.level || row.level_tercapai || row.levelReached || row.total_level || row.total_soal || row.benar || 0);
  }

  function sortLeaderboardRows(rows) {
    return [...(rows || [])].sort((a, b) => {
      const scoreDiff = Number(b.skor || 0) - Number(a.skor || 0);
      if (scoreDiff !== 0) return scoreDiff;
      const levelDiff = getRowLevelValue(b) - getRowLevelValue(a);
      if (levelDiff !== 0) return levelDiff;
      return Number(a.risiko || 0) - Number(b.risiko || 0);
    }).map((row, index) => ({ ...row, rank: index + 1 }));
  }

  function renderLeaderboardRow(row) {
    const rank = Number(row.rank || 0);
    const isMine = hasPlayerProfile()
      && String(row.nama || '').trim().toLowerCase() === PLAYER_STATE.nama.toLowerCase()
      && String(row.instansi || '').trim().toLowerCase() === PLAYER_STATE.instansi.toLowerCase();

    return `
      <div class="ps-lb-row ${isMine ? 'mine' : ''}">
        <div class="ps-lb-rank">${rank || '-'}</div>
        <div class="ps-lb-main">
          <b>${escapeHtml(row.nama || '-')}</b>
          <span>${escapeHtml(row.instansi || '-')}</span>
        </div>
        <div class="ps-lb-meta">
          <b>${Number(row.skor || 0).toLocaleString('id-ID')}</b>
          <span>Level ${getRowLevelValue(row) || '-'} · ${Number(row.benar || 0)}/${Number(row.total_soal || 0)} benar · Risiko ${Number(row.risiko || 0)}</span>
        </div>
      </div>
    `;
  }

  function shuffleArray(items) {
    const result = [...items];

    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }


  function prepareQuizRuntimeOptions(challenge) {
    const options = Array.isArray(challenge && challenge.options) ? challenge.options : [];
    const mapped = options.map((text, originalIndex) => ({ text, originalIndex }));
    let shuffled = shuffleArray(mapped);

    if (mapped.length > 1) {
      let guard = 0;
      while (shuffled.findIndex(item => item.originalIndex === challenge.answer) === challenge.answer && guard < 10) {
        shuffled = shuffleArray(mapped);
        guard += 1;
      }
    }

    challenge.runtimeOptions = shuffled;
    challenge.runtimeAnswer = shuffled.findIndex(item => item.originalIndex === challenge.answer);

    if (challenge.runtimeAnswer < 0) {
      challenge.runtimeOptions = mapped;
      challenge.runtimeAnswer = Number(challenge.answer || 0);
    }
  }

  function resetPanjiVisualState() {
    if (!panjiEl) return;

    panjiEl.classList.remove(
      'panji-happy',
      'panji-sad',
      'panji-thinking',
      'panji-intro',
      'panji-talking',
      'panji-celebrate',
      'panji-cry',
      'panji-result-mode'
    );

    panjiEl.classList.add('panji-thinking');

    if (panjiEmoteEl) {
      panjiEmoteEl.textContent = '🤔';
    }
  }

  function setPanjiMoodOnly(mood = 'thinking') {
    if (!panjiEl) return;

    panjiEl.classList.remove(
      'panji-happy',
      'panji-sad',
      'panji-thinking',
      'panji-talking',
      'panji-celebrate',
      'panji-cry'
    );

    panjiEl.classList.add(`panji-${mood}`);

    if (panjiEmoteEl) {
      panjiEmoteEl.textContent =
        mood === 'happy'
          ? '😄'
          : mood === 'sad'
            ? '😭'
            : '🤔';
    }
  }

  function getCurrentChallenge() {
    return GAME_STATE.current;
  }

  function getPlacedCount() {
    return GAME_STATE.placed.filter(Boolean).length;
  }


  function getActiveTenderRushPackage(challenge) {
    const rush = GAME_STATE.tenderRush;
    const list = rush && Array.isArray(rush.packages)
      ? rush.packages
      : Array.isArray(challenge && challenge.packages)
        ? challenge.packages
        : [];

    return list[(rush && Number(rush.currentIndex || 0)) || 0] || null;
  }

  function prepareTenderRushRandomPackages(challenge) {
    const allPackages = Array.isArray(challenge && challenge.packages) ? challenge.packages : [];
    if (!allPackages.length) return [];

    const count = Math.min(Number(challenge.packageCount || allPackages.length || 5), allPackages.length);
    const methodOrder = ['ekatalog', 'pengadaanLangsung', 'tenderSeleksi', 'swakelola', 'dikecualikan'];

    function scorePattern(list) {
      let score = 0;
      for (let i = 0; i < list.length; i += 1) {
        const expectedForward = methodOrder[i % methodOrder.length];
        const expectedReverse = methodOrder[(methodOrder.length - 1 - i) % methodOrder.length];
        if (list[i].correct === expectedForward) score += 2;
        if (list[i].correct === expectedReverse) score += 2;
        if (i > 0 && list[i].correct === list[i - 1].correct) score += 1;
      }
      return score;
    }

    let best = shuffleArray(allPackages).slice(0, count);
    let bestScore = scorePattern(best);

    for (let attempt = 0; attempt < 40; attempt += 1) {
      const candidate = shuffleArray(allPackages).slice(0, count);
      const candidateScore = scorePattern(candidate);
      if (candidateScore < bestScore) {
        best = candidate;
        bestScore = candidateScore;
      }
    }

    return best.map((item, index) => ({
      ...item,
      rushId: `rush-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`
    }));
  }

  function getPanjiCurrentGuideMessage() {
    const challenge = getCurrentChallenge();

    if (!challenge) {
      return 'Hi.. aku balik lagi. Isi dulu nama pemain dan instansi atau OPD kamu, lalu kita mulai latihan PBJ bareng-bareng.';
    }

    if (challenge.type === 'pipeline') {
      const nextEmpty = GAME_STATE.placed.findIndex(item => item === null);

      if (nextEmpty < 0) {
        return 'Hi.. aku balik lagi. Pipeline soal ini sudah selesai. Kamu tinggal klik lanjut untuk masuk ke soal berikutnya.';
      }

      const expectedId = challenge.idealIds?.[nextEmpty];
      const expectedCard = challenge.cards?.find(item => item.id === expectedId);

      if (expectedCard) {
        return `Hi.. aku balik lagi. Sekarang kamu ada di soal Pipeline. Fokus isi slot nomor ${nextEmpty + 1}. Cari kartu "${expectedCard.label}", lalu susun dari kiri ke kanan. Jangan pilih kartu jebakan.`;
      }

      return 'Hi.. aku balik lagi. Sekarang kamu ada di soal Pipeline. Susun tahapan PBJ dari kiri ke kanan secara tertib.';
    }

    if (challenge.type === 'quiz') {
      return `Hi.. aku balik lagi. Sekarang kamu ada di soal ABCD. Baca kasus "${challenge.caseTitle}" pelan-pelan, lalu pilih jawaban yang paling sesuai prinsip PBJ.`;
    }

    if (challenge.type === 'tenderRush') {
      const pkg = getActiveTenderRushPackage(challenge);
      if (pkg) {
        const correctMethod = TENDER_RUSH_METHODS[pkg.correct];
        return `Hi.. aku balik lagi. Ini Tender Rush. Paket aktifnya "${pkg.title}". Perhatikan petunjuknya: ${pkg.clue} Kalau butuh arahan, jalur yang paling aman adalah ${correctMethod ? correctMethod.key + ' - ' + correctMethod.label : 'metode yang sesuai kondisi paket'}.`;
      }

      return 'Hi.. aku balik lagi. Sekarang kamu ada di Tender Rush. Baca paket yang jatuh, lalu tekan 1 untuk e-Katalog, 2 untuk Pengadaan Langsung, 3 untuk Tender/Seleksi, 4 untuk Swakelola, atau 5 untuk Dikecualikan.';
    }

    return 'Hi.. aku balik lagi. Lanjutkan permainan dengan membaca kasus dan memilih langkah PBJ yang paling aman.';
  }

  function getPanjiFinalReaction() {
    const result = getCurrentResultSummary();
    const percent = result.maxScore > 0 ? Math.round((result.skor / result.maxScore) * 100) : 0;
    const levelDicapai = Math.max(1, Number(result.levelDicapai || GAME_STATE.index + 1 || 1));
    const totalLevel = CHALLENGES.length;

    if (percent >= 80 && GAME_STATE.risk <= 35) {
      return {
        mood: 'happy',
        anim: 'panji-celebrate',
        text: `Yeay! Mantap banget. Kamu mencapai level ${levelDicapai}/${totalLevel} dengan skor ${result.skor}. Alur PBJ kamu sudah rapi dan risikonya cukup terkendali. Kalau mau ngejar ranking lebih tinggi, klik tombol "Main Lagi dari Soal 1".`
      };
    }

    if (percent >= 55) {
      return {
        mood: 'thinking',
        anim: 'panji-celebrate',
        text: `Lumayan! Kamu mencapai level ${levelDicapai}/${totalLevel} dengan skor ${result.skor}. Tapi masih ada beberapa bagian yang perlu dirapikan. Coba ulangi lagi, perhatikan urutan pipeline, batas metode, dan jangan buru-buru saat Tender Rush. Klik "Main Lagi dari Soal 1" untuk coba lagi.`
      };
    }

    return {
      mood: 'sad',
      anim: 'panji-cry',
      text: `Aduh, PANJI sedih nih. Kamu baru mencapai level ${levelDicapai}/${totalLevel} dengan skor ${result.skor}. Tidak apa-apa, ini latihan. Coba main lagi dari awal, baca kasus lebih pelan, dan jangan asal pilih metode. Klik "Main Lagi dari Soal 1" ya.`
    };
  }

  function clearTenderRushTimers() {
    if (tenderRushTimer) {
      clearInterval(tenderRushTimer);
      tenderRushTimer = null;
    }

    if (tenderRushNextTimer) {
      clearTimeout(tenderRushNextTimer);
      tenderRushNextTimer = null;
    }
  }

  function enableTenderRushKeyboard() {
    disableTenderRushKeyboard();

    tenderRushKeyHandler = event => {
      const activeTag = String(document.activeElement && document.activeElement.tagName || '').toLowerCase();
      if (['input', 'textarea', 'select'].includes(activeTag)) return;

      const map = {
        1: 'ekatalog',
        2: 'pengadaanLangsung',
        3: 'tenderSeleksi',
        4: 'swakelola',
        5: 'dikecualikan'
      };

      const method = map[event.key];
      if (!method) return;

      const challenge = getCurrentChallenge();
      if (!challenge || challenge.type !== 'tenderRush') return;

      event.preventDefault();
      answerTenderRush(method);
    };

    document.addEventListener('keydown', tenderRushKeyHandler);
  }

  function disableTenderRushKeyboard() {
    if (!tenderRushKeyHandler) return;
    document.removeEventListener('keydown', tenderRushKeyHandler);
    tenderRushKeyHandler = null;
  }


  function getDefaultLevelTime(challenge) {
    if (!challenge || challenge.type === 'tenderRush' || challenge.type === 'bonusRun') return 0;

    const levelNo = getCurrentLevelNumber();
    const base = challenge.type === 'quiz'
      ? Number(challenge.timeLimit || 45)
      : Number(challenge.timeLimit || 90);

    if (levelNo <= 3) return base;

    const reduction = (levelNo - 3) * (challenge.type === 'quiz' ? 3 : 5);
    const minimum = challenge.type === 'quiz' ? 20 : 45;

    return Math.max(minimum, base - reduction);
  }

  function clearLevelTimer() {
    if (levelTimer) {
      clearInterval(levelTimer);
      levelTimer = null;
    }
  }

  function startLevelTimer(challenge) {
    clearLevelTimer();

    const limit = getDefaultLevelTime(challenge);
    GAME_STATE.levelTimeLimit = limit;
    GAME_STATE.levelTimeLeft = limit;
    levelTimerStartedAt = Date.now();

    if (!limit || GAME_STATE.stage === 'ready' || GAME_STATE.stage === 'result') {
      updateLevelTimerUi();
      return;
    }

    updateLevelTimerUi();

    levelTimer = setInterval(() => {
      if (destroyed || GAME_STATE.finished) return;

      const activeChallenge = getCurrentChallenge();
      if (!activeChallenge || activeChallenge.type === 'tenderRush') return;

      GAME_STATE.levelTimeLeft = Math.max(0, Number(GAME_STATE.levelTimeLeft || 0) - 1);
      updateLevelTimerUi();

      if (GAME_STATE.levelTimeLeft <= 0) {
        stopGameEarly('time');
      }
    }, 1000);
  }

  function updateLevelTimerUi() {
    const text = root && root.querySelector('#psLevelTimeText');
    const bar = root && root.querySelector('#psLevelTimeBar');
    const wrap = root && root.querySelector('.ps-level-time-card');
    const left = Math.max(0, Number(GAME_STATE.levelTimeLeft || 0));
    const limit = Math.max(1, Number(GAME_STATE.levelTimeLimit || 1));
    const percent = Math.max(0, Math.min(100, (left / limit) * 100));

    if (text) text.textContent = left ? `${left}s` : '-';
    if (bar) bar.style.width = percent + '%';

    if (wrap) {
      wrap.classList.toggle('danger', left > 0 && left <= 10);
      wrap.classList.toggle('warning', left > 10 && left <= 25);
    }
  }

  function applyLevelTimePenalty(seconds, reasonText = 'Kesalahan') {
    const challenge = getCurrentChallenge();

    if (!challenge || challenge.type === 'tenderRush') return;
    if (!GAME_STATE.levelTimeLimit || GAME_STATE.stage === 'result' || GAME_STATE.finished) return;

    const penalty = Math.max(1, Number(seconds || 0));
    GAME_STATE.levelTimeLeft = Math.max(0, Number(GAME_STATE.levelTimeLeft || 0) - penalty);
    addLog('bad', reasonText + ': waktu berkurang', 'Waktu level berkurang ' + penalty + ' detik karena pilihan belum tepat.');
    showToast('Waktu -' + penalty + ' detik', 'bad');
    updateLevelTimerUi();

    if (GAME_STATE.levelTimeLeft <= 0) {
      stopGameEarly('time');
    }
  }


  function applyLevelTimeBonus(seconds, reasonText = 'Bonus waktu') {
    const challenge = getCurrentChallenge();

    if (!challenge || challenge.type === 'tenderRush') return;
    if (!GAME_STATE.levelTimeLimit || GAME_STATE.stage === 'result' || GAME_STATE.finished) return;

    const bonus = Math.max(1, Number(seconds || 0));
    GAME_STATE.levelTimeLeft = Math.min(
      Number(GAME_STATE.levelTimeLimit || 0),
      Number(GAME_STATE.levelTimeLeft || 0) + bonus
    );

    addLog('ok', reasonText, 'Waktu level bertambah ' + bonus + ' detik karena jawaban/urutan benar.');
    showToast('Waktu +' + bonus + ' detik', 'ok');
    updateLevelTimerUi();
  }

  function stopGameEarly(reason = 'time') {
    if (GAME_STATE.finished || GAME_STATE.stage === 'result') return;

    clearAutoNextTimer();
    clearLevelTimer();
    clearTenderRushTimers();
    disableTenderRushKeyboard();
    clearBonusRunLoop();
    clearPanjiIntroTimers();

    GAME_STATE.finished = true;
    GAME_STATE.stage = 'result';
    GAME_STATE.stoppedReason = reason;
    GAME_STATE.stoppedLevel = GAME_STATE.index + 1;
    GAME_STATE.progress = 100;

    if (reason === 'rushFailed') {
      addLog('bad', 'Tender Rush gagal melewati batas', 'Permainan berhenti karena jumlah salah/timeout sudah melewati batas level Tender Rush ini.');
      showToast('Tender Rush gagal melewati batas. Skor akhir ditampilkan.', 'bad');
      showPanji('Tender Rush gagal melewati batas level ini. Game berhenti dulu ya. Skor akhir dan level terakhir sudah muncul. Coba ulangi dan baca petunjuk paket lebih cepat.', 'sad');
    } else {
      addLog('bad', 'Waktu level habis', `Permainan berhenti di level ${GAME_STATE.stoppedLevel}.`);
      showToast('Waktu habis. Skor akhir ditampilkan.', 'bad');
      showPanji(`Waktu level habis. Kamu berhenti di level ${GAME_STATE.stoppedLevel} dengan skor ${GAME_STATE.score}.`, 'sad');
    }

    renderGame();
    openLeaderboardModal(hasPlayerProfile() ? 'leaderboard' : 'player', true);
    submitFinalScoreToLeaderboard();
  }

  function clearAutoNextTimer() {
    if (autoNextTimer) {
      clearTimeout(autoNextTimer);
      autoNextTimer = null;
    }
  }

  function clearPanjiIntroTimers() {
    panjiIntroTimers.forEach(timer => clearTimeout(timer));
    panjiIntroTimers = [];
  }

  function clearPanjiTalkTimer() {
    if (panjiTalkTimer) {
      clearTimeout(panjiTalkTimer);
      panjiTalkTimer = null;
    }
  }

  function scheduleAutoNext(message, delay = AUTO_NEXT_DELAY_MS) {
    clearAutoNextTimer();

    if (message) {
      showToast(message, 'info');
    }

    autoNextTimer = setTimeout(() => {
      autoNextTimer = null;

      if (destroyed) return;

      nextChallenge();
    }, delay);
  }

  function calculateMaxScore() {
    return CHALLENGES.reduce((total, challenge) => {
      if (challenge.type === 'pipeline') {
        return total + (challenge.idealIds.length * 10) + 20;
      }

      if (challenge.type === 'tenderRush') {
        return total + ((challenge.packages || []).length * 10) + 20;
      }

      if (challenge.type === 'bonusRun') {
        return total + 100;
      }

      return total + 20;
    }, 0);
  }

  function getResultGrade(percent) {
    if (percent >= 90 && GAME_STATE.risk <= 20) {
      return {
        label: 'Sangat Baik',
        icon: '🏆',
        text: 'Pemahaman alur PBJ sudah kuat. Risiko rendah dan keputusan relatif aman.'
      };
    }

    if (percent >= 75) {
      return {
        label: 'Baik',
        icon: '🥇',
        text: 'Pemahaman sudah baik, tetapi masih ada beberapa risiko yang perlu dikurangi.'
      };
    }

    if (percent >= 60) {
      return {
        label: 'Cukup',
        icon: '🥈',
        text: 'Dasar sudah mulai terbentuk, namun perlu latihan ulang pada studi kasus yang salah.'
      };
    }

    return {
      label: 'Perlu Pembinaan',
      icon: '📚',
      text: 'Disarankan mengulang dari awal agar alur dan prinsip PBJ lebih kuat.'
    };
  }

  function addLog(type, title, text) {
    GAME_STATE.logs.unshift({ type, title, text });
    GAME_STATE.logs = GAME_STATE.logs.slice(0, 8);
  }

  function showToast(message, type = 'info') {
    if (!message) return;

    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'ps-toast';
      document.body.appendChild(toastEl);
    }

    toastEl.textContent = message;
    toastEl.className = `ps-toast ${type}`;

    requestAnimationFrame(() => {
      if (toastEl) {
        toastEl.classList.add('show');
      }
    });

    clearTimeout(toastEl._hideTimer);
    toastEl._hideTimer = setTimeout(() => {
      if (toastEl) {
        toastEl.classList.remove('show');
      }
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

  function popScore(target, text, type = 'info') {
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

    for (let i = 0; i < 36; i += 1) {
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

  function ensurePanjiMarkup(scope) {
    const oldPanji = document.getElementById('panjiAssistant');

    if (oldPanji) {
      panjiEl = oldPanji;
      return;
    }

    const panji = document.createElement('div');
    panji.id = 'panjiAssistant';
    panji.className = 'panji-assistant';
    panji.innerHTML = `
      <div class="panji-bubble" id="panjiBubble">
        <button type="button" class="panji-close" id="panjiClose" aria-label="Tutup PANJI">×</button>
        <div class="panji-bubble-top">
          <div class="panji-name">PANJI • PENGADAAN JITU</div>
          <div class="panji-emote" id="panjiEmote">🤔</div>
        </div>
        <div class="panji-text" id="panjiText">
          Halo, aku PANJI.
        </div>
        <div class="panji-actions">
          <button type="button" id="panjiHintBtn">Tanya PANJI</button>
          <button type="button" id="panjiMiniBtn">Minimize</button>
        </div>
      </div>

      <button type="button" class="panji-character" id="panjiCharacter" aria-label="PANJI">
        <div class="panji-glow"></div>
        <div class="panji-head">
          <div class="panji-hat">PBJ</div>
          <div class="panji-eye panji-eye-left"></div>
          <div class="panji-eye panji-eye-right"></div>
          <div class="panji-mouth"></div>
        </div>
        <div class="panji-body">
          <div class="panji-badge">PJ</div>
        </div>
        <div class="panji-hand panji-hand-left"></div>
        <div class="panji-hand panji-hand-right"></div>
      </button>
    `;

    document.body.appendChild(panji);
  }

  function initPanji(scope) {
    ensurePanjiMarkup(scope);

    panjiEl = document.querySelector('#panjiAssistant');
    panjiTextEl = document.querySelector('#panjiText');
    panjiEmoteEl = document.querySelector('#panjiEmote');
    panjiBubbleEl = document.querySelector('#panjiBubble');
    panjiHintBtn = document.querySelector('#panjiHintBtn');
    panjiMiniBtn = document.querySelector('#panjiMiniBtn');
    panjiCharacterBtn = document.querySelector('#panjiCharacter');
    panjiCloseBtn = document.querySelector('#panjiClose');

    if (!panjiEl || !panjiTextEl) return;

    if (panjiHintBtn) {
      panjiHintBtn.addEventListener('click', () => {
        if (panjiEl && panjiEl.classList.contains('panji-result-mode')) return;
        requestHintFromPanji();
      });
    }

    if (panjiMiniBtn) {
      panjiMiniBtn.addEventListener('click', () => {
        panjiUserMinimized = true;
        panjiEl.classList.add('panji-minimized');
      });
    }

    if (panjiCharacterBtn) {
      panjiCharacterBtn.addEventListener('click', () => {
        panjiEl.classList.remove('panji-hidden');

        if (panjiUserMinimized || panjiEl.classList.contains('panji-minimized')) {
          panjiUserMinimized = false;
          panjiEl.classList.remove('panji-minimized');
          showPanji(getPanjiCurrentGuideMessage(), 'thinking');
          return;
        }

        panjiUserMinimized = true;
        panjiEl.classList.add('panji-minimized');
      });
    }

    if (panjiCloseBtn) {
      panjiCloseBtn.addEventListener('click', () => {
        panjiUserMinimized = true;
        panjiEl.classList.add('panji-hidden');
      });
    }

    forceShowPanji();
    initPanjiAutoPosition();
  }

  function forceShowPanji() {
    if (!panjiEl) return;

    if (panjiEl.parentElement !== document.body) {
      document.body.appendChild(panjiEl);
    }

    panjiEl.classList.remove('panji-hidden');
    panjiEl.classList.remove('panji-minimized');

    panjiEl.style.position = 'fixed';
    panjiEl.style.right = '26px';
    panjiEl.style.bottom = 'var(--panji-bottom, 34px)';
    panjiEl.style.top = 'auto';
    panjiEl.style.left = 'auto';
    panjiEl.style.zIndex = '2147483647';
    panjiEl.style.opacity = '1';
    panjiEl.style.visibility = 'visible';
    panjiEl.style.display = 'flex';
    panjiEl.style.transform = 'none';
  }

  function updatePanjiAutoBottom() {
    if (!panjiEl) return;

    const baseBottom = window.innerWidth <= 900 ? 76 : 34;
    const maxBottom = window.innerWidth <= 900 ? 240 : 340;
    const gap = 18;
    let nextBottom = baseBottom;

    const logBox = document.querySelector('.ps-log-box');

    if (logBox) {
      const logRect = logBox.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const panjiRect = panjiEl.getBoundingClientRect();
      const panjiHeight = panjiRect.height || 220;
      const logVisible = logRect.top < viewportHeight && logRect.bottom > 0;

      if (logVisible) {
        const panjiNormalTop = viewportHeight - baseBottom - panjiHeight;
        const overlap = logRect.bottom - panjiNormalTop;

        if (overlap > 0 && logRect.top < viewportHeight - 60) {
          nextBottom = baseBottom + overlap + gap;
        }
      }
    }

    nextBottom = Math.max(baseBottom, Math.min(maxBottom, Math.round(nextBottom)));
    panjiEl.style.setProperty('--panji-bottom', nextBottom + 'px');
  }

  function initPanjiAutoPosition() {
    if (!panjiEl) return;

    if (typeof panjiEl._panjiAutoPositionDestroy === 'function') {
      panjiEl._panjiAutoPositionDestroy();
      panjiEl._panjiAutoPositionDestroy = null;
    }

    let ticking = false;

    const requestUpdate = () => {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        updatePanjiAutoBottom();
      });
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    panjiEl._panjiAutoPositionDestroy = () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };

    requestUpdate();
  }

  function showPanji(message, mood = 'thinking') {
    if (!panjiEl || !panjiTextEl) return;

    if (panjiUserMinimized || panjiEl.classList.contains('panji-minimized')) {
      setPanjiMoodOnly(mood);
      return;
    }

    forceShowPanji();
    clearPanjiTalkTimer();

    panjiEl.classList.remove('panji-hidden');
    panjiEl.classList.remove('panji-minimized');

    panjiEl.classList.remove(
      'panji-happy',
      'panji-sad',
      'panji-thinking',
      'panji-intro',
      'panji-talking',
      'panji-celebrate',
      'panji-cry'
    );

    void panjiEl.offsetWidth;

    panjiEl.classList.add(`panji-${mood}`);
    panjiEl.classList.add('panji-talking');

    if (panjiEmoteEl) {
      panjiEmoteEl.textContent =
        mood === 'happy'
          ? '😄'
          : mood === 'sad'
            ? '😭'
            : '🤔';
    }

    panjiTextEl.textContent = message;

    if (panjiBubbleEl) {
      panjiBubbleEl.classList.remove('burst');
      void panjiBubbleEl.offsetWidth;
      panjiBubbleEl.classList.add('burst');
    }

    const talkDuration = Math.min(
      6200,
      Math.max(1300, String(message || '').length * 34)
    );

    panjiTalkTimer = setTimeout(() => {
      if (!panjiEl) return;

      panjiEl.classList.remove('panji-talking');
      panjiTalkTimer = null;
    }, talkDuration);
  }

  function showPanjiIntro() {
    clearPanjiIntroTimers();

    showPanji(
      'Halo! Perkenalkan, aku PANJI.',
      'happy'
    );

    if (panjiEl) {
      panjiEl.classList.remove('panji-intro');
      void panjiEl.offsetWidth;
      panjiEl.classList.add('panji-intro');
    }

    panjiIntroTimers.push(setTimeout(() => {
      if (destroyed) return;

      showPanji(
        'PANJI itu singkatan dari Pengadaan Jitu. Tugas aku nemenin kamu belajar alur PBJ, mulai dari identifikasi kebutuhan, RUP, KAK, HPS, metode, kontrak, BAST, sampai realisasi.',
        'thinking'
      );
    }, 1700));

    panjiIntroTimers.push(setTimeout(() => {
      if (destroyed) return;

      showPanji(
        `Kalau kamu bingung, klik tombol "Tanya PANJI". Aku kasih hint, tapi skor kamu berkurang ${HINT_PENALTY} poin. Jadi pakai bantuanku seperlunya aja.`,
        'thinking'
      );
    }, 4500));

    panjiIntroTimers.push(setTimeout(() => {
      if (destroyed) return;

      showPanji(
        'Yuk mulai. Jangan cuma cepat, yang penting tertib, ada dasar, ada bukti, dan risikonya rendah.',
        'happy'
      );
    }, 7200));
  }

  function getHintMessage(challenge) {
    if (!challenge) {
      return 'Fokus susun langkah paling tertib ya.';
    }

    if (challenge.type === 'pipeline') {
      const nextEmpty = GAME_STATE.placed.findIndex(item => item === null);
      const expectedId = challenge.idealIds[nextEmpty];
      const expectedCard = challenge.cards.find(item => item.id === expectedId);

      if (!expectedCard) {
        return 'Pipeline hampir selesai. Cek lagi urutan dari kiri ke kanan.';
      }

      if (nextEmpty === 0) {
        return `Hint PANJI: untuk posisi pertama, fokus cari kartu "${expectedCard.label}". Biasanya alur aman dimulai dari dasar perencanaan atau kondisi kontrak yang sedang berjalan.`;
      }

      const prev = GAME_STATE.placed[nextEmpty - 1];

      if (prev) {
        return `Hint PANJI: setelah "${prev.label}", langkah yang lebih aman untuk posisi berikutnya adalah "${expectedCard.label}". Jangan lompat ke tahap akhir sebelum dasarnya siap.`;
      }

      return `Hint PANJI: fokus cari kartu "${expectedCard.label}" untuk posisi ${nextEmpty + 1}.`;
    }

    if (challenge.type === 'bonusRun') {
      return 'Hint PANJI: bonus level ini santai. Spasi/Tap untuk lompat, tekan lagi saat di udara untuk double jump, dan S/Panah Bawah untuk sliding. Kalau kena perangkap, PANJI invincible beberapa detik sehingga item dan perangkap yang lewat tidak dihitung dulu.';
    }

    if (challenge.type === 'tenderRush') {
      const pkg = getActiveTenderRushPackage(challenge);

      if (pkg) {
        const correctMethod = TENDER_RUSH_METHODS[pkg.correct];
        return `Hint PANJI: paket aktif adalah "${pkg.title}". Petunjuknya: ${pkg.clue} Jadi jalur paling aman adalah ${correctMethod ? correctMethod.key + ' - ' + correctMethod.label : 'metode yang sesuai'}. Alasannya: ${pkg.explanation}`;
      }

      return 'Hint PANJI: di Tender Rush, lihat 4 kata kunci dulu: pagu, jenis pekerjaan, apakah tersedia katalog, dan apakah pekerjaannya bisa diswakelolakan. Shortcut-nya: 1 e-Katalog, 2 Pengadaan Langsung, 3 Tender/Seleksi, 4 Swakelola, 5 Dikecualikan.';
    }

    if (challenge.hint) {
      return `Hint PANJI: ${challenge.hint}`;
    }

    return 'Baca kata kunci soal dan pilih jawaban yang paling sesuai prinsip PBJ: efektif, efisien, transparan, terbuka, bersaing, adil, dan akuntabel.';
  }

  function requestHintFromPanji() {
    clearPanjiIntroTimers();

    const challenge = getCurrentChallenge();

    if (!challenge || GAME_STATE.finished) return;

    if (GAME_STATE.hintUsed) {
      showPanji('Untuk soal ini kamu sudah pakai hint dari PANJI ya. Coba lanjutkan dulu dengan logika alur PBJ.', 'thinking');
      showToast('Hint soal ini sudah dipakai.', 'info');
      return;
    }

    GAME_STATE.hintUsed = true;
    GAME_STATE.score = Math.max(0, GAME_STATE.score - HINT_PENALTY);

    addLog('info', 'Hint PANJI dipakai', `Kamu memakai bantuan PANJI. Skor berkurang ${HINT_PENALTY} poin.`);

    showPanji(getHintMessage(challenge), 'thinking');
    showToast(`Hint dipakai. Skor -${HINT_PENALTY}.`, 'info');

    if (panjiCharacterBtn) {
      popScore(panjiCharacterBtn, `-${HINT_PENALTY}`, 'info');
    }

    renderGame();
  }

  function panjiForChallenge(challenge) {
    if (!challenge) return;

    clearPanjiIntroTimers();

    if (challenge.type === 'pipeline') {
      showPanji(
        'Ini soal pipeline. Susun kartu dari kiri ke kanan secara tertib. Aku akan jelasin setiap langkah benar supaya kamu paham, bukan cuma hafal.',
        'thinking'
      );
      return;
    }

    if (challenge.type === 'tenderRush') {
      showPanji(
        'Ini Tender Rush. Kontrolnya: 1 e-Katalog, 2 Pengadaan Langsung, 3 Tender/Seleksi, 4 Swakelola, 5 Dikecualikan. Paket baru turun setelah klik Mulai.',
        'thinking'
      );
      return;
    }

    if (challenge.type === 'bonusRun') {
      showPanji(
        'Bonus time! Level 4 jadi PANJI Power Run, dan Level 8 jadi PANJI Sky Shooter. Ini jeda ringan: lompat/slide atau tembak monster korupsi supaya mood balik lagi.',
        'happy'
      );
      return;
    }

    showPanji(
      'Ini soal ABCD. Baca kata kuncinya pelan-pelan. Pilih jawaban yang paling sesuai prinsip dan tahapan PBJ, bukan yang sekadar paling cepat.',
      'thinking'
    );
  }

  function startGame() {
    clearAutoNextTimer();
    clearTenderRushTimers();
    disableTenderRushKeyboard();
    clearBonusRunLoop();
    clearPanjiIntroTimers();

    GAME_STATE.order = CHALLENGES.map((_, index) => index);
    GAME_STATE.index = 0;
    GAME_STATE.score = 0;
    GAME_STATE.risk = 0;
    GAME_STATE.wrong = 0;
    GAME_STATE.correct = 0;
    GAME_STATE.finished = false;
    GAME_STATE.runId = 'run-' + Date.now() + '-' + Math.random().toString(16).slice(2);
    GAME_STATE.gameStartedAt = Date.now();
    GAME_STATE.scoreSubmitted = false;
    GAME_STATE.hasSeenIntro = false;
    GAME_STATE.levelTimeLeft = 0;
    GAME_STATE.levelTimeLimit = 0;
    GAME_STATE.bonusRun = null;
    GAME_STATE.stoppedReason = '';
    GAME_STATE.stoppedLevel = 0;
    GAME_STATE.pipelineCombo = 0;

    resetPanjiVisualState();
    panjiUserMinimized = false;

    if (!panjiIntroAlreadyShown) {
      showPanjiIntro();
      panjiIntroAlreadyShown = true;
    } else {
      showPanji('Game dimulai ulang dari Soal 1. Aku langsung bantu kalau kamu butuh arahan, tanpa perkenalan lagi.', 'thinking');
    }

    loadChallenge();
  }

  function loadChallenge() {
    clearAutoNextTimer();
    clearLevelTimer();
    clearTenderRushTimers();
    disableTenderRushKeyboard();
    clearBonusRunLoop();

    const challengeIndex = GAME_STATE.order[GAME_STATE.index];
    const challenge = CHALLENGES[challengeIndex];

    GAME_STATE.current = challenge;
    GAME_STATE.selectedCardId = null;
    GAME_STATE.answered = false;
    GAME_STATE.selectedAnswer = null;
    GAME_STATE.logs = [];
    GAME_STATE.finished = false;
    GAME_STATE.hintUsed = false;

    if (challenge.type === 'pipeline') {
      GAME_STATE.stage = 'pipeline';
      GAME_STATE.placed = Array(challenge.idealIds.length).fill(null);
      GAME_STATE.shuffledCards = shuffleArray(challenge.cards);
      GAME_STATE.tenderRush = null;
      GAME_STATE.bonusRun = null;
      GAME_STATE.progress = 0;
      GAME_STATE.pipelineCombo = 0;

      addLog(
        'info',
        'Challenge pipeline dimulai',
        'Susun kartu dari kiri ke kanan. Kartu jebakan akan menaikkan risiko.'
      );
    } else if (challenge.type === 'tenderRush') {
      GAME_STATE.stage = 'tenderRush';
      GAME_STATE.placed = [];
      GAME_STATE.shuffledCards = [];
      GAME_STATE.progress = 0;
      GAME_STATE.bonusRun = null;
      GAME_STATE.tenderRush = {
        started: false,
        currentIndex: 0,
        timeLeft: Number(challenge.timeLimit || 8),
        locked: false,
        lastResult: null,
        correctCount: 0,
        wrongCount: 0,
        packages: prepareTenderRushRandomPackages(challenge)
      };

      addLog(
        'info',
        'Challenge Tender Rush dimulai',
        'Baca tutorial PANJI dulu, lalu pilih jalur metode dengan tombol 1 sampai 5.'
      );
    } else if (challenge.type === 'bonusRun') {
      GAME_STATE.stage = 'bonusRun';
      GAME_STATE.placed = [];
      GAME_STATE.shuffledCards = [];
      GAME_STATE.tenderRush = null;
      GAME_STATE.bonusRun = createBonusRunState(challenge);
      GAME_STATE.progress = 0;

      addLog(
        'info',
        'Bonus level dimulai',
        'Bantu PANJI lari santai, kumpulkan item semangat, double jump, sliding, dan hindari jebakan lucu sampai waktu habis.'
      );
    } else {
      GAME_STATE.stage = 'quiz';
      GAME_STATE.placed = [];
      GAME_STATE.shuffledCards = [];
      GAME_STATE.tenderRush = null;
      GAME_STATE.bonusRun = null;
      GAME_STATE.progress = 100;
      prepareQuizRuntimeOptions(challenge);

      addLog(
        'info',
        'Challenge ABCD dimulai',
        'Pilih jawaban yang paling tepat.'
      );
    }

    renderGame();

    if (challenge.type !== 'tenderRush' && challenge.type !== 'bonusRun') {
      startLevelTimer(challenge);
    }

    if (GAME_STATE.index === 0 && !GAME_STATE.hasSeenIntro) {
      GAME_STATE.hasSeenIntro = true;
    } else {
      panjiForChallenge(challenge);
    }
  }

  function finishGame() {
    clearAutoNextTimer();
    clearLevelTimer();
    clearTenderRushTimers();
    disableTenderRushKeyboard();
    clearPanjiIntroTimers();

    GAME_STATE.finished = true;
    GAME_STATE.stage = 'result';
    GAME_STATE.current = null;
    GAME_STATE.progress = 100;

    renderGame();
    spawnConfetti();
    const finalResult = getCurrentResultSummary();
    showPanji(getLeaderboardPanjiNarrative(finalResult), getLeaderboardPanjiMood(finalResult));
    showToast('Semua soal selesai. Hasil akhir ditampilkan.', 'ok');
    openLeaderboardModal(hasPlayerProfile() ? 'leaderboard' : 'player', true);
    submitFinalScoreToLeaderboard();
  }

  function nextChallenge() {
    clearAutoNextTimer();
    clearLevelTimer();
    clearTenderRushTimers();
    disableTenderRushKeyboard();
    clearBonusRunLoop();

    if (GAME_STATE.index < GAME_STATE.order.length - 1) {
      GAME_STATE.index += 1;
      loadChallenge();
      return;
    }

    finishGame();
  }

  function canGoNext() {
    const challenge = getCurrentChallenge();

    if (!challenge) return false;
    if (challenge.type === 'pipeline') return GAME_STATE.progress === 100;
    if (challenge.type === 'tenderRush') return GAME_STATE.progress === 100;
    if (challenge.type === 'bonusRun') return GAME_STATE.progress === 100;
    return GAME_STATE.answered;
  }

  function getChallengeTypeLabel(type) {
    if (type === 'pipeline') return 'Pipeline';
    if (type === 'tenderRush') return 'Tender Rush';
    if (type === 'bonusRun') return 'Bonus';
    return 'ABCD';
  }

  function getChallengeTypeName(type) {
    if (type === 'pipeline') return 'Susun Pipeline';
    if (type === 'tenderRush') return 'Arcade Metode';
    if (type === 'bonusRun') return 'Mini Game Santuy';
    return 'Pilihan ABCD';
  }

  function renderChallengeBody(challenge) {
    if (challenge.type === 'pipeline') return renderPipelineChallenge(challenge);
    if (challenge.type === 'tenderRush') return renderTenderRushChallenge(challenge);
    if (challenge.type === 'bonusRun') return renderBonusRunChallenge(challenge);
    return renderQuizChallenge(challenge);
  }



  function clearBonusRunLoop() {
    if (bonusRunFrame) {
      cancelAnimationFrame(bonusRunFrame);
      bonusRunFrame = null;
    }

    if (bonusRunKeyHandler) {
      document.removeEventListener('keydown', bonusRunKeyHandler);
      bonusRunKeyHandler = null;
    }
  }


  function createBonusRunState(challenge) {
    const mode = challenge.bonusMode || 'mario';

    return {
      mode,
      started: false,
      finished: false,
      timeLeft: Number(challenge.timeLimit || (mode === 'plane' ? 40 : 35)),
      startedAt: 0,
      lastFrameAt: 0,
      playerX: 120,
      playerY: mode === 'plane' ? 180 : 0,
      velocityY: 0,
      jumpCount: 0,
      isSliding: false,
      slideUntil: 0,
      invincibleUntil: 0,
      powerUntil: 0,
      nextAutoShotAt: 0,
      nextSpawnAt: 0.75,
      runScore: 0,
      collectedCount: 0,
      hitCount: 0,
      shotCount: 0,
      objects: [],
      bullets: [],
      lastStatus: mode === 'plane'
        ? 'Gerakkan PANJI, tekan Spasi untuk menembak monster korupsi.'
        : 'Spasi/Tap untuk lompat, double jump aktif, S/↓ untuk sliding.',
      counters: {
        coin: 0,
        super: 0,
        coffee: 0,
        monster: 0,
        trap: 0,
        shot: 0
      }
    };
  }

  function getBonusRunState() {
    if (!GAME_STATE.bonusRun) {
      GAME_STATE.bonusRun = createBonusRunState(getCurrentChallenge() || {});
    }

    return GAME_STATE.bonusRun;
  }

  function clearBonusRunLoop() {
    if (bonusRunFrame) {
      cancelAnimationFrame(bonusRunFrame);
      bonusRunFrame = null;
    }

    if (bonusRunKeyHandler) {
      document.removeEventListener('keydown', bonusRunKeyHandler);
      bonusRunKeyHandler = null;
    }
  }

  function enableBonusRunKeyboard() {
    if (bonusRunKeyHandler) {
      document.removeEventListener('keydown', bonusRunKeyHandler);
      bonusRunKeyHandler = null;
    }

    bonusRunKeyHandler = event => {
      const tag = String(document.activeElement && document.activeElement.tagName || '').toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return;

      const run = getBonusRunState();
      if (!run || !run.started || run.finished) return;

      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW' || event.key === ' ') {
        event.preventDefault();
        if (run.mode === 'plane') {
          if (event.code === 'ArrowUp' || event.code === 'KeyW') moveBonusPlane(-42);
          else shootBonusBullet();
        } else {
          handleBonusRunJump();
        }
      }

      if (event.code === 'ArrowDown' || event.code === 'KeyS') {
        event.preventDefault();
        if (run.mode === 'plane') moveBonusPlane(42);
        else handleBonusRunSlide();
      }

      if (event.code === 'KeyX' || event.code === 'KeyZ') {
        event.preventDefault();
        shootBonusBullet();
      }
    };

    document.addEventListener('keydown', bonusRunKeyHandler);
  }

  function startBonusRun() {
    const challenge = getCurrentChallenge();
    const run = getBonusRunState();

    if (!challenge || challenge.type !== 'bonusRun' || !run || run.started || run.finished) return;

    clearBonusRunLoop();
    run.started = true;
    run.finished = false;
    run.startedAt = performance.now();
    run.lastFrameAt = run.startedAt;
    run.timeLeft = Number(challenge.timeLimit || (run.mode === 'plane' ? 40 : 35));
    run.nextSpawnAt = run.mode === 'plane' ? 0.45 : 0.7;
    GAME_STATE.progress = 0;

    enableBonusRunKeyboard();
    renderGame();

    showPanji(
      run.mode === 'plane'
        ? 'Level 8 bonus! PANJI terbang. Pakai ↑/↓ untuk gerak, Spasi untuk tembak monster korupsi, ambil power point biar skor makin tinggi.'
        : 'Level 4 bonus! PANJI lari gaya Mario. Spasi/Tap untuk lompat, bisa double jump, S atau ↓ untuk sliding. Ambil Super Point buat nembak monster korupsi.',
      'happy'
    );

    syncBonusRunUi();
    bonusRunFrame = requestAnimationFrame(stepBonusRun);
  }

  function handleBonusRunJump() {
    const run = getBonusRunState();
    if (!run || !run.started || run.finished) return;

    if (run.mode === 'plane') {
      shootBonusBullet();
      return;
    }

    if (run.jumpCount >= 2) return;

    run.velocityY = run.jumpCount === 0 ? 650 : 560;
    run.jumpCount += 1;
    run.isSliding = false;
    run.slideUntil = 0;

    const runner = root && root.querySelector('#psBonusRunner');
    if (runner) {
      runner.classList.remove('is-jumping');
      void runner.offsetWidth;
      runner.classList.add('is-jumping');
    }
  }

  function handleBonusRunSlide() {
    const run = getBonusRunState();
    if (!run || !run.started || run.finished) return;

    if (run.mode === 'plane') {
      moveBonusPlane(48);
      return;
    }

    if (run.playerY > 8) return;

    run.isSliding = true;
    run.slideUntil = performance.now() + 620;
    run.lastStatus = 'PANJI sliding! Hindari jebakan rendah.';
  }

  function moveBonusPlane(delta) {
    const run = getBonusRunState();
    if (!run || run.mode !== 'plane') return;
    run.playerY = Math.max(35, Math.min(285, Number(run.playerY || 160) + delta));
    syncBonusRunUi();
  }

  function shootBonusBullet() {
    const run = getBonusRunState();
    if (!run || !run.started || run.finished) return;

    const now = performance.now();
    if (now - Number(run.lastManualShotAt || 0) < 180) return;
    run.lastManualShotAt = now;
    run.shotCount += 1;
    run.counters.shot += 1;

    run.bullets.push({
      id: 'bullet-' + now + '-' + Math.random().toString(16).slice(2),
      x: run.mode === 'plane' ? 178 : 168,
      y: run.mode === 'plane' ? run.playerY + 16 : 70 + run.playerY,
      speed: run.mode === 'plane' ? 620 : 520
    });
  }

  function spawnBonusObject(elapsed) {
    const run = getBonusRunState();
    if (!run) return null;

    if (run.mode === 'plane') {
      const r = Math.random();
      if (r < 0.18) return makeBonusObject('power', 'power', '⚡', 10, 0, 930, 50 + Math.random() * 240, 48, 48, 'Power point terambil!');
      if (r < 0.36) return makeBonusObject('coin', 'coin', '🪙', 5, 0, 930, 45 + Math.random() * 255, 44, 44, 'Koin udara masuk!');
      return makeBonusObject('monster', 'monster', '👾', 14, 6, 930, 48 + Math.random() * 245, 58, 58, 'Monster korupsi menyerang!');
    }

    const r = Math.random();
    if (r < 0.16) return makeBonusObject('super', 'power', '⚡', 12, 0, 930, 88 + Math.random() * 85, 48, 48, 'Super PANJI aktif! Tembak monster korupsi!');
    if (r < 0.50) return makeBonusObject('coin', 'coin', '🪙', 5, 0, 930, 68 + Math.random() * 130, 42, 42, 'Koin PANJI dapat!');
    if (r < 0.66) return makeBonusObject('coffee', 'coffee', '☕', 6, 0, 930, 80 + Math.random() * 110, 42, 42, 'Kopi masuk, energi balik!');
    if (r < 0.83) return makeBonusObject('monster', 'monster', '👾', 14, 6, 930, 38, 54, 54, 'Monster korupsi kena PANJI!');
    return makeBonusObject('trap', 'trap', ['🔥', '📚', '😵', '🐌'][Math.floor(Math.random() * 4)], 0, 4, 930, 34, 52, 52, 'Aduh, kena perangkap! Invincible sebentar.');
  }

  function makeBonusObject(key, category, icon, points, penalty, x, y, width, height, line) {
    return {
      id: 'obj-' + Date.now() + '-' + Math.random().toString(16).slice(2),
      key,
      category,
      icon,
      points,
      penalty,
      x,
      y,
      width,
      height,
      line,
      hit: false,
      rot: (Math.random() * 10) - 5
    };
  }

  function isBonusInvincible(run) {
    return performance.now() < Number(run.invincibleUntil || 0);
  }

  function isBonusPowered(run) {
    return performance.now() < Number(run.powerUntil || 0);
  }

  function bonusRunCollides(obj) {
    const run = getBonusRunState();
    if (!run || !obj || obj.hit) return false;

    const playerBox = getBonusPlayerBox(run);
    const objBox = {
      left: obj.x,
      right: obj.x + obj.width,
      bottom: obj.y,
      top: obj.y + obj.height
    };

    return !(objBox.right < playerBox.left || objBox.left > playerBox.right || objBox.top < playerBox.bottom || objBox.bottom > playerBox.top);
  }

  function getBonusPlayerBox(run) {
    if (run.mode === 'plane') {
      return {
        left: run.playerX,
        right: run.playerX + 86,
        bottom: run.playerY,
        top: run.playerY + 58
      };
    }

    const height = run.isSliding ? 48 : 96;
    const width = run.isSliding ? 98 : 74;

    return {
      left: run.playerX,
      right: run.playerX + width,
      bottom: 34 + run.playerY,
      top: 34 + run.playerY + height
    };
  }

  function bonusBulletCollides(bullet, obj) {
    if (!bullet || !obj || obj.hit || obj.category !== 'monster') return false;

    const bulletBox = {
      left: bullet.x,
      right: bullet.x + 18,
      bottom: bullet.y,
      top: bullet.y + 8
    };
    const objBox = {
      left: obj.x,
      right: obj.x + obj.width,
      bottom: obj.y,
      top: obj.y + obj.height
    };

    return !(objBox.right < bulletBox.left || objBox.left > bulletBox.right || objBox.top < bulletBox.bottom || objBox.bottom > bulletBox.top);
  }

  function handleBonusCollect(obj) {
    const run = getBonusRunState();
    if (!run || obj.hit) return;

    obj.hit = true;
    run.collectedCount += 1;
    run.runScore += Number(obj.points || 0);
    GAME_STATE.score += Number(obj.points || 0);

    if (obj.category === 'power') {
      run.powerUntil = performance.now() + (run.mode === 'plane' ? 6500 : 7500);
      run.counters.super += 1;
      run.lastStatus = obj.line || 'Power aktif!';
      showPanji(run.mode === 'plane' ? 'Power pesawat aktif! Tembakan makin siap.' : 'Super PANJI aktif! Sekarang bisa nembak monster korupsi.', 'happy');
    } else {
      run.counters[obj.key] = Number(run.counters[obj.key] || 0) + 1;
      run.lastStatus = obj.line || 'Item didapat!';
    }

    const stage = root && root.querySelector('#psBonusStage');
    if (stage) popScore(stage, '+' + Number(obj.points || 0), 'ok');
  }

  function handleBonusHit(obj) {
    const run = getBonusRunState();
    if (!run || obj.hit) return;

    if (isBonusPowered(run) && obj.category === 'monster') {
      handleMonsterDestroyed(obj, 'power');
      return;
    }

    obj.hit = true;
    run.hitCount += 1;
    run.counters[obj.category === 'monster' ? 'monster' : 'trap'] += 1;
    run.runScore = Math.max(0, Number(run.runScore || 0) - Number(obj.penalty || 0));
    GAME_STATE.score = Math.max(0, Number(GAME_STATE.score || 0) - Number(obj.penalty || 0));
    GAME_STATE.risk += obj.category === 'monster' ? 2 : 1;
    run.invincibleUntil = performance.now() + 2200;
    run.lastStatus = obj.line || 'PANJI kena perangkap, invincible sebentar.';
    showPanji('Aduh kena! Tenang, PANJI invincible beberapa detik. Item dan rintangan yang lewat tidak dihitung dulu.', 'sad');

    const stage = root && root.querySelector('#psBonusStage');
    if (stage) popScore(stage, '-' + Number(obj.penalty || 0), 'bad');
  }

  function handleMonsterDestroyed(obj, source) {
    const run = getBonusRunState();
    if (!run || obj.hit) return;

    obj.hit = true;
    run.counters.monster += 1;
    run.runScore += 8;
    GAME_STATE.score += 8;
    run.lastStatus = source === 'bullet' ? 'Dor! Monster korupsi tertembak.' : 'Super PANJI menabrak monster korupsi!';

    const stage = root && root.querySelector('#psBonusStage');
    if (stage) popScore(stage, '+8', 'ok');
  }

  function stepBonusRun(timestamp) {
    const challenge = getCurrentChallenge();
    const run = getBonusRunState();

    if (destroyed || !challenge || challenge.type !== 'bonusRun' || !run || !run.started || run.finished) {
      clearBonusRunLoop();
      return;
    }

    const dt = Math.min(0.04, Math.max(0.012, (timestamp - Number(run.lastFrameAt || timestamp)) / 1000));
    run.lastFrameAt = timestamp;

    const elapsed = Math.max(0, (timestamp - Number(run.startedAt || timestamp)) / 1000);
    run.timeLeft = Math.max(0, Number(challenge.timeLimit || 35) - elapsed);
    GAME_STATE.progress = Math.max(0, Math.min(100, Math.round((elapsed / Math.max(1, Number(challenge.timeLimit || 35))) * 100)));

    if (run.mode === 'mario') {
      if (performance.now() > Number(run.slideUntil || 0)) run.isSliding = false;

      if (run.playerY > 0 || run.velocityY > 0) {
        run.velocityY -= 1700 * dt;
        run.playerY = Math.max(0, run.playerY + run.velocityY * dt);
        if (run.playerY <= 0) {
          run.playerY = 0;
          run.velocityY = 0;
          run.jumpCount = 0;
        }
      }

      if (isBonusPowered(run) && performance.now() >= Number(run.nextAutoShotAt || 0)) {
        shootBonusBullet();
        run.nextAutoShotAt = performance.now() + 420;
      }
    }

    run.nextSpawnAt -= dt;
    if (run.nextSpawnAt <= 0) {
      run.objects.push(spawnBonusObject(elapsed));
      run.nextSpawnAt = run.mode === 'plane'
        ? 0.42 + Math.random() * 0.45
        : 0.64 + Math.random() * 0.6;
    }

    const objectSpeed = run.mode === 'plane' ? 390 : 330;
    run.objects.forEach(obj => {
      obj.x -= objectSpeed * dt;
    });

    run.bullets.forEach(bullet => {
      bullet.x += Number(bullet.speed || 560) * dt;
    });

    run.bullets.forEach(bullet => {
      run.objects.forEach(obj => {
        if (bonusBulletCollides(bullet, obj)) {
          bullet.hit = true;
          handleMonsterDestroyed(obj, 'bullet');
        }
      });
    });

    if (!isBonusInvincible(run)) {
      run.objects.forEach(obj => {
        if (!bonusRunCollides(obj)) return;
        if (obj.category === 'coin' || obj.category === 'coffee' || obj.category === 'power') handleBonusCollect(obj);
        else handleBonusHit(obj);
      });
    }

    run.objects = run.objects.filter(obj => obj && !obj.hit && obj.x > -100);
    run.bullets = run.bullets.filter(bullet => bullet && !bullet.hit && bullet.x < 960);

    syncBonusRunUi();

    if (run.timeLeft <= 0) {
      finishBonusRun();
      return;
    }

    bonusRunFrame = requestAnimationFrame(stepBonusRun);
  }

  function finishBonusRun() {
    const challenge = getCurrentChallenge();
    const run = getBonusRunState();
    if (!challenge || challenge.type !== 'bonusRun' || !run || run.finished) return;

    run.finished = true;
    run.started = false;
    run.timeLeft = 0;
    GAME_STATE.progress = 100;
    GAME_STATE.correct += 1;
    GAME_STATE.score += 20;
    clearBonusRunLoop();

    addLog('ok', 'Bonus level selesai', `Skor bonus ${run.runScore}. Monster korupsi dihentikan ${run.counters.monster || 0}, power ${run.counters.super || 0}.`);
    showToast('Bonus level selesai. Otomatis lanjut...', 'ok');
    showPanji(run.mode === 'plane' ? 'Misi udara selesai! Monster korupsi mundur, sekarang lanjut level berikutnya.' : 'Mantap! PANJI sudah fresh dan kuat lagi. Lanjut level berikutnya!', 'happy');
    renderGame();
    syncBonusRunUi();
    scheduleAutoNext('Bonus selesai. Otomatis lanjut ke level berikutnya...');
  }

  function syncBonusRunUi() {
    const run = getBonusRunState();
    const challenge = getCurrentChallenge();
    if (!root || !run || !challenge || challenge.type !== 'bonusRun') return;

    const progress = Math.max(0, Math.min(100, Math.round(Number(GAME_STATE.progress || 0))));
    const timeLeft = Math.max(0, Math.ceil(Number(run.timeLeft || 0)));
    const setText = (selector, value) => {
      const el = root.querySelector(selector);
      if (el) el.textContent = value;
    };

    setText('#psBonusTimeValue', timeLeft);
    setText('#psBonusRunScore', run.runScore);
    setText('#psBonusCollectedValue', run.collectedCount);
    setText('#psBonusHitValue', run.hitCount);
    setText('#psBonusPowerValue', isBonusPowered(run) ? 'AKTIF' : '-');
    setText('#psBonusStatusText', run.lastStatus);
    setText('#psLevelTimeText', `${timeLeft}s`);

    const timeBar = root.querySelector('#psLevelTimeBar');
    if (timeBar) timeBar.style.width = `${Math.max(0, Math.min(100, (timeLeft / Math.max(1, Number(challenge.timeLimit || 35))) * 100))}%`;
    const mainBar = root.querySelector('.ps-progress-bar');
    if (mainBar) mainBar.style.width = `${progress}%`;

    const objectsEl = root.querySelector('#psBonusObjects');
    if (objectsEl) objectsEl.innerHTML = run.objects.map(renderBonusRunObject).join('');
    const bulletsEl = root.querySelector('#psBonusBullets');
    if (bulletsEl) bulletsEl.innerHTML = run.bullets.map(renderBonusBullet).join('');

    const player = root.querySelector('#psBonusRunner');
    if (player) {
      if (run.mode === 'plane') {
        player.style.left = `${run.playerX}px`;
        player.style.bottom = `${run.playerY}px`;
      } else {
        player.style.left = `${run.playerX}px`;
        player.style.bottom = `${34 + Math.max(0, Number(run.playerY || 0))}px`;
      }
      player.classList.toggle('is-sliding', Boolean(run.isSliding));
      player.classList.toggle('is-invincible', isBonusInvincible(run));
      player.classList.toggle('is-powered', isBonusPowered(run));
      player.classList.toggle('is-plane', run.mode === 'plane');
    }
  }

  function renderBonusRunObject(obj) {
    const cls = ['ps-bonus-item-lite', 'cat-' + obj.category, 'key-' + obj.key].join(' ');
    return `
      <div class="${cls}" style="left:${obj.x}px; bottom:${obj.y}px; width:${obj.width}px; height:${obj.height}px; transform:rotate(${obj.rot || 0}deg);">
        <span>${escapeHtml(obj.icon)}</span>
      </div>
    `;
  }

  function renderBonusBullet(bullet) {
    return `<div class="ps-bonus-bullet" style="left:${bullet.x}px; bottom:${bullet.y}px;"></div>`;
  }

  function renderBonusRunChallenge(challenge) {
    const run = getBonusRunState() || createBonusRunState(challenge);
    const isPlane = run.mode === 'plane';

    if (!run.started && !run.finished) {
      return `
        <div class="ps-bonus-lite-shell">
          <div class="ps-bonus-lite-intro ${isPlane ? 'plane' : 'mario'}">
            <div class="ps-bonus-kicker">${isPlane ? 'Level 8 Bonus • Sky Shooter' : 'Level 4 Bonus • Power Run'}</div>
            <h3>${isPlane ? 'PANJI Sky Shooter' : 'PANJI Power Run'}</h3>
            <p>${escapeHtml(challenge.desc)}</p>
            <div class="ps-bonus-lite-controls">
              ${isPlane
                ? '<span>↑/↓ = gerak</span><span>Spasi/X = tembak</span><span>⚡ = power point</span>'
                : '<span>Spasi/Tap = lompat</span><span>Double jump aktif</span><span>S/↓ = sliding</span><span>⚡ = Super PANJI</span>'}
            </div>
            <button type="button" class="ps-btn ps-btn-primary" id="btnStartBonusRun">Mulai Bonus Level</button>
          </div>
        </div>
      `;
    }

    if (run.finished) {
      return `
        <div class="ps-bonus-lite-shell">
          <div class="ps-bonus-lite-finish ${isPlane ? 'plane' : 'mario'}">
            <h3>${isPlane ? '🛩️ Misi Udara Selesai!' : '🏁 Power Run Selesai!'}</h3>
            <p>${escapeHtml(challenge.explanation || '')}</p>
            <div class="ps-bonus-lite-stats">
              <div><label>Skor Bonus</label><b>${run.runScore}</b></div>
              <div><label>Monster</label><b>${run.counters.monster || 0}</b></div>
              <div><label>Power</label><b>${run.counters.super || 0}</b></div>
              <div><label>Kena</label><b>${run.hitCount || 0}</b></div>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="ps-bonus-lite-shell">
        <div class="ps-bonus-lite-hud">
          <div><label>Waktu</label><b id="psBonusTimeValue">${Math.ceil(run.timeLeft || challenge.timeLimit || 35)}</b></div>
          <div><label>Skor Bonus</label><b id="psBonusRunScore">${run.runScore || 0}</b></div>
          <div><label>Item</label><b id="psBonusCollectedValue">${run.collectedCount || 0}</b></div>
          <div><label>Kena</label><b id="psBonusHitValue">${run.hitCount || 0}</b></div>
          <div><label>Power</label><b id="psBonusPowerValue">${isBonusPowered(run) ? 'AKTIF' : '-'}</b></div>
        </div>

        <div class="ps-bonus-lite-stage ${isPlane ? 'plane' : 'mario'}" id="psBonusStage">
          <div class="ps-bonus-lite-bg"></div>
          <div class="ps-bonus-lite-objects" id="psBonusObjects">${run.objects.map(renderBonusRunObject).join('')}</div>
          <div class="ps-bonus-lite-bullets" id="psBonusBullets">${run.bullets.map(renderBonusBullet).join('')}</div>
          <button type="button" class="ps-bonus-lite-player ${isPlane ? 'is-plane' : ''}" id="psBonusRunner" aria-label="PANJI bonus">
            <span class="wing left"></span><span class="wing right"></span>
            <span class="head"><span class="hat">PANJI</span><span class="eye l"></span><span class="eye r"></span><span class="mouth"></span></span>
            <span class="body">PBJ</span>
            <span class="leg l"></span><span class="leg r"></span>
          </button>
          <div class="ps-bonus-lite-touch">
            ${isPlane
              ? '<button type="button" id="psBonusUpBtn">Naik</button><button type="button" id="psBonusTapArea">Tembak</button><button type="button" id="psBonusSlideBtn">Turun</button>'
              : '<button type="button" id="psBonusTapArea">Lompat / Double Jump</button><button type="button" id="psBonusSlideBtn">Sliding</button>'}
          </div>
        </div>

        <div class="ps-bonus-lite-note">
          <b id="psBonusStatusText">${escapeHtml(run.lastStatus || '')}</b>
          <span>${isPlane ? 'Game tembak-tembakan pesawat jadul, versi ringan.' : 'Game platformer ringan, gaya Mario Bros.'}</span>
        </div>
      </div>
    `;
  }
  function renderReadyScreen() {
    if (!root) return;

    root.innerHTML = `
      <section class="ps-card ps-ready-card">
        <div class="ps-result-hero">
          <h2>🎮 Procurement Stacker</h2>
          <p>
            Sebelum mulai, PANJI akan kenalan dulu dan minta data pemain. Isi nama serta instansi/OPD agar skor akhir bisa masuk leaderboard.
          </p>
        </div>

        <div class="ps-result-note">
          <strong>Alur game:</strong><br>
          Total 20 level: susun pipeline, pilihan ABCD, Tender Rush, bonus Level 4 PANJI Power Run gaya Mario, dan bonus Level 8 PANJI Sky Shooter gaya pesawat jadul.
        </div>

        <div class="ps-buttons">
          <button type="button" class="ps-btn ps-btn-primary" id="btnOpenPlayerModal">
            Isi Nama & Instansi
          </button>
        </div>
      </section>
    `;

    const btn = root.querySelector('#btnOpenPlayerModal');
    if (btn) {
      btn.addEventListener('click', () => openLeaderboardModal('player', true));
    }

    requestAnimationFrame(updatePanjiAutoBottom);
  }


  function getDisplayChallengeTitle(challenge) {
    const level = getCurrentLevelNumber();
    const raw = String(challenge && challenge.title ? challenge.title : 'Level');
    const cleaned = raw.replace(/^Soal\s*\d+\s*—\s*/, '').replace(/^Level\s*\d+\s*—\s*/, '');
    return 'Level ' + level + ' — ' + cleaned;
  }

  function renderGame() {
    if (!root) return;

    if (GAME_STATE.stage === 'result') {
      root.innerHTML = renderResultScreen();
      bindResultEvents();
      requestAnimationFrame(updatePanjiAutoBottom);
      return;
    }

    const challenge = getCurrentChallenge();

    root.innerHTML = `
      <section class="ps-card">
        <div class="ps-card-head">
          <div>
            <h3>${escapeHtml(getRenderedChallengeTitle(challenge))}</h3>
            <p>${escapeHtml(challenge.desc)}</p>
          </div>

          <div class="ps-pill-row">
            <div class="ps-pill ${challenge.type === 'pipeline' ? 'green' : challenge.type === 'tenderRush' ? 'rush' : challenge.type === 'bonusRun' ? 'bonus' : ''}">
              ${getChallengeTypeLabel(challenge.type)}
            </div>
            <div class="ps-pill">Soal ${GAME_STATE.index + 1} / ${GAME_STATE.order.length}</div>
            ${GAME_STATE.selectedCardId ? '<div class="ps-pill warn">Kartu dipilih</div>' : ''}
            ${GAME_STATE.hintUsed ? '<div class="ps-pill warn">Hint PANJI dipakai</div>' : ''}
          </div>
        </div>

        <div class="ps-case-panel">
          <div class="ps-case-box">
            <label>Kasus / Topik</label>
            <strong>${escapeHtml(challenge.caseTitle)}</strong>
            <span>${escapeHtml(challenge.desc)}</span>
          </div>

          <div class="ps-case-box">
            <label>Jenis Soal</label>
            <strong>${getChallengeTypeName(challenge.type)}</strong>
          </div>

          <div class="ps-case-box">
            <label>Skor</label>
            <strong>${GAME_STATE.score}</strong>
          </div>

          <div class="ps-case-box">
            <label>Risiko</label>
            <strong>${GAME_STATE.risk}</strong>
          </div>
        </div>

        <div class="ps-score-grid">
          <div class="ps-score-card">
            <label>Progress</label>
            <strong>${GAME_STATE.progress}%</strong>
          </div>
          <div class="ps-score-card">
            <label>Skor</label>
            <strong>${GAME_STATE.score}</strong>
          </div>
          <div class="ps-score-card">
            <label>Risiko</label>
            <strong>${GAME_STATE.risk}</strong>
          </div>
          <div class="ps-score-card">
            <label>Salah</label>
            <strong>${GAME_STATE.wrong}</strong>
          </div>
          <div class="ps-score-card ps-level-time-card">
            <label>${challenge.type === 'bonusRun' ? 'Waktu Bonus' : 'Waktu Level'}</label>
            <strong id="psLevelTimeText">${challenge.type === 'tenderRush' ? '-' : challenge.type === 'bonusRun' ? `${Number(GAME_STATE.bonusRun?.timeLeft || challenge.timeLimit || 45)}s` : `${GAME_STATE.levelTimeLeft || getDefaultLevelTime(challenge)}s`}</strong>
            <div class="ps-mini-time-track"><div class="ps-mini-time-bar" id="psLevelTimeBar" style="width:100%"></div></div>
          </div>
        </div>

        <div class="ps-progress-track">
          <div class="ps-progress-bar" style="width:${GAME_STATE.progress}%"></div>
        </div>

        <div class="ps-helper-row">
          <div class="ps-helper-note">
            <b>PANJI siap bantu.</b> Kalau klik <b>Tanya PANJI</b>, kamu dapat hint tetapi skor berkurang <b>${HINT_PENALTY}</b>.
          </div>
          <button type="button" class="ps-btn ps-btn-soft" id="btnPanjiHint">
            Tanya PANJI (-${HINT_PENALTY})
          </button>
        </div>

        ${renderChallengeBody(challenge)}

        ${renderLogs()}

        <div class="ps-buttons">
          <button type="button" class="ps-btn ps-btn-soft" id="btnRestartGame">Mulai Ulang dari Soal 1</button>
          ${
            challenge.type === 'pipeline' || challenge.type === 'tenderRush' || challenge.type === 'bonusRun'
              ? '<button type="button" class="ps-btn ps-btn-soft" id="btnResetChallenge">Reset Soal Ini</button>'
              : ''
          }
          <button type="button" class="ps-btn ps-btn-primary" id="btnNextChallenge" ${canGoNext() ? '' : 'disabled'}>
            Lanjut Soal Berikutnya
          </button>
        </div>
      </section>
    `;

    bindGameEvents();
    requestAnimationFrame(updatePanjiAutoBottom);
  }

  function renderPipelineChallenge(challenge) {
    const placedIds = new Set(GAME_STATE.placed.filter(Boolean).map(item => item.id));

    return `
      <div class="ps-pipeline">
        ${challenge.idealIds.map((_, index) => renderSlot(index)).join('')}
      </div>

      <div class="ps-card-head">
        <div>
          <h3>Kartu Pipeline Acak</h3>
          <p>Drag kartu ke slot, atau klik kartu lalu klik slot biru. Urutan harus dari kiri ke kanan.</p>
        </div>
        <button type="button" class="ps-btn ps-btn-soft" id="btnShuffleCards">
          Acak Kartu
        </button>
      </div>

      <div class="ps-bank">
        ${GAME_STATE.shuffledCards.map(item => renderPipelineCard(item, placedIds.has(item.id))).join('')}
      </div>

      ${
        GAME_STATE.progress === 100
          ? `
            <div class="ps-explanation">
              <strong>Pipeline selesai:</strong><br>
              ${escapeHtml(challenge.explanation)}
            </div>
          `
          : ''
      }
    `;
  }

  function renderSlot(index) {
    const placed = GAME_STATE.placed[index];
    const nextEmpty = GAME_STATE.placed.findIndex(item => item === null);
    const isReady = GAME_STATE.selectedCardId && !placed && index === nextEmpty;

    if (placed) {
      return `
        <div class="ps-slot correct" data-slot-index="${index}">
          <div class="ps-slot-number">${index + 1}</div>
          ${renderPipelineCard(placed, false, true)}
        </div>
      `;
    }

    return `
      <div class="ps-slot ${isReady ? 'click-ready' : ''}" data-slot-index="${index}">
        <div class="ps-slot-number">${index + 1}</div>
        <div class="ps-slot-placeholder">
          ${isReady ? 'Klik untuk pasang kartu' : `Slot ${index + 1}`}
        </div>
      </div>
    `;
  }

  function renderPipelineCard(item, used = false, locked = false) {
    const selected = GAME_STATE.selectedCardId === item.id ? 'selected' : '';
    const trapClass = item.type === 'trap' ? 'trap-card' : '';

    return `
      <div
        class="ps-action-card ${used ? 'used' : ''} ${locked ? 'correct-card' : ''} ${selected} ${trapClass}"
        draggable="${used || locked || GAME_STATE.progress === 100 ? 'false' : 'true'}"
        data-card-id="${escapeHtml(item.id)}"
      >
        <div class="ps-card-icon">${item.icon}</div>
        <strong>${escapeHtml(item.label)}</strong>
        <span>${escapeHtml(item.note)}</span>
      </div>
    `;
  }

  function renderTenderRushChallenge(challenge) {
    const rush = GAME_STATE.tenderRush || {
      started: false,
      currentIndex: 0,
      timeLeft: Number(challenge.timeLimit || 8),
      lastResult: null,
      correctCount: 0,
      wrongCount: 0
    };

    const rushPackages = Array.isArray(rush.packages) && rush.packages.length ? rush.packages : (challenge.packages || []);
    const total = rushPackages.length;
    const currentPackage = rushPackages[rush.currentIndex];

    if (!currentPackage && rush.started && GAME_STATE.progress < 100) {
      GAME_STATE.progress = 100;
    }

    const percentTime = Math.max(0, Math.min(100, (Number(rush.timeLeft || 0) / Number(challenge.timeLimit || 8)) * 100));

    if (!rush.started) {
      return `
        <div class="ps-rush-tutorial">
          <div class="ps-rush-tutorial-main">
            <div class="ps-rush-kicker">Tutorial PANJI dulu</div>
            <h3>Jalur Metode Tender Rush</h3>
            <p>
              Di soal ini paket akan muncul satu per satu seperti arcade. Tugas kamu memilih jalur metode yang paling tepat
              sebelum waktu habis. Baca <b>pagu</b>, <b>jenis paket</b>, <b>ketersediaan katalog</b>, dan <b>kondisi pelaksanaan</b>.
              Di level ini batas salah/miss adalah <b>${getTenderRushFailLimitByLevel(getCurrentLevelNumber())} kali</b>; kalau melewati batas, game langsung berhenti.
            </p>
          </div>
          <div class="ps-rush-method-grid">
            ${Object.values(TENDER_RUSH_METHODS).map(method => `
              <div class="ps-rush-method-card">
                <div class="ps-rush-method-key">${method.key}</div>
                <div class="ps-rush-method-icon">${method.icon}</div>
                <strong>${escapeHtml(method.label)}</strong>
                <span>${escapeHtml(method.hint)}</span>
              </div>
            `).join('')}
          </div>
          <div class="ps-buttons">
            <button type="button" class="ps-btn ps-btn-primary" id="btnStartTenderRush">Saya Paham, Mulai Tender Rush</button>
          </div>
        </div>
      `;
    }

    if (!currentPackage && GAME_STATE.progress === 100) {
      return `
        <div class="ps-rush-finished">
          <h3>🏁 Tender Rush selesai</h3>
          <p>${escapeHtml(challenge.explanation)}</p>
          <div class="ps-rush-summary">
            <div><label>Benar</label><strong>${rush.correctCount || 0}</strong></div>
            <div><label>Salah/Miss</label><strong>${rush.wrongCount || 0}</strong></div>
            <div><label>Total Paket</label><strong>${total}</strong></div>
          </div>
        </div>
      `;
    }

    return `
      <div class="ps-rush-arena">
        <div class="ps-rush-hud">
          <div><label>Paket</label><strong>${Math.min(rush.currentIndex + 1, total)} / ${total}</strong></div>
          <div><label>Waktu</label><strong id="psRushTimeText">${rush.timeLeft}</strong></div>
          <div><label>Benar</label><strong>${rush.correctCount || 0}</strong></div>
          <div><label>Salah</label><strong>${rush.wrongCount || 0} / ${getTenderRushFailLimitByLevel(getCurrentLevelNumber())}</strong></div>
        </div>

        <div class="ps-rush-time-track">
          <div class="ps-rush-time-bar" id="psRushTimeBar" style="width:${percentTime}%"></div>
        </div>

        <div class="ps-rush-fall-lane">
          <div class="ps-rush-package ${rush.lastResult ? (rush.lastResult.correct ? 'correct' : 'wrong') : ''}" style="--rush-duration:${Number(challenge.timeLimit || 8)}s">
            <div class="ps-rush-package-top">
              <span>${escapeHtml(currentPackage.type)}</span>
              <b>${formatCurrency(currentPackage.pagu)}</b>
            </div>
            <h3>${escapeHtml(currentPackage.title)}</h3>
            <p>${escapeHtml(currentPackage.clue)}</p>
          </div>
        </div>

        ${rush.lastResult ? `
          <div class="ps-rush-result ${rush.lastResult.correct ? 'ok' : 'bad'}">
            <strong>${rush.lastResult.correct ? 'Benar!' : 'Belum tepat.'}</strong>
            ${escapeHtml(rush.lastResult.message)}
          </div>
        ` : ''}

        <div class="ps-rush-drop-grid">
          ${Object.entries(TENDER_RUSH_METHODS).map(([id, method]) => `
            <button type="button" class="ps-rush-drop" data-rush-method="${id}" ${rush.locked ? 'disabled' : ''}>
              <span class="ps-rush-key">${method.key}</span>
              <span class="ps-rush-icon">${method.icon}</span>
              <strong>${escapeHtml(method.label)}</strong>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderQuizChallenge(challenge) {
    const options = Array.isArray(challenge.runtimeOptions) && challenge.runtimeOptions.length
      ? challenge.runtimeOptions
      : (challenge.options || []).map((text, originalIndex) => ({ text, originalIndex }));
    const correctRuntimeIndex = Number.isInteger(challenge.runtimeAnswer) ? challenge.runtimeAnswer : Number(challenge.answer || 0);

    return `
      <div class="ps-quiz-question">
        ${escapeHtml(challenge.question)}
      </div>

      <div class="ps-quiz-options">
        ${options.map((option, index) => {
          let cls = '';

          if (GAME_STATE.answered) {
            if (index === correctRuntimeIndex) cls = 'correct';
            else if (index === GAME_STATE.selectedAnswer) cls = 'wrong';
          }

          return `
            <button
              type="button"
              class="ps-quiz-option ${cls}"
              data-answer-index="${index}"
              ${GAME_STATE.answered ? 'disabled' : ''}
            >
              ${String.fromCharCode(65 + index)}. ${escapeHtml(option.text)}
            </button>
          `;
        }).join('')}
      </div>

      ${
        GAME_STATE.answered
          ? `
            <div class="ps-explanation">
              <strong>Pembahasan:</strong><br>
              ${escapeHtml(challenge.explanation)}
            </div>
          `
          : ''
      }
    `;
  }

  function renderLogs() {
    if (!GAME_STATE.logs.length) return '';

    return `
      <div class="ps-log-box">
        <strong>Log Pembelajaran</strong>
        <div class="ps-log-list">
          ${GAME_STATE.logs.map(item => `
            <div class="ps-log-item">
              <div class="ps-log-icon ${item.type}">
                ${item.type === 'ok' ? '✓' : item.type === 'bad' ? '!' : 'i'}
              </div>
              <div>
                <div class="ps-log-title">${escapeHtml(item.title)}</div>
                <div class="ps-log-sub">${escapeHtml(item.text)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderResultScreen() {
    const maxScore = calculateMaxScore();
    const percent = maxScore > 0 ? Math.round((GAME_STATE.score / maxScore) * 100) : 0;
    const grade = getResultGrade(percent);
    const totalQuestions = CHALLENGES.length;
    const riskLabel = GAME_STATE.risk <= 20
      ? 'Rendah'
      : GAME_STATE.risk <= 60
        ? 'Sedang'
        : 'Tinggi';
    const stopTitle = GAME_STATE.stoppedReason === 'rushFailed'
      ? 'Game berhenti karena Tender Rush gagal melewati batas level.'
      : GAME_STATE.stoppedReason === 'time'
        ? 'Game berhenti karena waktu level habis.'
        : '';

    return `
      <section class="ps-card">
        <div class="ps-result-hero">
          <h2>${grade.icon} ${grade.label}</h2>
          <p>${escapeHtml(grade.text)}</p>
        </div>

        <div class="ps-result-grid">
          <div class="ps-result-card">
            <label>Nilai Akhir</label>
            <strong>${percent}%</strong>
          </div>

          <div class="ps-result-card">
            <label>Skor</label>
            <strong>${GAME_STATE.score}/${maxScore}</strong>
          </div>

          <div class="ps-result-card">
            <label>Risiko</label>
            <strong>${GAME_STATE.risk}</strong>
          </div>

          <div class="ps-result-card">
            <label>Salah</label>
            <strong>${GAME_STATE.wrong}</strong>
          </div>

          <div class="ps-result-card">
            <label>Level Dicapai</label>
            <strong>${getCurrentResultSummary().levelDicapai}/${totalQuestions}</strong>
          </div>
        </div>

        ${stopTitle ? `
          <div class="ps-result-note ps-result-stop-note">
            <strong>${escapeHtml(stopTitle)}</strong><br>
            Kamu mencapai <strong>Level ${GAME_STATE.stoppedLevel || (GAME_STATE.index + 1)}</strong> dengan skor <strong>${GAME_STATE.score}</strong> dan risiko <strong>${GAME_STATE.risk}</strong>.
          </div>
        ` : ''}

        <div class="ps-result-note">
          <strong>Ringkasan:</strong><br>
          Kamu sudah menyelesaikan ${totalQuestions} soal/challenge. Level risiko kamu saat ini:
          <strong>${riskLabel}</strong>. Ingat, terlalu sering memakai hint dari PANJI memang membantu,
          tetapi mengurangi skor.
        </div>

        <div class="ps-result-note">
          <strong>Catatan pembelajaran:</strong><br>
          Dalam praktik PBJ, keputusan tidak cukup hanya cepat. Harus ada alur yang tertib, bukti yang jelas,
          pemilihan metode yang sesuai, serta dokumentasi saat terjadi perubahan kondisi seperti katalog tidak tersedia
          atau kontrak perlu diadendum.
        </div>

        <div class="ps-buttons">
          <button type="button" class="ps-btn ps-btn-primary" id="btnPlayAgain">
            Main Lagi dari Soal 1
          </button>
          <button type="button" class="ps-btn ps-btn-soft" id="btnOpenLeaderboard">
            Lihat Leaderboard
          </button>
        </div>
      </section>
    `;
  }

  function bindResultEvents() {
    const btnPlayAgain = root.querySelector('#btnPlayAgain');
    const btnOpenLeaderboard = root.querySelector('#btnOpenLeaderboard');

    if (btnPlayAgain) {
      btnPlayAgain.addEventListener('click', () => {
        clearAutoNextTimer();
        startGame();
      });
    }

    if (btnOpenLeaderboard) {
      btnOpenLeaderboard.addEventListener('click', () => {
        openLeaderboardModal('leaderboard', true);
      });
    }
  }

  function startTenderRush() {
    const challenge = getCurrentChallenge();
    if (!challenge || challenge.type !== 'tenderRush') return;

    clearPanjiIntroTimers();
    clearLevelTimer();
    clearTenderRushTimers();

    GAME_STATE.tenderRush = {
      started: true,
      currentIndex: 0,
      timeLeft: Number(challenge.timeLimit || 8),
      locked: false,
      lastResult: null,
      correctCount: 0,
      wrongCount: 0,
      packages: prepareTenderRushRandomPackages(challenge)
    };

    enableTenderRushKeyboard();
    beginTenderRushRound();
    showPanji(`Mulai! Paket pertama turun. Ingat: 1 e-Katalog, 2 Pengadaan Langsung, 3 Tender/Seleksi, 4 Swakelola, 5 Dikecualikan. Batas salah level ini ${getTenderRushFailLimitByLevel(getCurrentLevelNumber())} kali.`, 'happy');
  }

  function beginTenderRushRound() {
    const challenge = getCurrentChallenge();
    const rush = GAME_STATE.tenderRush;

    if (!challenge || challenge.type !== 'tenderRush' || !rush) return;

    clearTenderRushTimers();

    const rushPackages = Array.isArray(rush.packages) && rush.packages.length ? rush.packages : (challenge.packages || []);

    if (rush.currentIndex >= rushPackages.length) {
      finishTenderRush();
      return;
    }

    rush.timeLeft = Number(challenge.timeLimit || 8);
    rush.locked = false;
    rush.lastResult = null;
    GAME_STATE.progress = Math.round((rush.currentIndex / Math.max(1, rushPackages.length)) * 100);

    renderGame();

    tenderRushTimer = setInterval(() => {
      if (destroyed) return;

      const activeChallenge = getCurrentChallenge();
      const activeRush = GAME_STATE.tenderRush;

      if (!activeChallenge || activeChallenge.type !== 'tenderRush' || !activeRush || activeRush.locked) return;

      activeRush.timeLeft -= 1;
      updateTenderRushClock();

      if (activeRush.timeLeft <= 0) {
        answerTenderRush(null);
      }
    }, 1000);
  }

  function updateTenderRushClock() {
    const challenge = getCurrentChallenge();
    const rush = GAME_STATE.tenderRush;

    if (!challenge || !rush) return;

    const text = root && root.querySelector('#psRushTimeText');
    const bar = root && root.querySelector('#psRushTimeBar');
    const percent = Math.max(0, Math.min(100, (Number(rush.timeLeft || 0) / Number(challenge.timeLimit || 8)) * 100));

    if (text) text.textContent = String(Math.max(0, rush.timeLeft));
    if (bar) bar.style.width = percent + '%';
  }

  function answerTenderRush(methodId) {
    const challenge = getCurrentChallenge();
    const rush = GAME_STATE.tenderRush;

    if (!challenge || challenge.type !== 'tenderRush' || !rush || !rush.started || rush.locked) return;

    const rushPackages = Array.isArray(rush.packages) && rush.packages.length ? rush.packages : (challenge.packages || []);
    const pkg = rushPackages[rush.currentIndex];
    if (!pkg) return;

    clearTenderRushTimers();
    rush.locked = true;

    const isTimeout = !methodId;
    const isCorrect = methodId === pkg.correct;
    const correctMethod = TENDER_RUSH_METHODS[pkg.correct];
    const chosenMethod = methodId ? TENDER_RUSH_METHODS[methodId] : null;

    if (isCorrect) {
      GAME_STATE.score += 10;
      rush.correctCount += 1;
      addLog('ok', `Tender Rush benar: ${pkg.title}`, pkg.explanation);
      showToast('Jalur benar. +10 skor.', 'ok');
      showPanji(`Betul! ${pkg.explanation}`, 'happy');
      flashScreen('ok');
      spawnConfetti();
      rush.lastResult = {
        correct: true,
        message: `${pkg.title} tepat masuk ${correctMethod.label}. ${pkg.explanation}`
      };
    } else {
      GAME_STATE.risk += isTimeout ? 10 : 8;
      GAME_STATE.wrong += 1;
      GAME_STATE.score = Math.max(0, GAME_STATE.score - 4);
      rush.wrongCount += 1;

      const message = isTimeout
        ? `Waktu habis. Seharusnya masuk ${correctMethod.label}. ${pkg.explanation}`
        : `Kamu memilih ${chosenMethod ? chosenMethod.label : 'jalur lain'}, padahal yang lebih tepat ${correctMethod.label}. ${pkg.explanation}`;

      addLog('bad', `Tender Rush belum tepat: ${pkg.title}`, message);
      showToast(isTimeout ? 'Waktu habis. Risiko naik.' : 'Jalur belum tepat. Risiko naik.', 'bad');
      showPanji(message, 'sad');
      flashScreen('bad');
      rush.lastResult = { correct: false, message };
    }

    GAME_STATE.progress = Math.round(((rush.currentIndex + 1) / Math.max(1, rushPackages.length)) * 100);
    renderGame();

    if (rush.wrongCount >= getTenderRushFailLimitByLevel(getCurrentLevelNumber())) {
      tenderRushNextTimer = setTimeout(() => {
        if (!destroyed) stopGameEarly('rushFailed');
      }, 900);
      return;
    }

    tenderRushNextTimer = setTimeout(() => {
      if (destroyed) return;
      rush.currentIndex += 1;

      if (rush.currentIndex >= rushPackages.length) {
        finishTenderRush();
        return;
      }

      beginTenderRushRound();
    }, 1650);
  }

  function finishTenderRush() {
    const challenge = getCurrentChallenge();
    const rush = GAME_STATE.tenderRush;

    if (!challenge || challenge.type !== 'tenderRush' || !rush) return;

    clearTenderRushTimers();
    disableTenderRushKeyboard();

    rush.started = true;
    const rushPackages = Array.isArray(rush.packages) && rush.packages.length ? rush.packages : (challenge.packages || []);
    rush.currentIndex = rushPackages.length;
    rush.locked = true;
    rush.lastResult = null;
    GAME_STATE.progress = 100;
    GAME_STATE.correct += 1;
    GAME_STATE.score += 20;

    addLog('ok', 'Tender Rush selesai', challenge.explanation);
    renderGame();
    showToast('Tender Rush selesai. Otomatis lanjut...', 'ok');
    showPanji('Mantap! Tender Rush selesai. Ini melatih refleks membaca pagu, jenis paket, katalog, dan kondisi pelaksanaan sebelum memilih metode.', 'happy');
    spawnConfetti();
    scheduleAutoNext('Tender Rush selesai. Otomatis lanjut ke soal berikutnya...');
  }

  function bindGameEvents() {
    root.querySelectorAll('.ps-action-card[draggable="true"]').forEach(cardEl => {
      cardEl.addEventListener('dragstart', event => {
        event.dataTransfer.setData('text/plain', cardEl.dataset.cardId);
        event.dataTransfer.effectAllowed = 'move';
        cardEl.classList.add('selected');
      });

      cardEl.addEventListener('dragend', () => {
        cardEl.classList.remove('selected');
      });

      cardEl.addEventListener('click', () => {
        selectCard(cardEl.dataset.cardId);
      });
    });

    root.querySelectorAll('.ps-slot').forEach(slot => {
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
        if (!GAME_STATE.selectedCardId) return;

        const slotIndex = Number(slot.dataset.slotIndex);
        placeCard(GAME_STATE.selectedCardId, slotIndex, slot);
      });
    });

    root.querySelectorAll('[data-answer-index]').forEach(button => {
      button.addEventListener('click', () => {
        answerQuiz(Number(button.dataset.answerIndex), button);
      });
    });

    root.querySelectorAll('[data-rush-method]').forEach(button => {
      button.addEventListener('click', () => {
        answerTenderRush(button.dataset.rushMethod);
      });
    });

    const btnStartTenderRush = root.querySelector('#btnStartTenderRush');
    if (btnStartTenderRush) {
      btnStartTenderRush.addEventListener('click', () => {
        startTenderRush();
      });
    }

    const btnStartBonusRun = root.querySelector('#btnStartBonusRun');
    if (btnStartBonusRun) {
      btnStartBonusRun.addEventListener('click', () => {
        startBonusRun();
      });
    }

    const bonusTapArea = root.querySelector('#psBonusTapArea');
    if (bonusTapArea) {
      bonusTapArea.addEventListener('click', () => {
        handleBonusRunJump();
      });
    }

    const bonusSlideBtn = root.querySelector('#psBonusSlideBtn');
    if (bonusSlideBtn) {
      bonusSlideBtn.addEventListener('click', () => {
        handleBonusRunSlide();
      });
    }

    const bonusUpBtn = root.querySelector('#psBonusUpBtn');
    if (bonusUpBtn) {
      bonusUpBtn.addEventListener('click', () => {
        moveBonusPlane(-48);
      });
    }

    const bonusRunner = root.querySelector('#psBonusRunner');
    if (bonusRunner) {
      bonusRunner.addEventListener('click', () => {
        handleBonusRunJump();
      });
    }

    const btnNext = root.querySelector('#btnNextChallenge');
    const btnRestart = root.querySelector('#btnRestartGame');
    const btnReset = root.querySelector('#btnResetChallenge');
    const btnShuffle = root.querySelector('#btnShuffleCards');
    const btnPanjiHint = root.querySelector('#btnPanjiHint');

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        clearAutoNextTimer();
        nextChallenge();
      });
    }

    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        clearAutoNextTimer();
        startGame();
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        clearAutoNextTimer();
        clearTenderRushTimers();
        disableTenderRushKeyboard();
        clearBonusRunLoop();
        loadChallenge();
      });
    }

    if (btnShuffle) {
      btnShuffle.addEventListener('click', () => {
        const challenge = getCurrentChallenge();

        if (!challenge || challenge.type !== 'pipeline') return;

        GAME_STATE.shuffledCards = shuffleArray(challenge.cards);
        GAME_STATE.selectedCardId = null;

        renderGame();
        showToast('Kartu diacak ulang.', 'info');
        showPanji('Kartu sudah diacak ulang. Coba fokus lagi dari urutan yang paling awal.', 'thinking');
      });
    }

    if (btnPanjiHint) {
      btnPanjiHint.addEventListener('click', () => {
        requestHintFromPanji();
      });
    }
  }

  function selectCard(cardId) {
    if (GAME_STATE.progress === 100) return;

    GAME_STATE.selectedCardId = GAME_STATE.selectedCardId === cardId ? null : cardId;

    if (GAME_STATE.selectedCardId) {
      const challenge = getCurrentChallenge();
      const item = challenge.cards.find(cardItem => cardItem.id === cardId);
      showToast(`Kartu dipilih: ${item ? item.label : cardId}. Klik slot biru.`, 'info');
    }

    renderGame();
  }

  function placeCard(cardId, slotIndex, slotEl) {
    clearPanjiIntroTimers();

    const challenge = getCurrentChallenge();

    if (!challenge || challenge.type !== 'pipeline') return;
    if (GAME_STATE.progress === 100) return;

    const expectedId = challenge.idealIds[slotIndex];
    const item = challenge.cards.find(cardItem => cardItem.id === cardId);

    if (!item) return;

    const alreadyPlaced = GAME_STATE.placed.some(placedItem => placedItem && placedItem.id === cardId);
    if (alreadyPlaced) return;

    const nextEmpty = GAME_STATE.placed.findIndex(placedItem => placedItem === null);

    if (slotIndex !== nextEmpty) {
      wrongMove(cardId, `Isi pipeline dari kiri ke kanan. Slot berikutnya adalah nomor ${nextEmpty + 1}.`);
      return;
    }

    if (cardId !== expectedId) {
      const expected = challenge.cards.find(cardItem => cardItem.id === expectedId);
      wrongMove(cardId, `Kamu memilih "${item.label}", posisi ini seharusnya "${expected ? expected.label : expectedId}".`);
      return;
    }

    GAME_STATE.placed[slotIndex] = item;
    GAME_STATE.selectedCardId = null;
    GAME_STATE.progress = Math.round((getPlacedCount() / challenge.idealIds.length) * 100);
    GAME_STATE.score += 10;
    GAME_STATE.pipelineCombo = Number(GAME_STATE.pipelineCombo || 0) + 1;
    applyLevelTimeBonus(2, 'Kartu benar: bonus waktu');

    if (GAME_STATE.pipelineCombo > 1 && GAME_STATE.pipelineCombo % 3 === 0) {
      applyLevelTimeBonus(4, 'Combo pipeline: bonus waktu');
      showToast('Combo ' + GAME_STATE.pipelineCombo + 'x! Waktu +4 detik', 'ok');
    }

    addLog('ok', `${item.label} benar`, getCorrectMessage(item.id));

    showToast(`Benar: ${item.label}`, 'ok');
    showPanji(getPanjiReactionMessage(item.id), 'happy');
    flashScreen('ok');
    popScore(slotEl || document.body, '+10', 'ok');

    const completed = GAME_STATE.progress === 100;

    renderGame();
    pulseSlot(slotIndex);

    if (completed) {
      clearLevelTimer();
      GAME_STATE.score += 20;
      GAME_STATE.correct += 1;
      addLog('ok', 'Pipeline selesai', challenge.explanation);
      showPanji('Mantap! Pipeline ini selesai dengan benar. Kamu sudah menyusun alur PBJ secara tertib. Kita lanjut ke soal berikutnya ya.', 'happy');
      showToast('Pipeline benar 100%. Otomatis lanjut...', 'ok');
      spawnConfetti();

      scheduleAutoNext('Pipeline selesai. Otomatis lanjut ke soal berikutnya...');
    }
  }

  function pulseSlot(slotIndex) {
    requestAnimationFrame(() => {
      const slot = root.querySelector(`.ps-slot[data-slot-index="${slotIndex}"]`);

      if (!slot) return;

      slot.classList.add('fx-correct');

      setTimeout(() => {
        slot.classList.remove('fx-correct');
      }, 520);
    });
  }

  function shakeCard(cardId) {
    requestAnimationFrame(() => {
      const cardEl = root.querySelector(`.ps-action-card[data-card-id="${cardId}"]`);

      if (!cardEl) return;

      cardEl.classList.remove('wrong');
      void cardEl.offsetWidth;
      cardEl.classList.add('wrong');

      setTimeout(() => {
        cardEl.classList.remove('wrong');
      }, 360);
    });
  }

  function wrongMove(cardId, message) {
    clearPanjiIntroTimers();

    GAME_STATE.risk += 10;
    GAME_STATE.wrong += 1;
    GAME_STATE.score = Math.max(0, GAME_STATE.score - 5);
    GAME_STATE.selectedCardId = null;
    GAME_STATE.pipelineCombo = 0;

    addLog('bad', 'Urutan belum tepat', message);

    showToast('Belum tepat. Risiko naik.', 'bad');
    showPanji(getPanjiWrongMessage(cardId, message), 'sad');
    flashScreen('bad');
    applyLevelTimePenalty(2, 'Pipeline salah');

    if (GAME_STATE.stage === 'result') return;

    renderGame();
    shakeCard(cardId);
  }

  function answerQuiz(selectedIndex, buttonEl) {
    clearPanjiIntroTimers();
    clearLevelTimer();

    const challenge = getCurrentChallenge();

    if (!challenge || challenge.type !== 'quiz') return;
    if (GAME_STATE.answered) return;

    GAME_STATE.selectedAnswer = selectedIndex;
    GAME_STATE.answered = true;

    const correctAnswerIndex = Number.isInteger(challenge.runtimeAnswer) ? challenge.runtimeAnswer : Number(challenge.answer || 0);

    if (selectedIndex === correctAnswerIndex) {
      GAME_STATE.score += 20;
      GAME_STATE.correct += 1;

      addLog('ok', 'Jawaban benar', challenge.explanation);

      showToast('Jawaban benar. Otomatis lanjut...', 'ok');
      showPanji(`Jawabanmu benar! ${challenge.explanation}`, 'happy');
      flashScreen('ok');
      popScore(buttonEl || document.body, '+20', 'ok');
      spawnConfetti();

      renderGame();
      scheduleAutoNext('Jawaban benar. Otomatis lanjut ke soal berikutnya...');
    } else {
      GAME_STATE.risk += 8;
      GAME_STATE.wrong += 1;
      GAME_STATE.score = Math.max(0, GAME_STATE.score - 5);

      addLog('bad', 'Jawaban belum tepat', challenge.explanation);

      showToast('Jawaban belum tepat. Otomatis lanjut setelah pembahasan.', 'bad');
      showPanji(`Yah, belum tepat. Cek pembahasan ini ya: ${challenge.explanation}`, 'sad');
      flashScreen('bad');
      popScore(buttonEl || document.body, '+8 Risiko', 'bad');
      applyLevelTimePenalty(10, 'ABCD salah');

      if (GAME_STATE.stage === 'result') return;

      renderGame();
      scheduleAutoNext('Pembahasan terbuka. Otomatis lanjut ke soal berikutnya...', 2500);
    }
  }

  function getCorrectMessage(cardId) {
    const messages = {
      rup: 'RUP menjadi pintu awal untuk memastikan paket, jadwal, pagu, metode, dan satker.',
      identifikasi: 'Identifikasi kebutuhan mencegah paket tidak relevan, dobel, atau tidak sesuai prioritas.',
      konsolidasi: 'Konsolidasi membantu mengelola kebutuhan sejenis agar tidak terpecah tanpa alasan.',
      kak: 'KAK/spesifikasi harus berbasis kebutuhan dan tidak mengarah.',
      'review-spek': 'Review spesifikasi penting agar persaingan sehat.',
      hps: 'HPS/referensi harga menjadi dasar kewajaran biaya.',
      'cek-pdn': 'PDN/TKDN perlu diperhatikan untuk mendukung produk dalam negeri.',
      'cek-umkk': 'UMK/Koperasi perlu diperhatikan dalam afirmasi belanja pemerintah.',
      'cek-katalog': 'Cek katalog membantu menentukan apakah e-Purchasing dapat digunakan.',
      'katalog-tidak-sesuai': 'Jika katalog tidak menyediakan produk/penyedia sesuai, kondisi itu harus dicatat.',
      'dokumentasi-gagal-katalog': 'Dokumentasi hasil cek katalog menjadi dasar perubahan metode.',
      'evaluasi-metode': 'Evaluasi metode diperlukan agar metode baru sesuai nilai, jenis, dan kondisi paket.',
      'pilih-metode': 'Metode dipilih setelah kebutuhan, nilai, jadwal, dan pasar dipahami.',
      'metode-pl': 'Pengadaan Langsung tepat bila nilai dan kondisi paket sesuai.',
      'metode-epurchasing': 'e-Purchasing tepat jika tersedia di katalog dan sesuai kebutuhan.',
      'mini-kompetisi': 'Mini kompetisi mendukung transparansi dan persaingan sehat pada katalog tertentu.',
      tender: 'Tender dipakai saat karakter paket membutuhkan proses pemilihan formal.',
      seleksi: 'Seleksi relevan untuk jasa konsultansi.',
      swakelola: 'Swakelola dapat dipilih jika memenuhi kriteria.',
      'tim-persiapan': 'Tim persiapan penting dalam penyelenggaraan swakelola.',
      'tim-pelaksana': 'Tim pelaksana menjalankan pekerjaan swakelola.',
      'tim-pengawas': 'Tim pengawas memastikan swakelola terkendali.',
      klarifikasi: 'Klarifikasi/negosiasi memastikan harga, spesifikasi, dan kemampuan pelaksanaan.',
      proses: 'Proses pemilihan dilakukan setelah dokumen dan metode siap.',
      kontrak: 'Kontrak/SPK menjadi dasar pelaksanaan setelah proses pengadaan.',
      'monitoring-kontrak': 'Monitoring kontrak mengendalikan waktu, mutu, volume, dan kewajiban penyedia.',
      'uang-muka': 'Uang muka, jaminan, dan syarat kontrak perlu dikelola tertib.',
      'identifikasi-perubahan': 'Perubahan kontrak harus diawali identifikasi kondisi perubahan.',
      'kaji-kontrak': 'Klausul kontrak perlu dikaji sebelum adendum.',
      'justifikasi-teknis': 'Justifikasi teknis menjadi dasar perubahan kontrak.',
      'negosiasi-perubahan': 'Negosiasi perubahan membahas dampak harga, waktu, dan volume.',
      'adendum-kontrak': 'Adendum dituangkan secara tertulis sebelum perubahan dilaksanakan lebih lanjut.',
      teguran: 'Teguran/evaluasi diperlukan saat penyedia terlambat atau bermasalah.',
      pemeriksaan: 'Pemeriksaan hasil mencegah barang/jasa tidak sesuai langsung diterima.',
      bast: 'BAST dilakukan setelah hasil diperiksa dan sesuai.',
      pembayaran: 'Pembayaran dilakukan setelah dokumen pendukung memadai.',
      realisasi: 'Pencatatan realisasi memastikan data monitoring tidak bolong.'
    };

    return messages[cardId] || 'Langkah ini benar pada posisi pipeline saat ini.';
  }

  function getPanjiReactionMessage(cardId) {
    const messages = {
      rup:
        'Betul. Cek RUP dulu di SiRUP untuk memastikan paket sudah diumumkan, pagu, metode, jadwal, dan satkernya sesuai sebelum proses lanjut. Dari RUP ini kita tahu prosesnya tidak loncat dari perencanaan.',

      identifikasi:
        'Betul. Identifikasi kebutuhan itu pondasi awal. PPK perlu memastikan barang atau jasa memang dibutuhkan, volumenya jelas, lokasinya jelas, waktunya masuk akal, dan tidak dobel dengan paket lain.',

      konsolidasi:
        'Betul. Kalau kebutuhannya sejenis, pikirkan konsolidasi dulu. Ini bisa membantu efisiensi, menguatkan posisi belanja pemerintah, dan mencegah paket dipecah-pecah tanpa alasan yang kuat.',

      'review-spek':
        'Betul. Spesifikasi perlu direview supaya tidak mengarah ke merek atau penyedia tertentu. Spek harus menjelaskan kebutuhan dan standar kinerja, bukan mengunci calon pemenang.',

      kak:
        'Betul. KAK atau spesifikasi menjelaskan kebutuhan secara teknis, ruang lingkup, output, jadwal, lokasi, dan standar yang harus dipenuhi. KAK yang rapi bikin proses berikutnya lebih aman.',

      hps:
        'Betul. Setelah KAK jelas, HPS atau referensi harga disusun sebagai dasar kewajaran harga. Jangan asal ambil angka tanpa survei, pembanding, katalog, pasar, atau dasar yang masuk akal.',

      'cek-pdn':
        'Betul. Cek PDN dan TKDN penting untuk mendukung penggunaan produk dalam negeri. Kalau produk dalam negeri tersedia dan sesuai, jangan langsung lari ke produk impor.',

      'cek-umkk':
        'Betul. Afirmasi UMK dan koperasi perlu diperhatikan. Belanja pemerintah bukan cuma mengejar barang cepat datang, tapi juga mendorong pelaku usaha kecil dan koperasi bila sesuai.',

      'cek-katalog':
        'Betul. Cek e-Katalog dulu untuk melihat apakah barang atau jasa tersedia, spesifikasinya sesuai, penyedianya ada, harganya wajar, TKDN-nya cocok, dan proses e-Purchasing bisa dipertanggungjawabkan.',

      'katalog-tidak-sesuai':
        'Betul. Kalau katalog tidak menyediakan produk atau penyedia yang sesuai, kondisi itu harus dicatat. Jangan memaksakan e-Purchasing kalau barangnya tidak cocok dengan kebutuhan.',

      'dokumentasi-gagal-katalog':
        'Betul. Dokumentasi hasil cek katalog penting sebagai bukti kenapa metode awal tidak bisa dilanjutkan. Simpan dasar pengecekan agar perubahan metode tidak terlihat asal-asalan.',

      'evaluasi-metode':
        'Betul. Setelah ada bukti katalog tidak sesuai, metode perlu dievaluasi ulang berdasarkan nilai paket, jenis pengadaan, kondisi pasar, ketersediaan penyedia, dan ketentuan yang berlaku.',

      'pilih-metode':
        'Betul. Metode dipilih setelah kebutuhan, HPS, kondisi pasar, jenis pengadaan, dan nilai paket jelas. Jangan pilih metode hanya karena paling cepat atau paling gampang.',

      'metode-pl':
        'Betul. Pengadaan Langsung bisa dipakai kalau nilai dan kondisinya sesuai. Kalau nilainya melewati batas atau paketnya kompleks, jangan dipaksa jadi Pengadaan Langsung.',

      'metode-epurchasing':
        'Betul. e-Purchasing tepat kalau barang atau jasa tersedia di katalog, spesifikasinya sesuai, penyedianya ada, dan prosesnya bisa dipertanggungjawabkan.',

      'mini-kompetisi':
        'Betul. Mini kompetisi dipakai untuk memberi kesempatan yang sama kepada penyedia katalog dan menjaga persaingan sehat, terutama pada sektor yang mewajibkan mekanisme tersebut.',

      tender:
        'Betul. Tender dipakai untuk paket yang memerlukan proses pemilihan formal dan kompetitif, terutama jika nilai atau karakter pekerjaannya tidak cocok dengan metode sederhana.',

      seleksi:
        'Betul. Untuk jasa konsultansi, metode seleksi sering digunakan karena yang dinilai bukan cuma harga, tapi juga kualitas keahlian, pengalaman, dan pendekatan teknis.',

      swakelola:
        'Betul. Swakelola digunakan kalau kegiatan memenuhi kriteria swakelola. Tetap harus ada perencanaan, KAK, anggaran, pelaksanaan, pengawasan, dan pertanggungjawaban.',

      'tim-persiapan':
        'Betul. Dalam swakelola, tim persiapan penting untuk menyusun sasaran, rencana kegiatan, KAK, jadwal, dan kebutuhan pelaksanaan secara jelas.',

      'tim-pelaksana':
        'Betul. Tim pelaksana menjalankan pekerjaan swakelola. Jadi tidak cukup cuma niat swakelola, pelaksananya harus jelas.',

      'tim-pengawas':
        'Betul. Tim pengawas menjaga agar pelaksanaan swakelola sesuai rencana, mutu, waktu, dan output yang sudah ditetapkan.',

      klarifikasi:
        'Betul. Klarifikasi atau negosiasi memastikan harga, spesifikasi, jadwal, dan kemampuan pelaksanaan benar-benar masuk akal sebelum kontrak dilakukan.',

      proses:
        'Betul. Proses pemilihan dilakukan setelah dokumen dan metode siap. Jangan lompat ke kontrak sebelum proses pemilihannya tertib dan bisa dipertanggungjawabkan.',

      kontrak:
        'Betul. Kontrak atau SPK menjadi dasar pelaksanaan pekerjaan. Ini dilakukan setelah proses pengadaan selesai dan penyedia atau pelaksana sudah ditetapkan.',

      'monitoring-kontrak':
        'Betul. Setelah kontrak berjalan, PPK wajib memantau waktu, mutu, volume, progres, dan kewajiban penyedia. Jangan baru sadar bermasalah saat mau BAST.',

      'uang-muka':
        'Betul. Kalau ada uang muka atau jaminan, pengelolaannya harus sesuai ketentuan kontrak. Ini bagian penting dari pengendalian risiko pelaksanaan.',

      teguran:
        'Betul. Kalau penyedia terlambat atau tidak sesuai, lakukan teguran atau evaluasi. Masalah kontrak harus dikendalikan, bukan dibiarkan sampai akhir.',

      pemeriksaan:
        'Betul. Pemeriksaan hasil dilakukan sebelum BAST. Barang atau pekerjaan harus dicek dulu kesesuaiannya dengan kontrak, spesifikasi, volume, dan kualitas.',

      bast:
        'Betul. BAST dilakukan setelah hasil pekerjaan atau barang sesuai. Jangan BAST kalau barang belum diperiksa, belum lengkap, atau masih bermasalah.',

      pembayaran:
        'Betul. Pembayaran dilakukan setelah dokumen pendukung lengkap, prestasi pekerjaan sesuai, dan proses serah terima tertib.',

      realisasi:
        'Betul. Realisasi harus dicatat supaya data monitoring tidak bolong, termasuk untuk evaluasi, laporan, dan pemantauan kinerja pengadaan.',

      'identifikasi-perubahan':
        'Betul. Kalau ada perubahan kontrak, mulai dari identifikasi dulu: apa yang berubah, kenapa berubah, dan dampaknya ke volume, waktu, mutu, atau biaya.',

      'kaji-kontrak':
        'Betul. Sebelum adendum, klausul kontrak harus dikaji. Tidak semua perubahan bisa langsung ditulis jadi adendum tanpa dasar kontraktual.',

      'justifikasi-teknis':
        'Betul. Justifikasi teknis menjelaskan alasan perubahan secara tertib. Ini penting supaya adendum tidak terlihat asal mengubah kontrak.',

      'negosiasi-perubahan':
        'Betul. Perubahan kontrak perlu dibahas dampaknya, termasuk harga, waktu, volume, mutu, dan risiko. Jangan sampai perubahan merugikan atau tidak jelas dasarnya.',

      'adendum-kontrak':
        'Betul. Adendum kontrak menuangkan perubahan secara tertulis. Setelah itu pelaksanaan lanjut sesuai perubahan yang sudah disepakati.'
    };

    return messages[cardId] || 'Betul. Langkah itu sudah tepat di posisi pipeline ini. Lanjutkan dengan urutan yang tertib dan jangan lompat proses.';
  }

  function getPanjiWrongMessage(cardId, fallbackMessage) {
    const messages = {
      'kontrak-awal':
        'Aduh, jangan kontrak dulu. Kontrak atau SPK baru aman setelah dokumen siap, metode jelas, proses pemilihan selesai, dan penyedia sudah ditetapkan.',

      'pecah-paket':
        'Waduh, hati-hati. Pecah paket tanpa alasan kuat bisa dianggap menghindari metode yang seharusnya. Kalau kebutuhan sejenis, pikirkan konsolidasi.',

      'spek-mengarah':
        'Jangan pakai spek mengarah. Spesifikasi harus menjelaskan kebutuhan, bukan mengunci merek atau penyedia tertentu.',

      'abaikan-katalog':
        'Jangan abaikan katalog. Untuk barang atau jasa yang berpotensi tersedia di e-Katalog, cek dulu kesesuaian produk, penyedia, harga, TKDN, dan kebutuhan.',

      'lanjut-epurchasing-paksa':
        'Jangan memaksa e-Purchasing kalau produk atau penyedia di katalog tidak sesuai kebutuhan. Dokumentasikan hasil cek dulu, baru evaluasi metode.',

      'ganti-metode-tanpa-bukti':
        'Jangan ganti metode tanpa bukti. Perubahan metode harus punya dasar, misalnya hasil cek katalog tidak sesuai dan dokumentasi pendukungnya jelas.',

      'lewati-rup':
        'Jangan lewati RUP. RUP di SiRUP adalah pintu awal untuk memastikan paket memang sudah direncanakan dan diumumkan.',

      'bast-tanpa-cek':
        'Jangan BAST tanpa pemeriksaan. Barang atau pekerjaan harus dicek dulu kesesuaiannya dengan kontrak, volume, spesifikasi, dan kualitas.',

      'bayar-dulu':
        'Jangan bayar dulu. Pembayaran harus menunggu prestasi pekerjaan, dokumen pendukung, dan serah terima yang tertib.',

      'tunda-dokumen':
        'Jangan tunda dokumen. Dalam PBJ, bukti dan administrasi itu bagian dari akuntabilitas, bukan pelengkap belakangan.',

      'metode-asal-cepat':
        'Jangan pilih metode hanya karena cepat. Metode harus sesuai nilai paket, jenis pengadaan, kondisi pasar, dan ketentuan.',

      'realisasi-lupa':
        'Jangan lupa catat realisasi. Kalau realisasi tidak dicatat, monitoring dan laporan kinerja pengadaan jadi bolong.',

      'adendum-tanpa-dasar':
        'Jangan membuat adendum tanpa dasar. Perubahan kontrak harus diawali identifikasi, kajian klausul, justifikasi teknis, dan kesepakatan yang tertib.',

      'bayar-sebelum-adendum':
        'Jangan bayar sebelum perubahan kontrak tertib. Kalau ada perubahan volume, waktu, atau nilai, rapikan dasar dan adendumnya dulu.',

      'swakelola-tanpa-tim':
        'Jangan swakelola tanpa tim yang jelas. Swakelola perlu tim persiapan, tim pelaksana, dan tim pengawas agar peran dan kontrolnya tertib.',

      'abaikan-pdn':
        'Jangan abaikan PDN/TKDN. Afirmasi produk dalam negeri menjadi bagian penting dalam kebijakan PBJ dan belanja katalog.'
    };

    return messages[cardId] || `Aduh, belum tepat. ${fallbackMessage}`;
  }



  const WOLF_SAFE_ROLES = [
    { id: 'ppk', name: 'PPK Baik', icon: '🧑‍💼', side: 'safe', desc: 'Menjaga dokumen, kebutuhan, dan proses tetap tertib.' },
    { id: 'pokja', name: 'Pokja Teliti', icon: '🕵️', side: 'safe', desc: 'Membaca dokumen dengan detail dan mencari kejanggalan.' },
    { id: 'pphp', name: 'PPHP Pemeriksa', icon: '🔬', side: 'safe', desc: 'Memeriksa hasil sebelum serah terima.' },
    { id: 'auditor', name: 'Auditor', icon: '📊', side: 'safe', desc: 'Melihat pola risiko dan bukti pendukung.' },
    { id: 'adminSirup', name: 'Admin SiRUP', icon: '📋', side: 'safe', desc: 'Memastikan perencanaan dan pengumuman paket tertib.' },
    { id: 'panjiRole', name: 'PANJI', icon: '🪽', side: 'safe', desc: 'Asisten Pengadaan Jitu yang membaca sinyal risiko.' }
  ];

  const WOLF_RISK_ROLES = [
    { id: 'spekMengarahWolf', name: 'Spek Mengarah', icon: '🚫', side: 'risk', signature: 'spesifikasi tiba-tiba terlalu sempit, seperti mengarah ke merek/penyedia tertentu', clue: 'Perhatikan perubahan spesifikasi yang terlalu detail dan tidak netral.' },
    { id: 'pecahPaketWolf', name: 'Pecah Paket', icon: '💣', side: 'risk', signature: 'paket sejenis mendadak terbagi kecil-kecil dengan waktu berdekatan', clue: 'Lihat pola paket mirip, nilai mepet, dan jadwal berdekatan.' },
    { id: 'kontrakDuluWolf', name: 'Kontrak Duluan', icon: '🚨', side: 'risk', signature: 'dokumen kontrak muncul sebelum proses pemilihan benar-benar tertib', clue: 'Cari siapa yang mendorong lompat proses.' },
    { id: 'bayarSebelumBastWolf', name: 'Bayar Sebelum BAST', icon: '💸', side: 'risk', signature: 'pembayaran didorong padahal pemeriksaan/BAST belum jelas', clue: 'Cek aktor yang memaksa pembayaran cepat tanpa bukti cukup.' },
    { id: 'penyediaTitipanWolf', name: 'Penyedia Titipan', icon: '🎭', side: 'risk', signature: 'satu penyedia terasa sudah diarahkan sejak awal diskusi', clue: 'Waspadai kalimat yang mengarahkan ke satu penyedia.' },
    { id: 'rupGelapWolf', name: 'RUP Gelap', icon: '🌑', side: 'risk', signature: 'paket diproses tanpa jejak perencanaan yang jelas di RUP/SiRUP', clue: 'Cek apakah dasar perencanaannya lemah atau sengaja diabaikan.' }
  ];

  const WOLF_CASES = [
    {
      title: 'Spesifikasi Paket Tiba-tiba Berubah',
      night: 'Malam ini, ada satu paket yang tiba-tiba berubah spesifikasinya menjadi terlalu sempit dan terasa mengarah.',
      panji: 'PANJI menemukan jejak perubahan spesifikasi yang tidak biasa. Siapa aktor risiko yang paling mungkin merusak paket?',
      likely: 'spekMengarahWolf'
    },
    {
      title: 'Paket Sejenis Pecah Menjadi Beberapa Bagian',
      night: 'Malam ini, paket sejenis muncul dalam beberapa bagian kecil dengan nilai yang terlihat sengaja dibuat aman.',
      panji: 'PANJI melihat pola nilai dan jadwal yang mencurigakan. Siapa penyusupnya?',
      likely: 'pecahPaketWolf'
    },
    {
      title: 'Kontrak Muncul Terlalu Cepat',
      night: 'Malam ini, rancangan kontrak sudah bergerak duluan padahal proses pemilihan belum selesai dengan rapi.',
      panji: 'PANJI mencium proses yang melompat. Siapa yang mendorong kejadian ini?',
      likely: 'kontrakDuluWolf'
    },
    {
      title: 'Pembayaran Didorong Sebelum Barang Diperiksa',
      night: 'Malam ini, ada tekanan agar pembayaran segera diproses meskipun pemeriksaan dan BAST belum jelas.',
      panji: 'PANJI melihat risiko pembayaran sebelum bukti memadai. Siapa perusaknya?',
      likely: 'bayarSebelumBastWolf'
    },
    {
      title: 'Penyedia Tertentu Mendadak Selalu Disebut',
      night: 'Malam ini, diskusi paket terasa mengarah ke satu penyedia tertentu sejak awal.',
      panji: 'PANJI mendengar pola kalimat yang terlalu mengarahkan. Siapa penyusupnya?',
      likely: 'penyediaTitipanWolf'
    },
    {
      title: 'Paket Jalan Tanpa Dasar RUP yang Jelas',
      night: 'Malam ini, satu paket bergerak cepat tanpa jejak perencanaan yang kuat di RUP/SiRUP.',
      panji: 'PANJI kehilangan jejak perencanaan. Siapa aktor risiko yang paling cocok?',
      likely: 'rupGelapWolf'
    }
  ];

  function createBonusRunState(challenge) {
    const difficulty = challenge && challenge.bonusMode === 'auditWolf8' ? 'hard' : 'normal';
    const rounds = difficulty === 'hard' ? 4 : 3;
    return {
      mode: 'auditWolf',
      difficulty,
      started: false,
      finished: false,
      phase: 'intro',
      round: 1,
      maxRounds: rounds,
      score: 0,
      correct: 0,
      wrong: 0,
      riskMeter: difficulty === 'hard' ? 34 : 24,
      eliminated: [],
      suspects: [],
      currentCase: null,
      culprit: null,
      selectedVote: '',
      discussion: [],
      revealText: '',
      panjiLine: 'Audit Wolf siap dimulai. Dengarkan laporan malam, baca diskusi bot, lalu pilih aktor risiko yang paling mencurigakan.'
    };
  }

  function getBonusRunState() {
    if (!GAME_STATE.bonusRun) GAME_STATE.bonusRun = createBonusRunState(getCurrentChallenge() || {});
    return GAME_STATE.bonusRun;
  }

  function clearBonusRunLoop() {
    if (bonusRunFrame) {
      cancelAnimationFrame(bonusRunFrame);
      bonusRunFrame = null;
    }
    if (bonusRunKeyHandler) {
      document.removeEventListener('keydown', bonusRunKeyHandler);
      bonusRunKeyHandler = null;
    }
  }

  function startBonusRun() {
    const challenge = getCurrentChallenge();
    const run = getBonusRunState();
    if (!challenge || challenge.type !== 'bonusRun' || !run) return;

    run.started = true;
    run.finished = false;
    run.phase = 'night';
    run.round = 1;
    run.score = 0;
    run.correct = 0;
    run.wrong = 0;
    run.riskMeter = run.difficulty === 'hard' ? 34 : 24;
    run.eliminated = [];
    prepareWolfRound();
    showPanji('Malam pertama dimulai. Ada penyusup yang merusak paket. Baca jejak kasusnya, lalu bantu aku voting aktor risiko yang paling mencurigakan.', 'thinking');
    renderGame();
  }

  function prepareWolfRound() {
    const run = getBonusRunState();
    const casePool = shuffleArray(WOLF_CASES);
    let selectedCase = casePool.find(item => !run.currentCase || item.title !== run.currentCase.title) || casePool[0];
    const riskPool = shuffleArray(WOLF_RISK_ROLES);
    let culprit = riskPool.find(item => item.id === selectedCase.likely) || riskPool[0];
    if (run.difficulty === 'hard' && Math.random() < 0.35) {
      culprit = riskPool[0];
      selectedCase = { ...selectedCase, likely: culprit.id, panji: selectedCase.panji + ' Jejaknya agak samar, jangan langsung percaya bot yang terlalu yakin.' };
    }

    const safeCount = run.difficulty === 'hard' ? 3 : 2;
    const riskCount = run.difficulty === 'hard' ? 4 : 3;
    const risks = shuffleArray([culprit, ...riskPool.filter(item => item.id !== culprit.id)]).slice(0, riskCount);
    const safes = shuffleArray(WOLF_SAFE_ROLES).slice(0, safeCount);
    const suspects = shuffleArray([...risks, ...safes]).map((item, index) => ({ ...item, seat: index + 1 }));

    run.currentCase = selectedCase;
    run.culprit = culprit;
    run.suspects = suspects;
    run.selectedVote = '';
    run.revealText = '';
    run.discussion = buildWolfDiscussion(run);
    run.panjiLine = selectedCase.panji;
  }

  function buildWolfDiscussion(run) {
    const names = run.suspects.map(item => item.name);
    const culpritName = run.culprit.name;
    const safeLines = [
      `Pokja Teliti: Aku lihat perubahan ini tidak wajar. Cek pola, jangan cuma percaya suara paling keras.`,
      `Auditor: Jejak risikonya kuat. Pelaku biasanya meninggalkan tanda di proses, nilai, atau dokumen.`,
      `Admin SiRUP: Aku ingin lihat dasar perencanaannya. Kalau RUP lemah, harus hati-hati.`,
      `PPHP Pemeriksa: Jangan sampai barang diterima atau dibayar sebelum hasilnya jelas.`
    ];
    const mislead = shuffleArray(names.filter(name => name !== culpritName)).slice(0, 2);
    const wolfLines = [
      `${culpritName}: Menurutku ini biasa saja, jangan dibesar-besarkan. Kita pilih yang lain saja.`,
      `${mislead[0] || 'Bot OPD'}: Aku curiga ${mislead[1] || 'aktor lain'}, tapi buktinya belum kuat.`,
      `PANJI: Ada yang sedang mengalihkan perhatian. Cocokkan cerita malam dengan signature masing-masing aktor.`
    ];
    return shuffleArray([...safeLines.slice(0, run.difficulty === 'hard' ? 3 : 2), ...wolfLines]);
  }

  function advanceWolfPhase(next) {
    const run = getBonusRunState();
    if (!run || run.finished) return;
    run.phase = next;
    if (next === 'discussion') {
      run.panjiLine = 'Diskusi dimulai. Jangan percaya satu kalimat saja. Cocokkan bukti malam dengan ciri risiko aktor.';
    } else if (next === 'vote') {
      run.panjiLine = 'Saatnya voting. Pilih aktor risiko yang paling sesuai dengan jejak kasus.';
    } else if (next === 'morning') {
      run.panjiLine = run.currentCase.panji;
    }
    renderGame();
  }

  function voteWolfSuspect(roleId) {
    const run = getBonusRunState();
    if (!run || run.phase !== 'vote') return;

    const choice = run.suspects.find(item => item.id === roleId);
    const isCorrect = roleId === run.culprit.id;
    run.selectedVote = roleId;
    run.phase = 'reveal';

    if (isCorrect) {
      run.correct += 1;
      run.score += run.difficulty === 'hard' ? 90 : 75;
      run.riskMeter = Math.max(0, run.riskMeter - (run.difficulty === 'hard' ? 18 : 22));
      GAME_STATE.score += run.difficulty === 'hard' ? 35 : 30;
      GAME_STATE.correct += 1;
      run.revealText = `Benar! ${choice.name} adalah aktor risiko. ${run.culprit.clue} Risiko paket turun.`;
      showPanji('Tebakanmu benar! Risiko PBJ turun. Kamu membaca jejak kasus dengan bagus.', 'happy');
      spawnConfetti();
    } else {
      run.wrong += 1;
      run.score = Math.max(0, run.score - 25);
      run.riskMeter = Math.min(100, run.riskMeter + (run.difficulty === 'hard' ? 18 : 14));
      GAME_STATE.risk += run.difficulty === 'hard' ? 8 : 6;
      GAME_STATE.wrong += 1;
      run.revealText = `Belum tepat. Kamu memilih ${choice ? choice.name : 'aktor lain'}, padahal pelakunya ${run.culprit.name}. ${run.culprit.clue} Paket makin rawan.`;
      showPanji('Yah, belum tepat. Penyusup berhasil mengalihkan perhatian. Baca lagi signature risikonya.', 'sad');
    }

    addLog(isCorrect ? 'ok' : 'bad', `Audit Wolf ronde ${run.round}`, run.revealText);
    renderGame();
  }

  function nextWolfRound() {
    const run = getBonusRunState();
    if (!run || run.finished) return;

    if (run.round >= run.maxRounds) {
      finishBonusRun();
      return;
    }

    run.round += 1;
    run.phase = 'night';
    prepareWolfRound();
    showPanji(`Ronde ${run.round} dimulai. Malam kembali turun, penyusup mencoba merusak paket lagi.`, 'thinking');
    renderGame();
  }

  function finishBonusRun() {
    const challenge = getCurrentChallenge();
    const run = getBonusRunState();
    if (!challenge || challenge.type !== 'bonusRun' || !run || run.finished) return;

    run.finished = true;
    run.phase = 'finished';
    GAME_STATE.progress = 100;
    GAME_STATE.score += Math.max(10, run.score);
    if (run.correct >= Math.ceil(run.maxRounds / 2)) GAME_STATE.correct += 1;
    else GAME_STATE.wrong += 1;

    const resultText = run.correct >= Math.ceil(run.maxRounds / 2)
      ? `Audit Wolf selesai. Kamu berhasil membaca ${run.correct}/${run.maxRounds} penyusup. Risiko terkendali dan tim aman makin percaya diri.`
      : `Audit Wolf selesai. Kamu baru menemukan ${run.correct}/${run.maxRounds} penyusup. Tidak apa-apa, ini latihan membaca pola risiko.`;

    addLog(run.correct >= Math.ceil(run.maxRounds / 2) ? 'ok' : 'bad', 'Bonus Audit Wolf selesai', resultText);
    showToast('Audit Wolf selesai. Otomatis lanjut...', 'ok');
    showPanji(resultText + ' Kita lanjut ke level berikutnya.', run.correct >= Math.ceil(run.maxRounds / 2) ? 'happy' : 'thinking');
    renderGame();
    scheduleAutoNext('Bonus selesai. Otomatis lanjut ke level berikutnya...');
  }

  function renderBonusRunChallenge(challenge) {
    const run = getBonusRunState() || createBonusRunState(challenge);
    const isHard = run.difficulty === 'hard';

    if (!run.started) {
      return `
        <div class="wolf-shell ${isHard ? 'hard' : 'normal'}">
          <div class="wolf-hero-card">
            <div class="wolf-kicker">${isHard ? 'Level 8 Bonus' : 'Level 4 Bonus'} • Werewolf PBJ Single Player vs Bot</div>
            <h3>🐺 Audit Wolf: Siapa Perusak Paket?</h3>
            <p>
              Malam hari penyusup merusak paket. Pagi hari PANJI membacakan laporan. Bot akan berdiskusi,
              lalu kamu voting siapa aktor risiko yang paling mencurigakan. Ini bonus game, bukan soal PBJ berat.
            </p>
            <div class="wolf-role-strip">
              <span>🧑‍💼 PPK Baik</span><span>🕵️ Pokja Teliti</span><span>📊 Auditor</span><span>🚫 Spek Mengarah</span><span>💣 Pecah Paket</span><span>💸 Bayar Sebelum BAST</span>
            </div>
            <button type="button" class="ps-btn ps-btn-primary wolf-start-btn" id="btnStartBonusRun">Mulai Audit Wolf</button>
          </div>
        </div>
      `;
    }

    const suspectCards = run.suspects.map(item => {
      const voted = run.selectedVote === item.id ? 'voted' : '';
      const revealed = run.phase === 'reveal' || run.phase === 'finished';
      const correct = revealed && item.id === run.culprit.id ? 'correct' : '';
      const wrong = revealed && run.selectedVote === item.id && item.id !== run.culprit.id ? 'wrong' : '';
      const disabled = run.phase !== 'vote' ? 'disabled' : '';
      return `
        <button type="button" class="wolf-suspect ${voted} ${correct} ${wrong}" data-wolf-vote="${escapeHtml(item.id)}" ${disabled}>
          <span class="wolf-seat">${item.seat}</span>
          <span class="wolf-icon">${item.icon}</span>
          <strong>${escapeHtml(item.name)}</strong>
          <small>${escapeHtml(item.side === 'risk' && revealed ? item.signature : item.desc || 'Peran masih misterius.')}</small>
        </button>
      `;
    }).join('');

    const discussion = run.discussion.map((line, index) => `
      <div class="wolf-chat ${index % 2 ? 'bot' : 'safe'}">
        <span>${index % 2 ? '🤖' : '💬'}</span>
        <p>${escapeHtml(line)}</p>
      </div>
    `).join('');

    const phaseBody = run.phase === 'night' ? `
      <div class="wolf-phase-panel night">
        <div class="wolf-moon">🌙</div>
        <h4>Malam</h4>
        <p>${escapeHtml(run.currentCase.night)}</p>
        <button type="button" class="ps-btn ps-btn-primary" data-wolf-phase="morning">Lanjut ke Pagi</button>
      </div>
    ` : run.phase === 'morning' ? `
      <div class="wolf-phase-panel morning">
        <div class="wolf-sun">☀️</div>
        <h4>Pagi</h4>
        <p>${escapeHtml(run.panjiLine)}</p>
        <button type="button" class="ps-btn ps-btn-primary" data-wolf-phase="discussion">Mulai Diskusi Bot</button>
      </div>
    ` : run.phase === 'discussion' ? `
      <div class="wolf-discussion">
        <h4>Diskusi Bot</h4>
        ${discussion}
        <button type="button" class="ps-btn ps-btn-primary" data-wolf-phase="vote">Masuk Voting</button>
      </div>
    ` : run.phase === 'vote' ? `
      <div class="wolf-vote-note">
        <h4>Voting</h4>
        <p>Pilih satu aktor yang paling sesuai dengan cerita malam dan signature risikonya.</p>
      </div>
    ` : `
      <div class="wolf-reveal ${run.selectedVote === run.culprit.id ? 'win' : 'lose'}">
        <h4>${run.selectedVote === run.culprit.id ? '✅ Penyusup Terbongkar' : '⚠️ Penyusup Lolos'}</h4>
        <p>${escapeHtml(run.revealText)}</p>
        <button type="button" class="ps-btn ps-btn-primary" data-wolf-next>
          ${run.round >= run.maxRounds ? 'Selesaikan Bonus' : 'Lanjut Ronde Berikutnya'}
        </button>
      </div>
    `;

    return `
      <div class="wolf-shell ${isHard ? 'hard' : 'normal'}">
        <div class="wolf-hud">
          <div><label>Ronde</label><b>${run.round}/${run.maxRounds}</b></div>
          <div><label>Benar</label><b>${run.correct}</b></div>
          <div><label>Salah</label><b>${run.wrong}</b></div>
          <div><label>Skor Wolf</label><b>${run.score}</b></div>
          <div><label>Risiko Paket</label><b>${run.riskMeter}%</b></div>
        </div>
        <div class="wolf-risk-track"><span style="width:${Math.max(0, Math.min(100, run.riskMeter))}%"></span></div>
        <div class="wolf-case-card">
          <div class="wolf-case-top">
            <span>${run.phase === 'night' ? '🌙 Malam' : run.phase === 'morning' ? '☀️ Pagi' : run.phase === 'discussion' ? '🗣️ Diskusi' : run.phase === 'vote' ? '🗳️ Voting' : '🔎 Hasil'}</span>
            <b>${escapeHtml(run.currentCase.title)}</b>
          </div>
          ${phaseBody}
        </div>
        <div class="wolf-board">
          ${suspectCards}
        </div>
      </div>
    `;
  }

  const __wolfBindGameEvents = bindGameEvents;
  bindGameEvents = function () {
    __wolfBindGameEvents();
    if (!root) return;
    root.querySelectorAll('[data-wolf-phase]').forEach(button => {
      button.addEventListener('click', () => advanceWolfPhase(button.dataset.wolfPhase));
    });
    root.querySelectorAll('[data-wolf-vote]').forEach(button => {
      button.addEventListener('click', () => voteWolfSuspect(button.dataset.wolfVote));
    });
    const next = root.querySelector('[data-wolf-next]');
    if (next) next.addEventListener('click', nextWolfRound);
  };

  function getHintMessage(challenge) {
    if (!challenge) return 'PANJI belum punya hint untuk soal ini.';
    if (challenge.type === 'bonusRun') {
      const run = getBonusRunState();
      if (!run || !run.currentCase) return 'Hint Audit Wolf: cocokkan cerita malam dengan ciri aktor risiko. Jangan percaya bot yang terlalu cepat mengalihkan tuduhan.';
      return `Hint Audit Wolf: kasusnya tentang "${run.currentCase.title}". ${run.culprit ? run.culprit.clue : 'Cocokkan pola kejadian dengan signature aktor risiko.'}`;
    }
    if (challenge.type === 'tenderRush') {
      const pkg = getActiveTenderRushPackage(challenge);
      if (pkg) return `Hint Tender Rush: paket "${pkg.title}" lebih aman masuk jalur ${TENDER_RUSH_METHODS[pkg.correct] ? TENDER_RUSH_METHODS[pkg.correct].label : 'metode yang sesuai'}. ${pkg.explanation}`;
      return 'Hint Tender Rush: baca jenis paket, pagu, dan clue. Jangan asal pilih metode tercepat.';
    }
    if (challenge.type === 'pipeline') {
      const nextEmpty = GAME_STATE.placed.findIndex(item => item === null);
      const expectedId = challenge.idealIds && challenge.idealIds[nextEmpty];
      const expectedCard = challenge.cards && challenge.cards.find(item => item.id === expectedId);
      if (expectedCard) return `Hint PANJI: slot berikutnya cari kartu "${expectedCard.label}". Susun dari kiri ke kanan dan hindari jebakan.`;
      return 'Hint PANJI: cek lagi urutan tahap PBJ dari awal sampai akhir.';
    }
    return challenge.hint ? `Hint PANJI: ${challenge.hint}` : 'Baca kata kunci soal dan pilih jawaban paling sesuai prinsip PBJ.';
  }

  function panjiForChallenge(challenge) {
    if (!challenge) return;
    if (challenge.type === 'bonusRun') {
      showPanji('Bonus Audit Wolf dimulai. Ini single player vs bot: malam ada paket dirusak, pagi aku umumkan jejaknya, lalu kamu voting aktor risiko.', 'thinking');
      return;
    }
    if (challenge.type === 'tenderRush') {
      showPanji('Ini Tender Rush. Baca jenis paket, pagu, dan clue. Pilih tombol 1 sampai 5 sesuai metode paling aman.', 'thinking');
      return;
    }
    if (challenge.type === 'pipeline') {
      showPanji('Ini soal pipeline. Susun kartu dari kiri ke kanan secara tertib. Jangan lompat proses dan hindari kartu jebakan.', 'thinking');
      return;
    }
    showPanji('Ini soal ABCD. Baca kata kunci dan pilih jawaban yang paling sesuai prinsip PBJ.', 'thinking');
  }

  window.__moduleInit = function ({ container }) {
    destroyed = false;
    containerRef = container;
    root = container.querySelector('#procstackRoot');

    if (!root) {
      const wrapper = document.createElement('div');
      wrapper.className = 'procstack-shell';
      wrapper.innerHTML = `
        <section class="procstack-hero">
          <div class="procstack-kicker">TRAXPBJ Academy • Interactive PBJ Challenge</div>
          <h2>Procurement Stacker</h2>
          <p>
            Susun pipeline pengadaan, jawab studi kasus, dan belajar alur PBJ bersama PANJI.
            Game ini melatih logika tahapan: perencanaan, pemilihan, kontrak, serah terima, dan realisasi.
          </p>
        </section>

        <section class="procstack-game-card">
          <div id="procstackRoot"></div>
        </section>
      `;

      container.appendChild(wrapper);
      root = container.querySelector('#procstackRoot');
    }

    readStoredPlayer();
    ensureLeaderboardModal();
    fetchLeaderboard();
    initPanji(container);

    GAME_STATE.stage = 'ready';
    GAME_STATE.current = null;
    renderReadyScreen();
    showPanji('Halo, perkenalkan. Aku PANJI, Pengadaan Jitu. Sebelum main, isi dulu nama pemain dan instansi atau OPD kamu ya.', 'happy');

    setTimeout(() => {
      if (!destroyed) {
        openLeaderboardModal('player', true);
      }
    }, 650);

    leaderboardRefreshTimer = setInterval(() => {
      if (!destroyed && leaderboardModalEl && !leaderboardModalEl.classList.contains('ps-hidden')) {
        fetchLeaderboard();
      }
    }, 60000);

    return function destroy() {
      destroyed = true;

      clearAutoNextTimer();
      clearLevelTimer();
      clearTenderRushTimers();
      disableTenderRushKeyboard();
      clearBonusRunLoop();
      clearPanjiIntroTimers();
      clearPanjiTalkTimer();

      if (leaderboardRefreshTimer) {
        clearInterval(leaderboardRefreshTimer);
        leaderboardRefreshTimer = null;
      }

      if (leaderboardModalEl) {
        leaderboardModalEl.remove();
        leaderboardModalEl = null;
      }

      if (toastEl) {
        toastEl.remove();
        toastEl = null;
      }

      const flash = document.getElementById('psScreenFlash');

      if (flash) {
        flash.remove();
      }

      document.querySelectorAll('.ps-confetti, .ps-floating-score').forEach(el => {
        el.remove();
      });

      if (panjiEl) {
        if (typeof panjiEl._panjiAutoPositionDestroy === 'function') {
          panjiEl._panjiAutoPositionDestroy();
          panjiEl._panjiAutoPositionDestroy = null;
        }

        panjiEl.remove();
        panjiEl = null;
        panjiTextEl = null;
        panjiEmoteEl = null;
        panjiBubbleEl = null;
        panjiHintBtn = null;
        panjiMiniBtn = null;
        panjiCharacterBtn = null;
        panjiCloseBtn = null;
      }

      containerRef = null;
      root = null;
    };
  };
})();
