import { Body, Controller, HttpCode, HttpStatus, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthRoleGuard, AuthTokenGuard } from 'src/auth/guard';
import { UserService } from '../services';
import { Roles } from 'src/auth/decorator';
import { UserRole } from '../constant';
import { ClientCreateDto, ClientUpdateDto } from '../dto';
import { IApiResponse } from 'src/common/interfaces';
import { User } from '../entity';
import { Request } from 'express';

@Controller('client')
export class ClientController {

  constructor(
    private readonly userService: UserService
  ){}


  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  public async createClient(
    @Body() clientCreateDto: ClientCreateDto
  ):Promise<IApiResponse<User>>{
    const statusCode = HttpStatus.CREATED;
    const createClient = await this.userService.signUpCliente(clientCreateDto);
    return {
      statusCode,
      message: 'Cliente creado correctamente',
      data: createClient
    }
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthTokenGuard, AuthRoleGuard)
  @Roles(UserRole.CLIENT)
  public async updateClient(
    @Req() req: Request,
    @Body() clientUpdateDto: ClientUpdateDto
  ): Promise<IApiResponse<User>>{
    const statusCode = HttpStatus.OK;
    const clientId = req.userId;
    const updatedClient = await this.userService.updateClient(clientId, clientUpdateDto);
    return {
      statusCode,
      message: 'Cliente actualizado correctamente',
      data: updatedClient
    }
  }

}
