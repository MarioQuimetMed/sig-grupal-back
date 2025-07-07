import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ObjectId } from 'mongodb';

@Injectable()
export class ParseOnjectIdPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata) {

    if(!ObjectId.isValid(value)) 
      throw new BadRequestException(`Invalido ObjectId: ${value}`);
 
    const objectId = ObjectId.createFromHexString(value);
    return objectId;
  }
}
