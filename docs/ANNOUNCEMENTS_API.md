# Documentación de la API de Anuncios

## Descripción General

La API de Anuncios permite a los administradores y propietarios de proyectos crear anuncios para sus proyectos, y proporciona a los usuarios un área personal para ver todos los anuncios de sus proyectos con capacidades de seguimiento de lectura.

## Características

- ✅ **Anuncios basados en proyectos** con diferentes tipos (info, warning, success, urgent)
- ✅ **Control de permisos** (solo admins/propietarios pueden crear anuncios)
- ✅ **Seguimiento de lectura** por usuario a través de todos los anuncios
- ✅ **Anuncios fijados** para mensajes importantes
- ✅ **Panel personal** mostrando todos los anuncios de los proyectos del usuario
- ✅ **Conteos de no leídos** y estadísticas para mejor experiencia de usuario

## Endpoints

### 1. Crear Anuncio de Proyecto

**URL:** `POST /projects/:projectId/announcements`

**Autenticación:** Requerida (Token JWT Bearer)

**Autorización:** Permiso `MANAGE_ANNOUNCEMENTS` (solo admin/propietario)

**Content-Type:** `application/json`

#### Cuerpo de Solicitud

```json
{
  "title": "string",
  "content": "string",
  "type": "info" | "warning" | "success" | "urgent",
  "pinned": boolean
}
```

#### Requisitos de Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `title` | string | Sí | Título del anuncio (3-200 caracteres) |
| `content` | string | Sí | Contenido del anuncio (10-2000 caracteres) |
| `type` | enum | No | Tipo de anuncio (por defecto: "info") |
| `pinned` | boolean | No | Fijar anuncio arriba (por defecto: false) |

#### Tipos de Anuncios

- **`info`** - Información general (estilo azul/por defecto)
- **`warning`** - Advertencias importantes (estilo amarillo/naranja)
- **`success`** - Notificaciones de éxito (estilo verde)
- **`urgent`** - Mensajes críticos urgentes (estilo rojo)

### 2. Obtener Anuncios de Proyecto

**URL:** `GET /projects/:projectId/announcements`

**Autenticación:** Requerida (Token JWT Bearer)

**Autorización:** Permiso `VIEW_PROJECT` (todos los miembros del proyecto)

### 3. Obtener Anuncios del Usuario (Área Personal)

**URL:** `GET /auth/me/announcements`

**Autenticación:** Requerida (Token JWT Bearer)

**Autorización:** Ninguna (datos propios del usuario)

### 4. Marcar Anuncio como Leído

**URL:** `PUT /announcements/:announcementId/read`

**Autenticación:** Requerida (Token JWT Bearer)

**Autorización:** El usuario debe ser miembro del proyecto que contiene el anuncio

## Response Formats

### Create Announcement - Success Response

**Status Code:** `201 Created`

```json
{
  "message": "announcement-created-successfully",
  "announcement": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "New Feature Release",
    "content": "We have released a new chat feature! Check it out in the sidebar.",
    "type": "success",
    "pinned": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get Project Announcements - Success Response

**Status Code:** `200 OK`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "New Feature Release",
    "content": "We have released a new chat feature! Check it out in the sidebar.",
    "type": "success",
    "pinned": true,
    "createdBy": {
      "id": "user-123",
      "nombre": "John",
      "apellidos": "Doe",
      "fullName": "John Doe"
    },
    "isRead": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "announcement-456",
    "title": "Project Update",
    "content": "Please update your tasks status by end of week.",
    "type": "info",
    "pinned": false,
    "createdBy": {
      "id": "user-789",
      "nombre": "Jane",
      "apellidos": "Smith",
      "fullName": "Jane Smith"
    },
    "isRead": true,
    "createdAt": "2024-01-14T15:20:00.000Z",
    "updatedAt": "2024-01-14T15:20:00.000Z"
  }
]
```

### Get User's Announcements - Success Response

**Status Code:** `200 OK`

```json
{
  "announcements": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "New Feature Release",
      "content": "We have released a new chat feature! Check it out in the sidebar.",
      "type": "success",
      "pinned": true,
      "project": {
        "id": "project-123",
        "name": "My Project"
      },
      "createdBy": {
        "id": "user-123",
        "nombre": "John",
        "apellidos": "Doe",
        "fullName": "John Doe"
      },
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "unreadCount": 3,
  "stats": {
    "total": 10,
    "unread": 3,
    "urgent": 1, 
    "pinned": 2
  }
}
```

### Mark as Read - Success Response

**Status Code:** `200 OK`

```json
{
  "message": "announcement-marked-as-read"
}
```

```json
{
  "message": "announcement-already-read"
}
```

## Error Responses

### Authentication Errors

**Status Code:** `401 Unauthorized`

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### Permission Errors

**Status Code:** `403 Forbidden`

```json
{
  "statusCode": 403,
  "message": "insufficient-permissions",
  "error": "Forbidden"
}
```

