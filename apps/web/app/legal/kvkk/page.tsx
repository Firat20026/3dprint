import { Container } from "@/components/ui/container";

export const metadata = {
  title: "KVKK Aydınlatma Metni — frint3d",
  description:
    "frint3d olarak kişisel verilerinizi nasıl topladığımız, işlediğimiz ve sakladığımız hakkında bilgilendirme.",
};

export default function KvkkPage() {
  return (
    <Container className="prose prose-invert max-w-3xl py-16 text-[var(--color-text)]">
      <p className="eyebrow">Yasal</p>
      <h1 className="mt-3 h-display text-4xl">KVKK Aydınlatma Metni</h1>
      <p className="mt-3 text-sm text-[var(--color-text-muted)]">
        Son güncelleme: {new Date().toLocaleDateString("tr-TR")}
      </p>

      <div className="mt-10 space-y-6 text-sm leading-relaxed text-[var(--color-text-muted)]">
        <section>
          <h2 className="font-display text-lg uppercase tracking-tight text-[var(--color-text)]">
            1. Veri Sorumlusu
          </h2>
          <p className="mt-2">
            frint3d (&quot;Platform&quot;), 6698 sayılı Kişisel Verilerin
            Korunması Kanunu (&quot;KVKK&quot;) kapsamında veri sorumlusu
            sıfatıyla hareket eder. Kişisel verileriniz aşağıda açıklanan amaç
            ve yöntemlerle işlenir.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg uppercase tracking-tight text-[var(--color-text)]">
            2. İşlenen Kişisel Veriler
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Kimlik bilgileri (ad, soyad, T.C. kimlik no — ödeme için)</li>
            <li>İletişim bilgileri (e-posta, telefon)</li>
            <li>Adres bilgileri (sevkiyat ve fatura için)</li>
            <li>İşlem geçmişi (siparişler, ödeme bilgileri, kredi hareketleri)</li>
            <li>
              Yüklediğiniz 3D model dosyaları ve bunlara ait teknik metadata
            </li>
            <li>Site kullanım verileri (oturum, IP, kullanıcı ajanı)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg uppercase tracking-tight text-[var(--color-text)]">
            3. İşleme Amaçları
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Üyelik ve oturum yönetimi</li>
            <li>Sipariş alma, baskı yapma ve sevkiyat</li>
            <li>Ödeme işlemlerinin iyzico üzerinden gerçekleştirilmesi</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi (fatura, vergi)</li>
            <li>Hizmet kalitesinin iyileştirilmesi ve hata tespiti</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg uppercase tracking-tight text-[var(--color-text)]">
            4. Aktarılan Taraflar
          </h2>
          <p className="mt-2">
            Verileriniz; ödeme hizmeti sağlayıcımız iyzico, kargo şirketleri ve
            yasal merciler ile sınırlı amaçla paylaşılabilir. Yurt dışına veri
            aktarımı yapılmaz.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg uppercase tracking-tight text-[var(--color-text)]">
            5. Haklarınız
          </h2>
          <p className="mt-2">
            KVKK 11. madde kapsamında verilerinize erişme, düzeltme, silme ve
            işlenmesine itiraz etme haklarına sahipsiniz. Talepleriniz için{" "}
            <a href="/contact" className="text-[var(--color-brand-2)] hover:underline">
              iletişim sayfası
            </a>{" "}
            üzerinden bize ulaşabilirsiniz.
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
