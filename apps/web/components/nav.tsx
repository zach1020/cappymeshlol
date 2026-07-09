import Link from "next/link";
import { LogIn, UploadCloud } from "lucide-react";

export function Nav() {
  return (
    <header className="nav">
      <div className="shell nav-inner">
        <Link className="brand" href="/">
          <span className="brand-mark">CM</span>
          <span>CappyMesh.lol</span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/create">Create</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/pricing">Pricing</Link>
        </nav>
        <div className="nav-actions">
          <Link className="icon-btn" href="/dashboard" title="Sign in">
            <LogIn size={18} />
          </Link>
          <Link className="btn primary" href="/create">
            <UploadCloud size={18} />
            Upload
          </Link>
        </div>
      </div>
    </header>
  );
}
