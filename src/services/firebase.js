import { initializeApp } from "firebase/app";
import { getAuth, signOut, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock_key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock_domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock_project_id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock_bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "mock_sender_id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "mock_app_id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const setupRecaptcha = (container) => {
  if (!container) {
    throw new Error('reCAPTCHA container not found.');
  }

  if (window.recaptchaVerifier?.container === container) {
    return window.recaptchaVerifier;
  }

  if (window.recaptchaVerifier?.clear) {
    window.recaptchaVerifier.clear();
    delete window.recaptchaVerifier;
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, container, {
    size: 'invisible',
    callback: (response) => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      if (window.grecaptcha?.reset && window.recaptchaVerifier?.widgetId != null) {
        window.grecaptcha.reset(window.recaptchaVerifier.widgetId);
      }
    }
  });

  window.recaptchaVerifier.container = container;
  return window.recaptchaVerifier;
};

export const sendPhoneOTP = (phoneNumber, appVerifier) => {
  return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
};

export const logoutUser = () => {
  return signOut(auth);
};
