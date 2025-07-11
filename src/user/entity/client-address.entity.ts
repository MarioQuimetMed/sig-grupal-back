import { Column, ObjectId, ObjectIdColumn } from "typeorm";

export class ClientAddress {

  @Column({
    type: "point", // Para coordenadas geográficas
    nullable: true,
  })
  coordinates: {
    latitude: number;
    longitude: number;
  };

  @Column({
    type: "varchar",
    length: 50,
  })
  address: string;

  @Column({
    type: "varchar",
    length: 10,
  })
  cellphone: string;
}