import nodemailer from "nodemailer";

export async function sendEmail({ to, subject, html }) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("SMTP credentials not fully provided in .env, skipping email.");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port) || 587,
      secure: parseInt(port) === 465,
      auth: {
        user,
        pass,
      },
    });

    const styledHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #0f172a; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px;">AAROGYA</h1>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Food Safety & Grievance Portal</p>
        </div>
        <div style="padding: 24px; color: #334155; line-height: 1.6; font-size: 15px;">
          ${html}
        </div>
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
          <p style="margin: 0;">This is an automated notification from the Aarogya Food Safety Grievance Portal.</p>
          <p style="margin: 4px 0 0 0;">Please do not reply to this email.</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Aarogya Food Safety" <${user}>`,
      to,
      subject,
      html: styledHtml,
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email via SMTP:", error);
  }
}
