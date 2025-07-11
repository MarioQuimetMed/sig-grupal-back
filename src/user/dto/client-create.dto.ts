import { IsEmail, IsLatitude, IsLongitude, IsPhoneNumber, IsString, MinLength } from "class-validator";

export class ClientCreateDto {
  @IsEmail()
  email: string;
  
  @IsString()
  name: string;
    
  @IsString()
  @MinLength(6)
  password: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsString()
  @IsPhoneNumber("BO")
  cellphone: string;

  @IsString()
  address: string;

}