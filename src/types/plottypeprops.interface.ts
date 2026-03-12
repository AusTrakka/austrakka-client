import type { Plot } from './dtos';

export default interface PlotTypeProps {
  plot: Plot | undefined | null;
  // biome-ignore lint/complexity/noBannedTypes: legacy
  setPlotErrorMsg: Function;
}
