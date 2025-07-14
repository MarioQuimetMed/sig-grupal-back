export enum OrderStatus {
  ESPERANDO_ASIGNACION = 'ESPERANDO_ASIGNACION',
  ASIGNADO_DISTRIBUIDOR = 'ASIGNADO_DISTRIBUIDOR',
  EN_RUTA = 'EN_RUTA',
  FINALIZADO_CON_EXITO = 'FINALIZADO_CON_EXITO',
  CANCELADO = 'CANCELADO',
}

export enum PaymentMethod {
  TARJETA = 'TARJETA',
  QR = 'QR',
  EFECTIVO = 'EFECTIVO',
}

// Índice para exportar todas las constantes
export * from './order-status.constant';
