import { Container } from "@/components/ui/container";

export const metadata = {
  title: "Kullanım Koşulları — frint3d",
  description:
    "frint3d platformunu kullanırken geçerli olan koşullar, hak ve yükümlülükler.",
};

export default function TermsPage() {
  return (
    <Container className="prose prose-invert max-w-3xl py-16 text-[var(--color-text)]">
      <p className="eyebrow">Yasal</p>
      <h1 className="mt-3 h-display text-4xl">Kullanım Koşulları</h1>
      <p className="mt-3 text-sm text-[var(--color-text-muted)]">
        Son güncelleme: {new Date().toLocaleDateString("tr-TR")}
      </p>

      <div className="mt-10 space-y-6 text-sm leading-relaxed text-[var(--color-text-muted)]">
        <section>
          <h2 className="font-display text-lg uppercase tracking-tight text-[var(--color-text)]">
            1. Hizmet Tanımı
          </h2>
          <p className="mt-2">
            frint3d (&quot;Platform&quot;), kullanıcıların 3D model dosyası
            yüklemesi, hazır tasarımlardan seçim yapması veya AI ile model
            üretmesi yoluyla 3D baskı siparişi vermesini sağlayan bir
            servistir. Baskı, Snapmaker U1 ekipmanları üzerinde OrcaSlicer ile
            gerçekleştirilir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg uppercase tracking-tight text-[var(--color-text)]">
            2. Üyelik
          </h2>
          <p className="mt-2">
            Sipariş ve hesap özelliklerini kullanmak için kayıt olmanız
            gerekir. Hesap bilgilerinizin doğruluğu ve güvenliği size aittir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg uppercase tracking-tight text-[var(--color-text)]">
            3. Yüklenen İçerik
          </h2>
          <p className="mt-2">
            Yüklediğiniz dosyalar üzerinde fikri mülkiyet hakkına sahip
            olduğunuzu veya gerekli kullanım izinlerine sahip olduğunuzu beyan
            edersiniz. Hak ihlali içeren, yasalara aykırı veya tehlikeli
            (silah, patlayıcı vb.) içerikler reddedilir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg uppercase tracking-tight text-[var(--color-text)]">
            4. Ödeme ve İade
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Ödemeler iyzico altyapısı üzerinden tahsil edilir.</li>
            <li>
              Baskıya başlanmamış siparişler iptal edilebilir; ödeme tutarı
              aynı yönteme iade edilir.
            </li>
            <li>
              Baskıya başlanan siparişlerin iadesi, üretim niteliğinden ötürü
              kabul edilmez (kişiselleştirilmiş ürün istisnası).
            </li>
            <li>
              Kredi paketleri kullanıma açıldıktan sonra iade edilmez; AI
              üretimi başarısız olursa harcanan kredi otomatik geri yüklenir.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg uppercase tracking-tight text-[var(--color-text)]">
            5. Sorumluluk Sınırı
          </h2>
          <p className="mt-2">
            Platform, dolaylı, arızi veya cezai zararlardan sorumlu tutulamaz.
            Toplam sorumluluk, ilgili siparişin ödenmiş tutarı ile sınırlıdır.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg uppercase tracking-tight text-[var(--color-text)]">
            6. Değişiklikler
          </h2>
          <p className="mt-2">
            Bu koşullar zaman içinde güncellenebilir. Önemli değişiklikler
            kullanıcılara e-posta veya site üzerinden bildirilir.
          </p>
        </section>

        <p className="text-xs italic text-[var(--color-text-subtle)]">
          Bu metin bilgilendirme amaçlıdır; nihai versiyonu hukuk müşaviriniz
          tarafından gözden geçirilmeden yayınlamayın.
        </p>
      </div>
    </Container>
  );
}
