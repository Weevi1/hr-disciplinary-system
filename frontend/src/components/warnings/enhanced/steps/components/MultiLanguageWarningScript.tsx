// frontend/src/components/warnings/enhanced/steps/components/MultiLanguageWarningScript.tsx
// 🌍 MULTI-LANGUAGE WARNING SCRIPT - ALL 11 SA OFFICIAL LANGUAGES
// ✅ Comprehensive conversational script covering all employee rights and witness procedures

import React, { useState } from 'react';
import { Volume2, Globe, Check, Users, FileText, Clock } from 'lucide-react';

interface MultiLanguageWarningScriptProps {
  employeeName: string;
  managerName: string;
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
      `${employeeName}, as we've discussed, this meeting is to formalize the written warning regarding the workplace incident that occurred.`,

    purpose: () =>
      "We've already covered the details of what happened. Now I need to formally explain the warning level, the validity period, your rights, and the consequences if similar behavior occurs again. This process follows the Labour Relations Act and our company's disciplinary policy.",

    incident: (description: string) =>
      `To recap what we discussed earlier: ${description}. This behavior is not acceptable under our workplace standards and company policies, and it must be corrected immediately.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `This is a ${level}. It will remain on your employment record for ${validityPeriod} months from today's date. During this validity period, you are expected to demonstrate immediate and sustained improvement in your conduct.`,

    rights: () =>
      "Now, it's very important that you understand your rights:",

    rightsList: () => [
      "You have the right to appeal this warning within 48 hours if you believe it is unfair or procedurally incorrect. Your appeal must be submitted in writing to HR.",
      "This disciplinary process is progressive - if similar conduct occurs during the validity period of this warning, it may result in further disciplinary action, up to and including dismissal for gross misconduct.",
      "All information will be kept confidential and only shared with relevant management and HR personnel."
    ],

    witnessOption: () =>
      "Your signature on this document acknowledges that this warning has been explained to you and that you understand its contents and your rights. Your signature does NOT mean you agree with the warning - it simply confirms you have been properly notified. If you choose not to sign, that is your right. In that case, a witness will sign to confirm that this warning was explained to you in your presence and that you were informed of all your rights. The warning remains valid regardless of whether you sign it or a witness signs it.",

    questions: () =>
      "Do you have any questions about this warning, the validity period, the consequences, or your rights? I want to make sure you fully understand everything before we proceed with signatures.",

