import { Module } from '@nestjs/common';
import { typeOrmProvider } from './providers/type-orm.provider';

@Module({
  imports: [typeOrmProvider],
})
export class TypeOrmModule {}
