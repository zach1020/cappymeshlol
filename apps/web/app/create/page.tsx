import { StudioPanel } from "@/components/studio-panel";

export default function CreatePage() {
  return (
    <>
      <section className="page-header">
        <div className="shell">
          <div className="eyebrow">Create</div>
          <h1>Upload. Prompt. Mesh.</h1>
          <p className="lede">This is the MVP cockpit for image upload, mode selection, quality control, and generation launch.</p>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 20 }}>
        <div className="shell split">
          <StudioPanel />
          <aside className="viewer-panel panel-pad">
            <h2 style={{ fontSize: "2rem" }}>Pipeline interpretation</h2>
            <p>
              Until native text conditioning is confirmed, prompts become structured metadata for the worker. That means target
              engine, polycount, texture style, cleanup strength, and export package.
            </p>
            <div className="asset-meta">
              <div>
                <span>Default format</span>
                <strong>GLB</strong>
              </div>
              <div>
                <span>Credit reservation</span>
                <strong>20</strong>
              </div>
              <div>
                <span>Refund rule</span>
                <strong>failed_refunded</strong>
              </div>
              <div>
                <span>Billing</span>
                <strong>disabled</strong>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
