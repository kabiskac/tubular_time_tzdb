"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendPopulationAndCountries = exports.getPopulationAndCountries = exports.getCountries = exports.getPopulation = exports.populationAndCountryData = void 0;
const util_1 = require("@tubular/util");
/* eslint-disable quote-props */
// noinspection SpellCheckingInspection
exports.populationAndCountryData = {
    'Africa/Abidjan': '48e5;BF CI GM GN ML MR SH SL SN TG',
    'Africa/Accra': '41e5;GH',
    'Africa/Addis_Ababa': '47e5;DJ ER ET KE KM MG SO TZ UG YT',
    'Africa/Algiers': '26e5;DZ',
    'Africa/Asmara': '47e5;DJ ER ET KE KM MG SO TZ UG YT',
    'Africa/Asmera': '47e5;DJ ER ET KE KM MG SO TZ UG YT',
    'Africa/Bamako': '48e5;BF CI GM GN ML MR SH SL SN TG',
    'Africa/Bangui': '17e6;AO BJ CD CF CG CM GA GQ NE NG',
    'Africa/Banjul': '48e5;BF CI GM GN ML MR SH SL SN TG',
    'Africa/Bissau': '39e4;GW',
    'Africa/Blantyre': '26e5;BI BW CD MW MZ RW ZM ZW',
    'Africa/Brazzaville': '17e6;AO BJ CD CF CG CM GA GQ NE NG',
    'Africa/Bujumbura': '26e5;BI BW CD MW MZ RW ZM ZW',
    'Africa/Cairo': '15e6;EG',
    'Africa/Casablanca': '32e5;MA',
    'Africa/Ceuta': '85e3;ES',
    'Africa/Conakry': '48e5;BF CI GM GN ML MR SH SL SN TG',
    'Africa/Dakar': '48e5;BF CI GM GN ML MR SH SL SN TG',
    'Africa/Dar_es_Salaam': '47e5;DJ ER ET KE KM MG SO TZ UG YT',
    'Africa/Djibouti': '47e5;DJ ER ET KE KM MG SO TZ UG YT',
    'Africa/Douala': '17e6;AO BJ CD CF CG CM GA GQ NE NG',
    'Africa/El_Aaiun': '20e4;EH',
    'Africa/Freetown': '48e5;BF CI GM GN ML MR SH SL SN TG',
    'Africa/Gaborone': '26e5;BI BW CD MW MZ RW ZM ZW',
    'Africa/Harare': '26e5;BI BW CD MW MZ RW ZM ZW',
    'Africa/Johannesburg': '84e5;LS SZ ZA',
    'Africa/Juba': ';SS',
    'Africa/Kampala': '47e5;DJ ER ET KE KM MG SO TZ UG YT',
    'Africa/Khartoum': '51e5;SD',
    'Africa/Kigali': '26e5;BI BW CD MW MZ RW ZM ZW',
    'Africa/Kinshasa': '17e6;AO BJ CD CF CG CM GA GQ NE NG',
    'Africa/Lagos': '17e6;AO BJ CD CF CG CM GA GQ NE NG',
    'Africa/Libreville': '17e6;AO BJ CD CF CG CM GA GQ NE NG',
    'Africa/Lome': '48e5;BF CI GM GN ML MR SH SL SN TG',
    'Africa/Luanda': '17e6;AO BJ CD CF CG CM GA GQ NE NG',
    'Africa/Lubumbashi': '26e5;BI BW CD MW MZ RW ZM ZW',
    'Africa/Lusaka': '26e5;BI BW CD MW MZ RW ZM ZW',
    'Africa/Malabo': '17e6;AO BJ CD CF CG CM GA GQ NE NG',
    'Africa/Maputo': '26e5;BI BW CD MW MZ RW ZM ZW',
    'Africa/Maseru': '84e5;LS SZ ZA',
    'Africa/Mbabane': '84e5;LS SZ ZA',
    'Africa/Mogadishu': '47e5;DJ ER ET KE KM MG SO TZ UG YT',
    'Africa/Monrovia': '11e5;LR',
    'Africa/Nairobi': '47e5;DJ ER ET KE KM MG SO TZ UG YT',
    'Africa/Ndjamena': '13e5;TD',
    'Africa/Niamey': '17e6;AO BJ CD CF CG CM GA GQ NE NG',
    'Africa/Nouakchott': '48e5;BF CI GM GN ML MR SH SL SN TG',
    'Africa/Ouagadougou': '48e5;BF CI GM GN ML MR SH SL SN TG',
    'Africa/Porto-Novo': '17e6;AO BJ CD CF CG CM GA GQ NE NG',
    'Africa/Sao_Tome': ';ST',
    'Africa/Timbuktu': '48e5;BF CI GM GN ML MR SH SL SN TG',
    'Africa/Tripoli': '11e5;LY',
    'Africa/Tunis': '20e5;TN',
    'Africa/Windhoek': '32e4;NA',
    'America/Adak': '326;US',
    'America/Anchorage': '30e4;US',
    'America/Anguilla': '43e3;AG AI BL DM GD GP KN LC MF MS TT VC VG VI',
    'America/Antigua': '43e3;AG AI BL DM GD GP KN LC MF MS TT VC VG VI',
    'America/Araguaina': '14e4;BR',
    'America/Argentina/Buenos_Aires': ';AR',
    'America/Argentina/Catamarca': ';AR',
    'America/Argentina/ComodRivadavia': ';AR',
    'America/Argentina/Cordoba': ';AR',
    'America/Argentina/Jujuy': ';AR',
    'America/Argentina/La_Rioja': ';AR',
    'America/Argentina/Mendoza': ';AR',
    'America/Argentina/Rio_Gallegos': ';AR',
    'America/Argentina/Salta': ';AR',
    'America/Argentina/San_Juan': ';AR',
    'America/Argentina/San_Luis': ';AR',
    'America/Argentina/Tucuman': ';AR',
    'America/Argentina/Ushuaia': ';AR',
    'America/Aruba': '15e4;AW BQ CW SX',
    'America/Asuncion': '28e5;PY',
    'America/Atikokan': '28e2;CA',
    'America/Atka': '326;US',
    'America/Bahia': '27e5;BR',
    'America/Bahia_Banderas': '84e3;MX',
    'America/Barbados': '28e4;BB',
    'America/Belem': '20e5;BR',
    'America/Belize': '57e3;BZ',
    'America/Blanc-Sablon': '11e2;CA',
    'America/Boa_Vista': '62e2;BR',
    'America/Bogota': '90e5;CO',
    'America/Boise': '21e4;US',
    'America/Buenos_Aires': ';AR',
    'America/Cambridge_Bay': '15e2;CA',
    'America/Campo_Grande': '77e4;BR',
    'America/Cancun': '63e4;MX',
    'America/Caracas': '29e5;VE',
    'America/Catamarca': ';AR',
    'America/Cayenne': '58e3;GF',
    'America/Cayman': '15e5;KY PA',
    'America/Chicago': '92e5;US',
    'America/Chihuahua': '81e4;MX',
    'America/Coral_Harbour': '28e2;CA',
    'America/Cordoba': ';AR',
    'America/Costa_Rica': '12e5;CR',
    'America/Creston': '53e2;CA',
    'America/Cuiaba': '54e4;BR',
    'America/Curacao': '15e4;AW BQ CW SX',
    'America/Danmarkshavn': '8;GL',
    'America/Dawson': '13e2;CA',
    'America/Dawson_Creek': '12e3;CA',
    'America/Denver': '26e5;US',
    'America/Detroit': '37e5;US',
    'America/Dominica': '43e3;AG AI BL DM GD GP KN LC MF MS TT VC VG VI',
    'America/Edmonton': '10e5;CA',
    'America/Eirunepe': '31e3;BR',
    'America/El_Salvador': '11e5;SV',
    'America/Ensenada': '20e5;MX',
    'America/Fort_Nelson': '39e2;CA',
    'America/Fortaleza': '34e5;BR',
    'America/Glace_Bay': '19e3;CA',
    'America/Godthab': '17e3;',
    'America/Goose_Bay': '76e2;CA',
    'America/Grand_Turk': '37e2;TC',
    'America/Grenada': '43e3;AG AI BL DM GD GP KN LC MF MS TT VC VG VI',
    'America/Guadeloupe': '43e3;AG AI BL DM GD GP KN LC MF MS TT VC VG VI',
    'America/Guatemala': '13e5;GT',
    'America/Guayaquil': '27e5;EC',
    'America/Guyana': '80e4;GY',
    'America/Halifax': '39e4;CA',
    'America/Havana': '21e5;CU',
    'America/Hermosillo': '64e4;MX',
    'America/Indiana/Indianapolis': ';US',
    'America/Indiana/Knox': ';US',
    'America/Indiana/Marengo': ';US',
    'America/Indiana/Petersburg': ';US',
    'America/Indiana/Tell_City': ';US',
    'America/Indiana/Vevay': ';US',
    'America/Indiana/Vincennes': ';US',
    'America/Indiana/Winamac': ';US',
    'America/Inuvik': '35e2;CA',
    'America/Iqaluit': '67e2;CA',
    'America/Jamaica': '94e4;JM',
    'America/Jujuy': ';AR',
    'America/Juneau': '33e3;US',
    'America/Kentucky/Louisville': ';US',
    'America/Kentucky/Monticello': ';US',
    'America/Knox_IN': ';US',
    'America/Kralendijk': '15e4;AW BQ CW SX',
    'America/La_Paz': '19e5;BO',
    'America/Lima': '11e6;PE',
    'America/Los_Angeles': '15e6;US',
    'America/Louisville': ';US',
    'America/Lower_Princes': '15e4;AW BQ CW SX',
    'America/Maceio': '93e4;BR',
    'America/Managua': '22e5;NI',
    'America/Manaus': '19e5;BR',
    'America/Marigot': '43e3;AG AI BL DM GD GP KN LC MF MS TT VC VG VI',
    'America/Martinique': '39e4;MQ',
    'America/Matamoros': '45e4;MX',
    'America/Mazatlan': '44e4;MX',
    'America/Mendoza': ';AR',
    'America/Menominee': '85e2;US',
    'America/Merida': '11e5;MX',
    'America/Metlakatla': '14e2;US',
    'America/Mexico_City': '20e6;MX',
    'America/Miquelon': '61e2;PM',
    'America/Moncton': '64e3;CA',
    'America/Monterrey': '41e5;MX',
    'America/Montevideo': '17e5;UY',
    'America/Montreal': '65e5;CA',
    'America/Montserrat': '43e3;AG AI BL DM GD GP KN LC MF MS TT VC VG VI',
    'America/Nassau': '24e4;BS',
    'America/New_York': '21e6;US',
    'America/Nipigon': '16e2;CA',
    'America/Nome': '38e2;US',
    'America/Noronha': '30e2;BR',
    'America/North_Dakota/Beulah': ';US',
    'America/North_Dakota/Center': ';US',
    'America/North_Dakota/New_Salem': ';US',
    'America/Nuuk': '17e3;GL',
    'America/Ojinaga': '23e3;MX',
    'America/Panama': '15e5;KY PA',
    'America/Pangnirtung': '14e2;CA',
    'America/Paramaribo': '24e4;SR',
    'America/Phoenix': '42e5;US',
    'America/Port-au-Prince': '23e5;HT',
    'America/Port_of_Spain': '43e3;AG AI BL DM GD GP KN LC MF MS TT VC VG VI',
    'America/Porto_Acre': '31e4;BR',
    'America/Porto_Velho': '37e4;BR',
    'America/Puerto_Rico': '24e5;PR',
    'America/Punta_Arenas': ';CL',
    'America/Rainy_River': '842;CA',
    'America/Rankin_Inlet': '26e2;CA',
    'America/Recife': '33e5;BR',
    'America/Regina': '19e4;CA',
    'America/Resolute': '229;CA',
    'America/Rio_Branco': '31e4;BR',
    'America/Rosario': ';AR',
    'America/Santa_Isabel': '20e5;MX',
    'America/Santarem': '21e4;BR',
    'America/Santiago': '62e5;CL',
    'America/Santo_Domingo': '29e5;DO',
    'America/Sao_Paulo': '20e6;BR',
    'America/Scoresbysund': '452;GL',
    'America/Shiprock': '26e5;US',
    'America/Sitka': '90e2;US',
    'America/St_Barthelemy': '43e3;AG AI BL DM GD GP KN LC MF MS TT VC VG VI',
    'America/St_Johns': '11e4;CA',
    'America/St_Kitts': '43e3;AG AI BL DM GD GP KN LC MF MS TT VC VG VI',
    'America/St_Lucia': '43e3;AG AI BL DM GD GP KN LC MF MS TT VC VG VI',
    'America/St_Thomas': '43e3;AG AI BL DM GD GP KN LC MF MS TT VC VG VI',
    'America/St_Vincent': '43e3;AG AI BL DM GD GP KN LC MF MS TT VC VG VI',
    'America/Swift_Current': '16e3;CA',
    'America/Tegucigalpa': '11e5;HN',
    'America/Thule': '656;GL',
    'America/Thunder_Bay': '11e4;CA',
    'America/Tijuana': '20e5;MX',
    'America/Toronto': '65e5;CA',
    'America/Tortola': '43e3;AG AI BL DM GD GP KN LC MF MS TT VC VG VI',
    'America/Vancouver': '23e5;CA',
    'America/Virgin': '43e3;AG AI BL DM GD GP KN LC MF MS TT VC VG VI',
    'America/Whitehorse': '23e3;CA',
    'America/Winnipeg': '66e4;CA',
    'America/Yakutat': '642;US',
    'America/Yellowknife': '19e3;CA',
    'Antarctica/Casey': '10;AQ',
    'Antarctica/Davis': '70;AQ',
    'Antarctica/DumontDUrville': '80;AQ',
    'Antarctica/Macquarie': '1;AU',
    'Antarctica/Mawson': '60;AQ',
    'Antarctica/McMurdo': '14e5;AQ NZ',
    'Antarctica/Palmer': '40;AQ',
    'Antarctica/Rothera': '130;AQ',
    'Antarctica/South_Pole': '14e5;AQ NZ',
    'Antarctica/Syowa': '20;AQ',
    'Antarctica/Troll': '40;AQ',
    'Antarctica/Vostok': '25;AQ',
    'Arctic/Longyearbyen': '62e4;NO SJ',
    'Asia/Aden': '57e5;KW SA YE',
    'Asia/Almaty': '15e5;KZ',
    'Asia/Amman': '25e5;JO',
    'Asia/Anadyr': '13e3;RU',
    'Asia/Aqtau': '15e4;KZ',
    'Asia/Aqtobe': '27e4;KZ',
    'Asia/Ashgabat': '41e4;TM',
    'Asia/Ashkhabad': '41e4;TM',
    'Asia/Atyrau': ';KZ',
    'Asia/Baghdad': '66e5;IQ',
    'Asia/Bahrain': '96e4;BH QA',
    'Asia/Baku': '27e5;AZ',
    'Asia/Bangkok': '15e6;KH LA TH VN',
    'Asia/Barnaul': ';RU',
    'Asia/Beirut': '22e5;LB',
    'Asia/Bishkek': '87e4;KG',
    'Asia/Brunei': '42e4;BN',
    'Asia/Calcutta': '15e6;IN',
    'Asia/Chita': '33e4;RU',
    'Asia/Choibalsan': '38e3;MN',
    'Asia/Chongqing': '23e6;CN',
    'Asia/Chungking': '23e6;CN',
    'Asia/Colombo': '22e5;LK',
    'Asia/Dacca': '16e6;BD',
    'Asia/Damascus': '26e5;SY',
    'Asia/Dhaka': '16e6;BD',
    'Asia/Dili': '19e4;TL',
    'Asia/Dubai': '39e5;AE OM',
    'Asia/Dushanbe': '76e4;TJ',
    'Asia/Famagusta': ';CY',
    'Asia/Gaza': '18e5;PS',
    'Asia/Harbin': '23e6;CN',
    'Asia/Hebron': '25e4;PS',
    'Asia/Ho_Chi_Minh': '90e5;VN',
    'Asia/Hong_Kong': '73e5;HK',
    'Asia/Hovd': '81e3;MN',
    'Asia/Irkutsk': '60e4;RU',
    'Asia/Istanbul': '13e6;TR',
    'Asia/Jakarta': '31e6;ID',
    'Asia/Jayapura': '26e4;ID',
    'Asia/Jerusalem': '81e4;IL',
    'Asia/Kabul': '46e5;AF',
    'Asia/Kamchatka': '18e4;RU',
    'Asia/Karachi': '24e6;PK',
    'Asia/Kashgar': '32e5;CN',
    'Asia/Kathmandu': '12e5;NP',
    'Asia/Katmandu': '12e5;NP',
    'Asia/Khandyga': '66e2;RU',
    'Asia/Kolkata': '15e6;IN',
    'Asia/Krasnoyarsk': '10e5;RU',
    'Asia/Kuala_Lumpur': '71e5;MY',
    'Asia/Kuching': '13e4;MY',
    'Asia/Kuwait': '57e5;KW SA YE',
    'Asia/Macao': '57e4;MO',
    'Asia/Macau': '57e4;MO',
    'Asia/Magadan': '95e3;RU',
    'Asia/Makassar': '15e5;ID',
    'Asia/Manila': '24e6;PH',
    'Asia/Muscat': '39e5;AE OM',
    'Asia/Nicosia': '32e4;CY',
    'Asia/Novokuznetsk': '55e4;RU',
    'Asia/Novosibirsk': '15e5;RU',
    'Asia/Omsk': '12e5;RU',
    'Asia/Oral': '27e4;KZ',
    'Asia/Phnom_Penh': '15e6;KH LA TH VN',
    'Asia/Pontianak': '23e4;ID',
    'Asia/Pyongyang': '29e5;KP',
    'Asia/Qatar': '96e4;BH QA',
    'Asia/Qostanay': ';KZ',
    'Asia/Qyzylorda': '73e4;KZ',
    'Asia/Rangoon': '48e5;',
    'Asia/Riyadh': '57e5;KW SA YE',
    'Asia/Saigon': '90e5;VN',
    'Asia/Sakhalin': '58e4;RU',
    'Asia/Samarkand': '36e4;UZ',
    'Asia/Seoul': '23e6;KR',
    'Asia/Shanghai': '23e6;CN',
    'Asia/Singapore': '71e5;MY',
    'Asia/Srednekolymsk': '35e2;RU',
    'Asia/Taipei': '74e5;TW',
    'Asia/Tashkent': '23e5;UZ',
    'Asia/Tbilisi': '11e5;GE',
    'Asia/Tehran': '14e6;IR',
    'Asia/Tel_Aviv': '81e4;IL',
    'Asia/Thimbu': '79e3;BT',
    'Asia/Thimphu': '79e3;BT',
    'Asia/Tokyo': '38e6;JP',
    'Asia/Tomsk': '10e5;RU',
    'Asia/Ujung_Pandang': '15e5;ID',
    'Asia/Ulaanbaatar': '12e5;MN',
    'Asia/Ulan_Bator': '12e5;MN',
    'Asia/Urumqi': '32e5;CN',
    'Asia/Ust-Nera': '65e2;RU',
    'Asia/Vientiane': '15e6;KH LA TH VN',
    'Asia/Vladivostok': '60e4;RU',
    'Asia/Yakutsk': '28e4;RU',
    'Asia/Yangon': '48e5;MM',
    'Asia/Yekaterinburg': '14e5;RU',
    'Asia/Yerevan': '13e5;AM',
    'Atlantic/Azores': '25e4;PT',
    'Atlantic/Bermuda': '65e3;BM',
    'Atlantic/Canary': '54e4;ES',
    'Atlantic/Cape_Verde': '50e4;CV',
    'Atlantic/Faeroe': '49e3;FO',
    'Atlantic/Faroe': '49e3;FO',
    'Atlantic/Jan_Mayen': '62e4;NO SJ',
    'Atlantic/Madeira': '27e4;PT',
    'Atlantic/Reykjavik': '12e4;IS',
    'Atlantic/South_Georgia': '30;GS',
    'Atlantic/St_Helena': '48e5;BF CI GM GN ML MR SH SL SN TG',
    'Atlantic/Stanley': '21e2;FK',
    'Australia/ACT': '40e5;AU',
    'Australia/Adelaide': '11e5;AU',
    'Australia/Brisbane': '20e5;AU',
    'Australia/Broken_Hill': '18e3;AU',
    'Australia/Canberra': '40e5;AU',
    'Australia/Currie': '746;AU',
    'Australia/Darwin': '12e4;AU',
    'Australia/Eucla': '368;AU',
    'Australia/Hobart': '21e4;AU',
    'Australia/LHI': '347;AU',
    'Australia/Lindeman': '10;AU',
    'Australia/Lord_Howe': '347;AU',
    'Australia/Melbourne': '39e5;AU',
    'Australia/NSW': '40e5;AU',
    'Australia/North': '12e4;AU',
    'Australia/Perth': '18e5;AU',
    'Australia/Queensland': '20e5;AU',
    'Australia/South': '11e5;AU',
    'Australia/Sydney': '40e5;AU',
    'Australia/Tasmania': '21e4;AU',
    'Australia/Victoria': '39e5;AU',
    'Australia/West': '18e5;AU',
    'Australia/Yancowinna': '18e3;AU',
    'Brazil/Acre': '31e4;BR',
    'Brazil/DeNoronha': '30e2;BR',
    'Brazil/East': '20e6;BR',
    'Brazil/West': '19e5;BR',
    'Canada/Atlantic': '39e4;CA',
    'Canada/Central': '66e4;CA',
    'Canada/Eastern': '65e5;CA',
    'Canada/Mountain': '10e5;CA',
    'Canada/Newfoundland': '11e4;CA',
    'Canada/Pacific': '23e5;CA',
    'Canada/Saskatchewan': '19e4;CA',
    'Canada/Yukon': '23e3;CA',
    'Chile/Continental': '62e5;CL',
    'Chile/EasterIsland': '30e2;CL',
    'Cuba': '21e5;CU',
    'Egypt': '15e6;EG',
    'Eire': '12e5;IE',
    'Etc/GMT+2': '30;GS',
    'Etc/GMT-10': '25e4;PG',
    'Etc/GMT-12': '29e3;KI',
    'Etc/GMT-7': '21e2;CX',
    'Etc/GMT-9': '21e3;PW',
    'Europe/Amsterdam': '16e5;NL',
    'Europe/Andorra': '79e3;AD',
    'Europe/Astrakhan': '10e5;RU',
    'Europe/Athens': '35e5;GR',
    'Europe/Belfast': '10e6;GB GG IM JE',
    'Europe/Belgrade': '12e5;BA HR ME MK RS SI',
    'Europe/Berlin': '41e5;DE',
    'Europe/Bratislava': '13e5;CZ SK',
    'Europe/Brussels': '21e5;BE',
    'Europe/Bucharest': '19e5;RO',
    'Europe/Budapest': '17e5;HU',
    'Europe/Busingen': '38e4;CH DE LI',
    'Europe/Chisinau': '67e4;MD',
    'Europe/Copenhagen': '12e5;DK',
    'Europe/Dublin': '12e5;IE',
    'Europe/Gibraltar': '30e3;GI',
    'Europe/Guernsey': '10e6;GB GG IM JE',
    'Europe/Helsinki': '12e5;AX FI',
    'Europe/Isle_of_Man': '10e6;GB GG IM JE',
    'Europe/Istanbul': '13e6;TR',
    'Europe/Jersey': '10e6;GB GG IM JE',
    'Europe/Kaliningrad': '44e4;RU',
    'Europe/Kiev': '34e5;UA',
    'Europe/Kirov': '48e4;RU',
    'Europe/Lisbon': '27e5;PT',
    'Europe/Ljubljana': '12e5;BA HR ME MK RS SI',
    'Europe/London': '10e6;GB GG IM JE',
    'Europe/Luxembourg': '54e4;LU',
    'Europe/Madrid': '62e5;ES',
    'Europe/Malta': '42e4;MT',
    'Europe/Mariehamn': '12e5;AX FI',
    'Europe/Minsk': '19e5;BY',
    'Europe/Monaco': '38e3;MC',
    'Europe/Moscow': '16e6;RU',
    'Europe/Nicosia': '32e4;CY',
    'Europe/Oslo': '62e4;NO SJ',
    'Europe/Paris': '11e6;FR',
    'Europe/Podgorica': '12e5;BA HR ME MK RS SI',
    'Europe/Prague': '13e5;CZ SK',
    'Europe/Riga': '64e4;LV',
    'Europe/Rome': '39e5;IT SM VA',
    'Europe/Samara': '12e5;RU',
    'Europe/San_Marino': '39e5;IT SM VA',
    'Europe/Sarajevo': '12e5;BA HR ME MK RS SI',
    'Europe/Saratov': ';RU',
    'Europe/Simferopol': '33e4;RU UA',
    'Europe/Skopje': '12e5;BA HR ME MK RS SI',
    'Europe/Sofia': '12e5;BG',
    'Europe/Stockholm': '15e5;SE',
    'Europe/Tallinn': '41e4;EE',
    'Europe/Tirane': '42e4;AL',
    'Europe/Tiraspol': '67e4;MD',
    'Europe/Ulyanovsk': '13e5;RU',
    'Europe/Uzhgorod': '11e4;UA',
    'Europe/Vaduz': '38e4;CH DE LI',
    'Europe/Vatican': '39e5;IT SM VA',
    'Europe/Vienna': '18e5;AT',
    'Europe/Vilnius': '54e4;LT',
    'Europe/Volgograd': '10e5;RU',
    'Europe/Warsaw': '17e5;PL',
    'Europe/Zagreb': '12e5;BA HR ME MK RS SI',
    'Europe/Zaporozhye': '77e4;UA',
    'Europe/Zurich': '38e4;CH DE LI',
    'GB': '10e6;GB GG IM JE',
    'GB-Eire': '10e6;GB GG IM JE',
    'Hongkong': '73e5;HK',
    'Iceland': '12e4;IS',
    'Indian/Antananarivo': '47e5;DJ ER ET KE KM MG SO TZ UG YT',
    'Indian/Chagos': '30e2;IO',
    'Indian/Christmas': '21e2;CX',
    'Indian/Cocos': '596;CC',
    'Indian/Comoro': '47e5;DJ ER ET KE KM MG SO TZ UG YT',
    'Indian/Kerguelen': '130;TF',
    'Indian/Mahe': '79e3;SC',
    'Indian/Maldives': '35e4;MV',
    'Indian/Mauritius': '15e4;MU',
    'Indian/Mayotte': '47e5;DJ ER ET KE KM MG SO TZ UG YT',
    'Indian/Reunion': '84e4;RE TF',
    'Iran': '14e6;IR',
    'Israel': '81e4;IL',
    'Jamaica': '94e4;JM',
    'Japan': '38e6;JP',
    'Kwajalein': '14e3;MH',
    'Libya': '11e5;LY',
    'Mexico/BajaNorte': '20e5;MX',
    'Mexico/BajaSur': '44e4;MX',
    'Mexico/General': '20e6;MX',
    'NZ': '14e5;AQ NZ',
    'NZ-CHAT': '600;NZ',
    'Navajo': '26e5;US',
    'PRC': '23e6;CN',
    'Pacific/Apia': '37e3;WS',
    'Pacific/Auckland': '14e5;AQ NZ',
    'Pacific/Bougainville': '18e4;PG',
    'Pacific/Chatham': '600;NZ',
    'Pacific/Chuuk': '49e3;FM',
    'Pacific/Easter': '30e2;CL',
    'Pacific/Efate': '66e3;VU',
    'Pacific/Enderbury': '1;KI',
    'Pacific/Fakaofo': '483;TK',
    'Pacific/Fiji': '88e4;FJ',
    'Pacific/Funafuti': '29e3;KI',
    'Pacific/Galapagos': '25e3;EC',
    'Pacific/Gambier': '125;PF',
    'Pacific/Guadalcanal': '11e4;SB',
    'Pacific/Guam': '17e4;GU MP',
    'Pacific/Honolulu': '37e4;UM US',
    'Pacific/Johnston': '37e4;UM US',
    'Pacific/Kanton': '1;KI',
    'Pacific/Kiritimati': '51e2;KI',
    'Pacific/Kosrae': '66e2;FM',
    'Pacific/Kwajalein': '14e3;MH',
    'Pacific/Majuro': '28e3;MH',
    'Pacific/Marquesas': '86e2;PF',
    'Pacific/Midway': '37e2;AS UM',
    'Pacific/Nauru': '10e3;NR',
    'Pacific/Niue': '12e2;NU',
    'Pacific/Norfolk': '25e4;NF',
    'Pacific/Noumea': '98e3;NC',
    'Pacific/Pago_Pago': '37e2;AS UM',
    'Pacific/Palau': '21e3;PW',
    'Pacific/Pitcairn': '56;PN',
    'Pacific/Pohnpei': '34e3;FM',
    'Pacific/Ponape': '34e3;FM',
    'Pacific/Port_Moresby': '25e4;PG',
    'Pacific/Rarotonga': '13e3;CK',
    'Pacific/Saipan': '17e4;GU MP',
    'Pacific/Samoa': '37e2;AS UM',
    'Pacific/Tahiti': '18e4;PF',
    'Pacific/Tarawa': '29e3;KI',
    'Pacific/Tongatapu': '75e3;TO',
    'Pacific/Truk': '49e3;FM',
    'Pacific/Wake': '29e3;KI',
    'Pacific/Wallis': '29e3;KI',
    'Pacific/Yap': '49e3;FM',
    'Poland': '17e5;PL',
    'Portugal': '27e5;PT',
    'ROC': '74e5;TW',
    'ROK': '23e6;KR',
    'Singapore': '71e5;MY',
    'Turkey': '13e6;TR',
    'US/Alaska': '30e4;US',
    'US/Aleutian': '326;US',
    'US/Arizona': '42e5;US',
    'US/Central': '92e5;US',
    'US/Eastern': '21e6;US',
    'US/Hawaii': '37e4;UM US',
    'US/Indiana-Starke': ';US',
    'US/Michigan': '37e5;US',
    'US/Mountain': '26e5;US',
    'US/Pacific': '15e6;US',
    'US/Samoa': '37e2;AS UM',
    'W-SU': '16e6;RU'
};
function getPopulation(zoneId) {
    const info = exports.populationAndCountryData[zoneId];
    if (info) {
        const parts = info.split(';');
        if (parts.length > 0)
            return (0, util_1.toNumber)(parts[0]);
    }
    return 0;
}
exports.getPopulation = getPopulation;
function getCountries(zoneId) {
    const info = exports.populationAndCountryData[zoneId];
    if (info) {
        const parts = info.split(';');
        if (parts.length > 1)
            return parts[1];
    }
    return null;
}
exports.getCountries = getCountries;
function getPopulationAndCountries(zoneId) {
    let info = exports.populationAndCountryData[zoneId];
    if (info) {
        const parts = info.split(';');
        if (parts.length > 1) {
            const countries = parts[1].split(' ');
            let not2 = false;
            for (const country of countries) {
                if (country.length !== 2) {
                    not2 = true;
                    break;
                }
            }
            if (!not2)
                info = info.replace(/ /g, '');
        }
        return info;
    }
    return null;
}
exports.getPopulationAndCountries = getPopulationAndCountries;
function appendPopulationAndCountries(zoneData, zoneId) {
    const info = getPopulationAndCountries(zoneId);
    if (info) {
        const partsCount = zoneData.split(';').length;
        zoneData += ';'.repeat(6 - partsCount) + info;
    }
    else
        zoneData = zoneData.replace(/;+$/, '');
    return zoneData;
}
exports.appendPopulationAndCountries = appendPopulationAndCountries;
//# sourceMappingURL=population-and-country-data.js.map