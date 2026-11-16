export interface OtpPolicy {
  expires_in: number;
  resend_after: number;
  demo_code?: string;
}
