import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { FileSystemStoredFile, FormDataRequest } from 'nestjs-form-data';

import { IPaginatedEmployees, IResponseBulkCreateDist } from '../interfaces';
import { IApiResponse } from 'src/common/interfaces';
import { EmployeedService } from '../services';
import { PaginationDto } from 'src/common/dto';
import { User } from '../entity';
import { AuthRoleGuard, AuthTokenGuard } from 'src/auth/guard';
import { Roles } from 'src/auth/decorator';
import { UserRole } from '../constant';
import { BulkDistribuitorDto, CreateDistribuitorDto } from '../dto';
import { ParseOnjectIdPipe } from 'src/common/pipe';

@Controller('distribuitors')
@UseGuards(AuthTokenGuard, AuthRoleGuard)
export class EmployeesController {
  constructor(private readonly employeedService: EmployeedService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  public async getEmployees(
    @Query() paginationDto: PaginationDto,
    @Req() req: Request,
  ): Promise<IApiResponse<IPaginatedEmployees<User>>> {
    const statusCode = HttpStatus.OK;
    const userId = req.userId; // Get the userId from the request object
    // Simulating a service call to get employees
    const employees = await this.employeedService.findAllEmployeds(
      paginationDto,
      userId,
    );

    return {
      statusCode,
      message: 'Lista de empleados obtenida exitosamente',
      data: employees,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN)
  public async createDistribuitor(
    @Body() createDistribuitorDto: CreateDistribuitorDto,
  ): Promise<IApiResponse<User>> {
    const statusCode = HttpStatus.CREATED;
    // Simulating a service call to create a distribuitor
    const distribuitor = await this.employeedService.createDistribuitor(
      createDistribuitorDto,
    );
    return {
      statusCode,
      message: 'Distribuidor creado exitosamente',
      data: distribuitor,
    };
  }

  @Roles(UserRole.ADMIN)
  @Post('bulk-create-distribuitors')
  @HttpCode(HttpStatus.CREATED)
  @FormDataRequest({
    storage: FileSystemStoredFile,
  })
  public async bulkCreateDistribuitors(
    @Body() bulkDistribuitorDto: BulkDistribuitorDto,
  ): Promise<IApiResponse<IResponseBulkCreateDist>> {
    const statusCode = HttpStatus.CREATED;
    const bulkCreateDistribuitors =
      await this.employeedService.createBulkDistribuitors(bulkDistribuitorDto);

    return {
      statusCode,
      message: `Se crearon ${bulkCreateDistribuitors.total} distribuidores exitosamente`,
      data: bulkCreateDistribuitors,
    };
  }

  @Roles(UserRole.ADMIN)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  public async updateDistribuitor(
    @Param('id', ParseOnjectIdPipe) id: string,
    @Body() updateDistribuitorDto: CreateDistribuitorDto,
  ): Promise<IApiResponse<User>> {
    const statusCode = HttpStatus.OK;
    const distribuitor = await this.employeedService.updatedDistribuitor(
      id,
      updateDistribuitorDto,
    );
    return {
      statusCode,
      message: 'Distribuidor actualizado exitosamente',
      data: distribuitor,
    };
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  public async deleteDistribuitor(
    @Param('id', ParseOnjectIdPipe) id: string,
  ): Promise<IApiResponse<User>> {
    const statusCode = HttpStatus.OK;
    const distribuitor = await this.employeedService.deleteDistribuitor(id);
    return {
      statusCode,
      message: 'Distribuidor eliminado exitosamente',
      data: distribuitor,
    };
  }
}
