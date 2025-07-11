import { Column, Entity, ObjectIdColumn } from "typeorm";
import { ObjectId } from "mongodb";


export class DetailOrder {

  @Column({
    type: "int",
    nullable: false
  })
  quantity: number;

  @Column()
  product: ObjectId;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: false
  })
  subtotal: number;

}