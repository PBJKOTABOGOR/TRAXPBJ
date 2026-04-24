const APP_ROUTES = {
  dashboard: {
    title: 'Dashboard TRAXPBJ',
    subtitle: 'Ringkasan informasi utama untuk monitoring dan analisis pengadaan.',
    type: 'internal'
  },

  'monitoring-perencanaan': {
    title: 'Monitoring Perencanaan',
    subtitle: 'Pemantauan progres perencanaan pengadaan perangkat daerah.',
    type: 'module',
    html: 'modules/monitoring/perencanaan/monitoring.html',
    css: 'modules/monitoring/perencanaan/monitoring.css',
    js: 'modules/monitoring/perencanaan/monitoring.js',
    externalScripts: [
      'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js'
    ]
  },

  'monitoring-konsolidasi': {
    title: 'Monitoring Paket Konsolidasi',
    subtitle: 'Halaman ini disiapkan untuk monitoring paket konsolidasi.',
    type: 'placeholder'
  },

  'monitoring-sirup': {
    title: 'Monitoring SiRUP',
    subtitle: 'Monitoring paket perencanaan yang diumumkan di SIRUP dan indikator ITKP SIRUP.',
    type: 'module',
    html: 'modules/monitoring/itkp-sirup/itkp-sirup.html',
    css: 'modules/monitoring/itkp-sirup/itkp-sirup.css',
    js: 'modules/monitoring/itkp-sirup/itkp-sirup.js'
  },

  'monitoring-ekatalog': {
    title: 'Monitoring eKatalog',
    subtitle: 'Halaman ini disiapkan untuk monitoring indikator pemanfaatan eKatalog.',
    type: 'placeholder'
  },

  'monitoring-etendering': {
    title: 'Monitoring eTendering',
    subtitle: 'Halaman ini disiapkan untuk monitoring indikator pemanfaatan eTendering.',
    type: 'placeholder'
  },

  'monitoring-nontender': {
    title: 'Monitoring Non Tender',
    subtitle: 'Halaman ini disiapkan untuk monitoring Non eTendering/Non ePurchasing.',
    type: 'placeholder'
  },

  'monitoring-ekontrak': {
    title: 'Monitoring eKontrak',
    subtitle: 'Halaman ini disiapkan untuk monitoring indikator pemanfaatan eKontrak.',
    type: 'placeholder'
  },

  'rapor-pbj': {
    title: 'Rapor PBJ',
    subtitle: 'Portal laporan Rapor PBJ perangkat daerah.',
    type: 'iframe',
    url: 'https://pbjkotabogor.github.io/raporpbj/'
  },

  'simulasi-timeline': {
    title: 'Simulasi Timeline Pengadaan',
    subtitle: 'Simulasi penyusunan timeline pengadaan barang dan jasa.',
    type: 'module',
    html: 'modules/timeline/simulasi-timeline.html',
    css: 'modules/timeline/simulasi-timeline.css',
    js: 'modules/timeline/simulasi-timeline.js'
  },

  'simulasi-nontender': {
    title: 'Pencatatan Non Tender',
    subtitle: 'Simulasi PPK untuk pencatatan paket non tender.',
    type: 'iframe',
    url: 'https://pbjkotabogor.github.io/SIMPPK/login.html'
  }
};

const contentArea = document.getElementById('contentArea');
const sidebar = document.getElementById('sidebar');
const sidebarToggleButton = document.getElementById('sidebarToggleButton');

let activeModuleToken = 0;
let currentModuleDestroy = null;
let activeFlyout = null;

const CMD_SHEET_CONFIG = {
  spreadsheetId: '1tRYoFQ2obJLoQfIBmZQ_qIw72ZCMV9fKIpBA3DlsIxE',
  rawSirupGid: '0',
  scoreSirupGid: '468989223'
};

const CMD_STATE = {
  loaded: false,
  loading: false,
  error: '',
  rows: [],
  selectedId: '',
  map: null,
  markers: []
};

