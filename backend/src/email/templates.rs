use chrono::Utc;

/// HTML-version of emails should be wrapped by this
pub fn wrap_html(content: &str) -> String {
    format!(
        "{header}{content}{footer}",
        header = email_header(),
        content = content,
        footer = email_footer(),
    )
}

/// Text-version of emails should be wrapped by this
pub fn wrap_text(content: &str) -> String {
    format!("{}\n\n{}", content, text_footer())
}

pub fn email_header() -> &'static str {
    r#"<!DOCTYPE html>
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
        }
        .button-success { background-color: #16a34a; }
        .button-danger { background-color: #dc2626; }
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
        h1 {
          color: #1f2937;
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 20px 0;
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
        }
        .center { text-align: center; }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-content-box">
          <div class="email-logo-header">
            <img 
              src="https://betterlytics.io/betterlytics-logo-dark-simple-96x96-q75.png"
              alt="Betterlytics"
              width="48"
              height="48"
              style="display: block; border: 0; width: 48px; height: 48px; margin-right: 12px;"
            />
            <div style="color: #1f2937; font-size: 20px; font-weight: 600;">Betterlytics</div>
          </div>"#
}

pub fn email_signature() -> &'static str {
    r#"<div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 16px; font-weight: 500;">
        Best regards,<br>
        <strong style="color: #374151;">The Betterlytics Team</strong>
      </p>
    </div>"#
}

pub fn email_footer() -> String {
    let year = Utc::now().format("%Y");
    format!(
        r#"</div>
        <div style="text-align: center; margin-top: 30px; padding: 20px;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
            © {year} Betterlytics. All rights reserved.<br>
            You're receiving this email because you have an account with Betterlytics.
          </p>
        </div>
      </div>
    </body>
    </html>"#,
        year = year
    )
}

pub fn text_footer() -> String {
    let year = Utc::now().format("%Y");
    format!(
        "---\n\
        Best regards,\n\
        The Betterlytics Team\n\n\
        © {year} Betterlytics. All rights reserved.\n\
        You're receiving this email because you have an account with Betterlytics.",
        year = year
    )
}

pub fn html_escape(s: &str) -> String {
    html_escape::encode_safe(s).to_string()
}
