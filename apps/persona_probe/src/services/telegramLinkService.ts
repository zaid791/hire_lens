import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

function requireBotUsername(): string {
  const username = import.meta.env.VITE_TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, '');
  if (!username) {
    throw new Error('Telegram bot username is not configured (VITE_TELEGRAM_BOT_USERNAME).');
  }
  return username;
}

export async function createTelegramConnectUrl(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to connect Telegram.');
  }

  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 15 * 60 * 1000));

  await setDoc(doc(db, 'telegramLinkTokens', token), {
    userId: user.uid,
    expiresAt,
    createdAt: Timestamp.now(),
  });

  const botUsername = requireBotUsername();
  return `https://t.me/${botUsername}?start=${token}`;
}
