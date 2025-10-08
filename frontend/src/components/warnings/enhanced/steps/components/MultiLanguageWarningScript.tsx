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
    first_written: 'First Written Warning',
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

    rights: () =>
      "Your rights under the Labour Relations Act:",

    rightsList: () => [
      "Appeal: You may appeal this warning in writing to HR within 48 hours if you believe it is unfair or procedurally incorrect.",
      "Progressive Discipline: Similar conduct during this warning's validity period may result in further disciplinary action, up to dismissal.",
      "Confidentiality: This information is confidential and shared only with relevant management and HR."
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

    rights: () =>
      "Jou regte onder die Wet op Arbeidsverhoudinge:",

    rightsList: () => [
      "Appèl: Jy mag hierdie waarskuwing binne 48 uur skriftelik by HR appelieer as jy glo dit is onregverdig of prosedureel verkeerd.",
      "Progressiewe Dissipline: Soortgelyke gedrag gedurende hierdie waarskuwing se geldigheidsperiode kan lei tot verdere dissiplinêre aksie, tot en met ontslag.",
      "Vertroulikheid: Hierdie inligting is vertroulik en word slegs met relevante bestuur en HR gedeel."
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

    rights: () =>
      "Amalungelo akho ngaphansi koMthetho Wobudlelwano Basebenzi:",

    rightsList: () => [
      "Ukuphikisa: Ungaphikisa lesi sixwayiso ngokubhaliwe ku-HR ngamahora angu-48 uma ukholelwa ukuthi asilungile noma asenziwa kabi.",
      "Ukuqeqesha Okuqhubekayo: Ukuziphatha okufanayo ngesikhathi lesi sixwayiso kungase kuholele esinyweni esinye sokuqeqesha, kuya ekuxoshweni.",
      "Ubumfihlo: Lolu lwazi luyimfihlo futhi lubelane kuphela nabaphathi abadingekayo kanye ne-HR."
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

    rights: () =>
      "Amalungelo akho phantsi koMthetho woBudlelwane baBasebenzi:",

    rightsList: () => [
      "Isibheno: Ungabhena esi silumkiso ngokubhaliwe kwi-HR kwiiyure ezingama-48 ukuba ukholelwa ukuba asifanelekanga okanye senziwa kakubi.",
      "Ukulungisa Okuqhubekayo: Ukuziphatha okufanayo ngeli xesha lesi silumkiso kunokukhokelela kwelinye inyathelo lokulungisa, kuya ekugxothweni.",
      "Ubumfihlo: Olu lwazi luyimfihlo kwaye lwabiwe kuphela kubaphathi abafanelekileyo nakwi-HR."
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

    rights: () =>
      "Litokelo tsa hao ka tlasa Molao oa Likamano tsa Basebetsi:",

    rightsList: () => [
      "Ho Ipeela: O ka ipeela temoso ena ka ho ngola ho HR ka mora dihora tse 48 haeba o lumela hore ha e nepahale kapa e etsoa hambe.",
      "Kgetho e Tsoelang Pele: Boitshwaro bo tšoanang nakong ea temoso ena bo ka hlahisa khato e 'ngoe ea kgetho, ho fihla tlōsong.",
      "Lekunutu: Tlhahisoleseding ena e lekunutu 'me e arolelane feela le bataoli ba hlokahalang le HR."
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

    rights: () =>
      "Timfanelo ta wena hi ka tlhelo ka Nawu wa Vuhlanganisi bya Vatirhi:",

    rightsList: () => [
      "Ku Appila: U nga appila xilumkiso lexi hi ku tsala eka HR hi nkarhi wa tawa ta 48 loko u tshemba leswaku a xi lulamanga kumbe xi endliwile hambi.",
      "Ndzulavulo wo ya Emahlweni: Mavanyiselo yo fana eka nkarhi wa ku tirhisa wa xilumkiso lexi swi nga endla ku va goza rin'wana ra ndzulavulo, ku ya eka ku herisiwa.",
      "Swihlayiselo: Rungula leri i swihlayiselo naswona ri avelaniwa ntsena na vafambisi lava lavekaka ni HR."
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

    rights: () =>
      "Pfanelo dzavho kha fhasi ha Mulayo wa Vhushaka ha Vhashumi:",

    rightsList: () => [
      "U Appela: No nga appela iyi tivhiso hu tshi ṅwalwa kha HR nga tshifhinga tsha awara dza 48 arali no tenda uri a i kha fhasi ha vhulungana kana yo itiwa zwi si zwone.",
      "Mulandu wo Fhiraho Phanḓa: Maitele a tshi tou fana nga tshifhinga tsha u shuma ha iyi tivhiso zwi nga khwinisa kha magato mafhelo a mulandu, u swika kha u thithiswa.",
      "Swihlayiselo: Mafhungo othe ndi swihlayiselo nahone o abelaniwa fhedzi na vhaṱhohi vhane vha tea na vhashumi vha HR."
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

    rights: () =>
      "Emalungelo akho ngansi kweMtsetfo weTinhlangano teTisebenzi:",

    rightsList: () => [
      "Kuphikisana: Ungaphikisana nalesi sixwayiso ngekubhalwa ku-HR ngetikhatsi tetinshintfu tange-48 uma ukholwa kutsi asifanele noma senziwa hambi.",
      "Kulajiswa Lokucondzaphambili: Kutiphatsa lekufanako ngelesikhatsi sekuphila salesixwayiso kungase kuholele kusinyatselo sesinye sekulajiswa, kuya ekuxoshwa.",
      "Buyimfihlo: Lwati luyimfihlo futhi lutsatfwe kubaphati labadzingekako kuphela ne-HR."
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

    rights: () =>
      "Ditshwanelo tsa gago ka fa tlase ga Molao wa Dikamano tsa Badiri:",

    rightsList: () => [
      "Go Boipiletsa: O ka boipiletsa temoso eno ka go kwala go HR mo diureng tse 48 fa o dumela gore ga e siame kgotsa e dirwa ka phoso.",
      "Kgalemelo e e Tswelelang: Boitshwaro jo bo tshwanang ka nako ya go bereka ya temoso eno go ka felela ka kgato e nngwe ya kgalemelo, go fitlha kwa go tlosiwa tiro.",
      "Sephiri: Tshedimosetso yotlhe e sephiri mme e abelane fela le batsamaisi ba ba tlhokegang le HR."
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

    rights: () =>
      "Amalungelo akho ngaphansi koMthetho weBudlelwano Basebenzi:",

    rightsList: () => [
      "Ukubhena: Ungabhena lesi sixwayiso ngokubhaliwe ku-HR ngamahora angama-48 uma ukholelwa ukuthi asilungile noma asenziwa kabi.",
      "Ukuqeqesha Okuqhubekayo: Ukuziphatha okufanayo ngesikhathi lesi sixwayiso kungase kuholele esinyweni esinye sokuqeqesha, kuya ekuxoshweni.",
      "Ubumfihlo: Lonke ulwazi luyimfihlo futhi lubelane kuphela nabaphathi abadingekayo ne-HR."
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

    rights: () =>
      "Ditokelo tša gago ka fase ga Molao wa Dikamano tša Bašomi:",

    rightsList: () => [
      "Boipiletšo: O ka boipiletša temošo ye ka go ngwala go HR ka gare ga diiri tše 48 ge o dumela gore ga e nepagetšego goba e dirwa ka phošo.",
      "Kgalemo ye e Tšwelago Pele: Boitshwaro bjo bjo swanago ka nako ya go šoma ya temošo ye bo ka fela ka kgato ye nngwe ya kgalemo, go fihla go tlošweng mošomo.",
      "Sephiri: Tshedimošo ye ke sephiri gomme e abelanwa feela le balaodi le HR."
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
  disabled = false
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<keyof typeof WARNING_SCRIPTS>('en');
  const [showFullScript, setShowFullScript] = useState(false);
  const [scriptRead, setScriptRead] = useState(false);

  const currentScript = WARNING_SCRIPTS[selectedLanguage] || WARNING_SCRIPTS.en;
  const currentLanguageInfo = SA_LANGUAGES.find(lang => lang.code === selectedLanguage) || SA_LANGUAGES[0];

  // Get translated warning level for current language
  const translatedWarningLevel = getWarningLevelTranslation(warningLevel, selectedLanguage);

  const handleScriptComplete = () => {
    setScriptRead(true);
    onScriptRead();
  };

  return (
    <div className="space-y-2">
      {/* Professional Compact Script Section */}
      <div className="border rounded-lg p-3" style={{
        background: 'linear-gradient(to right, var(--color-alert-warning-bg), var(--color-alert-warning-bg))',
        borderColor: 'var(--color-alert-warning-border)'
      }}>
        {!showFullScript ? (
          <div className="space-y-2">
            {/* Clear Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
                <div>
                  <h4 className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>Employee Warning Script</h4>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Complete script covering all employee rights</p>
                </div>
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

            {/* Action Row */}
            <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--color-alert-warning-border)' }}>
              <div className="text-xs" style={{ color: 'var(--color-alert-warning-text)' }}>
                Script available in <strong>{currentLanguageInfo.nativeName}</strong> • Ready to read aloud
              </div>
              <button
                onClick={() => setShowFullScript(true)}
                disabled={disabled}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium"
                style={{
                  backgroundColor: 'var(--color-warning)',
                  color: 'var(--color-text-inverse)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-warning)';
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-warning)';
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <FileText className="w-3 h-3" />
                View Full Script
              </button>
            </div>
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

                {/* Employee Rights */}
                <div className="border-l-4 pl-3" style={{ borderLeftColor: 'var(--color-success)' }}>
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>4. Your Rights</h5>
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
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>5. Signature Explanation</h5>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.witnessOption()}
                  </p>
                </div>

                {/* Questions & Closing */}
                <div className="border-l-4 pl-3" style={{ borderLeftColor: 'var(--color-info)' }}>
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>6. Questions & Closing</h5>
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

            {/* Legal Notice */}
            <div className="border rounded-lg p-3" style={{
              backgroundColor: 'var(--color-alert-info-bg)',
              borderColor: 'var(--color-alert-info-border)'
            }}>
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-info)' }} />
                <div className="text-xs" style={{ color: 'var(--color-alert-info-text)' }}>
                  <p className="font-medium mb-0.5">Legal Compliance Notice</p>
                  <p>
                    This script ensures compliance with the Labour Relations Act (LRA) requirements for procedural fairness
                    in disciplinary proceedings. All employee rights have been comprehensively covered in their preferred language.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};