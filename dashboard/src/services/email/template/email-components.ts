export function getEmailHeader(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Betterlytics</title>
      <style>
        body { 
          margin: 0; 
          padding: 40px 20px; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background-color: #f8fafc;
        }
        .email-wrapper {
          max-width: 600px; 
          margin: 0 auto;
        }
        .email-content-box { 
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }
        .email-logo-header {
          display: flex;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
        }
        .logo { 
          height: 32px;
          width: auto;
          margin-right: 12px;
        }
        .company-name {
          color: #1f2937;
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }
        .content-section {
          background-color: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 24px;
          margin: 20px 0;
        }
        .button { 
          display: inline-block; 
          background-color: #2563eb; 
          color: #ffffff !important; 
          padding: 14px 28px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600;
          margin: 24px 0;
          text-align: center;
          font-size: 16px;
          border: none;
          cursor: pointer;
        }
        .button:hover {
          background-color: #1d4ed8;
        }
        .button-success { background-color: #16a34a; }
        .button-success:hover { background-color: #15803d; }
        .button-danger { background-color: #dc2626; }
        .button-danger:hover { background-color: #b91c1c; }
        .button-warning { background-color: #f59e0b; }
        .button-warning:hover { background-color: #d97706; }
        .alert-box { 
          background-color: #fef2f2; 
          border-left: 4px solid #dc2626; 
          padding: 20px; 
          margin: 24px 0;
          border-radius: 0 8px 8px 0;
        }
        .success-box {
          background-color: #f0fdf4;
          border-left: 4px solid #16a34a;
          padding: 20px;
          margin: 24px 0;
          border-radius: 0 8px 8px 0;
        }
        .warning-box {
          background-color: #fefce8;
          border-left: 4px solid #f59e0b;
          padding: 20px;
          margin: 24px 0;
          border-radius: 0 8px 8px 0;
        }
        .info-box {
          background-color: #eff6ff;
          border-left: 4px solid #2563eb;
          padding: 20px;
          margin: 24px 0;
          border-radius: 0 8px 8px 0;
        }
        h1 {
          color: #1f2937;
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 20px 0;
          line-height: 1.3;
        }
        h2 {
          color: #374151;
          font-size: 22px;
          font-weight: 600;
          margin: 30px 0 15px 0;
        }
        h3 {
          color: #374151;
          font-size: 18px;
          font-weight: 600;
          margin: 20px 0 10px 0;
        }
        p {
          color: #4b5563;
          font-size: 16px;
          margin: 16px 0;
          line-height: 1.6;
        }
        .highlight {
          background-color: #fef3c7;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }
        .center {
          text-align: center;
        }
        @media only screen and (max-width: 600px) {
          body { padding: 20px 15px; }
          .email-content-box { padding: 30px 25px; }
          .email-logo-header { flex-direction: column; align-items: flex-start; }
          .logo { margin-right: 0; margin-bottom: 8px; }
          .content-section { padding: 15px; margin: 15px 0; }
          h1 { font-size: 24px; }
          h2 { font-size: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-content-box">
          <div class="email-logo-header">
            <img src="https://betterlytics.io/betterlytics-logo-dark-simple.svg" alt="Betterlytics" class="logo" width="120" height="32"/>
            <div class="company-name">Betterlytics</div>
          </div>
  `;
}

export function getEmailFooter(): string {
  return `
        </div>
        <div style="text-align: center; margin-top: 30px; padding: 20px;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
            © ${new Date().getFullYear()} Betterlytics. All rights reserved.<br>
            You're receiving this email because you have an account with Betterlytics.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function createEmailButton(
  text: string,
  url: string,
  type: 'primary' | 'success' | 'danger' = 'primary',
): string {
  const buttonClass = type === 'primary' ? 'button' : `button button-${type}`;
  return `<a href="${url}" class="${buttonClass}" style="text-decoration: none;">${text}</a>`;
}

export function createInfoBox(content: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): string {
  let boxClass = 'info-box';
  switch (type) {
    case 'info':
      boxClass = 'info-box';
      break;
    case 'success':
      boxClass = 'success-box';
      break;
    case 'warning':
      boxClass = 'warning-box';
      break;
    case 'error':
      boxClass = 'alert-box';
      break;
    default:
      boxClass = 'info-box';
  }

  return `<div class="${boxClass}">${content}</div>`;
}

export function createEmailSignature(): string {
  return `
    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 16px; font-weight: 500;">
        Best regards,<br>
        <strong style="color: #374151;">The Betterlytics Team</strong>
      </p>
      <div style="margin: 20px 0 0 0;">
        <a href="https://betterlytics.io" style="color: #2563eb; text-decoration: none; font-weight: 500; margin: 0 15px 0 0;">Website</a>
        <a href="mailto:support@betterlytics.io" style="color: #2563eb; text-decoration: none; font-weight: 500; margin: 0 15px;">Support</a>
        <a href="https://betterlytics.io/docs" style="color: #2563eb; text-decoration: none; font-weight: 500; margin: 0 0 0 15px;">Documentation</a>
      </div>
    </div>
  `;
}

export function createTextEmailSignature(): string {
  return `
Best regards,
The Betterlytics Team

Website: https://betterlytics.io
Support: support@betterlytics.io
Documentation: https://betterlytics.io/docs
  `.trim();
}

export function getTextEmailFooter(): string {
  return `
---
© ${new Date().getFullYear()} Betterlytics. All rights reserved.
You're receiving this email because you have an account with Betterlytics.`.trim();
}

export const emailStyles = {
  // Text colors
  primaryText: 'color: #1f2937;',
  mutedText: 'color: #4b5563;',
  secondaryText: 'color: #6b7280;',
  lightText: 'color: #9ca3af;',

  // Link styles
  primaryLink: 'color: #2563eb; text-decoration: none; font-weight: 500;',
  mutedLink: 'color: #2563eb; text-decoration: none;',

  // Common heading styles
  infoHeading: 'margin: 0 0 10px 0; color: #1d4ed8; font-size: 18px;',
  successHeading: 'margin: 0 0 10px 0; color: #059669; font-size: 18px;',
  warningHeading: 'margin: 0 0 10px 0; color: #f59e0b; font-size: 18px;',
  errorHeading: 'margin: 0 0 10px 0; color: #dc2626; font-size: 18px;',

  // List styles
  orderedList: 'margin: 10px 0 0 0; padding-left: 20px; color: #4b5563;',
  unorderedList:
    'margin: 20px 0; padding-left: 20px; color: #4b5563; list-style-type: disc; list-style-position: outside;',
  listItem: 'margin: 8px 0; list-style-type: thumbs;',
  listItemSteps: 'margin: 8px 0; list-style-type: disc;',
  resourceListItem: 'margin: 10px 0; list-style-type: disc;',
};

export function createPrimaryLink(text: string, url: string, additionalStyles = ''): string {
  return `<a href="${url}" style="${emailStyles.primaryLink} ${additionalStyles}">${text}</a>`;
}

export const emailIcons = {
  stats: '📊',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  alert: '🚨',
};
