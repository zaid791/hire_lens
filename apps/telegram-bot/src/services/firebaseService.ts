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
  linked: boolean;
}

export interface LinkResult {
  ok: boolean;
  error?: string;
}

export interface LinkedAccount {
  userId: string;
  subscriptionTier: string;
}

const mockLinked: Record<string, string> = {};
const mockTokens: Record<string, { userId: string; expiresAt: number }> = {};
const mockUsers: Record<string, {
  subscriptionTier: string;
  requestsToday: number;
  lastRequestDate: string;
  telegramChatId?: string;
}> = {};

function isWebsiteUserDocId(docId: string): boolean {
  return !docId.startsWith('telegram_');
}

export async function isTelegramLinked(chatId: string): Promise<LinkedAccount | null> {
  if (!db) {
    const userId = mockLinked[chatId];
    if (!userId) return null;
    const user = mockUsers[userId];
    return {
      userId,
      subscriptionTier: user?.subscriptionTier || 'base',
    };
  }

  try {
    const usersSnap = await db.collection('users')
      .where('telegramChatId', '==', chatId)
      .limit(1)
      .get();

    if (usersSnap.empty) return null;

    const doc = usersSnap.docs[0];
    if (!isWebsiteUserDocId(doc.id)) return null;

    const data = doc.data();
    return {
      userId: doc.id,
      subscriptionTier: data?.subscriptionTier || 'base',
    };
  } catch (error) {
    console.error('❌ Failed to check Telegram link status:', error);
    return null;
  }
}

export async function completeTelegramLink(
  token: string,
  chatId: string,
  username?: string
): Promise<LinkResult> {
  if (!token) {
    return { ok: false, error: 'Missing link token.' };
  }

  if (!db) {
    const pending = mockTokens[token];
    if (!pending || pending.expiresAt < Date.now()) {
      return { ok: false, error: 'This link has expired. Generate a new one from the website.' };
    }

    mockLinked[chatId] = pending.userId;
    if (!mockUsers[pending.userId]) {
      mockUsers[pending.userId] = {
        subscriptionTier: 'base',
        requestsToday: 0,
        lastRequestDate: new Date().toISOString().split('T')[0],
      };
    }
    mockUsers[pending.userId].telegramChatId = chatId;
    delete mockTokens[token];
    return { ok: true };
  }

  try {
    const tokenRef = db.collection('telegramLinkTokens').doc(token);
    const tokenSnap = await tokenRef.get();

    if (!tokenSnap.exists) {
      return { ok: false, error: 'Invalid link token. Open Connect Telegram from your website account.' };
    }

    const { userId, expiresAt } = tokenSnap.data() as {
      userId: string;
      expiresAt: admin.firestore.Timestamp;
    };

    if (expiresAt.toMillis() < Date.now()) {
      await tokenRef.delete();
      return { ok: false, error: 'This link has expired. Generate a new one from the website.' };
    }

    const existingLink = await db.collection('users')
      .where('telegramChatId', '==', chatId)
      .get();

    const linkedWebsiteUser = existingLink.docs.find((doc) => isWebsiteUserDocId(doc.id));
    if (linkedWebsiteUser && linkedWebsiteUser.id !== userId) {
      return { ok: false, error: 'This Telegram account is already linked to another website user.' };
    }

    const userRef = db.collection('users').doc(userId);
    const legacyRef = db.collection('users').doc(`telegram_${chatId}`);

    await db.runTransaction(async (transaction) => {
      const legacySnap = await transaction.get(legacyRef);
      const userSnap = await transaction.get(userRef);

      const legacyData = legacySnap.exists ? legacySnap.data() : undefined;
      const userData = userSnap.exists ? userSnap.data() : undefined;

      transaction.set(userRef, {
        telegramChatId: chatId,
        ...(username ? { telegramUsername: username } : {}),
        subscriptionTier: userData?.subscriptionTier || legacyData?.subscriptionTier || 'base',
        requestsToday: userData?.requestsToday ?? legacyData?.requestsToday ?? 0,
        lastRequestDate: userData?.lastRequestDate || legacyData?.lastRequestDate || new Date().toISOString().split('T')[0],
      }, { merge: true });

      if (legacySnap.exists) {
        transaction.delete(legacyRef);
      }

      transaction.delete(tokenRef);
    });
    return { ok: true };
  } catch (error) {
    console.error('❌ Failed to complete Telegram link:', error);
    return { ok: false, error: 'Could not link Telegram. Please try again from the website.' };
  }
}

