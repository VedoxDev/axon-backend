# Documentación de la API de Reuniones 📅

Sistema completo de programación de reuniones con reuniones de proyecto y personales utilizando su infraestructura de video LiveKit existente.

## **Descripción General de Endpoints**

### **🎯 Endpoints de Reuniones**
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `POST` | `/calls/meetings/project` | Programar una reunión de proyecto | ✅ JWT |
| `POST` | `/calls/meetings/personal` | Programar una reunión personal | ✅ JWT |
| `GET` | `/calls/meetings/my` | Obtener próximas reuniones del usuario | ✅ JWT |
| `GET` | `/calls/meetings/project/:projectId` | Obtener reuniones del proyecto | ✅ JWT |
| `GET` | `/calls/meetings/project/:projectId/history` | Obtener historial completo de reuniones del proyecto | ✅ JWT |
| `GET` | `/calls/meetings/:meetingId` | Obtener detalles de reunión | ✅ JWT |
| `DELETE` | `/calls/meetings/:meetingId` | Cancelar reunión | ✅ JWT |
| `POST` | `/calls/join/:meetingId` | Unirse a reunión programada | ✅ JWT |

---

## **🏢 POST `/calls/meetings/project`**

Programa una reunión para miembros del proyecto. Todos los miembros del proyecto pueden unirse.

### **Solicitud**
```http
POST /calls/meetings/project
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Daily Standup",
  "scheduledAt": "2024-12-21T10:00:00.000Z",
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Revisar el progreso de ayer y planificar las tareas de hoy",
  "duration": 30,
  "audioOnly": false,
  "recordCall": false
}
```

### **Campos Requeridos**
```typescript
{
  title: string;        // Título de la reunión
  scheduledAt: string;  // Cadena de fecha ISO (debe ser futura)
  projectId: string;    // UUID del proyecto
}
```

### **Campos Opcionales**
```typescript
{
  description?: string;  // Agenda/descripción de la reunión
  duration?: number;     // Duración en minutos (15-480, por defecto: 60)
  audioOnly?: boolean;   // Reunión solo de audio (por defecto: false)
  recordCall?: boolean;  // Grabar la reunión (por defecto: false)
}
```

### **Respuesta**
```json
{
  "id": "meeting-uuid",
  "roomName": "meeting_proj123_1703155200000_abc123",
  "type": "project",
  "status": "waiting",
  "title": "Daily Standup",
  "scheduledAt": "2024-12-21T10:00:00.000Z",
  "isScheduledMeeting": true,
  "description": "Revisar el progreso de ayer y planificar las tareas de hoy",
  "duration": 30,
  "audioOnly": false,
  "recordCall": false,
  "meetingType": "project_meeting",
  "initiator": {
    "id": "user-uuid",
    "nombre": "Victor",
    "apellidos": "Fonseca",
    "email": "victor@example.com"
  },
  "project": {
    "id": "project-uuid",
    "name": "Desarrollo de Axon Backend"
  },
  "createdAt": "2024-12-20T15:30:00.000Z"
}
```

### **Reglas de Validación**
- ✅ El usuario debe ser miembro del proyecto
- ✅ La hora programada debe ser en el futuro
- ✅ Duración: 15-480 minutos (15 min a 8 horas)
- ✅ El proyecto debe existir

---

## **👤 POST `/calls/meetings/personal`**

Programa una reunión personal invitando usuarios específicos por email.

### **Solicitud**
```http
POST /calls/meetings/personal
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Reunión de Revisión con Cliente",
  "scheduledAt": "2024-12-21T14:00:00.000Z",
  "participantEmails": ["cliente@empresa.com", "colega@ejemplo.com"],
  "description": "Presentar resultados del Q4 y discutir objetivos del próximo trimestre",
  "duration": 90,
  "audioOnly": false,
  "recordCall": true
}
```

### **Campos Requeridos**
```typescript
{
  title: string;              // Título de la reunión
  scheduledAt: string;        // Cadena de fecha ISO (debe ser futura)
  participantEmails: string[]; // Array de direcciones de email para invitar
}
```

### **Campos Opcionales**
```typescript
{
  description?: string;  // Agenda/descripción de la reunión
  duration?: number;     // Duración en minutos (15-480, por defecto: 60)
  audioOnly?: boolean;   // Reunión solo de audio (por defecto: false)
  recordCall?: boolean;  // Grabar la reunión (por defecto: false)
}
```

