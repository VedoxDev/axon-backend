# Documentación de la API de Videollamadas 📹

## Descripción General
El sistema de Videollamadas soporta tanto **llamadas directas 1:1** como **llamadas grupales de proyecto** con **integración LiveKit** para comunicación de video/audio en tiempo real.

## Características ✨
- **Llamadas Directas 1:1** - Llamadas privadas de video/audio entre usuarios
- **Llamadas Grupales de Proyecto** - Llamadas multi-participante para equipos de proyecto
- **Integración LiveKit** - Infraestructura profesional de videollamadas
- **Notificaciones en Tiempo Real** - Invitaciones de llamada vía sistema de chat
- **Gestión de Llamadas** - Iniciar, unirse, salir, terminar llamadas
- **Estado de Participantes** - Seguimiento de silenciar/activar audio/video
- **Historial de Llamadas** - Seguimiento de todas las llamadas y participantes
- **Modo Solo Audio** - Opción para llamadas solo de voz
- **Limpieza Automática de Salas** - Salas eliminadas cuando están vacías

---

## 🎯 Inicio Rápido

### 1. Iniciar una Llamada Directa (1:1)
```http
POST /calls/start
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "type": "direct",
  "recipientId": "user-uuid-here",
  "title": "Llamada rápida de sincronización",
  "audioOnly": false
}
```

**Respuesta:**
```json
{
  "call": {
    "id": "call-uuid",
    "roomName": "call_direct_1642680000000_abc123",
    "type": "direct",
    "status": "waiting",
    "title": "Llamada rápida de sincronización",
    "audioOnly": false,
    "initiator": { "id": "user-uuid", "nombre": "Victor", "apellidos": "Fonseca" },
    "recipient": { "id": "recipient-uuid", "nombre": "John", "apellidos": "Doe" },
    "createdAt": "2024-01-10T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Token de acceso LiveKit
}
```

### 2. Unirse a la Llamada
```http
POST /calls/join/{callId}
Authorization: Bearer <jwt-token>
```

**Respuesta:**
```json
{
  "call": { /* detalles de la llamada */ },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Token de acceso LiveKit
}
```

---

## 🎥 Endpoints de Gestión de Llamadas

### Iniciar Llamada de Proyecto (1:muchos)
```http
POST /calls/start
Authorization: Bearer <jwt-token>

{
  "type": "project",
  "projectId": "project-uuid",
  "title": "Reunión de planificación de sprint",
  "maxParticipants": 10,
  "audioOnly": false
}
```

### Unirse a Llamada Existente
```http
POST /calls/join/{callId}
Authorization: Bearer <jwt-token>

{
  "audioOnly": false
}
```

### Salir de Llamada
```http
PUT /calls/leave/{callId}
Authorization: Bearer <jwt-token>
```

### Terminar Llamada (Solo Iniciador)
```http
DELETE /calls/end/{callId}
Authorization: Bearer <jwt-token>
```

### Obtener Llamadas Activas
```http
GET /calls/active
Authorization: Bearer <jwt-token>
```

### Obtener Historial de Llamadas
```http
GET /calls/history?page=1&limit=20
Authorization: Bearer <jwt-token>
```

---

## 🎛️ Gestión de Participantes

### Actualizar Estado del Participante
```http
PUT /calls/participant/{callId}
Authorization: Bearer <jwt-token>

{
  "micMuted": true,
  "videoMuted": false
}
```

### Generar Nuevo Token (si expiró)
```http
POST /calls/token/{callId}
Authorization: Bearer <jwt-token>
```

---

## 📱 Integración React Native

### 1. Instalar Cliente LiveKit
```bash
npm install @livekit/react-native @livekit/react-native-webrtc
```

### 2. Nombres de Participantes 👥
**NUEVO: ¡Nombres de usuario apropiados en videollamadas!**

El backend ahora incluye metadatos de usuario en tokens LiveKit, permitiendo nombres de visualización apropiados:

```javascript
// Función auxiliar para obtener nombre de visualización del participante
const obtenerNombreParticipante = (participant) => {
  // Verificar si el participante tiene metadatos con displayName
  if (participant.metadata) {
    try {
      const metadata = JSON.parse(participant.metadata);
      if (metadata.displayName) {
        return metadata.displayName; // Retorna "John Smith"
      }
    } catch (error) {
      console.log('Error al parsear metadatos del participante:', error);
    }
  }
  
  // Respaldo al nombre del participante si está disponible
  if (participant.name && participant.name !== participant.identity) {
    return participant.name; // Retorna "John Smith"
  }
  
  // Último recurso: Usar identity (UUID) con prefijo "Usuario"
  return `Usuario ${participant.identity.substring(0, 8)}`;
};

// Uso en tu componente
participants.map(participant => {
  const displayName = obtenerNombreParticipante(participant);
  return (
    <Text key={participant.identity}>
      {displayName} {/* Muestra "John Smith" en lugar de UUID */}
    </Text>
  );
});
```

