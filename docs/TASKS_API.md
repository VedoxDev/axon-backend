# Documentación de la API de Tareas 📋

## Descripción General
El sistema de Tareas soporta tanto **tareas personales** como **tareas de proyecto** con operaciones CRUD completas, subtareas y etiquetas.

## Sistema de Prioridades 🎨
- **Prioridad 1 (Baja):** `#10B981` (Verde) ⬇️
- **Prioridad 2 (Media):** `#F59E0B` (Ámbar) ➡️
- **Prioridad 3 (Alta):** `#EF4444` (Rojo) ⬆️
- **Prioridad 4 (Crítica):** `#7C3AED` (Púrpura) 🔥

## Estado de Tareas
- `todo` - Sin comenzar
- `in_progress` - Actualmente en proceso
- `done` - Completada

---

## 🚀 Endpoints de Tareas

### Crear Tarea
```http
POST /tasks
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Arreglar error de login",
  "description": "Los usuarios no pueden hacer login con caracteres especiales en el email",
  "projectId": "uuid-aquí", // Opcional - omitir para tarea personal
  "sectionId": 1, // Opcional - omitir para ninguna sección
  "assigneeIds": ["user-uuid-1", "user-uuid-2"], // Opcional
  "labelIds": [1, 2], // Opcional
  "priority": 3, // 1-4, por defecto: 2
  "dueDate": "2024-01-15T10:00:00Z", // Opcional
  "status": "todo" // Opcional, por defecto: "todo"
}
```

**Respuesta:**
```json
{
  "id": "task-uuid",
  "title": "Arreglar error de login",
  "description": "Los usuarios no pueden hacer login con caracteres especiales en el email",
  "priority": 3,
  "status": "todo",
  "dueDate": "2024-01-15T10:00:00.000Z",
  "order": 1,
  "project": { "id": "project-uuid", "name": "Axon Backend" },
  "section": { "id": 1, "name": "En Progreso" },
  "createdBy": { "id": "user-uuid", "nombre": "Victor", "apellidos": "Fonseca" },
  "assignees": [
    { "id": "user-uuid-1", "nombre": "John", "apellidos": "Doe" }
  ],
  "labels": [
    { "id": 1, "name": "Error", "color": "#EF4444" }
  ],
  "subtasks": [],
  "createdAt": "2024-01-10T10:00:00.000Z",
  "updatedAt": "2024-01-10T10:00:00.000Z"
}
```

### Obtener Tareas Personales
```http
GET /tasks/personal
Authorization: Bearer <jwt-token>
```

### Obtener Tareas de Proyecto
```http
GET /tasks/project/{projectId}
Authorization: Bearer <jwt-token>
```

### Obtener Tareas de Sección
```http
GET /tasks/project/{projectId}/section/{sectionId}
Authorization: Bearer <jwt-token>
```

### Obtener Tarea por ID
```http
GET /tasks/{taskId}
Authorization: Bearer <jwt-token>
```

### Actualizar Tarea
```http
PUT /tasks/{taskId}
Authorization: Bearer <jwt-token>

{
  "title": "Título actualizado",
  "status": "in_progress",
  "priority": 4,
  "assigneeIds": ["new-user-uuid"]
  // Cualquier campo de CreateTaskDto puede ser actualizado
}
```

### Eliminar Tarea
```http
DELETE /tasks/{taskId}
Authorization: Bearer <jwt-token>
```

---

## 📝 Endpoints de Subtareas

### Crear Subtarea
```http
POST /tasks/{taskId}/subtasks
Authorization: Bearer <jwt-token>

{
  "title": "Escribir pruebas unitarias",
  "description": "Agregar pruebas para la función de login",
  "order": 1 // Opcional
}
```

### Actualizar Subtarea
```http
PUT /tasks/{taskId}/subtasks/{subtaskId}
Authorization: Bearer <jwt-token>

{
  "title": "Título de subtarea actualizado",
  "completed": true,
  "description": "Descripción actualizada"
}
```

### Eliminar Subtarea
```http
DELETE /tasks/{taskId}/subtasks/{subtaskId}
Authorization: Bearer <jwt-token>
```

---

## 🏷️ Endpoints de Etiquetas

