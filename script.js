/****************************************************
 *  UNDANGAN – SCRIPT UTAMA (RSVP + UCAPAN + UI)
 *  Versi: 2026-03-03
 *  Catatan:
 *  - Ganti GAS_URL dengan URL googleusercontent.com/macros/echo
 *    dari deployment Apps Script (yang 200 OK).
 ****************************************************/

// ====== BACKEND (Google Apps Script) ======

const GAS_GET_URL  =
  'https://script.googleusercontent.com/macros/echo?user_content_key=AY5xjrSPAOtAyU0TBzsbMElBm6aMjoAw8lOL8U6X6TSdF0td8fmz-ycFv1yFw32KCmMZ0Cq8iiSK4aX4wyMzHm3gaG8gqTRlNuZwp7LAIZetU70N-PgUrxla9bjiJF2QSTERFEjp9KUDxq2VSoSwBuda7ZeojW9oKAizk8vPyV6UJTYTU5BogCg1pBVGzQs1UTPVpqQqUDokfEqr-SkF5Pbcnm8UrqkdJOpkZ8XiuCMMuKq1MzLYntriOBvpw1MPTVFaqpEs6VTMN39wiK7JUUBJo0swvVHyAc6-eHCxlvZ2MkeRZQmLWQ3xHqTApS9aYw&lib=MmPXatP9RAZD5clwtEnUqhI0puHqVPr6u';

const GAS_POST_URL =
  'https://script.google.com/macros/s/AKfycbwcdBXj_a1N1bhROj1LNPQBf1yDQMRvEtc-hEDdWRSIoJLLq7cZEt5TVxcfDp5-wIL-Pg/exec';

// ====== KONFIGURASI ======
const CONFIG = {
  eventDate: '2026-03-26T08:00:00+07:00',
  mapsUrl: 'https://maps.app.goo.gl/wmB3kTViFm2bD3tr9',
  gift: [
    { label: 'Rekening BCA',    value: '1234567890 a.n. Vinka' },
    { label: 'Rekening Mandiri',value: '9876543210 a.n. Ilham' },
    { label: 'Alamat Rumah',    value: 'KP. Cibeureum Empe RT 03 RW 20, Pangalengan' }
  ],
  gallery: [
    {src:'assets/Foto-01.jpg', caption:''},
    {src:'assets/Foto-02.jpg', caption:''},
    {src:'assets/Foto-03.jpg', caption:''},
    {src:'assets/Foto-04.jpg', caption:''},
    {src:'assets/Foto-05.jpg', caption:''},
    {src:'assets/Foto-06.jpg', caption:''},
    {src:'assets/Foto-07.jpg', caption:''},
    {src:'assets/Foto-08.jpg', caption:''},
    {src:'assets/Foto-09.jpg', caption:''},
  ]
};

// ====== UTILITAS DOM & STRING ======
const $  = (s, d=document)=> d.querySelector(s);
const $$ = (s, d=document)=> Array.from(d.querySelectorAll(s));

function esc(s=''){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#39;");
}
function getQueryParam(name){
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  } catch { return null; }
}
function buildUrlWithParams(base, params){
  const hasQ = base.includes('?');
  const prefix = hasQ ? '&' : '?';
  return base + prefix + new URLSearchParams(params).toString();
}

// ====== BACKEND HELPERS (FETCH) ======

async function postToSheet(payload){
  if (!GAS_POST_URL) {
    console.warn('GAS_POST_URL belum diisi URL web app (script.google.com/macros/s/.../exec).');
  }
  const res = await fetch(GAS_POST_URL, {
    method: 'POST',
    // 'text/plain' memang menghindari preflight, tapi pastikan Apps Script-mu handle-nya.
    headers: {'Content-Type':'text/plain;charset=utf-8'},
    body: JSON.stringify(payload)
  });
  return res.json().catch(() => ({ ok:false, error:'Invalid JSON' }));
}


async function getFromSheet(params){
  if (!GAS_GET_URL) {
    console.warn('GAS_GET_URL belum diisi URL googleusercontent.com/macros/echo yang valid.');
  }
  const url = buildUrlWithParams(GAS_GET_URL, params);
  const res = await fetch(url, { method:'GET', cache:'no-store' });
  return res.json();
}
// ====== COUNTDOWN ======
function startCountdown(target){
  const day=$('#tDay'), hour=$('#tHour'), min=$('#tMin'), sec=$('#tSec');
  if (!day || !hour || !min || !sec) return;
  function tick(){
    const now = new Date();
    const diff = Math.max(0, target - now);
    const d = Math.floor(diff/86400000);
    const h = Math.floor((diff%86400000)/3600000);
    const m = Math.floor((diff%3600000)/60000);
    const s = Math.floor((diff%60000)/1000);
    day.textContent  = d;
    hour.textContent = h;
    min.textContent  = m;
    sec.textContent  = s;
  }
  tick();
  setInterval(tick, 1000);
}

