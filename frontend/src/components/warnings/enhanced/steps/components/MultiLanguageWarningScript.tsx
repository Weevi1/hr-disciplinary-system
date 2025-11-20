// frontend/src/components/warnings/enhanced/steps/components/MultiLanguageWarningScript.tsx
// 🌍 MULTI-LANGUAGE WARNING SCRIPT - ALL 11 SA OFFICIAL LANGUAGES
// ✅ MINIMALIST 4-SECTION FORMAT - Concise professional script leveraging digital document + 48-hour appeal system
// 📝 Sections: Formal Charge → Digital Document Notice → Legal Rights → Signature & Questions
// ⏱️ Reading time: ~40-60 seconds (vs. previous 90-120 seconds)

import React, { useState } from 'react';
import { Volume2, Globe, Check, Users, FileText } from 'lucide-react';

interface MultiLanguageWarningScriptProps {
  employeeName: string;
  managerName: string;
  categoryName: string;
  incidentDescription: string;
  warningLevel: string;
  validityPeriod: 3 | 6 | 12; // months
  onScriptRead: () => void;
  disabled?: boolean;
  activeWarnings?: any[]; // Still passed from parent but not used in minimalist script
  issuedDate?: Date | string; // Still passed from parent but not used in minimalist script
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

// 📝 WARNING SCRIPTS IN ALL 11 OFFICIAL LANGUAGES
// ✅ MINIMALIST VERSION - Concise 4-section format leveraging digital document + appeal system
const WARNING_SCRIPTS = {
  // 🇬🇧 ENGLISH - Primary/Default
  en: {
    formalCharge: (employeeName: string, categoryName: string, description: string, level: string, validityPeriod: number) =>
      `${employeeName}, you are being charged with ${categoryName}: ${description}. This is a ${level}, valid for ${validityPeriod} months.`,

    documentNotice: () =>
      `This warning will be generated as a digital document containing all details of our discussion, including your version of events, expected behavior standards, and improvement commitments. You will receive this document to review carefully - either by downloading it now via QR code, or it will be sent to you by HR.`,

    legalRights: () =>
      `Your rights under the Labour Relations Act: You may appeal to HR in writing within 48 hours if you disagree. You may have a fellow employee or shop steward represent you. All unexpired warnings accumulate, and further misconduct may result in additional discipline, up to ending of service.`,

    signatureExplanation: () =>
      `Your signature confirms you understand this warning and will review the document - not that you agree with it. If you refuse to sign, a witness will confirm the warning was explained. The warning is valid either way. Do you have any questions before we collect signatures?`
  },

  // 🇿🇦 AFRIKAANS
  af: {
    formalCharge: (employeeName: string, categoryName: string, description: string, level: string, validityPeriod: number) =>
      `${employeeName}, jy word aangekla van ${categoryName}: ${description}. Dit is 'n ${level}, geldig vir ${validityPeriod} maande.`,

    documentNotice: () =>
      `Hierdie waarskuwing sal as 'n digitale dokument gegenereer word wat alle besonderhede van ons bespreking bevat, insluitend jou weergawe van gebeure, verwagte gedragstandaarde, en verbeteringsverpligtinge. Jy sal hierdie dokument ontvang om noukeurig te hersien - óf deur dit nou via QR-kode af te laai, óf dit sal deur HR aan jou gestuur word.`,

    legalRights: () =>
      `Jou regte onder die Wet op Arbeidsverhoudinge: Jy mag binne 48 uur skriftelik by HR appelieer as jy nie saamstem nie. Jy mag 'n mede-werknemer of vakbondverteenwoordiger hê om jou te verteenwoordig. Alle onverstreke waarskuwings akkumuleer, en verdere wangedrag kan lei tot addisionele dissipline, tot beëindiging van diens.`,

    signatureExplanation: () =>
      `Jou handtekening bevestig dat jy hierdie waarskuwing verstaan en die dokument sal hersien - nie dat jy daarmee saamstem nie. As jy weier om te teken, sal 'n getuie bevestig dat die waarskuwing verduidelik is. Die waarskuwing is beide kante geldig. Het jy enige vrae voordat ons handtekeninge versamel?`
  },

  // 🏴󠁺󠁡󠁺󠁵󠁿 ZULU - isiZulu
  zu: {
    formalCharge: (employeeName: string, categoryName: string, description: string, level: string, validityPeriod: number) =>
      `${employeeName}, uyabekwa icala nge-${categoryName}: ${description}. Lesi yisixwayiso se-${level}, esisebenza izinyanga ezingu-${validityPeriod}.`,

    documentNotice: () =>
      `Lesi sixwayiso sizokwenziwa njengomqulu wedijithali oqukethe zonke imininingwane yengxoxo yethu, kufaka phakathi inguqulo yakho yezigameko, izindinganiso zokuziphatha ezilindelekile, nezibopho zokuthuthuka. Uzothola lo mqulu ukuze uwubuyekeze ngokucophelela - kungaba ngokuwulanda manje ngekhodi ye-QR, noma uzothunyelwa yihostela ye-HR.`,

    legalRights: () =>
      `Amalungelo akho ngaphansi koMthetho Wobudlelwano Basebenzi: Ungaphikisa ku-HR ngokubhaliwe ngamahora angu-48 uma ungavumelani. Ungaba nomsebenzi ofana nawe noma ummeleli wenyunyana ukuthi akumele. Zonke izixwayiso ezingaphelelanga ziyaqoqeka, futhi ukuziphatha okubi okwengeziwe kungase kuholele esinyweni esinye, kuya ekuphethweni kwenkonzo.`,

    signatureExplanation: () =>
      `Ukusayina kwakho kuqinisekisa ukuthi uyaqonda lesi sixwayiso futhi uzobuyekeza umqulu - hhayi ukuthi uyavuma. Uma wenqaba ukusayina, ufakazi uzoqinisekisa ukuthi isixwayiso sichaziwe. Isixwayiso sisebenza ngazo zombili izindlela. Ingabe unemibuzo ngaphambi kokuba siqoqe izimo zokusayina?`
  },

  // 🏴󠁺󠁡󠁸󠁨󠁿 XHOSA - isiXhosa
  xh: {
    formalCharge: (employeeName: string, categoryName: string, description: string, level: string, validityPeriod: number) =>
      `${employeeName}, uyatyholwa nge-${categoryName}: ${description}. Esi sisilumkiso se-${level}, esisebenza iinyanga ezingu-${validityPeriod}.`,

    documentNotice: () =>
      `Esi silumkiso siya kuveliswa njengoxwebhu lwedijithali oluqulathe zonke iinkcukacha zengxoxo yethu, kuquka inguqulelo yakho yeziganeko, imigangatho yokuziphatha elindelekileyo, nezibophelelo zophuculo. Uya kulufumana olu xwebhu ukuze uluphononge ngononophelo - nokuba ngokulushutha ngoku ngekhowudi ye-QR, okanye luya kuthunyelwa kuwe yi-HR.`,

    legalRights: () =>
      `Amalungelo akho phantsi koMthetho woBudlelwane baBasebenzi: Ungabhena kwi-HR ngokubhaliwe kwiiyure ezingama-48 ukuba awuvumelani. Ungaba nomsebenzi ofana nawe okanye ummeli wemanyano ukuba akumele. Zonke izilumkiso ezingaphelelwanga ziyaqokelelana, kwaye ukuziphatha okubi okongezelelweyo kunokubangela ukulungiswa okongezelelweyo, ukuya ekupheliseni kwenkonzo.`,

    signatureExplanation: () =>
      `Utyikityo lwakho luqinisekisa ukuba uyaqonda esi silumkiso kwaye uya kuphonononga uxwebhu - hayi ukuba uyavuma. Ukuba ukhaba ukusayina, ingqina iya kuqinisekisa ukuba isilumkiso sichaziwe. Isilumkiso sisebenza ngazo zombini iindlela. Ingaba unemibuzo ngaphambi kokuba siqokelele iityikityo?`
  },

  // 🏴󠁺󠁡󠁳󠁴󠁿 SOTHO - Sesotho
  st: {
    formalCharge: (employeeName: string, categoryName: string, description: string, level: string, validityPeriod: number) =>
      `${employeeName}, o a fuoa lengolo la ${categoryName}: ${description}. Ena ke temoso ea ${level}, e sebetsang likhoeli tse ${validityPeriod}.`,

    documentNotice: () =>
      `Temoso ena e tla etsoa e le tokomane ea digital e nang le lintlha tsohle tsa puisano ea rona, ho kenyelletsa maikutlo a hao a ditiragalo, litekanyetso tsa boitshwaro tse lebelletsoeng, le likano tsa ntlafatso. O tla fumana tokomane ena hore o e hlahlobe ka hloko - kapa ka ho e khoasolla hona joale ka QR code, kapa e tla romelloa ho wena ke HR.`,

    legalRights: () =>
      `Litokelo tsa hao ka tlasa Molao oa Likamano tsa Basebetsi: O ka ipeela ho HR ka ho ngola ka mora dihora tse 48 haeba o sa lumellane. O ka ba le mosebetsi ea tšoanang le uena kapa moemeli oa kesara ho u emela. Litemoso tsohle tse sa felang li bokellana, 'me boitshwaro bo bobe bo eketsehileng bo ka hlahisa kgetho e eketsehileng, ho fihla feteletsong ea ts'ebeletso.`,

    signatureExplanation: () =>
      `Saeno ea hao e tiisa hore o utloisisa temoso ena 'me o tla hlahloba tokomane - eseng hore o lumela. Haeba o hana ho saena, paki e tla tiisa hore temoso e hlalositsoe. Temoso e sebetsa ka tsela ka bobeli. Na o na le lipotso pele re bokella mesaeno?`
  },

  // 🏴󠁺󠁡󠁴󠁳󠁿 TSONGA - Xitsonga
  ts: {
    formalCharge: (employeeName: string, categoryName: string, description: string, level: string, validityPeriod: number) =>
      `${employeeName}, u rhumiwa hi ${categoryName}: ${description}. Lexi i xilumkiso xa ${level}, lexi tirhaka tin'hweti ta ${validityPeriod}.`,

    documentNotice: () =>
      `Xilumkiso lexi xi ta endliwa xi ri dokumente ya didjithali leyi nga ni swileriso hinkwaswo swa vulavurisani bya hina, ku katsa xivono xa wena xa swiendlakalo, swiyimo swa mavanyiselo leswi languteriwaka, ni swipimelo swa ku antswisa. U ta kuma dokumente leyi leswaku u yi kambisisa hi vukheta - hambiloko hi ku yi hoxa sweswi hi khodi ya QR, kumbe yi ta rhumiwa eka wena hi HR.`,

    legalRights: () =>
      `Timfanelo ta wena hi ka tlhelo ka Nawu wa Vuhlanganisi bya Vatirhi: U nga appila eka HR hi ku tsala hi nkarhi wa tawa ta 48 loko u nga pfumeli. U nga va ni mutirhimutsongo wa n'wina kumbe muemimuhlangani leswaku a ku yimela. Swilumkiso hinkwaswo leswi nga heli swi hlengeletiwa, naswona mavanyiselo yo biha lama engetelekeke ma nga endla ndzulavulo wo engetela, ku ya eka ku herisiwa ka vutirheri.`,

    signatureExplanation: () =>
      `Vusayini bya wena byi tiyisisa leswaku u twisisa xilumkiso lexi naswona u ta kambisisa dokumente - ku nga ri leswaku u pfumela. Loko u vavisa ku sayini, nhlamulo a nga tiyisisa leswaku xilumkiso xi hlamuseriwile. Xilumkiso xi tirhaka hi tindlela hinkwato. Xana u na swivutiso loko hi nga si hlengeleta vusayini?`
  },
  // 🏴󠁺󠁡󠁶󠁥󠁿 VENDA - Tshivenda
  ve: {
    formalCharge: (employeeName: string, categoryName: string, description: string, level: string, validityPeriod: number) =>
      `${employeeName}, no ṱuṱuwedzwa nga ha ${categoryName}: ${description}. Iyi ndi tivhiso ya ${level}, yo shuma minwedzi ya ${validityPeriod}.`,

    documentNotice: () =>
      `Tivhiso iyi i ḓo bveledzwa sa ḓokumente ya diḓijitali ine ya vha na vhubvo hoṱhe ha mushumo washu, hu tshi katelwa ndivho yavho ya zwithu, mielo ya maitele ane a linganiswa, na zwikhahlamelo zwa u khwinisa. No ḓo wana ḓokumente iyi uri no i sedze nga vhuṱali - arali nga u i khou dowuloda zwino nga QR code, kana i ḓo rumela khavho nga HR.`,

    legalRights: () =>
      `Pfanelo dzavho kha fhasi ha Mulayo wa Vhushaka ha Vhashumi: No nga appela kha HR hu tshi ṅwalwa nga tshifhinga tsha awara dza 48 arali no sa tendelani. No nga vha na mushumi wa zwiambaro kana muvhuyeli wa shango u ni ṱuṱuwedza. Tivhiso dzoṱhe dzi songo fhela dzi a kuvhanganya, nahone maitele a si zwavhuḓi ano engedziwa a nga khwinisa mulandu wo engedzeaho, u swika kha u fhedza ha mushumo.`,

    signatureExplanation: () =>
      `U saena havho zwi tiyisedza uri no pfesesa iyi tivhiso nahone no ḓo sedza ḓokumente - zwi si uri no tendelana. Arali no nanga u si saini, muhumbeli o do tiyisedza uri tivhiso yo talutshedzelwa. Tivhiso i shuma nga ndila dzoṱhe. Vho na mbudziso sa ri si khou kuvhanganya masaena?`
  },
  // 🏴󠁺󠁡󠁳󠁳󠁿 SWATI - siSwati
  ss: {
    formalCharge: (employeeName: string, categoryName: string, description: string, level: string, validityPeriod: number) =>
      `${employeeName}, ubekwa licala nge-${categoryName}: ${description}. Lesi yisixwayiso se-${level}, lesisebenta etinyanga letingu-${validityPeriod}.`,

    documentNotice: () =>
      `Lesixwayiso sitawukhiciwa njenge-document ye-digital lenato tonkhe tincukacha tekulukuluma kwetfu, kufaka ekhatsi incenye yakho yetintfo letehlilebile, tisisetjeniswa tekutiphatsa letilindzelelwako, netitfembiso tekuntfula. Utawutfola le-document kutewubuyekeza ngalokucophelela - nobe ngekuyilanda manje nge-QR code, nobe itawutfunyelwa kuwe ngu-HR.`,

    legalRights: () =>
      `Emalungelo akho ngansi kweMtsetfo weTinhlangano teTisebenzi: Ungaphikisana ku-HR ngekubhalwa ngetikhatsi tetinshintfu tange-48 uma ungavumelani. Ungaba nemsebenzi lofana nawe noma umemeti welihlangano kutsi akumele. Tonkhe tixwayiso letingapheli tiyabutana, nekutiphatsa lokubi lokucondzako kungase kuholele kulajiswa lokucondzako, kuya ekuphetseni kwemsebenzi.`,

    signatureExplanation: () =>
      `Kusayina kwakho kucincisekisa kutsi uyatizwa lesixwayiso futsi utawubuyekeza le-document - kusho nje kutsi uyavuma. Uma ukhetsa kungasayini, umfakazi utawucincisekisa kutsi sixwayiso sichaziwe. Sixwayiso sisebenta ngatindzlela tonkhe. Ingabe unemibuto ngaphambi kwekutsi sitfole kusayina?`
  },
  // 🏴󠁺󠁡󠁴󠁮󠁿 TSWANA - Setswana
  tn: {
    formalCharge: (employeeName: string, categoryName: string, description: string, level: string, validityPeriod: number) =>
      `${employeeName}, o a sekisiwa ka ${categoryName}: ${description}. Eno ke temoso ya ${level}, e e dirang dikgwedi tse ${validityPeriod}.`,

    documentNotice: () =>
      `Temoso eno e tla dirwa e le tokomane ya ditšitale e e nang le dintlha tsotlhe tsa puisano ya rona, go akaretsa lekanyo la gago la ditiragalo, mekgwa ya boitshwaro e e solofetsweng, le ditsholofelo tsa tokafatso. O tla bona tokomane eno gore o e sekaseke ka kelotlhoko - kgotsa ka go e khurumetsa jaanong ka khouthu ya QR, kgotsa e tla romelwa go wena ke HR.`,

    legalRights: () =>
      `Ditshwanelo tsa gago ka fa tlase ga Molao wa Dikamano tsa Badiri: O ka boipiletsa kwa HR ka go kwala mo diureng tse 48 fa o sa dumelane. O ka nna le modiri yo o tshwanang le wena kgotsa moemedi wa lekgotla go go emela. Ditemoso tsotlhe tse di sa feleng di a kokoana, mme boitshwaro jo bo sa siamang jo bo oketsegileng bo ka felela ka kgalemelo e e oketsegileng, go fitlha kwa go fediseleng tiro.`,

    signatureExplanation: () =>
      `Go saena ga gago go netefatsa gore o tlhaloganya temoso eno le gore o tla sekaseka tokomane - ga go reye gore o dumelana. Fa o tlhopha go sa saena, paki e tla netefatsa gore temoso e tlhalosetse. Temoso e bereka ka ditsela tsotlhe. A o na le dipotso fa pele ga re kokoanya mesaeno?`
  },
  // 🏴󠁺󠁡󠁮󠁲󠁿 NDEBELE - isiNdebele
  nr: {
    formalCharge: (employeeName: string, categoryName: string, description: string, level: string, validityPeriod: number) =>
      `${employeeName}, uyabekwa icala nge-${categoryName}: ${description}. Lesi yisixwayiso se-${level}, esisebenza izinyanga ezingu-${validityPeriod}.`,

    documentNotice: () =>
      `Lesi sixwayiso sizokwenziwa njengomqulu wedijithali oqukethe zonke imininingwane yengxoxo yethu, kufaka phakathi inguqulo yakho yezigameko, izindinganiso zokuziphatha ezilindelekile, nezibopho zokuthuthuka. Uzothola lo mqulu ukuze uwubuyekeze ngokucophelela - kungaba ngokuwulanda manje ngekhodi ye-QR, noma uzothunyelwa yihostela ye-HR.`,

    legalRights: () =>
      `Amalungelo akho ngaphansi koMthetho weBudlelwano Basebenzi: Ungabhena ku-HR ngokubhaliwe ngamahora angama-48 uma ungavumelani. Ungaba nomsebenzi ofana nawe noma ummeleli wenyunyana ukukumela. Zonke izixwayiso ezingaphelelanga ziyaqoqeka, futhi ukuziphatha okubi okwengeziwe kungase kuholele esinyweni esinye, kuya ekuphethweni kwenkonzo.`,

    signatureExplanation: () =>
      `Ukusayina kwakho kuqinisekisa ukuthi uqonda lesi sixwayiso futhi uzobuyekeza umqulu - hhayi ukuthi uyavuma. Uma wenqaba ukusayina, umfakazi uzoqinisekisa ukuthi isixwayiso sichaziwe. Isixwayiso sisebenza ngazo zombili izindlela. Ingabe unemibuzo ngaphambi kokuba siqoqe izimo zokusayina?`
  },
  // 🏴󠁺󠁡󠁮󠁳󠁿 NORTHERN SOTHO - Sepedi
  ns: {
    formalCharge: (employeeName: string, categoryName: string, description: string, level: string, validityPeriod: number) =>
      `${employeeName}, o a sekišetšwa ka ${categoryName}: ${description}. Ye ke temošo ya ${level}, yeo e šomago dikgwedi tše ${validityPeriod}.`,

    documentNotice: () =>
      `Temošo ye e tla dirwa bjalo ka tokumente ya diditšhitale yeo e nago le dintlha tšohle tša poledišano ya rena, go akaretša kanegelo ya gago ya ditiragalo, maemo a boitshwaro ao a letelwago, le ditshepiši tša kaonafatšo. O tla hwetša tokumente ye gore o e sekaseke ka kelohloko - e ka ba ka go e kgauswi gona bjale ka khouthu ya QR, goba e tla romelwa go wena ke HR.`,

    legalRights: () =>
      `Ditokelo tša gago ka fase ga Molao wa Dikamano tša Bašomi: O ka boipiletša go HR ka go ngwala ka gare ga diiri tše 48 ge o sa dumelelane. O ka ba le modiri yo o swanago le wena goba moemeli wa kesara go go emela. Ditemošo tšohle tše di sa feleng di a kokoana, gomme boitshwaro bjo bo sa lokago bjo bo oketšegilego bo ka fela ka kgalemo ye e oketšegilego, go fihla go fediša mošomo.`,

    signatureExplanation: () =>
      `Go saena ga gago go netefatša gore o kwešiša temošo ye le gore o tla sekaseka tokumente - e sego gore o dumelelana le yona. Ge o gana go saena, paki e tlago netefatša gore temošo e hlalošitšwe. Temošo e šoma ka ditsela tše ka bobedi. Na o na le dipotšišo pele re kgoboketša mesaeno?`
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

            {/* Compact Script Content - Minimalist 4-Section Format */}
            <div className="border rounded-lg p-4 max-h-80 overflow-y-auto" style={{
              backgroundColor: 'var(--color-card-background)',
              borderColor: 'var(--color-alert-warning-border)'
            }}>
              <div className="prose prose-sm max-w-none space-y-3">

                {/* 1. Formal Charge */}
                <div className="border-l-4 pl-3" style={{ borderLeftColor: 'var(--color-error)' }}>
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>1. Formal Charge</h5>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.formalCharge(employeeName, categoryName, incidentDescription, translatedWarningLevel, validityPeriod)}
                  </p>
                </div>

                {/* 2. Digital Document Notice */}
                <div className="border-l-4 pl-3" style={{ borderLeftColor: 'var(--color-info)' }}>
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>2. Digital Document Notice</h5>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.documentNotice()}
                  </p>
                </div>

                {/* 3. Your Rights */}
                <div className="border-l-4 pl-3" style={{ borderLeftColor: 'var(--color-success)' }}>
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>3. Your Rights</h5>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.legalRights()}
                  </p>
                </div>

                {/* 4. Signature & Questions */}
                <div className="border-l-4 pl-3" style={{ borderLeftColor: 'var(--color-warning)' }}>
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>4. Signature & Questions</h5>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.signatureExplanation()}
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