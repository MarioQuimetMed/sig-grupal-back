import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../entity';
import { MongoRepository, ObjectId } from 'typeorm';
import { AzureService } from './';
import { IPaginatedEmployees } from 'src/user/interfaces';
import { PaginationDto } from 'src/common/dto';
import { ProductCreateDto, ProductUpdateDto } from '../dto';
import { v4 as uuid } from 'uuid'; 
import { UploadImageDto } from '../dto/upload-image.dto';
import { ResponseFiles } from '../constant/response-files';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  private url_azure = "https://sigimgages.blob.core.windows.net/products/";
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: MongoRepository<Product>,
    private readonly azureService: AzureService,
  ){}


  public async findAllEmployeds(paginationDto: PaginationDto): Promise<IPaginatedEmployees<Product>> {
    try{
      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;
      const [products,total] = await this.productRepository.findAndCount({
        order: {
          updatedAt: 'DESC',
        },
        skip,
        take: limit,
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

  public async createProduct(createProductDto: ProductCreateDto): Promise<Product> {
    try{
      let photoUrl: string | null = null;
      const findProduct = await this.productRepository.find({
        where: {
          name: createProductDto.name
        }
      });
      if(findProduct.length > 0)
        throw new BadRequestException('El producto ya existe');
      
      if(createProductDto.photo){
        photoUrl = uuid() + '.webp';
        try{
          const uploadImg = await this.azureService.uploadFile(createProductDto.photo.buffer, photoUrl);
          if(uploadImg === "notUpload")
            throw new BadRequestException('No se pudo subir la imagen del producto');
        }catch (err) {
          if(err instanceof BadRequestException)
            throw err;

          throw new InternalServerErrorException('Error al subir la imagen, '+ err);
        }
        photoUrl = this.url_azure + photoUrl;
      }
      const createProduct = this.productRepository.create({
        name: createProductDto.name,
        description: createProductDto.description,
        price: createProductDto.price,
        stock: createProductDto.stock,
        img_url: photoUrl,
        status: true
      });

      return await this.productRepository.save(createProduct);
    }catch (err) {
      if(err instanceof BadRequestException)
        throw err;

      throw new InternalServerErrorException('Error al crear el producto: '+ err);
    }
  }

  public async findProductId(id: string): Promise<Product> {
    try{
      const findProduct = await this.productRepository.findOne({
        where: {
          _id: id
        }
      });

      if(!findProduct)
        throw new NotFoundException('El producto no existe');

      return findProduct;

    }catch(err) {
      if(err instanceof NotFoundException)
        throw err;

      throw new InternalServerErrorException('Error al buscar el producto: '+ err);
    }
  }

  public async updateImage(uploadImageDto: UploadImageDto, id: string): Promise<Product>{
    try{
      const findProduct = await this.findProductId(id);

      if(!findProduct.img_url)
        throw new BadRequestException('El producto no tiene una imagen para actualizar');

      if(!uploadImageDto.photo){
        const deleteImg = await this.azureService.deleteImage(findProduct.img_url);
  
        if(deleteImg === "sucess")
          this.logger.log('Imagen eliminada correctamente');
      }

      const photoUrl = uuid() + '.webp';
      const uploadImg = await this.azureService.uploadFile(uploadImageDto.photo.buffer,photoUrl);

      if(uploadImg === "notUpload"){ 
        this.logger.error('No se pudo subir la imagen del producto');
        throw new BadRequestException('No se pudo subir la imagen del producto');
      }
      this.logger.log('Imagen subida correctamente');
      //actualizo la url de la imagen del producto
      findProduct.img_url = photoUrl;
      this.logger.log('Url actualizada en el modelo del producto');

      return await this.productRepository.save(findProduct);
    }catch (err) {
      this.logger.error('Error al subir la imagen del producto: ' + err);
      if(err instanceof BadRequestException || err instanceof NotFoundException)
        throw err;

      throw new InternalServerErrorException('Error al subir la imagen del producto: ' + err);
    }
  }

  public async updateProduct(id: string, updateBody: ProductUpdateDto): Promise<Product> {
    try{
      const findProduct = await this.findProductId(id);
      const { name, description, stock, price } = updateBody;
      if(name)
        findProduct.name = name;
        this.logger.log('Nombre actualizado en el modelo del producto');
      if(description)
        findProduct.description = description;  
        this.logger.log('Descripcion actualizada en el modelo del producto');
      if(stock || stock === 0)
        findProduct.stock = stock;
      this.logger.log('Stock actualizado en el modelo del producto');
      if(price || price === 0)
        findProduct.price = price;  
        this.logger.log('Precio actualizado en el modelo del producto');

      return await this.productRepository.save(findProduct);
    }
    catch (err) {
      if(err instanceof NotFoundException)
        throw err;
      throw new BadRequestException('Error al actualizar el producto: ' + err);
    }
  }

  public async deleteProduct(id: string): Promise<Product> {
    try{
      const findProduct = await this.findProductId(id);
      
      findProduct.status = !findProduct.status

      return await this.productRepository.save(findProduct);
    }
    catch (err) {
      if(err instanceof NotFoundException)
        throw err;
      throw new BadRequestException('Error al actualizar el producto: ' + err);
    }
  }

}
