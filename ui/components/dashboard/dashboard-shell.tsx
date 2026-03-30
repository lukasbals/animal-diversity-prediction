"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as Select from "@radix-ui/react-select";
import * as Tooltip from "@radix-ui/react-tooltip";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import {
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  Info,
} from "lucide-react";
import { references } from "@/components/dashboard/data";
import { DashboardCard } from "@/components/dashboard/card";

type ForecastPoint = {
  year: number;
  historical?: number | null;
  projected?: number | null;
  lower?: number | null;
  upper?: number | null;
};

type SpeciesForecastResponse = {
  species_id: number;
  common_name: string;
  scientific_name: string;
  country?: string | null;
  status: string;
  habitat?: string | null;
  diet?: string | null;
  weight?: string | null;
  population?: string | null;
  units?: string | null;
  risk_score: number;
  latitude?: number | null;
  longitude?: number | null;
  image: string;
  forecast_origin_year: number;
  forecast_horizon_years: number[];
  forecast: ForecastPoint[];
};

type PopulationMapPoint = {
  population_id: number;
  common_name: string;
  scientific_name: string;
  country?: string | null;
  status: string;
  decline_risk: number;
  latitude: number;
  longitude: number;
  image: string;
};

type SpeciesListItem = {
  species_id: number;
  common_name: string;
  scientific_name: string;
  family?: string | null;
  class_name?: string | null;
  country?: string | null;
  habitat?: string | null;
  decline: string;
  status: string;
  image: string;
};

const FALLBACK_SPECIES_IMAGE =
  "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=1200&q=80";
const WORLD_TOPOJSON = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

function SpeciesImage({ src, alt, className, fill = true }: { src?: string | null; alt: string; className?: string; fill?: boolean }) {
  const [imageSrc, setImageSrc] = useState(src || FALLBACK_SPECIES_IMAGE);

  useEffect(() => {
    setImageSrc(src || FALLBACK_SPECIES_IMAGE);
  }, [src]);

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill={fill}
      className={className}
      onError={() => setImageSrc(FALLBACK_SPECIES_IMAGE)}
    />
  );
}

function RiskGauge({ value }: { value: number }) {
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex w-full min-w-0 max-w-[220px] flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="relative h-28 w-28 sm:h-32 sm:w-32">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle cx="70" cy="70" r="52" stroke="rgba(148,163,184,0.18)" strokeWidth="14" fill="none" />
          <circle
            cx="70"
            cy="70"
            r="52"
            stroke="#f97316"
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-white sm:text-4xl">{value}</span>
          <span className="text-[10px] uppercase tracking-[0.28em] text-mutedText sm:text-xs">risk</span>
        </div>
      </div>
      <p className="max-w-[13rem] text-center text-sm text-slate-300">
        Current IUCN risk score + predicted risk score
      </p>
    </div>
  );
}

