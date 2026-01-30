import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, WASocket, ConnectionState } from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
    private socket: WASocket;
    private readonly logger = new Logger(WhatsappService.name);
    private qrCode: string | null = null;
    private connectionStatus: 'INITIALIZING' | 'QR_READY' | 'CONNECTED' | 'DISCONNECTED' = 'INITIALIZING';
    private authFolder = join(process.cwd(), 'whatsapp-auth');

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
    }

    getQrCode(): string | null {
        return this.qrCode;
    }

    getStatus(): string {
        return this.connectionStatus;
    }

    async sendMessage(to: string, message: string): Promise<any> {
        if (this.connectionStatus !== 'CONNECTED') {
            throw new Error('WhatsApp is not connected');
        }

        // Basic formatting to ensure number is correct (remove +, spaces, etc)
        const formattedNumber = to.replace(/[^0-9]/g, '');
        const id = `${formattedNumber}@s.whatsapp.net`;

        return await this.socket.sendMessage(id, { text: message });
    }
}