// ====== UCAPAN (RENDER & LOAD) ======
const wishListEl = $('#wishList');

function addWish({nama, pesan, time}) {
  if (!wishListEl) return;
  const item = document.createElement('div');
  item.className = 'wish';
  const dt = new Date(time);
  const tanggal = isNaN(dt) ? '' : dt.toLocaleDateString('id-ID',{day:'2-digit', month:'long', year:'numeric'});
  const jam     = isNaN(dt) ? '' : dt.toLocaleTimeString('id-ID',{hour:'2-digit', minute:'2-digit'});
  item.innerHTML = `
    <div class="meta">${esc(nama)}</div>
    <div>${esc(pesan)}</div>
    <div class="meta">${tanggal}${tanggal ? ' • ' : ''}${jam ? jam + ' WIB' : ''}</div>
  `;
  wishListEl.prepend(item); // terbaru di atas
}

async function fetchWishes(limit = 50){
  if (!wishListEl) return;
  try {
    const res  = await getFromSheet({ list: 'wishes', limit: String(limit), _ts: Date.now() });

    // -- Normalisasi berbagai kemungkinan bentuk respons --
    let list = null;
    if (res && Array.isArray(res.data))    list = res.data;     // {data:[...]}
    if (!list && res && Array.isArray(res.wishes)) list = res.wishes; // {wishes:[...]}
    if (!list && Array.isArray(res))       list = res;          // [...] langsung

    if (!list || list.length === 0) {
      console.warn('fetchWishes: tidak ada data yang bisa dipakai. Respons:', res);
      return; // penting: jangan mengosongkan UI existing
    }

    // ambil waktu dari beberapa nama kolom umum
    const takeTime = (w) => w.timestamp ?? w.time ?? w.createdAt ?? w.Tanggal ?? w.date ?? 0;

    const sorted = list
      .slice()
      .sort((a,b) => new Date(takeTime(b)).getTime() - new Date(takeTime(a)).getTime());

    const frag = document.createDocumentFragment();
    sorted.forEach(w => {
      const nama = (w.nama ?? w.name ?? w.Nama ?? '').toString();
      const pesan = (w.pesan ?? w.message ?? w.ucapan ?? '').toString();
      const t = takeTime(w) || Date.now();
      const dt = new Date(t);
      const tanggal = isNaN(dt) ? '' : dt.toLocaleDateString('id-ID',{day:'2-digit', month:'long', year:'numeric'});
      const jam     = isNaN(dt) ? '' : dt.toLocaleTimeString('id-ID',{hour:'2-digit', minute:'2-digit'});

      const div = document.createElement('div');
      div.className = 'wish';
      div.innerHTML = `
        <div class="meta">${esc(nama)}</div>
        <div>${esc(pesan)}</div>
        <div class="meta">${tanggal}${tanggal ? ' • ' : ''}${jam ? jam + ' WIB' : ''}</div>
      `;
      frag.appendChild(div);
    });

    wishListEl.innerHTML = '';
    wishListEl.appendChild(frag);
  } catch (e) {
    console.warn('Gagal memuat ucapan:', e);
    // pada error, biarkan tampilan existing (jangan dikosongkan)
  }
}

