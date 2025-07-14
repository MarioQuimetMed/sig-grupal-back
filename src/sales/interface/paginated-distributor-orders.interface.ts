import { Order } from '../entity';

export interface IPaginatedDistributorOrders {
  body: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
