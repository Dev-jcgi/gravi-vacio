/**
 * Gravi en el Vacío — Secuencias narrativas tomadas del juego Unity.
 * Textos: componentes Text de cada escena. Tiempos (segundos): curvas de alfa de los
 * AnimationClip (Animator_Prologue, Transitions-Dialogues-N, Control*_Level) y Timelines finales.
 * Generado a partir de tools/unity_anim.py y tools/unity_timeline.py.
 */

const fade = (a, b, c) => [[a, 0], [b, 1], [c, 0]];

// Prólogo (Narratives.prefab + Dialogues1.anim): 46 s, luego MainMenu
export const PROLOGO = {
  duracion: 44.93,
  siguiente: 'Menu',
  musica: 'musica-prologo',
  voces: [{ clave: 'voz-abuelo-escenaprologodialogo1', t: 1.35 }, { clave: 'voz-abuelo-escenaprologodialogo2', t: 18.05 }],
  lineas: [
    { texto: 'Mi nombre… no importa ahora.\nAlguna vez fui un explorador, un físico y un soñador.', claves: fade(1.02, 5.0, 9.0), y: 290 },
    { texto: 'El mundo dejó de moverse a mi alrededor.\nPero yo… seguí midiendo.', claves: fade(5.0, 8.98, 12.98), y: 351 },
    { texto: 'Busqué respuestas y encontré algo más... el vacío.', claves: fade(9.0, 12.98, 18.03), y: 391 },
    { texto: 'Le dejé mi legado a Gravi.', claves: fade(13.0, 18.03, 22.03), y: 296 },
    { texto: 'Porque en este vacío… aún quedan preguntas por responder.', claves: fade(18.05, 22.03, 26.03), y: 337 },
    { texto: 'Y ahora debe de recorrer el mismo camino que yo…', claves: fade(22.05, 26.03, 30.03), y: 376 },
    { texto: 'Cada movimiento que dé... será una lección.', claves: fade(26.05, 30.03, 34.03), y: 421 },
    { texto: '—— I.N.', claves: fade(30.05, 34.03, 38.03), y: 470, tam: 18, color: '#9a9a9a' }
  ]
};

// Transiciones entre niveles (escenas N-Transition)
export const TRANSICIONES = {
  Transicion0: {
    duracion: 29.87,
    siguiente: 'Tiempo',
    voces: [{ clave: 'voz-gravi-escenatime-leveldialogo1', t: 1.02 }],
    lineas: [
      { texto: 'Desde que mi abuelo desapareció,', claves: fade(1.02, 2.85, 4.13), y: 307 },
      { texto: 'es como si mi mundo se hubiera detenido.', claves: fade(2.8, 4.15, 5.1), y: 351 },
      { texto: 'Él me hablaba de esta torre en el diario que dejó... apenas lo entiendo.', claves: fade(3.7, 6.07, 8.02), y: 391 },
      { texto: 'Hay fórmulas, notas tachadas, y una palabra que se repite una y otra vez:', claves: fade(8.02, 11.3, 13.87), y: 296 },
      { texto: 'el vacío…, vacío..., vacío...', claves: fade(11.3, 15.17, 17.1), y: 337 },
      { texto: '¿Qué quiso decir con eso? ¿Qué descubrió aquí?', claves: fade(15.1, 18.03, 20.63), y: 376 },
      { texto: '¿Por qué dejó todo?', claves: fade(18.03, 19.98, 22.97), y: 421 }
    ]
  },
  Transicion1: {
    duracion: 14,
    siguiente: 'Distancia',
    voces: [{ clave: 'voz-gravi-escenatime-leveldialogo2', t: 2.0 }],
    lineas: [
      { texto: 'El diario habla de fórmulas.', claves: fade(2.0, 3.0, 4.0), y: 307 },
      { texto: 'Tiempo, Distancia…', claves: fade(2.97, 3.98, 5.0), y: 351 },
      { texto: '¿Qué es lo que viene?', claves: fade(3.97, 4.95, 5.97), y: 391 }
    ]
  },
  Transicion3: {
    duracion: 12,
    siguiente: 'Velocidad',
    voces: [{ clave: 'voz-gravi-escenadistanceleveldialogo1', t: 1.0 }],
    lineas: [
      { texto: 'Encontré otra entrada en su diario...', claves: fade(1.0, 1.97, 3.5), y: 307 },
      { texto: 'hablaba de distancia.', claves: fade(2.03, 3.52, 4.43), y: 351 },
      { texto: 'De cómo todo en este mundo debe medirse.', claves: fade(2.93, 4.45, 6.05), y: 391 }
    ]
  },
  Transicion4: {
    duracion: 12,
    siguiente: 'PreFinal',
    voces: [{ clave: 'voz-gravi-escenaspeedeveldialogo1', t: 1.0 }],
    lineas: [
      { texto: 'Entiendo ahora.', claves: fade(1.0, 3.55, 5.02), y: 307 },
      { texto: 'El viaje fue un reflejo.', claves: fade(2.47, 4.38, 5.85), y: 351 },
      { texto: 'De él… y de mí.', claves: fade(4.43, 5.85, 7.12), y: 391 }
    ]
  }
};

