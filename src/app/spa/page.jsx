import Image from "next/image";
import Link from "next/link";
import AppButton from "@/components/ui/app-button";

export const metadata = {
  title: "Spa Mineral",
  description: "Programmes spa, massages et rituels bien-etre a l'Hotel Atlas.",
};

export default function SpaPage() {
  return (
    <main className="container page-shell">
      <h1>Spa mineral</h1>
      <p className="page-lead">
        Sauna, hammam, bassin chauffe et soins signatures adaptes a votre sejour.
      </p>

      <section className="spa-intro-strip section-top" aria-label="Formules spa">
        <p><strong>Rituel detente 60 min</strong> Massage du corps + acces libre au spa.</p>
        <p><strong>Rituel duo 90 min</strong> Soin en cabine double + infusion detox.</p>
        <p><strong>Pass spa journee</strong> Acces sauna, hammam, bassin et espace repos.</p>
      </section>

      <section className="spa-details section-top">
        <article className="spa-detail-card">
          <div className="spa-detail-media">
            <Image
              src="/spa1.webp"
              alt="Soin corps relaxant au spa"
              width={1200}
              height={800}
              className="spa-detail-image"
            />
          </div>
          <div className="spa-detail-body">
            <h2>Soin Signature Ocean - 75 min</h2>
            <p>
              Ce rituel commence par un gommage doux au sel marin, suivi d'un massage
              profond dos, epaules et jambes. L'objectif: relacher les tensions, ameliorer
              la circulation et retrouver une sensation de legerete immediate.
            </p>
            <p>
              Inclus: espace chaleur (sauna + hammam), tisane bien-etre, peignoir et espace repos.
            </p>
          </div>
        </article>

        <article className="spa-detail-card">
          <div className="spa-detail-media">
            <Image
              src="/spa2.webp"
              alt="Espace piscine et relaxation du spa"
              width={1200}
              height={800}
              className="spa-detail-image"
            />
          </div>
          <div className="spa-detail-body">
            <h2>Parcours Relax Premium - 2h</h2>
            <p>
              Un parcours complet entre bassin chauffe, hammam aromatique et zone silence.
              Parfait apres une journee active, ce programme est pense pour calmer le mental
              et detendre durablement le corps.
            </p>
            <p>
              Recommande en fin d'apres-midi pour profiter d'une ambiance douce et d'une
              recuperation optimale avant le diner.
            </p>
          </div>
        </article>
      </section>

      <div className="section-top">
        <AppButton asChild tone="primary">
          <Link href="/disponibilites">Reserver un sejour bien-etre</Link>
        </AppButton>
      </div>
    </main>
  );
}
