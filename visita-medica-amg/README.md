# Visita Médica AMG · Ki-CAB 2026

**Aplicación de detailing offline-first para fuerza de ventas.**
México Sin Cáncer Gástrico · Carnot + AMG · 150 representantes · Mayo–Diciembre 2026.

---

## Qué es

Una aplicación web progresiva (PWA) instalable en tablets Android que el rep abre en el consultorio para presentar los mensajes aprobados del ciclo al médico. Funciona sin internet. Sincroniza analytics + datos de visita cuando la tablet vuelve a tener conexión.

## Contenido del piloto

3 ciclos de ejemplo (del total de 8):

| Ciclo | Mes | Tema | Interactivos |
|---|---|---|---|
| 1 | Mayo 2026 | La bacteria silenciosa | Calculadora de riesgo · Visor 3D estómago |
| 2 | Junio 2026 | Diagnóstico sin pretextos | Visor 3D estómago |
| 3 | **Julio 2026 (activo)** | Tratamiento que funciona | Comparador Ki-CAB · QR seguimiento |

## 4 interactivos incluidos

1. **Calculadora de riesgo H. pylori** — `componentes/calculadora-riesgo.html`
   6 preguntas clínicas + epidemiológicas. Score 0-17. Semáforo + recomendación de prueba basada en Maastricht VI.

2. **Visor 3D anatómico** — `componentes/visor-3d.html`
   Estómago 3D navegable con Three.js (rotación con drag, pinch zoom, auto-girar). Muestra 6 etapas de la progresión de Correa con hotspots pulsantes. Toggle de bacteria H. pylori visible como partículas colonizando la mucosa.

3. **Comparador Ki-CAB vs triple terapia** — `componentes/comparador-kicab.html`
   4 vistas tabbed: Eficacia · Duración & adherencia · Resistencia a claritromicina por región de México · Interacciones farmacológicas. Barras animadas, toggle de drugs.

4. **QR de seguimiento** — `componentes/qr-seguimiento.html`
   Formulario de cierre de visita (nombre médico, especialidad, temperatura, compromiso, notas). Genera QR único + sincroniza a Firebase para dashboard de Polar.

## Stack técnico

- HTML5 single-file per componente
- Service Worker (cache-first con stale-while-revalidate) — offline real
- Manifest PWA instalable → add to home screen en Android
- IndexedDB (localStorage por ahora) para cola de eventos
- Firebase Realtime Database — compartido con `polar-amg-hub-2026` — para analytics en tiempo real
- Three.js r128 para el visor 3D (~580KB gzipped, cacheado)
- QRCode.js para QR generation
- Fonts: Montserrat + Inter (Google Fonts con `display=block` para evitar FOUT)

## Estructura

```
visita-medica-amg/
├── index.html                 · shell + home + navegación
├── manifest.json              · PWA instalable
├── service-worker.js          · cache offline
├── README.md                  · este archivo
├── data/
│   └── ciclos.json            · 3 ciclos con claims + metadata
├── css/
│   └── rep-stack.css          · tokens + layout + componentes
├── js/
│   └── rep-engine.js          · navegación + sync + analytics
└── componentes/
    ├── calculadora-riesgo.html
    ├── visor-3d.html
    ├── comparador-kicab.html
    └── qr-seguimiento.html
```

## Cómo instalar en una tablet Android (para el rep)

1. El rep abre Chrome en la tablet (con wifi de oficina)
2. Navega a `https://claude-made.github.io/vm-amg-2026/` (URL final después del deploy)
3. Chrome muestra banner "Añadir a pantalla de inicio" → aceptar
4. La app queda como ícono en home, fullscreen, sin barra de Chrome
5. Primer uso online: captura ID de rep (ej. `REP-012`) — persistente
6. Service Worker descarga ~30 MB en ~2 min → desde ese momento funciona sin internet

## Deploy

Mismo patrón que el hub AMG:

```bash
# Crear repo en claude-made organization
gh repo create claude-made/vm-amg-2026 --public

# Clonar y pushear
git clone https://github.com/claude-made/vm-amg-2026.git
cp -R visita-medica-amg/* vm-amg-2026/
cd vm-amg-2026
git add -A
git commit -m "initial VM AMG"
git push

# Activar GitHub Pages: Settings → Pages → Source: main → /root
# URL disponible en 2 min: https://claude-made.github.io/vm-amg-2026/
```

## Analytics — qué se captura

Cada evento se registra localmente + se sincroniza a Firebase cuando hay conexión:

| Evento | Payload |
|---|---|
| `ciclo_abierto` | `{ ciclo }` |
| `slide_vista` | `{ ciclo, idx }` |
| `interactivo_abierto` | `{ id, claim }` |
| `calc_riesgo_completada` | `{ score, level, respuestas }` |
| `3d_stage_visto` | `{ stage, label }` |
| `comparador_view` | `{ view }` |
| `visita_qr_generado` | `{ medico, especialidad, ciudad, temperatura, compromiso, notas, visitaId, repId }` |
| `sesion_completa` | `{ ciclo, duracion_ms, slides_vistos, interactivos_usados }` |

Dashboard de Polar puede leer `polar-amg-hub-2026.firebaseio.com/vm_amg_2026/events` para ver flujo en tiempo real.

## Qué no se incluye en el piloto (roadmap)

- Ciclos 4–8 (agosto a diciembre) — siguen la misma estructura, se agregan claims al JSON
- Heatmap de México con prevalencia por estado (componente extra)
- Timeline del contagio al cáncer (scroll horizontal)
- Simulador de diálogo con paciente (decisión ramificada)
- PDF generator local (jsPDF) para entregar al médico
- Dashboard de gerencia (página separada con agregados de los 150 reps)
- Audio embebido (testimonios + narraciones)
- Modelo 3D del estómago .glb (reemplazando el procedural actual)

## Compliance

Todo el contenido proviene del corpus aprobado Carnot/AMG (`claims[]` del calendario editorial 2026).
Los interactivos usan referencias de literatura peer-reviewed declaradas en cada pantalla.
El material es estrictamente educativo, sin promocionar fuera de indicación aprobada.

## Versiones y próximos pasos

- **v1.0 (2026-04-23)** — piloto con 3 ciclos + 4 interactivos + PWA offline
- **v1.1** — agregar ciclos 4-5 (agosto, septiembre) + heatmap México
- **v1.2** — simulador de diálogo + PDF generator + dashboard gerencia
- **v2.0** — migración a `.glb` para visor 3D + audio embebido + modo presentación kiosk
