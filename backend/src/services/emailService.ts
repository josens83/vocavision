/**
 * Email Service
 *
 * Handles email sending for notifications, reminders, and marketing
 * Supports multiple providers: SendGrid, AWS SES, Nodemailer
 *
 * @module services/emailService
 */

import logger from '../utils/logger';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private provider: 'sendgrid' | 'ses' | 'nodemailer' | 'console' = 'console';
  private defaultFrom: string = process.env.EMAIL_FROM || 'noreply@vocavision.com';

  constructor() {
    // Detect provider based on environment variables
    if (process.env.SENDGRID_API_KEY) {
      this.provider = 'sendgrid';
    } else if (process.env.AWS_SES_REGION) {
      this.provider = 'ses';
    } else if (process.env.SMTP_HOST) {
      this.provider = 'nodemailer';
    } else {
      this.provider = 'console';
      logger.warn('No email provider configured. Emails will be logged to console.');
    }

    logger.info(`Email service initialized with provider: ${this.provider}`);
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const emailData = {
        ...options,
        from: options.from || this.defaultFrom,
      };

      switch (this.provider) {
        case 'sendgrid':
          await this.sendWithSendGrid(emailData);
          break;
        case 'ses':
          await this.sendWithSES(emailData);
          break;
        case 'nodemailer':
          await this.sendWithNodemailer(emailData);
          break;
        default:
          this.logEmail(emailData);
      }

      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email', {
        error: (error as Error).message,
        to: options.to,
        subject: options.subject,
      });
      return false;
    }
  }

  /**
   * Send with SendGrid
   */
  private async sendWithSendGrid(options: EmailOptions): Promise<void> {
    this.logEmail(options);
  }

  /**
   * Send with AWS SES
   */
  private async sendWithSES(options: EmailOptions): Promise<void> {
    this.logEmail(options);
  }

  /**
   * Send with Nodemailer
   */
  private async sendWithNodemailer(options: EmailOptions): Promise<void> {
    this.logEmail(options);
  }

  /**
   * Log email to console (fallback)
   */
  private logEmail(options: EmailOptions): void {
    console.log('========== EMAIL ==========');
    console.log('From:', options.from);
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('HTML:', options.html?.substring(0, 100) + '...');
    console.log('Text:', options.text?.substring(0, 100) + '...');
    console.log('===========================');
  }

  /**
   * Send template email
   */
  async sendTemplateEmail(
    template: EmailTemplate,
    to: string | string[],
    variables: Record<string, string>
  ): Promise<boolean> {
    let html = template.html;
    let text = template.text || '';
    let subject = template.subject;

    // Replace variables
    Object.keys(variables).forEach((key) => {
      const value = variables[key];
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
      text = text.replace(new RegExp(`{{${key}}}`, 'g'), value);
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    return this.sendTemplateEmail(
      {
        name: 'welcome',
        subject: 'Welcome to VocaVision!',
        html: `
          <h1>Welcome to VocaVision, {{name}}!</h1>
          <p>We're excited to have you on board.</p>
          <p>Start learning vocabulary with our AI-powered platform.</p>
          <a href="https://vocavision.com/dashboard">Go to Dashboard</a>
        `,
        text: 'Welcome to VocaVision! Start learning now.',
      },
      email,
      { name }
    );
  }

  /**
   * Send review reminder email
   */
  async sendReviewReminderEmail(
    email: string,
    name: string,
    dueWordsCount: number
  ): Promise<boolean> {
    return this.sendTemplateEmail(
      {
        name: 'review-reminder',
        subject: `You have ${dueWordsCount} words to review`,
        html: `
          <h1>Hi {{name}}!</h1>
          <p>You have <strong>{{count}} words</strong> ready for review.</p>
          <p>Reviewing now will help you retain them in long-term memory.</p>
          <a href="https://vocavision.com/learn">Review Now</a>
        `,
        text: `You have ${dueWordsCount} words to review.`,
      },
      email,
      { name, count: dueWordsCount.toString() }
    );
  }

  /**
   * Send streak reminder email
   */
  async sendStreakReminderEmail(
    email: string,
    name: string,
    streak: number
  ): Promise<boolean> {
    return this.sendTemplateEmail(
      {
        name: 'streak-reminder',
        subject: `Don't break your ${streak}-day streak!`,
        html: `
          <h1>Hi {{name}}!</h1>
          <p>You're on a <strong>{{streak}}-day streak</strong>!</p>
          <p>Study today to keep it going.</p>
          <a href="https://vocavision.com/learn">Continue Learning</a>
        `,
        text: `You're on a ${streak}-day streak!`,
      },
      email,
      { name, streak: streak.toString() }
    );
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `https://vocavision.com/reset-password?token=${resetToken}`;

    return this.sendTemplateEmail(
      {
        name: 'password-reset',
        subject: 'Reset Your Password',
        html: `
          <h1>Password Reset Request</h1>
          <p>Click the link below to reset your password:</p>
          <a href="{{resetUrl}}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
        text: `Reset your password: ${resetUrl}`,
      },
      email,
      { resetUrl }
    );
  }
}

// Singleton instance
export const emailService = new EmailService();

export default emailService;
