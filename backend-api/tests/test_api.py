"""Test Suite for BNHS FastAPI Backend Integration with MongoDB & Conversational RAG.
Tests all endpoints: Health, Conversational Chat (RAG with Memory & Query Rewriter),
MongoDB Users, Recommendations, Activities, Participation, and Registrations.
"""

import unittest
import uuid
from fastapi.testclient import TestClient

from app.main import app


class TestBNHSFastAPIWithConversationalRAG(unittest.TestCase):
    """Integration test suite using FastAPI TestClient with live Conversational RAG and MongoDB."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_endpoint(self):
        """Validates GET /api/v1/health returns 200 and available status for RAG, Recommendation, and MongoDB."""
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "healthy")
        self.assertIn("services", data)
        self.assertEqual(data["services"].get("rag"), "available")
        self.assertEqual(data["services"].get("recommendation"), "available")
        self.assertEqual(data["services"].get("mongodb"), "available")

    def test_chat_query_valid_single_turn(self):
        """Validates POST /api/v1/chat/query returns a grounded response with source citations."""
        payload = {"query": "What is BNHS-SEVA?"}
        response = self.client.post("/api/v1/chat/query", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("answer", data)
        self.assertTrue(len(data["answer"]) > 10)
        self.assertIn("sources", data)
        self.assertIsInstance(data["sources"], list)
        self.assertGreater(len(data["sources"]), 0)

        # Check source metadata
        first_source = data["sources"][0]
        self.assertIn("document", first_source)
        self.assertIn("page", first_source)
        self.assertIn("section", first_source)

    def test_conversational_rag_pronoun_resolution(self):
        """Validates multi-turn conversation memory and pronoun resolution ('it' -> Matheran Herpetofauna Camp)."""
        session_id = f"test_conv_{uuid.uuid4().hex[:6]}"
        
        # Turn 1: Ask about Matheran Camp
        t1_payload = {"session_id": session_id, "query": "What is the Matheran Herpetofauna Camp?"}
        t1_res = self.client.post("/api/v1/chat/query", json=t1_payload)
        self.assertEqual(t1_res.status_code, 200)
        t1_data = t1_res.json()
        self.assertIn("answer", t1_data)
        self.assertEqual(t1_data.get("session_id"), session_id)

        # Turn 2: Follow-up question referencing "it"
        t2_payload = {"session_id": session_id, "query": "Where is it held?"}
        t2_res = self.client.post("/api/v1/chat/query", json=t2_payload)
        self.assertEqual(t2_res.status_code, 200)
        t2_data = t2_res.json()

        # Verify rewritten query resolved "it" to Matheran Herpetofauna Camp
        self.assertIn("rewritten_query", t2_data)
        rewritten = (t2_data["rewritten_query"] or "").lower()
        self.assertTrue("matheran" in rewritten)
        self.assertIn("Matheran", t2_data["answer"])
        self.assertTrue(len(t2_data["sources"]) > 0)

        # Turn 3: Check conversation history endpoint
        hist_res = self.client.get(f"/api/v1/chat/{session_id}/history")
        self.assertEqual(hist_res.status_code, 200)
        hist_data = hist_res.json()
        self.assertEqual(hist_data.get("session_id"), session_id)
        self.assertEqual(len(hist_data["messages"]), 4)  # 2 user + 2 assistant

        # Turn 4: Delete session history
        del_res = self.client.delete(f"/api/v1/chat/{session_id}")
        self.assertEqual(del_res.status_code, 200)

        # Turn 5: Verify history is now cleared
        hist_res2 = self.client.get(f"/api/v1/chat/{session_id}/history")
        self.assertEqual(hist_res2.status_code, 200)
        self.assertEqual(len(hist_res2.json()["messages"]), 0)

    def test_conversational_session_isolation(self):
        """Validates that different session IDs have independent conversation contexts."""
        session_a = f"test_iso_A_{uuid.uuid4().hex[:6]}"
        session_b = f"test_iso_B_{uuid.uuid4().hex[:6]}"

        # Prime Session A with Matheran Herpetofauna Camp
        self.client.post("/api/v1/chat/query", json={"session_id": session_a, "query": "What is the Matheran Herpetofauna Camp?"})

        # Ask ambiguous follow-up in Session B (fresh session with no context)
        res_b = self.client.post("/api/v1/chat/query", json={"session_id": session_b, "query": "Where is it held?"})
        self.assertEqual(res_b.status_code, 200)
        # Session B must NOT inherit Matheran context from Session A
        hist_b = self.client.get(f"/api/v1/chat/{session_b}/history").json()
        self.assertEqual(len(hist_b["messages"]), 2)

        # Clean up
        self.client.delete(f"/api/v1/chat/{session_a}")
        self.client.delete(f"/api/v1/chat/{session_b}")

    def test_conversational_out_of_scope_fallback_preserved(self):
        """Validates that conversational memory preserves anti-hallucination protection for out-of-scope queries."""
        session_id = f"test_oos_{uuid.uuid4().hex[:6]}"
        # Turn 1: Valid query
        self.client.post("/api/v1/chat/query", json={"session_id": session_id, "query": "What is BNHS?"})

        # Turn 2: Out of scope query
        res = self.client.post("/api/v1/chat/query", json={"session_id": session_id, "query": "What is the capital of Mars?"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("I could not find sufficient information about this in the BNHS knowledge base.", data["answer"])

        self.client.delete(f"/api/v1/chat/{session_id}")

    def test_chat_query_empty(self):
        """Validates that empty queries return 400 Bad Request."""
        payload = {"query": "   "}
        response = self.client.post("/api/v1/chat/query", json=payload)
        self.assertEqual(response.status_code, 400)

    def test_activities_endpoint_mongodb(self):
        """Validates GET /api/v1/activities reads from MongoDB activities collection."""
        response = self.client.get("/api/v1/activities")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("count", data)
        self.assertGreaterEqual(data["count"], 20)
        self.assertGreaterEqual(len(data["activities"]), 20)
        self.assertIn("source", data)
        self.assertEqual(data["source"], "mongodb")

    def test_activities_endpoint_filtered(self):
        """Validates GET /api/v1/activities with query parameters filters correctly."""
        response = self.client.get("/api/v1/activities?type=camp")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertGreaterEqual(data["count"], 2)
        for act in data["activities"]:
            self.assertEqual(act["type"], "camp")

    def test_user_lifecycle_and_recommendation_flow(self):
        """Validates User Creation -> Retrieval -> Update -> Participation -> Recommendation flow."""
        unique_username = f"test_user_{uuid.uuid4().hex[:6]}"
        
        # 1. Create User
        create_payload = {
            "username": unique_username,
            "name": "Arjun Patel",
            "email": f"{unique_username}@example.com",
            "age_group": "student",
            "location": "Mumbai",
            "interests": ["birds", "wetlands"],
            "experience_level": "beginner",
            "preferred_activity_type": "walk",
        }
        create_res = self.client.post("/api/v1/users", json=create_payload)
        self.assertEqual(create_res.status_code, 201)
        user_data = create_res.json()
        user_id = user_data["id"]

        # 2. Get User
        get_res = self.client.get(f"/api/v1/users/{user_id}")
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()["username"], unique_username)

        # 3. Update User Interests
        update_payload = {
            "interests": ["reptiles", "amphibians", "herpetology"],
            "preferred_activity_type": "camp",
        }
        update_res = self.client.put(f"/api/v1/users/{user_id}", json=update_payload)
        self.assertEqual(update_res.status_code, 200)
        self.assertIn("herpetology", update_res.json()["interests"])

        # 4. Get Recommendations using MongoDB user_id
        rec_res = self.client.post("/api/v1/recommend", json={"user_id": user_id})
        self.assertEqual(rec_res.status_code, 200)
        rec_data = rec_res.json()
        self.assertEqual(len(rec_data["recommendations"]), 5)

        # 5. Record Participation in Matheran Camp
        part_payload = {
            "activity_id": "bnhs_matheran_herpetofauna_camp",
            "activity_name": "Matheran Herpetofauna Camp",
            "date": "2026-08-25",
            "notes": "Great night trail experience",
        }
        part_res = self.client.post(f"/api/v1/users/{user_id}/participation", json=part_payload)
        self.assertEqual(part_res.status_code, 201)

        # 6. Verify Participation History
        hist_res = self.client.get(f"/api/v1/users/{user_id}/participation")
        self.assertEqual(hist_res.status_code, 200)
        self.assertEqual(hist_res.json()["count"], 1)

    def test_registration_endpoint(self):
        """Validates activity registration creation and retrieval."""
        reg_payload = {
            "user_id": f"test_user_reg_{uuid.uuid4().hex[:6]}",
            "activity_id": "bnhs_flamingo_watch_chanakya",
            "status": "registered",
        }
        reg_res = self.client.post("/api/v1/registrations", json=reg_payload)
        self.assertEqual(reg_res.status_code, 201)
        data = reg_res.json()
        self.assertEqual(data["status"], "registered")

        # Query user registrations
        list_res = self.client.get(f"/api/v1/users/{reg_payload['user_id']}/registrations")
        self.assertEqual(list_res.status_code, 200)
        self.assertGreaterEqual(len(list_res.json()), 1)

    def test_root_route(self):
        """Validates GET / returns welcome JSON with doc links."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("docs", data)


if __name__ == "__main__":
    unittest.main()
