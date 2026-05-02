(function(){
  'use strict';

  const APP_CONFIG = {
    spreadsheetId: '1DYsqMtvwhPn-IEA3te9fFukD_iMMDRqUNPamktuPz2U',
    userSheet: { gid: '1707469433', title: 'USERID' },
    providerSheet: { title: 'PORTAL_PENYEDIA' },
    activeSheet: { title: 'PORTAL_AKTIF' },
    ecatSheet: { title: 'PORTAL_EKATALOG' },
    sessionKey: 'pemenang_pengadaan_login_session_v4',
    pageSize: 10
  };

  const state = {
    session: null,
    activeTab: 'dashboard',
    providerRowsRaw: [],
    activeRowsRaw: [],
    ecatRowsRaw: [],
    providerResults: [],
    activeResults: [],
    ecatResults: [],
    providerPage: 1,
    activePage: 1,
    ecatPage: 1,
    providerQuery: '',
    activeQuery: '',
    ecatQuery: '',
    sortActiveBy: 'deadline',
    loadingData: false,
    dataLoaded: false,
    loadingOverlayVisible: false
  };

  function esc(v){return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function normalize(v){return String(v || '').toLowerCase().replace(/\s+/g,' ').replace(/[^\w\s-]/g,'').trim();}
  function delay(ms){return new Promise(r=>setTimeout(r, ms));}

  function parseCsv(text){
    const rows=[]; let row=[], val='', q=false;
    for(let i=0;i<text.length;i++){
      const c=text[i], n=text[i+1];
      if(c==='"' && q && n==='"'){ val+='"'; i++; continue; }
      if(c==='"'){ q=!q; continue; }
      if(c===',' && !q){ row.push(val); val=''; continue; }
      if((c==='\n' || c==='\r') && !q){
        if(c==='\r' && n==='\n') i++;
        row.push(val);
        if(row.some(x=>String(x).trim()!=='')) rows.push(row);
        row=[]; val='';
        continue;
      }
      val+=c;
    }
    row.push(val);
    if(row.some(x=>String(x).trim()!=='')) rows.push(row);
    return rows;
  }

  function matrixToRows(matrix){
    const headers = matrix.shift() || [];
    return matrix.map(cells=>{
      const row = {};
      const map = {};
      headers.forEach((h,i)=>{
        const key = String(h || '').trim();
        const val = String(cells[i] || '').trim();
        row[key] = val;
        map[normalize(key)] = val;
      });
      row.__normalized = map;
      return row;
    }).filter(r=>Object.values(r.__normalized).some(v=>String(v).trim()!==''));
  }

  function getField(row, candidates){
    const map = row && row.__normalized ? row.__normalized : {};
    for(const c of candidates){
      const key = normalize(c);
      if(Object.prototype.hasOwnProperty.call(map, key)) return map[key];
    }
    for(const [key,val] of Object.entries(map)){
      if(candidates.some(c=>key.includes(normalize(c)))) return val;
    }
    return '';
  }

  function toNumber(v){
    if(v===null || v===undefined) return 0;
    const raw = String(v).trim();
    if(!raw || raw==='-') return 0;
    let s = raw.replace(/rp\.?/gi,'').replace(/\s+/g,'').replace(/[^\d,.-]/g,'');
    if(s.includes(',') && s.includes('.')) s = s.replace(/\./g,'').replace(',', '.');
    else if(s.includes(',') && !s.includes('.')){
      const parts = s.split(',');
      s = (parts.length===2 && parts[1].length<=2) ? `${parts[0]}.${parts[1]}` : s.replace(/,/g,'');
    } else if((s.match(/\./g)||[]).length>1){
      s = s.replace(/\./g,'');
    }
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  function formatNumber(v){ return Math.round(toNumber(v)).toLocaleString('id-ID'); }
  function formatMoney(v){
    const n = toNumber(v);
    if(n >= 1e12) return `Rp ${(n/1e12).toLocaleString('id-ID',{maximumFractionDigits:2})} T`;
    if(n >= 1e9) return `Rp ${(n/1e9).toLocaleString('id-ID',{maximumFractionDigits:2})} M`;
    if(n >= 1e6) return `Rp ${(n/1e6).toLocaleString('id-ID',{maximumFractionDigits:2})} Jt`;
    return `Rp ${formatNumber(n)}`;
  }
  function formatDateish(v){ const s = String(v || '').trim(); return s || '-'; }

  function persistSession(session){ state.session = session; localStorage.setItem(APP_CONFIG.sessionKey, JSON.stringify(session)); }
  function getStoredSession(){ try{ const raw = localStorage.getItem(APP_CONFIG.sessionKey); return raw ? JSON.parse(raw) : null; }catch(_){ return null; } }
  function clearSession(){ state.session = null; localStorage.removeItem(APP_CONFIG.sessionKey); }

  function ensureLoadingStyles(){
    if(document.getElementById('ppLoadingStyle')) return;
    const style = document.createElement('style');
    style.id = 'ppLoadingStyle';
    style.textContent = `
      .pp-loading-overlay{position:fixed;inset:0;background:rgba(238,243,251,.52);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:24px;opacity:0;pointer-events:none;transition:opacity .22s ease}
      .pp-loading-overlay.show{opacity:1;pointer-events:auto}
      .pp-loading-card{position:relative;overflow:hidden}
      .pp-loading-overlay[data-mode="progress"] .pp-loading-card{width:min(100%,360px);border-radius:26px;padding:18px;background:linear-gradient(135deg,#102a56 0%, #173d79 48%, #285ea8 78%, #1f8d8f 100%);color:#fff;box-shadow:0 24px 60px rgba(20,54,111,.28);border:1px solid rgba(255,255,255,.16)}
      .pp-loading-overlay[data-mode="progress"] .pp-loading-card:before{content:'';position:absolute;inset:0;background:linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);background-size:22px 22px;pointer-events:none}
      .pp-loading-overlay[data-mode="simple"] .pp-loading-card{width:min(100%,300px);border-radius:22px;padding:18px 20px;background:rgba(255,255,255,.96);border:1px solid rgba(21,55,104,.08);box-shadow:0 24px 70px rgba(16,42,86,.16);color:#16355f;text-align:center}
      .pp-loading-ring{width:38px;height:38px;border-radius:999px;border:3px solid rgba(255,255,255,.28);border-top-color:#fff;animation:ppSpin .8s linear infinite;margin-bottom:10px}
      .pp-loading-overlay[data-mode="simple"] .pp-loading-ring{margin:0 auto 12px;border-color:rgba(55,104,181,.16);border-top-color:#3c73c5;width:34px;height:34px}
      .pp-loading-kicker{display:inline-flex;min-height:24px;align-items:center;padding:0 10px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      .pp-loading-overlay[data-mode="simple"] .pp-loading-kicker{display:none}
      .pp-loading-title{margin:10px 0 6px;font-size:18px;font-weight:950;line-height:1.12}
      .pp-loading-text{font-size:12px;line-height:1.55;color:rgba(255,255,255,.82)}
      .pp-loading-overlay[data-mode="simple"] .pp-loading-title{margin:0 0 6px;font-size:28px;font-weight:950;letter-spacing:-.03em;color:#173862}
      .pp-loading-overlay[data-mode="simple"] .pp-loading-text{color:#5f728e;font-size:13px;line-height:1.65}
      .pp-loading-track{margin-top:12px;height:8px;border-radius:999px;background:rgba(255,255,255,.16);overflow:hidden}
      .pp-loading-bar{height:100%;width:0%;border-radius:inherit;background:linear-gradient(90deg,#fff,#8de8db);box-shadow:0 0 16px rgba(255,255,255,.28);transition:width .22s ease}
      .pp-loading-row{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:8px}
      .pp-loading-percent{font-size:14px;font-weight:950}
      .pp-loading-note{font-size:11px;font-weight:800;color:rgba(255,255,255,.78)}
      .pp-loading-overlay[data-mode="simple"] .pp-loading-track,.pp-loading-overlay[data-mode="simple"] .pp-loading-row{display:none}
      @keyframes ppSpin{to{transform:rotate(360deg)}}`;
    document.head.appendChild(style);
  }

  function getLoadingOverlay(){
    ensureLoadingStyles();
    let el = document.getElementById('ppLoadingOverlay');
    if(el) return el;
    el = document.createElement('div');
    el.id = 'ppLoadingOverlay';
    el.className = 'pp-loading-overlay';
    el.dataset.mode = 'simple';
    el.innerHTML = '<div class="pp-loading-card"><div class="pp-loading-ring"></div><div class="pp-loading-kicker" id="ppLoadingKicker">Pemenang Pengadaan</div><div class="pp-loading-title" id="ppLoadingTitle">Menyiapkan halaman...</div><div class="pp-loading-text" id="ppLoadingText">Tunggu sebentar.</div><div class="pp-loading-track"><div class="pp-loading-bar" id="ppLoadingBar"></div></div><div class="pp-loading-row"><div class="pp-loading-percent" id="ppLoadingPercent">0%</div><div class="pp-loading-note" id="ppLoadingNote">Sedang diproses</div></div></div>';
    document.body.appendChild(el);
    return el;
  }

  function showProgressLoading(progress,title,text,kicker='Pemenang Pengadaan'){
    const el = getLoadingOverlay();
    el.dataset.mode = 'progress';
    el.querySelector('#ppLoadingKicker').textContent = kicker;
    el.querySelector('#ppLoadingTitle').textContent = title;
    el.querySelector('#ppLoadingText').textContent = text;
    el.querySelector('#ppLoadingBar').style.width = `${Math.max(0, Math.min(100, progress))}%`;
    el.querySelector('#ppLoadingPercent').textContent = `${Math.round(progress)}%`;
    el.querySelector('#ppLoadingNote').textContent = progress >= 100 ? 'Selesai' : 'Sedang diproses';
    el.classList.add('show');
    state.loadingOverlayVisible = true;
  }
  function updateProgressLoading(progress,title,text,kicker='Pemenang Pengadaan'){ showProgressLoading(progress,title,text,kicker); }
  function showSimpleLoading(title,text){
    const el = getLoadingOverlay();
    el.dataset.mode = 'simple';
    el.querySelector('#ppLoadingTitle').textContent = title;
    el.querySelector('#ppLoadingText').textContent = text;
    el.classList.add('show');
    state.loadingOverlayVisible = true;
  }
  function updateSimpleLoading(title,text){ showSimpleLoading(title,text); }
  function hideLoading(){ const el = getLoadingOverlay(); el.classList.remove('show'); state.loadingOverlayVisible = false; }

  async function fetchCsvByGid(cfg){
    const url = `https://docs.google.com/spreadsheets/d/${APP_CONFIG.spreadsheetId}/gviz/tq?tqx=out:csv&gid=${cfg.gid}&v=${Date.now()}`;
    const r = await fetch(url,{cache:'no-store'});
    if(!r.ok) throw new Error(`Gagal mengambil ${cfg.title}. HTTP ${r.status}`);
    const t = await r.text();
    if(/googlevisualization|DOCTYPE html|<html/i.test(t.slice(0,300))) throw new Error(`${cfg.title} belum bisa dibaca.`);
    return matrixToRows(parseCsv(t));
  }
  async function fetchCsvBySheetTitle(cfg){
    const url = `https://docs.google.com/spreadsheets/d/${APP_CONFIG.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(cfg.title)}&v=${Date.now()}`;
    const r = await fetch(url,{cache:'no-store'});
    if(!r.ok) throw new Error(`Gagal mengambil ${cfg.title}. HTTP ${r.status}`);
    const t = await r.text();
    if(/googlevisualization|DOCTYPE html|<html/i.test(t.slice(0,300))) throw new Error(`${cfg.title} belum bisa dibaca.`);
    return matrixToRows(parseCsv(t));
  }

  function mapPortalRow(row, fallbackSource=''){
    const source = (getField(row,['sumber']) || fallbackSource || getField(row,['jenis sumber']) || '-').toUpperCase();
    const tahap = getField(row,['tahap_aktif','tahapan_aktif','tahap aktif','status paket','status']);
    return {
      sourceJenis: source,
      tahun: getField(row,['tahun']),
      kode: getField(row,['kode_paket','kode paket','kode']),
      namaPaket: getField(row,['nama_paket','nama paket','nama produk']),
      instansi: getField(row,['instansi']),
      satker: getField(row,['satker','satuan kerja']),
      lpse: getField(row,['lpse']),
      namaPemenang: getField(row,['nama_pemenang','nama pemenang']),
      npwp: getField(row,['npwp']),
      pagu: toNumber(getField(row,['pagu','nilai pagu','nilai po','nilai transaksi'])),
      hps: toNumber(getField(row,['hps'])),
      tanggalMulai: getField(row,['tanggal_mul','tanggal_mulai','mulai']),
      tanggalSampai: getField(row,['tanggal_sam','tanggal_sampai','deadline']),
      urlPemenang: getField(row,['url_pemenan','url_pemenang','url pemenang']),
      urlJadwal: getField(row,['url_jadwal','url jadwal']),
      urlPengumuman: getField(row,['url_pengumu','url_pengumuman','url pengumuman']),
      alamat: getField(row,['alamat']),
      jenisPengadaan: getField(row,['jenis_pengadaan','jenis pengadaan']) || source,
      tahapan: tahap,
      tahapPembuatanAktif: tahap,
      negosiasi: 0,
      penawaran: 0,
      terkoreksi: 0
    };
  }

  function buildProviderRows(){ return state.providerRowsRaw.map(r=>mapPortalRow(r)); }
  function buildActiveRows(){ return state.activeRowsRaw.map(r=>mapPortalRow(r)); }
  function buildEcatalogRows(){
    return state.ecatRowsRaw.map(r=>mapPortalRow(r,'EKATALOG')).filter(r=>{
      const jenis = normalize(r.jenisPengadaan);
      return !jenis || jenis.includes('pekerjaan konstruksi');
    });
  }
  function getActiveRows(){
    return buildActiveRows().filter(r=>{
      const txt = normalize(r.tahapPembuatanAktif || r.tahapan);
      if(!txt) return false;
      if(/selesai|batal|gagal|completed/.test(txt)) return false;
      return true;
    });
  }

  async function ensurePortalDataLoaded(mode='simple', force=false){
    if((state.dataLoaded && !force) || state.loadingData) return;
    state.loadingData = true;
    try{
      if(mode==='progress'){
        showProgressLoading(12,'Menyiapkan data portal...','Sedang menyiapkan data untuk halaman ini.','Masuk ke Halaman');
        await delay(80);
        updateProgressLoading(32,'Membaca data penyedia...','Sedang menyiapkan data pencarian paket penyedia.','Masuk ke Halaman');
      } else {
        showSimpleLoading('Memuat halaman','Sedang menyiapkan data yang dibutuhkan.');
        await delay(60);
        updateSimpleLoading('Memuat halaman','Sedang menyiapkan data penyedia.');
      }
      const providerPromise = fetchCsvBySheetTitle(APP_CONFIG.providerSheet);
      await delay(70);
      if(mode==='progress') updateProgressLoading(58,'Membaca data paket aktif...','Sedang menyiapkan data paket aktif.','Masuk ke Halaman');
      else updateSimpleLoading('Memuat halaman','Sedang menyiapkan data paket aktif.');
      const activePromise = fetchCsvBySheetTitle(APP_CONFIG.activeSheet);
      await delay(70);
      if(mode==='progress') updateProgressLoading(78,'Membaca data e-katalog...','Sedang menyiapkan data e-katalog konstruksi.','Masuk ke Halaman');
      else updateSimpleLoading('Memuat halaman','Sedang menyiapkan data e-katalog.');
      const ecatPromise = fetchCsvBySheetTitle(APP_CONFIG.ecatSheet);
      const [providerRows, activeRows, ecatRows] = await Promise.all([providerPromise, activePromise, ecatPromise]);
      state.providerRowsRaw = providerRows;
      state.activeRowsRaw = activeRows;
      state.ecatRowsRaw = ecatRows;
      state.dataLoaded = true;
      if(mode==='progress'){
        updateProgressLoading(100,'Login berhasil','Halaman siap dibuka.','Masuk ke Halaman');
        await delay(140);
      } else {
        updateSimpleLoading('Halaman siap','Data berhasil dimuat.');
        await delay(90);
      }
    } finally {
      state.loadingData = false;
      hideLoading();
    }
  }

  function renderLogin(){
    return '<div class="pp-login-wrap"><div class="pp-login-card" id="ppLoginCard"><div class="pp-login-brand"><span class="pp-kicker">Pemenang Pengadaan</span><h2>Pemenang Pengadaan</h2><p>Masuk untuk membuka pencarian paket penyedia, paket pengadaan aktif, dan pencarian paket e-katalog. Silakan gunakan akun yang sudah disiapkan.</p></div><div class="pp-login-form-wrap"><h3>Masuk ke portal</h3><p class="pp-login-copy">Gunakan user id dan password yang sudah disiapkan.</p><form id="ppLoginForm"><label class="pp-field"><span>User ID</span><input class="pp-input" id="ppLoginUser" type="text" placeholder="Masukkan user id" required></label><label class="pp-field"><span>Password</span><input class="pp-input" id="ppLoginPassword" type="password" placeholder="Masukkan password" required></label><button class="pp-login-submit" id="ppLoginSubmit" type="submit">✦ Masuk ke Portal</button><div class="pp-login-error" id="ppLoginError"></div></form><div class="pp-login-note">Kalau belum bisa masuk, cek lagi user id dan password yang dipakai lalu pastikan penulisannya sudah benar.</div></div></div></div>';
  }
  function setLoginError(root,msg=''){ const el = root.querySelector('#ppLoginError'); if(!el) return; el.textContent = msg; el.classList.toggle('show', !!msg); }

  async function handleLoginSubmit(root,e){
    e.preventDefault();
    const userId = root.querySelector('#ppLoginUser').value.trim();
    const password = root.querySelector('#ppLoginPassword').value;
    const btn = root.querySelector('#ppLoginSubmit');
    if(!userId || !password){ setLoginError(root,'User ID dan password wajib diisi.'); return; }
    setLoginError(root,'');
    btn.disabled = true;
    btn.textContent = 'Memeriksa akses...';
    try{
      showProgressLoading(16,'Memeriksa akses login...','Sedang memeriksa user id dan password yang Anda masukkan.','Masuk ke Halaman');
      const rows = await fetchCsvByGid(APP_CONFIG.userSheet);
      updateProgressLoading(55,'Validasi akun...','Sedang memastikan data login sesuai.','Masuk ke Halaman');
      const match = rows.find(row => {
        const userVal = String(getField(row,['USERID','user id','user'])).trim();
        const passVal = String(getField(row,['PASSWORD','password','pass'])).trim();
        return userVal === userId && passVal === password;
      });
      if(!match) throw new Error('User ID atau password tidak sesuai.');
      persistSession({ userId, loginAt: Date.now() });
      updateProgressLoading(74,'Akses diterima...','Sedang menyiapkan halaman utama.','Masuk ke Halaman');
      await ensurePortalDataLoaded('progress');
      renderApp(root);
    }catch(err){
      hideLoading();
      setLoginError(root, err.message || 'Login gagal.');
    } finally {
      btn.disabled = false;
      btn.textContent = '✦ Masuk ke Portal';
    }
  }

  function dashboardCounts(){
    const provider = buildProviderRows();
    const active = getActiveRows();
    const ecat = buildEcatalogRows();
    const union = [...provider, ...active, ...ecat];
    const instansi = new Set(union.map(r=>r.instansi).filter(Boolean)).size;
    return { provider: provider.length, active: active.length, ecat: ecat.length, instansi };
  }

  function renderDashboardContent(){
    const counts = dashboardCounts();
    return `<div class="pp-dashboard-header">
      <div class="pp-dashboard-top">
        <div>
          <span class="pp-panel-title">Dashboard Akses · Pengguna</span>
          <h3>Pilih panel kerja</h3>
          <p>Silakan pilih menu yang ingin dibuka. Tampilan dibuat ringkas supaya lebih cepat dipakai dan lebih mudah dibaca.</p>
        </div>
        <div class="pp-dashboard-mini">
          <div class="pp-mini-box"><span>Paket penyedia</span><strong>${formatNumber(counts.provider)}</strong></div>
          <div class="pp-mini-box"><span>Paket aktif</span><strong>${formatNumber(counts.active)}</strong></div>
          <div class="pp-mini-box"><span>Instansi</span><strong>${formatNumber(counts.instansi)}</strong></div>
          <div class="pp-mini-box pp-mini-box--purple"><span>E-Katalog</span><strong>${formatNumber(counts.ecat)}</strong></div>
        </div>
      </div>
    </div>

    <div class="pp-feature-grid pp-feature-grid--triple">
      <button class="pp-feature-card pp-feature-card--blue" data-pp-tab="provider-search">
        <div class="pp-feature-icon">🔎</div>
        <div class="pp-feature-copy">
          <span>Menu utama</span>
          <h4>Pencarian Paket Penyedia</h4>
          <p>Telusuri paket penyedia, pemenang, instansi, LPSE, dan rincian penting lainnya.</p>
        </div>
        <div class="pp-feature-arrow">→</div>
      </button>

      <button class="pp-feature-card pp-feature-card--teal" data-pp-tab="active-packages">
        <div class="pp-feature-icon">📦</div>
        <div class="pp-feature-copy">
          <span>Pantauan aktif</span>
          <h4>Paket Pengadaan Aktif</h4>
          <p>Cari paket aktif berdasarkan nama paket, instansi, LPSE, jenis paket, dan tahap proses.</p>
        </div>
        <div class="pp-feature-arrow">→</div>
      </button>

      <button class="pp-feature-card pp-feature-card--purple" data-pp-tab="ecatalog-search">
        <div class="pp-feature-icon">🛒</div>
        <div class="pp-feature-copy">
          <span>E-Katalog</span>
          <h4>Pencarian Paket E-Katalog</h4>
          <p>Menampilkan paket e-katalog konstruksi dengan tampilan yang dibedakan dari menu lainnya.</p>
        </div>
        <div class="pp-feature-arrow">→</div>
      </button>
    </div>

    <div class="pp-disclaimer open" id="ppDisclaimer">
      <div class="pp-disclaimer-toggle pp-disclaimer-toggle--static">
        <div class="pp-disclaimer-left">
          <div class="pp-disclaimer-badge">!</div>
          <div>
            <strong>Informasi Penting</strong>
            <small>Baca dulu sebentar biar enak pas pakai menu</small>
          </div>
        </div>
      </div>

      <div class="pp-disclaimer-body">
        <div class="pp-disclaimer-grid">
          <div class="pp-disclaimer-box">
            <h5>Mekanisme Pembaruan Data</h5>
            <ul>
              <li>Data ditarik secara berkala, bukan real-time.</li>
              <li>Biasanya update dilakukan sekitar seminggu sekali karena datanya banyak dan proses nariknya juga lumayan panjang.</li>
              <li>Jadi kalau ada data terbaru di portal resmi tapi belum muncul di sini, itu masih wajar bro.</li>
              <li>Dashboard ini dibikin biar cek data lebih enak, bukan buat gantiin sumber resminya.</li>
            </ul>
          </div>

          <div class="pp-disclaimer-box">
            <h5>Akurasi & Tanggung Jawab</h5>
            <ul>
              <li>Akurasi dan kelengkapan data tetap sangat bergantung pada kualitas input dari masing-masing instansi di portal SPSE/LPSE.</li>
              <li>Data ditampilkan sesuai yang kebaca dari sumber, tidak diverifikasi ulang satu per satu dan tidak ditambah-tambah di luar kebutuhan tampilan.</li>
              <li>Kalau ada selisih dengan portal resmi, biasanya karena beda waktu update, data sumber belum kebaca, atau kendala teknis saat penarikan data.</li>
              <li>Untuk kebutuhan penting, tetap wajib cek ulang ke sumber resminya ya.</li>
            </ul>
          </div>

          <div class="pp-disclaimer-box">
            <h5>Cocok Dipakai Buat</h5>
            <ul>
              <li>Riset dan analisis tren pengadaan.</li>
              <li>Referensi awal buat cek profil penyedia sebelum verifikasi lebih lanjut.</li>
              <li>Pemantauan paket aktif dan monitoring data pengadaan.</li>
              <li>Bahan edukasi, studi kasus, transparansi, dan monitoring internal.</li>
              <li>Analisis sebaran penyedia, instansi, dan efisiensi nilai paket / HPS.</li>
            </ul>
          </div>

          <div class="pp-disclaimer-box">
            <h5>Tetap Cek Sumber Resmi Buat</h5>
            <ul>
              <li>Keputusan hukum, administratif, atau komersial.</li>
              <li>Verifikasi status resmi pemenang dan keabsahan kontrak aktif.</li>
              <li>Kebutuhan data real-time untuk tender atau seleksi yang sedang berjalan.</li>
              <li>Laporan resmi, pengaduan, atau audit formal.</li>
              <li>Penetapan status yang sifatnya mengikat secara resmi.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>`;
  }

  function providerMatches(row, term, tahun){
    const hay = [row.namaPemenang,row.namaPaket,row.instansi,row.lpse,row.kode,row.npwp].join(' ').toLowerCase();
    if(tahun && String(row.tahun)!==String(tahun)) return false;
    if(!term) return true;
    return hay.includes(term.toLowerCase());
  }
  function sortRows(rows, by){
    const arr = [...rows];
    if(by==='nilai') arr.sort((a,b)=>(b.pagu||b.hps)-(a.pagu||a.hps));
    else if(by==='nama') arr.sort((a,b)=>String(a.namaPaket).localeCompare(String(b.namaPaket),'id'));
    else if(by==='instansi') arr.sort((a,b)=>String(a.instansi).localeCompare(String(b.instansi),'id'));
    else arr.sort((a,b)=>String(a.tanggalSampai||'').localeCompare(String(b.tanggalSampai||''),'id'));
    return arr;
  }
  function paginate(rows,page){ const total = rows.length; const start = (page-1)*APP_CONFIG.pageSize; const end = Math.min(start + APP_CONFIG.pageSize, total); return { slice: rows.slice(start,end), start, end, total, pages: Math.max(1, Math.ceil(total/APP_CONFIG.pageSize)) }; }
  function renderPagination(type, page, total){ const pages = Math.max(1, Math.ceil(total/APP_CONFIG.pageSize)); if(total <= APP_CONFIG.pageSize) return ''; return `<div class="pp-pagination"><button class="pp-page-btn" type="button" data-pp-page-move="${type}:prev" ${page<=1?'disabled':''}>← Prev</button><div class="pp-page-info">Menampilkan ${(page-1)*APP_CONFIG.pageSize+1}-${Math.min(page*APP_CONFIG.pageSize,total)} dari ${formatNumber(total)} hasil</div><button class="pp-page-btn" type="button" data-pp-page-move="${type}:next" ${page>=pages?'disabled':''}>Next →</button></div>`; }
  function renderQueryInfo(label,q){ return q ? `<div class="pp-query-info">Hasil pencarian ${esc(label)} untuk <b>${esc(q)}</b></div>` : ''; }

  function renderProviderSearch(){
    const sourceRows = buildProviderRows();
    const years = [...new Set(sourceRows.map(r=>r.tahun).filter(Boolean))].sort((a,b)=>String(b).localeCompare(String(a)));
    const all = state.providerResults;
    const pageData = paginate(all, state.providerPage);
    return `<div class="pp-section-card"><div class="pp-section-head"><div><span class="pp-panel-title" style="background:#edf4ff;border-color:#dbe4f0;color:#17427d;">Analisis penyedia</span><h3>Pencarian Paket Penyedia</h3><p>Cari nama penyedia, lalu buka rincian paket dan tautan yang dibutuhkan.</p></div><button class="pp-export-btn" type="button" id="ppExportProviderBtn">Export XLSX</button></div><div class="pp-filter-grid"><label class="pp-search-box"><span>Kata kunci penyedia</span><input class="pp-search-input" id="ppProviderKeyword" placeholder="Cari nama penyedia, paket, instansi, LPSE, atau NPWP..." value="${esc(state.providerQuery)}"></label><label class="pp-select-box"><span>Tahun</span><select class="pp-select" id="ppProviderYear"><option value="">Semua tahun</option>${years.map(y=>`<option value="${esc(y)}">${esc(y)}</option>`).join('')}</select></label><div></div><div></div><button class="pp-action-button" id="ppProviderSearchBtn" type="button" ${state.providerQuery.trim()?'':'disabled'}>Cari Penyedia</button></div><div class="pp-summary-strip"><div class="pp-summary-box"><span>Total data tersedia</span><strong>${formatNumber(sourceRows.length)}</strong></div><div class="pp-summary-box"><span>Instansi tercatat</span><strong>${formatNumber(new Set(sourceRows.map(r=>r.instansi).filter(Boolean)).size)}</strong></div><div class="pp-summary-box"><span>LPSE tercatat</span><strong>${formatNumber(new Set(sourceRows.map(r=>r.lpse).filter(Boolean)).size)}</strong></div><div class="pp-summary-box"><span>Hasil saat ini</span><strong>${formatNumber(all.length)}</strong></div></div>${renderQueryInfo('penyedia', state.providerQuery)}<div class="pp-result-list">${pageData.total ? pageData.slice.map((r,i)=>renderPackageCard(r,pageData.start+i,true)).join('') : '<div class="pp-empty">Masukkan kata kunci penyedia lalu klik <b>Cari Penyedia</b>.</div>'}</div>${renderPagination('provider', state.providerPage, pageData.total)}</div>`;
  }

  function renderActivePackages(){
    const sourceRows = getActiveRows();
    const rows = state.activeResults;
    const pageData = paginate(rows, state.activePage);
    const years = [...new Set(sourceRows.map(r=>r.tahun).filter(Boolean))].sort((a,b)=>String(b).localeCompare(String(a)));
    const phases = [...new Set(sourceRows.map(r=>r.tahapPembuatanAktif || r.tahapan).filter(Boolean))].sort();
    return `<div class="pp-section-card"><div class="pp-section-head"><div><span class="pp-panel-title" style="background:#ecfffb;border-color:#d1f6ef;color:#0f766e;">Pantauan aktif</span><h3>Paket Pengadaan Aktif</h3><p>Cari paket aktif berdasarkan nama paket, instansi, LPSE, jenis paket, tahap proses, dan tahun.</p></div><button class="pp-export-btn" type="button" id="ppExportActiveBtn">Export XLSX</button></div><div class="pp-filter-grid"><label class="pp-search-box"><span>Pencarian umum</span><input class="pp-search-input" id="ppActiveKeyword" placeholder="Cari nama paket, instansi, atau LPSE..." value="${esc(state.activeQuery)}"></label><label class="pp-select-box"><span>Jenis paket</span><select class="pp-select" id="ppActiveJenis"><option value="">Semua</option><option value="TENDER">Tender</option><option value="NON TENDER">Non Tender</option><option value="EKATALOG">E-Katalog</option></select></label><label class="pp-select-box"><span>Tahap proses</span><select class="pp-select" id="ppActivePhase"><option value="">Semua tahap</option>${phases.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('')}</select></label><label class="pp-select-box"><span>Tahun</span><select class="pp-select" id="ppActiveYear"><option value="">Semua tahun</option>${years.map(y=>`<option value="${esc(y)}">${esc(y)}</option>`).join('')}</select></label><button class="pp-action-button" id="ppActiveSearchBtn" type="button">Cari Paket</button></div><div class="pp-summary-strip"><div class="pp-summary-box"><span>Total aktif</span><strong>${formatNumber(sourceRows.length)}</strong></div><div class="pp-summary-box"><span>Hasil ditemukan</span><strong>${formatNumber(rows.length)}</strong></div><div class="pp-summary-box"><span>Dengan pemenang</span><strong>${formatNumber(rows.filter(r=>r.namaPemenang).length)}</strong></div><div class="pp-summary-box"><span>Nilai pagu</span><strong>${formatMoney(rows.reduce((t,r)=>t+(r.pagu||0),0))}</strong></div></div>${renderQueryInfo('paket aktif', state.activeQuery)}<div class="pp-toolbar"><div class="pp-sort-group"><span>Urutkan</span><button class="pp-sort-btn ${state.sortActiveBy==='deadline'?'active':''}" data-pp-sort="deadline" type="button">Deadline</button><button class="pp-sort-btn ${state.sortActiveBy==='nilai'?'active':''}" data-pp-sort="nilai" type="button">Nilai</button><button class="pp-sort-btn ${state.sortActiveBy==='nama'?'active':''}" data-pp-sort="nama" type="button">Nama</button><button class="pp-sort-btn ${state.sortActiveBy==='instansi'?'active':''}" data-pp-sort="instansi" type="button">Instansi</button></div></div><div class="pp-result-list">${pageData.total ? pageData.slice.map((r,i)=>renderPackageCard(r,pageData.start+i,false)).join('') : '<div class="pp-empty">Belum ada hasil. Gunakan filter lalu klik <b>Cari Paket</b>.</div>'}</div>${renderPagination('active', state.activePage, pageData.total)}</div>`;
  }

  function renderEcatalogSearch(){
    const source = buildEcatalogRows();
    const years = [...new Set(source.map(r=>r.tahun).filter(Boolean))].sort((a,b)=>String(b).localeCompare(String(a)));
    const all = state.ecatResults;
    const pageData = paginate(all, state.ecatPage);
    return `<div class="pp-section-card"><div class="pp-section-head"><div><span class="pp-panel-title" style="background:#f3efff;border-color:#e5ddff;color:#6b3fe3;">E-Katalog Konstruksi</span><h3>Pencarian Paket E-Katalog</h3><p>Menampilkan paket e-katalog konstruksi dengan tampilan yang dibedakan dari tender dan non tender.</p></div><button class="pp-export-btn pp-export-btn--purple" type="button" id="ppExportEcatBtn">Export XLSX</button></div><div class="pp-filter-grid"><label class="pp-search-box"><span>Kata kunci e-katalog</span><input class="pp-search-input" id="ppEcatKeyword" placeholder="Cari nama penyedia, paket, instansi, atau LPSE..." value="${esc(state.ecatQuery)}"></label><label class="pp-select-box"><span>Tahun</span><select class="pp-select" id="ppEcatYear"><option value="">Semua tahun</option>${years.map(y=>`<option value="${esc(y)}">${esc(y)}</option>`).join('')}</select></label><div></div><div></div><button class="pp-action-button pp-action-button--purple" id="ppEcatSearchBtn" type="button" ${state.ecatQuery.trim()?'':'disabled'}>Cari E-Katalog</button></div><div class="pp-summary-strip"><div class="pp-summary-box pp-summary-box--purple"><span>Total e-katalog konstruksi</span><strong>${formatNumber(source.length)}</strong></div><div class="pp-summary-box pp-summary-box--purple"><span>Dengan pemenang</span><strong>${formatNumber(source.filter(r=>r.namaPemenang).length)}</strong></div><div class="pp-summary-box pp-summary-box--purple"><span>Instansi</span><strong>${formatNumber(new Set(source.map(r=>r.instansi).filter(Boolean)).size)}</strong></div><div class="pp-summary-box pp-summary-box--purple"><span>Hasil saat ini</span><strong>${formatNumber(all.length)}</strong></div></div>${renderQueryInfo('e-katalog', state.ecatQuery)}<div class="pp-result-list">${pageData.total ? pageData.slice.map((r,i)=>renderPackageCard(r,pageData.start+i,true)).join('') : '<div class="pp-empty">Masukkan kata kunci lalu klik <b>Cari E-Katalog</b>.</div>'}</div>${renderPagination('ecat', state.ecatPage, pageData.total)}</div>`;
  }

  function renderLink(label, href, icon){ if(!href) return `<span class="pp-link-pill pp-link-pill--disabled">${icon} ${label}</span>`; return `<a class="pp-link-pill pp-link-pill--active" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${icon} ${label}</a>`; }
  function sourceBadgeClass(source){ if(source==='EKATALOG') return 'pp-badge--purple'; if(source==='NON TENDER') return 'pp-badge--gold'; return 'pp-badge--blue'; }
  function sourceCardClass(source){ if(source==='EKATALOG') return 'pp-package-card--purple'; if(source==='NON TENDER') return 'pp-package-card--gold'; return 'pp-package-card--blue'; }

  function renderPackageCard(row, idx, providerMode){
    const title = row.namaPaket || '-';
    const phase = row.tahapPembuatanAktif || row.tahapan || '-';
    const detailId = `pp-detail-${providerMode?'p':'a'}-${idx}`;
    return `<article class="pp-package-card ${sourceCardClass(row.sourceJenis)}" data-detail-card="${detailId}"><div class="pp-package-main"><div class="pp-package-top"><div class="pp-package-title-wrap"><div class="pp-badges"><span class="pp-badge ${sourceBadgeClass(row.sourceJenis)}">${esc(row.sourceJenis)}</span>${phase && phase!=='-' ? `<span class="pp-badge pp-badge--teal">${esc(phase)}</span>` : ''}${row.namaPemenang ? '<span class="pp-badge pp-badge--green">Dengan pemenang</span>' : ''}</div><h4 class="pp-package-title">${esc(title)}</h4><div class="pp-package-meta"><span>${esc(row.instansi || '-')}</span>${row.lpse ? `<span>${esc(row.lpse)}</span>` : ''}</div></div><div class="pp-package-side"><div class="pp-side-card"><span>${providerMode ? 'Nilai HPS' : 'Nilai Pagu'}</span><strong>${formatMoney(providerMode ? (row.hps || row.pagu) : (row.pagu || row.hps))}</strong></div></div></div><div class="pp-package-grid"><div class="pp-meta-tile"><span>Pemenang</span><strong>${esc(row.namaPemenang || '-')}</strong></div><div class="pp-meta-tile"><span>NPWP</span><strong>${esc(row.npwp || '-')}</strong></div><div class="pp-meta-tile"><span>Mulai</span><strong>${esc(formatDateish(row.tanggalMulai))}</strong></div><div class="pp-meta-tile"><span>Sampai / Deadline</span><strong>${esc(formatDateish(row.tanggalSampai))}</strong></div></div></div><div class="pp-package-actions"><div class="pp-link-row">${renderLink('Pemenang', row.urlPemenang, '👁')} ${renderLink('Jadwal', row.urlJadwal, '🗓')} ${renderLink('Pengumuman', row.urlPengumuman, '📢')}</div><button class="pp-detail-toggle" type="button" data-detail-toggle="${detailId}">Lihat detail lengkap</button></div><div class="pp-package-detail" id="${detailId}"><div class="pp-detail-grid"><div class="pp-detail-box"><h5>Identitas Paket</h5><div class="pp-detail-list"><span>Kode Paket</span><strong>${esc(row.kode || '-')}</strong><span>Jenis Pengadaan</span><strong>${esc(row.jenisPengadaan || row.sourceJenis || '-')}</strong><span>Instansi</span><strong>${esc(row.instansi || '-')}</strong><span>LPSE</span><strong>${esc(row.lpse || '-')}</strong><span>Tahap Aktif</span><strong>${esc(phase)}</strong></div></div><div class="pp-detail-box"><h5>Profil Pemenang</h5><div class="pp-provider-profile"><strong>${esc(row.namaPemenang || '-')}</strong><div><b>Alamat</b><br>${esc(row.alamat || '-')}</div><div><b>NPWP</b><br>${esc(row.npwp || '-')}</div><div><b>Nilai Penawaran</b><br>${row.penawaran ? formatMoney(row.penawaran) : '-'}</div><div><b>Nilai Terkoreksi</b><br>${row.terkoreksi ? formatMoney(row.terkoreksi) : '-'}</div><div><b>Nilai Negosiasi</b><br>${row.negosiasi ? formatMoney(row.negosiasi) : '-'}</div></div></div></div></div></article>`;
  }

  function exportRowsToCsv(rows, filename){
    if(!rows.length){ alert('Belum ada data untuk diexport.'); return; }
    const headers = ['Sumber','Tahun','Kode Paket','Nama Paket','Tahap Aktif','Instansi','LPSE','Pemenang','NPWP','Nilai Pagu','Nilai HPS','Mulai','Deadline'];
    const lines = [headers.join(',')].concat(rows.map(r=>[
      r.sourceJenis,r.tahun,r.kode,r.namaPaket,r.tahapPembuatanAktif||r.tahapan,r.instansi,r.lpse,r.namaPemenang,r.npwp,r.pagu,r.hps,r.tanggalMulai,r.tanggalSampai
    ].map(v=>`"${String(v ?? '').replace(/"/g,'""')}"`).join(',')));
    const blob = new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function renderApp(root){
    const loginView = root.querySelector('#ppLoginView');
    const appView = root.querySelector('#ppAppView');
    loginView.classList.add('pp-hidden');
    appView.classList.remove('pp-hidden');
    const content = `<div class="pp-shell"><div class="pp-app-topbar"><div class="pp-app-title"><div class="pp-app-logo"></div><div><h2>Pemenang Pengadaan</h2><p>Portal internal pencarian penyedia, paket aktif, dan e-katalog</p></div></div><div class="pp-app-actions"><div class="pp-user-pill">${esc(state.session?.userId || '-')}</div><button class="pp-top-button" type="button" data-pp-tab="dashboard">Dashboard</button><button class="pp-top-button pp-top-button--danger" type="button" id="ppLogoutBtn">Keluar</button></div></div><div class="pp-tabs"><button class="pp-tab ${state.activeTab==='dashboard'?'active':''}" data-pp-tab="dashboard" type="button">Dashboard</button><button class="pp-tab ${state.activeTab==='provider-search'?'active':''}" data-pp-tab="provider-search" type="button">Pencarian Paket Penyedia</button><button class="pp-tab ${state.activeTab==='active-packages'?'active':''}" data-pp-tab="active-packages" type="button">Paket Pengadaan Aktif</button><button class="pp-tab pp-tab--purple ${state.activeTab==='ecatalog-search'?'active':''}" data-pp-tab="ecatalog-search" type="button">Pencarian Paket Ekatalog</button></div><div class="pp-page ${state.activeTab==='dashboard'?'active':''}" data-pp-page="dashboard">${renderDashboardContent()}</div><div class="pp-page ${state.activeTab==='provider-search'?'active':''}" data-pp-page="provider-search">${renderProviderSearch()}</div><div class="pp-page ${state.activeTab==='active-packages'?'active':''}" data-pp-page="active-packages">${renderActivePackages()}</div><div class="pp-page ${state.activeTab==='ecatalog-search'?'active':''}" data-pp-page="ecatalog-search">${renderEcatalogSearch()}</div></div>`;
    appView.innerHTML = content;
    bindApp(root);
  }

  async function changeTab(root, tab){
    showSimpleLoading('Membuka halaman','Sedang menyiapkan menu yang dipilih.');
    state.activeTab = tab;
    if(tab !== 'dashboard') await ensurePortalDataLoaded('simple');
    updateSimpleLoading('Membuka halaman','Tampilan sedang disiapkan.');
    await delay(80);
    renderApp(root);
    await delay(40);
    hideLoading();
  }

  function bindApp(root){
    const appView = root.querySelector('#ppAppView');
    const logoutBtn = appView.querySelector('#ppLogoutBtn');
    if(logoutBtn) logoutBtn.addEventListener('click', ()=>{ clearSession(); state.activeTab='dashboard'; state.providerResults=[]; state.activeResults=[]; state.ecatResults=[]; mount(root); });
    appView.querySelectorAll('[data-pp-tab]').forEach(btn=>btn.addEventListener('click', ()=>changeTab(root, btn.dataset.ppTab)));

    const pInput = appView.querySelector('#ppProviderKeyword'); const pBtn = appView.querySelector('#ppProviderSearchBtn');
    if(pInput && pBtn){
      pInput.addEventListener('input', ()=>{ state.providerQuery=pInput.value; pBtn.disabled=!pInput.value.trim(); });
      pBtn.addEventListener('click', async ()=>{
        const term = pInput.value.trim(); if(!term) return;
        showSimpleLoading('Mencari penyedia','Sedang menyiapkan hasil pencarian.');
        state.providerQuery = term; const tahun = appView.querySelector('#ppProviderYear').value;
        await ensurePortalDataLoaded('simple');
        updateSimpleLoading('Mencari penyedia','Sedang menyaring data yang sesuai.');
        state.providerPage = 1; state.providerResults = buildProviderRows().filter(r=>providerMatches(r, term, tahun));
        await delay(80); renderApp(root); hideLoading();
      });
    }
    const exportP = appView.querySelector('#ppExportProviderBtn'); if(exportP) exportP.addEventListener('click',()=>exportRowsToCsv(state.providerResults,'pencarian_penyedia.csv'));

    const aBtn = appView.querySelector('#ppActiveSearchBtn');
    if(aBtn){
      aBtn.addEventListener('click', async ()=>{
        showSimpleLoading('Mencari paket aktif','Sedang menyiapkan hasil pencarian.');
        const kw = appView.querySelector('#ppActiveKeyword').value.trim().toLowerCase();
        state.activeQuery = appView.querySelector('#ppActiveKeyword').value.trim();
        const jenis = appView.querySelector('#ppActiveJenis').value;
        const phase = appView.querySelector('#ppActivePhase').value;
        const tahun = appView.querySelector('#ppActiveYear').value;
        await ensurePortalDataLoaded('simple');
        updateSimpleLoading('Mencari paket aktif','Sedang menyaring data yang sesuai.');
        let rows = getActiveRows().filter(r=>{ const hay = [r.namaPaket,r.instansi,r.lpse].join(' ').toLowerCase(); if(kw && !hay.includes(kw)) return false; if(jenis && r.sourceJenis!==jenis) return false; const phaseVal=r.tahapPembuatanAktif||r.tahapan||''; if(phase && phaseVal!==phase) return false; if(tahun && String(r.tahun)!==String(tahun)) return false; return true; });
        state.activePage=1; state.activeResults=sortRows(rows,state.sortActiveBy); await delay(80); renderApp(root); hideLoading();
      });
    }
    const exportA = appView.querySelector('#ppExportActiveBtn'); if(exportA) exportA.addEventListener('click',()=>exportRowsToCsv(state.activeResults,'paket_aktif.csv'));

    const eInput = appView.querySelector('#ppEcatKeyword'); const eBtn = appView.querySelector('#ppEcatSearchBtn');
    if(eInput && eBtn){
      eInput.addEventListener('input', ()=>{ state.ecatQuery=eInput.value; eBtn.disabled=!eInput.value.trim(); });
      eBtn.addEventListener('click', async ()=>{
        const kw = eInput.value.trim().toLowerCase(); if(!kw) return;
        showSimpleLoading('Mencari e-katalog','Sedang menyiapkan hasil pencarian.');
        state.ecatQuery = eInput.value.trim(); const tahun = appView.querySelector('#ppEcatYear').value;
        await ensurePortalDataLoaded('simple');
        updateSimpleLoading('Mencari e-katalog','Sedang menyaring data yang sesuai.');
        state.ecatPage = 1; state.ecatResults = buildEcatalogRows().filter(r=>{ const hay=[r.namaPaket,r.instansi,r.lpse,r.namaPemenang].join(' ').toLowerCase(); if(kw && !hay.includes(kw)) return false; if(tahun && String(r.tahun)!==String(tahun)) return false; return true; });
        await delay(80); renderApp(root); hideLoading();
      });
    }
    const exportE = appView.querySelector('#ppExportEcatBtn'); if(exportE) exportE.addEventListener('click',()=>exportRowsToCsv(state.ecatResults,'paket_ekatalog.csv'));

    appView.querySelectorAll('[data-pp-sort]').forEach(btn=>btn.addEventListener('click', ()=>{ state.sortActiveBy=btn.dataset.ppSort; state.activeResults=sortRows(state.activeResults,state.sortActiveBy); renderApp(root); }));
    appView.querySelectorAll('[data-detail-toggle]').forEach(btn=>btn.addEventListener('click', ()=>{ const id=btn.dataset.detailToggle; const card=appView.querySelector(`[data-detail-card="${id}"]`); if(card){ card.classList.toggle('open'); btn.textContent=card.classList.contains('open')?'Tutup detail':'Lihat detail lengkap'; } }));
    appView.querySelectorAll('[data-pp-page-move]').forEach(btn=>btn.addEventListener('click', async ()=>{ const [type,dir]=btn.dataset.ppPageMove.split(':'); showSimpleLoading('Membuka halaman','Sedang memindahkan hasil pencarian.'); if(type==='provider') state.providerPage=Math.max(1, state.providerPage + (dir==='next'?1:-1)); if(type==='active') state.activePage=Math.max(1, state.activePage + (dir==='next'?1:-1)); if(type==='ecat') state.ecatPage=Math.max(1, state.ecatPage + (dir==='next'?1:-1)); await delay(70); renderApp(root); hideLoading(); }));
  }

  function mount(root){
    root.querySelector('#ppLoginView').innerHTML = renderLogin();
    root.querySelector('#ppAppView').innerHTML = '';
    root.querySelector('#ppLoginView').classList.remove('pp-hidden');
    root.querySelector('#ppAppView').classList.add('pp-hidden');
    const form = root.querySelector('#ppLoginForm'); form.addEventListener('submit', handleLoginSubmit.bind(null, root));
    const session = getStoredSession();
    if(session){
      state.session = session;
      showSimpleLoading('Membuka portal','Sedang memulihkan sesi terakhir.');
      ensurePortalDataLoaded('simple').finally(()=>{ renderApp(root); hideLoading(); });
    }
  }

  window.__moduleInit = function({container}){ const root = container.querySelector('#ppModuleRoot') || container; mount(root); return function destroy(){}; };
})();
