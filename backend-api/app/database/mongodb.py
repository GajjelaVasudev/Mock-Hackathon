"""MongoDB Database Connector for BNHS Platform.
Manages connection pooling, lifecycle, and health verification using PyMongo.
"""

import os
from typing import Optional
from dotenv import load_dotenv
import pymongo
from pymongo.database import Database
from pymongo.errors import ConnectionFailure, PyMongoError

load_dotenv()

# Load MongoDB configuration from environment
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "BNHS")


class MongoDBManager:
    """Singleton MongoDB Client & Database Manager."""

    _instance: Optional["MongoDBManager"] = None
    _client: Optional[pymongo.MongoClient] = None
    _db: Optional[Database] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDBManager, cls).__new__(cls)
            cls._instance._init_connection()
        return cls._instance

    def _init_connection(self):
        """Initializes the PyMongo Client."""
        if not MONGODB_URI:
            print("⚠️ MONGODB_URI is not set in environment.")
            self._client = None
            self._db = None
            return

        try:
            self._client = pymongo.MongoClient(
                MONGODB_URI,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                socketTimeoutMS=10000,
                appname="BNHS-FastAPI-Backend",
            )
            # Test connection with a quick ping
            self._client.admin.command("ping")
            self._db = self._client[MONGODB_DATABASE]
            print(f" MongoDB connected successfully to database '{MONGODB_DATABASE}'.")
        except Exception as e:
            print(f"⚠️ MongoDB connection failed: {e}")
            self._client = None
            self._db = None

    def get_database(self) -> Optional[Database]:
        """Returns the active MongoDB database instance."""
        if self._db is None or self._client is None:
            self._init_connection()
        return self._db

    def get_collection(self, collection_name: str):
        """Returns a specific MongoDB collection."""
        db = self.get_database()
        if db is None:
            return None
        return db[collection_name]

    def is_connected(self) -> bool:
        """Verifies if the MongoDB connection is alive and healthy."""
        if self._client is None:
            return False
        try:
            self._client.admin.command("ping")
            return True
        except (ConnectionFailure, PyMongoError):
            return False

    def close(self):
        """Closes the MongoDB connection pool."""
        if self._client:
            self._client.close()
            self._client = None
            self._db = None
            print("🛑 MongoDB connection closed.")


# Convenience module-level instances
db_manager = MongoDBManager()


def get_db() -> Optional[Database]:
    """Helper function to retrieve MongoDB Database instance."""
    return db_manager.get_database()


def is_mongodb_available() -> bool:
    """Helper function to check MongoDB availability."""
    return db_manager.is_connected()
