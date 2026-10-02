import { initializeApp } from 'firebase/app'
import { initializeFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseApp = initializeApp(firebaseConfig)
// Varios campos opcionales del modelo (imagenUrl, fotoUrl, km...) llegan como `undefined` cuando no
// aplican — Firestore los rechaza por defecto; con esto los trata igual que lo hacía JSON/localStorage.
export const firestore = initializeFirestore(firebaseApp, { ignoreUndefinedProperties: true })
export const auth = getAuth(firebaseApp)

/** El acceso real a la app lo controla la pantalla de contraseña compartida; esta sesión anónima
 * solo existe para que Firestore pueda exigir "usuario autenticado" en sus reglas de seguridad. */
export function ensureSignedIn(): Promise<void> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe()
        if (user) {
          resolve()
        } else {
          signInAnonymously(auth).then(() => resolve()).catch(reject)
        }
      },
      reject,
    )
  })
}
