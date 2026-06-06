import admin from 'firebase-admin';

function initializeFirebaseAdmin(): boolean {
  if (admin.apps.length > 0) {
    return true;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log('📦 Firebase Admin SDK initialized (Application Default Credentials).');
    return true;
  } catch (error) {
    console.warn(
      '⚠️ Firebase Admin SDK not initialized. Run `gcloud auth application-default login` for local Firestore, or deploy to Cloud Run with a service account.',
      error
    );
    return false;
  }
}

const firebaseReady = initializeFirebaseAdmin();
const db = firebaseReady ? admin.firestore() : null;

export const LIMITS = {
  base: 4,
  premium: 100
};

export interface QuotaCheckResult {
  allowed: boolean;
  requestsToday: number;
  limit: number;
  remaining: number;
  subscriptionTier: string;
  isMock: boolean;
}

const mockDb: Record<string, { subscriptionTier: string; requestsToday: number; lastRequestDate: string; linkedCode?: string }> = {};
const mockCodes: Record<string, string> = {};

export async function generateLinkingCode(chatId: string): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  if (!db) {
    mockCodes[code] = chatId;
    return code;
  }

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  await db.collection('linkingCodes').doc(code).set({
    telegramChatId: chatId,
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt)
  });

  return code;
}

export async function checkAndIncrementRequestLimit(
  chatId: string,
  username?: string
): Promise<QuotaCheckResult> {
  const todayStr = new Date().toISOString().split('T')[0];

  if (!db) {
    if (!mockDb[chatId]) {
      mockDb[chatId] = {
        subscriptionTier: 'base',
        requestsToday: 0,
        lastRequestDate: todayStr
      };
    }

    const user = mockDb[chatId];

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

  try {
    const usersSnap = await db.collection('users')
      .where('telegramChatId', '==', chatId)
      .limit(1)
      .get();

    let userRef: admin.firestore.DocumentReference;

    if (!usersSnap.empty) {
      userRef = usersSnap.docs[0].ref;
    } else {
      userRef = db.collection('users').doc(`telegram_${chatId}`);
    }

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

      const newCount = requestsToday + 1;
      const updateData: Record<string, unknown> = {
        requestsToday: newCount,
        lastRequestDate: todayStr,
        subscriptionTier
      };

      if (!usersSnap.empty) {
        if (username) {
          updateData.telegramUsername = username;
        }
      } else {
        updateData.telegramChatId = chatId;
        if (username) {
          updateData.telegramUsername = username;
        }
      }

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
