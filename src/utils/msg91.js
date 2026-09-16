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
let lastRenderedContainer = null;

/**
 * Loads the MSG91 script and initializes the widget once.
 * Returns a Promise that resolves when window.sendOtp, window.retryOtp,
 * and window.verifyOtp are ready to be invoked.
 */
export const initMsg91 = () => {
  const containerId = 'msg91-captcha-container';
  const container = typeof document !== 'undefined' ? document.getElementById(containerId) : null;

  // If already initialized and currently mounted container is already rendered, resolve immediately (idempotent)
  if (isInitialized && typeof window.sendOtp === 'function' && container && container === lastRenderedContainer) {
    return Promise.resolve();
  }

  // If script already loaded and methods exposed, but we have a newly mounted container (e.g. after SPA navigation)
  if (typeof window.initSendOTP === 'function' && container && container !== lastRenderedContainer) {
    try {
      const widgetId = process.env.REACT_APP_MSG91_WIDGET_ID;
      const tokenAuth = process.env.REACT_APP_MSG91_TOKEN_AUTH;
      if (widgetId && tokenAuth) {
        const configuration = {
          widgetId,
          tokenAuth,
          exposeMethods: true,
          captchaRenderId: containerId,
          success: (data) => {
            console.log('MSG91 global success event:', data);
          },
          failure: (error) => {
            console.warn('MSG91 global failure event:', error);
          },
          captchaVerified: (status) => {
            console.log('MSG91 captcha verification status:', status);
            if (typeof window.onMsg91CaptchaVerified === 'function') {
              window.onMsg91CaptchaVerified(status);
            }
          }
        };
        window.initSendOTP(configuration);
        lastRenderedContainer = container;
        isInitialized = true;
        return Promise.resolve();
      }
    } catch (e) {
      console.warn('MSG91 container re-render notice:', e);
    }
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

        const containerId = 'msg91-captcha-container';
        let container = document.getElementById(containerId);
        if (!container) {
          container = document.createElement('div');
          container.id = containerId;
          container.style.display = 'none'; // Prevent floating at bottom of screen
          document.body.appendChild(container);
        }

        const configuration = {
          widgetId,
          tokenAuth,
          exposeMethods: true,
          captchaRenderId: containerId,
          success: (data) => {
            console.log('MSG91 global success event:', data);
          },
          failure: (error) => {
            console.warn('MSG91 global failure event:', error);
          },
          captchaVerified: (status) => {
            console.log('MSG91 captcha verification status:', status);
            if (typeof window.onMsg91CaptchaVerified === 'function') {
              window.onMsg91CaptchaVerified(status);
            }
          }
        };

        window.initSendOTP(configuration);
        lastRenderedContainer = container;

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

    let widgetInitialized = false;
    const safeInitWidget = () => {
      if (widgetInitialized) return;
      if (typeof window.initSendOTP === 'function') {
        widgetInitialized = true;
        initWidget();
      }
    };

    // 1. If window.initSendOTP is already available on window, initialize immediately
    if (typeof window.initSendOTP === 'function') {
      safeInitWidget();
      return;
    }

    // 2. Fallback polling: catches case where script already loaded before addEventListener was attached
    const pollInterval = setInterval(() => {
      if (typeof window.initSendOTP === 'function') {
        clearInterval(pollInterval);
        safeInitWidget();
      }
    }, 50);

    setTimeout(() => {
      clearInterval(pollInterval);
    }, 10000);

    // 3. Listen on existing script tag if already in document (e.g. from index.html)
    const existingScript = document.querySelector(
      'script[src*="verify.msg91.com/otp-provider.js"], script[src*="verify.phone91.com/otp-provider.js"]'
    );
    if (existingScript) {
      existingScript.addEventListener('load', safeInitWidget);
      existingScript.addEventListener('error', () => {
        clearInterval(pollInterval);
        scriptPromise = null;
        reject(new Error('Failed to load MSG91 script.'));
      });
      return;
    }

    // 4. Inject script if not found in DOM
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://verify.msg91.com/otp-provider.js';
    script.async = true;
    script.onload = safeInitWidget;
    script.onerror = () => {
      clearInterval(pollInterval);
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

/**
 * Completely clean up any lingering floating captcha elements from body.
 */
export const cleanupMsg91Captcha = () => {
  if (typeof document === 'undefined') return;
  const bodyContainers = document.querySelectorAll('body > #msg91-captcha-container, body > [id*="msg91"], iframe[src*="msg91"]');
  bodyContainers.forEach((el) => {
    // Only remove if directly under body and not inside active guest OTP form
    if (el.parentElement === document.body) {
      el.remove();
    }
  });
};
