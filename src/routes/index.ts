import { Router } from 'express';
import authRoutes from './authRoutes';
import applicationRoutes from './applicationRoutes';
import documentRoutes from './documentRoutes';
import auditRoutes from './auditRoutes';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

router.use('/auth', authRoutes);
router.use('/applications', applicationRoutes);
router.use('/applications/:id/documents', documentRoutes);
router.use('/audit', auditRoutes);

export default router;
