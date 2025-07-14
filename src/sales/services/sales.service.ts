import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/common/dto';
import { Product } from 'src/product/entity';
import { IPaginatedEmployees } from 'src/user/interfaces';
import { FindOperator, MongoRepository } from 'typeorm';
import * as stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

import { CartItemDto, CreatePaymentDto, GetDistributorOrdersDto } from '../dto';
import { IPaymentResponse, IPaginatedDistributorOrders } from '../interface';
import { ProductService } from 'src/product/services';
import { ObjectId } from 'mongodb';
import { User } from 'src/user/entity';
import { DetailOrder, Order } from '../entity';
import { methodPayment, statusPayment } from '../constant';
import { UserRole } from 'src/user/constant';

@Injectable()
export class SalesService {
  private stripe: stripe.Stripe;
  private readonly logger = new Logger(SalesService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: MongoRepository<Product>,
    @InjectRepository(Order)
    private readonly orderRepository: MongoRepository<Order>,
    @InjectRepository(User)
    private readonly userRepository: MongoRepository<User>,
    private readonly productService: ProductService,
    private readonly configService: ConfigService,
  ) {
    this.stripe = new stripe.Stripe(
      this.configService.get<string>('stripe_key'),
    );
  }

  public async findAllProductss(
    paginationDto: PaginationDto,
  ): Promise<IPaginatedEmployees<Product>> {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;
      const [products, total] = await this.productRepository.findAndCount({
        order: {
          updatedAt: 'DESC',
        },
        skip,
        take: limit,
        where: {
          status: true,
        },
      });
      return {
        body: products,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(
        'Error al buscar los productos: ' + err,
      );
    }
  }

  public async findAllSales(
    paginationDto: PaginationDto,
  ): Promise<IPaginatedEmployees<Order>> {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;
      const [products, total] = await this.orderRepository.findAndCount({
        order: {
          updatedAt: 'DESC',
        },
        skip,
        take: limit,
      });
      return {
        body: products,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(
        'Error al buscar los productos: ' + err,
      );
    }
  }

  //#region  PAYMENTS
  public async createPaymentIntent(
    createPaymentDto: CreatePaymentDto,
    userId: string,
  ): Promise<IPaymentResponse> {
    try {
      const cartProducts = await this.validateAndGetCartProducts(
        createPaymentDto.items,
      );
      this.logger.log(
        `Productos validados: ${cartProducts.map((p) => p._id).join(', ')}`,
      );
      // Crear line items para Stripe
      const lineItems = this.createStripeLineItems(
        cartProducts,
        createPaymentDto.items,
      );
      this.logger.log(`Line items creados: ${JSON.stringify(lineItems)}`);

      // Si se proporcionaron coordenadas, registrarlas en el log
      if (createPaymentDto.lat && createPaymentDto.lng) {
        this.logger.log(
          `📍 Coordenadas de entrega: Lat: ${createPaymentDto.lat}, Lng: ${createPaymentDto.lng}`,
        );
      }

      // Crear sesión de pago
      const paymentSession = await this.createPaymentSession(
        lineItems,
        createPaymentDto.items,
        userId,
        createPaymentDto.lat,
        createPaymentDto.lng,
      );
      this.logger.log(`Sesión de pago creada con ID: ${paymentSession.id}`);
      return {
        sessionId: paymentSession.id,
        url: paymentSession.url,
        paymentSession,
      };
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(
        `Error al crear el pago: ${JSON.stringify(err)}`,
      );
    }
  }

