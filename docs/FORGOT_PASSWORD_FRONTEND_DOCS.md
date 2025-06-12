# 🔐 Sistema de Contraseña Olvidada - Guía de Integración Frontend

## 📋 Descripción General
Este documento explica cómo implementar la funcionalidad de **Contraseña Olvidada** en tu aplicación frontend.

## 🎯 Flujo Completo del Usuario
1. Usuario hace clic en enlace "¿Olvidaste tu contraseña?" en página de login
2. Usuario ingresa su dirección de email
3. Sistema envía email de restablecimiento al usuario
4. Usuario hace clic en enlace de restablecimiento en email → va a página de restablecer contraseña
5. Usuario ingresa nueva contraseña y confirma
6. Contraseña se actualiza, usuario puede iniciar sesión con nueva contraseña

---

## 🔗 Endpoints de API

### URL Base: `http://localhost:3000`

### 1. Solicitar Restablecimiento de Contraseña
```http
POST /auth/request-password-reset
Content-Type: application/json

{
  "email": "usuario@ejemplo.com"
}
```

**Respuesta:**
```json
{
  "message": "password-reset-email-sent"
}
```

**Nota:** Siempre retorna éxito (incluso si el email no existe) por seguridad.

### 2. Restablecer Contraseña
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "abc123def456...",
  "newPassword": "nuevaContraseñaSegura123"
}
```

**Respuesta de Éxito:**
```json
{
  "message": "password-reset-successful"
}
```

**Respuesta de Error:**
```json
{
  "message": "invalid-or-expired-token",
  "statusCode": 400
}
```

### 3. Verificar Token (Opcional)
```http
GET /auth/verify-reset-token/abc123def456...
```

**Respuesta de Éxito:**
```json
{
  "message": "token-valid",
  "email": "usuario@ejemplo.com"
}
```

---

## 🖥️ Implementación Frontend

### Página 1: Solicitud de Contraseña Olvidada

**Ruta:** `/forgot-password`

**Estructura HTML:**
```html
<div class="forgot-password-container">
  <h2>¿Olvidaste tu Contraseña?</h2>
  <p>Ingresa tu dirección de email y te enviaremos un enlace de restablecimiento.</p>
  
  <form id="forgotPasswordForm">
    <div class="form-group">
      <label for="email">Dirección de Email</label>
      <input 
        type="email" 
        id="email" 
        name="email" 
        required 
        placeholder="Ingresa tu email"
      >
    </div>
    
    <button type="submit" id="submitBtn">
      Enviar Enlace de Restablecimiento
    </button>
    
    <div id="message" class="message hidden"></div>
  </form>
  
  <a href="/login">← Volver al Login</a>
</div>
```

**JavaScript:**
```javascript
document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const submitBtn = document.getElementById('submitBtn');
  const messageDiv = document.getElementById('message');
  
  // Mostrar estado de carga
  submitBtn.textContent = 'Enviando...';
  submitBtn.disabled = true;
  messageDiv.className = 'message hidden';
  
  try {
    const response = await fetch('/auth/request-password-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      messageDiv.textContent = '¡Enlace de restablecimiento enviado! Revisa tu email.';
      messageDiv.className = 'message success';
      document.getElementById('email').value = '';
    } else {
      throw new Error(data.message || 'Algo salió mal');
    }
    
  } catch (error) {
    messageDiv.textContent = 'Error: ' + error.message;
    messageDiv.className = 'message error';
  } finally {
    submitBtn.textContent = 'Enviar Enlace de Restablecimiento';
    submitBtn.disabled = false;
  }
});
```

---

### Página 2: Restablecer Contraseña

**Ruta:** `/reset-password`

**Estructura HTML:**
```html
<div class="reset-password-container">
  <h2>Restablece tu Contraseña</h2>
  <p>Ingresa tu nueva contraseña a continuación.</p>
  
  <form id="resetPasswordForm">
    <div class="form-group">
      <label for="newPassword">Nueva Contraseña</label>
      <input 
        type="password" 
        id="newPassword" 
        name="newPassword" 
        required 
        minlength="6"
        placeholder="Ingresa nueva contraseña"
      >
    </div>
    
    <div class="form-group">
      <label for="confirmPassword">Confirmar Contraseña</label>
      <input 
        type="password" 
        id="confirmPassword" 
        name="confirmPassword" 
        required 
        minlength="6"
        placeholder="Confirma nueva contraseña"
      >
    </div>
    
    <button type="submit" id="resetBtn">
      Restablecer Contraseña
    </button>
    
    <div id="message" class="message hidden"></div>
  </form>
  
  <a href="/login">← Volver al Login</a>
</div>
```

**JavaScript:**
```javascript
// Obtener token de URL cuando se carga la página
const urlParams = new URLSearchParams(window.location.search);
const resetToken = urlParams.get('token');

// Verificar si existe el token
if (!resetToken) {
  document.getElementById('message').textContent = 'Enlace de restablecimiento inválido.';
  document.getElementById('message').className = 'message error';
  document.getElementById('resetPasswordForm').style.display = 'none';
}

