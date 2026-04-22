/* ═══════════════════════════════════════════════════════════
   Hub Social — Share · Like · Firebase Auth
   México Sin Cáncer Gástrico 2026 · Polar Multimedia × AMG
═══════════════════════════════════════════════════════════ */

/* ── FIREBASE CONFIG ── */
const firebaseConfig = {
  apiKey:            "AIzaSyCigFRWP95gNgzwxrrMD07ec15Z_5Jqyoo",
  authDomain:        "amg-pylori.firebaseapp.com",
  projectId:         "amg-pylori",
  storageBucket:     "amg-pylori.firebasestorage.app",
  messagingSenderId: "1059011170853",
  appId:             "1:1059011170853:web:df4794737e0dfbb2db65cc",
  measurementId:     "G-48PRPGE6B0"
};

/* ── Detectar si Firebase está configurado ── */
const FIREBASE_CONFIGURED = !firebaseConfig.apiKey.startsWith('REEMPLAZA');

let db = null, auth = null, currentUser = null;

/* ═══════════════════════════════════════
   INIT FIREBASE
═══════════════════════════════════════ */
async function initFirebase() {
  if (!FIREBASE_CONFIGURED) return;
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const { getFirestore, doc, getDoc, setDoc, updateDoc, increment, onSnapshot }
      = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
      = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');

    const app = initializeApp(firebaseConfig);
    db   = getFirestore(app);
    auth = getAuth(app);
    window._fsOps = { doc, getDoc, setDoc, updateDoc, increment, onSnapshot };
    window._authOps = { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged };

    onAuthStateChanged(auth, user => {
      currentUser = user;
      updateLoginUI(user);
      if (user) syncCloudLikes();
    });

    // Escucha en tiempo real el conteo de likes de este artículo
    const articleId = getArticleId();
    const likeRef   = doc(db, 'likes', articleId);
    onSnapshot(likeRef, snap => {
      const count = snap.exists() ? (snap.data().count || 0) : 0;
      document.querySelectorAll('.like-count').forEach(el => el.textContent = count);
    });

  } catch (e) {
    console.warn('Firebase no disponible — modo localStorage:', e);
  }
}

/* ═══════════════════════════════════════
   ARTICLE ID  (ej: "pylori-silencioso")
═══════════════════════════════════════ */
function getArticleId() {
  return location.pathname.split('/').pop().replace('.html', '') || 'home';
}

/* ═══════════════════════════════════════
   LIKES — localStorage (anónimo) + Firestore (con login)
═══════════════════════════════════════ */
function getLikedLocal() {
  try { return JSON.parse(localStorage.getItem('amg_liked') || '[]'); } catch { return []; }
}
function setLikedLocal(arr) {
  try { localStorage.setItem('amg_liked', JSON.stringify(arr)); } catch {}
}
function isLikedLocal(id) { return getLikedLocal().includes(id); }

async function toggleLike() {
  const articleId = getArticleId();
  const btn       = document.getElementById('btn-like');
  if (!btn) return;

  const wasLiked = isLikedLocal(articleId);
  const liked    = !wasLiked;

  // localStorage update
  const list = getLikedLocal();
  if (liked) { if (!list.includes(articleId)) list.push(articleId); }
  else        { const i = list.indexOf(articleId); if (i > -1) list.splice(i,1); }
  setLikedLocal(list);
  btn.classList.toggle('liked', liked);

  // Firestore update (si hay login)
  if (db && currentUser && window._fsOps) {
    const { doc, setDoc, updateDoc, increment, getDoc } = window._fsOps;
    const likeRef    = doc(db, 'likes', articleId);
    const userRef    = doc(db, 'userLikes', currentUser.uid, 'articles', articleId);
    const delta      = liked ? 1 : -1;
    try {
      const snap = await getDoc(likeRef);
      if (snap.exists()) await updateDoc(likeRef, { count: increment(delta) });
      else               await setDoc(likeRef, { count: Math.max(0, delta) });
      await setDoc(userRef, { liked, ts: Date.now() });
    } catch(e) { console.warn('Firestore like error', e); }
  } else if (liked && !currentUser) {
    setTimeout(() => showLoginPrompt(true), 600);
  }
}

async function syncCloudLikes() {
  if (!db || !currentUser || !window._fsOps) return;
  const { doc, getDoc } = window._fsOps;
  const articleId = getArticleId();
  const userRef   = doc(db, 'userLikes', currentUser.uid, 'articles', articleId);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists() && snap.data().liked) {
      const list = getLikedLocal();
      if (!list.includes(articleId)) { list.push(articleId); setLikedLocal(list); }
      document.getElementById('btn-like')?.classList.add('liked');
    }
  } catch(e) {}
}

/* ═══════════════════════════════════════
   SHARE — Web Share API + fallback
═══════════════════════════════════════ */
async function shareArticle() {
  const title = document.title;
  const url   = location.href;
  const text  = document.querySelector('meta[name="description"]')?.content || '';
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return; } catch(e) {}
  }
  // Fallback: copiar URL
  try {
    await navigator.clipboard.writeText(url);
    const btn = document.getElementById('btn-share');
    if (btn) { btn.textContent = '✓ URL copiada'; setTimeout(() => { btn.innerHTML = shareBtnHTML(); }, 2000); }
  } catch(e) {}
}

function shareBtnHTML() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Compartir`;
}

/* ═══════════════════════════════════════
   AUTH — Google login
═══════════════════════════════════════ */
async function loginGoogle() {
  if (!auth || !window._authOps) {
    alert('Firebase no disponible. Verifica la configuración.');
    return;
  }
  const { GoogleAuthProvider, signInWithPopup } = window._authOps;
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
    closeLoginModal();
  } catch(e) { console.warn('Login error', e); }
}

async function logoutUser() {
  if (!auth || !window._authOps) return;
  await window._authOps.signOut(auth);
}

/* ═══════════════════════════════════════
   LOGIN UI
═══════════════════════════════════════ */
function showLoginPrompt(afterLike) {
  const msg = afterLike
    ? 'Inicia sesión para guardar tu recomendación en todos tus dispositivos.'
    : 'Inicia sesión con Google para guardar tus artículos favoritos.';
  document.getElementById('login-modal-msg').textContent = msg;
  document.getElementById('login-overlay').classList.add('open');
}

function closeLoginModal() {
  document.getElementById('login-overlay')?.classList.remove('open');
}

function updateLoginUI(user) {
  const loginLink = document.getElementById('social-login-link');
  if (!loginLink) return;
  if (user) {
    loginLink.innerHTML = `
      <img src="${user.photoURL || ''}" alt="${user.displayName}" onerror="this.style.display='none'">
      <span style="color:var(--teal-d); font-weight:700;">${user.displayName?.split(' ')[0] || 'Tú'}</span>
      <span onclick="logoutUser()" style="font-size:.68rem; color:var(--muted); margin-left:4px; cursor:pointer;">(salir)</span>`;
  } else {
    loginLink.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <span onclick="showLoginPrompt(false)">Guardar mis artículos</span>`;
  }
}

/* ═══════════════════════════════════════
   INIT ON LOAD
═══════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', async () => {
  const articleId = getArticleId();
  const btn = document.getElementById('btn-like');
  if (btn && isLikedLocal(articleId)) btn.classList.add('liked');

  await initFirebase();
});
