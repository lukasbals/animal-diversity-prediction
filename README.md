# Animal Diversity Prediction

This repository contains:
- a Python-based data science / API workflow for animal diversity prediction
- a Next.js dashboard UI for visualizing species extinction risk insights

## Repository Structure

- `notebooks/` — model exploration, training, and analysis notebooks
- `api/` — Python API code
- `ui/` — Next.js frontend dashboard
- `data/` — project data assets
- `config/` — configuration files

## Python Environment Setup

Create and activate a virtual environment, then install Python dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Running the Python / API Side

### Notebooks

After activating the virtual environment, go to the notebooks folder and run the notebooks there:

```bash
cd notebooks
```

Then open and execute the notebooks with your preferred Jupyter workflow.

### API

The API entrypoint is `api/main.py` and uses FastAPI + Uvicorn.

#### Start the API locally

From the repository root:

```bash
source .venv/bin/activate
uvicorn api.main:app --reload
```

The API will usually be available at:

```bash
http://127.0.0.1:8000
```

#### Useful API endpoints

- Health check: `GET /health`
- Country forecast: `GET /predict/country`
- Aggregated forecast: `GET /predict/aggregated`
- OpenAPI docs: `GET /docs`

Examples:

```bash
curl http://127.0.0.1:8000/health
```

```bash
curl "http://127.0.0.1:8000/docs"
```

#### API prerequisites

The API loads trained model artifacts from:

```bash
data/models/
```

Make sure the expected `.joblib` model files exist there before starting the API.

## Running the UI Dashboard

The frontend lives in `ui/` and is built with Next.js.

### Install dependencies

```bash
cd ui
npm install
```

### Start the development server

```bash
npm run dev
```

The app will usually be available at:

```bash
http://localhost:3000
```

### Production build

```bash
npm run build
npm run start
```

### Lint the UI

```bash
npm run lint
```

## Quick Start

### Run the UI only

```bash
cd ui
npm install
npm run dev
```

### Run the API only

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload
```