function injectCommandDashboardCss() {
  if (document.getElementById('cmd-dashboard-style')) return;

  const style = document.createElement('style');
  style.id = 'cmd-dashboard-style';
  style.textContent = `
    .cmd-dashboard{
      position:relative;
      min-height:100vh;
      padding:2px;
      color:#eaf2ff;
      font-family:"Inter","Segoe UI",Arial,sans-serif;
    }

    .cmd-dashboard::before{
      content:"";
      position:fixed;
      inset:0;
      pointer-events:none;
      background:
        radial-gradient(circle at 18% 10%, rgba(37,99,235,.18), transparent 28%),
        radial-gradient(circle at 86% 16%, rgba(34,211,238,.12), transparent 25%),
        radial-gradient(circle at 50% 90%, rgba(15,118,110,.11), transparent 34%),
        linear-gradient(180deg,#06101d 0%,#081827 44%,#0b1524 100%);
      z-index:-1;
    }

    .cmd-loading-screen,
    .cmd-error-card{
      min-height:calc(100vh - 32px);
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      text-align:center;
      border-radius:32px;
      background:
        radial-gradient(circle at top, rgba(34,211,238,.14), transparent 34%),
        linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04));
      border:1px solid rgba(148,163,184,.18);
      box-shadow:0 24px 80px rgba(0,0,0,.34);
    }

    .cmd-loading-orb{
      width:72px;
      height:72px;
      border-radius:999px;
      border:4px solid rgba(34,211,238,.18);
      border-top-color:#22d3ee;
      box-shadow:0 0 40px rgba(34,211,238,.34);
      animation:cmdSpin 1s linear infinite;
      margin-bottom:18px;
    }

    @keyframes cmdSpin{
      to{transform:rotate(360deg)}
    }

    .cmd-loading-screen h3,
    .cmd-error-card h3{
      margin:0;
      color:#fff;
      font-size:28px;
      font-weight:950;
      letter-spacing:-.04em;
    }

    .cmd-loading-screen p,
    .cmd-error-card p{
      max-width:680px;
      margin:10px auto 0;
      color:#8fa3bd;
      line-height:1.7;
    }

    .cmd-hero{
      position:relative;
      overflow:hidden;
      min-height:190px;
      border-radius:32px;
      padding:28px;
      display:flex;
      justify-content:space-between;
      gap:28px;
      background:
        linear-gradient(135deg, rgba(15,23,42,.92), rgba(18,58,114,.72)),
        radial-gradient(circle at 82% 24%, rgba(34,211,238,.30), transparent 28%);
      border:1px solid rgba(148,163,184,.16);
      box-shadow:0 24px 80px rgba(0,0,0,.34);
    }

    .cmd-hero::before{
      content:"";
      position:absolute;
      inset:-40%;
      background:
        linear-gradient(115deg, transparent 0%, rgba(255,255,255,.10) 46%, transparent 56%);
      transform:rotate(10deg);
      pointer-events:none;
    }

    .cmd-hero-left,
    .cmd-hero-right{
      position:relative;
      z-index:1;
    }

    .cmd-kicker{
      display:inline-flex;
      align-items:center;
      gap:10px;
      height:34px;
      padding:0 14px;
      border-radius:999px;
      background:rgba(255,255,255,.08);
      border:1px solid rgba(255,255,255,.12);
      color:#cfe6ff;
      font-size:12px;
      font-weight:900;
      letter-spacing:.08em;
    }

    .cmd-kicker span{
      width:8px;
      height:8px;
      border-radius:999px;
      background:#22d3ee;
      box-shadow:0 0 0 6px rgba(34,211,238,.12), 0 0 28px rgba(34,211,238,.65);
    }

    .cmd-hero h3{
      margin:18px 0 0;
      font-size:42px;
      line-height:1.05;
      font-weight:950;
      letter-spacing:-.05em;
      color:#fff;
    }

    .cmd-hero p{
      margin:14px 0 0;
      max-width:960px;
      font-size:14px;
      line-height:1.8;
      color:rgba(234,242,255,.76);
    }

    .cmd-hero-right{
      display:flex;
      flex-direction:column;
      align-items:flex-end;
      justify-content:space-between;
      min-width:250px;
    }

    .cmd-live-chip{
      display:flex;
      align-items:center;
      gap:9px;
      height:38px;
      padding:0 14px;
      border-radius:999px;
      background:rgba(34,211,238,.10);
      border:1px solid rgba(34,211,238,.24);
      color:#a5f3fc;
      font-size:12px;
      font-weight:950;
      letter-spacing:.08em;
    }

    .cmd-live-chip i{
      width:8px;
      height:8px;
      border-radius:999px;
      background:#22c55e;
      box-shadow:0 0 0 6px rgba(34,197,94,.12), 0 0 24px rgba(34,197,94,.65);
    }

    .cmd-date{
      color:rgba(234,242,255,.70);
      font-size:13px;
      font-weight:800;
    }

    .cmd-kpi-grid{
      display:grid;
      grid-template-columns:repeat(4,minmax(0,1fr));
      gap:14px;
      margin:16px 0;
    }

    .cmd-kpi-card{
      position:relative;
      overflow:hidden;
      min-height:122px;
      padding:18px;
      border-radius:24px;
      background:linear-gradient(180deg, rgba(255,255,255,.095), rgba(255,255,255,.045));
      border:1px solid rgba(148,163,184,.18);
      box-shadow:0 16px 40px rgba(0,0,0,.18);
    }

    .cmd-kpi-card::before{
      content:"";
      position:absolute;
      left:0;
      top:0;
      right:0;
      height:2px;
      background:linear-gradient(90deg, transparent, var(--accent), transparent);
    }

    .cmd-kpi-card::after{
      content:"";
      position:absolute;
      right:-38px;
      top:-38px;
      width:105px;
      height:105px;
      border-radius:999px;
      background:radial-gradient(circle, var(--accent-glow), transparent 68%);
    }

    .cmd-kpi-card.accent-blue{
      --accent:#3b82f6;
      --accent-glow:rgba(59,130,246,.42);
    }

    .cmd-kpi-card.accent-cyan{
      --accent:#22d3ee;
      --accent-glow:rgba(34,211,238,.40);
    }

    .cmd-kpi-card.accent-gold{
      --accent:#f5c56b;
      --accent-glow:rgba(245,197,107,.36);
    }

    .cmd-kpi-card.accent-green{
      --accent:#22c55e;
      --accent-glow:rgba(34,197,94,.35);
    }

    .cmd-kpi-label{
      color:#8fa3bd;
      font-size:11px;
      text-transform:uppercase;
      letter-spacing:.10em;
      font-weight:950;
    }

    .cmd-kpi-value{
      margin-top:12px;
      color:#fff;
      font-size:32px;
      font-weight:950;
      letter-spacing:-.04em;
      line-height:1;
    }

    .cmd-kpi-desc{
      margin-top:8px;
      color:rgba(234,242,255,.66);
      font-size:12px;
      line-height:1.55;
    }

    .cmd-map-section{
      display:grid;
      grid-template-columns:minmax(0,1.7fr) minmax(380px,.78fr);
      gap:16px;
      margin-bottom:16px;
    }

    .cmd-map-card,
    .cmd-side-panel,
    .cmd-looker-section,
    .cmd-card{
      background:linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.045));
      border:1px solid rgba(148,163,184,.18);
      border-radius:28px;
      box-shadow:0 20px 60px rgba(0,0,0,.20);
      backdrop-filter:blur(18px);
      -webkit-backdrop-filter:blur(18px);
    }

    .cmd-map-card{
      padding:18px;
    }

    .cmd-section-head{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:18px;
      margin-bottom:16px;
    }

    .cmd-section-head.compact{
      margin-bottom:14px;
    }

    .cmd-section-head h3{
      margin:0;
      color:#fff;
      font-size:21px;
      line-height:1.2;
      font-weight:950;
      letter-spacing:-.03em;
    }

    .cmd-section-head p{
      margin:6px 0 0;
      color:#8fa3bd;
      font-size:13px;
      line-height:1.6;
    }

    .cmd-map-legend{
      display:flex;
      gap:10px;
      align-items:center;
      flex-wrap:wrap;
    }

    .cmd-map-legend span{
      display:flex;
      align-items:center;
      gap:7px;
      height:30px;
      padding:0 10px;
      border-radius:999px;
      background:rgba(255,255,255,.06);
      border:1px solid rgba(255,255,255,.08);
      color:#cbd5e1;
      font-size:11px;
      font-weight:800;
    }

    .cmd-map-legend i{
      width:8px;
      height:8px;
      border-radius:999px;
      display:block;
    }

    .cmd-map-legend i.risk-low{
      background:#22c55e;
    }

    .cmd-map-legend i.risk-medium{
      background:#f5c56b;
    }

    .cmd-map-legend i.risk-high{
      background:#ef4444;
    }

    .cmd-map-wrap{
      position:relative;
      height:590px;
      overflow:hidden;
      border-radius:26px;
      border:1px solid rgba(125,211,252,.16);
      background:#07111f;
    }

    #cmdLeafletMap{
      position:absolute;
      inset:0;
      z-index:1;
      background:#07111f;
    }

    .cmd-map-overlay{
      position:absolute;
      inset:0;
      pointer-events:none;
      z-index:2;
      background:
        radial-gradient(circle at 50% 42%, transparent 0%, rgba(6,16,29,.12) 55%, rgba(6,16,29,.40) 100%),
        linear-gradient(180deg, rgba(3,7,18,.10), rgba(3,7,18,.32));
    }

    .cmd-map-badge{
      position:absolute;
      left:18px;
      bottom:18px;
      z-index:3;
      display:flex;
      gap:10px;
      align-items:center;
      padding:10px 12px;
      border-radius:16px;
      background:rgba(2,6,23,.70);
      border:1px solid rgba(255,255,255,.12);
      color:#dbeafe;
      font-size:12px;
      font-weight:850;
      backdrop-filter:blur(12px);
    }

    .cmd-map-badge i{
      width:9px;
      height:9px;
      border-radius:999px;
      background:#22d3ee;
      box-shadow:0 0 20px rgba(34,211,238,.55);
    }

    .cmd-marker{
      width:18px;
      height:18px;
      border-radius:999px;
      border:2px solid rgba(255,255,255,.90);
      box-shadow:0 0 0 8px rgba(59,130,246,.16), 0 0 26px rgba(34,211,238,.62);
      background:#22d3ee;
    }

    .cmd-marker.risk-low{
      background:#22c55e;
      box-shadow:0 0 0 8px rgba(34,197,94,.16), 0 0 26px rgba(34,197,94,.62);
    }

    .cmd-marker.risk-medium{
      background:#f5c56b;
      box-shadow:0 0 0 8px rgba(245,197,107,.16), 0 0 26px rgba(245,197,107,.62);
    }

    .cmd-marker.risk-high{
      background:#ef4444;
      box-shadow:0 0 0 8px rgba(239,68,68,.16), 0 0 26px rgba(239,68,68,.62);
    }

    .cmd-marker.active{
      width:24px;
      height:24px;
      box-shadow:0 0 0 10px rgba(255,255,255,.14), 0 0 36px currentColor;
    }

    .cmd-popup{
      min-width:210px;
      color:#102544;
    }

    .cmd-popup strong{
      display:block;
      font-size:13px;
      margin-bottom:4px;
    }

    .cmd-popup span{
      display:block;
      color:#64748b;
      font-size:12px;
      line-height:1.5;
    }

    .cmd-side-panel{
      padding:14px;
      display:flex;
      flex-direction:column;
      gap:14px;
    }

    .cmd-selected-panel{
      border-radius:24px;
      padding:18px;
      background:
        radial-gradient(circle at top right, rgba(34,211,238,.12), transparent 32%),
        rgba(255,255,255,.055);
      border:1px solid rgba(125,211,252,.16);
    }

    .cmd-panel-top{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:16px;
    }

    .cmd-panel-kicker{
      color:#22d3ee;
      font-size:11px;
      font-weight:950;
      text-transform:uppercase;
      letter-spacing:.12em;
    }

    .cmd-selected-panel h4{
      margin:8px 0 0;
      color:#fff;
      font-size:24px;
      line-height:1.05;
      font-weight:950;
      letter-spacing:-.04em;
    }

    .cmd-selected-panel p{
      margin:8px 0 0;
      color:#8fa3bd;
      font-size:12px;
      line-height:1.55;
    }

    .cmd-score-orb{
      width:72px;
      height:72px;
      border-radius:22px;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      background:linear-gradient(135deg, rgba(59,130,246,.24), rgba(34,211,238,.13));
      border:1px solid rgba(125,211,252,.22);
    }

    .cmd-score-orb span{
      color:#fff;
      font-size:24px;
      font-weight:950;
      line-height:1;
    }

    .cmd-score-orb small{
      margin-top:4px;
      color:#9cc7e8;
      font-size:10px;
      font-weight:900;
    }

    .cmd-status-row{
      margin-top:16px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      color:#8fa3bd;
      font-size:12px;
      font-weight:800;
    }

    .cmd-status-pill{
      display:inline-flex;
      align-items:center;
      height:30px;
      padding:0 10px;
      border-radius:999px;
      font-size:11px;
      font-weight:950;
    }

    .cmd-status-pill.risk-low{
      color:#86efac;
      background:rgba(34,197,94,.12);
      border:1px solid rgba(34,197,94,.24);
    }

    .cmd-status-pill.risk-medium{
      color:#fde68a;
      background:rgba(245,197,107,.12);
      border:1px solid rgba(245,197,107,.24);
    }

    .cmd-status-pill.risk-high{
      color:#fca5a5;
      background:rgba(239,68,68,.12);
      border:1px solid rgba(239,68,68,.24);
    }

    .cmd-metrics-grid{
      margin-top:16px;
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
    }

    .cmd-metric{
      min-height:78px;
      border-radius:18px;
      padding:12px;
      background:rgba(255,255,255,.055);
      border:1px solid rgba(255,255,255,.08);
    }

    .cmd-metric label{
      display:block;
      color:#8fa3bd;
      font-size:11px;
      font-weight:850;
    }

    .cmd-metric strong{
      display:block;
      margin-top:8px;
      color:#fff;
      font-size:18px;
      line-height:1.15;
      font-weight:950;
    }

    .cmd-progress-block{
      margin-top:16px;
    }

    .cmd-progress-head{
      display:flex;
      justify-content:space-between;
      color:#cbd5e1;
      font-size:12px;
      font-weight:850;
      margin-bottom:8px;
    }

    .cmd-progress-head b{
      color:#fff;
    }

    .cmd-progress-track{
      height:9px;
      border-radius:999px;
      overflow:hidden;
      background:rgba(148,163,184,.18);
    }

    .cmd-progress-track i{
      display:block;
      height:100%;
      border-radius:999px;
      background:linear-gradient(90deg,#2563eb,#22d3ee,#22c55e);
      box-shadow:0 0 20px rgba(34,211,238,.32);
    }

    .cmd-method-box{
      margin-top:16px;
      border-radius:18px;
      padding:13px;
      background:rgba(245,197,107,.08);
      border:1px solid rgba(245,197,107,.16);
    }

    .cmd-method-box span{
      display:block;
      color:#d9c897;
      font-size:11px;
      font-weight:900;
      text-transform:uppercase;
      letter-spacing:.10em;
    }

    .cmd-method-box strong{
      display:block;
      margin-top:6px;
      color:#fff;
      font-size:15px;
      font-weight:950;
    }

    .cmd-actions{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
      margin-top:16px;
    }

    .cmd-btn{
      border:none;
      height:42px;
      border-radius:14px;
      cursor:pointer;
      font-size:12px;
      font-weight:950;
    }

    .cmd-btn.primary{
      background:linear-gradient(135deg,#2563eb,#22d3ee);
      color:#fff;
      box-shadow:0 12px 28px rgba(37,99,235,.22);
    }

    .cmd-btn.ghost{
      background:rgba(255,255,255,.07);
      color:#dbeafe;
      border:1px solid rgba(255,255,255,.10);
    }

    .cmd-opd-list-card{
      border-radius:24px;
      padding:14px;
      background:rgba(255,255,255,.045);
      border:1px solid rgba(255,255,255,.08);
    }

    .cmd-side-title{
      display:flex;
      justify-content:space-between;
      align-items:center;
      color:#fff;
      font-size:13px;
      font-weight:950;
      margin-bottom:10px;
    }

    .cmd-side-title b{
      color:#67e8f9;
    }

    .cmd-opd-list{
      display:flex;
      flex-direction:column;
      gap:8px;
      max-height:620px;
      overflow:auto;
      padding-right:4px;
    }

    .cmd-opd-list::-webkit-scrollbar{
      width:6px;
    }

    .cmd-opd-list::-webkit-scrollbar-thumb{
      background:rgba(125,211,252,.22);
      border-radius:999px;
    }

    .cmd-opd-item{
      width:100%;
      min-height:58px;
      padding:10px;
      border-radius:16px;
      border:1px solid rgba(255,255,255,.08);
      background:rgba(255,255,255,.045);
      color:#eaf2ff;
      cursor:pointer;
      display:flex;
      justify-content:space-between;
      gap:10px;
      text-align:left;
      transition:.18s ease;
    }

    .cmd-opd-item:hover,
    .cmd-opd-item.active{
      border-color:rgba(34,211,238,.34);
      background:rgba(34,211,238,.10);
      transform:translateY(-1px);
    }

    .cmd-opd-item strong{
      display:block;
      font-size:12px;
      font-weight:950;
    }

    .cmd-opd-item span{
      display:block;
      margin-top:4px;
      font-size:11px;
      color:#8fa3bd;
      max-width:260px;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }

    .cmd-opd-item em{
      min-width:34px;
      height:34px;
      border-radius:12px;
      background:rgba(255,255,255,.08);
      display:flex;
      align-items:center;
      justify-content:center;
      color:#fff;
      font-style:normal;
      font-weight:950;
    }

    .cmd-bottom-grid{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:16px;
      margin-bottom:16px;
    }

    .cmd-card{
      padding:18px;
    }

    .cmd-rank-list{
      display:flex;
      flex-direction:column;
      gap:10px;
    }

    .cmd-rank-row{
      width:100%;
      min-height:66px;
      border:none;
      border-radius:18px;
      padding:11px 12px;
      cursor:pointer;
      background:rgba(255,255,255,.055);
      border:1px solid rgba(255,255,255,.08);
      color:#eaf2ff;
      display:grid;
      grid-template-columns:34px 1fr 120px;
      align-items:center;
      gap:12px;
      text-align:left;
    }

    .cmd-rank-row:hover{
      background:rgba(34,211,238,.10);
      border-color:rgba(34,211,238,.24);
    }

    .cmd-rank-row > span{
      width:32px;
      height:32px;
      border-radius:12px;
      background:rgba(34,211,238,.10);
      color:#67e8f9;
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight:950;
    }

    .cmd-rank-row strong{
      display:block;
      font-size:13px;
      font-weight:950;
      color:#fff;
    }

    .cmd-rank-row small{
      display:block;
      margin-top:4px;
      color:#8fa3bd;
      font-size:11px;
    }

    .cmd-rank-row em{
      font-style:normal;
      text-align:right;
      color:#fff;
      font-weight:950;
      font-size:13px;
    }

    .cmd-activity-list{
      display:flex;
      flex-direction:column;
      gap:10px;
    }

    .cmd-activity-row{
      min-height:66px;
      border-radius:18px;
      padding:12px;
      background:rgba(255,255,255,.055);
      border:1px solid rgba(255,255,255,.08);
      display:grid;
      grid-template-columns:40px 1fr;
      align-items:center;
      gap:12px;
    }

    .cmd-activity-row i{
      width:40px;
      height:40px;
      border-radius:14px;
      display:flex;
      align-items:center;
      justify-content:center;
      font-style:normal;
      font-weight:950;
      color:#fff;
    }

    .cmd-activity-row i.blue{
      background:#2563eb;
    }

    .cmd-activity-row i.cyan{
      background:#0891b2;
    }

    .cmd-activity-row i.gold{
      background:#f59e0b;
    }

    .cmd-activity-row strong{
      display:block;
      color:#fff;
      font-size:13px;
      font-weight:950;
    }

    .cmd-activity-row span{
      display:block;
      margin-top:4px;
      color:#8fa3bd;
      font-size:12px;
      line-height:1.5;
    }

    .cmd-looker-section{
      padding:18px;
      margin-bottom:16px;
    }

    .cmd-open-link{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:8px;
      min-height:40px;
      padding:0 14px;
      border-radius:14px;
      text-decoration:none;
      color:#dff7ff;
      font-size:12px;
      font-weight:950;
      background:rgba(34,211,238,.10);
      border:1px solid rgba(34,211,238,.22);
    }

    .cmd-open-link:hover{
      background:rgba(34,211,238,.16);
    }

    .cmd-open-link span{
      font-size:20px;
    }

    .cmd-monitor-frame{
      height:920px;
      overflow:hidden;
      border-radius:24px;
      border:1px solid rgba(125,211,252,.18);
      background:#fff;
      box-shadow:0 18px 56px rgba(0,0,0,.22);
    }

    .cmd-monitor-frame iframe{
      width:100%;
      height:100%;
      border:0;
      display:block;
      background:#fff;
    }

    .cmd-quick-grid{
      display:grid;
      grid-template-columns:repeat(4,minmax(0,1fr));
      gap:12px;
    }

    .cmd-quick-grid .quick-card{
      background:rgba(255,255,255,.055);
      border:1px solid rgba(255,255,255,.08);
      color:#fff;
      box-shadow:none;
    }

    .cmd-quick-grid .quick-card:hover{
      transform:translateY(-1px);
      border-color:rgba(34,211,238,.26);
      box-shadow:0 16px 34px rgba(0,0,0,.22);
    }

    .cmd-quick-grid .quick-title{
      color:#fff;
    }

    .cmd-quick-grid .quick-text{
      color:#8fa3bd;
    }

    .cmd-footer{
      color:#8fa3bd;
      margin-top:16px;
    }

    .cmd-empty-mini,
    .cmd-empty-panel{
      padding:20px;
      border-radius:18px;
      background:rgba(255,255,255,.055);
      border:1px dashed rgba(255,255,255,.12);
      color:#8fa3bd;
      text-align:center;
      line-height:1.6;
    }

    .leaflet-container{
      font-family:"Inter","Segoe UI",Arial,sans-serif;
      background:#07111f;
    }

    .leaflet-control-attribution{
      font-size:10px;
    }

    @media (max-width:1280px){
      .cmd-map-section,
      .cmd-bottom-grid{
        grid-template-columns:1fr;
      }

      .cmd-kpi-grid,
      .cmd-quick-grid{
        grid-template-columns:repeat(2,minmax(0,1fr));
      }

      .cmd-map-wrap{
        height:520px;
      }
    }
  `;

  document.head.appendChild(style);
}

