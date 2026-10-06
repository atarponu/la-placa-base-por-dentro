# La placa base por dentro

**Autor:** Atarponu
**Placa base elegida:** ASUS TUF GAMING B650-PLUS WIFI (AM5 · ATX · DDR5). La ilustración es una recreación esquemática, no un plano exacto de la placa.

Experiencia web interactiva de 25 escenas sobre los componentes de una placa base y cómo se comunican entre sí.
Hecha con HTML, CSS, SVG y GSAP, sin paso de compilación. Funciona sin conexión.

## Abrirla

Haz doble clic en `index.html`. Se abre en cualquier navegador moderno (Chrome, Edge, Brave, Firefox o Safari).
No hace falta servidor: las fuentes y GSAP están incluidos en `assets/`.

- **Pantalla completa:** tecla `F` o botón ⤢.
- **Ir directo a una escena:** añade `#NN` a la URL, por ejemplo `index.html#13`.

## Navegación

| Acción | Teclas / gesto |
| --- | --- |
| Siguiente / anterior | `→` `←`, `Espacio` / `Mayús+Espacio`, `AvPág` / `RePág`, rueda del ratón, deslizar en táctil |
| Primera / última | `Inicio` / `Fin` |
| Cerrar panel o zoom | `Esc` |
| Recorrer controles | `Tab` y activar con `Enter` o `Espacio` |
| Saltar a una escena | clic en la barra de progreso inferior |
| Editar textos | `E` (los cambios se guardan en este navegador) |
| Música y sonidos | `M` o botón ♪ (activada por defecto; empieza con el primer clic o tecla) |

Todo lo que responde al hover también funciona con clic, teclado y táctil.
Con `prefers-reduced-motion` activado se eliminan los bucles y los recorridos de cámara, pero la interacción sigue igual.

## Estructura

```
index.html              marcado de las 25 escenas + chrome de navegación
assets/css/main.css     tokens de diseño, estados de la placa, componentes comunes
assets/css/scenes.css   estilos de cada escena
assets/js/board.js      generador SVG de la placa (componentes, rutas, etiquetas)
assets/js/content.js    textos de cada componente (nombre, qué es, qué hace, conexiones)
assets/js/engine.js     escenario 16:9, cámara, motion helpers, navegación y edición
assets/js/scenes-a.js   escenas 01–12
assets/js/scenes-b.js   escenas 13–25
assets/js/board-css.js  estilos de la placa (se incrustan dentro del propio SVG)
assets/js/music.js      música ambiente generativa (Web Audio, sin archivos de audio)
assets/fonts/           Archivo (variable) + IBM Plex Mono, en local
assets/vendor/          GSAP 3.15
scripts/                QA visual, QA de interacción y exportaciones
screenshots/            capturas de QA (todas las escenas + estados interactivos)
exports/                presentation.pdf, presentation.pptx y las imágenes de cada escena
```

### Cómo funciona

**Escena 22 · La placa en vivo:** arrastra para girar la placa en 3D, activa la cámara térmica, cambia la carga de trabajo (reposo, juego, render) para ver el consumo en vatios y las temperaturas, y acerca el ratón a ventiladores y VRM para oírlos.

**Cámara sin parpadeos:** durante cada movimiento la placa se convierte en una imagen (canvas) y es esa imagen la que se mueve; al parar se vuelve al SVG real. Por eso los estilos de la placa viven en `assets/js/board-css.js`: si cambias un estilo de la placa, hazlo ahí.


Hay **una sola placa**, `#world`, que persiste entre escenas. Cada escena declara un encuadre de cámara:
`cam: { x, y, z, sx, sy }`. El punto `(x, y)` de la placa, en milímetros reales, se coloca en `(sx, sy)` del escenario de 1920 × 1080 con un zoom `z`.
Al cambiar de escena, la cámara se desplaza de un encuadre al siguiente, así que la presentación se recorre como una sola toma continua.

Cada escena se registra así:

```js
Deck.register('id', {
  cam:   { ... },        // encuadre
  scrim: 'l',            // velo de contraste (l / r / t / b)
  world(W) { ... },      // estado de la placa: W.focus(), W.routes(), W.install()...
  enter(el) { ... },     // timeline de entrada + interacción (dentro de gsap.context)
  leave() { ... },       // limpieza opcional
});
```

