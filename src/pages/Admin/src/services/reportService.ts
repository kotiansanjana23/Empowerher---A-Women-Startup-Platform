import { collection, getDocs } from "firebase/firestore";

import { db } from "../../../../firebase";

export const getReports = async () => {
  const snapshot = await getDocs(collection(db, "reports"));

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
