import React, { useEffect } from 'react';
import { selectProjectMetadataFields } from '../../../app/projectMetadataSlice';
import { useAppSelector } from '../../../app/store';
import PlotTypeProps from '../../../types/plottypeprops.interface';
// @ts-ignore
import mapJson from '../../../maps/World_110m_countries.json';
import VegaMapPlot from '../VegaMapPlot';

function MapWorld(props: PlotTypeProps) {
  const { plot, setPlotErrorMsg } = props;
  const { fields } = useAppSelector(
    state => selectProjectMetadataFields(state, plot?.projectAbbreviation),
  );
  
  const geoField = 'Country';
  const isoField = 'ISO_A3';

  useEffect(() => {
    if (fields && fields.length > 0) { // TODO check loadingState?
      if (!fields.some(fld => fld.columnName === geoField)) {
        setPlotErrorMsg(`Field ${geoField} not found in project metadata`);
      }
    }
    // TODO if field can change, unset error if found; need to be careful not to unset other errors
  }, [fields, setPlotErrorMsg, geoField]);

  // These coordinates are specific to this map
  const INITIAL_LATITUDE = 0;
  const INITIAL_LONGITUDE = 133;
  const INITIAL_ZOOM = 150;
  
  return (
    <>
      {/* renderControls() */}
      <VegaMapPlot
        projectAbbrev={plot?.projectAbbreviation}
        geoSpec={mapJson}
        geoLookupField={geoField}
        isoLookup={isoField}
        initialLongitude={INITIAL_LONGITUDE}
        initialLatitude={INITIAL_LATITUDE}
        initialZoom={INITIAL_ZOOM}
      />
    </>
  );
}

export default MapWorld;
