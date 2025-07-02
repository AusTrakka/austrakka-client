import React, { useEffect, useState } from 'react';
import { selectProjectMetadataFields } from '../../../app/projectMetadataSlice';
import { useAppSelector } from '../../../app/store';
import PlotTypeProps from '../../../types/plottypeprops.interface';
import { useStateFromSearchParamsForPrimitive } from '../../../utilities/stateUtils';
import { defaultDiscreteColorScheme } from '../../../constants/schemes';
// @ts-ignore
import mapJson from '../../../maps/Malaysia_50m_countries_states.json';
import VegaMapPlot from '../VegaMapPlot';

function MapMalaysia(props: PlotTypeProps) {
  const { plot, setPlotErrorMsg } = props;
  const { fields, fieldUniqueValues } = useAppSelector(
    state => selectProjectMetadataFields(state, plot?.projectAbbreviation),
  );
  const searchParams = new URLSearchParams(window.location.search);
  const [categoricalFields, setCategoricalFields] = useState<string[]>([]);
  const [colourScheme, setColourScheme] = useStateFromSearchParamsForPrimitive<string>(
    'colourScheme',
    defaultDiscreteColorScheme,
    searchParams,
  );
  
  const geoField = 'State';
  const isoField = 'iso_3166_2';

  useEffect(() => {
    if (fields && fields.length > 0) {  // TODO check loadingState?
      if( !fields.some(fld => fld.columnName == geoField)) {
        setPlotErrorMsg(`Field ${geoField} not found in project metadata`);
      }
    }
    // TODO if field can change, unset error if found; need to be careful not to unset other errors
  }, [fields, setPlotErrorMsg, geoField]);

  // These coordinates are specific to this map
  const INITIAL_LATITUDE = 3;
  const INITIAL_LONGITUDE = 110;
  const INITIAL_ZOOM = 1800;

  return (
    <>
      {/*renderControls()*/}
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

export default MapMalaysia;
