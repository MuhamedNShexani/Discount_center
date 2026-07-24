const fs = require("fs");
const path = require("path");
const { initializeApp, cert, getApps, getApp } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const FcmToken = require("../models/FcmToken");

const FCM_BATCH_SIZE = 500;

/** Firebase error codes that mean the token should be removed. */
const INVALID_TOKEN_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);

let firebaseApp = null;
let firebaseReady = false;
let initAttempted = false;

function resolveProjectId(serviceAccount) {
  return (
    serviceAccount?.project_id ||
    serviceAccount?.projectId ||
    process.env.FIREBASE_PROJECT_ID ||
    "(unknown)"
  );
}

function loadServiceAccount() {
  const jsonInline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonInline && jsonInline.trim()) {
    try {
      const parsed = JSON.parse(jsonInline);
      console.log("[Firebase] Firebase credentials loaded (FIREBASE_SERVICE_ACCOUNT_JSON)");
      console.log("[Firebase] Firebase project ID:", resolveProjectId(parsed));
      return parsed;
    } catch (e) {
      console.error(
        "[Firebase] FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON:",
        e.message,
      );
      return null;
    }
  }

  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (filePath && filePath.trim()) {
    try {
      const resolved = path.resolve(filePath.trim());
      const raw = fs.readFileSync(resolved, "utf8");
      const parsed = JSON.parse(raw);
      console.log("[Firebase] Firebase credentials loaded (FIREBASE_SERVICE_ACCOUNT_PATH)");
      console.log("[Firebase] Firebase project ID:", resolveProjectId(parsed));
      return parsed;
    } catch (e) {
      console.error("[Firebase] Failed to load FIREBASE_SERVICE_ACCOUNT_PATH:", e.message);
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
    console.log("[Firebase] Firebase credentials loaded (env fields)");
    console.log("[Firebase] Firebase project ID:", projectId);
    return {
      projectId,
      clientEmail,
      privateKey,
    };
  }

  return null;
}

function getExistingFirebaseApp() {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }
  return null;
}

function initializeFirebase() {
  if (firebaseReady && firebaseApp) return true;

  try {
    const existing = getExistingFirebaseApp();
    if (existing) {
      firebaseApp = existing;
      firebaseReady = true;
      console.log("[Firebase] Firebase already initialized");
      console.log(
        "[Firebase] Firebase project ID:",
        existing.options?.projectId || resolveProjectId(null),
      );
      return true;
    }

    if (initAttempted) return false;
    initAttempted = true;

    const serviceAccount = loadServiceAccount();
    if (!serviceAccount) {
      console.warn(
        "[Firebase] Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_PATH, or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.",
      );
      return false;
    }

    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
    });
    firebaseReady = true;
    console.log("[Firebase] Firebase initialized successfully");
    console.log(
      "[Firebase] Firebase project ID:",
      firebaseApp.options?.projectId || resolveProjectId(serviceAccount),
    );
    return true;
  } catch (err) {
    console.error("[Firebase] Firebase initialization failed:", err.message);
    if (err.stack) {
      console.error("[Firebase] Stack trace:", err.stack);
    }
    return false;
  }
}

function getFirebaseMessaging() {
  if (!initializeFirebase()) return null;
  try {
    return getMessaging(firebaseApp || getApp());
  } catch (err) {
    console.error("[Firebase] getMessaging failed:", err.message);
    return null;
  }
}

function isFirebaseConfigured() {
  return initializeFirebase();
}

function normalizeDataPayload({ type = "general", link = "" } = {}) {
  return {
    type: String(type || "general"),
    link: String(link || ""),
  };
}

/** Mask FCM token for logs (keep prefix/suffix only). */
function maskToken(token) {
  const t = String(token || "").trim();
  if (!t) return "(empty)";
  if (t.length <= 12) return `${t.slice(0, 4)}…`;
  return `${t.slice(0, 8)}…${t.slice(-4)}`;
}

/**
 * Send FCM to a single device token.
 * @returns {{ success: boolean, invalidToken?: boolean, error?: string }}
 */
async function sendToToken(token, { title, body, type, link } = {}) {
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    return { success: false, error: "Firebase not configured" };
  }
  if (!token || typeof token !== "string") {
    return { success: false, error: "Token required" };
  }

  try {
    await messaging.send({
      token: token.trim(),
      notification: {
        title: String(title || "Notification"),
        body: String(body || ""),
      },
      data: normalizeDataPayload({ type, link }),
    });
    return { success: true };
  } catch (err) {
    const code = err?.code || err?.errorInfo?.code || "";
    const invalidToken = INVALID_TOKEN_CODES.has(code);
    if (invalidToken) {
      await FcmToken.deleteOne({ token: token.trim() }).catch(() => {});
    }
    return {
      success: false,
      invalidToken,
      error: err.message || String(err),
      code,
    };
  }
}

