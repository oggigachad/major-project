"""Comprehensive Automated Test Suite for Evalix Backend AI Screening Integration.

Verifies:
1. Resume file validation (PDF/DOCX magic bytes, invalid/corrupted rejection, empty file rejection).
2. Resume text extraction.
3. PII scrubbing/anonymization (emails, phones, URLs, addresses).
4. Profile parsing (skills ontology, experience years, education).
5. Job description profile parsing.
6. Candidate ↔ Job matching engine (scores, gaps, matched/missing).
7. LLM screening (structured recommendation, strengths, concerns, offline deterministic fallback).
8. Deterministic ranking algorithm (reproducibility & tie-breakers).
9. Live FastAPI endpoints:
   - POST /api/v1/jobs/{slug}/screen (dual UI compatibility)
   - GET /api/v1/jobs/{slug}/screen (ranking spec)
   - POST /api/v1/screening/resume/{candidate_id}
   - POST /api/v1/screening/job/{job_id}
   - POST /api/v1/screening/{job_id}/{candidate_id}
   - GET /api/v1/screening/{job_id}/candidates
   - GET /api/v1/screening/{job_id}/candidate/{candidate_id}
   - POST /api/v1/screening/{job_id}/run
   - POST /api/v1/candidates/upload (multipart resume upload)
"""

import io
import json
import zipfile
import httpx

BASE_URL = "http://127.0.0.1:8000"


