import type { Request, Response } from 'express';
import { whatsappService } from '../services/whatsappService.js';
import QRCode from 'qrcode';

export const getStatus = async (req: Request, res: Response) => {
    res.json({
        status: whatsappService.connectionStatus,
        hasSock: !!whatsappService.sock
    });
};

export const getQR = async (req: Request, res: Response) => {
    if (whatsappService.connectionStatus === 'CONNECTED') {
        return res.status(400).json({ error: 'Already connected' });
    }
    if (!whatsappService.qr) {
        return res.status(404).json({ error: 'QR Code not generated yet. Try again in a few seconds.' });
    }

    try {
        const qrImage = await QRCode.toDataURL(whatsappService.qr);
        res.json({ qr: qrImage });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        await whatsappService.logout();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const reconnect = async (req: Request, res: Response) => {
    try {
        await whatsappService.init();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
