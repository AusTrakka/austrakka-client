import type React from "react";

export default interface PlotTypeProps {
  projectAbbrev: string | undefined;
  customSpec: string | undefined | null;
  setPlotErrorMsg: React.Dispatch<React.SetStateAction<string | null>>;
}
