/**
 * Gravi en el Vacío — Servicio de Telemetría anónima
 * Diseñado para investigación académica de Serious Games (Tesis UNISUR).
 * No recopila PII (nombre, IP, correo, ubicación geográfica).
 */

import { CONFIG } from '../config.js';
import { getDb, isFirebaseAvailable } from './firebase.js';

class TelemetriaService {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.colaEventos = [];
    this.isFlushing = false;

    // Cargar cola previa de localStorage si existiera
    this.cargarEventosLocales();
  }

  getOrCreateSessionId() {
    try {
      let id = sessionStorage.getItem('gravi_session_id');
      if (!id) {
        id = 'sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
        sessionStorage.setItem('gravi_session_id', id);
      }
      return id;
    } catch {
      return 'sess_' + Math.random().toString(36).substring(2, 9);
    }
  }

  cargarEventosLocales() {
    try {
      const data = localStorage.getItem(CONFIG.STORAGE.TELEMETRY_BACKUP);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.colaEventos = parsed.slice(-100); // mantener máximo los últimos 100
        }
      }
    } catch (e) {
      console.warn('[Telemetria] Error leyendo eventos locales', e);
    }
  }

  guardarEventosLocales() {
    try {
      localStorage.setItem(CONFIG.STORAGE.TELEMETRY_BACKUP, JSON.stringify(this.colaEventos.slice(-100)));
    } catch (e) {
      console.warn('[Telemetria] No se pudo guardar en localStorage', e);
    }
  }

  /**
   * Registra un evento educativo o de jugabilidad
   * @param {string} tipo - Ej: 'INICIO_NIVEL', 'CAJA_EN_SENSOR', 'SALTO', 'COMPLETADO_NIVEL'
   * @param {string} escena - Nombre de la escena actual
   * @param {object} datos - Parámetros cuantificables (tiempoTranscurrido, intentos, coordenadas, etc.)
   */
  registrarEvento(tipo, escena, datos = {}) {
    const evento = {
      id: 'evt_' + Math.random().toString(36).substring(2, 9),
      sessionId: this.sessionId,
      timestamp: Date.now(),
      fechaIso: new Date().toISOString(),
      tipo,
      escena,
      datos
    };

    this.colaEventos.push(evento);
    this.guardarEventosLocales();
    this.flush();
  }

  async flush() {
    if (this.isFlushing || this.colaEventos.length === 0) return;
    if (!isFirebaseAvailable()) return;

    this.isFlushing = true;
    const db = getDb();

    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const batchToSend = [...this.colaEventos];

      for (const ev of batchToSend) {
        await addDoc(collection(db, 'eventos'), ev);
        const idx = this.colaEventos.indexOf(ev);
        if (idx !== -1) {
          this.colaEventos.splice(idx, 1);
        }
      }
      this.guardarEventosLocales();
    } catch (err) {
      console.warn('[Telemetria] Error enviando a Firestore:', err.message);
    } finally {
      this.isFlushing = false;
    }
  }
}

export const telemetria = new TelemetriaService();
