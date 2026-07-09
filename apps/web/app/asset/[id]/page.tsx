import Link from "next/link";
import { Download, RefreshCw, Trash2 } from "lucide-react";
import { AssetViewer } from "@/components/asset-viewer";

export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <section className="page-header">
        <div className="shell">
          <div className="eyebrow">Asset {id}</div>
          <h1>Cyberpunk stool.</h1>
          <p className="lede">Mock GLB viewer and export metadata for the future generated asset package.</p>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 20 }}>
        <div className="shell split">
          <div className="viewer-panel panel-pad">
            <AssetViewer />
          </div>
          <aside className="viewer-panel panel-pad">
            <h2 style={{ fontSize: "2rem" }}>Package</h2>
            <div className="asset-meta">
              <div>
                <span>Status</span>
                <strong>complete</strong>
              </div>
              <div>
                <span>Mode</span>
                <strong>Game Asset</strong>
              </div>
              <div>
                <span>Target tris</span>
                <strong>5,000</strong>
              </div>
              <div>
                <span>Texture</span>
                <strong>1024 baked</strong>
              </div>
              <div>
                <span>Visibility</span>
                <strong>private</strong>
              </div>
            </div>
            <div className="hero-actions">
              <button className="btn primary" type="button">
                <Download size={18} />
                GLB
              </button>
              <button className="btn secondary" type="button">
                <Download size={18} />
                OBJ
              </button>
              <Link className="btn secondary" href="/create">
                <RefreshCw size={18} />
                Remix
              </Link>
              <button className="icon-btn" type="button" title="Delete asset">
                <Trash2 size={18} />
              </button>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
