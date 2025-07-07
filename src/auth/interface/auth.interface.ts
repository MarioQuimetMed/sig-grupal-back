import * as jwt from "jsonwebtoken";
import { UserRole } from "src/user/constant";

export interface ISignJwt {
  payload : jwt.JwtPayload;
  expires: number | string;
}

export interface PayloadToken {
  userId: string;
}
export interface IUseToken {
  userId: string;
  isExpired: boolean;
}
export interface AuthTokenResult {
  userId: string;
  iat: number;
  exp: number;
}