import { User } from '@prisma/client';

declare global {
  namespace Express {
    // We only attach specific fields to req.user for lightweight handling, 
    // or we could attach the full Prisma User.
    // Based on existing code (auth.controller login), we sign: { userId, email, role, canEdit }
    interface Request {
      user?: {
        userId: number; // Token payload uses 'userId', but middleware assigns 'user' verify result.
        // Let's standardize. Typically verified token payload matches this.
        // Looking at auth.controller.ts: signToken({ userId: user.id, email: user.email, role: user.role, canEdit: user.canEdit })
        // So req.user will have these fields.
        email: string;
        role: string;
        canEdit: boolean;
      }
    }
  }
}
