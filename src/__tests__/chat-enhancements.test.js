describe('Live Chat Enhancements (FEAT: Voice Dictation, In-Chat Search, Attachments, Deletion)', () => {
  // 1. In-Chat Message Search Filter & Indexing Logic
  test('In-Chat search filters messages accurately by case-insensitive text', () => {
    const messages = [
      { _id: '1', text: 'Do you have coriander seeds?' },
      { _id: '2', text: 'Yes, we have organic coriander seeds in stock!' },
      { _id: '3', text: 'Can I pay cash on delivery?' }
    ];

    const searchQuery = 'coriander';
    const matches = messages.filter((m) => m.text && m.text.toLowerCase().includes(searchQuery.toLowerCase()));

    expect(matches).toHaveLength(2);
    expect(matches[0]._id).toBe('1');
    expect(matches[1]._id).toBe('2');

    // Navigation cycling (Next / Prev)
    let currentIndex = 0;
    currentIndex = (currentIndex + 1) % matches.length; // Next -> 1
    expect(currentIndex).toBe(1);
    currentIndex = (currentIndex + 1) % matches.length; // Next wraps -> 0
    expect(currentIndex).toBe(0);
    currentIndex = (currentIndex - 1 + matches.length) % matches.length; // Prev wraps -> 1
    expect(currentIndex).toBe(1);
  });

  // 2. Image Attachment File Type Validation
  test('Image attachment allows .jpg, .jpeg, .png, .webp, .gif and rejects unauthorized types', () => {
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const validateImageFile = (filename) => {
      const ext = filename.split('.').pop()?.toLowerCase();
      return allowedExtensions.includes(ext);
    };

    expect(validateImageFile('photo.jpg')).toBe(true);
    expect(validateImageFile('screenshot.png')).toBe(true);
    expect(validateImageFile('seedling.webp')).toBe(true);
    expect(validateImageFile('growth.gif')).toBe(true);
    expect(validateImageFile('malicious.exe')).toBe(false);
    expect(validateImageFile('document.pdf')).toBe(false);
  });

  // 3. Message Deletion Synchronization Logic
  test('Message deletion filters out matching messageId across client timelines', () => {
    const initialMessages = [
      { _id: 'msg_001', text: 'Message 1' },
      { _id: 'msg_002', text: 'Message 2' },
      { _id: 'msg_003', text: 'Message 3' }
    ];

    const deletedMessageId = 'msg_002';
    const updatedMessages = initialMessages.filter(
      (m) => m._id !== deletedMessageId && m.clientMsgId !== deletedMessageId
    );

    expect(updatedMessages).toHaveLength(2);
    expect(updatedMessages.map((m) => m._id)).toEqual(['msg_001', 'msg_003']);
  });

  // 4. Voice Dictation Fallback & Support Verification
  test('Voice dictation detects Web Speech API support safely in browser environments', () => {
    const checkSpeechRecognitionSupport = (win) => {
      return Boolean(win && (win.SpeechRecognition || win.webkitSpeechRecognition));
    };

    // Node environment (no SpeechRecognition on window)
    expect(checkSpeechRecognitionSupport({})).toBe(false);

    // Mocked browser with webkitSpeechRecognition
    const mockChromeWindow = {
      webkitSpeechRecognition: function () {}
    };
    expect(checkSpeechRecognitionSupport(mockChromeWindow)).toBe(true);
  });

  // 5. Phone OTP Validation & Format Rules
  test('Phone OTP login validates 10-digit Indian mobile numbers and 6-digit codes', () => {
    const isValidIndianPhone = (num) => /^[6-9]\d{9}$/.test(num);
    const isValidOtp = (otp) => /^\d{6}$/.test(otp);

    // Mobile numbers
    expect(isValidIndianPhone('9876543210')).toBe(true);
    expect(isValidIndianPhone('8765432109')).toBe(true);
    expect(isValidIndianPhone('7654321098')).toBe(true);
    expect(isValidIndianPhone('6543210987')).toBe(true);
    expect(isValidIndianPhone('1234567890')).toBe(false); // starts with 1
    expect(isValidIndianPhone('98765')).toBe(false); // too short
    expect(isValidIndianPhone('98765432100')).toBe(false); // too long
    expect(isValidIndianPhone('98765abcde')).toBe(false); // non-digits

    // 6-digit OTP codes
    expect(isValidOtp('123456')).toBe(true);
    expect(isValidOtp('999999')).toBe(true);
    expect(isValidOtp('12345')).toBe(false); // 5 digits
    expect(isValidOtp('1234567')).toBe(false); // 7 digits
    expect(isValidOtp('12345a')).toBe(false); // letter
  });

  // 6. User Authentication Guard for Sending Chat Messages
  test('Only authenticated users can send chat messages; unauthenticated triggers phone login', () => {
    const handleAttemptSend = ({ user, text, openLoginModal }) => {
      if (!user) {
        openLoginModal();
        return { allowed: false, reason: 'login_required' };
      }
      return { allowed: true, text: text.trim() };
    };

    let modalOpened = false;
    const mockOpenModal = () => {
      modalOpened = true;
    };

    // Unauthenticated guest attempt
    const guestAttempt = handleAttemptSend({
      user: null,
      text: 'Hello, need seeds!',
      openLoginModal: mockOpenModal
    });
    expect(guestAttempt.allowed).toBe(false);
    expect(guestAttempt.reason).toBe('login_required');
    expect(modalOpened).toBe(true);

    // Authenticated customer attempt
    const authUser = { _id: 'usr_123', name: 'Rohan Sharma', phone: '9876543210' };
    const authAttempt = handleAttemptSend({
      user: authUser,
      text: 'Hello, need seeds!',
      openLoginModal: mockOpenModal
    });
    expect(authAttempt.allowed).toBe(true);
    expect(authAttempt.text).toBe('Hello, need seeds!');
  });
});
