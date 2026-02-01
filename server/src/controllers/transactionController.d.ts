import type { Request, Response } from 'express';
export declare const transactionController: {
    createConfig: (req: Request, res: Response) => Promise<void>;
    getAll: (req: Request, res: Response) => Promise<void>;
    addPayment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    pickup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    returnItems: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getById: (req: Request, res: Response) => Promise<void>;
    markInvalid: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=transactionController.d.ts.map