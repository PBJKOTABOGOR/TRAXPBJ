/* Floating OPD pin widget for SIPPBJ.
   FIX terbaru:
   - Detail ITKP widget mengikuti dimensi asli dashboard (nilai/pagu dan paket), bukan angka skor mentah saja.
   - Search penyedia diberi badge jenis paket: Tender / Non Tender / e-Katalog.
   - Widget bisa digeser kiri-kanan-atas-bawah; setelah dilepas otomatis menempel ke sisi kiri/kanan.
*/
(function(){
  if (window.__PBJ_PIN_WIDGET_LOADED__) return;
  window.__PBJ_PIN_WIDGET_LOADED__ = true;

  const CONFIG = Object.assign({
    defaultOpd: 'PEMERINTAH KOTA BOGOR',
    scoreMax: 30,
    storageKey: 'pbj_pin_selected_opd',
    positionKey: 'pbj_pin_widget_position_v1',
    providerSpreadsheetId: '1DYsqMtvwhPn-IEA3te9fFukD_iMMDRqUNPamktuPz2U',
    providerSheets: ['PORTAL_PENYEDIA'],
    providerCacheKey: 'pbj_pin_provider_cache_v2',
    providerCacheMs: 1000 * 60 * 20,
    dataProvider: function(){
      return {
        opdRows: window.itkpRows || window.ITKP_ROWS || window.dashboardRows || window.DASHBOARD_ROWS || window.PBJ_ITKP_ROWS || [],
        raporRows: window.raporRows || window.RAPOR_ROWS || window.indexRapotRows || window.INDEX_RAPOT_ROWS || window.PBJ_RAPOR_ROWS || [],
        providerRows: window.providerRows || window.PROVIDER_ROWS || window.pemenangRows || window.PEMENANG_ROWS || window.allProviderRows || window.PBJ_PROVIDER_ROWS || []
      };
    }
  }, window.PBJ_PIN_CONFIG || {});

  const EDGE_LEFT = 12;
  const EDGE_RIGHT = 18;
  const EDGE_TOP_DEFAULT = 92;

  const state = {
    selectedOpd: '',
    open: false,
    dragging: false,
    tab: 'search',
    itkpMinimized: false,
    q: '',
    providerRows: [],
    providerResults: [],
    providerLoading: false,
    providerSearched: false,
    providerError: '',
    hidden: false
  };

  function esc(v){return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function norm(v){return String(v||'').toLowerCase().replace(/\s+/g,' ').trim();}
  function compactNorm(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'').trim();}
  function num(v){
    if (typeof v === 'number') return isNaN(v) ? 0 : v;
    let s = String(v ?? '').trim();
    if (!s || s === '-') return 0;
    const hasComma = s.includes(','), hasDot = s.includes('.');
    s = s.replace(/Rp/gi,'').replace(/%/g,'').replace(/\s/g,'');
    if (hasComma && hasDot) s = s.replace(/\./g,'').replace(',', '.');
    else if (hasComma) s = s.replace(',', '.');
    else if ((s.match(/\./g)||[]).length > 1) s = s.replace(/\./g,'');
    s = s.replace(/[^\d.-]/g,'');
    const n = Number(s);
    return isNaN(n) ? 0 : n;
  }
  function fmt2(v){return new Intl.NumberFormat('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2}).format(num(v));}
  function fmt0(v){return new Intl.NumberFormat('id-ID',{maximumFractionDigits:0}).format(num(v));}
  function fmtMoney(v){
    const n = num(v);
    if (!n) return 'Rp 0';
    if (n >= 1e12) return 'Rp ' + new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(n/1e12) + ' T';
    if (n >= 1e9) return 'Rp ' + new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(n/1e9) + ' M';
    if (n >= 1e6) return 'Rp ' + new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(n/1e6) + ' Jt';
    if (n >= 1e3) return 'Rp ' + new Intl.NumberFormat('id-ID',{maximumFractionDigits:1}).format(n/1e3) + ' Rb';
    return 'Rp ' + fmt0(n);
  }
  function pick(row, keys, def){
    if (!row) return def;
    for (const k of keys){
      if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') return row[k];
      const want = compactNorm(k);
      const found = Object.keys(row).find(x => compactNorm(x) === want);
      if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') return row[found];
    }
    const keyNorms = keys.map(compactNorm);
    const loose = Object.keys(row).find(x => keyNorms.some(k => compactNorm(x).includes(k) || k.includes(compactNorm(x))));
    if (loose && row[loose] !== undefined && row[loose] !== null && String(row[loose]).trim() !== '') return row[loose];
    return def;
  }
  function getData(){ try { return CONFIG.dataProvider() || {}; } catch(e){ return {}; } }
  function getOpdName(row){return String(pick(row,['name','nama','nama_opd','nama_satker','Satuan Kerja','Nama Satuan Kerja','satker','opd','Nama OPD','Satuan Kerja'],'')||'').trim();}
  function getScore(row){
    if (row && row.score !== undefined) return num(row.score);
    return num(pick(row,[
      'nilai_itkp','skor_itkp','score','itkp','Total Skor','SKOR ITKP',
      'Nilai ITKP Indikator Pemanfaatan Sistem - skor maksimal 30 (point)',
      'Nilai ITKP - Pemanfaatan Sistem - skor maksimal 30 (point)',
      'Nilai ITKP Pemanfaatan Sistem - skor maksimal 30 (point)',
      'Nilai ITKP Pemanfaatan Sistem','Nilai ITKP Indikator Pemanfaatan Sistem','Pemanfaatan Sistem - skor maksimal 30','Pemanfaatan Sistem'
    ],0));
  }
  function getSelectedRow(){
    const data = getData();
    const rows = Array.isArray(data.opdRows) ? data.opdRows : [];
    const selected = norm(state.selectedOpd || CONFIG.defaultOpd);
    return rows.find(r => norm(getOpdName(r)) === selected) || rows.find(r => {
      const n = norm(getOpdName(r));
      return n && (n.includes(selected) || selected.includes(n));
    }) || rows[0] || null;
  }
  function getLatestRapor(opd){
    const data = getData();
    const rows = Array.isArray(data.raporRows) ? data.raporRows : [];
    const nOpd = norm(opd);
    const list = rows.filter(r => {
      const n = norm(pick(r,['nama_opd','opd','Nama OPD'],''));
      return n && (n.includes(nOpd) || nOpd.includes(n));
    });
    list.sort((a,b)=> String(pick(b,['updated_at','created_at','tanggal','timestamp'],'')).localeCompare(String(pick(a,['updated_at','created_at','tanggal','timestamp'],''))));
    return list[0] || null;
  }
  function getRaporId(row){ return String(pick(row,['id_rapot','ID Rapot','id_rapor','ID Rapor','id'], '') || '').trim(); }
  function openLatestRapor(row, opd){
    const id = getRaporId(row);
    try {
      if (typeof window.PBJOpenLatestRapor === 'function') {
        window.PBJOpenLatestRapor({ id_rapot:id, id_rapor:id, opd:opd || state.selectedOpd, row:row || null });
        state.open = false;
        render();
        return;
      }
    } catch(e){}
    try {
      localStorage.setItem('pbj_rapor_direct_id', id || '');
      localStorage.setItem('pbj_rapor_direct_opd', opd || state.selectedOpd || CONFIG.defaultOpd);
    } catch(e){}
    const url = new URL(window.location.href);
    url.searchParams.set('page','rapor-pbj');
    if (id) url.searchParams.set('id_rapot', id);
    window.location.href = url.toString();
  }
  function syncDashboardOpd(opd){
    const name = String(opd || '').trim();
    if (!name) return;
    try {
      if (typeof window.PBJSelectDashboardOpd === 'function') {
        window.PBJSelectDashboardOpd(name);
      } else {
        window.dispatchEvent(new CustomEvent('pbj-pin-opd-changed', { detail:{ opd:name } }));
      }
    } catch(e){}
  }

  function parseCsv(text){
    const rows=[]; let row=[], val='', q=false;
    for(let i=0;i<text.length;i++){
      const c=text[i], n=text[i+1];
      if(c==='"' && q && n==='"'){ val+='"'; i++; continue; }
      if(c==='"'){ q=!q; continue; }
      if(c===',' && !q){ row.push(val); val=''; continue; }
      if((c==='\n'||c==='\r') && !q){ if(c==='\r'&&n==='\n') i++; row.push(val); if(row.some(x=>String(x).trim()!=='')) rows.push(row); row=[]; val=''; continue; }
      val+=c;
    }
    row.push(val); if(row.some(x=>String(x).trim()!=='')) rows.push(row);
    return rows;
  }
  function matrixToRows(matrix){
    const header = (matrix.shift() || []).map(h => String(h||'').trim());
    return matrix.map(cols => {
      const r = {};
      header.forEach((h,i)=>{ r[h] = String(cols[i] ?? '').trim(); });
      return r;
    }).filter(r => Object.values(r).some(v => String(v).trim() !== ''));
  }
  async function fetchProviderSheet(sheetName){
    const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(CONFIG.providerSpreadsheetId)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&v=${Date.now()}`;
    const res = await fetch(url, { cache:'no-store' });
    if (!res.ok) throw new Error(`Gagal membaca ${sheetName}`);
    const text = await res.text();
    if (/DOCTYPE html|<html|googlevisualization/i.test(text.slice(0,300))) throw new Error(`Sheet ${sheetName} belum publik / belum bisa dibaca`);
    return matrixToRows(parseCsv(text));
  }
  function loadProviderCache(){
    try {
      const raw = localStorage.getItem(CONFIG.providerCacheKey);
      if (!raw) return [];
      const obj = JSON.parse(raw);
      if (!obj || !obj.time || Date.now() - obj.time > Number(CONFIG.providerCacheMs || 0)) return [];
      return Array.isArray(obj.rows) ? obj.rows : [];
    } catch(e){ return []; }
  }
  function saveProviderCache(rows){ try { localStorage.setItem(CONFIG.providerCacheKey, JSON.stringify({ time:Date.now(), rows: rows || [] })); } catch(e){} }
  async function ensureProviderRows(){
    const data = getData();
    const globalRows = Array.isArray(data.providerRows) ? data.providerRows : [];
    if (globalRows.length) { state.providerRows = globalRows; return globalRows; }
    if (state.providerRows.length) return state.providerRows;
    const cached = loadProviderCache();
    if (cached.length) { state.providerRows = cached; return cached; }
    const sheets = Array.isArray(CONFIG.providerSheets) && CONFIG.providerSheets.length ? CONFIG.providerSheets : ['PORTAL_PENYEDIA'];
    const all = [];
    for (const s of sheets){
      try { all.push(...await fetchProviderSheet(s)); } catch(e){ state.providerError = e.message || String(e); }
    }
    state.providerRows = all;
    if (all.length) saveProviderCache(all);
    return all;
  }

  function getProviderName(row){return String(pick(row,['NAMA_PEMENANG','Nama Pemenang','pemenang','nama_penyedia','penyedia','Nama Penyedia','Pemenang'],'-')||'-').trim();}
  function getProviderPackage(row){return String(pick(row,['NAMA_PAKET','Nama Paket','nama_paket','paket','nama produk'],'-')||'-').trim();}
  function getProviderMeta(row){
    return [pick(row,['TAHUN','Tahun','tahun'],''), pick(row,['INSTANSI','Nama Instansi','K/L/PD','KL/PD','instansi','nama_opd','satker'],''), pick(row,['TAHAP_AKTIF','Tahap Aktif','Status Paket','status_paket','status'], '')].filter(Boolean).join(' · ');
  }
  function getProviderMethod(row){return String(pick(row,['METODE_PEMILIHAN','Metode Pemilihan','METODE_PENGADAAN','Metode Pengadaan','metode','jenis_pengadaan','Jenis Pengadaan','SUMBER','sumber'], '') || '').trim();}
  function getProviderType(row){
    const hay = norm([getProviderMethod(row), pick(row,['SUMBER','Sumber','sumber','KATEGORI','Kategori','kategori'],''), getProviderPackage(row)].join(' '));
    if (/e[- ]?purchasing|e[- ]?katalog|katalog/.test(hay)) return {label:'e-Katalog', cls:'ekatalog'};
    if (/tender|seleksi/.test(hay) && !/non/.test(hay)) return {label:'Tender', cls:'tender'};
    return {label:'Non Tender', cls:'nontender'};
  }
  function getProviderStatus(row){return String(pick(row,['TAHAP_AKTIF','Tahap Aktif','Status Paket','status_paket','status'], '') || '').trim();}
  function getProviderValue(row){return pick(row,['NILAI_KONTRAK','Nilai Kontrak','KONTRAK','kontrak','NILAI_PAGU','Nilai Pagu','PAGU','pagu','HPS','Nilai'],0);}
  function getProviderUrl(row, type){
    const map = {
      pengumuman:['URL_PENGUMUMAN','url_pengumuman','Pengumuman'],
      jadwal:['URL_JADWAL','url_jadwal','Jadwal'],
      pemenang:['URL_PEMENANG','url_pemenang','Pemenang'],
      kontrak:['URL_KONTRAK','url_kontrak','Kontrak']
    };
    return String(pick(row,map[type] || [],'') || '').trim();
  }
  async function runProviderSearch(q){
    const kw = norm(q);
    state.q = q;
    state.providerSearched = true;
    state.providerError = '';
    if (kw.length < 2) { state.providerResults = []; return; }
    state.providerLoading = true; render();
    try {
      const rows = await ensureProviderRows();
      state.providerResults = rows.filter(r => {
        const hay = [getProviderName(r), getProviderPackage(r), getProviderMeta(r), getProviderMethod(r), pick(r,['NPWP','npwp','KODE_PAKET','Kode Paket','kode'], '')].join(' ');
        return norm(hay).includes(kw);
      }).slice(0, 40);
    } catch(e){
      state.providerError = e.message || String(e);
      state.providerResults = [];
    } finally {
      state.providerLoading = false; render();
    }
  }

  function getDimensionValue(row, label){
    const keys = {
      'SiRUP': ['Nilai ITKP - skor maksimal 10 (point) (SIRUP)','SIRUP','sirup_score','sirup_nilai','sirup_terisi'],
      'Toko Daring': ['Nilai ITKP - skor maksimal 1 (point) (Toko Daring)','Toko Daring','toko_daring_nilai','toko_score','toko_daring_terisi'],
      'e-Purchasing': ['Nilai ITKP - skor maksimal 4 (point) (Epurchasing)','Epurchasing','ePurchasing','epurchasing_nilai','epurchasing_score','epurchasing_terisi'],
      'e-Tendering': ['Nilai ITKP - skor maksimal 5 (point) (etendering)','eTendering','etendering_nilai','etendering_score','etendering_terisi'],
      'e-Kontrak': ['Nilai ITKP - skor maksimal 5 (point) (ekontrak)','eKontrak','ekontrak_nilai','ekontrak_score','ekontrak_terisi'],
      'Non eTendering / Non ePurchasing': ['Nilai ITKP - skor maksimal 5 (point) (Non etendering & Non ePurchasing)','Non etendering','Non ePurchasing','Non Tender','nonetendering_nilai','non_score','nonetendering_terisi']
    };
    return num(pick(row, keys[label] || [label], 0));
  }
  function compactValue(v){
    const n = num(v);
    if (!n) return '0';
    if (n >= 1e12) return new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(n/1e12)+' T';
    if (n >= 1e9) return new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(n/1e9)+' M';
    if (n >= 1e6) return new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(n/1e6)+' Jt';
    return fmt0(n);
  }
  function pairText(a,b,compact){return (compact ? compactValue(a) : fmt0(a)) + ' / ' + (compact ? compactValue(b) : fmt0(b));}
  function getDimensionDetail(row, label){
    if (!row) return '';
    if (label === 'SiRUP') return pairText(pick(row,['Total Komitmen (SIRUP)','Total Komitmen Sirup','total_komitmen_sirup'],0), pick(row,['Total RUP Diumumkan (SIRUP)','Total RUP Diumumkan Sirup','total_rup_diumumkan_sirup'],0), true);
    if (label === 'Toko Daring') return fmt0(getDimensionValue(row,label)) + ' / 1';
    if (label === 'e-Purchasing') return pairText(pick(row,['Paket Selesai (ePurchasing)','Paket Selesai ePurchasing','paket_selesai_epurchasing'],0), pick(row,['Paket Aktif(ePurchasing)','Paket Aktif (ePurchasing)','Paket Aktif epurchasing','paket_aktif_epurchasing'],0), false);
    if (label === 'e-Tendering') return pairText(pick(row,['Paket Selesai (etendering)','Paket Selesai etendering','paket_selesai_etendering'],0), pick(row,['Paket Terumumkan (etendering)','Paket Terumumkan etendering','paket_terumumkan_etendering'],0), false);
    if (label === 'e-Kontrak') return pairText(pick(row,['Total Paket Selesai (ekontrak)','Total Paket Selesai ekontrak','paket_selesai_ekontrak'],0), pick(row,['Total Paket Aktif (ekontrak)','Total Paket Aktif ekontrak','paket_aktif_ekontrak'],0), false);
    if (label === 'Non eTendering / Non ePurchasing') return pairText(pick(row,['Total Realisasi (Non etendering & Non ePurchasing)','Total Realisasi Non etendering & Non ePurchasing','total_realisasi_nontender'],0), pick(row,['Total Pagu (Non etendering & Non ePurchasing)','Total Pagu Non etendering & Non ePurchasing','total_pagu_nontender'],0), true);
    return '';
  }
  function getDimensions(row){
    if (row && Array.isArray(row.dimensions) && row.dimensions.length) {
      return row.dimensions.map(d => ({
        label: d.name || d.label || '-',
        value: num(d.value),
        max: num(d.max || d.target || d.total || 0),
        detail: d.detailText || '',
        accent: d.accent || ''
      }));
    }
    return [
      {label:'SiRUP', value:getDimensionValue(row,'SiRUP'), max:10, accent:'blue', detail:getDimensionDetail(row,'SiRUP')},
      {label:'Toko Daring', value:getDimensionValue(row,'Toko Daring'), max:1, accent:'teal', detail:getDimensionDetail(row,'Toko Daring')},
      {label:'e-Purchasing', value:getDimensionValue(row,'e-Purchasing'), max:4, accent:'purple', detail:getDimensionDetail(row,'e-Purchasing')},
      {label:'e-Tendering', value:getDimensionValue(row,'e-Tendering'), max:5, accent:'orange', detail:getDimensionDetail(row,'e-Tendering')},
      {label:'e-Kontrak', value:getDimensionValue(row,'e-Kontrak'), max:5, accent:'green', detail:getDimensionDetail(row,'e-Kontrak')},
      {label:'Non eTendering / Non ePurchasing', value:getDimensionValue(row,'Non eTendering / Non ePurchasing'), max:5, accent:'red', detail:getDimensionDetail(row,'Non eTendering / Non ePurchasing')}
    ];
  }
  function metric(d){
    const max = num(d.max);
    const val = num(d.value);
    const pct = max ? Math.max(0, Math.min(100, (val/max)*100)) : 0;
    const right = d.detail ? esc(d.detail) : `${esc(fmt0(val))}/${esc(fmt0(max))}`;
    return `<div class="pbj-pin-metric accent-${esc(d.accent || 'blue')}"><div class="pbj-pin-metric-head"><span>${esc(d.label)}</span><span>${right}</span></div><div class="pbj-pin-bar"><div class="pbj-pin-bar-fill" style="width:${pct}%"></div></div></div>`;
  }
  function renderProviderCard(row){
    const kind = getProviderType(row);
    const status = getProviderStatus(row);
    const urls = ['pengumuman','jadwal','pemenang','kontrak'].map(type => {
      const u = getProviderUrl(row,type);
      if (!u) return '';
      const label = type === 'pengumuman' ? 'Pengumuman' : type.charAt(0).toUpperCase()+type.slice(1);
      return `<a class="pbj-pin-linkbtn" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
    }).filter(Boolean).join('');
    return `<div class="pbj-pin-provider-card provider-${esc(kind.cls)}">
      <div class="pbj-pin-provider-tags"><span class="pbj-pin-provider-type ${esc(kind.cls)}">${esc(kind.label)}</span>${status ? `<span class="pbj-pin-provider-status">${esc(status)}</span>` : ''}</div>
      <div class="pbj-pin-provider-name">${esc(getProviderName(row))}</div>
      <div class="pbj-pin-provider-package">${esc(getProviderPackage(row))}</div>
      <div class="pbj-pin-provider-meta">${esc(getProviderMeta(row) || '-')}</div>
      <div class="pbj-pin-provider-bottom"><span class="pbj-pin-provider-value">${esc(fmtMoney(getProviderValue(row)))}</span>${urls ? `<div class="pbj-pin-provider-links">${urls}</div>` : ''}</div>
    </div>`;
  }


  function getSavedPosition(){
    try { return JSON.parse(localStorage.getItem(CONFIG.positionKey) || 'null') || null; } catch(e){ return null; }
  }
  function savePosition(pos){ try { localStorage.setItem(CONFIG.positionKey, JSON.stringify(pos || {})); } catch(e){} }
  function getWidgetSize(root){
    const panel = root.querySelector('.pbj-pin-panel.open');
    const mini = root.querySelector('.pbj-pin-mini');
    const target = panel || mini || root;
    const rect = target.getBoundingClientRect();
    return { w: rect.width || root.offsetWidth || 260, h: rect.height || root.offsetHeight || 60 };
  }
  function clampTop(top, h){
    return Math.min(Math.max(8, Number(top || 8)), Math.max(8, window.innerHeight - h - 8));
  }
  function snapToEdge(root, left, top, save){
    const size = getWidgetSize(root);
    const snapLeft = Number(left || 0) + (size.w / 2) < window.innerWidth / 2;
    const finalLeft = snapLeft ? EDGE_LEFT : Math.max(EDGE_LEFT, window.innerWidth - size.w - EDGE_RIGHT);
    const finalTop = clampTop(top, size.h);
    root.style.left = finalLeft + 'px';
    root.style.top = finalTop + 'px';
    root.style.right = 'auto';
    root.classList.toggle('pbj-pin-left', snapLeft);
    root.classList.toggle('pbj-pin-right', !snapLeft);
    if (save) savePosition({ left: finalLeft, top: finalTop });
  }
  function applyPosition(root){
    const pos = getSavedPosition();
    const size = getWidgetSize(root);
    if (!pos || typeof pos.left !== 'number' || typeof pos.top !== 'number') {
      snapToEdge(root, window.innerWidth - size.w - EDGE_RIGHT, EDGE_TOP_DEFAULT, true);
      return;
    }
    snapToEdge(root, pos.left, pos.top, false);
  }
  function makeDraggable(root){
    const handles = [root.querySelector('.pbj-pin-mini'), root.querySelector('.pbj-pin-head')].filter(Boolean);
    handles.forEach(handle => {
      handle.addEventListener('pointerdown', function(e){
        if (e.target && (e.target.closest('button') || e.target.closest('input') || e.target.closest('a'))) return;
        state.dragging = false;
        const rect = root.getBoundingClientRect();
        const startX = e.clientX, startY = e.clientY;
        const offsetX = startX - rect.left, offsetY = startY - rect.top;
        handle.setPointerCapture && handle.setPointerCapture(e.pointerId);
        function move(ev){
          const dx = Math.abs(ev.clientX - startX), dy = Math.abs(ev.clientY - startY);
          if (dx + dy > 3) state.dragging = true;
          const size = getWidgetSize(root);
          const left = Math.min(Math.max(EDGE_LEFT, ev.clientX - offsetX), Math.max(EDGE_LEFT, window.innerWidth - size.w - EDGE_RIGHT));
          const top = clampTop(ev.clientY - offsetY, size.h);
          root.style.left = left + 'px';
          root.style.top = top + 'px';
          root.style.right = 'auto';
        }
        function up(){
          document.removeEventListener('pointermove', move);
          document.removeEventListener('pointerup', up);
          const r = root.getBoundingClientRect();
          snapToEdge(root, r.left, r.top, true);
          setTimeout(()=>{ state.dragging = false; }, 0);
        }
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up, { once:true });
      });
    });
  }

  function render(){
    let root = document.getElementById('pbj-pin-widget-root');
    if (!root){ root = document.createElement('div'); root.id='pbj-pin-widget-root'; document.body.appendChild(root); }
    if (state.hidden) { root.style.display = 'none'; return; }
    root.style.display = '';
    const data = getData();
    const opdRows = Array.isArray(data.opdRows) ? data.opdRows : [];
    if (!state.selectedOpd){ state.selectedOpd = localStorage.getItem(CONFIG.storageKey) || CONFIG.defaultOpd; }
    const row = getSelectedRow();
    const opd = row ? getOpdName(row) : state.selectedOpd;
    const score = row ? getScore(row) : 0;
    const deg = Math.max(0, Math.min(360, (score / Number(CONFIG.scoreMax || 30))*360));
    const latest = getLatestRapor(opd);

    let providerHtml = `<div class="pbj-pin-empty">Ketik minimal 2 karakter lalu tekan Cari.</div>`;
    if (state.providerLoading) providerHtml = `<div class="pbj-pin-empty">Sedang mencari data penyedia...</div>`;
    else if (state.providerError) providerHtml = `<div class="pbj-pin-empty danger">${esc(state.providerError)}</div>`;
    else if (state.providerSearched && state.q.trim().length >= 2 && !state.providerResults.length) providerHtml = `<div class="pbj-pin-empty">Data tidak ditemukan untuk kata kunci tersebut.</div>`;
    else if (state.providerResults.length) providerHtml = state.providerResults.map(renderProviderCard).join('');

    const opdListHtml = opdRows.map(r => {
      const n = getOpdName(r); const s = getScore(r);
      return `<div class="pbj-pin-opd-item ${norm(n)===norm(opd)?'active':''}" data-opd="${esc(n)}"><div class="pbj-pin-opd-name">${esc(n)}</div><div class="pbj-pin-opd-score">${esc(fmt2(s))}</div></div>`;
    }).join('') || `<div class="pbj-pin-empty">Belum ada data OPD.</div>`;

    const metrics = row ? getDimensions(row).map(metric).join('') : '';
    const latestHtml = latest ? `<button type="button" class="pbj-pin-rapor-link" id="pbj-pin-latest-rapor"><div class="pbj-pin-latest-title">${esc(pick(latest,['nama_opd','opd','Nama OPD'],opd))}</div><div class="pbj-pin-latest-text">Periode ${esc(pick(latest,['bulan','Bulan'],'-'))} ${esc(pick(latest,['tahun','Tahun'],'-'))}. Status QC: ${esc(pick(latest,['status_qc','Status QC'],'-'))}. ID: ${esc(getRaporId(latest) || '-')}</div><div class="pbj-pin-latest-open">Klik untuk buka rapor OPD ini</div></button>` : `<div class="pbj-pin-latest-text">Belum ada rapor terbaru untuk OPD ini.</div>`;

    root.innerHTML = `
      <div class="pbj-pin-mini" style="--pbj-pin-deg:${deg}deg" title="Klik untuk buka/tutup detail. Geser untuk pindah posisi.">
        <button class="pbj-pin-mini-close" type="button" title="Tutup widget" aria-label="Tutup widget">×</button>
        <div class="pbj-pin-mini-score"><span>${esc(fmt2(score))}</span></div>
        <div class="pbj-pin-mini-text"><div class="pbj-pin-mini-kicker">OPD Dipantau</div><div class="pbj-pin-mini-opd">${esc(opd || '-')}</div></div>
      </div>
      <div class="pbj-pin-panel ${state.open ? 'open':''}">
        <div class="pbj-pin-head"><button class="pbj-pin-close" type="button" title="Tutup panel">×</button><div class="pbj-pin-title-small">OPD Dipantau</div><div class="pbj-pin-title">${esc(opd || '-')}</div><div class="pbj-pin-tag">Widget OPD Dipantau</div></div>
        <div class="pbj-pin-tabs"><button class="pbj-pin-tab ${state.tab==='search'?'active':''}" data-tab="search">🔎 Cari Penyedia di Widget</button><button class="pbj-pin-tab ${state.tab==='opd'?'active':''}" data-tab="opd">Cari / Ganti OPD</button></div>
        <div class="pbj-pin-body">
          <div class="pbj-pin-section ${state.tab==='search'?'':'hidden'}" id="pbj-pin-provider-section"><div class="pbj-pin-section-title">Pencarian Penyedia Pengadaan SPSE</div><div class="pbj-pin-row"><input class="pbj-pin-input" id="pbj-pin-provider-q" value="${esc(state.q)}" placeholder="Cari nama penyedia / paket..."><button class="pbj-pin-btn" id="pbj-pin-provider-btn" type="button">Cari</button></div><div class="pbj-pin-provider-results">${providerHtml}</div></div>
          <div class="pbj-pin-section ${state.tab==='opd'?'':'hidden'}"><div class="pbj-pin-section-title">Pilih OPD</div><div class="pbj-pin-row"><input class="pbj-pin-input" id="pbj-pin-opd-filter" placeholder="Cari OPD..."><button class="pbj-pin-btn light" id="pbj-pin-opd-reset" type="button">Reset</button></div><div class="pbj-pin-opd-list">${opdListHtml}</div></div>
          <div class="pbj-pin-section ${state.tab==='search'?'hidden':''}" id="pbj-pin-latest-section"><div class="pbj-pin-section-title">Info Rapor Terbaru</div>${latestHtml}</div>
          <div class="pbj-pin-section ${state.tab==='search'?'hidden':''} ${state.itkpMinimized?'pbj-pin-itkp-collapsed':''}" id="pbj-pin-itkp-section"><div class="pbj-pin-minimize-line"><div class="pbj-pin-section-title" style="margin:0">Ringkasan ITKP</div><button class="pbj-pin-minimize-btn" id="pbj-pin-itkp-toggle" type="button">${state.itkpMinimized?'Tampilkan':'Minimize'}</button></div><div class="pbj-pin-itkp-head"><div class="pbj-pin-circle" style="--pbj-pin-deg:${deg}deg"><div class="pbj-pin-circle-inner"><div class="pbj-pin-circle-kicker">ITKP OPD</div><div class="pbj-pin-circle-score">${esc(fmt2(score))}</div><div class="pbj-pin-circle-max">dari ${esc(CONFIG.scoreMax)} poin</div></div></div><div class="pbj-pin-latest-text">Skor dan indikator OPD yang dipantau.</div></div><div class="pbj-pin-metrics">${metrics || `<div class="pbj-pin-empty">Belum ada rincian ITKP.</div>`}</div></div>
        </div>
      </div>`;
    applyPosition(root);
    bind(root);
    makeDraggable(root);
  }
  function bind(root){
    root.querySelector('.pbj-pin-mini')?.addEventListener('click',()=>{ if (state.dragging) return; state.open=!state.open;render();});
    root.querySelector('.pbj-pin-mini-close')?.addEventListener('click',(e)=>{ e.preventDefault(); e.stopPropagation(); state.hidden=true; render(); });
    root.querySelector('.pbj-pin-close')?.addEventListener('click',()=>{state.open=false;render();});
    root.querySelector('#pbj-pin-latest-rapor')?.addEventListener('click',(e)=>{ e.preventDefault(); e.stopPropagation(); openLatestRapor(getLatestRapor(state.selectedOpd), state.selectedOpd); });
    root.querySelectorAll('.pbj-pin-tab').forEach(btn=>btn.addEventListener('click',()=>{state.tab=btn.dataset.tab;render();}));
    root.querySelector('#pbj-pin-itkp-toggle')?.addEventListener('click',()=>{state.itkpMinimized=!state.itkpMinimized;render();});
    const providerQ = root.querySelector('#pbj-pin-provider-q');
    const search = ()=> runProviderSearch(providerQ ? providerQ.value : '');
    root.querySelector('#pbj-pin-provider-btn')?.addEventListener('click', search);
    providerQ?.addEventListener('keydown', e=>{ if(e.key==='Enter') search(); });
    root.querySelectorAll('.pbj-pin-opd-item').forEach(el=>el.addEventListener('click',()=>{state.selectedOpd=el.dataset.opd||CONFIG.defaultOpd;localStorage.setItem(CONFIG.storageKey,state.selectedOpd);state.tab='opd';render();syncDashboardOpd(state.selectedOpd);}));
    const opdFilter = root.querySelector('#pbj-pin-opd-filter');
    opdFilter?.addEventListener('input',()=>{
      const kw = norm(opdFilter.value);
      root.querySelectorAll('.pbj-pin-opd-item').forEach(item=>{item.style.display = !kw || norm(item.dataset.opd).includes(kw) ? '' : 'none';});
    });
    root.querySelector('#pbj-pin-opd-reset')?.addEventListener('click',()=>{state.selectedOpd=CONFIG.defaultOpd;localStorage.setItem(CONFIG.storageKey,state.selectedOpd);render();syncDashboardOpd(state.selectedOpd);});
  }
  let resizeTimer = null;
  window.addEventListener('resize', function(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function(){
      const root = document.getElementById('pbj-pin-widget-root');
      if (root) { const r = root.getBoundingClientRect(); snapToEdge(root, r.left, r.top, true); }
    }, 120);
  });
  function init(){ render(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.PBJPinWidget = { refresh: render, open:function(){state.hidden=false;state.open=true;render();}, close:function(){state.open=false;render();}, hide:function(){state.hidden=true;render();}, show:function(){state.hidden=false;render();}, search:function(q){state.hidden=false;state.open=true;state.tab='search';render();runProviderSearch(q || state.q || '');} };
  window.PBJ_PIN_WIDGET = window.PBJPinWidget;
})();
