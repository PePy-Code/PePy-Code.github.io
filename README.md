# pepy-code.github.io

Portafolio personal — ciberseguridad, CTFs y desarrollo web.

Sitio estático (HTML/CSS/JS, sin build) publicado con GitHub Pages en https://pepy-code.github.io

## Editar
- Contenido en español: `index.html`
- Traducción al inglés: `js/i18n.js` (mismas claves `data-i18n`)
- Stats de HTB: sección `#htb` en `index.html` (se actualizan a mano)
- Certificados: `assets/certs/`

## Probar localmente
```bash
python -m http.server 8000
# abrir http://localhost:8000
```

## Extras
- IOC Extractor: vive en su propio repo → https://github.com/PePy-Code/ioc-extractor
- Modo simple (botón en la barra): quita efectos; se guarda en `localStorage`.
- Paleta de comandos: `Ctrl+K` o `/`.
- Versión imprimible: imprimir la página genera un resumen en blanco y negro.
