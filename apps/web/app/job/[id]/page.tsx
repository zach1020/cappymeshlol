import Link from "next/link";
import { Download, RefreshCw } from "lucide-react";
import { JobProgress } from "@/components/job-progress";
import { MeshPreview } from "@/components/mesh-preview";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <section className="page-header">
        <div className="shell">
          <div className="eyebrow">Job {id}</div>
          <h1>Generation in flight.</h1>
          <p className="lede">Mock progress mirrors the future queue states: mask, SAM 3D, postprocess, texture, export.</p>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 20 }}>
        <div className="shell split">
          <JobProgress />
          <div className="hero-visual">
            <MeshPreview />
          </div>
        </div>
        <div className="shell hero-actions">
          <Link className="btn primary" href="/asset/demo-chair">
            <Download size={18} />
            Open Result
          </Link>
          <Link className="btn secondary" href="/create">
            <RefreshCw size={18} />
            Start Another
          </Link>
        </div>
      </section>
    </>
  );
}
