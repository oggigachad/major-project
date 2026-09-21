"""Evalix AI Interview Engine.

Derived from ai-interview-platform architecture:
- Role-specific question progression
- Domain guidance
- Adaptive follow-up generator
- Thinking stripper (removes model meta-reasoning from spoken output)
- Interview state machine
"""

import logging
import re
from typing import Any, Dict, List, Optional

log = logging.getLogger("evalix.interview")

ROLE_QUESTIONS: Dict[str, List[Dict[str, Any]]] = {
    "software": [
        {
            "id": "q1",
            "text": "Could you walk me through a challenging technical problem you solved recently and your architectural approach?",
            "topic": "Architecture & Problem Solving",
            "expected_competencies": ["System Design", "Scalability", "Trade-offs"],
        },
        {
            "id": "q2",
            "text": "How do you approach database performance and caching when designing high-throughput services?",
            "topic": "Data & Performance",
            "expected_competencies": ["Databases", "Caching", "Query Optimization"],
        },
        {
            "id": "q3",
            "text": "Can you describe a time you had a technical disagreement with a teammate and how you reached consensus?",
            "topic": "Collaboration & Communication",
            "expected_competencies": ["Teamwork", "Empathy", "Code Review"],
        },
    ],
    "frontend": [
        {
            "id": "q1",
            "text": "How do you manage complex client-side state and optimize rendering performance in modern web applications?",
            "topic": "State Management & Performance",
            "expected_competencies": ["React", "Performance", "DOM Optimization"],
        },
        {
            "id": "q2",
            "text": "Could you describe your approach to building reusable, accessible UI components according to WCAG standards?",
            "topic": "Design Systems & Accessibility",
            "expected_competencies": ["Accessibility", "Design Systems", "Component Design"],
        },
        {
            "id": "q3",
            "text": "Tell me about a time you had to debug a difficult production issue on the frontend.",
            "topic": "Troubleshooting & Reliability",
            "expected_competencies": ["Debugging", "Observability", "Testing"],
        },
    ],
    "general": [
        {
            "id": "q1",
            "text": "To start off, could you briefly introduce yourself and highlight the core projects you have been working on?",
            "topic": "Introduction & Background",
            "expected_competencies": ["Communication", "Self-awareness", "Clarity"],
        },
        {
            "id": "q2",
            "text": "What is the most impactful project you've contributed to, and what was your specific role in its success?",
            "topic": "Execution & Impact",
            "expected_competencies": ["Leadership", "Execution", "Ownership"],
        },
        {
            "id": "q3",
            "text": "Where do you see your technical focus growing in the next one to two years?",
            "topic": "Growth & Vision",
            "expected_competencies": ["Continuous Learning", "Vision", "Drive"],
        },
    ],
}


def strip_thinking(text: str) -> str:
    """Removes model reasoning tags (<think>...</think>) and internal chain-of-thought."""
    cleaned = text.trim() if hasattr(text, "trim") else text.strip()
    cleaned = re.sub(r"<(?:think|thinking|reasoning|thought)[\s\S]*?<\/(?:think|thinking|reasoning|thought)>", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"<(?:think|thinking|reasoning|thought)>[\s\S]*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"<\/(?:think|thinking|reasoning|thought)>", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\*\*([^*]+)\*\*", r"\1", cleaned)
    cleaned = re.sub(r"^#+\s*", "", cleaned, flags=re.MULTILINE)
    return cleaned.strip() or text.strip()


def get_role_questions(role_title: str) -> List[Dict[str, Any]]:
    """Return tailored interview questions based on role title."""
    lower = role_title.lower() if role_title else ""
    if any(k in lower for k in ("front", "ui", "ux", "web", "react", "client")):
        return ROLE_QUESTIONS["frontend"]
    elif any(k in lower for k in ("soft", "back", "engineer", "dev", "full", "architect")):
        return ROLE_QUESTIONS["software"]
    return ROLE_QUESTIONS["general"]


def generate_followup(
    candidate_answer: str,
    current_question: Dict[str, Any],
    question_idx: int,
    total_questions: int,
) -> Dict[str, Any]:
    """Generate adaptive follow-up comment and transition to next question using Claude Sonnet 4.6."""
    is_last = question_idx >= total_questions - 1
    
    # Try generating natural conversational response via Claude Sonnet 4.6
    try:
        from app.core.ai_client import run_ai_completion
        prompt = (
            f"You are an empathetic, professional AI interviewer conducting a technical interview.\n"
            f"Question Asked: {current_question.get('text')}\n"
            f"Candidate's Answer: {candidate_answer}\n\n"
            f"Provide a brief 1-2 sentence conversational spoken acknowledgement of their answer, "
            f"and then transition to the {'conclusion of the interview' if is_last else 'next topic'}.\n"
            f"Keep it concise, friendly, and under 35 words. Do not use bullet points or formatting."
        )
        ai_resp = run_ai_completion(
            messages=[{"role": "user", "content": prompt}],
            model="claude-sonnet-4-6",
            temperature=0.3,
            max_tokens=80,
        )
        cleaned = strip_thinking(ai_resp)
        if cleaned and len(cleaned) > 10:
            return {
                "acknowledgement": cleaned,
                "transition": cleaned,
                "is_complete": is_last,
            }
    except Exception as e:
        log.warning("Claude interview followup generation failed: %s — using template", e)

    answer_len = len(candidate_answer.split())
    answer_lower = candidate_answer.lower()

    if answer_len < 8:
        acknowledgement = "Thank you. That gives a quick overview."
    elif any(term in answer_lower for term in ("challenging", "difficult", "scale", "bottleneck", "trade-off")):
        acknowledgement = "That is a great breakdown of the technical trade-offs involved."
    elif any(term in answer_lower for term in ("team", "collaborate", "product", "stakeholder")):
        acknowledgement = "I appreciate that cross-functional perspective."
    else:
        acknowledgement = "Understood, that is a very solid answer."

    if is_last:
        next_prompt = f"{acknowledgement} We have covered all the primary technical areas for today. Let's conclude our session."
    else:
        next_prompt = f"{acknowledgement} Let's move on to the next topic."

    return {
        "acknowledgement": acknowledgement,
        "transition": next_prompt,
        "is_complete": is_last,
    }

