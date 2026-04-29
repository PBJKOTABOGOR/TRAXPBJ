(function () {
  const SHEET_CONFIG = {
    spreadsheetId: '1tRYoFQ2obJLoQfIBmZQ_qIw72ZCMV9fKIpBA3DlsIxE',
    rawGid: '0',
    scoreGid: '468989223'
  };

  const MIN_LOADING_MS = 700;
  const PAGE_SIZE_REKAP = 20;
  const PAGE_SIZE_DETAIL = 10;
  const MAX_ITKP = 10;

  window.__moduleInit = function ({ container }) {
    const root = container.querySelector('.itkp-sirup-page');
    if (!root) return null;

    const state = {
      rawRows: [],
      scoreRows: [],
      filteredScore: [],
      filteredRawGlobal: [],
      selectedOpd: '',
      selectedRawRows: [],
      rekapPage: 1,
      detailPage: 1,
      destroyed: false,
      sortPersentase: '',
      sortItkp: ''
    };

    const EL = {
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
      rekapTableBody: root.querySelector('#rekapTableBody'),
      rekapPagination: root.querySelector('#rekapPagination'),
      rekapPaginationInfo: root.querySelector('#rekapPaginationInfo'),
      detailContent: root.querySelector('#detailContent'),
      detailTitle: root.querySelector('#detailTitle'),
      detailSubtitle: root.querySelector('#detailSubtitle'),
      detailPagination: root.querySelector('#detailPagination'),
      detailPaginationInfo: root.querySelector('#detailPaginationInfo'),
      btnResetFilter: root.querySelector('#btnResetFilter'),
      btnExportRekap: root.querySelector('#btnExportRekap'),
      btnExportDetail: root.querySelector('#btnExportDetail'),
      btnExportCurrentDetail: root.querySelector('#btnExportCurrentDetail'),
      btnRefresh: root.querySelector('#btnRefresh'),
      btnClearSelected: root.querySelector('#btnClearSelected'),
      btnShowMaxList: root.querySelector('#btnShowMaxList'),
      btnShowBelowList: root.querySelector('#btnShowBelowList'),
      btnSortPersentase: root.querySelector('#btnSortPersentase'),
      btnSortItkp: root.querySelector('#btnSortItkp'),
      sortPersentaseArrow: root.querySelector('#sortPersentaseArrow'),
      sortItkpArrow: root.querySelector('#sortItkpArrow'),
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
      insightMaxCount: root.querySelector('#insightMaxCount'),
      insightBelowCount: root.querySelector('#insightBelowCount'),
      insightMetode: root.querySelector('#insightMetode'),
      insightMetodeNote: root.querySelector('#insightMetodeNote'),
      opdModal: root.querySelector('#opdModal'),
      modalTitle: root.querySelector('#modalTitle'),
      modalSubtitle: root.querySelector('#modalSubtitle'),
      modalCount: root.querySelector('#modalCount'),
      modalList: root.querySelector('#modalList'),
      btnCloseModal: root.querySelector('#btnCloseModal')
    };

    const listeners = [];
    let cleanupResizeHandler = null;

    const on = (target, event, handler) => {
      if (!target) return;
      target.addEventListener(event, handler);
      listeners.push(() => target.removeEventListener(event, handler));
    };

    on(EL.filterOpd, 'change', () => {
      state.selectedOpd = EL.filterOpd.value || '';
      state.rekapPage = 1;
      state.detailPage = 1;
      applyFilters();
    });
    on(EL.filterMetode, 'change', () => { state.rekapPage = 1; state.detailPage = 1; applyFilters(); });
    on(EL.filterSumberDana, 'change', () => { state.rekapPage = 1; state.detailPage = 1; applyFilters(); });
    on(EL.filterWaktu, 'change', () => { state.rekapPage = 1; state.detailPage = 1; applyFilters(); });
    on(EL.searchPaket, 'input', () => { state.rekapPage = 1; state.detailPage = 1; applyFilters(); });
    on(EL.btnResetFilter, 'click', resetFilters);
    on(EL.btnRefresh, 'click', () => initMonitoring(true));
    on(EL.btnExportRekap, 'click', handleExportRekap);
    on(EL.btnExportDetail, 'click', handleExportDetail);
    on(EL.btnExportCurrentDetail, 'click', handleExportCurrentDetail);
    on(EL.btnClearSelected, 'click', clearSelectedDetail);
    on(EL.btnShowMaxList, 'click', showMaxList);
    on(EL.btnShowBelowList, 'click', showBelowList);
    on(EL.btnCloseModal, 'click', closeModal);
    on(EL.opdModal, 'click', (event) => {
      if (event.target === EL.opdModal) closeModal();
    });
    on(document, 'keydown', (event) => {
      if (event.key === 'Escape') closeModal();
    });
    on(EL.btnSortPersentase, 'click', () => toggleSort('persentase'));
    on(EL.btnSortItkp, 'click', () => toggleSort('itkp'));

    initMonitoring(true);

    return function destroy() {
      state.destroyed = true;
      listeners.forEach(off => off());
      if (cleanupResizeHandler) {
        window.removeEventListener('resize', cleanupResizeHandler);
        cleanupResizeHandler = null;
      }
      closeModal();
      clearLoading();
    };

    async function initMonitoring(useOverlay = false) {
      const startedAt = Date.now();
      try {
        showError('');
        setLoading('Menghubungkan ke Google Sheet...', useOverlay);

        const [rawResult, scoreResult] = await Promise.allSettled([
          fetchCsv(buildCsvUrl(SHEET_CONFIG.rawGid)),
          fetchCsv(buildCsvUrl(SHEET_CONFIG.scoreGid))
        ]);

        if (state.destroyed) return;

        let rawRows = [];
        let scoreRows = [];
        const errors = [];

        if (rawResult.status === 'fulfilled') rawRows = csvToObjects(rawResult.value);
        else { errors.push('RAW_SIRUP gagal dimuat'); console.error(rawResult.reason); }

        if (scoreResult.status === 'fulfilled') scoreRows = csvToObjects(scoreResult.value);
        else { errors.push('SCORE_ITKP_SIRUP gagal dimuat'); console.error(scoreResult.reason); }

        state.rawRows = normalizeRawRows(rawRows);
        state.scoreRows = normalizeScoreRows(scoreRows);
        state.rekapPage = 1;
        state.detailPage = 1;

        buildFilterOptions();
        applyFilters();

        if (errors.length) showError(errors.join(' + ') + '. Sebagian data berhasil dimuat, sebagian gagal.');
      } catch (error) {
        console.error(error);
        showError(`Data SIRUP gagal dimuat. Detail: ${error.message}. Pastikan sheet bisa diakses publik.`);
      } finally {
        const elapsed = Date.now() - startedAt;
        if (elapsed < MIN_LOADING_MS) await wait(MIN_LOADING_MS - elapsed);
        if (!state.destroyed) clearLoading();
      }
    }

    function applyFilters() {
      const selectedOpdFilter = normalizeOpdName(EL.filterOpd?.value || '');
      const selectedMetode = normalizeText(EL.filterMetode?.value || '');
      const selectedSumberDana = normalizeText(EL.filterSumberDana?.value || '');
      const selectedWaktu = normalizeText(EL.filterWaktu?.value || '');
      const keyword = normalizeText(EL.searchPaket?.value || '');

      state.filteredRawGlobal = state.rawRows.filter((row) => {
        if (selectedOpdFilter && normalizeOpdName(row.satuan_kerja) !== selectedOpdFilter) return false;
        if (selectedMetode && normalizeText(row.metode_pemilihan) !== selectedMetode) return false;
        if (selectedSumberDana && normalizeText(row.sumber_dana) !== selectedSumberDana) return false;
        if (selectedWaktu && normalizeText(row.waktu_pemilihan) !== selectedWaktu) return false;

        if (keyword) {
          const hay = normalizeText(`${row.nama_paket} ${row.program} ${row.kegiatan} ${row.sub_kegiatan} ${row.kode_rup}`);
          if (!hay.includes(keyword)) return false;
        }
        return true;
      });

      const allowedOpdSet = new Set(state.filteredRawGlobal.map((row) => normalizeOpdName(row.satuan_kerja)));

      state.filteredScore = state.scoreRows.filter((row) => {
        const rowOpd = normalizeOpdName(row.satuan_kerja);
        if (selectedOpdFilter && rowOpd !== selectedOpdFilter) return false;
        if (selectedMetode || selectedSumberDana || selectedWaktu || keyword) return allowedOpdSet.has(rowOpd);
        return true;
      });

      sortFilteredScore();

      if (state.selectedOpd && !state.filteredScore.some((row) => normalizeOpdName(row.satuan_kerja) === normalizeOpdName(state.selectedOpd))) {
        state.selectedOpd = '';
      }

      renderStats();
      renderInsights();
      renderRekapTable();

      if (state.selectedOpd) renderDetailForOpd(state.selectedOpd);
      else renderEmptyDetail();

      updateSortIndicators();
    }

    function sortFilteredScore() {
      state.filteredScore = [...state.filteredScore].sort((a, b) => {
        if (state.sortPersentase) {
          const diff = (Number(a.prosentase || 0) - Number(b.prosentase || 0)) * (state.sortPersentase === 'asc' ? 1 : -1);
          if (diff !== 0) return diff;
        }
        if (state.sortItkp) {
          const diff = (Number(a.nilai_itkp || 0) - Number(b.nilai_itkp || 0)) * (state.sortItkp === 'asc' ? 1 : -1);
          if (diff !== 0) return diff;
        }
        return String(a.satuan_kerja || '').localeCompare(String(b.satuan_kerja || ''), 'id');
      });
    }

    function toggleSort(type) {
      if (type === 'persentase') {
        state.sortPersentase = state.sortPersentase === 'asc' ? 'desc' : state.sortPersentase === 'desc' ? '' : 'asc';
      }
      if (type === 'itkp') {
        state.sortItkp = state.sortItkp === 'asc' ? 'desc' : state.sortItkp === 'desc' ? '' : 'asc';
      }
      state.rekapPage = 1;
      applyFilters();
    }

    function updateSortIndicators() {
      safeSetText(EL.sortPersentaseArrow, state.sortPersentase === 'asc' ? '↑' : state.sortPersentase === 'desc' ? '↓' : '↕');
      safeSetText(EL.sortItkpArrow, state.sortItkp === 'asc' ? '↑' : state.sortItkp === 'desc' ? '↓' : '↕');
    }

    function buildFilterOptions() {
      populateSelect(EL.filterOpd, uniqueSorted(state.scoreRows.map((x) => x.satuan_kerja)), 'Semua Satuan Kerja');
      populateSelect(EL.filterMetode, uniqueSorted(state.rawRows.map((x) => x.metode_pemilihan)), 'Semua Metode');
      populateSelect(EL.filterSumberDana, uniqueSorted(state.rawRows.map((x) => x.sumber_dana)), 'Semua Sumber Dana');
      populateSelect(EL.filterWaktu, uniqueSorted(state.rawRows.map((x) => x.waktu_pemilihan)), 'Semua Waktu');
    }

    function renderStats() {
      const jumlahOpd = state.filteredScore.length;
      const jumlahPaket = state.filteredRawGlobal.length;
      const totalRup = sum(state.filteredScore.map((x) => x.total_rup_diumumkan));
      const totalKomitmen = sum(state.filteredScore.map((x) => x.total_komitmen));
      const avgPersen = jumlahOpd ? sum(state.filteredScore.map((x) => x.prosentase)) / jumlahOpd : 0;
      const avgItkp = jumlahOpd ? sum(state.filteredScore.map((x) => x.nilai_itkp)) / jumlahOpd : 0;

      safeSetText(EL.statJumlahOpd, formatNumber(jumlahOpd));
      safeSetText(EL.statJumlahPaket, formatNumber(jumlahPaket));
      safeSetText(EL.statTotalRup, formatShortCurrency(totalRup));
      safeSetText(EL.statTotalKomitmen, formatShortCurrency(totalKomitmen));
      safeSetText(EL.statAvgPersen, `${formatPercent(avgPersen)}%`);
      safeSetText(EL.statAvgItkp, formatDecimal(avgItkp));
      safeSetText(EL.statJumlahOpdNote, 'Total satuan kerja pada data rekap.');
      safeSetText(EL.statJumlahPaketNote, 'Total paket pada RAW SIRUP.');
      safeSetText(EL.statTotalRupNote, formatCurrency(totalRup));
      safeSetText(EL.statTotalKomitmenNote, formatCurrency(totalKomitmen));
    }

    function renderInsights() {
      const maxItems = state.filteredScore.filter((row) => Number(row.nilai_itkp || 0) >= MAX_ITKP);
      const belowItems = state.filteredScore.filter((row) => Number(row.nilai_itkp || 0) < MAX_ITKP);
      safeSetText(EL.insightMaxCount, `${formatNumber(maxItems.length)} OPD`);
      safeSetText(EL.insightBelowCount, `${formatNumber(belowItems.length)} OPD`);

      const metodeCounts = {};
      state.filteredRawGlobal.forEach((row) => {
        metodeCounts[row.metode_pemilihan] = (metodeCounts[row.metode_pemilihan] || 0) + 1;
      });
      const dominantEntry = Object.entries(metodeCounts).sort((a, b) => b[1] - a[1])[0];
      if (dominantEntry) {
        safeSetText(EL.insightMetode, dominantEntry[0]);
        safeSetText(EL.insightMetodeNote, `${formatNumber(dominantEntry[1])} paket`);
      } else {
        safeSetText(EL.insightMetode, '-');
        safeSetText(EL.insightMetodeNote, 'Belum ada data.');
      }
    }

    function renderRekapTable() {
      const totalRows = state.filteredScore.length;
      const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE_REKAP));
      if (state.rekapPage > totalPages) state.rekapPage = totalPages;
      const startIndex = (state.rekapPage - 1) * PAGE_SIZE_REKAP;
      const pageRows = state.filteredScore.slice(startIndex, startIndex + PAGE_SIZE_REKAP);

      if (!pageRows.length) {
        EL.rekapTableBody.innerHTML = '<tr><td colspan="9" class="center-cell">Tidak ada data rekap yang sesuai filter.</td></tr>';
      } else {
        EL.rekapTableBody.innerHTML = pageRows.map((row, index) => `
          <tr>
            <td>${startIndex + index + 1}</td>
            <td class="cell-strong">${escapeHtml(row.satuan_kerja)}</td>
            <td>${formatTableNumber(row.penyedia_diumumkan)}</td>
            <td>${formatTableNumber(row.swakelola_diumumkan)}</td>
            <td>${formatTableNumber(row.total_rup_diumumkan)}</td>
            <td>${formatTableNumber(row.total_komitmen)}</td>
            <td>
              <button type="button" class="badge-btn" data-badge-opd="${escapeAttr(row.satuan_kerja)}" data-badge-kind="persen">
                ${renderPercentBadge(row.prosentase)}
              </button>
            </td>
            <td>
              <button type="button" class="badge-btn" data-badge-opd="${escapeAttr(row.satuan_kerja)}" data-badge-kind="itkp">
                ${renderItkpBadge(row.nilai_itkp)}
              </button>
            </td>
            <td><button type="button" class="action-btn" data-opd="${escapeAttr(row.satuan_kerja)}">Lihat Paket</button></td>
          </tr>
        `).join('');

        EL.rekapTableBody.querySelectorAll('[data-opd]').forEach((btn) => {
          on(btn, 'click', () => selectOpd(btn.getAttribute('data-opd') || ''));
        });
        EL.rekapTableBody.querySelectorAll('[data-badge-opd]').forEach((btn) => {
          on(btn, 'click', () => selectOpd(btn.getAttribute('data-badge-opd') || ''));
        });
      }

      renderPagination(EL.rekapPagination, EL.rekapPaginationInfo, totalRows, state.rekapPage, PAGE_SIZE_REKAP, (page) => {
        state.rekapPage = page;
        renderRekapTable();
      });
    }

    function selectOpd(opd) {
      state.selectedOpd = opd;
      state.detailPage = 1;
      if (EL.filterOpd) EL.filterOpd.value = opd;
      applyFilters();
      root.querySelector('.detail-panel:last-of-type')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderDetailForOpd(opdName) {
      const opdKey = normalizeOpdName(opdName);
      const rows = state.filteredRawGlobal.filter((row) => normalizeOpdName(row.satuan_kerja) === opdKey);
      state.selectedRawRows = rows;
      safeSetText(EL.detailTitle, `Detail Paket SIRUP - ${opdName}`);
      safeSetText(EL.detailSubtitle, `${formatNumber(rows.length)} paket ditampilkan sesuai filter aktif.`);

      const totalRows = rows.length;
      const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE_DETAIL));
      if (state.detailPage > totalPages) state.detailPage = totalPages;
      const startIndex = (state.detailPage - 1) * PAGE_SIZE_DETAIL;
      const pageRows = rows.slice(startIndex, startIndex + PAGE_SIZE_DETAIL);

      if (!pageRows.length) {
        EL.detailContent.innerHTML = '<div class="empty-state">Tidak ada detail paket untuk OPD ini sesuai filter yang dipilih.</div>';
      } else {
        EL.detailContent.innerHTML = `
          <div class="top-scroll-wrap" id="topScrollWrap"><div class="top-scroll-inner" id="topScrollInner"></div></div>
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
                ${pageRows.map((row, index) => `
                  <tr>
                    <td>${startIndex + index + 1}</td>
                    <td>${escapeHtml(row.kode_rup)}</td>
                    <td class="cell-strong">${escapeHtml(row.nama_paket)}</td>
                    <td class="cell-muted">${escapeHtml(row.program)}</td>
                    <td class="cell-muted">${escapeHtml(row.kegiatan)}</td>
                    <td class="cell-muted">${escapeHtml(row.sub_kegiatan)}</td>
                    <td>${formatTableNumber(row.pagu_anggaran)}</td>
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
        setupDetailHorizontalScroll();
      }

      renderPagination(EL.detailPagination, EL.detailPaginationInfo, totalRows, state.detailPage, PAGE_SIZE_DETAIL, (page) => {
        state.detailPage = page;
        renderDetailForOpd(state.selectedOpd);
      });
    }

    function setupDetailHorizontalScroll() {
      const topScrollWrap = root.querySelector('#topScrollWrap');
      const topScrollInner = root.querySelector('#topScrollInner');
      const detailTableWrap = root.querySelector('#detailTableWrap');
      const detailTable = root.querySelector('#detailTable');
      if (!topScrollWrap || !topScrollInner || !detailTableWrap || !detailTable) return;

      const syncWidths = () => {
        topScrollInner.style.width = `${detailTable.scrollWidth}px`;
        topScrollWrap.scrollLeft = detailTableWrap.scrollLeft;
      };
      syncWidths();

      let syncingFromTop = false;
      let syncingFromBottom = false;
      topScrollWrap.onscroll = () => {
        if (syncingFromBottom) return;
        syncingFromTop = true;
        detailTableWrap.scrollLeft = topScrollWrap.scrollLeft;
        syncingFromTop = false;
      };
      detailTableWrap.onscroll = () => {
        if (syncingFromTop) return;
        syncingFromBottom = true;
        topScrollWrap.scrollLeft = detailTableWrap.scrollLeft;
        syncingFromBottom = false;
      };
      if (cleanupResizeHandler) window.removeEventListener('resize', cleanupResizeHandler);
      cleanupResizeHandler = syncWidths;
      window.addEventListener('resize', cleanupResizeHandler);
      window.requestAnimationFrame(syncWidths);
    }

    function renderEmptyDetail() {
      state.selectedRawRows = [];
      state.detailPage = 1;
      safeSetText(EL.detailTitle, 'Detail Paket SIRUP');
      safeSetText(EL.detailSubtitle, 'Pilih salah satu OPD pada tabel rekap untuk melihat detail paket.');
      EL.detailContent.innerHTML = 'Detail paket belum ditampilkan. Klik tombol <strong>Lihat Paket</strong> pada salah satu OPD.';
      renderPagination(EL.detailPagination, EL.detailPaginationInfo, 0, 1, PAGE_SIZE_DETAIL, () => {});
    }

    function resetFilters() {
      if (EL.filterOpd) EL.filterOpd.value = '';
      if (EL.filterMetode) EL.filterMetode.value = '';
      if (EL.filterSumberDana) EL.filterSumberDana.value = '';
      if (EL.filterWaktu) EL.filterWaktu.value = '';
      if (EL.searchPaket) EL.searchPaket.value = '';
      state.selectedOpd = '';
      state.sortPersentase = '';
      state.sortItkp = '';
      state.rekapPage = 1;
      state.detailPage = 1;
      applyFilters();
    }

    function clearSelectedDetail() {
      state.selectedOpd = '';
      state.selectedRawRows = [];
      state.detailPage = 1;
      if (EL.filterOpd) EL.filterOpd.value = '';
      applyFilters();
    }

    function showMaxList() {
      openModal(
        'Daftar OPD Nilai ITKP 10',
        'Daftar OPD yang sudah mencapai nilai ITKP 10 pada filter aktif.',
        state.filteredScore
          .filter((row) => Number(row.nilai_itkp || 0) >= MAX_ITKP)
          .map((row) => ({
            title: row.satuan_kerja,
            subtitle: `Nilai ITKP ${formatDecimal(row.nilai_itkp)} | Prosentase ${formatPercent(row.prosentase)}%`
          }))
      );
    }

    function showBelowList() {
      openModal(
        'Daftar OPD Nilai di Bawah 10',
        'Daftar OPD yang nilai ITKP-nya masih di bawah 10 pada filter aktif.',
        state.filteredScore
          .filter((row) => Number(row.nilai_itkp || 0) < MAX_ITKP)
          .map((row) => ({
            title: row.satuan_kerja,
            subtitle: `Nilai ITKP ${formatDecimal(row.nilai_itkp)} | Prosentase ${formatPercent(row.prosentase)}%`
          }))
      );
    }

    function openModal(title, subtitle, items) {
      if (!EL.opdModal) return;
      const safeItems = Array.isArray(items) ? items : [];
      safeSetText(EL.modalTitle, title || 'Daftar OPD');
      safeSetText(EL.modalSubtitle, subtitle || '-');
      safeSetText(EL.modalCount, `${formatNumber(safeItems.length)} OPD`);
      EL.modalList.innerHTML = safeItems.length
        ? safeItems.map((item, idx) => `
            <div class="modal-item">
              <div class="modal-number">${idx + 1}</div>
              <div class="modal-main">
                <b>${escapeHtml(item.title)}</b>
                <span>${escapeHtml(item.subtitle || '-')}</span>
              </div>
            </div>
          `).join('')
        : '<div class="modal-item"><div class="modal-main"><b>Belum ada data.</b></div></div>';
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
      [EL.btnRefresh, EL.btnExportRekap, EL.btnExportDetail, EL.btnExportCurrentDetail].forEach((btn) => { if (btn) btn.disabled = true; });
    }

    function clearLoading() {
      if (EL.loadingBox) EL.loadingBox.classList.remove('show');
      if (EL.globalLoadingOverlay) EL.globalLoadingOverlay.classList.remove('show');
      [EL.btnRefresh, EL.btnExportRekap, EL.btnExportDetail, EL.btnExportCurrentDetail].forEach((btn) => { if (btn) btn.disabled = false; });
    }

    function showError(message) {
      if (!EL.errorBox) return;
      EL.errorBox.textContent = message || '';
      EL.errorBox.classList.toggle('show', !!message);
    }

    function handleExportRekap() {
      exportRows(
        state.filteredScore.map((row) => ({
          satuan_kerja: row.satuan_kerja,
          penyedia_diumumkan: row.penyedia_diumumkan,
          swakelola_diumumkan: row.swakelola_diumumkan,
          total_rup_diumumkan: row.total_rup_diumumkan,
          total_komitmen: row.total_komitmen,
          prosentase: row.prosentase,
          nilai_itkp: row.nilai_itkp
        })),
        'rekap_itkp_sirup.xlsx'
      );
    }

    function handleExportDetail() {
      const rows = state.selectedOpd ? state.selectedRawRows : state.filteredRawGlobal;
      exportRows(rows, 'detail_paket_sirup.xlsx');
    }

    function handleExportCurrentDetail() {
      if (!state.selectedOpd || !state.selectedRawRows.length) {
        alert('Pilih salah satu OPD terlebih dahulu.');
        return;
      }
      const safeName = slugify(state.selectedOpd);
      exportRows(state.selectedRawRows, `detail_paket_${safeName}.xlsx`);
    }
  };

  function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
  function safeSetText(el, value) { if (el) el.textContent = value; }
  function buildCsvUrl(gid) { return `https://docs.google.com/spreadsheets/d/${SHEET_CONFIG.spreadsheetId}/export?format=csv&gid=${gid}`; }

  async function fetchCsv(url, retries = 2) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, { method: 'GET', cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status} saat mengambil ${url}`);
        const text = await response.text();
        if (!text || !text.trim()) throw new Error(`CSV kosong dari ${url}`);
        if (/<!doctype html>|<html/i.test(text)) throw new Error(`Response bukan CSV, kemungkinan akses sheet masih tertutup: ${url}`);
        return text;
      } catch (error) {
        lastError = error;
        if (attempt < retries) await wait(500 + (attempt * 700));
      }
    }
    throw lastError;
  }

  function csvToObjects(csvText) {
    const rows = parseCsv(csvText);
    if (!rows.length) return [];
    const headers = rows[0].map((h, index) => {
      const normalized = normalizeHeader(h);
      return normalized || `_skip_empty_header_${index}`;
    });
    return rows.slice(1)
      .filter((row) => row.some((cell) => String(cell || '').trim() !== ''))
      .map((row) => {
        const obj = {};
        headers.forEach((header, index) => {
          if (header.startsWith('_skip_empty_header_')) return;
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
        if (inQuotes && next === '"') { cell += '"'; i++; } else { inQuotes = !inQuotes; }
      } else if (char === ',' && !inQuotes) {
        row.push(cell); cell = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && next === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else {
        cell += char;
      }
    }
    if (cell.length || row.length) { row.push(cell); rows.push(row); }
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

  function pick(obj, keys) {
    for (const key of keys) {
      if (obj[key] != null && String(obj[key]).trim() !== '') return String(obj[key]).trim();
    }
    return '';
  }

  function normalizeRawRows(rows) {
    return rows.map((row) => ({
      satuan_kerja: pick(row, ['satuan_kerja']),
      kode_rup: pick(row, ['kode_rup']),
      program: pick(row, ['program']),
      kegiatan: pick(row, ['kegiatan']),
      sub_kegiatan: pick(row, ['sub_kegiatan']),
      nama_paket: pick(row, ['nama_paket']),
      pagu_anggaran: toNumber(pick(row, ['pagu_anggaran', 'pagu', 'total_rup', 'nilai_pagu'])),
      cara_pengadaan: pick(row, ['cara_pengadaan']),
      metode_pemilihan: pick(row, ['metode_pemilihan', 'metode']),
      jenis_pengadaan: pick(row, ['jenis_pengadaan']),
      pdn: pick(row, ['produk_dalam_negeri', 'pdn']),
      sumber_dana: pick(row, ['sumber_dana']),
      waktu_pemilihan: pick(row, ['waktu_pemilihan'])
    })).filter((row) => row.satuan_kerja && row.nama_paket);
  }

  function normalizeScoreRows(rows) {
    return rows.map((row) => ({
      satuan_kerja: pick(row, ['satuan_kerja']),
      penyedia_diumumkan: toNumber(pick(row, ['penyedia_diumumkan', 'penyedia'])),
      swakelola_diumumkan: toNumber(pick(row, ['swakelola_diumumkan', 'swakelola'])),
      total_rup_diumumkan: toNumber(pick(row, ['total_rup_diumumkan', 'total_rup'])),
      total_komitmen: toNumber(pick(row, ['total_komitmen'])),
      prosentase: toNumber(pick(row, ['prosentase', 'persentase'])),
      nilai_itkp: toNumber(pick(row, ['nilai_itkp']))
    })).filter((row) => row.satuan_kerja);
  }

  function populateSelect(selectEl, items, placeholder) {
    if (!selectEl) return;
    const currentValue = selectEl.value;
    selectEl.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>`;
    items.forEach((item) => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      selectEl.appendChild(option);
    });
    if (items.includes(currentValue)) selectEl.value = currentValue;
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
    prevBtn.onclick = () => { if (currentPage > 1) onPageChange(currentPage - 1); };
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
    nextBtn.onclick = () => { if (currentPage < totalPages) onPageChange(currentPage + 1); };
    container.appendChild(nextBtn);
  }

  function renderPercentBadge(value) {
    const cls = value >= 100 ? 'badge badge-green' : value >= 80 ? 'badge badge-yellow' : 'badge badge-red';
    return `<span class="${cls}">${formatPercent(value)}%</span>`;
  }

  function renderItkpBadge(value) {
    const cls = value >= MAX_ITKP ? 'badge badge-green' : value >= 5 ? 'badge badge-yellow' : 'badge badge-red';
    return `<span class="${cls}">${formatDecimal(value)}</span>`;
  }

  function renderBlueBadge(value) {
    return `<span class="badge badge-blue">${escapeHtml(value)}</span>`;
  }

  function renderPdnBadge(value) {
    const yes = String(value).trim().toLowerCase() === 'ya';
    return yes ? '<span class="badge badge-green">Ya</span>' : '<span class="badge badge-red">Tidak</span>';
  }

  function exportRows(rows, filename) {
    if (!Array.isArray(rows) || !rows.length) {
      alert('Tidak ada data yang bisa diexport.');
      return;
    }
    if (!window.XLSX) {
      alert('Library XLSX belum dimuat. Tambahkan xlsx.full.min.js sebelum file JS module ini.');
      return;
    }
    const safeFilename = String(filename || 'export-data.xlsx').replace(/\.csv$/i, '.xlsx').replace(/\.xls$/i, '.xlsx');
    const worksheet = XLSX.utils.json_to_sheet(rows.map((row) => ({ ...row })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    const colWidths = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      let maxLength = 10;
      for (let row = range.s.r; row <= range.e.r; row++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
        if (cell && cell.v != null) maxLength = Math.max(maxLength, String(cell.v).length);
      }
      colWidths.push({ wch: Math.min(maxLength + 2, 45) });
    }
    worksheet['!cols'] = colWidths;
    XLSX.writeFile(workbook, safeFilename);
  }

  function toNumber(value) {
    if (value == null || value === '') return 0;
    let str = String(value).trim();
    if (!str) return 0;
    str = str.replace(/[^
\d.,-]/g, '').replace(/\s/g, '');
    const hasDot = str.includes('.');
    const hasComma = str.includes(',');
    if (hasDot && hasComma) {
      const lastDot = str.lastIndexOf('.');
      const lastComma = str.lastIndexOf(',');
      if (lastComma > lastDot) str = str.replace(/\./g, '').replace(',', '.');
      else str = str.replace(/,/g, '');
    } else if (hasComma) {
      const parts = str.split(',');
      if (parts.length > 2) str = parts.join('');
      else str = (parts[1] || '').length === 3 ? parts.join('') : `${parts[0]}.${parts[1] || ''}`;
    } else if (hasDot) {
      const parts = str.split('.');
      if (parts.length > 2) str = parts.join('');
      else if ((parts[1] || '').length === 3) str = parts.join('');
    }
    const parsed = Number(str);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function sum(arr) { return arr.reduce((acc, val) => acc + Number(val || 0), 0); }
  function uniqueSorted(arr) { return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'id')); }
  function formatNumber(value) { return Number(value || 0).toLocaleString('id-ID'); }
  function formatTableNumber(value) { return Number(value || 0).toLocaleString('id-ID'); }
  function formatCurrency(value) { return 'Rp' + Number(value || 0).toLocaleString('id-ID'); }
  function formatShortCurrency(value) {
    const num = Number(value || 0);
    if (num >= 1_000_000_000_000) return 'Rp' + (num / 1_000_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' T';
    if (num >= 1_000_000_000) return 'Rp' + (num / 1_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' M';
    if (num >= 1_000_000) return 'Rp' + (num / 1_000_000).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' Jt';
    return 'Rp' + num.toLocaleString('id-ID');
  }
  function formatPercent(value) { return Number(value || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function formatDecimal(value) { return Number(value || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
  function normalizeOpdName(value) { return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[^\w\s]/g, ''); }
  function normalizeText(value) { return String(value || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function slugify(text) { return String(text || 'data').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'data'; }
  function escapeHtml(value) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
  function escapeAttr(value) { return escapeHtml(value); }
})();
