
export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export enum Model {
  // FIX: Updated to non-deprecated Gemini model names.
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-2.5-pro',
}

export type Attachment = {
  name: string;
  type: 'image';
  file: File;
};

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  attachment?: Attachment;
  isLoading?: boolean;
  isError?: boolean;
}

export interface CsvData {
    id: string;
    data: Record<string, any>[];
}