### 3. Componente Básico de Llamada
```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { Room, connect, RoomEvent, RemoteParticipant } from '@livekit/react-native';

const PantallaVideollamada = ({ route, navigation }) => {
  const { callId } = route.params;
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);

  // Función auxiliar para obtener nombre de visualización (¡MEJORADA!)
  const obtenerNombreParticipante = (participant) => {
    if (participant.metadata) {
      try {
        const metadata = JSON.parse(participant.metadata);
        if (metadata.displayName) {
          return metadata.displayName; // "John Smith"
        }
      } catch (error) {
        console.log('Error al parsear metadatos del participante:', error);
      }
    }
    
    if (participant.name && participant.name !== participant.identity) {
      return participant.name;
    }
    
    return `Usuario ${participant.identity.substring(0, 8)}`;
  };

  useEffect(() => {
    unirseALlamada();
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, []);

  const unirseALlamada = async () => {
    try {
      // Unirse a llamada vía API
      const response = await fetch(`${API_BASE_URL}/calls/join/${callId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      const { call, token } = await response.json();
      
      // Conectar a sala LiveKit
      const newRoom = await connect(
        process.env.LIVEKIT_URL, // URL de tu servidor LiveKit
        token,
        {
          audio: true,
          video: true,
          adaptiveStream: true
        }
      );

      setRoom(newRoom);

      // Escuchar participantes (¡REGISTRO MEJORADO!)
      newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        const displayName = obtenerNombreParticipante(participant);
        console.log(`${displayName} se unió a la llamada`); // "John Smith se unió a la llamada"
        setParticipants(prev => [...prev, participant]);
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        const displayName = obtenerNombreParticipante(participant);
        console.log(`${displayName} salió de la llamada`); // "John Smith salió de la llamada"
        setParticipants(prev => prev.filter(p => p.identity !== participant.identity));
      });

    } catch (error) {
      console.error('Error al unirse a la llamada:', error);
      Alert.alert('Error', 'Error al unirse a la llamada');
      navigation.goBack();
    }
  };

  const salirDeLlamada = async () => {
    try {
      if (room) {
        room.disconnect();
      }

      // Notificar al backend
      await fetch(`${API_BASE_URL}/calls/leave/${callId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getToken()}`
        }
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error al salir de la llamada:', error);
    }
  };

  const alternarSilencio = async () => {
    if (room) {
      const enabled = room.localParticipant.isMicrophoneEnabled;
      room.localParticipant.setMicrophoneEnabled(!enabled);
      
      // Actualizar estado del backend
      await fetch(`${API_BASE_URL}/calls/participant/${callId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ micMuted: enabled })
      });
    }
  };

  const alternarCamara = async () => {
    if (room) {
      const enabled = room.localParticipant.isCameraEnabled;
      room.localParticipant.setCameraEnabled(!enabled);
      
      // Actualizar estado del backend
      await fetch(`${API_BASE_URL}/calls/participant/${callId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoMuted: enabled })
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Las vistas de video irían aquí */}
      <Text style={{ color: 'white', textAlign: 'center', marginTop: 50 }}>
        En llamada con {participants.length} participantes
      </Text>
      
      {/* Mostrar nombres de participantes (¡MEJORADO!) */}
      <View style={{ marginTop: 20 }}>
        {participants.map(participant => {
          const displayName = obtenerNombreParticipante(participant);
          return (
            <Text key={participant.identity} style={{ color: 'white', textAlign: 'center' }}>
              📹 {displayName} {/* Muestra "📹 John Smith" en lugar de UUID */}
            </Text>
          );
        })}
      </View>
      
      <View style={{ 
        position: 'absolute', 
        bottom: 50, 
        left: 0, 
        right: 0, 
        flexDirection: 'row', 
        justifyContent: 'space-around' 
      }}>
        <Button title="Silenciar" onPress={alternarSilencio} />
        <Button title="Cámara" onPress={alternarCamara} />
        <Button title="Salir" onPress={salirDeLlamada} color="red" />
      </View>
    </View>
  );
};

