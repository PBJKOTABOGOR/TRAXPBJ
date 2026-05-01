(function(){
  'use strict';

  const APP_CONFIG = {
    userSheet: {
      spreadsheetId: '1DYsqMtvwhPn-IEA3te9fFukD_iMMDRqUNPamktuPz2U',
      gid: '1707469433',
      title: 'USERID'
    },
    tenderSheet: {
      spreadsheetId: '1DYsqMtvwhPn-IEA3te9fFukD_iMMDRqUNPamktuPz2U',
      title: 'SCRAPTENDER'
    },
    nonTenderSheet: {
      spreadsheetId: '1DYsqMtvwhPn-IEA3te9fFukD_iMMDRqUNPamktuPz2U',
      title: 'SCRAPNONTENDER'
    },
    sessionKey: 'pemenang_pengadaan_login_session_v3',
    cacheKey: 'pemenang_pengadaan_dataset_cache_v3',
    cacheTtlMs: 1000 * 60 * 20,
    pageSize: 10,
    xlsxSrc: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
  };

  const state = {
    session: null,
    activeTab: 'dashboard',
    tenderRows: [],
    nonTenderRows: [],
    providerResults: [],
    activeResults: [],
    sortActiveBy: 'deadline',
    loadingData: false,
    dataLoaded: false,
    providerPage: 1,
    activePage: 1,
    providerKeyword: '',
    providerYear: '',
    activeKeyword: '',
    activeJenis: '',
    activePhase: '',
    activeYear: '',
    loadingOverlayVisible: false
  };

  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function normalize(v){return String(v||'').toLowerCase().replace(/\s+/g,' ').replace(/[^\w\s-]/g,'').trim();}
  function parseCsv(text){const rows=[];let row=[],val='',q=false;for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'&&q&&n==='"'){val+='"';i++;continue;}if(c==='"'){q=!q;continue;}if(c===','&&!q){row.push(val);val='';continue;}if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&n==='\n')i++;row.push(val);if(row.some(x=>String(x).trim()!==''))rows.push(row);row=[];val='';continue;}val+=c;}row.push(val);if(row.some(x=>String(x).trim()!==''))rows.push(row);return rows;}
  function matrixToRows(matrix){const headers=matrix.shift()||[];return matrix.map(cells=>{const row={},map={};headers.forEach((h,i)=>{const k=String(h||'').trim();const val=String(cells[i]||'').trim();row[k]=val;map[normalize(k)]=val;});row.__normalized=map;return row;}).filter(r=>Object.values(r.__normalized).some(v=>String(v).trim()!==''));}
  function getField(row,cands){const map=row&&row.__normalized?row.__normalized:{};for(const c of cands){const k=normalize(c);if(Object.prototype.hasOwnProperty.call(map,k)) return map[k];}for(const [k,v] of Object.entries(map)){if(cands.some(c=>k.includes(normalize(c)))) return v;}return '';}
  function toNumber(v){if(v===null||v===undefined)return 0;const raw=String(v).trim();if(!raw||raw==='-')return 0;let s=raw.replace(/rp\.?/gi,'').replace(/\s+/g,'').replace(/[^\d,.-]/g,'');if(s.includes(',')&&s.includes('.')) s=s.replace(/\./g,'').replace(',', '.'); else if(s.includes(',')&&!s.includes('.')) { const p=s.split(','); s=(p.length===2&&p[1].length<=2)?`${p[0]}.${p[1]}`:s.replace(/,/g,''); } else if((s.match(/\./g)||[]).length>1) s=s.replace(/\./g,''); const n=Number(s); return Number.isFinite(n)?n:0;}
  function formatNumber(v){return Math.round(toNumber(v)).toLocaleString('id-ID');}
  function formatMoney(v){const n=toNumber(v); if(n>=1e12)return `Rp ${(n/1e12).toLocaleString('id-ID',{maximumFractionDigits:2})} T`; if(n>=1e9)return `Rp ${(n/1e9).toLocaleString('id-ID',{maximumFractionDigits:2})} M`; if(n>=1e6)return `Rp ${(n/1e6).toLocaleString('id-ID',{maximumFractionDigits:2})} Jt`; return `Rp ${formatNumber(n)}`;}
  function formatDateish(v){const s=String(v||'').trim(); return s||'-';}
  function persistSession(session){state.session=session; localStorage.setItem(APP_CONFIG.sessionKey, JSON.stringify(session));}
  function getStoredSession(){try{const raw=localStorage.getItem(APP_CONFIG.sessionKey);return raw?JSON.parse(raw):null;}catch(e){return null;}}
  function clearSession(){state.session=null; localStorage.removeItem(APP_CONFIG.sessionKey);}  
  function getCache(){try{const raw=sessionStorage.getItem(APP_CONFIG.cacheKey); if(!raw) return null; const parsed=JSON.parse(raw); if(!parsed.at||Date.now()-parsed.at>APP_CONFIG.cacheTtlMs) return null; return parsed;}catch(e){return null;}}
  function setCache(payload){try{sessionStorage.setItem(APP_CONFIG.cacheKey, JSON.stringify({at:Date.now(), ...payload}));}catch(e){}}

  function createLoadingMarkup(){return `<div class="pp-loading-overlay" id="ppLoadingOverlay"><div class="pp-loading-card"><div class="pp-loading-spin"></div><div class="pp-loading-kicker">Pemenang Pengadaan · Loading</div><h4 id="ppLoadingTitle">Menyiapkan portal...</h4><p id="ppLoadingText">Mohon tunggu sebentar, portal sedang memproses data.</p><div class="pp-loading-bar"><span id="ppLoadingBar"></span></div><div class="pp-loading-foot"><strong id="ppLoadingPercent">0%</strong><small id="ppLoadingFootnote">Portal sedang memproses data Anda</small></div></div></div>`;}
  function ensureLoadingOverlay(root){if(root.querySelector('#ppLoadingOverlay')) return; root.insertAdjacentHTML('beforeend', createLoadingMarkup());}
  function showLoading(root, title, text, percent){ensureLoadingOverlay(root); const el=root.querySelector('#ppLoadingOverlay'); el.classList.add('show'); state.loadingOverlayVisible=true; updateLoading(root,title,text,percent);}
  function updateLoading(root, title, text, percent){const p=Math.max(0,Math.min(100, Number(percent||0))); const titleEl=root.querySelector('#ppLoadingTitle'); const textEl=root.querySelector('#ppLoadingText'); const bar=root.querySelector('#ppLoadingBar'); const pct=root.querySelector('#ppLoadingPercent'); if(titleEl&&title) titleEl.textContent=title; if(textEl&&text) textEl.textContent=text; if(bar) bar.style.width=`${p}%`; if(pct) pct.textContent=`${Math.round(p)}%`;}
  function hideLoading(root){const el=root.querySelector('#ppLoadingOverlay'); if(!el) return; updateLoading(root,null,'Data siap ditampilkan.',100); window.setTimeout(()=>{el.classList.remove('show'); state.loadingOverlayVisible=false;}, 220);}
  async function withLoading(root, steps, task){showLoading(root, steps[0]?.title||'Menyiapkan portal...', steps[0]?.text||'Mohon tunggu sebentar.', steps[0]?.percent||5); let i=1; const tick=()=>{ if(i<steps.length){ const s=steps[i]; updateLoading(root, s.title, s.text, s.percent); i+=1; }}; const timer=window.setInterval(tick, 380); try{ const result=await task((title,text,percent)=>updateLoading(root,title,text,percent)); clearInterval(timer); hideLoading(root); return result; }catch(err){ clearInterval(timer); updateLoading(root,'Terjadi kendala saat memuat data','Silakan coba lagi sebentar.',100); window.setTimeout(()=>hideLoading(root),700); throw err; }}

  async function fetchCsvByGid(cfg){const url=`https://docs.google.com/spreadsheets/d/${cfg.spreadsheetId}/gviz/tq?tqx=out:csv&gid=${cfg.gid}&v=${Date.now()}`;const r=await fetch(url,{cache:'no-store'});if(!r.ok) throw new Error(`Gagal mengambil ${cfg.title}. HTTP ${r.status}`);const t=await r.text();if(/googlevisualization|DOCTYPE html|<html/i.test(t.slice(0,300))) throw new Error(`${cfg.title} belum bisa dibaca publik.`);return matrixToRows(parseCsv(t));}
  async function fetchCsvBySheetTitle(cfg){const url=`https://docs.google.com/spreadsheets/d/${cfg.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(cfg.title)}&v=${Date.now()}`;const r=await fetch(url,{cache:'no-store'});if(!r.ok) throw new Error(`Gagal mengambil ${cfg.title}. HTTP ${r.status}`);const t=await r.text();if(/googlevisualization|DOCTYPE html|<html/i.test(t.slice(0,300))) throw new Error(`${cfg.title} belum bisa dibaca publik.`);return matrixToRows(parseCsv(t));}
  async function ensureXlsxLoaded(){ if(window.XLSX) return; await new Promise((resolve,reject)=>{ const s=document.createElement('script'); s.src=APP_CONFIG.xlsxSrc; s.onload=resolve; s.onerror=()=>reject(new Error('Gagal memuat library XLSX.')); document.head.appendChild(s);}); }

  function buildUnifiedRows(){
    const mapOne=(row,jenis)=>({
      sourceJenis:jenis,
      tahun:getField(row,['tahun']),
      kode:getField(row,['kode','kode paket','id paket']),
      namaPaket:getField(row,['nama_paket','nama paket']),
      tahapan:getField(row,['tahapan_list','tahapan','status','tahap proses']),
      pagu:toNumber(getField(row,['pagu'])),
      hps:toNumber(getField(row,['hps'])),
      urlPemenang:getField(row,['url_pemenang']),
      namaPemenang:getField(row,['nama_pemenang','pemenang']),
      npwp:getField(row,['npwp']),
      tanggalPembuktian:getField(row,['tanggal_pembuktian','tanggal_pembu','tanggal pembuktian']),
      tahapPembuatanAktif:getField(row,['tahapan_aktif','tahap aktif','tahap proses','tahapan aktif']),
      tanggalMulai:getField(row,['tanggal_mulai','mulai tahap']),
      tanggalSampai:getField(row,['tanggal_sampai','deadline','tanggal sampai']),
      urlJadwal:getField(row,['url_jadwal']),
      urlPengumuman:getField(row,['url_pengumuman']),
      tanggalScrap:getField(row,['tanggal_scrap']),
      instansi:getField(row,['instansi','kl/pd','instansi/pemda']),
      lpse:getField(row,['lpse','nama lpse','nama_lpse','lpse penyelenggara']),
      satker:getField(row,['satker','satuan kerja']),
      alamat:getField(row,['alamat']),
      lokasi:getField(row,['lokasi','lokasi pekerjaan']),
      peserta:getField(row,['peserta']),
      jenisPengadaan:getField(row,['jenis_pengadaan','jenis pengadaan']),
      metode:getField(row,['metode','metode kualifikasi','metode pengadaan']),
      negosiasi:toNumber(getField(row,['harga_negosiasi','negosiasi'])),
      penawaran:toNumber(getField(row,['harga_penawaran','penawaran'])),
      terkoreksi:toNumber(getField(row,['harga_terkoreksi','terkoreksi']))
    });
    return [...state.tenderRows.map(r=>mapOne(r,'TENDER')),...state.nonTenderRows.map(r=>mapOne(r,'NON TENDER'))];
  }

  async function ensureDataLoaded(root, force){
    if(state.dataLoaded && !force) return;
    if(state.loadingData) return;
    const cache=!force && getCache();
    if(cache && Array.isArray(cache.tenderRows) && Array.isArray(cache.nonTenderRows)){
      state.tenderRows=cache.tenderRows; state.nonTenderRows=cache.nonTenderRows; state.dataLoaded=true; return;
    }
    state.loadingData=true;
    try{
      await withLoading(root,[
        {title:'Menyiapkan koneksi data...', text:'Menghubungkan portal ke spreadsheet utama.', percent:8},
        {title:'Membaca sheet tender...', text:'Mengambil data dari SCRAPTENDER.', percent:34},
        {title:'Membaca sheet non tender...', text:'Mengambil data dari SCRAPNONTENDER.', percent:68},
        {title:'Merapikan struktur dataset...', text:'Menggabungkan data dan menyiapkan tampilan halaman.', percent:88}
      ], async(update)=>{
        const tenderPromise=fetchCsvBySheetTitle(APP_CONFIG.tenderSheet).then(rows=>{ update('Sheet tender berhasil dibaca','Portal sedang menyiapkan data tender.',48); return rows;});
        const nonTenderPromise=fetchCsvBySheetTitle(APP_CONFIG.nonTenderSheet).then(rows=>{ update('Sheet non tender berhasil dibaca','Portal sedang menyiapkan data non tender.',78); return rows;});
        const [tender, nonTender]=await Promise.all([tenderPromise, nonTenderPromise]);
        state.tenderRows=tender; state.nonTenderRows=nonTender; state.dataLoaded=true; setCache({tenderRows:tender, nonTenderRows:nonTender});
        update('Data portal siap','Dataset berhasil dimuat dan siap ditampilkan.',100);
      });
    } finally { state.loadingData=false; }
  }

  function dashboardCounts(){ const rows=buildUnifiedRows(); return { paket:rows.length, lpse:new Set(rows.map(r=>r.lpse).filter(Boolean)).size, instansi:new Set(rows.map(r=>r.instansi).filter(Boolean)).size }; }
  function providerMatches(row,term,tahun){ const hay=[row.namaPemenang,row.namaPaket,row.instansi,row.satker,row.lpse,row.kode,row.npwp].join(' ').toLowerCase(); if(tahun&&String(row.tahun)!==String(tahun)) return false; if(!term) return true; return hay.includes(term.toLowerCase()); }
  function getActiveRows(){ return buildUnifiedRows().filter(r=>{const txt=`${r.tahapan} ${r.tahapPembuatanAktif}`.toLowerCase(); return !/selesai|batal|gagal/.test(txt);}); }
  function sortRows(rows,by){ const arr=[...rows]; if(by==='nilai') arr.sort((a,b)=>(b.pagu||b.hps)-(a.pagu||a.hps)); else if(by==='nama') arr.sort((a,b)=>String(a.namaPaket).localeCompare(String(b.namaPaket),'id')); else if(by==='instansi') arr.sort((a,b)=>String(a.instansi).localeCompare(String(b.instansi),'id')); else arr.sort((a,b)=>String(a.tanggalSampai||'9999').localeCompare(String(b.tanggalSampai||'9999'),'id')); return arr; }
  function paginate(rows,page){ const totalPages=Math.max(1, Math.ceil(rows.length / APP_CONFIG.pageSize)); const safePage=Math.min(Math.max(1,page||1), totalPages); const start=(safePage-1)*APP_CONFIG.pageSize; return {page:safePage, totalPages, start:start+1, end:Math.min(start+APP_CONFIG.pageSize, rows.length), rows:rows.slice(start, start+APP_CONFIG.pageSize)}; }
  function renderPager(kind,paginated,total){ if(!total) return ''; let btns=''; for(let i=1;i<=paginated.totalPages && i<=7;i++){ btns += `<button class="pp-page-btn ${i===paginated.page?'active':''}" type="button" data-pp-page-jump="${kind}:${i}">${i}</button>`; } return `<div class="pp-pager"><div class="pp-pager-info">Menampilkan ${paginated.start}-${paginated.end} dari ${formatNumber(total)} hasil</div><div class="pp-pager-actions"><button class="pp-page-btn" type="button" ${paginated.page<=1?'disabled':''} data-pp-page-nav="${kind}:prev">Prev</button>${btns}<button class="pp-page-btn" type="button" ${paginated.page>=paginated.totalPages?'disabled':''} data-pp-page-nav="${kind}:next">Next</button></div></div>`; }

  function exportRowsToXlsx(rows, filename){
    const data=rows.map(r=>(
      {
        JENIS:r.sourceJenis,
        TAHUN:r.tahun,
        KODE_PAKET:r.kode,
        NAMA_PAKET:r.namaPaket,
        INSTANSI:r.instansi,
        SATKER:r.satker,
        LPSE:r.lpse,
        TAHAPAN:r.tahapPembuatanAktif||r.tahapan,
        PAGU:r.pagu||'',
        HPS:r.hps||'',
        NAMA_PEMENANG:r.namaPemenang,
        NPWP:r.npwp,
        ALAMAT:r.alamat,
        PESERTA:r.peserta,
        METODE:r.metode,
        JENIS_PENGADAAN:r.jenisPengadaan,
        TANGGAL_MULAI:r.tanggalMulai,
        TANGGAL_SAMPAI:r.tanggalSampai,
        URL_PEMENANG:r.urlPemenang,
        URL_JADWAL:r.urlJadwal,
        URL_PENGUMUMAN:r.urlPengumuman
      }
    ));
    const ws=window.XLSX.utils.json_to_sheet(data);
    const wb=window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'DATA');
    window.XLSX.writeFile(wb, filename);
  }

  function renderLogin(){ return `<div class="pp-login-wrap"><div class="pp-login-card" id="ppLoginCard"><div class="pp-login-brand"><span class="pp-kicker">Portal Data Pengadaan</span><h2>Pemenang Pengadaan</h2><p>Akses internal untuk pencarian paket penyedia dan pemantauan paket pengadaan aktif. Login diverifikasi langsung ke sheet USERID yang Anda siapkan.</p><div class="pp-login-stats"><div class="pp-mini-stat"><span>Fitur</span><strong>2 Menu</strong><small>Penyedia dan paket aktif disatukan dalam satu portal premium.</small></div><div class="pp-mini-stat"><span>Sumber</span><strong>2 Sheet</strong><small>SCRAPTENDER dan SCRAPNONTENDER dibaca langsung dari spreadsheet.</small></div><div class="pp-mini-stat"><span>Gaya</span><strong>Premium</strong><small>Layout lebih ringkas, lebih rapi, dan lebih enak dilihat.</small></div></div></div><div class="pp-login-form-wrap"><h3>Masuk ke portal</h3><p class="pp-login-copy">Gunakan user id dan password yang sudah Anda simpan di sheet USERID.</p><form id="ppLoginForm"><label class="pp-field"><span>User ID</span><input class="pp-input" id="ppLoginUser" type="text" placeholder="Masukkan user id" required></label><label class="pp-field"><span>Password</span><input class="pp-input" id="ppLoginPassword" type="password" placeholder="Masukkan password" required></label><button class="pp-login-submit" id="ppLoginSubmit" type="submit">✦ Masuk ke Portal</button><div class="pp-login-error" id="ppLoginError"></div></form><div class="pp-login-note">Kalau login gagal, cek lagi apakah spreadsheet USERID sudah bisa dibaca viewer dan pastikan kolom USERID serta PASSWORD terisi sesuai data yang dipakai saat masuk.</div></div></div></div>`; }
  function setLoginError(root,msg=''){const el=root.querySelector('#ppLoginError'); if(!el) return; el.textContent=msg; el.classList.toggle('show', !!msg);}  
  async function handleLoginSubmit(root,e){ e.preventDefault(); const userId=root.querySelector('#ppLoginUser').value.trim(); const password=root.querySelector('#ppLoginPassword').value; const btn=root.querySelector('#ppLoginSubmit'); if(!userId||!password){setLoginError(root,'User ID dan password wajib diisi.'); return;} setLoginError(root,''); btn.disabled=true; btn.textContent='Memeriksa akses...'; try{ await withLoading(root,[{title:'Memeriksa akses user...',text:'Mencocokkan user id dan password ke sheet USERID.',percent:22}], async(update)=>{ const rows=await fetchCsvByGid(APP_CONFIG.userSheet); update('Memvalidasi kredensial...','Portal sedang mencocokkan data login Anda.',72); const match=rows.find(row=>String(getField(row,['USERID','user id','user'])).trim()===userId && String(getField(row,['PASSWORD','password','pass'])).trim()===password); if(!match) throw new Error('User ID atau password tidak sesuai.'); persistSession({userId,loginAt:Date.now()}); update('Akses berhasil','Menyiapkan dashboard portal Anda.',100); }); renderApp(root); }catch(err){setLoginError(root, err.message||'Login gagal.');} finally{btn.disabled=false; btn.textContent='✦ Masuk ke Portal';} }

  function renderDashboardContent(){ const counts=dashboardCounts(); return `<div class="pp-dashboard-header"><div class="pp-dashboard-top"><div><span class="pp-panel-title">Dashboard Akses · Pengguna</span><h3>Pilih panel kerja</h3><p>Semua fitur utama disusun lebih padat, lebih cepat dibaca, dan langsung siap dipakai tanpa hero kosong yang kebesaran. Fokusnya sekarang ada di fitur inti, bukan sampah visual.</p></div><div class="pp-dashboard-mini"><div class="pp-mini-box"><span>Paket tersedia</span><strong>${formatNumber(counts.paket)}</strong></div><div class="pp-mini-box"><span>LPSE terdaftar</span><strong>${formatNumber(counts.lpse)}</strong></div><div class="pp-mini-box"><span>Instansi</span><strong>${formatNumber(counts.instansi)}</strong></div></div></div></div><div class="pp-feature-grid"><button class="pp-feature-card pp-feature-card--blue" data-pp-tab="provider-search"><div class="pp-feature-icon">🔎</div><div class="pp-feature-copy"><span>Fitur utama</span><h4>Pencarian Paket Penyedia</h4><p>Telusuri profil penyedia, nilai kontrak, sebaran daerah, LPSE, dan daftar paket pemenang.</p></div><div class="pp-feature-arrow">→</div></button><button class="pp-feature-card pp-feature-card--teal" data-pp-tab="active-packages"><div class="pp-feature-icon">📦</div><div class="pp-feature-copy"><span>Monitoring aktif</span><h4>Paket Pengadaan Aktif</h4><p>Cari paket aktif berdasarkan nama paket, instansi, satker, atau LPSE. Lengkap dengan filter jenis paket dan tahap proses.</p></div><div class="pp-feature-arrow">→</div></button></div><div class="pp-disclaimer" id="ppDisclaimer"><button class="pp-disclaimer-toggle" id="ppDisclaimerToggle" type="button"><div class="pp-disclaimer-left"><div class="pp-disclaimer-badge">!</div><div><strong>Sumber Data & Disclaimer</strong><small>Panel informasi sumber data portal</small></div></div><div class="pp-disclaimer-caret">⌄</div></button><div class="pp-disclaimer-body"><div class="pp-disclaimer-grid"><div class="pp-disclaimer-box"><h5>Sumber data utama</h5><ul><li>Sheet <b>USERID</b> untuk validasi login.</li><li>Sheet <b>SCRAPTENDER</b> untuk data tender.</li><li>Sheet <b>SCRAPNONTENDER</b> untuk data non tender.</li></ul></div><div class="pp-disclaimer-box"><h5>Catatan penggunaan</h5><ul><li>Portal menampilkan data sesuai hasil spreadsheet yang Anda kelola.</li><li>Pembaruan data tidak selalu real time.</li><li>Keputusan penting tetap sebaiknya dikonfirmasi ke sumber resmi.</li></ul></div></div></div></div>`; }

  function renderProviderSearch(){ const years=[...new Set(buildUnifiedRows().map(r=>r.tahun).filter(Boolean))].sort((a,b)=>String(b).localeCompare(String(a))); const paginated=paginate(state.providerResults, state.providerPage); return `<div class="pp-section-card"><div class="pp-section-head"><div><span class="pp-panel-title" style="background:#edf4ff;border-color:#dbe4f0;color:#17427d;">Analisis penyedia</span><h3>Pencarian Paket Penyedia</h3><p>Cari nama penyedia dari data tender dan non tender, lalu buka detail identitas paket, profil pemenang, dan tautan SPSE.</p></div><button class="pp-export-btn" id="ppExportProviderBtn" type="button">Export XLSX</button></div><div class="pp-filter-grid"><label class="pp-search-box"><span>Kata kunci penyedia</span><input class="pp-search-input" id="ppProviderKeyword" value="${esc(state.providerKeyword)}" placeholder="Cari nama penyedia, paket, instansi, satker, LPSE, NPWP..."></label><label class="pp-select-box"><span>Tahun</span><select class="pp-select" id="ppProviderYear"><option value="">Semua tahun</option>${years.map(y=>`<option value="${esc(y)}" ${String(state.providerYear)===String(y)?'selected':''}>${esc(y)}</option>`).join('')}</select></label><div></div><div></div><button class="pp-action-button" id="ppProviderSearchBtn" type="button">Cari Penyedia</button></div><div class="pp-summary-strip"><div class="pp-summary-box"><span>Total data sumber</span><strong>${formatNumber(buildUnifiedRows().length)}</strong></div><div class="pp-summary-box"><span>Sheet tender</span><strong>${formatNumber(state.tenderRows.length)}</strong></div><div class="pp-summary-box"><span>Sheet non tender</span><strong>${formatNumber(state.nonTenderRows.length)}</strong></div><div class="pp-summary-box"><span>Hasil saat ini</span><strong>${formatNumber(state.providerResults.length)}</strong></div></div>${renderPager('provider', paginated, state.providerResults.length)}<div class="pp-result-list">${paginated.rows.length?paginated.rows.map((r,i)=>renderPackageCard(r, (paginated.start-1)+i, true)).join(''):`<div class="pp-empty">Masukkan kata kunci penyedia lalu klik <b>Cari Penyedia</b>.</div>`}</div>${renderPager('provider', paginated, state.providerResults.length)}</div>`; }
  function renderActivePackages(){ const rows=state.activeResults; const paginated=paginate(rows, state.activePage); const years=[...new Set(buildUnifiedRows().map(r=>r.tahun).filter(Boolean))].sort((a,b)=>String(b).localeCompare(String(a))); const phases=[...new Set(getActiveRows().map(r=>r.tahapPembuatanAktif||r.tahapan).filter(Boolean))].sort(); return `<div class="pp-section-card"><div class="pp-section-head"><div><span class="pp-panel-title" style="background:#ecfffb;border-color:#d1f6ef;color:#0f766e;">Monitoring aktif</span><h3>Paket Pengadaan Aktif</h3><p>Daftar paket aktif sekarang lebih rapat, lebih kebaca, dan langsung ada filter untuk nama paket, instansi, satker, LPSE, jenis paket, tahap proses, serta tahun.</p></div><button class="pp-export-btn" id="ppExportActiveBtn" type="button">Export XLSX</button></div><div class="pp-filter-grid"><label class="pp-search-box"><span>Pencarian umum</span><input class="pp-search-input" id="ppActiveKeyword" value="${esc(state.activeKeyword)}" placeholder="Cari nama paket, instansi, satker, atau LPSE..."></label><label class="pp-select-box"><span>Jenis paket</span><select class="pp-select" id="ppActiveJenis"><option value="">Semua</option><option value="TENDER" ${state.activeJenis==='TENDER'?'selected':''}>Tender</option><option value="NON TENDER" ${state.activeJenis==='NON TENDER'?'selected':''}>Non Tender</option></select></label><label class="pp-select-box"><span>Tahap proses</span><select class="pp-select" id="ppActivePhase"><option value="">Semua tahap</option>${phases.map(p=>`<option value="${esc(p)}" ${state.activePhase===p?'selected':''}>${esc(p)}</option>`).join('')}</select></label><label class="pp-select-box"><span>Tahun</span><select class="pp-select" id="ppActiveYear"><option value="">Semua tahun</option>${years.map(y=>`<option value="${esc(y)}" ${String(state.activeYear)===String(y)?'selected':''}>${esc(y)}</option>`).join('')}</select></label><button class="pp-action-button" id="ppActiveSearchBtn" type="button">Cari Paket</button></div><div class="pp-summary-strip"><div class="pp-summary-box"><span>Total aktif</span><strong>${formatNumber(getActiveRows().length)}</strong></div><div class="pp-summary-box"><span>Hasil ditemukan</span><strong>${formatNumber(rows.length)}</strong></div><div class="pp-summary-box"><span>Dengan pemenang</span><strong>${formatNumber(rows.filter(r=>r.namaPemenang).length)}</strong></div><div class="pp-summary-box"><span>Nilai pagu</span><strong>${formatMoney(rows.reduce((t,r)=>t+(r.pagu||0),0))}</strong></div></div><div class="pp-toolbar"><div class="pp-sort-group"><span>Urutkan</span><button class="pp-sort-btn ${state.sortActiveBy==='deadline'?'active':''}" data-pp-sort="deadline" type="button">Deadline</button><button class="pp-sort-btn ${state.sortActiveBy==='nilai'?'active':''}" data-pp-sort="nilai" type="button">Nilai</button><button class="pp-sort-btn ${state.sortActiveBy==='nama'?'active':''}" data-pp-sort="nama" type="button">Nama</button><button class="pp-sort-btn ${state.sortActiveBy==='instansi'?'active':''}" data-pp-sort="instansi" type="button">Instansi</button></div></div>${renderPager('active', paginated, rows.length)}<div class="pp-result-list">${paginated.rows.length?paginated.rows.map((r,i)=>renderPackageCard(r, (paginated.start-1)+i, false)).join(''):`<div class="pp-empty">Belum ada hasil. Gunakan filter lalu klik <b>Cari Paket</b>.</div>`}</div>${renderPager('active', paginated, rows.length)}</div>`; }

  function renderPackageCard(row, idx, providerMode){ const title=row.namaPaket||'-'; const phase=row.tahapPembuatanAktif||row.tahapan||'-'; const detailId=`pp-detail-${providerMode?'p':'a'}-${idx}`; const toneClass=row.sourceJenis==='NON TENDER'?'pp-package-card--teal':'pp-package-card--blue'; return `<article class="pp-package-card ${toneClass}" data-detail-card="${detailId}"><div class="pp-package-main"><div class="pp-package-top"><div class="pp-package-title-wrap"><div class="pp-badges"><span class="pp-badge pp-badge--blue">${esc(row.sourceJenis)}</span>${phase&&phase!=='-'?`<span class="pp-badge pp-badge--gold">${esc(phase)}</span>`:''}${row.namaPemenang?`<span class="pp-badge pp-badge--teal">Dengan pemenang</span>`:''}</div><h4 class="pp-package-title">${esc(title)}</h4><div class="pp-package-meta"><span>${esc(row.instansi||'-')}</span><span>${esc(row.satker||'-')}</span><span>${esc(row.lpse||'-')}</span></div></div><div class="pp-package-side"><div class="pp-side-card"><span>${providerMode?'Nilai HPS':'Nilai Pagu'}</span><strong>${formatMoney(providerMode?(row.hps||row.pagu):(row.pagu||row.hps))}</strong></div></div></div><div class="pp-package-grid"><div class="pp-meta-tile"><span>Pemenang</span><strong>${esc(row.namaPemenang||'-')}</strong></div><div class="pp-meta-tile"><span>NPWP</span><strong>${esc(row.npwp||'-')}</strong></div><div class="pp-meta-tile"><span>Mulai</span><strong>${esc(formatDateish(row.tanggalMulai||row.tanggalPembuktian))}</strong></div><div class="pp-meta-tile"><span>Sampai / Deadline</span><strong>${esc(formatDateish(row.tanggalSampai))}</strong></div></div></div><div class="pp-package-actions"><div class="pp-link-row">${row.urlPemenang?`<a class="pp-link-pill" href="${esc(row.urlPemenang)}" target="_blank" rel="noopener noreferrer">Pemenang</a>`:''}${row.urlJadwal?`<a class="pp-link-pill" href="${esc(row.urlJadwal)}" target="_blank" rel="noopener noreferrer">Jadwal</a>`:''}${row.urlPengumuman?`<a class="pp-link-pill" href="${esc(row.urlPengumuman)}" target="_blank" rel="noopener noreferrer">Pengumuman</a>`:''}</div><button class="pp-detail-toggle" type="button" data-detail-toggle="${detailId}">Lihat detail lengkap</button></div><div class="pp-package-detail" id="${detailId}"><div class="pp-detail-grid"><div class="pp-detail-box"><h5>Identitas Paket</h5><div class="pp-detail-list"><span>Kode Paket</span><strong>${esc(row.kode||'-')}</strong><span>Jenis Pengadaan</span><strong>${esc(row.jenisPengadaan||row.sourceJenis||'-')}</strong><span>Metode</span><strong>${esc(row.metode||'-')}</strong><span>Instansi</span><strong>${esc(row.instansi||'-')}</strong><span>Satuan Kerja</span><strong>${esc(row.satker||'-')}</strong><span>LPSE</span><strong>${esc(row.lpse||'-')}</strong><span>Lokasi</span><strong>${esc(row.lokasi||'-')}</strong><span>Peserta</span><strong>${esc(row.peserta||'-')}</strong><span>Tahap Aktif</span><strong>${esc(phase)}</strong></div></div><div class="pp-detail-box"><h5>Profil Pemenang</h5><div class="pp-provider-profile"><strong>${esc(row.namaPemenang||'-')}</strong><div><b>Alamat</b><br>${esc(row.alamat||'-')}</div><div><b>NPWP</b><br>${esc(row.npwp||'-')}</div><div><b>Nilai Penawaran</b><br>${row.penawaran?formatMoney(row.penawaran):'-'}</div><div><b>Nilai Terkoreksi</b><br>${row.terkoreksi?formatMoney(row.terkoreksi):'-'}</div><div><b>Nilai Negosiasi</b><br>${row.negosiasi?formatMoney(row.negosiasi):'-'}</div></div></div></div></div></article>`; }

  function renderApp(root){ const loginView=root.querySelector('#ppLoginView'); const appView=root.querySelector('#ppAppView'); loginView.classList.add('pp-hidden'); appView.classList.remove('pp-hidden'); const content = `<div class="pp-shell"><div class="pp-app-topbar"><div class="pp-app-title"><div class="pp-app-logo"></div><div><h2>Pemenang Pengadaan</h2><p>Portal internal pencarian penyedia & paket aktif</p></div></div><div class="pp-app-actions"><div class="pp-user-pill">${esc(state.session?.userId||'-')}</div><button class="pp-top-button" type="button" data-pp-tab="dashboard">Dashboard</button><button class="pp-top-button pp-top-button--danger" type="button" id="ppLogoutBtn">Keluar</button></div></div><div class="pp-tabs"><button class="pp-tab ${state.activeTab==='dashboard'?'active':''}" data-pp-tab="dashboard" type="button">Dashboard</button><button class="pp-tab ${state.activeTab==='provider-search'?'active':''}" data-pp-tab="provider-search" type="button">Pencarian Paket Penyedia</button><button class="pp-tab ${state.activeTab==='active-packages'?'active':''}" data-pp-tab="active-packages" type="button">Paket Pengadaan Aktif</button></div><div class="pp-page ${state.activeTab==='dashboard'?'active':''}" data-pp-page="dashboard">${renderDashboardContent()}</div><div class="pp-page ${state.activeTab==='provider-search'?'active':''}" data-pp-page="provider-search">${renderProviderSearch()}</div><div class="pp-page ${state.activeTab==='active-packages'?'active':''}" data-pp-page="active-packages">${renderActivePackages()}</div></div>`; appView.innerHTML=content; bindApp(root); }

  async function runProviderSearch(root){ state.providerPage=1; await withLoading(root,[{title:'Menyiapkan pencarian penyedia...',text:'Menyaring data tender dan non tender sesuai kata kunci.',percent:25},{title:'Merapikan hasil pencarian...',text:'Menyusun kartu hasil dan menyiapkan halaman pertama.',percent:78}], async(update)=>{ await ensureDataLoaded(root); const term=state.providerKeyword; const tahun=state.providerYear; state.providerResults=buildUnifiedRows().filter(r=>providerMatches(r,term,tahun)); update('Hasil pencarian siap','Menampilkan 10 data pertama agar lebih cepat dibaca.',100); }); renderApp(root); }
  async function runActiveSearch(root){ state.activePage=1; await withLoading(root,[{title:'Menyiapkan paket aktif...',text:'Memfilter data aktif sesuai nama paket, instansi, satker, dan LPSE.',percent:24},{title:'Mengurutkan hasil aktif...',text:'Menyiapkan halaman pertama agar tampil lebih cepat.',percent:82}], async(update)=>{ await ensureDataLoaded(root); const kw=state.activeKeyword.trim().toLowerCase(); const jenis=state.activeJenis; const phase=state.activePhase; const tahun=state.activeYear; let rows=getActiveRows().filter(r=>{ const hay=[r.namaPaket,r.instansi,r.satker,r.lpse].join(' ').toLowerCase(); if(kw && !hay.includes(kw)) return false; if(jenis && r.sourceJenis!==jenis) return false; const phaseVal=r.tahapPembuatanAktif||r.tahapan||''; if(phase && phaseVal!==phase) return false; if(tahun && String(r.tahun)!==String(tahun)) return false; return true; }); state.activeResults=sortRows(rows,state.sortActiveBy); update('Paket aktif siap','Menampilkan 10 data pertama agar loading terasa lebih ringan.',100); }); renderApp(root); }
  async function runExport(root, rows, filename){ await withLoading(root,[{title:'Menyiapkan export XLSX...',text:'Portal sedang menyiapkan file spreadsheet.',percent:28},{title:'Menyusun workbook...',text:'Mohon tunggu sebentar, file sedang dibuat.',percent:76}], async(update)=>{ await ensureXlsxLoaded(); exportRowsToXlsx(rows, filename); update('Export selesai','File XLSX berhasil dibuat.',100); }); }

  function bindApp(root){ const appView=root.querySelector('#ppAppView'); const logoutBtn=appView.querySelector('#ppLogoutBtn'); if(logoutBtn) logoutBtn.addEventListener('click', ()=>{clearSession(); state.activeTab='dashboard'; state.providerResults=[]; state.activeResults=[]; state.providerPage=1; state.activePage=1; mount(root);}); appView.querySelectorAll('[data-pp-tab]').forEach(btn=>btn.addEventListener('click', async ()=>{ const next=btn.dataset.ppTab; state.activeTab=next; renderApp(root); if(next==='provider-search' && !state.dataLoaded){ await ensureDataLoaded(root); renderApp(root);} if(next==='active-packages' && !state.dataLoaded){ await ensureDataLoaded(root); renderApp(root);} })); const dToggle=appView.querySelector('#ppDisclaimerToggle'); if(dToggle) dToggle.addEventListener('click', ()=>{appView.querySelector('#ppDisclaimer').classList.toggle('open');}); const pBtn=appView.querySelector('#ppProviderSearchBtn'); if(pBtn){ pBtn.addEventListener('click', ()=>{ state.providerKeyword=appView.querySelector('#ppProviderKeyword').value.trim(); state.providerYear=appView.querySelector('#ppProviderYear').value; runProviderSearch(root); }); }
    const aBtn=appView.querySelector('#ppActiveSearchBtn'); if(aBtn){ aBtn.addEventListener('click', ()=>{ state.activeKeyword=appView.querySelector('#ppActiveKeyword').value.trim(); state.activeJenis=appView.querySelector('#ppActiveJenis').value; state.activePhase=appView.querySelector('#ppActivePhase').value; state.activeYear=appView.querySelector('#ppActiveYear').value; runActiveSearch(root); }); }
    const expP=appView.querySelector('#ppExportProviderBtn'); if(expP) expP.addEventListener('click', ()=>runExport(root, state.providerResults, 'pencarian_paket_penyedia.xlsx'));
    const expA=appView.querySelector('#ppExportActiveBtn'); if(expA) expA.addEventListener('click', ()=>runExport(root, state.activeResults, 'paket_pengadaan_aktif.xlsx'));
    appView.querySelectorAll('[data-pp-sort]').forEach(btn=>btn.addEventListener('click', ()=>{state.sortActiveBy=btn.dataset.ppSort; state.activeResults=sortRows(state.activeResults,state.sortActiveBy); renderApp(root);}));
    appView.querySelectorAll('[data-detail-toggle]').forEach(btn=>btn.addEventListener('click', ()=>{ const id=btn.dataset.detailToggle; const card=appView.querySelector(`[data-detail-card="${id}"]`); if(card){ card.classList.toggle('open'); btn.textContent=card.classList.contains('open')?'Tutup detail':'Lihat detail lengkap'; } }));
    appView.querySelectorAll('[data-pp-page-nav]').forEach(btn=>btn.addEventListener('click', ()=>{ const [kind, dir]=btn.dataset.ppPageNav.split(':'); if(kind==='provider'){ const max=Math.max(1, Math.ceil(state.providerResults.length/APP_CONFIG.pageSize)); state.providerPage=Math.min(max, Math.max(1, state.providerPage+(dir==='next'?1:-1))); } else { const max=Math.max(1, Math.ceil(state.activeResults.length/APP_CONFIG.pageSize)); state.activePage=Math.min(max, Math.max(1, state.activePage+(dir==='next'?1:-1))); } renderApp(root); }));
    appView.querySelectorAll('[data-pp-page-jump]').forEach(btn=>btn.addEventListener('click', ()=>{ const [kind, page]=btn.dataset.ppPageJump.split(':'); if(kind==='provider') state.providerPage=Number(page); else state.activePage=Number(page); renderApp(root); }));
  }

  function mount(root){ root.querySelector('#ppLoginView').innerHTML=renderLogin(); root.querySelector('#ppAppView').innerHTML=''; root.querySelector('#ppLoginView').classList.remove('pp-hidden'); root.querySelector('#ppAppView').classList.add('pp-hidden'); ensureLoadingOverlay(root); const form=root.querySelector('#ppLoginForm'); form.addEventListener('submit', handleLoginSubmit.bind(null,root)); const session=getStoredSession(); if(session){ state.session=session; renderApp(root); ensureDataLoaded(root).then(()=>renderApp(root)); } }

  window.__moduleInit = function({container}){ const root = container.querySelector('#ppModuleRoot') || container; mount(root); return function destroy(){}; };
})();
