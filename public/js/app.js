// =====================================================================
// Registro Civil de Mascotas — Frontend
// Consume el servicio REST del backend (Express) usando Axios.
// =====================================================================

const API_BASE_URL = window.location.origin;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
});

// ---------------------------------------------------------------------
// Capa centralizada de manejo de errores
// ---------------------------------------------------------------------
// Convierte cualquier error de Axios (de red, de timeout, o de respuesta
// HTTP con código de error) en un mensaje legible para el usuario.
function extraerMensajeError(error) {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // El servidor respondió con un código de error (4xx / 5xx)
      const data = error.response.data;
      const mensajeServidor = data && typeof data === 'object' ? data.error : null;
      return mensajeServidor || `El servidor respondió con el código ${error.response.status}.`;
    }
    if (error.request) {
      // La solicitud se hizo pero no hubo respuesta (servidor caído, CORS, red)
      return 'No fue posible contactar al servicio de Registro Civil de Mascotas. Verifique que el servidor esté encendido en ' + API_BASE_URL + '.';
    }
    if (error.code === 'ECONNABORTED') {
      return 'La solicitud demoró demasiado y fue cancelada. Intente nuevamente.';
    }
  }
  return 'Ocurrió un error inesperado. Intente nuevamente.';
}

// ---------------------------------------------------------------------
// Referencias al DOM
// ---------------------------------------------------------------------
const el = {
  banner: document.getElementById('banner'),
  folioCount: document.getElementById('folioCount'),
  apiBaseLabel: document.getElementById('apiBaseLabel'),

  formInscribir: document.getElementById('formInscribir'),
  inputNombre: document.getElementById('inputNombre'),
  inputRut: document.getElementById('inputRut'),
  errNombre: document.getElementById('errNombre'),
  errRut: document.getElementById('errRut'),

  formBuscar: document.getElementById('formBuscar'),
  filtroTipo: document.getElementById('filtroTipo'),
  inputBusqueda: document.getElementById('inputBusqueda'),

  tbodyMascotas: document.getElementById('tbodyMascotas'),
  listaEstado: document.getElementById('listaEstado'),

  formEliminarRut: document.getElementById('formEliminarRut'),
  inputRutEliminar: document.getElementById('inputRutEliminar'),
};

el.apiBaseLabel.textContent = API_BASE_URL;

// ---------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------
function mostrarBanner(mensaje, tipo = 'info') {
  el.banner.textContent = mensaje;
  el.banner.className = `banner is-${tipo}`;
  el.banner.hidden = false;
}

function ocultarBanner() {
  el.banner.hidden = true;
}

function setListaEstado(mensaje) {
  if (!mensaje) {
    el.listaEstado.hidden = true;
    return;
  }
  el.listaEstado.hidden = false;
  el.listaEstado.textContent = mensaje;
}

function renderTabla(mascotas) {
  el.tbodyMascotas.innerHTML = '';

  if (!mascotas || mascotas.length === 0) {
    setListaEstado('No hay mascotas registradas para este criterio.');
    el.folioCount.textContent = '— inscripciones';
    return;
  }

  setListaEstado(null);
  el.folioCount.textContent = `${mascotas.length} inscripción(es)`;

  for (const mascota of mascotas) {
    const tr = document.createElement('tr');

    const tdNombre = document.createElement('td');
    tdNombre.textContent = mascota.nombre;

    const tdRut = document.createElement('td');
    tdRut.textContent = mascota.rut;

    const tdAccion = document.createElement('td');
    tdAccion.className = 'col-acciones';
    const btn = document.createElement('button');
    btn.className = 'btn-eliminar';
    btn.textContent = 'Eliminar';
    btn.addEventListener('click', () => eliminarPorNombre(mascota.nombre));
    tdAccion.appendChild(btn);

    tr.append(tdNombre, tdRut, tdAccion);
    el.tbodyMascotas.appendChild(tr);
  }
}

function limpiarErroresFormulario() {
  el.errNombre.textContent = '';
  el.errRut.textContent = '';
}

// ---------------------------------------------------------------------
// Llamadas al API
// ---------------------------------------------------------------------
async function cargarTodas() {
  ocultarBanner();
  setListaEstado('Cargando registro…');
  try {
    const { data } = await api.get('/mascotas');
    renderTabla(data);
  } catch (error) {
    setListaEstado(null);
    mostrarBanner(extraerMensajeError(error), 'error');
    renderTabla([]);
  }
}

