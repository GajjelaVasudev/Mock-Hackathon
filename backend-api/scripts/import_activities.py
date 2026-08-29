"""Migration Script: Import Phase 2 Activities into MongoDB.
Reads activities from recomendation-system/data/activities.json and inserts/upserts them
into the BNHS MongoDB 'activities' collection.
"""

import json
import os
from pathlib import Path
from dotenv import load_dotenv
import pymongo

load_dotenv()

# MongoDB Configuration from environment
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "BNHS")
ACTIVITIES_JSON_PATH = Path(__file__).resolve().parent.parent.parent / "recomendation-system" / "data" / "activities.json"


def import_activities():
    """Reads activities.json and populates the MongoDB activities collection."""
    if not MONGODB_URI:
        print("❌ Error: MONGODB_URI is not set in environment variables.")
        return False

    if not ACTIVITIES_JSON_PATH.exists():
        print(f"❌ Error: activities.json not found at {ACTIVITIES_JSON_PATH}")
        return False

    print(f" Connecting to MongoDB database '{MONGODB_DATABASE}'...")
    client = pymongo.MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    
    try:
        client.admin.command("ping")
        db = client[MONGODB_DATABASE]
        activities_coll = db["activities"]
        
        # Create index on activity id
        activities_coll.create_index("id", unique=True)
        print(" Index created on field 'id'.")

        with open(ACTIVITIES_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            activities = data.get("activities", [])

        print(f" Loaded {len(activities)} activities from JSON.")

        upserted_count = 0
        for act in activities:
            result = activities_coll.update_one(
                {"id": act["id"]},
                {"$set": act},
                upsert=True
            )
            if result.upserted_id or result.modified_count:
                upserted_count += 1

        print(f"✅ Successfully synchronized {len(activities)} activities into MongoDB 'activities' collection.")
        return True

    except Exception as e:
        print(f"❌ Error during activity import: {e}")
        return False
    finally:
        client.close()


if __name__ == "__main__":
    import_activities()
