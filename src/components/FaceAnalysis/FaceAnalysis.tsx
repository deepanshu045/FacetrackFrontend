import type { FaceAnalysis as Analysis } from "../../types/analysis";
import AnalysisItem from "./AnalysisItem";

interface Props {
  analysis: Analysis;
}

export default function FaceAnalysis({
  analysis,
}: Props) {
  return (
    <>
      <AnalysisItem
        title="Face Detected"
        status={analysis.faceDetected}
      />

      <AnalysisItem
        title="Only One Face"
        status={analysis.onlyOneFace}
      />

      <AnalysisItem
        title="Looking Straight"
        status={analysis.lookingStraight}
      />

      <AnalysisItem
        title="Good Lighting"
        status={analysis.goodLighting}
      />

      <AnalysisItem
        title="Proper Distance"
        status={analysis.properDistance}
      />

      <AnalysisItem
        title="Sharp Image"
        status={analysis.sharpImage}
      />

      <h2>{analysis.quality}%</h2>
    </>
  );
}