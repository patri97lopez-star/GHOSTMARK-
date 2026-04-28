import React, { useState } from 'react';
import { Prospect } from '../types';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { generateNewsletter, generateVideoScript, analyzeCompetitors, generateSocialStrategy, generateSEOAnalysis, generateVisualHook, analyzeSentiment } from '../services/geminiService';
import { X, Send, Eye, Shield, CheckCircle, AlertCircle, Loader2, Mail, Sparkles, ArrowLeft, Video, Play, Users, Globe, Hash, Layout, MessageSquare, ExternalLink, Activity, Instagram, Calendar as CalendarIcon } from 'lucide-react';

interface Props {
  prospect: Prospect;
  brandVoice: string;
  calendlyUrl?: string;
  onClose: () => void;
}

export default function GhostMode({ prospect, brandVoice, calendlyUrl, onClose }: Props) {
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingNewsletter, setIsGeneratingNewsletter] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isAnalyzingCompetitors, setIsAnalyzingCompetitors] = useState(false);
  const [isGeneratingSocial, setIsGeneratingSocial] = useState(false);
  const [isAnalyzingSEO, setIsAnalyzingSEO] = useState(false);
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);
  const [success, setSuccess] = useState(false);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleGenerateVisual = async () => {
    setIsGeneratingVisual(true);
    try {
      const url = await generateVisualHook(prospect.companyName, prospect.sector || 'Marketing');
      const docRef = doc(db, 'prospects', prospect.id);
      await updateDoc(docRef, {
        visualHookUrl: url,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `prospects/${prospect.id}`);
    } finally {
      setIsGeneratingVisual(false);
    }
  };

  const handleAnalyzeSentiment = async () => {
    setIsAnalyzingSentiment(true);
    try {
       const data = await analyzeSentiment(prospect.companyName, prospect.sector || 'Marketing');
       const docRef = doc(db, 'prospects', prospect.id);
       await updateDoc(docRef, {
         sentimentAnalysis: data,
         updatedAt: serverTimestamp()
       });
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `prospects/${prospect.id}`);
    } finally {
       setIsAnalyzingSentiment(false);
    }
  };

  const handleGenerateVideo = async () => {
    setIsGeneratingVideo(true);
    try {
      const scriptData = await generateVideoScript(prospect, brandVoice);
      const docRef = doc(db, 'prospects', prospect.id);
      await updateDoc(docRef, {
        videoUrl: 'https://cdn.heygen.com/home/media/avatar_landing_bg_video.mp4',
        videoScript: scriptData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `prospects/${prospect.id}`);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleAnalyzeCompetitors = async () => {
    setIsAnalyzingCompetitors(true);
    try {
      const name = prospect.companyName || new URL(prospect.url).hostname;
      const data = await analyzeCompetitors(name, prospect.sector || 'Marketing');
      const docRef = doc(db, 'prospects', prospect.id);
      await updateDoc(docRef, {
        competitorAnalysis: data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `prospects/${prospect.id}`);
    } finally {
      setIsAnalyzingCompetitors(false);
    }
  };

  const handleGenerateSocial = async () => {
    setIsGeneratingSocial(true);
    try {
      const data = await generateSocialStrategy(prospect);
      const docRef = doc(db, 'prospects', prospect.id);
      await updateDoc(docRef, {
        socialStrategy: data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `prospects/${prospect.id}`);
    } finally {
      setIsGeneratingSocial(false);
    }
  };

  const handleAnalyzeSEO = async () => {
    setIsAnalyzingSEO(true);
    try {
      const data = await generateSEOAnalysis(prospect);
      const docRef = doc(db, 'prospects', prospect.id);
      await updateDoc(docRef, {
        seoAnalysis: data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `prospects/${prospect.id}`);
    } finally {
      setIsAnalyzingSEO(false);
    }
  };

  const handleGenerateNewsletter = async () => {
    setIsGeneratingNewsletter(true);
    try {
      const newsletter = await generateNewsletter(prospect, brandVoice);
      const docRef = doc(db, 'prospects', prospect.id);
      await updateDoc(docRef, {
        newsletter: {
          ...newsletter,
          generatedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `prospects/${prospect.id}`);
    } finally {
      setIsGeneratingNewsletter(false);
    }
  };

  const handleReject = async () => {
    try {
      const docRef = doc(db, 'prospects', prospect.id);
      await updateDoc(docRef, {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `prospects/${prospect.id}`);
    }
  };

  const handleValidateAndSend = async () => {
    setIsSending(true);
    try {
      // 1. Mock API call to Resend
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: prospect.contactEmail,
          subject: `Opportunity for ${prospect.companyName}`,
          html: `<p>${prospect.proposal}</p>`
        })
      });

      if (!response.ok) throw new Error('Failed to send email');

      // 2. Update Firestore status
      const docRef = doc(db, 'prospects', prospect.id);
      await updateDoc(docRef, {
        status: 'sent',
        updatedAt: serverTimestamp(),
        validatedBy: 'human_audit'
      });

      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `prospects/${prospect.id}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-[#E5E5E0] flex items-center justify-between bg-[#141414] text-white">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors group"
              title="Volver"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-[#FFCC00]" />
              <div>
                <h2 className="text-xl font-medium">Verificación Modo Ghost</h2>
                <p className="text-xs text-white/60 font-mono">Se requiere auditoría manual antes de disparar la secuencia.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('lead', prospect.id);
                navigator.clipboard.writeText(url.toString());
                alert('Enlace del portal copiado!');
              }}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-[10px] font-mono uppercase"
            >
              Copiar Enlace
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto">
          <section className="mb-8">
            <h3 className="text-[10px] uppercase tracking-widest text-[#8E9299] mb-4">Estado del Protocolo GhostMark (10 Puntos)</h3>
            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
              <button 
                onClick={onClose}
                className="flex items-center gap-2 p-2 bg-green-50 text-green-700 rounded-lg border border-green-100 text-left"
              >
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>1. Identificar Propietario</span>
              </button>
              <button 
                onClick={handleAnalyzeCompetitors}
                disabled={isAnalyzingCompetitors}
                className="flex items-center gap-2 p-2 bg-[#F5F5F0] hover:bg-[#E5E5E0] rounded-lg transition-colors text-left disabled:opacity-50 relative group"
              >
                <div className={`w-2 h-2 rounded-full ${isAnalyzingCompetitors ? 'bg-orange-400 animate-pulse' : prospect.competitorAnalysis ? 'bg-green-500' : 'bg-[#8E9299]'}`}></div>
                <span>2. Búsqueda de Carencias (Competencia)</span>
                {isAnalyzingCompetitors && <Loader2 className="w-2.5 h-2.5 animate-spin ml-auto" />}
              </button>
              <div className="flex items-center gap-2 p-2 bg-green-50 text-green-700 rounded-lg border border-green-100">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>3. Producto (Segmento)</span>
              </div>
              <button 
                onClick={handleAnalyzeSEO}
                disabled={isAnalyzingSEO}
                className="flex items-center gap-2 p-2 bg-[#F5F5F0] hover:bg-[#E5E5E0] rounded-lg transition-colors text-left disabled:opacity-50"
              >
                <div className={`w-2 h-2 rounded-full ${prospect.seoAnalysis ? 'bg-green-500' : 'bg-[#8E9299]'}`}></div>
                <span>4. Scrapping (Local/Sector)</span>
              </button>
              <div className="flex items-center gap-2 p-2 border border-orange-200 bg-orange-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                <span className="text-orange-900 font-bold">5. Selector Lógico</span>
              </div>
              <button 
                onClick={handleGenerateNewsletter}
                disabled={isGeneratingNewsletter}
                className="flex items-center gap-2 p-2 bg-[#F5F5F0] hover:bg-[#E5E5E0] rounded-lg transition-colors text-left disabled:opacity-50"
              >
                <div className={`w-2 h-2 rounded-full ${prospect.newsletter ? 'bg-green-500' : 'bg-[#8E9299]'}`}></div>
                <span>6. Automatización IA</span>
              </button>
              <button 
                onClick={handleAnalyzeSentiment}
                disabled={isAnalyzingSentiment}
                className="flex items-center gap-2 p-2 bg-[#F5F5F0] hover:bg-[#E5E5E0] rounded-lg transition-colors text-left disabled:opacity-50"
              >
                <div className={`w-2 h-2 rounded-full ${prospect.sentimentAnalysis ? 'bg-green-500' : 'bg-[#8E9299]'}`}></div>
                <span>7. Precisión / Sentiment Scan</span>
              </button>
              <div className="flex items-center gap-2 p-2 bg-green-50 text-green-700 rounded-lg border border-green-100">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>8. ROI (Oportunidad)</span>
              </div>
              <button 
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('lead', prospect.id);
                  window.open(url.toString(), '_blank');
                }}
                className="flex items-center gap-2 p-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors text-left"
              >
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span>9. Trackreport (Portal)</span>
              </button>
              <button 
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo}
                className="flex items-center gap-2 p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors text-left disabled:opacity-50"
              >
                <div className={`w-2 h-2 rounded-full ${prospect.videoUrl ? 'bg-blue-500' : 'bg-[#8E9299]'}`}></div>
                <span>10. MCP - Video Pitch</span>
              </button>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-[10px] uppercase tracking-widest text-[#8E9299] mb-4">Herramientas de Escalado GhostMark</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="flex flex-col items-start p-4 bg-[#F5F5F0] rounded-2xl border border-[#E5E5E0]">
                <span className="text-[10px] uppercase font-bold text-[#8E9299] block mb-2">Pérdida de Lead</span>
                <div className="flex items-end gap-1">
                  <span className="text-xl font-serif text-[#FF4444]">-${prospect.opportunityLoss?.toLocaleString() || '0'}</span>
                  <span className="text-[10px] text-[#8E9299] font-bold mb-1">/ mes</span>
                </div>
              </div>
              <div className="flex flex-col items-start p-4 bg-[#F5F5F0] rounded-2xl border border-[#E5E5E0]">
                <span className="text-[10px] uppercase font-bold text-[#8E9299] block mb-2">Selector Lógico</span>
                <span className="text-xs font-bold text-[#141414] leading-tight block">
                   {prospect.targetProduct || 'Pendiente de análisis'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
               <div className="p-6 bg-gradient-to-br from-[#141414] to-[#2A2A2A] rounded-3xl text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <h4 className="text-xs font-bold mb-4 flex items-center gap-2">
                       <Sparkles className="w-4 h-4 text-[#FFCC00]" />
                       Efecto "Wow" Generativo
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                       <button 
                         onClick={() => prospect.visualHookUrl ? scrollToId('visual-hook-section') : handleGenerateVisual()}
                         disabled={isGeneratingVisual}
                         className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-[10px] font-bold disabled:opacity-50"
                       >
                          {isGeneratingVisual ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3 text-blue-400" />}
                          {prospect.visualHookUrl ? 'Ver Visual Hook' : 'Conceptos Visuales'}
                       </button>
                       <button 
                         onClick={() => prospect.sentimentAnalysis ? scrollToId('sentiment-section') : handleAnalyzeSentiment()}
                         disabled={isAnalyzingSentiment}
                         className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-[10px] font-bold disabled:opacity-50"
                       >
                          {isAnalyzingSentiment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3 text-orange-400" />}
                          {prospect.sentimentAnalysis ? 'Ver Sentiment' : 'Análisis Sentiment'}
                       </button>
                       <button 
                         onClick={handleGenerateVideo}
                         disabled={isGeneratingVideo}
                         className="flex items-center justify-center gap-2 px-3 py-2 bg-white text-black hover:bg-[#F5F5F0] rounded-xl transition-all text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
                       >
                          {isGeneratingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                          {prospect.videoUrl ? 'Regenerar' : 'Generar Video'}
                       </button>
                       <button 
                         onClick={() => window.open('https://www.heygen.com/es-es?utm_source=semb&utm_campaign=23547625641&gad_source=1&gad_campaignid=23547625641&gbraid=0AAAAABiJW6atusUvEPI4nIqENtC5pSVSu&gclid=Cj0KCQjwkrzPBhCqARIsAJN460lt4UdM8ETC3gar70wa04jNtg6aKX4J1P1mYRa5drBM_Lh5lj4Lo4YaAul5EALw_wcB', '_blank')}
                         className="flex items-center justify-center gap-2 px-3 py-2 bg-[#FFCC00] text-black hover:bg-[#F5B800] rounded-xl transition-all text-[10px] font-bold uppercase tracking-wider shadow-lg"
                       >
                          <ExternalLink className="w-4 h-4" />
                          HeyGen
                       </button>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 opacity-5">
                     <Sparkles className="w-32 h-32" />
                  </div>
               </div>

               <div className="p-6 bg-white border-2 border-[#E5E5E0] rounded-3xl">
                  <h4 className="text-xs font-bold mb-4 text-[#141414]">Conversión y Cierre (Inyectores IA)</h4>
                  <div className="grid grid-cols-2 gap-2">
                     <button 
                       onClick={() => prospect.seoAnalysis ? scrollToId('seo-section') : handleAnalyzeSEO()}
                       disabled={isAnalyzingSEO}
                       className="flex items-center justify-center gap-2 px-3 py-2 bg-[#F5F5F0] hover:bg-[#E5E5E0] rounded-xl transition-all text-[10px] font-bold uppercase disabled:opacity-50"
                     >
                        {isAnalyzingSEO ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
                        {prospect.seoAnalysis ? 'Ver SEO' : 'Análisis SEO'}
                     </button>
                     <button 
                       onClick={() => prospect.competitorAnalysis ? scrollToId('competitors-section') : handleAnalyzeCompetitors()}
                       disabled={isAnalyzingCompetitors}
                       className="flex items-center justify-center gap-2 px-3 py-2 bg-[#F5F5F0] hover:bg-[#E5E5E0] rounded-xl transition-all text-[10px] font-bold uppercase disabled:opacity-50"
                     >
                        {isAnalyzingCompetitors ? <Loader2 className="w-3 h-3 animate-spin" /> : <Users className="w-3 h-3" />}
                        {prospect.competitorAnalysis ? 'Ver Competencia' : 'Espiar Competencia'}
                     </button>
                     <button 
                       onClick={() => prospect.socialStrategy ? scrollToId('social-section') : handleGenerateSocial()}
                       disabled={isGeneratingSocial}
                       className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-xl transition-all text-[10px] font-bold uppercase border border-blue-200 disabled:opacity-50"
                     >
                        {isGeneratingSocial ? <Loader2 className="w-3 h-3 animate-spin" /> : <Hash className="w-3 h-3" />}
                        {prospect.socialStrategy ? 'Ver Social' : 'Social Blueprint'}
                     </button>
                     <button 
                       onClick={() => window.open('https://calendly.com', '_blank')}
                       className="flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-800 hover:bg-green-100 rounded-xl transition-all text-[10px] font-bold uppercase border border-green-200"
                     >
                        <CalendarIcon className="w-3 h-3" />
                        Link Calendly
                     </button>
                  </div>
               </div>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-[10px] uppercase tracking-widest text-[#8E9299] mb-4">Video-Pitch Generado (Avatar IA)</h3>
            <div className="aspect-video bg-black rounded-2xl overflow-hidden flex flex-col items-center justify-center relative group">
              {prospect.videoUrl ? (
                <>
                  <video 
                    src={prospect.videoUrl} 
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                  />
                  {prospect.videoScript && (
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-black/80 backdrop-blur-md translate-y-full group-hover:translate-y-0 transition-transform">
                      <div className="text-[10px] text-[#FFCC00] font-bold uppercase mb-1">Guion de la IA:</div>
                      <p className="text-[10px] text-white leading-relaxed italic line-clamp-3">
                        {prospect.videoScript.script}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-8">
                  <Video className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-xs text-white/40 max-w-[250px]">Genera un video personalizado donde un avatar de IA le habla directamente al cliente.</p>
                </div>
              )}
            </div>
            {prospect.videoScript && (
              <div className="mt-4 p-4 bg-[#F5F5F0] rounded-xl border border-[#E5E5E0]">
                <h4 className="text-[10px] font-bold text-[#141414] uppercase mb-2 flex items-center gap-2">
                  <MessageSquare className="w-3 h-3" />
                  Instrucciones del Avatar
                </h4>
                <p className="text-xs text-[#8E9299] italic">{prospect.videoScript.avatarInstructions}</p>
              </div>
            )}
          </section>

          {prospect.sentimentAnalysis && (
            <section id="sentiment-section" className="mb-8 p-6 bg-orange-50/30 border border-orange-100 rounded-3xl">
              <h3 className="text-[10px] uppercase tracking-widest text-orange-800 mb-4 flex items-center gap-2 font-bold">
                <Activity className="w-4 h-4" />
                Voz del Mercado (Sentiment Analysis)
              </h3>
              <div className="flex items-center gap-6">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-orange-100"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 36}
                      strokeDashoffset={2 * Math.PI * 36 * (1 - prospect.sentimentAnalysis.score / 100)}
                      className="text-orange-500"
                    />
                  </svg>
                  <span className="absolute text-lg font-bold text-orange-900">{prospect.sentimentAnalysis.score}%</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-orange-900 mb-1">{prospect.sentimentAnalysis.label}</div>
                  <p className="text-xs text-orange-800/70 italic">{prospect.sentimentAnalysis.summary}</p>
                </div>
              </div>
            </section>
          )}

          <section id="competitors-section" className="mb-8 p-6 bg-white border border-[#E5E5E0] rounded-3xl">
            <h3 className="text-[10px] uppercase tracking-widest text-[#8E9299] mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" />
                Sombra de la Competencia (Market Analysis)
              </div>
              {!prospect.competitorAnalysis && !isAnalyzingCompetitors && (
                <button 
                  onClick={handleAnalyzeCompetitors}
                  className="text-[9px] font-bold text-orange-600 hover:underline"
                >
                  Analizar Ahora
                </button>
              )}
            </h3>
            
            {isAnalyzingCompetitors ? (
              <div className="flex flex-col items-center justify-center py-8 text-[#8E9299]">
                 <Loader2 className="w-8 h-8 animate-spin mb-2" />
                 <span className="text-[10px] font-mono animate-pulse uppercase">Escaneando mercado...</span>
              </div>
            ) : prospect.competitorAnalysis ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  {prospect.competitorAnalysis.competitors.map((comp: any, idx: number) => (
                    <div 
                      key={idx} 
                      onClick={() => comp.url && window.open(comp.url, '_blank')}
                      className={`p-3 bg-[#F5F5F0] rounded-xl flex items-center justify-between group/comp transition-all ${comp.url ? 'cursor-pointer hover:bg-[#E5E5E0] hover:shadow-sm' : ''}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-bold text-[#141414]">{comp.name}</div>
                          {comp.url && (
                            <div className="p-1 bg-white rounded transition-colors">
                              <ExternalLink className="w-2.5 h-2.5 text-blue-500" />
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] text-[#8E9299]">{comp.weakness}</div>
                      </div>
                      <div className="px-2 py-1 bg-red-100 text-red-600 text-[8px] font-bold uppercase rounded opacity-0 group-hover/comp:opacity-100 transition-opacity whitespace-nowrap">Brecha Detectada</div>
                    </div>
                  ))}
                </div>
                
                {/* Text representation as requested originally */}
                <div className="p-4 bg-[#141414] rounded-2xl">
                   <div className="text-[9px] font-mono text-white/40 uppercase mb-2">URLs de la Competencia (Registro Largo)</div>
                   <div className="text-[10px] font-mono text-white/70 break-all bg-black/30 p-3 rounded-lg border border-white/5">
                      {prospect.competitorAnalysis.competitors.map((c: any) => c.url).join(', ')}
                   </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center bg-[#F5F5F0] rounded-2xl border border-dashed border-[#E5E5E0]">
                <Users className="w-8 h-8 text-[#E5E5E0] mx-auto mb-2" />
                <p className="text-[10px] text-[#8E9299] uppercase tracking-widest">No se han identificado competidores aún.</p>
              </div>
            )}
          </section>

          {prospect.socialStrategy && (
            <section id="social-section" className="mb-8 p-6 bg-blue-50/50 border border-blue-100 rounded-3xl">
              <h3 className="text-[10px] uppercase tracking-widest text-blue-800 mb-4 flex items-center gap-2 font-bold">
                <Hash className="w-4 h-4" />
                Blueprint de Redes Sociales
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {prospect.socialStrategy.map((strat: any, idx: number) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-blue-100">
                    <div className="text-xs font-bold text-blue-900 mb-2">{strat.platform}</div>
                    <ul className="space-y-1">
                      {strat.ideas.map((idea: string, i: number) => (
                        <li key={i} className="text-[10px] text-blue-800/70 border-l-2 border-blue-200 pl-2">{idea}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {prospect.seoAnalysis && (
            <section id="seo-section" className="mb-8 p-6 bg-indigo-50/50 border border-indigo-100 rounded-3xl">
              <h3 className="text-[10px] uppercase tracking-widest text-indigo-800 mb-4 flex items-center gap-2 font-bold">
                <Globe className="w-4 h-4" />
                Invisible Presence (Keywords & SEO)
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] text-indigo-900 font-bold mb-2">Meta Description Estratégica:</div>
                  <p className="text-xs text-indigo-800/80 bg-white p-3 rounded-xl border border-indigo-100 italic">
                    "{prospect.seoAnalysis.metaDescription}"
                  </p>
                </div>
                <div>
                  <div className="text-[10px] text-indigo-900 font-bold mb-2">Palabras Clave Sugeridas:</div>
                  <div className="flex flex-wrap gap-2">
                    {prospect.seoAnalysis.keywords.map((kw: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-white border border-indigo-100 rounded text-[9px] text-indigo-800 font-mono">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="mb-8">
            <h3 className="text-[10px] uppercase tracking-widest text-[#8E9299] mb-4">Referencia: Sitio Web Original</h3>
            <div className="aspect-video bg-[#F5F5F0] rounded-2xl overflow-hidden border border-[#E5E5E0] flex items-center justify-center">
              <img 
                src={`https://s0.wp.com/mshots/v1/${encodeURIComponent(prospect.url.startsWith('http') ? prospect.url : `https://${prospect.url}`)}?w=800`} 
                alt="Website Screenshot" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </section>

          <section id="visual-hook-section" className="mb-8">
            <h3 className="text-[10px] uppercase tracking-widest text-[#8E9299] mb-4">Gancho Visual Generado</h3>
            <div className="aspect-video bg-[#F5F5F0] rounded-2xl overflow-hidden flex items-center justify-center">
              {prospect.visualHookUrl ? (
                <img src={prospect.visualHookUrl} alt="Visual Hook" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <Eye className="w-8 h-8 text-[#E5E5E0]" />
              )}
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-[10px] uppercase tracking-widest text-[#8E9299] mb-4">Análisis de Sentimiento de la Competencia</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#F5F5F0] rounded-xl">
                 <span className="text-[10px] text-[#8E9299] block mb-1">Sentimiento del Lead</span>
                 <div className="text-sm font-bold">{(prospect.sentimentScore || 0) * 100}% Negativo</div>
                 <p className="text-[10px] text-[#FF4444]">Alta oportunidad de intervención.</p>
              </div>
              <div className="p-4 bg-[#F5F5F0] rounded-xl">
                 <span className="text-[10px] text-[#8E9299] block mb-1">Promedio del Mercado</span>
                 <div className="text-sm font-bold">82% Positivo</div>
                 <p className="text-[10px] text-green-600">La brecha es significativa.</p>
              </div>
            </div>
          </section>
          
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] uppercase tracking-widest text-[#8E9299]">Contenido Estratégico (Newsletter)</h3>
              {!prospect.newsletter ? (
                <button 
                  onClick={handleGenerateNewsletter}
                  disabled={isGeneratingNewsletter}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] text-white rounded-lg text-[10px] font-bold uppercase transition-all hover:bg-black disabled:opacity-50"
                >
                  {isGeneratingNewsletter ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                  Generar Newsletter
                </button>
              ) : (
                <button 
                  onClick={handleGenerateNewsletter}
                  disabled={isGeneratingNewsletter}
                  className="text-[10px] text-[#8E9299] hover:text-[#141414] underline"
                >
                  Regenerar
                </button>
              )}
            </div>
            
            {prospect.newsletter ? (
              <div className="bg-white border-2 border-[#E5E5E0] rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-[#F5F5F0] p-4 border-b border-[#E5E5E0]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-[#8E9299] font-bold uppercase tracking-tight">Asunto:</span>
                    <span className="text-xs font-semibold">{prospect.newsletter.subject}</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="text-[10px] font-bold text-blue-900 uppercase mb-1">Foco en Producto:</div>
                    <p className="text-xs text-blue-800">{prospect.newsletter.productHighlight}</p>
                  </div>
                  <div className="text-sm leading-relaxed text-[#141414] whitespace-pre-wrap font-sans mb-6">
                    {prospect.newsletter.content}
                  </div>
                  <div className="flex justify-center">
                    <button 
                      onClick={() => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('lead', prospect.id);
                        window.open(url.toString(), '_blank');
                      }}
                      className="px-6 py-2.5 bg-[#141414] text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-lg hover:bg-black transition-all"
                    >
                      {prospect.newsletter.cta}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-[#F5F5F0] rounded-2xl border-2 border-dashed border-[#E5E5E0] flex flex-col items-center justify-center text-center">
                <Mail className="w-8 h-8 text-[#E5E5E0] mb-3" />
                <p className="text-xs text-[#8E9299] max-w-[200px]">Haz clic en "Generar" para redactar el newsletter personalizado usando IA.</p>
              </div>
            )}
          </section>

          <div className="grid grid-cols-2 gap-8 py-6 border-t border-[#E5E5E0]">
            <div>
              <span className="text-[10px] text-[#8E9299] uppercase block mb-1">Análisis de Impacto</span>
              <p className="text-sm font-medium">
                Estimamos una pérdida de <span className="text-[#FF4444] font-bold">${prospect.opportunityLoss?.toLocaleString()}</span> anual por marketing ineficiente.
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
              <span className="text-[10px] text-orange-800 uppercase font-bold block mb-1">🎯 Selector Lógico</span>
              <p className="text-sm font-bold text-[#141414] uppercase tracking-tight mb-2">
                {prospect.targetProduct || 'Pendiente de definir'}
              </p>
              <div className="text-[10px] text-[#141414]/60 space-y-1">
                {prospect.targetProduct === 'Ideas de Market / Eslogan / Logo' && (
                  <p>• Identidad visual débil detectada.</p>
                )}
                {prospect.targetProduct === 'Follet (Folleto) / Newsletter o Mailing' && (
                  <p>• Falta de canales de retención directa.</p>
                )}
                {prospect.targetProduct === 'RRSS (Redes Sociales) / Banner' && (
                  <p>• Bajo engagement en canales sociales.</p>
                )}
                <p>• Acción prioritaria para mitigar pérdida de ROI.</p>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-[#8E9299] uppercase block mb-1">Contacto Objetivo</span>
              <p className="text-sm font-medium">{prospect.contactEmail || 'Desconocido'}</p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-[#F5F5F0] flex gap-4">
          <button
            onClick={handleReject}
            className="flex-1 py-4 bg-white border border-[#E5E5E0] rounded-xl font-medium hover:bg-gray-50 transition-all font-mono uppercase text-xs tracking-widest"
          >
            Rechazar Secuencia
          </button>
          <button
            onClick={handleValidateAndSend}
            disabled={isSending || success || !prospect.contactEmail}
            className="flex-[2] py-4 bg-[#141414] text-white rounded-xl font-medium hover:bg-black transition-all flex items-center justify-center gap-2"
          >
            {success ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Secuencia Iniciada</span>
              </>
            ) : isSending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Validando Firma...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Validar y Ejecutar Envío</span>
              </>
            )}
          </button>
        </div>
        
        {!prospect.contactEmail && !success && (
          <div className="mx-8 mb-8 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>No se puede enviar sin email de contacto. Por favor, edita el lead manualmente.</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
