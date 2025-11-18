// frontend/src/components/warnings/enhanced/steps/components/MultiLanguageWarningScript.tsx
// 🌍 MULTI-LANGUAGE WARNING SCRIPT - ALL 11 SA OFFICIAL LANGUAGES
// ✅ Comprehensive conversational script covering all employee rights and witness procedures

import React, { useState } from 'react';
import { Volume2, Globe, Check, Users, FileText, Clock } from 'lucide-react';

interface MultiLanguageWarningScriptProps {
  employeeName: string;
  managerName: string;
  categoryName: string;
  incidentDescription: string;
  warningLevel: string;
  validityPeriod: 3 | 6 | 12; // months
  onScriptRead: () => void;
  disabled?: boolean;
  activeWarnings?: any[]; // Previous warnings for recitation
  issuedDate?: Date | string; // For consequences section
}

// 🏴󠁺󠁡󠁺󠁡󠁿 SOUTH AFRICAN OFFICIAL LANGUAGES
const SA_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa' },
  { code: 'st', name: 'Sotho', nativeName: 'Sesotho' },
  { code: 'ts', name: 'Tsonga', nativeName: 'Xitsonga' },
  { code: 've', name: 'Venda', nativeName: 'Tshivenda' },
  { code: 'ss', name: 'Swati', nativeName: 'siSwati' },
  { code: 'tn', name: 'Tswana', nativeName: 'Setswana' },
  { code: 'nr', name: 'Ndebele', nativeName: 'isiNdebele' },
  { code: 'ns', name: 'Northern Sotho', nativeName: 'Sepedi' }
];

// 🏷️ WARNING LEVEL TRANSLATIONS IN ALL LANGUAGES
const WARNING_LEVEL_TRANSLATIONS = {
  en: {
    counselling: 'Counselling Session',
    verbal: 'Verbal Warning',
    first_written: 'Written Warning',
    second_written: 'Second Written Warning',
    final_written: 'Final Written Warning'
  },
  af: {
    counselling: 'Beradingsessie',
    verbal: 'Mondelinge Waarskuwing',
    first_written: 'Eerste Geskrewe Waarskuwing',
    second_written: 'Tweede Geskrewe Waarskuwing',
    final_written: 'Finale Geskrewe Waarskuwing'
  },
  zu: {
    counselling: 'Iseshini Yokweluleka',
    verbal: 'Isexwayiso Ngomlomo',
    first_written: 'Isexwayiso Sokuqala Esibhaliwe',
    second_written: 'Isexwayiso Sesibili Esibhaliwe',
    final_written: 'Isexwayiso Sokugcina Esibhaliwe'
  },
  xh: {
    counselling: 'Iseshoni Yokucebisa',
    verbal: 'Isilumkiso Ngomlomo',
    first_written: 'Isilumkiso Sokuqala Esibhaliweyo',
    second_written: 'Isilumkiso Sesibini Esibhaliweyo',
    final_written: 'Isilumkiso Sokugqibela Esibhaliweyo'
  },
  st: {
    counselling: 'Seboka sa Keletso',
    verbal: 'Temoso ya Molomo',
    first_written: 'Temoso ya Pele e Ngotsweng',
    second_written: 'Temoso ya Bobedi e Ngotsweng',
    final_written: 'Temoso ya ho Qetela e Ngotsweng'
  },
  ts: {
    counselling: 'Nkarhi wo Tivonela',
    verbal: 'Xilumkiso xa Marito',
    first_written: 'Xilumkiso xa Sinthoma xa Ku Tsariwa',
    second_written: 'Xilumkiso xa Vumbirhi xa Ku Tsariwa',
    final_written: 'Xilumkiso xa Makumu xa Ku Tsariwa'
  },
  ve: {
    counselling: 'Tshikhala tsha Themendelo',
    verbal: 'Tivhiso ya Ipfi',
    first_written: 'Tivhiso ya u Thoma yo Ṅwalwaho',
    second_written: 'Tivhiso ya vhuvhili yo Ṅwalwaho',
    final_written: 'Tivhiso ya u Fhedzisela yo Ṅwalwaho'
  },
  ss: {
    counselling: 'Seshoni Sekululeleka',
    verbal: 'Sixwayiso Ngemlomo',
    first_written: 'Sixwayiso Sekucala Lesibhaliwe',
    second_written: 'Sixwayiso Sesibili Lesibhaliwe',
    final_written: 'Sixwayiso Sekugcina Lesibhaliwe'
  },
  tn: {
    counselling: 'Khuduthamaga ya Kgakololo',
    verbal: 'Temoso ya Molomo',
    first_written: 'Temoso ya Ntlha e e Kwadilweng',
    second_written: 'Temoso ya Bobedi e e Kwadilweng',
    final_written: 'Temoso ya Bofelo e e Kwadilweng'
  },
  nr: {
    counselling: 'Iseshini Yokululeleka',
    verbal: 'Isixwayiso Ngomlomo',
    first_written: 'Isixwayiso Sokuqala Esibhaliwe',
    second_written: 'Isixwayiso Sesibili Esibhaliwe',
    final_written: 'Isixwayiso Sokugcina Esibhaliwe'
  },
  ns: {
    counselling: 'Kopano ya Keletšo',
    verbal: 'Temošo ya Molomo',
    first_written: 'Temošo ya Pele yeo e Ngwadilwego',
    second_written: 'Temošo ya Bobedi yeo e Ngwadilwego',
    final_written: 'Temošo ya Mafelelo yeo e Ngwadilwego'
  }
} as const;

