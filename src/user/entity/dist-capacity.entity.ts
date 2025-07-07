import { Column, Entity, ObjectId, ObjectIdColumn } from "typeorm";

@Entity({name: 'dist_capacity'})
export class DistCapacity {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column({
    type: "number",
  })
  capacity: number;

  @Column({
    type: "varchar",
    length: 50,
  })
  type_vehicle: string;

  @Column({
    type: "varchar",
    length: 10,
  })
  cellphone: string;
}