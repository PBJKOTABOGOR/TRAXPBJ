/* =========================================================
   PBJ MOBILE PIN WIDGET - HP ONLY
   Tempel setelah JS utama dashboard sudah jalan.

   Fitur:
   - Muncul di HP saja lewat CSS.
   - Pilih OPD/Satuan Kerja.
   - Pilihan disimpan localStorage.
   - Pin ring menampilkan skor ITKP OPD terpilih.
   - Panel dropdown menampilkan skor per indikator.
   - Info rapor terbaru khusus OPD terpilih.

   PENTING:
   Fungsi ini fleksibel baca data dari variable global kalau ada:
   window.itkpRows / window.ITKP_ROWS / window.masterItkp / window.dashboardRows
   window.indexRapotRows / window.raporRows / window.INDEX_RAPOT_ROWS

   Kalau nama variable di dashboard lu beda, cukup set mapping di PBJ_PIN_CONFIG.
   ========================================================= */
(function(){
  'use strict';

  const STORAGE_KEY = 'PBJ_PIN_SELECTED_OPD';
  const STORAGE_LAST_RAPOR_KEY = 'PBJ_PIN_LAST_RAPOR_ID';

  window.PBJ_PIN_CONFIG = Object.assign({
    scoreMax: 30,
    defaultOpd: 'PEMERINTAH KOTA BOGOR',
    dashboardUrl: '',
    refreshMs: 60000,
    dataProvider: null
  }, window.PBJ_PIN_CONFIG || {});

  let state = {
    open:false,
    selectedOpd:'',
    opdRows:[],
    raporRows:[],
    latestRapot:null,
    unreadCount:0
  };

  function isMobile(){
    return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  }

  function norm(v){
    return String(v == null ? '' : v).toLowerCase().replace(/\s+/g,' ').trim();
  }

  function pick(row, names, fallback){
    if (!row) return fallback || '';
    for (const name of names){
      if (row[name] !== undefined && row[name] !== null && String(row[name]).trim() !== '') return row[name];
    }
    const lower = {};
    Object.keys(row).forEach(k => lower[norm(k).replace(/ /g,'_')] = row[k]);
    for (const name of names){
      const key = norm(name).replace(/ /g,'_');
      if (lower[key] !== undefined && lower[key] !== null && String(lower[key]).trim() !== '') return lower[key];
    }
    return fallback || '';
  }

  function toNum(v){
    if (typeof v === 'number') return isNaN(v) ? 0 : v;
    let s = String(v == null ? '' : v).trim();
    if (!s || s === '-') return 0;
    s = s.replace('%','').replace(/Rp/gi,'').replace(/\s/g,'');
    const hasDot = s.includes('.');
    const hasComma = s.includes(',');
    if (hasDot && hasComma) s = s.replace(/\./g,'').replace(',', '.');
    else if (hasComma) s = s.replace(',', '.');
    const n = Number(s.replace(/[^\d.-]/g,''));
    return isNaN(n) ? 0 : n;
  }

  function fmtScore(v){
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits:2, maximumFractionDigits:2 }).format(toNum(v));
  }

  function fmtInt(v){
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits:0 }).format(toNum(v));
  }

  function esc(v){
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function getGlobalRows(names){
    for (const name of names){
      const val = window[name];
      if (Array.isArray(val)) return val;
      if (val && Array.isArray(val.rows)) return val.rows;
      if (val && Array.isArray(val.data)) return val.data;
    }
    return [];
  }

  function fallbackCollectRowsFromDom(){
    const selected = document.querySelector('#satkerSelect, #opdSelect, [data-selected-opd]');
    const selectedName = selected ? (selected.value || selected.getAttribute('data-selected-opd') || '') : '';
    const scoreText = document.querySelector('[data-itkp-score], .itkp-score, #itkpScore');
    const score = scoreText ? (scoreText.getAttribute('data-itkp-score') || scoreText.textContent || '') : '';
    if (!selectedName && !score) return [];
    return [{ nama_opd: selectedName || window.PBJ_PIN_CONFIG.defaultOpd, nilai_itkp: score || 0 }];
  }

  function getData(){
    if (typeof window.PBJ_PIN_CONFIG.dataProvider === 'function'){
      try {
        const data = window.PBJ_PIN_CONFIG.dataProvider() || {};
        return {
          opdRows: Array.isArray(data.opdRows) ? data.opdRows : [],
          raporRows: Array.isArray(data.raporRows) ? data.raporRows : []
        };
      } catch(e) {}
    }

    let opdRows = getGlobalRows([
      'itkpRows','ITKP_ROWS','masterItkp','MASTER_ITKP','dashboardRows','DASHBOARD_ROWS','satkerRows','SATKER_ROWS','allSatkerRows','ALL_SATKER_ROWS'
    ]);
    const raporRows = getGlobalRows([
      'indexRapotRows','INDEX_RAPOT_ROWS','raporRows','RAPOR_ROWS','reportRows','REPORT_ROWS','indexRows','INDEX_ROWS'
    ]);

    if (!opdRows.length) opdRows = fallbackCollectRowsFromDom();
    return { opdRows, raporRows };
  }

  function normalizeOpdRow(row){
    const nama = String(pick(row, ['nama_opd','nama_satker','satker','opd','nama','Nama OPD','Satuan Kerja'], '')).trim();
    const kode = String(pick(row, ['kode_opd','kode_satker','kode','Kode OPD'], '')).trim();
    const score = toNum(pick(row, ['nilai_itkp','skor_itkp','itkp','score','nilai','Skor ITKP'], 0));
    const sirup = toNum(pick(row, ['sirup_score','skor_sirup','sirup','nilai_sirup'], 0));
    const toko = toNum(pick(row, ['toko_daring_score','skor_toko_daring','toko_daring','nilai_toko_daring'], 0));
    const epur = toNum(pick(row, ['epurchasing_score','e_purchasing_score','skor_epurchasing','epurchasing','e_purchasing'], 0));
    const etender = toNum(pick(row, ['etendering_score','e_tendering_score','skor_etendering','etendering','e_tendering'], 0));
    const ekontrak = toNum(pick(row, ['ekontrak_score','e_kontrak_score','skor_ekontrak','ekontrak','e_kontrak'], 0));
    const non = toNum(pick(row, ['non_etendering_score','non_e_tendering_score','non_etendering','non_e_tendering'], 0));
    return { raw:row, nama, kode, score, indicators:[
      {name:'SiRUP', score:sirup, max:10},
      {name:'Toko Daring', score:toko, max:1},
      {name:'e-Purchasing', score:epur, max:4},
      {name:'e-Tendering', score:etender, max:5},
      {name:'e-Kontrak', score:ekontrak, max:5},
      {name:'Non eTendering / Non ePurchasing', score:non, max:5}
    ]};
  }

  function normalizeRaporRow(row){
    return {
      raw:row,
      id:String(pick(row, ['id_rapot','id_rapor','id','ID Rapor'], '')).trim(),
      nama:String(pick(row, ['nama_opd','nama_satker','opd','Nama OPD'], '')).trim(),
      kode:String(pick(row, ['kode_opd','kode_satker','kode','Kode OPD'], '')).trim(),
      tahun:String(pick(row, ['tahun','year'], '')).trim(),
      bulan:String(pick(row, ['bulan','month'], '')).trim(),
      status:String(pick(row, ['status_qc','status','Status QC'], '')).trim(),
      updated:String(pick(row, ['updated_at','updated','timestamp','created_at'], '')).trim()
    };
  }

  function monthName(b){
    const m = {'1':'Januari','2':'Februari','3':'Maret','4':'April','5':'Mei','6':'Juni','7':'Juli','8':'Agustus','9':'September','10':'Oktober','11':'November','12':'Desember'};
    return m[String(b)] || String(b || '-');
  }

  function refreshState(){
    const data = getData();
    state.opdRows = (data.opdRows || []).map(normalizeOpdRow).filter(r => r.nama);
    state.raporRows = (data.raporRows || []).map(normalizeRaporRow).filter(r => r.id || r.nama);

    const saved = localStorage.getItem(STORAGE_KEY) || '';
    if (saved && state.opdRows.some(r => norm(r.nama) === norm(saved))) state.selectedOpd = saved;
    else if (!state.selectedOpd) {
      const def = window.PBJ_PIN_CONFIG.defaultOpd;
      const foundDef = state.opdRows.find(r => norm(r.nama) === norm(def));
      state.selectedOpd = foundDef ? foundDef.nama : (state.opdRows[0] ? state.opdRows[0].nama : def);
    }

    const current = getSelectedRow();
    state.latestRapot = getLatestRapot(current);
    const lastSeen = localStorage.getItem(STORAGE_LAST_RAPOR_KEY) || '';
    state.unreadCount = state.latestRapot && state.latestRapot.id && state.latestRapot.id !== lastSeen ? 1 : 0;
  }

  function getSelectedRow(){
    return state.opdRows.find(r => norm(r.nama) === norm(state.selectedOpd)) || state.opdRows[0] || {nama:state.selectedOpd || window.PBJ_PIN_CONFIG.defaultOpd, score:0, indicators:[]};
  }

  function getLatestRapot(opd){
    const rows = state.raporRows.filter(r => {
      if (!opd) return false;
      if (opd.kode && r.kode && norm(opd.kode) === norm(r.kode)) return true;
      return norm(r.nama) === norm(opd.nama);
    });
    if (!rows.length) return null;
    rows.sort((a,b) => {
      const tb = Number(b.tahun || 0) - Number(a.tahun || 0); if (tb) return tb;
      const mb = Number(b.bulan || 0) - Number(a.bulan || 0); if (mb) return mb;
      return String(b.updated || '').localeCompare(String(a.updated || ''));
    });
    return rows[0];
  }

  function scoreDeg(score){
    const max = Number(window.PBJ_PIN_CONFIG.scoreMax || 30);
    return Math.max(0, Math.min(360, (toNum(score) / max) * 360));
  }

  function ensureWidget(){
    if (document.getElementById('pbjPinWidgetFab')) return;
    const fab = document.createElement('button');
    fab.type = 'button';
    fab.id = 'pbjPinWidgetFab';
    fab.className = 'pbj-pin-fab';
    fab.innerHTML = `
      <div class="pbj-pin-fab-ring"><div class="pbj-pin-fab-score">0,00</div></div>
      <div class="pbj-pin-fab-text"><div class="pbj-pin-fab-label">OPD Dipantau</div><div class="pbj-pin-fab-opd">-</div></div>
      <div class="pbj-pin-badge" id="pbjPinBadge">1</div>
    `;

    const backdrop = document.createElement('div');
    backdrop.id = 'pbjPinBackdrop';
    backdrop.className = 'pbj-pin-backdrop';

    const panel = document.createElement('div');
    panel.id = 'pbjPinPanel';
    panel.className = 'pbj-pin-panel';

    document.body.appendChild(fab);
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    fab.addEventListener('click', togglePanel);
    backdrop.addEventListener('click', closePanel);
  }

  function renderFab(){
    const current = getSelectedRow();
    const fab = document.getElementById('pbjPinWidgetFab');
    if (!fab) return;
    fab.style.setProperty('--pbj-score-deg', scoreDeg(current.score) + 'deg');
    const score = fab.querySelector('.pbj-pin-fab-score');
    const opd = fab.querySelector('.pbj-pin-fab-opd');
    const badge = document.getElementById('pbjPinBadge');
    if (score) score.textContent = fmtScore(current.score);
    if (opd) opd.textContent = current.nama || '-';
    if (badge){
      badge.textContent = String(state.unreadCount || 0);
      badge.classList.toggle('show', !!state.unreadCount);
    }
  }

  function renderPanel(filterText){
    const panel = document.getElementById('pbjPinPanel');
    if (!panel) return;
    const current = getSelectedRow();
    const filter = norm(filterText || '');
    const rows = state.opdRows.filter(r => !filter || norm(r.nama).includes(filter) || norm(r.kode).includes(filter)).slice(0, 80);
    const latest = state.latestRapot;
    const max = Number(window.PBJ_PIN_CONFIG.scoreMax || 30);

    panel.innerHTML = `
      <div class="pbj-pin-panel-head">
        <div class="pbj-pin-title-row">
          <div>
            <div class="pbj-pin-title">Pilih OPD</div>
            <div class="pbj-pin-selected">${esc(current.nama || '-')}</div>
            <div class="pbj-pin-status-pill">Widget OPD Dipantau</div>
          </div>
          <button type="button" class="pbj-pin-close" id="pbjPinCloseBtn">×</button>
        </div>
      </div>
      <div class="pbj-pin-body">
        <input class="pbj-pin-search" id="pbjPinSearch" placeholder="Cari OPD..." value="${esc(filterText || '')}">
        <div class="pbj-pin-opd-list">
          ${rows.map(r => `
            <div class="pbj-pin-opd-item ${norm(r.nama) === norm(current.nama) ? 'active' : ''}" data-opd="${esc(r.nama)}">
              <div class="pbj-pin-opd-name">${esc(r.nama)}</div>
              <div class="pbj-pin-opd-score">${fmtScore(r.score)}</div>
            </div>`).join('') || '<div class="pbj-pin-report-text">OPD tidak ditemukan.</div>'}
        </div>

        <div class="pbj-pin-score-card">
          <div class="pbj-pin-score-ring" style="--pbj-score-deg:${scoreDeg(current.score)}deg">
            <div class="pbj-pin-score-inner">
              <div class="pbj-pin-score-label">ITKP OPD</div>
              <div class="pbj-pin-score-value">${fmtScore(current.score)}</div>
              <div class="pbj-pin-score-max">dari ${fmtInt(max)} poin</div>
            </div>
          </div>
          <div class="pbj-pin-note">
            Pilihan ini tersimpan di HP ini. Notifikasi rapor terbaru hanya menampilkan OPD yang dipilih.
          </div>
        </div>

        <div class="pbj-pin-report-box">
          <div class="pbj-pin-report-title">Info Rapor Terbaru</div>
          <div class="pbj-pin-report-text">
            ${latest ? `Rapor ${esc(current.nama)} periode ${esc(monthName(latest.bulan))} ${esc(latest.tahun)} tersedia. Status QC: <b>${esc(latest.status || '-')}</b>. ID: <b>${esc(latest.id || '-')}</b>.` : 'Belum ada rapor terbaru untuk OPD ini.'}
          </div>
        </div>

        <div class="pbj-pin-bars">
          ${(current.indicators || []).map(ind => {
            const pct = ind.max ? Math.max(0, Math.min(100, (toNum(ind.score) / toNum(ind.max)) * 100)) : 0;
            return `<div class="pbj-pin-bar-item">
              <div class="pbj-pin-bar-top"><div class="pbj-pin-bar-name">${esc(ind.name)}</div><div class="pbj-pin-bar-score">${fmtInt(ind.score)}/${fmtInt(ind.max)}</div></div>
              <div class="pbj-pin-bar-track"><div class="pbj-pin-bar-fill" style="width:${pct}%"></div></div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;

    const closeBtn = document.getElementById('pbjPinCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    const search = document.getElementById('pbjPinSearch');
    if (search) search.addEventListener('input', () => renderPanel(search.value));
    panel.querySelectorAll('.pbj-pin-opd-item').forEach(item => {
      item.addEventListener('click', () => {
        const opd = item.getAttribute('data-opd') || '';
        state.selectedOpd = opd;
        localStorage.setItem(STORAGE_KEY, opd);
        refreshState();
        if (state.latestRapot && state.latestRapot.id) localStorage.setItem(STORAGE_LAST_RAPOR_KEY, state.latestRapot.id);
        state.unreadCount = 0;
        renderFab();
        renderPanel(search ? search.value : '');
        try { window.dispatchEvent(new CustomEvent('pbj-pin-opd-change', { detail:{ nama_opd:opd } })); } catch(e) {}
      });
    });
  }

  function openPanel(){
    state.open = true;
    refreshState();
    renderFab();
    renderPanel('');
    const panel = document.getElementById('pbjPinPanel');
    const backdrop = document.getElementById('pbjPinBackdrop');
    if (panel) panel.classList.add('show');
    if (backdrop) backdrop.classList.add('show');
    if (state.latestRapot && state.latestRapot.id) localStorage.setItem(STORAGE_LAST_RAPOR_KEY, state.latestRapot.id);
    state.unreadCount = 0;
    renderFab();
  }

  function closePanel(){
    state.open = false;
    const panel = document.getElementById('pbjPinPanel');
    const backdrop = document.getElementById('pbjPinBackdrop');
    if (panel) panel.classList.remove('show');
    if (backdrop) backdrop.classList.remove('show');
  }

  function togglePanel(){
    if (state.open) closePanel();
    else openPanel();
  }

  function tick(){
    if (!isMobile()) return;
    ensureWidget();
    refreshState();
    renderFab();
    if (state.open) renderPanel(document.getElementById('pbjPinSearch')?.value || '');
  }

  function init(){
    ensureWidget();
    tick();
    setInterval(tick, Number(window.PBJ_PIN_CONFIG.refreshMs || 60000));
    window.addEventListener('resize', tick);
    window.PBJ_PIN_WIDGET = { refresh:tick, open:openPanel, close:closePanel, getState:() => state };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