  private async createPaymentSession(
    lineItems: stripe.Stripe.Checkout.SessionCreateParams.LineItem[],
    metadata: CartItemDto[],
    userId: string,
    lat?: number,
    lng?: number,
  ) {
    try {
      const sucessUrl = this.configService.get<string>('stripe_success_url');
      const cancelUrl = this.configService.get<string>('stripe_cancel_url');
      this.logger.log(
        `Creando sesión de pago con los siguientes items: ${JSON.stringify(lineItems)}`,
      );
      const session = await this.stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: 'payment',
        success_url: sucessUrl,
        cancel_url: cancelUrl,
        metadata: {
          customerId: userId || '',
          products: JSON.stringify(metadata),
          orderType: 'product_purchase',
          latitude: lat ? lat.toString() : '',
          longitude: lng ? lng.toString() : '',
        },
      });
      return session;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  private createStripeLineItems(products: Product[], items: CartItemDto[]) {
    return items.map((item) => {
      const product = products.find((p) => p._id.toString() === item.productId);
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
            images: product.img_url ? [product.img_url] : [],
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: item.quantity,
      };
    });
  }

  private async validateAndGetCartProducts(
    items: CartItemDto[],
  ): Promise<Product[]> {
    this.logger.log(
      `Validando productos con IDs: ${items.map((i) => i.productId).join(', ')}`,
    );

    const products: Product[] = [];
    // Método rústico: buscar cada producto individualmente
    for (const item of items) {
      try {
        const product = await this.productRepository.findOne({
          where: {
            _id: new FindOperator(
              'equal',
              ObjectId.createFromHexString(item.productId),
            ).value,
          },
        });
        if (!product) {
          this.logger.error(`Producto con ID ${item.productId} no encontrado`);
          throw new NotFoundException(
            `Producto con ID ${item.productId} no encontrado`,
          );
        }

        if (product.stock < item.quantity) {
          this.logger.error(
            `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, solicitado: ${item.quantity}`,
          );
          throw new BadRequestException(
            `Stock insuficiente para ${product.name}. Stock disponible: ${product.stock}, solicitado: ${item.quantity}`,
          );
        }
        products.push(product);
        this.logger.log(
          `Producto validado: ${product.name} (ID: ${product._id})`,
        );
      } catch (error) {
        this.logger.error(
          `Error validando producto ${item.productId}: ${error.message}`,
        );
        throw error;
      }
    }

    this.logger.log(
      `Todos los productos validados correctamente. Total: ${products.length}`,
    );
    return products;
  }

  public async handleEventPayment(body: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>(
      'stripe_webhook_secret',
    ); // Corregir el nombre
    console.log(webhookSecret);
    try {
      const event: stripe.Stripe.Event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret,
      );
      this.logger.log(`🔔 Webhook recibido: ${event.type} - ID: ${event.id}`);
      switch (event.type) {
        case 'checkout.session.completed':
          await this.paymentSucessCheckout(
            event.data.object as stripe.Stripe.Checkout.Session,
          );
          break;
        default:
          break;
      }
    } catch (err) {
      throw err;
    }
  }

  private async paymentSucessCheckout(session: stripe.Stripe.Checkout.Session) {
    const metadata = session.metadata;

    try {
      this.logger.log(`💰 Procesando pago exitoso para session: ${session.id}`);

      const items = JSON.parse(metadata.products) as CartItemDto[];
      this.logger.log(`📦 Items a procesar: ${items.length}`);

      // 1. Validar que el cliente existe
      const customer = await this.userRepository.findOne({
        where: {
          _id: new FindOperator(
            'equal',
            ObjectId.createFromHexString(metadata.customerId),
          ).value,
          role: UserRole.CLIENT,
        },
      });

      if (!customer) {
        this.logger.error(
          `Cliente con ID ${metadata.customerId} no encontrado`,
        );
        throw new NotFoundException(
          `Cliente con ID ${metadata.customerId} no encontrado`,
        );
      }

      this.logger.log(
        `👤 Cliente encontrado: ${customer.name} (${customer.email})`,
      );

      // 2. Obtener y validar productos, y crear detalles
      const orderDetails: DetailOrder[] = [];
      let quantityTotal = 0;
      let totalAmount = 0;

      for (const item of items) {
        const product = await this.productRepository.findOne({
          where: {
            _id: new FindOperator(
              'equal',
              ObjectId.createFromHexString(item.productId),
            ).value,
          },
        });

        if (!product) {
          this.logger.error(`Producto con ID ${item.productId} no encontrado`);
          throw new NotFoundException(
            `Producto con ID ${item.productId} no encontrado`,
          );
        }

        if (product.stock < item.quantity) {
          this.logger.error(`Stock insuficiente para ${product.name}`);
          throw new BadRequestException(
            `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, solicitado: ${item.quantity}`,
          );
        }

        // Crear detalle con snapshot del producto
        const subtotal = product.price * item.quantity;

        const detail: DetailOrder = {
          product: product._id,
          quantity: item.quantity,
          subtotal: subtotal,
        };

        orderDetails.push(detail);
        quantityTotal += item.quantity;
        totalAmount += subtotal;

        this.logger.log(
          `📝 Detalle creado para: ${product.name} x ${item.quantity} = $${subtotal}`,
        );
      }

      // Obtener las coordenadas de la entrega desde los metadatos
      const latitude = metadata.latitude ? parseFloat(metadata.latitude) : null;
      const longitude = metadata.longitude
        ? parseFloat(metadata.longitude)
        : null;

      if (latitude && longitude) {
        this.logger.log(
          `📍 Coordenadas para entrega: Lat: ${latitude}, Lng: ${longitude}`,
        );
      } else {
        this.logger.warn(`⚠️ No se proporcionaron coordenadas para la entrega`);
      } // Crear la orden con consulta SQL directa para evitar validaciones y conflictos de TypeORM
      const orderData = {
        session_id: session.id,
        quantity_total: quantityTotal,
        total: session.amount_total / 100, // Stripe envía en centavos
        detail: orderDetails,
        customerId: customer._id.toString(), // Solo guardamos el ID del cliente
        latitude: latitude,
        longitude: longitude,
        method_payment: methodPayment.TARJETA, // Método de pago por tarjeta
        status: statusPayment.ESPERANDO_ASIGNACION, // Estado inicial
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.logger.log(`🔄 Insertando orden directamente usando consulta SQL`);

      // Usar repository.insertOne() en lugar de save() para evitar verificaciones adicionales
      const result = await this.orderRepository.insertOne(orderData as any);

      if (!result.insertedId) {
        throw new InternalServerErrorException('No se pudo crear la orden');
      }

      // Crear un objeto Order con los datos insertados
      const savedOrder = {
        _id: result.insertedId,
        ...orderData,
      } as Order;
      this.logger.log(`✅ Orden creada exitosamente: ${savedOrder._id}`);

      // 5. Actualizar stock de productos
      await this.updateProductsStock(items);

      // 6. Asignar automáticamente un distribuidor disponible
      try {
        const availableDistributor = await this.findAvailableDistributor();

        if (availableDistributor) {
          this.logger.log(
            `🚚 Asignando distribuidor ${availableDistributor.name} a la orden ${savedOrder._id}`,
          );

          // Asignar el distribuidor a la orden
          savedOrder.distributorId = availableDistributor._id.toString();
          savedOrder.status = statusPayment.ASIGNADO_DISTRIBUIDOR;

          // Guardar la orden actualizada
          await this.orderRepository.save(savedOrder);

          this.logger.log(
            `✅ Distribuidor asignado exitosamente a la orden ${savedOrder._id}`,
          );
        } else {
          this.logger.warn(
            `⚠️ No se pudo asignar un distribuidor. La orden ${savedOrder._id} permanece en espera`,
          );
        }
      } catch (assignError) {
        this.logger.error(
          `❌ Error al asignar distribuidor automáticamente: ${assignError.message}`,
        );
        // No lanzamos el error para permitir que la orden se cree de todas formas
      }

      // 7. Log de resumen
      this.logger.log(`📊 RESUMEN DE ORDEN:`);
      this.logger.log(`🆔 ID: ${savedOrder._id}`);
      this.logger.log(
        `👤 Cliente ID: ${savedOrder.customerId} (${customer.name})`,
      );
      this.logger.log(`📦 Total items: ${quantityTotal}`);
      this.logger.log(`💰 Total: $${savedOrder.total}`);
      this.logger.log(`🏷️ Estado: ${savedOrder.status}`);
      this.logger.log(`💳 Método pago: ${methodPayment.TARJETA}`);

      if (savedOrder.latitude && savedOrder.longitude) {
        this.logger.log(
          `📍 Ubicación entrega: Lat: ${savedOrder.latitude}, Lng: ${savedOrder.longitude}`,
        );
      }

      return savedOrder;
    } catch (err) {
      this.logger.error(`❌ Error procesando pago: ${err.message}`);
      throw new InternalServerErrorException(
        `Error al procesar el pago: ${err.message}`,
      );
    }
  }

  // Método para actualizar stock de productos
  private async updateProductsStock(items: CartItemDto[]): Promise<void> {
    this.logger.log(`📦 Actualizando stock de ${items.length} productos`);

    for (const item of items) {
      try {
        const product = await this.productRepository.findOne({
          where: {
            _id: new FindOperator(
              'equal',
              ObjectId.createFromHexString(item.productId),
            ).value,
          },
        });

        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          product.stock = newStock;
          await this.productRepository.save(product);

          this.logger.log(
            `📈 Stock actualizado para ${product.name}: ${product.stock} → ${newStock}`,
          );

          // Alerta si stock crítico
          if (newStock <= 5) {
            this.logger.warn(
              `⚠️ Stock crítico para ${product.name}: ${newStock} unidades restantes`,
            );
          }

          if (newStock === 0) {
            this.logger.warn(`🚫 Producto agotado: ${product.name}`);
          }
        }
      } catch (error) {
        this.logger.error(
          `❌ Error actualizando stock del producto ${item.productId}: ${error.message}`,
        );
        // No lanzar error para no fallar toda la operación
      }
    }
    this.logger.log(`✅ Stock actualizado para todos los productos`);
  }
  //#endregion

  /**
   * Obtiene las órdenes asignadas a un distribuidor específico
   * @param distributorId ID del distribuidor
   * @param paginationDto Parámetros de paginación y filtros
   * @returns Lista paginada de órdenes del distribuidor
   */
  public async getDistributorOrders(
    distributorId: string,
    { page = 1, limit = 10, status }: GetDistributorOrdersDto,
  ): Promise<IPaginatedDistributorOrders> {
    try {
      console.log(`Buscando distribuidor con ID: ${distributorId}`);

      // Verificar que el usuario sea un distribuidor
      const distributor = await this.userRepository.findOne({
        where: {
          _id: new ObjectId(distributorId),
          role: UserRole.DISTRIBUTOR,
          status: true,
        },
      });

      console.log(
        `Resultado de búsqueda de distribuidor:`,
        distributor ? 'Encontrado' : 'No encontrado',
      );

      if (!distributor) {
        throw new NotFoundException(
          `Distribuidor con ID ${distributorId} no encontrado`,
        );
      }

      // Construir el filtro de búsqueda
      const skip = (page - 1) * limit;
      const whereClause: any = {
        distributorId: distributorId,
      };

      console.log(`Filtro de búsqueda para órdenes:`, whereClause);

      // Filtrar por estado si se proporciona
      if (status) {
        whereClause.status = status;
      } else {
        // Por defecto, mostrar solo órdenes asignadas
        whereClause.status = statusPayment.ASIGNADO_DISTRIBUIDOR;
      }

      // Obtener órdenes paginadas
      const [orders, total] = await this.orderRepository.findAndCount({
        where: whereClause,
        order: {
          updatedAt: 'DESC',
        },
        skip,
        take: limit,
      });

      console.log(
        `Órdenes encontradas: ${total}. Primeras órdenes:`,
        orders.length > 0 ? orders.slice(0, 2) : 'Ninguna',
      );

      // Retornar la respuesta paginada
      return {
        body: orders,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Logger.error(
        `Error al obtener órdenes del distribuidor: ${error.message}`,
        'GetDistributorOrders',
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Error al obtener las órdenes: ${error.message}`,
      );
    }
  }

  /**
   * Asigna un distribuidor a una orden
   * @param orderId ID de la orden
   * @param distributorId ID del distribuidor
   * @returns La orden actualizada con el distribuidor asignado
   */
  public async assignDistributorToOrder(
    orderId: string,
    distributorId: string,
  ): Promise<Order> {
    try {
      // Verificar que la orden existe
      const order = await this.orderRepository.findOne({
        where: {
          _id: new ObjectId(orderId),
          status: statusPayment.ESPERANDO_ASIGNACION,
        },
      });

      if (!order) {
        throw new NotFoundException(
          `Orden con ID ${orderId} no encontrada o no está en estado de espera`,
        );
      }

      // Verificar que el distribuidor existe
      const distributor = await this.userRepository.findOne({
        where: {
          _id: new ObjectId(distributorId),
          role: UserRole.DISTRIBUTOR,
          status: true,
        },
      });

      if (!distributor) {
        throw new NotFoundException(
          `Distribuidor con ID ${distributorId} no encontrado`,
        );
      }

      // Actualizar la orden con el distribuidor asignado
      order.distributorId = distributorId.toString();
      order.status = statusPayment.ASIGNADO_DISTRIBUIDOR;

      // Guardar la orden actualizada
      const updatedOrder = await this.orderRepository.save(order);

      return updatedOrder;
    } catch (error) {
      Logger.error(
        `Error al asignar distribuidor: ${error.message}`,
        'AssignDistributor',
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Error al asignar distribuidor: ${error.message}`,
      );
    }
  }

  /**
   * Encuentra un distribuidor disponible con capacidad
   * @returns El primer distribuidor disponible con capacidad, o null si no hay ninguno
   */
  private async findAvailableDistributor(): Promise<User | null> {
    try {
      // Buscar distribuidores activos
      const distributors = await this.userRepository.find({
        where: {
          role: UserRole.DISTRIBUTOR,
          status: true,
        },
      });

      this.logger.log(
        `🔍 Buscando distribuidores disponibles. Encontrados: ${distributors.length}`,
      );

      if (distributors.length === 0) {
        this.logger.warn('⚠️ No hay distribuidores disponibles en el sistema');
        return null;
      }

      // Por ahora, simplemente devolvemos el primer distribuidor
      // En una implementación más avanzada, aquí verificaríamos la capacidad real
      // basándonos en la carga de trabajo actual y la capacidad máxima

      const selectedDistributor = distributors[0];
      this.logger.log(
        `✅ Distribuidor seleccionado: ${selectedDistributor.name} (ID: ${selectedDistributor._id})`,
      );

      return selectedDistributor;
    } catch (error) {
      this.logger.error(
        `❌ Error buscando distribuidor disponible: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Marca una orden como entregada por el distribuidor
   * @param orderId ID de la orden
   * @param distributorId ID del distribuidor que está marcando la entrega
   * @param observation Observación opcional sobre la entrega
   * @returns La orden actualizada
   */
  public async markOrderAsDelivered(
    orderId: string,
    distributorId: string,
    observation?: string,
  ): Promise<Order> {
    try {
      // Verificar que la orden existe y está asignada al distribuidor correcto
      const order = await this.orderRepository.findOne({
        where: {
          _id: new ObjectId(orderId),
          distributorId: distributorId,
          status: statusPayment.ASIGNADO_DISTRIBUIDOR,
        },
      });

      if (!order) {
        throw new NotFoundException(
          `Orden con ID ${orderId} no encontrada, no está asignada al distribuidor ${distributorId}, o no está en estado correcto`,
        );
      }

      // Actualizar la orden como entregada
      order.status = statusPayment.FINALIZADO_CON_EXITO;
      order.deliveryTime = new Date();

      if (observation) {
        order.deliveryObservation = observation;
      }

      // Guardar la orden actualizada
      const updatedOrder = await this.orderRepository.save(order);
      this.logger.log(
        `✅ Orden ${orderId} marcada como entregada por distribuidor ${distributorId}`,
      );

      return updatedOrder;
    } catch (error) {
      this.logger.error(
        `❌ Error al marcar orden como entregada: ${error.message}`,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Error al marcar orden como entregada: ${error.message}`,
      );
    }
  }

  /**
   * Obtiene las órdenes realizadas por un cliente específico
   * @param clientId ID del cliente
   * @param paginationDto Parámetros de paginación
   * @returns Lista paginada de órdenes del cliente
   */
  public async getClientOrders(
    clientId: string,
    { page = 1, limit = 10 }: PaginationDto,
  ): Promise<IPaginatedEmployees<Order>> {
    try {
      this.logger.log(`Buscando órdenes del cliente con ID: ${clientId}`);

      // Verificar que el usuario sea un cliente
      const client = await this.userRepository.findOne({
        where: {
          _id: new ObjectId(clientId),
          role: UserRole.CLIENT,
          status: true,
        },
      });

      if (!client) {
        this.logger.error(`Cliente con ID ${clientId} no encontrado`);
        throw new NotFoundException(`Cliente con ID ${clientId} no encontrado`);
      }

      // Calcular skip para paginación
      const skip = (page - 1) * limit;

      // Buscar órdenes del cliente
      const [orders, total] = await this.orderRepository.findAndCount({
        where: {
          customerId: clientId,
        },
        order: {
          createdAt: 'DESC', // Ordenar por fecha de creación, más recientes primero
        },
        skip,
        take: limit,
      });

      this.logger.log(
        `Se encontraron ${total} órdenes para el cliente ${clientId}`,
      );

      // Retornar la respuesta paginada
      return {
        body: orders,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        `❌ Error al obtener órdenes del cliente: ${error.message}`,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Error al obtener las órdenes del cliente: ${error.message}`,
      );
    }
  }
}
