// TODO add REFRESH_REQUESTED? Or just use FETCH_REQUESTED?
// Do we need a higher-level loading/success/error/partial-error state?
enum MetadataLoadingState {
  IDLE = 'idle',
  FETCH_REQUESTED = 'fetch_requested',
  AWAITING_FIELDS = 'awaiting_fields',
  FIELDS_LOADED = 'fields_loaded',
  AWAITING_DATA = 'awaiting_data',
  DATA_LOADED = 'data_loaded',
  CHECK_FOR_UPDATE = 'check_for_update',
  ERROR = 'error',
}

export default MetadataLoadingState;

export function hasCompleteData(loadingState: MetadataLoadingState | null | undefined): boolean {
  return (
    loadingState === MetadataLoadingState.DATA_LOADED ||
    loadingState === MetadataLoadingState.CHECK_FOR_UPDATE
  );
}
