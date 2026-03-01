
// ====== Konfigurasi yang mudah diedit ======
const CONFIG = {
  eventDate: '2026-03-26T08:00:00+07:00',
  mapsUrl: 'https://maps.app.goo.gl/wmB3kTViFm2bD3tr9',
  gift: [
    {label: 'Rekening BCA', value: '1234567890 a.n. Vinka'},
    {label: 'Rekening Mandiri', value: '9876543210 a.n. Ilham'},
    {label: 'Alamat Rumah', value: 'KP. Cibeureum Empe RT 03 RW 20, Pangalengan'}
  ]
};

// ====== Helper ======
const $ = (s, d=document)=>d.querySelector(s);
const $$ = (s, d=document)=>Array.from(d.querySelectorAll(s));

// ====== Inisialisasi ======
window.addEventListener('DOMContentLoaded', () => {
  // Map
  const btnMap = $('#btnMap');
  if(btnMap){ btnMap.href = CONFIG.mapsUrl; }

  // Countdown
  startCountdown(new Date(CONFIG.eventDate));

  // RSVP handling (LocalStorage demo)
  const rsvpForm = $('#rsvpForm');
  if(rsvpForm){
    rsvpForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const data = Object.fromEntries(new FormData(rsvpForm).entries());
      const list = JSON.parse(localStorage.getItem('rsvp_list')||'[]');
      data.time = new Date().toISOString();
      list.push(data);
      localStorage.setItem('rsvp_list', JSON.stringify(list));
      $('#rsvpStatus').textContent = 'Terima kasih, konfirmasi Anda tersimpan.';
      rsvpForm.reset();
      // Tambahkan juga ke ucapan
      if(data.pesan){ addWish({nama:data.nama, pesan:data.pesan, time:new Date()}); }
    });
  }

  // Wishes existing (demo)
  addWish({nama:'Mantan mu', pesan:'Selamat atas pernikahanmu, semoga langgeng sampai selamanya. Aamiin.', time:new Date('2026-02-20T13:00:00+07:00')});

  // Gift
  const btnGift = $('#btnGift');
  if(btnGift){ btnGift.addEventListener('click', showGiftOptions); }
});

function startCountdown(target){
  const day=$('#tDay'), hour=$('#tHour'), min=$('#tMin'), sec=$('#tSec');
  function tick(){
    const now = new Date();
    const diff = Math.max(0, target - now);
    const d = Math.floor(diff/86400000);
    const h = Math.floor((diff%86400000)/3600000);
    const m = Math.floor((diff%3600000)/60000);
    const s = Math.floor((diff%60000)/1000);
    day.textContent=d; hour.textContent=h; min.textContent=m; sec.textContent=s;
  }
  tick();
  setInterval(tick, 1000);
}

function addWish({nama, pesan, time}){
  const list = $('#wishList');
  const item = document.createElement('div');
  item.className='wish';
  const dt = new Date(time);
  const tanggal = dt.toLocaleDateString('id-ID',{day:'2-digit', month:'long', year:'numeric'});
  const jam = dt.toLocaleTimeString('id-ID',{hour:'2-digit', minute:'2-digit'});
  item.innerHTML = `<div class="meta">${nama}</div><div>${pesan}</div><div class="meta">${tanggal} • ${jam} WIB</div>`;
  list.prepend(item);
}

$('#wishForm')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  addWish({nama:data.nama, pesan:data.pesan, time:new Date()});
  e.target.reset();
});

function showGiftOptions(){
  const lines = CONFIG.gift.map(g=>`${g.label}:\n${g.value}`).join('\n\n');
  navigator.clipboard.writeText(lines).catch(()=>{});
  // alert('Informasi hadiah telah disalin ke clipboard:\n\n'+lines);
}

// ===== Cover (splash) =====
function getQueryParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

