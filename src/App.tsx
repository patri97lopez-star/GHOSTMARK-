import React, { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Dashboard from './components/Dashboard';
import PublicPortal from './components/PublicPortal';
import { Ghost, Sparkles, LogIn, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Simple routing for the Public Portal
  const urlParams = new URLSearchParams(window.location.search);
  const portalLeadId = urlParams.get('lead');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#141414] flex flex-col items-center justify-center text-white font-mono uppercase tracking-[0.2em] text-[10px]">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        Initializing Ghost Protocol
      </div>
    );
  }

  if (portalLeadId) {
    return <PublicPortal prospectId={portalLeadId} />;
  }

  if (!user) {
    return (
      <div className="h-screen bg-[#141414] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Abstract Background Accents */}
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[60%] bg-[#FF4444] rounded-full blur-[120px] opacity-10"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[60%] bg-[#00FF00] rounded-full blur-[120px] opacity-10"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full text-center z-10"
        >
          <div className="inline-flex items-center gap-3 mb-8 px-4 py-2 rounded-full border border-white/10 bg-white/5">
            <Ghost className="w-5 h-5" />
            <span className="text-[10px] font-mono tracking-widest uppercase">Automatización de Marketing Sigiloso</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-serif italic mb-8 leading-[0.9]">
            GhostMark <span className="text-[#8E9299]">AI</span>
          </h1>
          
          <p className="text-[#8E9299] text-xl mb-12 max-w-md mx-auto leading-relaxed">
            Enriquecimiento automático, ganchos visuales y despliegue de secuencias personalizadas para leads de alto valor.
          </p>

          <button
            onClick={handleLogin}
            className="group relative inline-flex items-center gap-3 px-12 py-5 bg-white text-black rounded-2xl font-bold text-lg hover:bg-[#F5F5F0] transition-all"
          >
            <LogIn className="w-5 h-5" />
            Iniciar sesión con Google
            <div className="absolute -inset-1 rounded-2xl bg-white/20 blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
          
          <div className="mt-12 flex items-center justify-center gap-8 grayscale opacity-40">
             <div className="flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                <span className="text-[10px] uppercase font-mono tracking-tighter">Integración Gemini Pro</span>
             </div>
             <div className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                <span className="text-[10px] uppercase font-mono tracking-tighter">Capa de Auditoría Humana</span>
             </div>
          </div>
        </motion.div>
        
        <div className="absolute bottom-10 left-10 text-[10px] font-mono text-[#8E9299] uppercase tracking-widest">
           Estado del Sistema: [Operativo]
        </div>
        <div className="absolute bottom-10 right-10 text-[10px] font-mono text-[#8E9299] uppercase tracking-widest">
           Versión 1.0.4 - Alpha
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

function Shield(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>;
}
