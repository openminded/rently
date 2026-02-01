import type { Request, Response } from 'express';
export declare const getAllPartners: (req: Request, res: Response) => Promise<void>;
export declare const getPartner: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createPartner: (req: Request, res: Response) => Promise<void>;
export declare const updatePartner: (req: Request, res: Response) => Promise<void>;
export declare const deletePartner: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=laundryPartnerController.d.ts.map