// ====== RSVP SUMMARY (opsional) ======
async function fetchRsvpSummary(){
  const box = $('#rsvpSummary');
  const statsEl = $('#rsvpStats');
  const recentEl = $('#rsvpRecent');
  if (!box || !statsEl || !recentEl) return;

  try {
    const res = await getFromSheet({ list: 'rsvp', limit: '300', _ts: Date.now() });
    if (res && res.ok) {
      const sum = res.summary || { totalHadir:0, konfirmasiHadir:0, tidakHadir:0 };
      statsEl.textContent =
        `Konfirmasi Hadir: ${sum.konfirmasiHadir} | Tidak Hadir: ${sum.tidakHadir} | Estimasi Tamu Hadir: ${sum.totalHadir}`;

      const arr = Array.isArray(res.data) ? res.data.slice(0,5) : [];
      if (arr.length > 0) {
        const items = arr.map(r=>{
          const dt  = new Date(r.timestamp);
          const tgl = dt.toLocaleDateString('id-ID',{day:'2-digit', month:'short', year:'numeric'});
          const jam = dt.toLocaleTimeString('id-ID',{hour:'2-digit', minute:'2-digit'});
          return `<div class="wish">
                    <div class="meta">${esc(r.nama)} • ${esc(r.hadir)} (${r.jumlah})</div>
                    <div class="meta">${tgl} • ${jam} WIB</div>
                    ${r.pesan ? `<div>${esc(r.pesan)}</div>` : ''}
                  </div>`;
        }).join('');
        recentEl.innerHTML = items;
      } else {
        // Jangan hapus konten lama jika sudah ada; kalau mau, beri placeholder hanya saat kosong total
        if (!recentEl.innerHTML.trim()) {
          recentEl.innerHTML = '<div class="meta">Belum ada data</div>';
        }
      }
      box.style.display = 'block';
    }
  } catch (e) {
    console.warn('Gagal memuat rekap RSVP:', e);
    // pada error, biarkan konten lama
  }
}


// ====== HANDLER FORM ======

// helper kecil
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function onSubmitWish(e){
  e.preventDefault();
  const form = e.currentTarget;
  const fd = new FormData(form);
  const nama = (fd.get('nama') ?? '').toString().trim();
  const pesan = (fd.get('pesan') ?? '').toString().trim();
  if (!nama || !pesan) return;

  const btn = document.getElementById('wishSubmitBtn') ?? form.querySelector('button[type="submit"]');
  setButtonLoading(btn, true, { textLoading: 'Mengirim...' });

  // Optimistic UI
  const optimistic = { nama, pesan, time: new Date() };
  addWish(optimistic);

  try {
    const res = await postToSheet({ type:'wish', nama, pesan });
    if (res?.ok) {
      // >>> tunda fetch agar GET sudah melihat baris baru
      await sleep(1800);                       // 1.8 detik (boleh 1500–3000 ms)
      await fetchWishes();                     // re-sync
    } else {
      console.warn('Submit ucapan gagal (ok=false):', res);
      // (opsional) tampilkan pesan error user-friendly
    }
  } catch (err) {
    console.warn('Gagal submit ucapan:', err);
  } finally {
    setButtonLoading(btn, false);
    form.reset();
  }
}

async function onSubmitRSVP(e){
  e.preventDefault();
  const form = e.currentTarget;
  const rsvpStatus = $('#rsvpStatus');
  const btn = document.getElementById('rsvpSubmitBtn') ?? form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form).entries());

  const payload = {
    type: 'rsvp',
    nama: (data.nama ?? '').trim(),
    hp: (data.hp ?? '').trim(),
    hadir: data.hadir ?? '',
    jumlah: Number(data.jumlah ?? 0),
    pesan: (data.pesan ?? '').trim()
  };

  if (rsvpStatus) rsvpStatus.textContent = 'Mengirim...';
  setButtonLoading(btn, true, { textLoading: 'Mengirim...' });

  try {
    const result = await postToSheet(payload);
    if (result.ok) {
      if (rsvpStatus) rsvpStatus.textContent = 'Terima kasih, konfirmasi Anda tersimpan.';
      form.reset();

      // tampilkan pesan RSVP (jika ada) secara optimistic
      if (payload.pesan) addWish({ nama: payload.nama, pesan: payload.pesan, time: new Date() });

      // >>> tunda fetch agar GET sudah melihat baris baru
      await sleep(1800);
      await fetchWishes();
      await fetchRsvpSummary();
    } else {
      if (rsvpStatus) rsvpStatus.textContent = 'Gagal menyimpan: ' + (result.error ?? 'Unknown error');
    }
  } catch (err) {
    if (rsvpStatus) rsvpStatus.textContent = 'Gagal menyimpan. Periksa koneksi dan coba lagi.';
    console.warn('Gagal submit RSVP:', err);
  } finally {
    setButtonLoading(btn, false);
  }
}

// ====== GIFT COPY ======
function showGiftOptions(){
  const lines = CONFIG.gift.map(g=>`${g.label}:\n${g.value}`).join('\n\n');
  navigator.clipboard.writeText(lines).catch(()=>{});
}

