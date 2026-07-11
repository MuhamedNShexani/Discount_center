const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const FcmToken = require("../models/FcmToken");

const FCM_BATCH_SIZE = 500;

/** Firebase error codes that mean the token should be removed. */
const INVALID_TOKEN_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);

let firebaseReady = false;
let initAttempted = false;

function loadServiceAccount() {
  const jsonInline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonInline && jsonInline.trim()) {
    try {
      return JSON.parse(jsonInline);
    } catch (e) {
      console.error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON:", e.message);
      return null;
    }
  }

  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (filePath && filePath.trim()) {
    try {
      const resolved = path.resolve(filePath.trim());
      const raw = fs.readFileSync(resolved, "utf8");
      return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to load FIREBASE_SERVICE_ACCOUNT_PATH:", e.message);
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
    return {
      projectId,
      clientEmail,
      privateKey,
    };
  }

  return null;
}

function initializeFirebase() {
  if (firebaseReady) return true;
  if (initAttempted) return false;
  initAttempted = true;

  try {
    if (admin.apps.length > 0) {
      firebaseReady = true;
      return true;
    }

    const serviceAccount = loadServiceAccount();
    if (!serviceAccount) {
      console.warn(
        "Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_PATH, or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.",
      );
      return false;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseReady = true;
    return true;
  } catch (err) {
    console.error("Firebase Admin initialization failed:", err.message);
    return false;
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

/**
 * Send FCM to a single device token.
 * @returns {{ success: boolean, invalidToken?: boolean, error?: string }}
 */
async function sendToToken(token, { title, body, type, link } = {}) {
  if (!initializeFirebase()) {
    return { success: false, error: "Firebase not configured" };
  }
  if (!token || typeof token !== "string") {
    return { success: false, error: "Token required" };
  }

  try {
    await admin.messaging().send({
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
 * @returns {{ sent: number, failed: number, removed: number }}
 */
async function sendToTokens(tokens, { title, body, type, link } = {}) {
  if (!initializeFirebase()) {
    return { sent: 0, failed: 0, removed: 0, skipped: true };
  }

  const uniqueTokens = [...new Set((tokens || []).map((t) => String(t).trim()).filter(Boolean))];
  if (uniqueTokens.length === 0) {
    return { sent: 0, failed: 0, removed: 0 };
  }

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
      const response = await admin.messaging().sendEachForMulticast({
        tokens: batch,
        notification,
        data,
      });

      sent += response.successCount || 0;
      failed += response.failureCount || 0;

      if (response.responses?.length) {
        removed += await removeInvalidTokens(batch, response.responses);
      }
    } catch (err) {
      console.error("FCM multicast batch error:", err.message);
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

  const docs = await FcmToken.find({}).select("token").lean();
  const tokens = docs.map((d) => d.token).filter(Boolean);
  return sendToTokens(tokens, { title, body, type, link });
}

module.exports = {
  initializeFirebase,
  isFirebaseConfigured,
  sendToToken,
  sendToTokens,
  sendFcmToAll,
  INVALID_TOKEN_CODES,
};
