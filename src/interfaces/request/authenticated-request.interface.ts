import { Request } from 'express';
export interface AccountInfo {
  sub?: string;
  role?: string;
}
export interface IAuthenticatedRequest extends Request {
  accountInfo?: AccountInfo;
}
