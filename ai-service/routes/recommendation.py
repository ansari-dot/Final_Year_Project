from flask import Blueprint, request, jsonify
import logging

from services.nlp_service import NLService
from services.similarity_service import SimilarityService

logger = logging.getLogger(__name__)
recommendation_bp = Blueprint('recommendation', __name__)

@recommendation_bp.route('/api/query/attributes', methods=['POST'])
def extract_query_attributes():
    data = request.get_json()
    
    if not data or 'query' not in data:
        return jsonify({"error": "Missing 'query' field"}), 400
    
    query = data['query']
    
    if not query or not isinstance(query, str):
        return jsonify({"error": "Query must be a non-empty string"}), 400
    
    categories = data.get('categories', [])
    colors = data.get('colors', [])
    conditions = data.get('conditions', [])
    genders = data.get('genders', [])
    seasons = data.get('seasons', [])
    occasions = data.get('occasions', [])
    
    if not any([categories, colors, conditions, genders, seasons, occasions]):
        return jsonify({"error": "At least one attribute list required"}), 400
    
    nlp_service = NLService()
    result = {}
    
    threshold = data.get('threshold', 0.75)

    if categories:
        matches = nlp_service.match_attribute(query, categories)
        # Return top-5 above threshold for Node.js gap analysis
        result['category'] = [
            {'name': m['name'], 'score': m['score']}
            for m in matches[:5]
        ]
    
    if colors:
        matches = nlp_service.match_attribute(query, colors)
        result['color'] = [{'name': m['name'], 'score': m['score']} for m in matches if m['score'] >= threshold]
    
    if conditions:
        matches = nlp_service.match_attribute(query, conditions)
        result['condition'] = [{'name': m['name'], 'score': m['score']} for m in matches if m['score'] >= threshold]
    
    if genders:
        matches = nlp_service.match_attribute(query, genders)
        result['gender'] = [{'name': m['name'], 'score': m['score']} for m in matches if m['score'] >= threshold]
    
    if seasons:
        matches = nlp_service.match_attribute(query, seasons)
        result['season'] = [{'name': m['name'], 'score': m['score']} for m in matches if m['score'] >= threshold]
    
    if occasions:
        matches = nlp_service.match_attribute(query, occasions)
        result['occasion'] = [{'name': m['name'], 'score': m['score']} for m in matches if m['score'] >= threshold]
    
    return jsonify(result)

@recommendation_bp.route('/api/rank', methods=['POST'])
def rank_items():
    data = request.get_json()
    
    if not data or 'query_embedding' not in data or 'items' not in data:
        return jsonify({"error": "Missing required fields"}), 400
    
    query_embedding = data['query_embedding']
    items = data['items']
    top_n = data.get('top_n')
    
    if not isinstance(query_embedding, list) or not items:
        return jsonify({"error": "Invalid input format"}), 400
    
    similarity_service = SimilarityService()
    rankings = similarity_service.rank_items(query_embedding, items, top_n)
    
    return jsonify({"rankings": rankings})