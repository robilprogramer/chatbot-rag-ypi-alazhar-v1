"""
LLM-Powered Conversational Form Handler
Menggunakan LLM untuk memandu proses pendaftaran secara interaktif
Sesuai dengan BAB 3.4.6 - Mode Transactional
"""

from typing import Dict, Any, Optional, List, Tuple
import json
import re
from datetime import datetime

from conversation_state import (
    ConversationState, 
    RegistrationStep,
    StateManager,
    StudentData,
    ParentData,
    AcademicData
)


class ConversationalFormHandler:
    """
    Handler untuk mengelola percakapan interaktif pendaftaran
    Teknik: Multi-turn conversation dengan LLM untuk mengekstrak data secara natural
    """
    
    def __init__(self, llm_client, state_manager: StateManager):
        """
        Args:
            llm_client: Client untuk memanggil LLM API
            state_manager: Manager untuk conversation state
        """
        self.llm = llm_client
        self.state_manager = state_manager
    
    def get_system_prompt(self, state: ConversationState) -> str:
        """
        Generate system prompt berdasarkan state saat ini
        Teknik: Dynamic prompt engineering berdasarkan context
        """
        
        base_prompt = """Anda adalah asisten virtual untuk proses pendaftaran siswa baru di YPI Al-Azhar Jakarta.
Tugas Anda adalah memandu calon siswa/orang tua melalui proses pendaftaran secara interaktif, ramah, dan profesional.

PRINSIP INTERAKSI:
1. Gunakan bahasa Indonesia yang sopan dan mudah dipahami
2. Tanyakan satu informasi dalam satu waktu untuk menghindari kebingungan
3. Berikan konfirmasi dan validasi untuk setiap input yang diterima
4. Jika pengguna memberikan informasi yang tidak valid, minta dengan sopan untuk mengulangi
5. Berikan panduan jelas tentang format data yang diharapkan
6. Jaga konteks percakapan sebelumnya

"""
        
        # Tambahkan context step saat ini
        step_context = self._get_step_context(state)
        base_prompt += step_context
        
        # Tambahkan data yang sudah dikumpulkan
        collected_data = self._get_collected_data_summary(state)
        if collected_data:
            base_prompt += f"\n\nDATA YANG SUDAH DIKUMPULKAN:\n{collected_data}"
        
        return base_prompt
    
    def _get_step_context(self, state: ConversationState) -> str:
        """Generate context berdasarkan step saat ini"""
        
        contexts = {
            RegistrationStep.GREETING: """
TAHAP SAAT INI: Sambutan Awal
- Sambut pengguna dengan ramah
- Jelaskan bahwa Anda akan membantu proses pendaftaran siswa baru
- Tanyakan jenjang pendidikan yang dituju (TK/SD/SMP/SMA)
- Tanyakan lokasi/cabang Al-Azhar yang diinginkan
- Setelah mendapat info jenjang dan lokasi, lanjut ke pengumpulan data siswa
""",
            
            RegistrationStep.STUDENT_DATA: """
TAHAP SAAT INI: Pengumpulan Data Siswa
Kumpulkan informasi berikut secara bertahap:
1. Nama lengkap siswa
2. Tempat lahir
3. Tanggal lahir (format: DD/MM/YYYY)
4. Jenis kelamin (Laki-laki/Perempuan)
5. Agama
6. Alamat lengkap
7. Nomor telepon siswa (jika ada)
8. Email siswa (jika ada)

INSTRUKSI:
- Tanyakan satu per satu, jangan sekaligus
- Validasi format tanggal lahir
- Konfirmasi setiap data yang diterima
- Setelah semua data lengkap, konfirmasi keseluruhan data siswa
""",
            
            RegistrationStep.PARENT_DATA: """
TAHAP SAAT INI: Pengumpulan Data Orang Tua/Wali
Kumpulkan informasi berikut:

Data Ayah:
1. Nama lengkap ayah
2. Pekerjaan ayah
3. Nomor telepon ayah

Data Ibu:
1. Nama lengkap ibu
2. Pekerjaan ibu
3. Nomor telepon ibu

Data Wali (jika ada):
1. Nama lengkap wali
2. Hubungan dengan siswa
3. Nomor telepon wali

INSTRUKSI:
- Mulai dari data ayah, lalu ibu
- Tanyakan apakah ada wali yang perlu didaftarkan
- Validasi format nomor telepon (minimal 10 digit)
""",
            
            RegistrationStep.ACADEMIC_DATA: """
TAHAP SAAT INI: Pengumpulan Data Akademik
Kumpulkan informasi berikut:
1. Nama sekolah asal
2. Alamat sekolah asal
3. Tahun lulus/akan lulus
4. Nilai rata-rata rapor terakhir
5. Prestasi akademik/non-akademik (jika ada)

INSTRUKSI:
- Untuk siswa TK, sesuaikan pertanyaan (tidak perlu nilai rata-rata)
- Prestasi bersifat opsional
- Jika pengguna menyebutkan beberapa prestasi sekaligus, catat semuanya
""",
            
            RegistrationStep.DOCUMENT_UPLOAD: """
TAHAP SAAT INI: Upload Dokumen Persyaratan
Dokumen yang diperlukan:
1. Akta kelahiran
2. Kartu keluarga
3. Foto siswa (3x4)
4. Ijazah terakhir (jika sudah lulus)
5. Rapor semester terakhir
6. Surat keterangan sehat

INSTRUKSI:
- Minta pengguna untuk upload satu dokumen dalam satu waktu
- Konfirmasi setiap dokumen yang diterima
- Informasikan dokumen apa saja yang masih kurang
- Untuk mode demo/prototype, cukup terima informasi bahwa file sudah diupload
""",
            
            RegistrationStep.CONFIRMATION: """
TAHAP SAAT INI: Konfirmasi Data
- Tampilkan ringkasan lengkap semua data yang telah dikumpulkan
- Tanyakan apakah ada data yang perlu diperbaiki
- Jika ada yang perlu diperbaiki, arahkan ke data yang relevan
- Jika sudah benar semua, informasikan estimasi biaya pendaftaran
- Minta konfirmasi untuk melanjutkan ke pembayaran
"""
        }
        
        return contexts.get(state.current_step, "")
    
    def _get_collected_data_summary(self, state: ConversationState) -> str:
        """Generate ringkasan data yang sudah dikumpulkan"""
        summary_parts = []
        
        # Student data
        student = state.student_data.dict()
        if any(v for v in student.values()):
            student_summary = "Data Siswa:\n"
            for key, value in student.items():
                if value:
                    field_name = key.replace('_', ' ').title()
                    student_summary += f"  - {field_name}: {value}\n"
            summary_parts.append(student_summary)
        
        # Parent data
        parent = state.parent_data.dict()
        if any(v for v in parent.values()):
            parent_summary = "Data Orang Tua:\n"
            for key, value in parent.items():
                if value:
                    field_name = key.replace('_', ' ').title()
                    parent_summary += f"  - {field_name}: {value}\n"
            summary_parts.append(parent_summary)
        
        # Academic data
        academic = state.academic_data.dict()
        if any(v for v in academic.values() if v and v != []):
            academic_summary = "Data Akademik:\n"
            for key, value in academic.items():
                if value and value != []:
                    field_name = key.replace('_', ' ').title()
                    academic_summary += f"  - {field_name}: {value}\n"
            summary_parts.append(academic_summary)
        
        return "\n".join(summary_parts)
    
    def get_extraction_prompt(self, state: ConversationState, user_message: str) -> str:
        """
        Generate prompt untuk ekstraksi informasi dari user message
        Teknik: Few-shot prompting untuk ekstraksi terstruktur
        """
        
        prompt = f"""Berdasarkan percakapan dan pesan pengguna, ekstrak informasi yang relevan.

PESAN PENGGUNA: "{user_message}"

TAHAP SAAT INI: {state.current_step}

FIELD YANG SEDANG DIKUMPULKAN: {state.current_field or "belum ada field spesifik"}

INSTRUKSI EKSTRAKSI:
1. Identifikasi informasi apa yang diberikan pengguna
2. Extract data dalam format JSON
3. Hanya extract field yang relevan dengan tahap saat ini
4. Jika ada multiple fields dalam satu pesan, extract semuanya
5. Jika data tidak valid atau tidak jelas, set ke null

CONTOH EKSTRAKSI:

Jika user berkata: "Nama saya Ahmad Fauzi, lahir di Jakarta tanggal 15 Mei 2010"
Output:
{{
  "nama_lengkap": "Ahmad Fauzi",
  "tempat_lahir": "Jakarta",
  "tanggal_lahir": "15/05/2010"
}}

Jika user berkata: "Ayah saya namanya Budi Santoso, bekerja sebagai guru, nomornya 081234567890"
Output:
{{
  "nama_ayah": "Budi Santoso",
  "pekerjaan_ayah": "Guru",
  "no_telepon_ayah": "081234567890"
}}

Sekarang extract dari pesan pengguna di atas. Return HANYA JSON, tanpa penjelasan tambahan.
"""
        return prompt
    
    async def process_message(
        self, 
        session_id: str, 
        user_message: str
    ) -> Tuple[str, ConversationState]:
        """
        Process user message dan generate response
        
        Args:
            session_id: ID session
            user_message: Pesan dari user
            
        Returns:
            Tuple of (bot_response, updated_state)
        """
        
        # Get or create state
        state = self.state_manager.get_session(session_id)
        if not state:
            state = self.state_manager.create_session(session_id)
        
        # Add user message to history
        state.add_message("user", user_message)
        
        # Extract information from user message
        extracted_data = await self._extract_information(state, user_message)
        
        # Update state dengan extracted data
        state = self._update_state_with_data(state, extracted_data)
        
        # Generate bot response
        bot_response = await self._generate_response(state, user_message, extracted_data)
        
        # Add bot response to history
        state.add_message("assistant", bot_response)
        
        # Update state manager
        self.state_manager.update_session(session_id, state)
        
        return bot_response, state
    
    async def _extract_information(
        self, 
        state: ConversationState, 
        user_message: str
    ) -> Dict[str, Any]:
        """
        Extract structured information dari user message menggunakan LLM
        Teknik: Structured output extraction dengan JSON mode
        """
        
        extraction_prompt = self.get_extraction_prompt(state, user_message)
        
        # Call LLM untuk extraction
        # Format sesuai dengan API LLM yang digunakan (misal: OpenAI, Anthropic, dll)
        response = await self.llm.generate(
            messages=[
                {"role": "system", "content": "Anda adalah expert dalam ekstraksi informasi terstruktur."},
                {"role": "user", "content": extraction_prompt}
            ],
            temperature=0.1,  # Low temperature untuk consistency
            max_tokens=500
        )
        
        # Parse JSON response
        try:
            extracted = json.loads(response.strip())
            return extracted
        except json.JSONDecodeError:
            # Fallback: coba extract JSON dari response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except:
                    pass
            return {}
    
    def _update_state_with_data(
        self, 
        state: ConversationState, 
        extracted_data: Dict[str, Any]
    ) -> ConversationState:
        """Update conversation state dengan extracted data"""
        
        if not extracted_data:
            return state
        
        # Update berdasarkan current step
        if state.current_step == RegistrationStep.STUDENT_DATA:
            for key, value in extracted_data.items():
                if hasattr(state.student_data, key) and value:
                    setattr(state.student_data, key, value)
        
        elif state.current_step == RegistrationStep.PARENT_DATA:
            for key, value in extracted_data.items():
                if hasattr(state.parent_data, key) and value:
                    setattr(state.parent_data, key, value)
        
        elif state.current_step == RegistrationStep.ACADEMIC_DATA:
            for key, value in extracted_data.items():
                if hasattr(state.academic_data, key) and value:
                    setattr(state.academic_data, key, value)
        
        # Check apakah step sudah complete
        if state.is_step_complete() and state.current_step not in [
            RegistrationStep.GREETING, 
            RegistrationStep.CONFIRMATION,
            RegistrationStep.COMPLETED
        ]:
            # Auto advance ke step berikutnya setelah konfirmasi
            pass  # Akan di-handle di generate_response
        
        return state
    
    async def _generate_response(
        self, 
        state: ConversationState, 
        user_message: str,
        extracted_data: Dict[str, Any]
    ) -> str:
        """
        Generate contextual response menggunakan LLM
        Teknik: Context-aware generation dengan conversation history
        """
        
        system_prompt = self.get_system_prompt(state)
        
        # Build conversation history untuk context
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add recent conversation history (last 10 messages)
        recent_history = state.conversation_history[-10:]
        for msg in recent_history:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # Add instruction untuk response generation
        missing_fields = state.get_missing_fields()
        
        instruction = f"""
Berdasarkan percakapan di atas, generate response yang sesuai.

DATA YANG BARU DIEKSTRAK: {json.dumps(extracted_data, ensure_ascii=False)}

MISSING FIELDS DI STEP INI: {missing_fields}

PROGRESS KELENGKAPAN: {state.get_completion_percentage():.1f}%

INSTRUKSI RESPONSE:
1. Jika data valid, berikan konfirmasi positif
2. Tanyakan field berikutnya yang masih missing
3. Jika semua field di step ini sudah lengkap, tawarkan untuk lanjut ke step berikutnya
4. Gunakan bahasa yang natural dan ramah
5. Jangan terlalu panjang, maksimal 3-4 kalimat
"""
        
        messages.append({"role": "user", "content": instruction})
        
        # Generate response
        response = await self.llm.generate(
            messages=messages,
            temperature=0.7,
            max_tokens=300
        )
        
        return response.strip()
    
    def validate_field(self, field_name: str, value: Any) -> Tuple[bool, Optional[str]]:
        """
        Validate field value
        Returns: (is_valid, error_message)
        """
        
        # Validasi tanggal
        if field_name == "tanggal_lahir":
            try:
                datetime.strptime(value, "%d/%m/%Y")
                return True, None
            except:
                return False, "Format tanggal tidak valid. Gunakan format DD/MM/YYYY"
        
        # Validasi nomor telepon
        if "telepon" in field_name or "no_" in field_name:
            if not re.match(r'^[\d\-\+\(\)\s]{10,}$', str(value)):
                return False, "Nomor telepon tidak valid. Minimal 10 digit"
        
        # Validasi email
        if field_name == "email":
            if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', value):
                return False, "Format email tidak valid"
        
        # Validasi jenis kelamin
        if field_name == "jenis_kelamin":
            if value.lower() not in ["laki-laki", "perempuan", "l", "p"]:
                return False, "Jenis kelamin harus 'Laki-laki' atau 'Perempuan'"
        
        return True, None
