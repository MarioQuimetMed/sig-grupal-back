import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MarkAsDeliveredDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  observation?: string;
}
