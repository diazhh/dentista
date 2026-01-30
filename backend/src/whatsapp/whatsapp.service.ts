import { Injectable, OnModuleInit, OnModuleDestroy, Logger, BadRequestException, HttpException, HttpStatus, Inject, forwardRef } from '@nestjs/common';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, WASocket, ConnectionState, proto } from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode';
import { join } from 'path';
import * as fs from 'fs';
import { ChatbotService } from '../chatbot/chatbot.service';

// Rate limiting: máximo de mensajes por hora por tenant
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hora en ms
const MAX_MESSAGES_PER_WINDOW = 100;

interface RateLimitEntry {
    count: number;
    windowStart: number;
}

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
    private socket: WASocket;
    private readonly logger = new Logger(WhatsappService.name);
    private qrCode: string | null = null;
    private connectionStatus: 'INITIALIZING' | 'QR_READY' | 'CONNECTED' | 'DISCONNECTED' = 'INITIALIZING';
    private authFolder = join(process.cwd(), 'whatsapp-auth');
    private chatbotEnabled = true; // Toggle for chatbot functionality

    // Rate limiting por tenant
    private rateLimits: Map<string, RateLimitEntry> = new Map();

    constructor(
        @Inject(forwardRef(() => ChatbotService))
        private chatbotService: ChatbotService,
    ) {}

    async onModuleInit() {
        this.connectToWhatsapp();
    }

    async onModuleDestroy() {
        if (this.socket) {
            this.socket.end(undefined);
        }
    }

    async connectToWhatsapp() {
        this.logger.log('Connecting to WhatsApp...');

        if (!fs.existsSync(this.authFolder)) {
            fs.mkdirSync(this.authFolder, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);

        this.socket = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            browser: ['DentiCloud', 'Chrome', '1.0.0'],
        });

        this.socket.ev.on('creds.update', saveCreds);

        this.socket.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                this.logger.log('QR Code generated');
                this.qrCode = await qrcode.toDataURL(qr);
                this.connectionStatus = 'QR_READY';
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
                this.logger.warn(`Connection closed due to ${lastDisconnect?.error}, reconnecting: ${shouldReconnect}`);
                this.connectionStatus = 'DISCONNECTED';

                if (shouldReconnect) {
                    this.connectToWhatsapp();
                } else {
                    // Handle logout - maybe clear auth folder? for now just log
                    this.logger.error('Logged out. Credentials cleared.');
                }
            } else if (connection === 'open') {
                this.logger.log('WhatsApp connection opened');
                this.connectionStatus = 'CONNECTED';
                this.qrCode = null;
            }
        });

        // Handle incoming messages for chatbot
        this.socket.ev.on('messages.upsert', async (m) => {
            if (!this.chatbotEnabled) return;

            const message = m.messages[0];
            if (!message?.message || message.key.fromMe) return;

            const remoteJid = message.key.remoteJid;
            if (!remoteJid || remoteJid.includes('@g.us')) return; // Skip group messages

            const phoneNumber = remoteJid.replace('@s.whatsapp.net', '');
            const messageText = this.extractMessageText(message.message);

            if (!messageText) return;

            this.logger.log(`Received message from ${phoneNumber.substring(0, 4)}***: ${messageText.substring(0, 50)}...`);

            try {
                // Process with chatbot
                const response = await this.chatbotService.processMessage(phoneNumber, messageText);

                // Send response
                await this.sendMessage(phoneNumber, response);
            } catch (error) {
                this.logger.error(`Error processing chatbot message: ${error.message}`);
            }
        });
    }

    /**
     * Extract text from different message types
     */
    private extractMessageText(message: proto.IMessage): string | null {
        if (message.conversation) {
            return message.conversation;
        }
        if (message.extendedTextMessage?.text) {
            return message.extendedTextMessage.text;
        }
        if (message.buttonsResponseMessage?.selectedButtonId) {
            return message.buttonsResponseMessage.selectedButtonId;
        }
        if (message.listResponseMessage?.singleSelectReply?.selectedRowId) {
            return message.listResponseMessage.singleSelectReply.selectedRowId;
        }
        return null;
    }

    /**
     * Enable or disable chatbot functionality
     */
    setChatbotEnabled(enabled: boolean): void {
        this.chatbotEnabled = enabled;
        this.logger.log(`Chatbot ${enabled ? 'enabled' : 'disabled'}`);
    }

    getChatbotEnabled(): boolean {
        return this.chatbotEnabled;
    }

    getQrCode(): string | null {
        return this.qrCode;
    }

    getStatus(): string {
        return this.connectionStatus;
    }

    /**
     * Valida formato de número telefónico
     * Acepta: +1234567890, 1234567890, 123-456-7890
     * Debe tener entre 10 y 15 dígitos
     */
    private validatePhoneNumber(phone: string): string {
        const digitsOnly = phone.replace(/[^0-9]/g, '');

        if (digitsOnly.length < 10 || digitsOnly.length > 15) {
            throw new BadRequestException(`Invalid phone number: ${phone}. Must be 10-15 digits.`);
        }

        return digitsOnly;
    }

    /**
     * Verifica rate limiting por tenant
     */
    private checkRateLimit(tenantId: string): void {
        const now = Date.now();
        const entry = this.rateLimits.get(tenantId);

        if (!entry) {
            this.rateLimits.set(tenantId, { count: 1, windowStart: now });
            return;
        }

        // Si pasó la ventana, resetear
        if (now - entry.windowStart > RATE_LIMIT_WINDOW) {
            this.rateLimits.set(tenantId, { count: 1, windowStart: now });
            return;
        }

        // Si excede el límite
        if (entry.count >= MAX_MESSAGES_PER_WINDOW) {
            const remainingMs = RATE_LIMIT_WINDOW - (now - entry.windowStart);
            const remainingMinutes = Math.ceil(remainingMs / 60000);
            throw new HttpException(
                `Rate limit exceeded. Max ${MAX_MESSAGES_PER_WINDOW} messages per hour. Try again in ${remainingMinutes} minutes.`,
                HttpStatus.TOO_MANY_REQUESTS
            );
        }

        // Incrementar contador
        entry.count++;
    }

    /**
     * Sanitiza el mensaje para evitar inyección
     */
    private sanitizeMessage(message: string): string {
        // Limitar longitud máxima
        const maxLength = 4096;
        if (message.length > maxLength) {
            message = message.substring(0, maxLength);
        }

        // Remover caracteres de control excepto saltos de línea
        return message.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
    }

    async sendMessage(to: string, message: string, tenantId?: string): Promise<any> {
        if (this.connectionStatus !== 'CONNECTED') {
            throw new Error('WhatsApp is not connected');
        }

        // Validar número telefónico
        const formattedNumber = this.validatePhoneNumber(to);

        // Rate limiting si hay tenantId
        if (tenantId) {
            this.checkRateLimit(tenantId);
        }

        // Sanitizar mensaje
        const sanitizedMessage = this.sanitizeMessage(message);

        const id = `${formattedNumber}@s.whatsapp.net`;

        try {
            const result = await this.socket.sendMessage(id, { text: sanitizedMessage });
            this.logger.log(`Message sent to ${formattedNumber.substring(0, 4)}***`);
            return result;
        } catch (error) {
            this.logger.error(`Failed to send message to ${formattedNumber}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas de rate limiting para un tenant
     */
    getRateLimitStats(tenantId: string): { messagesUsed: number; messagesRemaining: number; resetsIn: number } {
        const entry = this.rateLimits.get(tenantId);
        const now = Date.now();

        if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
            return {
                messagesUsed: 0,
                messagesRemaining: MAX_MESSAGES_PER_WINDOW,
                resetsIn: RATE_LIMIT_WINDOW,
            };
        }

        return {
            messagesUsed: entry.count,
            messagesRemaining: MAX_MESSAGES_PER_WINDOW - entry.count,
            resetsIn: RATE_LIMIT_WINDOW - (now - entry.windowStart),
        };
    }
}
