# Documentación de la API de Perfil de Usuario 👤

Sistema completo de perfil de usuario con estadísticas integrales y seguimiento de actividad.

## **Descripción General de Endpoints**

### **🔍 Endpoints de Perfil**
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/auth/me/profile` | Obtener perfil integral del usuario actual | ✅ JWT |
| `GET` | `/users/:userId/profile` | Obtener perfil integral de cualquier usuario | ✅ JWT |

---

## **📊 GET `/auth/me/profile`**

Obtiene el perfil integral del usuario autenticado.

### **Solicitud**
```http
GET /auth/me/profile
Authorization: Bearer <jwt_token>
```

### **Estructura de Respuesta**
```typescript
{
  // Información Básica del Usuario
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  fullName: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  memberSince: Date;
  lastActive: Date;
  
  // Estadísticas Integrales
  stats: {
    // Participación en Proyectos
    totalProjects: number;
    ownerProjects: number;
    adminProjects: number;
    memberProjects: number;
    
    // Rendimiento en Tareas
    tasksCreated: number;
    tasksAssigned: number;
    tasksCompleted: number;
    tasksPending: number;
    tasksInProgress: number;
    completionRate: number; // porcentaje (0-100)
    
    // Actividad de Comunicación
    messagesSent: number;
    directConversations: number;
    
    // Participación en Llamadas
    callsParticipated: number;
    callsInitiated: number;
    
    // Networking
    invitationsSent: number;
    invitationsReceived: number;
    invitationsAccepted: number;
    invitationsPending: number;
    invitationAcceptanceRate: number; // porcentaje (0-100)
  };
  
  // Línea de Tiempo de Actividad Reciente (últimas 15 actividades)
  recentActivity: Array<{
    type: 'task' | 'message' | 'call';
    action: string; // 'created', 'assigned', 'sent', 'initiated', 'joined'
    title: string;
    project?: string;
    recipient?: string; // para mensajes
    timestamp: Date;
    status?: string; // para tareas
  }>;
  
  // Proyectos Más Activos (top 5)
  projects: Array<{
    id: string;
    name: string;
    role: 'owner' | 'admin' | 'member';
    taskCount: number;
    messageCount: number;
  }>;
  
  // Insights Generados por IA
  insights: {
    mostActiveProject: string | null;
    averageTasksPerProject: number;
    peakActivityType: 'communication' | 'task_management';
    collaborationScore: number; // 0-100
    leadershipScore: number; // puntuación calculada
  };
}
```

### **Ejemplo de Respuesta**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "victor@example.com",
  "nombre": "Victor",
  "apellidos": "Fonseca",
  "fullName": "Victor Fonseca",
  "status": "online",
  "memberSince": "2024-01-15T10:30:00Z",
  "lastActive": "2024-12-20T14:25:00Z",
  
  "stats": {
    "totalProjects": 5,
    "ownerProjects": 2,
    "adminProjects": 1,
    "memberProjects": 2,
    
    "tasksCreated": 23,
    "tasksAssigned": 45,
    "tasksCompleted": 38,
    "tasksPending": 5,
    "tasksInProgress": 2,
    "completionRate": 84,
    
    "messagesSent": 127,
    "directConversations": 8,
    
    "callsParticipated": 12,
    "callsInitiated": 5,
    
    "invitationsSent": 7,
    "invitationsReceived": 3,
    "invitationsAccepted": 3,
    "invitationsPending": 0,
    "invitationAcceptanceRate": 100
  },
  
  "recentActivity": [
    {
      "type": "task",
      "action": "created",
      "title": "Implementar autenticación de usuario",
      "project": "Axon Backend",
      "timestamp": "2024-12-20T13:45:00Z",
      "status": "in_progress"
    },
    {
      "type": "message",
      "action": "sent",
      "title": "Oye, ¿puedes revisar el endpoint de perfil?",
      "project": "Axon Backend",
      "recipient": "Ana García",
      "timestamp": "2024-12-20T12:30:00Z"
    },
    {
      "type": "call",
      "action": "initiated",
      "title": "Daily standup",
      "project": "Axon Backend",
      "timestamp": "2024-12-20T09:00:00Z"
    }
  ],
  
  "projects": [
    {
      "id": "proj-123",
      "name": "Axon Backend",
      "role": "owner",
      "taskCount": 15,
      "messageCount": 45
    },
    {
      "id": "proj-456",
      "name": "Aplicación Móvil",
      "role": "admin",
      "taskCount": 8,
      "messageCount": 25
    }
  ],
  
  "insights": {
    "mostActiveProject": "Axon Backend",
    "averageTasksPerProject": 5,
    "peakActivityType": "communication",
    "collaborationScore": 85,
    "leadershipScore": 72
  }
}
```