window.addEventListener('DOMContentLoaded', ()=>{
  // Ambil nama tamu dari URL: ?to=Nama+Tamu (juga mendukung ?nama= / ?guest=)
  const guest = getQueryParam('to') || getQueryParam('nama') || getQueryParam('guest');
  if(guest){
    const cleaned = decodeURIComponent(guest).replace(/\+/g,' ');
    const span = document.getElementById('guestName');
    if(span){ span.textContent = cleaned; }
  }
  // Tombol "Buka Undangan"
  const btnOpen = document.getElementById('btnOpen');
  const cover = document.getElementById('cover');
  if(btnOpen && cover){
    btnOpen.addEventListener('click', ()=>{
      cover.classList.add('hide');
      document.getElementById('hero')?.scrollIntoView({behavior:'smooth'});
    });
  }
});
// Nama tamu: title-case + sapaan otomatis/param
const raw = getQueryParam('to') || getQueryParam('nama') || getQueryParam('guest') || '';
const sapaanParam = getQueryParam('sapaan');
if(raw){
  const cleaned = decodeURIComponent(raw).replace(/\+/g,' ').trim();
  const sal = inferSalutation(cleaned, sapaanParam); // Bapak/Ibu/Keluarga
  const pure = cleaned.replace(/^((bpk|bapak|pak|ibu|bu|keluarga|kel|family)\.?\s*)/i,'');
  const finalName = [sal, titleCase(pure)].filter(Boolean).join(' ');
  document.getElementById('guestName').textContent = finalName || titleCase(cleaned);
}

// Spawn partikel kecil
for(let i=0;i<30;i++){ /* bikin <span class="particle"> dengan delay/durasi acak */ }

// Musik & gate
btnMute.addEventListener('click', () => setMuted(!audio.muted));
btnOpen.addEventListener('click', async () => {
  try{ await audio.play(); }catch(e){}
  cover.classList.add('hide');
  document.body.classList.remove('no-scroll'); // buka scroll
  document.getElementById('hero').scrollIntoView({behavior:'smooth'});
});

// ===== Utilities =====
function canPlayAudioEl(el){
  return el && typeof el.play === 'function';
}

// Simpan preferensi mute di localStorage agar konsisten
const AUDIO_STORE_KEY = 'wedding_audio_muted';

document.addEventListener('DOMContentLoaded', () => {
  const audio   = document.getElementById('bgMusic');
  const muteBtn = document.getElementById('btnMute');
  const openBtn = document.getElementById('btnOpen');
  const cover   = document.getElementById('cover');

  if (!canPlayAudioEl(audio)) return;

  // 1) Set status awal mute dari storage (default: tidak mute)
  const savedMuted = localStorage.getItem(AUDIO_STORE_KEY);
  if (savedMuted !== null) {
    audio.muted = savedMuted === 'true';
    if (audio.muted) muteBtn?.classList.add('muted');
  }

  // 2) Tombol Mute/Unmute
  function setMuted(m){
    audio.muted = m;
    muteBtn?.classList.toggle('muted', m);
    localStorage.setItem(AUDIO_STORE_KEY, String(m));
  }
  muteBtn?.addEventListener('click', () => setMuted(!audio.muted));

  // 3) Start musik saat Buka Undangan (HARUS dalam click handler)
  openBtn?.addEventListener('click', async () => {
    try {
      // Di beberapa device, memanggil play() sekali di gesture sudah cukup
      await audio.play();
    } catch (err) {
      // Fallback: coba “unlock” audio
      try {
        // a) Pastikan tidak mute paksa (beberapa device butuh ini)
        audio.muted = false;
        muteBtn?.classList.remove('muted');

        // b) Set volume wajar (0.6) — beberapa browser ignore volume sebelum gesture
        audio.volume = 0.6;

        // c) Panggil play() lagi
        await audio.play();
      } catch (e2) {
        // Jika masih gagal, tampilkan hint ringan (untuk dev)
        console.warn('Autoplay ditolak. User bisa tekan ikon 🔊 untuk memulai audio.', e2);
      }
    }

    // Lanjutkan transisi gate
    cover?.classList.add('hide');
    document.body.classList.remove('no-scroll');
    document.getElementById('hero')?.scrollIntoView({behavior:'smooth'});
  });

  // 4) Safety: jika user menekan tombol mute sebelum buka, hormati preferensinya
  //    dan jangan paksa unmute saat buka, kecuali kita berada di jalur fallback di atas.

  // 5) (Opsional) Resume saat tab kembali aktif
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden && !audio.paused && !audio.muted) {
      try { await audio.play(); } catch {}
    }
  });
});

const audio = document.getElementById('bgMusic');
const muteBtn = document.getElementById('btnMute');
const openBtn = document.getElementById('btnOpen');
const cover   = document.getElementById('cover');

function wait(ms){ return new Promise(r => setTimeout(r, ms)); }