    closing: () =>
      "Thank you. We will now proceed to collect signatures to formalize this warning. Remember, this is an opportunity for you to correct your conduct. We expect to see immediate improvement, and we hope this will be the end of this matter."
  },

  // 🇿🇦 AFRIKAANS
  af: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, soos ons bespreek het, is hierdie vergadering om die skriftelike waarskuwing te formaliseer rakende die werkplek incident wat plaasgevind het.`,

    purpose: () =>
      "Ons het reeds die besonderhede van wat gebeur het gedek. Nou moet ek formeel die waarskuwingsvlak, die geldigheidsperiode, jou regte, en die gevolge verduidelik as soortgelyke gedrag weer voorkom. Hierdie proses volg die Wet op Arbeidsverhoudinge en ons maatskappy se dissiplinêre beleid.",

    incident: (description: string) =>
      `Om op te som wat ons vroeër bespreek het: ${description}. Hierdie gedrag is nie aanvaarbaar onder ons werkplek standaarde en maatskappy beleide nie, en dit moet onmiddellik reggestel word.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `Dit is 'n ${level}. Dit sal in jou werkrekord bly vir ${validityPeriod} maande vanaf vandag se datum. Gedurende hierdie geldigheidsperiode word daar van jou verwag om onmiddellike en volgehoue verbetering in jou gedrag te toon.`,

    rights: () =>
      "Nou, dit is baie belangrik dat jy jou regte verstaan:",

    rightsList: () => [
      "Jy het die reg om hierdie waarskuwing binne 48 uur te appelieer as jy glo dit is onregverdig of prosedureel verkeerd. Jou appèl moet skriftelik by HR ingedien word.",
      "Hierdie dissiplinêre proses is progressief - as soortgelyke gedrag gedurende die geldigheidsperiode van hierdie waarskuwing voorkom, kan dit lei tot verdere dissiplinêre aksie, tot en met ontslag vir growwe wangedrag.",
      "Alle inligting sal vertroulik gehou word en slegs met relevante bestuur en HR personeel gedeel word."
    ],

    witnessOption: () =>
      "Jou handtekening op hierdie dokument erken dat hierdie waarskuwing aan jou verduidelik is en dat jy die inhoud en jou regte verstaan. Jou handtekening beteken NIE dat jy met die waarskuwing saamstem nie - dit bevestig bloot dat jy behoorlik in kennis gestel is. As jy kies om nie te teken nie, is dit jou reg. In daardie geval sal 'n getuie teken om te bevestig dat hierdie waarskuwing aan jou in jou teenwoordigheid verduidelik is en dat jy van al jou regte ingelig is. Die waarskuwing bly geldig ongeag of jy dit teken of 'n getuie dit teken.",

    questions: () =>
      "Het jy enige vrae oor hierdie waarskuwing, die geldigheidsperiode, die gevolge, of jou regte? Ek wil seker maak dat jy alles ten volle verstaan voordat ons voortgaan met handtekeninge.",

    closing: () =>
      "Dankie. Ons sal nou voortgaan om handtekeninge te versamel om hierdie waarskuwing te formaliseer. Onthou, dit is 'n geleentheid vir jou om jou gedrag reg te stel. Ons verwag onmiddellike verbetering, en ons hoop dit sal die einde van hierdie saak wees."
  },

  // 🏴󠁺󠁡󠁺󠁵󠁿 ZULU - isiZulu
  zu: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, njengoba sixoxe, le mihlangano iwukuqinisa isixwayiso esibhaliwe mayelana nesigameko somsebenzi esenzekile.`,

    purpose: () =>
      "Sesivele saxoxa imininingwane yalokho okwenzekile. Manje ngidinga ukuchaza ngokusemthethweni izinga lesixwayiso, isikhathi sokusebenza, amalungelo akho, nemiphumela uma ukuziphatha okufanayo kuphinde kwenzeke. Le nqubo ilandela uMthetho Wobudlelwano Basebenzi kanye nenqubomgomo yokuqeqesha yenkampani yethu.",

    incident: (description: string) =>
      `Ukuphinda kulokho esikuxoxe kuqala: ${description}. Lokhu kuziphatha akwamukeleki ngaphansi kwezindinganiso zethu zendawo yomsebenzi nezinqubomgomo zenkampani, futhi kumele kulungiswe masinyane.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `Lesi isixwayiso se-${level}. Sizosala kumarekhodi akho womsebenzi izinyanga ezingu-${validityPeriod} kusukela namuhla. Phakathi nalesi sikhathi sokusebenza, kulindeleke ukuba ukhombise ukuthuthuka okusheshayo nokuqhubekayo ekuziphatheni kwakho.`,

    rights: () =>
      "Manje, kubalulekile kakhulu ukuthi uqonde amalungelo akho:",

    rightsList: () => [
      "Unelungelo lokuphikisa lesi sixwayiso phakathi namahora angu-48 uma ukholelwa ukuthi asilungile noma asenziwa ngendlela engalungile. Isicelo sakho sokubhena kufanele sinikezwe ngokubhaliwe ku-HR.",
      "Le nqubo yokuqeqesha iyaqhubeka - uma ukuziphatha okufanayo kwenzeka phakathi nesikhathi sokusebenza salesi sixwayiso, kungase kuholele esinyweni esinye sokuqeqesha, kuya ekuxoshweni ngenxa yokuziphatha okubi kakhulu.",
      "Lonke ulwazi luzogcinwa luyimfihlo futhi lubelane kuphela nabapha boholi nabadlulisi be-HR abadingekayo."
    ],

    witnessOption: () =>
      "Ukusayina kwakho kule dokhumenti kuyavuma ukuthi lesi sixwayiso sikuchazelwe futhi uyaqonda okuqukethwe namalungelo akho. Ukusayina kwakho AKUSHO ukuthi uyavuma nesixwayiso - kusho nje ukuthi wazisiwe ngendlela efanele. Uma ukhetha ukungasayini, yilelo ilungelo lakho. Kuleso sigameko, ufakazi uzosayina ukuqinisekisa ukuthi lesi sixwayiso sikuchazelwe ebukheneni bakho nokuthi wazisiwa ngawo onke amalungelo akho. Isixwayiso sihlala sisebenza kungakhathaliseki ukuthi uyasisayina noma ufakazi uyasisayina.",

    questions: () =>
      "Ingabe unemibuzo mayelana nalesi sixwayiso, isikhathi sokusebenza, imiphumela, noma amalungelo akho? Ngifuna ukuqinisekisa ukuthi uqonda konke ngokugcwele ngaphambi kokuqhubeka nezimo zokusayina.",

    closing: () =>
      "Ngiyabonga. Manje sizokwenza ukuqoqa izimo zokusayina ukuqinisa lesi sixwayiso. Khumbula, leli ithuba lokuthi ulungise ukuziphatha kwakho. Silindele ukubona ukuthuthuka okusheshayo, futhi sithemba ukuthi lokhu kuzoba ukuphela kwalolu daba."
  },

  // 🏴󠁺󠁡󠁸󠁨󠁿 XHOSA - isiXhosa
  xh: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, njengoko sixoxile, le ntlanganiso ikuqinisekisa isilumkiso esibhaliweyo malunga nesiganeko emsebenzini esenzekileyo.`,

    purpose: () =>
      "Sele sixoxile ngeenkcukacha zoko kwenzekileyo. Ngoku kufuneka ndichaze ngokusemthethweni inqanaba lesilumkiso, ixesha lokusebenza, amalungelo akho, kunye neziphumo ukuba ukuziphatha okufanayo kuphinde kwenzeke. Le nkqubo ilandela uMthetho woBudlelwane baBasebenzi kunye nemigaqo-nkqubo yenkampani yethu yokulungisa.",

    incident: (description: string) =>
      `Ukuphinda oko saxoxe ngako ngaphambili: ${description}. Oku kuziphatha akwamkelekanga phantsi kwemigangatho yethu yendawo yomsebenzi kunye nemigaqo-nkqubo yenkampani, kwaye kufuneka kulungiswe ngokukhawuleza.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `Esi yisilumkiso se-${level}. Siza kuhlala kwiirekhodi zakho zomsebenzi iinyanga ezingu-${validityPeriod} ukusuka kulo mhla. Ngeli xesha lokusebenza, kulindeleke ukukhombisa uphuculo olukhawulezayo noluqhubekayo ekuziphatheni kwakho.`,

    rights: () =>
      "Ngoku, kubalulekile kakhulu ukuba uqonde amalungelo akho:",

    rightsList: () => [
      "Unelungelo lokubhena esi silumkiso ngaphakathi kweeyure ezingama-48 ukuba ukholelwa ukuba asifanelekanga okanye asenziwa kakubi. Isibheno sakho kufuneka sinikezelwe ngokubhaliwe kwi-HR.",
      "Le nkqubo yokulungisa iyaqhubeka - ukuba ukuziphatha okufanayo kwenzeka ngeli xesha lokusebenza lwesi silumkiso, kunokukhokelela kwelinye inyathelo lokulungisa, kuya ekugxothweni ngenxa yokuziphatha okugwenxa kakhulu.",
      "Lonke ulwazi luya kugcinwa luyimfihlo kwaye lwabiwe kuphela nabaphathi abafanelekileyo nabasebenzi be-HR."
    ],

    witnessOption: () =>
      "Utyikityo lwakho kolu xwebhu luvuma ukuba esi silumkiso sichaziwe kuwe kwaye uyakuqonda okuqulethwe kunye namalungelo akho. Utyikityo lwakho ALUSITHI uyavumelana nesilumkiso - lusithi kuphela ukuba waziswa ngokufanelekileyo. Ukuba ukhetha ukungasayini, lelo lilungelo lakho. Kwimeko enjalo, ingqina iya kusayina ukuqinisekisa ukuba esi silumkiso sichaziwe kuwe ubukho bakho kwaye waziswa ngawo onke amalungelo akho. Isilumkiso sihlala sisebenza nokuba usisayinile okanye ingqina iyasisayina.",

    questions: () =>
      "Ingaba unemibuzo malunga nesi silumkiso, ixesha lokusebenza, iziphumo, okanye amalungelo akho? Ndifuna ukuqinisekisa ukuba uyakuqonda konke ngokupheleleyo ngaphambi kokuqhubeka neetyikityo.",

    closing: () =>
      "Enkosi. Ngoku siya kuqhubeka ukuqokelela iityikityo ukuqinisekisa esi silumkiso. Khumbula, eli lithuba lakho lokulungisa ukuziphatha kwakho. Silindele ukubona uphuculo olukhawulezayo, kwaye sinethemba lokuba oku kuya kuba sisiphelo sale meko."
  },

  // 🏴󠁺󠁡󠁳󠁴󠁿 SOTHO - Sesotho
  st: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, joalo ka ha re buisaneng, kopano ena ke ho tiisa temoso e ngotsoeng mabapi le ketsahalo ea mosebetsi e etsahetseng.`,

    purpose: () =>
      "Re se re buisane ka lintlha tsa se etsahetseng. Joale ke hloka ho hlalosa ka molao boemo ba temoso, nako ea tšebetso, litokelo tsa hao, le ditlamorao haeba boits'oaro bo tšoanang bo hlaha hape. Tshebetso ena e latela Molao oa Likamano tsa Basebetsi le pholisi ea kgetho ea khamphani ea rona.",

    incident: (description: string) =>
      `Ho pheta se re buisaneng ka sona pele: ${description}. Boitshwaro bona ha bo amohelehe ka tlasa litekanyetso tsa rona tsa sebaka sa mosebetsi le dipholisi tsa khamphani, 'me e tlameha ho lokisoa hang-hang.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `Ena ke temoso ea ${level}. E tla lula lirekoting tsa hao tsa mosebetsi likhoeli tse ${validityPeriod} ho tloha kajeno. Nakong ena ea tšebetso, ho lebelletsoe hore o bonts'e ntlafatso e potlakileng le e tsoelang pele boitshwarong ba hao.`,

    rights: () =>
      "Joale, ho bohlokwa haholo hore o utloisise litokelo tsa hao:",

    rightsList: () => [
      "O na le tokelo la ho ipeela temoso ena ka mora dihora tse 48 haeba o lumela hore ha e nepahale kapa e etsoa hampe. Kopo ea hao ea ho ipeela e tlameha ho fanoa ka ho ngola ho HR.",
      "Tshebetso ena ea kgetho e tsoela pele - haeba boitshwaro bo tšoanang bo etsahala nakong ea tšebetso ea temoso ena, ho ka hlahisa khato e 'ngoe ea kgetho, ho fihla tlōsong ka lebaka la boitshwaro bo bobe haholo.",
      "Tlhahisoleseding eohle e tla bolokoa e le lekunutu 'me e arolelane feela le bataoli ba hlokahalang le basebetsi ba HR."
    ],

    witnessOption: () =>
      "Saeno ea hao tokomaneng ena e amohela hore temoso ena e hlalositsoe ho uena 'me o utloisisa litaba le litokelo tsa hao. Saeno ea hao HA E BOLELE hore o lumela le temoso - e bolela feela hore o tsebisitsoe ka nepo. Haeba o khetha ho se saene, ke tokelo la hao. Tabeng eo, paki e tla saena ho tiisa hore temoso ena e hlalositsoe ho uena sebakeng sa hao le hore o tsebisitsoe litokelo tsa hao tsohle. Temoso e lula e sebetsa ho sa natsoe hore na o e saenile kapa paki e e saenile.",

    questions: () =>
      "Na o na le lipotso mabapi le temoso ena, nako ea tšebetso, ditlamorao, kapa litokelo tsa hao? Ke batla ho netefatsa hore o utloisisa tsohle ka botlalo pele re tsoela pele ka mesaeno.",

    closing: () =>
      "Kea leboha. Joale re tla tsoela pele ho bokella mesaeno ho tiisa temoso ena. Hopola, ena ke monyetla oa hao oa ho lokisa boitshwaro ba hao. Re lebeletse ho bona ntlafatso e potlakileng, 'me re ts'epa hore ena e tla ba qetello ea taba ena."
  },

  // 🏴󠁺󠁡󠁴󠁳󠁿 TSONGA - Xitsonga
  ts: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, tanihileswi hi burisene, nhlanganiso lowu i ku tiyisa xilumkiso lexi tsariweke hi timhaka ta xivangelo xa ntirho lexi nga endleke.`,

    purpose: () =>
      "Hi se hi burisene hi swileriso swa leswi nga endleke. Sweswi ndzi lava ku hlamusela hi ndlela ya nawu mpimo wa xilumkiso, nkarhi wa ku tirhisa, timfanelo ta wena, ni mimpikiselo loko mavanyiselo yo fana ma nga hluvukisa hi n'wana. Nongonoko lowu wu landzela Nawu wa Vuhlanganisi bya Vatirhi ni pholisi ya ndzulavulo ya khamphani ya hina.",

    incident: (description: string) =>
      `Ku phindha leswi hi swi burisene khale: ${description}. Mavanyiselo lawa ma nga amukeleriwi hi ka tlhelo ka swiyimo swa hina swa ndhawu ya ntirho ni tipholisi ta khamphani, naswona ma fanele ku lulamisiwa hi ku hatlisa.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `Lexi i xilumkiso xa ${level}. Xi ta tshama eka rhekhodo ya wena ya ntirho tin'hweti ta ${validityPeriod} ku suka namuntlha. Eka nkarhi lowu wa ku tirhisa, ku languteriwa leswaku u kombisa ku antswisa loku hatlisaka ni loku ya emahlweni eka mavanyiselo ya wena.`,

    rights: () =>
      "Sweswi, swa nkoka swinene leswaku u twisisa timfanelo ta wena:",

    rightsList: () => [
      "U na timfanelo ro appila xilumkiso lexi hi nkarhi wa tawa ta 48 loko u tshemba leswaku a xi lulamanga kumbe xi endliwile hambi. Xikombelo xa wena xo appila xi fanele ku nyikeriwa hi ku tsala eka HR.",
      "Nongonoko lowu wa ndzulavulo wu ya emahlweni - loko mavanyiselo yo fana ma nga endleka eka nkarhi wa ku tirhisa wa xilumkiso lexi, swi nga endla leswaku ku va goza rin'wana ra ndzulavulo, ku ya eka ku herisiwa hikuva ka mavanyiselo yo biha swinene.",
      "Rungula hinkwaro ri ta hlayisiwa ri ri swihlayiselo naswona ri avelaniwa ntsena na vafambisi lava lavekaka ni vatirhi va HR."
    ],

    witnessOption: () =>
      "Vusayini bya wena eka tsalwa leri byi amukela leswaku xilumkiso lexi xi hlamuseriwile eka wena naswona u twisisa leswi nga endzeni ni timfanelo ta wena. Vusayini bya wena A BYI VULI leswaku u pfumela ni xilumkiso - byi vula ntsena leswaku u tivisisiwile hi ndlela yo lulamela. Loko u hlawula ku nga sayini, sweswo i timfanelo ta wena. Eka xiyimo lexinyana, nhlamulo a nga ta ku sayina ku tiyisisa leswaku xilumkiso lexi xi hlamuseriwile eka wena hi vukona bya wena naswona u tivisisiwile hi timfanelo ta wena hinkwato. Xilumkiso xi hlaya xi tirhaka hambi leswaku u xi sayinile kumbe nhlamulo a xi sayinile.",

    questions: () =>
      "Xana u na swivutiso hi xilumkiso lexi, nkarhi wa ku tirhisa, mimpikiselo, kumbe timfanelo ta wena? Ndzi lava ku tiyisisa leswaku u twisisa hinkwaswo hi ku helela ka ku ya emahlweni ni vusayini.",

    closing: () =>
      "Inkomu. Sweswi hi ta ya emahlweni ku hlengeleta vusayini ku tiyisa xilumkiso lexi. Tsundzuka, leswi i nkarhi wa wena wo lulamisa mavanyiselo ya wena. Hi langutera ku vona ku antswisa loku hatlisaka, naswona hi tshemba leswaku leswi swi ta va makumu wa xiyimo lexi."
  },
  // 🏴󠁺󠁡󠁶󠁥󠁿 VENDA - Tshivenda
  ve: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, sa zwe ra amba, iyi meetingi ndi ya u tiyisedza tivhiso yo ṅwalwaho nga ha zwithu zwa mushumo zwine zwa itika.`,

    purpose: () =>
      "Ro vha ro amba nga ha zwine zwa itika. Zwino ndi tea u talutshedzisa nga ndila ya mulayo vhuimo ha tivhiso, tshifhinga tsha u shuma, pfanelo dzavho, na mvelelo arali maitele a tshi tou fana a tshi itea hafhu. Uyu muitero u tevhedza Mulayo wa Vhushaka ha Vhashumi na polisi ya mulandu ya khamphani yashu.",

    incident: (description: string) =>
      `U dovhola zwine ra zwi amba khaladzi: ${description}. Maitele aya a si kha fhasi ha zwiyimo zwashu zwa fhethu ha mushumo na mipholisi ya khamphani, nahone a tea u khwiniswa zwino-zwino.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `Iyi ndi tivhiso ya ${level}. I do dzula kha rekhodho yavho ya mushumo minwedzi ya ${validityPeriod} u bva ḓuvha la namusi. Nga tshifhinga tsha u shuma hetshi, hu tea uri no kombedza u khwinisa ha u tavhanya na u fhiraho phanḓa kha maitele avho.`,

    rights: () =>
      "Zwino, zwa konḓelele uri no pfesese pfanelo dzavho:",

    rightsList: () => [
      "No na pfanelo ya u appela iyi tivhiso nga tshifhinga tsha awara dza 48 arali no tenda uri a i kha fhasi ha vhulungana kana yo itiwa zwi si zwone. Kumbelo yavho ya u appela i tea u nedziwa hu tshi ṅwalwa kha HR.",
      "Uyu muitero wa mulandu u khou fhiraho phanḓa - arali maitele a tshi tou fana a tshi itea nga tshifhinga tsha u shuma ha iyi tivhiso, zwi nga vha zwa khwinisa kha magato mafhelo a mulandu, u swika kha u thithiswa nga nṱha ha maitele mabe khulwane.",
      "Mafhungo othe o do bulukanywa sa swihlayiselo nahone o do abelaniwa fhedzi na vhaṱhohi vhane vha tea nahone na vhashumi vha HR."
    ],

    witnessOption: () =>
      "U saena havho kha iyi bugu zwi amba uri iyi tivhiso yo talutshedzelwa kwavho nahone no pfesesa zwine zwo bulwa na pfanelo dzavho. U saena havho A ZWI AMBA uri no tendelana na tivhiso - zwi amba fhedzi uri no divhiswa nga ndila yo teaho. Arali no nanga u si saini, ndi pfanelo yavho. Kha zwenezwo, muhumbeli o do saini u tiyisedza uri iyi tivhiso yo talutshedzelwa kwavho mbele yavho nahone no divhisiwa pfanelo dzavho dzoṱhe. Tivhiso i khou sala i khou shuma hu sa nwali uri no i saena kana muhumbeli o i saena.",

    questions: () =>
      "Vho na mbudziso nga ha iyi tivhiso, tshifhinga tsha u shuma, mvelelo, kana pfanelo dzavho? Ndi khou toda u tiyisedza uri no pfesesa zwoṱhe nga u fhedzisesa phanḓa ha u fhiraho phanḓa nga masaena.",

    closing: () =>
      "Ndo livhuwa. Zwino ro do fhiraho phanḓa u kuvhanganya masaena u tiyisedza iyi tivhiso. Humbulani, iyi ndi tshifhinga tshavho tsha u khwinisa maitele avho. Ri khou lindela u vhona u khwinisa ha u tavhanya, nahone ri khou humbela uri zwi vhe tshiphelo tsha iyi nyimele."
  },
  // 🏴󠁺󠁡󠁳󠁳󠁿 SWATI - siSwati
  ss: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, njengobe sakhuluma, loluhlangano ngalokucinisekisa sixwayiso lesibhaliwe ngesehlo lemsebenzi lesehlekeleko.`,

    purpose: () =>
      "Sese sakhuluma ngalokucondze ngeloko kwentekako. Manje ngidvinga kuchaza ngelitsatfu lesilinganiso sesixwayiso, sikhatsi sekuphila, emalungelo akho, nemiphumela uma kutiphatsa lekufanako kuphindze kwenteke. Lenqubo ilandzela Umtsetfo weTinhlangano teTisebenzi kanye nephalisinkomba yekulajiswa yekhamphani yaletfu.",

    incident: (description: string) =>
      `Kuphindza loko sasakhuluma ngako ngaphambile: ${description}. Loku kutiphatsa akwemukelekile ngansi kwetingcikitelo tetfu tendzawo yemsebenzi kanye nephalisinkomba yekhamphani, futhi kumele kulungiswe masinyane.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `Lesi yisixwayiso se-${level}. Sitawuhlala emarekhodini akho emsebenzi etinyanga letingu-${validityPeriod} kusuka lamuhla. Ngelesikhatsi sekuphila, kulindelekile kutsi ubonise kuntfula lokushesha nekucondzaphambili kutiphatsa kwakho.`,

    rights: () =>
      "Manje, kubalulekile kakhulu kutsi uwatizwe emalungelo akho:",

    rightsList: () => [
      "Unelilungelo lekuphikisana nalesi sixwayiso ngetikhatsi tetinshintfu tange-48 uma ukholwa kutsi asifanele noma senziwa hambi. Sicelo sakho sekuphikisana kufanele sanikelwe ngekubhalwa ku-HR.",
      "Lenqubo yekulajiswa iyacondzaphambili - uma kutiphatsa lekufanako kwenteka ngelesikhatsi sekuphila salesixwayiso, kungase kuholele kusinyatselo sesinye sekulajiswa, kuya ekuxoshwa ngenxa yekutiphatsa lekubi kakhulu.",
      "Tonkhe lwati lutawugcinwa luyimfihlo futhi lutsatfwe kubaphati labadzingekako kuphela kanye netisebenzi te-HR."
    ],

    witnessOption: () =>
      "Kusayina kwakho kule ncwadzi kusamukela kutsi lesixwayiso sichaziwe kuwe futhi uyatizwa lokutsiwe kanye nemalungelo akho. Kusayina kwakho AKUSHO kutsi uyavuma nesixwayiso - kusho nje kutsi watiswa ngendlela lefanele. Uma ukhetsa kungasayini, yilelo ilungelo lakho. Kuleso sigameko, umfakazi utawusayina kucincisekisa kutsi lesixwayiso sichaziwe kuwe ekubeni kwakho futhi watiswa ngemalungelo akho onkhe. Sixwayiso sihlala sisebenta noma usisayinile noma umfakazi uyasisayina.",

    questions: () =>
      "Ingabe unemibuto ngalesi sixwayiso, sikhatsi sekuphila, imiphumela, noma emalungelo akho? Ngifuna kucincisekisa kutsi uyakutizwa konke kachubeka ngaphambili nekusayina.",

    closing: () =>
      "Ngiyabonga. Manje sitawucondzaphambili kutfola kusayina kucincisekisa lesixwayiso. Khumbulanani, loku kuyindzawo yakho yekulungisa kutiphatsa kwakho. Silindele kubona kuntfula lokushesha, futhi sitfemba kutsi loku kutabe kugcina kwale ndzaba."
  },
  // 🏴󠁺󠁡󠁴󠁮󠁿 TSWANA - Setswana
  tn: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, jaaka re buisane, kopano eno ke go tiisa temoso e e kwadilweng ka kgang ya tiro e e diragetseng.`,

    purpose: () =>
      "Re setse re buisane ka dintlha tsa se se diragetseng. Jaanong ke tshwanetse go tlhalosa ka semolao seelo sa temoso, nako ya go bereka, ditshwanelo tsa gago, le ditlamorago fa boitshwaro jo bo tshwanang bo ka diragala gape. Thulaganyo eno e latela Molao wa Dikamano tsa Badiri le pholisi ya kgalemelo ya khampani ya rona.",

    incident: (description: string) =>
      `Go boeletsa se re neng re buisana ka sone pele: ${description}. Boitshwaro jono ga bo amogelwe ka fa tlase ga ditekanyetso tsa rona tsa lefelo la tiro le dipholisi tsa khampani, mme bo tshwanetse go baakanyediwa ka bonako.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `Eno ke temoso ya ${level}. E tla nna mo rekotong ya gago ya tiro dikgwedi tse ${validityPeriod} go simolola gompieno. Ka nako eno ya go bereka, o solofetswe go bontsha tokafatso e e bonalang le e e tswelelang mo boitshwarong jwa gago.`,

    rights: () =>
      "Jaanong, go botlhokwa thata gore o tlhaloganye ditshwanelo tsa gago:",

    rightsList: () => [
      "O na le tshwanelo ya go boipiletsa temoso eno mo diureng tse 48 fa o dumela gore ga e siame kgotsa e dirwa ka phoso. Boipiletso jwa gago bo tshwanetse go neelwa ka go kwala go HR.",
      "Thulaganyo eno ya kgalemelo e tswelela - fa boitshwaro jo bo tshwanang bo diragala ka nako ya go bereka ya temoso eno, go ka felela ka kgato e nngwe ya kgalemelo, go fitlha kwa go tlosiwa tiro ka ntlha ya boitshwaro jo bo maswe thata.",
      "Tshedimosetso yotlhe e tla bolokwa e le sephiri mme e abelane fela le batsamaisi ba ba tlhokegang le badiri ba HR."
    ],

    witnessOption: () =>
      "Go saena ga gago mo tokomaning eno go amogela gore temoso eno e tlhalosetse wena mme o tlhaloganya se se mo go yone le ditshwanelo tsa gago. Go saena ga gago GA GO REYE gore o dumalana le temoso - go raya fela gore o itsisitswe ka tsela e e siameng. Fa o tlhopha go sa saena, ke tshwanelo ya gago. Mo maemong a, paki e tla saena go netefatsa gore temoso eno e tlhalosetse wena mo go bonweng ga gago le gore o itsisitswe ka ditshwanelo tsa gago tsotlhe. Temoso e nna e bereka go sa kgathalesege gore o e saenile kgotsa paki e e saenile.",

    questions: () =>
      "A o na le dipotso ka temoso eno, nako ya go bereka, ditlamorago, kgotsa ditshwanelo tsa gago? Ke batla go netefatsa gore o tlhaloganya tsotlhe pele re tswelela ka go saena.",

    closing: () =>
      "Ke a leboga. Jaanong re tla tswelela go kokoanya mesaeno go tiisa temoso eno. Gopola, seno ke sebaka sa gago sa go baakanya boitshwaro jwa gago. Re lebeletse go bona tokafatso e e bonalang, mme re tshepa gore seno se tla nna bokhutlo jwa kgang eno."
  },
  // 🏴󠁺󠁡󠁮󠁲󠁿 NDEBELE - isiNdebele
  nr: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, njengalokuthi sakhulumako, leli hlangano ngolokuqinisekisa isixwayiso esibhaliwe ngodaba lomsebenzi olwenzekako.`,

    purpose: () =>
      "Sesivele saxoxa ngemininingwane yalokho okwenzekako. Manje ngidinga ukuchaza ngomthetho izinga lesixwayiso, isikhathi sokusebenza, amalungelo akho, nemiphumela uma ukuziphatha okufanako kuphinde kwenzeke. Le nqubo ilandela uMthetho weBudlelwano Basebenzi kanye nenqubomgomo yokuqeqesha yenkampani yethu.",

    incident: (description: string) =>
      `Ukuphinda lokho esikuxoxe kuqala: ${description}. Lokhu kuziphatha akwamukelekile ngaphansi kwezindinganiso zethu zendawo yomsebenzi nezinqubomgomo zenkampani, futhi kumele kulungiswe masinyane.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `Lesi yisixwayiso se-${level}. Sizosala emarekhodi akho omsebenzi izinyanga ezingu-${validityPeriod} kusukela namuhla. Ngalesi sikhathi sokusebenza, kulindelwe ukuthi ukhombise ukuthuthuka okusheshayo nokuqhubekayo ekuziphatheni kwakho.`,

    rights: () =>
      "Manje, kubaluleke kakhulu ukuthi uqonde amalungelo akho:",

    rightsList: () => [
      "Unelungelo lokubhena lesi sixwayiso phakathi namahora angama-48 uma ukholelwa ukuthi asilungile noma asenziwa ngendlela engalungile. Isicelo sakho sokubhena kufanele sinikezwe ngokubhaliwe ku-HR.",
      "Le nqubo yokuqeqesha iyaqhubeka - uma ukuziphatha okufanayo kwenzeka phakathi nesikhathi sokusebenza salesi sixwayiso, kungase kuholele esinyweni esinye sokuqeqesha, kuya ekuxoshweni ngenxa yokuziphatha okubi kakhulu.",
      "Lonke ulwazi luzogcinwa luyimfihlo futhi lubelane kuphela nabapha boholi abadingekayo nabadlulisi be-HR."
    ],

    witnessOption: () =>
      "Ukusayina kwakho kule dokhumenti kuyavuma ukuthi lesi sixwayiso sikuchazelwe futhi uyaqonda okuqukethwe namalungelo akho. Ukusayina kwakho AKUSHO ukuthi uyavuma nesixwayiso - kusho nje ukuthi wazisiwe ngendlela efanele. Uma ukhetha ukungasayini, lelo ilungelo lakho. Kuleso sigameko, umfakazi uzosayina ukuqinisekisa ukuthi lesi sixwayiso sikuchazelwe ebukheneni bakho nokuthi wazisiwa ngawo onke amalungelo akho. Isixwayiso sihlala sisebenza noma uyasisayina noma umfakazi uyasisayina.",

    questions: () =>
      "Ingabe unemibuzo ngalesi sixwayiso, isikhathi sokusebenza, imiphumela, noma amalungelo akho? Ngifuna ukuqinisekisa ukuthi uqonda konke ngokuphelele ngaphambi kokuqhubeka nezimo zokusayina.",

    closing: () =>
      "Ngiyabonga. Manje sizokwanda siqhubeke nokuqoqa izimo zokusayina ukuqinisekisa lesi sixwayiso. Khumbula, lokhu kuyithuba lokuthi ulungise ukuziphatha kwakho. Silindele ukubona ukuthuthuka okusheshayo, futhi sithemba ukuthi lokhu kuzoba ukuphela kwalolu daba."
  },
  // 🏴󠁺󠁡󠁮󠁳󠁿 NORTHERN SOTHO - Sepedi
  ns: {
    greeting: (employeeName: string, managerName: string) =>
      `${employeeName}, bjalo ka ge re boledišanego, kopano ye ke go tiišetša temošo ye e ngwadilwego mabapi le tiragalo ya mošomo yeo e diregile go.`,

    purpose: () =>
      "Re šetše re boledišane ka dintlha tša se se diregile go. Bjale ke swanetše go hlaloša ka molao maemo a temošo, nako ya go šoma, ditokelo tša gago, le ditlamorago ge boitshwaro bjo bjo swanago bo ka direga gape. Tshepedišo ye e latela Molao wa Dikamano tša Bašomi le pholisi ya kgalemo ya khamphani ya rena.",

    incident: (description: string) =>
      `Go boeletša seo re boledišanego ka sona pele: ${description}. Boitshwaro bjo ga bjo amogelwe ka fase ga ditekanyetšo tša rena tša lefelo la mošomo le dipholisi tša khamphani, gomme bo swanetše go baakanywa ka pela.`,

    warningExplanation: (level: string, validityPeriod: number) =>
      `Ye ke temošo ya ${level}. E tla dula go direkoto tša gago tša mošomo dikgwedi tše ${validityPeriod} go thoma lehono. Ka nako ye ya go šoma, go lebelletšwe gore o bontšhe kaonafatšo ye e bonalago le yeo e tšwelelago boitshwarong bja gago.`,

    rights: () =>
      "Bjale, go bohlokwa kudu gore o kwešiše ditokelo tša gago:",

    rightsList: () => [
      "O na le tokelo ya go boipiletša temošo ye ka gare ga diiri tše 48 ge o dumela gore ga e nepagetšego goba e dirwa ka phošo. Boipiletšo bja gago bo swanetše go fiwa ka go ngwala go HR.",
      "Tshepedišo ye ya kgalemo e tšwela pele - ge boitshwaro bjo bjo swanago bo direga ka nako ya go šoma ya temošo ye, go ka fela ka kgato ye nngwe ya kgalemo, go fihla go tlošweng mošomo ka lebaka la boitshwaro bjo bobe kudu.",
      "Tshedimošo ka moka e tlago bolokwa e le sephiri gomme e abelanwa feela le balaodi ba bohlokwa le bašomi ba HR."
    ],

    witnessOption: () =>
      "Go saena ga gago tokong ye go amogela gore temošo ye e hlalošitšwe go wena gomme o kwešiša seo se lego go yona le ditokelo tša gago. Go saena ga gago GA GO REYE gore o dumelelana le temošo - go bolela fela gore o tsebišitšwe ka tsela ye e nepagetšego. Ge o kgetha go se saene, ke tokelo ya gago. Maemong ao, paki e tlago saena go netefatša gore temošo ye e hlalošitšwe go wena pele ga gago le gore o tsebišitšwe ka ditokelo tša gago ka moka. Temošo e dula e šoma ntle le go ela hloko gore o e saenile goba paki e e saenile.",

    questions: () =>
      "Na o na le dipotšišo ka temošo ye, nako ya go šoma, ditlamorago, goba ditokelo tša gago? Ke nyaka go netefatša gore o kwešiša tše ka moka pele re tšwelapele ka mesaeno.",

    closing: () =>
      "Ke leboga. Bjale re tlago tšwelapele go kgoboketša mesaeno go tiišetša temošo ye. Gopola, se ke sebaka sa gago sa go baakanya boitshwaro bja gago. Re lebelletše go bona kaonafatšo ye e bonalago, gomme re holofela gore se se tlabe bokhutlo bja taba ye."
  }
} as const;

