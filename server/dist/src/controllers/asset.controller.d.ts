import { Request, Response } from 'express';
export declare const getAssets: (req: Request, res: Response) => Promise<void>;
export declare const createAsset: (req: Request, res: Response) => Promise<void>;
export declare const updateAsset: (req: Request, res: Response) => Promise<void>;
export declare const deleteAsset: (req: Request, res: Response) => Promise<void>;
export declare const uploadPolicyFiles: (req: Request, res: Response) => Promise<void>;
export declare const listPolicyFiles: (req: Request, res: Response) => Promise<void>;
export declare const downloadPolicyFile: (req: Request, res: Response) => Promise<void>;
export declare const renewPolicy: (req: Request, res: Response) => Promise<void>;
export declare const getPolicyHistory: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=asset.controller.d.ts.map