function loadStyleOnce(id, href) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;

    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Gagal memuat CSS ${href}`));

    document.head.appendChild(link);
  });
}

function loadScriptOnce(id, src) {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id);

    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Gagal memuat JS ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.defer = true;
    script.dataset.loaded = 'false';

    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };

    script.onerror = () => reject(new Error(`Gagal memuat JS ${src}`));

    document.body.appendChild(script);
  });
}

async function ensureLeafletReady() {
  await loadStyleOnce(
    'leaflet-css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
  );

  await loadScriptOnce(
    'leaflet-js',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
  );
}

function cmdBuildCsvUrl(gid) {
  return `https://docs.google.com/spreadsheets/d/${CMD_SHEET_CONFIG.spreadsheetId}/export?format=csv&gid=${gid}`;
}

async function cmdFetchCsv(gid) {
  const response = await fetch(cmdBuildCsvUrl(gid), {
    method: 'GET',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} saat mengambil data gid ${gid}`);
  }

  const text = await response.text();

  if (!text || !text.trim()) {
    throw new Error(`CSV kosong dari gid ${gid}`);
  }

  if (/<!doctype html>|<html/i.test(text)) {
    throw new Error('Response bukan CSV. Pastikan Google Sheet bisa diakses publik/viewer.');
  }

  return text;
}

function cmdParseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function cmdNormalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[()/%.-]/g, '')
    .replace(/__+/g, '_');
}

function cmdCsvToObjects(csvText) {
  const rows = cmdParseCsv(csvText);
  if (!rows.length) return [];

  const headers = rows[0].map(cmdNormalizeHeader);

  return rows
    .slice(1)
    .filter((row) => row.some((cell) => String(cell || '').trim() !== ''))
    .map((row) => {
      const obj = {};

      headers.forEach((header, index) => {
        obj[header] = row[index] != null ? String(row[index]).trim() : '';
      });

      return obj;
    });
}

function cmdPick(row, keys) {
  for (const key of keys) {
    if (row[key] != null && String(row[key]).trim() !== '') {
      return String(row[key]).trim();
    }
  }

  return '';
}

function cmdToNumber(value) {
  if (value == null || value === '') return 0;

  let str = String(value)
    .trim()
    .replace(/[^\d.,-]/g, '')
    .replace(/\s/g, '');

  const hasDot = str.includes('.');
  const hasComma = str.includes(',');

  if (hasDot && hasComma) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');

    if (lastComma > lastDot) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (hasComma) {
    const parts = str.split(',');

    if (parts.length === 2 && parts[1].length !== 3) {
      str = `${parts[0]}.${parts[1]}`;
    } else {
      str = parts.join('');
    }
  } else if (hasDot) {
    const parts = str.split('.');

    if (parts.length > 2 || parts[parts.length - 1].length === 3) {
      str = parts.join('');
    }
  }

  const parsed = Number(str);
  return Number.isFinite(parsed) ? parsed : 0;
}

function cmdNormalizeOpd(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

function cmdEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cmdHashText(value) {
  const text = cmdNormalizeOpd(value);
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

function cmdFallbackCoord(name) {
  const hash = cmdHashText(name);
  const latMin = -6.675;
  const latMax = -6.535;
  const lngMin = 106.735;
  const lngMax = 106.855;

  const latRatio = (hash % 1000) / 1000;
  const lngRatio = ((Math.floor(hash / 1000)) % 1000) / 1000;

  return {
    lat: latMin + ((latMax - latMin) * latRatio),
    lng: lngMin + ((lngMax - lngMin) * lngRatio),
    source: 'fallback'
  };
}

function cmdCleanSearchName(name) {
  return String(name || '')
    .replace(/\bKOTA BOGOR\b/gi, '')
    .replace(/\bPEMERINTAH\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cmdGeocodeCacheKey(name) {
  return `traxpbj_geocode_${cmdNormalizeOpd(name)}`;
}

async function cmdGeocodeOpd(name) {
  const cacheKey = cmdGeocodeCacheKey(name);

  try {
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const parsed = JSON.parse(cached);

      if (parsed && Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng)) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('cache geocode gagal dibaca:', error);
  }

  const query = `${cmdCleanSearchName(name)}, Kota Bogor, Jawa Barat, Indonesia`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=id&q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Geocode HTTP ${response.status}`);
    }

    const result = await response.json();

    if (Array.isArray(result) && result.length) {
      const first = result[0];
      const coord = {
        lat: Number(first.lat),
        lng: Number(first.lon),
        source: 'geocode'
      };

      if (Number.isFinite(coord.lat) && Number.isFinite(coord.lng)) {
        localStorage.setItem(cacheKey, JSON.stringify(coord));
        return coord;
      }
    }

    throw new Error('Lokasi tidak ditemukan');
  } catch (error) {
    const fallback = cmdFallbackCoord(name);

    try {
      localStorage.setItem(cacheKey, JSON.stringify(fallback));
    } catch (storageError) {
      console.warn('cache geocode gagal disimpan:', storageError);
    }

    return fallback;
  }
}

