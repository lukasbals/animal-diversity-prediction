from pathlib import Path
from typing import Annotated

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Model loading ──────────────────────────────────────────────────────────────

MODELS_DIR = Path(__file__).parent.parent / "data" / "models"
DATASET_PATH = (
    Path(__file__).parent.parent
    / "data"
    / "interim"
    / "strict_forecasting"
    / "lpd_terrestrial_strict_last2020_unitsusable_global_zeroskeep.csv"
)
HORIZONS = [3, 5, 10, 15, 20]
SUPPORTED_SPECIES_ROW_ID = 27565


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
_dataset_cache: pd.DataFrame | None = None

# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Animal Diversity Prediction API",
    description="Returns population forecasts for all horizons (3, 5, 10, 15, 20 years).",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Shared response schema ─────────────────────────────────────────────────────


class HorizonPrediction(BaseModel):
    horizon: int = Field(..., description="Forecast horizon in years")
    target_year: int = Field(..., description="Predicted year (origin year + horizon)")
    predicted_population: float = Field(
        ..., description="Predicted population (original scale)"
    )


class PredictionResponse(BaseModel):
    predictions: list[HorizonPrediction]


class ForecastPoint(BaseModel):
    year: int
    historical: float | None = None
    projected: float | None = None
    lower: float | None = None
    upper: float | None = None


class SpeciesForecastResponse(BaseModel):
    species_id: int
    common_name: str
    scientific_name: str
    country: str | None = None
    status: str
    habitat: str | None = None
    diet: str | None = None
    weight: str | None = None
    population: str | None = None
    units: str | None = None
    risk_score: int
    latitude: float | None = None
    longitude: float | None = None
    forecast_origin_year: int
    forecast_horizon_years: list[int]
    forecast: list[ForecastPoint]


class PopulationMapPoint(BaseModel):
    population_id: int
    common_name: str
    scientific_name: str
    country: str | None = None
    status: str
    decline_risk: int
    latitude: float
    longitude: float


class SpeciesListItem(BaseModel):
    species_id: int
    common_name: str
    scientific_name: str
    family: str | None = None
    class_name: str | None = Field(default=None, alias="class_name")
    country: str | None = None
    habitat: str | None = None
    decline: str
    status: str
    image: str


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


def _load_dataset() -> pd.DataFrame:
    global _dataset_cache

    if _dataset_cache is None:
        if not DATASET_PATH.exists():
            raise RuntimeError(f"Dataset file not found: {DATASET_PATH}")
        _dataset_cache = pd.read_csv(DATASET_PATH)

    return _dataset_cache.copy()


def _risk_score_from_row(row: pd.Series) -> int:
    origin_year = int(row["last_obs_year"])
    current = row.get(str(origin_year))
    previous = row.get(str(origin_year - 3))

    if pd.isna(current) or pd.isna(previous) or float(previous) <= 0:
        return 50

    decline_ratio = 1 - min(float(current) / float(previous), 1.5)
    score = int(round(max(15, min(95, 55 + decline_ratio * 100))))
    return score


def _status_from_risk(score: int) -> str:
    if score >= 85:
        return "Critically Endangered"
    if score >= 70:
        return "Endangered"
    if score >= 55:
        return "Vulnerable"
    return "Watchlist"


def _species_image(common_name: str) -> str:
    image_map = {
        "Wolverine": "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=1200&q=80",
        "Moose": "https://images.unsplash.com/photo-1501706362039-c6e80948e4ca?auto=format&fit=crop&w=1200&q=80",
        "Mountain Pygmy-possum": "https://images.unsplash.com/photo-1500479694472-551d1fb6258d?auto=format&fit=crop&w=1200&q=80",
        "Leadbeater's Possum": "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1200&q=80",
        "Yellow-footed Rock-wallaby": "https://images.unsplash.com/photo-1466721591366-2d5fba72006d?auto=format&fit=crop&w=1200&q=80",
        "Malleefowl": "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1200&q=80",
        "Helmeted Honeyeater": "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1200&q=80",
        "Plains-wanderer": "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1200&q=80",
    }
    return image_map.get(
        common_name,
        "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=1200&q=80",
    )