export async function checkAndIncrementRequestLimit(
  chatId: string,
  username?: string
): Promise<QuotaCheckResult> {
  const todayStr = new Date().toISOString().split('T')[0];
  const linked = await isTelegramLinked(chatId);

  if (!linked) {
    return {
      allowed: false,
      requestsToday: 0,
      limit: 0,
      remaining: 0,
      subscriptionTier: 'base',
      isMock: !db,
      linked: false,
    };
  }

  if (!db) {
    const user = mockUsers[linked.userId] ?? {
      subscriptionTier: linked.subscriptionTier,
      requestsToday: 0,
      lastRequestDate: todayStr,
    };
    mockUsers[linked.userId] = user;

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
        isMock: true,
        linked: true,
      };
    }

    user.requestsToday += 1;

    return {
      allowed: true,
      requestsToday: user.requestsToday,
      limit,
      remaining: limit - user.requestsToday,
      subscriptionTier: tier,
      isMock: true,
      linked: true,
    };
  }

  try {
    const userRef = db.collection('users').doc(linked.userId);

    return await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(userRef);

      let subscriptionTier = linked.subscriptionTier;
      let requestsToday = 0;
      let lastRequestDate = todayStr;

      if (doc.exists) {
        const data = doc.data();
        subscriptionTier = data?.subscriptionTier || subscriptionTier;
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
          isMock: false,
          linked: true,
        };
      }

      const newCount = requestsToday + 1;
      transaction.set(userRef, {
        requestsToday: newCount,
        lastRequestDate: todayStr,
        subscriptionTier,
        telegramChatId: chatId,
        ...(username ? { telegramUsername: username } : {}),
      }, { merge: true });

      return {
        allowed: true,
        requestsToday: newCount,
        limit,
        remaining: limit - newCount,
        subscriptionTier,
        isMock: false,
        linked: true,
      };
    });
  } catch (error) {
    console.error('❌ Firestore transaction failed:', error);
    return {
      allowed: false,
      requestsToday: 0,
      limit: LIMITS.base,
      remaining: 0,
      subscriptionTier: 'base',
      isMock: true,
      linked: true,
    };
  }
}

export async function getUserProfile(chatId: string): Promise<{
  subscriptionTier: string;
  requestsToday: number;
  limit: number;
  remaining: number;
  linked: boolean;
} | null> {
  const todayStr = new Date().toISOString().split('T')[0];
  const linked = await isTelegramLinked(chatId);

  if (!linked) {
    return {
      subscriptionTier: 'base',
      requestsToday: 0,
      limit: 0,
      remaining: 0,
      linked: false,
    };
  }

  if (!db) {
    const user = mockUsers[linked.userId];
    if (!user) {
      return {
        subscriptionTier: linked.subscriptionTier,
        requestsToday: 0,
        limit: LIMITS.base,
        remaining: LIMITS.base,
        linked: true,
      };
    }
    const limit = LIMITS[user.subscriptionTier as keyof typeof LIMITS] || LIMITS.base;
    const currentToday = user.lastRequestDate === todayStr ? user.requestsToday : 0;
    return {
      subscriptionTier: user.subscriptionTier,
      requestsToday: currentToday,
      limit,
      remaining: Math.max(0, limit - currentToday),
      linked: true,
    };
  }

  try {
    const doc = await db.collection('users').doc(linked.userId).get();
    if (!doc.exists) {
      return {
        subscriptionTier: linked.subscriptionTier,
        requestsToday: 0,
        limit: LIMITS.base,
        remaining: LIMITS.base,
        linked: true,
      };
    }

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
      remaining: Math.max(0, limit - requestsToday),
      linked: true,
    };
  } catch (error) {
    console.error('❌ Failed to fetch user profile:', error);
    return null;
  }
}

/** @internal Mock helper for local testing without Firestore */
export function __mockRegisterLinkToken(token: string, userId: string) {
  mockTokens[token] = { userId, expiresAt: Date.now() + 15 * 60 * 1000 };
}
