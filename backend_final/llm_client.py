"""
Production-Ready LLM Client
Support untuk OpenAI dan Anthropic Claude
"""

from typing import List, Dict, Optional
import os
from config import settings

# Import sesuai provider
if settings.LLM_PROVIDER == "openai":
    from openai import AsyncOpenAI
elif settings.LLM_PROVIDER == "anthropic":
    from anthropic import AsyncAnthropic


class LLMClient:
    """Production LLM Client dengan support multiple providers"""
    
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        
        if self.provider == "openai":
            if not settings.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY is required")
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.model = settings.OPENAI_MODEL
            
        elif self.provider == "anthropic":
            if not settings.ANTHROPIC_API_KEY:
                raise ValueError("ANTHROPIC_API_KEY is required")
            self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            self.model = settings.ANTHROPIC_MODEL
            
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")
    
    async def generate(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7, 
        max_tokens: int = 500
    ) -> str:
        """
        Generate response dari LLM
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens to generate
            
        Returns:
            Generated text response
        """
        
        try:
            if self.provider == "openai":
                return await self._generate_openai(messages, temperature, max_tokens)
            elif self.provider == "anthropic":
                return await self._generate_anthropic(messages, temperature, max_tokens)
        except Exception as e:
            print(f"LLM Generation Error: {e}")
            raise
    
    async def _generate_openai(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float, 
        max_tokens: int
    ) -> str:
        """Generate using OpenAI API"""
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        return response.choices[0].message.content.strip()
    
    async def _generate_anthropic(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float, 
        max_tokens: int
    ) -> str:
        """Generate using Anthropic Claude API"""
        
        # Anthropic menggunakan format berbeda
        # Extract system message
        system_message = ""
        conversation_messages = []
        
        for msg in messages:
            if msg["role"] == "system":
                system_message = msg["content"]
            else:
                conversation_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
        
        response = await self.client.messages.create(
            model=self.model,
            system=system_message,
            messages=conversation_messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        return response.content[0].text.strip()


# Singleton instance
_llm_client = None

def get_llm_client() -> LLMClient:
    """Get singleton LLM client instance"""
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient()
    return _llm_client
