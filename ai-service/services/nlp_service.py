from typing import List, Dict, Any
import numpy as np
import torch
import logging

from models.distilbert_loader import DistilBERTLoader

logger = logging.getLogger(__name__)

class NLService:
    def __init__(self):
        self.model_loader = DistilBERTLoader()
    
    def generate_embedding(self, text: str) -> List[float]:
        if not text or not isinstance(text, str):
            raise ValueError("Text must be a non-empty string")
        
        try:
            tokenizer, model = self.model_loader.get_model()
            
            inputs = tokenizer(
                text,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=512
            )
            
            with torch.no_grad():
                outputs = model(**inputs)
            
            embedding = outputs.last_hidden_state.mean(dim=1)
            embedding = self._normalize_embedding(embedding)
            
            return embedding.numpy()[0].tolist()
            
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise RuntimeError(f"Failed to generate embedding: {e}")
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        
        try:
            tokenizer, model = self.model_loader.get_model()
            
            inputs = tokenizer(
                texts,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=512
            )
            
            with torch.no_grad():
                outputs = model(**inputs)
            
            embeddings = outputs.last_hidden_state.mean(dim=1)
            embeddings = self._normalize_embeddings(embeddings)
            
            return [emb.tolist() for emb in embeddings.numpy()]
            
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            raise RuntimeError(f"Failed to generate embeddings: {e}")
    
    def match_attribute(self, query: str, values: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        if not query or not isinstance(query, str):
            return []
        
        if not values or not isinstance(values, list):
            return []
        
        try:
            query_embedding = self.generate_embedding(query)
            query_array = np.array(query_embedding).reshape(1, -1)
            
            texts_to_embed = []
            item_names = []
            
            for item in values:
                if isinstance(item, dict):
                    if 'description' in item:
                        text_to_embed = f"{item['name']} - {item['description']}"
                    else:
                        text_to_embed = item['name']
                    item_name = item['name']
                else:
                    text_to_embed = item
                    item_name = item
                
                texts_to_embed.append(text_to_embed)
                item_names.append(item_name)
            
            value_embeddings = self.generate_embeddings(texts_to_embed)
            value_array = np.array(value_embeddings)
            
            similarities = np.dot(query_array, value_array.T)[0]
            
            results = []
            for i, item_name in enumerate(item_names):
                results.append({"name": item_name, "score": float(similarities[i])})
            
            results.sort(key=lambda x: x["score"], reverse=True)
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to match attribute: {e}")
            raise RuntimeError(f"Failed to match attribute: {e}")
    
    def _normalize_embedding(self, embedding: torch.Tensor) -> torch.Tensor:
        return embedding / torch.norm(embedding, dim=-1, keepdim=True)
    
    def _normalize_embeddings(self, embeddings: torch.Tensor) -> torch.Tensor:
        norms = torch.norm(embeddings, dim=-1, keepdim=True)
        return embeddings / norms
