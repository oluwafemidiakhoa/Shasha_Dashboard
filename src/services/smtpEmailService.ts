import nodemailer from 'nodemailer';
import type { DigestData } from './emailService';
import { generateEmailHTML } from './emailService';

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Zoho Mail SMTP Configuration
export const zohoConfig: SMTPConfig = {
  host: 'smtp.zoho.com',
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.SMTP_USER || 'foundryai@getfoundryai.com',
    pass: process.env.SMTP_PASS || 'Flindell1977@'
  }
};

export async function sendEmailViaSMTP(
  config: SMTPConfig,
  to: string[],
  subject: string,
  html: string,
  from?: string
): Promise<void> {
  // Create transporter
  const transporter = nodemailer.createTransporter({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    tls: {
      rejectUnauthorized: false // For development/testing
    }
  });

  // Verify connection
  try {
    await transporter.verify();
    console.log('SMTP server connection verified');
  } catch (error) {
    console.error('SMTP verification failed:', error);
    throw new Error('Failed to connect to email server');
  }

  // Send email
  const mailOptions = {
    from: from || config.auth.user,
    to: to.join(','),
    subject,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}

export async function sendDailyDigestSMTP(
  config: SMTPConfig,
  to: string[],
  data: DigestData
): Promise<void> {
  const html = generateEmailHTML(data);
  const subject = `Morning Macro Brief — ${data.date}`;
  
  await sendEmailViaSMTP(config, to, subject, html);
}