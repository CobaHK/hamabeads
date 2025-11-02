import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// ATENÇÃO: Substitua este objeto pela configuração do seu projeto Firebase.
// Você pode encontrar esses dados no console do Firebase:
// Configurações do projeto > Geral > Seus apps > Configuração do SDK
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error(
    "Erro ao inicializar o Firebase. Verifique se o objeto 'firebaseConfig' em 'firebase/config.ts' está preenchido corretamente.",
    error
  );
  // Cria objetos dummy para evitar que o app quebre
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
}

export { app, auth, db };
