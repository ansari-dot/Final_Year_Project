# AI Service with DistilBERT

This is a standalone Python AI microservice using Flask with DistilBERT for NLP capabilities in the ReWearX platform.

## Features

- Pretrained DistilBERT transformer model for contextual text embeddings
- Cosine similarity computation using scikit-learn for clothing item matching
- REST API endpoints for text attribute extraction and similarity search
- Modular architecture for future AI component additions

## Technology Stack

- **Framework**: Flask
- **NLP**: DistilBERT (distilbert-base-uncased) via Hugging Face Transformers
- **ML**: scikit-learn, torch, numpy
- **Utilities**: python-dotenv, waitress

## Installation

1. Install Python 3.11+
2. Create virtual environment:
   ```bash
   python -m venv .venv
   ```

3. Activate virtual environment:
   - Windows: `.venv\Scripts\activate`
   - Linux: `source .venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

Edit `.env` file:
```env
MODEL_NAME=distilbert-base-uncased
TOP_RESULTS=10
PORT=5000
```

## Usage

Run the service:
```bash
python app.py
```

Or use Waitress for production:
```bash
python -m waitress --host=0.0.0.0 --port=5000 app:app
```

## API Endpoints

### Health Check
```
GET /api/health
Response: {"status": "running"}
```

### Extract Attributes
```
POST /api/extract
Body: {"text": "Need black winter hoodie"}
Response: {
  "embedding": [0.12, 0.45, ...],
  "dimensions": 768
}
```

### Compute Similarity
```
POST /api/similarity
Body: {
  "query": "Need a black hoodie",
  "items": [
    {"id": 1, "text": "Black hoodie for winter"},
    {"id": 2, "text": "Blue jeans"}
  ]
}
Response: {
  "recommendations": [
    {"id": 1, "score": 0.96},
    {"id": 2, "score": 0.15}
  ]
}
```

## Architecture

```
ai-service/
├── app.py              # Flask application
├── config.py           # Configuration
├── requirements.txt    # Dependencies
├── .env               # Environment variables
├── .env.example       # Environment template
├── routes/            # API routes
│   ├── health.py
│   ├── extract.py     # Text attribute extraction
│   ├── similarity.py  # Similarity computation
│   └── recommendation.py
├── services/          # Business logic
│   ├── nlp_service.py      # DistilBERT embeddings
│   └── similarity_service.py
├── models/            # Model loaders
│   └── distilbert_loader.py
├── utils/             # Utilities (empty)
└── logs/              # Log files (empty)
```

## Model Management

- DistilBERT downloads automatically on first run from Hugging Face
- Model cached locally at `~/.cache/huggingface/`
- Model loaded once at startup (singleton pattern)
- No training or fine-tuning - pure pretrained inference

## Integration with Node.js

The existing Node.js backend calls this service via HTTP:

```
React Frontend → Node.js Backend → POST /api/similarity → Flask AI Service
```

## NLP Pipeline

```
User Search Text: "Need black winter hoodie"
    ↓
DistilBERT Pretrained Model (distilbert-base-uncased)
    ↓
Context Understanding via Transformer Embeddings
    ↓
Generate 768-dimensional Contextual Embedding
    ↓
Recommendation Module (Cosine Similarity)
    ↓
Return Ranked Clothing Items by Semantic Match
```

## Performance

- Model loaded once at startup
- Concurrent request support via Waitress
- Response time: < 500ms for typical requests
- 768-dimensional embeddings from DistilBERT

## FYP Documentation

**Natural Language Processing Module Implementation**

"The system integrates a pretrained DistilBERT transformer model through Hugging Face Transformers. User queries and clothing descriptions are converted into contextual embeddings using DistilBERT's attention mechanism. These embeddings capture semantic relationships between words and improve search understanding. The generated text features are passed to the recommendation module, where cosine similarity using Scikit-learn calculates similarity scores between user preferences and available clothing items."

## Future Extensibility

The modular architecture allows adding:
- Image-based models (EfficientNet-B0)
- Text classification models
- Custom attribute extraction models
