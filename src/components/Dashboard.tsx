import React, { useState, useEffect } from 'react';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, doc, setDoc } from 'firebase/firestore';
import { Prospect } from '../types';
import { performScraping } from '../services/geminiService';
import ProspectCard from './ProspectCard';
import { Search, Plus, Loader2, Target, BarChart3, TrendingUp, Users, ArrowLeft, Sparkles, X, Mail, Phone, ExternalLink, Info, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard({ onBack }: { onBack: () => void }) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'leads' | 'scraping' | 'campaigns' | 'alerts' | 'settings' | 'protocol'>('leads');
  const [scrapingQuery, setScrapingQuery] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedResults, setScrapedResults] = useState<{name: string, url: string, sector: string, location: string, emails?: string[], phone?: string, description?: string, socialLinks?: {platform: string, url: string}[]}[]>([]);
  const [selectedScrapedResult, setSelectedScrapedResult] = useState<{name: string, url: string, sector: string, location: string, emails?: string[], phone?: string, description?: string, socialLinks?: {platform: string, url: string}[]} | null>(null);

  const handleRunScraping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapingQuery) return;
    setIsScraping(true);
    setScrapedResults([]);
    try {
      const results = await performScraping(scrapingQuery);
      setScrapedResults(results);
    } catch (error) {
      console.error(error);
      alert('Error en Scraping IA');
    } finally {
      setIsScraping(false);
    }
  };

  const handleAddScrapedProspect = async (url: string) => {
     try {
       await addDoc(collection(db, 'prospects'), {
         url,
         ownerId: auth.currentUser?.uid || 'demo-user',
         status: 'pending',
         createdAt: serverTimestamp(),
         updatedAt: serverTimestamp(),
       });
       alert('Prospecto añadido al Protocolo');
     } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'prospects');
     }
  };
  const [settings, setSettings] = useState({
    calendlyUrl: '',
    slackWebhook: '',
    whatsappNumber: '',
    brandVoice: 'Profesional, técnico, pero con empatía por el crecimiento del negocio.'
  });

  useEffect(() => {
    // Load settings
    const settingsRef = doc(db, 'userSettings', auth.currentUser?.uid || 'demo-user');
    const unsubSettings = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as any);
      }
    }, (error) => {
      console.warn("Settings not initialized yet or permission denied. This is normal if it is your first time.");
    });

    const q = query(
      collection(db, 'prospects'),
      where('ownerId', '==', auth.currentUser?.uid || 'demo-user'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prospect));
      setProspects(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'prospects');
    });

    return () => {
      unsubSettings();
      unsubscribe();
    };
  }, []);

  const handleAddProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'prospects'), {
        url: newUrl,
        ownerId: auth.currentUser?.uid || 'demo-user',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewUrl('');
      
      // We don't call startAnalysis directly here because Dashboard is a large component.
      // Instead, we'll let ProspectCard handle its own "mount" if it's pending.
      // Or we can add an 'analyzeOnMount' flag.
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'prospects');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportLossDataToJSON = () => {
    const data = prospects.map(p => ({
      id: p.id,
      companyName: p.companyName || 'Pendiente',
      url: p.url,
      opportunityLoss: p.opportunityLoss || 0,
      status: p.status,
      lastUpdated: p.updatedAt?.toDate ? p.updatedAt.toDate().toISOString() : new Date().toISOString()
    }));
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `opportunity-loss-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const totalOpportunityLoss = prospects.reduce((acc, p) => acc + (p.opportunityLoss || 0), 0);

  return (
    <div className="min-h-screen bg-[#F5F5F0] pb-20">
      {/* Header Stat Bar */}
      <div className="bg-white border-b border-[#E5E5E0] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                className="mr-2 p-2 rounded-full hover:bg-[#F5F5F0] transition-colors"
                title="Volver al inicio"
              >
                <ArrowLeft className="w-5 h-5 text-[#8E9299]" />
              </button>
              {activeTab !== 'leads' && (
                <button 
                  onClick={() => setActiveTab('leads')}
                  className="mr-1 p-2 hover:bg-[#F5F5F0] rounded-full transition-colors group"
                  aria-label="Volver"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </button>
              )}
              <Target className="w-6 h-6 text-[#141414]" />
              <h1 className="text-xl font-medium text-[#141414]">GhostMark AI</h1>
            </div>
            
            <nav className="hidden md:flex items-center gap-4 bg-[#F5F5F0] p-1 rounded-lg">
               <button 
                onClick={() => setActiveTab('leads')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'leads' ? 'bg-white shadow-sm text-[#141414]' : 'text-[#8E9299] hover:text-[#141414]'}`}
               >Prospectos</button>
               <button 
                onClick={() => setActiveTab('scraping')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'scraping' ? 'bg-white shadow-sm text-[#141414]' : 'text-[#8E9299] hover:text-[#141414]'}`}
               >Scraping</button>
               <button 
                onClick={() => setActiveTab('campaigns')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'campaigns' ? 'bg-white shadow-sm text-[#141414]' : 'text-[#8E9299] hover:text-[#141414]'}`}
               >Campañas</button>
               <button 
                onClick={() => setActiveTab('alerts')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'alerts' ? 'bg-white shadow-sm text-[#141414]' : 'text-[#8E9299] hover:text-[#141414]'}`}
               >Alertas</button>
               <button 
                onClick={() => setActiveTab('protocol')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'protocol' ? 'bg-white shadow-sm text-[#141414]' : 'text-[#8E9299] hover:text-[#141414]'}`}
               >Protocolo MCP</button>
               <button 
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'settings' ? 'bg-white shadow-sm text-[#141414]' : 'text-[#8E9299] hover:text-[#141414]'}`}
               >Ajustes</button>
            </nav>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end group cursor-pointer" onClick={exportLossDataToJSON} title="Descargar como JSON">
              <span className="text-[10px] uppercase tracking-widest text-[#8E9299] flex items-center gap-1 group-hover:text-[#141414] transition-colors"><Download className="w-3 h-3"/> Pérdida de Oportunidad</span>
              <span className="text-lg font-mono font-medium text-[#FF4444] group-hover:text-red-500 transition-colors">${totalOpportunityLoss.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        {activeTab === 'leads' && (
          <>
            {/* URL Input Area */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-3 gap-6 mb-12"
            >
              <div className="md:col-span-2 bg-white rounded-2xl p-8 shadow-sm border border-[#E5E5E0]">
                <h2 className="text-2xl font-serif italic mb-2">Enriquecimiento Automatizado</h2>
                <p className="text-[#8E9299] text-sm mb-6">Ingresa una URL para activar scrapers y selectores lógicos.</p>
                
                <form onSubmit={handleAddProspect} className="relative group">
                  <input
                    type="url"
                    required
                    placeholder="https://nuevo-negocio-lead.com"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full h-14 pl-6 pr-32 bg-[#F5F5F0] rounded-xl border border-transparent focus:border-[#141414] focus:bg-white outline-none transition-all font-medium"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="absolute right-2 top-2 bottom-2 px-4 bg-[#141414] text-white rounded-lg hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Iniciar</span>
                  </button>
                </form>
              </div>

              <div className="bg-[#141414] rounded-2xl p-8 text-white flex flex-col justify-between border border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Target className="w-24 h-24" />
                </div>
                <div>
                  <h3 className="text-lg font-serif italic mb-1">Centro de Mando</h3>
                  <p className="text-xs text-white/60 mb-4">Gestión del Protocolo de 10 Pasos</p>
                </div>
                <button 
                  onClick={() => setActiveTab('protocol')}
                  className="w-full py-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#F5F5F0] transition-colors"
                >
                  Ver Protocolo Maestro
                </button>
              </div>
            </motion.div>

            {/* Active Prospect Grid */}
            <div className="space-y-12">
              {prospects.filter(p => !['sent', 'rejected'].includes(p.status)).length > 0 && (
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#8E9299] font-bold mb-6">Prospectos en Proceso</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                      {prospects.filter(p => !['sent', 'rejected'].includes(p.status)).map((prospect, idx) => (
                        <ProspectCard 
                          key={prospect.id} 
                          prospect={prospect} 
                          index={idx} 
                          brandVoice={settings.brandVoice}
                          calendlyUrl={settings.calendlyUrl}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {prospects.filter(p => ['sent', 'rejected'].includes(p.status)).length > 0 && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-px bg-[#E5E5E0] flex-1"></div>
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#8E9299] font-bold whitespace-nowrap">Historial de Acciones (Finalizados)</h3>
                    <div className="h-px bg-[#E5E5E0] flex-1"></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 opacity-75">
                    <AnimatePresence mode="popLayout">
                      {prospects.filter(p => ['sent', 'rejected'].includes(p.status)).map((prospect, idx) => (
                        <ProspectCard 
                          key={prospect.id} 
                          prospect={prospect} 
                          index={idx} 
                          brandVoice={settings.brandVoice}
                          calendlyUrl={settings.calendlyUrl}
                          isCompact={true}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {prospects.length === 0 && !loading && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#E5E5E0]">
                  <Loader2 className="w-10 h-10 text-[#E5E5E0] mx-auto mb-4" />
                  <p className="text-[#8E9299] text-sm">No hay prospectos activos. Inicia el protocolo arriba.</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'scraping' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-[#141414] text-white rounded-3xl p-10 border border-white/10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Search className="w-48 h-48" />
               </div>
               <div className="relative z-10 max-w-2xl">
                 <h2 className="text-3xl font-serif italic mb-4">Módulo de Scraping IA</h2>
                 <p className="text-white/60 mb-8">
                   Busca empresas por sector, localización o introduce una URL específica. 
                   La IA extraerá prospectos altamente cualificados directamente a tu base de datos (Phantombuster / Apify Simulation).
                 </p>
                 <form onSubmit={handleRunScraping} className="relative">
                   <div className="flex bg-white/10 p-1.5 rounded-2xl border border-white/20 focus-within:border-white/50 transition-colors backdrop-blur-md">
                     <div className="flex items-center justify-center pl-4 pr-2">
                        <Search className="w-5 h-5 text-white/50" />
                     </div>
                     <input
                       type="text"
                       required
                       placeholder="Ej: Restaurantes en Toledo, Clínicas dentales Madrid..."
                       value={scrapingQuery}
                       onChange={(e) => setScrapingQuery(e.target.value)}
                       className="w-full h-14 bg-transparent outline-none text-white placeholder:text-white/40"
                     />
                     <button
                       type="submit"
                       disabled={isScraping}
                       className="px-8 bg-white text-black font-bold rounded-xl hover:bg-[#F5F5F0] transition-colors disabled:opacity-50 flex items-center gap-2"
                     >
                       {isScraping ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Escanear Mercado</span>}
                     </button>
                   </div>
                 </form>
               </div>
            </div>

            {isScraping && (
              <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-[#E5E5E0]">
                 <Loader2 className="w-12 h-12 text-[#141414] animate-spin mx-auto mb-4" />
                 <h3 className="text-lg font-medium">Ejecutando Phantom Scraper...</h3>
                 <p className="text-sm text-[#8E9299]">Buscando entidades para: "{scrapingQuery}"</p>
              </div>
            )}

            {!isScraping && scrapedResults.length > 0 && (
              <div className="bg-white rounded-3xl p-8 border border-[#E5E5E0]">
                 <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xl font-medium">Resultados Encontrados ({scrapedResults.length})</h3>
                   <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] uppercase font-bold tracking-widest rounded-full">Scraping Completado</span>
                 </div>
                 
                 <div className="grid gap-4">
                   {scrapedResults.map((res, idx) => (
                     <div key={idx} className="flex flex-col md:flex-row items-center justify-between p-4 bg-[#F5F5F0] rounded-2xl border border-[#E5E5E0] hover:border-[#141414] transition-all gap-4">
                       <div className="flex-1 w-full cursor-pointer group" onClick={() => setSelectedScrapedResult(res)}>
                         <div className="flex items-center gap-3 mb-1">
                           <h4 className="font-bold text-lg group-hover:text-amber-600 transition-colors">{res.name}</h4>
                           <span className="text-[10px] px-2 py-0.5 bg-[#E5E5E0] text-[#8E9299] rounded uppercase font-mono">{res.sector}</span>
                         </div>
                         <div className="flex items-center gap-4 text-sm text-[#8E9299]">
                           <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {res.location}</span>
                           <span className="flex items-center gap-1 font-medium"><Info className="w-3.5 h-3.5" /> Ver detalles</span>
                         </div>
                       </div>
                       <div className="flex items-center gap-3 w-full md:w-auto">
                         <a href={res.url} target="_blank" rel="noopener noreferrer" className="p-3 bg-white border border-[#E5E5E0] text-[#141414] rounded-xl hover:bg-[#F5F5F0] transition-all">
                           <ExternalLink className="w-4 h-4" />
                         </a>
                         <button 
                           onClick={() => handleAddScrapedProspect(res.url)}
                           className="w-full md:w-auto px-6 py-3 bg-[#141414] text-white rounded-xl text-sm font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
                         >
                           <Plus className="w-4 h-4" /> Importar al Protocolo
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}
            
            <AnimatePresence>
              {selectedScrapedResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
                  onClick={() => setSelectedScrapedResult(null)}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative my-auto max-h-[90vh] flex flex-col"
                  >
                    <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 p-6 border-b border-[#E5E5E0] flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl font-serif italic text-[#141414] leading-tight">{selectedScrapedResult.name}</h2>
                          <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded uppercase font-mono font-bold">{selectedScrapedResult.sector}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#8E9299]">
                          <span className="flex items-center gap-1"><Target className="w-4 h-4" /> {selectedScrapedResult.location}</span>
                          <a href={selectedScrapedResult.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[#141414] transition-colors"><ExternalLink className="w-4 h-4" /> {selectedScrapedResult.url}</a>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedScrapedResult(null)}
                        className="p-2 bg-[#F5F5F0] hover:bg-[#E5E5E0] rounded-full transition-colors shrink-0"
                      >
                        <X className="w-5 h-5 text-[#8E9299]" />
                      </button>
                    </div>

                    <div className="p-6 md:p-8 space-y-8 overflow-y-auto">
                      {selectedScrapedResult.description && (
                        <div>
                          <h3 className="text-xs uppercase tracking-widest text-[#8E9299] font-bold mb-3 flex items-center gap-2">
                            <Info className="w-4 h-4" /> Sobre la Empresa
                          </h3>
                          <p className="text-[#141414] leading-relaxed text-sm bg-[#F5F5F0] p-4 rounded-xl border border-[#E5E5E0]">
                            {selectedScrapedResult.description}
                          </p>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-8">
                        <div>
                          <h3 className="text-xs uppercase tracking-widest text-[#8E9299] font-bold mb-4 flex items-center gap-2">
                            <Mail className="w-4 h-4" /> Contactos Detectados
                          </h3>
                          {selectedScrapedResult.emails && selectedScrapedResult.emails.length > 0 ? (
                            <ul className="space-y-3">
                              {selectedScrapedResult.emails.map((email, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-sm text-[#141414] p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                                  <div className="p-1.5 bg-white rounded-md shadow-sm"><Mail className="w-4 h-4 text-blue-500" /></div>
                                  <a href={`mailto:${email}`} className="hover:underline font-medium">{email}</a>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-sm text-[#8E9299] p-4 bg-[#F5F5F0] rounded-xl border border-dashed border-[#E5E5E0]">
                              No se detectaron correos públicos.
                            </div>
                          )}
                        </div>

                        <div>
                          <h3 className="text-xs uppercase tracking-widest text-[#8E9299] font-bold mb-4 flex items-center gap-2">
                            <Phone className="w-4 h-4" /> Teléfono
                          </h3>
                          {selectedScrapedResult.phone ? (
                            <div className="flex items-center gap-3 text-sm text-[#141414] p-3 bg-green-50/50 border border-green-100 rounded-xl">
                              <div className="p-1.5 bg-white rounded-md shadow-sm"><Phone className="w-4 h-4 text-green-600" /></div>
                              <a href={`tel:${selectedScrapedResult.phone.replace(/\D/g,'')}`} className="hover:underline font-medium">{selectedScrapedResult.phone}</a>
                            </div>
                          ) : (
                            <div className="text-sm text-[#8E9299] p-4 bg-[#F5F5F0] rounded-xl border border-dashed border-[#E5E5E0]">
                              No se detectó teléfono.
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedScrapedResult.socialLinks && selectedScrapedResult.socialLinks.length > 0 && (
                        <div>
                          <h3 className="text-xs uppercase tracking-widest text-[#8E9299] font-bold mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Redes Sociales
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {selectedScrapedResult.socialLinks.map((social, idx) => (
                              <a 
                                key={idx} 
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 text-violet-800 hover:bg-violet-100 rounded-xl font-medium text-sm transition-colors border border-violet-100"
                              >
                                {social.platform} <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 bg-[#F5F5F0] border-t border-[#E5E5E0] flex justify-end gap-4 shrink-0">
                      <button 
                         onClick={() => setSelectedScrapedResult(null)}
                         className="px-6 py-3 bg-white text-[#141414] rounded-xl text-sm font-bold border border-[#E5E5E0] hover:bg-[#F5F5F0] transition-colors"
                       >
                         Cerrar
                       </button>
                      <button 
                         onClick={() => {
                           handleAddScrapedProspect(selectedScrapedResult.url);
                           setSelectedScrapedResult(null);
                         }}
                         className="px-6 py-3 bg-[#141414] text-white rounded-xl text-sm font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
                       >
                         <Plus className="w-4 h-4" /> Importar al Protocolo
                       </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-6">Segmentos de Campaña</h2>
            {prospects.filter(p => p.campaignSegment).length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-[#E5E5E0] text-center">
                <Users className="w-12 h-12 text-[#E5E5E0] mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Segmentos de Campaña</h3>
                <p className="text-[#8E9299] max-w-sm mx-auto">Tus leads se organizarán automáticamente por segmento cuando insertes un prospecto y se analice.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from(new Set(prospects.filter(p => p.campaignSegment).map(p => p.campaignSegment))).map((segment, idx) => {
                  const segmentProspects = prospects.filter(p => p.campaignSegment === segment);
                  const totalLoss = segmentProspects.reduce((sum, p) => sum + (p.opportunityLoss || 0), 0);
                  
                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl p-6 border border-[#E5E5E0] flex flex-col h-full hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-[#8E9299]" />
                          <h3 className="font-semibold text-[#141414]">{segment}</h3>
                        </div>
                        <span className="text-xs font-medium px-2.5 py-1 bg-[#F5F5F0] text-[#8E9299] rounded-full">
                          {segmentProspects.length} leads
                        </span>
                      </div>
                      
                      <div className="space-y-3 mb-6 flex-grow">
                        {segmentProspects.slice(0, 3).map(p => (
                          <div key={p.id} className="text-sm border-b border-[#E5E5E0] pb-2 last:border-0 last:pb-0">
                            <span className="font-medium">{p.companyName || p.url}</span>
                            {p.opportunityLoss ? (
                              <span className="block text-xs text-[#FF4444]">+${p.opportunityLoss.toLocaleString()}</span>
                            ) : null}
                          </div>
                        ))}
                        {segmentProspects.length > 3 && (
                          <div className="text-xs text-[#8E9299] pt-2">
                            + {segmentProspects.length - 3} leads adicionales
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-4 border-t border-[#E5E5E0] flex items-center justify-between">
                        <div className="text-xs text-[#8E9299]">Valor del Segmento</div>
                        <div className="text-sm font-mono font-bold text-[#FF4444]">${totalLoss.toLocaleString()}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-[#E5E5E0]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                   <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-medium">Webhooks para Leads de 5 Estrellas</h3>
              </div>
              <p className="text-sm text-[#8E9299] mb-6">Recibe notificaciones instantáneas en Slack cuando un lead tenga una "Pérdida de Oportunidad" {">"} $100k.</p>
              <div className="space-y-4">
                <input 
                  placeholder="URL del Webhook de Slack" 
                  value={settings.slackWebhook}
                  onChange={(e) => setSettings({...settings, slackWebhook: e.target.value})}
                  className="w-full p-3 bg-[#F5F5F0] rounded-lg border border-transparent focus:border-[#141414] outline-none text-sm" 
                />
                <button 
                  onClick={async () => {
                    await setDoc(doc(db, 'userSettings', auth.currentUser?.uid || 'demo-user'), settings, { merge: true });
                    alert('Integración guardada!');
                  }}
                  className="w-full py-3 bg-[#141414] text-white rounded-lg text-sm font-medium"
                >Guardar Integración</button>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-[#141414] to-black rounded-2xl p-8 text-white">
              <BarChart3 className="w-8 h-8 mb-4 text-[#FFCC00]" />
              <h3 className="text-xl font-medium mb-2">Algoritmo de ROI</h3>
              <p className="text-white/60 text-sm mb-6">Nuestro algoritmo analiza el sentimiento de los competidores y la eficiencia del marketing para calcular la brecha.</p>
              <div className="p-4 bg-white/10 rounded-xl font-mono text-[10px] space-y-1">
                 <p className="text-green-400">CALIDAD_LEAD = (SENTIMIENTO * MULT_SECTOR) / GASTO_ADS</p>
                 <p className="text-[#FF4444]">PÉRDIDA_OPORTUNIDAD = PROMEDIO_MERCADO - REVENUE_ACTUAL</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'protocol' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <header className="relative text-center mb-16">
               <button 
                 onClick={() => setActiveTab('leads')}
                 className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8E9299] hover:text-[#141414] transition-colors"
               >
                 <ArrowLeft className="w-4 h-4" />
                 Panel
               </button>
               <h2 className="text-4xl font-serif italic mb-2">Protocolo GhostMark AI</h2>
               <p className="text-[#8E9299]">Master Control Panel - Ecosistema de Automatización Total (10 Puntos)</p>
            </header>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Fase 1: Inteligencia Generativa */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#141414] text-white flex items-center justify-center text-xs font-bold font-mono">01</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#8E9299] font-bold">IA Generativa ("Wow")</div>
                </div>
                <div className="space-y-2">
                  <button 
                    onClick={() => setActiveTab('leads')}
                    className="w-full text-left p-4 bg-white border border-[#E5E5E0] rounded-2xl hover:border-[#141414] transition-all"
                  >
                    <div className="text-xs font-bold mb-1">Primeras Impresiones</div>
                    <p className="text-[10px] text-[#8E9299]">Generación de 3 conceptos de logo instantáneos.</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('leads')}
                    className="w-full text-left p-4 bg-white border border-[#E5E5E0] rounded-2xl hover:border-[#141414] transition-all"
                  >
                    <div className="text-xs font-bold mb-1">Análisis de Sentimiento</div>
                    <p className="text-[10px] text-[#8E9299]">Scrapping de reseñas y fallos de competencia.</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('leads')}
                    className="w-full text-left p-4 bg-gradient-to-br from-[#141414] to-[#2A2A2A] text-white rounded-2xl group overflow-hidden relative"
                  >
                    <div className="relative z-10">
                      <div className="text-xs font-bold mb-1">Video-Pitch (HeyGen)</div>
                      <p className="text-[10px] opacity-60">Avatar IA llamando al dueño por su nombre.</p>
                    </div>
                    <Sparkles className="absolute top-2 right-2 w-4 h-4 text-[#FFCC00] opacity-50" />
                  </button>
                </div>
              </div>

              {/* Fase 2: Conversión y Cierre */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold font-mono">02</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#8E9299] font-bold">Conversión & Cierre</div>
                </div>
                <div className="space-y-2">
                  <button 
                    onClick={() => setActiveTab('leads')}
                    className="w-full text-left p-4 bg-white border border-[#E5E5E0] rounded-2xl hover:border-[#141414] transition-all"
                  >
                    <div className="text-xs font-bold mb-1">Pérdida de Oportunidad</div>
                    <p className="text-[10px] text-[#8E9299]">Widget dinámico de cálculo de ROI perdido.</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('settings')}
                    className="w-full text-left p-4 bg-white border border-[#E5E5E0] rounded-2xl hover:border-[#141414] transition-all"
                  >
                    <div className="text-xs font-bold mb-1">Citas Directas</div>
                    <p className="text-[10px] text-[#8E9299]">Integración nativa con Calendly en Email.</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('leads')}
                    className="w-full text-left p-4 bg-orange-50 border border-orange-200 rounded-2xl"
                  >
                    <div className="text-xs font-bold mb-1 text-orange-900">Prueba Social Dinámica</div>
                    <p className="text-[10px] text-orange-700">FOMO: Quién usa ya esto en su zona.</p>
                  </button>
                </div>
              </div>

              {/* Fase 3: Gestión (MCP) */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold font-mono">03</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#8E9299] font-bold">Gestión & MCP</div>
                </div>
                <div className="space-y-2">
                  <button 
                    onClick={() => setActiveTab('alerts')}
                    className="w-full text-left p-4 bg-white border border-[#E5E5E0] rounded-2xl hover:border-[#141414] transition-all"
                  >
                    <div className="text-xs font-bold mb-1">Alertas (Webhooks)</div>
                    <p className="text-[10px] text-[#8E9299]">Notificación Slack/WhatsApp lead 5/5.</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('leads')}
                    className="w-full text-left p-4 bg-[#141414] text-white rounded-2xl"
                  >
                    <div className="text-xs font-bold mb-1">Modo Ghost</div>
                    <p className="text-[10px] opacity-60">Previsualización humana antierror.</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('leads')}
                    className="w-full text-left p-4 bg-white border border-[#E5E5E0] rounded-2xl"
                  >
                    <div className="text-xs font-bold mb-1">Enriquecimiento RRSS</div>
                    <p className="text-[10px] text-[#8E9299]">Scraping de última publicación IG.</p>
                  </button>
                </div>
              </div>

              {/* Fase 4: Fidelización */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold font-mono">04</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#8E9299] font-bold">Fidelización</div>
                </div>
                <div className="space-y-2">
                  <button 
                    onClick={() => setActiveTab('leads')}
                    className="w-full text-left p-4 bg-green-50 border border-green-200 rounded-2xl"
                  >
                    <div className="text-xs font-bold mb-1 text-green-900">Reporte Mensual</div>
                    <p className="text-[10px] text-green-700">Trackreport recurrente automático.</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('leads')}
                    className="w-full text-left p-4 bg-green-50 border border-green-200 rounded-2xl"
                  >
                    <div className="text-xs font-bold mb-1 text-green-900">Sistema de Referidos</div>
                    <p className="text-[10px] text-green-700">URLs de conocidos por descuentos.</p>
                  </button>
                  <button onClick={() => setActiveTab('settings')} className="w-full text-left p-4 bg-white border border-dashed border-[#E5E5E0] rounded-2xl">
                    <div className="text-xs font-bold mb-1">API & Master Config</div>
                    <p className="text-[10px] text-[#8E9299]">Conexión técnica centralizada.</p>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-20 p-8 bg-[#F5F5F0] rounded-[2.5rem] border border-[#E5E5E0]">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <h3 className="text-2xl font-serif italic mb-2">Calculadora de Oportunidad Master</h3>
                  <p className="text-[#8E9299] text-sm">Análisis en tiempo real de la pérdida acumulada de leads sin automatizar.</p>
                </div>
                <div className="flex gap-4">
                  <div className="p-6 bg-white rounded-3xl border border-[#E5E5E0] min-w-[200px]">
                    <span className="text-[10px] uppercase font-bold text-[#8E9299] block mb-2">Pérdida Total Identificada</span>
                    <span className="text-3xl font-serif">${totalOpportunityLoss.toLocaleString()}</span>
                  </div>
                  <div className="p-6 bg-[#141414] text-white rounded-3xl min-w-[200px]">
                    <span className="text-[10px] uppercase font-bold opacity-60 block mb-2">ROI Recuperable (15%)</span>
                    <span className="text-3xl font-serif text-green-400">${(totalOpportunityLoss * 0.15).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-12 border border-[#E5E5E0]">
            <h2 className="text-2xl font-serif italic mb-8">Configuración del Protocolo Personal</h2>
            <div className="space-y-8">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#8E9299] block mb-2">Enlace de Calendly</label>
                <input 
                  value={settings.calendlyUrl} 
                    onChange={(e) => setSettings({...settings, calendlyUrl: e.target.value})}
                  placeholder="https://calendly.com/tu-nombre" 
                  className="w-full p-4 bg-[#F5F5F0] rounded-xl outline-none focus:bg-white border border-transparent focus:border-[#141414] transition-all" 
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#8E9299] block mb-2">WhatsApp para Alertas de Leads</label>
                <input 
                  value={settings.whatsappNumber} 
                    onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})}
                  placeholder="+34600000000" 
                  className="w-full p-4 bg-[#F5F5F0] rounded-xl outline-none focus:bg-white border border-transparent focus:border-[#141414] transition-all" 
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#8E9299] block mb-2">Voz de Marca del Agente IA</label>
                <textarea 
                  value={settings.brandVoice} 
                    onChange={(e) => setSettings({...settings, brandVoice: e.target.value})}
                  rows={4}
                  className="w-full p-4 bg-[#F5F5F0] rounded-xl outline-none focus:bg-white border border-transparent focus:border-[#141414] transition-all resize-none" 
                />
              </div>
              <button 
                onClick={async () => {
                  await setDoc(doc(db, 'userSettings', auth.currentUser?.uid || 'demo-user'), settings, { merge: true });
                  alert('Ajustes sincronizados en todo el Protocolo Ghost.');
                }}
                className="w-full py-4 bg-[#141414] text-white rounded-xl font-bold hover:shadow-xl transition-all"
              >
                Sincronizar Configuración
              </button>

              <div className="pt-8 border-t border-[#E5E5E0]">
                <h3 className="text-[10px] uppercase tracking-widest text-[#8E9299] mb-4 font-bold italic">10. MCP - Datos - API Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs font-mono">ENRIQUECIMIENTO_API</span>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">ACTIVO</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs font-mono">SCRAPPER_SYSTEM_V2</span>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">ACTIVO</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs font-mono">GEMINI_LOGIC_SELECTOR</span>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">CONECTADO</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
