(function () {
  const AUTO_NEXT_DELAY_MS = 1500;

  const CARD_LIBRARY = {
    rup: { id:'rup', label:'Cek RUP', icon:'📋', note:'Pastikan paket sudah ada dan sesuai perencanaan.' },
    identifikasi: { id:'identifikasi', label:'Identifikasi Kebutuhan', icon:'🧠', note:'Validasi kebutuhan, volume, lokasi, dan jadwal.' },
    konsolidasi: { id:'konsolidasi', label:'Konsolidasi', icon:'🧲', note:'Gabungkan kebutuhan sejenis bila tepat.' },
    reviewSpek: { id:'review-spek', label:'Review Spesifikasi', icon:'🧐', note:'Cegah spesifikasi mengarah.' },
    kak: { id:'kak', label:'KAK / Spesifikasi', icon:'🧩', note:'Susun kebutuhan teknis secara jelas dan adil.' },
    hps: { id:'hps', label:'HPS / Referensi Harga', icon:'💰', note:'Susun harga perkiraan dengan dasar wajar.' },
    cekPdn: { id:'cek-pdn', label:'Cek PDN / TKDN', icon:'🇮🇩', note:'Perhatikan produk dalam negeri.' },
    cekKatalog: { id:'cek-katalog', label:'Cek e-Katalog', icon:'🔎', note:'Pastikan barang/jasa tersedia dan sesuai.' },
    katalogTidakSesuai: { id:'katalog-tidak-sesuai', label:'Katalog Tidak Sesuai', icon:'🛑', note:'Produk/penyedia tidak tersedia atau tidak sesuai.' },
    dokumentasiGagalKatalog: { id:'dokumentasi-gagal-katalog', label:'Dokumentasi Hasil Cek', icon:'📝', note:'Catat bukti hasil pengecekan katalog sebelum ganti metode.' },
    evaluasiMetode: { id:'evaluasi-metode', label:'Evaluasi Metode', icon:'🧭', note:'Evaluasi metode awal bila kondisi pasar tidak sesuai rencana.' },
    pilihMetode: { id:'pilih-metode', label:'Pilih Metode', icon:'⚙️', note:'Tentukan metode berdasarkan nilai, jenis, dan kondisi paket.' },
    metodePl: { id:'metode-pl', label:'Pengadaan Langsung', icon:'🛠️', note:'Digunakan bila nilai dan kondisi paket sesuai.' },
    metodeEpurchasing: { id:'metode-epurchasing', label:'e-Purchasing', icon:'🛒', note:'Gunakan katalog bila sesuai.' },
    tender: { id:'tender', label:'Tender', icon:'🏗️', note:'Untuk paket yang membutuhkan proses pemilihan formal.' },
    seleksi: { id:'seleksi', label:'Seleksi', icon:'📐', note:'Umumnya untuk jasa konsultansi.' },
    swakelola: { id:'swakelola', label:'Swakelola', icon:'🤲', note:'Dipilih bila memenuhi kriteria swakelola.' },
    klarifikasi: { id:'klarifikasi', label:'Klarifikasi / Negosiasi', icon:'🤝', note:'Pastikan harga, spek, dan kemampuan pelaksanaan.' },
    proses: { id:'proses', label:'Proses Pemilihan', icon:'🚦', note:'Laksanakan proses sesuai metode.' },
    kontrak: { id:'kontrak', label:'SPK / Kontrak', icon:'📑', note:'Ikat hasil proses secara tertulis.' },
    monitoringKontrak: { id:'monitoring-kontrak', label:'Monitoring Kontrak', icon:'📡', note:'Pantau waktu, mutu, volume, dan kewajiban.' },
    identifikasiPerubahan: { id:'identifikasi-perubahan', label:'Identifikasi Perubahan', icon:'🔍', note:'Cek perubahan volume, waktu, spesifikasi, atau kondisi lapangan.' },
    kajiKontrak: { id:'kaji-kontrak', label:'Kaji Klausul Kontrak', icon:'📖', note:'Pastikan perubahan memungkinkan secara kontraktual.' },
    justifikasiTeknis: { id:'justifikasi-teknis', label:'Justifikasi Teknis', icon:'🧾', note:'Susun alasan teknis dan administrasi perubahan.' },
    negosiasiPerubahan: { id:'negosiasi-perubahan', label:'Negosiasi Perubahan', icon:'🤝', note:'Bahas dampak harga, waktu, volume, dan mutu.' },
    adendumKontrak: { id:'adendum-kontrak', label:'Adendum Kontrak', icon:'✍️', note:'Tuangkan perubahan kontrak secara tertulis.' },
    teguran: { id:'teguran', label:'Teguran / Evaluasi', icon:'📣', note:'Dilakukan saat ada keterlambatan atau masalah.' },
    pemeriksaan: { id:'pemeriksaan', label:'Pemeriksaan Hasil', icon:'🔬', note:'Cek kesesuaian sebelum diterima.' },
    bast: { id:'bast', label:'BAST', icon:'📦', note:'Serah terima setelah barang/jasa sesuai.' },
    pembayaran: { id:'pembayaran', label:'Pembayaran', icon:'💳', note:'Dilakukan sesuai dokumen pendukung.' },
    realisasi: { id:'realisasi', label:'Catat Realisasi', icon:'✅', note:'Pastikan realisasi tercatat.' },

    kontrakAwal: { id:'kontrak-awal', label:'Kontrak Dulu', icon:'🚨', note:'Jebakan: lompat proses.', type:'trap' },
    pecahPaket: { id:'pecah-paket', label:'Pecah Paket', icon:'💣', note:'Jebakan: rawan menghindari metode.', type:'trap' },
    spekMengarah: { id:'spek-mengarah', label:'Spek Mengarah', icon:'🚫', note:'Jebakan: persaingan tidak sehat.', type:'trap' },
    abaikanKatalog: { id:'abaikan-katalog', label:'Abaikan Katalog', icon:'⚠️', note:'Jebakan: tidak cek kanal tersedia.', type:'trap' },
    lanjutEpurchasingPaksa: { id:'lanjut-epurchasing-paksa', label:'Paksa e-Purchasing', icon:'🚧', note:'Jebakan: tetap memaksa katalog padahal tidak sesuai.', type:'trap' },
    gantiMetodeTanpaBukti: { id:'ganti-metode-tanpa-bukti', label:'Ganti Metode Tanpa Bukti', icon:'⚡', note:'Jebakan: perubahan metode tanpa dokumentasi hasil cek.', type:'trap' },
    lewatiRup: { id:'lewati-rup', label:'Lewati RUP', icon:'⛔', note:'Jebakan: proses tanpa cek perencanaan.', type:'trap' },
    bastTanpaCek: { id:'bast-tanpa-cek', label:'BAST Tanpa Pemeriksaan', icon:'📦', note:'Jebakan: menerima tanpa verifikasi.', type:'trap' },
    bayarDulu: { id:'bayar-dulu', label:'Bayar Dulu', icon:'💸', note:'Jebakan: pembayaran sebelum bukti memadai.', type:'trap' },
    metodeAsalCepat: { id:'metode-asal-cepat', label:'Metode Asal Cepat', icon:'🏃', note:'Jebakan: cepat belum tentu tepat.', type:'trap' },
    realisasiLupa: { id:'realisasi-lupa', label:'Lupakan Realisasi', icon:'🕳️', note:'Jebakan: monitoring bolong.', type:'trap' },
    adendumTanpaDasar: { id:'adendum-tanpa-dasar', label:'Adendum Tanpa Dasar', icon:'🔥', note:'Jebakan: perubahan kontrak tanpa kajian/justifikasi.', type:'trap' },
    bayarSebelumAdendum: { id:'bayar-sebelum-adendum', label:'Bayar Sebelum Adendum', icon:'💸', note:'Jebakan: pembayaran sebelum perubahan kontrak tertib.', type:'trap' }
  };

  function card(key) {
    const item = CARD_LIBRARY[key];
    if (!item) return null;
    return { ...item, type:item.type || 'action' };
  }

  const CHALLENGE_RAW = [
    {
      type:'pipeline',
      title:'Soal 1 — Susun Pipeline Dasar Pengadaan',
      caseTitle:'Belanja ATK Kantor',
      desc:'OPD akan melakukan belanja ATK kantor senilai Rp45 juta. Susun alur pengadaan paling aman dari awal sampai realisasi.',
      ideal:['rup','kak','hps','metodePl','proses','kontrak','bast','realisasi'],
      traps:['kontrakAwal','lewatiRup','bayarDulu'],
      explanation:'Alur dasar dimulai dari cek RUP, KAK/spesifikasi, HPS, penentuan metode, proses pengadaan, kontrak, BAST, lalu realisasi.'
    },
    {
      type:'quiz',
      title:'Soal 2 — Ruang Lingkup PBJ',
      caseTitle:'Konsep Dasar PBJ',
      desc:'Jawab pertanyaan berikut berdasarkan konsep dasar PBJ Pemerintah.',
      question:'PBJ Pemerintah dimulai dari tahap apa sampai tahap apa?',
      options:[
        'Identifikasi kebutuhan sampai kontrak',
        'Perencanaan sampai pembayaran',
        'Identifikasi kebutuhan sampai serah terima hasil pekerjaan',
        'Penyusunan HPS sampai serah terima'
      ],
      answer:2,
      explanation:'PBJ Pemerintah dimulai dari identifikasi kebutuhan sampai serah terima hasil pekerjaan.'
    },
    {
      type:'pipeline',
      title:'Soal 3 — Susun Pipeline e-Purchasing',
      caseTitle:'Pengadaan Laptop Pelayanan Publik',
      desc:'Barang tersedia di e-Katalog dan nilai paket Rp350 juta.',
      ideal:['rup','kak','hps','cekPdn','cekKatalog','metodeEpurchasing','klarifikasi','kontrak','bast','realisasi'],
      traps:['metodePl','tender','abaikanKatalog','kontrakAwal'],
      explanation:'Jika barang tersedia di katalog, alurnya cek RUP, KAK/HPS, cek PDN/TKDN, cek katalog, e-Purchasing, klarifikasi, kontrak, BAST, realisasi.'
    },
    {
      type:'quiz',
      title:'Soal 4 — Tujuan PBJ',
      caseTitle:'Laptop TKDN + BMP 42%',
      desc:'PPK membeli laptop melalui katalog elektronik dengan TKDN + BMP 42%.',
      question:'Tujuan PBJ yang paling didukung oleh kondisi tersebut adalah?',
      options:[
        'Menghasilkan barang sesuai nilai uang',
        'Meningkatkan penggunaan produk dalam negeri',
        'Meningkatkan peran UMK',
        'Meningkatkan peran pelaku usaha lokal'
      ],
      answer:1,
      explanation:'TKDN/BMP menunjukkan keberpihakan pada produk dalam negeri.'
    },
    {
      type:'pipeline',
      title:'Soal 5 — Susun Pipeline Konsolidasi',
      caseTitle:'Komputer Beberapa Bidang',
      desc:'Beberapa bidang mengusulkan komputer dengan kebutuhan sejenis. Total nilai Rp650 juta.',
      ideal:['rup','identifikasi','konsolidasi','kak','hps','cekKatalog','metodeEpurchasing','kontrak','bast','realisasi'],
      traps:['pecahPaket','metodePl','metodeAsalCepat','kontrakAwal'],
      explanation:'Kebutuhan sejenis perlu diidentifikasi dan dapat dikonsolidasikan agar tidak terjadi pemecahan paket yang tidak wajar.'
    },
    {
      type:'quiz',
      title:'Soal 6 — Pemaketan',
      caseTitle:'Strategi Pemaketan PBJ',
      desc:'Jawab pertanyaan tentang dasar pemaketan barang/jasa.',
      question:'Pemaketan barang/jasa dilakukan dengan mempertimbangkan apa?',
      options:[
        'Keluaran, volume, ketersediaan, kemampuan pelaku usaha, dan anggaran',
        'Keinginan bidang, kecepatan proses, dan kemudahan administrasi',
        'Jumlah penyedia yang dikenal PPK',
        'Nilai paket agar selalu bisa pengadaan langsung'
      ],
      answer:0,
      explanation:'Pemaketan perlu mempertimbangkan output, volume, ketersediaan, kemampuan pelaku usaha, dan anggaran.'
    },
    {
      type:'pipeline',
      title:'Soal 7 — Susun Pipeline Spek Mengarah',
      caseTitle:'Laptop dengan Spek Terlalu Spesifik',
      desc:'Spesifikasi awal mengarah ke merek tertentu. Susun langkah korektif sebelum proses.',
      ideal:['rup','reviewSpek','kak','hps','cekKatalog','metodeEpurchasing','klarifikasi','kontrak','bast','realisasi'],
      traps:['spekMengarah','kontrakAwal','abaikanKatalog','metodeAsalCepat'],
      explanation:'Jika spesifikasi mengarah, lakukan review spek dulu agar kebutuhan teknis lebih fair sebelum lanjut HPS dan metode.'
    },
    {
      type:'quiz',
      title:'Soal 8 — Spesifikasi Teknis',
      caseTitle:'Fungsi Spesifikasi',
      desc:'Jawab pertanyaan tentang fungsi spesifikasi teknis dalam PBJ.',
      question:'Salah satu fungsi spesifikasi teknis adalah?',
      options:[
        'Menentukan pemenang sebelum proses',
        'Memberikan informasi kebutuhan kepada pelaku usaha',
        'Mengunci merek tertentu agar barang sesuai selera',
        'Menghindari persaingan agar proses cepat'
      ],
      answer:1,
      explanation:'Spesifikasi teknis harus memberi informasi kebutuhan kepada pelaku usaha.'
    },
    {
      type:'pipeline',
      title:'Soal 9 — Ganti Metode dari e-Purchasing',
      caseTitle:'e-Purchasing Tidak Bisa Dilanjutkan',
      desc:'Paket awalnya direncanakan e-Purchasing, tetapi tidak ada produk/penyedia yang sesuai di katalog.',
      ideal:['rup','kak','hps','cekPdn','cekKatalog','katalogTidakSesuai','dokumentasiGagalKatalog','evaluasiMetode','pilihMetode','proses','kontrak','bast','realisasi'],
      traps:['lanjutEpurchasingPaksa','gantiMetodeTanpaBukti','kontrakAwal','metodeAsalCepat'],
      explanation:'Jika e-Purchasing tidak bisa dilakukan, dokumentasikan hasil cek katalog, evaluasi metode, lalu pilih metode lain yang sesuai.'
    },
    {
      type:'quiz',
      title:'Soal 10 — Perubahan Metode dari e-Purchasing',
      caseTitle:'Tidak Ada Penyedia di Katalog',
      desc:'Rencana awal e-Purchasing, tetapi produk/penyedia tidak sesuai kebutuhan.',
      question:'Langkah paling aman sebelum mengganti metode dari e-Purchasing adalah?',
      options:[
        'Langsung tunjuk penyedia yang dikenal agar cepat',
        'Tetap memaksa e-Purchasing walaupun produk tidak sesuai',
        'Dokumentasikan hasil cek katalog, evaluasi metode, lalu pilih metode yang sesuai',
        'Pecah paket agar bisa memakai metode yang lebih sederhana'
      ],
      answer:2,
      explanation:'Perubahan metode harus didasarkan pada hasil cek dan dokumentasi yang jelas.'
    },
    {
      type:'pipeline',
      title:'Soal 11 — Susun Pipeline Adendum Kontrak',
      caseTitle:'Perubahan Volume dan Waktu Pelaksanaan',
      desc:'Kontrak berjalan, terdapat kebutuhan perubahan volume dan penyesuaian waktu pelaksanaan.',
      ideal:['kontrak','monitoringKontrak','identifikasiPerubahan','kajiKontrak','justifikasiTeknis','negosiasiPerubahan','adendumKontrak','pemeriksaan','bast','pembayaran','realisasi'],
      traps:['adendumTanpaDasar','bayarSebelumAdendum','bastTanpaCek','realisasiLupa'],
      explanation:'Adendum kontrak harus didahului identifikasi perubahan, kajian klausul kontrak, justifikasi teknis/administratif, dan negosiasi dampak perubahan.'
    },
    {
      type:'quiz',
      title:'Soal 12 — Adendum Kontrak',
      caseTitle:'Perubahan Kontrak Berjalan',
      desc:'Dalam pelaksanaan kontrak ditemukan kebutuhan perubahan volume dan waktu.',
      question:'Apa yang paling tepat dilakukan sebelum membuat adendum kontrak?',
      options:[
        'Membayar dulu agar penyedia tetap bekerja',
        'Membuat justifikasi dan memastikan perubahan sesuai ketentuan/klausul kontrak',
        'Langsung BAST agar pekerjaan cepat selesai',
        'Membiarkan perubahan terjadi tanpa dokumen'
      ],
      answer:1,
      explanation:'Adendum kontrak membutuhkan dasar yang jelas, termasuk kajian kontrak dan justifikasi perubahan.'
    }
  ];

  function buildChallenge(raw) {
    if (raw.type === 'quiz') return raw;

    const idealCards = raw.ideal.map(key => card(key)).filter(Boolean);
    const trapCards = (raw.traps || []).map(key => card(key)).filter(Boolean);

    return {
      ...raw,
      idealIds: idealCards.map(item => item.id),
      cards: [...idealCards, ...trapCards]
    };
  }

  const CHALLENGES = CHALLENGE_RAW.map(buildChallenge);

  const STATE = {
    order:[],
    index:0,
    current:null,
    stage:'ready',
    placed:[],
    shuffledCards:[],
    selectedCardId:null,
    answered:false,
    selectedAnswer:null,
    score:0,
    risk:0,
    wrong:0,
    progress:0,
    logs:[]
  };

  let root = null;
  let toast = null;
  let autoNextTimer = null;
  let destroyed = false;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function shuffleArray(items) {
    const result = [...items];

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  function clearAutoNextTimer() {
    if (autoNextTimer) {
      clearTimeout(autoNextTimer);
      autoNextTimer = null;
    }
  }

  function showToast(message, type = 'info') {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'proc-toast';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = `proc-toast ${type}`;

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 1800);
  }

  function scheduleAutoNext(message) {
    clearAutoNextTimer();
    showToast(message, 'info');

    autoNextTimer = setTimeout(() => {
      autoNextTimer = null;
      nextChallenge();
    }, AUTO_NEXT_DELAY_MS);
  }

  function addLog(type, title, text) {
    STATE.logs.unshift({ type, title, text });
    STATE.logs = STATE.logs.slice(0, 8);
  }

  function startGame() {
    clearAutoNextTimer();

    STATE.order = CHALLENGES.map((_, index) => index);
    STATE.index = 0;
    STATE.score = 0;
    STATE.risk = 0;
    STATE.wrong = 0;

    loadChallenge();
  }

  function loadChallenge() {
    clearAutoNextTimer();

    const challengeIndex = STATE.order[STATE.index];
    const challenge = CHALLENGES[challengeIndex];

    STATE.current = challenge;
    STATE.selectedCardId = null;
    STATE.answered = false;
    STATE.selectedAnswer = null;
    STATE.logs = [];

    if (challenge.type === 'pipeline') {
      STATE.stage = 'pipeline';
      STATE.placed = Array(challenge.idealIds.length).fill(null);
      STATE.shuffledCards = shuffleArray(challenge.cards);
      STATE.progress = 0;

      addLog('info', 'Challenge pipeline dimulai', 'Susun kartu dari kiri ke kanan. Kartu jebakan akan menaikkan risiko.');
    } else {
      STATE.stage = 'quiz';
      STATE.placed = [];
      STATE.shuffledCards = [];
      STATE.progress = 100;

      addLog('info', 'Challenge ABCD dimulai', 'Pilih jawaban yang paling tepat.');
    }

    renderGame();
  }

  function nextChallenge() {
    clearAutoNextTimer();

    if (STATE.index < STATE.order.length - 1) {
      STATE.index += 1;
      loadChallenge();
    } else {
      finishGame();
    }
  }

  function finishGame() {
    STATE.stage = 'result';
    STATE.current = null;
    STATE.progress = 100;
    renderGame();
    showToast('Semua soal selesai. Hasil akhir ditampilkan.', 'ok');
  }

  function calculateMaxScore() {
    return CHALLENGES.reduce((total, challenge) => {
      if (challenge.type === 'pipeline') {
        return total + (challenge.idealIds.length * 10) + 20;
      }
      return total + 20;
    }, 0);
  }

  function getResultGrade(percent) {
    if (percent >= 90 && STATE.risk <= 20) {
      return { label:'Sangat Baik', icon:'🏆', text:'Pemahaman alur PBJ sudah kuat. Risiko rendah dan keputusan relatif aman.' };
    }

    if (percent >= 75) {
      return { label:'Baik', icon:'🥇', text:'Pemahaman sudah baik, tetapi masih ada beberapa risiko yang perlu dikurangi.' };
    }

    if (percent >= 60) {
      return { label:'Cukup', icon:'🥈', text:'Dasar sudah mulai terbentuk, namun perlu latihan ulang pada studi kasus yang salah.' };
    }

    return { label:'Perlu Pembinaan', icon:'📚', text:'Disarankan mengulang dari awal agar alur dan prinsip PBJ lebih kuat.' };
  }

  function renderGame() {
    if (!root || destroyed) return;

    if (STATE.stage === 'result') {
      root.innerHTML = renderResultScreen();
      bindResultEvents();
      return;
    }

    const challenge = STATE.current;

    root.innerHTML = `
      <div class="proc-card-head">
        <div>
          <h2>${escapeHtml(challenge.title)}</h2>
          <p>${escapeHtml(challenge.desc)}</p>
        </div>

        <div class="proc-pill-row">
          <div class="proc-pill ${challenge.type === 'pipeline' ? 'green' : ''}">
            ${challenge.type === 'pipeline' ? 'Pipeline' : 'ABCD'}
          </div>
          <div class="proc-pill">Soal ${STATE.index + 1} / ${STATE.order.length}</div>
          ${STATE.selectedCardId ? '<div class="proc-pill warn">Kartu dipilih</div>' : ''}
        </div>
      </div>

      <div class="proc-case-panel">
        <div class="proc-case-box">
          <label>Kasus / Topik</label>
          <strong>${escapeHtml(challenge.caseTitle)}</strong>
          <span>${escapeHtml(challenge.desc)}</span>
        </div>

        <div class="proc-case-box">
          <label>Jenis Soal</label>
          <strong>${challenge.type === 'pipeline' ? 'Susun Pipeline' : 'Pilihan ABCD'}</strong>
        </div>

        <div class="proc-case-box">
          <label>Skor</label>
          <strong>${STATE.score}</strong>
        </div>

        <div class="proc-case-box">
          <label>Risiko</label>
          <strong>${STATE.risk}</strong>
        </div>
      </div>

      <div class="proc-score-grid">
        <div class="proc-score-card">
          <label>Progress</label>
          <strong>${STATE.progress}%</strong>
        </div>
        <div class="proc-score-card">
          <label>Skor</label>
          <strong>${STATE.score}</strong>
        </div>
        <div class="proc-score-card">
          <label>Risiko</label>
          <strong>${STATE.risk}</strong>
        </div>
        <div class="proc-score-card">
          <label>Salah</label>
          <strong>${STATE.wrong}</strong>
        </div>
      </div>

      <div class="proc-progress-track">
        <div class="proc-progress-bar" style="width:${STATE.progress}%"></div>
      </div>

      ${challenge.type === 'pipeline' ? renderPipelineChallenge(challenge) : renderQuizChallenge(challenge)}

      ${renderLogs()}

      <div class="proc-buttons">
        <button type="button" class="proc-btn proc-btn-soft" id="btnRestartGame">Mulai Ulang</button>
        ${challenge.type === 'pipeline' ? '<button type="button" class="proc-btn proc-btn-soft" id="btnResetChallenge">Reset Soal Ini</button>' : ''}
        <button type="button" class="proc-btn proc-btn-primary" id="btnNextChallenge" ${canGoNext() ? '' : 'disabled'}>
          Lanjut Soal Berikutnya
        </button>
      </div>
    `;

    bindGameEvents();
  }

  function renderResultScreen() {
    const maxScore = calculateMaxScore();
    const percent = maxScore > 0 ? Math.round((STATE.score / maxScore) * 100) : 0;
    const grade = getResultGrade(percent);

    return `
      <div class="proc-result-hero">
        <div class="procstack-kicker">Hasil Akhir Procurement Stacker</div>
        <h2>${grade.icon} ${grade.label}</h2>
        <p>${escapeHtml(grade.text)}</p>
      </div>

      <div class="proc-result-grid">
        <div class="proc-result-card">
          <label>Nilai Akhir</label>
          <strong>${percent}%</strong>
        </div>
        <div class="proc-result-card">
          <label>Skor</label>
          <strong>${STATE.score}/${maxScore}</strong>
        </div>
        <div class="proc-result-card">
          <label>Risiko</label>
          <strong>${STATE.risk}</strong>
        </div>
        <div class="proc-result-card">
          <label>Salah</label>
          <strong>${STATE.wrong}</strong>
        </div>
      </div>

      <div class="proc-result-note">
        <strong>Ringkasan:</strong><br>
        Kamu sudah menyelesaikan ${CHALLENGES.length} soal/challenge. Materi meliputi dasar pengadaan, e-Purchasing,
        konsolidasi, spesifikasi mengarah, perubahan metode dari e-Purchasing, dan adendum kontrak.
      </div>

      <div class="proc-result-note">
        <strong>Catatan:</strong><br>
        Keputusan PBJ bukan hanya cepat. Harus tertib alur, ada bukti, metode sesuai, dan perubahan kondisi seperti katalog tidak tersedia atau adendum kontrak harus terdokumentasi.
      </div>

      <div class="proc-buttons">
        <button type="button" class="proc-btn proc-btn-primary" id="btnPlayAgain">Main Lagi dari Soal 1</button>
      </div>
    `;
  }

  function renderPipelineChallenge(challenge) {
    const placedIds = new Set(STATE.placed.filter(Boolean).map(item => item.id));

    return `
      <div class="proc-pipeline">
        ${challenge.idealIds.map((id, index) => renderSlot(index)).join('')}
      </div>

      <div class="proc-card-head">
        <div>
          <h2>Kartu Pipeline Acak</h2>
          <p>Drag kartu ke slot, atau klik kartu lalu klik slot biru. Urutan harus dari kiri ke kanan.</p>
        </div>
        <button type="button" class="proc-btn proc-btn-soft" id="btnShuffleCards">Acak Kartu</button>
      </div>

      <div class="proc-bank">
        ${STATE.shuffledCards.map(item => renderPipelineCard(item, placedIds.has(item.id))).join('')}
      </div>

      ${STATE.progress === 100 ? `
        <div class="proc-explanation">
          <strong>Pipeline selesai:</strong><br>
          ${escapeHtml(challenge.explanation)}
        </div>
      ` : ''}
    `;
  }

  function renderSlot(index) {
    const placed = STATE.placed[index];
    const nextEmpty = STATE.placed.findIndex(item => item === null);
    const isReady = STATE.selectedCardId && !placed && index === nextEmpty;

    if (placed) {
      return `
        <div class="proc-slot correct" data-slot-index="${index}">
          <div class="proc-slot-number">${index + 1}</div>
          ${renderPipelineCard(placed, false, true)}
        </div>
      `;
    }

    return `
      <div class="proc-slot ${isReady ? 'click-ready' : ''}" data-slot-index="${index}">
        <div class="proc-slot-number">${index + 1}</div>
        <div class="proc-slot-placeholder">${isReady ? 'Klik untuk pasang kartu' : `Slot ${index + 1}`}</div>
      </div>
    `;
  }

  function renderPipelineCard(item, used = false, locked = false) {
    const selected = STATE.selectedCardId === item.id ? 'selected' : '';
    const trapClass = item.type === 'trap' ? 'trap-card' : '';

    return `
      <div
        class="proc-action-card ${used ? 'used' : ''} ${locked ? 'correct-card' : ''} ${selected} ${trapClass}"
        draggable="${used || locked || STATE.progress === 100 ? 'false' : 'true'}"
        data-card-id="${escapeHtml(item.id)}"
      >
        <div class="proc-card-icon">${item.icon}</div>
        <strong>${escapeHtml(item.label)}</strong>
        <span>${escapeHtml(item.note)}</span>
      </div>
    `;
  }

  function renderQuizChallenge(challenge) {
    return `
      <div class="proc-quiz-question">${escapeHtml(challenge.question)}</div>

      <div class="proc-quiz-options">
        ${challenge.options.map((option, index) => {
          let cls = '';

          if (STATE.answered) {
            if (index === challenge.answer) cls = 'correct';
            else if (index === STATE.selectedAnswer) cls = 'wrong';
          }

          return `
            <button
              type="button"
              class="proc-quiz-option ${cls}"
              data-answer-index="${index}"
              ${STATE.answered ? 'disabled' : ''}
            >
              ${String.fromCharCode(65 + index)}. ${escapeHtml(option)}
            </button>
          `;
        }).join('')}
      </div>

      ${STATE.answered ? `
        <div class="proc-explanation">
          <strong>Pembahasan:</strong><br>
          ${escapeHtml(challenge.explanation)}
        </div>
      ` : ''}
    `;
  }

  function renderLogs() {
    if (!STATE.logs.length) return '';

    return `
      <div class="proc-log-box">
        <strong>Log Pembelajaran</strong>
        <div style="height:10px;"></div>
        <div class="proc-log-list">
          ${STATE.logs.map(item => `
            <div class="proc-log-item">
              <div class="proc-log-icon ${item.type}">
                ${item.type === 'ok' ? '✓' : item.type === 'bad' ? '!' : 'i'}
              </div>
              <div>
                <div class="proc-log-title">${escapeHtml(item.title)}</div>
                <div class="proc-log-sub">${escapeHtml(item.text)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function canGoNext() {
    const challenge = STATE.current;

    if (!challenge) return false;
    if (challenge.type === 'pipeline') return STATE.progress === 100;
    return STATE.answered;
  }

  function bindGameEvents() {
    root.querySelectorAll('.proc-action-card[draggable="true"]').forEach(cardEl => {
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

    root.querySelectorAll('.proc-slot').forEach(slot => {
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
        placeCard(cardId, slotIndex);
      });

      slot.addEventListener('click', () => {
        if (!STATE.selectedCardId) return;

        const slotIndex = Number(slot.dataset.slotIndex);
        placeCard(STATE.selectedCardId, slotIndex);
      });
    });

    root.querySelectorAll('[data-answer-index]').forEach(button => {
      button.addEventListener('click', () => {
        answerQuiz(Number(button.dataset.answerIndex));
      });
    });

    const btnNext = root.querySelector('#btnNextChallenge');
    const btnRestart = root.querySelector('#btnRestartGame');
    const btnReset = root.querySelector('#btnResetChallenge');
    const btnShuffle = root.querySelector('#btnShuffleCards');

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
        loadChallenge();
      });
    }

    if (btnShuffle) {
      btnShuffle.addEventListener('click', () => {
        const challenge = STATE.current;
        if (!challenge || challenge.type !== 'pipeline') return;

        STATE.shuffledCards = shuffleArray(challenge.cards);
        STATE.selectedCardId = null;
        renderGame();
        showToast('Kartu diacak ulang.', 'info');
      });
    }
  }

  function bindResultEvents() {
    const btnPlayAgain = root.querySelector('#btnPlayAgain');

    if (btnPlayAgain) {
      btnPlayAgain.addEventListener('click', () => {
        clearAutoNextTimer();
        startGame();
      });
    }
  }

  function selectCard(cardId) {
    if (STATE.progress === 100) return;

    STATE.selectedCardId = STATE.selectedCardId === cardId ? null : cardId;

    if (STATE.selectedCardId) {
      const challenge = STATE.current;
      const item = challenge.cards.find(cardItem => cardItem.id === cardId);
      showToast(`Kartu dipilih: ${item ? item.label : cardId}. Klik slot biru.`, 'info');
    }

    renderGame();
  }

  function placeCard(cardId, slotIndex) {
    const challenge = STATE.current;

    if (!challenge || challenge.type !== 'pipeline') return;
    if (STATE.progress === 100) return;

    const expectedId = challenge.idealIds[slotIndex];
    const item = challenge.cards.find(cardItem => cardItem.id === cardId);

    if (!item) return;

    const alreadyPlaced = STATE.placed.some(placedItem => placedItem && placedItem.id === cardId);
    if (alreadyPlaced) return;

    const nextEmpty = STATE.placed.findIndex(placedItem => placedItem === null);

    if (slotIndex !== nextEmpty) {
      wrongMove(cardId, `Isi pipeline dari kiri ke kanan. Slot berikutnya adalah nomor ${nextEmpty + 1}.`);
      return;
    }

    if (cardId !== expectedId) {
      const expected = challenge.cards.find(cardItem => cardItem.id === expectedId);
      wrongMove(cardId, `Belum tepat. Kamu memilih "${item.label}", posisi ini seharusnya "${expected ? expected.label : expectedId}".`);
      return;
    }

    STATE.placed[slotIndex] = item;
    STATE.selectedCardId = null;
    STATE.progress = Math.round((STATE.placed.filter(Boolean).length / challenge.idealIds.length) * 100);
    STATE.score += 10;

    addLog('ok', `${item.label} benar`, getCorrectMessage(item.id));
    showToast(`Benar: ${item.label}`, 'ok');

    const completed = STATE.progress === 100;

    if (completed) {
      STATE.score += 20;
      addLog('ok', 'Pipeline selesai', challenge.explanation);
      showToast('Pipeline benar 100%. Otomatis lanjut...', 'ok');
      scheduleAutoNext('Pipeline selesai. Otomatis lanjut ke soal berikutnya...');
    }

    renderGame();
  }

  function wrongMove(cardId, message) {
    STATE.risk += 10;
    STATE.wrong += 1;
    STATE.score = Math.max(0, STATE.score - 5);
    STATE.selectedCardId = null;

    addLog('bad', 'Urutan belum tepat', message);
    showToast('Belum tepat. Risiko naik.', 'bad');

    renderGame();
  }

  function answerQuiz(selectedIndex) {
    const challenge = STATE.current;

    if (!challenge || challenge.type !== 'quiz') return;
    if (STATE.answered) return;

    STATE.selectedAnswer = selectedIndex;
    STATE.answered = true;

    if (selectedIndex === challenge.answer) {
      STATE.score += 20;
      addLog('ok', 'Jawaban benar', challenge.explanation);
      showToast('Jawaban benar. Otomatis lanjut...', 'ok');
      scheduleAutoNext('Jawaban benar. Otomatis lanjut ke soal berikutnya...');
    } else {
      STATE.risk += 8;
      STATE.wrong += 1;
      STATE.score = Math.max(0, STATE.score - 5);
      addLog('bad', 'Jawaban belum tepat', challenge.explanation);
      showToast('Jawaban belum tepat. Otomatis lanjut setelah pembahasan.', 'bad');
      scheduleAutoNext('Pembahasan terbuka. Otomatis lanjut ke soal berikutnya...');
    }

    renderGame();
  }

  function getCorrectMessage(cardId) {
    const messages = {
      rup:'RUP menjadi pintu awal untuk memastikan paket, jadwal, pagu, dan metode.',
      identifikasi:'Identifikasi kebutuhan mencegah paket dobel, tidak relevan, atau tidak sesuai prioritas.',
      konsolidasi:'Konsolidasi membantu mengelola kebutuhan sejenis agar tidak terpecah tanpa alasan.',
      kak:'KAK/spesifikasi harus berbasis kebutuhan dan tidak mengarah.',
      'review-spek':'Review spesifikasi penting agar persaingan sehat.',
      hps:'HPS/referensi harga menjadi dasar kewajaran biaya.',
      'cek-pdn':'PDN/TKDN perlu diperhatikan untuk mendukung produk dalam negeri.',
      'cek-katalog':'Cek katalog membantu menentukan apakah e-Purchasing dapat digunakan.',
      'katalog-tidak-sesuai':'Jika katalog tidak menyediakan produk/penyedia sesuai, kondisi itu harus dicatat sebelum mengganti metode.',
      'dokumentasi-gagal-katalog':'Dokumentasi hasil cek katalog menjadi dasar perubahan metode.',
      'evaluasi-metode':'Evaluasi metode diperlukan agar metode baru sesuai nilai, jenis, dan kondisi paket.',
      'pilih-metode':'Metode dipilih setelah kebutuhan, nilai, jadwal, dan pasar dipahami.',
      'metode-pl':'Pengadaan Langsung tepat bila nilai dan kondisi paket sesuai.',
      'metode-epurchasing':'e-Purchasing tepat jika tersedia di katalog dan sesuai kebutuhan.',
      tender:'Tender dipakai saat karakter paket membutuhkan proses pemilihan formal.',
      seleksi:'Seleksi relevan untuk jasa konsultansi.',
      swakelola:'Swakelola dapat dipilih jika memenuhi kriteria.',
      klarifikasi:'Klarifikasi/negosiasi memastikan harga, spesifikasi, dan kemampuan pelaksanaan.',
      proses:'Proses pemilihan dilakukan setelah dokumen dan metode siap.',
      kontrak:'Kontrak/SPK menjadi dasar pelaksanaan setelah proses pengadaan.',
      'monitoring-kontrak':'Monitoring kontrak mengendalikan waktu, mutu, dan kewajiban penyedia.',
      'identifikasi-perubahan':'Perubahan kontrak harus diawali identifikasi kondisi perubahan.',
      'kaji-kontrak':'Klausul kontrak perlu dikaji sebelum adendum.',
      'justifikasi-teknis':'Justifikasi teknis menjadi dasar perubahan kontrak.',
      'negosiasi-perubahan':'Negosiasi perubahan membahas dampak harga, waktu, dan volume.',
      'adendum-kontrak':'Adendum dituangkan secara tertulis sebelum perubahan dilaksanakan lebih lanjut.',
      teguran:'Teguran/evaluasi diperlukan saat penyedia terlambat atau bermasalah.',
      pemeriksaan:'Pemeriksaan hasil mencegah barang/jasa tidak sesuai langsung diterima.',
      bast:'BAST dilakukan setelah hasil diperiksa dan sesuai.',
      pembayaran:'Pembayaran dilakukan setelah dokumen pendukung memadai.',
      realisasi:'Pencatatan realisasi memastikan data monitoring tidak bolong.'
    };

    return messages[cardId] || 'Langkah ini benar pada posisi pipeline saat ini.';
  }

  window.__moduleInit = function ({ container }) {
    destroyed = false;
    root = container.querySelector('#procstackRoot');

    if (!root) {
      return function destroy() {};
    }

    startGame();

    return function destroy() {
      destroyed = true;
      clearAutoNextTimer();

      if (toast) {
        toast.remove();
        toast = null;
      }
    };
  };
})();
