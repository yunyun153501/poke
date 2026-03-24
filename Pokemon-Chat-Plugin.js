//@name Pokemon Battle
//@display-name 🎮 포켓몬 배틀 (Gen 1-6)
//@api 3.0
//@version 2.0
//@arg pokemon_save string "" "포켓몬 세이브 데이터"
//@arg pokemon_state string "" "게임 상태 데이터"

(async () => {
try {

// ═══════════════════════════════════════════════
// 📌 상수 & 유틸리티
// ═══════════════════════════════════════════════
const PLUGIN = "[Pokemon]";
const UI_ID = "poke-container";
const STYLE_ID = "poke-style";
const KEY_SAVE = "Pokemon Battle::pokemon_save";
const KEY_STATE = "Pokemon Battle::pokemon_state";
const KEY_VIS = "pokemon_visible";
const KEY_SLOT = "Pokemon Battle::pokemon_slot_";
const MAX_PARTY = 6;
const MAX_LEVEL = 100;

var _hasRisu = (typeof Risuai !== 'undefined');
var _ls = _hasRisu ? Risuai.safeLocalStorage : null;

async function lsGet(k) { try { if (_ls) return await _ls.getItem(k); return localStorage.getItem(k); } catch(e) { return null; } }
async function lsSet(k, v) { try { if (_ls) await _ls.setItem(k, String(v)); else localStorage.setItem(k, String(v)); } catch(e) {} }

function rng(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rngf(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ═══════════════════════════════════════════════
// 🔥 타입 상성표
// ═══════════════════════════════════════════════
var TYPES = ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"];

var TYPE_CHART = {
normal:   {rock:0.5, ghost:0, steel:0.5},
fire:     {fire:0.5, water:0.5, grass:2, ice:2, bug:2, rock:0.5, dragon:0.5, steel:2},
water:    {fire:2, water:0.5, grass:0.5, ground:2, rock:2, dragon:0.5},
electric: {water:2, electric:0.5, grass:0.5, ground:0, flying:2, dragon:0.5},
grass:    {fire:0.5, water:2, grass:0.5, poison:0.5, ground:2, flying:0.5, bug:0.5, rock:2, dragon:0.5, steel:0.5},
ice:      {fire:0.5, water:0.5, grass:2, ice:0.5, ground:2, flying:2, dragon:2, steel:0.5},
fighting: {normal:2, ice:2, poison:0.5, flying:0.5, psychic:0.5, bug:0.5, rock:2, ghost:0, dark:2, steel:2, fairy:0.5},
poison:   {grass:2, poison:0.5, ground:0.5, rock:0.5, ghost:0.5, steel:0, fairy:2},
ground:   {fire:2, electric:2, grass:0.5, poison:2, flying:0, bug:0.5, rock:2, steel:2},
flying:   {electric:0.5, grass:2, fighting:2, bug:2, rock:0.5, steel:0.5},
psychic:  {fighting:2, poison:2, psychic:0.5, dark:0, steel:0.5},
bug:      {fire:0.5, grass:2, fighting:0.5, poison:0.5, flying:0.5, psychic:2, ghost:0.5, dark:2, steel:0.5, fairy:0.5},
rock:     {fire:2, ice:2, fighting:0.5, ground:0.5, flying:2, bug:2, steel:0.5},
ghost:    {normal:0, psychic:2, ghost:2, dark:0.5},
dragon:   {dragon:2, steel:0.5, fairy:0},
dark:     {fighting:0.5, psychic:2, ghost:2, dark:0.5, fairy:0.5},
steel:    {fire:0.5, water:0.5, electric:0.5, ice:2, rock:2, steel:0.5, fairy:2},
fairy:    {fire:0.5, poison:0.5, fighting:2, dragon:2, dark:2, steel:0.5}
};

function getTypeEffect(atkType, defTypes) {
    var mult = 1;
    var chart = TYPE_CHART[atkType] || {};
    for (var i = 0; i < defTypes.length; i++) {
        var e = chart[defTypes[i]];
        if (e !== undefined) mult *= e;
    }
    return mult;
}

// ═══════════════════════════════════════════════
// 📖 포켓몬 데이터베이스 (Gen 1-4)
// ═══════════════════════════════════════════════
var POKEDEX = {
// ── Gen 1 스타터 ──
bulbasaur:  {n:"이상해씨",id:1,t:["grass","poison"],s:[45,49,49,65,65,45],ml:{1:["tackle","growl"],5:["vinewhip"],7:["leechseed"],13:["poisonpowder"],15:["sleeppowder"],20:["razorleaf"],25:["gigadrain"]},e:{l:16,to:"ivysaur"},ab:["overgrow","chlorophyll"],cr:45,xp:64,em:"🌿"},
ivysaur:    {n:"이상해풀",id:2,t:["grass","poison"],s:[60,62,63,80,80,60],ml:{1:["tackle","growl","vinewhip"],13:["poisonpowder"],20:["razorleaf"],27:["sleeppowder"],30:["gigadrain"],34:["solarbeam"]},e:{l:32,to:"venusaur"},ab:["overgrow","chlorophyll"],cr:45,xp:142,em:"🌿"},
venusaur:   {n:"이상해꽃",id:3,t:["grass","poison"],s:[80,82,83,100,100,80],ml:{1:["tackle","vinewhip","razorleaf"],20:["poisonpowder"],27:["leechseed"],34:["gigadrain"],38:["sleeppowder"],44:["sludgebomb"],50:["solarbeam"],56:["petalblizzard"]},e:null,ab:["overgrow","chlorophyll"],cr:45,xp:236,em:"🌺"},
charmander: {n:"파이리",id:4,t:["fire"],s:[39,52,43,60,50,65],ml:{1:["scratch","growl"],7:["ember"],10:["smokescreen"],16:["dragonbreath"],22:["flamethrower"],25:["slash"]},e:{l:16,to:"charmeleon"},ab:"blaze",cr:45,xp:62,em:"🔥"},
charmeleon: {n:"리자드",id:5,t:["fire"],s:[58,64,58,80,65,80],ml:{1:["scratch","ember"],12:["smokescreen"],16:["dragonbreath"],22:["flamethrower"],30:["slash"],36:["flareblitz"]},e:{l:36,to:"charizard"},ab:"blaze",cr:45,xp:142,em:"🔥"},
charizard:  {n:"리자몽",id:6,t:["fire","flying"],s:[78,84,78,109,85,100],ml:{1:["scratch","ember","flamethrower"],28:["wingattack"],36:["airslash"],40:["dragonpulse"],46:["fireblast"],52:["flareblitz"],58:["hyperbeam"]},e:null,ab:["blaze","intimidate"],cr:45,xp:240,em:"🐉"},
squirtle:   {n:"꼬부기",id:7,t:["water"],s:[44,48,65,50,64,43],ml:{1:["tackle","tailwhip"],7:["watergun"],10:["bubblebeam"],13:["bite"],18:["protect"],22:["waterpulse"]},e:{l:16,to:"wartortle"},ab:"torrent",cr:45,xp:63,em:"🐢"},
wartortle:  {n:"어니부기",id:8,t:["water"],s:[59,63,80,65,80,58],ml:{1:["tackle","watergun","bite"],16:["bubblebeam"],22:["waterpulse"],28:["protect"],34:["surf"],40:["icebeam"]},e:{l:36,to:"blastoise"},ab:"torrent",cr:45,xp:142,em:"🐢"},
blastoise:  {n:"거북왕",id:9,t:["water"],s:[79,83,100,85,105,78],ml:{1:["watergun","bite","surf"],28:["protect"],34:["icebeam"],40:["scald"],46:["flashcannon"],52:["hydropump"],58:["hyperbeam"]},e:null,ab:["torrent","waterabsorb"],cr:45,xp:239,em:"🐢"},
// ── Gen 1 초반 ──
caterpie:   {n:"캐터피",id:10,t:["bug"],s:[45,30,35,20,20,45],ml:{1:["tackle","stringshot"],5:["bugbite"],7:["strugglebug"],9:["infestation"]},e:{l:7,to:"metapod"},ab:"shedskin",cr:255,xp:39,em:"🐛"},
metapod:    {n:"단데기",id:11,t:["bug"],s:[50,20,55,25,25,30],ml:{1:["tackle","harden"],7:["stringshot"],10:["irondefense"],12:["bugbite"]},e:{l:10,to:"butterfree"},ab:"shedskin",cr:120,xp:72,em:"🐛"},
butterfree: {n:"버터플",id:12,t:["bug","flying"],s:[60,45,50,90,80,70],ml:{1:["confusion","gust"],12:["sleeppowder"],14:["stunspore"],16:["psybeam"],20:["bugbite"],24:["signalbeam"],28:["psychic"],32:["airslash"],36:["energyball"]},e:null,ab:"compoundeyes",cr:45,xp:178,em:"🦋"},
weedle:     {n:"뿔충이",id:13,t:["bug","poison"],s:[40,35,30,20,20,50],ml:{1:["poisonsting","stringshot"],5:["bugbite"],7:["strugglebug"],9:["infestation"]},e:{l:7,to:"kakuna"},ab:"shedskin",cr:255,xp:39,em:"🐛"},
kakuna:     {n:"딱충이",id:14,t:["bug","poison"],s:[45,25,50,25,25,35],ml:{1:["poisonsting","harden"],7:["stringshot"],10:["acid"],12:["irondefense"]},e:{l:10,to:"beedrill"},ab:"shedskin",cr:120,xp:72,em:"🐛"},
beedrill:   {n:"독침붕",id:15,t:["bug","poison"],s:[65,90,40,45,80,75],ml:{1:["poisonsting","twineedle"],12:["furyattack"],16:["pursuit"],20:["furycutter"],24:["crosspoison"],28:["sludgebomb"],32:["xscissor"],36:["poisonjab"]},e:null,ab:"swarm",cr:45,xp:178,em:"🐝"},
pidgey:     {n:"구구",id:16,t:["normal","flying"],s:[40,45,40,35,35,56],ml:{1:["tackle","gust"],5:["sandattack"],9:["quickattack"],13:["wingattack"],17:["airslash"]},e:{l:18,to:"pidgeotto"},ab:"keeneye",cr:255,xp:50,em:"🐦"},
pidgeotto:  {n:"피죤",id:17,t:["normal","flying"],s:[63,60,55,50,50,71],ml:{1:["tackle","gust","quickattack"],13:["sandattack"],18:["wingattack"],22:["aerialace"],27:["airslash"],30:["roost"]},e:{l:36,to:"pidgeot"},ab:"keeneye",cr:120,xp:122,em:"🐦"},
pidgeot:    {n:"피죤투",id:18,t:["normal","flying"],s:[83,80,75,70,70,101],ml:{1:["wingattack","quickattack","aerialace"],30:["airslash"],36:["roost"],44:["fly"],48:["bravebird"],54:["hyperbeam"],58:["doubleedge"]},e:null,ab:"keeneye",cr:45,xp:216,em:"🦅"},
rattata:    {n:"꼬렛",id:19,t:["normal"],s:[30,56,35,25,35,72],ml:{1:["tackle","tailwhip"],4:["quickattack"],7:["bite"],10:["pursuit"],13:["focusenergy"],16:["crunch"]},e:{l:20,to:"raticate"},ab:"runaway",cr:255,xp:51,em:"🐭"},
raticate:   {n:"레트라",id:20,t:["normal"],s:[55,81,60,50,70,97],ml:{1:["tackle","quickattack","bite"],15:["pursuit"],20:["crunch"],25:["focusenergy"],30:["doubleedge"],35:["facade"],40:["hyperbeam"]},e:null,ab:"guts",cr:127,xp:145,em:"🐭"},
spearow:    {n:"깨비참",id:21,t:["normal","flying"],s:[40,60,30,31,31,70],ml:{1:["peck","growl"],5:["furyattack"],9:["pursuit"],13:["aerialace"],17:["wingattack"]},e:{l:20,to:"fearow"},ab:"keeneye",cr:255,xp:52,em:"🐦"},
fearow:     {n:"깨비드릴조",id:22,t:["normal","flying"],s:[65,90,65,61,61,100],ml:{1:["peck","furyattack","aerialace"],20:["pursuit"],25:["drillpeck"],30:["focusenergy"],37:["fly"],42:["doubleedge"],46:["hyperbeam"]},e:null,ab:"keeneye",cr:90,xp:155,em:"🦅"},
ekans:      {n:"아보",id:23,t:["poison"],s:[35,60,44,40,54,55],ml:{1:["wrap","poisonsting"],9:["bite"],17:["acid"],25:["sludgebomb"]},e:{l:22,to:"arbok"},ab:"intimidate",cr:255,xp:58,em:"🐍"},
arbok:      {n:"아보크",id:24,t:["poison"],s:[60,95,69,65,79,80],ml:{1:["bite","acid","sludgebomb"],30:["crunch"],36:["toxic"]},e:null,ab:"intimidate",cr:90,xp:157,em:"🐍"},
pikachu:    {n:"피카츄",id:25,t:["electric"],s:[35,55,40,50,50,90],ml:{1:["thundershock","growl"],5:["tailwhip"],8:["quickattack"],12:["thunderwave"],15:["thunderbolt"],20:["slam"],25:["wildcharge"]},e:{l:25,to:"raichu"},ab:"staticbody",cr:190,xp:112,em:"⚡"},
raichu:     {n:"라이츄",id:26,t:["electric"],s:[60,90,55,90,80,110],ml:{1:["thundershock","quickattack","thunderbolt"],15:["slam"],20:["thunderwave"],25:["voltswitch"],30:["thunder"],36:["focusenergy"],42:["wildcharge"]},e:null,ab:"staticbody",cr:75,xp:218,em:"⚡"},
sandshrew:  {n:"모래두지",id:27,t:["ground"],s:[50,75,85,20,30,40],ml:{1:["scratch","defensecurl"],6:["sandattack"],11:["mudshot"],17:["slash"],22:["dig"]},e:{l:22,to:"sandslash"},ab:"sandveil",cr:255,xp:60,em:"🦔"},
sandslash:  {n:"고지",id:28,t:["ground"],s:[75,100,110,45,55,65],ml:{1:["scratch","slash","dig"],22:["rockslide"],30:["earthquake"],38:["swordsdance"]},e:null,ab:"sandveil",cr:90,xp:158,em:"🦔"},
nidoranf:   {n:"니드런♀",id:29,t:["poison"],s:[55,47,52,40,40,41],ml:{1:["tackle","growl"],7:["poisonsting"],13:["bite"]},e:{l:16,to:"nidorina"},ab:"poisonpoint",cr:235,xp:55,em:"💜"},
nidorina:   {n:"니드리나",id:30,t:["poison"],s:[70,62,67,55,55,56],ml:{1:["tackle","poisonsting","bite"],20:["toxic"],23:["sludgebomb"],33:["crunch"]},e:{l:36,to:"nidoqueen"},ab:"poisonpoint",cr:120,xp:128,em:"💜"},
nidoqueen:  {n:"니드퀸",id:31,t:["poison","ground"],s:[90,92,87,75,85,76],ml:{1:["poisonsting","bite","sludgebomb"],36:["earthquake"],43:["bodyslam"]},e:null,ab:"poisonpoint",cr:45,xp:227,em:"👑"},
nidoranm:   {n:"니드런♂",id:32,t:["poison"],s:[46,57,40,40,40,50],ml:{1:["tackle","poisonsting"],8:["hornattack"],16:["bite"]},e:{l:16,to:"nidorino"},ab:"poisonpoint",cr:235,xp:55,em:"💜"},
nidorino:   {n:"니드리노",id:33,t:["poison"],s:[61,72,57,55,55,65],ml:{1:["tackle","poisonsting","hornattack"],23:["bite"],32:["sludgebomb"]},e:{l:36,to:"nidoking"},ab:"poisonpoint",cr:120,xp:128,em:"💜"},
nidoking:   {n:"니드킹",id:34,t:["poison","ground"],s:[81,102,77,85,75,85],ml:{1:["poisonsting","hornattack","earthquake"],36:["sludgebomb"],43:["megahorn"],50:["earthquake"]},e:null,ab:"poisonpoint",cr:45,xp:227,em:"👑"},
clefairy:   {n:"삐삐",id:35,t:["fairy"],s:[70,45,48,60,65,35],ml:{1:["tackle","charm"],8:["dazzlinggleam"],16:["moonblast"]},e:{l:30,to:"clefable"},ab:"cutecharm",cr:150,xp:68,em:"🌙"},
clefable:   {n:"픽시",id:36,t:["fairy"],s:[95,70,73,95,90,60],ml:{1:["dazzlinggleam","moonblast","bodyslam"],25:["calmmind"],35:["psychic"],45:["moonlight"]},e:null,ab:"cutecharm",cr:25,xp:217,em:"🌙"},
vulpix:     {n:"식스테일",id:37,t:["fire"],s:[38,41,40,50,65,65],ml:{1:["tackle","ember"],8:["quickattack"],12:["confuseray"],16:["flamethrower"],20:["willowisp"]},e:{l:30,to:"ninetales"},ab:"flashfire",cr:190,xp:60,em:"🦊"},
ninetales:  {n:"나인테일",id:38,t:["fire"],s:[73,76,75,81,100,100],ml:{1:["ember","flamethrower","quickattack"],28:["confuseray"],35:["fireblast"],38:["willowisp"],42:["flareblitz"],46:["energyball"]},e:null,ab:"drought",cr:75,xp:177,em:"🦊"},
jigglypuff: {n:"푸린",id:39,t:["normal","fairy"],s:[115,45,20,45,25,20],ml:{1:["tackle","sing"],8:["pound"],15:["bodyslam"],22:["dazzlinggleam"]},e:{l:28,to:"wigglytuff"},ab:"cutecharm",cr:170,xp:95,em:"🎵"},
wigglytuff: {n:"푸크린",id:40,t:["normal","fairy"],s:[140,70,45,85,50,45],ml:{1:["bodyslam","dazzlinggleam"],30:["moonblast"],36:["hyperbeam"]},e:null,ab:"cutecharm",cr:50,xp:196,em:"🎵"},
zubat:      {n:"주뱃",id:41,t:["poison","flying"],s:[40,45,35,30,40,55],ml:{1:["bite","supersonic"],8:["wingattack"],15:["confuseray"]},e:{l:22,to:"golbat"},ab:"innerfocus",cr:255,xp:49,em:"🦇"},
golbat:     {n:"골뱃",id:42,t:["poison","flying"],s:[75,80,70,65,75,90],ml:{1:["bite","wingattack","confuseray"],28:["crunch"],35:["aerialace"]},e:{l:42,to:"crobat"},ab:"innerfocus",cr:90,xp:159,em:"🦇"},
oddish:     {n:"뚜벅쵸",id:43,t:["grass","poison"],s:[45,50,55,75,65,30],ml:{1:["absorb"],5:["poisonpowder"],9:["razorleaf"],14:["sleeppowder"]},e:{l:21,to:"gloom"},ab:"chlorophyll",cr:255,xp:64,em:"🌱"},
gloom:      {n:"냄새꼬",id:44,t:["grass","poison"],s:[60,65,70,85,75,40],ml:{1:["absorb","razorleaf","poisonpowder"],24:["gigadrain"],32:["sludgebomb"]},e:{l:36,to:"vileplume"},ab:"chlorophyll",cr:120,xp:138,em:"🌱"},
vileplume:  {n:"라플레시즈카",id:45,t:["grass","poison"],s:[75,80,85,110,90,50],ml:{1:["razorleaf","gigadrain","sludgebomb"],40:["solarbeam"],48:["sleeppowder"]},e:null,ab:"chlorophyll",cr:45,xp:221,em:"🌸"},
paras:      {n:"파라스",id:46,t:["bug","grass"],s:[35,70,55,45,55,25],ml:{1:["scratch","absorb"],7:["stunspore"],13:["slash"],19:["gigadrain"]},e:{l:24,to:"parasect"},ab:"effectspore",cr:190,xp:57,em:"🍄"},
parasect:   {n:"파라섹트",id:47,t:["bug","grass"],s:[60,95,80,60,80,30],ml:{1:["slash","gigadrain","stunspore"],28:["xscissor"],33:["spore"]},e:null,ab:"effectspore",cr:75,xp:142,em:"🍄"},
venonat:    {n:"콘팡",id:48,t:["bug","poison"],s:[60,55,50,40,55,45],ml:{1:["tackle","confusion"],11:["poisonpowder"],17:["psybeam"],23:["signalbeam"]},e:{l:31,to:"venomoth"},ab:"compoundeyes",cr:190,xp:61,em:"🐛"},
venomoth:   {n:"도나리",id:49,t:["bug","poison"],s:[70,65,60,90,75,90],ml:{1:["confusion","psybeam","signalbeam"],31:["psychic"],37:["sludgebomb"]},e:null,ab:"compoundeyes",cr:75,xp:158,em:"🦋"},
diglett:    {n:"디그다",id:50,t:["ground"],s:[10,55,25,35,45,95],ml:{1:["scratch","sandattack"],4:["mudshot"],12:["dig"],18:["slash"]},e:{l:26,to:"dugtrio"},ab:"sandveil",cr:255,xp:53,em:"🕳️"},
dugtrio:    {n:"닥트리오",id:51,t:["ground"],s:[35,100,50,50,70,120],ml:{1:["scratch","dig","slash"],26:["earthquake"],40:["stoneedge"]},e:null,ab:"sandveil",cr:50,xp:153,em:"🕳️"},
meowth:     {n:"나옹",id:52,t:["normal"],s:[40,45,35,40,40,90],ml:{1:["scratch","growl"],6:["bite"],11:["furyswipes"],17:["slash"]},e:{l:28,to:"persian"},ab:"pickup",cr:255,xp:58,em:"🐱"},
persian:    {n:"페르시온",id:53,t:["normal"],s:[65,70,60,65,65,115],ml:{1:["scratch","bite","slash"],28:["crunch"],35:["hyperbeam"]},e:null,ab:"limber",cr:90,xp:154,em:"🐱"},
psyduck:    {n:"고라파덕",id:54,t:["water"],s:[50,52,48,65,50,55],ml:{1:["watergun","confusion"],10:["waterpulse"],18:["psybeam"]},e:{l:33,to:"golduck"},ab:"innerfocus",cr:190,xp:64,em:"🦆"},
golduck:    {n:"골덕",id:55,t:["water"],s:[80,82,78,95,80,85],ml:{1:["watergun","psybeam","waterpulse"],33:["surf"],40:["psychic"],48:["hydropump"]},e:null,ab:"innerfocus",cr:75,xp:175,em:"🦆"},
mankey:     {n:"망키",id:56,t:["fighting"],s:[40,80,35,35,45,70],ml:{1:["scratch","karatechop"],9:["furyswipes"],15:["crosschop"]},e:{l:28,to:"primeape"},ab:"vitalspirit",cr:190,xp:61,em:"🐵"},
primeape:   {n:"성원숭",id:57,t:["fighting"],s:[65,105,60,60,70,95],ml:{1:["karatechop","crosschop"],28:["closecombat"],35:["earthquake"]},e:null,ab:"vitalspirit",cr:75,xp:159,em:"🐵"},
growlithe:  {n:"가디",id:58,t:["fire"],s:[55,70,45,70,50,60],ml:{1:["tackle","bite"],6:["ember"],10:["leer"],14:["flamewheel"],18:["flamethrower"],22:["crunch"]},e:{l:28,to:"arcanine"},ab:"intimidate",cr:190,xp:70,em:"🐕"},
arcanine:   {n:"윈디",id:59,t:["fire"],s:[90,110,80,100,80,95],ml:{1:["bite","flamethrower","flamewheel"],28:["crunch"],34:["flareblitz"],38:["wildcharge"],42:["fireblast"],46:["doubleedge"]},e:null,ab:"intimidate",cr:75,xp:194,em:"🐕"},
poliwag:    {n:"발챙이",id:60,t:["water"],s:[40,50,40,40,40,90],ml:{1:["watergun","bubble"],7:["hypnosis"],13:["waterpulse"]},e:{l:25,to:"poliwhirl"},ab:"waterabsorb",cr:255,xp:60,em:"🌀"},
poliwhirl:  {n:"슈륙챙이",id:61,t:["water"],s:[65,65,65,50,50,90],ml:{1:["watergun","waterpulse","hypnosis"],25:["surf"],33:["bodyslam"]},e:{l:40,to:"poliwrath"},ab:"waterabsorb",cr:120,xp:135,em:"🌀"},
poliwrath:  {n:"강챙이",id:62,t:["water","fighting"],s:[90,95,95,70,90,70],ml:{1:["surf","bodyslam","hypnosis"],40:["closecombat"],48:["hydropump"]},e:null,ab:"waterabsorb",cr:45,xp:230,em:"🌀"},
abra:       {n:"캐이시",id:63,t:["psychic"],s:[25,20,15,105,55,90],ml:{1:["confusion"],5:["lightscreen"],8:["hiddenpower"],12:["psybeam"],16:["calmmind"],21:["psychic"]},e:{l:16,to:"kadabra"},ab:["synchronize","innerfocus"],cr:200,xp:62,em:"🔮"},
kadabra:    {n:"윤겔라",id:64,t:["psychic"],s:[40,35,30,120,70,105],ml:{1:["confusion","psybeam"],12:["lightscreen"],16:["psychic"],20:["calmmind"],24:["shadowball"],28:["energyball"]},e:{l:36,to:"alakazam"},ab:["synchronize","innerfocus"],cr:100,xp:140,em:"🔮"},
alakazam:   {n:"후딘",id:65,t:["psychic"],s:[55,50,45,135,95,120],ml:{1:["confusion","psychic","shadowball"],20:["lightscreen"],28:["calmmind"],34:["focusenergy"],38:["energyball"],42:["dazzlinggleam"],46:["recover"]},e:null,ab:["synchronize","innerfocus"],cr:50,xp:225,em:"🔮"},
machop:     {n:"알통몬",id:66,t:["fighting"],s:[70,80,50,35,35,35],ml:{1:["karatechop","growl"],5:["leer"],7:["focusenergy"],10:["lowkick"],13:["crosschop"],16:["brickbreak"]},e:{l:28,to:"machoke"},ab:["guts","sturdy"],cr:180,xp:61,em:"💪"},
machoke:    {n:"근육몬",id:67,t:["fighting"],s:[80,100,70,50,60,45],ml:{1:["karatechop","crosschop"],16:["focusenergy"],20:["brickbreak"],25:["rockslide"],30:["bodyslam"],36:["dynamicpunch"]},e:{l:40,to:"machamp"},ab:["guts","sturdy"],cr:90,xp:142,em:"💪"},
machamp:    {n:"괴력몬",id:68,t:["fighting"],s:[90,130,80,65,85,55],ml:{1:["karatechop","crosschop","brickbreak"],28:["focusenergy"],34:["rockslide"],38:["bodyslam"],40:["dynamicpunch"],46:["earthquake"],50:["closecombat"]},e:null,ab:["guts","sturdy"],cr:45,xp:227,em:"💪"},
bellsprout: {n:"모다피",id:69,t:["grass","poison"],s:[50,75,35,70,30,40],ml:{1:["vinewhip","growl"],7:["razorleaf"],15:["acid"],21:["sleeppowder"]},e:{l:21,to:"weepinbell"},ab:"chlorophyll",cr:255,xp:60,em:"🌱"},
weepinbell: {n:"우츠동",id:70,t:["grass","poison"],s:[65,90,50,85,45,55],ml:{1:["vinewhip","razorleaf","acid"],24:["sludgebomb"],30:["solarbeam"]},e:{l:36,to:"victreebel"},ab:"chlorophyll",cr:120,xp:137,em:"🌱"},
victreebel: {n:"우츠보트",id:71,t:["grass","poison"],s:[80,105,65,100,70,70],ml:{1:["razorleaf","sludgebomb","solarbeam"],36:["sleeppowder"],44:["gigadrain"]},e:null,ab:"chlorophyll",cr:45,xp:221,em:"🌿"},
tentacool:  {n:"왕눈해",id:72,t:["water","poison"],s:[40,40,35,50,100,70],ml:{1:["poisonsting","watergun"],8:["acid"],18:["surf"]},e:{l:30,to:"tentacruel"},ab:"clearbody",cr:190,xp:67,em:"🪼"},
tentacruel: {n:"독파리",id:73,t:["water","poison"],s:[80,70,65,80,120,100],ml:{1:["poisonsting","surf","acid"],30:["sludgebomb"],38:["hydropump"]},e:null,ab:"clearbody",cr:60,xp:180,em:"🪼"},
geodude:    {n:"꼬마돌",id:74,t:["rock","ground"],s:[40,80,100,30,30,20],ml:{1:["tackle","defensecurl"],6:["rockthrow"],11:["mudshot"]},e:{l:25,to:"graveler"},ab:"sturdy",cr:255,xp:60,em:"🪨"},
graveler:   {n:"데구리",id:75,t:["rock","ground"],s:[55,95,115,45,45,35],ml:{1:["tackle","rockthrow","mudshot"],25:["rockslide"],33:["earthquake"]},e:{l:40,to:"golem"},ab:"sturdy",cr:120,xp:137,em:"🪨"},
golem:      {n:"딱구리",id:76,t:["rock","ground"],s:[80,120,130,55,65,45],ml:{1:["rockthrow","rockslide","earthquake"],40:["stoneedge"],48:["explosion"]},e:null,ab:"sturdy",cr:45,xp:223,em:"🪨"},
ponyta:     {n:"포니타",id:77,t:["fire"],s:[50,85,55,65,65,90],ml:{1:["tackle","ember"],8:["flamewheel"],15:["stomp"],25:["flamethrower"]},e:{l:40,to:"rapidash"},ab:"flashfire",cr:190,xp:82,em:"🐴"},
rapidash:   {n:"날쌩마",id:78,t:["fire"],s:[65,100,70,80,80,105],ml:{1:["ember","flamewheel","flamethrower"],40:["flareblitz"],50:["fireblast"]},e:null,ab:"flashfire",cr:60,xp:175,em:"🐴"},
slowpoke:   {n:"야돈",id:79,t:["water","psychic"],s:[90,65,65,40,40,15],ml:{1:["tackle","watergun"],6:["confusion"],15:["waterpulse"],22:["psychic"]},e:{l:37,to:"slowbro"},ab:"regenerator",cr:190,xp:63,em:"🦛"},
slowbro:    {n:"야도란",id:80,t:["water","psychic"],s:[95,75,110,100,80,30],ml:{1:["watergun","psychic","surf"],37:["calmmind"],45:["hydropump"]},e:null,ab:"regenerator",cr:75,xp:172,em:"🦛"},
magnemite:  {n:"코일",id:81,t:["electric","steel"],s:[25,35,70,95,55,45],ml:{1:["thundershock","tackle"],8:["sonicboom"],14:["spark"],18:["thunderwave"],22:["thunderbolt"]},e:{l:30,to:"magneton"},ab:"sturdy",cr:190,xp:65,em:"🧲"},
magneton:   {n:"레어코일",id:82,t:["electric","steel"],s:[50,60,95,120,70,70],ml:{1:["thundershock","thunderbolt"],22:["thunderwave"],30:["triattack"],36:["flashcannon"],38:["thunder"],42:["voltswitch"]},e:null,ab:"sturdy",cr:60,xp:163,em:"🧲"},
farfetchd:  {n:"파오리",id:83,t:["normal","flying"],s:[52,90,55,58,62,60],ml:{1:["peck","slash"],9:["furyattack"],17:["aerialace"],25:["swordsdance"]},e:null,ab:"keeneye",cr:45,xp:94,em:"🦆"},
doduo:      {n:"두두",id:84,t:["normal","flying"],s:[35,85,45,35,35,75],ml:{1:["peck","growl"],9:["furyattack"],13:["quickattack"],21:["drillpeck"]},e:{l:31,to:"dodrio"},ab:"runaway",cr:190,xp:62,em:"🐦"},
dodrio:     {n:"두트리오",id:85,t:["normal","flying"],s:[60,110,70,60,60,110],ml:{1:["peck","furyattack","drillpeck"],31:["triattack"],37:["fly"]},e:null,ab:"runaway",cr:45,xp:165,em:"🐦"},
seel:       {n:"쥬쥬",id:86,t:["water"],s:[65,45,55,45,70,45],ml:{1:["tackle","watergun"],7:["icepunch"],16:["aurorabeam"],21:["surf"]},e:{l:34,to:"dewgong"},ab:"thickfat",cr:190,xp:65,em:"🦭"},
dewgong:    {n:"쥬레곤",id:87,t:["water","ice"],s:[90,70,80,70,95,70],ml:{1:["watergun","icepunch","surf"],34:["icebeam"],42:["blizzard"]},e:null,ab:"thickfat",cr:75,xp:166,em:"🦭"},
grimer:     {n:"질퍽이",id:88,t:["poison"],s:[80,80,50,40,50,25],ml:{1:["tackle","poisonsting"],4:["acid"],12:["sludgebomb"],18:["toxic"]},e:{l:38,to:"muk"},ab:"poisontouch",cr:190,xp:65,em:"💩"},
muk:        {n:"질뻐기",id:89,t:["poison"],s:[105,105,75,65,100,50],ml:{1:["acid","sludgebomb","toxic"],30:["sludge"],38:["explosion"],44:["darkpulse"]},e:null,ab:"poisontouch",cr:75,xp:175,em:"💩"},
shellder:   {n:"셀러",id:90,t:["water"],s:[30,65,100,45,25,40],ml:{1:["tackle","watergun"],8:["iciclespear"],13:["icebeam"]},e:{l:30,to:"cloyster"},ab:"shellarmor",cr:190,xp:61,em:"🐚"},
cloyster:   {n:"파르셀",id:91,t:["water","ice"],s:[50,95,180,85,45,70],ml:{1:["watergun","icebeam"],30:["surf"],36:["blizzard"],42:["hydropump"]},e:null,ab:"shellarmor",cr:60,xp:184,em:"🐚"},
gastly:     {n:"고오스",id:92,t:["ghost","poison"],s:[30,35,30,100,35,80],ml:{1:["lick","confuseray"],5:["hypnosis"],8:["nightshade"],12:["hex"],16:["shadowball"]},e:{l:25,to:"haunter"},ab:["levitate","cursedbody"],cr:190,xp:62,em:"👻"},
haunter:    {n:"고우스트",id:93,t:["ghost","poison"],s:[45,50,45,115,55,95],ml:{1:["lick","nightshade","shadowball"],18:["hypnosis"],22:["hex"],25:["darkpulse"],30:["sludgebomb"],33:["dreameater"]},e:{l:38,to:"gengar"},ab:["levitate","cursedbody"],cr:90,xp:142,em:"👻"},
gengar:     {n:"팬텀",id:94,t:["ghost","poison"],s:[60,65,60,130,75,110],ml:{1:["shadowball","darkpulse","sludgebomb"],28:["hypnosis"],33:["hex"],38:["dreameater"],42:["thunderbolt"],48:["dazzlinggleam"],52:["energyball"]},e:null,ab:["levitate","cursedbody"],cr:45,xp:225,em:"👻"},
onix:       {n:"롱스톤",id:95,t:["rock","ground"],s:[35,45,160,30,45,70],ml:{1:["tackle","rockthrow"],9:["bind"],12:["sandattack"],15:["rockslide"],20:["dig"],23:["earthquake"]},e:{l:36,to:"steelix"},ab:"sturdy",cr:45,xp:77,em:"🐍"},
drowzee:    {n:"슬리프",id:96,t:["psychic"],s:[60,48,45,43,90,42],ml:{1:["confusion","hypnosis"],12:["psybeam"],22:["psychic"]},e:{l:26,to:"hypno"},ab:"insomnia",cr:190,xp:66,em:"💤"},
hypno:      {n:"슬리퍼",id:97,t:["psychic"],s:[85,73,70,73,115,67],ml:{1:["confusion","psybeam","psychic"],26:["hypnosis"],33:["dreameater"],40:["psychic"]},e:null,ab:"insomnia",cr:75,xp:169,em:"💤"},
krabby:     {n:"크랩",id:98,t:["water"],s:[30,105,90,25,25,50],ml:{1:["watergun","scratch"],5:["mudshot"],12:["stomp"],20:["crabhammer"]},e:{l:28,to:"kingler"},ab:"shellarmor",cr:225,xp:65,em:"🦀"},
kingler:    {n:"킹크랩",id:99,t:["water"],s:[55,130,115,50,50,75],ml:{1:["watergun","crabhammer"],28:["surf"],35:["earthquake"]},e:null,ab:"shellarmor",cr:60,xp:166,em:"🦀"},
voltorb:    {n:"찌리리공",id:100,t:["electric"],s:[40,30,50,55,55,100],ml:{1:["thundershock","tackle"],8:["sonicboom"],15:["thunderbolt"],22:["explosion"]},e:{l:30,to:"electrode"},ab:"staticbody",cr:190,xp:66,em:"🔴"},
electrode:  {n:"붐볼",id:101,t:["electric"],s:[60,50,70,80,80,150],ml:{1:["thundershock","thunderbolt"],30:["thunder"],36:["explosion"]},e:null,ab:"staticbody",cr:60,xp:172,em:"🔴"},
exeggcute:  {n:"아라리",id:102,t:["grass","psychic"],s:[60,40,80,60,45,40],ml:{1:["confusion","absorb"],7:["sleeppowder"],15:["psybeam"]},e:{l:30,to:"exeggutor"},ab:"chlorophyll",cr:90,xp:65,em:"🥚"},
exeggutor:  {n:"나시",id:103,t:["grass","psychic"],s:[95,95,85,125,75,55],ml:{1:["confusion","psybeam"],30:["psychic"],36:["solarbeam"],42:["gigadrain"]},e:null,ab:"chlorophyll",cr:45,xp:186,em:"🌴"},
cubone:     {n:"탕구리",id:104,t:["ground"],s:[50,50,95,40,50,35],ml:{1:["tackle","growl"],5:["mudshot"],11:["bonemerang"],17:["headbutt"]},e:{l:28,to:"marowak"},ab:"rockhead",cr:190,xp:64,em:"💀"},
marowak:    {n:"텅구리",id:105,t:["ground"],s:[60,80,110,50,80,45],ml:{1:["mudshot","bonemerang","headbutt"],28:["earthquake"],36:["stoneedge"]},e:null,ab:"rockhead",cr:75,xp:149,em:"💀"},
hitmonlee:  {n:"시라소몬",id:106,t:["fighting"],s:[50,120,53,35,110,87],ml:{1:["karatechop","focusenergy"],10:["crosschop"],20:["closecombat"],30:["megakick"]},e:null,ab:"limber",cr:45,xp:159,em:"🦵"},
hitmonchan: {n:"홍수몬",id:107,t:["fighting"],s:[50,105,79,35,110,76],ml:{1:["karatechop","focusenergy"],10:["icepunch"],15:["thunderpunch"],20:["firepunch"],25:["closecombat"]},e:null,ab:"ironfist",cr:45,xp:159,em:"🥊"},
lickitung:  {n:"내루미",id:108,t:["normal"],s:[90,55,75,60,75,30],ml:{1:["lick","tackle"],9:["bodyslam"],17:["slam"],25:["hyperbeam"]},e:null,ab:"owntempo",cr:45,xp:77,em:"👅"},
koffing:    {n:"또가스",id:109,t:["poison"],s:[40,65,95,60,45,35],ml:{1:["tackle","poisonsting"],6:["acid"],12:["sludgebomb"],18:["toxic"]},e:{l:35,to:"weezing"},ab:"levitate",cr:190,xp:68,em:"💨"},
weezing:    {n:"또도가스",id:110,t:["poison"],s:[65,90,120,85,70,60],ml:{1:["acid","sludgebomb","toxic"],28:["sludge"],35:["explosion"],42:["darkpulse"]},e:null,ab:"levitate",cr:60,xp:172,em:"💨"},
rhyhorn:    {n:"뿔카노",id:111,t:["ground","rock"],s:[80,85,95,30,30,25],ml:{1:["tackle","hornattack"],9:["rockthrow"],17:["stomp"],25:["earthquake"]},e:{l:42,to:"rhydon"},ab:"rockhead",cr:120,xp:69,em:"🦏"},
rhydon:     {n:"코뿌리",id:112,t:["ground","rock"],s:[105,130,120,45,45,40],ml:{1:["hornattack","earthquake","rockslide"],42:["stoneedge"],50:["megahorn"]},e:null,ab:"rockhead",cr:60,xp:170,em:"🦏"},
chansey:    {n:"럭키",id:113,t:["normal"],s:[250,5,5,35,105,50],ml:{1:["tackle","growl"],5:["dazzlinggleam"],10:["lightscreen"],12:["bodyslam"],16:["wish"],20:["softboiled"]},e:null,ab:"naturalcure",cr:30,xp:395,em:"🥚"},
tangela:    {n:"덩구리",id:114,t:["grass"],s:[65,55,115,100,40,60],ml:{1:["vinewhip","absorb"],10:["razorleaf"],19:["gigadrain"],25:["solarbeam"]},e:null,ab:"chlorophyll",cr:45,xp:87,em:"🌿"},
kangaskhan: {n:"캥카",id:115,t:["normal"],s:[105,95,80,40,80,90],ml:{1:["scratch","bite"],7:["bodyslam"],15:["crunch"],25:["earthquake"]},e:null,ab:"scrappy",cr:45,xp:172,em:"🦘"},
horsea:     {n:"쏘드라",id:116,t:["water"],s:[30,40,70,70,25,60],ml:{1:["watergun","smokescreen"],8:["waterpulse"],12:["bubblebeam"],15:["dragonrage"],18:["dragonbreath"]},e:{l:32,to:"seadra"},ab:"swiftswim",cr:225,xp:59,em:"🐴"},
seadra:     {n:"시드라",id:117,t:["water"],s:[55,65,95,95,45,85],ml:{1:["watergun","waterpulse"],22:["bubblebeam"],28:["dragonbreath"],32:["surf"],38:["dragonpulse"],42:["hydropump"]},e:{l:48,to:"kingdra"},ab:"swiftswim",cr:75,xp:154,em:"🐴"},
goldeen:    {n:"콘치",id:118,t:["water"],s:[45,67,60,35,50,63],ml:{1:["watergun","peck"],10:["hornattack"],19:["waterfall"],27:["megahorn"]},e:{l:33,to:"seaking"},ab:"swiftswim",cr:225,xp:64,em:"🐟"},
seaking:    {n:"왕콘치",id:119,t:["water"],s:[80,92,65,65,80,68],ml:{1:["watergun","hornattack","waterfall"],33:["megahorn"],40:["surf"]},e:null,ab:"swiftswim",cr:60,xp:158,em:"🐟"},
staryu:     {n:"별가사리",id:120,t:["water"],s:[30,45,55,70,55,85],ml:{1:["watergun","tackle"],7:["waterpulse"],13:["psychic"]},e:{l:30,to:"starmie"},ab:"naturalcure",cr:225,xp:68,em:"⭐"},
starmie:    {n:"아쿠스타",id:121,t:["water","psychic"],s:[60,75,85,100,85,115],ml:{1:["watergun","psychic","surf"],30:["icebeam"],36:["thunderbolt"],42:["hydropump"]},e:null,ab:"naturalcure",cr:60,xp:182,em:"⭐"},
mrmime:     {n:"마임맨",id:122,t:["psychic","fairy"],s:[40,45,65,100,120,90],ml:{1:["confusion","dazzlinggleam"],10:["psybeam"],20:["psychic"],30:["moonblast"]},e:null,ab:"filter",cr:45,xp:136,em:"🤹"},
scyther:    {n:"스라크",id:123,t:["bug","flying"],s:[70,110,80,55,80,105],ml:{1:["quickattack","slash"],10:["wingattack"],14:["furycutter"],18:["xscissor"],22:["aerialace"],28:["swordsdance"],32:["airslash"]},e:{l:40,to:"scizor"},ab:["swarm","technician"],cr:45,xp:100,em:"🦗"},
jynx:       {n:"루주라",id:124,t:["ice","psychic"],s:[65,50,35,115,95,95],ml:{1:["confusion","icepunch"],12:["psychic"],20:["icebeam"],28:["blizzard"]},e:null,ab:"oblivious",cr:45,xp:137,em:"💋"},
electabuzz: {n:"에레브",id:125,t:["electric"],s:[65,83,57,95,85,105],ml:{1:["thundershock","quickattack"],9:["thunderpunch"],17:["thunderbolt"],25:["thunder"]},e:null,ab:"vitalspirit",cr:45,xp:172,em:"⚡"},
magmar:     {n:"마그마",id:126,t:["fire"],s:[65,95,57,100,85,93],ml:{1:["ember","smokescreen"],9:["firepunch"],17:["flamethrower"],25:["fireblast"]},e:null,ab:"flamebody",cr:45,xp:173,em:"🔥"},
pinsir:     {n:"쁘사이저",id:127,t:["bug"],s:[65,125,100,55,70,85],ml:{1:["tackle","focusenergy"],7:["xscissor"],18:["brickbreak"],25:["megahorn"],30:["swordsdance"]},e:null,ab:"moldbreaker",cr:45,xp:175,em:"🪲"},
tauros:     {n:"켄타로스",id:128,t:["normal"],s:[75,100,95,40,70,110],ml:{1:["tackle","hornattack"],10:["stomp"],19:["bodyslam"],28:["earthquake"]},e:null,ab:"intimidate",cr:45,xp:172,em:"🐂"},
magikarp:   {n:"잉어킹",id:129,t:["water"],s:[20,10,55,15,20,80],ml:{1:["splash","tackle"],10:["watergun"],15:["slam"]},e:{l:20,to:"gyarados"},ab:"swiftswim",cr:255,xp:40,em:"🐟"},
gyarados:   {n:"갸라도스",id:130,t:["water","flying"],s:[95,125,79,60,100,81],ml:{1:["bite","watergun"],15:["slam"],20:["surf"],25:["aquatail"],28:["crunch"],33:["icebeam"],36:["hydropump"],42:["earthquake"],44:["hyperbeam"]},e:null,ab:["intimidate","moxie"],cr:45,xp:189,em:"🐉"},
lapras:     {n:"라프라스",id:131,t:["water","ice"],s:[130,85,80,85,95,60],ml:{1:["watergun","icebeam"],10:["waterfall"],15:["surf"],20:["bodyslam"],25:["thunderbolt"],35:["hydropump"],40:["icebeam"],45:["blizzard"]},e:null,ab:"waterabsorb",cr:45,xp:187,em:"🐋"},
ditto:      {n:"메타몽",id:132,t:["normal"],s:[48,48,48,48,48,48],ml:{1:["tackle"],10:["headbutt"],15:["bodyslam"],25:["slam"]},e:null,ab:"limber",cr:35,xp:101,em:"🟣"},
eevee:      {n:"이브이",id:133,t:["normal"],s:[55,55,50,45,65,55],ml:{1:["tackle","tailwhip"],5:["sandattack"],8:["quickattack"],12:["bite"],16:["doubleedge"],20:["wish"]},e:null,ab:["adaptability","runaway"],cr:45,xp:65,em:"🦊"},
vaporeon:   {n:"샤미드",id:134,t:["water"],s:[130,65,60,110,95,65],ml:{1:["tackle","watergun"],10:["waterpulse"],15:["quickattack"],20:["surf"],25:["wish"],30:["icebeam"],35:["scald"],40:["hydropump"]},e:null,ab:"waterabsorb",cr:45,xp:184,em:"💧"},
jolteon:    {n:"쥬피썬더",id:135,t:["electric"],s:[65,65,60,110,95,130],ml:{1:["tackle","thundershock"],10:["quickattack"],15:["thunderwave"],20:["thunderbolt"],25:["wish"],30:["voltswitch"],35:["thunder"],40:["shadowball"]},e:null,ab:"voltabsorb",cr:45,xp:184,em:"⚡"},
flareon:    {n:"부스터",id:136,t:["fire"],s:[65,130,60,95,110,65],ml:{1:["tackle","ember"],10:["bite"],15:["quickattack"],20:["flamethrower"],25:["wish"],30:["fireblast"],35:["facade"],40:["flareblitz"]},e:null,ab:"flashfire",cr:45,xp:184,em:"🔥"},
porygon:    {n:"폴리곤",id:137,t:["normal"],s:[65,60,70,85,75,40],ml:{1:["tackle","thundershock"],9:["psybeam"],15:["triattack"],23:["thunderbolt"]},e:{l:37,to:"porygon2"},ab:"trace",cr:45,xp:79,em:"💾"},
omanyte:    {n:"암나이트",id:138,t:["rock","water"],s:[35,40,100,90,55,35],ml:{1:["watergun","rockthrow"],10:["mudshot"],19:["surf"],28:["icebeam"]},e:{l:40,to:"omastar"},ab:"shellarmor",cr:45,xp:71,em:"🐚"},
omastar:    {n:"암스타",id:139,t:["rock","water"],s:[70,60,125,115,70,55],ml:{1:["watergun","rockslide","surf"],40:["hydropump"],46:["stoneedge"]},e:null,ab:"shellarmor",cr:45,xp:199,em:"🐚"},
kabuto:     {n:"투구",id:140,t:["rock","water"],s:[30,80,90,55,45,55],ml:{1:["scratch","watergun"],6:["mudshot"],16:["rockslide"],21:["slash"]},e:{l:40,to:"kabutops"},ab:"swiftswim",cr:45,xp:71,em:"🐚"},
kabutops:   {n:"투구푸스",id:141,t:["rock","water"],s:[60,115,105,65,70,80],ml:{1:["slash","rockslide","surf"],40:["stoneedge"],46:["xscissor"]},e:null,ab:"swiftswim",cr:45,xp:199,em:"🐚"},
aerodactyl: {n:"프테라",id:142,t:["rock","flying"],s:[80,105,65,60,75,130],ml:{1:["wingattack","rockthrow"],10:["bite"],20:["aerialace"],28:["stoneedge"],36:["fly"]},e:null,ab:"rockhead",cr:45,xp:180,em:"🦕"},
snorlax:    {n:"잠만보",id:143,t:["normal"],s:[160,110,65,65,110,30],ml:{1:["tackle","bodyslam"],10:["lick"],12:["bite"],16:["rest"],20:["headbutt"],25:["crunch"],30:["hyperbeam"],36:["earthquake"],40:["doubleedge"]},e:null,ab:["immunity","thickfat"],cr:25,xp:189,em:"😴"},
articuno:   {n:"프리져",id:144,t:["ice","flying"],s:[90,85,100,95,125,85],ml:{1:["icebeam","gust"],30:["blizzard"],40:["fly"],50:["hyperbeam"]},e:null,ab:"pressure",cr:3,xp:261,em:"❄️"},
zapdos:     {n:"썬더",id:145,t:["electric","flying"],s:[90,90,85,125,90,100],ml:{1:["thunderbolt","gust"],30:["thunder"],40:["fly"],50:["hyperbeam"]},e:null,ab:"pressure",cr:3,xp:261,em:"⚡"},
moltres:    {n:"파이어",id:146,t:["fire","flying"],s:[90,100,90,125,85,90],ml:{1:["flamethrower","gust"],30:["fireblast"],40:["fly"],50:["hyperbeam"]},e:null,ab:"pressure",cr:3,xp:261,em:"🔥"},
dratini:    {n:"미뇽",id:147,t:["dragon"],s:[41,64,45,50,50,50],ml:{1:["tackle","dragonrage"],7:["thunderwave"],11:["dragonbreath"],15:["slam"],20:["aquatail"]},e:{l:30,to:"dragonair"},ab:["shedskin","innerfocus"],cr:45,xp:60,em:"🐲"},
dragonair:  {n:"신뇽",id:148,t:["dragon"],s:[61,84,65,70,70,70],ml:{1:["dragonrage","slam"],20:["dragonbreath"],25:["aquatail"],30:["dragonclaw"],35:["thunderbolt"],38:["dragontail"]},e:{l:55,to:"dragonite"},ab:["shedskin","innerfocus"],cr:45,xp:147,em:"🐲"},
dragonite:  {n:"망나뇽",id:149,t:["dragon","flying"],s:[91,134,95,100,100,80],ml:{1:["dragonclaw","slam","thunderbolt"],40:["wingattack"],46:["dragonpulse"],50:["fly"],55:["outrage"],58:["earthquake"],63:["hyperbeam"]},e:null,ab:["innerfocus","multiscale"],cr:45,xp:270,em:"🐲"},
mewtwo:     {n:"뮤츠",id:150,t:["psychic"],s:[106,110,90,154,90,130],ml:{1:["confusion","psychic","shadowball","icebeam"],50:["psychic"],60:["calmmind"],70:["hyperbeam"]},e:null,ab:"pressure",cr:3,xp:306,em:"🧬"},
mew:        {n:"뮤",id:151,t:["psychic"],s:[100,100,100,100,100,100],ml:{1:["psychic","flamethrower","surf","thunderbolt"],30:["icebeam"],40:["earthquake"],50:["calmmind"],60:["shadowball"]},e:null,ab:"synchronize",cr:3,xp:270,em:"🩷"},
// ── Gen 2 스타터 ──
chikorita:  {n:"치코리타",id:152,t:["grass"],s:[45,49,65,49,65,45],ml:{1:["tackle","growl"],6:["razorleaf"],10:["leechseed"],12:["poisonpowder"],18:["gigadrain"],22:["lightscreen"]},e:{l:16,to:"bayleef"},ab:"overgrow",cr:45,xp:64,em:"🍃"},
bayleef:    {n:"베이리프",id:153,t:["grass"],s:[60,62,80,63,80,60],ml:{1:["tackle","razorleaf","gigadrain"],18:["leechseed"],23:["bodyslam"],28:["poisonpowder"],31:["solarbeam"],35:["lightscreen"]},e:{l:32,to:"meganium"},ab:"overgrow",cr:45,xp:142,em:"🍃"},
meganium:   {n:"메가니움",id:154,t:["grass"],s:[80,82,100,83,100,80],ml:{1:["razorleaf","gigadrain","bodyslam"],25:["leechseed"],32:["solarbeam"],38:["petalblizzard"],42:["earthquake"],48:["lightscreen"],52:["energyball"]},e:null,ab:"overgrow",cr:45,xp:236,em:"🌺"},
cyndaquil:  {n:"브케인",id:155,t:["fire"],s:[39,52,43,60,50,65],ml:{1:["tackle","growl"],6:["ember"],10:["smokescreen"],12:["quickattack"],19:["flamethrower"],24:["flamewheel"]},e:{l:14,to:"quilava"},ab:"blaze",cr:45,xp:62,em:"🔥"},
quilava:    {n:"마그케인",id:156,t:["fire"],s:[58,64,58,80,65,80],ml:{1:["tackle","ember","flamethrower"],15:["quickattack"],21:["flamewheel"],26:["focusenergy"],31:["flareblitz"]},e:{l:36,to:"typhlosion"},ab:"blaze",cr:45,xp:142,em:"🔥"},
typhlosion: {n:"블레이범",id:157,t:["fire"],s:[78,84,78,109,85,100],ml:{1:["ember","flamethrower","flareblitz"],28:["quickattack"],36:["fireblast"],42:["focusenergy"],48:["eruption"],52:["overheat"],56:["wildcharge"]},e:null,ab:"blaze",cr:45,xp:240,em:"🌋"},
totodile:   {n:"리아코",id:158,t:["water"],s:[50,65,64,44,48,43],ml:{1:["scratch","growl"],6:["watergun"],10:["leer"],12:["bite"],18:["icepunch"],20:["waterpulse"]},e:{l:18,to:"croconaw"},ab:"torrent",cr:45,xp:63,em:"🐊"},
croconaw:   {n:"엘리게이",id:159,t:["water"],s:[65,80,80,59,63,58],ml:{1:["scratch","watergun","bite"],15:["icepunch"],21:["surf"],25:["slash"],28:["crunch"]},e:{l:30,to:"feraligatr"},ab:"torrent",cr:45,xp:142,em:"🐊"},
feraligatr: {n:"장크로다일",id:160,t:["water"],s:[85,105,100,79,83,78],ml:{1:["watergun","bite","surf","crunch"],30:["hydropump"],35:["icepunch"],38:["earthquake"],42:["aquatail"],45:["hyperbeam"]},e:null,ab:"torrent",cr:45,xp:239,em:"🐊"},
sentret:    {n:"꼬리선",id:161,t:["normal"],s:[35,46,34,35,45,20],ml:{1:["tackle","scratch"],4:["quickattack"],7:["bite"]},e:{l:15,to:"furret"},ab:"runaway",cr:255,xp:43,em:"🐿️"},
furret:     {n:"다꼬리",id:162,t:["normal"],s:[85,76,64,45,55,90],ml:{1:["tackle","quickattack","bite"],15:["slam"],24:["bodyslam"]},e:null,ab:"keeneye",cr:90,xp:145,em:"🐿️"},
hoothoot:   {n:"부우부",id:163,t:["normal","flying"],s:[60,30,30,36,56,50],ml:{1:["tackle","confusion"],7:["hypnosis"],16:["psybeam"]},e:{l:20,to:"noctowl"},ab:"insomnia",cr:255,xp:52,em:"🦉"},
noctowl:    {n:"야부엉",id:164,t:["normal","flying"],s:[100,50,50,86,96,70],ml:{1:["confusion","psybeam","hypnosis"],25:["psychic"],33:["aerialace"]},e:null,ab:"insomnia",cr:90,xp:158,em:"🦉"},
ledyba:     {n:"레디바",id:165,t:["bug","flying"],s:[40,20,30,40,80,55],ml:{1:["tackle","supersonic"],6:["bugbite"],12:["lightscreen"]},e:{l:18,to:"ledian"},ab:"swarm",cr:255,xp:54,em:"🐞"},
ledian:     {n:"레디안",id:166,t:["bug","flying"],s:[55,35,50,55,110,85],ml:{1:["bugbite","supersonic"],18:["xscissor"],24:["aerialace"]},e:null,ab:"swarm",cr:90,xp:134,em:"🐞"},
spinarak:   {n:"페이검",id:167,t:["bug","poison"],s:[40,60,40,40,40,30],ml:{1:["poisonsting","stringshot"],6:["bugbite"],12:["nightshade"]},e:{l:22,to:"ariados"},ab:"swarm",cr:255,xp:50,em:"🕷️"},
ariados:    {n:"아리아도스",id:168,t:["bug","poison"],s:[70,90,70,60,70,40],ml:{1:["poisonsting","bugbite","nightshade"],22:["sludgebomb"],30:["xscissor"]},e:null,ab:"swarm",cr:90,xp:140,em:"🕷️"},
crobat:     {n:"크로뱃",id:169,t:["poison","flying"],s:[85,90,80,70,80,130],ml:{1:["bite","wingattack","crunch","aerialace"],42:["crosspoison"],50:["fly"]},e:null,ab:"innerfocus",cr:90,xp:204,em:"🦇"},
chinchou:   {n:"초라기",id:170,t:["water","electric"],s:[75,38,38,56,56,67],ml:{1:["watergun","thundershock"],6:["supersonic"],11:["waterpulse"],17:["thunderbolt"]},e:{l:27,to:"lanturn"},ab:"voltabsorb",cr:190,xp:66,em:"💡"},
lanturn:    {n:"랜턴",id:171,t:["water","electric"],s:[125,58,58,76,76,67],ml:{1:["watergun","thunderbolt","waterpulse"],27:["surf"],33:["thunder"]},e:null,ab:"voltabsorb",cr:75,xp:161,em:"💡"},
pichu:      {n:"피츄",id:172,t:["electric"],s:[20,40,15,35,35,60],ml:{1:["thundershock","charm"],5:["tailwhip"],7:["sweetkiss"],9:["quickattack"],12:["thunderwave"]},e:{l:12,to:"pikachu"},ab:"staticbody",cr:190,xp:41,em:"⚡"},
togepi:     {n:"토게피",id:175,t:["fairy"],s:[35,20,65,40,65,20],ml:{1:["tackle","charm"],5:["sweetkiss"],8:["dazzlinggleam"],10:["wish"]},e:{l:20,to:"togetic"},ab:"serenegrace",cr:190,xp:44,em:"🥚"},
togetic:    {n:"토게틱",id:176,t:["fairy","flying"],s:[55,40,85,80,105,40],ml:{1:["dazzlinggleam","charm"],14:["wish"],20:["aerialace"],24:["moonblast"],28:["airslash"]},e:null,ab:"serenegrace",cr:75,xp:142,em:"🧚"},
natu:       {n:"네이티",id:177,t:["psychic","flying"],s:[40,50,45,70,45,70],ml:{1:["peck","confusion"],6:["nightshade"],10:["psybeam"]},e:{l:25,to:"xatu"},ab:"synchronize",cr:190,xp:73,em:"🐦"},
xatu:       {n:"네이티오",id:178,t:["psychic","flying"],s:[65,75,70,95,70,95],ml:{1:["psybeam","nightshade"],25:["psychic"],33:["aerialace"]},e:null,ab:"synchronize",cr:75,xp:165,em:"🐦"},
mareep:     {n:"메리프",id:179,t:["electric"],s:[55,40,40,65,45,35],ml:{1:["tackle","thundershock"],9:["thunderwave"],14:["thunderbolt"]},e:{l:15,to:"flaaffy"},ab:"staticbody",cr:235,xp:56,em:"🐑"},
flaaffy:    {n:"보송송",id:180,t:["electric"],s:[70,55,55,80,60,45],ml:{1:["tackle","thundershock","thunderbolt"],18:["thunderwave"],25:["thunder"]},e:{l:30,to:"ampharos"},ab:"staticbody",cr:120,xp:128,em:"🐑"},
ampharos:   {n:"전룡",id:181,t:["electric"],s:[90,75,85,115,90,55],ml:{1:["thundershock","thunderbolt","thunder"],30:["thunderwave"],38:["signalbeam"],45:["thunder"]},e:null,ab:"staticbody",cr:45,xp:230,em:"⚡"},
bellossom:  {n:"아르코",id:182,t:["grass"],s:[75,80,95,90,100,50],ml:{1:["absorb","megadrain"],19:["razorleaf"],29:["solarbeam"],39:["moonblast"]},e:null,ab:"chlorophyll",cr:45,xp:221,em:"🌺"},
sudowoodo:  {n:"꼬지모",id:185,t:["rock"],s:[70,100,115,30,65,30],ml:{1:["rockthrow","tackle"],6:["rockslide"],15:["slam"],22:["stoneedge"],30:["earthquake"]},e:null,ab:"sturdy",cr:65,xp:135,em:"🌳"},
politoed:   {n:"왕구리",id:186,t:["water"],s:[90,75,75,90,100,70],ml:{1:["watergun","surf","hypnosis"],36:["hydropump"],42:["icebeam"]},e:null,ab:"drizzle",cr:45,xp:225,em:"🐸"},
aipom:      {n:"에이팜",id:190,t:["normal"],s:[55,70,55,40,55,85],ml:{1:["scratch","tailwhip"],5:["quickattack"],10:["furyswipes"],18:["slam"]},e:null,ab:"runaway",cr:45,xp:72,em:"🐵"},
sunkern:    {n:"해너츠",id:191,t:["grass"],s:[30,30,30,30,30,30],ml:{1:["absorb","growl"],6:["razorleaf"],13:["gigadrain"]},e:{l:22,to:"sunflora"},ab:"chlorophyll",cr:235,xp:36,em:"🌻"},
sunflora:   {n:"해루미",id:192,t:["grass"],s:[75,75,55,105,85,30],ml:{1:["razorleaf","gigadrain"],22:["solarbeam"],30:["sleeppowder"]},e:null,ab:"chlorophyll",cr:120,xp:149,em:"🌻"},
wooper:     {n:"우파",id:194,t:["water","ground"],s:[55,45,45,25,25,15],ml:{1:["watergun","mudshot"],9:["slam"],15:["earthquake"]},e:{l:20,to:"quagsire"},ab:"waterabsorb",cr:255,xp:42,em:"🌊"},
quagsire:   {n:"누오",id:195,t:["water","ground"],s:[95,85,85,65,65,35],ml:{1:["watergun","mudshot","earthquake"],20:["surf"],28:["earthquake"]},e:null,ab:"waterabsorb",cr:90,xp:151,em:"🌊"},
espeon:     {n:"에브이",id:196,t:["psychic"],s:[65,65,60,130,95,110],ml:{1:["tackle","confusion"],10:["quickattack"],16:["psybeam"],20:["wish"],23:["psychic"],28:["dazzlinggleam"],30:["calmmind"],36:["shadowball"]},e:null,ab:"synchronize",cr:45,xp:184,em:"🌟"},
umbreon:    {n:"블래키",id:197,t:["dark"],s:[95,65,110,60,130,65],ml:{1:["tackle","bite"],10:["quickattack"],14:["confuseray"],18:["wish"],23:["darkpulse"],28:["moonlight"],33:["toxic"],36:["crunch"]},e:null,ab:"synchronize",cr:45,xp:184,em:"🌙"},
murkrow:    {n:"니로우",id:198,t:["dark","flying"],s:[60,85,42,85,42,91],ml:{1:["tackle","gust"],8:["bite"],14:["wingattack"],22:["darkpulse"],28:["nightshade"]},e:null,ab:"insomnia",cr:30,xp:81,em:"🐦‍⬛"},
slowking:   {n:"야도킹",id:199,t:["water","psychic"],s:[95,75,80,100,110,30],ml:{1:["watergun","confusion","psychic"],37:["calmmind"],45:["hydropump"]},e:null,ab:"regenerator",cr:70,xp:172,em:"👑"},
misdreavus: {n:"무우마",id:200,t:["ghost"],s:[60,60,60,85,85,85],ml:{1:["confusion","confuseray"],6:["nightshade"],14:["shadowball"],22:["darkpulse"]},e:null,ab:"levitate",cr:45,xp:87,em:"👻"},
girafarig:  {n:"키링키",id:203,t:["normal","psychic"],s:[70,80,65,90,65,85],ml:{1:["tackle","confusion"],7:["psybeam"],13:["stomp"],19:["psychic"],25:["crunch"]},e:null,ab:"innerfocus",cr:60,xp:159,em:"🦒"},
pineco:     {n:"피콘",id:204,t:["bug"],s:[50,65,90,35,35,15],ml:{1:["tackle","bugbite"],6:["rapidpin"],14:["explosion"]},e:{l:31,to:"forretress"},ab:"sturdy",cr:190,xp:58,em:"🌰"},
forretress: {n:"쏘콘",id:205,t:["bug","steel"],s:[75,90,140,60,60,40],ml:{1:["bugbite","rapidpin"],31:["flashcannon"],38:["explosion"]},e:null,ab:"sturdy",cr:75,xp:163,em:"🌰"},
dunsparce:  {n:"노고치",id:206,t:["normal"],s:[100,70,70,65,65,45],ml:{1:["tackle","bite"],6:["bodyslam"],14:["rockslide"],22:["earthquake"]},e:null,ab:"serenegrace",cr:190,xp:145,em:"🐍"},
gligar:     {n:"글라이거",id:207,t:["ground","flying"],s:[65,75,105,35,65,85],ml:{1:["scratch","poisonsting"],6:["quickattack"],13:["slash"],19:["earthquake"]},e:null,ab:"immunity",cr:60,xp:86,em:"🦂"},
steelix:    {n:"강철톤",id:208,t:["steel","ground"],s:[75,85,200,55,65,30],ml:{1:["tackle","rockthrow","earthquake"],28:["sandattack"],36:["irontail"],40:["ironhead"],42:["stoneedge"],48:["flashcannon"],50:["doubleedge"]},e:null,ab:"sturdy",cr:25,xp:179,em:"⛓️"},
snubbull:   {n:"블루",id:209,t:["fairy"],s:[60,80,50,40,40,30],ml:{1:["tackle","bite"],7:["charm"],13:["dazzlinggleam"],19:["crunch"]},e:{l:23,to:"granbull"},ab:"intimidate",cr:190,xp:60,em:"🐶"},
granbull:   {n:"그랑블루",id:210,t:["fairy"],s:[90,120,75,60,60,45],ml:{1:["bite","crunch","dazzlinggleam"],23:["moonblast"],30:["closecombat"]},e:null,ab:"intimidate",cr:75,xp:158,em:"🐶"},
scizor:     {n:"핫삼",id:212,t:["bug","steel"],s:[70,130,100,55,80,65],ml:{1:["quickattack","metalclaw"],10:["xscissor"],15:["furycutter"],20:["bulletpunch"],25:["ironhead"],28:["flashcannon"],32:["swordsdance"],35:["uturn"]},e:null,ab:"technician",cr:25,xp:175,em:"✂️"},
sneasel:    {n:"포푸니",id:215,t:["dark","ice"],s:[55,95,55,35,75,115],ml:{1:["scratch","bite"],8:["icepunch"],14:["quickattack"],22:["crunch"],28:["icebeam"]},e:null,ab:"innerfocus",cr:60,xp:132,em:"❄️"},
teddiursa:  {n:"깜지곰",id:216,t:["normal"],s:[60,80,50,50,50,40],ml:{1:["scratch","growl"],7:["furyswipes"],13:["slash"],19:["bodyslam"]},e:{l:30,to:"ursaring"},ab:"pickup",cr:120,xp:66,em:"🧸"},
ursaring:   {n:"링곰",id:217,t:["normal"],s:[90,130,75,75,75,55],ml:{1:["scratch","slash","bodyslam"],30:["crunch"],36:["earthquake"],42:["hyperbeam"]},e:null,ab:"guts",cr:60,xp:175,em:"🐻"},
slugma:     {n:"마그마그",id:218,t:["fire"],s:[40,40,40,70,40,20],ml:{1:["ember","tackle"],8:["rockthrow"],15:["flamethrower"]},e:{l:38,to:"magcargo"},ab:"flamebody",cr:190,xp:56,em:"🌋"},
magcargo:   {n:"마그카르고",id:219,t:["fire","rock"],s:[60,50,120,90,80,30],ml:{1:["ember","rockthrow","flamethrower"],38:["fireblast"],44:["stoneedge"]},e:null,ab:"flamebody",cr:75,xp:154,em:"🌋"},
swinub:     {n:"꾸꾸리",id:220,t:["ice","ground"],s:[50,50,40,30,30,50],ml:{1:["tackle","mudshot"],5:["icepunch"],13:["icebeam"],19:["earthquake"]},e:{l:33,to:"piloswine"},ab:"oblivious",cr:225,xp:50,em:"🐗"},
piloswine:  {n:"메꾸리",id:221,t:["ice","ground"],s:[100,100,80,60,60,50],ml:{1:["mudshot","icebeam","earthquake"],33:["blizzard"],40:["stoneedge"]},e:null,ab:"oblivious",cr:75,xp:158,em:"🐗"},
corsola:    {n:"코산호",id:222,t:["water","rock"],s:[65,55,95,65,95,35],ml:{1:["tackle","watergun"],6:["rockthrow"],13:["surf"],19:["rockslide"]},e:null,ab:"naturalcure",cr:60,xp:133,em:"🪸"},
houndour:   {n:"델빌",id:228,t:["dark","fire"],s:[45,60,30,80,50,65],ml:{1:["tackle","ember"],7:["bite"],10:["smokescreen"],13:["flamethrower"],17:["darkpulse"],20:["crunch"]},e:{l:24,to:"houndoom"},ab:"flashfire",cr:120,xp:66,em:"🐕‍🦺"},
houndoom:   {n:"헬가",id:229,t:["dark","fire"],s:[75,90,50,110,80,95],ml:{1:["ember","flamethrower","darkpulse"],20:["crunch"],24:["willowisp"],30:["fireblast"],34:["sludgebomb"],38:["flareblitz"]},e:null,ab:"flashfire",cr:45,xp:175,em:"🐕‍🦺"},
kingdra:    {n:"킹드라",id:230,t:["water","dragon"],s:[75,95,95,95,95,85],ml:{1:["watergun","dragonrage","surf"],30:["dragonbreath"],36:["dragonpulse"],42:["icebeam"],48:["hydropump"],55:["outrage"]},e:null,ab:"swiftswim",cr:45,xp:207,em:"🐉"},
phanpy:     {n:"코코리",id:231,t:["ground"],s:[90,60,60,40,40,40],ml:{1:["tackle","mudshot"],6:["rollout"],10:["slam"],15:["earthquake"]},e:{l:25,to:"donphan"},ab:"pickup",cr:120,xp:66,em:"🐘"},
donphan:    {n:"코리갑",id:232,t:["ground"],s:[90,120,120,60,60,50],ml:{1:["mudshot","slam","earthquake"],25:["stoneedge"],30:["bodyslam"]},e:null,ab:"sturdy",cr:60,xp:175,em:"🐘"},
stantler:   {n:"노라키",id:234,t:["normal"],s:[73,95,62,85,65,85],ml:{1:["tackle","confusion"],7:["stomp"],13:["psybeam"],19:["bodyslam"],25:["psychic"]},e:null,ab:"intimidate",cr:45,xp:163,em:"🦌"},
tyrogue:    {n:"배루키",id:236,t:["fighting"],s:[35,35,35,35,35,35],ml:{1:["tackle","karatechop"],5:["focusenergy"],10:["lowkick"],15:["brickbreak"]},e:{l:20,to:"hitmontop"},ab:"guts",cr:75,xp:42,em:"🥋"},
hitmontop:  {n:"카포에라",id:237,t:["fighting"],s:[50,95,95,35,110,70],ml:{1:["karatechop","focusenergy"],20:["tripleKick"],28:["closecombat"]},e:null,ab:"intimidate",cr:45,xp:159,em:"🥋"},
miltank:    {n:"밀탱크",id:241,t:["normal"],s:[95,80,105,40,70,100],ml:{1:["tackle","growl"],5:["bodyslam"],13:["stomp"],19:["earthquake"],25:["hyperbeam"]},e:null,ab:"thickfat",cr:45,xp:172,em:"🐄"},
blissey:    {n:"해피너스",id:242,t:["normal"],s:[255,10,10,75,135,55],ml:{1:["tackle","dazzlinggleam"],12:["bodyslam"],16:["wish"],20:["softboiled"],24:["lightscreen"],28:["psychic"],32:["icebeam"]},e:null,ab:"naturalcure",cr:30,xp:608,em:"🩷"},
raikou:     {n:"라이코",id:243,t:["electric"],s:[90,85,75,115,100,115],ml:{1:["thundershock","quickattack","thunderbolt"],30:["thunder"],40:["calmmind"],50:["hyperbeam"]},e:null,ab:"pressure",cr:3,xp:261,em:"⚡"},
entei:      {n:"앤테이",id:244,t:["fire"],s:[115,115,85,90,75,100],ml:{1:["ember","bite","flamethrower"],30:["fireblast"],40:["calmmind"],50:["hyperbeam"]},e:null,ab:"pressure",cr:3,xp:261,em:"🔥"},
suicune:    {n:"스이쿤",id:245,t:["water"],s:[100,75,115,90,115,85],ml:{1:["watergun","bite","surf"],30:["icebeam"],40:["calmmind"],50:["hyperbeam"]},e:null,ab:"pressure",cr:3,xp:261,em:"💧"},
larvitar:   {n:"애버라스",id:246,t:["rock","ground"],s:[50,64,50,45,50,41],ml:{1:["tackle","bite"],5:["rockthrow"],10:["mudshot"],15:["sandattack"],20:["rockslide"]},e:{l:30,to:"pupitar"},ab:["guts","sandstream"],cr:45,xp:60,em:"🪨"},
pupitar:    {n:"데기라스",id:247,t:["rock","ground"],s:[70,84,70,65,70,51],ml:{1:["tackle","bite","rockthrow"],22:["mudshot"],28:["rockslide"],33:["darkpulse"],36:["earthquake"]},e:{l:55,to:"tyranitar"},ab:["shedskin","sandstream"],cr:45,xp:144,em:"🪨"},
tyranitar:  {n:"마기라스",id:248,t:["rock","dark"],s:[100,134,110,95,100,61],ml:{1:["bite","rockslide","earthquake","crunch"],34:["darkpulse"],40:["irontail"],48:["stoneedge"],52:["fireblast"],58:["hyperbeam"]},e:null,ab:"sandstream",cr:45,xp:270,em:"🦖"},
lugia:      {n:"루기아",id:249,t:["psychic","flying"],s:[106,90,130,90,154,110],ml:{1:["psychic","aerialace","icebeam","surf"],50:["calmmind"],60:["hyperbeam"]},e:null,ab:"multiscale",cr:3,xp:306,em:"🌊"},
hooh:       {n:"호오",id:250,t:["fire","flying"],s:[106,130,90,110,154,90],ml:{1:["flamethrower","aerialace","earthquake","thunderbolt"],50:["fireblast"],60:["hyperbeam"]},e:null,ab:"pressure",cr:3,xp:306,em:"🌈"},
celebi:     {n:"세레비",id:251,t:["psychic","grass"],s:[100,100,100,100,100,100],ml:{1:["confusion","gigadrain","psychic","razorleaf"],50:["calmmind"],60:["solarbeam"]},e:null,ab:"naturalcure",cr:3,xp:270,em:"🧚"},
// ── 누락 Gen 1-2 추가 ──
cleffa:     {n:"삐",id:173,t:["fairy"],s:[50,25,28,45,55,15],ml:{1:["pound","charm"],4:["encore"],8:["sing"]},e:{l:15,to:"clefairy"},ab:"cutecharm",cr:150,xp:44,em:"⭐"},
igglybuff:  {n:"푸푸린",id:174,t:["normal","fairy"],s:[90,30,15,40,20,15],ml:{1:["sing","charm"],4:["pound"],9:["defensecurl"]},e:{l:15,to:"jigglypuff"},ab:"cutecharm",cr:170,xp:39,em:"🎀"},
marill:     {n:"마릴",id:183,t:["water","fairy"],s:[70,20,50,20,50,40],ml:{1:["tackle","watergun"],6:["tailwhip"],10:["waterpulse"],15:["bubblebeam"]},e:{l:18,to:"azumarill"},ab:"hugpower",cr:190,xp:88,em:"💧"},
azumarill:  {n:"마릴리",id:184,t:["water","fairy"],s:[100,50,80,60,80,50],ml:{1:["watergun","tackle","bubblebeam"],21:["aquatail"],28:["hydropump"]},e:null,ab:"hugpower",cr:75,xp:189,em:"💧"},
hoppip:     {n:"통통코",id:187,t:["grass","flying"],s:[35,35,40,35,55,50],ml:{1:["tackle","splash"],5:["tailwhip"],10:["absorb"],13:["sleeppowder"]},e:{l:18,to:"skiploom"},ab:"chlorophyll",cr:255,xp:50,em:"🌿"},
skiploom:   {n:"두코",id:188,t:["grass","flying"],s:[55,45,50,45,65,80],ml:{1:["tackle","absorb"],12:["razorleaf"],18:["sleeppowder"]},e:{l:27,to:"jumpluff"},ab:"chlorophyll",cr:120,xp:119,em:"🌿"},
jumpluff:   {n:"솜솜코",id:189,t:["grass","flying"],s:[75,55,70,55,95,110],ml:{1:["razorleaf","sleeppowder"],27:["megadrain"],33:["solarbeam"]},e:null,ab:"chlorophyll",cr:45,xp:207,em:"🌿"},
yanma:      {n:"왕자리",id:193,t:["bug","flying"],s:[65,65,45,75,45,95],ml:{1:["tackle","quickattack"],7:["sonicboom"],13:["wingattack"],19:["psybeam"]},e:null,ab:"speedboost",cr:75,xp:147,em:"🪰"},
unown:      {n:"안농",id:201,t:["psychic"],s:[48,72,48,72,48,48],ml:{1:["confusion"],10:["psybeam"],20:["psychic"]},e:null,ab:"levitate",cr:225,xp:118,em:"🔤"},
wobbuffet:  {n:"마자용",id:202,t:["psychic"],s:[190,33,58,33,58,33],ml:{1:["counter","mirrorcoat"],15:["encore"],25:["lightscreen"]},e:null,ab:"shadowtag",cr:45,xp:177,em:"🤡"},
qwilfish:   {n:"침바루",id:211,t:["water","poison"],s:[65,95,75,55,55,85],ml:{1:["tackle","poisonsting"],9:["bite"],13:["watergun"],21:["sludgebomb"]},e:null,ab:"poisonpoint",cr:45,xp:88,em:"🐡"},
shuckle:    {n:"단단지",id:213,t:["bug","rock"],s:[20,10,230,10,230,5],ml:{1:["tackle","wrap"],9:["encore"],14:["rockthrow"]},e:null,ab:"sturdy",cr:190,xp:177,em:"🪨"},
heracross:  {n:"헤라크로스",id:214,t:["bug","fighting"],s:[80,125,75,40,95,85],ml:{1:["tackle","hornattack"],7:["furyattack"],10:["focusenergy"],13:["brickbreak"],16:["crosspoison"],19:["megahorn"],24:["closecombat"],28:["rockslide"]},e:null,ab:["swarm","guts"],cr:45,xp:175,em:"🪲"},
remoraid:   {n:"총어",id:223,t:["water"],s:[35,65,35,65,35,65],ml:{1:["watergun"],6:["lockon"],11:["psybeam"],22:["icebeam"]},e:{l:25,to:"octillery"},ab:"keeneye",cr:190,xp:78,em:"🐟"},
octillery:  {n:"대포무노",id:224,t:["water"],s:[75,105,75,105,75,45],ml:{1:["watergun","psybeam"],25:["icebeam"],33:["hydropump"]},e:null,ab:"keeneye",cr:75,xp:168,em:"🐙"},
delibird:   {n:"딜리버드",id:225,t:["ice","flying"],s:[45,55,45,65,45,75],ml:{1:["icebeam","aerialace","quickattack"],15:["icepunch"],20:["blizzard"],30:["bravebird"]},e:null,ab:"vitalspirit",cr:45,xp:116,em:"🎅"},
mantine:    {n:"만타인",id:226,t:["water","flying"],s:[65,40,70,80,140,70],ml:{1:["tackle","watergun","wingattack"],10:["bubblebeam"],18:["surf"]},e:null,ab:"waterabsorb",cr:25,xp:168,em:"🦈"},
skarmory:   {n:"무장조",id:227,t:["steel","flying"],s:[65,80,140,40,70,70],ml:{1:["peck","metalclaw"],9:["aerialace"],13:["sandattack"],17:["steelwing"],21:["drillpeck"],25:["flashcannon"],30:["bravebird"]},e:null,ab:"sturdy",cr:25,xp:168,em:"🦅"},
porygon2:   {n:"폴리곤2",id:233,t:["normal"],s:[85,80,90,105,95,60],ml:{1:["tackle","psybeam","triattack"],30:["psychic"],37:["hyperbeam"]},e:null,ab:"trace",cr:45,xp:180,em:"💻"},
smeargle:   {n:"루브도",id:235,t:["normal"],s:[55,20,35,20,45,75],ml:{1:["tackle","sketch"],11:["slash"],21:["bodyslam"]},e:null,ab:"owntempo",cr:45,xp:88,em:"🎨"},
smoochum:   {n:"뽀뽀라",id:238,t:["ice","psychic"],s:[45,30,15,85,65,65],ml:{1:["pound","lick"],5:["confusion"],9:["icepunch"]},e:{l:30,to:"jynx"},ab:"oblivious",cr:45,xp:87,em:"💋"},
elekid:     {n:"에레키드",id:239,t:["electric"],s:[45,63,37,65,55,95],ml:{1:["thundershock","leer"],6:["quickattack"],11:["thunderpunch"]},e:{l:30,to:"electabuzz"},ab:"staticbody",cr:45,xp:72,em:"⚡"},
magby:      {n:"마그비",id:240,t:["fire"],s:[45,75,37,70,55,83],ml:{1:["ember","leer"],7:["smokescreen"],13:["firepunch"]},e:{l:30,to:"magmar"},ab:"flamebody",cr:45,xp:73,em:"🔥"},
// ── Gen 3: 호연 지방 포켓몬 ──
treecko:    {n:"나무지기",id:252,t:["grass"],s:[40,45,35,65,55,70],ml:{1:["pound","absorb"],6:["quickattack"],11:["megadrain"],16:["pursuit"],21:["razorleaf"],26:["gigadrain"]},e:{l:16,to:"grovyle"},ab:"overgrow",cr:45,xp:62,em:"🦎"},
grovyle:    {n:"나무돌이",id:253,t:["grass"],s:[50,65,45,85,65,95],ml:{1:["pound","absorb"],16:["razorleaf"],22:["pursuit"],29:["gigadrain"],33:["xscissor"],39:["solarbeam"]},e:{l:36,to:"sceptile"},ab:"overgrow",cr:45,xp:142,em:"🦎"},
sceptile:   {n:"나무킹",id:254,t:["grass"],s:[70,85,65,105,85,120],ml:{1:["pound","razorleaf"],20:["quickattack"],28:["gigadrain"],36:["xscissor"],42:["energyball"],48:["dragonclaw"],51:["solarbeam"],56:["grassknot"]},e:null,ab:"overgrow",cr:45,xp:239,em:"🦎"},
torchic:    {n:"아차모",id:255,t:["fire"],s:[45,60,40,70,50,45],ml:{1:["scratch","ember"],7:["focusenergy"],10:["quickattack"],16:["flamethrower"],20:["slash"]},e:{l:16,to:"combusken"},ab:"blaze",cr:45,xp:62,em:"🐥"},
combusken:  {n:"영치코",id:256,t:["fire","fighting"],s:[60,85,60,85,60,55],ml:{1:["scratch","ember"],12:["focusenergy"],16:["brickbreak"],22:["flamewheel"],28:["flamethrower"],32:["slash"]},e:{l:36,to:"blaziken"},ab:"blaze",cr:45,xp:142,em:"🐓"},
blaziken:   {n:"번치코",id:257,t:["fire","fighting"],s:[80,120,70,110,70,80],ml:{1:["scratch","ember","brickbreak"],24:["flamethrower"],30:["slash"],36:["closecombat"],42:["flareblitz"],48:["bravebird"],54:["fireblast"]},e:null,ab:"speedboost",cr:45,xp:239,em:"🐓"},
mudkip:     {n:"물짱이",id:258,t:["water"],s:[50,70,50,50,50,40],ml:{1:["tackle","watergun"],6:["mudslap"],10:["growl"],16:["waterpulse"],20:["mudshot"]},e:{l:16,to:"marshtomp"},ab:"torrent",cr:45,xp:62,em:"🐟"},
marshtomp:  {n:"늪짱이",id:259,t:["water","ground"],s:[70,85,70,60,70,50],ml:{1:["tackle","watergun","mudslap"],12:["mudshot"],18:["rockthrow"],25:["surf"],30:["earthquake"]},e:{l:36,to:"swampert"},ab:"torrent",cr:45,xp:142,em:"🐟"},
swampert:   {n:"대짱이",id:260,t:["water","ground"],s:[100,110,90,85,90,60],ml:{1:["watergun","mudslap"],20:["mudshot"],28:["rockslide"],36:["earthquake"],42:["surf"],48:["icebeam"],52:["hydropump"],56:["stoneedge"]},e:null,ab:"torrent",cr:45,xp:241,em:"🐟"},
poochyena:  {n:"포챠나",id:261,t:["dark"],s:[35,55,35,30,30,35],ml:{1:["tackle","bite"],13:["crunch"],22:["darkpulse"]},e:{l:18,to:"mightyena"},ab:"runaway",cr:255,xp:56,em:"🐺"},
mightyena:  {n:"그라에나",id:262,t:["dark"],s:[70,90,70,60,60,70],ml:{1:["tackle","bite"],18:["crunch"],30:["darkpulse"]},e:null,ab:"intimidate",cr:127,xp:147,em:"🐺"},
zigzagoon:  {n:"지그제구리",id:263,t:["normal"],s:[38,30,41,30,41,60],ml:{1:["tackle","growl"],9:["slam"],25:["bodyslam"]},e:{l:20,to:"linoone"},ab:"pickup",cr:255,xp:56,em:"🦝"},
linoone:    {n:"직구리",id:264,t:["normal"],s:[78,70,61,50,61,100],ml:{1:["tackle","slam"],20:["bodyslam"],33:["bodyslam"]},e:null,ab:"pickup",cr:90,xp:147,em:"🦝"},
ralts:      {n:"랄토스",id:280,t:["psychic","fairy"],s:[28,25,25,45,35,40],ml:{1:["confusion","growl"],6:["charm"],10:["psybeam"],14:["calmmind"],18:["dazzlinggleam"]},e:{l:20,to:"kirlia"},ab:["synchronize","trace"],cr:235,xp:40,em:"🧚"},
kirlia:     {n:"킬리아",id:281,t:["psychic","fairy"],s:[38,35,35,65,55,50],ml:{1:["confusion","psybeam"],15:["charm"],20:["psychic"],24:["calmmind"],26:["dazzlinggleam"],30:["moonblast"]},e:{l:30,to:"gardevoir"},ab:["synchronize","trace"],cr:120,xp:97,em:"🧚"},
gardevoir:  {n:"가디안",id:282,t:["psychic","fairy"],s:[68,65,65,125,115,80],ml:{1:["confusion","psychic"],22:["charm"],28:["calmmind"],32:["dazzlinggleam"],36:["moonblast"],40:["shadowball"],44:["energyball"],48:["thunderbolt"]},e:null,ab:["synchronize","trace"],cr:45,xp:233,em:"🧚"},
shroomish:  {n:"버섯꼬",id:285,t:["grass"],s:[60,40,60,40,60,35],ml:{1:["tackle","absorb"],7:["absorb"],16:["megadrain"],22:["sleeppowder"]},e:{l:23,to:"breloom"},ab:"effectspore",cr:255,xp:59,em:"🍄"},
breloom:    {n:"버섯모",id:286,t:["grass","fighting"],s:[60,130,80,60,60,70],ml:{1:["tackle","absorb"],23:["brickbreak"],33:["megadrain"],44:["closecombat"]},e:null,ab:"effectspore",cr:90,xp:161,em:"🍄"},
slakoth:    {n:"게을로",id:287,t:["normal"],s:[60,60,60,35,35,30],ml:{1:["scratch","tackle"],7:["bodyslam"],13:["bodyslam"]},e:{l:18,to:"vigoroth"},ab:"insomnia",cr:255,xp:83,em:"🦥"},
vigoroth:   {n:"발바로",id:288,t:["normal"],s:[80,80,80,55,55,90],ml:{1:["scratch","bodyslam"],18:["bodyslam"],25:["closecombat"]},e:{l:36,to:"slaking"},ab:"vitalspirit",cr:120,xp:154,em:"🦥"},
slaking:    {n:"게을킹",id:289,t:["normal"],s:[150,160,100,95,65,100],ml:{1:["scratch","bodyslam"],20:["slash"],36:["hyperbeam"],45:["earthquake"]},e:null,ab:"insomnia",cr:45,xp:252,em:"🦥"},
makuhita:   {n:"마크탕",id:296,t:["fighting"],s:[72,60,30,20,30,25],ml:{1:["tackle","lowkick"],10:["brickbreak"],22:["closecombat"]},e:{l:24,to:"hariyama"},ab:"guts",cr:180,xp:47,em:"🥊"},
hariyama:   {n:"하리뭉",id:297,t:["fighting"],s:[144,120,60,40,60,50],ml:{1:["tackle","brickbreak"],24:["closecombat"],38:["crosschop"]},e:null,ab:"guts",cr:200,xp:166,em:"🥊"},
aron:       {n:"코코도라",id:304,t:["steel","rock"],s:[50,70,100,40,40,30],ml:{1:["tackle","metalclaw"],7:["rockthrow"],15:["ironhead"]},e:{l:32,to:"lairon"},ab:"sturdy",cr:180,xp:66,em:"⛏️"},
lairon:     {n:"코도라",id:305,t:["steel","rock"],s:[60,90,140,50,50,40],ml:{1:["tackle","metalclaw","ironhead"],32:["rockslide"],37:["steelwing"]},e:{l:42,to:"aggron"},ab:"sturdy",cr:90,xp:151,em:"⛏️"},
aggron:     {n:"보스로라",id:306,t:["steel","rock"],s:[70,110,180,60,60,50],ml:{1:["metalclaw","ironhead"],42:["stoneedge"],51:["hyperbeam"]},e:null,ab:"sturdy",cr:45,xp:239,em:"⛏️"},
meditite:   {n:"요가랑",id:307,t:["fighting","psychic"],s:[30,40,55,40,55,60],ml:{1:["confusion","lowkick"],9:["brickbreak"],18:["psychic"]},e:{l:37,to:"medicham"},ab:"purepower",cr:180,xp:56,em:"🧘"},
medicham:   {n:"요가램",id:308,t:["fighting","psychic"],s:[60,60,75,60,75,80],ml:{1:["confusion","brickbreak"],37:["closecombat"],42:["psychic"]},e:null,ab:"purepower",cr:90,xp:144,em:"🧘"},
electrike:  {n:"썬더라이",id:309,t:["electric"],s:[40,45,40,65,40,65],ml:{1:["tackle","thundershock"],12:["spark"],20:["thunderbolt"]},e:{l:26,to:"manectric"},ab:"staticbody",cr:120,xp:59,em:"⚡"},
manectric:  {n:"썬더볼트",id:310,t:["electric"],s:[70,75,60,105,60,105],ml:{1:["thundershock","spark"],26:["thunderbolt"],44:["thunder"]},e:null,ab:"staticbody",cr:45,xp:166,em:"⚡"},
carvanha:   {n:"샤프니아",id:318,t:["water","dark"],s:[45,90,20,65,20,65],ml:{1:["bite","watergun"],16:["crunch"],22:["aquatail"]},e:{l:30,to:"sharpedo"},ab:"roughskin",cr:225,xp:88,em:"🦈"},
sharpedo:   {n:"샤크니아",id:319,t:["water","dark"],s:[70,120,40,95,40,95],ml:{1:["bite","crunch"],30:["aquatail"],38:["hydropump"]},e:null,ab:"roughskin",cr:60,xp:161,em:"🦈"},
trapinch:   {n:"톱치",id:328,t:["ground"],s:[45,100,45,45,45,10],ml:{1:["bite","mudslap"],9:["dig"],17:["crunch"]},e:{l:35,to:"vibrava"},ab:"arenatrap",cr:255,xp:73,em:"🐜"},
vibrava:    {n:"비브라바",id:329,t:["ground","dragon"],s:[50,70,50,50,50,70],ml:{1:["bite","mudslap","dragonbreath"],25:["dig"],35:["dragonclaw"],40:["earthquake"]},e:{l:45,to:"flygon"},ab:"levitate",cr:120,xp:119,em:"🐉"},
flygon:     {n:"플라이곤",id:330,t:["ground","dragon"],s:[80,100,80,80,80,100],ml:{1:["dragonbreath","earthquake"],45:["dragonclaw"],55:["outrage"]},e:null,ab:"levitate",cr:45,xp:234,em:"🐉"},
swablu:     {n:"파비코",id:333,t:["normal","flying"],s:[45,40,60,40,75,50],ml:{1:["peck","growl"],8:["wingattack"],18:["aerialace"]},e:{l:35,to:"altaria"},ab:"naturalcure",cr:255,xp:62,em:"☁️"},
altaria:    {n:"파비코리",id:334,t:["dragon","flying"],s:[75,70,90,70,105,80],ml:{1:["peck","wingattack"],35:["dragonbreath"],42:["moonblast"],54:["dragonpulse"]},e:null,ab:"naturalcure",cr:45,xp:172,em:"☁️"},
feebas:     {n:"빈티나",id:349,t:["water"],s:[20,15,20,10,55,80],ml:{1:["tackle","watergun"],15:["waterpulse"],25:["surf"]},e:{l:30,to:"milotic"},ab:"swiftswim",cr:255,xp:40,em:"🐟"},
milotic:    {n:"밀로틱",id:350,t:["water"],s:[95,60,79,100,125,81],ml:{1:["watergun","surf"],30:["hydropump"],40:["icebeam"]},e:null,ab:"marvelscale",cr:60,xp:189,em:"🐉"},
absol:      {n:"앱솔",id:359,t:["dark"],s:[65,130,60,75,60,75],ml:{1:["scratch","bite"],12:["crunch"],25:["darkpulse"],36:["swordsdance"]},e:null,ab:"superluck",cr:30,xp:163,em:"🌙"},
bagon:      {n:"아공이",id:371,t:["dragon"],s:[45,75,60,40,30,50],ml:{1:["bite","ember"],5:["leer"],9:["dragonbreath"],13:["headbutt"],17:["slam"]},e:{l:30,to:"shelgon"},ab:"rockhead",cr:45,xp:60,em:"🐉"},
shelgon:    {n:"쉘곤",id:372,t:["dragon"],s:[65,95,100,60,50,50],ml:{1:["bite","dragonbreath"],22:["headbutt"],28:["protect"],30:["dragonclaw"],35:["rockslide"],38:["ironhead"]},e:{l:50,to:"salamence"},ab:"rockhead",cr:45,xp:147,em:"🐉"},
salamence:  {n:"보만다",id:373,t:["dragon","flying"],s:[95,135,80,110,80,100],ml:{1:["dragonbreath","dragonclaw"],28:["fly"],36:["dragonpulse"],42:["rockslide"],50:["outrage"],55:["earthquake"],60:["fireblast"],65:["hyperbeam"]},e:null,ab:["intimidate","moxie"],cr:45,xp:270,em:"🐉"},
beldum:     {n:"메탕",id:374,t:["steel","psychic"],s:[40,55,80,35,60,30],ml:{1:["tackle","metalclaw"],10:["ironhead"],20:["confusion"],25:["irondefense"]},e:{l:20,to:"metang"},ab:"clearbody",cr:3,xp:60,em:"🤖"},
metang:     {n:"메탕구",id:375,t:["steel","psychic"],s:[60,75,100,55,80,50],ml:{1:["tackle","metalclaw","confusion"],15:["bulletpunch"],20:["psychic"],24:["ironhead"],26:["irondefense"]},e:{l:45,to:"metagross"},ab:"clearbody",cr:3,xp:147,em:"🤖"},
metagross:  {n:"메타그로스",id:376,t:["steel","psychic"],s:[80,135,130,95,90,70],ml:{1:["metalclaw","psychic"],28:["bulletpunch"],34:["irondefense"],40:["ironhead"],46:["earthquake"],50:["flashcannon"],55:["hyperbeam"]},e:null,ab:"clearbody",cr:3,xp:270,em:"🤖"},
// Gen 3 전설/환상
regirock:   {n:"레지락",id:377,t:["rock"],s:[80,100,200,50,100,50],ml:{1:["rockthrow","ironhead"],25:["rockslide"],50:["stoneedge"]},e:null,ab:"clearbody",cr:3,xp:261,em:"🪨"},
regice:     {n:"레지아이스",id:378,t:["ice"],s:[80,50,100,100,200,50],ml:{1:["icebeam","confusion"],33:["blizzard"],50:["hyperbeam"]},e:null,ab:"clearbody",cr:3,xp:261,em:"🧊"},
registeel:  {n:"레지스틸",id:379,t:["steel"],s:[80,75,150,75,150,50],ml:{1:["metalclaw","ironhead"],33:["flashcannon"],50:["hyperbeam"]},e:null,ab:"clearbody",cr:3,xp:261,em:"⚙️"},
latias:     {n:"라티아스",id:380,t:["dragon","psychic"],s:[80,80,90,110,130,110],ml:{1:["dragonbreath","psychic"],30:["dragonpulse"],50:["moonblast"]},e:null,ab:"levitate",cr:3,xp:270,em:"🔴"},
latios:     {n:"라티오스",id:381,t:["dragon","psychic"],s:[80,90,80,130,110,110],ml:{1:["dragonbreath","psychic"],30:["dragonpulse"],50:["hyperbeam"]},e:null,ab:"levitate",cr:3,xp:270,em:"🔵"},
kyogre:     {n:"가이오가",id:382,t:["water"],s:[100,100,90,150,140,90],ml:{1:["watergun","icebeam"],45:["surf"],75:["hydropump"]},e:null,ab:"drizzle",cr:3,xp:302,em:"🌊"},
groudon:    {n:"그란돈",id:383,t:["ground"],s:[100,150,140,100,90,90],ml:{1:["mudslap","earthquake"],45:["fireblast"],75:["solarbeam"]},e:null,ab:"drought",cr:3,xp:302,em:"🌋"},
rayquaza:   {n:"레쿠쟈",id:384,t:["dragon","flying"],s:[105,150,90,150,90,95],ml:{1:["dragonbreath","aerialace"],45:["outrage"],75:["hyperbeam"]},e:null,ab:"pressure",cr:3,xp:306,em:"🐲"},
jirachi:    {n:"지라치",id:385,t:["steel","psychic"],s:[100,100,100,100,100,100],ml:{1:["confusion","psychic"],30:["dazzlinggleam"],50:["moonblast"]},e:null,ab:"serenegrace",cr:3,xp:270,em:"⭐"},
deoxys:     {n:"테오키스",id:386,t:["psychic"],s:[50,150,50,150,50,150],ml:{1:["confusion","psychic"],30:["hyperbeam"],50:["shadowball"]},e:null,ab:"pressure",cr:3,xp:270,em:"🧬"},
// ── Gen 3: 호연 지방 추가 포켓몬 ──
wurmple:    {n:"개무소",id:265,t:["bug"],s:[45,45,35,20,30,20],ml:{1:["tackle","bugbite"],5:["poisonsting"]},e:{l:7,to:"silcoon"},ab:"shedskin",cr:255,xp:56,em:"🐛"},
silcoon:    {n:"실쿤",id:266,t:["bug"],s:[50,35,55,25,25,15],ml:{1:["tackle","harden"],10:["bugbite"]},e:{l:10,to:"beautifly"},ab:"shedskin",cr:120,xp:72,em:"🐛"},
beautifly:  {n:"뷰티플라이",id:267,t:["bug","flying"],s:[60,70,50,100,50,65],ml:{1:["absorb","bugbite"],10:["megadrain"],24:["silverwind"],34:["aerialace"]},e:null,ab:"swarm",cr:45,xp:178,em:"🦋"},
cascoon:    {n:"카스쿤",id:268,t:["bug"],s:[50,35,55,25,25,15],ml:{1:["tackle","harden"],10:["acid"]},e:{l:10,to:"dustox"},ab:"shedskin",cr:120,xp:72,em:"🐛"},
dustox:     {n:"독케일",id:269,t:["bug","poison"],s:[60,50,70,50,90,65],ml:{1:["confusion","bugbite"],10:["poisonsting"],24:["sludgebomb"],34:["silverwind"]},e:null,ab:"compoundeyes",cr:45,xp:173,em:"🦋"},
lotad:      {n:"연꽃몬",id:270,t:["water","grass"],s:[40,30,30,40,50,30],ml:{1:["absorb","watergun"],7:["bubblebeam"],15:["megadrain"]},e:{l:14,to:"lombre"},ab:"swiftswim",cr:255,xp:44,em:"🌿"},
lombre:     {n:"로토스",id:271,t:["water","grass"],s:[60,50,50,60,70,50],ml:{1:["absorb","watergun"],14:["bubblebeam"],22:["razorleaf"]},e:{l:36,to:"ludicolo"},ab:"swiftswim",cr:120,xp:119,em:"🌿"},
ludicolo:   {n:"루디콜로",id:272,t:["water","grass"],s:[80,70,70,90,100,70],ml:{1:["watergun","razorleaf"],36:["surf"],44:["hydropump"]},e:null,ab:"swiftswim",cr:45,xp:216,em:"🌿"},
seedot:     {n:"도토링",id:273,t:["grass"],s:[40,40,50,30,30,30],ml:{1:["tackle","absorb"],7:["harden"],15:["razorleaf"]},e:{l:14,to:"nuzleaf"},ab:"chlorophyll",cr:255,xp:44,em:"🌰"},
nuzleaf:    {n:"잎새코",id:274,t:["grass","dark"],s:[70,70,40,60,40,60],ml:{1:["razorleaf","bite"],14:["megadrain"],28:["darkpulse"]},e:{l:36,to:"shiftry"},ab:"chlorophyll",cr:120,xp:119,em:"🌰"},
shiftry:    {n:"다크펫",id:275,t:["grass","dark"],s:[90,100,60,90,60,80],ml:{1:["razorleaf","darkpulse"],36:["solarbeam"],50:["swordsdance"]},e:null,ab:"chlorophyll",cr:45,xp:216,em:"🌰"},
taillow:    {n:"테일로",id:276,t:["normal","flying"],s:[40,55,30,30,30,85],ml:{1:["peck","growl"],7:["quickattack"],13:["wingattack"]},e:{l:22,to:"swellow"},ab:"guts",cr:200,xp:54,em:"🐦"},
swellow:    {n:"스왈로",id:277,t:["normal","flying"],s:[60,85,60,75,50,125],ml:{1:["quickattack","wingattack"],22:["aerialace"],38:["doubleedge"]},e:null,ab:"guts",cr:45,xp:159,em:"🐦"},
wingull:    {n:"카모메",id:278,t:["water","flying"],s:[40,30,30,55,30,85],ml:{1:["watergun","growl"],6:["wingattack"],15:["waterpulse"]},e:{l:25,to:"pelipper"},ab:"keeneye",cr:190,xp:54,em:"🐦"},
pelipper:   {n:"패리퍼",id:279,t:["water","flying"],s:[60,50,100,95,70,65],ml:{1:["watergun","wingattack"],25:["surf"],38:["hydropump"]},e:null,ab:"drizzle",cr:45,xp:154,em:"🐦"},
surskit:    {n:"비구술",id:283,t:["bug","water"],s:[40,30,32,50,52,65],ml:{1:["watergun","bugbite"],7:["bubblebeam"],13:["quickattack"]},e:{l:22,to:"masquerain"},ab:"swiftswim",cr:200,xp:54,em:"🐛"},
masquerain: {n:"비나방",id:284,t:["bug","flying"],s:[70,60,62,100,82,80],ml:{1:["bugbite","watergun"],22:["silverwind"],30:["aerialace"]},e:null,ab:"intimidate",cr:75,xp:159,em:"🦋"},
nincada:    {n:"토중몬",id:290,t:["bug","ground"],s:[31,45,90,30,30,40],ml:{1:["scratch","bugbite"],5:["furycutter"],14:["dig"]},e:{l:20,to:"ninjask"},ab:"compoundeyes",cr:255,xp:53,em:"🐛"},
ninjask:    {n:"아이스크",id:291,t:["bug","flying"],s:[61,90,45,50,50,160],ml:{1:["bugbite","furycutter"],20:["xscissor"],25:["aerialace"],38:["swordsdance"]},e:null,ab:"speedboost",cr:120,xp:160,em:"🐝"},
shedinja:   {n:"껍질몬",id:292,t:["bug","ghost"],s:[1,90,45,30,30,40],ml:{1:["bugbite","shadowball"],5:["furycutter"],14:["dig"]},e:null,ab:"wonderguard",cr:45,xp:83,em:"👻"},
whismur:    {n:"소곤룡",id:293,t:["normal"],s:[64,51,23,51,23,28],ml:{1:["pound","sonicboom"],11:["bodyslam"],18:["slam"],30:["hyperbeam"]},e:{l:20,to:"loudred"},ab:"keeneye",cr:190,xp:48,em:"📢"},
loudred:    {n:"노공룡",id:294,t:["normal"],s:[84,71,43,71,43,48],ml:{1:["pound","sonicboom"],20:["slam"],29:["bodyslam"]},e:{l:40,to:"exploud"},ab:"keeneye",cr:120,xp:126,em:"📢"},
exploud:    {n:"폭음룡",id:295,t:["normal"],s:[104,91,63,91,73,68],ml:{1:["pound","slam"],40:["bodyslam"],50:["hyperbeam"]},e:null,ab:"keeneye",cr:45,xp:221,em:"📢"},
azurill:    {n:"루리리",id:298,t:["normal","fairy"],s:[50,20,40,20,40,20],ml:{1:["tackle","watergun"],6:["tailwhip"],10:["bubblebeam"]},e:{l:15,to:"marill"},ab:"hugpower",cr:150,xp:38,em:"💧"},
nosepass:   {n:"코코파스",id:299,t:["rock"],s:[30,45,135,45,90,30],ml:{1:["tackle","rockthrow"],7:["thunderwave"],13:["rockslide"],25:["stoneedge"]},e:null,ab:"sturdy",cr:255,xp:75,em:"🗿"},
skitty:     {n:"에나비",id:300,t:["normal"],s:[50,45,45,35,35,50],ml:{1:["tackle","growl"],7:["sing"],13:["doubleedge"]},e:{l:25,to:"delcatty"},ab:"cutecharm",cr:255,xp:52,em:"🐱"},
delcatty:   {n:"프레프티",id:301,t:["normal"],s:[70,65,65,55,55,90],ml:{1:["tackle","sing"],25:["doubleedge"],33:["bodyslam"]},e:null,ab:"cutecharm",cr:60,xp:140,em:"🐱"},
sableye:    {n:"깜까미",id:302,t:["dark","ghost"],s:[50,75,75,65,65,50],ml:{1:["scratch","nightshade"],9:["bite"],17:["shadowball"]},e:null,ab:"keeneye",cr:45,xp:133,em:"💎"},
mawile:     {n:"입치트",id:303,t:["steel","fairy"],s:[50,85,85,55,55,50],ml:{1:["bite","metalclaw"],9:["ironhead"],17:["crunch"]},e:null,ab:"intimidate",cr:45,xp:133,em:"⚙️"},
plusle:     {n:"플러시",id:311,t:["electric"],s:[60,50,40,85,75,95],ml:{1:["growl","thundershock"],10:["spark"],19:["thunderbolt"]},e:null,ab:"staticbody",cr:200,xp:142,em:"⚡"},
minun:      {n:"마이농",id:312,t:["electric"],s:[60,40,50,75,85,95],ml:{1:["growl","thundershock"],10:["spark"],19:["thunderbolt"]},e:null,ab:"staticbody",cr:200,xp:142,em:"⚡"},
volbeat:    {n:"볼비트",id:313,t:["bug"],s:[65,73,55,47,75,85],ml:{1:["tackle","bugbite"],9:["confuseray"],17:["signalbeam"]},e:null,ab:"swarm",cr:150,xp:151,em:"🔦"},
illumise:   {n:"네오비트",id:314,t:["bug"],s:[65,47,55,73,75,85],ml:{1:["tackle","bugbite"],9:["confuseray"],17:["dazzlinggleam"]},e:null,ab:"oblivious",cr:150,xp:151,em:"🔦"},
roselia:    {n:"로젤리아",id:315,t:["grass","poison"],s:[50,60,45,100,80,65],ml:{1:["absorb","poisonsting"],9:["megadrain"],17:["razorleaf"],25:["sludgebomb"]},e:null,ab:"naturalcure",cr:150,xp:140,em:"🌹"},
gulpin:     {n:"꼴깍몬",id:316,t:["poison"],s:[70,43,53,43,53,40],ml:{1:["pound","sludge"],7:["poisonsting"],17:["sludgebomb"]},e:{l:26,to:"swalot"},ab:"poisontouch",cr:225,xp:60,em:"🟢"},
swalot:     {n:"꿀꺽몬",id:317,t:["poison"],s:[100,73,83,73,83,55],ml:{1:["pound","sludge"],26:["sludgebomb"],34:["toxic"]},e:null,ab:"poisontouch",cr:75,xp:163,em:"🟢"},
wailmer:    {n:"고래왕자",id:320,t:["water"],s:[130,70,35,70,35,60],ml:{1:["watergun","bodyslam"],10:["waterpulse"],20:["surf"]},e:{l:40,to:"wailord"},ab:"waterabsorb",cr:125,xp:80,em:"🐋"},
wailord:    {n:"고래왕",id:321,t:["water"],s:[170,90,45,90,45,60],ml:{1:["watergun","bodyslam"],40:["surf"],48:["hydropump"]},e:null,ab:"waterabsorb",cr:60,xp:175,em:"🐋"},
numel:      {n:"둔타",id:322,t:["fire","ground"],s:[60,60,40,65,45,35],ml:{1:["tackle","ember"],8:["mudslap"],15:["flamethrower"]},e:{l:33,to:"camerupt"},ab:"oblivious",cr:255,xp:61,em:"🐪"},
camerupt:   {n:"폭타",id:323,t:["fire","ground"],s:[70,100,70,105,75,40],ml:{1:["ember","mudslap"],33:["flamethrower"],39:["earthquake"],47:["fireblast"]},e:null,ab:"solidrock",cr:150,xp:161,em:"🐪"},
torkoal:    {n:"코터스",id:324,t:["fire"],s:[70,85,140,85,70,20],ml:{1:["ember","smokescreen"],7:["flamethrower"],18:["bodyslam"],30:["fireblast"]},e:null,ab:"drought",cr:90,xp:165,em:"🐢"},
spoink:     {n:"피그점프",id:325,t:["psychic"],s:[60,25,35,70,80,60],ml:{1:["confusion","psybeam"],10:["confuseray"],18:["psychic"]},e:{l:32,to:"grumpig"},ab:"thickfat",cr:255,xp:66,em:"🐷"},
grumpig:    {n:"피그킹",id:326,t:["psychic"],s:[80,45,65,90,110,80],ml:{1:["confusion","psybeam"],32:["psychic"],42:["shadowball"]},e:null,ab:"thickfat",cr:60,xp:165,em:"🐷"},
spinda:     {n:"얼루기",id:327,t:["normal"],s:[60,60,60,60,60,60],ml:{1:["tackle","confusion"],5:["bodyslam"],12:["doubleedge"]},e:null,ab:"owntempo",cr:255,xp:126,em:"🐼"},
cacnea:     {n:"선인왕",id:331,t:["grass"],s:[50,85,40,85,40,35],ml:{1:["absorb","poisonsting"],9:["razorleaf"],17:["swordsdance"]},e:{l:32,to:"cacturne"},ab:"sandveil",cr:190,xp:67,em:"🌵"},
cacturne:   {n:"밤선인",id:332,t:["grass","dark"],s:[70,115,60,115,60,55],ml:{1:["absorb","razorleaf"],32:["darkpulse"],44:["swordsdance"]},e:null,ab:"sandveil",cr:60,xp:166,em:"🌵"},
zangoose:   {n:"쟝고",id:335,t:["normal"],s:[73,115,60,60,60,90],ml:{1:["scratch","quickattack"],7:["swordsdance"],22:["closecombat"]},e:null,ab:"immunity",cr:90,xp:160,em:"🐾"},
seviper:    {n:"세비퍼",id:336,t:["poison"],s:[73,100,60,100,60,65],ml:{1:["bite","poisonsting"],7:["sludge"],22:["sludgebomb"],34:["crunch"]},e:null,ab:"shedskin",cr:90,xp:160,em:"🐍"},
lunatone:   {n:"루나톤",id:337,t:["rock","psychic"],s:[90,55,65,95,85,70],ml:{1:["confusion","rockthrow"],9:["psychic"],25:["rockslide"]},e:null,ab:"levitate",cr:45,xp:161,em:"🌙"},
solrock:    {n:"솔록",id:338,t:["rock","psychic"],s:[90,95,85,55,65,70],ml:{1:["confusion","rockthrow"],9:["rockslide"],25:["psychic"],33:["fireblast"]},e:null,ab:"levitate",cr:45,xp:161,em:"☀️"},
barboach:   {n:"미꾸리",id:339,t:["water","ground"],s:[50,48,43,46,41,60],ml:{1:["watergun","mudslap"],6:["waterpulse"],20:["earthquake"]},e:{l:30,to:"whiscash"},ab:"oblivious",cr:190,xp:58,em:"🐟"},
whiscash:   {n:"메깅",id:340,t:["water","ground"],s:[110,78,73,76,71,60],ml:{1:["watergun","mudslap"],30:["surf"],36:["earthquake"]},e:null,ab:"oblivious",cr:75,xp:164,em:"🐟"},
corphish:   {n:"가재군",id:341,t:["water"],s:[43,80,65,50,35,35],ml:{1:["watergun","bite"],7:["bubblebeam"],15:["crunch"]},e:{l:30,to:"crawdaunt"},ab:"shellarmor",cr:205,xp:62,em:"🦞"},
crawdaunt:  {n:"가재장군",id:342,t:["water","dark"],s:[63,120,85,90,55,55],ml:{1:["watergun","crunch"],30:["surf"],38:["darkpulse"]},e:null,ab:"adaptability",cr:155,xp:164,em:"🦞"},
baltoy:     {n:"오뚝군",id:343,t:["ground","psychic"],s:[40,40,55,40,70,55],ml:{1:["confusion","mudslap"],7:["rockthrow"],15:["psybeam"]},e:{l:36,to:"claydol"},ab:"levitate",cr:255,xp:60,em:"🏺"},
claydol:    {n:"점토도리",id:344,t:["ground","psychic"],s:[60,70,105,70,120,75],ml:{1:["confusion","mudslap"],36:["psychic"],42:["earthquake"]},e:null,ab:"levitate",cr:90,xp:175,em:"🏺"},
lileep:     {n:"릴리요",id:345,t:["rock","grass"],s:[66,41,77,61,87,23],ml:{1:["absorb","rockthrow"],9:["megadrain"],21:["rockslide"]},e:{l:40,to:"cradily"},ab:"shedskin",cr:45,xp:71,em:"🌿"},
cradily:    {n:"릴리암",id:346,t:["rock","grass"],s:[86,81,97,81,107,43],ml:{1:["absorb","rockthrow"],40:["rockslide"],46:["stoneedge"]},e:null,ab:"shedskin",cr:45,xp:173,em:"🌿"},
anorith:    {n:"아노딥스",id:347,t:["rock","bug"],s:[45,95,50,40,50,75],ml:{1:["scratch","bugbite"],7:["rockthrow"],21:["xscissor"]},e:{l:40,to:"armaldo"},ab:"battlearmor",cr:45,xp:71,em:"🦐"},
armaldo:    {n:"아말도",id:348,t:["rock","bug"],s:[75,125,100,70,80,45],ml:{1:["scratch","xscissor"],40:["rockslide"],46:["stoneedge"]},e:null,ab:"battlearmor",cr:45,xp:173,em:"🦐"},
castform:   {n:"캐스퐁",id:351,t:["normal"],s:[70,70,70,70,70,70],ml:{1:["tackle","watergun"],10:["ember"],20:["icebeam"]},e:null,ab:"keeneye",cr:45,xp:147,em:"☁️"},
kecleon:    {n:"켈리몬",id:352,t:["normal"],s:[60,90,70,60,120,40],ml:{1:["scratch","bite"],7:["shadowball"],18:["bodyslam"]},e:null,ab:"colorchange",cr:200,xp:154,em:"🦎"},
shuppet:    {n:"어둠대자",id:353,t:["ghost"],s:[44,75,35,63,33,45],ml:{1:["nightshade","confuseray"],8:["hex"],16:["shadowball"]},e:{l:37,to:"banette"},ab:"insomnia",cr:225,xp:59,em:"👻"},
banette:    {n:"다크팻",id:354,t:["ghost"],s:[64,115,65,83,63,65],ml:{1:["nightshade","hex"],37:["shadowball"],45:["darkpulse"]},e:null,ab:"insomnia",cr:45,xp:159,em:"👻"},
duskull:    {n:"해골몽",id:355,t:["ghost"],s:[20,40,90,30,90,25],ml:{1:["nightshade","confuseray"],6:["hex"],12:["willowisp"]},e:{l:37,to:"dusclops"},ab:"levitate",cr:190,xp:59,em:"💀"},
dusclops:   {n:"미라몽",id:356,t:["ghost"],s:[40,70,130,60,130,25],ml:{1:["nightshade","hex"],37:["shadowball"],45:["willowisp"]},e:null,ab:"pressure",cr:90,xp:159,em:"💀"},
tropius:    {n:"트로피우스",id:357,t:["grass","flying"],s:[99,68,83,72,87,51],ml:{1:["razorleaf","wingattack"],10:["bodyslam"],21:["solarbeam"],30:["aerialace"]},e:null,ab:"chlorophyll",cr:200,xp:161,em:"🌴"},
chimecho:   {n:"치렁",id:358,t:["psychic"],s:[75,50,80,95,90,65],ml:{1:["confusion","psybeam"],14:["psychic"],22:["shadowball"]},e:null,ab:"levitate",cr:45,xp:159,em:"🔔"},
wynaut:     {n:"마자용",id:360,t:["psychic"],s:[95,23,48,23,48,23],ml:{1:["counter","mirrorcoat"],15:["encore"]},e:{l:15,to:"wobbuffet"},ab:"shadowtag",cr:125,xp:52,em:"🤡"},
snorunt:    {n:"눈꼬마",id:361,t:["ice"],s:[50,50,50,50,50,50],ml:{1:["tackle","icebeam"],7:["bite"],13:["harden"]},e:{l:42,to:"glalie"},ab:"innerfocus",cr:190,xp:60,em:"❄️"},
glalie:     {n:"얼음귀신",id:362,t:["ice"],s:[80,80,80,80,80,80],ml:{1:["icebeam","bite"],42:["crunch"],50:["blizzard"]},e:null,ab:"innerfocus",cr:75,xp:168,em:"❄️"},
spheal:     {n:"대굴레오",id:363,t:["ice","water"],s:[70,40,50,55,50,25],ml:{1:["watergun","defensecurl"],7:["icebeam"],13:["bodyslam"]},e:{l:32,to:"sealeo"},ab:"thickfat",cr:255,xp:58,em:"🦭"},
sealeo:     {n:"씨레오",id:364,t:["ice","water"],s:[90,60,70,75,70,45],ml:{1:["watergun","icebeam"],32:["bodyslam"],38:["blizzard"]},e:{l:44,to:"walrein"},ab:"thickfat",cr:120,xp:144,em:"🦭"},
walrein:    {n:"씨카이저",id:365,t:["ice","water"],s:[110,80,90,95,90,65],ml:{1:["icebeam","surf"],44:["blizzard"],50:["earthquake"]},e:null,ab:"thickfat",cr:45,xp:239,em:"🦭"},
clamperl:   {n:"진주몽",id:366,t:["water"],s:[35,64,85,74,55,32],ml:{1:["watergun","tackle"],10:["bodyslam"],20:["surf"],30:["hydropump"]},e:null,ab:"shellarmor",cr:255,xp:69,em:"🐚"},
huntail:    {n:"헌테일",id:367,t:["water"],s:[55,104,105,94,75,52],ml:{1:["bite","watergun"],11:["crunch"],23:["aquatail"]},e:null,ab:"swiftswim",cr:60,xp:170,em:"🐟"},
gorebyss:   {n:"분홍장이",id:368,t:["water"],s:[55,84,105,114,75,52],ml:{1:["watergun","confusion"],11:["psychic"],23:["hydropump"]},e:null,ab:"swiftswim",cr:60,xp:170,em:"🐟"},
relicanth:  {n:"시라칸",id:369,t:["water","rock"],s:[100,90,130,45,65,55],ml:{1:["tackle","watergun"],8:["rockthrow"],22:["rockslide"],36:["doubleedge"]},e:null,ab:"rockhead",cr:25,xp:170,em:"🐟"},
luvdisc:    {n:"사랑동이",id:370,t:["water"],s:[43,30,55,40,65,97],ml:{1:["tackle","watergun"],4:["waterpulse"],13:["aquatail"]},e:null,ab:"swiftswim",cr:225,xp:116,em:"💕"},
// ── Gen 4: 신오 지방 포켓몬 ──
turtwig:    {n:"모부기",id:387,t:["grass"],s:[55,68,64,45,55,31],ml:{1:["tackle","absorb"],9:["razorleaf"],17:["megadrain"]},e:{l:18,to:"grotle"},ab:"overgrow",cr:45,xp:64,em:"🐢"},
grotle:     {n:"수풀부기",id:388,t:["grass"],s:[75,89,85,55,65,36],ml:{1:["tackle","razorleaf"],18:["megadrain"],27:["crunch"]},e:{l:32,to:"torterra"},ab:"overgrow",cr:45,xp:142,em:"🐢"},
torterra:   {n:"토대부기",id:389,t:["grass","ground"],s:[95,109,105,75,85,56],ml:{1:["razorleaf","earthquake"],32:["solarbeam"],45:["earthquake"]},e:null,ab:"overgrow",cr:45,xp:236,em:"🐢"},
chimchar:   {n:"불꽃숭이",id:390,t:["fire"],s:[44,58,44,58,44,61],ml:{1:["scratch","ember"],7:["ember"],14:["flamethrower"]},e:{l:14,to:"monferno"},ab:"blaze",cr:45,xp:62,em:"🐵"},
monferno:   {n:"파이숭이",id:391,t:["fire","fighting"],s:[64,78,52,78,52,81],ml:{1:["scratch","ember"],14:["brickbreak"],26:["flamethrower"]},e:{l:36,to:"infernape"},ab:"blaze",cr:45,xp:142,em:"🐵"},
infernape:  {n:"초염몽",id:392,t:["fire","fighting"],s:[76,104,71,104,71,108],ml:{1:["ember","brickbreak"],36:["closecombat"],42:["fireblast"]},e:null,ab:"blaze",cr:45,xp:240,em:"🐵"},
piplup:     {n:"팽도리",id:393,t:["water"],s:[53,51,53,61,56,40],ml:{1:["pound","watergun"],8:["bubblebeam"],15:["waterpulse"]},e:{l:16,to:"prinplup"},ab:"torrent",cr:45,xp:63,em:"🐧"},
prinplup:   {n:"팽태자",id:394,t:["water"],s:[64,66,68,81,76,50],ml:{1:["pound","watergun"],16:["bubblebeam"],24:["surf"]},e:{l:36,to:"empoleon"},ab:"torrent",cr:45,xp:142,em:"🐧"},
empoleon:   {n:"엠페르트",id:395,t:["water","steel"],s:[84,86,88,111,101,60],ml:{1:["watergun","metalclaw"],36:["surf","flashcannon"],46:["hydropump"]},e:null,ab:"torrent",cr:45,xp:239,em:"🐧"},
starly:     {n:"찌르꼬",id:396,t:["normal","flying"],s:[40,55,30,30,30,60],ml:{1:["tackle","wingattack"],5:["quickattack"],14:["aerialace"]},e:{l:14,to:"staravia"},ab:"keeneye",cr:255,xp:49,em:"🐦"},
staravia:   {n:"찌르버드",id:397,t:["normal","flying"],s:[55,75,50,40,40,80],ml:{1:["quickattack","wingattack"],14:["aerialace"],25:["doubleedge"]},e:{l:34,to:"staraptor"},ab:"intimidate",cr:120,xp:119,em:"🐦"},
staraptor:  {n:"찌르호크",id:398,t:["normal","flying"],s:[85,120,70,50,60,100],ml:{1:["wingattack","aerialace"],34:["closecombat"],41:["drillpeck"]},e:null,ab:"intimidate",cr:45,xp:218,em:"🐦"},
shinx:      {n:"꼬링크",id:403,t:["electric"],s:[45,65,34,40,34,45],ml:{1:["tackle","thundershock"],9:["spark"],18:["bite"]},e:{l:15,to:"luxio"},ab:"intimidate",cr:235,xp:53,em:"⚡"},
luxio:      {n:"럭시오",id:404,t:["electric"],s:[60,85,49,60,49,60],ml:{1:["spark","bite"],15:["thunderbolt"],26:["crunch"]},e:{l:30,to:"luxray"},ab:"intimidate",cr:120,xp:127,em:"⚡"},
luxray:     {n:"렌트라",id:405,t:["electric"],s:[80,120,79,95,79,70],ml:{1:["spark","crunch"],30:["thunderbolt"],42:["thunder"]},e:null,ab:"intimidate",cr:45,xp:235,em:"⚡"},
cranidos:   {n:"두개도스",id:408,t:["rock"],s:[67,125,40,30,30,58],ml:{1:["slam","rockthrow"],10:["rockslide"],19:["stoneedge"]},e:{l:30,to:"rampardos"},ab:"moldbreaker",cr:45,xp:70,em:"🦕"},
rampardos:  {n:"램펄드",id:409,t:["rock"],s:[97,165,60,65,50,58],ml:{1:["slam","rockslide"],30:["stoneedge"],43:["earthquake"]},e:null,ab:"moldbreaker",cr:45,xp:173,em:"🦕"},
shieldon:   {n:"방패톱스",id:410,t:["rock","steel"],s:[30,42,118,42,88,30],ml:{1:["tackle","metalclaw"],10:["ironhead"],19:["rockslide"]},e:{l:30,to:"bastiodon"},ab:"sturdy",cr:45,xp:70,em:"🛡️"},
bastiodon:  {n:"바리톱스",id:411,t:["rock","steel"],s:[60,52,168,47,138,30],ml:{1:["metalclaw","ironhead"],30:["flashcannon"],43:["stoneedge"]},e:null,ab:"sturdy",cr:45,xp:173,em:"🛡️"},
drifloon:   {n:"흘림볼",id:425,t:["ghost","flying"],s:[90,50,34,60,44,70],ml:{1:["confusion","hex"],14:["shadowball"],22:["wingattack"]},e:{l:28,to:"drifblim"},ab:"levitate",cr:125,xp:70,em:"🎈"},
drifblim:   {n:"둥실라이드",id:426,t:["ghost","flying"],s:[150,80,44,90,54,80],ml:{1:["hex","shadowball"],28:["wingattack"],40:["explosion"]},e:null,ab:"levitate",cr:60,xp:174,em:"🎈"},
gible:      {n:"딥상어동",id:443,t:["dragon","ground"],s:[58,70,45,40,45,42],ml:{1:["tackle","bite"],7:["mudslap"],10:["sandattack"],13:["dragonbreath"],17:["rockslide"]},e:{l:24,to:"gabite"},ab:"roughskin",cr:45,xp:60,em:"🦈"},
gabite:     {n:"한바이트",id:444,t:["dragon","ground"],s:[68,90,65,50,55,82],ml:{1:["bite","dragonbreath"],18:["mudshot"],24:["dragonclaw"],28:["sandattack"],33:["dig"],36:["rockslide"]},e:{l:48,to:"garchomp"},ab:"roughskin",cr:45,xp:144,em:"🦈"},
garchomp:   {n:"한카리아스",id:445,t:["dragon","ground"],s:[108,130,95,80,85,102],ml:{1:["dragonclaw","earthquake"],28:["mudshot"],34:["rockslide"],40:["dig"],48:["outrage"],52:["stoneedge"],55:["fireblast"],60:["dragonpulse"]},e:null,ab:["sandveil","roughskin"],cr:45,xp:270,em:"🦈"},
riolu:      {n:"리오루",id:447,t:["fighting"],s:[40,70,40,35,40,60],ml:{1:["quickattack","lowkick"],6:["focusenergy"],8:["brickbreak"],11:["counter"],14:["rockslide"]},e:{l:25,to:"lucario"},ab:["steadfast","innerfocus"],cr:75,xp:57,em:"🐕"},
lucario:    {n:"루카리오",id:448,t:["fighting","steel"],s:[70,110,70,115,70,90],ml:{1:["quickattack","brickbreak"],18:["metalclaw"],22:["counter"],25:["closecombat"],30:["flashcannon"],35:["aurasphere"],40:["swordsdance"],42:["ironhead"]},e:null,ab:["steadfast","innerfocus"],cr:45,xp:184,em:"🐕"},
skorupi:    {n:"스콜피",id:451,t:["poison","bug"],s:[40,50,90,30,55,65],ml:{1:["poisonsting","bite"],9:["bugbite"],16:["crunch"]},e:{l:40,to:"drapion"},ab:"battlearmor",cr:120,xp:66,em:"🦂"},
drapion:    {n:"드래피온",id:452,t:["poison","dark"],s:[70,90,110,60,75,95],ml:{1:["bite","crunch"],40:["darkpulse"],48:["sludgebomb"]},e:null,ab:"battlearmor",cr:45,xp:175,em:"🦂"},
croagunk:   {n:"삐딱구리",id:453,t:["poison","fighting"],s:[48,61,40,61,40,50],ml:{1:["poisonsting","lowkick"],8:["sludge"],17:["brickbreak"]},e:{l:37,to:"toxicroak"},ab:"poisontouch",cr:140,xp:60,em:"🐸"},
toxicroak:  {n:"독개굴",id:454,t:["poison","fighting"],s:[83,106,65,86,65,85],ml:{1:["poisonsting","brickbreak"],37:["sludgebomb"],44:["closecombat"]},e:null,ab:"poisontouch",cr:75,xp:172,em:"🐸"},
carnivine:  {n:"무스틈니",id:455,t:["grass"],s:[74,100,72,90,72,46],ml:{1:["vinewhip","bite"],17:["razorleaf"],27:["crunch"],37:["solarbeam"]},e:null,ab:"levitate",cr:200,xp:159,em:"🌿"},
snover:     {n:"눈쓰개",id:459,t:["grass","ice"],s:[60,62,50,62,60,40],ml:{1:["absorb","icebeam"],5:["razorleaf"],13:["icebeam"]},e:{l:40,to:"abomasnow"},ab:"snowwarning",cr:120,xp:67,em:"🌲"},
abomasnow:  {n:"눈설왕",id:460,t:["grass","ice"],s:[90,92,75,92,85,60],ml:{1:["razorleaf","icebeam"],40:["blizzard"],47:["solarbeam"]},e:null,ab:"snowwarning",cr:60,xp:173,em:"🌲"},
// Gen 4 추가 포켓몬
bidoof:     {n:"비달",id:399,t:["normal"],s:[59,45,40,35,40,31],ml:{1:["tackle","growl"],7:["bite"],13:["bodyslam"]},e:{l:15,to:"bibarel"},ab:"runaway",cr:255,xp:50,em:"🦫"},
bibarel:    {n:"비버니",id:400,t:["normal","water"],s:[79,85,60,55,60,71],ml:{1:["tackle","watergun"],15:["surf"],25:["aquatail"]},e:null,ab:"runaway",cr:127,xp:144,em:"🦫"},
kricketot:  {n:"귀뚤뚜기",id:401,t:["bug"],s:[37,25,41,25,41,25],ml:{1:["tackle","bugbite"],10:["furycutter"]},e:{l:10,to:"kricketune"},ab:"shedskin",cr:255,xp:39,em:"🦗"},
kricketune: {n:"귀뚤톡크",id:402,t:["bug"],s:[77,85,51,55,51,65],ml:{1:["bugbite","furycutter"],10:["xscissor"],22:["megahorn"]},e:null,ab:"swarm",cr:45,xp:134,em:"🦗"},
budew:      {n:"꼬몽울",id:406,t:["grass","poison"],s:[40,30,35,50,70,55],ml:{1:["absorb","poisonsting"],7:["megadrain"],13:["razorleaf"],19:["gigadrain"]},e:{l:14,to:"roselia"},ab:"naturalcure",cr:255,xp:56,em:"🌹"},
roserade:   {n:"로즈레이드",id:407,t:["grass","poison"],s:[60,70,65,125,105,90],ml:{1:["megadrain","sludgebomb","razorleaf"],20:["gigadrain"],30:["solarbeam"],40:["toxic"]},e:null,ab:"naturalcure",cr:75,xp:232,em:"🌹"},
burmy:      {n:"도롱충이",id:412,t:["bug"],s:[40,29,45,29,45,36],ml:{1:["tackle","bugbite"],10:["harden"],20:["signalbeam"]},e:{l:20,to:"wormadam"},ab:"shedskin",cr:120,xp:31,em:"🐛"},
wormadam:   {n:"도롱마담",id:413,t:["bug","grass"],s:[60,59,85,79,105,36],ml:{1:["bugbite","razorleaf"],20:["xscissor"],30:["solarbeam"]},e:null,ab:"shedskin",cr:45,xp:148,em:"🐛"},
mothim:     {n:"나메일",id:414,t:["bug","flying"],s:[70,94,50,94,50,66],ml:{1:["bugbite","confusion"],20:["aerialace"],30:["psychic"],38:["silverwind"]},e:null,ab:"swarm",cr:45,xp:148,em:"🦋"},
combee:     {n:"세꿀눈",id:415,t:["bug","flying"],s:[30,30,42,30,42,70],ml:{1:["bugbite","tackle"],12:["gust"],20:["airslash"]},e:{l:21,to:"vespiquen"},ab:"keeneye",cr:120,xp:49,em:"🐝"},
vespiquen:  {n:"비퀸",id:416,t:["bug","flying"],s:[70,80,102,80,102,40],ml:{1:["bugbite","wingattack"],21:["xscissor"],29:["aerialace"],37:["megahorn"]},e:null,ab:"pressure",cr:45,xp:166,em:"🐝"},
pachirisu:  {n:"파치리스",id:417,t:["electric"],s:[60,45,70,45,90,95],ml:{1:["quickattack","spark"],9:["thundershock"],17:["thunderbolt"]},e:null,ab:"runaway",cr:200,xp:142,em:"🐿️"},
buizel:     {n:"브이젤",id:418,t:["water"],s:[55,65,35,60,30,85],ml:{1:["watergun","quickattack"],11:["aquatail"],18:["bite"]},e:{l:26,to:"floatzel"},ab:"swiftswim",cr:190,xp:66,em:"🦦"},
floatzel:   {n:"플로젤",id:419,t:["water"],s:[85,105,55,85,50,115],ml:{1:["watergun","aquatail"],26:["surf"],33:["crunch"],40:["hydropump"]},e:null,ab:"swiftswim",cr:75,xp:173,em:"🦦"},
cherubi:    {n:"체리버",id:420,t:["grass"],s:[45,35,45,62,53,35],ml:{1:["tackle","absorb"],10:["razorleaf"],19:["megadrain"]},e:{l:25,to:"cherrim"},ab:"chlorophyll",cr:190,xp:55,em:"🍒"},
cherrim:    {n:"체리꼬",id:421,t:["grass"],s:[70,60,70,87,78,85],ml:{1:["razorleaf","megadrain"],25:["solarbeam"],33:["dazzlinggleam"]},e:null,ab:"chlorophyll",cr:75,xp:158,em:"🍒"},
shellos:    {n:"깝질무",id:422,t:["water"],s:[76,48,48,57,62,34],ml:{1:["watergun","mudslap"],11:["waterpulse"],22:["surf"]},e:{l:30,to:"gastrodon"},ab:"keeneye",cr:190,xp:65,em:"🐌"},
gastrodon:  {n:"트리토돈",id:423,t:["water","ground"],s:[111,83,68,92,82,39],ml:{1:["watergun","mudslap"],30:["surf"],38:["earthquake"],46:["hydropump"]},e:null,ab:"keeneye",cr:75,xp:166,em:"🐌"},
ambipom:    {n:"겟핸보숭",id:424,t:["normal"],s:[75,100,66,60,66,115],ml:{1:["scratch","quickattack"],11:["slam"],22:["doubleedge"],33:["bodyslam"]},e:null,ab:"technician",cr:45,xp:169,em:"🐒"},
buneary:    {n:"이어롤",id:427,t:["normal"],s:[55,66,44,44,56,85],ml:{1:["pound","quickattack"],10:["bodyslam"],16:["bite"]},e:{l:25,to:"lopunny"},ab:"runaway",cr:190,xp:70,em:"🐰"},
lopunny:    {n:"이어롭",id:428,t:["normal"],s:[65,76,84,54,96,105],ml:{1:["pound","quickattack"],25:["bodyslam"],33:["doubleedge"],42:["closecombat"]},e:null,ab:"limber",cr:60,xp:168,em:"🐰"},
mismagius:  {n:"무우마직",id:429,t:["ghost"],s:[60,60,60,105,105,105],ml:{1:["hex","confuseray","shadowball"],30:["psychic"],40:["darkpulse"]},e:null,ab:"levitate",cr:45,xp:173,em:"🔮"},
honchkrow:  {n:"돈크로우",id:430,t:["dark","flying"],s:[100,125,52,105,52,71],ml:{1:["bite","wingattack","darkpulse"],30:["aerialace"],40:["crunch"]},e:null,ab:"insomnia",cr:30,xp:177,em:"🦅"},
glameow:    {n:"나옹마",id:431,t:["normal"],s:[49,55,42,42,37,85],ml:{1:["scratch","quickattack"],13:["bite"],25:["bodyslam"]},e:{l:38,to:"purugly"},ab:"limber",cr:190,xp:62,em:"🐱"},
purugly:    {n:"몬냥이",id:432,t:["normal"],s:[71,82,64,64,59,112],ml:{1:["scratch","bite"],38:["bodyslam"],44:["doubleedge"]},e:null,ab:"thickfat",cr:75,xp:158,em:"🐱"},
chingling:  {n:"랑딸랑",id:433,t:["psychic"],s:[45,30,50,65,50,45],ml:{1:["confusion","confuseray"],10:["psybeam"],20:["psychic"]},e:{l:20,to:"chimecho"},ab:"levitate",cr:120,xp:57,em:"🔔"},
stunky:     {n:"스컹뿡",id:434,t:["poison","dark"],s:[63,63,47,41,41,74],ml:{1:["poisonsting","bite"],12:["sludge"],23:["crunch"]},e:{l:34,to:"skuntank"},ab:"stench",cr:225,xp:66,em:"🦨"},
skuntank:   {n:"스컹탱크",id:435,t:["poison","dark"],s:[103,93,67,71,61,84],ml:{1:["poisonsting","bite"],34:["sludgebomb"],42:["darkpulse"],50:["explosion"]},e:null,ab:"stench",cr:60,xp:168,em:"🦨"},
bronzor:    {n:"동미러",id:436,t:["steel","psychic"],s:[57,24,86,24,86,23],ml:{1:["tackle","confusion"],10:["psybeam"],19:["metalclaw"]},e:{l:33,to:"bronzong"},ab:"levitate",cr:255,xp:60,em:"🥉"},
bronzong:   {n:"동탁군",id:437,t:["steel","psychic"],s:[67,89,116,79,116,33],ml:{1:["confusion","metalclaw"],33:["psychic"],39:["flashcannon"],45:["ironhead"]},e:null,ab:"levitate",cr:90,xp:175,em:"🥉"},
bonsly:     {n:"꼬지지",id:438,t:["rock"],s:[50,80,95,10,45,10],ml:{1:["rockthrow","harden"],8:["rockslide"],20:["earthquake"]},e:{l:15,to:"sudowoodo"},ab:"sturdy",cr:255,xp:58,em:"🌳"},
mimejr:     {n:"흉내내",id:439,t:["psychic","fairy"],s:[20,25,45,70,90,60],ml:{1:["confusion","confuseray"],11:["psybeam"],18:["dazzlinggleam"]},e:null,ab:"filter",cr:145,xp:62,em:"🤡"},
happiny:    {n:"핑복",id:440,t:["normal"],s:[100,5,5,15,65,30],ml:{1:["pound","defensecurl"],10:["bodyslam"],20:["softboiled"],25:["dazzlinggleam"]},e:{l:15,to:"chansey"},ab:"naturalcure",cr:130,xp:110,em:"💗"},
chatot:     {n:"페라페",id:441,t:["normal","flying"],s:[76,65,45,92,42,91],ml:{1:["peck","sing"],9:["aerialace"],21:["hyperbeam"]},e:null,ab:"keeneye",cr:30,xp:144,em:"🦜"},
spiritomb:  {n:"화강돌",id:442,t:["ghost","dark"],s:[50,92,108,92,108,35],ml:{1:["bite","confuseray","shadowball"],30:["darkpulse"],40:["hex"]},e:null,ab:"pressure",cr:100,xp:170,em:"💀"},
munchlax:   {n:"먹고자",id:446,t:["normal"],s:[135,85,40,40,85,5],ml:{1:["tackle","bodyslam"],5:["lick"],9:["bite"],13:["rest"],17:["crunch"],20:["headbutt"]},e:{l:20,to:"snorlax"},ab:"pickup",cr:50,xp:78,em:"😋"},
hippopotas: {n:"히포포타스",id:449,t:["ground"],s:[68,72,78,38,42,32],ml:{1:["tackle","mudslap"],11:["dig"],19:["bite"],25:["earthquake"]},e:{l:34,to:"hippowdon"},ab:"sandstream",cr:140,xp:66,em:"🦛"},
hippowdon:  {n:"하마돈",id:450,t:["ground"],s:[108,112,118,68,72,47],ml:{1:["tackle","mudslap"],34:["earthquake"],40:["crunch"],48:["stoneedge"]},e:null,ab:"sandstream",cr:60,xp:184,em:"🦛"},
finneon:    {n:"형광어",id:456,t:["water"],s:[49,49,56,49,61,66],ml:{1:["watergun","pound"],10:["waterpulse"],22:["surf"]},e:{l:31,to:"lumineon"},ab:"swiftswim",cr:190,xp:66,em:"🐠"},
lumineon:   {n:"네오라이트",id:457,t:["water"],s:[69,69,76,69,86,91],ml:{1:["watergun","waterpulse"],31:["surf"],38:["aquatail"],46:["hydropump"]},e:null,ab:"swiftswim",cr:75,xp:161,em:"🐠"},
mantyke:    {n:"타만타",id:458,t:["water","flying"],s:[45,20,50,60,120,50],ml:{1:["watergun","wingattack"],10:["bubblebeam"],19:["aerialace"]},e:{l:20,to:"mantine"},ab:"waterabsorb",cr:25,xp:69,em:"🐟"},
weavile:    {n:"포푸니라",id:461,t:["dark","ice"],s:[70,120,65,45,85,125],ml:{1:["bite","icepunch","quickattack"],30:["crunch"],40:["darkpulse"],50:["icebeam"]},e:null,ab:"pressure",cr:45,xp:179,em:"❄️"},
magnezone:  {n:"자포코일",id:462,t:["electric","steel"],s:[70,70,115,130,90,60],ml:{1:["thundershock","metalclaw","spark"],25:["thunderwave"],30:["thunderbolt"],35:["flashcannon"],40:["voltswitch"],45:["triattack"],50:["thunder"]},e:null,ab:"sturdy",cr:30,xp:241,em:"🧲"},
lickilicky: {n:"내룸벨트",id:463,t:["normal"],s:[110,85,95,80,95,50],ml:{1:["tackle","slam","bodyslam"],30:["doubleedge"],40:["hyperbeam"]},e:null,ab:"owntempo",cr:30,xp:180,em:"👅"},
rhyperior:  {n:"거대코뿌리",id:464,t:["ground","rock"],s:[115,140,130,55,55,40],ml:{1:["rockthrow","mudslap","earthquake"],30:["stoneedge"],40:["rockslide"],50:["megahorn"]},e:null,ab:"solidrock",cr:30,xp:241,em:"🦏"},
tangrowth:  {n:"덩쿠림보",id:465,t:["grass"],s:[100,100,125,110,50,50],ml:{1:["vinewhip","absorb","megadrain"],30:["solarbeam"],40:["slam"]},e:null,ab:"chlorophyll",cr:30,xp:187,em:"🌿"},
electivire: {n:"에레키블",id:466,t:["electric"],s:[75,123,67,95,85,95],ml:{1:["thunderpunch","quickattack","spark"],30:["thunderbolt"],40:["thunder"]},e:null,ab:"vitalspirit",cr:30,xp:243,em:"⚡"},
magmortar:  {n:"마그마번",id:467,t:["fire"],s:[75,95,67,125,95,83],ml:{1:["firepunch","ember","flamethrower"],30:["fireblast"],40:["hyperbeam"]},e:null,ab:"flamebody",cr:30,xp:243,em:"🔥"},
togekiss:   {n:"토게키스",id:468,t:["fairy","flying"],s:[85,50,95,120,115,80],ml:{1:["dazzlinggleam","aerialace","moonblast"],25:["airslash"],30:["psychic"],35:["wish"],40:["hyperbeam"],45:["aurasphere"]},e:null,ab:"serenegrace",cr:30,xp:245,em:"🕊️"},
yanmega:    {n:"메가자리",id:469,t:["bug","flying"],s:[86,76,86,116,56,95],ml:{1:["bugbite","aerialace","wingattack"],30:["xscissor"],40:["psychic"]},e:null,ab:"speedboost",cr:30,xp:180,em:"🪰"},
leafeon:    {n:"리피아",id:470,t:["grass"],s:[65,110,130,60,65,95],ml:{1:["razorleaf","quickattack","vinewhip"],15:["sandattack"],22:["gigadrain"],30:["solarbeam"],35:["swordsdance"],40:["doubleedge"],45:["grassknot"]},e:null,ab:"chlorophyll",cr:45,xp:184,em:"🍃"},
glaceon:    {n:"글레이시즈카",id:471,t:["ice"],s:[65,60,110,130,95,65],ml:{1:["icebeam","quickattack","bite"],15:["sandattack"],22:["frostbreath"],30:["blizzard"],35:["wish"],40:["icepunch"],45:["shadowball"]},e:null,ab:"snowcloak",cr:45,xp:184,em:"🧊"},
gliscor:    {n:"글라이온",id:472,t:["ground","flying"],s:[75,95,125,45,75,95],ml:{1:["mudslap","bite","aerialace"],30:["earthquake"],40:["crunch"]},e:null,ab:"immunity",cr:30,xp:179,em:"🦇"},
mamoswine:  {n:"맘모꾸리",id:473,t:["ice","ground"],s:[110,130,80,70,60,80],ml:{1:["icebeam","mudslap","earthquake"],30:["blizzard"],40:["stoneedge"]},e:null,ab:"thickfat",cr:50,xp:239,em:"🦣"},
porygonz:   {n:"폴리곤Z",id:474,t:["normal"],s:[85,80,70,135,75,90],ml:{1:["triattack","psybeam","thunderbolt"],30:["hyperbeam"],40:["psychic"]},e:null,ab:"adaptability",cr:30,xp:241,em:"💠"},
gallade:    {n:"엘레이드",id:475,t:["psychic","fighting"],s:[68,125,65,65,115,80],ml:{1:["confusion","brickbreak","closecombat"],30:["psychic"],40:["swordsdance"]},e:null,ab:"innerfocus",cr:45,xp:233,em:"⚔️"},
probopass:  {n:"대코파스",id:476,t:["rock","steel"],s:[60,55,145,75,150,40],ml:{1:["rockthrow","metalclaw","flashcannon"],30:["stoneedge"],40:["ironhead"]},e:null,ab:"sturdy",cr:60,xp:184,em:"🗿"},
dusknoir:   {n:"야느와르몽",id:477,t:["ghost"],s:[45,100,135,65,135,45],ml:{1:["shadowball","hex","confuseray"],30:["darkpulse"],40:["earthquake"]},e:null,ab:"pressure",cr:45,xp:236,em:"👤"},
froslass:   {n:"눈여아",id:478,t:["ice","ghost"],s:[70,80,70,80,70,110],ml:{1:["icebeam","hex","confuseray"],30:["blizzard"],40:["shadowball"]},e:null,ab:"snowcloak",cr:75,xp:168,em:"🧊"},
rotom:      {n:"로토무",id:479,t:["electric","ghost"],s:[50,50,77,95,77,91],ml:{1:["thundershock","confuseray","spark"],30:["thunderbolt"],40:["shadowball"]},e:null,ab:"levitate",cr:45,xp:154,em:"🔌"},
// Gen 4 전설/환상
uxie:       {n:"유크시",id:480,t:["psychic"],s:[75,75,130,75,130,95],ml:{1:["confusion","psychic"],30:["psybeam"],50:["moonblast"]},e:null,ab:"levitate",cr:3,xp:261,em:"🧠"},
mesprit:    {n:"에무리트",id:481,t:["psychic"],s:[80,105,105,105,105,80],ml:{1:["confusion","psychic"],30:["dazzlinggleam"],50:["moonblast"]},e:null,ab:"levitate",cr:3,xp:261,em:"💖"},
azelf:      {n:"아그놈",id:482,t:["psychic"],s:[75,125,70,125,70,115],ml:{1:["confusion","psychic"],30:["fireblast"],50:["explosion"]},e:null,ab:"levitate",cr:3,xp:261,em:"💫"},
dialga:     {n:"디아루가",id:483,t:["steel","dragon"],s:[100,120,120,150,100,90],ml:{1:["dragonbreath","metalclaw"],30:["flashcannon"],50:["dragonpulse"],70:["hyperbeam"]},e:null,ab:"pressure",cr:3,xp:306,em:"💎"},
palkia:     {n:"펄기아",id:484,t:["water","dragon"],s:[90,120,100,150,120,100],ml:{1:["dragonbreath","watergun"],30:["surf"],50:["dragonpulse"],70:["hydropump"]},e:null,ab:"pressure",cr:3,xp:306,em:"💜"},
heatran:    {n:"히드런",id:485,t:["fire","steel"],s:[91,90,106,130,106,77],ml:{1:["ember","metalclaw"],30:["flamethrower"],50:["flashcannon"]},e:null,ab:"flashfire",cr:3,xp:270,em:"🌋"},
regigigas:  {n:"레지기가스",id:486,t:["normal"],s:[110,160,110,80,110,100],ml:{1:["megapunch","earthquake"],30:["bodyslam"],50:["hyperbeam"]},e:null,ab:"pressure",cr:3,xp:302,em:"🏔️"},
giratina:   {n:"기라티나",id:487,t:["ghost","dragon"],s:[150,100,120,100,120,90],ml:{1:["dragonbreath","shadowball"],30:["dragonclaw"],50:["outrage"]},e:null,ab:"pressure",cr:3,xp:306,em:"👻"},
cresselia:  {n:"크레세리아",id:488,t:["psychic"],s:[120,70,120,75,130,85],ml:{1:["confusion","moonlight"],30:["psychic"],50:["moonblast"]},e:null,ab:"levitate",cr:3,xp:270,em:"🌙"},
phione:     {n:"피오네",id:489,t:["water"],s:[80,80,80,80,80,80],ml:{1:["watergun","bubblebeam"],30:["surf"],50:["hydropump"]},e:null,ab:"keeneye",cr:30,xp:216,em:"💧"},
manaphy:    {n:"마나피",id:490,t:["water"],s:[100,100,100,100,100,100],ml:{1:["watergun","bubblebeam"],30:["surf"],50:["hydropump"]},e:null,ab:"keeneye",cr:3,xp:270,em:"🌊"},
darkrai:    {n:"다크라이",id:491,t:["dark"],s:[70,90,90,135,90,125],ml:{1:["darkpulse","hypnosis"],30:["shadowball"],50:["shadowball"]},e:null,ab:"pressure",cr:3,xp:270,em:"🌑"},
shaymin:    {n:"쉐이미",id:492,t:["grass"],s:[100,100,100,100,100,100],ml:{1:["megadrain","razorleaf"],30:["solarbeam"],50:["dazzlinggleam"]},e:null,ab:"naturalcure",cr:3,xp:270,em:"🌸"},
arceus:     {n:"아르세우스",id:493,t:["normal"],s:[120,120,120,120,120,120],ml:{1:["hyperbeam","earthquake"],30:["outrage"],50:["psychic"]},e:null,ab:"pressure",cr:3,xp:324,em:"✨"},
// ═══ Gen 5-6 (하나/Unova & 칼로스/Kalos) ═══
victini:    {n:"비크티니",id:494,t:["psychic","fire"],s:[100,100,100,100,100,100],ml:{1:["quickattack","ember"],20:["flamethrower"],35:["psychic"]},e:null,ab:"pressure",cr:3,xp:270,em:"🔥"},
snivy:    {n:"주리비얀",id:495,t:["grass"],s:[45,45,55,45,55,63],ml:{1:["tackle","leer"],17:["vinewhip"],28:["megadrain"]},e:{l:17,to:"servine"},ab:"overgrow",cr:45,xp:62,em:"🌿"},
servine:    {n:"주리번",id:496,t:["grass"],s:[60,60,75,60,75,83],ml:{1:["tackle","vinewhip"],20:["megadrain"],32:["razorleaf"]},e:{l:36,to:"serperior"},ab:"overgrow",cr:45,xp:145,em:"🌿"},
serperior:    {n:"샤로다",id:497,t:["grass"],s:[75,75,95,75,95,113],ml:{1:["vinewhip","megadrain"],30:["razorleaf"],44:["energyball"]},e:null,ab:"overgrow",cr:45,xp:238,em:"🐍"},
tepig:    {n:"뚜꾸리",id:498,t:["fire"],s:[65,63,45,45,45,45],ml:{1:["tackle","ember"],15:["smokescreen"],25:["flamethrower"]},e:{l:17,to:"pignite"},ab:"blaze",cr:45,xp:62,em:"🐷"},
pignite:    {n:"차오꿀",id:499,t:["fire","fighting"],s:[90,93,55,70,55,55],ml:{1:["tackle","ember"],20:["flamethrower"],30:["brickbreak"]},e:{l:36,to:"emboar"},ab:"blaze",cr:45,xp:146,em:"🐷"},
emboar:    {n:"염무왕",id:500,t:["fire","fighting"],s:[110,123,65,100,65,65],ml:{1:["ember","brickbreak"],30:["flamethrower"],43:["flareblitz"]},e:null,ab:"blaze",cr:45,xp:238,em:"��"},
oshawott:    {n:"수댕이",id:501,t:["water"],s:[55,55,45,63,45,45],ml:{1:["tackle","watergun"],17:["waterpulse"],25:["aquatail"]},e:{l:17,to:"dewott"},ab:"torrent",cr:45,xp:62,em:"🦦"},
dewott:    {n:"쌍검자비",id:502,t:["water"],s:[75,75,60,83,60,60],ml:{1:["tackle","watergun"],20:["waterpulse"],30:["aquatail"]},e:{l:36,to:"samurott"},ab:"torrent",cr:45,xp:145,em:"🦦"},
samurott:    {n:"대검귀",id:503,t:["water"],s:[95,100,85,108,70,70],ml:{1:["watergun","slash"],30:["aquatail"],40:["hydropump"]},e:null,ab:"torrent",cr:45,xp:238,em:"⚔️"},
patrat:    {n:"보르쥐",id:504,t:["normal"],s:[45,55,39,35,39,42],ml:{1:["tackle","leer"],13:["bite"],22:["crunch"]},e:{l:20,to:"watchog"},ab:"keeneye",cr:255,xp:51,em:"🐭"},
watchog:    {n:"보르그",id:505,t:["normal"],s:[60,85,69,60,69,77],ml:{1:["tackle","bite"],20:["crunch"],32:["slash"]},e:null,ab:"keeneye",cr:255,xp:147,em:"👀"},
lillipup:    {n:"요테리",id:506,t:["normal"],s:[45,60,45,25,45,55],ml:{1:["tackle","leer"],8:["bite"],15:["quickattack"]},e:{l:16,to:"herdier"},ab:"vitalspirit",cr:255,xp:55,em:"🐶"},
herdier:    {n:"하데리에",id:507,t:["normal"],s:[65,80,65,35,65,60],ml:{1:["tackle","bite"],20:["crunch"],28:["bodyslam"]},e:{l:32,to:"stoutland"},ab:"intimidate",cr:120,xp:130,em:"🐕"},
stoutland:    {n:"바랑도르",id:508,t:["normal"],s:[85,110,90,45,90,80],ml:{1:["bite","crunch"],32:["bodyslam"],45:["hyperbeam"]},e:null,ab:"intimidate",cr:45,xp:225,em:"🐕"},
purrloin:    {n:"쌔비냥",id:509,t:["dark"],s:[41,50,37,50,37,66],ml:{1:["scratch","growl"],10:["pursuit"],20:["slash"]},e:{l:20,to:"liepard"},ab:"limber",cr:255,xp:56,em:"🐱"},
liepard:    {n:"레파르다스",id:510,t:["dark"],s:[64,88,50,88,50,106],ml:{1:["scratch","pursuit"],22:["slash"],34:["darkpulse"]},e:null,ab:"limber",cr:90,xp:156,em:"🐆"},
pansage:    {n:"야나프",id:511,t:["grass"],s:[50,53,48,53,48,64],ml:{1:["scratch","leer"],10:["vinewhip"],22:["razorleaf"]},e:null,ab:"overgrow",cr:190,xp:63,em:"🌿"},
simisage:    {n:"야나키",id:512,t:["grass"],s:[75,98,63,98,63,101],ml:{1:["razorleaf","leer"],22:["energyball"],40:["solarbeam"]},e:null,ab:"overgrow",cr:75,xp:174,em:"🌿"},
pansear:    {n:"바오프",id:513,t:["fire"],s:[50,53,48,53,48,64],ml:{1:["scratch","leer"],10:["ember"],22:["flamethrower"]},e:null,ab:"blaze",cr:190,xp:63,em:"🔥"},
simisear:    {n:"바오키",id:514,t:["fire"],s:[75,98,63,98,63,101],ml:{1:["ember","leer"],22:["flamethrower"],40:["fireblast"]},e:null,ab:"blaze",cr:75,xp:174,em:"🔥"},
panpour:    {n:"앗차프",id:515,t:["water"],s:[50,53,48,53,48,64],ml:{1:["scratch","leer"],10:["watergun"],22:["waterpulse"]},e:null,ab:"torrent",cr:190,xp:63,em:"💧"},
simipour:    {n:"앗차키",id:516,t:["water"],s:[75,98,63,98,63,101],ml:{1:["watergun","leer"],22:["waterpulse"],40:["hydropump"]},e:null,ab:"torrent",cr:75,xp:174,em:"💧"},
munna:    {n:"몽나",id:517,t:["psychic"],s:[76,25,45,67,55,24],ml:{1:["pound","hypnosis"],13:["psybeam"],25:["psychic"]},e:null,ab:"synchronize",cr:190,xp:58,em:"🌙"},
musharna:    {n:"몽얌나",id:518,t:["psychic"],s:[116,55,85,107,95,29],ml:{1:["psybeam","hypnosis"],25:["psychic"],40:["calmmind"]},e:null,ab:"synchronize",cr:75,xp:170,em:"🌙"},
pidove:    {n:"콩둘기",id:519,t:["normal","flying"],s:[50,55,50,36,30,43],ml:{1:["tackle","growl"],15:["quickattack"],22:["airslash"]},e:{l:21,to:"tranquill"},ab:"keeneye",cr:255,xp:53,em:"🕊️"},
tranquill:    {n:"유토브",id:520,t:["normal","flying"],s:[62,77,62,50,42,65],ml:{1:["quickattack","airslash"],21:["aerialace"],30:["wingattack"]},e:{l:32,to:"unfezant"},ab:"keeneye",cr:120,xp:125,em:"🕊️"},
unfezant:    {n:"켄호로우",id:521,t:["normal","flying"],s:[80,115,80,65,55,93],ml:{1:["quickattack","airslash"],32:["bravebird"],45:["hyperbeam"]},e:null,ab:"keeneye",cr:45,xp:220,em:"��"},
blitzle:    {n:"줄뮤마",id:522,t:["electric"],s:[45,60,32,50,32,76],ml:{1:["quickattack","thunderwave"],11:["spark"],25:["thunderbolt"]},e:{l:27,to:"zebstrika"},ab:"lightningrod",cr:190,xp:59,em:"⚡"},
zebstrika:    {n:"제브라이카",id:523,t:["electric"],s:[75,100,63,80,63,116],ml:{1:["quickattack","spark"],27:["thunderbolt"],42:["wildcharge"]},e:null,ab:"lightningrod",cr:75,xp:174,em:"⚡"},
roggenrola:    {n:"단굴",id:524,t:["rock"],s:[55,75,85,25,25,15],ml:{1:["tackle","sandattack"],14:["rockthrow"],25:["rockslide"]},e:{l:25,to:"boldore"},ab:"sturdy",cr:255,xp:56,em:"🪨"},
boldore:    {n:"고르비",id:525,t:["rock"],s:[70,105,105,50,40,20],ml:{1:["tackle","rockthrow"],25:["rockslide"],36:["stoneedge"]},e:null,ab:"sturdy",cr:120,xp:137,em:"🪨"},
gigalith:    {n:"기가이어스",id:526,t:["rock"],s:[85,135,130,60,80,25],ml:{1:["rockthrow","rockslide"],36:["stoneedge"],48:["stealthrock"]},e:null,ab:"sturdy",cr:45,xp:232,em:"🪨"},
woobat:    {n:"코로모리",id:527,t:["psychic","flying"],s:[65,45,43,55,43,72],ml:{1:["confusion","airslash"],15:["psybeam"],29:["calmmind"]},e:null,ab:"keeneye",cr:190,xp:65,em:"🦇"},
swoobat:    {n:"맘박쥐",id:528,t:["psychic","flying"],s:[67,57,55,77,55,114],ml:{1:["confusion","airslash"],25:["psybeam"],36:["psychic"]},e:null,ab:"keeneye",cr:45,xp:149,em:"🦇"},
drilbur:    {n:"두더류",id:529,t:["ground"],s:[60,85,40,30,45,68],ml:{1:["scratch","mudslap"],15:["dig"],29:["earthquake"]},e:{l:31,to:"excadrill"},ab:"sandforce",cr:120,xp:66,em:"⛏️"},
excadrill:    {n:"몰드류",id:530,t:["ground","steel"],s:[110,135,60,50,65,88],ml:{1:["mudslap","ironhead"],31:["earthquake"],42:["swordsdance"]},e:null,ab:"sandforce",cr:60,xp:178,em:"⛏️"},
audino:    {n:"다부니",id:531,t:["normal"],s:[103,60,86,60,86,50],ml:{1:["pound","growl"],15:["bodyslam"],30:["wish"]},e:null,ab:"regenerator",cr:255,xp:390,em:"💗"},
timburr:    {n:"으랏차",id:532,t:["fighting"],s:[75,80,55,25,35,35],ml:{1:["pound","leer"],12:["lowkick"],20:["brickbreak"]},e:{l:25,to:"gurdurr"},ab:"guts",cr:180,xp:61,em:"💪"},
gurdurr:    {n:"토쇠골",id:533,t:["fighting"],s:[85,105,85,40,50,40],ml:{1:["pound","brickbreak"],25:["focusenergy"],37:["closecombat"]},e:null,ab:"guts",cr:90,xp:142,em:"💪"},
conkeldurr:    {n:"노보청",id:534,t:["fighting"],s:[105,140,95,55,65,45],ml:{1:["brickbreak","focusenergy"],37:["closecombat"],45:["drainpunch"]},e:null,ab:"guts",cr:45,xp:227,em:"🏗️"},
tympole:    {n:"동두리건",id:535,t:["water"],s:[50,50,40,50,40,64],ml:{1:["tackle","bubblebeam"],12:["mudslap"],20:["waterpulse"]},e:{l:25,to:"palpitoad"},ab:"swiftswim",cr:255,xp:59,em:"🎵"},
palpitoad:    {n:"두까비",id:536,t:["water","ground"],s:[75,65,55,65,55,69],ml:{1:["bubblebeam","mudslap"],25:["waterpulse"],33:["earthpower"]},e:{l:36,to:"seismitoad"},ab:"swiftswim",cr:120,xp:134,em:"🐸"},
seismitoad:    {n:"두빅굴",id:537,t:["water","ground"],s:[105,95,75,85,75,74],ml:{1:["bubblebeam","mudslap"],36:["earthpower"],44:["hydropump"]},e:null,ab:"swiftswim",cr:45,xp:229,em:"🐸"},
throh:    {n:"던지미",id:538,t:["fighting"],s:[120,100,85,30,85,45],ml:{1:["lowkick","leer"],17:["brickbreak"],33:["closecombat"]},e:null,ab:"guts",cr:45,xp:163,em:"🥋"},
sawk:    {n:"타격귀",id:539,t:["fighting"],s:[75,125,75,30,75,85],ml:{1:["lowkick","leer"],17:["brickbreak"],33:["closecombat"]},e:null,ab:"sturdy",cr:45,xp:163,em:"🥋"},
sewaddle:    {n:"두르보",id:540,t:["bug","grass"],s:[45,53,70,40,60,42],ml:{1:["tackle","bugbite"],15:["razorleaf"],20:["absorb"]},e:{l:20,to:"swadloon"},ab:"swarm",cr:255,xp:62,em:"🐛"},
swadloon:    {n:"두르쿤",id:541,t:["bug","grass"],s:[55,63,90,50,80,42],ml:{1:["bugbite","razorleaf"],20:["protect"],28:["energyball"]},e:null,ab:"chlorophyll",cr:120,xp:133,em:"🌱"},
leavanny:    {n:"모아머",id:542,t:["bug","grass"],s:[75,103,80,70,80,92],ml:{1:["bugbite","razorleaf"],32:["xscissor"],40:["energyball"]},e:null,ab:"swarm",cr:45,xp:225,em:"🍃"},
venipede:    {n:"마디네",id:543,t:["bug","poison"],s:[30,45,59,30,39,57],ml:{1:["poisonsting","leer"],12:["bugbite"],22:["poisonfang"]},e:{l:22,to:"whirlipede"},ab:"poisonpoint",cr:255,xp:52,em:"🐛"},
whirlipede:    {n:"휠구",id:544,t:["bug","poison"],s:[40,55,99,40,79,47],ml:{1:["poisonsting","bugbite"],22:["poisonfang"],28:["protect"]},e:{l:30,to:"scolipede"},ab:"poisonpoint",cr:120,xp:126,em:"🐛"},
scolipede:    {n:"펜도라",id:545,t:["bug","poison"],s:[60,100,89,55,69,112],ml:{1:["poisonsting","bugbite"],30:["sludgebomb"],44:["xscissor"]},e:null,ab:"speedboost",cr:45,xp:218,em:"🐛"},
cottonee:    {n:"소미안",id:546,t:["grass","fairy"],s:[40,27,60,37,50,66],ml:{1:["absorb","growl"],10:["megadrain"],19:["razorleaf"]},e:null,ab:"prankster",cr:190,xp:56,em:"☁️"},
whimsicott:    {n:"엘풍",id:547,t:["grass","fairy"],s:[60,67,85,77,75,116],ml:{1:["megadrain","moonblast"],28:["energyball"],40:["dazzlinggleam"]},e:null,ab:"prankster",cr:75,xp:168,em:"☁️"},
petilil:    {n:"치릴리",id:548,t:["grass"],s:[45,35,50,70,50,30],ml:{1:["absorb","growl"],10:["megadrain"],22:["energyball"]},e:null,ab:"chlorophyll",cr:190,xp:56,em:"🌸"},
lilligant:    {n:"드레디어",id:549,t:["grass"],s:[70,60,75,110,75,90],ml:{1:["megadrain","petalblizzard"],28:["energyball"],40:["solarbeam"]},e:null,ab:"chlorophyll",cr:75,xp:168,em:"🌺"},
basculin:    {n:"배쓰나이",id:550,t:["water"],s:[70,92,65,80,55,98],ml:{1:["tackle","watergun"],17:["aquatail"],28:["crunch"]},e:null,ab:"adaptability",cr:25,xp:161,em:"🐟"},
sandile:    {n:"깜눈크",id:551,t:["ground","dark"],s:[50,72,35,35,35,65],ml:{1:["leer","bite"],16:["mudslap"],22:["dig"]},e:{l:29,to:"krokorok"},ab:"intimidate",cr:180,xp:58,em:"🐊"},
krokorok:    {n:"악비르",id:552,t:["ground","dark"],s:[60,82,45,45,45,74],ml:{1:["bite","mudslap"],29:["crunch"],33:["earthquake"]},e:{l:40,to:"krookodile"},ab:"intimidate",cr:90,xp:123,em:"🐊"},
krookodile:    {n:"악비아르",id:553,t:["ground","dark"],s:[95,117,80,65,70,92],ml:{1:["bite","crunch"],40:["earthquake"],48:["darkpulse"]},e:null,ab:"intimidate",cr:45,xp:234,em:"🐊"},
darumaka:    {n:"달막화",id:554,t:["fire"],s:[70,90,45,15,45,50],ml:{1:["tackle","ember"],17:["flamethrower"],30:["flareblitz"]},e:{l:35,to:"darmanitan"},ab:"guts",cr:120,xp:63,em:"🔥"},
darmanitan:    {n:"불비달마",id:555,t:["fire"],s:[105,140,55,30,55,95],ml:{1:["tackle","flamethrower"],35:["flareblitz"],47:["fireblast"]},e:null,ab:"sheerforce",cr:60,xp:168,em:"🔥"},
maractus:    {n:"마라카치",id:556,t:["grass"],s:[75,86,67,106,67,60],ml:{1:["absorb","poisonpowder"],18:["megadrain"],30:["energyball"]},e:null,ab:"waterabsorb",cr:255,xp:161,em:"🌵"},
dwebble:    {n:"돌살이",id:557,t:["bug","rock"],s:[50,65,85,35,35,55],ml:{1:["furycutter","rockthrow"],18:["bugbite"],24:["rockslide"]},e:{l:34,to:"crustle"},ab:"sturdy",cr:190,xp:65,em:"🪨"},
crustle:    {n:"암팰리스",id:558,t:["bug","rock"],s:[70,105,125,65,75,45],ml:{1:["bugbite","rockslide"],34:["xscissor"],42:["stoneedge"]},e:null,ab:"sturdy",cr:75,xp:170,em:"🪨"},
scraggy:    {n:"곤율랭",id:559,t:["dark","fighting"],s:[50,75,70,35,70,48],ml:{1:["leer","lowkick"],12:["bite"],23:["brickbreak"]},e:{l:39,to:"scrafty"},ab:"moxie",cr:180,xp:70,em:"🦎"},
scrafty:    {n:"배루키",id:560,t:["dark","fighting"],s:[65,90,115,45,115,58],ml:{1:["lowkick","bite"],23:["brickbreak"],39:["crunch"]},e:null,ab:"moxie",cr:90,xp:171,em:"🦎"},
sigilyph:    {n:"심보러",id:561,t:["psychic","flying"],s:[72,58,80,103,80,97],ml:{1:["confusion","airslash"],24:["psybeam"],38:["psychic"]},e:null,ab:"magicguard",cr:45,xp:172,em:"👁️"},
yamask:    {n:"데스마스",id:562,t:["ghost"],s:[38,30,85,55,65,30],ml:{1:["tackle","hex"],17:["shadowball"],25:["willowisp"]},e:{l:34,to:"cofagrigus"},ab:"keeneye",cr:190,xp:61,em:"👻"},
cofagrigus:    {n:"데스니칸",id:563,t:["ghost"],s:[58,50,145,95,105,30],ml:{1:["hex","willowisp"],34:["shadowball"],45:["darkpulse"]},e:null,ab:"keeneye",cr:90,xp:169,em:"⚰️"},
tirtouga:    {n:"프로토가",id:564,t:["water","rock"],s:[54,78,103,53,45,22],ml:{1:["watergun","bite"],15:["aquatail"],25:["rockslide"]},e:{l:37,to:"carracosta"},ab:"sturdy",cr:45,xp:71,em:"🐢"},
carracosta:    {n:"늑골라",id:565,t:["water","rock"],s:[74,108,133,83,65,32],ml:{1:["watergun","rockslide"],37:["aquatail"],45:["stoneedge"]},e:null,ab:"sturdy",cr:45,xp:173,em:"🐢"},
archen:    {n:"아켄",id:566,t:["rock","flying"],s:[55,112,45,74,45,70],ml:{1:["quickattack","rockthrow"],18:["aerialace"],28:["rockslide"]},e:{l:37,to:"archeops"},ab:"defiant",cr:45,xp:71,em:"🦕"},
archeops:    {n:"아케오스",id:567,t:["rock","flying"],s:[75,140,65,112,65,110],ml:{1:["rockthrow","aerialace"],37:["rockslide"],51:["stoneedge"]},e:null,ab:"defiant",cr:45,xp:177,em:"🦕"},
trubbish:    {n:"깨봉이",id:568,t:["poison"],s:[50,50,62,40,62,65],ml:{1:["pound","poisonsting"],14:["sludge"],23:["toxic"]},e:{l:36,to:"garbodor"},ab:"stench",cr:190,xp:66,em:"🗑️"},
garbodor:    {n:"더스트나",id:569,t:["poison"],s:[80,95,82,60,82,75],ml:{1:["poisonsting","sludge"],36:["sludgebomb"],46:["toxic"]},e:null,ab:"stench",cr:60,xp:166,em:"🗑️"},
zorua:    {n:"조로아",id:570,t:["dark"],s:[40,65,40,80,40,65],ml:{1:["scratch","leer"],13:["pursuit"],25:["darkpulse"]},e:{l:30,to:"zoroark"},ab:"insomnia",cr:75,xp:66,em:"🦊"},
zoroark:    {n:"조로아크",id:571,t:["dark"],s:[60,105,60,120,60,105],ml:{1:["pursuit","scratch"],30:["darkpulse"],44:["shadowball"]},e:null,ab:"insomnia",cr:45,xp:179,em:"🦊"},
minccino:    {n:"치라미",id:572,t:["normal"],s:[55,50,40,40,40,75],ml:{1:["pound","growl"],13:["quickattack"],25:["slash"]},e:null,ab:"technician",cr:255,xp:60,em:"🐹"},
cinccino:    {n:"치라치노",id:573,t:["normal"],s:[75,95,60,65,60,115],ml:{1:["pound","quickattack"],25:["slash"],40:["bodyslam"]},e:null,ab:"technician",cr:60,xp:165,em:"🐹"},
gothita:    {n:"고디탱",id:574,t:["psychic"],s:[45,30,50,55,65,45],ml:{1:["pound","confusion"],16:["psybeam"],24:["calmmind"]},e:{l:32,to:"gothorita"},ab:"shadowtag",cr:200,xp:58,em:"🔮"},
gothorita:    {n:"고디미유",id:575,t:["psychic"],s:[60,45,70,75,85,55],ml:{1:["confusion","psybeam"],32:["psychic"],39:["calmmind"]},e:{l:41,to:"gothitelle"},ab:"shadowtag",cr:100,xp:130,em:"🔮"},
gothitelle:    {n:"고디모아젤",id:576,t:["psychic"],s:[70,55,95,95,110,65],ml:{1:["psybeam","psychic"],41:["calmmind"],48:["shadowball"]},e:null,ab:"shadowtag",cr:50,xp:221,em:"🔮"},
solosis:    {n:"유니란",id:577,t:["psychic"],s:[45,30,40,105,50,20],ml:{1:["confusion","recover"],16:["psybeam"],25:["calmmind"]},e:{l:32,to:"duosion"},ab:"magicguard",cr:200,xp:58,em:"🧬"},
duosion:    {n:"듀란",id:578,t:["psychic"],s:[65,40,50,125,60,30],ml:{1:["confusion","psybeam"],32:["psychic"],39:["calmmind"]},e:{l:41,to:"reuniclus"},ab:"magicguard",cr:100,xp:130,em:"🧬"},
reuniclus:    {n:"란쿨루스",id:579,t:["psychic"],s:[110,65,75,125,85,30],ml:{1:["psybeam","psychic"],41:["calmmind"],48:["energyball"]},e:null,ab:"magicguard",cr:50,xp:221,em:"🧬"},
ducklett:    {n:"꼬지보리",id:580,t:["water","flying"],s:[62,44,50,44,50,55],ml:{1:["watergun","wingattack"],15:["bubblebeam"],27:["airslash"]},e:{l:35,to:"swanna"},ab:"keeneye",cr:190,xp:61,em:"🦆"},
swanna:    {n:"스완나",id:581,t:["water","flying"],s:[75,87,63,87,63,98],ml:{1:["watergun","wingattack"],35:["airslash"],40:["surf"]},e:null,ab:"keeneye",cr:45,xp:166,em:"🦢"},
vanillite:    {n:"바닐프티",id:582,t:["ice"],s:[36,50,50,65,60,44],ml:{1:["tackle","aurorabeam"],13:["icebeam"],22:["icepunch"]},e:{l:35,to:"vanillish"},ab:"keeneye",cr:255,xp:61,em:"🍦"},
vanillish:    {n:"바닐리치",id:583,t:["ice"],s:[51,65,65,80,75,59],ml:{1:["tackle","aurorabeam"],35:["icebeam"],42:["blizzard"]},e:{l:47,to:"vanilluxe"},ab:"keeneye",cr:120,xp:138,em:"🍦"},
vanilluxe:    {n:"배바닐라",id:584,t:["ice"],s:[71,95,85,110,95,79],ml:{1:["aurorabeam","icebeam"],47:["blizzard"],53:["explosion"]},e:null,ab:"keeneye",cr:45,xp:241,em:"🍦"},
deerling:    {n:"사철록",id:585,t:["normal","grass"],s:[60,60,50,40,50,75],ml:{1:["tackle","growl"],16:["razorleaf"],24:["energyball"]},e:{l:34,to:"sawsbuck"},ab:"chlorophyll",cr:190,xp:67,em:"🦌"},
sawsbuck:    {n:"노고록",id:586,t:["normal","grass"],s:[80,100,70,60,70,95],ml:{1:["tackle","razorleaf"],34:["energyball"],44:["solarbeam"]},e:null,ab:"chlorophyll",cr:75,xp:166,em:"🦌"},
emolga:    {n:"에몽가",id:587,t:["electric","flying"],s:[55,75,60,75,60,103],ml:{1:["thundershock","quickattack"],15:["spark"],30:["thunderbolt"]},e:null,ab:"staticbody",cr:200,xp:150,em:"🐿️"},
karrablast:    {n:"딱정곤",id:588,t:["bug"],s:[50,75,45,40,45,60],ml:{1:["leer","furycutter"],13:["bugbite"],25:["xscissor"]},e:null,ab:"swarm",cr:200,xp:75,em:"🐛"},
escavalier:    {n:"슈발리에",id:589,t:["bug","steel"],s:[70,135,105,60,105,20],ml:{1:["furycutter","ironhead"],25:["xscissor"],40:["irondefense"]},e:null,ab:"swarm",cr:75,xp:173,em:"⚔️"},
foongus:    {n:"깜놀버슬",id:590,t:["grass","poison"],s:[69,55,45,55,55,15],ml:{1:["absorb","growl"],12:["megadrain"],24:["toxic"]},e:{l:39,to:"amoonguss"},ab:"effectspore",cr:190,xp:59,em:"🍄"},
amoonguss:    {n:"뽀록나",id:591,t:["grass","poison"],s:[114,85,70,85,80,30],ml:{1:["absorb","megadrain"],39:["sludgebomb"],43:["gigadrain"]},e:null,ab:"effectspore",cr:75,xp:162,em:"🍄"},
frillish:    {n:"탱그릴",id:592,t:["water","ghost"],s:[55,40,50,65,85,40],ml:{1:["watergun","hex"],17:["bubblebeam"],27:["shadowball"]},e:{l:40,to:"jellicent"},ab:"waterabsorb",cr:190,xp:67,em:"🪼"},
jellicent:    {n:"탱탱겔",id:593,t:["water","ghost"],s:[100,60,70,85,105,60],ml:{1:["watergun","hex"],40:["shadowball"],48:["hydropump"]},e:null,ab:"waterabsorb",cr:60,xp:168,em:"🪼"},
alomomola:    {n:"맘복치",id:594,t:["water"],s:[165,75,80,40,45,65],ml:{1:["watergun","pound"],17:["wish"],29:["surf"]},e:null,ab:"regenerator",cr:75,xp:165,em:"💗"},
joltik:    {n:"쪼마리",id:595,t:["bug","electric"],s:[50,47,50,57,50,65],ml:{1:["furycutter","thunderwave"],12:["bugbite"],20:["spark"]},e:{l:36,to:"galvantula"},ab:"compoundeyes",cr:190,xp:64,em:"🕷️"},
galvantula:    {n:"전툴라",id:596,t:["bug","electric"],s:[70,77,60,97,60,108],ml:{1:["bugbite","spark"],36:["thunderbolt"],46:["signalbeam"]},e:null,ab:"compoundeyes",cr:75,xp:165,em:"🕷️"},
ferroseed:    {n:"철시드",id:597,t:["grass","steel"],s:[44,50,91,24,86,10],ml:{1:["tackle","irondefense"],14:["leechseed"],21:["ironhead"]},e:{l:40,to:"ferrothorn"},ab:"ironbarbs",cr:255,xp:61,em:"🌰"},
ferrothorn:    {n:"너트령",id:598,t:["grass","steel"],s:[74,94,131,54,116,20],ml:{1:["tackle","ironhead"],40:["energyball"],46:["flashcannon"]},e:null,ab:"ironbarbs",cr:90,xp:171,em:"🌰"},
klink:    {n:"기어르",id:599,t:["steel"],s:[40,55,70,45,60,30],ml:{1:["tackle","thundershock"],16:["irondefense"],26:["flashcannon"]},e:{l:38,to:"klang"},ab:"clearbody",cr:130,xp:60,em:"⚙️"},
klang:    {n:"기기어르",id:600,t:["steel"],s:[60,80,95,70,85,50],ml:{1:["tackle","thundershock"],38:["flashcannon"],44:["ironhead"]},e:{l:49,to:"klinklang"},ab:"clearbody",cr:60,xp:154,em:"⚙️"},
klinklang:    {n:"기기기어르",id:601,t:["steel"],s:[60,100,115,70,85,90],ml:{1:["thundershock","flashcannon"],49:["ironhead"],54:["hyperbeam"]},e:null,ab:"clearbody",cr:30,xp:234,em:"⚙️"},
tynamo:    {n:"저리어",id:602,t:["electric"],s:[35,55,40,45,40,60],ml:{1:["tackle","thunderwave"],10:["spark"],18:["thundershock"]},e:{l:39,to:"eelektrik"},ab:"levitate",cr:190,xp:55,em:"⚡"},
eelektrik:    {n:"저리릴",id:603,t:["electric"],s:[65,85,70,75,70,40],ml:{1:["spark","thundershock"],39:["thunderbolt"],44:["crunch"]},e:null,ab:"levitate",cr:60,xp:142,em:"⚡"},
eelektross:    {n:"저리더프",id:604,t:["electric"],s:[85,115,80,105,80,50],ml:{1:["spark","thunderbolt"],44:["crunch"],54:["wildcharge"]},e:null,ab:"levitate",cr:30,xp:232,em:"⚡"},
elgyem:    {n:"리그레",id:605,t:["psychic"],s:[55,55,55,85,55,30],ml:{1:["confusion","growl"],15:["psybeam"],25:["calmmind"]},e:{l:42,to:"beheeyem"},ab:"synchronize",cr:255,xp:67,em:"👽"},
beheeyem:    {n:"벰크",id:606,t:["psychic"],s:[75,75,75,125,95,40],ml:{1:["confusion","psybeam"],42:["psychic"],50:["calmmind"]},e:null,ab:"synchronize",cr:90,xp:170,em:"👽"},
litwick:    {n:"불켜미",id:607,t:["ghost","fire"],s:[50,30,55,65,55,20],ml:{1:["ember","hex"],13:["willowisp"],24:["shadowball"]},e:{l:41,to:"lampent"},ab:"flashfire",cr:190,xp:55,em:"🕯️"},
lampent:    {n:"램프라",id:608,t:["ghost","fire"],s:[60,40,60,95,60,55],ml:{1:["ember","hex"],41:["shadowball"],49:["flamethrower"]},e:null,ab:"flashfire",cr:90,xp:130,em:"🔥"},
chandelure:    {n:"샹델라",id:609,t:["ghost","fire"],s:[60,55,90,145,90,80],ml:{1:["shadowball","flamethrower"],45:["fireblast"],50:["darkpulse"]},e:null,ab:"flashfire",cr:45,xp:234,em:"🔥"},
axew:    {n:"터검니",id:610,t:["dragon"],s:[46,87,60,30,40,57],ml:{1:["scratch","leer"],13:["dragonclaw"],24:["dragonpulse"]},e:{l:38,to:"fraxure"},ab:"moldbreaker",cr:75,xp:64,em:"🐉"},
fraxure:    {n:"액슨도",id:611,t:["dragon"],s:[66,117,70,40,50,67],ml:{1:["scratch","dragonclaw"],38:["dragonpulse"],42:["swordsdance"]},e:{l:48,to:"haxorus"},ab:"moldbreaker",cr:60,xp:144,em:"🐉"},
haxorus:    {n:"액스라이즈",id:612,t:["dragon"],s:[76,147,90,60,70,97],ml:{1:["dragonclaw","dragonpulse"],48:["outrage"],53:["swordsdance"]},e:null,ab:"moldbreaker",cr:45,xp:243,em:"🐉"},
cubchoo:    {n:"코고미",id:613,t:["ice"],s:[55,70,40,60,40,40],ml:{1:["pound","growl"],13:["icepunch"],21:["aurorabeam"]},e:{l:37,to:"beartic"},ab:"snowcloak",cr:120,xp:61,em:"🧊"},
beartic:    {n:"툰베어",id:614,t:["ice"],s:[95,130,80,70,80,50],ml:{1:["icepunch","aurorabeam"],37:["icebeam"],45:["blizzard"]},e:null,ab:"snowcloak",cr:60,xp:177,em:"🐻‍❄️"},
cryogonal:    {n:"프리지오",id:615,t:["ice"],s:[80,50,50,95,135,105],ml:{1:["icebeam","recover"],21:["aurorabeam"],37:["blizzard"]},e:null,ab:"levitate",cr:25,xp:180,em:"❄️"},
shelmet:    {n:"쪼마기",id:616,t:["bug"],s:[50,40,85,40,65,25],ml:{1:["tackle","absorb"],16:["bugbite"],28:["protect"]},e:null,ab:"shedskin",cr:200,xp:61,em:"🐛"},
accelgor:    {n:"아기르더",id:617,t:["bug"],s:[80,70,40,100,60,145],ml:{1:["quickattack","bugbite"],28:["xscissor"],40:["signalbeam"]},e:null,ab:"shedskin",cr:75,xp:173,em:"💨"},
stunfisk:    {n:"메더",id:618,t:["ground","electric"],s:[109,66,84,81,99,32],ml:{1:["mudslap","thundershock"],17:["thunderwave"],30:["earthpower"]},e:null,ab:"staticbody",cr:75,xp:165,em:"🐟"},
mienfoo:    {n:"비조푸",id:619,t:["fighting"],s:[45,85,50,55,50,65],ml:{1:["pound","lowkick"],17:["brickbreak"],29:["drainpunch"]},e:{l:50,to:"mienshao"},ab:"innerfocus",cr:180,xp:70,em:"🥊"},
mienshao:    {n:"비조도",id:620,t:["fighting"],s:[65,125,60,95,60,105],ml:{1:["lowkick","brickbreak"],50:["closecombat"],56:["aurasphere"]},e:null,ab:"innerfocus",cr:45,xp:179,em:"🥊"},
druddigon:    {n:"크리만",id:621,t:["dragon"],s:[77,120,90,60,90,48],ml:{1:["scratch","leer"],18:["bite"],27:["dragonclaw"]},e:null,ab:"roughskin",cr:45,xp:170,em:"🐲"},
golett:    {n:"골비람",id:622,t:["ground","ghost"],s:[59,74,50,35,50,35],ml:{1:["pound","mudslap"],17:["shadowclaw"],25:["earthquake"]},e:{l:43,to:"golurk"},ab:"ironfist",cr:190,xp:61,em:"🤖"},
golurk:    {n:"골루그",id:623,t:["ground","ghost"],s:[89,124,80,55,80,55],ml:{1:["mudslap","shadowclaw"],43:["earthquake"],50:["shadowball"]},e:null,ab:"ironfist",cr:90,xp:169,em:"🤖"},
pawniard:    {n:"자망칼",id:624,t:["dark","steel"],s:[45,85,70,40,40,60],ml:{1:["scratch","leer"],17:["ironhead"],25:["slash"]},e:{l:52,to:"bisharp"},ab:"defiant",cr:120,xp:68,em:"🔪"},
bisharp:    {n:"절각참",id:625,t:["dark","steel"],s:[65,125,100,60,70,70],ml:{1:["ironhead","slash"],52:["darkpulse"],57:["irondefense"]},e:null,ab:"defiant",cr:45,xp:172,em:"🔪"},
bouffalant:    {n:"버프론",id:626,t:["normal"],s:[95,110,95,40,95,55],ml:{1:["tackle","leer"],16:["pursuit"],31:["bodyslam"]},e:null,ab:"rockhead",cr:45,xp:172,em:"🐃"},
rufflet:    {n:"수리둥보",id:627,t:["normal","flying"],s:[70,83,50,37,50,60],ml:{1:["leer","scratch"],14:["wingattack"],23:["aerialace"]},e:{l:54,to:"braviary"},ab:"keeneye",cr:190,xp:70,em:"🦅"},
braviary:    {n:"워글",id:628,t:["normal","flying"],s:[100,123,75,57,75,80],ml:{1:["wingattack","aerialace"],54:["bravebird"],60:["slash"]},e:null,ab:"sheerforce",cr:60,xp:179,em:"🦅"},
vullaby:    {n:"벌차이",id:629,t:["dark","flying"],s:[70,55,75,45,65,60],ml:{1:["leer","growl"],14:["wingattack"],23:["darkpulse"]},e:{l:54,to:"mandibuzz"},ab:"keeneye",cr:190,xp:74,em:"🦅"},
mandibuzz:    {n:"버랜지나",id:630,t:["dark","flying"],s:[110,65,105,55,95,80],ml:{1:["wingattack","darkpulse"],54:["bravebird"],57:["airslash"]},e:null,ab:"keeneye",cr:60,xp:179,em:"🦅"},
heatmor:    {n:"앤티골",id:631,t:["fire"],s:[85,97,66,105,66,65],ml:{1:["leer","ember"],16:["flamethrower"],31:["fireblast"]},e:null,ab:"flashfire",cr:90,xp:169,em:"🔥"},
durant:    {n:"아이언트",id:632,t:["bug","steel"],s:[58,109,112,48,48,109],ml:{1:["bite","furycutter"],16:["bugbite"],26:["ironhead"]},e:null,ab:"swarm",cr:90,xp:169,em:"🐜"},
deino:    {n:"모노두",id:633,t:["dark","dragon"],s:[52,65,50,45,50,38],ml:{1:["tackle","bite"],17:["dragonbreath"],25:["crunch"]},e:{l:50,to:"zweilous"},ab:"keeneye",cr:45,xp:60,em:"🐉"},
zweilous:    {n:"디헤드",id:634,t:["dark","dragon"],s:[72,85,70,65,70,58],ml:{1:["bite","dragonbreath"],50:["crunch"],55:["dragonpulse"]},e:{l:64,to:"hydreigon"},ab:"keeneye",cr:45,xp:147,em:"🐉"},
hydreigon:    {n:"삼삼드래",id:635,t:["dark","dragon"],s:[92,105,90,125,90,98],ml:{1:["bite","crunch"],64:["dragonpulse"],68:["darkpulse"]},e:null,ab:"levitate",cr:45,xp:270,em:"🐉"},
larvesta:    {n:"활화르바",id:636,t:["bug","fire"],s:[55,85,55,10,55,60],ml:{1:["ember","absorb"],20:["bugbite"],30:["flamethrower"]},e:{l:59,to:"volcarona"},ab:"flamebody",cr:45,xp:72,em:"🐛"},
volcarona:    {n:"불카모스",id:637,t:["bug","fire"],s:[85,60,65,135,105,100],ml:{1:["ember","bugbite"],59:["flamethrower"],65:["fireblast"]},e:null,ab:"flamebody",cr:15,xp:248,em:"🦋"},
cobalion:    {n:"코바르온",id:638,t:["steel","fighting"],s:[91,90,129,90,72,108],ml:{1:["quickattack","ironhead"],25:["closecombat"],37:["flashcannon"]},e:null,ab:"justified",cr:3,xp:261,em:"⚔️"},
terrakion:    {n:"테라키온",id:639,t:["rock","fighting"],s:[91,129,90,72,90,108],ml:{1:["quickattack","rockslide"],25:["closecombat"],37:["stoneedge"]},e:null,ab:"justified",cr:3,xp:261,em:"🪨"},
virizion:    {n:"비리디온",id:640,t:["grass","fighting"],s:[91,90,72,90,129,108],ml:{1:["quickattack","razorleaf"],25:["closecombat"],37:["energyball"]},e:null,ab:"justified",cr:3,xp:261,em:"🌿"},
tornadus:    {n:"토네로스",id:641,t:["flying"],s:[79,115,70,125,80,111],ml:{1:["airslash","bite"],25:["bravebird"],40:["darkpulse"]},e:null,ab:"pressure",cr:3,xp:261,em:"🌪️"},
thundurus:    {n:"볼트로스",id:642,t:["electric","flying"],s:[79,115,70,125,80,111],ml:{1:["thundershock","airslash"],25:["thunderbolt"],40:["thunder"]},e:null,ab:"pressure",cr:3,xp:261,em:"⛈️"},
reshiram:    {n:"레시라무",id:643,t:["dragon","fire"],s:[100,120,100,150,120,90],ml:{1:["dragonbreath","ember"],35:["flamethrower"],50:["dragonpulse"]},e:null,ab:"pressure",cr:3,xp:306,em:"🔥"},
zekrom:    {n:"제크로무",id:644,t:["dragon","electric"],s:[100,150,120,120,100,90],ml:{1:["dragonbreath","thundershock"],35:["thunderbolt"],50:["dragonpulse"]},e:null,ab:"pressure",cr:3,xp:306,em:"⚡"},
landorus:    {n:"랜드로스",id:645,t:["ground","flying"],s:[89,125,90,115,80,101],ml:{1:["mudslap","rockthrow"],25:["earthpower"],40:["earthquake"]},e:null,ab:"intimidate",cr:3,xp:270,em:"🌍"},
kyurem:    {n:"큐레무",id:646,t:["dragon","ice"],s:[125,130,90,130,90,95],ml:{1:["dragonbreath","icebeam"],35:["dragonpulse"],50:["blizzard"]},e:null,ab:"pressure",cr:3,xp:297,em:"🧊"},
keldeo:    {n:"케르디오",id:647,t:["water","fighting"],s:[91,72,90,129,90,108],ml:{1:["watergun","quickattack"],25:["surf"],37:["closecombat"]},e:null,ab:"justified",cr:3,xp:261,em:"🦄"},
meloetta:    {n:"메로엣타",id:648,t:["normal","psychic"],s:[100,77,77,128,128,90],ml:{1:["quickattack","confusion"],21:["psychic"],36:["hyperbeam"]},e:null,ab:"serenegrace",cr:3,xp:270,em:"🎵"},
genesect:    {n:"게노세크트",id:649,t:["bug","steel"],s:[71,120,95,120,95,99],ml:{1:["furycutter","flashcannon"],22:["xscissor"],40:["signalbeam"]},e:null,ab:"pressure",cr:3,xp:270,em:"🤖"},
chespin:    {n:"도치마론",id:650,t:["grass"],s:[56,61,65,48,45,38],ml:{1:["tackle","vinewhip"],11:["razorleaf"],18:["leechseed"]},e:{l:16,to:"quilladin"},ab:"overgrow",cr:45,xp:63,em:"🌰"},
quilladin:    {n:"도치보구",id:651,t:["grass"],s:[61,78,95,56,58,57],ml:{1:["tackle","vinewhip"],16:["razorleaf"],26:["energyball"]},e:{l:36,to:"chesnaught"},ab:"overgrow",cr:45,xp:142,em:"🌰"},
chesnaught:    {n:"브리가론",id:652,t:["grass","fighting"],s:[88,107,122,74,75,64],ml:{1:["vinewhip","brickbreak"],36:["energyball"],48:["closecombat"]},e:null,ab:"overgrow",cr:45,xp:239,em:"🛡️"},
fennekin:    {n:"푸호꼬",id:653,t:["fire"],s:[40,45,40,62,60,60],ml:{1:["scratch","ember"],11:["flamethrower"],20:["psybeam"]},e:{l:16,to:"braixen"},ab:"blaze",cr:45,xp:61,em:"🦊"},
braixen:    {n:"테르나",id:654,t:["fire"],s:[59,59,58,90,70,73],ml:{1:["scratch","ember"],16:["flamethrower"],25:["psybeam"]},e:{l:36,to:"delphox"},ab:"blaze",cr:45,xp:143,em:"🦊"},
delphox:    {n:"마폭시",id:655,t:["fire","psychic"],s:[75,69,72,114,100,104],ml:{1:["ember","flamethrower"],36:["psychic"],47:["fireblast"]},e:null,ab:"blaze",cr:45,xp:240,em:"🦊"},
froakie:    {n:"개구마르",id:656,t:["water"],s:[41,56,40,62,44,71],ml:{1:["pound","watergun"],10:["bubblebeam"],18:["quickattack"]},e:{l:16,to:"frogadier"},ab:"torrent",cr:45,xp:63,em:"🐸"},
frogadier:    {n:"개굴반장",id:657,t:["water"],s:[54,63,52,83,56,97],ml:{1:["pound","watergun"],16:["bubblebeam"],25:["waterpulse"]},e:{l:36,to:"greninja"},ab:"torrent",cr:45,xp:142,em:"🐸"},
greninja:    {n:"개굴닌자",id:658,t:["water","dark"],s:[72,95,67,103,71,122],ml:{1:["watergun","darkpulse"],36:["surf"],49:["hydropump"]},e:null,ab:["torrent","protean"],cr:45,xp:239,em:"🥷"},
bunnelby:    {n:"파르빗",id:659,t:["normal"],s:[38,36,38,32,36,57],ml:{1:["tackle","leer"],7:["mudslap"],15:["quickattack"]},e:{l:20,to:"diggersby"},ab:"pickup",cr:255,xp:47,em:"🐰"},
diggersby:    {n:"파르토",id:660,t:["normal","ground"],s:[85,56,77,50,77,78],ml:{1:["tackle","mudslap"],20:["dig"],30:["earthquake"]},e:null,ab:"hugpower",cr:127,xp:148,em:"🐰"},
fletchling:    {n:"화살꼬빈",id:661,t:["normal","flying"],s:[45,50,43,40,38,62],ml:{1:["tackle","growl"],10:["quickattack"],17:["aerialace"]},e:{l:17,to:"fletchinder"},ab:"keeneye",cr:255,xp:56,em:"🐦"},
fletchinder:    {n:"불화살빈",id:662,t:["fire","flying"],s:[62,73,55,56,52,84],ml:{1:["quickattack","ember"],17:["aerialace"],25:["flamethrower"]},e:{l:35,to:"talonflame"},ab:"flamebody",cr:120,xp:134,em:"🐦"},
talonflame:    {n:"파이어로",id:663,t:["fire","flying"],s:[78,81,71,74,69,126],ml:{1:["ember","aerialace"],35:["flamethrower"],44:["bravebird"]},e:null,ab:"galewings",cr:45,xp:175,em:"🐦"},
scatterbug:    {n:"분이벌레",id:664,t:["bug"],s:[38,35,40,27,25,35],ml:{1:["tackle","bugbite"],6:["stunspore"],9:["poisonpowder"]},e:{l:9,to:"spewpa"},ab:"compoundeyes",cr:255,xp:40,em:"🐛"},
spewpa:    {n:"분떠도가",id:665,t:["bug"],s:[45,22,60,27,30,29],ml:{1:["tackle","protect"],9:["bugbite"],12:["stunspore"]},e:{l:12,to:"vivillon"},ab:"shedskin",cr:120,xp:75,em:"🐛"},
vivillon:    {n:"비비용",id:666,t:["bug","flying"],s:[80,52,50,90,50,89],ml:{1:["bugbite","airslash"],12:["signalbeam"],31:["sleeppowder"]},e:null,ab:"compoundeyes",cr:45,xp:185,em:"🦋"},
litleo:    {n:"레오꼬",id:667,t:["fire","normal"],s:[62,50,58,73,54,72],ml:{1:["tackle","ember"],15:["flamethrower"],23:["bodyslam"]},e:{l:35,to:"pyroar"},ab:"rivalry",cr:220,xp:74,em:"🦁"},
pyroar:    {n:"화염레오",id:668,t:["fire","normal"],s:[86,68,72,109,66,106],ml:{1:["ember","bodyslam"],35:["flamethrower"],42:["fireblast"]},e:null,ab:"rivalry",cr:65,xp:177,em:"🦁"},
flabebe:    {n:"플라베베",id:669,t:["fairy"],s:[44,38,39,61,79,42],ml:{1:["tackle","absorb"],15:["dazzlinggleam"],22:["wish"]},e:{l:19,to:"floette"},ab:"keeneye",cr:225,xp:61,em:"🌸"},
floette:    {n:"플라엣트",id:670,t:["fairy"],s:[54,45,47,75,98,52],ml:{1:["tackle","dazzlinggleam"],19:["wish"],27:["moonblast"]},e:null,ab:"keeneye",cr:120,xp:130,em:"🌸"},
florges:    {n:"플라제스",id:671,t:["fairy"],s:[78,65,68,112,154,75],ml:{1:["dazzlinggleam","moonblast"],35:["calmmind"],46:["wish"]},e:null,ab:"keeneye",cr:45,xp:248,em:"🌺"},
skiddo:    {n:"메이클",id:672,t:["grass"],s:[66,65,48,62,57,52],ml:{1:["tackle","vinewhip"],12:["razorleaf"],20:["leechseed"]},e:{l:32,to:"gogoat"},ab:"sapsipper",cr:200,xp:70,em:"🐐"},
gogoat:    {n:"고고트",id:673,t:["grass"],s:[123,100,62,97,81,68],ml:{1:["vinewhip","razorleaf"],32:["energyball"],40:["solarbeam"]},e:null,ab:"sapsipper",cr:45,xp:186,em:"🐐"},
pancham:    {n:"판짱",id:674,t:["fighting"],s:[67,82,62,46,48,43],ml:{1:["tackle","leer"],12:["lowkick"],20:["brickbreak"]},e:{l:32,to:"pangoro"},ab:"moldbreaker",cr:220,xp:70,em:"🐼"},
pangoro:    {n:"부란다",id:675,t:["fighting","dark"],s:[95,124,78,69,71,58],ml:{1:["lowkick","brickbreak"],32:["crunch"],42:["closecombat"]},e:null,ab:"moldbreaker",cr:65,xp:173,em:"🐼"},
furfrou:    {n:"트리미앙",id:676,t:["normal"],s:[75,80,60,65,90,102],ml:{1:["tackle","growl"],15:["bite"],27:["bodyslam"]},e:null,ab:"furcoat",cr:160,xp:165,em:"🐩"},
espurr:    {n:"냐스퍼",id:677,t:["psychic"],s:[62,48,54,63,60,68],ml:{1:["scratch","confusion"],13:["psybeam"],19:["calmmind"]},e:{l:25,to:"meowstic"},ab:"keeneye",cr:190,xp:71,em:"🐱"},
meowstic:    {n:"냐오닉스",id:678,t:["psychic"],s:[74,48,76,83,81,104],ml:{1:["confusion","psybeam"],25:["psychic"],35:["calmmind"]},e:null,ab:"keeneye",cr:75,xp:163,em:"🐱"},
honedge:    {n:"단칼빙",id:679,t:["steel","ghost"],s:[45,80,100,35,37,28],ml:{1:["tackle","shadowclaw"],13:["irondefense"],18:["slash"]},e:{l:35,to:"doublade"},ab:"clearbody",cr:180,xp:65,em:"⚔️"},
doublade:    {n:"쌍검킬",id:680,t:["steel","ghost"],s:[59,110,150,45,49,35],ml:{1:["shadowclaw","slash"],35:["ironhead"],40:["swordsdance"]},e:null,ab:"clearbody",cr:90,xp:157,em:"⚔️"},
aegislash:    {n:"길가르드",id:681,t:["steel","ghost"],s:[60,50,150,150,150,60],ml:{1:["shadowclaw","ironhead"],35:["flashcannon"],42:["shadowball"]},e:null,ab:"clearbody",cr:45,xp:234,em:"🛡️"},
spritzee:    {n:"슈쁘",id:682,t:["fairy"],s:[78,52,60,63,65,23],ml:{1:["tackle","dazzlinggleam"],17:["moonblast"],25:["calmmind"]},e:null,ab:"keeneye",cr:200,xp:68,em:"🌸"},
aromatisse:    {n:"프레프티르",id:683,t:["fairy"],s:[101,72,72,99,89,29],ml:{1:["dazzlinggleam","moonblast"],35:["calmmind"],42:["psychic"]},e:null,ab:"keeneye",cr:140,xp:162,em:"🌸"},
swirlix:    {n:"페로꼬",id:684,t:["fairy"],s:[62,48,66,59,57,49],ml:{1:["tackle","playrough"],17:["dazzlinggleam"],26:["wish"]},e:null,ab:"keeneye",cr:200,xp:68,em:"🍬"},
slurpuff:    {n:"페로미",id:685,t:["fairy"],s:[82,80,86,85,75,72],ml:{1:["playrough","dazzlinggleam"],35:["moonblast"],45:["calmmind"]},e:null,ab:"keeneye",cr:140,xp:168,em:"🍬"},
inkay:    {n:"오케이징",id:686,t:["dark","psychic"],s:[53,54,53,37,46,45],ml:{1:["tackle","psybeam"],8:["darkpulse"],15:["hypnosis"]},e:{l:30,to:"malamar"},ab:"contrary",cr:190,xp:58,em:"🦑"},
malamar:    {n:"칼라마네로",id:687,t:["dark","psychic"],s:[86,92,88,68,75,73],ml:{1:["psybeam","darkpulse"],30:["psychic"],40:["slash"]},e:null,ab:"contrary",cr:75,xp:169,em:"🦑"},
binacle:    {n:"거북손손",id:688,t:["rock","water"],s:[42,52,67,39,56,50],ml:{1:["scratch","watergun"],10:["rockthrow"],20:["slash"]},e:{l:39,to:"barbaracle"},ab:"sniper",cr:120,xp:61,em:"🪨"},
barbaracle:    {n:"거북손데스",id:689,t:["rock","water"],s:[72,105,115,54,86,68],ml:{1:["slash","watergun"],39:["stoneedge"],48:["rockslide"]},e:null,ab:"sniper",cr:45,xp:175,em:"🪨"},
skrelp:    {n:"수레기",id:690,t:["poison","water"],s:[50,60,60,54,60,30],ml:{1:["tackle","watergun"],12:["poisonsting"],23:["sludgebomb"]},e:{l:48,to:"dragalge"},ab:"poisonpoint",cr:225,xp:64,em:"🐉"},
dragalge:    {n:"드래캄",id:691,t:["poison","dragon"],s:[65,75,90,97,123,44],ml:{1:["watergun","poisonsting"],48:["dragonpulse"],53:["sludgebomb"]},e:null,ab:"poisonpoint",cr:55,xp:173,em:"🐉"},
clauncher:    {n:"철포어",id:692,t:["water"],s:[50,53,62,58,63,44],ml:{1:["watergun","bubblebeam"],20:["waterpulse"],30:["aquatail"]},e:{l:37,to:"clawitzer"},ab:"megalauncher",cr:225,xp:66,em:"🦞"},
clawitzer:    {n:"블로스터",id:693,t:["water"],s:[71,73,88,120,89,59],ml:{1:["watergun","waterpulse"],37:["surf"],48:["hydropump"]},e:null,ab:"megalauncher",cr:55,xp:100,em:"🦞"},
helioptile:    {n:"에리키텔",id:694,t:["electric","normal"],s:[44,38,33,61,43,70],ml:{1:["pound","thundershock"],11:["thunderwave"],22:["thunderbolt"]},e:null,ab:"dryskin",cr:190,xp:58,em:"🦎"},
heliolisk:    {n:"일레도리자드",id:695,t:["electric","normal"],s:[62,55,52,109,94,109],ml:{1:["thundershock","thunderbolt"],25:["thunderwave"],40:["thunder"]},e:null,ab:"dryskin",cr:75,xp:168,em:"🦎"},
tyrunt:    {n:"티고라스",id:696,t:["rock","dragon"],s:[58,89,77,45,45,48],ml:{1:["tackle","bite"],12:["rockthrow"],20:["dragonclaw"]},e:{l:39,to:"tyrantrum"},ab:"strongjaw",cr:45,xp:72,em:"🦖"},
tyrantrum:    {n:"견고라스",id:697,t:["rock","dragon"],s:[82,121,119,69,59,71],ml:{1:["bite","dragonclaw"],39:["rockslide"],47:["stoneedge"]},e:null,ab:"strongjaw",cr:45,xp:182,em:"🦖"},
amaura:    {n:"아마루스",id:698,t:["rock","ice"],s:[77,59,50,67,63,46],ml:{1:["tackle","aurorabeam"],13:["rockthrow"],20:["icebeam"]},e:{l:39,to:"aurorus"},ab:"refrigerate",cr:45,xp:72,em:"🦕"},
aurorus:    {n:"아마루르가",id:699,t:["rock","ice"],s:[123,77,72,99,92,58],ml:{1:["aurorabeam","rockthrow"],39:["icebeam"],50:["blizzard"]},e:null,ab:"refrigerate",cr:45,xp:104,em:"🦕"},
sylveon:    {n:"님피아",id:700,t:["fairy"],s:[95,65,65,110,130,60],ml:{1:["tackle","dazzlinggleam"],10:["quickattack"],15:["charm"],20:["moonblast"],25:["wish"],29:["calmmind"],33:["psychic"],38:["shadowball"]},e:null,ab:"cutecharm",cr:45,xp:184,em:"🎀"},
hawlucha:    {n:"루차불",id:701,t:["fighting","flying"],s:[78,92,75,74,63,118],ml:{1:["tackle","aerialace"],16:["brickbreak"],28:["closecombat"]},e:null,ab:"limber",cr:100,xp:175,em:"🦅"},
dedenne:    {n:"데덴네",id:702,t:["electric","fairy"],s:[67,58,57,81,67,101],ml:{1:["tackle","thundershock"],11:["thunderwave"],23:["thunderbolt"]},e:null,ab:"pickup",cr:180,xp:151,em:"🐹"},
carbink:    {n:"멜시",id:703,t:["rock","fairy"],s:[50,50,150,50,150,50],ml:{1:["tackle","rockthrow"],18:["stealthrock"],35:["moonblast"]},e:null,ab:"clearbody",cr:60,xp:100,em:"��"},
goomy:    {n:"미끄메라",id:704,t:["dragon"],s:[45,50,35,55,75,40],ml:{1:["tackle","absorb"],13:["dragonbreath"],18:["dragonpulse"]},e:{l:40,to:"sliggoo"},ab:"sapsipper",cr:45,xp:60,em:"🐉"},
sliggoo:    {n:"미끄네일",id:705,t:["dragon"],s:[68,75,53,83,113,60],ml:{1:["tackle","dragonbreath"],40:["dragonpulse"],47:["mudslap"]},e:{l:50,to:"goodra"},ab:"sapsipper",cr:45,xp:158,em:"🐉"},
goodra:    {n:"미끄래곤",id:706,t:["dragon"],s:[90,100,70,110,150,80],ml:{1:["dragonbreath","dragonpulse"],50:["outrage"],55:["energyball"]},e:null,ab:"sapsipper",cr:45,xp:270,em:"🐉"},
klefki:    {n:"클레피",id:707,t:["steel","fairy"],s:[57,80,91,80,87,75],ml:{1:["tackle","flashcannon"],15:["dazzlinggleam"],23:["irondefense"]},e:null,ab:"prankster",cr:75,xp:165,em:"🔑"},
phantump:    {n:"나목령",id:708,t:["ghost","grass"],s:[43,70,48,50,60,38],ml:{1:["tackle","hex"],13:["leechseed"],19:["shadowclaw"]},e:null,ab:"naturalcure",cr:120,xp:62,em:"🌳"},
trevenant:    {n:"오로트",id:709,t:["ghost","grass"],s:[85,110,76,65,82,56],ml:{1:["hex","shadowclaw"],28:["energyball"],36:["shadowball"]},e:null,ab:"naturalcure",cr:60,xp:166,em:"🌳"},
pumpkaboo:    {n:"호바귀",id:710,t:["ghost","grass"],s:[49,66,70,44,55,51],ml:{1:["tackle","hex"],16:["shadowball"],20:["leechseed"]},e:null,ab:"insomnia",cr:120,xp:67,em:"🎃"},
gourgeist:    {n:"펌킨인",id:711,t:["ghost","grass"],s:[65,90,122,58,75,84],ml:{1:["hex","shadowball"],30:["energyball"],36:["shadowclaw"]},e:null,ab:"insomnia",cr:60,xp:173,em:"🎃"},
bergmite:    {n:"꽁어름",id:712,t:["ice"],s:[55,69,85,32,35,28],ml:{1:["tackle","bite"],15:["icepunch"],22:["icebeam"]},e:{l:37,to:"avalugg"},ab:"owntempo",cr:190,xp:61,em:"🧊"},
avalugg:    {n:"크레베이스",id:713,t:["ice"],s:[95,117,184,44,46,28],ml:{1:["tackle","icepunch"],37:["icebeam"],46:["blizzard"]},e:null,ab:"sturdy",cr:46,xp:180,em:"🧊"},
noibat:    {n:"음뱃",id:714,t:["flying","dragon"],s:[40,30,35,45,40,55],ml:{1:["tackle","airslash"],16:["dragonbreath"],23:["bite"]},e:{l:48,to:"noivern"},ab:"innerfocus",cr:190,xp:49,em:"🦇"},
noivern:    {n:"음번",id:715,t:["flying","dragon"],s:[85,70,80,97,80,123],ml:{1:["airslash","dragonbreath"],48:["dragonpulse"],53:["bravebird"]},e:null,ab:"innerfocus",cr:45,xp:187,em:"🦇"},
xerneas:    {n:"제르네아스",id:716,t:["fairy"],s:[126,131,95,131,98,99],ml:{1:["tackle","dazzlinggleam"],26:["moonblast"],51:["calmmind"]},e:null,ab:"fairyaura",cr:3,xp:306,em:"🦌"},
yveltal:    {n:"이벨타르",id:717,t:["dark","flying"],s:[126,131,95,131,98,99],ml:{1:["airslash","darkpulse"],26:["bravebird"],51:["hyperbeam"]},e:null,ab:"darkaura",cr:3,xp:306,em:"🦅"},
zygarde:    {n:"지가르데",id:718,t:["dragon","ground"],s:[108,100,121,81,95,95],ml:{1:["bite","dragonbreath"],26:["earthquake"],51:["outrage"]},e:null,ab:"pressure",cr:3,xp:270,em:"🐍"},
diancie:    {n:"디안시",id:719,t:["rock","fairy"],s:[50,100,150,100,150,50],ml:{1:["tackle","rockthrow"],18:["moonblast"],35:["dazzlinggleam"]},e:null,ab:"clearbody",cr:3,xp:270,em:"💎"},
hoopa:    {n:"후파",id:720,t:["psychic","ghost"],s:[80,110,60,150,130,70],ml:{1:["confusion","shadowball"],25:["psychic"],46:["darkpulse"]},e:null,ab:"pressure",cr:3,xp:270,em:"🔮"},
volcanion:    {n:"볼케니온",id:721,t:["fire","water"],s:[80,110,120,130,90,70],ml:{1:["ember","watergun"],26:["flamethrower"],46:["hydropump"]},e:null,ab:"waterabsorb",cr:3,xp:270,em:"🌋"}
};

// ═══════════════════════════════════════════════
// ⚔️ 기술 데이터베이스
// ═══════════════════════════════════════════════
var MOVES = {
tackle:      {n:"몸통박치기",t:"normal",c:"physical",p:40,a:100,pp:35},
scratch:     {n:"할퀴기",t:"normal",c:"physical",p:40,a:100,pp:35},
pound:       {n:"막치기",t:"normal",c:"physical",p:40,a:100,pp:35},
quickattack: {n:"전광석화",t:"normal",c:"physical",p:40,a:100,pp:30,priority:1},
slam:        {n:"내던지기",t:"normal",c:"physical",p:80,a:75,pp:20},
bodyslam:    {n:"누르기",t:"normal",c:"physical",p:85,a:100,pp:15,ef:"paralyze",ec:30},
hyperbeam:   {n:"파괴광선",t:"normal",c:"special",p:150,a:90,pp:5},
explosion:   {n:"대폭발",t:"normal",c:"physical",p:250,a:100,pp:5,ef:"selfdestruct"},
stomp:       {n:"짓밟기",t:"normal",c:"physical",p:65,a:100,pp:20,ef:"flinch",ec:30},
slash:       {n:"베어가르기",t:"normal",c:"physical",p:70,a:100,pp:20,ef:"highcrit"},
bind:        {n:"조이기",t:"normal",c:"physical",p:15,a:85,pp:20},
triattack:   {n:"트라이어택",t:"normal",c:"special",p:80,a:100,pp:10},
splash:      {n:"튀어오르기",t:"normal",c:"status",p:0,a:100,pp:40},
rest:        {n:"잠자기",t:"psychic",c:"status",p:0,a:100,pp:10,ef:"rest"},
headbutt:    {n:"박치기",t:"normal",c:"physical",p:70,a:100,pp:15,ef:"flinch",ec:30},
furyattack:  {n:"마구찌르기",t:"normal",c:"physical",p:15,a:85,pp:20},
furyswipes:  {n:"마구할퀴기",t:"normal",c:"physical",p:18,a:80,pp:15},
wrap:        {n:"감기",t:"normal",c:"physical",p:15,a:90,pp:20},
peck:        {n:"쪼기",t:"flying",c:"physical",p:35,a:100,pp:35},
megakick:    {n:"메가톤킥",t:"normal",c:"physical",p:120,a:75,pp:5},
sing:        {n:"노래하기",t:"normal",c:"status",p:0,a:55,pp:15,ef:"sleep",ec:100},
softboiled:  {n:"알낳기",t:"normal",c:"status",p:0,a:100,pp:10,ef:"heal"},
pursuit:     {n:"따라가때리기",t:"dark",c:"physical",p:40,a:100,pp:20},
rollout:     {n:"구르기",t:"rock",c:"physical",p:30,a:90,pp:20},
ember:       {n:"불꽃세례",t:"fire",c:"special",p:40,a:100,pp:25,ef:"burn",ec:10},
flamewheel:  {n:"화염바퀴",t:"fire",c:"physical",p:60,a:100,pp:25,ef:"burn",ec:10},
flamethrower:{n:"화염방사",t:"fire",c:"special",p:90,a:100,pp:15,ef:"burn",ec:10},
fireblast:   {n:"대문자",t:"fire",c:"special",p:110,a:85,pp:5,ef:"burn",ec:30},
flareblitz:  {n:"플레어드라이브",t:"fire",c:"physical",p:120,a:100,pp:15,ef:"recoil"},
eruption:    {n:"분화",t:"fire",c:"special",p:150,a:100,pp:5},
firepunch:   {n:"불꽃펀치",t:"fire",c:"physical",p:75,a:100,pp:15,ef:"burn",ec:10},
watergun:    {n:"물대포",t:"water",c:"special",p:40,a:100,pp:25},
bubble:      {n:"거품",t:"water",c:"special",p:40,a:100,pp:30},
waterpulse:  {n:"물의파동",t:"water",c:"special",p:60,a:100,pp:20,ef:"confuse",ec:20},
surf:        {n:"파도타기",t:"water",c:"special",p:90,a:100,pp:15},
hydropump:   {n:"하이드로펌프",t:"water",c:"special",p:110,a:80,pp:5},
waterfall:   {n:"폭포오르기",t:"water",c:"physical",p:80,a:100,pp:15,ef:"flinch",ec:20},
crabhammer:  {n:"크랩해머",t:"water",c:"physical",p:100,a:90,pp:10,ef:"highcrit"},
aurorabeam:  {n:"오로라빔",t:"ice",c:"special",p:65,a:100,pp:20},
thundershock:{n:"전기쇼크",t:"electric",c:"special",p:40,a:100,pp:30,ef:"paralyze",ec:10},
thunderbolt: {n:"10만볼트",t:"electric",c:"special",p:90,a:100,pp:15,ef:"paralyze",ec:10},
thunder:     {n:"번개",t:"electric",c:"special",p:110,a:70,pp:10,ef:"paralyze",ec:30},
thunderwave: {n:"전기자석파",t:"electric",c:"status",p:0,a:90,pp:20,ef:"paralyze",ec:100},
thunderpunch:{n:"번개펀치",t:"electric",c:"physical",p:75,a:100,pp:15,ef:"paralyze",ec:10},
sonicboom:   {n:"소닉붐",t:"normal",c:"special",p:20,a:90,pp:20},
absorb:      {n:"흡수",t:"grass",c:"special",p:20,a:100,pp:25,ef:"drain"},
vinewhip:    {n:"덩굴채찍",t:"grass",c:"physical",p:45,a:100,pp:25},
razorleaf:   {n:"잎날가르기",t:"grass",c:"physical",p:55,a:95,pp:25,ef:"highcrit"},
gigadrain:   {n:"기가드레인",t:"grass",c:"special",p:75,a:100,pp:10,ef:"drain"},
solarbeam:   {n:"솔라빔",t:"grass",c:"special",p:120,a:100,pp:10},
icebeam:     {n:"냉동빔",t:"ice",c:"special",p:90,a:100,pp:10,ef:"freeze",ec:10},
blizzard:    {n:"눈보라",t:"ice",c:"special",p:110,a:70,pp:5,ef:"freeze",ec:10},
icepunch:    {n:"냉동펀치",t:"ice",c:"physical",p:75,a:100,pp:15,ef:"freeze",ec:10},
iciclespear: {n:"고드름침",t:"ice",c:"physical",p:25,a:100,pp:30},
karatechop:  {n:"태권당수",t:"fighting",c:"physical",p:50,a:100,pp:25,ef:"highcrit"},
crosschop:   {n:"크로스촙",t:"fighting",c:"physical",p:100,a:80,pp:5,ef:"highcrit"},
brickbreak:  {n:"깨트리기",t:"fighting",c:"physical",p:75,a:100,pp:15},
dynamicpunch:{n:"폭발펀치",t:"fighting",c:"physical",p:100,a:50,pp:5,ef:"confuse",ec:100},
closecombat: {n:"인파이팅",t:"fighting",c:"physical",p:120,a:100,pp:5},
focusenergy: {n:"기합모으기",t:"normal",c:"status",p:0,a:100,pp:30,ef:"focusenergy"},
tripleKick:  {n:"트리플킥",t:"fighting",c:"physical",p:60,a:90,pp:10},
bulletpunch: {n:"총알펀치",t:"steel",c:"physical",p:40,a:100,pp:30,priority:1},
poisonsting: {n:"독침",t:"poison",c:"physical",p:15,a:100,pp:35,ef:"poison",ec:30},
acid:        {n:"용해액",t:"poison",c:"special",p:40,a:100,pp:30},
sludgebomb:  {n:"오물폭탄",t:"poison",c:"special",p:90,a:100,pp:10,ef:"poison",ec:30},
crosspoison: {n:"크로스포이즌",t:"poison",c:"physical",p:70,a:100,pp:20,ef:"poison",ec:10},
poisonpowder:{n:"독가루",t:"poison",c:"status",p:0,a:75,pp:35,ef:"poison",ec:100},
toxic:       {n:"맹독",t:"poison",c:"status",p:0,a:90,pp:10,ef:"poison",ec:100},
twineedle:   {n:"더블니들",t:"bug",c:"physical",p:50,a:100,pp:20,ef:"poison",ec:20},
mudshot:     {n:"머드숏",t:"ground",c:"special",p:55,a:95,pp:15},
dig:         {n:"구멍파기",t:"ground",c:"physical",p:80,a:100,pp:10},
earthquake:  {n:"지진",t:"ground",c:"physical",p:100,a:100,pp:10},
bonemerang:  {n:"뼈부메랑",t:"ground",c:"physical",p:50,a:90,pp:10},
sandattack:  {n:"모래뿌리기",t:"ground",c:"status",p:0,a:100,pp:15,ef:"acc_down"},
gust:        {n:"바람일으키기",t:"flying",c:"special",p:40,a:100,pp:35},
wingattack:  {n:"날개치기",t:"flying",c:"physical",p:60,a:100,pp:35},
aerialace:   {n:"제비반환",t:"flying",c:"physical",p:60,a:0,pp:20},
fly:         {n:"공중날기",t:"flying",c:"physical",p:90,a:95,pp:15},
drillpeck:   {n:"드릴부리",t:"flying",c:"physical",p:80,a:100,pp:20},
confusion:   {n:"염동력",t:"psychic",c:"special",p:50,a:100,pp:25,ef:"confuse",ec:10},
psybeam:     {n:"사이코빔",t:"psychic",c:"special",p:65,a:100,pp:20,ef:"confuse",ec:10},
psychic:     {n:"사이코키네시스",t:"psychic",c:"special",p:90,a:100,pp:10},
calmmind:    {n:"명상",t:"psychic",c:"status",p:0,a:100,pp:20,ef:"calmmind"},
hypnosis:    {n:"최면술",t:"psychic",c:"status",p:0,a:60,pp:20,ef:"sleep",ec:100},
dreameater:  {n:"꿈먹기",t:"psychic",c:"special",p:100,a:100,pp:15,ef:"drain"},
lightscreen: {n:"빛의장막",t:"psychic",c:"status",p:0,a:100,pp:30,ef:"spdef_up"},
stringshot:  {n:"실뿜기",t:"bug",c:"status",p:0,a:95,pp:40,ef:"spd_down"},
bugbite:     {n:"벌레먹기",t:"bug",c:"physical",p:60,a:100,pp:20},
signalbeam:  {n:"시그널빔",t:"bug",c:"special",p:75,a:100,pp:15,ef:"confuse",ec:10},
megahorn:    {n:"메가혼",t:"bug",c:"physical",p:120,a:85,pp:10},
xscissor:    {n:"시저크로스",t:"bug",c:"physical",p:80,a:100,pp:15},
rapidpin:    {n:"고속스핀",t:"normal",c:"physical",p:50,a:100,pp:40},
spore:       {n:"버섯포자",t:"grass",c:"status",p:0,a:100,pp:15,ef:"sleep",ec:100},
stunspore:   {n:"저리가루",t:"grass",c:"status",p:0,a:75,pp:30,ef:"paralyze",ec:100},
rockthrow:   {n:"돌던지기",t:"rock",c:"physical",p:50,a:90,pp:15},
rockslide:   {n:"락슬라이드",t:"rock",c:"physical",p:75,a:90,pp:10,ef:"flinch",ec:30},
stoneedge:   {n:"스톤에지",t:"rock",c:"physical",p:100,a:80,pp:5,ef:"highcrit"},
lick:        {n:"핥기",t:"ghost",c:"physical",p:30,a:100,pp:30,ef:"paralyze",ec:30},
nightshade:  {n:"나이트헤드",t:"ghost",c:"special",p:50,a:100,pp:15},
shadowball:  {n:"섀도볼",t:"ghost",c:"special",p:80,a:100,pp:15},
confuseray:  {n:"이상한빛",t:"ghost",c:"status",p:0,a:100,pp:10,ef:"confuse",ec:100},
dragonrage:  {n:"용의분노",t:"dragon",c:"special",p:40,a:100,pp:10},
dragonclaw:  {n:"드래곤클로",t:"dragon",c:"physical",p:80,a:100,pp:15},
dragonpulse: {n:"용의파동",t:"dragon",c:"special",p:85,a:100,pp:10},
outrage:     {n:"역린",t:"dragon",c:"physical",p:120,a:100,pp:10},
bite:        {n:"물기",t:"dark",c:"physical",p:60,a:100,pp:25,ef:"flinch",ec:30},
crunch:      {n:"깨물어부수기",t:"dark",c:"physical",p:80,a:100,pp:15},
darkpulse:   {n:"악의파동",t:"dark",c:"special",p:80,a:100,pp:15,ef:"flinch",ec:20},
metalclaw:   {n:"메탈클로",t:"steel",c:"physical",p:50,a:95,pp:35},
irontail:    {n:"아이언테일",t:"steel",c:"physical",p:100,a:75,pp:15},
steelwing:   {n:"강철날개",t:"steel",c:"physical",p:70,a:90,pp:25},
flashcannon: {n:"러스터캐논",t:"steel",c:"special",p:80,a:100,pp:10},
moonblast:   {n:"문블라스트",t:"fairy",c:"special",p:95,a:100,pp:15},
dazzlinggleam:{n:"매지컬샤인",t:"fairy",c:"special",p:80,a:100,pp:10},
charm:       {n:"애교부리기",t:"fairy",c:"status",p:0,a:100,pp:20,ef:"atk_down2"},
sweetkiss:   {n:"천사의키스",t:"fairy",c:"status",p:0,a:75,pp:10,ef:"confuse",ec:100},
growl:       {n:"울음소리",t:"normal",c:"status",p:0,a:100,pp:40,ef:"atk_down"},
tailwhip:    {n:"꼬리흔들기",t:"normal",c:"status",p:0,a:100,pp:30,ef:"def_down"},
smokescreen: {n:"연막",t:"normal",c:"status",p:0,a:100,pp:20,ef:"acc_down"},
sleeppowder: {n:"수면가루",t:"grass",c:"status",p:0,a:75,pp:15,ef:"sleep",ec:100},
supersonic:  {n:"초음파",t:"normal",c:"status",p:0,a:55,pp:20,ef:"confuse",ec:100},
swordsdance: {n:"칼춤",t:"normal",c:"status",p:0,a:100,pp:20,ef:"swordsdance"},
harden:      {n:"단단해지기",t:"normal",c:"status",p:0,a:100,pp:30,ef:"def_up"},
defensecurl: {n:"웅크리기",t:"normal",c:"status",p:0,a:100,pp:40,ef:"def_up"},
moonlight:   {n:"달의빛",t:"fairy",c:"status",p:0,a:100,pp:5,ef:"heal"},
hornattack:  {n:"뿔찌르기",t:"normal",c:"physical",p:65,a:100,pp:25},
sketch:      {n:"스케치",t:"normal",c:"status",p:0,a:100,pp:1},
counter:     {n:"카운터",t:"fighting",c:"physical",p:0,a:100,pp:20,ef:"counter"},
mirrorcoat:  {n:"미러코트",t:"psychic",c:"special",p:0,a:100,pp:20,ef:"mirrorcoat"},
encore:      {n:"앙코르",t:"normal",c:"status",p:0,a:100,pp:5,ef:"encore"},
mudslap:     {n:"흙뿌리기",t:"ground",c:"special",p:20,a:100,pp:10,ef:"acc_down",ec:100},
megadrain:   {n:"메가드레인",t:"grass",c:"special",p:40,a:100,pp:15},
ironhead:    {n:"아이언헤드",t:"steel",c:"physical",p:80,a:100,pp:15},
dragonbreath:{n:"용의숨결",t:"dragon",c:"special",p:60,a:100,pp:20},
bubblebeam:  {n:"거품광선",t:"water",c:"special",p:65,a:100,pp:20},
spark:       {n:"스파크",t:"electric",c:"physical",p:65,a:100,pp:20},
doubleedge:  {n:"이판사판박치기",t:"normal",c:"physical",p:120,a:100,pp:15},
hex:         {n:"주술",t:"ghost",c:"special",p:65,a:100,pp:10},
aquatail:    {n:"아쿠아테일",t:"water",c:"physical",p:90,a:90,pp:10},
sludge:      {n:"오물공격",t:"poison",c:"special",p:65,a:100,pp:20},
lowkick:     {n:"발밑차기",t:"fighting",c:"physical",p:60,a:100,pp:20},
silverwind:  {n:"은빛바람",t:"bug",c:"special",p:60,a:100,pp:5},
furycutter:  {n:"연속자르기",t:"bug",c:"physical",p:40,a:95,pp:20},
leer:        {n:"째려보기",t:"normal",c:"status",p:0,a:100,pp:30},
willowisp:   {n:"도깨비불",t:"fire",c:"status",p:0,a:85,pp:15,ef:"burn"},
lockon:      {n:"록온",t:"normal",c:"status",p:0,a:100,pp:5},
megapunch:   {n:"메가톤펀치",t:"normal",c:"physical",p:80,a:85,pp:20},
// ═══ Gen 5-6 추가 기술 ═══
energyball:  {n:"에너지볼",t:"grass",c:"special",p:90,a:100,pp:10,ef:"spdef_down",ec:10},
airslash:    {n:"에어슬래시",t:"flying",c:"special",p:75,a:95,pp:15,ef:"flinch",ec:30},
bravebird:   {n:"브레이브버드",t:"flying",c:"physical",p:120,a:100,pp:15,ef:"recoil"},
wildcharge:  {n:"와일드볼트",t:"electric",c:"physical",p:90,a:100,pp:15,ef:"recoil"},
stealthrock: {n:"스텔스록",t:"rock",c:"status",p:0,a:100,pp:20},
wish:        {n:"힐링위시",t:"normal",c:"status",p:0,a:100,pp:10,ef:"heal"},
drainpunch:  {n:"드레인펀치",t:"fighting",c:"physical",p:75,a:100,pp:10,ef:"drain"},
earthpower:  {n:"대지의힘",t:"ground",c:"special",p:90,a:100,pp:10,ef:"spdef_down",ec:10},
protect:     {n:"방어",t:"normal",c:"status",p:0,a:100,pp:10},
poisonfang:  {n:"독엄니",t:"poison",c:"physical",p:50,a:100,pp:15,ef:"poison",ec:50},
petalblizzard:{n:"꽃보라",t:"grass",c:"physical",p:90,a:100,pp:15},
recover:     {n:"회복",t:"normal",c:"status",p:0,a:100,pp:10,ef:"heal"},
irondefense: {n:"철벽",t:"steel",c:"status",p:0,a:100,pp:15,ef:"def_up"},
leechseed:   {n:"씨뿌리기",t:"grass",c:"status",p:0,a:90,pp:10,ef:"drain"},
aurasphere:  {n:"파동탄",t:"fighting",c:"special",p:80,a:0,pp:20},
shadowclaw:  {n:"섀도클로",t:"ghost",c:"physical",p:70,a:100,pp:15,ef:"highcrit"},
playrough:   {n:"자랑부리기",t:"fairy",c:"physical",p:90,a:90,pp:10,ef:"atk_down",ec:10},
scald:       {n:"열탕",t:"water",c:"special",p:80,a:100,pp:15,ef:"burn",ec:30},
grassknot:   {n:"풀묶기",t:"grass",c:"special",p:80,a:100,pp:20},
uturn:       {n:"유턴",t:"bug",c:"physical",p:70,a:100,pp:20},
facade:      {n:"근성",t:"normal",c:"physical",p:70,a:100,pp:20},
focuspunch:  {n:"기합펀치",t:"fighting",c:"physical",p:150,a:100,pp:20},
hiddenpower: {n:"잠재파워",t:"normal",c:"special",p:60,a:100,pp:15},
thief:       {n:"도둑질",t:"dark",c:"physical",p:60,a:100,pp:25},
rockblast:   {n:"록블래스트",t:"rock",c:"physical",p:25,a:90,pp:10},
poisonjab:   {n:"독찌르기",t:"poison",c:"physical",p:80,a:100,pp:20,ef:"poison",ec:30},
acrobatics:  {n:"곡예",t:"flying",c:"physical",p:55,a:100,pp:15},
retaliate:   {n:"보복",t:"normal",c:"physical",p:70,a:100,pp:5},
voltswitch:  {n:"볼트체인지",t:"electric",c:"special",p:70,a:100,pp:20},
strugglebug: {n:"버그저항",t:"bug",c:"special",p:50,a:100,pp:20},
bulldoze:    {n:"지진밟기",t:"ground",c:"physical",p:60,a:100,pp:20},
frostbreath: {n:"프로스트브레스",t:"ice",c:"special",p:60,a:90,pp:10,ef:"highcrit"},
dragontail:  {n:"드래곤테일",t:"dragon",c:"physical",p:60,a:90,pp:10},
workup:      {n:"자기암시",t:"normal",c:"status",p:0,a:100,pp:30},
infestation: {n:"침식",t:"bug",c:"special",p:20,a:100,pp:20},
powerpunch:  {n:"파워업펀치",t:"fighting",c:"physical",p:40,a:100,pp:20},
overheat:    {n:"오버히트",t:"fire",c:"special",p:130,a:90,pp:5},
roost:       {n:"깃털쉬기",t:"flying",c:"status",p:0,a:100,pp:10,ef:"heal"},
shockwave:   {n:"전격파",t:"electric",c:"special",p:60,a:0,pp:20},
// ═══ 추가 기술 (Gen 1-6 원작 기반) ═══
// ── Normal ──
doublekick:  {n:"이중차기",t:"fighting",c:"physical",p:30,a:100,pp:30},
doubleslap:  {n:"연속뺨치기",t:"normal",c:"physical",p:15,a:85,pp:10},
doubleteam:  {n:"그림자분신",t:"normal",c:"status",p:0,a:100,pp:15,ef:"eva_up"},
rage:        {n:"분노",t:"normal",c:"physical",p:20,a:100,pp:20},
swift:       {n:"스피드스타",t:"normal",c:"special",p:60,a:0,pp:20},
takedown:    {n:"돌진",t:"normal",c:"physical",p:90,a:85,pp:20,ef:"recoil"},
thrash:      {n:"난동부리기",t:"normal",c:"physical",p:120,a:100,pp:10},
return_:     {n:"은혜갚기",t:"normal",c:"physical",p:102,a:100,pp:20},
frustration: {n:"화풀이",t:"normal",c:"physical",p:102,a:100,pp:20},
falseswipe:  {n:"칼등치기",t:"normal",c:"physical",p:40,a:100,pp:40},
gigaimpact:  {n:"기가임팩트",t:"normal",c:"physical",p:150,a:90,pp:5},
strength:    {n:"괴력",t:"normal",c:"physical",p:80,a:100,pp:15},
cut:         {n:"풀베기",t:"normal",c:"physical",p:50,a:95,pp:30},
hypervoice:  {n:"하이퍼보이스",t:"normal",c:"special",p:90,a:100,pp:10},
round:       {n:"돌림노래",t:"normal",c:"special",p:60,a:100,pp:15},
uproar:      {n:"떠들기",t:"normal",c:"special",p:90,a:100,pp:10},
echoedvoice: {n:"에코보이스",t:"normal",c:"special",p:40,a:100,pp:15},
covet:       {n:"탐내다",t:"normal",c:"physical",p:60,a:100,pp:25},
lastresort:  {n:"마지막수단",t:"normal",c:"physical",p:140,a:100,pp:5},
selfdestruct:{n:"자폭",t:"normal",c:"physical",p:200,a:100,pp:5,ef:"selfdestruct"},
flail:       {n:"발버둥",t:"normal",c:"physical",p:1,a:100,pp:15},
fakeout:     {n:"속이다",t:"normal",c:"physical",p:40,a:100,pp:10,priority:3,ef:"flinch",ec:100},
feint:       {n:"페인트",t:"normal",c:"physical",p:30,a:100,pp:10,priority:2},
endure:      {n:"버티기",t:"normal",c:"status",p:0,a:100,pp:10,priority:4},
substitute:  {n:"대타출동",t:"normal",c:"status",p:0,a:100,pp:10},
disable:     {n:"사슬묶기",t:"normal",c:"status",p:0,a:100,pp:20},
swagger:     {n:"뽐내기",t:"normal",c:"status",p:0,a:85,pp:15,ef:"confuse",ec:100},
attract:     {n:"헤롱헤롱",t:"normal",c:"status",p:0,a:100,pp:15},
yawn:        {n:"하품",t:"normal",c:"status",p:0,a:100,pp:10,ef:"sleep",ec:100},
screech:     {n:"싫은소리",t:"normal",c:"status",p:0,a:85,pp:40,ef:"def_down2"},
whirlwind:   {n:"회오리바람",t:"normal",c:"status",p:0,a:100,pp:20},
roar:        {n:"짖기",t:"normal",c:"status",p:0,a:100,pp:20},
stockpile:   {n:"축적",t:"normal",c:"status",p:0,a:100,pp:20},
spitup:      {n:"분출",t:"normal",c:"special",p:100,a:100,pp:10},
swallow:     {n:"꿀꺽",t:"normal",c:"status",p:0,a:100,pp:10,ef:"heal"},
bellydrum:   {n:"배북",t:"normal",c:"status",p:0,a:100,pp:10},
painsplit:   {n:"아픔나누기",t:"normal",c:"status",p:0,a:100,pp:20},
// ── Fire ──
flamecharge: {n:"니트로차지",t:"fire",c:"physical",p:50,a:100,pp:20,ef:"spd_up"},
firespin:    {n:"불꽃소용돌이",t:"fire",c:"special",p:35,a:85,pp:15},
lavaplume:   {n:"분연",t:"fire",c:"special",p:80,a:100,pp:15,ef:"burn",ec:30},
heatwave:    {n:"열풍",t:"fire",c:"special",p:95,a:90,pp:10,ef:"burn",ec:10},
fierydance:  {n:"불꽃춤",t:"fire",c:"special",p:80,a:100,pp:10,ef:"spa_up",ec:50},
mysticalfire:{n:"매지컬플레임",t:"fire",c:"special",p:75,a:100,pp:10,ef:"spa_down",ec:100},
sacredfire:  {n:"성스러운불꽃",t:"fire",c:"physical",p:100,a:95,pp:5,ef:"burn",ec:50},
blueflare:   {n:"푸른불꽃",t:"fire",c:"special",p:130,a:85,pp:5,ef:"burn",ec:20},
vcreate:     {n:"V제너레이트",t:"fire",c:"physical",p:180,a:95,pp:5},
inferno:     {n:"연옥",t:"fire",c:"special",p:100,a:50,pp:5,ef:"burn",ec:100},
// ── Water ──
aquajet:     {n:"아쿠아제트",t:"water",c:"physical",p:40,a:100,pp:20,priority:1},
razorshell:  {n:"셸블레이드",t:"water",c:"physical",p:75,a:95,pp:10,ef:"def_down",ec:50},
liquidation: {n:"아쿠아브레이크",t:"water",c:"physical",p:85,a:100,pp:10,ef:"def_down",ec:20},
icywind:     {n:"얼어붙는바람",t:"ice",c:"special",p:55,a:95,pp:15,ef:"spd_down",ec:100},
whirlpool:   {n:"소용돌이",t:"water",c:"special",p:35,a:85,pp:15},
brine:       {n:"소금물",t:"water",c:"special",p:65,a:100,pp:10},
muddywater:  {n:"탁류",t:"water",c:"special",p:90,a:85,pp:10,ef:"acc_down",ec:30},
waterpledge:  {n:"물의맹세",t:"water",c:"special",p:80,a:100,pp:10},
originpulse: {n:"근원의파동",t:"water",c:"special",p:110,a:85,pp:10},
// ── Electric ──
discharge:   {n:"방전",t:"electric",c:"special",p:80,a:100,pp:15,ef:"paralyze",ec:30},
chargebeam:  {n:"차지빔",t:"electric",c:"special",p:50,a:90,pp:10,ef:"spa_up",ec:70},
electroball: {n:"일렉트로볼",t:"electric",c:"special",p:60,a:100,pp:10},
thunderfang: {n:"번개엄니",t:"electric",c:"physical",p:65,a:95,pp:15,ef:"paralyze",ec:10},
nuzzle:      {n:"볼부비부비",t:"electric",c:"physical",p:20,a:100,pp:20,ef:"paralyze",ec:100},
zapcannon:   {n:"전자포",t:"electric",c:"special",p:120,a:50,pp:5,ef:"paralyze",ec:100},
boltstrike:  {n:"뇌격",t:"electric",c:"physical",p:130,a:85,pp:5,ef:"paralyze",ec:20},
// ── Grass ──
seedbomb:    {n:"씨폭탄",t:"grass",c:"physical",p:80,a:100,pp:15},
leafblade:   {n:"리프블레이드",t:"grass",c:"physical",p:90,a:100,pp:15,ef:"highcrit"},
powerwhip:   {n:"파워휩",t:"grass",c:"physical",p:120,a:85,pp:10},
woodhammer:  {n:"우드해머",t:"grass",c:"physical",p:120,a:100,pp:15,ef:"recoil"},
magicalleaf: {n:"매지컬리프",t:"grass",c:"special",p:60,a:0,pp:20},
leafstorm:   {n:"리프스톰",t:"grass",c:"special",p:130,a:90,pp:5},
grasswhistle:{n:"풀피리",t:"grass",c:"status",p:0,a:55,pp:15,ef:"sleep",ec:100},
cottonspore: {n:"목화포자",t:"grass",c:"status",p:0,a:100,pp:40,ef:"spd_down2"},
growth:      {n:"성장",t:"normal",c:"status",p:0,a:100,pp:20,ef:"spa_up"},
synthesis:   {n:"광합성",t:"grass",c:"status",p:0,a:100,pp:5,ef:"heal"},
aromatherapy:{n:"아로마테라피",t:"grass",c:"status",p:0,a:100,pp:5},
seedflare:   {n:"시드플레어",t:"grass",c:"special",p:120,a:85,pp:5,ef:"spdef_down",ec:40},
grasspledge:  {n:"풀의맹세",t:"grass",c:"special",p:80,a:100,pp:10},
// ── Ice ──
iceshard:    {n:"얼음뭉치",t:"ice",c:"physical",p:40,a:100,pp:30,priority:1},
icefang:     {n:"얼음엄니",t:"ice",c:"physical",p:65,a:95,pp:15,ef:"freeze",ec:10},
avalanche:   {n:"눈사태",t:"ice",c:"physical",p:60,a:100,pp:10},
iciclecrash: {n:"고드름떨구기",t:"ice",c:"physical",p:85,a:90,pp:10,ef:"flinch",ec:30},
freezedry:   {n:"프리즈드라이",t:"ice",c:"special",p:70,a:100,pp:20,ef:"freeze",ec:10},
glaciate:    {n:"글래셜레이트",t:"ice",c:"special",p:65,a:95,pp:10,ef:"spd_down",ec:100},
haze:        {n:"흑안개",t:"ice",c:"status",p:0,a:100,pp:30},
mist:        {n:"흰안개",t:"ice",c:"status",p:0,a:100,pp:30},
// ── Fighting ──
machpunch:   {n:"마하펀치",t:"fighting",c:"physical",p:40,a:100,pp:30,priority:1},
revenge:     {n:"리벤지",t:"fighting",c:"physical",p:60,a:100,pp:10},
superpower:  {n:"바디프레스",t:"fighting",c:"physical",p:120,a:100,pp:5},
hammerarm:   {n:"암해머",t:"fighting",c:"physical",p:100,a:90,pp:10},
skyuppercut: {n:"스카이어퍼",t:"fighting",c:"physical",p:85,a:90,pp:15},
submission:  {n:"지옥굳히기",t:"fighting",c:"physical",p:80,a:80,pp:20,ef:"recoil"},
lowsweep:    {n:"로킥",t:"fighting",c:"physical",p:65,a:100,pp:20,ef:"spd_down",ec:100},
vacuumwave:  {n:"진공파",t:"fighting",c:"special",p:40,a:100,pp:30,priority:1},
focusblast:  {n:"기합구슬",t:"fighting",c:"special",p:120,a:70,pp:5,ef:"spdef_down",ec:10},
reversal:    {n:"기사회생",t:"fighting",c:"physical",p:1,a:100,pp:15},
circlethrow: {n:"배대뒤치기",t:"fighting",c:"physical",p:60,a:90,pp:10},
sacredsword: {n:"성스러운칼",t:"fighting",c:"physical",p:90,a:100,pp:15},
secretsword: {n:"신비의칼",t:"fighting",c:"special",p:85,a:100,pp:10},
bulkup:      {n:"벌크업",t:"fighting",c:"status",p:0,a:100,pp:20,ef:"bulkup"},
detect:      {n:"판별",t:"fighting",c:"status",p:0,a:100,pp:5,priority:4},
// ── Poison ──
venoshock:   {n:"베놈쇼크",t:"poison",c:"special",p:65,a:100,pp:10},
smog:        {n:"스모그",t:"poison",c:"special",p:30,a:70,pp:20,ef:"poison",ec:40},
clearsmog:   {n:"클리어스모그",t:"poison",c:"special",p:50,a:100,pp:15},
sludgewave:  {n:"오물웨이브",t:"poison",c:"special",p:95,a:100,pp:10,ef:"poison",ec:10},
gunkshot:    {n:"더스트슈트",t:"poison",c:"physical",p:120,a:80,pp:5,ef:"poison",ec:30},
poisontail:  {n:"포이즌테일",t:"poison",c:"physical",p:50,a:100,pp:25,ef:"poison",ec:10},
coil:        {n:"똬리틀기",t:"poison",c:"status",p:0,a:100,pp:20},
// ── Ground ──
drillrun:    {n:"드릴라이너",t:"ground",c:"physical",p:80,a:95,pp:10,ef:"highcrit"},
highhorsepower:{n:"10만마력",t:"ground",c:"physical",p:95,a:95,pp:10},
sandtomb:    {n:"모래지옥",t:"ground",c:"physical",p:35,a:85,pp:15},
precipiceblades:{n:"단애의칼",t:"ground",c:"physical",p:120,a:85,pp:10},
sandstorm:   {n:"모래바람",t:"ground",c:"status",p:0,a:100,pp:10},
// ── Flying ──
aircutter:   {n:"에어커터",t:"flying",c:"special",p:60,a:95,pp:25,ef:"highcrit"},
hurricane:   {n:"폭풍",t:"flying",c:"special",p:110,a:70,pp:10,ef:"confuse",ec:30},
bounce:      {n:"바운스",t:"flying",c:"physical",p:85,a:85,pp:5,ef:"paralyze",ec:30},
skyattack:   {n:"갓버드",t:"flying",c:"physical",p:140,a:90,pp:5,ef:"flinch",ec:30},
pluck:       {n:"쪼아대기",t:"flying",c:"physical",p:60,a:100,pp:20},
defog:       {n:"안개제거",t:"flying",c:"status",p:0,a:100,pp:15},
tailwind:    {n:"순풍",t:"flying",c:"status",p:0,a:100,pp:15},
oblivionwing:{n:"데스윙",t:"flying",c:"special",p:80,a:100,pp:10,ef:"drain"},
// ── Psychic ──
psyshock:    {n:"사이코쇼크",t:"psychic",c:"special",p:80,a:100,pp:10},
extrasensory:{n:"신통력",t:"psychic",c:"special",p:80,a:100,pp:20,ef:"flinch",ec:10},
futuresight: {n:"미래예지",t:"psychic",c:"special",p:120,a:100,pp:10},
zenheadbutt: {n:"선혈두",t:"psychic",c:"physical",p:80,a:90,pp:15,ef:"flinch",ec:20},
psychocut:   {n:"사이코커터",t:"psychic",c:"physical",p:70,a:100,pp:20,ef:"highcrit"},
storedpower: {n:"어시스트파워",t:"psychic",c:"special",p:20,a:100,pp:10},
trickroom:   {n:"트릭룸",t:"psychic",c:"status",p:0,a:100,pp:5},
trick:       {n:"트릭",t:"psychic",c:"status",p:0,a:100,pp:10},
agility:     {n:"고속이동",t:"psychic",c:"status",p:0,a:100,pp:30,ef:"spd_up2"},
amnesia:     {n:"기억술",t:"psychic",c:"status",p:0,a:100,pp:20,ef:"spdef_up2"},
barrier:     {n:"배리어",t:"psychic",c:"status",p:0,a:100,pp:20,ef:"def_up2"},
reflect:     {n:"리플렉터",t:"psychic",c:"status",p:0,a:100,pp:20,ef:"def_up"},
meditate:    {n:"요가포즈",t:"psychic",c:"status",p:0,a:100,pp:40,ef:"atk_up"},
cosmicpower: {n:"코스모파워",t:"psychic",c:"status",p:0,a:100,pp:20},
gravity:     {n:"중력",t:"psychic",c:"status",p:0,a:100,pp:5},
healingwish: {n:"치유소원",t:"psychic",c:"status",p:0,a:100,pp:10},
// ── Bug ──
leechlife:   {n:"흡혈",t:"bug",c:"physical",p:80,a:100,pp:10,ef:"drain"},
pinmissile:  {n:"바늘미사일",t:"bug",c:"physical",p:25,a:95,pp:20},
bugbuzz:     {n:"벌레의야단법석",t:"bug",c:"special",p:90,a:100,pp:10,ef:"spdef_down",ec:10},
quiverdance: {n:"나비춤",t:"bug",c:"status",p:0,a:100,pp:20},
tailglow:    {n:"반딧불",t:"bug",c:"status",p:0,a:100,pp:20,ef:"spa_up"},
// ── Rock ──
powergem:    {n:"파워젬",t:"rock",c:"special",p:80,a:100,pp:20},
ancientpower:{n:"원시의힘",t:"rock",c:"special",p:60,a:100,pp:5},
smackdown:   {n:"떨어뜨리기",t:"rock",c:"physical",p:50,a:100,pp:15},
rockpolish:  {n:"록폴리시",t:"rock",c:"status",p:0,a:100,pp:20,ef:"spd_up2"},
headsmash:   {n:"모로꼬박기",t:"rock",c:"physical",p:150,a:80,pp:5,ef:"recoil"},
diamondstorm:{n:"다이아스톰",t:"rock",c:"physical",p:100,a:95,pp:5,ef:"def_up",ec:50},
// ── Ghost ──
shadowpunch: {n:"섀도펀치",t:"ghost",c:"physical",p:60,a:0,pp:20},
shadowsneak: {n:"그림자몰래숨기",t:"ghost",c:"physical",p:40,a:100,pp:30,priority:1},
phantomforce:{n:"고스트다이브",t:"ghost",c:"physical",p:90,a:100,pp:10},
shadowforce: {n:"섀도다이브",t:"ghost",c:"physical",p:120,a:100,pp:5},
ominouswind: {n:"기묘한바람",t:"ghost",c:"special",p:60,a:100,pp:5},
curse:       {n:"저주",t:"ghost",c:"status",p:0,a:100,pp:10},
destinybond: {n:"길동무",t:"ghost",c:"status",p:0,a:100,pp:5},
spite:       {n:"원한",t:"ghost",c:"status",p:0,a:100,pp:10},
// ── Dragon ──
dragonrush:  {n:"드래곤다이브",t:"dragon",c:"physical",p:100,a:75,pp:10,ef:"flinch",ec:20},
dracometeor: {n:"용성군",t:"dragon",c:"special",p:130,a:90,pp:5},
dragonDance: {n:"용의춤",t:"dragon",c:"status",p:0,a:100,pp:20,ef:"dragondance"},
twister:     {n:"회오리",t:"dragon",c:"special",p:40,a:100,pp:20,ef:"flinch",ec:20},
spacialrend: {n:"아공절단",t:"dragon",c:"special",p:100,a:95,pp:5,ef:"highcrit"},
roaroftime:  {n:"시간의포효",t:"dragon",c:"special",p:150,a:90,pp:5},
// ── Dark ──
knockoff:    {n:"탈취",t:"dark",c:"physical",p:65,a:100,pp:20},
suckerpunch: {n:"기습",t:"dark",c:"physical",p:70,a:100,pp:5,priority:1},
nightslash:  {n:"밤베기",t:"dark",c:"physical",p:70,a:100,pp:15,ef:"highcrit"},
assurance:   {n:"다짐",t:"dark",c:"physical",p:60,a:100,pp:10},
payback:     {n:"보복짓",t:"dark",c:"physical",p:50,a:100,pp:10},
foulplay:    {n:"이판사판",t:"dark",c:"physical",p:95,a:100,pp:15},
snarl:       {n:"짖어대기",t:"dark",c:"special",p:55,a:95,pp:15,ef:"spa_down",ec:100},
taunt:       {n:"도발",t:"dark",c:"status",p:0,a:100,pp:20},
torment:     {n:"트집",t:"dark",c:"status",p:0,a:100,pp:15},
nastyplot:   {n:"나쁜음모",t:"dark",c:"status",p:0,a:100,pp:20,ef:"spa_up2"},
honeclaws:   {n:"손톱갈기",t:"dark",c:"status",p:0,a:100,pp:15},
embargo:     {n:"봉인",t:"dark",c:"status",p:0,a:100,pp:15},
// ── Steel ──
gyroball:    {n:"자이로볼",t:"steel",c:"physical",p:1,a:100,pp:5},
heavyslam:   {n:"헤비봉버",t:"steel",c:"physical",p:1,a:100,pp:10},
meteormash:  {n:"코멧펀치",t:"steel",c:"physical",p:90,a:90,pp:10,ef:"atk_up",ec:20},
mirrorshot:  {n:"미러숏",t:"steel",c:"special",p:65,a:85,pp:10,ef:"acc_down",ec:30},
doomdesire:  {n:"파멸의소원",t:"steel",c:"special",p:140,a:100,pp:5},
magnetrise:  {n:"전자부유",t:"electric",c:"status",p:0,a:100,pp:10},
autotomize:  {n:"바디퍼지",t:"steel",c:"status",p:0,a:100,pp:15,ef:"spd_up2"},
kingsshield: {n:"킹실드",t:"steel",c:"status",p:0,a:100,pp:10,priority:4},
// ── Fairy ──
drainingkiss:{n:"드레인키스",t:"fairy",c:"special",p:50,a:100,pp:10,ef:"drain"},
fairywind:   {n:"요정의바람",t:"fairy",c:"special",p:40,a:100,pp:30},
// ── Legendary / Signature ──
aeroblast:   {n:"에어로블라스트",t:"flying",c:"special",p:100,a:95,pp:5,ef:"highcrit"},
psychoboost: {n:"사이코부스트",t:"psychic",c:"special",p:140,a:90,pp:5},
judgment:    {n:"심판의뭉치",t:"normal",c:"special",p:100,a:100,pp:10},
magmastorm:  {n:"마그마스톰",t:"fire",c:"special",p:100,a:75,pp:5},
fusionflare: {n:"크로스플레임",t:"fire",c:"special",p:100,a:100,pp:5},
fusionbolt:  {n:"크로스썬더",t:"electric",c:"physical",p:100,a:100,pp:5},
// ── Weather & Field ──
raindance:   {n:"비바라기",t:"water",c:"status",p:0,a:100,pp:5},
sunnyday:    {n:"쾌청",t:"fire",c:"status",p:0,a:100,pp:5},
hail:        {n:"싸라기눈",t:"ice",c:"status",p:0,a:100,pp:10},
// ── Misc Status ──
shellsmash:  {n:"껍질깨기",t:"normal",c:"status",p:0,a:100,pp:15},
cottonguard: {n:"코튼가드",t:"grass",c:"status",p:0,a:100,pp:10,ef:"def_up2"},
minimize:    {n:"작아지기",t:"normal",c:"status",p:0,a:100,pp:10,ef:"eva_up"},
howl:        {n:"울부짖기",t:"normal",c:"status",p:0,a:100,pp:40,ef:"atk_up"},
flash:       {n:"플래시",t:"normal",c:"status",p:0,a:100,pp:20,ef:"acc_down",ec:100},
glare:       {n:"뱀눈초리",t:"normal",c:"status",p:0,a:100,pp:30,ef:"paralyze",ec:100},
// ── Unique/Utility ──
firefang:    {n:"불꽃엄니",t:"fire",c:"physical",p:65,a:95,pp:15,ef:"burn",ec:10},
rockclimb:   {n:"록클라임",t:"normal",c:"physical",p:90,a:85,pp:20,ef:"confuse",ec:20},
extremespeed:{n:"신속",t:"normal",c:"physical",p:80,a:100,pp:5,priority:2},
dualchop:    {n:"더블촙",t:"dragon",c:"physical",p:40,a:90,pp:15},
wakeupslap:  {n:"눈깨우기뺨치기",t:"fighting",c:"physical",p:70,a:100,pp:10},
paraboliccharge:{n:"뿌링클전류",t:"electric",c:"special",p:65,a:100,pp:20,ef:"drain"},
eerieimpulse:{n:"괴전파",t:"electric",c:"status",p:0,a:100,pp:15,ef:"spa_down2"},
// ═══ 추가 기술 (Gen 1-6 완전판) ═══
guillotine:{n:"가위자르기",t:"normal",c:"physical",p:1,a:30,pp:5},
hornDrill:{n:"뿔드릴",t:"normal",c:"physical",p:1,a:30,pp:5},
fissure:{n:"지각변동",t:"ground",c:"physical",p:1,a:30,pp:5},
sheercold:{n:"절대영도",t:"ice",c:"special",p:1,a:30,pp:5},
payday:{n:"고양이돈받기",t:"normal",c:"physical",p:40,a:100,pp:20},
cometpunch:{n:"연속펀치",t:"normal",c:"physical",p:18,a:85,pp:15},
doublehit:{n:"더블어택",t:"normal",c:"physical",p:35,a:90,pp:10},
mimic:{n:"흉내내기",t:"normal",c:"status",p:0,a:100,pp:10},
metronome:{n:"손가락흔들기",t:"normal",c:"status",p:0,a:100,pp:10},
skullbash:{n:"로켓두뇌",t:"normal",c:"physical",p:130,a:100,pp:10},
spikecannon:{n:"가시대포",t:"normal",c:"physical",p:20,a:100,pp:15},
constrict:{n:"조여오기",t:"normal",c:"physical",p:10,a:100,pp:35,ef:"spd_down",ec:10},
barrage:{n:"구슬던지기",t:"normal",c:"physical",p:15,a:85,pp:20},
transform:{n:"변신",t:"normal",c:"status",p:0,a:100,pp:10},
superfang:{n:"분노의앞니",t:"normal",c:"physical",p:1,a:90,pp:10},
sleeptalk:{n:"잠꼬대",t:"normal",c:"status",p:0,a:100,pp:10},
healbell:{n:"치유방울",t:"normal",c:"status",p:0,a:100,pp:5},
snore:{n:"코골기",t:"normal",c:"special",p:50,a:100,pp:15,ef:"flinch",ec:30},
scaryface:{n:"무서운얼굴",t:"normal",c:"status",p:0,a:100,pp:10,ef:"spd_down2",ec:100},
sweetscent:{n:"달콤한향기",t:"normal",c:"status",p:0,a:100,pp:20},
morningsun:{n:"아침햇살",t:"normal",c:"status",p:0,a:100,pp:5,ef:"heal"},
meanlook:{n:"검은눈빛",t:"normal",c:"status",p:0,a:100,pp:5},
batonpass:{n:"바톤터치",t:"normal",c:"status",p:0,a:100,pp:40},
rapidspin:{n:"고속회전",t:"normal",c:"physical",p:50,a:100,pp:40},
perishsong:{n:"멸망의노래",t:"normal",c:"status",p:0,a:100,pp:5},
followme:{n:"따라와",t:"normal",c:"status",p:0,a:100,pp:20},
helpinghand:{n:"도우미",t:"normal",c:"status",p:0,a:100,pp:20},
recycle:{n:"재활용",t:"normal",c:"status",p:0,a:100,pp:10},
secretpower:{n:"비밀의힘",t:"normal",c:"physical",p:70,a:100,pp:20},
tailslap:{n:"스위프뺨치기",t:"normal",c:"physical",p:25,a:85,pp:10},
technoblast:{n:"테크노버스터",t:"normal",c:"special",p:120,a:100,pp:5},
relicsong:{n:"옛노래",t:"normal",c:"special",p:75,a:100,pp:10,ef:"sleep",ec:10},
naturepower:{n:"자연의힘",t:"normal",c:"status",p:0,a:100,pp:20},
chipaway:{n:"깨트려부수기",t:"normal",c:"physical",p:70,a:100,pp:20},
entrainment:{n:"동조",t:"normal",c:"status",p:0,a:100,pp:15},
afteryou:{n:"먼저어서",t:"normal",c:"status",p:0,a:100,pp:15},
crushgrip:{n:"악력쥐기",t:"normal",c:"physical",p:1,a:100,pp:5},
wringout:{n:"짜내기",t:"normal",c:"special",p:1,a:100,pp:5},
hyperFang:{n:"이빨로물기",t:"normal",c:"physical",p:80,a:90,pp:15,ef:"flinch",ec:10},
weatherball:{n:"웨더볼",t:"normal",c:"special",p:50,a:100,pp:10},
smellingsalts:{n:"기상천외",t:"normal",c:"physical",p:70,a:100,pp:10},
luckychant:{n:"행운기원",t:"normal",c:"status",p:0,a:100,pp:30},
safeguard:{n:"신비한부적",t:"normal",c:"status",p:0,a:100,pp:25},
crushclaw:{n:"크러시클로",t:"normal",c:"physical",p:75,a:95,pp:10,ef:"def_down",ec:50},
razorwind:{n:"칼바람",t:"normal",c:"special",p:80,a:100,pp:10,ef:"highcrit"},
camouflage:{n:"보호색",t:"normal",c:"status",p:0,a:100,pp:20},
naturalgift:{n:"자연의은혜",t:"normal",c:"physical",p:80,a:100,pp:15},
conversion:{n:"타입체인지",t:"normal",c:"status",p:0,a:100,pp:30},
conversion2:{n:"타입체인지2",t:"normal",c:"status",p:0,a:100,pp:30},
teleport:{n:"순간이동",t:"psychic",c:"status",p:0,a:100,pp:20},
firepledge:{n:"불꽃맹세",t:"fire",c:"special",p:80,a:100,pp:10},
heatcrash:{n:"히트스탬프",t:"fire",c:"physical",p:1,a:100,pp:10},
searingshot:{n:"화염탄",t:"fire",c:"special",p:100,a:100,pp:5,ef:"burn",ec:30},
flameburst:{n:"불꽃파열",t:"fire",c:"special",p:70,a:100,pp:15},
burnup:{n:"불사르기",t:"fire",c:"special",p:130,a:100,pp:5},
dive:{n:"다이빙",t:"water",c:"physical",p:80,a:100,pp:10},
clamp:{n:"껍질끼우기",t:"water",c:"physical",p:35,a:85,pp:15},
octazooka:{n:"옥타포탄",t:"water",c:"special",p:65,a:85,pp:10,ef:"acc_down",ec:50},
waterspout:{n:"해수스파우팅",t:"water",c:"special",p:150,a:100,pp:5},
aquaring:{n:"아쿠아링",t:"water",c:"status",p:0,a:100,pp:20},
steameruption:{n:"스팀버스트",t:"water",c:"special",p:110,a:95,pp:5,ef:"burn",ec:30},
withdraw:{n:"껍질에숨기",t:"water",c:"status",p:0,a:100,pp:40,ef:"def_up"},
sparklingaria:{n:"물거품아리아",t:"water",c:"special",p:90,a:100,pp:10},
electroweb:{n:"일렉트릭네트",t:"electric",c:"special",p:55,a:95,pp:15,ef:"spd_down",ec:100},
voltTackle:{n:"볼트태클",t:"electric",c:"physical",p:120,a:100,pp:15,ef:"recoil"},
charge:{n:"충전",t:"electric",c:"status",p:0,a:100,pp:20,ef:"spdef_up"},
iondeluge:{n:"플라스마샤워",t:"electric",c:"status",p:0,a:100,pp:25},
electroterrain:{n:"일렉트릭필드",t:"electric",c:"status",p:0,a:100,pp:10},
magneticflux:{n:"자기장조작",t:"electric",c:"status",p:0,a:100,pp:20},
needlearm:{n:"바늘팔",t:"grass",c:"physical",p:60,a:100,pp:15,ef:"flinch",ec:30},
worryseed:{n:"고민씨",t:"grass",c:"status",p:0,a:100,pp:10},
ingrain:{n:"뿌리박기",t:"grass",c:"status",p:0,a:100,pp:20},
petalDance:{n:"꽃잎댄스",t:"grass",c:"special",p:120,a:100,pp:10},
bulletseed:{n:"씨기관총",t:"grass",c:"physical",p:25,a:100,pp:30},
hornLeech:{n:"우드혼",t:"grass",c:"physical",p:75,a:100,pp:10,ef:"drain"},
spikyshield:{n:"니들가드",t:"grass",c:"status",p:0,a:100,pp:10},
grassyterrain:{n:"그래스필드",t:"grass",c:"status",p:0,a:100,pp:10},
auroraveil:{n:"오로라베일",t:"ice",c:"status",p:0,a:100,pp:20},
iceburn:{n:"콜드플레어2",t:"ice",c:"special",p:140,a:90,pp:5,ef:"burn",ec:30},
powdersnow:{n:"가루눈",t:"ice",c:"special",p:40,a:100,pp:25,ef:"freeze",ec:10},
freezebolt:{n:"프리즈볼트",t:"ice",c:"physical",p:140,a:90,pp:5,ef:"paralyze",ec:30},
forcepalm:{n:"장풍",t:"fighting",c:"physical",p:60,a:100,pp:10,ef:"paralyze",ec:30},
stormthrow:{n:"야마타로스",t:"fighting",c:"physical",p:60,a:100,pp:10,ef:"highcrit"},
vitalthrow:{n:"지옥떨기",t:"fighting",c:"physical",p:70,a:0,pp:10},
armthrust:{n:"밀어펀치",t:"fighting",c:"physical",p:15,a:100,pp:20},
rocksmash:{n:"바위깨기",t:"fighting",c:"physical",p:40,a:100,pp:15,ef:"def_down",ec:50},
highjumpkick:{n:"무릎차기",t:"fighting",c:"physical",p:130,a:90,pp:10},
jumpkick:{n:"뛰어올라차기",t:"fighting",c:"physical",p:100,a:95,pp:10},
flyingpress:{n:"플라잉프레스",t:"fighting",c:"physical",p:100,a:95,pp:10},
poweruppunch:{n:"업펀치",t:"fighting",c:"physical",p:40,a:100,pp:20,ef:"atk_up",ec:100},
matblock:{n:"돗자리뒤집기",t:"fighting",c:"status",p:0,a:100,pp:10},
quickguard:{n:"패스트가드",t:"fighting",c:"status",p:0,a:100,pp:15},
acidspray:{n:"산성액",t:"poison",c:"special",p:40,a:100,pp:20,ef:"spdef_down",ec:100},
belch:{n:"게워내기",t:"poison",c:"special",p:120,a:90,pp:10},
spikes:{n:"압정뿌리기",t:"ground",c:"status",p:0,a:100,pp:20},
toxicspikes:{n:"독압정",t:"poison",c:"status",p:0,a:100,pp:20},
mudbomb:{n:"진흙폭탄",t:"ground",c:"special",p:65,a:85,pp:10,ef:"acc_down",ec:30},
magnitude:{n:"매그니튀드",t:"ground",c:"physical",p:70,a:100,pp:30},
thousandwaves:{n:"사우전드웨이브",t:"ground",c:"physical",p:90,a:100,pp:10},
thousandarrows:{n:"사우전드애로우",t:"ground",c:"physical",p:90,a:100,pp:10},
landswrath:{n:"그라운드포스",t:"ground",c:"physical",p:90,a:100,pp:10},
bonerush:{n:"뼈다귀부메랑",t:"ground",c:"physical",p:25,a:90,pp:10},
dragonascent:{n:"화룡점정",t:"flying",c:"physical",p:120,a:100,pp:5},
featherdance:{n:"깃털댄스",t:"flying",c:"status",p:0,a:100,pp:15,ef:"atk_down2",ec:100},
skyDrop:{n:"프리폴",t:"flying",c:"physical",p:60,a:100,pp:10},
mirrormove:{n:"거울반사",t:"flying",c:"status",p:0,a:100,pp:20},
hyperspacefury:{n:"초차원러시",t:"dark",c:"physical",p:100,a:100,pp:5},
hyperspacehole:{n:"초차원홀",t:"psychic",c:"special",p:80,a:100,pp:5},
synchronoise:{n:"싱크로노이즈",t:"psychic",c:"special",p:120,a:100,pp:10},
lusterpurge:{n:"래스터퍼지",t:"psychic",c:"special",p:70,a:100,pp:5,ef:"spdef_down",ec:50},
mistball:{n:"미스트볼",t:"psychic",c:"special",p:70,a:100,pp:5,ef:"spa_down",ec:50},
imprison:{n:"기술봉인",t:"psychic",c:"status",p:0,a:100,pp:10},
kinesis:{n:"스푼구부리기",t:"psychic",c:"status",p:0,a:80,pp:15,ef:"acc_down",ec:100},
heartStamp:{n:"하트스탬프",t:"psychic",c:"physical",p:60,a:100,pp:25,ef:"flinch",ec:30},
psychicterrain:{n:"사이코필드",t:"psychic",c:"status",p:0,a:100,pp:10},
magiccoat:{n:"매직코트",t:"psychic",c:"status",p:0,a:100,pp:15},
magicroom:{n:"매직룸",t:"psychic",c:"status",p:0,a:100,pp:10},
wonderroom:{n:"원더룸",t:"psychic",c:"status",p:0,a:100,pp:10},
skillswap:{n:"스킬스왑",t:"psychic",c:"status",p:0,a:100,pp:10},
roleplay:{n:"흉내쟁이",t:"psychic",c:"status",p:0,a:100,pp:10},
guardswap:{n:"가드쉐어",t:"psychic",c:"status",p:0,a:100,pp:10},
powerswap:{n:"파워쉐어",t:"psychic",c:"status",p:0,a:100,pp:10},
heartswap:{n:"하트스왑",t:"psychic",c:"status",p:0,a:100,pp:10},
healblock:{n:"회복봉인",t:"psychic",c:"status",p:0,a:100,pp:15},
healpulse:{n:"치유파동",t:"psychic",c:"status",p:0,a:100,pp:10},
powertrick:{n:"파워트릭",t:"psychic",c:"status",p:0,a:100,pp:10},
attackorder:{n:"공격지령",t:"bug",c:"physical",p:90,a:100,pp:15,ef:"highcrit"},
defendorder:{n:"방어지령",t:"bug",c:"status",p:0,a:100,pp:10},
healorder:{n:"회복지령",t:"bug",c:"status",p:0,a:100,pp:10,ef:"heal"},
ragepowder:{n:"분노가루",t:"bug",c:"status",p:0,a:100,pp:20},
stickyWeb:{n:"끈적끈적네트",t:"bug",c:"status",p:0,a:100,pp:20},
fellstinger:{n:"치명적찌르기",t:"bug",c:"physical",p:50,a:100,pp:25},
spiderweb:{n:"거미줄",t:"bug",c:"status",p:0,a:100,pp:10},
accelerock:{n:"가속록",t:"rock",c:"physical",p:40,a:100,pp:20,priority:1},
wideGuard:{n:"와이드가드",t:"rock",c:"status",p:0,a:100,pp:10},
nightdaze:{n:"나이트버스트",t:"dark",c:"special",p:85,a:95,pp:10,ef:"acc_down",ec:40},
trickortreat:{n:"핼러윈",t:"ghost",c:"status",p:0,a:100,pp:20},
punishment:{n:"처벌",t:"dark",c:"physical",p:60,a:100,pp:5},
beatup:{n:"집단구타",t:"dark",c:"physical",p:1,a:100,pp:10},
memento:{n:"추억의선물",t:"dark",c:"status",p:0,a:100,pp:10},
snatch:{n:"가로채기",t:"dark",c:"status",p:0,a:100,pp:10},
flatter:{n:"부추기기",t:"dark",c:"status",p:0,a:100,pp:15,ef:"confuse",ec:100},
quash:{n:"뒤로미루기",t:"dark",c:"status",p:0,a:100,pp:15},
darkVoid:{n:"다크홀",t:"dark",c:"status",p:0,a:50,pp:10,ef:"sleep",ec:100},
partingshot:{n:"회전인사",t:"dark",c:"status",p:0,a:100,pp:20},
topsyturvy:{n:"뒤집기",t:"dark",c:"status",p:0,a:100,pp:20},
geargrind:{n:"기어소서",t:"steel",c:"physical",p:50,a:85,pp:15},
shiftgear:{n:"기어체인지",t:"steel",c:"status",p:0,a:100,pp:10},
smartstrike:{n:"스마트혼",t:"steel",c:"physical",p:70,a:0,pp:10},
metalSound:{n:"금속소리",t:"steel",c:"status",p:0,a:85,pp:40,ef:"spdef_down",ec:100},
magnetbomb:{n:"자석폭탄",t:"steel",c:"physical",p:60,a:0,pp:20},
geomancy:{n:"지오컨트롤",t:"fairy",c:"status",p:0,a:100,pp:10},
mistyterrain:{n:"미스트필드",t:"fairy",c:"status",p:0,a:100,pp:10},
disarmingvoice:{n:"감미로운목소리",t:"fairy",c:"special",p:40,a:0,pp:15},
babydolleyes:{n:"아기인형눈",t:"fairy",c:"status",p:0,a:100,pp:30,ef:"atk_down",ec:100},
lightofRuin:{n:"파멸의빛",t:"fairy",c:"special",p:140,a:90,pp:5,ef:"recoil"},
floralhealing:{n:"플로럴치유",t:"fairy",c:"status",p:0,a:100,pp:10,ef:"heal"},
aromaticmist:{n:"아로마미스트",t:"fairy",c:"status",p:0,a:100,pp:20},
craftyshield:{n:"트릭가드",t:"fairy",c:"status",p:0,a:100,pp:10},
flowershield:{n:"플라워가드",t:"fairy",c:"status",p:0,a:100,pp:10},
poisongas:{n:"독가스",t:"poison",c:"status",p:0,a:90,pp:40,ef:"poison",ec:100},
bide:{n:"참기",t:"normal",c:"physical",p:1,a:100,pp:10},
dizzypunch:{n:"피바라펀치",t:"normal",c:"physical",p:70,a:100,pp:10,ef:"confuse",ec:20},
eggbomb:{n:"에그폭탄",t:"normal",c:"physical",p:100,a:75,pp:10},
boneclub:{n:"뼈다귀치기",t:"ground",c:"physical",p:65,a:85,pp:20},
lovelyKiss:{n:"악마의키스",t:"normal",c:"status",p:0,a:75,pp:10,ef:"sleep",ec:100},
rockWrecker:{n:"록블라스트",t:"rock",c:"physical",p:150,a:90,pp:5},
snipeshot:{n:"저격",t:"water",c:"special",p:80,a:100,pp:15,ef:"highcrit"},
astonish:{n:"놀래키기",t:"ghost",c:"physical",p:30,a:100,pp:15,ef:"flinch",ec:30},
rockTomb:{n:"암석봉인",t:"rock",c:"physical",p:60,a:95,pp:15,ef:"spd_down",ec:100},
shadowstrike:{n:"섀도스트라이크",t:"ghost",c:"physical",p:80,a:95,pp:10,ef:"def_down",ec:50},
miracleEye:{n:"기적의눈",t:"psychic",c:"status",p:0,a:100,pp:40},
fling:{n:"내다꽂기",t:"dark",c:"physical",p:1,a:100,pp:10},
gastroAcid:{n:"위산",t:"poison",c:"status",p:0,a:100,pp:10},
meFirst:{n:"대타먼저",t:"normal",c:"status",p:0,a:100,pp:20},
copycat:{n:"따라쟁이",t:"normal",c:"status",p:0,a:100,pp:20},
trumpCard:{n:"트럼프카드",t:"normal",c:"special",p:1,a:100,pp:5},
allySwitch:{n:"사이드체인지",t:"psychic",c:"status",p:0,a:100,pp:15},
incinerate:{n:"소각",t:"fire",c:"special",p:60,a:100,pp:15},
reflectType:{n:"트레이스",t:"normal",c:"status",p:0,a:100,pp:15},
finalGambit:{n:"죽기살기",t:"fighting",c:"special",p:1,a:100,pp:5},
psystrike:{n:"사이코브레이크",t:"psychic",c:"special",p:100,a:100,pp:10},
forestsCurse:{n:"숲의저주",t:"grass",c:"status",p:0,a:100,pp:20},
oceanicoperetta:{n:"해양오페레타",t:"water",c:"special",p:195,a:100,pp:1},
steelbeam:{n:"철갑빔",t:"steel",c:"special",p:140,a:95,pp:5,ef:"recoil"},
acidArmor:{n:"녹기",t:"poison",c:"status",p:0,a:100,pp:20,ef:"def_up2"},
psychUp:{n:"사이코업",t:"normal",c:"status",p:0,a:100,pp:10},
simplebeam:{n:"심플빔",t:"normal",c:"status",p:0,a:100,pp:15},
soak:{n:"물붓기",t:"water",c:"status",p:0,a:100,pp:20},
torchsong:{n:"열창",t:"fire",c:"special",p:80,a:100,pp:10,ef:"spa_up",ec:100},
trailblaze:{n:"풀타기",t:"grass",c:"physical",p:50,a:100,pp:20,ef:"spd_up",ec:100},
icespinner:{n:"아이스스피너",t:"ice",c:"physical",p:80,a:100,pp:15},
temperflare:{n:"분기",t:"fire",c:"physical",p:75,a:100,pp:10},
ragingbull:{n:"격노의황소",t:"normal",c:"physical",p:90,a:100,pp:10},
kowtowcleave:{n:"고두참",t:"dark",c:"physical",p:85,a:100,pp:10},
lumacurse:{n:"소금절이기",t:"ghost",c:"physical",p:75,a:100,pp:10},
silktrap:{n:"실크트랩",t:"bug",c:"status",p:0,a:100,pp:10},
axekick:{n:"도끼발차기",t:"fighting",c:"physical",p:120,a:90,pp:10},
lastrespects:{n:"엄동설한",t:"ghost",c:"physical",p:50,a:100,pp:10},
filletaway:{n:"나누기",t:"normal",c:"status",p:0,a:100,pp:10},
collision:{n:"충돌과정",t:"fighting",c:"physical",p:100,a:100,pp:5},
jetpunch:{n:"제트펀치",t:"water",c:"physical",p:60,a:100,pp:15,priority:1},
spicyextract:{n:"매운추출물",t:"grass",c:"status",p:0,a:100,pp:15},
spinout:{n:"스핀아웃",t:"steel",c:"physical",p:100,a:100,pp:5},
populationbomb:{n:"인해전술",t:"normal",c:"physical",p:20,a:90,pp:10},
glaiverush:{n:"글레이브러쉬",t:"dragon",c:"physical",p:120,a:100,pp:5},
revivalblessing:{n:"부활축복",t:"normal",c:"status",p:0,a:100,pp:1},
headlongrush:{n:"돌격",t:"ground",c:"physical",p:120,a:100,pp:5},
ragefist:{n:"분노의주먹",t:"ghost",c:"physical",p:50,a:100,pp:10},
armorcannon:{n:"아머캐논",t:"fire",c:"special",p:120,a:100,pp:5},
bitterblade:{n:"원한칼",t:"fire",c:"physical",p:90,a:100,pp:10,ef:"drain"},
doubleshock:{n:"이중충격",t:"electric",c:"physical",p:120,a:100,pp:5},
bittermalice:{n:"원한의일격",t:"ghost",c:"special",p:75,a:100,pp:10},
infernalparade:{n:"원혼의행렬",t:"ghost",c:"special",p:60,a:100,pp:15},
ceaselessedge:{n:"비장의일격",t:"dark",c:"physical",p:65,a:90,pp:15},
stoneaxe:{n:"바위도끼",t:"rock",c:"physical",p:65,a:90,pp:15},
springtidestorm:{n:"봄바람",t:"fairy",c:"special",p:100,a:80,pp:5},
mysticalpower:{n:"신비한힘",t:"psychic",c:"special",p:70,a:90,pp:10},
tripledive:{n:"트리플다이브",t:"water",c:"physical",p:30,a:95,pp:10},
twinbeam:{n:"트윈빔",t:"psychic",c:"special",p:40,a:100,pp:10},
mortalSpin:{n:"데스스핀",t:"poison",c:"physical",p:30,a:100,pp:15},
makeitrain:{n:"돈나무흔들기",t:"steel",c:"special",p:120,a:100,pp:5},
psyblade:{n:"사이코블레이드",t:"psychic",c:"physical",p:80,a:100,pp:15},
hydrosteam:{n:"하이드로스팀",t:"water",c:"special",p:80,a:100,pp:15},
ruination:{n:"황폐",t:"dark",c:"special",p:1,a:90,pp:10},
comeuppance:{n:"앙갚음",t:"dark",c:"physical",p:1,a:100,pp:10},
electroDrift:{n:"일렉트로드리프트",t:"electric",c:"special",p:100,a:100,pp:5},
};

// ═══════════════════════════════════════════════
// 🗺️ 지역 & 도로 데이터 (개편)
// ═══════════════════════════════════════════════
var REGIONS = {
kanto: {
    n: "관동지방", em: "🗾",
    roads: [
{id:"k_c1",n:"마사라타운",desc:"새로운 모험의 시작점",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote"],reqBadges:0,trainers:[]},
{id:"k_r1",n:"1번도로",desc:"마사라타운~토키와시티",lv:[2,5],pokemon:[{k:"pidgey",w:30},{k:"rattata",w:30},{k:"sentret",w:20},{k:"hoothoot",w:15},{k:"furret",w:5}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:0,trainers:[{n:"소년 사토시",em:"👦",pokemon:[{k:"rattata",l:3},{k:"pidgey",l:4}],reward:120},{n:"소녀 하루카",em:"👧",pokemon:[{k:"pidgey",l:3},{k:"rattata",l:3}],reward:90},{n:"소년 히로시",em:"👦",pokemon:[{k:"rattata",l:4}],reward:120},{n:"소녀 사쿠라",em:"👧",pokemon:[{k:"pidgey",l:5},{k:"rattata",l:2}],reward:150}]},
{id:"k_c2",n:"토키와시티",desc:"상록빛 영원의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote","paralyzeheal","awakening"],reqBadges:0,trainers:[]},
{id:"k_r2",n:"2번도로",desc:"토키와시티~니비시티",lv:[2,5],pokemon:[{k:"pidgey",w:20},{k:"rattata",w:15},{k:"caterpie",w:12},{k:"weedle",w:12},{k:"nidoranm",w:8},{k:"nidoranf",w:8},{k:"ledyba",w:10},{k:"spinarak",w:10},{k:"hoothoot",w:5}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:0,trainers:[{n:"소년 타쿠야",em:"👦",pokemon:[{k:"caterpie",l:3},{k:"weedle",l:4}],reward:120},{n:"소녀 아카네",em:"👧",pokemon:[{k:"pidgey",l:4},{k:"nidoranf",l:5}],reward:150},{n:"소년 코우타",em:"👦",pokemon:[{k:"rattata",l:5}],reward:150},{n:"소녀 미사키",em:"👧",pokemon:[{k:"nidoranm",l:4},{k:"pidgey",l:3}],reward:120}]},
{id:"k_r3",n:"상록숲",desc:"벌레 포켓몬이 가득한 숲",lv:[3,7],pokemon:[{k:"caterpie",w:20},{k:"metapod",w:8},{k:"weedle",w:20},{k:"kakuna",w:8},{k:"pikachu",w:5},{k:"pidgey",w:15},{k:"ledyba",w:8},{k:"spinarak",w:8},{k:"hoothoot",w:5},{k:"paras",w:3}],hasCenter:false,hasShop:false,encounterRate:0.9,reqBadges:0,trainers:[{n:"벌레잡이 하루키",em:"🧒",pokemon:[{k:"caterpie",l:3},{k:"weedle",l:3}],reward:90},{n:"벌레잡이 소우타",em:"🧒",pokemon:[{k:"weedle",l:4},{k:"kakuna",l:5}],reward:150},{n:"벌레잡이 쇼우",em:"🧒",pokemon:[{k:"caterpie",l:5},{k:"metapod",l:6}],reward:180},{n:"벌레잡이 타케루",em:"🧒",pokemon:[{k:"weedle",l:5},{k:"caterpie",l:4},{k:"metapod",l:6}],reward:180},{n:"벌레잡이 나오키",em:"🧒",pokemon:[{k:"kakuna",l:6},{k:"weedle",l:5}],reward:180},{n:"벌레잡이 렌",em:"🧒",pokemon:[{k:"caterpie",l:5},{k:"weedle",l:5},{k:"pikachu",l:7}],reward:210}]},
{id:"k_c3",n:"니비시티",desc:"돌빛 회색의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion","superpotion","antidote","paralyzeheal","awakening","cheriberry","chestoberry","pechaberry","rawstberry","aspearberry","oranberry"],reqBadges:0,trainers:[]},
{id:"k_r4",n:"3번도로",desc:"니비시티~달맞이산 입구",lv:[6,12],pokemon:[{k:"pidgey",w:20},{k:"spearow",w:25},{k:"jigglypuff",w:10},{k:"nidoranm",w:15},{k:"nidoranf",w:15},{k:"mankey",w:10},{k:"rattata",w:15}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:1,trainers:[{n:"소년 료우",em:"👦",pokemon:[{k:"spearow",l:7},{k:"nidoranm",l:8}],reward:240},{n:"소녀 나나미",em:"👧",pokemon:[{k:"jigglypuff",l:9},{k:"pidgey",l:8}],reward:270},{n:"소년 다이스케",em:"👦",pokemon:[{k:"mankey",l:10},{k:"spearow",l:9}],reward:300},{n:"소녀 유이",em:"👧",pokemon:[{k:"nidoranf",l:10},{k:"pidgey",l:8}],reward:300},{n:"소년 켄타",em:"👦",pokemon:[{k:"spearow",l:11},{k:"nidoranm",l:10}],reward:330},{n:"소녀 코토네",em:"👧",pokemon:[{k:"jigglypuff",l:12},{k:"mankey",l:11},{k:"pidgey",l:10}],reward:360}]},
{id:"k_r5",n:"달맞이산",desc:"달의 돌이 잠든 동굴",lv:[7,12],pokemon:[{k:"zubat",w:30},{k:"geodude",w:25},{k:"paras",w:15},{k:"clefairy",w:10},{k:"cleffa",w:5},{k:"teddiursa",w:10},{k:"phanpy",w:5}],hasCenter:false,hasShop:false,encounterRate:0.9,reqBadges:1,trainers:[{n:"등산가 하야토",em:"🧔",pokemon:[{k:"geodude",l:8},{k:"zubat",l:9}],reward:270},{n:"이과생 쇼고",em:"🔬",pokemon:[{k:"zubat",l:9},{k:"geodude",l:10}],reward:300},{n:"등산가 신이치",em:"🧔",pokemon:[{k:"geodude",l:10},{k:"paras",l:10}],reward:300},{n:"소년 마사루",em:"👦",pokemon:[{k:"zubat",l:10},{k:"clefairy",l:11}],reward:330},{n:"이과생 아키라",em:"🔬",pokemon:[{k:"paras",l:11},{k:"zubat",l:10}],reward:330},{n:"등산가 류지",em:"🧔",pokemon:[{k:"geodude",l:11},{k:"zubat",l:10},{k:"paras",l:12}],reward:360}]},
{id:"k_r6",n:"4번도로",desc:"달맞이산~하나다시티",lv:[8,12],pokemon:[{k:"rattata",w:18},{k:"spearow",w:22},{k:"ekans",w:14},{k:"sandshrew",w:14},{k:"mankey",w:16},{k:"oddish",w:10},{k:"bellsprout",w:10}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:1,trainers:[{n:"소년 유우키",em:"👦",pokemon:[{k:"rattata",l:8},{k:"spearow",l:9}],reward:270},{n:"소녀 린",em:"👧",pokemon:[{k:"ekans",l:10},{k:"sandshrew",l:10}],reward:300},{n:"소년 카즈마",em:"👦",pokemon:[{k:"mankey",l:11},{k:"spearow",l:10}],reward:330},{n:"소녀 아오이",em:"👧",pokemon:[{k:"rattata",l:11},{k:"ekans",l:12}],reward:360}]},
{id:"k_c4",n:"하나다시티",desc:"물빛 푸른 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","potion","superpotion","antidote","paralyzeheal","awakening","burnheal","cheriberry","chestoberry","pechaberry","rawstberry","aspearberry","oranberry"],reqBadges:1,trainers:[]},
{id:"k_r7",n:"24번도로",desc:"너겟브릿지",lv:[10,14],pokemon:[{k:"caterpie",w:12},{k:"weedle",w:12},{k:"pidgey",w:18},{k:"oddish",w:18},{k:"bellsprout",w:18},{k:"abra",w:15},{k:"venonat",w:7}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:2,trainers:[{n:"소년 시우",em:"👦",pokemon:[{k:"caterpie",l:10},{k:"weedle",l:11}],reward:330},{n:"소녀 하린",em:"👧",pokemon:[{k:"oddish",l:11},{k:"bellsprout",l:12}],reward:360},{n:"소년 소라",em:"👦",pokemon:[{k:"pidgey",l:12},{k:"abra",l:11}],reward:360},{n:"소녀 치카라",em:"👧",pokemon:[{k:"bellsprout",l:12},{k:"oddish",l:13}],reward:390},{n:"소년 유토",em:"👦",pokemon:[{k:"pidgey",l:13},{k:"abra",l:13}],reward:390},{n:"소녀 소라",em:"👧",pokemon:[{k:"oddish",l:13},{k:"bellsprout",l:14},{k:"caterpie",l:12}],reward:420}]},
{id:"k_r8",n:"25번도로",desc:"하나다시티 북쪽의 곶",lv:[10,14],pokemon:[{k:"pidgey",w:20},{k:"oddish",w:22},{k:"bellsprout",w:22},{k:"abra",w:15},{k:"venonat",w:15},{k:"caterpie",w:6}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:2,trainers:[{n:"소년 진우",em:"👦",pokemon:[{k:"oddish",l:10},{k:"venonat",l:11}],reward:330},{n:"소녀 나에",em:"👧",pokemon:[{k:"bellsprout",l:11},{k:"pidgey",l:12}],reward:360},{n:"소년 유타카",em:"👦",pokemon:[{k:"abra",l:12},{k:"oddish",l:13}],reward:390},{n:"소녀 미즈키",em:"👧",pokemon:[{k:"venonat",l:13},{k:"bellsprout",l:13}],reward:390},{n:"소년 타이요",em:"👦",pokemon:[{k:"pidgey",l:13},{k:"oddish",l:14},{k:"abra",l:12}],reward:420}]},
{id:"k_r9",n:"5번도로",desc:"하나다시티~쿠치바시티",lv:[13,16],pokemon:[{k:"pidgey",w:20},{k:"oddish",w:18},{k:"bellsprout",w:18},{k:"meowth",w:15},{k:"mankey",w:12},{k:"abra",w:10},{k:"jigglypuff",w:7}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:2,trainers:[{n:"소년 히데키",em:"👦",pokemon:[{k:"pidgey",l:13},{k:"meowth",l:14}],reward:420},{n:"소녀 레이린",em:"👧",pokemon:[{k:"oddish",l:14},{k:"bellsprout",l:14}],reward:420},{n:"소년 아키토",em:"👦",pokemon:[{k:"mankey",l:15},{k:"pidgey",l:14}],reward:450},{n:"소녀 시즈요",em:"👧",pokemon:[{k:"abra",l:15},{k:"meowth",l:15}],reward:450},{n:"소년 나오",em:"👦",pokemon:[{k:"oddish",l:15},{k:"bellsprout",l:16},{k:"mankey",l:14}],reward:480}]},
{id:"k_r10",n:"6번도로",desc:"쿠치바시티 남쪽 도로",lv:[13,16],pokemon:[{k:"pidgey",w:20},{k:"oddish",w:18},{k:"bellsprout",w:18},{k:"meowth",w:14},{k:"mankey",w:12},{k:"abra",w:8},{k:"jigglypuff",w:7},{k:"magnemite",w:5}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:2,trainers:[{n:"소년 민혁",em:"👦",pokemon:[{k:"meowth",l:13},{k:"pidgey",l:14}],reward:420},{n:"소녀 메구미",em:"👧",pokemon:[{k:"bellsprout",l:14},{k:"oddish",l:15}],reward:450},{n:"소년 하준",em:"👦",pokemon:[{k:"mankey",l:15},{k:"abra",l:14}],reward:450},{n:"소녀 유나",em:"👧",pokemon:[{k:"pidgey",l:15},{k:"meowth",l:16}],reward:480},{n:"소년 토오루",em:"👦",pokemon:[{k:"oddish",l:16},{k:"bellsprout",l:15},{k:"mankey",l:14}],reward:480}]},
{id:"k_c5",n:"쿠치바시티",desc:"석양빛 오렌지의 항구",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","potion","superpotion","antidote","paralyzeheal","awakening","burnheal","xattack","xdefense","persimberry","sitrusberry","lumberry","leppaberry"],reqBadges:2,trainers:[]},
{id:"k_r11",n:"디그다의 굴",desc:"디그다가 파놓은 긴 동굴",lv:[15,31],pokemon:[{k:"diglett",w:85},{k:"dugtrio",w:15}],hasCenter:false,hasShop:false,encounterRate:0.9,reqBadges:2,trainers:[{n:"등산가 은호",em:"🧔",pokemon:[{k:"diglett",l:15},{k:"diglett",l:17}],reward:510},{n:"소년 코우야",em:"👦",pokemon:[{k:"diglett",l:18},{k:"dugtrio",l:20}],reward:600},{n:"등산가 슈이치",em:"🧔",pokemon:[{k:"diglett",l:19},{k:"diglett",l:20},{k:"dugtrio",l:21}],reward:630},{n:"소녀 미치",em:"👧",pokemon:[{k:"dugtrio",l:22},{k:"diglett",l:18}],reward:660}]},
{id:"k_r12",n:"11번도로",desc:"쿠치바시티 동쪽 도로",lv:[13,17],pokemon:[{k:"ekans",w:25},{k:"sandshrew",w:25},{k:"spearow",w:25},{k:"drowzee",w:25}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:2,trainers:[{n:"소년 유지",em:"👦",pokemon:[{k:"ekans",l:13},{k:"spearow",l:14}],reward:420},{n:"소녀 코하루",em:"👧",pokemon:[{k:"drowzee",l:14},{k:"sandshrew",l:15}],reward:450},{n:"소년 노부유키",em:"👦",pokemon:[{k:"spearow",l:15},{k:"ekans",l:16}],reward:480},{n:"소녀 하루에",em:"👧",pokemon:[{k:"sandshrew",l:16},{k:"drowzee",l:16}],reward:480},{n:"소년 카즈호",em:"👦",pokemon:[{k:"ekans",l:16},{k:"spearow",l:17},{k:"drowzee",l:15}],reward:510}]},
{id:"k_r13",n:"9번도로",desc:"하나다시티~돌산터널 입구",lv:[15,20],pokemon:[{k:"rattata",w:16},{k:"spearow",w:20},{k:"ekans",w:16},{k:"sandshrew",w:16},{k:"nidoranm",w:16},{k:"nidoranf",w:16}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:3,trainers:[{n:"소년 마사아키",em:"👦",pokemon:[{k:"spearow",l:15},{k:"nidoranm",l:16}],reward:480},{n:"소녀 사린",em:"👧",pokemon:[{k:"nidoranf",l:16},{k:"ekans",l:17}],reward:510},{n:"등산가 히데요시",em:"🧔",pokemon:[{k:"sandshrew",l:17},{k:"rattata",l:18}],reward:540},{n:"소녀 카구라",em:"👧",pokemon:[{k:"spearow",l:18},{k:"nidoranm",l:19}],reward:570},{n:"소년 세이쿤",em:"👦",pokemon:[{k:"ekans",l:19},{k:"sandshrew",l:19},{k:"nidoranf",l:20}],reward:600},{n:"등산가 슌에이",em:"🧔",pokemon:[{k:"rattata",l:18},{k:"spearow",l:20},{k:"sandshrew",l:19}],reward:600}]},
{id:"k_r14",n:"10번도로",desc:"돌산터널~시온타운",lv:[16,22],pokemon:[{k:"spearow",w:22},{k:"voltorb",w:20},{k:"magnemite",w:20},{k:"machop",w:18},{k:"mareep",w:12},{k:"flaaffy",w:8}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:3,trainers:[{n:"소년 다이치",em:"👦",pokemon:[{k:"spearow",l:16},{k:"voltorb",l:18}],reward:540},{n:"소녀 치하루",em:"👧",pokemon:[{k:"magnemite",l:18},{k:"machop",l:19}],reward:570},{n:"이과생 노리히로",em:"🔬",pokemon:[{k:"voltorb",l:19},{k:"magnemite",l:20}],reward:600},{n:"소년 야스지",em:"👦",pokemon:[{k:"machop",l:20},{k:"spearow",l:21}],reward:630},{n:"소녀 코마치",em:"👧",pokemon:[{k:"magnemite",l:21},{k:"voltorb",l:22},{k:"spearow",l:20}],reward:660}]},
{id:"k_r15",n:"돌산터널",desc:"칠흑같이 어두운 동굴",lv:[15,22],pokemon:[{k:"zubat",w:25},{k:"geodude",w:25},{k:"machop",w:20},{k:"onix",w:12},{k:"teddiursa",w:8},{k:"slugma",w:5},{k:"phanpy",w:5}],hasCenter:false,hasShop:false,encounterRate:0.9,reqBadges:3,trainers:[{n:"등산가 석현",em:"🧔",pokemon:[{k:"geodude",l:16},{k:"zubat",l:17}],reward:510},{n:"등산가 타츠야",em:"🧔",pokemon:[{k:"machop",l:18},{k:"geodude",l:18}],reward:540},{n:"소녀 유나",em:"👧",pokemon:[{k:"zubat",l:18},{k:"machop",l:19}],reward:570},{n:"등산가 카즈히로",em:"🧔",pokemon:[{k:"onix",l:19},{k:"geodude",l:20}],reward:600},{n:"소년 쿄이치",em:"👦",pokemon:[{k:"zubat",l:20},{k:"machop",l:21}],reward:630},{n:"등산가 히데오",em:"🧔",pokemon:[{k:"geodude",l:20},{k:"onix",l:22},{k:"machop",l:21}],reward:660}]},
{id:"k_c6",n:"시온타운",desc:"영혼이 쉬는 보랏빛 마을",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","potion","superpotion","hyperpotion","antidote","paralyzeheal","awakening","burnheal","iceheal","xattack","xdefense","xspeed"],reqBadges:3,trainers:[]},
{id:"k_r16",n:"포켓몬타워",desc:"포켓몬의 영혼이 잠든 탑",lv:[13,25],pokemon:[{k:"gastly",w:50},{k:"haunter",w:30},{k:"cubone",w:20}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:3,trainers:[{n:"무녀 마사미",em:"🔮",pokemon:[{k:"gastly",l:15},{k:"gastly",l:17}],reward:510},{n:"기도사 노부오",em:"🔮",pokemon:[{k:"gastly",l:18},{k:"haunter",l:20}],reward:600},{n:"무녀 카요",em:"🔮",pokemon:[{k:"cubone",l:19},{k:"gastly",l:21}],reward:630},{n:"기도사 카쿠지",em:"🔮",pokemon:[{k:"haunter",l:22},{k:"gastly",l:20}],reward:660},{n:"무녀 레이나",em:"🔮",pokemon:[{k:"gastly",l:21},{k:"haunter",l:23},{k:"cubone",l:22}],reward:690},{n:"기도사 무네카즈",em:"🔮",pokemon:[{k:"haunter",l:24},{k:"cubone",l:25}],reward:750}]},
{id:"k_r17",n:"8번도로",desc:"시온타운~야마부키시티",lv:[18,22],pokemon:[{k:"pidgey",w:12},{k:"vulpix",w:16},{k:"growlithe",w:16},{k:"meowth",w:16},{k:"jigglypuff",w:12},{k:"abra",w:14},{k:"kadabra",w:14}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:3,trainers:[{n:"소년 마사히로",em:"👦",pokemon:[{k:"meowth",l:18},{k:"vulpix",l:19}],reward:570},{n:"소녀 세이지",em:"👧",pokemon:[{k:"jigglypuff",l:19},{k:"growlithe",l:19}],reward:570},{n:"사이킥 야스이시",em:"🧠",pokemon:[{k:"abra",l:19},{k:"kadabra",l:20}],reward:600},{n:"미녀 시즈쿠",em:"💃",pokemon:[{k:"vulpix",l:20},{k:"jigglypuff",l:21}],reward:630},{n:"소년 노리유키",em:"👦",pokemon:[{k:"growlithe",l:21},{k:"meowth",l:21}],reward:630},{n:"사이킥 현지",em:"🧠",pokemon:[{k:"kadabra",l:22},{k:"abra",l:20},{k:"pidgey",l:19}],reward:660}]},
{id:"k_r18",n:"7번도로",desc:"타마무시시티~야마부키시티",lv:[18,22],pokemon:[{k:"pidgey",w:16},{k:"vulpix",w:16},{k:"growlithe",w:16},{k:"meowth",w:18},{k:"oddish",w:16},{k:"bellsprout",w:16}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:3,trainers:[{n:"소년 유우마",em:"👦",pokemon:[{k:"meowth",l:18},{k:"pidgey",l:19}],reward:570},{n:"소녀 미라이",em:"👧",pokemon:[{k:"oddish",l:19},{k:"bellsprout",l:20}],reward:600},{n:"미녀 카즈미",em:"💃",pokemon:[{k:"vulpix",l:20},{k:"growlithe",l:21}],reward:630},{n:"소년 메이지",em:"👦",pokemon:[{k:"meowth",l:21},{k:"oddish",l:22},{k:"pidgey",l:20}],reward:660}]},
{id:"k_c7",n:"타마무시시티",desc:"무지개빛 꿈의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","ultraball","superpotion","hyperpotion","antidote","paralyzeheal","awakening","burnheal","iceheal","fullheal","revive","xattack","xdefense","xspeed","xspatk","persimberry","sitrusberry","lumberry","leppaberry"],reqBadges:3,trainers:[]},
{id:"k_c8",n:"야마부키시티",desc:"빛나는 황금의 대도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","ultraball","superpotion","hyperpotion","maxpotion","antidote","paralyzeheal","awakening","burnheal","iceheal","fullheal","revive","xattack","xdefense","xspeed","xspatk","xspdef","persimberry","sitrusberry","lumberry","leppaberry"],reqBadges:4,trainers:[]},
{id:"k_r19",n:"16번도로",desc:"타마무시시티 서쪽 도로",lv:[20,25],pokemon:[{k:"rattata",w:18},{k:"spearow",w:18},{k:"doduo",w:22},{k:"snorlax",w:3},{k:"bulbasaur",w:3},{k:"charmander",w:3},{k:"squirtle",w:3},{k:"slugma",w:10},{k:"murkrow",w:8},{k:"skarmory",w:5},{k:"gligar",w:7}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:4,trainers:[{n:"소년 유이치",em:"👦",pokemon:[{k:"rattata",l:20},{k:"spearow",l:21}],reward:630},{n:"소녀 레이카",em:"👧",pokemon:[{k:"doduo",l:22},{k:"rattata",l:21}],reward:660},{n:"소년 슌지",em:"👦",pokemon:[{k:"spearow",l:23},{k:"doduo",l:23}],reward:690},{n:"소녀 미유",em:"👧",pokemon:[{k:"rattata",l:23},{k:"spearow",l:24}],reward:720},{n:"소년 무네노부",em:"👦",pokemon:[{k:"doduo",l:24},{k:"spearow",l:25},{k:"rattata",l:22}],reward:750}]},
{id:"k_r20",n:"사이클링로드",desc:"자전거 전용 도로",lv:[20,29],pokemon:[{k:"spearow",w:15},{k:"doduo",w:18},{k:"rattata",w:15},{k:"raticate",w:15},{k:"fearow",w:12},{k:"slugma",w:8},{k:"magcargo",w:5},{k:"skarmory",w:5},{k:"gligar",w:7}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:4,trainers:[{n:"폭주족 지민",em:"🏍️",pokemon:[{k:"rattata",l:20},{k:"raticate",l:22}],reward:660},{n:"폭주족 세이이치",em:"🏍️",pokemon:[{k:"spearow",l:22},{k:"doduo",l:23}],reward:690},{n:"폭주족 유이시",em:"🏍️",pokemon:[{k:"raticate",l:24},{k:"fearow",l:24}],reward:720},{n:"폭주족 카즈아키",em:"🏍️",pokemon:[{k:"doduo",l:24},{k:"rattata",l:25}],reward:750},{n:"폭주족 켄지",em:"🏍️",pokemon:[{k:"fearow",l:25},{k:"raticate",l:26}],reward:780},{n:"폭주족 노부히코",em:"🏍️",pokemon:[{k:"spearow",l:25},{k:"doduo",l:27},{k:"rattata",l:24}],reward:810},{n:"폭주족 타츠지",em:"��️",pokemon:[{k:"raticate",l:28},{k:"fearow",l:29}],reward:870}]},
{id:"k_r21",n:"18번도로",desc:"사이클링로드~세키치쿠시티",lv:[20,29],pokemon:[{k:"spearow",w:18},{k:"doduo",w:18},{k:"fearow",w:18},{k:"raticate",w:18},{k:"slugma",w:10},{k:"skarmory",w:5},{k:"phanpy",w:8},{k:"donphan",w:5}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:4,trainers:[{n:"소년 쿄스케",em:"👦",pokemon:[{k:"spearow",l:22},{k:"doduo",l:24}],reward:720},{n:"소녀 나리",em:"👧",pokemon:[{k:"fearow",l:25},{k:"raticate",l:26}],reward:780},{n:"소년 오사무",em:"👦",pokemon:[{k:"doduo",l:27},{k:"spearow",l:27}],reward:810},{n:"소녀 하루카",em:"👧",pokemon:[{k:"raticate",l:28},{k:"fearow",l:29}],reward:870}]},
{id:"k_r22",n:"12번도로",desc:"시온타운 남쪽 긴 다리",lv:[23,27],pokemon:[{k:"pidgey",w:12},{k:"oddish",w:15},{k:"bellsprout",w:15},{k:"gloom",w:10},{k:"weepinbell",w:10},{k:"venonat",w:15},{k:"hoppip",w:10},{k:"sunkern",w:8},{k:"yanma",w:5}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:4,trainers:[{n:"낚시꾼 코우스케",em:"🎣",pokemon:[{k:"oddish",l:23},{k:"bellsprout",l:24}],reward:720},{n:"소녀 세이카",em:"��",pokemon:[{k:"venonat",l:24},{k:"pidgey",l:24}],reward:720},{n:"낚시꾼 헤이지",em:"🎣",pokemon:[{k:"gloom",l:25},{k:"bellsprout",l:25}],reward:750},{n:"소녀 쇼코",em:"👧",pokemon:[{k:"weepinbell",l:25},{k:"oddish",l:26}],reward:780},{n:"소년 노리카즈",em:"👦",pokemon:[{k:"venonat",l:26},{k:"pidgey",l:26}],reward:780},{n:"낚시꾼 코우세키",em:"🎣",pokemon:[{k:"gloom",l:27},{k:"weepinbell",l:27},{k:"oddish",l:25}],reward:810}]},
{id:"k_r23",n:"13번도로",desc:"울타리 미로의 도로",lv:[24,28],pokemon:[{k:"pidgey",w:10},{k:"oddish",w:15},{k:"bellsprout",w:15},{k:"gloom",w:15},{k:"weepinbell",w:15},{k:"venonat",w:15},{k:"ditto",w:15},{k:"jolteon",w:2},{k:"porygon",w:2}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:4,trainers:[{n:"소년 세이치로",em:"👦",pokemon:[{k:"oddish",l:24},{k:"bellsprout",l:25}],reward:750},{n:"미녀 유키",em:"💃",pokemon:[{k:"gloom",l:25},{k:"venonat",l:26}],reward:780},{n:"소년 마사이시",em:"👦",pokemon:[{k:"weepinbell",l:26},{k:"pidgey",l:25}],reward:780},{n:"소녀 미노리",em:"👧",pokemon:[{k:"bellsprout",l:26},{k:"gloom",l:27}],reward:810},{n:"미녀 코유키",em:"💃",pokemon:[{k:"venonat",l:27},{k:"oddish",l:27}],reward:810},{n:"소년 마사루",em:"👦",pokemon:[{k:"weepinbell",l:28},{k:"gloom",l:27},{k:"ditto",l:26}],reward:840}]},
{id:"k_r24",n:"14번도로",desc:"세키치쿠시티로 이어지는 도로",lv:[24,28],pokemon:[{k:"pidgey",w:10},{k:"oddish",w:15},{k:"bellsprout",w:15},{k:"gloom",w:15},{k:"weepinbell",w:15},{k:"venonat",w:15},{k:"ditto",w:15}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:4,trainers:[{n:"소년 무네이시",em:"👦",pokemon:[{k:"oddish",l:24},{k:"venonat",l:25}],reward:750},{n:"소녀 치에",em:"👧",pokemon:[{k:"bellsprout",l:25},{k:"gloom",l:26}],reward:780},{n:"소년 세이지",em:"👦",pokemon:[{k:"weepinbell",l:26},{k:"ditto",l:27}],reward:810},{n:"미녀 사에코",em:"💃",pokemon:[{k:"gloom",l:27},{k:"venonat",l:28}],reward:840},{n:"소녀 카나미",em:"👧",pokemon:[{k:"oddish",l:26},{k:"bellsprout",l:28},{k:"pidgey",l:25}],reward:840}]},
{id:"k_r25",n:"15번도로",desc:"세키치쿠시티 북쪽 도로",lv:[24,28],pokemon:[{k:"pidgey",w:15},{k:"oddish",w:20},{k:"bellsprout",w:20},{k:"gloom",w:12},{k:"weepinbell",w:13},{k:"venonat",w:20},{k:"goldeen",w:8},{k:"vaporeon",w:2}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:4,trainers:[{n:"소년 메이지",em:"👦",pokemon:[{k:"oddish",l:24},{k:"pidgey",l:25}],reward:750},{n:"소녀 시즈에",em:"👧",pokemon:[{k:"bellsprout",l:25},{k:"venonat",l:26}],reward:780},{n:"미녀 미사",em:"💃",pokemon:[{k:"gloom",l:26},{k:"weepinbell",l:27}],reward:810},{n:"소년 코지",em:"👦",pokemon:[{k:"venonat",l:27},{k:"oddish",l:28}],reward:840},{n:"소녀 쿄코",em:"👧",pokemon:[{k:"bellsprout",l:27},{k:"gloom",l:28},{k:"pidgey",l:26}],reward:840}]},
{id:"k_c9",n:"세키치쿠시티",desc:"자연과 함께하는 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","ultraball","superpotion","hyperpotion","maxpotion","fullheal","fullrestore","revive","xattack","xdefense","xspeed","xspatk","xspdef","direhit"],reqBadges:4,trainers:[]},
{id:"k_r26",n:"사파리존",desc:"희귀 포켓몬의 보호구역",lv:[22,31],pokemon:[{k:"nidoranm",w:6},{k:"nidoranf",w:6},{k:"nidorino",w:6},{k:"nidorina",w:6},{k:"rhyhorn",w:8},{k:"chansey",w:4},{k:"scyther",w:7},{k:"pinsir",w:7},{k:"tauros",w:8},{k:"kangaskhan",w:5},{k:"exeggcute",w:12},{k:"larvitar",w:5},{k:"misdreavus",w:5},{k:"teddiursa",w:7},{k:"miltank",w:4},{k:"stantler",w:4}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:5,trainers:[{n:"레인저 진석",em:"🌿",pokemon:[{k:"nidorino",l:22},{k:"rhyhorn",l:24}],reward:720},{n:"레인저 토모야",em:"🌿",pokemon:[{k:"exeggcute",l:24},{k:"kangaskhan",l:26}],reward:780},{n:"레인저 카즈토",em:"🌿",pokemon:[{k:"scyther",l:26},{k:"pinsir",l:27}],reward:810},{n:"레인저 아츠시",em:"🌿",pokemon:[{k:"tauros",l:27},{k:"nidorina",l:28},{k:"rhyhorn",l:25}],reward:840}]},
{id:"k_r27",n:"발전소",desc:"버려진 발전소",lv:[21,40],pokemon:[{k:"voltorb",w:20},{k:"electrode",w:8},{k:"pikachu",w:12},{k:"magnemite",w:20},{k:"magneton",w:8},{k:"electabuzz",w:12},{k:"mareep",w:8},{k:"flaaffy",w:5},{k:"ampharos",w:3},{k:"elekid",w:4}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:5,trainers:[{n:"과학자 쿄스케",em:"👨‍🔬",pokemon:[{k:"voltorb",l:22},{k:"magnemite",l:24}],reward:720},{n:"과학자 고이치",em:"👨‍🔬",pokemon:[{k:"magnemite",l:25},{k:"electrode",l:28}],reward:840},{n:"과학자 모토키",em:"👨‍🔬",pokemon:[{k:"pikachu",l:28},{k:"voltorb",l:30}],reward:900},{n:"과학자 정미",em:"👨‍🔬",pokemon:[{k:"magneton",l:32},{k:"electabuzz",l:33}],reward:990},{n:"과학자 은경",em:"👨‍🔬",pokemon:[{k:"electrode",l:33},{k:"magneton",l:35},{k:"electabuzz",l:34}],reward:1050}]},
{id:"k_r28",n:"19번수로",desc:"세키치쿠시티 남쪽 바다",lv:[27,31],pokemon:[{k:"tentacool",w:50},{k:"tentacruel",w:25},{k:"magikarp",w:15},{k:"staryu",w:10}],hasCenter:false,hasShop:false,encounterRate:0.8,reqBadges:5,trainers:[{n:"수영선수 카즈미치",em:"🏊",pokemon:[{k:"tentacool",l:27},{k:"tentacool",l:28}],reward:840},{n:"수영선수 카쿠스이",em:"🏊",pokemon:[{k:"tentacool",l:28},{k:"tentacruel",l:29}],reward:870},{n:"수영선수 미츠루",em:"🏊",pokemon:[{k:"tentacool",l:29},{k:"tentacruel",l:30}],reward:900},{n:"수영선수 무네토시",em:"🏊",pokemon:[{k:"tentacruel",l:30},{k:"tentacool",l:30}],reward:900},{n:"수영선수 나츠키",em:"🏊",pokemon:[{k:"tentacruel",l:31},{k:"tentacool",l:29},{k:"tentacool",l:28}],reward:930}]},
{id:"k_r29",n:"20번수로",desc:"쌍둥이섬 근처 바다",lv:[27,33],pokemon:[{k:"tentacool",w:45},{k:"tentacruel",w:30},{k:"magikarp",w:10},{k:"staryu",w:8},{k:"chinchou",w:7}],hasCenter:false,hasShop:false,encounterRate:0.8,reqBadges:5,trainers:[{n:"수영선수 쇼토",em:"🏊",pokemon:[{k:"tentacool",l:28},{k:"tentacruel",l:30}],reward:900},{n:"수영선수 메구미",em:"🏊",pokemon:[{k:"tentacruel",l:30},{k:"tentacool",l:29}],reward:900},{n:"수영선수 신고",em:"🏊",pokemon:[{k:"tentacool",l:30},{k:"tentacruel",l:31}],reward:930},{n:"수영선수 유지",em:"🏊",pokemon:[{k:"tentacruel",l:32},{k:"tentacool",l:31}],reward:960},{n:"수영선수 치카즈",em:"🏊",pokemon:[{k:"tentacruel",l:33},{k:"tentacool",l:30},{k:"tentacruel",l:31}],reward:990}]},
{id:"k_r30",n:"쌍둥이섬",desc:"전설의 포켓몬이 잠든 얼음 동굴",lv:[26,36],pokemon:[{k:"zubat",w:15},{k:"golbat",w:10},{k:"psyduck",w:15},{k:"golduck",w:8},{k:"slowpoke",w:15},{k:"slowbro",w:7},{k:"seel",w:12},{k:"dewgong",w:5},{k:"shellder",w:13},{k:"lapras",w:3},{k:"omanyte",w:3},{k:"kabuto",w:3}],hasCenter:false,hasShop:false,encounterRate:0.9,reqBadges:5,trainers:[{n:"등산가 쇼야",em:"🧔",pokemon:[{k:"seel",l:28},{k:"zubat",l:29}],reward:870},{n:"수영선수 사린",em:"🏊",pokemon:[{k:"psyduck",l:29},{k:"slowpoke",l:30}],reward:900},{n:"등산가 타이호",em:"🧔",pokemon:[{k:"golbat",l:30},{k:"shellder",l:31}],reward:930},{n:"수영선수 엔코",em:"🏊",pokemon:[{k:"slowbro",l:32},{k:"dewgong",l:33}],reward:990},{n:"등산가 병호",em:"🧔",pokemon:[{k:"golduck",l:33},{k:"golbat",l:34}],reward:1020},{n:"수영선수 마사코",em:"🏊",pokemon:[{k:"seel",l:33},{k:"dewgong",l:36},{k:"psyduck",l:31}],reward:1080}]},
{id:"k_c10",n:"구레네섬",desc:"불꽃타는 연구의 섬",isCity:true,hasCenter:true,hasShop:true,shopItems:["superball","ultraball","hyperpotion","maxpotion","fullheal","fullrestore","revive","xattack","xdefense","xspeed","xspatk","xspdef","xaccuracy","direhit","liechiberry","ganlonberry","salacberry","petayaberry","apicotberry"],reqBadges:6,trainers:[]},
{id:"k_r31",n:"포켓몬저택",desc:"버려진 연구소",lv:[28,42],pokemon:[{k:"growlithe",w:15},{k:"ponyta",w:15},{k:"grimer",w:12},{k:"muk",w:8},{k:"koffing",w:15},{k:"weezing",w:8},{k:"vulpix",w:15},{k:"ditto",w:12}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:6,trainers:[{n:"도둑 쇼지",em:"🥷",pokemon:[{k:"koffing",l:28},{k:"grimer",l:30}],reward:900},{n:"과학자 민호",em:"👨‍🔬",pokemon:[{k:"growlithe",l:30},{k:"ponyta",l:31}],reward:930},{n:"도둑 철민",em:"🥷",pokemon:[{k:"grimer",l:32},{k:"koffing",l:33}],reward:990},{n:"과학자 마사쿤",em:"👨‍🔬",pokemon:[{k:"vulpix",l:33},{k:"ponyta",l:35}],reward:1050},{n:"도둑 유타",em:"🥷",pokemon:[{k:"muk",l:35},{k:"weezing",l:36}],reward:1080},{n:"과학자 쇼키",em:"👨‍🔬",pokemon:[{k:"growlithe",l:36},{k:"ditto",l:38}],reward:1140},{n:"도둑 시게루",em:"🥷",pokemon:[{k:"weezing",l:38},{k:"muk",l:40},{k:"koffing",l:36}],reward:1200}]},
{id:"k_r32",n:"21번수로",desc:"구레네섬~마사라타운",lv:[21,30],pokemon:[{k:"rattata",w:15},{k:"pidgey",w:20},{k:"pidgeotto",w:20},{k:"tangela",w:20},{k:"tentacool",w:25}],hasCenter:false,hasShop:false,encounterRate:0.8,reqBadges:6,trainers:[{n:"수영선수 영식",em:"🏊",pokemon:[{k:"tentacool",l:22},{k:"pidgeotto",l:24}],reward:720},{n:"낚시꾼 만지",em:"🎣",pokemon:[{k:"tangela",l:25},{k:"tentacool",l:27}],reward:810},{n:"수영선수 현정",em:"🏊",pokemon:[{k:"pidgeotto",l:27},{k:"tentacool",l:28}],reward:840},{n:"낚시꾼 무네히로",em:"🎣",pokemon:[{k:"tangela",l:28},{k:"pidgeotto",l:30},{k:"rattata",l:25}],reward:900}]},
{id:"k_r33",n:"22번도로",desc:"토키와시티~세키에이고원 입구",lv:[28,33],pokemon:[{k:"rattata",w:8},{k:"spearow",w:12},{k:"nidoranm",w:12},{k:"nidoranf",w:12},{k:"nidorino",w:10},{k:"nidorina",w:10},{k:"mankey",w:15},{k:"flareon",w:2},{k:"ponyta",w:8},{k:"poliwag",w:6},{k:"gligar",w:5}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:7,trainers:[{n:"소년 무네노리",em:"👦",pokemon:[{k:"nidorino",l:28},{k:"mankey",l:29}],reward:870},{n:"소녀 슈카",em:"👧",pokemon:[{k:"nidorina",l:29},{k:"spearow",l:30}],reward:900},{n:"소년 아키카즈",em:"👦",pokemon:[{k:"mankey",l:31},{k:"nidorino",l:31}],reward:930},{n:"소녀 카즈미",em:"👧",pokemon:[{k:"nidorina",l:32},{k:"rattata",l:30}],reward:960},{n:"소년 야스히데",em:"👦",pokemon:[{k:"mankey",l:32},{k:"nidorino",l:33},{k:"spearow",l:31}],reward:990}]},
{id:"k_r34",n:"23번도로",desc:"뱃지 확인 게이트 도로",lv:[30,43],pokemon:[{k:"spearow",w:8},{k:"fearow",w:8},{k:"ekans",w:8},{k:"arbok",w:6},{k:"sandshrew",w:8},{k:"sandslash",w:6},{k:"nidoranm",w:8},{k:"nidoranf",w:8},{k:"ditto",w:18},{k:"larvitar",w:5},{k:"pupitar",w:3},{k:"sneasel",w:7},{k:"houndour",w:7}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:7,trainers:[{n:"정예 트레이너 타이세이",em:"⭐",pokemon:[{k:"fearow",l:30},{k:"sandslash",l:32}],reward:960},{n:"정예 트레이너 미소라",em:"⭐",pokemon:[{k:"arbok",l:33},{k:"nidorino",l:34}],reward:1020},{n:"정예 트레이너 슌스케",em:"⭐",pokemon:[{k:"sandslash",l:35},{k:"fearow",l:36}],reward:1080},{n:"정예 트레이너 하율",em:"⭐",pokemon:[{k:"arbok",l:36},{k:"nidorina",l:37}],reward:1110},{n:"정예 트레이너 시아키",em:"⭐",pokemon:[{k:"fearow",l:38},{k:"sandslash",l:39}],reward:1170},{n:"정예 트레이너 윤하",em:"⭐",pokemon:[{k:"arbok",l:39},{k:"nidoqueen",l:40},{k:"fearow",l:38}],reward:1200}]},
{id:"k_r35",n:"챔피언로드",desc:"챔피언에게 이르는 최후의 길",lv:[34,46],pokemon:[{k:"zubat",w:8},{k:"golbat",w:12},{k:"onix",w:8},{k:"geodude",w:12},{k:"graveler",w:12},{k:"machop",w:8},{k:"machoke",w:12},{k:"marowak",w:8},{k:"hitmonlee",w:3},{k:"hitmonchan",w:3},{k:"ursaring",w:5},{k:"donphan",w:5},{k:"steelix",w:4}],hasCenter:false,hasShop:false,encounterRate:0.75,reqBadges:8,trainers:[{n:"격투왕 켄이치",em:"🥋",pokemon:[{k:"machoke",l:34},{k:"machop",l:35}],reward:1050},{n:"정예 트레이너 사토시",em:"⭐",pokemon:[{k:"golbat",l:36},{k:"graveler",l:37}],reward:1110},{n:"등산가 다이키",em:"🧔",pokemon:[{k:"onix",l:37},{k:"geodude",l:36},{k:"graveler",l:38}],reward:1140},{n:"격투왕 료우타",em:"🥋",pokemon:[{k:"machoke",l:38},{k:"marowak",l:39}],reward:1170},{n:"정예 트레이너 긴세이",em:"⭐",pokemon:[{k:"golbat",l:40},{k:"onix",l:40}],reward:1200},{n:"격투왕 타이가",em:"🥋",pokemon:[{k:"machoke",l:41},{k:"machoke",l:42}],reward:1260},{n:"정예 트레이너 호노카",em:"⭐",pokemon:[{k:"graveler",l:43},{k:"golbat",l:44},{k:"marowak",l:42}],reward:1320},{n:"정예 트레이너 히카루",em:"⭐",pokemon:[{k:"machoke",l:44},{k:"graveler",l:45},{k:"golbat",l:46}],reward:1380}]},
{id:"k_c11",n:"세키에이고원",desc:"포켓몬 리그 본부",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","hyperpotion","maxpotion","fullrestore","fullheal","revive","xattack","xdefense","xspeed","xspatk","xspdef","xaccuracy","direhit","guardspec"],reqBadges:8,trainers:[]},
{id:"k_r36",n:"미지의동굴",desc:"최강의 포켓몬이 숨어있는 동굴",lv:[39,67],pokemon:[{k:"golbat",w:10},{k:"hypno",w:10},{k:"magneton",w:8},{k:"electrode",w:8},{k:"parasect",w:8},{k:"rhydon",w:8},{k:"chansey",w:4},{k:"ditto",w:10},{k:"wigglytuff",w:5},{k:"kadabra",w:10},{k:"dratini",w:5},{k:"larvitar",w:5},{k:"pupitar",w:3},{k:"misdreavus",w:6}],hasCenter:false,hasShop:false,encounterRate:0.75,reqBadges:8,trainers:[{n:"정예 트레이너 센고",em:"⭐",pokemon:[{k:"golbat",l:40},{k:"hypno",l:42}],reward:1260},{n:"연구원 카즈에",em:"🔬",pokemon:[{k:"magneton",l:44},{k:"electrode",l:45}],reward:1350},{n:"정예 트레이너 나레",em:"⭐",pokemon:[{k:"rhydon",l:48},{k:"parasect",l:46}],reward:1440},{n:"연구원 타카시",em:"🔬",pokemon:[{k:"kadabra",l:50},{k:"hypno",l:52}],reward:1560},{n:"정예 트레이너 하늘",em:"⭐",pokemon:[{k:"rhydon",l:55},{k:"chansey",l:53},{k:"golbat",l:50}],reward:1650},{n:"정예 트레이너 호시야",em:"⭐",pokemon:[{k:"magneton",l:56},{k:"electrode",l:58},{k:"rhydon",l:60}],reward:1800}]}
]},
johto: {
    n: "성도지방", em: "🏯",
    roads: [
{id:"j_c1",n:"와카바타운",desc:"새로운 시작의 바람이 부는 마을",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote"],reqBadges:0,trainers:[]},
{id:"j_r1",n:"29번도로",desc:"와카바타운~요시노시티",lv:[2,5],pokemon:[
  {k:"pidgey",w:30},
  {k:"sentret",w:25},
  {k:"hoothoot",w:20},
  {k:"rattata",w:15},
  {k:"hoppip",w:10}
],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:0,trainers:[
  {n:"소년 사토시",em:"👦",pokemon:[
    {k:"sentret",l:3},
    {k:"pidgey",l:4}
  ],reward:120},
  {n:"소녀 하루카",em:"��",pokemon:[
    {k:"pidgey",l:3},
    {k:"hoppip",l:4}
  ],reward:120},
  {n:"소년 슌스케",em:"👦",pokemon:[
    {k:"rattata",l:4},
    {k:"sentret",l:4}
  ],reward:120},
  {n:"소녀 사쿠라",em:"👧",pokemon:[
    {k:"hoothoot",l:5}
  ],reward:150},
  {n:"소년 타이호",em:"👦",pokemon:[
    {k:"pidgey",l:3},
    {k:"rattata",l:4},
    {k:"sentret",l:5}
  ],reward:150}
]},
{id:"j_c2",n:"요시노시티",desc:"향기로운 꽃이 피는 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote"],reqBadges:0,trainers:[]},
{id:"j_r2",n:"30번도로",desc:"요시노시티~키쿄우시티 북쪽 길",lv:[3,6],pokemon:[
  {k:"pidgey",w:20},
  {k:"caterpie",w:15},
  {k:"weedle",w:15},
  {k:"metapod",w:10},
  {k:"kakuna",w:10},
  {k:"ledyba",w:12},
  {k:"spinarak",w:10},
  {k:"poliwag",w:8}
],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:0,trainers:[
  {n:"벌레잡이 료우",em:"🧒",pokemon:[
    {k:"caterpie",l:4},
    {k:"weedle",l:4},
    {k:"ledyba",l:5}
  ],reward:150},
  {n:"소년 히데키",em:"👦",pokemon:[
    {k:"pidgey",l:5},
    {k:"poliwag",l:5}
  ],reward:150},
  {n:"소녀 미즈키",em:"👧",pokemon:[
    {k:"spinarak",l:5},
    {k:"caterpie",l:5}
  ],reward:150},
  {n:"벌레잡이 코우야",em:"🧒",pokemon:[
    {k:"weedle",l:4},
    {k:"kakuna",l:5},
    {k:"metapod",l:5}
  ],reward:150},
  {n:"소년 나오키",em:"👦",pokemon:[
    {k:"pidgey",l:4},
    {k:"ledyba",l:6}
  ],reward:180}
]},
{id:"j_r3",n:"31번도로",desc:"키쿄우시티로 향하는 길",lv:[4,7],pokemon:[
  {k:"pidgey",w:20},
  {k:"caterpie",w:15},
  {k:"weedle",w:15},
  {k:"bellsprout",w:18},
  {k:"spinarak",w:12},
  {k:"ledyba",w:12},
  {k:"poliwag",w:8}
],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:0,trainers:[
  {n:"벌레잡이 아키토",em:"🧒",pokemon:[
    {k:"caterpie",l:5},
    {k:"spinarak",l:6},
    {k:"weedle",l:6}
  ],reward:180},
  {n:"소년 토오루",em:"👦",pokemon:[
    {k:"bellsprout",l:6},
    {k:"pidgey",l:6}
  ],reward:180},
  {n:"소녀 나나미",em:"👧",pokemon:[
    {k:"ledyba",l:6},
    {k:"poliwag",l:7}
  ],reward:210},
  {n:"벌레잡이 나오",em:"🧒",pokemon:[
    {k:"weedle",l:5},
    {k:"caterpie",l:5},
    {k:"spinarak",l:7}
  ],reward:210},
  {n:"소년 쇼고",em:"👦",pokemon:[
    {k:"pidgey",l:6},
    {k:"bellsprout",l:7}
  ],reward:210}
]},
{id:"j_c3",n:"키쿄우시티",desc:"오래된 탑이 있는 역사의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","potion","superpotion","antidote","paralyzeheal","awakening"],reqBadges:0,trainers:[]},
{id:"j_r4",n:"모다피의 탑",desc:"모다피 수행자들이 수련하는 탑",lv:[3,6],pokemon:[
  {k:"rattata",w:25},
  {k:"gastly",w:35},
  {k:"bellsprout",w:40}
],hasCenter:false,hasShop:false,encounterRate:0.9,reqBadges:0,trainers:[
  {n:"인술사 신고",em:"👴",pokemon:[
    {k:"bellsprout",l:3},
    {k:"bellsprout",l:4},
    {k:"bellsprout",l:5}
  ],reward:150},
  {n:"인술사 하루키",em:"👴",pokemon:[
    {k:"bellsprout",l:5},
    {k:"bellsprout",l:6}
  ],reward:180},
  {n:"인술사 타이치",em:"👴",pokemon:[
    {k:"bellsprout",l:4},
    {k:"bellsprout",l:5},
    {k:"bellsprout",l:6}
  ],reward:180},
  {n:"인술사 메이호",em:"👴",pokemon:[
    {k:"bellsprout",l:6},
    {k:"bellsprout",l:6},
    {k:"bellsprout",l:6}
  ],reward:180}
]},
{id:"j_r_ruins",n:"알프의유적",desc:"고대의 수수께끼가 잠든 유적",lv:[5,25],pokemon:[
  {k:"unown",w:60},
  {k:"natu",w:15},
  {k:"smeargle",w:10},
  {k:"wobbuffet",w:10},
  {k:"qwilfish",w:5}
],hasCenter:false,hasShop:false,encounterRate:0.9,reqBadges:0,trainers:[
  {n:"연구원 카즈키",em:"🔬",pokemon:[
    {k:"unown",l:8},
    {k:"natu",l:9}
  ],reward:270},
  {n:"사이킥 미유키",em:"🔮",pokemon:[
    {k:"natu",l:9},
    {k:"wobbuffet",l:10}
  ],reward:300},
  {n:"연구원 마사노리",em:"🔬",pokemon:[
    {k:"unown",l:10},
    {k:"unown",l:10},
    {k:"smeargle",l:11}
  ],reward:330},
  {n:"사이킥 사유리",em:"🔮",pokemon:[
    {k:"natu",l:10},
    {k:"unown",l:11},
    {k:"wobbuffet",l:12}
  ],reward:360}
]},
{id:"j_r5",n:"32번도로",desc:"히와다타운로 향하는 긴 도로",lv:[7,12],pokemon:[
  {k:"ekans",w:12},
  {k:"bellsprout",w:18},
  {k:"mareep",w:20},
  {k:"hoppip",w:15},
  {k:"wooper",w:15},
  {k:"tentacool",w:10},
  {k:"zubat",w:10}
,{k:"pichu",w:5},{k:"togepi",w:3},{k:"igglybuff",w:5}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:1,trainers:[
  {n:"소년 에이지",em:"👦",pokemon:[
    {k:"ekans",l:8},
    {k:"bellsprout",l:9}
  ],reward:270},
  {n:"낚시꾼 아츠시",em:"🎣",pokemon:[
    {k:"tentacool",l:9},
    {k:"wooper",l:10}
  ],reward:300},
  {n:"소녀 유이",em:"👧",pokemon:[
    {k:"mareep",l:9},
    {k:"hoppip",l:10}
  ],reward:300},
  {n:"새잡이 성훈",em:"🐦",pokemon:[
    {k:"pidgey",l:9},
    {k:"hoppip",l:10},
    {k:"bellsprout",l:10}
  ],reward:300},
  {n:"낚시꾼 신지",em:"🎣",pokemon:[
    {k:"tentacool",l:8},
    {k:"wooper",l:9},
    {k:"tentacool",l:10}
  ],reward:300},
  {n:"캠핑소년 유타",em:"⛺",pokemon:[
    {k:"ekans",l:10},
    {k:"mareep",l:11}
  ],reward:330}
]},
{id:"j_r_33",n:"33번도로",desc:"연결동굴~히와다타운",lv:[4,8],pokemon:[
  {k:"hoppip",w:30},
  {k:"rattata",w:30},
  {k:"zubat",w:20},
  {k:"ekans",w:20}
],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:0,trainers:[
  {n:"소년 타쿠야",em:"👦",pokemon:[
    {k:"rattata",l:6},
    {k:"hoppip",l:7}
  ],reward:210},
  {n:"벌레잡이 코이치",em:"🧒",pokemon:[
    {k:"ekans",l:7},
    {k:"zubat",l:7}
  ],reward:210},
  {n:"소녀 미사키",em:"👧",pokemon:[
    {k:"hoppip",l:7},
    {k:"rattata",l:8}
  ],reward:240},
  {n:"소년 유우키",em:"👦",pokemon:[
    {k:"zubat",l:8},
    {k:"ekans",l:9}
  ],reward:270}
]},
{id:"j_r6",n:"연결동굴",desc:"32번도로와 히와다타운을 잇는 동굴",lv:[6,12],pokemon:[
  {k:"zubat",w:25},
  {k:"geodude",w:25},
  {k:"onix",w:10},
  {k:"sandshrew",w:15},
  {k:"rattata",w:15},
  {k:"wooper",w:10}
,{k:"sunkern",w:10},{k:"elekid",w:3}],hasCenter:false,hasShop:false,encounterRate:0.9,reqBadges:1,trainers:[
  {n:"등산가 타이호",em:"🧗",pokemon:[
    {k:"geodude",l:9},
    {k:"geodude",l:10},
    {k:"sandshrew",l:10}
  ],reward:300},
  {n:"등산가 카즈미",em:"🧗",pokemon:[
    {k:"onix",l:11},
    {k:"geodude",l:10}
  ],reward:330},
  {n:"소년 쇼이치",em:"👦",pokemon:[
    {k:"rattata",l:9},
    {k:"zubat",l:10},
    {k:"wooper",l:10}
  ],reward:300},
  {n:"등산가 켄지",em:"🧗",pokemon:[
    {k:"geodude",l:10},
    {k:"sandshrew",l:11},
    {k:"geodude",l:11}
  ],reward:330},
  {n:"소녀 미소라",em:"👧",pokemon:[
    {k:"zubat",l:10},
    {k:"wooper",l:11}
  ],reward:330}
]},
{id:"j_c4",n:"히와다타운",desc:"숯가마와 함께 살아가는 마을",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","potion","superpotion","antidote","paralyzeheal","awakening"],reqBadges:1,trainers:[]},
{id:"j_r7",n:"야돈의우물",desc:"야돈들이 사는 깊은 우물",lv:[5,10],pokemon:[
  {k:"zubat",w:40},
  {k:"slowpoke",w:60}
,{k:"cleffa",w:5}],hasCenter:false,hasShop:false,encounterRate:0.9,reqBadges:1,trainers:[
  {n:"로켓단 조무래기",em:"🦹",pokemon:[
    {k:"rattata",l:7},
    {k:"zubat",l:8}
  ],reward:240},
  {n:"로켓단 조무래기",em:"🦹",pokemon:[
    {k:"zubat",l:8},
    {k:"ekans",l:9}
  ],reward:270},
  {n:"로켓단 조무래기",em:"🦹",pokemon:[
    {k:"rattata",l:8},
    {k:"zubat",l:9},
    {k:"koffing",l:9}
  ],reward:270},
  {n:"로켓단 간부",em:"🦹",pokemon:[
    {k:"koffing",l:10},
    {k:"zubat",l:10}
  ],reward:300}
]},
{id:"j_r8",n:"너도밤나무숲",desc:"울창한 나무가 빽빽한 숲",lv:[6,8],pokemon:[
  {k:"caterpie",w:15},
  {k:"metapod",w:12},
  {k:"weedle",w:15},
  {k:"kakuna",w:12},
  {k:"paras",w:16},
  {k:"oddish",w:18},
  {k:"zubat",w:12}
,{k:"bellossom",w:3},{k:"aipom",w:8}],hasCenter:false,hasShop:false,encounterRate:0.9,reqBadges:2,trainers:[
  {n:"벌레잡이 철민",em:"🧒",pokemon:[
    {k:"caterpie",l:7},
    {k:"weedle",l:7},
    {k:"paras",l:8}
  ],reward:240},
  {n:"벌레잡이 메구미",em:"🧒",pokemon:[
    {k:"metapod",l:7},
    {k:"kakuna",l:7},
    {k:"caterpie",l:8}
  ],reward:240},
  {n:"소년 소라",em:"👦",pokemon:[
    {k:"oddish",l:7},
    {k:"zubat",l:8}
  ],reward:240},
  {n:"벌레잡이 카이토",em:"🧒",pokemon:[
    {k:"paras",l:8},
    {k:"weedle",l:7},
    {k:"oddish",l:8}
  ],reward:240}
]},
{id:"j_r9",n:"34번도로",desc:"코가네시티 남쪽의 넓은 도로",lv:[10,14],pokemon:[
  {k:"rattata",w:20},
  {k:"pidgey",w:20},
  {k:"abra",w:15},
  {k:"drowzee",w:20},
  {k:"ditto",w:25}
],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:2,trainers:[
  {n:"소년 신고",em:"👦",pokemon:[
    {k:"rattata",l:11},
    {k:"pidgey",l:12}
  ],reward:360},
  {n:"아가씨 카즈노리",em:"👩",pokemon:[
    {k:"drowzee",l:12},
    {k:"abra",l:12}
  ],reward:360},
  {n:"소녀 시유",em:"👧",pokemon:[
    {k:"pidgey",l:12},
    {k:"rattata",l:13}
  ],reward:390},
  {n:"캠핑소년 다이치",em:"⛺",pokemon:[
    {k:"drowzee",l:12},
    {k:"rattata",l:13},
    {k:"pidgey",l:13}
  ],reward:390},
  {n:"짧은치마 나에",em:"🌸",pokemon:[
    {k:"abra",l:13},
    {k:"ditto",l:14}
  ],reward:420},
  {n:"소년 민호",em:"👦",pokemon:[
    {k:"drowzee",l:13},
    {k:"pidgey",l:14}
  ],reward:420}
]},
{id:"j_c5",n:"코가네시티",desc:"화려하게 빛나는 즐거움의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","potion","superpotion","antidote","paralyzeheal","awakening","burnheal"],reqBadges:2,trainers:[]},
{id:"j_r10",n:"35번도로",desc:"코가네시티 북쪽 도로",lv:[12,16],pokemon:[
  {k:"nidoranm",w:15},
  {k:"nidoranf",w:15},
  {k:"pidgey",w:20},
  {k:"drowzee",w:18},
  {k:"yanma",w:10},
  {k:"ditto",w:12},
  {k:"abra",w:10}
,{k:"natu",w:10},{k:"unown",w:8}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:3,trainers:[
  {n:"소년 세이치로",em:"👦",pokemon:[
    {k:"nidoranm",l:13},
    {k:"pidgey",l:14}
  ],reward:420},
  {n:"소녀 유나",em:"👧",pokemon:[
    {k:"nidoranf",l:13},
    {k:"drowzee",l:14}
  ],reward:420},
  {n:"사이킥 야스지",em:"🔮",pokemon:[
    {k:"abra",l:14},
    {k:"drowzee",l:15}
  ],reward:450},
  {n:"짧은치마 카구라",em:"🌸",pokemon:[
    {k:"yanma",l:14},
    {k:"nidoranf",l:15}
  ],reward:450},
  {n:"캠핑소년 한별",em:"⛺",pokemon:[
    {k:"nidoranm",l:14},
    {k:"pidgey",l:15},
    {k:"drowzee",l:15}
  ],reward:450},
  {n:"소녀 하루에",em:"👧",pokemon:[
    {k:"ditto",l:15},
    {k:"pidgey",l:16}
  ],reward:480}
]},
{id:"j_r_park",n:"자연공원",desc:"벌레잡기 대회가 열리는 공원",lv:[12,15],pokemon:[
  {k:"caterpie",w:15},
  {k:"weedle",w:15},
  {k:"paras",w:10},
  {k:"venonat",w:10},
  {k:"scyther",w:5},
  {k:"pinsir",w:5},
  {k:"sunkern",w:20},
  {k:"ledyba",w:10},
  {k:"spinarak",w:10}
],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:2,trainers:[
  {n:"벌레잡이 타이세이",em:"🧒",pokemon:[
    {k:"caterpie",l:12},
    {k:"weedle",l:12},
    {k:"paras",l:13}
  ],reward:390},
  {n:"벌레잡이 켄타",em:"🧒",pokemon:[
    {k:"venonat",l:13},
    {k:"ledyba",l:13}
  ],reward:390},
  {n:"벌레잡이 사쿠라",em:"🧒",pokemon:[
    {k:"spinarak",l:13},
    {k:"caterpie",l:14}
  ],reward:420},
  {n:"벌레잡이 유우지",em:"🧒",pokemon:[
    {k:"scyther",l:14}
  ],reward:420},
  {n:"벌레잡이 마사키",em:"🧒",pokemon:[
    {k:"pinsir",l:14},
    {k:"sunkern",l:15}
  ],reward:450}
]},
{id:"j_r11",n:"36번도로",desc:"엔주시티로 이어지는 교차 도로",lv:[13,16],pokemon:[
  {k:"nidoranm",w:14},
  {k:"nidoranf",w:14},
  {k:"pidgey",w:18},
  {k:"stantler",w:16},
  {k:"growlithe",w:15},
  {k:"vulpix",w:14},
  {k:"chikorita",w:3},
  {k:"cyndaquil",w:3},
  {k:"totodile",w:3}
],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:3,trainers:[
  {n:"사이킥 카즈에",em:"🔮",pokemon:[
    {k:"nidoranm",l:14},
    {k:"nidoranf",l:14},
    {k:"stantler",l:15}
  ],reward:450},
  {n:"소년 마사루",em:"👦",pokemon:[
    {k:"growlithe",l:15},
    {k:"pidgey",l:15}
  ],reward:450},
  {n:"소녀 코토네",em:"👧",pokemon:[
    {k:"vulpix",l:14},
    {k:"stantler",l:15}
  ],reward:450},
  {n:"캠핑소년 토오루",em:"⛺",pokemon:[
    {k:"pidgey",l:15},
    {k:"growlithe",l:16}
  ],reward:480},
  {n:"짧은치마 미라이",em:"🌸",pokemon:[
    {k:"vulpix",l:15},
    {k:"nidoranf",l:16}
  ],reward:480}
]},
{id:"j_r12",n:"37번도로",desc:"엔주시티 남쪽의 자연 도로",lv:[13,16],pokemon:[
  {k:"pidgey",w:20},
  {k:"pidgeotto",w:15},
  {k:"stantler",w:25},
  {k:"growlithe",w:20},
  {k:"vulpix",w:20}
,{k:"pineco",w:8}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:3,trainers:[
  {n:"새잡이 마사쿤",em:"🐦",pokemon:[
    {k:"pidgey",l:14},
    {k:"pidgeotto",l:15}
  ],reward:450},
  {n:"소년 아키히데",em:"👦",pokemon:[
    {k:"growlithe",l:15},
    {k:"stantler",l:15}
  ],reward:450},
  {n:"쌍둥이 지수&보라",em:"👯",pokemon:[
    {k:"vulpix",l:15},
    {k:"growlithe",l:15},
    {k:"stantler",l:16}
  ],reward:480},
  {n:"소녀 치카즈",em:"👧",pokemon:[
    {k:"pidgeotto",l:15},
    {k:"vulpix",l:16}
  ],reward:480},
  {n:"불꽃전사 하나지",em:"🔥",pokemon:[
    {k:"growlithe",l:16},
    {k:"vulpix",l:16}
  ],reward:480}
]},
{id:"j_c6",n:"엔주시티",desc:"역사와 전통의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","ultraball","potion","superpotion","hyperpotion","antidote","paralyzeheal","awakening","burnheal","iceheal"],reqBadges:3,trainers:[]},
{id:"j_r_belltower",n:"방울탑",desc:"전설의 포켓몬 호우오우가 기다리는 탑",lv:[20,40],pokemon:[
  {k:"rattata",w:20},
  {k:"gastly",w:25},
  {k:"haunter",w:20},
  {k:"misdreavus",w:15},
  {k:"duskull",w:10},
  {k:"shuppet",w:10}
],hasCenter:false,hasShop:false,encounterRate:0.9,reqBadges:7,trainers:[
  {n:"무녀 카스미",em:"⛩️",pokemon:[
    {k:"gastly",l:30},
    {k:"haunter",l:32}
  ],reward:960},
  {n:"도승 겐카이",em:"🧘",pokemon:[
    {k:"misdreavus",l:32},
    {k:"duskull",l:33}
  ],reward:990},
  {n:"무녀 사야카",em:"⛩️",pokemon:[
    {k:"haunter",l:33},
    {k:"shuppet",l:34}
  ],reward:1020},
  {n:"도승 린",em:"🧘",pokemon:[
    {k:"gastly",l:33},
    {k:"haunter",l:35},
    {k:"misdreavus",l:36}
  ],reward:1080},
  {n:"도승 엔조",em:"🧘",pokemon:[
    {k:"duskull",l:35},
    {k:"shuppet",l:36},
    {k:"haunter",l:38}
  ],reward:1140},
  {n:"무녀 치요",em:"⛩️",pokemon:[
    {k:"misdreavus",l:37},
    {k:"haunter",l:38},
    {k:"gastly",l:35},
    {k:"duskull",l:40}
  ],reward:1200}
]},
{id:"j_r13",n:"불탄탑",desc:"150년 전 불에 탄 탑",lv:[13,20],pokemon:[
  {k:"rattata",w:20},
  {k:"zubat",w:30},
  {k:"koffing",w:30},
  {k:"magmar",w:20}
,{k:"espeon",w:2},{k:"umbreon",w:2},{k:"magby",w:5}],hasCenter:false,hasShop:false,encounterRate:0.9,reqBadges:3,trainers:[
  {n:"인술사 노리히로",em:"👴",pokemon:[
    {k:"koffing",l:15},
    {k:"zubat",l:16}
  ],reward:480},
  {n:"인술사 도일",em:"👴",pokemon:[
    {k:"rattata",l:15},
    {k:"koffing",l:17}
  ],reward:510},
  {n:"인술사 메이지",em:"👴",pokemon:[
    {k:"magmar",l:18},
    {k:"koffing",l:17}
  ],reward:540},
  {n:"인술사 타츠이시",em:"👴",pokemon:[
    {k:"zubat",l:16},
    {k:"koffing",l:18},
    {k:"magmar",l:20}
  ],reward:600}
]},
{id:"j_r14",n:"38번도로",desc:"아사기시티로 향하는 서쪽 도로",lv:[16,20],pokemon:[
  {k:"rattata",w:12},
  {k:"raticate",w:10},
  {k:"pidgeotto",w:15},
  {k:"magnemite",w:15},
  {k:"miltank",w:12},
  {k:"tauros",w:12},
  {k:"snubbull",w:14},
  {k:"farfetchd",w:10}
],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:4,trainers:[
  {n:"새잡이 아키이시",em:"🐦",pokemon:[
    {k:"pidgeotto",l:17},
    {k:"farfetchd",l:18}
  ],reward:540},
  {n:"소녀 지민",em:"👧",pokemon:[
    {k:"snubbull",l:17},
    {k:"miltank",l:18}
  ],reward:540},
  {n:"소년 에이사쿠",em:"👦",pokemon:[
    {k:"raticate",l:18},
    {k:"magnemite",l:18}
  ],reward:540},
  {n:"아가씨 카즈미",em:"👩",pokemon:[
    {k:"snubbull",l:18},
    {k:"pidgeotto",l:19}
  ],reward:570},
  {n:"캠핑소년 코우타",em:"⛺",pokemon:[
    {k:"tauros",l:19},
    {k:"raticate",l:19}
  ],reward:570},
  {n:"짧은치마 린",em:"🌸",pokemon:[
    {k:"miltank",l:19},
    {k:"snubbull",l:20}
  ],reward:600}
]},
{id:"j_r15",n:"39번도로",desc:"목장이 있는 평화로운 도로",lv:[16,20],pokemon:[
  {k:"rattata",w:12},
  {k:"raticate",w:10},
  {k:"pidgeotto",w:15},
  {k:"magnemite",w:15},
  {k:"miltank",w:15},
  {k:"tauros",w:15},
  {k:"meowth",w:18}
,{k:"tyrogue",w:3}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:4,trainers:[
  {n:"목동 유지",em:"🤠",pokemon:[
    {k:"miltank",l:18},
    {k:"tauros",l:18}
  ],reward:540},
  {n:"소녀 카나",em:"👧",pokemon:[
    {k:"meowth",l:17},
    {k:"pidgeotto",l:18}
  ],reward:540},
  {n:"소년 슌지",em:"👦",pokemon:[
    {k:"raticate",l:18},
    {k:"magnemite",l:19}
  ],reward:570},
  {n:"목동 유토",em:"🤠",pokemon:[
    {k:"miltank",l:19},
    {k:"miltank",l:19},
    {k:"tauros",l:20}
  ],reward:600},
  {n:"아가씨 사린",em:"👩",pokemon:[
    {k:"meowth",l:18},
    {k:"rattata",l:19},
    {k:"pidgeotto",l:20}
  ],reward:600}
]},
{id:"j_c7",n:"아사기시티",desc:"바다가 보이는 항구 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","ultraball","potion","superpotion","hyperpotion","antidote","paralyzeheal","awakening","burnheal","iceheal","fullheal","revive"],reqBadges:4,trainers:[]},
{id:"j_r16",n:"40번수로",desc:"아사기시티 남쪽 바다",lv:[18,24],pokemon:[
  {k:"tentacool",w:65},
  {k:"tentacruel",w:35}
],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:4,trainers:[
  {n:"수영선수 미사키",em:"🏊",pokemon:[
    {k:"tentacool",l:19},
    {k:"tentacool",l:20}
  ],reward:600},
  {n:"수영선수 타이시키",em:"🏊",pokemon:[
    {k:"tentacool",l:20},
    {k:"tentacruel",l:22}
  ],reward:660},
  {n:"낚시꾼 세이고",em:"🎣",pokemon:[
    {k:"tentacool",l:19},
    {k:"tentacool",l:20},
    {k:"tentacruel",l:22}
  ],reward:660},
  {n:"수영선수 메구미",em:"🏊",pokemon:[
    {k:"tentacruel",l:23},
    {k:"tentacool",l:21}
  ],reward:690},
  {n:"낚시꾼 유스케",em:"🎣",pokemon:[
    {k:"tentacool",l:20},
    {k:"tentacruel",l:24}
  ],reward:720}
]},
{id:"j_r17",n:"41번수로",desc:"소용돌이가 치는 넓은 바다",lv:[18,24],pokemon:[
  {k:"tentacool",w:40},
  {k:"tentacruel",w:30},
  {k:"mantine",w:30}
],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:4,trainers:[
  {n:"수영선수 현지",em:"🏊",pokemon:[
    {k:"tentacool",l:20},
    {k:"mantine",l:22}
  ],reward:660},
  {n:"수영선수 코지",em:"🏊",pokemon:[
    {k:"tentacruel",l:22},
    {k:"tentacool",l:21}
  ],reward:660},
  {n:"낚시꾼 슌에이",em:"🎣",pokemon:[
    {k:"tentacool",l:20},
    {k:"mantine",l:22},
    {k:"tentacruel",l:23}
  ],reward:690},
  {n:"수영선수 소라",em:"🏊",pokemon:[
    {k:"mantine",l:23},
    {k:"tentacruel",l:24}
  ],reward:720},
  {n:"선원 카이류",em:"⚓",pokemon:[
    {k:"tentacruel",l:23},
    {k:"mantine",l:24}
  ],reward:720}
]},
{id:"j_c8",n:"탄바시티",desc:"파도에 깎인 바위 절벽의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","ultraball","potion","superpotion","hyperpotion","antidote","paralyzeheal","awakening","burnheal","iceheal","fullheal","revive"],reqBadges:4,trainers:[]},
{id:"j_r18",n:"42번도로",desc:"쵸우지타운 동쪽의 산길",lv:[22,28],pokemon:[
  {k:"zubat",w:15},
  {k:"golbat",w:15},
  {k:"mareep",w:15},
  {k:"flaaffy",w:15},
  {k:"mankey",w:15},
  {k:"spearow",w:12},
  {k:"fearow",w:13}
],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:5,trainers:[
  {n:"등산가 노보루",em:"🧗",pokemon:[
    {k:"mankey",l:23},
    {k:"geodude",l:24}
  ],reward:720},
  {n:"새잡이 유이치",em:"🐦",pokemon:[
    {k:"spearow",l:23},
    {k:"fearow",l:25}
  ],reward:750},
  {n:"소년 아키오",em:"👦",pokemon:[
    {k:"flaaffy",l:24},
    {k:"mareep",l:23},
    {k:"golbat",l:25}
  ],reward:750},
  {n:"등산가 마사이시",em:"��",pokemon:[
    {k:"mankey",l:25},
    {k:"golbat",l:26}
  ],reward:780},
  {n:"소녀 레이카",em:"👧",pokemon:[
    {k:"flaaffy",l:25},
    {k:"zubat",l:24},
    {k:"fearow",l:26}
  ],reward:780},
  {n:"무도가 타카시",em:"🥋",pokemon:[
    {k:"mankey",l:26},
    {k:"mankey",l:27}
  ],reward:810}
]},
{id:"j_r19",n:"절구산",desc:"깊은 동굴이 이어진 거대한 산",lv:[14,32],pokemon:[
  {k:"zubat",w:15},
  {k:"golbat",w:12},
  {k:"geodude",w:15},
  {k:"graveler",w:10},
  {k:"machop",w:15},
  {k:"machoke",w:10},
  {k:"rattata",w:13},
  {k:"marill",w:10}
],hasCenter:false,hasShop:false,encounterRate:0.9,reqBadges:5,trainers:[
  {n:"등산가 사이키치",em:"🧗",pokemon:[
    {k:"geodude",l:24},
    {k:"graveler",l:26},
    {k:"machop",l:25}
  ],reward:780},
  {n:"무도가 테츠야",em:"🥋",pokemon:[
    {k:"machop",l:25},
    {k:"machoke",l:28}
  ],reward:840},
  {n:"등산가 야스미",em:"🧗",pokemon:[
    {k:"geodude",l:26},
    {k:"golbat",l:27},
    {k:"graveler",l:28}
  ],reward:840},
  {n:"소년 진욱",em:"👦",pokemon:[
    {k:"rattata",l:25},
    {k:"marill",l:26},
    {k:"zubat",l:27}
  ],reward:810},
  {n:"무도가 타이켄",em:"🥋",pokemon:[
    {k:"machoke",l:28},
    {k:"machop",l:27},
    {k:"machoke",l:30}
  ],reward:900},
  {n:"등산가 이와오",em:"🧗",pokemon:[
    {k:"graveler",l:28},
    {k:"geodude",l:27},
    {k:"golbat",l:30}
  ],reward:900}
]},
{id:"j_c9",n:"쵸우지타운",desc:"닌자마을이라고 불리는 작은 마을",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","ultraball","potion","superpotion","hyperpotion","maxpotion","antidote","paralyzeheal","awakening","burnheal","iceheal","fullheal","revive","liechiberry","ganlonberry","salacberry","petayaberry","apicotberry"],reqBadges:5,trainers:[]},
{id:"j_r20",n:"분노의호수",desc:"붉은 갸라도스의 전설이 깃든 호수",lv:[20,30],pokemon:[
  {k:"magikarp",w:60},
  {k:"gyarados",w:40}
,{k:"politoed",w:3},{k:"corsola",w:5},{k:"qwilfish",w:5}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:5,trainers:[
  {n:"낚시꾼 다이세이",em:"🎣",pokemon:[
    {k:"magikarp",l:22},
    {k:"magikarp",l:24},
    {k:"gyarados",l:28}
  ],reward:840},
  {n:"낚시꾼 진태",em:"🎣",pokemon:[
    {k:"magikarp",l:23},
    {k:"magikarp",l:25},
    {k:"magikarp",l:26}
  ],reward:780},
  {n:"낚시꾼 유이시",em:"🎣",pokemon:[
    {k:"gyarados",l:28},
    {k:"magikarp",l:25}
  ],reward:840},
  {n:"소년 카이산",em:"👦",pokemon:[
    {k:"gyarados",l:28},
    {k:"gyarados",l:30}
  ],reward:900}
]},
{id:"j_r21",n:"43번도로",desc:"분노의호수로 향하는 도로",lv:[20,27],pokemon:[
  {k:"pidgeotto",w:20},
  {k:"flaaffy",w:20},
  {k:"girafarig",w:20},
  {k:"mareep",w:20},
  {k:"noctowl",w:20}
,{k:"remoraid",w:10}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:6,trainers:[
  {n:"새잡이 유이시",em:"🐦",pokemon:[
    {k:"pidgeotto",l:22},
    {k:"noctowl",l:24}
  ],reward:720},
  {n:"사이킥 미레이",em:"🔮",pokemon:[
    {k:"girafarig",l:23},
    {k:"flaaffy",l:24}
  ],reward:720},
  {n:"소년 요시카즈",em:"👦",pokemon:[
    {k:"mareep",l:22},
    {k:"pidgeotto",l:23},
    {k:"flaaffy",l:24}
  ],reward:720},
  {n:"소녀 유하",em:"👧",pokemon:[
    {k:"girafarig",l:24},
    {k:"noctowl",l:25}
  ],reward:750},
  {n:"캠핑소년 타츠히로",em:"⛺",pokemon:[
    {k:"flaaffy",l:24},
    {k:"girafarig",l:25},
    {k:"noctowl",l:26}
  ],reward:780},
  {n:"사이킥 유우이치",em:"🔮",pokemon:[
    {k:"girafarig",l:25},
    {k:"noctowl",l:27}
  ],reward:810}
]},
{id:"j_r22",n:"44번도로",desc:"얼음길 입구로 향하는 도로",lv:[24,30],pokemon:[
  {k:"lickitung",w:15},
  {k:"tangela",w:18},
  {k:"poliwag",w:15},
  {k:"poliwhirl",w:15},
  {k:"bellsprout",w:18},
  {k:"weepinbell",w:19}
],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:7,trainers:[
  {n:"소년 유타카",em:"👦",pokemon:[
    {k:"tangela",l:26},
    {k:"bellsprout",l:26},
    {k:"weepinbell",l:27}
  ],reward:810},
  {n:"낚시꾼 무사시",em:"🎣",pokemon:[
    {k:"poliwag",l:25},
    {k:"poliwhirl",l:27},
    {k:"poliwag",l:26}
  ],reward:810},
  {n:"소녀 사키",em:"👧",pokemon:[
    {k:"lickitung",l:27},
    {k:"tangela",l:28}
  ],reward:840},
  {n:"캠핑소년 유빈",em:"⛺",pokemon:[
    {k:"bellsprout",l:26},
    {k:"weepinbell",l:28},
    {k:"lickitung",l:28}
  ],reward:840},
  {n:"짧은치마 미유",em:"🌸",pokemon:[
    {k:"tangela",l:28},
    {k:"poliwhirl",l:29}
  ],reward:870},
  {n:"소년 카즈마",em:"👦",pokemon:[
    {k:"weepinbell",l:28},
    {k:"lickitung",l:29},
    {k:"poliwhirl",l:30}
  ],reward:900}
]},
{id:"j_r23",n:"얼음샛길",desc:"미끄러운 얼음으로 뒤덮인 동굴",lv:[22,32],pokemon:[
  {k:"zubat",w:20},
  {k:"golbat",w:20},
  {k:"swinub",w:25},
  {k:"delibird",w:20},
  {k:"jynx",w:15}
,{k:"chinchou",w:10}],hasCenter:false,hasShop:false,encounterRate:0.9,reqBadges:7,trainers:[
  {n:"스키어 유지",em:"⛷️",pokemon:[
    {k:"swinub",l:26},
    {k:"delibird",l:28}
  ],reward:840},
  {n:"등산가 이치로",em:"🧗",pokemon:[
    {k:"golbat",l:27},
    {k:"swinub",l:28},
    {k:"zubat",l:26}
  ],reward:840},
  {n:"스키어 나레",em:"⛷️",pokemon:[
    {k:"jynx",l:29},
    {k:"delibird",l:28}
  ],reward:870},
  {n:"등산가 코타로",em:"🧗",pokemon:[
    {k:"golbat",l:28},
    {k:"swinub",l:30}
  ],reward:900},
  {n:"스키어 무네하루",em:"⛷️",pokemon:[
    {k:"swinub",l:28},
    {k:"jynx",l:30},
    {k:"delibird",l:30}
  ],reward:900},
  {n:"등산가 타츠야",em:"🧗",pokemon:[
    {k:"golbat",l:30},
    {k:"swinub",l:30},
    {k:"jynx",l:32}
  ],reward:960}
]},
{id:"j_c10",n:"후스베시티",desc:"드래곤 포켓몬 사용자들의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","ultraball","potion","superpotion","hyperpotion","maxpotion","fullrestore","antidote","paralyzeheal","awakening","burnheal","iceheal","fullheal","revive","escaperope"],reqBadges:7,trainers:[]},
{id:"j_r_dragonden",n:"용의굴",desc:"드래곤 사용자들의 수련장",lv:[15,45],pokemon:[
  {k:"magikarp",w:30},
  {k:"dratini",w:20},
  {k:"dragonair",w:10},
  {k:"horsea",w:20},
  {k:"seadra",w:10},
  {k:"bagon",w:10}
],hasCenter:false,hasShop:false,encounterRate:0.9,reqBadges:7,trainers:[
  {n:"드래곤테이머 류헤이",em:"🐉",pokemon:[
    {k:"dratini",l:35},
    {k:"horsea",l:36}
  ],reward:1080},
  {n:"드래곤테이머 카이",em:"🐉",pokemon:[
    {k:"dragonair",l:38},
    {k:"seadra",l:38}
  ],reward:1140},
  {n:"드래곤테이머 사쿠",em:"🐉",pokemon:[
    {k:"bagon",l:37},
    {k:"dratini",l:38},
    {k:"horsea",l:39}
  ],reward:1170},
  {n:"드래곤테이머 엔",em:"🐉",pokemon:[
    {k:"dragonair",l:40},
    {k:"seadra",l:40},
    {k:"bagon",l:42}
  ],reward:1260},
  {n:"드래곤테이머 무겐",em:"🐉",pokemon:[
    {k:"dragonair",l:42},
    {k:"seadra",l:43},
    {k:"dratini",l:40},
    {k:"bagon",l:45}
  ],reward:1350}
]},
{id:"j_r24",n:"어둠의동굴",desc:"어두컴컴한 미로 같은 동굴",lv:[4,20],pokemon:[
  {k:"zubat",w:30},
  {k:"geodude",w:25},
  {k:"dunsparce",w:18},
  {k:"teddiursa",w:15},
  {k:"wobbuffet",w:12}
],hasCenter:false,hasShop:false,encounterRate:0.9,reqBadges:3,trainers:[
  {n:"등산가 마사루",em:"��",pokemon:[
    {k:"geodude",l:14},
    {k:"zubat",l:15},
    {k:"geodude",l:16}
  ],reward:480},
  {n:"소년 유켄",em:"👦",pokemon:[
    {k:"teddiursa",l:15},
    {k:"dunsparce",l:16}
  ],reward:480},
  {n:"등산가 노부히로",em:"🧗",pokemon:[
    {k:"geodude",l:16},
    {k:"zubat",l:17},
    {k:"wobbuffet",l:17}
  ],reward:510},
  {n:"소녀 카나미",em:"👧",pokemon:[
    {k:"dunsparce",l:17},
    {k:"teddiursa",l:18}
  ],reward:540},
  {n:"등산가 무네노리",em:"🧗",pokemon:[
    {k:"geodude",l:18},
    {k:"geodude",l:18},
    {k:"zubat",l:20}
  ],reward:600}
]},
{id:"j_r25",n:"소용돌이섬",desc:"전설의 포켓몬이 잠드는 섬",lv:[22,30],pokemon:[
  {k:"zubat",w:20},
  {k:"golbat",w:20},
  {k:"krabby",w:22},
  {k:"horsea",w:20},
  {k:"seel",w:18}
],hasCenter:false,hasShop:false,encounterRate:0.9,reqBadges:7,trainers:[
  {n:"수영선수 아키나",em:"🏊",pokemon:[
    {k:"seel",l:25},
    {k:"horsea",l:26}
  ],reward:780},
  {n:"낚시꾼 노부오",em:"🎣",pokemon:[
    {k:"krabby",l:25},
    {k:"horsea",l:26},
    {k:"krabby",l:27}
  ],reward:810},
  {n:"수영선수 마사지",em:"🏊",pokemon:[
    {k:"seel",l:26},
    {k:"golbat",l:27},
    {k:"horsea",l:28}
  ],reward:840},
  {n:"등산가 대수",em:"🧗",pokemon:[
    {k:"golbat",l:27},
    {k:"zubat",l:26},
    {k:"seel",l:28}
  ],reward:840},
  {n:"수영선수 보라",em:"🏊",pokemon:[
    {k:"horsea",l:28},
    {k:"seel",l:29},
    {k:"krabby",l:30}
  ],reward:900}
]},
{id:"j_r26",n:"45번도로",desc:"후스베시티에서 내려가는 급경사 도로",lv:[23,30],pokemon:[
  {k:"geodude",w:18},
  {k:"graveler",w:15},
  {k:"gligar",w:15},
  {k:"donphan",w:10},
  {k:"phanpy",w:15},
  {k:"teddiursa",w:15},
  {k:"skarmory",w:12}
,{k:"smoochum",w:5}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:8,trainers:[
  {n:"등산가 코세키",em:"🧗",pokemon:[
    {k:"geodude",l:25},
    {k:"graveler",l:27},
    {k:"geodude",l:26}
  ],reward:810},
  {n:"소년 타이에",em:"👦",pokemon:[
    {k:"phanpy",l:26},
    {k:"teddiursa",l:27}
  ],reward:810},
  {n:"등산가 야스지",em:"🧗",pokemon:[
    {k:"graveler",l:27},
    {k:"gligar",l:28}
  ],reward:840},
  {n:"소녀 서하",em:"👧",pokemon:[
    {k:"teddiursa",l:27},
    {k:"phanpy",l:28},
    {k:"skarmory",l:28}
  ],reward:840},
  {n:"무도가 고이치",em:"🥋",pokemon:[
    {k:"gligar",l:28},
    {k:"donphan",l:29}
  ],reward:870},
  {n:"등산가 대혁",em:"🧗",pokemon:[
    {k:"graveler",l:28},
    {k:"geodude",l:27},
    {k:"skarmory",l:30}
  ],reward:900}
]},
{id:"j_r27",n:"46번도로",desc:"연결동굴 남쪽의 짧은 도로",lv:[2,5],pokemon:[
  {k:"geodude",w:30},
  {k:"spearow",w:25},
  {k:"rattata",w:25},
  {k:"jigglypuff",w:20}
,{k:"shuckle",w:5}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:8,trainers:[
  {n:"등산가 진태",em:"🧗",pokemon:[
    {k:"geodude",l:3},
    {k:"geodude",l:4}
  ],reward:120},
  {n:"소년 아키카즈",em:"👦",pokemon:[
    {k:"spearow",l:3},
    {k:"rattata",l:4}
  ],reward:120},
  {n:"소녀 유빈",em:"👧",pokemon:[
    {k:"jigglypuff",l:4},
    {k:"rattata",l:4}
  ],reward:120},
  {n:"등산가 케이스케",em:"🧗",pokemon:[
    {k:"geodude",l:4},
    {k:"spearow",l:5}
  ],reward:150}
]},
{id:"j_r_47",n:"47번도로",desc:"HGSS에서 추가된 절벽 위의 도로",lv:[28,32],pokemon:[
  {k:"ditto",w:20},
  {k:"miltank",w:15},
  {k:"tauros",w:15},
  {k:"farfetchd",w:10},
  {k:"raticate",w:15},
  {k:"gloom",w:15},
  {k:"fearow",w:10}
],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:7,trainers:[
  {n:"등산가 겐타",em:"🧗",pokemon:[
    {k:"tauros",l:30},
    {k:"raticate",l:31}
  ],reward:930},
  {n:"파라솔아가씨 유리",em:"☂️",pokemon:[
    {k:"gloom",l:31},
    {k:"miltank",l:32}
  ],reward:960},
  {n:"소년 토모야",em:"👦",pokemon:[
    {k:"fearow",l:32},
    {k:"farfetchd",l:33}
  ],reward:990},
  {n:"등산가 슌",em:"🧗",pokemon:[
    {k:"tauros",l:33},
    {k:"ditto",l:34}
  ],reward:1020},
  {n:"소녀 미나미",em:"👧",pokemon:[
    {k:"miltank",l:33},
    {k:"gloom",l:34},
    {k:"raticate",l:35}
  ],reward:1050}
]},
{id:"j_r_48",n:"48번도로",desc:"사파리존으로 향하는 도로",lv:[22,26],pokemon:[
  {k:"tauros",w:15},
  {k:"miltank",w:15},
  {k:"fearow",w:15},
  {k:"gloom",w:15},
  {k:"girafarig",w:20},
  {k:"hoppip",w:20}
],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:7,trainers:[
  {n:"소녀 아야노",em:"👧",pokemon:[
    {k:"girafarig",l:25},
    {k:"hoppip",l:26}
  ],reward:780},
  {n:"소년 카이토",em:"👦",pokemon:[
    {k:"tauros",l:26},
    {k:"fearow",l:27}
  ],reward:810},
  {n:"파라솔아가씨 사오리",em:"☂️",pokemon:[
    {k:"gloom",l:27},
    {k:"miltank",l:28}
  ],reward:840},
  {n:"소년 료",em:"👦",pokemon:[
    {k:"girafarig",l:28},
    {k:"hoppip",l:28},
    {k:"fearow",l:30}
  ],reward:900}
]},
{id:"j_r_safari",n:"사파리존",desc:"다양한 포켓몬이 사는 자연 보호구역",lv:[15,40],pokemon:[
  {k:"geodude",w:10},{k:"magikarp",w:8},{k:"natu",w:10},{k:"xatu",w:5},
  {k:"misdreavus",w:8},{k:"stantler",w:8},{k:"girafarig",w:8},{k:"larvitar",w:5},
  {k:"beedrill",w:6},{k:"hoppip",w:8},{k:"aipom",w:8},{k:"teddiursa",w:5},
  {k:"mareep",w:8},{k:"wooper",w:8},{k:"quagsire",w:5}
],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:7,trainers:[
  {n:"레인저 세이이치",em:"🌿",pokemon:[
    {k:"stantler",l:30},{k:"girafarig",l:31}
  ],reward:930},
  {n:"레인저 유카리",em:"🌿",pokemon:[
    {k:"teddiursa",l:31},{k:"aipom",l:32}
  ],reward:960},
  {n:"레인저 켄지",em:"🌿",pokemon:[
    {k:"xatu",l:32},{k:"misdreavus",l:33}
  ],reward:990},
  {n:"레인저 치요코",em:"🌿",pokemon:[
    {k:"larvitar",l:33},{k:"quagsire",l:34},{k:"girafarig",l:32}
  ],reward:1020}
]},
{id:"j_r28",n:"26번도로",desc:"세키에이고원으로 향하는 험준한 도로",lv:[28,35],pokemon:[
  {k:"doduo",w:18},
  {k:"dodrio",w:15},
  {k:"raticate",w:17},
  {k:"ponyta",w:18},
  {k:"arbok",w:16},
  {k:"sandslash",w:16}
],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:8,trainers:[
  {n:"새잡이 켄지",em:"🐦",pokemon:[
    {k:"doduo",l:30},
    {k:"dodrio",l:32}
  ],reward:960},
  {n:"소녀 시아키",em:"👧",pokemon:[
    {k:"ponyta",l:30},
    {k:"raticate",l:31}
  ],reward:930},
  {n:"레인저 카즈호",em:"🌿",pokemon:[
    {k:"arbok",l:31},
    {k:"sandslash",l:32},
    {k:"dodrio",l:33}
  ],reward:990},
  {n:"소년 세이라",em:"👦",pokemon:[
    {k:"raticate",l:31},
    {k:"ponyta",l:33}
  ],reward:990},
  {n:"아가씨 사린",em:"👩",pokemon:[
    {k:"dodrio",l:32},
    {k:"ponyta",l:33},
    {k:"sandslash",l:34}
  ],reward:1020},
  {n:"무도가 타이잔",em:"🥋",pokemon:[
    {k:"sandslash",l:33},
    {k:"arbok",l:34},
    {k:"raticate",l:35}
  ],reward:1050}
]},
{id:"j_r29",n:"27번도로",desc:"관동과 성도를 잇는 해안 도로",lv:[28,35],pokemon:[
  {k:"doduo",w:15},
  {k:"dodrio",w:15},
  {k:"ponyta",w:20},
  {k:"arbok",w:18},
  {k:"sandslash",w:17},
  {k:"quagsire",w:15}
],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:8,trainers:[
  {n:"낚시꾼 카이스이",em:"🎣",pokemon:[
    {k:"quagsire",l:30},
    {k:"tentacruel",l:31}
  ],reward:930},
  {n:"소년 고아키",em:"👦",pokemon:[
    {k:"dodrio",l:31},
    {k:"ponyta",l:32}
  ],reward:960},
  {n:"소녀 카나에",em:"👧",pokemon:[
    {k:"arbok",l:31},
    {k:"sandslash",l:32},
    {k:"doduo",l:30}
  ],reward:960},
  {n:"레인저 마사코",em:"🌿",pokemon:[
    {k:"quagsire",l:32},
    {k:"ponyta",l:33},
    {k:"dodrio",l:34}
  ],reward:1020},
  {n:"새잡이 유지",em:"🐦",pokemon:[
    {k:"dodrio",l:33},
    {k:"doduo",l:32},
    {k:"fearow",l:34}
  ],reward:1020},
  {n:"무도가 켄이치",em:"🥋",pokemon:[
    {k:"sandslash",l:34},
    {k:"arbok",l:35}
  ],reward:1050}
]},
{id:"j_r30",n:"챔피언로드",desc:"세키에이고원으로 가는 마지막 시련의 길",lv:[32,40],pokemon:[
  {k:"golbat",w:15},
  {k:"graveler",w:15},
  {k:"onix",w:15},
  {k:"machoke",w:15},
  {k:"ursaring",w:12},
  {k:"donphan",w:13},
  {k:"rhyhorn",w:15}
,{k:"blissey",w:1}],hasCenter:false,hasShop:false,encounterRate:0.9,reqBadges:8,trainers:[
  {n:"등산가 고이시",em:"🧗",pokemon:[
    {k:"graveler",l:34},
    {k:"onix",l:35},
    {k:"rhyhorn",l:36}
  ],reward:1080},
  {n:"무도가 카쿠지",em:"🥋",pokemon:[
    {k:"machoke",l:35},
    {k:"ursaring",l:37}
  ],reward:1110},
  {n:"레인저 야스토",em:"🌿",pokemon:[
    {k:"donphan",l:36},
    {k:"golbat",l:35},
    {k:"ursaring",l:37}
  ],reward:1110},
  {n:"등산가 태웅",em:"🧗",pokemon:[
    {k:"graveler",l:36},
    {k:"onix",l:37},
    {k:"rhyhorn",l:38}
  ],reward:1140},
  {n:"무도가 철민",em:"🥋",pokemon:[
    {k:"machoke",l:37},
    {k:"donphan",l:38},
    {k:"ursaring",l:38}
  ],reward:1140},
  {n:"레인저 카즈마사",em:"🌿",pokemon:[
    {k:"golbat",l:37},
    {k:"graveler",l:38},
    {k:"rhyhorn",l:38},
    {k:"machoke",l:40}
  ],reward:1200},
  {n:"등산가 이시마루",em:"🧗",pokemon:[
    {k:"onix",l:38},
    {k:"donphan",l:39},
    {k:"ursaring",l:40}
  ],reward:1200}
]},
{id:"j_c11",n:"세키에이고원",desc:"포켓몬 리그의 본거지",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","ultraball","potion","superpotion","hyperpotion","maxpotion","fullrestore","antidote","paralyzeheal","awakening","burnheal","iceheal","fullheal","revive","escaperope"],reqBadges:8,trainers:[]},
{id:"j_r31",n:"은빛산",desc:"전설의 트레이너가 수련하는 최강의 산",lv:[40,50],pokemon:[
  {k:"golbat",w:12},
  {k:"graveler",w:12},
  {k:"ursaring",w:14},
  {k:"donphan",w:14},
  {k:"larvitar",w:15},
  {k:"pupitar",w:10},
  {k:"sneasel",w:12},
  {k:"misdreavus",w:11}
],hasCenter:false,hasShop:false,encounterRate:0.9,reqBadges:8,trainers:[
  {n:"등산가 무사시",em:"🧗",pokemon:[
    {k:"graveler",l:42},
    {k:"donphan",l:44},
    {k:"ursaring",l:45}
  ],reward:1350},
  {n:"무도가 하나코",em:"🥋",pokemon:[
    {k:"ursaring",l:44},
    {k:"donphan",l:45},
    {k:"machoke",l:46}
  ],reward:1380},
  {n:"레인저 유키카",em:"🌿",pokemon:[
    {k:"golbat",l:43},
    {k:"sneasel",l:44},
    {k:"misdreavus",l:45},
    {k:"ursaring",l:46}
  ],reward:1380},
  {n:"등산가 산가",em:"🧗",pokemon:[
    {k:"graveler",l:44},
    {k:"donphan",l:46},
    {k:"onix",l:47}
  ],reward:1410},
  {n:"사이킥 메이아키",em:"🔮",pokemon:[
    {k:"misdreavus",l:45},
    {k:"pupitar",l:46},
    {k:"golbat",l:47}
  ],reward:1410},
  {n:"무도가 대산",em:"🥋",pokemon:[
    {k:"ursaring",l:46},
    {k:"donphan",l:47},
    {k:"machoke",l:48}
  ],reward:1440},
  {n:"레인저 쿄쿠겐",em:"🌿",pokemon:[
    {k:"larvitar",l:45},
    {k:"pupitar",l:47},
    {k:"sneasel",l:48},
    {k:"ursaring",l:50}
  ],reward:1500},
  {n:"등산가 최후",em:"🧗",pokemon:[
    {k:"graveler",l:46},
    {k:"donphan",l:48},
    {k:"ursaring",l:50}
  ],reward:1500}
]}
]},
hoenn: {
    n: "호연지방", em: "🌊",
    roads: [
{id:"h_c1",n:"미시로타운",desc:"미시로타운",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote"],reqBadges:0,trainers:[]},
{id:"h_r1",n:"101번도로",desc:"101번도로",hasCenter:false,hasShop:false,lv:[2,4],pokemon:[{k:"zigzagoon",w:40},{k:"poochyena",w:35},{k:"wurmple",w:25}],reqBadges:0,trainers:[{n:"풀숲소년 사토시",em:"👤",pokemon:[{k:"zigzagoon",l:3}],reward:90},{n:"벌레잡이소년 타이호",em:"👤",pokemon:[{k:"wurmple",l:3},{k:"wurmple",l:4}],reward:120},{n:"짧은치마 사쿠라",em:"👤",pokemon:[{k:"poochyena",l:4}],reward:120},{n:"캠프파이어소녀 유이",em:"👤",pokemon:[{k:"zigzagoon",l:3},{k:"poochyena",l:3}],reward:90}]},
{id:"h_c2",n:"코토키타운",desc:"코토키타운",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote"],reqBadges:0,trainers:[]},
{id:"h_r2",n:"103번도로",desc:"103번도로",hasCenter:false,hasShop:false,lv:[2,4],pokemon:[{k:"zigzagoon",w:40},{k:"poochyena",w:35},{k:"wingull",w:25}],reqBadges:0,trainers:[{n:"수영선수 쇼호",em:"👤",pokemon:[{k:"wingull",l:4}],reward:120},{n:"풀숲소년 슌스케",em:"👤",pokemon:[{k:"zigzagoon",l:3},{k:"poochyena",l:3}],reward:90},{n:"낚시꾼 류지",em:"👤",pokemon:[{k:"wingull",l:3},{k:"wingull",l:4}],reward:120},{n:"짧은치마 하루카",em:"👤",pokemon:[{k:"poochyena",l:4}],reward:120}]},
{id:"h_r3",n:"102번도로",desc:"102번도로",hasCenter:false,hasShop:false,lv:[3,5],pokemon:[{k:"zigzagoon",w:25},{k:"poochyena",w:25},{k:"ralts",w:4},{k:"seedot",w:15},{k:"lotad",w:15},{k:"wurmple",w:10},{k:"surskit",w:6}],reqBadges:0,trainers:[{n:"풀숲소년 소라",em:"👤",pokemon:[{k:"seedot",l:4},{k:"lotad",l:4}],reward:120},{n:"벌레잡이소년 아키라",em:"👤",pokemon:[{k:"wurmple",l:4},{k:"surskit",l:5}],reward:150},{n:"짧은치마 미즈키",em:"👤",pokemon:[{k:"ralts",l:5}],reward:150},{n:"풀숲소녀 나에",em:"👤",pokemon:[{k:"zigzagoon",l:3},{k:"poochyena",l:4}],reward:120},{n:"캠프파이어소녀 미소라",em:"👤",pokemon:[{k:"lotad",l:5}],reward:150}]},
{id:"h_c3",n:"토우카시티",desc:"토우카시티",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote"],reqBadges:0,trainers:[]},
{id:"h_r4",n:"104번도로",desc:"104번도로",hasCenter:false,hasShop:false,lv:[4,7],pokemon:[{k:"zigzagoon",w:25},{k:"poochyena",w:20},{k:"wingull",w:15},{k:"taillow",w:20},{k:"lotad",w:10},{k:"wurmple",w:10}],reqBadges:0,trainers:[{n:"풀숲소년 료우",em:"👤",pokemon:[{k:"zigzagoon",l:5},{k:"taillow",l:6}],reward:180},{n:"짧은치마 나나미",em:"👤",pokemon:[{k:"wingull",l:6}],reward:180},{n:"낚시꾼 유이치",em:"👤",pokemon:[{k:"marill",l:7}],reward:210},{n:"벌레잡이소년 신고",em:"👤",pokemon:[{k:"wurmple",l:5},{k:"wurmple",l:6}],reward:180},{n:"파라솔아가씨 코유키",em:"👤",pokemon:[{k:"wingull",l:5},{k:"marill",l:6}],reward:180}]},
{id:"h_r5",n:"피나숲",desc:"피나숲",hasCenter:false,hasShop:false,lv:[5,7],pokemon:[{k:"zigzagoon",w:20},{k:"shroomish",w:15},{k:"slakoth",w:5},{k:"wurmple",w:20},{k:"silcoon",w:10},{k:"cascoon",w:10},{k:"taillow",w:20}],reqBadges:0,trainers:[{n:"벌레잡이소년 타이요",em:"👤",pokemon:[{k:"wurmple",l:5},{k:"silcoon",l:6}],reward:180},{n:"풀숲소녀 치카라",em:"👤",pokemon:[{k:"shroomish",l:6},{k:"zigzagoon",l:5}],reward:180},{n:"벌레잡이소년 나오키",em:"👤",pokemon:[{k:"cascoon",l:6},{k:"wurmple",l:5}],reward:180},{n:"풀숲소년 하준",em:"👤",pokemon:[{k:"taillow",l:7}],reward:210},{n:"캠프파이어소녀 레이온",em:"👤",pokemon:[{k:"shroomish",l:6},{k:"slakoth",l:7}],reward:210}]},
{id:"h_c4",n:"카나즈미시티",desc:"카나즈미시티",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion","superpotion","antidote","paralyzeheal","awakening","escaperope","xattack","xdefense","xspeed"],reqBadges:0,trainers:[]},
{id:"h_r6",n:"동굴통로",desc:"동굴통로",hasCenter:false,hasShop:false,lv:[5,10],pokemon:[{k:"zubat",w:40},{k:"whismur",w:30},{k:"geodude",w:30}],reqBadges:1,trainers:[{n:"등산가 철호",em:"👤",pokemon:[{k:"geodude",l:8}],reward:240},{n:"캠프파이어소녀 미유",em:"👤",pokemon:[{k:"whismur",l:7},{k:"zubat",l:7}],reward:210},{n:"산악인 무네테츠",em:"👤",pokemon:[{k:"geodude",l:9},{k:"zubat",l:8}],reward:270},{n:"풀숲소년 유사쿠",em:"👤",pokemon:[{k:"whismur",l:9}],reward:270}]},
{id:"h_r7",n:"116번도로",desc:"116번도로",hasCenter:false,hasShop:false,lv:[6,10],pokemon:[{k:"zigzagoon",w:25},{k:"taillow",w:25},{k:"nincada",w:15},{k:"whismur",w:15},{k:"skitty",w:15},{k:"abra",w:5}],reqBadges:1,trainers:[{n:"풀숲소년 히데키",em:"👤",pokemon:[{k:"zigzagoon",l:7},{k:"nincada",l:8}],reward:240},{n:"사이킥 미치",em:"👤",pokemon:[{k:"abra",l:8}],reward:240},{n:"짧은치마 유나",em:"👤",pokemon:[{k:"skitty",l:9}],reward:270},{n:"벌레잡이소년 켄타",em:"👤",pokemon:[{k:"nincada",l:7},{k:"taillow",l:8}],reward:240},{n:"풀숲소녀 코토네",em:"👤",pokemon:[{k:"whismur",l:8},{k:"zigzagoon",l:9}],reward:270}]},
{id:"h_c5",n:"무로시티",desc:"무로시티",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion","superpotion","antidote","paralyzeheal","awakening","escaperope"],reqBadges:1,trainers:[]},
{id:"h_r8",n:"화강동굴",desc:"화강동굴",hasCenter:false,hasShop:false,lv:[7,12],pokemon:[{k:"zubat",w:30},{k:"geodude",w:25},{k:"makuhita",w:15},{k:"abra",w:5},{k:"aron",w:12},{k:"sableye",w:6},{k:"mawile",w:7}],reqBadges:1,trainers:[{n:"블랙벨트 마사지",em:"👤",pokemon:[{k:"makuhita",l:10}],reward:300},{n:"등산가 성훈",em:"👤",pokemon:[{k:"geodude",l:9},{k:"zubat",l:10}],reward:300},{n:"산악인 재혁",em:"👤",pokemon:[{k:"aron",l:11}],reward:330},{n:"사이킥 린",em:"👤",pokemon:[{k:"abra",l:10},{k:"zubat",l:9}],reward:300},{n:"등산가 메이호",em:"👤",pokemon:[{k:"geodude",l:10},{k:"makuhita",l:11},{k:"aron",l:12}],reward:360}]},
{id:"h_c6",n:"카이나시티",desc:"카이나시티",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","superpotion","antidote","paralyzeheal","awakening","burnheal","iceheal","escaperope"],reqBadges:2,trainers:[]},
{id:"h_r_sea1",n:"105-109번수로",desc:"카이나시티 남쪽 해역",hasCenter:false,hasShop:false,lv:[5,35],pokemon:[{k:"tentacool",w:40},{k:"wingull",w:30},{k:"pelipper",w:15},{k:"wailmer",w:15}],reqBadges:2,trainers:[{n:"수영선수 아유미",em:"👤",pokemon:[{k:"tentacool",l:24},{k:"wingull",l:25}],reward:750},{n:"낚시꾼 테츠야",em:"👤",pokemon:[{k:"wailmer",l:26}],reward:780},{n:"수영선수 마야",em:"👤",pokemon:[{k:"tentacool",l:25},{k:"pelipper",l:27}],reward:810},{n:"낚시꾼 유타",em:"👤",pokemon:[{k:"wingull",l:26},{k:"wailmer",l:28}],reward:840}]},
{id:"h_r_ship",n:"버려진배",desc:"버려진 화물선 (ORAS: 시마우빌)",hasCenter:false,hasShop:false,lv:[25,35],pokemon:[{k:"tentacool",w:35},{k:"magnemite",w:20},{k:"magneton",w:10},{k:"grimer",w:15},{k:"muk",w:10},{k:"voltorb",w:10}],reqBadges:5,trainers:[{n:"선원 아키히로",em:"👤",pokemon:[{k:"machoke",l:28},{k:"tentacruel",l:29}],reward:870},{n:"선원 케이스케",em:"👤",pokemon:[{k:"magneton",l:30}],reward:900},{n:"다이버 마리",em:"👤",pokemon:[{k:"grimer",l:28},{k:"tentacruel",l:29}],reward:870},{n:"선원 하진",em:"👤",pokemon:[{k:"machoke",l:29},{k:"magneton",l:30}],reward:900},{n:"연구원 시호",em:"🔬",pokemon:[{k:"magneton",l:30},{k:"muk",l:31}],reward:930}]},
{id:"h_r9",n:"110번도로",desc:"110번도로",hasCenter:false,hasShop:false,lv:[12,16],pokemon:[{k:"zigzagoon",w:20},{k:"poochyena",w:15},{k:"wingull",w:15},{k:"oddish",w:15},{k:"gulpin",w:10},{k:"minun",w:8},{k:"plusle",w:7},{k:"electrike",w:10}],reqBadges:2,trainers:[{n:"기타리스트 아키토",em:"👤",pokemon:[{k:"electrike",l:13},{k:"plusle",l:14}],reward:420},{n:"배틀걸 아카네",em:"👤",pokemon:[{k:"oddish",l:14},{k:"gulpin",l:14}],reward:420},{n:"풀숲소년 타쿠야",em:"👤",pokemon:[{k:"zigzagoon",l:13},{k:"poochyena",l:14}],reward:420},{n:"짧은치마 소윤",em:"👤",pokemon:[{k:"minun",l:15}],reward:450},{n:"사이킥 슌지",em:"👤",pokemon:[{k:"wingull",l:14},{k:"oddish",l:15}],reward:450},{n:"포켓몬레인저 소라",em:"👤",pokemon:[{k:"electrike",l:14},{k:"gulpin",l:15},{k:"wingull",l:16}],reward:480}]},
{id:"h_c7",n:"키와시티",desc:"키와시티",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","superpotion","antidote","paralyzeheal","awakening","burnheal","iceheal","escaperope","xattack","xdefense","xspeed","direhit","guardspec"],reqBadges:2,trainers:[]},
{id:"h_r10",n:"117번도로",desc:"117번도로",hasCenter:false,hasShop:false,lv:[13,18],pokemon:[{k:"zigzagoon",w:25},{k:"oddish",w:20},{k:"marill",w:20},{k:"roselia",w:10},{k:"volbeat",w:10},{k:"illumise",w:10},{k:"seedot",w:10}],reqBadges:3,trainers:[{n:"풀숲소녀 나유",em:"👤",pokemon:[{k:"oddish",l:15},{k:"roselia",l:16}],reward:480},{n:"벌레잡이소년 카즈마",em:"👤",pokemon:[{k:"volbeat",l:15},{k:"illumise",l:15}],reward:450},{n:"풀숲소년 코우야",em:"👤",pokemon:[{k:"seedot",l:14},{k:"zigzagoon",l:15},{k:"marill",l:16}],reward:480},{n:"파라솔아가씨 카구라",em:"👤",pokemon:[{k:"roselia",l:17}],reward:510},{n:"포켓몬레인저 세이지",em:"👤",pokemon:[{k:"oddish",l:16},{k:"marill",l:17}],reward:510}]},
{id:"h_r_newmauville",n:"뉴키와시티",desc:"키와시티 지하 발전소",hasCenter:false,hasShop:false,lv:[22,26],pokemon:[{k:"voltorb",w:30},{k:"magnemite",w:30},{k:"electrode",w:15},{k:"magneton",w:15},{k:"electrike",w:10}],reqBadges:4,trainers:[{n:"과학자 코지",em:"👤",pokemon:[{k:"voltorb",l:22},{k:"magnemite",l:23}],reward:690},{n:"연구원 에리카",em:"👤",pokemon:[{k:"electrode",l:24}],reward:720},{n:"과학자 테츠지",em:"👤",pokemon:[{k:"magneton",l:24},{k:"voltorb",l:23}],reward:720},{n:"연구원 마사히로",em:"👤",pokemon:[{k:"magnemite",l:23},{k:"magneton",l:25},{k:"electrode",l:26}],reward:780}]},
{id:"h_c8",n:"시다케타운",desc:"시다케타운",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","superpotion","antidote","paralyzeheal","awakening","burnheal","iceheal","escaperope"],reqBadges:3,trainers:[]},
{id:"h_r11",n:"111번도로",desc:"111번도로",hasCenter:false,hasShop:false,lv:[19,22],pokemon:[{k:"sandshrew",w:35},{k:"trapinch",w:25},{k:"cacnea",w:20},{k:"baltoy",w:20},{k:"barboach",w:10}],reqBadges:3,trainers:[{n:"산악인 병철",em:"👤",pokemon:[{k:"sandshrew",l:20},{k:"trapinch",l:20}],reward:600},{n:"캠프파이어소녀 카요",em:"👤",pokemon:[{k:"cacnea",l:21}],reward:630},{n:"사이킥 하루키",em:"👤",pokemon:[{k:"baltoy",l:20},{k:"trapinch",l:21}],reward:630},{n:"등산가 케이스케",em:"👤",pokemon:[{k:"sandshrew",l:21},{k:"sandshrew",l:22}],reward:660},{n:"포켓몬레인저 유지",em:"👤",pokemon:[{k:"cacnea",l:20},{k:"baltoy",l:21},{k:"trapinch",l:22}],reward:660}]},
{id:"h_r12",n:"112번도로",desc:"112번도로",hasCenter:false,hasShop:false,lv:[15,18],pokemon:[{k:"numel",w:40},{k:"machop",w:30},{k:"marill",w:30},{k:"corphish",w:10}],reqBadges:3,trainers:[{n:"등산가 진우",em:"👤",pokemon:[{k:"numel",l:16},{k:"machop",l:16}],reward:480},{n:"캠프파이어소녀 센카",em:"👤",pokemon:[{k:"marill",l:17}],reward:510},{n:"블랙벨트 유키",em:"👤",pokemon:[{k:"machop",l:17},{k:"numel",l:18}],reward:540},{n:"산악인 아키라",em:"👤",pokemon:[{k:"numel",l:16},{k:"machop",l:17},{k:"marill",l:18}],reward:540}]},
{id:"h_r_jagged",n:"울퉁불퉁고개",desc:"굴뚝산에서 후엔타운으로 내려가는 길",hasCenter:false,hasShop:false,lv:[18,22],pokemon:[{k:"numel",w:35},{k:"machop",w:25},{k:"spoink",w:20},{k:"geodude",w:20}],reqBadges:3,trainers:[{n:"등산가 에릭",em:"👤",pokemon:[{k:"numel",l:19},{k:"machop",l:20}],reward:600},{n:"캠프파이어소녀 리사",em:"👤",pokemon:[{k:"numel",l:20},{k:"spoink",l:20}],reward:600},{n:"등산가 히로시",em:"👤",pokemon:[{k:"geodude",l:19},{k:"machop",l:20},{k:"numel",l:20}],reward:600}]},
{id:"h_r_chimney",n:"굴뚝산",desc:"활화산 꼭대기의 뜨거운 전장",hasCenter:false,hasShop:false,lv:[18,24],pokemon:[{k:"numel",w:35},{k:"machop",w:25},{k:"geodude",w:20},{k:"koffing",w:15},{k:"slugma",w:5}],reqBadges:3,trainers:[{n:"마그마단원 유키",em:"🔥",pokemon:[{k:"numel",l:20},{k:"poochyena",l:20}],reward:600},{n:"마그마단원 호시",em:"🔥",pokemon:[{k:"numel",l:21},{k:"zubat",l:21}],reward:630},{n:"마그마단원 카이",em:"🔥",pokemon:[{k:"numel",l:22}],reward:660},{n:"마그마단 간부",em:"🔥",pokemon:[{k:"camerupt",l:24},{k:"mightyena",l:24}],reward:720}]},
{id:"h_r13",n:"화염의 빗길",desc:"화염의 빗길",hasCenter:false,hasShop:false,lv:[15,18],pokemon:[{k:"numel",w:25},{k:"koffing",w:20},{k:"grimer",w:15},{k:"slugma",w:20},{k:"torkoal",w:5},{k:"machop",w:15}],reqBadges:3,trainers:[{n:"등산가 타이시키",em:"👤",pokemon:[{k:"numel",l:16},{k:"slugma",l:16}],reward:480},{n:"블랙벨트 타츠히로",em:"👤",pokemon:[{k:"machop",l:17}],reward:510},{n:"캠프파이어소녀 레이린",em:"👤",pokemon:[{k:"koffing",l:16},{k:"grimer",l:17}],reward:510},{n:"산악인 무네쿤",em:"👤",pokemon:[{k:"slugma",l:17},{k:"torkoal",l:18}],reward:540},{n:"등산가 다이세이",em:"👤",pokemon:[{k:"numel",l:16},{k:"machop",l:17},{k:"slugma",l:18}],reward:540}]},
{id:"h_r14",n:"113번도로",desc:"113번도로",hasCenter:false,hasShop:false,lv:[15,18],pokemon:[{k:"spinda",w:35},{k:"skarmory",w:10},{k:"sandshrew",w:30},{k:"slugma",w:25}],reqBadges:3,trainers:[{n:"산악인 코우스케",em:"👤",pokemon:[{k:"sandshrew",l:16},{k:"spinda",l:17}],reward:510},{n:"풀숲소녀 치카",em:"👤",pokemon:[{k:"spinda",l:17}],reward:510},{n:"등산가 토모야",em:"👤",pokemon:[{k:"slugma",l:16},{k:"sandshrew",l:17}],reward:510},{n:"조류연구가 미사키",em:"👤",pokemon:[{k:"skarmory",l:18}],reward:540}]},
{id:"h_c9",n:"하지쓰게타운",desc:"하지쓰게타운",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","superpotion","antidote","paralyzeheal","awakening","burnheal","iceheal","escaperope"],reqBadges:3,trainers:[]},
{id:"h_r15",n:"114번도로",desc:"114번도로",hasCenter:false,hasShop:false,lv:[16,19],pokemon:[{k:"swablu",w:20},{k:"lotad",w:15},{k:"seedot",w:15},{k:"lombre",w:10},{k:"nuzleaf",w:10},{k:"zangoose",w:15},{k:"seviper",w:15}],reqBadges:3,trainers:[{n:"풀숲소년 아키히로",em:"👤",pokemon:[{k:"seedot",l:17},{k:"lotad",l:17}],reward:510},{n:"캠프파이어소녀 하루카",em:"👤",pokemon:[{k:"swablu",l:18}],reward:540},{n:"포켓몬레인저 토오루",em:"👤",pokemon:[{k:"zangoose",l:18},{k:"seviper",l:18}],reward:540},{n:"풀숲소녀 코마치",em:"👤",pokemon:[{k:"lombre",l:17},{k:"nuzleaf",l:18}],reward:540},{n:"등산가 유세이",em:"👤",pokemon:[{k:"swablu",l:18},{k:"seedot",l:19}],reward:570}]},
{id:"h_r16",n:"유성폭포",desc:"유성폭포",hasCenter:false,hasShop:false,lv:[16,40],pokemon:[{k:"zubat",w:35},{k:"golbat",w:25},{k:"solrock",w:18},{k:"lunatone",w:17},{k:"bagon",w:5},{k:"carvanha",w:10}],reqBadges:3,trainers:[{n:"사이킥 윤호",em:"👤",pokemon:[{k:"solrock",l:18},{k:"lunatone",l:18}],reward:540},{n:"산악인 타이세이",em:"👤",pokemon:[{k:"zubat",l:20},{k:"golbat",l:25}],reward:750},{n:"등산가 미센",em:"👤",pokemon:[{k:"solrock",l:25}],reward:750},{n:"블랙벨트 고이치",em:"👤",pokemon:[{k:"golbat",l:30},{k:"lunatone",l:30}],reward:900},{n:"포켓몬레인저 쇼우",em:"👤",pokemon:[{k:"golbat",l:34},{k:"bagon",l:35}],reward:1050}]},
{id:"h_c10",n:"후엔타운",desc:"후엔타운",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","superpotion","hyperpotion","antidote","paralyzeheal","awakening","burnheal","iceheal","escaperope","revive"],reqBadges:3,trainers:[]},
{id:"h_r17",n:"115번도로",desc:"115번도로",hasCenter:false,hasShop:false,lv:[23,26],pokemon:[{k:"swablu",w:30},{k:"wingull",w:30},{k:"taillow",w:25},{k:"jigglypuff",w:15}],reqBadges:4,trainers:[{n:"배틀걸 유나",em:"👤",pokemon:[{k:"swablu",l:24},{k:"jigglypuff",l:24}],reward:720},{n:"조류연구가 나루토",em:"👤",pokemon:[{k:"wingull",l:23},{k:"taillow",l:24}],reward:720},{n:"풀숲소년 나오",em:"👤",pokemon:[{k:"swablu",l:25}],reward:750},{n:"파라솔아가씨 사린",em:"👤",pokemon:[{k:"wingull",l:24},{k:"jigglypuff",l:25}],reward:750},{n:"포켓몬레인저 하늘",em:"👤",pokemon:[{k:"taillow",l:24},{k:"swablu",l:25},{k:"wingull",l:26}],reward:780}]},
{id:"h_r18",n:"118번도로",desc:"118번도로",hasCenter:false,hasShop:false,lv:[24,28],pokemon:[{k:"zigzagoon",w:25},{k:"linoone",w:20},{k:"wingull",w:20},{k:"electrike",w:15},{k:"manectric",w:15},{k:"kecleon",w:5}],reqBadges:4,trainers:[{n:"기타리스트 성우",em:"👤",pokemon:[{k:"electrike",l:25},{k:"manectric",l:26}],reward:780},{n:"낚시꾼 무네하루",em:"👤",pokemon:[{k:"wingull",l:26}],reward:780},{n:"배틀걸 시즈쿠",em:"👤",pokemon:[{k:"linoone",l:26},{k:"kecleon",l:27}],reward:810},{n:"풀숲소년 시아키",em:"👤",pokemon:[{k:"zigzagoon",l:25},{k:"electrike",l:26}],reward:780},{n:"포켓몬레인저 서윤",em:"👤",pokemon:[{k:"manectric",l:27},{k:"linoone",l:28}],reward:840}]},
{id:"h_r19",n:"119번도로",desc:"119번도로",hasCenter:false,hasShop:false,lv:[25,29],pokemon:[{k:"zigzagoon",w:30},{k:"linoone",w:23},{k:"oddish",w:23},{k:"tropius",w:8},{k:"kecleon",w:7},{k:"feebas",w:2},{k:"castform",w:3},{k:"treecko",w:3},{k:"torchic",w:3},{k:"mudkip",w:3}],reqBadges:5,trainers:[{n:"풀숲소년 슌지",em:"👤",pokemon:[{k:"zigzagoon",l:26},{k:"oddish",l:27}],reward:810},{n:"조류연구가 메구미",em:"👤",pokemon:[{k:"tropius",l:28}],reward:840},{n:"배틀걸 치카즈",em:"👤",pokemon:[{k:"linoone",l:27},{k:"kecleon",l:28}],reward:840},{n:"포켓몬레인저 타이치",em:"👤",pokemon:[{k:"oddish",l:27},{k:"tropius",l:28}],reward:840},{n:"풀숲소녀 레이지",em:"👤",pokemon:[{k:"zigzagoon",l:26},{k:"linoone",l:28}],reward:840},{n:"사이킥 사에코",em:"👤",pokemon:[{k:"kecleon",l:29}],reward:870}]},
{id:"h_c11",n:"히와마키시티",desc:"히와마키시티",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","ultraball","hyperpotion","antidote","paralyzeheal","awakening","burnheal","iceheal","escaperope"],reqBadges:5,trainers:[]},
{id:"h_r20",n:"120번도로",desc:"120번도로",hasCenter:false,hasShop:false,lv:[25,29],pokemon:[{k:"zigzagoon",w:25},{k:"linoone",w:20},{k:"oddish",w:25},{k:"marill",w:20},{k:"absol",w:5},{k:"kecleon",w:5}],reqBadges:6,trainers:[{n:"풀숲소년 유빈",em:"👤",pokemon:[{k:"zigzagoon",l:26},{k:"oddish",l:27}],reward:810},{n:"사이킥 카즈에",em:"👤",pokemon:[{k:"absol",l:28}],reward:840},{n:"배틀걸 유빈",em:"👤",pokemon:[{k:"linoone",l:27},{k:"marill",l:28}],reward:840},{n:"포켓몬레인저 민혁",em:"👤",pokemon:[{k:"oddish",l:27},{k:"kecleon",l:28}],reward:840},{n:"파라솔아가씨 스즈",em:"👤",pokemon:[{k:"linoone",l:28},{k:"absol",l:29}],reward:870}]},
{id:"h_r21",n:"121번도로",desc:"121번도로",hasCenter:false,hasShop:false,lv:[26,30],pokemon:[{k:"zigzagoon",w:20},{k:"linoone",w:15},{k:"oddish",w:15},{k:"gloom",w:10},{k:"wingull",w:15},{k:"kecleon",w:5},{k:"shuppet",w:10},{k:"duskull",w:10}],reqBadges:6,trainers:[{n:"사이킥 유토",em:"👤",pokemon:[{k:"shuppet",l:27},{k:"duskull",l:28}],reward:840},{n:"풀숲소녀 시안",em:"👤",pokemon:[{k:"oddish",l:28},{k:"gloom",l:29}],reward:870},{n:"기타리스트 코우이치",em:"👤",pokemon:[{k:"zigzagoon",l:27},{k:"linoone",l:28}],reward:840},{n:"배틀걸 하루에",em:"👤",pokemon:[{k:"wingull",l:28},{k:"kecleon",l:29}],reward:870},{n:"캠프파이어소녀 시즈카",em:"👤",pokemon:[{k:"shuppet",l:28},{k:"duskull",l:29}],reward:870},{n:"포켓몬레인저 슌세이",em:"👤",pokemon:[{k:"linoone",l:28},{k:"gloom",l:29},{k:"wingull",l:30}],reward:900}]},
{id:"h_r_safari",n:"사파리존",desc:"다양한 야생 포켓몬이 사는 보호구역",hasCenter:false,hasShop:false,lv:[25,40],pokemon:[{k:"pikachu",w:10},{k:"oddish",w:10},{k:"gloom",w:8},{k:"doduo",w:10},{k:"dodrio",w:5},{k:"rhyhorn",w:8},{k:"pinsir",w:5},{k:"girafarig",w:8},{k:"wobbuffet",w:5},{k:"heracross",w:5},{k:"miltank",w:5},{k:"natu",w:8},{k:"xatu",w:5},{k:"mareep",w:8}],reqBadges:6,trainers:[{n:"레인저 카즈마",em:"🌿",pokemon:[{k:"dodrio",l:32},{k:"heracross",l:33}],reward:990},{n:"레인저 미키",em:"🌿",pokemon:[{k:"pinsir",l:32},{k:"miltank",l:33}],reward:990},{n:"레인저 료",em:"🌿",pokemon:[{k:"rhyhorn",l:33},{k:"xatu",l:34}],reward:1020},{n:"레인저 사쿠라",em:"🌿",pokemon:[{k:"girafarig",l:33},{k:"gloom",l:32}],reward:990}]},
{id:"h_r_122",n:"122번수로",desc:"영봉산으로 가는 수로",hasCenter:false,hasShop:false,lv:[25,30],pokemon:[{k:"tentacool",w:40},{k:"wingull",w:30},{k:"pelipper",w:15},{k:"wailmer",w:10},{k:"sharpedo",w:5}],reqBadges:6,trainers:[{n:"수영선수 카오루",em:"👤",pokemon:[{k:"tentacool",l:27},{k:"wingull",l:28}],reward:840},{n:"낚시꾼 사이토",em:"👤",pokemon:[{k:"wailmer",l:28},{k:"sharpedo",l:29}],reward:870},{n:"수영선수 나미",em:"👤",pokemon:[{k:"pelipper",l:29},{k:"tentacool",l:28}],reward:870}]},
{id:"h_r_123",n:"123번도로",desc:"미나모시티 서쪽 도로",hasCenter:false,hasShop:false,lv:[26,30],pokemon:[{k:"oddish",w:20},{k:"gloom",w:15},{k:"wingull",w:15},{k:"linoone",w:15},{k:"kecleon",w:5},{k:"shuppet",w:10},{k:"duskull",w:10},{k:"absol",w:3},{k:"mightyena",w:7}],reqBadges:6,trainers:[{n:"풀숲소녀 유이",em:"👤",pokemon:[{k:"oddish",l:27},{k:"gloom",l:28}],reward:840},{n:"사이킥 아키토",em:"👤",pokemon:[{k:"shuppet",l:28},{k:"duskull",l:28}],reward:840},{n:"배틀걸 시오리",em:"👤",pokemon:[{k:"linoone",l:28},{k:"kecleon",l:29}],reward:870},{n:"풀숲소년 쇼타",em:"👤",pokemon:[{k:"oddish",l:27},{k:"gloom",l:29}],reward:870},{n:"포켓몬레인저 히카리",em:"👤",pokemon:[{k:"mightyena",l:29},{k:"absol",l:30}],reward:900}]},
{id:"h_c12",n:"미나모시티",desc:"미나모시티",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","hyperpotion","fullrestore","fullheal","revive"],reqBadges:6,trainers:[]},
{id:"h_r22",n:"송화산",desc:"포켓몬의 영혼이 잠들어 있는 산",hasCenter:false,hasShop:false,lv:[24,32],pokemon:[{k:"shuppet",w:30},{k:"duskull",w:30},{k:"vulpix",w:15},{k:"wingull",w:10},{k:"chimecho",w:5},{k:"meditite",w:10}],reqBadges:6,trainers:[{n:"사이킥 마코토",em:"👤",pokemon:[{k:"shuppet",l:26},{k:"duskull",l:27}],reward:810},{n:"등산가 쿄타로",em:"👤",pokemon:[{k:"vulpix",l:28},{k:"meditite",l:28}],reward:840},{n:"캠프파이어소녀 아오이",em:"👤",pokemon:[{k:"chimecho",l:29}],reward:870},{n:"산악인 마사루",em:"👤",pokemon:[{k:"meditite",l:28},{k:"shuppet",l:30}],reward:900},{n:"포켓몬레인저 세이야",em:"👤",pokemon:[{k:"duskull",l:29},{k:"vulpix",l:30},{k:"wingull",l:31}],reward:930}]},
{id:"h_r_slab",n:"그을린바위",desc:"뜨거운 열기가 느껴지는 바위 속 공간",hasCenter:false,hasShop:false,lv:[25,38],pokemon:[{k:"zubat",w:30},{k:"golbat",w:25},{k:"numel",w:20},{k:"slugma",w:15},{k:"magcargo",w:10}],reqBadges:6,trainers:[{n:"등산가 코이치",em:"👤",pokemon:[{k:"numel",l:30},{k:"golbat",l:31}],reward:930},{n:"캠프파이어소녀 미사키",em:"👤",pokemon:[{k:"slugma",l:30},{k:"magcargo",l:32}],reward:960},{n:"블랙벨트 료",em:"👤",pokemon:[{k:"golbat",l:32}],reward:960}]},
{id:"h_r23",n:"124번수로",desc:"124번수로",hasCenter:false,hasShop:false,lv:[25,35],pokemon:[{k:"tentacool",w:40},{k:"wingull",w:35},{k:"pelipper",w:25},{k:"lileep",w:3},{k:"anorith",w:3}],reqBadges:6,trainers:[{n:"수영선수 쇼고",em:"👤",pokemon:[{k:"tentacool",l:28},{k:"wingull",l:29}],reward:870},{n:"낚시꾼 유시게",em:"👤",pokemon:[{k:"tentacool",l:30}],reward:900},{n:"수영선수 세이카",em:"👤",pokemon:[{k:"pelipper",l:30},{k:"tentacool",l:28}],reward:900},{n:"파라솔아가씨 은비",em:"👤",pokemon:[{k:"wingull",l:29},{k:"pelipper",l:31}],reward:930},{n:"낚시꾼 시게루",em:"👤",pokemon:[{k:"tentacool",l:30},{k:"tentacool",l:32},{k:"pelipper",l:33}],reward:990}]},
{id:"h_r_125",n:"125번수로",desc:"토쿠사네시티 북쪽 해역",hasCenter:false,hasShop:false,lv:[28,33],pokemon:[{k:"tentacool",w:40},{k:"wingull",w:30},{k:"pelipper",w:15},{k:"wailmer",w:15}],reqBadges:6,trainers:[{n:"수영선수 히로",em:"👤",pokemon:[{k:"tentacool",l:29},{k:"pelipper",l:30}],reward:900},{n:"낚시꾼 켄이치",em:"👤",pokemon:[{k:"wailmer",l:31},{k:"wingull",l:30}],reward:930},{n:"수영선수 아야카",em:"👤",pokemon:[{k:"pelipper",l:31},{k:"tentacool",l:30}],reward:930}]},
{id:"h_r_126",n:"126번수로",desc:"해저동굴로 가는 수로",hasCenter:false,hasShop:false,lv:[28,35],pokemon:[{k:"tentacool",w:35},{k:"wingull",w:25},{k:"pelipper",w:15},{k:"wailmer",w:15},{k:"sharpedo",w:10}],reqBadges:7,trainers:[{n:"수영선수 카즈야",em:"👤",pokemon:[{k:"tentacool",l:30},{k:"sharpedo",l:32}],reward:960},{n:"낚시꾼 무네하루",em:"👤",pokemon:[{k:"wailmer",l:31},{k:"pelipper",l:31}],reward:930},{n:"수영선수 리에",em:"👤",pokemon:[{k:"sharpedo",l:33}],reward:990},{n:"낚시꾼 세이지",em:"👤",pokemon:[{k:"tentacool",l:31},{k:"wailmer",l:33},{k:"wingull",l:30}],reward:990}]},
{id:"h_r_127",n:"127번수로",desc:"127번수로",hasCenter:false,hasShop:false,lv:[25,35],pokemon:[{k:"tentacool",w:30},{k:"wingull",w:20},{k:"pelipper",w:15},{k:"wailmer",w:20},{k:"sharpedo",w:10},{k:"staryu",w:5}],reqBadges:7,trainers:[{n:"수영선수 유카",em:"👤",pokemon:[{k:"tentacruel",l:30},{k:"pelipper",l:31}],reward:930},{n:"수영선수 코지",em:"👤",pokemon:[{k:"sharpedo",l:32}],reward:960},{n:"낚시꾼 키미히로",em:"👤",pokemon:[{k:"wailmer",l:30},{k:"wailmer",l:31},{k:"staryu",l:32}],reward:960},{n:"수영선수 마리카",em:"👤",pokemon:[{k:"pelipper",l:31},{k:"tentacruel",l:32}],reward:960}]},
{id:"h_c13",n:"토쿠사네시티",desc:"토쿠사네시티",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","hyperpotion","fullrestore","fullheal","revive"],reqBadges:6,trainers:[]},
{id:"h_r24",n:"갯바위동굴",desc:"갯바위동굴",hasCenter:false,hasShop:false,lv:[26,32],pokemon:[{k:"zubat",w:30},{k:"golbat",w:25},{k:"spheal",w:20},{k:"sealeo",w:10},{k:"snorunt",w:15}],reqBadges:7,trainers:[{n:"등산가 세이야",em:"👤",pokemon:[{k:"spheal",l:28},{k:"zubat",l:27}],reward:840},{n:"산악인 쇼이치",em:"👤",pokemon:[{k:"golbat",l:29},{k:"spheal",l:30}],reward:900},{n:"블랙벨트 유지",em:"👤",pokemon:[{k:"sealeo",l:30}],reward:900},{n:"등산가 쿄지",em:"👤",pokemon:[{k:"snorunt",l:29},{k:"spheal",l:30}],reward:900},{n:"포켓몬레인저 치에",em:"👤",pokemon:[{k:"golbat",l:30},{k:"sealeo",l:31},{k:"snorunt",l:32}],reward:960}]},
{id:"h_r25",n:"해저동굴",desc:"해저동굴",hasCenter:false,hasShop:false,lv:[30,35],pokemon:[{k:"zubat",w:30},{k:"golbat",w:25},{k:"geodude",w:25},{k:"graveler",w:20}],reqBadges:7,trainers:[{n:"등산가 신지",em:"👤",pokemon:[{k:"zubat",l:31},{k:"geodude",l:32}],reward:960},{n:"산악인 카즈테츠",em:"👤",pokemon:[{k:"graveler",l:33}],reward:990},{n:"블랙벨트 모토히로",em:"👤",pokemon:[{k:"golbat",l:32},{k:"graveler",l:33}],reward:990},{n:"등산가 메구루",em:"👤",pokemon:[{k:"geodude",l:32},{k:"golbat",l:34}],reward:1020},{n:"포켓몬레인저 노부히코",em:"👤",pokemon:[{k:"golbat",l:33},{k:"graveler",l:34},{k:"geodude",l:32}],reward:1020}]},
{id:"h_c14",n:"루네시티",desc:"루네시티",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","hyperpotion","fullrestore","fullheal","revive"],reqBadges:7,trainers:[]},
{id:"h_r_sea2",n:"128-131번수로",desc:"사이유우시티로 가는 해역",hasCenter:false,hasShop:false,lv:[30,40],pokemon:[{k:"tentacool",w:30},{k:"tentacruel",w:15},{k:"wingull",w:20},{k:"pelipper",w:15},{k:"wailmer",w:10},{k:"sharpedo",w:10}],reqBadges:7,trainers:[{n:"수영선수 타카시",em:"👤",pokemon:[{k:"tentacruel",l:33},{k:"pelipper",l:34}],reward:1020},{n:"낚시꾼 유지",em:"👤",pokemon:[{k:"wailmer",l:34},{k:"sharpedo",l:35}],reward:1050},{n:"수영선수 미나코",em:"👤",pokemon:[{k:"tentacruel",l:35},{k:"sharpedo",l:36}],reward:1080},{n:"낚시꾼 호세이",em:"👤",pokemon:[{k:"pelipper",l:35},{k:"wailmer",l:36},{k:"tentacruel",l:37}],reward:1110}]},
{id:"h_c_pacifidlog",n:"키나기타운",desc:"바다 위에 떠 있는 뗏목 마을",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","ultraball","hyperpotion","fullheal","revive"],reqBadges:7,trainers:[]},
{id:"h_r_132",n:"132번수로",desc:"급류가 흐르는 수로",hasCenter:false,hasShop:false,lv:[25,35],pokemon:[{k:"tentacool",w:30},{k:"wingull",w:25},{k:"pelipper",w:15},{k:"wailmer",w:20},{k:"horsea",w:10}],reqBadges:7,trainers:[{n:"수영선수 타쿠야",em:"👤",pokemon:[{k:"tentacruel",l:31},{k:"wailmer",l:32}],reward:960},{n:"수영선수 에미",em:"👤",pokemon:[{k:"pelipper",l:32},{k:"horsea",l:31}],reward:930},{n:"트라이애슬리트 켄",em:"👤",pokemon:[{k:"staryu",l:33}],reward:990}]},
{id:"h_r_133",n:"133번수로",desc:"133번수로",hasCenter:false,hasShop:false,lv:[25,35],pokemon:[{k:"tentacool",w:30},{k:"wingull",w:25},{k:"pelipper",w:15},{k:"wailmer",w:15},{k:"horsea",w:10},{k:"sharpedo",w:5}],reqBadges:7,trainers:[{n:"수영선수 유이",em:"👤",pokemon:[{k:"sharpedo",l:33}],reward:990},{n:"수영선수 료타",em:"👤",pokemon:[{k:"tentacruel",l:32},{k:"pelipper",l:33}],reward:990},{n:"낚시꾼 타이세이",em:"👤",pokemon:[{k:"wailmer",l:33},{k:"horsea",l:32}],reward:960}]},
{id:"h_r_134",n:"134번수로",desc:"해류에 의해 강하게 흐르는 수로",hasCenter:false,hasShop:false,lv:[25,35],pokemon:[{k:"tentacool",w:30},{k:"wingull",w:20},{k:"pelipper",w:15},{k:"wailmer",w:15},{k:"horsea",w:10},{k:"relicanth",w:5},{k:"corsola",w:5}],reqBadges:7,trainers:[{n:"수영선수 키호",em:"👤",pokemon:[{k:"pelipper",l:33},{k:"tentacruel",l:34}],reward:1020},{n:"다이버 소라",em:"👤",pokemon:[{k:"horsea",l:32},{k:"clamperl",l:33},{k:"relicanth",l:34}],reward:1020},{n:"수영선수 나호",em:"👤",pokemon:[{k:"sharpedo",l:34}],reward:1020},{n:"낚시꾼 무토",em:"👤",pokemon:[{k:"wailmer",l:33},{k:"corsola",l:34}],reward:1020}]},
{id:"h_r_sealed",n:"봉인의석실",desc:"고대 레지 포켓몬의 봉인이 잠든 곳",hasCenter:false,hasShop:false,lv:[30,40],pokemon:[{k:"zubat",w:30},{k:"golbat",w:25},{k:"geodude",w:20},{k:"graveler",w:15},{k:"relicanth",w:5},{k:"wailord",w:5}],reqBadges:7,trainers:[{n:"유적매니아 겐타",em:"🔬",pokemon:[{k:"golbat",l:35},{k:"graveler",l:36}],reward:1080},{n:"유적매니아 사오리",em:"🔬",pokemon:[{k:"relicanth",l:36},{k:"golbat",l:37}],reward:1110},{n:"유적매니아 타카시",em:"🔬",pokemon:[{k:"graveler",l:36},{k:"geodude",l:35},{k:"golbat",l:37}],reward:1110}]},
{id:"h_r_desert_ruins",n:"사막유적",desc:"레지락이 봉인된 사막의 유적",hasCenter:false,hasShop:false,lv:[35,40],pokemon:[{k:"sandshrew",w:30},{k:"sandslash",w:20},{k:"trapinch",w:20},{k:"baltoy",w:15},{k:"claydol",w:10},{k:"cacturne",w:5}],reqBadges:7,trainers:[{n:"유적매니아 진",em:"🔬",pokemon:[{k:"claydol",l:37},{k:"sandslash",l:38}],reward:1140},{n:"유적매니아 사이코",em:"🔬",pokemon:[{k:"baltoy",l:36},{k:"claydol",l:38}],reward:1140}]},
{id:"h_r_island_cave",n:"섬의동굴",desc:"레지아이스가 봉인된 외딴 섬의 동굴",hasCenter:false,hasShop:false,lv:[35,40],pokemon:[{k:"zubat",w:30},{k:"golbat",w:20},{k:"spheal",w:20},{k:"sealeo",w:15},{k:"snorunt",w:10},{k:"glalie",w:5}],reqBadges:7,trainers:[{n:"유적매니아 코지",em:"🔬",pokemon:[{k:"sealeo",l:37},{k:"golbat",l:38}],reward:1140},{n:"유적매니아 유미코",em:"🔬",pokemon:[{k:"glalie",l:38},{k:"snorunt",l:36}],reward:1140}]},
{id:"h_r_ancient_tomb",n:"고대의무덤",desc:"레지스틸이 봉인된 고대 무덤",hasCenter:false,hasShop:false,lv:[35,40],pokemon:[{k:"zubat",w:30},{k:"golbat",w:20},{k:"geodude",w:20},{k:"graveler",w:15},{k:"aron",w:10},{k:"lairon",w:5}],reqBadges:7,trainers:[{n:"유적매니아 테츠",em:"🔬",pokemon:[{k:"lairon",l:37},{k:"golbat",l:38}],reward:1140},{n:"유적매니아 미카",em:"🔬",pokemon:[{k:"aron",l:36},{k:"graveler",l:37},{k:"lairon",l:38}],reward:1140}]},
{id:"h_r26",n:"기원의동굴",desc:"기원의동굴",hasCenter:false,hasShop:false,lv:[30,40],pokemon:[{k:"zubat",w:30},{k:"golbat",w:25},{k:"geodude",w:25},{k:"graveler",w:20},{k:"beldum",w:3}],reqBadges:7,trainers:[{n:"등산가 무네지",em:"👤",pokemon:[{k:"zubat",l:32},{k:"geodude",l:34}],reward:1020},{n:"산악인 마사호",em:"👤",pokemon:[{k:"golbat",l:35},{k:"graveler",l:36}],reward:1080},{n:"사이킥 하린",em:"👤",pokemon:[{k:"golbat",l:36}],reward:1080},{n:"블랙벨트 무사시",em:"👤",pokemon:[{k:"graveler",l:35},{k:"golbat",l:37}],reward:1110},{n:"포켓몬레인저 유우마",em:"👤",pokemon:[{k:"golbat",l:36},{k:"graveler",l:37},{k:"geodude",l:35}],reward:1110}]},
{id:"h_r27",n:"챔피언로드",desc:"챔피언로드",hasCenter:false,hasShop:false,lv:[36,44],pokemon:[{k:"golbat",w:25},{k:"graveler",w:20},{k:"lairon",w:15},{k:"hariyama",w:15},{k:"medicham",w:15},{k:"loudred",w:10}],reqBadges:8,trainers:[{n:"블랙벨트 타카시",em:"👤",pokemon:[{k:"hariyama",l:38},{k:"medicham",l:38}],reward:1140},{n:"등산가 카쿠지",em:"👤",pokemon:[{k:"graveler",l:39},{k:"lairon",l:40}],reward:1200},{n:"사이킥 소이치",em:"👤",pokemon:[{k:"medicham",l:40}],reward:1200},{n:"배틀걸 사에",em:"👤",pokemon:[{k:"hariyama",l:40},{k:"loudred",l:41}],reward:1230},{n:"산악인 대길",em:"👤",pokemon:[{k:"lairon",l:41},{k:"golbat",l:42}],reward:1260},{n:"포켓몬레인저 은총",em:"👤",pokemon:[{k:"golbat",l:42},{k:"graveler",l:43},{k:"medicham",l:43}],reward:1290},{n:"블랙벨트 태웅",em:"👤",pokemon:[{k:"hariyama",l:43},{k:"lairon",l:44}],reward:1320}]},
{id:"h_c15",n:"사이유우시티",desc:"사이유우시티",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","maxpotion","fullrestore","fullheal","revive"],reqBadges:8,trainers:[]},
{id:"h_r28",n:"공중의기둥",desc:"공중의기둥",hasCenter:false,hasShop:false,lv:[34,55],pokemon:[{k:"golbat",w:25},{k:"claydol",w:20},{k:"banette",w:20},{k:"altaria",w:15},{k:"dusclops",w:15},{k:"sableye",w:5}],reqBadges:8,trainers:[{n:"사이킥 지원",em:"👤",pokemon:[{k:"claydol",l:40},{k:"banette",l:42}],reward:1260},{n:"등산가 헤이지",em:"👤",pokemon:[{k:"golbat",l:42},{k:"altaria",l:44}],reward:1320},{n:"배틀걸 나레",em:"👤",pokemon:[{k:"dusclops",l:44},{k:"banette",l:45}],reward:1350},{n:"포켓몬레인저 시온",em:"👤",pokemon:[{k:"altaria",l:45},{k:"claydol",l:46}],reward:1380},{n:"블랙벨트 무사시",em:"👤",pokemon:[{k:"golbat",l:46},{k:"dusclops",l:48}],reward:1440},{n:"산악인 카쿠스이",em:"👤",pokemon:[{k:"banette",l:48},{k:"sableye",l:50},{k:"altaria",l:52}],reward:1560}]}
]},
sinnoh: {
    n: "신오지방", em: "⛰️",
    roads: [
{id:"s_c1",n:"후타바타운",desc:"시작을 알리는 바람의 마을",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote"],reqBadges:0,trainers:[]},
{id:"s_r1",n:"201번도로",desc:"후타바타운~마사고타운",hasCenter:false,hasShop:false,lv:[2,4],pokemon:[{k:"starly",w:40},{k:"bidoof",w:40},{k:"kricketot",w:20},{k:"turtwig",w:2},{k:"chimchar",w:2},{k:"piplup",w:2}],reqBadges:0,trainers:[{n:"풀숲소년 사토시",em:"👤",pokemon:[{k:"starly",l:3}],reward:90},{n:"짧은치마 사쿠라",em:"👤",pokemon:[{k:"bidoof",l:3}],reward:90},{n:"벌레잡이소년 타이호",em:"👤",pokemon:[{k:"kricketot",l:2},{k:"starly",l:3}],reward:90},{n:"캠프파이어소녀 유이",em:"👤",pokemon:[{k:"bidoof",l:4}],reward:120}]},
{id:"s_c2",n:"마사고타운",desc:"무언가가 희미하게 시작되는 곳",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote"],reqBadges:0,trainers:[]},
{id:"s_r2",n:"202번도로",desc:"마사고타운~코토부키시티",hasCenter:false,hasShop:false,lv:[2,4],pokemon:[{k:"starly",w:30},{k:"bidoof",w:30},{k:"shinx",w:25},{k:"kricketot",w:15},{k:"turtwig",w:2},{k:"chimchar",w:2},{k:"piplup",w:2}],reqBadges:0,trainers:[{n:"풀숲소년 진우",em:"👤",pokemon:[{k:"shinx",l:3}],reward:90},{n:"짧은치마 카즈미",em:"👤",pokemon:[{k:"starly",l:3},{k:"bidoof",l:3}],reward:90},{n:"벌레잡이소년 료우",em:"👤",pokemon:[{k:"kricketot",l:4}],reward:120},{n:"풀숲소녀 하루카",em:"👤",pokemon:[{k:"bidoof",l:2},{k:"shinx",l:4}],reward:120}]},
{id:"s_c3",n:"코토부키시티",desc:"사람들이 활기차게 살아가는 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote"],reqBadges:0,trainers:[]},
{id:"s_r3",n:"203번도로",desc:"코토부키시티~쿠로가네시티",hasCenter:false,hasShop:false,lv:[4,7],pokemon:[{k:"starly",w:25},{k:"shinx",w:20},{k:"bidoof",w:25},{k:"abra",w:5},{k:"kricketot",w:15},{k:"zubat",w:10}],reqBadges:0,trainers:[{n:"풀숲소년 슌스케",em:"👤",pokemon:[{k:"starly",l:5},{k:"shinx",l:5}],reward:150},{n:"짧은치마 레이린",em:"👤",pokemon:[{k:"bidoof",l:6}],reward:180},{n:"사이킥 미치",em:"👤",pokemon:[{k:"abra",l:5}],reward:150},{n:"벌레잡이소년 코우야",em:"👤",pokemon:[{k:"kricketot",l:4},{k:"zubat",l:5}],reward:150},{n:"등산가 철호",em:"👤",pokemon:[{k:"bidoof",l:6},{k:"starly",l:7}],reward:210}]},
{id:"s_r4",n:"무쇠게이트",desc:"쿠로가네시티로 향하는 동굴 통로",hasCenter:false,hasShop:false,lv:[5,8],pokemon:[{k:"zubat",w:40},{k:"geodude",w:35},{k:"psyduck",w:25},{k:"burmy",w:8}],reqBadges:0,trainers:[{n:"등산가 무네테츠",em:"👤",pokemon:[{k:"geodude",l:6},{k:"zubat",l:6}],reward:180},{n:"캠프파이어소녀 보라",em:"👤",pokemon:[{k:"psyduck",l:7}],reward:210},{n:"풀숲소년 다이세이",em:"👤",pokemon:[{k:"zubat",l:7},{k:"geodude",l:8}],reward:240},{n:"산악인 마코토",em:"👤",pokemon:[{k:"geodude",l:5},{k:"zubat",l:6},{k:"psyduck",l:7}],reward:210}]},
{id:"s_c4",n:"쿠로가네시티",desc:"자연과 과학의 융합을 추구하는 마을",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote"],reqBadges:0,trainers:[]},
{id:"s_r5",n:"무쇠탄갱",desc:"화석이 발굴되는 광산",hasCenter:false,hasShop:false,lv:[5,10],pokemon:[{k:"zubat",w:40},{k:"geodude",w:40},{k:"onix",w:20},{k:"cranidos",w:5},{k:"rampardos",w:2},{k:"shieldon",w:5},{k:"bastiodon",w:2}],reqBadges:0,trainers:[{n:"등산가 세이치로",em:"👤",pokemon:[{k:"geodude",l:7},{k:"geodude",l:8}],reward:240},{n:"산악인 용호",em:"👤",pokemon:[{k:"onix",l:8}],reward:240},{n:"블랙벨트 마사지",em:"👤",pokemon:[{k:"geodude",l:6},{k:"zubat",l:7}],reward:210},{n:"경비원 하야토",em:"👤",pokemon:[{k:"zubat",l:8},{k:"geodude",l:9}],reward:270},{n:"연구원 미유",em:"👤",pokemon:[{k:"zubat",l:7},{k:"geodude",l:8},{k:"onix",l:10}],reward:300}]},
{id:"s_r6",n:"204번도로",desc:"코토부키시티~소노오타운",hasCenter:false,hasShop:false,lv:[4,10],pokemon:[{k:"starly",w:25},{k:"bidoof",w:25},{k:"shinx",w:20},{k:"budew",w:15},{k:"zubat",w:15},{k:"cherubi",w:8},{k:"cherrim",w:3}],reqBadges:1,trainers:[{n:"풀숲소년 코우타",em:"👤",pokemon:[{k:"starly",l:7},{k:"bidoof",l:7}],reward:210},{n:"아로마아가씨 미즈키",em:"👤",pokemon:[{k:"budew",l:8}],reward:240},{n:"짧은치마 치카즈",em:"👤",pokemon:[{k:"shinx",l:8},{k:"starly",l:8}],reward:240},{n:"벌레잡이소년 아키라",em:"👤",pokemon:[{k:"zubat",l:7},{k:"shinx",l:9}],reward:270},{n:"풀숲소녀 나에",em:"👤",pokemon:[{k:"bidoof",l:8},{k:"budew",l:9},{k:"starly",l:10}],reward:300}]},
{id:"s_c5",n:"소노오타운",desc:"꽃향기 가득한 마을",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote","superpotion"],reqBadges:1,trainers:[]},
{id:"s_r7",n:"골짜기발전소",desc:"바람으로 움직이는 발전소",hasCenter:false,hasShop:false,lv:[7,14],pokemon:[{k:"buizel",w:40},{k:"shellos",w:35},{k:"pachirisu",w:25}],reqBadges:1,trainers:[{n:"기타리스트 아키토",em:"👤",pokemon:[{k:"pachirisu",l:10}],reward:300},{n:"연구원 히데키",em:"👤",pokemon:[{k:"buizel",l:11},{k:"shellos",l:11}],reward:330},{n:"경비원 쇼테츠",em:"👤",pokemon:[{k:"buizel",l:12}],reward:360},{n:"수영선수 쇼호",em:"👤",pokemon:[{k:"shellos",l:10},{k:"buizel",l:13}],reward:390},{n:"포켓몬레인저 소라",em:"👤",pokemon:[{k:"pachirisu",l:12},{k:"buizel",l:14}],reward:420}]},
{id:"s_r_fuego",n:"골풀무제철소",desc:"강 건너편에 위치한 옛 제철소",hasCenter:false,hasShop:false,lv:[28,34],pokemon:[{k:"magnemite",w:30},{k:"magneton",w:15},{k:"magmar",w:25},{k:"magby",w:20},{k:"electabuzz",w:10},{k:"rotom",w:3}],reqBadges:5,trainers:[{n:"작업원 타이치",em:"👤",pokemon:[{k:"magnemite",l:29},{k:"magmar",l:30}],reward:900},{n:"작업원 쇼이치",em:"👤",pokemon:[{k:"magneton",l:31}],reward:930},{n:"연구원 사쿠라",em:"👤",pokemon:[{k:"magby",l:30},{k:"magnemite",l:31}],reward:930},{n:"작업원 건달",em:"👤",pokemon:[{k:"magmar",l:32},{k:"magneton",l:33}],reward:990}]},
{id:"s_r8",n:"205번도로",desc:"소노오타운~하쿠타이시티",hasCenter:false,hasShop:false,lv:[10,14],pokemon:[{k:"bidoof",w:20},{k:"buizel",w:20},{k:"shellos",w:15},{k:"pachirisu",w:15},{k:"beautifly",w:10},{k:"dustox",w:10},{k:"gastrodon",w:10},{k:"grotle",w:2},{k:"monferno",w:2},{k:"prinplup",w:2}],reqBadges:1,trainers:[{n:"낚시꾼 타이세이",em:"👤",pokemon:[{k:"buizel",l:11},{k:"shellos",l:12}],reward:360},{n:"캠프파이어소녀 이로하",em:"👤",pokemon:[{k:"beautifly",l:12}],reward:360},{n:"풀숲소년 다이키",em:"👤",pokemon:[{k:"bidoof",l:11},{k:"pachirisu",l:12}],reward:360},{n:"풀숲소녀 하나코",em:"👤",pokemon:[{k:"shellos",l:12},{k:"buizel",l:13}],reward:390},{n:"등산가 기요시",em:"👤",pokemon:[{k:"bidoof",l:12},{k:"buizel",l:13},{k:"pachirisu",l:14}],reward:420}]},
{id:"s_r9",n:"영원의 숲",desc:"울창한 나무가 빽빽한 숲",hasCenter:false,hasShop:false,lv:[10,14],pokemon:[{k:"wurmple",w:15},{k:"silcoon",w:10},{k:"cascoon",w:10},{k:"budew",w:20},{k:"buneary",w:15},{k:"gastly",w:10},{k:"murkrow",w:10},{k:"misdreavus",w:10},{k:"drifloon",w:8},{k:"drifblim",w:3},{k:"combee",w:10},{k:"vespiquen",w:3},{k:"leafeon",w:3},{k:"wormadam",w:5},{k:"mothim",w:5},{k:"lopunny",w:3}],reqBadges:1,trainers:[{n:"벌레잡이소년 진",em:"👤",pokemon:[{k:"wurmple",l:11},{k:"silcoon",l:12}],reward:360},{n:"풀숲소녀 호시코",em:"👤",pokemon:[{k:"budew",l:12},{k:"buneary",l:12}],reward:360},{n:"벌레잡이소년 카이",em:"👤",pokemon:[{k:"wurmple",l:11},{k:"cascoon",l:12}],reward:360},{n:"사이킥 세이야",em:"👤",pokemon:[{k:"gastly",l:12},{k:"murkrow",l:13}],reward:390},{n:"오컬트매니아 미사키",em:"👤",pokemon:[{k:"misdreavus",l:13},{k:"gastly",l:13}],reward:390}]},
{id:"s_c6",n:"하쿠타이시티",desc:"오래된 역사의 마을",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","potion","superpotion","antidote"],reqBadges:1,trainers:[]},
{id:"s_r10",n:"206번도로",desc:"하쿠타이시티 남쪽 사이클링 로드",hasCenter:false,hasShop:false,lv:[14,18],pokemon:[{k:"machop",w:20},{k:"geodude",w:20},{k:"ponyta",w:20},{k:"kricketune",w:15},{k:"stunky",w:15},{k:"bronzor",w:10}],reqBadges:2,trainers:[{n:"사이클리스트 료우",em:"👤",pokemon:[{k:"ponyta",l:16},{k:"stunky",l:16}],reward:480},{n:"등산가 하야토",em:"👤",pokemon:[{k:"geodude",l:15},{k:"machop",l:16}],reward:480},{n:"짧은치마 나에",em:"👤",pokemon:[{k:"ponyta",l:16}],reward:480},{n:"사이클리스트 미치",em:"👤",pokemon:[{k:"kricketune",l:17},{k:"ponyta",l:17}],reward:510},{n:"산악인 겐타",em:"👤",pokemon:[{k:"geodude",l:16},{k:"bronzor",l:17},{k:"machop",l:18}],reward:540}]},
{id:"s_r_wayward",n:"미혹의 동굴",desc:"복잡한 지하 미로",hasCenter:false,hasShop:false,lv:[14,20],pokemon:[{k:"zubat",w:30},{k:"geodude",w:25},{k:"bronzor",w:20},{k:"gible",w:5},{k:"onix",w:20}],reqBadges:2,trainers:[{n:"등산가 모리",em:"👤",pokemon:[{k:"geodude",l:16},{k:"zubat",l:17}],reward:510},{n:"산악인 겐지",em:"👤",pokemon:[{k:"onix",l:17},{k:"bronzor",l:18}],reward:540},{n:"벌레잡이소년 시게루",em:"👤",pokemon:[{k:"zubat",l:18},{k:"geodude",l:19}],reward:570},{n:"등산가 유키",em:"👤",pokemon:[{k:"geodude",l:17},{k:"bronzor",l:18},{k:"zubat",l:20}],reward:600}]},
{id:"s_r11",n:"207번도로",desc:"쿠로가네시티~천관산 입구",hasCenter:false,hasShop:false,lv:[5,18],pokemon:[{k:"machop",w:25},{k:"geodude",w:30},{k:"ponyta",w:20},{k:"kricketot",w:15},{k:"zubat",w:10}],reqBadges:2,trainers:[{n:"등산가 카즈오",em:"👤",pokemon:[{k:"geodude",l:15},{k:"machop",l:16}],reward:480},{n:"산악인 유조",em:"👤",pokemon:[{k:"ponyta",l:16},{k:"geodude",l:16}],reward:480},{n:"사이클리스트 유카",em:"👤",pokemon:[{k:"ponyta",l:17}],reward:510}]},
{id:"s_r12",n:"208번도로",desc:"요스가시티로 이어지는 돌길",hasCenter:false,hasShop:false,lv:[16,20],pokemon:[{k:"machop",w:20},{k:"psyduck",w:20},{k:"bibarel",w:15},{k:"ralts",w:5},{k:"roselia",w:15},{k:"bidoof",w:15},{k:"meditite",w:10},{k:"roserade",w:5}],reqBadges:2,trainers:[{n:"풀숲소녀 유리",em:"👤",pokemon:[{k:"roselia",l:17},{k:"psyduck",l:17}],reward:510},{n:"블랙벨트 히사시",em:"👤",pokemon:[{k:"machop",l:17},{k:"meditite",l:18}],reward:540},{n:"등산가 소타",em:"👤",pokemon:[{k:"bidoof",l:17},{k:"bibarel",l:18}],reward:540},{n:"아로마아가씨 서연",em:"👤",pokemon:[{k:"roselia",l:18},{k:"psyduck",l:19}],reward:570},{n:"풀숲소년 하야토",em:"👤",pokemon:[{k:"machop",l:18},{k:"psyduck",l:19},{k:"roselia",l:20}],reward:600}]},
{id:"s_c7",n:"요스가시티",desc:"사람과 포켓몬이 함께하는 마을",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","potion","superpotion","antidote","paralyzeheal"],reqBadges:2,trainers:[]},
{id:"s_r13",n:"209번도로",desc:"요스가시티~즈이타운",hasCenter:false,hasShop:false,lv:[16,22],pokemon:[{k:"bibarel",w:15},{k:"chansey",w:5},{k:"mime_jr",w:10},{k:"ralts",w:5},{k:"starly",w:20},{k:"staravia",w:15},{k:"roselia",w:15},{k:"gastly",w:15}],reqBadges:3,trainers:[{n:"소년 유우키",em:"👤",pokemon:[{k:"starly",l:18},{k:"staravia",l:19}],reward:570},{n:"소녀 미사키",em:"👤",pokemon:[{k:"roselia",l:19},{k:"chansey",l:20}],reward:600},{n:"벌레잡이소년 타이키",em:"👤",pokemon:[{k:"bibarel",l:19},{k:"mime_jr",l:20}],reward:600},{n:"사이킥 나오",em:"👤",pokemon:[{k:"gastly",l:20},{k:"ralts",l:21}],reward:630},{n:"풀숲소녀 세이라",em:"👤",pokemon:[{k:"roselia",l:20},{k:"staravia",l:21},{k:"bibarel",l:22}],reward:660}]},
{id:"s_r_losttower",n:"로스트타워",desc:"포켓몬의 넋을 기리는 탑",hasCenter:false,hasShop:false,lv:[16,25],pokemon:[{k:"zubat",w:25},{k:"golbat",w:15},{k:"gastly",w:25},{k:"haunter",w:15},{k:"murkrow",w:10},{k:"misdreavus",w:10},{k:"drifloon",w:8},{k:"drifblim",w:5},{k:"mismagius",w:8}],reqBadges:3,trainers:[{n:"오컬트매니아 사유리",em:"👤",pokemon:[{k:"gastly",l:19},{k:"murkrow",l:20}],reward:600},{n:"사이킥 켄이치",em:"👤",pokemon:[{k:"haunter",l:21}],reward:630},{n:"오컬트매니아 치에",em:"👤",pokemon:[{k:"misdreavus",l:20},{k:"gastly",l:21}],reward:630},{n:"사이킥 유코",em:"👤",pokemon:[{k:"golbat",l:21},{k:"haunter",l:22}],reward:660},{n:"오컬트매니아 엔",em:"👤",pokemon:[{k:"gastly",l:21},{k:"murkrow",l:22},{k:"misdreavus",l:23}],reward:690}]},
{id:"s_c8",n:"즈이타운",desc:"목장이 있는 한적한 마을",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","superpotion","antidote"],reqBadges:3,trainers:[]},
{id:"s_r_solaceon",n:"신수유적",desc:"고대의 수수께끼가 잠든 유적",hasCenter:false,hasShop:false,lv:[14,25],pokemon:[{k:"unown",w:100}],reqBadges:3,trainers:[]},
{id:"s_r14",n:"210번도로",desc:"즈이타운~토바리시티",hasCenter:false,hasShop:false,lv:[19,25],pokemon:[{k:"psyduck",w:20},{k:"machop",w:15},{k:"machoke",w:10},{k:"geodude",w:15},{k:"ponyta",w:15},{k:"chansey",w:5},{k:"roselia",w:10},{k:"kricketune",w:10}],reqBadges:3,trainers:[{n:"등산가 쇼헤이",em:"👤",pokemon:[{k:"machop",l:21},{k:"geodude",l:22}],reward:660},{n:"풀숲소녀 카논",em:"👤",pokemon:[{k:"roselia",l:22},{k:"psyduck",l:22}],reward:660},{n:"블랙벨트 겐타",em:"👤",pokemon:[{k:"machoke",l:23}],reward:690},{n:"사이클리스트 아키",em:"👤",pokemon:[{k:"ponyta",l:22},{k:"kricketune",l:23}],reward:690},{n:"등산가 다이키",em:"👤",pokemon:[{k:"geodude",l:22},{k:"machop",l:23},{k:"ponyta",l:25}],reward:750}]},
{id:"s_c9",n:"토바리시티",desc:"잘라낸 바위의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","superpotion","hyperpotion","antidote","paralyzeheal","revive"],reqBadges:3,trainers:[]},
{id:"s_r15",n:"215번도로",desc:"토바리시티 남쪽 비가 내리는 도로",hasCenter:false,hasShop:false,lv:[20,26],pokemon:[{k:"machop",w:20},{k:"geodude",w:15},{k:"ponyta",w:15},{k:"kadabra",w:10},{k:"kricketune",w:15},{k:"marill",w:15},{k:"lickitung",w:10}],reqBadges:4,trainers:[{n:"블랙벨트 야스유키",em:"👤",pokemon:[{k:"machop",l:22},{k:"machoke",l:24}],reward:720},{n:"사이킥 사쿠",em:"👤",pokemon:[{k:"kadabra",l:24}],reward:720},{n:"등산가 쿠니히로",em:"👤",pokemon:[{k:"geodude",l:23},{k:"ponyta",l:24}],reward:720},{n:"풀숲소녀 아야노",em:"👤",pokemon:[{k:"marill",l:24},{k:"roselia",l:25}],reward:750},{n:"블랙벨트 민수",em:"👤",pokemon:[{k:"machoke",l:24},{k:"machop",l:25},{k:"lickitung",l:26}],reward:780}]},
{id:"s_r16",n:"214번도로",desc:"토바리시티~노모세시티",hasCenter:false,hasShop:false,lv:[22,28],pokemon:[{k:"geodude",w:15},{k:"graveler",w:10},{k:"ponyta",w:15},{k:"rhyhorn",w:10},{k:"houndour",w:15},{k:"stunky",w:15},{k:"girafarig",w:10},{k:"kricketune",w:10},{k:"hippopotas",w:10},{k:"drapion",w:5}],reqBadges:4,trainers:[{n:"등산가 시게루",em:"👤",pokemon:[{k:"geodude",l:24},{k:"rhyhorn",l:25}],reward:750},{n:"사이킥 코우타",em:"👤",pokemon:[{k:"girafarig",l:25}],reward:750},{n:"짧은치마 나오미",em:"👤",pokemon:[{k:"ponyta",l:25},{k:"houndour",l:25}],reward:750},{n:"산악인 타카시",em:"👤",pokemon:[{k:"graveler",l:25},{k:"stunky",l:26}],reward:780},{n:"등산가 세이고",em:"👤",pokemon:[{k:"geodude",l:24},{k:"rhyhorn",l:25},{k:"ponyta",l:26},{k:"graveler",l:28}],reward:840}]},
{id:"s_c10",n:"노모세시티",desc:"이슬이 맺히는 목장의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["superball","superpotion","hyperpotion","antidote","revive"],reqBadges:4,trainers:[]},
{id:"s_r_greatmarsh",n:"대습초원",desc:"다양한 포켓몬이 서식하는 습지",hasCenter:false,hasShop:false,lv:[20,30],pokemon:[{k:"wooper",w:20},{k:"quagsire",w:10},{k:"bidoof",w:15},{k:"bibarel",w:10},{k:"skorupi",w:15},{k:"carnivine",w:10},{k:"tangela",w:10},{k:"tropius",w:5},{k:"yanma",w:5},{k:"croagunk",w:12},{k:"toxicroak",w:5}],reqBadges:4,trainers:[{n:"레인저 카즈마",em:"🌿",pokemon:[{k:"quagsire",l:25},{k:"carnivine",l:26}],reward:780},{n:"레인저 유미",em:"🌿",pokemon:[{k:"skorupi",l:26},{k:"tangela",l:26}],reward:780},{n:"레인저 타이세이",em:"🌿",pokemon:[{k:"bibarel",l:25},{k:"tropius",l:27}],reward:810}]},
{id:"s_r17",n:"212번도로",desc:"요스가시티~노모세시티 남쪽",hasCenter:false,hasShop:false,lv:[20,28],pokemon:[{k:"roselia",w:20},{k:"budew",w:10},{k:"stunky",w:15},{k:"ralts",w:5},{k:"kirlia",w:3},{k:"kricketune",w:15},{k:"bibarel",w:15},{k:"staravia",w:17}],reqBadges:4,trainers:[{n:"경찰관 쇼이치",em:"👤",pokemon:[{k:"stunky",l:24},{k:"staravia",l:25}],reward:750},{n:"아로마아가씨 카렌",em:"👤",pokemon:[{k:"roselia",l:25},{k:"budew",l:24}],reward:750},{n:"풀숲소년 시게키",em:"👤",pokemon:[{k:"bibarel",l:25},{k:"kricketune",l:25}],reward:750},{n:"소녀 유나",em:"👤",pokemon:[{k:"roselia",l:26},{k:"staravia",l:26}],reward:780}]},
{id:"s_r_pokemon_mansion",n:"포켓몬저택",desc:"부호의 호화로운 저택",hasCenter:false,hasShop:false,lv:[16,22],pokemon:[{k:"pichu",w:15},{k:"pikachu",w:10},{k:"roselia",w:15},{k:"eevee",w:5},{k:"staravia",w:20},{k:"chatot",w:15},{k:"mime_jr",w:10},{k:"chansey",w:10}],reqBadges:4,trainers:[{n:"아가씨 세이라",em:"👤",pokemon:[{k:"roselia",l:22},{k:"pikachu",l:23}],reward:690},{n:"소녀 유리카",em:"��",pokemon:[{k:"chatot",l:23},{k:"eevee",l:24}],reward:720},{n:"신사 다이몬",em:"👤",pokemon:[{k:"mime_jr",l:23},{k:"chansey",l:24}],reward:720}]},
{id:"s_r18",n:"213번도로",desc:"노모세시티 해변",hasCenter:false,hasShop:false,lv:[20,28],pokemon:[{k:"wingull",w:20},{k:"pelipper",w:10},{k:"shellos",w:25},{k:"buizel",w:20},{k:"floatzel",w:10},{k:"chatot",w:15}],reqBadges:5,trainers:[{n:"수영선수 유이",em:"👤",pokemon:[{k:"buizel",l:25},{k:"shellos",l:26}],reward:780},{n:"낚시꾼 카즈미",em:"👤",pokemon:[{k:"floatzel",l:26},{k:"pelipper",l:26}],reward:780},{n:"수영선수 쇼호",em:"👤",pokemon:[{k:"wingull",l:25},{k:"buizel",l:26},{k:"shellos",l:27}],reward:810}]},
{id:"s_r19",n:"천관산",desc:"신오지방의 중심에 우뚝 솟은 거대한 산",hasCenter:false,hasShop:false,lv:[14,45],pokemon:[{k:"zubat",w:20},{k:"golbat",w:15},{k:"geodude",w:20},{k:"graveler",w:10},{k:"machop",w:15},{k:"machoke",w:10},{k:"bronzor",w:10},{k:"chingling",w:5},{k:"clefairy",w:3},{k:"nosepass",w:3},{k:"probopass",w:3}],reqBadges:2,trainers:[{n:"등산가 하야토",em:"👤",pokemon:[{k:"geodude",l:22},{k:"machop",l:23}],reward:690},{n:"산악인 세이고",em:"👤",pokemon:[{k:"zubat",l:23},{k:"bronzor",l:24}],reward:720},{n:"등산가 미유키",em:"👤",pokemon:[{k:"golbat",l:24},{k:"graveler",l:25}],reward:750},{n:"블랙벨트 료",em:"👤",pokemon:[{k:"machop",l:24},{k:"machoke",l:26}],reward:780},{n:"산악인 타이조",em:"��",pokemon:[{k:"geodude",l:25},{k:"golbat",l:26},{k:"bronzor",l:27}],reward:810},{n:"등산가 무사시",em:"👤",pokemon:[{k:"graveler",l:28},{k:"machoke",l:30}],reward:900}]},
{id:"s_r20",n:"218번도로",desc:"코토부키시티~미오시티",hasCenter:false,hasShop:false,lv:[28,34],pokemon:[{k:"tentacool",w:20},{k:"tentacruel",w:10},{k:"wingull",w:20},{k:"floatzel",w:20},{k:"gastrodon",w:15},{k:"shellos",w:15}],reqBadges:5,trainers:[{n:"낚시꾼 토시유키",em:"👤",pokemon:[{k:"tentacool",l:29},{k:"shellos",l:30}],reward:900},{n:"수영선수 미나미",em:"👤",pokemon:[{k:"floatzel",l:30},{k:"wingull",l:30}],reward:900},{n:"낚시꾼 요시히로",em:"👤",pokemon:[{k:"tentacruel",l:31},{k:"gastrodon",l:32}],reward:960}]},
{id:"s_c11",n:"미오시티",desc:"운하가 흐르는 항구 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["superball","ultraball","hyperpotion","revive","fullheal"],reqBadges:5,trainers:[]},
{id:"s_r_ironis",n:"강철섬",desc:"바다 건너편의 광산섬",hasCenter:false,hasShop:false,lv:[28,36],pokemon:[{k:"onix",w:20},{k:"steelix",w:10},{k:"graveler",w:20},{k:"golbat",w:20},{k:"geodude",w:15},{k:"zubat",w:15},{k:"riolu",w:5},{k:"lucario",w:3}],reqBadges:5,trainers:[{n:"등산가 세이야",em:"👤",pokemon:[{k:"onix",l:30},{k:"graveler",l:31}],reward:930},{n:"산악인 겐타로",em:"👤",pokemon:[{k:"golbat",l:31},{k:"steelix",l:32}],reward:960},{n:"블랙벨트 타이키",em:"👤",pokemon:[{k:"graveler",l:32},{k:"onix",l:33}],reward:990},{n:"등산가 유키",em:"👤",pokemon:[{k:"golbat",l:33},{k:"steelix",l:34},{k:"graveler",l:34}],reward:1020}]},
{id:"s_r21",n:"216번도로",desc:"미오시티~킷사키시티 (눈길)",hasCenter:false,hasShop:false,lv:[32,38],pokemon:[{k:"snover",w:25},{k:"sneasel",w:15},{k:"zubat",w:15},{k:"graveler",w:15},{k:"machoke",w:15},{k:"meditite",w:15}],reqBadges:6,trainers:[{n:"스키어 아키라",em:"👤",pokemon:[{k:"snover",l:33},{k:"sneasel",l:34}],reward:1020},{n:"등산가 코우지",em:"👤",pokemon:[{k:"graveler",l:34},{k:"machoke",l:35}],reward:1050},{n:"스키어 미유",em:"👤",pokemon:[{k:"snover",l:34},{k:"meditite",l:35}],reward:1050},{n:"산악인 타카오",em:"👤",pokemon:[{k:"machoke",l:35},{k:"graveler",l:36}],reward:1080},{n:"스키어 쇼타",em:"👤",pokemon:[{k:"sneasel",l:35},{k:"snover",l:36},{k:"zubat",l:38}],reward:1140}]},
{id:"s_r22",n:"217번도로",desc:"맹렬한 눈보라가 치는 설원",hasCenter:false,hasShop:false,lv:[34,40],pokemon:[{k:"snover",w:25},{k:"sneasel",w:15},{k:"medicham",w:15},{k:"machoke",w:15},{k:"swinub",w:15},{k:"piloswine",w:10},{k:"abomasnow",w:5},{k:"weavile",w:5},{k:"mamoswine",w:3},{k:"glaceon",w:3},{k:"froslass",w:5}],reqBadges:6,trainers:[{n:"스키어 유리",em:"👤",pokemon:[{k:"snover",l:35},{k:"swinub",l:36}],reward:1080},{n:"등산가 다이키",em:"👤",pokemon:[{k:"machoke",l:36},{k:"sneasel",l:37}],reward:1110},{n:"스키어 아야",em:"👤",pokemon:[{k:"piloswine",l:37},{k:"medicham",l:37}],reward:1110},{n:"블랙벨트 카즈히로",em:"👤",pokemon:[{k:"machoke",l:37},{k:"medicham",l:38}],reward:1140},{n:"스키어 겐타",em:"👤",pokemon:[{k:"snover",l:37},{k:"sneasel",l:38},{k:"piloswine",l:40}],reward:1200}]},
{id:"s_c12",n:"킷사키시티",desc:"설원에 둘러싸인 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","hyperpotion","fullrestore","fullheal","revive"],reqBadges:6,trainers:[]},
{id:"s_r_lakeacuity",n:"예지호수",desc:"예지의 호수",hasCenter:false,hasShop:false,lv:[34,42],pokemon:[{k:"psyduck",w:20},{k:"golduck",w:10},{k:"bibarel",w:20},{k:"snover",w:20},{k:"sneasel",w:15},{k:"medicham",w:15}],reqBadges:7,trainers:[{n:"사이킥 엔",em:"👤",pokemon:[{k:"golduck",l:36},{k:"medicham",l:37}],reward:1110},{n:"등산가 세이야",em:"👤",pokemon:[{k:"snover",l:37},{k:"bibarel",l:38}],reward:1140}]},
{id:"s_r23",n:"219번수로",desc:"마사고타운 남쪽 해안",hasCenter:false,hasShop:false,lv:[28,35],pokemon:[{k:"tentacool",w:30},{k:"wingull",w:25},{k:"pelipper",w:15},{k:"tentacruel",w:15},{k:"floatzel",w:15},{k:"finneon",w:10},{k:"lumineon",w:5}],reqBadges:5,trainers:[{n:"수영선수 카오루",em:"👤",pokemon:[{k:"tentacool",l:29},{k:"wingull",l:30}],reward:900},{n:"수영선수 나미",em:"👤",pokemon:[{k:"floatzel",l:31}],reward:930}]},
{id:"s_r24",n:"220번수로",desc:"바다 위의 넓은 수로",hasCenter:false,hasShop:false,lv:[30,40],pokemon:[{k:"tentacruel",w:30},{k:"pelipper",w:25},{k:"sealeo",w:15},{k:"floatzel",w:15},{k:"mantyke",w:10},{k:"wailmer",w:5},{k:"finneon",w:8},{k:"lumineon",w:5}],reqBadges:6,trainers:[{n:"수영선수 유이",em:"👤",pokemon:[{k:"tentacruel",l:33},{k:"pelipper",l:34}],reward:1020},{n:"수영선수 코지",em:"👤",pokemon:[{k:"floatzel",l:34},{k:"sealeo",l:35}],reward:1050},{n:"낚시꾼 하루키",em:"👤",pokemon:[{k:"tentacruel",l:35},{k:"mantyke",l:35}],reward:1050}]},
{id:"s_r25",n:"221번도로",desc:"팔파크로 향하는 길",hasCenter:false,hasShop:false,lv:[28,36],pokemon:[{k:"wingull",w:20},{k:"floatzel",w:20},{k:"shellos",w:20},{k:"gastrodon",w:15},{k:"sudowoodo",w:10},{k:"skuntank",w:10},{k:"roselia",w:5}],reqBadges:6,trainers:[{n:"낚시꾼 무네하루",em:"👤",pokemon:[{k:"floatzel",l:32},{k:"shellos",l:33}],reward:990},{n:"풀숲소녀 미유",em:"👤",pokemon:[{k:"roselia",l:33},{k:"sudowoodo",l:34}],reward:1020},{n:"등산가 건달",em:"👤",pokemon:[{k:"gastrodon",l:34},{k:"skuntank",l:35}],reward:1050}]},
{id:"s_r26",n:"222번도로",desc:"나기사시티로 향하는 해변 도로",hasCenter:false,hasShop:false,lv:[38,42],pokemon:[{k:"luxio",w:15},{k:"luxray",w:8},{k:"chatot",w:15},{k:"floatzel",w:15},{k:"gastrodon",w:15},{k:"magnemite",w:15},{k:"magneton",w:8},{k:"electabuzz",w:9}],reqBadges:7,trainers:[{n:"기타리스트 유지",em:"👤",pokemon:[{k:"luxio",l:38},{k:"chatot",l:39}],reward:1170},{n:"수영선수 미치",em:"👤",pokemon:[{k:"floatzel",l:39},{k:"gastrodon",l:39}],reward:1170},{n:"연구원 지원",em:"👤",pokemon:[{k:"magnemite",l:39},{k:"magneton",l:40}],reward:1200},{n:"사이킥 아키나",em:"👤",pokemon:[{k:"luxio",l:40},{k:"electabuzz",l:40}],reward:1200},{n:"파라솔아가씨 코유키",em:"👤",pokemon:[{k:"chatot",l:40},{k:"gastrodon",l:41}],reward:1230},{n:"엘리트트레이너 하루키",em:"👤",pokemon:[{k:"luxray",l:40},{k:"electabuzz",l:41},{k:"magneton",l:42}],reward:1260}]},
{id:"s_c13",n:"나기사시티",desc:"태양빛이 비추는 해안 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","hyperpotion","fullrestore","fullheal","revive"],reqBadges:7,trainers:[]},
{id:"s_r27",n:"223번수로",desc:"나기사시티~포켓몬리그",hasCenter:false,hasShop:false,lv:[35,45],pokemon:[{k:"tentacruel",w:55},{k:"pelipper",w:45},{k:"finneon",w:8},{k:"lumineon",w:5}],reqBadges:8,trainers:[{n:"수영선수 유우마",em:"👤",pokemon:[{k:"tentacruel",l:38},{k:"pelipper",l:38}],reward:1140},{n:"낚시꾼 노보루",em:"👤",pokemon:[{k:"tentacruel",l:40},{k:"pelipper",l:40}],reward:1200},{n:"수영선수 하루에",em:"��",pokemon:[{k:"pelipper",l:41},{k:"tentacruel",l:42}],reward:1260},{n:"엘리트트레이너 보라",em:"👤",pokemon:[{k:"tentacruel",l:42},{k:"pelipper",l:43}],reward:1290}]},
{id:"s_r28",n:"챔피언로드",desc:"포켓몬리그로 가는 최후의 관문",hasCenter:false,hasShop:false,lv:[40,48],pokemon:[{k:"golbat",w:20},{k:"graveler",w:20},{k:"onix",w:15},{k:"steelix",w:5},{k:"machoke",w:15},{k:"medicham",w:10},{k:"rhyhorn",w:10},{k:"gabite",w:5},{k:"garchomp",w:2},{k:"gliscor",w:5}],reqBadges:8,trainers:[{n:"블랙벨트 타이호",em:"👤",pokemon:[{k:"machoke",l:40},{k:"medicham",l:41}],reward:1230},{n:"산악인 원철",em:"👤",pokemon:[{k:"graveler",l:41},{k:"onix",l:42}],reward:1260},{n:"사이킥 서율",em:"👤",pokemon:[{k:"medicham",l:42},{k:"golbat",l:42}],reward:1260},{n:"엘리트트레이너 나오",em:"👤",pokemon:[{k:"rhyhorn",l:43},{k:"machoke",l:43}],reward:1290},{n:"경비원 상호",em:"👤",pokemon:[{k:"steelix",l:42},{k:"graveler",l:43}],reward:1290},{n:"블랙벨트 진우",em:"👤",pokemon:[{k:"machoke",l:44},{k:"medicham",l:44}],reward:1320},{n:"산악인 동혁",em:"👤",pokemon:[{k:"golbat",l:44},{k:"graveler",l:45},{k:"onix",l:45}],reward:1350},{n:"엘리트트레이너 서진",em:"👤",pokemon:[{k:"gabite",l:45},{k:"steelix",l:46},{k:"machoke",l:48}],reward:1440}]},
{id:"s_c14",n:"포켓몬리그",desc:"최강 트레이너의 전당",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","hyperpotion","fullrestore","fullheal","revive"],reqBadges:8,trainers:[]},
{id:"s_r29",n:"창기둥",desc:"시간과 공간을 관장하는 신성한 장소",hasCenter:false,hasShop:false,lv:[45,55],pokemon:[{k:"golbat",w:30},{k:"graveler",w:28},{k:"machoke",w:22},{k:"bronzong",w:12},{k:"clefable",w:8}],reqBadges:8,trainers:[{n:"사이킥 토오루",em:"��",pokemon:[{k:"bronzong",l:46},{k:"golbat",l:47}],reward:1410},{n:"블랙벨트 쇼지",em:"👤",pokemon:[{k:"machoke",l:47},{k:"graveler",l:48}],reward:1440},{n:"산악인 철민",em:"👤",pokemon:[{k:"golbat",l:48},{k:"graveler",l:49}],reward:1470},{n:"연구원 예림",em:"👤",pokemon:[{k:"bronzong",l:49},{k:"clefable",l:50}],reward:1500},{n:"엘리트트레이너 미노리",em:"👤",pokemon:[{k:"machoke",l:50},{k:"bronzong",l:51},{k:"golbat",l:52}],reward:1560},{n:"엘리트트레이너 하준",em:"👤",pokemon:[{k:"graveler",l:52},{k:"machoke",l:53},{k:"bronzong",l:55}],reward:1650}]},
{id:"s_r_lakeverity",n:"진실호수",desc:"진실의 호수",hasCenter:false,hasShop:false,lv:[2,5],pokemon:[{k:"starly",w:40},{k:"bidoof",w:40},{k:"shinx",w:20}],reqBadges:0,trainers:[]},
{id:"s_r_lakevalor",n:"입지호수",desc:"의지의 호수",hasCenter:false,hasShop:false,lv:[28,35],pokemon:[{k:"psyduck",w:25},{k:"golduck",w:10},{k:"bibarel",w:20},{k:"staravia",w:20},{k:"goldeen",w:15},{k:"seaking",w:10}],reqBadges:5,trainers:[{n:"낚시꾼 노보루",em:"👤",pokemon:[{k:"goldeen",l:29},{k:"psyduck",l:30}],reward:900},{n:"풀숲소녀 사쿠라",em:"👤",pokemon:[{k:"bibarel",l:30},{k:"staravia",l:31}],reward:930}]},
{id:"s_r_galactic",n:"갤럭시단 빌딩",desc:"갤럭시단의 본거지",hasCenter:false,hasShop:false,lv:[30,38],pokemon:[{k:"golbat",w:30},{k:"bronzor",w:25},{k:"stunky",w:20},{k:"skuntank",w:10},{k:"murkrow",w:15}],reqBadges:6,trainers:[{n:"갤럭시단원 하루키",em:"👤",pokemon:[{k:"golbat",l:32},{k:"stunky",l:33}],reward:990},{n:"갤럭시단원 미유키",em:"👤",pokemon:[{k:"bronzor",l:33},{k:"murkrow",l:34}],reward:1020},{n:"갤럭시단 간부 마스",em:"👤",pokemon:[{k:"golbat",l:35},{k:"bronzor",l:35},{k:"skuntank",l:37}],reward:1110},{n:"갤럭시단 간부 주피터",em:"👤",pokemon:[{k:"golbat",l:35},{k:"bronzor",l:35},{k:"skuntank",l:37}],reward:1110},{n:"갤럭시단 보스 아카기",em:"👤",pokemon:[{k:"murkrow",l:36},{k:"golbat",l:36},{k:"sneasel",l:37},{k:"honchkrow",l:38}],reward:1140}]},
{id:"s_r_hardmountain",n:"하드마운틴",desc:"화산 활동이 활발한 산",hasCenter:false,hasShop:false,lv:[50,58],pokemon:[{k:"golbat",w:15},{k:"graveler",w:15},{k:"machoke",w:15},{k:"magmar",w:15},{k:"camerupt",w:10},{k:"torkoal",w:10},{k:"rhyhorn",w:10},{k:"rhydon",w:5},{k:"slugma",w:5}],reqBadges:8,trainers:[{n:"등산가 무사시",em:"👤",pokemon:[{k:"magmar",l:52},{k:"camerupt",l:53}],reward:1590},{n:"산악인 이와오",em:"👤",pokemon:[{k:"graveler",l:53},{k:"rhydon",l:54}],reward:1620},{n:"블랙벨트 겐지",em:"👤",pokemon:[{k:"machoke",l:54},{k:"torkoal",l:55}],reward:1650},{n:"엘리트트레이너 세이야",em:"👤",pokemon:[{k:"magmar",l:54},{k:"camerupt",l:55},{k:"rhydon",l:56}],reward:1680}]},
{id:"s_r_sendoffspring",n:"송별의 샘",desc:"이세계로 통하는 샘",hasCenter:false,hasShop:false,lv:[45,55],pokemon:[{k:"golbat",w:20},{k:"graveler",w:20},{k:"bibarel",w:15},{k:"staravia",w:15},{k:"golduck",w:15},{k:"chingling",w:10},{k:"chimecho",w:5}],reqBadges:8,trainers:[]},
{id:"s_r_turnback",n:"귀혼동굴",desc:"기라티나가 사는 미로의 동굴",hasCenter:false,hasShop:false,lv:[45,60],pokemon:[{k:"golbat",w:25},{k:"haunter",w:20},{k:"dusclops",w:15},{k:"banette",w:15},{k:"bronzong",w:10},{k:"chimecho",w:10},{k:"dusknoir",w:5},{k:"spiritomb",w:5}],reqBadges:8,trainers:[{n:"사이킥 엔",em:"👤",pokemon:[{k:"haunter",l:50},{k:"dusclops",l:52}],reward:1560},{n:"오컬트매니아 미사키",em:"👤",pokemon:[{k:"banette",l:52},{k:"bronzong",l:53}],reward:1590},{n:"사이킥 세이야",em:"👤",pokemon:[{k:"dusclops",l:53},{k:"chimecho",l:54},{k:"haunter",l:55}],reward:1650}]},
{id:"s_r30",n:"224번도로",desc:"포켓몬리그 너머의 비밀 도로",hasCenter:false,hasShop:false,lv:[50,55],pokemon:[{k:"tentacruel",w:20},{k:"pelipper",w:15},{k:"floatzel",w:15},{k:"golduck",w:15},{k:"machoke",w:15},{k:"roselia",w:10},{k:"gloom",w:10},{k:"togekiss",w:3}],reqBadges:8,trainers:[{n:"수영선수 하루카",em:"👤",pokemon:[{k:"tentacruel",l:50},{k:"floatzel",l:51}],reward:1530},{n:"풀숲소녀 카에데",em:"👤",pokemon:[{k:"roselia",l:51},{k:"gloom",l:52}],reward:1560},{n:"등산가 세이야",em:"👤",pokemon:[{k:"machoke",l:52},{k:"golduck",l:53}],reward:1590}]},
{id:"s_r31",n:"225번도로",desc:"파이트에리어 근처의 험한 도로",hasCenter:false,hasShop:false,lv:[50,56],pokemon:[{k:"machoke",w:20},{k:"graveler",w:20},{k:"raticate",w:15},{k:"fearow",w:15},{k:"skuntank",w:15},{k:"roselia",w:15}],reqBadges:8,trainers:[{n:"등산가 하준",em:"👤",pokemon:[{k:"machoke",l:51},{k:"graveler",l:52}],reward:1560},{n:"풀숲소년 유지",em:"👤",pokemon:[{k:"fearow",l:52},{k:"raticate",l:53}],reward:1590},{n:"산악인 타이키",em:"👤",pokemon:[{k:"skuntank",l:53},{k:"machoke",l:54}],reward:1620}]},
{id:"s_c15",n:"파이트에리어",desc:"배틀 시설이 있는 지역",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","maxpotion","fullrestore","fullheal","revive"],reqBadges:8,trainers:[]},
{id:"s_r32",n:"226번수로",desc:"파이트에리어~서바이벌에리어",hasCenter:false,hasShop:false,lv:[50,56],pokemon:[{k:"tentacruel",w:25},{k:"pelipper",w:25},{k:"sealeo",w:15},{k:"horsea",w:15},{k:"seadra",w:10},{k:"wailmer",w:10}],reqBadges:8,trainers:[{n:"수영선수 유마",em:"👤",pokemon:[{k:"tentacruel",l:52},{k:"pelipper",l:53}],reward:1590},{n:"낚시꾼 카즈히로",em:"👤",pokemon:[{k:"sealeo",l:53},{k:"seadra",l:54}],reward:1620}]},
{id:"s_r33",n:"227번도로",desc:"화산이 보이는 험준한 산길",hasCenter:false,hasShop:false,lv:[52,58],pokemon:[{k:"graveler",w:20},{k:"golbat",w:15},{k:"machoke",w:15},{k:"skarmory",w:10},{k:"absol",w:5},{k:"numel",w:15},{k:"camerupt",w:10},{k:"fearow",w:10}],reqBadges:8,trainers:[{n:"등산가 겐지",em:"👤",pokemon:[{k:"graveler",l:53},{k:"skarmory",l:54}],reward:1620},{n:"산악인 이와오",em:"👤",pokemon:[{k:"camerupt",l:54},{k:"machoke",l:55}],reward:1650},{n:"엘리트트레이너 소라",em:"👤",pokemon:[{k:"absol",l:55},{k:"golbat",l:56},{k:"skarmory",l:56}],reward:1680}]},
{id:"s_c16",n:"서바이벌에리어",desc:"험한 자연 속의 마을",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","maxpotion","fullrestore","fullheal","revive"],reqBadges:8,trainers:[]},
{id:"s_r34",n:"228번도로",desc:"모래바람이 불어오는 사막 지대",hasCenter:false,hasShop:false,lv:[50,56],pokemon:[{k:"rhydon",w:15},{k:"hippowdon",w:10},{k:"cacturne",w:15},{k:"sandslash",w:15},{k:"dugtrio",w:15},{k:"skarmory",w:10},{k:"absol",w:5},{k:"stunky",w:15}],reqBadges:8,trainers:[{n:"등산가 요시히로",em:"👤",pokemon:[{k:"rhydon",l:52},{k:"sandslash",l:53}],reward:1590},{n:"풀숲소녀 레이",em:"👤",pokemon:[{k:"cacturne",l:53},{k:"hippowdon",l:54}],reward:1620},{n:"산악인 카즈야",em:"👤",pokemon:[{k:"dugtrio",l:54},{k:"rhydon",l:55}],reward:1650}]},
{id:"s_r35",n:"229번도로",desc:"리조트에리어로 향하는 길",hasCenter:false,hasShop:false,lv:[50,56],pokemon:[{k:"roselia",w:15},{k:"gloom",w:15},{k:"oddish",w:10},{k:"ledian",w:15},{k:"ariados",w:15},{k:"volbeat",w:10},{k:"illumise",w:10},{k:"absol",w:5},{k:"scyther",w:5}],reqBadges:8,trainers:[{n:"풀숲소녀 하나코",em:"👤",pokemon:[{k:"roselia",l:53},{k:"ledian",l:54}],reward:1620},{n:"벌레잡이소년 타이키",em:"👤",pokemon:[{k:"ariados",l:54},{k:"scyther",l:55}],reward:1650},{n:"풀숲소년 유우키",em:"👤",pokemon:[{k:"gloom",l:54},{k:"volbeat",l:55}],reward:1650}]},
{id:"s_r36",n:"230번수로",desc:"리조트에리어 앞 넓은 바다",hasCenter:false,hasShop:false,lv:[50,56],pokemon:[{k:"tentacruel",w:25},{k:"pelipper",w:20},{k:"sealeo",w:15},{k:"wailmer",w:15},{k:"wailord",w:5},{k:"horsea",w:10},{k:"seadra",w:10}],reqBadges:8,trainers:[{n:"수영선수 나오",em:"👤",pokemon:[{k:"tentacruel",l:53},{k:"sealeo",l:54}],reward:1620},{n:"낚시꾼 세이야",em:"👤",pokemon:[{k:"wailmer",l:54},{k:"seadra",l:55}],reward:1650}]},
{id:"s_c17",n:"리조트에리어",desc:"고급 리조트 마을",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","maxpotion","fullrestore","fullheal","revive"],reqBadges:8,trainers:[]}
]},
unova: {
    n: "하나지방", em: "🌆",
    roads: [
{id:"u_c1",n:"카노코타운",desc:"새 모험의 시작",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion"],reqBadges:0,trainers:[]},
{id:"u_r1",n:"1번도로",desc:"카노코타운~카라쿠사타운",lv:[2,4],pokemon:[{k:"lillipup",w:35},{k:"patrat",w:35},{k:"pidove",w:30}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:0,trainers:[{n:"소년 사토시",em:"👦",pokemon:[{k:"patrat",l:3},{k:"lillipup",l:4}],reward:120},{n:"소녀 하루카",em:"👧",pokemon:[{k:"pidove",l:4}],reward:120},{n:"유치원생 보라",em:"👶",pokemon:[{k:"lillipup",l:3}],reward:90},{n:"소년 히로시",em:"👦",pokemon:[{k:"patrat",l:3},{k:"pidove",l:4}],reward:120}]},
{id:"u_c2",n:"카라쿠사타운",desc:"첫 번째 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion"],reqBadges:0,trainers:[]},
{id:"u_r2",n:"2번도로",desc:"카라쿠사타운~산요우시티",lv:[4,7],pokemon:[{k:"lillipup",w:30},{k:"patrat",w:30},{k:"purrloin",w:40}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:0,trainers:[{n:"소녀 미치",em:"👧",pokemon:[{k:"purrloin",l:6},{k:"patrat",l:5}],reward:180},{n:"소년 타이호",em:"👦",pokemon:[{k:"lillipup",l:7}],reward:210},{n:"등산가 하야토",em:"🧗",pokemon:[{k:"patrat",l:5},{k:"lillipup",l:6}],reward:180},{n:"소녀 유나",em:"👧",pokemon:[{k:"purrloin",l:7},{k:"patrat",l:6}],reward:210}]},
{id:"u_c3",n:"산요우시티",desc:"첫 번째 체육관의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote"],reqBadges:0,trainers:[]},
{id:"u_r3",n:"꿈터",desc:"신비로운 꿈의 장소",lv:[8,12],pokemon:[{k:"munna",w:25},{k:"patrat",w:25},{k:"purrloin",w:25},{k:"audino",w:25},{k:"musharna",w:3}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:0,trainers:[{n:"과학자 아키토",em:"🔬",pokemon:[{k:"munna",l:10}],reward:300},{n:"소녀 나나미",em:"👧",pokemon:[{k:"patrat",l:9},{k:"purrloin",l:10}],reward:300},{n:"소년 히데키",em:"👦",pokemon:[{k:"audino",l:11}],reward:330},{n:"연구원 미라이",em:"🔬",pokemon:[{k:"munna",l:10},{k:"patrat",l:9}],reward:300},{n:"소녀 레이린",em:"👧",pokemon:[{k:"purrloin",l:11},{k:"munna",l:12}],reward:360}]},
{id:"u_r4",n:"3번도로",desc:"산요우시티~시포우시티",lv:[8,12],pokemon:[{k:"pidove",w:30},{k:"blitzle",w:25},{k:"lillipup",w:25},{k:"audino",w:20},{k:"simisage",w:3},{k:"whimsicott",w:3},{k:"lilligant",w:3},{k:"roggenrola",w:10}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:1,trainers:[{n:"소년 료우",em:"👦",pokemon:[{k:"pidove",l:9},{k:"blitzle",l:10}],reward:300},{n:"소녀 카즈미",em:"👧",pokemon:[{k:"lillipup",l:10},{k:"audino",l:11}],reward:330},{n:"등산가 대수",em:"🧗",pokemon:[{k:"blitzle",l:11}],reward:330},{n:"소년 유우키",em:"👦",pokemon:[{k:"pidove",l:10},{k:"lillipup",l:10},{k:"blitzle",l:12}],reward:360},{n:"소녀 하루에",em:"👧",pokemon:[{k:"audino",l:12}],reward:360}]},
{id:"u_c4",n:"시포우시티",desc:"두 번째 체육관의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","potion","antidote"],reqBadges:1,trainers:[]},
{id:"u_r5",n:"바람개비숲",desc:"울창한 숲속",lv:[13,16],pokemon:[{k:"cottonee",w:15},{k:"petilil",w:15},{k:"sewaddle",w:15},{k:"venipede",w:10},{k:"pidove",w:10},{k:"timburr",w:10},{k:"tympole",w:10},{k:"throh",w:8},{k:"sawk",w:7},{k:"zorua",w:3}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:2,trainers:[{n:"등산가 세이치로",em:"🧗",pokemon:[{k:"timburr",l:14},{k:"tympole",l:13}],reward:420},{n:"소녀 나오",em:"👧",pokemon:[{k:"cottonee",l:14},{k:"petilil",l:15}],reward:450},{n:"소년 나오키",em:"👦",pokemon:[{k:"sewaddle",l:14},{k:"venipede",l:15}],reward:450},{n:"유도가 고이치",em:"🥋",pokemon:[{k:"throh",l:16}],reward:480},{n:"가라데왕 무네토시",em:"🥋",pokemon:[{k:"sawk",l:16}],reward:480},{n:"소녀 치카라",em:"👧",pokemon:[{k:"pidove",l:13},{k:"cottonee",l:14},{k:"petilil",l:15}],reward:450}]},
{id:"u_r21",n:"스카이애로우브릿지",desc:"바람개비숲~히운시티",lv:[14,17],pokemon:[{k:"ducklett",w:50},{k:"pidove",w:30},{k:"swanna",w:20}],hasCenter:false,hasShop:false,encounterRate:0.3,reqBadges:2,trainers:[]},
{id:"u_c5",n:"히운시티",desc:"세 번째 체육관의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","potion","superpotion"],reqBadges:2,trainers:[]},
{id:"u_r6",n:"4번도로",desc:"히운시티~라이몬시티",lv:[15,18],pokemon:[{k:"sandile",w:25},{k:"darumaka",w:25},{k:"scraggy",w:20},{k:"trubbish",w:15},{k:"minccino",w:15},{k:"herdier",w:8},{k:"krokorok",w:5}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:3,trainers:[{n:"소년 아키히토",em:"👦",pokemon:[{k:"sandile",l:16},{k:"darumaka",l:17}],reward:510},{n:"소녀 사토시",em:"👧",pokemon:[{k:"scraggy",l:16},{k:"minccino",l:17}],reward:510},{n:"깡패 헤이지",em:"😤",pokemon:[{k:"trubbish",l:17},{k:"sandile",l:18}],reward:540},{n:"소녀 스즈",em:"👧",pokemon:[{k:"darumaka",l:17},{k:"minccino",l:18}],reward:540},{n:"등산가 유조",em:"🧗",pokemon:[{k:"sandile",l:16},{k:"scraggy",l:17},{k:"darumaka",l:18}],reward:540}]},
{id:"u_r7",n:"사막유적",desc:"고대의 유적",lv:[19,22],pokemon:[{k:"sandile",w:35},{k:"yamask",w:35},{k:"sigilyph",w:30},{k:"simipour",w:3},{k:"basculin",w:10},{k:"frillish",w:8},{k:"alomomola",w:3}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:3,trainers:[{n:"오컬트매니아 카즈노리",em:"🔮",pokemon:[{k:"yamask",l:20},{k:"sigilyph",l:21}],reward:630},{n:"등산가 만이시",em:"🧗",pokemon:[{k:"sandile",l:20},{k:"sandile",l:21}],reward:630},{n:"소년 코우타",em:"👦",pokemon:[{k:"sigilyph",l:22}],reward:660},{n:"소녀 미유",em:"👧",pokemon:[{k:"yamask",l:20},{k:"sandile",l:21}],reward:630},{n:"연구원 한별",em:"🔬",pokemon:[{k:"yamask",l:21},{k:"sigilyph",l:22}],reward:660}]},
{id:"u_c6",n:"라이몬시티",desc:"네 번째 체육관의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["superball","superpotion","antidote","awakening"],reqBadges:3,trainers:[]},
{id:"u_r8",n:"5번도로",desc:"라이몬시티~호도모에시티",lv:[19,22],pokemon:[{k:"trubbish",w:13},{k:"minccino",w:18},{k:"liepard",w:13},{k:"gothorita",w:14},{k:"duosion",w:15},{k:"emolga",w:18},{k:"tirtouga",w:3},{k:"archen",w:3},{k:"snivy",w:3},{k:"tepig",w:3},{k:"oshawott",w:3},{k:"swoobat",w:5}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:4,trainers:[{n:"소녀 세은",em:"👧",pokemon:[{k:"minccino",l:20},{k:"trubbish",l:21}],reward:630},{n:"소년 토오루",em:"👦",pokemon:[{k:"gothorita",l:21},{k:"emolga",l:22}],reward:660},{n:"파일럿 쇼쿤",em:"✈️",pokemon:[{k:"liepard",l:22}],reward:660},{n:"소녀 코토네",em:"👧",pokemon:[{k:"duosion",l:21},{k:"emolga",l:22}],reward:660},{n:"등산가 메이지",em:"🧗",pokemon:[{k:"trubbish",l:20},{k:"minccino",l:21},{k:"liepard",l:22}],reward:660}]},
{id:"u_r22",n:"시린더브릿지",desc:"5번도로~호도모에시티",lv:[20,24],pokemon:[{k:"ducklett",w:60},{k:"swanna",w:40}],hasCenter:false,hasShop:false,encounterRate:0.3,reqBadges:4,trainers:[]},
{id:"u_c7",n:"호도모에시티",desc:"다섯 번째 체육관의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["superball","superpotion","revive"],reqBadges:4,trainers:[]},
{id:"u_r9",n:"냉동컨테이너",desc:"차가운 저장소",lv:[22,25],pokemon:[{k:"vanillite",w:55},{k:"timburr",w:45},{k:"maractus",w:8},{k:"cinccino",w:3},{k:"vanillish",w:10}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:4,trainers:[{n:"작업원 무네테츠",em:"👷",pokemon:[{k:"timburr",l:23},{k:"vanillite",l:24}],reward:720},{n:"작업원 쇼이치",em:"👷",pokemon:[{k:"vanillite",l:24},{k:"timburr",l:23}],reward:720},{n:"소년 세이이치",em:"👦",pokemon:[{k:"vanillite",l:25}],reward:750},{n:"작업원 시게루",em:"👷",pokemon:[{k:"timburr",l:24},{k:"vanillite",l:25}],reward:750}]},
{id:"u_r10",n:"6번도로",desc:"호도모에시티~후키요세시티",lv:[22,26],pokemon:[{k:"deerling",w:20},{k:"karrablast",w:15},{k:"shelmet",w:15},{k:"tranquill",w:20},{k:"foongus",w:15},{k:"swadloon",w:15},{k:"simisear",w:3},{k:"gigalith",w:3},{k:"drilbur",w:8},{k:"eelektross",w:2},{k:"elgyem",w:8},{k:"whirlipede",w:8},{k:"eelektrik",w:5}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:5,trainers:[{n:"소년 민혁",em:"👦",pokemon:[{k:"deerling",l:23},{k:"karrablast",l:24}],reward:720},{n:"소녀 카구라",em:"👧",pokemon:[{k:"shelmet",l:23},{k:"tranquill",l:24}],reward:720},{n:"등산가 코지",em:"🧗",pokemon:[{k:"foongus",l:24},{k:"swadloon",l:25}],reward:750},{n:"소녀 시즈카",em:"👧",pokemon:[{k:"deerling",l:24},{k:"foongus",l:25}],reward:750},{n:"레인저 유토",em:"🌿",pokemon:[{k:"tranquill",l:25},{k:"karrablast",l:26}],reward:780},{n:"소년 유지",em:"👦",pokemon:[{k:"swadloon",l:25},{k:"shelmet",l:26}],reward:780}]},
{id:"u_r11",n:"전기돌동굴",desc:"전기가 흐르는 동굴",lv:[24,28],pokemon:[{k:"joltik",w:20},{k:"klink",w:15},{k:"ferroseed",w:15},{k:"boldore",w:20},{k:"tynamo",w:15},{k:"nosepass",w:15},{k:"galvantula",w:5},{k:"ferrothorn",w:5},{k:"klang",w:8}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:5,trainers:[{n:"과학자 마사히로",em:"🔬",pokemon:[{k:"joltik",l:25},{k:"klink",l:26}],reward:780},{n:"연구원 소라",em:"🔬",pokemon:[{k:"ferroseed",l:26},{k:"tynamo",l:27}],reward:810},{n:"등산가 유테츠",em:"🧗",pokemon:[{k:"boldore",l:27},{k:"nosepass",l:26}],reward:810},{n:"소녀 하윤",em:"👧",pokemon:[{k:"joltik",l:26},{k:"klink",l:27}],reward:810},{n:"과학자 신지",em:"🔬",pokemon:[{k:"tynamo",l:27},{k:"ferroseed",l:28}],reward:840},{n:"소년 마코토",em:"👦",pokemon:[{k:"boldore",l:27},{k:"joltik",l:28}],reward:840}]},
{id:"u_c8",n:"후키요세시티",desc:"여섯 번째 체육관의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["superball","ultraball","hyperpotion","revive"],reqBadges:5,trainers:[]},
{id:"u_r12",n:"7번도로",desc:"후키요세시티~셋카시티",lv:[25,29],pokemon:[{k:"tranquill",w:20},{k:"watchog",w:15},{k:"zebstrika",w:15},{k:"deerling",w:20},{k:"foongus",w:15},{k:"cubchoo",w:15},{k:"gothita",w:8},{k:"solosis",w:8},{k:"swoobat",w:8}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:6,trainers:[{n:"소녀 유지",em:"👧",pokemon:[{k:"tranquill",l:26},{k:"deerling",l:27}],reward:810},{n:"소년 시한",em:"👦",pokemon:[{k:"watchog",l:27},{k:"zebstrika",l:28}],reward:840},{n:"등산가 석현",em:"🧗",pokemon:[{k:"foongus",l:27},{k:"cubchoo",l:28}],reward:840},{n:"소녀 이오리",em:"👧",pokemon:[{k:"deerling",l:28},{k:"tranquill",l:29}],reward:870},{n:"레인저 무네토",em:"🌿",pokemon:[{k:"zebstrika",l:28},{k:"cubchoo",l:29}],reward:870}]},
{id:"u_r13",n:"탑산",desc:"험준한 산길",lv:[28,33],pokemon:[{k:"boldore",w:18},{k:"woobat",w:15},{k:"gurdurr",w:15},{k:"cubchoo",w:15},{k:"cryogonal",w:10},{k:"heatmor",w:14},{k:"durant",w:13},{k:"escavalier",w:3},{k:"litwick",w:8},{k:"accelgor",w:3},{k:"beartic",w:5},{k:"vanillish",w:8}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:6,trainers:[{n:"등산가 켄지",em:"🧗",pokemon:[{k:"boldore",l:29},{k:"gurdurr",l:30}],reward:900},{n:"소녀 치하루",em:"👧",pokemon:[{k:"woobat",l:30},{k:"cubchoo",l:31}],reward:930},{n:"소년 한솔",em:"👦",pokemon:[{k:"heatmor",l:31},{k:"durant",l:32}],reward:960},{n:"등산가 타이잔",em:"🧗",pokemon:[{k:"boldore",l:30},{k:"cryogonal",l:32}],reward:960},{n:"소녀 지민",em:"👧",pokemon:[{k:"cubchoo",l:31},{k:"woobat",l:32}],reward:960},{n:"등산가 소라",em:"🧗",pokemon:[{k:"gurdurr",l:32},{k:"boldore",l:33}],reward:990}]},
{id:"u_c9",n:"셋카시티",desc:"일곱 번째 체육관의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","hyperpotion","revive","fullheal"],reqBadges:6,trainers:[]},
{id:"u_r14",n:"용나선탑",desc:"용의 전설이 잠든 탑",lv:[30,40],pokemon:[{k:"golbat",w:30},{k:"druddigon",w:20},{k:"mienfoo",w:25},{k:"golett",w:25}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:7,trainers:[{n:"오컬트매니아 카즈미",em:"🔮",pokemon:[{k:"golbat",l:33},{k:"golett",l:35}],reward:1050},{n:"용사 카즈마",em:"⚔️",pokemon:[{k:"druddigon",l:38}],reward:1140},{n:"등산가 세이고",em:"🧗",pokemon:[{k:"mienfoo",l:35},{k:"golbat",l:36}],reward:1080},{n:"소녀 엔코",em:"👧",pokemon:[{k:"golett",l:36},{k:"druddigon",l:40}],reward:1200},{n:"용사 아키나",em:"⚔️",pokemon:[{k:"mienfoo",l:37},{k:"druddigon",l:39}],reward:1170}]},
{id:"u_r15",n:"8번도로",desc:"셋카시티~소류시티",lv:[30,35],pokemon:[{k:"stunfisk",w:25},{k:"palpitoad",w:20},{k:"shelmet",w:20},{k:"karrablast",w:20},{k:"croagunk",w:15},{k:"seismitoad",w:5},{k:"scrafty",w:5},{k:"darmanitan",w:3}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:7,trainers:[{n:"낚시꾼 노보루",em:"🎣",pokemon:[{k:"stunfisk",l:31},{k:"palpitoad",l:32}],reward:960},{n:"소년 타쿠야",em:"👦",pokemon:[{k:"shelmet",l:32},{k:"karrablast",l:33}],reward:990},{n:"소녀 나에",em:"👧",pokemon:[{k:"croagunk",l:33},{k:"palpitoad",l:34}],reward:1020},{n:"등산가 노리히로",em:"🧗",pokemon:[{k:"stunfisk",l:33},{k:"karrablast",l:34}],reward:1020},{n:"소년 코우야",em:"👦",pokemon:[{k:"shelmet",l:34},{k:"croagunk",l:35}],reward:1050}]},
{id:"u_r23",n:"튜블린브릿지",desc:"8번도로~9번도로",lv:[30,34],pokemon:[{k:"tranquill",w:60},{k:"unfezant",w:40}],hasCenter:false,hasShop:false,encounterRate:0.3,reqBadges:7,trainers:[]},
{id:"u_c10",n:"소류시티",desc:"여덟 번째 체육관의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","hyperpotion","revive","fullheal"],reqBadges:7,trainers:[]},
{id:"u_r16",n:"9번도로",desc:"소류시티 외곽",lv:[31,36],pokemon:[{k:"gothorita",w:20},{k:"duosion",w:20},{k:"garbodor",w:20},{k:"liepard",w:20},{k:"pawniard",w:20},{k:"axew",w:8},{k:"beheeyem",w:5},{k:"klinklang",w:3},{k:"stoutland",w:5}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:8,trainers:[{n:"소녀 하린",em:"👧",pokemon:[{k:"gothorita",l:32},{k:"duosion",l:33}],reward:990},{n:"깡패 건달",em:"😤",pokemon:[{k:"garbodor",l:34},{k:"liepard",l:35}],reward:1050},{n:"소년 슌스케",em:"👦",pokemon:[{k:"pawniard",l:34},{k:"gothorita",l:35}],reward:1050},{n:"소녀 레이지",em:"👧",pokemon:[{k:"duosion",l:35},{k:"liepard",l:36}],reward:1080},{n:"파일럿 타이세이",em:"✈️",pokemon:[{k:"pawniard",l:35},{k:"garbodor",l:36}],reward:1080}]},
{id:"u_r17",n:"10번도로",desc:"포켓몬리그로 향하는 길",lv:[31,37],pokemon:[{k:"bouffalant",w:25},{k:"sawk",w:15},{k:"throh",w:15},{k:"vullaby",w:20},{k:"rufflet",w:25},{k:"chandelure",w:2},{k:"larvesta",w:2},{k:"darmanitan",w:5},{k:"scrafty",w:5}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:8,trainers:[{n:"유도가 고호",em:"🥋",pokemon:[{k:"throh",l:33},{k:"sawk",l:34}],reward:1020},{n:"소년 유아키",em:"👦",pokemon:[{k:"bouffalant",l:35}],reward:1050},{n:"소녀 유나",em:"👧",pokemon:[{k:"vullaby",l:34},{k:"rufflet",l:35}],reward:1050},{n:"등산가 마사오",em:"🧗",pokemon:[{k:"bouffalant",l:35},{k:"sawk",l:36}],reward:1080},{n:"소녀 세이카",em:"👧",pokemon:[{k:"rufflet",l:36},{k:"throh",l:37}],reward:1110},{n:"소년 하루키",em:"👦",pokemon:[{k:"vullaby",l:36},{k:"bouffalant",l:37}],reward:1110}]},
{id:"u_r18",n:"챔피언로드",desc:"최강 트레이너의 관문",lv:[37,42],pokemon:[{k:"boldore",w:18},{k:"excadrill",w:12},{k:"mienfoo",w:15},{k:"mienshao",w:10},{k:"deino",w:15},{k:"heatmor",w:15},{k:"durant",w:15},{k:"conkeldurr",w:2},{k:"vanilluxe",w:3}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:8,trainers:[{n:"등산가 만지",em:"🧗",pokemon:[{k:"boldore",l:38},{k:"excadrill",l:39}],reward:1170},{n:"유도가 민철",em:"🥋",pokemon:[{k:"mienfoo",l:39},{k:"mienshao",l:41}],reward:1230},{n:"소녀 시즈쿠",em:"👧",pokemon:[{k:"heatmor",l:40},{k:"durant",l:40}],reward:1200},{n:"등산가 철호",em:"🧗",pokemon:[{k:"boldore",l:39},{k:"excadrill",l:41}],reward:1230},{n:"소년 아키토",em:"👦",pokemon:[{k:"deino",l:40},{k:"heatmor",l:41}],reward:1230},{n:"소녀 미즈키",em:"👧",pokemon:[{k:"mienshao",l:41},{k:"durant",l:42}],reward:1260},{n:"에이스트레이너 승리",em:"⭐",pokemon:[{k:"excadrill",l:41},{k:"mienshao",l:42},{k:"deino",l:42}],reward:1260}]},
{id:"u_c11",n:"포켓몬리그",desc:"최강의 전당",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","maxpotion","revive","fullheal"],reqBadges:8,trainers:[]},
{id:"u_r24",n:"N의성",desc:"플라스마단의 최종 거점",lv:[40,50],pokemon:[{k:"golbat",w:20},{k:"litwick",w:15},{k:"lampent",w:15},{k:"chandelure",w:5},{k:"bisharp",w:15},{k:"pawniard",w:15},{k:"zoroark",w:5},{k:"cofagrigus",w:10}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:8,trainers:[{n:"플라스마단원 겐",em:"💀",pokemon:[{k:"liepard",l:42},{k:"cofagrigus",l:44}],reward:1320},{n:"플라스마단원 리사",em:"💀",pokemon:[{k:"golbat",l:43},{k:"bisharp",l:45}],reward:1350},{n:"플라스마단원 유우",em:"💀",pokemon:[{k:"chandelure",l:46},{k:"zoroark",l:48}],reward:1440},{n:"현자 로트",em:"🧙",pokemon:[{k:"cofagrigus",l:48},{k:"bisharp",l:50}],reward:1500}]},
{id:"u_r25",n:"11번도로",desc:"소류시티~빌리지브릿지",lv:[47,52],pokemon:[{k:"garbodor",w:15},{k:"amoonguss",w:20},{k:"karrablast",w:15},{k:"shelmet",w:15},{k:"pawniard",w:15},{k:"vullaby",w:20},{k:"herdier",w:8}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:8,trainers:[{n:"소녀 아유미",em:"👧",pokemon:[{k:"amoonguss",l:48},{k:"garbodor",l:49}],reward:1470},{n:"소년 타쿠미",em:"👦",pokemon:[{k:"pawniard",l:49},{k:"karrablast",l:50}],reward:1500},{n:"레인저 마유",em:"🌿",pokemon:[{k:"shelmet",l:50},{k:"vullaby",l:51}],reward:1530}]},
{id:"u_r26",n:"빌리지브릿지",desc:"11번도로~12번도로",lv:[48,53],pokemon:[{k:"basculin",w:30},{k:"maractus",w:20},{k:"swanna",w:25},{k:"emolga",w:25}],hasCenter:false,hasShop:false,encounterRate:0.4,reqBadges:8,trainers:[{n:"기타리스트 소헤이",em:"🎸",pokemon:[{k:"emolga",l:50},{k:"zebstrika",l:51}],reward:1530},{n:"소녀 카나에",em:"👧",pokemon:[{k:"swanna",l:51},{k:"maractus",l:52}],reward:1560}]},
{id:"u_r27",n:"12번도로",desc:"빌리지브릿지~카고메타운",lv:[48,53],pokemon:[{k:"tranquill",w:15},{k:"sawsbuck",w:20},{k:"scolipede",w:15},{k:"unfezant",w:10},{k:"mandibuzz",w:15},{k:"braviary",w:15},{k:"deerling",w:10}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:8,trainers:[{n:"소녀 미나",em:"👧",pokemon:[{k:"sawsbuck",l:49},{k:"unfezant",l:50}],reward:1500},{n:"소년 코헤이",em:"👦",pokemon:[{k:"scolipede",l:50},{k:"braviary",l:51}],reward:1530},{n:"등산가 이와오",em:"🧗",pokemon:[{k:"mandibuzz",l:51},{k:"sawsbuck",l:52}],reward:1560}]},
{id:"u_c12",n:"카고메타운",desc:"전설이 잠든 마을",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","maxpotion","fullrestore","fullheal","revive"],reqBadges:8,trainers:[]},
{id:"u_r28",n:"13번도로",desc:"카고메타운~거대한구멍",lv:[49,55],pokemon:[{k:"crustle",w:15},{k:"dwebble",w:10},{k:"frillish",w:15},{k:"alomomola",w:15},{k:"jellicent",w:10},{k:"swanna",w:15},{k:"basculin",w:20}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:8,trainers:[{n:"낚시꾼 사토루",em:"🎣",pokemon:[{k:"basculin",l:50},{k:"alomomola",l:51}],reward:1530},{n:"수영선수 시오리",em:"🏊",pokemon:[{k:"frillish",l:51},{k:"jellicent",l:53}],reward:1590},{n:"소년 아츠시",em:"👦",pokemon:[{k:"crustle",l:52},{k:"swanna",l:53}],reward:1590}]},
{id:"u_r19",n:"거대한구멍",desc:"미지의 심연",lv:[44,56],pokemon:[{k:"clefairy",w:15},{k:"piloswine",w:12},{k:"delibird",w:12},{k:"sneasel",w:15},{k:"ditto",w:10},{k:"lunatone",w:12},{k:"solrock",w:12},{k:"metang",w:12},{k:"archeops",w:3},{k:"carracosta",w:3},{k:"toxicroak",w:5}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:8,trainers:[{n:"연구원 코유키",em:"🔬",pokemon:[{k:"clefairy",l:46},{k:"lunatone",l:48}],reward:1440},{n:"등산가 쿄호",em:"🧗",pokemon:[{k:"piloswine",l:48},{k:"metang",l:50}],reward:1500},{n:"소녀 미소라",em:"👧",pokemon:[{k:"delibird",l:47},{k:"sneasel",l:49}],reward:1470},{n:"과학자 마사나리",em:"🔬",pokemon:[{k:"ditto",l:50},{k:"solrock",l:52}],reward:1560},{n:"소년 하준",em:"👦",pokemon:[{k:"sneasel",l:52},{k:"metang",l:54}],reward:1620},{n:"에이스트레이너 나레",em:"⭐",pokemon:[{k:"piloswine",l:54},{k:"clefairy",l:53},{k:"metang",l:56}],reward:1680}]},
{id:"u_c13",n:"사자나미타운",desc:"아름다운 해변 리조트",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","maxpotion","fullrestore","fullheal","revive"],reqBadges:8,trainers:[]},
{id:"u_r29",n:"14번도로",desc:"사자나미타운~블랙시티",lv:[49,55],pokemon:[{k:"mienfoo",w:15},{k:"mienshao",w:10},{k:"druddigon",w:15},{k:"bouffalant",w:20},{k:"haxorus",w:5},{k:"fraxure",w:15},{k:"axew",w:10},{k:"golett",w:10}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:8,trainers:[{n:"유도가 마사키",em:"🥋",pokemon:[{k:"mienfoo",l:50},{k:"mienshao",l:52}],reward:1560},{n:"소녀 레나",em:"👧",pokemon:[{k:"fraxure",l:52},{k:"druddigon",l:53}],reward:1590},{n:"등산가 겐타",em:"🧗",pokemon:[{k:"bouffalant",l:53},{k:"golett",l:54}],reward:1620}]},
{id:"u_c14",n:"블랙시티",desc:"발전된 미래의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","maxpotion","fullrestore","fullheal","revive"],reqBadges:8,trainers:[]},
{id:"u_c15",n:"화이트포레스트",desc:"자연이 가득한 숲",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","maxpotion","fullrestore","fullheal","revive"],reqBadges:8,trainers:[]},
{id:"u_r30",n:"15번도로",desc:"블랙시티 서쪽",lv:[49,55],pokemon:[{k:"scolipede",w:15},{k:"leavanny",w:15},{k:"whimsicott",w:15},{k:"lilligant",w:15},{k:"sawsbuck",w:20},{k:"unfezant",w:20}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:8,trainers:[{n:"파일럿 슈이치",em:"✈️",pokemon:[{k:"unfezant",l:51},{k:"sawsbuck",l:52}],reward:1560},{n:"소녀 후미카",em:"👧",pokemon:[{k:"leavanny",l:52},{k:"whimsicott",l:53}],reward:1590}]},
{id:"u_r31",n:"16번도로",desc:"라이몬시티 서쪽",lv:[49,55],pokemon:[{k:"liepard",w:20},{k:"gothitelle",w:15},{k:"reuniclus",w:15},{k:"zebstrika",w:20},{k:"cinccino",w:15},{k:"emolga",w:15}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:8,trainers:[{n:"소녀 세이라",em:"👧",pokemon:[{k:"gothitelle",l:51},{k:"reuniclus",l:52}],reward:1560},{n:"소년 하야토",em:"👦",pokemon:[{k:"cinccino",l:52},{k:"zebstrika",l:53}],reward:1590}]},
{id:"u_r32",n:"원더브릿지",desc:"16번도로~연결",lv:[48,55],pokemon:[{k:"swanna",w:50},{k:"sigilyph",w:50}],hasCenter:false,hasShop:false,encounterRate:0.3,reqBadges:8,trainers:[]},
{id:"u_r33",n:"17번수로",desc:"1번도로 남쪽 해역",lv:[48,55],pokemon:[{k:"frillish",w:20},{k:"jellicent",w:15},{k:"basculin",w:25},{k:"alomomola",w:15},{k:"swanna",w:15},{k:"ducklett",w:10}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:8,trainers:[{n:"수영선수 카이토",em:"🏊",pokemon:[{k:"basculin",l:50},{k:"jellicent",l:52}],reward:1560},{n:"낚시꾼 이사무",em:"🎣",pokemon:[{k:"alomomola",l:51},{k:"frillish",l:52}],reward:1560}]},
{id:"u_r34",n:"18번도로",desc:"17번수로 너머 섬",lv:[49,56],pokemon:[{k:"crustle",w:15},{k:"scolipede",w:15},{k:"throh",w:15},{k:"sawk",w:15},{k:"volcarona",w:3},{k:"larvesta",w:12},{k:"heatmor",w:15},{k:"durant",w:10}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:8,trainers:[{n:"유도가 켄이치",em:"🥋",pokemon:[{k:"throh",l:52},{k:"sawk",l:53}],reward:1590},{n:"등산가 노리오",em:"🧗",pokemon:[{k:"crustle",l:53},{k:"scolipede",l:54}],reward:1620},{n:"소녀 히나",em:"👧",pokemon:[{k:"heatmor",l:54},{k:"durant",l:55}],reward:1650}]},
{id:"u_c16",n:"카나와타운",desc:"기차가 모이는 한적한 마을",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","maxpotion","revive"],reqBadges:8,trainers:[]},
{id:"u_r20",n:"용의나선탑 심층부",desc:"용의 기운이 감도는 곳",lv:[50,60],pokemon:[{k:"golbat",w:25},{k:"druddigon",w:20},{k:"mienshao",w:20},{k:"golett",w:15},{k:"golurk",w:20}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:8,trainers:[{n:"용사 유우마",em:"⚔️",pokemon:[{k:"druddigon",l:52},{k:"golbat",l:53}],reward:1590},{n:"오컬트매니아 호시코",em:"🔮",pokemon:[{k:"golett",l:54},{k:"golurk",l:56}],reward:1680},{n:"등산가 만이시",em:"🧗",pokemon:[{k:"mienshao",l:55},{k:"druddigon",l:57}],reward:1710},{n:"에이스트레이너 텐사이",em:"⭐",pokemon:[{k:"golurk",l:58},{k:"mienshao",l:57}],reward:1740},{n:"용사 히카리",em:"⚔️",pokemon:[{k:"druddigon",l:58},{k:"golurk",l:60}],reward:1800}]},
{id:"u_c17",n:"히오우기시티",desc:"새로운 모험의 시작 (BW2)",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion"],reqBadges:0,trainers:[]},
{id:"u_r35",n:"19번도로",desc:"히오우기시티~산기타운",lv:[2,4],pokemon:[{k:"patrat",w:35},{k:"purrloin",w:35},{k:"pidove",w:30}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:0,trainers:[{n:"소년 지안",em:"👦",pokemon:[{k:"patrat",l:3},{k:"purrloin",l:3}],reward:90},{n:"소녀 하나",em:"👧",pokemon:[{k:"pidove",l:4}],reward:120}]},
{id:"u_c18",n:"산기타운",desc:"산기슭의 작은 마을 (BW2)",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion"],reqBadges:0,trainers:[]},
{id:"u_r36",n:"20번도로",desc:"산기타운~타치와키시티",lv:[4,8],pokemon:[{k:"pidove",w:25},{k:"sewaddle",w:20},{k:"venipede",w:20},{k:"lillipup",w:20},{k:"audino",w:15}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:1,trainers:[{n:"소년 나오토",em:"👦",pokemon:[{k:"sewaddle",l:5},{k:"pidove",l:6}],reward:180},{n:"소녀 리에",em:"👧",pokemon:[{k:"venipede",l:6},{k:"lillipup",l:7}],reward:210}]},
{id:"u_c19",n:"타치와키시티",desc:"영화의 도시 (BW2)",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote"],reqBadges:1,trainers:[]},
{id:"u_c20",n:"야마지타운",desc:"화산 근처 산길 마을 (BW2)",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","hyperpotion","revive"],reqBadges:7,trainers:[]},
{id:"u_r37",n:"마린튜브",desc:"사자나미타운~세이가이하시티",lv:[1,1],pokemon:[],hasCenter:false,hasShop:false,encounterRate:0,reqBadges:8,trainers:[]},
{id:"u_c21",n:"세이가이하시티",desc:"바다 위의 도시 (BW2)",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","maxpotion","fullrestore","fullheal","revive"],reqBadges:8,trainers:[]},
{id:"u_r38",n:"21번수로",desc:"세이가이하시티 인근 해역",lv:[48,55],pokemon:[{k:"frillish",w:20},{k:"jellicent",w:15},{k:"alomomola",w:20},{k:"basculin",w:20},{k:"swanna",w:15},{k:"stunfisk",w:10}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:8,trainers:[{n:"수영선수 타이가",em:"🏊",pokemon:[{k:"jellicent",l:51},{k:"swanna",l:52}],reward:1560},{n:"낚시꾼 류헤이",em:"🎣",pokemon:[{k:"alomomola",l:52},{k:"basculin",l:53}],reward:1590}]},
{id:"u_r39",n:"22번도로",desc:"세이가이하시티 북쪽",lv:[50,56],pokemon:[{k:"mienfoo",w:15},{k:"mienshao",w:10},{k:"crustle",w:15},{k:"krookodile",w:10},{k:"bouffalant",w:15},{k:"mandibuzz",w:15},{k:"braviary",w:10},{k:"deino",w:10}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:8,trainers:[{n:"등산가 시게오",em:"🧗",pokemon:[{k:"krookodile",l:52},{k:"bouffalant",l:53}],reward:1590},{n:"유도가 카오리",em:"🥋",pokemon:[{k:"mienshao",l:53},{k:"crustle",l:54}],reward:1620},{n:"소년 류이치",em:"👦",pokemon:[{k:"mandibuzz",l:54},{k:"braviary",l:55}],reward:1650}]},
{id:"u_r40",n:"23번도로",desc:"포켓몬리그로 향하는 새 길",lv:[52,58],pokemon:[{k:"boldore",w:15},{k:"excadrill",w:10},{k:"haxorus",w:5},{k:"zweilous",w:10},{k:"deino",w:15},{k:"golurk",w:10},{k:"bisharp",w:15},{k:"hydreigon",w:3},{k:"bouffalant",w:17}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:8,trainers:[{n:"에이스트레이너 마리코",em:"⭐",pokemon:[{k:"haxorus",l:54},{k:"bisharp",l:55}],reward:1650},{n:"에이스트레이너 소라",em:"⭐",pokemon:[{k:"excadrill",l:54},{k:"hydreigon",l:56}],reward:1680},{n:"등산가 코우지",em:"🧗",pokemon:[{k:"boldore",l:55},{k:"golurk",l:56},{k:"bouffalant",l:57}],reward:1710}]}
]},
kalos: {
    n: "칼로스지방", em: "🗼",
    roads: [
{id:"x_c1",n:"아사메타운",desc:"칼로스 모험의 시작",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion"],reqBadges:0,trainers:[]},
{id:"x_r1",n:"2번도로",desc:"아사메타운~백단숲",lv:[2,4],pokemon:[{k:"bunnelby",w:25},{k:"fletchling",w:25},{k:"scatterbug",w:20},{k:"zigzagoon",w:15},{k:"pidgey",w:15}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:0,trainers:[{n:"소년 칼렘",em:"👦",pokemon:[{k:"bunnelby",l:3},{k:"fletchling",l:4}],reward:120},{n:"소녀 세레나",em:"👧",pokemon:[{k:"scatterbug",l:3},{k:"pidgey",l:4}],reward:120},{n:"유치원생 마리",em:"👶",pokemon:[{k:"zigzagoon",l:3}],reward:90},{n:"소년 티에르노",em:"👦",pokemon:[{k:"bunnelby",l:4},{k:"scatterbug",l:4}],reward:120}]},
{id:"x_r2",n:"백단숲",desc:"벌레 포켓몬의 숲",lv:[2,5],pokemon:[{k:"caterpie",w:15},{k:"weedle",w:15},{k:"pikachu",w:5},{k:"pansage",w:10},{k:"pansear",w:10},{k:"panpour",w:10},{k:"fletchling",w:20},{k:"scatterbug",w:15}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:0,trainers:[{n:"충잡이 다니엘",em:"🐛",pokemon:[{k:"caterpie",l:3},{k:"weedle",l:4}],reward:120},{n:"소녀 에밀리",em:"👧",pokemon:[{k:"pikachu",l:5}],reward:150},{n:"소년 루카",em:"👦",pokemon:[{k:"pansage",l:4},{k:"fletchling",l:5}],reward:150},{n:"충잡이 니콜",em:"🐛",pokemon:[{k:"scatterbug",l:4},{k:"caterpie",l:5}],reward:150},{n:"소녀 소피",em:"👧",pokemon:[{k:"panpour",l:4},{k:"pansear",l:5}],reward:150}]},
{id:"x_r3",n:"3번도로",desc:"백단숲~하쿠단시티",lv:[3,5],pokemon:[{k:"bunnelby",w:25},{k:"fletchling",w:25},{k:"pidgey",w:20},{k:"bidoof",w:15},{k:"azurill",w:15}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:0,trainers:[{n:"소년 오스틴",em:"👦",pokemon:[{k:"bunnelby",l:4},{k:"pidgey",l:5}],reward:150},{n:"소녀 마리안",em:"👧",pokemon:[{k:"fletchling",l:5},{k:"azurill",l:4}],reward:150},{n:"쌍둥이 루시&앤",em:"👯",pokemon:[{k:"bidoof",l:4},{k:"bunnelby",l:5}],reward:150},{n:"소년 알렉스",em:"👦",pokemon:[{k:"pidgey",l:5},{k:"fletchling",l:5}],reward:150}]},
{id:"x_c2",n:"하쿠단시티",desc:"벌레 체육관의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote"],reqBadges:0,trainers:[]},
{id:"x_r4",n:"4번도로",desc:"하쿠단시티~미아레시티",lv:[6,8],pokemon:[{k:"ledyba",w:15},{k:"ralts",w:10},{k:"flabebe",w:25},{k:"skitty",w:15},{k:"budew",w:20},{k:"combee",w:15}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:1,trainers:[{n:"소녀 줄리",em:"👧",pokemon:[{k:"ledyba",l:6},{k:"flabebe",l:7}],reward:210},{n:"소년 토마",em:"👦",pokemon:[{k:"ralts",l:7},{k:"budew",l:8}],reward:240},{n:"소녀 클라라",em:"👧",pokemon:[{k:"skitty",l:7},{k:"combee",l:8}],reward:240},{n:"소년 에릭",em:"👦",pokemon:[{k:"flabebe",l:7},{k:"ledyba",l:8}],reward:240},{n:"아로마아가씨 로즈",em:"🌸",pokemon:[{k:"budew",l:8},{k:"ralts",l:8}],reward:240}]},
{id:"x_c3",n:"미아레시티",desc:"빛의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","potion","antidote"],reqBadges:1,trainers:[]},
{id:"x_r5",n:"5번도로",desc:"미아레시티~코보쿠타운",lv:[8,11],pokemon:[{k:"pancham",w:20},{k:"furfrou",w:10},{k:"skiddo",w:15},{k:"doduo",w:15},{k:"plusle",w:10},{k:"minun",w:10},{k:"gulpin",w:10},{k:"abra",w:10}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:1,trainers:[{n:"소년 쟌쿠",em:"👦",pokemon:[{k:"pancham",l:9},{k:"furfrou",l:10}],reward:300},{n:"소녀 제시카",em:"👧",pokemon:[{k:"skiddo",l:9},{k:"plusle",l:10}],reward:300},{n:"배틀걸 나디아",em:"💪",pokemon:[{k:"pancham",l:10},{k:"abra",l:11}],reward:330},{n:"소년 데이브",em:"👦",pokemon:[{k:"doduo",l:10},{k:"gulpin",l:10}],reward:300},{n:"소녀 레나",em:"👧",pokemon:[{k:"minun",l:9},{k:"furfrou",l:11}],reward:330},{n:"등산가 피에르",em:"🧗",pokemon:[{k:"pancham",l:10},{k:"skiddo",l:11}],reward:330}]},
{id:"x_c4",n:"코보쿠타운",desc:"자연이 풍부한 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["pokeball","superball","potion","superpotion"],reqBadges:1,trainers:[]},
{id:"x_r6",n:"6번도로",desc:"코보쿠타운~쇼요우시티",lv:[10,12],pokemon:[{k:"honedge",w:15},{k:"espurr",w:20},{k:"sentret",w:15},{k:"oddish",w:15},{k:"kecleon",w:10},{k:"nincada",w:10},{k:"audino",w:15},{k:"litleo",w:10},{k:"florges",w:2}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:1,trainers:[{n:"소녀 클로에",em:"👧",pokemon:[{k:"honedge",l:11},{k:"espurr",l:12}],reward:360},{n:"소년 빅토르",em:"👦",pokemon:[{k:"sentret",l:10},{k:"kecleon",l:11}],reward:330},{n:"오컬트매니아 모건",em:"🔮",pokemon:[{k:"espurr",l:11},{k:"oddish",l:12}],reward:360},{n:"소녀 릴리",em:"👧",pokemon:[{k:"audino",l:12},{k:"nincada",l:11}],reward:360},{n:"소년 앙드레",em:"👦",pokemon:[{k:"honedge",l:12},{k:"sentret",l:11}],reward:360}]},
{id:"x_r7",n:"7번도로",desc:"강가를 따라가는 길",lv:[12,14],pokemon:[{k:"hoppip",w:15},{k:"smeargle",w:10},{k:"volbeat",w:15},{k:"illumise",w:15},{k:"roselia",w:15},{k:"ducklett",w:15},{k:"croagunk",w:15}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:2,trainers:[{n:"소녀 이본",em:"👧",pokemon:[{k:"hoppip",l:12},{k:"roselia",l:13}],reward:390},{n:"소년 마르셀",em:"👦",pokemon:[{k:"smeargle",l:13},{k:"croagunk",l:14}],reward:420},{n:"충잡이 자크",em:"🐛",pokemon:[{k:"volbeat",l:13},{k:"illumise",l:13}],reward:390},{n:"소녀 베로니카",em:"👧",pokemon:[{k:"ducklett",l:13},{k:"roselia",l:14}],reward:420},{n:"레인저 파비앙",em:"🌿",pokemon:[{k:"hoppip",l:13},{k:"croagunk",l:14}],reward:420}]},
{id:"x_c5",n:"쇼요우시티",desc:"바위 체육관의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["superball","superpotion","awakening"],reqBadges:2,trainers:[]},
{id:"x_r8",n:"8번도로",desc:"쇼요우시티~빛나는동굴",lv:[13,15],pokemon:[{k:"absol",w:10},{k:"mienfoo",w:15},{k:"inkay",w:15},{k:"drifloon",w:15},{k:"spoink",w:15},{k:"zangoose",w:15},{k:"seviper",w:15}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:2,trainers:[{n:"소년 루이",em:"👦",pokemon:[{k:"absol",l:14},{k:"inkay",l:15}],reward:450},{n:"소녀 카밀라",em:"👧",pokemon:[{k:"mienfoo",l:14},{k:"drifloon",l:15}],reward:450},{n:"깡패 가스통",em:"😤",pokemon:[{k:"spoink",l:14},{k:"zangoose",l:15}],reward:450},{n:"소녀 아멜리",em:"👧",pokemon:[{k:"seviper",l:14},{k:"inkay",l:15}],reward:450},{n:"소년 기욤",em:"👦",pokemon:[{k:"absol",l:15},{k:"mienfoo",l:15}],reward:450},{n:"등산가 레옹",em:"🧗",pokemon:[{k:"drifloon",l:14},{k:"spoink",l:15}],reward:450}]},
{id:"x_r9",n:"빛나는동굴",desc:"보석이 빛나는 동굴",lv:[15,17],pokemon:[{k:"cubone",w:20},{k:"machop",w:15},{k:"onix",w:15},{k:"rhyhorn",w:15},{k:"mawile",w:15},{k:"lunatone",w:10},{k:"solrock",w:10},{k:"spritzee",w:8},{k:"swirlix",w:8}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:2,trainers:[{n:"등산가 마르탱",em:"🧗",pokemon:[{k:"cubone",l:15},{k:"machop",l:16}],reward:480},{n:"소녀 넬리",em:"👧",pokemon:[{k:"onix",l:16},{k:"mawile",l:17}],reward:510},{n:"등산가 브뤼노",em:"🧗",pokemon:[{k:"rhyhorn",l:16},{k:"cubone",l:17}],reward:510},{n:"연구원 앨리스",em:"🔬",pokemon:[{k:"lunatone",l:16},{k:"solrock",l:17}],reward:510},{n:"소년 디디에",em:"👦",pokemon:[{k:"machop",l:16},{k:"rhyhorn",l:17}],reward:510}]},
{id:"x_r10",n:"9번도로",desc:"사막의 통로",lv:[15,17],pokemon:[{k:"hippopotas",w:35},{k:"sandile",w:35},{k:"helioptile",w:30}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:3,trainers:[{n:"소년 아드리앙",em:"👦",pokemon:[{k:"hippopotas",l:16},{k:"sandile",l:17}],reward:510},{n:"소녀 마농",em:"👧",pokemon:[{k:"helioptile",l:16},{k:"hippopotas",l:17}],reward:510},{n:"등산가 클로드",em:"🧗",pokemon:[{k:"sandile",l:17},{k:"helioptile",l:17}],reward:510},{n:"소년 리암",em:"👦",pokemon:[{k:"hippopotas",l:17},{k:"sandile",l:17}],reward:510}]},
{id:"x_c6",n:"샤라시티",desc:"격투 체육관의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["superball","superpotion","revive"],reqBadges:3,trainers:[]},
{id:"x_r11",n:"반사의동굴",desc:"빛이 반사되는 동굴",lv:[21,23],pokemon:[{k:"wobbuffet",w:20},{k:"roggenrola",w:25},{k:"carbink",w:20},{k:"sableye",w:15},{k:"ferroseed",w:20}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:3,trainers:[{n:"등산가 셀린",em:"🧗",pokemon:[{k:"wobbuffet",l:21},{k:"roggenrola",l:22}],reward:660},{n:"소년 조엘",em:"👦",pokemon:[{k:"carbink",l:22},{k:"sableye",l:22}],reward:660},{n:"소녀 에스텔",em:"👧",pokemon:[{k:"ferroseed",l:22},{k:"roggenrola",l:23}],reward:690},{n:"등산가 모리스",em:"🧗",pokemon:[{k:"wobbuffet",l:22},{k:"carbink",l:23}],reward:690},{n:"소녀 마르고",em:"👧",pokemon:[{k:"sableye",l:22},{k:"ferroseed",l:23}],reward:690}]},
{id:"x_r12",n:"10번도로",desc:"샤라시티~카이나시티",lv:[19,21],pokemon:[{k:"eevee",w:10},{k:"snubbull",w:15},{k:"sigilyph",w:15},{k:"emolga",w:15},{k:"golett",w:15},{k:"hawlucha",w:15},{k:"houndour",w:15},{k:"binacle",w:8}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:3,trainers:[{n:"소년 파비앙",em:"👦",pokemon:[{k:"eevee",l:19},{k:"snubbull",l:20}],reward:600},{n:"소녀 로잔",em:"👧",pokemon:[{k:"sigilyph",l:20},{k:"emolga",l:21}],reward:630},{n:"레슬러 이고르",em:"💪",pokemon:[{k:"hawlucha",l:21}],reward:630},{n:"소년 마티유",em:"👦",pokemon:[{k:"golett",l:20},{k:"houndour",l:21}],reward:630},{n:"소녀 나탈리",em:"👧",pokemon:[{k:"eevee",l:20},{k:"emolga",l:21}],reward:630},{n:"등산가 가스파르",em:"🧗",pokemon:[{k:"hawlucha",l:20},{k:"snubbull",l:21}],reward:630}]},
{id:"x_r13",n:"11번도로",desc:"거친 들판",lv:[21,23],pokemon:[{k:"nidoranm",w:12},{k:"nidoranf",w:12},{k:"stunky",w:13},{k:"hariyama",w:10},{k:"staravia",w:13},{k:"dedenne",w:15},{k:"sawk",w:13},{k:"throh",w:12}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:4,trainers:[{n:"소녀 주디트",em:"👧",pokemon:[{k:"nidoranf",l:21},{k:"dedenne",l:22}],reward:660},{n:"유도가 히데오",em:"🥋",pokemon:[{k:"hariyama",l:23}],reward:690},{n:"소년 뤽",em:"👦",pokemon:[{k:"stunky",l:22},{k:"staravia",l:23}],reward:690},{n:"소녀 비르지니",em:"👧",pokemon:[{k:"nidoranm",l:22},{k:"dedenne",l:23}],reward:690},{n:"가라데왕 겐지",em:"🥋",pokemon:[{k:"sawk",l:22},{k:"throh",l:23}],reward:690},{n:"소년 르네",em:"👦",pokemon:[{k:"stunky",l:22},{k:"staravia",l:23}],reward:690}]},
{id:"x_c7",n:"카이나시티",desc:"풀 체육관의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["superball","superpotion","revive","antidote"],reqBadges:4,trainers:[]},
{id:"x_r14",n:"12번도로",desc:"해변을 따라가는 길",lv:[23,26],pokemon:[{k:"chatot",w:14},{k:"heracross",w:13},{k:"pinsir",w:13},{k:"tauros",w:13},{k:"miltank",w:10},{k:"pachirisu",w:13},{k:"slowpoke",w:15},{k:"skrelp",w:8},{k:"clauncher",w:8},{k:"chespin",w:3},{k:"fennekin",w:3},{k:"froakie",w:3}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:4,trainers:[{n:"소녀 엘리즈",em:"👧",pokemon:[{k:"chatot",l:24},{k:"pachirisu",l:25}],reward:750},{n:"소년 프랑미즈키",em:"👦",pokemon:[{k:"tauros",l:25},{k:"heracross",l:26}],reward:780},{n:"소녀 마들렌",em:"👧",pokemon:[{k:"miltank",l:25},{k:"pinsir",l:26}],reward:780},{n:"레인저 올리비에",em:"🌿",pokemon:[{k:"slowpoke",l:25},{k:"chatot",l:26}],reward:780},{n:"소년 샤를",em:"👦",pokemon:[{k:"heracross",l:25},{k:"pachirisu",l:26}],reward:780}]},
{id:"x_r15",n:"13번도로",desc:"건조한 황야",lv:[25,27],pokemon:[{k:"dugtrio",w:30},{k:"trapinch",w:25},{k:"gible",w:20},{k:"slugma",w:25},{k:"aromatisse",w:2},{k:"slurpuff",w:2}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:5,trainers:[{n:"소년 아르노",em:"👦",pokemon:[{k:"dugtrio",l:26},{k:"trapinch",l:27}],reward:810},{n:"소녀 마리옹",em:"👧",pokemon:[{k:"gible",l:27},{k:"slugma",l:26}],reward:810},{n:"등산가 조제프",em:"🧗",pokemon:[{k:"dugtrio",l:27},{k:"trapinch",l:27}],reward:810},{n:"소년 바티스트",em:"👦",pokemon:[{k:"gible",l:27},{k:"slugma",l:27}],reward:810}]},
{id:"x_c8",n:"미아레시티 체육관",desc:"전기 체육관의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["superball","ultraball","hyperpotion","revive"],reqBadges:5,trainers:[]},
{id:"x_r16",n:"14번도로",desc:"습지대의 길",lv:[30,32],pokemon:[{k:"haunter",w:20},{k:"weepinbell",w:15},{k:"quagsire",w:15},{k:"goomy",w:20},{k:"shelmet",w:15},{k:"karrablast",w:15}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:5,trainers:[{n:"오컬트매니아 세실",em:"🔮",pokemon:[{k:"haunter",l:30},{k:"weepinbell",l:31}],reward:930},{n:"소녀 아녜스",em:"👧",pokemon:[{k:"goomy",l:31},{k:"quagsire",l:32}],reward:960},{n:"소년 폴",em:"👦",pokemon:[{k:"shelmet",l:31},{k:"karrablast",l:32}],reward:960},{n:"소녀 도미니크",em:"👧",pokemon:[{k:"haunter",l:31},{k:"goomy",l:32}],reward:960},{n:"연구원 플로랑",em:"🔬",pokemon:[{k:"quagsire",l:31},{k:"weepinbell",l:32}],reward:960},{n:"소년 니콜라",em:"👦",pokemon:[{k:"karrablast",l:31},{k:"goomy",l:32}],reward:960}]},
{id:"x_c9",n:"쿠노에시티",desc:"페어리 체육관의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","hyperpotion","revive","fullheal"],reqBadges:5,trainers:[]},
{id:"x_r17",n:"15번도로",desc:"어두운 숲길",lv:[32,34],pokemon:[{k:"mightyena",w:15},{k:"liepard",w:15},{k:"foongus",w:20},{k:"klefki",w:15},{k:"murkrow",w:20},{k:"pawniard",w:15}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:6,trainers:[{n:"깡패 패트릭",em:"😤",pokemon:[{k:"mightyena",l:32},{k:"liepard",l:33}],reward:990},{n:"소녀 캐롤린",em:"👧",pokemon:[{k:"klefki",l:33},{k:"foongus",l:34}],reward:1020},{n:"소년 테오",em:"👦",pokemon:[{k:"murkrow",l:33},{k:"pawniard",l:34}],reward:1020},{n:"소녀 마리",em:"👧",pokemon:[{k:"mightyena",l:33},{k:"klefki",l:34}],reward:1020},{n:"등산가 자비에",em:"🧗",pokemon:[{k:"liepard",l:33},{k:"pawniard",l:34}],reward:1020}]},
{id:"x_r18",n:"16번도로",desc:"유령이 출몰하는 길",lv:[32,34],pokemon:[{k:"weepinbell",w:20},{k:"floatzel",w:20},{k:"skorupi",w:20},{k:"pumpkaboo",w:20},{k:"phantump",w:20}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:6,trainers:[{n:"소녀 오드",em:"👧",pokemon:[{k:"weepinbell",l:33},{k:"phantump",l:34}],reward:1020},{n:"소년 필립",em:"👦",pokemon:[{k:"floatzel",l:33},{k:"skorupi",l:34}],reward:1020},{n:"오컬트매니아 에디트",em:"🔮",pokemon:[{k:"pumpkaboo",l:33},{k:"phantump",l:34}],reward:1020},{n:"소녀 로르",em:"👧",pokemon:[{k:"floatzel",l:34},{k:"weepinbell",l:34}],reward:1020},{n:"소년 모리스",em:"👦",pokemon:[{k:"skorupi",l:33},{k:"pumpkaboo",l:34}],reward:1020}]},
{id:"x_r19",n:"서리동굴",desc:"얼음으로 뒤덮인 동굴",lv:[38,44],pokemon:[{k:"haunter",w:15},{k:"jynx",w:12},{k:"piloswine",w:15},{k:"beartic",w:12},{k:"cryogonal",w:10},{k:"vanillite",w:18},{k:"bergmite",w:18}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:6,trainers:[{n:"등산가 이반",em:"🧗",pokemon:[{k:"piloswine",l:39},{k:"vanillite",l:40}],reward:1200},{n:"소녀 올가",em:"👧",pokemon:[{k:"jynx",l:40},{k:"cryogonal",l:42}],reward:1260},{n:"소년 보리스",em:"👦",pokemon:[{k:"beartic",l:41},{k:"bergmite",l:42}],reward:1260},{n:"등산가 니키타",em:"🧗",pokemon:[{k:"haunter",l:40},{k:"piloswine",l:42}],reward:1260},{n:"소녀 타티아나",em:"👧",pokemon:[{k:"vanillite",l:42},{k:"jynx",l:44}],reward:1320},{n:"에이스트레이너 세르게이",em:"⭐",pokemon:[{k:"beartic",l:43},{k:"cryogonal",l:44}],reward:1320}]},
{id:"x_c10",n:"히요쿠시티",desc:"에스퍼 체육관의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","hyperpotion","revive","fullheal"],reqBadges:6,trainers:[]},
{id:"x_r20",n:"17번도로",desc:"눈보라치는 산길",lv:[38,42],pokemon:[{k:"sneasel",w:25},{k:"delibird",w:20},{k:"snover",w:30},{k:"abomasnow",w:25},{k:"trevenant",w:5},{k:"gourgeist",w:3}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:7,trainers:[{n:"소년 얀",em:"👦",pokemon:[{k:"sneasel",l:39},{k:"delibird",l:40}],reward:1200},{n:"소녀 에바",em:"👧",pokemon:[{k:"snover",l:40},{k:"abomasnow",l:42}],reward:1260},{n:"등산가 한스",em:"🧗",pokemon:[{k:"sneasel",l:40},{k:"snover",l:41}],reward:1230},{n:"소녀 헬가",em:"👧",pokemon:[{k:"delibird",l:40},{k:"abomasnow",l:42}],reward:1260},{n:"에이스트레이너 프리츠",em:"⭐",pokemon:[{k:"sneasel",l:41},{k:"abomasnow",l:42}],reward:1260}]},
{id:"x_c11",n:"에이세트시티",desc:"얼음 체육관의 도시",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","hyperpotion","maxpotion","revive","fullheal"],reqBadges:7,trainers:[]},
{id:"x_r21",n:"종착의동굴",desc:"대지의 끝 동굴",lv:[44,46],pokemon:[{k:"sandslash",w:18},{k:"graveler",w:18},{k:"lairon",w:15},{k:"pupitar",w:12},{k:"durant",w:20},{k:"noibat",w:17}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:7,trainers:[{n:"등산가 스테판",em:"🧗",pokemon:[{k:"sandslash",l:44},{k:"graveler",l:45}],reward:1350},{n:"소녀 에리카",em:"👧",pokemon:[{k:"lairon",l:45},{k:"noibat",l:46}],reward:1380},{n:"소년 하인츠",em:"👦",pokemon:[{k:"pupitar",l:45},{k:"durant",l:46}],reward:1380},{n:"등산가 디터",em:"🧗",pokemon:[{k:"sandslash",l:45},{k:"graveler",l:46}],reward:1380},{n:"소녀 잉그리드",em:"👧",pokemon:[{k:"noibat",l:45},{k:"lairon",l:46}],reward:1380},{n:"등산가 볼프",em:"🧗",pokemon:[{k:"durant",l:45},{k:"pupitar",l:46}],reward:1380}]},
{id:"x_r22",n:"19번도로",desc:"포켓몬리그로 향하는 길",lv:[45,48],pokemon:[{k:"weepinbell",w:25},{k:"haunter",w:25},{k:"quagsire",w:25},{k:"drapion",w:25}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:8,trainers:[{n:"소년 앙투안",em:"👦",pokemon:[{k:"weepinbell",l:46},{k:"haunter",l:47}],reward:1410},{n:"소녀 줄리엔",em:"👧",pokemon:[{k:"quagsire",l:46},{k:"drapion",l:48}],reward:1440},{n:"깡패 세바스티앙",em:"😤",pokemon:[{k:"drapion",l:47},{k:"haunter",l:48}],reward:1440},{n:"소녀 클레르",em:"👧",pokemon:[{k:"weepinbell",l:47},{k:"quagsire",l:48}],reward:1440},{n:"소년 알렉시",em:"👦",pokemon:[{k:"drapion",l:48},{k:"haunter",l:48}],reward:1440}]},
{id:"x_r23",n:"20번도로",desc:"포켓몬마을로 가는 길",lv:[48,50],pokemon:[{k:"amoonguss",w:25},{k:"jigglypuff",w:25},{k:"noctowl",w:25},{k:"zoroark",w:25}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:8,trainers:[{n:"소녀 비앙카",em:"👧",pokemon:[{k:"amoonguss",l:48},{k:"jigglypuff",l:49}],reward:1470},{n:"소년 레오나르도",em:"👦",pokemon:[{k:"noctowl",l:49},{k:"zoroark",l:50}],reward:1500},{n:"레인저 마르코",em:"🌿",pokemon:[{k:"amoonguss",l:49},{k:"noctowl",l:50}],reward:1500},{n:"소녀 이사벨라",em:"👧",pokemon:[{k:"jigglypuff",l:49},{k:"zoroark",l:50}],reward:1500},{n:"에이스트레이너 엔리코",em:"⭐",pokemon:[{k:"zoroark",l:50},{k:"amoonguss",l:50}],reward:1500}]},
{id:"x_r24",n:"챔피언로드",desc:"최강 트레이너의 관문",lv:[56,59],pokemon:[{k:"graveler",w:18},{k:"gurdurr",w:18},{k:"haunter",w:16},{k:"druddigon",w:16},{k:"zweilous",w:16},{k:"noibat",w:16},{k:"aegislash",w:2}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:8,trainers:[{n:"등산가 앙드레",em:"🧗",pokemon:[{k:"graveler",l:56},{k:"gurdurr",l:57}],reward:1710},{n:"소녀 베아트리스",em:"👧",pokemon:[{k:"haunter",l:57},{k:"noibat",l:58}],reward:1740},{n:"유도가 겐",em:"🥋",pokemon:[{k:"druddigon",l:58}],reward:1740},{n:"등산가 에밀",em:"🧗",pokemon:[{k:"graveler",l:57},{k:"gurdurr",l:58}],reward:1740},{n:"소녀 마리아",em:"👧",pokemon:[{k:"zweilous",l:58},{k:"haunter",l:59}],reward:1770},{n:"에이스트레이너 자크",em:"⭐",pokemon:[{k:"druddigon",l:58},{k:"noibat",l:59}],reward:1770},{n:"에이스트레이너 리즈",em:"⭐",pokemon:[{k:"zweilous",l:59},{k:"gurdurr",l:59}],reward:1770}]},
{id:"x_c12",n:"포켓몬리그",desc:"칼로스의 정상",isCity:true,hasCenter:true,hasShop:true,shopItems:["ultraball","maxpotion","revive","fullheal"],reqBadges:8,trainers:[]},
{id:"x_r25",n:"미아레시티",desc:"엔드게임 지역",lv:[50,60],pokemon:[{k:"zoroark",w:25},{k:"ditto",w:20},{k:"audino",w:30},{k:"chansey",w:25}],hasCenter:false,hasShop:false,encounterRate:0.80,reqBadges:8,trainers:[{n:"소녀 셀레스트",em:"👧",pokemon:[{k:"zoroark",l:52},{k:"audino",l:53}],reward:1590},{n:"소년 조르주",em:"👦",pokemon:[{k:"ditto",l:55},{k:"chansey",l:56}],reward:1680},{n:"에이스트레이너 이자벨",em:"⭐",pokemon:[{k:"zoroark",l:56},{k:"audino",l:58}],reward:1740},{n:"소녀 노에미",em:"👧",pokemon:[{k:"chansey",l:57},{k:"ditto",l:58}],reward:1740},{n:"에이스트레이너 막심",em:"⭐",pokemon:[{k:"zoroark",l:58},{k:"chansey",l:60}],reward:1800}]}
]}
};
// ═══════════════════════════════════════════════
// 🏅 체육관 데이터 (지역별, 관장이 세대별로 다른 경우 leaders 배열에 복수)
// ═══════════════════════════════════════════════
var GYMS = {
kanto: [
    {id:"k_gym1",city:"니비시티",n:"니비시티 체육관",type:"rock",badge:"회색뱃지",badgeEm:"🪨",
     gymTrainers:[{n:"등산가",pokemon:[{k:"geodude",l:10}],reward:200},{n:"등산가",pokemon:[{k:"sandshrew",l:11}],reward:220}],
     leaders:[
        {id:"brock_rgb",n:"타케시",em:"🏋️",gen:1,pokemon:[{k:"geodude",l:12},{k:"onix",l:14}],reward:1400,rewardItems:["tm39_rockslide"]},
        {id:"brock_hgss",n:"타케시",em:"🏋️",gen:2,reqBadges:8,pokemon:[{k:"graveler",l:51},{k:"rhyhorn",l:51},{k:"omastar",l:53},{k:"onix",l:54},{k:"kabutops",l:52}],reward:5400,rewardItems:["tm39_rockslide"]}
     ]},
    {id:"k_gym2",city:"하나다시티",n:"하나다시티 체육관",type:"water",badge:"블루뱃지",badgeEm:"💧",
     gymTrainers:[{n:"수영선수",pokemon:[{k:"horsea",l:16},{k:"shellder",l:16}],reward:320},{n:"수영선수",pokemon:[{k:"goldeen",l:18}],reward:360}],
     leaders:[
        {id:"misty_rgb",n:"카스미",em:"💧",gen:1,pokemon:[{k:"staryu",l:18},{k:"starmie",l:21}],reward:2100,rewardItems:["tm55_scald"]},
        {id:"misty_hgss",n:"카스미",em:"💧",gen:2,reqBadges:8,pokemon:[{k:"golduck",l:49},{k:"quagsire",l:49},{k:"lapras",l:52},{k:"starmie",l:54}],reward:5400,rewardItems:["tm55_scald"]}
     ]},
    {id:"k_gym3",city:"쿠치바시티",n:"쿠치바시티 체육관",type:"electric",badge:"오렌지뱃지",badgeEm:"⚡",
     gymTrainers:[{n:"선원",pokemon:[{k:"voltorb",l:18},{k:"magnemite",l:18}],reward:360},{n:"신사",pokemon:[{k:"pikachu",l:20}],reward:400}],
     leaders:[
        {id:"surge_rgb",n:"마치스",em:"⚡",gen:1,pokemon:[{k:"voltorb",l:21},{k:"pikachu",l:18},{k:"raichu",l:24}],reward:2400,rewardItems:["tm73_thunderwave"]},
        {id:"surge_hgss",n:"마치스",em:"⚡",gen:2,reqBadges:8,pokemon:[{k:"raichu",l:51},{k:"electrode",l:47},{k:"magneton",l:47},{k:"electabuzz",l:53}],reward:5300,rewardItems:["tm73_thunderwave"]}
     ]},
    {id:"k_gym4",city:"타마무시시티",n:"타마무시시티 체육관",type:"grass",badge:"레인보우뱃지",badgeEm:"🌈",
     gymTrainers:[{n:"아가씨",pokemon:[{k:"oddish",l:24},{k:"bellsprout",l:24}],reward:480},{n:"미녀",pokemon:[{k:"weepinbell",l:26}],reward:520},{n:"아가씨",pokemon:[{k:"gloom",l:26}],reward:520}],
     leaders:[
        {id:"erika_rgb",n:"에리카",em:"🌿",gen:1,pokemon:[{k:"victreebel",l:29},{k:"tangela",l:24},{k:"vileplume",l:29}],reward:2900,rewardItems:["tm86_grassknot"]},
        {id:"erika_hgss",n:"에리카",em:"🌿",gen:2,reqBadges:8,pokemon:[{k:"jumpluff",l:51},{k:"tangela",l:52},{k:"victreebel",l:56},{k:"bellossom",l:56}],reward:5600,rewardItems:["tm86_grassknot"]}
     ]},
    {id:"k_gym5",city:"세키치쿠시티",n:"세키치쿠시티 체육관",type:"poison",badge:"핑크뱃지",badgeEm:"☠️",
     gymTrainers:[{n:"유술가",pokemon:[{k:"koffing",l:34},{k:"grimer",l:34}],reward:680},{n:"닌자소년",pokemon:[{k:"venonat",l:34},{k:"venomoth",l:36}],reward:720}],
     leaders:[
        {id:"koga_rgb",n:"쿄우",em:"☠️",gen:1,pokemon:[{k:"koffing",l:37},{k:"muk",l:39},{k:"grimer",l:37},{k:"weezing",l:43}],reward:3700,rewardItems:["tm06_toxic"]},
        {id:"janine_hgss",n:"안즈",em:"🥷",gen:2,reqBadges:8,pokemon:[{k:"crobat",l:47},{k:"weezing",l:44},{k:"ariados",l:47},{k:"venomoth",l:50}],reward:5000,rewardItems:["tm84_poisonjab"]}
     ]},
    {id:"k_gym6",city:"야마부키시티",n:"야마부키시티 체육관",type:"psychic",badge:"골드뱃지",badgeEm:"🔮",
     gymTrainers:[{n:"심령술사",pokemon:[{k:"kadabra",l:36},{k:"slowpoke",l:36}],reward:720},{n:"초능력자",pokemon:[{k:"mrmime",l:38}],reward:760}],
     leaders:[
        {id:"sabrina_rgb",n:"나츠메",em:"🔮",gen:1,pokemon:[{k:"kadabra",l:38},{k:"mrmime",l:37},{k:"venomoth",l:38},{k:"alakazam",l:43}],reward:4300,rewardItems:["tm29_psychic"]},
        {id:"sabrina_hgss",n:"나츠메",em:"🔮",gen:2,reqBadges:8,pokemon:[{k:"espeon",l:53},{k:"mrmime",l:53},{k:"alakazam",l:55}],reward:5500,rewardItems:["tm29_psychic"]}
     ]},
    {id:"k_gym7",city:"구레네섬",n:"구레네섬 체육관",type:"fire",badge:"크림슨뱃지",badgeEm:"🔥",
     gymTrainers:[{n:"마니아",pokemon:[{k:"ponyta",l:38},{k:"growlithe",l:40}],reward:800},{n:"머리짱",pokemon:[{k:"rapidash",l:40}],reward:800}],
     leaders:[
        {id:"blaine_rgb",n:"카츠라",em:"🔥",gen:1,pokemon:[{k:"growlithe",l:42},{k:"ponyta",l:40},{k:"rapidash",l:42},{k:"arcanine",l:47}],reward:4700,rewardItems:["tm35_flamethrower"]},
        {id:"blaine_hgss",n:"카츠라",em:"🔥",gen:2,reqBadges:8,pokemon:[{k:"magcargo",l:54},{k:"magmar",l:54},{k:"rapidash",l:59}],reward:5900,rewardItems:["tm35_flamethrower"]}
     ]},
    {id:"k_gym8",city:"토키와시티",n:"토키와시티 체육관",type:"ground",badge:"그린뱃지",badgeEm:"🌍",
     gymTrainers:[{n:"쿨트레이너",pokemon:[{k:"nidorino",l:42},{k:"nidorina",l:42}],reward:840},{n:"쿨트레이너",pokemon:[{k:"rhyhorn",l:43},{k:"sandslash",l:43}],reward:860},{n:"쿨트레이너",pokemon:[{k:"dugtrio",l:44}],reward:880}],
     leaders:[
        {id:"giovanni_rgb",n:"사카키",em:"🦹",gen:1,pokemon:[{k:"rhyhorn",l:45},{k:"dugtrio",l:42},{k:"nidoqueen",l:44},{k:"nidoking",l:45},{k:"rhydon",l:50}],reward:6500,rewardItems:["tm26_earthquake","masterball"]},
        {id:"blue_hgss",n:"그린",em:"🏆",gen:2,reqBadges:8,pokemon:[{k:"pidgeot",l:56},{k:"alakazam",l:54},{k:"rhydon",l:56},{k:"gyarados",l:58},{k:"arcanine",l:58},{k:"exeggutor",l:58}],reward:8000}
     ]}
],
johto: [
    {id:"j_gym1",city:"키쿄우시티",n:"키쿄우시티 체육관",type:"flying",badge:"제피르뱃지",badgeEm:"🪶",
     gymTrainers:[{n:"새잡이 사이조",pokemon:[{k:"pidgey",l:5}],reward:100},{n:"새잡이 타쿠야",pokemon:[{k:"spearow",l:6},{k:"pidgey",l:6}],reward:120}],
     leaders:[{id:"falkner",n:"하야토",em:"🐦",gen:2,pokemon:[{k:"pidgey",l:7},{k:"pidgeotto",l:9}],reward:900,rewardItems:["tm40_aerialace"]},
        {id:"falkner_hgss",n:"하야토",em:"🐦",gen:4,reqBadges:8,pokemon:[{k:"pidgeot",l:50},{k:"noctowl",l:48},{k:"swellow",l:52},{k:"honchkrow",l:54},{k:"staraptor",l:56}],reward:5600}]},
    {id:"j_gym2",city:"히와다타운",n:"히와다타운 체육관",type:"bug",badge:"인섹트뱃지",badgeEm:"🐛",
     gymTrainers:[{n:"벌레잡이 토시카즈",pokemon:[{k:"caterpie",l:12},{k:"weedle",l:12}],reward:240},{n:"벌레잡이 아키",pokemon:[{k:"paras",l:13}],reward:260}],
     leaders:[{id:"bugsy",n:"츠쿠시",em:"🐛",gen:2,pokemon:[{k:"metapod",l:14},{k:"kakuna",l:14},{k:"scyther",l:16}],reward:1600,rewardItems:["tm89_uturn"]},
        {id:"bugsy_hgss",n:"츠쿠시",em:"🐛",gen:4,reqBadges:8,pokemon:[{k:"scizor",l:52},{k:"heracross",l:50},{k:"pinsir",l:48},{k:"yanmega",l:54},{k:"shedinja",l:48}],reward:5400}]},
    {id:"j_gym3",city:"코가네시티",n:"코가네시티 체육관",type:"normal",badge:"레귤러뱃지",badgeEm:"⭐",
     gymTrainers:[{n:"배틀걸 미키",pokemon:[{k:"meowth",l:16}],reward:320},{n:"소녀 치에",pokemon:[{k:"snubbull",l:16},{k:"jigglypuff",l:17}],reward:340}],
     leaders:[{id:"whitney",n:"아카네",em:"⭐",gen:2,pokemon:[{k:"clefairy",l:18},{k:"miltank",l:20}],reward:2000,rewardItems:["tm42_facade"]},
        {id:"whitney_hgss",n:"아카네",em:"⭐",gen:4,reqBadges:8,pokemon:[{k:"miltank",l:54},{k:"clefable",l:50},{k:"lickilicky",l:50},{k:"ambipom",l:52},{k:"bibarel",l:48}],reward:5400}]},
    {id:"j_gym4",city:"엔주시티",n:"엔주시티 체육관",type:"ghost",badge:"팬텀뱃지",badgeEm:"👻",
     gymTrainers:[{n:"오컬트매니아 겐",pokemon:[{k:"gastly",l:18},{k:"gastly",l:18}],reward:360},{n:"사이킥 마이",pokemon:[{k:"haunter",l:20}],reward:400},{n:"오컬트매니아 류",pokemon:[{k:"gastly",l:19},{k:"misdreavus",l:20}],reward:400}],
     leaders:[{id:"morty",n:"마츠바",em:"👻",gen:2,pokemon:[{k:"gastly",l:21},{k:"haunter",l:21},{k:"gengar",l:25},{k:"haunter",l:23}],reward:2500,rewardItems:["tm30_shadowball"]},
        {id:"morty_hgss",n:"마츠바",em:"👻",gen:4,reqBadges:8,pokemon:[{k:"gengar",l:54},{k:"mismagius",l:52},{k:"drifblim",l:50},{k:"dusknoir",l:52},{k:"sableye",l:50}],reward:5400}]},
    {id:"j_gym5",city:"탄바시티",n:"탄바시티 체육관",type:"fighting",badge:"쇼크뱃지",badgeEm:"💪",
     gymTrainers:[{n:"블랙벨트 타이헤이",pokemon:[{k:"machoke",l:25}],reward:500},{n:"블랙벨트 무사시",pokemon:[{k:"primeape",l:24},{k:"hitmonlee",l:25}],reward:500}],
     leaders:[{id:"chuck",n:"시지마",em:"💪",gen:2,pokemon:[{k:"primeape",l:27},{k:"poliwrath",l:30}],reward:3000,rewardItems:["tm01_focuspunch"]},
        {id:"chuck_hgss",n:"시지마",em:"💪",gen:4,reqBadges:8,pokemon:[{k:"poliwrath",l:54},{k:"primeape",l:52},{k:"machamp",l:56},{k:"medicham",l:50},{k:"breloom",l:50}],reward:5600}]},
    {id:"j_gym6",city:"아사기시티",n:"아사기시티 체육관",type:"steel",badge:"스틸뱃지",badgeEm:"⚙️",
     gymTrainers:[{n:"선원 고로",pokemon:[{k:"magnemite",l:27},{k:"magnemite",l:27}],reward:540},{n:"선원 타케시",pokemon:[{k:"steelix",l:29}],reward:580}],
     leaders:[{id:"jasmine",n:"미캉",em:"⚙️",gen:2,pokemon:[{k:"magnemite",l:30},{k:"magnemite",l:30},{k:"steelix",l:35}],reward:3500,rewardItems:["tm91_flashcannon"]},
        {id:"jasmine_hgss",n:"미캉",em:"⚙️",gen:4,reqBadges:8,pokemon:[{k:"steelix",l:56},{k:"magnezone",l:52},{k:"skarmory",l:50},{k:"bronzong",l:52},{k:"metagross",l:54}],reward:5400}]},
    {id:"j_gym7",city:"쵸우지타운",n:"쵸우지타운 체육관",type:"ice",badge:"아이스뱃지",badgeEm:"❄️",
     gymTrainers:[{n:"스키어 마키",pokemon:[{k:"swinub",l:25},{k:"dewgong",l:27}],reward:500},{n:"보드선수 류",pokemon:[{k:"seel",l:26},{k:"shellder",l:26}],reward:520}],
     leaders:[{id:"pryce",n:"야나기",em:"❄️",gen:2,pokemon:[{k:"seel",l:27},{k:"dewgong",l:29},{k:"piloswine",l:31}],reward:3100,rewardItems:["tm13_icebeam"]},
        {id:"pryce_hgss",n:"야나기",em:"❄️",gen:4,reqBadges:8,pokemon:[{k:"mamoswine",l:56},{k:"dewgong",l:50},{k:"froslass",l:52},{k:"abomasnow",l:52},{k:"walrein",l:54}],reward:5600}]},
    {id:"j_gym8",city:"후스베시티",n:"후스베시티 체육관",type:"dragon",badge:"라이징뱃지",badgeEm:"🐉",
     gymTrainers:[{n:"드래곤테이머 켄",pokemon:[{k:"dragonair",l:33},{k:"seadra",l:34}],reward:680},{n:"드래곤테이머 류스케",pokemon:[{k:"dragonair",l:34}],reward:680},{n:"쿨트레이너 시즈카",pokemon:[{k:"dratini",l:32},{k:"dragonair",l:34},{k:"horsea",l:33}],reward:680}],
     leaders:[{id:"clair",n:"이부키",em:"🐉",gen:2,pokemon:[{k:"dragonair",l:37},{k:"dragonair",l:37},{k:"dragonair",l:37},{k:"kingdra",l:40}],reward:4000,rewardItems:["tm59_dragonpulse","masterball"]},
        {id:"clair_hgss",n:"이부키",em:"🐉",gen:4,reqBadges:8,pokemon:[{k:"kingdra",l:56},{k:"dragonite",l:56},{k:"charizard",l:52},{k:"aerodactyl",l:52},{k:"gyarados",l:54}],reward:6000}]}
],
hoenn: [
    {id:"h_gym1",city:"카나즈미시티",n:"카나즈미시티 체육관",type:"rock",badge:"스톤뱃지",badgeEm:"🪨",
     gymTrainers:[{n:"등산가",pokemon:[{k:"geodude",l:10}],reward:200},{n:"등산가",pokemon:[{k:"geodude",l:10},{k:"geodude",l:11}],reward:220}],leaders:[{id:"roxanne",n:"츠츠지",em:"🪨",gen:3,pokemon:[{k:"geodude",l:12},{k:"geodude",l:12},{k:"nosepass",l:15}],reward:1400,rewardItems:["tm39_rockslide"]},{id:"roxanne_oras",n:"츠츠지",em:"🪨",gen:6,reqBadges:8,pokemon:[{k:"aerodactyl",l:50},{k:"golem",l:52},{k:"onix",l:50},{k:"nosepass",l:54},{k:"rhydon",l:56}],reward:5600}]},
    {id:"h_gym2",city:"무로시티",n:"무로시티 체육관",type:"fighting",badge:"너클뱃지",badgeEm:"🥊",
     gymTrainers:[{n:"블랙벨트",pokemon:[{k:"machop",l:14}],reward:280},{n:"블랙벨트",pokemon:[{k:"meditite",l:13},{k:"machop",l:14}],reward:280}],leaders:[{id:"brawly",n:"토키",em:"🥊",gen:3,pokemon:[{k:"machop",l:16},{k:"meditite",l:16},{k:"makuhita",l:19}],reward:1800,rewardItems:["tm31_brickbreak"]},{id:"brawly_oras",n:"토키",em:"🥊",gen:6,reqBadges:8,pokemon:[{k:"hariyama",l:54},{k:"machamp",l:52},{k:"medicham",l:50},{k:"breloom",l:52},{k:"lucario",l:56}],reward:5600}]},
    {id:"h_gym3",city:"키와시티",n:"키와시티 체육관",type:"electric",badge:"다이나모뱃지",badgeEm:"⚡",
     gymTrainers:[{n:"기타리스트",pokemon:[{k:"voltorb",l:17},{k:"electrike",l:17}],reward:340},{n:"기타리스트",pokemon:[{k:"magnemite",l:18},{k:"voltorb",l:18}],reward:360}],leaders:[{id:"wattson",n:"테센",em:"⚡",gen:3,pokemon:[{k:"voltorb",l:20},{k:"electrike",l:20},{k:"magneton",l:22},{k:"manectric",l:24}],reward:2400,rewardItems:["tm24_thunderbolt"]},{id:"wattson_oras",n:"테센",em:"⚡",gen:6,reqBadges:8,pokemon:[{k:"manectric",l:56},{k:"magnezone",l:54},{k:"electrode",l:50},{k:"ampharos",l:52},{k:"luxray",l:52}],reward:5600}]},
    {id:"h_gym4",city:"후엔타운",n:"후엔타운 체육관",type:"fire",badge:"히트뱃지",badgeEm:"🔥",
     gymTrainers:[{n:"캠프파이어소녀",pokemon:[{k:"slugma",l:22},{k:"numel",l:22}],reward:440},{n:"캠프파이어소녀",pokemon:[{k:"numel",l:23}],reward:460}],leaders:[{id:"flannery",n:"아스나",em:"🔥",gen:3,pokemon:[{k:"numel",l:24},{k:"slugma",l:24},{k:"camerupt",l:26},{k:"torkoal",l:29}],reward:2900,rewardItems:["tm35_flamethrower"]},{id:"flannery_oras",n:"아스나",em:"🔥",gen:6,reqBadges:8,pokemon:[{k:"torkoal",l:56},{k:"camerupt",l:54},{k:"magcargo",l:50},{k:"rapidash",l:52},{k:"arcanine",l:52}],reward:5600}]},
    {id:"h_gym5",city:"토우카시티",n:"토우카시티 체육관",type:"normal",badge:"밸런스뱃지",badgeEm:"⚖️",
     gymTrainers:[{n:"배틀걸",pokemon:[{k:"zigzagoon",l:24},{k:"linoone",l:25}],reward:500},{n:"풀숲소년",pokemon:[{k:"spinda",l:25},{k:"vigoroth",l:26}],reward:520},{n:"짧은치마",pokemon:[{k:"linoone",l:26}],reward:520}],leaders:[{id:"norman",n:"센리",em:"⚖️",gen:3,pokemon:[{k:"spinda",l:27},{k:"vigoroth",l:27},{k:"linoone",l:29},{k:"slaking",l:31}],reward:3100,rewardItems:["tm42_facade"]},{id:"norman_oras",n:"센리",em:"⚖️",gen:6,reqBadges:8,pokemon:[{k:"slaking",l:56},{k:"kangaskhan",l:52},{k:"tauros",l:52},{k:"snorlax",l:54},{k:"blissey",l:50}],reward:5600}]},
    {id:"h_gym6",city:"히와마키시티",n:"히와마키시티 체육관",type:"flying",badge:"페더뱃지",badgeEm:"🪶",
     gymTrainers:[{n:"조류연구가",pokemon:[{k:"swablu",l:28},{k:"wingull",l:28}],reward:560},{n:"조류연구가",pokemon:[{k:"tropius",l:29}],reward:580},{n:"조류연구가",pokemon:[{k:"pelipper",l:29},{k:"taillow",l:28}],reward:580}],leaders:[{id:"winona",n:"나기",em:"🪶",gen:3,pokemon:[{k:"swellow",l:31},{k:"pelipper",l:30},{k:"skarmory",l:32},{k:"altaria",l:33}],reward:3300,rewardItems:["tm40_aerialace"]},{id:"winona_oras",n:"나기",em:"🪶",gen:6,reqBadges:8,pokemon:[{k:"altaria",l:56},{k:"skarmory",l:54},{k:"tropius",l:50},{k:"swellow",l:52},{k:"pelipper",l:52}],reward:5600}]},
    {id:"h_gym7",city:"토쿠사네시티",n:"토쿠사네시티 체육관",type:"psychic",badge:"마인드뱃지",badgeEm:"🔮",
     gymTrainers:[{n:"사이킥",pokemon:[{k:"solrock",l:36},{k:"lunatone",l:36}],reward:720},{n:"사이킥",pokemon:[{k:"baltoy",l:37},{k:"claydol",l:38}],reward:760},{n:"사이킥",pokemon:[{k:"xatu",l:38}],reward:760}],leaders:[{id:"tateliza",n:"후우&란",em:"🔮",gen:3,pokemon:[{k:"claydol",l:41},{k:"xatu",l:41},{k:"lunatone",l:42},{k:"solrock",l:42}],reward:4200,rewardItems:["tm29_psychic"]},{id:"tateliza_oras",n:"후우&란",em:"🔮",gen:6,reqBadges:8,pokemon:[{k:"solrock",l:56},{k:"lunatone",l:56},{k:"claydol",l:54},{k:"alakazam",l:52},{k:"gardevoir",l:52}],reward:5800}]},
    {id:"h_gym8",city:"루네시티",n:"루네시티 체육관",type:"water",badge:"레인뱃지",badgeEm:"🌧️",
     gymTrainers:[{n:"수영선수",pokemon:[{k:"sealeo",l:38},{k:"tentacool",l:38}],reward:760},{n:"수영선수",pokemon:[{k:"luvdisc",l:38},{k:"wailmer",l:39}],reward:780},{n:"수영선수",pokemon:[{k:"tentacruel",l:39}],reward:780}],leaders:[
        {id:"wallace",n:"미쿠리",em:"💧",gen:3,pokemon:[{k:"luvdisc",l:40},{k:"whiscash",l:42},{k:"sealeo",l:40},{k:"seaking",l:42},{k:"milotic",l:43}],reward:4300,rewardItems:["tm94_surf","masterball"]},
        {id:"juan",n:"아단",em:"🌊",gen:3,pokemon:[{k:"luvdisc",l:41},{k:"whiscash",l:41},{k:"sealeo",l:43},{k:"crawdaunt",l:43},{k:"kingdra",l:46}],reward:4600},
        {id:"wallace_oras",n:"미쿠리",em:"💧",gen:6,reqBadges:8,pokemon:[{k:"milotic",l:58},{k:"gyarados",l:54},{k:"whiscash",l:52},{k:"ludicolo",l:54},{k:"tentacruel",l:52}],reward:6000}
     ]}
],
sinnoh: [
    {id:"s_gym1",city:"쿠로가네시티",n:"쿠로가네시티 체육관",type:"rock",badge:"콜뱃지",badgeEm:"🪨",
     gymTrainers:[{n:"산악인 다이스케",em:"🧗",pokemon:[{k:"geodude",l:10},{k:"onix",l:10}],reward:300},{n:"등산가 요시히토",em:"🧗",pokemon:[{k:"geodude",l:11},{k:"geodude",l:11}],reward:330}],
     leaders:[
        {id:"roark_dp",n:"효우타",em:"🪨",gen:4,pokemon:[{k:"geodude",l:12},{k:"onix",l:12},{k:"cranidos",l:14}],reward:1400,rewardItems:["tm39_rockslide"]},
        {id:"roark_bdsp",n:"효우타",em:"🪨",gen:8,reqBadges:8,pokemon:[{k:"aerodactyl",l:62},{k:"probopass",l:60},{k:"golem",l:60},{k:"rampardos",l:62},{k:"relicanth",l:60}],reward:6200}
     ]},
    {id:"s_gym2",city:"하쿠타이시티",n:"하쿠타이시티 체육관",type:"grass",badge:"포레스트뱃지",badgeEm:"🌿",
     gymTrainers:[{n:"아로마아가씨 유리",em:"🌿",pokemon:[{k:"budew",l:17},{k:"cherubi",l:17}],reward:510},{n:"풀숲소년 하야토",em:"��",pokemon:[{k:"budew",l:16},{k:"turtwig",l:18}],reward:540}],
     leaders:[
        {id:"gardenia_dp",n:"나타네",em:"🌿",gen:4,pokemon:[{k:"turtwig",l:19},{k:"cherrim",l:19},{k:"roserade",l:22}],reward:2200,rewardItems:["tm86_grassknot"]},
        {id:"gardenia_bdsp",n:"나타네",em:"🌿",gen:8,reqBadges:8,pokemon:[{k:"roserade",l:62},{k:"torterra",l:60},{k:"breloom",l:60},{k:"tangrowth",l:60},{k:"sunflora",l:60}],reward:6200}
     ]},
    {id:"s_gym3",city:"요스가시티",n:"요스가시티 체육관",type:"ghost",badge:"렐릭뱃지",badgeEm:"👻",
     gymTrainers:[{n:"오컬트매니아 쿄코",em:"👻",pokemon:[{k:"gastly",l:20},{k:"haunter",l:22}],reward:660},{n:"사이킥 유메지",em:"👻",pokemon:[{k:"misdreavus",l:22},{k:"drifloon",l:22}],reward:660}],
     leaders:[
        {id:"fantina_dp",n:"멜리사",em:"👻",gen:4,pokemon:[{k:"duskull",l:24},{k:"haunter",l:24},{k:"mismagius",l:26}],reward:2600,rewardItems:["tm65_shadowclaw"]},
        {id:"fantina_bdsp",n:"멜리사",em:"👻",gen:8,reqBadges:8,pokemon:[{k:"mismagius",l:62},{k:"gengar",l:60},{k:"drifblim",l:60},{k:"dusknoir",l:60},{k:"banette",l:60}],reward:6200}
     ]},
    {id:"s_gym4",city:"토바리시티",n:"토바리시티 체육관",type:"fighting",badge:"코볼트뱃지",badgeEm:"��",
     gymTrainers:[{n:"블랙벨트 코이치",em:"🥊",pokemon:[{k:"machoke",l:25},{k:"meditite",l:25}],reward:750},{n:"배틀걸 미사키",em:"🥊",pokemon:[{k:"meditite",l:26},{k:"machop",l:26}],reward:780}],
     leaders:[
        {id:"maylene_dp",n:"스모모",em:"🥊",gen:4,pokemon:[{k:"meditite",l:28},{k:"machoke",l:29},{k:"lucario",l:32}],reward:3200,rewardItems:["tm31_brickbreak"]},
        {id:"maylene_bdsp",n:"스모모",em:"🥊",gen:8,reqBadges:8,pokemon:[{k:"lucario",l:62},{k:"infernape",l:60},{k:"gallade",l:60},{k:"medicham",l:60},{k:"breloom",l:60}],reward:6200}
     ]},
    {id:"s_gym5",city:"노모세시티",n:"노모세시티 체육관",type:"water",badge:"펜뱃지",badgeEm:"💧",
     gymTrainers:[{n:"낚시꾼 유조",em:"💧",pokemon:[{k:"gyarados",l:27},{k:"goldeen",l:27}],reward:810},{n:"수영선수 미치",em:"💧",pokemon:[{k:"quagsire",l:28},{k:"floatzel",l:28}],reward:840}],
     leaders:[
        {id:"crasherwake_dp",n:"맥시",em:"💧",gen:4,pokemon:[{k:"gyarados",l:27},{k:"quagsire",l:27},{k:"floatzel",l:30}],reward:3000,rewardItems:["tm55_scald"]},
        {id:"crasherwake_bdsp",n:"맥시",em:"💧",gen:8,reqBadges:8,pokemon:[{k:"floatzel",l:62},{k:"gyarados",l:60},{k:"quagsire",l:60},{k:"ludicolo",l:60},{k:"poliwrath",l:60}],reward:6200}
     ]},
    {id:"s_gym6",city:"미오시티",n:"미오시티 체육관",type:"steel",badge:"마인뱃지",badgeEm:"⚙️",
     gymTrainers:[{n:"작업원 테츠지",em:"⚙️",pokemon:[{k:"magnemite",l:33},{k:"bronzor",l:33}],reward:990},{n:"작업원 쇼이치",em:"⚙️",pokemon:[{k:"steelix",l:34},{k:"magneton",l:34}],reward:1020}],
     leaders:[
        {id:"byron_dp",n:"토우간",em:"⚙️",gen:4,pokemon:[{k:"magneton",l:36},{k:"steelix",l:36},{k:"bastiodon",l:39}],reward:3900,rewardItems:["tm91_flashcannon"]},
        {id:"byron_bdsp",n:"토우간",em:"⚙️",gen:8,reqBadges:8,pokemon:[{k:"bastiodon",l:62},{k:"steelix",l:60},{k:"magnezone",l:60},{k:"aggron",l:60},{k:"skarmory",l:60}],reward:6200}
     ]},
    {id:"s_gym7",city:"킷사키시티",n:"킷사키시티 체육관",type:"ice",badge:"아이시클뱃지",badgeEm:"❄️",
     gymTrainers:[{n:"스키어 유키코",em:"❄️",pokemon:[{k:"snover",l:36},{k:"sneasel",l:36}],reward:1080},{n:"스키어 코지",em:"❄️",pokemon:[{k:"snover",l:37},{k:"piloswine",l:38}],reward:1140}],
     leaders:[
        {id:"candice_dp",n:"스즈나",em:"❄️",gen:4,pokemon:[{k:"snover",l:38},{k:"sneasel",l:38},{k:"medicham",l:40},{k:"abomasnow",l:42}],reward:4200,rewardItems:["tm13_icebeam"]},
        {id:"candice_bdsp",n:"스즈나",em:"❄️",gen:8,reqBadges:8,pokemon:[{k:"abomasnow",l:62},{k:"froslass",l:60},{k:"mamoswine",l:60},{k:"glaceon",l:60},{k:"weavile",l:60}],reward:6200}
     ]},
    {id:"s_gym8",city:"나기사시티",n:"나기사시티 체육관",type:"electric",badge:"비콘뱃지",badgeEm:"⚡",
     gymTrainers:[{n:"기타리스트 아키히토",em:"⚡",pokemon:[{k:"luxio",l:42},{k:"raichu",l:42}],reward:1260},{n:"연구원 덴지로",em:"⚡",pokemon:[{k:"magneton",l:43},{k:"electabuzz",l:43}],reward:1290}],
     leaders:[
        {id:"volkner_dp",n:"덴지",em:"⚡",gen:4,pokemon:[{k:"raichu",l:46},{k:"ambipom",l:47},{k:"octillery",l:47},{k:"luxray",l:49}],reward:4900,rewardItems:["tm24_thunderbolt","masterball"]},
        {id:"volkner_bdsp",n:"덴지",em:"⚡",gen:8,reqBadges:8,pokemon:[{k:"luxray",l:66},{k:"electivire",l:64},{k:"jolteon",l:64},{k:"raichu",l:64},{k:"lanturn",l:64}],reward:6600}
     ]}
]
,unova: [
    {id:"u_gym1",city:"산요우시티",n:"산요우시티 체육관",type:"normal",badge:"트라이뱃지",badgeEm:"📐",
     gymTrainers:[{n:"웨이터 히로키",em:"🍽️",pokemon:[{k:"lillipup",l:10},{k:"patrat",l:10}],reward:300},{n:"웨이트리스 미카",em:"🍽️",pokemon:[{k:"pansage",l:11},{k:"pansear",l:11}],reward:330}],
     leaders:[
        {id:"cilan_bw",n:"덴트",em:"🌿",gen:5,pokemon:[{k:"lillipup",l:12},{k:"pansage",l:14}],reward:1400,rewardItems:["tm83_workup"]},
        {id:"cheren_bw2",n:"체렌",em:"📘",gen:5,reqBadges:8,pokemon:[{k:"stoutland",l:62},{k:"cinccino",l:60},{k:"watchog",l:60},{k:"bouffalant",l:60},{k:"unfezant",l:60}],reward:6200}
     ]},
    {id:"u_gym2",city:"시포우시티",n:"시포우시티 체육관",type:"normal",badge:"베이직뱃지",badgeEm:"⭐",
     gymTrainers:[{n:"연구원 세이지",em:"📖",pokemon:[{k:"herdier",l:16},{k:"patrat",l:15}],reward:480},{n:"연구원 호시코",em:"📖",pokemon:[{k:"watchog",l:17},{k:"lillipup",l:16}],reward:510}],
     leaders:[
        {id:"lenora_bw",n:"알로에",em:"📖",gen:5,pokemon:[{k:"herdier",l:18},{k:"watchog",l:20}],reward:2000,rewardItems:["tm67_retaliate"]},
        {id:"roxie_bw2",n:"호미카",em:"🎸",gen:5,reqBadges:8,pokemon:[{k:"scolipede",l:62},{k:"garbodor",l:60},{k:"amoonguss",l:60},{k:"toxicroak",l:60},{k:"crobat",l:60}],reward:6200}
     ]},
    {id:"u_gym3",city:"히운시티",n:"히운시티 체육관",type:"bug",badge:"비틀뱃지",badgeEm:"🐛",
     gymTrainers:[{n:"벌레잡이소년 시게루",em:"🐛",pokemon:[{k:"sewaddle",l:19},{k:"venipede",l:19}],reward:570},{n:"벌레잡이소녀 치카",em:"🐛",pokemon:[{k:"dwebble",l:20},{k:"sewaddle",l:20}],reward:600}],
     leaders:[
        {id:"burgh_bw",n:"아티",em:"🎨",gen:5,pokemon:[{k:"whirlipede",l:21},{k:"dwebble",l:21},{k:"leavanny",l:23}],reward:2300,rewardItems:["tm76_strugglebug"]},
        {id:"burgh_bw2",n:"아티",em:"🎨",gen:5,reqBadges:8,pokemon:[{k:"leavanny",l:62},{k:"scolipede",l:60},{k:"crustle",l:60},{k:"escavalier",l:60},{k:"galvantula",l:60}],reward:6200}
     ]},
    {id:"u_gym4",city:"라이몬시티",n:"라이몬시티 체육관",type:"electric",badge:"볼트뱃지",badgeEm:"⚡",
     gymTrainers:[{n:"연예인 하루토",em:"⚡",pokemon:[{k:"blitzle",l:23},{k:"emolga",l:23}],reward:690},{n:"연예인 유나",em:"⚡",pokemon:[{k:"zebstrika",l:24},{k:"emolga",l:24}],reward:720}],
     leaders:[
        {id:"elesa_bw",n:"카밀레",em:"💡",gen:5,pokemon:[{k:"emolga",l:25},{k:"emolga",l:25},{k:"zebstrika",l:27}],reward:2700,rewardItems:["tm72_voltswitch"]},
        {id:"elesa_bw2",n:"카밀레",em:"💡",gen:5,reqBadges:8,pokemon:[{k:"zebstrika",l:62},{k:"emolga",l:60},{k:"galvantula",l:60},{k:"eelektross",l:60},{k:"ampharos",l:60}],reward:6200}
     ]},
    {id:"u_gym5",city:"호도모에시티",n:"호도모에시티 체육관",type:"ground",badge:"퀘이크뱃지",badgeEm:"🌍",
     gymTrainers:[{n:"작업원 무네테츠",em:"⛏️",pokemon:[{k:"sandile",l:27},{k:"drilbur",l:27}],reward:810},{n:"작업원 고헤이",em:"⛏️",pokemon:[{k:"krokorok",l:28},{k:"palpitoad",l:28}],reward:840}],
     leaders:[
        {id:"clay_bw",n:"야콘",em:"⛏️",gen:5,pokemon:[{k:"krokorok",l:29},{k:"palpitoad",l:29},{k:"excadrill",l:31}],reward:3100,rewardItems:["tm78_bulldoze"]},
        {id:"clay_bw2",n:"야콘",em:"⛏️",gen:5,reqBadges:8,pokemon:[{k:"excadrill",l:62},{k:"krookodile",l:60},{k:"seismitoad",l:60},{k:"sandslash",l:60},{k:"golurk",l:60}],reward:6200}
     ]},
    {id:"u_gym6",city:"후키요세시티",n:"후키요세시티 체육관",type:"flying",badge:"제트뱃지",badgeEm:"🌪️",
     gymTrainers:[{n:"파일럿 쇼타",em:"✈️",pokemon:[{k:"swoobat",l:31},{k:"pidove",l:31}],reward:930},{n:"파일럿 미유키",em:"✈️",pokemon:[{k:"tranquill",l:32},{k:"ducklett",l:32}],reward:960}],
     leaders:[
        {id:"skyla_bw",n:"후우로",em:"✈️",gen:5,pokemon:[{k:"swoobat",l:33},{k:"unfezant",l:33},{k:"swanna",l:35}],reward:3500,rewardItems:["tm62_acrobatics"]},
        {id:"skyla_bw2",n:"후우로",em:"✈️",gen:5,reqBadges:8,pokemon:[{k:"swanna",l:62},{k:"unfezant",l:60},{k:"swoobat",l:60},{k:"braviary",l:60},{k:"skarmory",l:60}],reward:6200}
     ]},
    {id:"u_gym7",city:"셋카시티",n:"셋카시티 체육관",type:"ice",badge:"아이시클뱃지",badgeEm:"❄️",
     gymTrainers:[{n:"스키어 히사시",em:"❄️",pokemon:[{k:"vanillite",l:35},{k:"cubchoo",l:35}],reward:1050},{n:"스키어 코유키",em:"❄️",pokemon:[{k:"vanillish",l:36},{k:"cubchoo",l:36}],reward:1080}],
     leaders:[
        {id:"brycen_bw",n:"하치쿠",em:"🥋",gen:5,pokemon:[{k:"vanillish",l:37},{k:"cryogonal",l:37},{k:"beartic",l:39}],reward:3900,rewardItems:["tm79_frostbreath"]},
        {id:"brycen_bw2",n:"하치쿠",em:"🥋",gen:5,reqBadges:8,pokemon:[{k:"beartic",l:62},{k:"vanilluxe",l:60},{k:"cryogonal",l:60},{k:"weavile",l:60},{k:"mamoswine",l:60}],reward:6200}
     ]},
    {id:"u_gym8",city:"소류시티",n:"소류시티 체육관",type:"dragon",badge:"레전드뱃지",badgeEm:"🐉",
     gymTrainers:[{n:"용사 히카루",em:"🐉",pokemon:[{k:"fraxure",l:39},{k:"druddigon",l:39}],reward:1170},{n:"용사 세이야",em:"🐉",pokemon:[{k:"deino",l:40},{k:"fraxure",l:40}],reward:1200}],
     leaders:[
        {id:"drayden_bw",n:"샤가",em:"🐲",gen:5,pokemon:[{k:"druddigon",l:41},{k:"flygon",l:41},{k:"haxorus",l:43}],reward:4300,rewardItems:["tm82_dragontail","masterball"]},
        {id:"drayden_bw2",n:"샤가",em:"🐲",gen:5,reqBadges:8,pokemon:[{k:"haxorus",l:66},{k:"druddigon",l:64},{k:"flygon",l:64},{k:"hydreigon",l:64},{k:"altaria",l:64}],reward:6600}
     ]}
],
kalos: [
    {id:"x_gym1",city:"하쿠단시티",n:"하쿠단시티 체육관",type:"bug",badge:"버그뱃지",badgeEm:"🐛",
     leaders:[{id:"viola",n:"비올라",em:"📷",gen:6,pokemon:[{k:"surskit",l:10},{k:"vivillon",l:12}],reward:1200,rewardItems:["tm83_infestation"]}]},
    {id:"x_gym2",city:"쇼요우시티",n:"쇼요우시티 체육관",type:"rock",badge:"클리프뱃지",badgeEm:"🪨",
     leaders:[{id:"grant",n:"자크로",em:"🧗",gen:6,pokemon:[{k:"amaura",l:25},{k:"tyrunt",l:25}],reward:2500,rewardItems:["tm39_rockslide"]}]},
    {id:"x_gym3",city:"샤라시티",n:"샤라시티 체육관",type:"fighting",badge:"럼블뱃지",badgeEm:"🥊",
     leaders:[{id:"korrina",n:"코르니",em:"⛸️",gen:6,pokemon:[{k:"mienfoo",l:29},{k:"machoke",l:28},{k:"hawlucha",l:32}],reward:3200,rewardItems:["tm98_powerpunch","megaring"]}]},
    {id:"x_gym4",city:"카이나시티",n:"카이나시티 체육관",type:"grass",badge:"플랜트뱃지",badgeEm:"🌱",
     leaders:[{id:"ramos",n:"후쿠지",em:"🌳",gen:6,pokemon:[{k:"jumpluff",l:30},{k:"gogoat",l:34}],reward:3400,rewardItems:["tm86_grassknot"]}]},
    {id:"x_gym5",city:"히요쿠시티",n:"히요쿠시티 체육관",type:"electric",badge:"볼티지뱃지",badgeEm:"⚡",
     leaders:[{id:"clemont",n:"시트론",em:"💡",gen:6,pokemon:[{k:"emolga",l:35},{k:"magneton",l:35},{k:"heliolisk",l:37}],reward:3700,rewardItems:["tm24_thunderbolt"]}]},
    {id:"x_gym6",city:"쿠노에시티",n:"쿠노에시티 체육관",type:"fairy",badge:"페어리뱃지",badgeEm:"🧚",
     leaders:[{id:"valerie",n:"마슈",em:"👘",gen:6,pokemon:[{k:"mawile",l:38},{k:"mrmime",l:38},{k:"sylveon",l:42}],reward:4200,rewardItems:["tm99_dazzlinggleam"]}]},
    {id:"x_gym7",city:"에이세트시티",n:"에이세트시티 체육관",type:"psychic",badge:"사이킥뱃지",badgeEm:"🔮",
     leaders:[{id:"olympia",n:"고지카",em:"🌙",gen:6,pokemon:[{k:"sigilyph",l:44},{k:"slowking",l:44},{k:"meowstic",l:48}],reward:4800,rewardItems:["tm04_calmmind"]}]},
    {id:"x_gym8",city:"에이세트시티",n:"에이세트시티 체육관",type:"ice",badge:"아이스버그뱃지",badgeEm:"🧊",
     leaders:[{id:"wulfric",n:"우르프",em:"🏔️",gen:6,pokemon:[{k:"abomasnow",l:56},{k:"cryogonal",l:55},{k:"avalugg",l:59}],reward:5900,rewardItems:["tm13_icebeam","masterball"]}]}
]

};

// ═══════════════════════════════════════════════
// 🎒 아이템 데이터
// ═══════════════════════════════════════════════
var ITEMS = {
potion:      {n:"상처약",desc:"HP 20 회복",type:"heal",value:20,buy:200,sell:100},
superpotion: {n:"좋은상처약",desc:"HP 60 회복",type:"heal",value:60,buy:700,sell:350},
hyperpotion: {n:"고급상처약",desc:"HP 120 회복",type:"heal",value:120,buy:1500,sell:750},
maxpotion:   {n:"풀회복약",desc:"HP 전부 회복",type:"heal",value:9999,buy:2500,sell:1250},
fullrestore: {n:"회복약",desc:"HP 전부 + 상태이상 회복",type:"fullheal",value:999,buy:3000,sell:1500},
revive:      {n:"기력의조각",desc:"기절 포켓몬 HP 절반 회복",type:"revive",value:0.5,buy:1500,sell:750},
maxrevive:   {n:"기력의덩어리",desc:"기절 포켓몬 HP 전부 회복",type:"revive",value:1.0,buy:99999,sell:2000},
antidote:    {n:"해독제",desc:"독 상태 회복",type:"cure",value:"poison",buy:100,sell:50},
paralyzeheal:{n:"마비치료제",desc:"마비 상태 회복",type:"cure",value:"paralyze",buy:200,sell:100},
awakening:   {n:"잠깨는약",desc:"잠듦 상태 회복",type:"cure",value:"sleep",buy:250,sell:125},
burnheal:    {n:"화상치료제",desc:"화상 상태 회복",type:"cure",value:"burn",buy:250,sell:125},
iceheal:     {n:"얼음치료제",desc:"얼음 상태 회복",type:"cure",value:"freeze",buy:250,sell:125},
fullheal:    {n:"만병통치약",desc:"모든 상태이상 회복",type:"cure",value:"all",buy:600,sell:300},
escaperope:  {n:"동굴탈출로프",desc:"동굴에서 즉시 탈출",type:"misc",value:0,buy:550,sell:275},
pokeball:    {n:"몬스터볼",desc:"야생 포켓몬 포획 (1x)",type:"ball",value:1,buy:200,sell:100},
superball:   {n:"슈퍼볼",desc:"야생 포켓몬 포획 (1.5x)",type:"ball",value:1.5,buy:600,sell:300},
ultraball:   {n:"하이퍼볼",desc:"야생 포켓몬 포획 (2x)",type:"ball",value:2,buy:1200,sell:600},
masterball:  {n:"마스터볼",desc:"100% 포획",type:"ball",value:255,buy:99999,sell:1},
xattack:     {n:"플러스파워",desc:"배틀 중 공격 1단계 상승",type:"battle",value:"atk",buy:500,sell:250},
xdefense:    {n:"디펜드업",desc:"배틀 중 방어 1단계 상승",type:"battle",value:"def",buy:550,sell:275},
xspeed:      {n:"스피더",desc:"배틀 중 스피드 1단계 상승",type:"battle",value:"spd",buy:350,sell:175},
xspatk:      {n:"스페셜업",desc:"배틀 중 특수공격 1단계 상승",type:"battle",value:"spatk",buy:350,sell:175},
xspdef:      {n:"스페셜가드",desc:"배틀 중 특수방어 1단계 상승",type:"battle",value:"spdef",buy:350,sell:175},
xaccuracy:   {n:"잘맞히기",desc:"배틀 중 명중률 1단계 상승",type:"battle",value:"acc",buy:950,sell:475},
direhit:     {n:"크리티컬커터",desc:"배틀 중 급소율 상승",type:"battle",value:"crit",buy:650,sell:325},
guardspec:   {n:"에펙트가드",desc:"5턴간 능력저하 방지",type:"battle",value:"guard",buy:700,sell:350},
netball:     {n:"네트볼",desc:"물/벌레 타입 포획률 UP (3x)",type:"ball",value:3,buy:1000,sell:500},
diveball:    {n:"다이브볼",desc:"수중 포켓몬 포획률 UP (3.5x)",type:"ball",value:3.5,buy:1000,sell:500},
nestball:    {n:"네스트볼",desc:"약한 포켓몬일수록 잘 잡힘",type:"ball",value:1,buy:1000,sell:500},
repeatball:  {n:"리피트볼",desc:"이미 잡은 종류 포획률 UP (3.5x)",type:"ball",value:3.5,buy:1000,sell:500},
timerball:   {n:"타이머볼",desc:"턴이 길어질수록 포획률 UP",type:"ball",value:1,buy:1000,sell:500},
luxuryball:  {n:"럭셔리볼",desc:"친밀도 상승 보너스",type:"ball",value:1,buy:1000,sell:500},
premierball: {n:"프리미어볼",desc:"기념용 특수 볼 (1x)",type:"ball",value:1,buy:200,sell:100},
duskball:    {n:"다크볼",desc:"밤/동굴에서 포획률 UP (3.5x)",type:"ball",value:3.5,buy:1000,sell:500},
quickball:   {n:"퀵볼",desc:"첫 턴 포획률 UP (5x)",type:"ball",value:5,buy:1000,sell:500},
healball:    {n:"힐볼",desc:"포획 시 HP/상태이상 회복",type:"ball",value:1,buy:300,sell:150},
rarecandy:   {n:"이상한사탕",desc:"포켓몬 레벨 1 상승",type:"etc",value:1,buy:9999,sell:2400},
ppup:        {n:"포인트업",desc:"기술 PP 최대치 상승",type:"etc",value:1,buy:9999,sell:4900},
calcium:     {n:"리소신",desc:"특수공격 노력치 +10",type:"etc",value:1,buy:9800,sell:4900},
protein:     {n:"타우린",desc:"공격 노력치 +10",type:"etc",value:1,buy:9800,sell:4900},
iron:        {n:"브로민",desc:"방어 노력치 +10",type:"etc",value:1,buy:9800,sell:4900},
carbos:      {n:"인돌",desc:"스피드 노력치 +10",type:"etc",value:1,buy:9800,sell:4900},
zinc:        {n:"키토산",desc:"특수방어 노력치 +10",type:"etc",value:1,buy:9800,sell:4900},
hpup:        {n:"맥스업",desc:"HP 노력치 +10",type:"etc",value:1,buy:9800,sell:4900},
// ── 열매 (Berries) ──
cheriberry:   {n:"체리열매",desc:"지닌 포켓몬 마비 시 자동 회복",type:"berry",berryType:"cure",value:"paralyze",buy:80,sell:40},
chestoberry:  {n:"체스열매",desc:"지닌 포켓몬 잠듦 시 자동 회복",type:"berry",berryType:"cure",value:"sleep",buy:80,sell:40},
pechaberry:   {n:"복숭열매",desc:"지닌 포켓몬 독 시 자동 회복",type:"berry",berryType:"cure",value:"poison",buy:80,sell:40},
rawstberry:   {n:"키열매",desc:"지닌 포켓몬 화상 시 자동 회복",type:"berry",berryType:"cure",value:"burn",buy:80,sell:40},
aspearberry:  {n:"복분열매",desc:"지닌 포켓몬 얼음 시 자동 회복",type:"berry",berryType:"cure",value:"freeze",buy:80,sell:40},
persimberry:  {n:"감열매",desc:"지닌 포켓몬 혼란 시 자동 회복",type:"berry",berryType:"cure",value:"confuse",buy:120,sell:60},
oranberry:    {n:"오랭열매",desc:"HP 50% 이하 시 HP 10 회복",type:"berry",berryType:"hp",value:10,buy:100,sell:50},
sitrusberry:  {n:"자뭉열매",desc:"HP 50% 이하 시 최대HP 25% 회복",type:"berry",berryType:"hppct",value:25,buy:500,sell:250},
lumberry:     {n:"리쥬열매",desc:"지닌 포켓몬 모든 상태이상 자동 회복",type:"berry",berryType:"cure_all",value:0,buy:800,sell:400},
liechiberry:  {n:"치리열매",desc:"HP 25% 이하 시 공격 1단계 상승",type:"berry",berryType:"pinch",value:"atk",buy:2000,sell:1000},
ganlonberry:  {n:"용아열매",desc:"HP 25% 이하 시 방어 1단계 상승",type:"berry",berryType:"pinch",value:"def",buy:2000,sell:1000},
salacberry:   {n:"캄라열매",desc:"HP 25% 이하 시 스피드 1단계 상승",type:"berry",berryType:"pinch",value:"spd",buy:2000,sell:1000},
petayaberry:  {n:"야타비열매",desc:"HP 25% 이하 시 특공 1단계 상승",type:"berry",berryType:"pinch",value:"spatk",buy:2000,sell:1000},
apicotberry:  {n:"슈캄열매",desc:"HP 25% 이하 시 특방 1단계 상승",type:"berry",berryType:"pinch",value:"spdef",buy:2000,sell:1000},
leppaberry:   {n:"래프열매",desc:"PP가 0이 된 기술의 PP 10 회복",type:"berry",berryType:"pp",value:10,buy:300,sell:150},
// ── 키 아이템 (Key Items) ──
expshare:    {n:"학습장치",desc:"전투 후 경험치를 팀 전체가 나눠 받는다",type:"key",value:"expshare",buy:0,sell:0},
luckyegg:    {n:"행운의알",desc:"보유 포켓몬의 경험치 1.5배",type:"key",value:"luckyegg",buy:0,sell:0},
amuletcoin:  {n:"부적금화",desc:"트레이너전 상금 2배",type:"key",value:"amuletcoin",buy:0,sell:0},
soothebell:  {n:"평온의방울",desc:"포켓몬의 친밀도가 더 빨리 오른다",type:"key",value:"soothebell",buy:0,sell:0},
cleansetag:  {n:"클린스태그",desc:"야생 포켓몬 조우율 감소",type:"key",value:"cleansetag",buy:0,sell:0},
megaring:    {n:"메가링",desc:"메가진화를 사용할 수 있게 해주는 팔찌",type:"key",value:"megaring",buy:0,sell:0},
diveset:     {n:"다이빙세트",desc:"수중 탐사가 가능해진다. 깊은 바다 도로에 접근 가능",type:"key",value:"diveset",buy:0,sell:0},
gogoogoggles:{n:"사막고글",desc:"모래바람 속에서도 시야를 확보한다. 사막 지대 접근 가능",type:"key",value:"gogoogoggles",buy:0,sell:0},
devonscope:  {n:"디본스코프",desc:"투명한 포켓몬의 모습을 비춘다",type:"key",value:"devonscope",buy:0,sell:0},
squirtbottle:{n:"물뿌리개",desc:"수도배지와 함께 사용하여 너도밤나무에 물을 줄 수 있다",type:"key",value:"squirtbottle",buy:0,sell:0},
secretpotion:{n:"비약",desc:"아사기 등대의 전룡에게 줄 약",type:"key",value:"secretpotion",buy:0,sell:0},
oldrod:      {n:"낡은낚시대",desc:"낡은 낚시대. 잉어킹만 낚을 수 있다",type:"key",value:"oldrod",buy:0,sell:0},
goodrod:     {n:"좋은낚시대",desc:"좋은 낚시대. 다양한 물 포켓몬을 낚을 수 있다",type:"key",value:"goodrod",buy:0,sell:0},
superrod:    {n:"대단한낚시대",desc:"최고급 낚시대. 희귀한 물 포켓몬을 낚을 수 있다",type:"key",value:"superrod",buy:0,sell:0},
// ── 기술머신 (TM) ──
tm01_focuspunch: {n:"기술머신01 [기합펀치]",desc:"기합펀치를 가르친다",type:"tm",value:"focuspunch",buy:3000,sell:1500},
tm02_dragonclaw: {n:"기술머신02 [용의발톱]",desc:"용의발톱을 가르친다",type:"tm",value:"dragonclaw",buy:3000,sell:1500},
tm06_toxic:      {n:"기술머신06 [맹독]",desc:"맹독을 가르친다",type:"tm",value:"toxic",buy:3000,sell:1500},
tm10_hiddenpower:{n:"기술머신10 [잠재파워]",desc:"잠재파워를 가르친다",type:"tm",value:"hiddenpower",buy:3000,sell:1500},
tm13_icebeam:    {n:"기술머신13 [냉동빔]",desc:"냉동빔을 가르친다",type:"tm",value:"icebeam",buy:5500,sell:2750},
tm15_hyperbeam:  {n:"기술머신15 [파괴광선]",desc:"파괴광선을 가르친다",type:"tm",value:"hyperbeam",buy:7500,sell:3750},
tm24_thunderbolt:{n:"기술머신24 [10만볼트]",desc:"10만볼트를 가르친다",type:"tm",value:"thunderbolt",buy:5500,sell:2750},
tm25_thunder:    {n:"기술머신25 [번개]",desc:"번개를 가르친다",type:"tm",value:"thunder",buy:5500,sell:2750},
tm26_earthquake: {n:"기술머신26 [지진]",desc:"지진을 가르친다",type:"tm",value:"earthquake",buy:5500,sell:2750},
tm29_psychic:    {n:"기술머신29 [사이코키네시스]",desc:"사이코키네시스를 가르친다",type:"tm",value:"psychic",buy:5500,sell:2750},
tm30_shadowball: {n:"기술머신30 [섀도볼]",desc:"섀도볼을 가르친다",type:"tm",value:"shadowball",buy:5500,sell:2750},
tm31_brickbreak: {n:"기술머신31 [깨트리기]",desc:"깨트리기를 가르친다",type:"tm",value:"brickbreak",buy:3000,sell:1500},
tm35_flamethrower:{n:"기술머신35 [화염방사]",desc:"화염방사를 가르친다",type:"tm",value:"flamethrower",buy:5500,sell:2750},
tm36_sludgebomb: {n:"기술머신36 [오물폭탄]",desc:"오물폭탄을 가르친다",type:"tm",value:"sludgebomb",buy:3000,sell:1500},
tm38_fireblast:  {n:"기술머신38 [대문자]",desc:"대문자를 가르친다",type:"tm",value:"fireblast",buy:5500,sell:2750},
tm39_rockslide:  {n:"기술머신39 [암석봉인]",desc:"암석봉인을 가르친다",type:"tm",value:"rockslide",buy:3000,sell:1500},
tm40_aerialace:  {n:"기술머신40 [제비반환]",desc:"제비반환을 가르친다",type:"tm",value:"aerialace",buy:3000,sell:1500},
tm42_facade:     {n:"기술머신42 [근성]",desc:"근성을 가르친다",type:"tm",value:"facade",buy:3000,sell:1500},
tm46_thief:      {n:"기술머신46 [도둑질]",desc:"도둑질을 가르친다",type:"tm",value:"thief",buy:3000,sell:1500},
tm47_steelwing:  {n:"기술머신47 [강철날개]",desc:"강철날개를 가르친다",type:"tm",value:"steelwing",buy:3000,sell:1500},
tm53_energyball: {n:"기술머신53 [에너지볼]",desc:"에너지볼을 가르친다",type:"tm",value:"energyball",buy:3000,sell:1500},
tm55_scald:      {n:"기술머신55 [열탕]",desc:"열탕을 가르친다",type:"tm",value:"scald",buy:3000,sell:1500},
tm59_dragonpulse:{n:"기술머신59 [용의파동]",desc:"용의파동을 가르친다",type:"tm",value:"dragonpulse",buy:5500,sell:2750},
tm61_willowisp:  {n:"기술머신61 [도깨비불]",desc:"도깨비불을 가르친다",type:"tm",value:"willowisp",buy:3000,sell:1500},
tm65_shadowclaw: {n:"기술머신65 [섀도크루]",desc:"섀도크루를 가르친다",type:"tm",value:"shadowclaw",buy:3000,sell:1500},
tm71_stoneedge:  {n:"기술머신71 [스톤에지]",desc:"스톤에지를 가르친다",type:"tm",value:"stoneedge",buy:5500,sell:2750},
tm73_thunderwave:{n:"기술머신73 [전기자석파]",desc:"전기자석파를 가르친다",type:"tm",value:"thunderwave",buy:3000,sell:1500},
tm75_swordsdance:{n:"기술머신75 [칼춤]",desc:"칼춤을 가르친다",type:"tm",value:"swordsdance",buy:3000,sell:1500},
tm80_rockblast: {n:"기술머신80 [록블래스트]",desc:"록블래스트를 가르친다",type:"tm",value:"rockblast",buy:3000,sell:1500},
tm81_xscissor:   {n:"기술머신81 [시저크로스]",desc:"시저크로스를 가르친다",type:"tm",value:"xscissor",buy:3000,sell:1500},
tm84_poisonjab:  {n:"기술머신84 [독찌르기]",desc:"독찌르기를 가르친다",type:"tm",value:"poisonjab",buy:3000,sell:1500},
tm86_grassknot:  {n:"기술머신86 [풀묶기]",desc:"풀묶기를 가르친다",type:"tm",value:"grassknot",buy:3000,sell:1500},
tm89_uturn:      {n:"기술머신89 [유턴]",desc:"유턴을 가르친다",type:"tm",value:"uturn",buy:3000,sell:1500},
tm91_flashcannon:{n:"기술머신91 [러스터캐논]",desc:"러스터캐논을 가르친다",type:"tm",value:"flashcannon",buy:5500,sell:2750},
tm94_surf:       {n:"기술머신94 [파도타기]",desc:"파도타기를 가르친다",type:"tm",value:"surf",buy:5500,sell:2750},
tm95_darkpulse:  {n:"기술머신95 [악의파동]",desc:"악의파동을 가르친다",type:"tm",value:"darkpulse",buy:5500,sell:2750},
// ═══ Gen 5-6 체육관 보상 TM ═══
tm04_calmmind:   {n:"기술머신04 [명상]",desc:"명상을 가르친다",type:"tm",value:"calmmind",buy:3000,sell:1500},
tm62_acrobatics: {n:"기술머신62 [곡예]",desc:"곡예를 가르친다",type:"tm",value:"acrobatics",buy:3000,sell:1500},
tm67_retaliate:  {n:"기술머신67 [보복]",desc:"보복을 가르친다",type:"tm",value:"retaliate",buy:3000,sell:1500},
tm72_voltswitch: {n:"기술머신72 [볼트체인지]",desc:"볼트체인지를 가르친다",type:"tm",value:"voltswitch",buy:5500,sell:2750},
tm76_strugglebug:{n:"기술머신76 [버그저항]",desc:"버그저항을 가르친다",type:"tm",value:"strugglebug",buy:3000,sell:1500},
tm78_bulldoze:   {n:"기술머신78 [지진밟기]",desc:"지진밟기를 가르친다",type:"tm",value:"bulldoze",buy:5500,sell:2750},
tm79_frostbreath:{n:"기술머신79 [프로스트브레스]",desc:"프로스트브레스를 가르친다",type:"tm",value:"frostbreath",buy:3000,sell:1500},
tm82_dragontail: {n:"기술머신82 [드래곤테일]",desc:"드래곤테일을 가르친다",type:"tm",value:"dragontail",buy:5500,sell:2750},
tm83_workup:     {n:"기술머신83 [자기암시]",desc:"자기암시를 가르친다",type:"tm",value:"workup",buy:3000,sell:1500},
tm83_infestation:{n:"기술머신83b [침식]",desc:"침식을 가르친다",type:"tm",value:"infestation",buy:3000,sell:1500},
tm98_powerpunch: {n:"기술머신98 [파워업펀치]",desc:"파워업펀치를 가르친다",type:"tm",value:"powerpunch",buy:5500,sell:2750},
tm99_dazzlinggleam:{n:"기술머신99 [매지컬샤인]",desc:"매지컬샤인을 가르친다",type:"tm",value:"dazzlinggleam",buy:5500,sell:2750}
};

// TM 호환성 데이터 (타입 기반)
var TM_COMPAT = {
    tm01_focuspunch: ["fighting","normal","rock","steel","ground","dark"],
    tm02_dragonclaw: ["dragon","flying"],
    tm06_toxic: null,
    tm10_hiddenpower: null,
    tm13_icebeam: ["water","ice","dragon","normal","psychic","ghost"],
    tm15_hyperbeam: ["normal","dragon","fire","water","electric","psychic","dark","steel","ice","ghost","flying","ground","rock","fighting","poison","bug","grass","fairy"],
    tm24_thunderbolt: ["electric","normal","steel","psychic"],
    tm25_thunder: ["electric","normal","dragon","steel"],
    tm26_earthquake: ["ground","rock","normal","fighting","steel","poison","fire","dragon"],
    tm29_psychic: ["psychic","normal","fairy","ghost","poison"],
    tm30_shadowball: ["ghost","dark","psychic","normal","poison","fairy"],
    tm31_brickbreak: ["fighting","normal","rock","steel","ground","dark","fire"],
    tm35_flamethrower: ["fire","normal","dragon","steel","flying"],
    tm36_sludgebomb: ["poison","grass","ground","dark","ghost"],
    tm38_fireblast: ["fire","normal","dragon","steel"],
    tm39_rockslide: ["rock","ground","normal","fighting","steel"],
    tm40_aerialace: ["flying","normal","bug","fighting","steel","dark"],
    tm42_facade: null,
    tm46_thief: ["dark","normal","ghost","poison","bug","psychic","fairy"],
    tm47_steelwing: ["steel","flying","normal","dragon","rock"],
    tm53_energyball: ["grass","poison","normal","psychic","bug","fairy","water"],
    tm55_scald: ["water","fire","normal","ice","dragon"],
    tm59_dragonpulse: ["dragon","water","normal","fire","flying","psychic","ghost"],
    tm61_willowisp: ["fire","ghost","dark","psychic"],
    tm65_shadowclaw: ["ghost","dark","normal","fighting","steel","ground","poison"],
    tm71_stoneedge: ["rock","ground","normal","fighting","steel"],
    tm73_thunderwave: ["electric","normal","steel","psychic","ghost","fairy"],
    tm75_swordsdance: ["normal","bug","steel","fighting","dark","flying","ground","rock","grass","poison","fairy"],
    tm80_rockblast: ["rock","ground","normal","fighting","steel"],
    tm81_xscissor: ["bug","normal","fighting","steel","dark","grass","flying"],
    tm84_poisonjab: ["poison","fighting","normal","bug","ground","dark","grass"],
    tm86_grassknot: ["grass","normal","psychic","electric","water","fairy","poison"],
    tm89_uturn: ["bug","flying","normal","electric","dark","psychic","fighting"],
    tm91_flashcannon: ["steel","normal","electric","psychic","fairy","water","rock"],
    tm94_surf: ["water","normal","ice","dragon","ground"],
    tm95_darkpulse: ["dark","ghost","psychic","poison","fighting","normal"],
    tm04_calmmind: ["psychic","normal","fairy","ghost","dark","water","fire","fighting"],
    tm62_acrobatics: ["flying","bug","normal","fighting","dark"],
    tm67_retaliate: ["normal","dark","fighting","ghost","steel"],
    tm72_voltswitch: ["electric","normal","steel","bug","flying"],
    tm76_strugglebug: ["bug","grass","poison","normal","psychic","fairy"],
    tm78_bulldoze: ["ground","rock","normal","fighting","steel","fire"],
    tm79_frostbreath: ["ice","water","normal","dragon","psychic","ghost","flying"],
    tm82_dragontail: ["dragon","normal","water","fire","steel","flying"],
    tm83_workup: null,
    tm83_infestation: ["bug","grass","poison","dark","ghost","psychic"],
    tm98_powerpunch: ["fighting","normal","rock","steel","ground","dark","fire"],
    tm99_dazzlinggleam: ["fairy","normal","psychic","ghost","electric","fire","ice","water"]
};

function canLearnTM(poke, tmKey) {
    var compat = TM_COMPAT[tmKey];
    if (compat === null || compat === undefined) return true;
    var pd = POKEDEX[poke.key];
    if (!pd) return false;
    for (var i = 0; i < pd.t.length; i++) {
        if (compat.indexOf(pd.t[i]) !== -1) return true;
    }
    return false;
}

// ═══════════════════════════════════════════════
// ⭐ 특성 데이터
// ═══════════════════════════════════════════════
var ABILITIES = {
overgrow:{n:"심록",desc:"HP가 1/3 이하일 때 풀 기술 위력 1.5배",type:"pinch",boostType:"grass"},
blaze:{n:"맹화",desc:"HP가 1/3 이하일 때 불 기술 위력 1.5배",type:"pinch",boostType:"fire"},
torrent:{n:"급류",desc:"HP가 1/3 이하일 때 물 기술 위력 1.5배",type:"pinch",boostType:"water"},
swarm:{n:"벌레의알림",desc:"HP가 1/3 이하일 때 벌레 기술 위력 1.5배",type:"pinch",boostType:"bug"},
intimidate:{n:"위협",desc:"등장 시 상대 공격 1단계 하락",type:"entry_atkdown"},
levitate:{n:"부유",desc:"땅 타입 기술에 면역",type:"typeimmune",immuneType:"ground"},
waterabsorb:{n:"저수",desc:"물 기술을 받으면 HP 1/4 회복",type:"typeabsorb",immuneType:"water"},
voltabsorb:{n:"축전",desc:"전기 기술을 받으면 HP 1/4 회복",type:"typeabsorb",immuneType:"electric"},
flashfire:{n:"타오르는불꽃",desc:"불 기술을 받으면 불 기술 위력 1.5배",type:"flashfire",immuneType:"fire"},
lightningrod:{n:"피뢰침",desc:"전기 기술 무효, 특공 1단계 상승",type:"typeabsorb_stat",immuneType:"electric",stat:"spatk"},
motordrive:{n:"전기엔진",desc:"전기 기술 무효, 스피드 1단계 상승",type:"typeabsorb_stat",immuneType:"electric",stat:"spd"},
sapsipper:{n:"초식",desc:"풀 기술 무효, 공격 1단계 상승",type:"typeabsorb_stat",immuneType:"grass",stat:"atk"},
thickfat:{n:"두꺼운지방",desc:"불/얼음 기술 데미지 반감",type:"thickfat"},
hugpower:{n:"천하장사",desc:"물리 공격력 2배",type:"atkx2"},
purepower:{n:"순수한힘",desc:"물리 공격력 2배",type:"atkx2"},
technician:{n:"테크니션",desc:"위력 60 이하 기술 1.5배",type:"technician"},
adaptability:{n:"적응력",desc:"자속보정 1.5배→2배",type:"adaptability"},
speedboost:{n:"가속",desc:"매 턴 종료 시 스피드 1단계 상승",type:"speedboost"},
sturdy:{n:"옹골찬",desc:"HP만땅 시 일격에 쓰러지지 않음",type:"sturdy"},
multiscale:{n:"멀티스케일",desc:"HP만땅 시 받는 데미지 반감",type:"multiscale"},
guts:{n:"근성",desc:"상태이상 시 물리 공격력 1.5배",type:"guts"},
marvelscale:{n:"이상한비늘",desc:"상태이상 시 방어력 1.5배",type:"marvelscale"},
naturalcure:{n:"자연회복",desc:"교체 시 상태이상 회복",type:"naturalcure"},
moxie:{n:"자신감",desc:"상대를 쓰러뜨리면 공격 1단계 상승",type:"moxie"},
staticbody:{n:"정전기",desc:"접촉 기술에 30% 마비",type:"contact_status",status:"paralyze",chance:30},
poisonpoint:{n:"독가시",desc:"접촉 기술에 30% 독",type:"contact_status",status:"poison",chance:30},
flamebody:{n:"불꽃몸",desc:"접촉 기술에 30% 화상",type:"contact_status",status:"burn",chance:30},
roughskin:{n:"까칠한피부",desc:"접촉 기술에 1/8 반사 데미지",type:"roughskin"},
ironbarbs:{n:"철가시",desc:"접촉 기술에 1/8 반사 데미지",type:"roughskin"},
clearbody:{n:"클리어바디",desc:"능력치 하락 방지",type:"prevent_statdown"},
whitesmoke:{n:"하얀연기",desc:"능력치 하락 방지",type:"prevent_statdown"},
pressure:{n:"프레셔",desc:"상대 기술 PP 소모 2배",type:"pressure"},
moldbreaker:{n:"틀깨기",desc:"상대 특성 무시",type:"moldbreaker"},
immunity:{n:"면역",desc:"독 상태에 걸리지 않음",type:"statusimmune",immune:"poison"},
limber:{n:"유연",desc:"마비 상태에 걸리지 않음",type:"statusimmune",immune:"paralyze"},
insomnia:{n:"불면",desc:"잠듦 상태에 걸리지 않음",type:"statusimmune",immune:"sleep"},
vitalspirit:{n:"의기양양",desc:"잠듦 상태에 걸리지 않음",type:"statusimmune",immune:"sleep"},
waterveil:{n:"수의베일",desc:"화상 상태에 걸리지 않음",type:"statusimmune",immune:"burn"},
magmaarmor:{n:"마그마의갑옷",desc:"얼음 상태에 걸리지 않음",type:"statusimmune",immune:"freeze"},
shellarmor:{n:"전투무장",desc:"급소에 맞지 않음",type:"nocrit"},
battlearmor:{n:"전투갑옷",desc:"급소에 맞지 않음",type:"nocrit"},
wonderguard:{n:"불가사의부적",desc:"효과 좋은 기술만 명중",type:"wonderguard"},
drizzle:{n:"잔비",desc:"등장 시 비",type:"none"},
drought:{n:"가뭄",desc:"등장 시 쾌청",type:"none"},
sandstream:{n:"모래날림",desc:"등장 시 모래바람",type:"none"},
snowwarning:{n:"눈퍼뜨리기",desc:"등장 시 싸라기눈",type:"none"},
compoundeyes:{n:"복안",desc:"기술 명중률 1.3배",type:"accboost"},
noguard:{n:"노가드",desc:"서로의 기술이 반드시 명중",type:"noguard"},
superluck:{n:"대운",desc:"급소율 상승",type:"superluck"},
sniper:{n:"스나이퍼",desc:"급소 시 2.25배",type:"sniper"},
rockhead:{n:"돌머리",desc:"반동 데미지 없음",type:"norecoil"},
shedskin:{n:"탈피",desc:"매 턴 1/3 확률 상태이상 회복",type:"shedskin"},
regenerator:{n:"재생력",desc:"교체 시 HP 1/3 회복",type:"regenerator"},
filter:{n:"필터",desc:"효과 좋은 기술 데미지 3/4",type:"filter"},
solidrock:{n:"하드록",desc:"효과 좋은 기술 데미지 3/4",type:"filter"},
unaware:{n:"천진",desc:"상대 능력변화 무시",type:"unaware"},
magicguard:{n:"매직가드",desc:"기술 이외의 데미지 없음",type:"magicguard"},
pickup:{n:"픽업",desc:"전투 후 아이템 획득 확률",type:"pickup"},
keeneye:{n:"날카로운눈",desc:"명중률 하락 방지",type:"prevent_accdown"},
runaway:{n:"도주",desc:"야생전에서 반드시 도주 가능",type:"runaway"},
synchronize:{n:"싱크로",desc:"상태이상을 상대에게도 전달",type:"synchronize"},
innerfocus:{n:"정신력",desc:"풀죽지 않음",type:"noflinch"},
scrappy:{n:"배짱",desc:"노말/격투 기술이 고스트에 적중",type:"scrappy"},
defiant:{n:"오기",desc:"능력 하락 시 공격 2단계 상승",type:"defiant"},
competitive:{n:"승부근성",desc:"능력 하락 시 특공 2단계 상승",type:"competitive"},
toughclaws:{n:"단단한손톱",desc:"접촉 기술 1.3배",type:"toughclaws"},
parentalbond:{n:"부자유친",desc:"기술을 2번 발동 (2번째 위력 25%)",type:"none"},
pixilate:{n:"페어리스킨",desc:"노말 기술이 페어리 타입+1.2배",type:"skin",skinType:"fairy"},
aerilate:{n:"스카이스킨",desc:"노말 기술이 비행 타입+1.2배",type:"skin",skinType:"flying"},
refrigerate:{n:"프리즈스킨",desc:"노말 기술이 얼음 타입+1.2배",type:"skin",skinType:"ice"},
strongjaw:{n:"단단한턱",desc:"물기 기술 1.5배",type:"strongjaw"},
ironfist:{n:"철주먹",desc:"펀치 기술 1.2배",type:"ironfist"},
megalauncher:{n:"메가런처",desc:"파동 기술 1.5배",type:"megalauncher"},
serenegrace:{n:"천의은총",desc:"추가효과 확률 2배",type:"serenegrace"},
poisontouch:{n:"독수",desc:"접촉 기술에 30% 독",type:"contact_status",status:"poison",chance:30},
effectspore:{n:"포자",desc:"접촉 시 11% 독/마비/잠듦",type:"contact_status",status:"poison",chance:11},
cutecharm:{n:"헤롱헤롱바디",desc:"접촉 시 30% 헤롱헤롱",type:"cutecharm"},
chlorophyll:{n:"엽록소",desc:"쾌청 시 스피드 2배",type:"weather_speed",weather:"sun"},
swiftswim:{n:"쓱쓱",desc:"비 올 때 스피드 2배",type:"weather_speed",weather:"rain"},
sandrush:{n:"모래헤치기",desc:"모래바람 시 스피드 2배",type:"weather_speed",weather:"sand"},
slushrush:{n:"눈치우기",desc:"싸라기눈 시 스피드 2배",type:"weather_speed",weather:"hail"},
sandveil:{n:"모래숨기",desc:"모래바람 시 회피율 상승",type:"weather_evasion",weather:"sand"},
snowcloak:{n:"눈숨기",desc:"싸라기눈 시 회피율 상승",type:"weather_evasion",weather:"hail"},
oblivious:{n:"둔감",desc:"헤롱헤롱에 걸리지 않음",type:"none"},
owntempo:{n:"마이페이스",desc:"혼란에 걸리지 않음",type:"owntempo"},
earlybird:{n:"일찍기상",desc:"잠듦에서 빨리 깬다",type:"earlybird"},
colorchange:{n:"변색",desc:"맞은 기술 타입으로 변한다",type:"none"},
trace:{n:"트레이스",desc:"상대 특성을 복사",type:"none"},
shadowtag:{n:"그림자밟기",desc:"상대가 도주 불가",type:"notrap"},
arenatrap:{n:"개미지옥",desc:"상대가 도주 불가",type:"notrap"},
stench:{n:"악취",desc:"접촉 시 10% 풀죽음",type:"stench"},
dryskin:{n:"건조피부",desc:"물 기술로 회복, 불에 약함",type:"dryskin"},
rivalry:{n:"투쟁심",desc:"동성 상대에게 1.25배",type:"none"},
reckless:{n:"무모한",desc:"반동기 위력 1.2배",type:"reckless"},
sheerforce:{n:"우격다짐",desc:"추가효과 제거 대신 1.3배",type:"sheerforce"},
contrary:{n:"심술꾸러기",desc:"능력변화가 반대로 적용",type:"contrary"},
prankster:{n:"짓궂은마음",desc:"변화기술 우선도+1",type:"prankster"},
justified:{n:"정의의마음",desc:"악 기술에 공격 1단계 상승",type:"justified"},
overcoat:{n:"방진",desc:"날씨 데미지/가루 기술 무효",type:"overcoat"},
cursedbody:{n:"저주받은바디",desc:"접촉 시 30% 기술봉인",type:"cursedbody"},
aromaveil:{n:"아로마베일",desc:"정신 기술에 면역",type:"none"},
furcoat:{n:"퍼코트",desc:"물리 데미지 반감",type:"furcoat"},
protean:{n:"변환자재",desc:"기술 타입으로 자신의 타입이 변한다",type:"protean"},
galewings:{n:"질풍날개",desc:"HP만땅 시 비행 기술 우선도+1",type:"galewings"},
bulletproof:{n:"방탄",desc:"구/탄 기술에 면역",type:"bulletproof"},
darkaura:{n:"다크오라",desc:"모든 악 기술 위력 4/3배",type:"aura",auraType:"dark"},
fairyaura:{n:"페어리오라",desc:"모든 페어리 기술 위력 4/3배",type:"aura",auraType:"fairy"},
sandforce:{n:"모래의힘",desc:"모래바람 시 바위/땅/강철 기술 1.3배",type:"sandforce"},
noflinch:{n:"정신력",desc:"풀죽지 않음",type:"noflinch"},
gluttony:{n:"먹보",desc:"HP 열매를 50% 이하에서 사용",type:"gluttony"},
cheekpouch:{n:"볼주머니",desc:"열매를 먹으면 HP도 회복",type:"cheekpouch"},
unburden:{n:"경쾌함",desc:"아이템 소비 시 스피드 2배",type:"unburden"},
harvest:{n:"수확",desc:"턴 종료 시 50% 확률로 열매 재생",type:"harvest"},
steadfast:{n:"불굴의마음",desc:"풀죽을 때 스피드 1단계 상승",type:"steadfast"}
};

// ═══════════════════════════════════════════════
// 🔮 메가진화 데이터
// ═══════════════════════════════════════════════
var MEGA_DATA = {
venusaur:    {n:"메가이상해꽃",t:["grass","poison"],s:[80,100,123,122,120,80],ab:"thickfat",em:"🌺"},
charizardx:  {base:"charizard",n:"메가리자몽X",t:["fire","dragon"],s:[78,130,111,130,85,100],ab:"toughclaws",em:"🐉"},
charizardy:  {base:"charizard",n:"메가리자몽Y",t:["fire","flying"],s:[78,104,78,159,115,100],ab:"drought",em:"🐉"},
blastoise:   {n:"메가거북왕",t:["water"],s:[79,103,120,135,115,78],ab:"megalauncher",em:"🐢"},
alakazam:    {n:"메가후딘",t:["psychic"],s:[55,50,65,175,105,150],ab:"trace",em:"🔮"},
gengar:      {n:"메가팬텀",t:["ghost","poison"],s:[60,65,80,170,95,130],ab:"shadowtag",em:"👻"},
kangaskhan:  {n:"메가캥카",t:["normal"],s:[105,125,100,60,100,100],ab:"parentalbond",em:"🦘"},
pinsir:      {n:"메가쁘사이저",t:["bug","flying"],s:[65,155,120,65,90,105],ab:"aerilate",em:"🪲"},
gyarados:    {n:"메가갸라도스",t:["water","dark"],s:[95,155,109,70,130,81],ab:"moldbreaker",em:"🐲"},
aerodactyl:  {n:"메가프테라",t:["rock","flying"],s:[80,135,85,70,95,150],ab:"toughclaws",em:"🦕"},
mewtwox:     {base:"mewtwo",n:"메가뮤츠X",t:["psychic","fighting"],s:[106,190,100,154,100,130],ab:"innerfocus",em:"🧬"},
mewtwoy:     {base:"mewtwo",n:"메가뮤츠Y",t:["psychic"],s:[106,150,70,194,120,140],ab:"insomnia",em:"🧬"},
ampharos:    {n:"메가전룡",t:["electric","dragon"],s:[90,95,105,165,110,45],ab:"moldbreaker",em:"⚡"},
scizor:      {n:"메가핫삼",t:["bug","steel"],s:[70,150,140,65,100,75],ab:"technician",em:"✂️"},
heracross:   {n:"메가헤라크로스",t:["bug","fighting"],s:[80,185,115,40,105,75],ab:"moldbreaker",em:"🪲"},
houndoom:    {n:"메가헬가",t:["dark","fire"],s:[75,90,90,140,90,115],ab:"flashfire",em:"🐕‍🦺"},
tyranitar:   {n:"메가마기라스",t:["rock","dark"],s:[100,164,150,95,120,71],ab:"sandstream",em:"🦖"},
blaziken:    {n:"메가번치코",t:["fire","fighting"],s:[80,160,80,130,80,100],ab:"speedboost",em:"🐓"},
gardevoir:   {n:"메가가디안",t:["psychic","fairy"],s:[68,85,65,165,135,100],ab:"pixilate",em:"👗"},
mawile:      {n:"메가입치트",t:["steel","fairy"],s:[50,105,125,55,95,50],ab:"hugpower",em:"🦷"},
aggron:      {n:"메가보스로라",t:["steel"],s:[70,140,230,60,80,50],ab:"filter",em:"🦏"},
medicham:    {n:"메가요가램",t:["fighting","psychic"],s:[60,100,85,80,85,100],ab:"purepower",em:"🧘"},
manectric:   {n:"메가썬더볼트",t:["electric"],s:[70,75,80,135,80,135],ab:"intimidate",em:"⚡"},
banette:     {n:"메가다크펫",t:["ghost"],s:[64,165,75,93,83,75],ab:"prankster",em:"🧸"},
absol:       {n:"메가앱솔",t:["dark"],s:[65,150,60,115,60,115],ab:"superluck",em:"🌙"},
garchomp:    {n:"메가한카리아스",t:["dragon","ground"],s:[108,170,115,120,95,92],ab:"moldbreaker",em:"🦈"},
lucario:     {n:"메가루카리오",t:["fighting","steel"],s:[70,145,88,140,70,112],ab:"adaptability",em:"🐺"},
abomasnow:   {n:"메가유키노오",t:["grass","ice"],s:[90,132,105,132,105,30],ab:"snowwarning",em:"🌲"},
salamence:   {n:"메가보만다",t:["dragon","flying"],s:[95,145,130,120,90,120],ab:"aerilate",em:"🐉"},
metagross:   {n:"메가메타그로스",t:["steel","psychic"],s:[80,145,150,105,110,110],ab:"toughclaws",em:"🤖"},
latias:      {n:"메가라티아스",t:["dragon","psychic"],s:[80,100,120,140,150,110],ab:"levitate",em:"🔴"},
latios:      {n:"메가라티오스",t:["dragon","psychic"],s:[80,130,100,160,120,110],ab:"levitate",em:"🔵"},
lopunny:     {n:"메가이어롭",t:["normal","fighting"],s:[65,136,94,54,96,135],ab:"scrappy",em:"🐰"},
gallade:     {n:"메가엘레이드",t:["psychic","fighting"],s:[68,165,95,65,115,110],ab:"innerfocus",em:"⚔️"},
audino:      {n:"메가다부니",t:["normal","fairy"],s:[103,60,126,80,126,50],ab:"regenerator",em:"💖"},
diancie:     {n:"메가디안시",t:["rock","fairy"],s:[50,160,110,160,110,110],ab:"magicguard",em:"💎"}
};

// ═══════════════════════════════════════════════
// 🎮 게임 상태 & 유틸
// ═══════════════════════════════════════════════
var TIME_NAMES = ["🌙 새벽","🌅 아침","☀️ 점심","🌇 오후","🌃 밤"];
var TIME_KEYS = ["dawn","morning","noon","afternoon","night"];

var player = null;
var gState = null;
var isVisible = false;
var _eventLog = [];

function createNewPlayer(name, starterKey, region) {
    var starter = createPokemonInstance(starterKey, 5);
    var dex = {};
    dex[starterKey] = "caught";
    return {
        name: name || "레드",
        party: [starter],
        pc: [],
        bag: {pokeball:10, potion:5},
        gold: 3000,
        region: region || "kanto",
        roadIdx: 0,
        badges: {kanto:[], johto:[], hoenn:[], sinnoh:[], unova:[], kalos:[]},
        pokedex: dex,
        defeatedTrainers: {},
        defeatedGyms: {},
        day: 1,
        timeOfDay: 1,
        battleCount: 0,
        caughtLegendaries: {},
        roamingLocation: null
    };
}

function createPokemonInstance(key, level) {
    var data = POKEDEX[key];
    if (!data) return null;
    level = clamp(level || 5, 1, MAX_LEVEL);
    var iv = [];
    for (var i = 0; i < 6; i++) iv.push(rng(0,15));
    var stats = calcStats(data.s, level, iv);
    var moves = getMovesAtLevel(data.ml, level);
    var abKey = null;
    if (data.ab) {
        if (Array.isArray(data.ab)) {
            abKey = data.ab[rng(0, data.ab.length - 1)];
        } else {
            abKey = data.ab;
        }
    }
    return {
        key: key,
        nickname: data.n,
        level: level,
        exp: 0,
        iv: iv,
        stats: stats,
        currentHp: stats[0],
        moves: moves,
        status: null,
        statusTurns: 0,
        statStages: {atk:0,def:0,spatk:0,spdef:0,spd:0,acc:0,eva:0},
        heldItem: null,
        ab: abKey
    };
}

function calcStats(base, level, iv) {
    // 공식 포켓몬 스탯 공식 (EV=0 가정)
    // HP = floor(((2*Base+IV)*Level)/100) + Level + 10
    // Stat = floor(((2*Base+IV)*Level)/100) + 5
    var hp = Math.floor(((2*base[0]+iv[0])*level)/100) + level + 10;
    var stats = [hp];
    for (var i = 1; i < 6; i++) {
        stats.push(Math.floor(((2*base[i]+iv[i])*level)/100) + 5);
    }
    return stats;
}

function getMovesAtLevel(ml, level) {
    var pool = [];
    var lvls = Object.keys(ml).map(Number).sort(function(a,b){return a-b;});
    for (var i = 0; i < lvls.length; i++) {
        if (lvls[i] <= level) {
            var moves = ml[lvls[i]];
            for (var j = 0; j < moves.length; j++) {
                var exists = false;
                for (var k = 0; k < pool.length; k++) {
                    if (pool[k] === moves[j]) { exists = true; break; }
                }
                if (!exists) pool.push(moves[j]);
            }
        }
    }
    while (pool.length > 4) pool.shift();
    var result = [];
    for (var i = 0; i < pool.length; i++) {
        var md = MOVES[pool[i]];
        result.push({key: pool[i], ppLeft: md ? md.pp : 10});
    }
    return result;
}

function recalcStats(poke) {
    var data = POKEDEX[poke.key];
    if (!data) return;
    var oldMax = poke.stats[0];
    poke.stats = calcStats(data.s, poke.level, poke.iv);
    poke.currentHp = Math.min(poke.currentHp + (poke.stats[0] - oldMax), poke.stats[0]);
    if (poke.currentHp < 0) poke.currentHp = 0;
}

function getExpForLevel(lv) { return lv * lv * lv; }

function getStatMult(stage) {
    if (stage >= 0) return (2 + stage) / 2;
    return 2 / (2 - stage);
}

// ═══════════════════════════════════════════════
// 💾 세이브 / 로드
// ═══════════════════════════════════════════════
async function saveAll() {
    try {
        if (gState) gState.eventLog = _eventLog;
        var saveData = JSON.stringify(player);
        var stateData = JSON.stringify(gState);
        if (_hasRisu) {
            await Risuai.setArgument(KEY_SAVE, saveData);
            await Risuai.setArgument(KEY_STATE, stateData);
            // safeLocalStorage 백업 (플러그인 업데이트 시 데이터 보존)
            try {
                await lsSet(KEY_SAVE, saveData);
                await lsSet(KEY_STATE, stateData);
            } catch(e2) {}
        } else {
            localStorage.setItem(KEY_SAVE, saveData);
            localStorage.setItem(KEY_STATE, stateData);
        }
    } catch(e) { console.error(PLUGIN, "save fail:", e); }
}

async function loadAll() {
    try {
        var p, s;
        if (_hasRisu) {
            p = await Risuai.getArgument(KEY_SAVE);
            s = await Risuai.getArgument(KEY_STATE);
            // 기본 저장소에 없으면 safeLocalStorage 백업에서 복구 시도
            if ((!p || !s) && _ls) {
                try {
                    var bp = await lsGet(KEY_SAVE);
                    var bs = await lsGet(KEY_STATE);
                    if (bp && bs) {
                        p = bp; s = bs;
                        // 복구된 데이터를 기본 저장소에 다시 저장
                        await Risuai.setArgument(KEY_SAVE, p);
                        await Risuai.setArgument(KEY_STATE, s);
                        console.log(PLUGIN, "safeLocalStorage 백업에서 세이브 복구 완료");
                    }
                } catch(e2) {}
            }
        } else {
            p = localStorage.getItem(KEY_SAVE);
            s = localStorage.getItem(KEY_STATE);
        }
        if (p && s) {
            player = JSON.parse(p);
            gState = JSON.parse(s);
            _eventLog = gState.eventLog || [];
            // 마이그레이션: v1.0→v2.0 호환 (routeIdx→roadIdx 이름 변경, 도감/트레이너 필드 추가)
            if (!player.pokedex) player.pokedex = {};
            if (!player.defeatedTrainers) player.defeatedTrainers = {};
            if (!player.defeatedGyms) player.defeatedGyms = {};
            if (player.day === undefined) player.day = 1;
            // 시간 시스템 마이그레이션
            if (player.timeOfDay === undefined) player.timeOfDay = 1;
            if (player.battleCount === undefined) player.battleCount = 0;
            if (!player.caughtLegendaries) player.caughtLegendaries = {};
            if (player.roamingLocation === undefined) player.roamingLocation = null;
            // badges 형식 마이그레이션 (숫자→객체)
            if (typeof player.badges === 'number' || !player.badges) {
                player.badges = {kanto:[], johto:[], hoenn:[], sinnoh:[], unova:[], kalos:[]};
            }
            if (!player.badges.kanto) player.badges.kanto = [];
            if (!player.badges.johto) player.badges.johto = [];
            if (!player.badges.hoenn) player.badges.hoenn = [];
            if (!player.badges.sinnoh) player.badges.sinnoh = [];
            if (!player.badges.unova) player.badges.unova = [];
            if (!player.badges.kalos) player.badges.kalos = [];
            if (player.routeIdx !== undefined && player.roadIdx === undefined) {
                player.roadIdx = player.routeIdx;
                delete player.routeIdx;
            }
            // heldItem/ab 마이그레이션
            for (var mi = 0; mi < player.party.length; mi++) {
                if (player.party[mi].heldItem === undefined) player.party[mi].heldItem = null;
                if (player.party[mi].ab === undefined) {
                    var _pd = POKEDEX[player.party[mi].key];
                    if (_pd && _pd.ab) player.party[mi].ab = Array.isArray(_pd.ab) ? _pd.ab[0] : _pd.ab;
                }
            }
            for (var mi = 0; mi < player.pc.length; mi++) {
                if (player.pc[mi].heldItem === undefined) player.pc[mi].heldItem = null;
                if (player.pc[mi].ab === undefined) {
                    var _pd = POKEDEX[player.pc[mi].key];
                    if (_pd && _pd.ab) player.pc[mi].ab = Array.isArray(_pd.ab) ? _pd.ab[0] : _pd.ab;
                }
            }
            return true;
        }
    } catch(e) { console.error(PLUGIN, "load fail:", e); }
    return false;
}

async function saveSlot(slotNum) {
    try {
        if (!player || !gState) return false;
        if (gState) gState.eventLog = _eventLog;
        var saveData = JSON.stringify(player);
        var stateData = JSON.stringify(gState);
        var key_p = KEY_SLOT + slotNum + "_save";
        var key_s = KEY_SLOT + slotNum + "_state";
        var key_t = KEY_SLOT + slotNum + "_time";
        if (_hasRisu) {
            await Risuai.setArgument(key_p, saveData);
            await Risuai.setArgument(key_s, stateData);
            await Risuai.setArgument(key_t, new Date().toISOString());
        } else {
            localStorage.setItem(key_p, saveData);
            localStorage.setItem(key_s, stateData);
            localStorage.setItem(key_t, new Date().toISOString());
        }
        return true;
    } catch(e) { console.error(PLUGIN, "slot save fail:", e); return false; }
}

async function loadSlot(slotNum) {
    try {
        var key_p = KEY_SLOT + slotNum + "_save";
        var key_s = KEY_SLOT + slotNum + "_state";
        var p, s;
        if (_hasRisu) {
            p = await Risuai.getArgument(key_p);
            s = await Risuai.getArgument(key_s);
        } else {
            p = localStorage.getItem(key_p);
            s = localStorage.getItem(key_s);
        }
        if (p && s) {
            player = JSON.parse(p);
            gState = JSON.parse(s);
            _eventLog = gState.eventLog || [];
            if (!player.pokedex) player.pokedex = {};
            if (!player.defeatedTrainers) player.defeatedTrainers = {};
            if (!player.defeatedGyms) player.defeatedGyms = {};
            if (player.day === undefined) player.day = 1;
            if (player.timeOfDay === undefined) player.timeOfDay = 1;
            if (player.battleCount === undefined) player.battleCount = 0;
            if (!player.caughtLegendaries) player.caughtLegendaries = {};
            if (player.roamingLocation === undefined) player.roamingLocation = null;
            if (typeof player.badges === 'number' || !player.badges) {
                player.badges = {kanto:[], johto:[], hoenn:[], sinnoh:[], unova:[], kalos:[]};
            }
            if (!player.badges.kanto) player.badges.kanto = [];
            if (!player.badges.johto) player.badges.johto = [];
            if (!player.badges.hoenn) player.badges.hoenn = [];
            if (!player.badges.sinnoh) player.badges.sinnoh = [];
            if (!player.badges.unova) player.badges.unova = [];
            if (!player.badges.kalos) player.badges.kalos = [];
            for (var mi = 0; mi < player.party.length; mi++) {
                if (player.party[mi].heldItem === undefined) player.party[mi].heldItem = null;
                if (player.party[mi].ab === undefined) {
                    var _pd = POKEDEX[player.party[mi].key];
                    if (_pd && _pd.ab) player.party[mi].ab = Array.isArray(_pd.ab) ? _pd.ab[0] : _pd.ab;
                }
            }
            for (var mi = 0; mi < player.pc.length; mi++) {
                if (player.pc[mi].heldItem === undefined) player.pc[mi].heldItem = null;
                if (player.pc[mi].ab === undefined) {
                    var _pd = POKEDEX[player.pc[mi].key];
                    if (_pd && _pd.ab) player.pc[mi].ab = Array.isArray(_pd.ab) ? _pd.ab[0] : _pd.ab;
                }
            }
            return true;
        }
    } catch(e) { console.error(PLUGIN, "slot load fail:", e); }
    return false;
}

async function deleteSlot(slotNum) {
    try {
        var key_p = KEY_SLOT + slotNum + "_save";
        var key_s = KEY_SLOT + slotNum + "_state";
        var key_t = KEY_SLOT + slotNum + "_time";
        if (_hasRisu) {
            await Risuai.setArgument(key_p, "");
            await Risuai.setArgument(key_s, "");
            await Risuai.setArgument(key_t, "");
        } else {
            localStorage.removeItem(key_p);
            localStorage.removeItem(key_s);
            localStorage.removeItem(key_t);
        }
    } catch(e) { console.error(PLUGIN, "slot delete fail:", e); }
}

async function getSlotInfo(slotNum) {
    try {
        var key_p = KEY_SLOT + slotNum + "_save";
        var key_t = KEY_SLOT + slotNum + "_time";
        var p, t;
        if (_hasRisu) {
            p = await Risuai.getArgument(key_p);
            t = await Risuai.getArgument(key_t);
        } else {
            p = localStorage.getItem(key_p);
            t = localStorage.getItem(key_t);
        }
        if (p && p.length > 2) {
            var data = JSON.parse(p);
            return { exists: true, name: data.name || "???", region: data.region || "kanto", badges: Object.values(data.badges || {}).flat().length, partyCount: (data.party || []).length, time: t || "" };
        }
    } catch(e) {}
    return { exists: false };
}

function addLog(msg, type) {
    type = type || "info";
    if (!gState) return;
    gState.log = gState.log || [];
    gState.log.push({msg:msg, type:type, t:Date.now()});
    if (gState.log.length > 35) gState.log.shift();
    _eventLog.push({msg:msg, type:type});
}

function rotateBattleMsg(bd) {
    bd._msgHistory = bd._msgHistory || [];
    if (bd.msg && bd.msg.length > 0) bd._msgHistory.push(bd.msg);
    if (bd._msgHistory.length > 5) bd._msgHistory.shift();
}

// ═══════════════════════════════════════════════
// 🌟 특성 헬퍼 함수
// ═══════════════════════════════════════════════
function getAbility(poke) {
    if (!poke) return null;
    if (poke.isMega && poke.megaForm && poke.megaForm.ab) return ABILITIES[poke.megaForm.ab] || null;
    if (poke.ab) return ABILITIES[poke.ab] || null;
    var pd = POKEDEX[poke.key];
    if (!pd || !pd.ab) return null;
    var abKey = Array.isArray(pd.ab) ? pd.ab[0] : pd.ab;
    return ABILITIES[abKey] || null;
}
function getAbilityKey(poke) {
    if (!poke) return null;
    if (poke.isMega && poke.megaForm && poke.megaForm.ab) return poke.megaForm.ab;
    if (poke.ab) return poke.ab;
    var pd = POKEDEX[poke.key];
    if (!pd || !pd.ab) return null;
    return Array.isArray(pd.ab) ? pd.ab[0] : pd.ab;
}

// ═══════════════════════════════════════════════
// 🫐 열매 시스템
// ═══════════════════════════════════════════════
function checkBerryAfterDamage(poke, bd) {
    if (!poke || !poke.heldItem || poke.currentHp <= 0) return;
    var berry = ITEMS[poke.heldItem];
    if (!berry || berry.type !== "berry") return;
    var pn = poke.nickname;
    var maxHp = poke.stats[0];
    var gluttony = (getAbilityKey(poke) === "gluttony");
    // HP 회복 열매
    if (berry.berryType === "hp" && poke.currentHp <= maxHp / 2) {
        var heal = berry.value;
        poke.currentHp = Math.min(maxHp, poke.currentHp + heal);
        bd.msg.push(pn + "은(는) " + berry.n + "으로 HP를 회복했다!");
        consumeBerry(poke, bd);
    } else if (berry.berryType === "hppct" && poke.currentHp <= maxHp / 2) {
        var heal = Math.max(1, Math.floor(maxHp * berry.value / 100));
        poke.currentHp = Math.min(maxHp, poke.currentHp + heal);
        bd.msg.push(pn + "은(는) " + berry.n + "으로 HP를 회복했다!");
        consumeBerry(poke, bd);
    }
    // 핀치 스탯 열매 (HP 25% 이하, 먹보 특성이면 50% 이하)
    else if (berry.berryType === "pinch") {
        var threshold = gluttony ? maxHp / 2 : maxHp / 4;
        if (poke.currentHp <= threshold) {
            poke.statStages[berry.value] = Math.min(6, poke.statStages[berry.value] + 1);
            var statNames = {atk:"공격",def:"방어",spatk:"특공",spdef:"특방",spd:"스피드"};
            bd.msg.push(pn + "은(는) " + berry.n + "으로 " + statNames[berry.value] + "이(가) 올라갔다!");
            consumeBerry(poke, bd);
        }
    }
}

function checkBerryAfterStatus(poke, bd) {
    if (!poke || !poke.heldItem || poke.currentHp <= 0) return;
    var berry = ITEMS[poke.heldItem];
    if (!berry || berry.type !== "berry") return;
    var pn = poke.nickname;
    if (berry.berryType === "cure" && poke.status === berry.value) {
        poke.status = null; poke.statusTurns = 0;
        bd.msg.push(pn + "은(는) " + berry.n + "으로 상태가 회복됐다!");
        consumeBerry(poke, bd);
    } else if (berry.berryType === "cure" && berry.value === "confuse" && poke.status === "confuse") {
        poke.status = null; poke.statusTurns = 0;
        bd.msg.push(pn + "은(는) " + berry.n + "으로 혼란이 풀렸다!");
        consumeBerry(poke, bd);
    } else if (berry.berryType === "cure_all" && poke.status) {
        poke.status = null; poke.statusTurns = 0;
        bd.msg.push(pn + "은(는) " + berry.n + "으로 상태가 회복됐다!");
        consumeBerry(poke, bd);
    }
}

function consumeBerry(poke, bd) {
    var berryKey = poke.heldItem;
    poke._lastBerry = berryKey;
    poke.heldItem = null;
    // 특성: cheekpouch → 열매 먹을 때 HP도 회복
    if (getAbilityKey(poke) === "cheekpouch") {
        var cheekHeal = Math.max(1, Math.floor(poke.stats[0] / 8));
        poke.currentHp = Math.min(poke.stats[0], poke.currentHp + cheekHeal);
        bd.msg.push(poke.nickname + "의 볼주머니! HP가 조금 회복됐다!");
    }
    // 특성: unburden → 아이템 소비 시 스피드 2배
    if (getAbilityKey(poke) === "unburden") {
        poke._unburden = true;
        bd.msg.push(poke.nickname + "의 경쾌함! 스피드가 올라갔다!");
    }
}

// ═══════════════════════════════════════════════
// ⚔️ 데미지 계산 (정식 포켓몬 공식 기반 보정)
// ═══════════════════════════════════════════════
function calcDamage(attackerPoke, defenderPoke, moveKey) {
    var move = MOVES[moveKey];
    if (!move || move.c === "status" || move.p === 0) return {dmg:0, eff:1, crit:false};
    var atkData = POKEDEX[attackerPoke.key];
    var defData = POKEDEX[defenderPoke.key];
    if (!atkData || !defData) return {dmg:1, eff:1, crit:false};

    var atkAbKey = getAbilityKey(attackerPoke);
    var defAbKey = getAbilityKey(defenderPoke);
    var atkAb = getAbility(attackerPoke);
    var defAb = getAbility(defenderPoke);

    var level = attackerPoke.level;
    var power = move.p;
    var moveType = move.t;

    // 특성: 스킨 계열 → 노말 기술 타입변환 + 1.2배
    if (atkAb && atkAb.type === "skin" && moveType === "normal") {
        moveType = atkAb.skinType;
        power = Math.floor(power * 1.2);
    }

    // 특성: technician → 위력60이하 1.5배
    if (atkAbKey === "technician" && power <= 60) power = Math.floor(power * 1.5);
    // 특성: pinch (심록/맹화/급류/벌레의알림)
    if (atkAb && atkAb.type === "pinch" && atkAb.boostType === moveType && attackerPoke.currentHp <= Math.floor(attackerPoke.stats[0] / 3)) power = Math.floor(power * 1.5);
    // 특성: toughclaws → 접촉(physical) 기술 1.3배
    if (atkAbKey === "toughclaws" && move.c === "physical") power = Math.floor(power * 1.3);
    // 특성: strongjaw → 물기 기술 1.5배 (bite, crunch, firefang, etc.)
    var biteKeys = {bite:1,crunch:1,poisonfang:1,icefang:1,firefang:1,thunderfang:1};
    if (atkAbKey === "strongjaw" && biteKeys[moveKey]) power = Math.floor(power * 1.5);
    // 특성: ironfist → 펀치 기술 1.2배
    var punchKeys = {megapunch:1,icepunch:1,firepunch:1,thunderpunch:1,drainpunch:1,focuspunch:1,machpunch:1,skyuppercut:1,hammerarm:1};
    if (atkAbKey === "ironfist" && punchKeys[moveKey]) power = Math.floor(power * 1.2);
    // 특성: megalauncher → 파동 기술 1.5배
    var pulseKeys = {aurasphere:1,darkpulse:1,waterpulse:1,dragonpulse:1};
    if (atkAbKey === "megalauncher" && pulseKeys[moveKey]) power = Math.floor(power * 1.5);
    // 특성: reckless → 반동기 위력 1.2배
    if (atkAbKey === "reckless" && move.ef === "recoil") power = Math.floor(power * 1.2);

    // 특성: darkaura/fairyaura → 해당 타입 기술 4/3배
    if (moveType === "dark" && (atkAbKey === "darkaura" || defAbKey === "darkaura")) power = Math.floor(power * 4 / 3);
    if (moveType === "fairy" && (atkAbKey === "fairyaura" || defAbKey === "fairyaura")) power = Math.floor(power * 4 / 3);

    // 특성: sheerforce → 추가효과 제거 대신 1.3배
    if (atkAbKey === "sheerforce" && move.ef && move.ec) power = Math.floor(power * 1.3);

    // 특성: sandforce → 모래바람 시 바위/땅/강철 기술 1.3배
    if (atkAbKey === "sandforce" && (moveType === "rock" || moveType === "ground" || moveType === "steel")) power = Math.floor(power * 1.3);

    // 특성: bulletproof → 구/탄 기술 무효
    var ballMoves = {shadowball:1,sludgebomb:1,energyball:1,aurasphere:1,focusblast:1,gyroball:1,weatherball:1};
    if (defAbKey === "bulletproof" && ballMoves[moveKey]) {
        return {dmg:0, eff:0, crit:false, bulletproof:true};
    }

    // 특성: dryskin → 물 기술 흡수 회복, 불 기술 1.25배
    if (defAbKey === "dryskin" && moveType === "water") {
        return {dmg:0, eff:0, crit:false, dryskin:true};
    }
    if (defAbKey === "dryskin" && moveType === "fire") power = Math.floor(power * 1.25);

    // HP비례기: 분화(eruption)는 현재HP/최대HP 비율로 위력이 변동 (최대150→최소1)
    if (moveKey === "eruption") {
        power = Math.max(1, Math.floor(150 * attackerPoke.currentHp / attackerPoke.stats[0]));
    }

    var atkStat, defStat;
    if (move.c === "physical") {
        atkStat = attackerPoke.stats[1] * getStatMult(attackerPoke.statStages.atk);
        defStat = defenderPoke.stats[2] * getStatMult(defenderPoke.statStages.def);
        if (attackerPoke.status === "burn" && atkAbKey !== "guts") atkStat *= 0.5;
        // 특성: hugpower/purepower → 물리공격 2배
        if (atkAbKey === "hugpower" || atkAbKey === "purepower") atkStat *= 2;
        // 특성: guts → 상태이상 시 물리공격 1.5배
        if (atkAbKey === "guts" && attackerPoke.status) atkStat *= 1.5;
        // 특성: marvelscale → 상태이상 시 방어 1.5배
        if (defAbKey === "marvelscale" && defenderPoke.status) defStat *= 1.5;
        // 특성: furcoat → 물리방어 2배
        if (defAbKey === "furcoat") defStat *= 2;
    } else {
        atkStat = attackerPoke.stats[3] * getStatMult(attackerPoke.statStages.spatk);
        defStat = defenderPoke.stats[4] * getStatMult(defenderPoke.statStages.spdef);
    }

    // 방어가 0이하면 1로 보정
    if (defStat < 1) defStat = 1;

    // 공식 데미지 공식: ((2*Level/5+2) * Power * A/D) / 50 + 2
    var baseDmg = Math.floor(((Math.floor(2 * level / 5) + 2) * power * Math.floor(atkStat)) / Math.floor(defStat) / 50) + 2;

    // STAB
    var stab = 1;
    var atkTypes = attackerPoke.megaTypes || atkData.t;
    for (var i = 0; i < atkTypes.length; i++) {
        if (atkTypes[i] === moveType) { stab = 1.5; break; }
    }
    // 특성: adaptability → STAB 2배
    if (atkAbKey === "adaptability" && stab > 1) stab = 2;

    // 타입 상성
    var defTypes = defenderPoke.megaTypes || defData.t;
    var eff = getTypeEffect(moveType, defTypes);

    // 특성: scrappy → 노말/격투가 고스트에 적중
    if (atkAbKey === "scrappy" && (moveType === "normal" || moveType === "fighting") && eff === 0) eff = 1;

    // 특성: wonderguard → 효과 좋은 기술만 맞음
    if (defAbKey === "wonderguard" && eff <= 1 && eff > 0) return {dmg:0, eff:0, crit:false, blocked:"wonderguard"};
    // 특성: 타입 면역 특성들
    if (defAbKey === "levitate" && moveType === "ground") return {dmg:0, eff:0, crit:false, absorbed:"levitate"};
    if (defAbKey === "flashfire" && moveType === "fire") { defenderPoke.flashFireBoost = true; return {dmg:0, eff:0, crit:false, absorbed:"flashfire"}; }
    if (defAbKey === "waterabsorb" && moveType === "water") return {dmg:0, eff:0, crit:false, absorbed:"waterabsorb"};
    if (defAbKey === "voltabsorb" && moveType === "electric") return {dmg:0, eff:0, crit:false, absorbed:"voltabsorb"};
    if ((defAbKey === "lightningrod" || defAbKey === "motordrive") && moveType === "electric") return {dmg:0, eff:0, crit:false, absorbed:defAbKey};
    if (defAbKey === "sapsipper" && moveType === "grass") return {dmg:0, eff:0, crit:false, absorbed:"sapsipper"};

    // 특성: thickfat → 불/얼음 반감
    if (defAbKey === "thickfat" && (moveType === "fire" || moveType === "ice")) eff *= 0.5;
    // 특성: filter/solidrock → 효과 좋은 기술 3/4
    if ((defAbKey === "filter" || defAbKey === "solidrock") && eff > 1) eff *= 0.75;
    // 특성: multiscale → HP만땅 시 반감
    if (defAbKey === "multiscale" && defenderPoke.currentHp >= defenderPoke.stats[0]) eff *= 0.5;

    // 특성: flashfire boost for attacker
    if (atkAbKey === "flashfire" && moveType === "fire" && attackerPoke.flashFireBoost) power = Math.floor(power * 1.5);

    // 급소
    var critChance = (move.ef === "highcrit") ? 0.125 : (attackerPoke.critBoost ? 0.125 : (1/24));
    // 특성: superluck → 급소율 상승
    if (atkAbKey === "superluck") critChance = Math.min(0.5, critChance * 2);
    // 특성: shellarmor/battlearmor → 급소 무효
    var crit = 1;
    if (defAbKey !== "shellarmor" && defAbKey !== "battlearmor") {
        crit = (Math.random() < critChance) ? 1.5 : 1;
    }
    // 특성: sniper → 급소 시 2.25배
    if (atkAbKey === "sniper" && crit > 1) crit = 2.25;

    // 랜덤 (0.85~1.00)
    var rand = rngf(0.85, 1.0);

    var dmg = Math.floor(baseDmg * stab * eff * crit * rand);
    if (dmg < 1 && eff > 0) dmg = 1;

    // 특성: sturdy → HP만땅에서 일격사 방지
    if (defAbKey === "sturdy" && defenderPoke.currentHp >= defenderPoke.stats[0] && dmg >= defenderPoke.currentHp) {
        dmg = defenderPoke.currentHp - 1;
    }

    return {dmg: dmg, eff: eff, crit: crit > 1};
}

// ═══════════════════════════════════════════════
// 🌟 전설/환상 포켓몬 시스템
// ═══════════════════════════════════════════════
var LEGENDARY_ENCOUNTERS = {
// 관동 전설 (관동 뱃지 8개 필요, 세키에이고원에서 조우)
kanto_fixed: [
    {key:"articuno",road:"k_r36",reqRegion:"kanto",reqBadges:8,level:50,name:"프리져"},
    {key:"zapdos",road:"k_r36",reqRegion:"kanto",reqBadges:8,level:50,name:"썬더"},
    {key:"moltres",road:"k_r36",reqRegion:"kanto",reqBadges:8,level:50,name:"파이어"},
    {key:"mewtwo",road:"k_r36",reqRegion:"kanto",reqBadges:8,level:70,name:"뮤츠"}
],
// 성도 전설 (성도 뱃지 8개 필요, 소용돌이섬에서 조우)
johto_fixed: [
    {key:"lugia",road:"j_r31",reqRegion:"johto",reqBadges:8,level:60,name:"루기아"},
    {key:"hooh",road:"j_r31",reqRegion:"johto",reqBadges:8,level:60,name:"호오"}
],
// 호연 전설 (호연 뱃지 8개 필요, 공중의 기둥에서 조우)
hoenn_fixed: [
    {key:"regirock",road:"h_r28",reqRegion:"hoenn",reqBadges:8,level:50,name:"레지락"},
    {key:"regice",road:"h_r28",reqRegion:"hoenn",reqBadges:8,level:50,name:"레지아이스"},
    {key:"registeel",road:"h_r28",reqRegion:"hoenn",reqBadges:8,level:50,name:"레지스틸"},
    {key:"latias",road:"h_r28",reqRegion:"hoenn",reqBadges:8,level:50,name:"라티아스"},
    {key:"latios",road:"h_r28",reqRegion:"hoenn",reqBadges:8,level:50,name:"라티오스"},
    {key:"kyogre",road:"h_r28",reqRegion:"hoenn",reqBadges:8,level:70,name:"가이오가"},
    {key:"groudon",road:"h_r28",reqRegion:"hoenn",reqBadges:8,level:70,name:"그란돈"},
    {key:"rayquaza",road:"h_r28",reqRegion:"hoenn",reqBadges:8,level:70,name:"레쿠쟈"}
],
// 신오 전설 (신오 뱃지 8개 필요, 창기둥에서 조우)
sinnoh_fixed: [
    {key:"dialga",road:"s_r28",reqRegion:"sinnoh",reqBadges:8,level:70,name:"디아루가"},
    {key:"palkia",road:"s_r28",reqRegion:"sinnoh",reqBadges:8,level:70,name:"펄기아"},
    {key:"giratina",road:"s_r28",reqRegion:"sinnoh",reqBadges:8,level:70,name:"기라티나"},
    {key:"heatran",road:"s_r28",reqRegion:"sinnoh",reqBadges:8,level:50,name:"히드런"},
    {key:"cresselia",road:"s_r28",reqRegion:"sinnoh",reqBadges:8,level:50,name:"크레세리아"},
    {key:"uxie",road:"s_r28",reqRegion:"sinnoh",reqBadges:8,level:50,name:"유크시"},
    {key:"mesprit",road:"s_r28",reqRegion:"sinnoh",reqBadges:8,level:50,name:"에무리트"},
    {key:"azelf",road:"s_r28",reqRegion:"sinnoh",reqBadges:8,level:50,name:"아그놈"},
    {key:"regigigas",road:"s_r28",reqRegion:"sinnoh",reqBadges:8,level:70,name:"레지기가스"}
],
// 하나 전설 (하나 뱃지 8개 필요, 용의나선탑에서 조우)
unova_fixed: [
    {key:"reshiram",road:"u_r20",reqRegion:"unova",reqBadges:8,level:70,name:"레시라무"},
    {key:"zekrom",road:"u_r20",reqRegion:"unova",reqBadges:8,level:70,name:"제크로무"},
    {key:"kyurem",road:"u_r20",reqRegion:"unova",reqBadges:8,level:70,name:"큐레무"},
    {key:"cobalion",road:"u_r20",reqRegion:"unova",reqBadges:8,level:50,name:"코바르온"},
    {key:"terrakion",road:"u_r20",reqRegion:"unova",reqBadges:8,level:50,name:"테라키온"},
    {key:"virizion",road:"u_r20",reqRegion:"unova",reqBadges:8,level:50,name:"비리디온"},
    {key:"landorus",road:"u_r20",reqRegion:"unova",reqBadges:8,level:70,name:"랜드로스"},
    {key:"tornadus",road:"u_r20",reqRegion:"unova",reqBadges:8,level:70,name:"토네로스"},
    {key:"thundurus",road:"u_r20",reqRegion:"unova",reqBadges:8,level:70,name:"볼트로스"}
],
// 칼로스 전설 (칼로스 뱃지 8개 필요, 챔피언로드에서 조우)
kalos_fixed: [
    {key:"xerneas",road:"x_r25",reqRegion:"kalos",reqBadges:8,level:70,name:"제르네아스"},
    {key:"yveltal",road:"x_r25",reqRegion:"kalos",reqBadges:8,level:70,name:"이벨타르"},
    {key:"zygarde",road:"x_r25",reqRegion:"kalos",reqBadges:8,level:70,name:"지가르데"}
],
// 로밍 (성도 뱃지 3개 이상, 랜덤 도로에 출현)
roaming: ["raikou","entei","suicune"],
// 환상 (업적 조건)
mythical: [
    {key:"mew",reqType:"pokedex",reqCount:150,level:50,name:"뮤"},
    {key:"celebi",reqType:"totalBadges",reqCount:16,level:50,name:"세레비"},
    {key:"jirachi",reqType:"totalBadges",reqCount:24,level:50,name:"지라치"},
    {key:"deoxys",reqType:"pokedex",reqCount:300,level:50,name:"테오키스"},
    {key:"darkrai",reqType:"totalBadges",reqCount:32,level:50,name:"다크라이"},
    {key:"shaymin",reqType:"pokedex",reqCount:400,level:50,name:"쉐이미"},
    {key:"arceus",reqType:"totalBadges",reqCount:32,level:80,name:"아르세우스"},
    {key:"phione",reqType:"pokedex",reqCount:450,level:30,name:"피오네"},
    {key:"manaphy",reqType:"totalBadges",reqCount:32,level:50,name:"마나피"},
    {key:"victini",reqType:"totalBadges",reqCount:40,level:50,name:"비크티니"},
    {key:"keldeo",reqType:"pokedex",reqCount:500,level:50,name:"케르디오"},
    {key:"meloetta",reqType:"totalBadges",reqCount:40,level:50,name:"메로엣타"},
    {key:"genesect",reqType:"pokedex",reqCount:600,level:50,name:"게노세크트"},
    {key:"diancie",reqType:"totalBadges",reqCount:48,level:50,name:"디안시"},
    {key:"hoopa",reqType:"pokedex",reqCount:650,level:50,name:"후파"},
    {key:"volcanion",reqType:"totalBadges",reqCount:48,level:50,name:"볼케니온"}
]
};

function getAvailableLegendaries(roadId) {
    if (!player) return [];
    var available = [];
    // 고정 전설 (관동)
    for (var i = 0; i < LEGENDARY_ENCOUNTERS.kanto_fixed.length; i++) {
        var le = LEGENDARY_ENCOUNTERS.kanto_fixed[i];
        if (le.road !== roadId) continue;
        if (player.caughtLegendaries[le.key]) continue;
        var badges = player.badges[le.reqRegion] ? player.badges[le.reqRegion].length : 0;
        if (badges >= le.reqBadges) available.push(le);
    }
    // 고정 전설 (성도)
    for (var i = 0; i < LEGENDARY_ENCOUNTERS.johto_fixed.length; i++) {
        var le = LEGENDARY_ENCOUNTERS.johto_fixed[i];
        if (le.road !== roadId) continue;
        if (player.caughtLegendaries[le.key]) continue;
        var badges = player.badges[le.reqRegion] ? player.badges[le.reqRegion].length : 0;
        if (badges >= le.reqBadges) available.push(le);
    }
    // 고정 전설 (호연)
    for (var i = 0; i < LEGENDARY_ENCOUNTERS.hoenn_fixed.length; i++) {
        var le = LEGENDARY_ENCOUNTERS.hoenn_fixed[i];
        if (le.road !== roadId) continue;
        if (player.caughtLegendaries[le.key]) continue;
        var badges = player.badges[le.reqRegion] ? player.badges[le.reqRegion].length : 0;
        if (badges >= le.reqBadges) available.push(le);
    }
    // 고정 전설 (신오)
    for (var i = 0; i < LEGENDARY_ENCOUNTERS.sinnoh_fixed.length; i++) {
        var le = LEGENDARY_ENCOUNTERS.sinnoh_fixed[i];
        if (le.road !== roadId) continue;
        if (player.caughtLegendaries[le.key]) continue;
        var badges = player.badges[le.reqRegion] ? player.badges[le.reqRegion].length : 0;
        if (badges >= le.reqBadges) available.push(le);
    }
    // 고정 전설 (하나)
    for (var i = 0; i < LEGENDARY_ENCOUNTERS.unova_fixed.length; i++) {
        var le = LEGENDARY_ENCOUNTERS.unova_fixed[i];
        if (le.road !== roadId) continue;
        if (player.caughtLegendaries[le.key]) continue;
        var badges = player.badges[le.reqRegion] ? player.badges[le.reqRegion].length : 0;
        if (badges >= le.reqBadges) available.push(le);
    }
    // 고정 전설 (칼로스)
    for (var i = 0; i < LEGENDARY_ENCOUNTERS.kalos_fixed.length; i++) {
        var le = LEGENDARY_ENCOUNTERS.kalos_fixed[i];
        if (le.road !== roadId) continue;
        if (player.caughtLegendaries[le.key]) continue;
        var badges = player.badges[le.reqRegion] ? player.badges[le.reqRegion].length : 0;
        if (badges >= le.reqBadges) available.push(le);
    }
    return available;
}

function getAvailableMythicals() {
    if (!player) return [];
    var available = [];
    for (var i = 0; i < LEGENDARY_ENCOUNTERS.mythical.length; i++) {
        var m = LEGENDARY_ENCOUNTERS.mythical[i];
        if (player.caughtLegendaries[m.key]) continue;
        if (m.reqType === "pokedex") {
            var seen = Object.keys(player.pokedex || {}).length;
            if (seen >= m.reqCount) available.push(m);
        } else if (m.reqType === "totalBadges") {
            var total = (player.badges.kanto ? player.badges.kanto.length : 0) + (player.badges.johto ? player.badges.johto.length : 0) + (player.badges.hoenn ? player.badges.hoenn.length : 0) + (player.badges.sinnoh ? player.badges.sinnoh.length : 0) + (player.badges.unova ? player.badges.unova.length : 0) + (player.badges.kalos ? player.badges.kalos.length : 0);
            if (total >= m.reqCount) available.push(m);
        }
    }
    return available;
}

function getRoamingAtRoad(roadIdx) {
    if (!player || !player.roamingLocation) return null;
    if (player.roamingLocation.region !== player.region) return null;
    if (player.roamingLocation.roadIdx !== roadIdx) return null;
    var pokeList = player.roamingLocation.pokemon;
    if (!pokeList || pokeList.length === 0) return null;
    return pokeList[rng(0, pokeList.length - 1)];
}

function startLegendaryBattle(legendaryKey, level) {
    if (!player || !gState) return false;
    var wildPoke = createPokemonInstance(legendaryKey, level);
    if (!wildPoke) return false;
    if (player.pokedex) { if (!player.pokedex[legendaryKey]) player.pokedex[legendaryKey] = "seen"; }
    var myIdx = 0;
    for (var i = 0; i < player.party.length; i++) {
        if (player.party[i].currentHp > 0) { myIdx = i; break; }
    }
    gState.phase = "battle";
    gState.battleData = {
        type: "wild",
        isLegendary: true,
        legendaryKey: legendaryKey,
        enemy: wildPoke,
        myIdx: myIdx,
        battleParticipants: [myIdx],
        turn: 0,
        fled: false,
        caught: false,
        won: false,
        lost: false,
        msg: [],
        animating: false
    };
    var dn = POKEDEX[legendaryKey] ? POKEDEX[legendaryKey].n : legendaryKey;
    addLog("🌟 전설의 포켓몬 " + dn + " (Lv." + level + ")이(가) 나타났다!", "battle");
    gState.battleData.msg.push("🌟 전설의 포켓몬 " + dn + " (Lv." + level + ")이(가) 나타났다!");
    return true;
}

// ═══════════════════════════════════════════════
// ⏰ 시간 시스템
// ═══════════════════════════════════════════════
function advanceTime() {
    if (!player) return;
    player.timeOfDay++;
    player.battleCount = 0;
    if (player.timeOfDay >= 5) {
        player.timeOfDay = 0;
        player.day++;
        addLog("🌅 " + player.day + "일차가 밝았다!", "system");
    }
    addLog("⏰ 시간이 흘러 " + TIME_NAMES[player.timeOfDay] + " 이(가) 되었다.", "system");
    // 로밍 전설 포켓몬 위치 재배치 (낮→밤, 밤→새벽 등 시간 변할 때마다)
    randomizeRoamingLocation();
}

function randomizeRoamingLocation() {
    if (!player) return;
    // 성도 뱃지 3개 이상이면 로밍 시작
    var jBadges = player.badges.johto ? player.badges.johto.length : 0;
    if (jBadges < 3) { player.roamingLocation = null; return; }
    // 라이코/앤테이/스이쿤 중 아직 안 잡은 것이 있으면 로밍
    var roamers = ["raikou","entei","suicune"];
    var active = [];
    for (var i = 0; i < roamers.length; i++) {
        if (!player.caughtLegendaries[roamers[i]]) active.push(roamers[i]);
    }
    if (active.length === 0) { player.roamingLocation = null; return; }
    // 현재 지역의 랜덤 도로에 배치
    var region = REGIONS[player.region];
    if (!region) return;
    var roadCount = region.roads.length;
    var rIdx = rng(0, roadCount - 1);
    player.roamingLocation = {region: player.region, roadIdx: rIdx, pokemon: active};
}

function isNightTime() { return player && player.timeOfDay === 4; }
function isDawnTime() { return player && player.timeOfDay === 0; }

// ═══════════════════════════════════════════════
// ⚔️ 배틀 시스템
// ═══════════════════════════════════════════════
function getCurrentRoad() {
    if (!player) return null;
    var region = REGIONS[player.region];
    if (!region) return null;
    return region.roads[player.roadIdx] || null;
}

// 대량발생 데이터
var SWARM_DATA = {
    kanto: [
        {road:"k_r1", pokemon:"yanma", lv:[3,6]},
        {road:"k_r2", pokemon:"ralts", lv:[3,6]},
        {road:"k_r3", pokemon:"wurmple", lv:[4,8]},
        {road:"k_r4", pokemon:"marill", lv:[8,12]},
        {road:"k_r6", pokemon:"poliwag", lv:[8,12]},
        {road:"k_r7", pokemon:"sunkern", lv:[12,16]},
        {road:"k_r9", pokemon:"magby", lv:[14,18]},
        {road:"k_r10", pokemon:"elekid", lv:[14,18]},
        {road:"k_r12", pokemon:"chansey", lv:[14,18]},
        {road:"k_r13", pokemon:"marill", lv:[16,22]},
        {road:"k_r14", pokemon:"voltorb", lv:[18,24]},
        {road:"k_r17", pokemon:"sneasel", lv:[20,24]},
        {road:"k_r18", pokemon:"murkrow", lv:[20,24]},
        {road:"k_r19", pokemon:"slugma", lv:[22,26]},
        {road:"k_r20", pokemon:"skarmory", lv:[22,28]},
        {road:"k_r22", pokemon:"yanma", lv:[24,28]},
        {road:"k_r26", pokemon:"larvitar", lv:[24,30]},
        {road:"k_r33", pokemon:"ponyta", lv:[28,34]},
        {road:"k_r34", pokemon:"larvitar", lv:[32,40]},
        {road:"k_r36", pokemon:"ditto", lv:[42,56]}
    ],
    johto: [
        {road:"j_r1", pokemon:"poochyena", lv:[3,6]},
        {road:"j_r2", pokemon:"ralts", lv:[4,7]},
        {road:"j_r3", pokemon:"yanma", lv:[8,12]},
        {road:"j_r5", pokemon:"dunsparce", lv:[10,14]},
        {road:"j_r6", pokemon:"snubbull", lv:[12,16]},
        {road:"j_r8", pokemon:"marill", lv:[14,18]}
    ],
    sinnoh: [
        {road:"s_r1", pokemon:"doduo", lv:[3,6]},
        {road:"s_r2", pokemon:"natu", lv:[3,6]},
        {road:"s_r3", pokemon:"ralts", lv:[5,8]},
        {road:"s_r6", pokemon:"slakoth", lv:[6,10]},
        {road:"s_r8", pokemon:"surskit", lv:[10,14]},
        {road:"s_r9", pokemon:"drowzee", lv:[10,14]},
        {road:"s_r10", pokemon:"absol", lv:[14,18]},
        {road:"s_r12", pokemon:"dunsparce", lv:[16,20]},
        {road:"s_r13", pokemon:"spoink", lv:[16,22]},
        {road:"s_r14", pokemon:"swablu", lv:[20,25]},
        {road:"s_r15", pokemon:"makuhita", lv:[22,26]},
        {road:"s_r16", pokemon:"beldum", lv:[22,28]},
        {road:"s_r17", pokemon:"nosepass", lv:[22,28]},
        {road:"s_r21", pokemon:"snorunt", lv:[32,38]},
        {road:"s_r22", pokemon:"delibird", lv:[34,40]},
        {road:"s_r26", pokemon:"electabuzz", lv:[38,42]},
        {road:"s_r31", pokemon:"tyrogue", lv:[50,55]},
        {road:"s_r34", pokemon:"cacnea", lv:[50,56]},
        {road:"s_r35", pokemon:"pinsir", lv:[50,56]}
    ],
    unova: [
        {road:"u_r1", pokemon:"pidove", lv:[2,5]},
        {road:"u_r2", pokemon:"audino", lv:[4,8]},
        {road:"u_r4", pokemon:"munna", lv:[8,12]},
        {road:"u_r5", pokemon:"zorua", lv:[13,16]},
        {road:"u_r6", pokemon:"maractus", lv:[15,20]},
        {road:"u_r8", pokemon:"emolga", lv:[19,24]},
        {road:"u_r10", pokemon:"ducklett", lv:[22,28]},
        {road:"u_r12", pokemon:"deerling", lv:[25,30]},
        {road:"u_r15", pokemon:"stunfisk", lv:[30,36]},
        {road:"u_r16", pokemon:"absol", lv:[31,38]},
        {road:"u_r17", pokemon:"larvesta", lv:[32,40]},
        {road:"u_r25", pokemon:"sawsbuck", lv:[40,48]},
        {road:"u_r27", pokemon:"volcarona", lv:[44,55]},
        {road:"u_r29", pokemon:"braviary", lv:[42,50]},
        {road:"u_r30", pokemon:"mandibuzz", lv:[42,50]},
        {road:"u_r34", pokemon:"zoroark", lv:[48,56]}
    ]
};

function getActiveSwarm() {
    if (!player) return null;
    var swarms = SWARM_DATA[player.region];
    if (!swarms || swarms.length === 0) return null;
    var idx = (player.day + 7) % swarms.length; // offset by 7 to vary starting swarm
    return swarms[idx];
}

var FISHING_DATA = {
// ── 관동 ──
"k_c4":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:40},{k:"poliwag",w:40},{k:"magikarp",w:20}]},super:{lv:[25,40],pokemon:[{k:"poliwhirl",w:30},{k:"seaking",w:25},{k:"psyduck",w:25},{k:"golduck",w:15},{k:"slowpoke",w:5}]}},
"k_c5":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"krabby",w:40},{k:"horsea",w:35},{k:"magikarp",w:25}]},super:{lv:[25,40],pokemon:[{k:"kingler",w:25},{k:"seadra",w:25},{k:"shellder",w:25},{k:"staryu",w:20},{k:"gyarados",w:5}]}},
"k_c9":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:35},{k:"krabby",w:35},{k:"magikarp",w:30}]},super:{lv:[25,40],pokemon:[{k:"seaking",w:25},{k:"kingler",w:25},{k:"psyduck",w:20},{k:"slowpoke",w:20},{k:"gyarados",w:10}]}},
"k_c10":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"horsea",w:40},{k:"krabby",w:35},{k:"magikarp",w:25}]},super:{lv:[25,40],pokemon:[{k:"seadra",w:25},{k:"gyarados",w:20},{k:"staryu",w:25},{k:"kingler",w:20},{k:"shellder",w:10}]}},
"k_r7":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:40},{k:"poliwag",w:40},{k:"magikarp",w:20}]},super:{lv:[25,40],pokemon:[{k:"poliwhirl",w:30},{k:"seaking",w:30},{k:"psyduck",w:25},{k:"slowpoke",w:15}]}},
"k_r8":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:40},{k:"poliwag",w:40},{k:"magikarp",w:20}]},super:{lv:[25,40],pokemon:[{k:"poliwhirl",w:30},{k:"seaking",w:30},{k:"psyduck",w:25},{k:"slowpoke",w:15}]}},
"k_r10":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:45},{k:"poliwag",w:35},{k:"magikarp",w:20}]},super:{lv:[25,40],pokemon:[{k:"poliwhirl",w:30},{k:"seaking",w:30},{k:"psyduck",w:25},{k:"golduck",w:15}]}},
"k_r22":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:35},{k:"poliwag",w:30},{k:"magikarp",w:35}]},super:{lv:[25,40],pokemon:[{k:"poliwhirl",w:25},{k:"seaking",w:25},{k:"gyarados",w:15},{k:"dratini",w:5},{k:"psyduck",w:30}]}},
"k_r23":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:40},{k:"poliwag",w:35},{k:"magikarp",w:25}]},super:{lv:[25,40],pokemon:[{k:"poliwhirl",w:30},{k:"seaking",w:30},{k:"psyduck",w:25},{k:"golduck",w:15}]}},
"k_r24":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:40},{k:"poliwag",w:35},{k:"magikarp",w:25}]},super:{lv:[25,40],pokemon:[{k:"poliwhirl",w:30},{k:"seaking",w:25},{k:"psyduck",w:25},{k:"slowpoke",w:20}]}},
"k_r25":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:40},{k:"poliwag",w:35},{k:"magikarp",w:25}]},super:{lv:[25,40],pokemon:[{k:"seaking",w:30},{k:"poliwhirl",w:25},{k:"psyduck",w:25},{k:"golduck",w:20}]}},
"k_r26":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:35},{k:"poliwag",w:30},{k:"magikarp",w:20},{k:"psyduck",w:15}]},super:{lv:[25,45],pokemon:[{k:"dratini",w:15},{k:"dragonair",w:5},{k:"seaking",w:25},{k:"slowbro",w:20},{k:"gyarados",w:10},{k:"golduck",w:25}]}},
"k_r28":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"horsea",w:35},{k:"krabby",w:35},{k:"magikarp",w:30}]},super:{lv:[25,40],pokemon:[{k:"seadra",w:25},{k:"kingler",w:25},{k:"gyarados",w:15},{k:"staryu",w:20},{k:"shellder",w:15}]}},
"k_r29":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"horsea",w:35},{k:"krabby",w:35},{k:"shellder",w:20},{k:"magikarp",w:10}]},super:{lv:[25,40],pokemon:[{k:"seadra",w:25},{k:"kingler",w:20},{k:"gyarados",w:15},{k:"shellder",w:20},{k:"cloyster",w:10},{k:"lapras",w:10}]}},
"k_r30":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"horsea",w:30},{k:"krabby",w:30},{k:"shellder",w:25},{k:"magikarp",w:15}]},super:{lv:[25,40],pokemon:[{k:"seadra",w:20},{k:"kingler",w:20},{k:"dewgong",w:15},{k:"cloyster",w:15},{k:"lapras",w:10},{k:"gyarados",w:10},{k:"seel",w:10}]}},
"k_r32":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"horsea",w:35},{k:"krabby",w:35},{k:"magikarp",w:30}]},super:{lv:[25,40],pokemon:[{k:"seadra",w:25},{k:"kingler",w:25},{k:"gyarados",w:15},{k:"staryu",w:20},{k:"tentacruel",w:15}]}},
"k_r36":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:35},{k:"poliwag",w:35},{k:"psyduck",w:30}]},super:{lv:[30,50],pokemon:[{k:"gyarados",w:20},{k:"golduck",w:25},{k:"slowbro",w:20},{k:"poliwhirl",w:20},{k:"seaking",w:15}]}},
// ── 성도 ──
"j_c2":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:40},{k:"poliwag",w:40},{k:"magikarp",w:20}]},super:{lv:[25,35],pokemon:[{k:"poliwhirl",w:30},{k:"seaking",w:30},{k:"psyduck",w:25},{k:"slowpoke",w:15}]}},
"j_c5":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:40},{k:"poliwag",w:35},{k:"magikarp",w:25}]},super:{lv:[25,35],pokemon:[{k:"seaking",w:30},{k:"poliwhirl",w:30},{k:"psyduck",w:25},{k:"golduck",w:15}]}},
"j_c7":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"krabby",w:35},{k:"horsea",w:35},{k:"magikarp",w:30}]},super:{lv:[25,40],pokemon:[{k:"kingler",w:25},{k:"seadra",w:25},{k:"staryu",w:20},{k:"corsola",w:15},{k:"tentacruel",w:15}]}},
"j_c8":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"krabby",w:35},{k:"tentacool",w:35},{k:"magikarp",w:30}]},super:{lv:[25,40],pokemon:[{k:"kingler",w:25},{k:"tentacruel",w:25},{k:"corsola",w:20},{k:"staryu",w:20},{k:"shellder",w:10}]}},
"j_c10":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:40},{k:"poliwag",w:35},{k:"magikarp",w:25}]},super:{lv:[25,40],pokemon:[{k:"seaking",w:25},{k:"poliwhirl",w:25},{k:"psyduck",w:20},{k:"golduck",w:15},{k:"gyarados",w:15}]}},
"j_r2":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:40},{k:"poliwag",w:40},{k:"magikarp",w:20}]},super:{lv:[25,35],pokemon:[{k:"poliwhirl",w:30},{k:"seaking",w:30},{k:"psyduck",w:25},{k:"slowpoke",w:15}]}},
"j_r3":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:40},{k:"poliwag",w:40},{k:"magikarp",w:20}]},super:{lv:[25,35],pokemon:[{k:"poliwhirl",w:30},{k:"seaking",w:30},{k:"psyduck",w:25},{k:"slowpoke",w:15}]}},
"j_r5":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:35},{k:"tentacool",w:35},{k:"magikarp",w:30}]},super:{lv:[25,35],pokemon:[{k:"seaking",w:25},{k:"tentacruel",w:25},{k:"qwilfish",w:20},{k:"poliwhirl",w:20},{k:"gyarados",w:10}]}},
"j_r6":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:40},{k:"poliwag",w:40},{k:"magikarp",w:20}]},super:{lv:[25,35],pokemon:[{k:"seaking",w:30},{k:"poliwhirl",w:30},{k:"quagsire",w:20},{k:"golduck",w:20}]}},
"j_r7":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:40},{k:"slowpoke",w:40},{k:"magikarp",w:20}]},super:{lv:[25,35],pokemon:[{k:"slowbro",w:25},{k:"seaking",w:25},{k:"poliwhirl",w:25},{k:"golduck",w:25}]}},
"j_r9":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:40},{k:"poliwag",w:40},{k:"magikarp",w:20}]},super:{lv:[25,35],pokemon:[{k:"poliwhirl",w:30},{k:"seaking",w:30},{k:"psyduck",w:25},{k:"slowpoke",w:15}]}},
"j_r10":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:40},{k:"poliwag",w:35},{k:"magikarp",w:25}]},super:{lv:[25,35],pokemon:[{k:"seaking",w:30},{k:"poliwhirl",w:30},{k:"psyduck",w:25},{k:"golduck",w:15}]}},
"j_r16":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"tentacool",w:35},{k:"krabby",w:35},{k:"magikarp",w:30}]},super:{lv:[25,40],pokemon:[{k:"tentacruel",w:25},{k:"kingler",w:25},{k:"corsola",w:20},{k:"staryu",w:20},{k:"lanturn",w:10}]}},
"j_r17":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"tentacool",w:35},{k:"krabby",w:35},{k:"magikarp",w:30}]},super:{lv:[25,40],pokemon:[{k:"tentacruel",w:25},{k:"kingler",w:25},{k:"corsola",w:20},{k:"staryu",w:20},{k:"lanturn",w:10}]}},
"j_r18":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:40},{k:"poliwag",w:35},{k:"magikarp",w:25}]},super:{lv:[25,40],pokemon:[{k:"seaking",w:25},{k:"poliwhirl",w:25},{k:"golduck",w:20},{k:"gyarados",w:15},{k:"psyduck",w:15}]}},
"j_r20":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[20,30],pokemon:[{k:"magikarp",w:85},{k:"gyarados",w:15}]},super:{lv:[30,40],pokemon:[{k:"gyarados",w:40},{k:"magikarp",w:30},{k:"seaking",w:15},{k:"poliwhirl",w:15}]}},
"j_r21":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:40},{k:"poliwag",w:35},{k:"magikarp",w:25}]},super:{lv:[25,35],pokemon:[{k:"seaking",w:25},{k:"poliwhirl",w:25},{k:"psyduck",w:25},{k:"gyarados",w:15},{k:"golduck",w:10}]}},
"j_r25":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"horsea",w:35},{k:"krabby",w:35},{k:"magikarp",w:30}]},super:{lv:[25,40],pokemon:[{k:"seadra",w:25},{k:"kingler",w:20},{k:"horsea",w:20},{k:"tentacruel",w:20},{k:"gyarados",w:15}]}},
"j_r31":{old:{lv:[10,15],pokemon:[{k:"magikarp",w:100}]},good:{lv:[20,30],pokemon:[{k:"goldeen",w:40},{k:"poliwag",w:35},{k:"magikarp",w:25}]},super:{lv:[30,45],pokemon:[{k:"seaking",w:25},{k:"gyarados",w:20},{k:"poliwhirl",w:25},{k:"golduck",w:20},{k:"slowbro",w:10}]}},
"j_r_ruins":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:40},{k:"poliwag",w:40},{k:"magikarp",w:20}]},super:{lv:[25,35],pokemon:[{k:"poliwhirl",w:30},{k:"seaking",w:30},{k:"quagsire",w:20},{k:"wooper",w:20}]}},
"j_r_dragonden":{old:{lv:[10,15],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"magikarp",w:50},{k:"dratini",w:50}]},super:{lv:[25,45],pokemon:[{k:"dratini",w:35},{k:"dragonair",w:20},{k:"magikarp",w:20},{k:"gyarados",w:15},{k:"seadra",w:10}]}},
// ── 호연 ──
"h_r2":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,20],pokemon:[{k:"magikarp",w:30},{k:"tentacool",w:35},{k:"marill",w:35}]},super:{lv:[20,35],pokemon:[{k:"wailmer",w:25},{k:"carvanha",w:25},{k:"sharpedo",w:15},{k:"staryu",w:20},{k:"gyarados",w:15}]}},
"h_r4":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,20],pokemon:[{k:"magikarp",w:30},{k:"tentacool",w:35},{k:"marill",w:35}]},super:{lv:[20,35],pokemon:[{k:"wailmer",w:25},{k:"carvanha",w:25},{k:"sharpedo",w:15},{k:"staryu",w:20},{k:"gyarados",w:15}]}},
"h_r9":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,20],pokemon:[{k:"magikarp",w:30},{k:"tentacool",w:35},{k:"marill",w:35}]},super:{lv:[20,35],pokemon:[{k:"carvanha",w:30},{k:"sharpedo",w:20},{k:"wailmer",w:25},{k:"barboach",w:25}]}},
"h_r10":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,20],pokemon:[{k:"magikarp",w:30},{k:"goldeen",w:35},{k:"corphish",w:35}]},super:{lv:[20,35],pokemon:[{k:"crawdaunt",w:20},{k:"seaking",w:25},{k:"barboach",w:25},{k:"whiscash",w:15},{k:"gyarados",w:15}]}},
"h_r15":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,20],pokemon:[{k:"magikarp",w:30},{k:"goldeen",w:35},{k:"barboach",w:35}]},super:{lv:[20,35],pokemon:[{k:"whiscash",w:20},{k:"seaking",w:25},{k:"corphish",w:25},{k:"crawdaunt",w:15},{k:"gyarados",w:15}]}},
"h_r16":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,20],pokemon:[{k:"magikarp",w:30},{k:"goldeen",w:35},{k:"barboach",w:35}]},super:{lv:[20,40],pokemon:[{k:"whiscash",w:20},{k:"seaking",w:25},{k:"gyarados",w:15},{k:"barboach",w:25},{k:"bagon",w:15}]}},
"h_r18":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,20],pokemon:[{k:"magikarp",w:30},{k:"tentacool",w:30},{k:"carvanha",w:40}]},super:{lv:[20,35],pokemon:[{k:"sharpedo",w:25},{k:"carvanha",w:25},{k:"wailmer",w:20},{k:"gyarados",w:15},{k:"staryu",w:15}]}},
"h_r19":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,20],pokemon:[{k:"magikarp",w:30},{k:"tentacool",w:30},{k:"carvanha",w:40}]},super:{lv:[20,35],pokemon:[{k:"feebas",w:15},{k:"sharpedo",w:20},{k:"carvanha",w:20},{k:"wailmer",w:20},{k:"gyarados",w:15},{k:"barboach",w:10}]}},
"h_r20":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,20],pokemon:[{k:"magikarp",w:30},{k:"goldeen",w:35},{k:"marill",w:35}]},super:{lv:[20,35],pokemon:[{k:"seaking",w:25},{k:"azumarill",w:20},{k:"barboach",w:25},{k:"gyarados",w:15},{k:"crawdaunt",w:15}]}},
"h_r_sea1":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"tentacool",w:40},{k:"wailmer",w:35}]},super:{lv:[25,40],pokemon:[{k:"wailmer",w:25},{k:"sharpedo",w:20},{k:"staryu",w:20},{k:"tentacruel",w:20},{k:"gyarados",w:15}]}},
"h_r_122":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"tentacool",w:40},{k:"wailmer",w:35}]},super:{lv:[25,40],pokemon:[{k:"wailmer",w:25},{k:"sharpedo",w:20},{k:"horsea",w:20},{k:"tentacruel",w:20},{k:"gyarados",w:15}]}},
"h_r23":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"tentacool",w:40},{k:"wailmer",w:35}]},super:{lv:[25,40],pokemon:[{k:"wailmer",w:20},{k:"sharpedo",w:20},{k:"corsola",w:15},{k:"staryu",w:20},{k:"relicanth",w:10},{k:"gyarados",w:15}]}},
"h_r_125":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"tentacool",w:40},{k:"wailmer",w:35}]},super:{lv:[25,40],pokemon:[{k:"wailmer",w:25},{k:"sharpedo",w:20},{k:"staryu",w:20},{k:"tentacruel",w:20},{k:"gyarados",w:15}]}},
"h_r_126":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"tentacool",w:40},{k:"wailmer",w:35}]},super:{lv:[25,40],pokemon:[{k:"wailmer",w:25},{k:"sharpedo",w:20},{k:"corsola",w:15},{k:"tentacruel",w:20},{k:"relicanth",w:10},{k:"gyarados",w:10}]}},
"h_r_127":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"tentacool",w:40},{k:"wailmer",w:35}]},super:{lv:[25,40],pokemon:[{k:"wailmer",w:25},{k:"sharpedo",w:20},{k:"staryu",w:15},{k:"tentacruel",w:20},{k:"corsola",w:10},{k:"gyarados",w:10}]}},
"h_r_sea2":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,30],pokemon:[{k:"magikarp",w:25},{k:"tentacool",w:35},{k:"wailmer",w:40}]},super:{lv:[30,45],pokemon:[{k:"wailmer",w:20},{k:"sharpedo",w:20},{k:"horsea",w:15},{k:"staryu",w:15},{k:"corsola",w:10},{k:"relicanth",w:10},{k:"gyarados",w:10}]}},
"h_r_132":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"tentacool",w:35},{k:"horsea",w:40}]},super:{lv:[25,40],pokemon:[{k:"horsea",w:25},{k:"wailmer",w:20},{k:"sharpedo",w:20},{k:"staryu",w:15},{k:"gyarados",w:10},{k:"seadra",w:10}]}},
"h_r_133":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"tentacool",w:35},{k:"horsea",w:40}]},super:{lv:[25,40],pokemon:[{k:"horsea",w:25},{k:"wailmer",w:20},{k:"sharpedo",w:20},{k:"staryu",w:15},{k:"gyarados",w:10},{k:"seadra",w:10}]}},
"h_r_134":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"tentacool",w:35},{k:"horsea",w:40}]},super:{lv:[25,40],pokemon:[{k:"horsea",w:20},{k:"wailmer",w:20},{k:"sharpedo",w:15},{k:"corsola",w:15},{k:"relicanth",w:15},{k:"gyarados",w:10},{k:"seadra",w:5}]}},
"h_r_safari":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:30},{k:"goldeen",w:40},{k:"marill",w:30}]},super:{lv:[25,40],pokemon:[{k:"seaking",w:25},{k:"gyarados",w:15},{k:"azumarill",w:20},{k:"crawdaunt",w:15},{k:"barboach",w:15},{k:"whiscash",w:10}]}},
"h_c6":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"tentacool",w:40},{k:"wailmer",w:35}]},super:{lv:[25,40],pokemon:[{k:"wailmer",w:25},{k:"sharpedo",w:20},{k:"staryu",w:20},{k:"tentacruel",w:20},{k:"gyarados",w:15}]}},
"h_c12":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"tentacool",w:40},{k:"wailmer",w:35}]},super:{lv:[25,40],pokemon:[{k:"wailmer",w:25},{k:"sharpedo",w:20},{k:"staryu",w:20},{k:"tentacruel",w:20},{k:"gyarados",w:15}]}},
"h_c_pacifidlog":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"tentacool",w:35},{k:"horsea",w:40}]},super:{lv:[25,40],pokemon:[{k:"horsea",w:20},{k:"wailmer",w:20},{k:"sharpedo",w:15},{k:"corsola",w:15},{k:"relicanth",w:15},{k:"gyarados",w:10},{k:"seadra",w:5}]}},
"j_r_safari":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[15,25],pokemon:[{k:"goldeen",w:35},{k:"poliwag",w:30},{k:"magikarp",w:20},{k:"psyduck",w:15}]},super:{lv:[25,40],pokemon:[{k:"seaking",w:25},{k:"poliwhirl",w:20},{k:"golduck",w:20},{k:"gyarados",w:15},{k:"dragonair",w:5},{k:"dratini",w:15}]}},
// ── 신오 ──
"s_r7":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,20],pokemon:[{k:"magikarp",w:30},{k:"goldeen",w:35},{k:"finneon",w:35}]},super:{lv:[20,35],pokemon:[{k:"gyarados",w:15},{k:"seaking",w:20},{k:"lumineon",w:20},{k:"golduck",w:20},{k:"barboach",w:15},{k:"whiscash",w:10}]}},
"s_r8":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,20],pokemon:[{k:"magikarp",w:30},{k:"goldeen",w:35},{k:"finneon",w:35}]},super:{lv:[20,35],pokemon:[{k:"gyarados",w:15},{k:"seaking",w:20},{k:"lumineon",w:20},{k:"golduck",w:20},{k:"barboach",w:15},{k:"whiscash",w:10}]}},
"s_r_fuego":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:30},{k:"goldeen",w:35},{k:"finneon",w:35}]},super:{lv:[25,40],pokemon:[{k:"gyarados",w:15},{k:"seaking",w:20},{k:"lumineon",w:20},{k:"golduck",w:20},{k:"barboach",w:15},{k:"whiscash",w:10}]}},
"s_c2":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,20],pokemon:[{k:"magikarp",w:30},{k:"goldeen",w:35},{k:"finneon",w:35}]},super:{lv:[20,35],pokemon:[{k:"gyarados",w:15},{k:"seaking",w:20},{k:"lumineon",w:20},{k:"golduck",w:20},{k:"barboach",w:15},{k:"whiscash",w:10}]}},
"s_r19":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"barboach",w:40},{k:"goldeen",w:35}]},super:{lv:[25,40],pokemon:[{k:"gyarados",w:15},{k:"whiscash",w:20},{k:"seaking",w:20},{k:"golduck",w:15},{k:"feebas",w:15},{k:"barboach",w:15}]}},
"s_r20":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"tentacool",w:40},{k:"finneon",w:35}]},super:{lv:[25,40],pokemon:[{k:"gyarados",w:15},{k:"tentacruel",w:20},{k:"lumineon",w:20},{k:"floatzel",w:20},{k:"gastrodon",w:15},{k:"octillery",w:10}]}},
"s_c11":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"tentacool",w:40},{k:"finneon",w:35}]},super:{lv:[25,40],pokemon:[{k:"gyarados",w:15},{k:"tentacruel",w:20},{k:"lumineon",w:20},{k:"floatzel",w:20},{k:"gastrodon",w:15},{k:"octillery",w:10}]}},
"s_r23":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"tentacool",w:40},{k:"finneon",w:35}]},super:{lv:[25,40],pokemon:[{k:"gyarados",w:15},{k:"tentacruel",w:20},{k:"lumineon",w:20},{k:"floatzel",w:20},{k:"gastrodon",w:15},{k:"octillery",w:10}]}},
"s_r24":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,30],pokemon:[{k:"magikarp",w:25},{k:"tentacool",w:35},{k:"finneon",w:40}]},super:{lv:[30,45],pokemon:[{k:"gyarados",w:15},{k:"tentacruel",w:20},{k:"lumineon",w:15},{k:"sealeo",w:15},{k:"floatzel",w:15},{k:"wailmer",w:10},{k:"mantyke",w:10}]}},
"s_r27":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,30],pokemon:[{k:"magikarp",w:25},{k:"tentacool",w:35},{k:"finneon",w:40}]},super:{lv:[30,45],pokemon:[{k:"gyarados",w:15},{k:"tentacruel",w:20},{k:"lumineon",w:15},{k:"sealeo",w:15},{k:"floatzel",w:15},{k:"wailmer",w:10},{k:"mantyke",w:10}]}},
"s_r_lakeverity":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,20],pokemon:[{k:"magikarp",w:30},{k:"goldeen",w:40},{k:"finneon",w:30}]},super:{lv:[20,35],pokemon:[{k:"gyarados",w:15},{k:"seaking",w:25},{k:"golduck",w:25},{k:"lumineon",w:20},{k:"barboach",w:15}]}},
"s_r_lakevalor":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:30},{k:"goldeen",w:35},{k:"finneon",w:35}]},super:{lv:[25,40],pokemon:[{k:"gyarados",w:15},{k:"seaking",w:20},{k:"golduck",w:20},{k:"lumineon",w:20},{k:"barboach",w:15},{k:"whiscash",w:10}]}},
"s_r_lakeacuity":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:30},{k:"goldeen",w:35},{k:"finneon",w:35}]},super:{lv:[25,40],pokemon:[{k:"gyarados",w:15},{k:"seaking",w:20},{k:"golduck",w:20},{k:"lumineon",w:20},{k:"barboach",w:15},{k:"whiscash",w:10}]}},
"s_r_greatmarsh":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"goldeen",w:35},{k:"barboach",w:40}]},super:{lv:[25,40],pokemon:[{k:"gyarados",w:15},{k:"whiscash",w:20},{k:"seaking",w:20},{k:"golduck",w:20},{k:"carvanha",w:15},{k:"barboach",w:10}]}},
"s_c10":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"goldeen",w:35},{k:"barboach",w:40}]},super:{lv:[25,40],pokemon:[{k:"gyarados",w:15},{k:"whiscash",w:20},{k:"seaking",w:20},{k:"golduck",w:20},{k:"carvanha",w:15},{k:"barboach",w:10}]}},
"s_r32":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,30],pokemon:[{k:"magikarp",w:20},{k:"tentacool",w:40},{k:"finneon",w:40}]},super:{lv:[30,50],pokemon:[{k:"gyarados",w:15},{k:"tentacruel",w:20},{k:"lumineon",w:15},{k:"sealeo",w:15},{k:"floatzel",w:15},{k:"horsea",w:10},{k:"seadra",w:10}]}},
"s_r36":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,30],pokemon:[{k:"magikarp",w:20},{k:"tentacool",w:40},{k:"finneon",w:40}]},super:{lv:[30,50],pokemon:[{k:"gyarados",w:15},{k:"tentacruel",w:20},{k:"lumineon",w:15},{k:"sealeo",w:15},{k:"wailmer",w:15},{k:"wailord",w:5},{k:"horsea",w:15}]}},
// ── 하나 ──
"u_r7":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"basculin",w:40},{k:"tympole",w:35}]},super:{lv:[25,40],pokemon:[{k:"gyarados",w:15},{k:"basculin",w:25},{k:"seismitoad",w:15},{k:"alomomola",w:15},{k:"jellicent",w:15},{k:"stunfisk",w:15}]}},
"u_r8":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"basculin",w:40},{k:"tympole",w:35}]},super:{lv:[25,40],pokemon:[{k:"gyarados",w:15},{k:"basculin",w:20},{k:"palpitoad",w:20},{k:"stunfisk",w:20},{k:"alomomola",w:10},{k:"jellicent",w:15}]}},
"u_r10":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:20},{k:"basculin",w:45},{k:"tympole",w:35}]},super:{lv:[25,40],pokemon:[{k:"gyarados",w:15},{k:"basculin",w:25},{k:"seismitoad",w:15},{k:"alomomola",w:15},{k:"frillish",w:15},{k:"jellicent",w:15}]}},
"u_c5":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:25},{k:"basculin",w:40},{k:"frillish",w:35}]},super:{lv:[25,40],pokemon:[{k:"gyarados",w:15},{k:"basculin",w:20},{k:"frillish",w:20},{k:"jellicent",w:15},{k:"alomomola",w:15},{k:"stunfisk",w:15}]}},
"u_c7":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:20},{k:"basculin",w:45},{k:"tympole",w:35}]},super:{lv:[25,40],pokemon:[{k:"gyarados",w:15},{k:"basculin",w:25},{k:"seismitoad",w:15},{k:"palpitoad",w:15},{k:"stunfisk",w:15},{k:"alomomola",w:15}]}},
"u_r15":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,25],pokemon:[{k:"magikarp",w:20},{k:"basculin",w:40},{k:"stunfisk",w:40}]},super:{lv:[25,45],pokemon:[{k:"gyarados",w:15},{k:"basculin",w:20},{k:"stunfisk",w:20},{k:"seismitoad",w:15},{k:"alomomola",w:15},{k:"jellicent",w:15}]}},
"u_c13":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,30],pokemon:[{k:"magikarp",w:20},{k:"basculin",w:35},{k:"frillish",w:45}]},super:{lv:[30,50],pokemon:[{k:"gyarados",w:15},{k:"basculin",w:20},{k:"jellicent",w:20},{k:"alomomola",w:20},{k:"frillish",w:15},{k:"wailmer",w:10}]}},
"u_r33":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,30],pokemon:[{k:"magikarp",w:20},{k:"basculin",w:40},{k:"frillish",w:40}]},super:{lv:[30,50],pokemon:[{k:"gyarados",w:15},{k:"basculin",w:20},{k:"jellicent",w:20},{k:"alomomola",w:15},{k:"frillish",w:15},{k:"wailmer",w:15}]}},
"u_r38":{old:{lv:[5,10],pokemon:[{k:"magikarp",w:100}]},good:{lv:[10,30],pokemon:[{k:"magikarp",w:20},{k:"basculin",w:40},{k:"frillish",w:40}]},super:{lv:[30,50],pokemon:[{k:"gyarados",w:15},{k:"basculin",w:20},{k:"jellicent",w:20},{k:"alomomola",w:20},{k:"frillish",w:15},{k:"wailmer",w:10}]}}
};

function startWildBattle(road) {
    if (!player || !gState || !road) return false;
    // 확률 조우
    if (Math.random() > road.encounterRate) {
        addLog((road.n||"") + " 풀숲을 탐색했지만 포켓몬이 나타나지 않았다...", "info");
        return false;
    }
    // 대량발생 체크 (40% 확률로 대량발생 포켓몬 출현)
    var swarm = getActiveSwarm();
    if (swarm && road.id === swarm.road && Math.random() < 0.4) {
        var swLv = rng(swarm.lv[0], swarm.lv[1]);
        var swPoke = createPokemonInstance(swarm.pokemon, swLv);
        if (swPoke) {
            if (player.pokedex) { if (!player.pokedex[swarm.pokemon]) player.pokedex[swarm.pokemon] = "seen"; }
            var dn = POKEDEX[swarm.pokemon] ? POKEDEX[swarm.pokemon].n : swarm.pokemon;
            addLog("⚡ 대량발생! 야생 " + dn + " (Lv." + swLv + ")이(가) 나타났다!", "battle");
            var myIdx = 0;
            for (var i = 0; i < player.party.length; i++) { if (player.party[i].currentHp > 0) { myIdx = i; break; } }
            gState.phase = "battle";
            gState.battleData = {type:"wild",enemy:swPoke,myIdx:myIdx,battleParticipants:[myIdx],turn:0,fled:false,caught:false,won:false,lost:false,msg:[],animating:false};
            gState.battleData.msg.push("⚡ 대량발생! 야생 " + dn + " (Lv." + swLv + ")이(가) 나타났다!");
            var myFirst = player.party[myIdx];
            gState.battleData.msg.push(player.name + "은(는) " + myFirst.nickname + " (Lv." + myFirst.level + ")을(를) 내보냈다!");
            if (getAbilityKey(myFirst) === "intimidate") {
                gState.battleData.enemy.statStages.atk = Math.max(-6, gState.battleData.enemy.statStages.atk - 1);
                gState.battleData.msg.push(myFirst.nickname + "의 위협! " + dn + "의 공격이 떨어졌다!");
            }
            return true;
        }
    }
    // 시간대별 포켓몬 필터링
    var nightOnly = {gastly:1,haunter:1,gengar:1,hoothoot:1,noctowl:1,murkrow:1,misdreavus:1,spinarak:1,ariados:1,sneasel:1,umbreon:1,houndour:1,houndoom:1,litwick:1,lampent:1,chandelure:1,phantump:1,trevenant:1,pumpkaboo:1,gourgeist:1};
    var dayOnly = {sunkern:1,sunflora:1,ledyba:1,ledian:1,espeon:1,cottonee:1,whimsicott:1,petilil:1,lilligant:1,helioptile:1,heliolisk:1};
    var isNight = isNightTime() || isDawnTime(); // 밤/새벽
    var isDay = !isNight;
    // 가중치 조정된 포켓몬 리스트 생성
    var filtered = [];
    for (var i = 0; i < road.pokemon.length; i++) {
        var pk = road.pokemon[i];
        var w = pk.w;
        if (nightOnly[pk.k] && isDay) w = Math.floor(w * 0.2); // 밤 전용 포켓몬은 낮에 20%
        if (nightOnly[pk.k] && isNight) w = Math.floor(w * 2.0); // 밤에 2배
        if (dayOnly[pk.k] && isNight) w = Math.floor(w * 0.2); // 낮 전용 포켓몬은 밤에 20%
        if (dayOnly[pk.k] && isDay) w = Math.floor(w * 1.5); // 낮에 1.5배
        if (w < 1) w = 1;
        filtered.push({k: pk.k, w: w});
    }
    // 야생 포켓몬 선택
    var totalW = 0;
    for (var i = 0; i < filtered.length; i++) totalW += filtered[i].w;
    var r = Math.random() * totalW;
    var cumW = 0;
    var chosen = filtered[0].k;
    for (var i = 0; i < filtered.length; i++) {
        cumW += filtered[i].w;
        if (r < cumW) { chosen = filtered[i].k; break; }
    }
    var lv = rng(road.lv[0], road.lv[1]);
    var wildPoke = createPokemonInstance(chosen, lv);
    if (!wildPoke) return false;
    // 도감 등록
    if (player.pokedex) { if (!player.pokedex[chosen]) player.pokedex[chosen] = "seen"; }
    var myIdx = 0;
    for (var i = 0; i < player.party.length; i++) {
        if (player.party[i].currentHp > 0) { myIdx = i; break; }
    }
    gState.phase = "battle";
    gState.battleData = {
        type: "wild",
        enemy: wildPoke,
        myIdx: myIdx,
        battleParticipants: [myIdx],
        turn: 0,
        fled: false,
        caught: false,
        won: false,
        lost: false,
        msg: [],
        animating: false
    };
    var dn = POKEDEX[chosen] ? POKEDEX[chosen].n : chosen;
    addLog("야생 " + dn + " (Lv." + lv + ")이(가) " + (road.n||"") + "에서 나타났다!", "battle");
    gState.battleData.msg.push("야생 " + dn + " (Lv." + lv + ")이(가) 나타났다!");
    // 내 포켓몬 등장
    var myFirst = player.party[gState.battleData.myIdx];
    gState.battleData.msg.push(player.name + "은(는) " + myFirst.nickname + " (Lv." + myFirst.level + ")을(를) 내보냈다!");
    // 특성: intimidate (내 포켓몬)
    if (getAbilityKey(myFirst) === "intimidate") {
        gState.battleData.enemy.statStages.atk = Math.max(-6, gState.battleData.enemy.statStages.atk - 1);
        gState.battleData.msg.push(myFirst.nickname + "의 위협! " + dn + "의 공격이 떨어졌다!");
    }
    return true;
}

function startFishingBattle(road, rodType) {
    if (!player || !gState || !road) return false;
    var fData = FISHING_DATA[road.id];
    if (!fData || !fData[rodType]) return false;
    var rodInfo = fData[rodType];
    // 낚시 확률: 낡은=70%, 좋은=80%, 대단한=90%
    var catchRate = rodType === "old" ? 0.7 : (rodType === "good" ? 0.8 : 0.9);
    if (Math.random() > catchRate) {
        addLog("🎣 " + (road.n||"") + "에서 낚시를 했지만... 아무것도 낚이지 않았다!", "info");
        return false;
    }
    var pool = rodInfo.pokemon;
    var totalW = 0;
    for (var i = 0; i < pool.length; i++) totalW += pool[i].w;
    var r = Math.random() * totalW;
    var cumW = 0;
    var chosen = pool[0].k;
    for (var i = 0; i < pool.length; i++) {
        cumW += pool[i].w;
        if (r < cumW) { chosen = pool[i].k; break; }
    }
    var lv = rng(rodInfo.lv[0], rodInfo.lv[1]);
    var wildPoke = createPokemonInstance(chosen, lv);
    if (!wildPoke) return false;
    if (player.pokedex) { if (!player.pokedex[chosen]) player.pokedex[chosen] = "seen"; }
    var myIdx = 0;
    for (var i = 0; i < player.party.length; i++) {
        if (player.party[i].currentHp > 0) { myIdx = i; break; }
    }
    gState.phase = "battle";
    gState.battleData = {
        type: "wild",
        enemy: wildPoke,
        myIdx: myIdx,
        battleParticipants: [myIdx],
        turn: 0,
        fled: false,
        caught: false,
        won: false,
        lost: false,
        msg: [],
        animating: false
    };
    var dn = POKEDEX[chosen] ? POKEDEX[chosen].n : chosen;
    var rodName = rodType === "old" ? "낡은낚시대" : (rodType === "good" ? "좋은낚시대" : "대단한낚시대");
    addLog("🎣 " + rodName + "로 야생 " + dn + " (Lv." + lv + ")을(를) 낚았다!", "battle");
    gState.battleData.msg.push("🎣 " + rodName + "로 야생 " + dn + " (Lv." + lv + ")을(를) 낚았다!");
    var myFirst = player.party[gState.battleData.myIdx];
    gState.battleData.msg.push(player.name + "은(는) " + myFirst.nickname + " (Lv." + myFirst.level + ")을(를) 내보냈다!");
    if (getAbilityKey(myFirst) === "intimidate") {
        gState.battleData.enemy.statStages.atk = Math.max(-6, gState.battleData.enemy.statStages.atk - 1);
        gState.battleData.msg.push(myFirst.nickname + "의 위협! " + dn + "의 공격이 떨어졌다!");
    }
    return true;
}

function startTrainerBattle(road, trainerIdx) {
    if (!player || !gState || !road) return false;
    var trainer = road.trainers[trainerIdx];
    if (!trainer) return false;
    var tKey = road.id + "_t" + trainerIdx;
    if (player.defeatedTrainers[tKey] === player.day) {
        return false; // 오늘 이미 이긴 트레이너
    }
    var isRematch = (player.defeatedTrainers[tKey] !== undefined);
    // 트레이너 파티 생성
    var enemyParty = [];
    for (var i = 0; i < trainer.pokemon.length; i++) {
        var tp = trainer.pokemon[i];
        var poke = createPokemonInstance(tp.k, tp.l);
        if (poke) enemyParty.push(poke);
    }
    if (enemyParty.length === 0) return false;
    var myIdx = 0;
    for (var i = 0; i < player.party.length; i++) {
        if (player.party[i].currentHp > 0) { myIdx = i; break; }
    }
    gState.phase = "battle";
    gState.battleData = {
        type: "trainer",
        trainerName: trainer.n,
        trainerEmoji: trainer.em,
        trainerReward: trainer.reward,
        trainerKey: tKey,
        isRematch: isRematch,
        enemyParty: enemyParty,
        enemyIdx: 0,
        enemy: enemyParty[0],
        myIdx: myIdx,
        battleParticipants: [myIdx],
        turn: 0,
        fled: false,
        caught: false,
        won: false,
        lost: false,
        msg: [],
        animating: false
    };
    addLog(trainer.em + " " + trainer.n + "이(가) 승부를 걸어왔다!", "battle");
    gState.battleData.msg.push(trainer.em + " " + trainer.n + "이(가) 승부를 걸어왔다!");
    gState.battleData.msg.push(trainer.n + "은(는) " + enemyParty[0].nickname + " (Lv." + enemyParty[0].level + ")을(를) 내보냈다!");
    var myFirstT = player.party[gState.battleData.myIdx];
    gState.battleData.msg.push(player.name + "은(는) " + myFirstT.nickname + " (Lv." + myFirstT.level + ")을(를) 내보냈다!");
    // 특성: intimidate (내 포켓몬)
    if (getAbilityKey(myFirstT) === "intimidate") {
        gState.battleData.enemy.statStages.atk = Math.max(-6, gState.battleData.enemy.statStages.atk - 1);
        gState.battleData.msg.push(myFirstT.nickname + "의 위협! " + enemyParty[0].nickname + "의 공격이 떨어졌다!");
    }
    // 도감 등록
    for (var i = 0; i < enemyParty.length; i++) {
        if (player.pokedex) { if (!player.pokedex[enemyParty[i].key]) player.pokedex[enemyParty[i].key] = "seen"; }
    }
    return true;
}

function startGymBattle(regionKey, gymIdx, leaderIdx) {
    if (!player || !gState) return false;
    var gymList = GYMS[regionKey];
    if (!gymList || !gymList[gymIdx]) return false;
    var gym = gymList[gymIdx];
    var leader = gym.leaders[leaderIdx || 0];
    if (!leader) return false;
    var gKey = gym.id + "_" + leader.id;
    if (player.defeatedGyms[gKey] === player.day) return false; // 오늘 이미 이김
    var hasBadge = (player.badges[regionKey] && player.badges[regionKey].indexOf(gym.id) !== -1);
    var isRematch = (player.defeatedGyms[gKey] !== undefined) || hasBadge;
    var enemyParty = [];
    for (var i = 0; i < leader.pokemon.length; i++) {
        var tp = leader.pokemon[i];
        var poke = createPokemonInstance(tp.k, tp.l);
        if (poke) enemyParty.push(poke);
    }
    if (enemyParty.length === 0) return false;
    var myIdx = 0;
    for (var i = 0; i < player.party.length; i++) {
        if (player.party[i].currentHp > 0) { myIdx = i; break; }
    }
    gState.phase = "battle";
    gState.battleData = {
        type: "trainer",
        isGymBattle: true,
        gymId: gym.id,
        gymRegion: regionKey,
        gymBadge: gym.badge,
        gymBadgeEm: gym.badgeEm,
        trainerName: "관장 " + leader.n,
        trainerEmoji: leader.em,
        trainerReward: leader.reward,
        trainerRewardItems: leader.rewardItems,
        trainerKey: gKey,
        isRematch: isRematch,
        enemyParty: enemyParty,
        enemyIdx: 0,
        enemy: enemyParty[0],
        myIdx: myIdx,
        battleParticipants: [myIdx],
        turn: 0,
        fled: false,
        caught: false,
        won: false,
        lost: false,
        msg: [],
        animating: false
    };
    addLog(leader.em + " 관장 " + leader.n + "이(가) 승부를 걸어왔다!", "battle");
    gState.battleData.msg.push(leader.em + " 관장 " + leader.n + "이(가) 승부를 걸어왔다!");
    gState.battleData.msg.push("관장 " + leader.n + "은(는) " + enemyParty[0].nickname + " (Lv." + enemyParty[0].level + ")을(를) 내보냈다!");
    var myFirstG = player.party[gState.battleData.myIdx];
    gState.battleData.msg.push(player.name + "은(는) " + myFirstG.nickname + " (Lv." + myFirstG.level + ")을(를) 내보냈다!");
    // 특성: intimidate (내 포켓몬)
    if (getAbilityKey(myFirstG) === "intimidate") {
        gState.battleData.enemy.statStages.atk = Math.max(-6, gState.battleData.enemy.statStages.atk - 1);
        gState.battleData.msg.push(myFirstG.nickname + "의 위협! " + enemyParty[0].nickname + "의 공격이 떨어졌다!");
    }
    for (var i = 0; i < enemyParty.length; i++) {
        if (player.pokedex) { if (!player.pokedex[enemyParty[i].key]) player.pokedex[enemyParty[i].key] = "seen"; }
    }
    return true;
}

function applyMoveEffects(move, attacker, defender, bd) {
    var mv = MOVES[move];
    if (!mv) return;
    var an = attacker.nickname;
    var dn = defender.nickname;
    if (mv.ef && mv.ec) {
        // 특성: sheerforce → 추가효과 제거 대신 위력 1.3배 (calcDamage에서 처리)
        if (getAbilityKey(attacker) === "sheerforce") { /* 추가효과 스킵 */ }
        else {
        // 특성: serenegrace → 추가효과 확률 2배
        var effChance = mv.ec;
        if (getAbilityKey(attacker) === "serenegrace") effChance = Math.min(100, effChance * 2);
        if (Math.random() * 100 < effChance) {
            if (mv.ef === "burn" && !defender.status) {
                defender.status = "burn"; bd.msg.push(dn + "은(는) 화상을 입었다!");
            } else if (mv.ef === "paralyze" && !defender.status) {
                defender.status = "paralyze"; bd.msg.push(dn + "은(는) 마비되었다!");
            } else if (mv.ef === "poison" && !defender.status) {
                defender.status = "poison"; bd.msg.push(dn + "은(는) 독에 걸렸다!");
            } else if (mv.ef === "sleep" && !defender.status) {
                defender.status = "sleep"; defender.statusTurns = rng(1,3); bd.msg.push(dn + "은(는) 잠들었다!");
            } else if (mv.ef === "freeze" && !defender.status) {
                defender.status = "freeze"; bd.msg.push(dn + "은(는) 얼어붙었다!");
            } else if (mv.ef === "confuse") {
                // 특성: owntempo → 혼란 면역
                if (getAbilityKey(defender) === "owntempo") {
                    bd.msg.push(dn + "의 마이페이스! 혼란에 걸리지 않는다!");
                } else if (defender.status !== "confuse") {
                    defender.status = "confuse"; defender.statusTurns = rng(2,5); bd.msg.push(dn + "은(는) 혼란에 빠졌다!");
                }
            } else if (mv.ef === "flinch") {
                // 특성: innerfocus/noflinch → 풀죽지 않음
                var defAbForFlinch = getAbility(defender);
                var flinchImmune = (getAbilityKey(defender) === "innerfocus") || (defAbForFlinch && defAbForFlinch.type === "noflinch");
                if (!flinchImmune) {
                    defender._flinched = true;
                }
            } else if (mv.ef === "atk_down") {
                // 특성: clearbody/whitesmoke → 능력치 하락 방지
                var _defAbType = getAbility(defender) ? getAbility(defender).type : null;
                if (_defAbType === "prevent_statdown") { bd.msg.push(dn + "의 " + getAbility(defender).n + "! 능력치가 떨어지지 않는다!"); }
                else {
                    defender.statStages.atk = Math.max(-6, defender.statStages.atk - 1); bd.msg.push(dn + "의 공격이 떨어졌다!");
                    // 특성: competitive → 능력치 하락 시 특공 +2
                    if (getAbilityKey(defender) === "competitive") { defender.statStages.spatk = Math.min(6, defender.statStages.spatk + 2); bd.msg.push(dn + "의 승부근성! 특공이 크게 올라갔다!"); }
                }
            } else if (mv.ef === "spdef_down") {
                var _defAbType2 = getAbility(defender) ? getAbility(defender).type : null;
                if (_defAbType2 === "prevent_statdown") { bd.msg.push(dn + "의 " + getAbility(defender).n + "! 능력치가 떨어지지 않는다!"); }
                else {
                    defender.statStages.spdef = Math.max(-6, defender.statStages.spdef - 1); bd.msg.push(dn + "의 특방이 떨어졌다!");
                    if (getAbilityKey(defender) === "competitive") { defender.statStages.spatk = Math.min(6, defender.statStages.spatk + 2); bd.msg.push(dn + "의 승부근성! 특공이 크게 올라갔다!"); }
                }
            } else if (mv.ef === "spd_down") {
                var _defAbType3 = getAbility(defender) ? getAbility(defender).type : null;
                if (_defAbType3 === "prevent_statdown") { bd.msg.push(dn + "의 " + getAbility(defender).n + "! 능력치가 떨어지지 않는다!"); }
                else {
                    defender.statStages.spd = Math.max(-6, defender.statStages.spd - 1); bd.msg.push(dn + "의 스피드가 떨어졌다!");
                    if (getAbilityKey(defender) === "competitive") { defender.statStages.spatk = Math.min(6, defender.statStages.spatk + 2); bd.msg.push(dn + "의 승부근성! 특공이 크게 올라갔다!"); }
                }
            }
            // 특성: synchronize → 상태이상 반사 (독/마비/화상만)
            if (defender.status && getAbilityKey(defender) === "synchronize" && !attacker.status) {
                if (defender.status === "poison" || defender.status === "burn" || defender.status === "paralyze") {
                    attacker.status = defender.status;
                    attacker.statusTurns = 0;
                    bd.msg.push(dn + "의 싱크로! " + an + "도 " + statusName(attacker.status) + " 상태가 되었다!");
                }
            }
            checkBerryAfterStatus(defender, bd);
        }
        }
    }
    if (mv.c === "status" && mv.p === 0) {
        // guardSpec blocks stat drops
        var isStatDown = (mv.ef === "atk_down" || mv.ef === "atk_down2" || mv.ef === "def_down" || mv.ef === "def_down2" || mv.ef === "acc_down" || mv.ef === "spd_down" || mv.ef === "spd_down2" || mv.ef === "spdef_down" || mv.ef === "spa_down" || mv.ef === "spa_down2");
        // 특성: clearbody/whitesmoke → 능력치 하락 방지
        var defAbType = getAbility(defender) ? getAbility(defender).type : null;
        if (isStatDown && defAbType === "prevent_statdown") {
            bd.msg.push(dn + "의 " + getAbility(defender).n + "! 능력치가 떨어지지 않는다!");
        // 특성: keeneye → 명중률 하락 방지
        } else if (mv.ef === "acc_down" && getAbilityKey(defender) === "keeneye") {
            bd.msg.push(dn + "의 날카로운눈! 명중률이 떨어지지 않는다!");
        } else if (defender.guardSpec && defender.guardSpec > 0 && isStatDown) {
            bd.msg.push(dn + "은(는) 에펙트가드로 보호받고 있다!");
        } else if (mv.ef === "atk_down") {
            defender.statStages.atk = Math.max(-6, defender.statStages.atk - 1); bd.msg.push(dn + "의 공격이 떨어졌다!");
            if (getAbilityKey(defender) === "competitive") { defender.statStages.spatk = Math.min(6, defender.statStages.spatk + 2); bd.msg.push(dn + "의 승부근성! 특공이 크게 올라갔다!"); }
        }
        else if (mv.ef === "atk_down2") {
            defender.statStages.atk = Math.max(-6, defender.statStages.atk - 2); bd.msg.push(dn + "의 공격이 크게 떨어졌다!");
            if (getAbilityKey(defender) === "competitive") { defender.statStages.spatk = Math.min(6, defender.statStages.spatk + 2); bd.msg.push(dn + "의 승부근성! 특공이 크게 올라갔다!"); }
        }
        else if (mv.ef === "def_down") {
            defender.statStages.def = Math.max(-6, defender.statStages.def - 1); bd.msg.push(dn + "의 방어가 떨어졌다!");
            if (getAbilityKey(defender) === "competitive") { defender.statStages.spatk = Math.min(6, defender.statStages.spatk + 2); bd.msg.push(dn + "의 승부근성! 특공이 크게 올라갔다!"); }
        }
        else if (mv.ef === "acc_down") { defender.statStages.acc = Math.max(-6, defender.statStages.acc - 1); bd.msg.push(dn + "의 명중률이 떨어졌다!"); }
        else if (mv.ef === "spd_down") {
            defender.statStages.spd = Math.max(-6, defender.statStages.spd - 1); bd.msg.push(dn + "의 스피드가 떨어졌다!");
            if (getAbilityKey(defender) === "competitive") { defender.statStages.spatk = Math.min(6, defender.statStages.spatk + 2); bd.msg.push(dn + "의 승부근성! 특공이 크게 올라갔다!"); }
        }
        else if (mv.ef === "spdef_down") {
            defender.statStages.spdef = Math.max(-6, defender.statStages.spdef - 1); bd.msg.push(dn + "의 특방이 떨어졌다!");
            if (getAbilityKey(defender) === "competitive") { defender.statStages.spatk = Math.min(6, defender.statStages.spatk + 2); bd.msg.push(dn + "의 승부근성! 특공이 크게 올라갔다!"); }
        }
        else if (mv.ef === "def_down2") {
            defender.statStages.def = Math.max(-6, defender.statStages.def - 2); bd.msg.push(dn + "의 방어가 크게 떨어졌다!");
            if (getAbilityKey(defender) === "competitive") { defender.statStages.spatk = Math.min(6, defender.statStages.spatk + 2); bd.msg.push(dn + "의 승부근성! 특공이 크게 올라갔다!"); }
        }
        else if (mv.ef === "spd_down2") {
            defender.statStages.spd = Math.max(-6, defender.statStages.spd - 2); bd.msg.push(dn + "의 스피드가 크게 떨어졌다!");
            if (getAbilityKey(defender) === "competitive") { defender.statStages.spatk = Math.min(6, defender.statStages.spatk + 2); bd.msg.push(dn + "의 승부근성! 특공이 크게 올라갔다!"); }
        }
        else if (mv.ef === "spa_down") {
            defender.statStages.spatk = Math.max(-6, defender.statStages.spatk - 1); bd.msg.push(dn + "의 특공이 떨어졌다!");
        }
        else if (mv.ef === "spa_down2") {
            defender.statStages.spatk = Math.max(-6, defender.statStages.spatk - 2); bd.msg.push(dn + "의 특공이 크게 떨어졌다!");
        }
        else if (mv.ef === "atk_up") {
            var auS = (getAbilityKey(attacker) === "contrary") ? -1 : 1;
            attacker.statStages.atk = Math.max(-6, Math.min(6, attacker.statStages.atk + auS));
            bd.msg.push(an + "의 공격이 " + (auS > 0 ? "올라갔다!" : "떨어졌다!"));
        }
        else if (mv.ef === "def_up") {
            var duS = (getAbilityKey(attacker) === "contrary") ? -1 : 1;
            attacker.statStages.def = Math.max(-6, Math.min(6, attacker.statStages.def + duS));
            bd.msg.push(an + "의 방어가 " + (duS > 0 ? "올라갔다!" : "떨어졌다!"));
        }
        else if (mv.ef === "def_up2") {
            var du2S = (getAbilityKey(attacker) === "contrary") ? -2 : 2;
            attacker.statStages.def = Math.max(-6, Math.min(6, attacker.statStages.def + du2S));
            bd.msg.push(an + "의 방어가 " + (du2S > 0 ? "크게 올라갔다!" : "크게 떨어졌다!"));
        }
        else if (mv.ef === "spa_up") {
            var saS = (getAbilityKey(attacker) === "contrary") ? -1 : 1;
            attacker.statStages.spatk = Math.max(-6, Math.min(6, attacker.statStages.spatk + saS));
            bd.msg.push(an + "의 특공이 " + (saS > 0 ? "올라갔다!" : "떨어졌다!"));
        }
        else if (mv.ef === "spa_up2") {
            var sa2S = (getAbilityKey(attacker) === "contrary") ? -2 : 2;
            attacker.statStages.spatk = Math.max(-6, Math.min(6, attacker.statStages.spatk + sa2S));
            bd.msg.push(an + "의 특공이 " + (sa2S > 0 ? "크게 올라갔다!" : "크게 떨어졌다!"));
        }
        else if (mv.ef === "spd_up") {
            var sdS = (getAbilityKey(attacker) === "contrary") ? -1 : 1;
            attacker.statStages.spd = Math.max(-6, Math.min(6, attacker.statStages.spd + sdS));
            bd.msg.push(an + "의 스피드가 " + (sdS > 0 ? "올라갔다!" : "떨어졌다!"));
        }
        else if (mv.ef === "spd_up2") {
            var sd2S = (getAbilityKey(attacker) === "contrary") ? -2 : 2;
            attacker.statStages.spd = Math.max(-6, Math.min(6, attacker.statStages.spd + sd2S));
            bd.msg.push(an + "의 스피드가 " + (sd2S > 0 ? "크게 올라갔다!" : "크게 떨어졌다!"));
        }
        else if (mv.ef === "spdef_up") {
            var seS = (getAbilityKey(attacker) === "contrary") ? -1 : 1;
            attacker.statStages.spdef = Math.max(-6, Math.min(6, attacker.statStages.spdef + seS));
            bd.msg.push(an + "의 특방이 " + (seS > 0 ? "올라갔다!" : "떨어졌다!"));
        }
        else if (mv.ef === "spdef_up2") {
            var se2S = (getAbilityKey(attacker) === "contrary") ? -2 : 2;
            attacker.statStages.spdef = Math.max(-6, Math.min(6, attacker.statStages.spdef + se2S));
            bd.msg.push(an + "의 특방이 " + (se2S > 0 ? "크게 올라갔다!" : "크게 떨어졌다!"));
        }
        else if (mv.ef === "eva_up") {
            attacker.statStages.eva = Math.min(6, (attacker.statStages.eva || 0) + 1);
            bd.msg.push(an + "의 회피율이 올라갔다!");
        }
        else if (mv.ef === "swordsdance") {
            var sStages = (getAbilityKey(attacker) === "contrary") ? -2 : 2;
            attacker.statStages.atk = Math.max(-6, Math.min(6, attacker.statStages.atk + sStages));
            bd.msg.push(an + "의 공격이 " + (sStages > 0 ? "크게 올라갔다!" : "크게 떨어졌다!"));
        }
        else if (mv.ef === "calmmind") {
            var cmStages = (getAbilityKey(attacker) === "contrary") ? -1 : 1;
            attacker.statStages.spatk = Math.max(-6, Math.min(6, attacker.statStages.spatk + cmStages));
            attacker.statStages.spdef = Math.max(-6, Math.min(6, attacker.statStages.spdef + cmStages));
            bd.msg.push(an + "의 특공과 특방이 " + (cmStages > 0 ? "올라갔다!" : "떨어졌다!"));
        }
        else if (mv.ef === "bulkup") {
            var buS = (getAbilityKey(attacker) === "contrary") ? -1 : 1;
            attacker.statStages.atk = Math.max(-6, Math.min(6, attacker.statStages.atk + buS));
            attacker.statStages.def = Math.max(-6, Math.min(6, attacker.statStages.def + buS));
            bd.msg.push(an + "의 공격과 방어가 " + (buS > 0 ? "올라갔다!" : "떨어졌다!"));
        }
        else if (mv.ef === "dragondance") {
            var ddS = (getAbilityKey(attacker) === "contrary") ? -1 : 1;
            attacker.statStages.atk = Math.max(-6, Math.min(6, attacker.statStages.atk + ddS));
            attacker.statStages.spd = Math.max(-6, Math.min(6, attacker.statStages.spd + ddS));
            bd.msg.push(an + "의 공격과 스피드가 " + (ddS > 0 ? "올라갔다!" : "떨어졌다!"));
        }
        else if (mv.ef === "focusenergy") { attacker.critBoost = true; bd.msg.push(an + "은(는) 기합을 모으고 있다!"); }
        else if (mv.ef === "encore") { bd.msg.push(an + "은(는) 앙코르를 사용했다!"); }
        else if (mv.ef === "counter") {
            if (bd.lastPhysDmg && bd.lastPhysDmg > 0) {
                var cDmg = bd.lastPhysDmg * 2;
                defender.currentHp = Math.max(0, defender.currentHp - cDmg);
                bd.msg.push(an + "의 카운터! " + cDmg + " 데미지! (" + defender.nickname + " " + Math.max(0, defender.currentHp) + "/" + defender.stats[0] + ")");
            } else { bd.msg.push("그러나 실패했다!"); }
        }
        else if (mv.ef === "mirrorcoat") {
            if (bd.lastSpecDmg && bd.lastSpecDmg > 0) {
                var mcDmg = bd.lastSpecDmg * 2;
                defender.currentHp = Math.max(0, defender.currentHp - mcDmg);
                bd.msg.push(an + "의 미러코트! " + mcDmg + " 데미지! (" + defender.nickname + " " + Math.max(0, defender.currentHp) + "/" + defender.stats[0] + ")");
            } else { bd.msg.push("그러나 실패했다!"); }
        }
        else if (mv.ef === "heal" || mv.ef === "rest") {
            var healAmt = Math.floor(attacker.stats[0] / 2);
            if (mv.ef === "rest") { healAmt = attacker.stats[0]; attacker.status = "sleep"; attacker.statusTurns = 2; }
            attacker.currentHp = Math.min(attacker.stats[0], attacker.currentHp + healAmt);
            bd.msg.push(an + "의 HP가 회복되었다!");
        }
    }
}

function canAct(poke, bd) {
    if (poke.currentHp <= 0) return false;
    if (poke.status === "sleep") {
        if (getAbilityKey(poke) === "earlybird") poke.statusTurns -= 2;
        else poke.statusTurns--;
        if (poke.statusTurns <= 0) { poke.status = null; bd.msg.push(poke.nickname + "은(는) 눈을 떴다!"); return true; }
        bd.msg.push(poke.nickname + "은(는) 깊이 잠들어 있다..."); return false;
    }
    if (poke.status === "freeze") {
        if (Math.random() < 0.2) { poke.status = null; bd.msg.push(poke.nickname + "의 얼음이 풀렸다!"); return true; }
        bd.msg.push(poke.nickname + "은(는) 얼어서 움직일 수 없다!"); return false;
    }
    if (poke.status === "paralyze") {
        if (Math.random() < 0.25) { bd.msg.push(poke.nickname + "은(는) 마비되어 움직일 수 없다!"); return false; }
    }
    if (poke.status === "confuse") {
        poke.statusTurns--;
        if (poke.statusTurns <= 0) { poke.status = null; bd.msg.push(poke.nickname + "의 혼란이 풀렸다!"); }
        else {
            bd.msg.push(poke.nickname + "은(는) 혼란 중이다!");
            if (Math.random() < 0.33) {
                var selfDmg = Math.max(1, Math.floor(poke.stats[1] * 0.1));
                poke.currentHp = Math.max(0, poke.currentHp - selfDmg);
                bd.msg.push("혼란 속에 스스로를 공격했다! " + selfDmg + " 데미지! (" + poke.nickname + " " + Math.max(0, poke.currentHp) + "/" + poke.stats[0] + ")");
                return false;
            }
        }
    }
    if (poke._flinched) { poke._flinched = false; bd.msg.push(poke.nickname + "은(는) 풀이 죽어서 기술을 쓸 수 없었다!"); return false; }
    return true;
}

function doStatusDamage(poke, bd) {
    if (poke.currentHp <= 0) return;
    // 특성: magicguard → 기술 외 데미지 없음
    var abKey = getAbilityKey(poke);
    if (poke.status === "burn" && abKey !== "magicguard") {
        var dmg = Math.max(1, Math.floor(poke.stats[0] / 16));
        poke.currentHp = Math.max(0, poke.currentHp - dmg);
        bd.msg.push(poke.nickname + "은(는) 화상 데미지를 받았다! (-" + dmg + ")");
    }
    if (poke.status === "poison" && abKey !== "magicguard") {
        var dmg = Math.max(1, Math.floor(poke.stats[0] / 8));
        poke.currentHp = Math.max(0, poke.currentHp - dmg);
        bd.msg.push(poke.nickname + "은(는) 독 데미지를 받았다! (-" + dmg + ")");
    }
    if (poke.guardSpec && poke.guardSpec > 0) poke.guardSpec--;
    // 특성: speedboost → 매 턴 스피드 +1
    if (abKey === "speedboost" && poke.currentHp > 0) {
        poke.statStages.spd = Math.min(6, poke.statStages.spd + 1);
        bd.msg.push(poke.nickname + "의 가속! 스피드가 올라갔다!");
    }
    // 특성: shedskin → 1/3 확률 상태회복
    if (abKey === "shedskin" && poke.status && Math.random() < 1/3) {
        bd.msg.push(poke.nickname + "의 탈피! 상태이상이 회복되었다!");
        poke.status = null; poke.statusTurns = 0;
    }
    // 특성: harvest → 50% 확률 열매 재생
    if (abKey === "harvest" && !poke.heldItem && poke._lastBerry && Math.random() < 0.5) {
        poke.heldItem = poke._lastBerry;
        bd.msg.push(poke.nickname + "의 수확! " + (ITEMS[poke._lastBerry] ? ITEMS[poke._lastBerry].n : "열매") + "이(가) 되살아났다!");
    }
}

function executeAttack(attacker, defender, moveKey, bd) {
    var mv = MOVES[moveKey];
    if (!mv) return;
    var an = attacker.nickname;
    var dn = defender.nickname;
    bd.msg.push(an + "의 " + mv.n + "!");
    // 특성: protean → 기술 사용 전 타입 변환
    if (getAbilityKey(attacker) === "protean" && MOVES[moveKey]) {
        var newType = MOVES[moveKey].t;
        attacker.megaTypes = [newType];
        bd.msg.push(an + "의 변환자재! " + an + "의 타입이 변했다!");
    }
    // 명중률 체크
    if (mv.a > 0 && mv.a < 100) {
        var accMult = getStatMult(attacker.statStages.acc) / getStatMult(defender.statStages.eva);
        // 특성: compoundeyes → 명중률 1.3배
        if (getAbilityKey(attacker) === "compoundeyes") accMult *= 1.3;
        // 특성: noguard → 반드시 명중
        if (getAbilityKey(attacker) === "noguard" || getAbilityKey(defender) === "noguard") accMult = 999;
        if (Math.random() * 100 > mv.a * accMult) { bd.msg.push("그러나 빗나갔다!"); return; }
    }
    if (mv.c !== "status" && mv.p > 0) {
        var result = calcDamage(attacker, defender, moveKey);
        // 특성: 타입 흡수
        if (result.absorbed) {
            var absAb = ABILITIES[result.absorbed];
            bd.msg.push(dn + "의 " + (absAb?absAb.n:result.absorbed) + "!");
            if (result.absorbed === "waterabsorb" || result.absorbed === "voltabsorb") {
                var aheal = Math.max(1, Math.floor(defender.stats[0] / 4));
                defender.currentHp = Math.min(defender.stats[0], defender.currentHp + aheal);
                bd.msg.push(dn + "은(는) HP를 회복했다! (+" + aheal + ")");
            } else if (result.absorbed === "flashfire") {
                bd.msg.push(dn + "의 불꽃 기술 위력이 올라갔다!");
            } else if (result.absorbed === "lightningrod") {
                defender.statStages.spatk = Math.min(6, defender.statStages.spatk + 1);
                bd.msg.push(dn + "의 특수공격이 올라갔다!");
            } else if (result.absorbed === "motordrive") {
                defender.statStages.spd = Math.min(6, defender.statStages.spd + 1);
                bd.msg.push(dn + "의 스피드가 올라갔다!");
            } else if (result.absorbed === "sapsipper") {
                defender.statStages.atk = Math.min(6, defender.statStages.atk + 1);
                bd.msg.push(dn + "의 공격이 올라갔다!");
            } else {
                bd.msg.push("효과가 없는 것 같다...");
            }
            for (var i = 0; i < attacker.moves.length; i++) {
                if (attacker.moves[i].key === moveKey) { attacker.moves[i].ppLeft = Math.max(0, attacker.moves[i].ppLeft - 1); break; }
            }
            return;
        }
        if (result.blocked) {
            var blkAb = ABILITIES[result.blocked];
            bd.msg.push(dn + "의 " + (blkAb?blkAb.n:result.blocked) + "! 효과가 없는 것 같다...");
            for (var i = 0; i < attacker.moves.length; i++) {
                if (attacker.moves[i].key === moveKey) { attacker.moves[i].ppLeft = Math.max(0, attacker.moves[i].ppLeft - 1); break; }
            }
            return;
        }
        // 특성: dryskin → 물 기술 흡수 회복
        if (result.dryskin) {
            var dryskinHeal = Math.max(1, Math.floor(defender.stats[0] / 4));
            defender.currentHp = Math.min(defender.stats[0], defender.currentHp + dryskinHeal);
            bd.msg.push(dn + "의 건조피부! HP가 회복됐다!");
            return;
        }
        // 특성: bulletproof → 구/탄 기술 무효
        if (result.bulletproof) {
            bd.msg.push(dn + "의 방탄! 기술이 통하지 않았다!");
            return;
        }
        defender.currentHp = Math.max(0, defender.currentHp - result.dmg);
        var effMsg = "";
        if (result.eff >= 2) effMsg = " 효과가 굉장했다!";
        else if (result.eff > 1 && result.eff < 2) effMsg = " 효과가 좋았다!";
        else if (result.eff < 1 && result.eff > 0) effMsg = " 효과가 별로였다...";
        else if (result.eff === 0) effMsg = " 효과가 없는 것 같다...";
        var critMsg = result.crit ? " 급소에 맞았다!" : "";
        bd.msg.push(result.dmg + " 데미지! (" + defender.nickname + " " + Math.max(0, defender.currentHp) + "/" + defender.stats[0] + ")" + critMsg + effMsg);
        checkBerryAfterDamage(defender, bd);
        if (mv.ef === "drain") {
            var heal = Math.max(1, Math.floor(result.dmg / 2));
            attacker.currentHp = Math.min(attacker.stats[0], attacker.currentHp + heal);
            bd.msg.push(an + "은(는) " + heal + " HP를 흡수했다!");
        }
        if (mv.ef === "recoil") {
            // 특성: rockhead → 반동 데미지 없음
            if (getAbilityKey(attacker) !== "rockhead") {
                var recoil = Math.max(1, Math.floor(result.dmg / 3));
                attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
                bd.msg.push(an + "은(는) 반동으로 " + recoil + " 데미지를 받았다!");
                checkBerryAfterDamage(attacker, bd);
            }
        }
        if (mv.ef === "selfdestruct") {
            attacker.currentHp = 0;
            bd.msg.push(an + "은(는) 쓰러졌다!");
        }
        // 특성: 접촉 반사 (roughskin/ironbarbs)
        if (mv.c === "physical" && result.dmg > 0 && defender.currentHp > 0) {
            var defAbKey = getAbilityKey(defender);
            if (defAbKey === "roughskin" || defAbKey === "ironbarbs") {
                var rsDmg = Math.max(1, Math.floor(attacker.stats[0] / 8));
                attacker.currentHp = Math.max(0, attacker.currentHp - rsDmg);
                bd.msg.push(dn + "의 " + ABILITIES[defAbKey].n + "! " + an + "에게 " + rsDmg + " 데미지!");
            }
            // 특성: 접촉 상태이상 (staticbody/poisonpoint/flamebody)
            var defAb = getAbility(defender);
            if (defAb && defAb.type === "contact_status" && !attacker.status && attacker.currentHp > 0) {
                if (Math.random() * 100 < defAb.chance) {
                    var atkAbDef = getAbility(attacker);
                    var immune = false;
                    if (atkAbDef && atkAbDef.type === "statusimmune" && atkAbDef.immune === defAb.status) immune = true;
                    if (!immune) {
                        attacker.status = defAb.status;
                        attacker.statusTurns = 0;
                        bd.msg.push(dn + "의 " + defAb.n + "! " + an + "은(는) " + statusName(attacker.status) + " 상태가 되었다!");
                    }
                }
            }
            // 특성: stench → 접촉 시 10% 풀죽음
            if (getAbilityKey(attacker) === "stench" && !defender._flinched && Math.random() < 0.1) {
                defender._flinched = true;
            }
        }
        // 특성: moxie → 쓰러뜨리면 공격+1
        if (defender.currentHp <= 0 && getAbilityKey(attacker) === "moxie") {
            attacker.statStages.atk = Math.min(6, attacker.statStages.atk + 1);
            bd.msg.push(an + "의 자신감! 공격이 올라갔다!");
        }
        // 특성: justified → 악 기술에 맞으면 공격+1
        if (result.dmg > 0 && mv.t === "dark" && getAbilityKey(defender) === "justified" && defender.currentHp > 0) {
            defender.statStages.atk = Math.min(6, defender.statStages.atk + 1);
            bd.msg.push(dn + "의 정의의마음! 공격이 올라갔다!");
        }
    }
    // PP 감소
    for (var i = 0; i < attacker.moves.length; i++) {
        if (attacker.moves[i].key === moveKey) { attacker.moves[i].ppLeft = Math.max(0, attacker.moves[i].ppLeft - 1); break; }
    }
    // 특성: pressure → PP 추가 소모
    if (getAbilityKey(defender) === "pressure") {
        for (var i = 0; i < attacker.moves.length; i++) {
            if (attacker.moves[i].key === moveKey) { attacker.moves[i].ppLeft = Math.max(0, attacker.moves[i].ppLeft - 1); break; }
        }
    }
    applyMoveEffects(moveKey, attacker, defender, bd);
}

function enemyChooseMove(enemy) {
    var bestMove = null; var bestScore = -1;
    for (var i = 0; i < enemy.moves.length; i++) {
        if (enemy.moves[i].ppLeft <= 0) continue;
        var mv = MOVES[enemy.moves[i].key];
        if (!mv) continue;
        var score = mv.p || 0;
        if (mv.c === "status") score = 20;
        if (Math.random() < 0.3) score += 30;
        if (score > bestScore) { bestScore = score; bestMove = enemy.moves[i].key; }
    }
    return bestMove || "tackle";
}

function executeTurn(playerMoveKey) {
    if (!gState || !gState.battleData) return;
    var bd = gState.battleData;
    var myPoke = player.party[bd.myIdx];
    var enemy = bd.enemy;
    rotateBattleMsg(bd);
    bd.msg = [];
    bd.turn++;
    var mySpd = myPoke.stats[5] * getStatMult(myPoke.statStages.spd);
    var enSpd = enemy.stats[5] * getStatMult(enemy.statStages.spd);
    if (myPoke.status === "paralyze") mySpd *= 0.5;
    if (enemy.status === "paralyze") enSpd *= 0.5;
    // 특성: unburden → 아이템 소비 후 스피드 2배
    if (myPoke._unburden) mySpd *= 2;
    if (enemy._unburden) enSpd *= 2;
    var playerMove = MOVES[playerMoveKey];
    var enemyMoveKey = enemyChooseMove(enemy);
    var enemyMove = MOVES[enemyMoveKey];
    var pPri = (playerMove && playerMove.priority) ? playerMove.priority : 0;
    var ePri = (enemyMove && enemyMove.priority) ? enemyMove.priority : 0;
    // 특성: prankster → 변화기술 우선도+1
    if (getAbilityKey(myPoke) === "prankster" && playerMove && playerMove.c === "status") pPri += 1;
    if (getAbilityKey(enemy) === "prankster" && enemyMove && enemyMove.c === "status") ePri += 1;
    // 특성: galewings → HP만땅 시 비행 기술 우선도+1
    if (getAbilityKey(myPoke) === "galewings" && myPoke.currentHp >= myPoke.stats[0] && playerMove && playerMove.t === "flying") pPri += 1;
    if (getAbilityKey(enemy) === "galewings" && enemy.currentHp >= enemy.stats[0] && enemyMove && enemyMove.t === "flying") ePri += 1;
    var playerFirst = (pPri > ePri) || (pPri === ePri && mySpd >= enSpd);
    if (pPri === ePri && mySpd === enSpd) playerFirst = Math.random() < 0.5;
    var first, second, firstMove, secondMove;
    if (playerFirst) {
        first = myPoke; second = enemy; firstMove = playerMoveKey; secondMove = enemyMoveKey;
    } else {
        first = enemy; second = myPoke; firstMove = enemyMoveKey; secondMove = playerMoveKey;
    }
    if (canAct(first, bd)) executeAttack(first, second, firstMove, bd);
    doStatusDamage(first, bd);
    if (second.currentHp > 0 && first.currentHp > 0) {
        if (canAct(second, bd)) executeAttack(second, first, secondMove, bd);
        doStatusDamage(second, bd);
    }
    // 적 쓰러짐
    if (enemy.currentHp <= 0) {
        if (bd.type === "trainer" && bd.enemyParty) {
            bd.enemyIdx++;
            if (bd.enemyIdx < bd.enemyParty.length) {
                bd.enemy = bd.enemyParty[bd.enemyIdx];
                bd.msg.push(bd.trainerName + "은(는) " + bd.enemy.nickname + " (Lv." + bd.enemy.level + ")을(를) 내보냈다!");
                grantExp(myPoke, enemy, false);
                // 도감 등록
                if (player.pokedex) { if (!player.pokedex[bd.enemy.key]) player.pokedex[bd.enemy.key] = "seen"; }
            } else {
                bd.won = true;
                bd.msg.push(bd.trainerName + "에게 승리했다!");
                grantExp(myPoke, enemy, true);
            }
        } else {
            bd.won = true;
            bd.msg.push("야생 " + enemy.nickname + "을(를) 쓰러뜨렸다!");
            grantExp(myPoke, enemy, false);
        }
    }
    // 내 포켓몬 쓰러짐
    if (myPoke.currentHp <= 0) {
        bd.msg.push(myPoke.nickname + "이(가) 쓰러졌다!");
        var alive = false;
        for (var i = 0; i < player.party.length; i++) {
            if (player.party[i].currentHp > 0) { alive = true; break; }
        }
        if (!alive) { bd.lost = true; bd.msg.push("눈앞이 깜깜해졌다..."); }
    }
    for (var i = 0; i < bd.msg.length; i++) addLog(bd.msg[i], "battle");
}

// 경험치 지급 (isTrainerWin: 트레이너 최종승리시에만 돈 선택권 부여)
function grantExp(myPoke, enemy, isTrainerWin) {
    var enemyData = POKEDEX[enemy.key];
    if (!enemyData) return;
    var bd = gState.battleData;
    var isRematch = (bd && bd.isRematch);
    var trainerBonus = (bd && bd.type === "trainer" && !isRematch) ? 1.5 : 1;
    var baseExp = Math.floor((enemyData.xp * enemy.level * trainerBonus) / 7);
    if (baseExp < 1) baseExp = 1;
    if (player.bag.luckyegg && player.bag.luckyegg > 0) baseExp = Math.floor(baseExp * 1.5);
    // 참가자 기반 경험치 분배
    var participants = (bd && bd.battleParticipants) ? bd.battleParticipants : [bd.myIdx];
    var aliveParticipants = [];
    for (var pi = 0; pi < participants.length; pi++) {
        var pp = player.party[participants[pi]];
        if (pp && pp.currentHp > 0) aliveParticipants.push(participants[pi]);
    }
    if (aliveParticipants.length === 0) aliveParticipants = [bd.myIdx];
    var expEach = Math.max(1, Math.floor(baseExp / aliveParticipants.length));
    for (var api = 0; api < aliveParticipants.length; api++) {
        var poke = player.party[aliveParticipants[api]];
        if (!poke || poke.currentHp <= 0) continue;
        poke.exp += expEach;
        bd.msg.push(poke.nickname + "은(는) " + expEach + " 경험치를 얻었다!");
        addLog(poke.nickname + "은(는) " + expEach + " 경험치를 얻었다!", "exp");
        while (poke.level < MAX_LEVEL) {
            var needed = getExpForLevel(poke.level + 1) - getExpForLevel(poke.level);
            if (poke.exp >= needed) {
                poke.exp -= needed;
                poke.level++;
                recalcStats(poke);
                bd.msg.push("🎉 " + poke.nickname + "은(는) Lv." + poke.level + "이(가) 되었다!");
                addLog("🎉 " + poke.nickname + " Lv." + poke.level + "!", "levelup");
                checkNewMoves(poke);
                checkEvolution(poke);
            } else break;
        }
    }
    // 트레이너/관장 최종 승리 시 보상금
    if (isTrainerWin && bd.type === "trainer") {
        var baseReward = bd.trainerReward || 500;
        var reward = isRematch ? Math.floor(baseReward * 0.2) : baseReward;
        if (player.bag.amuletcoin && player.bag.amuletcoin > 0 && !isRematch) reward = reward * 2;
        bd.pendingReward = reward;
        bd.msg.push("💰 상금 ₩" + reward + (isRematch ? " (재대결 20%)" : "") + "을 받을 수 있다!");
        if (bd.isGymBattle) {
            player.defeatedGyms[bd.trainerKey] = player.day;
        } else if (bd.isGymTrainer) {
            player.defeatedGyms[bd.trainerKey] = true;
        } else {
            player.defeatedTrainers[bd.trainerKey] = player.day;
        }
        if (bd.isGymBattle && bd.gymId && bd.gymRegion) {
            var badgeList = player.badges[bd.gymRegion];
            if (badgeList && badgeList.indexOf(bd.gymId) === -1) {
                badgeList.push(bd.gymId);
                bd.msg.push("🏅 " + bd.gymBadgeEm + " " + bd.gymBadge + "을(를) 획득했다!");
                addLog("🏅 " + bd.gymBadge + " 획득!", "badge");
                checkKeyItemReward(bd);
            }
        }
    }
    // 학습장치 (참가하지 않은 파티원에게)
    if (player.bag.expshare && player.bag.expshare > 0) {
        var shareExp = Math.floor(baseExp / 2);
        if (shareExp < 1) shareExp = 1;
        for (var si = 0; si < player.party.length; si++) {
            var isParticipant = false;
            for (var chk = 0; chk < aliveParticipants.length; chk++) {
                if (aliveParticipants[chk] === si) { isParticipant = true; break; }
            }
            if (isParticipant) continue;
            if (player.party[si].currentHp <= 0) continue;
            player.party[si].exp += shareExp;
            while (player.party[si].level < MAX_LEVEL) {
                var sNeeded = getExpForLevel(player.party[si].level + 1) - getExpForLevel(player.party[si].level);
                if (player.party[si].exp >= sNeeded) {
                    player.party[si].exp -= sNeeded;
                    player.party[si].level++;
                    recalcStats(player.party[si]);
                    bd.msg.push("🎉 " + player.party[si].nickname + "은(는) Lv." + player.party[si].level + "이(가) 되었다!");
                    addLog("🎉 " + player.party[si].nickname + " Lv." + player.party[si].level + "!", "levelup");
                    checkNewMoves(player.party[si]);
                    checkEvolution(player.party[si]);
                } else break;
            }
        }
    }
}

function checkKeyItemReward(bd) {
    var total = 0;
    var regions = ["kanto","johto","hoenn","sinnoh","unova","kalos"];
    for (var r = 0; r < regions.length; r++) {
        total += (player.badges[regions[r]] ? player.badges[regions[r]].length : 0);
    }
    var rewards = [
        {count:1, item:"oldrod"},
        {count:2, item:"amuletcoin"},
        {count:3, item:"expshare"},
        {count:4, item:"goodrod"},
        {count:5, item:"luckyegg"},
        {count:7, item:"superrod"}
    ];
    for (var i = 0; i < rewards.length; i++) {
        if (total >= rewards[i].count && !player.bag[rewards[i].item]) {
            player.bag[rewards[i].item] = 1;
            bd.msg.push("🔑 " + ITEMS[rewards[i].item].n + "을(를) 받았다!");
            addLog("🔑 " + ITEMS[rewards[i].item].n + " 획득!", "reward");
        }
    }
}

function checkNewMoves(poke) {
    var data = POKEDEX[poke.key];
    if (!data || !data.ml) return;
    var movesAtLevel = data.ml[poke.level];
    if (!movesAtLevel) return;
    for (var i = 0; i < movesAtLevel.length; i++) {
        var mk = movesAtLevel[i];
        var knows = false;
        for (var j = 0; j < poke.moves.length; j++) {
            if (poke.moves[j].key === mk) { knows = true; break; }
        }
        if (knows) continue;
        var mv = MOVES[mk];
        if (!mv) continue;
        if (poke.moves.length < 4) {
            poke.moves.push({key: mk, ppLeft: mv.pp});
            addLog(poke.nickname + "은(는) " + mv.n + "을(를) 배웠다!", "learn");
            if (gState.battleData) gState.battleData.msg.push(poke.nickname + "은(는) " + mv.n + "을(를) 배웠다!");
        } else {
            gState.pendingMoveLearn = {pokeIdx: findPartyIdx(poke), moveKey: mk};
        }
    }
}

function findPartyIdx(poke) {
    for (var i = 0; i < player.party.length; i++) { if (player.party[i] === poke) return i; }
    return 0;
}

function checkEvolution(poke) {
    var data = POKEDEX[poke.key];
    if (!data || !data.e) return;
    if (poke.level >= data.e.l) {
        poke.canEvolve = true;
        if (gState.battleData) gState.battleData.msg.push("💡 " + poke.nickname + "은(는) 진화할 수 있게 되었다!");
        addLog("💡 " + poke.nickname + "은(는) 진화할 수 있게 되었다!", "evolution");
    }
}

function doEvolution() {
    if (!gState.pendingEvo) return;
    var evo = gState.pendingEvo;
    var poke = player.party[evo.pokeIdx];
    if (!poke) { gState.pendingEvo = null; return; }
    var newData = POKEDEX[evo.to];
    if (!newData) { gState.pendingEvo = null; return; }
    var oldName = poke.nickname;
    poke.key = evo.to;
    poke.nickname = newData.n;
    recalcStats(poke);
    addLog("🌟 " + oldName + "이(가) " + newData.n + "(으)로 진화했다!", "evolution");
    if (player.pokedex) player.pokedex[evo.to] = "caught";
    poke.canEvolve = false;
    gState.pendingEvo = null;
    checkNewMoves(poke);
}

function attemptCapture(ballKey) {
    if (!gState || !gState.battleData || gState.battleData.type !== "wild") return;
    var bd = gState.battleData;
    var enemy = bd.enemy;
    var ball = ITEMS[ballKey];
    if (!ball || ball.type !== "ball") return;
    rotateBattleMsg(bd);
    bd.msg = [];
    player.bag[ballKey] = (player.bag[ballKey] || 0) - 1;
    if (player.bag[ballKey] <= 0) delete player.bag[ballKey];
    var data = POKEDEX[enemy.key];
    if (!data) return;
    bd.msg.push(ball.n + "을(를) 던졌다!");
    if (ball.value >= 255) {
        bd.msg.push("잡았다! " + enemy.nickname + "을(를) 잡았다!");
        bd.caught = true;
        addCapturedPokemon(enemy);
        grantExp(player.party[bd.myIdx], enemy, false);
        for (var i = 0; i < bd.msg.length; i++) addLog(bd.msg[i], "capture");
        return;
    }
    var maxHp = enemy.stats[0]; var curHp = enemy.currentHp;
    var catchRate = data.cr; var ballBonus = ball.value;
    // 특수볼 보정
    if (ballKey === "nestball") { ballBonus = Math.max(1, (41 - enemy.level) / 10); }
    else if (ballKey === "timerball") { ballBonus = Math.min(4, 1 + (bd.turn || 0) * 0.3); }
    else if (ballKey === "duskball" && player.timeOfDay === 4) { ballBonus = 3.5; }
    else if (ballKey === "quickball" && (!bd.turn || bd.turn <= 1)) { ballBonus = 5; }
    else if (ballKey === "repeatball" && player.pokedex && player.pokedex[enemy.key]) { ballBonus = 3.5; }
    else if (ballKey === "netball") { var et = POKEDEX[enemy.key] ? POKEDEX[enemy.key].t : []; if (et.indexOf("water") >= 0 || et.indexOf("bug") >= 0) ballBonus = 3; else ballBonus = 1; }
    var statusBonus = 1;
    if (enemy.status === "sleep" || enemy.status === "freeze") statusBonus = 2;
    else if (enemy.status === "paralyze" || enemy.status === "burn" || enemy.status === "poison") statusBonus = 1.5;
    var a = ((3 * maxHp - 2 * curHp) * catchRate * ballBonus) / (3 * maxHp) * statusBonus;
    a = Math.min(255, a);
    var b = 1048560 / Math.sqrt(Math.sqrt(16711680 / a));
    var shakes = 0;
    for (var i = 0; i < 4; i++) { if (Math.random() * 65536 < b) shakes++; else break; }
    if (shakes >= 4) {
        bd.msg.push("잡았다! " + enemy.nickname + "을(를) 잡았다!");
        bd.caught = true;
        addCapturedPokemon(enemy);
        grantExp(player.party[bd.myIdx], enemy, false);
    } else {
        var shakeMsg = ["앗! 빠져나왔다!", "아쉽다! 조금만 더!", "흔들 흔들... 탈출!", "거의 다 잡았는데...!"];
        bd.msg.push(shakeMsg[Math.min(shakes, shakeMsg.length - 1)]);
        if (enemy.currentHp > 0) {
            var emk = enemyChooseMove(enemy);
            var myPoke = player.party[bd.myIdx];
            if (canAct(enemy, bd)) executeAttack(enemy, myPoke, emk, bd);
            doStatusDamage(enemy, bd);
            if (myPoke.currentHp <= 0) {
                bd.msg.push(myPoke.nickname + "이(가) 쓰러졌다!");
                var alive = false;
                for (var i = 0; i < player.party.length; i++) { if (player.party[i].currentHp > 0) { alive = true; break; } }
                if (!alive) { bd.lost = true; bd.msg.push("눈앞이 깜깜해졌다..."); }
            }
        }
    }
    for (var i = 0; i < bd.msg.length; i++) addLog(bd.msg[i], "capture");
}

function addCapturedPokemon(poke) {
    poke.statStages = {atk:0,def:0,spatk:0,spdef:0,spd:0,acc:0,eva:0};
    poke.status = null; poke.statusTurns = 0;
    if (player.pokedex) player.pokedex[poke.key] = "caught";
    // 전설/환상 포켓몬 잡으면 기록
    if (gState.battleData && gState.battleData.isLegendary) {
        player.caughtLegendaries[poke.key] = true;
        // 로밍 포켓몬이면 로밍 목록에서 제거
        if (player.roamingLocation && player.roamingLocation.pokemon) {
            var idx = player.roamingLocation.pokemon.indexOf(poke.key);
            if (idx !== -1) player.roamingLocation.pokemon.splice(idx, 1);
        }
    }
    if (player.party.length < MAX_PARTY) {
        player.party.push(poke);
    } else {
        player.pc.push(poke);
        addLog(poke.nickname + "은(는) PC로 보내졌다!", "info");
    }
}

function tryRun() {
    if (!gState || !gState.battleData) return;
    var bd = gState.battleData;
    if (bd.type === "trainer") {
        rotateBattleMsg(bd);
        bd.msg = ["트레이너전에서는 도망칠 수 없다!"];
        for (var i = 0; i < bd.msg.length; i++) addLog(bd.msg[i], "battle");
        return;
    }
    rotateBattleMsg(bd);
    bd.msg = [];
    var myPoke = player.party[bd.myIdx];
    var mySpd = myPoke.stats[5]; var enSpd = bd.enemy.stats[5];
    // 특성: runaway → 야생전에서 반드시 도주
    if (getAbilityKey(myPoke) === "runaway") {
        bd.msg.push(myPoke.nickname + "의 도주! 무사히 도망쳤다!"); bd.fled = true;
        for (var i = 0; i < bd.msg.length; i++) addLog(bd.msg[i], "battle");
        return;
    }
    // 특성: shadowtag/arenatrap → 상대가 도주 불가
    var enAb = getAbility(bd.enemy);
    if (enAb && enAb.type === "notrap") {
        bd.msg.push("상대의 " + enAb.n + "! 도망칠 수 없다!");
        var emk = enemyChooseMove(bd.enemy);
        if (canAct(bd.enemy, bd)) executeAttack(bd.enemy, myPoke, emk, bd);
        doStatusDamage(bd.enemy, bd);
        if (myPoke.currentHp <= 0) {
            bd.msg.push(myPoke.nickname + "이(가) 쓰러졌다!");
            var alive = false;
            for (var i = 0; i < player.party.length; i++) { if (player.party[i].currentHp > 0) { alive = true; break; } }
            if (!alive) { bd.lost = true; bd.msg.push("눈앞이 깜깜해졌다..."); }
        }
        for (var i = 0; i < bd.msg.length; i++) addLog(bd.msg[i], "battle");
        return;
    }
    var chance = ((mySpd * 128) / enSpd + 30) / 256;
    if (Math.random() < Math.max(0.2, Math.min(0.95, chance))) {
        bd.msg.push("무사히 도망쳤다!"); bd.fled = true;
    } else {
        bd.msg.push("도망칠 수 없었다!");
        var emk = enemyChooseMove(bd.enemy);
        if (canAct(bd.enemy, bd)) executeAttack(bd.enemy, myPoke, emk, bd);
        doStatusDamage(bd.enemy, bd);
        if (myPoke.currentHp <= 0) {
            bd.msg.push(myPoke.nickname + "이(가) 쓰러졌다!");
            var alive = false;
            for (var i = 0; i < player.party.length; i++) { if (player.party[i].currentHp > 0) { alive = true; break; } }
            if (!alive) { bd.lost = true; bd.msg.push("눈앞이 깜깜해졌다..."); }
        }
    }
    for (var i = 0; i < bd.msg.length; i++) addLog(bd.msg[i], "battle");
}

function healAllPokemon(locName) {
    for (var i = 0; i < player.party.length; i++) {
        var p = player.party[i];
        p.currentHp = p.stats[0]; p.status = null; p.statusTurns = 0;
        p.statStages = {atk:0,def:0,spatk:0,spdef:0,spd:0,acc:0,eva:0};
        for (var j = 0; j < p.moves.length; j++) {
            var mv = MOVES[p.moves[j].key];
            p.moves[j].ppLeft = mv ? mv.pp : 10;
        }
    }
    if (locName) {
        addLog("🏥 " + locName + " 포켓몬센터에서 휴식했다! 모든 포켓몬이 회복되었다!", "heal");
    } else {
        addLog("🏥 포켓몬센터에서 휴식했다! 모든 포켓몬이 회복되었다!", "heal");
    }
}

function useItem(itemKey, partyIdx) {
    var item = ITEMS[itemKey];
    if (!item) return false;
    if (!player.bag[itemKey] || player.bag[itemKey] <= 0) return false;
    var poke = player.party[partyIdx];
    if (!poke) return false;
    if (item.type === "heal") {
        if (poke.currentHp <= 0 || poke.currentHp >= poke.stats[0]) return false;
        poke.currentHp = Math.min(poke.stats[0], poke.currentHp + item.value);
        player.bag[itemKey]--; if (player.bag[itemKey] <= 0) delete player.bag[itemKey];
        addLog(poke.nickname + "에게 " + item.n + " 사용! HP +" + item.value, "item");
        return true;
    }
    if (item.type === "fullheal") {
        if (poke.currentHp <= 0) return false;
        poke.currentHp = poke.stats[0]; poke.status = null; poke.statusTurns = 0;
        player.bag[itemKey]--; if (player.bag[itemKey] <= 0) delete player.bag[itemKey];
        addLog(poke.nickname + "이(가) 완전히 회복되었다!", "item");
        return true;
    }
    if (item.type === "revive") {
        if (poke.currentHp > 0) return false;
        poke.currentHp = Math.floor(poke.stats[0] * item.value);
        poke.status = null; poke.statusTurns = 0;
        player.bag[itemKey]--; if (player.bag[itemKey] <= 0) delete player.bag[itemKey];
        addLog(poke.nickname + "이(가) 부활했다!", "item");
        return true;
    }
    if (item.type === "cure") {
        if (!poke.status) return false;
        if (item.value !== "all" && poke.status !== item.value) return false;
        poke.status = null; poke.statusTurns = 0;
        player.bag[itemKey]--; if (player.bag[itemKey] <= 0) delete player.bag[itemKey];
        addLog(poke.nickname + "의 상태이상이 회복되었다!", "item");
        return true;
    }
    if (item.type === "battle") {
        if (!gState.battleData) return false;
        var bd = gState.battleData;
        var activePoke = player.party[bd.myIdx];
        if (!activePoke || activePoke.currentHp <= 0) return false;
        if (item.value === "crit") {
            activePoke.critBoost = true;
            addLog(activePoke.nickname + "의 급소율이 올라갔다!", "item");
        } else if (item.value === "guard") {
            activePoke.guardSpec = 5;
            addLog(activePoke.nickname + "에게 능력저하 방지가 적용되었다!", "item");
        } else {
            var stage = item.value;
            if (activePoke.statStages[stage] !== undefined) {
                activePoke.statStages[stage] = Math.min(6, activePoke.statStages[stage] + 1);
                var statNames = {atk:"공격",def:"방어",spd:"스피드",spatk:"특수공격",spdef:"특수방어",acc:"명중률"};
                addLog(activePoke.nickname + "의 " + (statNames[stage]||stage) + "이(가) 올라갔다!", "item");
            }
        }
        player.bag[itemKey]--; if (player.bag[itemKey] <= 0) delete player.bag[itemKey];
        return true;
    }
    return false;
}

// ═══════════════════════════════════════════════
// 🔊 사운드
// ═══════════════════════════════════════════════
var _audioCtx = null;
function getACtx() { if (!_audioCtx) try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {} return _audioCtx; }
function playBeep(f,d,t){try{var c=getACtx();if(!c)return;var o=c.createOscillator();var g=c.createGain();o.connect(g);g.connect(c.destination);o.type=t||"square";o.frequency.value=f;g.gain.value=0.06;o.start();o.stop(c.currentTime+(d||0.1));}catch(e){}}
function sfxAttack(){playBeep(220,0.05);setTimeout(function(){playBeep(330,0.08);},60);}
function sfxCapture(){playBeep(523,0.12,"sine");setTimeout(function(){playBeep(659,0.15,"sine");},130);}
function sfxLevelUp(){playBeep(440,0.08,"sine");setTimeout(function(){playBeep(554,0.08,"sine");},100);setTimeout(function(){playBeep(659,0.15,"sine");},200);}

// ═══════════════════════════════════════════════
// 🎨 CSS
// ═══════════════════════════════════════════════
function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = [
"html,body{background:transparent;overflow:hidden;width:100%;height:100%;margin:0;padding:0;pointer-events:none;touch-action:none;}",
".pk-wrap,.pk-toast{pointer-events:auto;touch-action:auto;}",
".pk-wrap{position:fixed;top:5px;right:20px;width:920px;max-height:calc(100vh - 10px);font-family:'Segoe UI',Arial,sans-serif;color:#e0e0e0;background:rgba(26,26,46,0.97);backdrop-filter:blur(12px);border-radius:12px;padding:0;font-size:14px;line-height:1.4;box-sizing:border-box;z-index:99999;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,0.1);box-shadow:0 8px 40px rgba(0,0,0,0.6);}",
"#" + UI_ID + ".hidden{display:none!important;}",
".pk-header{background:linear-gradient(135deg,rgba(231,76,60,0.4),rgba(155,35,53,0.4));padding:10px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.08);}",
".pk-header-title{color:#fff;font-weight:bold;font-size:14px;}",
".pk-header-btn{width:28px;height:28px;border:none;border-radius:6px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;}",
".pk-header-btn:hover{background:rgba(255,255,255,0.25);}",
".pk-body{padding:10px;overflow-y:auto;flex:1;}",
".pk-wrap *{box-sizing:border-box;}",
".pk-card{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;margin:6px 0;}",
".pk-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:8px 14px;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;transition:all .15s;color:#fff;text-align:center;}",
".pk-btn:hover{filter:brightness(1.2);transform:translateY(-1px);}",
".pk-btn:active{transform:translateY(0);}",
".pk-btn-red{background:#e74c3c;}",
".pk-btn-blue{background:#3498db;}",
".pk-btn-green{background:#27ae60;}",
".pk-btn-yellow{background:#f39c12;color:#1a1a2e;}",
".pk-btn-purple{background:#9b59b6;}",
".pk-btn-dark{background:rgba(255,255,255,0.1);}",
".pk-btn-gray{background:#555;}",
".pk-btn-sm{padding:5px 10px;font-size:12px;}",
".pk-btn-xs{padding:3px 7px;font-size:11px;}",
".pk-btn-block{display:flex;width:100%;}",
".pk-btn[disabled]{opacity:0.4;cursor:default;filter:none;transform:none;}",
".pk-hp-bar{width:100%;height:8px;background:#333;border-radius:4px;overflow:hidden;margin:3px 0;}",
".pk-hp-fill{height:100%;transition:width .3s;border-radius:4px;}",
".pk-hp-green{background:#27ae60;}",
".pk-hp-yellow{background:#f39c12;}",
".pk-hp-red{background:#e74c3c;}",
".pk-type{display:inline-block;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:bold;color:#fff;margin:1px 2px;}",
".pk-type-normal{background:#a8a878;} .pk-type-fire{background:#f08030;} .pk-type-water{background:#6890f0;} .pk-type-electric{background:#f8d030;color:#333;} .pk-type-grass{background:#78c850;} .pk-type-ice{background:#98d8d8;color:#333;} .pk-type-fighting{background:#c03028;} .pk-type-poison{background:#a040a0;} .pk-type-ground{background:#e0c068;color:#333;} .pk-type-flying{background:#a890f0;} .pk-type-psychic{background:#f85888;} .pk-type-bug{background:#a8b820;} .pk-type-rock{background:#b8a038;} .pk-type-ghost{background:#705898;} .pk-type-dragon{background:#7038f8;} .pk-type-dark{background:#705848;} .pk-type-steel{background:#b8b8d0;color:#333;} .pk-type-fairy{background:#ee99ac;}",
".pk-region-switch{display:flex;gap:6px;justify-content:center;margin:8px 0;}",
".pk-road-list{max-height:520px;overflow-y:auto;margin:8px 0;}",
".pk-road-item{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 12px;margin:4px 0;cursor:pointer;transition:all .15s;}",
".pk-road-item:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);}",
".pk-road-item.active{border-color:#e74c3c;background:rgba(231,76,60,0.1);}",
".pk-pokemon-display{display:flex;gap:8px;margin:8px 0;}",
".pk-poke-card{flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px;text-align:center;}",
".pk-poke-emoji{font-size:32px;margin:4px 0;}",
".pk-move-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:6px 0;}",
".pk-action-bar{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin:8px 0;}",
".pk-battle-msg{background:#000;border-radius:6px;padding:12px;margin:8px 0;max-height:360px;overflow-y:auto;font-size:14px;line-height:1.6;color:#aaa;}",
".pk-battle-msg p{margin:3px 0;} .pk-battle-msg p:first-child{color:#fff;}",
".pk-log-entry{font-size:13px;padding:3px 0;color:#888;}",
".pk-log-battle{color:#e74c3c;} .pk-log-exp{color:#f39c12;} .pk-log-levelup{color:#2ecc71;} .pk-log-learn{color:#3498db;} .pk-log-evolution{color:#9b59b6;} .pk-log-capture{color:#e67e22;} .pk-log-gold{color:#f5c518;} .pk-log-heal{color:#1abc9c;} .pk-log-item{color:#1abc9c;}",
".pk-toast{position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#2ecc71;color:#fff;padding:8px 20px;border-radius:8px;font-size:14px;z-index:9999;animation:pkToastIn .3s;}",
"@keyframes pkToastIn{from{opacity:0;top:0}to{opacity:1;top:20px}}",
".pk-gold{color:#f5c518;font-weight:bold;}",
".pk-dex-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:4px;}",
".pk-dex-item{background:rgba(255,255,255,0.05);border-radius:6px;padding:4px;text-align:center;font-size:10px;}",
".pk-dex-item.pk-dex-seen{border:1px solid rgba(39,174,96,0.4);}",
".pk-dex-item.pk-dex-caught{border:1px solid rgba(231,76,60,0.5);}",
".pk-dex-item.pk-dex-unseen{opacity:0.3;}",
".pk-mini-log{background:rgba(0,0,0,0.4);border-top:1px solid rgba(255,255,255,0.1);border-radius:0 0 8px 8px;padding:6px 10px;margin-top:8px;max-height:360px;overflow-y:auto;}",
"@keyframes pulse{from{opacity:1}to{opacity:0.6}}",
"@media screen and (max-width:960px){html,body{overflow:auto;} .pk-wrap{top:0;right:0;width:100%;max-height:100vh;border-radius:0;}}"
    ].join("\n");
    document.head.appendChild(s);
}

// ═══════════════════════════════════════════════
// 🖥️ UI 렌더링
// ═══════════════════════════════════════════════
function createUI() {
    var existing = document.getElementById(UI_ID);
    if (existing) return existing;
    var div = document.createElement("div");
    div.id = UI_ID;
    div.className = "pk-wrap" + (isVisible ? "" : " hidden");
    div.innerHTML = '<div class="pk-header"><div class="pk-header-title">🎮 포켓몬 배틀</div><div style="display:flex;gap:6px;"><button class="pk-header-btn" id="pk-close-btn" title="닫기">✕</button></div></div><div class="pk-body" id="pk-body"></div>';
    document.body.appendChild(div);
    div.querySelector("#pk-close-btn").addEventListener("click", async function() {
        div.classList.add("hidden");
        isVisible = false;
        await lsSet(KEY_VIS, "false");
        if (_hasRisu) { try { await Risuai.hideContainer(); } catch(e){} }
    });
    return div;
}

function showToast(msg) {
    var t = document.createElement("div");
    t.className = "pk-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() { t.remove(); }, 2000);
}

function typeSpan(t) {
    return '<span class="pk-type pk-type-' + t + '">' + t.toUpperCase() + '</span>';
}

function hpBar(cur, max) {
    var pct = Math.max(0, Math.round((cur / max) * 100));
    var cls = pct > 50 ? "pk-hp-green" : (pct > 20 ? "pk-hp-yellow" : "pk-hp-red");
    return '<div class="pk-hp-bar"><div class="pk-hp-fill ' + cls + '" style="width:' + pct + '%"></div></div>';
}

function render() {
    if (!isVisible) return;
    injectStyles();
    var container = createUI();
    var body = container.querySelector("#pk-body") || container;
    var html = '';
    if (gState && gState.subScreen === "berrySelect") {
        var berryHtml = '<div style="padding:10px"><h3>🫐 열매 선택</h3>';
        var hasBerries = false;
        var bagKeys = Object.keys(player.bag);
        for (var bi = 0; bi < bagKeys.length; bi++) {
            var bk = bagKeys[bi];
            var bItem = ITEMS[bk];
            if (bItem && bItem.type === "berry" && player.bag[bk] > 0) {
                hasBerries = true;
                berryHtml += '<div style="margin:3px 0"><button data-action="poke_selectBerry" data-args="' + bk + '" style="width:100%;text-align:left;padding:6px;background:#3a6;color:#fff;border:none;border-radius:4px;cursor:pointer">' + bItem.n + ' x' + player.bag[bk] + ' <span style="font-size:0.85em;color:#cfc">(' + bItem.desc + ')</span></button></div>';
            }
        }
        if (!hasBerries) berryHtml += '<p>가방에 열매가 없습니다.</p>';
        berryHtml += '<button data-action="poke_cancelBerrySelect" style="margin-top:8px;padding:6px 16px;background:#666;color:#fff;border:none;border-radius:4px;cursor:pointer">취소</button></div>';
        body.innerHTML = berryHtml;
        bindHandlers(body); return;
    }
    if (gState && gState.subScreen === "starterSelect") {
        html = renderStarterSelect();
    } else if (!player || !gState) {
        html = renderTitleScreen();
    } else if (gState.pendingEvo) {
        html = renderEvolutionScreen();
    } else if (gState.pendingMoveLearn) {
        html = renderMoveLearnScreen();
    } else if (gState.subScreen === "bag") {
        html = renderBagScreen();
    } else if (gState.subScreen === "itemPartySelect") {
        html = renderItemPartySelect();
    } else if (gState.subScreen === "battlePartySwitch") {
        html = renderBattlePartySwitch();
    } else if (gState.subScreen === "log") {
        html = renderLogScreen();
    } else if (gState.phase === "battle") {
        html = renderBattleScreen();
    } else if (gState.subScreen === "party") {
        html = renderPartyScreen();
    } else if (gState.subScreen === "pc") {
        html = renderPCScreen();
    } else if (gState.subScreen === "shop") {
        html = renderShopScreen();
    } else if (gState.subScreen === "summary") {
        html = renderSummaryScreen();
    } else if (gState.subScreen === "pokedex") {
        html = renderPokedexScreen();
    } else if (gState.subScreen === "gyms") {
        html = renderGymScreen();
    } else if (gState.subScreen === "badges") {
        html = renderBadgeScreen();
    } else if (gState.subScreen === "tmPartySelect") {
        html = renderTmPartySelect();
    } else if (gState.subScreen === "roadDetail") {
        html = renderRoadDetail();
    } else if (gState.subScreen === "pokedexDetail") {
        html = renderPokedexDetail();
    } else if (gState.subScreen === "saveSlots") {
        html = renderSaveSlots();
    } else if (gState.subScreen === "status") {
        html = renderStatusScreen();
    } else if (gState.subScreen === "moveRelearner") {
        html = renderMoveRelearnerScreen();
    } else if (gState.subScreen === "moveRelearnerMoves") {
        html = renderMoveRelearnerMovesScreen();
    } else {
        html = renderOverworld();
    }
    // 미니 로그 (모든 화면)
    if (player && gState && gState.log && gState.log.length > 0 && gState.subScreen !== "log") {
        html += '<div class="pk-mini-log"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px"><span style="font-size:10px;color:#888">📋 최근 로그</span><button class="pk-btn pk-btn-dark pk-btn-xs" data-action="poke_openLog">전체</button></div>';
        var _mlogs = gState.log;
        var _mstart = Math.max(0, _mlogs.length - 20);
        for (var _mi = _mstart; _mi < _mlogs.length; _mi++) {
            html += '<div class="pk-log-entry pk-log-' + _mlogs[_mi].type + '">' + _mlogs[_mi].msg + '</div>';
        }
        html += '</div>';
    }
    body.innerHTML = html;
    bindHandlers(body);
    var battleMsgEl = body.querySelector(".pk-battle-msg");
    if (battleMsgEl) battleMsgEl.scrollTop = battleMsgEl.scrollHeight;
}

function renderTitleScreen() {
    var html = '<div style="text-align:center;padding:20px 0">';
    html += '<div style="font-size:28px;margin:10px 0">🎮 포켓몬 배틀</div>';
    html += '<div style="color:#aaa;font-size:12px;margin-bottom:20px">Gen 1~6 | 관동 & 성도 & 호연 & 신오 & 하나 & 칼로스</div>';
    html += '<div style="display:flex;flex-direction:column;gap:8px;max-width:200px;margin:0 auto">';
    html += '<button class="pk-btn pk-btn-red pk-btn-block" data-action="poke_newGame">🆕 새 게임</button>';
    html += '<button class="pk-btn pk-btn-blue pk-btn-block" data-action="poke_continue">📂 이어하기</button>';
    html += '<button class="pk-btn pk-btn-green pk-btn-block" data-action="poke_openSaveSlots">💾 저장 슬롯</button>';
    html += '</div></div>';
    return html;
}

function renderStarterSelect() {
    var region = gState.starterRegion || "kanto";
    var startersByRegion = {
        kanto: [{k:"bulbasaur",n:"이상해씨",t:"풀/독",em:"🌿"},{k:"charmander",n:"파이리",t:"불꽃",em:"🔥"},{k:"squirtle",n:"꼬부기",t:"물",em:"🐢"}],
        johto: [{k:"chikorita",n:"치코리타",t:"풀",em:"🍃"},{k:"cyndaquil",n:"브케인",t:"불꽃",em:"🔥"},{k:"totodile",n:"리아코",t:"물",em:"🐊"}],
        hoenn: [{k:"treecko",n:"나무지기",t:"풀",em:"🌿"},{k:"torchic",n:"아차모",t:"불꽃",em:"🔥"},{k:"mudkip",n:"물짱이",t:"물",em:"💧"}],
        sinnoh: [{k:"turtwig",n:"모부기",t:"풀",em:"🌿"},{k:"chimchar",n:"불꽃숭이",t:"불꽃",em:"🔥"},{k:"piplup",n:"팽도리",t:"물",em:"💧"}],
        unova: [{k:"snivy",n:"주리비얀",t:"풀",em:"🌿"},{k:"tepig",n:"뚜꾸리",t:"불꽃",em:"🐷"},{k:"oshawott",n:"수댕이",t:"물",em:"🦦"}],
        kalos: [{k:"chespin",n:"도치마론",t:"풀",em:"🌰"},{k:"fennekin",n:"푸호꼬",t:"불꽃",em:"🦊"},{k:"froakie",n:"개구마르",t:"물",em:"🐸"}]
    };
    var starters = startersByRegion[region] || startersByRegion.kanto;
    var regionNameMap = {kanto:"관동",johto:"성도",hoenn:"호연",sinnoh:"신오",unova:"하나",kalos:"칼로스"};
    var html = '<div style="text-align:center;padding:10px 0">';
    html += '<div style="font-size:18px;margin-bottom:4px">🎒 첫 파트너 포켓몬 선택</div>';
    html += '<div style="color:#aaa;font-size:12px;margin-bottom:12px">' + (regionNameMap[region] || "관동") + ' 지방에서 모험 시작!</div>';
    // 지방 선택 탭
    html += '<div style="display:flex;gap:6px;justify-content:center;margin-bottom:12px;flex-wrap:wrap">';
    html += '<button class="pk-btn ' + (region==="kanto"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_setStarterRegion" data-args="kanto">🗾 관동</button>';
    html += '<button class="pk-btn ' + (region==="johto"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_setStarterRegion" data-args="johto">🏔️ 성도</button>';
    html += '<button class="pk-btn ' + (region==="hoenn"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_setStarterRegion" data-args="hoenn">🌴 호연</button>';
    html += '<button class="pk-btn ' + (region==="sinnoh"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_setStarterRegion" data-args="sinnoh">❄️ 신오</button>';
    html += '<button class="pk-btn ' + (region==="unova"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_setStarterRegion" data-args="unova">🏙️ 하나</button>';
    html += '<button class="pk-btn ' + (region==="kalos"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_setStarterRegion" data-args="kalos">🗼 칼로스</button>';
    html += '</div>';
    html += '<div style="display:flex;gap:8px;justify-content:center">';
    for (var i = 0; i < starters.length; i++) {
        var s = starters[i];
        html += '<div class="pk-card" style="width:120px;cursor:pointer;text-align:center" data-action="poke_selectStarter" data-args="' + s.k + '">';
        html += '<div style="font-size:36px">' + s.em + '</div>';
        html += '<div style="font-weight:bold">' + s.n + '</div>';
        html += '<div style="font-size:11px;color:#aaa">' + s.t + '</div>';
        html += '</div>';
    }
    html += '</div></div>';
    return html;
}

// ── 메인 오버월드: 지역 선택 → 도로 목록 ──
function renderOverworld() {
    var region = REGIONS[player.region];
    if (!region) return '<div>지역 데이터 없음</div>';
    var html = '';
    // 지역 전환 버튼
    html += '<div class="pk-region-switch">';
    html += '<button class="pk-btn ' + (player.region==="kanto"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_switchRegion" data-args="kanto">🗾 관동</button>';
    html += '<button class="pk-btn ' + (player.region==="johto"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_switchRegion" data-args="johto">🏔️ 성도</button>';
    html += '<button class="pk-btn ' + (player.region==="hoenn"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_switchRegion" data-args="hoenn">🌴 호연</button>';
    html += '<button class="pk-btn ' + (player.region==="sinnoh"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_switchRegion" data-args="sinnoh">❄️ 신오</button>';
    html += '<button class="pk-btn ' + (player.region==="unova"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_switchRegion" data-args="unova">🏙️ 하나</button>';
    html += '<button class="pk-btn ' + (player.region==="kalos"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_switchRegion" data-args="kalos">🗼 칼로스</button>';
    html += '</div>';
    // 상단 상태바
    html += '<div class="pk-card" style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px">';
    html += '<span style="font-size:13px;cursor:pointer" data-action="poke_changeName" title="이름 변경">👤 ' + player.name + ' ✏️</span>';
    html += '<span style="font-size:12px">📅 ' + player.day + '일차 ' + TIME_NAMES[player.timeOfDay] + '</span>';
    html += '<span class="pk-gold" style="font-size:13px">💰 ₩' + player.gold.toLocaleString() + '</span>';
    html += '</div>';
    // 뱃지 미니바
    var kBadges = player.badges.kanto ? player.badges.kanto.length : 0;
    var jBadges = player.badges.johto ? player.badges.johto.length : 0;
    var hBadges = player.badges.hoenn ? player.badges.hoenn.length : 0;
    var sBadges = player.badges.sinnoh ? player.badges.sinnoh.length : 0;
    var uBadges = player.badges.unova ? player.badges.unova.length : 0;
    var xBadges = player.badges.kalos ? player.badges.kalos.length : 0;
    html += '<div class="pk-card" style="display:flex;justify-content:space-between;align-items:center;padding:4px 10px;font-size:10px">';
    html += '<span>🏅 관동 ' + kBadges + '/8 | 성도 ' + jBadges + '/8 | 호연 ' + hBadges + '/8 | 신오 ' + sBadges + '/8 | 하나 ' + uBadges + '/8 | 칼로스 ' + xBadges + '/8</span>';
    html += '<button class="pk-btn pk-btn-dark pk-btn-xs" data-action="poke_advanceTime">⏰ 다음 시간</button>';
    html += '</div>';
    // 파티 미니바
    html += '<div style="display:flex;gap:4px;margin:4px 0;flex-wrap:wrap;justify-content:center">';
    for (var i = 0; i < player.party.length; i++) {
        var p = player.party[i]; var pd = POKEDEX[p.key]; var em = pd ? pd.em : "?";
        var hpPct = Math.round((p.currentHp / p.stats[0]) * 100);
        var hpColor = hpPct > 50 ? "#27ae60" : (hpPct > 20 ? "#f39c12" : "#e74c3c");
        if (p.currentHp <= 0) hpColor = "#555";
        html += '<div style="background:rgba(255,255,255,0.05);padding:3px 6px;border-radius:6px;font-size:11px;border-bottom:2px solid ' + hpColor + '">' + em + ' Lv.' + p.level + '</div>';
    }
    html += '</div>';
    // 도구 버튼
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin:4px 0">';
    html += '<button class="pk-btn pk-btn-purple pk-btn-xs" data-action="poke_openParty">👥 파티</button>';
    html += '<button class="pk-btn pk-btn-yellow pk-btn-xs" data-action="poke_openBag">🎒 가방</button>';
    html += '<button class="pk-btn pk-btn-green pk-btn-xs" data-action="poke_openPokedex">📖 도감</button>';
    html += '<button class="pk-btn pk-btn-red pk-btn-xs" data-action="poke_openGyms">🏟️ 체육관</button>';
    html += '<button class="pk-btn pk-btn-yellow pk-btn-xs" data-action="poke_openBadges">🏅 뱃지</button>';
    html += '<button class="pk-btn pk-btn-blue pk-btn-xs" data-action="poke_openSaveSlots">💾 슬롯</button>';
    html += '<button class="pk-btn pk-btn-dark pk-btn-xs" data-action="poke_openStatus">📊 상태</button>';
    html += '<button class="pk-btn pk-btn-red pk-btn-xs" data-action="poke_freshStart">🌟 새 시작</button>';
    html += '</div>';
    // 도로 목록
    html += '<div style="font-size:14px;font-weight:bold;color:#f5c518;margin:8px 0 4px">' + region.em + ' ' + region.n + ' 도로 목록</div>';
    html += '<div class="pk-road-list">';
    for (var i = 0; i < region.roads.length; i++) {
        var road = region.roads[i];
        var isActive = (player.roadIdx === i);
        var curBadges = player.badges[player.region] ? player.badges[player.region].length : 0;
        var locked = (road.reqBadges !== undefined && curBadges < road.reqBadges);
        html += '<div class="pk-road-item' + (isActive ? ' active' : '') + (locked ? ' pk-locked' : '') + '" ' + (locked ? '' : 'data-action="poke_selectRoad" data-args="' + i + '"') + ' style="' + (locked ? 'opacity:0.4;pointer-events:none' : '') + '">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center">';
        html += '<div>';
        html += '<span style="font-weight:bold;font-size:13px">' + (road.isCity ? '🏙️ ' : '') + road.n + '</span>';
        if (!road.isCity && road.lv) html += ' <span style="color:#aaa;font-size:11px">Lv.' + road.lv[0] + '~' + road.lv[1] + '</span>';
        html += '</div>';
        html += '<div style="display:flex;gap:2px">';
        if (road.hasCenter) html += '<span title="포켓몬센터">🏥</span>';
        if (road.hasShop) html += '<span title="상점">🏪</span>';
        html += '</div></div>';
        html += '<div style="color:#888;font-size:11px">' + road.desc + (locked ? ' 🔒 뱃지 ' + road.reqBadges + '개 필요' : '') + '</div>';
        html += '</div>';
    }
    html += '</div>';
    // 로그 미니
    html += '<div class="pk-card" style="max-height:250px;overflow-y:auto">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px"><span style="font-size:11px;color:#aaa">📋 로그</span>';
    html += '<button class="pk-btn pk-btn-dark pk-btn-xs" data-action="poke_openLog">전체</button></div>';
    var logs = gState.log || [];
    for (var i = Math.max(0, logs.length - 3); i < logs.length; i++) {
        html += '<div class="pk-log-entry pk-log-' + logs[i].type + '">' + logs[i].msg + '</div>';
    }
    html += '</div>';
    return html;
}

// ── 도로 상세 화면 ──
function renderRoadDetail() {
    var region = REGIONS[player.region];
    if (!region) return '';
    var road = region.roads[player.roadIdx];
    if (!road) return '';
    var html = '';
    html += '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back" style="margin-bottom:8px">◀ 도로 목록</button>';
    // 도로/도시 정보
    html += '<div class="pk-card" style="border-color:rgba(233,69,96,0.4)">';
    html += '<div style="font-size:16px;font-weight:bold;color:#f5c518">' + (road.isCity ? '🏙️' : '📍') + ' ' + road.n + '</div>';
    if (road.isCity) {
        html += '<div style="color:#aaa;font-size:12px">' + road.desc + ' | ' + TIME_NAMES[player.timeOfDay] + '</div>';
    } else {
        html += '<div style="color:#aaa;font-size:12px">' + road.desc + ' | Lv.' + road.lv[0] + '~' + road.lv[1] + ' | ' + TIME_NAMES[player.timeOfDay] + '</div>';
    }
    // 대량발생 표시
    var _swarm = getActiveSwarm();
    if (_swarm && road.id === _swarm.road) {
        var _swPd = POKEDEX[_swarm.pokemon];
        html += '<div style="background:rgba(231,76,60,0.15);padding:4px 8px;border-radius:4px;margin-top:4px;font-size:12px;color:#e74c3c">⚡ 대량발생 중! ' + (_swPd ? _swPd.em + ' ' + _swPd.n : _swarm.pokemon) + ' (Lv.' + _swarm.lv[0] + '~' + _swarm.lv[1] + ')</div>';
    }
    // 출현 포켓몬 (도시가 아닌 경우만)
    if (!road.isCity && road.pokemon && road.pokemon.length > 0) {
        html += '<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:3px">';
        for (var i = 0; i < road.pokemon.length; i++) {
            var pk = POKEDEX[road.pokemon[i].k];
            if (pk) html += '<span style="font-size:10px;background:rgba(255,255,255,0.08);padding:2px 5px;border-radius:4px">' + pk.em + ' ' + pk.n + '</span>';
        }
        html += '</div>';
    }
    html += '</div>';
    // 탐색/배틀 버튼 (도시가 아닌 경우만)
    html += '<div style="display:flex;flex-direction:column;gap:6px;margin:8px 0">';
    if (!road.isCity && road.pokemon && road.pokemon.length > 0) {
        html += '<button class="pk-btn pk-btn-green pk-btn-block" data-action="poke_explore">🌿 포켓몬 탐색</button>';
    }
    if (FISHING_DATA[road.id]) {
        if (player.bag.superrod) html += '<button class="pk-btn pk-btn-blue pk-btn-block" data-action="poke_fishing" data-args="super">🎣 대단한낚시대로 낚시</button>';
        if (player.bag.goodrod) html += '<button class="pk-btn pk-btn-blue pk-btn-block" data-action="poke_fishing" data-args="good">🎣 좋은낚시대로 낚시</button>';
        if (player.bag.oldrod) html += '<button class="pk-btn pk-btn-blue pk-btn-block" data-action="poke_fishing" data-args="old">🎣 낡은낚시대로 낚시</button>';
    }
    // 전설 포켓몬 조우 버튼
    var legends = getAvailableLegendaries(road.id);
    for (var li = 0; li < legends.length; li++) {
        var le = legends[li];
        var pd = POKEDEX[le.key];
        html += '<button class="pk-btn pk-btn-red pk-btn-block" data-action="poke_legendaryBattle" data-args="' + le.key + ',' + le.level + '">';
        html += '🌟 ' + (pd ? pd.em + ' ' : '') + le.name + ' (Lv.' + le.level + ') 에게 도전!</button>';
    }
    // 로밍 전설 포켓몬
    var roamer = getRoamingAtRoad(player.roadIdx);
    if (roamer) {
        var rpd = POKEDEX[roamer];
        html += '<button class="pk-btn pk-btn-yellow pk-btn-block" data-action="poke_roamingBattle" data-args="' + roamer + '">';
        html += '⚡ ' + (rpd ? rpd.em + ' ' : '') + (rpd ? rpd.n : roamer) + '의 기척이 느껴진다! (5% 확률 조우)</button>';
    }
    // 환상 포켓몬
    var myths = getAvailableMythicals();
    for (var mi = 0; mi < myths.length; mi++) {
        var m = myths[mi];
        var mpd = POKEDEX[m.key];
        html += '<button class="pk-btn pk-btn-purple pk-btn-block" data-action="poke_legendaryBattle" data-args="' + m.key + ',' + m.level + '">';
        html += '✨ ' + (mpd ? mpd.em + ' ' : '') + m.name + ' (Lv.' + m.level + ') 이(가) 나타났다!</button>';
    }
    html += '</div>';
    // 트레이너 목록
    if (road.trainers && road.trainers.length > 0) {
        html += '<div style="font-size:13px;font-weight:bold;color:#f5c518;margin:10px 0 4px">🎯 트레이너</div>';
        for (var i = 0; i < road.trainers.length; i++) {
            var tr = road.trainers[i];
            var tKey = road.id + "_t" + i;
            var defeatedDay = player.defeatedTrainers[tKey];
            var defeatedToday = (defeatedDay === player.day);
            var defeatedBefore = (defeatedDay !== undefined && !defeatedToday);
            html += '<div class="pk-card" style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px' + (defeatedToday ? ';opacity:0.5' : '') + '">';
            html += '<div>';
            html += '<span style="font-size:14px">' + tr.em + '</span> ';
            html += '<span style="font-size:13px;font-weight:bold">' + tr.n + '</span>';
            html += '<div style="font-size:10px;color:#aaa;margin-top:2px">';
            for (var j = 0; j < tr.pokemon.length; j++) {
                var tpd = POKEDEX[tr.pokemon[j].k];
                html += (tpd ? tpd.em : "?") + 'Lv.' + tr.pokemon[j].l + ' ';
            }
            html += '</div>';
            html += '<div style="font-size:10px;color:#f5c518">💰 ₩' + tr.reward + '</div>';
            html += '</div>';
            if (defeatedToday) {
                html += '<span style="font-size:11px;color:#27ae60">✅ 오늘 승리</span>';
            } else if (defeatedBefore) {
                html += '<button class="pk-btn pk-btn-yellow pk-btn-sm" data-action="poke_trainerBattle" data-args="' + i + '">🔄 재대결</button>';
            } else {
                html += '<button class="pk-btn pk-btn-red pk-btn-sm" data-action="poke_trainerBattle" data-args="' + i + '">⚔️ 배틀</button>';
            }
            html += '</div>';
        }
    }
    // 시설
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin:8px 0">';
    if (road.hasCenter) html += '<button class="pk-btn pk-btn-blue pk-btn-sm" data-action="poke_center">🏥 포켓몬센터</button>';
    if (road.hasShop) html += '<button class="pk-btn pk-btn-green pk-btn-sm" data-action="poke_openShop">🏪 상점</button>';
    if (road.isCity) html += '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_openPC">💻 PC</button>';
    if (road.isCity) html += '<button class="pk-btn pk-btn-purple pk-btn-sm" data-action="poke_openMoveRelearner">📖 기술 생각해내기</button>';
    html += '<button class="pk-btn pk-btn-purple pk-btn-sm" data-action="poke_openParty">👥 파티</button>';
    html += '<button class="pk-btn pk-btn-yellow pk-btn-sm" data-action="poke_openBag">🎒 가방</button>';
    html += '</div>';
    // 체육관 (이 도시에 있는 체육관)
    var gymList = GYMS[player.region];
    if (gymList) {
        var badges = player.badges[player.region] || [];
        for (var gi = 0; gi < gymList.length; gi++) {
            var gym = gymList[gi];
            if (gym.city !== road.n) continue;
            var hasBadge = (badges.indexOf(gym.id) !== -1);
            html += '<div class="pk-card" style="padding:8px;margin:6px 0;border-left:3px solid ' + (hasBadge ? '#f5c518' : '#e74c3c') + '">';
            html += '<div style="font-size:14px;font-weight:bold;margin-bottom:4px">🏟️ ' + gym.n + ' ' + typeSpan(gym.type) + '</div>';
            if (hasBadge) {
                html += '<div style="font-size:11px;color:#f5c518;margin-bottom:4px">' + gym.badgeEm + ' ' + gym.badge + ' 획득 완료!</div>';
            }
            // 체육관 트레이너 표시
            var allTrainersDefeated = true;
            if (gym.gymTrainers && !hasBadge) {
                for (var gti = 0; gti < gym.gymTrainers.length; gti++) {
                    var gtKey = gym.id + "_trainer_" + gti;
                    var gtDefeated = !!player.defeatedGyms[gtKey];
                    if (!gtDefeated) allTrainersDefeated = false;
                    var gt = gym.gymTrainers[gti];
                    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;margin-top:3px;border-top:1px solid rgba(255,255,255,0.03)">';
                    html += '<div>';
                    html += '<span style="font-size:11px">👤 ' + gt.n + '</span>';
                    html += '<div style="font-size:10px;color:#aaa">';
                    for (var gtp = 0; gtp < gt.pokemon.length; gtp++) {
                        var gtpd = POKEDEX[gt.pokemon[gtp].k];
                        html += (gtpd ? gtpd.em : "?") + 'Lv.' + gt.pokemon[gtp].l + ' ';
                    }
                    html += '</div>';
                    html += '</div>';
                    if (gtDefeated) {
                        html += '<span style="font-size:10px;color:#27ae60">✅</span>';
                    } else {
                        html += '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_gymTrainerBattle" data-args="' + gi + ',' + gti + '">⚔️</button>';
                    }
                    html += '</div>';
                }
            }
            var canFightLeaders = !gym.gymTrainers || hasBadge || allTrainersDefeated;
            for (var li = 0; li < gym.leaders.length; li++) {
                var leader = gym.leaders[li];
                var gKey = gym.id + "_" + leader.id;
                var defeatedToday = (player.defeatedGyms[gKey] === player.day);
                var defeatedBefore = (player.defeatedGyms[gKey] !== undefined && !defeatedToday) || hasBadge;
                html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;margin-top:4px;border-top:1px solid rgba(255,255,255,0.05)">';
                html += '<div>';
                html += '<span style="font-size:14px">' + leader.em + '</span> ';
                html += '<span style="font-size:12px;font-weight:bold">' + leader.n + '</span>';
                if (gym.leaders.length > 1) html += ' <span style="font-size:10px;color:#888">(Gen ' + leader.gen + ')</span>';
                html += '<div style="font-size:10px;color:#aaa">';
                for (var lp = 0; lp < leader.pokemon.length; lp++) {
                    var tpd = POKEDEX[leader.pokemon[lp].k];
                    html += (tpd ? tpd.em : "?") + 'Lv.' + leader.pokemon[lp].l + ' ';
                }
                html += '</div>';
                html += '<div style="font-size:10px;color:#f5c518">💰 ₩' + leader.reward + '</div>';
                html += '</div>';
                if (leader.reqBadges && badges.length < leader.reqBadges) {
                    html += '<span style="font-size:11px;color:#e74c3c">🔒 뱃지 ' + leader.reqBadges + '개 필요</span>';
                } else if (!canFightLeaders) {
                    html += '<span style="font-size:11px;color:#e67e22">🚫 트레이너를 먼저 쓰러뜨리세요</span>';
                } else if (defeatedToday) {
                    html += '<span style="font-size:11px;color:#27ae60">✅ 오늘 승리</span>';
                } else if (defeatedBefore) {
                    html += '<button class="pk-btn pk-btn-yellow pk-btn-sm" data-action="poke_gymBattle" data-args="' + gi + ',' + li + '">🔄 재대결</button>';
                } else {
                    html += '<button class="pk-btn pk-btn-red pk-btn-sm" data-action="poke_gymBattle" data-args="' + gi + ',' + li + '">⚔️ 도전</button>';
                }
                html += '</div>';
            }
            html += '</div>';
        }
    }
    return html;
}

function renderBattleScreen() {
    var bd = gState.battleData;
    if (!bd) return '<div>배틀 데이터 없음</div>';
    var myPoke = player.party[bd.myIdx];
    var enemy = bd.enemy;
    var myData = POKEDEX[myPoke.key];
    var enData = POKEDEX[enemy.key];
    var html = '';
    // 트레이너전 헤더
    if (bd.type === "trainer") {
        html += '<div style="text-align:center;font-size:13px;margin-bottom:6px;color:#f39c12">' + bd.trainerEmoji + ' VS ' + bd.trainerName + '</div>';
    }
    // 포켓몬 표시
    html += '<div class="pk-pokemon-display">';
    // 내 포켓몬
    html += '<div class="pk-poke-card" style="border-left:3px solid #3498db">';
    html += '<div style="font-size:11px;color:#3498db">나의 포켓몬</div>';
    var myEm = (myPoke.isMega && myPoke.megaForm) ? myPoke.megaForm.em : (myData?myData.em:"?");
    var myName = (myPoke.isMega && myPoke.megaNickname) ? myPoke.megaNickname : myPoke.nickname;
    html += '<div class="pk-poke-emoji">' + myEm + '</div>';
    html += '<div style="font-weight:bold">' + myName + ' <span style="color:#aaa;font-size:11px">Lv.' + myPoke.level + '</span></div>';
    var myTypes = myPoke.megaTypes || (myData ? myData.t : []);
    for (var i = 0; i < myTypes.length; i++) html += typeSpan(myTypes[i]);
    html += '<div style="font-size:11px;margin-top:4px">HP: ' + Math.max(0,myPoke.currentHp) + '/' + myPoke.stats[0] + '</div>';
    html += hpBar(myPoke.currentHp, myPoke.stats[0]);
    if (myPoke.status && myPoke.status !== "confuse") html += '<div style="font-size:10px;color:#e74c3c;margin-top:2px">⚠️ ' + statusName(myPoke.status) + '</div>';
    // 특성 표시
    var myAb = getAbility(myPoke);
    if (myAb) html += '<div style="font-size:10px;color:#9b59b6;margin-top:1px">⭐ ' + myAb.n + '</div>';
    if (myPoke.isMega) html += '<div style="font-size:10px;color:#e91e63;margin-top:1px">💎 메가진화</div>';
    html += '</div>';
    // 적 포켓몬
    html += '<div class="pk-poke-card" style="border-left:3px solid #e74c3c">';
    html += '<div style="font-size:11px;color:#e74c3c">' + (bd.type==="trainer"?"상대":"야생") + ' 포켓몬</div>';
    html += '<div class="pk-poke-emoji">' + (enData?enData.em:"?") + '</div>';
    html += '<div style="font-weight:bold">' + enemy.nickname + ' <span style="color:#aaa;font-size:11px">Lv.' + enemy.level + '</span></div>';
    var enTypes = enemy.megaTypes || (enData ? enData.t : []);
    for (var i = 0; i < enTypes.length; i++) html += typeSpan(enTypes[i]);
    html += '<div style="font-size:11px;margin-top:4px">HP: ' + Math.max(0,enemy.currentHp) + '/' + enemy.stats[0] + '</div>';
    html += hpBar(enemy.currentHp, enemy.stats[0]);
    if (enemy.status && enemy.status !== "confuse") html += '<div style="font-size:10px;color:#e74c3c;margin-top:2px">⚠️ ' + statusName(enemy.status) + '</div>';
    var enAb = getAbility(enemy);
    if (enAb) html += '<div style="font-size:10px;color:#9b59b6;margin-top:1px">⭐ ' + enAb.n + '</div>';
    // 트레이너전 남은 포켓몬
    if (bd.type === "trainer" && bd.enemyParty) {
        html += '<div style="font-size:10px;color:#aaa;margin-top:3px">남은: ' + (bd.enemyParty.length - bd.enemyIdx) + '/' + bd.enemyParty.length + '</div>';
    }
    html += '</div></div>';
    // 배틀 메시지
    html += '<div class="pk-battle-msg">';
    if (bd._msgHistory && bd._msgHistory.length > 0) {
        for (var hi = 0; hi < bd._msgHistory.length; hi++) {
            for (var hj = 0; hj < bd._msgHistory[hi].length; hj++) html += '<p style="color:#666">' + bd._msgHistory[hi][hj] + '</p>';
            html += '<hr style="border:none;border-top:1px solid #333;margin:4px 0">';
        }
    }
    for (var i = 0; i < bd.msg.length; i++) html += '<p>' + bd.msg[i] + '</p>';
    html += '</div>';
    if (bd.won || bd.caught || bd.fled) {
        if (bd.pendingReward && !bd.rewardHandled) {
            html += '<div class="pk-card" style="text-align:center;border-color:#f5c518">';
            html += '<div style="font-size:14px;font-weight:bold;color:#f5c518;margin-bottom:6px">💰 상금 ₩' + bd.pendingReward.toLocaleString() + '</div>';
            html += '<div style="display:flex;gap:8px;justify-content:center">';
            html += '<button class="pk-btn pk-btn-green" data-action="poke_acceptReward">💰 받기</button>';
            html += '<button class="pk-btn pk-btn-gray" data-action="poke_declineReward">🚫 거절</button>';
            html += '</div></div>';
        } else {
            html += '<button class="pk-btn pk-btn-green pk-btn-block" data-action="poke_endBattle">✅ 확인</button>';
        }
    } else if (bd.lost) {
        html += '<button class="pk-btn pk-btn-red pk-btn-block" data-action="poke_blackout">😵 패배 확인</button>';
    } else if (myPoke.currentHp <= 0) {
        html += renderBattlePartySwitch();
    } else {
        html += '<div style="font-size:11px;color:#aaa;margin:4px 0">⚔️ 기술 선택:</div>';
        html += '<div class="pk-move-grid">';
        for (var i = 0; i < myPoke.moves.length; i++) {
            var m = myPoke.moves[i]; var mv = MOVES[m.key];
            if (!mv) continue;
            var disabled = m.ppLeft <= 0 ? ' disabled' : '';
            html += '<button class="pk-btn pk-btn-dark"' + disabled + ' data-action="poke_attack" data-args="' + m.key + '">';
            html += '<div>' + typeSpan(mv.t) + ' ' + mv.n + '</div>';
            html += '<div style="font-size:10px;color:#aaa">' + (mv.c==="status"?"변화":mv.c==="physical"?"물리":"특수") + ' | ' + (mv.p||"-") + ' | PP:' + m.ppLeft + '/' + mv.pp + '</div>';
            html += '</button>';
        }
        html += '</div>';
        html += '<div class="pk-action-bar">';
        if (bd.type === "wild") {
            var balls = [];
            if (player.bag.pokeball) balls.push({k:"pokeball",n:"몬스터볼",c:player.bag.pokeball});
            if (player.bag.superball) balls.push({k:"superball",n:"슈퍼볼",c:player.bag.superball});
            if (player.bag.ultraball) balls.push({k:"ultraball",n:"하이퍼볼",c:player.bag.ultraball});
            if (player.bag.masterball) balls.push({k:"masterball",n:"마스터볼",c:player.bag.masterball});
            for (var i = 0; i < balls.length; i++) {
                html += '<button class="pk-btn pk-btn-yellow pk-btn-xs" data-action="poke_throwBall" data-args="' + balls[i].k + '">🔴 ' + balls[i].n + '(' + balls[i].c + ')</button>';
            }
        }
        html += '<button class="pk-btn pk-btn-blue pk-btn-xs" data-action="poke_battleParty">🔄 교체</button>';
        html += '<button class="pk-btn pk-btn-green pk-btn-xs" data-action="poke_battleBag">🎒 아이템</button>';
        // 메가진화 버튼
        if (player.bag.megaring && !bd.megaUsed) {
            var canMega = !!MEGA_DATA[myPoke.key] || !!MEGA_DATA[myPoke.key + "x"];
            if (canMega && !myPoke.isMega) {
                html += '<button class="pk-btn pk-btn-xs" style="background:#9b59b6;color:#fff" data-action="poke_megaEvolve">💎 메가진화</button>';
            }
        }
        if (bd.type === "wild") html += '<button class="pk-btn pk-btn-gray pk-btn-xs" data-action="poke_run">🏃 도주</button>';
        html += '</div>';
    }
    return html;
}

function renderBattlePartySwitch() {
    var bd = gState.battleData;
    var html = '<div style="font-size:13px;color:#aaa;margin:6px 0">교체할 포켓몬을 선택:</div>';
    for (var i = 0; i < player.party.length; i++) {
        var p = player.party[i]; var pd = POKEDEX[p.key];
        if (p.currentHp <= 0) continue;
        if (bd && i === bd.myIdx) continue;
        html += '<button class="pk-btn pk-btn-dark pk-btn-block" style="justify-content:flex-start;margin:2px 0" data-action="poke_switchInBattle" data-args="' + i + '">';
        html += (pd?pd.em:"?") + ' ' + p.nickname + ' Lv.' + p.level + ' HP:' + p.currentHp + '/' + p.stats[0];
        html += '</button>';
    }
    if (bd && bd.type !== "trainer") {
        html += '<button class="pk-btn pk-btn-gray pk-btn-sm" data-action="poke_back" style="margin-top:4px">취소</button>';
    }
    return html;
}

function renderPartyScreen() {
    var html = '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 뒤로</button>';
    html += '<div style="font-size:15px;font-weight:bold;margin:8px 0">👥 파티 (' + player.party.length + '/' + MAX_PARTY + ')</div>';
    for (var i = 0; i < player.party.length; i++) {
        var p = player.party[i]; var pd = POKEDEX[p.key];
        html += '<div class="pk-card" style="display:flex;align-items:center;gap:8px;cursor:pointer" data-action="poke_showSummary" data-args="' + i + '">';
        html += '<div style="font-size:24px">' + (pd?pd.em:"?") + '</div>';
        html += '<div style="flex:1">';
        html += '<div style="font-weight:bold">' + p.nickname + (p.heldItem && ITEMS[p.heldItem] ? ' 🫐' + ITEMS[p.heldItem].n : '') + ' <span style="color:#aaa;font-size:11px">Lv.' + p.level + '</span></div>';
        html += '<div style="font-size:11px">HP: ' + p.currentHp + '/' + p.stats[0] + '</div>';
        html += hpBar(p.currentHp, p.stats[0]);
        if (p.status) html += '<span style="font-size:10px;color:#e74c3c">⚠️ ' + statusName(p.status) + '</span>';
        html += '</div></div>';
        html += '<div style="display:flex;gap:4px;margin:-6px 0 4px 36px">';
        if (i > 0) html += '<button class="pk-btn pk-btn-dark pk-btn-xs" data-action="poke_partyMoveUp" data-args="' + i + '">⬆️</button>';
        if (i < player.party.length - 1) html += '<button class="pk-btn pk-btn-dark pk-btn-xs" data-action="poke_partyMoveDown" data-args="' + i + '">⬇️</button>';
        html += '<button class="pk-btn pk-btn-blue pk-btn-xs" data-action="poke_giveBerry" data-args="' + i + '">🫐열매</button>';
        if (p.heldItem) html += '<button class="pk-btn pk-btn-yellow pk-btn-xs" data-action="poke_takeBerry" data-args="' + i + '">열매회수</button>';
        var pData = POKEDEX[p.key];
        if (p.canEvolve && pData && pData.e && p.level >= pData.e.l) {
            html += '<button class="pk-btn pk-btn-green pk-btn-xs" data-action="poke_startEvolve" data-args="' + i + '">✨ 진화하기</button>';
        }
        html += '</div>';
    }
    return html;
}

function renderPCScreen() {
    var html = '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 뒤로</button>';
    html += '<div style="font-size:15px;font-weight:bold;margin:8px 0">💻 PC 보관함 (' + player.pc.length + ')</div>';
    if (player.pc.length === 0) { html += '<div style="color:#aaa;text-align:center;margin:20px 0">비어있습니다</div>'; return html; }
    for (var i = 0; i < player.pc.length; i++) {
        var p = player.pc[i]; var pd = POKEDEX[p.key];
        html += '<div class="pk-card" style="display:flex;align-items:center;justify-content:space-between;gap:8px">';
        html += '<div style="display:flex;align-items:center;gap:8px">';
        html += '<div style="font-size:20px">' + (pd?pd.em:"?") + '</div>';
        html += '<div><div style="font-weight:bold;font-size:13px">' + p.nickname + ' Lv.' + p.level + '</div>';
        html += '<div style="font-size:11px">HP: ' + p.currentHp + '/' + p.stats[0] + '</div></div>';
        html += '</div>';
        if (player.party.length < MAX_PARTY) {
            html += '<button class="pk-btn pk-btn-blue pk-btn-xs" data-action="poke_withdrawPC" data-args="' + i + '">가져오기</button>';
        }
        html += '</div>';
    }
    if (player.party.length > 1) {
        html += '<div style="font-size:12px;color:#aaa;margin:8px 0">파티에서 맡기기:</div>';
        for (var i = 0; i < player.party.length; i++) {
            var p = player.party[i]; var pd = POKEDEX[p.key];
            html += '<button class="pk-btn pk-btn-dark pk-btn-sm" style="margin:2px" data-action="poke_depositPC" data-args="' + i + '">' + (pd?pd.em:"?") + ' ' + p.nickname + ' → PC</button>';
        }
    }
    return html;
}

function renderShopScreen() {
    var html = '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 뒤로</button>';
    html += '<div style="font-size:15px;font-weight:bold;margin:8px 0">🏪 상점 <span class="pk-gold" style="font-size:13px">💰 ₩' + player.gold.toLocaleString() + '</span></div>';
    var road = getCurrentRoad();
    var shopItems = (road && road.shopItems) ? road.shopItems : ["pokeball","superball","ultraball","potion","superpotion","hyperpotion","fullrestore","revive","antidote","paralyzeheal","awakening"];
    for (var i = 0; i < shopItems.length; i++) {
        var k = shopItems[i]; var item = ITEMS[k]; if (!item || item.buy >= 99999) continue;
        html += '<div class="pk-card" style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px">';
        html += '<div><div style="font-weight:bold;font-size:13px">' + item.n + '</div>';
        html += '<div style="font-size:10px;color:#aaa">' + item.desc + '</div></div>';
        html += '<div style="display:flex;gap:4px;align-items:center">';
        html += '<span style="font-size:12px" class="pk-gold">₩' + item.buy + '</span>';
        html += '<button class="pk-btn pk-btn-blue pk-btn-xs" data-action="poke_buyItem" data-args="' + k + '"' + (player.gold < item.buy?' disabled':'') + '>구매</button>';
        html += '</div></div>';
    }
    // 판매
    html += '<div style="font-size:13px;font-weight:bold;margin:12px 0 4px">📤 판매</div>';
    var bagKeys = Object.keys(player.bag);
    for (var i = 0; i < bagKeys.length; i++) {
        var k = bagKeys[i]; var item = ITEMS[k]; if (!item) continue;
        html += '<div class="pk-card" style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px">';
        html += '<div style="font-size:13px">' + item.n + ' x' + player.bag[k] + '</div>';
        html += '<div style="display:flex;gap:4px;align-items:center">';
        html += '<span style="font-size:12px" class="pk-gold">₩' + item.sell + '</span>';
        html += '<button class="pk-btn pk-btn-yellow pk-btn-xs" data-action="poke_sellItem" data-args="' + k + '">판매</button>';
        html += '</div></div>';
    }
    return html;
}

function renderBagScreen() {
    var html = '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 뒤로</button>';
    html += '<div style="font-size:15px;font-weight:bold;margin:8px 0">🎒 가방</div>';
    var bagKeys = Object.keys(player.bag);
    if (bagKeys.length === 0) { html += '<div style="color:#aaa;text-align:center;margin:20px 0">비어있습니다</div>'; return html; }
    for (var i = 0; i < bagKeys.length; i++) {
        var k = bagKeys[i]; var item = ITEMS[k]; if (!item) continue;
        html += '<div class="pk-card" style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px">';
        html += '<div><div style="font-weight:bold;font-size:13px">' + item.n + ' x' + player.bag[k] + '</div>';
        html += '<div style="font-size:10px;color:#aaa">' + item.desc + '</div></div>';
        if (item.type === "tm") {
            html += '<button class="pk-btn pk-btn-green pk-btn-xs" data-action="poke_useTM" data-args="' + k + '">가르치기</button>';
        } else if (item.type === "battle") {
            if (gState.battleData) {
                html += '<button class="pk-btn pk-btn-green pk-btn-xs" data-action="poke_useBattleItem" data-args="' + k + '">사용</button>';
            }
        } else if (item.type === "key") {
            html += '<span style="font-size:11px;color:#f1c40f">🔑 키 아이템</span>';
        } else if (item.type !== "ball" && item.type !== "etc") {
            html += '<button class="pk-btn pk-btn-green pk-btn-xs" data-action="poke_useItemSelect" data-args="' + k + '">사용</button>';
        }
        html += '</div>';
    }
    return html;
}

function renderTmPartySelect() {
    var tmKey = gState.tmItemKey;
    var item = ITEMS[tmKey];
    if (!item) return '';
    var moveKey = item.value;
    var move = MOVES[moveKey];
    var html = '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 뒤로</button>';
    html += '<div style="font-size:15px;font-weight:bold;margin:8px 0">💿 ' + item.n + '</div>';
    html += '<div style="font-size:12px;color:#aaa;margin-bottom:8px">' + (move ? typeSpan(move.t) + ' ' + move.n + ' | 위력:' + (move.p||"-") + ' | PP:' + move.pp : '???') + '</div>';
    html += '<div style="font-size:13px;margin-bottom:8px">기술을 배울 포켓몬을 선택하세요:</div>';
    for (var i = 0; i < player.party.length; i++) {
        var p = player.party[i];
        var pd = POKEDEX[p.key]; var em = pd ? pd.em : "?";
        var alreadyKnows = false;
        for (var j = 0; j < p.moves.length; j++) { if (p.moves[j].key === moveKey) { alreadyKnows = true; break; } }
        html += '<div class="pk-card" style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px">';
        html += '<div><span style="font-size:16px">' + em + '</span> <span style="font-weight:bold">' + p.nickname + '</span> <span style="color:#aaa;font-size:11px">Lv.' + p.level + '</span>';
        html += '<div style="font-size:10px;color:#888">';
        for (var j = 0; j < p.moves.length; j++) { var mv = MOVES[p.moves[j].key]; html += (mv ? mv.n : '?') + (j < p.moves.length-1 ? ', ' : ''); }
        html += '</div></div>';
        if (alreadyKnows) { html += '<span style="font-size:11px;color:#888">이미 알고있음</span>'; }
        else if (!canLearnTM(p, tmKey)) { html += '<span style="font-size:11px;color:#e74c3c">❌ 배울 수 없음</span>'; }
        else { html += '<button class="pk-btn pk-btn-green pk-btn-sm" data-action="poke_teachTM" data-args="' + i + '">가르치기</button>'; }
        html += '</div>';
    }
    return html;
}

function renderItemPartySelect() {
    var itemKey = gState.useItemKey;
    var item = ITEMS[itemKey];
    if (!item) return '';
    var html = '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 뒤로</button>';
    html += '<div style="font-size:15px;font-weight:bold;margin:8px 0">💊 ' + item.n + '</div>';
    html += '<div style="font-size:12px;color:#aaa;margin-bottom:8px">' + item.desc + '</div>';
    html += '<div style="font-size:13px;margin-bottom:8px">사용할 포켓몬을 선택하세요:</div>';
    for (var i = 0; i < player.party.length; i++) {
        var p = player.party[i];
        var pd = POKEDEX[p.key]; var em = pd ? pd.em : "?";
        var canUse = true;
        if (item.type === "heal") { if (p.currentHp <= 0 || p.currentHp >= p.stats[0]) canUse = false; }
        else if (item.type === "fullheal") { if (p.currentHp <= 0) canUse = false; }
        else if (item.type === "revive") { if (p.currentHp > 0) canUse = false; }
        else if (item.type === "cure") { if (!p.status || (item.value !== "all" && p.status !== item.value)) canUse = false; }
        var hpPct = p.stats[0] > 0 ? Math.floor(p.currentHp / p.stats[0] * 100) : 0;
        var hpColor = hpPct > 50 ? "#4CAF50" : (hpPct > 20 ? "#FF9800" : "#f44336");
        html += '<div class="pk-card" style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px">';
        html += '<div><span style="font-size:16px">' + em + '</span> <span style="font-weight:bold">' + p.nickname + '</span> <span style="color:#aaa;font-size:11px">Lv.' + p.level + '</span>';
        html += '<div style="font-size:10px;color:#888">HP: <span style="color:' + hpColor + '">' + p.currentHp + '/' + p.stats[0] + '</span>' + (p.status ? ' [' + p.status + ']' : '') + '</div>';
        html += '</div>';
        if (canUse) {
            html += '<button class="pk-btn pk-btn-green pk-btn-sm" data-action="poke_useItemOnPoke" data-args="' + i + '">사용</button>';
        } else {
            html += '<span style="font-size:11px;color:#888">사용불가</span>';
        }
        html += '</div>';
    }
    return html;
}


function renderSummaryScreen() {
    var idx = gState.summaryIdx || 0;
    var poke = player.party[idx];
    if (!poke) return '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 뒤로</button><div>포켓몬 없음</div>';
    var pd = POKEDEX[poke.key];
    var html = '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 뒤로</button>';
    html += '<div class="pk-card" style="text-align:center">';
    html += '<div style="font-size:36px">' + (pd?pd.em:"?") + '</div>';
    html += '<div style="font-size:18px;font-weight:bold">' + poke.nickname + '</div>';
    html += '<div style="color:#aaa;font-size:12px">Lv.' + poke.level + ' | EXP: ' + poke.exp + ' / ' + (getExpForLevel(poke.level+1)-getExpForLevel(poke.level)) + '</div>';
    if (pd) { for (var i = 0; i < pd.t.length; i++) html += typeSpan(pd.t[i]); }
    // 특성 표시
    var _abKey = getAbilityKey(poke);
    var _ab = _abKey ? ABILITIES[_abKey] : null;
    if (_ab) {
        html += '<div style="margin-top:4px"><span style="font-size:11px;color:#9b59b6">⭐ 특성: ' + _ab.n + '</span> <span style="font-size:10px;color:#777">' + _ab.desc + '</span></div>';
    }
    if (poke.heldItem && ITEMS[poke.heldItem]) {
        html += '<div style="margin-top:2px"><span style="font-size:11px;color:#27ae60">🫐 지닌물건: ' + ITEMS[poke.heldItem].n + '</span></div>';
    }
    html += '</div>';
    // 스탯
    html += '<div class="pk-card">';
    html += '<div style="font-size:12px;font-weight:bold;margin-bottom:4px">📊 능력치</div>';
    var statNames = ["HP","공격","방어","특공","특방","스피드"];
    for (var i = 0; i < 6; i++) {
        var pct = Math.min(100, Math.round((poke.stats[i] / (i===0?300:200)) * 100));
        html += '<div style="display:flex;align-items:center;gap:6px;font-size:11px;margin:2px 0">';
        html += '<span style="width:40px;color:#aaa">' + statNames[i] + '</span>';
        html += '<div style="flex:1;height:6px;background:#333;border-radius:3px"><div style="height:100%;width:' + pct + '%;background:#3498db;border-radius:3px"></div></div>';
        html += '<span style="width:30px;text-align:right">' + poke.stats[i] + '</span>';
        html += '</div>';
    }
    html += '</div>';
    // 기술
    html += '<div class="pk-card">';
    html += '<div style="font-size:12px;font-weight:bold;margin-bottom:4px">⚔️ 기술</div>';
    for (var i = 0; i < poke.moves.length; i++) {
        var m = poke.moves[i]; var mv = MOVES[m.key]; if (!mv) continue;
        html += '<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:2px 0">';
        html += '<span>' + typeSpan(mv.t) + ' ' + mv.n + '</span>';
        html += '<span style="color:#aaa">' + (mv.c==="status"?"변화":mv.c==="physical"?"물리":"특수") + ' | ' + (mv.p||"-") + ' | PP:' + m.ppLeft + '/' + mv.pp + '</span>';
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function renderMoveLearnScreen() {
    var ml = gState.pendingMoveLearn;
    if (!ml) return '';
    var poke = player.party[ml.pokeIdx];
    if (!poke) { gState.pendingMoveLearn = null; return ''; }
    var newMv = MOVES[ml.moveKey];
    if (!newMv) { gState.pendingMoveLearn = null; return ''; }
    var html = '<div style="text-align:center;padding:10px">';
    html += '<div style="font-size:15px;font-weight:bold">' + poke.nickname + '은(는) ' + newMv.n + '을(를) 배우려 한다!</div>';
    html += '<div style="color:#aaa;font-size:12px;margin:4px 0">기술이 4개입니다. 하나를 잊어야 합니다.</div>';
    html += '<div style="margin:8px 0">';
    html += '<div style="font-size:12px;font-weight:bold;color:#3498db;margin-bottom:4px">새 기술:</div>';
    html += '<div class="pk-card" style="border-color:#3498db;padding:6px">' + typeSpan(newMv.t) + ' ' + newMv.n + ' | ' + (newMv.p||"-") + ' | PP:' + newMv.pp + '</div>';
    html += '</div>';
    html += '<div style="font-size:12px;font-weight:bold;color:#e74c3c;margin-bottom:4px">잊을 기술 선택:</div>';
    for (var i = 0; i < poke.moves.length; i++) {
        var mv = MOVES[poke.moves[i].key]; if (!mv) continue;
        html += '<button class="pk-btn pk-btn-dark pk-btn-block" style="margin:3px 0" data-action="poke_forgetMove" data-args="' + i + '">';
        html += typeSpan(mv.t) + ' ' + mv.n + ' | ' + (mv.p||"-") + ' | PP:' + mv.pp;
        html += '</button>';
    }
    html += '<button class="pk-btn pk-btn-gray pk-btn-block" style="margin-top:8px" data-action="poke_cancelLearn">배우지 않기</button>';
    html += '</div>';
    return html;
}

function renderEvolutionScreen() {
    var evo = gState.pendingEvo;
    if (!evo) return '';
    var poke = player.party[evo.pokeIdx];
    var fromData = POKEDEX[evo.from];
    var toData = POKEDEX[evo.to];
    var html = '<div style="text-align:center;padding:20px">';
    html += '<div style="font-size:20px;margin-bottom:10px">✨ 진화!</div>';
    html += '<div style="display:flex;justify-content:center;align-items:center;gap:20px;margin:10px 0">';
    html += '<div><div style="font-size:40px">' + (fromData?fromData.em:"?") + '</div><div>' + (fromData?fromData.n:"?") + '</div></div>';
    html += '<div style="font-size:24px">→</div>';
    html += '<div><div style="font-size:40px">' + (toData?toData.em:"?") + '</div><div>' + (toData?toData.n:"?") + '</div></div>';
    html += '</div>';
    html += '<div style="display:flex;gap:8px;justify-content:center;margin-top:10px">';
    html += '<button class="pk-btn pk-btn-green" data-action="poke_evolve">진화시키기!</button>';
    html += '<button class="pk-btn pk-btn-gray" data-action="poke_cancelEvolve">취소</button>';
    html += '</div></div>';
    return html;
}

function renderLogScreen() {
    var html = '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 뒤로</button>';
    html += '<div style="font-size:15px;font-weight:bold;margin:8px 0">📋 이벤트 로그</div>';
    var logs = gState.log || [];
    for (var i = 0; i < logs.length; i++) {
        html += '<div class="pk-log-entry pk-log-' + logs[i].type + '">' + logs[i].msg + '</div>';
    }
    return html;
}

function getLearnableMoves(poke) {
    var data = POKEDEX[poke.key];
    if (!data || !data.ml) return [];
    var result = [];
    var levels = Object.keys(data.ml);
    for (var li = 0; li < levels.length; li++) {
        var lv = parseInt(levels[li]);
        if (lv > poke.level) continue;
        var moveKeys = data.ml[levels[li]];
        if (typeof moveKeys === "string") moveKeys = [moveKeys];
        for (var mi = 0; mi < moveKeys.length; mi++) {
            var mk = moveKeys[mi];
            var knows = false;
            for (var j = 0; j < poke.moves.length; j++) {
                if (poke.moves[j].key === mk) { knows = true; break; }
            }
            if (!knows && MOVES[mk]) result.push(mk);
        }
    }
    return result;
}

function renderMoveRelearnerScreen() {
    var html = '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 뒤로</button>';
    html += '<div style="font-size:15px;font-weight:bold;margin:8px 0">📖 기술 생각해내기</div>';
    html += '<div style="color:#aaa;font-size:12px;margin-bottom:8px">잊어버린 기술을 다시 배울 수 있습니다. 포켓몬을 선택하세요.</div>';
    for (var i = 0; i < player.party.length; i++) {
        var p = player.party[i]; var pd = POKEDEX[p.key];
        if (!pd || !pd.ml) continue;
        var learnableMoves = getLearnableMoves(p);
        html += '<button class="pk-btn pk-btn-dark pk-btn-block" style="margin:3px 0;text-align:left" data-action="poke_relearnerSelectPoke" data-args="' + i + '">';
        html += (pd?pd.em:"?") + ' ' + p.nickname + ' Lv.' + p.level;
        html += ' <span style="color:#aaa;font-size:10px">(' + learnableMoves.length + '개 배울 수 있음)</span>';
        html += '</button>';
    }
    return html;
}

function renderMoveRelearnerMovesScreen() {
    var idx = gState.relearnerPokeIdx;
    var poke = player.party[idx];
    if (!poke) return '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_openMoveRelearner">◀ 뒤로</button><div>포켓몬 없음</div>';
    var pd = POKEDEX[poke.key];
    var html = '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_openMoveRelearner">◀ 뒤로</button>';
    html += '<div style="font-size:15px;font-weight:bold;margin:8px 0">📖 ' + poke.nickname + '의 배울 수 있는 기술</div>';
    html += '<div style="color:#aaa;font-size:11px;margin-bottom:4px">현재 기술: ' + poke.moves.length + '/4</div>';
    var learnableMoves = getLearnableMoves(poke);
    if (learnableMoves.length === 0) {
        html += '<div style="color:#aaa;text-align:center;margin:20px 0">배울 수 있는 기술이 없습니다.</div>';
        return html;
    }
    for (var i = 0; i < learnableMoves.length; i++) {
        var mk = learnableMoves[i];
        var mv = MOVES[mk];
        if (!mv) continue;
        html += '<div class="pk-card" style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px">';
        html += '<div>';
        html += '<div style="font-weight:bold;font-size:13px">' + typeSpan(mv.t) + ' ' + mv.n + '</div>';
        html += '<div style="font-size:10px;color:#aaa">' + (mv.c==="status"?"변화":mv.c==="physical"?"물리":"특수") + ' | 위력:' + (mv.p||"-") + ' | 명중:' + (mv.a||"-") + ' | PP:' + mv.pp + '</div>';
        html += '</div>';
        html += '<button class="pk-btn pk-btn-green pk-btn-xs" data-action="poke_relearnerLearnMove" data-args="' + mk + '">배우기</button>';
        html += '</div>';
    }
    return html;
}

function renderStatusScreen() {
    var html = '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 뒤로</button>';
    html += '<div style="font-size:15px;font-weight:bold;margin:8px 0">📊 캐릭터 상태</div>';
    if (!player) { html += '<div style="color:#aaa">세이브 없음</div>'; return html; }
    // 기본 정보
    var regionData = REGIONS[player.region];
    var regionName = regionData ? regionData.n : player.region;
    var curRoad = (regionData && regionData.roads[player.roadIdx]) ? regionData.roads[player.roadIdx].n : "???";
    var totalBadges = 0;
    var badgeList = [];
    for (var rk in player.badges) {
        if (player.badges[rk] && player.badges[rk].length > 0) {
            totalBadges += player.badges[rk].length;
            badgeList.push(rk + ": " + player.badges[rk].length);
        }
    }
    html += '<div class="pk-card">';
    html += '<div style="font-size:13px;font-weight:bold;margin-bottom:4px">👤 기본 정보</div>';
    html += '<div style="font-size:12px;color:#ccc">이름: ' + player.name + '</div>';
    html += '<div style="font-size:12px;color:#ccc">💰 소지금: ₩' + (player.gold||0).toLocaleString() + '</div>';
    html += '<div style="font-size:12px;color:#ccc">📍 현재 위치: ' + regionName + ' - ' + curRoad + '</div>';
    html += '<div style="font-size:12px;color:#ccc">📅 ' + (player.day||1) + '일차 / ' + (TIME_NAMES[player.timeOfDay]||"???") + '</div>';
    html += '<div style="font-size:12px;color:#ccc">🏅 뱃지: ' + totalBadges + '개' + (badgeList.length > 0 ? ' (' + badgeList.join(', ') + ')' : '') + '</div>';
    html += '<div style="font-size:12px;color:#ccc">⚔️ 총 배틀: ' + (player.battleCount||0) + '회</div>';
    html += '</div>';
    // 도감
    var dexCount = 0;
    if (player.pokedex) { for (var dk in player.pokedex) dexCount++; }
    html += '<div class="pk-card">';
    html += '<div style="font-size:13px;font-weight:bold;margin-bottom:4px">📖 도감: ' + dexCount + ' / 721</div>';
    html += '</div>';
    // 파티
    html += '<div class="pk-card">';
    html += '<div style="font-size:13px;font-weight:bold;margin-bottom:4px">👥 파티 (' + player.party.length + '/' + MAX_PARTY + ')</div>';
    var statNames = ["HP","공격","방어","특공","특방","스피드"];
    for (var pi = 0; pi < player.party.length; pi++) {
        var p = player.party[pi];
        var pData = POKEDEX[p.key];
        var types = pData ? p.key : "???";
        if (pData && pData.t) { types = pData.t.join("/"); }
        html += '<div style="border-top:1px solid rgba(255,255,255,0.1);padding:6px 0;margin-top:4px">';
        html += '<div style="display:flex;align-items:center;gap:6px">';
        html += '<span style="font-size:20px">' + (pData?pData.em:"?") + '</span>';
        html += '<div>';
        html += '<div style="font-size:13px;font-weight:bold;color:#fff">' + p.nickname + ' <span style="color:#aaa;font-size:11px">Lv.' + p.level + '</span></div>';
        html += '<div style="font-size:11px;color:#aaa">' + types.toUpperCase() + '</div>';
        html += '</div></div>';
        // HP
        html += '<div style="font-size:11px;color:#ccc;margin-top:3px">❤️ HP: ' + p.currentHp + ' / ' + p.stats[0];
        if (p.status) html += ' <span style="color:#e74c3c">[' + statusName(p.status) + ']</span>';
        html += '</div>';
        // 능력치
        html += '<div style="font-size:11px;color:#aaa;margin-top:2px">📊 ';
        for (var si = 1; si < 6; si++) {
            html += statNames[si] + ':' + p.stats[si];
            if (si < 5) html += ' / ';
        }
        html += '</div>';
        // 특성
        var _abKey = getAbilityKey(p);
        var _ab = _abKey ? ABILITIES[_abKey] : null;
        if (_ab) {
            html += '<div style="font-size:11px;color:#9b59b6;margin-top:2px">⭐ 특성: ' + _ab.n + '</div>';
        }
        // 지닌물건
        if (p.heldItem && ITEMS[p.heldItem]) {
            html += '<div style="font-size:11px;color:#27ae60;margin-top:2px">🫐 지닌물건: ' + ITEMS[p.heldItem].n + '</div>';
        }
        // 기술
        html += '<div style="font-size:11px;color:#3498db;margin-top:2px">⚔️ 기술: ';
        var moveNames = [];
        for (var mi = 0; mi < p.moves.length; mi++) {
            var mv = MOVES[p.moves[mi].key];
            if (mv) moveNames.push(mv.n + '(' + p.moves[mi].ppLeft + '/' + mv.pp + ')');
        }
        html += moveNames.join(', ');
        html += '</div>';
        html += '</div>';
    }
    html += '</div>';
    // PC
    html += '<div class="pk-card">';
    html += '<div style="font-size:13px;font-weight:bold;margin-bottom:4px">💻 PC (' + (player.pc ? player.pc.length : 0) + '마리)</div>';
    if (player.pc && player.pc.length > 0) {
        var pcGroups = {};
        for (var ci = 0; ci < player.pc.length; ci++) {
            var ck = player.pc[ci].nickname + " Lv." + player.pc[ci].level;
            pcGroups[ck] = (pcGroups[ck]||0) + 1;
        }
        var pcList = [];
        for (var gk in pcGroups) {
            pcList.push(gk + (pcGroups[gk] > 1 ? ' x' + pcGroups[gk] : ''));
        }
        html += '<div style="font-size:11px;color:#aaa;max-height:120px;overflow-y:auto">' + pcList.join(', ') + '</div>';
    } else {
        html += '<div style="font-size:11px;color:#666">비어 있음</div>';
    }
    html += '</div>';
    // 가방
    html += '<div class="pk-card">';
    var bagCount = 0;
    var bagHtml = '';
    if (player.bag) {
        var bagKeys = Object.keys(player.bag).sort();
        for (var bi = 0; bi < bagKeys.length; bi++) {
            var bk = bagKeys[bi];
            if (player.bag[bk] > 0 && ITEMS[bk]) {
                bagHtml += '<div style="font-size:11px;color:#ccc;padding:1px 0">' + ITEMS[bk].n + ' x' + player.bag[bk] + '</div>';
                bagCount += player.bag[bk];
            }
        }
    }
    html += '<div style="font-size:13px;font-weight:bold;margin-bottom:4px">🎒 가방 (총 ' + bagCount + '개)</div>';
    if (bagHtml) {
        html += '<div style="max-height:150px;overflow-y:auto">' + bagHtml + '</div>';
    } else {
        html += '<div style="font-size:11px;color:#666">비어 있음</div>';
    }
    html += '</div>';
    return html;
}

function renderSaveSlots() {
    var html = '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 뒤로</button>';
    html += '<div style="font-size:15px;font-weight:bold;margin:8px 0">💾 저장 슬롯</div>';
    html += '<div id="pk-slot-list"><div style="text-align:center;color:#aaa">로딩 중...</div></div>';
    return html;
}

function renderPokedexScreen() {
    var html = '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 뒤로</button>';
    var seen = 0; var caught = 0;
    var dexKeys = Object.keys(player.pokedex || {});
    for (var di = 0; di < dexKeys.length; di++) {
        seen++;
        if (player.pokedex[dexKeys[di]] === "caught" || player.pokedex[dexKeys[di]] === true) caught++;
    }
    var total = Object.keys(POKEDEX).length;
    html += '<div style="font-size:15px;font-weight:bold;margin:8px 0">📖 포켓몬 도감 <span style="font-size:12px;color:#aaa">발견 ' + seen + ' | 포획 ' + caught + ' / ' + total + '</span></div>';
    html += '<div class="pk-dex-grid">';
    // 번호순 정렬
    var entries = [];
    var keys = Object.keys(POKEDEX);
    for (var i = 0; i < keys.length; i++) {
        entries.push({k: keys[i], data: POKEDEX[keys[i]]});
    }
    entries.sort(function(a,b){ return a.data.id - b.data.id; });
    for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        var dexVal = player.pokedex ? player.pokedex[e.k] : null;
        var isSeen = !!dexVal;
        var isCaught = (dexVal === "caught" || dexVal === true);
        var ballIcon = isCaught ? '<span style="color:#e74c3c">●</span>' : (isSeen ? '<span style="color:#333">●</span>' : '');
        html += '<div class="pk-dex-item ' + (isSeen ? (isCaught ? 'pk-dex-caught' : 'pk-dex-seen') : 'pk-dex-unseen') + '"' + (isSeen ? ' data-action="poke_pokedexDetail" data-args="' + e.k + '" style="cursor:pointer"' : '') + '>';
        html += '<div style="font-size:18px">' + (isSeen ? e.data.em : '?') + '</div>';
        html += '<div style="font-size:9px">#' + e.data.id + ' ' + ballIcon + '</div>';
        html += '<div style="font-size:9px">' + (isSeen ? e.data.n : '???') + '</div>';
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function renderPokedexDetail() {
    var key = gState.pokedexKey;
    var pd = POKEDEX[key];
    if (!pd) return '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_backToPokedex">◀ 도감</button><div>데이터 없음</div>';
    var html = '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_backToPokedex">◀ 도감 목록</button>';
    // Header
    html += '<div class="pk-card" style="text-align:center;padding:12px;margin:8px 0">';
    html += '<div style="font-size:40px">' + pd.em + '</div>';
    html += '<div style="font-size:16px;font-weight:bold;margin:4px 0">' + pd.n + ' <span style="color:#aaa;font-size:12px">#' + pd.id + '</span></div>';
    html += '<div style="margin:4px 0">';
    for (var ti = 0; ti < pd.t.length; ti++) {
        html += typeSpan(pd.t[ti]) + ' ';
    }
    html += '</div>';
    html += '</div>';
    // Base stats
    var statNames = ["HP", "공격", "방어", "특공", "특방", "스피드"];
    html += '<div class="pk-card" style="padding:8px;margin:6px 0">';
    html += '<div style="font-size:13px;font-weight:bold;margin-bottom:6px">📊 종족값</div>';
    var totalStat = 0;
    for (var si = 0; si < 6; si++) {
        var val = pd.s[si];
        totalStat += val;
        var barPct = Math.min(100, Math.round((val / 255) * 100));
        var barColor = val >= 100 ? "#27ae60" : (val >= 60 ? "#f5c518" : "#e74c3c");
        html += '<div style="display:flex;align-items:center;gap:6px;margin:2px 0;font-size:11px">';
        html += '<span style="width:45px;text-align:right;color:#aaa">' + statNames[si] + '</span>';
        html += '<span style="width:30px;text-align:right;font-weight:bold">' + val + '</span>';
        html += '<div style="flex:1;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden">';
        html += '<div style="width:' + barPct + '%;height:100%;background:' + barColor + ';border-radius:4px"></div>';
        html += '</div></div>';
    }
    html += '<div style="font-size:11px;color:#aaa;text-align:right;margin-top:4px">합계: ' + totalStat + '</div>';
    html += '</div>';
    // Moves learnable by level
    if (pd.ml) {
        html += '<div class="pk-card" style="padding:8px;margin:6px 0">';
        html += '<div style="font-size:13px;font-weight:bold;margin-bottom:6px">📚 레벨업 기술</div>';
        var levels = Object.keys(pd.ml).sort(function(a, b) { return parseInt(a) - parseInt(b); });
        for (var li = 0; li < levels.length; li++) {
            var lv = levels[li];
            var moveKeys = pd.ml[lv];
            if (typeof moveKeys === "string") moveKeys = [moveKeys];
            for (var mi = 0; mi < moveKeys.length; mi++) {
                var mv = MOVES[moveKeys[mi]];
                if (!mv) continue;
                html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;font-size:11px;border-bottom:1px solid rgba(255,255,255,0.05)">';
                html += '<span><span style="color:#aaa;width:30px;display:inline-block">Lv.' + lv + '</span> ' + typeSpan(mv.t) + ' ' + mv.n + '</span>';
                html += '<span style="color:#aaa">' + (mv.c === "status" ? "변화" : (mv.c === "physical" ? "물리" : "특수")) + (mv.p > 0 ? ' 위력:' + mv.p : '') + '</span>';
                html += '</div>';
            }
        }
        html += '</div>';
    }
    // Evolution info
    html += '<div class="pk-card" style="padding:8px;margin:6px 0">';
    html += '<div style="font-size:13px;font-weight:bold;margin-bottom:6px">🔄 진화</div>';
    if (pd.e) {
        var evoPd = POKEDEX[pd.e.to];
        html += '<div style="font-size:12px">' + pd.em + ' ' + pd.n + ' → ';
        html += '<span style="font-weight:bold">' + (evoPd ? evoPd.em + ' ' + evoPd.n : pd.e.to) + '</span>';
        html += ' <span style="color:#aaa">(Lv.' + pd.e.l + ')</span></div>';
    } else {
        // Check if anything evolves into this
        var preEvo = null;
        var pKeys = Object.keys(POKEDEX);
        for (var pi = 0; pi < pKeys.length; pi++) {
            var pe = POKEDEX[pKeys[pi]];
            if (pe.e && pe.e.to === key) { preEvo = {key: pKeys[pi], data: pe}; break; }
        }
        if (preEvo) {
            html += '<div style="font-size:12px">' + preEvo.data.em + ' ' + preEvo.data.n + ' → ' + pd.em + ' ' + pd.n + ' (최종 진화)</div>';
        } else {
            html += '<div style="font-size:12px;color:#aaa">진화하지 않는 포켓몬</div>';
        }
    }
    html += '</div>';
    // Flavor text based on type
    var flavorTypes = {
        fire: "뜨거운 불꽃의 힘을 지닌 포켓몬이다.",
        water: "물의 힘을 자유자재로 다루는 포켓몬이다.",
        grass: "자연의 에너지를 흡수하여 성장하는 포켓몬이다.",
        electric: "강력한 전기를 발생시키는 포켓몬이다.",
        ice: "극한의 냉기를 내뿜는 포켓몬이다.",
        fighting: "단련된 육체로 강력한 격투 기술을 구사한다.",
        poison: "독을 사용하여 적을 약화시키는 포켓몬이다.",
        ground: "대지의 힘을 이용하여 싸우는 포켓몬이다.",
        flying: "하늘을 자유롭게 나는 포켓몬이다.",
        psychic: "초능력으로 상대를 제압하는 포켓몬이다.",
        bug: "작지만 놀라운 능력을 숨기고 있는 포켓몬이다.",
        rock: "바위처럼 단단한 몸을 가진 포켓몬이다.",
        ghost: "어둠 속에서 나타나는 신비한 포켓몬이다.",
        dragon: "전설적인 힘을 가진 드래곤 포켓몬이다.",
        dark: "어둠의 힘을 이용하여 싸우는 포켓몬이다.",
        steel: "강철같이 단단한 방어력을 자랑하는 포켓몬이다.",
        fairy: "신비로운 요정의 힘을 가진 포켓몬이다.",
        normal: "평범해 보이지만 다양한 기술을 배울 수 있는 포켓몬이다."
    };
    var flavor = flavorTypes[pd.t[0]] || "신비한 포켓몬이다.";
    html += '<div class="pk-card" style="padding:8px;margin:6px 0;font-size:12px;color:#ccc;font-style:italic">';
    html += '📝 ' + flavor;
    html += '</div>';
    return html;
}

// ── 체육관 화면 ──
function renderGymScreen() {
    var html = '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 뒤로</button>';
    var regionKey = player.region;
    var gymList = GYMS[regionKey];
    if (!gymList) return html + '<div>체육관 데이터 없음</div>';
    var regionName = REGIONS[regionKey] ? REGIONS[regionKey].n : regionKey;
    var badges = player.badges[regionKey] || [];
    html += '<div style="font-size:15px;font-weight:bold;margin:8px 0">🏟️ ' + regionName + ' 체육관 <span style="font-size:12px;color:#aaa">🏅 ' + badges.length + '/8</span></div>';
    for (var g = 0; g < gymList.length; g++) {
        var gym = gymList[g];
        var hasBadge = (badges.indexOf(gym.id) !== -1);
        html += '<div class="pk-card" style="padding:8px;margin-bottom:6px;' + (hasBadge ? 'border-left:3px solid #f5c518' : '') + '">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center">';
        html += '<div>';
        html += '<span style="font-weight:bold;font-size:13px">' + gym.city + '</span>';
        html += ' <span style="font-size:11px;color:#aaa">(' + typeSpan(gym.type) + ')</span>';
        html += '</div>';
        html += '<div>' + (hasBadge ? gym.badgeEm + ' <span style="font-size:11px;color:#f5c518">' + gym.badge + '</span>' : '<span style="font-size:11px;color:#666">미획득</span>') + '</div>';
        html += '</div>';
        // 관장 목록
        for (var l = 0; l < gym.leaders.length; l++) {
            var leader = gym.leaders[l];
            var gKey = gym.id + "_" + leader.id;
            var defeatedToday = (player.defeatedGyms[gKey] === player.day);
            var defeatedBefore = (player.defeatedGyms[gKey] !== undefined && !defeatedToday) || hasBadge;
            html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;margin-top:4px;border-top:1px solid rgba(255,255,255,0.05)">';
            html += '<div>';
            html += '<span style="font-size:14px">' + leader.em + '</span> ';
            html += '<span style="font-size:12px;font-weight:bold">' + leader.n + '</span>';
            if (gym.leaders.length > 1) html += ' <span style="font-size:10px;color:#888">(Gen ' + leader.gen + ')</span>';
            html += '<div style="font-size:10px;color:#aaa">';
            for (var p = 0; p < leader.pokemon.length; p++) {
                var tpd = POKEDEX[leader.pokemon[p].k];
                html += (tpd ? tpd.em : "?") + 'Lv.' + leader.pokemon[p].l + ' ';
            }
            html += '</div>';
            html += '<div style="font-size:10px;color:#f5c518">💰 ₩' + leader.reward + '</div>';
            html += '</div>';
            if (defeatedToday) {
                html += '<span style="font-size:11px;color:#27ae60">✅ 오늘 승리</span>';
            } else if (defeatedBefore) {
                html += '<span style="font-size:11px;color:#27ae60">✅ 승리</span>';
            } else {
                html += '<span style="font-size:11px;color:#e74c3c">❌ 미도전</span>';
            }
            html += '</div>';
        }
        html += '</div>';
    }
    html += '<div style="font-size:11px;color:#888;text-align:center;margin:8px 0">💡 체육관 도전은 해당 도시를 방문하세요</div>';
    return html;
}

// ── 뱃지 화면 ──
function renderBadgeScreen() {
    var html = '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 뒤로</button>';
    html += '<div style="font-size:15px;font-weight:bold;margin:8px 0">🏅 뱃지 컬렉션</div>';
    var regions = ["kanto", "johto", "hoenn", "sinnoh", "unova", "kalos"];
    var regionNames = {kanto: "관동 지방", johto: "성도 지방", hoenn: "호연 지방", sinnoh: "신오 지방", unova: "하나 지방", kalos: "칼로스 지방"};
    for (var r = 0; r < regions.length; r++) {
        var rk = regions[r];
        var gymList = GYMS[rk];
        var badges = player.badges[rk] || [];
        html += '<div style="font-size:14px;font-weight:bold;color:#f5c518;margin:10px 0 4px">' + regionNames[rk] + ' (' + badges.length + '/8)</div>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">';
        for (var g = 0; g < gymList.length; g++) {
            var gym = gymList[g];
            var hasBadge = (badges.indexOf(gym.id) !== -1);
            html += '<div style="background:' + (hasBadge ? 'rgba(245,197,24,0.15)' : 'rgba(255,255,255,0.03)') + ';border:1px solid ' + (hasBadge ? '#f5c518' : '#333') + ';border-radius:8px;padding:8px;text-align:center;width:70px">';
            html += '<div style="font-size:22px">' + (hasBadge ? gym.badgeEm : '❓') + '</div>';
            html += '<div style="font-size:10px;font-weight:bold;color:' + (hasBadge ? '#f5c518' : '#555') + '">' + (hasBadge ? gym.badge : '???') + '</div>';
            html += '<div style="font-size:9px;color:#888">' + gym.city + '</div>';
            html += '</div>';
        }
        html += '</div>';
    }
    return html;
}

function statusName(s) {
    var names = {burn:"화상🔥",poison:"독☠️",paralyze:"마비⚡",sleep:"잠듦💤",freeze:"얼음❄️",confuse:"혼란💫"};
    return names[s] || s;
}

// ═══════════════════════════════════════════════
// 🎯 이벤트 핸들러
// ═══════════════════════════════════════════════
window.poke_newGame = function() {
    gState = {phase:"overworld", subScreen:"starterSelect", battleData:null, pendingEvo:null, pendingMoveLearn:null, eventLog:[], log:[], starterRegion:"kanto"};
    render();
};

window.poke_freshStart = async function() {
    if (!player) { window.poke_newGame(); return; }
    // 빈 슬롯 찾아서 현재 진행 자동 저장
    var savedTo = 0;
    for (var fs = 1; fs <= 3; fs++) {
        var finfo = await getSlotInfo(fs);
        if (!finfo.exists) { savedTo = fs; break; }
    }
    if (savedTo > 0) {
        await saveSlot(savedTo);
        showToast("💾 현재 진행이 슬롯 " + savedTo + "에 저장되었습니다! 새 모험을 시작하세요!");
    } else {
        showToast("⚠️ 빈 슬롯이 없습니다! 저장 슬롯에서 하나를 비워주세요.");
        gState.subScreen = "saveSlots"; gState._confirmLoadSlot = null;
        render();
        return;
    }
    player = null;
    gState = {phase:"overworld", subScreen:"starterSelect", battleData:null, pendingEvo:null, pendingMoveLearn:null, eventLog:[], log:[], starterRegion:"kanto"};
    render();
};

window.poke_continue = async function() {
    var loaded = await loadAll();
    if (loaded) { showToast("세이브 로드 완료!"); render(); }
    else { showToast("세이브 데이터가 없습니다!"); }
};

window.poke_setStarterRegion = function(region) {
    if (gState) gState.starterRegion = region;
    render();
};

window.poke_selectStarter = async function(key) {
    var region = (gState && gState.starterRegion) || "kanto";
    player = createNewPlayer("레드", key, region);
    gState.subScreen = null;
    gState.phase = "overworld";
    addLog("모험을 시작했다! 파트너: " + player.party[0].nickname, "info");
    await saveAll();
    render();
};

window.poke_switchRegion = async function(region) {
    if (!player) return;
    player.region = region;
    player.roadIdx = 0;
    await saveAll();
    render();
};

window.poke_changeName = async function() {
    var newName = prompt("새 이름을 입력하세요:", player.name);
    if (newName && newName.trim()) {
        player.name = newName.trim();
        await saveAll();
        render();
    }
};

window.poke_pokedexDetail = function(key) {
    if (!gState) return;
    gState.subScreen = "pokedexDetail";
    gState.pokedexKey = key;
    render();
};

window.poke_backToPokedex = function() {
    if (!gState) return;
    gState.subScreen = "pokedex";
    gState.pokedexKey = null;
    render();
};

window.poke_selectRoad = async function(idx) {
    idx = parseInt(idx, 10);
    if (isNaN(idx)) return;
    // 뱃지 체크: 도로 이동 조건
    var region = REGIONS[player.region];
    if (region && region.roads[idx] && region.roads[idx].reqBadges !== undefined) {
        var curBadges = player.badges[player.region] ? player.badges[player.region].length : 0;
        if (curBadges < region.roads[idx].reqBadges) {
            showToast("🏅 뱃지 " + region.roads[idx].reqBadges + "개 필요! (현재 " + curBadges + "개)");
            return;
        }
    }
    // 맵 이동 시 시간 경과
    if (player.roadIdx !== idx) {
        var _rd = region.roads[idx];
        if (_rd) addLog("🗺️ " + _rd.n + "(으)로 이동했다." + (_rd.isCity ? " [도시]" : ""), "info");
        advanceTime();
    }
    player.roadIdx = idx;
    gState.subScreen = "roadDetail";
    await saveAll();
    render();
};

window.poke_explore = async function() {
    if (!player || !gState) return;
    var alive = false;
    for (var i = 0; i < player.party.length; i++) { if (player.party[i].currentHp > 0) { alive = true; break; } }
    if (!alive) { showToast("모든 포켓몬이 기절했습니다!"); return; }
    var road = getCurrentRoad();
    if (!road) return;
    var found = startWildBattle(road);
    if (!found) {
        showToast("포켓몬이 나타나지 않았다... 다시 탐색해보자!");
    }
    await saveAll();
    render();
};

window.poke_fishing = async function(rodType) {
    if (!player || !gState) return;
    if (!rodType) rodType = "old";
    var rodItem = rodType === "old" ? "oldrod" : (rodType === "good" ? "goodrod" : "superrod");
    if (!player.bag[rodItem]) { showToast("낚시대를 가지고 있지 않습니다!"); return; }
    var alive = false;
    for (var i = 0; i < player.party.length; i++) { if (player.party[i].currentHp > 0) { alive = true; break; } }
    if (!alive) { showToast("모든 포켓몬이 기절했습니다!"); return; }
    var road = getCurrentRoad();
    if (!road) return;
    var found = startFishingBattle(road, rodType);
    if (!found) {
        showToast("🎣 아무것도 낚이지 않았다... 다시 시도해보자!");
    }
    await saveAll();
    render();
};

window.poke_trainerBattle = async function(trainerIdx) {
    trainerIdx = parseInt(trainerIdx, 10);
    if (isNaN(trainerIdx)) return;
    if (!player || !gState) return;
    var alive = false;
    for (var i = 0; i < player.party.length; i++) { if (player.party[i].currentHp > 0) { alive = true; break; } }
    if (!alive) { showToast("모든 포켓몬이 기절했습니다!"); return; }
    var road = getCurrentRoad();
    if (!road) return;
    var started = startTrainerBattle(road, trainerIdx);
    if (!started) {
        showToast("이미 승리한 트레이너입니다!");
        return;
    }
    await saveAll();
    render();
};

window.poke_attack = async function(moveKey) {
    if (!gState || !gState.battleData || gState.battleData.won || gState.battleData.lost || gState.battleData.caught || gState.battleData.fled) return;
    sfxAttack();
    executeTurn(moveKey);
    await saveAll();
    render();
};

window.poke_throwBall = async function(ballKey) {
    if (!gState || !gState.battleData || gState.battleData.type !== "wild") return;
    attemptCapture(ballKey);
    await saveAll();
    render();
};

window.poke_run = async function() {
    if (!gState || !gState.battleData) return;
    tryRun();
    await saveAll();
    render();
};

window.poke_battleParty = function() {
    if (!gState || !gState.battleData) return;
    gState.subScreen = "battlePartySwitch";
    render();
};

window.poke_switchInBattle = async function(idx) {
    idx = parseInt(idx, 10);
    if (isNaN(idx)) return;
    var bd = gState.battleData;
    if (!bd) return;
    var prev = player.party[bd.myIdx];
    bd.myIdx = idx;
    // 배틀 참가자 추적
    if (bd.battleParticipants) {
        var alreadyIn = false;
        for (var bpi = 0; bpi < bd.battleParticipants.length; bpi++) {
            if (bd.battleParticipants[bpi] === idx) { alreadyIn = true; break; }
        }
        if (!alreadyIn) bd.battleParticipants.push(idx);
    }
    rotateBattleMsg(bd);
    bd.msg = [];
    gState.subScreen = null;
    if (prev && prev.currentHp > 0) {
        bd.msg.push(prev.nickname + "을(를) 교체했다!");
        // 특성: naturalcure → 교체 시 상태회복
        if (getAbilityKey(prev) === "naturalcure" && prev.status) {
            prev.status = null; prev.statusTurns = 0;
            bd.msg.push(prev.nickname + "의 자연회복! 상태이상이 회복되었다!");
        }
        // 특성: regenerator → 교체 시 HP 1/3 회복
        if (getAbilityKey(prev) === "regenerator") {
            var rHeal = Math.max(1, Math.floor(prev.stats[0] / 3));
            prev.currentHp = Math.min(prev.stats[0], prev.currentHp + rHeal);
            bd.msg.push(prev.nickname + "의 재생력! HP가 회복되었다! (+" + rHeal + ")");
        }
        // 교체 시 적이 공격
        var emk = enemyChooseMove(bd.enemy);
        if (canAct(bd.enemy, bd)) executeAttack(bd.enemy, player.party[bd.myIdx], emk, bd);
        doStatusDamage(bd.enemy, bd);
    }
    var curPoke = player.party[bd.myIdx];
    bd.msg.push(player.name + "은(는) " + curPoke.nickname + " (Lv." + curPoke.level + ")을(를) 내보냈다!");
    // 특성: intimidate → 등장 시 상대 공격 -1
    if (getAbilityKey(curPoke) === "intimidate") {
        bd.enemy.statStages.atk = Math.max(-6, bd.enemy.statStages.atk - 1);
        bd.msg.push(curPoke.nickname + "의 위협! " + bd.enemy.nickname + "의 공격이 떨어졌다!");
    }
    for (var i = 0; i < bd.msg.length; i++) addLog(bd.msg[i], "battle");
    await saveAll();
    render();
};

window.poke_endBattle = async function() {
    if (!gState) return;
    // 배틀 카운트 증가 → 5회마다 시간 경과
    if (player) {
        player.battleCount = (player.battleCount || 0) + 1;
        if (player.battleCount >= 5) {
            advanceTime();
            showToast(TIME_NAMES[player.timeOfDay]);
        }
    }
    // 메가진화 해제
    for (var i = 0; i < player.party.length; i++) {
        var p = player.party[i];
        if (p.isMega) {
            p.isMega = false;
            p.megaForm = null;
            p.megaTypes = null;
            p.megaNickname = null;
            var origData = POKEDEX[p.key];
            if (origData) {
                var origStats = calcStats(origData.s, p.level, p.iv);
                var hpRatio = p.currentHp / p.stats[0];
                p.stats = origStats;
                p.currentHp = Math.max(0, Math.floor(origStats[0] * hpRatio));
            }
        }
    }
    gState.phase = "overworld";
    gState.subScreen = "roadDetail";
    gState.battleData = null;
    // 특성: pickup → 전투 후 10% 확률 아이템 획득
    for (var pi = 0; pi < player.party.length; pi++) {
        if (getAbilityKey(player.party[pi]) === "pickup" && player.party[pi].currentHp > 0 && Math.random() < 0.1) {
            var pickupItems = ["potion","superpotion","pokeball","superball","revive","oranberry"];
            var pickItem = pickupItems[rng(0, pickupItems.length - 1)];
            player.bag[pickItem] = (player.bag[pickItem] || 0) + 1;
            var pickItemData = ITEMS[pickItem];
            addLog("⭐ " + player.party[pi].nickname + "의 픽업! " + (pickItemData ? pickItemData.n : pickItem) + "을(를) 주웠다!", "item");
            break; // 한 번에 하나만
        }
    }
    if (gState.pendingEvo) { await saveAll(); render(); return; }
    if (gState.pendingMoveLearn) { await saveAll(); render(); return; }
    await saveAll();
    render();
};

window.poke_blackout = async function() {
    if (!player) return;
    // 배틀 카운트 증가
    player.battleCount = (player.battleCount || 0) + 1;
    if (player.battleCount >= 5) advanceTime();
    var bd = gState.battleData;
    if (bd && bd.type === "trainer") {
        var baseReward = bd.trainerReward || 500;
        var penalty = bd.isRematch ? Math.floor(baseReward * 0.2) : baseReward;
        player.gold = Math.max(0, player.gold - penalty);
        addLog("😵 패배... ₩" + penalty + "을 잃었다." + (bd.isRematch ? " (재대결 20%)" : ""), "battle");
    } else {
        player.gold = Math.max(0, player.gold - Math.floor(player.gold * 0.1));
        addLog("😵 패배... 소지금의 일부를 잃었다.", "battle");
    }
    healAllPokemon();
    // 메가진화 해제
    for (var i = 0; i < player.party.length; i++) {
        var p = player.party[i];
        if (p.isMega) {
            p.isMega = false;
            p.megaForm = null;
            p.megaTypes = null;
            p.megaNickname = null;
            var origData = POKEDEX[p.key];
            if (origData) {
                var origStats = calcStats(origData.s, p.level, p.iv);
                p.stats = origStats;
            }
        }
    }
    gState.phase = "overworld";
    gState.subScreen = null;
    gState.battleData = null;
    await saveAll();
    render();
};

window.poke_center = async function() {
    var road = getCurrentRoad();
    var locName = road ? road.n : "";
    healAllPokemon(locName);
    showToast(locName + " 포켓몬센터에서 포켓몬이 모두 회복되었습니다!");
    await saveAll();
    render();
};

window.poke_openShop = function() { gState.subScreen = "shop"; render(); };
window.poke_openParty = function() { gState.subScreen = "party"; render(); };
window.poke_openPC = function() { gState.subScreen = "pc"; render(); };
window.poke_openBag = function() { gState.subScreen = "bag"; render(); };
window.poke_openLog = function() { gState.subScreen = "log"; render(); };
window.poke_openPokedex = function() { gState.subScreen = "pokedex"; render(); };
window.poke_openGyms = function() { gState.subScreen = "gyms"; render(); };
window.poke_openBadges = function() { gState.subScreen = "badges"; render(); };
window.poke_openStatus = function() { gState.subScreen = "status"; render(); };
window.poke_openMoveRelearner = function() { gState.subScreen = "moveRelearner"; render(); };
window.poke_relearnerSelectPoke = function(idx) {
    gState.relearnerPokeIdx = parseInt(idx, 10);
    gState.subScreen = "moveRelearnerMoves";
    render();
};
window.poke_relearnerLearnMove = async function(moveKey) {
    var idx = gState.relearnerPokeIdx;
    var poke = player.party[idx];
    if (!poke) return;
    var mv = MOVES[moveKey];
    if (!mv) return;
    if (poke.moves.length < 4) {
        poke.moves.push({key: moveKey, ppLeft: mv.pp});
        addLog(poke.nickname + "은(는) " + mv.n + "을(를) 다시 배웠다!", "learn");
        showToast(poke.nickname + "이(가) " + mv.n + "을(를) 배웠다!");
        await saveAll();
        render();
    } else {
        gState.pendingMoveLearn = {pokeIdx: idx, moveKey: moveKey};
        gState.subScreen = null;
        await saveAll();
        render();
    }
};
window.poke_partyMoveUp = async function(idx) {
    idx = parseInt(idx, 10);
    if (idx <= 0 || idx >= player.party.length) return;
    var temp = player.party[idx];
    player.party[idx] = player.party[idx - 1];
    player.party[idx - 1] = temp;
    await saveAll();
    render();
};
window.poke_partyMoveDown = async function(idx) {
    idx = parseInt(idx, 10);
    if (idx < 0 || idx >= player.party.length - 1) return;
    var temp = player.party[idx];
    player.party[idx] = player.party[idx + 1];
    player.party[idx + 1] = temp;
    await saveAll();
    render();
};
window.poke_startEvolve = function(idx) {
    idx = parseInt(idx, 10);
    var poke = player.party[idx];
    if (!poke) return;
    var data = POKEDEX[poke.key];
    if (!data || !data.e || poke.level < data.e.l) return;
    gState.pendingEvo = {pokeIdx: idx, from: poke.key, to: data.e.to};
    render();
};

window.poke_openSaveSlots = function() { 
    if (gState) { gState.subScreen = "saveSlots"; gState._confirmLoadSlot = null; }
    else gState = {phase:"overworld", subScreen:"saveSlots", battleData:null, pendingEvo:null, pendingMoveLearn:null, eventLog:[], log:[], _confirmLoadSlot:null};
    render(); 
    (async function() {
        var slotHtml = '';
        var confirmSlot = gState._confirmLoadSlot;
        for (var si = 1; si <= 3; si++) {
            var info = await getSlotInfo(si);
            slotHtml += '<div class="pk-card" style="margin:6px 0;padding:10px">';
            slotHtml += '<div style="display:flex;justify-content:space-between;align-items:center">';
            slotHtml += '<div><strong>슬롯 ' + si + '</strong>';
            if (info.exists) {
                slotHtml += ' <span style="color:#aaa;font-size:12px">| ' + info.name + ' | ' + info.region + ' | 🏅' + info.badges + ' | 파티 ' + info.partyCount + '</span>';
                if (info.time) { try { var d = new Date(info.time); slotHtml += ' <span style="color:#666;font-size:10px">' + d.toLocaleDateString() + ' ' + d.toLocaleTimeString() + '</span>'; } catch(e){} }
            } else {
                slotHtml += ' <span style="color:#666;font-size:12px">비어있음</span>';
            }
            slotHtml += '</div><div style="display:flex;gap:4px">';
            if (player) slotHtml += '<button class="pk-btn pk-btn-blue pk-btn-xs" data-action="poke_saveToSlot" data-args="' + si + '">저장</button>';
            if (info.exists) {
                if (confirmSlot === si) {
                    slotHtml += '<button class="pk-btn pk-btn-green pk-btn-xs" data-action="poke_confirmLoadSlot" data-args="' + si + '" style="animation:pulse 0.5s infinite alternate">⚠️ 확인! 불러오기</button>';
                    slotHtml += '<button class="pk-btn pk-btn-dark pk-btn-xs" data-action="poke_cancelLoadSlot">취소</button>';
                } else {
                    slotHtml += '<button class="pk-btn pk-btn-green pk-btn-xs" data-action="poke_loadFromSlot" data-args="' + si + '">불러오기</button>';
                }
                slotHtml += '<button class="pk-btn pk-btn-red pk-btn-xs" data-action="poke_deleteSlot" data-args="' + si + '">삭제</button>';
            }
            slotHtml += '</div></div>';
            if (confirmSlot === si) {
                slotHtml += '<div style="font-size:11px;color:#e74c3c;margin-top:4px;padding:4px 8px;background:rgba(231,76,60,0.1);border-radius:4px">⚠️ 현재 진행 상황이 이 슬롯 데이터로 교체됩니다! 현재 상태는 자동 백업됩니다.</div>';
            }
            slotHtml += '</div>';
        }
        slotHtml += '<div style="color:#888;font-size:11px;margin-top:8px;line-height:1.5">';
        slotHtml += '💡 <b>슬롯 사용법:</b> 게임은 항상 자동 저장됩니다.<br>';
        slotHtml += '슬롯은 <span style="color:#3498db">특정 시점을 기억</span>해두는 체크포인트입니다.<br>';
        slotHtml += '예: 관장전 전에 저장 → 지면 불러오기로 되돌리기';
        slotHtml += '</div>';
        var slotEl = document.getElementById("pk-slot-list");
        if (slotEl) { slotEl.innerHTML = slotHtml; var body = slotEl.closest("#pk-body"); if (body) bindHandlers(body); }
    })();
};

window.poke_saveToSlot = async function(slotNum) {
    var ok = await saveSlot(parseInt(slotNum));
    if (ok) showToast("슬롯 " + slotNum + "에 저장 완료!");
    else showToast("저장 실패!");
    window.poke_openSaveSlots();
};

// 1단계: 불러오기 버튼 클릭 → 확인 상태로 전환
window.poke_loadFromSlot = function(slotNum) {
    gState._confirmLoadSlot = parseInt(slotNum);
    window.poke_openSaveSlots();
};

// 취소
window.poke_cancelLoadSlot = function() {
    gState._confirmLoadSlot = null;
    window.poke_openSaveSlots();
};

// 2단계: 확인 클릭 → 현재 상태 자동 백업 후 실제 로드
window.poke_confirmLoadSlot = async function(slotNum) {
    slotNum = parseInt(slotNum);
    // 현재 진행 상태를 빈 슬롯에 자동 백업
    if (player) {
        var backupSlot = 0;
        for (var bs = 3; bs >= 1; bs--) {
            if (bs === slotNum) continue; // 불러올 슬롯은 건너뜀
            var binfo = await getSlotInfo(bs);
            if (!binfo.exists) { backupSlot = bs; break; }
        }
        if (backupSlot > 0) {
            await saveSlot(backupSlot);
            addLog("💾 현재 상태가 슬롯 " + backupSlot + "에 자동 백업되었습니다.", "info");
        } else {
            addLog("⚠️ 빈 슬롯이 없어 자동 백업을 건너뜁니다.", "info");
        }
    }
    var ok = await loadSlot(slotNum);
    if (ok) {
        await saveAll();
        gState._confirmLoadSlot = null;
        showToast("슬롯 " + slotNum + "에서 로드 완료!");
        gState.subScreen = null;
        render();
    } else {
        showToast("로드 실패!");
        gState._confirmLoadSlot = null;
        window.poke_openSaveSlots();
    }
};

window.poke_deleteSlot = async function(slotNum) {
    await deleteSlot(parseInt(slotNum));
    showToast("슬롯 " + slotNum + " 삭제 완료!");
    window.poke_openSaveSlots();
};

window.poke_back = function() {
    if (gState.subScreen === "roadDetail") {
        gState.subScreen = null;
    } else if (gState.subScreen === "pokedexDetail") {
        gState.subScreen = "pokedex";
        gState.pokedexKey = null;
    } else if (gState.subScreen === "battlePartySwitch") {
        gState.subScreen = null;
    } else if (gState.subScreen === "itemPartySelect") {
        gState.subScreen = "bag";
        gState.useItemKey = null;
    } else {
        gState.subScreen = null;
    }
    render();
};

window.poke_battleBag = function() {
    if (!gState || !gState.battleData) return;
    gState.subScreen = "bag";
    render();
};

window.poke_megaEvolve = async function() {
    if (!gState || !gState.battleData) return;
    var bd = gState.battleData;
    if (bd.megaUsed) { showToast("이미 메가진화를 사용했습니다!"); return; }
    if (!player.bag.megaring) { showToast("메가링이 없습니다!"); return; }
    var myPoke = player.party[bd.myIdx];
    if (!myPoke || myPoke.currentHp <= 0) return;
    var megaKey = myPoke.key;
    var megaForm = MEGA_DATA[megaKey];
    if (!megaForm && MEGA_DATA[megaKey + "x"]) megaForm = MEGA_DATA[megaKey + "x"];
    if (!megaForm) { showToast("이 포켓몬은 메가진화할 수 없습니다!"); return; }
    bd.megaUsed = true;
    myPoke.isMega = true;
    myPoke.megaForm = megaForm;
    var megaStats = calcStats(megaForm.s, myPoke.level, myPoke.iv);
    var hpRatio = myPoke.currentHp / myPoke.stats[0];
    myPoke.stats = megaStats;
    myPoke.currentHp = Math.max(1, Math.floor(megaStats[0] * hpRatio));
    myPoke.megaTypes = megaForm.t;
    myPoke.megaNickname = megaForm.n;
    rotateBattleMsg(bd);
    bd.msg = [myPoke.nickname + "이(가) 메가진화했다! → " + megaForm.n + "!"];
    for (var i = 0; i < bd.msg.length; i++) addLog(bd.msg[i], "battle");
    await saveAll();
    render();
};

window.poke_buyItem = async function(key) {
    var item = ITEMS[key];
    if (!item || player.gold < item.buy) return;
    player.gold -= item.buy;
    player.bag[key] = (player.bag[key] || 0) + 1;
    addLog("🛒 " + item.n + " 구매 (₩" + item.buy + ") → 잔액 ₩" + player.gold, "gold");
    showToast(item.n + " 구매!");
    await saveAll();
    render();
};

window.poke_sellItem = async function(key) {
    var item = ITEMS[key];
    if (!item || !player.bag[key]) return;
    player.gold += item.sell;
    player.bag[key]--;
    if (player.bag[key] <= 0) delete player.bag[key];
    addLog("💸 " + item.n + " 판매 (₩" + item.sell + ") → 잔액 ₩" + player.gold, "gold");
    showToast(item.n + " 판매!");
    await saveAll();
    render();
};

window.poke_giveBerry = async function(idx) {
    if (!player || !gState) return;
    gState.subScreen = "berrySelect";
    gState.berryTargetIdx = parseInt(idx);
    await saveAll(); render();
};
window.poke_selectBerry = async function(berryKey) {
    if (!player || !gState) return;
    var idx = gState.berryTargetIdx;
    if (idx === undefined || idx === null) return;
    var poke = player.party[idx];
    if (!poke) return;
    if (poke.heldItem) {
        player.bag[poke.heldItem] = (player.bag[poke.heldItem] || 0) + 1;
        addLog(poke.nickname + "에게서 " + ITEMS[poke.heldItem].n + "을(를) 회수했다!", "item");
    }
    poke.heldItem = berryKey;
    player.bag[berryKey]--;
    if (player.bag[berryKey] <= 0) delete player.bag[berryKey];
    addLog(poke.nickname + "에게 " + ITEMS[berryKey].n + "을(를) 지니게 했다!", "item");
    gState.subScreen = "party";
    gState.berryTargetIdx = null;
    await saveAll(); render();
};
window.poke_takeBerry = async function(idx) {
    if (!player || !gState) return;
    var poke = player.party[parseInt(idx)];
    if (!poke || !poke.heldItem) return;
    var berryName = ITEMS[poke.heldItem] ? ITEMS[poke.heldItem].n : poke.heldItem;
    player.bag[poke.heldItem] = (player.bag[poke.heldItem] || 0) + 1;
    addLog(poke.nickname + "에게서 " + berryName + "을(를) 회수했다!", "item");
    poke.heldItem = null;
    await saveAll(); render();
};
window.poke_cancelBerrySelect = async function() {
    if (!gState) return;
    gState.subScreen = "party";
    gState.berryTargetIdx = null;
    await saveAll(); render();
};

window.poke_useItemSelect = async function(itemKey) {
    var item = ITEMS[itemKey];
    if (!item) return;
    gState.useItemKey = itemKey;
    gState.subScreen = "itemPartySelect";
    render();
};

window.poke_useItemOnPoke = async function(idx) {
    idx = parseInt(idx, 10);
    if (isNaN(idx) || !gState.useItemKey) return;
    var itemKey = gState.useItemKey;
    var item = ITEMS[itemKey];
    if (!item) return;
    var used = useItem(itemKey, idx);
    if (used) {
        showToast(player.party[idx].nickname + "에게 사용!");
        if (gState.battleData) {
            gState.subScreen = null;
            gState.useItemKey = null;
            gState.battleData.msg = [player.party[idx].nickname + "에게 " + item.n + "을(를) 사용했다!"];
            var bd = gState.battleData;
            var emk = enemyChooseMove(bd.enemy);
            if (canAct(bd.enemy, bd)) executeAttack(bd.enemy, player.party[bd.myIdx], emk, bd);
            doStatusDamage(bd.enemy, bd);
            for (var j = 0; j < bd.msg.length; j++) addLog(bd.msg[j], "battle");
        } else {
            gState.subScreen = null;
            gState.useItemKey = null;
        }
        await saveAll();
        render();
    } else {
        showToast("이 포켓몬에게는 사용할 수 없습니다!");
    }
};

window.poke_useBattleItem = async function(itemKey) {
    var item = ITEMS[itemKey];
    if (!item || item.type !== "battle" || !gState.battleData) return;
    var bd = gState.battleData;
    var used = useItem(itemKey, bd.myIdx);
    if (used) {
        var activePoke = player.party[bd.myIdx];
        gState.subScreen = null;
        rotateBattleMsg(bd);
        bd.msg = [activePoke.nickname + "에게 " + item.n + "을(를) 사용했다!"];
        var emk = enemyChooseMove(bd.enemy);
        if (canAct(bd.enemy, bd)) executeAttack(bd.enemy, player.party[bd.myIdx], emk, bd);
        doStatusDamage(bd.enemy, bd);
        for (var j = 0; j < bd.msg.length; j++) addLog(bd.msg[j], "battle");
        await saveAll();
        render();
    } else {
        showToast("사용할 수 없습니다!");
    }
};

window.poke_withdrawPC = async function(idx) {
    idx = parseInt(idx, 10);
    if (isNaN(idx) || player.party.length >= MAX_PARTY) return;
    var poke = player.pc.splice(idx, 1)[0];
    if (poke) player.party.push(poke);
    await saveAll();
    render();
};

window.poke_depositPC = async function(idx) {
    idx = parseInt(idx, 10);
    if (isNaN(idx) || player.party.length <= 1) return;
    var poke = player.party.splice(idx, 1)[0];
    if (poke) {
        poke.currentHp = poke.stats[0]; poke.status = null; poke.statusTurns = 0;
        poke.statStages = {atk:0,def:0,spatk:0,spdef:0,spd:0,acc:0,eva:0};
        for (var mi = 0; mi < poke.moves.length; mi++) {
            var mv = MOVES[poke.moves[mi].key];
            poke.moves[mi].ppLeft = mv ? mv.pp : 10;
        }
        player.pc.push(poke);
    }
    await saveAll();
    render();
};

window.poke_showSummary = function(idx) {
    gState.summaryIdx = parseInt(idx, 10);
    gState.subScreen = "summary";
    render();
};

window.poke_evolve = async function() {
    doEvolution();
    sfxLevelUp();
    await saveAll();
    render();
};

window.poke_cancelEvolve = async function() {
    gState.pendingEvo = null;
    await saveAll();
    render();
};

window.poke_forgetMove = async function(idx) {
    idx = parseInt(idx, 10);
    if (!gState.pendingMoveLearn) return;
    var ml = gState.pendingMoveLearn;
    var poke = player.party[ml.pokeIdx];
    if (!poke) { gState.pendingMoveLearn = null; render(); return; }
    var newMv = MOVES[ml.moveKey];
    poke.moves[idx] = {key: ml.moveKey, ppLeft: newMv ? newMv.pp : 10};
    addLog(poke.nickname + "은(는) " + (newMv?newMv.n:ml.moveKey) + "을(를) 배웠다!", "learn");
    gState.pendingMoveLearn = null;
    await saveAll();
    render();
};

window.poke_cancelLearn = async function() {
    gState.pendingMoveLearn = null;
    await saveAll();
    render();
};

window.poke_useTM = async function(tmKey) {
    if (!player || !ITEMS[tmKey]) return;
    gState.subScreen = "tmPartySelect";
    gState.tmItemKey = tmKey;
    await saveAll();
    render();
};

window.poke_teachTM = async function(idx) {
    idx = parseInt(idx, 10);
    if (isNaN(idx) || !gState.tmItemKey) return;
    var tmKey = gState.tmItemKey;
    var item = ITEMS[tmKey];
    if (!item || item.type !== "tm") return;
    var moveKey = item.value;
    var poke = player.party[idx];
    if (!poke) return;
    for (var j = 0; j < poke.moves.length; j++) {
        if (poke.moves[j].key === moveKey) { showToast("이미 이 기술을 알고 있습니다!"); return; }
    }
    if (!canLearnTM(poke, tmKey)) { showToast("이 포켓몬은 이 기술을 배울 수 없습니다!"); return; }
    player.bag[tmKey]--;
    if (player.bag[tmKey] <= 0) delete player.bag[tmKey];
    if (poke.moves.length < 4) {
        var mv = MOVES[moveKey];
        poke.moves.push({key: moveKey, ppLeft: mv ? mv.pp : 10});
        addLog(poke.nickname + "은(는) " + (mv?mv.n:moveKey) + "을(를) 배웠다!", "learn");
        showToast(poke.nickname + "이(가) " + (mv?mv.n:moveKey) + "을(를) 배웠다!");
        gState.subScreen = null;
        gState.tmItemKey = null;
    } else {
        gState.pendingMoveLearn = {pokeIdx: idx, moveKey: moveKey};
        gState.subScreen = null;
        gState.tmItemKey = null;
    }
    await saveAll();
    render();
};


window.poke_acceptReward = async function() {
    if (!gState || !gState.battleData) return;
    var bd = gState.battleData;
    if (bd.pendingReward && !bd.rewardHandled) {
        player.gold += bd.pendingReward;
        bd.msg.push("💰 ₩" + bd.pendingReward + "을 받았다!");
        addLog("💰 ₩" + bd.pendingReward + " 획득!", "gold");
        // 체육관 보상 아이템 지급
        if (bd.trainerRewardItems && bd.isGymBattle && !bd.isRematch) {
            for (var ri = 0; ri < bd.trainerRewardItems.length; ri++) {
                var rItem = bd.trainerRewardItems[ri];
                player.bag[rItem] = (player.bag[rItem] || 0) + 1;
                bd.msg.push("🎁 " + ITEMS[rItem].n + " 을(를) 받았다!");
                addLog(ITEMS[rItem].n + " 을(를) 받았다!", "reward");
            }
        }
        bd.rewardHandled = true;
    }
    await saveAll();
    render();
};

window.poke_declineReward = async function() {
    if (!gState || !gState.battleData) return;
    var bd = gState.battleData;
    if (bd.pendingReward && !bd.rewardHandled) {
        bd.msg.push("상금을 거절했다.");
        addLog("상금 ₩" + bd.pendingReward + " 거절.", "gold");
        bd.rewardHandled = true;
    }
    await saveAll();
    render();
};

window.poke_advanceTime = async function() {
    if (!player) return;
    advanceTime();
    showToast(TIME_NAMES[player.timeOfDay] + " (Day " + player.day + ")");
    await saveAll();
    render();
};

window.poke_gymBattle = async function(args) {
    if (!player || !gState) return;
    var parts = args.split(",");
    var gymIdx = parseInt(parts[0]);
    var leaderIdx = parseInt(parts[1]) || 0;
    var alive = false;
    for (var i = 0; i < player.party.length; i++) {
        if (player.party[i].currentHp > 0) { alive = true; break; }
    }
    if (!alive) { showToast("싸울 수 있는 포켓몬이 없습니다!"); return; }
    var ok = startGymBattle(player.region, gymIdx, leaderIdx);
    if (!ok) { showToast("오늘은 이미 이 관장을 이겼습니다!"); return; }
    gState.subScreen = null;
    await saveAll();
    render();
};

window.poke_gymTrainerBattle = async function(args) {
    if (!player || !gState) return;
    var parts = args.split(",");
    var gymIdx = parseInt(parts[0]);
    var trainerIdx = parseInt(parts[1]);
    var gymList = GYMS[player.region];
    if (!gymList || !gymList[gymIdx]) return;
    var gym = gymList[gymIdx];
    if (!gym.gymTrainers || !gym.gymTrainers[trainerIdx]) return;
    var gtKey = gym.id + "_trainer_" + trainerIdx;
    if (player.defeatedGyms[gtKey]) { showToast("이미 쓰러뜨린 트레이너입니다!"); return; }
    var alive = false;
    for (var i = 0; i < player.party.length; i++) {
        if (player.party[i].currentHp > 0) { alive = true; break; }
    }
    if (!alive) { showToast("싸울 수 있는 포켓몬이 없습니다!"); return; }
    var gt = gym.gymTrainers[trainerIdx];
    var enemyParty = [];
    for (var i = 0; i < gt.pokemon.length; i++) {
        var poke = createPokemonInstance(gt.pokemon[i].k, gt.pokemon[i].l);
        if (poke) enemyParty.push(poke);
    }
    if (enemyParty.length === 0) return;
    var myIdx = 0;
    for (var i = 0; i < player.party.length; i++) {
        if (player.party[i].currentHp > 0) { myIdx = i; break; }
    }
    gState.phase = "battle";
    gState.battleData = {
        type: "trainer",
        trainerName: gt.n,
        trainerEmoji: "👤",
        trainerReward: gt.reward,
        trainerKey: gtKey,
        isGymTrainer: true,
        isRematch: false,
        enemyParty: enemyParty,
        enemyIdx: 0,
        enemy: enemyParty[0],
        myIdx: myIdx,
        battleParticipants: [myIdx],
        turn: 0,
        fled: false,
        caught: false,
        won: false,
        lost: false,
        msg: [],
        animating: false
    };
    addLog("👤 " + gt.n + "이(가) 승부를 걸어왔다!", "battle");
    gState.battleData.msg.push("👤 " + gt.n + "이(가) 승부를 걸어왔다!");
    gState.battleData.msg.push(gt.n + "은(는) " + enemyParty[0].nickname + " (Lv." + enemyParty[0].level + ")을(를) 내보냈다!");
    var myFirst = player.party[myIdx];
    gState.battleData.msg.push(player.name + "은(는) " + myFirst.nickname + " (Lv." + myFirst.level + ")을(를) 내보냈다!");
    if (getAbilityKey(myFirst) === "intimidate") {
        gState.battleData.enemy.statStages.atk = Math.max(-6, gState.battleData.enemy.statStages.atk - 1);
        gState.battleData.msg.push(myFirst.nickname + "의 위협! " + enemyParty[0].nickname + "의 공격이 떨어졌다!");
    }
    gState.subScreen = null;
    await saveAll();
    render();
};

window.poke_legendaryBattle = async function(args) {
    if (!player || !gState) return;
    var parts = args.split(",");
    var key = parts[0];
    var level = parseInt(parts[1]) || 50;
    if (player.caughtLegendaries[key]) { showToast("이미 잡은 포켓몬입니다!"); return; }
    var alive = false;
    for (var i = 0; i < player.party.length; i++) {
        if (player.party[i].currentHp > 0) { alive = true; break; }
    }
    if (!alive) { showToast("싸울 수 있는 포켓몬이 없습니다!"); return; }
    startLegendaryBattle(key, level);
    gState.subScreen = null;
    await saveAll();
    render();
};

window.poke_roamingBattle = async function(key) {
    if (!player || !gState) return;
    if (player.caughtLegendaries[key]) { showToast("이미 잡은 포켓몬입니다!"); return; }
    // 5% 확률 조우
    if (Math.random() > 0.05) {
        showToast("기척이 사라졌다... 다음 기회에!");
        addLog("로밍 포켓몬의 기척이 사라졌다...", "info");
        await saveAll();
        render();
        return;
    }
    var alive = false;
    for (var i = 0; i < player.party.length; i++) {
        if (player.party[i].currentHp > 0) { alive = true; break; }
    }
    if (!alive) { showToast("싸울 수 있는 포켓몬이 없습니다!"); return; }
    var level = rng(40, 50);
    startLegendaryBattle(key, level);
    gState.subScreen = null;
    await saveAll();
    render();
};

// ═══════════════════════════════════════════════
// 🔗 이벤트 바인딩 & 초기화
// ═══════════════════════════════════════════════
function bindHandlers(container) {
    var btns = container.querySelectorAll("[data-action]");
    for (var i = 0; i < btns.length; i++) {
        (function(btn) {
            btn.addEventListener("click", function(e) {
                e.preventDefault();
                var action = btn.getAttribute("data-action");
                var args = btn.getAttribute("data-args");
                if (typeof window[action] === "function") {
                    window[action](args);
                }
            });
        })(btns[i]);
    }
}

async function initPlugin() {
    injectStyles();
    isVisible = (await lsGet(KEY_VIS)) === "true";
    // ※ API 3.0: registerButton 먼저 등록 (세이브 로드 에러로 버튼 실종 방지)
    if (_hasRisu) {
        try {
            Risuai.registerButton({
                name: '🎮 포켓몬',
                icon: '🎮',
                iconType: 'html',
                location: 'action'
            }, async function() {
                isVisible = !isVisible;
                await lsSet(KEY_VIS, String(isVisible));
                var win = document.getElementById(UI_ID);
                if (win) {
                    if (isVisible) {
                        win.classList.remove("hidden");
                    } else {
                        win.classList.add("hidden");
                    }
                }
                if (isVisible) {
                    await Risuai.showContainer('fullscreen');
                    if (!player || !gState) { await loadAll(); }
                    render();
                } else {
                    await Risuai.hideContainer();
                }
            });
        } catch(e) { console.error(PLUGIN, "registerButton error:", e); }
    }
    // 세이브 로드
    if (await loadAll()) {
        console.log(PLUGIN, "세이브 데이터 로드 완료");
    }
    render();
    // 시작 시 창이 열려있었다면 컨테이너 표시
    if (_hasRisu && isVisible) {
        var win = document.getElementById(UI_ID);
        if (win) win.classList.remove("hidden");
        await Risuai.showContainer('fullscreen');
    }
}

await initPlugin();

} catch(topErr) {
    console.error("[Pokemon] Fatal error:", topErr);
}
})();
