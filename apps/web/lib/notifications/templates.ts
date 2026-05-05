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
    case "TEST_EMAIL": {
      const d = data as TemplatePayloads["TEST_EMAIL"];
      return {
        subject: `${APP_NAME} · E-posta test mesajı`,
        textBody: [
          "Bu bir test e-postasıdır.",
          "",
          `Gönderim zamanı: ${d.sentAt}`,
          `Resend entegrasyonu başarıyla çalışıyor.`,
          "",
          `${APP_NAME} ekibi`,
        ].join("\n"),
      };
    }
    case "MESHY_JOB_DONE": {
      const d = data as TemplatePayloads["MESHY_JOB_DONE"];
      const modeLabel = d.mode === "TEXT" ? "metin" : "görsel";
      const promptLine = d.prompt ? `"${d.prompt.slice(0, 120)}"` : "";
      return {
        subject: `${APP_NAME} · AI modeliniz hazır`,
        textBody: [
          "Merhaba,",
          "",
          `${modeLabel} tabanlı 3D modeliniz${promptLine ? ` (${promptLine})` : ""} başarıyla oluşturuldu.`,
          "",
          `Modeli görüntülemek ve indirmek için:`,
          appLink(`/account/ai/${d.jobId}`),
          "",
          `${APP_NAME} ekibi`,
        ].join("\n"),
      };
    }
    case "ORDER_PAYMENT_FAILED": {
      const d = data as TemplatePayloads["ORDER_PAYMENT_FAILED"];
      return {
        subject: `${APP_NAME} · Ödeme alınamadı`,
        textBody: [
          "Merhaba,",
          "",
          "Siparişin için ödeme işlemi tamamlanamadı.",
          "",
          `Sebep: ${d.reason}`,
          "",
          "Yeniden sipariş oluşturmak için kataloğu ziyaret edebilirsin:",
          appLink("/designs"),
          "",
          "Sorun devam ederse banka veya kart sağlayıcını arayabilirsin.",
          "",
          `${APP_NAME} ekibi`,
        ].join("\n"),
      };
    }
    case "CREDIT_PAYMENT_FAILED": {
      const d = data as TemplatePayloads["CREDIT_PAYMENT_FAILED"];
      return {
        subject: `${APP_NAME} · Kredi satın alma başarısız`,
        textBody: [
          "Merhaba,",
          "",
          `${d.credits} kredi (₺${d.priceTRY.toFixed(2)}) satın alma işlemi tamamlanamadı.`,
          "",
          "Yeniden denemek için:",
          appLink("/account/credits"),
          "",
          "Sorun devam ederse banka veya kart sağlayıcını arayabilirsin.",
          "",
          `${APP_NAME} ekibi`,
        ].join("\n"),
      };
    }
    case "ORDER_CANCELED": {
      const d = data as TemplatePayloads["ORDER_CANCELED"];
      return {
        subject: `${APP_NAME} · Siparişin iptal edildi`,
        textBody: [
          "Merhaba,",
          "",
          `Sipariş #${d.orderId.slice(-8).toUpperCase()} iptal edildi.`,
          "",
          "Herhangi bir ücret tahsil edilmedi.",
          "",
          `Yeni sipariş oluşturmak için: ${appLink("/designs")}`,
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
