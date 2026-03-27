# Average area burnt per wildfire - Data package

This data package contains the data that powers the chart ["Average area burnt per wildfire"](https://ourworldindata.org/grapher/annual-area-burnt-per-wildfire?v=1&csvType=full&useColumnShortNames=false) on the Our World in Data website. It was downloaded on March 27, 2026.

### Active Filters

A filtered subset of the full data was downloaded. The following filters were applied:

## CSV Structure

The high level structure of the CSV file is that each row is an observation for an entity (usually a country or region) and a timepoint (usually a year).

The first two columns in the CSV file are "Entity" and "Code". "Entity" is the name of the entity (e.g. "United States"). "Code" is the OWID internal entity code that we use if the entity is a country or region. For most countries, this is the same as the [iso alpha-3](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3) code of the entity (e.g. "USA") - for non-standard countries like historical countries these are custom codes.

The third column is either "Year" or "Day". If the data is annual, this is "Year" and contains only the year as an integer. If the column is "Day", the column contains a date string in the form "YYYY-MM-DD".

The final column is the data column, which is the time series that powers the chart. If the CSV data is downloaded using the "full data" option, then the column corresponds to the time series below. If the CSV data is downloaded using the "only selected data visible in the chart" option then the data column is transformed depending on the chart type and thus the association with the time series might not be as straightforward.


## Metadata.json structure

The .metadata.json file contains metadata about the data package. The "charts" key contains information to recreate the chart, like the title, subtitle etc.. The "columns" key contains information about each of the columns in the csv, like the unit, timespan covered, citation for the data etc..

## About the data

Our World in Data is almost never the original producer of the data - almost all of the data we use has been compiled by others. If you want to re-use data, it is your responsibility to ensure that you adhere to the sources' license and to credit them correctly. Please note that a single time series may have more than one source - e.g. when we stich together data from different time periods by different producers or when we calculate per capita metrics using population data from a second source.

## Detailed information about the data


## Annual area burnt per wildfire
The average area burnt per [wildfire](#dod:wildfires), in hectares. The 2026 data is incomplete and was last updated 26 March 2026.
Last updated: March 26, 2026  
Next update: April 2026  
Date range: 2012–2026  
Unit: hectares  


### How to cite this data

#### In-line citation
If you have limited space (e.g. in data visualizations), you can use this abbreviated in-line citation:  
Global Wildfire Information System (2026); Global Wildfire Information System (2024) – with minor processing by Our World in Data

#### Full citation
Global Wildfire Information System (2026); Global Wildfire Information System (2024) – with minor processing by Our World in Data. “Annual area burnt per wildfire” [dataset]. Global Wildfire Information System, “Seasonal wildfire trends” [original data].
Source: Global Wildfire Information System (2026), Global Wildfire Information System (2024) – with minor processing by Our World In Data

### What you should know about this data
* Wildfires are detected through the use of satellite imagery obtained from MODIS (Moderate Resolution Imaging Spectroradiometer) and VIIRS (Visible Infrared Imaging Radiometer Suite). These satellite systems are capable of identifying thermal anomalies and alterations in landscape patterns, which are indicative of burning.
* The data provider is presently engaged in a global accuracy assessment and acknowledged that they might be underestimating the genuine impact of wildfires, primarily due to constraints imposed by the spatial resolution of the sensors they employ.

### Source

#### Global Wildfire Information System – Seasonal wildfire trends
Retrieved on: 2026-03-26  
Retrieved from: https://gwis.jrc.ec.europa.eu/apps/gwis.statistics/seasonaltrend  

#### Notes on our processing step for this indicator
The area burnt per wildfire is calculated by dividing the area burnt by wildfires by the number of fires.


    