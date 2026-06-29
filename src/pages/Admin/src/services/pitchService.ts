import { collection, getDocs } from "firebase/firestore";

import { db } from "../../../../firebase";

export const getPitches = async () => {
  const snapshot = await getDocs(collection(db, "pitches"));

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
