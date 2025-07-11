import { Column, CreateDateColumn, Entity, ObjectId, ObjectIdColumn, UpdateDateColumn } from "typeorm";
import { DetailOrder } from "./detail_order.entity";
import { methodPayment, statusPayment } from "../constant";
import { User } from "src/user/entity";


@Entity()
export class Order{
  
  @ObjectIdColumn()
  _id: ObjectId;

  @Column({
    type: "varchar",
    length: 50,
    nullable: false
  })
  session_id: string;

  @Column({
    type: "int",
    nullable: false
  })
  quantity_total: number;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: false
  })
  total: number;

  @Column()
  detail: DetailOrder[];

  @Column(() => User)
  customer: User;

  @Column({
    type: "enum",
    enum: methodPayment,
    nullable: false,
  })
  method_payment: methodPayment;

    @Column({
    type: "enum",
    nullable: false,
    enum: statusPayment
  })
  status: statusPayment;


  @CreateDateColumn({
    type: "timestamp"
  })
  createdAt: Date;
  
  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt: Date;
}