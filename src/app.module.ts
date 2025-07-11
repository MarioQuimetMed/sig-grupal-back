import { Module, OnModuleInit } from '@nestjs/common';

import { ConfigModule } from './config/config.module';
import { UserModule } from './user/user.module';
import { EmployeedService } from './user/services';
import { TypeOrmModule } from './type-orm/type-orm.module';
import { AuthModule } from './auth/auth.module';
import { FormDataModule } from './form-data/form-data.module';
import { ProductModule } from './product/product.module';
import { SalesModule } from './sales/sales.module';


@Module({
  imports: [
    TypeOrmModule,
    AuthModule, 
    FormDataModule,
    ConfigModule, 
    UserModule,
    AuthModule,
    ProductModule,
    SalesModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements OnModuleInit {
  constructor(private employeedService: EmployeedService) {} 
  async onModuleInit() {
    // await this.employeedService.createAdminRunApp(); // Deshabilitado temporalmente
  }
}
