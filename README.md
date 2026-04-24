# México Sin Cáncer Gástrico — Hub 2026

Sitio web de la campaña educativa de detección de *Helicobacter pylori*, avalada por la **Asociación Mexicana de Gastroenterología (AMG)**.

---

## Publicar en GitHub Pages

### 1. Crear el repositorio

1. En GitHub, crea un repositorio nuevo — recomendado: `amg-pylori-hub` (puede ser privado)
2. Desde la carpeta `AMG-Pylori` en tu Mac, inicializa Git y sube el contenido:

```bash
cd ~/Library/Mobile\ Documents/com\~apple\~CloudDocs/M26GA/AMG-Pylori
git init
git add .
git commit -m "Hub México Sin Cáncer Gástrico 2026 — primera versión"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/amg-pylori-hub.git
git push -u origin main
```

### 2. Activar GitHub Pages

1. En tu repositorio → **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / Folder: `/ (root)`
4. Guardar

El sitio estará disponible en `https://TU-USUARIO.github.io/amg-pylori-hub/` en ~2 minutos.

### 3. Dominio personalizado

El archivo `CNAME` ya está incluido con el dominio `mexicosincancergastrico.com.mx`.

En tu proveedor de DNS, agrega estos registros:

| Tipo  | Nombre | Valor                    |
|-------|--------|--------------------------|
| A     | @      | 185.199.108.153          |
| A     | @      | 185.199.109.153          |
| A     | @      | 185.199.110.153          |
| A     | @      | 185.199.111.153          |
| CNAME | www    | TU-USUARIO.github.io.    |

En GitHub Pages → Custom domain → ingresa `mexicosincancergastrico.com.mx` → activar **Enforce HTTPS**.

---

## Estructura de archivos

```
AMG-Pylori/
├── index.html                    # Homepage
├── deteccion.html                # Campaña de detección
├── para-medicos.html             # Portal HCP
├── articulos/
│   ├── index.html                # Listado de artículos
│   ├── pylori-silencioso.html    # Artículo 1 — Mayo 2026
│   ├── gastritis-o-pylori.html   # Artículo 2 — Junio 2026
│   └── prueba-aliento.html       # Artículo 3 — Julio 2026
├── assets/
│   ├── hub.css                   # Design system completo
│   └── img/
│       ├── hero.png
│       ├── bacteria.png
│       ├── doctor.png
│       ├── breath.png
│       ├── gastritis.png
│       └── familia.png
├── HUB_AMG_PYLORI/
│   └── brand_amg/
│       └── logo_amg_transparent.png
├── .nojekyll                     # Necesario para GitHub Pages
├── CNAME                         # Dominio personalizado
└── README.md                     # Este archivo
```

---

## Paleta de diseño

| Token     | Hex       | Uso                          |
|-----------|-----------|------------------------------|
| Navy      | `#183888` | Encabezados, fondos hero     |
| Teal AMG  | `#30B8B0` | Acciones, highlights, links  |
| Dorado AMG| `#887028` | Sello AMG, alertas, warnings |
| Navy Deep | `#102850` | Fondos oscuros alternos      |
| Off-white | `#F5F7FA` | Fondos de sección clara      |

Tipografía: **Montserrat** (titulares) · **Open Sans** (cuerpo)

---

## Agregar nuevos artículos

1. Copia `articulos/pylori-silencioso.html` como plantilla
2. Actualiza: título, descripción meta, imagen hero, fecha, contenido, artículos relacionados
3. Agrega la tarjeta correspondiente en `articulos/index.html` y en `index.html` (sección "Últimos artículos")
4. Genera imagen con GPT Image (landscape, 1536×1024) → guarda en `assets/img/`

---

*Campaña educativa 2026 · Polar Multimedia para la Asociación Mexicana de Gastroenterología*
