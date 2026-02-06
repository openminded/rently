import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logger = pino({ level: 'silent' });
class WhatsAppService {
    sock = null;
    connectionStatus = 'DISCONNECTED';
    qr = null;
    authDir = path.join(process.cwd(), 'whatsapp-session');
    constructor() {
        if (!fs.existsSync(this.authDir)) {
            fs.mkdirSync(this.authDir, { recursive: true });
        }
    }
    async init() {
        const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        this.sock = makeWASocket({
            version,
            logger,
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            browser: ['Werently', 'Safari', '1.0.0']
        });
        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (qr) {
                this.qr = qr;
                this.connectionStatus = 'QR';
                console.log('WhatsApp QR Code received');
            }
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
                this.connectionStatus = 'DISCONNECTED';
                // Prevent immediate tight loops
                if (shouldReconnect) {
                    setTimeout(() => {
                        this.init();
                    }, 3000); // Wait 3 seconds before reconnecting
                }
            }
            else if (connection === 'open') {
                console.log('Opened connection');
                this.connectionStatus = 'CONNECTED';
                this.qr = null;
            }
            else if (connection === 'connecting') {
                this.connectionStatus = 'CONNECTING';
            }
        });
        this.sock.ev.on('creds.update', saveCreds);
        return this.sock;
    }
    async sendMessage(to, text) {
        if (!this.sock || this.connectionStatus !== 'CONNECTED') {
            throw new Error('WhatsApp not connected');
        }
        // Format number: remove +, replace 0 with 62
        let jid = to.replace(/[^0-9]/g, '');
        if (jid.startsWith('0')) {
            jid = '62' + jid.slice(1);
        }
        if (!jid.endsWith('@s.whatsapp.net')) {
            jid += '@s.whatsapp.net';
        }
        console.log(`[WhatsApp] Sending message to: ${jid}`);
        try {
            const result = await this.sock.sendMessage(jid, { text });
            console.log(`[WhatsApp] Send result:`, result);
            return result;
        }
        catch (error) {
            console.error(`[WhatsApp] Send failed:`, error);
            throw error;
        }
    }
    async logout() {
        if (this.sock) {
            await this.sock.logout();
        }
        if (fs.existsSync(this.authDir)) {
            fs.rmSync(this.authDir, { recursive: true, force: true });
        }
        this.connectionStatus = 'DISCONNECTED';
        this.qr = null;
        await this.init();
    }
}
export const whatsappService = new WhatsAppService();
//# sourceMappingURL=whatsappService.js.map