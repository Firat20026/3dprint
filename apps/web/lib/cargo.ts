/**
 * Turkish cargo carrier helpers — name normalization + tracking URL builder.
 *
 * Free-text carrier names entered by admin (e.g. "Aras", "ARAS KARGO",
 * "aras") all map to the same canonical key + URL pattern.
 */

type CarrierEntry = {
  key: string;
  display: string;
  trackUrl?: (no: string) => string;
};

const CARRIERS: CarrierEntry[] = [
  {
    key: "aras",
    display: "Aras Kargo",
    trackUrl: (no) =>
      `https://kargotakip.araskargo.com.tr/mainpage.aspx?code=${encodeURIComponent(no)}`,
  },
  {
    key: "mng",
    display: "MNG Kargo",
    trackUrl: (no) =>
      `https://kargotakip.mngkargo.com.tr/?takipNo=${encodeURIComponent(no)}`,
  },
  {
    key: "yurtici",
    display: "Yurtiçi Kargo",
    trackUrl: (no) =>
      `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${encodeURIComponent(no)}`,
  },
  {
    key: "ptt",
    display: "PTT Kargo",
    trackUrl: (no) =>
      `https://gonderitakip.ptt.gov.tr/Track/summary?q=${encodeURIComponent(no)}`,
  },
  {
    key: "ups",
    display: "UPS",
    trackUrl: (no) =>
      `https://www.ups.com/track?tracknum=${encodeURIComponent(no)}`,
  },
  {
    key: "dhl",
    display: "DHL",
    trackUrl: (no) =>
      `https://www.dhl.com/tr-tr/home/tracking/tracking-express.html?submit=1&tracking-id=${encodeURIComponent(no)}`,
  },
  {
    key: "surat",
    display: "Sürat Kargo",
    trackUrl: (no) =>
      `https://suratkargo.com.tr/KargoTakip/?kargotakipno=${encodeURIComponent(no)}`,
  },
];

/**
 * Find the carrier entry that matches a free-text name. Returns null if no
 * known carrier matches — UI then falls back to displaying the raw text
 * without a tracking link.
 */
export function resolveCarrier(name: string | null | undefined): CarrierEntry | null {
  if (!name) return null;
  const norm = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace("kargo", "")
    .trim();
  if (!norm) return null;
  return CARRIERS.find((c) => norm.includes(c.key)) ?? null;
}

/**
 * Build a tracking URL for a (carrier, trackingNo) pair. Returns null when
 * either input is missing or the carrier is unknown.
 */
export function trackingUrlFor(
  carrier: string | null | undefined,
  trackingNo: string | null | undefined,
): { display: string; url: string | null } {
  const c = resolveCarrier(carrier);
  if (!trackingNo) {
    return { display: c?.display ?? carrier ?? "—", url: null };
  }
  if (!c) {
    return { display: carrier ?? "—", url: null };
  }
  return { display: c.display, url: c.trackUrl ? c.trackUrl(trackingNo) : null };
}

export const KNOWN_CARRIERS = CARRIERS.map((c) => ({
  key: c.key,
  display: c.display,
}));
