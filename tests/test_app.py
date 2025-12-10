import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


class TestActivities:
    """Test suite for activities endpoints"""

    def test_get_activities(self):
        """Test getting all activities"""
        response = client.get("/activities")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        assert "Chess Club" in data
        assert "Programming Class" in data
        assert "Gym Class" in data

    def test_get_activity_structure(self):
        """Test that activities have the correct structure"""
        response = client.get("/activities")
        data = response.json()
        activity = data["Chess Club"]
        assert "description" in activity
        assert "schedule" in activity
        assert "max_participants" in activity
        assert "participants" in activity
        assert isinstance(activity["participants"], list)


class TestSignup:
    """Test suite for signup endpoints"""

    def test_signup_activity(self):
        """Test signing up for an activity"""
        response = client.post("/activities/Chess%20Club/signup?email=newstudent@example.com")
        assert response.status_code == 200
        result = response.json()
        assert "message" in result
        assert "newstudent@example.com" in result["message"]
        assert "Chess Club" in result["message"]

    def test_signup_duplicate_activity(self):
        """Test that duplicate signups are prevented"""
        email = "duplicate@example.com"
        # First signup should succeed
        response1 = client.post(f"/activities/Chess%20Club/signup?email={email}")
        assert response1.status_code == 200

        # Second signup with same email should fail
        response2 = client.post(f"/activities/Chess%20Club/signup?email={email}")
        assert response2.status_code == 400
        assert "already signed up" in response2.json()["detail"]

    def test_signup_nonexistent_activity(self):
        """Test signing up for a non-existent activity"""
        response = client.post("/activities/NonExistent%20Activity/signup?email=test@example.com")
        assert response.status_code == 404
        assert "Activity not found" in response.json()["detail"]


class TestUnregister:
    """Test suite for unregister endpoints"""

    def test_delete_participant(self):
        """Test removing a participant from an activity"""
        email = "toremove@example.com"
        # First, sign up
        client.post(f"/activities/Chess%20Club/signup?email={email}")

        # Then, remove
        response = client.delete(f"/activities/Chess%20Club/signup?email={email}")
        assert response.status_code == 200
        result = response.json()
        assert "message" in result
        assert email in result["message"]

    def test_delete_nonexistent_participant(self):
        """Test removing a participant that doesn't exist"""
        response = client.delete("/activities/Chess%20Club/signup?email=nonexistent@example.com")
        assert response.status_code == 404
        assert "Participant not found" in response.json()["detail"]

    def test_delete_from_nonexistent_activity(self):
        """Test removing a participant from a non-existent activity"""
        response = client.delete("/activities/NonExistent%20Activity/signup?email=test@example.com")
        assert response.status_code == 404
        assert "Activity not found" in response.json()["detail"]
