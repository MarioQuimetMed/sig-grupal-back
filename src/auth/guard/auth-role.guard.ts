import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { UserRole } from 'src/user/constant';

@Injectable()
export class AuthRoleGuard implements CanActivate {
   constructor(
    private readonly reflector: Reflector
  ){}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try{
      
      const req = context.switchToHttp().getRequest<Request>();
      const get_roles = this.reflector.get<UserRole[]>('roles',context.getHandler());
  
      const role = req.role as UserRole;
  
      if(!get_roles.includes(role))
        throw new UnauthorizedException(`El rol ${role} no tiene acceso a este recurso`);
  
      return true;
    }catch(err){
      if(err instanceof UnauthorizedException) 
        throw err;

      throw new UnauthorizedException(`Error al activar el guard de roles`, err);
    }
  }
}
