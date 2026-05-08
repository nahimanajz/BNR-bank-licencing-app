import { sequelize } from '../src/config/database';
import '../src/models/index';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});