### Validation Errors

**Status Code:** `400 Bad Request`

**Missing Required Fields:**
```json
{
  "statusCode": 400,
  "message": [
    "title-required",
    "content-required"
  ],
  "error": "Bad Request"
}
```

**Content Validation Errors:**
```json
{
  "statusCode": 400,
  "message": [
    "title-too-short",
    "title-too-long",
    "content-too-short",
    "content-too-long",
    "type-must-be-info-warning-success-or-urgent",
    "pinned-must-be-boolean"
  ],
  "error": "Bad Request"
}
```

### Not Found Errors

**Status Code:** `404 Not Found`

```json
{
  "statusCode": 404,
  "message": "project-not-found",
  "error": "Not Found"
}
```

```json
{
  "statusCode": 404,
  "message": "announcement-not-found-or-no-access",
  "error": "Not Found"
}
```

### Invalid UUID Errors

**Status Code:** `400 Bad Request`

```json
{
  "statusCode": 400,
  "message": "invalid-project-id",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "invalid-announcement-id",
  "error": "Bad Request"
}
```

## Example Usage

### Using cURL

#### Create Announcement

```bash
curl -X POST "http://localhost:3000/projects/550e8400-e29b-41d4-a716-446655440000/announcements" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Feature Release",
    "content": "We have released a new chat feature! Check it out in the sidebar and start collaborating more effectively.",
    "type": "success",
    "pinned": true
  }'
```

#### Get Project Announcements

```bash
curl -X GET "http://localhost:3000/projects/550e8400-e29b-41d4-a716-446655440000/announcements" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get User's Announcements

```bash
curl -X GET "http://localhost:3000/auth/me/announcements" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Mark Announcement as Read

