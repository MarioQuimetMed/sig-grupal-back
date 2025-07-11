import { Module } from '@nestjs/common';
import { SalesController } from './controllers';
import { SalesService } from './services';
import { AuthModule } from 'src/auth/auth.module';
import { Product } from 'src/product/entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { ProductModule } from 'src/product/product.module';
import { DetailOrder, Order } from './entity';
import { User } from 'src/user/entity';
import { PaymentController } from './controllers/payment.controller';

@Module({
  controllers: [SalesController, PaymentController],
  providers: [SalesService],
  imports:[
    AuthModule,
    TypeOrmModule.forFeature([
      Product,
      User,
      Order
    ]),
    UserModule,
    ProductModule
  ]
})
export class SalesModule {}
