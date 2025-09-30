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

// 📝 WARNING SCRIPTS IN ALL 11 OFFICIAL LANGUAGES
const WARNING_SCRIPTS = {
  // 🇬🇧 ENGLISH - Primary/Default
  en: {
    greeting: (employeeName: string, managerName: string) => 
      `Good day ${employeeName}. My name is ${managerName}, and I need to speak with you about a workplace incident that occurred recently.`,
    
    purpose: () => 
      "This meeting is to formally discuss a disciplinary matter. I want to make sure you understand your rights and the process we're following, which is in accordance with the Labour Relations Act and our company's disciplinary policy.",
    
    incident: (description: string) => 
      `The incident we need to discuss is as follows: ${description}. This behavior is not in line with our workplace standards and company policies.`,
    
    warningExplanation: (level: string) => 
      `Based on the severity and our disciplinary procedure, I am issuing you with a ${level} warning. This warning will remain active in your employment record for the validity period specified.`,
    
    rights: () => 
      "Now, it's very important that you understand your rights in this process:",
    
    rightsList: () => [
      "You have the right to respond to this warning and provide your version of events.",
      "You may request a witness to be present during this discussion if you wish.",
      "You have the right to appeal this decision within 48 hours if you believe it is unfair or procedurally incorrect.",
      "This disciplinary action is progressive - repeated or more serious offenses may lead to further disciplinary steps.",
      "You have the right to union representation if you are a member of a recognized trade union.",
      "All information discussed will be kept confidential and only shared with relevant management and HR personnel."
    ],
    
    witnessOption: () => 
      "If you choose not to sign this warning, that is your right. However, please understand that a witness will sign to confirm that this warning was properly delivered to you and that you were informed of all your rights. The warning remains valid whether you sign it or not.",
    
    questions: () => 
      "Do you have any questions about this warning, the incident, or your rights that I've explained? I want to make sure you fully understand everything before we proceed.",
    
    closing: () => 
      "Thank you for listening. We will now proceed to document this warning properly. Remember, this is an opportunity for improvement, and we hope to see positive changes in your conduct going forward."
  },

  // 🇿🇦 AFRIKAANS
  af: {
    greeting: (employeeName: string, managerName: string) => 
      `Goeiedag ${employeeName}. My naam is ${managerName}, en ek moet met jou praat oor 'n werkplek incident wat onlangs plaasgevind het.`,
    
    purpose: () => 
      "Hierdie vergadering is om 'n dissiplinêre saak formeel te bespreek. Ek wil seker maak dat jy jou regte en die proses wat ons volg verstaan, wat in ooreenstemming is met die Wet op Arbeidsverhoudinge en ons maatskappy se dissiplinêre beleid.",
    
    incident: (description: string) => 
      `Die incident wat ons moet bespreek is soos volg: ${description}. Hierdie gedrag is nie in lyn met ons werkplek standaarde en maatskappy beleide nie.`,
    
    warningExplanation: (level: string) => 
      `Gebaseer op die ernst en ons dissiplinêre prosedure, gee ek jou 'n ${level} waarskuwing. Hierdie waarskuwing sal aktief bly in jou werkrekord vir die gespesifiseerde geldigheidsperiode.`,
    
    rights: () => 
      "Nou, dit is baie belangrik dat jy jou regte in hierdie proses verstaan:",
    
    rightsList: () => [
      "Jy het die reg om op hierdie waarskuwing te reageer en jou weergawe van gebeure te verskaf.",
      "Jy mag versoek dat 'n getuie teenwoordig is tydens hierdie bespreking as jy wil.",
      "Jy het die reg om hierdie besluit binne 48 uur te appelieer as jy glo dit is onregverdig of prosedureel verkeerd.",
      "Hierdie dissiplinêre aksie is progressief - herhaalde of ernstiger oortredings kan tot verdere dissiplinêre stappe lei.",
      "Jy het die reg tot vakbondverteenwoordiging as jy 'n lid is van 'n erkende vakbond.",
      "Alle inligting wat bespreek word sal vertroulik gehou word en slegs gedeel word met relevante bestuur en HR personeel."
    ],
    
    witnessOption: () => 
      "As jy kies om nie hierdie waarskuwing te teken nie, is dit jou reg. Verstaan egter asseblief dat 'n getuie sal teken om te bevestig dat hierdie waarskuwing behoorlik aan jou afgelewer is en dat jy ingelig is van alle jou regte. Die waarskuwing bly geldig of jy dit teken of nie.",
    
    questions: () => 
      "Het jy enige vrae oor hierdie waarskuwing, die incident, of jou regte wat ek verduidelik het? Ek wil seker maak dat jy alles ten volle verstaan voordat ons voortgaan.",
    
    closing: () => 
      "Dankie dat jy geluister het. Ons sal nou voortgaan om hierdie waarskuwing behoorlik te dokumenteer. Onthou, dit is 'n geleentheid vir verbetering, en ons hoop om positiewe veranderinge in jou gedrag vorentoe te sien."
  },

  // 🏴󠁺󠁡󠁺󠁵󠁿 ZULU - isiZulu
  zu: {
    greeting: (employeeName: string, managerName: string) => 
      `Sawubona ${employeeName}. Igama lami ngu-${managerName}, futhi ngidinga ukukhuluma nawe ngodaba olwenzeke emsebenzini muva nje.`,
    
    purpose: () => 
      "Le meeting iwukuxoxa ngodaba lokuqeqeshwa ngokusemthethweni. Ngifuna ukuqinisekisa ukuthi uyaziqonda amalungelo akho nenqubo esilandulayo, okuhambisana noMthetho Wobudlelwano Basebenzi kanye nenqubomgomo yokuqeqesha yenkampani yethu.",
    
    incident: (description: string) => 
      `Isigameko okumele sikuxoxe isilandelayo: ${description}. Loku kuziphatha akuhambisani nezindinganiso zethu zendawo yomsebenzi kanye nezinqubomgomo zenkampani.`,
    
    warningExplanation: (level: string) => 
      `Ngokusekelwe ebubini kanye nenqubo yethu yokuqeqesha, ngikupha isixwayiso se-${level}. Lesi sixwayiso sizoblhala sisebenza kumarekhodi akho womsebenzi isikhathi semvume esicaciswayo.`,
    
    rights: () => 
      "Manje, kubalulekile kakhulu ukuthi uqonde amalungelo akho kule nqubo:",
    
    rightsList: () => [
      "Unelungelo lokuphendula kulesi sixwayiso futhi unikeze ingqikithi yakho yezigameko.",
      "Ungacela ukuthi kubekho ufakazi kulengxoxo uma ufuna.",
      "Unelungelo lokuphikisa lesi sinqumo phakathi namahora angama-48 uma ukholelwa ukuthi alulungile noma alungenzi kahle.",
      "Lesi senzo sokuqeqesha siyaqhubeka - amacala aphindwayo noma amabi kakhulu angaholela ezinyathelweni zokuqeqesha ezabanye.",
      "Unelungelo lokumelelwa yinyunyana uma uyilungu lenyunyana eqashelwa.",
      "Lonke ulwazi oluxoxwayo luzogcinwa luyimfihlo futhi lwabelane kuphela nabapha boholi kanye nabasebenzi be-HR abafanele."
    ],
    
    witnessOption: () => 
      "Uma ukhetha ukungasisayini lesi sixwayiso, yilelo ilungelo lakho. Kodwa-ke sicela uqonde ukuthi ufakazi uzosayina ukuqinisekisa ukuthi lesi sixwayiso sikulethwe ngendlela efanele futhi wazisiwa wonke amalungelo akho. Isixwayiso sihlala sisebenza noma uyasisayina noma cha.",
    
    questions: () => 
      "Ingabe unemibuzo mayelana nalesi sixwayiso, isigameko, noma amalungelo akho engiwakaziselwe? Ngifuna ukuqinisekisa ukuthi uqonda konke ngokugcwele ngaphambi kokuqhubeka.",
    
    closing: () => 
      "Ngiyabonga ukulalela. Manje sizokweqhubeka nokuqopha lesi sixwayiso ngendlela efanele. Khumbula, leli ithuba lokuthuthuka, futhi sithemba ukubona ushintsho oluhle ekuziphatheni kwakho kwezayo."
  },

  // 🏴󠁺󠁡󠁸󠁨󠁿 XHOSA - isiXhosa (Improved and Complete)
  xh: {
    greeting: (employeeName: string, managerName: string) =>
      `Molo ${employeeName}. Igama lam ngu-${managerName}, kwaye kufuneka ndithethe nawe ngesiganeko emsebenzini esenzeke kutsha nje.`,

    purpose: () =>
      "Le ntlanganiso ikukuxoxa ngomba wokulungiswa ngokomsitho ngokusemthethweni. Ndifuna ukuqinisekisa ukuba uyawaqonda amalungelo akho kunye nenkqubo esiyilandelayo, ehambelana noMthetho woBudlelwane baBasebenzi kunye nemigaqo-nkqubo yoculeko yenkampani yethu.",

    incident: (description: string) =>
      `Isiganeko esifuneka sikuxoxe ngesi: ${description}. Oku kuziphatha akuhambelani nemigangatho yethu yendawo yomsebenzi kunye nemigaqo-nkqubo yenkampani.`,

    warningExplanation: (level: string) =>
      `Ngokusekelwe kubunzima kunye nenkqubo yethu yokulungisa, ndikunika isilumkiso se-${level}. Esi silumkiso siza kuhlala sisebenza kwiirekhodi zakho zomsebenzi ngexesha lokusebenza elichaziwayo.`,

    rights: () =>
      "Ngoku, kubalulekile kakhulu ukuba uqonde amalungelo akho kule nkqubo:",

    rightsList: () => [
      "Unelungelo lokuphendula kesi silumkiso kwaye unikeze ingxelo yakho yeziganeko.",
      "Ungacela ukuba kubeko ingqina ngexesha lale ngxoxo ukuba ufuna.",
      "Unelungelo lokubhena esi sigqibo ngaphakathi kweeyure ezingama-48 ukuba ukholelwa ukuba asifanelekanga okanye asizenzi ngokufanelekileyo.",
      "Esi senzo sokulungisa siyaqhubela phambili - amatyala aphindaphindiweyo okanye amandla kakhulu anokukhokelela kumanyathelo amaninzi okulungisa.",
      "Unelungelo lokumelelwa yimanyano ukuba ulilungu lemanyano eyamkelekileyo.",
      "Lonke ulwazi oluxoxwayo luza kugcinwa luyimfihlo kwaye lwabiwe kuphela nabo baphathi abafanelekileyo nabasebenzi be-HR."
    ],

    witnessOption: () =>
      "Ukuba ukhetha ukungasayini esi silumkiso, yilelo ilungelo lakho. Kodwa nceda uqonde ukuba ingqina iza kusayina ukuqinisekisa ukuba esi silumkiso siye sanikwa kuwe ngokufanelekileyo kwaye waziswa nangawo onke amalungelo akho. Isilumkiso sihlala sisebenza nokuba usisayinile okanye awusisayinanga.",

    questions: () =>
      "Ingaba unemibuzo malunga nesi silumkiso, isiganeko, okanye amalungelo akho endiwakaziselwe? Ndifuna ukuqinisekisa ukuba uyakuqonda konke ngokupheleleyo ngaphambi kokuba siqhubeke.",

    closing: () =>
      "Enkosi ngokuphulaphula. Ngoku siza kuqhubeka nokubhala esi silumkiso ngokufanelekileyo. Khumbula, oku lithuba lokuphucula, kwaye sinethemba lokubona utshintsho oluhle ekuziphatheni kwakho kwixesha elizayo."
  },

  // 🏴󠁺󠁡󠁳󠁴󠁿 SOTHO - Sesotho (Improved and Complete)
  st: {
    greeting: (employeeName: string, managerName: string) =>
      `Dumela ${employeeName}. Lebitso la ka ke ${managerName}, mme ke hloka ho bua le wena ka taba ya mosebetsi e etsahetseng haufinyane.`,

    purpose: () =>
      "Kopano ena ke ho buisana ka taba ya kgetho ka mokhoa o nepahetseng oa molao. Ke batla ho netefatsa hore o utloisisa ditokelo tsa hao le tshebetso eo re e latelang, e lumellanang le Molao oa Dikamano tsa Basebetsi le pholisi ya kgetho ya khamphani ya rona.",

    incident: (description: string) =>
      `Ketsahalo eo re tlameha ho e buisana ke ena: ${description}. Boitshwaro bona ha bo lumellane le maemo a rona a sebaka sa mosebetsi le dipholisi tsa khamphani.`,

    warningExplanation: (level: string) =>
      `Ho latela boholo le tshebetso ya rona ya kgetho, ke o fa temoso ya ${level}. Temoso ena e tla dula e sebetsa lirekotong tsa hao tsa mosebetsi nakong ya ho sebetsa e hlalosang.`,

    rights: () =>
      "Jwale, ho bohlokwa haholo hore o utloisise ditokelo tsa hao tshebetsong ena:",

    rightsList: () => [
      "O na le tokelo la ho araba temoso ena le ho fana ka pale ya hao ya ditiragalo.",
      "O ka kopa hore ho be le paki nakong ya puisano ena haeba o batla.",
      "O na le tokelo la ho ipeela qeto ena ka mora dihora tse 48 haeba o lumela hore ha e nepahala kapa e sa etsoa hantle.",
      "Ketso ena ya kgetho e tsoela pele - diphoso tse phethehang kapa tse matla haholo di ka lebisa ho maqephe a mang a kgetho.",
      "O na le tokelo la ho emelwa ke mokhatlo haeba o setho sa mokhatlo o amohetsweng.",
      "Tlhahisoleseding yohle e buuwang e tla bolokwa e le lekunutu mme e arolelane feela le bataoli ba bohlokwa le basebetsi ba HR."
    ],

    witnessOption: () =>
      "Haeba o khetha ho se saene temoso ena, ke tokelo la hao. Empa ka kopo utloisise hore paki e tla saena ho netefatsa hore temoso ena e fihletswe ho wena ka nepo mme o tsebisitswe ditokelo tsa hao tsohle. Temoso e dula e sebetsa ha hoja o e saennse kapa o sa e saene.",

    questions: () =>
      "Na o na le dipotso mabapi le temoso ena, ketsahalo, kapa ditokelo tsa hao tseo ke di hlalositseng? Ke batla ho netefatsa hore o utloisisa tsohle ka botlalo pele re tsoela pele.",

    closing: () =>
      "Kea leboha ho mamela. Jwale re tla tsoela pele ho ngola temoso ena ka nepo. Hopola, sena ke sebaka sa ntlafatso, mme re lebelletse ho bona diphetoho tse ntle boitshwarong ba hao nakong e tlang."
  },

  // 🏴󠁺󠁡󠁴󠁳󠁿 TSONGA - Xitsonga
  ts: {
    greeting: (employeeName: string, managerName: string) =>
      `Avuxeni ${employeeName}. Vito ra mina i ${managerName}, naswona ndzi lava ku vulavula na wena hi timhaka ta rixaka leri nga endleke sweswi eka ntirho.`,

    purpose: () =>
      "Nhlanganiso lowu i ku burisana hi timhaka ta ndzulavulo hi ndlela ya ximfumo. Ndzi lava ku tiyisisa leswaku u twisisa timfanelo ta wena ni nongonoko lowu hi wu landzelaka, lowu fambana na Nawu wa Vuhlanganisi bya Vatirhi ni pholisi ya ndzulavulo ya khamphani ya hina.",

    incident: (description: string) =>
      `Xivangelo lexi hi faneleke ku xi burisana xi nga ha landzu: ${description}. Mavanyiselo lawa ma nga fambani na swiyimo swa hina swa ndhawu ya ntirho ni tipholisi ta khamphani.`,

    warningExplanation: (level: string) =>
      `Hi ku landza ku antswa ni nongonoko wa hina wa ndzulavulo, ndzi ku nyika xilumkiso xa ${level}. Xilumkiso lexi xi ta tshama xi tirhaka eka rhekhodo ya wena ya ntirho hi nkarhi wa ku tirhisa lowu nga boxiweke.`,

    rights: () =>
      "Sweswi, swa nkoka ngopfu leswaku u twisisa timfanelo ta wena eka nongonoko lowu:",

    rightsList: () => [
      "U na timfanelo to hlamula xilumkiso lexi naswona u nyika hungu ra wena ra swiendlakalo.",
      "U nga kumbela leswaku ku va na nhlamulo loko u lava eka nsinya lowu.",
      "U na timfanelo ro kongomisa xiboho lexi hi nkarhi wa tawa ta 48 loko u tshemba leswaku a xi nga ri xa ku lulamela kumbe xi nga endliwanga hi ndlela yo nepfuma.",
      "Goza leri ra ndzulavulo ri ya emahlweni - matsalwa yo phindha-phindha kumbe ya nkoka ngopfu ya nga endla leswaku ku va na magoza yo engetela ya ndzulavulo.",
      "U na timfanelo ro yimeriwa hi mihlangano ya vatirhi loko u ri xirho xa mihlangano leyi amukeriweke.",
      "Rungula hinkwaro lexi nga burisaniwaka ri ta hlayisiwa ri ri swihlayiselo naswona ri avelaniwa ntsena na vafambisi va nkoka ni vatirhi va HR."
    ],

    witnessOption: () =>
      "Loko u hlawula ku nga sayini xilumkiso lexi, sweswo i timfanelo ta wena. Kambe kombela u twisisa leswaku nhlamulo a nga ta ku sayina ku tiyisisa leswaku xilumkiso lexi xi nyikiwe eka wena hi ndlela yo nepfuma naswona u tivisiwe hi timfanelo ta wena hinkwato. Xilumkiso xi hlaya xi tirhaka hambi u xi sayinile kumbe a xi sayinanga.",

    questions: () =>
      "Xana u na swivutiso hi xilumkiso lexi, xivangelo, kumbe timfanelo ta wena leswi ndzi ti hlamuseleke? Ndzi lava ku tiyisisa leswaku u twisisa hinkwaswo kusuhi hi ku helela ka ku ya emahlweni.",

    closing: () =>
      "Inkomu hi ku yingisa. Sweswi hi ta ya emahlweni ku tsala xilumkiso lexi hi ndlela yo nepfuma. Tsundzuka, leswi i nkarhi wo antswisa, naswona hi langutera ku vona ku cinca ko antswa eka mavanyiselo ya wena eka nkarhi lowu taka."
  },
  // 🏴󠁺󠁡󠁶󠁥󠁿 VENDA - Tshivenda
  ve: {
    greeting: (employeeName: string, managerName: string) =>
      `Ndaa ${employeeName}. Dzina langa ndi ${managerName}, nahone ndi khou toda u amba navho nga zwithu zwa mushumo zwine zwa itika zwino-zwino.`,

    purpose: () =>
      "Iyi meetingi ndi ya u amba nga zwa mulandu nga ndila ya mulayo. Ndi khou toda u vhona uri no pfesesaho pfanelo dzavho na muitero une ra khou tevhedza, une wa tshimbila nga Mulayo wa Vhushaka ha Mushumi na polisi ya mulandu ya khamphani yashu.",

    incident: (description: string) =>
      `Zwithu zwine ra tea u zwi amba ndi zwi: ${description}. Maitele aya a si kha fhasi ha zwiyimo zwashu zwa fhethu ha mushumo na mipholisi ya khamphani.`,

    warningExplanation: (level: string) =>
      `Hu tshi tevhedzwa vhukhakhi na muitero washu wa mulandu, ndi khou ni nea tivhiso ya ${level}. Iyi tivhiso i do dzula i khou shuma kha rekhodho yavho ya mushumo nga tshifhinga tsha u shuma tshine tsha bulwa.`,

    rights: () =>
      "Zwino, zwa khongolose uri no pfesesehe pfanelo dzavho kha uyu muitero:",

    rightsList: () => [
      "No na pfanelo ya u fhindula kha iyi tivhiso nahone no nee ndivho yavho ya zwithu zwo itikelaho.",
      "No nga humbela uri hu vhe na muhumbeli arali no khou toda kha iyi ngudo.",
      "No na pfanelo ya u appela kha tshiphinzhi itshi nga ngomu dza awara dza 48 arali no tenda uri a zwi kha fhasi ha vhulungana kana zwa si itiwa nga ndila yo teaho.",
      "Uga mulandu uyu u khou fhiraho phanḓa - mafhungo o phindaho kana o nzhulaho o nga kondelela kha magato a mufifi a mulandu.",
      "No na pfanelo ya u mimelwa nga union arali no ri memba wa union yo tenderedzwaho.",
      "Mafhungo othe ano amba a do tshimbila sa swihlayiselo nahone a do abelana fhedzi na vhaṱhohi vha nkoka na vhashumi vha HR."
    ],

    witnessOption: () =>
      "Arali no nanga u si saini iyi tivhiso, ndi pfanelo yavho. Fhedzi ri humbela no pfesesehe uri muhumbeli o do saini u khwaṱhisedza uri iyi tivhiso yo nedziwa kwavho nga ndila yo teaho nahone no divhisiwa pfanelo dzavho dzoṱhe. Tivhiso i khou sala i khou shuma arali no i saininwa kana no sa i saini.",

    questions: () =>
      "Vho na mbudziso nga iyi tivhiso, zwo itikelaho, kana pfanelo dzavho dzine nda dzi talutshedzesa? Ndi khou toda u vhona uri no pfesesesa zwoṱhe nga u fhedzisesa phanḓa ha u fhiraho phanḓa.",

    closing: () =>
      "Ndo livhuwa nga u thetshelesa. Zwino ro do fhiraho phanḓa u ṅwala iyi tivhiso nga ndila yo teaho. Humbulani, zwi ndi tshifhinga tsha u khwinisa, nahone ri khou lindela u vhona tshanduko ntswa kha mavanyiseli avho kha tshifhinga tshi tshaho."
  },
  // 🏴󠁺󠁡󠁳󠁳󠁿 SWATI - siSwati
  ss: {
    greeting: (employeeName: string, managerName: string) =>
      `Sawubona ${employeeName}. Libito lami ngu-${managerName}, futhi ngidvinga kukhuluma nawe ngendaba yemsebenzi leseyenteke kamuva nje.`,

    purpose: () =>
      "Loluhlangano ngalokukhulunywa ngemsebenti wokulajiswa ngendlela yemtsetfo. Ngifuna kubone kutsi uyatizwa emalungelo akho kanye nenqubo lesiyilandzelelayo, lehambelana neMtsetfo weTinhlangano teTisebenzi kanye nephalisinkomba yekulajiswa yekhamphani yaletfu.",

    incident: (description: string) =>
      `Lesi sehlo lesifanele sikhulunyane ngaso ngulesi: ${description}. Loku kuziphatha akuhambisani netintfo tetfu temtsetfo wemsebenti kanye nephalisinkomba yekhamphani.`,

    warningExplanation: (level: string) =>
      `Ngekwesekwa bukhulu kanye nenqubo yaletfu yekulajiswa, ngikupha sixwayiso se-${level}. Lesi sixwayiso sitawuhlala sisebenta kurekhodi yakho yemsebenzi ngelisikhasti sokuphila lesichaziwe.`,

    rights: () =>
      "Manje, kubalulekile kakhulu kutsi watizwe emalungelo akho kule nqubo:",

    rightsList: () => [
      "Unelilungelo lekuphendvula kulesi sixwayiso kanye nekuveta umbiko wakho waletitifo letentekako.",
      "Ungacela kutsi kube khona umfakazi kule nkhulumano uma ucela.",
      "Unelilungelo lekuphikisana nalesi sinqumo ngekutsatsa emahora lange-48 uma ukholwa kutsi awulungile noma awenziwa ngendlela lefanele.",
      "Lesi senzempi sekulajiswa siyacondzaphambili - emacala laphindvako noma lamabi kakhulu angaletha tinyatselo letinye tekulajiswa.",
      "Unelilungelo lekumelelwa ngumnyamo uma ulingidzima lemnyamweni lowamukekile.",
      "Tonkhe lwati lolokhulunywa ngatsi lutawuhlaliswa luyimfihlo futhi lunikezelwe kuphela kubaphati labadzingekako kanye netisebenzi te-HR."
    ],

    witnessOption: () =>
      "Uma ukhetha ungasisayini lesi sixwayiso, yilelo ilungelo lakho. Kodvwa-ke sicela uwatizwe kutsi umfakazi utawusayina kucoka kutsi lesi sixwayiso siletjwe kuwe ngendlela lefanele futhi wanglelwa ngemalungelo akho onkhe. Sixwayiso sihlala sisebenta noma usisayinile noma ungasisayinanga.",

    questions: () =>
      "Ingabe unemibuto ngalesi sixwayiso, sehlo, noma emalungelo akho lengiwahlatsheliselile? Ngifuna kucoka kutsi uwatizwa tonkhe kachubeka phambi kokucondzaphambili.",

    closing: () =>
      "Ngiyabonga ngekutilalela. Manje sitawucondzaphambili kutsala lesi sixwayiso ngendlela lefanele. Khumbulanani, loku kuyindzawo yekuntfula, futhi sitawubona tingutsuko letintsja ekuziphatheni kwakho kutsine kuye phambi."
  },
  // 🏴󠁺󠁡󠁴󠁮󠁿 TSWANA - Setswana
  tn: {
    greeting: (employeeName: string, managerName: string) =>
      `Dumelang ${employeeName}. Leina la me ke ${managerName}, mme ke batla go bua le wena ka kgang ya tiro e e diragetseng gone jaanong.`,

    purpose: () =>
      "Kopano eno ke go buisana ka kgang ya kgalemelo ka tsela ya semolao. Ke batla go netefatsa gore o tlhaloganya ditshwanelo tsa gago le thulaganyo e re e latelang, e e tsamayang le Molao wa Dikamano tsa Badiri le pholisi ya kgalemelo ya khampani ya rona.",

    incident: (description: string) =>
      `Kgang e re tshwanetseng go e buisana ke eno: ${description}. Boitshwaro jono ga bo tsamaelane le ditekanyetso tsa rona tsa lefelo la tiro le dipholisi tsa khampani.`,

    warningExplanation: (level: string) =>
      `Go ya ka boima le thulaganyo ya rona ya kgalemelo, ke go naya temoso ya ${level}. Temoso eno e tla nna e bereka mo rekotong ya gago ya tiro ka nako ya go bereka e e tlhalosiwang.`,

    rights: () =>
      "Jaanong, go botlhokwa thata gore o tlhaloganye ditshwanelo tsa gago mo thulaganyong eno:",

    rightsList: () => [
      "O na le tshwanelo ya go araba temoso eno mme o neye kgang ya gago ya ditiragalo.",
      "O ka kopa gore go nne le paki mo puisanong eno fa o batla.",
      "O na le tshwanelo ya go boipiletsa tshwetso eno mo diureng tse 48 fa o dumela gore ga e siame kgotsa ga e a dirwa sentle.",
      "Kgato eno ya kgalemelo e ya pele - ditlolo tse di boelwang kgotsa tse di masisi thata di ka feleletsa ka dikgato tse dingwe tsa kgalemelo.",
      "O na le tshwanelo ya go emelwa ke kopano fa o le leloko la kopano e e amogetsweng.",
      "Tshedimosetso yotlhe e e buisanwang e tla bolokwa e le sephiri mme e arolelane fela le batsamaisi ba ba botlhokwa le badiri ba HR."
    ],

    witnessOption: () =>
      "Fa o tlhopha go sa saene temoso eno, ke tshwanelo ya gago. Fela ke a go rapela gore o tlhaloganye gore paki e tla saena go netefatsa gore temoso eno e o newetswe ka tsela e e siameng mme o itsisiwe ka ditshwanelo tsa gago tsotlhe. Temoso e nna e bereka go sa kgathalesege gore o e saenile kgotsa ga o a e saena.",

    questions: () =>
      "A o na le dipotso ka temoso eno, kgang, kgotsa ditshwanelo tsa gago tse ke di tlhalositseng? Ke batla go netefatsa gore o tlhaloganya tsotlhe pele re ya pele.",

    closing: () =>
      "Ke a leboga go reetsa. Jaanong re tla ya pele go kwala temoso eno ka tsela e e siameng. Gopola, seno ke sebaka sa go tokafatsa, mme re lebeletse go bona diphetogo tse dintle mo boitshwarong jwa gago mo nakong e e tlang."
  },
  // 🏴󠁺󠁡󠁮󠁲󠁿 NDEBELE - isiNdebele
  nr: {
    greeting: (employeeName: string, managerName: string) =>
      `Lotjhani ${employeeName}. Ibizo lami ngu-${managerName}, futhi ngidinga ukukhuluma nawe ngodaba lomsebenzi olwenzeke muva nje.`,

    purpose: () =>
      "Leli hlangano ngolokukhuluma ngodaba lokuqeqesha ngendlela yomthetho. Ngifuna ukuqinisekisa ukuthi uyaziqonda amalungelo akho kanye nenqubo esiyilandelayo, ehambisana noMthetho weBudlelwano Basebenzi kanye nenqubomgomo yokuqeqesha yenkampani yethu.",

    incident: (description: string) =>
      `Isigameko okumele sikuxoxe sikulesi: ${description}. Lokhu kuziphatha akuhambisani nezindinganiso zethu zendawo yomsebenzi kanye nezinqubomgomo zenkampani.`,

    warningExplanation: (level: string) =>
      `Ngokusekelwe ebunzimeni kanye nenqubo yethu yokuqeqesha, ngikupha isixwayiso se-${level}. Lesi sixwayiso sizokwanda sisebenza emarekhodi akho omsebenzi isikhathi sokusebenza esichaziwe.`,

    rights: () =>
      "Manje, kubaluleke kakhulu ukuthi uqonde amalungelo akho kule nqubo:",

    rightsList: () => [
      "Unelungelo lokuphendula kulesi sixwayiso futhi unikeze umbiko wakho wezigameko.",
      "Ungacela ukuthi kube khona umfakazi kule nkulumo uma ufuna.",
      "Unelungelo lokubhena lesi sinqumo phakathi namahora angama-48 uma ukholelwa ukuthi awulungile noma awenziwa ngendlela efanele.",
      "Lesi senzo sokuqeqesha siyaqhubeka - amacala aphindwayo noma amabi kakhulu angaholela ezinyathelweni ezinye zokuqeqesha.",
      "Unelungelo lokumelelwa yinyunyana uma uyilungu lenyunyana esamukelekile.",
      "Lonke ulwazi oluxoxwayo luzogcinwa luyimfihlo futhi lwabelane kuphela nabapha boholi abadingekayo kanye nabasebenzi be-HR."
    ],

    witnessOption: () =>
      "Uma ukhetha ukungasayini lesi sixwayiso, lelo ilungelo lakho. Kodwa-ke sicela uqonde ukuthi umfakazi uzosayina ukuqinisekisa ukuthi lesi sixwayiso sikulethwe ngendlela efanele futhi wazisiwe wonke amalungelo akho. Isixwayiso sihlala sisebenza noma uyasisayina noma ungasisayina.",

    questions: () =>
      "Ingabe unemibuzo ngalesi sixwayiso, isigameko, noma amalungelo akho engiwacacisile? Ngifuna ukuqinisekisa ukuthi uqonda konke ngokuphelele ngaphambi kokuqhubeka.",

    closing: () =>
      "Ngiyabonga ukuthi ulalele. Manje sizokwanda siqhubeke nokubhala lesi sixwayiso ngendlela efanele. Khumbula, lokhu kuyithuba lokuthuthuka, futhi sithemba ukubona ushintsho oluhle ekuziphatheni kwakho kwesikhathi esizayo."
  },
  // 🏴󠁺󠁡󠁮󠁳󠁿 NORTHERN SOTHO - Sepedi
  ns: {
    greeting: (employeeName: string, managerName: string) =>
      `Thobela ${employeeName}. Leina la ka ke ${managerName}, gomme ke hloka go boledišana le wena ka taba ya mošomo yeo e diregego bjale.`,

    purpose: () =>
      "Kopano ye ke go boledišana ka taba ya kgalemo ka tsela ya molao. Ke nyaka go netefatša gore o kwešiša ditokelo tša gago le tshepedišo yeo re e latelago, yeo e sepelelanago le Molao wa Dikamano tša Bašomi le pholisi ya kgalemo ya khamphani ya rena.",

    incident: (description: string) =>
      `Tiragalo yeo re swanetšego go e boledišana ke ye: ${description}. Boitshwaro bjo ga bo sepelelane le ditekanyetšo tša rena tša lefelo la mošomo le dipholisi tša khamphani.`,

    warningExplanation: (level: string) =>
      `Go ya ka bogolo le tshepedišo ya rena ya kgalemo, ke go nea temošo ya ${level}. Temošo ye e tlago dula e šoma go direkoto tša gago tša mošomo ka nako ya go šoma yeo e hlalošitšwego.`,

    rights: () =>
      "Bjale, go bohlokwa kudu gore o kwešiše ditokelo tša gago tshepedišong ye:",

    rightsList: () => [
      "O na le tokelo ya go araba temošo ye gomme o neye pale ya gago ya ditiragalo.",
      "O ka kgopela gore go be le paki puledišanong ye ge o nyaka.",
      "O na le tokelo ya go boipiletšo tshwetšong ye ka gare ga diiri tše 48 ge o dumela gore ga e nepagetšego goba ga e dirwa gabotse.",
      "Kgato ye ya kgalemo e tšwela pele - diphošo tšeo di boeletšwago goba tšeo di maatla kudu di ka phethelela dikgatong tše dingwe tša kgalemo.",
      "O na le tokelo ya go emelwa ke mokgatlo ge o le leloko la mokgatlo wo o amogetšwego.",
      "Tshedimošo ka moka yeo e boletšwego e tlago bolokwa e le sephiri gomme e abelanwa feela le balaodi ba bohlokwa le bašomi ba HR."
    ],

    witnessOption: () =>
      "Ge o kgetha go se saene temošo ye, ke tokelo ya gago. Eupša ke a go rapela gore o kwešiše gore paki e tlago saena go netefatša gore temošo ye e o fihlele ka tsela ye e nepagetšego gomme o tsebišwa ka ditokelo tša gago ka moka. Temošo e dula e šoma ntle le go ela hloko gore o e saenile goba aowa.",

    questions: () =>
      "Na o na le dipotšišo ka temošo ye, tiragalo, goba ditokelo tša gago tšeo ke di hlalošitšego? Ke nyaka go netefatša gore o kwešiša tše ka moka pele re tšwelapele.",

    closing: () =>
      "Ke leboga go theeletša. Bjale re tlago tšwelapele go ngwala temošo ye ka tsela ye e nepagetšego. Gopola, se ke sebaka sa go kaonafatša, gomme re lebelletše go bona diphetogo tše dibotse boitshwarong bja gago ka nako ye e tlago."
  }
} as const;

export const MultiLanguageWarningScript: React.FC<MultiLanguageWarningScriptProps> = ({
  employeeName,
  managerName,
  incidentDescription,
  warningLevel,
  onScriptRead,
  disabled = false
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<keyof typeof WARNING_SCRIPTS>('en');
  const [showFullScript, setShowFullScript] = useState(false);
  const [scriptRead, setScriptRead] = useState(false);

  const currentScript = WARNING_SCRIPTS[selectedLanguage] || WARNING_SCRIPTS.en;
  const currentLanguageInfo = SA_LANGUAGES.find(lang => lang.code === selectedLanguage) || SA_LANGUAGES[0];

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
                    {currentScript.warningExplanation(warningLevel)}
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