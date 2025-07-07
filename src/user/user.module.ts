import { forwardRef, Module } from '@nestjs/common';
import { EmployeedService , UserService} from './services';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientAddress, DistCapacity, User } from './entity';
import { EmployeesController } from './controllers/employees.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, DistCapacity,ClientAddress]),
    forwardRef(() => AuthModule)
  ],
  exports: [
    EmployeedService,
    UserService
  ],
  providers: [
    EmployeedService,
    UserService
  ],
  controllers: [EmployeesController]
})
export class UserModule {}
