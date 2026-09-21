"""Evalix AI Proctoring Package (derived from AI-Proctored-Assessment-Platform architecture)."""

from .proctor_engine import log_proctor_violation, calculate_risk_score

__all__ = ["log_proctor_violation", "calculate_risk_score"]
