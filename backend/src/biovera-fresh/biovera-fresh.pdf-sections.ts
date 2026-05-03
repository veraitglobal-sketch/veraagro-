/** Keep in sync with web/locales/en.json and sr.json → `bioVeraFresh.pdfSections` (browser print appendix). */
export type BioVeraFreshPdfSection = { title: string; body: string };

const CONTACT_SR =
  'Za dodatne informacije kontaktirajte BioVera tim.\n\nEmail: contact@biovera.app\nTelefon: +49 155 63740470\nWeb: https://biovera.app';

const CONTACT_EN =
  'For more information, contact the Bio Vera team.\n\nEmail: contact@biovera.app\nPhone: +49 155 63740470\nWeb: https://biovera.app';

export const PDF_SECTIONS_SR: BioVeraFreshPdfSection[] = [
  {
    title: 'BioVera Fresh',
    body:
      'Moderan koncept prodaje svežih proizvoda.\n\nDirect. Fresh. Controlled.\n\nBioVera Fresh predstavlja savremeni model maloprodaje voća i povrća, zasnovan na direktnoj povezanosti sa proizvođačima, kontrolisanom kvalitetu i maksimalnoj iskorištenosti proizvoda.',
  },
  {
    title: '1. UVOD',
    body:
      'BioVera Fresh je nastao kao odgovor na rastuću potrebu za organizovanom, transparentnom i efikasnom prodajom svežih proizvoda.\n\nU tradicionalnim sistemima, veliki deo robe gubi vrednost zbog loše organizacije, nepredvidive potražnje i nedostatka kontrole.\n\nBioVera Fresh uvodi novi standard — sistem koji povezuje proizvodnju i tržište kroz kontrolisan lanac, uz stabilan kvalitet i minimalne gubitke.',
  },
  {
    title: '2. PROBLEM NA TRŽIŠTU',
    body:
      'Današnje tržište voća i povrća suočava se sa nekoliko ključnih problema:\n\n• neorganizovana distribucija\n• veliki gubici robe\n• nepoznato poreklo proizvoda\n• nestabilne cene\n• nedostatak kontrole kvaliteta\n\nOvakav sistem stvara nesigurnost za proizvođače, partnere i krajnje kupce.',
  },
  {
    title: '3. BIOVERA REŠENJE',
    body:
      'BioVera Fresh uvodi jasan i kontrolisan model:\n\n• direktna veza između farmera i prodaje\n• standardizovan kvalitet proizvoda\n• organizovana distribucija\n• kontrolisana prodajna mesta\n• maksimalna iskorištenost robe\n\nNa ovaj način smanjuju se gubici i povećava ukupna vrednost proizvoda.',
  },
  {
    title: '4. KONCEPT PRODAVNICE',
    body:
      'Maloprodajni deo sa svežim voćem i povrćem nalazi se na levoj strani prostora. Desna strana namenjena je servisnom Fresh pultu za sveže sokove, voćne salate i pripremu pred kupcem.\n\nBioVera Fresh prodavnica je moderan, funkcionalan i jednostavan prostor podeljen na dve ključne zone:\n\nRetail zona\n• sveže voće i povrće\n• jasno izloženi proizvodi\n• prodaja na meru\n• BioVera pakovanja\n\nFresh zona na servisnom pultu\n• sveže ceđeni sokovi\n• voćne salate\n• priprema pred kupcem\n\nDodatno\n• mali prostor za konzumaciju\n• brz i jednostavan servis',
  },
  {
    title: '5. KAKO SISTEM FUNKCIONIŠE',
    body:
      'BioVera Fresh prati jednostavan i efikasan tok:\n\n• proizvodnja u mreži farmera\n• kontrola kvaliteta kroz BioVera standard\n• distribucija kroz organizovani sistem\n• prodaja u BioVera Fresh prodavnicama\n\nOvaj model omogućava stabilnost, kontrolu i transparentnost u svakom koraku.',
  },
  {
    title: '6. UPRAVLJANJE ROBOM',
    body:
      'Jedna od ključnih prednosti BioVera Fresh koncepta je pametno upravljanje proizvodima:\n\n• sveža roba ide direktno u prodaju\n• roba stara 2–3 dana koristi se za sokove i salate\n• roba koja ne zadovoljava standard ne koristi se\n\nOvim pristupom postiže se:\n\n• minimalan otpad\n• maksimalna iskorištenost\n• dodatna vrednost proizvoda',
  },
  {
    title: '7. MODEL ZARADE',
    body:
      'BioVera Fresh partner ostvaruje zaradu kroz više izvora:\n\n1. Prodaja voća i povrća\n• stabilan promet\n• kontinuirana potražnja\n• osnovni prihod\n\n2. Sveže ceđeni sokovi\n• visoka marža\n• brza prodaja\n• dodatni prihod\n\n3. Voćne salate\n• premium proizvod\n• povećanje vrednosti kupovine\n• dodatna profitabilnost\n\nKombinacijom ovih izvora, partner ostvaruje stabilan i skalabilan model zarade.',
  },
  {
    title: '8. OPERATIVNI MODEL',
    body:
      'BioVera Fresh je dizajniran da bude jednostavan za upravljanje:\n\n• mali tim od dva radnika\n• jasan raspored rada\n• brza organizacija\n• minimalna kompleksnost\n\nOvaj model omogućava brz početak i efikasno svakodnevno poslovanje.',
  },
  {
    title: '9. PREDNOSTI ZA PARTNERA',
    body:
      'Ulaskom u BioVera Fresh sistem, partner dobija:\n\n• pristup BioVera proizvodima\n• gotov poslovni model\n• standarde rada i kvaliteta\n• podršku u pokretanju i razvoju\n• stabilno snabdevanje\n• prepoznatljiv brend',
  },
  {
    title: '10. INVESTICIJA',
    body:
      'Investicija za pokretanje BioVera Fresh prodavnice zavisi od:\n\n• veličine prostora\n• lokacije\n• opreme\n\nModel je dizajniran tako da omogući relativno brz povrat investicije uz stabilno poslovanje.',
  },
  {
    title: '11. ODNOS PREMA TRŽIŠTU',
    body:
      'BioVera Fresh ne predstavlja konkurenciju postojećim partnerima.\n\nNaši glavni partneri ostaju retail lanci i distributeri, dok BioVera Fresh funkcioniše kao dodatni kanal koji:\n\n• stabilizuje tržište\n• omogućava prodaju viška robe\n• podržava kontinuitet proizvodnje',
  },
  {
    title: '12. RAZVOJ I RAST',
    body:
      'BioVera Fresh je deo šireg sistema koji se razvija na evropskom tržištu.\n\nPlanirano širenje uključuje:\n\n• nove lokacije\n• razvoj mreže partnera\n• povećanje proizvodnje\n• jačanje distribucije',
  },
  {
    title: '13. KO MOŽE POSTATI PARTNER',
    body:
      'BioVera Fresh partner može biti:\n\n• preduzetnik\n• investitor\n• vlasnik lokacije\n• osoba zainteresovana za razvoj stabilnog biznisa',
  },
  {
    title: '14. POSTANI BIOVERA FRESH PARTNER',
    body:
      'Ukoliko želite da postanete deo modernog sistema prodaje hrane i razvijate sopstveni biznis uz podršku BioVera koncepta, pozivamo vas da nas kontaktirate.',
  },
  {
    title: 'Kontakt',
    body: CONTACT_SR,
  },
];

