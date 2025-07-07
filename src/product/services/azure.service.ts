import { BlobServiceClient, BlockBlobClient, BlockBlobGetBlockListOptions, BlockBlobParallelUploadOptions } from '@azure/storage-blob';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseFiles } from '../constant/response-files';
import * as sharp from 'sharp';

@Injectable()
export class AzureService {
  private readonly container = "products";

  constructor(
    private readonly configService: ConfigService
  ){}

  private getBlockBlobClient(fileName: string): BlockBlobClient {
    const blobService = BlobServiceClient.fromConnectionString(
      this.configService.get<string>('connection_storage')
    );
    const blobContainer = blobService.getContainerClient(this.container);
    return blobContainer.getBlockBlobClient(fileName);
  }

  public async uploadFile(file: Buffer, fileName: string): Promise<keyof typeof ResponseFiles> {
    try{
      const blockBlobClient = this.getBlockBlobClient(fileName);
      const options: BlockBlobParallelUploadOptions = {
        blobHTTPHeaders: {
          blobContentType: 'image/webp', 
          blobCacheControl: 'public, max-age=31536000' 
        }
      }
      const upload = await blockBlobClient.uploadData(await this.processImage(file),options);
      const statusUpload = upload._response.status;
      if(statusUpload >= 200 && statusUpload < 300){
        return "sucess";
      }
      return "notUpload";
    }catch (error) {
      throw error;
    }
  }

  private async processImage(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .webp()
      .toBuffer();
  }

  public async getImageUrl(filename: string): Promise<string | keyof typeof ResponseFiles> {
    try {
      const blockBlobClient = this.getBlockBlobClient(filename);
      // Obtener la URL del blob
      const blobUrl = blockBlobClient.url;
      return blobUrl;
    }catch (err) {
      throw err;
    }
  }

  public async deleteImage(filename: string) :Promise<keyof typeof ResponseFiles>{
    try {
      const blockBlobClient = this.getBlockBlobClient(filename);
      await blockBlobClient.deleteIfExists();
      return "sucess"
    } catch (err) {
      throw err;
    }
  }
}
