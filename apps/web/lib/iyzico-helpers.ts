/**
 * Reusable iyzico buyer/payload helpers.
 *
 * Both the order checkout and the credit purchase flows go through iyzico's
 * Checkout Form, which requires a normalized buyer object (gsmNumber prefixed
 * with +90, identityNumber as TCKN, etc.). This module centralizes that
 * normalization so the rules don't drift between routes.
 */
import "server-only";

const SANDBOX_TCKN = "11111111111";
const SANDBOX_PHONE = "+905555555555";
const FALLBACK_CITY = "İstanbul";
const FALLBACK_ADDRESS = "-";
const FALLBACK_IP = "85.34.78.112";

/**
 * Normalize a Turkish mobile number to iyzico's required +90 format.
 * Accepts inputs like "0555 123 4567", "5551234567", "+90 555 123 4567".
 */
export function sanitizeGsm(phone: string | null | undefined): string {
  if (!phone) return SANDBOX_PHONE;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return SANDBOX_PHONE;
  if (digits.startsWith("90")) return `+${digits}`;
  if (digits.startsWith("0")) return `+9${digits}`;
  if (digits.startsWith("5") && digits.length === 10) return `+90${digits}`;
  return `+${digits}`;
}

/**
 * Best-effort split of a free-text full name into name/surname.
 * Last whitespace-separated token becomes surname; the rest is the name.
 * Single-word inputs return ("name", "-").
 */
export function splitFullName(fullName: string | null | undefined): {
  name: string;
  surname: string;
} {
  const raw = (fullName ?? "").trim();
  if (!raw) return { name: "Müşteri", surname: "-" };
  const parts = raw.split(/\s+/);
  if (parts.length === 1) return { name: parts[0], surname: "-" };
  const surname = parts.pop() ?? "-";
  return { name: parts.join(" ") || "Müşteri", surname };
}

/**
 * Sanitize a TCKN (Turkish national ID). Returns sandbox dummy if missing.
 * Note: we don't validate the checksum here — iyzico does that in production.
 */
export function sanitizeIdentityNumber(
  tckn: string | null | undefined,
): string {
  if (!tckn) return SANDBOX_TCKN;
  const digits = tckn.replace(/\D/g, "");
  if (digits.length !== 11) return SANDBOX_TCKN;
  return digits;
}

/**
 * Extract client IP from a request (X-Forwarded-For chain), with sane fallback.
 */
export function extractClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    FALLBACK_IP
  );
}

export type BuyerInputUser = {
  id: string;
  name: string | null;
  email: string;
  phone?: string | null;
  identityNumber?: string | null;
  city?: string | null;
  registrationAddress?: string | null;
};

/**
 * Build an iyzico-shaped buyer object from a user record + optional shipping
 * override (e.g. fullName/phone collected at checkout for physical orders).
 *
 * Empty/missing user profile fields fall back to safe sandbox values; in
 * production iyzico will reject most of these so production deployments must
 * collect real values from the user.
 */
export function buildBuyer(opts: {
  user: BuyerInputUser;
  ip: string;
  override?: {
    fullName?: string;
    phone?: string;
    identityNumber?: string;
    address?: string;
    city?: string;
  };
}) {
  const u = opts.user;
  const o = opts.override ?? {};

  const { name, surname } = splitFullName(o.fullName ?? u.name ?? u.email);
  const gsmNumber = sanitizeGsm(o.phone ?? u.phone ?? null);
  const identityNumber = sanitizeIdentityNumber(
    o.identityNumber ?? u.identityNumber ?? null,
  );
  const city = o.city ?? u.city ?? FALLBACK_CITY;
  const registrationAddress =
    o.address ?? u.registrationAddress ?? FALLBACK_ADDRESS;

  return {
    id: u.id,
    name,
    surname,
    email: u.email,
    gsmNumber,
    identityNumber,
    registrationAddress,
    city,
    country: "Türkiye" as const,
    ip: opts.ip,
  };
}

/**
 * Returns true if the user has filled the iyzico-required profile fields
 * (phone + TCKN). Useful to gate UI prompts or show "complete your profile"
 * banners before payment.
 */
export function isUserProfileCompleteForIyzico(u: {
  phone?: string | null;
  identityNumber?: string | null;
}): boolean {
  return Boolean(
    u.phone && u.phone.replace(/\D/g, "").length >= 10 &&
      u.identityNumber && u.identityNumber.replace(/\D/g, "").length === 11,
  );
}
