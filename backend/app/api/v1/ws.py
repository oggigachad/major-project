"""Real-time WebSocket endpoint and connection manager.

Enables full-duplex, event-driven communication for live dashboard updates:
- candidate stage changes, shortlist toggles, and new applicant ingestions
- job creations and screening updates
- dynamic AI insights and real-time notification broadcasts
- client ping/pong heartbeats and on-demand stat refreshes
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.db import mongo as mongo_mod

log = logging.getLogger("evalix.ws")

router = APIRouter(tags=["websocket"])


class ConnectionManager:
    """Manages active WebSocket client connections and event broadcasting."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self.active_connections.append(websocket)
        log.info("ws: client connected (total active: %d)", len(self.active_connections))

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
        log.info("ws: client disconnected (remaining active: %d)", len(self.active_connections))

    async def broadcast(self, event_type: str, data: Any) -> None:
        """Broadcast an event payload to all currently connected clients."""
        payload = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        stale: List[WebSocket] = []
        async with self._lock:
            connections = list(self.active_connections)

        for ws in connections:
            try:
                await ws.send_text(json.dumps(payload))
            except Exception as exc:
                log.debug("ws: failed to send to client, marking for removal: %s", exc)
                stale.append(ws)

        if stale:
            async with self._lock:
                for ws in stale:
                    if ws in self.active_connections:
                        self.active_connections.remove(ws)


ws_manager = ConnectionManager()


async def broadcast_ws_event(event_type: str, data: Any) -> None:
    """Helper for other routes and services to broadcast real-time events."""
    await ws_manager.broadcast(event_type, data)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)

    # Send initial welcome / connection ack
    try:
        await websocket.send_text(
            json.dumps(
                {
                    "type": "ws:connected",
                    "data": {
                        "message": "EvalixAI Realtime WebSocket connected",
                        "serverTime": datetime.now(timezone.utc).isoformat(),
                    },
                }
            )
        )
    except Exception:
        pass

    try:
        while True:
            text = await websocket.receive_text()
            try:
                msg = json.loads(text)
            except Exception:
                msg = {"type": "raw", "content": text}

            msg_type = msg.get("type", "")

            if msg_type == "ping":
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "pong",
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        }
                    )
                )

            elif msg_type == "get_stats":
                app = websocket.app
                db = getattr(app.state, "db", None)
                redis = getattr(app.state, "redis", None)
                if db is not None:
                    from app.services.stats_service import get_stats

                    stats = await get_stats(db, redis, force=True)
                    await websocket.send_text(
                        json.dumps({"type": "stats:updated", "data": stats})
                    )

            elif msg_type == "generate_insight":
                app = websocket.app
                db = getattr(app.state, "db", None)
                redis = getattr(app.state, "redis", None)
                if db is not None:
                    from app.services.stats_service import generate_dynamic_insight

                    insight = await generate_dynamic_insight(db, redis)
                    await ws_manager.broadcast("insight:new", insight)
                    await ws_manager.broadcast(
                        "notification:new",
                        {
                            "id": f"notif-{uuid.uuid4().hex[:6]}",
                            "title": "AI Pipeline Insight",
                            "message": insight.get("text", "New hiring trend detected."),
                            "time": "just now",
                            "tone": insight.get("tone", "olive"),
                        },
                    )

            elif msg_type == "simulate_applicant":
                app = websocket.app
                db = getattr(app.state, "db", None)
                redis = getattr(app.state, "redis", None)
                if db is not None:
                    from app.services.stats_service import get_stats, invalidate_stats_cache
                    from app.serializers import serialize_candidate

                    req_data = msg.get("data", {})
                    slug = f"c{uuid.uuid4().hex[:6]}"
                    name = req_data.get("name", "Jordan Lee")
                    role = req_data.get("role", "Full Stack Engineer")
                    doc = {
                        "slug": slug,
                        "name": name,
                        "email": req_data.get("email", f"jordan.{uuid.uuid4().hex[:4]}@example.com"),
                        "role": role,
                        "job_id": req_data.get("job_id", "fe"),
                        "location": req_data.get("location", "Remote"),
                        "applied_days_ago": 0,
                        "updated_minutes_ago": 0,
                        "stage": "SCREENING",
                        "match": req_data.get("match", 88),
                        "resume_score": 89,
                        "assessment_score": 85,
                        "interview_score": 86,
                        "task_score": 84,
                        "source": "Inbound Career Portal",
                        "shortlisted": False,
                        "summary": f"Strong candidate applying for {role}. Demonstrated proficiency in modern software engineering practices.",
                        "matched": ["TypeScript", "FastAPI", "React", "System Architecture"],
                        "missing": ["Kubernetes at scale"],
                        "assessment_sections": [
                            {"label": "Core Foundations", "score": 88},
                            {"label": "System Design", "score": 84},
                        ],
                        "created_at": datetime.now(timezone.utc),
                    }
                    await db.candidates.insert_one(doc)
                    await invalidate_stats_cache(redis)
                    c_data = serialize_candidate(doc)
                    stats = await get_stats(db, redis, force=True)

                    await ws_manager.broadcast("candidate:created", c_data)
                    await ws_manager.broadcast("stats:updated", stats)
                    await ws_manager.broadcast(
                        "notification:new",
                        {
                            "id": f"notif-{uuid.uuid4().hex[:6]}",
                            "title": "New Applicant Ingested",
                            "message": f"{name} applied for {role}",
                            "time": "just now",
                            "tone": "olive",
                        },
                    )

    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception as exc:
        log.warning("ws: error in connection loop: %s", exc)
        await ws_manager.disconnect(websocket)
