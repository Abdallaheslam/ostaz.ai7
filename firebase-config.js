////////////////////////////////////////////////////////////////
firebase-config.js
// firebase-config.js - محمي وآمن
const firebaseConfig = {
  apiKey: "AIzaSyAX2wKpYXUYmEA-Yn-W88BoMbzbD24HlEE",
  authDomain: "supermarket-3aboda.firebaseapp.com",
  projectId: "supermarket-3aboda",
  storageBucket: "supermarket-3aboda.firebasestorage.app",
  messagingSenderId: "451841595000",
  appId: "1:451841595000:web:69ed544e1692ff09947f8d",
  measurementId: "G-SEJZSP24P1"
};

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig };
}

// Export for browser
if (typeof window !== 'undefined') {
  window.firebaseConfig = firebaseConfig;
}