# Documentación de la API de Secciones de Proyecto 📂

## Descripción General
Las Secciones de Proyecto (Secciones) organizan las tareas dentro de los proyectos, habilitando tableros estilo Kanban y gestión estructurada de tareas. Cada sección pertenece a un proyecto específico y mantiene un orden personalizado.

## Características ✨
- **Secciones Basadas en Proyecto** - Cada sección pertenece a un proyecto específico
- **Ordenamiento Personalizado** - Reordenamiento por arrastrar y soltar con gestión automática del orden
- **Organización de Tareas** - Las tareas pueden asignarse a secciones para mejor estructura
- **Soporte Kanban** - Perfecto para crear tableros Kanban (Por Hacer, En Progreso, Terminado)
- **Limpieza Automática** - Las secciones se reordenan automáticamente cuando una es eliminada
- **Control de Permisos** - Solo los administradores y propietarios pueden gestionar las secciones

---

## 🎯 Inicio Rápido

### Crear una Sección
```http
POST /projects/{projectId}/sections
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "En Progreso",
  "order": 2
}
```

**Respuesta:**
```json
{
  "id": 2,
  "name": "En Progreso", 
  "order": 2,
  "project": {
    "id": "project-uuid",
    "name": "Axon Backend"
  }
}
```

---

## 📋 Endpoints de Gestión de Secciones

### Crear Sección
**URL:** `POST /projects/{projectId}/sections`

**Autenticación:** Requerida (Token JWT Bearer)

**Permisos:** `MANAGE_SECTIONS` (Solo Admin/Propietario)

**Cuerpo de Solicitud:**
```json
{
  "name": "Terminado",
  "order": 3
}
```

**Requisitos de Validación:**
| Campo | Tipo | Requerido | Reglas |
|-------|------|----------|-------|
| `name` | string | ✅ Sí | 3-50 caracteres, único por proyecto |
| `order` | number | ❌ No | Se asigna automáticamente si no se proporciona |

**Respuesta Exitosa (201):**
```json
{
  "id": 3,
  "name": "Terminado",
  "order": 3,
  "project": {
    "id": "project-uuid",
    "name": "Proyecto de Aplicación Móvil"
  }
}
```

---

### Obtener Secciones de Proyecto
**URL:** `GET /projects/{projectId}/sections`

**Autenticación:** Requerida (Token JWT Bearer)

**Permisos:** `VIEW_PROJECT` (Todos los miembros del proyecto)

**Respuesta Exitosa (200):**
```json
[
  {
    "id": 1,
    "name": "Backlog",
    "order": 1
  },
  {
    "id": 2,
    "name": "En Progreso", 
    "order": 2
  },
  {
    "id": 3,
    "name": "Terminado",
    "order": 3
  }
]
```

**Nota:** Las secciones se ordenan automáticamente por el campo `order` (ASC).

---

### Actualizar Sección
**URL:** `PUT /projects/{projectId}/sections/{sectionId}`

**Autenticación:** Requerida (Token JWT Bearer)

**Permisos:** `MANAGE_SECTIONS` (Solo Admin/Propietario)

**Cuerpo de Solicitud:**
```json
{
  "name": "Tareas Completadas",
  "order": 4
}
```

**Respuesta Exitosa (200):**
```json
{
  "id": 3,
  "name": "Tareas Completadas",
  "order": 4,
  "project": {
    "id": "project-uuid",
    "name": "Proyecto de Aplicación Móvil"
  }
}
```

---

### Eliminar Sección
**URL:** `DELETE /projects/{projectId}/sections/{sectionId}`

**Autenticación:** Requerida (Token JWT Bearer)

**Permisos:** `MANAGE_SECTIONS` (Solo Admin/Propietario)

**Respuesta Exitosa (200):**
```json
{
  "message": "section-deleted-successfully"
}
```

**Nota:** Eliminar una sección reordena automáticamente las secciones restantes para llenar el vacío.

---

### Reordenar Secciones (Arrastrar y Soltar)
**URL:** `PUT /projects/{projectId}/sections/reorder`

**Autenticación:** Requerida (Token JWT Bearer)

**Permisos:** `MANAGE_SECTIONS` (Solo Admin/Propietario)

**Cuerpo de Solicitud:**
```json
{
  "sectionIds": [3, 1, 2]
}
```

