import { User } from '../models/index';
import { BaseRepository } from './BaseRepository';

export class UserRepository extends BaseRepository<User> {
  constructor(model: typeof User) {
    super(model);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findOne({ where: { email } });
  }
}
