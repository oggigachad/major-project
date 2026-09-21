"""Evalix PII Anonymizer.

Scrubs candidate Personally Identifiable Information (email, phone, URLs,
names, addresses) before transmitting text to external LLMs.
"""

import re
from typing import Optional

EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
PHONE_REGEX = re.compile(
    r"(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}\b"
)
URL_REGEX = re.compile(
    r"(https?://\S+|www\.\S+|linkedin\.com/\S+|github\.com/\S+)",
    re.IGNORECASE,
)
ADDRESS_REGEX = re.compile(
    r"\b\d{1,5}\s+([A-Za-z0-9\s]+)\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct)\b",
    re.IGNORECASE,
)
POSTAL_CODE_REGEX = re.compile(r"\b\d{5}(-\d{4})?\b|\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b")


def anonymize_candidate_text(text: str, candidate_name: Optional[str] = None) -> str:
    """Strip PII from candidate text for privacy-preserving AI screening.

    Replaces emails, phone numbers, personal URLs, addresses, and candidate names
    with anonymized tokens.
    """
    if not text:
        return ""

    scrubbed = text

    # Anonymize candidate name if known
    if candidate_name and len(candidate_name.strip()) > 2:
        name_parts = candidate_name.strip().split()
        for part in name_parts:
            if len(part) >= 2:
                scrubbed = re.sub(
                    rf"\b{re.escape(part)}\b", "[CANDIDATE]", scrubbed, flags=re.IGNORECASE
                )

    # Anonymize emails
    scrubbed = EMAIL_REGEX.sub("[ANONYMIZED_EMAIL]", scrubbed)

    # Anonymize URLs and profiles
    scrubbed = URL_REGEX.sub("[ANONYMIZED_URL]", scrubbed)

    # Anonymize phone numbers
    scrubbed = PHONE_REGEX.sub("[ANONYMIZED_PHONE]", scrubbed)

    # Anonymize addresses & postal codes
    scrubbed = ADDRESS_REGEX.sub("[ANONYMIZED_ADDRESS]", scrubbed)
    scrubbed = POSTAL_CODE_REGEX.sub("[POSTAL_CODE]", scrubbed)

    return scrubbed
