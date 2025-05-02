import React from 'react';
import CsvExportButton from '../Export/CsvExportButton';
import { RowData } from '../../../types/RowData.interface';
import FriendlyHeader from '../../../types/friendlyHeader.interface';

interface TableToolbarProps {
  filteredData: RowData[],
  rowDataHeaders: FriendlyHeader[],
  showDisplayHeader?: boolean | null,
  showExportButton?: boolean | null
}

function TableToolbar(props: TableToolbarProps): JSX.Element {
  const {
    filteredData, rowDataHeaders, showDisplayHeader, showExportButton,
  } = props;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        { showExportButton && (
        <CsvExportButton
          headers={rowDataHeaders}
          dataToExport={filteredData ?? []}
          showDisplayHeader={showDisplayHeader ?? false}
                          // disabled={props.loadingState !== ReduxLoadingState.DATA_LOADED}
                          // TODO: Drive this with loading state information.
          disabled={false}
        />
        )}
      </div>
    </div>
  );
}

export default TableToolbar;
