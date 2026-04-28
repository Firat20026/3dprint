/**
 * Lightweight tests for iyzico buyer normalization helpers.
 *
 * Run with:
 *   pnpm exec tsx lib/iyzico-helpers.test.ts
 *
 * These are pure functions over strings — fast, deterministic, and the
 * place where small bugs (e.g. a missing +90 prefix) would cause real
 * iyzico rejections in production.
 */
import {
  sanitizeGsm,
  sanitizeIdentityNumber,
  splitFullName,
  isUserProfileCompleteForIyzico,
  buildBuyer,
} from "./iyzico-helpers";

function assertEq<T>(label: string, got: T, want: T) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "✓" : "✗"} ${label}  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`);
  if (!ok) process.exitCode = 1;
}

// ── sanitizeGsm ──────────────────────────────────────────────────────────────
assertEq("gsm 0555...", sanitizeGsm("0555 123 45 67"), "+905551234567");
assertEq("gsm 5551234567", sanitizeGsm("5551234567"), "+905551234567");
assertEq("gsm +905551234567", sanitizeGsm("+905551234567"), "+905551234567");
assertEq("gsm 905551234567", sanitizeGsm("905551234567"), "+905551234567");
assertEq("gsm with dashes", sanitizeGsm("0-555-123-45-67"), "+905551234567");
assertEq("gsm null → dummy", sanitizeGsm(null), "+905555555555");
assertEq("gsm empty → dummy", sanitizeGsm(""), "+905555555555");
assertEq("gsm whitespace → dummy", sanitizeGsm("   "), "+905555555555");

// ── sanitizeIdentityNumber ───────────────────────────────────────────────────
assertEq("tckn 11 digits", sanitizeIdentityNumber("12345678901"), "12345678901");
assertEq("tckn with formatting", sanitizeIdentityNumber("123 456 789 01"), "12345678901");
assertEq("tckn null → sandbox dummy", sanitizeIdentityNumber(null), "11111111111");
assertEq("tckn empty → sandbox dummy", sanitizeIdentityNumber(""), "11111111111");
assertEq("tckn 10 digits → dummy", sanitizeIdentityNumber("1234567890"), "11111111111");
assertEq("tckn 12 digits → dummy", sanitizeIdentityNumber("123456789012"), "11111111111");

// ── splitFullName ────────────────────────────────────────────────────────────
assertEq("split full", splitFullName("Fırat Hacıoğlu"), { name: "Fırat", surname: "Hacıoğlu" });
assertEq("split three", splitFullName("Ahmet Mehmet Yıldız"), { name: "Ahmet Mehmet", surname: "Yıldız" });
assertEq("split single → dash", splitFullName("Madonna"), { name: "Madonna", surname: "-" });
assertEq("split null → fallback", splitFullName(null), { name: "Müşteri", surname: "-" });
assertEq("split empty → fallback", splitFullName(""), { name: "Müşteri", surname: "-" });
assertEq("split extra spaces", splitFullName("  Fırat   Hacıoğlu  "), { name: "Fırat", surname: "Hacıoğlu" });

// ── isUserProfileCompleteForIyzico ───────────────────────────────────────────
assertEq("profile complete", isUserProfileCompleteForIyzico({
  phone: "+905551234567",
  identityNumber: "12345678901",
}), true);
assertEq("profile no phone", isUserProfileCompleteForIyzico({
  phone: null,
  identityNumber: "12345678901",
}), false);
assertEq("profile no tckn", isUserProfileCompleteForIyzico({
  phone: "+905551234567",
  identityNumber: null,
}), false);
assertEq("profile bad tckn", isUserProfileCompleteForIyzico({
  phone: "+905551234567",
  identityNumber: "123",
}), false);

// ── buildBuyer ───────────────────────────────────────────────────────────────
const fullProfile = buildBuyer({
  user: {
    id: "u1",
    name: "Fırat Hacıoğlu",
    email: "f@example.com",
    phone: "+905551234567",
    identityNumber: "12345678901",
    city: "Ankara",
    registrationAddress: "Çankaya, ABC Apt No 5",
  },
  ip: "1.2.3.4",
});
assertEq("buildBuyer name", fullProfile.name, "Fırat");
assertEq("buildBuyer surname", fullProfile.surname, "Hacıoğlu");
assertEq("buildBuyer gsm", fullProfile.gsmNumber, "+905551234567");
assertEq("buildBuyer tckn", fullProfile.identityNumber, "12345678901");
assertEq("buildBuyer city", fullProfile.city, "Ankara");
assertEq("buildBuyer ip", fullProfile.ip, "1.2.3.4");

// Override (e.g. shipping form fills different name/phone)
const overridden = buildBuyer({
  user: {
    id: "u1",
    name: "Default Name",
    email: "f@example.com",
    phone: null,
    identityNumber: null,
    city: null,
    registrationAddress: null,
  },
  ip: "1.2.3.4",
  override: {
    fullName: "Veli Yılmaz",
    phone: "0555 999 88 77",
    identityNumber: "98765432109",
    city: "İzmir",
    address: "Konak",
  },
});
assertEq("override name", overridden.name, "Veli");
assertEq("override surname", overridden.surname, "Yılmaz");
assertEq("override gsm", overridden.gsmNumber, "+905559998877");
assertEq("override tckn", overridden.identityNumber, "98765432109");
assertEq("override city", overridden.city, "İzmir");

// Sandbox fallback when nothing is set
const sandboxBuyer = buildBuyer({
  user: {
    id: "u2",
    name: null,
    email: "x@example.com",
    phone: null,
    identityNumber: null,
    city: null,
    registrationAddress: null,
  },
  ip: "85.34.78.112",
});
assertEq("sandbox gsm", sandboxBuyer.gsmNumber, "+905555555555");
assertEq("sandbox tckn", sandboxBuyer.identityNumber, "11111111111");
assertEq("sandbox city", sandboxBuyer.city, "İstanbul");
assertEq("sandbox address", sandboxBuyer.registrationAddress, "-");
