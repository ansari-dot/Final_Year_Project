"""
DistilBERT Model Loader

This service loads and caches the pretrained DistilBERT model from Hugging Face.
The model is loaded only once when Flask starts and cached for reuse.
"""

import logging
from typing import Tuple, Optional
from transformers import AutoTokenizer, AutoModel

from config import Config

logger = logging.getLogger(__name__)

class DistilBERTLoader:
    """Singleton loader for DistilBERT model."""
    
    _instance: Optional['DistilBERTLoader'] = None
    _tokenizer: Optional[AutoTokenizer] = None
    _model: Optional[AutoModel] = None
    
    def __new__(cls) -> 'DistilBERTLoader':
        """Implement singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize the model loader."""
        if self._tokenizer is None or self._model is None:
            self._load_model()
    
    def _load_model(self) -> None:
        """Load the pretrained DistilBERT model."""
        try:
            logger.info(f"Loading DistilBERT model: {Config.MODEL_NAME}")
            self._tokenizer = AutoTokenizer.from_pretrained(Config.MODEL_NAME)
            self._model = AutoModel.from_pretrained(Config.MODEL_NAME)
            logger.info("DistilBERT model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load DistilBERT model: {e}")
            raise
    
    def get_model(self) -> Tuple[AutoTokenizer, AutoModel]:
        """Get the loaded tokenizer and model instance."""
        if self._tokenizer is None or self._model is None:
            raise RuntimeError("Model not loaded")
        return self._tokenizer, self._model
