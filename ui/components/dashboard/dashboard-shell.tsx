"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as Select from "@radix-ui/react-select";
import * as Tooltip from "@radix-ui/react-tooltip";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  Info,
  MapPin,
} from "lucide-react";
import { mapMarkers, references, similarSpecies } from "@/components/dashboard/data";
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
  forecast_origin_year: number;
  forecast_horizon_years: number[];
  forecast: ForecastPoint[];
};

const speciesImage =
  "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=1200&q=80";

function RiskGauge({ value }: { value: number }) {
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex min-w-[170px] flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="relative h-32 w-32">
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
          <span className="text-4xl font-semibold text-white">{value}</span>
          <span className="text-xs uppercase tracking-[0.28em] text-mutedText">risk</span>
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
    <ResponsiveContainer width="100%" height={300} minWidth={200}>
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
        <Line
          type="monotone"
          dataKey="historical"
          stroke="#22c55e"
          strokeWidth={3}
          dot={{ r: 3, fill: "#22c55e" }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="projected"
          stroke="#fb923c"
          strokeWidth={3}
          strokeDasharray="6 6"
          dot={{ r: 3, fill: "#fb923c" }}
          connectNulls
        />
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
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
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

function MapSection({ selectedSpeciesName, riskScore }: { selectedSpeciesName: string; riskScore: number }) {
  return (
    <DashboardCard className="overflow-hidden p-0">
      <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Endangered Species Map</h2>
          <p className="mt-1 text-sm text-mutedText">
            Population markers with a highlighted selected population and quick overview popups.
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-300">
          Global population view
        </div>
      </div>
      <div className="map-grid world-glow relative h-[440px] overflow-hidden">
        <div className="absolute inset-x-10 top-16 h-48 rounded-[50%] border border-white/10 bg-white/5 blur-[1px]" />
        <div className="absolute inset-x-24 bottom-12 h-40 rounded-[48%] border border-white/10 bg-white/5 blur-[1px]" />
        <div className="absolute left-[8%] top-[14%] rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
          14 monitored clusters
        </div>
        {mapMarkers.map((marker) => {
          const isSelected = marker.species === selectedSpeciesName;
          return (
            <Popover.Root key={marker.id}>
              <Popover.Trigger asChild>
                <button
                  className={`absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-white shadow-lg transition hover:scale-105 ${
                    isSelected || marker.highlighted
                      ? "border-red-300 bg-red-500"
                      : "border-white/15 bg-slate-900/90"
                  }`}
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                  aria-label={`View ${marker.species} population details`}
                >
                  <MapPin className="h-5 w-5" />
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  sideOffset={16}
                  className="z-50 w-72 rounded-3xl border border-white/10 bg-slate-950/95 p-5 shadow-glow"
                >
                  <p className="text-lg font-semibold text-white">{marker.species}</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Status: {isSelected ? "Endangered" : marker.status}
                  </p>
                  <p className="mt-3 text-sm text-mutedText">
                    Decline Risk: {isSelected ? riskScore : marker.risk}%
                  </p>
                  <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200">
                    VIEW DETAILS <ChevronRight className="h-4 w-4" />
                  </button>
                  <Popover.Arrow className="fill-slate-950" />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          );
        })}
      </div>
    </DashboardCard>
  );
}

export function DashboardShell() {
  const [forecastHorizon, setForecastHorizon] = useState("20");
  const [species, setSpecies] = useState<SpeciesForecastResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSpecies() {
      try {
        const response = await fetch("http://127.0.0.1:8000/species/demo", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Failed to load forecast data: ${response.status}`);
        }
        const payload = (await response.json()) as SpeciesForecastResponse;
        setSpecies(payload);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load forecast data");
      }
    }

    loadSpecies();
  }, []);

  const filteredForecast = useMemo(() => {
    if (!species) {
      return [];
    }

    const maxYear = species.forecast_origin_year + Number(forecastHorizon);
    const baseForecast = species.forecast.filter((point) => point.year <= maxYear);

    const originPoint = baseForecast.find((point) => point.year === species.forecast_origin_year);
    const firstProjectedPoint = baseForecast.find(
      (point) => point.year > species.forecast_origin_year && point.projected != null,
    );

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

    const merged = [...baseForecast.filter((point) => point.year !== species.forecast_origin_year), projectedOriginPoint, ...bridgedPoints].sort((a, b) => a.year - b.year);

    return merged;
  }, [species, forecastHorizon]);

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
    forecast_origin_year: 2020,
    forecast_horizon_years: [3, 5, 10, 15, 20],
    forecast: [],
  } satisfies SpeciesForecastResponse;

  return (
    <Tooltip.Provider>
      <div className="min-h-screen bg-grid px-6 py-8 text-white md:px-10 xl:px-14">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-8">
          <header className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-accent">Biodiversity intelligence</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
                Species Extinction Risk Dashboard
              </h1>
            </div>

            <Dialog.Root>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Dialog.Trigger asChild>
                    <button className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10">
                      <Info className="h-5 w-5" />
                    </button>
                  </Dialog.Trigger>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="rounded-full border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-200">
                    Dashboard info
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-white/10 bg-slate-950 p-6 shadow-glow">
                  <Dialog.Title className="text-2xl font-semibold text-white">
                    Info on algorithms
                  </Dialog.Title>
                  <p className="mt-4 text-sm leading-7 text-slate-300">
                    The dashboard combines historical biodiversity observations, backend-served model
                    predictions, and uncertainty-aware forecasting to surface likely population
                    decline patterns. Confidence intervals are shown to communicate uncertainty
                    around projections.
                  </p>
                  <a
                    href="https://github.com/lukasbals/animal-diversity-prediction"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                  >
                    Link to GitHub repo! <ExternalLink className="h-4 w-4" />
                  </a>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </header>

          {error ? (
            <div className="rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
              Failed to load backend forecast data: {error}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1.05fr_1.95fr]">
            <DashboardCard className="space-y-5">
              <div className="relative h-64 overflow-hidden rounded-[24px]">
                <Image
                  src={speciesImage}
                  alt={displaySpecies.common_name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-white">{displaySpecies.common_name}</h2>
                <p className="mt-1 text-base italic text-slate-300">
                  {displaySpecies.scientific_name}
                </p>
              </div>
              <div className="inline-flex w-fit rounded-full border border-orange-400/30 bg-orange-500/15 px-4 py-2 text-sm font-medium text-orange-200">
                Status: {displaySpecies.status}
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-mutedText">
                  Quick facts
                </p>
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
                <div className="flex-1">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">Extinction Risk Forecast</h2>
                      <p className="mt-1 text-sm text-mutedText">
                        Population trend loaded from the backend API for one demo species.
                      </p>
                    </div>
                    <div className="min-w-[180px]">
                      <p className="mb-2 text-xs uppercase tracking-[0.24em] text-mutedText">
                        Forecast Horizon (max 20 years)
                      </p>
                      <Select.Root value={forecastHorizon} onValueChange={setForecastHorizon}>
                        <Select.Trigger className="inline-flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                          <Select.Value />
                          <Select.Icon>
                            <ChevronDown className="h-4 w-4" />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className="z-50 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-white shadow-glow">
                            <Select.Viewport className="p-2">
                              {[5, 10, 15, 20].map((value) => (
                                <Select.Item
                                  key={value}
                                  value={String(value)}
                                  className="cursor-pointer rounded-xl px-3 py-2 text-sm outline-none data-[highlighted]:bg-white/10"
                                >
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
                <div className="flex flex-col gap-4">
                  <RiskGauge value={displaySpecies.risk_score} />
                  <ForecastMix data={filteredForecast} />
                </div>
              </div>
            </DashboardCard>
          </div>

          <MapSection
            selectedSpeciesName={displaySpecies.common_name}
            riskScore={displaySpecies.risk_score}
          />

          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <DashboardCard>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Similar Species</h2>
                  <p className="mt-1 text-sm text-mutedText">
                    Similar species by genus, class, family, and observed risk pattern.
                  </p>
                </div>
                <CircleAlert className="h-5 w-5 text-mutedText" />
              </div>
              <ScrollArea.Root className="mt-6 whitespace-nowrap">
                <ScrollArea.Viewport>
                  <div className="flex gap-4 pb-4">
                    {similarSpecies.map((species) => (
                      <article
                        key={species.name}
                        className="flex min-w-[280px] items-center gap-4 rounded-[24px] border border-white/10 bg-white/5 p-4"
                      >
                        <div className="relative h-20 w-20 overflow-hidden rounded-2xl">
                          <Image src={species.image} alt={species.name} fill className="object-cover" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-lg font-semibold text-white">{species.name}</p>
                          <p className="text-sm text-orange-200">{species.status}</p>
                          <p className="text-sm text-slate-300">{species.decline}</p>
                        </div>
                      </article>
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
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Link the dashboard to transparent model documentation, ethical safeguards, and
                  external biodiversity data sources used in the pipeline.
                </p>
              </div>
              <div className="space-y-3 text-sm">
                <a
                  id="ethical-framework"
                  href="https://www.iucnredlist.org/resources/categories-and-criteria"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-accent transition hover:text-green-300"
                >
                  Ethical Framework <ChevronRight className="h-4 w-4" />
                </a>
                <div id="references" className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-mutedText">References / Data Sources</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    {references.map((reference) => (
                      <li key={reference.label}>
                        <a
                          href={reference.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 transition hover:text-white"
                        >
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
            <a
              href="https://www.iucnredlist.org/resources/categories-and-criteria"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-white"
            >
              Ethical Framework
            </a>
            <a href="#references" className="transition hover:text-white">
              References / Data Sources
            </a>
          </footer>
        </div>
      </div>
    </Tooltip.Provider>
  );
}
