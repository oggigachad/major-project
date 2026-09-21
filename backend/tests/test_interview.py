"""Test script for Evalix Interview endpoints."""

import httpx

BASE_URL = "http://127.0.0.1:8000"


def test_interview_pipeline():
    print("\n--- Testing Evalix Interview Backend Pipeline ---")
    client = httpx.Client(base_url=BASE_URL, timeout=15.0)

    # 1. Login
    login = client.post("/api/v1/auth/login", json={"email": "demo@evalix.ai", "password": "Demo1234!"})
    assert login.status_code == 200, f"Login failed: {login.text}"

    # 2. Get a candidate
    cands = client.get("/api/v1/candidates").json()["candidates"]
    assert len(cands) > 0
    cand = cands[0]
    cand_id = cand["id"]
    print(f"  [PASS] Candidate selected: {cand['name']} ({cand_id})")

    # 3. Create interview session
    sess_res = client.post("/api/v1/interviews/sessions", json={"candidate_id": cand_id})
    assert sess_res.status_code == 201, f"Session creation failed: {sess_res.text}"
    session = sess_res.json()["session"]
    sess_id = session["session_id"]
    assert session["status"] == "READY"
    print(f"  [PASS] Interview session created: {sess_id}")

    # 4. Get session
    get_res = client.get(f"/api/v1/interviews/{sess_id}")
    assert get_res.status_code == 200
    assert get_res.json()["session"]["session_id"] == sess_id
    print(f"  [PASS] GET /api/v1/interviews/{sess_id} verified.")

    # 5. Start session
    start_res = client.post(f"/api/v1/interviews/{sess_id}/start")
    assert start_res.status_code == 200
    start_data = start_res.json()
    assert start_data["status"] == "IN_PROGRESS"
    assert "ai_message" in start_data
    print(f"  [PASS] Session started: '{start_data['ai_message'][:60]}...'")

    # 6. Respond to Question 1
    ans_1 = "I architected an asynchronous microservices platform using FastAPI, Redis caching, and MongoDB with distributed transaction boundaries."
    resp_res = client.post(f"/api/v1/interviews/{sess_id}/respond", json={"text": ans_1})
    assert resp_res.status_code == 200
    resp_data = resp_res.json()
    assert len(resp_data["transcript"]) >= 2
    print(f"  [PASS] Response 1 processed. Next AI prompt: '{resp_data['ai_message'][:60]}...'")

    # 7. Respond to remaining questions
    while not resp_data.get("is_complete"):
        resp_res = client.post(f"/api/v1/interviews/{sess_id}/respond", json={"text": "We monitored latency using Prometheus and Grafana and implemented index optimization."})
        resp_data = resp_res.json()

    print("  [PASS] All interview questions answered.")

    # 8. Complete interview
    comp_res = client.post(f"/api/v1/interviews/{sess_id}/complete")
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["status"] == "COMPLETED"
    scorecard = comp_data["scorecard"]
    assert scorecard["overall_score"] > 0
    assert scorecard["verdict"] in ("Hire", "Strong hire", "Needs review")
    print(f"  [PASS] Interview finalized: score={scorecard['overall_score']}%, verdict={scorecard['verdict']}")

    # 9. Verify candidate record updated
    updated_cand = [c for c in client.get("/api/v1/candidates").json()["candidates"] if c["id"] == cand_id][0]
    assert updated_cand["scores"]["interview"] == scorecard["overall_score"]
    assert updated_cand["interview"] is not None
    print(f"  [PASS] Candidate record updated: interview_score={updated_cand['scores']['interview']}")

    print("\nALL INTERVIEW BACKEND PIPELINE TESTS PASSED!\n")


if __name__ == "__main__":
    test_interview_pipeline()