---

## **👥 GET `/users/:userId/profile`**

Obtiene el perfil integral de cualquier usuario (misma estructura que `/auth/me/profile`).

### **Solicitud**
```http
GET /users/550e8400-e29b-41d4-a716-446655440000/profile
Authorization: Bearer <jwt_token>
```

### **Parámetros de Ruta**
- `userId` (UUID) - El ID del usuario cuyo perfil se va a obtener

### **Respuesta**
Misma estructura que `/auth/me/profile` pero para el usuario especificado.

---

## **📈 Explicación de Insights de Datos**

### **Tasa de Completado**
```
completionRate = (tasksCompleted / tasksAssigned) * 100
```

### **Puntuación de Colaboración**
```
collaborationScore = min(100, directConversations * 5 + callsParticipated * 10)
```

### **Puntuación de Liderazgo**
```
leadershipScore = ownerProjects * 20 + adminProjects * 10 + invitationsSent * 2
```

### **Tipo de Actividad Principal**
- `communication` - si messagesSent > tasksCreated
- `task_management` - si tasksCreated >= messagesSent

---

## **🔄 Datos en Tiempo Real**

Todas las estadísticas se calculan en tiempo real desde la base de datos:
- **Datos de proyecto** desde relaciones `ProjectMember`
- **Estadísticas de tareas** desde entidades `Task` con asociaciones de usuario
- **Conteos de mensajes** desde entidades `Message`
- **Participación en llamadas** desde entidades `CallParticipant`
- **Datos de invitación** desde entidades `ProjectInvitation`

---

## **⚡ Rendimiento**

- Usa **consultas paralelas** con `Promise.all()` para rendimiento óptimo
- **Índices recomendados** en campos consultados frecuentemente:
  - `tasks.createdBy`
  - `tasks.assignees`
  - `messages.senderId`
  - `calls.participantId`
  - `projectInvitations.inviterId`

---

## **🔒 Privacidad y Seguridad**

- ✅ **Datos propios**: `/auth/me/profile` solo devuelve datos del usuario autenticado
- ✅ **Datos públicos**: `/users/:id/profile` devuelve el mismo conjunto de datos (no hay campos privados)
- ✅ **JWT requerido**: Todos los endpoints requieren autenticación
- ✅ **Sin datos sensibles**: No se incluyen contraseñas ni tokens

---

## **💻 Ejemplos de Implementación Frontend**

