"use client";

const WA_NUMBER = "905555555555";
const WA_MESSAGE = encodeURIComponent("Merhaba! frint3d hakkında bilgi almak istiyorum.");
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

export function WhatsAppFloat() {
  return (
    <a
      href={WA_URL}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="WhatsApp ile iletişime geç"
      className="group fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] shadow-[0_8px_24px_-4px_rgb(0_0_0/0.4)] transition-all duration-200 hover:scale-110 md:bottom-6 md:right-6"
    >
      <svg viewBox="0 0 32 32" className="size-6 fill-white md:size-7" aria-hidden="true">
        <path d="M16.003 2.667C8.636 2.667 2.667 8.636 2.667 16c0 2.352.63 4.556 1.73 6.453L2.667 29.333l7.09-1.694A13.3 13.3 0 0 0 16.003 29.333c7.365 0 13.33-5.967 13.33-13.333S23.368 2.667 16.003 2.667zm0 24c-2.053 0-3.97-.55-5.617-1.506l-.402-.24-4.212 1.006 1.037-4.09-.262-.42A10.625 10.625 0 0 1 5.334 16c0-5.882 4.787-10.667 10.669-10.667S26.67 10.118 26.67 16 21.885 26.667 16.003 26.667zm5.845-7.99c-.32-.16-1.892-.933-2.185-1.04-.294-.107-.507-.16-.72.16-.214.32-.826 1.04-.013 1.307.186.08 1.252.6 2.131 1.026.88.427 1.492.32 1.732-.213.24-.534.24-1.04.16-1.12-.08-.08-.293-.16-.614-.32l-.49-.24zm-5.525 5.377h-.027c-1.107-.054-2.186-.37-3.15-.91l-.454-.267-2.65.636.655-2.59-.295-.476a8.32 8.32 0 0 1-1.112-4.127c0-4.618 3.757-8.374 8.377-8.374 2.24 0 4.343.873 5.924 2.453a8.32 8.32 0 0 1 2.45 5.92c-.002 4.62-3.759 8.377-8.375 8.377l-.343-.642z" />
      </svg>
      <span className="pointer-events-none absolute right-16 hidden whitespace-nowrap rounded-lg border border-border bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 md:block">
        WhatsApp&apos;tan yaz
      </span>
    </a>
  );
}
