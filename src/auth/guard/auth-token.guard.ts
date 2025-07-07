import { UserService } from './../../user/services/user.service';
import { CanActivate, ExecutionContext, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services';
import { Request } from 'express';

@Injectable()
export class AuthTokenGuard implements CanActivate {

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService, 
  ){}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean>  {
    try{
      const req = context.switchToHttp().getRequest<Request>();
      const token = req.headers['auth-token'];
       //pregunto si lo saque o si es un arreglo
      if (!token || Array.isArray(token))
        throw new UnauthorizedException('No hay token');

      const payload = this.authService.useToken(token);

      if(typeof payload == "string")
        throw new UnauthorizedException(payload);
      
      if(payload.isExpired){
        throw new UnauthorizedException('El token ha expirado');
      }
      
      const findEmployeed = await this.userService.findUserById(payload.userId);

      req.userId = findEmployeed._id.toString();
      req.role = findEmployeed.role;
      return true;
    }catch (err) {
      if(err instanceof NotFoundException || err instanceof UnauthorizedException) 
        throw err;

      throw new InternalServerErrorException(`Error al activar el guard de autenticación`, err);
    } 
  }
}
