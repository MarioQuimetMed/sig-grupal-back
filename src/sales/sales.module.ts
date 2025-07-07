import { Module } from '@nestjs/common';
import { SalesController } from './controllers';
import { SalesService } from './services';
import { AuthModule } from 'src/auth/auth.module';
import { Product } from 'src/product/entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [SalesController],
  providers: [SalesService],
  imports:[
    AuthModule,
    TypeOrmModule.forFeature([Product]),
    UserModule
  ]
})
export class SalesModule {}
