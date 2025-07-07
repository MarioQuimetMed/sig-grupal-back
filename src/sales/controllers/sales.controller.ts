import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthRoleGuard, AuthTokenGuard } from 'src/auth/guard';
import { SalesService } from '../services';
import { Roles } from 'src/auth/decorator';
import { UserRole } from 'src/user/constant';

@Controller('sales')
@UseGuards(AuthTokenGuard,AuthRoleGuard)
export class SalesController {

  constructor(
    private readonly salesService: SalesService
  ){}


  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CLIENT)
  public async findAllProducts(){
    const statusCode = HttpStatus.OK;
  }

}