function cmdShortName(name) {
  const cleaned = String(name || '').trim().toUpperCase();

  const alias = [
    ['BADAN KEPEGAWAIAN DAN PENGEMBANGAN SUMBER DAYA MANUSIA', 'BKPSDM'],
    ['BADAN KESATUAN BANGSA DAN POLITIK', 'Bakesbangpol'],
    ['BADAN KEUANGAN DAN ASET DAERAH', 'BKAD'],
    ['BADAN PENDAPATAN DAERAH', 'Bapenda'],
    ['BADAN PERENCANAAN PEMBANGUNAN RISET DAN INOVASI DAERAH', 'Bapperida'],
    ['DINAS KESEHATAN', 'Dinkes'],
    ['DINAS PENDIDIKAN', 'Disdik'],
    ['DINAS PEKERJAAN UMUM DAN PENATAAN RUANG', 'PUPR'],
    ['DINAS PERUMAHAN DAN PERMUKIMAN', 'Disperumkim'],
    ['DINAS KOMUNIKASI DAN INFORMATIKA', 'Diskominfo'],
    ['DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL', 'Disdukcapil'],
    ['DINAS PERHUBUNGAN', 'Dishub'],
    ['DINAS LINGKUNGAN HIDUP', 'DLH'],
    ['SEKRETARIAT DAERAH', 'Setda'],
    ['INSPEKTORAT', 'Inspektorat'],
    ['BAGIAN PENGADAAN BARANG DAN JASA', 'BPBJ']
  ];

  const found = alias.find((item) => cleaned.includes(item[0]));

  if (found) return found[1];

  return String(name || '')
    .replace(/^DINAS\s+/i, '')
    .replace(/^BADAN\s+/i, '')
    .replace(/^BAGIAN\s+/i, '')
    .replace(/^KECAMATAN\s+/i, 'Kec. ')
    .split(' ')
    .slice(0, 3)
    .join(' ');
}

function cmdRiskFromScore(score, percent) {
  const nilai = Number(score || 0);
  const persen = Number(percent || 0);

  if (nilai >= 9 && persen >= 90) return 'low';
  if (nilai >= 6 && persen >= 60) return 'medium';
  return 'high';
}

