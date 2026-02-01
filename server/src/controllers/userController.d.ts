import type { Request, Response } from 'express';
export declare const userController: {
    getUsers: (req: Request, res: Response) => Promise<void>;
    createUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    updateUser: (req: Request, res: Response) => Promise<void>;
    deleteUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=userController.d.ts.map