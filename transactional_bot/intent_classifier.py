"""
Intent Classifier
Mengklasifikasikan intent user: informational vs transactional
Sesuai dengan Application Layer - Intent Classification
"""

from typing import Literal
from conversation_state import ConversationState, RegistrationStep
import re


class IntentClassifier:
    """
    Classifier untuk menentukan apakah user query bersifat:
    - informational: mencari informasi (gunakan RAG)
    - transactional: ingin melakukan pendaftaran
    """
    
    def __init__(self, llm_client):
        self.llm = llm_client
        
        # Keyword patterns untuk quick classification
        self.transactional_keywords = [
            "daftar", "pendaftaran", "register", "mendaftar",
            "ikut program", "masuk", "bergabung", "form",
            "formulir", "upload dokumen", "bayar", "pembayaran"
        ]
        
        self.informational_keywords = [
            "berapa biaya", "apa saja", "bagaimana", "kapan",
            "dimana", "info", "informasi", "tanya", "cari tahu",
            "jelaskan", "fasilitas", "syarat", "persyaratan"
        ]
    
    async def classify(
        self, 
        message: str, 
        state: ConversationState
    ) -> Literal["informational", "transactional"]:
        """
        Classify user intent
        
        Strategy:
        1. Jika sudah dalam transactional flow -> tetap transactional
        2. Quick keyword matching
        3. LLM-based classification untuk ambiguous cases
        """
        
        # Rule 1: Jika sudah dalam transactional flow, tetap transactional
        if state.current_step != RegistrationStep.GREETING:
            return "transactional"
        
        # Rule 2: Quick keyword matching
        message_lower = message.lower()
        
        # Check transactional keywords
        for keyword in self.transactional_keywords:
            if keyword in message_lower:
                return "transactional"
        
        # Check informational keywords
        has_info_keyword = any(kw in message_lower for kw in self.informational_keywords)
        
        # Jika jelas informational
        if has_info_keyword and not any(kw in message_lower for kw in self.transactional_keywords):
            return "informational"
        
        # Rule 3: LLM-based classification untuk ambiguous cases
        return await self._llm_classify(message, state)
    
    async def _llm_classify(
        self, 
        message: str, 
        state: ConversationState
    ) -> Literal["informational", "transactional"]:
        """
        LLM-based intent classification
        Teknik: Few-shot classification dengan clear examples
        """
        
        classification_prompt = f"""Klasifikasikan intent dari pesan pengguna berikut.

PESAN PENGGUNA: "{message}"

DEFINISI:
1. INFORMATIONAL: Pengguna ingin mencari informasi, bertanya tentang biaya, syarat, fasilitas, dll.
2. TRANSACTIONAL: Pengguna ingin melakukan pendaftaran, mengisi formulir, mendaftar sebagai siswa.

CONTOH INFORMATIONAL:
- "Berapa biaya masuk SD Al-Azhar?"
- "Apa saja persyaratan untuk masuk SMP?"
- "Dimana lokasi Al-Azhar terdekat dari Bekasi?"
- "Fasilitas apa saja yang ada di sekolah?"

CONTOH TRANSACTIONAL:
- "Saya mau daftar anak saya ke TK Al-Azhar"
- "Bagaimana cara mendaftar?"
- "Tolong bantu saya mengisi formulir pendaftaran"
- "Saya ingin mendaftarkan anak"

Jawab dengan HANYA satu kata: "informational" atau "transactional"
"""
        
        response = await self.llm.generate(
            messages=[
                {"role": "system", "content": "Anda adalah classifier yang akurat."},
                {"role": "user", "content": classification_prompt}
            ],
            temperature=0.1,
            max_tokens=10
        )
        
        # Parse response
        response_lower = response.strip().lower()
        
        if "transactional" in response_lower:
            return "transactional"
        else:
            return "informational"
    
    def get_suggested_action(self, intent: str, message: str) -> str:
        """
        Get suggested action berdasarkan intent
        Untuk routing ke handler yang tepat
        """
        
        if intent == "transactional":
            return "start_registration_flow"
        else:
            return "search_knowledge_base"
