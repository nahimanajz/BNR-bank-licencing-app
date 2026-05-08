import { Router } from 'express';
import authRoutes from './authRoutes';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

router.use('/auth', authRoutes);

export default router;
