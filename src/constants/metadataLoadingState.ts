// TODO add REFRESH_REQUESTED? Or just use FETCH_REQUESTED?
// Do we need a higher-level loading/success/error/partial-error state?
enum MetadataLoadingState {
  IDLE = 'idle',
  FETCH_REQUESTED = 'fetch_requested',
  AWAITING_FIELDS = 'awaiting_fields',
  FIELDS_LOADED = 'fields_loaded',
  AWAITING_DATA = 'awaiting_data',
  PARTIAL_DATA_LOADED = 'partial_data_loaded',
  DATA_LOADED = 'data_loaded',
  ERROR = 'error', // represents any error state with NO functional data
  PARTIAL_LOAD_ERROR = 'partial_load_error',
}
export default MetadataLoadingState;
