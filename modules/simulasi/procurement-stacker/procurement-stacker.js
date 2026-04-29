const c=document.getElementById('game'),x=c.getContext('2d');x.imageSmoothingEnabled=false;
const qnum=document.getElementById('qnum'),qtitle=document.getElementById('qtitle'),qstory=document.getElementById('qstory'),qhint=document.getElementById('qhint'),progress=document.getElementById('progress'),score=document.getElementById('score'),route=document.getElementById('route'),toast=document.getElementById('toast'),modal=document.getElementById('modal'),mtitle=document.getElementById('mtitle'),mbody=document.getElementById('mbody');
document.getElementById('close').onclick=()=>modal.classList.add('hidden'); document.getElementById('focusBtn').onclick=focusQuest;
const img={}; ['serene','player_run','player_idle','panji_idle'].forEach(n=>{img[n]=new Image();img[n].src='assets/'+n+'.png';});
const W=4200,H=3000,S=3; let keys={},cam={x:0,y:0},loaded=false,scoreVal=0,q=0,done=new Set(),near=null,frame=0;
const player={x:2050,y:1500,w:46,h:70,sp:4.2,dir:1,walk:0};
const quests=[
 ['panji','Temui PANJI di Plaza Tengah','Halo bro. Ini bukan map asal lagi. Ini Kota Akademi Konsolidasi, pakai asset rumah dan pohon yang lu kirim. Dari sini kita jalani cerita konsolidasi ATK Kota Bogor dari hulu sampai e-Purchasing.','Datangi PANJI di plaza tengah.'],
 ['ident','Identifikasi Kebutuhan','Tahap pertama: baca data SiRUP dan konfirmasi data OPD. Dari sini ketemu kebutuhan rutin seperti HVS, tinta printer, dan ballpoint.','Pergi ke Gedung Identifikasi.'],
 ['pasar','Pendalaman Pasar dan Proses Bisnis','Jangan langsung tender. Kita cek pasar dulu: kapasitas penyedia, pasokan, distribusi, tren harga, dan kesiapan katalog. Market sounding itu penjajakan, bukan penunjukan pemenang.','Masuk ke Aula Market Sounding.'],
 ['tim','Persiapan Penyelenggaraan Konsolidasi','Setelah data dan pasar jelas, siapkan payung hukum dan Tim Konsolidasi. Biar alurnya punya komando, bukan cuma ide bagus di kertas.','Datangi Balai Tim Konsolidasi.'],
 ['dok','Persiapan Pelaksanaan Konsolidasi','Di tahap ini dokumen teknis dirapikan: KAK, spesifikasi, HPS/referensi harga, dan draft kontrak payung.','Pergi ke Lab KAK-HPS.'],
 ['pemilihan','Pelaksanaan Konsolidasi','Alurnya: pengumuman minimal 5 hari, pendaftaran, penjelasan bila perlu, penawaran, pemeriksaan kualifikasi, evaluasi-klarifikasi-negosiasi, lalu pengumuman hasil.','Pergi ke Gedung Pemilihan Penyedia.'],
 ['payung','Penandatanganan Kontrak Payung','Hasil pemilihan tidak berhenti di pengumuman. Harus difinalkan dan ditandatangani dalam kontrak payung. Bisa satu atau lebih pemenang.','Pergi ke Kantor Kontrak Payung.'],
 ['katalog','Pencantuman dalam Katalog Elektronik','Produk hasil konsolidasi harus tayang di Katalog Elektronik agar OPD punya jalur belanja yang sama.','Pergi ke Menara Katalog.'],
 ['ep','E-Purchasing OPD','OPD belanja lewat e-Purchasing berdasarkan hasil konsolidasi. Di sini manfaat konsolidasi mulai kelihatan: lebih tertib, lebih mudah dipantau.','Pergi ke Plaza e-Purchasing.'],
 ['tantangan','Evaluasi Tantangan Konsolidasi','Tantangan utama: data kebutuhan, pemahaman pasar, pembentukan harga, kepastian anggaran, skema pemilihan, penggunaan katalog, SDM dan komitmen pimpinan.','Datangi Aula Evaluasi.']
];
const sites=[
 {id:'panji',name:'PANJI',x:2050,y:1500,type:'npc'},
 {id:'ident',name:'1. Identifikasi Kebutuhan',x:520,y:420,type:'house',crop:[0,315,76,70]},
 {id:'pasar',name:'2. Market Sounding',x:1320,y:420,type:'house',crop:[76,315,76,70]},
 {id:'tim',name:'3. Tim Konsolidasi',x:2220,y:430,type:'house',crop:[152,315,76,70]},
 {id:'dok',name:'4. KAK-HPS',x:3140,y:650,type:'house',crop:[228,315,76,70]},
 {id:'pemilihan',name:'5. Pemilihan',x:3200,y:1650,type:'house',crop:[0,385,76,70]},
 {id:'payung',name:'6. Kontrak Payung',x:2350,y:2250,type:'house',crop:[76,385,76,70]},
 {id:'katalog',name:'7. Katalog Elektronik',x:1300,y:2250,type:'house',crop:[152,385,76,70]},
 {id:'ep',name:'8. E-Purchasing',x:470,y:1650,type:'house',crop:[228,385,76,70]},
 {id:'tantangan',name:'9. Evaluasi Tantangan',x:1900,y:860,type:'house',crop:[0,455,76,70]}
];
const obstacles=sites.filter(s=>s.type==='house').map(s=>({x:s.x-35,y:s.y+50,w:300,h:160}));
const trees=[]; for(let i=0;i<120;i++){let a=i*2.399,r=500+(i%24)*60;trees.push({x:W/2+Math.cos(a)*r+(i%5)*45,y:H/2+Math.sin(a)*r+(i%7)*35});}
const flowers=[]; for(let i=0;i<90;i++)flowers.push({x:180+(i*173)%3800,y:180+(i*97)%2600,crop:[240+(i%4)*16,230,16,16]});
function resize(){const r=c.getBoundingClientRect();c.width=Math.floor(r.width);c.height=Math.floor(r.height);x.imageSmoothingEnabled=false;} new ResizeObserver(resize).observe(c); resize();
function toastMsg(t){toast.textContent=t;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1900)}
function updateUI(){let cur=quests[Math.min(q,quests.length-1)];qnum.textContent=(q>=quests.length?'TAMAT':(q+1)+' / '+quests.length);qtitle.textContent=q>=quests.length?'Konsolidasi ATK Kota Bogor Selesai':cur[1];qstory.textContent=q>=quests.length?'Alur dari identifikasi kebutuhan sampai e-Purchasing sudah kamu jalani. Sekarang map bebas dijelajahi.':cur[2];qhint.textContent=q>=quests.length?'Eksplor bebas.':cur[3];progress.textContent='Progress '+Math.round(done.size/quests.length*100)+'%';score.textContent='Skor '+scoreVal;route.innerHTML=quests.map((qq,i)=>`<li class="${done.has(qq[0])?'done':i===q?'active':''}">${i+1}. ${qq[1]}</li>`).join('')}
function focusQuest(){let id=quests[Math.min(q,quests.length-1)]?.[0];let s=sites.find(z=>z.id===id)||sites[0];player.x=s.x+80;player.y=s.y+240;toastMsg('Dipindah ke area quest aktif')}
function openSite(s){let cur=quests[q]; if(!cur){showDialog('Quest Tamat','<p>Semua alur sudah selesai. Kamu bebas keliling map.</p>');return} if(s.id!==cur[0]){showDialog('Belum Urut Bro',`<p>Ini area <b>${s.name}</b>, tapi quest aktif sekarang: <b>${cur[1]}</b>.</p><div class="warn">PANJI: ikuti alurnya dulu biar ceritanya nyambung.</div>`);return}
 showDialog(cur[1],`<div class="panel"><p>${cur[2]}</p>${detailFor(s.id)}<button class="act" onclick="completeQuest()">Selesaikan tahap ini</button></div>`)}
