import type { Request, Response } from 'express';
export declare const financeController: {
    getSummary: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getIncome: (req: Request, res: Response) => Promise<void>;
    getExpenses: (req: Request, res: Response) => Promise<void>;
    createExpense: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getCategories: (req: Request, res: Response) => Promise<void>;
    createCategory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    deleteCategory: (req: Request, res: Response) => Promise<void>;
    getSummaryByCategory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=financeController.d.ts.map