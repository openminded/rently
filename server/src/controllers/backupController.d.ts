import type { Request, Response } from 'express';
export declare const backupController: {
    getBackup: (req: Request, res: Response) => Promise<void>;
    restoreBackup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    resetData: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=backupController.d.ts.map