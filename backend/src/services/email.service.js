import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendResetEmail = async (email, name, resetUrl) => {
  await resend.emails.send({
    from: 'Aurora Health <onboarding@resend.dev>',
    to: email,
    subject: 'Reset Your Aurora Password',
    html: `
      <h2>Password Reset</h2>
      <p>Hello ${name},</p>
      <p>Click the button below to reset your password:</p>

      <a href="${resetUrl}"
         style="
         background:#6366f1;
         color:white;
         padding:12px 24px;
         text-decoration:none;
         border-radius:8px;
         display:inline-block;">
         Reset Password
      </a>

      <p>This link expires in 1 hour.</p>
    `,
  });
};