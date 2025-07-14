import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dto';
import { statusPayment } from '../constant';

export class GetDistributorOrdersDto extends PaginationDto {
  @IsEnum(statusPayment)
  @IsOptional()
  status?: statusPayment; // Filtro opcional por estado
}
