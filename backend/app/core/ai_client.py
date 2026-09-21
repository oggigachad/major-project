"""Evalix AI Client Module.

Powered by KodeKloud AI Platform:
- Primary Model: claude-sonnet-4-6 for complex AI reasoning, screening, interview evaluation.
- Search/Fast Model: google/gemini-3.5-flash with DuckDuckGo web searching for newest data.
"""

import json
import logging
from typing import Any, Dict, List, Optional
from openai import OpenAI

try:
    from ddgs import DDGS
except ImportError:
    try:
        from duckduckgo_search import DDGS
    except ImportError:
        DDGS = None

from app.core.config import get_settings

log = logging.getLogger("evalix.ai")
settings = get_settings()

_cached_client: Optional[OpenAI] = None


def get_ai_client() -> OpenAI:
    """Return configured OpenAI client for KodeKloud API."""
    global _cached_client
    if _cached_client is None:
        api_key = settings.kodekloud_api_key or "sk-Hb602OMIodTB-KiEDYgsVg"
        base_url = settings.kodekloud_api_base_url or "https://api.ai.kodekloud.com/v1"
        _cached_client = OpenAI(
            api_key=api_key,
            base_url=base_url,
            timeout=float(settings.ai_timeout_seconds),
        )
    return _cached_client


def run_ai_completion(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    json_mode: bool = False,
    temperature: float = 0.2,
    max_tokens: int = 1500,
) -> str:
    """Execute chat completion via KodeKloud OpenAI client."""
    client = get_ai_client()
    chosen_model = model or getattr(settings, "ai_model_primary", "claude-sonnet-4-6")
    
    kwargs: Dict[str, Any] = {
        "model": chosen_model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    try:
        response = client.chat.completions.create(**kwargs)
        content = response.choices[0].message.content or ""
        return content.strip()
    except Exception as e:
        log.warning("AI completion failed on model %s: %s", chosen_model, e)
        # Fallback to secondary model if primary fails
        fallback_model = getattr(settings, "ai_model_search", "google/gemini-3.5-flash")
        if chosen_model != fallback_model:
            try:
                log.info("Attempting fallback to %s", fallback_model)
                kwargs["model"] = fallback_model
                response = client.chat.completions.create(**kwargs)
                return (response.choices[0].message.content or "").strip()
            except Exception as e2:
                log.error("AI fallback also failed on %s: %s", fallback_model, e2)
                raise e2
        raise e


def perform_duckduckgo_search(query: str, max_results: int = 3) -> List[Dict[str, str]]:
    """Query DuckDuckGo for newest data."""
    if not DDGS:
        log.warning("DuckDuckGo search library not available")
        return []
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
            return [
                {
                    "title": r.get("title", ""),
                    "body": r.get("body", ""),
                    "href": r.get("href", ""),
                }
                for r in results
            ]
    except Exception as exc:
        log.warning("DuckDuckGo search failed for '%s': %s", query, exc)
        return []


def run_ai_with_search(
    user_prompt: str,
    search_query: Optional[str] = None,
    system_instruction: str = "You are an intelligent recruitment intelligence assistant.",
    model: Optional[str] = None,
) -> str:
    """Execute completion using google/gemini-3.5-flash enriched with DuckDuckGo search context."""
    chosen_model = model or getattr(settings, "ai_model_search", "google/gemini-3.5-flash")
    search_context = ""
    
    if search_query:
        search_results = perform_duckduckgo_search(search_query, max_results=3)
        if search_results:
            formatted_snippets = "\n".join(
                f"- {item['title']}: {item['body']}" for item in search_results
            )
            search_context = f"\n\nReal-time DuckDuckGo Search Context:\n{formatted_snippets}\n"

    augmented_prompt = f"{user_prompt}{search_context}"
    messages = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": augmented_prompt},
    ]
    
    return run_ai_completion(messages=messages, model=chosen_model)