### Crear Etiqueta de Proyecto
```http
POST /tasks/projects/{projectId}/labels
Authorization: Bearer <jwt-token>

{
  "name": "Error",
  "color": "#EF4444"
}
```

### Obtener Etiquetas de Proyecto
```http
GET /tasks/projects/{projectId}/labels
Authorization: Bearer <jwt-token>
```

### Actualizar Etiqueta
```http
PUT /tasks/projects/{projectId}/labels/{labelId}
Authorization: Bearer <jwt-token>

{
  "name": "Error Crítico",
  "color": "#7C3AED"
}
```

### Eliminar Etiqueta
```http
DELETE /tasks/projects/{projectId}/labels/{labelId}
Authorization: Bearer <jwt-token>
```

---

## 💡 Ejemplos de Uso

### Creando una Tarea Personal
```javascript
const tareaPersonal = {
  "title": "Actualizar currículum",
  "description": "Agregar nuevas habilidades y proyectos recientes",
  "priority": 2,
  "dueDate": "2024-01-20T18:00:00Z"
  // Sin projectId = tarea personal
};

fetch('/tasks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(tareaPersonal)
});
```

### Creando una Tarea de Proyecto con Asignados
```javascript
const tareaProyecto = {
  "title": "Implementar notificaciones en tiempo real",
  "description": "Agregar soporte WebSocket para actualizaciones en vivo",
  "projectId": "project-uuid",
  "sectionId": 2, // Sección "En Progreso"
  "assigneeIds": ["dev1-uuid", "dev2-uuid"],
  "labelIds": [1, 3], // ["Característica", "Alta Prioridad"]
  "priority": 3,
  "dueDate": "2024-01-25T09:00:00Z"
};
```

### Moviendo Tarea Entre Secciones
```javascript
// Mover tarea a sección "Terminado"
fetch(`/tasks/${taskId}`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    "sectionId": 3, // Sección "Terminado"
    "status": "done"
  })
});
```

### Creando Subtareas para Tarjetas Kanban
```javascript
const subtareas = [
  { "title": "Diseñar esquema de base de datos", "order": 1 },
  { "title": "Crear endpoints de API", "order": 2 },
  { "title": "Agregar pruebas unitarias", "order": 3 },
  { "title": "Actualizar documentación", "order": 4 }
];

for (const subtarea of subtareas) {
  await fetch(`/tasks/${taskId}/subtasks`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(subtarea)
  });
}
```

---

## 🎯 Flujos de Trabajo Comunes

### Tablero Kanban de Proyecto
```javascript
// 1. Obtener secciones del proyecto
const secciones = await fetch(`/projects/${projectId}/sections`);

// 2. Obtener tareas agrupadas por sección
const tareasProyecto = await fetch(`/tasks/project/${projectId}`);

// 3. Agrupar tareas por sección para renderizado
const tareasPorSeccion = {};
tareasProyecto.forEach(tarea => {
  const seccionId = tarea.section?.id || 'sin-seccion';
  if (!tareasPorSeccion[seccionId]) {
    tareasPorSeccion[seccionId] = [];
  }
  tareasPorSeccion[seccionId].push(tarea);
});
```

### Sistema de Etiquetas
```javascript
// Crear etiquetas comunes para un proyecto
const etiquetasComunes = [
  { name: "Error", color: "#EF4444" },
  { name: "Característica", color: "#10B981" },
  { name: "Mejora", color: "#F59E0B" },
  { name: "Documentación", color: "#6366F1" },
  { name: "Urgente", color: "#7C3AED" }
];

for (const etiqueta of etiquetasComunes) {
  await fetch(`/tasks/projects/${projectId}/labels`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(etiqueta)
  });
}
```

### Gestión de Asignaciones
```javascript
// Asignar tarea a múltiples desarrolladores
const asignarTarea = async (taskId, assigneeIds) => {
  await fetch(`/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ assigneeIds })
  });
};

// Obtener tareas asignadas a un usuario específico
const tareasUsuario = await fetch(`/tasks/assigned/${userId}`, {
  headers: { 'Authorization': 'Bearer ' + token }
});
```

---

## 📊 Filtrado y Búsqueda

### Filtros de Tarea
```javascript
// Filtrar tareas por prioridad
const tareasAltaPrioridad = tareas.filter(t => t.priority >= 3);

