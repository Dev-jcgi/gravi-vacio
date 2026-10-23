# Gravi en el Vacío — Diseño de la versión web

Documento de diseño de la versión HTML5 (Phaser 3). Parte del GDD v2 (`Gravi_Guion-GDD_v2.docx`) y lo amplía con un universo propio, mecánicas rediseñadas y generación procedural.

---

## 1. Universo: El Vacío

> Influencia declarada: la estética de megaestructura de Tsutomu Nihei (*BLAME!*): escala abrumadora, arquitectura que se construye sola, silencio. **No se usa ningún personaje, lugar, término ni elemento de su obra.** El mundo, la historia y los nombres son propios.

### El mundo
**El Vacío** es una torre-ciudad sin bordes conocidos. Nadie recuerda quién la empezó. La siguen levantando los **Tejedores**, máquinas constructoras que nunca se detienen ni siguen un plano: añaden pasarelas, cierran pasillos y abren abismos sin aviso.

Durante siglos el Vacío se mantuvo habitable gracias a **la Constante**: un registro de medidas —cuánto dura algo, cuánto mide, a qué ritmo cambia— que los Tejedores consultaban para construir. Los humanos capaces de leerla se llamaban **Medidores**.

La Constante se fracturó. Desde entonces los pisos sufren **la Deriva**: se reconfiguran cada vez que alguien los recorre. Por eso ningún mapa sirve dos veces. (Esto justifica en la narrativa la **generación procedural**: cada partida, la torre es distinta.)

### Personajes
| Personaje | Rol |
|---|---|
| **Gravi** | Nieta de I.N. Encuentra su diario y un **Compás**, el instrumento con el que los Medidores leían la Constante (en el juego es el HUD: mide tiempo, distancia y velocidad). |
| **I.N.** | El abuelo. Uno de los últimos Medidores. Subió la torre para restaurar la Constante y no regresó. Habla a través de su diario y de grabaciones. |
| **New** | Una unidad de mantenimiento de los Tejedores, defectuosa: en lugar de construir, explica. Es el mentor de Gravi. |
| **Los Tejedores** | No son enemigos: son el clima del Vacío. Mueven plataformas, abren y cierran compuertas y derrumban pasarelas con ritmos que se pueden medir. |
| **La Deriva** | Zonas inestables donde la estructura se desarma. Caer en ella devuelve a Gravi al último punto estable. |

### Arco
1. **Prólogo** — La voz del abuelo: “Busqué respuestas y encontré algo más… el vacío.”
2. **Piso 0, Tutorial** — Gravi aprende a moverse y a fijar posiciones (empujar una caja hasta una coordenada exacta).
3. **Piso 1, Tiempo** — Compuertas de los Tejedores que se abren por ventanas medibles; al final, el retrato roto del abuelo (70 s).
4. **Piso 2, Distancia** — Tres caminos que la Deriva disfraza; el Compás mide cada metro.
5. **Piso 3, Velocidad** — Pasarelas que llegan a su destino en un tiempo fijo: hay que elegir la velocidad exacta (v = d / t).
6. **Cima** — Los recuerdos de I.N. y la revelación: la Constante no es una máquina, es entender cómo se mueve el mundo.
7. **Aula Educativa** — Repaso guiado por New.

---

## 2. Principios de diseño

1. **El concepto es la mecánica.** Cada piso se supera *midiendo*, no reaccionando rápido.
2. **Medir antes de actuar.** El Compás (HUD) muestra siempre las magnitudes del piso en unidades reales: **1 bloque = 1 metro**, el tiempo en segundos.
3. **El error enseña.** Fallar muestra el cálculo correcto y devuelve al jugador al último punto estable, sin castigo largo.
4. **Variación con propósito.** La generación procedural cambia el escenario y los números, nunca el objetivo de aprendizaje.
5. **Accesible.** Subtítulos en todas las voces, controles remapeables a futuro, sin dependencia de reflejos rápidos.

---

## 3. Mecánicas por piso (rediseño)

### Controles
| Acción | Teclas |
|---|---|
| Caminar | ← → / A D |
| Correr | Mayús (Shift) mantenido |
| Saltar | Espacio / W / ↑ (salto variable: soltar antes = salto corto) |
| Agacharse | S / ↓ / Ctrl |
| Empujar | Caminar contra una caja (E para agarrar con más fuerza) |
| Medir (Compás) | Q — muestra la regla entre Gravi y el objetivo |
| Pausa | Esc |

Ayudas de control: *coyote time* (100 ms para saltar después de dejar el borde) y *jump buffer* (120 ms), para que el desafío sea pensar, no la precisión del dedo.

