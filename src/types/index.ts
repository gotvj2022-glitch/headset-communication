export type UserRole = 'Ground' | 'Cockpit';
export type PracticeMode = 'scenario' | 'free' | 'exam';
export type StudentLevel = 'beginner' | 'intermediate' | 'advanced';

export type EvaluationGrade = 'not_passed' | 'passed' | 'good';

export interface MispronouncedWord {
  word: string;
  severity?: 'minor' | 'major';
  tip: string;
  correctIcao?: string;
}

export interface EvaluationResult {
  overallScore: number;
  pronunciationScore: number;
  phraseologyScore: number;
  grade: EvaluationGrade;
  isPassed: boolean;
  requiresRetry: boolean;
  transcribedText: string;
  understoodAs?: string;
  phoneticToleranceApplied?: string;
  mispronouncedWords: MispronouncedWord[];
  strengths: string[];
  improvements: string[];
  rubricLevel: string;
  feedbackSummary: string;
  matchedStep?: boolean;
  similarity?: number;
  currentPairIndex?: number;
  modelUsed?: string;
  rawTranscription?: string;
  assistantReply?: string;
  replyAudioBase64?: string;
  grammarScore?: number;
  vocabularyScore?: number;
  templateScore?: number;
  difficulty?: string;
}

export function getPassingThreshold(level: StudentLevel): number {
  switch (level) {
    case 'beginner':
      return 30; // Mức 1: Cơ bản > 30%
    case 'intermediate':
      return 50; // Mức 2: Tiêu chuẩn huấn luyện > 50%
    case 'advanced':
      return 70; // Mức 3: Đạt chuẩn đầu ra > 70%
    default:
      return 50;
  }
}

export interface ChatMessage {
  id: string;
  sender: 'Cockpit' | 'Ground';
  isUser: boolean;
  text: string;
  vietnamese?: string;
  audioUrl?: string;
  audioBase64?: string;
  evaluation?: EvaluationResult;
  timestamp: number;
  prowords?: string[];
  pairIndex?: number;
  isRetryAttempt?: boolean;
}

export interface PracticeSessionHistory {
  id: string;
  date: string;
  timestamp: number;
  scenarioId: string;
  scenarioTitle: string;
  practiceMode: PracticeMode;
  userRole: UserRole;
  studentLevel: StudentLevel;
  overallScore: number;
  totalPairsCompleted: number;
  messages: ChatMessage[];
  grade: EvaluationGrade;
  rubricLevel: string;
}

export type LocalAiProvider = 'ollama' | 'lmstudio' | 'vllm' | 'docker' | 'openwebui' | 'custom';

export interface LocalAiConfig {
  enabled: boolean;
  provider: LocalAiProvider;
  endpoint: string; // e.g. http://172.30.115.239:8090/api, http://localhost:11434/v1 or http://localhost:8081/v1
  model: string; // e.g. qwen2.5:3b, localai, or model name in Open WebUI
  apiKey?: string;
  temperature?: number;
  dockerOfflineEnabled?: boolean;
  whisperEndpoint?: string; // e.g. http://172.30.115.239:8000/v1 or http://localhost:8000/v1
  whisperModel?: string; // e.g. Systran/faster-whisper-small or whisper-1
  localAiTtsEndpoint?: string; // e.g. http://172.30.115.239:8081/v1 or http://localhost:8081/v1
  localAiTtsVoice?: string; // e.g. en-us-male or default
  lanHostIp?: string; // e.g. '172.30.115.239' (Server IP on WiFi) or 'localhost'
  openWebUiEndpoint?: string; // e.g. 'http://172.30.115.239:8090/api'
}


