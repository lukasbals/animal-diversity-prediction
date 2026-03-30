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

The API code lives in `api/`.

If you want to work on the API locally, first activate the virtual environment:

```bash
source .venv/bin/activate
```

Then run the API entrypoint according to the implementation in `api/`.

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

If you only want to run the dashboard UI:

```bash
cd ui
npm install
npm run dev
```

If you want to work on the Python side:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
