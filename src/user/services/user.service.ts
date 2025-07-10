import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOperator, MongoRepository, Repository } from 'typeorm';
import { ObjectId } from 'mongodb';

import { User } from '../entity';
import { ClientCreateDto, ClientUpdateDto, CreateUserDto } from '../dto';
import { UserRole } from '../constant';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

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

  public async signUpCliente(clientCreateDto: ClientCreateDto): Promise<User>{  
    try{
      const findUser = await this.userRepostitory.findOne({
        where: {
          email: clientCreateDto.email,
        }
      });
      this.logger.log(`Buscando usuario con email: ${clientCreateDto.email}`, 'CreateClient');
      if(findUser){
        throw new BadRequestException("Ya esta en uso este email");
      }
      const hashPass = this.hashPass(clientCreateDto.password);

      const newClient = this.userRepostitory.create({
        name: clientCreateDto.name,
        email: clientCreateDto.email,
        role: UserRole.CLIENT,
        password: hashPass,
        client_detail: {
          address: clientCreateDto.address,
          cellphone: clientCreateDto.cellphone,
          coordinates: {
            latitude: clientCreateDto.latitude,
            longitude: clientCreateDto.longitude
          }
        }
      });
      this.logger.log(`Creando nuevo cliente: ${newClient.name}`, 'CreateClient');
      return this.userRepostitory.save(newClient);
    }
    catch (err) {
      if(err instanceof BadRequestException)
        throw err;

      this.logger.error(`Error al crear cliente: ${err.message}`, 'CreateClient');
      throw new InternalServerErrorException('Error al crear el cliente');
    }
  }

  public async updateClient(clientId: string, clientUpdateDto: ClientUpdateDto): Promise<User> {
  try {
    this.logger.log(`Actualizando cliente con ID: ${clientId}`, 'UpdateClient');

    // 1. Verificar que el cliente existe
    const existingClient = await this.userRepostitory.findOne({
      where: { 
        _id: new FindOperator("equal", ObjectId.createFromHexString(clientId)).value,
        role: UserRole.CLIENT 
      }
    });

    if (!existingClient) {
      throw new NotFoundException(`Cliente con ID ${clientId} no encontrado`);
    }

    // 2. Verificar email único si se está actualizando
    if (clientUpdateDto.email && clientUpdateDto.email !== existingClient.email) {
      const emailExists = await this.userRepostitory.findOne({
        where: { email: clientUpdateDto.email }
      });

      if (emailExists) {
        throw new BadRequestException(`El email ${clientUpdateDto.email} ya está en uso`);
      }
    }

    // 3. Preparar datos de actualización
    const updateData: any = {};

    if (clientUpdateDto.name) updateData.name = clientUpdateDto.name;
    if (clientUpdateDto.email) updateData.email = clientUpdateDto.email;
    
    if (clientUpdateDto.password) {
      updateData.password = this.hashPass(clientUpdateDto.password);
    }

    // Actualizar client_detail si hay cambios
    if (clientUpdateDto.address || clientUpdateDto.cellphone || 
        clientUpdateDto.latitude !== undefined || clientUpdateDto.longitude !== undefined) {
      
      updateData.client_detail = {
        ...existingClient.client_detail,
        ...(clientUpdateDto.address && { address: clientUpdateDto.address }),
        ...(clientUpdateDto.cellphone && { cellphone: clientUpdateDto.cellphone }),
        coordinates: {
          latitude: clientUpdateDto.latitude ?? existingClient.client_detail?.coordinates?.latitude,
          longitude: clientUpdateDto.longitude ?? existingClient.client_detail?.coordinates?.longitude
        }
      };
    }

    // 4. Realizar la actualización
    await this.userRepostitory.update(
      { _id: new FindOperator("equal", ObjectId.createFromHexString(clientId)).value },
      updateData
    );

    // 5. Obtener cliente actualizado
    const updatedClient = await this.userRepostitory.findOne({
      where: { _id: new FindOperator("equal", ObjectId.createFromHexString(clientId)).value }
    });

    this.logger.log(`Cliente actualizado exitosamente: ${updatedClient.name}`, 'UpdateClient');
    return updatedClient;

  } catch (err) {
    if (err instanceof NotFoundException || err instanceof BadRequestException) {
      throw err;
    }

    this.logger.error(`Error al actualizar cliente: ${err.message}`, 'UpdateClient');
    throw new InternalServerErrorException('Error al actualizar el cliente');
  }
}
}
