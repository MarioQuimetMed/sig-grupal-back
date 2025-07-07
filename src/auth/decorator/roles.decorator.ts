import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/user/constant';

export const Roles = (...args: (UserRole)[]) => SetMetadata('roles', args);
