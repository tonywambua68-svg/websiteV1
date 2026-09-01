import { Link, useParams } from "react-router-dom";
import { POLICIES, policyBySlug } from "../data/policies";
import { Crumbs, DemoPill } from "../components/ui";
import { WhatsAppButton } from "../components/Contact";

export default function Policies() {
  const { slug } = useParams();
  const policy = policyBySlug(slug ?? "") ?? POLICIES[0];

  return (
    <div className="wrap py-8 md:py-12">
      <Crumbs items={[{ label: "Home", to: "/" }, { label: "Policies", to: "/policy/delivery" }, { label: policy.title }]} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{policy.title}</h1>
        <DemoPill />
      </div>

      <p className="mt-3 max-w-2xl rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-[12.5px] font-bold leading-relaxed text-amberdeep">
        Store owner: the texts below are editable placeholders. Replace every “[…]” with your real
        wording in <code className="rounded bg-amber/20 px-1.5 py-0.5">src/data/policies.ts</code>.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="card h-fit p-2 lg:sticky lg:top-40" aria-label="Policies">
          {POLICIES.map((p) => (
            <Link key={p.slug} to={`/policy/${p.slug}`}
              className={`block rounded-xl px-4 py-2.5 text-[13px] font-extrabold transition ${p.slug === policy.slug ? "bg-ink text-amber" : "text-muted hover:bg-mist hover:text-ink"}`}>
              {p.title}
            </Link>
          ))}
        </nav>

        <article className="card p-6 md:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted">{policy.updated}</p>
          <p className="mt-3 text-[15px] font-semibold leading-relaxed text-ink/85">{policy.intro}</p>
          <div className="mt-6 space-y-6">
            {policy.sections.map((s) => (
              <section key={s.h}>
                <h2 className="font-display text-lg font-bold">{s.h}</h2>
                <p className="mt-1.5 text-sm font-semibold leading-relaxed text-muted">{s.body}</p>
              </section>
            ))}
          </div>
          <div className="mt-8 rounded-xl bg-mist p-5">
            <p className="text-sm font-extrabold">Questions about this policy?</p>
            <p className="mt-1 text-[13px] font-semibold text-muted">Message us directly — a real person answers.</p>
            <WhatsAppButton message={`Hello! I have a question about your ${policy.title}.`} className="mt-3">
              Chat with us on WhatsApp
            </WhatsAppButton>
          </div>
        </article>
      </div>
    </div>
  );
}
