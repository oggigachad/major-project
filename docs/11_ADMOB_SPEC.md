# AdMob & Monetization Specification: EvalixAI

## 1. Scope & Strategy
EvalixAI operates primarily as a B2B SaaS platform for enterprise recruitment. For free-tier candidate preparation portals, public practice assessments, and community job boards, optional lightweight monetization is enabled via Google AdMob (mobile app wrapper / WebView) and Google Ad Manager (web).

---

## 2. Ad Placement Units & Guidelines
1. **Candidate Practice Test Completion Screen:**
   - **Type:** Interstitial / Rewarded Video (Optional).
   - **Trigger:** Displayed after a candidate completes an optional self-assessment practice round.
   - **Rules:** Never shown during real, timed recruiter assessments or high-stakes interviews.
2. **Public Job Board Footer / Sidebar:**
   - **Type:** Responsive Display Banner (300x250, 728x90).
   - **Placement:** Non-intrusive placement below job description and requirements list.

---

## 3. Privacy & Compliance Policies
- **No PII Sharing:** Candidate resumes, email addresses, test answers, and video recordings are strictly excluded from ad targeting pixels.
- **COPPA & GDPR Consent:** Consent Management Platform (CMP) dialog presented before personalized ad loading.
- **Enterprise Whitelabeling:** Ad units are completely disabled for all paying organization tenants.
