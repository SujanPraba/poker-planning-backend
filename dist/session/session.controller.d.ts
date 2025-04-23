import { Response } from 'express';
import { SessionService } from './session.service';
export declare class SessionController {
    private readonly sessionService;
    constructor(sessionService: SessionService);
    exportSession(sessionId: string, res: Response): Promise<void>;
}
