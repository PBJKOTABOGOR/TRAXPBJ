(function () {
  'use strict';

  const CONFIG = {
    userSheet: {
      spreadsheetId: '1DYsqMtvwhPn-IEA3te9fFukD_iMMDRqUNPamktuPz2U',
      gid: '574346425',
      title: 'USERID'
    },
    tenderSheet: {
      spreadsheetId: '1DYsqMtvwhPn-IEA3te9fFukD_iMMDRqUNPamktuPz2U',
      gid: '0',
      title: 'SCRAPTENDER',
      sheetName: 'SCRAPTENDER'
    },
    nonTenderSheet: {
      spreadsheetId: '1DYsqMtvwhPn-IEA3te9fFukD_iMMDRqUNPamktuPz2U',
      gid: '1421218943',
      title: 'SCRAPNONTENDER',
      sheetName: 'SCRAPNONTENDER'
    },
    sessionKey: 'pemenang_pengadaan_login_session_v2'
  };

  const state = {
    root: null,
    destroyers: [],
    page: 'dashboard',
    session: null,
    cache: {
      users: null,
      providerRows: null
    }
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizeHeader(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s-]/g, '')
      .trim();
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let value = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"' && inQuotes && next === '"') {
        value += '"';
        i += 1;
        continue;
      }
      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (char === ',' && !inQuotes) {
        row.push(value);
        value = '';
        continue;
      }
      if ((char === '\n' || char === '\r') && !inQuotes) {
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
    const tryUrls = [];
    if (config.gid) {
      tryUrls.push(`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/gviz/tq?tqx=out:csv&gid=${config.gid}&v=${Date.now()}`);
    }
    if (config.sheetName) {
      tryUrls.push(`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(config.sheetName)}&v=${Date.now()}`);
    }

    let lastError = null;
    for (const url of tryUrls) {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        if (/googlevisualization|DOCTYPE html|<html/i.test(text.slice(0, 300))) {
          throw new Error(`${config.title} belum bisa dibaca publik.`);
        }
        const matrix = parseCsv(text);
        const headers = matrix.shift() || [];
        return matrix.map((cells) => {
          const row = {};
          const normalized = {};
          headers.forEach((header, index) => {
            const cleanHeader = String(header || '').trim();
            const cellValue = String(cells[index] || '').trim();
            row[cleanHeader] = cellValue;
            normalized[normalizeHeader(cleanHeader)] = cellValue;
          });
          row.__normalized = normalized;
          return row;
        }).filter((row) => Object.values(row.__normalized).some((value) => String(value).trim() !== ''));
      } catch (error) {
        lastError = error;
      }
    }
    throw new Error(lastError?.message || `Gagal mengambil ${config.title}.`);
  }

  function getField(row, candidates) {
    const map = row && row.__normalized ? row.__normalized : {};
    for (const candidate of candidates) {
      const key = normalizeHeader(candidate);
      if (Object.prototype.hasOwnProperty.call(map, key)) return map[key];
    }
    const candidateText = candidates.map(normalizeHeader);
    for (const [key, value] of Object.entries(map)) {
      if (candidateText.some((item) => key.includes(item) || item.includes(key))) return value;
    }
    return '';
  }

  function toNumber(value) {
    if (value === null || value === undefined) return 0;
    const raw = String(value).trim().replace(/\s/g, '');
    if (!raw || raw === '-' || raw.toLowerCase() === 'nan') return 0;
    const hasComma = raw.includes(',');
    const hasDot = raw.includes('.');
    let cleaned = raw.replace(/[^\d,.-]/g, '');
    if (hasComma && hasDot) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (hasComma && !hasDot) {
      const parts = cleaned.split(',');
      if (parts.length === 2 && parts[1].length <= 2) cleaned = `${parts[0]}.${parts[1]}`;
      else cleaned = cleaned.replace(/,/g, '');
    } else if (!hasComma && hasDot) {
      const parts = cleaned.split('.');
      if (parts.length > 2) cleaned = cleaned.replace(/\./g, '');
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

  function compactText(value) {
    const text = String(value || '').trim();
    return text || '-';
  }

  function persistSession(session) {
    state.session = session;
    localStorage.setItem(CONFIG.sessionKey, JSON.stringify(session));
  }

  function clearSession() {
    state.session = null;
    localStorage.removeItem(CONFIG.sessionKey);
  }

  function getStoredSession() {
    try {
      const raw = localStorage.getItem(CONFIG.sessionKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function renderLogin() {
    state.root.innerHTML = `
      <section class="pp-shell">
        <section class="pp-hero">
          <div class="pp-hero-glow"></div>
          <div class="pp-hero-top">
            <div>
              <span class="pp-kicker">Portal Data Pengadaan</span>
              <h2>Pemenang Pengadaan</h2>
              <p>Login internal untuk membuka pencarian paket penyedia dan pemantauan paket pengadaan aktif dari data spreadsheet yang Anda siapkan.</p>
            </div>
            <div class="pp-badge"><span>Akses Modul</span><b>Terintegrasi di Portal</b></div>
          </div>
          <div class="pp-hero-stats">
            <div class="pp-stat"><span class="pp-stat-label">Mode</span><strong class="pp-stat-value">Module Ready</strong><small>Sudah menyesuaikan loader portal Anda.</small></div>
            <div class="pp-stat"><span class="pp-stat-label">Login</span><strong class="pp-stat-value">USERID Sheet</strong><small>Validasi langsung ke spreadsheet internal.</small></div>
            <div class="pp-stat"><span class="pp-stat-label">Data</span><strong class="pp-stat-value">Tender + Non Tender</strong><small>Provider search siap membaca dua sheet utama.</small></div>
          </div>
        </section>

        <section class="pp-card" style="max-width:560px;margin:0 auto;width:100%">
          <div class="pp-card-head">
            <div>
              <h3>Masuk ke Portal</h3>
              <p class="pp-subnote">Masukkan user id dan password yang sudah Anda simpan di sheet USERID.</p>
            </div>
          </div>
          <form data-pp-login-form>
            <div class="pp-grid-two">
              <label class="pp-field"><span>User ID</span><input class="pp-input" type="text" name="userId" placeholder="Masukkan user id" required></label>
              <label class="pp-field"><span>Password</span><input class="pp-input" type="password" name="password" placeholder="Masukkan password" required></label>
            </div>
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:16px">
              <button type="submit" class="pp-button pp-button--primary" data-pp-login-submit>Masuk ke Portal</button>
              <span class="pp-helper" data-pp-login-error></span>
            </div>
          </form>
        </section>
      </section>
    `;

    const form = state.root.querySelector('[data-pp-login-form]');
    const submitButton = state.root.querySelector('[data-pp-login-submit]');
    const errorEl = state.root.querySelector('[data-pp-login-error]');

    const onSubmit = async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const userId = String(formData.get('userId') || '').trim();
      const password = String(formData.get('password') || '');

      if (!userId || !password) {
        errorEl.textContent = 'User ID dan password wajib diisi.';
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = 'Memeriksa akses...';
      errorEl.textContent = '';

      try {
        const rows = state.cache.users || await fetchSheetRows(CONFIG.userSheet);
        state.cache.users = rows;
        const matched = rows.find((row) => {
          const rowUserId = getField(row, ['USERID', 'user id', 'user']);
          const rowPassword = getField(row, ['PASSWORD', 'password', 'pass']);
          return rowUserId === userId && rowPassword === password;
        });
        if (!matched) throw new Error('User ID atau password tidak sesuai.');
        persistSession({ userId, loginAt: Date.now() });
        state.page = 'dashboard';
        renderCurrentPage();
      } catch (error) {
        errorEl.textContent = error.message || 'Login gagal.';
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Masuk ke Portal';
      }
    };

    form.addEventListener('submit', onSubmit);
    state.destroyers.push(() => form.removeEventListener('submit', onSubmit));
  }

  function dashboardTemplate() {
    return `
      <section class="pp-shell">
        <section class="pp-hero">
          <div class="pp-hero-glow"></div>
          <div class="pp-hero-top">
            <div>
              <span class="pp-kicker">Portal Data Pengadaan</span>
              <h2>Pemenang Pengadaan</h2>
              <p>Dashboard premium untuk membuka akses pencarian penyedia dan pemantauan paket aktif. Versi ini sudah menjadi modul portal yang rapi, aman, dan tidak bentrok dengan loader utama.</p>
              <div class="pp-actions">
                <button type="button" class="pp-button pp-button--light" data-pp-nav="provider-search">Buka Pencarian Penyedia</button>
                <button type="button" class="pp-button pp-button--ghost" data-pp-nav="active-packages">Lihat Paket Aktif</button>
                <button type="button" class="pp-button pp-button--ghost" data-pp-logout>Keluar</button>
              </div>
            </div>
            <div class="pp-badge"><span>Login sebagai</span><b>${escapeHtml(state.session?.userId || '-')}</b></div>
          </div>
          <div class="pp-hero-stats">
            <div class="pp-stat"><span class="pp-stat-label">Status Modul</span><strong class="pp-stat-value">Portal Ready</strong><small>Sudah ikut pola `__moduleInit` dan scoped ke container.</small></div>
            <div class="pp-stat"><span class="pp-stat-label">Menu Utama</span><strong class="pp-stat-value">2 Menu</strong><small>Pencarian penyedia dan paket aktif tersedia.</small></div>
            <div class="pp-stat"><span class="pp-stat-label">Akses</span><strong class="pp-stat-value">USERID Sheet</strong><small>Session disimpan lokal agar tidak login ulang terus.</small></div>
          </div>
        </section>

        <section class="pp-feature-grid">
          <button type="button" class="pp-feature pp-feature--blue" data-pp-nav="provider-search">
            <div class="pp-feature-icon">🔎</div>
            <div>
              <div class="pp-feature-kicker">Fitur Utama</div>
              <h4>Pencarian Paket Penyedia</h4>
              <p>Telusuri profil penyedia, jejak paket tender dan non tender, sebaran daerah, LPSE, dan daftar paket pemenang.</p>
            </div>
            <div class="pp-feature-arrow">→</div>
          </button>
          <button type="button" class="pp-feature pp-feature--teal" data-pp-nav="active-packages">
            <div class="pp-feature-icon">📦</div>
            <div>
              <div class="pp-feature-kicker">Fitur Utama</div>
              <h4>Paket Pengadaan Aktif</h4>
              <p>Pantau paket tender dan non tender yang sedang berjalan, fase aktif, jenis pengadaan, instansi, satker, dan LPSE.</p>
            </div>
            <div class="pp-feature-arrow">→</div>
          </button>
        </section>

        <section class="pp-card pp-disclaimer" data-pp-disclaimer>
          <button type="button" class="pp-disclaimer-toggle" data-pp-disclaimer-toggle aria-expanded="false">
            <span class="pp-disclaimer-left">
              <span class="pp-disclaimer-badge">!</span>
              <span>
                <strong>Sumber Data & Disclaimer</strong>
                <small>Panel informasi sumber data portal</small>
              </span>
            </span>
            <span class="pp-disclaimer-caret">⌄</span>
          </button>
          <div class="pp-disclaimer-body">
            <div class="pp-box-grid">
              <div class="pp-box">
                <h4>Sumber Data Utama</h4>
                <ul>
                  <li>Sheet <b>USERID</b> untuk validasi login user internal.</li>
                  <li>Sheet <b>SCRAPTENDER</b> untuk data paket tender.</li>
                  <li>Sheet <b>SCRAPNONTENDER</b> untuk data paket non tender.</li>
                </ul>
              </div>
              <div class="pp-box pp-box--gold">
                <h4>Catatan Pemakaian</h4>
                <ul>
                  <li>Data mengikuti hasil scraping dan pengolahan yang ada di spreadsheet.</li>
                  <li>Perubahan sumber tidak selalu real time.</li>
                  <li>Untuk keputusan penting, tetap cocokkan ke sumber resmi.</li>
                </ul>
              </div>
            </div>
            <div class="pp-footnote">Yang ini sekarang sudah rapi sebagai modul portal. Jadi tidak lagi bawa login shell, sidebar, atau app shell sendiri.</div>
          </div>
        </section>
      </section>
    `;
  }

  async function ensureProviderRows() {
    if (state.cache.providerRows) return state.cache.providerRows;
    const [tenderRows, nonTenderRows] = await Promise.all([
      fetchSheetRows(CONFIG.tenderSheet),
      fetchSheetRows(CONFIG.nonTenderSheet)
    ]);
    const mappedTender = tenderRows.map((row) => normalizeProviderRow(row, 'TENDER'));
    const mappedNon = nonTenderRows.map((row) => normalizeProviderRow(row, 'NON_TENDER'));
    state.cache.providerRows = mappedTender.concat(mappedNon);
    return state.cache.providerRows;
  }

  function normalizeProviderRow(row, jenis) {
    return {
      raw: row,
      jenis,
      tahun: compactText(getField(row, ['tahun', 'tahun anggaran', 'ta'])),
      kode: compactText(getField(row, ['kode', 'kode paket', 'id paket', 'id_paket'])),
      namaPaket: compactText(getField(row, ['nama_paket', 'nama paket', 'paket', 'nama tender'])),
      tahapan: compactText(getField(row, ['tahapan_list', 'tahapan', 'status', 'tahap proses'])),
      pagu: compactText(getField(row, ['pagu'])),
      hps: compactText(getField(row, ['hps'])),
      urlPemenang: compactText(getField(row, ['url_pemenang', 'url pemenang'])),
      namaPemenang: compactText(getField(row, ['nama_pemenang', 'nama pemenang', 'pemenang'])),
      npwp: compactText(getField(row, ['npwp'])),
      tanggalBuat: compactText(getField(row, ['tanggal_pembuatan_aktif', 'tanggal pembuatan aktif', 'tanggal_pembuatan'])),
      tanggalMulai: compactText(getField(row, ['tanggal_mulai', 'mulai', 'tanggal mulai'])),
      tanggalSampai: compactText(getField(row, ['tanggal_sampai', 'sampai', 'tanggal sampai'])),
      urlJadwal: compactText(getField(row, ['url_jadwal', 'url jadwal'])),
      urlPengumuman: compactText(getField(row, ['url_pengumuman', 'url pengumuman'])),
      instansi: compactText(getField(row, ['instansi', 'klpdinstansi lainya', 'kl/pd', 'instansi kerja'])),
      satuanKerja: compactText(getField(row, ['satuan kerja', 'satker', 'satuan_kerja'])),
      alamat: compactText(getField(row, ['alamat'])),
      lokasi: compactText(getField(row, ['lokasi pekerjaan', 'lokasi'])),
      peserta: compactText(getField(row, ['peserta'])),
      lpse: compactText(getField(row, ['lpse'])),
      jenisPengadaan: compactText(getField(row, ['jenis pengadaan', 'jenis', 'jenis_pengadaan'])),
      metode: compactText(getField(row, ['metode kualifikasi', 'metode', 'metode pemilihan']))
    };
  }

  function providerMatches(row, keyword, year) {
    const q = String(keyword || '').trim().toLowerCase();
    if (year && year !== 'SEMUA' && row.tahun !== year) return false;
    if (!q) return true;
    const haystack = [row.namaPemenang, row.namaPaket, row.instansi, row.satuanKerja, row.kode, row.npwp, row.lpse]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  }

  function providerSearchTemplate() {
    return `
      <section class="pp-shell">
        <section class="pp-card">
          <div class="pp-card-head">
            <div>
              <h3>Pencarian Paket Penyedia</h3>
              <p class="pp-subnote">Cari berdasarkan nama penyedia. Data dibaca dari sheet SCRAPTENDER dan SCRAPNONTENDER.</p>
            </div>
            <button type="button" class="pp-button pp-button--light" data-pp-nav="dashboard">Kembali ke Dashboard</button>
          </div>
          <div class="pp-toolbar">
            <label class="pp-field"><span>Nama Penyedia</span><input class="pp-input" type="text" placeholder="Masukkan nama penyedia / kata kunci" data-pp-provider-keyword></label>
            <label class="pp-field"><span>Tahun</span><select class="pp-select" data-pp-provider-year><option value="SEMUA">Semua Tahun</option></select></label>
            <button type="button" class="pp-button pp-button--primary" data-pp-provider-search>Cari Data</button>
          </div>
          <div class="pp-meta-strip">
            <span class="pp-pill">Tender + Non Tender</span>
            <span class="pp-pill">Detail expand siap</span>
            <span class="pp-pill">Link SPSE ikut terbaca</span>
          </div>
          <div class="pp-list" data-pp-provider-results>
            <div class="pp-empty">Masukkan kata kunci lalu klik cari.</div>
          </div>
        </section>
      </section>
    `;
  }

  function activePackagesTemplate() {
    return `
      <section class="pp-shell">
        <section class="pp-card">
          <div class="pp-card-head">
            <div>
              <h3>Paket Pengadaan Aktif</h3>
              <p class="pp-subnote">Kerangka menu 2 sudah aman sebagai modul. Search nama paket, instansi, satker, LPSE, filter jenis paket, dan filter tahap proses tinggal dilanjutkan di tahap berikutnya.</p>
            </div>
            <button type="button" class="pp-button pp-button--light" data-pp-nav="dashboard">Kembali ke Dashboard</button>
          </div>
          <div class="pp-headline"><h3>Stage berikutnya</h3><span class="pp-count">UI modul sudah portal-ready</span></div>
          <div class="pp-box-grid">
            <div class="pp-box"><h4>Yang akan dibangun</h4><ul><li>Search nama paket, instansi, satker, atau LPSE</li><li>Filter jenis paket: Semua / Tender / Non Tender</li><li>Filter tahap proses aktif</li><li>Card list dan detail expand seperti referensi Anda</li></ul></div>
            <div class="pp-box pp-box--gold"><h4>Status sekarang</h4><ul><li>Sudah tidak bentrok dengan loader portal</li><li>Sudah bisa dipanggil dari route module</li><li>Struktur CSS sudah dinamespace ke <b>.pp-*</b></li></ul></div>
          </div>
        </section>
      </section>
    `;
  }

  function resultCardTemplate(row, index) {
    const paguDisplay = row.pagu && row.pagu !== '-' ? formatMoney(row.pagu) : '-';
    const hpsDisplay = row.hps && row.hps !== '-' ? formatMoney(row.hps) : '-';
    const tenderClass = row.jenis === 'TENDER' ? 'pp-tag--tender' : 'pp-tag--nontender';
    const tenderLabel = row.jenis === 'TENDER' ? 'Tender' : 'Non Tender';
    const externalLinks = [
      row.urlPengumuman !== '-' ? `<a class="pp-link" href="${escapeHtml(row.urlPengumuman)}" target="_blank" rel="noopener noreferrer">Pengumuman</a>` : '',
      row.urlJadwal !== '-' ? `<a class="pp-link" href="${escapeHtml(row.urlJadwal)}" target="_blank" rel="noopener noreferrer">Jadwal</a>` : '',
      row.urlPemenang !== '-' ? `<a class="pp-link" href="${escapeHtml(row.urlPemenang)}" target="_blank" rel="noopener noreferrer">Pemenang</a>` : ''
    ].filter(Boolean).join('');

    return `
      <article class="pp-result" data-pp-result>
        <div class="pp-result-top">
          <div>
            <div class="pp-result-badges">
              <span class="pp-tag ${tenderClass}">${tenderLabel}</span>
              <span class="pp-tag pp-tag--muted">${escapeHtml(row.tahapan)}</span>
              <span class="pp-tag pp-tag--muted">#${index + 1}</span>
            </div>
            <h4 class="pp-result-title">${escapeHtml(row.namaPaket)}</h4>
            <div class="pp-result-sub">
              <span>${escapeHtml(row.instansi)}</span>
              <span>${escapeHtml(row.satuanKerja)}</span>
              <span>${escapeHtml(row.lpse)}</span>
            </div>
          </div>
          <div class="pp-price"><span>Nilai Pagu</span><b>${escapeHtml(paguDisplay)}</b></div>
        </div>
        <div class="pp-result-bar">
          <div class="pp-metric"><span>Pemenang</span><b>${escapeHtml(row.namaPemenang)}</b></div>
          <div class="pp-metric"><span>HPS</span><b>${escapeHtml(hpsDisplay)}</b></div>
          <div class="pp-metric"><span>Tanggal Mulai</span><b>${escapeHtml(row.tanggalMulai)}</b></div>
          <div class="pp-metric"><span>Tanggal Sampai</span><b>${escapeHtml(row.tanggalSampai)}</b></div>
        </div>
        <div class="pp-result-actions">
          <div class="pp-link-row">${externalLinks || '<span class="pp-helper">Link SPSE belum tersedia di baris ini.</span>'}</div>
          <button type="button" class="pp-toggle" data-pp-toggle-detail>${'Lihat detail lengkap'}</button>
        </div>
        <div class="pp-detail">
          <div class="pp-detail-grid">
            <div class="pp-detail-card">
              <h5>Identitas Paket</h5>
              <div class="pp-kv"><span>Kode Paket</span><b>${escapeHtml(row.kode)}</b></div>
              <div class="pp-kv"><span>Jenis Pengadaan</span><b>${escapeHtml(row.jenisPengadaan)}</b></div>
              <div class="pp-kv"><span>Tahapan</span><b>${escapeHtml(row.tahapan)}</b></div>
              <div class="pp-kv"><span>Instansi</span><b>${escapeHtml(row.instansi)}</b></div>
              <div class="pp-kv"><span>Satuan Kerja</span><b>${escapeHtml(row.satuanKerja)}</b></div>
              <div class="pp-kv"><span>LPSE</span><b>${escapeHtml(row.lpse)}</b></div>
              <div class="pp-kv"><span>Lokasi</span><b>${escapeHtml(row.lokasi)}</b></div>
            </div>
            <div class="pp-detail-card">
              <h5>Profil Pemenang</h5>
              <div class="pp-kv"><span>Nama Pemenang</span><b>${escapeHtml(row.namaPemenang)}</b></div>
              <div class="pp-kv"><span>NPWP</span><b>${escapeHtml(row.npwp)}</b></div>
              <div class="pp-kv"><span>Alamat</span><b>${escapeHtml(row.alamat)}</b></div>
              <div class="pp-kv"><span>Tanggal Pembuatan</span><b>${escapeHtml(row.tanggalBuat)}</b></div>
              <div class="pp-kv"><span>Mulai</span><b>${escapeHtml(row.tanggalMulai)}</b></div>
              <div class="pp-kv"><span>Sampai</span><b>${escapeHtml(row.tanggalSampai)}</b></div>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  async function renderProviderSearch() {
    state.root.innerHTML = providerSearchTemplate();
    bindSharedActions();

    const resultsEl = state.root.querySelector('[data-pp-provider-results]');
    const yearSelect = state.root.querySelector('[data-pp-provider-year]');
    const keywordInput = state.root.querySelector('[data-pp-provider-keyword]');
    const searchButton = state.root.querySelector('[data-pp-provider-search]');

    resultsEl.innerHTML = '<div class="pp-loading">Menyiapkan data provider search...</div>';
    try {
      const rows = await ensureProviderRows();
      const years = Array.from(new Set(rows.map((row) => row.tahun).filter((item) => item && item !== '-'))).sort((a, b) => String(b).localeCompare(String(a)));
      yearSelect.innerHTML = '<option value="SEMUA">Semua Tahun</option>' + years.map((year) => `<option value="${escapeHtml(year)}">${escapeHtml(year)}</option>`).join('');
      resultsEl.innerHTML = '<div class="pp-empty">Masukkan kata kunci lalu klik cari.</div>';

      const runSearch = () => {
        const filtered = rows.filter((row) => providerMatches(row, keywordInput.value, yearSelect.value)).slice(0, 80);
        if (!String(keywordInput.value || '').trim()) {
          resultsEl.innerHTML = '<div class="pp-empty">Masukkan kata kunci lalu klik cari.</div>';
          return;
        }
        if (!filtered.length) {
          resultsEl.innerHTML = '<div class="pp-empty">Data tidak ditemukan untuk kata kunci tersebut.</div>';
          return;
        }
        resultsEl.innerHTML = filtered.map((row, index) => resultCardTemplate(row, index)).join('');
        bindResultToggles();
      };

      const onClick = () => runSearch();
      const onKey = (event) => { if (event.key === 'Enter') runSearch(); };
      searchButton.addEventListener('click', onClick);
      keywordInput.addEventListener('keydown', onKey);
      yearSelect.addEventListener('change', runSearch);
      state.destroyers.push(() => searchButton.removeEventListener('click', onClick));
      state.destroyers.push(() => keywordInput.removeEventListener('keydown', onKey));
      state.destroyers.push(() => yearSelect.removeEventListener('change', runSearch));
    } catch (error) {
      resultsEl.innerHTML = `<div class="pp-empty">Gagal membaca data sheet. Detail: ${escapeHtml(error.message || 'Unknown error')}</div>`;
    }
  }

  function bindResultToggles() {
    state.root.querySelectorAll('[data-pp-toggle-detail]').forEach((button) => {
      const onClick = () => {
        const card = button.closest('[data-pp-result]');
        if (!card) return;
        const open = card.classList.toggle('is-open');
        button.textContent = open ? 'Tutup detail' : 'Lihat detail lengkap';
      };
      button.addEventListener('click', onClick);
      state.destroyers.push(() => button.removeEventListener('click', onClick));
    });
  }

  function bindSharedActions() {
    state.root.querySelectorAll('[data-pp-nav]').forEach((button) => {
      const onClick = () => {
        state.page = button.getAttribute('data-pp-nav') || 'dashboard';
        renderCurrentPage();
      };
      button.addEventListener('click', onClick);
      state.destroyers.push(() => button.removeEventListener('click', onClick));
    });

    state.root.querySelectorAll('[data-pp-logout]').forEach((button) => {
      const onClick = () => {
        clearSession();
        state.page = 'dashboard';
        renderCurrentPage();
      };
      button.addEventListener('click', onClick);
      state.destroyers.push(() => button.removeEventListener('click', onClick));
    });

    const disclaimer = state.root.querySelector('[data-pp-disclaimer]');
    const toggle = state.root.querySelector('[data-pp-disclaimer-toggle]');
    if (disclaimer && toggle) {
      const onToggle = () => {
        const open = disclaimer.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
      toggle.addEventListener('click', onToggle);
      state.destroyers.push(() => toggle.removeEventListener('click', onToggle));
    }
  }

  function cleanup() {
    while (state.destroyers.length) {
      const destroy = state.destroyers.pop();
      try { destroy(); } catch (error) { /* ignore */ }
    }
  }

  function renderCurrentPage() {
    cleanup();
    state.session = getStoredSession();
    if (!state.session) {
      renderLogin();
      return;
    }
    if (state.page === 'provider-search') {
      renderProviderSearch();
      return;
    }
    if (state.page === 'active-packages') {
      state.root.innerHTML = activePackagesTemplate();
      bindSharedActions();
      return;
    }
    state.root.innerHTML = dashboardTemplate();
    bindSharedActions();
  }

  window.__moduleInit = function ({ container }) {
    const root = container.querySelector('[data-pp-module]') || container;
    state.root = root;
    state.page = 'dashboard';
    state.session = getStoredSession();
    renderCurrentPage();
    return function destroy() {
      cleanup();
      if (state.root) state.root.innerHTML = '';
      state.root = null;
    };
  };
})();
