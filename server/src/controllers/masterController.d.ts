import type { Request, Response } from 'express';
export declare const masterController: {
    categories: {
        getAll: (req: Request, res: Response) => Promise<void>;
        create: (req: Request, res: Response) => Promise<void>;
        update: (req: Request, res: Response) => Promise<void>;
        delete: (req: Request, res: Response) => Promise<void>;
    };
    brands: {
        getAll: (req: Request, res: Response) => Promise<void>;
        create: (req: Request, res: Response) => Promise<void>;
        update: (req: Request, res: Response) => Promise<void>;
        delete: (req: Request, res: Response) => Promise<void>;
    };
    colors: {
        getAll: (req: Request, res: Response) => Promise<void>;
        create: (req: Request, res: Response) => Promise<void>;
        update: (req: Request, res: Response) => Promise<void>;
        delete: (req: Request, res: Response) => Promise<void>;
    };
    sizes: {
        getAll: (req: Request, res: Response) => Promise<void>;
        create: (req: Request, res: Response) => Promise<void>;
        update: (req: Request, res: Response) => Promise<void>;
        delete: (req: Request, res: Response) => Promise<void>;
    };
    paymentMethods: {
        getAll: (req: Request, res: Response) => Promise<void>;
        create: (req: Request, res: Response) => Promise<void>;
        update: (req: Request, res: Response) => Promise<void>;
        delete: (req: Request, res: Response) => Promise<void>;
    };
    violationTypes: {
        getAll: (req: Request, res: Response) => Promise<void>;
        create: (req: Request, res: Response) => Promise<void>;
        update: (req: Request, res: Response) => Promise<void>;
        delete: (req: Request, res: Response) => Promise<void>;
    };
    customers: {
        getAll: (req: Request, res: Response) => Promise<void>;
        create: (req: Request, res: Response) => Promise<void>;
        update: (req: Request, res: Response) => Promise<void>;
        delete: (req: Request, res: Response) => Promise<void>;
    };
    laundryPartners: {
        getAll: (req: Request, res: Response) => Promise<void>;
        create: (req: Request, res: Response) => Promise<void>;
        update: (req: Request, res: Response) => Promise<void>;
        delete: (req: Request, res: Response) => Promise<void>;
    };
    getDepositVariants: (req: Request, res: Response) => Promise<void>;
    createDepositVariant: (req: Request, res: Response) => Promise<void>;
    updateDepositVariant: (req: Request, res: Response) => Promise<void>;
    deleteDepositVariant: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=masterController.d.ts.map