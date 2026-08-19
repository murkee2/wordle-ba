import { mkdir, writeFile } from 'node:fs/promises'

const SOURCES = [
  'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/hr_HR/hr_HR.dic',
  'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/sr_Latn/sr_Latn.dic',
]
const SERBIAN_FALLBACK = 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/sr/sr.dic'

const WORD_PATTERN = /^[A-ZČĆĐŠŽ]{5}$/u
const FORBIDDEN_DIGRAPHS = /LJ|NJ|DŽ/u

const CURATED_TARGET_WORDS = [
  'AKORD', 'ALARM', 'ALEJA', 'AMBAR', 'ANĐEO', 'ARENA', 'ARIJA', 'ARHIV', 'ATLAS', 'AUTOR', 'AVION',
  'BAČVA', 'BADEM', 'BAJKA', 'BAKAR', 'BALET', 'BALON', 'BANKA', 'BARUT', 'BAŠTA', 'BAZAR', 'BAZEN', 'BEDEM',
  'BETON', 'BIBER', 'BIJES', 'BISER', 'BITKA', 'BLAGO', 'BLATO', 'BLUZA', 'BOGAT', 'BORAC', 'BORBA', 'BOSNA',
  'BRAĆA', 'BRADA', 'BRANA', 'BRAVA', 'BREZA', 'BRIGA', 'BRUKA', 'BUKET', 'BUKVA', 'BUNAR', 'BUREK', 'BURMA', 'BURZA',
  'CEGER', 'CESTA', 'CIGLA', 'CIMET', 'CITAT', 'CRKVA', 'CRTEŽ', 'CVIJE',
  'ČAMAC', 'ČASAK', 'ČASNA', 'ČEKIĆ', 'ČELIK', 'ČESMA', 'ČETKA', 'ČIPKA', 'ČISTO', 'ČIZMA', 'ČORBA', 'ČUDAN', 'ČUVAR', 'ČVRST',
  'ĆELAV', 'ĆEVAP', 'ĆILIM', 'ĆORAV', 'ĆOŠAK',
  'DABAR', 'DALEK', 'DANAS', 'DASKA', 'DATUM', 'DEBEO', 'DEBLO', 'DEČKO', 'DEKOR', 'DESET', 'DINAR', 'DIOBA',
  'DISKO', 'DIVAN', 'DLAKA', 'DOBAR', 'DOBRO', 'DOKAZ', 'DOKLE', 'DOLAP', 'DOMAR', 'DOMET', 'DRAMA', 'DRUGA', 'DRUGI', 'DRVEN',
  'DUĆAN', 'DUGME', 'DUKAT', 'DUVAN', 'DUŽAN', 'ĐAČKI', 'ĐUBRE', 'ĐERĐE',
  'EFEKT', 'EKIPA', 'EKRAN', 'EKSER', 'ELITA', 'ETAPA', 'ETIKA',
  'FAKIR', 'FARBA', 'FARMA', 'FAZAN', 'FIJUK', 'FIŠEK', 'FLOTA', 'FOKUS', 'FORMA', 'FORUM', 'FOTKA', 'FRAZA', 'FRULA',
  'GAJBA', 'GALEB', 'GLAVA', 'GLINA', 'GLUMA', 'GORAK', 'GORKO', 'GOVOR', 'GOZBA', 'GRAĐA', 'GRANA', 'GRČKI', 'GROZA', 'GROZD', 'GRUDA', 'GRUDI', 'GRUPA', 'GUSAR', 'GUSKA', 'GUŽVA',
  'HABER', 'HAJDE', 'HAJKA', 'HAMAM', 'HARAM', 'HAREM', 'HARFA', 'HITAC', 'HITAN', 'HRANA', 'HRAST', 'HRBAT', 'HRVAT', 'HUMOR',
  'IDIOT', 'IDILA', 'IGRAČ', 'IKONA', 'IMENA', 'IRVAS', 'ISKAZ', 'ISKOP', 'ISKRA', 'ISLAM', 'ISPAD', 'ISPIT', 'ISTOK', 'IZBOR', 'IZDAH', 'IZLAZ', 'IZLET', 'IZRAZ', 'IZROD', 'IZVOR',
  'JAHAT', 'JAKNA', 'JARAC', 'JARAK', 'JARAM', 'JARKO', 'JAVOR', 'JECAT', 'JEDAN', 'JEDRO', 'JELEN', 'JELKA', 'JESEN', 'JEZIK', 'JEZIV', 'JUČER', 'JUNAC', 'JUNAK', 'JURIŠ', 'JUTRO',
  'KABAL', 'KADAR', 'KADET', 'KAJAK', 'KAKAO', 'KALUP', 'KAMEN', 'KANAP', 'KANON', 'KANTA', 'KAPAK', 'KAPAR', 'KARTA', 'KASNO', 'KATAR', 'KAUČI', 'KAZAN', 'KAZNA', 'KEČAP', 'KEFIR', 'KIKOT', 'KIPAR', 'KISEO', 'KISIK', 'KLADA', 'KLASA', 'KLIMA', 'KLUPA', 'KOCKA', 'KOFER', 'KOKOŠ', 'KOLAČ', 'KOLAC', 'KOLAR', 'KOLUT', 'KONAC', 'KONOP', 'KORAK', 'KORAL', 'KORPA', 'KORZO', 'KOSAC', 'KOSTI', 'KOTAO', 'KOVAČ', 'KRAVA', 'KREMA', 'KRILO', 'KRIVA', 'KRIZA', 'KROKI', 'KRUNA', 'KRUTA', 'KRVAV', 'KUČKA', 'KUHAR', 'KUPAC', 'KUPON', 'KUPUS', 'KVAKA', 'KVART',
  'LABUD', 'LADAN', 'LAHOR', 'LAJAT', 'LAKAT', 'LAKOM', 'LAMPA', 'LANAC', 'LASER', 'LATIN', 'LAŽOV', 'LAŽAN', 'LEDEN', 'LIMAR', 'LIMUN', 'LISAC', 'LISKA', 'LISTA', 'LITRA', 'LOGOR', 'LOKAL', 'LOKOT', 'LOPTA', 'LOVAC', 'LOVOR', 'LUKAV',
  'MAGLA', 'MAJKA', 'MAMAC', 'MAMUT', 'MANIR', 'MARKA', 'MASER', 'MASKA', 'MASLO', 'MAŠTA', 'MATER', 'MAČKA', 'MAČOR', 'MEDAL', 'MEDEN', 'MEDAR', 'MELEK', 'MELOS', 'MENZA', 'MERAK', 'MESAR', 'MESNI', 'METAL', 'METAR', 'METLA', 'METRO', 'MEZAR', 'MINER', 'MINUT', 'MIRAZ', 'MIRAN', 'MIRNO', 'MIRIS', 'MISLI', 'MJERA', 'MJEST', 'MLADA', 'MLADI', 'MLADO', 'MODAR', 'MODEL', 'MOKAR', 'MOKRA', 'MOLBA', 'MOLER', 'MOMAK', 'MORAL', 'MORAT', 'MOTEL', 'MOTOR', 'MOTKA', 'MOZAK', 'MRAVI', 'MREŽA', 'MRKVA', 'MRTAV', 'MRTVI', 'MUDAR', 'MUDRO', 'MURAL', 'MUŠKA', 'MUZEJ',
  'NACRT', 'NAFTA', 'NAGAO', 'NAGLO', 'NALOG', 'NAMET', 'NAPAD', 'NAPON', 'NAPOR', 'NARAV', 'NAROD', 'NASIP', 'NAUKA', 'NAVAL', 'NAVOZ', 'NAZAD', 'NAZIV', 'NAZOR', 'NEĆAK', 'NEHAJ', 'NEMAR', 'NEMIR', 'NERAD', 'NERED', 'NETKO', 'NIŠAN', 'NOĆAS', 'NOGAR', 'NOKAT', 'NOSAČ', 'NOSAT', 'NOTAR', 'NOVAC', 'NOŽIĆ',
  'OBALA', 'OBLAK', 'OBLIK', 'OBRAZ', 'OBRED', 'OBRIS', 'OBRVA', 'OBUĆA', 'OBUKA', 'OČITO', 'ODBOJ', 'ODBOR', 'ODLAZ', 'ODLIK', 'ODLIV', 'ODLUK', 'ODMAH', 'ODMET', 'ODMOR', 'ODNOS', 'ODPAD', 'ODRAZ', 'ODRED', 'ODRON', 'ODVEĆ', 'ODVOD', 'ODVOZ', 'OGLAS', 'OGLED', 'OGREV', 'OKLOP', 'OKOLO', 'OKRET', 'OKRUG', 'OKRUT', 'OKUKA', 'OKUSI', 'OKVIR', 'OLOVO', 'OLTAR', 'OLUJA', 'OMLET', 'ONAMO', 'OPADA', 'OPAKA', 'OPEKA', 'OPERA', 'OPHOD', 'OPREZ', 'OPSEG', 'OPTIK', 'ORGAN', 'ORMAR', 'ORTAK', 'OSAMA', 'OSEKA', 'OSNOV', 'OSOBA', 'OSTRV', 'OSUDA', 'OSVRT', 'OŠTAR', 'OŠTRI', 'OŠTRO', 'OTKAZ', 'OTKOS', 'OTKUP', 'OTOKA', 'OTROV', 'OTVOR', 'OVAMO', 'OVČAR',
  'PAGAN', 'PAKAO', 'PAKET', 'PALAC', 'PALMA', 'PAMET', 'PAMUK', 'PAPAK', 'PAPIR', 'PARAD', 'PARČE', 'PARIZ', 'PARKA', 'PASOŠ', 'PASTA', 'PATAK', 'PATKA', 'PATOS', 'PAUZA', 'PAZAR', 'PAZUH', 'PČELA', 'PEČAT', 'PEČEN', 'PEGLA', 'PEHAR', 'PEKAR', 'PELIN', 'PENAL', 'PEPEO', 'PERLA', 'PERON', 'PERUT', 'PETAK', 'PETAR', 'PIJAC', 'PIJAN', 'PIJUK', 'PILAD', 'PILOT', 'PIPAK', 'PIRAT', 'PISAC', 'PISAK', 'PISAR', 'PISMO', 'PISTA', 'PITAK', 'PITOM', 'PIVOT', 'PLAĆA', 'PLAST', 'PLATA', 'PLATO', 'PLAVA', 'PLAVI', 'PLEME', 'PLIMA', 'PLIVA', 'PLOČA', 'PLUTO', 'POČET', 'PODAO', 'POGOD', 'POGON', 'POHOD', 'POJAS', 'POJAV', 'POKER', 'POKOJ', 'POKOR', 'POKUS', 'POLET', 'POLKA', 'POMAK', 'POMOĆ', 'PONOR', 'PONOS', 'POPIS', 'PORAZ', 'PORED', 'POREZ', 'POROD', 'POROK', 'POSAO', 'POSET', 'POSTA', 'POSTO', 'POSUD', 'POSVE', 'POTEZ', 'POTOK', 'POTOP', 'POUKA', 'POVEZ', 'POVOD', 'POZIV', 'POZOR', 'PRAĆA', 'PRAVI', 'PRAVO', 'PREČA', 'PREDA', 'PREKO', 'PREMA', 'PRESA', 'PRICA', 'PRIČA', 'PRIJE', 'PRIMA', 'PRINC', 'PRIOR', 'PRKOS', 'PROBA', 'PROST', 'PROZA', 'PRSTI', 'PRŠUT', 'PRUGA', 'PRVAK', 'PRVIH', 'PSALM', 'PSETO', 'PTICA', 'PTIĆI', 'PUDER', 'PUDLA', 'PUMPA', 'PUNAC', 'PUPAK', 'PURAN', 'PUSTA', 'PUSTI', 'PUSTO', 'PUŠKA', 'PUTAR', 'PUTER', 'PUTEM', 'PUTNI',
  'RAČUN', 'RADAR', 'RADIO', 'RADNI', 'RAMPA', 'RANAC', 'RAPID', 'RAKET', 'RASIP', 'RASKO', 'RASTU', 'RASTI', 'RATAR', 'RATNI', 'RAVAN', 'RAVNO', 'RAZAN', 'RAZOR', 'RAZUM', 'REBRO', 'REDAR', 'REDNI', 'REKLA', 'REKET', 'REMEN', 'REMET', 'REPER', 'RETRO', 'REZAC', 'REZAR', 'RERNA', 'RIBAR', 'RIJEČ', 'RITAM', 'ROBOT', 'ROČIĆ', 'RODAK', 'RODNI', 'ROKER', 'ROLET', 'ROMAN', 'ROPAC', 'ROTOR', 'RUBAC', 'RUBIN', 'RUČAK', 'RUČKA', 'RUDAR', 'RUDNI', 'RUKAV', 'RUKOM', 'RUMEN', 'RUNDA', 'RURAL', 'RUSKI', 'RUTIN', 'RUŽAN', 'RUŽIN',
  'SABAH', 'SABIR', 'SABOR', 'SAFIR', 'SAHAT', 'SALAT', 'SALDO', 'SALON', 'SAMAC', 'SAMIT', 'SAMBA', 'SANAK', 'SANKE', 'SAPUN', 'SATIR', 'SAVEZ', 'SCENA', 'SEDAM', 'SEDLO', 'SEDRA', 'SEHAR', 'SEKTA', 'SENAT', 'SEPET', 'SERUM', 'SERVO', 'SEVAP', 'SFERA', 'SHEMA', 'SIDRO', 'SIJED', 'SIJEL', 'SILAN', 'SILOS', 'SINOĆ', 'SINOD', 'SIRUP', 'SITAN', 'SITNO', 'SJEDA', 'SJEDI', 'SJEČA', 'SKALA', 'SKALP', 'SKAUT', 'SKELA', 'SKICA', 'SKLAD', 'SKLOP', 'SKORO', 'SLAMA', 'SLANA', 'SLANO', 'SLATI', 'SLAVA', 'SLIKA', 'SLOVA', 'SLOVO', 'SLUGA', 'SLUŠA', 'SLUŽI', 'SMEĐA', 'SMEĐE', 'SMEĐI', 'SMETA', 'SMIJE', 'SMION', 'SMJER', 'SMOLA', 'SMREK', 'SMRTI', 'SNAGA', 'SOBAR', 'SOBNI', 'SOČAN', 'SOFRA', 'SOKAK', 'SOKOL', 'SOLAR', 'SOMUN', 'SONDA', 'SONET', 'SPORT', 'SPORA', 'SPORO', 'SPRAT', 'SPUST', 'SRDAČ', 'SRDIT', 'SREĆA', 'SREDA', 'SREDI', 'STADO', 'STALA', 'STALI', 'STALO', 'STANI', 'STANU', 'STARA', 'STARI', 'STARO', 'STAVI', 'STAZA', 'STEGA', 'STEPA', 'STIĆI', 'STIDU', 'STOKA', 'STOLA', 'STOLU', 'STOPA', 'STRAH', 'STRAN', 'STRIC', 'STROP', 'STRUK', 'STRUN', 'STUBA', 'STUBI', 'STUBO', 'STVAR', 'SUDAR', 'SUHOĆ', 'SUHOM', 'SUKNO', 'SUKOB', 'SUMOR', 'SUNCE', 'SUTON', 'SUTRA', 'SVAĐA', 'SVATO', 'SVETI', 'SVETO', 'SVEZA', 'SVEŽE', 'SVEŽI', 'SVILA', 'SVIMA', 'SVIRA', 'SVITA', 'SVIĆE', 'SVJET', 'SVOTA', 'SVRAB', 'SVRHA',
  'ŠABAN', 'ŠAHOV', 'ŠAJKA', 'ŠAMAC', 'ŠAMAN', 'ŠAMAR', 'ŠANSA', 'ŠAPAT', 'ŠARAC', 'ŠARAF', 'ŠARAN', 'ŠAREN', 'ŠARKA', 'ŠATOR', 'ŠATRA', 'ŠEĆER', 'ŠEHID', 'ŠEKER', 'ŠEPAV', 'ŠERET', 'ŠERIF', 'ŠERPA', 'ŠESTI', 'ŠESTO', 'ŠEŠIR', 'ŠETАČ', 'ŠIBAK', 'ŠIBAT', 'ŠIBIC', 'ŠIPAK', 'ŠIPKA', 'ŠIROK', 'ŠIŠAR', 'ŠIŠAT', 'ŠIŠKE', 'ŠIVAC', 'ŠIVAT', 'ŠKAMP', 'ŠKARE', 'ŠKART', 'ŠKODA', 'ŠKOLA', 'ŠKOTA', 'ŠKRIP', 'ŠKROB', 'ŠKRTI', 'ŠKRTO', 'ŠKUDA', 'ŠKURA', 'ŠMINK', 'ŠPAGA', 'ŠPAJZ', 'ŠPION', 'ŠPRIC', 'ŠTAKA', 'ŠTAMP', 'ŠTAND', 'ŠTAPA', 'ŠTAPI', 'ŠTEDI', 'ŠTEKA', 'ŠTETA', 'ŠTIMA', 'ŠTIPA', 'ŠTITO', 'ŠTOFA', 'ŠTORE', 'ŠTRAJ', 'ŠTRIK', 'ŠTUCA', 'ŠTUKA', 'ŠTULA', 'ŠTURA', 'ŠTURI', 'ŠUBAR', 'ŠUĆUR', 'ŠUGAV', 'ŠUMAR', 'ŠUMOR', 'ŠUNKA', 'ŠUPAK', 'ŠUŠAK', 'ŠUŠKA', 'ŠUŠTA', 'ŠUŠTI', 'ŠUTIO', 'ŠUTIT', 'ŠUTKE', 'ŠVERC',
  'TABAK', 'TABLA', 'TAČKA', 'TAJAN', 'TAJNA', 'TAJNO', 'TAKAV', 'TAKSA', 'TALAC', 'TALAS', 'TALOG', 'TAMAN', 'TAMNO', 'TANGO', 'TANKO', 'TAPET', 'TATAR', 'TATIN', 'TAVAN', 'TEČAJ', 'TEČAN', 'TEČNO', 'TEGLA', 'TEKST', 'TEMPO', 'TENIS', 'TERET', 'TESAR', 'TEŠKA', 'TEŠKE', 'TEŠKI', 'TEŠKO', 'TETKA', 'TETKE', 'TETKI', 'TETKU', 'TIGAR', 'TIKVA', 'TJEME', 'TKIVO', 'TOČAK', 'TOČNO', 'TOKAR', 'TONIK', 'TOPAO', 'TOPLI', 'TOPLO', 'TOPOT', 'TORBA', 'TORTA', 'TOVAR', 'TRAKA', 'TRASA', 'TRAVA', 'TREMA', 'TREĆI', 'TREĆA', 'TRKAČ', 'TRNCI', 'TROFE', 'TROJE', 'TROMO', 'TRSKA', 'TRUBA', 'TRUDI', 'TRULO', 'TUMAČ', 'TUNEL', 'TUZLA',
  'UČENI', 'UČENA', 'UČENO', 'UČITI', 'UDARA', 'UDARI', 'UDICA', 'UGLED', 'UGOST', 'UKRAS', 'UKUSI', 'ULAZI', 'ULICA', 'ULOGE', 'ULOGA', 'ULTRA', 'UNUKA', 'UNUCI', 'UPALA', 'UPADA', 'UPALE', 'UPISA', 'UPITI', 'UPUTA', 'UREDA', 'UREDI', 'URLIK', 'USKOK', 'USMEN', 'USPEH', 'USTAV', 'UTICA', 'UVIJE', 'UVJER', 'UVUĆI', 'UZDAH', 'UZLET', 'UZROK',
  'VAGON', 'VAJAR', 'VAKUF', 'VALOV', 'VALUT', 'VAMPIR', 'VARAT', 'VARKA', 'VAROŠ', 'VATRA', 'VAZDA', 'VAŽAN', 'VAŽNO', 'VEDAR', 'VEDRO', 'VELIK', 'VEPAR', 'VESEO', 'VESLO', 'VESTA', 'VEZAN', 'VEZAT', 'VEZIR', 'VIDAN', 'VIDIK', 'VIDNO', 'VIHOR', 'VIKAT', 'VINAR', 'VIRUS', 'VISAK', 'VISOK', 'VIŠAK', 'VITEZ', 'VITLO', 'VJERA', 'VJEŠT', 'VLAST', 'VOĆAR', 'VOĆKA', 'VOĆNI', 'VODAR', 'VODIČ', 'VODIK', 'VODNI', 'VODOM', 'VOĐEN', 'VOKAL', 'VOLAN', 'VOSAK', 'VOZAČ', 'VOZIL', 'VOZNI', 'VRANA', 'VRATA', 'VRATI', 'VREĆA', 'VRELO', 'VREME', 'VREVA', 'VRSTA', 'VRŠAK', 'VRŠIT', 'VRUĆE', 'VRUĆI', 'VUKOV', 'VUNEN',
  'ZABAT', 'ZABOR', 'ZADAH', 'ZADAT', 'ZAHOD', 'ZAJAM', 'ZAKON', 'ZAKOP', 'ZALAZ', 'ZALET', 'ZALIV', 'ZALOG', 'ZAMAH', 'ZAMIS', 'ZAMKA', 'ZAMOR', 'ZANAT', 'ZANOS', 'ZAPAD', 'ZAPIS', 'ZAPOR', 'ZARAD', 'ZARAZ', 'ZAREZ', 'ZARON', 'ZASAD', 'ZASTO', 'ZAŠTO', 'ZATEČ', 'ZATIM', 'ZATOK', 'ZATON', 'ZATOR', 'ZATRO', 'ZAVEZ', 'ZAVOD', 'ZAVOJ', 'ZAVRŠ', 'ZAZIV', 'ZAZOR', 'ZEBRA', 'ZECEM', 'ZEČIĆ', 'ZELEN', 'ZENIT', 'ZICER', 'ZIDAN', 'ZIDAR', 'ZIJEV', 'ZIMOM', 'ZIMOS', 'ZIMSK', 'ZINUT', 'ZIPKA', 'ZLATO', 'ZNAČI', 'ZNAKA', 'ZNATI', 'ZNOJA', 'ZNOJU', 'ZORAN', 'ZOROM', 'ZRAČI', 'ZRAKA', 'ZRAKU', 'ZRELA', 'ZRELI', 'ZRELO', 'ZRNCE', 'ZUBAR', 'ZUBAT', 'ZUBIĆ', 'ZUBOM', 'ZUBOR', 'ZULUM', 'ZUMBA', 'ZUPCI',
  'ŽABAC', 'ŽALBA', 'ŽALIO', 'ŽALIT', 'ŽALOS', 'ŽAMOR', 'ŽANRA', 'ŽARKO', 'ŽBUKA', 'ŽBUNA', 'ŽBUNI', 'ŽDRAL', 'ŽELIM', 'ŽELIO', 'ŽELIT', 'ŽENIK', 'ŽENIT', 'ŽENKA', 'ŽENOM', 'ŽENSK', 'ŽETON', 'ŽETVA', 'ŽEZLO', 'ŽIDOV', 'ŽILAV', 'ŽILOM', 'ŽIROV', 'ŽITAR', 'ŽITNA', 'ŽITNO', 'ŽIVAL', 'ŽIVIO', 'ŽIVKO', 'ŽIVOT', 'ŽIŽAK', 'ŽUČNA', 'ŽUČNO', 'ŽUDIO', 'ŽUDIT', 'ŽUDNA', 'ŽUDNO', 'ŽUMAN', 'ŽUPAN', 'ŽUPNA', 'ŽUPNI', 'ŽURKA', 'ŽURNA', 'ŽURNO', 'ŽUTAC', 'ŽUTIO', 'ŽUTIT', 'ŽUTKA', 'ŽUTKO'
  ]

