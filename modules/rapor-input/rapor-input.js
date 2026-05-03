(function () {
  'use strict';

  const STORAGE_KEY = 'traxpbj_rapor_identitas_drafts_v2';
  const SHEET_ID = '1QbXFJ6A3CWhZUH7el7-ZzpvqhR1s7cZ93bBe4iKMtzA';
  const SHEET_MASTER = 'MASTER_OPD';
  const SHEET_INDEX = 'INDEX_RAPOT';
  const MONTHS = [
    { value: '', label: '-- Pilih Bulan --' },
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' }
  ];
  const STATUS = { DRAFT: 'Draft', MENUNGGU: 'Menunggu', REVISI: 'Revisi', OK: 'OK' };

  let root, state = {
    masterRows: [],
    indexRows: [],
    availability: { exists: false, ready: false, canCreate: false, canEdit: false, canOpen: false, id_rapot: '', status_qc: '', qc_notes: '', message: 'Lengkapi data identitas lalu cek existing.' }
  };

  function csvUrl(sheetName) {
    return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  }
  function q(id) { return root.querySelector(id); }
  function esc(text) { return String(text || '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m])); }
  function normalizeHeader(text) { return String(text || '').trim().toLowerCase().replace(/\s+/g, '_'); }
  function norm(text) { return String(text || '').trim().toLowerCase(); }
  function monthLabel(val) { const found = MONTHS.find(m => String(m.value) === String(val)); return found ? found.label : '-'; }
  function draftKey(payload) { return [payload.tahun, payload.bulan, payload.kode_opd || payload.nama_opd || ''].join('||'); }
  function readStore() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } }
  function writeStore(obj) { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); }
  function makeIdRapot(tahun, bulan, kode) { const opd = String(kode || '').replace(/[^A-Za-z0-9]/g, '').slice(-8) || '00000000'; return `RPBJ${tahun}${String(bulan).padStart(2,'0')}${opd}`; }

  async function fetchCsv(sheetName) {
    const res = await fetch(csvUrl(sheetName), { cache: 'no-store' });
    if (!res.ok) throw new Error(`Gagal memuat sheet ${sheetName}`);
    const text = await res.text();
    return parseCsv(text);
  }

  function parseCsv(text) {
    const rows = [];
    let row = [], cell = '', inQuotes = false;
    const pushCell = () => { row.push(cell); cell = ''; };
    const pushRow = () => { rows.push(row); row = []; };
    for (let i = 0; i < text.length; i++) {
      const c = text[i], n = text[i + 1];
      if (inQuotes) {
        if (c === '"' && n === '"') { cell += '"'; i++; }
        else if (c === '"') inQuotes = false;
        else cell += c;
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ',') pushCell();
        else if (c === '\n') { pushCell(); pushRow(); }
        else if (c === '\r') {}
        else cell += c;
      }
    }
    if (cell.length || row.length) { pushCell(); pushRow(); }
    if (!rows.length) return [];
    const headers = rows.shift().map(normalizeHeader);
    return rows.filter(r => r.some(v => String(v || '').trim() !== '')).map(r => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = String(r[i] || '').trim());
      return obj;
    });
  }

  function buildPicOptions() {
    const map = new Map();
    state.masterRows.forEach(r => {
      const pic = String(r.nama_pic || '').trim();
      if (!pic) return;
      if (!map.has(pic)) map.set(pic, []);
      map.get(pic).push(r);
    });
    return Array.from(map.entries()).map(([pic, rows]) => ({ pic, count: rows.length, rows })).sort((a, b) => a.pic.localeCompare(b.pic, 'id'));
  }

  function renderMonthOptions() {
    q('#riBulan').innerHTML = MONTHS.map(m => `<option value="${esc(m.value)}">${esc(m.label)}</option>`).join('');
    const currentMonth = '3';
    q('#riBulan').value = currentMonth;
  }

  function renderPicOptions(selectedValue) {
    const picSelect = q('#riPicSelect');
    const list = buildPicOptions();
    picSelect.innerHTML = '<option value="">-- Pilih Nama PIC --</option>' + list.map(item => `<option value="${esc(item.pic)}">${esc(item.count > 1 ? `${item.pic} (${item.count} OPD)` : item.pic)}</option>`).join('');
    if (selectedValue) picSelect.value = selectedValue;
  }

  function rowsByPic(pic) {
    return state.masterRows.filter(r => norm(r.nama_pic) === norm(pic));
  }

  function renderOpdOptions(rows, selectedValue) {
    const opdSelect = q('#riOpdSelect');
    opdSelect.innerHTML = '<option value="">-- Pilih OPD --</option>' + rows.map(r => `<option value="${esc(r.nama_opd)}" data-kode="${esc(r.kode_opd)}">${esc(r.nama_opd)}</option>`).join('');
    if (selectedValue) opdSelect.value = selectedValue;
    if (rows.length === 1 && !selectedValue) opdSelect.value = rows[0].nama_opd;
    syncKodeFromOpd();
  }

  function syncKodeFromOpd() {
    const opdSelect = q('#riOpdSelect');
    const opt = opdSelect.options[opdSelect.selectedIndex];
    q('#riKodeOpd').value = opt ? (opt.dataset.kode || '') : '';
  }

  function getPayload() {
    return {
      tahun: String(q('#riTahun').value || '').trim(),
      bulan: String(q('#riBulan').value || '').trim(),
      input_by: String(q('#riPicSelect').value || '').trim(),
      nama_opd: String(q('#riOpdSelect').value || '').trim(),
      kode_opd: String(q('#riKodeOpd').value || '').trim()
    };
  }

  function findExisting(payload) {
    const tahun = norm(payload.tahun), bulan = norm(payload.bulan), kode = norm(payload.kode_opd), nama = norm(payload.nama_opd);
    return state.indexRows.find(r => norm(r.tahun) === tahun && norm(r.bulan) === bulan && ((kode && norm(r.kode_opd) === kode) || (nama && norm(r.nama_opd) === nama))) || null;
  }

  function computeAvailability(payload) {
    if (!payload.tahun || !payload.bulan || !payload.nama_opd) {
      return { success: true, exists: false, ready: false, canCreate: false, canEdit: false, canOpen: false, id_rapot: '', status_qc: '', qc_notes: '', message: 'Lengkapi tahun, bulan, dan OPD terlebih dahulu.' };
    }
    const existing = findExisting(payload);
    if (!existing) {
      return { success: true, exists: false, ready: true, canCreate: true, canEdit: true, canOpen: false, id_rapot: makeIdRapot(payload.tahun, payload.bulan, payload.kode_opd), status_qc: '', qc_notes: '', action_label: 'Lanjutkan Draft', message: 'Belum ada rapot untuk periode dan OPD ini. Anda dapat membuat rapot baru.' };
    }
    const statusQc = String(existing.status_qc || '');
    const editable = statusQc === STATUS.DRAFT || statusQc === STATUS.REVISI;
    let actionLabel = 'Lihat Data';
    let message = 'Rapot untuk periode dan OPD ini sudah ada.';
    if (statusQc === STATUS.DRAFT) { actionLabel = 'Lanjutkan Draft'; message = 'Sudah ada rapot Draft untuk periode dan OPD ini.'; }
    else if (statusQc === STATUS.REVISI) { actionLabel = 'Edit Revisi'; message = 'Rapot ini dikembalikan QC untuk direvisi.'; }
    else if (statusQc === STATUS.MENUNGGU) { actionLabel = 'Lihat Data'; message = 'Rapot periode ini sedang menunggu review QC dan belum bisa diedit.'; }
    else if (statusQc === STATUS.OK) { actionLabel = 'Lihat Data'; message = 'Rapot periode ini sudah final / OK dan tidak bisa diedit.'; }
    return { success: true, exists: true, ready: true, canCreate: false, canEdit: editable, canOpen: true, id_rapot: existing.id_rapot || makeIdRapot(payload.tahun,payload.bulan,payload.kode_opd), status_qc: statusQc, qc_notes: existing.qc_notes || '', action_label: actionLabel, message };
  }

  function badge(status) {
    const raw = String(status || '').trim();
    if (!raw) return '<span class="ri-badge info">Draft Baru</span>';
    const cls = raw.toLowerCase() === 'draft' ? 'draft' : raw.toLowerCase() === 'revisi' ? 'revisi' : raw.toLowerCase() === 'menunggu' ? 'menunggu' : raw.toLowerCase() === 'ok' ? 'ok' : 'info';
    return `<span class="ri-badge ${cls}">${esc(raw)}</span>`;
  }

  function updateSummary(payload) {
    q('#riSummaryPeriode').textContent = payload.tahun && payload.bulan ? `${monthLabel(payload.bulan)} ${payload.tahun}` : '-';
    q('#riSummaryPic').textContent = payload.input_by || 'Belum dipilih';
    q('#riSummaryOpd').textContent = payload.nama_opd || 'Belum dipilih';
  }

  function applyAvailability(av) {
    state.availability = av;
    q('#riStatusBadgeWrap').innerHTML = badge(av.status_qc || 'Draft Baru');
    q('#riAvailabilityBadge').innerHTML = av.exists ? badge(av.status_qc || 'Ada') : '<span class="ri-badge info">Belum Ada</span>';
    q('#riAvailabilityMessage').textContent = av.message || '-';
    q('#riQcNotes').textContent = av.qc_notes || '-';
    q('#riIdRapotLabel').textContent = av.id_rapot || '-';
    q('#riModeLabel').textContent = av.canEdit ? (av.exists ? (av.action_label || 'Edit Rapot') : 'Input Baru') : (av.canOpen ? 'Read Only' : 'Input Baru');
    q('#riContinueBtn').textContent = av.exists ? (av.action_label || 'Lanjutkan Draft') : 'Lanjutkan Draft';
    q('#riContinueBtn').disabled = !av.ready || !av.canEdit;
    q('#riOpenBtn').disabled = !av.exists || !av.canOpen;
    q('#riSaveBtn').disabled = !av.ready || !av.canEdit;
    const lock = av.exists && !av.canEdit;
    ['#riTahun','#riBulan','#riPicSelect','#riOpdSelect'].forEach(id => q(id).disabled = lock);
    q('#riEditRule').textContent = lock ? 'Mode baca saja. Status Menunggu atau OK hanya bisa dilihat, edit dilakukan oleh QC.' : 'Draft dan Revisi bisa dilanjutkan. Menunggu dan OK hanya bisa dilihat.';
  }

  function checkAvailability() {
    const payload = getPayload();
    updateSummary(payload);
    applyAvailability(computeAvailability(payload));
  }

  function saveDraft() {
    const payload = getPayload();
    if (!payload.tahun || !payload.bulan || !payload.nama_opd || !payload.input_by) {
      q('#riHelperBox').textContent = 'Lengkapi tahun, bulan, PIC, dan OPD terlebih dahulu sebelum menyimpan draft identitas.';
      return;
    }
    const av = state.availability.ready ? state.availability : computeAvailability(payload);
    if (!av.canEdit) {
      q('#riHelperBox').textContent = 'Draft tidak bisa disimpan dari halaman input karena status rapot ini tidak editable.';
      return;
    }
    const store = readStore();
    store[draftKey(payload)] = { ...payload, id_rapot: av.id_rapot || makeIdRapot(payload.tahun,payload.bulan,payload.kode_opd), saved_at: new Date().toISOString() };
    writeStore(store);
    q('#riHelperBox').textContent = `Draft identitas tersimpan di browser untuk ${payload.nama_opd}. Tahap backend live bisa disambungkan setelah layout dan logic identitas final.`;
  }

  function continueDraft() {
    const av = state.availability;
    if (!av.canEdit) return;
    const payload = getPayload();
    q('#riHelperBox').textContent = av.exists ? `${av.action_label || 'Lanjutkan Draft'} untuk ${payload.nama_opd} siap diteruskan ke tab berikutnya.` : `Rapot baru untuk ${payload.nama_opd} siap dibuat dengan ID ${av.id_rapot}.`;
  }

  function openData() {
    const av = state.availability;
    if (!av.canOpen) return;
    q('#riHelperBox').textContent = `Mode lihat data untuk ID ${av.id_rapot}. Pada tahap berikutnya tombol ini bisa disambungkan ke loader detail rapot existing.`;
  }

  async function init(container) {
    root = container;
    renderMonthOptions();
    q('#riCheckBtn').addEventListener('click', checkAvailability);
    q('#riSaveBtn').addEventListener('click', saveDraft);
    q('#riContinueBtn').addEventListener('click', continueDraft);
    q('#riOpenBtn').addEventListener('click', openData);
    q('#riPicSelect').addEventListener('change', () => {
      const pic = q('#riPicSelect').value;
      const rows = pic ? rowsByPic(pic) : state.masterRows;
      renderOpdOptions(rows);
      updateSummary(getPayload());
      applyAvailability({ exists:false, ready:false, canCreate:false, canEdit:false, canOpen:false, id_rapot:'', status_qc:'', qc_notes:'', message:'Pilih OPD yang sesuai dengan PIC terpilih.' });
    });
    q('#riOpdSelect').addEventListener('change', () => { syncKodeFromOpd(); updateSummary(getPayload()); });
    q('#riTahun').addEventListener('input', () => updateSummary(getPayload()));
    q('#riBulan').addEventListener('change', () => updateSummary(getPayload()));

    try {
      q('#riHelperBox').textContent = 'Memuat MASTER_OPD dan INDEX_RAPOT dari sheet publik...';
      const [masterRows, indexRows] = await Promise.all([fetchCsv(SHEET_MASTER), fetchCsv(SHEET_INDEX)]);
      state.masterRows = masterRows;
      state.indexRows = indexRows;
      renderPicOptions();
      renderOpdOptions([]);
      q('#riHelperBox').textContent = `MASTER_OPD ${masterRows.length} baris dan INDEX_RAPOT ${indexRows.length} baris berhasil dimuat. Pilih identitas untuk melanjutkan.`;
      updateSummary(getPayload());
      applyAvailability({ exists:false, ready:false, canCreate:false, canEdit:false, canOpen:false, id_rapot:'', status_qc:'', qc_notes:'', message:'Pilih tahun, bulan, PIC, lalu OPD untuk mengecek rapot existing.' });
    } catch (err) {
      q('#riHelperBox').textContent = `Gagal memuat data: ${err.message || String(err)}`;
      renderPicOptions();
      renderOpdOptions([]);
    }
  }

  window.__moduleInit = function ({ container }) {
    init(container);
    return function destroy() {};
  };
})();
