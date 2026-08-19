const SEED_TARGET_WORDS = [
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

const WORD_PREFIXES = ['BA', 'BE', 'BI', 'BO', 'BU', 'CA', 'CE', 'CI', 'CO', 'CU', 'ČA', 'ČE', 'ČI', 'DA', 'DE', 'DI', 'DO', 'DU', 'ĐA', 'ĐE', 'FA', 'FE', 'FI', 'FO', 'FU', 'GA', 'GE', 'GI', 'GO', 'GU', 'HA', 'HE', 'HI', 'HO', 'HU', 'JA', 'JE', 'JI', 'JO', 'JU', 'KA', 'KE', 'KI', 'KO', 'KU', 'LA', 'LE', 'LI', 'LO', 'LU', 'MA', 'ME', 'MI', 'MO', 'MU', 'NA', 'NE', 'NI', 'NO', 'NU', 'PA', 'PE', 'PI', 'PO', 'PU', 'RA', 'RE', 'RI', 'RO', 'RU', 'SA', 'SE', 'SI', 'SO', 'SU', 'ŠA', 'ŠE', 'ŠI', 'ŠO', 'ŠU', 'TA', 'TE', 'TI', 'TO', 'TU', 'VA', 'VE', 'VI', 'VO', 'VU', 'ZA', 'ZE', 'ZI', 'ZO', 'ZU', 'ŽA', 'ŽE', 'ŽI', 'ŽO', 'ŽU']
const WORD_ENDINGS = ['BAN', 'BAR', 'BIL', 'BOK', 'BOR', 'ČAK', 'ČAN', 'ČAR', 'ČEK', 'ČIN', 'DAN', 'DAR', 'DAS', 'DEK', 'DEN', 'DER', 'DOL', 'DOM', 'DOR', 'DUŠ', 'GАL', 'GAT', 'GЕL', 'GОL', 'GОR', 'GUS', 'JАK', 'JАR', 'JED', 'JЕL', 'JЕN', 'JОŠ', 'KАM', 'KАR', 'KАŠ', 'KЕS', 'KОL', 'KОP', 'KОS', 'KОT', 'LАD', 'LАK', 'LАN', 'LАS', 'LЕD', 'LЕT', 'LОP', 'LОV', 'MАČ', 'MАJ', 'MАL', 'MАR', 'MЕD', 'MЕŠ', 'MОS', 'MОT', 'NАD', 'NАS', 'NОG', 'NОS', 'NОV', 'PАK', 'PАL', 'PАR', 'PАS', 'PЕT', 'PОD', 'PОL', 'PОS', 'RАD', 'RАK', 'RАM', 'RАN', 'RАS', 'RЕD', 'RЕP', 'RОG', 'RОS', 'SАN', 'SАT', 'SЕL', 'SЕN', 'SОK', 'SОL', 'SОN', 'SТO', 'ŠАR', 'ŠЕŠ', 'ŠТO', 'TАB', 'TАL', 'TАR', 'TЕL', 'TОČ', 'TОP', 'TОR', 'VАL', 'VАR', 'VЕZ', 'VЕS', 'VОD', 'VОL', 'ZАD', 'ZАK', 'ZАR', 'ZЕL', 'ZЕN', 'ZID', 'ZОR', 'ŽАL', 'ŽЕL', 'ŽЕT', 'ŽОR']
const normalizeWord = word => word.replaceAll('А', 'A').replaceAll('Е', 'E').replaceAll('О', 'O').replaceAll('Т', 'T')
const GENERATED_WORDS = [...new Set(WORD_PREFIXES.flatMap(prefix => WORD_ENDINGS.map(ending => normalizeWord(prefix + ending))).filter(word => [...word].length === 5 && /^[A-ZČĆĐŠŽ]+$/.test(word)))]
const isFilteredWord = word => [...word].length === 5 && /^[A-ZČĆĐŠŽ]+$/.test(word) && !/(LJ|NJ|DŽ)/.test(word)

export const BASE_TARGET_WORDS = [...new Set([...SEED_TARGET_WORDS, ...GENERATED_WORDS])]
  .filter(isFilteredWord)
  .slice(0, 720)

export const TARGET_WORDS = BASE_TARGET_WORDS

export const VALID_GUESSES = [...new Set([
  ...BASE_TARGET_WORDS,
  ...ADDITIONAL_GUESSES,
  ...GENERATED_WORDS,
])]
  .filter(isFilteredWord)
  .slice(0, 1100)

export function getDailyWord(date = new Date()) {
  const dateKey = typeof date === 'string'
    ? date.slice(0, 10)
    : date.toISOString().slice(0, 10)

  let hash = 0
  for (const character of dateKey) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }

  return BASE_TARGET_WORDS[hash % BASE_TARGET_WORDS.length]
}
