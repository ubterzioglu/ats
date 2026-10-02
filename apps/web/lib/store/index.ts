export { openStore, type StoreHandle } from "./db";
export { failure, type StoreFailure, type StoreFailureReason, type StoreResult } from "./failure";
export {
  DB_NAME,
  DB_VERSION,
  STORE_NAMES,
  type HistoryDimension,
  type HistoryRecord,
  type MetaRecord,
  type TrailPoint,
  type StoreName,
  type StoreSchema
} from "./schema";
export {
  summariseLocalData,
  totalRecords,
  wipeLocalData,
  type LocalDataSummary
} from "./wipe";
export {
  HISTORY_LIMIT,
  clearHistory,
  readHistory,
  readPreviousRecord,
  recordAnalysis,
  toHistoryRecord
} from "./history";
export {
  TRAIL_LIMIT,
  appendTrailPoint,
  currentSessionId,
  readTrail,
  startNewSession
} from "./trail";