### **Componente de Perfil React**
```jsx
import React, { useEffect, useState } from 'react';

const PerfilUsuario = ({ userId }) => {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const endpoint = userId 
          ? `/users/${userId}/profile` 
          : '/auth/me/profile';
        
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        });
        
        const data = await response.json();
        setPerfil(data);
      } catch (error) {
        console.error('Error cargando perfil:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarPerfil();
  }, [userId]);

  if (cargando) return <div>Cargando perfil...</div>;
  if (!perfil) return <div>Error cargando perfil</div>;

  return (
    <div className="perfil-usuario">
      <div className="cabecera-perfil">
        <h1>{perfil.fullName}</h1>
        <span className={`estado-${perfil.status}`}>
          {perfil.status}
        </span>
      </div>

      <div className="estadisticas-perfil">
        <div className="estadistica">
          <h3>Proyectos</h3>
          <p>{perfil.stats.totalProjects}</p>
        </div>
        
        <div className="estadistica">
          <h3>Tareas Completadas</h3>
          <p>{perfil.stats.tasksCompleted}</p>
        </div>
        
        <div className="estadistica">
          <h3>Tasa de Completado</h3>
          <p>{perfil.stats.completionRate}%</p>
        </div>
        
        <div className="estadistica">
          <h3>Puntuación de Colaboración</h3>
          <p>{perfil.insights.collaborationScore}/100</p>
        </div>
      </div>

      <div className="actividad-reciente">
        <h2>Actividad Reciente</h2>
        {perfil.recentActivity.map((actividad, index) => (
          <div key={index} className="item-actividad">
            <span className={`tipo-${actividad.type}`}>
              {actividad.type}
            </span>
            <span>{actividad.title}</span>
            <span className="timestamp">
              {new Date(actividad.timestamp).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div className="proyectos-activos">
        <h2>Proyectos Más Activos</h2>
        {perfil.projects.map(proyecto => (
          <div key={proyecto.id} className="proyecto">
            <h3>{proyecto.name}</h3>
            <span className={`rol-${proyecto.role}`}>
              {proyecto.role}
            </span>
            <div className="estadisticas-proyecto">
              <span>{proyecto.taskCount} tareas</span>
              <span>{proyecto.messageCount} mensajes</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### **Dashboard de Estadísticas**
```jsx
const DashboardEstadisticas = ({ stats, insights }) => {
  const calcularNivelActividad = (score) => {
    if (score >= 80) return { nivel: 'Alto', color: '#10B981' };
    if (score >= 60) return { nivel: 'Medio', color: '#F59E0B' };
    return { nivel: 'Bajo', color: '#EF4444' };
  };

  const nivelColaboracion = calcularNivelActividad(insights.collaborationScore);
  const nivelLiderazgo = calcularNivelActividad(insights.leadershipScore);

  return (
    <div className="dashboard-estadisticas">
      <div className="tarjeta-insights">
        <h3>Insights de Actividad</h3>
        
        <div className="insight">
          <span>Proyecto Más Activo:</span>
          <strong>{insights.mostActiveProject || 'Ninguno'}</strong>
        </div>
        
        <div className="insight">
          <span>Tipo de Actividad Principal:</span>
          <strong>
            {insights.peakActivityType === 'communication' 
              ? 'Comunicación' 
              : 'Gestión de Tareas'}
          </strong>
        </div>
        
        <div className="insight">
          <span>Promedio Tareas/Proyecto:</span>
          <strong>{insights.averageTasksPerProject}</strong>
        </div>
      </div>

      <div className="metricas-rendimiento">
        <div className="metrica">
          <span>Colaboración</span>
          <div className="barra-progreso">
            <div 
              className="progreso"
              style={{ 
                width: `${insights.collaborationScore}%`,
                backgroundColor: nivelColaboracion.color
              }}
            />
          </div>
          <span>{nivelColaboracion.nivel}</span>
        </div>

        <div className="metrica">
          <span>Liderazgo</span>
          <div className="barra-progreso">
            <div 
              className="progreso"
              style={{ 
                width: `${insights.leadershipScore}%`,
                backgroundColor: nivelLiderazgo.color
              }}
            />
          </div>
          <span>{nivelLiderazgo.nivel}</span>
        </div>
      </div>

      <div className="estadisticas-detalladas">
        <div className="categoria">
          <h4>Proyectos</h4>
          <ul>
            <li>Propietario: {stats.ownerProjects}</li>
            <li>Administrador: {stats.adminProjects}</li>
            <li>Miembro: {stats.memberProjects}</li>
          </ul>
        </div>

        <div className="categoria">
          <h4>Tareas</h4>
          <ul>
            <li>Creadas: {stats.tasksCreated}</li>
            <li>Asignadas: {stats.tasksAssigned}</li>
            <li>Completadas: {stats.tasksCompleted}</li>
            <li>Pendientes: {stats.tasksPending}</li>
            <li>En Progreso: {stats.tasksInProgress}</li>
          </ul>
        </div>

        <div className="categoria">
          <h4>Comunicación</h4>
          <ul>
            <li>Mensajes Enviados: {stats.messagesSent}</li>
            <li>Conversaciones Directas: {stats.directConversations}</li>
            <li>Llamadas Participadas: {stats.callsParticipated}</li>
            <li>Llamadas Iniciadas: {stats.callsInitiated}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
```

### **Hook Personalizado para Perfil**
```javascript
import { useState, useEffect } from 'react';

const usePerfil = (userId = null) => {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarPerfil = async () => {
      setCargando(true);
      setError(null);
      
      try {
        const endpoint = userId 
          ? `/users/${userId}/profile` 
          : '/auth/me/profile';
        
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Error cargando perfil');
        }

        const data = await response.json();
        setPerfil(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    cargarPerfil();
  }, [userId]);

  const actualizarPerfil = () => {
    // Recargar perfil
    cargarPerfil();
  };

  return { 
    perfil, 
    cargando, 
    error, 
    actualizarPerfil 
  };
};

// Uso del hook
const MiComponente = () => {
  const { perfil, cargando, error } = usePerfil();
  
  if (cargando) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <PerfilUsuario perfil={perfil} />;
};
```

---

## **📱 Implementación React Native**

```jsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';

const PantallaPerfilUsuario = ({ userId }) => {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPerfil();
  }, [userId]);

  const cargarPerfil = async () => {
    try {
      const endpoint = userId 
        ? `/users/${userId}/profile` 
        : '/auth/me/profile';
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${await getToken()}`
        }
      });
      
      const data = await response.json();
      setPerfil(data);
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
          {perfil.fullName}
        </Text>
        <Text style={{ fontSize: 16, color: 'gray' }}>
          {perfil.email}
        </Text>
        <View style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          backgroundColor: perfil.status === 'online' ? '#10B981' : '#EF4444',
          borderRadius: 4,
          alignSelf: 'flex-start',
          marginTop: 5
        }}>
          <Text style={{ color: 'white', fontSize: 12 }}>
            {perfil.status}
          </Text>
        </View>
      </View>

      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-around',
        marginBottom: 20 
      }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
            {perfil.stats.totalProjects}
          </Text>
          <Text style={{ color: 'gray' }}>Proyectos</Text>
        </View>
        
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
            {perfil.stats.tasksCompleted}
          </Text>
          <Text style={{ color: 'gray' }}>Completadas</Text>
        </View>
        
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
            {perfil.stats.completionRate}%
          </Text>
          <Text style={{ color: 'gray' }}>Tasa Éxito</Text>
        </View>
      </View>

      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Actividad Reciente
      </Text>
      
      {perfil.recentActivity.map((actividad, index) => (
        <View key={index} style={{
          padding: 10,
          backgroundColor: '#f5f5f5',
          borderRadius: 8,
          marginBottom: 10
        }}>
          <Text style={{ fontWeight: 'bold' }}>{actividad.title}</Text>
          <Text style={{ color: 'gray' }}>
            {actividad.project} • {new Date(actividad.timestamp).toLocaleDateString()}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
};
```

---

## **🔧 Optimizaciones de Base de Datos**

### **Consultas Eficientes**
```sql
-- Crear índices para mejor rendimiento
CREATE INDEX idx_tasks_created_by ON tasks(created_by_id);
CREATE INDEX idx_tasks_assignees ON task_assignees(user_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_call_participants ON call_participants(user_id);
CREATE INDEX idx_project_invitations_inviter ON project_invitations(invited_by_id);

-- Consulta optimizada para estadísticas de usuario
SELECT 
  u.id,
  u.email,
  u.nombre,
  u.apellidos,
  COUNT(DISTINCT pm.project_id) as total_projects,
  COUNT(DISTINCT CASE WHEN pm.role = 'owner' THEN pm.project_id END) as owner_projects,
  COUNT(DISTINCT CASE WHEN pm.role = 'admin' THEN pm.project_id END) as admin_projects,
  COUNT(DISTINCT CASE WHEN pm.role = 'member' THEN pm.project_id END) as member_projects
FROM users u
LEFT JOIN project_members pm ON u.id = pm.user_id
WHERE u.id = $1
GROUP BY u.id, u.email, u.nombre, u.apellidos;
```

---

## **🚀 Funcionalidades Avanzadas**

### **Comparación de Perfiles**
```javascript
const compararPerfiles = (perfil1, perfil2) => {
  return {
    proyectos: {
      diferencia: perfil1.stats.totalProjects - perfil2.stats.totalProjects,
      porcentaje: ((perfil1.stats.totalProjects / perfil2.stats.totalProjects) * 100).toFixed(1)
    },
    completado: {
      diferencia: perfil1.stats.completionRate - perfil2.stats.completionRate,
      mejor: perfil1.stats.completionRate > perfil2.stats.completionRate ? perfil1 : perfil2
    },
    colaboracion: {
      diferencia: perfil1.insights.collaborationScore - perfil2.insights.collaborationScore,
      mejor: perfil1.insights.collaborationScore > perfil2.insights.collaborationScore ? perfil1 : perfil2
    }
  };
};
```

### **Exportar Datos de Perfil**
```javascript
const exportarPerfilCSV = (perfil) => {
  const datos = [
    ['Campo', 'Valor'],
    ['Nombre Completo', perfil.fullName],
    ['Email', perfil.email],
    ['Total Proyectos', perfil.stats.totalProjects],
    ['Proyectos como Propietario', perfil.stats.ownerProjects],
    ['Tareas Creadas', perfil.stats.tasksCreated],
    ['Tareas Completadas', perfil.stats.tasksCompleted],
    ['Tasa de Completado', `${perfil.stats.completionRate}%`],
    ['Mensajes Enviados', perfil.stats.messagesSent],
    ['Puntuación de Colaboración', perfil.insights.collaborationScore],
    ['Puntuación de Liderazgo', perfil.insights.leadershipScore]
  ];

  const csv = datos.map(fila => fila.join(',')).join('\n');
  return csv;
};
```

---

**🎯 Perfil completo del usuario con insights avanzados y análisis de rendimiento!** 🚀👤 