async function buscar(tipo, valor) {
  ocultarBanner();
  setListaEstado('Consultando…');
  try {
    if (tipo === 'todas') {
      const { data } = await api.get('/mascotas');
      renderTabla(data);
      return;
    }

    const { data } = await api.get('/mascotas', { params: { [tipo]: valor } });
    // GET por nombre devuelve un objeto único; normalizamos a arreglo para la tabla
    const lista = Array.isArray(data) ? data : [data];
    renderTabla(lista);
  } catch (error) {
    setListaEstado(null);
    if (error.response && error.response.status === 404) {
      // Búsqueda sin resultados: no es un error del sistema, se informa en la tabla
      renderTabla([]);
      mostrarBanner(extraerMensajeError(error), 'info');
    } else {
      mostrarBanner(extraerMensajeError(error), 'error');
      renderTabla([]);
    }
  }
}

async function inscribirMascota(nombre, rut) {
  ocultarBanner();
  try {
    await api.post('/mascotas', { nombre, rut });
    mostrarBanner(`Mascota "${nombre}" inscrita correctamente.`, 'success');
    el.formInscribir.reset();
    await cargarTodas();
  } catch (error) {
    mostrarBanner(extraerMensajeError(error), 'error');
  }
}

async function eliminarPorNombre(nombre) {
  ocultarBanner();
  const confirmado = window.confirm(`¿Eliminar la inscripción de "${nombre}"? Esta acción no se puede deshacer.`);
  if (!confirmado) return;

  try {
    await api.delete('/mascotas', { params: { nombre } });
    mostrarBanner(`Mascota "${nombre}" eliminada del registro.`, 'success');
    await cargarTodas();
  } catch (error) {
    mostrarBanner(extraerMensajeError(error), 'error');
  }
}

async function eliminarPorRut(rut) {
  ocultarBanner();
  const confirmado = window.confirm(`¿Eliminar TODAS las mascotas asociadas al RUT "${rut}"? Esta acción no se puede deshacer.`);
  if (!confirmado) return;

  try {
    const { data } = await api.delete('/mascotas', { params: { rut } });
    mostrarBanner(data?.mensaje || 'Mascotas eliminadas correctamente.', 'success');
    el.formEliminarRut.reset();
    await cargarTodas();
  } catch (error) {
    mostrarBanner(extraerMensajeError(error), 'error');
  }
}

// ---------------------------------------------------------------------
// Validación básica en el cliente (además de la validación del backend)
// ---------------------------------------------------------------------
function validarFormularioInscripcion(nombre, rut) {
  let valido = true;
  limpiarErroresFormulario();

  if (!nombre.trim()) {
    el.errNombre.textContent = 'Ingrese el nombre de la mascota.';
    valido = false;
  }
  if (!rut.trim()) {
    el.errRut.textContent = 'Ingrese el RUT del dueño/a.';
    valido = false;
  }
  return valido;
}

// ---------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------
el.formInscribir.addEventListener('submit', (e) => {
  e.preventDefault();
  const nombre = el.inputNombre.value;
  const rut = el.inputRut.value;
  if (!validarFormularioInscripcion(nombre, rut)) return;
  inscribirMascota(nombre.trim(), rut.trim());
});

el.filtroTipo.addEventListener('change', () => {
  const tipo = el.filtroTipo.value;
  if (tipo === 'todas') {
    el.inputBusqueda.disabled = true;
    el.inputBusqueda.value = '';
  } else {
    el.inputBusqueda.disabled = false;
    el.inputBusqueda.placeholder = tipo === 'nombre' ? 'Ej: Firulais' : 'Ej: 12.345.678-5';
  }
});

el.formBuscar.addEventListener('submit', (e) => {
  e.preventDefault();
  const tipo = el.filtroTipo.value;
  const valor = el.inputBusqueda.value.trim();

  if (tipo !== 'todas' && !valor) {
    mostrarBanner('Ingrese un valor para realizar la búsqueda.', 'error');
    return;
  }
  buscar(tipo, valor);
});

el.formEliminarRut.addEventListener('submit', (e) => {
  e.preventDefault();
  const rut = el.inputRutEliminar.value.trim();
  if (!rut) {
    mostrarBanner('Ingrese el RUT del dueño/a a eliminar.', 'error');
    return;
  }
  eliminarPorRut(rut);
});

// ---------------------------------------------------------------------
// Carga inicial
// ---------------------------------------------------------------------
cargarTodas();
