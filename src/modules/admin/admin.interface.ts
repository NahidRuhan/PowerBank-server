import { Role } from '@prisma/client';

export interface GetUsersQuery {
  page?: string | number;
  limit?: string | number;
  search?: string;
  role?: Role;
}

export interface GetAuditLogsQuery {
  page?: string | number;
  limit?: string | number;
  entity?: string;
  action?: string;
  userId?: string;
  from?: string;
  to?: string;
}
