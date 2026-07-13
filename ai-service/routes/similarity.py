from flask import Blueprint, request, jsonify
import logging

from services.similarity_service import SimilarityService

logger = logging.getLogger(__name__)
similarity_bp = Blueprint('similarity', __name__)

@similarity_bp.route('/api/similarity', methods=['POST'])
def compute_similarity():
    data = request.get_json()
    
    if not data or 'query' not in data or 'items' not in data:
        return jsonify({"error": "Missing required fields"}), 400
    
    query = data['query']
    items = data['items']
    
    if not query or not isinstance(query, str):
        return jsonify({"error": "Query must be a non-empty string"}), 400
    
    if not isinstance(items, list):
        return jsonify({"error": "Items must be a list"}), 400
    
    similarity_service = SimilarityService()
    recommendations = similarity_service.compute_similarity(query, items)
    
    return jsonify({"recommendations": recommendations})
