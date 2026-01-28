import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/superadmin.guard';
import { UsersService } from './users.service';

@ApiTags('admin/users')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users (Super Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of all users' })
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      role: role as any,
      search,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get user statistics (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User statistics' })
  async getUserStatistics() {
    return this.usersService.getStatistics();
  }

  @Post()
  @ApiOperation({ summary: 'Create new user (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async createUser(
    @Request() req,
    @Body() data: {
      email: string;
      name: string;
      password: string;
      role: string;
      phone?: string;
    },
  ) {
    return this.usersService.create(req.user.userId, data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(
    @Request() req,
    @Param('id') id: string,
    @Body() data: {
      name?: string;
      email?: string;
      role?: string;
      phone?: string;
    },
  ) {
    return this.usersService.update(id, req.user.userId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(@Request() req, @Param('id') id: string) {
    return this.usersService.delete(id, req.user.userId);
  }

  @Post(':id/impersonate')
  @ApiOperation({ summary: 'Impersonate user for support (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Impersonation token generated' })
  async impersonateUser(@Request() req, @Param('id') id: string) {
    return this.usersService.impersonate(id, req.user.userId);
  }
}
