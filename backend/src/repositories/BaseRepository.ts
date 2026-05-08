import { Model, ModelStatic, WhereOptions, Attributes } from 'sequelize';
import { NotFoundError } from '../utils/errors';

export class BaseRepository<T extends Model> {
  protected model: ModelStatic<T>;

  constructor(model: ModelStatic<T>) {
    this.model = model;
  }

  async findById(id: number): Promise<T> {
    const record = await this.model.findByPk(id);
    if (!record) throw new NotFoundError(`${this.model.name} not found`);
    return record;
  }

  async findAll(where: WhereOptions<Attributes<T>> = {}): Promise<T[]> {
    return this.model.findAll({ where });
  }

  async create(data: object): Promise<T> {
    return this.model.create(data as any);
  }

  async update(id: number, data: object): Promise<T> {
    const record = await this.findById(id);
    return record.update(data);
  }
}
