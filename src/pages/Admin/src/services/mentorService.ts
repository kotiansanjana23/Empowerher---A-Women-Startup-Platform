import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../../../firebase";

// GET MENTORS
export const getMentors = async () => {
  const q = query(collection(db, "users"), where("role", "==", "mentor"));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// VERIFY MENTOR
export const verifyMentor = async (id: string) => {
  const mentorRef = doc(db, "users", id);

  await updateDoc(mentorRef, {
    verified: true,
  });
};
