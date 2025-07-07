import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/common/dto';
import { Product } from 'src/product/entity';
import { IPaginatedEmployees } from 'src/user/interfaces';
import { MongoRepository } from 'typeorm';

@Injectable()
export class SalesService {

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: MongoRepository<Product>
  ){}

  public async findAllProductss(paginationDto: PaginationDto): Promise<IPaginatedEmployees<Product>> {
      try{
        const { page = 1, limit = 10 } = paginationDto;
        const skip = (page - 1) * limit;
        const [products,total] = await this.productRepository.findAndCount({
          order: {
            updatedAt: 'DESC',
          },
          skip,
          take: limit,
          where: {
            status: true
          }
        })
        return {
          body: products,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
          }
        }
      }catch (err) {
        console.log(err);
        throw new InternalServerErrorException('Error al buscar los productos: '+ err);
      }
    }

}
