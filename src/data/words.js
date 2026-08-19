export const TARGET_WORDS = [
  'MAČKA', 'ŠKOLA', 'RUKAV', 'TRAVA', 'SOKAK', 'VITAR', 'ČORBA', 'ŽIVOT', 'HLJEB', 'KORPA',
  'VRATA', 'PTIĆI', 'PAZAR', 'DUĆAN', 'ŠLJEM', 'LIMUN', 'ORAHA', 'ORASI', 'GROZD', 'BADEM',
  'MEDOM', 'SIROM', 'MESOM', 'RIBOM', 'SUPOM', 'GRAHA', 'SOMUN', 'KOLAČ', 'TORTA', 'ŠEĆER',
  'ULJEM', 'VODOM', 'KAFOM', 'ČAJEM', 'SOKOM', 'VINOM', 'PIVOM', 'ČAŠOM', 'STOLA', 'KLUPA',
  'KUĆOM', 'ZIDOM', 'PODOM', 'KROVU', 'BRAVA', 'KLJUČ', 'LAMPA', 'SATOM', 'TORBA', 'GLAVA',
  'RUKOM', 'NOGOM', 'SRCEM', 'DUŠOM', 'OČIMA', 'KOSOM', 'UŠIMA', 'KRILO', 'SUNCE', 'SUNCA',
  'OBLAK', 'KIŠOM', 'MOREM', 'POLJE', 'LISTA', 'GRANA', 'KAMEN', 'VATRA', 'DIMOM', 'ZRAKU',
  'PTICA', 'KONJA', 'KRAVA', 'OVCOM', 'KOZOM', 'ZECEM', 'PČELA', 'MUHOM', 'GRADU', 'PUTEM',
  'MOSTA', 'PARKU', 'TRGOM', 'SELOM', 'CRKVA', 'ŠTAND', 'KIOSK', 'IGRAM', 'PRIČA', 'SLIKA',
  'BOJOM', 'PLESA', 'SUZOM', 'NADOM', 'JUTRO', 'JESEN', 'APRIL', 'ZIMOM', 'LJETO', 'DANOM',
  'VEČER', 'SEDAM', 'BRZOM', 'SREĆA', 'MISLI', 'SANOM', 'MIRNO', 'ZDRAV', 'MLADI', 'NOVOM',
  'DOBAR', 'PONOS', 'SMIJE', 'IGRAČ', 'PJEVU', 'RADOS', 'ISTOM', 'SRDAČ', 'TAJNA', 'MUDRA'
]

const ADDITIONAL_GUESSES = [
  'ABECE', 'ADRES', 'AKORD', 'ALARM', 'ALEJA', 'AMBAR', 'ANĐEO', 'ARENA', 'AVION', 'BAJKA',
  'BAKAR', 'BALON', 'BANJA', 'BARKE', 'BAŠTA', 'BISER', 'BLAGO', 'BLATO', 'BOGAT', 'BORBA',
  'BOSNA', 'BUBAN', 'BUKVA', 'BUNAR', 'BUREK', 'BURMA', 'CESTA', 'CIGLA', 'CIMET', 'ČEKIĆ',
  'ČESMA', 'ČETKA', 'ČIZMA', 'ČEŠAL', 'ČUVAR', 'ĆILIM', 'DASKA', 'DATUM', 'DOLJE', 'DOMAĆ',
  'DROGA', 'DRVCE', 'DRVEN', 'DRŽAV', 'DUGME', 'DUNJA', 'DVORI', 'EKIPA', 'ELITA', 'FARMA',
  'FOTKA', 'FRULA', 'GLINA', 'GLUMA', 'GOLUB', 'GOSTI', 'GRUDI', 'GUSKA', 'HALOM', 'HARFA',
  'HITAC', 'HRANA', 'HRABR', 'IKONA', 'IMENA', 'ISKRA', 'ISTOK', 'IZBOR', 'IZLET', 'JAGOD',
  'JAKNA', 'JANJE', 'JAVOR', 'JEDRO', 'KANTA', 'KARTA', 'KEDER', 'KESOM', 'KISEO', 'KISTA',
  'KOCKA', 'KORAL', 'KORAK', 'KOSAC', 'KOSTI', 'KOTAO', 'KRAJA', 'KRILA', 'KRUNA', 'KUHAR',
  'KUMOM', 'LADAN', 'LANAC', 'LAŽAN', 'LEDEN', 'LEPTI', 'LISAC', 'LOPTA', 'LOVAC', 'LUČAN',
  'LUKOM', 'MAGLA', 'MAJKA', 'MAJUS', 'MAKAZ', 'MALIN', 'MANIR', 'MEDAL', 'MEĐAS', 'MESAR',
  'METAL', 'MLADA', 'MODAL', 'MOLIT', 'MOSTI', 'MRAVA', 'MREŽA', 'NAUKA', 'NEBOM', 'NOGAR',
  'NOSAČ', 'OBALA', 'OBAVE', 'OBRAZ', 'OGLAS', 'OKUSI', 'OLOVO', 'ORALA', 'MEĐOM', 'OTKUC',
  'OTVOR', 'PALAC', 'PAMET', 'PAPIR', 'PARAM', 'PARKA', 'PASUL', 'PETAK', 'PILAD', 'PILOT',
  'PISAC', 'PLOČA', 'PORUK', 'POSAO', 'POTKA', 'PRAGO', 'PRVOM', 'PREMA', 'RADAR', 'RADOM',
  'RAKET', 'RAMEN', 'RAZVO', 'REPOM', 'RODIT', 'ROSA', 'SANAC', 'SANJA', 'SATOR', 'SESTR',
  'SOLAR', 'SONAR', 'SPAVA', 'STAZA', 'STRAH', 'STRUN', 'SVILA', 'ŠARAF', 'ŠAREN', 'ŠEŠIR',
  'ŠINA', 'ŠTETA', 'ŠTIT', 'TABAK', 'TALAS', 'TIGAR', 'TOČAK', 'TRAKA', 'TRUBA', 'UČENI',
  'UKUSI', 'ULOGA', 'VAGA', 'VALOV', 'VESEL', 'VEZA', 'VIDLO', 'VODAR', 'VOLAN', 'VOZAČ',
  'ZABAVA', 'ZAMOR', 'ZAPIS', 'ZARAD', 'ZELEN', 'ZIDAR', 'ZLATO', 'ZORAN', 'ŽABA', 'ŽALOS'
]

export const VALID_GUESSES = [...new Set([...TARGET_WORDS, ...ADDITIONAL_GUESSES.slice(0, 150)])]

export function getDailyWord(date = new Date()) {
  const dateKey = typeof date === 'string'
    ? date.slice(0, 10)
    : date.toISOString().slice(0, 10)

  let hash = 0
  for (const character of dateKey) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }

  return TARGET_WORDS[hash % TARGET_WORDS.length]
}
