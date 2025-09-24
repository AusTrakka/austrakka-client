import json
import os
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

def standardize_feature_id(original_id):
    """
    Standardize a feature ID for region or country.
    """
    if not isinstance(original_id, str):
        return None
    return original_id.strip().upper()

def enrich_geojson(input_geojson_path, iso_mapping_path, output_path):
    # Load GeoJSON
    with open(input_geojson_path, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)

    country_mapping = load_country_mapping(iso_mapping_path)
    counter = 1
    processed_features = []

    for feature in geojson_data.get('features', []):
        props = feature.get('properties', {})
        original_id = props.get('id')
        if not original_id:
            raise ValueError(f"Feature missing 'id': {feature}")

        standardized_id = standardize_feature_id(original_id)

        # Override the feature ID with a counter to avoid duplicates
        feature['id'] = f"feature_{counter}"
        counter += 1

        # Initialize ISO fields
        iso_2_char = None
        iso_3_char = None
        iso_region = None
        is_region = False

        # Determine if feature is a region (ISO region)
        if len(standardized_id) > 2:
            # Treat as region/subdivision
            country_prefix = standardized_id[:2]
            if country_prefix not in country_mapping:
                raise ValueError(f"Region prefix '{country_prefix}' not found in country mapping for feature ID '{original_id}'")
            iso_2_char = country_mapping[country_prefix]['Alpha-2 code']
            iso_3_char = country_mapping[country_prefix]['Alpha-3 code']
            iso_region = f"{country_prefix}-{standardized_id[2:]}"
            is_region = True
        else:
            # Country-level feature
            if standardized_id not in country_mapping:
                raise ValueError(f"Country code '{standardized_id}' not found in country mapping for feature ID '{original_id}'")
            iso_2_char = country_mapping[standardized_id]['Alpha-2 code']
            iso_3_char = country_mapping[standardized_id]['Alpha-3 code']

        # Add enriched properties
        props['iso_2_char'] = iso_2_char
        props['iso_3_char'] = iso_3_char
        props['iso_region'] = iso_region
        props['is_region'] = is_region

        feature['properties'] = props
        processed_features.append(feature)

    geojson_data['features'] = processed_features

    # Save enriched GeoJSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(geojson_data, f, indent=2, ensure_ascii=False)

    print(f"Successfully enriched GeoJSON and saved to '{output_path}'")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Enrich GeoJSON with ISO codes and region flags")
    parser.add_argument("input_geojson", help="Path to input GeoJSON file")
    parser.add_argument("iso_mapping", help="Path to ISO country mapping JSON")
    parser.add_argument("output_geojson", help="Path for output enriched GeoJSON")

    args = parser.parse_args()
    enrich_geojson(args.input_geojson, args.iso_mapping, args.output_geojson)