### **Respuesta**
```json
{
  "id": "meeting-uuid",
  "roomName": "personal_meeting_1703160000000_xyz789",
  "type": "direct",
  "status": "waiting",
  "title": "Reunión de Revisión con Cliente",
  "scheduledAt": "2024-12-21T14:00:00.000Z",
  "isScheduledMeeting": true,
  "description": "Presentar resultados del Q4 y discutir objetivos del próximo trimestre",
  "duration": 90,
  "audioOnly": false,
  "recordCall": true,
  "meetingType": "personal_meeting",
  "initiator": {
    "id": "user-uuid",
    "nombre": "Victor",
    "apellidos": "Fonseca",
    "email": "victor@example.com"
  },
  "participants": [
    {
      "user": {
        "id": "participant1-uuid",
        "nombre": "John",
        "apellidos": "Doe",
        "email": "cliente@empresa.com"
      },
      "isConnected": false
    }
  ],
  "createdAt": "2024-12-20T15:30:00.000Z"
}
```

### **Reglas de Validación**
- ✅ La hora programada debe ser en el futuro
- ✅ Se requiere al menos un email de participante válido
- ✅ Los emails de participantes deben existir en el sistema
- ✅ Duración: 15-480 minutos

---

## **📋 GET `/calls/meetings/my`**

Obtiene todas las próximas reuniones para el usuario autenticado (tanto de proyecto como personales).

### **Solicitud**
```http
GET /calls/meetings/my
Authorization: Bearer <jwt_token>
```

### **Respuesta**
```json
[
  {
    "id": "meeting1-uuid",
    "title": "Daily Standup",
    "scheduledAt": "2024-12-21T10:00:00.000Z",
    "duration": 30,
    "meetingType": "project_meeting",
    "description": "Revisar progreso",
    "project": {
      "id": "project-uuid",
      "name": "Axon Backend"
    },
    "initiator": {
      "id": "user-uuid",
      "nombre": "Victor",
      "apellidos": "Fonseca"
    }
  },
  {
    "id": "meeting2-uuid",
    "title": "Revisión con Cliente",
    "scheduledAt": "2024-12-21T14:00:00.000Z",
    "duration": 90,
    "meetingType": "personal_meeting",
    "description": "Presentar resultados",
    "participants": [
      {
        "user": {
          "id": "client-uuid",
          "nombre": "John",
          "apellidos": "Cliente"
        }
      }
    ]
  }
]
```

---

## **🏢 GET `/calls/meetings/project/:projectId`**

Obtiene todas las próximas reuniones para un proyecto específico.

### **Solicitud**
```http
GET /calls/meetings/project/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
```

### **Parámetros de Ruta**
- `projectId` (UUID) - El ID del proyecto

### **Respuesta**
Misma estructura que `/calls/meetings/my` pero filtrada para el proyecto específico.

### **Reglas de Validación**
- ✅ El usuario debe ser miembro del proyecto
- ✅ El proyecto debe existir

---

## **📚 GET `/calls/meetings/project/:projectId/history`**

Obtiene el historial completo de reuniones para un proyecto (incluidas las pasadas).

### **Solicitud**
```http
GET /calls/meetings/project/550e8400-e29b-41d4-a716-446655440000/history
Authorization: Bearer <jwt_token>
```

### **Respuesta**
```json
[
  {
    "id": "past-meeting-uuid",
    "title": "Sprint Planning",
    "scheduledAt": "2024-12-15T09:00:00.000Z",
    "duration": 60,
    "status": "completed",
    "description": "Planificar sprint de 2 semanas",
    "actualDuration": 75,
    "participantCount": 5,
    "wasRecorded": true,
    "recordingUrl": "https://grabaciones.ejemplo.com/abc123"
  }
]
```

---

## **🔍 GET `/calls/meetings/:meetingId`**

Obtiene detalles completos de una reunión específica.

### **Solicitud**
```http
GET /calls/meetings/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
```

### **Respuesta**
Estructura completa de reunión con todos los detalles, participantes e historial.

---

## **🗑️ DELETE `/calls/meetings/:meetingId`**

Cancela una reunión programada. Solo el iniciador puede cancelar.

### **Solicitud**
```http
DELETE /calls/meetings/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
```

