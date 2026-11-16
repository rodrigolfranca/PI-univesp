import { ApiError, apiRequest } from "./api";
import type { OtpPolicy } from "./otp";
import { normalizePhone, userPayload } from "./users";
import type { UserFields } from "./users";

export interface SignupPolicy extends OtpPolicy {
  signup_id: string;
}

export interface RecoveryPolicy extends OtpPolicy {
  recovery_id: string;
}

export function readAccessToken(token: string): { id: number; exp: number } {
  try {
    const encoded = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(encoded));
    if (
      payload.keyType !== "access" ||
      !Number.isSafeInteger(payload.id) ||
      payload.id < 1 ||
      !Number.isFinite(payload.exp) ||
      payload.exp * 1000 <= Date.now()
    )
      throw new Error();
    return { id: payload.id, exp: payload.exp };
  } catch {
    throw new ApiError("Sua sessão expirou. Entre novamente.", 401);
  }
}

export async function logoutSession(token: string): Promise<void> {
  await apiRequest("/auth/logout", { method: "POST", token });
}

export async function requestLoginCode(phone: string): Promise<OtpPolicy> {
  return apiRequest<OtpPolicy>("/auth/request-code", {
    method: "POST",
    body: { phone_number: normalizePhone(phone) },
  });
}

export async function verifyLoginCode(phone: string, code: string): Promise<string> {
  const result = await apiRequest<{ access_token: string }>("/auth/verify-code", {
    method: "POST",
    body: { phone_number: normalizePhone(phone), verification_code: code },
  });
  return result.access_token;
}

export async function requestSignupCode(fields: UserFields): Promise<SignupPolicy> {
  return apiRequest<SignupPolicy>("/auth/signup/request-code", {
    method: "POST",
    body: userPayload(fields),
  });
}

export async function resendSignupCode(signupId: string): Promise<SignupPolicy> {
  return apiRequest<SignupPolicy>("/auth/signup/resend-code", {
    method: "POST",
    body: { signup_id: signupId },
  });
}

export async function verifySignupEmailCode(
  signupId: string,
  emailCode: string,
): Promise<SignupPolicy> {
  return apiRequest<SignupPolicy>("/auth/signup/verify-email-code", {
    method: "POST",
    body: { signup_id: signupId, email_code: emailCode },
  });
}

export async function resendSignupPhoneCode(signupId: string): Promise<SignupPolicy> {
  return apiRequest<SignupPolicy>("/auth/signup/resend-phone-code", {
    method: "POST",
    body: { signup_id: signupId },
  });
}

export async function verifySignupPhoneCode(signupId: string, phoneCode: string): Promise<void> {
  await apiRequest("/auth/signup/verify-phone-code", {
    method: "POST",
    body: { signup_id: signupId, phone_code: phoneCode },
  });
}

export async function requestRecoveryEmailCode(email: string): Promise<RecoveryPolicy> {
  return apiRequest<RecoveryPolicy>("/auth/recovery/request-email-code", {
    method: "POST",
    body: { email },
  });
}

export async function verifyRecoveryEmailCode(
  recoveryId: string,
  emailCode: string,
): Promise<void> {
  await apiRequest("/auth/recovery/verify-email-code", {
    method: "POST",
    body: { recovery_id: recoveryId, email_code: emailCode },
  });
}

export async function requestRecoveryPhoneCode(
  recoveryId: string,
  phone: string,
): Promise<OtpPolicy> {
  return apiRequest<OtpPolicy>("/auth/recovery/request-phone-code", {
    method: "POST",
    body: { recovery_id: recoveryId, phone_number: normalizePhone(phone) },
  });
}

export async function verifyRecoveryPhoneCode(
  recoveryId: string,
  phone: string,
  phoneCode: string,
): Promise<void> {
  await apiRequest("/auth/recovery/verify-phone-code", {
    method: "POST",
    body: {
      recovery_id: recoveryId,
      phone_number: normalizePhone(phone),
      phone_code: phoneCode,
    },
  });
}