/**
 * Remove invalid tokens reported by Firebase multicast/batch responses.
 */
async function removeInvalidTokens(tokens, responses) {
  const toDelete = [];
  for (let i = 0; i < responses.length; i++) {
    const resp = responses[i];
    if (!resp.success && resp.error) {
      const code = resp.error.code || "";
      if (INVALID_TOKEN_CODES.has(code) && tokens[i]) {
        toDelete.push(tokens[i]);
      }
    }
  }
  if (toDelete.length === 0) return 0;
  const result = await FcmToken.deleteMany({ token: { $in: toDelete } });
  return result.deletedCount || 0;
}

/**
 * Send the same notification to many tokens (deduped). Batches in groups of 500.
 * @param {Map<string, string>|Record<string, string>|undefined} tokenMeta token → platform
 * @returns {{ sent: number, failed: number, removed: number }}
 */
async function sendToTokens(tokens, { title, body, type, link, tokenMeta } = {}) {
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    return { sent: 0, failed: 0, removed: 0, skipped: true };
  }

  const uniqueTokens = [...new Set((tokens || []).map((t) => String(t).trim()).filter(Boolean))];
  if (uniqueTokens.length === 0) {
    return { sent: 0, failed: 0, removed: 0 };
  }

  const platformOf = (token) => {
    if (!tokenMeta) return "(unknown)";
    if (typeof tokenMeta.get === "function") {
      return tokenMeta.get(token) || "(unknown)";
    }
    return tokenMeta[token] || "(unknown)";
  };

  let sent = 0;
  let failed = 0;
  let removed = 0;

  const data = normalizeDataPayload({ type, link });
  const notification = {
    title: String(title || "Notification"),
    body: String(body || ""),
  };

  for (let offset = 0; offset < uniqueTokens.length; offset += FCM_BATCH_SIZE) {
    const batch = uniqueTokens.slice(offset, offset + FCM_BATCH_SIZE);
    try {
      const response = await messaging.sendEachForMulticast({
        tokens: batch,
        notification,
        data,
      });

      const successCount = response.successCount || 0;
      const failureCount = response.failureCount || 0;
      sent += successCount;
      failed += failureCount;

      console.log(
        `[Firebase] FCM batch summary: successCount=${successCount} failureCount=${failureCount}`,
      );

      if (response.responses?.length) {
        for (let i = 0; i < response.responses.length; i++) {
          const resp = response.responses[i];
          if (resp.success) continue;

          const token = batch[i] || "";
          const code =
            resp.error?.code ||
            resp.error?.errorInfo?.code ||
            "(no-code)";
          const message =
            resp.error?.message ||
            resp.error?.errorInfo?.message ||
            String(resp.error || "(no-message)");

          console.error(
            `[Firebase] FCM FAIL\nplatform=${platformOf(token)}\ntoken=${maskToken(token)}\ncode=${code}\nmessage=${message}`,
          );
        }

        removed += await removeInvalidTokens(batch, response.responses);
      }
    } catch (err) {
      console.error("[Firebase] FCM multicast batch error:", err.message);
      failed += batch.length;
    }
  }

  return { sent, failed, removed };
}

/**
 * Broadcast FCM to all registered mobile tokens (deduped by token value).
 * @returns {{ sent: number, failed: number, removed: number }}
 */
async function sendFcmToAll(title, body = "", { type = "general", link = "" } = {}) {
  if (!initializeFirebase()) {
    return { sent: 0, failed: 0, removed: 0, skipped: true };
  }

  const docs = await FcmToken.find({}).select("token platform").lean();
  const tokenMeta = new Map();
  for (const d of docs) {
    const t = d?.token ? String(d.token).trim() : "";
    if (!t) continue;
    tokenMeta.set(t, d.platform ? String(d.platform) : "(unknown)");
  }
  const tokens = [...tokenMeta.keys()];
  console.log(`[Firebase] sendFcmToAll: ${tokens.length} token(s) in fcmtokens`);
  return sendToTokens(tokens, { title, body, type, link, tokenMeta });
}

module.exports = {
  initializeFirebase,
  isFirebaseConfigured,
  sendToToken,
  sendToTokens,
  sendFcmToAll,
  INVALID_TOKEN_CODES,
};