// Opcional: Verificar token al cargar página
async function verificarToken() {
  if (!resetToken) return;
  
  try {
    const response = await fetch(`/auth/verify-reset-token/${resetToken}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error('Enlace de restablecimiento inválido o expirado');
    }
    
    // Opcionalmente mostrar email del usuario
    console.log('Restableciendo contraseña para:', data.email);
    
  } catch (error) {
    document.getElementById('message').textContent = error.message;
    document.getElementById('message').className = 'message error';
    document.getElementById('resetPasswordForm').style.display = 'none';
  }
}

// Llamar función de verificación al cargar página
verificarToken();

// Manejar envío del formulario
document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const resetBtn = document.getElementById('resetBtn');
  const messageDiv = document.getElementById('message');
  
  // Validar que las contraseñas coincidan
  if (newPassword !== confirmPassword) {
    messageDiv.textContent = 'Las contraseñas no coinciden';
    messageDiv.className = 'message error';
    return;
  }
  
  // Mostrar estado de carga
  resetBtn.textContent = 'Restableciendo...';
  resetBtn.disabled = true;
  messageDiv.className = 'message hidden';
  
  try {
    const response = await fetch('/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: resetToken,
        newPassword: newPassword
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      messageDiv.textContent = '¡Contraseña restablecida exitosamente! Redirigiendo al login...';
      messageDiv.className = 'message success';
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
    } else {
      throw new Error(data.message || 'Error al restablecer contraseña');
    }
    
  } catch (error) {
    let errorMessage = 'Error al restablecer contraseña';
    
    if (error.message === 'invalid-or-expired-token') {
      errorMessage = 'El enlace ha expirado o es inválido';
    } else if (error.message.includes('password')) {
      errorMessage = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    messageDiv.textContent = errorMessage;
    messageDiv.className = 'message error';
  } finally {
    resetBtn.textContent = 'Restablecer Contraseña';
    resetBtn.disabled = false;
  }
});
```

---

## 📱 Implementación React Native

### Pantalla de Contraseña Olvidada
```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';

const PantallaContraseñaOlvidada = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);

  const solicitarRestablecimiento = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu email');
      return;
    }

    setCargando(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Email Enviado',
          'Te hemos enviado un enlace de restablecimiento. Revisa tu email.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        throw new Error(data.message || 'Error al enviar email');
      }

    } catch (error) {
      Alert.alert('Error', 'Error al enviar email de restablecimiento');
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>¿Olvidaste tu Contraseña?</Text>
      <Text style={styles.descripcion}>
        Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={[styles.boton, cargando && styles.botonDeshabilitado]}
        onPress={solicitarRestablecimiento}
        disabled={cargando}
      >
        <Text style={styles.textoBoton}>
          {cargando ? 'Enviando...' : 'Enviar Enlace'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.enlaceVolver}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.textoEnlace}>← Volver al Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10
  },
  descripcion: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20
  },
  boton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20
  },
  botonDeshabilitado: {
    backgroundColor: '#ccc'
  },
  textoBoton: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  enlaceVolver: {
    alignItems: 'center'
  },
  textoEnlace: {
    color: '#007AFF',
    fontSize: 16
  }
});

export default PantallaContraseñaOlvidada;
```

### Pantalla de Restablecer Contraseña
```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';

const PantallaRestablecerContraseña = ({ route, navigation }) => {
  const [nuevaContraseña, setNuevaContraseña] = useState('');
  const [confirmarContraseña, setConfirmarContraseña] = useState('');
  const [cargando, setCargando] = useState(false);
  const [tokenValido, setTokenValido] = useState(true);
  
  const { token } = route.params; // Token pasado desde deep link

  useEffect(() => {
    verificarToken();
  }, []);

  const verificarToken = async () => {
    if (!token) {
      setTokenValido(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-reset-token/${token}`);
      
      if (!response.ok) {
        setTokenValido(false);
      }
    } catch (error) {
      setTokenValido(false);
    }
  };

  const restablecerContraseña = async () => {
    if (!nuevaContraseña.trim()) {
      Alert.alert('Error', 'Por favor ingresa una nueva contraseña');
      return;
    }

    if (nuevaContraseña.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (nuevaContraseña !== confirmarContraseña) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setCargando(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          newPassword: nuevaContraseña
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Éxito',
          'Tu contraseña ha sido restablecida exitosamente',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        let errorMessage = 'Error al restablecer contraseña';
        
        if (data.message === 'invalid-or-expired-token') {
          errorMessage = 'El enlace ha expirado o es inválido';
        }
        
        Alert.alert('Error', errorMessage);
      }

    } catch (error) {
      Alert.alert('Error', 'Error de conexión. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  if (!tokenValido) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Enlace Inválido</Text>
        <Text style={styles.descripcion}>
          Este enlace de restablecimiento ha expirado o es inválido.
        </Text>
        <TouchableOpacity
          style={styles.boton}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.textoBoton}>Solicitar Nuevo Enlace</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Restablecer Contraseña</Text>
      <Text style={styles.descripcion}>
        Ingresa tu nueva contraseña a continuación.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nueva Contraseña"
        value={nuevaContraseña}
        onChangeText={setNuevaContraseña}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirmar Nueva Contraseña"
        value={confirmarContraseña}
        onChangeText={setConfirmarContraseña}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={[styles.boton, cargando && styles.botonDeshabilitado]}
        onPress={restablecerContraseña}
        disabled={cargando}
      >
        <Text style={styles.textoBoton}>
          {cargando ? 'Restableciendo...' : 'Restablecer Contraseña'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.enlaceVolver}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.textoEnlace}>← Volver al Login</Text>
      </TouchableOpacity>
    </View>
  );
};

