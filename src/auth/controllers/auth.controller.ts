import { ISignInEmployeedResponse } from './../interface';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { IApiResponse } from 'src/common/interfaces';
import { AuthService } from '../services';
import { SignInDto } from '../dto';

@Controller('auth')
export class AuthController {

  constructor(
    private readonly authService: AuthService
  ){}

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  public async signInEmployeed(
    @Body() signInDto: SignInDto
  ): Promise<IApiResponse<ISignInEmployeedResponse>>{
    const statusCode = HttpStatus.OK;
    const signIn = await this.authService.signIn(signInDto);
    return {
      statusCode,
      message: 'Inicio de sesión exitoso',
      data: signIn
    }

  }
}
