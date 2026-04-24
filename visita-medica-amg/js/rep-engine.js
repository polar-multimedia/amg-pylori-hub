/* ═══════════════════════════════════════════════════════════════
   Visita Médica AMG · Engine
   Navegación · Carga de ciclos · Analytics · Sync Firebase
   ═══════════════════════════════════════════════════════════════ */

const VM = (function() {
  const NODE_ROOT = 'vm_amg_2026';
  let cicloActivo = null;
  let slideIdx = 0;
  let ciclosData = null;
  let repId = localStorage.getItem('vm_rep_id') || null;
  let sesionActual = null;
  let firebaseReady = false;
  let dbRef = null;
  let swReg = null;

  /* Firebase config — misma instancia que el hub */
  const firebaseConfig = {
    apiKey:            "AIzaSyD9qiO4mgC7j_u6emWfbIfss3ojYxS6Kx0",
    authDomain:        "polar-amg-hub-2026.firebaseapp.com",
    databaseURL:       "https://polar-amg-hub-2026-default-rtdb.firebaseio.com",
    projectId:         "polar-amg-hub-2026",
    storageBucket:     "polar-amg-hub-2026.firebasestorage.app",
    messagingSenderId: "817531667863",
    appId:             "1:817531667863:web:7bcc71aa8ebca6904930d2"
  };

  /* ─── Inicio ─── */
  async function init() {
    // Service Worker (offline)
    if ('serviceWorker' in navigator) {
      try {
        swReg = await navigator.serviceWorker.register('./service-worker.js');
        console.info('[VM] Service Worker registrado', swReg.scope);
      } catch (err) { console.warn('[VM] SW error:', err); }
    }

    // Rep ID (persistente)
    if (!repId) {
      repId = prompt('ID del representante (ej. REP-012):') || 'REP-ANON';
      localStorage.setItem('vm_rep_id', repId);
    }
    document.getElementById('vm-rep-id').textContent = repId;

    // Cargar datos
    ciclosData = await fetch('./data/ciclos.json').then(r => r.json());

    // Renderizar home
    renderHome();

    // Conectar Firebase en background (no bloquea UX)
    connectFirebase();

    // Monitor de red
    window.addEventListener('online',  updateNetStatus);
    window.addEventListener('offline', updateNetStatus);
    updateNetStatus();

    // PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      window._deferredInstall = e;
      document.querySelector('.vm-install').classList.add('show');
    });
  }

  /* ─── Firebase ─── */
  async function connectFirebase() {
    if (!navigator.onLine) {
      console.info('[VM] Offline — Firebase pospuesto');
      return;
    }
    try {
      await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js');
      firebase.initializeApp(firebaseConfig);
      dbRef = firebase.database().ref(NODE_ROOT);
      firebaseReady = true;
      console.info('[VM] Firebase conectado');
      syncPendingEvents();
    } catch (err) {
      console.warn('[VM] Firebase falló (modo offline):', err);
    }
  }
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.async = false; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  /* ─── Home ─── */
  function renderHome() {
    const home = document.getElementById('vm-home');
    const activeIdx = parseInt(localStorage.getItem('vm_ciclo_active') || '2');  // ciclo 3 = julio = idx 2
    let html = `
      <div class="vm-home__hero">
        <div style="flex:1">
          <div class="vm-home__hero__badge">México Sin Cáncer Gástrico · Carnot + AMG</div>
          <h1>Bienvenido, ${repId}</h1>
          <p>${ciclosData.campana.ciclos_totales} ciclos · Mayo–Diciembre 2026 · 150 representantes · Ki-CAB (tegoprazán)</p>
        </div>
        <div style="text-align:right">
          <div style="font-size:48px;font-weight:900;color:var(--teal-light);line-height:1">3</div>
          <div style="font-size:11px;opacity:0.8">ciclo activo</div>
        </div>
      </div>
      <div class="vm-home__section-title">Ciclos del año</div>
      <div class="vm-home__grid" id="vm-home-grid"></div>
      <div class="vm-home__section-title" style="margin-top:30px">Interactivos disponibles</div>
      <div class="vm-home__grid" id="vm-home-interacts"></div>
    `;
    home.innerHTML = html;

    // Cards de ciclos
    const grid = document.getElementById('vm-home-grid');
    ciclosData.ciclos.forEach((c, i) => {
      const isActive = i === activeIdx;
      const isPast = i < activeIdx;
      const isNext = i > activeIdx;
      const chipCls = isPast ? 'vm-home__card__chip--done' : (isNext ? 'vm-home__card__chip--next' : '');
      const chipTxt = isPast ? '✓ Cerrado' : (isNext ? 'Próximo' : 'Activo');
      const card = document.createElement('button');
      card.className = 'vm-home__card' + (isActive ? ' vm-home__card--active' : '');
      card.innerHTML = `
        <div class="vm-home__card__chip ${chipCls}">Ciclo ${c.numero} · ${chipTxt}</div>
        <div class="vm-home__card__title">${c.titulo}</div>
        <div class="vm-home__card__month">${c.mes}</div>
        <div class="vm-home__card__goal">${c.objetivo.substring(0, 95)}…</div>
        <div class="vm-home__card__meta">
          <span>⏱ ${c.duracion_estimada_min} min</span>
          <span>· ${c.claims.length} mensajes</span>
        </div>
      `;
      card.addEventListener('click', () => abrirCiclo(c.id));
      grid.appendChild(card);
    });

    // Cards de interactivos (preview)
    const interactsGrid = document.getElementById('vm-home-interacts');
    ciclosData.interactivos_disponibles.forEach(it => {
      const card = document.createElement('button');
      card.className = 'vm-home__card';
      card.innerHTML = `
        <div class="vm-home__card__chip" style="background:var(--gold)">Herramienta</div>
        <div class="vm-home__card__title">${it.nombre}</div>
        <div class="vm-home__card__goal">${it.descripcion}</div>
      `;
      card.addEventListener('click', () => abrirInteractivo(it.id, null));
      interactsGrid.appendChild(card);
    });
  }

  /* ─── Abrir ciclo ─── */
  function abrirCiclo(cicloId) {
    cicloActivo = ciclosData.ciclos.find(c => c.id === cicloId);
    if (!cicloActivo) return;
    slideIdx = 0;
    sesionActual = {
      rep_id: repId,
      ciclo: cicloId,
      inicio: Date.now(),
      slides_vistos: [],
      interactivos_usados: [],
      notas: ''
    };
    document.getElementById('vm-home').style.display = 'none';
    document.getElementById('vm-deck').style.display = 'block';
    document.getElementById('vm-topbar-title').textContent = `Ciclo ${cicloActivo.numero} · ${cicloActivo.titulo}`;
    document.getElementById('vm-topbar-title-sub').textContent = cicloActivo.mes;
    renderSlides();
    mostrarSlide(0);
    logEvent('ciclo_abierto', { ciclo: cicloId });
  }

  /* ─── Cerrar ciclo / volver a home ─── */
  function volverHome() {
    if (sesionActual) {
      sesionActual.fin = Date.now();
      sesionActual.duracion_ms = sesionActual.fin - sesionActual.inicio;
      logEvent('sesion_completa', sesionActual);
    }
    document.getElementById('vm-deck').style.display = 'none';
    document.getElementById('vm-home').style.display = 'block';
    document.getElementById('vm-topbar-title').textContent = 'Visita Médica AMG';
    document.getElementById('vm-topbar-title-sub').textContent = 'Home';
    cicloActivo = null;
    sesionActual = null;
  }

  /* ─── Renderizar slides del ciclo ─── */
  function renderSlides() {
    const deck = document.getElementById('vm-deck');
    deck.innerHTML = '';

    // Slide 0: portada del ciclo
    const cover = document.createElement('div');
    cover.className = 'vm-slide';
    cover.dataset.idx = 0;
    cover.innerHTML = `
      <div class="vm-slide__hero" style="grid-template-columns:1fr">
        <div style="text-align:center;padding:40px">
          <div class="vm-chip vm-chip--teal" style="font-size:11px">Ciclo ${cicloActivo.numero} · ${cicloActivo.mes}</div>
          <h1 style="font-size:48px;color:var(--navy);margin-top:18px;line-height:1.1">${cicloActivo.titulo}</h1>
          <p style="font-size:17px;color:var(--gray-600);line-height:1.5;margin-top:20px;max-width:600px;margin-left:auto;margin-right:auto">${cicloActivo.objetivo}</p>
          <div style="margin-top:32px;display:flex;gap:18px;justify-content:center;flex-wrap:wrap">
            <div class="vm-chip">⏱ ${cicloActivo.duracion_estimada_min} min</div>
            <div class="vm-chip">📊 ${cicloActivo.claims.length} mensajes</div>
            <div class="vm-chip vm-chip--gold">💡 ${cicloActivo.claims.filter(c => c.interactivo).length} interactivos</div>
          </div>
        </div>
      </div>
    `;
    deck.appendChild(cover);

    // Slide por cada claim
    cicloActivo.claims.forEach((claim, i) => {
      const slide = document.createElement('div');
      slide.className = 'vm-slide';
      slide.dataset.idx = i + 1;
      slide.dataset.claimId = claim.id;
      slide.innerHTML = `
        <div class="vm-slide__hero">
          <div class="vm-slide__img" style="background-image: url('${claim.imagen}')"></div>
          <div class="vm-slide__body">
            <div class="vm-chip vm-chip--teal">Mensaje ${i + 1} de ${cicloActivo.claims.length}</div>
            <div class="vm-slide__cifra">${claim.cifra}</div>
            <div class="vm-slide__label">${claim.titulo}</div>
            <div class="vm-slide__headline">${claim.headline}</div>
            <div class="vm-slide__subcopy">${claim.subcopy}</div>
            <div class="vm-slide__cta">${claim.cta}</div>
            ${claim.interactivo ? `
              <button class="vm-slide__launch" data-interact="${claim.interactivo}" data-claim="${claim.id}">
                <span class="ico">${iconForInteract(claim.interactivo)}</span>
                Abrir ${nameForInteract(claim.interactivo)}
              </button>
            ` : ''}
            <div class="vm-slide__ref">${claim.referencia_clinica || ''}</div>
          </div>
        </div>
      `;
      deck.appendChild(slide);
    });

    // Slide final: cierre + QR
    const close = document.createElement('div');
    close.className = 'vm-slide';
    close.dataset.idx = cicloActivo.claims.length + 1;
    close.innerHTML = `
      <div class="vm-slide__hero" style="grid-template-columns:1fr;align-items:center;justify-items:center">
        <div style="text-align:center;padding:40px;max-width:700px">
          <div class="vm-chip vm-chip--teal">Cierre · Ciclo ${cicloActivo.numero}</div>
          <h1 style="font-size:38px;color:var(--navy);margin-top:16px;line-height:1.15">Déjale al doctor un recuerdo tangible</h1>
          <p style="font-size:15px;color:var(--gray-600);line-height:1.5;margin-top:18px">
            Genera un QR personalizado con los materiales del ciclo que el médico puede escanear
            desde su celular. Queda registrado para seguimiento y análisis.
          </p>
          <button class="vm-slide__launch" data-interact="qr-seguimiento" style="margin-top:28px">
            <span class="ico">📱</span>
            Generar QR de seguimiento
          </button>
          <button class="vm-slide__launch" style="margin-top:12px;background:var(--gold)" onclick="VM.volverHome()">
            <span class="ico">✓</span>
            Finalizar visita
          </button>
        </div>
      </div>
    `;
    deck.appendChild(close);

    // Wire up botones de interactivos
    deck.querySelectorAll('[data-interact]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        abrirInteractivo(btn.dataset.interact, btn.dataset.claim);
      });
    });

    // Footer dots
    const dots = document.querySelector('.vm-footer__progress');
    dots.innerHTML = '';
    for (let i = 0; i < cicloActivo.claims.length + 2; i++) {
      const d = document.createElement('div');
      d.className = 'vm-footer__dot';
      d.dataset.idx = i;
      dots.appendChild(d);
    }
  }

  /* ─── Mostrar slide N ─── */
  function mostrarSlide(i) {
    if (!cicloActivo) return;
    const total = cicloActivo.claims.length + 2;
    i = Math.max(0, Math.min(total - 1, i));
    slideIdx = i;
    document.querySelectorAll('.vm-slide').forEach(s => s.classList.toggle('active', parseInt(s.dataset.idx) === i));
    document.querySelectorAll('.vm-footer__dot').forEach((d, idx) => {
      d.classList.toggle('active', idx === i);
      d.classList.toggle('done', idx < i);
    });
    document.getElementById('vm-counter').textContent = `${i + 1} / ${total}`;
    document.getElementById('vm-prev').disabled = i === 0;
    document.getElementById('vm-next').disabled = i === total - 1;

    if (sesionActual && !sesionActual.slides_vistos.includes(i)) {
      sesionActual.slides_vistos.push(i);
    }
    logEvent('slide_vista', { ciclo: cicloActivo.id, idx: i });
  }
  function nextSlide() { mostrarSlide(slideIdx + 1); }
  function prevSlide() { mostrarSlide(slideIdx - 1); }

  /* ─── Interactivos ─── */
  function abrirInteractivo(id, claimId) {
    const inter = ciclosData.interactivos_disponibles.find(i => i.id === id);
    if (!inter) return;
    const modal = document.getElementById('vm-modal');
    document.getElementById('vm-modal-title').textContent = inter.nombre;
    const body = document.getElementById('vm-modal-body');
    body.innerHTML = `<iframe src="${inter.ruta}${claimId ? '?claim=' + claimId : ''}" style="width:100%;height:100%;border:none;background:#fff"></iframe>`;
    modal.classList.add('open');
    if (sesionActual) sesionActual.interactivos_usados.push({ id, claim: claimId, ts: Date.now() });
    logEvent('interactivo_abierto', { id, claim: claimId });
  }
  function cerrarInteractivo() {
    document.getElementById('vm-modal').classList.remove('open');
    document.getElementById('vm-modal-body').innerHTML = '';
  }

  /* ─── Helpers ─── */
  function iconForInteract(id) {
    const map = { 'calculadora-riesgo': '🎯', 'visor-3d-estomago': '🧬', 'comparador-kicab': '📊', 'qr-seguimiento': '📱', 'comparador-pruebas': '🔬' };
    return map[id] || '💡';
  }
  function nameForInteract(id) {
    const inter = ciclosData.interactivos_disponibles.find(i => i.id === id);
    return inter ? inter.nombre : 'interactivo';
  }

  /* ─── Analytics / sync ─── */
  function logEvent(type, data) {
    const ev = { type, data, rep: repId, ts: Date.now() };
    // Cola local siempre
    const queue = JSON.parse(localStorage.getItem('vm_event_queue') || '[]');
    queue.push(ev);
    localStorage.setItem('vm_event_queue', JSON.stringify(queue));
    // Sync si online
    if (firebaseReady && navigator.onLine) {
      try { dbRef.child('events').push(ev); } catch (e) {}
    }
  }
  function syncPendingEvents() {
    const queue = JSON.parse(localStorage.getItem('vm_event_queue') || '[]');
    if (!queue.length || !firebaseReady) return;
    console.info('[VM] Sincronizando ' + queue.length + ' eventos pendientes');
    queue.forEach(ev => dbRef.child('events').push(ev));
    localStorage.setItem('vm_event_queue', '[]');
  }

  function updateNetStatus() {
    const dot = document.getElementById('vm-sync-dot');
    if (navigator.onLine) {
      dot.classList.remove('offline', 'error');
      if (!firebaseReady) connectFirebase();
    } else {
      dot.classList.add('offline');
    }
  }

  return {
    init, abrirCiclo, volverHome, nextSlide, prevSlide, mostrarSlide,
    abrirInteractivo, cerrarInteractivo, logEvent,
    getRepId: () => repId, getCiclo: () => cicloActivo
  };
})();

window.VM = VM;
window.addEventListener('DOMContentLoaded', VM.init);
