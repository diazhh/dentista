import { Controller, Get, Post, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('whatsapp')
export class WhatsappController {
    constructor(private readonly whatsappService: WhatsappService) { }

    @Get('status')
    @UseGuards(JwtAuthGuard)
    getStatus() {
        return {
            status: this.whatsappService.getStatus(),
            qrCode: this.whatsappService.getQrCode(),
        };
    }

    @Post('send')
    @UseGuards(JwtAuthGuard)
    async sendMessage(@Body() body: { to: string; message: string }) {
        try {
            const result = await this.whatsappService.sendMessage(body.to, body.message);
            return { success: true, result };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }
}
