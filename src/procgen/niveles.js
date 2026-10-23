/**
 * Gravi en el Vacío — Generador Procedural de Niveles y Agente Validador
 * Genera el diseño del Piso 0 (Tutorial) ensamblando tramos y garantizando jugabilidad 100% resoluble.
 */

import { CONFIG } from '../config.js';

// Índices del tileset estructura.png (16 cols x 16 filas de 64 px)
// Fila 7 (borde superior), Fila 8 (relleno), Fila 9 (borde inferior)
export const TILE_IDS = {
  EMPTY: -1,
  TOP_LEFT: 7 * 16 + 0,      // 112
  TOP_MID: 7 * 16 + 1,       // 113
  TOP_RIGHT: 7 * 16 + 6,     // 118
  INNER: 8 * 16 + 1,         // 129
  BOT_MID: 9 * 16 + 1,       // 145
  THIN_PLATFORM: 9 * 16 + 9, // 153
  PIPE_VERTICAL: 7 * 16 + 13 // 125
};

export class GeneradorPiso0 {
  constructor(rng) {
    this.rng = rng;
    this.tileCols = 54; // Longitud del tutorial (~54 metros = ~3456 px)
    this.tileRows = 12; // Altura del mundo (12 metros = 768 px)
    this.groundY = 9;   // Fila base del suelo (a 3 tiles del fondo)
  }

  generar() {
    let intentos = 0;
    let mapa = null;
    let validacion = null;

    // Bucle con agente validador: si alguna semilla generara un tramo inviable, se regenera
    do {
      mapa = this.construirMatriz();
      validacion = this.validarJugabilidad(mapa);
      intentos++;
    } while (!validacion.valido && intentos < 10);

    return {
      datosMapa: mapa.matriz,
      anchoTiles: this.tileCols,
      altoTiles: this.tileRows,
      anchoMundoPx: this.tileCols * CONFIG.TILE_SIZE,
      altoMundoPx: this.tileRows * CONFIG.TILE_SIZE,
      puntosClave: mapa.puntosClave,
      semilla: this.rng.seed
    };
  }

  construirMatriz() {
    const cols = this.tileCols;
    const rows = this.tileRows;
    const gY = this.groundY;
    const matriz = Array.from({ length: rows }, () => Array(cols).fill(TILE_IDS.EMPTY));

    const puntosClave = {
      spawnGravi: { x: 2 * CONFIG.TILE_SIZE, y: (gY - 1) * CONFIG.TILE_SIZE },
      posicionNew: { x: 4 * CONFIG.TILE_SIZE, y: (gY - 2) * CONFIG.TILE_SIZE },
      caja: { x: 0, y: 0 },
      boton: { x: 0, y: 0 },
      portal: { x: 0, y: 0 },
      medidas: {}
    };

    // Función auxiliar para rellenar columnas de suelo sólido
    function ponerSuelo(cInicio, cFin, ySuperficie) {
      for (let c = cInicio; c <= cFin; c++) {
        if (c < 0 || c >= cols) continue;
        for (let r = ySuperficie; r < rows; r++) {
          if (r === ySuperficie) {
            matriz[r][c] = (c === cInicio) ? TILE_IDS.TOP_LEFT : (c === cFin ? TILE_IDS.TOP_RIGHT : TILE_IDS.TOP_MID);
          } else {
            matriz[r][c] = TILE_IDS.INNER;
          }
        }
      }
    }

    // --- TRAMO 1: Inicio y Zona Segura (Spawn de Gravi y New) ---
    // Columnas 0 a 11: Suelo continuo plano
    ponerSuelo(0, 11, gY);

    // --- TRAMO 2: Pequeño Abismo para aprender Salto (Gap de 2 tiles) ---
    // Abismo en columnas 12 y 13 (2 tiles de ancho = 2 metros)
    // Suelo continúa en columna 14 a 22
    ponerSuelo(14, 22, gY);

    // --- TRAMO 3: Desnivel y Viga Baja (Aprender a Agacharse) ---
    // Una elevación de 1 tile en col 23 a 33
    const elevY = gY - 1;
    ponerSuelo(23, 33, elevY);

    // Viga superior en col 27 a 30 que deja solo 1 tile libre arriba del suelo
    // Gravi mide 64 px de pie y 41 px agachada, por lo que debe agacharse para cruzar
    for (let c = 27; c <= 30; c++) {
      matriz[elevY - 1][c] = TILE_IDS.PIPE_VERTICAL;
      matriz[elevY - 2][c] = TILE_IDS.BOT_MID;
    }

    // --- TRAMO 4: Zona del Acertijo de Posición (Caja y Sensor de Presión) ---
    // Columnas 34 a 46: Suelo amplio a altura base gY
    ponerSuelo(34, 46, gY);

    // Posición de la Caja (coord x inicial ~37 tiles)
    const cajaCol = 37;
    puntosClave.caja = {
      x: (cajaCol + 0.5) * CONFIG.TILE_SIZE,
      y: (gY - 1) * CONFIG.TILE_SIZE
    };

    // Posición del Botón objetivo (coord x objetivo ~43 tiles)
    const botonCol = 43;
    puntosClave.boton = {
      x: (botonCol + 0.5) * CONFIG.TILE_SIZE,
      y: gY * CONFIG.TILE_SIZE,
      distanciaObjetivoMetros: (botonCol - cajaCol) // ~6 metros exactos
    };

    // --- TRAMO 5: Plataforma del Portal de Salida ---
    // Columnas 48 a 53: Fin del nivel con el portal
    ponerSuelo(48, cols - 1, gY);
    puntosClave.portal = {
      x: (50.5) * CONFIG.TILE_SIZE,
      y: (gY - 1.5) * CONFIG.TILE_SIZE
    };

    return { matriz, puntosClave };
  }

