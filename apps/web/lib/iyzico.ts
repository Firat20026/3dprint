/**
 * iyzico ödeme entegrasyonu. İki mod:
 *
 *   IYZICO_API_KEY varsa → gerçek sandbox call (paymentPageUrl döner)
 *   yoksa                → MOCK: /api/payments/iyzico/callback?mock=<orderId>'e
 *                          yönlendir, order hemen PAID olur. Geliştirme sırasında
 *                          sandbox credential beklemeden akışı test edebilmek için.
 *
 * Env:
 *   IYZICO_API_KEY
 *   IYZICO_SECRET_KEY
 *   IYZICO_BASE_URL       (default: https://sandbox-api.iyzipay.com)
 *   NEXTAUTH_URL          (callback absolute URL'i için)
 */
import "server-only";

type IyzipayCtor = new (opts: {
  apiKey: string;
  secretKey: string;
  uri: string;
}) => IyzipayClient;

type IyzipayClient = {
  checkoutFormInitialize: {
    create: (req: unknown, cb: (err: unknown, result: IyzicoInitResult) => void) => void;
  };
  checkoutForm: {
    retrieve: (req: unknown, cb: (err: unknown, result: IyzicoRetrieveResult) => void) => void;
  };
};

type IyzicoInitResult = {
  status: "success" | "failure";
  paymentPageUrl?: string;
  token?: string;
  conversationId?: string;
  errorMessage?: string;
  errorCode?: string;
};

type IyzicoRetrieveResult = {
  status: "success" | "failure";
  paymentStatus?: string;
  paymentId?: string;
  conversationId?: string;
  token?: string;
  errorMessage?: string;
};

const API_KEY = process.env.IYZICO_API_KEY ?? "";
const SECRET_KEY = process.env.IYZICO_SECRET_KEY ?? "";
const BASE_URL = process.env.IYZICO_BASE_URL ?? "https://sandbox-api.iyzipay.com";

export function isMockMode(): boolean {
  return !API_KEY || !SECRET_KEY;
}

let client: IyzipayClient | null = null;
async function getClient(): Promise<IyzipayClient> {
  if (client) return client;
  const mod = (await import("iyzipay")) as unknown as { default: IyzipayCtor };
  const Iyzipay = mod.default;
  client = new Iyzipay({ apiKey: API_KEY, secretKey: SECRET_KEY, uri: BASE_URL });
  return client;
}

export type InitializeInput = {
  orderId: string;
  conversationId: string;
  priceTRY: number;
  paidPriceTRY: number;
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    gsmNumber: string; // +90 formatında
    identityNumber: string; // TCKN (sandbox için 11111111111 geçerli)
    registrationAddress: string;
    city: string;
    country: string;
    ip: string;
  };
  shippingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode?: string;
  };
  basketItems: Array<{
    id: string;
    name: string;
    category1: string;
    itemType: "PHYSICAL" | "VIRTUAL";
    price: number;
  }>;
  callbackUrl: string;
};

export type InitializeResult =
  | { ok: true; paymentPageUrl: string; token: string }
  | { ok: false; error: string };

/**
 * CheckoutForm initialize → hosted paymentPageUrl veya mock mode'da doğrudan callback URL.
 */
export async function initializePayment(
  input: InitializeInput,
): Promise<InitializeResult> {
  if (isMockMode()) {
    const mockToken = `mock-${input.orderId}`;
    const url = `${input.callbackUrl}?mockToken=${encodeURIComponent(mockToken)}`;
    return { ok: true, paymentPageUrl: url, token: mockToken };
  }

  const iyz = await getClient();
  return new Promise<InitializeResult>((resolve) => {
    iyz.checkoutFormInitialize.create(
      {
        locale: "tr",
        conversationId: input.conversationId,
        price: input.priceTRY.toFixed(2),
        paidPrice: input.paidPriceTRY.toFixed(2),
        currency: "TRY",
        basketId: input.orderId,
        paymentGroup: "PRODUCT",
        callbackUrl: input.callbackUrl,
        enabledInstallments: [1, 2, 3, 6, 9],
        buyer: {
          id: input.buyer.id,
          name: input.buyer.name,
          surname: input.buyer.surname,
          email: input.buyer.email,
          gsmNumber: input.buyer.gsmNumber,
          identityNumber: input.buyer.identityNumber,
          registrationAddress: input.buyer.registrationAddress,
          city: input.buyer.city,
          country: input.buyer.country,
          ip: input.buyer.ip,
        },
        shippingAddress: {
          contactName: input.shippingAddress.contactName,
          city: input.shippingAddress.city,
          country: input.shippingAddress.country,
          address: input.shippingAddress.address,
          zipCode: input.shippingAddress.zipCode,
        },
        billingAddress: {
          contactName: input.shippingAddress.contactName,
          city: input.shippingAddress.city,
          country: input.shippingAddress.country,
          address: input.shippingAddress.address,
          zipCode: input.shippingAddress.zipCode,
        },
        basketItems: input.basketItems.map((b) => ({
          id: b.id,
          name: b.name,
          category1: b.category1,
          itemType: b.itemType,
          price: b.price.toFixed(2),
        })),
      },
      (err, result) => {
        if (err || !result) {
          resolve({ ok: false, error: err instanceof Error ? err.message : "iyzico init failed" });
          return;
        }
        if (result.status !== "success" || !result.paymentPageUrl || !result.token) {
          resolve({ ok: false, error: result.errorMessage ?? "iyzico init non-success" });
          return;
        }
        resolve({ ok: true, paymentPageUrl: result.paymentPageUrl, token: result.token });
      },
    );
  });
}

export type RetrieveResult =
  | { ok: true; paid: boolean; paymentId: string | null; conversationId: string | null }
  | { ok: false; error: string };

/** Callback sonrası ödeme durumunu doğrula. */
export async function retrievePayment(token: string): Promise<RetrieveResult> {
  if (isMockMode() || token.startsWith("mock-")) {
    return { ok: true, paid: true, paymentId: token, conversationId: null };
  }
  const iyz = await getClient();
  return new Promise<RetrieveResult>((resolve) => {
    iyz.checkoutForm.retrieve({ locale: "tr", token }, (err, result) => {
      if (err || !result) {
        resolve({ ok: false, error: err instanceof Error ? err.message : "retrieve failed" });
        return;
      }
      const paid =
        result.status === "success" && result.paymentStatus === "SUCCESS";
      resolve({
        ok: true,
        paid,
        paymentId: result.paymentId ?? null,
        conversationId: result.conversationId ?? null,
      });
    });
  });
}