openBtn?.addEventListener('click', async () => {
  // 1) Mulai musik (best effort, seperti sebelumnya)
  try { await audio.play(); } catch(e) {}

  // 2) Tambahkan class 'exit' agar animasi keluar berjalan
  cover?.classList.add('exit');

  // 3) Tunggu durasi paling panjang (sinkron dengan CSS)
  //    Kalau kamu ubah durasi di CSS, samakan angka di bawah (mis. 1300ms).
  await wait(1300);

  // 4) Sembunyikan cover + buka scroll + scroll ke hero
  cover?.classList.add('hide');
  document.body.classList.remove('no-scroll');
  document.getElementById('hero')?.scrollIntoView({behavior:'smooth'});
});
// ===== Bottom Nav Logic =====
(function(){
  const $ = (s,d=document)=>d.querySelector(s);
  const $$ = (s,d=document)=>Array.from(d.querySelectorAll(s));

  const audio   = $('#bgMusic');
  const openBtn = $('#btnOpen');
  const cover   = $('#cover');
  const nav     = $('#bottomNav');
  const btnLok  = $('#btnLokasi');
  const btnMute = $('#btnMuteDock');
  const AUDIO_STORE_KEY = 'wedding_audio_muted';

  // Inisialisasi link Lokasi dari CONFIG
  if (btnLok && typeof CONFIG?.mapsUrl === 'string') {
    btnLok.href = CONFIG.mapsUrl;
  }

  // Tampilkan nav saat undangan dibuka (setalah anim exit jika ada)
  function showNav() {
    if (nav?.hasAttribute('hidden')) nav.removeAttribute('hidden');
    document.body.classList.add('nav-ready');
  }

  // Scroll helper
  function goTo(sel){
    const el = $(sel);
    if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  // Klik Beranda/Acara
  $$('.bottom-nav .nav-btn[data-target]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const sel = btn.getAttribute('data-target');
      if (sel) goTo(sel);
    });
  });

  // Status awal mute dari localStorage
  const savedMuted = localStorage.getItem(AUDIO_STORE_KEY);
  if (savedMuted !== null) {
    audio.muted = (savedMuted === 'true');
    btnMute?.classList.toggle('muted', audio.muted);
  }

  // Toggle mute/unmute
  function setMuted(m){
    audio.muted = m;
    btnMute?.classList.toggle('muted', m);
    localStorage.setItem(AUDIO_STORE_KEY, String(m));
  }
  btnMute?.addEventListener('click', async ()=>{
    setMuted(!audio.muted);
    if (!audio.muted && audio.paused){
      try{ await audio.play(); }catch{}
    }
  });

  // Saat "Buka Undangan" ditekan: play musik + tampilkan nav
  openBtn?.addEventListener('click', async ()=>{
    try { await audio.play(); } catch(e) {}
    // Jika kamu punya animasi exit cover ~1300ms, boleh tunggu sebentar
    setTimeout(showNav, 300); // tampilkan nav segera, atau sinkronkan dgn exit
  });

  // Safety: bila user reload saat cover sudah tersembunyi (mis. via anchor),
  // tampilkan nav jika cover sudah mempunyai class 'hide'
  if (cover?.classList.contains('hide')) showNav();
})();


  (function() {
    function copyToClipboard(text) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
      }
      // Fallback for older/HTTP contexts
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(ta);
        return Promise.resolve();
      } catch (e) {
        document.body.removeChild(ta);
        return Promise.reject(e);
      }
    }

    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-copy]');
      if (!btn) return;
      const text = btn.getAttribute('data-copy') || '';
      const status = document.getElementById('giftCopyStatus');
      try {
        await copyToClipboard(text);
        btn.textContent = 'Copied!';
        if (status) status.textContent = 'Nomor rekening telah disalin.';
        setTimeout(() => {
          btn.textContent = 'Copy';
          if (status) status.textContent = '';
        }, 1600);
      } catch (err) {
        if (status) status.textContent = 'Gagal menyalin. Silakan salin manual.';
      }
    });
  })();

  // ===== GALERI: KONFIGURASI GAMBAR =====
