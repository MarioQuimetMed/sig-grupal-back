import { User } from "src/user/entity";


export interface ISignInEmployeedResponse {
  user: User,
  token: string;
}