import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthRoleGuard, AuthTokenGuard } from 'src/auth/guard';
import { ProductService } from '../services';
import { Roles } from 'src/auth/decorator';
import { UserRole } from 'src/user/constant';
import { PaginationDto } from 'src/common/dto';
import { IApiResponse } from 'src/common/interfaces';
import { IPaginatedEmployees } from 'src/user/interfaces';
import { Product } from '../entity';
import { FormDataRequest, MemoryStoredFile } from 'nestjs-form-data';
import { ProductCreateDto, ProductUpdateDto, UploadImageDto } from '../dto';
import { ParseOnjectIdPipe } from 'src/common/pipe';
import { User } from 'src/user/entity';

@Controller('product')
@UseGuards(AuthTokenGuard,AuthRoleGuard)
export class ProductController {

  constructor(
    private readonly productService: ProductService
  ){}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  public async findAllProducts(
    @Query() paginationDto: PaginationDto
  ):Promise<IApiResponse<IPaginatedEmployees<Product>>> {
    const statusCode = HttpStatus.OK;
    const allProducts = await this.productService.findAllEmployeds(paginationDto);

    return {
      statusCode,
      message: 'Productos obtenidos correctamente',
      data: allProducts
    }
  }

  @Roles(UserRole.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @FormDataRequest({
    storage: MemoryStoredFile,
  })
  public async createProduct(
    @Body() createProductDto: ProductCreateDto
  ):Promise<IApiResponse<Product>>{
    const statusCode = HttpStatus.CREATED;
    const product = await this.productService.createProduct(createProductDto);
    return {
      statusCode,
      message: 'Producto creado correctamente',
      data: product
    }
  }

  @Roles(UserRole.ADMIN)
  @Patch('update-image/:productId')
  @HttpCode(HttpStatus.OK)
  @FormDataRequest({
    storage: MemoryStoredFile,
  })
  public async updateImageProduct(
    @Body() body: UploadImageDto,
    @Param('productId', ParseOnjectIdPipe) productId: string
  ): Promise<IApiResponse<Product>> {
    const statusCode = HttpStatus.OK;
    const updateProduct = await this.productService.updateImage(body,productId);
    return {
      statusCode,
      message: 'Imagen del producto actualizada correctamente',
      data: updateProduct
    }
  }

  @Roles(UserRole.ADMIN)
  @Get(':productId')
  @HttpCode(HttpStatus.OK)
  public async GetProduct(
    @Param('productId', ParseOnjectIdPipe) productId: string
  ):Promise<IApiResponse<Product>>{
    const statusCode = HttpStatus.OK;
    const product = await this.productService.findProductId(productId);
    return {
      statusCode,
      data: product,
      message: 'Producto actualizado correctamente'
    }
  }
  
  @Roles(UserRole.ADMIN)
  @Patch(':productId')
  @HttpCode(HttpStatus.OK)
  public async updatedProduct(
    @Param('productId', ParseOnjectIdPipe) productId: string,
    @Body() updateProductDto: ProductUpdateDto
  ):Promise<IApiResponse<Product>>{
    const statusCode = HttpStatus.OK;
    const product = await this.productService.updateProduct(productId, updateProductDto);
    return {
      statusCode,
      data: product,
      message: 'Producto actualizado correctamente'
    }
  }

  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  @Delete(":productId")
  @HttpCode(HttpStatus.OK)
  public async deleteProduct(
    @Param('productId', ParseOnjectIdPipe) productId: string
  ){
    const statusCode = HttpStatus.OK;
    const product = await this.productService.deleteProduct(productId);
    return {
      statusCode,
      message: 'Producto eliminado correctamente',
      data: product
    }
  }
}

