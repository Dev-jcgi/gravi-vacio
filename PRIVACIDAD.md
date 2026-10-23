# Política de Privacidad y Tratamiento Ético de Datos
## Proyecto de Investigación: Gravi en el Vacío (Serious Game)

**Institución:** Universidad del Sur (UNISUR)  
**Proyecto:** Tesis de Grado en Serious Games para Cinemática (MRU)  
**Versión:** 1.0 (Octubre 2026)

---

### 1. Finalidad y Naturaleza Académica
El software interactivo «Gravi en el Vacío» es un entorno virtual gamificado de aprendizaje desarrollado con fines estrictamente pedagógicos y de investigación científica. Su objetivo es evaluar la comprensión y retención de conceptos de física elemental (tiempo, distancia, velocidad y relaciones funcionales $v = d / t$).

### 2. Principio de Minimización y Anonimato Estricto
De conformidad con las directrices éticas de investigación y normativas internacionales de protección de datos:
1. **NO se solicita ni almacena Información de Identificación Personal (PII)**:
   - Ni nombres completos, seudónimos reales, ni documentos de identidad.
   - Ni correos electrónicos, números telefónicos ni contraseñas.
   - Ni ubicación geográfica precisa ni direcciones IP.
2. **Identificación Anónima de Sesión**:
   - Cada ejecución genera un identificador aleatorio efímero (ej. `sess_x8a2f_...`) que permite agrupar los intentos de un mismo jugador durante su sesión sin vincularlo a su identidad civil.

### 3. Datos Técnicos y Pedagógicos Recopilados
La telemetría del juego únicamente registra variables operacionales del aprendizaje:
* **Métricas de Rendimiento:** Tiempo total invertido por piso, reintentos al fallar cálculos de velocidad.
* **Toma de Decisiones:** Elección de trayectorias (distancia recorrida vs. desplazamiento) y selecciones numéricas en acertijos.
* **Interacción:** Eventos de uso de mecánicas (activación del sensor de coordenadas, uso de la regla del Compás).

### 4. Almacenamiento y Seguridad
* Los datos se almacenan en una base de datos segura en la nube (Firestore) protegida por reglas de control de acceso que impiden la lectura pública o modificación maliciosa.
* Adicionalmente, se conserva un respaldo local temporal en el navegador del usuario (`localStorage`).

### 5. Participación de Menores de Edad
Dado que el juego está destinado a su uso en aulas escolares y universitarias:
* La experiencia no contiene publicidad, compras integradas, enlaces a redes sociales ni mecanismos de monetización.
* Se requiere la aceptación del consentimiento previo por parte del estudiante o con supervisión docente antes de iniciar el registro de métricas.

---
Para consultas éticas o académicas sobre esta investigación, contactar al comité de investigación de la tesis en UNISUR.
