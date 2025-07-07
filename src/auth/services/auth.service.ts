import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { SignInDto } from './../dto';
import { UserService } from 'src/user/services';
import { AuthTokenResult, ISignInEmployeedResponse, ISignJwt, IUseToken } from '../interface';

@Injectable()
export class AuthService {

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService
  ){}

  public async signIn(signInDto: SignInDto): Promise<ISignInEmployeedResponse>{
    try{
      const findUser= await this.userService.findUserByEmail(signInDto.email);
      if(!findUser){
        throw new NotFoundException('El Usuario no se encuentra registrado');
      }
      if(!findUser.status){
        throw new BadRequestException('El Usuario no se encuentra activo');
      }

      const isValidPassword = bcrypt.compareSync(signInDto.password, findUser.password);

      if(!isValidPassword){
        throw new BadRequestException('La contraseña es incorrecta');
      }

      return {
        user: findUser,
        token: this.signJwt({
          expires: 10 * 24 * 60 * 60,
          payload: {
            userId: findUser._id,
          }
        })
      }

    }catch(err){
      if(err instanceof NotFoundException || err instanceof BadRequestException) {
        throw err;
      }
      throw new InternalServerErrorException('Error al iniciar sesión', err);
    }
  }

  public useToken(token: string): IUseToken | string {
    try {
      const decode = this.jwtService.decode(token) as AuthTokenResult;
      const currentDate = new Date();
      const expiresDate = new Date(decode.exp);

      return {
        userId: decode.userId,
        isExpired: +expiresDate <= +currentDate / 1000,
      };
    } catch (err) {
      return 'token es invalido';
    }
  }

  private signJwt({expires,payload}: ISignJwt): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>("secret_jwt_key"),
      expiresIn: expires,
    })
  }

}
