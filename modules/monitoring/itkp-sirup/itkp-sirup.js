const SHEET_CONFIG = {
  spreadsheetId: '1tRYoFQ2obJLoQfIBmZQ_qIw72ZCMV9fKIpBA3DlsIxE',
  rawGid: '0',
  scoreGid: '468989223'
};

const MIN_LOADING_MS = 700;
const PAGE_SIZE = 50;

const APP_STATE = {
  rawSirup: [],
  scoreSirup: [],
  filteredScore: [],
  filteredRawGlobal: [],
  selectedOpd: '',
  selectedRawRows: [],
  rekapPage: 1,
  detailPage: 1
};

const EL = {
  loadingBox: document.getElementById('loadingBox'),
  loadingText: document.getElementById('loadingText'),
  errorBox: document.getElementById('errorBox'),
  globalLoadingOverlay: document.getElementById('globalLoadingOverlay'),
  globalLoadingText: document.getElementById('globalLoadingText'),
  filterOpd: document.getElementById('filterOpd'),
  filterMetode: document.getElementById('filterMetode'),
  filterSumberDana: document.getElementById('filterSumberDana'),
  filterWaktu: document.getElementById('filterWaktu'),
  searchPaket: document.getElementById('searchPaket'),
  rekapTableBody: document.getElementById('rekapTableBody'),
  detailContent: document.getElementById('detailContent'),
  detailTitle: document.getElementById('detailTitle'),
  detailSubtitle: document.getElementById('detailSubtitle'),
  btnResetFilter: document.getElementById('btnResetFilter'),
  btnExportRekap: document.getElementById('btnExportRekap'),
  btnExportDetail: document.getElementById('btnExportDetail'),
  btnExportCurrentDetail: document.getElementById('btnExportCurrentDetail'),
  btnRefresh: document.getElementById('btnRefresh'),
  btnClearSelected: document.getElementById('btnClearSelected'),
  statJumlahOpd: document.getElementById('statJumlahOpd'),
  statJumlahPaket: document.getElementById('statJumlahPaket'),
  statTotalRup: document.getElementById('statTotalRup'),
  statTotalKomitmen: document.getElementById('statTotalKomitmen'),
  statAvgPersen: document.getElementById('statAvgPersen'),
  statAvgItkp: document.getElementById('statAvgItkp'),
  statJumlahOpdNote: document.getElementById('statJumlahOpdNote'),
  statJumlahPaketNote: document.getElementById('statJumlahPaketNote'),
  statTotalRupNote: document.getElementById('statTotalRupNote'),
  statTotalKomitmenNote: document.getElementById('statTotalKomitmenNote'),
  insightTopOpd: document.getElementById('insightTopOpd'),
  insightTopNote: document.getElementById('insightTopNote'),
  insightLowOpd: document.getElementById('insightLowOpd'),
  insightLowNote: document.getElementById('insightLowNote'),
  insightMetode: document.getElementById('insightMetode'),
  insightMetodeNote: document.getElementById('insightMetodeNote'),
  rekapPagination: document.getElementById('rekapPagination'),
  rekapPaginationInfo: document.getElementById('rekapPaginationInfo'),
  detailPagination: document.getElementById('detailPagination'),
  detailPaginationInfo: document.getElementById('detailPaginationInfo')
};

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function nextPaint() {
  return new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function buildCsvUrl(gid) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_CONFIG.spreadsheetId}/export?format=csv&gid=${gid}`;
}

function setLoading(message, useOverlay = false) {
  if (EL.loadingText) EL.loadingText.textContent = message;
  if (EL.globalLoadingText) EL.globalLoadingText.textContent = message;
  if (EL.loadingBox) EL.loadingBox.classList.add('show');
  if (useOverlay && EL.globalLoadingOverlay) EL.globalLoadingOverlay.classList.add('show');

  ['btnRefresh', 'btnExportRekap', 'btnExportDetail', 'btnExportCurrentDetail'].forEach(key => {
    if (EL[key]) EL[key].disabled = true;
  });
}

function clearLoading() {
  if (EL.loadingBox) EL.loadingBox.classList.remove('show');
  if (EL.globalLoadingOverlay) EL.globalLoadingOverlay.classList.remove('show');

  ['btnRefresh', 'btnExportRekap', 'btnExportDetail', 'btnExportCurrentDetail'].forEach(key => {
    if (EL[key]) EL[key].disabled = false;
  });
}

async function initMonitoringSirup() {
  const startedAt = Date.now();

  try {
    showError('');
    setLoading('Menghubungkan ke Google Sheet...', true);
    await nextPaint();

    const [rawResult, scoreResult] = await Promise.allSettled([
      fetchCsv(buildCsvUrl(SHEET_CONFIG.rawGid)),
      fetchCsv(buildCsvUrl(SHEET_CONFIG.scoreGid))
    ]);

    let rawRows = [];
    let scoreRows = [];
    const errors = [];

    if (rawResult.status === 'fulfilled') {
      rawRows = csvToObjects(rawResult.value);
    } else {
      errors.push('RAW_SIRUP gagal dimuat');
      console.error(rawResult.reason);
    }

    if (scoreResult.status === 'fulfilled') {
      scoreRows = csvToObjects(scoreResult.value);
    } else {
      errors.push('SCORE_ITKP_SIRUP gagal dimuat');
      console.error(scoreResult.reason);
    }

    APP_STATE.rawSirup = normalizeRawSirup(rawRows);
    APP_STATE.scoreSirup = normalizeScoreSirup(scoreRows);
    APP_STATE.selectedOpd = '';
    APP_STATE.selectedRawRows = [];
    APP_STATE.rekapPage = 1;
    APP_STATE.detailPage = 1;

    buildFilterOptions();
    applyFilters();

    if (errors.length) {
      showError(errors.join(' + ') + '. Sebagian data berhasil dimuat, sebagian gagal.');
    }
  } catch (error) {
    console.error(error);
    showError(`Data gagal dimuat. Detail: ${error.message}. Pastikan sheet bisa diakses browser portal ini.`);
  } finally {
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_LOADING_MS) await wait(MIN_LOADING_MS - elapsed);
    clearLoading();
  }
}

async function fetchCsv(url) {
  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store'
  });

  if (!response.ok) throw new Error(`HTTP ${response.status} saat mengambil ${url}`);

  const text = await response.text();
  if (!text || !text.trim()) throw new Error(`CSV kosong dari ${url}`);
  if (/<!doctype html>|<html/i.test(text)) throw new Error(`Response bukan CSV, kemungkinan akses sheet masih tertutup: ${url}`);

  return text;
}

function csvToObjects(csvText) {
  const rows = parseCsv(csvText);
  if (!rows.length) return [];

  const headers = rows[0].map(h => normalizeHeader(h));
  return rows.slice(1)
    .filter(row => row.some(cell => String(cell || '').trim() !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] != null ? String(row[index]).trim() : '';
      });
      return obj;
    });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[()/%.-]/g, '')
    .replace(/__+/g, '_');
}

function normalizeRawSirup(rows) {
  return rows.map(row => ({
    satuan_kerja: pick(row, ['satuan_kerja']),
    kode_rup: pick(row, ['kode_rup']),
    program: pick(row, ['program']),
    kegiatan: pick(row, ['kegiatan']),
    sub_kegiatan: pick(row, ['sub_kegiatan']),
    nama_paket: pick(row, ['nama_paket']),
    pagu_anggaran: toNumber(pick(row, ['pagu_anggaran'])),
    cara_pengadaan: pick(row, ['cara_pengadaan']),
    metode_pemilihan: pick(row, ['metode_pemilihan']),
    jenis_pengadaan: pick(row, ['jenis_pengadaan']),
    pdn: pick(row, ['produk_dalam_negeri']),
    sumber_dana: pick(row, ['sumber_dana']),
    waktu_pemilihan: pick(row, ['waktu_pemilihan'])
  })).filter(row => row.satuan_kerja && row.nama_paket);
}

function normalizeScoreSirup(rows) {
  return rows.map(row => ({
    satuan_kerja: pick(row, ['satuan_kerja']),
    penyedia_diumumkan: toNumber(pick(row, ['penyedia_diumumkan'])),
    swakelola_diumumkan: toNumber(pick(row, ['swakelola_diumumkan'])),
    total_rup_diumumkan: toNumber(pick(row, ['total_rup_diumumkan'])),
    total_komitmen: toNumber(pick(row, ['total_komitmen'])),
    prosentase: toNumber(pick(row, ['prosentase'])),
    nilai_itkp: toNumber(pick(row, ['nilai_itkp']))
  })).filter(row => row.satuan_kerja);
}

function pick(obj, keys) {
  for (const key of keys) {
    if (obj[key] != null && String(obj[key]).trim() !== '') {
      return String(obj[key]).trim();
    }
  }
  return '';
}

function showError(message) {
  if (!EL.errorBox) return;
  EL.errorBox.textContent = message || '';
  EL.errorBox.classList.toggle('show', !!message);
}

function buildFilterOptions() {
  populateSelect(EL.filterOpd, uniqueSorted(APP_STATE.scoreSirup.map(x => x.satuan_kerja)), 'Semua Satuan Kerja');
  populateSelect(EL.filterMetode, uniqueSorted(APP_STATE.rawSirup.map(x => x.metode_pemilihan)), 'Semua Metode');
  populateSelect(EL.filterSumberDana, uniqueSorted(APP_STATE.rawSirup.map(x => x.sumber_dana)), 'Semua Sumber Dana');
  populateSelect(EL.filterWaktu, uniqueSorted(APP_STATE.rawSirup.map(x => x.waktu_pemilihan)), 'Semua Waktu');
}

function populateSelect(selectEl, items, placeholder) {
  if (!selectEl) return;

  const currentValue = selectEl.value;
  selectEl.innerHTML = `<option value="">${placeholder}</option>`;

  items.forEach(item => {
    const option = document.createElement('option');
    option.value = item;
    option.textContent = item;
    selectEl.appendChild(option);
  });

  if (items.includes(currentValue)) selectEl.value = currentValue;
}

function applyFilters() {
  const selectedOpdFilter = EL.filterOpd?.value.trim() || '';
  const selectedMetode = EL.filterMetode?.value.trim().toLowerCase() || '';
  const selectedSumberDana = EL.filterSumberDana?.value.trim().toLowerCase() || '';
  const selectedWaktu = EL.filterWaktu?.value.trim().toLowerCase() || '';
  const keyword = EL.searchPaket?.value.trim().toLowerCase() || '';

  APP_STATE.filteredRawGlobal = APP_STATE.rawSirup.filter(row => {
    const matchOpd = !selectedOpdFilter || row.satuan_kerja === selectedOpdFilter;
    const matchMetode = !selectedMetode || row.metode_pemilihan.toLowerCase() === selectedMetode;
    const matchDana = !selectedSumberDana || row.sumber_dana.toLowerCase() === selectedSumberDana;
    const matchWaktu = !selectedWaktu || row.waktu_pemilihan.toLowerCase() === selectedWaktu;
    const searchTarget = [row.nama_paket, row.program, row.kegiatan, row.sub_kegiatan, row.kode_rup].join(' ').toLowerCase();
    const matchKeyword = !keyword || searchTarget.includes(keyword);
    return matchOpd && matchMetode && matchDana && matchWaktu && matchKeyword;
  });

  APP_STATE.filteredScore = APP_STATE.scoreSirup.filter(row => {
    if (selectedOpdFilter && row.satuan_kerja !== selectedOpdFilter) return false;
    return true;
  });

  APP_STATE.rekapPage = 1;
  APP_STATE.detailPage = 1;

  renderStats(APP_STATE.filteredRawGlobal, APP_STATE.filteredScore);
  renderInsights(APP_STATE.filteredRawGlobal, APP_STATE.filteredScore);
  renderRekapTable(APP_STATE.filteredScore);

  if (APP_STATE.selectedOpd) renderDetailForOpd(APP_STATE.selectedOpd);
  else renderEmptyDetail();
}

function renderStats(filteredRaw, filteredScore) {
  const jumlahOpd = filteredScore.length;
  const jumlahPaket = filteredRaw.length;
  const totalRup = sum(filteredScore.map(x => x.total_rup_diumumkan));
  const totalKomitmen = sum(filteredScore.map(x => x.total_komitmen));
  const avgPersen = filteredScore.length ? sum(filteredScore.map(x => x.prosentase)) / filteredScore.length : 0;
  const avgItkp = filteredScore.length ? sum(filteredScore.map(x => x.nilai_itkp)) / filteredScore.length : 0;

  if (EL.statJumlahOpd) EL.statJumlahOpd.textContent = formatNumber(jumlahOpd);
  if (EL.statJumlahPaket) EL.statJumlahPaket.textContent = formatNumber(jumlahPaket);
  if (EL.statTotalRup) EL.statTotalRup.textContent = formatShortCurrency(totalRup);
  if (EL.statTotalKomitmen) EL.statTotalKomitmen.textContent = formatShortCurrency(totalKomitmen);
  if (EL.statAvgPersen) EL.statAvgPersen.textContent = `${formatPercent(avgPersen)}%`;
  if (EL.statAvgItkp) EL.statAvgItkp.textContent = formatDecimal(avgItkp);

  if (EL.statJumlahOpdNote) EL.statJumlahOpdNote.textContent = 'Total satuan kerja pada data rekap';
  if (EL.statJumlahPaketNote) EL.statJumlahPaketNote.textContent = 'Total paket pada RAW SIRUP';
  if (EL.statTotalRupNote) EL.statTotalRupNote.textContent = formatCurrency(totalRup);
  if (EL.statTotalKomitmenNote) EL.statTotalKomitmenNote.textContent = formatCurrency(totalKomitmen);
}

function renderInsights(filteredRaw, filteredScore) {
  if (!EL.insightTopOpd || !EL.insightTopNote || !EL.insightLowOpd || !EL.insightLowNote || !EL.insightMetode || !EL.insightMetodeNote) return;

  if (!filteredScore.length) {
    EL.insightTopOpd.textContent = '-';
    EL.insightTopNote.textContent = 'Belum ada data';
    EL.insightLowOpd.textContent = '-';
    EL.insightLowNote.textContent = 'Belum ada data';
    EL.insightMetode.textContent = '-';
    EL.insightMetodeNote.textContent = 'Belum ada data';
    return;
  }

  const metodeCounts = {};
  filteredRaw.forEach(row => {
    metodeCounts[row.metode_pemilihan] = (metodeCounts[row.metode_pemilihan] || 0) + 1;
  });

  const dominantEntry = Object.entries(metodeCounts).sort((a, b) => b[1] - a[1])[0];
  if (dominantEntry) {
    EL.insightMetode.textContent = dominantEntry[0];
    EL.insightMetodeNote.textContent = `${formatNumber(dominantEntry[1])} paket`;
  } else {
    EL.insightMetode.textContent = '-';
    EL.insightMetodeNote.textContent = 'Belum ada data';
  }

  const uniqueItkp = [...new Set(filteredScore.map(x => Number(x.nilai_itkp || 0)))];
  const uniquePersen = [...new Set(filteredScore.map(x => Number(x.prosentase || 0)))];

  if (uniqueItkp.length === 1 && uniquePersen.length === 1) {
    EL.insightTopOpd.textContent = 'Semua OPD Setara';
    EL.insightTopNote.textContent = `Nilai ITKP ${formatDecimal(uniqueItkp[0])} | ${formatPercent(uniquePersen[0])}%`;
    EL.insightLowOpd.textContent = 'Semua OPD Setara';
    EL.insightLowNote.textContent = `Nilai ITKP ${formatDecimal(uniqueItkp[0])} | ${formatPercent(uniquePersen[0])}%`;
    return;
  }

  const sortedByItkp = [...filteredScore].sort((a, b) => {
    if (b.nilai_itkp !== a.nilai_itkp) return b.nilai_itkp - a.nilai_itkp;
    return b.prosentase - a.prosentase;
  });

  const top = sortedByItkp[0];
  const low = sortedByItkp[sortedByItkp.length - 1];

  EL.insightTopOpd.textContent = top.satuan_kerja;
  EL.insightTopNote.textContent = `Nilai ITKP ${formatDecimal(top.nilai_itkp)} | ${formatPercent(top.prosentase)}%`;
  EL.insightLowOpd.textContent = low.satuan_kerja;
  EL.insightLowNote.textContent = `Nilai ITKP ${formatDecimal(low.nilai_itkp)} | ${formatPercent(low.prosentase)}%`;
}

function paginateRows(rows, currentPage, pageSize) {
  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  return {
    rows: rows.slice(startIndex, startIndex + pageSize),
    totalRows,
    totalPages,
    page: safePage,
    startIndex
  };
}

function createPageButton(label, disabled, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'page-btn';
  btn.textContent = label;
  btn.disabled = disabled;
  btn.addEventListener('click', onClick);
  return btn;
}

function renderPagination(container, infoEl, totalRows, currentPage, type) {
  if (!container || !infoEl) return;

  container.innerHTML = '';
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const start = totalRows === 0 ? 0 : ((safePage - 1) * PAGE_SIZE) + 1;
  const end = Math.min(safePage * PAGE_SIZE, totalRows);

  infoEl.textContent = `${start}-${end} dari ${totalRows} data • Page ${safePage} / ${totalPages}`;

  container.appendChild(createPageButton('Prev', safePage === 1, () => {
    if (type === 'rekap') APP_STATE.rekapPage -= 1;
    else APP_STATE.detailPage -= 1;
    rerenderByPage(type);
  }));

  let startPage = Math.max(1, safePage - 2);
  let endPage = Math.min(totalPages, safePage + 2);
  if (safePage <= 3) endPage = Math.min(totalPages, 5);
  if (safePage >= totalPages - 2) startPage = Math.max(1, totalPages - 4);

  for (let i = startPage; i <= endPage; i++) {
    const btn = createPageButton(String(i), false, () => {
      if (type === 'rekap') APP_STATE.rekapPage = i;
      else APP_STATE.detailPage = i;
      rerenderByPage(type);
    });
    if (i === safePage) btn.classList.add('active');
    container.appendChild(btn);
  }

  container.appendChild(createPageButton('Next', safePage === totalPages, () => {
    if (type === 'rekap') APP_STATE.rekapPage += 1;
    else APP_STATE.detailPage += 1;
    rerenderByPage(type);
  }));
}

function rerenderByPage(type) {
  if (type === 'rekap') {
    renderRekapTable(APP_STATE.filteredScore);
  } else if (type === 'detail') {
    if (APP_STATE.selectedOpd) renderDetailForOpd(APP_STATE.selectedOpd);
    else renderEmptyDetail();
  }
}

function renderRekapTable(rows) {
  if (!EL.rekapTableBody) return;

  if (!rows.length) {
    EL.rekapTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="cell-muted center-cell">
          Tidak ada data rekap yang sesuai filter.
        </td>
      </tr>
    `;
    renderPagination(EL.rekapPagination, EL.rekapPaginationInfo, 0, APP_STATE.rekapPage, 'rekap');
    return;
  }

  const paged = paginateRows(rows, APP_STATE.rekapPage, PAGE_SIZE);

  EL.rekapTableBody.innerHTML = paged.rows.map((row, index) => `
    <tr>
      <td>${paged.startIndex + index + 1}</td>
      <td class="cell-strong">${escapeHtml(row.satuan_kerja)}</td>
      <td>${formatCurrency(row.penyedia_diumumkan)}</td>
      <td>${formatCurrency(row.swakelola_diumumkan)}</td>
      <td>${formatCurrency(row.total_rup_diumumkan)}</td>
      <td>${formatCurrency(row.total_komitmen)}</td>
      <td>${renderPercentBadge(row.prosentase)}</td>
      <td>${renderItkpBadge(row.nilai_itkp)}</td>
      <td>
        <button type="button" class="action-btn" data-opd="${escapeHtml(row.satuan_kerja)}">
          Lihat Paket
        </button>
      </td>
    </tr>
  `).join('');

  EL.rekapTableBody.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      APP_STATE.selectedOpd = btn.getAttribute('data-opd') || '';
      APP_STATE.detailPage = 1;
      renderDetailForOpd(APP_STATE.selectedOpd);
    });
  });

  renderPagination(EL.rekapPagination, EL.rekapPaginationInfo, rows.length, APP_STATE.rekapPage, 'rekap');
}