// ====== COVER + NAMA TAMU ======
(function initGuestName(){
  const span = $('#guestName');
  if (!span) return;
  const raw = getQueryParam('to') || getQueryParam('nama') || getQueryParam('guest') || '';
  if (!raw) return;
  const cleaned = decodeURIComponent(raw).replace(/\+/g,' ').trim();
  span.textContent = cleaned;
})();

function rememberCoverState(){
  // simpan state saat tombol Buka ditekan
  $('#btnOpen')?.addEventListener('click', () => {
    sessionStorage.setItem('inv_opened', '1');
  });
  // saat load kembali, jika sudah dibuka maka sembunyikan cover
  if (sessionStorage.getItem('inv_opened') === '1') {
    $('#cover')?.classList.add('hide');
    document.body.classList.remove('no-scroll');
  }
}

// ====== AUDIO & BOTTOM NAV (ringkas, aman) ======
function initAudioAndNav(){
  const audio  = $('#bgMusic');
  const muteBtn = $('#btnMute');
  const openBtn = $('#btnOpen');
  const cover   = $('#cover');
  const nav     = $('#bottomNav');
  const btnLok  = $('#btnLokasi');
  const dockMute= $('#btnMuteDock');
  const AUDIO_KEY = 'wedding_audio_muted';

  if (btnLok && CONFIG?.mapsUrl) btnLok.href = CONFIG.mapsUrl;

  function showNav(){
    if (nav?.hasAttribute('hidden')) nav.removeAttribute('hidden');
    document.body.classList.add('nav-ready');
  }
  // tampilkan nav saat dibuka
  openBtn?.addEventListener('click', async ()=>{
    try { await audio?.play(); } catch {}
    setTimeout(showNav, 300);
  });
  if (cover?.classList.contains('hide')) showNav();

  // simpan preferensi mute
  const savedMuted = localStorage.getItem(AUDIO_KEY);
  if (savedMuted !== null && audio) {
    audio.muted = (savedMuted === 'true');
    muteBtn?.classList.toggle('muted', audio.muted);
    dockMute?.classList.toggle('muted', audio.muted);
  }
  function setMuted(m){
    if (!audio) return;
    audio.muted = m;
    muteBtn?.classList.toggle('muted', m);
    dockMute?.classList.toggle('muted', m);
    localStorage.setItem(AUDIO_KEY, String(m));
  }
  muteBtn?.addEventListener('click', ()=> setMuted(!audio?.muted));
  dockMute?.addEventListener('click', async ()=>{
    setMuted(!audio?.muted);
    if (!audio?.muted && audio?.paused){
      try { await audio.play(); } catch {}
    }
  });

  // play saat tombol buka
  openBtn?.addEventListener('click', async ()=>{
    try { await audio?.play(); } catch {}
    cover?.classList.add('hide');
    document.getElementById('hero')?.scrollIntoView({behavior:'smooth'});
  });
}

// ====== GALERI (aman bila section ada) ======
function initGallery(){
  const slidesEl = $('#gallerySlides');
  const dotsEl   = $('#galDots');
  const btnPrev  = $('#galPrev');
  const btnNext  = $('#galNext');
  const chkAuto  = $('#galAutoplay');

  if (!slidesEl) return; // section belum ada

  slidesEl.innerHTML = CONFIG.gallery.map((g,i)=>(
    `<figure class="slide" role="listitem" aria-label="Slide ${i+1}">
       <img src="${g.src}" alt="${esc(g.caption || '')}">
       ${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ''}
     </figure>`
  )).join('');

  dotsEl.innerHTML = CONFIG.gallery.map((_,i)=>(
    `<button class="dot" data-idx="${i}" aria-label="Ke slide ${i+1}"></button>`
  )).join('');

  const dots = Array.from(dotsEl.querySelectorAll('.dot'));
  const total = CONFIG.gallery.length;
  let index = 0, timer = null, autoInterval = 4000;

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

  dots.forEach(d=> d.addEventListener('click', ()=> go(Number(d.dataset.idx))));
  btnNext?.addEventListener('click', next);
  btnPrev?.addEventListener('click', prev);

  function startAuto(){ stopAuto(); if(chkAuto?.checked){ timer = setInterval(next, autoInterval); } }
  function stopAuto(){ if(timer) clearInterval(timer), timer=null; }

  chkAuto?.addEventListener('change', startAuto);
  slidesEl.addEventListener('mouseenter', stopAuto);
  slidesEl.addEventListener('mouseleave', startAuto);
  btnNext?.addEventListener('mouseenter', stopAuto);
  btnPrev?.addEventListener('mouseenter', stopAuto);
  btnNext?.addEventListener('mouseleave', startAuto);
  btnPrev?.addEventListener('mouseleave', startAuto);

  // swipe (touch)
  let startX=0, dx=0, dragging=false;
  slidesEl.addEventListener('touchstart', (e)=>{
    dragging=true; startX=e.touches[0].clientX; dx=0; stopAuto(); slidesEl.style.transition='none';
  }, {passive:true});
  slidesEl.addEventListener('touchmove', (e)=>{
    if(!dragging) return;
    dx = e.touches[0].clientX - startX;
    const percent = dx / slidesEl.clientWidth * 100;
    slidesEl.style.transform = `translateX(${(-index*100)+percent}%)`;
  }, {passive:true});
  slidesEl.addEventListener('touchend', ()=>{
    dragging=false; slidesEl.style.transition='transform .45s cubic-bezier(.2,.7,.2,1)';
    const threshold = slidesEl.clientWidth * 0.18;
    if(Math.abs(dx) > threshold){ dx<0 ? next() : prev(); } else { go(index); }
    startAuto();
  });

  go(0, {animate:false});
  startAuto();

  // reduce motion
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    if (chkAuto) chkAuto.checked = false;
    stopAuto();
  }
}

