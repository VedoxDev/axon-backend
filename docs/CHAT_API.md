# Documentación de la API de Chat 💬

## Descripción General
El sistema de Chat soporta tanto **mensajes directos 1:1** como **conversaciones grupales de proyecto** con mensajería WebSocket en tiempo real y persistencia en base de datos.

## Características ✨
- **Mensajería en tiempo real** con WebSocket
- **Mensajes directos** (chat 1:1) entre usuarios
- **Conversaciones de proyecto** (chat grupal) para miembros del proyecto
- **Indicadores de escritura** y presencia en línea
- **Edición de mensajes** y eliminación
- **Confirmaciones de lectura** y búsqueda de mensajes
- **Historial de mensajes** con paginación
- **API REST de respaldo** para confiabilidad

---

## 🔌 Conexión WebSocket

### Conectar al Chat
```javascript
import { io } from 'socket.io-client';

// Obtener token de AsyncStorage (React Native) o localStorage (web)
const token = await AsyncStorage.getItem('access_token'); // React Native
// const token = localStorage.getItem('access_token'); // Web

const socket = io('http://localhost:3000/chat', {
  auth: {
    token: token // Token JWT sin prefijo 'Bearer '
  }
});

// Eventos de conexión
socket.on('connect', () => {
  console.log('¡Conectado al chat!');
});

socket.on('disconnect', () => {
  console.log('Desconectado del chat');
});

// Manejo de errores
socket.on('connect_error', (error) => {
  console.error('Falló la conexión:', error.message);
  // El token podría ser inválido o haber expirado
});
```

### Unirse a Sala de Proyecto
```javascript
// Unirse al proyecto para mensajes en tiempo real
socket.emit('joinProject', { projectId: 'project-uuid' });

socket.on('joinedProject', (data) => {
  console.log('Unido al proyecto:', data.projectId);
});
```

### Enviar Mensajes
```javascript
// Enviar mensaje directo
socket.emit('sendMessage', {
  content: '¡Hola! ¿Cómo estás?',
  recipientId: 'user-uuid'
});

// Enviar mensaje de proyecto
socket.emit('sendMessage', {
  content: '¡Reunión a las 3pm hoy!',
  projectId: 'project-uuid'
});

// Escuchar nuevos mensajes
socket.on('newMessage', (message) => {
  console.log('Nuevo mensaje:', message);
  /*
  {
    id: 'msg-uuid',
    content: '¡Hola! ¿Cómo estás?',
    senderId: 'sender-uuid',
    senderName: 'John Doe',
    createdAt: '2024-01-10T10:00:00.000Z',
    type: 'direct', // o 'project'
    recipientId: 'user-uuid', // para mensajes directos
    projectId: 'project-uuid' // para mensajes de proyecto
  }
  */
});

// Confirmación cuando tu mensaje es enviado
socket.on('messageSent', (message) => {
  console.log('Mensaje enviado exitosamente:', message);
});
```

### Indicadores de Escritura
```javascript
// Mostrar indicador de escritura
socket.emit('typing', {
  recipientId: 'user-uuid', // para mensaje directo
  // O projectId: 'project-uuid', // para mensaje de proyecto
  typing: true
});

// Detener indicador de escritura
socket.emit('typing', {
  recipientId: 'user-uuid',
  typing: false
});

// Escuchar eventos de escritura
socket.on('typing', (data) => {
  console.log('Usuario escribiendo:', data);
  /*
  {
    userId: 'user-uuid',
    typing: true,
    timestamp: '2024-01-10T10:00:00.000Z',
    type: 'direct' // o 'project'
  }
  */
});
```

### Presencia En Línea
```javascript
// Obtener usuarios en línea
socket.emit('getOnlineUsers');

socket.on('onlineUsers', (data) => {
  console.log('Usuarios en línea:', data.users);
});

// Escuchar cambios de estado de usuario
socket.on('userOnline', (data) => {
  console.log('Usuario se conectó:', data.userId);
});

socket.on('userOffline', (data) => {
  console.log('Usuario se desconectó:', data.userId);
});
```

---

## 🌐 Endpoints de API REST

### Obtener Todas las Conversaciones
```http
GET /chat/conversations
Authorization: Bearer <jwt-token>
```