// Helper function to get translated warning level
const getWarningLevelTranslation = (level: string, language: keyof typeof WARNING_SCRIPTS): string => {
  const levelKey = level.toLowerCase().replace(/ /g, '_') as keyof typeof WARNING_LEVEL_TRANSLATIONS.en;
  const translations = WARNING_LEVEL_TRANSLATIONS[language];
  return translations[levelKey] || level;
};

// Helper function to format dates consistently
const formatDate = (date: Date | string | any): string => {
  if (!date) return 'Unknown Date';

  let dateObj: Date;
  if (date.seconds !== undefined) {
    // Firestore Timestamp
    dateObj = new Date(date.seconds * 1000);
  } else if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    return 'Unknown Date';
  }

  return dateObj.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Helper function to format previous warnings list
const formatWarningsList = (warnings: any[] | undefined): Array<{ date: string; offense: string; level: string }> => {
  if (!warnings || warnings.length === 0) return [];

  return warnings.map(w => ({
    date: formatDate(w.issuedDate || w.issueDate),
    offense: w.categoryName || w.category || 'General Misconduct',
    level: w.level || w.warningLevel || 'verbal'
  }));
};

// 📝 WARNING SCRIPTS IN ALL 11 OFFICIAL LANGUAGES
const WARNING_SCRIPTS = {
  // 🇬🇧 ENGLISH - Primary/Default
  en: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, this meeting is to formalize the written warning for the workplace incident we discussed.`,

    incident: (categoryName: string, description: string) =>
      `Charge: ${categoryName}. Details: ${description}. This behavior violates our workplace policies and must stop immediately.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `This is a ${level}. It remains on your record for ${validityPeriod} months. You must demonstrate immediate and sustained improvement.`,

    previousWarningsRecitation: (warnings: Array<{ date: string; offense: string; level: string }>) =>
      warnings.length > 0
        ? `You have ${warnings.length} previous warning${warnings.length > 1 ? 's' : ''} still valid on file: ${warnings.map((w, i) => `${i + 1}) Date: ${w.date}, Offense: ${w.offense}, Level: ${w.level}`).join('. ')}.`
        : "You have no previous disciplinary action on file.",

    consequencesStatement: (issueDate: string) =>
      `Further misconduct will result in additional discipline, including formal hearings, up to ending of service. All unexpired warnings accumulate.`,

    rights: () =>
      "Your rights under the Labour Relations Act:",

    rightsList: () => [
      "You may appeal to HR in writing within 48 hours.",
      "You may have a fellow employee or shop steward represent you.",
      "Further misconduct during the validity period may result in additional discipline, up to ending of service."
    ],

    witnessOption: () =>
      "Your signature confirms you understand this warning and your rights - not that you agree with it. If you refuse to sign, a witness will confirm the warning was explained. The warning is valid either way.",

    questions: () =>
      "Do you have any questions about this warning or your rights?",

    closing: () =>
      "We will now collect signatures. Immediate improvement is required."
  },

  // 🇿🇦 AFRIKAANS
  af: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, hierdie vergadering is om die skriftelike waarskuwing te formaliseer vir die werkplek incident wat ons bespreek het.`,

    incident: (categoryName: string, description: string) =>
      `Aanklag: ${categoryName}. Besonderhede: ${description}. Hierdie gedrag oortree ons werkplek beleide en moet onmiddellik stop.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `Dit is 'n ${level}. Dit bly op jou rekord vir ${validityPeriod} maande. Jy moet onmiddellike en volgehoue verbetering toon.`,

    previousWarningsRecitation: (warnings: Array<{ date: string; offense: string; level: string }>) =>
      warnings.length > 0
        ? `Jy het ${warnings.length} vorige waarskuwing${warnings.length > 1 ? 's' : ''} nog geldig op lêer: ${warnings.map((w, i) => `${i + 1}) Datum: ${w.date}, Oortreding: ${w.offense}, Vlak: ${w.level}`).join('. ')}.`
        : "Jy het geen vorige dissiplinêre aksie op lêer nie.",

    consequencesStatement: (issueDate: string) =>
      `Verdere wangedrag sal lei tot addisionele dissipline, insluitend formele verhore, tot beëindiging van diens. Alle onverstreke waarskuwings akkumuleer.`,

    rights: () =>
      "Jou regte onder die Wet op Arbeidsverhoudinge:",

    rightsList: () => [
      "Jy mag binne 48 uur skriftelik by HR appelieer.",
      "Jy mag 'n mede-werknemer of vakbondverteenwoordiger hê om jou te verteenwoordig.",
      "Verdere wangedrag gedurende die geldigheidsperiode kan lei tot addisionele dissipline, tot beëindiging van diens."
    ],

    witnessOption: () =>
      "Jou handtekening bevestig dat jy hierdie waarskuwing en jou regte verstaan - nie dat jy daarmee saamstem nie. As jy weier om te teken, sal 'n getuie bevestig dat die waarskuwing verduidelik is. Die waarskuwing is beide kante geldig.",

    questions: () =>
      "Het jy enige vrae oor hierdie waarskuwing of jou regte?",

    closing: () =>
      "Ons sal nou handtekeninge versamel. Onmiddellike verbetering word vereis."
  },

  // 🏴󠁺󠁡󠁺󠁵󠁿 ZULU - isiZulu
  zu: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, le mihlangano iwukuqinisa isixwayiso esibhaliwe ngesigameko somsebenzi esasixoxayo.`,

    incident: (categoryName: string, description: string) =>
      `Icala: ${categoryName}. Imininingwane: ${description}. Lokhu kuziphatha kuphula izinqubomgomo zethu zomsebenzi futhi kumele kume masinyane.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `Lesi isixwayiso se-${level}. Sihlala kumarekhodi akho izinyanga ezingu-${validityPeriod}. Kumele ubonise ukuthuthuka okusheshayo nokuqhubekayo.`,

    previousWarningsRecitation: (warnings: Array<{ date: string; offense: string; level: string }>) =>
      warnings.length > 0
        ? `Unezixwayiso ezingu-${warnings.length} ezidlule ezisasebenza efayeleni: ${warnings.map((w, i) => `${i + 1}) Usuku: ${w.date}, Icala: ${w.offense}, Izinga: ${w.level}`).join('. ')}.`
        : "Awunayo imithetho yokuqeqesha yangaphambilini efayeleni.",

    consequencesStatement: (issueDate: string) =>
      `Ukuziphatha okubi okwengeziwe kuzoholela esinyweni esinye, kufaka phakathi izinkundla ezisemthethweni, kuya ekuphethweni kwenkonzo. Zonke izixwayiso ezingaphelelanga ziyaqoqeka.`,

    rights: () =>
      "Amalungelo akho ngaphansi koMthetho Wobudlelwano Basebenzi:",

    rightsList: () => [
      "Ungaphikisa ku-HR ngokubhaliwe ngamahora angu-48.",
      "Ungaba nomsebenzi ofana nawe noma ummeleli wenyunyana ukuthi akumele.",
      "Ukuziphatha okubi okwengeziwe ngesikhathi sokuqiniseka kungase kuholele esinyweni esinye, kuya ekuphethweni kwenkonzo."
    ],

    witnessOption: () =>
      "Ukusayina kwakho kuqinisekisa ukuthi uyaqonda lesi sixwayiso namalungelo akho - hhayi ukuthi uyavuma. Uma wenqaba ukusayina, ufakazi uzoqinisekisa ukuthi isixwayiso sichaziwe. Isixwayiso sisebenza ngazo zombili izindlela.",

    questions: () =>
      "Ingabe unemibuzo ngalesi sixwayiso noma amalungelo akho?",

    closing: () =>
      "Manje sizoqoqa izimo zokusayina. Ukuthuthuka okusheshayo kuyadingeka."
  },

  // 🏴󠁺󠁡󠁸󠁨󠁿 XHOSA - isiXhosa
  xh: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, le ntlanganiso ikuqinisekisa isilumkiso esibhaliweyo ngesiganeko emsebenzini esasixoxayo.`,

    incident: (categoryName: string, description: string) =>
      `Ityala: ${categoryName}. Iinkcukacha: ${description}. Oku kuziphatha kuphula imigaqo-nkqubo yethu yomsebenzi kwaye kufuneka kuyeke ngokukhawuleza.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `Esi yisilumkiso se-${level}. Sihlala kwiirekhodi zakho iinyanga ezingu-${validityPeriod}. Kufuneka ubonise uphuculo olukhawulezayo noluqhubekayo.`,

    previousWarningsRecitation: (warnings: Array<{ date: string; offense: string; level: string }>) =>
      warnings.length > 0
        ? `Unezilumkiso ezingu-${warnings.length} zangaphambili ezisefayileni: ${warnings.map((w, i) => `${i + 1}) Umhla: ${w.date}, Ityala: ${w.offense}, Inqanaba: ${w.level}`).join('. ')}.`
        : "Akukho manyathelo okulungisa angaphambili kwifayile.",

    consequencesStatement: (issueDate: string) =>
      `Ukuziphatha okubi okongezelelweyo kuya kubangela ukulungiswa okongezelelweyo, kubandakanya iindibano ezisemthethweni, ukuya ekupheliseni kwenkonzo. Zonke izilumkiso ezingaphelelwanga ziyaqokelelana.`,

    rights: () =>
      "Amalungelo akho phantsi koMthetho woBudlelwane baBasebenzi:",

    rightsList: () => [
      "Ungabhena kwi-HR ngokubhaliwe kwiiyure ezingama-48.",
      "Ungaba nomsebenzi ofana nawe okanye ummeli wemanyano ukuba akumele.",
      "Ukuziphatha okubi okongezelelweyo ngexesha lokuqinisekiswa kunokubangela ukulungiswa okongezelelweyo, ukuya ekupheliseni kwenkonzo."
    ],

    witnessOption: () =>
      "Utyikityo lwakho luqinisekisa ukuba uyaqonda esi silumkiso namalungelo akho - hayi ukuba uyavuma. Ukuba ukhaba ukusayina, ingqina iya kuqinisekisa ukuba isilumkiso sichaziwe. Isilumkiso sisebenza ngazo zombini iindlela.",

    questions: () =>
      "Ingaba unemibuzo ngesi silumkiso okanye amalungelo akho?",

    closing: () =>
      "Ngoku siya kuqokelela iityikityo. Uphuculo olukhawulezayo luyafuneka."
  },

  // 🏴󠁺󠁡󠁳󠁴󠁿 SOTHO - Sesotho
  st: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, kopano ena ke ho tiisa temoso e ngotsoeng ka ketsahalo ea mosebetsi eo re e buisaneng.`,

    incident: (categoryName: string, description: string) =>
      `Lengolo: ${categoryName}. Lintlha: ${description}. Boitshwaro bona bo senya dipholisi tsa rona tsa mosebetsi 'me bo tlameha ho ema hang-hang.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `Ena ke temoso ea ${level}. E lula lirekoting tsa hao likhoeli tse ${validityPeriod}. O tlameha ho bonts'a ntlafatso e potlakileng le e tsoelang pele.`,

    previousWarningsRecitation: (warnings: Array<{ date: string; offense: string; level: string }>) =>
      warnings.length > 0
        ? `O na le litemoso tse ${warnings.length} tsa pele tse sa ntse li sebetsa faeleng: ${warnings.map((w, i) => `${i + 1}) Letsatsi: ${w.date}, Lengolo: ${w.offense}, Boemo: ${w.level}`).join('. ')}.`
        : "Ha o na litemoso tsa kgetho ea pele faeleng.",

    consequencesStatement: (issueDate: string) =>
      `Boitshwaro bo bobe bo eketsehileng bo tla fella ka kgetho e eketsehileng, ho kenyelletsa lipuisano tsa semolao, ho fihla feteletsong ea ts'ebeletso. Litemoso tsohle tse sa felang li bokellana.`,

    rights: () =>
      "Litokelo tsa hao ka tlasa Molao oa Likamano tsa Basebetsi:",

    rightsList: () => [
      "O ka ipeela ho HR ka ho ngola ka mora dihora tse 48.",
      "O ka ba le mosebetsi ea tšoanang le uena kapa moemeli oa kesara ho u emela.",
      "Boitshwaro bo bobe bo eketsehileng nakong ea nako ea netefatso bo ka hlahisa kgetho e eketsehileng, ho fihla feteletsong ea ts'ebeletso."
    ],

    witnessOption: () =>
      "Saeno ea hao e tiisa hore o utloisisa temoso ena le litokelo tsa hao - eseng hore o lumela. Haeba o hana ho saena, paki e tla tiisa hore temoso e hlalositsoe. Temoso e sebetsa ka tsela ka bobeli.",

    questions: () =>
      "Na o na le lipotso ka temoso ena kapa litokelo tsa hao?",

    closing: () =>
      "Joale re tla bokella mesaeno. Ntlafatso e potlakileng e hlokahala."
  },

  // 🏴󠁺󠁡󠁴󠁳󠁿 TSONGA - Xitsonga
  ts: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, nhlanganiso lowu i ku tiyisa xilumkiso lexi tsariweke xa xivangelo xa ntirho lexi hi xi burisaneke.`,

    incident: (categoryName: string, description: string) =>
      `Nyungulo: ${categoryName}. Swileriso: ${description}. Mavanyiselo lawa ma tyela tipholisi ta hina ta ntirho naswona ma fanele ku yima hi ku hatlisa.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `Lexi i xilumkiso xa ${level}. Xi tshama eka rhekhodo ya wena tin'hweti ta ${validityPeriod}. U fanele ku kombisa ku antswisa loku hatlisaka ni loku ya emahlweni.`,

    previousWarningsRecitation: (warnings: Array<{ date: string; offense: string; level: string }>) =>
      warnings.length > 0
        ? `U na swilumkiso swa ${warnings.length} swa khale leswi nga ha tirhaka eka fayili: ${warnings.map((w, i) => `${i + 1}) Siku: ${w.date}, Nyungulo: ${w.offense}, Mpimo: ${w.level}`).join('. ')}.`
        : "A wu na swiyimo swa ndzulavulo swa khale eka fayili.",

    consequencesStatement: (issueDate: string) =>
      `Mavanyiselo yo biha lama engetelekeke ma ta fana ni ndzulavulo wo engetela, ku katsa swinghenelo swa nawu, ku ya eka ku herisiwa ka vutirheri. Swilumkiso hinkwaswo leswi nga heli swi hlengeletiwa.`,

    rights: () =>
      "Timfanelo ta wena hi ka tlhelo ka Nawu wa Vuhlanganisi bya Vatirhi:",

    rightsList: () => [
      "U nga appila eka HR hi ku tsala hi nkarhi wa tawa ta 48.",
      "U nga va ni mutirhimutsongo wa n'wina kumbe muemimuhlangani leswaku a ku yimela.",
      "Mavanyiselo yo biha lama engetelekeke eka nkarhi wa ku tiyisisa ma nga endla ndzulavulo wo engetela, ku ya eka ku herisiwa ka vutirheri."
    ],

    witnessOption: () =>
      "Vusayini bya wena byi tiyisisa leswaku u twisisa xilumkiso lexi ni timfanelo ta wena - ku nga ri leswaku u pfumela. Loko u vavisa ku sayini, nhlamulo a nga tiyisisa leswaku xilumkiso xi hlamuseriwile. Xilumkiso xi tirhaka hi tindlela hinkwato.",

    questions: () =>
      "Xana u na swivutiso hi xilumkiso lexi kumbe timfanelo ta wena?",

    closing: () =>
      "Sweswi hi ta hlengeleta vusayini. Ku antswisa loku hatlisaka ku laveka."
  },
  // 🏴󠁺󠁡󠁶󠁥󠁿 VENDA - Tshivenda
  ve: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, iyi meetingi ndi ya u tiyisedza tivhiso yo ṅwalwaho nga ha zwithu zwa mushumo zwine ra zwi amba.`,

    incident: (categoryName: string, description: string) =>
      `Mulandu: ${categoryName}. Vhubvo: ${description}. Maitele aya a tyela mipholisi yashu ya mushumo nahone a tea u ima zwino-zwino.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `Iyi ndi tivhiso ya ${level}. I dzula kha rekhodho yavho minwedzi ya ${validityPeriod}. No tea u kombedza u khwinisa ha u tavhanya na u fhiraho phanḓa.`,

    previousWarningsRecitation: (warnings: Array<{ date: string; offense: string; level: string }>) =>
      warnings.length > 0
        ? `No na tivhiso dza ${warnings.length} dza khale dzine dza kha shuma kha fayili: ${warnings.map((w, i) => `${i + 1}) Datumu: ${w.date}, Mulandu: ${w.offense}, Vhusedzi: ${w.level}`).join('. ')}.`
        : "A huna zwiga zwa mulandu wa khale kha fayili.",

    consequencesStatement: (issueDate: string) =>
      `Maitele a si zwavhuḓi ano engedziwa o ḓo vha ni mulandu wo engedzeaho, hu tshi katelwa migoro ya mulayo, u swika kha u fhedza ha mushumo. Tivhiso dzoṱhe dzi songo fhela dzi a kuvhanganya.`,

    rights: () =>
      "Pfanelo dzavho kha fhasi ha Mulayo wa Vhushaka ha Vhashumi:",

    rightsList: () => [
      "No nga appela kha HR hu tshi ṅwalwa nga tshifhinga tsha awara dza 48.",
      "No nga vha na mushumi wa zwiambaro kana muvhuyeli wa shango u ni ṱuṱuwedza.",
      "Maitele a si zwavhuḓi ano engedziwa nga tshifhinga tsha u tiyisedza zwi nga khwinisa mulandu wo engedzeaho, u swika kha u fhedza ha mushumo."
    ],

    witnessOption: () =>
      "U saena havho zwi tiyisedza uri no pfesesa iyi tivhiso na pfanelo dzavho - zwi si uri no tendelana. Arali no nanga u si saini, muhumbeli o do tiyisedza uri tivhiso yo talutshedzelwa. Tivhiso i shuma nga ndila dzoṱhe.",

    questions: () =>
      "Vho na mbudziso nga ha iyi tivhiso kana pfanelo dzavho?",

    closing: () =>
      "Zwino ro do kuvhanganya masaena. U khwinisa ha u tavhanya hu a tea."
  },
  // 🏴󠁺󠁡󠁳󠁳󠁿 SWATI - siSwati
  ss: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, loluhlangano ngalokucinisekisa sixwayiso lesibhaliwe ngesehlo lemsebenzi lesakhulumako.`,

    incident: (categoryName: string, description: string) =>
      `Licala: ${categoryName}. Tincukacha: ${description}. Loku kutiphatsa kuhlubuka nephalisinkomba yaletfu yemsebenzi futhi kumele kume masinyane.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `Lesi yisixwayiso se-${level}. Sihlala emarekhodini akho etinyanga letingu-${validityPeriod}. Kumele ubonise kuntfula lokushesha nekucondzaphambili.`,

    previousWarningsRecitation: (warnings: Array<{ date: string; offense: string; level: string }>) =>
      warnings.length > 0
        ? `Unetixwayiso letingu-${warnings.length} letekadze letisasebenta kufayela: ${warnings.map((w, i) => `${i + 1}) Lusuku: ${w.date}, Licala: ${w.offense}, Libanga: ${w.level}`).join('. ')}.`
        : "Awunato tilajiso tetekadze kufayela.",

    consequencesStatement: (issueDate: string) =>
      `Kutiphatsa lokubi lokucondzako kutawuholela kulajiswa lokucondzako, kufaka ekhatsi emhlangano wesemtsetfweni, kuya ekuphetseni kwemsebenzi. Tonkhe tixwayiso letingapheli tiyabutana.`,

    rights: () =>
      "Emalungelo akho ngansi kweMtsetfo weTinhlangano teTisebenzi:",

    rightsList: () => [
      "Ungaphikisana ku-HR ngekubhalwa ngetikhatsi tetinshintfu tange-48.",
      "Ungaba nemsebenzi lofana nawe noma umemeti welihlangano kutsi akumele.",
      "Kutiphatsa lokubi lokucondzako ngelesikhatsi lekucincisekisa kungase kuholele kulajiswa lokucondzako, kuya ekuphetseni kwemsebenzi."
    ],

    witnessOption: () =>
      "Kusayina kwakho kucincisekisa kutsi uyatizwa lesixwayiso nemalungelo akho - kusho nje kutsi uyavuma. Uma ukhetsa kungasayini, umfakazi utawucincisekisa kutsi sixwayiso sichaziwe. Sixwayiso sisebenta ngatindzlela tonkhe.",

    questions: () =>
      "Ingabe unemibuto ngalesi sixwayiso noma emalungelo akho?",

    closing: () =>
      "Manje sitawutfola kusayina. Kuntfula lokushesha kuyadingeka."
  },
  // 🏴󠁺󠁡󠁴󠁮󠁿 TSWANA - Setswana
  tn: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, kopano eno ke go tiisa temoso e e kwadilweng ka kgang ya tiro e re neng re buisana ka yone.`,

    incident: (categoryName: string, description: string) =>
      `Molato: ${categoryName}. Dintlha: ${description}. Boitshwaro jono bo tlola dipholisi tsa rona tsa tiro mme bo tshwanetse go ema ka bonako.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `Eno ke temoso ya ${level}. E nna mo rekotong ya gago dikgwedi tse ${validityPeriod}. O tshwanetse go bontsha tokafatso e e bonalang le e e tswelelang.`,

    previousWarningsRecitation: (warnings: Array<{ date: string; offense: string; level: string }>) =>
      warnings.length > 0
        ? `O na le ditemoso tse ${warnings.length} tsa kwa morago tse di sa ntse di bereka mo faeleng: ${warnings.map((w, i) => `${i + 1}) Letlha: ${w.date}, Molato: ${w.offense}, Mokgwa: ${w.level}`).join('. ')}.`
        : "Ga o na kgalemelo ya kwa morago mo faeleng.",

    consequencesStatement: (issueDate: string) =>
      `Boitshwaro jo bo sa siamang jo bo oketsegileng bo tla felela ka kgalemelo e e oketsegileng, go akaretsa dikopano tsa molao, go fitlha kwa go fediseleng tiro. Ditemoso tsotlhe tse di sa feleng di a kokoana.`,

    rights: () =>
      "Ditshwanelo tsa gago ka fa tlase ga Molao wa Dikamano tsa Badiri:",

    rightsList: () => [
      "O ka boipiletsa kwa HR ka go kwala mo diureng tse 48.",
      "O ka nna le modiri yo o tshwanang le wena kgotsa moemedi wa lekgotla go go emela.",
      "Boitshwaro jo bo sa siamang jo bo oketsegileng ka nako ya tiiso bo ka felela ka kgalemelo e e oketsegileng, go fitlha kwa go fediseleng tiro."
    ],

    witnessOption: () =>
      "Go saena ga gago go netefatsa gore o tlhaloganya temoso eno le ditshwanelo tsa gago - ga go reye gore o dumelana. Fa o tlhopha go sa saena, paki e tla netefatsa gore temoso e tlhalosetse. Temoso e bereka ka ditsela tsotlhe.",

    questions: () =>
      "A o na le dipotso ka temoso eno kgotsa ditshwanelo tsa gago?",

    closing: () =>
      "Jaanong re tla kokoanya mesaeno. Tokafatso e e bonalang e a tlhokega."
  },
  // 🏴󠁺󠁡󠁮󠁲󠁿 NDEBELE - isiNdebele
  nr: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, leli hlangano ngolokuqinisekisa isixwayiso esibhaliwe ngodaba lomsebenzi esasixoxako.`,

    incident: (categoryName: string, description: string) =>
      `Icala: ${categoryName}. Imininingwane: ${description}. Lokhu kuziphatha kuphula izinqubomgomo zethu zomsebenzi futhi kumele kume masinyane.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `Lesi yisixwayiso se-${level}. Sihlala emarekhodi akho izinyanga ezingu-${validityPeriod}. Kumele ubonise ukuthuthuka okusheshayo nokuqhubekayo.`,

    previousWarningsRecitation: (warnings: Array<{ date: string; offense: string; level: string }>) =>
      warnings.length > 0
        ? `Unezixwayiso ezingu-${warnings.length} ezakudala ezisasebenza kufayela: ${warnings.map((w, i) => `${i + 1}) Usuku: ${w.date}, Icala: ${w.offense}, Izinga: ${w.level}`).join('. ')}.`
        : "Awunayo imithetho yokuqeqesha yangakudala kufayela.",

    consequencesStatement: (issueDate: string) =>
      `Ukuziphatha okubi okwengeziwe kuzoholela esinyweni esinye, kufaka phakathi izinkundla ezisemthethweni, kuya ekuphethweni kwenkonzo. Zonke izixwayiso ezingaphelelanga ziyaqoqeka.`,

    rights: () =>
      "Amalungelo akho ngaphansi koMthetho weBudlelwano Basebenzi:",

    rightsList: () => [
      "Ungabhena ku-HR ngokubhaliwe ngamahora angama-48.",
      "Ungaba nomsebenzi ofana nawe noma ummeleli wenyunyana ukukumela.",
      "Ukuziphatha okubi okwengeziwe ngesikhathi sokuqiniseka kungase kuholele esinyweni esinye, kuya ekuphethweni kwenkonzo."
    ],

    witnessOption: () =>
      "Ukusayina kwakho kuqinisekisa ukuthi uqonda lesi sixwayiso namalungelo akho - hhayi ukuthi uyavuma. Uma wenqaba ukusayina, umfakazi uzoqinisekisa ukuthi isixwayiso sichaziwe. Isixwayiso sisebenza ngazo zombili izindlela.",

    questions: () =>
      "Ingabe unemibuzo ngalesi sixwayiso noma amalungelo akho?",

    closing: () =>
      "Manje sizoqoqa izimo zokusayina. Ukuthuthuka okusheshayo kuyadingeka."
  },
  // 🏴󠁺󠁡󠁮󠁳󠁿 NORTHERN SOTHO - Sepedi
  ns: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, kopano ye ke go tiišetša temošo ye e ngwadilwego ya tiragalo ya mošomo yeo re boledišanego ka yona.`,

    incident: (categoryName: string, description: string) =>
      `Molato: ${categoryName}. Dintlha: ${description}. Boitshwaro bjo bo thuba dipholisi tša rena tša mošomo gomme bo swanetše go ema ka pela.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `Ye ke ${level}. E dula go direkoto tša gago dikgwedi tše ${validityPeriod}. O swanetše go bontšha kaonafatšo ye e lebelelago le ye e tšwelelago.`,

    previousWarningsRecitation: (warnings: Array<{ date: string; offense: string; level: string }>) =>
      warnings.length > 0
        ? `O na le ditemošo tše ${warnings.length} tša peleng tšeo di sa šomago mo faeleng: ${warnings.map((w, i) => `${i + 1}) Letšatši: ${w.date}, Molato: ${w.offense}, Seemo: ${w.level}`).join('. ')}.`
        : "Ga o na kgalemelo ya peleng mo faeleng.",

    consequencesStatement: (issueDate: string) =>
      `Boitshwaro bjo bo sa lokago bjo bo oketšegilego bo tla fela ka kgalemo ye e oketšegilego, go akaretša dikopano tša molao, go fihla go fediša mošomo. Ditemošo tšohle tše di sa feleng di a kokoana.`,

    rights: () =>
      "Ditokelo tša gago ka fase ga Molao wa Dikamano tša Bašomi:",

    rightsList: () => [
      "O ka boipiletša go HR ka go ngwala ka gare ga diiri tše 48.",
      "O ka ba le modiri yo o swanago le wena goba moemeli wa kesara go go emela.",
      "Boitshwaro bjo bo sa lokago bjo bo oketšegilego ka nako ya go tiišetša bo ka fela ka kgalemo ye e oketšegilego, go fihla go fediša mošomo."
    ],

    witnessOption: () =>
      "Go saena ga gago go netefatša gore o kwešiša temošo ye le ditokelo tša gago - e sego gore o dumelelana le yona. Ge o gana go saena, paki e tlago netefatša gore temošo e hlalošitšwe. Temošo e šoma ka ditsela tše ka bobedi.",

    questions: () =>
      "Na o na le dipotšišo ka temošo ye goba ditokelo tša gago?",

    closing: () =>
      "Bjale re tlago kgoboketša mesaeno. Kaonafatšo ye e lebelelago e a nyakega."
  }
} as const;

