import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  GithubAuthProvider
} from 'firebase/auth';
import { auth } from '../firebase';

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (providerName: 'google' | 'github') => {
    setError(null);
    setIsLoading(true);
    try {
      const provider = providerName === 'google' 
        ? new GoogleAuthProvider() 
        : new GithubAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      setError(err.message || 'OAuth Sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[99999] px-4">
      <div className="bg-[#0c1322] border border-[#2e3545] rounded-2xl p-8 max-w-md w-full relative shadow-[0_0_50px_rgba(124,58,237,0.15)]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#958da1] hover:text-white"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 className="text-3xl font-bold font-headline text-[#d2bbff] text-center mb-2">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-xs text-[#958da1] text-center mb-6">
          {isSignUp ? 'Sign up to start analyzing candidate repos' : 'Log in to continue using PersonaProbe'}
        </p>

        {error && (
          <div className="bg-[#410002] border border-[#ffb4ab] text-[#ffdad6] p-3 rounded-lg text-xs mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-[#958da1] mb-1.5">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full bg-[#070e1d] border border-[#2e3545] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#7c3aed] text-sm"
              placeholder="name@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#958da1] mb-1.5">Password</label>
            <input 
              type="password" 
              required
              className="w-full bg-[#070e1d] border border-[#2e3545] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#7c3aed] text-sm"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#7c3aed] to-[#d2bbff] text-[#3f008e] font-headline font-bold py-3.5 rounded-lg text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Signing In...' : isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#2e3545]"></div></div>
          <span className="relative bg-[#0c1322] px-3 text-xs text-[#958da1] uppercase tracking-wider font-mono">Or Continue With</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleOAuth('google')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-[#070e1d] border border-[#2e3545] text-white rounded-lg py-2.5 text-xs font-bold hover:bg-[#141b2b] transition-all disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
            Google
          </button>
          <button
            onClick={() => handleOAuth('github')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-[#070e1d] border border-[#2e3545] text-white rounded-lg py-2.5 text-xs font-bold hover:bg-[#141b2b] transition-all disabled:opacity-50"
          >
            <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub" className="w-4 h-4 invert" />
            GitHub
          </button>
        </div>

        <p className="text-center text-xs text-[#958da1] mt-6">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button 
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#d2bbff] hover:underline font-bold"
          >
            {isSignUp ? 'Log In' : 'Sign Up Free'}
          </button>
        </p>

      </div>
    </div>
  );
}
