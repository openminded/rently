import type { Request, Response } from 'express';
export declare const getStatus: (req: Request, res: Response) => Promise<void>;
export declare const getQR: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const logout: (req: Request, res: Response) => Promise<void>;
export declare const reconnect: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=whatsappController.d.ts.map