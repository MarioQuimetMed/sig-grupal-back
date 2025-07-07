import { Transform } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";
import { HasMimeType, IsFile, MaxFileSize, MemoryStoredFile } from "nestjs-form-data";



export class ProductUpdateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsInt()
  stock?: number;
  
  @IsOptional()
  @IsNumber({
    maxDecimalPlaces: 2
  })
  price?: number;
}