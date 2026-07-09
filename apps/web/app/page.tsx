import Link from "next/link";
import { ArrowRight, CheckCircle2, Cuboid, UploadCloud, Zap } from "lucide-react";
import { MeshPreview } from "@/components/mesh-preview";
import { examples, modes, pricingPlans } from "@/lib/data";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="shell hero-grid">
          <div>
            <div className="eyebrow">
              <Zap size={16} />
              Image to production asset
            </div>
            <h1>Turn photos into 3D assets.</h1>
            <p className="lede">Upload a photo. Add a prompt. Download a game-ready 3D model.</p>
            <div className="hero-actions">
              <Link className="btn primary" href="/create">
                <UploadCloud size={18} />
                Start Creating
              </Link>
              <Link className="btn secondary" href="#examples">
                View Examples
                <ArrowRight size={18} />
              </Link>
            </div>
            <div className="hero-proof">
              <span className="pill">GLB first</span>
              <span className="pill">OBJ second</span>
              <span className="pill">STL when clean</span>
            </div>
          </div>
          <div className="hero-visual">
            <MeshPreview />
          </div>
        </div>
      </section>

      <section className="section" id="examples">
        <div className="shell">
          <div className="split">
            <div>
              <div className="eyebrow">
                <Cuboid size={16} />
                Photo to mesh to package
              </div>
              <h2>Built around usable exports.</h2>
              <p className="lede">
                The alpha shell treats prompts as pipeline controls for style, target polycount, cleanup strength, texture hints, and export presets.
              </p>
            </div>
            <div className="grid-3">
              {examples.map((example) => (
                <article className="mini-card" key={example.title}>
                  <span className="pill">{example.mode}</span>
                  <h3>{example.title}</h3>
                  <p>{example.prompt}</p>
                  <strong>{example.formats}</strong>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <h2>Pick the workflow.</h2>
          <div className="grid-4">
            {modes.map((mode) => {
              const Icon = mode.icon;
              return (
                <article className="mode-card" key={mode.id}>
                  <Icon size={26} style={{ color: mode.accent }} />
                  <div>
                    <h3>{mode.label}</h3>
                    <p>{mode.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="split">
            <div>
              <div className="eyebrow">
                <CheckCircle2 size={16} />
                Launch gates included
              </div>
              <h2>Billing waits for legal review.</h2>
              <p className="lede">
                The product can be built now, but payments and public API access stay behind the SAM license compliance checklist.
              </p>
            </div>
            <div className="grid-3">
              {pricingPlans.slice(0, 3).map((plan) => (
                <article className="mini-card" key={plan.name}>
                  <h3>{plan.name}</h3>
                  <p>{plan.note}</p>
                  <strong>{plan.price}/mo</strong>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
