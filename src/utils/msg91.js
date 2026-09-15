/**
 * MSG91 OTP Widget Client Integration
 *
 * Requirements:
 * - Load https://verify.msg91.com/otp-provider.js only once.
 * - Initialize only once with exposeMethods: true.
 * - Custom UI: Never show MSG91 popup.
 * - Use environment variables: REACT_APP_MSG91_WIDGET_ID, REACT_APP_MSG91_TOKEN_AUTH.
 * - Normalize Indian mobile numbers: 91 + 10 digits, without '+'.
 */

let scriptPromise = null;
let isInitialized = false;

/**
 * Loads the MSG91 script and initializes the widget once.
 * Returns a Promise that resolves when window.sendOtp, window.retryOtp,
 * and window.verifyOtp are ready to be invoked.
 */
export const initMsg91 = () => {
  if (isInitialized && typeof window.sendOtp === 'function') {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const widgetId = process.env.REACT_APP_MSG91_WIDGET_ID;
    const tokenAuth = process.env.REACT_APP_MSG91_TOKEN_AUTH;

    if (!widgetId || !tokenAuth) {
      const err = new Error('MSG91 Widget ID or Token Auth missing in environment configuration.');
      console.error(err.message);
      return reject(err);
    }

    const initWidget = () => {
      try {
        if (typeof window.initSendOTP !== 'function') {
          return reject(new Error('initSendOTP not found on window object.'));
        }

        const configuration = {
          widgetId,
          tokenAuth,
          exposeMethods: true,
          captchaRenderId: '',
          success: (data) => {
            console.log('MSG91 global success event:', data);
          },
          failure: (error) => {
            console.warn('MSG91 global failure event:', error);
          }
        };

        window.initSendOTP(configuration);

        // Wait for window.sendOtp and window.verifyOtp to be exposed on window
        const checkInterval = setInterval(() => {
          if (typeof window.sendOtp === 'function' && typeof window.verifyOtp === 'function') {
            clearInterval(checkInterval);
            isInitialized = true;
            resolve();
          }
        }, 50);

        setTimeout(() => {
          clearInterval(checkInterval);
          if (typeof window.sendOtp === 'function') {
            isInitialized = true;
            resolve();
          } else {
            reject(new Error('Timed out waiting for MSG91 methods to be ready. Please refresh and try again.'));
          }
        }, 10000);
      } catch (e) {
        reject(e);
      }
    };

    // Check if script already in document
    const existingScript = document.querySelector('script[src="https://verify.msg91.com/otp-provider.js"]');
    if (existingScript) {
      if (typeof window.initSendOTP === 'function') {
        initWidget();
      } else {
        existingScript.addEventListener('load', initWidget);
        existingScript.addEventListener('error', () => reject(new Error('Failed to load MSG91 script.')));
      }
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://verify.msg91.com/otp-provider.js';
    script.async = true;
    script.onload = () => {
      initWidget();
    };
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Could not load MSG91 verification script. Please check your connection.'));
    };

    document.body.appendChild(script);
  });

  return scriptPromise;
};

/**
 * Normalizes Indian mobile number to the format required by MSG91:
 * Country code '91' without '+', followed by the 10 digits.
 * Example: '9876543210' -> '919876543210'
 */
export const normalizeMobileForMsg91 = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  const bare10 = digits.slice(-10);
  return `91${bare10}`;
};

/**
 * Validates whether the given string is a valid 10-digit Indian mobile number.
 */
export const isValidIndianMobile = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  const bare10 = digits.slice(-10);
  return bare10.length === 10 && /^[6-9]\d{9}$/.test(bare10);
};

/**
 * Send OTP via MSG91 window.sendOtp
 *
 * @param {string} mobile - 10-digit Indian mobile number
 * @param {Function} onSuccess - Callback when OTP sent successfully
 * @param {Function} onFailure - Callback on failure
 */
export const sendMsg91Otp = async (mobile, onSuccess, onFailure) => {
  try {
    await initMsg91();

    if (typeof window.sendOtp !== 'function') {
      throw new Error('window.sendOtp is not available. Please retry in a moment.');
    }

    const normalized = normalizeMobileForMsg91(mobile);
    window.sendOtp(normalized, onSuccess, onFailure);
  } catch (err) {
    if (onFailure) onFailure(err);
  }
};

/**
 * Retry/Resend OTP via MSG91 window.retryOtp
 *
 * @param {Function} onSuccess - Callback when retry successful
 * @param {Function} onFailure - Callback on failure
 * @param {string} [reqId] - Optional reqId from previous send/retry
 */
export const retryMsg91Otp = async (onSuccess, onFailure, reqId = null) => {
  try {
    await initMsg91();

    if (typeof window.retryOtp !== 'function') {
      throw new Error('window.retryOtp is not available.');
    }

    // MSG91 custom UI requires channel '11' (SMS) for retry
    window.retryOtp('11', onSuccess, onFailure, reqId || undefined);
  } catch (err) {
    if (onFailure) onFailure(err);
  }
};

/**
 * Verify OTP entered by client via MSG91 window.verifyOtp
 *
 * @param {string|number} otp - The user-entered OTP code
 * @param {Function} onSuccess - Callback returning verification response / access token
 * @param {Function} onFailure - Callback on failure
 * @param {string} [reqId] - Optional reqId
 */
export const verifyMsg91Otp = async (otp, onSuccess, onFailure, reqId = null) => {
  try {
    await initMsg91();

    if (typeof window.verifyOtp !== 'function') {
      throw new Error('window.verifyOtp is not available.');
    }

    window.verifyOtp(otp, onSuccess, onFailure, reqId || undefined);
  } catch (err) {
    if (onFailure) onFailure(err);
  }
};

/**
 * Check if CAPTCHA is verified if widget enforces it.
 */
export const isCaptchaVerified = () => {
  if (typeof window.isCaptchaVerified === 'function') {
    return window.isCaptchaVerified();
  }
  return true;
};
