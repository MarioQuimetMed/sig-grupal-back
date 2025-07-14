# Solución de problemas comunes

## Error de clave duplicada en la colección de órdenes

Si encuentras errores como este:

```
ERROR [SalesService] ❌ Error procesando pago: E11000 duplicate key error collection: SIGDB.order index: UQ_3d73ccc46a25e9d02806a5b6d07 dup key: { customer.email: null }
```

Este error ocurre debido a un índice único en el campo `customer.email` en la colección de órdenes.
Después de actualizar el modelo para guardar solo el ID del cliente en lugar del objeto cliente completo,
este índice ya no es necesario y está causando problemas.

### Solución 1: Usar el script de eliminación de índice

Ejecuta el siguiente comando para eliminar el índice problemático:

```bash
# Instala las dependencias necesarias si no las tienes
npm install mongodb dotenv

# Ejecuta el script para eliminar el índice
node scripts/reset-db.js
```

Para eliminar también la colección y recrearla (esto eliminará TODAS las órdenes existentes):

```bash
node scripts/reset-db.js --drop-collection
```

### Solución 2: Eliminar el índice manualmente desde MongoDB Shell

1. Conéctate a tu base de datos MongoDB:

```bash
mongo mongodb://localhost:27017/SIGDB
```

2. Elimina el índice problemático:

```javascript
db.order.dropIndex('UQ_3d73ccc46a25e9d02806a5b6d07');
```

3. Verifica que el índice se haya eliminado:

```javascript
db.order.getIndexes();
```

### Solución 3: Recrear la colección de órdenes

Si las soluciones anteriores no funcionan, puedes recrear la colección de órdenes:

1. Conéctate a tu base de datos MongoDB
2. Ejecuta el script:

```javascript
load('scripts/recreate-order-collection.js');
```

## Prevención de problemas futuros

1. Se ha modificado la configuración de TypeORM para evitar la creación automática de índices no deseados.
2. La entidad Order ya no almacena el objeto cliente completo, solo el ID del cliente.
3. Considera desactivar la sincronización automática de esquemas en producción estableciendo `synchronize: false` en la configuración de TypeORM.
