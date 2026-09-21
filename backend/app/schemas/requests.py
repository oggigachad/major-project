"""Request body schemas (pydantic v2) — validation mirrors the reference
zod schemas, including the same human-readable messages."""

import re
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

NAME_MIN = "Name must be at least 2 characters"
EMAIL_MSG = "Enter a valid email address"
PASSWORD_MIN = "Password must be at least 8 characters"
PASSWORD_LETTER = "Password must include a letter"
PASSWORD_DIGIT = "Password must include a number"


def _lower(v: Optional[str]) -> Optional[str]:
    return v.strip().lower() if v else v


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    remember: bool = True

    @field_validator("email", mode="before")
    @classmethod
    def norm_email(cls, v):
        return _lower(v)


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def norm_email(cls, v):
        return _lower(v)

    @field_validator("name")
    @classmethod
    def norm_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError(NAME_MIN)
        return v

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v):
            raise ValueError(PASSWORD_LETTER)
        if not re.search(r"\d", v):
            raise ValueError(PASSWORD_DIGIT)
        return v


class ShortlistIn(BaseModel):
    shortlisted: bool


class StageActionIn(BaseModel):
    action: str

    @field_validator("action")
    @classmethod
    def check_action(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in ("advance", "reject", "restore"):
            raise ValueError("Invalid action — use advance | reject | restore")
        return v


class JobCreateIn(BaseModel):
    title: str = Field(min_length=3, max_length=80)
    dept: str = Field(min_length=2, max_length=40)
    location: str = Field(min_length=2, max_length=60)
    type: str

    @field_validator("title", "dept", "location")
    @classmethod
    def strip_fields(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Value must not be empty")
        return v

    @field_validator("type")
    @classmethod
    def check_type(cls, v: str) -> str:
        v = v.strip()
        if v not in ("Full-time", "Contract", "Part-time", "Internship"):
            raise ValueError(
                "Invalid enum value. Expected 'Full-time' | 'Contract' | 'Part-time' | 'Internship'"
            )
        return v


class PresignIn(BaseModel):
    filename: str = Field(min_length=1, max_length=120)
    content_type: str = Field(min_length=3, max_length=80)

    @field_validator("filename")
    @classmethod
    def check_extension(cls, v: str) -> str:
        v = v.strip()
        if not re.search(r"\.(pdf|doc|docx)$", v, re.IGNORECASE):
            raise ValueError("Only PDF or DOC/DOCX files are supported")
        return v

    @field_validator("content_type")
    @classmethod
    def check_mime(cls, v: str) -> str:
        allowed = {
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }
        if v.strip().lower() not in allowed:
            raise ValueError("Unsupported content type")
        return v.strip().lower()


class CandidateCreateIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    role: str = Field(min_length=2, max_length=80)
    job_id: Optional[str] = None
    location: Optional[str] = "Remote"
    summary: Optional[str] = ""
    source: Optional[str] = "Direct Application"
    stage: Optional[str] = "screening"
    matched: Optional[list[str]] = None
    missing: Optional[list[str]] = None

