#!/usr/bin/env node
/** Remove Balkans-only grower eligibility framing — Europe-wide only. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const localesDir = join(dirname(fileURLToPath(import.meta.url)), '../locales');

const WHO_CAN_APPLY = {
  de: 'Das Programm steht Erzeugern jeder Größe offen — von kleinen Familienbetrieben bis zu großen kommerziellen Anlagen. Bewerbungen von Erzeugern in ganz Europa, die bereit sind, die Bio-Vera-Produktionsstandards einzuhalten. Der aktuelle Zertifizierungsstatus ist kein Hindernis.',
  sr: 'Program je otvoren za uzgajivače svih veličina — od malih porodičnih gazdinstava do velikih komercijalnih imanja. Primamo prijave proizvođača širom Evrope koji su spremni da poštuju Bio Vera standarde proizvodnje. Postojeći sertifikacioni status nije prepreka.',
  bg: 'Програмата е отворена за производители от всякакъв мащаб — от малки семейни стопанства до големи търговски имоти. Приемаме кандидатури от производители в цяла Европа, готови да следват стандартите за производство на Bio Vera. Текущият сертификационен статус не е пречка.',
  ro: 'Programul este deschis producătorilor de toate dimensiunile — de la mici ferme de familie la exploatații comerciale mari. Acceptăm candidaturi de la producători din toată Europa dispuși să respecte standardele de producție Bio Vera. Statutul actual de certificare nu este un obstacol.',
  fr: 'Le programme est ouvert aux producteurs de toutes tailles — des petites exploitations familiales aux grandes exploitations commerciales. Nous acceptons les candidatures de producteurs à travers l\'Europe prêts à suivre les standards de production Bio Vera. Le statut de certification actuel n\'est pas un obstacle.',
  es: 'El programa está abierto a productores de todos los tamaños — desde pequeñas explotaciones familiares hasta grandes fincas comerciales. Aceptamos solicitudes de productores en toda Europa dispuestos a seguir los estándares de producción Bio Vera. El estado de certificación actual no es un obstáculo.',
};

const META_DESC_PATCH = [
  [/Offen für Erzeuger in der EU und dem Westlichen Balkan\./g, 'Offen für Erzeuger in ganz Europa.'],
  [/Otvoreno za uzgajivače u EU i na Zapadnom Balkanu\./g, 'Otvoreno za proizvođače širom Evrope.'],
  [/Ouvert aux producteurs de l'UE et des Balkans occidentaux\./g, 'Ouvert aux producteurs à travers l\'Europe.'],
  [/Open to growers in the EU and Western Balkans\./g, 'Open to producers throughout Europe.'],
  [/Balcanii de Vest/g, 'Europa'],
  [/Balcanes Occidentales/g, 'Europa'],
  [/Balkans occidentaux/g, 'Europe'],
  [/Westlichen Balkan/g, 'Europa'],
  [/Zapadnog Balkana/g, 'Evrope'],
  [/Западните Балкани/g, 'Европа'],
];

for (const [locale, lead] of Object.entries(WHO_CAN_APPLY)) {
  const path = join(localesDir, `${locale}.json`);
  const bundle = JSON.parse(readFileSync(path, 'utf8'));
  if (bundle.growersPage) {
    bundle.growersPage.whoCanApplyLead = lead;
    let md = bundle.growersPage.metaDescription ?? '';
    for (const [re, rep] of META_DESC_PATCH) {
      md = md.replace(re, rep);
    }
    if (md) bundle.growersPage.metaDescription = md;
  }
  writeFileSync(path, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');
  console.log(`growersPage Europe scope → ${locale}.json`);
}