function detailFor(id){const d={panji:'<p><b>PANJI:</b> Kita mulai dari plaza. Aku bakal temani kamu muter kota konsolidasi.</p>',ident:'<ul><li>Analisis data SiRUP</li><li>Permintaan dan konfirmasi data OPD</li><li>Temukan barang rutin: HVS, tinta printer, ballpoint</li></ul>',pasar:'<ul><li>Cek kapasitas pasokan</li><li>Cek proses bisnis dan distribusi</li><li>Market sounding bukan pemilihan penyedia</li></ul>',tim:'<ul><li>Siapkan payung hukum</li><li>Tetapkan tim konsolidasi</li><li>Rapikan mandat dan peran</li></ul>',dok:'<ul><li>Susun KAK</li><li>Rapikan spesifikasi</li><li>Susun HPS/referensi harga</li><li>Draft kontrak payung</li></ul>',pemilihan:'<ul><li>Pengumuman minimal 5 hari</li><li>Pendaftaran dokumen</li><li>Penjelasan jika diperlukan</li><li>Evaluasi, klarifikasi, negosiasi</li><li>Pengumuman hasil</li></ul>',payung:'<p>Kontrak payung mengikat hasil konsolidasi agar OPD punya jalur belanja yang sama.</p>',katalog:'<p>Produk hasil konsolidasi ditayangkan ke Katalog Elektronik.</p>',ep:'<p>PP/PPK melakukan e-Purchasing melalui hasil konsolidasi.</p>',tantangan:'<ul><li>Ketersediaan data</li><li>Pemahaman pasar</li><li>Pembentukan harga</li><li>Kepastian anggaran</li><li>SDM dan komitmen pimpinan</li></ul>'};return d[id]||''}
window.completeQuest=()=>{let id=quests[q][0];done.add(id);scoreVal+=10+q*2;q++;modal.classList.add('hidden');updateUI();toastMsg('Tahap selesai!')}
function showDialog(t,h){mtitle.textContent=t;mbody.innerHTML=h;modal.classList.remove('hidden')}
function move(){let dx=0,dy=0;if(keys.a||keys.arrowleft){dx-=player.sp;player.dir=-1}if(keys.d||keys.arrowright){dx+=player.sp;player.dir=1}if(keys.w||keys.arrowup)dy-=player.sp;if(keys.s||keys.arrowdown)dy+=player.sp;if(dx&&dy){dx*=.707;dy*=.707}let nx=player.x+dx,ny=player.y+dy; if(nx<60||ny<60||nx>W-80||ny>H-100)return;let box={x:nx,y:ny,w:player.w,h:player.h}; if(!obstacles.some(o=>box.x<o.x+o.w&&box.x+box.w>o.x&&box.y+30<o.y+o.h&&box.y+box.h>o.y)){player.x=nx;player.y=ny} if(dx||dy)player.walk+=.18}
function camera(){cam.x=Math.max(0,Math.min(W-c.width,player.x-c.width/2));cam.y=Math.max(0,Math.min(H-c.height,player.y-c.height/2))}
function spr(sheet,crop,dx,dy,dw,dh){if(sheet.complete&&sheet.naturalWidth) x.drawImage(sheet,crop[0],crop[1],crop[2],crop[3],dx,dy,dw,dh)}
function label(text,px,py){x.fillStyle='rgba(255,255,255,.96)';round(px,py,Math.max(190,text.length*9),34,9);x.fill();x.strokeStyle='rgba(20,60,38,.25)';x.stroke();x.fillStyle='#173127';x.font='bold 15px Nunito';x.fillText(text,px+10,py+22)}
function round(px,py,w,h,r){x.beginPath();x.moveTo(px+r,py);x.arcTo(px+w,py,px+w,py+h,r);x.arcTo(px+w,py+h,px,py+h,r);x.arcTo(px,py+h,px,py,r);x.arcTo(px,py,px+w,py,r);x.closePath()}
function draw(){x.clearRect(0,0,c.width,c.height);x.save();x.translate(-cam.x,-cam.y);x.fillStyle='#73bf72';x.fillRect(0,0,W,H);for(let yy=0;yy<H;yy+=64)for(let xx=0;xx<W;xx+=64){x.fillStyle=((xx+yy)/64%2<1)?'rgba(255,255,255,.05)':'rgba(0,0,0,.025)';x.fillRect(xx,yy,64,64)}
 x.fillStyle='#d7bd80'; round(250,1360,3600,180,40);x.fill(); round(1900,450,180,2050,40);x.fill(); round(430,530,900,140,40);x.fill(); round(2020,530,1180,140,40);x.fill(); round(520,1730,950,140,40);x.fill(); round(2080,1730,1200,140,40);x.fill(); round(1850,780,420,280,40);x.fill();
 trees.forEach(t=>spr(img.serene,[144,96,48,48],t.x,t.y,96,96)); flowers.forEach(f=>spr(img.serene,f.crop,f.x,f.y,32,32));
 sites.forEach((s,i)=>{if(s.type==='house'){spr(img.serene,s.crop,s.x,s.y,304,280);label(s.name,s.x+10,s.y+285)}else{label('START - PANJI',s.x-38,s.y+85);drawPanji(s.x,s.y)}});
 drawPlayer(); if(near){x.fillStyle='rgba(19,35,26,.94)';round(player.x-95,player.y-55,260,38,14);x.fill();x.fillStyle='white';x.font='bold 15px Nunito';x.fillText('Tekan E untuk interaksi',player.x-72,player.y-31)}x.restore();}