function renderDetailForOpd(opdName) {
  const rows = APP_STATE.filteredRawGlobal.filter(row => row.satuan_kerja === opdName);
  APP_STATE.selectedRawRows = rows;

  if (EL.detailTitle) EL.detailTitle.textContent = `Detail Paket SIRUP - ${opdName}`;
  if (EL.detailSubtitle) EL.detailSubtitle.textContent = `${formatNumber(rows.length)} paket ditampilkan sesuai filter aktif.`;

  if (!EL.detailContent) return;

  if (!rows.length) {
    EL.detailContent.innerHTML = `
      <div class="empty-state">
        Tidak ada detail paket untuk OPD ini sesuai filter yang dipilih.
      </div>
    `;
    renderPagination(EL.detailPagination, EL.detailPaginationInfo, 0, APP_STATE.detailPage, 'detail');
    return;
  }

  const paged = paginateRows(rows, APP_STATE.detailPage, PAGE_SIZE);

  EL.detailContent.innerHTML = `
    <div class="top-scroll-wrap" id="topScrollWrap">
      <div class="top-scroll-inner" id="topScrollInner"></div>
    </div>

    <div class="detail-content-wrap" id="detailTableWrap">
      <table id="detailTable">
        <thead>
          <tr>
            <th>No</th>
            <th>Kode RUP</th>
            <th>Nama Paket</th>
            <th>Program</th>
            <th>Kegiatan</th>
            <th>Sub Kegiatan</th>
            <th>Pagu</th>
            <th>Cara Pengadaan</th>
            <th>Metode</th>
            <th>Jenis</th>
            <th>PDN</th>
            <th>Sumber Dana</th>
            <th>Waktu</th>
          </tr>
        </thead>
        <tbody>
          ${paged.rows.map((row, index) => `
            <tr>
              <td>${paged.startIndex + index + 1}</td>
              <td>${escapeHtml(row.kode_rup)}</td>
              <td class="cell-strong">${escapeHtml(row.nama_paket)}</td>
              <td class="cell-muted">${escapeHtml(row.program)}</td>
              <td class="cell-muted">${escapeHtml(row.kegiatan)}</td>
              <td class="cell-muted">${escapeHtml(row.sub_kegiatan)}</td>
              <td>${formatCurrency(row.pagu_anggaran)}</td>
              <td>${escapeHtml(row.cara_pengadaan)}</td>
              <td>${renderBlueBadge(row.metode_pemilihan)}</td>
              <td>${escapeHtml(row.jenis_pengadaan)}</td>
              <td>${renderPdnBadge(row.pdn)}</td>
              <td>${escapeHtml(row.sumber_dana)}</td>
              <td>${escapeHtml(row.waktu_pemilihan)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  setupDetailHorizontalSync();
  renderPagination(EL.detailPagination, EL.detailPaginationInfo, rows.length, APP_STATE.detailPage, 'detail');

  const detailSection = document.querySelector('.detail-panel');
  if (detailSection) {
    detailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function setupDetailHorizontalSync() {
  const topScrollWrap = document.getElementById('topScrollWrap');
  const topScrollInner = document.getElementById('topScrollInner');
  const detailTableWrap = document.getElementById('detailTableWrap');
  const detailTable = document.getElementById('detailTable');
  if (!topScrollWrap || !topScrollInner || !detailTableWrap || !detailTable) return;

  const syncWidths = () => {
    topScrollInner.style.width = `${detailTable.scrollWidth}px`;
    topScrollWrap.scrollLeft = detailTableWrap.scrollLeft;
  };
  syncWidths();

  let syncingFromTop = false;
  let syncingFromBottom = false;

  topScrollWrap.addEventListener('scroll', () => {
    if (syncingFromBottom) return;
    syncingFromTop = true;
    detailTableWrap.scrollLeft = topScrollWrap.scrollLeft;
    syncingFromTop = false;
  });

  detailTableWrap.addEventListener('scroll', () => {
    if (syncingFromTop) return;
    syncingFromBottom = true;
    topScrollWrap.scrollLeft = detailTableWrap.scrollLeft;
    syncingFromBottom = false;
  });

  window.requestAnimationFrame(syncWidths);
}

function renderEmptyDetail() {
  APP_STATE.selectedRawRows = [];
  if (EL.detailTitle) EL.detailTitle.textContent = 'Detail Paket SIRUP';
  if (EL.detailSubtitle) EL.detailSubtitle.textContent = 'Pilih salah satu OPD pada tabel rekap untuk melihat detail paket.';
  if (EL.detailContent) {
    EL.detailContent.innerHTML = `
      <div class="empty-state">
        Detail paket belum ditampilkan.<br>
        Klik tombol <strong>Lihat Paket</strong> pada salah satu OPD.
      </div>
    `;
  }
  renderPagination(EL.detailPagination, EL.detailPaginationInfo, 0, APP_STATE.detailPage, 'detail');
}

function renderPercentBadge(value) {
  const cls = value >= 100 ? 'badge badge-green' : value >= 80 ? 'badge badge-yellow' : 'badge badge-red';
  return `<span class="${cls}">${formatPercent(value)}%</span>`;
}

function renderItkpBadge(value) {
  const cls = value >= 10 ? 'badge badge-green' : value >= 5 ? 'badge badge-yellow' : 'badge badge-red';
  return `<span class="${cls}">${formatDecimal(value)}</span>`;
}

function renderBlueBadge(value) {
  return `<span class="badge badge-blue">${escapeHtml(value)}</span>`;
}

function renderPdnBadge(value) {
  const yes = String(value).trim().toLowerCase() === 'ya';
  return yes ? '<span class="badge badge-green">Ya</span>' : '<span class="badge badge-red">Tidak</span>';
}

function exportCsv(filename, rows) {
  if (!rows || !rows.length) {
    alert('Tidak ada data untuk diexport.');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(row => headers.map(key => {
      const value = row[key] ?? '';
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function handleExportRekap() {
  exportCsv('rekap_itkp_sirup.csv', APP_STATE.filteredScore.map(row => ({
    satuan_kerja: row.satuan_kerja,
    penyedia_diumumkan: row.penyedia_diumumkan,
    swakelola_diumumkan: row.swakelola_diumumkan,
    total_rup_diumumkan: row.total_rup_diumumkan,
    total_komitmen: row.total_komitmen,
    prosentase: row.prosentase,
    nilai_itkp: row.nilai_itkp
  })));
}

function handleExportDetail() {
  const rows = APP_STATE.selectedOpd ? APP_STATE.selectedRawRows : APP_STATE.filteredRawGlobal;
  exportCsv('detail_paket_sirup.csv', rows);
}

function handleExportCurrentDetail() {
  if (!APP_STATE.selectedOpd || !APP_STATE.selectedRawRows.length) {
    alert('Pilih salah satu OPD terlebih dahulu.');
    return;
  }

  const safeName = APP_STATE.selectedOpd.toLowerCase().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
  exportCsv(`detail_paket_${safeName}.csv`, APP_STATE.selectedRawRows);
}

function resetFilters() {
  if (EL.filterOpd) EL.filterOpd.value = '';
  if (EL.filterMetode) EL.filterMetode.value = '';
  if (EL.filterSumberDana) EL.filterSumberDana.value = '';
  if (EL.filterWaktu) EL.filterWaktu.value = '';
  if (EL.searchPaket) EL.searchPaket.value = '';
  APP_STATE.selectedOpd = '';
  APP_STATE.rekapPage = 1;
  APP_STATE.detailPage = 1;
  applyFilters();
}

function toNumber(value) {
  if (value == null || value === '') return 0;

  let str = String(value).trim();
  if (!str) return 0;

  str = str.replace(/[^\d.,-]/g, '').replace(/\s/g, '');

  const hasDot = str.includes('.');
  const hasComma = str.includes(',');

  if (hasDot && hasComma) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (hasComma) {
    const parts = str.split(',');
    if (parts.length > 2) {
      str = parts.join('');
    } else {
      const tail = parts[1] || '';
      if (tail.length === 3) str = parts.join('');
      else str = parts[0] + '.' + tail;
    }
  } else if (hasDot) {
    const parts = str.split('.');
    if (parts.length > 2) {
      str = parts.join('');
    } else {
      const tail = parts[1] || '';
      if (tail.length === 3) str = parts.join('');
    }
  }

  const parsed = Number(str);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sum(arr) {
  return arr.reduce((acc, val) => acc + Number(val || 0), 0);
}

function uniqueSorted(arr) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'id'));
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('id-ID');
}

function formatCurrency(value) {
  return 'Rp' + Number(value || 0).toLocaleString('id-ID');
}

function formatShortCurrency(value) {
  const num = Number(value || 0);
  if (num >= 1_000_000_000_000) return 'Rp' + (num / 1_000_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' T';
  if (num >= 1_000_000_000) return 'Rp' + (num / 1_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' M';
  if (num >= 1_000_000) return 'Rp' + (num / 1_000_000).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' Jt';
  return 'Rp' + num.toLocaleString('id-ID');
}

function formatPercent(value) {
  return Number(value || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDecimal(value) {
  return Number(value || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

if (EL.filterOpd) EL.filterOpd.addEventListener('change', applyFilters);
if (EL.filterMetode) EL.filterMetode.addEventListener('change', applyFilters);
if (EL.filterSumberDana) EL.filterSumberDana.addEventListener('change', applyFilters);
if (EL.filterWaktu) EL.filterWaktu.addEventListener('change', applyFilters);
if (EL.searchPaket) EL.searchPaket.addEventListener('input', applyFilters);
if (EL.btnResetFilter) EL.btnResetFilter.addEventListener('click', resetFilters);
if (EL.btnExportRekap) EL.btnExportRekap.addEventListener('click', handleExportRekap);
if (EL.btnExportDetail) EL.btnExportDetail.addEventListener('click', handleExportDetail);
if (EL.btnExportCurrentDetail) EL.btnExportCurrentDetail.addEventListener('click', handleExportCurrentDetail);
if (EL.btnClearSelected) {
  EL.btnClearSelected.addEventListener('click', () => {
    APP_STATE.selectedOpd = '';
    APP_STATE.detailPage = 1;
    renderEmptyDetail();
  });
}
if (EL.btnRefresh) EL.btnRefresh.addEventListener('click', initMonitoringSirup);

initMonitoringSirup();
