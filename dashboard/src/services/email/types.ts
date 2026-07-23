'server-only';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailData {
  to: string;
  toName?: string;
  from?: string;
  fromName?: string;
}
