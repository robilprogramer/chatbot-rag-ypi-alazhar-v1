"""
Intent Classifier - IMPROVED VERSION
FOKUS: Semua percakapan adalah TRANSACTIONAL setelah greeting
Context-aware dan membaca conversation history
"""

from typing import Literal
from conversation_state_v2 import ConversationState, RegistrationStep
import re


class IntentClassifier:
    """
    Simplified Intent Classifier
    PRINSIP: Setelah greeting, SELALU transactional
    Hanya greeting pertama yang bisa informational
    """
    
    def __init__(self, llm_client):
        self.llm = llm_client
    
    async def classify(
        self, 
        message: str, 
        state: ConversationState
    ) -> Literal["informational", "transactional"]:
        """
        Classify user intent
        
        STRATEGI SIMPLIFIED:
        1. Jika state.is_transactional == True -> ALWAYS transactional
        2. Jika sudah ada conversation history -> ALWAYS transactional
        3. Jika step != GREETING -> ALWAYS transactional
        4. Hanya pesan pertama yang bisa informational
        """
        
        # Rule 1: Jika sudah ditandai transactional, tetap transactional
        if state.is_transactional:
            return "transactional"
        
        # Rule 2: Jika sudah ada conversation history, berarti sudah dalam flow
        if len(state.conversation_history) > 0:
            return "transactional"
        
        # Rule 3: Jika bukan greeting, pasti transactional
        if state.current_step != RegistrationStep.GREETING:
            return "transactional"
        
        # Rule 4: Check apakah ini pesan pertama kali yang murni tanya info
        # Jika ada indikasi mau daftar/registrasi -> transactional
        message_lower = message.lower()
        
        transactional_triggers = [
            "daftar", "pendaftaran", "register", "mendaftar",
            "mau daftar", "ingin daftar", "mau mendaftar",
            "isi form", "formulir", "nama saya", "saya mau"
        ]
        
        for trigger in transactional_triggers:
            if trigger in message_lower:
                return "transactional"
        
        # Jika pesan pertama dan hanya tanya informasi
        informational_patterns = [
            "berapa biaya", "info biaya", "harga",
            "dimana lokasi", "alamat",
            "apa saja syarat", "persyaratan",
            "kapan pendaftaran"
        ]
        
        is_purely_informational = any(pattern in message_lower for pattern in informational_patterns)
        
        # DEFAULT: Lebih baik transactional daripada informational
        # Karena user yang chat chatbot pendaftaran biasanya mau daftar
        if is_purely_informational:
            return "informational"
        else:
            return "transactional"
    
    def get_suggested_action(self, intent: str, message: str) -> str:
        """Get suggested action berdasarkan intent"""
        
        if intent == "transactional":
            return "start_registration_flow"
        else:
            return "search_knowledge_base"
