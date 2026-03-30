"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import * as Progress from "@radix-ui/react-progress";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as Select from "@radix-ui/react-select";
import * as Tooltip from "@radix-ui/react-tooltip";
import Image from "next/image";
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
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  Info,
  MapPin,
} from "lucide-react";
import {
  forecastData,
  mapMarkers,
  references,
  similarSpecies,
  speciesOverview,
  threats,
} from "@/components/dashboard/data";
import { DashboardCard } from "@/components/dashboard/card";

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

function ForecastChart() {
  return (
    <ResponsiveContainer width="100%" height={300} minWidth={200}>
      <AreaChart data={forecastData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
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
        <Area type="monotone" dataKey="upper" stroke="transparent" fill="url(#forecastBand)" />
        <Area type="monotone" dataKey="lower" stroke="transparent" fill="#020617" />
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

function DriverMix() {
  const chartData = threats.map((threat) => ({
    name: threat.label,
    value: threat.value,
  }));
  const colors = ["#f97316", "#fb923c", "#facc15", "#84cc16", "#22c55e"];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-mutedText">Driver mix</p>
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

function MapSection() {
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
        {mapMarkers.map((marker) => (
          <Popover.Root key={marker.id}>
            <Popover.Trigger asChild>
              <button
                className={`absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-white shadow-lg transition hover:scale-105 ${
                  marker.highlighted
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
                <p className="mt-1 text-sm text-slate-300">Status: {marker.status}</p>
                <p className="mt-3 text-sm text-mutedText">Decline Risk: {marker.risk}%</p>
                <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200">
                  VIEW DETAILS <ChevronRight className="h-4 w-4" />
                </button>
                <Popover.Arrow className="fill-slate-950" />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        ))}
      </div>
    </DashboardCard>
  );
}

export function DashboardShell() {
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
                    The dashboard combines historical biodiversity observations, risk-driver scoring,
                    and uncertainty-aware forecasting to surface likely population decline patterns.
                    Confidence intervals are shown to communicate uncertainty around projections.
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

          <div className="grid gap-6 xl:grid-cols-[1.05fr_1.55fr_1fr]">
            <DashboardCard className="space-y-5">
              <div className="relative h-64 overflow-hidden rounded-[24px]">
                <Image
                  src={speciesOverview.image}
                  alt={speciesOverview.commonName}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-white">{speciesOverview.commonName}</h2>
                <p className="mt-1 text-base italic text-slate-300">
                  {speciesOverview.scientificName}
                </p>
              </div>
              <div className="inline-flex w-fit rounded-full border border-orange-400/30 bg-orange-500/15 px-4 py-2 text-sm font-medium text-orange-200">
                Status: {speciesOverview.status}
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-mutedText">
                  Quick facts
                </p>
                <ul className="mt-4 space-y-3 text-sm text-slate-200">
                  <li>• Habitat: {speciesOverview.habitat}</li>
                  <li>• Diet: {speciesOverview.diet}</li>
                  <li>• Weight: {speciesOverview.weight}</li>
                  <li>• Population: {speciesOverview.population}</li>
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
                        Population Trend &amp; Projection with uncertainty intervals.
                      </p>
                    </div>
                    <div className="min-w-[180px]">
                      <p className="mb-2 text-xs uppercase tracking-[0.24em] text-mutedText">
                        Forecast Horizon (max 20 years)
                      </p>
                      <Select.Root defaultValue="20">
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
                  <ForecastChart />
                </div>
                <RiskGauge value={85} />
              </div>
            </DashboardCard>

            <DashboardCard>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Threats &amp; Risk Drivers</h2>
                  <p className="mt-1 text-sm text-mutedText">
                    Climate and anthropogenic pressures driving extinction risk.
                  </p>
                </div>
                <ArrowUpRight className="mt-1 h-5 w-5 text-mutedText" />
              </div>
              <div className="mt-6 space-y-4">
                {threats.map((threat) => (
                  <div key={threat.label} className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-slate-100">{threat.label}</span>
                      <span className="font-medium text-orange-200">{threat.value}%</span>
                    </div>
                    <Progress.Root className="relative h-2 overflow-hidden rounded-full bg-slate-800">
                      <Progress.Indicator
                        className="h-full rounded-full bg-gradient-to-r from-accent via-warning to-danger transition-all"
                        style={{ width: `${threat.value}%` }}
                      />
                    </Progress.Root>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <DriverMix />
              </div>
            </DashboardCard>
          </div>

          <MapSection />

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
            <a
              href="#references"
              className="transition hover:text-white"
            >
              References / Data Sources
            </a>
          </footer>
        </div>
      </div>
    </Tooltip.Provider>
  );
}
