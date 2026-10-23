/**
 * Gravi en el Vacío — Subtítulos y metadatos de diálogos por voz
 * Vinculados a las pistas de audio en manifest.json
 */

export const DIALOGOS = {
  // Prólogo
  'voz-abuelo-escenaprologodialogo1': {
    personaje: 'I.N. (Abuelo)',
    texto: '“Mi nombre… no importa ahora. Alguna vez fui un explorador, un físico y un soñador. El mundo dejó de moverse a mi alrededor. Pero yo… seguí midiendo. Busqué respuestas y encontré algo más... el vacío.”',
    duracionMs: 14000
  },
  'voz-abuelo-escenaprologodialogo2': {
    personaje: 'I.N. (Abuelo)',
    texto: '“Le dejé mi legado a Gravi. Y ahora debe de recorrer el mismo camino que yo… Porque en este vacío… aún quedan preguntas por responder. Cada movimiento que dé… será una lección.”',
    duracionMs: 12000
  },

  // Tutorial (Piso 0)
  'voz-new-escenatutorial-leveldialogo1': {
    personaje: 'New',
    texto: '“Gravi, me alegro de que despiertes. Esta estructura se llama el Vacío. La Constante se ha fracturado y solo midiendo podremos ascender.”',
    duracionMs: 8000
  },
  'voz-new-escenatutorial-leveldialogo2': {
    personaje: 'New',
    texto: '“Domina tu movimiento: camina, corre, salta y agáchate. Empuja la caja hasta el sensor ubicado en la coordenada exacta para activar el portal.”',
    duracionMs: 9000
  },

  // Piso 1 (Tiempo)
  'voz-abuelo-escenatime-level': {
    personaje: 'I.N. (Abuelo)',
    texto: '“El tiempo no es solo un reloj que avanza. Es la dimensión donde ocurre cada transformación.”',
    duracionMs: 7000
  },
  'voz-new-escenatimeleveldialogo1': {
    personaje: 'New',
    texto: '“Las compuertas de los Tejedores abren por intervalos regulares. Mide el ciclo de apertura antes de cruzar.”',
    duracionMs: 7500
  },
  'voz-new-escenatimeleveldialogo2': {
    personaje: 'New',
    texto: '“El tiempo corre. Tienes una ventana limitada para recomponer el retrato de la Constante.”',
    duracionMs: 6500
  },

  // Piso 2 (Distancia)
  'voz-abuelo-escenadistance-level': {
    personaje: 'I.N. (Abuelo)',
    texto: '“Dos puntos en el espacio pueden unirse de infinitas formas. Pero solo una describe la distancia real recorrida.”',
    duracionMs: 8000
  },
  'voz-new-escenadistanceleveldialogo1': {
    personaje: 'New',
    texto: '“Tienes tres trayectorias posibles. Usa el Compás (tecla Q) para medir la longitud de cada sendero antes de avanzar.”',
    duracionMs: 8500
  },

  // Piso 3 (Velocidad)
  'voz-abuelo-escenaspeed-level': {
    personaje: 'I.N. (Abuelo)',
    texto: '“Velocidad es cambio: cuánta distancia vences por cada segundo que transcurre. v = d / t.”',
    duracionMs: 7500
  },
  'voz-new-escenaspeedleveldialogo1': {
    personaje: 'New',
    texto: '“La plataforma partirá y tardará un tiempo fijo en cruzar. Elige el ítem con la velocidad exacta para sincronizarte con ella.”',
    duracionMs: 8500
  },

  // PreFinal / Final / Aula
  'voz-abuelo-escenafinal-level': {
    personaje: 'I.N. (Abuelo)',
    texto: '“No subiste la torre para llegar a la cima… la subiste para comprender el movimiento de todo lo que existe.”',
    duracionMs: 8000
  },
  'voz-aulaeducativo-dialogo1': {
    personaje: 'New',
    texto: '“Repasemos lo aprendido en esta ascensión: el tiempo mide la duración, la distancia el espacio recorrido, y la velocidad relaciona a ambos.”',
    duracionMs: 9000
  }
};
