import { Module } from '@nestjs/common';
import { configProvider } from './providers';

@Module({
  imports: [configProvider],
})
export class ConfigModule {}
