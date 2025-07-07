import { Transform } from "class-transformer";
import { IsDecimal, IsInt, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";
import { HasMimeType, IsFile, MaxFileSize, MemoryStoredFile } from "nestjs-form-data";



export class ProductCreateDto {
  @IsString()
  name: string;

  @IsString()
  @MaxLength(255)
  description: string;

  @Transform(({value})=> parseInt(value))
  @IsInt()
  stock: number;
  
  @Transform(({value})=> parseFloat(value))
  @IsNumber({
    maxDecimalPlaces: 2
  })
  price: number;

  @IsFile()
  @IsOptional()
  @MaxFileSize(1e6)
  @HasMimeType(['image/*'])
  photo?: MemoryStoredFile;

}