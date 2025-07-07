import { FileSystemStoredFile, NestjsFormDataModule } from "nestjs-form-data";



export const formDataProvider = NestjsFormDataModule.configAsync({
  useFactory: ()=> ({
    storage: FileSystemStoredFile,
    fileSystemStoragePath: '/tmp'
  }),
  isGlobal: true,
})