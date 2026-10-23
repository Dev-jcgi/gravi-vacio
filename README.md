# Gravi en el Vacío — Versión Web (Phaser 3.90)

Juego serio de cinemática (tiempo, distancia y velocidad: $v = d / t$) para la tesis de UNISUR.
La versión web **reproduce el juego de Unity** (`E:\jc-gi\Gravi_Claude\Assets`): mismos escenarios,
personajes, textos, voces, tiempos y mecánicas. Los escenarios no se dibujan a mano: se exportan
de las escenas `.unity` con las herramientas de `tools/`.

## Stack
* **Motor:** Phaser 3.90.0 (WebGL, física Arcade)
* **Empaquetador:** Vite 8
* **Métricas:** Firebase 13 (Firestore anónimo; modo "solo local" disponible)
* **Despliegue:** GitHub Actions + GitHub Pages

## Comandos

```bash
npm install
npm run dev        # servidor de desarrollo
npm run build      # compila en dist/
npm run preview    # prueba la compilación

# Regenerar los escenarios desde Unity (Python 3 con PyYAML y Pillow; solo lee el proyecto Unity)
python tools/exportar_unity.py
# Regenerar hojas de Gravi, música, voces, efectos y fuente (requiere ffmpeg)
python tools/build_assets.py
```

## Recorrido (igual que Build Settings de Unity)

| Web | Unity | Contenido |
|---|---|---|
| `Privacidad` | — | Aviso de privacidad (obligatorio la primera vez) |
| `Prologo` | 1-Prologue | Narración del abuelo I.N. (Narratives.prefab) |
| `Menu` | MainMenu | Ilustración de Gravi y la luna; jugar, elegir nivel, prólogo, créditos |
| `Tutorial` | Tutorial_Level | Moverse, saltar, agacharse, empujar la caja al botón, plataforma y portal |
| `Transicion0` | 0-Transition | Gravi y el diario del abuelo |
| `Tiempo` | Time_Level 1 | Rompecabezas 4 × 4 del retrato del abuelo, 70 s (`Puzzle.tiempoLimite`) |
| `Transicion1` | 1-Transition | "El diario habla de fórmulas…" |
| `Distancia` | Distance_Level | Tres caminos de cajas de 10 m, contador "Distancia: N mts.", vista general de 16 s, teletransporte a los 40 s |
| `Transicion3` | 3-Transition | "Encontré otra entrada en su diario…" |
| `Velocidad` | Speed_Level | Retos 12 m / 2 s, 40 m / 5 s y 140 m / 10 s con ítems que cambian el salto |
| `Transicion4` | 4-Transition | "Entiendo ahora…" |
| `PreFinal` | PreFinal | Gravi sale del portal y sube al ascensor |
| `Final` | Final_Level | Ascensor, recuerdos de tiempo, distancia y velocidad, voces finales, "Continuará…" |
| `Aula` | AulaEducativo | Repaso con los paneles de Unity y las cuatro voces del aula |
| `Fin` | (ExitGame) | Cierre y regreso al menú |

## Arquitectura

```
juego/
├── tools/
│   ├── unity_scene.py      # aplana una escena .unity con prefabs anidados (sprites, colisiones, scripts)
│   ├── exportar_unity.py   # escribe public/assets/unity/{escenas,tex} e indice.json
│   ├── unity_anim.py       # resume AnimationClips (tiempos de textos e intros)
│   ├── unity_timeline.py   # resume Timelines (escenas finales)
│   └── build_assets.py     # hojas de Gravi, audio, efectos y fuente
├── public/assets/
│   ├── unity/              # escenas exportadas + atlas de texturas (≈ 6 MB)
│   ├── sprites/            # animaciones de Gravi (64 px = 0.64 u)
│   ├── audio/              # música, voces y efectos de Unity
│   └── fonts/              # Press Start 2P (fuente del juego Unity)
└── src/
    ├── config.js           # 1 u de Unity = 100 px; física de PlayerMovement.cs
    ├── data/secuencias.js  # textos y tiempos de prólogo, transiciones e intros (de los AnimationClips)
    ├── game/
    │   ├── Escenario.js    # construye una escena exportada (sprites, grupos, sólidos)
    │   ├── Gravi.js        # controlador (Unity + correr, salto variable, coyote time, buffer)
    │   ├── Objetos.js      # cajas empujables y plataformas animadas
    │   ├── Portal.js       # portal de dos zonas (Portal.cs)
    │   └── UI.js           # paneles, diálogos (Animacion.cs) y textos narrativos
    ├── scenes/             # Boot, Privacidad, Secuencia, Menu, NivelBase, Tutorial, Tiempo,
    │                       # Distancia, Velocidad, Finales, Pausa
    └── services/           # Firebase y telemetría anónima
```

`src/dev/pruebas.js` solo sirve para pruebas en desarrollo (no se incluye en la compilación).

## Telemetría (anónima)
Eventos por escena: inicio y fin, diálogos, caídas, caja en el botón, rompecabezas (segundos, piezas,
movimientos, completo o tiempo agotado), camino elegido y metros en Distancia, teletransportes,
ítem elegido en Velocidad (correcto, salto, intento) y juego completado.

## Música
Las pistas de *Hollow Knight* se mantienen por ahora en un solo punto (`CONFIG.AUDIO.TRACKS`).
No deben publicarse en abierto sin reemplazarlas.
