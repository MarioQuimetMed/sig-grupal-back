import {
  Column,
  CreateDateColumn,
  Entity,
  ObjectId,
  ObjectIdColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DetailOrder } from './detail_order.entity';
import { methodPayment, statusPayment } from '../constant';

@Entity()
export class Order {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  session_id: string;

  @Column({
    type: 'int',
    nullable: false,
  })
  quantity_total: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  total: number;

  @Column()
  detail: DetailOrder[];

  @Column({
    nullable: false,
  })
  customerId: string; // Solo almacenamos el ID del cliente

  @Column({
    nullable: true,
  })
  distributorId?: string; // Solo almacenamos el ID del distribuidor

  @Column({
    type: 'enum',
    enum: methodPayment,
    nullable: false,
  })
  method_payment: methodPayment;

  @Column({
    type: 'enum',
    nullable: false,
    enum: statusPayment,
  })
  status: statusPayment;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 6,
    nullable: true,
  })
  latitude?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 6,
    nullable: true,
  })
  longitude?: number;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  deliveryTime?: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  deliveryObservation?: string;

  @CreateDateColumn({
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt: Date;
}
