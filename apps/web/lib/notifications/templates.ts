/**
 * Email render dispatch — one function per template name.
 *
 * Plain-text bodies for now (cheap to maintain, work everywhere). HTML
 * renders can be added later without touching call-sites.
 */
import "server-only";
import type { RenderedEmail, TemplateName, TemplatePayloads } from "./types";

const APP_NAME = "frint3d";
const APP_URL = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "";

function appLink(path: string): string {
  return APP_URL ? `${APP_URL}${path}` : path;
}

export function render<T extends TemplateName>(
  template: T,
  data: TemplatePayloads[T],
): RenderedEmail {
  switch (template) {
    case "ORDER_CONFIRMED": {
      const d = data as TemplatePayloads["ORDER_CONFIRMED"];
      const lines = d.items.map((i) => `  • ${i.quantity}× ${i.title}`).join("\n");
      return {
        subject: `${APP_NAME} · Siparişin alındı (₺${d.totalTRY.toFixed(2)})`,
        textBody: [
          "Merhaba,",
          "",
          `Siparişin için teşekkürler. Toplam ₺${d.totalTRY.toFixed(2)} ödemesini aldık ve baskı kuyruğuna ekledik.`,
          "",
          "İçerik:",
          lines,
          "",
          `Sipariş detayı: ${appLink(`/account/orders/${d.orderId}`)}`,
          "",
          `${APP_NAME} ekibi`,
        ].join("\n"),
      };
    }
    case "ORDER_SHIPPED": {
      const d = data as TemplatePayloads["ORDER_SHIPPED"];
      const cargoLine =
        d.cargoCarrier && d.cargoTrackingNo
          ? `${d.cargoCarrier} ile yola çıktı. Takip no: ${d.cargoTrackingNo}`
          : "Kargo şirketine teslim edildi.";
      return {
        subject: `${APP_NAME} · Siparişin kargoya verildi`,
        textBody: [
          "Merhaba,",
          "",
          cargoLine,
          "",
          `Sipariş detayı: ${appLink(`/account/orders/${d.orderId}`)}`,
          "",
          `${APP_NAME} ekibi`,
        ].join("\n"),
      };
    }
    case "CREDIT_PURCHASE_COMPLETED": {
      const d = data as TemplatePayloads["CREDIT_PURCHASE_COMPLETED"];
      return {
        subject: `${APP_NAME} · ${d.credits} kredi yüklendi`,
        textBody: [
          "Merhaba,",
          "",
          `${d.credits} kredi hesabına başarıyla yüklendi (₺${d.priceTRY.toFixed(2)} ödeme).`,
          "",
          `Bakiyeni gör: ${appLink("/account/credits")}`,
          "",
          `${APP_NAME} ekibi`,
        ].join("\n"),
      };
    }
    case "DESIGN_APPROVED": {
      const d = data as TemplatePayloads["DESIGN_APPROVED"];
      return {
        subject: `${APP_NAME} · "${d.designTitle}" tasarımın onaylandı`,
        textBody: [
          "Merhaba,",
          "",
          `Yüklediğin "${d.designTitle}" tasarımı onaylandı ve katalogda yayında.`,
          "",
          `Katalogda gör: ${appLink(`/designs/${d.designSlug}`)}`,
          "",
          `${APP_NAME} ekibi`,
        ].join("\n"),
      };
    }
    case "DESIGN_REJECTED": {
      const d = data as TemplatePayloads["DESIGN_REJECTED"];
      return {
        subject: `${APP_NAME} · "${d.designTitle}" tasarımın hakkında`,
        textBody: [
          "Merhaba,",
          "",
          `Yüklediğin "${d.designTitle}" tasarımı şu an için yayınlanamadı.`,
          "",
          `Sebep: ${d.rejectionReason}`,
          "",
          `Düzelttikten sonra "Yeniden Gönder" butonuyla tekrar inceleme sırasına alabilirsin: ${appLink("/account/my-designs")}`,
          "",
          `${APP_NAME} ekibi`,
        ].join("\n"),
      };
    }
    case "MESHY_REFUND_ISSUED": {
      const d = data as TemplatePayloads["MESHY_REFUND_ISSUED"];
      return {
        subject: `${APP_NAME} · AI üretim başarısız — ${d.creditsRefunded} kredi iade edildi`,
        textBody: [
          "Merhaba,",
          "",
          `AI üretim isteği (${d.jobId}) başarısız oldu. ${d.creditsRefunded} kredi otomatik olarak hesabına iade edildi.`,
          "",
          `Hata: ${d.error}`,
          "",
          `Tekrar deneyebilirsin: ${appLink("/ai")}`,
          "",
          `${APP_NAME} ekibi`,
        ].join("\n"),
      };
    }
    case "PASSWORD_RESET": {
      const d = data as TemplatePayloads["PASSWORD_RESET"];
      return {
        subject: `${APP_NAME} · Şifre sıfırlama bağlantısı`,
        textBody: [
          "Merhaba,",
          "",
          `${APP_NAME} hesabın için bir şifre sıfırlama isteği aldık. Bağlantı ${d.expiresInMinutes} dakika boyunca geçerli:`,
          "",
          d.resetUrl,
          "",
          "Bu isteği sen yapmadıysan, bu maili görmezden gelebilirsin — şifren değişmez.",
          "",
          `${APP_NAME} ekibi`,
        ].join("\n"),
      };
    }
  }
  // Exhaustiveness: TS will flag unhandled cases.
  const _exhaustive: never = template;
  throw new Error(`unhandled template: ${String(_exhaustive)}`);
}
