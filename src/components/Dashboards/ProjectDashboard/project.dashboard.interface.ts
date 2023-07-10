export interface ComponentsType {
  overview: (props: any) => JSX.Element,
  orgSampleCounts: (props: any) => JSX.Element,
  stCounts: (props: any) => JSX.Element,
}

export interface ProjectDashboardWidget {
  name: keyof ComponentsType,
  width: number,
  order: number,
}
