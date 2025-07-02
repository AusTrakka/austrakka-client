export function parseGeoJson(geoJson: any, propertyName = 'iso_3166_2') {
  const isoList = [];
  for (const feature of geoJson.features) {
    isoList.push(feature.properties[propertyName]);
  }
  return isoList;
}