### **Respuesta**
```json
{
  "message": "meeting-cancelled-successfully"
}
```

### **Reglas de Validación**
- ✅ Solo el iniciador puede cancelar la reunión
- ✅ Solo se pueden cancelar reuniones futuras
- ✅ Los participantes reciben notificación de cancelación

---

## **🚪 POST `/calls/join/:meetingId`**

Únete a una reunión programada y obtén token de LiveKit.

### **Solicitud**
```http
POST /calls/join/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "audioOnly": false
}
```

### **Respuesta**
```json
{
  "call": {
    "id": "meeting-uuid",
    "roomName": "meeting_proj123_1703155200000_abc123",
    "title": "Daily Standup"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "metadata": {
    "displayName": "Victor Fonseca",
    "userId": "user-uuid",
    "meetingId": "meeting-uuid"
  }
}
```

---

## **❌ Respuestas de Error**

### **Errores de Validación (400)**

**Hora de Reunión en el Pasado:**
```json
{
  "statusCode": 400,
  "message": "meeting-time-must-be-in-future"
}
```

**Duración Inválida:**
```json
{
  "statusCode": 400,
  "message": "invalid-duration-range"
}
```

**Participantes No Encontrados:**
```json
{
  "statusCode": 400,
  "message": "some-participants-not-found",
  "notFound": ["email@inexistente.com"]
}
```

### **Errores de Autorización (403)**

**No es Miembro del Proyecto:**
```json
{
  "statusCode": 403,
  "message": "not-project-member"
}
```

**No es el Iniciador (para cancelación):**
```json
{
  "statusCode": 403,
  "message": "only-initiator-can-cancel"
}
```

### **Errores de No Encontrado (404)**

**Proyecto No Encontrado:**
```json
{
  "statusCode": 404,
  "message": "project-not-found"
}
```

**Reunión No Encontrada:**
```json
{
  "statusCode": 404,
  "message": "meeting-not-found"
}
```

---

## **💻 Ejemplos de Implementación Frontend**

### **Programar Reunión de Proyecto**
```javascript
const programarReunionProyecto = async (datosReunion) => {
  try {
    const response = await fetch('/calls/meetings/project', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await obtenerToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: datosReunion.titulo,
        scheduledAt: datosReunion.fechaProgramada,
        projectId: datosReunion.projectId,
        description: datosReunion.descripcion,
        duration: datosReunion.duracion || 60,
        audioOnly: datosReunion.soloAudio || false,
        recordCall: datosReunion.grabar || false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const reunion = await response.json();
    console.log('Reunión programada:', reunion);
    
    // Mostrar notificación de éxito
    mostrarNotificacion({
      tipo: 'exito',
      mensaje: `Reunión "${reunion.title}" programada para ${new Date(reunion.scheduledAt).toLocaleString()}`
    });

    return reunion;
  } catch (error) {
    console.error('Error programando reunión:', error);
    mostrarNotificacion({
      tipo: 'error',
      mensaje: 'Error al programar reunión: ' + error.message
    });
    throw error;
  }
};
```