const GALLERY_IMAGES = [
  {src:'assets/Foto-01.jpg', caption:''},
  {src:'assets/Foto-02.jpg', caption:''},
  {src:'assets/Foto-03.jpg', caption:''},
  {src:'assets/Foto-04.jpg', caption:''},
  {src:'assets/Foto-05.jpg', caption:''},
  {src:'assets/Foto-06.jpg', caption:''},
  {src:'assets/Foto-07.jpg', caption:''},
  {src:'assets/Foto-08.jpg', caption:''},
  {src:'assets/Foto-09.jpg', caption:''},
];
// ===== GALERI: SLIDER LOGIC =====
(function(){
  const slidesEl = document.getElementById('gallerySlides');
  const dotsEl   = document.getElementById('galDots');
  const btnPrev  = document.getElementById('galPrev');
  const btnNext  = document.getElementById('galNext');
  const chkAuto  = document.getElementById('galAutoplay');

  if(!slidesEl) return; // section mungkin belum ada

  // Render slides
  slidesEl.innerHTML = GALLERY_IMAGES.map((g,i)=>(
    `<figure class="slide" role="listitem" aria-label="Slide ${i+1}">
       <img src="${g.src}" alt="${g.caption||''}">
       ${g.caption ? `<figcaption>${g.caption}</figcaption>` : ''}
     </figure>`
  )).join('');

  // Render dots
  dotsEl.innerHTML = GALLERY_IMAGES.map((_,i)=>(
    `<button class="dot" data-idx="${i}" aria-label="Ke slide ${i+1}"></button>`
  )).join('');

  const dots = Array.from(dotsEl.querySelectorAll('.dot'));
  const total = GALLERY_IMAGES.length;
  let index = 0;
  let timer = null;
  let autoInterval = 4000; // ms

  function go(i, {animate=true} = {}){
    index = (i + total) % total;
    if(!animate){
      slidesEl.style.transition = 'none';
      requestAnimationFrame(()=>{
        slidesEl.style.transform = `translateX(${-index*100}%)`;
        requestAnimationFrame(()=>{ slidesEl.style.transition='transform .45s cubic-bezier(.2,.7,.2,1)'; });
      });
    }else{
      slidesEl.style.transform = `translateX(${-index*100}%)`;
    }
    dots.forEach((d,di)=>d.classList.toggle('active', di===index));
  }

  function next(){ go(index+1); }
  function prev(){ go(index-1); }

  // Dots click
  dots.forEach(d=>{
    d.addEventListener('click', ()=> go(Number(d.dataset.idx)));
  });

  // Buttons
  btnNext?.addEventListener('click', next);
  btnPrev?.addEventListener('click', prev);

  // Keyboard (panah kiri/kanan) ketika section galeri dalam viewport
  document.addEventListener('keydown', (e)=>{
    if(e.key==='ArrowRight') next();
    else if(e.key==='ArrowLeft') prev();
  });

  // Autoplay
  function startAuto(){
    stopAuto();
    if(chkAuto?.checked){
      timer = setInterval(next, autoInterval);
    }
  }
  function stopAuto(){
    if(timer) clearInterval(timer), timer=null;
  }
  chkAuto?.addEventListener('change', startAuto);

  // Pause saat hover/drag
  slidesEl.addEventListener('mouseenter', stopAuto);
  slidesEl.addEventListener('mouseleave', startAuto);
  btnNext?.addEventListener('mouseenter', stopAuto);
  btnPrev?.addEventListener('mouseenter', stopAuto);
  btnNext?.addEventListener('mouseleave', startAuto);
  btnPrev?.addEventListener('mouseleave', startAuto);

  // Swipe (touch)
  let startX=0, dx=0, dragging=false;
  slidesEl.addEventListener('touchstart', (e)=>{
    dragging = true;
    startX = e.touches[0].clientX;
    dx = 0;
    stopAuto();
    slidesEl.style.transition = 'none';
  }, {passive:true});
  slidesEl.addEventListener('touchmove', (e)=>{
    if(!dragging) return;
    dx = e.touches[0].clientX - startX;
    const percent = dx / slidesEl.clientWidth * 100;
    slidesEl.style.transform = `translateX(${(-index*100)+percent}%)`;
  }, {passive:true});
  slidesEl.addEventListener('touchend', ()=>{
    dragging=false;
    slidesEl.style.transition = 'transform .45s cubic-bezier(.2,.7,.2,1)';
    const threshold = slidesEl.clientWidth * 0.18; // 18% geser
    if(Math.abs(dx) > threshold){
      dx<0 ? next() : prev();
    }else{
      go(index); // snap back
    }
    startAuto();
  });

  // Mulai
  go(0, {animate:false});
  startAuto();

  // Optional: jika user mengaktifkan "prefers-reduced-motion", nonaktifkan autoplay
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    if (chkAuto) {
      chkAuto.checked = false;
    }
    stopAuto();
  }
})();

