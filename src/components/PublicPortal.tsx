import React, { useEffect, useState } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Prospect } from '../types';
import { motion } from 'motion/react';
import { Calendar, CheckCircle, Target, Sparkles, Loader2, ArrowRight, TrendingDown, TrendingUp, Video, Mail, Activity, ExternalLink, ArrowLeft } from 'lucide-react';

export default function PublicPortal({ prospectId }: { prospectId: string }) {
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const docRef = doc(db, 'prospects', prospectId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setProspect({ id: snap.id, ...snap.data() } as Prospect);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `prospects/${prospectId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [prospectId]);

  if (loading) return (
    <div className="h-screen bg-white flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#141414]" />
    </div>
  );

  if (!prospect) return (
    <div className="h-screen bg-white flex items-center justify-center text-[#8E9299]">
      Esta propuesta ha expirado o no es válida.
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <header className="bg-white border-b border-[#E5E5E0] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-4">
             {auth.currentUser && (
               <button 
                 onClick={() => {
                   const url = new URL(window.location.href);
                   url.searchParams.delete('lead');
                   window.location.href = url.pathname;
                 }}
                 className="p-2 -ml-2 rounded-full hover:bg-[#F5F5F0] transition-colors"
                 title="Volver al Dashboard"
               >
                 <ArrowLeft className="w-5 h-5 text-[#8E9299]" />
               </button>
             )}
             <div className="flex items-center gap-2">
               <Target className="w-6 h-6 text-[#141414]" />
               <span className="font-medium">Portal de Optimización de Crecimiento</span>
             </div>
           </div>
           <div className="text-[10px] uppercase font-mono tracking-widest text-[#8E9299]">
             Propuesta Privada para {prospect.companyName}
           </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-3 gap-8"
        >
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            <section className="bg-white rounded-3xl border border-[#E5E5E0] overflow-hidden">
              <div className="h-64 bg-[#F5F5F0] relative flex items-center justify-center">
                <img 
                  src={`https://s0.wp.com/mshots/v1/${encodeURIComponent(prospect.url.startsWith('http') ? prospect.url : `https://${prospect.url}`)}?w=1024`} 
                  alt="Website Preview" 
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
              </div>
              <div className="p-12 pt-0 relative z-10">
                <h1 className="text-4xl font-serif italic mb-6">Hola {prospect.companyName},</h1>
                <div className="prose prose-slate leading-relaxed text-[#141414] text-lg">
                  <p>Hemos analizado su huella digital actual y hemos identificado una brecha de crecimiento significativa.</p>
                  <div className="my-8 p-8 bg-[#F5F5F0] rounded-2xl border-l-4 border-[#141414] italic relative group">
                     "{prospect.proposal}"
                     <div className="absolute -top-3 -right-3 p-2 bg-[#FFCC00] rounded-full shadow-lg">
                       <Sparkles className="w-4 h-4 text-black" />
                     </div>
                  </div>
                  <p>Basándonos en sus métricas de rendimiento actuales, creemos que pasar a una estrategia centrada en <strong>{
                    prospect.targetProduct === 'Ideas de Market / Eslogan / Logo' ? 'Identidad y Estrategia de Mercado' : 
                    prospect.targetProduct === 'Follet (Folleto) / Newsletter o Mailing' ? 'Comunicación y Retención (Newsletter/Folleto)' : 
                    prospect.targetProduct === 'RRSS (Redes Sociales) / Banner' ? 'Visibilidad y Redes Sociales' : 
                    'Optimización Digital'
                  }</strong> podría desbloquear ingresos sustanciales.</p>
                </div>
              </div>
            </section>

            {prospect.videoUrl && (
              <section className="bg-white p-8 rounded-3xl border border-[#E5E5E0]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#8E9299] mb-4 flex items-center gap-2">
                  <Video className="w-3 h-3 text-blue-500" />
                  Video-Pitch Personalizado (Avatar IA)
                </h3>
                <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative group">
                  <video 
                    src={prospect.videoUrl} 
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                  />
                </div>
                <p className="mt-4 text-sm text-[#8E9299] text-center italic">
                   Presentación generada automáticamente donde nuestra IA le explica nuestra propuesta de valor.
                </p>
              </section>
            )}

            {prospect.newsletter && (
              <section className="bg-white p-8 rounded-3xl border border-[#E5E5E0]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#8E9299] mb-6 flex items-center gap-2">
                  <Mail className="w-3 h-3 text-red-500" />
                  Boceto de Estrategia de Comunicación (Newsletter)
                </h3>
                <div className="bg-[#F5F5F0] rounded-2xl overflow-hidden border border-[#E5E5E0] shadow-sm">
                  <div className="bg-white p-4 border-b border-[#E5E5E0]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#141414] flex items-center justify-center text-white text-[10px] font-bold">GM</div>
                      <div>
                        <div className="text-[10px] text-[#8E9299] leading-tight">De: GhostMark AI Strategy</div>
                        <div className="text-xs font-bold text-[#141414]">{prospect.newsletter.subject}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-8">
                     <div className="max-w-md mx-auto">
                        <div className="mb-6 py-2 px-4 bg-white rounded-lg border-l-4 border-[#FFCC00] text-[10px] font-bold uppercase text-[#141414]">
                          {prospect.newsletter.productHighlight}
                        </div>
                        <div className="text-sm leading-relaxed text-[#141414] whitespace-pre-wrap font-sans mb-8">
                          {prospect.newsletter.content}
                        </div>
                        <div className="text-center">
                          <button className="px-8 py-3 bg-[#141414] text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl">
                            {prospect.newsletter.cta}
                          </button>
                        </div>
                     </div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-[#8E9299] text-center italic">
                   Diseño conceptual de campaña reactiva para su audiencia.
                </p>
              </section>
            )}

            {prospect.visualHookUrl && (
              <section className="bg-white p-8 rounded-3xl border border-[#E5E5E0]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#8E9299] mb-4 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-[#FFCC00]" />
                  Propuesta Visual Personalizada
                </h3>
                <div className="aspect-video bg-[#F5F5F0] rounded-2xl overflow-hidden shadow-inner">
                  <img 
                    src={prospect.visualHookUrl} 
                    alt="Propuesta Visual" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="mt-4 text-sm text-[#8E9299] text-center italic">
                   Boceto preliminar generado por IA basado en su sector ({prospect.sector}).
                </p>
              </section>
            )}

            {prospect.sentimentAnalysis && (
              <section className="bg-white p-8 rounded-3xl border border-[#E5E5E0]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#8E9299] mb-6 flex items-center gap-2">
                  <Activity className="w-3 h-3 text-orange-500" />
                  Percepción de Marca (IA Market Sentiment)
                </h3>
                <div className="flex items-center gap-8">
                  <div className="flex-1">
                    <div className="text-lg font-bold text-[#141414] mb-1">{prospect.sentimentAnalysis.label}</div>
                    <p className="text-sm text-[#8E9299] italic">{prospect.sentimentAnalysis.summary}</p>
                  </div>
                  <div className="text-4xl font-serif text-orange-500 font-bold">
                    {prospect.sentimentAnalysis.score}%
                  </div>
                </div>
              </section>
            )}

            {prospect.competitorAnalysis && (
              <section className="bg-white p-8 rounded-3xl border border-[#E5E5E0]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#8E9299] mb-4">Análisis de Brecha Competitiva (Benchmarking)</h3>
                <div className="grid gap-4">
                  {prospect.competitorAnalysis.competitors.map((comp, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-[#F5F5F0] rounded-2xl group">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-bold text-sm">{comp.name}</div>
                          {comp.url && (
                            <a 
                              href={comp.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                            >
                              Visitar Sitio <ExternalLink className="w-2 h-2" />
                            </a>
                          )}
                        </div>
                        <div className="text-xs text-[#8E9299] pr-4">{comp.weakness}</div>
                      </div>
                      <div className="text-[10px] font-bold text-[#FF4444] uppercase tracking-tighter whitespace-nowrap">Oportunidad Activa</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {prospect.socialStrategy && (
              <section className="bg-[#141414] text-white p-8 rounded-3xl">
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-6 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Estrategia de Presencia Digital (Blueprint)
                </h3>
                <div className="grid md:grid-cols-2 gap-8">
                  {prospect.socialStrategy.map((strat, idx) => (
                    <div key={idx}>
                      <div className="text-xs font-bold uppercase text-[#FFCC00] mb-3">{strat.platform}</div>
                      <ul className="space-y-2">
                        {strat.ideas.map((idea, i) => (
                          <li key={i} className="text-sm opacity-80 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-[#FFCC00] rounded-full mt-1.5 shrink-0"></span>
                            {idea}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="grid grid-cols-2 gap-6">
               <div className="bg-[#141414] text-white p-8 rounded-3xl relative overflow-hidden group">
                  <div className="relative z-10">
                    <span className="text-[10px] uppercase tracking-[0.2em] opacity-60 mb-2 block">Pérdida por Inacción Mensual</span>
                    <div className="text-3xl font-mono text-[#FF4444] mb-1">-${prospect.opportunityLoss?.toLocaleString()}</div>
                    <p className="text-xs opacity-60">Impacto directo por no tener {prospect.targetProduct?.includes('Newsletter') ? 'Newsletter' : 'Presencia Optimizada'}.</p>
                  </div>
                  <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-5 group-hover:scale-110 transition-transform duration-700">
                    <TrendingDown className="w-32 h-32" />
                  </div>
               </div>
               <div className="bg-white p-8 rounded-3xl border border-[#E5E5E0] relative overflow-hidden group">
                  <div className="relative z-10">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#8E9299] mb-2 block">Crecimiento Recuperable</span>
                    <div className="text-3xl font-bold mb-1 text-green-600">+${((prospect.opportunityLoss || 0) * 0.15).toLocaleString()}</div>
                    <p className="text-xs text-[#8E9299]">Incremento de ingresos proyectado tras el despliegue del Protocolo GhostMark.</p>
                  </div>
                  <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-5 group-hover:scale-110 transition-transform duration-700">
                    <TrendingUp className="w-32 h-32" />
                  </div>
               </div>
            </section>
          </div>

          {/* Sidebar Action */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-[#E5E5E0] sticky top-24">
              <Sparkles className="w-8 h-8 text-[#FFCC00] mb-4" />
              <h3 className="font-medium mb-2">Sesión de Estrategia</h3>
              <p className="text-sm text-[#8E9299] mb-6">Analicemos los datos y los conceptos visuales que hemos preparado para su marca.</p>
              
              <button className="w-full py-4 bg-[#141414] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all">
                <Calendar className="w-5 h-5" />
                Reservar Llamada de Estrategia
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <div className="mt-8 pt-8 border-t border-[#E5E5E0]">
                <div className="flex items-center gap-2 mb-4">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                   <span className="text-[10px] uppercase font-mono">Experto en Línea</span>
                </div>
                <ul className="space-y-3">
                  {['Hoja de ruta de ROI personalizada', 'Bocetos visuales de marca', 'Auditoría de conversión'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-[#141414]">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-12 text-[#8E9299] text-[10px] uppercase tracking-widest font-mono text-center">
        GhostMark AI Protocol &copy; 2026 | Transmisión de Estrategia Encriptada
      </footer>
    </div>
  );
}
