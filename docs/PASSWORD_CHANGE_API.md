# Documentación de la API de Cambio de Contraseña

## Descripción General

Este endpoint permite a los usuarios autenticados cambiar su contraseña de forma segura. Requiere la contraseña actual para verificación y aplica los mismos requisitos de fortaleza de contraseña que el registro.

## Endpoint

### Cambiar Contraseña

**URL:** `PUT /auth/change-password`

**Autenticación:** Requerida (Token JWT Bearer)

**Content-Type:** `application/json`

#### Cuerpo de Solicitud

```json
{
  "currentPassword": "string",
  "newPassword": "string", 
  "confirmPassword": "string"
}
```

#### Requisitos de Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|----------|-------------|
| `currentPassword` | string | Sí | Contraseña actual del usuario para verificación |
| `newPassword` | string | Sí | Nueva contraseña que cumple los requisitos de seguridad |
| `confirmPassword` | string | Sí | Confirmación de la nueva contraseña (debe coincidir con newPassword) |

#### Requisitos de Contraseña

La `newPassword` debe cumplir los siguientes criterios:

- **Longitud Mínima:** 8 caracteres
- **Longitud Máxima:** 64 caracteres
- **Letra Mayúscula:** Al menos una letra mayúscula (A-Z)
- **Número:** Al menos un dígito (0-9)
- **Carácter Especial:** Al menos un símbolo (@$!%*?&.)
- **Caracteres Permitidos:** Solo letras (incluyendo ñÑ), números y símbolos (@$!%*?&.)

#### Validaciones de Seguridad

1. **Verificación de Contraseña Actual:** La contraseña actual proporcionada debe coincidir con la almacenada
2. **Confirmación de Contraseña:** La nueva contraseña y la confirmación de contraseña deben coincidir exactamente
3. **Unicidad de Contraseña:** La nueva contraseña debe ser diferente de la contraseña actual
4. **Requisitos de Fortaleza:** La nueva contraseña debe cumplir todos los requisitos de complejidad

## Formato de Respuesta

### Respuesta Exitosa

**Código de Estado:** `200 OK`

```json
{
  "message": "password-changed-successfully"
}
```

### Respuestas de Error

#### Errores de Autenticación

**Código de Estado:** `401 Unauthorized`

```json
{
  "message": "current-password-incorrect"
}
```

```json
{
  "message": "user-not-found"
}
```

```json
{
  "message": "Unauthorized"
}
```

#### Errores de Validación

**Código de Estado:** `400 Bad Request`

**Campos Requeridos Faltantes:**
```json
{
  "message": [
    "current-password-required",
    "new-password-required", 
    "confirm-password-required"
  ]
}
```

**Violaciones de Fortaleza de Contraseña:**
```json
{
  "message": [
    "new-password-too-short",
    "new-password-too-weak (needs uppercase, number, symbol)",
    "new-password-invalid-characters"
  ]
}
```

**Errores de Lógica de Contraseña:**
```json
{
  "message": "passwords-do-not-match"
}
```

```json
{
  "message": "new-password-must-be-different"
}
```

## Ejemplos de Uso

### Usando cURL

```bash
curl -X PUT http://localhost:3000/auth/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "ContraseñaAnterior123!",
    "newPassword": "NuevaSegura456@",
    "confirmPassword": "NuevaSegura456@"
  }'
```

### Usando JavaScript (fetch)

```javascript
const cambiarContraseña = async (contraseñaActual, nuevaContraseña, confirmarContraseña) => {
  try {
    const response = await fetch('/auth/change-password', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword: contraseñaActual,
        newPassword: nuevaContraseña,
        confirmPassword: confirmarContraseña
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    console.log('Contraseña cambiada exitosamente:', result.message);
    return result;
  } catch (error) {
    console.error('Error al cambiar contraseña:', error.message);
    throw error;
  }
};

// Ejemplo de uso
cambiarContraseña('ContraseñaAnterior123!', 'NuevaSegura456@', 'NuevaSegura456@')
  .then(() => {
    alert('¡Contraseña cambiada exitosamente! Por favor, inicia sesión nuevamente.');
    // Redirigir a login o refrescar tokens
  })
  .catch(error => {
    alert('Error al cambiar contraseña: ' + error.message);
  });
```

### Usando Axios

```javascript
import axios from 'axios';

const cambiarContraseña = async (contraseñas) => {
  try {
    const response = await axios.put('/auth/change-password', contraseñas, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(Array.isArray(error.response.data.message) 
        ? error.response.data.message.join(', ')
        : error.response.data.message
      );
    }
    throw error;
  }
};
```

