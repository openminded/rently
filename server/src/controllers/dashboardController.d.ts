import type { Request, Response } from 'express';
export declare const dashboardController: {
    getSummary: (req: Request, res: Response) => Promise<void>;
    getCharts: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=dashboardController.d.ts.map