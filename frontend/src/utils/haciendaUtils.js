/**
 * Utilidades para Simulación Oficial de Facturación Electrónica de Costa Rica
 * Normativa: Resolución DGT-R-033-2019 (Dirección General de Tributación)
 */

export function generarClaveHacienda50({
  idFactura,
  fecha = new Date(),
  cedulaEmisor = '003101899540', // Cédula Jurídica Mundo Escolar S.A. (12 dígitos con ceros)
  tipoComprobante = '04', // 01 = Factura Electrónica, 04 = Tiquete Electrónico
  sucursal = '001', // Casa matriz (3 dígitos)
  terminal = '00001', // Terminal POS 1 (5 dígitos)
  situacion = '1', // 1 = Normal (generado y aceptado)
}) {
  const dateObj = fecha instanceof Date ? fecha : new Date(fecha);
  const dia = String(dateObj.getDate()).padStart(2, '0');
  const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
  const anio = String(dateObj.getFullYear()).slice(-2);

  const numFactura = parseInt(idFactura, 10) || 1;
  const consecutivo = `${sucursal}${terminal}${tipoComprobante}${String(numFactura).padStart(10, '0')}`;

  // Hash determinístico de seguridad de 8 dígitos
  const seed = (numFactura * 9301 + 49297 + dateObj.getDate() * 1013) % 89999999 + 10000000;
  const codigoSeguridad = String(Math.abs(seed)).slice(0, 8);

  // Composición exacta de 50 dígitos:
  // 506 (3) + Dia (2) + Mes (2) + Anio (2) + Cedula (12) + Consecutivo (20) + Situacion (1) + Seguridad (8) = 50
  return `506${dia}${mes}${anio}${cedulaEmisor.padStart(12, '0')}${consecutivo}${situacion}${codigoSeguridad}`;
}

export function formatearClaveHacienda(clave) {
  if (!clave || clave.length !== 50) return clave || '';
  // Formato en bloques legibles de 10 dígitos para humanos y contadores
  return `${clave.slice(0, 10)} ${clave.slice(10, 20)} ${clave.slice(20, 30)} ${clave.slice(30, 40)} ${clave.slice(40, 50)}`;
}

export function generarQrFiscalUrl(clave) {
  return `https://atv.hacienda.go.cr/ATV/Login.aspx?clave=${clave}`;
}

export function generarMensajeWhatsAppFactura(resultadoVenta) {
  const lineas = [
    `*LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR*`,
    `📄 *Comprobante Electrónico DGT Costa Rica*`,
    `🔢 *Factura / Tiquete:* ${resultadoVenta.numeroFactura}`,
    `🔑 *Clave Hacienda (50 dígitos):*`,
    `${resultadoVenta.claveHacienda || '506...'}`,
    `👤 *Cliente:* ${resultadoVenta.cliente} (${resultadoVenta.identificacion || 'Consumidor Final'})`,
    `📅 *Fecha:* ${resultadoVenta.fecha instanceof Date ? resultadoVenta.fecha.toLocaleString('es-CR') : new Date(resultadoVenta.fecha).toLocaleString('es-CR')}`,
    `💳 *Pago:* ${resultadoVenta.metodoPago}`,
    `----------------------------------------`,
    `*Detalle de Compra:*`,
  ];

  (resultadoVenta.items || []).forEach((it) => {
    lineas.push(`• ${it.cantidad}x ${it.nombre} - ₡${(it.precio * it.cantidad).toLocaleString('es-CR')}`);
  });

  lineas.push(`----------------------------------------`);
  lineas.push(`Subtotal: ₡${resultadoVenta.subtotal.toLocaleString('es-CR')}`);
  lineas.push(`IVA (13%): ₡${resultadoVenta.iva.toLocaleString('es-CR')}`);
  lineas.push(`*TOTAL PAGADO: ₡${resultadoVenta.total.toLocaleString('es-CR')}*`);
  lineas.push(``);
  lineas.push(`Verifique su comprobante en la Oficina Virtual de Hacienda (ATV):`);
  lineas.push(`https://atv.hacienda.go.cr/ATV/Login.aspx?clave=${resultadoVenta.claveHacienda}`);
  lineas.push(``);
  lineas.push(`¡Gracias por su preferencia! 📚🎒`);

  return encodeURIComponent(lineas.join('\n'));
}
