/**
 * Gravi en el Vacío — Servicio de inicialización perezosa de Firebase
 * Solo se activa si CONFIG.FIREBASE contiene credenciales válidas.
 */

import { CONFIG } from '../config.js';

let app = null;
let auth = null;
let db = null;
let isInitialized = false;
let userCredential = null;

export async function initFirebase() {
  if (isInitialized) return { app, auth, db, userCredential };

  const cfg = CONFIG.FIREBASE;
  const hasConfig = cfg && cfg.projectId && cfg.projectId.trim() !== '';

  if (!hasConfig) {
    // Modo local / offline sin Firebase
    console.info('[Firebase] Modo local activo: sin credenciales configuradas. La telemetría se respaldará en localStorage.');
    isInitialized = true;
    return { app: null, auth: null, db: null, userCredential: null };
  }

  try {
    const { initializeApp } = await import('firebase/app');
    const { getAuth, signInAnonymously } = await import('firebase/auth');
    const { getFirestore } = await import('firebase/firestore');

    app = initializeApp(cfg);
    auth = getAuth(app);
    db = getFirestore(app);

    userCredential = await signInAnonymously(auth);
    console.info('[Firebase] Sesión anónima iniciada con éxito. UID:', userCredential.user.uid);
  } catch (err) {
    console.warn('[Firebase] No se pudo conectar con Firebase. Operando en modo local:', err.message);
  }

  isInitialized = true;
  return { app, auth, db, userCredential };
}

export function isFirebaseAvailable() {
  return db !== null;
}

export function getDb() {
  return db;
}

export function getAuthUser() {
  return userCredential ? userCredential.user : null;
}
