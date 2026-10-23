/**
 * Gravi en el Vacío — Configuración global del juego
 * 1 TILE = 64 px = 1 METRO (escala física unificada)
 */

export const CONFIG = {
  // Dimensiones lógicas (16:9)
  WIDTH: 1280,
  HEIGHT: 720,
  TILE_SIZE: 64, // 64 píxeles = 1 metro

  // Parámetros de física arcade
  PHYSICS: {
    GRAVITY: 1100,
    WALK_SPEED: 210,      // ~3.28 m/s
    RUN_SPEED: 350,       // ~5.46 m/s
    CROUCH_SPEED: 110,    // ~1.71 m/s
    JUMP_VELOCITY: -530,  // Permite saltar desniveles de hasta 2.2 metros
    VARIABLE_JUMP_CUT: 0.5,
    COYOTE_TIME_MS: 100,
    JUMP_BUFFER_MS: 120,
    PUSH_SPEED: 130,
    BOX_MASS: 2.0,
    BOX_DRAG: 500
  },

  // Gestión centralizada de música y sonido (facilita reemplazo futuro de licencias)
  AUDIO: {
    DEFAULT_MUSIC_VOLUME: 0.5,
    DEFAULT_SFX_VOLUME: 0.7,
    DEFAULT_VOICE_VOLUME: 0.9,
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
    LAST_COMPLETED_FLOOR: 'gravi_progreso_piso'
  },

  // Configuración de Firebase (rellenar con credenciales de proyecto cuando se configure)
  FIREBASE: {
    apiKey: 'AIzaSyCmlrKyYV5MgwbaujxU9BlGpvUKR3hP35g',
    authDomain: 'gravi-en-el-vacio.firebaseapp.com',
    projectId: 'gravi-en-el-vacio',
    storageBucket: 'gravi-en-el-vacio.firebasestorage.app',
    messagingSenderId: '320530106928',
    appId: '1:320530106928:web:5b290e33420058b6877bf5'
  }
};
