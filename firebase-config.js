/* ========================================
   FIREBASE CONFIGURATION
   ======================================== 
   
   ISTRUZIONI:
   1. Vai su https://console.firebase.google.com/
   2. Crea un nuovo progetto o selezionane uno esistente
   3. Vai su ⚙️ Project Settings → Your apps → Aggiungi app web
   4. Copia i valori e sostituiscili qui sotto
   5. Vai su Realtime Database → Crea database → Avvia in modalità test
   
*/

const firebaseConfig = {
    apiKey: "LA_TUA_API_KEY",
    authDomain: "IL_TUO_PROGETTO.firebaseapp.com",
    databaseURL: "https://IL_TUO_PROGETTO-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "IL_TUO_PROGETTO",
    storageBucket: "IL_TUO_PROGETTO.appspot.com",
    messagingSenderId: "IL_TUO_SENDER_ID",
    appId: "IL_TUO_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get database reference
const database = firebase.database();

console.log('🔥 Firebase initialized');
