import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration."""
    
    # Model configuration
    MODEL_NAME = os.getenv("MODEL_NAME", "distilbert-base-uncased")
    TOP_RESULTS = int(os.getenv("TOP_RESULTS", "10"))
    
    # Server configuration
    PORT = int(os.getenv("PORT", "5000"))
    HOST = os.getenv("HOST", "0.0.0.0")
    
    # Logging configuration
    LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
    LOG_FILE = os.path.join(LOG_DIR, "ai_service.log")
