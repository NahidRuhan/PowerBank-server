import { Role } from '@prisma/client';

export interface RegisterData {
  email: string;
  name: string;
  password: string;
  meterNumber: string;
  phoneNumber?: string;
  avatar?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  newPassword: string;
}

export interface TokenPayload {
  id: string;
  email: string;
  role: Role;
}
