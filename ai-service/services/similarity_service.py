from typing import List, Dict, Any
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import logging

logger = logging.getLogger(__name__)

class SimilarityService:
    def rank_items(
        self, 
        query_embedding: List[float], 
        items: List[Dict[str, Any]],
        top_n: int = None
    ) -> List[Dict[str, Any]]:
        if not items:
            return []
        
        try:
            query_array = np.array(query_embedding).reshape(1, -1)
            
            item_texts = [item.get('text', '') for item in items]
            item_embeddings = self._generate_item_embeddings(item_texts)
            item_array = np.array(item_embeddings)
            
            semantic_similarities = cosine_similarity(query_array, item_array)[0]
            
            rankings = []
            for i, item in enumerate(items):
                rankings.append({
                    "id": item.get('id'),
                    "score": float(semantic_similarities[i]),
                    "semantic_score": float(semantic_similarities[i])
                })
            
            rankings.sort(key=lambda x: x['score'], reverse=True)
            
            if top_n is not None:
                rankings = rankings[:top_n]
            
            return rankings
            
        except Exception as e:
            logger.error(f"Failed to rank items: {e}")
            raise RuntimeError(f"Failed to rank items: {e}")
    
    def _generate_item_embeddings(self, texts: List[str]) -> List[List[float]]:
        try:
            from services.nlp_service import NLService
            nlp_service = NLService()
            return nlp_service.generate_embeddings(texts)
        except Exception as e:
            logger.error(f"Failed to generate item embeddings: {e}")
            raise RuntimeError(f"Failed to generate item embeddings: {e}")
