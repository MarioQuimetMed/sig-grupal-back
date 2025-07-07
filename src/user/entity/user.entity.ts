import { Column, ColumnTypeUndefinedError, CreateDateColumn, Entity, ObjectId, ObjectIdColumn, UpdateDateColumn } from "typeorm";
import { DistCapacity } from "./dist-capacity.entity";
import { ClientAddress } from "./client-address.entity";
import { UserRole } from "../constant";

@Entity()
export class User {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column({
    type: "varchar",
    length: 50,
  })
  name: string;

  @Column({
    type: "varchar",
    length: 50,
    unique: true,
  })
  email: string;

  @Column({
    nullable: false,
  })
  password: string;
  
  @Column({
    type: "boolean",
    default: true,
  })
  status: boolean = true;

  @Column({
    type: "enum",
    enum: UserRole,
    nullable: false,
  })
  role: UserRole;

  @Column(() => DistCapacity)
  distribuitor?: DistCapacity;  

  @Column(()=> ClientAddress)
  client_detail?: ClientAddress;


  @CreateDateColumn({
    type: "timestamp"
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt: Date;


}


