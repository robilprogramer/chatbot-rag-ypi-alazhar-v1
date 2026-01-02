// lib/constants.ts

export const JENJANG_OPTIONS = [
  { value: '', label: 'Semua Jenjang' },
  { value: 'TK', label: 'TK' },
  { value: 'SD', label: 'SD' },
  { value: 'SMP', label: 'SMP' },
  { value: 'SMA', label: 'SMA' },
  { value: 'ALL', label: 'Semua (ALL)' },
];

export const KATEGORI_OPTIONS = [
  { value: '', label: 'Semua Kategori' },
  { value: 'biaya', label: 'Biaya' },
  { value: 'persyaratan', label: 'Persyaratan' },
  { value: 'jadwal', label: 'Jadwal' },
  { value: 'kurikulum', label: 'Kurikulum' },
  { value: 'fasilitas', label: 'Fasilitas' },
  { value: 'prosedur', label: 'Prosedur' },
  { value: 'beasiswa', label: 'Beasiswa' },
  { value: 'profil', label: 'Profil' },
  { value: 'peraturan', label: 'Peraturan' },
  { value: 'lainnya', label: 'Lainnya' },
];

export const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'uploaded', label: 'Uploaded' },
  { value: 'parsing', label: 'Parsing' },
  { value: 'parsed', label: 'Parsed' },
  { value: 'staging', label: 'Staging' },
  { value: 'approved', label: 'Approved' },
  { value: 'processing', label: 'Processing' },
  { value: 'live', label: 'Live' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
];

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  text: 'Teks',
  table: 'Tabel',
  image: 'Gambar',
  manual: 'Manual',
};

export const STATUS_COLORS: Record<string, string> = {
  uploaded: 'badge-gray',
  parsing: 'badge-yellow',
  parsed: 'badge-blue',
  staging: 'badge-yellow',
  approved: 'badge-green',
  processing: 'badge-yellow',
  live: 'badge-green',
  rejected: 'badge-red',
  archived: 'badge-gray',
  error: 'badge-red',
};

export const TAHUN_OPTIONS = [
  { value: '', label: 'Semua Tahun' },
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
  { value: '2026', label: '2026' },
];

export const CABANG_OPTIONS = [
  { value: '', label: 'Semua Cabang' },
  { value: 'Kelapa Gading', label: 'Kelapa Gading' },
  { value: 'BSD', label: 'BSD' },
  { value: 'Kemang', label: 'Kemang' },
  { value: 'Cibubur', label: 'Cibubur' },
  { value: 'Bekasi', label: 'Bekasi' },
];