function cmdRiskLabel(risk) {
  if (risk === 'low') return 'Stabil';
  if (risk === 'medium') return 'Perlu Atensi';
  return 'Tindak Lanjut';
}

function cmdRiskClass(risk) {
  if (risk === 'low') return 'risk-low';
  if (risk === 'medium') return 'risk-medium';
  return 'risk-high';
}

function cmdFormatNumber(value) {
  return Number(value || 0).toLocaleString('id-ID');
}

function cmdFormatPercent(value) {
  return Number(value || 0).toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function cmdFormatRup(value) {
  const num = Number(value || 0);

  if (num >= 1_000_000_000_000) {
    return `Rp${(num / 1_000_000_000_000).toLocaleString('id-ID', {
      maximumFractionDigits: 2
    })} T`;
  }

  if (num >= 1_000_000_000) {
    return `Rp${(num / 1_000_000_000).toLocaleString('id-ID', {
      maximumFractionDigits: 2
    })} M`;
  }

  if (num >= 1_000_000) {
    return `Rp${(num / 1_000_000).toLocaleString('id-ID', {
      maximumFractionDigits: 2
    })} Jt`;
  }

  return `Rp${num.toLocaleString('id-ID')}`;
}

function cmdDominantMethod(rows) {
  const count = {};

  rows.forEach((row) => {
    const metode = row.metode_pemilihan || 'Tidak Terisi';
    count[metode] = (count[metode] || 0) + 1;
  });

  const sorted = Object.entries(count).sort((a, b) => b[1] - a[1]);

  return sorted.length ? sorted[0][0] : '-';
}

function cmdBuildRows(rawRows, scoreRows) {
  const raw = rawRows.map((row) => ({
    satuan_kerja: cmdPick(row, ['satuan_kerja']),
    kode_rup: cmdPick(row, ['kode_rup']),
    nama_paket: cmdPick(row, ['nama_paket']),
    pagu_anggaran: cmdToNumber(cmdPick(row, ['pagu_anggaran'])),
    metode_pemilihan: cmdPick(row, ['metode_pemilihan']),
    sumber_dana: cmdPick(row, ['sumber_dana']),
    waktu_pemilihan: cmdPick(row, ['waktu_pemilihan'])
  })).filter((row) => row.satuan_kerja);

  const score = scoreRows.map((row) => ({
    satuan_kerja: cmdPick(row, ['satuan_kerja']),
    penyedia_diumumkan: cmdToNumber(cmdPick(row, ['penyedia_diumumkan'])),
    swakelola_diumumkan: cmdToNumber(cmdPick(row, ['swakelola_diumumkan'])),
    total_rup_diumumkan: cmdToNumber(cmdPick(row, ['total_rup_diumumkan'])),
    total_komitmen: cmdToNumber(cmdPick(row, ['total_komitmen'])),
    prosentase: cmdToNumber(cmdPick(row, ['prosentase'])),
    nilai_itkp: cmdToNumber(cmdPick(row, ['nilai_itkp']))
  })).filter((row) => row.satuan_kerja);

  const rawByOpd = {};

  raw.forEach((row) => {
    const key = cmdNormalizeOpd(row.satuan_kerja);

    if (!rawByOpd[key]) {
      rawByOpd[key] = [];
    }

    rawByOpd[key].push(row);
  });

  return score.map((scoreRow) => {
    const key = cmdNormalizeOpd(scoreRow.satuan_kerja);
    const rawOpdRows = rawByOpd[key] || [];
    const risk = cmdRiskFromScore(scoreRow.nilai_itkp, scoreRow.prosentase);

    return {
      id: key.replace(/\s+/g, '-'),
      name: scoreRow.satuan_kerja,
      shortName: cmdShortName(scoreRow.satuan_kerja),
      lat: null,
      lng: null,
      geocodeSource: 'pending',
      paket: rawOpdRows.length,
      totalPaguRaw: rawOpdRows.reduce((acc, row) => acc + Number(row.pagu_anggaran || 0), 0),
      metodeDominan: cmdDominantMethod(rawOpdRows),
      penyedia: scoreRow.penyedia_diumumkan,
      swakelola: scoreRow.swakelola_diumumkan,
      totalRup: scoreRow.total_rup_diumumkan,
      totalKomitmen: scoreRow.total_komitmen,
      prosentase: scoreRow.prosentase,
      nilaiItkp: scoreRow.nilai_itkp,
      risk,
      rawRows: rawOpdRows
    };
  }).sort((a, b) => {
    if (b.nilaiItkp !== a.nilaiItkp) return b.nilaiItkp - a.nilaiItkp;
    return b.totalRup - a.totalRup;
  });
}

async function cmdLoadData() {
  if (CMD_STATE.loading) return;
  if (CMD_STATE.loaded) return;

  CMD_STATE.loading = true;
  CMD_STATE.error = '';

  try {
    const [rawCsv, scoreCsv] = await Promise.all([
      cmdFetchCsv(CMD_SHEET_CONFIG.rawSirupGid),
      cmdFetchCsv(CMD_SHEET_CONFIG.scoreSirupGid)
    ]);

    const rawRows = cmdCsvToObjects(rawCsv);
    const scoreRows = cmdCsvToObjects(scoreCsv);

    CMD_STATE.rows = cmdBuildRows(rawRows, scoreRows);

    if (!CMD_STATE.selectedId && CMD_STATE.rows.length) {
      CMD_STATE.selectedId = CMD_STATE.rows[0].id;
    }

    CMD_STATE.loaded = true;
  } catch (error) {
    console.error('cmdLoadData error:', error);
    CMD_STATE.error = error.message || 'Data gagal dimuat.';
  } finally {
    CMD_STATE.loading = false;
  }
}

async function cmdResolveLocations() {
  const rows = CMD_STATE.rows.filter((row) => !Number.isFinite(row.lat) || !Number.isFinite(row.lng));

  for (const row of rows) {
    const coord = await cmdGeocodeOpd(row.name);

    row.lat = coord.lat;
    row.lng = coord.lng;
    row.geocodeSource = coord.source;

    cmdRenderMarkers();
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
}

function cmdSummary() {
  const rows = CMD_STATE.rows;
  const totalOpd = rows.length;
  const totalPaket = rows.reduce((acc, row) => acc + Number(row.paket || 0), 0);
  const totalRup = rows.reduce((acc, row) => acc + Number(row.totalRup || 0), 0);
  const avgItkp = rows.length
    ? rows.reduce((acc, row) => acc + Number(row.nilaiItkp || 0), 0) / rows.length
    : 0;
  const avgPercent = rows.length
    ? rows.reduce((acc, row) => acc + Number(row.prosentase || 0), 0) / rows.length
    : 0;

  return {
    totalOpd,
    totalPaket,
    totalRup,
    avgItkp,
    avgPercent
  };
}

function cmdSelectedRow() {
  return CMD_STATE.rows.find((row) => row.id === CMD_STATE.selectedId) || CMD_STATE.rows[0] || null;
}

function cmdTopRupRows(limit = 6) {
  return [...CMD_STATE.rows]
    .sort((a, b) => b.totalRup - a.totalRup)
    .slice(0, limit);
}

function cmdRenderSelectedPanel() {
  const row = cmdSelectedRow();

  if (!row) {
    return `
      <div class="cmd-empty-panel">
        Data OPD belum dimuat.
      </div>
    `;
  }

  const locationStatus = row.geocodeSource === 'geocode'
    ? 'Lokasi hasil pencarian online'
    : row.geocodeSource === 'fallback'
      ? 'Lokasi perkiraan sekitar Kota Bogor'
      : 'Lokasi sedang dicari';

  return `
    <div class="cmd-panel-top">
      <div>
        <div class="cmd-panel-kicker">OPD Terpilih</div>
        <h4>${cmdEscape(row.shortName)}</h4>
        <p>${cmdEscape(row.name)}</p>
      </div>

      <div class="cmd-score-orb ${cmdRiskClass(row.risk)}">
        <span>${cmdFormatNumber(row.nilaiItkp)}</span>
        <small>ITKP</small>
      </div>
    </div>

    <div class="cmd-status-row">
      <span class="cmd-status-pill ${cmdRiskClass(row.risk)}">${cmdRiskLabel(row.risk)}</span>
      <span>${cmdFormatPercent(row.prosentase)}% SIRUP</span>
    </div>

    <div class="cmd-metrics-grid">
      <div class="cmd-metric">
        <label>Jumlah Paket</label>
        <strong>${cmdFormatNumber(row.paket)}</strong>
      </div>

      <div class="cmd-metric">
        <label>Total RUP</label>
        <strong>${cmdFormatRup(row.totalRup)}</strong>
      </div>

      <div class="cmd-metric">
        <label>Komitmen</label>
        <strong>${cmdFormatRup(row.totalKomitmen)}</strong>
      </div>

      <div class="cmd-metric">
        <label>Raw Pagu</label>
        <strong>${cmdFormatRup(row.totalPaguRaw)}</strong>
      </div>
    </div>

    <div class="cmd-progress-block">
      <div class="cmd-progress-head">
        <span>Capaian Pengumuman SIRUP</span>
        <b>${cmdFormatPercent(row.prosentase)}%</b>
      </div>
      <div class="cmd-progress-track">
        <i style="width:${Math.min(100, Number(row.prosentase || 0))}%"></i>
      </div>
    </div>

    <div class="cmd-method-box">
      <span>Metode Dominan</span>
      <strong>${cmdEscape(row.metodeDominan)}</strong>
      <span style="margin-top:10px;">Status Lokasi</span>
      <strong>${cmdEscape(locationStatus)}</strong>
    </div>

    <div class="cmd-actions">
      <button type="button" class="cmd-btn primary" data-cmd-route="monitoring-sirup">
        Buka ITKP SIRUP
      </button>
      <button type="button" class="cmd-btn ghost" data-cmd-route="monitoring-perencanaan">
        Perencanaan
      </button>
    </div>
  `;
}

function cmdRenderOpdList() {
  if (!CMD_STATE.rows.length) {
    return `
      <div class="cmd-empty-mini">
        Belum ada data OPD.
      </div>
    `;
  }

  return CMD_STATE.rows.slice(0, 24).map((row) => {
    const active = row.id === CMD_STATE.selectedId ? ' active' : '';

    return `
      <button type="button" class="cmd-opd-item${active}" data-cmd-opd="${cmdEscape(row.id)}">
        <div>
          <strong>${cmdEscape(row.shortName)}</strong>
          <span>${cmdEscape(row.name)}</span>
        </div>
        <em>${cmdFormatNumber(row.nilaiItkp)}</em>
      </button>
    `;
  }).join('');
}

function cmdRenderTopRupRows() {
  const rows = cmdTopRupRows(6);

  if (!rows.length) {
    return `
      <div class="cmd-empty-mini">
        Belum ada data.
      </div>
    `;
  }

  return rows.map((row, index) => `
    <button type="button" class="cmd-rank-row" data-cmd-opd="${cmdEscape(row.id)}">
      <span>${index + 1}</span>
      <div>
        <strong>${cmdEscape(row.shortName)}</strong>
        <small>${cmdFormatNumber(row.paket)} paket • ${cmdEscape(row.metodeDominan)}</small>
      </div>
      <em>${cmdFormatRup(row.totalRup)}</em>
    </button>
  `).join('');
}

function cmdRenderActivityRows() {
  const summary = cmdSummary();
  const uniqueScore = [...new Set(CMD_STATE.rows.map((row) => Number(row.nilaiItkp || 0)))];
  const optimalText = uniqueScore.length === 1 && uniqueScore[0] >= 10
    ? 'Seluruh OPD berada pada capaian ITKP optimal.'
    : 'Terdapat variasi capaian ITKP antar OPD.';

  return `
    <div class="cmd-activity-row">
      <i class="blue">✓</i>
      <div>
        <strong>Data SCORE_ITKP_SIRUP berhasil dimuat</strong>
        <span>${cmdFormatNumber(summary.totalOpd)} OPD terbaca dari data rekap.</span>
      </div>
    </div>

    <div class="cmd-activity-row">
      <i class="cyan">◎</i>
      <div>
        <strong>RAW_SIRUP berhasil dihitung</strong>
        <span>${cmdFormatNumber(summary.totalPaket)} paket termonitor dari data mentah.</span>
      </div>
    </div>

    <div class="cmd-activity-row">
      <i class="gold">!</i>
      <div>
        <strong>Status capaian ITKP</strong>
        <span>${optimalText}</span>
      </div>
    </div>
  `;
}

function cmdRenderDashboardShell() {
  const summary = cmdSummary();

  if (CMD_STATE.error) {
    return `
      <section class="cmd-dashboard">
        <div class="cmd-error-card">
          <h3>Dashboard gagal memuat data</h3>
          <p>${cmdEscape(CMD_STATE.error)}</p>
          <button type="button" class="cmd-btn primary" id="cmdRetryLoad">Muat Ulang</button>
        </div>
      </section>
    `;
  }

  if (!CMD_STATE.loaded) {
    return `
      <section class="cmd-dashboard">
        <div class="cmd-loading-screen">
          <div class="cmd-loading-orb"></div>
          <h3>Memuat TRAXPBJ Command Center</h3>
          <p>Mengambil data dari RAW_SIRUP dan SCORE_ITKP_SIRUP...</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="cmd-dashboard">
      <section class="cmd-hero">
        <div class="cmd-hero-left">
          <div class="cmd-kicker">
            <span></span>
            TRAXPBJ EXECUTIVE COMMAND CENTER
          </div>

          <h3>Procurement Intelligence Kota Bogor</h3>

          <p>
            Dashboard premium berbasis data SiRUP dan ITKP untuk memantau performa pengadaan,
            komitmen, paket, lokasi OPD, dan capaian perangkat daerah secara interaktif.
          </p>
        </div>

        <div class="cmd-hero-right">
          <div class="cmd-live-chip">
            <i></i>
            LIVE DATA
          </div>
          <div class="cmd-date">RAW_SIRUP • SCORE_ITKP_SIRUP • LOCATION SEARCH</div>
        </div>
      </section>

      <section class="cmd-kpi-grid">
        <div class="cmd-kpi-card accent-blue">
          <div class="cmd-kpi-label">Jumlah OPD</div>
          <div class="cmd-kpi-value">${cmdFormatNumber(summary.totalOpd)}</div>
          <div class="cmd-kpi-desc">OPD pada rekap ITKP SIRUP</div>
        </div>

        <div class="cmd-kpi-card accent-cyan">
          <div class="cmd-kpi-label">Jumlah Paket</div>
          <div class="cmd-kpi-value">${cmdFormatNumber(summary.totalPaket)}</div>
          <div class="cmd-kpi-desc">Paket pada RAW_SIRUP</div>
        </div>

        <div class="cmd-kpi-card accent-gold">
          <div class="cmd-kpi-label">Total RUP</div>
          <div class="cmd-kpi-value">${cmdFormatRup(summary.totalRup)}</div>
          <div class="cmd-kpi-desc">Akumulasi RUP diumumkan</div>
        </div>

        <div class="cmd-kpi-card accent-green">
          <div class="cmd-kpi-label">Rata-rata ITKP</div>
          <div class="cmd-kpi-value">${cmdFormatNumber(summary.avgItkp)}</div>
          <div class="cmd-kpi-desc">${cmdFormatPercent(summary.avgPercent)}% rata-rata pengumuman</div>
        </div>
      </section>

      <section class="cmd-map-section">
        <div class="cmd-map-card">
          <div class="cmd-section-head">
            <div>
              <h3>Interactive OPD Location Map</h3>
              <p>Peta mengambil titik lokasi berdasarkan nama OPD dan menampilkan data asli dari sheet monitoring.</p>
            </div>

            <div class="cmd-map-legend">
              <span><i class="risk-low"></i> Stabil</span>
              <span><i class="risk-medium"></i> Perlu Atensi</span>
              <span><i class="risk-high"></i> Tindak Lanjut</span>
            </div>
          </div>

          <div class="cmd-map-wrap">
            <div id="cmdLeafletMap"></div>
            <div class="cmd-map-overlay"></div>
            <div class="cmd-map-badge">
              <i></i>
              Kota Bogor • OPD Location Intelligence
            </div>
          </div>
        </div>

        <aside class="cmd-side-panel">
          <div class="cmd-selected-panel" id="cmdSelectedPanel">
            ${cmdRenderSelectedPanel()}
          </div>

          <div class="cmd-opd-list-card">
            <div class="cmd-side-title">
              <span>Daftar OPD</span>
              <b>${cmdFormatNumber(CMD_STATE.rows.length)}</b>
            </div>

            <div class="cmd-opd-list" id="cmdOpdList">
              ${cmdRenderOpdList()}
            </div>
          </div>
        </aside>
      </section>

      <section class="cmd-bottom-grid">
        <div class="cmd-card">
          <div class="cmd-section-head compact">
            <div>
              <h3>Top OPD Berdasarkan Total RUP</h3>
              <p>Ranking dari SCORE_ITKP_SIRUP.</p>
            </div>
          </div>

          <div class="cmd-rank-list" id="cmdRankList">
            ${cmdRenderTopRupRows()}
          </div>
        </div>

        <div class="cmd-card">
          <div class="cmd-section-head compact">
            <div>
              <h3>Status Data</h3>
              <p>Hasil pembacaan sheet aktif.</p>
            </div>
          </div>

          <div class="cmd-activity-list">
            ${cmdRenderActivityRows()}
          </div>
        </div>
      </section>

      <section class="cmd-looker-section">
        <div class="cmd-section-head">
          <div>
            <h3>Dashboard ITKP Kota Bogor 2026</h3>
            <p>Looker Studio tetap ditampilkan sebagai monitor visual utama.</p>
          </div>

          <a
            class="cmd-open-link"
            href="https://datastudio.google.com/reporting/d940ac07-c54f-4ff8-af5e-36424698d5a2/page/ycoYF"
            target="_blank"
            rel="noopener noreferrer"
          >
            Buka Looker Studio
            <span>›</span>
          </a>
        </div>

        <div class="cmd-monitor-frame">
          <iframe
            src="https://datastudio.google.com/embed/reporting/d940ac07-c54f-4ff8-af5e-36424698d5a2/page/ycoYF"
            frameborder="0"
            allowfullscreen
            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox">
          </iframe>
        </div>
      </section>

      <section class="cmd-card">
        <div class="cmd-section-head compact">
          <div>
            <h3>Akses Cepat</h3>
            <p>Masuk ke modul utama TRAXPBJ.</p>
          </div>
        </div>

        <div class="cmd-quick-grid">
          ${renderQuickCard('📊', 'linear-gradient(135deg,#1d4ed8,#22d3ee)', 'ITKP - SIRUP', 'Monitoring indikator ITKP dari modul SIRUP.', 'monitoring-sirup')}
          ${renderQuickCard('📋', 'linear-gradient(135deg,#123a72,#3b82f6)', 'Monitoring Perencanaan', 'Pantau progres paket perangkat daerah.', 'monitoring-perencanaan')}
          ${renderQuickCard('🧾', 'linear-gradient(135deg,#0f766e,#22c55e)', 'Rapor PBJ', 'Lihat laporan rapor kinerja PBJ.', 'rapor-pbj')}
          ${renderQuickCard('🗓️', 'linear-gradient(135deg,#111827,#2563eb)', 'Simulasi Timeline', 'Simulasikan jadwal pengadaan.', 'simulasi-timeline')}
        </div>
      </section>

      <div class="footer-note cmd-footer">
        © 2026 TRAXPBJ - Executive Procurement Intelligence Dashboard
      </div>
    </section>
  `;
}

function cmdRefreshPanels() {
  const selectedPanel = document.getElementById('cmdSelectedPanel');
  const opdList = document.getElementById('cmdOpdList');
  const rankList = document.getElementById('cmdRankList');

  if (selectedPanel) selectedPanel.innerHTML = cmdRenderSelectedPanel();
  if (opdList) opdList.innerHTML = cmdRenderOpdList();
  if (rankList) rankList.innerHTML = cmdRenderTopRupRows();

  cmdBindEvents();
}

function cmdCreateMarker(row) {
  const active = row.id === CMD_STATE.selectedId ? ' active' : '';
  const riskClass = cmdRiskClass(row.risk);
  const icon = L.divIcon({
    className: '',
    html: `<div class="cmd-marker ${riskClass}${active}"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  const marker = L.marker([row.lat, row.lng], { icon });

  marker.bindPopup(`
    <div class="cmd-popup">
      <strong>${cmdEscape(row.shortName)}</strong>
      <span>${cmdEscape(row.name)}</span>
      <span>${cmdFormatNumber(row.paket)} paket • ITKP ${cmdFormatNumber(row.nilaiItkp)}</span>
    </div>
  `);

  marker.on('click', () => {
    CMD_STATE.selectedId = row.id;
    cmdRefreshPanels();
    cmdRenderMarkers();

    if (CMD_STATE.map) {
      CMD_STATE.map.flyTo([row.lat, row.lng], 14, {
        animate: true,
        duration: 0.8
      });
    }
  });

  return marker;
}

function cmdRenderMarkers() {
  if (!CMD_STATE.map || !window.L) return;

  CMD_STATE.markers.forEach((marker) => {
    marker.remove();
  });

  CMD_STATE.markers = [];

  CMD_STATE.rows.forEach((row) => {
    if (!Number.isFinite(row.lat) || !Number.isFinite(row.lng)) return;

    const marker = cmdCreateMarker(row);
    marker.addTo(CMD_STATE.map);
    CMD_STATE.markers.push(marker);
  });
}

async function cmdInitMap() {
  if (!CMD_STATE.loaded || !CMD_STATE.rows.length) return;

  await ensureLeafletReady();

  const mapEl = document.getElementById('cmdLeafletMap');
  if (!mapEl) return;

  if (CMD_STATE.map) {
    CMD_STATE.map.remove();
    CMD_STATE.map = null;
    CMD_STATE.markers = [];
  }

  CMD_STATE.map = L.map(mapEl, {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView([-6.5971, 106.8060], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(CMD_STATE.map);

  cmdRenderMarkers();

  setTimeout(() => {
    if (CMD_STATE.map) {
      CMD_STATE.map.invalidateSize();
    }
  }, 250);
}

function cmdBindEvents() {
  contentArea.querySelectorAll('[data-cmd-opd]').forEach((button) => {
    button.onclick = () => {
      CMD_STATE.selectedId = button.dataset.cmdOpd;
      cmdRefreshPanels();
      cmdRenderMarkers();

      const row = cmdSelectedRow();

      if (row && CMD_STATE.map && Number.isFinite(row.lat) && Number.isFinite(row.lng)) {
        CMD_STATE.map.flyTo([row.lat, row.lng], 14, {
          animate: true,
          duration: 0.8
        });
      }
    };
  });

  contentArea.querySelectorAll('[data-cmd-route]').forEach((button) => {
    button.onclick = () => loadPage(button.dataset.cmdRoute);
  });

  contentArea.querySelectorAll('[data-quick]').forEach((item) => {
    item.onclick = () => loadPage(item.dataset.quick);
  });

  const retry = document.getElementById('cmdRetryLoad');

  if (retry) {
    retry.onclick = async () => {
      CMD_STATE.loaded = false;
      CMD_STATE.loading = false;
      CMD_STATE.error = '';
      CMD_STATE.rows = [];
      CMD_STATE.selectedId = '';

      renderDashboard();
    };
  }
}

async function cmdHydrateDashboard() {
  if (!CMD_STATE.loaded && !CMD_STATE.loading) {
    await cmdLoadData();

    contentArea.innerHTML = cmdRenderDashboardShell();
    cmdBindEvents();

    if (CMD_STATE.loaded) {
      await cmdInitMap();

      CMD_STATE.rows.forEach((row) => {
        const fallback = cmdFallbackCoord(row.name);
        row.lat = fallback.lat;
        row.lng = fallback.lng;
        row.geocodeSource = 'fallback';
      });

      cmdRenderMarkers();

      cmdResolveLocations().then(() => {
        cmdRefreshPanels();
        cmdRenderMarkers();
      });
    }
  }
}

function renderDashboard() {
  injectCommandDashboardCss();

  contentArea.innerHTML = cmdRenderDashboardShell();
  cmdBindEvents();
  cmdHydrateDashboard();
}

function renderIframePage(page) {
  contentArea.innerHTML = `
    <section class="embed-card">
      <h3>${page.title}</h3>
      <div class="page-note">Halaman dimuat dari project/modul yang sudah ada.</div>
      <div class="embed-frame-wrap">
        <iframe
          class="embed-frame"
          src="${page.url}"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade">
        </iframe>
      </div>
    </section>
  `;
}

function renderPlaceholderPage(pageKey, page) {
  contentArea.innerHTML = `
    <section class="card">
      <h3>${page.title}</h3>
      <div class="placeholder-grid">
        <div class="placeholder-box">
          <h4>Modul belum dihubungkan</h4>
          <p>Halaman ini sudah disiapkan di portal utama. Nanti saat project GitHub/halaman monitoring selesai, tinggal isi URL atau module path di file <b>app.js</b>.</p>
        </div>
        <div class="placeholder-box">
          <h4>Langkah berikutnya</h4>
          <p>Cari route <b>${pageKey}</b> pada objek <b>APP_ROUTES</b>, lalu ubah <b>type</b> menjadi <b>iframe</b> atau <b>module</b>.</p>
        </div>
      </div>
    </section>
  `;
}

function renderDimension(name, value) {
  return `
    <div class="dim-row">
      <div>${name}</div>
      <div class="bar"><span style="width:${value}%"></span></div>
      <div>${value.toFixed(2).replace('.', ',')}%</div>
    </div>
  `;
}

function renderActivity(color, icon, title, text, time) {
  return `
    <div class="activity-item">
      <div class="activity-icon" style="background:${color}">${icon}</div>
      <div>
        <div class="activity-title">${title}</div>
        <div class="activity-text">${text}</div>
      </div>
      <div class="activity-time">${time}</div>
    </div>
  `;
}

function renderQuickCard(icon, bg, title, text, route) {
  return `
    <button class="quick-card" type="button" data-quick="${route}">
      <div class="quick-icon" style="background:${bg}">${icon}</div>
      <div>
        <div class="quick-title">${title}</div>
        <div class="quick-text">${text}</div>
      </div>
      <div class="quick-arrow">›</div>
    </button>
  `;
}

function updateActiveMenu(key) {
  document.querySelectorAll('.nav-link, .submenu-link').forEach((el) => {
    el.classList.remove('active');
  });

  const directButton = document.querySelector(`.nav-link[data-page="${key}"]`);
  const subButton = document.querySelector(`.submenu-link[data-page="${key}"]`);

  if (directButton) {
    directButton.classList.add('active');
  }

  if (subButton) {
    subButton.classList.add('active');

    const group = subButton.closest('.nav-group');

    if (group) {
      group.classList.add('open');
    }
  }
}

function closeFlyout() {
  if (activeFlyout) {
    activeFlyout.remove();
    activeFlyout = null;
  }
}

function cleanupDynamicModule() {
  closeFlyout();

  if (CMD_STATE.map) {
    CMD_STATE.map.remove();
    CMD_STATE.map = null;
    CMD_STATE.markers = [];
  }

  if (typeof currentModuleDestroy === 'function') {
    try {
      currentModuleDestroy();
    } catch (err) {
      console.error('Gagal destroy module lama:', err);
    }
  }

  currentModuleDestroy = null;
  window.__moduleInit = undefined;

  document.querySelectorAll('[data-dynamic-module-css]').forEach((el) => el.remove());
  document.querySelectorAll('[data-dynamic-module-js]').forEach((el) => el.remove());
}

function loadExternalScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-dynamic-external-script="true"][src="${src}"]`);

    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Gagal memuat ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.dynamicExternalScript = 'true';
    script.dataset.loaded = 'false';

    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };

    script.onerror = () => reject(new Error(`Gagal memuat ${src}`));

    document.body.appendChild(script);
  });
}

async function renderModulePage(page) {
  const token = ++activeModuleToken;
  cleanupDynamicModule();

  try {
    if (Array.isArray(page.externalScripts) && page.externalScripts.length) {
      for (const src of page.externalScripts) {
        await loadExternalScriptOnce(src);
      }
    }

    const response = await fetch(page.html, { cache: 'no-cache' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} saat memuat ${page.html}`);
    }

    const rawHtml = await response.text();

    if (token !== activeModuleToken) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    const moduleContent = doc.body && doc.body.innerHTML.trim()
      ? doc.body.innerHTML
      : rawHtml;

    contentArea.innerHTML = `
      <section class="module-page module-page--native">
        ${moduleContent}
      </section>
    `;

    await new Promise((resolve) => requestAnimationFrame(resolve));

    if (token !== activeModuleToken) return;

    if (page.css) {
      await new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${page.css}?v=${Date.now()}`;
        link.setAttribute('data-dynamic-module-css', 'true');

        link.onload = resolve;
        link.onerror = () => reject(new Error(`Gagal memuat CSS ${page.css}`));

        document.head.appendChild(link);
      });
    }

    if (token !== activeModuleToken) return;

    if (page.js) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${page.js}?v=${Date.now()}`;
        script.defer = true;
        script.setAttribute('data-dynamic-module-js', 'true');

        script.onload = resolve;
        script.onerror = () => reject(new Error(`Gagal memuat JS ${page.js}`));

        document.body.appendChild(script);
      });
    }

    if (token !== activeModuleToken) return;

    if (typeof window.__moduleInit === 'function') {
      const destroyFn = window.__moduleInit({
        container: contentArea,
        route: page
      });

      currentModuleDestroy = typeof destroyFn === 'function' ? destroyFn : null;
    } else {
      currentModuleDestroy = null;
    }
  } catch (error) {
    console.error('Gagal memuat module:', error);

    contentArea.innerHTML = `
      <section class="card">
        <h3>Gagal memuat modul</h3>
        <p>File modul tidak bisa dimuat. Cek path HTML, CSS, JS, atau inisialisasi modul.</p>
        <p><b>Detail:</b> ${error.message}</p>
      </section>
    `;
  }
}

async function loadPage(key) {
  const page = APP_ROUTES[key] || APP_ROUTES.dashboard;
  updateActiveMenu(key);

  if (page.type !== 'module') {
    cleanupDynamicModule();
    contentArea.classList.remove('module-mode');
  } else {
    contentArea.classList.add('module-mode');
  }

  if (page.type === 'iframe') {
    renderIframePage(page);
  } else if (page.type === 'module') {
    await renderModulePage(page);
  } else if (page.type === 'placeholder') {
    renderPlaceholderPage(key, page);
  } else {
    renderDashboard();
  }

  if (window.innerWidth <= 980 && sidebar) {
    sidebar.classList.remove('mobile-open');
  }
}

function bindMenu() {
  document.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => loadPage(button.dataset.page));
  });

  document.querySelectorAll('[data-toggle-group]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const groupName = button.dataset.toggleGroup;
      const group = document.querySelector(`.nav-group[data-group="${groupName}"]`);

      if (!group) return;

      if (sidebar && sidebar.classList.contains('collapsed') && window.innerWidth > 980) {
        event.preventDefault();
        toggleFlyout(button, groupName);
        return;
      }

      group.classList.toggle('open');
    });
  });

  if (sidebarToggleButton && sidebar) {
    sidebarToggleButton.addEventListener('click', () => {
      if (window.innerWidth <= 980) {
        sidebar.classList.toggle('mobile-open');
      } else {
        sidebar.classList.toggle('collapsed');
        closeFlyout();
      }
    });
  }

  document.addEventListener('click', (event) => {
    if (!activeFlyout) return;

    const clickedInsideFlyout = activeFlyout.contains(event.target);
    const clickedToggle = event.target.closest('[data-toggle-group]');

    if (!clickedInsideFlyout && !clickedToggle) {
      closeFlyout();
    }
  });

  window.addEventListener('resize', () => {
    closeFlyout();

    if (window.innerWidth > 980 && sidebar) {
      sidebar.classList.remove('mobile-open');
    }

    if (CMD_STATE.map) {
      setTimeout(() => {
        CMD_STATE.map.invalidateSize();
      }, 200);
    }
  });
}

function toggleFlyout(toggleButton, groupName) {
  if (!toggleButton) return;

  if (activeFlyout && activeFlyout.dataset.group === groupName) {
    closeFlyout();
    return;
  }

  closeFlyout();

  const group = document.querySelector(`.nav-group[data-group="${groupName}"]`);

  if (!group) return;

  const submenuLinks = group.querySelectorAll('.submenu-link');

  if (!submenuLinks.length) return;

  const flyout = document.createElement('div');
  flyout.className = 'sidebar-flyout';
  flyout.dataset.group = groupName;

  const titleMap = {
    monitoring: 'Monitoring',
    simulasi: 'Simulasi'
  };

  flyout.innerHTML = `
    <div class="sidebar-flyout-title">${titleMap[groupName] || 'Menu'}</div>
    ${Array.from(submenuLinks).map((link) => {
      const isActive = link.classList.contains('active') ? ' active' : '';

      return `
        <button class="flyout-link${isActive}" type="button" data-page="${link.dataset.page}">
          ${link.textContent}
        </button>
      `;
    }).join('')}
  `;

  document.body.appendChild(flyout);

  const rect = toggleButton.getBoundingClientRect();

  flyout.style.top = `${rect.top}px`;
  flyout.style.left = `${rect.right + 12}px`;

  flyout.querySelectorAll('[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeFlyout();
      loadPage(btn.dataset.page);
    });
  });

  activeFlyout = flyout;
}

bindMenu();
loadPage('dashboard');