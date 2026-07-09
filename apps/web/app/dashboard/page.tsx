import Link from "next/link";
import { Coins, Plus } from "lucide-react";
import { demoAssets } from "@/lib/data";

export default function DashboardPage() {
  return (
    <>
      <section className="page-header">
        <div className="shell">
          <div className="eyebrow">Dashboard</div>
          <h1>Your mesh shelf.</h1>
          <p className="lede">Private asset history, credits, plan state, and delete controls will live here.</p>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 20 }}>
        <div className="shell">
          <div className="split" style={{ alignItems: "stretch" }}>
            <div className="viewer-panel panel-pad">
              <div className="eyebrow">
                <Coins size={16} />
                Alpha account
              </div>
              <h2 style={{ fontSize: "2rem" }}>80 credits</h2>
              <p>Mock user is on the Starter plan. Checkout is intentionally disabled until the legal launch gate is complete.</p>
            </div>
            <div className="viewer-panel panel-pad">
              <h2 style={{ fontSize: "2rem" }}>Next generation</h2>
              <p>Use Game Asset Mode for the first wedge. Print and Creator workflows are represented but should follow mesh quality.</p>
              <Link className="btn primary" href="/create">
                <Plus size={18} />
                New Asset
              </Link>
            </div>
          </div>
          <div className="grid-3" style={{ marginTop: 22 }}>
            {demoAssets.map((asset) => (
              <Link className="asset-card" href={`/asset/${asset.id}`} key={asset.id}>
                <div className="asset-thumb" />
                <div className="panel-pad">
                  <span className="pill">{asset.status}</span>
                  <h3>{asset.title}</h3>
                  <p>
                    {asset.mode} - {asset.created}
                  </p>
                  <strong>{asset.formats.join(" + ")}</strong>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
