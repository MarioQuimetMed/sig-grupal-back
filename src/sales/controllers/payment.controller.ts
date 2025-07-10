import { Controller, Headers, HttpCode, HttpStatus, Post, RawBody } from '@nestjs/common';
import { SalesService } from '../services';

@Controller('payment')
export class PaymentController {

  constructor(
    private readonly salesService: SalesService
  ){}


  @Post('payment-webhook')
  @HttpCode(HttpStatus.OK)
  public async paymentWebhook(
    @RawBody() body: Buffer,
    @Headers('stripe-signature') signature: string
  ): Promise<string> {
    await this.salesService.handleEventPayment(body, signature);
    return "Order Sucessfully Created";
  }
}
