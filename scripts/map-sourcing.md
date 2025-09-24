# Adding a New Map

This document describes the process for preparing and integrating new maps into the project.  
All maps should be cleaned, simplified, and exported in a consistent GeoJSON format before being used.

---

### 1. Source the Map

- Always check [SimpleMaps](https://simplemaps.com/gis/country/au) first.  
  - Example: `https://simplemaps.com/gis/country/nz` for New Zealand.  
- If the country is not available on SimpleMaps, fall back to [Natural Earth](https://www.naturalearthdata.com).  
- Ensure the dataset covers the region or level of detail you need (e.g., world countries, subregions).

---

### 2. Merge or Subset (If joining region with country geometry or multiple regions)

- If you need a smaller region (e.g., Oceania), subset or merge features into a new GeoJSON collection.
- Tools:
  - [mapshaper.org](https://mapshaper.org) (interactive)
  - [mapshaper CLI](https://github.com/mbloch/mapshaper) (not tested)

#### Exporting All Layers as One (mapshaper.org)

1. Load your source files (you can drag in multiple GeoJSON or shapefiles).  
2. Once loaded, all layers will appear in the **Layers panel** (top-left).  
3. Click **Export** (top-right).  
4. In the export dialog:  
   - Choose **GeoJSON** as the format.  
   - Enable **“Merge all layers”** (this should be a command you have to apply).  
5. Save the result and use it for the next steps.

For more details about commands that interface with the web version of mapshaper, see [the Command Reference on GitHub](https://github.com/mbloch/mapshaper/wiki/Command-Reference#-i-input).

---

### 3. Simplify Geometry

- Open your GeoJSON in the **Mapshaper webapp**.
- Go to the **Simplify** menu and use the slider to reduce polygon detail.
Typical simplification ranges from **7%–25%**, depending on the balance you want between file size and geographic accuracy.
- After simplifying, open the **Console** panel in Mapshaper and run:
    - 'filter-slivers'
    to remove small, narrow polygons (“slivers”) that are usually artifacts or unimportant features.

**Pitfalls to watch out for:**
- **Over-simplifying:** Sliding too far can distort or remove small but important geographic regions.
- **Removing key areas:** After running `-filter-slivers`, check the console output to ensure no significant regions have been removed.
- **Loss of detail:** Simplification reduces file size but also detail; strike a balance depending on your visualization or analysis needs.

---


Got it. Here’s the updated section reflecting the correct script name:

### 4. Clean Properties

Once you have a merged and simplified GeoJSON, you can enrich it using the provided Python script. This script will:

- Assign a unique feature `id`.
- Standardize ISO codes for countries (`iso_2_char`, `iso_3_char`) and regions (`iso_region`).
- Flag whether a feature is a region (`is_region`).

#### Steps:

1. Make sure you have your **merged and simplified GeoJSON** file ready (e.g., `simplified_merged.json`).
2. Ensure you have the ISO mapping JSON (from SimpleMaps or another source) available (e.g., `country_mapping.json`).
3. Run the script to generate a cleaned GeoJSON:

```python
python geo_json_alter.py simplified_merged.json country_mapping.json cleaned_geojson.json
```

* `simplified_merged.json` → your input file
* `country_mapping.json` → ISO country mapping - can be found in this directory
* `cleaned_geojson.json` → output with standardized IDs and ISO codes

After running the script, your GeoJSON is ready for use in the project. 
All unnecessary properties are removed, and each feature is properly flagged and identified.

---

### 5. Add to the Project

Once you have a cleaned GeoJSON ready, integrate it into the project as follows:

1. **Place the GeoJSON file**  
   Put the file in the project’s `assets/maps/` folder. For example:
   ```
   assets/maps/MALAYSIA.json
   ```

2. **Update the MapRegistry**  
   Each map should have a corresponding entry in `MapRegistry` to indicate which ISO codes it supports.  
   Example:

   ```ts
   export const MapRegistry: MapRegistryEntry[] = [
     {
       key: 'MALAYSIA',
       supports: new Set(['MY', 'MYS']), // ISO-2 and ISO-3 codes
     },
     {
       key: 'AUS_NZ',
       supports: new Set(['AU', 'NZ', 'AUS', 'NZ']),
     },
     {
       key: 'WORLD', // no supports needed, always included
     },
   ];
   ```

3. **Update the Maps object**  
   Import your GeoJSON and add it to the `Maps` object:

   ```ts
   import MALAYSIA from 'assets/maps/MALAYSIA.json';
   import AUS_NZ from 'assets/maps/AUS_NZ.json';
   import WORLD from 'assets/maps/WORLD.json';

   export const Maps = {
     MALAYSIA: MALAYSIA as GeoJSON,
     AUS_NZ: AUS_NZ as GeoJSON,
     WORLD: WORLD as GeoJSON,
     // Additional maps can be added here
   } as const;
   ```

4. **Verify integration**  
   - Ensure the map centers correctly and renders fully.
   - Check that your data joins correctly via the `nameProperty` (ISO code or region ID).
   - Confirm tooltips and `visualMap` display values as expected.


## Notes

- Some regions (e.g., Kosovo, Somaliland) do not have official ISO codes.
  - Use custom placeholder IDs if required.
- Always test by switching maps in the UI to confirm centering and zoom behavior.
- Keep simplification reasonable—over-simplification may distort borders.