def _find_species_row(species_id: int | None = None, common_name: str | None = None) -> pd.Series:
    df = _load_dataset()

    if species_id is not None:
        matches = df.loc[df["id"] == species_id]
        if matches.empty:
            raise HTTPException(status_code=404, detail=f"Species row not found: {species_id}")
        return matches.iloc[0]

    if common_name is not None:
        matches = df.loc[df["common_name"].fillna("").str.lower() == common_name.lower()]
        if matches.empty:
            raise HTTPException(status_code=404, detail=f"Species not found: {common_name}")
        return matches.iloc[0]

    matches = df.loc[df["id"] == SUPPORTED_SPECIES_ROW_ID]
    if matches.empty:
        raise HTTPException(status_code=404, detail="Default species row not found")
    return matches.iloc[0]


def _build_country_feature_row(row: pd.Series) -> tuple[pd.DataFrame, int]:
    origin_year = int(row["last_obs_year"])
    recent_years = [origin_year - 3, origin_year - 2, origin_year - 1, origin_year]
    recent_values = [float(row[str(year)]) for year in recent_years]
    log_values = np.log1p(recent_values)

    feature_row = pd.DataFrame(
        [
            {
                "Year": origin_year,
                "lag_1": float(log_values[-1]),
                "lag_2": float(log_values[-2]),
                "lag_3": float(log_values[-3]),
                "lag_4": float(log_values[-4]),
                "year_gap_from_prev": 1.0,
                "rolling_mean_3": float(log_values[-3:].mean()),
                "latitude": None if pd.isna(row["latitude"]) else float(row["latitude"]),
                "longitude": None if pd.isna(row["longitude"]) else float(row["longitude"]),
                "rolling_std_3": float(log_values[-3:].std(ddof=0)),
                "population_difference": float(log_values[-1] - log_values[-2]),
                "population_growth_rate": float(
                    0.0 if log_values[-2] == 0 else (log_values[-1] - log_values[-2]) / log_values[-2]
                ),
                "class": None if pd.isna(row["class"]) else row["class"],
                "family": None if pd.isna(row["family"]) else row["family"],
                "ipbes_subregion": None
                if pd.isna(row["ipbes_subregion"])
                else row["ipbes_subregion"],
                "system_group": None if pd.isna(row["system_group"]) else row["system_group"],
                "t_realm": None if pd.isna(row["t_realm"]) else row["t_realm"],
                "t_biome": None if pd.isna(row["t_biome"]) else row["t_biome"],
                "units": None if pd.isna(row["units"]) else row["units"],
                "country": None if pd.isna(row["country"]) else row["country"],
            }
        ]
    )
    return feature_row, origin_year


def _build_species_forecast(row: pd.Series) -> SpeciesForecastResponse:
    feature_row, origin_year = _build_country_feature_row(row)
    predictions = _predict_all_horizons(country_models, feature_row, origin_year)

    historical_points = []
    for year in range(origin_year - 8, origin_year + 1):
        value = row.get(str(year))
        if pd.notna(value):
            historical_points.append(
                ForecastPoint(year=year, historical=round(float(value), 4))
            )

    forecast_points = [
        ForecastPoint(
            year=prediction.target_year,
            projected=prediction.predicted_population,
            lower=round(prediction.predicted_population * 0.88, 4),
            upper=round(prediction.predicted_population * 1.12, 4),
        )
        for prediction in predictions
    ]

    combined: dict[int, ForecastPoint] = {point.year: point for point in historical_points}
    for point in forecast_points:
        if point.year in combined:
            existing = combined[point.year]
            combined[point.year] = ForecastPoint(
                year=point.year,
                historical=existing.historical,
                projected=point.projected,
                lower=point.lower,
                upper=point.upper,
            )
        else:
            combined[point.year] = point

    latest_population = row.get(str(origin_year))
    latest_population_text = (
        None if pd.isna(latest_population) else f"~{int(round(float(latest_population)))}"
    )
    risk_score = _risk_score_from_row(row)

    return SpeciesForecastResponse(
        species_id=int(row["id"]),
        common_name=str(row["common_name"]),
        scientific_name=str(row["binomial"]).replace("_", " "),
        country=None if pd.isna(row["country"]) else str(row["country"]).title(),
        status=_status_from_risk(risk_score),
        habitat=None if pd.isna(row["t_biome"]) else str(row["t_biome"]),
        diet="Carnivore" if str(row.get("class", "")).lower() == "mammalia" else "Unknown",
        weight=None,
        population=latest_population_text,
        units=None if pd.isna(row["units"]) else str(row["units"]),
        risk_score=risk_score,
        latitude=None if pd.isna(row["latitude"]) else float(row["latitude"]),
        longitude=None if pd.isna(row["longitude"]) else float(row["longitude"]),
        forecast_origin_year=origin_year,
        forecast_horizon_years=HORIZONS,
        forecast=[combined[year] for year in sorted(combined)],
    )


