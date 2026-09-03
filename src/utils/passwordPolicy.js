/**
 * Password rules, mirrored from the backend (backend/utils/validators.js).
 *
 * The two were out of sync: the frontend accepted any 6-character string, so a
 * user could fill the form, pass client validation, and only then be rejected
 * by the server. Keeping the rule in one module here makes the three forms that
 * use it agree with each other and with the API.
 *
 * This is a UX pre-check only — the backend remains the authority.
 */
export const PASSWORD_RULE_TEXT = 'At least 8 characters, including a letter and a number';

export const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password must be under 128 characters.' };
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one letter and one number.' };
  }
  return { valid: true };
};
