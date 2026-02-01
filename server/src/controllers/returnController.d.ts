import type { Request, Response } from 'express';
export declare const returnController: {
    getActiveRentals: (req: Request, res: Response) => Promise<void>;
    getRentalById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    processReturn: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=returnController.d.ts.map