(function () {
  'use strict';

  const PP_CONFIG = {
    userSheet: {
      spreadsheetId: '1DYsqMtvwhPn-IEA3te9fFukD_iMMDRqUNPamktuPz2U',
      gid: '574346425',
      title: 'USERID'
    },
    tenderSheet: {
      spreadsheetId: '1DYsqMtvwhPn-IEA3te9fFukD_iMMDRqUNPamktuPz2U',
      sheetName: 'SCRAPTENDER',
      title: 'SCRAPTENDER'
    },
    nonTenderSheet: {
      spreadsheetId: '1DYsqMtvwhPn-IEA3te9fFukD_iMMDRqUNPamktuPz2U',
      sheetName: 'SCRAPNONTENDER',
      title: 'SCRAPNONTENDER'
    },
    sessionKey: 'pp_module_login_session_v2',
    cacheKey: 'pp_module_sheet_cache_v2'
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

  function getField(row, candidates) {
    const map = row && row.__normalized ? row.__normalized : {};
    for (const candidate of candidates) {
      const key = normalizeHeader(candidate);
      if (Object.prototype.hasOwnProperty.call(map, key)) return map[key];
    }

    const normalizedCandidates = candidates.map(normalizeHeader);
    for (const [key, value] of Object.entries(map)) {
      if (normalizedCandidates.some((candidate) => key.includes(candidate) || candidate.includes(key))) {
        return value;
      }
    }
    return '';
  }

  function toNumber(value) {
    if (value === null || value === undefined) return 0;
    let raw = String(value).trim();
    if (!raw || raw === '-') return 0;
    raw = raw.replace(/rp\.?/gi, '').replace(/\s+/g, '');
    const hasComma = raw.includes(',');
    const hasDot = raw.includes('.');
    let cleaned = raw.replace(/[^\d,.-]/g, '');

    if (hasComma && hasDot) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (hasComma) {
      const parts = cleaned.split(',');
      if (parts.length === 2 && parts[1].length <= 2) cleaned = `${parts[0]}.${parts[1]}`;
      else cleaned = cleaned.replace(/,/g, '');
    } else if (hasDot) {
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
    if (number >= 1_000_000) return `Rp ${(number / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Jt`;
    return `Rp ${formatNumber(number)}`;
  }

  function formatDateTime(value) {
    const text = String(value || '').trim();
    if (!text) return '-';
    const iso = new Date(text);
    if (!Number.isNaN(iso.getTime())) {
      return iso.toLocaleString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    }
    return text;
  }

  function safeUrl(url) {
    const value = String(url || '').trim();
    return /^https?:\/\//i.test(value) ? value : '';
  }

  function persistSession(session) {
    localStorage.setItem(PP_CONFIG.sessionKey, JSON.stringify(session));
  }

  function getStoredSession() {
    try {
      const raw = localStorage.getItem(PP_CONFIG.sessionKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function clearSession() {
    localStorage.removeItem(PP_CONFIG.sessionKey);
  }

  async function fetchSheetRows(config) {
    const url = config.sheetName
      ? `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(config.sheetName)}&v=${Date.now()}`
      : `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/gviz/tq?tqx=out:csv&gid=${config.gid}&v=${Date.now()}`;

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Gagal mengambil ${config.title}. HTTP ${response.status}`);
    }

    const text = await response.text();
    if (/googlevisualization|DOCTYPE html|<html/i.test(text.slice(0, 300))) {
      throw new Error(`${config.title} belum bisa dibaca publik. Pastikan spreadsheet viewer aktif.`);
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
  }

  function getCache() {
    try {
      const raw = localStorage.getItem(PP_CONFIG.cacheKey);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  function setCache(cache) {
    localStorage.setItem(PP_CONFIG.cacheKey, JSON.stringify(cache));
  }

  function makeRecord(row, type) {
    const stage = getField(row, ['tahapan_aktif', 'tahapan aktif', 'tahapan_list', 'tahapan list', 'tahapan']);
    const record = {
      sourceType: type,
      year: getField(row, ['tahun', 'ta']) || '-',
      instansi: getField(row, ['instansi', 'k/l/pd/instansi lainnya', 'k/l/pd/instansi']) || '-',
      jenis: type === 'TENDER' ? 'Tender' : 'Non Tender',
      kode: getField(row, ['kode', 'id paket', 'kode paket']) || '-',
      namaPaket: getField(row, ['nama_paket', 'nama paket']) || '-',
      tahapanList: getField(row, ['tahapan_list', 'tahapan list', 'tahapan']) || '-',
      tahapanAktif: stage || '-',
      pagu: getField(row, ['pagu', 'nilai pagu']) || '0',
      hps: getField(row, ['hps', 'nilai hps']) || '0',
      urlPemenang: getField(row, ['url_pemenang', 'url pemenang']) || '',
      namaPemenang: getField(row, ['nama_pemenang', 'nama pemenang']) || '-',
      npwp: getField(row, ['npwp']) || '-',
      satker: getField(row, ['satker', 'satuan kerja']) || '-',
      lpse: getField(row, ['lpse']) || '-',
      lokasi: getField(row, ['lokasi', 'lokasi pekerjaan']) || '-',
      tanggalMulai: getField(row, ['tanggal_mulai', 'tanggal mulai']) || '-',
      tanggalSampai: getField(row, ['tanggal_sampai', 'tanggal sampai']) || '-',
      urlJadwal: getField(row, ['url_jadwal', 'url jadwal']) || '',
      urlPengumuman: getField(row, ['url_pengumuman', 'url pengumuman']) || '',
      alamat: getField(row, ['alamat']) || '-',
      peserta: getField(row, ['peserta']) || '-',
      metode: getField(row, ['metode', 'metode kualifikasi', 'metode pemilihan']) || '-',
      jenisPengadaan: getField(row, ['jenis pengadaan', 'jenis_pengadaan']) || '-',
      kontrak: getField(row, ['kontrak', 'nilai kontrak']) || '0',
      tahapLabel: stage || getField(row, ['tahapan_list', 'tahapan list']) || '-',
      raw: row
    };

    const lower = `${record.tahapanAktif} ${record.tahapanList}`.toLowerCase();
    record.isFinished = /(selesai|berakhir|batal|gagal|sudah selesai)/i.test(lower);
    record.isActive = !record.isFinished && /(aktif|pengumuman|download|kualifikasi|evaluasi|penetapan|sanggah|kontrak|penandatanganan|paket aktif|masa sanggah|prakualifikasi)/i.test(lower);
    record.searchBlob = [
      record.namaPaket,
      record.instansi,
      record.satker,
      record.lpse,
      record.namaPemenang,
      record.npwp,
      record.kode,
      record.lokasi,
      record.tahapanAktif,
      record.tahapanList
    ].join(' ').toLowerCase();
    return record;
  }

  async function ensureData(state) {
    if (state.datasetLoaded) return;

    const cache = getCache();
    const now = Date.now();
    const cacheMaxAge = 1000 * 60 * 15;
    if (cache.timestamp && now - cache.timestamp < cacheMaxAge && Array.isArray(cache.records)) {
      state.records = cache.records;
      state.datasetLoaded = true;
      state.years = Array.from(new Set(state.records.map((item) => item.year).filter(Boolean))).sort((a, b) => String(b).localeCompare(String(a)));
      state.activeStageOptions = buildStageOptions(state.records.filter((item) => item.isActive));
      return;
    }

    const [tenderRows, nonTenderRows] = await Promise.all([
      fetchSheetRows(PP_CONFIG.tenderSheet),
      fetchSheetRows(PP_CONFIG.nonTenderSheet)
    ]);

    const tenderRecords = tenderRows.map((row) => makeRecord(row, 'TENDER'));
    const nonTenderRecords = nonTenderRows.map((row) => makeRecord(row, 'NON_TENDER'));
    state.records = [...tenderRecords, ...nonTenderRecords];
    state.datasetLoaded = true;
    state.years = Array.from(new Set(state.records.map((item) => item.year).filter(Boolean))).sort((a, b) => String(b).localeCompare(String(a)));
    state.activeStageOptions = buildStageOptions(state.records.filter((item) => item.isActive));
    setCache({ timestamp: now, records: state.records });
  }

  function buildStageOptions(records) {
    const labels = new Map();
    records.forEach((item) => {
      const raw = String(item.tahapanAktif || item.tahapanList || '').trim();
      if (!raw) return;
      labels.set(raw, true);
    });
    return Array.from(labels.keys()).sort((a, b) => a.localeCompare(b, 'id'));
  }

  function computeProviderSummary(records) {
    const providers = new Set(records.map((item) => String(item.namaPemenang || '').trim()).filter(Boolean));
    const instansi = new Set(records.map((item) => String(item.instansi || '').trim()).filter(Boolean));
    const lpse = new Set(records.map((item) => String(item.lpse || '').trim()).filter(Boolean));
    const totalPagu = records.reduce((sum, item) => sum + toNumber(item.pagu), 0);
    return {
      paket: records.length,
      penyedia: providers.size,
      instansi: instansi.size,
      lpse: lpse.size,
      totalPagu
    };
  }

  function computeActiveSummary(records) {
    const instansi = new Set(records.map((item) => String(item.instansi || '').trim()).filter(Boolean));
    const lpse = new Set(records.map((item) => String(item.lpse || '').trim()).filter(Boolean));
    const pemenang = records.filter((item) => String(item.namaPemenang || '').trim() && item.namaPemenang !== '-').length;
    const totalPagu = records.reduce((sum, item) => sum + toNumber(item.pagu), 0);
    const totalKontrak = records.reduce((sum, item) => sum + toNumber(item.kontrak), 0);
    return {
      paket: records.length,
      instansi: instansi.size,
      lpse: lpse.size,
      pemenang,
      totalPagu,
      totalKontrak
    };
  }

  function renderDashboardSection(state) {
    return `
      <section class="pp-hero pp-fade-in">
        <div class="pp-hero-reflex"></div>
        <div class="pp-hero-glow"></div>
        <div class="pp-hero-top">
          <div>
            <span class="pp-kicker">Portal Data Pengadaan</span>
            <h1>Pemenang Pengadaan</h1>
            <p>Portal premium untuk membuka jejak pemenang tender dan non tender, memantau paket pengadaan aktif, lalu menelusuri detail identitas paket secara lebih cepat dan lebih rapi.</p>
          </div>
          <div class="pp-hero-badge">
            <span>Status Akses</span>
            <b>Login aktif dari sheet USERID.<br>Data baca langsung dari sheet tender & non tender.</b>
          </div>
        </div>

        <div class="pp-stat-grid">
          <div class="pp-stat-card">
            <span class="pp-stat-label">Menu Portal</span>
            <strong class="pp-stat-value">2 Menu</strong>
            <span class="pp-stat-desc">Pencarian Paket Penyedia dan Paket Pengadaan Aktif siap dipakai.</span>
          </div>
          <div class="pp-stat-card">
            <span class="pp-stat-label">Session Login</span>
            <strong class="pp-stat-value">Aktif</strong>
            <span class="pp-stat-desc">Masuk sebagai ${escapeHtml(state.session?.userId || '-')} dan langsung bisa buka pencarian.</span>
          </div>
          <div class="pp-stat-card">
            <span class="pp-stat-label">Sumber Data</span>
            <strong class="pp-stat-value">2 Sheet</strong>
            <span class="pp-stat-desc">SCRAPTENDER dan SCRAPNONTENDER dipakai sebagai sumber utama portal.</span>
          </div>
        </div>
      </section>

      <section class="pp-feature-grid pp-fade-in">
        <button type="button" class="pp-feature-card pp-feature-card--blue" data-pp-nav="provider-search">
          <div class="pp-feature-icon">🔎</div>
          <div>
            <div class="pp-feature-kicker">Fitur Utama</div>
            <h3>Pencarian Paket Penyedia</h3>
            <p>Telusuri nama penyedia, lihat semua paket tender dan non tender, buka identitas paket, profil pemenang, dan tautan SPSE.</p>
          </div>
          <div class="pp-feature-arrow">→</div>
        </button>

        <button type="button" class="pp-feature-card pp-feature-card--teal" data-pp-nav="active-packages">
          <div class="pp-feature-icon">📦</div>
          <div>
            <div class="pp-feature-kicker">Fitur Utama</div>
            <h3>Paket Pengadaan Aktif</h3>
            <p>Cari paket aktif berdasarkan nama paket, instansi, satker, atau LPSE. Lengkap dengan filter jenis paket, tahap proses, dan panel detail.</p>
          </div>
          <div class="pp-feature-arrow">→</div>
        </button>
      </section>

      <section class="pp-card pp-disclaimer pp-fade-in ${state.disclaimerOpen ? 'is-open' : ''}" data-pp-disclaimer>
        <button type="button" class="pp-disclaimer-toggle" data-pp-action="toggle-disclaimer">
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
          <div class="pp-disclaimer-grid">
            <div class="pp-disclaimer-box pp-disclaimer-box--blue">
              <h4>Sumber Data Utama</h4>
              <ul>
                <li>Sheet <b>USERID</b> dipakai untuk validasi login user internal.</li>
                <li>Sheet <b>SCRAPTENDER</b> dibaca untuk data tender.</li>
                <li>Sheet <b>SCRAPNONTENDER</b> dibaca untuk data non tender.</li>
              </ul>
            </div>
            <div class="pp-disclaimer-box pp-disclaimer-box--gold">
              <h4>Catatan Pemakaian</h4>
              <ul>
                <li>Data portal mengikuti hasil pengambilan yang tersedia di spreadsheet Anda.</li>
                <li>Pembaruan data tidak selalu real time, tergantung kapan sheet diperbarui.</li>
                <li>Untuk keputusan penting, tetap cocokkan dengan sumber SPSE resmi.</li>
              </ul>
            </div>
          </div>
          <div class="pp-footnote">Tampilan portal ini sengaja dibuat lebih premium dan lebih bersih supaya enak dipakai di layar kantor, tapi isi data tetap mengikuti spreadsheet internal Anda.</div>
        </div>
      </section>
    `;
  }

  function renderProviderSection(state) {
    const summary = computeProviderSummary(state.records || []);
    const years = ['Semua Tahun', ...(state.years || [])];
    return `
      <section class="pp-hero pp-fade-in">
        <div class="pp-hero-reflex"></div>
        <div class="pp-hero-glow"></div>
        <div class="pp-hero-top">
          <div>
            <span class="pp-kicker">Menu 1 · Pencarian Paket Penyedia</span>
            <h2>Pencarian Paket Penyedia</h2>
            <p>Masukkan nama penyedia, PT, CV, atau kata kunci parsial. Sistem akan membaca sheet tender dan non tender, lalu menampilkan daftar paket, sebaran instansi, LPSE, dan detail identitas paket.</p>
          </div>
          <div class="pp-hero-badge">
            <span>Dataset Gabungan</span>
            <b>${summary.paket.toLocaleString('id-ID')} paket<br>${summary.penyedia.toLocaleString('id-ID')} penyedia</b>
          </div>
        </div>
      </section>

      <section class="pp-card pp-fade-in">
        <div class="pp-card-head">
          <div>
            <span class="pp-soft-pill">Pencarian Premium</span>
            <h3>Buka jejak penyedia</h3>
            <p>Pencarian difokuskan ke nama pemenang, namun tetap dibantu oleh nama paket, instansi, satker, LPSE, kode paket, dan NPWP agar hasil lebih mudah ditemukan.</p>
          </div>
        </div>

        <div class="pp-search-toolbar">
          <label class="pp-field">
            <span>Nama penyedia</span>
            <input type="text" id="ppProviderKeyword" placeholder="Masukkan nama PT, CV, UD, atau kata kunci parsial" value="${escapeHtml(state.providerKeyword)}">
          </label>
          <label class="pp-field">
            <span>Tahun</span>
            <select id="ppProviderYear">
              ${years.map((year) => `<option value="${escapeHtml(year)}" ${String(state.providerYear) === String(year) ? 'selected' : ''}>${escapeHtml(year)}</option>`).join('')}
            </select>
          </label>
          <button type="button" class="pp-btn pp-btn-primary" data-pp-action="provider-search">Cari Penyedia</button>
        </div>

        <div class="pp-metrics-grid">
          <div class="pp-mini-metric"><span>Total Paket</span><strong>${summary.paket.toLocaleString('id-ID')}</strong><small>Gabungan tender dan non tender yang sudah tersimpan di sheet.</small></div>
          <div class="pp-mini-metric"><span>Total Penyedia</span><strong>${summary.penyedia.toLocaleString('id-ID')}</strong><small>Jumlah nama pemenang unik yang berhasil terbaca.</small></div>
          <div class="pp-mini-metric"><span>Total Instansi</span><strong>${summary.instansi.toLocaleString('id-ID')}</strong><small>Instansi atau daerah yang muncul di dataset gabungan.</small></div>
          <div class="pp-mini-metric"><span>Total Nilai Pagu</span><strong>${formatMoney(summary.totalPagu)}</strong><small>Akumulasi pagu seluruh data yang tersedia di sheet.</small></div>
        </div>
      </section>

      <section class="pp-card pp-fade-in">
        <div class="pp-section-head">
          <div>
            <span class="pp-soft-pill">Hasil Pencarian</span>
            <h3>Daftar paket penyedia</h3>
            <p>${state.providerHasSearched ? `Menampilkan ${state.providerResults.length.toLocaleString('id-ID')} hasil untuk pencarian saat ini.` : 'Masukkan nama penyedia lalu tekan tombol cari untuk menampilkan hasil.'}</p>
          </div>
          <div class="pp-sort-row">
            <button type="button" class="pp-btn pp-btn-soft" data-pp-nav="dashboard">Kembali</button>
          </div>
        </div>
        <div id="ppProviderResults">${renderProviderResults(state)}</div>
      </section>
    `;
  }

  function renderProviderResults(state) {
    if (!state.providerHasSearched) {
      return `<div class="pp-empty">Pencarian belum dijalankan. Isi nama penyedia lebih dulu, misalnya PT, CV, atau kata kunci parsial nama pemenang.</div>`;
    }

    if (!state.providerResults.length) {
      return `<div class="pp-empty">Data penyedia tidak ditemukan. Coba ganti kata kunci, kosongkan filter tahun, atau gunakan potongan nama yang lebih pendek.</div>`;
    }

    return `<div class="pp-results">${state.providerResults.map((item) => renderProviderCard(item, state.providerOpenMap[item.kode])).join('')}</div>`;
  }

  function renderProviderCard(item, isOpen) {
    const urls = [
      { label: 'Portal SPSE', url: safeUrl(item.urlPemenang), primary: true },
      { label: 'Pengumuman', url: safeUrl(item.urlPengumuman) },
      { label: 'Jadwal', url: safeUrl(item.urlJadwal) }
    ].filter((itemUrl) => itemUrl.url);

    return `
      <article class="pp-result-card ${isOpen ? 'is-open' : ''}">
        <div class="pp-result-top">
          <div class="pp-result-title">
            <h4>${escapeHtml(item.namaPaket)}</h4>
            <div class="pp-result-sub">
              <span class="pp-badge ${item.sourceType === 'TENDER' ? 'pp-badge--tender' : 'pp-badge--nontender'}">${escapeHtml(item.jenis)}</span>
              <span class="pp-badge pp-badge--muted">TA ${escapeHtml(item.year)}</span>
              <span class="pp-badge ${item.isFinished ? 'pp-badge--warning' : 'pp-badge--active'}">${escapeHtml(item.tahapanAktif || item.tahapanList)}</span>
            </div>
          </div>
          <div class="pp-price-box">
            <span>${item.sourceType === 'TENDER' ? 'Nilai HPS' : 'Nilai Pagu'}</span>
            <strong>${formatMoney(item.sourceType === 'TENDER' ? item.hps || item.pagu : item.pagu)}</strong>
          </div>
        </div>

        <div class="pp-result-strip">
          <div><b>Pemenang:</b> ${escapeHtml(item.namaPemenang)}</div>
          <div><b>NPWP:</b> ${escapeHtml(item.npwp || '-')}</div>
        </div>

        <div class="pp-result-grid">
          <div class="pp-info-box"><span>Instansi</span><strong>${escapeHtml(item.instansi)}</strong></div>
          <div class="pp-info-box"><span>Satker</span><strong>${escapeHtml(item.satker)}</strong></div>
          <div class="pp-info-box"><span>LPSE</span><strong>${escapeHtml(item.lpse)}</strong></div>
          <div class="pp-info-box"><span>Kode Paket</span><strong>${escapeHtml(item.kode)}</strong></div>
        </div>

        <div class="pp-result-footer">
          <div class="pp-result-footer-left">
            ${urls.map((entry) => `<a class="pp-link-btn ${entry.primary ? 'pp-link-btn--primary' : ''}" href="${escapeHtml(entry.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.label)} <span>↗</span></a>`).join('')}
          </div>
          <button type="button" class="pp-toggle-detail" data-pp-action="toggle-provider-detail" data-pp-code="${escapeHtml(item.kode)}">${isOpen ? 'Tutup detail' : 'Lihat detail lengkap'}</button>
        </div>

        <div class="pp-detail">
          <div class="pp-detail-grid">
            <div class="pp-detail-box">
              <h5>Identitas Paket</h5>
              <dl class="pp-key-list">
                <dt>Kode Paket</dt><dd>${escapeHtml(item.kode)}</dd>
                <dt>Nama Paket</dt><dd>${escapeHtml(item.namaPaket)}</dd>
                <dt>Jenis</dt><dd>${escapeHtml(item.jenisPengadaan || item.jenis)}</dd>
                <dt>Metode</dt><dd>${escapeHtml(item.metode)}</dd>
                <dt>Satker</dt><dd>${escapeHtml(item.satker)}</dd>
                <dt>LPSE</dt><dd>${escapeHtml(item.lpse)}</dd>
                <dt>Lokasi</dt><dd>${escapeHtml(item.lokasi)}</dd>
                <dt>Peserta</dt><dd>${escapeHtml(item.peserta)}</dd>
                <dt>Tahap Aktif</dt><dd>${escapeHtml(item.tahapanAktif || item.tahapanList)}</dd>
                <dt>Tanggal Mulai</dt><dd>${escapeHtml(formatDateTime(item.tanggalMulai))}</dd>
                <dt>Tanggal Selesai</dt><dd>${escapeHtml(formatDateTime(item.tanggalSampai))}</dd>
              </dl>
            </div>
            <div class="pp-detail-box">
              <h5>Profil Pemenang</h5>
              <dl class="pp-key-list">
                <dt>Nama Pemenang</dt><dd>${escapeHtml(item.namaPemenang)}</dd>
                <dt>NPWP</dt><dd>${escapeHtml(item.npwp)}</dd>
                <dt>Alamat</dt><dd>${escapeHtml(item.alamat)}</dd>
                <dt>Nilai Pagu</dt><dd>${escapeHtml(formatMoney(item.pagu))}</dd>
                <dt>Nilai HPS</dt><dd>${escapeHtml(formatMoney(item.hps || 0))}</dd>
                <dt>Nilai Kontrak</dt><dd>${escapeHtml(formatMoney(item.kontrak || 0))}</dd>
              </dl>
              <div class="pp-link-stack" style="margin-top:14px;">
                ${urls.length ? urls.map((entry) => `<a class="pp-link-btn ${entry.primary ? 'pp-link-btn--primary' : ''}" href="${escapeHtml(entry.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.label)} <span>↗</span></a>`).join('') : '<div class="pp-empty">Tautan SPSE tidak tersedia pada baris data ini.</div>'}
              </div>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function renderActiveSection(state) {
    const summary = computeActiveSummary(state.records.filter((item) => item.isActive));
    const years = ['Semua Tahun', ...(state.years || [])];
    return `
      <section class="pp-hero pp-fade-in">
        <div class="pp-hero-reflex"></div>
        <div class="pp-hero-glow"></div>
        <div class="pp-hero-top">
          <div>
            <span class="pp-kicker">Menu 2 · Paket Pengadaan Aktif</span>
            <h2>Paket Pengadaan Aktif</h2>
            <p>Pantau paket aktif dari tender dan non tender, cari nama paket, instansi, satker, atau LPSE, lalu buka detailnya tanpa harus lompat ke banyak halaman.</p>
          </div>
          <div class="pp-hero-badge">
            <span>Ringkasan Aktif</span>
            <b>${summary.paket.toLocaleString('id-ID')} paket aktif<br>${formatMoney(summary.totalPagu)} total pagu</b>
          </div>
        </div>
      </section>

      <section class="pp-card pp-fade-in">
        <div class="pp-card-head">
          <div>
            <span class="pp-soft-pill">Search & Filter</span>
            <h3>Cari paket yang sedang berjalan</h3>
            <p>Filter bisa dipakai untuk nama paket, instansi, satker, LPSE, jenis paket, dan tahap proses. Tampilan ini disusun lebih premium dari referensi, tapi tetap cepat dibaca.</p>
          </div>
        </div>

        <div class="pp-search-toolbar">
          <label class="pp-field">
            <span>Pencarian umum</span>
            <input type="text" id="ppActiveKeyword" placeholder="Cari nama paket, instansi, satker, atau LPSE" value="${escapeHtml(state.activeKeyword)}">
          </label>
          <label class="pp-field">
            <span>Tahun</span>
            <select id="ppActiveYear">
              ${years.map((year) => `<option value="${escapeHtml(year)}" ${String(state.activeYear) === String(year) ? 'selected' : ''}>${escapeHtml(year)}</option>`).join('')}
            </select>
          </label>
          <button type="button" class="pp-btn pp-btn-primary" data-pp-action="active-search">Cari Paket</button>
        </div>

        <div class="pp-grid-main" style="margin-top:16px;">
          <div class="pp-card" style="padding:16px; margin:0; box-shadow:none; background:linear-gradient(180deg,#fff,#f8fbff);">
            <div class="pp-field" style="margin-bottom:10px;">
              <span>Jenis Paket</span>
            </div>
            <div class="pp-chip-group">
              <button type="button" class="pp-chip ${state.activeJenis === 'SEMUA' ? 'is-active' : ''}" data-pp-filter-jenis="SEMUA">Semua</button>
              <button type="button" class="pp-chip ${state.activeJenis === 'TENDER' ? 'is-active' : ''}" data-pp-filter-jenis="TENDER">Tender</button>
              <button type="button" class="pp-chip ${state.activeJenis === 'NON_TENDER' ? 'is-active' : ''}" data-pp-filter-jenis="NON_TENDER">Non Tender</button>
            </div>
          </div>

          <div class="pp-card" style="padding:16px; margin:0; box-shadow:none; background:linear-gradient(180deg,#fff,#f8fbff);">
            <div class="pp-field" style="margin-bottom:10px;">
              <span>Tahap Proses</span>
            </div>
            <div class="pp-chip-group">
              <button type="button" class="pp-chip pp-chip--soft ${state.activeTahap === 'SEMUA' ? 'is-active' : ''}" data-pp-filter-stage="SEMUA">Semua Aktif</button>
              ${state.activeStageOptions.map((stage) => `<button type="button" class="pp-chip pp-chip--soft ${state.activeTahap === stage ? 'is-active' : ''}" data-pp-filter-stage="${escapeHtml(stage)}">${escapeHtml(stage)}</button>`).join('')}
            </div>
          </div>
        </div>

        <div class="pp-metrics-grid">
          <div class="pp-mini-metric"><span>Hasil Ditemukan</span><strong>${state.activeResults.length.toLocaleString('id-ID')}</strong><small>Jumlah paket aktif setelah search dan filter dijalankan.</small></div>
          <div class="pp-mini-metric"><span>Total Instansi</span><strong>${summary.instansi.toLocaleString('id-ID')}</strong><small>Instansi yang muncul di paket aktif saat ini.</small></div>
          <div class="pp-mini-metric"><span>LPSE Terbaca</span><strong>${summary.lpse.toLocaleString('id-ID')}</strong><small>Jumlah LPSE aktif yang tercakup di data hasil filter.</small></div>
          <div class="pp-mini-metric"><span>Total Kontrak</span><strong>${formatMoney(summary.totalKontrak)}</strong><small>Akumulasi nilai kontrak yang berhasil terbaca dari paket aktif.</small></div>
        </div>
      </section>

      <section class="pp-card pp-fade-in">
        <div class="pp-section-head">
          <div>
            <span class="pp-soft-pill">Daftar Paket Berproses</span>
            <h3>Daftar paket aktif</h3>
            <p>Menampilkan ${state.activeResults.length.toLocaleString('id-ID')} paket yang lolos filter. Klik detail untuk membuka identitas paket dan tautan SPSE.</p>
          </div>
          <div class="pp-sort-row">
            <span class="pp-soft-pill">Sort</span>
            <button type="button" class="pp-sort-chip ${state.activeSort === 'deadline' ? 'is-active' : ''}" data-pp-sort="deadline">Deadline</button>
            <button type="button" class="pp-sort-chip ${state.activeSort === 'nilai' ? 'is-active' : ''}" data-pp-sort="nilai">Nilai</button>
            <button type="button" class="pp-sort-chip ${state.activeSort === 'nama' ? 'is-active' : ''}" data-pp-sort="nama">Nama</button>
            <button type="button" class="pp-sort-chip ${state.activeSort === 'instansi' ? 'is-active' : ''}" data-pp-sort="instansi">Instansi</button>
          </div>
        </div>
        <div id="ppActiveResults">${renderActiveResults(state)}</div>
      </section>
    `;
  }

  function renderActiveResults(state) {
    if (!state.activeHasSearched && !state.activeResults.length) {
      return `<div class="pp-empty">Menu paket aktif sudah siap. Tekan cari paket untuk menampilkan daftar paket aktif dari dataset yang tersedia.</div>`;
    }

    if (!state.activeResults.length) {
      return `<div class="pp-empty">Tidak ada paket aktif yang cocok dengan filter saat ini. Coba kosongkan pencarian, ganti tahun, atau pilih tahap proses lain.</div>`;
    }

    return `<div class="pp-results">${state.activeResults.map((item) => renderActiveCard(item, state.activeOpenMap[item.kode])).join('')}</div>`;
  }

  function renderActiveCard(item, isOpen) {
    const urls = [
      { label: 'Pengumuman', url: safeUrl(item.urlPengumuman), primary: true },
      { label: 'Jadwal Pengadaan', url: safeUrl(item.urlJadwal) },
      { label: 'Pemenang & Kontrak', url: safeUrl(item.urlPemenang) }
    ].filter((itemUrl) => itemUrl.url);

    return `
      <article class="pp-active-card ${isOpen ? 'is-open' : ''}">
        <div class="pp-active-top">
          <div class="pp-active-title">
            <h4>${escapeHtml(item.namaPaket)}</h4>
            <p>${escapeHtml(item.instansi)} · ${escapeHtml(item.satker)} · ${escapeHtml(item.lpse)}</p>
            <div class="pp-pill-row">
              <span class="pp-badge ${item.sourceType === 'TENDER' ? 'pp-badge--tender' : 'pp-badge--nontender'}">${escapeHtml(item.jenis)}</span>
              <span class="pp-stage-pill ${/(sanggah|warning)/i.test(item.tahapanAktif) ? 'is-warn' : ''}">${escapeHtml(item.tahapanAktif || item.tahapanList)}</span>
              <span class="pp-badge pp-badge--muted">TA ${escapeHtml(item.year)}</span>
            </div>
          </div>
          <div class="pp-active-price">
            <span>Nilai Pagu</span>
            <strong>${formatMoney(item.pagu)}</strong>
          </div>
        </div>

        <div class="pp-active-strip">
          <div><b>Pemenang:</b> ${escapeHtml(item.namaPemenang)}</div>
          <div><b>Mulai:</b> ${escapeHtml(formatDateTime(item.tanggalMulai))}</div>
          <div><b>Sampai:</b> ${escapeHtml(formatDateTime(item.tanggalSampai))}</div>
        </div>

        <div class="pp-active-grid">
          <div class="pp-info-box"><span>Kategori</span><strong>${escapeHtml(item.jenisPengadaan || item.jenis)}</strong></div>
          <div class="pp-info-box"><span>Peserta</span><strong>${escapeHtml(item.peserta)}</strong></div>
          <div class="pp-info-box"><span>Deadline</span><strong>${escapeHtml(formatDateTime(item.tanggalSampai))}</strong></div>
          <div class="pp-info-box"><span>Mulai Tahap</span><strong>${escapeHtml(formatDateTime(item.tanggalMulai))}</strong></div>
        </div>

        <div class="pp-result-footer">
          <div class="pp-result-footer-left">
            ${urls.map((entry) => `<a class="pp-link-btn ${entry.primary ? 'pp-link-btn--primary' : ''}" href="${escapeHtml(entry.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.label)} <span>↗</span></a>`).join('')}
          </div>
          <button type="button" class="pp-toggle-detail" data-pp-action="toggle-active-detail" data-pp-code="${escapeHtml(item.kode)}">${isOpen ? 'Tutup detail' : 'Detail'}</button>
        </div>

        <div class="pp-active-detail">
          <div class="pp-detail-grid">
            <div class="pp-detail-box">
              <h5>Identitas Paket</h5>
              <dl class="pp-key-list">
                <dt>ID Paket</dt><dd>${escapeHtml(item.kode)}</dd>
                <dt>Nama Paket</dt><dd>${escapeHtml(item.namaPaket)}</dd>
                <dt>Jenis Pengadaan</dt><dd>${escapeHtml(item.jenisPengadaan || item.jenis)}</dd>
                <dt>Metode</dt><dd>${escapeHtml(item.metode)}</dd>
                <dt>Satker</dt><dd>${escapeHtml(item.satker)}</dd>
                <dt>Lokasi</dt><dd>${escapeHtml(item.lokasi)}</dd>
                <dt>TA</dt><dd>${escapeHtml(item.year)}</dd>
                <dt>LPSE</dt><dd>${escapeHtml(item.lpse)}</dd>
              </dl>
            </div>
            <div class="pp-detail-box">
              <h5>Tautan SPSE</h5>
              <div class="pp-link-stack">
                ${urls.length ? urls.map((entry) => `<a class="pp-link-btn ${entry.primary ? 'pp-link-btn--primary' : ''}" href="${escapeHtml(entry.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.label)} <span>↗</span></a>`).join('') : '<div class="pp-empty">Tautan detail SPSE tidak tersedia pada paket ini.</div>'}
              </div>
              <div class="pp-footnote" style="margin-top:14px;">Tampilan detail dibuat singkat dan rapih supaya enak dibaca cepat. Kalau butuh verifikasi lebih jauh, tinggal klik tautan SPSE di atas.</div>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function filterProviderResults(state) {
    const keyword = String(state.providerKeyword || '').trim().toLowerCase();
    if (!keyword) {
      state.providerResults = [];
      return;
    }

    let results = state.records.slice();
    if (state.providerYear && state.providerYear !== 'Semua Tahun') {
      results = results.filter((item) => String(item.year) === String(state.providerYear));
    }

    results = results.filter((item) => {
      const name = String(item.namaPemenang || '').toLowerCase();
      return name.includes(keyword) || item.searchBlob.includes(keyword);
    }).sort((a, b) => {
      const scoreA = String(a.namaPemenang || '').toLowerCase().startsWith(keyword) ? 1 : 0;
      const scoreB = String(b.namaPemenang || '').toLowerCase().startsWith(keyword) ? 1 : 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return String(a.namaPaket).localeCompare(String(b.namaPaket), 'id');
    });

    state.providerResults = results.slice(0, 250);
  }

  function sortActive(results, sortKey) {
    const list = results.slice();
    list.sort((a, b) => {
      if (sortKey === 'nilai') return toNumber(b.pagu) - toNumber(a.pagu);
      if (sortKey === 'nama') return String(a.namaPaket).localeCompare(String(b.namaPaket), 'id');
      if (sortKey === 'instansi') return String(a.instansi).localeCompare(String(b.instansi), 'id');
      const dateA = new Date(a.tanggalSampai).getTime() || Number.MAX_SAFE_INTEGER;
      const dateB = new Date(b.tanggalSampai).getTime() || Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    });
    return list;
  }

  function filterActiveResults(state) {
    let results = state.records.filter((item) => item.isActive);
    const keyword = String(state.activeKeyword || '').trim().toLowerCase();
    if (keyword) results = results.filter((item) => item.searchBlob.includes(keyword));
    if (state.activeYear && state.activeYear !== 'Semua Tahun') results = results.filter((item) => String(item.year) === String(state.activeYear));
    if (state.activeJenis && state.activeJenis !== 'SEMUA') results = results.filter((item) => item.sourceType === state.activeJenis);
    if (state.activeTahap && state.activeTahap !== 'SEMUA') results = results.filter((item) => String(item.tahapanAktif || item.tahapanList) === String(state.activeTahap));
    state.activeResults = sortActive(results, state.activeSort).slice(0, 300);
  }

  function renderApp(root, state) {
    root.innerHTML = `
      <div class="pp-shell">
        <div class="pp-topbar">
          <div class="pp-topbar-brand">
            <div class="pp-topbar-logo">PP</div>
            <div>
              <b>Pemenang Pengadaan</b>
              <span>Portal internal pencarian penyedia & paket aktif</span>
            </div>
          </div>
          <div class="pp-topbar-actions">
            <div class="pp-user-chip"><span class="pp-user-dot"></span>${escapeHtml(state.session?.userId || '-')}</div>
            <button type="button" class="pp-btn pp-btn-ghost" data-pp-nav="dashboard">Dashboard</button>
            <button type="button" class="pp-btn pp-btn-danger" data-pp-action="logout">Keluar</button>
          </div>
        </div>

        <div class="pp-tabs">
          <button type="button" class="pp-tab ${state.page === 'dashboard' ? 'is-active' : ''}" data-pp-nav="dashboard">Dashboard</button>
          <button type="button" class="pp-tab ${state.page === 'provider-search' ? 'is-active' : ''}" data-pp-nav="provider-search">Pencarian Paket Penyedia</button>
          <button type="button" class="pp-tab ${state.page === 'active-packages' ? 'is-active' : ''}" data-pp-nav="active-packages">Paket Pengadaan Aktif</button>
        </div>

        ${state.page === 'dashboard' ? renderDashboardSection(state) : ''}
        ${state.page === 'provider-search' ? renderProviderSection(state) : ''}
        ${state.page === 'active-packages' ? renderActiveSection(state) : ''}
      </div>
    `;
  }

  function renderLogin(root, state) {
    root.innerHTML = `
      <div class="pp-login-wrap">
        <div class="pp-login-card">
          <div class="pp-login-reflex"></div>
          <div class="pp-login-copy">
            <div>
              <span class="pp-kicker">Portal Data Pengadaan</span>
              <h2>Pemenang Pengadaan</h2>
              <p>Akses internal untuk pencarian paket penyedia dan pemantauan paket pengadaan aktif. Login diverifikasi langsung ke sheet USERID yang Anda siapkan.</p>
              <div class="pp-login-meta">
                <div class="pp-login-meta-card"><span>Fitur</span><strong>2 Menu</strong><small>Penyedia dan paket aktif disatukan dalam satu portal premium.</small></div>
                <div class="pp-login-meta-card"><span>Sumber</span><strong>2 Sheet</strong><small>SCRAPTENDER dan SCRAPNONTENDER dibaca langsung dari spreadsheet.</small></div>
                <div class="pp-login-meta-card"><span>Gaya</span><strong>Premium</strong><small>UI dibuat lebih mewah, bersih, dan enak dipakai di layar besar.</small></div>
              </div>
            </div>
          </div>

          <div class="pp-login-form-panel">
            <div class="pp-login-head">
              <h3>Masuk ke portal</h3>
              <p>Gunakan user id dan password yang sudah Anda simpan di sheet USERID.</p>
            </div>

            <form class="pp-form" data-pp-form="login" autocomplete="off">
              <label class="pp-field">
                <span>User ID</span>
                <input type="text" name="userid" placeholder="Masukkan user id" required>
              </label>
              <label class="pp-field">
                <span>Password</span>
                <input type="password" name="password" placeholder="Masukkan password" required>
              </label>
              <button type="submit" class="pp-login-submit"><small>✦</small><span>Masuk ke Portal</span></button>
              <div class="pp-login-error">${escapeHtml(state.loginError || '')}</div>
            </form>

            <div class="pp-login-note">
              Kalau login gagal, cek lagi apakah spreadsheet USERID sudah bisa dibaca viewer dan pastikan kolom USERID serta PASSWORD terisi sesuai data yang dipakai saat masuk.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function applyLoginFx(root) {
    const card = root.querySelector('.pp-login-card');
    if (!card) return () => {};

    let rafId = 0;

    const onMove = (event) => {
      const rect = card.getBoundingClientRect();
      const px = ((event.clientX - rect.left) / rect.width) - 0.5;
      const py = ((event.clientY - rect.top) / rect.height) - 0.5;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        card.style.transform = `perspective(1200px) rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 5).toFixed(2)}deg) translateY(-2px)`;
      });
    };

    const reset = () => {
      cancelAnimationFrame(rafId);
      card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0)';
    };

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', reset);

    return () => {
      cancelAnimationFrame(rafId);
      card.removeEventListener('mousemove', onMove);
      card.removeEventListener('mouseleave', reset);
    };
  }

  window.__moduleInit = function ({ container }) {
    const root = container;
    const state = {
      session: getStoredSession(),
      page: 'dashboard',
      loginError: '',
      disclaimerOpen: false,
      datasetLoaded: false,
      records: [],
      years: [],
      activeStageOptions: [],
      providerKeyword: '',
      providerYear: 'Semua Tahun',
      providerHasSearched: false,
      providerResults: [],
      providerOpenMap: {},
      activeKeyword: '',
      activeYear: 'Semua Tahun',
      activeJenis: 'SEMUA',
      activeTahap: 'SEMUA',
      activeSort: 'deadline',
      activeHasSearched: false,
      activeResults: [],
      activeOpenMap: {}
    };

    let destroyed = false;
    let loginFxDestroy = null;

    function paintBoot() {
      root.innerHTML = '<div class="pp-boot"><div class="pp-boot-orb"></div><div><div class="pp-kicker">Pemenang Pengadaan</div><div style="margin-top:10px;font-size:24px;font-weight:950;color:#fff;">Menyiapkan portal...</div></div></div>';
    }

    function rerender() {
      if (destroyed) return;
      if (typeof loginFxDestroy === 'function') {
        loginFxDestroy();
        loginFxDestroy = null;
      }
      if (!state.session) {
        renderLogin(root, state);
        loginFxDestroy = applyLoginFx(root);
      } else {
        renderApp(root, state);
      }
    }

    async function submitLogin(form) {
      const formData = new FormData(form);
      const userId = String(formData.get('userid') || '').trim();
      const password = String(formData.get('password') || '');

      if (!userId || !password) {
        state.loginError = 'User ID dan password wajib diisi.';
        rerender();
        return;
      }

      paintBoot();
      try {
        const rows = await fetchSheetRows(PP_CONFIG.userSheet);
        const matched = rows.find((row) => {
          const rowUserId = getField(row, ['USERID', 'user id', 'user']);
          const rowPassword = getField(row, ['PASSWORD', 'password', 'pass']);
          return rowUserId === userId && rowPassword === password;
        });

        if (!matched) throw new Error('User ID atau password tidak sesuai.');
        state.session = { userId, loginAt: Date.now() };
        persistSession(state.session);
        state.loginError = '';
        state.page = 'dashboard';
      } catch (error) {
        state.loginError = error.message || 'Login gagal.';
      }
      rerender();
    }

    async function openPage(page) {
      state.page = page;
      rerender();
      if ((page === 'provider-search' || page === 'active-packages') && !state.datasetLoaded) {
        try {
          paintBoot();
          await ensureData(state);
          if (page === 'active-packages') {
            filterActiveResults(state);
          }
        } catch (error) {
          root.innerHTML = `<div class="pp-card"><div class="pp-empty">${escapeHtml(error.message || 'Gagal menyiapkan data portal.')}</div></div>`;
          return;
        }
        rerender();
      }
    }

    function handleActionClick(target) {
      const action = target.dataset.ppAction;
      if (!action) return false;

      if (action === 'toggle-disclaimer') {
        state.disclaimerOpen = !state.disclaimerOpen;
        rerender();
        return true;
      }

      if (action === 'logout') {
        clearSession();
        state.session = null;
        state.page = 'dashboard';
        state.providerKeyword = '';
        state.providerYear = 'Semua Tahun';
        state.providerHasSearched = false;
        state.providerResults = [];
        state.providerOpenMap = {};
        state.activeKeyword = '';
        state.activeYear = 'Semua Tahun';
        state.activeJenis = 'SEMUA';
        state.activeTahap = 'SEMUA';
        state.activeHasSearched = false;
        state.activeResults = [];
        state.activeOpenMap = {};
        rerender();
        return true;
      }

      if (action === 'provider-search') {
        const keywordEl = root.querySelector('#ppProviderKeyword');
        const yearEl = root.querySelector('#ppProviderYear');
        state.providerKeyword = keywordEl ? keywordEl.value : state.providerKeyword;
        state.providerYear = yearEl ? yearEl.value : state.providerYear;
        state.providerHasSearched = true;
        filterProviderResults(state);
        rerender();
        return true;
      }

      if (action === 'active-search') {
        const keywordEl = root.querySelector('#ppActiveKeyword');
        const yearEl = root.querySelector('#ppActiveYear');
        state.activeKeyword = keywordEl ? keywordEl.value : state.activeKeyword;
        state.activeYear = yearEl ? yearEl.value : state.activeYear;
        state.activeHasSearched = true;
        filterActiveResults(state);
        rerender();
        return true;
      }

      if (action === 'toggle-provider-detail') {
        const code = target.dataset.ppCode;
        state.providerOpenMap[code] = !state.providerOpenMap[code];
        rerender();
        return true;
      }

      if (action === 'toggle-active-detail') {
        const code = target.dataset.ppCode;
        state.activeOpenMap[code] = !state.activeOpenMap[code];
        rerender();
        return true;
      }

      return false;
    }

    function handleClick(event) {
      const navTarget = event.target.closest('[data-pp-nav]');
      if (navTarget) {
        openPage(navTarget.dataset.ppNav);
        return;
      }

      const actionTarget = event.target.closest('[data-pp-action]');
      if (actionTarget) {
        handleActionClick(actionTarget);
        return;
      }

      const jenisTarget = event.target.closest('[data-pp-filter-jenis]');
      if (jenisTarget) {
        state.activeJenis = jenisTarget.dataset.ppFilterJenis;
        state.activeHasSearched = true;
        filterActiveResults(state);
        rerender();
        return;
      }

      const stageTarget = event.target.closest('[data-pp-filter-stage]');
      if (stageTarget) {
        state.activeTahap = stageTarget.dataset.ppFilterStage;
        state.activeHasSearched = true;
        filterActiveResults(state);
        rerender();
        return;
      }

      const sortTarget = event.target.closest('[data-pp-sort]');
      if (sortTarget) {
        state.activeSort = sortTarget.dataset.ppSort;
        filterActiveResults(state);
        rerender();
      }
    }

    function handleSubmit(event) {
      const form = event.target.closest('[data-pp-form="login"]');
      if (!form) return;
      event.preventDefault();
      submitLogin(form);
    }

    root.addEventListener('click', handleClick);
    root.addEventListener('submit', handleSubmit);

    rerender();

    if (state.session) {
      openPage('dashboard');
    }

    return function destroy() {
      destroyed = true;
      if (typeof loginFxDestroy === 'function') loginFxDestroy();
      root.removeEventListener('click', handleClick);
      root.removeEventListener('submit', handleSubmit);
    };
  };
})();
