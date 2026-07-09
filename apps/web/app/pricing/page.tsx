import { LockKeyhole } from "lucide-react";
import { pricingPlans } from "@/lib/data";

export default function PricingPage() {
  return (
    <>
      <section className="page-header">
        <div className="shell">
          <div className="eyebrow">
            <LockKeyhole size={16} />
            Billing launch-gated
          </div>
          <h1>Credits without the fog.</h1>
          <p className="lede">The pricing page is ready for copy and plan iteration, but checkout stays disabled until legal review passes.</p>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 20 }}>
        <div className="shell grid-4">
          {pricingPlans.map((plan) => (
            <article className="pricing-card" key={plan.name}>
              <h3>{plan.name}</h3>
              <p>{plan.note}</p>
              <div className="price">
                {plan.price}
                <span>/month</span>
              </div>
              <ul className="check-list">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button className="btn secondary" type="button" disabled>
                Checkout disabled
              </button>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
