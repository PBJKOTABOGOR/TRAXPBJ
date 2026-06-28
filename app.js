(function(){
  const CONFIG = {
    defaultOpd: 'PEMERINTAH KOTA BOGOR',
    scoreMax: 30,
    cacheMs: 1000 * 60 * 15,
    sheets: {
      itkp: { id:'18SSLHINReP4mpMYLFhFGVGjsbspQSs0xHZ4weSjvE3A', gid:'1217577518' },
      rapor: { id:'1ccDgtXNATxSYMZuDgd3polvRiTFNiFnjIGMP7b9qmrU', sheet:'INDEX_RAPOT' },
      provider: { id:'1DYsqMtvwhPn-IEA3te9fFukD_iMMDRqUNPamktuPz2U', sheet:'PORTAL_PENYEDIA' }
    }
  };

  const els = {};
  const state = {
    opdRows: [], raporRows: [], providerRows: [], providerResults: [],
    selectedOpd: localStorage.getItem('pbj_widget_opd') || CONFIG.defaultOpd,
    currentTab: 'opd', itkpMinimized: false, closed: false, deferredInstall: null
  };

  function $(id){ return document.getElementById(id); }
  function esc(v){return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function norm(v){return String(v||'').toLowerCase().replace(/\s+/g,' ').trim();}
  function compact(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'').trim();}
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
  function fmt2(v){ return new Intl.NumberFormat('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2}).format(num(v)); }
  function fmt0(v){ return new Intl.NumberFormat('id-ID',{maximumFractionDigits:0}).format(num(v)); }
  function money(v){
    const n = num(v);
    if (!n) return 'Rp 0';
    if (n >= 1e12) return 'Rp ' + new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(n/1e12) + ' T';
    if (n >= 1e9) return 'Rp ' + new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(n/1e9) + ' M';
    if (n >= 1e6) return 'Rp ' + new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(n/1e6) + ' Jt';
    return 'Rp ' + fmt0(n);
  }
  function pick(row, keys, def=''){
    if (!row) return def;
    for (const k of keys){
      if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') return row[k];
      const want = compact(k);
      const found = Object.keys(row).find(x => compact(x) === want);
      if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') return row[found];
    }
    return def;
  }
  function getSatker(row){ return pick(row, ['nama_satker','satker','nama_opd','opd','satuan_kerja','nama satuan kerja','Nama Satker']); }
  function isCity(name){ const n = norm(name); return n === 'pemerintah kota bogor' || n === 'kota bogor' || n === 'pemkot bogor'; }

  function csvUrl(src){
    const base = `https://docs.google.com/spreadsheets/d/${src.id}/gviz/tq?tqx=out:csv`;
    const q = src.gid ? `&gid=${encodeURIComponent(src.gid)}` : `&sheet=${encodeURIComponent(src.sheet)}`;
    return base + q + '&v=' + Date.now();
  }
  async function fetchCsv(src, cacheKey){
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { const obj = JSON.parse(cached); if (Date.now() - obj.t < CONFIG.cacheMs) return obj.rows || []; } catch(e){}
    }
    const res = await fetch(csvUrl(src));
    if (!res.ok) throw new Error('Gagal membaca spreadsheet');
    const text = await res.text();
    if (/^\s*<!doctype|^\s*<html/i.test(text)) throw new Error('Spreadsheet belum publik');
    const rows = parseCsv(text);
    localStorage.setItem(cacheKey, JSON.stringify({t:Date.now(), rows}));
    return rows;
  }
  function parseCsv(text){
    const rows=[]; let row=[], cur='', q=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i], nx=text[i+1];
      if(q){ if(ch==='"' && nx==='"'){cur+='"'; i++;} else if(ch==='"'){q=false;} else cur+=ch; }
      else { if(ch==='"') q=true; else if(ch===','){row.push(cur); cur='';} else if(ch==='\n'){row.push(cur); rows.push(row); row=[]; cur='';} else if(ch!=='\r') cur+=ch; }
    }
    row.push(cur); rows.push(row);
    const headers=(rows.shift()||[]).map(h=>String(h||'').trim());
    return rows.filter(r=>r.some(c=>String(c||'').trim()!=='')).map(r=>{
      const o={}; headers.forEach((h,i)=>o[h||`col_${i}`]=r[i]??''); return o;
    });
  }

  function buildProfile(row){
    if (!row) return null;
    const score = num(pick(row, [
      'Nilai ITKP Indikator Pemanfaatan Sistem - skor maksimal 30 (point)',
      'Nilai ITKP - Pemanfaatan Sistem - skor maksimal 30 (point)',
      'Nilai ITKP Pemanfaatan Sistem - skor maksimal 30 (point)',
      'Nilai ITKP Pemanfaatan Sistem','Nilai ITKP','Skor ITKP','skor_itkp'
    ]));
    const items = [
      {key:'sirup', title:'SiRUP', cls:'', value:num(pick(row,['Nilai ITKP - skor maksimal 10 (point) (SIRUP)','SIRUP','sirup'])), max:10, sub:formatPair(row, ['Pagu Pengadaan','Pagu SiRUP','total_pagu_sirup'], ['Pagu Terumumkan','Pagu Terumumkan SiRUP','pagu_terumumkan_sirup'])},
      {key:'toko', title:'Toko Daring', cls:'toko', value:num(pick(row,['Nilai ITKP - skor maksimal 1 (point) (Toko Daring)','Toko Daring','toko_daring'])), max:1, sub:formatPair(row, ['Transaksi Toko Daring','Jumlah Toko Daring','toko_daring_realisasi'], ['Target Toko Daring','toko_daring_target'])},
      {key:'ep', title:'e-Purchasing', cls:'ep', value:num(pick(row,['Nilai ITKP - skor maksimal 4 (point) (Epurchasing)','Epurchasing','ePurchasing','e-Purchasing'])), max:4, sub:formatPair(row, ['Paket ePurchasing','Paket e-Purchasing','epurchasing_paket'], ['Total Paket ePurchasing','Total Paket e-Purchasing','epurchasing_total'])},
      {key:'et', title:'e-Tendering', cls:'et', value:num(pick(row,['Nilai ITKP - skor maksimal 5 (point) (etendering)','eTendering','e-Tendering'])), max:5, sub:formatPair(row, ['Paket eTendering','Paket e-Tendering','etendering_paket'], ['Total Paket eTendering','Total Paket e-Tendering','etendering_total'])},
      {key:'ko', title:'e-Kontrak', cls:'ko', value:num(pick(row,['Nilai ITKP - skor maksimal 5 (point) (ekontrak)','eKontrak','e-Kontrak'])), max:5, sub:formatPair(row, ['Paket eKontrak','Paket e-Kontrak','ekontrak_paket'], ['Total Paket eKontrak','Total Paket e-Kontrak','ekontrak_total'])},
      {key:'ne', title:'Non eTendering / Non ePurchasing', cls:'ne', value:num(pick(row,['Nilai ITKP - skor maksimal 5 (point) (Non etendering & Non ePurchasing)','Non etendering','Non ePurchasing','Non Tender'])), max:5, sub:formatPair(row, ['Nilai Non eTendering','Pagu Non eTendering','Non etendering'], ['Target Non eTendering','Pagu Non eTendering Target'])}
    ];
    return { name:getSatker(row), score, items };
  }
  function formatPair(row, leftKeys, rightKeys){
    const a = pick(row, leftKeys, ''); const b = pick(row, rightKeys, '');
    if (a === '' && b === '') return '';
    const isMoney = String(a+b).toLowerCase().includes('rp') || num(a) > 100000 || num(b) > 100000;
    const fa = isMoney ? money(a) : fmt0(a);
    const fb = isMoney ? money(b) : fmt0(b);
    return `${fa} / ${fb}`;
  }
  function getSelectedProfile(){
    const exact = state.opdRows.find(r => norm(getSatker(r)) === norm(state.selectedOpd));
    const city = state.opdRows.find(r => isCity(getSatker(r)));
    return buildProfile(exact || city || state.opdRows[0] || null) || {name:state.selectedOpd,score:0,items:[]};
  }

  async function loadData(force){
    if (force) Object.keys(localStorage).filter(k=>k.startsWith('pbj_widget_cache_')).forEach(k=>localStorage.removeItem(k));
    setLoading(true);
    try{
      const [itkp, rapor, provider] = await Promise.all([
        fetchCsv(CONFIG.sheets.itkp, 'pbj_widget_cache_itkp'),
        fetchCsv(CONFIG.sheets.rapor, 'pbj_widget_cache_rapor').catch(()=>[]),
        fetchCsv(CONFIG.sheets.provider, 'pbj_widget_cache_provider').catch(()=>[])
      ]);
      state.opdRows = itkp;
      state.raporRows = rapor;
      state.providerRows = provider;
      if (!state.opdRows.some(r => norm(getSatker(r)) === norm(state.selectedOpd))) state.selectedOpd = getSatker(state.opdRows.find(r => isCity(getSatker(r))) || state.opdRows[0] || {}) || CONFIG.defaultOpd;
      renderAll();
      checkRaporNotification();
    }catch(err){
      els.opdList.innerHTML = `<div class="empty">Data belum bisa dibaca. Pastikan spreadsheet publik.<br>${esc(err.message||err)}</div>`;
      els.itkpSummary.innerHTML = `<div class="empty">Gagal memuat ITKP.</div>`;
    }finally{ setLoading(false); }
  }
  function setLoading(v){ document.body.classList.toggle('loading', !!v); }

  function renderAll(){ renderHeader(); renderOpdList(); renderItkp(); renderRapor(); }
  function renderHeader(){
    const p = getSelectedProfile(); const pct = Math.max(0, Math.min(100, p.score / CONFIG.scoreMax * 100));
    els.selectedOpdTitle.textContent = p.name || state.selectedOpd;
    els.heroOpdName.textContent = p.name || state.selectedOpd;
    els.scoreValue.textContent = fmt2(p.score);
    els.scoreRing.style.setProperty('--pct', pct + '%');
    els.miniScore.textContent = fmt2(p.score);
    els.miniOpd.textContent = p.name || state.selectedOpd;
    localStorage.setItem('pbj_widget_opd', p.name || state.selectedOpd);
  }
  function renderOpdList(){
    const q = norm(els.opdSearch.value);
    const rows = state.opdRows.filter(r => !q || norm(getSatker(r)).includes(q)).slice(0,80);
    els.opdList.innerHTML = rows.map(r=>{
      const p=buildProfile(r); const active = norm(p.name)===norm(state.selectedOpd);
      return `<button class="opd-item ${active?'active':''}" data-opd="${esc(p.name)}" type="button"><span class="opd-name">${esc(p.name)}</span><span class="opd-score">${fmt2(p.score)}</span></button>`;
    }).join('') || '<div class="empty">OPD tidak ditemukan.</div>';
  }
  function renderItkp(){
    const p = getSelectedProfile();
    if (state.itkpMinimized) {
      els.itkpSummary.innerHTML = `<div class="info-card">Ringkasan ITKP diminimize. <button class="ghost-btn" id="btnShowItkp" type="button">Tampilkan</button></div>`;
      $('btnShowItkp').onclick = () => { state.itkpMinimized=false; renderItkp(); };
      return;
    }
    els.itkpSummary.innerHTML = `<div class="itkp-card"><div class="itkp-layout"><div class="score-ring" style="--pct:${Math.max(0,Math.min(100,p.score/30*100))}%"><div class="ring-inner"><small>ITKP OPD</small><strong>${fmt2(p.score)}</strong><span>dari 30 poin</span></div></div><div><b>Skor dan indikator OPD yang dipantau.</b><p class="hint">${esc(p.name || '')}</p></div></div><div class="bar-list">${(p.items||[]).map(metricHtml).join('')}</div></div>`;
  }
  function metricHtml(m){
    const pct = m.max ? Math.max(0, Math.min(100, (m.value/m.max)*100)) : 0;
    const sub = m.sub || `${fmt0(m.value)} / ${fmt0(m.max)}`;
    return `<div class="metric"><div class="metric-head"><span class="metric-title">${esc(m.title)}</span><span class="metric-val">${fmt0(m.value)}/${fmt0(m.max)}</span></div><div class="track"><div class="fill ${esc(m.cls)}" style="width:${pct}%"></div></div><div class="metric-sub">${esc(sub)}</div></div>`;
  }
  function latestRapor(){
    const sel = norm(state.selectedOpd);
    const rows = state.raporRows.filter(r => norm(pick(r,['nama_opd','opd','satker'])).includes(sel) || sel.includes(norm(pick(r,['nama_opd','opd','satker']))));
    rows.sort((a,b)=> String(pick(b,['updated_at','created_at','qc_at'])).localeCompare(String(pick(a,['updated_at','created_at','qc_at']))));
    return rows[0] || null;
  }
  function renderRapor(){
    const r = latestRapor();
    if (!r){ els.raporInfo.innerHTML = 'Belum ada rapor terbaru untuk OPD ini.'; return; }
    const month = pick(r,['bulan'], '-'), year = pick(r,['tahun'], '-'), id = pick(r,['id_rapot'], '-'), status = pick(r,['status_qc'], '-');
    els.raporInfo.innerHTML = `<div class="rapor-line"><b>Rapor ${esc(pick(r,['nama_opd'],'OPD'))}</b><br>Periode ${esc(month)} ${esc(year)}. Status QC: <b>${esc(status)}</b>. ID: <b>${esc(id)}</b></div>`;
  }

  function activateTab(tab){
    state.currentTab = tab;
    document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
    document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active', p.id === 'panel-' + tab));
  }
  function packageType(row){
    const txt = norm([pick(row,['SUMBER','sumber','sumber_transaksi']), pick(row,['METODE_PEMILIHAN','metode_pengadaan','metode']), pick(row,['KATEGORI','kategori']), pick(row,['JENIS','jenis'])].join(' '));
    if (/katalog|e-purchasing|epurchasing|ekatalog/.test(txt)) return {label:'e-Katalog', cls:'ekatalog'};
    if (/tender|seleksi/.test(txt) && !/non/.test(txt)) return {label:'Tender', cls:'tender'};
    return {label:'Non Tender', cls:'nontender'};
  }
  function searchProvider(){
    const q = norm(els.providerKeyword.value);
    if (q.length < 2){ els.providerHint.textContent = 'Ketik minimal 2 karakter lalu tekan Cari.'; els.providerResults.innerHTML=''; return; }
    const terms = q.split(' ').filter(Boolean);
    const rows = state.providerRows.filter(r => {
      const hay = norm(Object.values(r).join(' '));
      return terms.every(t => hay.includes(t));
    }).slice(0,30);
    els.providerHint.textContent = `${rows.length} hasil ditemukan.`;
    els.providerResults.innerHTML = rows.map(providerCard).join('') || '<div class="empty">Tidak ada hasil.</div>';
  }
  function providerCard(r){
    const t = packageType(r);
    const title = pick(r,['NAMA_PAKET','nama_paket','Nama Paket','paket'], '-');
    const penyedia = pick(r,['PEMENANG','pemenang','NAMA_PENYEDIA','nama_penyedia','penyedia'], 'Penyedia belum tersedia');
    const instansi = pick(r,['INSTANSI','instansi','KLPD','klpd'], '-');
    const satker = pick(r,['SATKER','satker','nama_satker'], '');
    const tahun = pick(r,['TAHUN','tahun'], '-');
    const status = pick(r,['STATUS','status','TAHAP_AKTIF','tahap_aktif'], '-');
    const nilai = pick(r,['NILAI','nilai','PAGU','pagu','HPS','hps','NILAI_KONTRAK','nilai_kontrak'], 0);
    return `<article class="pkg-card"><span class="badge ${t.cls}">${t.label}</span><div class="pkg-top"><div><div class="pkg-title">${esc(title)}</div><div class="pkg-meta">${esc(tahun)} · ${esc(instansi)} ${satker? '· '+esc(satker):''} · ${esc(status)}</div></div><div class="pkg-value">${money(nilai)}</div></div><div class="pkg-winner">Pemenang: ${esc(penyedia)}</div><div class="pkg-actions">${linkButton(r,'Pengumuman',['LINK_PENGUMUMAN','link_pengumuman','url_pengumuman'])}${linkButton(r,'Jadwal',['LINK_JADWAL','link_jadwal','url_jadwal'])}${linkButton(r,'Pemenang',['LINK_PEMENANG','link_pemenang','url_pemenang'])}${linkButton(r,'Kontrak',['LINK_KONTRAK','link_kontrak','url_kontrak'])}</div></article>`;
  }
  function linkButton(r,label,keys){ const url = pick(r, keys, ''); return url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${label}</a>` : `<span>${label}</span>`; }

  function closeWidget(){ state.closed=true; els.widgetCard.classList.add('hidden'); els.miniPin.classList.remove('hidden'); }
  function openWidget(){ state.closed=false; els.widgetCard.classList.remove('hidden'); els.miniPin.classList.add('hidden'); }
  function setupDrag(){
    let sx=0, sy=0, ox=0, oy=0, dragging=false;
    function start(e){ if (window.matchMedia('(display-mode: standalone)').matches) return; dragging=true; const p=e.touches?e.touches[0]:e; sx=p.clientX; sy=p.clientY; const r=els.widgetCard.getBoundingClientRect(); ox=r.left; oy=r.top; els.widgetCard.style.position='fixed'; els.widgetCard.style.margin='0'; els.widgetCard.style.zIndex='10'; document.addEventListener('mousemove',move); document.addEventListener('mouseup',end); document.addEventListener('touchmove',move,{passive:false}); document.addEventListener('touchend',end); }
    function move(e){ if(!dragging)return; const p=e.touches?e.touches[0]:e; if(e.cancelable)e.preventDefault(); const x=Math.max(4,Math.min(window.innerWidth-els.widgetCard.offsetWidth-4, ox+p.clientX-sx)); const y=Math.max(4,Math.min(window.innerHeight-els.widgetCard.offsetHeight-4, oy+p.clientY-sy)); els.widgetCard.style.left=x+'px'; els.widgetCard.style.top=y+'px'; localStorage.setItem('pbj_widget_pos', JSON.stringify({x,y})); }
    function end(){ dragging=false; document.removeEventListener('mousemove',move); document.removeEventListener('mouseup',end); document.removeEventListener('touchmove',move); document.removeEventListener('touchend',end); }
    els.dragHandle.addEventListener('mousedown',start); els.dragHandle.addEventListener('touchstart',start,{passive:true});
    try{ const pos=JSON.parse(localStorage.getItem('pbj_widget_pos')||'null'); if(pos){ els.widgetCard.style.position='fixed'; els.widgetCard.style.margin='0'; els.widgetCard.style.left=pos.x+'px'; els.widgetCard.style.top=pos.y+'px'; els.widgetCard.style.zIndex='10'; }}catch(e){}
  }
  async function enableNotifications(){
    if (!('Notification' in window)){ alert('Browser ini belum mendukung notifikasi.'); return; }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') new Notification('Widget OPD Dipantau aktif', { body:'Notifikasi rapor terbaru akan muncul untuk OPD yang dipilih.', icon:'./icons/icon-192.png' });
  }
  function checkRaporNotification(){
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const r = latestRapor(); if(!r) return;
    const id = pick(r,['id_rapot'],''); if(!id) return;
    const key = 'pbj_widget_last_rapor_' + compact(state.selectedOpd);
    const old = localStorage.getItem(key);
    if (old && old !== id) new Notification('Rapor OPD terbaru', { body:`${state.selectedOpd}: ${id} · Status ${pick(r,['status_qc'],'-')}`, icon:'./icons/icon-192.png' });
    localStorage.setItem(key, id);
  }

  function init(){
    ['widgetCard','dragHandle','btnCloseTop','btnCloseBottom','miniPin','selectedOpdTitle','heroOpdName','scoreValue','scoreRing','miniScore','miniOpd','opdSearch','opdList','itkpSummary','raporInfo','providerKeyword','btnProviderSearch','providerHint','providerResults','btnNotify','btnRefresh','btnInstall','btnMinimizeItkp'].forEach(id=>els[id]=$(id));
    document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>activateTab(b.dataset.tab)));
    els.opdSearch.addEventListener('input', renderOpdList);
    els.opdList.addEventListener('click', e=>{ const btn=e.target.closest('[data-opd]'); if(!btn)return; state.selectedOpd=btn.dataset.opd; localStorage.setItem('pbj_widget_opd', state.selectedOpd); renderAll(); activateTab('itkp'); checkRaporNotification(); });
    els.btnProviderSearch.addEventListener('click', searchProvider);
    els.providerKeyword.addEventListener('keydown', e=>{ if(e.key==='Enter') searchProvider(); });
    els.btnNotify.addEventListener('click', enableNotifications);
    els.btnRefresh.addEventListener('click', ()=>loadData(true));
    els.btnCloseTop.addEventListener('click', closeWidget); els.btnCloseBottom.addEventListener('click', closeWidget); els.miniPin.addEventListener('click', openWidget);
    els.btnMinimizeItkp.addEventListener('click', ()=>{ state.itkpMinimized=!state.itkpMinimized; els.btnMinimizeItkp.textContent=state.itkpMinimized?'Tampilkan':'Minimize'; renderItkp(); });
    window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); state.deferredInstall=e; els.btnInstall.hidden=false; });
    els.btnInstall.addEventListener('click', async()=>{ if(state.deferredInstall){ state.deferredInstall.prompt(); state.deferredInstall=null; els.btnInstall.hidden=true; } });
    setupDrag();
    loadData(false);
  }
  document.addEventListener('DOMContentLoaded', init);
})();
