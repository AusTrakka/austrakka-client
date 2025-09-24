import json
import argparse

def load_country_mapping(mapping_path):
    """
    Load ISO country mapping file. 
    Expected format: a dict with key "ISO_COUNTRY_CODES" containing a list of dicts.
    """
    with open(mapping_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    country_list = data.get("ISO_COUNTRY_CODES", [])
    mapping = {c['Alpha-2 code'].upper(): c for c in country_list}
    return mapping

def enrich_geojson(input_geojson_path, iso_mapping_path, output_path):
    # Load GeoJSON
    with open(input_geojson_path, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)

    # Load mapping
    country_mapping = load_country_mapping(iso_mapping_path)

    counter = 1
    processed_features = []

    for feature in geojson_data.get('features', []):
        props = feature.get('properties', {})

        iso_2 = props.get('iso_a2')
        if not iso_2:
            raise ValueError(f"Feature missing iso_a2 field: {props}")

        iso_2 = iso_2.upper()
        mapping_entry = country_mapping.get(iso_2)

        feature['id'] = f"feature_{counter}"
        counter += 1

        if mapping_entry:
            # Normal case: found in mapping
            iso_3 = mapping_entry['Alpha-3 code']
            name = mapping_entry['Country']
            feature['properties'] = {
                "id": iso_2,
                "name": name,
                "iso_2_char": iso_2,
                "iso_3_char": iso_3,
                "iso_region": None,
                "is_region": False
            }
        else:
            # Special case: not in mapping (e.g. iso_a2 = "-99")
            feature['properties'] = {
                "id": None,
                "name": props.get('name') or "Unknown",
                "iso_2_char": None,
                "iso_3_char": None,
                "iso_region": None,
                "is_region": False
            }

        processed_features.append(feature)

    geojson_data['features'] = processed_features

    # Save enriched GeoJSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(geojson_data, f, indent=2, ensure_ascii=False)

    print(f"Successfully enriched GeoJSON and saved to '{output_path}'")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Enrich country-level GeoJSON using ISO mapping")
    parser.add_argument("input_geojson", help="Path to input GeoJSON file")
    parser.add_argument("iso_mapping", help="Path to ISO country mapping JSON")
    parser.add_argument("output_geojson", help="Path for output enriched GeoJSON")

    args = parser.parse_args()
    enrich_geojson(args.input_geojson, args.iso_mapping, args.output_geojson)
