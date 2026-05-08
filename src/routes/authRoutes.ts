import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../models/index';
import { validate } from '../middlewares/validate';
import { loginSchema, signupSchema } from '../validators/authValidator';


const userRepository = new UserRepository(User);
const authService = new AuthService(userRepository);
const controller = new AuthController(authService);

const router = Router();

router.post('/signup', validate(signupSchema), controller.signup);
router.post('/login', validate(loginSchema), controller.login);

export default router;
