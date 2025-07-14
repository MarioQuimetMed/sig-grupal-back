import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MongoClient } from 'mongodb';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseCleanupService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseCleanupService.name);

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  /**
   * Este método se ejecuta automáticamente cuando se inicia el módulo
   * y realiza la limpieza de la base de datos
   */
  async onModuleInit() {
    try {
      this.logger.log(
        '🔄 Iniciando limpieza de índices en la base de datos...',
      );
      await this.cleanupDatabase();
    } catch (error) {
      this.logger.error(
        `❌ Error durante la limpieza de la base de datos: ${error.message}`,
      );
    }
  }

  /**
   * Limpia la base de datos eliminando índices problemáticos
   */
  private async cleanupDatabase(): Promise<void> {
    // Obtener la URL de conexión de MongoDB desde las variables de entorno
    const dbUrl = this.configService.get<string>('db_url');

    if (!dbUrl) {
      this.logger.error(
        '❌ No se encontró la URL de conexión a la base de datos',
      );
      return;
    }

    let client: MongoClient | null = null;

    try {
      // Conectar directamente a MongoDB
      this.logger.log('🔌 Conectando a MongoDB...');
      client = new MongoClient(dbUrl);
      await client.connect();

      const db = client.db(); // Obtiene la base de datos por defecto

      // Verificar si existe la colección 'order'
      const collections = await db.listCollections({ name: 'order' }).toArray();

      if (collections.length > 0) {
        this.logger.log(
          '🔍 La colección "order" existe, obteniendo índices...',
        );

        // Listar todos los índices de la colección
        const indexes = await db.collection('order').indexes();
        this.logger.log(`📋 Índices encontrados: ${indexes.length}`);

        // Buscar el índice problemático
        const problemIndex = indexes.find(
          (idx) => idx.name === 'UQ_3d73ccc46a25e9d02806a5b6d07',
        );

        if (problemIndex) {
          this.logger.log(
            `🗑️ Eliminando índice problemático: ${problemIndex.name}`,
          );
          await db.collection('order').dropIndex(problemIndex.name);
          this.logger.log('✅ Índice eliminado correctamente');
        } else {
          this.logger.log('ℹ️ No se encontró el índice problemático');
        }
      } else {
        this.logger.log('ℹ️ La colección "order" no existe todavía');
      }
    } catch (error) {
      this.logger.error(`❌ Error durante la limpieza: ${error.message}`);
      throw error;
    } finally {
      if (client) {
        this.logger.log('🔌 Cerrando conexión a MongoDB...');
        await client.close();
      }
    }

    this.logger.log('✅ Proceso de limpieza completado');
  }
}
