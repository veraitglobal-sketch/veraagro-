import type { SiteLocale } from '@/i18n/config';

type GuideLocaleMeta = { title: string; metaDescription: string };

/** Localized title + meta for indexed authority guides (body stays EN until full translation). */
const GUIDE_LOCALE_META: Partial<
  Record<string, Partial<Record<SiteLocale, GuideLocaleMeta>>>
> = {
  'digital-product-passport-fresh-produce': {
    de: {
      title: 'EU-Digitaler Produktpass für Frischware',
      metaDescription:
        'Wie Bio Vera jede Frischware-Charge mit einem EU-Digitalen Produktpass verknüpft — Herkunft, QA, Kühlkette und Zertifikate in einem QR-Dossier für Einkäufer.',
    },
    sr: {
      title: 'EU digitalni pasoš proizvoda za sveže voće i povrće',
      metaDescription:
        'Kako Bio Vera povezuje svaku seriju sveže robe sa EU digitalnim pasošem proizvoda — poreklo, QA, hladni lanac i sertifikati u jednom QR dosijeu.',
    },
    bg: {
      title: 'EU цифров паспорт на продукта за пресни продукти',
      metaDescription:
        'Как Bio Vera свързва всяка партида пресни продукти с EU цифров паспорт — произход, QA, студена верига и сертификати в един QR досие.',
    },
    ro: {
      title: 'Pașaport digital al produsului UE pentru produse proaspete',
      metaDescription:
        'Cum leagă Bio Vera fiecare lot de produse proaspete de un pașaport digital al produsului UE — origine, QA, lanț frigorific și certificate într-un dosar QR.',
    },
    fr: {
      title: 'Passeport numérique produit UE pour les produits frais',
      metaDescription:
        'Comment Bio Vera relie chaque lot de produits frais à un passeport numérique produit UE — origine, QA, chaîne du froid et certificats dans un dossier QR.',
    },
    es: {
      title: 'Pasaporte digital de producto de la UE para productos frescos',
      metaDescription:
        'Cómo Bio Vera vincula cada lote de productos frescos a un pasaporte digital de producto de la UE — origen, QA, cadena de frío y certificados en un dossier QR.',
    },
  },
  'farm-to-fork-fresh-produce-traceability': {
    de: {
      title: 'Farm-to-Fork-Rückverfolgbarkeit für Frischware',
      metaDescription:
        'Wie Bio Vera Rückverfolgbarkeit von der Parzelle bis zum Regal betreibt — Protocol 360, digitale Übergaben und Kühlkettennachweise für Einzelhandels-QA.',
    },
    sr: {
      title: 'Farm-to-fork sledljivost sveže robe',
      metaDescription:
        'Kako Bio Vera vodi sledljivost od parcele do police — Protocol 360, digitalne primopredaje i dokazi hladnog lanca za retail QA.',
    },
    bg: {
      title: 'Farm-to-fork проследимост на пресни продукти',
      metaDescription:
        'Как Bio Vera управлява проследимост от парцел до щанда — Protocol 360, цифрови предавания и доказателства за студена верига за retail QA.',
    },
    ro: {
      title: 'Trasabilitate farm-to-fork pentru produse proaspete',
      metaDescription:
        'Cum operează Bio Vera trasabilitatea de la parcelă la raft — Protocol 360, predări digitale și dovezi ale lanțului frigorific pentru QA retail.',
    },
    fr: {
      title: 'Traçabilité farm-to-fork des produits frais',
      metaDescription:
        'Comment Bio Vera opère la traçabilité de la parcelle au rayon — Protocol 360, transferts numériques et preuves de chaîne du froid pour la QA retail.',
    },
    es: {
      title: 'Trazabilidad farm-to-fork de productos frescos',
      metaDescription:
        'Cómo opera Bio Vera la trazabilidad de la parcela al lineal — Protocol 360, entregas digitales y pruebas de cadena de frío para QA retail.',
    },
  },
  'globalgap-group-certification': {
    de: {
      title: 'GlobalG.A.P. Gruppenzertifizierung im Erzeugerprogramm',
      metaDescription:
        'Wie Bio Vera GlobalG.A.P. IFA v6 Gruppenzertifizierung für Erzeuger in ganz Europa unterstützt — Compliance, Dokumentation und Marktzugang.',
    },
    sr: {
      title: 'GlobalG.A.P. grupna sertifikacija u programu proizvođača',
      metaDescription:
        'Kako Bio Vera podržava GlobalG.A.P. IFA v6 grupnu sertifikaciju za proizvođače širom Evrope — usklađenost, dokumentacija i pristup tržištu.',
    },
    bg: {
      title: 'GlobalG.A.P. групова сертификация в програмата за производители',
      metaDescription:
        'Как Bio Vera поддържа GlobalG.A.P. IFA v6 групова сертификация за производители в цяла Европа — съответствие, документация и достъп до пазара.',
    },
    ro: {
      title: 'Certificare de grup GlobalG.A.P. în programul pentru producători',
      metaDescription:
        'Cum sprijină Bio Vera certificarea de grup GlobalG.A.P. IFA v6 pentru producători din întreaga Europă — conformitate, documentație și acces la piață.',
    },
    fr: {
      title: 'Certification de groupe GlobalG.A.P. dans le programme producteurs',
      metaDescription:
        'Comment Bio Vera soutient la certification de groupe GlobalG.A.P. IFA v6 pour les producteurs à travers l\'Europe — conformité, documentation et accès au marché.',
    },
    es: {
      title: 'Certificación grupal GlobalG.A.P. en el programa de productores',
      metaDescription:
        'Cómo apoya Bio Vera la certificación grupal GlobalG.A.P. IFA v6 para productores en toda Europa — cumplimiento, documentación y acceso al mercado.',
    },
  },
};

export function guideLocaleMeta(
  slug: string,
  locale: SiteLocale,
): GuideLocaleMeta | null {
  if (locale === 'en') return null;
  return GUIDE_LOCALE_META[slug]?.[locale] ?? null;
}