export function getDailyWord() {
  const epoch = new Date(2026, 0, 1).getTime();
  const today = new Date().setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - epoch) / (1000 * 60 * 60 * 24));
  const index = Math.abs(diffDays) % BASE_TARGET_WORDS.length;
  return BASE_TARGET_WORDS[index];
}

export function getRandomWord() {
  const index = Math.floor(Math.random() * BASE_TARGET_WORDS.length);
  return BASE_TARGET_WORDS[index];
}

const normalizeWord = word => word.toUpperCase().replace(/\/[A-Z]+$/u, '').trim();

async function downloadDictionary(url, fallbackUrl) {
  const response = await fetch(url)
  if (response.ok) return response.text()
  if (fallbackUrl) {
    const fallbackResponse = await fetch(fallbackUrl)
    if (fallbackResponse.ok) {
      console.warn(`Source returned ${response.status}; using fallback ${fallbackUrl}`)
      return fallbackResponse.text()
    }
  }
  throw new Error(`Download failed (${response.status}): ${url}`)
}

function parseDictionary(text) {
  return text
    .split(/\r?\n/u)
    .slice(1)
    .map(line => normalizeWord(line.split(/\s+/u)[0]))
    .filter(word => /^[A-ZČĆĐŠŽ]{5}$/u.test(word) && !/(LJ|NJ|DŽ)/u.test(word));
}

