import React, { useState } from 'react';
import { Prospect } from '../types';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { analyzeProspect, generateVisualHook, analyzeCompetitors } from '../services/geminiService';
import { ExternalLink, Mail, Linkedin, Sparkles, AlertCircle, CheckCircle2, ChevronRight, Loader2, Image as ImageIcon, Target } from 'lucide-react';
import { motion } from 'motion/react';
import GhostMode from './GhostMode';

interface Props {
  prospect: Prospect;
  index: number;
  brandVoice: string;
  calendlyUrl?: string;
  isCompact?: boolean;
  key?: string;
}

export default function ProspectCard({ prospect, index, brandVoice, calendlyUrl, isCompact }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGhostMode, setShowGhostMode] = useState(false);

  React.useEffect(() => {
    if (prospect.status === 'pending' && !isProcessing) {
      startAnalysis();
    }
  }, []);

  const startAnalysis = async () => {
    setIsProcessing(true);
    try {
      // 1. Simulate scraping/enrichment (in this demo we just call Gemini)
      // Normally we'd fetch the HTML of the URL here. 
      // For the demo, we'll use Gemini to "imagine" the content or use the tool to search if available.
      // But we'll just pass the URL to Gemini and ask it to describe a typical marketing landscape for it.
      
      const result = await analyzeProspect(prospect.url, "Identificación general del negocio basada en metadatos de la URL e industria implícita.");
      
      // 2. Update Firestore with enrichment data
      const docRef = doc(db, 'prospects', prospect.id);
      await updateDoc(docRef, {
        ...result,
        status: 'analyzed',
        updatedAt: serverTimestamp(),
      });

      // 3. Generate Visual Hook (Product sketch)
      const visualHookUrl = await generateVisualHook(result.companyName, result.sector);
      await updateDoc(docRef, {
        visualHookUrl,
        updatedAt: serverTimestamp(),
      });

      // 4. Identify Competitors
      const compAnalysis = await analyzeCompetitors(result.companyName, result.sector);
      await updateDoc(docRef, {
        competitorAnalysis: compAnalysis,
        updatedAt: serverTimestamp(),
      });

    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `prospects/${prospect.id}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = () => {
    switch (prospect.status) {
      case 'sent': return 'bg-green-100 text-green-700 border-green-200';
      case 'validated': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'analyzed': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusLabel = () => {
    switch (prospect.status) {
      case 'sent': return 'Enviado';
      case 'validated': return 'Validado';
      case 'analyzed': return 'Analizado';
      case 'rejected': return 'Rechazado';
      case 'enriched': return 'Enriquecido';
      default: return 'Pendiente';
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        className={`bg-white rounded-2xl border border-[#E5E5E0] overflow-hidden group hover:shadow-lg transition-all duration-300 ${isCompact ? 'scale-90 origin-top' : ''}`}
      >
        {/* Header / Visual Hook */}
        <div className={`${isCompact ? 'h-24' : 'h-40'} bg-[#F5F5F0] relative overflow-hidden flex items-center justify-center border-b border-[#E5E5E0]`}>
          <img 
            src={`https://s0.wp.com/mshots/v1/${encodeURIComponent(prospect.url.startsWith('http') ? prospect.url : `https://${prospect.url}`)}?w=640`} 
            alt="Website Preview" 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = 'flex flex-col items-center gap-2 text-[#8E9299]';
                fallback.innerHTML = `
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  <span class="text-[8px] font-mono uppercase tracking-widest">No Preview</span>
                `;
                parent.appendChild(fallback);
              }
            }}
          />
          {prospect.visualHookUrl && (
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
          )}
          <div className="absolute top-2 right-2 flex gap-1">
            {prospect.visualHookUrl && (
                <div className={`${isCompact ? 'p-1' : 'bg-[#FFCC00] p-1.5'} rounded-full text-black shadow-lg ${isCompact ? 'bg-[#FFCC00]' : ''}`} title="Hook IA Generado">
                    <Sparkles className={isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                </div>
            )}
            <span className={`px-2 py-0.5 rounded-full ${isCompact ? 'text-[8px]' : 'text-[10px]'} font-bold uppercase tracking-wider border ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
          </div>
        </div>

        <div className={isCompact ? 'p-4' : 'p-6'}>
          <div className={isCompact ? 'mb-3' : 'mb-6'}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className={`font-medium truncate ${isCompact ? 'text-sm' : 'text-xl'} leading-tight`}>
                {prospect.companyName || new URL(prospect.url).hostname}
              </h3>
              <a href={prospect.url} target="_blank" rel="noopener noreferrer" className={`p-1.5 hover:bg-[#F5F5F0] rounded-full transition-colors text-[#8E9299] ${isCompact ? 'scale-75' : ''}`}>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            
            <div className={`flex flex-wrap gap-1 ${isCompact ? 'mb-2' : 'mb-4'}`}>
              <span className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} text-[#8E9299] font-mono uppercase bg-[#F5F5F0] px-1.5 py-0.5 rounded`}>
                {prospect.sector || 'Pendiente'}
              </span>
              {prospect.keyMoment && (
                <span className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} text-blue-600 font-bold uppercase bg-blue-50 px-1.5 py-0.5 rounded`}>
                  ⚡ {prospect.keyMoment}
                </span>
              )}
            </div>

            {prospect.targetProduct && !isCompact && (
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 mb-2 group-hover:bg-orange-100 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1 px-2 bg-orange-200 text-orange-800 rounded text-[9px] font-bold uppercase tracking-wider">
                    Estrategia Elegida
                  </div>
                </div>
                <div className="text-sm font-semibold text-[#141414] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  {prospect.targetProduct}
                </div>
              </div>
            )}
          </div>

          {prospect.status === 'pending' ? (
            <button
              onClick={startAnalysis}
              disabled={isProcessing}
              className={`w-full ${isCompact ? 'py-2' : 'py-4'} bg-[#141414] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all text-xs`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>En Proceso...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  <span>Analizar</span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-2">
              {!isCompact && (
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div className="bg-[#F5F5F0] p-3 rounded-lg">
                    <span className="text-[10px] text-[#8E9299] uppercase block mb-1">ROI Potencial</span>
                    <span className="text-sm font-bold text-green-600">+{((prospect.opportunityLoss || 0) * 0.15).toLocaleString()}</span>
                  </div>
                  <div className="bg-[#F5F5F0] p-3 rounded-lg">
                    <span className="text-[10px] text-[#8E9299] uppercase block mb-1">Sentimiento</span>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400" style={{ width: `${(prospect.sentimentScore || 0) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button 
                onClick={() => setShowGhostMode(true)}
                className={`w-full ${isCompact ? 'py-2.5 text-[10px]' : 'py-4 text-xs'} bg-[#141414] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all group/btn shadow-lg hover:shadow-xl`}
              >
                <span>{isCompact ? 'Ver Protocolo' : 'Gestionar Protocolo'}</span>
                <ChevronRight className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} group-hover/btn:translate-x-1 transition-transform`} />
              </button>
              
              {!isCompact && (
                <button
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('lead', prospect.id);
                    window.location.href = url.toString();
                  }}
                  className="w-full py-2.5 border border-[#E5E5E0] text-[#141414] rounded-xl text-xs font-semibold hover:bg-white transition-all flex items-center justify-center gap-2 bg-[#F5F5F0]/50"
                >
                  <Target className="w-3.5 h-3.5" />
                  Ver Portal de Cliente
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {showGhostMode && (
        <GhostMode 
          prospect={prospect} 
          brandVoice={brandVoice}
          calendlyUrl={calendlyUrl}
          onClose={() => setShowGhostMode(false)} 
        />
      )}
    </>
  );
}
