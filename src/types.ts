export interface Referral {
  id: string;
  referralNumber: number;
  patientInfo: {
    name: string;
    age: number;
    gender: string;
  };
  symptoms: string[];
  duration: string;
  redFlags: string[];
  fullText: string;
  assessment?: ReferralAssessment;
  isStreaming?: boolean; // True while assessment text is being generated
  streamingText?: string; // Partial assessment text during streaming
}

export interface ReferralAssessment {
  keySummary: string;
  tentativeDiagnosis: string;
  differentialDiagnoses?: string[]; // Optional - bare hvis relevant
  guidelineDescription?: {
    // Omtale i prioriteringsveileder for aksepterte henvisninger
    conditions: Array<{
      icon: string; // Emoji som 🦵, 🦶, 🦴, etc.
      name: string; // F.eks. "Rotatorcuff-ruptur (skulder)"
      source: string; // F.eks. "Kap. 2.22 Rotatorcuff skade"
      deadlines: string[]; // F.eks. ["Traumatisk ruptur: Veiledende frist 12 uker"]
      rightToHealthcare: boolean; // Rett til nødvendig helsehjelp
      comment?: string; // Valgfri kommentar
    }>;
  };
  priorityGroup: 'red' | 'orange' | 'green' | 'rejected';
  rejection?: {
    wrongSpecialty?: boolean; // True hvis henvisningen tilhører et annet fagfelt
    correctSpecialty?: string; // Riktig fagfelt (f.eks. "Nevrologi", "Revmatologi")
    missingInformation: string[]; // Hva som mangler
    expectedPrimaryCareActions: string[]; // Forventet tiltak i primærhelsetjenesten (tidligere primaryCareActions)
  };
}

export type PriorityGroup = 'red' | 'orange' | 'green' | 'rejected';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}