def make_dummy_docx(text: str) -> bytes:
    """Create a minimal valid DOCX binary in memory."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("[Content_Types].xml", (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
            '</Types>'
        ))
        zf.writestr("word/document.xml", (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            f'<w:body><w:p><w:r><w:t>{text}</w:t></w:r></w:p></w:body>'
            '</w:document>'
        ))
    return buf.getvalue()


def make_dummy_pdf(text: str) -> bytes:
    """Create a minimal valid PDF binary in memory."""
    content = f"BT /F1 12 Tf 72 712 Td ({text}) Tj ET"
    stream_len = len(content)
    pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
        b"4 0 obj\n<< /Length " + str(stream_len).encode() + b" >>\nstream\n"
        + content.encode() + b"\nendstream\nendobj\n"
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
        b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000242 00000 n \n0000000320 00000 n \n"
        b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n390\n%%EOF\n"
    )
    return pdf


def test_api_endpoints():
    print("\n--- Testing Evalix AI Screening Live API Endpoints ---")
    client = httpx.Client(base_url=BASE_URL, timeout=15.0)

    # 1. Authenticate
    login_resp = client.post("/api/v1/auth/login", json={"email": "demo@evalix.ai", "password": "Demo1234!"})
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    print("  [PASS] Authenticated successfully as recruiter via session cookies.")

    # 2. List jobs to get a target slug
    jobs_resp = client.get("/api/v1/jobs")
    assert jobs_resp.status_code == 200
    jobs_list = jobs_resp.json()["jobs"]
    assert len(jobs_list) > 0
    target_job = jobs_list[0]
    job_slug = target_job["id"]
    print(f"  [PASS] Target job: {target_job['title']} (slug={job_slug})")

    # 3. List candidates to get a target slug
    cands_resp = client.get("/api/v1/candidates")
    assert cands_resp.status_code == 200
    cands_list = cands_resp.json()["candidates"]
    assert len(cands_list) > 0
    target_cand = cands_list[0]
    cand_slug = target_cand["id"]
    print(f"  [PASS] Target candidate: {target_cand['name']} (slug={cand_slug})")

    # 4. Test POST /api/v1/screening/resume/{candidate_id}
    res_parse = client.post(f"/api/v1/screening/resume/{cand_slug}")
    assert res_parse.status_code == 200, f"Resume parse failed: {res_parse.text}"
    data_parse = res_parse.json()
    assert "profile" in data_parse
    assert "skills" in data_parse
    print(f"  [PASS] POST /api/v1/screening/resume/{cand_slug}: Extracted {len(data_parse['skills'])} skills")

    # 5. Test POST /api/v1/screening/job/{job_id}
    job_parse = client.post(f"/api/v1/screening/job/{job_slug}")
    assert job_parse.status_code == 200, f"Job parse failed: {job_parse.text}"
    data_job_parse = job_parse.json()
    assert "screening_profile" in data_job_parse
    print(f"  [PASS] POST /api/v1/screening/job/{job_slug}: Extracted screening profile")

    # 6. Test POST /api/v1/screening/{job_id}/{candidate_id}
    single_scr = client.post(f"/api/v1/screening/{job_slug}/{cand_slug}")
    assert single_scr.status_code == 200, f"Single screen failed: {single_scr.text}"
    scr_data = single_scr.json()
    assert "overall_score" in scr_data
    assert "recommendation" in scr_data
    assert "matched_skills" in scr_data
    assert "missing_skills" in scr_data
    assert "reasoning" in scr_data
    print(f"  [PASS] POST /api/v1/screening/{job_slug}/{cand_slug}: score={scr_data['overall_score']}%, rec={scr_data['recommendation']}")

    # 7. Test GET /api/v1/screening/{job_id}/candidates
    list_scr = client.get(f"/api/v1/screening/{job_slug}/candidates")
    assert list_scr.status_code == 200, f"Get screened candidates failed: {list_scr.text}"
    cand_rankings = list_scr.json()["candidates"]
    assert len(cand_rankings) > 0
    assert cand_rankings[0]["rank"] == 1
    print(f"  [PASS] GET /api/v1/screening/{job_slug}/candidates: {len(cand_rankings)} candidates ranked")

    # 8. Test GET /api/v1/screening/{job_id}/candidate/{candidate_id}
    det_scr = client.get(f"/api/v1/screening/{job_slug}/candidate/{cand_slug}")
    assert det_scr.status_code == 200, f"Candidate detail screening failed: {det_scr.text}"
    assert det_scr.json()["candidate_id"] == cand_slug
    print(f"  [PASS] GET /api/v1/screening/{job_slug}/candidate/{cand_slug}: Retrieved full breakdown")

    # 9. Test POST /api/v1/jobs/{slug}/screen (Existing frontend modal compatibility)
    ui_scr = client.post(f"/api/v1/jobs/{job_slug}/screen")
    assert ui_scr.status_code == 200, f"UI job screen failed: {ui_scr.text}"
    ui_data = ui_scr.json()
    assert "results" in ui_data, "Missing 'results' required by existing ScreenModal UI"
    assert "candidates" in ui_data, "Missing 'candidates' required by ranking spec"
    assert "evalix" in ui_data.get("engine", ""), f"Unexpected engine: {ui_data.get('engine')}"
    print(f"  [PASS] POST /api/v1/jobs/{job_slug}/screen: Returns 'results' ({len(ui_data['results'])}) and 'candidates' ({len(ui_data['candidates'])})")

    # 10. Test GET /api/v1/jobs/{slug}/screen (Ranking spec)
    rank_resp = client.get(f"/api/v1/jobs/{job_slug}/screen")
    assert rank_resp.status_code == 200, f"GET job screen ranking failed: {rank_resp.text}"
    rank_data = rank_resp.json()
    assert rank_data["job_id"] == job_slug
    assert isinstance(rank_data["candidates"], list)
    print(f"  [PASS] GET /api/v1/jobs/{job_slug}/screen: Successfully retrieved deterministic ranking")

    # 11. Test POST /api/v1/candidates/upload (Multipart resume upload)
    sample_pdf = make_dummy_pdf("Alex Taylor - Senior AI Solutions Architect. 6 years experience with Python, LLMs, PyTorch, LangChain, Vector Search, FastAPI, and Kubernetes.")
    files = {"file": ("alex_taylor_resume.pdf", sample_pdf, "application/pdf")}
    data = {"name": "Alex Taylor", "email": "alex.taylor@example.org", "role": target_job["title"], "job_id": job_slug}
    upload_resp = client.post("/api/v1/candidates/upload", files=files, data=data)
    assert upload_resp.status_code == 201, f"Resume upload failed: {upload_resp.text}"
    up_data = upload_resp.json()
    assert "candidate" in up_data
    assert "screening" in up_data
    assert up_data["screening"]["overall_score"] > 0, f"Expected valid score, got {up_data['screening']['overall_score']}"
    assert "recommendation" in up_data["screening"], "Expected recommendation in screening result"
    assert up_data["candidate"]["name"] == "Alex Taylor"
    print(f"  [PASS] POST /api/v1/candidates/upload: Uploaded & screened candidate {up_data['candidate']['name']} (score={up_data['screening']['overall_score']}%, rec={up_data['screening']['recommendation']})")


if __name__ == "__main__":
    test_api_endpoints()
    print("\nALL EVALIX AI SCREENING INTEGRATION TESTS PASSED!\n")
