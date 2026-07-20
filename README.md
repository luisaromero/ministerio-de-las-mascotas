# Registro Civil de Mascotas — Chile

Sistema de registro de mascotas: backend REST en Node.js/Express que persiste
los datos en un archivo JSON, y un frontend que lo consume con Axios.

## Estructura

```
mascotas-app/
├── backend/
│   ├── server.js      # rutas y servidor Express
│   ├── db.js           # lectura/escritura del archivo JSON
│   ├── rut.js           # validación y normalización de RUT chileno
│   ├── data/mascotas.json  # "base de datos" (se crea sola si no existe)
│   └── package.json
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js           # llamadas Axios + manejo de errores
```

## 1. Levantar el backend

```bash
cd backend
npm install
npm start
```

El servidor queda escuchando en `http://localhost:3000`.

## 2. Abrir el frontend

El frontend es HTML/CSS/JS plano (sin build), así que basta con abrir
`frontend/index.html` en el navegador, o servirlo con cualquier servidor
estático, por ejemplo:

```bash
cd frontend
npx serve .
```

El frontend está configurado para apuntar a `http://localhost:3000`
(constante `API_BASE_URL` en `app.js`).

## 3. Endpoints del API

| Método | Ruta                        | Descripción                                         |
|--------|-----------------------------|------------------------------------------------------|
| GET    | `/mascotas`                 | Retorna todas las mascotas con su dueño              |
| GET    | `/mascotas?nombre=Firulais` | Retorna la mascota con ese nombre y el rut del dueño |
| GET    | `/mascotas?rut=12345678-5`  | Retorna todas las mascotas asociadas a ese rut       |
| POST   | `/mascotas`                 | Inserta una mascota. Body: `{ "nombre", "rut" }`     |
| DELETE | `/mascotas?nombre=Firulais` | Elimina la mascota con ese nombre, si existe         |
| DELETE | `/mascotas?rut=12345678-5`  | Elimina todas las mascotas asociadas a ese rut       |

Los RUT se validan (formato y dígito verificador) y se normalizan
internamente al formato `12345678-5` antes de guardarse o compararse,
por lo que `12.345.678-5`, `12345678-5` y `12345678-5` se tratan como
el mismo RUT.

### Ejemplos con curl

```bash
curl -X POST http://localhost:3000/mascotas \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Firulais","rut":"12.345.678-5"}'

curl "http://localhost:3000/mascotas?nombre=Firulais"

curl "http://localhost:3000/mascotas?rut=12345678-5"

curl -X DELETE "http://localhost:3000/mascotas?nombre=Firulais"

curl -X DELETE "http://localhost:3000/mascotas?rut=12345678-5"
```

## 4. Manejo de errores

- **Backend**: cada ruta valida sus parámetros (nombre vacío, RUT con
  formato o dígito verificador inválido, mascota duplicada, etc.) y
  responde con el código HTTP correspondiente (`400`, `404`, `409`) y un
  cuerpo `{ "error": "mensaje" }`. Un middleware final captura cualquier
  error no controlado y responde `500`.
- **Frontend**: todas las llamadas Axios pasan por `extraerMensajeError()`,
  que distingue entre error de respuesta del servidor, error de red
  (servidor caído / CORS) y timeout, y muestra el mensaje correspondiente
  en un banner. Los formularios además validan campos vacíos antes de
  llamar al API.
