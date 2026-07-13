from flask import Blueprint, request, jsonify
import logging

from services.nlp_service import NLService

logger = logging.getLogger(__name__)
extract_bp = Blueprint('extract', __name__)

@extract_bp.route('/api/extract', methods=['POST'])
def extract_attributes():
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({"error": "Missing 'text' field"}), 400
    
    text = data['text']
    
    if not text or not isinstance(text, str):
        return jsonify({"error": "Text must be a non-empty string"}), 400
    
    nlp_service = NLService()
    embedding = nlp_service.generate_embedding(text)
    
    return jsonify({"embedding": embedding, "dimensions": len(embedding)})