export const MultiLanguageWarningScript: React.FC<MultiLanguageWarningScriptProps> = ({
  employeeName,
  managerName,
  categoryName,
  incidentDescription,
  warningLevel,
  validityPeriod,
  onScriptRead,
  disabled = false,
  activeWarnings = [],
  issuedDate
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<keyof typeof WARNING_SCRIPTS>('en');
  const [showFullScript, setShowFullScript] = useState(false);
  const [scriptRead, setScriptRead] = useState(false);

  const currentScript = WARNING_SCRIPTS[selectedLanguage] || WARNING_SCRIPTS.en;
  const currentLanguageInfo = SA_LANGUAGES.find(lang => lang.code === selectedLanguage) || SA_LANGUAGES[0];

  // Get translated warning level for current language
  const translatedWarningLevel = getWarningLevelTranslation(warningLevel, selectedLanguage);

  // Format warnings for display
  const formattedWarnings = formatWarningsList(activeWarnings);

  // Format issue date for consequences section
  const formattedIssueDate = formatDate(issuedDate || new Date());

  const handleScriptComplete = () => {
    setScriptRead(true);
    onScriptRead();
  };

  return (
    <div className="space-y-2">
      {/* Compact Script Section - Subtle Design */}
      {!showFullScript ? (
        /* Minimal Inline Controls */
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative flex-1 max-w-[140px]">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as keyof typeof WARNING_SCRIPTS)}
              disabled={scriptRead || disabled}
              className="appearance-none w-full pl-3 pr-7 py-1.5 border rounded text-xs focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-input-background)',
                color: 'var(--color-text)'
              }}
            >
              {SA_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName}
                </option>
              ))}
            </select>
            <Globe className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-secondary)' }} />
          </div>

          {/* View Script Button - Subtle */}
          <button
            onClick={() => setShowFullScript(true)}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 border rounded text-xs font-medium transition-all hover:bg-gray-50 active:scale-95"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text)'
            }}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Script</span>
          </button>
        </div>
        ) : (
          <div className="space-y-4">
            {/* Header with Language Selector */}
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--color-alert-warning-border)' }}>
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
                <h4 className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>📖 Employee Warning Script</h4>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-1.5">
                <Globe className="w-3 h-3" style={{ color: 'var(--color-warning)' }} />
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as keyof typeof WARNING_SCRIPTS)}
                  disabled={scriptRead || disabled}
                  className="px-2 py-1 border rounded text-xs focus:ring-1"
                  style={{
                    borderColor: 'var(--color-input-border)',
                    backgroundColor: 'var(--color-input-background)',
                    color: 'var(--color-text)'
                  }}
                >
                  {SA_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Compact Script Content */}
            <div className="border rounded-lg p-4 max-h-80 overflow-y-auto" style={{
              backgroundColor: 'var(--color-card-background)',
              borderColor: 'var(--color-alert-warning-border)'
            }}>
              <div className="prose prose-sm max-w-none space-y-3">

                {/* Greeting */}
                <div className="border-l-4 pl-3" style={{ borderLeftColor: 'var(--color-warning)' }}>
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>1. Opening</h5>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.greeting(employeeName, managerName)}
                  </p>
                </div>

                {/* Incident Description */}
                <div className="border-l-4 pl-3" style={{ borderLeftColor: 'var(--color-error)' }}>
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>2. Incident Details</h5>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.incident(categoryName, incidentDescription)}
                  </p>
                </div>

                {/* Warning Explanation */}
                <div className="border-l-4 pl-3" style={{ borderLeftColor: 'var(--color-warning)' }}>
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>3. Warning Level & Validity</h5>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.warningExplanation(translatedWarningLevel, validityPeriod)}
                  </p>
                </div>

                {/* Previous Warnings Recitation */}
                <div className="border-l-4 pl-3" style={{ borderLeftColor: 'var(--color-secondary)' }}>
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>4. Previous Warnings on File</h5>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.previousWarningsRecitation(formattedWarnings)}
                  </p>
                </div>

                {/* Consequences Statement */}
                <div className="border-l-4 pl-3" style={{ borderLeftColor: 'var(--color-error)' }}>
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>5. Consequences</h5>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.consequencesStatement(formattedIssueDate)}
                  </p>
                </div>

                {/* Employee Rights */}
                <div className="border-l-4 pl-3" style={{ borderLeftColor: 'var(--color-success)' }}>
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>6. Your Rights</h5>
                  <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.rights()}
                  </p>
                  <ul className="space-y-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.rightsList().map((right, index) => (
                      <li key={index} className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                        {right}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Witness Option */}
                <div className="border-l-4 pl-3" style={{ borderLeftColor: 'var(--color-secondary)' }}>
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>7. Signature Explanation</h5>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.witnessOption()}
                  </p>
                </div>

                {/* Questions & Closing */}
                <div className="border-l-4 pl-3" style={{ borderLeftColor: 'var(--color-info)' }}>
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>8. Questions & Closing</h5>
                  <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.questions()}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.closing()}
                  </p>
                </div>
              </div>
            </div>

            {/* Script Completion */}
            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--color-alert-warning-border)' }}>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <Users className="w-3 h-3" style={{ color: 'var(--color-text-secondary)' }} />
                <span>Read this complete script aloud to {employeeName}</span>
              </div>

              {!scriptRead ? (
                <button
                  onClick={handleScriptComplete}
                  disabled={disabled}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                  style={{
                    backgroundColor: 'var(--color-success)',
                    color: 'var(--color-text-inverse)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <Check className="w-3 h-3" />
                  Confirm Script Read Aloud
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm" style={{
                  backgroundColor: 'var(--color-alert-success-bg)',
                  color: 'var(--color-alert-success-text)'
                }}>
                  <Check className="w-3 h-3" />
                  Script Reading Confirmed
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};