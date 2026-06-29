/**
 * Embeds the Shopier storefront (or a product page) in an iframe.
 *
 * Why an iframe: Shopier's product/REST APIs deny reads from our server IP
 * (Cloudflare WAF / 403) and the pages can't be scraped server-side. But the
 * iframe is loaded by the *visitor's* browser — a normal residential request
 * Shopier serves fine — so the real store (images, prices, cart, checkout)
 * renders with zero data entry and stays perfectly in sync.
 *
 * Shopier sends no X-Frame-Options / CSP frame-ancestors, so framing is
 * allowed. Cross-origin means we can't auto-size to content, so we give it a
 * tall viewport-based height with its own internal scroll.
 */
export function StoreEmbed({
  src,
  title = "Mağaza",
  className = "h-[calc(100vh-4rem)]",
}: {
  src: string;
  title?: string;
  className?: string;
}) {
  return (
    <iframe
      src={src}
      title={title}
      loading="lazy"
      allow="payment; clipboard-write"
      referrerPolicy="no-referrer-when-downgrade"
      className={`w-full border-0 bg-white ${className}`}
    />
  );
}
