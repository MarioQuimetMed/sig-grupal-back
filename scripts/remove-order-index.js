/**
 * Este script elimina el índice único en el campo customer.email de la colección order
 * Ejecutar con: mongo <url-conexión> remove-order-index.js
 */

// Conectar a la base de datos
print('Conectando a la base de datos...');
const db = db.getSiblingDB('SIGDB');

// Listar todos los índices de la colección order
print('Índices existentes en la colección order:');
const indexes = db.order.getIndexes();
printjson(indexes);

// Buscar el índice que queremos eliminar (UQ_3d73ccc46a25e9d02806a5b6d07)
const targetIndex = indexes.find(
  (i) => i.name === 'UQ_3d73ccc46a25e9d02806a5b6d07',
);

if (targetIndex) {
  print('Se encontró el índice a eliminar:');
  printjson(targetIndex);

  // Eliminar el índice
  print('Eliminando índice...');
  db.order.dropIndex('UQ_3d73ccc46a25e9d02806a5b6d07');
  print('Índice eliminado correctamente.');
} else {
  print('No se encontró el índice UQ_3d73ccc46a25e9d02806a5b6d07.');
}

// Verificar los índices actualizados
print('Índices actuales en la colección order:');
printjson(db.order.getIndexes());
