import { HTTP_STATUS } from "@config/constants";
import i18n from "@config/i18n-compat";
import { errorResponse, successResponse } from "@core/response.util";
import type { NextFunction, Request, Response } from "express";
import { AuthService } from "./auth.service";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  ResetPasswordWithOtpInput,
  VerifyOtpInput,
} from './auth.validation';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Registers a new user.
   */
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: RegisterInput = req.body;
      const userAgent = Array.isArray(req.headers["user-agent"]) 
        ? req.headers["user-agent"][0] 
        : req.headers["user-agent"] ?? "";
      const ip = req.ip ?? "";
      const user = await this.authService.register(userData, ip, userAgent);
      successResponse(
        res,
        i18n.__("auth.register_success"),
        { user: { id: user.id, email: user.email, name: user.username } },
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logs in a user and sets JWT tokens as HTTP-only cookies.
   */
  login = async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? "";
    try {
      const { email, password }: LoginInput = req.body;
      const { user, accessToken, refreshToken } = await this.authService.login(
        email,
        password,
        ip,
        req.headers["user-agent"] ?? ""
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      successResponse(res, i18n.__("auth.login_success"), {
        user: { id: user.id, email: user.email, name: user.username, avatar: user.avatar, role: user.role },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logs out a user by clearing JWT cookies.
   */
  logout = (req: Request, res: Response, next: NextFunction) => {
    try {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      successResponse(res, i18n.__("auth.logout_success"));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refreshes access token using refresh token.
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        return errorResponse(res, i18n.__("auth.refresh_token_missing"), 401, { path: req.path, message: i18n.__("auth.refresh_token_missing") });
      }

      const { accessToken, newRefreshToken } = await this.authService.refreshAccessToken(refreshToken);

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      successResponse(res, i18n.__("auth.token_refresh_success"));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles Google OAuth callback.
   */
  googleAuthCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || typeof req.user === "string") {
        return errorResponse(res, i18n.__("auth.google_auth_failed"), 401, { path: req.path, message: i18n.__("auth.google_auth_failed") });
      }

      // req.user is already properly typed with our Express declaration
      const { accessToken, refreshToken } = await this.authService.generateAuthTokens(
        req.user.id,
        req.user.email,
        req.user.role,
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      successResponse(res, i18n.__("auth.google_auth_success"), { user: req.user });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Dummy success page for OAuth.
   */
  authSuccess = (req: Request, res: Response) => {
    successResponse(res, i18n.__("auth.oauth_success"), null);
  };
 /**
   * Initiates forgot password process by sending OTP and/or reset link.
   */
 forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: ForgotPasswordInput = req.body;
    const userAgent = Array.isArray(req.headers['user-agent'])
      ? req.headers['user-agent'][0]
      : (req.headers['user-agent'] ?? '');
    const ip = req.ip ?? '';

    const result = await this.authService.forgotPassword(data, ip, userAgent);
    successResponse(res, result.message);
  } catch (error) {
    next(error);
  }
};

/**
 * Verifies OTP for password reset.
 */
verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: VerifyOtpInput = req.body;
    const result = await this.authService.verifyOtp(data);
    successResponse(res, result.message);
  } catch (error) {
    next(error);
  }
};

/**
 * Resets password using reset token.
 */
resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: ResetPasswordInput = req.body;
    const userAgent = Array.isArray(req.headers['user-agent'])
      ? req.headers['user-agent'][0]
      : (req.headers['user-agent'] ?? '');
    const ip = req.ip ?? '';

    const result = await this.authService.resetPassword(data, ip, userAgent);
    successResponse(res, result.message);
  } catch (error) {
    next(error);
  }
};

/**
 * Resets password using OTP.
 */
resetPasswordWithOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: ResetPasswordWithOtpInput = req.body;
    const userAgent = Array.isArray(req.headers['user-agent'])
      ? req.headers['user-agent'][0]
      : (req.headers['user-agent'] ?? '');
    const ip = req.ip ?? '';

    const result = await this.authService.resetPasswordWithOtp(data, ip, userAgent);
    successResponse(res, result.message);
  } catch (error) {
    next(error);
  }
};
}