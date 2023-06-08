export interface ComponentsType {
  overview: () => JSX.Element,
  labSampleCounts: () => JSX.Element,
  stCounts: () => JSX.Element,
}

export interface ProjectDashboardComponent {
  name: keyof ComponentsType,
  width: number,
  order: number,
}
