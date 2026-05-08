import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository';
import { AuthenticationError, ConflictError } from '../utils/errors';
import { SignupReq } from '../dto/requests/signupReq';
import { UserRes } from '../dto/responses/UserRes';
import { toUserRes } from '../utils/userMapper';

export class AuthService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async signup(data: SignupReq): Promise<UserRes> {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) throw new ConflictError('Email already registered');

    const password_hash = await bcrypt.hash(data.password, 10);
    const user = await this.userRepository.create({
      email: data.email,
      password_hash,
      full_name: data.full_name ?? null,
      role: data.role ?? 'APPLICANT',
    });

    return toUserRes(user);
  }

  async login(email: string, password: string): Promise<UserRes> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new AuthenticationError('Invalid credentials');

    const valid = await bcrypt.compare(password, user.get('password_hash') as string);
    if (!valid) throw new AuthenticationError('Invalid credentials');

    return toUserRes(user);
  }
}