**Respuesta:**
```json
[
  {
    "type": "direct",
    "partner": {
      "id": "user-uuid",
      "nombre": "John",
      "apellidos": "Doe",
      "status": "online"
    },
    "lastMessage": {
      "id": "msg-uuid",
      "content": "¡Nos vemos mañana!",
      "senderId": "user-uuid",
      "createdAt": "2024-01-10T15:30:00.000Z",
      "isRead": true
    }
  },
  {
    "type": "project",
    "project": {
      "id": "project-uuid",
      "name": "Axon Backend",
      "description": "Proyecto principal del backend"
    },
    "lastMessage": {
      "id": "msg-uuid",
      "content": "¡Excelente trabajo todos!",
      "senderId": "user-uuid",
      "senderName": "Victor Fonseca",
      "createdAt": "2024-01-10T14:20:00.000Z",
      "isRead": false
    }
  }
]
```

### Obtener Historial de Mensajes Directos
```http
GET /chat/direct/{userId}?page=1&limit=50
Authorization: Bearer <jwt-token>
```

### Marcar Conversación Directa como Leída
```http
PUT /chat/direct/{userId}/read
Authorization: Bearer <jwt-token>
```

**Respuesta:**
```json
{
  "message": "messages-marked-as-read",
  "markedCount": 5
}
```

**Importante:** Solo marca como leídos los mensajes **enviados HACIA ti** de ese usuario, NO tus mensajes salientes.

### Obtener Historial de Mensajes de Proyecto
```http
GET /chat/project/{projectId}?page=1&limit=50
Authorization: Bearer <jwt-token>
```

**Respuesta (ambos endpoints):**
```json
[
  {
    "id": "msg-uuid-1",
    "content": "¡Hola a todos!",
    "sender": {
      "id": "user-uuid",
      "nombre": "Victor",
      "apellidos": "Fonseca"
    },
    "recipient": null, // para mensajes de proyecto
    "project": {
      "id": "project-uuid",
      "name": "Axon Backend"
    },
    "isRead": false,
    "isEdited": false,
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  }
]
```

### Crear Mensaje (Respaldo REST)
```http
POST /chat/messages
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "content": "Hola desde la API REST",
  "recipientId": "user-uuid" // Para mensaje directo
}
```

O para mensaje de proyecto:
```json
{
  "content": "Mensaje de proyecto desde REST",
  "projectId": "project-uuid"
}
```

### Editar Mensaje
```http
PUT /chat/messages/{messageId}
Authorization: Bearer <jwt-token>

{
  "content": "Contenido del mensaje editado"
}
```

### Eliminar Mensaje
```http
DELETE /chat/messages/{messageId}
Authorization: Bearer <jwt-token>
```

---

## 📱 Implementación React Native

