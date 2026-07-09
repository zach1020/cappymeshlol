export default function PrivacyPage() {
  return (
    <section className="section">
      <div className="shell legal-panel panel-pad">
        <div className="eyebrow">Legal</div>
        <h1>Privacy</h1>
        <p>
          CappyMesh uploads may contain personal data. The MVP should support asset deletion, avoid training on user uploads without
          explicit opt-in, and document storage, retention, and subprocessors before launch.
        </p>
        <p>Public launch requires a complete privacy policy and tested deletion flow for uploaded images and generated assets.</p>
      </div>
    </section>
  );
}
