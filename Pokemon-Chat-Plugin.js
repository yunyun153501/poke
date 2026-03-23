//@name Pokemon Battle
//@display-name 🎮 포켓몬 배틀 (Gen 1-4)
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
bulbasaur:  {n:"이상해씨",id:1,t:["grass","poison"],s:[45,49,49,65,65,45],ml:{1:["tackle","growl"],7:["vinewhip"],13:["poisonpowder"],20:["razorleaf"],27:["sleeppowder"]},e:{l:16,to:"ivysaur"},cr:45,xp:64,em:"🌿"},
ivysaur:    {n:"이상해풀",id:2,t:["grass","poison"],s:[60,62,63,80,80,60],ml:{1:["tackle","growl","vinewhip"],20:["razorleaf"],27:["sleeppowder"],34:["solarbeam"]},e:{l:32,to:"venusaur"},cr:45,xp:142,em:"🌿"},
venusaur:   {n:"이상해꽃",id:3,t:["grass","poison"],s:[80,82,83,100,100,80],ml:{1:["tackle","vinewhip","razorleaf"],34:["solarbeam"],44:["sleeppowder"]},e:null,cr:45,xp:236,em:"🌺"},
charmander: {n:"파이리",id:4,t:["fire"],s:[39,52,43,60,50,65],ml:{1:["scratch","growl"],7:["ember"],13:["smokescreen"],22:["flamethrower"]},e:{l:16,to:"charmeleon"},cr:45,xp:62,em:"🔥"},
charmeleon: {n:"리자드",id:5,t:["fire"],s:[58,64,58,80,65,80],ml:{1:["scratch","ember"],22:["flamethrower"],34:["slash"]},e:{l:36,to:"charizard"},cr:45,xp:142,em:"🔥"},
charizard:  {n:"리자몽",id:6,t:["fire","flying"],s:[78,84,78,109,85,100],ml:{1:["scratch","ember","flamethrower"],36:["wingattack"],46:["fireblast"],55:["flareblitz"]},e:null,cr:45,xp:240,em:"🐉"},
squirtle:   {n:"꼬부기",id:7,t:["water"],s:[44,48,65,50,64,43],ml:{1:["tackle","tailwhip"],7:["watergun"],13:["bite"],22:["waterpulse"]},e:{l:16,to:"wartortle"},cr:45,xp:63,em:"🐢"},
wartortle:  {n:"어니부기",id:8,t:["water"],s:[59,63,80,65,80,58],ml:{1:["tackle","watergun","bite"],22:["waterpulse"],34:["surf"]},e:{l:36,to:"blastoise"},cr:45,xp:142,em:"🐢"},
blastoise:  {n:"거북왕",id:9,t:["water"],s:[79,83,100,85,105,78],ml:{1:["watergun","bite","surf"],42:["hydropump"],55:["icebeam"]},e:null,cr:45,xp:239,em:"🐢"},
// ── Gen 1 초반 ──
caterpie:   {n:"캐터피",id:10,t:["bug"],s:[45,30,35,20,20,45],ml:{1:["tackle","stringshot"]},e:{l:7,to:"metapod"},cr:255,xp:39,em:"🐛"},
metapod:    {n:"단데기",id:11,t:["bug"],s:[50,20,55,25,25,30],ml:{1:["tackle","harden"]},e:{l:10,to:"butterfree"},cr:120,xp:72,em:"🐛"},
butterfree: {n:"버터플",id:12,t:["bug","flying"],s:[60,45,50,90,80,70],ml:{1:["confusion","gust"],12:["sleeppowder"],16:["psybeam"],28:["psychic"]},e:null,cr:45,xp:178,em:"🦋"},
weedle:     {n:"뿔충이",id:13,t:["bug","poison"],s:[40,35,30,20,20,50],ml:{1:["poisonsting","stringshot"]},e:{l:7,to:"kakuna"},cr:255,xp:39,em:"🐛"},
kakuna:     {n:"딱충이",id:14,t:["bug","poison"],s:[45,25,50,25,25,35],ml:{1:["poisonsting","harden"]},e:{l:10,to:"beedrill"},cr:120,xp:72,em:"🐛"},
beedrill:   {n:"독침붕",id:15,t:["bug","poison"],s:[65,90,40,45,80,75],ml:{1:["poisonsting","twineedle"],16:["furyattack"],20:["pursuit"],28:["sludgebomb"]},e:null,cr:45,xp:178,em:"🐝"},
pidgey:     {n:"구구",id:16,t:["normal","flying"],s:[40,45,40,35,35,56],ml:{1:["tackle","gust"],9:["quickattack"],15:["wingattack"]},e:{l:18,to:"pidgeotto"},cr:255,xp:50,em:"🐦"},
pidgeotto:  {n:"피죤",id:17,t:["normal","flying"],s:[63,60,55,50,50,71],ml:{1:["tackle","gust","quickattack"],18:["wingattack"],27:["aerialace"]},e:{l:36,to:"pidgeot"},cr:120,xp:122,em:"🐦"},
pidgeot:    {n:"피죤투",id:18,t:["normal","flying"],s:[83,80,75,70,70,101],ml:{1:["wingattack","quickattack","aerialace"],44:["fly"],54:["hyperbeam"]},e:null,cr:45,xp:216,em:"🦅"},
rattata:    {n:"꼬렛",id:19,t:["normal"],s:[30,56,35,25,35,72],ml:{1:["tackle","tailwhip"],4:["quickattack"],10:["bite"]},e:{l:20,to:"raticate"},cr:255,xp:51,em:"🐭"},
raticate:   {n:"레트라",id:20,t:["normal"],s:[55,81,60,50,70,97],ml:{1:["tackle","quickattack","bite"],20:["crunch"],30:["hyperbeam"]},e:null,cr:127,xp:145,em:"🐭"},
spearow:    {n:"깨비참",id:21,t:["normal","flying"],s:[40,60,30,31,31,70],ml:{1:["peck","growl"],5:["furyattack"],9:["pursuit"],17:["aerialace"]},e:{l:20,to:"fearow"},cr:255,xp:52,em:"🐦"},
fearow:     {n:"깨비드릴조",id:22,t:["normal","flying"],s:[65,90,65,61,61,100],ml:{1:["peck","furyattack","aerialace"],25:["drillpeck"],37:["fly"]},e:null,cr:90,xp:155,em:"🦅"},
ekans:      {n:"아보",id:23,t:["poison"],s:[35,60,44,40,54,55],ml:{1:["wrap","poisonsting"],9:["bite"],17:["acid"],25:["sludgebomb"]},e:{l:22,to:"arbok"},cr:255,xp:58,em:"🐍"},
arbok:      {n:"아보크",id:24,t:["poison"],s:[60,95,69,65,79,80],ml:{1:["bite","acid","sludgebomb"],30:["crunch"],36:["toxic"]},e:null,cr:90,xp:157,em:"🐍"},
pikachu:    {n:"피카츄",id:25,t:["electric"],s:[35,55,40,50,50,90],ml:{1:["thundershock","growl"],6:["tailwhip"],8:["quickattack"],15:["thunderbolt"]},e:{l:25,to:"raichu"},cr:190,xp:112,em:"⚡"},
raichu:     {n:"라이츄",id:26,t:["electric"],s:[60,90,55,90,80,110],ml:{1:["thundershock","quickattack","thunderbolt"],30:["thunder"]},e:null,cr:75,xp:218,em:"⚡"},
sandshrew:  {n:"모래두지",id:27,t:["ground"],s:[50,75,85,20,30,40],ml:{1:["scratch","defensecurl"],6:["sandattack"],11:["mudshot"],17:["slash"],22:["dig"]},e:{l:22,to:"sandslash"},cr:255,xp:60,em:"🦔"},
sandslash:  {n:"고지",id:28,t:["ground"],s:[75,100,110,45,55,65],ml:{1:["scratch","slash","dig"],30:["earthquake"]},e:null,cr:90,xp:158,em:"🦔"},
nidoranf:   {n:"니드런♀",id:29,t:["poison"],s:[55,47,52,40,40,41],ml:{1:["tackle","growl"],7:["poisonsting"],13:["bite"]},e:{l:16,to:"nidorina"},cr:235,xp:55,em:"💜"},
nidorina:   {n:"니드리나",id:30,t:["poison"],s:[70,62,67,55,55,56],ml:{1:["tackle","poisonsting","bite"],23:["sludgebomb"]},e:{l:36,to:"nidoqueen"},cr:120,xp:128,em:"💜"},
nidoqueen:  {n:"니드퀸",id:31,t:["poison","ground"],s:[90,92,87,75,85,76],ml:{1:["poisonsting","bite","sludgebomb"],36:["earthquake"],43:["bodyslam"]},e:null,cr:45,xp:227,em:"👑"},
nidoranm:   {n:"니드런♂",id:32,t:["poison"],s:[46,57,40,40,40,50],ml:{1:["tackle","poisonsting"],8:["hornattack"],16:["bite"]},e:{l:16,to:"nidorino"},cr:235,xp:55,em:"💜"},
nidorino:   {n:"니드리노",id:33,t:["poison"],s:[61,72,57,55,55,65],ml:{1:["tackle","poisonsting","hornattack"],23:["bite"],32:["sludgebomb"]},e:{l:36,to:"nidoking"},cr:120,xp:128,em:"💜"},
nidoking:   {n:"니드킹",id:34,t:["poison","ground"],s:[81,102,77,85,75,85],ml:{1:["poisonsting","hornattack","earthquake"],36:["sludgebomb"],43:["megahorn"],50:["earthquake"]},e:null,cr:45,xp:227,em:"👑"},
clefairy:   {n:"삐삐",id:35,t:["fairy"],s:[70,45,48,60,65,35],ml:{1:["tackle","charm"],8:["dazzlinggleam"],16:["moonblast"]},e:{l:30,to:"clefable"},cr:150,xp:68,em:"🌙"},
clefable:   {n:"픽시",id:36,t:["fairy"],s:[95,70,73,95,90,60],ml:{1:["dazzlinggleam","moonblast","bodyslam"],35:["psychic"]},e:null,cr:25,xp:217,em:"🌙"},
vulpix:     {n:"식스테일",id:37,t:["fire"],s:[38,41,40,50,65,65],ml:{1:["tackle","ember"],12:["quickattack"],19:["flamethrower"]},e:{l:30,to:"ninetales"},cr:190,xp:60,em:"🦊"},
ninetales:  {n:"나인테일",id:38,t:["fire"],s:[73,76,75,81,100,100],ml:{1:["ember","flamethrower","quickattack"],35:["fireblast"],42:["flareblitz"]},e:null,cr:75,xp:177,em:"🦊"},
jigglypuff: {n:"푸린",id:39,t:["normal","fairy"],s:[115,45,20,45,25,20],ml:{1:["tackle","sing"],8:["pound"],15:["bodyslam"],22:["dazzlinggleam"]},e:{l:28,to:"wigglytuff"},cr:170,xp:95,em:"🎵"},
wigglytuff: {n:"푸크린",id:40,t:["normal","fairy"],s:[140,70,45,85,50,45],ml:{1:["bodyslam","dazzlinggleam"],30:["moonblast"],36:["hyperbeam"]},e:null,cr:50,xp:196,em:"🎵"},
zubat:      {n:"주뱃",id:41,t:["poison","flying"],s:[40,45,35,30,40,55],ml:{1:["bite","supersonic"],8:["wingattack"],15:["confuseray"]},e:{l:22,to:"golbat"},cr:255,xp:49,em:"🦇"},
golbat:     {n:"골뱃",id:42,t:["poison","flying"],s:[75,80,70,65,75,90],ml:{1:["bite","wingattack","confuseray"],28:["crunch"],35:["aerialace"]},e:{l:42,to:"crobat"},cr:90,xp:159,em:"🦇"},
oddish:     {n:"뚜벅쵸",id:43,t:["grass","poison"],s:[45,50,55,75,65,30],ml:{1:["absorb"],5:["poisonpowder"],9:["razorleaf"],14:["sleeppowder"]},e:{l:21,to:"gloom"},cr:255,xp:64,em:"🌱"},
gloom:      {n:"냄새꼬",id:44,t:["grass","poison"],s:[60,65,70,85,75,40],ml:{1:["absorb","razorleaf","poisonpowder"],24:["gigadrain"],32:["sludgebomb"]},e:{l:36,to:"vileplume"},cr:120,xp:138,em:"🌱"},
vileplume:  {n:"라플레시아",id:45,t:["grass","poison"],s:[75,80,85,110,90,50],ml:{1:["razorleaf","gigadrain","sludgebomb"],40:["solarbeam"],48:["sleeppowder"]},e:null,cr:45,xp:221,em:"🌸"},
paras:      {n:"파라스",id:46,t:["bug","grass"],s:[35,70,55,45,55,25],ml:{1:["scratch","absorb"],7:["stunspore"],13:["slash"],19:["gigadrain"]},e:{l:24,to:"parasect"},cr:190,xp:57,em:"🍄"},
parasect:   {n:"파라섹트",id:47,t:["bug","grass"],s:[60,95,80,60,80,30],ml:{1:["slash","gigadrain","stunspore"],28:["xscissor"],33:["spore"]},e:null,cr:75,xp:142,em:"🍄"},
venonat:    {n:"콘팡",id:48,t:["bug","poison"],s:[60,55,50,40,55,45],ml:{1:["tackle","confusion"],11:["poisonpowder"],17:["psybeam"],23:["signalbeam"]},e:{l:31,to:"venomoth"},cr:190,xp:61,em:"🐛"},
venomoth:   {n:"도나리",id:49,t:["bug","poison"],s:[70,65,60,90,75,90],ml:{1:["confusion","psybeam","signalbeam"],31:["psychic"],37:["sludgebomb"]},e:null,cr:75,xp:158,em:"🦋"},
diglett:    {n:"디그다",id:50,t:["ground"],s:[10,55,25,35,45,95],ml:{1:["scratch","sandattack"],4:["mudshot"],12:["dig"],18:["slash"]},e:{l:26,to:"dugtrio"},cr:255,xp:53,em:"🕳️"},
dugtrio:    {n:"닥트리오",id:51,t:["ground"],s:[35,100,50,50,70,120],ml:{1:["scratch","dig","slash"],26:["earthquake"],40:["stoneedge"]},e:null,cr:50,xp:153,em:"🕳️"},
meowth:     {n:"나옹",id:52,t:["normal"],s:[40,45,35,40,40,90],ml:{1:["scratch","growl"],6:["bite"],11:["furyswipes"],17:["slash"]},e:{l:28,to:"persian"},cr:255,xp:58,em:"🐱"},
persian:    {n:"페르시온",id:53,t:["normal"],s:[65,70,60,65,65,115],ml:{1:["scratch","bite","slash"],28:["crunch"],35:["hyperbeam"]},e:null,cr:90,xp:154,em:"🐱"},
psyduck:    {n:"고라파덕",id:54,t:["water"],s:[50,52,48,65,50,55],ml:{1:["watergun","confusion"],10:["waterpulse"],18:["psybeam"]},e:{l:33,to:"golduck"},cr:190,xp:64,em:"🦆"},
golduck:    {n:"골덕",id:55,t:["water"],s:[80,82,78,95,80,85],ml:{1:["watergun","psybeam","waterpulse"],33:["surf"],40:["psychic"],48:["hydropump"]},e:null,cr:75,xp:175,em:"🦆"},
mankey:     {n:"망키",id:56,t:["fighting"],s:[40,80,35,35,45,70],ml:{1:["scratch","karatechop"],9:["furyswipes"],15:["crosschop"]},e:{l:28,to:"primeape"},cr:190,xp:61,em:"🐵"},
primeape:   {n:"성원숭",id:57,t:["fighting"],s:[65,105,60,60,70,95],ml:{1:["karatechop","crosschop"],28:["closecombat"],35:["earthquake"]},e:null,cr:75,xp:159,em:"🐵"},
growlithe:  {n:"가디",id:58,t:["fire"],s:[55,70,45,70,50,60],ml:{1:["tackle","bite"],6:["ember"],14:["flamewheel"],20:["flamethrower"]},e:{l:28,to:"arcanine"},cr:190,xp:70,em:"🐕"},
arcanine:   {n:"윈디",id:59,t:["fire"],s:[90,110,80,100,80,95],ml:{1:["bite","flamethrower","flamewheel"],34:["flareblitz"],42:["fireblast"]},e:null,cr:75,xp:194,em:"🐕"},
poliwag:    {n:"발챙이",id:60,t:["water"],s:[40,50,40,40,40,90],ml:{1:["watergun","bubble"],7:["hypnosis"],13:["waterpulse"]},e:{l:25,to:"poliwhirl"},cr:255,xp:60,em:"🌀"},
poliwhirl:  {n:"슈륙챙이",id:61,t:["water"],s:[65,65,65,50,50,90],ml:{1:["watergun","waterpulse","hypnosis"],25:["surf"],33:["bodyslam"]},e:{l:40,to:"poliwrath"},cr:120,xp:135,em:"🌀"},
poliwrath:  {n:"강챙이",id:62,t:["water","fighting"],s:[90,95,95,70,90,70],ml:{1:["surf","bodyslam","hypnosis"],40:["closecombat"],48:["hydropump"]},e:null,cr:45,xp:230,em:"🌀"},
abra:       {n:"캐이시",id:63,t:["psychic"],s:[25,20,15,105,55,90],ml:{1:["confusion"]},e:{l:16,to:"kadabra"},cr:200,xp:62,em:"🔮"},
kadabra:    {n:"윤겔라",id:64,t:["psychic"],s:[40,35,30,120,70,105],ml:{1:["confusion","psybeam"],16:["psychic"],21:["shadowball"]},e:{l:36,to:"alakazam"},cr:100,xp:140,em:"🔮"},
alakazam:   {n:"후딘",id:65,t:["psychic"],s:[55,50,45,135,95,120],ml:{1:["confusion","psychic","shadowball"],36:["calmmind"],42:["psychic"]},e:null,cr:50,xp:225,em:"🔮"},
machop:     {n:"알통몬",id:66,t:["fighting"],s:[70,80,50,35,35,35],ml:{1:["karatechop","growl"],7:["focusenergy"],13:["crosschop"]},e:{l:28,to:"machoke"},cr:180,xp:61,em:"💪"},
machoke:    {n:"근육몬",id:67,t:["fighting"],s:[80,100,70,50,60,45],ml:{1:["karatechop","crosschop"],28:["brickbreak"],36:["dynamicpunch"]},e:{l:40,to:"machamp"},cr:90,xp:142,em:"💪"},
machamp:    {n:"괴력몬",id:68,t:["fighting"],s:[90,130,80,65,85,55],ml:{1:["karatechop","crosschop","brickbreak"],40:["dynamicpunch"],50:["closecombat"]},e:null,cr:45,xp:227,em:"💪"},
bellsprout: {n:"모다피",id:69,t:["grass","poison"],s:[50,75,35,70,30,40],ml:{1:["vinewhip","growl"],7:["razorleaf"],15:["acid"],21:["sleeppowder"]},e:{l:21,to:"weepinbell"},cr:255,xp:60,em:"🌱"},
weepinbell: {n:"우츠동",id:70,t:["grass","poison"],s:[65,90,50,85,45,55],ml:{1:["vinewhip","razorleaf","acid"],24:["sludgebomb"],30:["solarbeam"]},e:{l:36,to:"victreebel"},cr:120,xp:137,em:"🌱"},
victreebel: {n:"우츠보트",id:71,t:["grass","poison"],s:[80,105,65,100,70,70],ml:{1:["razorleaf","sludgebomb","solarbeam"],36:["sleeppowder"],44:["gigadrain"]},e:null,cr:45,xp:221,em:"🌿"},
tentacool:  {n:"왕눈해",id:72,t:["water","poison"],s:[40,40,35,50,100,70],ml:{1:["poisonsting","watergun"],8:["acid"],18:["surf"]},e:{l:30,to:"tentacruel"},cr:190,xp:67,em:"🪼"},
tentacruel: {n:"독파리",id:73,t:["water","poison"],s:[80,70,65,80,120,100],ml:{1:["poisonsting","surf","acid"],30:["sludgebomb"],38:["hydropump"]},e:null,cr:60,xp:180,em:"🪼"},
geodude:    {n:"꼬마돌",id:74,t:["rock","ground"],s:[40,80,100,30,30,20],ml:{1:["tackle","defensecurl"],6:["rockthrow"],11:["mudshot"]},e:{l:25,to:"graveler"},cr:255,xp:60,em:"🪨"},
graveler:   {n:"데구리",id:75,t:["rock","ground"],s:[55,95,115,45,45,35],ml:{1:["tackle","rockthrow","mudshot"],25:["rockslide"],33:["earthquake"]},e:{l:40,to:"golem"},cr:120,xp:137,em:"🪨"},
golem:      {n:"딱구리",id:76,t:["rock","ground"],s:[80,120,130,55,65,45],ml:{1:["rockthrow","rockslide","earthquake"],40:["stoneedge"],48:["explosion"]},e:null,cr:45,xp:223,em:"🪨"},
ponyta:     {n:"포니타",id:77,t:["fire"],s:[50,85,55,65,65,90],ml:{1:["tackle","ember"],8:["flamewheel"],15:["stomp"],25:["flamethrower"]},e:{l:40,to:"rapidash"},cr:190,xp:82,em:"🐴"},
rapidash:   {n:"날쌩마",id:78,t:["fire"],s:[65,100,70,80,80,105],ml:{1:["ember","flamewheel","flamethrower"],40:["flareblitz"],50:["fireblast"]},e:null,cr:60,xp:175,em:"🐴"},
slowpoke:   {n:"야돈",id:79,t:["water","psychic"],s:[90,65,65,40,40,15],ml:{1:["tackle","watergun"],6:["confusion"],15:["waterpulse"],22:["psychic"]},e:{l:37,to:"slowbro"},cr:190,xp:63,em:"🦛"},
slowbro:    {n:"야도란",id:80,t:["water","psychic"],s:[95,75,110,100,80,30],ml:{1:["watergun","psychic","surf"],37:["calmmind"],45:["hydropump"]},e:null,cr:75,xp:172,em:"🦛"},
magnemite:  {n:"코일",id:81,t:["electric","steel"],s:[25,35,70,95,55,45],ml:{1:["thundershock","tackle"],11:["sonicboom"],22:["thunderbolt"]},e:{l:30,to:"magneton"},cr:190,xp:65,em:"🧲"},
magneton:   {n:"레어코일",id:82,t:["electric","steel"],s:[50,60,95,120,70,70],ml:{1:["thundershock","thunderbolt"],30:["triattack"],38:["thunder"],44:["flashcannon"]},e:null,cr:60,xp:163,em:"🧲"},
farfetchd:  {n:"파오리",id:83,t:["normal","flying"],s:[52,90,55,58,62,60],ml:{1:["peck","slash"],9:["furyattack"],17:["aerialace"],25:["swordsdance"]},e:null,cr:45,xp:94,em:"🦆"},
doduo:      {n:"두두",id:84,t:["normal","flying"],s:[35,85,45,35,35,75],ml:{1:["peck","growl"],9:["furyattack"],13:["quickattack"],21:["drillpeck"]},e:{l:31,to:"dodrio"},cr:190,xp:62,em:"🐦"},
dodrio:     {n:"두트리오",id:85,t:["normal","flying"],s:[60,110,70,60,60,110],ml:{1:["peck","furyattack","drillpeck"],31:["triattack"],37:["fly"]},e:null,cr:45,xp:165,em:"🐦"},
seel:       {n:"쥬쥬",id:86,t:["water"],s:[65,45,55,45,70,45],ml:{1:["tackle","watergun"],7:["icepunch"],16:["aurorabeam"],21:["surf"]},e:{l:34,to:"dewgong"},cr:190,xp:65,em:"🦭"},
dewgong:    {n:"쥬레곤",id:87,t:["water","ice"],s:[90,70,80,70,95,70],ml:{1:["watergun","icepunch","surf"],34:["icebeam"],42:["blizzard"]},e:null,cr:75,xp:166,em:"🦭"},
grimer:     {n:"질퍽이",id:88,t:["poison"],s:[80,80,50,40,50,25],ml:{1:["tackle","poisonsting"],4:["acid"],12:["sludgebomb"],18:["toxic"]},e:{l:38,to:"muk"},cr:190,xp:65,em:"💩"},
muk:        {n:"질뻐기",id:89,t:["poison"],s:[105,105,75,65,100,50],ml:{1:["acid","sludgebomb","toxic"],38:["explosion"]},e:null,cr:75,xp:175,em:"💩"},
shellder:   {n:"셀러",id:90,t:["water"],s:[30,65,100,45,25,40],ml:{1:["tackle","watergun"],8:["iciclespear"],13:["icebeam"]},e:{l:30,to:"cloyster"},cr:190,xp:61,em:"🐚"},
cloyster:   {n:"파르셀",id:91,t:["water","ice"],s:[50,95,180,85,45,70],ml:{1:["watergun","icebeam"],30:["surf"],36:["blizzard"],42:["hydropump"]},e:null,cr:60,xp:184,em:"🐚"},
gastly:     {n:"고오스",id:92,t:["ghost","poison"],s:[30,35,30,100,35,80],ml:{1:["lick","confuseray"],8:["nightshade"],16:["shadowball"]},e:{l:25,to:"haunter"},cr:190,xp:62,em:"👻"},
haunter:    {n:"고우스트",id:93,t:["ghost","poison"],s:[45,50,45,115,55,95],ml:{1:["lick","nightshade","shadowball"],25:["darkpulse"],33:["dreameater"]},e:{l:38,to:"gengar"},cr:90,xp:142,em:"👻"},
gengar:     {n:"팬텀",id:94,t:["ghost","poison"],s:[60,65,60,130,75,110],ml:{1:["shadowball","darkpulse","sludgebomb"],38:["dreameater"],48:["shadowball"]},e:null,cr:45,xp:225,em:"👻"},
onix:       {n:"롱스톤",id:95,t:["rock","ground"],s:[35,45,160,30,45,70],ml:{1:["tackle","rockthrow"],9:["bind"],15:["rockslide"],23:["earthquake"]},e:{l:36,to:"steelix"},cr:45,xp:77,em:"🐍"},
drowzee:    {n:"슬리프",id:96,t:["psychic"],s:[60,48,45,43,90,42],ml:{1:["confusion","hypnosis"],12:["psybeam"],22:["psychic"]},e:{l:26,to:"hypno"},cr:190,xp:66,em:"💤"},
hypno:      {n:"슬리퍼",id:97,t:["psychic"],s:[85,73,70,73,115,67],ml:{1:["confusion","psybeam","psychic"],26:["hypnosis"],33:["dreameater"],40:["psychic"]},e:null,cr:75,xp:169,em:"💤"},
krabby:     {n:"크랩",id:98,t:["water"],s:[30,105,90,25,25,50],ml:{1:["watergun","scratch"],5:["mudshot"],12:["stomp"],20:["crabhammer"]},e:{l:28,to:"kingler"},cr:225,xp:65,em:"🦀"},
kingler:    {n:"킹크랩",id:99,t:["water"],s:[55,130,115,50,50,75],ml:{1:["watergun","crabhammer"],28:["surf"],35:["earthquake"]},e:null,cr:60,xp:166,em:"🦀"},
voltorb:    {n:"찌리리공",id:100,t:["electric"],s:[40,30,50,55,55,100],ml:{1:["thundershock","tackle"],8:["sonicboom"],15:["thunderbolt"],22:["explosion"]},e:{l:30,to:"electrode"},cr:190,xp:66,em:"🔴"},
electrode:  {n:"붐볼",id:101,t:["electric"],s:[60,50,70,80,80,150],ml:{1:["thundershock","thunderbolt"],30:["thunder"],36:["explosion"]},e:null,cr:60,xp:172,em:"🔴"},
exeggcute:  {n:"아라리",id:102,t:["grass","psychic"],s:[60,40,80,60,45,40],ml:{1:["confusion","absorb"],7:["sleeppowder"],15:["psybeam"]},e:{l:30,to:"exeggutor"},cr:90,xp:65,em:"🥚"},
exeggutor:  {n:"나시",id:103,t:["grass","psychic"],s:[95,95,85,125,75,55],ml:{1:["confusion","psybeam"],30:["psychic"],36:["solarbeam"],42:["gigadrain"]},e:null,cr:45,xp:186,em:"🌴"},
cubone:     {n:"탕구리",id:104,t:["ground"],s:[50,50,95,40,50,35],ml:{1:["tackle","growl"],5:["mudshot"],11:["bonemerang"],17:["headbutt"]},e:{l:28,to:"marowak"},cr:190,xp:64,em:"💀"},
marowak:    {n:"텅구리",id:105,t:["ground"],s:[60,80,110,50,80,45],ml:{1:["mudshot","bonemerang","headbutt"],28:["earthquake"],36:["stoneedge"]},e:null,cr:75,xp:149,em:"💀"},
hitmonlee:  {n:"시라소몬",id:106,t:["fighting"],s:[50,120,53,35,110,87],ml:{1:["karatechop","focusenergy"],10:["crosschop"],20:["closecombat"],30:["megakick"]},e:null,cr:45,xp:159,em:"🦵"},
hitmonchan: {n:"홍수몬",id:107,t:["fighting"],s:[50,105,79,35,110,76],ml:{1:["karatechop","focusenergy"],10:["icepunch"],15:["thunderpunch"],20:["firepunch"],25:["closecombat"]},e:null,cr:45,xp:159,em:"🥊"},
lickitung:  {n:"내루미",id:108,t:["normal"],s:[90,55,75,60,75,30],ml:{1:["lick","tackle"],9:["bodyslam"],17:["slam"],25:["hyperbeam"]},e:null,cr:45,xp:77,em:"👅"},
koffing:    {n:"또가스",id:109,t:["poison"],s:[40,65,95,60,45,35],ml:{1:["tackle","poisonsting"],6:["acid"],12:["sludgebomb"],18:["toxic"]},e:{l:35,to:"weezing"},cr:190,xp:68,em:"💨"},
weezing:    {n:"또도가스",id:110,t:["poison"],s:[65,90,120,85,70,60],ml:{1:["acid","sludgebomb","toxic"],35:["explosion"]},e:null,cr:60,xp:172,em:"💨"},
rhyhorn:    {n:"뿔카노",id:111,t:["ground","rock"],s:[80,85,95,30,30,25],ml:{1:["tackle","hornattack"],9:["rockthrow"],17:["stomp"],25:["earthquake"]},e:{l:42,to:"rhydon"},cr:120,xp:69,em:"🦏"},
rhydon:     {n:"코뿌리",id:112,t:["ground","rock"],s:[105,130,120,45,45,40],ml:{1:["hornattack","earthquake","rockslide"],42:["stoneedge"],50:["megahorn"]},e:null,cr:60,xp:170,em:"🦏"},
chansey:    {n:"럭키",id:113,t:["normal"],s:[250,5,5,35,105,50],ml:{1:["tackle","growl"],5:["dazzlinggleam"],12:["bodyslam"],20:["softboiled"]},e:null,cr:30,xp:395,em:"🥚"},
tangela:    {n:"덩구리",id:114,t:["grass"],s:[65,55,115,100,40,60],ml:{1:["vinewhip","absorb"],10:["razorleaf"],19:["gigadrain"],25:["solarbeam"]},e:null,cr:45,xp:87,em:"🌿"},
kangaskhan: {n:"캥카",id:115,t:["normal"],s:[105,95,80,40,80,90],ml:{1:["scratch","bite"],7:["bodyslam"],15:["crunch"],25:["earthquake"]},e:null,cr:45,xp:172,em:"🦘"},
horsea:     {n:"쏘드라",id:116,t:["water"],s:[30,40,70,70,25,60],ml:{1:["watergun","smokescreen"],8:["waterpulse"],15:["dragonrage"]},e:{l:32,to:"seadra"},cr:225,xp:59,em:"🐴"},
seadra:     {n:"시드라",id:117,t:["water"],s:[55,65,95,95,45,85],ml:{1:["watergun","waterpulse"],32:["surf"],38:["dragonpulse"],42:["hydropump"]},e:{l:48,to:"kingdra"},cr:75,xp:154,em:"🐴"},
goldeen:    {n:"콘치",id:118,t:["water"],s:[45,67,60,35,50,63],ml:{1:["watergun","peck"],10:["hornattack"],19:["waterfall"],27:["megahorn"]},e:{l:33,to:"seaking"},cr:225,xp:64,em:"🐟"},
seaking:    {n:"왕콘치",id:119,t:["water"],s:[80,92,65,65,80,68],ml:{1:["watergun","hornattack","waterfall"],33:["megahorn"],40:["surf"]},e:null,cr:60,xp:158,em:"🐟"},
staryu:     {n:"별가사리",id:120,t:["water"],s:[30,45,55,70,55,85],ml:{1:["watergun","tackle"],7:["waterpulse"],13:["psychic"]},e:{l:30,to:"starmie"},cr:225,xp:68,em:"⭐"},
starmie:    {n:"아쿠스타",id:121,t:["water","psychic"],s:[60,75,85,100,85,115],ml:{1:["watergun","psychic","surf"],30:["icebeam"],36:["thunderbolt"],42:["hydropump"]},e:null,cr:60,xp:182,em:"⭐"},
mrmime:     {n:"마임맨",id:122,t:["psychic","fairy"],s:[40,45,65,100,120,90],ml:{1:["confusion","dazzlinggleam"],10:["psybeam"],20:["psychic"],30:["moonblast"]},e:null,cr:45,xp:136,em:"🤹"},
scyther:    {n:"스라크",id:123,t:["bug","flying"],s:[70,110,80,55,80,105],ml:{1:["quickattack","slash"],10:["wingattack"],18:["xscissor"],25:["aerialace"],30:["swordsdance"]},e:{l:40,to:"scizor"},cr:45,xp:100,em:"🦗"},
jynx:       {n:"루주라",id:124,t:["ice","psychic"],s:[65,50,35,115,95,95],ml:{1:["confusion","icepunch"],12:["psychic"],20:["icebeam"],28:["blizzard"]},e:null,cr:45,xp:137,em:"💋"},
electabuzz: {n:"에레브",id:125,t:["electric"],s:[65,83,57,95,85,105],ml:{1:["thundershock","quickattack"],9:["thunderpunch"],17:["thunderbolt"],25:["thunder"]},e:null,cr:45,xp:172,em:"⚡"},
magmar:     {n:"마그마",id:126,t:["fire"],s:[65,95,57,100,85,93],ml:{1:["ember","smokescreen"],9:["firepunch"],17:["flamethrower"],25:["fireblast"]},e:null,cr:45,xp:173,em:"🔥"},
pinsir:     {n:"쁘사이저",id:127,t:["bug"],s:[65,125,100,55,70,85],ml:{1:["tackle","focusenergy"],7:["xscissor"],18:["brickbreak"],25:["megahorn"],30:["swordsdance"]},e:null,cr:45,xp:175,em:"🪲"},
tauros:     {n:"켄타로스",id:128,t:["normal"],s:[75,100,95,40,70,110],ml:{1:["tackle","hornattack"],10:["stomp"],19:["bodyslam"],28:["earthquake"]},e:null,cr:45,xp:172,em:"🐂"},
magikarp:   {n:"잉어킹",id:129,t:["water"],s:[20,10,55,15,20,80],ml:{1:["splash","tackle"]},e:{l:20,to:"gyarados"},cr:255,xp:40,em:"🐟"},
gyarados:   {n:"갸라도스",id:130,t:["water","flying"],s:[95,125,79,60,100,81],ml:{1:["bite","watergun"],20:["surf"],28:["crunch"],36:["hydropump"],44:["hyperbeam"]},e:null,cr:45,xp:189,em:"🐉"},
lapras:     {n:"라프라스",id:131,t:["water","ice"],s:[130,85,80,85,95,60],ml:{1:["watergun","icebeam"],15:["surf"],25:["icebeam"],35:["hydropump"],45:["blizzard"]},e:null,cr:45,xp:187,em:"🐋"},
ditto:      {n:"메타몽",id:132,t:["normal"],s:[48,48,48,48,48,48],ml:{1:["tackle"]},e:null,cr:35,xp:101,em:"🟣"},
eevee:      {n:"이브이",id:133,t:["normal"],s:[55,55,50,45,65,55],ml:{1:["tackle","tailwhip"],8:["quickattack"],16:["bite"]},e:null,cr:45,xp:65,em:"🦊"},
vaporeon:   {n:"샤미드",id:134,t:["water"],s:[130,65,60,110,95,65],ml:{1:["tackle","watergun"],10:["waterpulse"],20:["surf"],30:["icebeam"],40:["hydropump"]},e:null,cr:45,xp:184,em:"💧"},
jolteon:    {n:"쥬피썬더",id:135,t:["electric"],s:[65,65,60,110,95,130],ml:{1:["tackle","thundershock"],10:["quickattack"],20:["thunderbolt"],30:["thunder"],40:["thunderwave"]},e:null,cr:45,xp:184,em:"⚡"},
flareon:    {n:"부스터",id:136,t:["fire"],s:[65,130,60,95,110,65],ml:{1:["tackle","ember"],10:["bite"],20:["flamethrower"],30:["fireblast"],40:["flareblitz"]},e:null,cr:45,xp:184,em:"🔥"},
porygon:    {n:"폴리곤",id:137,t:["normal"],s:[65,60,70,85,75,40],ml:{1:["tackle","thundershock"],9:["psybeam"],15:["triattack"],23:["thunderbolt"]},e:{l:37,to:"porygon2"},cr:45,xp:79,em:"💾"},
omanyte:    {n:"암나이트",id:138,t:["rock","water"],s:[35,40,100,90,55,35],ml:{1:["watergun","rockthrow"],10:["mudshot"],19:["surf"],28:["icebeam"]},e:{l:40,to:"omastar"},cr:45,xp:71,em:"🐚"},
omastar:    {n:"암스타",id:139,t:["rock","water"],s:[70,60,125,115,70,55],ml:{1:["watergun","rockslide","surf"],40:["hydropump"],46:["stoneedge"]},e:null,cr:45,xp:199,em:"🐚"},
kabuto:     {n:"투구",id:140,t:["rock","water"],s:[30,80,90,55,45,55],ml:{1:["scratch","watergun"],6:["mudshot"],16:["rockslide"],21:["slash"]},e:{l:40,to:"kabutops"},cr:45,xp:71,em:"🐚"},
kabutops:   {n:"투구푸스",id:141,t:["rock","water"],s:[60,115,105,65,70,80],ml:{1:["slash","rockslide","surf"],40:["stoneedge"],46:["xscissor"]},e:null,cr:45,xp:199,em:"🐚"},
aerodactyl: {n:"프테라",id:142,t:["rock","flying"],s:[80,105,65,60,75,130],ml:{1:["wingattack","rockthrow"],10:["bite"],20:["aerialace"],28:["stoneedge"],36:["fly"]},e:null,cr:45,xp:180,em:"🦕"},
snorlax:    {n:"잠만보",id:143,t:["normal"],s:[160,110,65,65,110,30],ml:{1:["tackle","bodyslam"],12:["bite"],20:["rest"],30:["hyperbeam"],40:["earthquake"]},e:null,cr:25,xp:189,em:"😴"},
articuno:   {n:"프리져",id:144,t:["ice","flying"],s:[90,85,100,95,125,85],ml:{1:["icebeam","gust"],30:["blizzard"],40:["fly"],50:["hyperbeam"]},e:null,cr:3,xp:261,em:"❄️"},
zapdos:     {n:"썬더",id:145,t:["electric","flying"],s:[90,90,85,125,90,100],ml:{1:["thunderbolt","gust"],30:["thunder"],40:["fly"],50:["hyperbeam"]},e:null,cr:3,xp:261,em:"⚡"},
moltres:    {n:"파이어",id:146,t:["fire","flying"],s:[90,100,90,125,85,90],ml:{1:["flamethrower","gust"],30:["fireblast"],40:["fly"],50:["hyperbeam"]},e:null,cr:3,xp:261,em:"🔥"},
dratini:    {n:"미뇽",id:147,t:["dragon"],s:[41,64,45,50,50,50],ml:{1:["tackle","dragonrage"],11:["thunderwave"],20:["slam"]},e:{l:30,to:"dragonair"},cr:45,xp:60,em:"🐲"},
dragonair:  {n:"신뇽",id:148,t:["dragon"],s:[61,84,65,70,70,70],ml:{1:["dragonrage","slam"],30:["dragonclaw"],38:["thunderbolt"]},e:{l:55,to:"dragonite"},cr:45,xp:147,em:"🐲"},
dragonite:  {n:"망나뇽",id:149,t:["dragon","flying"],s:[91,134,95,100,100,80],ml:{1:["dragonclaw","slam","thunderbolt"],55:["outrage"],63:["hyperbeam"],70:["fly"]},e:null,cr:45,xp:270,em:"🐲"},
mewtwo:     {n:"뮤츠",id:150,t:["psychic"],s:[106,110,90,154,90,130],ml:{1:["confusion","psychic","shadowball","icebeam"],50:["psychic"],60:["calmmind"],70:["hyperbeam"]},e:null,cr:3,xp:306,em:"🧬"},
mew:        {n:"뮤",id:151,t:["psychic"],s:[100,100,100,100,100,100],ml:{1:["psychic","flamethrower","surf","thunderbolt"],50:["calmmind"]},e:null,cr:3,xp:270,em:"🩷"},
// ── Gen 2 스타터 ──
chikorita:  {n:"치코리타",id:152,t:["grass"],s:[45,49,65,49,65,45],ml:{1:["tackle","growl"],6:["razorleaf"],12:["poisonpowder"],18:["gigadrain"]},e:{l:16,to:"bayleef"},cr:45,xp:64,em:"🍃"},
bayleef:    {n:"베이리프",id:153,t:["grass"],s:[60,62,80,63,80,60],ml:{1:["tackle","razorleaf","gigadrain"],23:["bodyslam"],31:["solarbeam"]},e:{l:32,to:"meganium"},cr:45,xp:142,em:"🍃"},
meganium:   {n:"메가니움",id:154,t:["grass"],s:[80,82,100,83,100,80],ml:{1:["razorleaf","gigadrain","bodyslam"],32:["solarbeam"],42:["earthquake"]},e:null,cr:45,xp:236,em:"🌺"},
cyndaquil:  {n:"브케인",id:155,t:["fire"],s:[39,52,43,60,50,65],ml:{1:["tackle","growl"],6:["ember"],12:["quickattack"],19:["flamethrower"]},e:{l:14,to:"quilava"},cr:45,xp:62,em:"🔥"},
quilava:    {n:"마그케인",id:156,t:["fire"],s:[58,64,58,80,65,80],ml:{1:["tackle","ember","flamethrower"],21:["flamewheel"],31:["flareblitz"]},e:{l:36,to:"typhlosion"},cr:45,xp:142,em:"🔥"},
typhlosion: {n:"블레이범",id:157,t:["fire"],s:[78,84,78,109,85,100],ml:{1:["ember","flamethrower","flareblitz"],36:["fireblast"],48:["eruption"]},e:null,cr:45,xp:240,em:"🌋"},
totodile:   {n:"리아코",id:158,t:["water"],s:[50,65,64,44,48,43],ml:{1:["scratch","growl"],6:["watergun"],12:["bite"],20:["waterpulse"]},e:{l:18,to:"croconaw"},cr:45,xp:63,em:"🐊"},
croconaw:   {n:"엘리게이",id:159,t:["water"],s:[65,80,80,59,63,58],ml:{1:["scratch","watergun","bite"],21:["surf"],28:["crunch"]},e:{l:30,to:"feraligatr"},cr:45,xp:142,em:"🐊"},
feraligatr: {n:"장크로다일",id:160,t:["water"],s:[85,105,100,79,83,78],ml:{1:["watergun","bite","surf","crunch"],30:["hydropump"],38:["earthquake"],45:["hyperbeam"]},e:null,cr:45,xp:239,em:"🐊"},
sentret:    {n:"꼬리선",id:161,t:["normal"],s:[35,46,34,35,45,20],ml:{1:["tackle","scratch"],4:["quickattack"],7:["bite"]},e:{l:15,to:"furret"},cr:255,xp:43,em:"🐿️"},
furret:     {n:"다꼬리",id:162,t:["normal"],s:[85,76,64,45,55,90],ml:{1:["tackle","quickattack","bite"],15:["slam"],24:["bodyslam"]},e:null,cr:90,xp:145,em:"🐿️"},
hoothoot:   {n:"부우부",id:163,t:["normal","flying"],s:[60,30,30,36,56,50],ml:{1:["tackle","confusion"],7:["hypnosis"],16:["psybeam"]},e:{l:20,to:"noctowl"},cr:255,xp:52,em:"🦉"},
noctowl:    {n:"야부엉",id:164,t:["normal","flying"],s:[100,50,50,86,96,70],ml:{1:["confusion","psybeam","hypnosis"],25:["psychic"],33:["aerialace"]},e:null,cr:90,xp:158,em:"🦉"},
ledyba:     {n:"레디바",id:165,t:["bug","flying"],s:[40,20,30,40,80,55],ml:{1:["tackle","supersonic"],6:["bugbite"],12:["lightscreen"]},e:{l:18,to:"ledian"},cr:255,xp:54,em:"🐞"},
ledian:     {n:"레디안",id:166,t:["bug","flying"],s:[55,35,50,55,110,85],ml:{1:["bugbite","supersonic"],18:["xscissor"],24:["aerialace"]},e:null,cr:90,xp:134,em:"🐞"},
spinarak:   {n:"페이검",id:167,t:["bug","poison"],s:[40,60,40,40,40,30],ml:{1:["poisonsting","stringshot"],6:["bugbite"],12:["nightshade"]},e:{l:22,to:"ariados"},cr:255,xp:50,em:"🕷️"},
ariados:    {n:"아리아도스",id:168,t:["bug","poison"],s:[70,90,70,60,70,40],ml:{1:["poisonsting","bugbite","nightshade"],22:["sludgebomb"],30:["xscissor"]},e:null,cr:90,xp:140,em:"🕷️"},
crobat:     {n:"크로뱃",id:169,t:["poison","flying"],s:[85,90,80,70,80,130],ml:{1:["bite","wingattack","crunch","aerialace"],42:["crosspoison"],50:["fly"]},e:null,cr:90,xp:204,em:"🦇"},
chinchou:   {n:"초라기",id:170,t:["water","electric"],s:[75,38,38,56,56,67],ml:{1:["watergun","thundershock"],6:["supersonic"],11:["waterpulse"],17:["thunderbolt"]},e:{l:27,to:"lanturn"},cr:190,xp:66,em:"💡"},
lanturn:    {n:"랜턴",id:171,t:["water","electric"],s:[125,58,58,76,76,67],ml:{1:["watergun","thunderbolt","waterpulse"],27:["surf"],33:["thunder"]},e:null,cr:75,xp:161,em:"💡"},
pichu:      {n:"피츄",id:172,t:["electric"],s:[20,40,15,35,35,60],ml:{1:["thundershock","charm"],5:["tailwhip"],9:["quickattack"]},e:{l:12,to:"pikachu"},cr:190,xp:41,em:"⚡"},
togepi:     {n:"토게피",id:175,t:["fairy"],s:[35,20,65,40,65,20],ml:{1:["tackle","charm"],5:["sweetkiss"],10:["dazzlinggleam"]},e:{l:20,to:"togetic"},cr:190,xp:44,em:"🥚"},
togetic:    {n:"토게틱",id:176,t:["fairy","flying"],s:[55,40,85,80,105,40],ml:{1:["dazzlinggleam","charm"],20:["aerialace"],28:["moonblast"]},e:null,cr:75,xp:142,em:"🧚"},
natu:       {n:"네이티",id:177,t:["psychic","flying"],s:[40,50,45,70,45,70],ml:{1:["peck","confusion"],6:["nightshade"],10:["psybeam"]},e:{l:25,to:"xatu"},cr:190,xp:73,em:"🐦"},
xatu:       {n:"네이티오",id:178,t:["psychic","flying"],s:[65,75,70,95,70,95],ml:{1:["psybeam","nightshade"],25:["psychic"],33:["aerialace"]},e:null,cr:75,xp:165,em:"🐦"},
mareep:     {n:"메리프",id:179,t:["electric"],s:[55,40,40,65,45,35],ml:{1:["tackle","thundershock"],9:["thunderwave"],14:["thunderbolt"]},e:{l:15,to:"flaaffy"},cr:235,xp:56,em:"🐑"},
flaaffy:    {n:"보송송",id:180,t:["electric"],s:[70,55,55,80,60,45],ml:{1:["tackle","thundershock","thunderbolt"],18:["thunderwave"],25:["thunder"]},e:{l:30,to:"ampharos"},cr:120,xp:128,em:"🐑"},
ampharos:   {n:"전룡",id:181,t:["electric"],s:[90,75,85,115,90,55],ml:{1:["thundershock","thunderbolt","thunder"],30:["thunderwave"],38:["signalbeam"],45:["thunder"]},e:null,cr:45,xp:230,em:"⚡"},
sudowoodo:  {n:"꼬지모",id:185,t:["rock"],s:[70,100,115,30,65,30],ml:{1:["rockthrow","tackle"],6:["rockslide"],15:["slam"],22:["stoneedge"],30:["earthquake"]},e:null,cr:65,xp:135,em:"🌳"},
politoed:   {n:"왕구리",id:186,t:["water"],s:[90,75,75,90,100,70],ml:{1:["watergun","surf","hypnosis"],36:["hydropump"],42:["icebeam"]},e:null,cr:45,xp:225,em:"🐸"},
aipom:      {n:"에이팜",id:190,t:["normal"],s:[55,70,55,40,55,85],ml:{1:["scratch","tailwhip"],5:["quickattack"],10:["furyswipes"],18:["slam"]},e:null,cr:45,xp:72,em:"🐵"},
sunkern:    {n:"해너츠",id:191,t:["grass"],s:[30,30,30,30,30,30],ml:{1:["absorb","growl"],6:["razorleaf"],13:["gigadrain"]},e:{l:22,to:"sunflora"},cr:235,xp:36,em:"🌻"},
sunflora:   {n:"해루미",id:192,t:["grass"],s:[75,75,55,105,85,30],ml:{1:["razorleaf","gigadrain"],22:["solarbeam"],30:["sleeppowder"]},e:null,cr:120,xp:149,em:"🌻"},
wooper:     {n:"우파",id:194,t:["water","ground"],s:[55,45,45,25,25,15],ml:{1:["watergun","mudshot"],9:["slam"],15:["earthquake"]},e:{l:20,to:"quagsire"},cr:255,xp:42,em:"🌊"},
quagsire:   {n:"누오",id:195,t:["water","ground"],s:[95,85,85,65,65,35],ml:{1:["watergun","mudshot","earthquake"],20:["surf"],28:["earthquake"]},e:null,cr:90,xp:151,em:"🌊"},
espeon:     {n:"에브이",id:196,t:["psychic"],s:[65,65,60,130,95,110],ml:{1:["tackle","confusion"],10:["quickattack"],16:["psybeam"],23:["psychic"],30:["calmmind"],36:["shadowball"]},e:null,cr:45,xp:184,em:"🌟"},
umbreon:    {n:"블래키",id:197,t:["dark"],s:[95,65,110,60,130,65],ml:{1:["tackle","bite"],10:["quickattack"],16:["confuseray"],23:["darkpulse"],30:["moonlight"],36:["crunch"]},e:null,cr:45,xp:184,em:"🌙"},
murkrow:    {n:"니로우",id:198,t:["dark","flying"],s:[60,85,42,85,42,91],ml:{1:["tackle","gust"],8:["bite"],14:["wingattack"],22:["darkpulse"],28:["nightshade"]},e:null,cr:30,xp:81,em:"🐦‍⬛"},
slowking:   {n:"야도킹",id:199,t:["water","psychic"],s:[95,75,80,100,110,30],ml:{1:["watergun","confusion","psychic"],37:["calmmind"],45:["hydropump"]},e:null,cr:70,xp:172,em:"👑"},
misdreavus: {n:"무우마",id:200,t:["ghost"],s:[60,60,60,85,85,85],ml:{1:["confusion","confuseray"],6:["nightshade"],14:["shadowball"],22:["darkpulse"]},e:null,cr:45,xp:87,em:"👻"},
girafarig:  {n:"키링키",id:203,t:["normal","psychic"],s:[70,80,65,90,65,85],ml:{1:["tackle","confusion"],7:["psybeam"],13:["stomp"],19:["psychic"],25:["crunch"]},e:null,cr:60,xp:159,em:"🦒"},
pineco:     {n:"피콘",id:204,t:["bug"],s:[50,65,90,35,35,15],ml:{1:["tackle","bugbite"],6:["rapidpin"],14:["explosion"]},e:{l:31,to:"forretress"},cr:190,xp:58,em:"🌰"},
forretress: {n:"쏘콘",id:205,t:["bug","steel"],s:[75,90,140,60,60,40],ml:{1:["bugbite","rapidpin"],31:["flashcannon"],38:["explosion"]},e:null,cr:75,xp:163,em:"🌰"},
dunsparce:  {n:"노고치",id:206,t:["normal"],s:[100,70,70,65,65,45],ml:{1:["tackle","bite"],6:["bodyslam"],14:["rockslide"],22:["earthquake"]},e:null,cr:190,xp:145,em:"🐍"},
gligar:     {n:"글라이거",id:207,t:["ground","flying"],s:[65,75,105,35,65,85],ml:{1:["scratch","poisonsting"],6:["quickattack"],13:["slash"],19:["earthquake"]},e:null,cr:60,xp:86,em:"🦂"},
steelix:    {n:"강철톤",id:208,t:["steel","ground"],s:[75,85,200,55,65,30],ml:{1:["tackle","rockthrow","earthquake"],36:["irontail"],42:["stoneedge"],50:["flashcannon"]},e:null,cr:25,xp:179,em:"⛓️"},
snubbull:   {n:"블루",id:209,t:["fairy"],s:[60,80,50,40,40,30],ml:{1:["tackle","bite"],7:["charm"],13:["dazzlinggleam"],19:["crunch"]},e:{l:23,to:"granbull"},cr:190,xp:60,em:"🐶"},
granbull:   {n:"그랑블루",id:210,t:["fairy"],s:[90,120,75,60,60,45],ml:{1:["bite","crunch","dazzlinggleam"],23:["moonblast"],30:["closecombat"]},e:null,cr:75,xp:158,em:"🐶"},
scizor:     {n:"핫삼",id:212,t:["bug","steel"],s:[70,130,100,55,80,65],ml:{1:["quickattack","metalclaw"],10:["xscissor"],20:["bulletpunch"],28:["flashcannon"],35:["swordsdance"]},e:null,cr:25,xp:175,em:"✂️"},
sneasel:    {n:"포푸니",id:215,t:["dark","ice"],s:[55,95,55,35,75,115],ml:{1:["scratch","bite"],8:["icepunch"],14:["quickattack"],22:["crunch"],28:["icebeam"]},e:null,cr:60,xp:132,em:"❄️"},
teddiursa:  {n:"깜지곰",id:216,t:["normal"],s:[60,80,50,50,50,40],ml:{1:["scratch","growl"],7:["furyswipes"],13:["slash"],19:["bodyslam"]},e:{l:30,to:"ursaring"},cr:120,xp:66,em:"🧸"},
ursaring:   {n:"링곰",id:217,t:["normal"],s:[90,130,75,75,75,55],ml:{1:["scratch","slash","bodyslam"],30:["crunch"],36:["earthquake"],42:["hyperbeam"]},e:null,cr:60,xp:175,em:"🐻"},
slugma:     {n:"마그마그",id:218,t:["fire"],s:[40,40,40,70,40,20],ml:{1:["ember","tackle"],8:["rockthrow"],15:["flamethrower"]},e:{l:38,to:"magcargo"},cr:190,xp:56,em:"🌋"},
magcargo:   {n:"마그카르고",id:219,t:["fire","rock"],s:[60,50,120,90,80,30],ml:{1:["ember","rockthrow","flamethrower"],38:["fireblast"],44:["stoneedge"]},e:null,cr:75,xp:154,em:"🌋"},
swinub:     {n:"꾸꾸리",id:220,t:["ice","ground"],s:[50,50,40,30,30,50],ml:{1:["tackle","mudshot"],5:["icepunch"],13:["icebeam"],19:["earthquake"]},e:{l:33,to:"piloswine"},cr:225,xp:50,em:"🐗"},
piloswine:  {n:"메꾸리",id:221,t:["ice","ground"],s:[100,100,80,60,60,50],ml:{1:["mudshot","icebeam","earthquake"],33:["blizzard"],40:["stoneedge"]},e:null,cr:75,xp:158,em:"🐗"},
corsola:    {n:"코산호",id:222,t:["water","rock"],s:[65,55,95,65,95,35],ml:{1:["tackle","watergun"],6:["rockthrow"],13:["surf"],19:["rockslide"]},e:null,cr:60,xp:133,em:"🪸"},
houndour:   {n:"델빌",id:228,t:["dark","fire"],s:[45,60,30,80,50,65],ml:{1:["tackle","ember"],7:["bite"],13:["flamethrower"],20:["darkpulse"]},e:{l:24,to:"houndoom"},cr:120,xp:66,em:"🐕‍🦺"},
houndoom:   {n:"헬가",id:229,t:["dark","fire"],s:[75,90,50,110,80,95],ml:{1:["ember","flamethrower","darkpulse"],24:["crunch"],30:["fireblast"],38:["flareblitz"]},e:null,cr:45,xp:175,em:"🐕‍🦺"},
kingdra:    {n:"킹드라",id:230,t:["water","dragon"],s:[75,95,95,95,95,85],ml:{1:["watergun","dragonrage","surf"],48:["hydropump"],55:["outrage"]},e:null,cr:45,xp:207,em:"🐉"},
phanpy:     {n:"코코리",id:231,t:["ground"],s:[90,60,60,40,40,40],ml:{1:["tackle","mudshot"],6:["rollout"],10:["slam"],15:["earthquake"]},e:{l:25,to:"donphan"},cr:120,xp:66,em:"🐘"},
donphan:    {n:"코리갑",id:232,t:["ground"],s:[90,120,120,60,60,50],ml:{1:["mudshot","slam","earthquake"],25:["stoneedge"],30:["bodyslam"]},e:null,cr:60,xp:175,em:"🐘"},
stantler:   {n:"노라키",id:234,t:["normal"],s:[73,95,62,85,65,85],ml:{1:["tackle","confusion"],7:["stomp"],13:["psybeam"],19:["bodyslam"],25:["psychic"]},e:null,cr:45,xp:163,em:"🦌"},
tyrogue:    {n:"배루키",id:236,t:["fighting"],s:[35,35,35,35,35,35],ml:{1:["tackle","karatechop"],5:["focusenergy"]},e:{l:20,to:"hitmontop"},cr:75,xp:42,em:"🥋"},
hitmontop:  {n:"카포에라",id:237,t:["fighting"],s:[50,95,95,35,110,70],ml:{1:["karatechop","focusenergy"],20:["tripleKick"],28:["closecombat"]},e:null,cr:45,xp:159,em:"🥋"},
miltank:    {n:"밀탱크",id:241,t:["normal"],s:[95,80,105,40,70,100],ml:{1:["tackle","growl"],5:["bodyslam"],13:["stomp"],19:["earthquake"],25:["hyperbeam"]},e:null,cr:45,xp:172,em:"🐄"},
blissey:    {n:"해피너스",id:242,t:["normal"],s:[255,10,10,75,135,55],ml:{1:["tackle","dazzlinggleam"],12:["bodyslam"],20:["softboiled"],28:["psychic"]},e:null,cr:30,xp:608,em:"🩷"},
raikou:     {n:"라이코",id:243,t:["electric"],s:[90,85,75,115,100,115],ml:{1:["thundershock","quickattack","thunderbolt"],30:["thunder"],40:["calmmind"],50:["hyperbeam"]},e:null,cr:3,xp:261,em:"⚡"},
entei:      {n:"앤테이",id:244,t:["fire"],s:[115,115,85,90,75,100],ml:{1:["ember","bite","flamethrower"],30:["fireblast"],40:["calmmind"],50:["hyperbeam"]},e:null,cr:3,xp:261,em:"🔥"},
suicune:    {n:"스이쿤",id:245,t:["water"],s:[100,75,115,90,115,85],ml:{1:["watergun","bite","surf"],30:["icebeam"],40:["calmmind"],50:["hyperbeam"]},e:null,cr:3,xp:261,em:"💧"},
larvitar:   {n:"애버라스",id:246,t:["rock","ground"],s:[50,64,50,45,50,41],ml:{1:["tackle","bite"],5:["rockthrow"],10:["mudshot"]},e:{l:30,to:"pupitar"},cr:45,xp:60,em:"🪨"},
pupitar:    {n:"데기라스",id:247,t:["rock","ground"],s:[70,84,70,65,70,51],ml:{1:["tackle","bite","rockthrow"],30:["rockslide"],36:["earthquake"]},e:{l:55,to:"tyranitar"},cr:45,xp:144,em:"🪨"},
tyranitar:  {n:"마기라스",id:248,t:["rock","dark"],s:[100,134,110,95,100,61],ml:{1:["bite","rockslide","earthquake","crunch"],55:["stoneedge"],63:["hyperbeam"]},e:null,cr:45,xp:270,em:"🦖"},
lugia:      {n:"루기아",id:249,t:["psychic","flying"],s:[106,90,130,90,154,110],ml:{1:["psychic","aerialace","icebeam","surf"],50:["calmmind"],60:["hyperbeam"]},e:null,cr:3,xp:306,em:"🌊"},
hooh:       {n:"호오",id:250,t:["fire","flying"],s:[106,130,90,110,154,90],ml:{1:["flamethrower","aerialace","earthquake","thunderbolt"],50:["fireblast"],60:["hyperbeam"]},e:null,cr:3,xp:306,em:"🌈"},
celebi:     {n:"세레비",id:251,t:["psychic","grass"],s:[100,100,100,100,100,100],ml:{1:["confusion","gigadrain","psychic","razorleaf"],50:["calmmind"],60:["solarbeam"]},e:null,cr:3,xp:270,em:"🧚"},
// ── 누락 Gen 1-2 추가 ──
cleffa:     {n:"삐",id:173,t:["fairy"],s:[50,25,28,45,55,15],ml:{1:["pound","charm"],4:["encore"],8:["sing"]},e:{l:15,to:"clefairy"},cr:150,xp:44,em:"⭐"},
igglybuff:  {n:"푸푸린",id:174,t:["normal","fairy"],s:[90,30,15,40,20,15],ml:{1:["sing","charm"],4:["pound"],9:["defensecurl"]},e:{l:15,to:"jigglypuff"},cr:170,xp:39,em:"🎀"},
marill:     {n:"마릴",id:183,t:["water","fairy"],s:[70,20,50,20,50,40],ml:{1:["tackle","watergun"],6:["tailwhip"],10:["waterpulse"],15:["bubblebeam"]},e:{l:18,to:"azumarill"},cr:190,xp:88,em:"💧"},
azumarill:  {n:"마릴리",id:184,t:["water","fairy"],s:[100,50,80,60,80,50],ml:{1:["watergun","tackle","bubblebeam"],21:["aquatail"],28:["hydropump"]},e:null,cr:75,xp:189,em:"💧"},
hoppip:     {n:"통통코",id:187,t:["grass","flying"],s:[35,35,40,35,55,50],ml:{1:["tackle","splash"],5:["tailwhip"],10:["absorb"],13:["sleeppowder"]},e:{l:18,to:"skiploom"},cr:255,xp:50,em:"🌿"},
skiploom:   {n:"두코",id:188,t:["grass","flying"],s:[55,45,50,45,65,80],ml:{1:["tackle","absorb"],12:["razorleaf"],18:["sleeppowder"]},e:{l:27,to:"jumpluff"},cr:120,xp:119,em:"🌿"},
jumpluff:   {n:"솜솜코",id:189,t:["grass","flying"],s:[75,55,70,55,95,110],ml:{1:["razorleaf","sleeppowder"],27:["megadrain"],33:["solarbeam"]},e:null,cr:45,xp:207,em:"🌿"},
yanma:      {n:"왕자리",id:193,t:["bug","flying"],s:[65,65,45,75,45,95],ml:{1:["tackle","quickattack"],7:["sonicboom"],13:["wingattack"],19:["psybeam"]},e:null,cr:75,xp:147,em:"🪰"},
unown:      {n:"안농",id:201,t:["psychic"],s:[48,72,48,72,48,48],ml:{1:["confusion"]},e:null,cr:225,xp:118,em:"🔤"},
wobbuffet:  {n:"마자용",id:202,t:["psychic"],s:[190,33,58,33,58,33],ml:{1:["counter","mirrorcoat"]},e:null,cr:45,xp:177,em:"🤡"},
qwilfish:   {n:"침바루",id:211,t:["water","poison"],s:[65,95,75,55,55,85],ml:{1:["tackle","poisonsting"],9:["bite"],13:["watergun"],21:["sludgebomb"]},e:null,cr:45,xp:88,em:"🐡"},
shuckle:    {n:"단단지",id:213,t:["bug","rock"],s:[20,10,230,10,230,5],ml:{1:["tackle","wrap"],9:["encore"],14:["rockthrow"]},e:null,cr:190,xp:177,em:"🪨"},
heracross:  {n:"헤라크로스",id:214,t:["bug","fighting"],s:[80,125,75,40,95,85],ml:{1:["tackle","hornattack"],7:["furyattack"],13:["brickbreak"],19:["megahorn"]},e:null,cr:45,xp:175,em:"🪲"},
remoraid:   {n:"총어",id:223,t:["water"],s:[35,65,35,65,35,65],ml:{1:["watergun"],6:["lockon"],11:["psybeam"],22:["icebeam"]},e:{l:25,to:"octillery"},cr:190,xp:78,em:"🐟"},
octillery:  {n:"대포무노",id:224,t:["water"],s:[75,105,75,105,75,45],ml:{1:["watergun","psybeam"],25:["icebeam"],33:["hydropump"]},e:null,cr:75,xp:168,em:"🐙"},
mantine:    {n:"만타인",id:226,t:["water","flying"],s:[65,40,70,80,140,70],ml:{1:["tackle","watergun","wingattack"],10:["bubblebeam"],18:["surf"]},e:null,cr:25,xp:168,em:"🦈"},
skarmory:   {n:"무장조",id:227,t:["steel","flying"],s:[65,80,140,40,70,70],ml:{1:["peck","metalclaw"],9:["aerialace"],17:["steelwing"],25:["drillpeck"]},e:null,cr:25,xp:168,em:"🦅"},
porygon2:   {n:"폴리곤2",id:233,t:["normal"],s:[85,80,90,105,95,60],ml:{1:["tackle","psybeam","triattack"],30:["psychic"],37:["hyperbeam"]},e:null,cr:45,xp:180,em:"💻"},
smeargle:   {n:"루브도",id:235,t:["normal"],s:[55,20,35,20,45,75],ml:{1:["tackle","sketch"]},e:null,cr:45,xp:88,em:"🎨"},
smoochum:   {n:"뽀뽀라",id:238,t:["ice","psychic"],s:[45,30,15,85,65,65],ml:{1:["pound","lick"],5:["confusion"],9:["icepunch"]},e:{l:30,to:"jynx"},cr:45,xp:87,em:"💋"},
elekid:     {n:"에레키드",id:239,t:["electric"],s:[45,63,37,65,55,95],ml:{1:["thundershock","leer"],6:["quickattack"],11:["thunderpunch"]},e:{l:30,to:"electabuzz"},cr:45,xp:72,em:"⚡"},
magby:      {n:"마그비",id:240,t:["fire"],s:[45,75,37,70,55,83],ml:{1:["ember","leer"],7:["smokescreen"],13:["firepunch"]},e:{l:30,to:"magmar"},cr:45,xp:73,em:"🔥"},
// ── Gen 3: 호엔 지방 포켓몬 ──
treecko:    {n:"나무지기",id:252,t:["grass"],s:[40,45,35,65,55,70],ml:{1:["pound","absorb"],6:["absorb"],16:["megadrain"],29:["razorleaf"],45:["solarbeam"]},e:{l:16,to:"grovyle"},cr:45,xp:62,em:"🦎"},
grovyle:    {n:"나무돌이",id:253,t:["grass"],s:[50,65,45,85,65,95],ml:{1:["pound","absorb"],16:["razorleaf"],29:["megadrain"],39:["solarbeam"]},e:{l:36,to:"sceptile"},cr:45,xp:142,em:"🦎"},
sceptile:   {n:"나무킹",id:254,t:["grass"],s:[70,85,65,105,85,120],ml:{1:["pound","razorleaf"],36:["megadrain"],51:["solarbeam"]},e:null,cr:45,xp:239,em:"🦎"},
torchic:    {n:"아차모",id:255,t:["fire"],s:[45,60,40,70,50,45],ml:{1:["scratch","ember"],7:["ember"],16:["flamethrower"]},e:{l:16,to:"combusken"},cr:45,xp:62,em:"🐥"},
combusken:  {n:"영치코",id:256,t:["fire","fighting"],s:[60,85,60,85,60,55],ml:{1:["scratch","ember"],16:["brickbreak"],28:["flamethrower"]},e:{l:36,to:"blaziken"},cr:45,xp:142,em:"🐓"},
blaziken:   {n:"번치코",id:257,t:["fire","fighting"],s:[80,120,70,110,70,80],ml:{1:["scratch","ember","brickbreak"],36:["closecombat"],54:["fireblast"]},e:null,cr:45,xp:239,em:"🐓"},
mudkip:     {n:"물짱이",id:258,t:["water"],s:[50,70,50,50,50,40],ml:{1:["tackle","watergun"],6:["mudslap"],16:["waterpulse"]},e:{l:16,to:"marshtomp"},cr:45,xp:62,em:"🐟"},
marshtomp:  {n:"늪짱이",id:259,t:["water","ground"],s:[70,85,70,60,70,50],ml:{1:["tackle","watergun","mudslap"],16:["mudslap"],25:["surf"]},e:{l:36,to:"swampert"},cr:45,xp:142,em:"🐟"},
swampert:   {n:"대짱이",id:260,t:["water","ground"],s:[100,110,90,85,90,60],ml:{1:["watergun","mudslap"],36:["earthquake"],52:["hydropump"]},e:null,cr:45,xp:241,em:"🐟"},
poochyena:  {n:"포챠나",id:261,t:["dark"],s:[35,55,35,30,30,35],ml:{1:["tackle","bite"],13:["crunch"]},e:{l:18,to:"mightyena"},cr:255,xp:56,em:"🐺"},
mightyena:  {n:"그라에나",id:262,t:["dark"],s:[70,90,70,60,60,70],ml:{1:["tackle","bite"],18:["crunch"],30:["darkpulse"]},e:null,cr:127,xp:147,em:"🐺"},
zigzagoon:  {n:"지그제구리",id:263,t:["normal"],s:[38,30,41,30,41,60],ml:{1:["tackle","growl"],9:["slam"],25:["bodyslam"]},e:{l:20,to:"linoone"},cr:255,xp:56,em:"🦝"},
linoone:    {n:"직구리",id:264,t:["normal"],s:[78,70,61,50,61,100],ml:{1:["tackle","slam"],20:["bodyslam"],33:["bodyslam"]},e:null,cr:90,xp:147,em:"🦝"},
ralts:      {n:"랄토스",id:280,t:["psychic","fairy"],s:[28,25,25,45,35,40],ml:{1:["confusion","growl"],6:["confusion"],11:["psybeam"]},e:{l:20,to:"kirlia"},cr:235,xp:40,em:"🧚"},
kirlia:     {n:"킬리아",id:281,t:["psychic","fairy"],s:[38,35,35,65,55,50],ml:{1:["confusion","psybeam"],20:["psychic"],26:["dazzlinggleam"]},e:{l:30,to:"gardevoir"},cr:120,xp:97,em:"🧚"},
gardevoir:  {n:"가디안",id:282,t:["psychic","fairy"],s:[68,65,65,125,115,80],ml:{1:["confusion","psychic"],30:["moonblast"],40:["dazzlinggleam"]},e:null,cr:45,xp:233,em:"🧚"},
shroomish:  {n:"버섯꼬",id:285,t:["grass"],s:[60,40,60,40,60,35],ml:{1:["tackle","absorb"],7:["absorb"],16:["megadrain"],22:["sleeppowder"]},e:{l:23,to:"breloom"},cr:255,xp:59,em:"🍄"},
breloom:    {n:"버섯모",id:286,t:["grass","fighting"],s:[60,130,80,60,60,70],ml:{1:["tackle","absorb"],23:["brickbreak"],33:["megadrain"],44:["closecombat"]},e:null,cr:90,xp:161,em:"🍄"},
slakoth:    {n:"게을로",id:287,t:["normal"],s:[60,60,60,35,35,30],ml:{1:["scratch","tackle"],7:["bodyslam"],13:["bodyslam"]},e:{l:18,to:"vigoroth"},cr:255,xp:83,em:"🦥"},
vigoroth:   {n:"발바로",id:288,t:["normal"],s:[80,80,80,55,55,90],ml:{1:["scratch","bodyslam"],18:["bodyslam"],25:["closecombat"]},e:{l:36,to:"slaking"},cr:120,xp:154,em:"🦥"},
slaking:    {n:"게을킹",id:289,t:["normal"],s:[150,160,100,95,65,100],ml:{1:["scratch","bodyslam"],36:["hyperbeam"]},e:null,cr:45,xp:252,em:"🦥"},
makuhita:   {n:"마크탕",id:296,t:["fighting"],s:[72,60,30,20,30,25],ml:{1:["tackle","lowkick"],10:["brickbreak"],22:["closecombat"]},e:{l:24,to:"hariyama"},cr:180,xp:47,em:"🥊"},
hariyama:   {n:"하리뭉",id:297,t:["fighting"],s:[144,120,60,40,60,50],ml:{1:["tackle","brickbreak"],24:["closecombat"],38:["crosschop"]},e:null,cr:200,xp:166,em:"🥊"},
aron:       {n:"코코도라",id:304,t:["steel","rock"],s:[50,70,100,40,40,30],ml:{1:["tackle","metalclaw"],7:["rockthrow"],15:["ironhead"]},e:{l:32,to:"lairon"},cr:180,xp:66,em:"⛏️"},
lairon:     {n:"코도라",id:305,t:["steel","rock"],s:[60,90,140,50,50,40],ml:{1:["tackle","metalclaw","ironhead"],32:["rockslide"],37:["steelwing"]},e:{l:42,to:"aggron"},cr:90,xp:151,em:"⛏️"},
aggron:     {n:"보스로라",id:306,t:["steel","rock"],s:[70,110,180,60,60,50],ml:{1:["metalclaw","ironhead"],42:["stoneedge"],51:["hyperbeam"]},e:null,cr:45,xp:239,em:"⛏️"},
meditite:   {n:"요가랑",id:307,t:["fighting","psychic"],s:[30,40,55,40,55,60],ml:{1:["confusion","lowkick"],9:["brickbreak"],18:["psychic"]},e:{l:37,to:"medicham"},cr:180,xp:56,em:"🧘"},
medicham:   {n:"요가램",id:308,t:["fighting","psychic"],s:[60,60,75,60,75,80],ml:{1:["confusion","brickbreak"],37:["closecombat"],42:["psychic"]},e:null,cr:90,xp:144,em:"🧘"},
electrike:  {n:"썬더라이",id:309,t:["electric"],s:[40,45,40,65,40,65],ml:{1:["tackle","thundershock"],12:["spark"],20:["thunderbolt"]},e:{l:26,to:"manectric"},cr:120,xp:59,em:"⚡"},
manectric:  {n:"썬더볼트",id:310,t:["electric"],s:[70,75,60,105,60,105],ml:{1:["thundershock","spark"],26:["thunderbolt"],44:["thunder"]},e:null,cr:45,xp:166,em:"⚡"},
carvanha:   {n:"샤프니아",id:318,t:["water","dark"],s:[45,90,20,65,20,65],ml:{1:["bite","watergun"],16:["crunch"],22:["aquatail"]},e:{l:30,to:"sharpedo"},cr:225,xp:88,em:"🦈"},
sharpedo:   {n:"샤크니아",id:319,t:["water","dark"],s:[70,120,40,95,40,95],ml:{1:["bite","crunch"],30:["aquatail"],38:["hydropump"]},e:null,cr:60,xp:161,em:"🦈"},
trapinch:   {n:"톱치",id:328,t:["ground"],s:[45,100,45,45,45,10],ml:{1:["bite","mudslap"],9:["dig"],17:["crunch"]},e:{l:35,to:"vibrava"},cr:255,xp:73,em:"🐜"},
vibrava:    {n:"비브라바",id:329,t:["ground","dragon"],s:[50,70,50,50,50,70],ml:{1:["bite","mudslap","dragonbreath"],35:["dragonclaw"]},e:{l:45,to:"flygon"},cr:120,xp:119,em:"🐉"},
flygon:     {n:"플라이곤",id:330,t:["ground","dragon"],s:[80,100,80,80,80,100],ml:{1:["dragonbreath","earthquake"],45:["dragonclaw"],55:["outrage"]},e:null,cr:45,xp:234,em:"🐉"},
swablu:     {n:"파비코",id:333,t:["normal","flying"],s:[45,40,60,40,75,50],ml:{1:["peck","growl"],8:["wingattack"],18:["aerialace"]},e:{l:35,to:"altaria"},cr:255,xp:62,em:"☁️"},
altaria:    {n:"파비코리",id:334,t:["dragon","flying"],s:[75,70,90,70,105,80],ml:{1:["peck","wingattack"],35:["dragonbreath"],42:["moonblast"],54:["dragonpulse"]},e:null,cr:45,xp:172,em:"☁️"},
feebas:     {n:"빈티나",id:349,t:["water"],s:[20,15,20,10,55,80],ml:{1:["tackle","watergun"]},e:{l:30,to:"milotic"},cr:255,xp:40,em:"🐟"},
milotic:    {n:"밀로틱",id:350,t:["water"],s:[95,60,79,100,125,81],ml:{1:["watergun","surf"],30:["hydropump"],40:["icebeam"]},e:null,cr:60,xp:189,em:"🐉"},
absol:      {n:"앱솔",id:359,t:["dark"],s:[65,130,60,75,60,75],ml:{1:["scratch","bite"],12:["crunch"],25:["darkpulse"],36:["swordsdance"]},e:null,cr:30,xp:163,em:"🌙"},
bagon:      {n:"아공이",id:371,t:["dragon"],s:[45,75,60,40,30,50],ml:{1:["bite","ember"],9:["dragonbreath"],17:["slam"]},e:{l:30,to:"shelgon"},cr:45,xp:60,em:"🐉"},
shelgon:    {n:"쉘곤",id:372,t:["dragon"],s:[65,95,100,60,50,50],ml:{1:["bite","dragonbreath"],30:["dragonclaw"],38:["ironhead"]},e:{l:50,to:"salamence"},cr:45,xp:147,em:"🐉"},
salamence:  {n:"보만다",id:373,t:["dragon","flying"],s:[95,135,80,110,80,100],ml:{1:["dragonbreath","dragonclaw"],50:["outrage"],60:["fireblast"]},e:null,cr:45,xp:270,em:"🐉"},
beldum:     {n:"메탕",id:374,t:["steel","psychic"],s:[40,55,80,35,60,30],ml:{1:["tackle","metalclaw"]},e:{l:20,to:"metang"},cr:3,xp:60,em:"🤖"},
metang:     {n:"메탕구",id:375,t:["steel","psychic"],s:[60,75,100,55,80,50],ml:{1:["tackle","metalclaw","confusion"],20:["psychic"],26:["ironhead"]},e:{l:45,to:"metagross"},cr:3,xp:147,em:"🤖"},
metagross:  {n:"메타그로스",id:376,t:["steel","psychic"],s:[80,135,130,95,90,70],ml:{1:["metalclaw","psychic"],45:["ironhead"],55:["hyperbeam"]},e:null,cr:3,xp:270,em:"🤖"},
// Gen 3 전설/환상
regirock:   {n:"레지락",id:377,t:["rock"],s:[80,100,200,50,100,50],ml:{1:["rockthrow","ironhead"],25:["rockslide"],50:["stoneedge"]},e:null,cr:3,xp:261,em:"🪨"},
regice:     {n:"레지아이스",id:378,t:["ice"],s:[80,50,100,100,200,50],ml:{1:["icebeam","confusion"],33:["blizzard"],50:["hyperbeam"]},e:null,cr:3,xp:261,em:"🧊"},
registeel:  {n:"레지스틸",id:379,t:["steel"],s:[80,75,150,75,150,50],ml:{1:["metalclaw","ironhead"],33:["flashcannon"],50:["hyperbeam"]},e:null,cr:3,xp:261,em:"⚙️"},
latias:     {n:"라티아스",id:380,t:["dragon","psychic"],s:[80,80,90,110,130,110],ml:{1:["dragonbreath","psychic"],30:["dragonpulse"],50:["moonblast"]},e:null,cr:3,xp:270,em:"🔴"},
latios:     {n:"라티오스",id:381,t:["dragon","psychic"],s:[80,90,80,130,110,110],ml:{1:["dragonbreath","psychic"],30:["dragonpulse"],50:["hyperbeam"]},e:null,cr:3,xp:270,em:"🔵"},
kyogre:     {n:"가이오가",id:382,t:["water"],s:[100,100,90,150,140,90],ml:{1:["watergun","icebeam"],45:["surf"],75:["hydropump"]},e:null,cr:3,xp:302,em:"🌊"},
groudon:    {n:"그란돈",id:383,t:["ground"],s:[100,150,140,100,90,90],ml:{1:["mudslap","earthquake"],45:["fireblast"],75:["solarbeam"]},e:null,cr:3,xp:302,em:"🌋"},
rayquaza:   {n:"레쿠쟈",id:384,t:["dragon","flying"],s:[105,150,90,150,90,95],ml:{1:["dragonbreath","aerialace"],45:["outrage"],75:["hyperbeam"]},e:null,cr:3,xp:306,em:"🐲"},
jirachi:    {n:"지라치",id:385,t:["steel","psychic"],s:[100,100,100,100,100,100],ml:{1:["confusion","psychic"],30:["dazzlinggleam"],50:["moonblast"]},e:null,cr:3,xp:270,em:"⭐"},
deoxys:     {n:"테오키스",id:386,t:["psychic"],s:[50,150,50,150,50,150],ml:{1:["confusion","psychic"],30:["hyperbeam"],50:["shadowball"]},e:null,cr:3,xp:270,em:"🧬"},
// ── Gen 4: 신오 지방 포켓몬 ──
turtwig:    {n:"모부기",id:387,t:["grass"],s:[55,68,64,45,55,31],ml:{1:["tackle","absorb"],9:["razorleaf"],17:["megadrain"]},e:{l:18,to:"grotle"},cr:45,xp:64,em:"🐢"},
grotle:     {n:"수풀부기",id:388,t:["grass"],s:[75,89,85,55,65,36],ml:{1:["tackle","razorleaf"],18:["megadrain"],27:["crunch"]},e:{l:32,to:"torterra"},cr:45,xp:142,em:"🐢"},
torterra:   {n:"토대부기",id:389,t:["grass","ground"],s:[95,109,105,75,85,56],ml:{1:["razorleaf","earthquake"],32:["solarbeam"],45:["earthquake"]},e:null,cr:45,xp:236,em:"🐢"},
chimchar:   {n:"불꽃숭이",id:390,t:["fire"],s:[44,58,44,58,44,61],ml:{1:["scratch","ember"],7:["ember"],14:["flamethrower"]},e:{l:14,to:"monferno"},cr:45,xp:62,em:"🐵"},
monferno:   {n:"파이숭이",id:391,t:["fire","fighting"],s:[64,78,52,78,52,81],ml:{1:["scratch","ember"],14:["brickbreak"],26:["flamethrower"]},e:{l:36,to:"infernape"},cr:45,xp:142,em:"🐵"},
infernape:  {n:"초염몽",id:392,t:["fire","fighting"],s:[76,104,71,104,71,108],ml:{1:["ember","brickbreak"],36:["closecombat"],42:["fireblast"]},e:null,cr:45,xp:240,em:"🐵"},
piplup:     {n:"팽도리",id:393,t:["water"],s:[53,51,53,61,56,40],ml:{1:["pound","watergun"],8:["bubblebeam"],15:["waterpulse"]},e:{l:16,to:"prinplup"},cr:45,xp:63,em:"🐧"},
prinplup:   {n:"팽태자",id:394,t:["water"],s:[64,66,68,81,76,50],ml:{1:["pound","watergun"],16:["bubblebeam"],24:["surf"]},e:{l:36,to:"empoleon"},cr:45,xp:142,em:"🐧"},
empoleon:   {n:"엠페르트",id:395,t:["water","steel"],s:[84,86,88,111,101,60],ml:{1:["watergun","metalclaw"],36:["surf","flashcannon"],46:["hydropump"]},e:null,cr:45,xp:239,em:"🐧"},
starly:     {n:"찌르꼬",id:396,t:["normal","flying"],s:[40,55,30,30,30,60],ml:{1:["tackle","wingattack"],5:["quickattack"],14:["aerialace"]},e:{l:14,to:"staravia"},cr:255,xp:49,em:"🐦"},
staravia:   {n:"찌르버드",id:397,t:["normal","flying"],s:[55,75,50,40,40,80],ml:{1:["quickattack","wingattack"],14:["aerialace"],25:["doubleedge"]},e:{l:34,to:"staraptor"},cr:120,xp:119,em:"🐦"},
staraptor:  {n:"찌르호크",id:398,t:["normal","flying"],s:[85,120,70,50,60,100],ml:{1:["wingattack","aerialace"],34:["closecombat"],41:["drillpeck"]},e:null,cr:45,xp:218,em:"🐦"},
shinx:      {n:"꼬링크",id:403,t:["electric"],s:[45,65,34,40,34,45],ml:{1:["tackle","thundershock"],9:["spark"],18:["bite"]},e:{l:15,to:"luxio"},cr:235,xp:53,em:"⚡"},
luxio:      {n:"럭시오",id:404,t:["electric"],s:[60,85,49,60,49,60],ml:{1:["spark","bite"],15:["thunderbolt"],26:["crunch"]},e:{l:30,to:"luxray"},cr:120,xp:127,em:"⚡"},
luxray:     {n:"렌트라",id:405,t:["electric"],s:[80,120,79,95,79,70],ml:{1:["spark","crunch"],30:["thunderbolt"],42:["thunder"]},e:null,cr:45,xp:235,em:"⚡"},
cranidos:   {n:"두개도스",id:408,t:["rock"],s:[67,125,40,30,30,58],ml:{1:["slam","rockthrow"],10:["rockslide"],19:["stoneedge"]},e:{l:30,to:"rampardos"},cr:45,xp:70,em:"🦕"},
rampardos:  {n:"램펄드",id:409,t:["rock"],s:[97,165,60,65,50,58],ml:{1:["slam","rockslide"],30:["stoneedge"],43:["earthquake"]},e:null,cr:45,xp:173,em:"🦕"},
shieldon:   {n:"방패톱스",id:410,t:["rock","steel"],s:[30,42,118,42,88,30],ml:{1:["tackle","metalclaw"],10:["ironhead"],19:["rockslide"]},e:{l:30,to:"bastiodon"},cr:45,xp:70,em:"🛡️"},
bastiodon:  {n:"바리톱스",id:411,t:["rock","steel"],s:[60,52,168,47,138,30],ml:{1:["metalclaw","ironhead"],30:["flashcannon"],43:["stoneedge"]},e:null,cr:45,xp:173,em:"🛡️"},
drifloon:   {n:"흘림볼",id:425,t:["ghost","flying"],s:[90,50,34,60,44,70],ml:{1:["confusion","hex"],14:["shadowball"],22:["wingattack"]},e:{l:28,to:"drifblim"},cr:125,xp:70,em:"🎈"},
drifblim:   {n:"둥실라이드",id:426,t:["ghost","flying"],s:[150,80,44,90,54,80],ml:{1:["hex","shadowball"],28:["wingattack"],40:["explosion"]},e:null,cr:60,xp:174,em:"🎈"},
gible:      {n:"딥상어동",id:443,t:["dragon","ground"],s:[58,70,45,40,45,42],ml:{1:["tackle","bite"],7:["mudslap"],13:["dragonbreath"]},e:{l:24,to:"gabite"},cr:45,xp:60,em:"🦈"},
gabite:     {n:"한바이트",id:444,t:["dragon","ground"],s:[68,90,65,50,55,82],ml:{1:["bite","dragonbreath"],24:["dragonclaw"],33:["dig"]},e:{l:48,to:"garchomp"},cr:45,xp:144,em:"🦈"},
garchomp:   {n:"한카리아스",id:445,t:["dragon","ground"],s:[108,130,95,80,85,102],ml:{1:["dragonclaw","earthquake"],48:["outrage"],55:["fireblast"]},e:null,cr:45,xp:270,em:"🦈"},
riolu:      {n:"리오루",id:447,t:["fighting"],s:[40,70,40,35,40,60],ml:{1:["quickattack","lowkick"],6:["brickbreak"],11:["counter"]},e:{l:25,to:"lucario"},cr:75,xp:57,em:"🐕"},
lucario:    {n:"루카리오",id:448,t:["fighting","steel"],s:[70,110,70,115,70,90],ml:{1:["quickattack","brickbreak"],25:["closecombat"],33:["flashcannon"],42:["ironhead"]},e:null,cr:45,xp:184,em:"🐕"},
skorupi:    {n:"스콜피",id:451,t:["poison","bug"],s:[40,50,90,30,55,65],ml:{1:["poisonsting","bite"],9:["bugbite"],16:["crunch"]},e:{l:40,to:"drapion"},cr:120,xp:66,em:"🦂"},
drapion:    {n:"드래피온",id:452,t:["poison","dark"],s:[70,90,110,60,75,95],ml:{1:["bite","crunch"],40:["darkpulse"],48:["sludgebomb"]},e:null,cr:45,xp:175,em:"🦂"},
croagunk:   {n:"삐딱구리",id:453,t:["poison","fighting"],s:[48,61,40,61,40,50],ml:{1:["poisonsting","lowkick"],8:["sludge"],17:["brickbreak"]},e:{l:37,to:"toxicroak"},cr:140,xp:60,em:"🐸"},
toxicroak:  {n:"독개굴",id:454,t:["poison","fighting"],s:[83,106,65,86,65,85],ml:{1:["poisonsting","brickbreak"],37:["sludgebomb"],44:["closecombat"]},e:null,cr:75,xp:172,em:"🐸"},
snover:     {n:"눈쓰개",id:459,t:["grass","ice"],s:[60,62,50,62,60,40],ml:{1:["absorb","icebeam"],5:["razorleaf"],13:["icebeam"]},e:{l:40,to:"abomasnow"},cr:120,xp:67,em:"🌲"},
abomasnow:  {n:"눈설왕",id:460,t:["grass","ice"],s:[90,92,75,92,85,60],ml:{1:["razorleaf","icebeam"],40:["blizzard"],47:["solarbeam"]},e:null,cr:60,xp:173,em:"🌲"},
// Gen 4 전설/환상
dialga:     {n:"디아루가",id:483,t:["steel","dragon"],s:[100,120,120,150,100,90],ml:{1:["dragonbreath","metalclaw"],30:["flashcannon"],50:["dragonpulse"],70:["hyperbeam"]},e:null,cr:3,xp:306,em:"💎"},
palkia:     {n:"펄기아",id:484,t:["water","dragon"],s:[90,120,100,150,120,100],ml:{1:["dragonbreath","watergun"],30:["surf"],50:["dragonpulse"],70:["hydropump"]},e:null,cr:3,xp:306,em:"💜"},
heatran:    {n:"히드런",id:485,t:["fire","steel"],s:[91,90,106,130,106,77],ml:{1:["ember","metalclaw"],30:["flamethrower"],50:["flashcannon"]},e:null,cr:3,xp:270,em:"🌋"},
giratina:   {n:"기라티나",id:487,t:["ghost","dragon"],s:[150,100,120,100,120,90],ml:{1:["dragonbreath","shadowball"],30:["dragonclaw"],50:["outrage"]},e:null,cr:3,xp:306,em:"👻"},
cresselia:  {n:"크레세리아",id:488,t:["psychic"],s:[120,70,120,75,130,85],ml:{1:["confusion","moonlight"],30:["psychic"],50:["moonblast"]},e:null,cr:3,xp:270,em:"🌙"},
darkrai:    {n:"다크라이",id:491,t:["dark"],s:[70,90,90,135,90,125],ml:{1:["darkpulse","hypnosis"],30:["shadowball"],50:["shadowball"]},e:null,cr:3,xp:270,em:"🌑"},
shaymin:    {n:"쉐이미",id:492,t:["grass"],s:[100,100,100,100,100,100],ml:{1:["megadrain","razorleaf"],30:["solarbeam"],50:["dazzlinggleam"]},e:null,cr:3,xp:270,em:"🌸"},
arceus:     {n:"아르세우스",id:493,t:["normal"],s:[120,120,120,120,120,120],ml:{1:["hyperbeam","earthquake"],30:["outrage"],50:["psychic"]},e:null,cr:3,xp:324,em:"✨"}
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
confuseray:  {n:"도깨비불",t:"ghost",c:"status",p:0,a:100,pp:10,ef:"confuse",ec:100},
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
encore:      {n:"앙코르",t:"normal",c:"status",p:0,a:100,pp:5,ef:"encore"}
};

