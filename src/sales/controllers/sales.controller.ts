import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post, Query, RawBody, Req, UseGuards } from '@nestjs/common';
import { AuthRoleGuard, AuthTokenGuard } from 'src/auth/guard';
import { SalesService } from '../services';
import { Roles } from 'src/auth/decorator';
import { UserRole } from 'src/user/constant';
import { IApiResponse } from 'src/common/interfaces';
import { IPaginatedEmployees } from 'src/user/interfaces';
import { Product } from 'src/product/entity';
import { PaginationDto } from 'src/common/dto';
import { CreatePaymentDto } from '../dto';
import { Request } from 'express';
import { IPaymentResponse } from '../interface';
import { Order } from '../entity';

@Controller('sales')
@UseGuards(AuthTokenGuard,AuthRoleGuard)
export class SalesController {

  constructor(
    private readonly salesService: SalesService
  ){}


  @Get('products')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CLIENT)
  public async findAllProducts(
    @Query() paginationDto: PaginationDto
  ): Promise<IApiResponse<IPaginatedEmployees<Product>>>{
    const statusCode = HttpStatus.OK;
    const findAllProducts = await this.salesService.findAllProductss(paginationDto);

    return {
      statusCode,
      message: 'Productos obtenidos correctamente',
      data: findAllProducts
    }
  }

  @Post('payment')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.CLIENT)
  public async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: Request
  ): Promise<IApiResponse<IPaymentResponse>>{
    const statusCode = HttpStatus.CREATED;
    const userId = req.userId;
    const paymentResponse = await this.salesService.createPaymentIntent(createPaymentDto, userId);
    return {
      statusCode,
      message: 'Pago creado correctamente',
      data: paymentResponse
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR)
  public async findAllOrders(
    @Query() paginationDto: PaginationDto
  ):Promise<IApiResponse<IPaginatedEmployees<Order>>>{
    const statusCode = HttpStatus.OK;
    const findAllOrders = await this.salesService.findAllSales(paginationDto);
    return {
      statusCode,
      message: 'Ventas obtenidas correctamente',
      data: findAllOrders
    }
  }

}
