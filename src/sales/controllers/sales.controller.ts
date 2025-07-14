import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  RawBody,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthRoleGuard, AuthTokenGuard } from 'src/auth/guard';
import { SalesService } from '../services';
import { Roles } from 'src/auth/decorator';
import { UserRole } from 'src/user/constant';
import { IApiResponse } from 'src/common/interfaces';
import { IPaginatedEmployees } from 'src/user/interfaces';
import { Product } from 'src/product/entity';
import { PaginationDto } from 'src/common/dto';
import {
  CreatePaymentDto,
  GetDistributorOrdersDto,
  MarkAsDeliveredDto,
} from '../dto';
import { Request } from 'express';
import { IPaymentResponse, IPaginatedDistributorOrders } from '../interface';
import { Order } from '../entity';

@Controller('sales')
@UseGuards(AuthTokenGuard, AuthRoleGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('products')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CLIENT)
  public async findAllProducts(
    @Query() paginationDto: PaginationDto,
  ): Promise<IApiResponse<IPaginatedEmployees<Product>>> {
    const statusCode = HttpStatus.OK;
    const findAllProducts =
      await this.salesService.findAllProductss(paginationDto);

    return {
      statusCode,
      message: 'Productos obtenidos correctamente',
      data: findAllProducts,
    };
  }

  @Post('payment')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.CLIENT)
  public async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: Request,
  ): Promise<IApiResponse<IPaymentResponse>> {
    const statusCode = HttpStatus.CREATED;
    const userId = req.userId;
    const paymentResponse = await this.salesService.createPaymentIntent(
      createPaymentDto,
      userId,
    );
    return {
      statusCode,
      message: 'Pago creado correctamente',
      data: paymentResponse,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.DISTRIBUTOR)
  public async findAllOrders(
    @Query() paginationDto: PaginationDto,
  ): Promise<IApiResponse<IPaginatedEmployees<Order>>> {
    const statusCode = HttpStatus.OK;
    const findAllOrders = await this.salesService.findAllSales(paginationDto);
    return {
      statusCode,
      message: 'Ventas obtenidas correctamente',
      data: findAllOrders,
    };
  }

  /**
   * Endpoint para que un distribuidor obtenga sus órdenes asignadas
   * @param req Request con información del usuario autenticado
   * @param paginationDto Parámetros de paginación y filtros
   * @returns Lista paginada de órdenes asignadas al distribuidor
   */
  @Get('distributor/orders')
  @Roles(UserRole.DISTRIBUTOR)
  @HttpCode(HttpStatus.OK)
  async getDistributorOrders(
    @Req() req: Request,
    @Query() paginationDto: GetDistributorOrdersDto,
  ): Promise<IApiResponse<IPaginatedDistributorOrders>> {
    const userId = req.userId;
    //mostrar el id en log

    // Log the userId for debugging purposes
    console.log(`User ID: ${userId}`);

    const orders = await this.salesService.getDistributorOrders(
      userId,
      paginationDto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Lista de órdenes obtenida exitosamente',
      data: orders,
    };
  }

  /**
   * Endpoint para asignar un distribuidor a una orden
   * @param orderId ID de la orden
   * @param distributorId ID del distribuidor
   * @returns La orden actualizada
   */
  @Post('orders/:orderId/assign/:distributorId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async assignDistributorToOrder(
    @Param('orderId') orderId: string,
    @Param('distributorId') distributorId: string,
  ): Promise<IApiResponse<Order>> {
    const order = await this.salesService.assignDistributorToOrder(
      orderId,
      distributorId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Distribuidor asignado exitosamente',
      data: order,
    };
  }

  /**
   * Endpoint para que un distribuidor marque una orden como entregada
   * @param orderId ID de la orden
   * @param markAsDeliveredDto DTO con la observación opcional
   * @param req Request con información del usuario autenticado
   * @returns La orden actualizada
   */
  @Post('orders/:orderId/deliver')
  @Roles(UserRole.DISTRIBUTOR)
  @HttpCode(HttpStatus.OK)
  async markOrderAsDelivered(
    @Param('orderId') orderId: string,
    @Body() markAsDeliveredDto: MarkAsDeliveredDto,
    @Req() req: Request,
  ): Promise<IApiResponse<Order>> {
    const distributorId = req.userId;
    const order = await this.salesService.markOrderAsDelivered(
      orderId,
      distributorId,
      markAsDeliveredDto.observation,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Orden marcada como entregada exitosamente',
      data: order,
    };
  }
}
