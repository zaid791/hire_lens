import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../../firebase-service-account.json');

// Initialize Firebase Admin SDK
if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  try {
    const serviceAccount = require(SERVICE_ACCOUNT_PATH);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('📦 Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK with credentials file:', error);
  }
} else {
  console.warn(
    '⚠️ Firebase credentials file not found at:',
    SERVICE_ACCOUNT_PATH,
    '\nRunning in LOCAL MOCK mode. Rate limiting and subscription features will be simulated without persisting to Firestore.'
  );
}

// Get Firestore reference (will be undefined if not initialized)
const db = admin.apps.length > 0 ? admin.firestore() : null;

// Subscription Tier limits
export const LIMITS = {
  base: 4,      // 4 requests per day on base level
  premium: 100  // high limit for premium users
};

export interface QuotaCheckResult {
  allowed: boolean;
  requestsToday: number;
  limit: number;
  remaining: number;
  subscriptionTier: string;
  isMock: boolean;
}

// In-memory mock database for fallback mode if no credentials exist yet
const mockDb: Record<string, { subscriptionTier: string; requestsToday: number; lastRequestDate: string; linkedCode?: string }> = {};
const mockCodes: Record<string, string> = {}; // maps code -> chatId

/**
 * Generates a one-time secure 6-digit verification code to link a Telegram account with Web.
 */
export async function generateLinkingCode(chatId: string): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code

  if (!db) {
    mockCodes[code] = chatId;
    return code;
  }

  // Save to a temporary linking collection in Firestore (valid for 15 minutes)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  await db.collection('linkingCodes').doc(code).set({
    telegramChatId: chatId,
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt)
  });

  return code;
}

/**
 * Checks if the user is within their daily quota and increments the counter in Firestore.
 * Adapts to check for either a direct Telegram document or a linked Web profile.
 */
export async function checkAndIncrementRequestLimit(
  chatId: string,
  username?: string
): Promise<QuotaCheckResult> {
  const todayStr = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

  // -- FALLBACK / MOCK MODE --
  if (!db) {
    if (!mockDb[chatId]) {
      mockDb[chatId] = {
        subscriptionTier: 'base',
        requestsToday: 0,
        lastRequestDate: todayStr
      };
    }

    const user = mockDb[chatId];

    // Reset daily requests if it is a new day
    if (user.lastRequestDate !== todayStr) {
      user.requestsToday = 0;
      user.lastRequestDate = todayStr;
    }

    const tier = user.subscriptionTier as keyof typeof LIMITS;
    const limit = LIMITS[tier] || LIMITS.base;

    if (user.requestsToday >= limit) {
      return {
        allowed: false,
        requestsToday: user.requestsToday,
        limit,
        remaining: 0,
        subscriptionTier: tier,
        isMock: true
      };
    }

    // Increment count
    user.requestsToday += 1;

    return {
      allowed: true,
      requestsToday: user.requestsToday,
      limit,
      remaining: limit - user.requestsToday,
      subscriptionTier: tier,
      isMock: true
    };
  }

  // -- REAL FIRESTORE MODE --
  try {
    // 1. First, search if there is a linked user document where telegramChatId matches this chatId
    const usersSnap = await db.collection('users')
      .where('telegramChatId', '==', chatId)
      .limit(1)
      .get();

    let userRef: admin.firestore.DocumentReference;

    if (!usersSnap.empty) {
      // Linked Web Account exists! We use it as the source of truth
      userRef = usersSnap.docs[0].ref;
    } else {
      // Fallback: direct Telegram-only document
      userRef = db.collection('users').doc(`telegram_${chatId}`);
    }

    // Run as a transaction to avoid race conditions
    return await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(userRef);
      
      let subscriptionTier = 'base';
      let requestsToday = 0;
      let lastRequestDate = todayStr;

      if (doc.exists) {
        const data = doc.data();
        subscriptionTier = data?.subscriptionTier || 'base';
        requestsToday = data?.requestsToday || 0;
        lastRequestDate = data?.lastRequestDate || '';
      }

      // Reset quota if the date is in the past
      if (lastRequestDate !== todayStr) {
        requestsToday = 0;
        lastRequestDate = todayStr;
      }

      const limit = LIMITS[subscriptionTier as keyof typeof LIMITS] || LIMITS.base;

      if (requestsToday >= limit) {
        return {
          allowed: false,
          requestsToday,
          limit,
          remaining: 0,
          subscriptionTier,
          isMock: false
        };
      }

      // Increment count
      const newCount = requestsToday + 1;
      const updateData: any = {
        requestsToday: newCount,
        lastRequestDate: todayStr,
        subscriptionTier
      };

      if (!usersSnap.empty) {
        // Linked profile already has ID; we just sync username
        if (username) {
          updateData.telegramUsername = username;
        }
      } else {
        // Direct Telegram profile needs all details
        updateData.telegramChatId = chatId;
        if (username) {
          updateData.telegramUsername = username;
        }
      }

      // Write to transaction
      transaction.set(userRef, updateData, { merge: true });

      return {
        allowed: true,
        requestsToday: newCount,
        limit,
        remaining: limit - newCount,
        subscriptionTier,
        isMock: false
      };
    });
  } catch (error) {
    console.error('❌ Firestore transaction failed, falling back to allowing request:', error);
    return {
      allowed: true,
      requestsToday: 0,
      limit: LIMITS.base,
      remaining: LIMITS.base,
      subscriptionTier: 'base',
      isMock: true
    };
  }
}

/**
 * Retrieves the current user profile state from Firestore.
 * Supports cross-linked profiles.
 */
export async function getUserProfile(chatId: string): Promise<{ subscriptionTier: string; requestsToday: number; limit: number; remaining: number } | null> {
  const todayStr = new Date().toISOString().split('T')[0];

  if (!db) {
    const user = mockDb[chatId];
    if (!user) return null;
    const limit = LIMITS[user.subscriptionTier as keyof typeof LIMITS] || LIMITS.base;
    const currentToday = user.lastRequestDate === todayStr ? user.requestsToday : 0;
    return {
      subscriptionTier: user.subscriptionTier,
      requestsToday: currentToday,
      limit,
      remaining: Math.max(0, limit - currentToday)
    };
  }

  try {
    // Search linked profiles first
    const usersSnap = await db.collection('users')
      .where('telegramChatId', '==', chatId)
      .limit(1)
      .get();

    let doc;
    if (!usersSnap.empty) {
      doc = usersSnap.docs[0];
    } else {
      doc = await db.collection('users').doc(`telegram_${chatId}`).get();
    }

    if (!doc.exists) return null;

    const data = doc.data();
    const subscriptionTier = data?.subscriptionTier || 'base';
    let requestsToday = data?.requestsToday || 0;
    const lastRequestDate = data?.lastRequestDate || '';

    if (lastRequestDate !== todayStr) {
      requestsToday = 0;
    }

    const limit = LIMITS[subscriptionTier as keyof typeof LIMITS] || LIMITS.base;

    return {
      subscriptionTier,
      requestsToday,
      limit,
      remaining: Math.max(0, limit - requestsToday)
    };
  } catch (error) {
    console.error('❌ Failed to fetch user profile:', error);
    return null;
  }
}

