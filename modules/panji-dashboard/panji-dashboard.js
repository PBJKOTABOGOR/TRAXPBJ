(function () {
  'use strict';

  const PANJI_CONFIG = {
    id: 'traxPanjiDashboardAssistant',
    storageKeyClosed: 'traxpbj_panji_dashboard_closed_until_reload',
    bottom: 86,
    right: 34,
    maxBubbleHeight: 260,
    highlightClass: 'panji-elegant-focus',
    defaultTargetSelectors: [
      '.hero-card',
      '.stat-card',
      '.dashboard-kpi-card',
      '.card',
      '.quick-card',
      '.dim-row',
      '.dimension-row',
      '.table-row',
      '[data-quick]',
      '[data-route]',
      'button',
      'select'
    ]
  };

  const PANJI_ASSETS = {
    default: '/TRAXPBJ/assets/panji/panji-senang.png',
    intro: '/TRAXPBJ/assets/panji/panji-senang.png',
    talking: '/TRAXPBJ/assets/panji/panji-senang.png',
    happy: '/TRAXPBJ/assets/panji/panji-gembira.png',
    sad: '/TRAXPBJ/assets/panji/panji-sedih.png',
    thinking: '/TRAXPBJ/assets/panji/panji-bingung.png',
    confused: '/TRAXPBJ/assets/panji/panji-bingung.png',
    paused: '/TRAXPBJ/assets/panji/panji-senang.png'
  };

  const PANJI_KNOWLEDGE = {
    totalScale: [
      { min: 24, label: 'Sangat Baik', tone: 'happy' },
      { min: 18, label: 'Baik', tone: 'happy' },
      { min: 12, label: 'Cukup', tone: 'thinking' },
      { min: 0, label: 'Butuh Perhatian', tone: 'sad' }
    ],

    indicatorScale(value, max) {
      const number = toNumber(value);
      const maximum = toNumber(max);

      if (maximum <= 0 || number <= 0) {
        return {
          label: 'Belum Terdeteksi',
          tone: 'sad',
          percent: 0
        };
      }

      const percent = (number / maximum) * 100;

      if (percent >= 85) {
        return {
          label: 'Sangat Baik',
          tone: 'happy',
          percent
        };
      }

      if (percent >= 70) {
        return {
          label: 'Baik',
          tone: 'happy',
          percent
        };
      }

      if (percent >= 50) {
        return {
          label: 'Cukup',
          tone: 'thinking',
          percent
        };
      }

      return {
        label: 'Butuh Perhatian',
        tone: 'sad',
        percent
      };
    },

    indicatorNarratives: {
      sirup(value, max, status) {
        if (status.label === 'Sangat Baik' || status.label === 'Baik') {
          return `Capaian SiRUP sudah ${status.label.toLowerCase()}. Perencanaan dan pengumuman RUP terlihat relatif tertib sebagai pintu awal PBJ. Yang perlu dijaga adalah konsistensi RUP dengan metode, jadwal pemilihan, kontrak, BAST, dan realisasi agar rantai data tidak putus.`;
        }

        if (status.label === 'Belum Terdeteksi') {
          return 'SiRUP belum terbaca kuat di data ini. Periksa kembali apakah paket sudah diumumkan di RUP, metode sudah tepat, jadwal pemilihan wajar, dan pagu tidak berhenti sebagai rencana saja.';
        }

        return `SiRUP masih ${status.label.toLowerCase()}. Risiko utamanya adalah paket berjalan tanpa pijakan perencanaan yang rapi. Rapikan RUP terlebih dahulu, karena RUP adalah titik awal sebelum masuk ke pemilihan, kontrak, dan realisasi.`;
      },

      tokoDaring(value, max, status) {
        if (status.label === 'Sangat Baik' || status.label === 'Baik') {
          return `Toko Daring sudah ${status.label.toLowerCase()}. Artinya kanal belanja digital sederhana mulai dimanfaatkan. Tetap pastikan barang yang dibeli sesuai kebutuhan, harga wajar, dan administrasinya tidak lepas dari dokumen pertanggungjawaban.`;
        }

        if (status.label === 'Belum Terdeteksi') {
          return 'Toko Daring belum terlihat dimanfaatkan. Untuk kebutuhan sederhana yang tersedia melalui kanal toko daring, OPD bisa mulai mengoptimalkannya sepanjang sesuai ketentuan, kebutuhan, dan kewajaran harga.';
        }

        return `Toko Daring masih ${status.label.toLowerCase()}. Ini bukan sekadar soal memakai aplikasi, tapi soal memilih kanal pengadaan yang tepat untuk belanja sederhana. Cek kembali jenis kebutuhan yang sebenarnya bisa diproses lewat Toko Daring.`;
      },

      epurchasing(value, max, status) {
        if (status.label === 'Sangat Baik' || status.label === 'Baik') {
          return `e-Purchasing sudah ${status.label.toLowerCase()}. Paket yang tersedia di katalog tampaknya sudah mulai diarahkan ke kanal yang tepat. Tetap jaga prinsip: cek kesesuaian spesifikasi, kewajaran harga, PDN/TKDN, penyedia, dan dokumentasi hasil negosiasi atau klarifikasi.`;
        }

        if (status.label === 'Belum Terdeteksi') {
          return 'e-Purchasing belum terlihat. Untuk barang/jasa yang tersedia di katalog, jangan langsung memakai metode lain. Lakukan cek katalog lebih dulu, dokumentasikan hasilnya, baru evaluasi metode bila katalog tidak sesuai.';
        }

        return `e-Purchasing masih ${status.label.toLowerCase()}. Risiko yang sering muncul adalah paket katalog tidak dimanfaatkan atau pindah metode tanpa bukti cek katalog. Pastikan setiap perubahan dari rencana e-Purchasing punya dokumentasi yang jelas.`;
      },

      etendering(value, max, status) {
        if (status.label === 'Sangat Baik' || status.label === 'Baik') {
          return `e-Tendering sudah ${status.label.toLowerCase()}. Ini menunjukkan proses tender atau seleksi relatif tercatat melalui sistem. Tetap perhatikan kesesuaian metode, dokumen pemilihan, jadwal, evaluasi, dan kesinambungan ke kontrak.`;
        }

        if (status.label === 'Belum Terdeteksi') {
          return 'e-Tendering belum terlihat pada data ini. Bila ada paket yang seharusnya melalui tender atau seleksi, pastikan prosesnya tercatat di sistem, bukan hanya selesai secara administratif di luar pemantauan.';
        }

        return `e-Tendering masih ${status.label.toLowerCase()}. Perlu dicek apakah paket bernilai besar atau jasa konsultansi sudah memakai metode yang tepat. Jangan sampai paket dipaksakan ke metode sederhana hanya karena ingin cepat.`;
      },

      ekontrak(value, max, status) {
        if (status.label === 'Sangat Baik' || status.label === 'Baik') {
          return `e-Kontrak sudah ${status.label.toLowerCase()}. Pencatatan kontrak terlihat cukup tertib setelah proses pemilihan. Tahap berikutnya yang harus dijaga adalah monitoring pelaksanaan, pemeriksaan hasil, BAST, pembayaran, dan realisasi.`;
        }

        if (status.label === 'Belum Terdeteksi') {
          return 'e-Kontrak belum terbaca. Ini perlu segera dicek, karena kontrak adalah penghubung antara hasil pemilihan dan pelaksanaan pekerjaan. Tanpa pencatatan kontrak, data BAST dan realisasi bisa ikut lemah.';
        }

        return `e-Kontrak masih ${status.label.toLowerCase()}. Biasanya masalahnya bukan paket tidak ada, tetapi kontrak belum tertib dicatat. Risiko utamanya adalah proses pemilihan tidak tersambung ke pelaksanaan, BAST, dan realisasi.`;
      },

      nontender(value, max, status) {
        if (status.label === 'Sangat Baik' || status.label === 'Baik') {
          return `Non Tender sudah ${status.label.toLowerCase()}. Pengadaan langsung atau proses non tender tampaknya cukup tertib dicatat. Tetap pastikan paket kecil tidak diremehkan: dokumen, SPK/bukti transaksi, BAST, dan realisasi harus tetap rapi.`;
        }

        if (status.label === 'Belum Terdeteksi') {
          return 'Non Tender belum terlihat. Pengadaan langsung dan paket non tender sering dianggap kecil, padahal tetap harus tercatat. Pastikan paket, penyedia, bukti transaksi, BAST, dan realisasi tidak bolong.';
        }

        return `Non Tender masih ${status.label.toLowerCase()}. Ini perlu perhatian karena banyak paket bernilai kecil justru rawan luput dari pencatatan. Rapikan pengadaan langsung, bukti transaksi, BAST, dan realisasi agar monitoring tidak timpang.`;
      }
    }
  };

  const state = {
    root: null,
    bubble: null,
    text: null,
    emote: null,
    character: null,
    sprite: null,
    isClosed: false,
    isPaused: false,
    currentTarget: null,
    talkTimer: null,
    idleTimer: null,
    mutationObserver: null,
    lastDashboardSignature: '',
    lastSpokenText: '',
    _mutationTimer: null
  };

  function init() {
    if (window.__TRAX_PANJI_DASHBOARD_READY__) return;
    window.__TRAX_PANJI_DASHBOARD_READY__ = true;

    injectStyle();
    waitForDashboard();
    bindGlobalDashboardObserver();
  }

  function waitForDashboard() {
    const tryInit = () => {
      const contentArea = document.getElementById('contentArea') || document.body;

      if (!contentArea) {
        setTimeout(tryInit, 300);
        return;
      }

      createPanji();
      bindDashboardInteractions();
      speakWelcomeOnce();
      startIdleTips();
    };

    tryInit();
  }

  function createPanji() {
    if (sessionStorage.getItem(PANJI_CONFIG.storageKeyClosed) === '1') {
      state.isClosed = true;
      return;
    }

    let root = document.getElementById(PANJI_CONFIG.id);

    if (!root) {
      root = document.createElement('div');
      root.id = PANJI_CONFIG.id;
      root.className = 'trax-panji-assistant trax-panji-intro';

      root.innerHTML = `
        <div class="trax-panji-bubble">
          <button type="button" class="trax-panji-close" title="Tutup PANJI">×</button>

          <div class="trax-panji-bubble-top">
            <div class="trax-panji-name">PANJI · Pengadaan Jitu</div>
            <div class="trax-panji-emote">👋</div>
          </div>

          <div class="trax-panji-text"></div>

          <div class="trax-panji-actions">
            <button type="button" data-panji-action="explain-dashboard">Jelaskan Dashboard</button>
            <button type="button" data-panji-action="analyze-current">Analisis Satuan Kerja</button>
            <button type="button" data-panji-action="recommendation">Saran PANJI</button>
            <button type="button" data-panji-action="close">Tutup PANJI</button>
          </div>
        </div>

        <button type="button" class="trax-panji-character" title="Klik PANJI untuk diam/ngomong lagi" aria-label="PANJI Pengadaan Jitu">
          <div class="trax-panji-character-inner">
            <img
              class="trax-panji-sprite"
              src="${PANJI_ASSETS.intro}"
              alt="PANJI"
              draggable="false"
            />
            <div class="trax-panji-sprite-shadow"></div>
            <div class="trax-panji-sprite-icon trax-panji-sprite-question">?</div>
            <div class="trax-panji-sprite-icon trax-panji-sprite-spark">✦</div>
          </div>
        </button>
      `;

      document.body.appendChild(root);
    }

    state.root = root;
    state.bubble = root.querySelector('.trax-panji-bubble');
    state.text = root.querySelector('.trax-panji-text');
    state.emote = root.querySelector('.trax-panji-emote');
    state.character = root.querySelector('.trax-panji-character');
    state.sprite = root.querySelector('.trax-panji-sprite');

    bindPanjiEvents();
    setPanjiSprite('intro');
    updatePanjiPosition();
    window.addEventListener('scroll', updatePanjiPosition, { passive: true });
    window.addEventListener('resize', updatePanjiPosition);
  }

  function bindPanjiEvents() {
    if (!state.root) return;

    const closeButton = state.root.querySelector('.trax-panji-close');
    const actionButtons = state.root.querySelectorAll('[data-panji-action]');

    if (closeButton && !closeButton.dataset.bound) {
      closeButton.dataset.bound = '1';
      closeButton.addEventListener('click', closePanjiUntilReload);
    }

    if (state.character && !state.character.dataset.bound) {
      state.character.dataset.bound = '1';
      state.character.addEventListener('click', togglePausePanji);
    }

    actionButtons.forEach((button) => {
      if (button.dataset.bound) return;

      button.dataset.bound = '1';
      button.addEventListener('click', () => {
        const action = button.dataset.panjiAction;

        if (action === 'close') {
          closePanjiUntilReload();
          return;
        }

        if (action === 'explain-dashboard') {
          state.isPaused = false;
          speak(explainDashboard(), 'talking');
          focusBestDashboardTarget('dashboard');
          return;
        }

        if (action === 'analyze-current') {
          state.isPaused = false;
          const data = readDashboardData();
          speak(analyzeCurrentSatker(data), getMoodFromScore(data.totalScore));
          focusBestDashboardTarget('itkp');
          return;
        }

        if (action === 'recommendation') {
          state.isPaused = false;
          const data = readDashboardData();
          speak(buildRecommendation(data), 'thinking');
          focusWeakestIndicator(data);
        }
      });
    });
  }

  function closePanjiUntilReload() {
    state.isClosed = true;
    sessionStorage.setItem(PANJI_CONFIG.storageKeyClosed, '1');
    clearHighlight();

    if (state.root) {
      state.root.remove();
    }

    clearTimeout(state.talkTimer);
    clearTimeout(state.idleTimer);
  }

  function togglePausePanji() {
    if (!state.root || state.isClosed) return;

    state.isPaused = !state.isPaused;

    if (state.isPaused) {
      state.root.classList.remove(
        'trax-panji-talking',
        'trax-panji-happy',
        'trax-panji-sad',
        'trax-panji-thinking',
        'trax-panji-intro',
        'trax-panji-show-question',
        'trax-panji-show-spark'
      );

      setPanjiSprite('paused');
      setText('Baik, PANJI diam dulu. Klik saya lagi kalau mau lanjut membaca dashboard.');
      setEmote('🤐');
      clearTimeout(state.talkTimer);
      clearHighlight();
      return;
    }

    const data = readDashboardData();
    speak(analyzeCurrentSatker(data), getMoodFromScore(data.totalScore));
  }

  function speakWelcomeOnce() {
    const signature = getDashboardSignature();

    if (state.lastDashboardSignature === signature) return;

    state.lastDashboardSignature = signature;

    speak(
      `Halo, saya PANJI — Pengadaan Jitu. Saya bantu membaca dashboard ini sebagai pendamping PBJ, bukan sekadar maskot. Pilih satuan kerja, nanti saya nilai SiRUP, Toko Daring, e-Purchasing, e-Tendering, e-Kontrak, dan Non Tender dengan bahasa yang lebih teknis tapi tetap gampang dipahami.`,
      'intro'
    );
  }

  function speak(text, mood = 'talking') {
    if (!state.root || state.isClosed || state.isPaused) return;

    const clean = String(text || '').trim();
    if (!clean) return;

    state.lastSpokenText = clean;
    state.root.classList.remove(
      'trax-panji-hidden',
      'trax-panji-happy',
      'trax-panji-sad',
      'trax-panji-thinking',
      'trax-panji-talking',
      'trax-panji-intro',
      'trax-panji-show-question',
      'trax-panji-show-spark'
    );

    if (mood === 'happy') {
      state.root.classList.add('trax-panji-happy', 'trax-panji-talking');
      setEmote('😄');
      setPanjiSprite('happy');
    } else if (mood === 'sad') {
      state.root.classList.add('trax-panji-sad', 'trax-panji-talking');
      setEmote('😢');
      setPanjiSprite('sad');
    } else if (mood === 'thinking') {
      state.root.classList.add('trax-panji-thinking', 'trax-panji-talking');
      setEmote('🤔');
      setPanjiSprite('thinking');
    } else if (mood === 'confused') {
      state.root.classList.add('trax-panji-thinking', 'trax-panji-talking');
      setEmote('❓');
      setPanjiSprite('confused');
    } else if (mood === 'excited') {
      state.root.classList.add('trax-panji-happy', 'trax-panji-talking');
      setEmote('🎉');
      setPanjiSprite('happy');
    } else if (mood === 'intro') {
      state.root.classList.add('trax-panji-intro', 'trax-panji-talking');
      setEmote('👋');
      setPanjiSprite('intro');
    } else {
      state.root.classList.add('trax-panji-talking');
      setEmote('🤖');
      setPanjiSprite('talking');
    }

    setText(clean);

    clearTimeout(state.talkTimer);
    state.talkTimer = setTimeout(() => {
      if (state.root) {
        state.root.classList.remove('trax-panji-talking');
      }
    }, Math.min(7200, Math.max(2400, clean.length * 38)));
  }

  function setText(text) {
    if (!state.text) return;
    state.text.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
  }

  function setEmote(value) {
    if (!state.emote) return;
    state.emote.textContent = value;
  }

  function setPanjiSprite(mood = 'default') {
    if (!state.root || !state.sprite) return;

    const chosen = PANJI_ASSETS[mood] || PANJI_ASSETS.default;
    state.sprite.src = chosen;

    state.root.classList.remove(
      'trax-panji-show-question',
      'trax-panji-show-spark'
    );

    if (mood === 'thinking' || mood === 'confused') {
      state.root.classList.add('trax-panji-show-question');
    }

    if (mood === 'happy') {
      state.root.classList.add('trax-panji-show-spark');
    }
  }

  function bindDashboardInteractions() {
    bindClickExplainers();
    bindSelectWatcher();
    bindQuickButtons();
  }

  function bindClickExplainers() {
    const root = document.getElementById('contentArea') || document.body;

    root.querySelectorAll(PANJI_CONFIG.defaultTargetSelectors.join(',')).forEach((el) => {
      if (el.dataset.panjiBound) return;

      el.dataset.panjiBound = '1';

      el.addEventListener('mouseenter', () => {
        if (state.isClosed || state.isPaused) return;
        highlightElement(el);
      });

      el.addEventListener('mouseleave', () => {
        if (state.isClosed || state.isPaused) return;
        clearHighlight();
      });

      el.addEventListener('click', () => {
        if (state.isClosed || state.isPaused) return;

        const text = explainElement(el);
        if (text) {
          highlightElement(el);
          speak(text, detectMoodFromElement(el));
        }
      });
    });
  }

  function bindSelectWatcher() {
    const root = document.getElementById('contentArea') || document.body;

    root.querySelectorAll('select').forEach((select) => {
      if (select.dataset.panjiSelectBound) return;

      select.dataset.panjiSelectBound = '1';
      select.addEventListener('change', () => {
        if (state.isClosed || state.isPaused) return;

        setTimeout(() => {
          const data = readDashboardData();
          speak(analyzeCurrentSatker(data), getMoodFromScore(data.totalScore));
          focusBestDashboardTarget('itkp');
          bindDashboardInteractions();
        }, 200);
      });
    });
  }

  function bindQuickButtons() {
    const root = document.getElementById('contentArea') || document.body;

    root.querySelectorAll('[data-quick], [data-route], .quick-card').forEach((button) => {
      if (button.dataset.panjiQuickBound) return;

      button.dataset.panjiQuickBound = '1';
      button.addEventListener('mouseenter', () => {
        if (state.isClosed || state.isPaused) return;

        const text = explainRouteButton(button);
        if (text) {
          highlightElement(button);
          speak(text, 'thinking');
        }
      });
    });
  }

  function explainElement(el) {
    const text = getElementText(el);
    const lower = text.toLowerCase();
    const data = readDashboardData();

    if (lower.includes('sirup')) {
      return explainIndicatorByName('SiRUP', data);
    }

    if (lower.includes('toko daring')) {
      return explainIndicatorByName('Toko Daring', data);
    }

    if (lower.includes('e-purchasing') || lower.includes('epurchasing') || lower.includes('katalog')) {
      return explainIndicatorByName('e-Purchasing', data);
    }

    if (lower.includes('e-tendering') || lower.includes('etendering') || lower.includes('tender')) {
      return explainIndicatorByName('e-Tendering', data);
    }

    if (lower.includes('e-kontrak') || lower.includes('ekontrak') || lower.includes('kontrak')) {
      return explainIndicatorByName('e-Kontrak', data);
    }

    if (lower.includes('non tender') || lower.includes('nontender')) {
      return explainIndicatorByName('Non Tender', data);
    }

    if (lower.includes('itkp') || lower.includes('pemanfaatan sistem')) {
      return analyzeCurrentSatker(data);
    }

    if (lower.includes('pagu') || lower.includes('perencanaan')) {
      return `Pagu perencanaan menunjukkan beban rencana pengadaan yang harus dikawal sejak RUP. Nilai besar belum otomatis baik; yang penting adalah paketnya diumumkan, metode sesuai, jadwal realistis, dan tidak berhenti sebelum proses pemilihan.`;
    }

    if (lower.includes('realisasi')) {
      return `Realisasi menunjukkan seberapa jauh paket bergerak dari rencana menjadi pelaksanaan. Capaian realisasi yang sehat harus nyambung dengan kontrak, BAST, pembayaran, dan pencatatan akhir agar data monitoring tidak bolong.`;
    }

    if (lower.includes('paket')) {
      return `Jumlah paket perlu dibaca bersama nilai dan metodenya. Banyak paket tidak selalu buruk, tetapi perlu dicermati apakah ada kebutuhan sejenis yang seharusnya dikonsolidasikan atau ada paket kecil yang rawan luput pencatatan.`;
    }

    if (lower.includes('ranking') || lower.includes('tertinggi') || lower.includes('terendah')) {
      return `Ranking membantu melihat OPD yang sudah kuat dan yang perlu dibina. Jangan hanya mengejar urutan, baca indikator mana yang lemah agar tindak lanjutnya tepat sasaran.`;
    }

    if (lower.includes('refresh')) {
      return `Tombol refresh dipakai untuk membaca ulang data. Gunakan setelah ada pembaruan sheet atau modul agar analisis tidak memakai data lama.`;
    }

    return '';
  }

  function explainRouteButton(button) {
    const text = getElementText(button).toLowerCase();

    if (text.includes('sirup')) {
      return `Menu SiRUP dipakai untuk menelusuri perencanaan. PANJI biasanya mulai dari sini, karena RUP adalah pintu awal sebelum bicara metode, kontrak, BAST, dan realisasi.`;
    }

    if (text.includes('ekatalog') || text.includes('katalog') || text.includes('e-purchasing')) {
      return `Menu e-Katalog membantu melihat pemanfaatan Toko Daring dan e-Purchasing. Untuk paket yang tersedia di katalog, cek spesifikasi, harga, PDN/TKDN, penyedia, dan dokumentasi sebelum pindah metode.`;
    }

    if (text.includes('etendering') || text.includes('tender')) {
      return `Menu e-Tendering penting untuk paket yang harus melalui tender atau seleksi. Perhatikan nilai, jenis pekerjaan, metode, dokumen pemilihan, dan kesinambungan ke kontrak.`;
    }

    if (text.includes('ekontrak') || text.includes('kontrak')) {
      return `Menu e-Kontrak membaca apakah hasil pemilihan sudah tersambung ke kontrak. Titik ini krusial karena kontrak mengikat pelaksanaan, pemeriksaan, BAST, pembayaran, dan realisasi.`;
    }

    if (text.includes('non tender')) {
      return `Menu Non Tender dipakai untuk memastikan pengadaan langsung dan paket non tender tetap tertib dicatat. Paket kecil tetap punya risiko kalau dokumen, BAST, atau realisasinya tidak masuk.`;
    }

    if (text.includes('rapor')) {
      return `Rapor PBJ cocok dipakai untuk membaca kinerja OPD secara lebih naratif. Data dashboard menjadi pintu masuk, sedangkan rapor membantu menyampaikan kondisi dan rekomendasi dengan bahasa evaluasi.`;
    }

    if (text.includes('procurement stacker') || text.includes('panji game')) {
      return `Procurement Stacker adalah ruang latihan. Di sana PANJI menguji urutan PBJ, jebakan metode, katalog tidak tersedia, kontrak, adendum, BAST, dan realisasi.`;
    }

    return '';
  }

  function explainDashboard() {
    return `Dashboard ini saya baca sebagai peta kendali PBJ. Bagian ITKP menunjukkan pemanfaatan sistem dari SiRUP sampai Non Tender, sedangkan pagu dan realisasi menunjukkan apakah rencana sudah bergerak menjadi pelaksanaan. Fokus utamanya bukan hanya angka, tapi kesinambungan data: RUP, metode, transaksi, kontrak, BAST, pembayaran, dan realisasi harus tersambung.`;
  }

  function analyzeCurrentSatker(data) {
    const status = getTotalStatus(data.totalScore);
    const weak = data.weakestIndicator;
    const strong = data.strongestIndicator;

    let text = `${data.satkerName} berada pada kategori ${status.label} dengan skor ITKP ${formatScore(data.totalScore)} dari 30. `;

    if (strong) {
      text += `Indikator paling kuat adalah ${strong.name}, menandakan bagian itu sudah relatif tertib. `;
    }

    if (weak) {
      text += `Titik yang perlu dikawal adalah ${weak.name}. ${explainIndicatorByName(weak.name, data)}`;
    } else {
      text += 'Belum ada indikator yang bisa dibaca rinci. Periksa kembali struktur data agar PANJI bisa memberi analisis yang lebih tajam.';
    }

    return text;
  }

  function buildRecommendation(data) {
    const weak = data.weakestIndicators || [];

    if (!weak.length) {
      return `Belum cukup data untuk menyusun prioritas. Mulai dari cek RUP, metode, transaksi katalog/tender, kontrak, BAST, dan realisasi. Data yang rapi akan membuat evaluasi OPD jauh lebih akurat.`;
    }

    const first = weak[0];
    const second = weak[1];

    let text = `Prioritas pertama untuk ${data.satkerName} adalah ${first.name}. ${explainIndicatorByName(first.name, data)} `;

    if (second) {
      text += `Setelah itu kawal ${second.name}, karena indikator lemah kedua biasanya menjadi penyebab rantai data tidak utuh.`;
    }

    return text;
  }

  function explainIndicatorByName(name, data) {
    const indicator = findIndicator(data, name);
    const normalized = normalizeIndicatorKey(name);
    const value = indicator ? indicator.value : 0;
    const max = indicator ? indicator.max : getDefaultMax(name);
    const status = PANJI_KNOWLEDGE.indicatorScale(value, max);

    const fn = PANJI_KNOWLEDGE.indicatorNarratives[normalized];

    if (typeof fn === 'function') {
      return fn(value, max, status);
    }

    return `${name} berada pada kategori ${status.label}. Baca indikator ini sebagai bagian dari rantai PBJ, bukan angka berdiri sendiri. Pastikan datanya tersambung dari perencanaan sampai realisasi.`;
  }

  function focusWeakestIndicator(data) {
    if (!data.weakestIndicator) return;

    const target = findElementByText(data.weakestIndicator.name);

    if (target) {
      highlightElement(target);
    }
  }

  function focusBestDashboardTarget(mode) {
    if (mode === 'dashboard') {
      const target = document.querySelector('.hero-card') ||
        document.querySelector('.card') ||
        document.getElementById('contentArea');

      highlightElement(target);
      return;
    }

    if (mode === 'itkp') {
      const target = findElementByText('ITKP') ||
        findElementByText('Pemanfaatan Sistem') ||
        document.querySelector('.dimensions') ||
        document.querySelector('.card');

      highlightElement(target);
    }
  }

  function highlightElement(el) {
    clearHighlight();

    if (!el || !el.classList) return;

    state.currentTarget = el;
    el.classList.add(PANJI_CONFIG.highlightClass);

    try {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    } catch (error) {
      console.warn('PANJI gagal scroll ke elemen:', error);
    }
  }

  function clearHighlight() {
    if (state.currentTarget && state.currentTarget.classList) {
      state.currentTarget.classList.remove(PANJI_CONFIG.highlightClass);
    }

    document.querySelectorAll(`.${PANJI_CONFIG.highlightClass}`).forEach((el) => {
      el.classList.remove(PANJI_CONFIG.highlightClass);
    });

    state.currentTarget = null;
  }

  function readDashboardData() {
    const satkerName = readSelectedSatkerName();
    const indicators = readIndicatorsFromPage();
    const totalScore = readTotalScore(indicators);
    const strongestIndicators = [...indicators].sort((a, b) => getPercent(b) - getPercent(a));
    const weakestIndicators = [...indicators].sort((a, b) => getPercent(a) - getPercent(b));

    return {
      satkerName,
      indicators,
      totalScore,
      strongestIndicators,
      weakestIndicators,
      strongestIndicator: strongestIndicators[0] || null,
      weakestIndicator: weakestIndicators[0] || null
    };
  }

  function readSelectedSatkerName() {
    const select = document.querySelector('#itkpSatkerSelect') ||
      document.querySelector('select[name*="satker" i]') ||
      document.querySelector('select');

    if (select && select.options && select.selectedIndex >= 0) {
      return cleanText(select.options[select.selectedIndex].textContent) || 'Satuan Kerja terpilih';
    }

    const possibleTitle = document.querySelector('.score-caption') ||
      document.querySelector('[data-satker-name]') ||
      findElementByText('PEMERINTAH KOTA BOGOR');

    if (possibleTitle) {
      return cleanText(possibleTitle.textContent) || 'PEMERINTAH KOTA BOGOR';
    }

    return 'Satuan Kerja terpilih';
  }

  function readIndicatorsFromPage() {
    const known = [
      { name: 'SiRUP', max: 10 },
      { name: 'Toko Daring', max: 1 },
      { name: 'e-Purchasing', max: 4 },
      { name: 'e-Tendering', max: 5 },
      { name: 'e-Kontrak', max: 5 },
      { name: 'Non Tender', max: 5 }
    ];

    return known.map((item) => {
      const el = findElementByText(item.name);
      const value = el ? extractNearbyScore(el, item.max) : 0;

      return {
        ...item,
        value
      };
    });
  }

  function readTotalScore(indicators) {
    const totalFromIndicators = indicators.reduce((total, item) => total + toNumber(item.value), 0);

    const possibleScoreTexts = Array.from(document.querySelectorAll('.value, .big-number, .score-core b, strong, .stat-card'))
      .map((el) => cleanText(el.textContent))
      .filter(Boolean);

    const candidates = possibleScoreTexts
      .map((text) => {
        const match = text.match(/(\d+(?:[,.]\d+)?)/);
        return match ? toNumber(match[1]) : 0;
      })
      .filter((num) => num > 0 && num <= 30);

    if (candidates.length) {
      const closest = candidates.sort((a, b) => Math.abs(b - totalFromIndicators) - Math.abs(a - totalFromIndicators));
      return closest[0] || totalFromIndicators;
    }

    return totalFromIndicators;
  }

  function extractNearbyScore(el, max) {
    const containers = [
      el.closest('.dim-row'),
      el.closest('.dimension-row'),
      el.closest('.insight-item'),
      el.closest('.card'),
      el.parentElement
    ].filter(Boolean);

    for (const container of containers) {
      const text = cleanText(container.textContent);
      const score = parseScoreFromText(text, max);

      if (score !== null) return score;
    }

    return 0;
  }

  function parseScoreFromText(text, max) {
    const clean = String(text || '');

    const fraction = clean.match(/(\d+(?:[,.]\d+)?)\s*(?:\/|dari)\s*(\d+(?:[,.]\d+)?)/i);
    if (fraction) {
      const value = toNumber(fraction[1]);
      const maximum = toNumber(fraction[2]);

      if (maximum > 0 && Math.abs(maximum - max) <= 0.2) {
        return value;
      }
    }

    const numbers = clean.match(/\d+(?:[,.]\d+)?/g) || [];

    for (const number of numbers) {
      const value = toNumber(number);

      if (value >= 0 && value <= max) {
        return value;
      }
    }

    return null;
  }

  function findIndicator(data, name) {
    const key = normalizeIndicatorKey(name);

    return (data.indicators || []).find((item) => normalizeIndicatorKey(item.name) === key);
  }

  function normalizeIndicatorKey(name) {
    const text = String(name || '').toLowerCase();

    if (text.includes('sirup')) return 'sirup';
    if (text.includes('toko')) return 'tokoDaring';
    if (text.includes('purchasing') || text.includes('katalog')) return 'epurchasing';
    if (text.includes('tendering') || text.includes('tender')) return 'etendering';
    if (text.includes('kontrak')) return 'ekontrak';
    if (text.includes('non')) return 'nontender';

    return text.replace(/[^a-z0-9]/g, '');
  }

  function getDefaultMax(name) {
    const key = normalizeIndicatorKey(name);

    if (key === 'sirup') return 10;
    if (key === 'tokoDaring') return 1;
    if (key === 'epurchasing') return 4;
    if (key === 'etendering') return 5;
    if (key === 'ekontrak') return 5;
    if (key === 'nontender') return 5;

    return 1;
  }

  function getTotalStatus(score) {
    const value = toNumber(score);

    for (const item of PANJI_KNOWLEDGE.totalScale) {
      if (value >= item.min) return item;
    }

    return PANJI_KNOWLEDGE.totalScale[PANJI_KNOWLEDGE.totalScale.length - 1];
  }

  function getMoodFromScore(score) {
    return getTotalStatus(score).tone;
  }

  function detectMoodFromElement(el) {
    const text = cleanText(el.textContent).toLowerCase();

    if (
      text.includes('butuh perhatian') ||
      text.includes('belum terdeteksi') ||
      text.includes('rendah') ||
      text.includes('terendah')
    ) {
      return 'sad';
    }

    if (
      text.includes('sangat baik') ||
      text.includes('baik') ||
      text.includes('tertinggi')
    ) {
      return 'happy';
    }

    return 'thinking';
  }

  function getPercent(indicator) {
    const max = toNumber(indicator.max);
    if (max <= 0) return 0;

    return (toNumber(indicator.value) / max) * 100;
  }

  function startIdleTips() {
    clearTimeout(state.idleTimer);

    const tips = [
      'Catatan PANJI: nilai ITKP yang bagus harus tetap dibaca bersama realisasi. Sistem boleh aktif, tapi dokumen kontrak, BAST, dan realisasi tetap harus rapi.',
      'Dalam PBJ, cepat saja tidak cukup. Metode harus tepat, bukti harus ada, dan alur data jangan putus dari RUP sampai realisasi.',
      'Kalau indikator katalog rendah, jangan langsung menyimpulkan OPD buruk. Cek dulu apakah kebutuhannya memang tersedia di katalog dan apakah hasil ceknya terdokumentasi.',
      'Paket non tender sering terlihat kecil, tapi justru rawan luput. Pencatatan tetap penting agar monitoring tidak bolong.'
    ];

    const run = () => {
      if (!state.root || state.isClosed || state.isPaused) return;

      const random = tips[Math.floor(Math.random() * tips.length)];
      speak(random, 'thinking');

      state.idleTimer = setTimeout(run, 28000);
    };

    state.idleTimer = setTimeout(run, 22000);
  }

  function bindGlobalDashboardObserver() {
    const target = document.getElementById('contentArea') || document.body;

    if (!target) {
      setTimeout(bindGlobalDashboardObserver, 300);
      return;
    }

    if (state.mutationObserver) {
      state.mutationObserver.disconnect();
    }

    state.mutationObserver = new MutationObserver(() => {
      clearTimeout(state._mutationTimer);

      state._mutationTimer = setTimeout(() => {
        if (state.isClosed) return;

        bindDashboardInteractions();
        updatePanjiPosition();

        const signature = getDashboardSignature();

        if (signature !== state.lastDashboardSignature) {
          state.lastDashboardSignature = signature;

          const data = readDashboardData();

          if (!state.isPaused) {
            speak(analyzeCurrentSatker(data), getMoodFromScore(data.totalScore));
          }
        }
      }, 250);
    });

    state.mutationObserver.observe(target, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function updatePanjiPosition() {
    if (!state.root) return;

    const baseBottom = PANJI_CONFIG.bottom;
    const maxBottom = 280;
    const gap = 22;
    const footer = document.querySelector('.footer-note');
    const logBox = document.querySelector('.ps-log-box, .log-box, .learning-log');

    let nextBottom = baseBottom;

    [footer, logBox].filter(Boolean).forEach((el) => {
      const rect = el.getBoundingClientRect();
      const panjiRect = state.root.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      const panjiNormalTop = viewportHeight - nextBottom - panjiRect.height;
      const visible = rect.top < viewportHeight && rect.bottom > 0;
      const overlap = rect.bottom - panjiNormalTop;

      if (visible && overlap > 0) {
        nextBottom = Math.max(nextBottom, baseBottom + overlap + gap);
      }
    });

    nextBottom = Math.min(maxBottom, Math.max(baseBottom, Math.round(nextBottom)));
    state.root.style.setProperty('--trax-panji-bottom', `${nextBottom}px`);
  }

  function getDashboardSignature() {
    const select = document.querySelector('#itkpSatkerSelect') || document.querySelector('select');
    const selected = select ? select.value : '';
    const scoreText = cleanText((document.querySelector('.score-core') || document.querySelector('.stat-card') || {}).textContent || '');

    return `${selected}::${scoreText}`;
  }

  function getElementText(el) {
    if (!el) return '';

    return cleanText(
      el.getAttribute('aria-label') ||
      el.getAttribute('title') ||
      el.dataset.label ||
      el.textContent ||
      ''
    );
  }

  function cleanText(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function toNumber(value) {
    if (value === null || value === undefined) return 0;

    const raw = String(value)
      .trim()
      .replace(/\s/g, '');

    if (!raw || raw === '-' || raw.toLowerCase() === 'nan') return 0;

    let cleaned = raw.replace(/[^\d,.-]/g, '');

    if (cleaned.includes(',') && cleaned.includes('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',') && !cleaned.includes('.')) {
      cleaned = cleaned.replace(',', '.');
    }

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatScore(value) {
    return toNumber(value).toLocaleString('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function findElementByText(text) {
    const needle = String(text || '').toLowerCase();

    if (!needle) return null;

    const elements = Array.from(document.querySelectorAll('button, .card, .stat-card, .dim-row, .dimension-row, .insight-item, .quick-card, h3, h4, strong, div, span'));

    return elements.find((el) => {
      const value = cleanText(el.textContent).toLowerCase();
      return value.includes(needle);
    }) || null;
  }

  function injectStyle() {
    if (document.getElementById('trax-panji-dashboard-style')) return;

    const style = document.createElement('style');
    style.id = 'trax-panji-dashboard-style';

    style.textContent = `
      .trax-panji-assistant{
        position:fixed;
        right:${PANJI_CONFIG.right}px;
        bottom:var(--trax-panji-bottom, ${PANJI_CONFIG.bottom}px);
        z-index:999999;
        display:flex;
        align-items:flex-end;
        gap:14px;
        pointer-events:none;
        transition:
          bottom .22s ease,
          opacity .22s ease,
          transform .22s ease;
      }

      .trax-panji-assistant *{
        box-sizing:border-box;
        pointer-events:auto;
      }

      .trax-panji-bubble{
        width:350px;
        min-height:116px;
        max-height:${PANJI_CONFIG.maxBubbleHeight}px;
        overflow-y:auto;
        overflow-x:hidden;
        position:relative;
        padding:16px;
        border-radius:22px;
        background:
          radial-gradient(circle at top left, rgba(239,68,68,.14), transparent 38%),
          rgba(255,255,255,.97);
        border:1px solid rgba(254,202,202,.95);
        box-shadow:0 22px 48px rgba(15,23,42,.18);
        backdrop-filter:blur(14px);
        -webkit-backdrop-filter:blur(14px);
        animation:traxPanjiBubbleIdle 3.8s ease-in-out infinite;
      }

      .trax-panji-bubble::after{
        content:"";
        position:absolute;
        right:-10px;
        bottom:34px;
        width:20px;
        height:20px;
        background:rgba(255,255,255,.97);
        border-right:1px solid rgba(254,202,202,.95);
        border-bottom:1px solid rgba(254,202,202,.95);
        transform:rotate(-45deg);
      }

      @keyframes traxPanjiBubbleIdle{
        0%,100%{
          transform:translateY(0);
        }

        50%{
          transform:translateY(-4px);
        }
      }

      .trax-panji-bubble-top{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin-bottom:10px;
      }

      .trax-panji-name{
        display:inline-flex;
        align-items:center;
        min-height:26px;
        padding:0 10px;
        border-radius:999px;
        background:linear-gradient(135deg,#b91c1c,#ef4444);
        color:#fff;
        font-size:11px;
        font-weight:950;
        letter-spacing:.08em;
        box-shadow:0 8px 18px rgba(239,68,68,.22);
      }

      .trax-panji-emote{
        width:34px;
        height:34px;
        border-radius:999px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#fff1f2;
        font-size:18px;
        animation:traxPanjiEmote 2s ease-in-out infinite;
      }

      @keyframes traxPanjiEmote{
        0%,100%{
          transform:scale(1);
        }

        50%{
          transform:scale(1.12);
        }
      }

      .trax-panji-text{
        color:#102544;
        font-size:14px;
        line-height:1.68;
        font-weight:750;
      }

      .trax-panji-actions{
        display:flex;
        gap:8px;
        margin-top:12px;
        flex-wrap:wrap;
      }

      .trax-panji-actions button{
        border:none;
        min-height:34px;
        padding:0 11px;
        border-radius:11px;
        cursor:pointer;
        font-size:11px;
        font-weight:900;
        background:#fff1f2;
        color:#b91c1c;
        border:1px solid #fecdd3;
        transition:.18s ease;
      }

      .trax-panji-actions button:hover{
        transform:translateY(-1px);
        background:#ffe4e6;
      }

      .trax-panji-close{
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

      .trax-panji-character{
        width:130px;
        height:170px;
        position:relative;
        border:none;
        background:transparent;
        cursor:pointer;
        padding:0;
        flex-shrink:0;
        transform-origin:center bottom;
        animation:traxPanjiFloat 2.8s ease-in-out infinite;
      }

      .trax-panji-character-inner{
        position:relative;
        width:100%;
        height:100%;
      }

      @keyframes traxPanjiFloat{
        0%,100%{
          transform:translateY(0);
        }

        50%{
          transform:translateY(-8px);
        }
      }

      .trax-panji-sprite{
        position:absolute;
        left:50%;
        bottom:18px;
        transform:translateX(-50%);
        width:118px;
        height:auto;
        max-height:150px;
        object-fit:contain;
        user-select:none;
        -webkit-user-drag:none;
        filter:drop-shadow(0 12px 20px rgba(15,23,42,.18));
        transition:
          transform .18s ease,
          filter .18s ease;
        z-index:2;
      }

      .trax-panji-sprite-shadow{
        position:absolute;
        left:50%;
        bottom:10px;
        transform:translateX(-50%);
        width:78px;
        height:14px;
        border-radius:999px;
        background:rgba(15,23,42,.14);
        filter:blur(1px);
        z-index:1;
        animation:traxPanjiShadow 2.8s ease-in-out infinite;
      }

      @keyframes traxPanjiShadow{
        0%,100%{
          transform:translateX(-50%) scale(1);
          opacity:.16;
        }

        50%{
          transform:translateX(-50%) scale(.88);
          opacity:.10;
        }
      }

      .trax-panji-sprite-icon{
        position:absolute;
        opacity:0;
        pointer-events:none;
        transition:.18s ease;
        z-index:4;
      }

      .trax-panji-sprite-question{
        right:4px;
        top:6px;
        width:30px;
        height:30px;
        border-radius:999px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#fef3c7;
        color:#92400e;
        font-size:22px;
        font-weight:950;
        box-shadow:0 8px 18px rgba(15,23,42,.14);
      }

      .trax-panji-sprite-spark{
        right:14px;
        top:10px;
        color:#f59e0b;
        font-size:28px;
        text-shadow:0 6px 14px rgba(245,158,11,.22);
      }

      .trax-panji-show-question .trax-panji-sprite-question{
        opacity:1;
        animation:traxPanjiQuestion 1.1s ease-in-out infinite;
      }

      .trax-panji-show-spark .trax-panji-sprite-spark{
        opacity:1;
        animation:traxPanjiSpark 1s ease-in-out infinite;
      }

      @keyframes traxPanjiQuestion{
        0%,100%{
          transform:translateY(0) scale(1);
        }

        50%{
          transform:translateY(-7px) scale(1.08);
        }
      }

      @keyframes traxPanjiSpark{
        0%,100%{
          transform:scale(1) rotate(0deg);
          opacity:.8;
        }

        50%{
          transform:scale(1.2) rotate(10deg);
          opacity:1;
        }
      }

      .trax-panji-talking .trax-panji-sprite{
        animation:traxPanjiTalkBob .45s ease-in-out infinite;
      }

      @keyframes traxPanjiTalkBob{
        0%,100%{
          transform:translateX(-50%) translateY(0);
        }

        50%{
          transform:translateX(-50%) translateY(-3px);
        }
      }

      .trax-panji-happy .trax-panji-sprite{
        animation:traxPanjiHappyBounce .65s ease-in-out infinite;
      }

      @keyframes traxPanjiHappyBounce{
        0%,100%{
          transform:translateX(-50%) translateY(0);
        }

        50%{
          transform:translateX(-50%) translateY(-10px);
        }
      }

      .trax-panji-sad .trax-panji-sprite{
        transform:translateX(-50%) translateY(4px);
        filter:drop-shadow(0 10px 16px rgba(15,23,42,.16));
      }

      .trax-panji-thinking .trax-panji-sprite{
        animation:traxPanjiThinkTilt 1.5s ease-in-out infinite;
      }

      @keyframes traxPanjiThinkTilt{
        0%,100%{
          transform:translateX(-50%) rotate(0deg);
        }

        25%{
          transform:translateX(-50%) rotate(-3deg);
        }

        75%{
          transform:translateX(-50%) rotate(3deg);
        }
      }

      .trax-panji-intro .trax-panji-character{
        animation:traxPanjiIntro .85s cubic-bezier(.2,.8,.2,1);
      }

      @keyframes traxPanjiIntro{
        0%{
          opacity:0;
          transform:translateY(38px) scale(.82) rotate(-8deg);
        }

        60%{
          opacity:1;
          transform:translateY(-10px) scale(1.05) rotate(4deg);
        }

        100%{
          opacity:1;
          transform:translateY(0) scale(1) rotate(0deg);
        }
      }

      .panji-elegant-focus{
        position:relative !important;
        z-index:20 !important;
        outline:3px solid rgba(239,68,68,.88) !important;
        outline-offset:5px !important;
        box-shadow:
          0 0 0 8px rgba(239,68,68,.12),
          0 0 28px rgba(239,68,68,.30),
          0 18px 36px rgba(15,23,42,.12) !important;
        border-radius:18px !important;
        animation:panjiElegantPulse 1.2s ease-in-out infinite !important;
      }

      @keyframes panjiElegantPulse{
        0%,100%{
          outline-color:rgba(239,68,68,.88);
          box-shadow:
            0 0 0 7px rgba(239,68,68,.12),
            0 0 22px rgba(239,68,68,.25),
            0 18px 36px rgba(15,23,42,.10);
        }

        50%{
          outline-color:rgba(249,115,22,.95);
          box-shadow:
            0 0 0 12px rgba(249,115,22,.14),
            0 0 34px rgba(249,115,22,.32),
            0 18px 36px rgba(15,23,42,.12);
        }
      }

      @media(max-width:1400px){
        .trax-panji-assistant{
          right:24px;
        }

        .trax-panji-bubble{
          width:320px;
          max-height:240px;
        }

        .trax-panji-character{
          width:120px;
          height:160px;
        }

        .trax-panji-sprite{
          width:110px;
          max-height:142px;
        }
      }

      @media(max-width:900px){
        .trax-panji-assistant{
          right:16px;
          gap:10px;
        }

        .trax-panji-bubble{
          width:300px;
          max-height:230px;
        }

        .trax-panji-character{
          width:108px;
          height:150px;
        }

        .trax-panji-sprite{
          width:98px;
          max-height:132px;
        }
      }

      @media(max-width:640px){
        .trax-panji-assistant{
          right:10px;
          gap:8px;
        }

        .trax-panji-bubble{
          width:calc(100vw - 130px);
          max-height:220px;
          padding:14px;
        }

        .trax-panji-character{
          width:100px;
          height:140px;
        }

        .trax-panji-sprite{
          width:92px;
          max-height:124px;
        }

        .trax-panji-text{
          font-size:13px;
        }

        .trax-panji-actions button{
          min-height:31px;
          font-size:10px;
          padding:0 9px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
