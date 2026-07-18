import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, BadRequestException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, Status } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader, ApiBody } from '@nestjs/swagger';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles(Role.PYME)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-user-id', required: false, description: 'ID del usuario simulado para pruebas' })
  @ApiHeader({ name: 'x-user-role', required: false, description: 'Rol del usuario simulado (debe ser PYME)' })
  @ApiOperation({ summary: 'Crear un nuevo proyecto (Solo PYMES)' })
  @ApiResponse({ status: 201, description: 'Proyecto creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Petición incorrecta (ej. deadline en el pasado).' })
  @ApiResponse({ status: 403, description: 'Prohibido. Solo las PYMES pueden publicar proyectos.' })
  create(@Body() createProjectDto: CreateProjectDto, @CurrentUser() user: any) {
    return this.projectsService.create(createProjectDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los proyectos (Público)' })
  @ApiResponse({ status: 200, description: 'Lista de proyectos devuelta exitosamente.' })
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un proyecto por su ID (Público)' })
  @ApiResponse({ status: 200, description: 'Proyecto encontrado.' })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.PYME, Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-user-id', required: false, description: 'ID del usuario simulado para pruebas' })
  @ApiHeader({ name: 'x-user-role', required: false, description: 'Rol del usuario simulado' })
  @ApiOperation({ summary: 'Modificar un proyecto (Solo el dueño o ADMIN)' })
  @ApiResponse({ status: 200, description: 'Proyecto actualizado exitosamente.' })
  @ApiResponse({ status: 403, description: 'No eres el dueño o no tienes permisos.' })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado.' })
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.update(+id, updateProjectDto, user);
  }

  @Delete(':id')
  @Roles(Role.PYME, Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-user-id', required: false, description: 'ID del usuario simulado para pruebas' })
  @ApiHeader({ name: 'x-user-role', required: false, description: 'Rol del usuario simulado' })
  @ApiOperation({ summary: 'Eliminar un proyecto (Solo el dueño o ADMIN)' })
  @ApiResponse({ status: 200, description: 'Proyecto eliminado exitosamente.' })
  @ApiResponse({ status: 403, description: 'No eres el dueño o no tienes permisos.' })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado.' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.remove(+id, user);
  }

  @Patch(':id/status')
  @Roles(Role.PYME, Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-user-id', required: false, description: 'ID del usuario simulado para pruebas' })
  @ApiHeader({ name: 'x-user-role', required: false, description: 'Rol del usuario simulado' })
  @ApiOperation({ summary: 'Cambiar el estado de un proyecto (Máquina de Estados)' })
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
  @ApiResponse({ status: 200, description: 'Estado del proyecto modificado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Transición de estado no válida.' })
  @ApiResponse({ status: 403, description: 'No tienes permisos.' })
  transitionStatus(
    @Param('id') id: string,
    @Body('status') status: Status,
    @CurrentUser() user: any,
  ) {
    if (!status) {
      throw new BadRequestException('El campo status es requerido.');
    }
    return this.projectsService.transitionStatus(+id, status, user);
  }
}
