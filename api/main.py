from pathlib import Path
from typing import Annotated

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query

# ── Model loading ──────────────────────────────────────────────────────────────

MODELS_DIR = Path(__file__).parent.parent / "data" / "models"
HORIZONS = [3, 5, 10, 15, 20]


def _load_models(prefix: str) -> dict[int, object]:
    models = {}
    for h in HORIZONS:
        path = MODELS_DIR / f"{prefix}_model_h{h}.joblib"
        if not path.exists():
            raise RuntimeError(f"Model file not found: {path}")
        models[h] = joblib.load(path)
    return models


country_models = _load_models("country")
agg_models = _load_models("agg")

# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Animal Diversity Prediction API",
    description="Returns population forecasts for all horizons (3, 5, 10, 15, 20 years).",
    version="1.0.0",
)

# ── Shared response schema ─────────────────────────────────────────────────────

from pydantic import BaseModel, Field


class HorizonPrediction(BaseModel):
    horizon: int = Field(..., description="Forecast horizon in years")
    target_year: int = Field(..., description="Predicted year (origin year + horizon)")
    predicted_population: float = Field(
        ..., description="Predicted population (original scale)"
    )


class PredictionResponse(BaseModel):
    predictions: list[HorizonPrediction]


# ── Helpers ────────────────────────────────────────────────────────────────────


def _predict_all_horizons(
    models: dict, row: pd.DataFrame, origin_year: int
) -> list[HorizonPrediction]:
    results = []
    for h in HORIZONS:
        log_pred = float(models[h].predict(row)[0])
        population = float(np.clip(np.expm1(log_pred), a_min=0, a_max=None))
        results.append(
            HorizonPrediction(
                horizon=h,
                target_year=origin_year + h,
                predicted_population=round(population, 4),
            )
        )
    return results


# ── Endpoints ──────────────────────────────────────────────────────────────────


@app.get(
    "/predict/country",
    response_model=PredictionResponse,
    summary="Country-level population forecast",
    description="Returns population predictions for all horizons (3, 5, 10, 15, 20 years) for a country-level time series origin point.",
)
def predict_country(
    year: Annotated[int, Query(description="Origin year of the forecast")],
    lag_1: Annotated[float, Query(description="Log-population 1 year ago")],
    lag_2: Annotated[float, Query(description="Log-population 2 years ago")],
    lag_3: Annotated[float, Query(description="Log-population 3 years ago")],
    lag_4: Annotated[float, Query(description="Log-population 4 years ago")],
    rolling_mean_3: Annotated[
        float,
        Query(description="Rolling mean of log-population over last 3 observations"),
    ],
    year_gap_from_prev: Annotated[
        float, Query(description="Years since previous observation")
    ] = 1.0,
    rolling_std_3: Annotated[
        float,
        Query(description="Rolling std of log-population over last 3 observations"),
    ] = 0.0,
    population_difference: Annotated[
        float, Query(description="Difference in log-population from previous year")
    ] = 0.0,
    population_growth_rate: Annotated[
        float, Query(description="Growth rate (pct_change) of log-population")
    ] = 0.0,
    cls: Annotated[
        str | None, Query(alias="class", description="Taxonomic class")
    ] = None,
    family: Annotated[str | None, Query(description="Taxonomic family")] = None,
    ipbes_subregion: Annotated[str | None, Query(description="IPBES subregion")] = None,
    system_group: Annotated[str | None, Query(description="System group")] = None,
    t_realm: Annotated[str | None, Query(description="Terrestrial realm")] = None,
    t_biome: Annotated[str | None, Query(description="Terrestrial biome")] = None,
    units: Annotated[
        str | None, Query(description="Population measurement units")
    ] = None,
    country: Annotated[str | None, Query(description="Country name")] = None,
) -> PredictionResponse:
    try:
        row = pd.DataFrame(
            [
                {
                    "Year": year,
                    "lag_1": lag_1,
                    "lag_2": lag_2,
                    "lag_3": lag_3,
                    "lag_4": lag_4,
                    "year_gap_from_prev": year_gap_from_prev,
                    "rolling_mean_3": rolling_mean_3,
                    "rolling_std_3": rolling_std_3,
                    "population_difference": population_difference,
                    "population_growth_rate": population_growth_rate,
                    "class": cls,
                    "family": family,
                    "ipbes_subregion": ipbes_subregion,
                    "system_group": system_group,
                    "t_realm": t_realm,
                    "t_biome": t_biome,
                    "units": units,
                    "country": country,
                }
            ]
        )
        return PredictionResponse(
            predictions=_predict_all_horizons(country_models, row, year)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get(
    "/predict/aggregated",
    response_model=PredictionResponse,
    summary="Aggregated (species-level) population forecast",
    description="Returns population predictions for all horizons (3, 5, 10, 15, 20 years) for a species-level aggregated time series origin point.",
)
def predict_aggregated(
    year: Annotated[int, Query(description="Origin year of the forecast")],
    lag_1: Annotated[float, Query(description="Log-population 1 year ago")],
    lag_2: Annotated[float, Query(description="Log-population 2 years ago")],
    lag_3: Annotated[float, Query(description="Log-population 3 years ago")],
    lag_4: Annotated[float, Query(description="Log-population 4 years ago")],
    rolling_mean_3: Annotated[
        float,
        Query(description="Rolling mean of log-population over last 3 observations"),
    ],
    year_gap_from_prev: Annotated[
        float, Query(description="Years since previous observation")
    ] = 1.0,
    rolling_std_3: Annotated[
        float,
        Query(description="Rolling std of log-population over last 3 observations"),
    ] = 0.0,
    population_difference: Annotated[
        float, Query(description="Difference in log-population from previous year")
    ] = 0.0,
    population_growth_rate: Annotated[
        float, Query(description="Growth rate (pct_change) of log-population")
    ] = 0.0,
    n_populations: Annotated[
        float,
        Query(
            description="Number of individual population series contributing to aggregate"
        ),
    ] = 1.0,
    cls: Annotated[
        str | None, Query(alias="class", description="Taxonomic class")
    ] = None,
    family: Annotated[str | None, Query(description="Taxonomic family")] = None,
    ipbes_subregion: Annotated[str | None, Query(description="IPBES subregion")] = None,
    system_group: Annotated[str | None, Query(description="System group")] = None,
    t_realm: Annotated[str | None, Query(description="Terrestrial realm")] = None,
    t_biome: Annotated[str | None, Query(description="Terrestrial biome")] = None,
    units: Annotated[
        str | None, Query(description="Population measurement units")
    ] = None,
) -> PredictionResponse:
    try:
        row = pd.DataFrame(
            [
                {
                    "Year": year,
                    "lag_1": lag_1,
                    "lag_2": lag_2,
                    "lag_3": lag_3,
                    "lag_4": lag_4,
                    "year_gap_from_prev": year_gap_from_prev,
                    "rolling_mean_3": rolling_mean_3,
                    "rolling_std_3": rolling_std_3,
                    "population_difference": population_difference,
                    "population_growth_rate": population_growth_rate,
                    "n_populations": n_populations,
                    "class": cls,
                    "family": family,
                    "ipbes_subregion": ipbes_subregion,
                    "system_group": system_group,
                    "t_realm": t_realm,
                    "t_biome": t_biome,
                    "units": units,
                }
            ]
        )
        return PredictionResponse(
            predictions=_predict_all_horizons(agg_models, row, year)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health", summary="Health check")
def health():
    return {
        "status": "ok",
        "country_models_loaded": list(country_models.keys()),
        "agg_models_loaded": list(agg_models.keys()),
    }
