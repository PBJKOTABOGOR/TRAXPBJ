(function(){
  'use strict';

  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx7r228pPRdeO6egj_6bDsJu0-V4TY64XiQOG0sZCjhTLexaUV-oqk3PJCKpc3oSsIbTA/exec';
  const MONTH_MAP = {
    '1':'Januari','2':'Februari','3':'Maret','4':'April','5':'Mei','6':'Juni','7':'Juli','8':'Agustus','9':'September','10':'Oktober','11':'November','12':'Desember'
  };

  let root = null;
  let masterOpd = [];
  let availabilityState = { exists:false, canEdit:true, canOpen:false, id_rapot:'', status_qc:'' };

  function q(sel){ return root ? root.querySelector(sel) : null; }
  function setResult(msg){ const el=q('#riResult'); if(el) el.innerText = msg || ''; }
  function setSummary(){
    const namaOpd = q('#riNamaOpd')?.value || 'Belum dipilih';
    const tahun = q('#riTahun')?.value || '-';
    const bulanVal = q('#riBulan')?.value || '';
    const bulan = bulanVal ? (MONTH_MAP[bulanVal] || bulanVal) : '-';
    const status = availabilityState.exists ? (availabilityState.status_qc || 'Existing') : 'Draft Baru';
    q('#riSummaryStatus').innerText = status;
    q('#riSummaryPeriode').innerText = bulan + ' ' + tahun;
    q('#riSummaryOpd').innerText = namaOpd;
  }

  async function apiGet(api, params){
    const url = new URL(SCRIPT_URL);
    url.searchParams.set('api', api);
    Object.entries(params || {}).forEach(([k,v]) => {
      if(v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
    const res = await fetch(url.toString(), { method:'GET' });
    if(!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  async function apiPost(api, payload){
    const res = await fetch(SCRIPT_URL, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(Object.assign({ api }, payload || {}))
    });
    if(!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  function renderPicDropdown(selected){
    const select = q('#riInputBy');
    const current = selected || select.value || '';
    const pics = [...new Set((masterOpd || []).map(r => String(r.nama_pic || '').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'));
    select.innerHTML = '<option value="">-- Pilih Nama PIC --</option>';
    pics.forEach(pic => {
      const opt=document.createElement('option'); opt.value=pic; opt.textContent=pic; select.appendChild(opt);
    });
    if(current) select.value=current;
  }

  function getOpdRowsByPic(picName){
    const pic = String(picName || '').trim();
    if(!pic) return masterOpd.slice();
    return masterOpd.filter(r => String(r.nama_pic || '').trim() === pic);
  }

  function renderOpdDropdown(rows, selectedNama){
    const select = q('#riNamaOpd');
    const current = selectedNama || select.value || '';
    select.innerHTML = '<option value="">-- Pilih OPD --</option>';
    (rows || []).forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.nama_opd || '';
      opt.textContent = r.nama_opd || '';
      opt.dataset.kode = r.kode_opd || '';
      opt.dataset.pic = r.nama_pic || '';
      select.appendChild(opt);
    });
    if(current) select.value = current;
  }

  async function loadMasterOpd(){
    setResult('Memuat master OPD...');
    const res = await apiGet('masterOpdFull');
    if(!res.success) throw new Error(res.message || 'Gagal memuat master OPD');
    masterOpd = Array.isArray(res.rows) ? res.rows : [];
    renderPicDropdown('');
    renderOpdDropdown(masterOpd, '');
    setResult('Master OPD berhasil dimuat.');
  }

  async function checkAvailability(){
    const tahun = q('#riTahun').value.trim();
    const bulan = q('#riBulan').value.trim();
    const kode_opd = q('#riKodeOpd').value.trim();
    const nama_opd = q('#riNamaOpd').value.trim();
    const msg = q('#riAvailabilityMessage');
    const btnLoad = q('#riBtnLoad');
    const btnReadOnly = q('#riBtnReadOnly');
    btnLoad.hidden = true;
    btnReadOnly.hidden = true;

    if(!tahun || !bulan || !nama_opd){
      availabilityState = { exists:false, canEdit:true, canOpen:false, id_rapot:'', status_qc:'' };
      msg.innerText = 'Pilih tahun, bulan, dan OPD untuk mengecek apakah rapot sudah ada.';
      setSummary();
      return;
    }

    setResult('Mengecek existing rapot...');
    const res = await apiGet('availability', { tahun, bulan, kode_opd, nama_opd });
    if(!res.success) throw new Error(res.message || 'Gagal mengecek existing');
    availabilityState = Object.assign({ exists:false, canEdit:true, canOpen:false, id_rapot:'', status_qc:'' }, res);
    msg.innerText = res.message || '-';
    if(res.exists && res.canEdit) btnLoad.hidden = false;
    if(res.exists && res.canOpen && !res.canEdit) btnReadOnly.hidden = false;
    setSummary();
    setResult(res.message || 'Pengecekan selesai.');
  }

  async function loadExisting(readOnly){
    if(!availabilityState.id_rapot){
      setResult('ID rapot belum tersedia.');
      return;
    }
    setResult('Memuat draft existing...');
    const res = await apiGet('getRapotForEdit', { id_rapot: availabilityState.id_rapot });
    if(!res.success) throw new Error(res.message || 'Gagal memuat draft');
    const data = res.data || {};
    const index = data.index || {};
    q('#riTahun').value = index.tahun || '';
    q('#riBulan').value = index.bulan || '';
    renderPicDropdown(index.input_by || '');
    renderOpdDropdown(getOpdRowsByPic(index.input_by || ''), index.nama_opd || '');
    q('#riInputBy').value = index.input_by || '';
    q('#riKodeOpd').value = index.kode_opd || '';
    q('#riNamaOpd').value = index.nama_opd || '';
    setSummary();
    setResult(readOnly ? 'Data existing dibuka dalam mode lihat.' : 'Draft existing berhasil dimuat.');
  }

  async function saveDraft(){
    const payload = {
      id_rapot: availabilityState.id_rapot || '',
      tahun: q('#riTahun').value.trim(),
      bulan: q('#riBulan').value.trim(),
      kode_opd: q('#riKodeOpd').value.trim(),
      nama_opd: q('#riNamaOpd').value.trim(),
      input_by: q('#riInputBy').value.trim()
    };

    if(!payload.tahun || !payload.bulan || !payload.nama_opd){
      setResult('Tahun, bulan, dan nama OPD wajib diisi.');
      return;
    }

    setResult('Menyimpan draft identitas...');
    const res = await apiPost('saveDraftIdentitas', payload);
    if(!res.success) throw new Error(res.message || 'Gagal menyimpan draft');
    availabilityState.id_rapot = res.id_rapot || availabilityState.id_rapot;
    availabilityState.exists = true;
    availabilityState.status_qc = res.status_qc || 'Draft';
    q('#riAvailabilityMessage').innerText = res.message || 'Draft berhasil disimpan.';
    setSummary();
    setResult((res.message || 'Draft berhasil disimpan.') + (res.id_rapot ? ('\nID Rapot: ' + res.id_rapot) : ''));
  }

  function resetForm(){
    q('#riTahun').value = String(new Date().getFullYear());
    q('#riBulan').value = '';
    q('#riKodeOpd').value = '';
    q('#riInputBy').value = '';
    renderPicDropdown('');
    renderOpdDropdown(masterOpd, '');
    availabilityState = { exists:false, canEdit:true, canOpen:false, id_rapot:'', status_qc:'' };
    q('#riAvailabilityMessage').innerText = 'Pilih tahun, bulan, dan OPD untuk mengecek apakah rapot sudah ada.';
    q('#riBtnLoad').hidden = true;
    q('#riBtnReadOnly').hidden = true;
    setSummary();
    setResult('Form direset.');
  }

  function bindEvents(){
    q('#riBtnCheck').addEventListener('click', () => checkAvailability().catch(handleError));
    q('#riBtnLoad').addEventListener('click', () => loadExisting(false).catch(handleError));
    q('#riBtnReadOnly').addEventListener('click', () => loadExisting(true).catch(handleError));
    q('#riBtnSave').addEventListener('click', () => saveDraft().catch(handleError));
    q('#riBtnReset').addEventListener('click', resetForm);

    ['#riTahun','#riBulan','#riKodeOpd'].forEach(sel => q(sel).addEventListener('change', setSummary));
    q('#riInputBy').addEventListener('change', () => {
      const rows = getOpdRowsByPic(q('#riInputBy').value);
      renderOpdDropdown(rows, '');
      q('#riKodeOpd').value = '';
      setSummary();
    });
    q('#riNamaOpd').addEventListener('change', () => {
      const opt = q('#riNamaOpd').selectedOptions[0];
      q('#riKodeOpd').value = opt ? (opt.dataset.kode || '') : '';
      if(opt && opt.dataset.pic && !q('#riInputBy').value) q('#riInputBy').value = opt.dataset.pic;
      setSummary();
    });
  }

  function handleError(err){
    const msg = err && err.message ? err.message : String(err);
    setResult('Error: ' + msg + '\nCatatan: jika browser menolak fetch ke Apps Script, aktifkan dulu endpoint API di deployment privat/public yang sama.');
    console.error(err);
  }

  window.__moduleInit = async function({ container }){
    root = container;
    root.classList.add('rapor-input-native-mounted');
    bindEvents();
    resetForm();
    try {
      await loadMasterOpd();
    } catch (err) {
      handleError(err);
    }
    return function destroy(){
      root = null;
    };
  };
})();