## Modificar contenidos

- **Textos de los componentes:** `assets/js/content.js`.
- **Textos de cada escena:** directamente en `index.html`. Los textos marcados con `data-edit` también se pueden editar en el navegador con la tecla `E`.
- **Datos de las escenas interactivas** (preguntas del quiz, piezas de «Construye tu PC», pasos del arranque, puertos del panel trasero, rutas de datos y de energía): son constantes con nombre en mayúsculas al principio de cada escena, en `scenes-a.js` y `scenes-b.js`. Por ejemplo: `QUIZ`, `ITEMS`, `BOOT`, `PORTS`, `DATA`, `EN`.

## Cambiar colores

En `assets/css/main.css`, `:root`:

```css
--c-cpu: #4fd3ff;   /* CPU · PCIe · rutas de datos */
--c-mem: #a995ff;   /* memoria */
--c-pwr: #ffae3b;   /* energía */
--c-sto: #52e3a0;   /* almacenamiento */
--c-io:  #ff7a66;   /* chipset · E/S */
--c-fw:  #e9e3c9;   /* firmware */
```

Cada componente de la placa toma su color de `data-cat`. Si cambias estos valores, cambia todo el sistema: placa, rutas, paneles y leyendas.

## Cambiar componentes de la placa

En `assets/js/board.js`:

- `PARTS`: posición (en mm) y categoría de cada zona interactiva.
- `drawers.<id>()`: el dibujo SVG de cada componente.
- `ROUTES`: rutas lógicas de datos y de energía (trazados SVG en mm).
- `CALLOUTS`: etiquetas técnicas de la intro y del cierre.

La placa mide 244 × 305 mm (ATX, en vertical) y todas las coordenadas están en milímetros.

## QA y exportación

Necesitas **Node 20 o superior** y un navegador Chromium instalado (Chrome, Brave o Edge; también puedes indicarlo con `CHROME_PATH`).

```bash
cd scripts && npm install                 # una sola vez
node scripts/qa.mjs                       # captura las 24 escenas y avisa de desbordes
node scripts/qa.mjs 3 7 --size=1280x720   # escenas concretas, a otro tamaño
node scripts/qa.mjs --mobile              # viewport de móvil
node scripts/qa-interact.mjs              # prueba clics, arrastre, teclado y quiz
node scripts/contact.mjs                  # hoja de contactos en screenshots/

node scripts/export.mjs                   # exports/slides/*.jpg + exports/presentation.pdf
python3 -m venv scripts/.venv && scripts/.venv/bin/pip install python-pptx
scripts/.venv/bin/python scripts/export_pptx.py   # exports/presentation.pptx
```

El PDF y el PPTX son instantáneas estáticas del estado final de cada escena. La versión principal es la de HTML.

## Notas técnicas del contenido

Se revisaron los conceptos para evitar simplificaciones habituales:

- **LGA y PGA** se explican como conceptos físicos, no como «Intel frente a AMD»: AM5 es LGA y AM4 era PGA.
- **El controlador de memoria** está dentro de la CPU. El chipset, o PCH, es el hub de E/S y se une a la CPU por un único enlace: DMI en Intel, PCIe en AMD.
- **PCIe:** más lanes significan un enlace más ancho, no «x16 = 16 veces más rápido». También se distingue entre tamaño físico y lanes eléctricas. Las velocidades por generación están en GT/s por lane y en ancho de banda aproximado por sentido.
- **M.2 es el formato y NVMe el protocolo.** Existen SSD M.2 SATA.
- **UEFI** es el estándar moderno y **BIOS** el firmware heredado; se sigue diciendo «la BIOS» por costumbre.
- **La pila CMOS** mantiene el RTC y, según la plataforma, algunos ajustes. **No** «alimenta la BIOS»: el firmware vive en una memoria flash no volátil.
- **La secuencia de arranque** incluye PS_ON# y Power Good, el procesador de seguridad (PSP/CSME), el entrenamiento de memoria, la ESP y ExitBootServices.
- **No se inventan especificaciones** de ningún modelo concreto: la placa es un ATX genérico y los puertos del panel trasero son «de ejemplo».
