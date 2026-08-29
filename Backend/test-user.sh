#!/bin/bash
# ============================================================
# END-TO-END TEST — USER ROLE
# ============================================================
# Edit these two lines to match a real, already-verified "user"
# account in your database.
BASE_URL="http://localhost:3000"
EMAIL="testuser@bnhs.org"
PASSWORD="Test@123"

COOKIES="user_cookies.txt"
rm -f "$COOKIES"

# Fill this in with a real activity _id from your database
# (open Compass, copy an _id from the activities collection).
ACTIVITY_ID="6a92b44975a117f5d2d3c4d0"

echo "=================================================="
echo " USER TESTS — logging in as $EMAIL"
echo "=================================================="

echo ""
echo "--- LOGIN ---"
echo "expected: success, and a token cookie gets saved to $COOKIES"
curl -s -c "$COOKIES" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
echo ""

echo ""
echo "--- GET MY PROFILE (GET /api/user/me) ---"
echo "expected: your user info. NOTE: this currently also leaks the"
echo "hashed 'password' field — that's the known bug, see README."
curl -s -b "$COOKIES" "$BASE_URL/api/user/me"
echo ""

echo ""
echo "--- UPDATE MY PROFILE (PUT /api/user/me) ---"
echo "expected: success, interests updated"
curl -s -b "$COOKIES" -X PUT "$BASE_URL/api/user/me" \
  -H "Content-Type: application/json" \
  -d '{"interests":["birds","trails"],"experienceLevel":"beginner"}'
echo ""

echo ""
echo "--- LIST ACTIVITIES (GET /api/activities) ---"
echo "expected: a list of activities. Copy one _id into ACTIVITY_ID"
echo "at the top of this script if you haven't already."
curl -s -b "$COOKIES" "$BASE_URL/api/activities"
echo ""

echo ""
echo "--- VIEW ONE ACTIVITY (GET /api/activities/:id) ---"
echo "expected: details for that one activity"
curl -s -b "$COOKIES" "$BASE_URL/api/activities/$ACTIVITY_ID"
echo ""

echo ""
echo "--- REGISTER FOR ACTIVITY (POST /api/registrations) ---"
echo "expected: 'Registered for activity successfully' + a registration doc"
echo "(note: the body field is 'activityId', not 'activity')"
curl -s -b "$COOKIES" -X POST "$BASE_URL/api/registrations" \
  -H "Content-Type: application/json" \
  -d "{\"activityId\":\"$ACTIVITY_ID\"}"
echo ""

echo ""
echo "--- REGISTER AGAIN (should fail) ---"
echo "expected: 409 error, 'Already registered for this activity'"
curl -s -b "$COOKIES" -X POST "$BASE_URL/api/registrations" \
  -H "Content-Type: application/json" \
  -d "{\"activityId\":\"$ACTIVITY_ID\"}"
echo ""

echo ""
echo "--- VIEW MY JOURNEY (GET /api/user/me/journey) ---"
echo "expected: attended activities + earned badges (empty at first,"
echo "since staff hasn't marked you as attended yet)"
curl -s -b "$COOKIES" "$BASE_URL/api/user/me/journey"
echo ""

echo ""
echo "--- REQUEST VOLUNTEER STATUS (POST /api/user/me/volunteer-request) ---"
echo "expected: rejected — you don't have all 5 milestone badges yet"
curl -s -b "$COOKIES" -X POST "$BASE_URL/api/user/me/volunteer-request"
echo ""

echo ""
echo "--- TRY AN ADMIN-ONLY ROUTE (GET /api/admin/user) ---"
echo "expected: 403 Forbidden — users must not be able to see this"
curl -s -b "$COOKIES" "$BASE_URL/api/admin/user"
echo ""

echo ""
echo "--- TRY A STAFF-ONLY ROUTE (POST /api/activities) ---"
echo "expected: 403 Forbidden — regular users can't create activities"
curl -s -b "$COOKIES" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d '{"title":"Should Fail","description":"x","type":"trail","date":"2026-09-01","location":"x","capacity":5}'
echo ""

echo ""
echo "--- LOGOUT (POST /api/auth/logout) ---"
echo "expected: success, cookie cleared"
curl -s -b "$COOKIES" -X POST "$BASE_URL/api/auth/logout"
echo ""

echo ""
echo "=================================================="
echo " USER TESTS DONE"
echo "=================================================="
