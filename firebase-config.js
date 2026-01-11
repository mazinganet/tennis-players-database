/* ========================================
   FIREBASE CONFIGURATION
   ======================================== */

const firebaseConfig = {
    apiKey: "AIzaSyDvl8I3upqDadZ2RnNQ5erotqH7lxW41wA",
    authDomain: "tennis-players-database.firebaseapp.com",
    databaseURL: "https://tennis-players-database-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "tennis-players-database",
    storageBucket: "tennis-players-database.firebasestorage.app",
    messagingSenderId: "818570520316",
    appId: "1:818570520316:web:6ffdc82c61ff27bbb81979",
    measurementId: "G-EENWFKX9PL"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get database reference
const database = firebase.database();

console.log('🔥 Firebase initialized');

