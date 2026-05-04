import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Rocket } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"founder" | "mentor" | "admin">("founder");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        setError("User profile not found");
        setLoading(false);
        return;
      }

      const userData = userDocSnap.data();
      const userRole = userData?.role;

      const routeMap: Record<string, string> = {
        founder: "/founder",
        mentor: "/mentor",
        admin: "/admin",
      };

      if (routeMap[userRole]) {
        navigate(routeMap[userRole]);
      } else {
        setError("Invalid user role");
      }
    } catch (err: any) {
      setError(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 transition"
        >
         
          
        </button>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-4">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl mb-2 text-black">Welcome Back</h1>
            <p className="text-gray-600">
              Continue your journey with EmpowerHub
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm mb-2 text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
className="w-full pl-11 pr-4 py-3 border border-gray-300 bg-white text-black rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
className="w-full pl-11 pr-4 py-3 border border-gray-300 bg-white text-black rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:opacity-80"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
