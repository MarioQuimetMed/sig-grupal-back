import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/common/dto';
import { Product } from 'src/product/entity';
import { IPaginatedEmployees } from 'src/user/interfaces';
import { FindOperator, MongoRepository } from 'typeorm';
import * as stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

import { CartItemDto, CreatePaymentDto } from '../dto';
import { IPaymentResponse } from '../interface';
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
    @InjectRepository(User)
    private readonly userRepository: MongoRepository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: MongoRepository<Order>,
    private readonly configService: ConfigService
  ){
    this.stripe = new stripe.Stripe(this.configService.get<string>("stripe_key"));
  }

  public async findAllProductss(paginationDto: PaginationDto): Promise<IPaginatedEmployees<Product>> {
      try{
        const { page = 1, limit = 10 } = paginationDto;
        const skip = (page - 1) * limit;
        const [products,total] = await this.productRepository.findAndCount({
          order: {
            updatedAt: 'DESC',
          },
          skip,
          take: limit,
          where: {
            status: true
          }
        })
        return {
          body: products,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
          }
        }
      }catch (err) {
        console.log(err);
        throw new InternalServerErrorException('Error al buscar los productos: '+ err);
      }
  }

  public async findAllSales(paginationDto: PaginationDto): Promise<IPaginatedEmployees<Order>>{
    try{
      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;
      const [products,total] = await this.orderRepository.findAndCount({
        order: {
          updatedAt: 'DESC',
        },
        skip,
        take: limit,
      })
      return {
        body: products,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    }catch (err) {
      console.log(err);
      throw new InternalServerErrorException('Error al buscar los productos: '+ err);
    }
  }


  //#region  PAYMENTS
  public async createPaymentIntent(createPaymentDto: CreatePaymentDto,userId: string): Promise<IPaymentResponse>{
    try{
      const cartProducts = await this.validateAndGetCartProducts(createPaymentDto.items);
      this.logger.log(`Productos validados: ${cartProducts.map(p => p._id).join(', ')}`);
      // Crear line items para Stripe
      const lineItems = this.createStripeLineItems(cartProducts, createPaymentDto.items);
      this.logger.log(`Line items creados: ${JSON.stringify(lineItems)}`);
      // Crear sesión de pago
      const paymentSession =await this.createPaymentSession(lineItems, createPaymentDto.items, userId);
      this.logger.log(`Sesión de pago creada con ID: ${paymentSession.id}`);
      return {
        sessionId: paymentSession.id,
        url: paymentSession.url,
        paymentSession
      }
    }catch(err){
      if (err instanceof NotFoundException || err instanceof BadRequestException) {
        throw err;
      }
      throw new InternalServerErrorException(`Error al crear el pago: ${JSON.stringify(err)}`);
    }
  }


  private async createPaymentSession(
    lineItems: stripe.Stripe.Checkout.SessionCreateParams.LineItem[], 
    metadata: CartItemDto[], 
    userId: string
  ) {
    try{
      const sucessUrl = this.configService.get<string>("stripe_success_url");
      const cancelUrl = this.configService.get<string>("stripe_cancel_url");
      this.logger.log(`Creando sesión de pago con los siguientes items: ${JSON.stringify(lineItems)}`);
      const session = await this.stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: 'payment',
        success_url: sucessUrl,
        cancel_url: cancelUrl,
        metadata: {
          customerId: userId || '',
          products: JSON.stringify(metadata),
          orderType: 'product_purchase'
        }
      });
      return session;

    }catch(err){
      console.log(err);
      throw err;
    }
  }

  private createStripeLineItems(products: Product[], items: CartItemDto[]) {
    return items.map(item => {
      const product = products.find(p => p._id.toString() === item.productId);
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
            images: product.img_url ? [product.img_url] : []
          },
          unit_amount: Math.round(product.price * 100)
        },
        quantity: item.quantity
      };
    });
  }

  private async validateAndGetCartProducts(items: CartItemDto[]): Promise<Product[]> {
    this.logger.log(`Validando productos con IDs: ${items.map(i => i.productId).join(', ')}`);
    
    const products: Product[] = [];
    // Método rústico: buscar cada producto individualmente
    for (const item of items) {
      try {
        const product = await this.productRepository.findOne({
          where: {
            _id: new FindOperator("equal", ObjectId.createFromHexString(item.productId)).value
          }
        });
        if (!product) {
          this.logger.error(`Producto con ID ${item.productId} no encontrado`);
          throw new NotFoundException(`Producto con ID ${item.productId} no encontrado`);
        }
          
        if (product.stock < item.quantity) {
          this.logger.error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}, solicitado: ${item.quantity}`);
          throw new BadRequestException(
            `Stock insuficiente para ${product.name}. Stock disponible: ${product.stock}, solicitado: ${item.quantity}`
          );
        }
        products.push(product);
        this.logger.log(`Producto validado: ${product.name} (ID: ${product._id})`);
          
      } catch (error) {
        this.logger.error(`Error validando producto ${item.productId}: ${error.message}`);
        throw error;
      }
    }
    
    this.logger.log(`Todos los productos validados correctamente. Total: ${products.length}`);
    return products;
  }


  public async handleEventPayment(body: Buffer,signature: string){
    const webhookSecret = this.configService.get<string>('stripe_webhook_secret'); // Corregir el nombre
    console.log(webhookSecret);
    try{
      const event: stripe.Stripe.Event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
      this.logger.log(`🔔 Webhook recibido: ${event.type} - ID: ${event.id}`);
      switch (event.type) {
        case 'checkout.session.completed': 
          await this.paymentSucessCheckout(event.data.object as stripe.Stripe.Checkout.Session);
          break;
        default:
          break;
      }
    }
    catch(err){
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
          _id: new FindOperator("equal", ObjectId.createFromHexString(metadata.customerId)).value,
          role: UserRole.CLIENT
        }
      });

      if (!customer) {
        this.logger.error(`Cliente con ID ${metadata.customerId} no encontrado`);
        throw new NotFoundException(`Cliente con ID ${metadata.customerId} no encontrado`);
      }

      this.logger.log(`👤 Cliente encontrado: ${customer.name} (${customer.email})`);

      // 2. Obtener y validar productos, y crear detalles
      const orderDetails: DetailOrder[] = [];
      let quantityTotal = 0;
      let totalAmount = 0;

      for (const item of items) {
        const product = await this.productRepository.findOne({
          where: {
            _id: new FindOperator("equal", ObjectId.createFromHexString(item.productId)).value
          }
        });

        if (!product) {
          this.logger.error(`Producto con ID ${item.productId} no encontrado`);
          throw new NotFoundException(`Producto con ID ${item.productId} no encontrado`);
        }

        if (product.stock < item.quantity) {
          this.logger.error(`Stock insuficiente para ${product.name}`);
          throw new BadRequestException(
            `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, solicitado: ${item.quantity}`
          );
        }

        // Crear detalle con snapshot del producto
        const subtotal = product.price * item.quantity;

        const detail: DetailOrder = {
          product : product._id,
          quantity : item.quantity,
          subtotal : subtotal
        }

        orderDetails.push(detail);
        quantityTotal += item.quantity;
        totalAmount += subtotal;

        this.logger.log(`📝 Detalle creado para: ${product.name} x ${item.quantity} = $${subtotal}`);
      }

      // 3. Crear la orden completa
      const order = this.orderRepository.create({
        session_id: session.id,
        quantity_total: quantityTotal,
        total: session.amount_total / 100, // Stripe envía en centavos
        detail: orderDetails,
        customer: customer,
        method_payment: methodPayment.TARJETA, // Método de pago por tarjeta
        status: statusPayment.ESPERANDO_ASIGNACION, // Estado inicial
      });

      // 4. Guardar la orden
      const savedOrder = await this.orderRepository.save(order);
      this.logger.log(`✅ Orden creada exitosamente: ${savedOrder._id}`);

      // 5. Actualizar stock de productos
      await this.updateProductsStock(items);

      // 6. Log de resumen
      this.logger.log(`📊 RESUMEN DE ORDEN:`);
      this.logger.log(`🆔 ID: ${savedOrder._id}`);
      this.logger.log(`👤 Cliente: ${customer.name}`);
      this.logger.log(`📦 Total items: ${quantityTotal}`);
      this.logger.log(`💰 Total: $${savedOrder.total}`);
      this.logger.log(`🏷️ Estado: ${statusPayment.ESPERANDO_ASIGNACION}`);
      this.logger.log(`💳 Método pago: ${methodPayment.TARJETA}`);

      return savedOrder;

    } catch (err) {
      this.logger.error(`❌ Error procesando pago: ${err.message}`);
      throw new InternalServerErrorException(`Error al procesar el pago: ${err.message}`);
    }
  }

// Método para actualizar stock de productos
  private async updateProductsStock(items: CartItemDto[]): Promise<void> {
    this.logger.log(`📦 Actualizando stock de ${items.length} productos`);

    for (const item of items) {
      try {
        const product = await this.productRepository.findOne({
          where: {
            _id: new FindOperator("equal", ObjectId.createFromHexString(item.productId)).value
          },
        });

        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          product.stock = newStock;
          await this.productRepository.save(product);

          this.logger.log(`📈 Stock actualizado para ${product.name}: ${product.stock} → ${newStock}`);
          
          // Alerta si stock crítico
          if (newStock <= 5) {
            this.logger.warn(`⚠️ Stock crítico para ${product.name}: ${newStock} unidades restantes`);
          }
          
          if (newStock === 0) {
            this.logger.warn(`🚫 Producto agotado: ${product.name}`);
          }
        }
      } catch (error) {
        this.logger.error(`❌ Error actualizando stock del producto ${item.productId}: ${error.message}`);
        // No lanzar error para no fallar toda la operación
      }
    }
    this.logger.log(`✅ Stock actualizado para todos los productos`);
  }
  //#endregion
}
