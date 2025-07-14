/**
 * Script para recrear la colección de órdenes sin los índices conflictivos
 */

// Instrucciones para ejecutar el script en la terminal de MongoDB:
// 1. Conectarse a la base de datos MongoDB
// 2. Ejecutar este script con: load("recreate-order-collection.js")

print('Iniciando recreación de la colección order...');

// Verificar si la colección existe
if (db.order.exists()) {
  // Guardar los datos existentes (opcional, si deseas preservar los datos)
  print('Haciendo backup de los datos existentes...');
  const orders = db.order.find().toArray();
  db.order_backup = orders;

  // Eliminar la colección con los índices problemáticos
  print('Eliminando la colección order...');
  db.order.drop();

  print('Colección order eliminada correctamente.');
} else {
  print('La colección order no existe, no es necesario eliminarla.');
}

// Crear la colección manualmente sin índices únicos no deseados
print('Creando la colección order sin índices conflictivos...');
db.createCollection('order');

// Si deseas restaurar los datos (opcional)
// Nota: Asegúrate de que los datos no tengan los campos problemáticos
if (typeof orders !== 'undefined' && orders.length > 0) {
  print(`Restaurando ${orders.length} documentos a la colección order...`);

  // Limpiar campos problemáticos antes de insertar
  orders.forEach((order) => {
    // Eliminar el campo customer si existe y reemplazarlo por customerId si es necesario
    if (order.customer && !order.customerId) {
      order.customerId = order.customer._id.toString();
    }
    // Eliminar el campo customer que causa el problema de índice único
    delete order.customer;
  });

  // Insertar los documentos limpios
  db.order.insertMany(orders);

  print('Datos restaurados correctamente.');
}

print('Verificando índices en la nueva colección:');
printjson(db.order.getIndexes());

print('Recreación de la colección order completada.');
