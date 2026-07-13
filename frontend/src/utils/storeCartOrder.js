import {
  normalizeWhatsAppUrl,
  openWhatsAppLink,
} from "./openWhatsAppLink";
import { cartOrderLogAPI } from "../services/api";
import {
  getOwnerAnalyticsSessionId,
  trackOwnerOrderRequest,
} from "./ownerAnalyticsTrack";

export function getStoreWhatsAppUrl(store) {
  const raw = store?.contactInfo?.whatsapp || "";
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (/^(https?:\/\/)?(wa\.me|api\.whatsapp\.com)\//i.test(trimmed)) {
    const withProto = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    return normalizeWhatsAppUrl(withProto);
  }
  const digits = trimmed.replace(/[^\d]/g, "");
  return digits ? `https://api.whatsapp.com/send?phone=${digits}` : null;
}

export function buildWhatsAppOrderPayload({ store, cartItems, locName }) {
  const orderId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const storeName = locName(store) || "";
  const lines = [];
  lines.push(`Order To: ${storeName}`.trim());
  lines.push("");
  const sortedItems = Object.values(cartItems || {})
    .filter((i) => (Number(i?.qty) || 0) > 0 && i?.product?._id)
    .sort((a, b) =>
      String(locName(a.product) || "").localeCompare(
        String(locName(b.product) || ""),
      ),
    );
  const items = sortedItems.map((item) => ({
    productId: String(item.product._id),
    qty: Number(item.qty) || 0,
    productName: locName(item.product) || "",
  }));
  sortedItems.forEach((item, idx) => {
    const name = locName(item.product) || "";
    const qty = Number(item.qty) || 0;
    lines.push(`${idx + 1}) ${name} x${qty}`);
  });
  lines.push("");
  const orderNow = new Date();
  const dd = String(orderNow.getDate()).padStart(2, "0");
  const mm = String(orderNow.getMonth() + 1).padStart(2, "0");
  const yyyy = orderNow.getFullYear();
  lines.push(
    `Order Date: ${dd}/${mm}/${yyyy} ${orderNow.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })}`.trim(),
  );
  lines.push(`Order ID: ${orderId}`.trim());
  lines.push(`Ordered Via: iDashkan App`);
  lines.push("Thank you.");
  const messageText = lines.join("\n");
  return {
    orderId,
    messageText,
    items,
    storeName,
    storeNamePrimary: store?.name || "",
    storeNameEn: store?.nameEn || "",
    storeNameAr: store?.nameAr || "",
    storeNameKu: store?.nameKu || "",
  };
}

export async function submitStoreCartWhatsAppOrder({
  store,
  storeId,
  cartItems,
  locName,
  onClipboardFallback,
}) {
  const wa = getStoreWhatsAppUrl(store);
  if (!wa) return { ok: false, reason: "no_whatsapp" };

  const payload = buildWhatsAppOrderPayload({ store, cartItems, locName });
  const text = encodeURIComponent(payload.messageText);
  const url = wa.includes("?") ? `${wa}&text=${text}` : `${wa}?text=${text}`;
  const id = store?._id || storeId;

  cartOrderLogAPI
    .log({
      storeId: id,
      storeName: payload.storeName,
      storeNamePrimary: payload.storeNamePrimary,
      storeNameEn: payload.storeNameEn,
      storeNameAr: payload.storeNameAr,
      storeNameKu: payload.storeNameKu,
      orderId: payload.orderId,
      items: payload.items,
      messageText: payload.messageText,
      sessionId: getOwnerAnalyticsSessionId(),
    })
    .catch(() => {});

  trackOwnerOrderRequest("store", id, "whatsapp");
  openWhatsAppLink(url, { onClipboardFallback });
  return { ok: true };
}
