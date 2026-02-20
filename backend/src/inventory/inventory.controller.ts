import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, UpdateInventoryItemDto, CreateMovementDto } from './dto/inventory.dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('summary')
  getSummary(@Request() req: any) {
    return this.inventoryService.getSummary(req.user.tenantId);
  }

  @Get()
  findAll(
    @Request() req: any,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.inventoryService.findAll(req.user.tenantId, {
      category,
      search,
      lowStock: lowStock === 'true',
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.inventoryService.findOne(id, req.user.tenantId);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.create(req.user.tenantId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateInventoryItemDto) {
    return this.inventoryService.update(id, req.user.tenantId, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.inventoryService.delete(id, req.user.tenantId);
  }

  @Post('movements')
  createMovement(@Request() req: any, @Body() dto: CreateMovementDto) {
    return this.inventoryService.createMovement(req.user.tenantId, req.user.id, dto);
  }

  @Get(':id/movements')
  getMovements(@Param('id') id: string, @Request() req: any) {
    return this.inventoryService.getMovements(id, req.user.tenantId);
  }
}
