"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ImagePlus, Settings2, WandSparkles } from "lucide-react";
import type { AssetMode } from "@cappymesh/shared";
import { modes } from "@/lib/data";

export function StudioPanel() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<AssetMode>("game");
  const [prompt, setPrompt] = useState("low-poly fantasy prop, optimized for Godot");
  const [quality, setQuality] = useState("standard");

  const activeMode = useMemo(() => modes.find((item) => item.id === mode) ?? modes[0], [mode]);

  function handleFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) {
      return;
    }
    setImageUrl(URL.createObjectURL(file));
  }

  return (
    <section className="studio-panel">
      <div className="upload-zone">
        {imageUrl ? (
          <img className="upload-preview" src={imageUrl} alt="Uploaded source preview" />
        ) : (
          <div>
            <ImagePlus size={42} color="var(--green)" />
            <h3>Drop a PNG, JPG, or WEBP</h3>
            <p className="small">The API stub will return a fake upload key until storage is wired.</p>
          </div>
        )}
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleFile(event.target.files)} />
      </div>

      <div className="field">
        <label htmlFor="prompt">Prompt</label>
        <textarea
          id="prompt"
          rows={4}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="make this chair cyberpunk, clean game asset, 5k tris"
        />
      </div>

      <div className="field">
        <label>Mode</label>
        <div className="segmented" role="tablist" aria-label="Asset mode">
          {modes.map((item) => (
            <button
              className={item.id === mode ? "segment active" : "segment"}
              key={item.id}
              onClick={() => setMode(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="quality">Quality</label>
        <select id="quality" value={quality} onChange={(event) => setQuality(event.target.value)}>
          <option value="preview">Low preview - 5 credits</option>
          <option value="standard">Standard textured model - 20 credits</option>
          <option value="high">High quality - 40 credits</option>
        </select>
      </div>

      <details className="field">
        <summary className="btn secondary">
          <Settings2 size={18} />
          Advanced settings
        </summary>
        <div className="setting-row" style={{ marginTop: 12 }}>
          <div>
            <strong>{activeMode.label} preset</strong>
            <p className="small">{activeMode.description}</p>
          </div>
          <span className="pill">{quality}</span>
        </div>
      </details>

      <div className="hero-actions">
        <Link className="btn primary" href="/job/demo-job">
          <WandSparkles size={18} />
          Generate Mesh
        </Link>
        <Link className="btn secondary" href="/asset/demo-chair">
          View Mock Asset
          <ChevronRight size={18} />
        </Link>
      </div>
    </section>
  );
}
