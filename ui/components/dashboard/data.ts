export const forecastData = [
  { year: 2012, historical: 640, projected: null, lower: null, upper: null },
  { year: 2014, historical: 618, projected: null, lower: null, upper: null },
  { year: 2016, historical: 602, projected: null, lower: null, upper: null },
  { year: 2018, historical: 575, projected: null, lower: null, upper: null },
  { year: 2020, historical: 548, projected: null, lower: null, upper: null },
  { year: 2022, historical: 523, projected: null, lower: null, upper: null },
  { year: 2024, historical: 501, projected: 501, lower: 478, upper: 522 },
  { year: 2028, historical: null, projected: 458, lower: 412, upper: 501 },
  { year: 2032, historical: null, projected: 419, lower: 351, upper: 486 },
  { year: 2036, historical: null, projected: 388, lower: 305, upper: 471 },
  { year: 2040, historical: null, projected: 352, lower: 254, upper: 451 },
  { year: 2044, historical: null, projected: 319, lower: 210, upper: 428 },
];

export const threats = [
  { label: "Habitat Loss", value: 85 },
  { label: "Poaching", value: 72 },
  { label: "Climate Change", value: 64 },
  { label: "Low Genetic Diversity", value: 48 },
  { label: "Human Encroachment", value: 41 },
];

export const mapMarkers = [
  {
    id: 1,
    species: "Amur Tiger",
    status: "Endangered",
    risk: 85,
    x: 73,
    y: 34,
    highlighted: true,
  },
  {
    id: 2,
    species: "Amur Leopard",
    status: "Critically Endangered",
    risk: 92,
    x: 77,
    y: 32,
    highlighted: false,
  },
  {
    id: 3,
    species: "Snow Leopard",
    status: "Vulnerable",
    risk: 58,
    x: 66,
    y: 36,
    highlighted: false,
  },
  {
    id: 4,
    species: "Siberian Crane",
    status: "Critically Endangered",
    risk: 74,
    x: 84,
    y: 24,
    highlighted: false,
  },
  {
    id: 5,
    species: "Mountain Gorilla",
    status: "Endangered",
    risk: 63,
    x: 52,
    y: 58,
    highlighted: false,
  },
  {
    id: 6,
    species: "Sumatran Orangutan",
    status: "Critically Endangered",
    risk: 88,
    x: 78,
    y: 56,
    highlighted: false,
  },
];

export const similarSpecies = [
  {
    name: "Snow Leopard",
    status: "At Risk",
    decline: "Population Decline: -60%",
    image:
      "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Amur Leopard",
    status: "Critical",
    decline: "Population Decline: -78%",
    image:
      "https://images.unsplash.com/photo-1516934024742-b461fba47600?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Bengal Tiger",
    status: "Recovering",
    decline: "Population Decline: -34%",
    image:
      "https://images.unsplash.com/photo-1549366021-9f761d040a94?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Clouded Leopard",
    status: "Watchlist",
    decline: "Population Decline: -29%",
    image:
      "https://images.unsplash.com/photo-1516934024742-b461fba47600?auto=format&fit=crop&w=400&q=80",
  },
];

export const references = [
  {
    label: "IUCN Red List Categories and Criteria",
    href: "https://www.iucnredlist.org/resources/categories-and-criteria",
  },
  {
    label: "GBIF Biodiversity Data",
    href: "https://www.gbif.org/",
  },
  {
    label: "WWF Species Directory",
    href: "https://www.worldwildlife.org/species/directory",
  },
  {
    label: "IPCC Climate Assessments",
    href: "https://www.ipcc.ch/reports/",
  },
];

export const speciesOverview = {
  commonName: "Amur Tiger",
  scientificName: "Panthera tigris altaica",
  status: "Endangered",
  habitat: "Temperate Forests",
  diet: "Carnivore",
  weight: "180–300 kg",
  population: "~500 Left",
  image:
    "https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=1200&q=80",
};
