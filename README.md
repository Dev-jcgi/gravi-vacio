# Gravi en el Vacío — Versión Web (Phaser 3.90)

Videojuego educativo y serio de física clásica (Cinemática / MRU: $v = d / t$) desarrollado para la tesis universitaria de UNISUR.

## Stack Tecnológico
* **Motor:** Phaser 3.90.0 (HTML5 Canvas / WebGL)
* **Empaquetador:** Vite 8
* **Backend y Métricas:** Firebase 13 (Firestore anónimo)
* **Despliegue:** GitHub Actions + GitHub Pages

## Comandos de Desarrollo

```bash
# Instalar dependencias (desde Publicacion/juego)
npm install

# Iniciar servidor de desarrollo en local (http://localhost:3000)
npm run dev

# Compilar para producción (carpeta dist/)
npm run build

# Probar compilación de producción localmente
npm run preview
```

## Arquitectura de la Etapa 1
```
juego/
├── index.html                   # Contenedor responsive 16:9 y tema oscuro
├── vite.config.js               # Configuración base relativa ('./')
├── package.json                 # Scripts y dependencias
├── firestore.rules              # Reglas de seguridad éticas de Firestore
├── PRIVACIDAD.md                # Declaración de minimización y protección de datos
├── public/
│   └── assets/                  # Spritesheets, audios en MP3, tiles y manifest.json
└── src/
    ├── main.js                  # Punto de entrada y configuración de Phaser
    ├── config.js                # Parámetros físicos (1 tile = 1 metro) y constantes
    ├── data/
    │   └── dialogos.js          # Subtítulos y transcripción de diálogos
    ├── services/
    │   ├── firebase.js          # Inicialización perezosa y auth anónima
    │   └── telemetria.js        # Cola de eventos pedagógicos hacia Firestore/localStorage
    ├── procgen/
    │   ├── rng.js               # PRNG Mulberry32 determinista con semilla
    │   ├── megaestructura.js    # Fondo procedural en capas con paralaje
    │   └── niveles.js           # Generador de tramos del Piso 0 y agente validador
    ├── game/
    │   ├── Gravi.js             # Controlador: caminar, correr, salto variable, coyote time, agachar y empujar
    │   ├── Caja.js              # Objeto físico con masa y arrastre
    │   ├── Boton.js             # Sensor de presión con coordenada x en metros
    │   ├── Portal.js            # Puerta de transición entre pisos
    │   └── New.js               # Robot mentor con animación flotante
    └── scenes/
        ├── Boot.js              # Precarga de assets y creación de animaciones
        ├── Privacidad.js        # Pantalla obligatoria de consentimiento ético
        ├── Menu.js              # Menú principal y créditos
        ├── Prologo.js           # Narrativa del abuelo I.N. con subtítulos y audio
        ├── Tutorial.js          # Piso 0: Dominio del movimiento y coordenada de posición
        └── HUD.js               # Compás con lectura en metros, regla Q y menú de pausa
```

## Próximos Pasos (Etapa 2)
* **Piso 1 (Tiempo):** Compuertas periódicas de los Tejedores y acertijo del retrato en 70 s.
* **Piso 2 (Distancia):** Comparación de tres trayectorias A $\to$ B y medición de longitud.
* **Piso 3 (Velocidad):** Sincronización con plataformas móviles mediante la fórmula $v = d / t$.
