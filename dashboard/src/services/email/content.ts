'server-only';

import { getEmailHeader, getEmailFooter, getTextEmailFooter } from '@/services/email/template/email-components';

export function wrapEmailContent(content: string): string {
  return getEmailHeader() + content + getEmailFooter();
}

export function wrapTextEmailContent(content: string): string {
  return content + '\n\n' + getTextEmailFooter();
}
