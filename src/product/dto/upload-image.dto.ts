import { IsOptional } from "class-validator";
import { HasMimeType, IsFile, MaxFileSize, MemoryStoredFile } from "nestjs-form-data";


export class UploadImageDto {
  @IsFile()
  @MaxFileSize(1e6)
  @HasMimeType(['image/*'])
  @IsOptional()
  photo: MemoryStoredFile;
}