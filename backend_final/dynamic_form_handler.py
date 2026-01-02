"""
Dynamic Conversational Form Handler
Works with JSON-based configuration - fully flexible!
"""

from typing import Dict, Any, Optional, List, Tuple
import json
import re
from datetime import datetime

from dynamic_conversation_state import (
    DynamicConversationState,
    DynamicStateManager
)
from form_config import get_form_config, FormConfigManager


class DynamicFormHandler:
    """
    Dynamic form handler yang bekerja dengan JSON configuration
    BENEFIT: Tambah/ubah field di form_config.json tanpa perlu ubah code!
    """
    
    def __init__(self, llm_client, state_manager: DynamicStateManager):
        self.llm = llm_client
        self.state_manager = state_manager
        self.form_config = get_form_config()
    
    def get_system_prompt(self, state: DynamicConversationState) -> str:
        """Generate dynamic system prompt based on current section"""
        
        base_prompt = """Anda adalah asisten virtual untuk proses pendaftaran siswa baru di YPI Al-Azhar Jakarta.

PRINSIP UTAMA:
1. SELALU baca dan ingat conversation history - jangan tanya ulang!
2. Gunakan bahasa Indonesia yang ramah dan natural
3. Tanyakan satu field dalam satu waktu
4. Konfirmasi data yang diterima
5. Jika user bilang "lanjut", "skip", "cukup" → langsung advance ke section berikutnya
6. JANGAN memaksa user mengisi semua field - prioritaskan UX yang smooth

"""
        
        # Get current section config
        section = state.get_current_section_config()
        if section:
            base_prompt += f"\n{'='*60}\n"
            base_prompt += f"SECTION SAAT INI: {section.label}\n"
            base_prompt += f"{'='*60}\n"
            
            if section.description:
                base_prompt += f"{section.description}\n\n"
            
            base_prompt += f"MINIMAL FIELDS REQUIRED: {section.required_fields}\n"
            base_prompt += f"SKIPPABLE: {'Ya' if section.skippable else 'Tidak'}\n\n"
            
            base_prompt += "FIELDS DI SECTION INI:\n"
            for field in section.fields:
                required_marker = "🔴 WAJIB" if field.required else "⚪ Optional"
                skip_marker = "(bisa skip)" if field.skippable else "(harus diisi)"
                base_prompt += f"  {required_marker} {field.label} - {field.type} {skip_marker}\n"
                if field.help_text:
                    base_prompt += f"     💡 {field.help_text}\n"
            
            base_prompt += f"\nINSTRUKSI:\n"
            base_prompt += f"- Minimal {section.required_fields} field harus diisi untuk lanjut\n"
            base_prompt += f"- Tanya field yang WAJIB dulu, baru optional\n"
            base_prompt += f"- Jika user kasih data, konfirmasi dan lanjut ke field berikutnya\n"
            base_prompt += f"- Jika user bilang 'lanjut/skip/cukup', cek apakah minimal sudah terpenuhi\n"
            base_prompt += f"- Maksimal 2-3 kalimat per response\n"
        
        # Add conversation history
        if state.conversation_history:
            base_prompt += f"\n{'='*60}\n"
            base_prompt += "CONTEXT PERCAKAPAN:\n"
            base_prompt += f"{'='*60}\n"
            recent = state.get_last_messages(5)
            for msg in recent:
                role = "User" if msg["role"] == "user" else "Bot"
                base_prompt += f"{role}: {msg['content']}\n"
        
        # Add collected data
        if state.collected_data:
            base_prompt += f"\n{'='*60}\n"
            base_prompt += "DATA YANG SUDAH TERKUMPUL:\n"
            base_prompt += f"{'='*60}\n"
            
            # Group by section
            for section in self.form_config.get_all_sections():
                section_data = state.get_data_for_section(section.name)
                if section_data:
                    base_prompt += f"\n{section.label}:\n"
                    for key, value in section_data.items():
                        base_prompt += f"  ✓ {key}: {value}\n"
        
        return base_prompt
    
    def get_extraction_prompt(self, state: DynamicConversationState, user_message: str) -> str:
        """Generate dynamic extraction prompt based on current section"""
        
        # Get current section fields
        section = state.get_current_section_config()
        if not section:
            return ""
        
        # Build field list for extraction
        field_list = []
        for field in section.fields:
            field_info = {
                "name": field.name,
                "label": field.label,
                "type": field.type,
                "required": field.required
            }
            if field.options:
                field_info["options"] = field.options
            field_list.append(field_info)
        
        # Include conversation context
        conversation_context = ""
        if state.conversation_history:
            recent = state.get_last_messages(3)
            conversation_context = "PERCAKAPAN TERAKHIR:\n"
            for msg in recent:
                role = "User" if msg["role"] == "user" else "Bot"
                conversation_context += f"{role}: {msg['content']}\n"
        
        prompt = f"""{conversation_context}

PESAN USER SAAT INI: "{user_message}"

SECTION: {section.label}

FIELDS YANG BISA DIEXTRACT:
{json.dumps(field_list, ensure_ascii=False, indent=2)}

INSTRUKSI EKSTRAKSI:
1. Baca conversation history - gunakan info dari percakapan sebelumnya
2. Extract informasi dari pesan user saat ini
3. Return dalam format JSON dengan field names yang sesuai
4. Hanya extract field yang relevan dengan section ini
5. Jika ada pilihan (options), normalize ke salah satu option yang valid

CONTOH:
User (sebelumnya): "Nama saya Budi"
User (sekarang): "Untuk TK Al Azhar Kebayoran"
Extract: {{
  "nama_sekolah": "TK Islam Al Azhar 1 Kebayoran Baru"
}}

User: "Playgroup, program Reguler"
Extract: {{
  "tingkatan": "Playgroup",
  "program": "Reguler"
}}

Return HANYA JSON, tanpa penjelasan.
"""
        return prompt
    
    async def process_message(
        self,
        session_id: str,
        user_message: str
    ) -> Tuple[str, DynamicConversationState]:
        """Process user message - fully dynamic!"""
        
        # Get or create state
        state = self.state_manager.get_session(session_id)
        if not state:
            state = self.state_manager.create_session(session_id)
        
        # Add user message to history
        state.add_message("user", user_message)
        
        # Check for skip keywords
        skip_keywords = ["lanjut", "skip", "sudah cukup", "cukup", "next", 
                        "selanjutnya", "gak usah", "tidak perlu", "langsung lanjut"]
        user_message_lower = user_message.lower()
        wants_to_skip = any(keyword in user_message_lower for keyword in skip_keywords)
        
        if wants_to_skip:
            # Check if can advance
            if state.can_advance_section():
                section_name = state.current_section
                state.advance_section()
                next_section = state.get_current_section_config()
                
                if next_section:
                    bot_response = f"Oke, kita lanjut ke {next_section.label}. {next_section.description or ''}"
                else:
                    bot_response = "Baik, semua data sudah lengkap!"
                
                state.add_message("assistant", bot_response)
                self.state_manager.update_session(session_id, state)
                return bot_response, state
            else:
                section = state.get_current_section_config()
                missing = state.get_missing_fields_for_section(state.current_section)
                bot_response = f"Untuk lanjut, minimal {section.required_fields} field harus diisi. Masih kurang: {', '.join(missing[:3])}"
                state.add_message("assistant", bot_response)
                self.state_manager.update_session(session_id, state)
                return bot_response, state
        
        # Extract information
        extracted_data = await self._extract_information(state, user_message)
        
        # Update state with extracted data
        for key, value in extracted_data.items():
            state.set_field(key, value)
        
        # Generate response
        bot_response = await self._generate_response(state, user_message, extracted_data)
        
        # Add bot response to history
        state.add_message("assistant", bot_response)
        
        # Check if should advance section
        if state.can_advance_section():
            # Section complete, tapi jangan auto-advance
            # Biarkan user yang bilang "lanjut"
            pass
        
        # Update state manager
        self.state_manager.update_session(session_id, state)
        
        return bot_response, state
    
    async def _extract_information(
        self,
        state: DynamicConversationState,
        user_message: str
    ) -> Dict[str, Any]:
        """Extract information using LLM"""
        
        extraction_prompt = self.get_extraction_prompt(state, user_message)
        
        response = await self.llm.generate(
            messages=[
                {"role": "system", "content": "Anda adalah expert ekstraksi informasi terstruktur."},
                {"role": "user", "content": extraction_prompt}
            ],
            temperature=0.1,
            max_tokens=500
        )
        
        # Parse JSON
        try:
            response_clean = response.strip()
            json_match = re.search(r'\{.*\}', response_clean, re.DOTALL)
            if json_match:
                extracted = json.loads(json_match.group())
                return extracted
            return {}
        except Exception as e:
            print(f"Extraction error: {e}")
            return {}
    
    async def _generate_response(
        self,
        state: DynamicConversationState,
        user_message: str,
        extracted_data: Dict[str, Any]
    ) -> str:
        """Generate contextual response"""
        
        system_prompt = self.get_system_prompt(state)
        
        # Build messages with history
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add recent history
        recent_history = state.get_last_messages(6)
        for msg in recent_history[:-1]:  # Exclude current user message
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
        section = state.get_current_section_config()
        missing_fields = state.get_missing_fields_for_section(state.current_section)
        can_advance = state.can_advance_section()
        
        section_data = state.get_data_for_section(state.current_section)
        filled_count = sum(1 for v in section_data.values() if v)
        
        instruction = f"""
DATA BARU YANG DIEXTRACT: {json.dumps(extracted_data, ensure_ascii=False)}

SECTION: {section.label if section else 'Unknown'}
MINIMAL REQUIRED: {section.required_fields if section else 0}
FILLED COUNT: {filled_count}
MISSING FIELDS: {missing_fields}

CAN ADVANCE: {"✅ YA - Sudah cukup untuk lanjut" if can_advance else "❌ BELUM - Masih kurang data"}

PROGRESS: {state.get_completion_percentage():.0f}%

INSTRUKSI RESPONSE:
1. Konfirmasi data yang baru diterima dengan natural
2. JANGAN tanya ulang info yang sudah ada
3. Jika CAN ADVANCE = YA:
   - Tawarkan untuk lanjut: "Apakah ingin menambahkan data lain, atau lanjut ke {section.label} berikutnya?"
   - Bisa juga langsung tanya field optional yang masih kosong (max 1 field)
4. Jika CAN ADVANCE = BELUM:
   - Tanya 1 field yang masih missing (prioritas yang WAJIB)
   - Kasih hint kalau bisa skip: "atau ketik 'lanjut' jika sudah cukup"
5. Maksimal 2-3 kalimat
6. Natural dan ramah
"""
        
        messages.append({"role": "user", "content": instruction})
        
        # Generate
        response = await self.llm.generate(
            messages=messages,
            temperature=0.7,
            max_tokens=300
        )
        
        return response.strip()


if __name__ == "__main__":
    print("Dynamic Form Handler - Ready!")
    print("Benefit: Ubah field di form_config.json tanpa perlu ubah code ini!")
