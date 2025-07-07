import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository, Repository } from 'typeorm';
import { ObjectId } from 'mongodb';

import { User } from '../entity';
import { CreateUserDto } from '../dto';

@Injectable()
export class UserService {

  constructor(
      @InjectRepository(User)
      private readonly userRepostitory: MongoRepository<User>,
  ){}



  public async findUserById(id: string): Promise<User> {
    try{
      const findEmployeedId = await this.userRepostitory.findOne({where: {_id: new ObjectId(id)}});

      if(!findEmployeedId)
        throw new NotFoundException(`Usuario con id ${id} no encontrado`);

      return findEmployeedId;
    }catch (err) {
      if(err instanceof NotFoundException) 
        throw err;

      throw new InternalServerErrorException(`Error al buscar el empleado con id ${id}`, err);
    }
  }

  public async findUserByEmail(email: string): Promise<User> {
    try{
      const findEmpl = await this.userRepostitory.findOne({
        where:{
          email,
        }
      });

      return findEmpl;
    }catch (err) {
      throw new InternalServerErrorException(`Error al buscar el empleado con email ${email}`, err);
    }
  }

  public hashPass(password: string, saltRounds: number = 10): string {
    const salt =  bcrypt.genSaltSync(saltRounds);
    return bcrypt.hashSync(password, salt);
  }

  public async createUser(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Verificar si el email ya existe
      const existingUser = await this.findUserByEmail(createUserDto.email);
      if (existingUser) {
        throw new BadRequestException(`El usuario con email ${createUserDto.email} ya existe`);
      }

      const newUser = this.userRepostitory.create({
        ...createUserDto,
        password: this.hashPass(createUserDto.password)
      });

      const savedUser = await this.userRepostitory.save(newUser);
      
      // Log de creación
      Logger.log(`Se creó el usuario ${savedUser.name}`, 'CreateUser');

      return savedUser;

    } catch (error) {
      if(error instanceof BadRequestException) 
        throw error;

      Logger.error(`Error al crear usuario: ${error.message}`, 'CreateUser');
      throw new InternalServerErrorException('Error al crear el usuario');
    }
  }
}
