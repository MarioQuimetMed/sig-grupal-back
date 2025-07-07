import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '../constant';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @MinLength(6)
  password: string;
}