def _build_species_list() -> list[SpeciesListItem]:
    df = _load_dataset()
    rows = df.sort_values(["common_name", "id"]).drop_duplicates(subset=["common_name"])
    items: list[SpeciesListItem] = []

    for _, row in rows.iterrows():
        origin_year = int(row["last_obs_year"])
        current_value = row.get(str(origin_year))
        previous_value = row.get(str(origin_year - 3))

        decline = "Population trend unavailable"
        if pd.notna(current_value) and pd.notna(previous_value) and float(previous_value) > 0:
            change = ((float(current_value) - float(previous_value)) / float(previous_value)) * 100
            decline = f"Population Change: {change:+.0f}%"

        risk_score = _risk_score_from_row(row)
        items.append(
            SpeciesListItem(
                species_id=int(row["id"]),
                common_name=str(row["common_name"]),
                scientific_name=str(row["binomial"]).replace("_", " "),
                family=None if pd.isna(row["family"]) else str(row["family"]),
                class_name=None if pd.isna(row["class"]) else str(row["class"]),
                country=None if pd.isna(row["country"]) else str(row["country"]).title(),
                habitat=None if pd.isna(row["t_biome"]) else str(row["t_biome"]),
                decline=decline,
                status=_status_from_risk(risk_score),
                image=_species_image(str(row["common_name"])),
            )
        )

    return items


def _build_population_map() -> list[PopulationMapPoint]:
    df = _load_dataset()
    points: list[PopulationMapPoint] = []
    for _, row in df.iterrows():
        if pd.isna(row["latitude"]) or pd.isna(row["longitude"]):
            continue
        risk_score = _risk_score_from_row(row)
        points.append(
            PopulationMapPoint(
                population_id=int(row["id"]),
                common_name=str(row["common_name"]),
                scientific_name=str(row["binomial"]).replace("_", " "),
                country=None if pd.isna(row["country"]) else str(row["country"]).title(),
                status=_status_from_risk(risk_score),
                decline_risk=risk_score,
                latitude=float(row["latitude"]),
                longitude=float(row["longitude"]),
            )
        )
    return points


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
    latitude: Annotated[
        float | None, Query(description="Latitude of the population or aggregate")
    ] = None,
    longitude: Annotated[
        float | None, Query(description="Longitude of the population or aggregate")
    ] = None,
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
                    "latitude": latitude,
                    "longitude": longitude,
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
    latitude: Annotated[
        float | None, Query(description="Latitude of the population or aggregate")
    ] = None,
    longitude: Annotated[
        float | None, Query(description="Longitude of the population or aggregate")
    ] = None,
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
                    "latitude": latitude,
                    "longitude": longitude,
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


@app.get(
    "/species/demo",
    response_model=SpeciesForecastResponse,
    summary="Demo species forecast for dashboard integration",
    description="Returns historical and forecasted data for one species taken from the terrestrial strict forecasting dataset.",
)
def species_demo(
    species_id: Annotated[int | None, Query(description="Population row id to load")] = None,
    common_name: Annotated[str | None, Query(description="Common species name to load")] = None,
) -> SpeciesForecastResponse:
    try:
        row = _find_species_row(species_id=species_id, common_name=common_name)
        return _build_species_forecast(row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get(
    "/species",
    response_model=list[SpeciesListItem],
    summary="List species available in the strict terrestrial dataset",
)
def list_species() -> list[SpeciesListItem]:
    try:
        return _build_species_list()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get(
    "/populations/map",
    response_model=list[PopulationMapPoint],
    summary="List geospatial population points for the strict terrestrial dataset",
)
def populations_map() -> list[PopulationMapPoint]:
    try:
        return _build_population_map()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health", summary="Health check")
def health():
    return {
        "status": "ok",
        "country_models_loaded": list(country_models.keys()),
        "agg_models_loaded": list(agg_models.keys()),
    }
