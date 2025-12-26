// Firebase Admin SDK Configuration
// Used for server-side authentication verification and Firestore operations

import admin from "firebase-admin";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin with service account
// The service account key should be stored as FIREBASE_SERVICE_ACCOUNT_KEY environment variable
let serviceAccount: any;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    serviceAccount = JSON.parse(serviceAccountKey);
  }
} catch (error) {
  console.error("Error parsing Firebase service account:", error);
}

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  } else {
    // Fallback: try to initialize with default credentials
    // This works in some environments like Google Cloud
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    if (!projectId) {
      throw new Error("Firebase service account or VITE_FIREBASE_PROJECT_ID must be configured");
    }
    console.warn("Firebase service account not found, attempting default initialization");
    admin.initializeApp({
      projectId,
    });
  }
}

// Export Firebase Admin instances
export const adminAuth = getAuth();
export const adminDb = getFirestore();
export { FieldValue, Timestamp };

// Verify Firebase ID token
export async function verifyIdToken(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying ID token:", error);
    throw error;
  }
}

// Get user by UID
export async function getFirebaseUser(uid: string) {
  try {
    const userRecord = await adminAuth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
}

export default admin;
