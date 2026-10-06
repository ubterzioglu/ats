import { getTranslations } from "next-intl/server";
import { LEGAL_ENTITY, LEGAL_VERSION_DATE } from "@/lib/legal-entity";

export default async function KvkkPage() {
  const t = await getTranslations("kvkk");

  return (
    <div className="mx-auto w-full max-w-page px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-ink mb-2">{t("title")}</h1>
      <p className="text-muted text-sm mb-8">{t("lastUpdated", { date: LEGAL_VERSION_DATE })}</p>

      <div className="prose prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">{t("section1.title")}</h2>
          <p className="text-muted">
            {t("section1.content", {
              controllerName: LEGAL_ENTITY.controllerName,
              controllerAddress: LEGAL_ENTITY.controllerAddress,
              controllerEmail: LEGAL_ENTITY.controllerEmail
            })}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">{t("section2.title")}</h2>
          <p className="text-muted mb-2">{t("section2.intro")}</p>
          <ul className="list-disc list-inside space-y-1 text-muted">
            <li>{t("section2.item1")}</li>
            <li>{t("section2.item2")}</li>
            <li>{t("section2.item3")}</li>
            <li>{t("section2.item4")}</li>
            <li>{t("section2.item5")}</li>
            <li>{t("section2.item6")}</li>
            <li>{t("section2.item7")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">{t("section3.title")}</h2>
          <ul className="list-disc list-inside space-y-1 text-muted">
            <li>{t("section3.item1")}</li>
            <li>{t("section3.item2")}</li>
            <li>{t("section3.item3")}</li>
            <li>{t("section3.itemSignupNotice")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">{t("section4.title")}</h2>
          <p className="text-muted mb-2">{t("section4.intro")}</p>
          <ul className="list-disc list-inside space-y-1 text-muted">
            <li>{t("section4.item1")}</li>
            <li>{t("section4.item2")}</li>
            <li>{t("section4.item3")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">{t("section5.title")}</h2>
          <p className="text-muted">
            {t("section5.content", {
              supabaseRegion: LEGAL_ENTITY.supabaseRegion,
              hostingLocation: LEGAL_ENTITY.hostingLocation
            })}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">{t("section6.title")}</h2>
          <p className="text-muted">{t("section6.content")}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">{t("section7.title")}</h2>
          <ul className="list-disc list-inside space-y-1 text-muted">
            <li>{t("section7.item1")}</li>
            <li>{t("section7.item2")}</li>
            <li>{t("section7.item3")}</li>
            <li>{t("section7.item4")}</li>
            <li>{t("section7.item5")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-3">{t("section8.title")}</h2>
          <p className="text-muted">
            {t("section8.content", { controllerEmail: LEGAL_ENTITY.controllerEmail })}
          </p>
        </section>
      </div>
    </div>
  );
}
