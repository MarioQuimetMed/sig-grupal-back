import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import * as fs from 'fs';

import { UserService } from './user.service';
import { UserRole } from '../constant';
import { PaginationDto } from 'src/common/dto';
import { IPaginatedEmployees, IResponseBulkCreateDist } from '../interfaces';
import { DistCapacity, User } from '../entity';
import { BulkDistribuitorDto, CreateDistribuitorDto } from '../dto';
import { converCsvToJson } from 'src/utils';

@Injectable()
export class EmployeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepostitory: MongoRepository<User>,
    @InjectRepository(DistCapacity)
    private readonly distCapacityRepostitory: MongoRepository<DistCapacity>,
    private readonly userService: UserService,
  ) {}

  public async findAllEmployeds(
    paginationDto: PaginationDto,
    userId: string,
  ): Promise<IPaginatedEmployees<User>> {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;
      const [employees, total] = await this.userRepostitory.findAndCount({
        where: {
          role: UserRole.DISTRIBUTOR,
          // _id: { $ne: userId },
        },
        order: {
          updatedAt: 'DESC',
        },
        skip,
        take: limit,
      });
      // console.log(employees);
      return {
        body: employees,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(
        'Error al buscar los empleados: ' + err,
      );
    }
  }

  public async createDistribuitor(
    createDistribuitorDto: CreateDistribuitorDto,
  ): Promise<User> {
    try {
      // Verificar si el email ya existe
      const existingUser = await this.userService.findUserByEmail(
        createDistribuitorDto.email,
      );
      if (existingUser) {
        throw new NotFoundException(
          `El usuario con email ${createDistribuitorDto.email} ya existe`,
        );
      }

      // Crear el nuevo distribuidor
      const distCapacity = await this.distCapacityRepostitory.save(
        this.distCapacityRepostitory.create({
          capacity: createDistribuitorDto.capacity,
          type_vehicle: createDistribuitorDto.type_vehicle,
          cellphone: createDistribuitorDto.cellphone,
        }),
      );
      const newDistribuitor = this.userRepostitory.create({
        distribuitor: distCapacity,
        name: createDistribuitorDto.name,
        email: createDistribuitorDto.email,
        role: UserRole.DISTRIBUTOR,
        password: this.userService.hashPass(
          `${createDistribuitorDto.name[0]}.${createDistribuitorDto.cellphone}`,
        ), // Asignar una contraseña por defecto
      });
      return await this.userRepostitory.save(newDistribuitor);
    } catch (err) {
      console.log(err);
      if (err instanceof NotFoundException) throw err;

      throw new InternalServerErrorException(
        `Error al crear el distribuidor: ${err.message}`,
      );
    }
  }

  public async createBulkDistribuitors(
    bulkDistribuitorDto: BulkDistribuitorDto,
  ): Promise<IResponseBulkCreateDist> {
    try {
      const bulkDistribuitor = await converCsvToJson(
        bulkDistribuitorDto.fileCsv.path,
      );
      const distribuitors = bulkDistribuitor.map((dist) => ({
        name: dist['Nombre'],
        email: dist['Correo electronico'],
        capacity: Number(dist['capacidad']),
        type_vehicle: dist['tipo vehiculo'],
        cellphone: dist['celular'],
      })) as CreateDistribuitorDto[];
      let total: number = 0;
      const messages: string[] = [];
      for (const dist of distribuitors) {
        const existingUser = await this.userRepostitory.findOne({
          where: {
            email: dist.email,
            role: UserRole.DISTRIBUTOR,
          },
        });
        if (!existingUser) {
          // Crear DistCapacity
          const distCapacity = await this.distCapacityRepostitory.save(
            this.distCapacityRepostitory.create({
              capacity: dist.capacity,
              type_vehicle: dist.type_vehicle,
              cellphone: dist.cellphone,
            }),
          );
          // Crear Usuario
          await this.userRepostitory.save(
            this.userRepostitory.create({
              distribuitor: distCapacity,
              name: dist.name,
              email: dist.email,
              role: UserRole.DISTRIBUTOR,
              password: this.userService.hashPass(
                `${dist.name[0]}.${dist.cellphone}`,
              ),
            }),
          );
          total++;
        } else {
          messages.push(
            `El distribuidor con email ${dist.email} ya existe y no se creó.`,
          );
        }
      }
      return {
        total,
        messages,
        created: new Date(),
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(
        `Error al crear los distribuidores: ${err.message}`,
      );
    } finally {
      // Limpiar archivo temporal
      try {
        await fs.promises.unlink(bulkDistribuitorDto.fileCsv.path);
      } catch (error) {
        Logger.error(
          `Error deleting temp file: ${error.message}`,
          'BulkCreate',
        );
      }
    }
  }

  public async updatedDistribuitor(
    id: string,
    updateDistribuitorDto: CreateDistribuitorDto,
  ): Promise<User> {
    try {
      // Buscar el distribuidor existente
      const existingUser = await this.userRepostitory.findOne({
        where: {
          _id: id,
          role: UserRole.DISTRIBUTOR,
        },
      });

      if (!existingUser) {
        throw new NotFoundException(`Distribuidor con id ${id} no encontrado`);
      }

      // Verificar si el nuevo email ya existe (solo si se está cambiando)
      if (updateDistribuitorDto.email !== existingUser.email) {
        const emailExists = await this.userService.findUserByEmail(
          updateDistribuitorDto.email,
        );
        if (emailExists) {
          throw new BadRequestException(
            `El email ${updateDistribuitorDto.email} ya está en uso`,
          );
        }
      }

      // Actualizar DistCapacity
      if (existingUser.distribuitor) {
        await this.distCapacityRepostitory.update(
          { _id: existingUser.distribuitor._id },
          {
            capacity: updateDistribuitorDto.capacity,
            type_vehicle: updateDistribuitorDto.type_vehicle,
            cellphone: updateDistribuitorDto.cellphone,
          },
        );
      }

      // Actualizar usuario
      const updatedUser = await this.userRepostitory.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            name: updateDistribuitorDto.name,
            email: updateDistribuitorDto.email,
            updatedAt: new Date(),
          },
        },
        { returnDocument: 'after' },
      );

      Logger.log(
        `Distribuidor ${id} actualizado exitosamente`,
        'UpdateDistribuitor',
      );
      return updatedUser as User;
    } catch (err) {
      Logger.error(
        `Error actualizando distribuidor: ${err.message}`,
        'UpdateDistribuitor',
      );

      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(
        `Error al actualizar el distribuidor: ${err.message}`,
      );
    }
  }

  public async deleteDistribuitor(id: string): Promise<User> {
    try {
      // Buscar el distribuidor existente
      const existingUser = await this.userRepostitory.findOne({
        where: {
          _id: id,
          role: UserRole.DISTRIBUTOR,
        },
      });

      if (!existingUser) {
        throw new NotFoundException(`Distribuidor con id ${id} no encontrado`);
      }

      // Eliminar el distribuidor
      const deletedUser = await this.userRepostitory.findOneAndUpdate(
        { _id: id },
        { $set: { status: false, updatedAt: new Date() } },
      );

      if (!deletedUser) {
        throw new InternalServerErrorException(
          `Error al eliminar el distribuidor con id ${id}`,
        );
      }

      Logger.log(
        `Distribuidor ${id} eliminado exitosamente`,
        'DeleteDistribuitor',
      );
      return deletedUser as User;
    } catch (err) {
      Logger.error(
        `Error eliminando distribuidor: ${err.message}`,
        'DeleteDistribuitor',
      );
      throw new InternalServerErrorException(
        `Error al eliminar el distribuidor: ${err.message}`,
      );
    }
  }
  //#region Create Admin App
  public async createAdminRunApp(): Promise<void> {
    try {
      const admin = await this.userService.findUserByEmail('admin@gmail.com');
      if (!admin) {
        const createAdmin = this.userRepostitory.create({
          email: 'admin@gmail.com',
          name: 'Admin',
          role: UserRole.ADMIN,
          password: this.userService.hashPass('123456'),
        });
        await this.userRepostitory.save(createAdmin);
        Logger.log(
          `Se creo el usuario ${createAdmin.name} para el sistema.`,
          'InstanceApp',
        );
      }
    } catch (err) {
      throw err;
    }
  }

  public async createClientRunApp(): Promise<void> {
    try {
      const admin = await this.userService.findUserByEmail(
        'erickaricari@gmail.com',
      );
      if (!admin) {
        const createAdmin = this.userRepostitory.create({
          email: 'erickaricari@gmail.com',
          name: 'Erick17',
          role: UserRole.CLIENT,
          password: this.userService.hashPass('123456'),
        });
        await this.userRepostitory.save(createAdmin);
        Logger.log(
          `Se creo el cliente ${createAdmin.name} para el sistema.`,
          'InstanceApp',
        );
      }
    } catch (err) {
      throw err;
    }
  }
  //#endregion
}
