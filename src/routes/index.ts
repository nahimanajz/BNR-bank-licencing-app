import { Router } from 'express';
import authRoutes from './authRoutes';
import applicationRoutes from './applicationRoutes';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

router.use('/auth', authRoutes);
router.use('/applications', applicationRoutes);

export default router;