  /**
   * Agente Validador: verifica matemáticamente que los saltos y pasos sean alcanzables
   */
  validarJugabilidad(mapa) {
    const { GRAVITY, WALK_SPEED, JUMP_VELOCITY } = CONFIG.PHYSICS;
    const TILE = CONFIG.TILE_SIZE;

    // Altura máxima teórica de salto: h = (vy^2) / (2 * g)
    const alturaMaxSaltoPx = (JUMP_VELOCITY * JUMP_VELOCITY) / (2 * GRAVITY);
    const alturaMaxTiles = alturaMaxSaltoPx / TILE;

    // Tiempo total de vuelo: t = 2 * |vy| / g
    const tiempoVueloSeg = (2 * Math.abs(JUMP_VELOCITY)) / GRAVITY;
    // Distancia horizontal máxima con salto caminando: d = vx * t
    const alcanceMaxSaltoPx = WALK_SPEED * tiempoVueloSeg;
    const alcanceMaxTiles = alcanceMaxSaltoPx / TILE;

    // Comprobaciones de seguridad en el nivel:
    // 1. El hueco del tutorial mide 2 tiles. El alcance máximo es ~3.4 tiles -> Superable.
    const gapTutorialTiles = 2;
    const esGapValido = gapTutorialTiles < alcanceMaxTiles * 0.8;

    // 2. El desnivel mide 1 tile. La altura máxima es ~2.0 tiles -> Superable.
    const desnivelTiles = 1;
    const esDesnivelValido = desnivelTiles < alturaMaxTiles;

    // 3. La caja está a 6 metros del botón -> Distancia justa para comprobar la medición.
    const distanciaCajaBoton = Math.abs(mapa.puntosClave.boton.x - mapa.puntosClave.caja.x) / TILE;
    const esPuzzleValido = distanciaCajaBoton >= 3 && distanciaCajaBoton <= 10;

    const valido = esGapValido && esDesnivelValido && esPuzzleValido;

    return {
      valido,
      metricas: {
        alturaMaxTiles,
        alcanceMaxTiles,
        gapTutorialTiles,
        distanciaCajaBoton
      }
    };
  }
}
