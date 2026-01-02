"""
LLM-Powered Conversational Form Handler - IMPROVED VERSION
FOKUS:
1. Context-aware: Selalu membaca conversation history
2. Natural extraction: Ekstrak data dari percakapan natural
3. Progressive disclosure: Tanya satu-satu, tidak overwhelming
"""

from typing import Dict, Any, Optional, List, Tuple
import json
import re
from datetime import datetime

from conversation_state_v2 import (
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
    IMPROVED: Lebih context-aware dan natural
    """
    
    def __init__(self, llm_client, state_manager: StateManager):
        self.llm = llm_client
        self.state_manager = state_manager
    
    def get_system_prompt(self, state: ConversationState) -> str:
        """Generate system prompt berdasarkan state dan history"""
        
        base_prompt = """Anda adalah asisten virtual untuk proses pendaftaran siswa baru di YPI Al-Azhar Jakarta.

PRINSIP UTAMA:
1. SELALU baca dan ingat conversation history - jangan tanya ulang informasi yang sudah diberikan user
2. Gunakan bahasa Indonesia yang ramah, sopan, dan natural
3. Tanyakan satu informasi dalam satu waktu
4. Konfirmasi setiap data yang diterima sebelum lanjut
5. Jika user menyebutkan nama/info di percakapan sebelumnya, GUNAKAN informasi tersebut

CONTOH PERCAKAPAN YANG BAIK:
User: "Nama saya Ahmad"
Bot: "Baik Pak/Bu Ahmad, senang bisa membantu. Untuk anak yang mau didaftarkan, sekolah mana yang dituju?"

User: "TK Al Azhar Kebayoran Baru"
Bot: "Baik, untuk TK Al Azhar Kebayoran Baru. Tingkatannya untuk Playgroup, TK A, atau TK B?"

YANG HARUS DIHINDARI:
❌ Tanya ulang nama jika user sudah sebutkan
❌ Tanya terlalu banyak sekaligus
❌ Lupa context percakapan sebelumnya

"""
        
        # Tambahkan conversation history summary
        if state.conversation_history:
            history_summary = self._get_conversation_summary(state)
            base_prompt += f"\n\nCONTEXT PERCAKAPAN SEBELUMNYA:\n{history_summary}\n"
        
        # Tambahkan step context
        step_context = self._get_step_context(state)
        base_prompt += step_context
        
        # Tambahkan data yang sudah dikumpulkan
        collected_data = self._get_collected_data_summary(state)
        if collected_data:
            base_prompt += f"\n\nDATA YANG SUDAH TERKUMPUL:\n{collected_data}"
        
        return base_prompt
    
    def _get_conversation_summary(self, state: ConversationState) -> str:
        """Get summary of recent conversation"""
        if not state.conversation_history:
            return "Belum ada percakapan sebelumnya"
        
        recent = state.get_last_messages(5)
        summary_parts = []
        
        for msg in recent:
            role = "User" if msg["role"] == "user" else "Bot"
            summary_parts.append(f"{role}: {msg['content']}")
        
        return "\n".join(summary_parts)
    
    def _get_step_context(self, state: ConversationState) -> str:
        """Generate context berdasarkan step saat ini"""
        
        contexts = {
            RegistrationStep.GREETING: """
TAHAP: Sambutan & Identifikasi Sekolah
- Sambut user dengan ramah
- Jika user sudah menyebutkan nama, gunakan nama tersebut
- Tanyakan sekolah mana yang dituju (contoh: "TK Islam Al Azhar 1 Kebayoran Baru")
- Tanyakan tingkatan (Playgroup, TK A, TK B, Kelas 1-12)
- Tanyakan program (Reguler/Bilingual)
""",
            
            RegistrationStep.SCHOOL_INFO: """
TAHAP: Informasi Sekolah Detail
Lengkapi informasi berikut:
- Nama sekolah lengkap (e.g., "TK Islam Al Azhar 1 Kebayoran Baru")
- Tahun ajaran (e.g., "2026/2027")
- Program (Reguler/Bilingual)
- Tingkatan (Playgroup, TK A, TK B, Kelas 1-6, dst)
- Kelas yang dituju (akan disesuaikan)
- Gelombang pendaftaran

INSTRUKSI:
- Gunakan data dari percakapan sebelumnya jika sudah disebutkan
- Jangan tanya ulang info yang sudah ada
""",
            
            RegistrationStep.STUDENT_DATA: """
TAHAP: Data Siswa
Kumpulkan:
1. Nama lengkap siswa (PENTING: Jika user sudah sebutkan, gunakan!)
2. Tempat lahir
3. Tanggal lahir (DD/MM/YYYY)
4. Jenis kelamin
5. Agama
6. Alamat

INSTRUKSI:
- Jika ada nama di conversation history, JANGAN tanya ulang
- Konfirmasi setiap data
- Tanya satu per satu
""",
            
            RegistrationStep.PARENT_DATA: """
TAHAP: Data Orang Tua
Kumpulkan data ayah dan ibu (tidak harus lengkap semua):

MINIMAL YANG DIBUTUHKAN:
- Nama ayah ATAU ibu (salah satu saja cukup)
- Nomor telepon ayah ATAU ibu (salah satu saja cukup)

Data lengkap yang bisa dikumpulkan:
- Nama lengkap ayah/ibu
- Pekerjaan ayah/ibu
- Nomor telepon ayah/ibu

INSTRUKSI PENTING:
- Jangan terlalu memaksa user untuk kasih semua data
- Jika user sudah kasih nama ayah dan nomor telepon ayah, itu CUKUP untuk lanjut
- Tanyakan: "Apakah ingin menambahkan data ibu juga, atau sudah cukup?"
- Jika user bilang "sudah cukup" atau "lanjut saja", LANGSUNG lanjut ke tahap berikutnya
- JANGAN stuck di tahap ini, prioritaskan user experience

CONTOH YANG BAIK:
User: "Nama ayah Budi Santoso, nomornya 081234567890"
Bot: "Baik, sudah saya catat data ayah. Apakah ingin menambahkan data ibu juga, atau langsung lanjut ke tahap berikutnya?"
User: "Lanjut saja"
Bot: "Oke, kita lanjut ke data akademik..."
""",
            
            RegistrationStep.ACADEMIC_DATA: """
TAHAP: Data Akademik
Kumpulkan:
- Nama sekolah asal
- Tahun lulus/akan lulus

INSTRUKSI:
- Untuk TK, sesuaikan pertanyaan (mungkin belum ada sekolah asal)
""",
            
            RegistrationStep.DOCUMENT_UPLOAD: """
TAHAP: Upload Dokumen
Informasikan dokumen yang diperlukan:
- Akta kelahiran
- Kartu keluarga
- Foto siswa
- Ijazah/Rapor terakhir

INSTRUKSI:
- Panduan cara upload
- Konfirmasi dokumen yang sudah diupload
""",
            
            RegistrationStep.CONFIRMATION: """
TAHAP: Konfirmasi Akhir
- Tampilkan ringkasan semua data
- Tanyakan konfirmasi
- Informasikan next steps
"""
        }
        
        return contexts.get(state.current_step, "")
    
    def _get_collected_data_summary(self, state: ConversationState) -> str:
        """Generate ringkasan data yang sudah dikumpulkan"""
        summary_parts = []
        
        # Student data
        student = state.student_data.dict()
        filled_student = {k: v for k, v in student.items() if v}
        if filled_student:
            student_summary = "Data Siswa:\n"
            for key, value in filled_student.items():
                field_name = key.replace('_', ' ').title()
                student_summary += f"  ✓ {field_name}: {value}\n"
            summary_parts.append(student_summary)
        
        # Parent data
        parent = state.parent_data.dict()
        filled_parent = {k: v for k, v in parent.items() if v}
        if filled_parent:
            parent_summary = "Data Orang Tua:\n"
            for key, value in filled_parent.items():
                field_name = key.replace('_', ' ').title()
                parent_summary += f"  ✓ {field_name}: {value}\n"
            summary_parts.append(parent_summary)
        
        # Academic data
        academic = state.academic_data.dict()
        filled_academic = {k: v for k, v in academic.items() if v and v != []}
        if filled_academic:
            academic_summary = "Data Akademik:\n"
            for key, value in filled_academic.items():
                field_name = key.replace('_', ' ').title()
                academic_summary += f"  ✓ {field_name}: {value}\n"
            summary_parts.append(academic_summary)
        
        return "\n".join(summary_parts)
    
    def get_extraction_prompt(self, state: ConversationState, user_message: str) -> str:
        """Generate prompt untuk ekstraksi informasi"""
        
        # Include conversation context untuk extraction
        conversation_context = ""
        if state.conversation_history:
            recent = state.get_last_messages(3)
            conversation_context = "PERCAKAPAN TERAKHIR:\n"
            for msg in recent:
                role = "User" if msg["role"] == "user" else "Bot"
                conversation_context += f"{role}: {msg['content']}\n"
        
        prompt = f"""{conversation_context}

PESAN USER SAAT INI: "{user_message}"

TAHAP: {state.current_step}

INSTRUKSI EKSTRAKSI:
1. Baca conversation history - jika user pernah menyebutkan nama atau info, GUNAKAN
2. Extract informasi dari pesan user saat ini
3. Return dalam format JSON
4. Hanya extract field yang relevan dengan tahap saat ini

CONTOH:
User sebelumnya: "Nama saya Budi"
User sekarang: "Untuk anak saya"
Extract: {{"nama_lengkap": "Budi"}} // Gunakan nama dari history

User: "TK Al Azhar Kebayoran, untuk Playgroup, program Reguler"
Extract: {{
  "nama_sekolah": "TK Islam Al Azhar 1 Kebayoran Baru",
  "tingkatan": "Playgroup",
  "program": "Reguler"
}}

Return HANYA JSON, no explanation.
"""
        return prompt
    
    async def process_message(
        self, 
        session_id: str, 
        user_message: str
    ) -> Tuple[str, ConversationState]:
        """Process user message dan generate response"""
        
        # Get or create state
        state = self.state_manager.get_session(session_id)
        if not state:
            state = self.state_manager.create_session(session_id)
        
        # Add user message to history FIRST
        state.add_message("user", user_message)
        
        # Check untuk keywords yang indicate user ingin lanjut/skip
        skip_keywords = ["lanjut", "skip", "sudah cukup", "cukup", "next", "selanjutnya", "gak usah", "tidak perlu", "langsung lanjut"]
        user_message_lower = user_message.lower()
        wants_to_skip = any(keyword in user_message_lower for keyword in skip_keywords)
        
        if wants_to_skip and state.current_step in [RegistrationStep.PARENT_DATA, RegistrationStep.ACADEMIC_DATA]:
            # Force advance jika user bilang ingin lanjut
            if state.current_step == RegistrationStep.PARENT_DATA:
                has_minimal = (state.parent_data.nama_ayah or state.parent_data.nama_ibu) and \
                             (state.parent_data.no_telepon_ayah or state.parent_data.no_telepon_ibu)
                if has_minimal:
                    state.current_step = RegistrationStep.ACADEMIC_DATA
                    bot_response = "Baik, kita lanjut ke data akademik. Anak sebelumnya bersekolah dimana?"
                    state.add_message("assistant", bot_response)
                    self.state_manager.update_session(session_id, state)
                    return bot_response, state
            
            elif state.current_step == RegistrationStep.ACADEMIC_DATA:
                # Untuk academic data, bisa skip jika TK
                if state.student_data.tingkatan in ["Playgroup", "TK A", "TK B"]:
                    state.current_step = RegistrationStep.DOCUMENT_UPLOAD
                    bot_response = "Oke, kita lanjut ke tahap upload dokumen. Nanti Anda bisa upload dokumen seperti akta kelahiran, kartu keluarga, dan foto siswa."
                    state.add_message("assistant", bot_response)
                    self.state_manager.update_session(session_id, state)
                    return bot_response, state
        
        # Extract information with full context
        extracted_data = await self._extract_information(state, user_message)
        
        # Update state dengan extracted data
        state = self._update_state_with_data(state, extracted_data)
        
        # Generate bot response with full context
        bot_response = await self._generate_response(state, user_message, extracted_data)
        
        # Add bot response to history
        state.add_message("assistant", bot_response)
        
        # Check if should advance step
        state = self._check_and_advance_step(state)
        
        # Update state manager
        self.state_manager.update_session(session_id, state)
        
        return bot_response, state
    
    async def _extract_information(
        self, 
        state: ConversationState, 
        user_message: str
    ) -> Dict[str, Any]:
        """Extract structured information dengan full context"""
        
        extraction_prompt = self.get_extraction_prompt(state, user_message)
        
        response = await self.llm.generate(
            messages=[
                {"role": "system", "content": "Anda adalah expert dalam ekstraksi informasi terstruktur dengan mempertimbangkan context percakapan."},
                {"role": "user", "content": extraction_prompt}
            ],
            temperature=0.1,
            max_tokens=500
        )
        
        # Parse JSON response
        try:
            # Clean response
            response_clean = response.strip()
            # Try to find JSON in response
            json_match = re.search(r'\{.*\}', response_clean, re.DOTALL)
            if json_match:
                extracted = json.loads(json_match.group())
                return extracted
            return {}
        except Exception as e:
            print(f"Extraction error: {e}")
            return {}
    
    def _update_state_with_data(
        self, 
        state: ConversationState, 
        extracted_data: Dict[str, Any]
    ) -> ConversationState:
        """Update conversation state dengan extracted data"""
        
        if not extracted_data:
            return state
        
        # Update berdasarkan field mapping
        for key, value in extracted_data.items():
            if not value:
                continue
                
            # Check in student_data
            if hasattr(state.student_data, key):
                setattr(state.student_data, key, value)
            
            # Check in parent_data
            elif hasattr(state.parent_data, key):
                setattr(state.parent_data, key, value)
            
            # Check in academic_data
            elif hasattr(state.academic_data, key):
                setattr(state.academic_data, key, value)
        
        return state
    
    def _check_and_advance_step(self, state: ConversationState) -> ConversationState:
        """Check if should advance to next step - IMPROVED with flexible logic"""
        
        # Logic untuk advance step - lebih flexible
        if state.current_step == RegistrationStep.GREETING:
            # Advance jika sudah ada nama sekolah ATAU tingkatan
            if state.student_data.nama_sekolah or state.student_data.tingkatan:
                state.current_step = RegistrationStep.SCHOOL_INFO
        
        elif state.current_step == RegistrationStep.SCHOOL_INFO:
            # Advance jika school info cukup lengkap (minimal 2 dari 3 field)
            filled_count = sum([
                bool(state.student_data.nama_sekolah),
                bool(state.student_data.tingkatan),
                bool(state.student_data.program)
            ])
            if filled_count >= 2:
                state.current_step = RegistrationStep.STUDENT_DATA
        
        elif state.current_step == RegistrationStep.STUDENT_DATA:
            # Advance jika data siswa minimal ada nama lengkap
            # Tidak perlu semua field lengkap dulu
            if state.student_data.nama_lengkap:
                # Cek berapa banyak field yang sudah terisi
                filled_fields = sum([
                    bool(state.student_data.nama_lengkap),
                    bool(state.student_data.tanggal_lahir),
                    bool(state.student_data.jenis_kelamin),
                    bool(state.student_data.tempat_lahir),
                    bool(state.student_data.alamat)
                ])
                # Minimal 3 field terisi
                if filled_fields >= 3:
                    state.current_step = RegistrationStep.PARENT_DATA
        
        elif state.current_step == RegistrationStep.PARENT_DATA:
            # Advance jika minimal ada nama ayah ATAU ibu (tidak perlu keduanya)
            # Dan ada minimal 1 nomor telepon
            has_parent = bool(state.parent_data.nama_ayah) or bool(state.parent_data.nama_ibu)
            has_phone = bool(state.parent_data.no_telepon_ayah) or bool(state.parent_data.no_telepon_ibu)
            
            if has_parent and has_phone:
                state.current_step = RegistrationStep.ACADEMIC_DATA
        
        elif state.current_step == RegistrationStep.ACADEMIC_DATA:
            # Advance jika ada sekolah asal (untuk TK bisa skip)
            # Atau jika user bilang belum sekolah
            if state.academic_data.nama_sekolah_asal or state.student_data.tingkatan in ["Playgroup", "TK A"]:
                state.current_step = RegistrationStep.DOCUMENT_UPLOAD
        
        elif state.current_step == RegistrationStep.DOCUMENT_UPLOAD:
            # Advance to confirmation jika minimal 1 dokumen uploaded
            doc_dict = state.documents.dict()
            has_document = any(v for v in doc_dict.values())
            if has_document:
                state.current_step = RegistrationStep.CONFIRMATION
        
        return state
    
    async def _generate_response(
        self, 
        state: ConversationState, 
        user_message: str,
        extracted_data: Dict[str, Any]
    ) -> str:
        """Generate contextual response"""
        
        system_prompt = self.get_system_prompt(state)
        
        # Build messages with full history
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history (last 6 messages for context)
        recent_history = state.get_last_messages(6)
        for msg in recent_history[:-1]:  # Exclude the last one (current user message)
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Add instruction
        missing_fields = state.get_missing_fields()
        
        # Check readiness to advance
        can_advance = False
        if state.current_step == RegistrationStep.PARENT_DATA:
            has_parent = bool(state.parent_data.nama_ayah) or bool(state.parent_data.nama_ibu)
            has_phone = bool(state.parent_data.no_telepon_ayah) or bool(state.parent_data.no_telepon_ibu)
            can_advance = has_parent and has_phone
        elif state.current_step == RegistrationStep.STUDENT_DATA:
            filled = sum([
                bool(state.student_data.nama_lengkap),
                bool(state.student_data.tanggal_lahir),
                bool(state.student_data.jenis_kelamin)
            ])
            can_advance = filled >= 2
        
        instruction = f"""
DATA BARU YANG DIEXTRACT: {json.dumps(extracted_data, ensure_ascii=False)}

FIELD YANG MASIH MISSING: {missing_fields}

PROGRESS: {state.get_completion_percentage():.0f}%

READY TO ADVANCE: {"YA - Data sudah cukup untuk lanjut" if can_advance else "BELUM - Masih butuh beberapa field"}

INSTRUKSI RESPONSE:
1. Konfirmasi data yang baru diterima dengan natural
2. JANGAN tanya ulang info yang sudah ada
3. PRIORITASKAN user experience - jangan memaksa semua field
4. Jika READY TO ADVANCE = YA:
   - Informasikan bahwa data sudah cukup
   - TAWARKAN untuk lanjut: "Apakah ingin menambahkan data lain, atau langsung lanjut?"
   - Jika user bilang "lanjut" atau "cukup", sistem akan otomatis lanjut
5. Jika READY TO ADVANCE = BELUM:
   - Tanya 1 field penting yang masih missing
   - Beri opsi skip: "atau jika tidak ada bisa langsung lanjut"
6. Maksimal 2-3 kalimat, natural dan ramah
7. JANGAN STUCK di satu tahap - prioritaskan flow yang smooth
"""
        
        messages.append({"role": "user", "content": instruction})
        
        # Generate response
        response = await self.llm.generate(
            messages=messages,
            temperature=0.7,
            max_tokens=300
        )
        
        return response.strip()