// ═══════════════════════════════════════════════
// 🗺️ 지역 & 도로 데이터 (개편)
// ═══════════════════════════════════════════════
var REGIONS = {
kanto: {
    n: "칸토 지방", em: "🗾",
    roads: [
        {id:"k_r1",n:"1번도로",desc:"태초마을~상록시티",lv:[2,5],pokemon:[{k:"pidgey",w:40},{k:"rattata",w:40},{k:"caterpie",w:15},{k:"weedle",w:5}],hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote"],encounterRate:0.85,reqBadges:0,
         trainers:[
            {n:"소년 민수",em:"👦",pokemon:[{k:"rattata",l:3},{k:"pidgey",l:4}],reward:120},
            {n:"소녀 미나",em:"👧",pokemon:[{k:"caterpie",l:3},{k:"caterpie",l:4}],reward:100},
            {n:"소년 준호",em:"👦",pokemon:[{k:"rattata",l:4},{k:"rattata",l:5}],reward:150},
            {n:"소녀 하늘",em:"👧",pokemon:[{k:"pidgey",l:5}],reward:100},
            {n:"벌레잡이 민규",em:"🧒",pokemon:[{k:"caterpie",l:3},{k:"weedle",l:4},{k:"caterpie",l:4}],reward:120},
            {n:"소년 태현",em:"👦",pokemon:[{k:"pidgey",l:4},{k:"rattata",l:3},{k:"pidgey",l:5}],reward:150}
          ]},
        {id:"k_r2",n:"상록숲",desc:"벌레잡이의 숲",lv:[3,8],pokemon:[{k:"caterpie",w:25},{k:"weedle",w:25},{k:"pidgey",w:20},{k:"pikachu",w:10},{k:"oddish",w:10},{k:"bellsprout",w:10},{k:"heracross",w:3}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:0,
         trainers:[
            {n:"벌레잡이 철수",em:"🧒",pokemon:[{k:"caterpie",l:5},{k:"weedle",l:5},{k:"metapod",l:6}],reward:180},
            {n:"벌레잡이 현우",em:"🧒",pokemon:[{k:"weedle",l:6},{k:"kakuna",l:7}],reward:210},
            {n:"소녀 지원",em:"👧",pokemon:[{k:"oddish",l:6},{k:"bellsprout",l:6}],reward:180},
            {n:"벌레잡이 상우",em:"🧒",pokemon:[{k:"weedle",l:5},{k:"kakuna",l:6},{k:"caterpie",l:6}],reward:180},
            {n:"소년 도현",em:"👦",pokemon:[{k:"pidgey",l:7},{k:"pikachu",l:6}],reward:210},
            {n:"소녀 서연",em:"👧",pokemon:[{k:"bellsprout",l:7},{k:"oddish",l:7}],reward:210},
            {n:"벌레잡이 지호",em:"🧒",pokemon:[{k:"metapod",l:7},{k:"kakuna",l:7},{k:"butterfree",l:8}],reward:240}
          ]},
        {id:"k_r3",n:"니비시티",desc:"바위 체육관의 도시",lv:[8,13],pokemon:[{k:"geodude",w:30},{k:"sandshrew",w:25},{k:"zubat",w:20},{k:"onix",w:10},{k:"diglett",w:15}],hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote","paralyzeheal","awakening"],encounterRate:0.80,reqBadges:1,
         trainers:[
            {n:"등산가 태호",em:"🧗",pokemon:[{k:"geodude",l:9},{k:"geodude",l:10},{k:"sandshrew",l:10}],reward:300},
            {n:"등산가 진우",em:"🧗",pokemon:[{k:"geodude",l:10},{k:"sandshrew",l:11}],reward:330},
            {n:"소년 시우",em:"👦",pokemon:[{k:"nidoranm",l:10},{k:"nidoranf",l:10},{k:"zubat",l:11}],reward:330},
            {n:"소녀 유진",em:"👧",pokemon:[{k:"clefairy",l:11},{k:"jigglypuff",l:11}],reward:330},
            {n:"등산가 미래",em:"🧗",pokemon:[{k:"onix",l:12},{k:"geodude",l:11}],reward:360},
            {n:"불량배 동건",em:"😎",pokemon:[{k:"zubat",l:10},{k:"rattata",l:11},{k:"ekans",l:12}],reward:360}
          ]},
        {id:"k_r4",n:"달맞이산",desc:"어둡고 깊은 동굴",lv:[10,16],pokemon:[{k:"zubat",w:30},{k:"geodude",w:25},{k:"paras",w:15},{k:"clefairy",w:10},{k:"magnemite",w:10},{k:"nidoranm",w:5},{k:"nidoranf",w:5},{k:"cleffa",w:5}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:1,
         trainers:[
            {n:"로켓단 조무래기",em:"🦹",pokemon:[{k:"zubat",l:11},{k:"ekans",l:13},{k:"rattata",l:12}],reward:400},
            {n:"등산가 수진",em:"🧗",pokemon:[{k:"geodude",l:13},{k:"machop",l:14}],reward:420},
            {n:"과학자 박사",em:"🔬",pokemon:[{k:"magnemite",l:14},{k:"voltorb",l:14}],reward:500},
            {n:"등산가 유리",em:"🧗",pokemon:[{k:"zubat",l:13},{k:"geodude",l:14},{k:"paras",l:13}],reward:420},
            {n:"로켓단 조무래기",em:"🦹",pokemon:[{k:"rattata",l:14},{k:"zubat",l:13}],reward:420},
            {n:"과학자 현수",em:"🔬",pokemon:[{k:"voltorb",l:14},{k:"magnemite",l:15}],reward:450},
            {n:"등산가 석진",em:"🧗",pokemon:[{k:"geodude",l:14},{k:"geodude",l:14},{k:"machop",l:15}],reward:450}
          ]},
        {id:"k_r5",n:"블루시티",desc:"바다가 보이는 항구 도시",lv:[14,20],pokemon:[{k:"tentacool",w:25},{k:"psyduck",w:20},{k:"growlithe",w:15},{k:"vulpix",w:10},{k:"abra",w:10},{k:"drowzee",w:10},{k:"shellder",w:10}],hasCenter:true,hasShop:true,shopItems:["pokeball","superball","potion","superpotion","antidote","paralyzeheal","awakening"],encounterRate:0.80,reqBadges:2,
         trainers:[
            {n:"수영선수 현지",em:"🏊",pokemon:[{k:"tentacool",l:16},{k:"shellder",l:17},{k:"staryu",l:18}],reward:540},
            {n:"낚시꾼 동현",em:"🎣",pokemon:[{k:"magikarp",l:10},{k:"magikarp",l:12},{k:"goldeen",l:16},{k:"poliwag",l:17}],reward:500},
            {n:"수영선수 태리",em:"🏊",pokemon:[{k:"tentacool",l:17},{k:"goldeen",l:18}],reward:540},
            {n:"아가씨 지혜",em:"👩",pokemon:[{k:"abra",l:18},{k:"drowzee",l:17}],reward:540},
            {n:"선원 용호",em:"⚓",pokemon:[{k:"shellder",l:18},{k:"tentacool",l:17},{k:"psyduck",l:18}],reward:540},
            {n:"낚시꾼 민석",em:"🎣",pokemon:[{k:"magikarp",l:15},{k:"goldeen",l:17},{k:"poliwag",l:18}],reward:510},
            {n:"불량배 재혁",em:"😎",pokemon:[{k:"growlithe",l:18},{k:"vulpix",l:18}],reward:540}
          ]},
        {id:"k_r6",n:"노량시티",desc:"번개 체육관의 도시",lv:[18,25],pokemon:[{k:"pikachu",w:20},{k:"magnemite",w:20},{k:"voltorb",w:15},{k:"ponyta",w:15},{k:"growlithe",w:15},{k:"mankey",w:15}],hasCenter:true,hasShop:true,shopItems:["pokeball","superball","potion","superpotion","paralyzeheal","awakening"],encounterRate:0.80,reqBadges:3,
         trainers:[
            {n:"불량배 건이",em:"😎",pokemon:[{k:"machop",l:20},{k:"mankey",l:21}],reward:630},
            {n:"아가씨 수연",em:"👩",pokemon:[{k:"clefairy",l:21},{k:"jigglypuff",l:22}],reward:660},
            {n:"전기기사 상훈",em:"⚡",pokemon:[{k:"pikachu",l:22},{k:"magnemite",l:22}],reward:660},
            {n:"불량배 지성",em:"😎",pokemon:[{k:"mankey",l:22},{k:"machop",l:23}],reward:690},
            {n:"아가씨 은서",em:"👩",pokemon:[{k:"ponyta",l:23},{k:"growlithe",l:22}],reward:690},
            {n:"소년 강민",em:"👦",pokemon:[{k:"voltorb",l:22},{k:"pikachu",l:23},{k:"magnemite",l:22}],reward:690},
            {n:"슈퍼너드 태우",em:"🤓",pokemon:[{k:"voltorb",l:23},{k:"electrode",l:24}],reward:720}
          ]},
        {id:"k_r7",n:"무지개시티",desc:"무지개빛 도시",lv:[22,30],pokemon:[{k:"oddish",w:15},{k:"bellsprout",w:15},{k:"venonat",w:15},{k:"grimer",w:10},{k:"koffing",w:10},{k:"exeggcute",w:10},{k:"tangela",w:10},{k:"eevee",w:5},{k:"igglybuff",w:3}],hasCenter:true,hasShop:true,shopItems:["superball","superpotion","hyperpotion","antidote","paralyzeheal","awakening","revive"],encounterRate:0.80,reqBadges:4,
         trainers:[
            {n:"슈퍼너드 종혁",em:"🤓",pokemon:[{k:"porygon",l:24},{k:"magneton",l:25}],reward:750},
            {n:"로켓단 간부",em:"🦹",pokemon:[{k:"arbok",l:25},{k:"weezing",l:26},{k:"golbat",l:26}],reward:900},
            {n:"아가씨 보라",em:"👩",pokemon:[{k:"oddish",l:25},{k:"bellsprout",l:25},{k:"exeggcute",l:26}],reward:780},
            {n:"닌자 준혁",em:"🥷",pokemon:[{k:"venonat",l:26},{k:"grimer",l:27}],reward:810},
            {n:"로켓단 조무래기",em:"🦹",pokemon:[{k:"koffing",l:26},{k:"grimer",l:26},{k:"rattata",l:25}],reward:780},
            {n:"슈퍼너드 찬영",em:"🤓",pokemon:[{k:"porygon",l:27},{k:"magneton",l:27}],reward:810},
            {n:"아가씨 다온",em:"👩",pokemon:[{k:"tangela",l:27},{k:"eevee",l:26}],reward:780}
          ]},
        {id:"k_r8",n:"연분홍시티",desc:"바다의 도시",lv:[28,36],pokemon:[{k:"tentacool",w:15},{k:"horsea",w:15},{k:"staryu",w:10},{k:"krabby",w:15},{k:"shellder",w:10},{k:"seel",w:10},{k:"slowpoke",w:10},{k:"psyduck",w:15},{k:"mantine",w:5},{k:"qwilfish",w:5},{k:"remoraid",w:5}],hasCenter:true,hasShop:true,shopItems:["superball","ultraball","superpotion","hyperpotion","revive","antidote","paralyzeheal","awakening","burnheal","iceheal"],encounterRate:0.80,reqBadges:5,
         trainers:[
            {n:"수영선수 하나",em:"🏊",pokemon:[{k:"seadra",l:30},{k:"golduck",l:31},{k:"tentacruel",l:32}],reward:960},
            {n:"낚시꾼 준서",em:"🎣",pokemon:[{k:"gyarados",l:30},{k:"kingler",l:31}],reward:930},
            {n:"수영선수 미라",em:"🏊",pokemon:[{k:"tentacruel",l:31},{k:"starmie",l:32}],reward:960},
            {n:"낚시꾼 용식",em:"🎣",pokemon:[{k:"krabby",l:30},{k:"kingler",l:32},{k:"horsea",l:31}],reward:930},
            {n:"선원 태식",em:"⚓",pokemon:[{k:"shellder",l:31},{k:"staryu",l:31},{k:"psyduck",l:32}],reward:930},
            {n:"아가씨 세아",em:"👩",pokemon:[{k:"seel",l:31},{k:"dewgong",l:33}],reward:990},
            {n:"수영선수 범수",em:"🏊",pokemon:[{k:"tentacool",l:30},{k:"horsea",l:31},{k:"seadra",l:33}],reward:990}
          ]},
        {id:"k_r9",n:"홍련섬",desc:"불의 섬",lv:[34,42],pokemon:[{k:"ponyta",w:20},{k:"growlithe",w:15},{k:"magmar",w:15},{k:"vulpix",w:15},{k:"slugma",w:10},{k:"rhyhorn",w:15},{k:"cubone",w:10},{k:"skarmory",w:5},{k:"magby",w:5}],hasCenter:true,hasShop:true,shopItems:["superball","ultraball","hyperpotion","fullrestore","revive","antidote","paralyzeheal","awakening"],encounterRate:0.80,reqBadges:6,
         trainers:[
            {n:"과학자 민호",em:"🔬",pokemon:[{k:"electrode",l:36},{k:"magneton",l:37},{k:"porygon",l:36}],reward:1110},
            {n:"연구원 지영",em:"👩‍🔬",pokemon:[{k:"omanyte",l:35},{k:"kabuto",l:35},{k:"aerodactyl",l:38}],reward:1140},
            {n:"과학자 태영",em:"🔬",pokemon:[{k:"magnemite",l:37},{k:"magneton",l:38}],reward:1140},
            {n:"불꽃소년 진수",em:"🔥",pokemon:[{k:"ponyta",l:37},{k:"rapidash",l:39}],reward:1170},
            {n:"등산가 무열",em:"🧗",pokemon:[{k:"rhyhorn",l:38},{k:"cubone",l:37},{k:"marowak",l:39}],reward:1170},
            {n:"아가씨 미선",em:"👩",pokemon:[{k:"vulpix",l:38},{k:"ninetales",l:40}],reward:1200},
            {n:"연구원 성준",em:"👨‍🔬",pokemon:[{k:"growlithe",l:38},{k:"magmar",l:40}],reward:1200}
          ]},
        {id:"k_r10",n:"보라타운 탑",desc:"유령의 탑",lv:[26,34],pokemon:[{k:"gastly",w:30},{k:"haunter",w:20},{k:"zubat",w:15},{k:"cubone",w:15},{k:"misdreavus",w:10},{k:"drowzee",w:10},{k:"unown",w:5}],hasCenter:true,hasShop:false,encounterRate:0.90,reqBadges:4,
         trainers:[
            {n:"영매사 수정",em:"🔮",pokemon:[{k:"haunter",l:28},{k:"hypno",l:29}],reward:870},
            {n:"무녀 은희",em:"⛩️",pokemon:[{k:"gastly",l:27},{k:"gastly",l:28},{k:"haunter",l:30}],reward:900},
            {n:"영매사 유나",em:"🔮",pokemon:[{k:"gastly",l:28},{k:"haunter",l:30},{k:"misdreavus",l:29}],reward:870},
            {n:"무녀 보미",em:"⛩️",pokemon:[{k:"zubat",l:28},{k:"golbat",l:30}],reward:900},
            {n:"슈퍼너드 경수",em:"🤓",pokemon:[{k:"drowzee",l:29},{k:"hypno",l:31}],reward:930},
            {n:"영매사 소연",em:"🔮",pokemon:[{k:"cubone",l:29},{k:"gastly",l:30},{k:"haunter",l:31}],reward:930}
          ]},
        {id:"k_r11",n:"챔피언로드",desc:"강력한 포켓몬의 터전",lv:[38,48],pokemon:[{k:"machoke",w:20},{k:"graveler",w:20},{k:"golbat",w:15},{k:"onix",w:15},{k:"marowak",w:15},{k:"rhyhorn",w:15}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:7,
         trainers:[
            {n:"사천왕 칸나",em:"❄️",pokemon:[{k:"cloyster",l:42},{k:"dewgong",l:43},{k:"jynx",l:44},{k:"lapras",l:45}],reward:3000},
            {n:"사천왕 시바",em:"💪",pokemon:[{k:"hitmonlee",l:43},{k:"hitmonchan",l:43},{k:"machamp",l:45},{k:"primeape",l:44}],reward:3000},
            {n:"사천왕 국화",em:"👻",pokemon:[{k:"gengar",l:44},{k:"haunter",l:43},{k:"arbok",l:44},{k:"gengar",l:46}],reward:3000},
            {n:"사천왕 연지",em:"🐉",pokemon:[{k:"dragonair",l:45},{k:"dragonite",l:48}],reward:3200},
            {n:"블랙벨트 석훈",em:"🥋",pokemon:[{k:"machoke",l:43},{k:"machamp",l:45},{k:"primeape",l:44}],reward:3000},
            {n:"에이스 해나",em:"🎯",pokemon:[{k:"arcanine",l:44},{k:"lapras",l:45},{k:"alakazam",l:45}],reward:3200},
            {n:"등산가 철민",em:"🧗",pokemon:[{k:"graveler",l:43},{k:"golem",l:45},{k:"onix",l:44}],reward:3000}
          ]},
        {id:"k_r12",n:"석영고원",desc:"최강의 트레이너가 모이는 곳",lv:[50,70],pokemon:[{k:"dragonair",w:15},{k:"dragonite",w:5},{k:"lapras",w:10},{k:"snorlax",w:10},{k:"aerodactyl",w:10}],hasCenter:true,hasShop:true,shopItems:["ultraball","hyperpotion","maxpotion","fullrestore","revive","fullheal"],encounterRate:0.60,reqBadges:8,
         trainers:[
            {n:"챔피언 그린",em:"🏆",pokemon:[{k:"pidgeot",l:55},{k:"alakazam",l:55},{k:"rhydon",l:55},{k:"gyarados",l:56},{k:"arcanine",l:56},{k:"exeggutor",l:58}],reward:8000}
         ]}
    ]
},
johto: {
    n: "성도 지방", em: "🏔️",
    roads: [
        {id:"j_r1",n:"29번도로",desc:"연두마을~요시노시티",lv:[2,6],pokemon:[{k:"sentret",w:30},{k:"hoothoot",w:25},{k:"pidgey",w:25},{k:"rattata",w:10},{k:"spinarak",w:5},{k:"ledyba",w:5},{k:"marill",w:5},{k:"hoppip",w:5}],hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote"],encounterRate:0.85,reqBadges:0,
         trainers:[
            {n:"소년 영준",em:"👦",pokemon:[{k:"sentret",l:4},{k:"pidgey",l:5}],reward:120},
            {n:"소녀 민지",em:"👧",pokemon:[{k:"hoothoot",l:4},{k:"ledyba",l:5}],reward:120},
            {n:"소년 민서",em:"👦",pokemon:[{k:"sentret",l:4},{k:"rattata",l:5}],reward:120},
            {n:"소녀 지은",em:"👧",pokemon:[{k:"pidgey",l:5},{k:"marill",l:4}],reward:120},
            {n:"벌레잡이 동우",em:"🧒",pokemon:[{k:"caterpie",l:4},{k:"weedle",l:4},{k:"ledyba",l:5}],reward:150},
            {n:"소년 한결",em:"👦",pokemon:[{k:"hoothoot",l:5},{k:"spinarak",l:4}],reward:120}
          ]},
        {id:"j_r2",n:"도라지시티",desc:"보라빛 도시",lv:[6,12],pokemon:[{k:"mareep",w:25},{k:"geodude",w:20},{k:"zubat",w:20},{k:"houndour",w:15},{k:"wooper",w:10},{k:"nidoranm",w:5},{k:"nidoranf",w:5}],hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote","paralyzeheal"],encounterRate:0.85,reqBadges:0,
         trainers:[
            {n:"등산가 철호",em:"🧗",pokemon:[{k:"geodude",l:8},{k:"geodude",l:9},{k:"onix",l:10}],reward:300},
            {n:"등산가 현석",em:"🧗",pokemon:[{k:"geodude",l:9},{k:"onix",l:10}],reward:300},
            {n:"소녀 채원",em:"👧",pokemon:[{k:"mareep",l:9},{k:"wooper",l:10}],reward:300},
            {n:"불량배 성호",em:"😎",pokemon:[{k:"houndour",l:10},{k:"zubat",l:9}],reward:300},
            {n:"소년 예준",em:"👦",pokemon:[{k:"nidoranm",l:9},{k:"nidoranf",l:10},{k:"geodude",l:10}],reward:330},
            {n:"아가씨 소율",em:"👩",pokemon:[{k:"mareep",l:10},{k:"hoppip",l:9}],reward:300}
          ]},
        {id:"j_r3",n:"너도밤나무숲",desc:"자연의 힘이 가득한 숲",lv:[8,15],pokemon:[{k:"oddish",w:15},{k:"bellsprout",w:15},{k:"caterpie",w:10},{k:"weedle",w:10},{k:"paras",w:10},{k:"hoothoot",w:10},{k:"togepi",w:5},{k:"pichu",w:5},{k:"aipom",w:10},{k:"spinarak",w:10},{k:"yanma",w:5},{k:"smoochum",w:3},{k:"elekid",w:3}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:1,
         trainers:[
            {n:"벌레잡이 준호",em:"🧒",pokemon:[{k:"beedrill",l:12},{k:"butterfree",l:12}],reward:360},
            {n:"소녀 하은",em:"👧",pokemon:[{k:"oddish",l:11},{k:"bellsprout",l:11},{k:"sunkern",l:12}],reward:360},
            {n:"벌레잡이 현서",em:"🧒",pokemon:[{k:"caterpie",l:12},{k:"weedle",l:12},{k:"spinarak",l:13}],reward:390},
            {n:"소년 도윤",em:"👦",pokemon:[{k:"hoothoot",l:13},{k:"aipom",l:12}],reward:360},
            {n:"소녀 수빈",em:"👧",pokemon:[{k:"pichu",l:12},{k:"togepi",l:13}],reward:390},
            {n:"벌레잡이 지안",em:"🧒",pokemon:[{k:"paras",l:13},{k:"ledyba",l:12},{k:"spinarak",l:13}],reward:390},
            {n:"닌자 유빈",em:"🥷",pokemon:[{k:"oddish",l:13},{k:"bellsprout",l:14}],reward:420}
          ]},
        {id:"j_r4",n:"금빛시티",desc:"빛나는 대도시",lv:[14,22],pokemon:[{k:"murkrow",w:20},{k:"sneasel",w:15},{k:"houndour",w:15},{k:"growlithe",w:15},{k:"machop",w:15},{k:"abra",w:10},{k:"meowth",w:10}],hasCenter:true,hasShop:true,shopItems:["pokeball","superball","potion","superpotion","antidote","paralyzeheal","awakening"],encounterRate:0.80,reqBadges:2,
         trainers:[
            {n:"불량배 성민",em:"😎",pokemon:[{k:"murkrow",l:16},{k:"houndour",l:17},{k:"sneasel",l:17}],reward:510},
            {n:"짐꾼 태식",em:"🏋️",pokemon:[{k:"machop",l:17},{k:"machoke",l:19}],reward:570},
            {n:"불량배 현우",em:"😎",pokemon:[{k:"sneasel",l:17},{k:"murkrow",l:18}],reward:540},
            {n:"아가씨 다현",em:"👩",pokemon:[{k:"abra",l:18},{k:"meowth",l:17}],reward:540},
            {n:"짐꾼 강호",em:"🏋️",pokemon:[{k:"machop",l:18},{k:"machoke",l:20}],reward:600},
            {n:"슈퍼너드 동혁",em:"🤓",pokemon:[{k:"growlithe",l:18},{k:"houndour",l:19}],reward:570},
            {n:"소녀 나은",em:"👧",pokemon:[{k:"snubbull",l:18},{k:"clefairy",l:18}],reward:540}
          ]},
        {id:"j_r5",n:"38번도로",desc:"목장이 있는 도로",lv:[18,26],pokemon:[{k:"miltank",w:5},{k:"tauros",w:5},{k:"mareep",w:15},{k:"flaaffy",w:10},{k:"nidorina",w:10},{k:"nidorino",w:10},{k:"snubbull",w:15},{k:"stantler",w:15},{k:"teddiursa",w:15},{k:"skiploom",w:5},{k:"jumpluff",w:3},{k:"wobbuffet",w:3},{k:"smeargle",w:3}],hasCenter:true,hasShop:true,shopItems:["superball","superpotion","revive","antidote","paralyzeheal","awakening"],encounterRate:0.80,reqBadges:3,
         trainers:[
            {n:"목장주 민아",em:"🤠",pokemon:[{k:"miltank",l:22},{k:"tauros",l:23}],reward:690},
            {n:"목장주 철수",em:"🤠",pokemon:[{k:"tauros",l:23},{k:"stantler",l:22}],reward:690},
            {n:"소녀 아린",em:"👧",pokemon:[{k:"flaaffy",l:22},{k:"mareep",l:21}],reward:630},
            {n:"불량배 세준",em:"😎",pokemon:[{k:"snubbull",l:22},{k:"teddiursa",l:23}],reward:690},
            {n:"짐꾼 동수",em:"🏋️",pokemon:[{k:"machop",l:22},{k:"machoke",l:24}],reward:720},
            {n:"아가씨 서윤",em:"👩",pokemon:[{k:"nidorina",l:22},{k:"nidorino",l:23}],reward:690},
            {n:"소년 태윤",em:"👦",pokemon:[{k:"stantler",l:23},{k:"teddiursa",l:22},{k:"flaaffy",l:23}],reward:690}
          ]},
        {id:"j_r6",n:"분노의 호수",desc:"갸라도스의 전설이 서린 호수",lv:[22,30],pokemon:[{k:"magikarp",w:25},{k:"tentacool",w:15},{k:"goldeen",w:10},{k:"psyduck",w:10},{k:"poliwag",w:10},{k:"chinchou",w:10},{k:"corsola",w:5},{k:"gyarados",w:3},{k:"dratini",w:2}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:3,
         trainers:[
            {n:"로켓단 간부",em:"🦹",pokemon:[{k:"golbat",l:26},{k:"arbok",l:27},{k:"weezing",l:28}],reward:840},
            {n:"로켓단 간부",em:"🦹‍♀️",pokemon:[{k:"murkrow",l:27},{k:"houndoom",l:28},{k:"arbok",l:27}],reward:840},
            {n:"로켓단 조무래기",em:"🦹",pokemon:[{k:"rattata",l:26},{k:"zubat",l:27},{k:"koffing",l:27}],reward:810},
            {n:"수영선수 은지",em:"🏊",pokemon:[{k:"tentacool",l:27},{k:"goldeen",l:28}],reward:840},
            {n:"낚시꾼 민규",em:"🎣",pokemon:[{k:"magikarp",l:20},{k:"magikarp",l:22},{k:"gyarados",l:28}],reward:840},
            {n:"로켓단 과학자",em:"🔬",pokemon:[{k:"grimer",l:27},{k:"koffing",l:28},{k:"muk",l:29}],reward:870},
            {n:"선원 형근",em:"⚓",pokemon:[{k:"poliwag",l:27},{k:"corsola",l:28},{k:"tentacruel",l:29}],reward:870}
          ]},
        {id:"j_r7",n:"담청시티",desc:"약의 도시",lv:[25,33],pokemon:[{k:"flaaffy",w:15},{k:"ponyta",w:15},{k:"machoke",w:10},{k:"houndoom",w:10},{k:"sneasel",w:15},{k:"swinub",w:15},{k:"phanpy",w:10},{k:"gligar",w:10},{k:"shuckle",w:5},{k:"octillery",w:3}],hasCenter:true,hasShop:true,shopItems:["superball","ultraball","superpotion","hyperpotion","revive","antidote","paralyzeheal","awakening","burnheal","iceheal"],encounterRate:0.80,reqBadges:5,
         trainers:[
            {n:"닌자 켄지",em:"🥷",pokemon:[{k:"crobat",l:28},{k:"ariados",l:29},{k:"forretress",l:30}],reward:900},
            {n:"블랙벨트 경민",em:"🥋",pokemon:[{k:"machoke",l:29},{k:"primeape",l:30}],reward:900},
            {n:"등산가 소정",em:"🧗",pokemon:[{k:"graveler",l:29},{k:"machoke",l:30},{k:"onix",l:29}],reward:870},
            {n:"아가씨 수아",em:"👩",pokemon:[{k:"ponyta",l:29},{k:"flaaffy",l:30}],reward:900},
            {n:"슈퍼너드 찬호",em:"🤓",pokemon:[{k:"magneton",l:30},{k:"electrode",l:30}],reward:900},
            {n:"닌자 유진",em:"🥷",pokemon:[{k:"crobat",l:30},{k:"ariados",l:29}],reward:870},
            {n:"불량배 서진",em:"😎",pokemon:[{k:"sneasel",l:30},{k:"houndoom",l:31}],reward:930}
          ]},
        {id:"j_r8",n:"은빛산",desc:"성도에서 가장 높은 산",lv:[30,42],pokemon:[{k:"larvitar",w:10},{k:"pupitar",w:5},{k:"golbat",w:15},{k:"graveler",w:15},{k:"sneasel",w:15},{k:"swinub",w:10},{k:"piloswine",w:5},{k:"donphan",w:10},{k:"ursaring",w:10},{k:"crobat",w:5},{k:"porygon2",w:3},{k:"skarmory",w:5}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:7,
         trainers:[
            {n:"등산가 성호",em:"🧗",pokemon:[{k:"donphan",l:35},{k:"ursaring",l:36},{k:"piloswine",l:36}],reward:1080},
            {n:"사천왕 이쓱",em:"💀",pokemon:[{k:"umbreon",l:38},{k:"gengar",l:38},{k:"houndoom",l:39},{k:"murkrow",l:37}],reward:2500},
            {n:"등산가 지원",em:"🧗",pokemon:[{k:"graveler",l:35},{k:"golbat",l:36},{k:"donphan",l:36}],reward:1080},
            {n:"블랙벨트 현준",em:"🥋",pokemon:[{k:"machoke",l:35},{k:"machamp",l:37}],reward:1110},
            {n:"닌자 서현",em:"🥷",pokemon:[{k:"crobat",l:36},{k:"sneasel",l:35},{k:"ariados",l:36}],reward:1080},
            {n:"에이스 수민",em:"🎯",pokemon:[{k:"ursaring",l:37},{k:"piloswine",l:36},{k:"pupitar",l:35}],reward:1110},
            {n:"등산가 태훈",em:"🧗",pokemon:[{k:"swinub",l:34},{k:"piloswine",l:36},{k:"sneasel",l:37}],reward:1110}
          ]},
        {id:"j_r9",n:"소용돌이섬",desc:"강력한 포켓몬이 사는 곳",lv:[40,65],pokemon:[{k:"tyranitar",w:3},{k:"ampharos",w:8},{k:"houndoom",w:10},{k:"crobat",w:10},{k:"steelix",w:5},{k:"togetic",w:8},{k:"kingdra",w:5},{k:"scizor",w:5},{k:"dragonite",w:3},{k:"gyarados",w:10}],hasCenter:true,hasShop:true,shopItems:["ultraball","hyperpotion","maxpotion","fullrestore","revive","fullheal"],encounterRate:0.55,reqBadges:8,
         trainers:[
            {n:"챔피언 목호",em:"🏆",pokemon:[{k:"dragonite",l:55},{k:"tyranitar",l:55},{k:"gyarados",l:56},{k:"charizard",l:56},{k:"alakazam",l:55},{k:"machamp",l:58}],reward:8000},
            {n:"에이스 호성",em:"��",pokemon:[{k:"tyranitar",l:50},{k:"dragonite",l:52}],reward:6000},
            {n:"사천왕 시바",em:"💪",pokemon:[{k:"machamp",l:50},{k:"hitmontop",l:50},{k:"primeape",l:48}],reward:5000},
            {n:"사천왕 칸나",em:"❄️",pokemon:[{k:"lapras",l:52},{k:"dewgong",l:50},{k:"jynx",l:50}],reward:5000},
            {n:"사천왕 이쓱",em:"💀",pokemon:[{k:"umbreon",l:52},{k:"gengar",l:52},{k:"houndoom",l:53}],reward:5500},
            {n:"에이스 미영",em:"🎯",pokemon:[{k:"ampharos",l:50},{k:"scizor",l:52},{k:"kingdra",l:52}],reward:6000}
          ]}
    ]
},
hoenn: {
    n: "호엔 지방", em: "🌴",
    roads: [
        {id:"h_r1",n:"101번도로",desc:"미시로타운~상록시티",lv:[2,5],pokemon:[{k:"zigzagoon",w:40},{k:"poochyena",w:30},{k:"ralts",w:10},{k:"shroomish",w:10},{k:"treecko",w:10}],hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote"],encounterRate:0.85,reqBadges:0,
         trainers:[
            {n:"소년 민호",em:"👦",pokemon:[{k:"zigzagoon",l:4},{k:"poochyena",l:4}],reward:120},
            {n:"소녀 유나",em:"👧",pokemon:[{k:"ralts",l:3},{k:"shroomish",l:4}],reward:100},
            {n:"벌레잡이 태훈",em:"🧒",pokemon:[{k:"zigzagoon",l:3},{k:"zigzagoon",l:3},{k:"poochyena",l:4}],reward:120},
            {n:"소년 준영",em:"👦",pokemon:[{k:"treecko",l:5}],reward:150},
            {n:"소녀 하린",em:"👧",pokemon:[{k:"torchic",l:5}],reward:150},
            {n:"소년 서준",em:"👦",pokemon:[{k:"mudkip",l:5}],reward:150}
         ]},
        {id:"h_r2",n:"피나숲",desc:"울창한 숲",lv:[4,9],pokemon:[{k:"zigzagoon",w:20},{k:"shroomish",w:20},{k:"slakoth",w:10},{k:"ralts",w:15},{k:"poochyena",w:15},{k:"oddish",w:10},{k:"pikachu",w:10}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:0,
         trainers:[
            {n:"벌레잡이 현수",em:"🧒",pokemon:[{k:"shroomish",l:6},{k:"oddish",l:6}],reward:180},
            {n:"소년 지훈",em:"👦",pokemon:[{k:"slakoth",l:7},{k:"zigzagoon",l:6}],reward:210},
            {n:"소녀 가은",em:"👧",pokemon:[{k:"ralts",l:6},{k:"pikachu",l:7}],reward:210},
            {n:"벌레잡이 동수",em:"🧒",pokemon:[{k:"shroomish",l:6},{k:"poochyena",l:6},{k:"oddish",l:7}],reward:210},
            {n:"닌자 유리",em:"🥷",pokemon:[{k:"poochyena",l:7},{k:"slakoth",l:8}],reward:240},
            {n:"소년 현우",em:"👦",pokemon:[{k:"zigzagoon",l:7},{k:"ralts",l:7}],reward:210}
         ]},
        {id:"h_r3",n:"금탄시티",desc:"바위 체육관의 도시",lv:[8,14],pokemon:[{k:"geodude",w:25},{k:"makuhita",w:20},{k:"aron",w:15},{k:"zubat",w:15},{k:"meditite",w:15},{k:"geodude",w:10}],hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote","paralyzeheal","awakening"],encounterRate:0.80,reqBadges:1,
         trainers:[
            {n:"등산가 태호",em:"🧗",pokemon:[{k:"geodude",l:10},{k:"aron",l:10}],reward:300},
            {n:"격투가 민수",em:"🥊",pokemon:[{k:"makuhita",l:11},{k:"meditite",l:10}],reward:330},
            {n:"등산가 수정",em:"🧗",pokemon:[{k:"geodude",l:10},{k:"geodude",l:11},{k:"zubat",l:10}],reward:300},
            {n:"소녀 미래",em:"👧",pokemon:[{k:"ralts",l:11},{k:"shroomish",l:11}],reward:330},
            {n:"소년 시우",em:"👦",pokemon:[{k:"aron",l:11},{k:"makuhita",l:12}],reward:360},
            {n:"등산가 현석",em:"🧗",pokemon:[{k:"geodude",l:12},{k:"aron",l:12}],reward:360}
         ]},
        {id:"h_r4",n:"무로시티",desc:"격투 체육관의 섬",lv:[12,19],pokemon:[{k:"makuhita",w:25},{k:"meditite",w:20},{k:"zubat",w:15},{k:"tentacool",w:15},{k:"geodude",w:10},{k:"machop",w:15}],hasCenter:true,hasShop:true,shopItems:["pokeball","superball","potion","superpotion","antidote","paralyzeheal","awakening"],encounterRate:0.80,reqBadges:1,
         trainers:[
            {n:"격투가 호성",em:"🥊",pokemon:[{k:"makuhita",l:14},{k:"meditite",l:14}],reward:420},
            {n:"수영선수 현지",em:"🏊",pokemon:[{k:"tentacool",l:14},{k:"carvanha",l:15}],reward:450},
            {n:"격투가 미영",em:"🥊",pokemon:[{k:"machop",l:15},{k:"makuhita",l:16}],reward:480},
            {n:"불량배 건이",em:"😎",pokemon:[{k:"poochyena",l:14},{k:"carvanha",l:15}],reward:450},
            {n:"수영선수 태리",em:"🏊",pokemon:[{k:"tentacool",l:15},{k:"carvanha",l:16}],reward:480},
            {n:"격투가 진우",em:"🥊",pokemon:[{k:"meditite",l:16},{k:"makuhita",l:16}],reward:480}
         ]},
        {id:"h_r5",n:"보라시티",desc:"전기 체육관의 도시",lv:[17,24],pokemon:[{k:"electrike",w:25},{k:"pikachu",w:15},{k:"magnemite",w:15},{k:"voltorb",w:10},{k:"oddish",w:10},{k:"zigzagoon",w:10},{k:"linoone",w:15}],hasCenter:true,hasShop:true,shopItems:["pokeball","superball","potion","superpotion","paralyzeheal","awakening"],encounterRate:0.80,reqBadges:3,
         trainers:[
            {n:"전기기사 상훈",em:"⚡",pokemon:[{k:"electrike",l:20},{k:"magnemite",l:20}],reward:600},
            {n:"소녀 은서",em:"👧",pokemon:[{k:"pikachu",l:21},{k:"electrike",l:20}],reward:630},
            {n:"슈퍼너드 태우",em:"🤓",pokemon:[{k:"voltorb",l:20},{k:"magnemite",l:21}],reward:630},
            {n:"소년 강민",em:"👦",pokemon:[{k:"electrike",l:21},{k:"linoone",l:22}],reward:660},
            {n:"불량배 지성",em:"😎",pokemon:[{k:"mightyena",l:21},{k:"carvanha",l:21}],reward:630},
            {n:"전기기사 유빈",em:"⚡",pokemon:[{k:"magnemite",l:22},{k:"electrike",l:22}],reward:660}
         ]},
        {id:"h_r6",n:"풍연마을",desc:"불꽃 체육관의 온천마을",lv:[22,29],pokemon:[{k:"slugma",w:20},{k:"growlithe",w:15},{k:"ponyta",w:15},{k:"meditite",w:10},{k:"geodude",w:15},{k:"aron",w:15},{k:"trapinch",w:10}],hasCenter:true,hasShop:true,shopItems:["superball","superpotion","hyperpotion","antidote","paralyzeheal","awakening","revive"],encounterRate:0.80,reqBadges:4,
         trainers:[
            {n:"불꽃소년 진수",em:"🔥",pokemon:[{k:"slugma",l:25},{k:"growlithe",l:25}],reward:750},
            {n:"등산가 무열",em:"🧗",pokemon:[{k:"geodude",l:24},{k:"aron",l:25},{k:"trapinch",l:25}],reward:750},
            {n:"아가씨 미선",em:"👩",pokemon:[{k:"ponyta",l:26},{k:"growlithe",l:25}],reward:780},
            {n:"닌자 준혁",em:"🥷",pokemon:[{k:"mightyena",l:25},{k:"carvanha",l:26}],reward:780},
            {n:"불꽃소년 성호",em:"🔥",pokemon:[{k:"growlithe",l:26},{k:"slugma",l:27}],reward:810},
            {n:"등산가 소정",em:"🧗",pokemon:[{k:"lairon",l:26},{k:"trapinch",l:26}],reward:780}
         ]},
        {id:"h_r7",n:"하절시티",desc:"노멀 체육관의 도시",lv:[26,33],pokemon:[{k:"linoone",w:15},{k:"swablu",w:15},{k:"electrike",w:10},{k:"mightyena",w:15},{k:"breloom",w:10},{k:"vigoroth",w:10},{k:"absol",w:5},{k:"medicham",w:10},{k:"manectric",w:10}],hasCenter:true,hasShop:true,shopItems:["superball","ultraball","superpotion","hyperpotion","revive","antidote","paralyzeheal","awakening","burnheal","iceheal"],encounterRate:0.80,reqBadges:5,
         trainers:[
            {n:"아가씨 보라",em:"👩",pokemon:[{k:"vigoroth",l:29},{k:"linoone",l:28}],reward:870},
            {n:"불량배 세준",em:"😎",pokemon:[{k:"mightyena",l:29},{k:"sharpedo",l:30}],reward:900},
            {n:"슈퍼너드 찬영",em:"🤓",pokemon:[{k:"manectric",l:30},{k:"medicham",l:29}],reward:900},
            {n:"닌자 서현",em:"🥷",pokemon:[{k:"absol",l:30},{k:"mightyena",l:29}],reward:900},
            {n:"소년 태윤",em:"👦",pokemon:[{k:"breloom",l:30},{k:"vigoroth",l:30}],reward:900},
            {n:"소녀 아린",em:"👧",pokemon:[{k:"swablu",l:29},{k:"altaria",l:31}],reward:930}
         ]},
        {id:"h_r8",n:"트라이시티",desc:"비행/에스퍼 체육관의 도시",lv:[30,38],pokemon:[{k:"swablu",w:10},{k:"altaria",w:5},{k:"absol",w:10},{k:"breloom",w:10},{k:"vigoroth",w:10},{k:"medicham",w:10},{k:"carvanha",w:10},{k:"sharpedo",w:5},{k:"trapinch",w:10},{k:"vibrava",w:10},{k:"feebas",w:10}],hasCenter:true,hasShop:true,shopItems:["superball","ultraball","hyperpotion","fullrestore","revive","antidote","paralyzeheal","awakening"],encounterRate:0.80,reqBadges:6,
         trainers:[
            {n:"에이스 호성",em:"🎯",pokemon:[{k:"altaria",l:33},{k:"medicham",l:33}],reward:990},
            {n:"수영선수 범수",em:"🏊",pokemon:[{k:"sharpedo",l:34},{k:"tentacruel",l:33}],reward:1020},
            {n:"닌자 유진",em:"🥷",pokemon:[{k:"absol",l:34},{k:"mightyena",l:33}],reward:1020},
            {n:"에이스 수민",em:"🎯",pokemon:[{k:"vibrava",l:34},{k:"breloom",l:33}],reward:1020},
            {n:"수영선수 미라",em:"🏊",pokemon:[{k:"milotic",l:35},{k:"sharpedo",l:33}],reward:1050},
            {n:"에이스 해나",em:"🎯",pokemon:[{k:"slaking",l:35},{k:"aggron",l:34}],reward:1050}
         ]},
        {id:"h_r9",n:"챔피언로드",desc:"호엔 리그로 가는 길",lv:[38,48],pokemon:[{k:"vibrava",w:10},{k:"bagon",w:10},{k:"shelgon",w:5},{k:"beldum",w:10},{k:"metang",w:5},{k:"absol",w:10},{k:"aggron",w:5},{k:"hariyama",w:10},{k:"lairon",w:10},{k:"medicham",w:10},{k:"mightyena",w:15}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:7,
         trainers:[
            {n:"사천왕 카게츠",em:"💀",pokemon:[{k:"absol",l:44},{k:"mightyena",l:43},{k:"sharpedo",l:44}],reward:3000},
            {n:"사천왕 후요",em:"👻",pokemon:[{k:"gengar",l:44},{k:"misdreavus",l:43},{k:"misdreavus",l:43}],reward:3000},
            {n:"사천왕 프림",em:"❄️",pokemon:[{k:"dewgong",l:44},{k:"dewgong",l:43},{k:"cloyster",l:44}],reward:3000},
            {n:"사천왕 겐지",em:"🐉",pokemon:[{k:"salamence",l:46},{k:"flygon",l:45},{k:"altaria",l:44}],reward:3200},
            {n:"블랙벨트 석훈",em:"🥋",pokemon:[{k:"hariyama",l:44},{k:"medicham",l:43}],reward:2500},
            {n:"에이스 미영",em:"🎯",pokemon:[{k:"metagross",l:46},{k:"aggron",l:45}],reward:3200}
         ]},
        {id:"h_r10",n:"공중의 기둥",desc:"전설의 포켓몬이 잠든 곳",lv:[50,70],pokemon:[{k:"salamence",w:5},{k:"metagross",w:3},{k:"flygon",w:8},{k:"altaria",w:10},{k:"absol",w:10},{k:"aggron",w:8},{k:"milotic",w:5},{k:"slaking",w:3},{k:"gardevoir",w:8}],hasCenter:true,hasShop:true,shopItems:["ultraball","hyperpotion","maxpotion","fullrestore","revive","fullheal"],encounterRate:0.55,reqBadges:8,
         trainers:[
            {n:"챔피언 미쿠리",em:"🏆",pokemon:[{k:"milotic",l:56},{k:"gardevoir",l:55},{k:"flygon",l:55},{k:"metagross",l:57},{k:"salamence",l:58}],reward:8000}
         ]}
    ]
},
sinnoh: {
    n: "신오 지방", em: "❄️",
    roads: [
        {id:"s_r1",n:"201번도로",desc:"후타바타운~마사고타운",lv:[2,5],pokemon:[{k:"starly",w:35},{k:"shinx",w:30},{k:"rattata",w:20},{k:"turtwig",w:5},{k:"chimchar",w:5},{k:"piplup",w:5}],hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote"],encounterRate:0.85,reqBadges:0,
         trainers:[
            {n:"소년 유빈",em:"👦",pokemon:[{k:"starly",l:4},{k:"shinx",l:4}],reward:120},
            {n:"소녀 채원",em:"👧",pokemon:[{k:"starly",l:5}],reward:100},
            {n:"소년 도윤",em:"👦",pokemon:[{k:"shinx",l:4},{k:"starly",l:4}],reward:120},
            {n:"소녀 수빈",em:"👧",pokemon:[{k:"turtwig",l:5}],reward:150},
            {n:"소년 한결",em:"👦",pokemon:[{k:"chimchar",l:5}],reward:150},
            {n:"소녀 예준",em:"👧",pokemon:[{k:"piplup",l:5}],reward:150}
         ]},
        {id:"s_r2",n:"흑금시티",desc:"바위 체육관의 탄광 도시",lv:[6,12],pokemon:[{k:"geodude",w:25},{k:"onix",w:10},{k:"cranidos",w:15},{k:"starly",w:15},{k:"shinx",w:15},{k:"zubat",w:10},{k:"machop",w:10}],hasCenter:true,hasShop:true,shopItems:["pokeball","potion","antidote","paralyzeheal"],encounterRate:0.85,reqBadges:0,
         trainers:[
            {n:"등산가 철호",em:"🧗",pokemon:[{k:"geodude",l:8},{k:"cranidos",l:9}],reward:270},
            {n:"소녀 하은",em:"👧",pokemon:[{k:"shinx",l:9},{k:"starly",l:8}],reward:270},
            {n:"등산가 진석",em:"🧗",pokemon:[{k:"geodude",l:9},{k:"onix",l:10}],reward:300},
            {n:"소년 민서",em:"👦",pokemon:[{k:"machop",l:9},{k:"cranidos",l:10}],reward:300},
            {n:"등산가 유리",em:"🧗",pokemon:[{k:"geodude",l:10},{k:"zubat",l:9},{k:"geodude",l:10}],reward:300},
            {n:"소녀 나은",em:"👧",pokemon:[{k:"starly",l:10},{k:"shinx",l:10}],reward:300}
         ]},
        {id:"s_r3",n:"숲의 양옥",desc:"영원의 숲",lv:[10,17],pokemon:[{k:"shinx",w:15},{k:"starly",w:10},{k:"luxio",w:10},{k:"staravia",w:10},{k:"drifloon",w:15},{k:"oddish",w:10},{k:"gastly",w:10},{k:"zubat",w:10},{k:"pikachu",w:10}],hasCenter:false,hasShop:false,encounterRate:0.90,reqBadges:1,
         trainers:[
            {n:"영매사 수정",em:"🔮",pokemon:[{k:"drifloon",l:13},{k:"gastly",l:13}],reward:390},
            {n:"벌레잡이 지안",em:"🧒",pokemon:[{k:"oddish",l:13},{k:"shroomish",l:12}],reward:360},
            {n:"소년 도현",em:"👦",pokemon:[{k:"luxio",l:14},{k:"staravia",l:13}],reward:420},
            {n:"영매사 보미",em:"🔮",pokemon:[{k:"gastly",l:14},{k:"drifloon",l:13}],reward:420},
            {n:"소녀 서연",em:"👧",pokemon:[{k:"pikachu",l:14},{k:"oddish",l:13}],reward:420},
            {n:"벌레잡이 상우",em:"🧒",pokemon:[{k:"oddish",l:13},{k:"zubat",l:14},{k:"shinx",l:13}],reward:390}
         ]},
        {id:"s_r4",n:"영원시티",desc:"풀 체육관의 도시",lv:[14,21],pokemon:[{k:"staravia",w:15},{k:"luxio",w:15},{k:"drifloon",w:10},{k:"croagunk",w:15},{k:"skorupi",w:10},{k:"oddish",w:10},{k:"gastly",w:10},{k:"meditite",w:15}],hasCenter:true,hasShop:true,shopItems:["pokeball","superball","potion","superpotion","antidote","paralyzeheal","awakening"],encounterRate:0.80,reqBadges:2,
         trainers:[
            {n:"소녀 다현",em:"👧",pokemon:[{k:"staravia",l:17},{k:"luxio",l:17}],reward:510},
            {n:"격투가 경민",em:"🥊",pokemon:[{k:"croagunk",l:17},{k:"meditite",l:18}],reward:540},
            {n:"영매사 유나",em:"🔮",pokemon:[{k:"drifloon",l:18},{k:"gastly",l:17}],reward:540},
            {n:"불량배 성호",em:"😎",pokemon:[{k:"skorupi",l:18},{k:"croagunk",l:17}],reward:540},
            {n:"소년 예준",em:"👦",pokemon:[{k:"luxio",l:18},{k:"staravia",l:18}],reward:540},
            {n:"닌자 유빈",em:"🥷",pokemon:[{k:"croagunk",l:18},{k:"skorupi",l:19}],reward:570}
         ]},
        {id:"s_r5",n:"노모세시티",desc:"물 체육관의 습지 도시",lv:[20,27],pokemon:[{k:"croagunk",w:15},{k:"skorupi",w:10},{k:"psyduck",w:15},{k:"tentacool",w:10},{k:"shellder",w:10},{k:"goldeen",w:10},{k:"staravia",w:10},{k:"luxio",w:10},{k:"gible",w:10}],hasCenter:true,hasShop:true,shopItems:["superball","superpotion","revive","antidote","paralyzeheal","awakening"],encounterRate:0.80,reqBadges:3,
         trainers:[
            {n:"수영선수 하나",em:"🏊",pokemon:[{k:"psyduck",l:23},{k:"tentacool",l:22}],reward:690},
            {n:"낚시꾼 민규",em:"🎣",pokemon:[{k:"goldeen",l:22},{k:"shellder",l:23}],reward:690},
            {n:"불량배 현우",em:"😎",pokemon:[{k:"croagunk",l:23},{k:"skorupi",l:23}],reward:690},
            {n:"수영선수 은지",em:"🏊",pokemon:[{k:"tentacool",l:23},{k:"psyduck",l:24}],reward:720},
            {n:"소년 강호",em:"👦",pokemon:[{k:"luxray",l:24},{k:"staravia",l:23}],reward:720},
            {n:"아가씨 수아",em:"👩",pokemon:[{k:"gible",l:24},{k:"shellder",l:23}],reward:720}
         ]},
        {id:"s_r6",n:"요스가시티",desc:"고스트 체육관의 도시",lv:[25,33],pokemon:[{k:"drifloon",w:15},{k:"drifblim",w:5},{k:"gastly",w:15},{k:"haunter",w:10},{k:"misdreavus",w:15},{k:"murkrow",w:10},{k:"sneasel",w:10},{k:"gible",w:10},{k:"gabite",w:10}],hasCenter:true,hasShop:true,shopItems:["superball","ultraball","superpotion","hyperpotion","revive","antidote","paralyzeheal","awakening","burnheal","iceheal"],encounterRate:0.80,reqBadges:4,
         trainers:[
            {n:"영매사 소연",em:"🔮",pokemon:[{k:"drifblim",l:28},{k:"haunter",l:28}],reward:840},
            {n:"닌자 서진",em:"🥷",pokemon:[{k:"sneasel",l:29},{k:"murkrow",l:28}],reward:870},
            {n:"영매사 경수",em:"🔮",pokemon:[{k:"misdreavus",l:29},{k:"drifloon",l:28},{k:"gastly",l:29}],reward:870},
            {n:"불량배 세준",em:"😎",pokemon:[{k:"murkrow",l:29},{k:"sneasel",l:30}],reward:900},
            {n:"에이스 미영",em:"🎯",pokemon:[{k:"gabite",l:30},{k:"drifblim",l:29}],reward:900},
            {n:"영매사 보라",em:"🔮",pokemon:[{k:"haunter",l:30},{k:"misdreavus",l:30}],reward:900}
         ]},
        {id:"s_r7",n:"미오시티",desc:"강철 체육관의 항구도시",lv:[30,38],pokemon:[{k:"luxray",w:10},{k:"staraptor",w:10},{k:"gabite",w:10},{k:"snover",w:15},{k:"sneasel",w:10},{k:"skorupi",w:10},{k:"drapion",w:5},{k:"toxicroak",w:5},{k:"riolu",w:10},{k:"shieldon",w:5},{k:"cranidos",w:10}],hasCenter:true,hasShop:true,shopItems:["superball","ultraball","hyperpotion","fullrestore","revive","antidote","paralyzeheal","awakening"],encounterRate:0.80,reqBadges:5,
         trainers:[
            {n:"등산가 지원",em:"🧗",pokemon:[{k:"cranidos",l:33},{k:"shieldon",l:33}],reward:990},
            {n:"격투가 현준",em:"🥊",pokemon:[{k:"riolu",l:33},{k:"toxicroak",l:34}],reward:1020},
            {n:"닌자 찬호",em:"🥷",pokemon:[{k:"drapion",l:34},{k:"sneasel",l:33}],reward:1020},
            {n:"에이스 수민",em:"🎯",pokemon:[{k:"luxray",l:34},{k:"staraptor",l:34}],reward:1020},
            {n:"등산가 태훈",em:"🧗",pokemon:[{k:"rampardos",l:34},{k:"bastiodon",l:33}],reward:1020},
            {n:"아가씨 다온",em:"👩",pokemon:[{k:"gabite",l:34},{k:"snover",l:33}],reward:1020}
         ]},
        {id:"s_r8",n:"키싱시티",desc:"얼음 체육관의 눈의 도시",lv:[35,43],pokemon:[{k:"snover",w:20},{k:"abomasnow",w:5},{k:"sneasel",w:15},{k:"swinub",w:15},{k:"piloswine",w:5},{k:"gabite",w:10},{k:"riolu",w:10},{k:"lucario",w:5},{k:"drapion",w:5},{k:"toxicroak",w:5},{k:"staraptor",w:5}],hasCenter:true,hasShop:true,shopItems:["ultraball","hyperpotion","maxpotion","fullrestore","revive","fullheal"],encounterRate:0.80,reqBadges:6,
         trainers:[
            {n:"스키어 미선",em:"⛷️",pokemon:[{k:"snover",l:38},{k:"swinub",l:37},{k:"abomasnow",l:39}],reward:1170},
            {n:"등산가 무열",em:"🧗",pokemon:[{k:"piloswine",l:38},{k:"sneasel",l:38}],reward:1140},
            {n:"에이스 해나",em:"🎯",pokemon:[{k:"lucario",l:39},{k:"gabite",l:38}],reward:1170},
            {n:"닌자 서현",em:"🥷",pokemon:[{k:"drapion",l:38},{k:"toxicroak",l:39}],reward:1170},
            {n:"스키어 소정",em:"⛷️",pokemon:[{k:"abomasnow",l:39},{k:"piloswine",l:39}],reward:1170},
            {n:"격투가 성호",em:"🥊",pokemon:[{k:"lucario",l:39},{k:"toxicroak",l:38}],reward:1170}
         ]},
        {id:"s_r9",n:"챔피언로드",desc:"신오 리그로 가는 길",lv:[40,50],pokemon:[{k:"gabite",w:10},{k:"garchomp",w:3},{k:"lucario",w:5},{k:"drapion",w:10},{k:"abomasnow",w:10},{k:"staraptor",w:10},{k:"luxray",w:10},{k:"toxicroak",w:10},{k:"rampardos",w:5},{k:"bastiodon",w:5}],hasCenter:false,hasShop:false,encounterRate:0.85,reqBadges:7,
         trainers:[
            {n:"사천왕 료",em:"🐛",pokemon:[{k:"heracross",l:46},{k:"scizor",l:46},{k:"drapion",l:47}],reward:3000},
            {n:"사천왕 키쿠노",em:"🌍",pokemon:[{k:"rampardos",l:46},{k:"garchomp",l:48}],reward:3200},
            {n:"사천왕 오바",em:"🔥",pokemon:[{k:"arcanine",l:46},{k:"infernape",l:48}],reward:3200},
            {n:"사천왕 고요",em:"🔮",pokemon:[{k:"gardevoir",l:46},{k:"alakazam",l:46},{k:"lucario",l:48}],reward:3200},
            {n:"블랙벨트 민수",em:"🥋",pokemon:[{k:"lucario",l:46},{k:"toxicroak",l:45}],reward:2500},
            {n:"에이스 찬영",em:"🎯",pokemon:[{k:"garchomp",l:47},{k:"metagross",l:46}],reward:3200}
         ]},
        {id:"s_r10",n:"창기둥",desc:"전설의 포켓몬이 잠든 곳",lv:[50,70],pokemon:[{k:"garchomp",w:5},{k:"lucario",w:8},{k:"metagross",w:3},{k:"salamence",w:3},{k:"abomasnow",w:10},{k:"drapion",w:10},{k:"staraptor",w:10},{k:"luxray",w:10},{k:"infernape",w:5},{k:"empoleon",w:5},{k:"torterra",w:5}],hasCenter:true,hasShop:true,shopItems:["ultraball","hyperpotion","maxpotion","fullrestore","revive","fullheal"],encounterRate:0.55,reqBadges:8,
         trainers:[
            {n:"챔피언 난천",em:"🏆",pokemon:[{k:"garchomp",l:58},{k:"lucario",l:56},{k:"milotic",l:56},{k:"staraptor",l:55},{k:"infernape",l:57}],reward:8000}
         ]}
    ]
}
};

// ═══════════════════════════════════════════════
// 🏅 체육관 데이터 (지역별, 관장이 세대별로 다른 경우 leaders 배열에 복수)
// ═══════════════════════════════════════════════
var GYMS = {
kanto: [
    {id:"k_gym1",city:"니비시티",n:"니비시티 체육관",type:"rock",badge:"회색뱃지",badgeEm:"🪨",
     leaders:[{id:"brock",n:"웅",em:"🏋️",gen:1,pokemon:[{k:"geodude",l:12},{k:"onix",l:14}],reward:1400}]},
    {id:"k_gym2",city:"블루시티",n:"블루시티 체육관",type:"water",badge:"블루뱃지",badgeEm:"💧",
     leaders:[{id:"misty",n:"이슬",em:"💧",gen:1,pokemon:[{k:"staryu",l:18},{k:"starmie",l:21}],reward:2100}]},
    {id:"k_gym3",city:"노량시티",n:"노량시티 체육관",type:"electric",badge:"오렌지뱃지",badgeEm:"⚡",
     leaders:[{id:"surge",n:"마티스",em:"⚡",gen:1,pokemon:[{k:"voltorb",l:21},{k:"pikachu",l:18},{k:"raichu",l:24}],reward:2400}]},
    {id:"k_gym4",city:"무지개시티",n:"무지개시티 체육관",type:"grass",badge:"레인보우뱃지",badgeEm:"🌈",
     leaders:[{id:"erika",n:"민화",em:"🌿",gen:1,pokemon:[{k:"victreebel",l:29},{k:"tangela",l:24},{k:"vileplume",l:29}],reward:2900}]},
    {id:"k_gym5",city:"연분홍시티",n:"연분홍시티 체육관",type:"poison",badge:"핑크뱃지",badgeEm:"☠️",
     leaders:[
        {id:"koga",n:"독",em:"☠️",gen:1,pokemon:[{k:"koffing",l:37},{k:"muk",l:39},{k:"weezing",l:43}],reward:4300},
        {id:"janine",n:"도희",em:"🥷",gen:2,pokemon:[{k:"crobat",l:36},{k:"weezing",l:36},{k:"ariados",l:33},{k:"venomoth",l:39}],reward:3900}
     ]},
    {id:"k_gym6",city:"노란시티",n:"노란시티 체육관",type:"psychic",badge:"골드뱃지",badgeEm:"🔮",
     leaders:[{id:"sabrina",n:"초련",em:"🔮",gen:1,pokemon:[{k:"kadabra",l:38},{k:"mrmime",l:37},{k:"venomoth",l:38},{k:"alakazam",l:43}],reward:4300}]},
    {id:"k_gym7",city:"홍련섬",n:"홍련섬 체육관",type:"fire",badge:"크림슨뱃지",badgeEm:"🔥",
     leaders:[{id:"blaine",n:"강연",em:"🔥",gen:1,pokemon:[{k:"growlithe",l:42},{k:"ponyta",l:40},{k:"rapidash",l:42},{k:"arcanine",l:47}],reward:4700}]},
    {id:"k_gym8",city:"상록시티",n:"상록시티 체육관",type:"ground",badge:"그린뱃지",badgeEm:"🌍",
     leaders:[
        {id:"giovanni",n:"비주기",em:"🦹",gen:1,pokemon:[{k:"rhyhorn",l:45},{k:"dugtrio",l:42},{k:"nidoqueen",l:44},{k:"nidoking",l:45},{k:"rhydon",l:50}],reward:6500},
        {id:"blue",n:"그린",em:"🏆",gen:2,pokemon:[{k:"pidgeot",l:56},{k:"alakazam",l:54},{k:"rhydon",l:56},{k:"gyarados",l:58},{k:"arcanine",l:58},{k:"exeggutor",l:58}],reward:8000}
     ]}
],
johto: [
    {id:"j_gym1",city:"도라지시티",n:"도라지시티 체육관",type:"flying",badge:"제피르뱃지",badgeEm:"🪶",
     leaders:[{id:"falkner",n:"비상",em:"🐦",gen:2,pokemon:[{k:"pidgey",l:7},{k:"pidgeotto",l:9}],reward:900}]},
    {id:"j_gym2",city:"고동마을",n:"고동마을 체육관",type:"bug",badge:"인섹트뱃지",badgeEm:"🐛",
     leaders:[{id:"bugsy",n:"호일",em:"🐛",gen:2,pokemon:[{k:"metapod",l:14},{k:"kakuna",l:14},{k:"scyther",l:16}],reward:1600}]},
    {id:"j_gym3",city:"금빛시티",n:"금빛시티 체육관",type:"normal",badge:"레귤러뱃지",badgeEm:"⭐",
     leaders:[{id:"whitney",n:"꼭두",em:"⭐",gen:2,pokemon:[{k:"clefairy",l:18},{k:"miltank",l:20}],reward:2000}]},
    {id:"j_gym4",city:"인주시티",n:"인주시티 체육관",type:"ghost",badge:"팬텀뱃지",badgeEm:"👻",
     leaders:[{id:"morty",n:"유빙",em:"👻",gen:2,pokemon:[{k:"gastly",l:21},{k:"haunter",l:21},{k:"gengar",l:25},{k:"haunter",l:23}],reward:2500}]},
    {id:"j_gym5",city:"담청시티",n:"담청시티 체육관",type:"fighting",badge:"쇼크뱃지",badgeEm:"💪",
     leaders:[{id:"chuck",n:"사도",em:"💪",gen:2,pokemon:[{k:"primeape",l:27},{k:"poliwrath",l:30}],reward:3000}]},
    {id:"j_gym6",city:"연고시티",n:"연고시티 체육관",type:"steel",badge:"스틸뱃지",badgeEm:"⚙️",
     leaders:[{id:"jasmine",n:"미강",em:"⚙️",gen:2,pokemon:[{k:"magnemite",l:30},{k:"magnemite",l:30},{k:"steelix",l:35}],reward:3500}]},
    {id:"j_gym7",city:"담홍시티",n:"담홍시티 체육관",type:"ice",badge:"아이스뱃지",badgeEm:"❄️",
     leaders:[{id:"pryce",n:"류옹",em:"❄️",gen:2,pokemon:[{k:"seel",l:27},{k:"dewgong",l:29},{k:"piloswine",l:31}],reward:3100}]},
    {id:"j_gym8",city:"블랙쏜시티",n:"블랙쏜시티 체육관",type:"dragon",badge:"라이징뱃지",badgeEm:"🐉",
     leaders:[{id:"clair",n:"이향",em:"🐉",gen:2,pokemon:[{k:"dragonair",l:37},{k:"dragonair",l:37},{k:"dragonair",l:37},{k:"kingdra",l:40}],reward:4000}]}
],
hoenn: [
    {id:"h_gym1",city:"금탄시티",n:"금탄시티 체육관",type:"rock",badge:"스톤뱃지",badgeEm:"🪨",
     leaders:[{id:"roxanne",n:"이즈미",em:"🪨",gen:3,pokemon:[{k:"geodude",l:12},{k:"geodude",l:12},{k:"aron",l:14}],reward:1400}]},
    {id:"h_gym2",city:"무로시티",n:"무로시티 체육관",type:"fighting",badge:"너클뱃지",badgeEm:"🥊",
     leaders:[{id:"brawly",n:"토키",em:"🥊",gen:3,pokemon:[{k:"machop",l:16},{k:"makuhita",l:18},{k:"meditite",l:17}],reward:1800}]},
    {id:"h_gym3",city:"보라시티",n:"보라시티 체육관",type:"electric",badge:"다이나모뱃지",badgeEm:"⚡",
     leaders:[{id:"wattson",n:"테센",em:"⚡",gen:3,pokemon:[{k:"voltorb",l:20},{k:"electrike",l:20},{k:"magnemite",l:22},{k:"manectric",l:24}],reward:2400}]},
    {id:"h_gym4",city:"풍연마을",n:"풍연마을 체육관",type:"fire",badge:"히트뱃지",badgeEm:"🔥",
     leaders:[{id:"flannery",n:"아스나",em:"🔥",gen:3,pokemon:[{k:"slugma",l:26},{k:"slugma",l:26},{k:"ponyta",l:28},{k:"growlithe",l:29}],reward:2900}]},
    {id:"h_gym5",city:"하절시티",n:"하절시티 체육관",type:"normal",badge:"밸런스뱃지",badgeEm:"⚖️",
     leaders:[{id:"norman",n:"센리",em:"⚖️",gen:3,pokemon:[{k:"slakoth",l:28},{k:"vigoroth",l:30},{k:"slaking",l:31}],reward:3100}]},
    {id:"h_gym6",city:"트라이시티",n:"트라이시티 체육관",type:"flying",badge:"페더뱃지",badgeEm:"🪶",
     leaders:[{id:"winona",n:"나기",em:"🪶",gen:3,pokemon:[{k:"swablu",l:30},{k:"altaria",l:33},{k:"aerodactyl",l:32}],reward:3300}]},
    {id:"h_gym7",city:"트라이시티",n:"트라이시티 에스퍼 체육관",type:"psychic",badge:"마인드뱃지",badgeEm:"🔮",
     leaders:[{id:"tateliza",n:"풍&란",em:"🔮",gen:3,pokemon:[{k:"gardevoir",l:36},{k:"medicham",l:35},{k:"alakazam",l:36}],reward:3600}]},
    {id:"h_gym8",city:"루네시티",n:"루네시티 체육관",type:"water",badge:"레인뱃지",badgeEm:"🌧️",
     leaders:[
        {id:"wallace",n:"미쿠리",em:"💧",gen:3,pokemon:[{k:"milotic",l:40},{k:"tentacruel",l:38},{k:"gyarados",l:39},{k:"starmie",l:39}],reward:4000},
        {id:"juan",n:"아단",em:"🌊",gen:3,pokemon:[{k:"milotic",l:42},{k:"kingdra",l:41},{k:"tentacruel",l:40}],reward:4100}
     ]}
],
sinnoh: [
    {id:"s_gym1",city:"흑금시티",n:"흑금시티 체육관",type:"rock",badge:"콜뱃지",badgeEm:"🪨",
     leaders:[{id:"roark",n:"효태",em:"🪨",gen:4,pokemon:[{k:"geodude",l:12},{k:"onix",l:12},{k:"cranidos",l:14}],reward:1400}]},
    {id:"s_gym2",city:"영원시티",n:"영원시티 체육관",type:"grass",badge:"포레스트뱃지",badgeEm:"🌿",
     leaders:[{id:"gardenia",n:"유채",em:"🌿",gen:4,pokemon:[{k:"oddish",l:19},{k:"shroomish",l:19},{k:"grotle",l:22}],reward:2200}]},
    {id:"s_gym3",city:"노모세시티",n:"노모세시티 체육관",type:"water",badge:"코볼트뱃지",badgeEm:"💧",
     leaders:[{id:"crasherwake",n:"맥시",em:"💧",gen:4,pokemon:[{k:"gyarados",l:27},{k:"golduck",l:27},{k:"poliwrath",l:30}],reward:3000}]},
    {id:"s_gym4",city:"요스가시티",n:"요스가시티 체육관",type:"ghost",badge:"렐릭뱃지",badgeEm:"👻",
     leaders:[{id:"fantina",n:"멜리사",em:"👻",gen:4,pokemon:[{k:"drifloon",l:32},{k:"haunter",l:32},{k:"misdreavus",l:34}],reward:3400}]},
    {id:"s_gym5",city:"노모세시티",n:"격투 체육관",type:"fighting",badge:"코볼트뱃지",badgeEm:"💪",
     leaders:[{id:"maylene",n:"자두",em:"💪",gen:4,pokemon:[{k:"meditite",l:28},{k:"machoke",l:29},{k:"lucario",l:32}],reward:3200}]},
    {id:"s_gym6",city:"미오시티",n:"미오시티 체육관",type:"steel",badge:"마인뱃지",badgeEm:"⚙️",
     leaders:[{id:"byron",n:"동관",em:"⚙️",gen:4,pokemon:[{k:"shieldon",l:36},{k:"steelix",l:36},{k:"bastiodon",l:39}],reward:3900}]},
    {id:"s_gym7",city:"키싱시티",n:"키싱시티 체육관",type:"ice",badge:"아이시클뱃지",badgeEm:"❄️",
     leaders:[{id:"candice",n:"무청",em:"❄️",gen:4,pokemon:[{k:"snover",l:38},{k:"sneasel",l:38},{k:"piloswine",l:40},{k:"abomasnow",l:42}],reward:4200}]},
    {id:"s_gym8",city:"선전시티",n:"선전시티 체육관",type:"electric",badge:"비콘뱃지",badgeEm:"⚡",
     leaders:[{id:"volkner",n:"전진",em:"⚡",gen:4,pokemon:[{k:"raichu",l:46},{k:"luxray",l:48},{k:"electabuzz",l:47}],reward:4800}]}
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
pokeball:    {n:"몬스터볼",desc:"야생 포켓몬 포획 (1x)",type:"ball",value:1,buy:200,sell:100},
superball:   {n:"슈퍼볼",desc:"야생 포켓몬 포획 (1.5x)",type:"ball",value:1.5,buy:600,sell:300},
ultraball:   {n:"하이퍼볼",desc:"야생 포켓몬 포획 (2x)",type:"ball",value:2,buy:1200,sell:600},
masterball:  {n:"마스터볼",desc:"100% 포획",type:"ball",value:255,buy:99999,sell:1},
repel:       {n:"벌레스프레이",desc:"100걸음 야생 포켓몬 조우 방지",type:"etc",value:100,buy:350,sell:175},
superrepel:  {n:"실버스프레이",desc:"200걸음 야생 포켓몬 조우 방지",type:"etc",value:200,buy:500,sell:250},
maxrepel:    {n:"골드스프레이",desc:"250걸음 야생 포켓몬 조우 방지",type:"etc",value:250,buy:700,sell:350},
xattack:     {n:"플러스파워",desc:"배틀 중 공격 1단계 상승",type:"battle",value:"atk",buy:500,sell:250},
xdefense:    {n:"디펜드업",desc:"배틀 중 방어 1단계 상승",type:"battle",value:"def",buy:550,sell:275},
xspeed:      {n:"스피더",desc:"배틀 중 스피드 1단계 상승",type:"battle",value:"spd",buy:350,sell:175}
};

// ═══════════════════════════════════════════════
// 🎮 게임 상태 & 유틸
// ═══════════════════════════════════════════════
var TIME_NAMES = ["🌙 새벽","🌅 아침","☀️ 점심","🌇 오후","🌃 밤"];
var TIME_KEYS = ["dawn","morning","noon","afternoon","night"];

var player = null;
var gState = null;
var isVisible = true;
var _eventLog = [];

function createNewPlayer(name, starterKey, region) {
    var starter = createPokemonInstance(starterKey, 5);
    var dex = {};
    dex[starterKey] = true;
    return {
        name: name || "레드",
        party: [starter],
        pc: [],
        bag: {pokeball:10, potion:5},
        gold: 3000,
        region: region || "kanto",
        roadIdx: 0,
        badges: {kanto:[], johto:[], hoenn:[], sinnoh:[]},
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
        statStages: {atk:0,def:0,spatk:0,spdef:0,spd:0,acc:0,eva:0}
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
                player.badges = {kanto:[], johto:[], hoenn:[], sinnoh:[]};
            }
            if (!player.badges.kanto) player.badges.kanto = [];
            if (!player.badges.johto) player.badges.johto = [];
            if (!player.badges.hoenn) player.badges.hoenn = [];
            if (!player.badges.sinnoh) player.badges.sinnoh = [];
            if (player.routeIdx !== undefined && player.roadIdx === undefined) {
                player.roadIdx = player.routeIdx;
                delete player.routeIdx;
            }
            return true;
        }
    } catch(e) { console.error(PLUGIN, "load fail:", e); }
    return false;
}

function addLog(msg, type) {
    type = type || "info";
    if (!gState) return;
    gState.log = gState.log || [];
    gState.log.unshift({msg:msg, type:type, t:Date.now()});
    if (gState.log.length > 50) gState.log.pop();
    _eventLog.push({msg:msg, type:type});
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

    var level = attackerPoke.level;
    var power = move.p;

    // HP비례기: 분화(eruption)는 현재HP/최대HP 비율로 위력이 변동 (최대150→최소1)
    if (moveKey === "eruption") {
        power = Math.max(1, Math.floor(150 * attackerPoke.currentHp / attackerPoke.stats[0]));
    }

    var atkStat, defStat;
    if (move.c === "physical") {
        atkStat = attackerPoke.stats[1] * getStatMult(attackerPoke.statStages.atk);
        defStat = defenderPoke.stats[2] * getStatMult(defenderPoke.statStages.def);
        if (attackerPoke.status === "burn") atkStat *= 0.5;
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
    for (var i = 0; i < atkData.t.length; i++) {
        if (atkData.t[i] === move.t) { stab = 1.5; break; }
    }

    // 타입 상성
    var eff = getTypeEffect(move.t, defData.t);

    // 급소 (1/24 기본, highcrit이면 1/8)
    var critChance = (move.ef === "highcrit") ? 0.125 : (1/24);
    var crit = (Math.random() < critChance) ? 1.5 : 1;

    // 랜덤 (0.85~1.00)
    var rand = rngf(0.85, 1.0);

    var dmg = Math.floor(baseDmg * stab * eff * crit * rand);
    if (dmg < 1 && eff > 0) dmg = 1;

    return {dmg: dmg, eff: eff, crit: crit > 1};
}

// ═══════════════════════════════════════════════
// 🌟 전설/환상 포켓몬 시스템
// ═══════════════════════════════════════════════
var LEGENDARY_ENCOUNTERS = {
// 칸토 전설 (칸토 뱃지 8개 필요, 석영고원에서 조우)
kanto_fixed: [
    {key:"articuno",road:"k_r12",reqRegion:"kanto",reqBadges:8,level:50,name:"프리져"},
    {key:"zapdos",road:"k_r12",reqRegion:"kanto",reqBadges:8,level:50,name:"썬더"},
    {key:"moltres",road:"k_r12",reqRegion:"kanto",reqBadges:8,level:50,name:"파이어"},
    {key:"mewtwo",road:"k_r12",reqRegion:"kanto",reqBadges:8,level:70,name:"뮤츠"}
],
// 성도 전설 (성도 뱃지 8개 필요, 소용돌이섬에서 조우)
johto_fixed: [
    {key:"lugia",road:"j_r9",reqRegion:"johto",reqBadges:8,level:60,name:"루기아"},
    {key:"hooh",road:"j_r9",reqRegion:"johto",reqBadges:8,level:60,name:"호오"}
],
// 호엔 전설 (호엔 뱃지 8개 필요, 공중의 기둥에서 조우)
hoenn_fixed: [
    {key:"regirock",road:"h_r10",reqRegion:"hoenn",reqBadges:8,level:50,name:"레지락"},
    {key:"regice",road:"h_r10",reqRegion:"hoenn",reqBadges:8,level:50,name:"레지아이스"},
    {key:"registeel",road:"h_r10",reqRegion:"hoenn",reqBadges:8,level:50,name:"레지스틸"},
    {key:"latias",road:"h_r10",reqRegion:"hoenn",reqBadges:8,level:50,name:"라티아스"},
    {key:"latios",road:"h_r10",reqRegion:"hoenn",reqBadges:8,level:50,name:"라티오스"},
    {key:"kyogre",road:"h_r10",reqRegion:"hoenn",reqBadges:8,level:70,name:"가이오가"},
    {key:"groudon",road:"h_r10",reqRegion:"hoenn",reqBadges:8,level:70,name:"그란돈"},
    {key:"rayquaza",road:"h_r10",reqRegion:"hoenn",reqBadges:8,level:70,name:"레쿠쟈"}
],
// 신오 전설 (신오 뱃지 8개 필요, 창기둥에서 조우)
sinnoh_fixed: [
    {key:"dialga",road:"s_r10",reqRegion:"sinnoh",reqBadges:8,level:70,name:"디아루가"},
    {key:"palkia",road:"s_r10",reqRegion:"sinnoh",reqBadges:8,level:70,name:"펄기아"},
    {key:"giratina",road:"s_r10",reqRegion:"sinnoh",reqBadges:8,level:70,name:"기라티나"},
    {key:"heatran",road:"s_r10",reqRegion:"sinnoh",reqBadges:8,level:50,name:"히드런"},
    {key:"cresselia",road:"s_r10",reqRegion:"sinnoh",reqBadges:8,level:50,name:"크레세리아"}
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
    {key:"arceus",reqType:"totalBadges",reqCount:32,level:80,name:"아르세우스"}
]
};

function getAvailableLegendaries(roadId) {
    if (!player) return [];
    var available = [];
    // 고정 전설 (칸토)
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
    // 고정 전설 (호엔)
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
            var total = (player.badges.kanto ? player.badges.kanto.length : 0) + (player.badges.johto ? player.badges.johto.length : 0) + (player.badges.hoenn ? player.badges.hoenn.length : 0) + (player.badges.sinnoh ? player.badges.sinnoh.length : 0);
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
    if (player.pokedex) player.pokedex[legendaryKey] = true;
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

function startWildBattle(road) {
    if (!player || !gState || !road) return false;
    // 확률 조우
    if (Math.random() > road.encounterRate) {
        addLog("풀숲을 탐색했지만 포켓몬이 나타나지 않았다...", "info");
        return false;
    }
    // 시간대별 포켓몬 필터링
    var nightOnly = {gastly:1,haunter:1,gengar:1,hoothoot:1,noctowl:1,murkrow:1,misdreavus:1,spinarak:1,ariados:1,sneasel:1,umbreon:1,houndour:1,houndoom:1};
    var dayOnly = {sunkern:1,sunflora:1,ledyba:1,ledian:1,espeon:1};
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
    if (player.pokedex) player.pokedex[chosen] = true;
    var myIdx = 0;
    for (var i = 0; i < player.party.length; i++) {
        if (player.party[i].currentHp > 0) { myIdx = i; break; }
    }
    gState.phase = "battle";
    gState.battleData = {
        type: "wild",
        enemy: wildPoke,
        myIdx: myIdx,
        turn: 0,
        fled: false,
        caught: false,
        won: false,
        lost: false,
        msg: [],
        animating: false
    };
    var dn = POKEDEX[chosen] ? POKEDEX[chosen].n : chosen;
    addLog("야생 " + dn + " (Lv." + lv + ")이(가) 나타났다!", "battle");
    gState.battleData.msg.push("야생 " + dn + " (Lv." + lv + ")이(가) 나타났다!");
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
    gState.battleData.msg.push(trainer.n + "은(는) " + enemyParty[0].nickname + "을(를) 내보냈다!");
    // 도감 등록
    for (var i = 0; i < enemyParty.length; i++) {
        if (player.pokedex) player.pokedex[enemyParty[i].key] = true;
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
        trainerKey: gKey,
        isRematch: isRematch,
        enemyParty: enemyParty,
        enemyIdx: 0,
        enemy: enemyParty[0],
        myIdx: myIdx,
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
    gState.battleData.msg.push("관장 " + leader.n + "은(는) " + enemyParty[0].nickname + "을(를) 내보냈다!");
    for (var i = 0; i < enemyParty.length; i++) {
        if (player.pokedex) player.pokedex[enemyParty[i].key] = true;
    }
    return true;
}

function applyMoveEffects(move, attacker, defender, bd) {
    var mv = MOVES[move];
    if (!mv) return;
    var an = attacker.nickname;
    var dn = defender.nickname;
    if (mv.ef && mv.ec) {
        if (Math.random() * 100 < mv.ec) {
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
                if (defender.status !== "confuse") {
                    defender.status = "confuse"; defender.statusTurns = rng(2,5); bd.msg.push(dn + "은(는) 혼란에 빠졌다!");
                }
            } else if (mv.ef === "flinch") {
                defender._flinched = true;
            }
        }
    }
    if (mv.c === "status" && mv.p === 0) {
        if (mv.ef === "atk_down") { defender.statStages.atk = Math.max(-6, defender.statStages.atk - 1); bd.msg.push(dn + "의 공격이 떨어졌다!"); }
        else if (mv.ef === "atk_down2") { defender.statStages.atk = Math.max(-6, defender.statStages.atk - 2); bd.msg.push(dn + "의 공격이 크게 떨어졌다!"); }
        else if (mv.ef === "def_down") { defender.statStages.def = Math.max(-6, defender.statStages.def - 1); bd.msg.push(dn + "의 방어가 떨어졌다!"); }
        else if (mv.ef === "acc_down") { defender.statStages.acc = Math.max(-6, defender.statStages.acc - 1); bd.msg.push(dn + "의 명중률이 떨어졌다!"); }
        else if (mv.ef === "spd_down") { defender.statStages.spd = Math.max(-6, defender.statStages.spd - 1); bd.msg.push(dn + "의 스피드가 떨어졌다!"); }
        else if (mv.ef === "def_up") { attacker.statStages.def = Math.min(6, attacker.statStages.def + 1); bd.msg.push(an + "의 방어가 올라갔다!"); }
        else if (mv.ef === "spdef_up") { attacker.statStages.spdef = Math.min(6, attacker.statStages.spdef + 1); bd.msg.push(an + "의 특방이 올라갔다!"); }
        else if (mv.ef === "swordsdance") { attacker.statStages.atk = Math.min(6, attacker.statStages.atk + 2); bd.msg.push(an + "의 공격이 크게 올라갔다!"); }
        else if (mv.ef === "calmmind") { attacker.statStages.spatk = Math.min(6, attacker.statStages.spatk + 1); attacker.statStages.spdef = Math.min(6, attacker.statStages.spdef + 1); bd.msg.push(an + "의 특공과 특방이 올라갔다!"); }
        else if (mv.ef === "focusenergy") { bd.msg.push(an + "은(는) 기합을 모으고 있다!"); }
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
        poke.statusTurns--;
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
                bd.msg.push("혼란 속에 스스로를 공격했다! " + selfDmg + " 데미지!");
                return false;
            }
        }
    }
    if (poke._flinched) { poke._flinched = false; bd.msg.push(poke.nickname + "은(는) 풀이 죽어서 기술을 쓸 수 없었다!"); return false; }
    return true;
}

function doStatusDamage(poke, bd) {
    if (poke.currentHp <= 0) return;
    if (poke.status === "burn") {
        var dmg = Math.max(1, Math.floor(poke.stats[0] / 16));
        poke.currentHp = Math.max(0, poke.currentHp - dmg);
        bd.msg.push(poke.nickname + "은(는) 화상 데미지를 받았다! (-" + dmg + ")");
    }
    if (poke.status === "poison") {
        var dmg = Math.max(1, Math.floor(poke.stats[0] / 8));
        poke.currentHp = Math.max(0, poke.currentHp - dmg);
        bd.msg.push(poke.nickname + "은(는) 독 데미지를 받았다! (-" + dmg + ")");
    }
}

function executeAttack(attacker, defender, moveKey, bd) {
    var mv = MOVES[moveKey];
    if (!mv) return;
    bd.msg.push(attacker.nickname + "의 " + mv.n + "!");
    if (mv.a > 0 && mv.a < 100) {
        var accMult = getStatMult(attacker.statStages.acc) / getStatMult(defender.statStages.eva);
        if (Math.random() * 100 > mv.a * accMult) { bd.msg.push("그러나 빗나갔다!"); return; }
    }
    if (mv.c !== "status" && mv.p > 0) {
        var result = calcDamage(attacker, defender, moveKey);
        defender.currentHp = Math.max(0, defender.currentHp - result.dmg);
        var effMsg = "";
        if (result.eff >= 2) effMsg = " 효과가 굉장했다!";
        else if (result.eff > 1 && result.eff < 2) effMsg = " 효과가 좋았다!";
        else if (result.eff < 1 && result.eff > 0) effMsg = " 효과가 별로였다...";
        else if (result.eff === 0) effMsg = " 효과가 없는 것 같다...";
        var critMsg = result.crit ? " 급소에 맞았다!" : "";
        bd.msg.push(result.dmg + " 데미지!" + critMsg + effMsg);
        if (mv.ef === "drain") {
            var heal = Math.max(1, Math.floor(result.dmg / 2));
            attacker.currentHp = Math.min(attacker.stats[0], attacker.currentHp + heal);
            bd.msg.push(attacker.nickname + "은(는) " + heal + " HP를 흡수했다!");
        }
        if (mv.ef === "recoil") {
            var recoil = Math.max(1, Math.floor(result.dmg / 3));
            attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
            bd.msg.push(attacker.nickname + "은(는) 반동으로 " + recoil + " 데미지를 받았다!");
        }
        if (mv.ef === "selfdestruct") {
            attacker.currentHp = 0;
            bd.msg.push(attacker.nickname + "은(는) 쓰러졌다!");
        }
    }
    // PP 감소
    for (var i = 0; i < attacker.moves.length; i++) {
        if (attacker.moves[i].key === moveKey) { attacker.moves[i].ppLeft = Math.max(0, attacker.moves[i].ppLeft - 1); break; }
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
    bd.msg = [];
    bd.turn++;
    var mySpd = myPoke.stats[5] * getStatMult(myPoke.statStages.spd);
    var enSpd = enemy.stats[5] * getStatMult(enemy.statStages.spd);
    if (myPoke.status === "paralyze") mySpd *= 0.5;
    if (enemy.status === "paralyze") enSpd *= 0.5;
    var playerMove = MOVES[playerMoveKey];
    var enemyMoveKey = enemyChooseMove(enemy);
    var enemyMove = MOVES[enemyMoveKey];
    var pPri = (playerMove && playerMove.priority) ? playerMove.priority : 0;
    var ePri = (enemyMove && enemyMove.priority) ? enemyMove.priority : 0;
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
                bd.msg.push(bd.trainerName + "은(는) " + bd.enemy.nickname + "을(를) 내보냈다!");
                grantExp(myPoke, enemy, false);
                // 도감 등록
                if (player.pokedex) player.pokedex[bd.enemy.key] = true;
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
    // 트레이너전 경험치: 첫 대결 1.5배, 재대결 1배
    var isRematch = (bd && bd.isRematch);
    var trainerBonus = (bd && bd.type === "trainer" && !isRematch) ? 1.5 : 1;
    var exp = Math.floor((enemyData.xp * enemy.level * trainerBonus) / 7);
    if (exp < 1) exp = 1;
    myPoke.exp += exp;
    bd.msg.push(myPoke.nickname + "은(는) " + exp + " 경험치를 얻었다!");
    addLog(myPoke.nickname + "은(는) " + exp + " 경험치를 얻었다!", "exp");
    // 트레이너/관장 최종 승리 시 보상금 대기 (자동 지급 안함, 선택)
    if (isTrainerWin && bd.type === "trainer") {
        var baseReward = bd.trainerReward || 500;
        var reward = isRematch ? Math.floor(baseReward * 0.2) : baseReward;
        bd.pendingReward = reward;
        bd.msg.push("💰 상금 ₩" + reward + (isRematch ? " (재대결 20%)" : "") + "을 받을 수 있다!");
        if (bd.isGymBattle) {
            player.defeatedGyms[bd.trainerKey] = player.day;
        } else {
            player.defeatedTrainers[bd.trainerKey] = player.day;
        }
        // 체육관 뱃지 수여 (첫 승리 시만)
        if (bd.isGymBattle && bd.gymId && bd.gymRegion) {
            var badgeList = player.badges[bd.gymRegion];
            if (badgeList && badgeList.indexOf(bd.gymId) === -1) {
                badgeList.push(bd.gymId);
                bd.msg.push("🏅 " + bd.gymBadgeEm + " " + bd.gymBadge + "을(를) 획득했다!");
                addLog("🏅 " + bd.gymBadge + " 획득!", "badge");
            }
        }
    }
    while (myPoke.level < MAX_LEVEL) {
        var needed = getExpForLevel(myPoke.level + 1) - getExpForLevel(myPoke.level);
        if (myPoke.exp >= needed) {
            myPoke.exp -= needed;
            myPoke.level++;
            recalcStats(myPoke);
            myPoke.currentHp = myPoke.stats[0];
            gState.battleData.msg.push("🎉 " + myPoke.nickname + "은(는) Lv." + myPoke.level + "이(가) 되었다!");
            addLog("🎉 " + myPoke.nickname + " Lv." + myPoke.level + "!", "levelup");
            checkNewMoves(myPoke);
            checkEvolution(myPoke);
        } else break;
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
        gState.pendingEvo = {pokeIdx: findPartyIdx(poke), from: poke.key, to: data.e.to};
        if (gState.battleData) gState.battleData.msg.push("✨ 어라...? " + poke.nickname + "의 모습이...?!");
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
    poke.currentHp = poke.stats[0];
    addLog("🌟 " + oldName + "이(가) " + newData.n + "(으)로 진화했다!", "evolution");
    if (player.pokedex) player.pokedex[evo.to] = true;
    gState.pendingEvo = null;
    checkNewMoves(poke);
}

function attemptCapture(ballKey) {
    if (!gState || !gState.battleData || gState.battleData.type !== "wild") return;
    var bd = gState.battleData;
    var enemy = bd.enemy;
    var ball = ITEMS[ballKey];
    if (!ball || ball.type !== "ball") return;
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
        for (var i = 0; i < bd.msg.length; i++) addLog(bd.msg[i], "capture");
        return;
    }
    var maxHp = enemy.stats[0]; var curHp = enemy.currentHp;
    var catchRate = data.cr; var ballBonus = ball.value;
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
    if (player.pokedex) player.pokedex[poke.key] = true;
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
        bd.msg = ["트레이너전에서는 도망칠 수 없다!"];
        for (var i = 0; i < bd.msg.length; i++) addLog(bd.msg[i], "battle");
        return;
    }
    bd.msg = [];
    var myPoke = player.party[bd.myIdx];
    var mySpd = myPoke.stats[5]; var enSpd = bd.enemy.stats[5];
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

function healAllPokemon() {
    for (var i = 0; i < player.party.length; i++) {
        var p = player.party[i];
        p.currentHp = p.stats[0]; p.status = null; p.statusTurns = 0;
        p.statStages = {atk:0,def:0,spatk:0,spdef:0,spd:0,acc:0,eva:0};
        for (var j = 0; j < p.moves.length; j++) {
            var mv = MOVES[p.moves[j].key];
            p.moves[j].ppLeft = mv ? mv.pp : 10;
        }
    }
    addLog("모든 포켓몬이 회복되었다!", "heal");
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
".pk-wrap{font-family:'Segoe UI',Arial,sans-serif;color:#e0e0e0;background:#1a1a2e;border-radius:12px;padding:10px;max-width:480px;margin:0 auto;font-size:14px;line-height:1.4;box-sizing:border-box;}",
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
".pk-road-list{max-height:260px;overflow-y:auto;margin:8px 0;}",
".pk-road-item{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 12px;margin:4px 0;cursor:pointer;transition:all .15s;}",
".pk-road-item:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);}",
".pk-road-item.active{border-color:#e74c3c;background:rgba(231,76,60,0.1);}",
".pk-pokemon-display{display:flex;gap:8px;margin:8px 0;}",
".pk-poke-card{flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px;text-align:center;}",
".pk-poke-emoji{font-size:32px;margin:4px 0;}",
".pk-move-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:6px 0;}",
".pk-action-bar{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin:8px 0;}",
".pk-battle-msg{background:#000;border-radius:6px;padding:8px;margin:8px 0;max-height:120px;overflow-y:auto;font-size:12px;color:#aaa;}",
".pk-battle-msg p{margin:2px 0;} .pk-battle-msg p:first-child{color:#fff;}",
".pk-log-entry{font-size:11px;padding:2px 0;color:#888;}",
".pk-log-battle{color:#e74c3c;} .pk-log-exp{color:#f39c12;} .pk-log-levelup{color:#2ecc71;} .pk-log-learn{color:#3498db;} .pk-log-evolution{color:#9b59b6;} .pk-log-capture{color:#e67e22;} .pk-log-gold{color:#f5c518;} .pk-log-heal{color:#1abc9c;} .pk-log-item{color:#1abc9c;}",
".pk-toast{position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#2ecc71;color:#fff;padding:8px 20px;border-radius:8px;font-size:14px;z-index:9999;animation:pkToastIn .3s;}",
"@keyframes pkToastIn{from{opacity:0;top:0}to{opacity:1;top:20px}}",
".pk-gold{color:#f5c518;font-weight:bold;}",
".pk-dex-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:4px;}",
".pk-dex-item{background:rgba(255,255,255,0.05);border-radius:6px;padding:4px;text-align:center;font-size:10px;}",
".pk-dex-item.pk-dex-seen{border:1px solid rgba(39,174,96,0.4);}",
".pk-dex-item.pk-dex-unseen{opacity:0.3;}"
    ].join("\n");
    document.head.appendChild(s);
}

// ═══════════════════════════════════════════════
// 🖥️ UI 렌더링
// ═══════════════════════════════════════════════
function createUI() {
    var existing = document.getElementById(UI_ID);
    if (existing) existing.remove();
    var div = document.createElement("div");
    div.id = UI_ID;
    div.className = "pk-wrap";
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
    var html = '';
    if (!player || !gState) {
        html = renderTitleScreen();
    } else if (gState.subScreen === "starterSelect") {
        html = renderStarterSelect();
    } else if (gState.pendingEvo) {
        html = renderEvolutionScreen();
    } else if (gState.pendingMoveLearn) {
        html = renderMoveLearnScreen();
    } else if (gState.phase === "battle") {
        html = renderBattleScreen();
    } else if (gState.subScreen === "party") {
        html = renderPartyScreen();
    } else if (gState.subScreen === "pc") {
        html = renderPCScreen();
    } else if (gState.subScreen === "shop") {
        html = renderShopScreen();
    } else if (gState.subScreen === "bag") {
        html = renderBagScreen();
    } else if (gState.subScreen === "summary") {
        html = renderSummaryScreen();
    } else if (gState.subScreen === "log") {
        html = renderLogScreen();
    } else if (gState.subScreen === "pokedex") {
        html = renderPokedexScreen();
    } else if (gState.subScreen === "gyms") {
        html = renderGymScreen();
    } else if (gState.subScreen === "badges") {
        html = renderBadgeScreen();
    } else if (gState.subScreen === "roadDetail") {
        html = renderRoadDetail();
    } else if (gState.subScreen === "battlePartySwitch") {
        html = renderBattlePartySwitch();
    } else {
        html = renderOverworld();
    }
    container.innerHTML = html;
    var target = null;
    if (_hasRisu) {
        try {
            target = Risuai.getContainer();
            if (!target) target = document.getElementById('risuai-container');
        } catch(e) {}
    }
    if (!target) target = document.getElementById("poke-target") || document.body;
    target.innerHTML = '';
    target.appendChild(container);
    bindHandlers(container);
}

function renderTitleScreen() {
    var html = '<div style="text-align:center;padding:20px 0">';
    html += '<div style="font-size:28px;margin:10px 0">🎮 포켓몬 배틀</div>';
    html += '<div style="color:#aaa;font-size:12px;margin-bottom:20px">Gen 1~4 | 칸토 & 성도 & 호엔 & 신오</div>';
    html += '<div style="display:flex;flex-direction:column;gap:8px;max-width:200px;margin:0 auto">';
    html += '<button class="pk-btn pk-btn-red pk-btn-block" data-action="poke_newGame">🆕 새 게임</button>';
    html += '<button class="pk-btn pk-btn-blue pk-btn-block" data-action="poke_continue">📂 이어하기</button>';
    html += '</div></div>';
    return html;
}

function renderStarterSelect() {
    var region = gState.starterRegion || "kanto";
    var startersByRegion = {
        kanto: [{k:"bulbasaur",n:"이상해씨",t:"풀/독",em:"🌿"},{k:"charmander",n:"파이리",t:"불꽃",em:"🔥"},{k:"squirtle",n:"꼬부기",t:"물",em:"🐢"}],
        johto: [{k:"chikorita",n:"치코리타",t:"풀",em:"🍃"},{k:"cyndaquil",n:"브케인",t:"불꽃",em:"🔥"},{k:"totodile",n:"리아코",t:"물",em:"🐊"}],
        hoenn: [{k:"treecko",n:"나무지기",t:"풀",em:"🌿"},{k:"torchic",n:"아차모",t:"불꽃",em:"🔥"},{k:"mudkip",n:"물짱이",t:"물",em:"💧"}],
        sinnoh: [{k:"turtwig",n:"모부기",t:"풀",em:"🌿"},{k:"chimchar",n:"불꽃숭이",t:"불꽃",em:"🔥"},{k:"piplup",n:"팽도리",t:"물",em:"💧"}]
    };
    var starters = startersByRegion[region] || startersByRegion.kanto;
    var regionNameMap = {kanto:"칸토",johto:"성도",hoenn:"호엔",sinnoh:"신오"};
    var html = '<div style="text-align:center;padding:10px 0">';
    html += '<div style="font-size:18px;margin-bottom:4px">🎒 첫 파트너 포켓몬 선택</div>';
    html += '<div style="color:#aaa;font-size:12px;margin-bottom:12px">' + (regionNameMap[region] || "칸토") + ' 지방에서 모험 시작!</div>';
    // 지방 선택 탭
    html += '<div style="display:flex;gap:6px;justify-content:center;margin-bottom:12px;flex-wrap:wrap">';
    html += '<button class="pk-btn ' + (region==="kanto"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_setStarterRegion" data-args="kanto">🗾 칸토</button>';
    html += '<button class="pk-btn ' + (region==="johto"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_setStarterRegion" data-args="johto">🏔️ 성도</button>';
    html += '<button class="pk-btn ' + (region==="hoenn"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_setStarterRegion" data-args="hoenn">🌴 호엔</button>';
    html += '<button class="pk-btn ' + (region==="sinnoh"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_setStarterRegion" data-args="sinnoh">❄️ 신오</button>';
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
    html += '<button class="pk-btn ' + (player.region==="kanto"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_switchRegion" data-args="kanto">🗾 칸토</button>';
    html += '<button class="pk-btn ' + (player.region==="johto"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_switchRegion" data-args="johto">🏔️ 성도</button>';
    html += '<button class="pk-btn ' + (player.region==="hoenn"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_switchRegion" data-args="hoenn">🌴 호엔</button>';
    html += '<button class="pk-btn ' + (player.region==="sinnoh"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_switchRegion" data-args="sinnoh">❄️ 신오</button>';
    html += '</div>';
    // 상단 상태바
    html += '<div class="pk-card" style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px">';
    html += '<span style="font-size:13px">👤 ' + player.name + '</span>';
    html += '<span style="font-size:12px">📅 ' + player.day + '일차 ' + TIME_NAMES[player.timeOfDay] + '</span>';
    html += '<span class="pk-gold" style="font-size:13px">💰 ₩' + player.gold.toLocaleString() + '</span>';
    html += '</div>';
    // 뱃지 미니바
    var kBadges = player.badges.kanto ? player.badges.kanto.length : 0;
    var jBadges = player.badges.johto ? player.badges.johto.length : 0;
    var hBadges = player.badges.hoenn ? player.badges.hoenn.length : 0;
    var sBadges = player.badges.sinnoh ? player.badges.sinnoh.length : 0;
    html += '<div class="pk-card" style="display:flex;justify-content:space-between;align-items:center;padding:4px 10px;font-size:10px">';
    html += '<span>🏅 칸토 ' + kBadges + '/8 | 성도 ' + jBadges + '/8 | 호엔 ' + hBadges + '/8 | 신오 ' + sBadges + '/8</span>';
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
    html += '<button class="pk-btn pk-btn-dark pk-btn-xs" data-action="poke_openPC">💻 PC</button>';
    html += '<button class="pk-btn pk-btn-yellow pk-btn-xs" data-action="poke_openBag">🎒 가방</button>';
    html += '<button class="pk-btn pk-btn-green pk-btn-xs" data-action="poke_openPokedex">📖 도감</button>';
    html += '<button class="pk-btn pk-btn-red pk-btn-xs" data-action="poke_openGyms">🏟️ 체육관</button>';
    html += '<button class="pk-btn pk-btn-yellow pk-btn-xs" data-action="poke_openBadges">🏅 뱃지</button>';
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
        html += '<span style="font-weight:bold;font-size:13px">' + road.n + '</span>';
        html += ' <span style="color:#aaa;font-size:11px">Lv.' + road.lv[0] + '~' + road.lv[1] + '</span>';
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
    html += '<div class="pk-card" style="max-height:80px;overflow-y:auto">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px"><span style="font-size:11px;color:#aaa">📋 로그</span>';
    html += '<button class="pk-btn pk-btn-dark pk-btn-xs" data-action="poke_openLog">전체</button></div>';
    var logs = gState.log || [];
    for (var i = 0; i < Math.min(3, logs.length); i++) {
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
    // 도로 정보
    html += '<div class="pk-card" style="border-color:rgba(233,69,96,0.4)">';
    html += '<div style="font-size:16px;font-weight:bold;color:#f5c518">📍 ' + road.n + '</div>';
    html += '<div style="color:#aaa;font-size:12px">' + road.desc + ' | Lv.' + road.lv[0] + '~' + road.lv[1] + ' | ' + TIME_NAMES[player.timeOfDay] + '</div>';
    // 출현 포켓몬
    html += '<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:3px">';
    for (var i = 0; i < road.pokemon.length; i++) {
        var pk = POKEDEX[road.pokemon[i].k];
        if (pk) html += '<span style="font-size:10px;background:rgba(255,255,255,0.08);padding:2px 5px;border-radius:4px">' + pk.em + ' ' + pk.n + '</span>';
    }
    html += '</div></div>';
    // 탐색/배틀 버튼
    html += '<div style="display:flex;flex-direction:column;gap:6px;margin:8px 0">';
    html += '<button class="pk-btn pk-btn-green pk-btn-block" data-action="poke_explore">🌿 포켓몬 탐색</button>';
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
    html += '<button class="pk-btn pk-btn-purple pk-btn-sm" data-action="poke_openParty">👥 파티</button>';
    html += '<button class="pk-btn pk-btn-yellow pk-btn-sm" data-action="poke_openBag">🎒 가방</button>';
    html += '</div>';
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
    html += '<div class="pk-poke-emoji">' + (myData?myData.em:"?") + '</div>';
    html += '<div style="font-weight:bold">' + myPoke.nickname + ' <span style="color:#aaa;font-size:11px">Lv.' + myPoke.level + '</span></div>';
    if (myData) { for (var i = 0; i < myData.t.length; i++) html += typeSpan(myData.t[i]); }
    html += '<div style="font-size:11px;margin-top:4px">HP: ' + Math.max(0,myPoke.currentHp) + '/' + myPoke.stats[0] + '</div>';
    html += hpBar(myPoke.currentHp, myPoke.stats[0]);
    if (myPoke.status && myPoke.status !== "confuse") html += '<div style="font-size:10px;color:#e74c3c;margin-top:2px">⚠️ ' + statusName(myPoke.status) + '</div>';
    html += '</div>';
    // 적 포켓몬
    html += '<div class="pk-poke-card" style="border-left:3px solid #e74c3c">';
    html += '<div style="font-size:11px;color:#e74c3c">' + (bd.type==="trainer"?"상대":"야생") + ' 포켓몬</div>';
    html += '<div class="pk-poke-emoji">' + (enData?enData.em:"?") + '</div>';
    html += '<div style="font-weight:bold">' + enemy.nickname + ' <span style="color:#aaa;font-size:11px">Lv.' + enemy.level + '</span></div>';
    if (enData) { for (var i = 0; i < enData.t.length; i++) html += typeSpan(enData.t[i]); }
    html += '<div style="font-size:11px;margin-top:4px">HP: ' + Math.max(0,enemy.currentHp) + '/' + enemy.stats[0] + '</div>';
    html += hpBar(enemy.currentHp, enemy.stats[0]);
    if (enemy.status && enemy.status !== "confuse") html += '<div style="font-size:10px;color:#e74c3c;margin-top:2px">⚠️ ' + statusName(enemy.status) + '</div>';
    // 트레이너전 남은 포켓몬
    if (bd.type === "trainer" && bd.enemyParty) {
        html += '<div style="font-size:10px;color:#aaa;margin-top:3px">남은: ' + (bd.enemyParty.length - bd.enemyIdx) + '/' + bd.enemyParty.length + '</div>';
    }
    html += '</div></div>';
    // 배틀 메시지
    html += '<div class="pk-battle-msg">';
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
        html += '<div style="font-weight:bold">' + p.nickname + ' <span style="color:#aaa;font-size:11px">Lv.' + p.level + '</span></div>';
        html += '<div style="font-size:11px">HP: ' + p.currentHp + '/' + p.stats[0] + '</div>';
        html += hpBar(p.currentHp, p.stats[0]);
        if (p.status) html += '<span style="font-size:10px;color:#e74c3c">⚠️ ' + statusName(p.status) + '</span>';
        html += '</div></div>';
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
        if (item.type !== "ball" && item.type !== "etc" && item.type !== "battle") {
            html += '<button class="pk-btn pk-btn-green pk-btn-xs" data-action="poke_useItemSelect" data-args="' + k + '">사용</button>';
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

function renderPokedexScreen() {
    var html = '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 뒤로</button>';
    var seen = Object.keys(player.pokedex || {}).length;
    var total = Object.keys(POKEDEX).length;
    html += '<div style="font-size:15px;font-weight:bold;margin:8px 0">📖 포켓몬 도감 <span style="font-size:12px;color:#aaa">' + seen + ' / ' + total + '</span></div>';
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
        var isSeen = player.pokedex && player.pokedex[e.k];
        html += '<div class="pk-dex-item ' + (isSeen ? 'pk-dex-seen' : 'pk-dex-unseen') + '">';
        html += '<div style="font-size:18px">' + (isSeen ? e.data.em : '?') + '</div>';
        html += '<div style="font-size:9px">#' + e.data.id + '</div>';
        html += '<div style="font-size:9px">' + (isSeen ? e.data.n : '???') + '</div>';
        html += '</div>';
    }
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
                html += '<button class="pk-btn pk-btn-yellow pk-btn-sm" data-action="poke_gymBattle" data-args="' + g + ',' + l + '">🔄 재대결</button>';
            } else {
                html += '<button class="pk-btn pk-btn-red pk-btn-sm" data-action="poke_gymBattle" data-args="' + g + ',' + l + '">⚔️ 도전</button>';
            }
            html += '</div>';
        }
        html += '</div>';
    }
    return html;
}

// ── 뱃지 화면 ──
function renderBadgeScreen() {
    var html = '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 뒤로</button>';
    html += '<div style="font-size:15px;font-weight:bold;margin:8px 0">🏅 뱃지 컬렉션</div>';
    var regions = ["kanto", "johto", "hoenn", "sinnoh"];
    var regionNames = {kanto: "칸토 지방", johto: "성도 지방", hoenn: "호엔 지방", sinnoh: "신오 지방"};
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
    bd.msg = [];
    gState.subScreen = null;
    if (prev && prev.currentHp > 0) {
        bd.msg.push(prev.nickname + "을(를) 교체했다!");
        // 교체 시 적이 공격
        var emk = enemyChooseMove(bd.enemy);
        if (canAct(bd.enemy, bd)) executeAttack(bd.enemy, player.party[bd.myIdx], emk, bd);
        doStatusDamage(bd.enemy, bd);
    }
    var curPoke = player.party[bd.myIdx];
    bd.msg.push(curPoke.nickname + " 가라!");
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
    gState.phase = "overworld";
    gState.subScreen = "roadDetail";
    gState.battleData = null;
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
    gState.phase = "overworld";
    gState.subScreen = null;
    gState.battleData = null;
    await saveAll();
    render();
};

window.poke_center = async function() {
    healAllPokemon();
    showToast("모든 포켓몬이 회복되었습니다!");
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

window.poke_back = function() {
    if (gState.subScreen === "roadDetail") {
        gState.subScreen = null;
    } else if (gState.subScreen === "battlePartySwitch") {
        gState.subScreen = null;
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

window.poke_buyItem = async function(key) {
    var item = ITEMS[key];
    if (!item || player.gold < item.buy) return;
    player.gold -= item.buy;
    player.bag[key] = (player.bag[key] || 0) + 1;
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
    showToast(item.n + " 판매!");
    await saveAll();
    render();
};

window.poke_useItemSelect = async function(itemKey) {
    var item = ITEMS[itemKey];
    if (!item) return;
    for (var i = 0; i < player.party.length; i++) {
        var used = useItem(itemKey, i);
        if (used) {
            showToast(player.party[i].nickname + "에게 사용!");
            if (gState.battleData) {
                gState.subScreen = null;
                gState.battleData.msg = [player.party[i].nickname + "에게 " + item.n + "을(를) 사용했다!"];
                var bd = gState.battleData;
                var emk = enemyChooseMove(bd.enemy);
                if (canAct(bd.enemy, bd)) executeAttack(bd.enemy, player.party[bd.myIdx], emk, bd);
                doStatusDamage(bd.enemy, bd);
                for (var j = 0; j < bd.msg.length; j++) addLog(bd.msg[j], "battle");
            }
            await saveAll();
            render();
            return;
        }
    }
    showToast("사용할 수 있는 포켓몬이 없습니다!");
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
    if (poke) player.pc.push(poke);
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

window.poke_acceptReward = async function() {
    if (!gState || !gState.battleData) return;
    var bd = gState.battleData;
    if (bd.pendingReward && !bd.rewardHandled) {
        player.gold += bd.pendingReward;
        bd.msg.push("💰 ₩" + bd.pendingReward + "을 받았다!");
        addLog("💰 ₩" + bd.pendingReward + " 획득!", "gold");
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
    var loaded = await loadAll();
    if (_hasRisu) {
        try {
            Risuai.registerButton("🎮 포켓몬", async function() {
                isVisible = !isVisible;
                if (isVisible) {
                    if (!player || !gState) { await loadAll(); }
                    Risuai.showContainer('fullscreen');
                    render();
                } else {
                    Risuai.hideContainer();
                }
            });
        } catch(e) { console.error(PLUGIN, "registerButton error:", e); }
    }
    var savedVis = await lsGet(KEY_VIS);
    isVisible = savedVis !== "false";
    if (isVisible) render();
}

initPlugin();

} catch(topErr) {
    console.error("[Pokemon] Fatal error:", topErr);
}
})();
