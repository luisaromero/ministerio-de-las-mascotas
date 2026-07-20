/**
 * Utilidades para validar y normalizar RUT chileno.
 * Formato de salida normalizado: "12345678-9" (sin puntos, con guión, DV en mayúscula).
 */

function limpiarRut(rut) {
  if (typeof rut !== 'string') return '';
  return rut.replace(/[.\s]/g, '').toUpperCase();
}

function calcularDV(numero) {
  let suma = 0;
  let multiplo = 2;

  for (let i = numero.length - 1; i >= 0; i--) {
    suma += parseInt(numero[i], 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

/**
 * Valida el formato y dígito verificador de un RUT.
 * Devuelve { valido: boolean, normalizado: string|null, error: string|null }
 */
function validarRut(rutOriginal) {
  const rut = limpiarRut(rutOriginal);

  if (!rut) {
    return { valido: false, normalizado: null, error: 'El RUT no puede estar vacío.' };
  }

  const match = rut.match(/^(\d{1,8})-?([\dK])$/);
  if (!match) {
    return {
      valido: false,
      normalizado: null,
      error: 'Formato de RUT inválido. Use el formato 12345678-9.',
    };
  }

  const [, numero, dv] = match;
  const dvCalculado = calcularDV(numero);

  if (dv !== dvCalculado) {
    return { valido: false, normalizado: null, error: 'El dígito verificador del RUT no es válido.' };
  }

  return { valido: true, normalizado: `${numero}-${dv}`, error: null };
}

module.exports = { validarRut, limpiarRut };