export const PDF_SECTIONS_EN: BioVeraFreshPdfSection[] = [
  {
    title: 'BioVera Fresh',
    body:
      'A modern concept for selling fresh produce.\n\nDirect. Fresh. Controlled.\n\nBioVera Fresh is a contemporary fruit-and-vegetable retail model built on direct ties with growers, controlled quality and maximum product utilisation.',
  },
  {
    title: '1. Introduction',
    body:
      'BioVera Fresh responds to the growing need for organised, transparent and efficient sale of fresh produce.\n\nIn traditional systems, much value is lost through weak organisation, unpredictable demand and lack of control.\n\nBioVera Fresh sets a new standard — linking production and the market through a controlled chain, stable quality and minimal losses.',
  },
  {
    title: '2. Market challenges',
    body:
      'Today’s fruit and vegetable market faces several structural issues:\n\n• fragmented distribution\n• high shrink and waste\n• unclear origin\n• volatile pricing\n• weak quality control\n\nThis creates uncertainty for growers, partners and shoppers alike.',
  },
  {
    title: '3. The BioVera answer',
    body:
      'BioVera Fresh introduces a clear, controlled model:\n\n• direct link between growers and retail\n• standardised product quality\n• organised distribution\n• controlled store formats\n• maximum utilisation of goods\n\nLosses fall and total product value rises.',
  },
  {
    title: '4. Store concept',
    body:
      'Retail fruit and vegetables sit on the left side of the floor, while the right side hosts the Fresh service counter for juices, fruit salads and preparation in clear view of shoppers.\n\nA BioVera Fresh store is modern, functional and simple, with two core zones:\n\nRetail zone\n• fresh fruit and vegetables\n• clear merchandising\n• sold-by-weight service\n• BioVera packs\n\nFresh zone at the service counter\n• freshly squeezed juices\n• fruit salads\n• preparation in front of the customer\n\nAdditional\n• small consumption area\n• fast, straightforward service',
  },
  {
    title: '5. How the system works',
    body:
      'BioVera Fresh follows a simple, efficient flow:\n\n• production within the grower network\n• quality control through the BioVera standard\n• distribution through an organised system\n• retail in BioVera Fresh stores\n\nThe model delivers stability, control and transparency at every step.',
  },
  {
    title: '6. Managing inventory',
    body:
      'A core advantage is disciplined product handling:\n\n• freshest goods go straight to the floor\n• produce aged 2–3 days moves into juices and salads\n• anything below standard is not used\n\nThe outcome:\n\n• minimal waste\n• high utilisation\n• extra value from the same harvest',
  },
  {
    title: '7. Earnings model',
    body:
      'Partners earn across multiple streams:\n\n1. Fruit & vegetable sales\n• steady footfall\n• recurring demand\n• baseline revenue\n\n2. Fresh juices\n• strong margin\n• fast rotation\n• incremental income\n\n3. Fruit salads\n• premium SKU\n• higher basket value\n• extra profitability\n\nTogether these streams form a stable, scalable earnings model.',
  },
  {
    title: '8. Operating model',
    body:
      'BioVera Fresh is designed to stay easy to run:\n\n• lean crew of about two people\n• clear shifts and routines\n• quick daily organisation\n• low operational complexity\n\nThat enables a fast launch and efficient day-to-day trading.',
  },
  {
    title: '9. Partner benefits',
    body:
      'Joining BioVera Fresh gives partners:\n\n• access to BioVera supply\n• a ready-made operating playbook\n• quality and service standards\n• launch and growth support\n• dependable replenishment\n• a recognised brand',
  },
  {
    title: '10. Investment',
    body:
      'Startup investment depends on:\n\n• store size\n• location\n• equipment choices\n\nThe model is built to support a comparatively fast payback alongside steady trading.',
  },
  {
    title: '11. Relationship with the wider market',
    body:
      'BioVera Fresh is not positioned against existing partners.\n\nRetail chains and distributors remain core partners, while BioVera Fresh acts as an extra channel that:\n\n• stabilises the market\n• absorbs surplus volume\n• supports production continuity',
  },
  {
    title: '12. Growth roadmap',
    body:
      'BioVera Fresh sits inside a broader European rollout.\n\nPlanned expansion covers:\n\n• new locations\n• partner network growth\n• higher farm output\n• stronger distribution depth',
  },
  {
    title: '13. Who can partner',
    body:
      'Potential partners include:\n\n• entrepreneurs\n• investors\n• site owners\n• operators seeking a resilient food-retail concept',
  },
  {
    title: '14. Become a BioVera Fresh partner',
    body:
      'If you want to join a modern fresh-food retail system and build your own business with BioVera backing, we invite you to get in touch.',
  },
  {
    title: 'Contact',
    body: CONTACT_EN,
  },
];
