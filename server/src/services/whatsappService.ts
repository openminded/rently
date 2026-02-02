import {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    type WASocket,
    type ConnectionState,
    type proto
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pino({ level: 'silent' });

class WhatsAppService {
    public sock: WASocket | null = null;
    public connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'QR' = 'DISCONNECTED';
    public qr: string | null = null;
    private authDir = path.join(process.cwd(), 'whatsapp-session');
    private reconnectAttempts = 0;
    private readonly MAX_RECONNECT_ATTEMPTS = 5;
    private retryTimeout: NodeJS.Timeout | null = null;

    constructor() {
        if (!fs.existsSync(this.authDir)) {
            fs.mkdirSync(this.authDir, { recursive: true });
        }
    }

    async connect() {
        try {
            // Clear any pending retry
            if (this.retryTimeout) {
                clearTimeout(this.retryTimeout);
                this.retryTimeout = null;
            }

            console.log('[WhatsApp] Attempting to connect...');
            await this.init();
        } catch (error) {
            console.error('[WhatsApp] Connection initialization failed:', error);
            this.handleReconnection();
        }
    }

    private async init() {
        const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
        const { version, isLatest } = await fetchLatestBaileysVersion();

        console.log(`[WhatsApp] Using WA v${version.join('.')}, isLatest: ${isLatest}`);

        this.sock = makeWASocket({
            version,
            logger,
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            browser: ['Rumah Dinar', 'Safari', '1.0.0'],
            generateHighQualityLinkPreview: true,
        });

        this.sock.ev.on('connection.update', (update: Partial<ConnectionState>) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                this.qr = qr;
                this.connectionStatus = 'QR';
                console.log('WhatsApp QR Code received');
            }

            if (connection === 'close') {
                const disconnectError = lastDisconnect?.error as Boom;
                const statusCode = disconnectError?.output?.statusCode;

                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                console.log('[WhatsApp] Connection closed:', {
                    statusCode,
                    error: disconnectError?.message,
                    shouldReconnect
                });

                this.connectionStatus = 'DISCONNECTED';

                if (shouldReconnect) {
                    this.handleReconnection();
                } else {
                    console.log('[WhatsApp] Logged out. Waiting for manual reconnection.');
                    this.logout().catch(err => console.error('Error during logout cleanup:', err));
                }
            } else if (connection === 'open') {
                console.log('[WhatsApp] Opened connection');
                this.connectionStatus = 'CONNECTED';
                this.qr = null;
                this.reconnectAttempts = 0;
            } else if (connection === 'connecting') {
                this.connectionStatus = 'CONNECTING';
            }
        });

        this.sock.ev.on('creds.update', saveCreds);

        return this.sock;
    }

    private handleReconnection() {
        if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
            console.error(`[WhatsApp] Max reconnection attempts (${this.MAX_RECONNECT_ATTEMPTS}) reached. Stopping retries.`);
            return;
        }

        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Backoff: 1s, 2s, 4s, ..., max 30s
        console.log(`[WhatsApp] Reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts + 1}/${this.MAX_RECONNECT_ATTEMPTS})...`);

        this.reconnectAttempts++;

        this.retryTimeout = setTimeout(() => {
            this.connect();
        }, delay);
    }

    async sendMessage(to: string, text: string) {
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
        } catch (error) {
            console.error(`[WhatsApp] Send failed:`, error);
            throw error;
        }
    }

    async logout() {
        // Clear any pending retry
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
            this.retryTimeout = null;
        }

        if (this.sock) {
            try {
                await this.sock.logout();
            } catch (err) {
                console.warn('[WhatsApp] Error sending logout command:', err);
            }
            this.sock.end(undefined);
            this.sock = null;
        }

        if (fs.existsSync(this.authDir)) {
            try {
                fs.rmSync(this.authDir, { recursive: true, force: true });
            } catch (err) {
                console.error('[WhatsApp] Failed to remove auth directory:', err);
            }
        }

        this.connectionStatus = 'DISCONNECTED';
        this.qr = null;
        this.reconnectAttempts = 0;

        // Re-initialize to get a fresh start for new QR
        console.log('[WhatsApp] Logout complete. Re-initializing for new session...');
        // We delay slightly to ensure clean cleanup
        setTimeout(() => this.connect(), 1000);
    }
}

export const whatsappService = new WhatsAppService();
