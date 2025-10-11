# 🌐 Portfolio – German Montero Ramírez

[![Astro](https://img.shields.io/badge/Astro-Framework-blueviolet?style=flat-square&logo=astro)](https://astro.build)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://portfolio-dext.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

> **Full-Stack Developer** | .NET • Angular • Java • TypeScript • SSE  
> Costa Rica 🇨🇷 — Building efficient, scalable, and real-time web applications.

---

## 🚀 Live Demo

🌎 **[portfolio-dext.vercel.app](https://portfolio-dext.vercel.app)**  

Explora mis proyectos, tecnologías, experiencia profesional y formas de contacto.

---

## 🧠 Tecnologías Principales

| Categoría | Tecnologías |
|------------|--------------|
| **Frontend** | Astro · Angular 19 · TypeScript · HTML · CSS |
| **Backend / APIs** | .NET · Java · Spring Boot · Node.js |
| **DevOps / Cloud** | Vercel · Docker · GitHub Actions · Azure Functions |
| **Bases de Datos** | SQL Server · PostgreSQL · MongoDB |

---

## 🏗️ Estructura del Proyecto
``` bash
📁 src/
├── components/ → Componentes reutilizables (Header, Hero, TechPill, etc.)
├── layouts/ → Plantillas base (Base.astro)
├── pages/ → Rutas principales (/, /projects, /contact)
├── data/ → Fuentes de datos (GitHub API, JSONs locales)
└── styles/ → CSS global y variables
📁 public/
├── cv/ → Archivos descargables (CV, imágenes OG)
└── icons/ → Recursos estáticos
```
---
## 💡 Características

✅ Sección de presentación con resumen profesional  
✅ Carga dinámica de proyectos desde la **API de GitHub**  
✅ Etiquetas visuales de tecnologías (componentes “TechPill”)  
✅ Diseño responsive y accesible  
✅ SEO configurado con metadatos OG y Twitter Cards  
✅ Despliegue continuo en **Vercel**  
✅ Descarga de CV directamente desde el sitio 
---
## ⚙️ Scripts de desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa del build
npm run preview
```

## 🧩 Variables de entorno
Crea un archivo `.env` en la raíz con tu token de GitHub (solo lectura):
``` bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME = ""
GITHUB_TOPIC = ""
```
---
## 🌍 SEO y Metadatos
Ubicados en la plantilla `BaseLayout.astro`:
```astro
<meta name="description" content="Portafolio de German Montero Ramírez, Full-Stack Developer en Costa Rica. Proyectos, experiencia y contacto." />
<meta property="og:title" content="German Montero · Full-Stack Developer" />
<meta property="og:image" content="/og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
```
---
## 📷 vista previa
---

## 📄 Licencia
este proyecto está bajo la licencia MIT — ver el archivo [LICENSE](./LICENSE) para más detalles.
---
## 👋 Sobre mí

Hola, soy German Montero Ramírez, desarrollador Full-Stack con más de 6 años de experiencia creando soluciones escalables y eficientes.
Actualmente me enfoco en mejorar mi portafolio y contribuir a proyectos open-source.

🔗 [LinkedIn](https://www.linkedin.com/in/german-montero-ramirez/)
 · [GitHub](https://github.com/XDextX)
 · [Email](mailto:germonram@gmail.com)
 