```bash
curl -X PUT "http://localhost:3000/announcements/550e8400-e29b-41d4-a716-446655440000/read" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using JavaScript (fetch)

#### Create Announcement

```javascript
const createAnnouncement = async (projectId, announcementData) => {
  try {
    const response = await fetch(`/projects/${projectId}/announcements`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(announcementData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(Array.isArray(error.message) ? error.message.join(', ') : error.message);
    }

    const result = await response.json();
    console.log('Announcement created:', result);
    return result;
  } catch (error) {
    console.error('Failed to create announcement:', error.message);
    throw error;
  }
};

// Usage example
createAnnouncement('project-123', {
  title: 'Team Meeting Tomorrow',
  content: 'We will have our weekly team meeting tomorrow at 2 PM. Please prepare your status updates.',
  type: 'info',
  pinned: false
})
.then(result => {
  alert('Announcement created successfully!');
  // Refresh announcements list
})
.catch(error => {
  alert('Failed to create announcement: ' + error.message);
});
```

#### Get User's Announcements

```javascript
const getUserAnnouncements = async () => {
  try {
    const response = await fetch('/auth/me/announcements', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch announcements:', error.message);
    throw error;
  }
};

// Usage example
getUserAnnouncements()
  .then(data => {
    console.log('Total announcements:', data.stats.total);
    console.log('Unread count:', data.unreadCount);
    console.log('Announcements:', data.announcements);
    
    // Update UI with unread count
    document.getElementById('unread-count').textContent = data.unreadCount;
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

#### Mark as Read

```javascript
const markAnnouncementAsRead = async (announcementId) => {
  try {
    const response = await fetch(`/announcements/${announcementId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to mark as read:', error.message);
    throw error;
  }
};

// Auto-mark as read when user views announcement
const viewAnnouncement = (announcementId) => {
  markAnnouncementAsRead(announcementId)
    .then(() => {
      // Update UI to show as read
      document.getElementById(`announcement-${announcementId}`).classList.add('read');
      // Decrease unread counter
      const counter = document.getElementById('unread-count');
      counter.textContent = Math.max(0, parseInt(counter.textContent) - 1);
    })
    .catch(error => {
      console.error('Failed to mark as read:', error);
    });
};
```

### Using Axios

```javascript
import axios from 'axios';

const announcementsAPI = {
  // Create announcement
  create: async (projectId, data) => {
    try {
      const response = await axios.post(`/projects/${projectId}/announcements`, data, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message 
          ? Array.isArray(error.response.data.message) 
            ? error.response.data.message.join(', ')
            : error.response.data.message
          : error.message
      );
    }
  },

  // Get project announcements
  getByProject: async (projectId) => {
    try {
      const response = await axios.get(`/projects/${projectId}/announcements`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  },

  // Get user's announcements
  getMine: async () => {
    try {
      const response = await axios.get('/auth/me/announcements', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  },

  // Mark as read
  markAsRead: async (announcementId) => {
    try {
      const response = await axios.put(`/announcements/${announcementId}/read`, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }
};

// Usage examples
announcementsAPI.create('project-123', {
  title: 'Urgent: Server Maintenance',
  content: 'We will be performing server maintenance this Saturday from 2-4 AM UTC. Expect brief downtime.',
  type: 'urgent',
  pinned: true
});

announcementsAPI.getMine().then(data => {
  console.log(`You have ${data.unreadCount} unread announcements`);
});
```

## Frontend Integration Guidelines

### Real-time Updates

Consider implementing WebSocket connections or periodic polling to show new announcements in real-time:

```javascript
// Polling example
const pollForNewAnnouncements = () => {
  setInterval(async () => {
    try {
      const data = await announcementsAPI.getMine();
      updateAnnouncementsList(data.announcements);
      updateUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to poll announcements:', error);
    }
  }, 30000); // Poll every 30 seconds
};
```

### UI Components Recommendations

#### Announcement Types Styling

```css
.announcement {
  padding: 16px;
  border-left: 4px solid;
  margin-bottom: 12px;
  border-radius: 4px;
}

.announcement.info {
  background-color: #e3f2fd;
  border-left-color: #2196f3;
}

.announcement.success {
  background-color: #e8f5e8;
  border-left-color: #4caf50;
}

.announcement.warning {
  background-color: #fff3e0;
  border-left-color: #ff9800;
}

.announcement.urgent {
  background-color: #ffebee;
  border-left-color: #f44336;
}

.announcement.pinned {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.announcement.unread {
  font-weight: bold;
}
```

#### Unread Badge Component

```javascript
const UnreadBadge = ({ count }) => {
  if (count === 0) return null;
  
  return (
    <span className="unread-badge">
      {count > 99 ? '99+' : count}
    </span>
  );
};
```

### Form Validation

```javascript
const validateAnnouncementForm = (data) => {
  const errors = [];

  if (!data.title || data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long');
  }
  
  if (data.title && data.title.length > 200) {
    errors.push('Title must be no more than 200 characters');
  }

  if (!data.content || data.content.trim().length < 10) {
    errors.push('Content must be at least 10 characters long');
  }
  
  if (data.content && data.content.length > 2000) {
    errors.push('Content must be no more than 2000 characters');
  }

  if (data.type && !['info', 'warning', 'success', 'urgent'].includes(data.type)) {
    errors.push('Invalid announcement type');
  }

  return errors;
};
```

### State Management

```javascript
// Example Redux slice for announcements
const announcementsSlice = createSlice({
  name: 'announcements',
  initialState: {
    userAnnouncements: [],
    projectAnnouncements: {},
    unreadCount: 0,
    loading: false,
    error: null
  },
  reducers: {
    setUserAnnouncements: (state, action) => {
      state.userAnnouncements = action.payload.announcements;
      state.unreadCount = action.payload.unreadCount;
    },
    setProjectAnnouncements: (state, action) => {
      state.projectAnnouncements[action.payload.projectId] = action.payload.announcements;
    },
    markAsRead: (state, action) => {
      const announcementId = action.payload;
      
      // Update user announcements
      state.userAnnouncements = state.userAnnouncements.map(ann => 
        ann.id === announcementId ? { ...ann, isRead: true } : ann
      );
      
      // Update project announcements
      Object.keys(state.projectAnnouncements).forEach(projectId => {
        state.projectAnnouncements[projectId] = state.projectAnnouncements[projectId].map(ann =>
          ann.id === announcementId ? { ...ann, isRead: true } : ann
        );
      });
      
      // Decrease unread count
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    }
  }
});
```

## Security Features

- **Permission-based Access:** Only admins/owners can create announcements
- **Project Membership Validation:** Users can only see announcements from projects they're members of
- **Input Validation:** Comprehensive server-side validation for all fields
- **SQL Injection Protection:** Uses TypeORM query builder with parameterized queries
- **Authentication Required:** All endpoints require valid JWT tokens
- **UUID Validation:** Strict UUID validation for all ID parameters

## Performance Considerations

- **Efficient Queries:** Uses optimized database queries with proper joins and indexing
- **Pagination Ready:** Architecture supports adding pagination for large announcement lists
- **Read Status Optimization:** Efficient tracking of read status without duplicating data
- **Caching Friendly:** Response format is designed for easy caching on the frontend

## Database Schema

### Announcements Table
```sql
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info',
  pinned BOOLEAN DEFAULT false,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_by_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### AnnouncementReads Table
```sql
CREATE TABLE announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, announcement_id)
);
```

## Notes

- **Ordering:** Announcements are returned with pinned ones first, then by creation date (newest first)
- **Read Tracking:** Each user's read status is tracked individually
- **Project Context:** All announcements are project-scoped for better organization
- **Type System:** Four announcement types provide flexibility for different communication needs
- **Cascading Deletes:** When projects are deleted, their announcements are automatically removed
- **Unique Constraints:** Prevents duplicate read entries for the same user/announcement pair
- **Future Extensions:** Architecture supports adding features like edit/delete announcements, replies, mentions, etc.

*This comprehensive announcement system provides project teams with effective communication tools while maintaining proper security and user experience!* 📢✨ 