// ====== INIT SAAT HALAMAN SIAP ======
window.addEventListener('DOMContentLoaded', () => {
  // Fallback agar form tidak default GET kalau HTML belum diset
  $('#rsvpForm')?.setAttribute('method','post');
  $('#wishForm')?.setAttribute('method','post');

  // Map & Countdown
  const btnMap = $('#btnMap');
  if (btnMap) btnMap.href = CONFIG.mapsUrl;
  startCountdown(new Date(CONFIG.eventDate));

  // Gift (copy single nomor) via event delegation
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-copy]');
    if (!btn) return;
    const text = btn.getAttribute('data-copy') || '';
    const status = $('#giftCopyStatus');
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = 'Copied!';
      if (status) status.textContent = 'Nomor rekening telah disalin.';
      setTimeout(()=>{ btn.textContent='Copy'; if (status) status.textContent=''; }, 1600);
    } catch {
      if (status) status.textContent = 'Gagal menyalin. Silakan salin manual.';
    }
  });
  // Gift (copy semua info)
  $('#btnGift')?.addEventListener('click', showGiftOptions);

  // Cover: ingat status
  rememberCoverState();

  // Audio + nav + galeri
  initAudioAndNav();
  initGallery();

  // Form handler
  $('#wishForm')?.addEventListener('submit', onSubmitWish);
  $('#rsvpForm')?.addEventListener('submit', onSubmitRSVP);

  // Load data awal (tanpa refresh)
  fetchWishes();
  fetchRsvpSummary();
});


let wishTimer = null;
function scheduleWishRefresh(){
  clearTimeout(wishTimer);
  wishTimer = setTimeout(() => fetchWishes(), 35000); // 35 detik
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) scheduleWishRefresh();
});
// Panggil sekali setelah init:
scheduleWishRefresh();

function setButtonLoading(btn, loading, {textLoading='Mengirim...', textIdle} = {}){
  if (!btn) return;
  const textSpan = btn.querySelector('.btn-text');
  const spinner  = btn.querySelector('.spinner');

  // Simpan label awal sekali saja
  if (textIdle === undefined) {
    if (!btn.dataset.idleText) btn.dataset.idleText = textSpan ? textSpan.textContent : btn.textContent;
    textIdle = btn.dataset.idleText;
  }

  if (loading) {
    btn.classList.add('loading');
    btn.setAttribute('disabled', 'disabled');
    if (textSpan) textSpan.textContent = textLoading; else btn.textContent = textLoading;
    if (spinner) spinner.style.display = 'inline-block';
  } else {
    btn.classList.remove('loading');
    btn.removeAttribute('disabled');
    if (textSpan) textSpan.textContent = textIdle; else btn.textContent = textIdle;
    if (spinner) spinner.style.display = 'none';
  }
}


// Cegah submit berulang kalau tombol sedang loading
['wishForm', 'rsvpForm'].forEach(id => {
  const form = document.getElementById(id);
  form?.addEventListener('submit', (ev) => {
    const btn = form.querySelector('button[type="submit"]');
    if (btn?.classList.contains('loading')) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  });
});
