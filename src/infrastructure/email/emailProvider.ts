export interface EmailProvider {
  send(params: { to: string; subject: string; html: string }): Promise<void>;
}

/**
 * Demo fallback for whenever `RESEND_API_KEY` isn't set — logs instead of
 * sending, same "works without credentials, just does nothing real" shape
 * as the mock payment providers. Never throws, so review submission still
 * succeeds locally without an email account configured.
 */
export class LoggingEmailProvider implements EmailProvider {
  async send(params: { to: string; subject: string; html: string }): Promise<void> {
    console.log(`[email:demo] Would send "${params.subject}" to ${params.to}`);
  }
}

export class ResendEmailProvider implements EmailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(params: { to: string; subject: string; html: string }): Promise<void> {
    const { Resend } = await import("resend");
    const resend = new Resend(this.apiKey);
    const result = await resend.emails.send({
      from: this.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (result.error) {
      throw new Error(`Resend failed to send email: ${result.error.message}`);
    }
  }
}

export function isEmailSendingConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export function getEmailProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (apiKey && from) {
    return new ResendEmailProvider(apiKey, from);
  }
  return new LoggingEmailProvider();
}
