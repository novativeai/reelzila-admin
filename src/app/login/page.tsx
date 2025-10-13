"use client";

import { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Step 1: Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        // Step 2: Authorize - Check for admin status in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().isAdmin === true) {
          // Step 3: Success! User is authenticated AND authorized. Redirect to dashboard.
          router.push('/');
        } else {
          // User is authenticated but NOT an admin.
          // Log them out immediately and show an error.
          await signOut(auth);
          setError('Access Denied. This account does not have administrator privileges.');
          setIsLoading(false);
        }
      } else {
        // This case should rarely happen, but it's good practice to handle it.
        throw new Error("Authentication succeeded but no user object was returned.");
      }

    } catch (error) {
      // This will catch incorrect passwords or other Firebase auth errors.
      console.error("Sign-in error:", error);
      setError('Failed to sign in. Please check your email and password.');
      setIsLoading(false);
    }
  };

  const inputStyles = "bg-transparent border-0 border-b border-neutral-700 rounded-none px-0 focus-visible:ring-0";

  return (
    <div className="bg-black text-white min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-8">
        <h1 className="text-5xl font-extrabold tracking-tighter mb-8 text-center">Admin Login</h1>
        <form onSubmit={handleSignIn} className="space-y-8">
          <Input 
            placeholder="Email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className={inputStyles} 
            disabled={isLoading} 
            required
          />
          <Input 
            placeholder="Password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className={inputStyles} 
            disabled={isLoading} 
            required
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button type="submit" className="w-full bg-yellow-300 text-black font-bold hover:bg-yellow-400" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}