import User from "../models/User";
import { connectDB } from "../db/connect";
import { comparePassword, hashPassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { HttpError } from "../middleware/error";

type RegisterInput = { name: string; email: string; password: string };
type LoginInput = { email: string; password: string };

function toPublicUser(u: any) {
  return {
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
  };
}

export class AuthService {
  static async register(input: RegisterInput) {
    await connectDB();
    const existing = await User.findOne({ email: input.email }).lean();
    if (existing) throw new HttpError("Email already registered", 409);

    const passwordHash = await hashPassword(input.password);
    const user = await User.create({ name: input.name, email: input.email, passwordHash });

    const token = signToken({ userId: user._id.toString(), email: user.email, name: user.name });
    return { user: toPublicUser(user), token };
  }

  static async login(input: LoginInput) {
    await connectDB();
    const user = await User.findOne({ email: input.email });
    if (!user) throw new HttpError("Invalid credentials", 401);

    const valid = await comparePassword(input.password, user.passwordHash);
    if (!valid) throw new HttpError("Invalid credentials", 401);

    const token = signToken({ userId: user._id.toString(), email: user.email, name: user.name });
    return { user: toPublicUser(user), token };
  }
}

