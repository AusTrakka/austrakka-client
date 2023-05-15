import { Plot } from './dtos';

export default interface PlotTypeProps {
  plot: Plot | undefined | null,
  setPlotErrorMsg: Function,
}
