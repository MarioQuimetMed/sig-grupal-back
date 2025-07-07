import { Module } from '@nestjs/common';
import { ProductService } from './services';
import { AzureService } from './services/azure.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entity';
import { ProductController } from './controllers';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';

@Module({
  providers: [ProductService, AzureService],
  imports: [
    TypeOrmModule.forFeature([Product]),
    AuthModule,
    UserModule
  ],
  controllers: [ProductController],
})
export class ProductModule {}
