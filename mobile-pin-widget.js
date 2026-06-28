/* Floating OPD pin widget for SIPPBJ.
   Requires optional window.PBJ_PIN_CONFIG.
   This revision: when Search Penyedia tab is active, Info Rapor and Ringkasan ITKP are hidden. */
(function(){
  if (window.__PBJ_PIN_WIDGET_LOADED__) return;
  window.__PBJ_PIN_WIDGET_LOADED__ = true;

  const CONFIG = Object.assign({
    defaultOpd: 'PEMERINTAH KOTA BOGOR',
    scoreMax: 30,
    storageKey: 'pbj_pin_selected_opd',
    dataProvider: function(){
      return {
        opdRows: window.itkpRows || window.ITKP_ROWS || window.dashboardRows || window.DASHBOARD_ROWS || [],
        raporRows: window.raporRows || window.RAPOR_ROWS || window.indexRapotRows || window.INDEX_RAPOT_ROWS || [],
        providerRows: window.providerRows || window.PROVIDER_ROWS || window.pemenangRows || window.PEMENANG_ROWS || window.allProviderRows || []
      };
    }
  }, window.PBJ_PIN_CONFIG || {});

  const state = { selectedOpd:'', open:false, tab:'search', itkpMinimized:false, q:'', providerResults:[] };

  function esc(v){return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function norm(v){return String(v||'').toLowerCase().replace(/\s+/g,' ').trim();}
  function num(v){
    if (typeof v === 'number') return isNaN(v) ? 0 : v;
    let s = String(v ?? '').trim();
    if (!s) return 0;
    const hasComma = s.includes(','), hasDot = s.includes('.');
    s = s.replace(/Rp/gi,'').replace(/%/g,'').replace(/\s/g,'');
    if (hasComma && hasDot) s = s.replace(/\./g,'').replace(',', '.');
    else if (hasComma) s = s.replace(',', '.');
    s = s.replace(/[^\d.-]/g,'');
    const n = Number(s);
    return isNaN(n) ? 0 : n;
  }
  function fmt2(v){return new Intl.NumberFormat('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2}).format(num(v));}
  function fmtMoney(v){
    const n = num(v);
    if (n >= 1e12) return 'Rp ' + new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(n/1e12) + ' T';
    if (n >= 1e9) return 'Rp ' + new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(n/1e9) + ' M';
    if (n >= 1e6) return 'Rp ' + new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(n/1e6) + ' Jt';
    return 'Rp ' + new Intl.NumberFormat('id-ID',{maximumFractionDigits:0}).format(n);
  }
  function pick(row, keys, def){
    if (!row) return def;
    for (const k of keys){
      if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') return row[k];
      const found = Object.keys(row).find(x => norm(x) === norm(k));
      if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') return row[found];
    }
    return def;
  }
  function getData(){
    try { return CONFIG.dataProvider() || {}; }
    catch(e){ return {}; }
  }
  function getOpdName(row){return String(pick(row,['nama_opd','nama_satker','satker','opd','Nama OPD','Satuan Kerja'],'')||'').trim();}
  function getScore(row){return num(pick(row,['nilai_itkp','skor_itkp','score','itkp','Total Skor','SKOR ITKP'],0));}
  function getSelectedRow(){
    const data = getData();
    const rows = Array.isArray(data.opdRows) ? data.opdRows : [];
    const selected = norm(state.selectedOpd || CONFIG.defaultOpd);
    return rows.find(r => norm(getOpdName(r)) === selected) || rows.find(r => norm(getOpdName(r)).includes(selected) || selected.includes(norm(getOpdName(r)))) || rows[0] || null;
  }
  function getLatestRapor(opd){
    const data = getData();
    const rows = Array.isArray(data.raporRows) ? data.raporRows : [];
    const nOpd = norm(opd);
    const list = rows.filter(r => norm(pick(r,['nama_opd','opd','Nama OPD'],'')).includes(nOpd) || nOpd.includes(norm(pick(r,['nama_opd','opd','Nama OPD'],''))));
    list.sort((a,b)=> String(pick(b,['updated_at','created_at','tanggal','timestamp'],'')).localeCompare(String(pick(a,['updated_at','created_at','tanggal','timestamp'],''))));
    return list[0] || null;
  }
  function metric(row, label, aKeys, bKeys, maxKeys){
    const a = num(pick(row,aKeys,0));
    const b = num(pick(row,bKeys,maxKeys ? pick(row,maxKeys,0) : 0));
    const pct = b ? Math.min(100, (a/b)*100) : 0;
    return `<div class="pbj-pin-metric"><div class="pbj-pin-metric-head"><span>${esc(label)}</span><span>${esc(new Intl.NumberFormat('id-ID').format(a))}/${esc(new Intl.NumberFormat('id-ID').format(b))}</span></div><div class="pbj-pin-bar"><div class="pbj-pin-bar-fill" style="width:${pct}%"></div></div></div>`;
  }
  function getProviderName(row){return String(pick(row,['pemenang','nama_penyedia','penyedia','Nama Penyedia','Pemenang'],'-')||'-').trim();}
  function getProviderPackage(row){return String(pick(row,['nama_paket','paket','Nama Paket'],'-')||'-').trim();}
  function providerSearchRows(q){
    const data = getData();
    const rows = Array.isArray(data.providerRows) ? data.providerRows : [];
    const kw = norm(q);
    if (kw.length < 2) return [];
    return rows.filter(r => {
      const hay = [getProviderName(r), getProviderPackage(r), pick(r,['instansi','nama_opd','satker','lpse','kategori','metode_pengadaan'],'')].join(' ');
      return norm(hay).includes(kw);
    }).slice(0, 30);
  }
  function renderProviderCard(row){
    const name = getProviderName(row);
    const paket = getProviderPackage(row);
    const meta = [pick(row,['tahun','Tahun'],''), pick(row,['instansi','nama_opd','satker','Instansi'],''), pick(row,['status','status_paket','Status Paket'],'')].filter(Boolean).join(' · ');
    const nilai = pick(row,['nilai','nilai_pagu','nilai_kontrak','kontrak','pagu','Nilai'],0);
    return `<div class="pbj-pin-provider-card"><div class="pbj-pin-provider-name">${esc(name)}</div><div class="pbj-pin-provider-package">${esc(paket)}</div><div class="pbj-pin-provider-meta">${esc(meta || '-')}</div><span class="pbj-pin-provider-value">${esc(fmtMoney(nilai))}</span></div>`;
  }
  function render(){
    let root = document.getElementById('pbj-pin-widget-root');
    if (!root){ root = document.createElement('div'); root.id='pbj-pin-widget-root'; document.body.appendChild(root); }
    const data = getData();
    const opdRows = Array.isArray(data.opdRows) ? data.opdRows : [];
    if (!state.selectedOpd){ state.selectedOpd = localStorage.getItem(CONFIG.storageKey) || CONFIG.defaultOpd; }
    const row = getSelectedRow();
    const opd = row ? getOpdName(row) : state.selectedOpd;
    const score = row ? getScore(row) : 0;
    const deg = Math.max(0, Math.min(360, (score / Number(CONFIG.scoreMax || 30))*360));
    const latest = getLatestRapor(opd);
    const providerHtml = state.providerResults.length ? state.providerResults.map(renderProviderCard).join('') : `<div class="pbj-pin-empty">Ketik minimal 2 karakter lalu tekan Cari.</div>`;
    const opdListHtml = opdRows.map(r => {
      const n = getOpdName(r); const s = getScore(r);
      return `<div class="pbj-pin-opd-item ${norm(n)===norm(opd)?'active':''}" data-opd="${esc(n)}"><div class="pbj-pin-opd-name">${esc(n)}</div><div class="pbj-pin-opd-score">${esc(fmt2(s))}</div></div>`;
    }).join('') || `<div class="pbj-pin-empty">Belum ada data OPD.</div>`;
    const metrics = row ? [
      metric(row,'SiRUP',['sirup_nilai','sirup_terisi','sirup_score'],['sirup_target','sirup_total','sirup_max']),
      metric(row,'Toko Daring',['toko_daring_nilai','toko_daring_terisi','toko_score'],['toko_daring_target','toko_daring_total','toko_max']),
      metric(row,'e-Purchasing',['epurchasing_nilai','epurchasing_terisi','epurchasing_score'],['epurchasing_target','epurchasing_total','epurchasing_max']),
      metric(row,'e-Tendering',['etendering_nilai','etendering_terisi','etendering_score'],['etendering_target','etendering_total','etendering_max']),
      metric(row,'e-Kontrak',['ekontrak_nilai','ekontrak_terisi','ekontrak_score'],['ekontrak_target','ekontrak_total','ekontrak_max']),
      metric(row,'Non eTendering / Non ePurchasing',['nonetendering_nilai','nonetendering_terisi','non_score'],['nonetendering_target','nonetendering_total','non_max'])
    ].join('') : '';

    root.innerHTML = `
      <div class="pbj-pin-mini" style="--pbj-pin-deg:${deg}deg" title="Klik untuk buka widget">
        <div class="pbj-pin-mini-score"><span>${esc(fmt2(score))}</span></div>
        <div class="pbj-pin-mini-text"><div class="pbj-pin-mini-kicker">OPD Dipantau</div><div class="pbj-pin-mini-opd">${esc(opd || '-')}</div></div>
      </div>
      <div class="pbj-pin-panel ${state.open ? 'open':''}">
        <div class="pbj-pin-head"><button class="pbj-pin-close" type="button">×</button><div class="pbj-pin-title-small">OPD Dipantau</div><div class="pbj-pin-title">${esc(opd || '-')}</div><div class="pbj-pin-tag">Widget OPD Dipantau</div></div>
        <div class="pbj-pin-tabs"><button class="pbj-pin-tab ${state.tab==='search'?'active':''}" data-tab="search">🔎 Cari Penyedia di Widget</button><button class="pbj-pin-tab ${state.tab==='opd'?'active':''}" data-tab="opd">Cari / Ganti OPD</button></div>
        <div class="pbj-pin-body">
          <div class="pbj-pin-section ${state.tab==='search'?'':'hidden'}" id="pbj-pin-provider-section"><div class="pbj-pin-section-title">Pencarian Penyedia Pengadaan SPSE</div><div class="pbj-pin-row"><input class="pbj-pin-input" id="pbj-pin-provider-q" value="${esc(state.q)}" placeholder="Cari nama penyedia / paket..."><button class="pbj-pin-btn" id="pbj-pin-provider-btn" type="button">Cari</button></div><div class="pbj-pin-provider-results">${providerHtml}</div></div>
          <div class="pbj-pin-section ${state.tab==='opd'?'':'hidden'}"><div class="pbj-pin-section-title">Pilih OPD</div><div class="pbj-pin-row"><input class="pbj-pin-input" id="pbj-pin-opd-filter" placeholder="Cari OPD..."><button class="pbj-pin-btn light" id="pbj-pin-opd-reset" type="button">Reset</button></div><div class="pbj-pin-opd-list">${opdListHtml}</div></div>
          <div class="pbj-pin-section ${state.tab==='search'?'hidden':''}" id="pbj-pin-latest-section"><div class="pbj-pin-section-title">Info Rapor Terbaru</div>${latest ? `<div class="pbj-pin-latest-title">Rapor ${esc(pick(latest,['nama_opd','opd'],'OPD'))}</div><div class="pbj-pin-latest-text">Periode ${esc(pick(latest,['bulan','Bulan'],'-'))} ${esc(pick(latest,['tahun','Tahun'],'-'))}. Status QC: <b>${esc(pick(latest,['status_qc','Status QC'],'-'))}</b>. ID: ${esc(pick(latest,['id_rapot','ID Rapot'],'-'))}</div>` : `<div class="pbj-pin-empty">Belum ada rapor terbaru untuk OPD ini.</div>`}</div>
          <div class="pbj-pin-section ${state.tab==='search'?'hidden':''} ${state.itkpMinimized?'pbj-pin-itkp-collapsed':''}" id="pbj-pin-itkp-section"><div class="pbj-pin-minimize-line"><div class="pbj-pin-section-title" style="margin:0">Ringkasan ITKP</div><button class="pbj-pin-minimize-btn" id="pbj-pin-itkp-toggle" type="button">${state.itkpMinimized?'Tampilkan':'Minimize'}</button></div><div class="pbj-pin-itkp-head"><div class="pbj-pin-circle" style="--pbj-pin-deg:${deg}deg"><div class="pbj-pin-circle-inner"><div class="pbj-pin-circle-kicker">ITKP OPD</div><div class="pbj-pin-circle-score">${esc(fmt2(score))}</div><div class="pbj-pin-circle-max">dari ${esc(CONFIG.scoreMax)} poin</div></div></div><div class="pbj-pin-latest-text">Skor dan indikator OPD yang dipantau.</div></div><div class="pbj-pin-metrics">${metrics || `<div class="pbj-pin-empty">Belum ada rincian ITKP.</div>`}</div></div>
        </div>
      </div>`;
    bind(root);
  }
  function bind(root){
    root.querySelector('.pbj-pin-mini')?.addEventListener('click',()=>{state.open=true;render();});
    root.querySelector('.pbj-pin-close')?.addEventListener('click',()=>{state.open=false;render();});
    root.querySelectorAll('.pbj-pin-tab').forEach(btn=>btn.addEventListener('click',()=>{state.tab=btn.dataset.tab;render();}));
    root.querySelector('#pbj-pin-itkp-toggle')?.addEventListener('click',()=>{state.itkpMinimized=!state.itkpMinimized;render();});
    const providerQ = root.querySelector('#pbj-pin-provider-q');
    const search = ()=>{ state.q = providerQ ? providerQ.value : ''; state.providerResults = providerSearchRows(state.q); render(); };
    root.querySelector('#pbj-pin-provider-btn')?.addEventListener('click', search);
    providerQ?.addEventListener('keydown', e=>{ if(e.key==='Enter') search(); });
    root.querySelectorAll('.pbj-pin-opd-item').forEach(el=>el.addEventListener('click',()=>{state.selectedOpd=el.dataset.opd||CONFIG.defaultOpd;localStorage.setItem(CONFIG.storageKey,state.selectedOpd);state.tab='opd';render();try{window.dispatchEvent(new CustomEvent('pbj-pin-opd-changed',{detail:{opd:state.selectedOpd}}));}catch(e){}}));
    const opdFilter = root.querySelector('#pbj-pin-opd-filter');
    opdFilter?.addEventListener('input',()=>{
      const kw = norm(opdFilter.value);
      root.querySelectorAll('.pbj-pin-opd-item').forEach(item=>{item.style.display = !kw || norm(item.dataset.opd).includes(kw) ? '' : 'none';});
    });
    root.querySelector('#pbj-pin-opd-reset')?.addEventListener('click',()=>{state.selectedOpd=CONFIG.defaultOpd;localStorage.setItem(CONFIG.storageKey,state.selectedOpd);render();});
  }
  function init(){ render(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.PBJPinWidget = { refresh: render, open:function(){state.open=true;render();}, close:function(){state.open=false;render();} };
})();
