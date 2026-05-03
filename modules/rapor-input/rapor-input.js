
(function () {
  'use strict';

  const STORAGE_KEY = 'traxpbj_rapor_identitas_drafts_v1';

  const MONTH_MAP = {
    '1': 'Januari','2': 'Februari','3': 'Maret','4': 'April','5': 'Mei','6': 'Juni',
    '7': 'Juli','8': 'Agustus','9': 'September','10': 'Oktober','11': 'November','12': 'Desember'
  };

  const MOCK_MASTER_OPD = [
    { kode_opd: '1.02.0.00.0.00.01.0000', nama_opd: 'DINAS KESEHATAN', nama_pic: 'Admin Dinkes' },
    { kode_opd: '1.02.0.00.0.00.02.0000', nama_opd: 'RUMAH SAKIT UMUM DAERAH', nama_pic: 'Admin RSUD' },
    { kode_opd: '1.03.0.00.0.00.01.0000', nama_opd: 'DINAS PENDIDIKAN', nama_pic: 'Admin Disdik' },
    { kode_opd: '1.04.0.00.0.00.01.0000', nama_opd: 'DINAS PEKERJAAN UMUM DAN PENATAAN RUANG', nama_pic: 'Admin PUPR' },
    { kode_opd: '4.01.0.00.0.00.01.0000', nama_opd: 'SEKRETARIAT DAERAH', nama_pic: 'Admin Setda' },
    { kode_opd: '5.02.0.00.0.00.01.0000', nama_opd: 'BADAN PENGELOLAAN KEUANGAN DAN ASET DAERAH', nama_pic: 'Admin BPKAD' },
    { kode_opd: '5.03.0.00.0.00.01.0000', nama_opd: 'BAPPERIDA', nama_pic: 'Admin Bapperida' }
  ];

  function esc(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function readStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  function writeStorage(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function makeDraftKey(payload) {
    return [payload.tahun || '', payload.bulan || '', payload.nama_opd || ''].join('||');
  }

  function makeIdRapot(payload) {
    const opdCode = String(payload.kode_opd || '').replace(/[^\d]/g, '').slice(-6) || '000000';
    return `RAPOT-${payload.tahun || '0000'}-${String(payload.bulan || '00').padStart(2, '0')}-${opdCode}`;
  }

  function getStatusBadgeHtml(status) {
    const raw = String(status || '').trim();
    const key = raw.toLowerCase();
    if (!raw || raw === 'Draft Baru') return '<span class="ri-status-badge ri-status-draft">Draft Baru</span>';
    if (key === 'draft') return '<span class="ri-status-badge ri-status-draft">Draft</span>';
    if (key === 'menunggu') return '<span class="ri-status-badge ri-status-menunggu">Menunggu</span>';
    if (key === 'revisi') return '<span class="ri-status-badge ri-status-revisi">Revisi</span>';
    if (key === 'ok') return '<span class="ri-status-badge ri-status-ok">OK</span>';
    return '<span class="ri-status-badge ri-status-draft">' + esc(raw) + '</span>';
  }

  window.__moduleInit = function __moduleInit({ container }) {
    const root = container;
    let masterOpd = MOCK_MASTER_OPD.slice();
    let picToOpd = {};
    let availabilityState = {
      exists: false,
      canEdit: true,
      canCreate: true,
      canOpen: false,
      id_rapot: '',
      status_qc: '',
      qc_notes: ''
    };

    const el = {
      tahun: root.querySelector('#riTahun'),
      bulan: root.querySelector('#riBulan'),
      inputBy: root.querySelector('#riInputBy'),
      kodeOpd: root.querySelector('#riKodeOpd'),
      namaOpd: root.querySelector('#riNamaOpd'),
      idRapot: root.querySelector('#riIdRapot'),
      availabilityMessage: root.querySelector('#riAvailabilityMessage'),
      availabilityMeta: root.querySelector('#riAvailabilityMeta'),
      qcNotesBox: root.querySelector('#riQcNotesBox'),
      btnLoadExisting: root.querySelector('#riBtnLoadExisting'),
      btnViewExisting: root.querySelector('#riBtnViewExisting'),
      btnReset: root.querySelector('#riBtnReset'),
      btnSaveDraft: root.querySelector('#riBtnSaveDraft'),
      result: root.querySelector('#riResult'),
      infoId: root.querySelector('#riInfoId'),
      summaryStatusWrap: root.querySelector('#riSummaryStatusWrap'),
      summaryOpd: root.querySelector('#riSummaryOpd'),
      summaryPeriode: root.querySelector('#riSummaryPeriode')
    };

    function setText(node, value) {
      if (node) node.textContent = value || '';
    }

    function setHtml(node, value) {
      if (node) node.innerHTML = value || '';
    }

    function getVal(node) {
      return node ? String(node.value || '').trim() : '';
    }

    function buildPicIndex() {
      picToOpd = {};
      masterOpd.forEach((row) => {
        const key = String(row.nama_pic || '').trim().toLowerCase();
        if (!key) return;
        if (!picToOpd[key]) picToOpd[key] = [];
        picToOpd[key].push(row);
      });
    }

    function renderPicDropdown(selectedValue) {
      if (!el.inputBy) return;
      el.inputBy.innerHTML = '<option value="">-- Pilih Nama PIC --</option>';
      const list = Object.keys(picToOpd)
        .map((key) => {
          const rows = picToOpd[key] || [];
          return { nama_pic: rows[0] ? rows[0].nama_pic : '', count: rows.length };
        })
        .filter((item) => item.nama_pic)
        .sort((a, b) => a.nama_pic.localeCompare(b.nama_pic, 'id'));

      list.forEach((item) => {
        const opt = document.createElement('option');
        opt.value = item.nama_pic;
        opt.textContent = item.count > 1 ? `${item.nama_pic} (${item.count} OPD)` : item.nama_pic;
        el.inputBy.appendChild(opt);
      });

      if (selectedValue) el.inputBy.value = selectedValue;
    }

    function renderOpdDropdown(rows, selectedValue) {
      if (!el.namaOpd) return;
      el.namaOpd.innerHTML = '<option value="">-- Pilih OPD --</option>';

      (rows || []).forEach((row) => {
        const opt = document.createElement('option');
        opt.value = row.nama_opd || '';
        opt.textContent = row.nama_opd || '';
        opt.dataset.kode = row.kode_opd || '';
        opt.dataset.pic = row.nama_pic || '';
        el.namaOpd.appendChild(opt);
      });

      if (selectedValue) el.namaOpd.value = selectedValue;
    }

    function getOpdRowsByPic(picName) {
      const key = String(picName || '').trim().toLowerCase();
      if (!key) return masterOpd.slice();
      return (picToOpd[key] || []).slice();
    }

    function getCurrentPayload() {
      return {
        id_rapot: getVal(el.idRapot),
        tahun: getVal(el.tahun),
        bulan: getVal(el.bulan),
        input_by: getVal(el.inputBy),
        kode_opd: getVal(el.kodeOpd),
        nama_opd: getVal(el.namaOpd)
      };
    }

    function updateSummary() {
      const payload = getCurrentPayload();
      setHtml(el.summaryStatusWrap, getStatusBadgeHtml(availabilityState.exists ? (availabilityState.status_qc || 'Draft') : 'Draft Baru'));
      setText(el.summaryOpd, payload.nama_opd || 'Belum dipilih');
      setText(el.summaryPeriode, payload.bulan ? `${MONTH_MAP[payload.bulan] || '-'} ${payload.tahun || '-'}` : '-');
      setText(el.infoId, payload.id_rapot ? `ID Rapor: ${payload.id_rapot}` : '');
    }

    function resetAvailabilityBox() {
      availabilityState = {
        exists: false,
        canEdit: true,
        canCreate: true,
        canOpen: false,
        id_rapot: '',
        status_qc: '',
        qc_notes: ''
      };
      setText(el.availabilityMessage, 'Pilih tahun, bulan, dan OPD untuk mengecek apakah draft rapor sudah ada.');
      setText(el.availabilityMeta, '');
      setText(el.qcNotesBox, '');
      el.btnLoadExisting.hidden = true;
      el.btnViewExisting.hidden = true;
      updateSummary();
    }

    function applyPayload(payload) {
      if (!payload) return;
      if (el.tahun) el.tahun.value = payload.tahun || '';
      if (el.bulan) el.bulan.value = payload.bulan || '';
      if (el.inputBy) el.inputBy.value = payload.input_by || '';
      if (el.kodeOpd) el.kodeOpd.value = payload.kode_opd || '';
      renderOpdDropdown(getOpdRowsByPic(payload.input_by), payload.nama_opd || '');
      if (el.idRapot) el.idRapot.value = payload.id_rapot || '';
      updateAvailability();
    }

    function updateAvailability() {
      const payload = getCurrentPayload();
      const enough = payload.tahun && payload.bulan && payload.nama_opd;
      if (!enough) {
        if (el.idRapot) el.idRapot.value = '';
        resetAvailabilityBox();
        return;
      }

      const storage = readStorage();
      const key = makeDraftKey(payload);
      const existing = storage[key];

      if (existing) {
        availabilityState = {
          exists: true,
          canEdit: true,
          canCreate: false,
          canOpen: true,
          id_rapot: existing.id_rapot || '',
          status_qc: existing.status_qc || 'Draft',
          qc_notes: existing.qc_notes || ''
        };
        if (el.idRapot) el.idRapot.value = existing.id_rapot || '';
        setText(el.availabilityMessage, 'Draft rapor untuk periode dan OPD ini sudah ada di penyimpanan lokal modul.');
        setText(el.availabilityMeta, `Status draft: ${existing.status_qc || 'Draft'} · PIC: ${existing.input_by || '-'} · OPD: ${existing.nama_opd || '-'}`);
        setText(el.qcNotesBox, existing.qc_notes ? `Catatan: ${existing.qc_notes}` : '');
        el.btnLoadExisting.hidden = false;
        el.btnViewExisting.hidden = false;
      } else {
        availabilityState = {
          exists: false,
          canEdit: true,
          canCreate: true,
          canOpen: false,
          id_rapot: '',
          status_qc: '',
          qc_notes: ''
        };
        if (el.idRapot) el.idRapot.value = makeIdRapot(payload);
        setText(el.availabilityMessage, 'Belum ada draft untuk kombinasi tahun, bulan, dan OPD ini. Silakan simpan draft identitas baru.');
        setText(el.availabilityMeta, 'Mode saat ini: draft lokal modul. Backend live belum disambungkan di tahap 1.');
        setText(el.qcNotesBox, '');
        el.btnLoadExisting.hidden = true;
        el.btnViewExisting.hidden = true;
      }

      updateSummary();
    }

    function saveDraft() {
      const payload = getCurrentPayload();

      if (!payload.tahun || !payload.bulan || !payload.input_by || !payload.nama_opd) {
        setText(el.result, 'Lengkapi Tahun, Bulan, PIC, dan Nama OPD terlebih dahulu.');
        return;
      }

      if (!payload.id_rapot) {
        payload.id_rapot = makeIdRapot(payload);
        if (el.idRapot) el.idRapot.value = payload.id_rapot;
      }

      const storage = readStorage();
      const key = makeDraftKey(payload);
      const finalData = {
        ...payload,
        status_qc: 'Draft',
        qc_notes: '',
        saved_at: new Date().toISOString()
      };

      storage[key] = finalData;
      writeStorage(storage);
      setText(el.result, 'Draft identitas berhasil disimpan di browser. Tahap berikutnya siap dilanjutkan setelah backend live disambungkan.');
      updateAvailability();
    }

    function loadExisting(mode) {
      const payload = getCurrentPayload();
      const storage = readStorage();
      const key = makeDraftKey(payload);
      const existing = storage[key];

      if (!existing) {
        setText(el.result, 'Draft tidak ditemukan.');
        return;
      }

      applyPayload(existing);
      setText(el.result, mode === 'view'
        ? 'Draft lokal berhasil dibaca. Saat ini modul masih tahap 1, jadi yang ditampilkan fokus ke identitas.'
        : 'Draft lokal berhasil dimuat kembali. Silakan lanjutkan pengisian tahap berikutnya nanti.');
    }

    function onPicChange() {
      const selectedPic = getVal(el.inputBy);
      const rows = getOpdRowsByPic(selectedPic);
      renderOpdDropdown(rows);
      if (el.kodeOpd) el.kodeOpd.value = '';
      updateAvailability();
    }

    function onOpdChange() {
      const selected = el.namaOpd ? el.namaOpd.selectedOptions[0] : null;
      if (selected && el.kodeOpd) {
        el.kodeOpd.value = selected.dataset.kode || '';
      }
      updateAvailability();
    }

    function onKodeManual() {
      updateAvailability();
    }

    function bind() {
      const currentYear = new Date().getFullYear();
      if (el.tahun && !el.tahun.value) el.tahun.value = String(currentYear);

      buildPicIndex();
      renderPicDropdown();
      renderOpdDropdown(masterOpd);
      resetAvailabilityBox();

      el.tahun?.addEventListener('input', updateAvailability);
      el.bulan?.addEventListener('change', updateAvailability);
      el.inputBy?.addEventListener('change', onPicChange);
      el.namaOpd?.addEventListener('change', onOpdChange);
      el.kodeOpd?.addEventListener('input', onKodeManual);

      el.btnSaveDraft?.addEventListener('click', saveDraft);
      el.btnLoadExisting?.addEventListener('click', () => loadExisting('continue'));
      el.btnViewExisting?.addEventListener('click', () => loadExisting('view'));
      el.btnReset?.addEventListener('click', () => {
        if (el.tahun) el.tahun.value = String(currentYear);
        if (el.bulan) el.bulan.value = '';
        if (el.inputBy) el.inputBy.value = '';
        if (el.kodeOpd) el.kodeOpd.value = '';
        if (el.idRapot) el.idRapot.value = '';
        renderOpdDropdown(masterOpd);
        setText(el.result, '');
        resetAvailabilityBox();
      });

      updateSummary();
    }

    bind();

    return function destroy() {
      window.__moduleInit = undefined;
    };
  };
})();
