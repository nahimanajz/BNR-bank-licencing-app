import { User } from '../models/User';
import { UserRes } from '../dto/responses/UserRes';
import { createToken } from './signToken';

export const toUserRes = (user: User): UserRes => {
  const token = createToken({ id: user.id, email: user.email, role: user.role });
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    token,
  };
};
