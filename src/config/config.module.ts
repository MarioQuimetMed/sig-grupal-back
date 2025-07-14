import { Module } from '@nestjs/common';
import { configProvider } from './providers';
import { DatabaseCleanupService } from './service/database-cleanup.service';

@Module({
  imports: [configProvider],
  providers: [DatabaseCleanupService],
})
export class ConfigModule {}
