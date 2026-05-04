import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Rocket } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'founder' | 'mentor' | 'admin'>('founder');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(collection(db, 'users'), user.uid), {
        email: user.email,
        role,
        createdAt: new Date().toISOString(),
      });

      navigate(`/${role}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 transition"
        >
          
        
        </button>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-4">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl mb-2 text-black">Create Account</h1>
            <p className="text-gray-600">Start your journey with EmpowerHub</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
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
              <label className="block text-sm mb-2 text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
className="w-full pl-11 pr-4 py-3 border border-gray-300 bg-white text-black rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"                  placeholder="Create a password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-700">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
className="w-full pl-11 pr-4 py-3 border border-gray-300 bg-white text-black rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-700">I am a</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('founder')}
                  className={`py-3 px-4 rounded-xl border-2 transition ${
                    role === 'founder'
                      ? 'border-purple-600 bg-gradient-to-br from-purple-50 to-pink-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Founder
                </button>
                <button
                  type="button"
                  onClick={() => setRole('mentor')}
                  className={`py-3 px-4 rounded-xl border-2 transition ${
                    role === 'mentor'
                      ? 'border-purple-600 bg-gradient-to-br from-purple-50 to-pink-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Mentor
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-3 px-4 rounded-xl border-2 transition ${
                    role === 'admin'
                      ? 'border-purple-600 bg-gradient-to-br from-purple-50 to-pink-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            Already have an account?{' '}
            <Link to="/signin" className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:opacity-80">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div> 
    </div>
  );
}