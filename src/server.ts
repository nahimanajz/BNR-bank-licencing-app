import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './config/database';
import logger from './config/logger';
import router from './routes/index';
import { errorHandler } from './middlewares/errorHandler';
import './models/index';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', router);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

sequelize
  .authenticate()
  .then(() => {
    logger.info('Database connected');
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    logger.error('Database connection failed', { error: err.message });
    process.exit(1);
  });

export default app;
