import { Controller, Post, Body, UseGuards, Request, Get, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered', type: LoginResponseDto })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() registerDto: RegisterDto): Promise<LoginResponseDto> {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Request() req, @Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;
    return this.authService.login(req.user, userAgent, ipAddress);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth login' })
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req, @Res() res) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;
    const result = await this.authService.oauthLogin(req.user, userAgent, ipAddress);
    return res.redirect(`${process.env.CORS_ORIGIN}/auth/callback?token=${result.accessToken}&refreshToken=${result.refreshToken}`);
  }

  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  @ApiOperation({ summary: 'Apple Sign In' })
  async appleAuth() {}

  @Get('apple/callback')
  @UseGuards(AuthGuard('apple'))
  @ApiOperation({ summary: 'Apple Sign In callback' })
  async appleAuthCallback(@Req() req, @Res() res) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;
    const result = await this.authService.oauthLogin(req.user, userAgent, ipAddress);
    return res.redirect(`${process.env.CORS_ORIGIN}/auth/callback?token=${result.accessToken}&refreshToken=${result.refreshToken}`);
  }

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Microsoft OAuth login' })
  async microsoftAuth() {}

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Microsoft OAuth callback' })
  async microsoftAuthCallback(@Req() req, @Res() res) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;
    const result = await this.authService.oauthLogin(req.user, userAgent, ipAddress);
    return res.redirect(`${process.env.CORS_ORIGIN}/auth/callback?token=${result.accessToken}&refreshToken=${result.refreshToken}`);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ schema: { properties: { refreshToken: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshAccessToken(refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiBody({ schema: { properties: { refreshToken: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  async logout(@Body('refreshToken') refreshToken: string) {
    await this.authService.logout(refreshToken);
    return { message: 'Successfully logged out' };
  }
}