**Respuesta Exitosa (200):**
```json
{
  "message": "sections-reordered-successfully"
}
```

**Nota:** El orden del array determina el nuevo orden de las secciones. El ID de sección en el índice 0 obtiene orden 1, el índice 1 obtiene orden 2, etc.

---

## ❌ Respuestas de Error

### 400 Solicitud Incorrecta

**ID de Proyecto Inválido:**
```json
{
  "statusCode": 400,
  "message": "invalid-project-id"
}
```

**ID de Sección Inválido:**
```json
{
  "statusCode": 400,
  "message": "invalid-section-id"
}
```

**Errores de Validación de Nombre:**
```json
{
  "statusCode": 400,
  "message": [
    "name-too-short",
    "name-too-large"
  ]
}
```

**Campos Requeridos Faltantes:**
```json
{
  "statusCode": 400,
  "message": "name-required"
}
```

### 401 No Autorizado
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Prohibido
```json
{
  "statusCode": 403,
  "message": "insufficient-permissions"
}
```

### 404 No Encontrado

**Proyecto No Encontrado:**
```json
{
  "statusCode": 404,
  "message": "project-not-found"
}
```

**Sección No Encontrada:**
```json
{
  "statusCode": 404,
  "message": "section-not-found"
}
```

### 409 Conflicto

**Nombre de Sección Duplicado:**
```json
{
  "statusCode": 409,
  "message": "section-name-already-exists"
}
```

---

## 🎯 Casos de Uso Comunes

### Tablero Kanban Básico
Crea las secciones esenciales para un flujo de trabajo Kanban:

```javascript
const createKanbanSections = async (projectId) => {
  const sections = [
    { name: "Por Hacer", order: 1 },
    { name: "En Progreso", order: 2 },
    { name: "En Revisión", order: 3 },
    { name: "Terminado", order: 4 }
  ];

  for (const section of sections) {
    await createSection(projectId, section);
  }
};
```

### Flujo de Trabajo de Desarrollo
Para equipos de desarrollo de software:

```javascript
const developmentSections = [
  { name: "Backlog", order: 1 },
  { name: "Sprint Actual", order: 2 },
  { name: "En Desarrollo", order: 3 },
  { name: "Pruebas", order: 4 },
  { name: "Revisión de Código", order: 5 },
  { name: "Listo para Producción", order: 6 },
  { name: "Completado", order: 7 }
];
```

---

## 🔒 Lógica de Negocio y Validaciones

### Gestión de Orden Automático
- **Creación**: Si no se proporciona `order`, se asigna automáticamente (último + 1)
- **Eliminación**: Los órdenes de las secciones restantes se reajustan automáticamente
- **Reordenamiento**: El array completo de IDs redefine todos los órdenes

### Restricciones de Nombre
- Longitud mínima: **3 caracteres**
- Longitud máxima: **50 caracteres**
- **Único por proyecto**: No se pueden duplicar nombres dentro del mismo proyecto
- Se eliminan espacios en blanco automáticamente

### Gestión de Permisos
- **`VIEW_PROJECT`**: Puede ver todas las secciones del proyecto
- **`MANAGE_SECTIONS`**: Puede crear, editar, eliminar y reordenar secciones
- Solo los roles **Admin** y **Owner** tienen `MANAGE_SECTIONS`

---

## 🛠️ Implementación Frontend

### Componente de Sección Básico
```typescript
interface Section {
  id: number;
  name: string;
  order: number;
}

const SectionComponent: React.FC<{ section: Section }> = ({ section }) => {
  return (
    <div className="section-card">
      <h3>{section.name}</h3>
      <div className="section-tasks">
        {/* Tareas van aquí */}
      </div>
    </div>
  );
};
```

### Hook de Gestión de Secciones
```typescript
const useSections = (projectId: string) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);

  const createSection = async (sectionData: CreateSectionDto) => {
    const response = await api.post(`/projects/${projectId}/sections`, sectionData);
    setSections(prev => [...prev, response.data].sort((a, b) => a.order - b.order));
    return response.data;
  };

  const reorderSections = async (sectionIds: number[]) => {
    await api.put(`/projects/${projectId}/sections/reorder`, { sectionIds });
    // Reordenar localmente
    const reordered = sectionIds.map((id, index) => ({
      ...sections.find(s => s.id === id)!,
      order: index + 1
    }));
    setSections(reordered);
  };

  return { sections, createSection, reorderSections, loading };
};
```

