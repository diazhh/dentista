import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ModulesService } from './modules.service';
import { ActivateModuleDto, UpdateModuleConfigDto } from './dto/modules.dto';

@ApiTags('modules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modules')
export class ModulesController {
  constructor(
    private readonly modulesService: ModulesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('available')
  @ApiOperation({ summary: 'Get available modules for the current provider' })
  async getAvailableModules(@Request() req) {
    const userId = req.user.userId;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { specialties: true },
    });

    const specialties = user?.specialties || [];
    return this.modulesService.getAvailableModules(specialties);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active modules for the current provider' })
  getActiveModules(@Request() req) {
    const userId = req.user.userId;
    return this.modulesService.getActiveModules(userId);
  }

  @Post(':key/activate')
  @ApiOperation({ summary: 'Activate a module' })
  activateModule(
    @Param('key') key: string,
    @Body() dto: ActivateModuleDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.modulesService.activateModule(userId, key, dto.config);
  }

  @Post(':key/deactivate')
  @ApiOperation({ summary: 'Deactivate a module' })
  deactivateModule(@Param('key') key: string, @Request() req) {
    const userId = req.user.userId;
    return this.modulesService.deactivateModule(userId, key);
  }

  @Get(':key/config')
  @ApiOperation({ summary: 'Get module configuration' })
  getModuleConfig(@Param('key') key: string, @Request() req) {
    const userId = req.user.userId;
    return this.modulesService.getModuleConfig(userId, key);
  }

  @Put(':key/config')
  @ApiOperation({ summary: 'Update module configuration' })
  updateModuleConfig(
    @Param('key') key: string,
    @Body() dto: UpdateModuleConfigDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.modulesService.updateModuleConfig(userId, key, dto.config);
  }
}
