import * as stripe from 'stripe';



export interface IPaymentResponse {
  sessionId: string;
  url: string;
  paymentSession: stripe.Stripe.Response<stripe.Stripe.Checkout.Session>;
}