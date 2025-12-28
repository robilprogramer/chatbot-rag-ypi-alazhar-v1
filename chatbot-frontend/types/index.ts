// Type definitions for YPI Al-Azhar Chatbot

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    current_step?: string;
    completion_percentage?: number;
    missing_fields?: string[];
  };
}

export interface ChatResponse {
  session_id: string;
  response: string;
  current_step: string;
  completion_percentage: number;
  metadata: {
    intent?: string;
    missing_fields?: string[];
    is_step_complete?: boolean;
  };
}

export interface SessionInfo {
  session_id: string;
  current_step: string;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
  student_data: StudentData;
  parent_data: ParentData;
  academic_data: AcademicData;
}

export interface StudentData {
  nama_lengkap?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  agama?: string;
  alamat?: string;
  no_telepon?: string;
  email?: string;
  jenjang_tujuan?: string;
  cabang_tujuan?: string;
}

export interface ParentData {
  nama_ayah?: string;
  pekerjaan_ayah?: string;
  no_telepon_ayah?: string;
  nama_ibu?: string;
  pekerjaan_ibu?: string;
  no_telepon_ibu?: string;
  nama_wali?: string;
  hubungan_wali?: string;
  no_telepon_wali?: string;
}

export interface AcademicData {
  nama_sekolah_asal?: string;
  alamat_sekolah_asal?: string;
  tahun_lulus?: string;
  nilai_rata_rata?: string;
  prestasi?: string[];
}

export interface RegistrationSummary {
  registration_number?: string;
  student_name: string;
  jenjang: string;
  cabang: string;
  status: string;
  completion_percentage: number;
  estimated_cost?: number;
}

export interface DocumentUpload {
  document_type: string;
  file: File;
  preview?: string;
}

export type RegistrationStep = 
  | 'greeting'
  | 'student_data'
  | 'parent_data'
  | 'academic_data'
  | 'document_upload'
  | 'confirmation'
  | 'completed';

export interface StepInfo {
  step: RegistrationStep;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
}
