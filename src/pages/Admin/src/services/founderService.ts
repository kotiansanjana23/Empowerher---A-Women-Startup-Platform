import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../../../firebase";

// GET ALL FOUNDERS
export const getFounders = async () => {
  const q = query(collection(db, "users"), where("role", "==", "founder"));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// SUSPEND FOUNDER
export const suspendFounder = async (id: string) => {
  const userRef = doc(db, "users", id);

  await updateDoc(userRef, {
    suspended: true,
  });
};
