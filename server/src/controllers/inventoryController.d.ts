import type { Request, Response } from 'express';
export declare const inventoryController: {
    createItem: (req: Request, res: Response) => Promise<void>;
    updateItem: (req: Request, res: Response) => Promise<void>;
    deleteItemImage: (req: Request, res: Response) => Promise<void>;
    getItems: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    createVariant: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    deleteVariant: (req: Request, res: Response) => Promise<void>;
    addStock: (req: Request, res: Response) => Promise<void>;
    getVariantStock: (req: Request, res: Response) => Promise<void>;
    getResume: (req: Request, res: Response) => Promise<void>;
    getHistory: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=inventoryController.d.ts.map