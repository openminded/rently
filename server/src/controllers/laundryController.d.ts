import type { Request, Response } from 'express';
export declare const laundryController: {
    getAll: (req: Request, res: Response) => Promise<void>;
    getBatches: (req: Request, res: Response) => Promise<void>;
    createBatch: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    completeBatch: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=laundryController.d.ts.map