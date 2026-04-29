(function () {
  'use strict';

  const SIRUP_SHEET_CONFIG = {
    spreadsheetId: '1tRYoFQ2obJLoQfIBmZQ_qIw72ZCMV9fKIpBA3DlsIxE',
    rawSheetName: 'RAW_SIRUP',
    scoreSheetName: 'SCORE_ITKP_SIRUP'
  };

  const SIRUP_MIN_LOADING_MS = 700;
  const SIRUP_REKAP_PAGE_SIZE = 20;
  const SIRUP_DETAIL_PAGE_SIZE = 10;
  const SIRUP_MAX_ITKP = 10;

  window.__moduleInit = function ({ container }) {
    const root = container.querySelector('.itkp-sirup-page');
    if (!root) return null;

    const state = {
      rawRows: [],
      scoreRows: [],
      filteredRekap: [],
      selectedOpd: '',
      selectedDetailRows: [],
      rekapPage: 1,
      detailPage: 1,
      destroyed: false,
      sortBy: '',
      sortDir: 'desc'
    };

    const EL = {
      root,

      loadingBox: root.querySelector('#loadingBox'),
      loadingText: root.querySelector('#loadingText'),
      errorBox: root.querySelector('#errorBox'),
      globalLoadingOverlay: root.querySelector('#globalLoadingOverlay'),
      globalLoadingText: root.querySelector('#globalLoadingText'),

      filterOpd: root.querySelector('#filterOpd'),
      filterMetode: root.querySelector('#filterMetode'),
      filterSumberDana: root.querySelector('#filterSumberDana'),
      filterWaktu: root.querySelector('#filterWaktu'),
      searchPaket: root.querySelector('#searchPaket'),

      btnResetFilter: root.querySelector('#btnResetFilter'),
      btnRefresh: root.querySelector('#btnRefresh'),
      btnExportRekap: root.querySelector('#btnExportRekap'),
      btnExportDetail: root.querySelector('#btnExportDetail'),
      btnExportCurrentDetail: root.querySelector('#btnExportCurrentDetail'),
      btnClearSelected: root.querySelector('#btnClearSelected'),

      statJumlahOpd: root.querySelector('#statJumlahOpd'),
      statJumlahPaket: root.querySelector('#statJumlahPaket'),
      statTotalRup: root.querySelector('#statTotalRup'),
      statTotalKomitmen: root.querySelector('#statTotalKomitmen'),
      statAvgPersen: root.querySelector('#statAvgPersen'),
      statAvgItkp: root.querySelector('#statAvgItkp'),
      statJumlahOpdNote: root.querySelector('#statJumlahOpdNote'),
      statJumlahPaketNote: root.querySelector('#statJumlahPaketNote'),
      statTotalRupNote: root.querySelector('#statTotalRupNote'),
      statTotalKomitmenNote: root.querySelector('#statTotalKomitmenNote'),

      insightTopOpd: root.querySelector('#insightTopOpd'),
      insightTopNote: root.querySelector('#insightTopNote'),
      insightLowOpd: root.querySelector('#insightLowOpd'),
      insightLowNote: root.querySelector('#insightLowNote'),
      insightMetode: root.querySelector('#insightMetode'),
      insightMetodeNote: root.querySelector('#insightMetodeNote'),

      rekapTableBody: root.querySelector('#rekapTableBody'),
      rekapPagination: root.querySelector('#rekapPagination'),
      rekapPaginationInfo: root.querySelector('#rekapPaginationInfo'),

      detailContent: root.querySelector('#detailContent'),
      detailTitle: root.querySelector('#detailTitle'),
      detailSubtitle: root.querySelector('#detailSubtitle'),
      detailPagination: root.querySelector('#detailPagination'),
      detailPaginationInfo: root.querySelector('#detailPaginationInfo'),

      btnShowTopList: root.querySelector('#btnShowTopList'),
      btnShowLowList: root.querySelector('#btnShowLowList'),

      opdModal: root.querySelector('#opdModal'),
      modalTitle: root.querySelector('#modalTitle'),
      modalSubtitle: root.querySelector('#modalSubtitle'),
      modalCount: root.querySelector('#modalCount'),
      modalList: root.querySelector('#modalList'),
      btnCloseModal: root.querySelector('#btnCloseModal')
    };

    const listeners = [];
    const on = (el, event, handler) => {
      if (!el) return;
      el.addEventListener(event, handler);
      listeners.push(() => el.removeEventListener(event, handler));
    };

    initEvents();
    initMonitoring(true);

    return function destroy() {
      state.destroyed = true;
      listeners.forEach(off => {
        try { off(); } catch (_) {}
      });
      closeModal();
      clearLoading();
    };

    function initEvents() {
      on(EL.filterOpd, 'change', () => {
        state.selectedOpd = EL.filterOpd.value || '';
        state.rekapPage = 1;
        state.detailPage = 1;
        applyFilters();
      });

      on(EL.filterMetode, 'change', () => {
        state.rekapPage = 1;
        state.detailPage = 1;
        applyFilters();
      });

      on(EL.filterSumberDana, 'change', () => {
        state.rekapPage = 1;
        state.detailPage = 1;
        applyFilters();
      });

      on(EL.filterWaktu, 'change', () => {
        state.rekapPage = 1;
        state.detailPage = 1;
        applyFilters();
      });

      on(EL.searchPaket, 'input', () => {
        state.rekapPage = 1;
        state.detailPage = 1;
        applyFilters();
      });

      on(EL.btnResetFilter, 'click', () => {
        if (EL.filterOpd) EL.filterOpd.value = '';
        if (EL.filterMetode) EL.filterMetode.value = '';
        if (EL.filterSumberDana) EL.filterSumberDana.value = '';
        if (EL.filterWaktu) EL.filterWaktu.value = '';
        if (EL.searchPaket) EL.searchPaket.value = '';

        state.selectedOpd = '';
        state.rekapPage = 1;
        state.detailPage = 1;
        state.sortBy = '';
        state.sortDir = 'desc';

        applyFilters();
      });

      on(EL.btnRefresh, 'click', () => initMonitoring(true));
      on(EL.btnExportRekap, 'click', handleExportRekap);
      on(EL.btnExportDetail, 'click', handleExportDetail);
      on(EL.btnExportCurrentDetail, 'click', handleExportCurrentDetail);

      on(EL.btnClearSelected, 'click', () => {
        state.selectedOpd = '';
        state.selectedDetailRows = [];
        state.detailPage = 1;
        if (EL.filterOpd) EL.filterOpd.value = '';
        applyFilters();
      });

      on(EL.btnShowTopList, 'click', () => {
        const items = state.filteredRekap
          .filter(row => Number(row.nilai_itkp || 0) >= SIRUP_MAX_ITKP)
          .map(row => `${row.satuan_kerja} • Nilai ITKP ${formatDecimal(row.nilai_itkp, 0)} • Prosentase ${formatDecimal(row.prosentase, 2)}%`);

        openModal(
          'Daftar OPD Nilai ITKP 10',
          'Daftar OPD yang sudah mencapai nilai ITKP 10 pada filter aktif.',
          items,
          'OPD'
        );
      });

      on(EL.btnShowLowList, 'click', () => {
        const items = state.filteredRekap
          .filter(row => Number(row.nilai_itkp || 0) < SIRUP_MAX_ITKP)
          .map(row => `${row.satuan_kerja} • Nilai ITKP ${formatDecimal(row.nilai_itkp, 0)} • Prosentase ${formatDecimal(row.prosentase, 2)}%`);

        openModal(
          'Daftar OPD Nilai di Bawah 10',
          'Daftar OPD yang nilai ITKP-nya masih di bawah 10 pada filter aktif.',
          items,
          'OPD'
        );
      });

      on(EL.btnCloseModal, 'click', closeModal);

      on(EL.opdModal, 'click', (event) => {
        if (event.target === EL.opdModal) closeModal();
      });

      on(document, 'keydown', (event) => {
        if (event.key === 'Escape') closeModal();
      });
    }

    async function initMonitoring(useOverlay = false) {
      const startedAt = Date.now();

      try {
        showError('');
        setLoading('Menghubungkan ke Google Sheet...', useOverlay);

        const [rawResult, scoreResult] = await Promise.allSettled([
          fetchCsv(buildCsvUrlBySheetName(SIRUP_SHEET_CONFIG.rawSheetName)),
          fetchCsv(buildCsvUrlBySheetName(SIRUP_SHEET_CONFIG.scoreSheetName))
        ]);

        if (state.destroyed) return;

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

        state.rawRows = normalizeRawRows(rawRows);
        state.scoreRows = normalizeScoreRows(scoreRows);

        state.rekapPage = 1;
        state.detailPage = 1;

        buildFilterOptions();
        applyFilters();

        if (errors.length) {
          showError(errors.join(' + ') + '. Sebagian data berhasil dimuat, sebagian gagal.');
        }
      } catch (error) {
        console.error(error);
        showError(`Data SIRUP gagal dimuat. Detail: ${error.message}. Pastikan sheet bisa diakses publik.`);
      } finally {
        const elapsed = Date.now() - startedAt;
        if (elapsed < SIRUP_MIN_LOADING_MS) {
          await wait(SIRUP_MIN_LOADING_MS - elapsed);
        }
        if (!state.destroyed) clearLoading();
      }
    }

    function applyFilters() {
      const opdValue = normalizeText(EL.filterOpd?.value || '');
      const metodeValue = normalizeText(EL.filterMetode?.value || '');
      const sumberDanaValue = normalizeText(EL.filterSumberDana?.value || '');
      const waktuValue = normalizeText(EL.filterWaktu?.value || '');
      const keyword = normalizeText(EL.searchPaket?.value || '');

      const filteredRawGlobal = state.rawRows.filter(row => {
        const rowOpd = normalizeText(row.satuan_kerja);
        const rowMetode = normalizeText(row.metode_pemilihan);
        const rowDana = normalizeText(row.sumber_dana);
        const rowWaktu = normalizeText(row.waktu_pemilihan);

        if (opdValue && rowOpd !== opdValue) return false;
        if (metodeValue && rowMetode !== metodeValue) return false;
        if (sumberDanaValue && rowDana !== sumberDanaValue) return false;
        if (waktuValue && rowWaktu !== waktuValue) return false;

        if (keyword) {
          const hay = normalizeText([
            row.kode_rup,
            row.nama_paket,
            row.program,
            row.kegiatan,
            row.sub_kegiatan,
            row.satuan_kerja
          ].join(' '));
          if (!hay.includes(keyword)) return false;
        }

        return true;
      });

      const allowedOpd = new Set(filteredRawGlobal.map(row => normalizeText(row.satuan_kerja)));

      state.filteredRekap = state.scoreRows.filter(row => {
        const rowOpd = normalizeText(row.satuan_kerja);

        if (opdValue && rowOpd !== opdValue) return false;
        if ((metodeValue || sumberDanaValue || waktuValue || keyword) && !allowedOpd.has(rowOpd)) return false;

        return true;
      });

      if (state.sortBy) {
        sortFilteredRekap();
      }

      if (state.selectedOpd) {
        const stillExists = state.filteredRekap.some(row => row.satuan_kerja === state.selectedOpd);
        if (!stillExists) {
          state.selectedOpd = '';
        }
      }

      state.selectedDetailRows = getDetailRows(filteredRawGlobal);

      renderStats(filteredRawGlobal, state.filteredRekap);
      renderInsights(filteredRawGlobal, state.filteredRekap);
      renderRekapTable();
      renderDetailSection();
    }

    function sortFilteredRekap() {
      const key = state.sortBy;
      const dir = state.sortDir === 'asc' ? 1 : -1;

      state.filteredRekap.sort((a, b) => {
        const av = Number(a[key] || 0);
        const bv = Number(b[key] || 0);

        if (av !== bv) return (av - bv) * dir;
        return String(a.satuan_kerja || '').localeCompare(String(b.satuan_kerja || ''), 'id');
      });
    }

    function buildFilterOptions() {
      fillSelect(EL.filterOpd, state.scoreRows.map(row => row.satuan_kerja), 'Semua Satuan Kerja');
      fillSelect(EL.filterMetode, state.rawRows.map(row => row.metode_pemilihan), 'Semua Metode');
      fillSelect(EL.filterSumberDana, state.rawRows.map(row => row.sumber_dana), 'Semua Sumber Dana');
      fillSelect(EL.filterWaktu, state.rawRows.map(row => row.waktu_pemilihan), 'Semua Waktu');
    }

    function renderStats(filteredRaw, filteredScore) {
      const jumlahOpd = filteredScore.length;
      const jumlahPaket = filteredRaw.length;
      const totalRup = sum(filteredScore.map(x => x.total_rup_diumumkan));
      const totalKomitmen = sum(filteredScore.map(x => x.total_komitmen));
      const avgPersen = filteredScore.length ? sum(filteredScore.map(x => x.prosentase)) / filteredScore.length : 0;
      const avgItkp = filteredScore.length ? sum(filteredScore.map(x => x.nilai_itkp)) / filteredScore.length : 0;

      safeSetText(EL.statJumlahOpd, formatInt(jumlahOpd));
      safeSetText(EL.statJumlahPaket, formatInt(jumlahPaket));
      safeSetText(EL.statTotalRup, formatCurrency(totalRup));
      safeSetText(EL.statTotalKomitmen, formatCurrency(totalKomitmen));
      safeSetText(EL.statAvgPersen, `${formatDecimal(avgPersen, 2)}%`);
      safeSetText(EL.statAvgItkp, formatDecimal(avgItkp, 2));

      safeSetText(EL.statJumlahOpdNote, 'Total satuan kerja pada data rekap.');
      safeSetText(EL.statJumlahPaketNote, 'Total paket pada RAW SIRUP.');
      safeSetText(EL.statTotalRupNote, formatCurrency(totalRup));
      safeSetText(EL.statTotalKomitmenNote, formatCurrency(totalKomitmen));
    }

    function renderInsights(filteredRaw, filteredScore) {
      const topCount = filteredScore.filter(row => Number(row.nilai_itkp || 0) >= SIRUP_MAX_ITKP).length;
      const lowCount = filteredScore.filter(row => Number(row.nilai_itkp || 0) < SIRUP_MAX_ITKP).length;

      safeSetText(EL.insightTopOpd, `${formatInt(topCount)} OPD`);
      safeSetText(EL.insightTopNote, `Sudah mencapai nilai ITKP 10 pada filter aktif.`);

      safeSetText(EL.insightLowOpd, `${formatInt(lowCount)} OPD`);
      safeSetText(EL.insightLowNote, `Masih di bawah nilai ITKP 10 pada filter aktif.`);

      const metodeCounts = {};
      filteredRaw.forEach(row => {
        const metode = row.metode_pemilihan || '-';
        metodeCounts[metode] = (metodeCounts[metode] || 0) + 1;
      });

      const dominant = Object.entries(metodeCounts).sort((a, b) => b[1] - a[1])[0];

      if (dominant) {
        safeSetText(EL.insightMetode, dominant[0]);
        safeSetText(EL.insightMetodeNote, `${formatInt(dominant[1])} paket`);
      } else {
        safeSetText(EL.insightMetode, '-');
        safeSetText(EL.insightMetodeNote, 'Belum ada data.');
      }
    }

    function renderRekapTable() {
      if (!EL.rekapTableBody) return;

      const rows = state.filteredRekap.slice();
      const totalRows = rows.length;
      const totalPages = Math.max(1, Math.ceil(totalRows / SIRUP_REKAP_PAGE_SIZE));
      state.rekapPage = Math.min(state.rekapPage, totalPages);

      const start = (state.rekapPage - 1) * SIRUP_REKAP_PAGE_SIZE;
      const end = start + SIRUP_REKAP_PAGE_SIZE;
      const pageRows = rows.slice(start, end);

      if (!pageRows.length) {
        EL.rekapTableBody.innerHTML = `
          <tr>
            <td colspan="9" class="center-cell">Belum ada data.</td>
          </tr>
        `;
      } else {
        EL.rekapTableBody.innerHTML = pageRows.map((row, index) => `
          <tr>
            <td>${start + index + 1}</td>
            <td class="cell-strong">${escapeHtml(row.satuan_kerja)}</td>
            <td>${formatTableNumber(row.penyedia_diumumkan)}</td>
            <td>${formatTableNumber(row.swakelola_diumumkan)}</td>
            <td>${formatTableNumber(row.total_rup_diumumkan)}</td>
            <td>${formatTableNumber(row.total_komitmen)}</td>
            <td>
              <button type="button" class="badge-button percent-sort-trigger" data-sort-row="persentase" data-opd="${escapeAttr(row.satuan_kerja)}">
                ${renderPercentBadge(row.prosentase)}
              </button>
            </td>
            <td>
              <button type="button" class="badge-button itkp-sort-trigger" data-sort-row="nilai_itkp" data-opd="${escapeAttr(row.satuan_kerja)}">
                ${renderItkpBadge(row.nilai_itkp)}
              </button>
            </td>
            <td>
              <button type="button" class="action-btn" data-opd="${escapeAttr(row.satuan_kerja)}">Lihat Paket</button>
            </td>
          </tr>
        `).join('');

        EL.rekapTableBody.querySelectorAll('.action-btn').forEach(btn => {
          on(btn, 'click', () => {
            state.selectedOpd = btn.getAttribute('data-opd') || '';
            state.detailPage = 1;
            renderDetailSection();
            scrollToDetail();
          });
        });

        EL.rekapTableBody.querySelectorAll('.percent-sort-trigger').forEach(btn => {
          on(btn, 'click', () => {
            toggleSort('prosentase');
          });
        });

        EL.rekapTableBody.querySelectorAll('.itkp-sort-trigger').forEach(btn => {
          on(btn, 'click', () => {
            toggleSort('nilai_itkp');
          });
        });
      }

      renderPagination(
        EL.rekapPagination,
        EL.rekapPaginationInfo,
        totalRows,
        state.rekapPage,
        SIRUP_REKAP_PAGE_SIZE,
        (page) => {
          state.rekapPage = page;
          renderRekapTable();
        }
      );
    }

    function renderDetailSection() {
      const rows = state.selectedDetailRows.slice();

      if (EL.detailTitle) {
        EL.detailTitle.textContent = state.selectedOpd
          ? `Detail Paket SIRUP - ${state.selectedOpd}`
          : 'Detail Paket SIRUP';
      }

      if (EL.detailSubtitle) {
        EL.detailSubtitle.textContent = state.selectedOpd
          ? `${formatInt(rows.length)} paket pada OPD terpilih.`
          : 'Detail paket belum ditampilkan. Klik tombol Lihat Paket pada salah satu OPD.';
      }

      if (!EL.detailContent) return;

      if (!state.selectedOpd) {
        EL.detailContent.innerHTML = `
          <div class="empty-state">
            Detail paket belum ditampilkan. Klik tombol <strong>Lihat Paket</strong> pada salah satu OPD.
          </div>
        `;
        renderPagination(EL.detailPagination, EL.detailPaginationInfo, 0, 1, SIRUP_DETAIL_PAGE_SIZE, function () {});
        return;
      }

      const totalRows = rows.length;
      const totalPages = Math.max(1, Math.ceil(totalRows / SIRUP_DETAIL_PAGE_SIZE));
      state.detailPage = Math.min(state.detailPage, totalPages);

      const start = (state.detailPage - 1) * SIRUP_DETAIL_PAGE_SIZE;
      const end = start + SIRUP_DETAIL_PAGE_SIZE;
      const pageRows = rows.slice(start, end);

      if (!pageRows.length) {
        EL.detailContent.innerHTML = `
          <div class="empty-state">
            Tidak ada detail paket untuk OPD ini pada filter aktif.
          </div>
        `;
      } else {
        EL.detailContent.innerHTML = `
          <div class="detail-content-wrap">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Kode RUP</th>
                  <th>Nama Paket</th>
                  <th>Program</th>
                  <th>Kegiatan</th>
                  <th>Sub Kegiatan</th>
                  <th>Pagu</th>
                  <th>Metode</th>
                  <th>Sumber Dana</th>
                  <th>Waktu</th>
                </tr>
              </thead>
              <tbody>
                ${pageRows.map((row, index) => `
                  <tr>
                    <td>${start + index + 1}</td>
                    <td>${escapeHtml(row.kode_rup)}</td>
                    <td class="cell-strong">${escapeHtml(row.nama_paket)}</td>
                    <td>${escapeHtml(row.program)}</td>
                    <td>${escapeHtml(row.kegiatan)}</td>
                    <td>${escapeHtml(row.sub_kegiatan)}</td>
                    <td>${formatTableNumber(row.pagu_anggaran)}</td>
                    <td>${renderBlueBadge(row.metode_pemilihan)}</td>
                    <td>${escapeHtml(row.sumber_dana)}</td>
                    <td>${escapeHtml(row.waktu_pemilihan)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      renderPagination(
        EL.detailPagination,
        EL.detailPaginationInfo,
        totalRows,
        state.detailPage,
        SIRUP_DETAIL_PAGE_SIZE,
        (page) => {
          state.detailPage = page;
          renderDetailSection();
        }
      );
    }

    function getDetailRows(filteredRawGlobal) {
      if (!state.selectedOpd) return [];

      const opdKey = normalizeText(state.selectedOpd);
      return filteredRawGlobal.filter(row => normalizeText(row.satuan_kerja) === opdKey);
    }

    function toggleSort(key) {
      if (state.sortBy === key) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortBy = key;
        state.sortDir = 'desc';
      }

      state.rekapPage = 1;
      applyFilters();
    }

    function scrollToDetail() {
      const detailPanel = root.querySelector('.detail-panel');
      if (detailPanel) {
        detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function openModal(title, subtitle, items, unitLabel) {
      if (!EL.opdModal) return;

      const safeItems = Array.isArray(items) ? items : [];

      safeSetText(EL.modalTitle, title || 'Daftar Data');
      safeSetText(EL.modalSubtitle, subtitle || '-');
      safeSetText(EL.modalCount, `${formatInt(safeItems.length)} ${unitLabel || 'data'}`);

      if (EL.modalList) {
        EL.modalList.innerHTML = safeItems.length
          ? safeItems.map(item => `<div class="modal-item">${escapeHtml(item)}</div>`).join('')
          : `<div class="modal-item">Belum ada data.</div>`;
      }

      EL.opdModal.hidden = false;
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      if (EL.opdModal) EL.opdModal.hidden = true;
      document.body.style.overflow = '';
    }

    function setLoading(message, useOverlay = false) {
      safeSetText(EL.loadingText, message);
      safeSetText(EL.globalLoadingText, message);

      if (EL.loadingBox) EL.loadingBox.classList.add('show');
      if (useOverlay && EL.globalLoadingOverlay) EL.globalLoadingOverlay.classList.add('show');

      if (EL.btnRefresh) EL.btnRefresh.disabled = true;
      if (EL.btnExportRekap) EL.btnExportRekap.disabled = true;
      if (EL.btnExportDetail) EL.btnExportDetail.disabled = true;
      if (EL.btnExportCurrentDetail) EL.btnExportCurrentDetail.disabled = true;
    }

    function clearLoading() {
      if (EL.loadingBox) EL.loadingBox.classList.remove('show');
      if (EL.globalLoadingOverlay) EL.globalLoadingOverlay.classList.remove('show');

      if (EL.btnRefresh) EL.btnRefresh.disabled = false;
      if (EL.btnExportRekap) EL.btnExportRekap.disabled = false;
      if (EL.btnExportDetail) EL.btnExportDetail.disabled = false;
      if (EL.btnExportCurrentDetail) EL.btnExportCurrentDetail.disabled = false;
    }

    function showError(message) {
      if (!EL.errorBox) return;

      if (message) {
        EL.errorBox.textContent = message;
        EL.errorBox.classList.add('show');
      } else {
        EL.errorBox.textContent = '';
        EL.errorBox.classList.remove('show');
      }
    }

    function handleExportRekap() {
      exportRows(
        state.filteredRekap.map(row => ({
          satuan_kerja: row.satuan_kerja,
          penyedia_diumumkan: row.penyedia_diumumkan,
          swakelola_diumumkan: row.swakelola_diumumkan,
          total_rup_diumumkan: row.total_rup_diumumkan,
          total_komitmen: row.total_komitmen,
          prosentase: row.prosentase,
          nilai_itkp: row.nilai_itkp
        })),
        'rekap-itkp-sirup.xlsx'
      );
    }

    function handleExportDetail() {
      const rows = state.selectedOpd ? state.selectedDetailRows : state.rawRows;
      exportRows(rows, 'detail-paket-sirup.xlsx');
    }

    function handleExportCurrentDetail() {
      if (!state.selectedOpd || !state.selectedDetailRows.length) {
        alert('Pilih salah satu OPD terlebih dahulu.');
        return;
      }

      exportRows(
        state.selectedDetailRows,
        `detail-paket-${slugify(state.selectedOpd)}.xlsx`
      );
    }
  };

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function buildCsvUrlBySheetName(sheetName) {
    return `https://docs.google.com/spreadsheets/d/${SIRUP_SHEET_CONFIG.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  }

  async function fetchCsv(url) {
    const response = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status} saat mengambil ${url}`);

    const text = await response.text();
    if (!text || !text.trim()) throw new Error(`CSV kosong dari ${url}`);
    if (/<!doctype html>|<html/i.test(text)) throw new Error(`Response bukan CSV. Kemungkinan sheet belum public: ${url}`);

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
      .replace(/[()%./-]/g, '')
      .replace(/__+/g, '_');
  }

  function pick(row, keys) {
    for (const key of keys) {
      if (row[key] != null && String(row[key]).trim() !== '') return String(row[key]).trim();
    }
    return '';
  }

  function normalizeRawRows(rows) {
    return rows.map(row => ({
      satuan_kerja: pick(row, ['satuan_kerja', 'nama_satuan_kerja', 'satker']),
      kode_rup: pick(row, ['kode_rup']),
      program: pick(row, ['program']),
      kegiatan: pick(row, ['kegiatan']),
      sub_kegiatan: pick(row, ['sub_kegiatan']),
      nama_paket: pick(row, ['nama_paket']),
      pagu_anggaran: toNumber(pick(row, ['pagu_anggaran', 'pagu', 'total_rup', 'nilai_pagu'])),
      cara_pengadaan: pick(row, ['cara_pengadaan']),
      metode_pemilihan: pick(row, ['metode_pemilihan', 'metode_pengadaan', 'metode']),
      jenis_pengadaan: pick(row, ['jenis_pengadaan']),
      pdn: pick(row, ['produk_dalam_negeri', 'pdn']),
      sumber_dana: pick(row, ['sumber_dana']),
      waktu_pemilihan: pick(row, ['waktu_pemilihan'])
    })).filter(row => row.satuan_kerja && row.nama_paket);
  }

  function normalizeScoreRows(rows) {
    return rows.map(row => ({
      satuan_kerja: pick(row, ['satuan_kerja', 'nama_satuan_kerja', 'satker']),
      penyedia_diumumkan: toNumber(pick(row, ['penyedia_diumumkan', 'penyedia'])),
      swakelola_diumumkan: toNumber(pick(row, ['swakelola_diumumkan', 'swakelola'])),
      total_rup_diumumkan: toNumber(pick(row, ['total_rup_diumumkan', 'total_rup'])),
      total_komitmen: toNumber(pick(row, ['total_komitmen'])),
      prosentase: toNumber(pick(row, ['prosentase', 'persentase'])),
      nilai_itkp: toNumber(pick(row, ['nilai_itkp']))
    })).filter(row => row.satuan_kerja);
  }

  function fillSelect(select, items, placeholder) {
    if (!select) return;

    const currentValue = select.value;
    const uniqueItems = Array.from(new Set(items.filter(Boolean))).sort((a, b) => a.localeCompare(b, 'id'));

    select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>` +
      uniqueItems.map(item => `<option value="${escapeAttr(item)}">${escapeHtml(item)}</option>`).join('');

    if (uniqueItems.includes(currentValue)) {
      select.value = currentValue;
    }
  }

  function renderPagination(container, infoEl, totalRows, currentPage, pageSize, onPageChange) {
    if (!container || !infoEl) return;

    container.innerHTML = '';

    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const start = totalRows === 0 ? 0 : ((currentPage - 1) * pageSize) + 1;
    const end = Math.min(currentPage * pageSize, totalRows);

    infoEl.textContent = `${start}-${end} dari ${totalRows} data • Page ${currentPage} / ${totalPages}`;

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'page-btn';
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
      if (currentPage > 1) onPageChange(currentPage - 1);
    };
    container.appendChild(prevBtn);

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 3) endPage = Math.min(totalPages, 5);
    if (currentPage >= totalPages - 2) startPage = Math.max(1, totalPages - 4);

    for (let i = startPage; i <= endPage; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
      btn.textContent = String(i);
      btn.onclick = () => onPageChange(i);
      container.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'page-btn';
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
      if (currentPage < totalPages) onPageChange(currentPage + 1);
    };
    container.appendChild(nextBtn);
  }

  function renderPercentBadge(value) {
    const cls = Number(value || 0) >= 100
      ? 'badge badge-green'
      : Number(value || 0) > 0
        ? 'badge badge-yellow'
        : 'badge badge-red';

    return `<span class="${cls}">${formatDecimal(value, 2)}%</span>`;
  }

  function renderItkpBadge(value) {
    const cls = Number(value || 0) >= SIRUP_MAX_ITKP
      ? 'badge badge-green'
      : Number(value || 0) > 0
        ? 'badge badge-yellow'
        : 'badge badge-red';

    return `<span class="${cls}">${formatDecimal(value, 0)}</span>`;
  }

  function renderBlueBadge(value) {
    return `<span class="badge badge-blue">${escapeHtml(value || '-')}</span>`;
  }

  function exportRows(rows, filename) {
    if (!Array.isArray(rows) || !rows.length) {
      alert('Tidak ada data yang bisa diexport.');
      return;
    }

    if (window.XLSX) {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
      const colWidths = [];

      for (let col = range.s.c; col <= range.e.c; col++) {
        let maxLength = 10;
        for (let row = range.s.r; row <= range.e.r; row++) {
          const addr = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[addr];
          if (cell && cell.v != null) {
            maxLength = Math.max(maxLength, String(cell.v).length);
          }
        }
        colWidths.push({ wch: Math.min(maxLength + 2, 40) });
      }

      worksheet['!cols'] = colWidths;
      XLSX.writeFile(workbook, String(filename || 'export.xlsx').replace(/\.csv$/i, '.xlsx'));
      return;
    }

    const headers = Object.keys(rows[0]);
    const csv = [headers.join(',')]
      .concat(rows.map(row => headers.map(key => csvEscape(row[key])).join(',')))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = String(filename || 'export.csv').replace(/\.xlsx$/i, '.csv');
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function csvEscape(value) {
    const str = String(value == null ? '' : value);
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  }

  function toNumber(value) {
    let clean = String(value == null ? '' : value)
      .replace(/rp/gi, '')
      .replace(/%/g, '')
      .replace(/\s/g, '')
      .replace(/[^\d.,-]/g, '');

    const hasDot = clean.includes('.');
    const hasComma = clean.includes(',');

    if (hasDot && hasComma) {
      const lastDot = clean.lastIndexOf('.');
      const lastComma = clean.lastIndexOf(',');
      if (lastComma > lastDot) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        clean = clean.replace(/,/g, '');
      }
    } else if (hasComma) {
      const parts = clean.split(',');
      if (parts.length > 2) {
        clean = parts.join('');
      } else {
        const tail = parts[1] || '';
        if (tail.length === 3) {
          clean = parts.join('');
        } else {
          clean = parts[0] + '.' + tail;
        }
      }
    } else if (hasDot) {
      const parts = clean.split('.');
      if (parts.length > 2) {
        clean = parts.join('');
      } else {
        const tail = parts[1] || '';
        if (tail.length === 3) {
          clean = parts.join('');
        }
      }
    }

    const num = parseFloat(clean);
    return Number.isFinite(num) ? num : 0;
  }

  function sum(values) {
    return values.reduce((acc, value) => acc + Number(value || 0), 0);
  }

  function formatInt(value) {
    return Number(value || 0).toLocaleString('id-ID');
  }

  function formatTableNumber(value) {
    return Number(value || 0).toLocaleString('id-ID');
  }

  function formatCurrency(value) {
    return `Rp${Number(value || 0).toLocaleString('id-ID')}`;
  }

  function formatDecimal(value, digits = 2) {
    return Number(value || 0).toLocaleString('id-ID', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function normalizeText(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  function slugify(text) {
    return String(text || 'data')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'data';
  }

  function safeSetText(el, value) {
    if (el) el.textContent = value || '';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();