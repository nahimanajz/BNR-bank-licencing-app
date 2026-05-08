import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { SignInReq } from '../dto/requests/signInReq';
import { SignupReq } from '../dto/requests/signupReq';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.authService.signup(req.body as SignupReq);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as SignInReq;
      const result = await this.authService.login(email, password);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}
