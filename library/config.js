// Firebase web settings for the BWN Firebase project "Basheera Wa Nazeera" (basheera-wa-nazeera).
// These are public identifiers, not secrets (Firestore rules guard the data).
// Empty apiKey = demo mode: the page runs on the sample posts in sample.js.
export const firebaseConfig = {
  apiKey: "AIzaSyAGj5Vf3dyxRcBeAVEt8q54zLcSdePoB0E",
  authDomain: "basheera-wa-nazeera.firebaseapp.com",
  projectId: "basheera-wa-nazeera",
  storageBucket: "basheera-wa-nazeera.firebasestorage.app",
  messagingSenderId: "688767831792",
  appId: "1:688767831792:web:415c1127bcc03c24b47c35",
};

// Who may open My view is set only in the database rules (firestore.rules,
// kept in the BWN repo, not on the public site).

// Siyagah's shared Mapping My Journey copy (BWN J27 Stage 2, Siyagah R1). Public web identifiers from the
// Firebase console of Siyagah's project, and the owner's Siyagah notebook id: given by the owner. Until then
// the Map reads the folders from mappingmyjourney.com.
export const siyagah = {
  config: { apiKey: "AIzaSyBxrQ5uNrerOAFiCmUbUkUM8tjMpjKygsA", authDomain: "aaas-notebook.firebaseapp.com", projectId: "aaas-notebook", storageBucket: "aaas-notebook.firebasestorage.app", messagingSenderId: "32292493079" },
  notebook: "nb-mriuc27o-f44402",
};
