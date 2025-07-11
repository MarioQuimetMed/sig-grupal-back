import { IsInt, IsMongoId, IsString, Min } from "class-validator";
import { ObjectId } from "mongodb";




export class CartItemDto {
  @IsMongoId()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}