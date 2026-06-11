import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { computeQuota } from '../utils/quota';

export interface AdminUserRow {
  id: string;
  email?: string;
  subscriptionTier: string;
  requestsToday: number;
  limit: number;
  remaining: number;
  telegramLinked: boolean;
  telegramUsername?: string;
}

function isWebsiteUserDocId(docId: string): boolean {
  return !docId.startsWith('telegram_');
}

export async function checkIsAdmin(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'admins', uid));
  return snap.exists();
}

export async function fetchAllUsers(): Promise<AdminUserRow[]> {
  const snap = await getDocs(collection(db, 'users'));

  return snap.docs
    .filter((docSnap) => isWebsiteUserDocId(docSnap.id))
    .map((docSnap) => {
      const data = docSnap.data();
      const quota = computeQuota(data);

      return {
        id: docSnap.id,
        email: typeof data.email === 'string' ? data.email : undefined,
        subscriptionTier: quota.tier,
        requestsToday: quota.requestsToday,
        limit: quota.limit,
        remaining: quota.remaining,
        telegramLinked: Boolean(data.telegramChatId),
        telegramUsername:
          typeof data.telegramUsername === 'string'
            ? data.telegramUsername
            : undefined,
      };
    })
    .sort((a, b) =>
      (a.email ?? a.id).localeCompare(b.email ?? b.id, undefined, {
        sensitivity: 'base',
      })
    );
}
