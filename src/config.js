/**
 * Gravi en el Vacío — Configuración global del juego
 * Escala heredada de Unity: 1 unidad de Unity = 100 px (PPU de los tilesets).
 */

export const CONFIG = {
  // Resolución lógica (16:9)
  WIDTH: 1280,
  HEIGHT: 720,
  PPU: 100,

  FUENTE: '"Press Start 2P", monospace',

  // Física tomada de PlayerMovement.cs y Physics2DSettings de Unity (convertida a px)
  PHYSICS: {
    GRAVITY: 981,          // 9.81 u/s²
    WALK_SPEED: 200,       // moveSpeed = 2
    RUN_SPEED: 320,        // Shift (solo web)
    CROUCH_SPEED: 100,
    // jumpForce de Unity × 100 px × factor: la cápsula de Unity "sube" bordes pequeños al rozarlos
    // (así Gravi supera la caja de 0.88 m con un salto de 0.82 m); en Arcade se compensa con el factor
    JUMP_FACTOR: 1.1,
    VARIABLE_JUMP_CUT: 0.55,
    COYOTE_TIME_MS: 100,
    JUMP_BUFFER_MS: 120,
    PUSH_SPEED: 120
  },

  // Gestión centralizada de música (facilita reemplazar las pistas con licencia)
  AUDIO: {
    DEFAULT_MUSIC_VOLUME: 0.45,
    DEFAULT_SFX_VOLUME: 0.7,
    DEFAULT_VOICE_VOLUME: 1,
    TRACKS: {
      PROLOGUE: 'musica-prologo',
      LEVELS: 'musica-niveles',
      FINAL: 'musica-final'
    }
  },

  // Almacenamiento local
  STORAGE: {
    PRIVACY_ACCEPTED: 'gravi_privacidad_aceptada',
    TELEMETRY_BACKUP: 'gravi_telemetria_eventos',
    AUDIO_SETTINGS: 'gravi_audio_volumen',
    LAST_COMPLETED_FLOOR: 'gravi_progreso_piso',
    SOLO_LOCAL: 'gravi_solo_local'
  },

  // Configuración de Firebase
  FIREBASE: {
    apiKey: 'AIzaSyCmlrKyYV5MgwbaujxU9BlGpvUKR3hP35g',
    authDomain: 'gravi-en-el-vacio.firebaseapp.com',
    projectId: 'gravi-en-el-vacio',
    storageBucket: 'gravi-en-el-vacio.firebasestorage.app',
    messagingSenderId: '320530106928',
    appId: '1:320530106928:web:5b290e33420058b6877bf5'
  }
};

// Orden del recorrido (igual que Build Settings de Unity)
export const RECORRIDO = ['Prologo', 'Menu', 'Tutorial', 'Transicion0', 'Tiempo', 'Transicion1', 'Distancia',
  'Transicion3', 'Velocidad', 'Transicion4', 'PreFinal', 'Final', 'Aula'];