function renderModule(baseWords, validWords) {
  return `export const BASE_TARGET_WORDS = ${JSON.stringify(baseWords, null, 2)}\n\nexport const TARGET_WORDS = BASE_TARGET_WORDS\n\nexport const VALID_GUESSES = ${JSON.stringify(validWords, null, 2)}\n\nexport function getDailyWord(date = new Date()) {\n  const dateKey = typeof date === 'string' ? date.slice(0, 10) : date.toISOString().slice(0, 10)\n  let hash = 0\n  for (const character of dateKey) hash = (hash * 31 + character.charCodeAt(0)) >>> 0\n  return BASE_TARGET_WORDS[hash % BASE_TARGET_WORDS.length]\n}\n\nexport function getRandomWord() {\n  return BASE_TARGET_WORDS[Math.floor(Math.random() * BASE_TARGET_WORDS.length)]\n}\n`;
}

const dictionaryTexts = await Promise.all([
  downloadDictionary(SOURCES[0]),
  downloadDictionary(SOURCES[1], SERBIAN_FALLBACK),
])
const dictionaryWords = new Set(dictionaryTexts.flatMap(parseDictionary));
const baseWords = [...new Set(CURATED_TARGET_WORDS.map(normalizeWord).filter(word => WORD_PATTERN.test(word) && !FORBIDDEN_DIGRAPHS.test(word)))].sort();
const validWords = [...new Set([...baseWords, ...dictionaryWords])].sort();

await mkdir('src/data', { recursive: true });
await writeFile('src/data/words.js', renderModule(baseWords, validWords), 'utf8');
console.log(`Generated src/data/words.js: ${baseWords.length} target words, ${validWords.length} valid guesses.`);