### Configuración Básica del Chat
```javascript
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { io } from 'socket.io-client';

const ChatScreen = ({ route }) => {
  const { conversationType, targetId } = route.params; // 'direct' o 'project'
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    initializeSocket();
    loadMessageHistory();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const initializeSocket = async () => {
    const token = await AsyncStorage.getItem('access_token');
    
    const newSocket = io('http://localhost:3000/chat', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Conectado al chat');
      
      // Unirse al proyecto si es conversación de proyecto
      if (conversationType === 'project') {
        newSocket.emit('joinProject', { projectId: targetId });
      }
    });

    newSocket.on('newMessage', (message) => {
      setMessages(prev => [message, ...prev]);
    });

    newSocket.on('typing', (data) => {
      setIsTyping(data.typing);
    });

    newSocket.on('onlineUsers', (data) => {
      setOnlineUsers(data.users);
    });

    setSocket(newSocket);
  };

  const loadMessageHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const endpoint = conversationType === 'direct' 
        ? `/chat/direct/${targetId}`
        : `/chat/project/${targetId}`;
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const historyMessages = await response.json();
      setMessages(historyMessages.reverse()); // Más recientes primero
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  };

  const sendMessage = () => {
    if (!inputText.trim() || !socket) return;

    const messageData = {
      content: inputText.trim(),
      [conversationType === 'direct' ? 'recipientId' : 'projectId']: targetId
    };

    socket.emit('sendMessage', messageData);
    setInputText('');
  };

  const handleTyping = (typing) => {
    if (!socket) return;
    
    socket.emit('typing', {
      [conversationType === 'direct' ? 'recipientId' : 'projectId']: targetId,
      typing
    });
  };

  const renderMessage = ({ item }) => (
    <View style={styles.messageContainer}>
      <Text style={styles.senderName}>{item.senderName}</Text>
      <Text style={styles.messageContent}>{item.content}</Text>
      <Text style={styles.timestamp}>
        {new Date(item.createdAt).toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted
        style={styles.messagesList}
      />
      
      {isTyping && (
        <Text style={styles.typingIndicator}>Alguien está escribiendo...</Text>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={(text) => {
            setInputText(text);
            handleTyping(text.length > 0);
          }}
          onBlur={() => handleTyping(false)}
          placeholder="Escribe un mensaje..."
          multiline
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

### Hook Personalizado para Chat
```javascript
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useChat = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    initializeSocket();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const initializeSocket = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      const newSocket = io('http://localhost:3000/chat', {
        auth: { token }
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        loadConversations();
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('newMessage', (message) => {
        updateConversationWithNewMessage(message);
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Error inicializando socket:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
    }
  };

  const updateConversationWithNewMessage = (message) => {
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (
          (conv.type === 'direct' && conv.partner.id === message.senderId) ||
          (conv.type === 'project' && conv.project.id === message.projectId)
        ) {
          return {
            ...conv,
            lastMessage: {
              id: message.id,
              content: message.content,
              senderId: message.senderId,
              createdAt: message.createdAt,
              isRead: false
            }
          };
        }
        return conv;
      });
      
      // Ordenar por mensaje más reciente
      return updated.sort((a, b) => 
        new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
      );
    });
  };

  const sendMessage = (messageData) => {
    if (socket && isConnected) {
      socket.emit('sendMessage', messageData);
    }
  };

  const joinProject = (projectId) => {
    if (socket && isConnected) {
      socket.emit('joinProject', { projectId });
    }
  };

  const markAsRead = async (conversationType, targetId) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (conversationType === 'direct') {
        await fetch(`http://localhost:3000/chat/direct/${targetId}/read`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      // Actualizar estado local
      setConversations(prev => prev.map(conv => {
        if (
          (conv.type === 'direct' && conv.partner.id === targetId) ||
          (conv.type === 'project' && conv.project.id === targetId)
        ) {
          return {
            ...conv,
            lastMessage: {
              ...conv.lastMessage,
              isRead: true
            }
          };
        }
        return conv;
      }));
      
    } catch (error) {
      console.error('Error marcando como leído:', error);
    }
  };

  return {
    socket,
    isConnected,
    conversations,
    sendMessage,
    joinProject,
    markAsRead,
    loadConversations
  };
};
```

---

## 🔒 Seguridad y Validación

### Autenticación
- ✅ **Token JWT requerido** para todas las operaciones
- ✅ **Validación de token** en conexión WebSocket
- ✅ **Reconexión automática** con token válido

### Autorización
- ✅ **Mensajes directos**: Solo entre usuarios autenticados
- ✅ **Mensajes de proyecto**: Solo miembros del proyecto
- ✅ **Edición/eliminación**: Solo el autor del mensaje

### Validación de Datos
- ✅ **Contenido del mensaje**: 1-1000 caracteres
- ✅ **IDs válidos**: UUID válidos para usuarios/proyectos
- ✅ **Sanitización**: Prevención de XSS en contenido

---

## 🚨 Manejo de Errores

### Errores de WebSocket
```javascript
socket.on('error', (error) => {
  console.error('Error de socket:', error);
  
  switch (error.type) {
    case 'AUTHENTICATION_ERROR':
      // Redirigir a login
      navigation.navigate('Login');
      break;
    case 'PERMISSION_DENIED':
      Alert.alert('Error', 'No tienes permisos para esta acción');
      break;
    case 'MESSAGE_TOO_LONG':
      Alert.alert('Error', 'El mensaje es demasiado largo');
      break;
    default:
      Alert.alert('Error', 'Algo salió mal. Intenta de nuevo.');
  }
});
```

### Errores de API REST
```javascript
const handleApiError = (error, response) => {
  if (response.status === 401) {
    // Token expirado
    AsyncStorage.removeItem('access_token');
    navigation.navigate('Login');
  } else if (response.status === 403) {
    Alert.alert('Error', 'No tienes permisos para acceder a esta conversación');
  } else if (response.status === 404) {
    Alert.alert('Error', 'Conversación no encontrada');
  } else {
    Alert.alert('Error', 'Error de conexión. Intenta de nuevo.');
  }
};
```

---

## 📊 Mejores Prácticas

### Optimización de Rendimiento
- ✅ **Paginación** para historial de mensajes
- ✅ **Lazy loading** de conversaciones
- ✅ **Debounce** para indicadores de escritura
- ✅ **Caché local** para mensajes recientes

### Experiencia de Usuario
- ✅ **Indicadores de estado** (conectado/desconectado)
- ✅ **Confirmaciones de entrega** de mensajes
- ✅ **Notificaciones push** para mensajes perdidos
- ✅ **Modo offline** con cola de mensajes

### Escalabilidad
- ✅ **Salas de WebSocket** por proyecto
- ✅ **Límites de rate** para prevenir spam
- ✅ **Compresión** de mensajes grandes
- ✅ **Archivado automático** de mensajes antiguos

---

*¡El sistema de chat proporciona comunicación en tiempo real confiable y escalable para tu aplicación!* 💬✨