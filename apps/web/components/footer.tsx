import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer-inner">
        <span>CappyMesh.lol alpha shell. Billing disabled pending legal review.</span>
        <div className="footer-links">
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal/prohibited-uses">Prohibited Uses</Link>
          <Link href="/legal/sam-license">SAM Notice</Link>
        </div>
      </div>
    </footer>
  );
}
