import env from '@config/env';
import i18n from '@config/i18n-compat';
import { BadRequestError, UnauthorizedError } from '@core/error.classes';
import { addLoginNotificationJob, addWelcomeEmailJob } from '@jobs/queue';
import { AuditLogModel } from '@modules/audit-log/audit-log.model';
import { UserModel } from '@modules/user/user.model';
import emailService from '@services/email.service';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { PasswordReset } from './auth.model';
import type {
  ForgotPasswordInput,
  RegisterInput,
  ResetPasswordInput,
  ResetPasswordWithOtpInput,
  VerifyOtpInput,
} from './auth.validation';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';

export class AuthService {
  private SALT_ROUNDS = 10;

  // Register new user
  async register(userData: RegisterInput, ip: string, userAgent: string) {
    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: userData.email }).exec();
    if (existingUser) throw new Error('User already exists');

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS);

    // Create user
    const user = await UserModel.create({
      email: userData.email,
      name: userData.name,
      password: hashedPassword,
      // Other necessary fields
    });

    // Send welcome email
    try {
      await addWelcomeEmailJob(user.email, user.username || 'User', user.role);
    } catch (error) {
      console.error('Failed to queue welcome email:', error);
    }

    return user;
  }

  // Login function (email + password)
  async login(email: string, password: string, ip: string, userAgent: string) {
    const user = await UserModel.findOne({ email }).select('+password +avatar').exec();
    if (!user) throw new UnauthorizedError('Invalid credentials', 'invalid_credentials');
    if (!user.password) {
      throw new Error('Password not set for user');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedError('Invalid credentials', 'invalid_credentials');

    // Send login notification email
    try {
      await addLoginNotificationJob(user.email, user.username || 'User', {
        ipAddress: ip,
        userAgent: userAgent,
        location: 'Unknown', // You can add geolocation service here
      });
    } catch (error) {
      console.error('Failed to queue login notification email:', error);
    }

    // Generate JWT tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return { user, accessToken, refreshToken };
  }

  // Generate Access Token & Refresh Token
  generateAccessToken(user: any) {
    return jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_ACCESS_SECRET,
      { expiresIn: '15m' },
    );
  }

  generateRefreshToken(user: any) {
    return jwt.sign(
      {
        userId: user._id,
      },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' },
    );
  }

  // Generate new Access Token from Refresh Token
  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };

      const user = await UserModel.findById(payload.userId).exec();
      if (!user) throw new UnauthorizedError('User not found', 'user_not_found');

      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return { accessToken: newAccessToken, newRefreshToken };
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token', 'invalid_refresh_token');
    }
  }

  // Generate tokens for Google OAuth or other OAuth
  async generateAuthTokens(userId: string, email: string, role: string, permissions: string[]) {
    const accessToken = jwt.sign({ userId, email, role, permissions }, JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  // Forgot Password - Generate OTP and/or Reset Link
  async forgotPassword(data: ForgotPasswordInput, ip: string, userAgent: string) {
    const { email } = data;
    const verificationMethod = env.VERIFICATION_METHOD || 'BOTH';

    // Check if user exists
    const user = await UserModel.findOne({ email }).exec();
    if (!user) {
      return { message: i18n.__('auth.forgot_password_email_sent') };
    }

    // Delete any existing reset tokens for this user
    await PasswordReset.deleteMany({ email }).exec();

    // Generate OTP and token
    const otp = this.generateOTP();
    const token = this.generateResetToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Determine the type based on verification method
    let resetType: string;
    switch (verificationMethod) {
      case 'LINK':
        resetType = 'LINK';
        break;
      case 'OTP':
        resetType = 'OTP';
        break;
      case 'BOTH':
      default:
        resetType = 'BOTH';
        break;
    }

    // Create password reset record
    const passwordReset = await PasswordReset.create({
      email,
      otp,
      token,
      type: resetType,
      expiresAt,
    });

    // Send email based on verification method
    try {
      const resetUrl = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
      
      switch (verificationMethod) {
        case 'LINK':
          await emailService.sendForgotPasswordLinkEmail(email, user.username || 'User', resetUrl);
          break;
        case 'OTP':
          await emailService.sendForgotPasswordOtpEmail(email, user.username || 'User', otp);
          break;
        case 'BOTH':
        default:
          await emailService.sendForgotPasswordBothEmail(email, user.username || 'User', otp, resetUrl);
          break;
      }
    } catch (error) {
      console.error('Failed to send forgot password email:', error);
      throw new BadRequestError('Failed to send email', 'errors.failed_to_send_email');
    }

    // Log the activity
    await this.logUserActivity(user._id, 'FORGOT_PASSWORD_REQUEST', ip, userAgent);

    return { message: i18n.__('auth.forgot_password_email_sent') };
  }

  // Verify OTP
  async verifyOtp(data: VerifyOtpInput) {
    const { email, otp } = data;

    const passwordReset = await PasswordReset.findOne({
      email,
      otp,
      expiresAt: { $gt: new Date() },
      usedAt: null,
    }).exec();

    if (!passwordReset) {
      throw new BadRequestError(
        i18n.__('errors.invalid_or_expired_otp'),
        'errors.invalid_or_expired_otp',
      );
    }

    return { message: i18n.__('auth.otp_verified_successfully') };
  }

  // Reset Password with Token
  async resetPassword(data: ResetPasswordInput, ip: string, userAgent: string) {
    const { token, password } = data;

    const passwordReset = await PasswordReset.findOne({
      token,
      expiresAt: { $gt: new Date() },
      usedAt: null,
    }).exec();

    if (!passwordReset) {
      throw new BadRequestError(
        i18n.__('errors.invalid_or_expired_token'),
        'errors.invalid_or_expired_token',
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Update user password
    const user = await UserModel.findOneAndUpdate(
      { email: passwordReset.email },
      { password: hashedPassword },
      { new: true }
    ).exec();

    if (!user) {
      throw new Error('User not found');
    }

    // Mark reset token as used
    await PasswordReset.findByIdAndUpdate(passwordReset._id, { usedAt: new Date() }).exec();

    // Log the activity
    await this.logUserActivity(user._id, 'PASSWORD_RESET', ip, userAgent);

    return { message: i18n.__('auth.password_reset_successful') };
  }

  // Reset Password with OTP
  async resetPasswordWithOtp(data: ResetPasswordWithOtpInput, ip: string, userAgent: string) {
    const { email, otp, password } = data;

    const passwordReset = await PasswordReset.findOne({
      email,
      otp,
      expiresAt: { $gt: new Date() },
      usedAt: null,
    }).exec();

    if (!passwordReset) {
      throw new BadRequestError(
        i18n.__('errors.invalid_or_expired_otp'),
        'errors.invalid_or_expired_otp',
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Update user password
    const user = await UserModel.findOneAndUpdate(
      { email: passwordReset.email },
      { password: hashedPassword },
      { new: true }
    ).exec();

    if (!user) {
      throw new Error('User not found');
    }

    // Mark reset token as used
    await PasswordReset.findByIdAndUpdate(passwordReset._id, { usedAt: new Date() }).exec();

    // Log the activity
    await this.logUserActivity(user._id, 'PASSWORD_RESET_WITH_OTP', ip, userAgent);

    return { message: i18n.__('auth.password_reset_successful') };
  }

  // Generate 6-digit OTP
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate reset token
  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Log user activity
  private async logUserActivity(userId: string, action: string, ip: string, userAgent: string) {
    try {
      await AuditLogModel.create({
        entityType: 'user',
        entityId: userId,
        action,
        changedBy: userId,
        ipAddress: ip,
        userAgent,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to log user activity:', error);
    }
  }
}