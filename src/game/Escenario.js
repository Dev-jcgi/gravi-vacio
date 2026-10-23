/**
 * Gravi en el Vacío — Construye en Phaser una escena exportada de Unity.
 *
 * Cada sprite del JSON es [textura, cuadro, x, y, rotación, escalaX, escalaY, origenX, origenY,
 * tinte, alfa, profundidad, orden] en px de Phaser (Y hacia abajo). Los objetos que el juego anima
 * (jugador, cajas, plataformas, portal, ítems…) llegan en "grupos" con coordenadas relativas.
 */

function crearImagen(scene, s) {
  const [k, f, x, y, rot, sx, sy, ox, oy, tint, alpha, depth] = s;
  const esc = scene.textures.get(k).customData?.meta?.escalas?.[f] ?? 1;
  const img = scene.add.image(x, y, k, f)
    .setOrigin(ox, oy)
    .setRotation(rot)
    .setScale(sx * esc, sy * esc)
    .setDepth(depth);
  if (tint !== 0xffffff) img.setTint(tint);
  if (alpha !== 1) img.setAlpha(alpha);
  return img;
}

export class Escenario {
  /**
   * @param {Phaser.Scene} scene
   * @param {string} nombre - clave de la escena exportada (tutorial, tiempo, …)
   * @param {object} opciones - { fisica: true } crea cuerpos estáticos para los sólidos
   */
  constructor(scene, nombre, { fisica = true } = {}) {
    this.scene = scene;
    this.data = scene.cache.json.get(`esc-${nombre}`);
    this.grupos = new Map();

    for (const s of this.data.sprites) crearImagen(scene, s);

    for (const [id, g] of Object.entries(this.data.grupos)) {
      const c = scene.add.container(g.x, g.y);
      const sprites = [...g.sprites].sort((a, b) => a[11] - b[11]);
      for (const s of sprites) {
        const img = crearImagen(scene, s);
        img.setVisible(s[13] !== false || !g.activo);
        c.add(img);
      }
      // el grupo se dibuja a la altura de su sprite más alto (los objetos van delante del escenario)
      c.setDepth(sprites.length ? sprites[sprites.length - 1][11] : 0);
      c.setVisible(g.activo);
      c.setData('info', { ...g, id });
      this.grupos.set(id, c);
    }

    this.solidos = null;
    if (fisica) {
      this.solidos = scene.physics.add.staticGroup();
      for (const s of this.data.solidos) {
        if (!s.activo || s.grupo) continue;
        const [x, y, w, h] = s.r;
        const z = scene.add.zone(x + w / 2, y + h / 2, w, h);
        this.solidos.add(z);
        z.setData('nombre', s.nombre);
        z.setData('ruta', s.ruta);
      }
    }
  }

  /** Convierte los colisionadores de un grupo que no se mueve en sólidos del escenario. */
  solidificar(grupo) {
    const id = grupo.getData('info').id;
    for (const s of this.solidosDe(id)) {
      const [x, y, w, h] = s.r;
      const z = this.scene.add.zone(x + w / 2, y + h / 2, w, h);
      this.solidos.add(z);
      z.setData('nombre', s.nombre);
      z.setData('ruta', s.ruta);
    }
  }

  /** Grupos cuyo nombre coincide (texto exacto o expresión regular). */
  gruposPor(nombre) {
    const ok = (n) => (nombre instanceof RegExp ? nombre.test(n) : n === nombre);
    return [...this.grupos.values()].filter((c) => ok(c.getData('info').nombre));
  }

  grupo(nombre) {
    return this.gruposPor(nombre)[0];
  }

  /** Objetos (con scripts, cámaras, textos…) cuyo nombre o ruta coincide. */
  objetos(patron) {
    return this.data.objetos.filter((o) => patron.test(o.ruta));
  }

  objeto(patron) {
    return this.objetos(patron)[0];
  }

  objetoPorId(id) {
    return this.data.objetos.find((o) => String(o.id) === String(id));
  }

  /** Zonas (triggers de Unity) cuyo nombre o ruta coincide. */
  zonas(patron) {
    return this.data.zonas.filter((z) => patron.test(z.ruta));
  }

  /** Sólidos que pertenecen a un grupo dinámico (cajas, plataformas…). */
  solidosDe(grupoId) {
    return this.data.solidos.filter((s) => String(s.grupo) === String(grupoId));
  }

  /** Rectángulo de una zona como Phaser.Geom.Rectangle. */
  static rect(z) {
    const [x, y, w, h] = z.r;
    return new Phaser.Geom.Rectangle(x, y, w, h);
  }

  /**
   * Anima un grupo recorriendo los cuadros de su textura (clips de sprites de Unity: Distance.anim,
   * cross.anim, NewEnd.anim…). filtro: expresión regular sobre el nombre del cuadro.
   */
  animarGrupo(grupo, fps = 8, filtro = null) {
    const img = grupo?.list?.[0];
    if (!img) return;
    const tex = img.texture;
    const esc = tex.customData?.meta?.escalas ?? {};
    const cuadros = tex.getFrameNames().filter((n) => !filtro || filtro.test(n))
      .sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
    if (cuadros.length < 2) return;
    const base = { sx: img.scaleX / (esc[img.frame.name] ?? 1), sy: img.scaleY / (esc[img.frame.name] ?? 1) };
    let i = Math.max(0, cuadros.indexOf(img.frame.name));
    this.scene.time.addEvent({
      delay: 1000 / fps,
      loop: true,
      callback: () => {
        i = (i + 1) % cuadros.length;
        const f = cuadros[i];
        img.setFrame(f);
        img.setScale(base.sx * (esc[f] ?? 1), base.sy * (esc[f] ?? 1));
      }
    });
  }

  /** Profundidad justo encima de todo lo que en Unity tiene sortingOrder <= orden. */
  profundidadSobre(orden) {
    let d = 0;
    for (const s of this.data.sprites) if (s[12] <= orden && s[11] > d) d = s[11];
    for (const c of this.grupos.values()) {
      for (const s of c.getData('info').sprites) if (s[12] <= orden && s[11] > d && c.visible) d = s[11];
    }
    return d + 0.5;
  }

  /** Profundidad de dibujo de un grupo (para insertar objetos del juego entre capas). */
  profundidad(nombre) {
    return this.grupo(nombre)?.depth ?? 0;
  }
}
