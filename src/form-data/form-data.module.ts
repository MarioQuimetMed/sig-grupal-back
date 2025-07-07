import { Module } from '@nestjs/common';
import { formDataProvider } from './provider';

@Module({
  imports: [
    formDataProvider
  ]
})
export class FormDataModule {}
