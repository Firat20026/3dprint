/**
 * Layout for internal-only pages (worker-driven thumbnail rendering, etc).
 *
 * Bypasses the public root layout entirely — no Nav, no Footer, no fonts —
 * because:
 *   - The headless browser renders these for screenshot only; chrome is
 *     useless and slows render setup.
 *   - The root Nav prefetches half a dozen RSC routes, polluting the
 *     network log and making timing flaky.
 *
 * URL is unchanged: route groups in parens don't affect routing.
 */
export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#0d0d10",
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {children}
      </body>
    </html>
  );
}
