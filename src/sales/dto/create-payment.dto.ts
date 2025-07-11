import { IsArray, IsMongoId, IsOptional, IsString, ValidateNested } from "class-validator";
import { CartItemDto } from "./cart-item.dto";
import { Type } from "class-transformer";


export class CreatePaymentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @IsOptional()
  @IsString()
  currency?: string;

}