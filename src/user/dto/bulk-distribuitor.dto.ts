import { FileSystemStoredFile, HasMimeType, IsFile, MaxFileSize } from "nestjs-form-data";

export class BulkDistribuitorDto {

  @IsFile()
  @MaxFileSize(1e6)
  @HasMimeType(['text/csv', 'application/csv', 'application/vnd.ms-excel'])
  fileCsv: FileSystemStoredFile;
}