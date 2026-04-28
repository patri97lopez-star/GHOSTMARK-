export interface Prospect {
  id: string;
  url: string;
  companyName?: string;
  contactEmail?: string;
  linkedInUrl?: string;
  sentimentScore?: number;
  opportunityLoss?: number;
  sector?: string;
  status: 'pending' | 'enriched' | 'analyzed' | 'validated' | 'sent' | 'rejected';
  visualHookUrl?: string;
  videoUrl?: string;
  videoScript?: {
    script: string;
    avatarInstructions: string;
  };
  competitorAnalysis?: {
    competitors: { name: string; weakness: string; url?: string }[];
  };
  socialStrategy?: {
    platform: string;
    ideas: string[];
  }[];
  seoAnalysis?: {
    keywords: string[];
    metaDescription: string;
  };
  sentimentAnalysis?: {
    score: number;
    label: string;
    summary: string;
  };
  proposal?: string;
  keyMoment?: string;
  targetProduct?: 'Ideas de Market / Eslogan / Logo' | 'Follet (Folleto) / Newsletter o Mailing' | 'RRSS (Redes Sociales) / Banner';
  newsletter?: {
    subject: string;
    content: string;
    cta: string;
    productHighlight: string;
    generatedAt: any;
  };
  validatedBy?: string;
  ownerId: string;
  createdAt: any;
  updatedAt: any;
}

export interface UserSettings {
  calendlyUrl?: string;
  slackWebhook?: string;
  whatsappNumber?: string;
  brandVoice?: string;
}

export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  createdAt: any;
}
