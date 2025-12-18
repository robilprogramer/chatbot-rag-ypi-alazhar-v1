// config/quick-questions.ts

import { QuickQuestionsConfig } from '@/types/chatbot';

export const quickQuestions: QuickQuestionsConfig = {
  informational: [
    {
      id: 'q1',
      question: 'Berapa biaya SD di Pulogadung?',
      category: 'Biaya Pendidikan'
    },
    {
      id: 'q2',
      question: 'Apa saja fasilitas di SMP Al-Azhar Kemang?',
      category: 'Fasilitas'
    },
    {
      id: 'q3',
      question: 'Kapan pendaftaran siswa baru dibuka?',
      category: 'Pendaftaran'
    },
    {
      id: 'q4',
      question: 'Bagaimana cara mendaftar online?',
      category: 'Pendaftaran'
    },
    {
      id: 'q5',
      question: 'Apa persyaratan masuk SMA Al-Azhar?',
      category: 'Persyaratan'
    },
    {
      id: 'q6',
      question: 'Berapa biaya SPP per bulan di TK?',
      category: 'Biaya Pendidikan'
    },
  ],
  transactional: [
    {
      id: 't1',
      question: 'Saya ingin mendaftar siswa baru',
      category: 'Pendaftaran'
    },
    {
      id: 't2',
      question: 'Ajukan beasiswa untuk anak saya',
      category: 'Beasiswa'
    },
    {
      id: 't3',
      question: 'Jadwalkan kunjungan sekolah',
      category: 'Kunjungan'
    },
    {
      id: 't4',
      question: 'Hubungi bagian administrasi',
      category: 'Kontak'
    },
  ],
};