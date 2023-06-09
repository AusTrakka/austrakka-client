import {AsyncThunk} from "@reduxjs/toolkit";

export interface ComponentsType {
  overview: () => JSX.Element,
  labSampleCounts: () => JSX.Element,
  stCounts: () => JSX.Element,
}

export interface ProjectDashboardWidget {
  name: keyof ComponentsType,
  width: number,
  order: number,
}
