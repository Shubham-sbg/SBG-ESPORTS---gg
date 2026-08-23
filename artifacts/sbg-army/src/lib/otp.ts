import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

const OTP_SESSION_KEY = 'sbg_otp_data';
const OTP_EXPIRY_MS = 5 * 60 * 1000;

interface OtpData {
  code: string;
  email: string;
  expiresAt: number;
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTP(email: string): Promise<{ success: boolean; devOtp?: string; message: string }> {
  const code = generateCode();
  const data: OtpData = {
    code,
    email: email.toLowerCase().trim(),
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  };

  sessionStorage.setItem(OTP_SESSION_KEY, JSON.stringify(data));

  const isEmailJsConfigured =
    EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID' &&
    EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID' &&
    EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY';

  if (isEmailJsConfigured) {
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: email,
          otp_code: code,
          organization: 'SBG ARMY Admin',
          expiry_minutes: '5',
        },
        EMAILJS_PUBLIC_KEY
      );
      return { success: true, message: `OTP sent to ${email}. Check your inbox.` };
    } catch (err) {
      console.error('EmailJS error:', err);
      return { success: false, message: 'Failed to send OTP email. Check EmailJS configuration.' };
    }
  } else {
    return {
      success: true,
      devOtp: code,
      message: 'EmailJS not configured. OTP shown below (configure EmailJS for production).',
    };
  }
}

export function verifyOTP(email: string, inputCode: string): { valid: boolean; reason?: string } {
  const raw = sessionStorage.getItem(OTP_SESSION_KEY);
  if (!raw) return { valid: false, reason: 'No OTP found. Request a new one.' };

  const data: OtpData = JSON.parse(raw);

  if (data.email !== email.toLowerCase().trim()) {
    return { valid: false, reason: 'OTP email mismatch.' };
  }

  if (Date.now() > data.expiresAt) {
    sessionStorage.removeItem(OTP_SESSION_KEY);
    return { valid: false, reason: 'OTP has expired. Request a new one.' };
  }

  if (data.code !== inputCode.trim()) {
    return { valid: false, reason: 'Invalid OTP code.' };
  }

  sessionStorage.removeItem(OTP_SESSION_KEY);
  return { valid: true };
}

export function clearOTP(): void {
  sessionStorage.removeItem(OTP_SESSION_KEY);
}