export const MultiLanguageWarningScript: React.FC<MultiLanguageWarningScriptProps> = ({
  employeeName,
  managerName,
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
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>1. Opening & Introduction</h5>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.greeting(employeeName, managerName)}
                  </p>
                </div>

                {/* Purpose */}
                <div className="border-l-4 pl-3" style={{ borderLeftColor: 'var(--color-info)' }}>
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>2. Meeting Purpose</h5>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.purpose()}
                  </p>
                </div>

                {/* Incident Description */}
                <div className="border-l-4 pl-3" style={{ borderLeftColor: 'var(--color-error)' }}>
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>3. Incident Details</h5>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.incident(incidentDescription)}
                  </p>
                </div>

                {/* Warning Explanation */}
                <div className="border-l-4 pl-3" style={{ borderLeftColor: 'var(--color-warning)' }}>
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>4. Warning Details</h5>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.warningExplanation(translatedWarningLevel, validityPeriod)}
                  </p>
                </div>

                {/* Employee Rights */}
                <div className="border-l-4 pl-3" style={{ borderLeftColor: 'var(--color-success)' }}>
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>5. Your Rights</h5>
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
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>6. Witness & Signature Rights</h5>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.witnessOption()}
                  </p>
                </div>

                {/* Questions */}
                <div className="border-l-4 pl-3" style={{ borderLeftColor: 'var(--color-info)' }}>
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>7. Questions & Clarifications</h5>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentScript.questions()}
                  </p>
                </div>

                {/* Closing */}
                <div className="border-l-4 pl-3" style={{ borderLeftColor: 'var(--color-text-tertiary)' }}>
                  <h5 className="font-medium mb-1 text-sm" style={{ color: 'var(--color-text)' }}>8. Closing</h5>
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