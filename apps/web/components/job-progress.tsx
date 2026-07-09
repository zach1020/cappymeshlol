import { Check, LoaderCircle } from "lucide-react";
import { pipelineStages } from "@/lib/data";

export function JobProgress() {
  const progress = 68;
  const activeIndex = 3;

  return (
    <div className="viewer-panel panel-pad">
      <div className="eyebrow">
        <LoaderCircle size={16} />
        Mock generation running
      </div>
      <h2>Cleaning the mesh</h2>
      <p className="lede">
        Prompt metadata is being interpreted as pipeline controls. Real SAM 3D inference will replace this mock state machine.
      </p>
      <div className="progress-track" aria-label="Generation progress">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="stage-list">
        {pipelineStages.map((stage, index) => {
          const state = index < activeIndex ? "done" : index === activeIndex ? "active" : "";
          return (
            <div className={`stage-row ${state}`} key={stage}>
              <span className="stage-dot">
                {index < activeIndex ? <Check size={16} /> : index === activeIndex ? <LoaderCircle size={16} /> : index + 1}
              </span>
              <span>{stage}</span>
              <span>{index < activeIndex ? "done" : index === activeIndex ? "now" : "queued"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
