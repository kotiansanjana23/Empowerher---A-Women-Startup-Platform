import { collection, getDocs } from "firebase/firestore";

import { db } from "../../../../firebase";

export const getDashboardStats = async () => {
  const usersSnapshot = await getDocs(collection(db, "users"));

  const founders = usersSnapshot.docs.filter(
    (doc) => doc.data().role === "founder",
  );

  const mentors = usersSnapshot.docs.filter(
    (doc) => doc.data().role === "mentor",
  );

  return {
    totalUsers: usersSnapshot.size,
    totalFounders: founders.length,
    totalMentors: mentors.length,
  };
};
