// reset-db.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function resetDatabase() {
  // Obtener la URL de conexión desde la variable de entorno o usar una por defecto
  const url = process.env.MONGODB_URL || 'mongodb://localhost:27017/SIGDB';
  const client = new MongoClient(url);

  try {
    console.log('Conectando a la base de datos...');
    await client.connect();
    console.log('Conexión exitosa');

    const db = client.db();

    // Verificar si la colección existe
    const collections = await db.listCollections({ name: 'order' }).toArray();
    if (collections.length > 0) {
      console.log('La colección "order" existe, obteniendo índices...');

      // Listar índices existentes
      const indexes = await db.collection('order').indexes();
      console.log('Índices existentes:', indexes);

      // Buscar el índice problemático
      const targetIndex = indexes.find(
        (i) => i.name === 'UQ_3d73ccc46a25e9d02806a5b6d07',
      );

      if (targetIndex) {
        console.log('Eliminando índice problemático:', targetIndex.name);
        await db.collection('order').dropIndex(targetIndex.name);
        console.log('Índice eliminado correctamente');
      } else {
        console.log('No se encontró el índice problemático');
      }

      // Opción para eliminar la colección completa y recrearla
      console.log(
        '¿Desea eliminar completamente la colección "order"? (1: Sí / 2: No)',
      );
      // Aquí deberías esperar input del usuario en una aplicación real
      const shouldDropCollection = process.argv.includes('--drop-collection');

      if (shouldDropCollection) {
        console.log('Eliminando colección "order"...');
        await db.collection('order').drop();
        console.log('Colección "order" eliminada correctamente');
      }
    } else {
      console.log('La colección "order" no existe');
    }

    console.log('Proceso completado');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
    console.log('Conexión cerrada');
  }
}

resetDatabase().catch(console.error);
