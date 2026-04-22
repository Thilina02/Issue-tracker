import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "../validators";
import { HttpError } from "../middleware/error";
import { AuthService } from "../services/auth.service";
import { getAuthCookieOptions, getClearCookieOptions, TOKEN_COOKIE } from "../utils/cookies";
import type { AuthedRequest } from "../middleware/auth";

export class AuthController {
  static async register(req: Request, res: Response) {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError("Invalid registration data", 422);

    const { user, token } = await AuthService.register(parsed.data);
    res.cookie(TOKEN_COOKIE, token, getAuthCookieOptions());
    res.status(201).json({ user });
  }

  static async login(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError("Invalid login data", 422);

    const { user, token } = await AuthService.login(parsed.data);
    res.cookie(TOKEN_COOKIE, token, getAuthCookieOptions());
    res.json({ user });
  }

  static async logout(_req: Request, res: Response) {
    res.cookie(TOKEN_COOKIE, "", getClearCookieOptions());
    res.json({ ok: true });
  }

  static async me(req: Request, res: Response) {
    const { user } = req as AuthedRequest;
    res.json({
      user: { _id: user.userId, name: user.name, email: user.email },
    });
  }
}

