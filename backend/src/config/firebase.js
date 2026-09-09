import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.resolve(
  __dirname,
  "../../firebase/service-account.json"
);

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf8")
);

const firebaseApp =
  getApps().length === 0
    ? initializeApp({
        credential: cert(serviceAccount),
      })
    : getApps()[0];

export const firebaseAuth = getAuth(firebaseApp);
export default firebaseApp;