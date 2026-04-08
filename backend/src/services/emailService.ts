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
  private defaultFrom: string = process.env.EMAIL_FROM || 'noreply@vocavision.app';

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
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to: options.to,
      from: options.from || this.defaultFrom,
      subject: options.subject,
      text: options.text,
      html: options.html,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
    });
  }

  /**
   * Send with AWS SES
   */
  private async sendWithSES(options: EmailOptions): Promise<void> {
    // TODO: Implement AWS SES integration
    /*
    const AWS = require('aws-sdk');
    const ses = new AWS.SES({
      region: process.env.AWS_SES_REGION,
    });

    const params = {
      Source: options.from,
      Destination: {
        ToAddresses: Array.isArray(options.to) ? options.to : [options.to],
        CcAddresses: options.cc,
        BccAddresses: options.bcc,
      },
      Message: {
        Subject: {
          Data: options.subject,
        },
        Body: {
          Html: {
            Data: options.html || '',
          },
          Text: {
            Data: options.text || '',
          },
        },
      },
      ReplyToAddresses: options.replyTo ? [options.replyTo] : [],
    };

    await ses.sendEmail(params).promise();
    */
    this.logEmail(options);
  }

  /**
   * Send with Nodemailer
   */
  private async sendWithNodemailer(options: EmailOptions): Promise<void> {
    // TODO: Implement Nodemailer integration
    /*
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: options.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      attachments: options.attachments,
    });
    */
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
  async sendWelcomeEmail(email: string, name: string, isGlobal = false): Promise<boolean> {
    const domain = isGlobal ? 'https://vocavision.app' : 'https://vocavision.kr';
    return this.sendTemplateEmail(
      {
        name: 'welcome',
        subject: isGlobal ? 'Welcome to VocaVision! 🎉' : 'VocaVision AI에 오신 것을 환영합니다! 🎉',
        html: isGlobal ? `
          <h1>Welcome to VocaVision, {{name}}!</h1>
          <p>We're excited to have you on board.</p>
          <p>Start learning vocabulary with our AI-powered platform.</p>
          <a href="${domain}/dashboard">Go to Dashboard</a>
        ` : `
          <h1>{{name}}님, VocaVision AI에 오신 것을 환영합니다!</h1>
          <p>AI 이미지와 어원 분석으로 영어 단어를 쉽게 암기하세요.</p>
          <a href="${domain}/dashboard">학습 시작하기</a>
        `,
        text: isGlobal ? 'Welcome to VocaVision! Start learning now.' : 'VocaVision AI에 오신 것을 환영합니다!',
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
    dueWordsCount: number,
    isGlobal = false
  ): Promise<boolean> {
    const domain = isGlobal ? 'https://vocavision.app' : 'https://vocavision.kr';
    return this.sendTemplateEmail(
      {
        name: 'review-reminder',
        subject: isGlobal
          ? `You have ${dueWordsCount} words to review`
          : `복습할 단어가 ${dueWordsCount}개 있습니다`,
        html: isGlobal ? `
          <h1>Hi {{name}}!</h1>
          <p>You have <strong>{{count}} words</strong> ready for review.</p>
          <p>Reviewing now will help you retain them in long-term memory.</p>
          <a href="${domain}/learn">Review Now</a>
        ` : `
          <h1>{{name}}님, 복습할 시간입니다!</h1>
          <p><strong>{{count}}개</strong> 단어가 복습을 기다리고 있습니다.</p>
          <p>지금 복습하면 장기 기억에 더 잘 남습니다.</p>
          <a href="${domain}/learn">복습하기</a>
        `,
        text: isGlobal
          ? `You have ${dueWordsCount} words to review.`
          : `복습할 단어가 ${dueWordsCount}개 있습니다.`,
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
    streak: number,
    isGlobal = false
  ): Promise<boolean> {
    const domain = isGlobal ? 'https://vocavision.app' : 'https://vocavision.kr';
    return this.sendTemplateEmail(
      {
        name: 'streak-reminder',
        subject: isGlobal
          ? `Don't break your ${streak}-day streak! 🔥`
          : `${streak}일 연속 학습 중! 오늘도 이어가세요 🔥`,
        html: isGlobal ? `
          <h1>Hi {{name}}!</h1>
          <p>You're on a <strong>{{streak}}-day streak</strong>! 🔥</p>
          <p>Study today to keep it going.</p>
          <a href="${domain}/learn">Continue Learning</a>
        ` : `
          <h1>{{name}}님, 대단해요!</h1>
          <p><strong>{{streak}}일 연속</strong> 학습 중입니다! 🔥</p>
          <p>오늘도 학습해서 기록을 이어가세요.</p>
          <a href="${domain}/learn">학습 계속하기</a>
        `,
        text: isGlobal
          ? `You're on a ${streak}-day streak!`
          : `${streak}일 연속 학습 중!`,
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
    resetToken: string,
    isGlobal = false
  ): Promise<boolean> {
    const domain = isGlobal ? 'https://vocavision.app' : 'https://vocavision.kr';
    const resetUrl = `${domain}/reset-password?token=${resetToken}`;

    return this.sendTemplateEmail(
      {
        name: 'password-reset',
        subject: isGlobal ? 'Reset Your Password' : '비밀번호 재설정',
        html: isGlobal ? `
          <h1>Password Reset Request</h1>
          <p>Click the link below to reset your password:</p>
          <a href="{{resetUrl}}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        ` : `
          <h1>비밀번호 재설정</h1>
          <p>아래 링크를 클릭하여 비밀번호를 재설정하세요:</p>
          <a href="{{resetUrl}}">비밀번호 재설정</a>
          <p>이 링크는 1시간 후 만료됩니다.</p>
        `,
        text: isGlobal ? `Reset your password: ${resetUrl}` : `비밀번호 재설정: ${resetUrl}`,
      },
      email,
      { resetUrl }
    );
  }

  /**
   * 구독 갱신 성공 이메일
   */
  async sendRenewalSuccessEmail(
    email: string,
    plan: string,
    nextDate: string,
    amount: string
  ): Promise<boolean> {
    return this.sendTemplateEmail(
      {
        name: 'renewal-success',
        subject: '구독이 갱신되었습니다 ✅',
        html: `
          <h1>구독 갱신 완료</h1>
          <p>{{plan}} 플랜이 정상적으로 갱신되었습니다.</p>
          <p><strong>결제 금액:</strong> {{amount}}</p>
          <p><strong>다음 결제일:</strong> {{nextDate}}</p>
          <p>VocaVision AI를 이용해 주셔서 감사합니다.</p>
          <a href="https://vocavision.kr/dashboard">학습 계속하기</a>
        `,
        text: `${plan} 플랜이 갱신되었습니다. 결제: ${amount}, 다음 결제일: ${nextDate}`,
      },
      email,
      { plan, nextDate, amount }
    );
  }

  /**
   * 결제 실패 안내 이메일 (재시도 예정)
   */
  async sendPaymentFailedEmail(
    email: string,
    plan: string,
    retryCount: string,
    maxRetries: string
  ): Promise<boolean> {
    return this.sendTemplateEmail(
      {
        name: 'payment-failed',
        subject: '결제가 실패했습니다 — 카드를 확인해주세요',
        html: `
          <h1>결제 실패 안내</h1>
          <p>{{plan}} 플랜 갱신을 위한 결제가 실패했습니다.</p>
          <p>등록된 카드의 잔액 또는 유효기간을 확인해주세요.</p>
          <p><strong>재시도:</strong> {{retryCount}}/{{maxRetries}}회 시도 완료</p>
          <p>24시간 후 자동으로 재시도됩니다.</p>
          <a href="https://vocavision.kr/my">결제 수단 확인하기</a>
        `,
        text: `${plan} 결제 실패. ${retryCount}/${maxRetries}회 시도. 카드를 확인해주세요.`,
      },
      email,
      { plan, retryCount, maxRetries }
    );
  }

  /**
   * 구독 만료 안내 이메일 (최종 실패)
   */
  async sendSubscriptionExpiredEmail(
    email: string,
    plan: string,
    expireDate: string
  ): Promise<boolean> {
    return this.sendTemplateEmail(
      {
        name: 'subscription-expired',
        subject: '구독이 만료됩니다 — 재구독하세요',
        html: `
          <h1>구독 만료 안내</h1>
          <p>{{plan}} 플랜의 결제가 3회 실패하여 자동 갱신이 중단되었습니다.</p>
          <p><strong>만료일:</strong> {{expireDate}}</p>
          <p>만료 후에도 무료 플랜(수능 L1)은 계속 이용 가능합니다.</p>
          <p>프리미엄 기능을 계속 사용하시려면 재구독해주세요.</p>
          <a href="https://vocavision.kr/pricing">재구독하기</a>
        `,
        text: `${plan} 구독이 ${expireDate}에 만료됩니다. 재구독: https://vocavision.kr/pricing`,
      },
      email,
      { plan, expireDate }
    );
  }
}

// Singleton instance
export const emailService = new EmailService();

export default emailService;