function drawPlayer(){let sheet=(keys.a||keys.d||keys.w||keys.s||keys.arrowleft||keys.arrowright||keys.arrowup||keys.arrowdown)?img.player_run:img.player_idle;let frames=sheet===img.player_run?8:9;let fw=96,fh=64,fr=Math.floor(player.walk)%frames;x.save();x.translate(player.x,player.y);if(player.dir<0){x.scale(-1,1);spr(sheet,[fr*fw,0,fw,fh],-50,0,96,64)}else spr(sheet,[fr*fw,0,fw,fh],0,0,96,64);x.restore()}
function drawPanji(px,py){let fr=Math.floor(frame/12)%9;spr(img.panji_idle,[fr*96,0,96,64],px,py,96,64)}
function loop(){frame++;move();camera();near=null;let p={x:player.x,y:player.y,w:player.w,h:player.h};for(const s of sites){let z={x:s.x-60,y:s.y+70,w:360,h:270};if(s.type==='npc')z={x:s.x-70,y:s.y-50,w:220,h:180}; if(p.x<z.x+z.w&&p.x+p.w>z.x&&p.y<z.y+z.h&&p.y+p.h>z.y){near=s;break}} draw();requestAnimationFrame(loop)}
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()==='e'&&near)openSite(near);if(e.key.toLowerCase()==='f')focusQuest();if(e.key.toLowerCase()==='r'){player.x=2050;player.y=1500;toastMsg('Balik ke plaza')}});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
Promise.all(Object.values(img).map(im=>new Promise(res=>{im.onload=res;im.onerror=res;if(im.complete)res()}))).then(()=>{loaded=true;updateUI();toastMsg('Asset pixel asli termuat');loop()}); setTimeout(()=>{if(!loaded){updateUI();toastMsg('Jalan dulu, asset masih loading');loop()}},1200);
