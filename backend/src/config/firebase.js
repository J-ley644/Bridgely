
import {
  initializeApp,
  cert,
  getApps,
} from "firebase-admin/app";

import { getAuth } from "firebase-admin/auth";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseApp;

const hasEnvironmentCredentials =
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

if (hasEnvironmentCredentials) {
  /*
   * Production / Render
   *
   * Firebase credentials are loaded from environment
   * variables instead of a local service-account.json file.
   */
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(
      /\\n/g,
      "\n"
    ),
  };

  firebaseApp =
    getApps().length === 0
      ? initializeApp({
          credential: cert(serviceAccount),
        })
      : getApps()[0];
} else {
  /*
   * Local development
   *
   * Continue using the existing service-account.json
   * when Firebase environment variables are not configured.
   */
  const serviceAccountPath = path.resolve(
    __dirname,
    "../../firebase/service-account.json"
  );

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      "Firebase credentials are not configured. " +
        "Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, " +
        "and FIREBASE_PRIVATE_KEY."
    );
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8")
  );

  firebaseApp =
    getApps().length === 0
      ? initializeApp({
          credential: cert(serviceAccount),
        })
      : getApps()[0];
}

export const firebaseAuth = getAuth(firebaseApp);

export default firebaseApp;

