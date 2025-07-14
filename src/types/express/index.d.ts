import { UserRole } from 'src/user/constant';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      role?: UserRole;
    }
  }
}

export {};
