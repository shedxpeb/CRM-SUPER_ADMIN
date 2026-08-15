import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('smtp.host');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('smtp.port') || 587,
        secure: (this.config.get<number>('smtp.port') || 587) === 465,
        auth: this.config.get<string>('smtp.user')
          ? {
              user: this.config.get<string>('smtp.user'),
              pass: this.config.get<string>('smtp.pass'),
            }
          : undefined,
      });
    }
  }

  isReady(): boolean {
    return !!this.transporter;
  }

  /**
   * Sends the tenant admin welcome/onboarding email. No credentials are ever
   * included: if the operator set an initial password they share it out-of-band;
   * otherwise the admin sets their own password through the CRM OTP flow.
   * Best-effort: failures are logged, never thrown.
   */
  async sendTenantAdminWelcome(input: {
    to: string;
    tenantName: string;
    passwordSetByOperator: boolean;
    crmUrl: string;
  }): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `SMTP not configured — skipping welcome email to ${input.to}. ` +
          'Set SMTP_HOST/SMTP_USER/SMTP_PASS to enable email delivery.',
      );
      return;
    }
    try {
      const resetText = input.passwordSetByOperator
        ? `An administrator has set an initial password for your account. Sign in at ${input.crmUrl} with your email and that password, then change it from your profile settings.`
        : `Sign in at ${input.crmUrl} and use the "Forgot password" option to set your password. You will receive an OTP by email to verify your identity.`;
      const resetHtml = input.passwordSetByOperator
        ? `<p>An administrator has set an initial password for your account. Sign in at <a href="${input.crmUrl}">${input.crmUrl}</a> with your email and that password, then change it from your profile settings.</p>`
        : `<p>Sign in at <a href="${input.crmUrl}">${input.crmUrl}</a> and use the <strong>Forgot password</strong> option to set your password. You will receive an OTP by email to verify your identity.</p>`;
      await this.transporter.sendMail({
        from: this.config.get<string>('smtp.from') || 'no-reply@pebplatform.io',
        to: input.to,
        subject: `Welcome to ${input.tenantName} — your account is ready`,
        text: [
          `Hello,`,
          ``,
          `Your organization "${input.tenantName}" has been provisioned on the PEB CRM platform.`,
          ``,
          `Sign in at: ${input.crmUrl}`,
          `Email:    ${input.to}`,
          ``,
          resetText,
          ``,
          `— PEB Platform`,
        ].join('\n'),
        html: [
          `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#172B4D">`,
          `<h2 style="color:#0C66E4">Welcome to ${input.tenantName}</h2>`,
          `<p>Your organization has been provisioned on the PEB CRM platform.</p>`,
          `<table style="border:1px solid #DFE1E6;border-radius:8px;padding:16px;margin:16px 0">`,
          `<tr><td style="padding:4px 12px 4px 0;color:#626F86">Sign in</td><td><strong>${input.crmUrl}</strong></td></tr>`,
          `<tr><td style="padding:4px 12px 4px 0;color:#626F86">Email</td><td><strong>${input.to}</strong></td></tr>`,
          `</table>`,
          resetHtml,
          `<p style="color:#626F86;font-size:12px">— PEB Platform</p>`,
          `</div>`,
        ].join('\n'),
      });
      this.logger.log(`Welcome email sent to ${input.to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${input.to}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
