# Registro Civil de Mascotas — Chile

Sistema de registro de mascotas: backend REST en Node.js/Express que persiste
los datos en un archivo JSON, y un frontend que lo consume con Axios.

## Estructura

## Objetivos de la aplicación

Este proyecto implementa un sistema de **Registro Civil de Mascotas** para
un hipotético Ministerio de las Mascotas del gobierno de Chile. Sus
objetivos son:

- Permitir el registro (inscripción) de mascotas asociadas al RUT de su
  dueño/a, persistiendo la información en un archivo JSON.
- Exponer un servicio web (API REST) que permita consultar todas las
  mascotas registradas, buscar por nombre de la mascota o por RUT del
  dueño/a, e insertar o eliminar registros.
- Validar y normalizar el RUT chileno (formato y dígito verificador) para
  garantizar la integridad de los datos.
- Ofrecer un frontend funcional que consuma dicho servicio mediante Axios,
  con una capa de manejo de errores adecuada tanto en el cliente como en
  el servidor.

```
mascotas-app/
├── data/
│   └── mascotas.json     # "base de datos" (se crea sola si no existe)
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── app.js         # llamadas Axios + manejo de errores
│   └── index.html
├── package.json
├── rut.js                  # validación y normalización de RUT chileno
├── db.js                   # lectura/escritura del archivo JSON
└── server.js                # rutas, servidor Express y archivos estáticos
```

Todo vive ahora en un solo proyecto: `server.js` expone el API **y** sirve
los archivos de `public/` (HTML, CSS, JS), así que basta con levantar el
backend para tener todo funcionando.

> Si `server.js` aún no sirve la carpeta `public`, agrega esto junto a los
> demás `app.use(...)`:
>
> ```js
> const path = require("path");
> app.use(express.static(path.join(__dirname, "public")));
> ```

## 1. Instalar dependencias

```bash
npm install
```

## 2. Levantar el servidor

```bash
npm start
```

Esto ejecuta `node server.js`. El servidor queda escuchando en
`http://localhost:3000`.

### Modo desarrollo (con recarga automática)

```bash
npm run dev
```

Esto ejecuta `nodemon server.js`, que reinicia el servidor automáticamente
cada vez que guardas un cambio en `server.js`, `db.js`, `rut.js` o en los
archivos de `public/`.

## 3. Abrir el frontend

Con el servidor corriendo, abre en el navegador:

```
http://localhost:3000
```

Express sirve `public/index.html` junto con `public/css/styles.css` y
`public/js/app.js`. El frontend está configurado para apuntar al mismo
origen (`http://localhost:3000`) en la constante `API_BASE_URL` de
`public/js/app.js`.

## 4. Endpoints del API

| Método | Ruta                        | Descripción                                          |
| ------ | --------------------------- | ---------------------------------------------------- |
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

## 5. Manejo de errores

- **Backend**: cada ruta valida sus parámetros (nombre vacío, RUT con
  formato o dígito verificador inválido, mascota duplicada, etc.) y
  responde con el código HTTP correspondiente (`400`, `404`, `409`) y un
  cuerpo `{ "error": "mensaje" }`. Un middleware final captura cualquier
  error no controlado y responde `500`.
- **Frontend**: todas las llamadas Axios pasan por `extraerMensajeError()`
  en `public/js/app.js`, que distingue entre error de respuesta del
  servidor, error de red (servidor caído / CORS) y timeout, y muestra el
  mensaje correspondiente en un banner. Los formularios además validan
  campos vacíos antes de llamar al API.

  ## Autor/a

- **Nombre:** _[ Luisa Romero ]_

## Repositorio

- **URL:** _[[repo](https://github.com/luisaromero/ministerio-de-las-mascotas)]_
