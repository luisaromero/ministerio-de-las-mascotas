const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'mascotas.json');

// Cola simple para evitar condiciones de carrera al escribir el archivo
// (varias requests concurrentes no deben pisarse la escritura entre sí).
let colaEscritura = Promise.resolve();

async function asegurarArchivo() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, '[]', 'utf-8');
  }
}

async function leerMascotas() {
  await asegurarArchivo();
  try {
    const contenido = await fs.readFile(DATA_FILE, 'utf-8');
    const datos = JSON.parse(contenido);
    if (!Array.isArray(datos)) {
      throw new Error('El archivo de datos está corrupto: se esperaba un arreglo.');
    }
    return datos;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error('El archivo de datos está corrupto y no se pudo leer como JSON.');
    }
    throw err;
  }
}

async function escribirMascotas(mascotas) {
  const tarea = colaEscritura.then(async () => {
    await asegurarArchivo();
    await fs.writeFile(DATA_FILE, JSON.stringify(mascotas, null, 2), 'utf-8');
  });
  colaEscritura = tarea.catch(() => {}); // no bloquear futuras escrituras si esta falla
  return tarea;
}

module.exports = { leerMascotas, escribirMascotas, DATA_FILE };