## Guías de Integración Frontend

### Validación de Formulario

Implementa validación del lado del cliente para coincidir con los requisitos del servidor:

```javascript
const validarContraseña = (contraseña) => {
  const errores = [];
  
  if (contraseña.length < 8) {
    errores.push('La contraseña debe tener al menos 8 caracteres de longitud');
  }
  
  if (contraseña.length > 64) {
    errores.push('La contraseña no debe tener más de 64 caracteres de longitud');
  }
  
  if (!/[A-Z]/.test(contraseña)) {
    errores.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  if (!/\d/.test(contraseña)) {
    errores.push('La contraseña debe contener al menos un número');
  }
  
  if (!/[@$!%*?&.]/.test(contraseña)) {
    errores.push('La contraseña debe contener al menos un carácter especial (@$!%*?&.)');
  }
  
  if (!/^[A-Za-zñÑ\d@$!%*?&.]+$/.test(contraseña)) {
    errores.push('La contraseña contiene caracteres no válidos');
  }
  
  return errores;
};

const validarCambioContraseña = (contraseñaActual, nuevaContraseña, confirmarContraseña) => {
  const errores = [];
  
  if (!contraseñaActual) {
    errores.push('Se requiere la contraseña actual');
  }
  
  if (!nuevaContraseña) {
    errores.push('Se requiere la nueva contraseña');
  }
  
  if (!confirmarContraseña) {
    errores.push('Se requiere la confirmación de contraseña');
  }
  
  if (nuevaContraseña && confirmarContraseña && nuevaContraseña !== confirmarContraseña) {
    errores.push('Las contraseñas no coinciden');
  }
  
  if (contraseñaActual && nuevaContraseña && contraseñaActual === nuevaContraseña) {
    errores.push('La nueva contraseña debe ser diferente de la actual');
  }
  
  if (nuevaContraseña) {
    errores.push(...validarContraseña(nuevaContraseña));
  }
  
  return errores;
};
```

### Componente React de Ejemplo

```jsx
import React, { useState } from 'react';

const CambiarContraseñaForm = () => {
  const [formulario, setFormulario] = useState({
    contraseñaActual: '',
    nuevaContraseña: '',
    confirmarContraseña: ''
  });
  
  const [errores, setErrores] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormulario(prev => ({ ...prev, [name]: value }));
    
    // Limpiar errores al escribir
    if (errores.length > 0) {
      setErrores([]);
    }
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    
    // Validación del lado del cliente
    const erroresValidacion = validarCambioContraseña(
      formulario.contraseñaActual,
      formulario.nuevaContraseña,
      formulario.confirmarContraseña
    );
    
    if (erroresValidacion.length > 0) {
      setErrores(erroresValidacion);
      return;
    }

    setCargando(true);
    setErrores([]);

    try {
      await cambiarContraseña(
        formulario.contraseñaActual,
        formulario.nuevaContraseña,
        formulario.confirmarContraseña
      );
      
      setExito(true);
      setFormulario({
        contraseñaActual: '',
        nuevaContraseña: '',
        confirmarContraseña: ''
      });
      
      // Opcional: Cerrar sesión después del cambio exitoso
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
    } catch (error) {
      setErrores([error.message]);
    } finally {
      setCargando(false);
    }
  };

  if (exito) {
    return (
      <div className="alert alert-success">
        <h4>¡Contraseña cambiada exitosamente!</h4>
        <p>Serás redirigido a la página de inicio de sesión...</p>
      </div>
    );
  }

  return (
    <form onSubmit={manejarEnvio} className="change-password-form">
      <h2>Cambiar Contraseña</h2>
      
      {errores.length > 0 && (
        <div className="alert alert-danger">
          <ul>
            {errores.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="contraseñaActual">Contraseña Actual:</label>
        <input
          type="password"
          id="contraseñaActual"
          name="contraseñaActual"
          value={formulario.contraseñaActual}
          onChange={manejarCambio}
          required
          disabled={cargando}
        />
      </div>

      <div className="form-group">
        <label htmlFor="nuevaContraseña">Nueva Contraseña:</label>
        <input
          type="password"
          id="nuevaContraseña"
          name="nuevaContraseña"
          value={formulario.nuevaContraseña}
          onChange={manejarCambio}
          required
          disabled={cargando}
        />
        <small className="form-text text-muted">
          Debe tener al menos 8 caracteres con mayúscula, número y símbolo
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="confirmarContraseña">Confirmar Nueva Contraseña:</label>
        <input
          type="password"
          id="confirmarContraseña"
          name="confirmarContraseña"
          value={formulario.confirmarContraseña}
          onChange={manejarCambio}
          required
          disabled={cargando}
        />
      </div>

      <button 
        type="submit" 
        disabled={cargando}
        className="btn btn-primary"
      >
        {cargando ? 'Cambiando...' : 'Cambiar Contraseña'}
      </button>
    </form>
  );
};

export default CambiarContraseñaForm;
```

