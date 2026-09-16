/**
 * Indian PIN Code Validation & Lookup Service
 *
 * Validates 6-digit Indian PIN codes against standard format (starts with 1-9)
 * and verifies existence against the official India Post postal pincode directory.
 */

const pincodeCache = new Map();

/**
 * Checks if a string matches standard Indian 6-digit PIN code format.
 * First digit must be 1-9 (Indian postal zones 1 to 9).
 */
export const isValidPincodeFormat = (pincode) => {
  if (!pincode) return false;
  const clean = pincode.toString().trim();
  return /^[1-9][0-9]{5}$/.test(clean);
};

/**
 * Lookup PIN code details (district, state, city/post offices).
 *
 * @param {string} pincode - 6-digit PIN code
 * @returns {Promise<{ valid: boolean, state?: string, district?: string, city?: string, message?: string, fallback?: boolean }>}
 */
export const lookupPincode = async (pincode) => {
  if (!pincode) {
    return { valid: false, message: 'PIN code is required' };
  }

  const clean = pincode.toString().trim();

  if (!isValidPincodeFormat(clean)) {
    return {
      valid: false,
      message: 'Please enter a valid 6-digit Indian PIN code (digits only, starting with 1-9)',
    };
  }

  // Check cache first to avoid repetitive API hits
  if (pincodeCache.has(clean)) {
    return pincodeCache.get(clean);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Postal service returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const entry = data[0];
      if (entry.Status === 'Success' && Array.isArray(entry.PostOffice) && entry.PostOffice.length > 0) {
        const po = entry.PostOffice[0];
        const state = po.State || '';
        const district = po.District || po.Block || po.Circle || '';
        const city = po.District || po.Name || '';

        const result = {
          valid: true,
          pincode: clean,
          state,
          district,
          city,
          postOffices: entry.PostOffice.map((p) => p.Name).slice(0, 5),
          message: `${district ? `${district}, ` : ''}${state}`,
        };

        pincodeCache.set(clean, result);
        return result;
      } else {
        const result = {
          valid: false,
          pincode: clean,
          message: 'Invalid PIN code. No postal records found for this PIN code.',
        };
        pincodeCache.set(clean, result);
        return result;
      }
    }
  } catch (err) {
    // If the external postal lookup fails or times out, but format is strictly valid,
    // we don't hard-block the user completely if network is offline, but flag as unverified.
    console.warn('Pincode lookup network issue:', err.message);
  }

  // Fallback for valid format if network fails
  return {
    valid: true,
    pincode: clean,
    state: '',
    district: '',
    city: '',
    fallback: true,
    message: 'Valid PIN code format',
  };
};