// Introducciones de los niveles (Control*_Level.anim): pantalla negra con textos y voz de New
export const INTROS = {
  tutorial: {
    duracion: 12,
    voces: [{ clave: 'voz-new-escenatutorial-leveldialogo1', t: 2.0 }],
    lineas: [
      { texto: 'Antes de subir… debes recordar lo esencial.', claves: [[2, 0], [4, 1], [6, 0]], y: 276 },
      { texto: 'Cada movimiento es parte de un engranaje mayor.', claves: [[4, 0], [6, 1], [10, 0]], y: 339 },
      { texto: 'No basta con avanzar… debes saber cómo hacerlo.', claves: [[6, 0], [10, 1], [12, 0]], y: 396 }
    ]
  },
  tiempo: {
    duracion: 10.97,
    voces: [{ clave: 'voz-new-escenatimeleveldialogo1', t: 2.0 }],
    lineas: [
      { texto: 'Sin tiempo, Gravi,', claves: [[2, 0], [4, 1], [6, 0]], y: 324, color: '#ffff00' },
      { texto: 'no hay cambio.', claves: [[4, 0], [6, 1], [8, 0]], y: 347, color: '#ffff00' },
      { texto: 'Y sin cambio, no hay historia', claves: [[6, 0], [8, 1], [9.37, 0]], y: 372, color: '#ffff00' }
    ]
  },
  distancia: {
    duracion: 16,
    voces: [{ clave: 'voz-new-escenatimeleveldialogo4', t: 2.08 }, { clave: 'voz-new-escenadistanceleveldialogo1', t: 6.0 }],
    lineas: [
      { texto: 'Prepárate, Gravi.', claves: [[2, 0], [2.5, 1], [3, 0]], y: 280, color: '#ff00e0' },
      { texto: 'El tiempo', claves: [[3, 0], [3.5, 1], [4, 0]], y: 312, color: '#ff00e0' },
      { texto: 'solo fue el comienzo.', claves: [[3.5, 0], [4.33, 1], [5, 0]], y: 343, color: '#ff00e0' },
      { texto: 'Cada paso cuenta, Gravi…', claves: [[6, 0], [6.5, 1], [8, 0]], y: 379, color: '#ff00e0' },
      { texto: 'pero sólo si sabes entre qué puntos estás caminando.', claves: [[6.47, 0], [8, 1], [12, 0]], y: 406, color: '#ff00e0' },
      { texto: 'La distancia no se mira… se mide.', claves: [[10, 0], [12, 1], [14, 0]], y: 441, color: '#ff00e0' }
    ]
  },
  velocidad: {
    duracion: 19,
    voces: [{ clave: 'voz-new-escenadistanceleveldialogo5', t: 2.0 }, { clave: 'voz-new-escenaspeedleveldialogo1', t: 10.0 }],
    lineas: [
      { texto: 'La distancia te trajo aquí, Gravi…', claves: [[2, 0], [2.98, 1], [4.98, 0]], y: 280 },
      { texto: 'pero no debes olvidar el tiempo,', claves: [[2.98, 0], [4.98, 1], [6.98, 0]], y: 308 },
      { texto: 'porque te pueden llevar hasta tu abuelo.', claves: [[4.98, 0], [6.98, 1], [9, 0]], y: 338 },
      { texto: 'La velocidad es movimiento.', claves: [[10, 0], [10.67, 1], [12, 0]], y: 370 },
      { texto: 'Demasiado lenta, y quedas atrás.', claves: [[10.67, 0], [13, 1], [15, 0]], y: 398 },
      { texto: 'Demasiado rápida, y pierdes el control.', claves: [[12, 0], [15, 1], [17, 0]], y: 425 }
    ]
  }
};