### **Lista de Próximas Reuniones**
```jsx
import React, { useState, useEffect } from 'react';

const ListaProximasReuniones = () => {
  const [reuniones, setReuniones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarReuniones();
  }, []);

  const cargarReuniones = async () => {
    try {
      const response = await fetch('/calls/meetings/my', {
        headers: {
          'Authorization': `Bearer ${await obtenerToken()}`
        }
      });
      
      const data = await response.json();
      setReuniones(data);
    } catch (error) {
      console.error('Error cargando reuniones:', error);
    } finally {
      setCargando(false);
    }
  };

  const unirseReunion = async (meetingId) => {
    try {
      const response = await fetch(`/calls/join/${meetingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await obtenerToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ audioOnly: false })
      });

      const { call, token } = await response.json();
      
      // Abrir sala de video con LiveKit
      abrirSalaVideo(call.roomName, token);
      
    } catch (error) {
      console.error('Error uniéndose a reunión:', error);
      alert('Error al unirse a la reunión');
    }
  };

  const cancelarReunion = async (meetingId) => {
    if (!confirm('¿Estás seguro de que quieres cancelar esta reunión?')) {
      return;
    }

    try {
      await fetch(`/calls/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await obtenerToken()}`
        }
      });

      // Recargar lista
      cargarReuniones();
      
      mostrarNotificacion({
        tipo: 'exito',
        mensaje: 'Reunión cancelada exitosamente'
      });
    } catch (error) {
      console.error('Error cancelando reunión:', error);
      alert('Error al cancelar reunión');
    }
  };

  if (cargando) {
    return <div>Cargando reuniones...</div>;
  }

  return (
    <div className="lista-reuniones">
      <h2>Próximas Reuniones</h2>
      
      {reuniones.length === 0 ? (
        <p>No tienes reuniones programadas</p>
      ) : (
        reuniones.map(reunion => (
          <div key={reunion.id} className="tarjeta-reunion">
            <div className="cabecera-reunion">
              <h3>{reunion.title}</h3>
              <span className={`tipo-${reunion.meetingType}`}>
                {reunion.meetingType === 'project_meeting' ? 'Proyecto' : 'Personal'}
              </span>
            </div>
            
            <div className="detalles-reunion">
              <p className="fecha">
                📅 {new Date(reunion.scheduledAt).toLocaleString()}
              </p>
              <p className="duracion">
                ⏱️ {reunion.duration} minutos
              </p>
              {reunion.description && (
                <p className="descripcion">{reunion.description}</p>
              )}
            </div>

            {reunion.project && (
              <div className="info-proyecto">
                <span>Proyecto: {reunion.project.name}</span>
              </div>
            )}

            <div className="acciones-reunion">
              <button 
                onClick={() => unirseReunion(reunion.id)}
                className="btn-unirse"
                disabled={new Date(reunion.scheduledAt) > new Date(Date.now() + 5 * 60 * 1000)} // 5 min antes
              >
                Unirse
              </button>
              
              {reunion.initiator.id === usuarioActual.id && (
                <button 
                  onClick={() => cancelarReunion(reunion.id)}
                  className="btn-cancelar"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
```

### **Formulario de Nueva Reunión**
```jsx
const FormularioNuevaReunion = ({ projectId, onReunionCreada }) => {
  const [formulario, setFormulario] = useState({
    titulo: '',
    fechaProgramada: '',
    descripcion: '',
    duracion: 60,
    soloAudio: false,
    grabar: false,
    tipo: projectId ? 'proyecto' : 'personal',
    emailsParticipantes: []
  });

  const [emailParticipante, setEmailParticipante] = useState('');

  const manejarEnvio = async (e) => {
    e.preventDefault();
    
    try {
      let datosReunion;
      
      if (formulario.tipo === 'proyecto') {
        datosReunion = {
          title: formulario.titulo,
          scheduledAt: new Date(formulario.fechaProgramada).toISOString(),
          projectId: projectId,
          description: formulario.descripcion,
          duration: formulario.duracion,
          audioOnly: formulario.soloAudio,
          recordCall: formulario.grabar
        };
        
        const response = await fetch('/calls/meetings/project', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await obtenerToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(datosReunion)
        });
        
        const reunion = await response.json();
        onReunionCreada(reunion);
        
      } else {
        datosReunion = {
          title: formulario.titulo,
          scheduledAt: new Date(formulario.fechaProgramada).toISOString(),
          participantEmails: formulario.emailsParticipantes,
          description: formulario.descripcion,
          duration: formulario.duracion,
          audioOnly: formulario.soloAudio,
          recordCall: formulario.grabar
        };
        
        const response = await fetch('/calls/meetings/personal', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await obtenerToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(datosReunion)
        });
        
        const reunion = await response.json();
        onReunionCreada(reunion);
      }
      
      // Limpiar formulario
      setFormulario({
        titulo: '',
        fechaProgramada: '',
        descripcion: '',
        duracion: 60,
        soloAudio: false,
        grabar: false,
        tipo: projectId ? 'proyecto' : 'personal',
        emailsParticipantes: []
      });
      
    } catch (error) {
      console.error('Error creando reunión:', error);
      alert('Error al crear reunión');
    }
  };

  const agregarParticipante = () => {
    if (emailParticipante && !formulario.emailsParticipantes.includes(emailParticipante)) {
      setFormulario(prev => ({
        ...prev,
        emailsParticipantes: [...prev.emailsParticipantes, emailParticipante]
      }));
      setEmailParticipante('');
    }
  };

  const removerParticipante = (email) => {
    setFormulario(prev => ({
      ...prev,
      emailsParticipantes: prev.emailsParticipantes.filter(e => e !== email)
    }));
  };

  return (
    <form onSubmit={manejarEnvio} className="formulario-reunion">
      <h3>Nueva Reunión</h3>
      
      <div className="campo">
        <label>Título:</label>
        <input
          type="text"
          value={formulario.titulo}
          onChange={(e) => setFormulario(prev => ({ ...prev, titulo: e.target.value }))}
          required
        />
      </div>
      
      <div className="campo">
        <label>Fecha y Hora:</label>
        <input
          type="datetime-local"
          value={formulario.fechaProgramada}
          onChange={(e) => setFormulario(prev => ({ ...prev, fechaProgramada: e.target.value }))}
          min={new Date().toISOString().slice(0, 16)}
          required
        />
      </div>
      
      <div className="campo">
        <label>Descripción:</label>
        <textarea
          value={formulario.descripcion}
          onChange={(e) => setFormulario(prev => ({ ...prev, descripcion: e.target.value }))}
          rows={3}
        />
      </div>
      
      <div className="campo">
        <label>Duración (minutos):</label>
        <input
          type="number"
          value={formulario.duracion}
          onChange={(e) => setFormulario(prev => ({ ...prev, duracion: parseInt(e.target.value) }))}
          min={15}
          max={480}
        />
      </div>
      
      {formulario.tipo === 'personal' && (
        <div className="campo">
          <label>Participantes:</label>
          <div className="agregar-participante">
            <input
              type="email"
              value={emailParticipante}
              onChange={(e) => setEmailParticipante(e.target.value)}
              placeholder="email@ejemplo.com"
            />
            <button type="button" onClick={agregarParticipante}>
              Agregar
            </button>
          </div>
          
          <div className="lista-participantes">
            {formulario.emailsParticipantes.map(email => (
              <div key={email} className="participante">
                <span>{email}</span>
                <button type="button" onClick={() => removerParticipante(email)}>
                  ❌
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="opciones">
        <label>
          <input
            type="checkbox"
            checked={formulario.soloAudio}
            onChange={(e) => setFormulario(prev => ({ ...prev, soloAudio: e.target.checked }))}
          />
          Solo audio
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={formulario.grabar}
            onChange={(e) => setFormulario(prev => ({ ...prev, grabar: e.target.checked }))}
          />
          Grabar reunión
        </label>
      </div>
      
      <button type="submit" className="btn-crear">
        Crear Reunión
      </button>
    </form>
  );
};
```

---

## **🔔 Sistema de Notificaciones**

### **Notificaciones de Reunión**
```javascript
// Enviar recordatorios automáticos
const enviarRecordatorios = async () => {
  // 24 horas antes
  await enviarNotificacion({
    tipo: 'recordatorio_reunion',
    tiempo: '24h',
    titulo: 'Reunión mañana',
    mensaje: `Tienes una reunión programada mañana: "${reunion.title}"`
  });
  
  // 1 hora antes
  await enviarNotificacion({
    tipo: 'recordatorio_reunion',
    tiempo: '1h',
    titulo: 'Reunión en 1 hora',
    mensaje: `Tu reunión "${reunion.title}" comienza en 1 hora`
  });
  
  // 15 minutos antes
  await enviarNotificacion({
    tipo: 'recordatorio_reunion',
    tiempo: '15m',
    titulo: 'Reunión próximamente',
    mensaje: `Tu reunión "${reunion.title}" comienza en 15 minutos`,
    accion: {
      texto: 'Unirse ahora',
      url: `/reuniones/${reunion.id}/unirse`
    }
  });
};
```

---

## **📊 Análisis y Métricas**

### **Estadísticas de Reuniones**
```javascript
const obtenerEstadisticasReuniones = async (projectId) => {
  const response = await fetch(`/calls/meetings/project/${projectId}/stats`, {
    headers: { 'Authorization': `Bearer ${await obtenerToken()}` }
  });
  
  return response.json();
  /*
  {
    totalMeetings: 45,
    completedMeetings: 42,
    cancelledMeetings: 3,
    averageDuration: 38,
    averageParticipants: 4.2,
    totalMinutes: 1596,
    mostActiveDay: 'martes',
    peakHour: 14
  }
  */
};
```

---

**🎯 Sistema completo de reuniones programadas con integración LiveKit!** 🚀📅
