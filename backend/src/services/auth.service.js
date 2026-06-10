import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/database.js';
import { config } from '../config/index.js';
import { generateToken } from '../utils/jwt.js';
import { hashPassword, comparePassword, generateResetToken } from '../utils/password.js';
import { AppError } from '../utils/helpers.js';
import { calculateProfileCompletion } from '../utils/profile.js';
import nodemailer from 'nodemailer';

const googleClient = new OAuth2Client(config.google.clientId);

const getEmailTransporter = () => {
  if (!config.smtp.host || !config.smtp.user) return null;
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: false,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
};

export const authService = {
  async register({ email, password, name }) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email already registered', 409);

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        healthProfile: { create: {} },
      },
      select: { id: true, email: true, name: true, role: true, avatar: true },
    });

    const token = generateToken(user.id);
    return { user, token };
  },

  async login({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { healthProfile: true },
    });
    if (!user || !user.password) throw new AppError('Invalid credentials', 401);

    const valid = await comparePassword(password, user.password);
    if (!valid) throw new AppError('Invalid credentials', 401);

    const token = generateToken(user.id);
    const { password: _, ...safeUser } = user;
    return { user: safeUser, token };
  },

  async googleAuth(credential) {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.google.clientId,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
      include: { healthProfile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          name: name || email.split('@')[0],
          avatar: picture,
          emailVerified: true,
          healthProfile: { create: {} },
        },
        include: { healthProfile: true },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, avatar: picture || user.avatar, emailVerified: true },
        include: { healthProfile: true },
      });
    }

    const token = generateToken(user.id);
    const { password: _, ...safeUser } = user;
    return { user: safeUser, token };
  },

  async forgotPassword(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If email exists, reset link sent' };

    const resetToken = generateResetToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetExpires: new Date(Date.now() + 3600000),
      },
    });

    const transporter = getEmailTransporter();
    if (transporter) {
      const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
      await transporter.sendMail({
        from: config.smtp.from,
        to: email,
        subject: 'Reset your Aurora password',
        html: `<p>Hi ${user.name},</p><p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`,
      });
    }

    return {
      message: 'If email exists, reset link sent',
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    };
  },

  async resetPassword(token, newPassword) {
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetExpires: { gt: new Date() } },
    });
    if (!user) throw new AppError('Invalid or expired reset token', 400);

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetExpires: null },
    });

    return { message: 'Password reset successful' };
  },

  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        healthProfile: true,
      },
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
  },

  async updateProfile(userId, data) {
    const { name, avatar, ...rawProfile } = data;
    const profileData = { ...rawProfile };

    if (profileData.age != null && profileData.age !== '') {
      profileData.age = parseInt(profileData.age, 10);
    }
    if (profileData.height != null && profileData.height !== '') {
      profileData.height = parseFloat(profileData.height);
    }
    if (profileData.weight != null && profileData.weight !== '') {
      profileData.weight = parseFloat(profileData.weight);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(avatar !== undefined && { avatar }),
        ...(Object.keys(profileData).length > 0 && {
          healthProfile: { update: profileData },
        }),
      },
      include: { healthProfile: true },
    });

    const habitCount = await prisma.habit.count({ where: { userId, isActive: true } });
    const { percent } = calculateProfileCompletion(user, user.healthProfile, habitCount);
    if (user.healthProfile) {
      await prisma.healthProfile.update({
        where: { userId },
        data: { profileCompletion: percent },
      });
      user.healthProfile.profileCompletion = percent;
    }

    return user;
  },
};
