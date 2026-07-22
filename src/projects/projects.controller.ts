import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, Status } from '@prisma/client';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

interface AuthenticatedUser {
  id: number;
  role: Role;
}

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles(Role.PYME)
  @UseGuards(RolesGuard)
  @ApiHeader({
    name: 'x-user-id',
    required: true,
    description: 'ID del usuario PYME (usa 1 con los datos demo)',
    schema: { type: 'integer', example: 1 },
  })
  @ApiHeader({
    name: 'x-user-role',
    required: true,
    description: 'Rol requerido para crear el proyecto',
    schema: { type: 'string', enum: [Role.PYME], example: Role.PYME },
  })
  @ApiOperation({ summary: 'Crear un nuevo proyecto (Solo PYMES)' })
  @ApiResponse({
    status: 201,
    description: 'Proyecto creado exitosamente.',
    type: Project,
  })
  @ApiResponse({
    status: 400,
    description: 'Petición incorrecta (ej. deadline en el pasado).',
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido. Solo las PYMES pueden publicar proyectos.',
  })
  create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.create(createProjectDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los proyectos (Público)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de proyectos devuelta exitosamente.',
    type: Project,
    isArray: true,
  })
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un proyecto por su ID (Público)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Proyecto encontrado.',
    type: Project,
  })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.PYME, Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiHeader({
    name: 'x-user-id',
    required: true,
    description: 'ID del dueño del proyecto o de un administrador',
    schema: { type: 'integer', example: 1 },
  })
  @ApiHeader({
    name: 'x-user-role',
    required: true,
    description: 'Rol del usuario que realiza la operación',
    schema: {
      type: 'string',
      enum: [Role.PYME, Role.ADMIN],
      example: Role.PYME,
    },
  })
  @ApiOperation({ summary: 'Modificar un proyecto (Solo el dueño o ADMIN)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Proyecto actualizado exitosamente.',
    type: Project,
  })
  @ApiResponse({
    status: 403,
    description: 'No eres el dueño o no tienes permisos.',
  })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado.' })
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.update(+id, updateProjectDto, user);
  }

  @Delete(':id')
  @Roles(Role.PYME, Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiHeader({
    name: 'x-user-id',
    required: true,
    description: 'ID del dueño del proyecto o de un administrador',
    schema: { type: 'integer', example: 1 },
  })
  @ApiHeader({
    name: 'x-user-role',
    required: true,
    description: 'Rol del usuario que realiza la operación',
    schema: {
      type: 'string',
      enum: [Role.PYME, Role.ADMIN],
      example: Role.PYME,
    },
  })
  @ApiOperation({ summary: 'Eliminar un proyecto (Solo el dueño o ADMIN)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Proyecto eliminado exitosamente.',
    type: Project,
  })
  @ApiResponse({
    status: 403,
    description: 'No eres el dueño o no tienes permisos.',
  })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado.' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.remove(+id, user);
  }

  @Patch(':id/status')
  @Roles(Role.PYME, Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiHeader({
    name: 'x-user-id',
    required: true,
    description: 'ID del dueño del proyecto o de un administrador',
    schema: { type: 'integer', example: 1 },
  })
  @ApiHeader({
    name: 'x-user-role',
    required: true,
    description: 'Rol del usuario que realiza la operación',
    schema: {
      type: 'string',
      enum: [Role.PYME, Role.ADMIN],
      example: Role.PYME,
    },
  })
  @ApiOperation({
    summary: 'Cambiar el estado de un proyecto (Máquina de Estados)',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(Status),
          example: 'ACTIVE',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del proyecto modificado exitosamente.',
    type: Project,
  })
  @ApiResponse({ status: 400, description: 'Transición de estado no válida.' })
  @ApiResponse({ status: 403, description: 'No tienes permisos.' })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado.' })
  transitionStatus(
    @Param('id') id: string,
    @Body('status') status: Status,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!status) {
      throw new BadRequestException('El campo status es requerido.');
    }
    return this.projectsService.transitionStatus(+id, status, user);
  }
}