### Implementación React Native

```jsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';

const CambiarContraseñaScreen = ({ navigation }) => {
  const [formulario, setFormulario] = useState({
    contraseñaActual: '',
    nuevaContraseña: '',
    confirmarContraseña: ''
  });
  
  const [cargando, setCargando] = useState(false);

  const manejarCambioContraseña = async () => {
    // Validación básica
    if (!formulario.contraseñaActual || !formulario.nuevaContraseña || !formulario.confirmarContraseña) {
      Alert.alert('Error', 'Todos los campos son requeridos');
      return;
    }

    if (formulario.nuevaContraseña !== formulario.confirmarContraseña) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    const erroresContraseña = validarContraseña(formulario.nuevaContraseña);
    if (erroresContraseña.length > 0) {
      Alert.alert('Contraseña débil', erroresContraseña.join('\n'));
      return;
    }

    setCargando(true);

    try {
      await cambiarContraseña(
        formulario.contraseñaActual,
        formulario.nuevaContraseña,
        formulario.confirmarContraseña
      );

      Alert.alert(
        'Éxito', 
        'Contraseña cambiada exitosamente',
        [
          {
            text: 'OK',
            onPress: () => {
              // Limpiar formulario y regresar
              setFormulario({
                contraseñaActual: '',
                nuevaContraseña: '',
                confirmarContraseña: ''
              });
              navigation.goBack();
            }
          }
        ]
      );

    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Cambiar Contraseña
      </Text>

      <TextInput
        placeholder="Contraseña actual"
        secureTextEntry
        value={formulario.contraseñaActual}
        onChangeText={(texto) => setFormulario(prev => ({ ...prev, contraseñaActual: texto }))}
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 10,
          marginBottom: 15,
          borderRadius: 5
        }}
      />

      <TextInput
        placeholder="Nueva contraseña"
        secureTextEntry
        value={formulario.nuevaContraseña}
        onChangeText={(texto) => setFormulario(prev => ({ ...prev, nuevaContraseña: texto }))}
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 10,
          marginBottom: 15,
          borderRadius: 5
        }}
      />

      <TextInput
        placeholder="Confirmar nueva contraseña"
        secureTextEntry
        value={formulario.confirmarContraseña}
        onChangeText={(texto) => setFormulario(prev => ({ ...prev, confirmarContraseña: texto }))}
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 10,
          marginBottom: 20,
          borderRadius: 5
        }}
      />

      <TouchableOpacity
        onPress={manejarCambioContraseña}
        disabled={cargando}
        style={{
          backgroundColor: cargando ? '#ccc' : '#007bff',
          padding: 15,
          borderRadius: 5,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {cargando ? 'Cambiando...' : 'Cambiar Contraseña'}
        </Text>
      </TouchableOpacity>

      <Text style={{ 
        marginTop: 15, 
        fontSize: 12, 
        color: '#666',
        textAlign: 'center'
      }}>
        La contraseña debe tener al menos 8 caracteres con mayúscula, número y símbolo
      </Text>
    </View>
  );
};

export default CambiarContraseñaScreen;
```

## Mejores Prácticas de Seguridad

### Del Lado del Cliente
- **Nunca almacenes contraseñas** en localStorage o variables globales
- **Valida entrada** antes de enviar al servidor
- **Usa HTTPS** para todas las solicitudes de cambio de contraseña
- **Implementa timeouts** para las solicitudes de red
- **Limpia campos de contraseña** después del uso exitoso

### Del Lado del Servidor
- **Hashea las contraseñas** usando bcrypt o similar
- **Rate limiting** para prevenir ataques de fuerza bruta
- **Registra intentos** de cambio de contraseña para auditoría
- **Requiere reautenticación** para cambios sensibles
- **Invalida sesiones** después del cambio de contraseña

### Experiencia de Usuario
- **Proporciona retroalimentación clara** sobre requisitos de contraseña
- **Muestra fortaleza de contraseña** en tiempo real
- **Confirma cambios exitosos** con notificaciones claras
- **Ofrece enlaces** para recuperación de contraseña si se olvida la actual
- **Considera logout automático** después del cambio para mayor seguridad

---

**🔒 Endpoint seguro para gestión de contraseñas con validación completa!** 🚀🔐 