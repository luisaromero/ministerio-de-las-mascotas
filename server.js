const express = require('express');
const path = require('path');

const cors = require('cors');
const { leerMascotas, escribirMascotas } = require('./db');
const { validarRut } = require('./rut');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

// Envuelve un handler async para que sus errores caigan en el middleware de errores
const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

function normalizarTexto(str) {
  return typeof str === 'string' ? str.trim() : '';
}

// ------------------------------------------------------------------
// GET /mascotas
//   - sin parámetros           -> todas las mascotas
//   - ?nombre=Firulais         -> la mascota con ese nombre
//   - ?rut=12345678-9          -> todas las mascotas de ese dueño
// ------------------------------------------------------------------
app.get(
  '/mascotas',
  asyncHandler(async (req, res) => {
    const { nombre, rut } = req.query;

    if (nombre !== undefined && rut !== undefined) {
      return res.status(400).json({
        error: 'Debe filtrar por "nombre" o por "rut", no por ambos a la vez.',
      });
    }

    const mascotas = await leerMascotas();

    if (nombre !== undefined) {
      const nombreBuscado = normalizarTexto(nombre);
      if (!nombreBuscado) {
        return res.status(400).json({ error: 'El parámetro "nombre" no puede estar vacío.' });
      }
      const encontrada = mascotas.find(
        (m) => m.nombre.toLowerCase() === nombreBuscado.toLowerCase()
      );
      if (!encontrada) {
        return res
          .status(404)
          .json({ error: `No existe una mascota registrada con el nombre "${nombreBuscado}".` });
      }
      return res.json(encontrada);
    }

    if (rut !== undefined) {
      const { valido, normalizado, error } = validarRut(rut);
      if (!valido) {
        return res.status(400).json({ error });
      }
      const resultado = mascotas.filter((m) => m.rut === normalizado);
      return res.json(resultado);
    }

    return res.json(mascotas);
  })
);

// ------------------------------------------------------------------
// POST /mascotas
//   body: { "nombre": "Firulais", "rut": "12345678-9" }
// ------------------------------------------------------------------
app.post(
  '/mascotas',
  asyncHandler(async (req, res) => {
    const nombre = normalizarTexto(req.body?.nombre);
    const rutCrudo = req.body?.rut;

    if (!nombre) {
      return res.status(400).json({ error: 'El campo "nombre" es obligatorio.' });
    }

    const { valido, normalizado, error } = validarRut(rutCrudo);
    if (!valido) {
      return res.status(400).json({ error });
    }

    const mascotas = await leerMascotas();

    const yaExiste = mascotas.some((m) => m.nombre.toLowerCase() === nombre.toLowerCase());
    if (yaExiste) {
      return res
        .status(409)
        .json({ error: `Ya existe una mascota registrada con el nombre "${nombre}".` });
    }

    const nuevaMascota = { nombre, rut: normalizado };
    mascotas.push(nuevaMascota);
    await escribirMascotas(mascotas);

    return res.status(201).json(nuevaMascota);
  })
);

// ------------------------------------------------------------------
// DELETE /mascotas
//   - ?nombre=Firulais   -> elimina esa mascota
//   - ?rut=12345678-9    -> elimina todas las mascotas de ese dueño
// ------------------------------------------------------------------
app.delete(
  '/mascotas',
  asyncHandler(async (req, res) => {
    const { nombre, rut } = req.query;

    if (nombre === undefined && rut === undefined) {
      return res.status(400).json({
        error: 'Debe indicar el parámetro "nombre" o "rut" de la mascota a eliminar.',
      });
    }
    if (nombre !== undefined && rut !== undefined) {
      return res.status(400).json({
        error: 'Debe eliminar por "nombre" o por "rut", no por ambos a la vez.',
      });
    }

    const mascotas = await leerMascotas();

    if (nombre !== undefined) {
      const nombreBuscado = normalizarTexto(nombre);
      if (!nombreBuscado) {
        return res.status(400).json({ error: 'El parámetro "nombre" no puede estar vacío.' });
      }
      const idx = mascotas.findIndex(
        (m) => m.nombre.toLowerCase() === nombreBuscado.toLowerCase()
      );
      if (idx === -1) {
        return res
          .status(404)
          .json({ error: `No existe una mascota registrada con el nombre "${nombreBuscado}".` });
      }
      const [eliminada] = mascotas.splice(idx, 1);
      await escribirMascotas(mascotas);
      return res.json({ mensaje: 'Mascota eliminada correctamente.', mascota: eliminada });
    }

    // eliminar por rut
    const { valido, normalizado, error } = validarRut(rut);
    if (!valido) {
      return res.status(400).json({ error });
    }
    const restantes = mascotas.filter((m) => m.rut !== normalizado);
    const eliminadas = mascotas.length - restantes.length;

    if (eliminadas === 0) {
      return res
        .status(404)
        .json({ error: `No existen mascotas registradas para el RUT "${normalizado}".` });
    }

    await escribirMascotas(restantes);
    return res.json({ mensaje: `Se eliminaron ${eliminadas} mascota(s) correctamente.` });
  })
);

// ------------------------------------------------------------------
// Rutas no encontradas
// ------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// ------------------------------------------------------------------
// Middleware de manejo de errores (siempre al final)
// ------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la solicitud no es un JSON válido.' });
  }

  res.status(500).json({ error: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(`Servicio de Registro Civil de Mascotas escuchando en http://localhost:${PORT}`);
});
