// Utility functions
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function getStepTitle(step: string): string {
  const titles: Record<string, string> = {
    greeting: 'Selamat Datang',
    student_data: 'Data Siswa',
    parent_data: 'Data Orang Tua',
    academic_data: 'Data Akademik',
    document_upload: 'Upload Dokumen',
    confirmation: 'Konfirmasi',
    completed: 'Selesai',
  };
  return titles[step] || step;
}

export function getStepIcon(step: string): string {
  const icons: Record<string, string> = {
    greeting: '👋',
    student_data: '👤',
    parent_data: '👨‍👩‍👧',
    academic_data: '📚',
    document_upload: '📄',
    confirmation: '✅',
    completed: '🎉',
  };
  return icons[step] || '📋';
}

export function validateFile(file: File, maxSize: number = 5 * 1024 * 1024): {
  valid: boolean;
  error?: string;
} {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Format file tidak didukung. Gunakan PDF, JPG, atau PNG.',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Ukuran file terlalu besar. Maksimal ${maxSize / 1024 / 1024}MB.`,
    };
  }

  return { valid: true };
}

export function getFilePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function saveToLocalStorage(key: string, value: any): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export function getFromLocalStorage<T>(key: string): T | null {
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }
  return null;
}

export function removeFromLocalStorage(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
}
