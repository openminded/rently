import type { Request, Response } from 'express';
export declare const getTemplates: (req: Request, res: Response) => Promise<void>;
export declare const createTemplate: (req: Request, res: Response) => Promise<void>;
export declare const updateTemplate: (req: Request, res: Response) => Promise<void>;
export declare const deleteTemplate: (req: Request, res: Response) => Promise<void>;
export declare const createBroadcast: (req: Request, res: Response) => Promise<void>;
export declare const getBroadcastHistory: (req: Request, res: Response) => Promise<void>;
export declare const sendDirectMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getReminderTargets: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=broadcastController.d.ts.map