export default PantallaVideollamada;
```

### 4. Función para Iniciar Llamada
```javascript
const iniciarVideollamada = async (recipientId, type = 'direct') => {
  try {
    const response = await fetch(`${API_BASE_URL}/calls/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        recipientId: type === 'direct' ? recipientId : undefined,
        projectId: type === 'project' ? recipientId : undefined,
        title: type === 'direct' ? 'Videollamada' : 'Reunión de proyecto'
      })
    });

    const { call } = await response.json();
    
    // Navegar a pantalla de llamada
    navigation.navigate('VideoCall', { callId: call.id });
    
  } catch (error) {
    console.error('Error al iniciar llamada:', error);
    Alert.alert('Error', 'Error al iniciar llamada');
  }
};
```

---

## 👤 Estructura de Metadatos de Participantes

**NUEVO: ¡Datos de usuario ricos en tokens LiveKit!**

El backend ahora incluye información completa del usuario en metadatos de tokens LiveKit:

```json
{
  "displayName": "John Smith",
  "email": "john.smith@company.com", 
  "avatar": "",
  "userId": "357b292d-ddbf-4061-89ce-2243f6d9db57"
}
```

### Acceder a Metadatos en Frontend
```javascript
// Parsear metadatos del participante
const parsearMetadatosParticipante = (participant) => {
  if (!participant.metadata) return null;
  
  try {
    return JSON.parse(participant.metadata);
  } catch (error) {
    console.error('Error al parsear metadatos:', error);
    return null;
  }
};

// Ejemplo de uso
const metadata = parsearMetadatosParticipante(participant);
if (metadata) {
  console.log('Nombre de Visualización:', metadata.displayName); // "John Smith"
  console.log('Email:', metadata.email);                         // "john.smith@company.com"  
  console.log('ID de Usuario:', metadata.userId);                // "357b292d-..."
}
```

### Beneficios
- ✅ **Nombres Reales**: Mostrar "John Smith" en lugar de "Usuario 357b292d"
- ✅ **Acceso a Email**: Email opcional del usuario para información de contacto
- ✅ **Seguimiento UUID**: El backend aún puede rastrear usuarios por UUID
- ✅ **Extensible a Futuro**: Fácil agregar URLs de avatar, roles, etc.
- ✅ **Respaldo Seguro**: Funciona incluso si falla el parseo de metadatos

---

## 🔔 Integración con Chat

### Invitaciones de Llamada ✨
**NUEVO: ¡Los mensajes automáticos distinguen entre llamadas de audio y video!**

Cuando se inicia una llamada, se envían mensajes automáticos de chat:

**Llamadas Directas:**
```
📞 Victor Fonseca ha iniciado una llamada       (solo audio)
📞 Victor Fonseca ha iniciado una videollamada  (videollamada)
```

**Llamadas de Proyecto:**
```
📞 Victor Fonseca ha iniciado una llamada de audio  (solo audio)
📞 Victor Fonseca ha iniciado una videollamada      (videollamada)
```

El backend automáticamente verifica el parámetro `audioOnly` y genera mensajes apropiados en español.

### Escuchar Invitaciones de Llamada ✨
**NUEVO: ¡Invitaciones de llamada en tiempo real vía WebSocket!**

```javascript
// En tu manejador de WebSocket de chat
socket.on('newMessage', (message) => {
  // Verificar si este es un mensaje de invitación de llamada
  if (message.content.includes('📞') && message.callId) {
    console.log('📞 Invitación de llamada recibida:', message);
    mostrarDialogoInvitacionLlamada(message);
  } else {
    // Mensaje de chat regular
    mostrarMensaje(message);
  }
});

const mostrarDialogoInvitacionLlamada = (message) => {
  Alert.alert(
    'Invitación de Llamada',
    message.content, // "📞 Victor Fonseca ha iniciado una videollamada"
    [
      { text: 'Rechazar', style: 'cancel' },
      { 
        text: 'Unirse', 
        onPress: () => {
          // Usar el callId del mensaje
          navigation.navigate('VideoCall', { callId: message.callId });
        }
      }
    ]
  );
};

// Estructura del mensaje para invitaciones de llamada:
/*
{
  id: 'msg-uuid',
  content: '📞 Victor Fonseca ha iniciado una videollamada',
  senderId: 'initiator-uuid',
  senderName: 'Victor Fonseca',
  createdAt: '2024-01-10T10:00:00.000Z',
  type: 'direct', // o 'project'
  recipientId: 'recipient-uuid', // para llamadas directas
  projectId: 'project-uuid', // para llamadas de proyecto
  callId: 'call-uuid', // ✨ NUEVO: Para unirse a la llamada
  isRead: false,
  isEdited: false
}
*/
```

---

## 🔧 Configuración del Entorno

### Variables .env del Backend
```bash
# Configuración LiveKit
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_secret
```

### Configuración del Frontend
```javascript
// En tu app React Native
const LIVEKIT_URL = 'wss://your-project.livekit.cloud';
const API_BASE_URL = 'http://your-backend.com';
```

---

## 🎯 Ejemplos de Flujo de Llamadas

### Flujo de Llamada Directa 1:1
```javascript
// Usuario A inicia llamada
const { call, token } = await startCall('direct', userB.id);

// Sistema envía invitación de chat al Usuario B
// Usuario B ve notificación en chat

// Usuario B se une a llamada
const { call, token } = await joinCall(call.id);

// Ambos usuarios conectados a sala LiveKit
// Comienza comunicación de video/audio en tiempo real
```

### Flujo de Llamada Grupal de Proyecto
```javascript
// Líder del equipo inicia llamada de proyecto
const { call, token } = await startCall('project', project.id);

// Sistema transmite invitación a todos los miembros del proyecto
// Múltiples miembros del equipo se unen

// Todos los participantes en la misma sala LiveKit
// Videoconferencia multi-participante
```

---

## 📊 Estados de Llamada

### Estado de Llamada
- `waiting` - Llamada creada, esperando participantes
- `active` - Llamada en progreso con participantes
- `ended` - Llamada terminada normalmente
- `cancelled` - Llamada cancelada antes de que alguien se uniera

### Estado del Participante
- `isConnected` - Actualmente en la llamada
- `micMuted` - Micrófono silenciado
- `videoMuted` - Cámara apagada
- `joinedAt` - Cuándo se unieron
- `leftAt` - Cuándo se fueron

---

## 🔒 Seguridad y Permisos

### Llamadas Directas
- Solo el iniciador y el destinatario pueden unirse
- Cualquier participante puede salir en cualquier momento
- Solo el iniciador puede terminar la llamada

### Llamadas de Proyecto
- Solo los miembros del proyecto pueden unirse
- Cualquier miembro puede salir en cualquier momento
- Solo el iniciador puede terminar la llamada

### Tokens LiveKit
- Tokens JWT de corta duración (por defecto: 1 hora)
- Limitados a salas específicas
- Expiran automáticamente por seguridad

---

## 🚀 Características Avanzadas

### Grabar Llamadas
```http
POST /calls/start
{
  "type": "direct",
  "recipientId": "user-uuid",
  "recordCall": true
}
```

### Llamadas Solo Audio ✨
**NUEVO: ¡Diferentes mensajes de invitación para audio vs video!**

```http
POST /calls/start
{
  "type": "direct", 
  "recipientId": "user-uuid",
  "audioOnly": true
}
```

**Mensaje de Chat Enviado:** `📞 Victor Fonseca ha iniciado una llamada`

```http
POST /calls/start
{
  "type": "project",
  "projectId": "project-uuid", 
  "audioOnly": true
}
```

**Mensaje de Chat Enviado:** `📞 Victor Fonseca ha iniciado una llamada de audio`

### Videollamadas (Por Defecto)
```http
POST /calls/start
{
  "type": "direct", 
  "recipientId": "user-uuid",
  "audioOnly": false
}
```

**Mensaje de Chat Enviado:** `📞 Victor Fonseca ha iniciado una videollamada`

```http
POST /calls/start
{
  "type": "project",
  "projectId": "project-uuid", 
  "audioOnly": false
}
```

**Mensaje de Chat Enviado:** `📞 Victor Fonseca ha iniciado una videollamada`

### Participantes Limitados
```http
POST /calls/start
{
  "type": "project",
  "projectId": "project-uuid",
  "maxParticipants": 5
}
```

---

## 🔄 WebHooks (Automático)

LiveKit automáticamente envía webhooks a `/calls/webhook/livekit` para:
- Eventos de participante unido/salido
- Creación/destrucción de sala
- Sincronización automática de estado

---

## ✅ Pruebas

### Probar Llamada Directa
1. Crear dos cuentas de usuario
2. Iniciar llamada del Usuario A al Usuario B
3. Verificar mensaje de invitación en chat
4. Unirse a llamada como Usuario B
5. Verificar ambos usuarios en sala LiveKit
6. **NUEVO**: Verificar que se muestren nombres apropiados en UI (no UUIDs)

### Probar Llamada de Proyecto  
1. Crear proyecto con múltiples miembros
2. Iniciar llamada de proyecto
3. Verificar que todos los miembros reciban notificación de chat
4. Múltiples usuarios se unen a llamada
5. Verificar videoconferencia grupal
6. **NUEVO**: Verificar que todos los nombres de participantes se muestren correctamente

### Probar Nombres de Participantes
```javascript
// Depurar metadatos de participantes
participants.forEach(participant => {
  console.log('=== DEBUG DE PARTICIPANTE ===');
  console.log('Identity:', participant.identity);        // UUID
  console.log('Name:', participant.name);               // Nombre de visualización
  console.log('Metadata:', participant.metadata);       // String JSON
  
  if (participant.metadata) {
    const metadata = JSON.parse(participant.metadata);
    console.log('Metadatos parseados:', metadata);
    console.log('Nombre de visualización:', metadata.displayName); // "John Smith"
    console.log('Email:', metadata.email);                         // Email del usuario
    console.log('ID de Usuario:', metadata.userId);                // UUID para seguimiento
  }
});
```

### Solución de Problemas "undefined undefined"

Si ves "undefined undefined" en nombres de participantes:

1. **Verificar Logs del Backend** - Buscar errores de estrategia JWT
```bash
# Verificar logs del servidor para:
[CallsService] Datos de usuario iniciador: id=xxx, nombre="undefined", apellidos="undefined"
```

2. **Problema de Token JWT** - Los datos del usuario podrían no estar cargando apropiadamente
```javascript
// Frontend: Verificar payload de tu token JWT
const token = await AsyncStorage.getItem('access_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Payload JWT:', payload); // Debería tener id y email
```

3. **Re-login** - Si JWT está corrupto, hacer que el usuario inicie sesión de nuevo
```javascript
// Limpiar token y re-autenticar
await AsyncStorage.removeItem('access_token');
// Navegar a pantalla de login
```

4. **Arreglado en Última Versión** ✅
   - Estrategia JWT ahora carga datos completos del usuario desde base de datos
   - Incluye respaldos apropiados para campos faltantes
   - Registro de depuración agregado para solución de problemas

### Solución de Problemas de Desconexiones de Llamada

Si los participantes son expulsados cuando alguien se va:

1. **Verificar Logs del Backend** - Buscar seguimiento de participantes
```bash
# Verificar logs del servidor para:
[CallsService] Participantes activos restantes después de que user123 se fue: 2
[CallsService]   - Participante user456 (conectado: true, leftAt: null)
[CallsService] La llamada continúa con 2 participantes activos
```

2. **Salir Apropiado vs Desconectar**
   - Usar `PUT /calls/leave/{callId}` para salir apropiadamente de llamadas
   - No solo cerrar la app/navegar fuera
   - Backend rastrea estado del participante automáticamente

3. **Arreglado en Última Versión** ✅
   - Participantes ahora marcados apropiadamente como conectados al unirse
   - Salir de llamada solo termina sala cuando el último participante se va
   - Registro mejorado para depurar estado de participantes

### Solución de Problemas de Invitaciones de Llamada No Aparecen

Si los mensajes de invitación de llamada no aparecen en tiempo real:

1. **Verificar Conexión WebSocket**
```javascript
// Asegurar que WebSocket esté conectado
socket.on('connect', () => {
  console.log('✅ Conectado a WebSocket de chat');
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado de WebSocket de chat');
});
```

2. **Asegurar Unión a Sala de Proyecto** (para llamadas de proyecto)
```javascript
// Debe unirse a sala de proyecto para recibir invitaciones de llamada de proyecto
socket.emit('joinProject', { projectId: 'your-project-id' });

socket.on('joinedProject', (data) => {
  console.log('✅ Unido a sala de proyecto:', data.projectId);
});
```

3. **Verificar Listener de Evento de Mensaje**
```javascript
// Escuchar todos los mensajes nuevos (incluyendo invitaciones de llamada)
socket.on('newMessage', (message) => {
  console.log('📨 Nuevo mensaje recibido:', message);
  
  if (message.callId) {
    console.log('📞 ¡Esta es una invitación de llamada!');
  }
});
```

4. **Arreglado en Última Versión** ✅
   - Invitaciones de llamada ahora se transmiten vía WebSocket en tiempo real
   - No necesidad de refrescar chat para ver invitaciones de llamada
   - Mismo formato de mensaje que mensajes de chat regulares
   - Incluye campo `callId` para fácil unión a llamada

---

**🎉 ¡Tu sistema de videollamadas está COMPLETO y LISTO PARA PRODUCCIÓN!**

Con integración LiveKit, obtienes:
- ✅ **Calidad de video de nivel empresarial**
- ✅ **Escalado automático** 
- ✅ **Servidores edge globales**
- ✅ **Comunicación en tiempo real**
- ✅ **Soporte multiplataforma**

**¡Perfecto para colaboración en equipo!** 🚀💪 