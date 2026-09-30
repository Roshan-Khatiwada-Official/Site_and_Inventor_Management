import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** True if `stored` is already a bcrypt hash (starts with $2a$/$2b$/$2y$), not a legacy plaintext value. */
export function isHashed(stored: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(stored);
}

/**
 * Compares a login attempt's password against what's stored. Transparently
 * supports rows imported from the old Sheets-based system, which stored
 * plaintext — those compare with a direct string match instead of bcrypt,
 * so existing accounts keep working without a forced reset.
 */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (isHashed(stored)) return bcrypt.compare(plain, stored);
  return plain === stored;
}
