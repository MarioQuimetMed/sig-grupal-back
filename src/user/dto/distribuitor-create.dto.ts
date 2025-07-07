import { IsEmail, IsInt, IsPhoneNumber, IsString, Min } from "class-validator";

export class CreateDistribuitorDto {
  @IsString()
  name: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsInt()
  @Min(5)
  capacity: number;

  @IsString()
  type_vehicle: string;

  @IsString()
  @IsPhoneNumber("BO")
  cellphone: string;
}