function ForecastChart({ data }: { data: ForecastPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280} minWidth={200}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#fb923c" stopOpacity={0.34} />
            <stop offset="95%" stopColor="#fb923c" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
        <XAxis dataKey="year" stroke="#94a3b8" tickLine={false} axisLine={false} />
        <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
        <RechartsTooltip
          contentStyle={{
            backgroundColor: "rgba(15, 23, 42, 0.98)",
            borderColor: "rgba(148,163,184,0.18)",
            borderRadius: 18,
          }}
        />
        <Area type="monotone" dataKey="upper" stroke="transparent" fill="url(#forecastBand)" connectNulls />
        <Area type="monotone" dataKey="lower" stroke="transparent" fill="#020617" connectNulls />
        <Line type="monotone" dataKey="historical" stroke="#22c55e" strokeWidth={3} dot={{ r: 3, fill: "#22c55e" }} connectNulls />
        <Line type="monotone" dataKey="projected" stroke="#fb923c" strokeWidth={3} strokeDasharray="6 6" dot={{ r: 3, fill: "#fb923c" }} connectNulls />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ForecastMix({ data }: { data: ForecastPoint[] }) {
  const latestHistorical = [...data].reverse().find((point) => point.historical != null)?.historical ?? 0;
  const latestProjected = [...data].reverse().find((point) => point.projected != null)?.projected ?? 0;
  const chartData = [
    { name: "Current", value: Math.max(Number(latestHistorical) || 0, 1) },
    { name: "Projected", value: Math.max(Number(latestProjected) || 0, 1) },
  ];
  const colors = ["#22c55e", "#f97316"];

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-mutedText">Current vs forecast</p>
      <div className="mt-4 h-40 min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={120}>
          <PieChart>
            <Pie data={chartData} dataKey="value" innerRadius={40} outerRadius={62} paddingAngle={4}>
              {chartData.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.98)",
                borderColor: "rgba(148,163,184,0.18)",
                borderRadius: 18,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EndangeredSpeciesMap({
  populations,
  selectedPopulationId,
  onSelectPopulation,
}: {
  populations: PopulationMapPoint[];
  selectedPopulationId: number | null;
  onSelectPopulation: (populationId: number) => void;
}) {
  const selected = populations.find((population) => population.population_id === selectedPopulationId) ?? null;

  return (
    <DashboardCard className="overflow-hidden p-0">
      <div className="flex flex-col gap-4 border-b border-white/10 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Endangered Species Map</h2>
          <p className="mt-1 text-sm text-mutedText">
            Real population coordinates from the dataset. Hover for names, click to switch the dashboard species.
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-300">
          {populations.length} mapped populations
        </div>
      </div>
      <div className="world-glow relative h-[360px] overflow-hidden bg-slate-950/70 px-2 py-3 sm:h-[420px] sm:px-3 sm:py-4 lg:h-[480px]">
        <ComposableMap projection="geoMercator" projectionConfig={{ scale: 120 }} style={{ width: "100%", height: "100%" }}>
          <Geographies geography={WORLD_TOPOJSON}>
            {({ geographies }: { geographies: Array<{ rsmKey: string; [key: string]: unknown }> }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#0f172a"
                  stroke="rgba(148,163,184,0.18)"
                  strokeWidth={0.5}
                  style={{ default: { outline: "none" }, hover: { outline: "none", fill: "#132036" }, pressed: { outline: "none" } }}
                />
              ))
            }
          </Geographies>

          {populations.map((population) => {
            const isSelected = population.population_id === selectedPopulationId;
            return (
              <Marker key={population.population_id} coordinates={[population.longitude, population.latitude]}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <g onClick={() => onSelectPopulation(population.population_id)} className="cursor-pointer">
                      <circle r={isSelected ? 7 : 5} fill={isSelected ? "#ef4444" : "#f97316"} stroke="#fff" strokeWidth={1.5} />
                    </g>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="rounded-full border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-200">
                      {population.common_name}
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Marker>
            );
          })}
        </ComposableMap>

        {selected ? (
          <div className="absolute inset-x-3 bottom-3 rounded-3xl border border-white/10 bg-slate-950/90 p-3 shadow-glow sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-72 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-2xl sm:h-14 sm:w-14">
                <SpeciesImage src={selected.image} alt={selected.common_name} className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white sm:text-base">{selected.common_name}</p>
                <p className="mt-1 text-xs text-slate-300 sm:text-sm">Status: {selected.status}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-mutedText">Decline Risk: {selected.decline_risk}%</p>
            <button onClick={() => onSelectPopulation(selected.population_id)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200">
              VIEW DETAILS <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </DashboardCard>
  );
}

export function DashboardShell() {
  const [forecastHorizon, setForecastHorizon] = useState("20");
  const [species, setSpecies] = useState<SpeciesForecastResponse | null>(null);
  const [speciesList, setSpeciesList] = useState<SpeciesListItem[]>([]);
  const [populations, setPopulations] = useState<PopulationMapPoint[]>([]);
  const [selectedPopulationId, setSelectedPopulationId] = useState<number | null>(27565);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStaticData() {
      try {
        const [listResponse, mapResponse] = await Promise.all([
          fetch("http://127.0.0.1:8000/species", { cache: "no-store" }),
          fetch("http://127.0.0.1:8000/populations/map", { cache: "no-store" }),
        ]);

        if (!listResponse.ok) throw new Error(`Failed to load species list: ${listResponse.status}`);
        if (!mapResponse.ok) throw new Error(`Failed to load map populations: ${mapResponse.status}`);

        const [listPayload, mapPayload] = await Promise.all([
          listResponse.json() as Promise<SpeciesListItem[]>,
          mapResponse.json() as Promise<PopulationMapPoint[]>,
        ]);

        setSpeciesList(listPayload);
        setPopulations(mapPayload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      }
    }

    loadStaticData();
  }, []);

  useEffect(() => {
    async function loadSelectedSpecies() {
      try {
        const speciesResponse = await fetch(`http://127.0.0.1:8000/species/demo?species_id=${selectedPopulationId ?? 27565}`, { cache: "no-store" });
        if (!speciesResponse.ok) throw new Error(`Failed to load species forecast: ${speciesResponse.status}`);
        const speciesPayload = (await speciesResponse.json()) as SpeciesForecastResponse;
        setSpecies(speciesPayload);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load species forecast");
      }
    }

    loadSelectedSpecies();
  }, [selectedPopulationId]);

  const filteredForecast = useMemo(() => {
    if (!species) return [];

    const maxYear = species.forecast_origin_year + Number(forecastHorizon);
    const baseForecast = species.forecast.filter((point) => point.year <= maxYear);
    const originPoint = baseForecast.find((point) => point.year === species.forecast_origin_year);
    const firstProjectedPoint = baseForecast.find((point) => point.year > species.forecast_origin_year && point.projected != null);

    if (!originPoint || !firstProjectedPoint || firstProjectedPoint.year <= species.forecast_origin_year + 1) {
      return baseForecast;
    }

    const bridgedPoints: ForecastPoint[] = [];
    const gapYears = firstProjectedPoint.year - species.forecast_origin_year;
    const startValue = originPoint.historical ?? 0;
    const endValue = firstProjectedPoint.projected ?? 0;

    for (let step = 1; step < gapYears; step += 1) {
      const year = species.forecast_origin_year + step;
      const ratio = step / gapYears;
      const projected = Number((startValue + (endValue - startValue) * ratio).toFixed(4));
      bridgedPoints.push({
        year,
        historical: null,
        projected,
        lower: Number((projected * 0.88).toFixed(4)),
        upper: Number((projected * 1.12).toFixed(4)),
      });
    }

    const projectedOriginPoint: ForecastPoint = {
      year: species.forecast_origin_year,
      historical: originPoint.historical,
      projected: originPoint.historical,
      lower: originPoint.historical ?? null,
      upper: originPoint.historical ?? null,
    };

    return [...baseForecast.filter((point) => point.year !== species.forecast_origin_year), projectedOriginPoint, ...bridgedPoints].sort((a, b) => a.year - b.year);
  }, [species, forecastHorizon]);

  const selectedCard = useMemo(() => {
    if (!species) return null;

    return (
      speciesList.find((item) => item.species_id === species.species_id) ??
      speciesList.find((item) => item.common_name === species.common_name) ??
      speciesList.find((item) => item.scientific_name === species.scientific_name) ??
      null
    );
  }, [species, speciesList]);

  const similarSpecies = useMemo(() => {
    if (!species) return speciesList.slice(0, 4);

    return speciesList
      .filter((item) => item.species_id !== selectedCard?.species_id)
      .filter(
        (item) =>
          item.family === selectedCard?.family ||
          item.class_name === selectedCard?.class_name ||
          item.habitat === selectedCard?.habitat
      )
      .slice(0, 6);
  }, [species, speciesList, selectedCard]);

  const displaySpecies = species ?? {
    species_id: 27565,
    common_name: "Wolverine",
    scientific_name: "Gulo gulo",
    country: "Sweden",
    status: "Endangered",
    habitat: "Boreal forests/taiga",
    diet: "Carnivore",
    weight: null,
    population: null,
    units: "estimated number of individuals",
    risk_score: 71,
    latitude: 64.444593,
    longitude: 15.165737,
    image: FALLBACK_SPECIES_IMAGE,
    forecast_origin_year: 2020,
    forecast_horizon_years: [3, 5, 10, 15, 20],
    forecast: [],
  } satisfies SpeciesForecastResponse;

  const currentSpeciesImage = displaySpecies.image ?? FALLBACK_SPECIES_IMAGE;

  return (
    <Tooltip.Provider>
      <div className="min-h-screen bg-grid px-4 py-6 text-white sm:px-6 md:px-10 xl:px-14">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-6 sm:gap-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-accent">Biodiversity intelligence</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">Species Extinction Risk Dashboard</h1>
            </div>

            <Dialog.Root>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Dialog.Trigger asChild>
                    <button className="inline-flex h-12 w-12 items-center justify-center self-start rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10">
                      <Info className="h-5 w-5" />
                    </button>
                  </Dialog.Trigger>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="rounded-full border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-200">Dashboard info</Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-white/10 bg-slate-950 p-6 shadow-glow">
                  <Dialog.Title className="text-2xl font-semibold text-white">Info on algorithms</Dialog.Title>
                  <p className="mt-4 text-sm leading-7 text-slate-300">
                    The dashboard combines historical biodiversity observations, backend-served model predictions, and uncertainty-aware forecasting to surface likely population decline patterns. Confidence intervals are shown to communicate uncertainty around projections.
                  </p>
                  <a href="https://github.com/lukasbals/animal-diversity-prediction" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10">
                    Link to GitHub repo! <ExternalLink className="h-4 w-4" />
                  </a>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </header>

          {error ? <div className="rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">Failed to load backend forecast data: {error}</div> : null}

          <div className="grid gap-6 xl:grid-cols-[1.05fr_1.95fr]">
            <DashboardCard className="space-y-5">
              <div className="relative h-56 overflow-hidden rounded-[24px] sm:h-64">
                <SpeciesImage src={currentSpeciesImage} alt={displaySpecies.common_name} className="object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white sm:text-3xl">{displaySpecies.common_name}</h2>
                <p className="mt-1 text-sm italic text-slate-300 sm:text-base">{displaySpecies.scientific_name}</p>
              </div>
              <div className="inline-flex w-fit rounded-full border border-orange-400/30 bg-orange-500/15 px-4 py-2 text-sm font-medium text-orange-200">Status: {displaySpecies.status}</div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-mutedText">Quick facts</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-200">
                  <li>• Habitat: {displaySpecies.habitat ?? "Unknown"}</li>
                  <li>• Diet: {displaySpecies.diet ?? "Unknown"}</li>
                  <li>• Population: {displaySpecies.population ?? "Unknown"}</li>
                  <li>• Country: {displaySpecies.country ?? "Unknown"}</li>
                  <li>• Units: {displaySpecies.units ?? "Unknown"}</li>
                </ul>
              </div>
            </DashboardCard>

            <DashboardCard>
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-2xl font-semibold text-white">Extinction Risk Forecast</h2>
                      <p className="mt-1 text-sm text-mutedText">Population trend loaded from the backend API for the selected population.</p>
                    </div>
                    <div className="w-full sm:min-w-[180px] sm:max-w-[220px]">
                      <p className="mb-2 text-xs uppercase tracking-[0.24em] text-mutedText">Forecast Horizon (max 20 years)</p>
                      <Select.Root value={forecastHorizon} onValueChange={setForecastHorizon}>
                        <Select.Trigger className="inline-flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                          <Select.Value />
                          <Select.Icon><ChevronDown className="h-4 w-4" /></Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className="z-50 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-white shadow-glow">
                            <Select.Viewport className="p-2">
                              {[5, 10, 15, 20].map((value) => (
                                <Select.Item key={value} value={String(value)} className="cursor-pointer rounded-xl px-3 py-2 text-sm outline-none data-[highlighted]:bg-white/10">
                                  <Select.ItemText>{value} yrs</Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </div>
                  </div>
                  <ForecastChart data={filteredForecast} />
                </div>
                <div className="flex w-full flex-col gap-4 sm:flex-row xl:w-auto xl:flex-col">
                  <RiskGauge value={displaySpecies.risk_score} />
                  <ForecastMix data={filteredForecast} />
                </div>
              </div>
            </DashboardCard>
          </div>

          <EndangeredSpeciesMap populations={populations} selectedPopulationId={selectedPopulationId} onSelectPopulation={setSelectedPopulationId} />

          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <DashboardCard>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Similar Species</h2>
                  <p className="mt-1 text-sm text-mutedText">Species list loaded live from the backend dataset endpoint.</p>
                </div>
                <CircleAlert className="h-5 w-5 text-mutedText" />
              </div>
              <ScrollArea.Root className="mt-6 whitespace-nowrap">
                <ScrollArea.Viewport>
                  <div className="flex gap-4 pb-4">
                    {similarSpecies.map((item) => (
                      <button
                        key={item.species_id}
                        onClick={() => setSelectedPopulationId(item.species_id)}
                        title={`${item.common_name} — ${item.status}`}
                        aria-label={`View ${item.common_name} details`}
                        className="flex min-w-[260px] max-w-[320px] items-center gap-4 rounded-[24px] border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10 sm:min-w-[300px]"
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
                          <SpeciesImage src={item.image} alt={item.common_name} className="object-cover" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="line-clamp-2 whitespace-normal text-base font-semibold leading-snug text-white sm:text-lg">{item.common_name}</p>
                          <p className="text-sm text-orange-200">{item.status}</p>
                          <p className="line-clamp-2 text-sm text-slate-300">{item.decline}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar orientation="horizontal" className="flex h-2 touch-none bg-white/5">
                  <ScrollArea.Thumb className="relative flex-1 rounded-full bg-white/20" />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>
            </DashboardCard>

            <DashboardCard className="flex flex-col justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold text-white">Reference Layer</h2>
                <p className="mt-2 text-sm leading-7 text-slate-300">Link the dashboard to transparent model documentation, ethical safeguards, and external biodiversity data sources used in the pipeline.</p>
              </div>
              <div className="space-y-3 text-sm">
                <a id="ethical-framework" href="https://livingplanet.panda.org/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-accent transition hover:text-green-300">
                  Main Reference: Living Planet Report <ChevronRight className="h-4 w-4" />
                </a>
                <div id="references" className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-mutedText">References / Data Sources</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    {references.map((reference) => (
                      <li key={reference.label}>
                        <a href={reference.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition hover:text-white">
                          {reference.label}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </DashboardCard>
          </div>

          <footer className="flex flex-col gap-3 border-t border-white/10 px-1 pt-2 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
            <a href="https://livingplanet.panda.org/" target="_blank" rel="noreferrer" className="transition hover:text-white">Main Reference: Living Planet Report</a>
            <a href="#references" className="transition hover:text-white">References / Data Sources</a>
          </footer>
        </div>
      </div>
    </Tooltip.Provider>
  );
}
