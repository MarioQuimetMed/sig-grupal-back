import { Column, CreateDateColumn, Entity, ObjectId, ObjectIdColumn, UpdateDateColumn } from "typeorm";


@Entity()
export class Product {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column({
    type: "varchar",
    length: 50,
    nullable: false
  })
  name: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false
  })
  description: string;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: false
  })
  price: number;

  @Column({
    type: "int",
    nullable: false
  })
  stock: number;
  
  @Column({
    type: "boolean",
    default: true
  })
  status: boolean;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true
  })
  img_url?: string;

  @CreateDateColumn({
    default: "now()",
  })
  createdAt: Date;

  @UpdateDateColumn({
    default: "now()",
    onUpdate: "now()"
  })
  updatedAt: Date;

}