// Usar los mismos estilos que la pantalla anterior
export default PantallaRestablecerContraseña;
```

---

## 🔗 Configuración de Deep Links

### React Native - Configuración de Deep Links
```javascript
// En tu App.js o navegación principal
import { Linking } from 'react-native';

const App = () => {
  useEffect(() => {
    // Manejar deep links cuando la app está cerrada
    Linking.getInitialURL().then(url => {
      if (url) {
        manejarDeepLink(url);
      }
    });

    // Manejar deep links cuando la app está abierta
    const subscription = Linking.addEventListener('url', ({ url }) => {
      manejarDeepLink(url);
    });

    return () => subscription?.remove();
  }, []);

  const manejarDeepLink = (url) => {
    if (url.includes('/reset-password')) {
      const token = extraerTokenDeURL(url);
      if (token) {
        // Navegar a pantalla de restablecer contraseña
        navigation.navigate('ResetPassword', { token });
      }
    }
  };

  const extraerTokenDeURL = (url) => {
    const match = url.match(/token=([^&]+)/);
    return match ? match[1] : null;
  };

  // ... resto de tu app
};
```

### Configuración de URL Scheme (iOS)
```xml
<!-- En ios/YourApp/Info.plist -->
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.tuapp.reset-password</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>tuapp</string>
    </array>
  </dict>
</array>
```

### Configuración de Intent Filter (Android)
```xml
<!-- En android/app/src/main/AndroidManifest.xml -->
<activity
  android:name=".MainActivity"
  android:exported="true"
  android:launchMode="singleTop">
  
  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="tuapp" />
  </intent-filter>
  
</activity>
```

---

## 🎨 Estilos CSS (Web)

```css
.forgot-password-container,
.reset-password-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 30px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #007AFF;
  box-shadow: 0 0 5px rgba(0,122,255,0.3);
}

button {
  width: 100%;
  padding: 12px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
}

button:hover {
  background: #0056CC;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.message {
  padding: 10px;
  border-radius: 4px;
  margin-top: 15px;
  text-align: center;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message.hidden {
  display: none;
}

a {
  display: block;
  text-align: center;
  margin-top: 20px;
  color: #007AFF;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
```

---

## 🔒 Consideraciones de Seguridad

### Validación Frontend
- ✅ **Validación de Email**: Formato de email válido
- ✅ **Longitud de Contraseña**: Mínimo 6 caracteres
- ✅ **Confirmación de Contraseña**: Debe coincidir
- ✅ **Sanitización de Entrada**: Prevenir XSS

### Manejo de Errores
- ✅ **Mensajes Genéricos**: No revelar si el email existe
- ✅ **Tokens Expirados**: Manejar apropiadamente
- ✅ **Rate Limiting**: Respetar límites del servidor
- ✅ **Validación de Token**: Verificar antes de mostrar formulario

### Experiencia de Usuario
- ✅ **Estados de Carga**: Mostrar progreso al usuario
- ✅ **Mensajes Claros**: Instrucciones fáciles de seguir
- ✅ **Navegación Intuitiva**: Enlaces de regreso claros
- ✅ **Responsive Design**: Funciona en todos los dispositivos

---

## 🧪 Pruebas

### Casos de Prueba
1. **Email Válido**: Verificar que se envía email
2. **Email Inválido**: Verificar manejo de errores
3. **Token Válido**: Verificar restablecimiento exitoso
4. **Token Expirado**: Verificar manejo de error
5. **Contraseñas No Coinciden**: Verificar validación
6. **Deep Links**: Verificar navegación correcta

### Ejemplo de Prueba (Jest)
```javascript
describe('Contraseña Olvidada', () => {
  test('debe enviar email de restablecimiento', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'password-reset-email-sent' })
    });
    global.fetch = mockFetch;

    // Simular envío de formulario
    const email = 'test@ejemplo.com';
    
    // Tu lógica de prueba aquí
    expect(mockFetch).toHaveBeenCalledWith('/auth/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
  });
});
```

---

*¡Tu sistema de contraseña olvidada está completo y listo para producción!* 🔐✨ 