### Arrastrar y Soltar con React DnD
```typescript
import { DndProvider, useDrag, useDrop } from 'react-dnd';

const DraggableSection: React.FC<{
  section: Section;
  index: number;
  moveSectionLocal: (dragIndex: number, hoverIndex: number) => void;
}> = ({ section, index, moveSectionLocal }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'section',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'section',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveSectionLocal(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div ref={(node) => drag(drop(node))} className={`section ${isDragging ? 'dragging' : ''}`}>
      <h3>{section.name}</h3>
    </div>
  );
};
```

---

## 📊 Análisis y Métricas

### Estadísticas de Sección
```typescript
interface SectionStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  completionRate: number;
}

const getSectionStats = async (projectId: string, sectionId: number): Promise<SectionStats> => {
  const response = await api.get(`/projects/${projectId}/sections/${sectionId}/stats`);
  return response.data;
};
```

### Métricas de Flujo de Trabajo
- **Tiempo en sección**: Cuánto tiempo pasan las tareas en cada sección
- **Cuellos de botella**: Secciones con muchas tareas estancadas
- **Velocidad de flujo**: Tareas completadas por unidad de tiempo

---

## 💡 Mejores Prácticas

### Diseño de Secciones
- **Mantén nombres simples**: "Por Hacer", "Haciendo", "Terminado"
- **Limita el número**: 3-7 secciones para mejor visualización
- **Flujo lógico**: Las secciones deben representar un flujo natural de trabajo

### Gestión de Estado
- **Actualiza localmente primero** para mejor UX
- **Maneja errores de red** con rollback local
- **Sincroniza periodicamentemente** con el servidor

### Rendimiento
- **Carga diferida**: Solo carga secciones visibles
- **Caché inteligente**: Almacena secciones frecuentemente accedidas
- **Optimistic updates**: Actualiza UI antes de la respuesta del servidor

---

## 🚀 Funcionalidades Avanzadas

### Plantillas de Sección
```javascript
const SECTION_TEMPLATES = {
  kanban: [
    { name: "Por Hacer", order: 1 },
    { name: "En Progreso", order: 2 },
    { name: "Terminado", order: 3 }
  ],
  development: [
    { name: "Backlog", order: 1 },
    { name: "Desarrollo", order: 2 },
    { name: "Pruebas", order: 3 },
    { name: "Despliegue", order: 4 },
    { name: "Completado", order: 5 }
  ],
  marketing: [
    { name: "Ideas", order: 1 },
    { name: "Planeación", order: 2 },
    { name: "Creación", order: 3 },
    { name: "Revisión", order: 4 },
    { name: "Publicado", order: 5 }
  ]
};
```

### Automatización de Flujo de Trabajo
```javascript
// Auto-mover tareas basado en condiciones
const autoMoveTask = async (taskId: string, condition: string) => {
  const rules = {
    'all_subtasks_complete': 'Terminado',
    'assigned_to_qa': 'Pruebas',
    'code_review_approved': 'Listo para Producción'
  };
  
  if (rules[condition]) {
    const targetSection = await findSectionByName(projectId, rules[condition]);
    await moveTaskToSection(taskId, targetSection.id);
  }
};
```

---

## 🔄 Integración con Otros Sistemas

### Webhooks de Sección
```javascript
// Notificar cambios de sección a sistemas externos
const sectionWebhook = {
  created: (section) => notify('section.created', section),
  updated: (section) => notify('section.updated', section),
  deleted: (section) => notify('section.deleted', section),
  reordered: (sections) => notify('sections.reordered', sections)
};
```

### Exportar/Importar Configuración
```javascript
const exportSectionConfig = async (projectId: string) => {
  const sections = await getSections(projectId);
  return {
    version: '1.0',
    sections: sections.map(({ name, order }) => ({ name, order }))
  };
};

const importSectionConfig = async (projectId: string, config: any) => {
  // Eliminar secciones existentes
  await clearExistingSections(projectId);
  
  // Crear nuevas secciones
  for (const section of config.sections) {
    await createSection(projectId, section);
  }
};
``` 