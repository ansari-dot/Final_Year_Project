# ReWearX — NLP System Documentation
> Every NLP-related file explained by name, what happens inside it, and how it connects to the rest of the system.

---

## TABLE OF CONTENTS

1. [ai-service/config.py](#1-ai-serviceconfigpy)
2. [ai-service/app.py](#2-ai-serviceapppy)
3. [ai-service/models/distilbert_loader.py](#3-ai-servicemodelsdistilbert_loaderpy)
4. [ai-service/services/nlp_service.py](#4-ai-serviceservicesnlp_servicepy)
5. [ai-service/services/similarity_service.py](#5-ai-serviceservicessimilarity_servicepy)
6. [ai-service/routes/health.py](#6-ai-servicerouteshealthpy)
7. [ai-service/routes/extract.py](#7-ai-serviceroutesextractpy)
8. [ai-service/routes/recommendation.py](#8-ai-serviceroutesrecommendationpy)
9. [ai-service/routes/similarity.py](#9-ai-serviceroutessimilaritypy)
10. [ai-service/requirements.txt](#10-ai-servicerequirementstxt)
11. [server/services/nlpSearchService.js](#11-serverservicesnlpsearchservicejs)
12. [server/controllers/nlpSearchController.js](#12-servercontrollersnlpsearchcontrollerjs)
13. [server/routes/nlpSearch.routes.js](#13-serverroutesnlpsearchroutesjs)
14. [server/services/recommendationService.js](#14-serverservicesrecommendationservicejs)
15. [server/controllers/recommendationController.js](#15-servercontrollersrecommendationcontrollerjs)
16. [server/routes/recommendations.routes.js](#16-serverroutesrecommendationsroutesjs)
17. [client/src/lib/api/recommendations.ts](#17-clientsrclibapirecommendationsts)
18. [client/src/pages/Recommendations.tsx](#18-clientsrcpagesrecommendationstsx)
19. [client/src/components/layout/AISearchWidget.tsx](#19-clientsrccomponentslayoutaisearchwidgettsx)

---

## 1. `ai-service/config.py`

**What happens here:**
This file reads environment variables from the `.env` file and stores them as a `Config` class so every other file can import settings from one place.

| Variable | Default Value | Purpose |
|---|---|---|
| `MODEL_NAME` | `distilbert-base-uncased` | Which Hugging Face model to load |
| `TOP_RESULTS` | `10` | How many results to return by default |
| `PORT` | `5000` | Flask server port |
| `HOST` | `0.0.0.0` | Flask server host |
| `LOG_FILE` | `logs/ai_service.log` | Where to write logs |

**Used by:** `app.py`, `distilbert_loader.py`

---

## 2. `ai-service/app.py`

**What happens here:**
This is the **main entry point** of the Flask AI service. It does the following:

1. Creates the Flask app
2. Enables CORS so Node.js server can call it
3. Sets up Flask-RESTX for Swagger API documentation at `/api/docs`
4. Registers 4 namespaces (groups of routes):
   - `health` → `/health/`
   - `query` → `/query/attributes`
   - `rank` → `/rank/`
   - `extract` → `/extract/`
   - `similarity` → `/similarity/`
5. Registers 4 Blueprints from the `routes/` folder
6. Handles 404 and 500 errors globally
7. Starts the server on `host:port` from Config

**Key line:**
```python
app = create_app()
```
This is what runs when you do `python app.py`.

---

## 3. `ai-service/models/distilbert_loader.py`

**What happens here:**
This file loads the **DistilBERT AI model** from Hugging Face and keeps it in memory.

### What is DistilBERT?
DistilBERT is a smaller, faster version of BERT (a Google NLP model). It reads text and converts it into a list of 768 numbers called an **embedding**. These numbers capture the *meaning* of the text — similar words/sentences get similar numbers.

### Singleton Pattern
The class uses a **Singleton** — meaning the model is loaded only **once** when Flask starts, and every request reuses the same loaded model. This avoids reloading a large model file on every API call.

```
First request  → model loads from disk (slow, ~2-3 seconds)
All next requests → model already in memory (fast, milliseconds)
```

### Two things it loads:
- **Tokenizer** — converts text like `"blue jacket"` into token IDs like `[101, 2630, 4440, 102]`
- **Model** — takes token IDs and outputs a 768-dimensional embedding vector

**Used by:** `nlp_service.py`

---

## 4. `ai-service/services/nlp_service.py`

**What happens here:**
This is the **core NLP brain**. It uses the loaded DistilBERT model to do all text understanding tasks.

### Function 1: `generate_embedding(text)`
- Takes one text string (e.g. `"red summer dress"`)
- Tokenizes it → runs through DistilBERT → takes the **mean** of all token outputs → normalizes the vector
- Returns a list of 768 float numbers

```
"red summer dress" → [0.23, -0.11, 0.87, 0.04, ...] (768 numbers)
```

### Function 2: `generate_embeddings(texts)`
- Same as above but for a **list** of texts at once (batch processing)
- More efficient than calling `generate_embedding` in a loop

### Function 3: `match_attribute(query, values)`
- Takes a user query and a list of attribute options (e.g. categories, colors)
- Embeds the query AND all attribute values
- Computes **dot product** (= cosine similarity since vectors are normalized) between query and each attribute
- Returns all attributes sorted by similarity score (highest first)

**Example:**
```
query = "warm winter coat"
values = ["Jackets", "Shirts", "Dresses", "Sweaters"]

Result:
  Jackets  → score: 0.91
  Sweaters → score: 0.83
  Shirts   → score: 0.61
  Dresses  → score: 0.54
```

### Normalization
Both `_normalize_embedding` and `_normalize_embeddings` divide each vector by its length (L2 norm) so all vectors have length = 1. This makes dot product equal to cosine similarity.

**Used by:** `routes/extract.py`, `routes/recommendation.py`, `similarity_service.py`

---

## 5. `ai-service/services/similarity_service.py`

**What happens here:**
This service handles **ranking items** by semantic similarity to a query.

### Function: `rank_items(query_embedding, items, top_n)`
- Receives a pre-computed query embedding (768 numbers) from Node.js
- Receives a list of items, each with `id` and `text`
- Embeds all item texts using `NLService`
- Computes **cosine similarity** between query embedding and each item embedding using `sklearn`
- Returns items sorted by score, optionally limited to `top_n`

### Function: `compute_similarity(query, items)`
- Similar but takes raw query text instead of pre-computed embedding
- Generates the query embedding internally then ranks items

### Why cosine similarity?
Cosine similarity measures the **angle** between two vectors. If two texts mean similar things, their vectors point in similar directions → high cosine score (close to 1.0). Unrelated texts → low score (close to 0.0).

**Used by:** `routes/similarity.py`, `routes/recommendation.py`

---

## 6. `ai-service/routes/health.py`

**What happens here:**
A simple health check endpoint. Node.js can call this to verify the Flask service is alive before sending real requests.

```
GET /api/health
Response: { "status": "running" }
```

**Used by:** Node.js server startup checks, monitoring

---

## 7. `ai-service/routes/extract.py`

**What happens here:**
Exposes the embedding generation as an HTTP endpoint.

```
POST /api/extract
Body:  { "text": "blue denim jacket" }
Response: { "embedding": [0.23, -0.11, ...], "dimensions": 768 }
```

- Validates that `text` field exists and is a non-empty string
- Calls `NLService.generate_embedding(text)`
- Returns the 768-number vector

**Called by:** `server/services/nlpSearchService.js` — to get the query embedding before ranking

---

## 8. `ai-service/routes/recommendation.py`

**What happens here:**
This file has **two endpoints** — the most important ones in the whole NLP pipeline.

### Endpoint 1: `POST /api/query/attributes`
This is where NLP **understands the user's search query**.

**Input:**
```json
{
  "query": "red summer dress for women",
  "categories": [{"name": "Dresses", "description": "..."}, ...],
  "colors": [{"name": "red"}, {"name": "blue"}, ...],
  "genders": [{"name": "female"}, {"name": "male"}, ...],
  "conditions": [{"name": "new"}, ...],
  "threshold": 0.75
}
```

**What happens:**
- For each attribute type (category, color, gender, condition, season, occasion)
- Calls `NLService.match_attribute(query, values)`
- Filters results above the threshold score
- Returns matched attributes with scores

**Output:**
```json
{
  "category": [{"name": "Dresses", "score": 0.91}],
  "color": [{"name": "red", "score": 0.88}],
  "gender": [{"name": "female", "score": 0.92}]
}
```

### Endpoint 2: `POST /api/rank`
Takes a query embedding + list of items → returns items ranked by semantic similarity.

**Input:**
```json
{
  "query_embedding": [0.23, -0.11, ...],
  "items": [{"id": 1, "text": "red floral dress size M"}, ...],
  "top_n": 20
}
```

**Output:**
```json
{
  "rankings": [{"id": 1, "score": 0.91, "semantic_score": 0.91}, ...]
}
```

**Called by:** `server/services/nlpSearchService.js`

---

## 9. `ai-service/routes/similarity.py`

**What happens here:**
A direct similarity endpoint — takes a raw query string and items, returns similarity scores.

```
POST /api/similarity
Body: { "query": "casual shirt", "items": [{"id": 1, "text": "..."}, ...] }
Response: { "recommendations": [{"id": 1, "score": 0.87}, ...] }
```

Calls `SimilarityService.compute_similarity()` internally.

**Used for:** Direct similarity comparisons without pre-computing embeddings

---

## 10. `ai-service/requirements.txt`

**What happens here:**
Lists all Python packages needed to run the AI service.

| Package | Purpose |
|---|---|
| `Flask` | Web framework to create the API |
| `Flask-CORS` | Allows Node.js to call Flask from a different port |
| `Flask-RESTX` | Adds Swagger UI docs at `/api/docs` |
| `transformers` | Hugging Face library — provides DistilBERT tokenizer and model |
| `torch` | PyTorch — runs the neural network computations |
| `scikit-learn` | Provides `cosine_similarity` function |
| `numpy` | Array math operations |
| `python-dotenv` | Reads `.env` file into environment variables |
| `waitress` | Production WSGI server for Flask |

**Install with:** `pip install -r requirements.txt`

---

## 11. `server/services/nlpSearchService.js`

**What happens here:**
This is the **main NLP search orchestrator** on the Node.js side. It coordinates everything.

### Full Step-by-Step Flow:

**Step 1 — Fetch reference data from DB**
```
Categories (active ones) + distinct colors from ClothingItem table
```

**Step 2 — Call Flask in parallel (2 requests simultaneously)**
```
Request A: POST /api/query/attributes  → understand what the query means
Request B: POST /api/extract           → get query as a 768-number vector
```

**Step 3 — Build SQL WHERE filter from NLP results**
- Explicit category in query text → `WHERE categoryId = X`
- Gender score ≥ 0.85 → `WHERE gender IN ['female', 'unisex']`
- Condition score ≥ 0.85 → `WHERE condition = 'new'`
- Color score ≥ 0.84 → `WHERE color LIKE '%red%'`

**Step 4 — Fetch up to 100 items from database**

**Step 5 — Send items to Flask for semantic ranking**
```
POST /api/rank  →  { query_embedding, items: [{id, text}] }
```
Each item's text = `title + description + brand + category + color + gender` joined together.

**Step 6 — Apply smart threshold and return top 20**
```
If top score >= 0.80  →  keep items with score >= 0.70  (specific query)
If top score < 0.80   →  keep items within 0.05 of top  (vague query)
```

**Fallback:** If Flask is unreachable → returns `null` → controller falls back to keyword search.

### Helper Functions:
- `getDistinctColors()` — queries DB for all unique color values
- `extractAttributes()` — calls Flask `/api/query/attributes`
- `rankItems()` — calls Flask `/api/rank`
- `findExplicitCategory()` — checks if query literally contains a category name using regex word boundaries

---

## 12. `server/controllers/nlpSearchController.js`

**What happens here:**
HTTP request handler for the search endpoint. Sits between the route and the service.

### Logic:
1. Reads `q` (query), `page`, `limit` from request query params
2. Gets `excludeUserId` from logged-in user (so users don't see their own items)
3. If no query → return all items (paginated)
4. If query → call `nlpSearch(query, excludeUserId, limit)`
5. If NLP returns results → send them back
6. If NLP returns empty → fallback to `listItems({ q: query })` (SQL keyword search)

Sets `Cache-Control: no-store` so browser always gets fresh NLP results.

---

## 13. `server/routes/nlpSearch.routes.js`

**What happens here:**
Defines the URL route for NLP search.

```
GET /api/nlp-search?q=blue jacket
```

- Uses `optionalAuth` middleware — works for both logged-in users and guests
- Calls `search` controller function

**Registered in:** `server/routes/index.js`

---

## 14. `server/services/recommendationService.js`

**What happens here:**
Generates personalized item recommendations for a logged-in user using **content-based filtering** (no Flask needed for this).

### How Scoring Works:
Each available item gets a score from 0.0 to 1.0 based on:

| Signal | Points | Condition |
|---|---|---|
| Gender match | +0.15 | User's preferred gender matches item |
| Condition match | +0.10 | User's preferred condition matches item |
| Size match | +0.15 | Item size is in user's preferred sizes |
| Color match | +0.10 | Item color matches user's preferred colors |
| Category match | +0.20 | Item category is in user's preferred categories |
| Visual similarity | up to +0.40 | Cosine similarity of image feature vectors |
| Freshness boost | +0.05 | Item listed within last 7 days |
| Popularity boost | up to +0.05 | Item has more than 10 views |

### User Interest Vector:
- Collects all items the user has **saved** or been involved in **swaps** with
- Loads their `imageVector` from `ItemFeatures` table
- Averages all vectors → creates a "user taste vector"
- Compares this against each available item's image vector using cosine similarity

### Caching:
- Results are saved in the `Recommendation` table
- Cache is valid for **1 hour**
- If fresh cache exists and `refresh=false` → return cached results
- Otherwise → regenerate and save new results

### Functions:
- `generateRecommendations(userId, limit)` — full scoring pipeline
- `getRecommendations(userId, limit, refresh)` — checks cache first, then generates
- `callFastAPIRecommend()` — stub for future Flask integration (currently returns null)

---

## 15. `server/controllers/recommendationController.js`

**What happens here:**
Simple HTTP handler for the recommendations endpoint.

- Reads `limit` (default 20) and `refresh` flag from query params
- Calls `recommendationService.getRecommendations(req.user.id, limit, refresh)`
- Returns results as JSON

---

## 16. `server/routes/recommendations.routes.js`

**What happens here:**
Defines the URL route for recommendations.

```
GET /api/recommendations?limit=20&refresh=false
```

- Uses `authenticate` middleware — **requires login** (unlike NLP search which is optional)
- Calls `recommendationController.list`

---

## 17. `client/src/lib/api/recommendations.ts`

**What happens here:**
TypeScript API client function that calls the Node.js recommendations endpoint from the React frontend.

```typescript
recommendationsApi.list(24, refresh)
// → GET /api/recommendations?limit=24&refresh=false
// → Returns: ApiRecommendation[] (array of { item, score, reason })
```

**Used by:** `Recommendations.tsx` page

---

## 18. `client/src/pages/Recommendations.tsx`

**What happens here:**
The **"For You" page** in the React app — shows AI-powered recommendations to the user.

### What it does:
1. On load → fetches recommendations from API
2. Fetches user's saved items (to show heart icon state)
3. Fetches user's current preferences from API
4. Displays items in a grid with match score badges

### Preferences Modal:
User can set:
- Preferred sizes (XS, S, M, L, XL, XXL)
- Gender (Any, Male, Female, Unisex)
- Condition (Any, New, Like New, Good, Fair)
- Categories (checkboxes from DB)
- Colors (color circle buttons)

On save → calls `usersApi.updatePreferences()` → then calls `fetchRecs(refresh=true)` to regenerate recommendations with new preferences.

### Sorting:
- "Highest match" → sorted by `matchScore` (AI score)
- "Newest" → sorted by `createdAt` date

---

## 19. `client/src/components/layout/AISearchWidget.tsx`

**What happens here:**
The **floating AI Search button** (bottom-right corner of every page).

### What it does:
- Shows a floating button with "AI SEARCH" label that expands on hover
- On click → opens a side panel
- User can upload a photo of a clothing item
- Shows a scanning animation while "analyzing"
- Displays mock results with match scores

> **Note:** The image upload UI is fully built. The visual search backend (image → embedding → DB search) is planned for future integration. Currently shows mock results after a 2.5 second simulated delay.

### UI States:
| State | What user sees |
|---|---|
| Default | Floating button bottom-right |
| Panel open | Side drawer slides in from right (or bottom on mobile) |
| Image uploaded | Preview + scanning animation |
| Results ready | List of matched items with swap request button |

---

## COMPLETE DATA FLOW DIAGRAM

```
USER TYPES: "red summer dress for women"
                    |
                    v
        React → GET /api/nlp-search?q=...
                    |
                    v
        nlpSearch.routes.js  (optionalAuth)
                    |
                    v
        nlpSearchController.js
                    |
                    v
        nlpSearchService.js
          |                    |
          v                    v
    DB: Categories          DB: Colors
          |                    |
          +--------+-----------+
                   |
          Flask: POST /api/query/attributes
                   |
          distilbert_loader.py (loads model once)
                   |
          nlp_service.py → generate_embedding("red summer dress")
          nlp_service.py → generate_embeddings(["Dresses","Shirts",...])
          nlp_service.py → dot product → scores
                   |
          Returns: { category: "Dresses 0.91", color: "red 0.88", gender: "female 0.92" }
                   |
          Flask: POST /api/extract  (parallel)
                   |
          Returns: query_embedding = [0.23, -0.11, ...] (768 numbers)
                   |
          Build SQL WHERE filter
                   |
          DB: Fetch 100 matching ClothingItems
                   |
          Flask: POST /api/rank
                   |
          similarity_service.py → cosine_similarity(query_embedding, item_embeddings)
                   |
          Returns: ranked items with scores
                   |
          Apply threshold → top 20 results
                   |
                   v
        React displays results grid
```

---

## FILE SUMMARY TABLE

| File | Layer | Language | Role |
|---|---|---|---|
| `ai-service/config.py` | AI | Python | Environment config |
| `ai-service/app.py` | AI | Python | Flask app entry point |
| `ai-service/models/distilbert_loader.py` | AI | Python | Load & cache DistilBERT model |
| `ai-service/services/nlp_service.py` | AI | Python | Generate embeddings, match attributes |
| `ai-service/services/similarity_service.py` | AI | Python | Cosine similarity ranking |
| `ai-service/routes/health.py` | AI | Python | Health check endpoint |
| `ai-service/routes/extract.py` | AI | Python | `/api/extract` — text to embedding |
| `ai-service/routes/recommendation.py` | AI | Python | `/api/query/attributes` + `/api/rank` |
| `ai-service/routes/similarity.py` | AI | Python | `/api/similarity` endpoint |
| `ai-service/requirements.txt` | AI | Text | Python dependencies |
| `server/services/nlpSearchService.js` | Server | JavaScript | Full NLP search pipeline |
| `server/controllers/nlpSearchController.js` | Server | JavaScript | HTTP handler for search |
| `server/routes/nlpSearch.routes.js` | Server | JavaScript | Route: GET /api/nlp-search |
| `server/services/recommendationService.js` | Server | JavaScript | Content-based recommendation engine |
| `server/controllers/recommendationController.js` | Server | JavaScript | HTTP handler for recommendations |
| `server/routes/recommendations.routes.js` | Server | JavaScript | Route: GET /api/recommendations |
| `client/src/lib/api/recommendations.ts` | Client | TypeScript | API call function |
| `client/src/pages/Recommendations.tsx` | Client | TypeScript | "For You" recommendations page |
| `client/src/components/layout/AISearchWidget.tsx` | Client | TypeScript | Floating AI search button & panel |
