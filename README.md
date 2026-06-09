# 🌍 WANDERLUST — Agencia de Viajes
## Guía completa para levantar en localhost y publicar en servidor real

---

## ✅ PASO 1 — Instalar Node.js (solo la primera vez)

1. Ir a https://nodejs.org
2. Descargar la versión **LTS** (botón verde grande)
3. Instalar con todas las opciones por defecto
4. Abrir la terminal / CMD y verificar:
   ```
   node --version
   npm --version
   ```
   Tiene que mostrar números de versión (ej: v20.x.x)

---

## ✅ PASO 2 — Instalar dependencias del proyecto

1. Abrir terminal en la carpeta `wanderlust/`
   - **Windows:** click derecho en la carpeta → "Abrir en terminal"
   - **Mac:** arrastrar la carpeta al terminal
2. Ejecutar:
   ```
   npm install
   ```
   Esto instala Express, SQLite y CORS (puede tardar 1 minuto)

---

## ✅ PASO 3 — Levantar el servidor local

```
node server.js
```

Vas a ver en la terminal:

```
🌍 WANDERLUST — Servidor corriendo
   Sitio web:  http://localhost:3000
   Dashboard:  http://localhost:3000/dashboard
   API Stats:  http://localhost:3000/api/stats
```

---

## ✅ PASO 4 — Abrir en el navegador

| URL | Qué es |
|-----|--------|
| http://localhost:3000 | Sitio web completo |
| http://localhost:3000/dashboard | Dashboard estadísticas |
| http://localhost:3000/api/stats | API JSON raw |
| http://localhost:3000/api/variante | Thompson Sampling |
| http://localhost:3000/api/leads | Lista de leads |

---

## 🧪 Para la demo en clase

### Simular visitas con diferentes UTM:
Abrir estas URLs para generar datos en el dashboard:

```
http://localhost:3000/?utm_source=instagram&utm_medium=cpc&utm_campaign=verano2025
http://localhost:3000/?utm_source=google&utm_medium=sem&utm_campaign=escapadas
http://localhost:3000/?utm_source=facebook&utm_medium=social&utm_campaign=promo
```

### Reiniciar datos para demo limpia:
Ir al dashboard → botón **"↺ Reset demo"** (esquina superior derecha)

---

## 📡 ENDPOINTS DE LA API

### GET /api/variante
Selecciona y devuelve la variante ganadora según Thompson Sampling.
```json
{ "variante": "B" }
```

### POST /api/conversion
Registra una conversión.
```json
Body: { "variante": "B", "utm_source": "instagram", "utm_campaign": "verano2025" }
```

### POST /api/lead
Guarda un lead del formulario de contacto.
```json
Body: {
  "nombre": "Juan Pérez",
  "email": "juan@email.com",
  "destino": "Patagonia",
  "mensaje": "Quiero info",
  "variante": "B",
  "utm_source": "instagram"
}
```

### GET /api/stats
Devuelve todas las estadísticas para el dashboard.

### GET /api/leads
Lista todos los leads guardados.

### POST /api/reset
Reinicia la base de datos (para demos).

---

## 🌐 PUBLICAR EN SERVIDOR REAL

### Opción 1 — Railway (GRATIS, recomendado)
1. Crear cuenta en https://railway.app
2. Instalar Railway CLI: `npm install -g @railway/cli`
3. En la carpeta del proyecto:
   ```
   railway login
   railway init
   railway up
   ```
4. Railway genera una URL pública automáticamente.

### Opción 2 — Render (GRATIS)
1. Subir el proyecto a GitHub
2. Crear cuenta en https://render.com
3. New → Web Service → conectar repositorio
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Render da una URL pública.

### Opción 3 — VPS (DigitalOcean / Hostinger / cPanel)
1. Subir los archivos por FTP o SSH
2. Instalar Node.js en el servidor
3. Usar **PM2** para que corra permanentemente:
   ```
   npm install -g pm2
   pm2 start server.js --name wanderlust
   pm2 save
   pm2 startup
   ```
4. Configurar Nginx como reverse proxy apuntando al puerto 3000.

---

## 📁 ESTRUCTURA DEL PROYECTO

```
wanderlust/
│
├── server.js          ← Servidor Express + API + Thompson Sampling
├── package.json       ← Dependencias Node.js
│
├── public/
│   ├── index.html     ← Sitio web Wanderlust (con TS integrado)
│   └── dashboard.html ← Dashboard estadísticas en tiempo real
│
└── db/
    └── wanderlust.db  ← Base de datos SQLite (se crea automático)
```

---

## 🔍 ¿QUÉ ES THOMPSON SAMPLING?

Es un algoritmo de **Multi-Armed Bandit** que:
1. Arranca con 3 variantes (A, B, C) sin saber cuál es mejor
2. Cada visita **samplea** de la distribución Beta(α, β) de cada variante
3. Muestra la variante con el sample más alto
4. Si convierte → α++ (éxito), si no → β++ (fracaso)
5. Con el tiempo, dirige más tráfico automáticamente a la variante que más convierte

**Ventaja vs A/B testing clásico:** no desperdicia tráfico en variantes malas.
El algoritmo **aprende y optimiza en tiempo real**.

---

## ❓ PROBLEMAS COMUNES

**"Cannot find module 'better-sqlite3'"**
→ Correr `npm install` en la carpeta del proyecto

**"Port 3000 already in use"**
→ Cambiar `const PORT = 3000` por `3001` en server.js

**La base de datos no se crea**
→ Verificar que existe la carpeta `db/` dentro del proyecto

---

*Wanderlust — Trabajo práctico · Thompson Sampling A/B/C Testing*