// Filtrar tareas vencidas
const tareasVencidas = tareas.filter(t => 
  t.dueDate && new Date(t.dueDate) < new Date()
);

// Filtrar tareas por etiqueta
const tareasError = tareas.filter(t => 
  t.labels.some(label => label.name === 'Error')
);

// Filtrar tareas asignadas al usuario actual
const misTareas = tareas.filter(t => 
  t.assignees.some(assignee => assignee.id === currentUserId)
);
```

### Búsqueda de Texto
```javascript
const buscarTareas = (tareas, query) => {
  const queryLower = query.toLowerCase();
  return tareas.filter(tarea => 
    tarea.title.toLowerCase().includes(queryLower) ||
    tarea.description.toLowerCase().includes(queryLower) ||
    tarea.labels.some(label => 
      label.name.toLowerCase().includes(queryLower)
    )
  );
};
```

---

## 🔒 Permisos y Validación

### Reglas de Acceso
- **Tareas Personales**: Solo el creador puede ver/editar
- **Tareas de Proyecto**: Todos los miembros del proyecto pueden ver
- **Asignar Tareas**: Solo admins/owners pueden asignar a otros
- **Crear Etiquetas**: Solo admins/owners del proyecto

### Validación de Datos
```javascript
const validarTarea = (tareaData) => {
  const errores = [];
  
  if (!tareaData.title || tareaData.title.length < 3) {
    errores.push('Título debe tener al menos 3 caracteres');
  }
  
  if (tareaData.title && tareaData.title.length > 200) {
    errores.push('Título no puede exceder 200 caracteres');
  }
  
  if (tareaData.priority && (tareaData.priority < 1 || tareaData.priority > 4)) {
    errores.push('Prioridad debe estar entre 1 y 4');
  }
  
  if (tareaData.dueDate && new Date(tareaData.dueDate) < new Date()) {
    errores.push('Fecha de vencimiento debe ser en el futuro');
  }
  
  return errores;
};
```

---

## 🎨 Componentes React de Ejemplo

### Tarjeta de Tarea
```jsx
const TarjetaTarea = ({ tarea, onActualizar }) => {
  const colorPrioridad = {
    1: '#10B981', // Verde
    2: '#F59E0B', // Ámbar  
    3: '#EF4444', // Rojo
    4: '#7C3AED'  // Púrpura
  };

  const cambiarEstado = async (nuevoEstado) => {
    await fetch(`/tasks/${tarea.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: nuevoEstado })
    });
    onActualizar();
  };

  return (
    <div className="tarjeta-tarea">
      <div className="cabecera-tarea">
        <h3>{tarea.title}</h3>
        <div 
          className="indicador-prioridad"
          style={{ backgroundColor: colorPrioridad[tarea.priority] }}
        />
      </div>
      
      <p>{tarea.description}</p>
      
      <div className="etiquetas-tarea">
        {tarea.labels.map(etiqueta => (
          <span 
            key={etiqueta.id} 
            className="etiqueta"
            style={{ backgroundColor: etiqueta.color }}
          >
            {etiqueta.name}
          </span>
        ))}
      </div>
      
      <div className="asignados-tarea">
        {tarea.assignees.map(asignado => (
          <div key={asignado.id} className="avatar-asignado">
            {asignado.nombre[0]}{asignado.apellidos[0]}
          </div>
        ))}
      </div>
      
      <div className="acciones-tarea">
        <select 
          value={tarea.status} 
          onChange={(e) => cambiarEstado(e.target.value)}
        >
          <option value="todo">Por Hacer</option>
          <option value="in_progress">En Progreso</option>
          <option value="done">Terminado</option>
        </select>
      </div>
    </div>
  );
};
```

### Lista de Subtareas
```jsx
const ListaSubtareas = ({ subtareas, tareaId, onActualizar }) => {
  const [nuevaSubtarea, setNuevaSubtarea] = useState('');

  const crearSubtarea = async () => {
    if (nuevaSubtarea.trim()) {
      await fetch(`/tasks/${tareaId}/subtasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          title: nuevaSubtarea.trim(),
          order: subtareas.length + 1
        })
      });
      setNuevaSubtarea('');
      onActualizar();
    }
  };

  const alternarCompletado = async (subtareaId, completado) => {
    await fetch(`/tasks/${tareaId}/subtasks/${subtareaId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ completed: !completado })
    });
    onActualizar();
  };

  return (
    <div className="lista-subtareas">
      <h4>Subtareas ({subtareas.filter(s => s.completed).length}/{subtareas.length})</h4>
      
      {subtareas.map(subtarea => (
        <div key={subtarea.id} className="item-subtarea">
          <input 
            type="checkbox"
            checked={subtarea.completed}
            onChange={() => alternarCompletado(subtarea.id, subtarea.completed)}
          />
          <span className={subtarea.completed ? 'completado' : ''}>
            {subtarea.title}
          </span>
        </div>
      ))}
      
      <div className="agregar-subtarea">
        <input 
          type="text"
          value={nuevaSubtarea}
          onChange={(e) => setNuevaSubtarea(e.target.value)}
          placeholder="Agregar subtarea..."
          onKeyPress={(e) => e.key === 'Enter' && crearSubtarea()}
        />
        <button onClick={crearSubtarea}>Agregar</button>
      </div>
    </div>
  );
};
```

---

## 📈 Métricas y Análisis

### Dashboard de Tareas
```javascript
const calcularMetricas = (tareas) => {
  const total = tareas.length;
  const completadas = tareas.filter(t => t.status === 'done').length;
  const enProgreso = tareas.filter(t => t.status === 'in_progress').length;
  const vencidas = tareas.filter(t => 
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
  ).length;
  
  const porPrioridad = {
    baja: tareas.filter(t => t.priority === 1).length,
    media: tareas.filter(t => t.priority === 2).length,
    alta: tareas.filter(t => t.priority === 3).length,
    critica: tareas.filter(t => t.priority === 4).length
  };

  return {
    total,
    completadas,
    enProgreso,
    vencidas,
    tasaCompletado: total > 0 ? (completadas / total * 100).toFixed(1) : 0,
    porPrioridad
  };
};
```

### Progreso de Proyecto
```javascript
const calcularProgresoProyecto = async (projectId) => {
  const tareas = await fetch(`/tasks/project/${projectId}`);
  const secciones = await fetch(`/projects/${projectId}/sections`);
  
  const progreso = secciones.map(seccion => {
    const tareasSeccion = tareas.filter(t => t.section?.id === seccion.id);
    const completadas = tareasSeccion.filter(t => t.status === 'done').length;
    
    return {
      seccion: seccion.name,
      total: tareasSeccion.length,
      completadas,
      porcentaje: tareasSeccion.length > 0 
        ? (completadas / tareasSeccion.length * 100).toFixed(1) 
        : 0
    };
  });
  
  return progreso;
};
```

---

## 🔧 Optimización y Rendimiento

### Paginación de Tareas
```javascript
const obtenerTareasPaginadas = async (projectId, pagina = 1, limite = 20) => {
  const response = await fetch(
    `/tasks/project/${projectId}?page=${pagina}&limit=${limite}`,
    { headers: { 'Authorization': `Bearer ${token}` }}
  );
  return response.json();
};
```

### Caché y Estado Local
```javascript
// Hook personalizado para gestión de tareas
const useTareas = (projectId) => {
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const cargarTareas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const response = await fetch(`/tasks/project/${projectId}`);
      const data = await response.json();
      setTareas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [projectId]);

  const crearTarea = async (tareaData) => {
    const response = await fetch('/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...tareaData, projectId })
    });
    
    if (response.ok) {
      const nuevaTarea = await response.json();
      setTareas(prev => [...prev, nuevaTarea]);
      return nuevaTarea;
    }
  };

  useEffect(() => {
    if (projectId) {
      cargarTareas();
    }
  }, [projectId, cargarTareas]);

  return { tareas, cargando, error, crearTarea, cargarTareas };
};
```

---

**🎯 Sistema completo de gestión de tareas para proyectos y productividad personal!** 🚀📋 