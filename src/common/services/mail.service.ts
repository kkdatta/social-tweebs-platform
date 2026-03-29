import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port');
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.pass');
    this.from = this.configService.get<string>('mail.from') || 'noreply@socialtweebs.com';
    this.frontendUrl = this.configService.get<string>('app.frontendUrl') || 'http://localhost:3001';

    if (user && pass && host) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: this.configService.get<boolean>('mail.secure') || false,
        auth: { user, pass },
      });
    } else {
      this.logger.warn('SMTP not configured — emails will be logged to console');
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
    }
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      const info = await this.transporter.sendMail({ from: this.from, to, subject, html });
      if (info.envelope) {
        this.logger.log(`Email sent to ${to}: ${subject}`);
      } else {
        this.logger.log(`[DEV] Email for ${to}: ${subject}\n${JSON.parse(info.message).html?.substring(0, 200)}`);
      }
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
    await this.send(email, 'Reset Your Password - SocialTweebs', `
      <h2>Reset Your Password</h2>
      <p>You have requested to reset your password. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}" style="background:#4F46E5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Reset Password</a></p>
      <p>This link is valid for 24 hours.</p>
      <p>If you did not request this, please ignore this email.</p>
      <p>— SocialTweebs Team</p>
    `);
  }

  async sendWelcomeEmail(email: string, name: string, password: string): Promise<void> {
    const loginUrl = `${this.frontendUrl}/login`;
    await this.send(email, 'Welcome to SocialTweebs – Your Account is Now Active!', `
      <h2>Welcome to SocialTweebs, ${name}!</h2>
      <p>Your account has been created. Here are your login credentials:</p>
      <p><strong>Email:</strong> ${email}<br/><strong>Password:</strong> ${password}</p>
      <p><a href="${loginUrl}" style="background:#4F46E5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Login Now</a></p>
      <p>We recommend changing your password after first login.</p>
      <p>— SocialTweebs Team</p>
    `);
  }

  async sendSignupConfirmation(email: string, name: string): Promise<void> {
    await this.send(email, 'Signup Received - SocialTweebs', `
      <h2>Thank you, ${name}!</h2>
      <p>We have received your signup request. Our team will review your details and get in touch with you shortly.</p>
      <p>Once your account is verified and activated, you will receive a separate email with your login details.</p>
      <p>— SocialTweebs Team</p>
    `);
  }

  async sendSignupNotificationToAdmin(adminEmail: string, signupName: string, signupEmail: string): Promise<void> {
    await this.send(adminEmail, 'New Signup Request - SocialTweebs', `
      <h2>New Signup Request</h2>
      <p>A new user has registered on SocialTweebs:</p>
      <p><strong>Name:</strong> ${signupName}<br/><strong>Email:</strong> ${signupEmail}</p>
      <p>Please review and activate their account from the admin panel.</p>
      <p>— SocialTweebs System</p>
    `);
  }

  async sendAccountActivation(email: string, name: string): Promise<void> {
    const loginUrl = `${this.frontendUrl}/login`;
    await this.send(email, 'Your Account is Now Active - SocialTweebs', `
      <h2>Account Activated!</h2>
      <p>Hi ${name}, your SocialTweebs account has been activated.</p>
      <p><a href="${loginUrl}" style="background:#4F46E5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Login Now</a></p>
      <p>— SocialTweebs Team</p>
    `);
  }

  async sendAccountExpiryReminder(email: string, name: string, daysLeft: number): Promise<void> {
    await this.send(email, `Account Expiring in ${daysLeft} Day${daysLeft > 1 ? 's' : ''} - SocialTweebs`, `
      <h2>Account Expiry Reminder</h2>
      <p>Hi ${name}, your SocialTweebs account will expire in <strong>${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong>.</p>
      <p>Please contact your administrator to extend your account validity.</p>
      <p>— SocialTweebs Team</p>
    `);
  }

  async sendCreditNotification(email: string, name: string, type: 'credit' | 'debit', amount: number, module: string, comment?: string): Promise<void> {
    const action = type === 'credit' ? 'credited to' : 'debited from';
    await this.send(email, `Credits ${type === 'credit' ? 'Added' : 'Deducted'} - SocialTweebs`, `
      <h2>Credit ${type === 'credit' ? 'Addition' : 'Deduction'} Notification</h2>
      <p>Hi ${name},</p>
      <p><strong>${amount}</strong> credits have been ${action} your account.</p>
      <p><strong>Module:</strong> ${module}</p>
      ${comment ? `<p><strong>Comment:</strong> ${comment}</p>` : ''}
      <p>— SocialTweebs Team</p>
    `);
  }

  async sendReportCompleted(email: string, name: string, reportType: string, reportName: string): Promise<void> {
    await this.send(email, `${reportType} Report Ready - SocialTweebs`, `
      <h2>Your Report is Ready!</h2>
      <p>Hi ${name}, your <strong>${reportType}</strong> report "${reportName}" has been completed and is ready for viewing.</p>
      <p><a href="${this.frontendUrl}" style="background:#4F46E5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">View Report</a></p>
      <p>— SocialTweebs Team</p>
    `);
  }

  async sendReportShared(email: string, sharedByName: string, reportType: string, reportName: string, shareUrl: string): Promise<void> {
    await this.send(email, `Report Shared with You - SocialTweebs`, `
      <h2>A Report Has Been Shared With You</h2>
      <p>${sharedByName} has shared a <strong>${reportType}</strong> report "${reportName}" with you.</p>
      <p><a href="${shareUrl}" style="background:#4F46E5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">View Report</a></p>
      <p>— SocialTweebs Team</p>
    `);
  }

  async sendValidityExtended(email: string, name: string, newEndDate: string): Promise<void> {
    await this.send(email, 'Account Validity Extended - SocialTweebs', `
      <h2>Account Validity Extended</h2>
      <p>Hi ${name}, your account validity has been extended until <strong>${newEndDate}</strong>.</p>
      <p>— SocialTweebs Team</p>
    `);
  }
}