### Piso 0 — Dominio del movimiento (Posición)
- **Objetivo:** dominar los controles y entender la posición como coordenada.
- **Secuencia:** caminar → saltar un desnivel → agacharse bajo una viga → empujar una caja hasta un **botón ubicado en una coordenada (x, y)** que el Compás muestra.
- **Retroalimentación:** el Compás muestra la posición de la caja en metros mientras se empuja; al llegar, el botón se activa y la plataforma se eleva.
- **Procedural:** cambia la distancia de los tramos, la altura del desnivel y la coordenada objetivo del botón.

### Piso 1 — El despertar del tiempo
- **Fase A, compuertas sincronizadas:** cada compuerta de los Tejedores se abre durante **t segundos** cada **T segundos** (el Compás muestra t y T). Gravi debe salir en el momento correcto según la distancia que la separa.
- **Fase B, el retrato:** rompecabezas de 3×3 con el retrato del abuelo en **70 s**. Si se acaba el tiempo, las piezas se bloquean y el portal se abre igual (se aprende del error).
- **Variable registrada:** intentos por compuerta, tiempo de espera elegido, tiempo restante del rompecabezas.

### Piso 2 — Los caminos de la distancia
- **Mecánica:** tres caminos de A a B generados con longitudes distintas. Desde el mirador, el jugador puede **medir** con el Compás (regla) antes de elegir.
- **Retroalimentación:** al llegar a B se muestran las tres longitudes reales y el recorrido de Gravi. Si eligió un camino más largo, se compara: “Recorriste 46 m; el camino más corto medía 31 m”.
- **Diferencia clave:** se distingue **distancia recorrida** de **desplazamiento** (línea recta A→B), base para cursos posteriores.

### Piso 3 — La danza de la velocidad (MRU)
- **Mecánica:** una plataforma de los Tejedores parte en el instante t = 0 y llega al otro lado del abismo en **t segundos**. Gravi está a **d metros** del punto de encuentro. El jugador elige una velocidad (ítem) y Gravi avanza en **movimiento rectilíneo uniforme** a esa velocidad.
  - v = d / t → Gravi y la plataforma coinciden y cruza.
  - v menor → la plataforma ya pasó. v mayor → Gravi llega antes y no hay suelo.
- **Retroalimentación:** se dibuja la gráfica posición–tiempo de Gravi y de la plataforma; el cruce de las rectas es la respuesta.
- **Retos:** 3 por partida, con d y t generados para que v sea entero (6, 8, 14 m/s en la versión original).

### Cima y Aula
- **Cima:** recorrido narrativo sin peligro; cada recuerdo resume un concepto.
- **Aula Educativa:** New repasa tiempo, distancia y velocidad con ejemplos tomados de *esa* partida (“en el piso 3 recorriste 140 m en 10 s”).

---

## 4. Generación procedural (“IA procedural”)

El Vacío se construye con dos sistemas deterministas a partir de una **semilla** (la misma semilla produce la misma torre; útil para investigación y para que un grupo juegue la misma versión).

### 4.1 Escenarios: la megaestructura
Fondo en capas con paralaje, generado en tiempo real:
1. **Lejos:** siluetas de torres y vigas en niebla (rectángulos y celosías trazados por gramática).
2. **Medio:** columnas, cables colgantes, luces de los Tejedores parpadeando.
3. **Cerca:** fragmentos del atlas de la estructura (sprites del juego Unity) colocados por reglas.

Las reglas imitan cómo “construiría” una máquina sin plano: crecimiento vertical con ramificaciones, simetrías rotas y densidad que aumenta con la altura del piso.

### 4.2 Niveles: generación por tramos con agente validador
- El nivel se arma encadenando **tramos** (chunks) de una biblioteca: suelo, desnivel, abismo, túnel bajo, caja-botón, compuerta, mirador, etc. Cada tramo declara qué habilidad exige.
- Un **agente validador** simula el movimiento de Gravi (física del salto, altura de agachado) y **descarta cualquier tramo imposible** antes de construirlo. Así la variación nunca rompe el nivel.
- La dificultad se ajusta con la telemetría: si un jugador falla repetidamente un tipo de tramo, el generador reduce su exigencia (por ejemplo, abismos más cortos) en la siguiente reconstrucción.

---

## 5. Datos y privacidad
Ver `PRIVACIDAD.md`. Resumen: solo eventos de juego anónimos (escena, mecánica, tiempos, intentos, resultado), identificados por un ID aleatorio de sesión. Sin nombres, correos, IP, ubicación ni ningún dato personal. Se muestra un aviso antes de jugar.

| Colección (Firestore) | Contenido |
|---|---|
| `eventos` | Bitácora de juego: escena, mecánica, evento, valor, tiempo |
| `progreso` | Piso alcanzado y mejores tiempos por sesión anónima |
| `puntajes` | Ranking por código de grupo con alias generado |
| `tests` | Pre-test y post-test (código anónimo) |
| `comentarios` | Opiniones enviadas desde el juego o el sitio |
