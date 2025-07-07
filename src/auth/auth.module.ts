import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { AuthController } from './controllers';
import { AuthService } from './services';

@Module({
  providers: [AuthService],
  imports:[
    JwtModule,
    forwardRef(()=> UserModule)
  ],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}
