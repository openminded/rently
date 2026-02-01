import type { Request, Response, NextFunction } from 'express';
export declare const uploadImages: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const resizeImages: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=upload.d.ts.map