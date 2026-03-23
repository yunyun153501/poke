//@name Pokemon Battle
//@display-name 🎮 포켓몬 배틀 (Gen 1-2)
//@api 3.0
//@version 1.0
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

// 난수 헬퍼
function rng(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rngf(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ═══════════════════════════════════════════════
// 🔥 타입 상성표
// ═══════════════════════════════════════════════
var TYPES = ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"];

// 2 = 2x, 0.5 = 0.5x, 0 = immune. 미지정은 1x
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
// 📖 포켓몬 데이터베이스 (Gen 1-2)
// ═══════════════════════════════════════════════
// s=[HP, Atk, Def, SpAtk, SpDef, Spd]
// ml={level:[moveKeys]} = 레벨별 습득기술
// e={l:level, to:key} = 진화조건
// cr=포획률, xp=기본경험치, em=이모지
var POKEDEX = {
// ── Gen 1 스타터 ──
bulbasaur:  {n:"이상해씨",id:1,t:["grass","poison"],s:[45,49,49,65,65,45],ml:{1:["tackle","growl"],7:["vinewhip"],13:["poisonpowder"],20:["razorleaf"],27:["sleeppowder"]},e:{l:16,to:"ivysaur"},cr:45,xp:64,em:"🌿"},
ivysaur:    {n:"이상해풀",id:2,t:["grass","poison"],s:[60,62,63,80,80,60],ml:{1:["tackle","growl","vinewhip"],20:["razorleaf"],27:["sleeppowder"],34:["solarbeam"]},e:{l:32,to:"venusaur"},cr:45,xp:142,em:"🌿"},
venusaur:   {n:"이상해꽃",id:3,t:["grass","poison"],s:[80,82,83,100,100,80],ml:{1:["tackle","vinewhip","razorleaf"],34:["solarbeam"],44:["sleeppowder"]},e:null,cr:45,xp:236,em:"��"},
charmander: {n:"파이리",id:4,t:["fire"],s:[39,52,43,60,50,65],ml:{1:["scratch","growl"],7:["ember"],13:["smokescreen"],22:["flamethrower"]},e:{l:16,to:"charmeleon"},cr:45,xp:62,em:"🔥"},
charmeleon: {n:"리자드",id:5,t:["fire"],s:[58,64,58,80,65,80],ml:{1:["scratch","ember"],22:["flamethrower"],34:["slash"]},e:{l:36,to:"charizard"},cr:45,xp:142,em:"🔥"},
charizard:  {n:"리자몽",id:6,t:["fire","flying"],s:[78,84,78,109,85,100],ml:{1:["scratch","ember","flamethrower"],36:["wingattack"],46:["fireblast"],55:["flareblitz"]},e:null,cr:45,xp:240,em:"🐉"},
squirtle:   {n:"꼬부기",id:7,t:["water"],s:[44,48,65,50,64,43],ml:{1:["tackle","tailwhip"],7:["watergun"],13:["bite"],22:["waterpulse"]},e:{l:16,to:"wartortle"},cr:45,xp:63,em:"🐢"},
wartortle:  {n:"어니부기",id:8,t:["water"],s:[59,63,80,65,80,58],ml:{1:["tackle","watergun","bite"],22:["waterpulse"],34:["surf"]},e:{l:36,to:"blastoise"},cr:45,xp:142,em:"🐢"},
blastoise:  {n:"거북왕",id:9,t:["water"],s:[79,83,100,85,105,78],ml:{1:["watergun","bite","surf"],42:["hydropump"],55:["icebeam"]},e:null,cr:45,xp:239,em:"🐢"},
// ── Gen 1 초반 포켓몬 ──
caterpie:   {n:"캐터피",id:10,t:["bug"],s:[45,30,35,20,20,45],ml:{1:["tackle","stringshot"]},e:{l:7,to:"metapod"},cr:255,xp:39,em:"🐛"},
metapod:    {n:"단데기",id:11,t:["bug"],s:[50,20,55,25,25,30],ml:{1:["tackle","harden"]},e:{l:10,to:"butterfree"},cr:120,xp:72,em:"🐛"},
butterfree: {n:"버터플",id:12,t:["bug","flying"],s:[60,45,50,90,80,70],ml:{1:["confusion","gust"],12:["sleeppowder"],16:["psybeam"],28:["psychic"]},e:null,cr:45,xp:178,em:"🦋"},
pidgey:     {n:"구구",id:16,t:["normal","flying"],s:[40,45,40,35,35,56],ml:{1:["tackle","gust"],9:["quickattack"],15:["wingattack"]},e:{l:18,to:"pidgeotto"},cr:255,xp:50,em:"🐦"},
pidgeotto:  {n:"피죤",id:17,t:["normal","flying"],s:[63,60,55,50,50,71],ml:{1:["tackle","gust","quickattack"],18:["wingattack"],27:["aerialace"]},e:{l:36,to:"pidgeot"},cr:120,xp:122,em:"🐦"},
pidgeot:    {n:"피죤투",id:18,t:["normal","flying"],s:[83,80,75,70,70,101],ml:{1:["wingattack","quickattack","aerialace"],44:["fly"],54:["hyperbeam"]},e:null,cr:45,xp:216,em:"🦅"},
rattata:    {n:"꼬렛",id:19,t:["normal"],s:[30,56,35,25,35,72],ml:{1:["tackle","tailwhip"],4:["quickattack"],10:["bite"]},e:{l:20,to:"raticate"},cr:255,xp:51,em:"🐭"},
raticate:   {n:"레트라",id:20,t:["normal"],s:[55,81,60,50,70,97],ml:{1:["tackle","quickattack","bite"],20:["crunch"],30:["hyperbeam"]},e:null,cr:127,xp:145,em:"🐭"},
// ── 전기 ──
pikachu:    {n:"피카츄",id:25,t:["electric"],s:[35,55,40,50,50,90],ml:{1:["thundershock","growl"],6:["tailwhip"],8:["quickattack"],15:["thunderbolt"]},e:{l:25,to:"raichu"},cr:190,xp:112,em:"⚡"},
raichu:     {n:"라이츄",id:26,t:["electric"],s:[60,90,55,90,80,110],ml:{1:["thundershock","quickattack","thunderbolt"],30:["thunder"]},e:null,cr:75,xp:218,em:"⚡"},
// ── 독/풀 ──
nidoranm:   {n:"니드런♂",id:32,t:["poison"],s:[46,57,40,40,40,50],ml:{1:["tackle","poisonsting"],8:["hornattack"],16:["bite"]},e:{l:16,to:"nidorino"},cr:235,xp:55,em:"💜"},
nidorino:   {n:"니드리노",id:33,t:["poison"],s:[61,72,57,55,55,65],ml:{1:["tackle","poisonsting","hornattack"],23:["bite"],32:["sludgebomb"]},e:{l:36,to:"nidoking"},cr:120,xp:128,em:"💜"},
nidoking:   {n:"니드킹",id:34,t:["poison","ground"],s:[81,102,77,85,75,85],ml:{1:["poisonsting","hornattack","earthquake"],36:["sludgebomb"],43:["megahorn"],50:["earthquake"]},e:null,cr:45,xp:227,em:"👑"},
// ── 불꽃 ──
vulpix:     {n:"식스테일",id:37,t:["fire"],s:[38,41,40,50,65,65],ml:{1:["tackle","ember"],12:["quickattack"],19:["flamethrower"]},e:{l:30,to:"ninetales"},cr:190,xp:60,em:"🦊"},
ninetales:  {n:"나인테일",id:38,t:["fire"],s:[73,76,75,81,100,100],ml:{1:["ember","flamethrower","quickattack"],35:["fireblast"],42:["flareblitz"]},e:null,cr:75,xp:177,em:"🦊"},
// ── 독/비행 ──
zubat:      {n:"주뱃",id:41,t:["poison","flying"],s:[40,45,35,30,40,55],ml:{1:["bite","supersonic"],8:["wingattack"],15:["confuseray"]},e:{l:22,to:"golbat"},cr:255,xp:49,em:"🦇"},
golbat:     {n:"골뱃",id:42,t:["poison","flying"],s:[75,80,70,65,75,90],ml:{1:["bite","wingattack","confuseray"],28:["crunch"],35:["aerialace"]},e:{l:42,to:"crobat"},cr:90,xp:159,em:"🦇"},
// ── 풀/독 ──
oddish:     {n:"뚜벅쵸",id:43,t:["grass","poison"],s:[45,50,55,75,65,30],ml:{1:["absorb"],5:["poisonpowder"],9:["razorleaf"],14:["sleeppowder"]},e:{l:21,to:"gloom"},cr:255,xp:64,em:"🌱"},
gloom:      {n:"냄새꼬",id:44,t:["grass","poison"],s:[60,65,70,85,75,40],ml:{1:["absorb","razorleaf","poisonpowder"],24:["gigadrain"],32:["sludgebomb"]},e:{l:36,to:"vileplume"},cr:120,xp:138,em:"🌱"},
vileplume:  {n:"라플레시아",id:45,t:["grass","poison"],s:[75,80,85,110,90,50],ml:{1:["razorleaf","gigadrain","sludgebomb"],40:["solarbeam"],48:["sleeppowder"]},e:null,cr:45,xp:221,em:"🌸"},
// ── 불꽃 ──
growlithe:  {n:"가디",id:58,t:["fire"],s:[55,70,45,70,50,60],ml:{1:["tackle","bite"],6:["ember"],14:["flamewheel"],20:["flamethrower"]},e:{l:28,to:"arcanine"},cr:190,xp:70,em:"🐕"},
arcanine:   {n:"윈디",id:59,t:["fire"],s:[90,110,80,100,80,95],ml:{1:["bite","flamethrower","flamewheel"],34:["flareblitz"],42:["fireblast"]},e:null,cr:75,xp:194,em:"🐕"},
// ── 격투 ──
machop:     {n:"알통몬",id:66,t:["fighting"],s:[70,80,50,35,35,35],ml:{1:["karatechop","growl"],7:["focusenergy"],13:["crosschop"]},e:{l:28,to:"machoke"},cr:180,xp:61,em:"💪"},
machoke:    {n:"근육몬",id:67,t:["fighting"],s:[80,100,70,50,60,45],ml:{1:["karatechop","crosschop"],28:["brickbreak"],36:["dynamicpunch"]},e:{l:40,to:"machamp"},cr:90,xp:142,em:"💪"},
machamp:    {n:"괴력몬",id:68,t:["fighting"],s:[90,130,80,65,85,55],ml:{1:["karatechop","crosschop","brickbreak"],40:["dynamicpunch"],50:["closecombat"]},e:null,cr:45,xp:227,em:"💪"},
// ── 바위/땅 ──
geodude:    {n:"꼬마돌",id:74,t:["rock","ground"],s:[40,80,100,30,30,20],ml:{1:["tackle","defensecurl"],6:["rockthrow"],11:["mudshot"]},e:{l:25,to:"graveler"},cr:255,xp:60,em:"🪨"},
graveler:   {n:"데구리",id:75,t:["rock","ground"],s:[55,95,115,45,45,35],ml:{1:["tackle","rockthrow","mudshot"],25:["rockslide"],33:["earthquake"]},e:{l:40,to:"golem"},cr:120,xp:137,em:"🪨"},
golem:      {n:"딱구리",id:76,t:["rock","ground"],s:[80,120,130,55,65,45],ml:{1:["rockthrow","rockslide","earthquake"],40:["stoneedge"],48:["explosion"]},e:null,cr:45,xp:223,em:"🪨"},
// ── 불꽃 ──
ponyta:     {n:"포니타",id:77,t:["fire"],s:[50,85,55,65,65,90],ml:{1:["tackle","ember"],8:["flamewheel"],15:["stomp"],25:["flamethrower"]},e:{l:40,to:"rapidash"},cr:190,xp:82,em:"🐴"},
rapidash:   {n:"날쌩마",id:78,t:["fire"],s:[65,100,70,80,80,105],ml:{1:["ember","flamewheel","flamethrower"],40:["flareblitz"],50:["fireblast"]},e:null,cr:60,xp:175,em:"🐴"},
// ── 전기/강철 ──
magnemite:  {n:"코일",id:81,t:["electric","steel"],s:[25,35,70,95,55,45],ml:{1:["thundershock","tackle"],11:["sonicboom"],22:["thunderbolt"]},e:{l:30,to:"magneton"},cr:190,xp:65,em:"🧲"},
magneton:   {n:"레어코일",id:82,t:["electric","steel"],s:[50,60,95,120,70,70],ml:{1:["thundershock","thunderbolt"],30:["triattack"],38:["thunder"],44:["flashcannon"]},e:null,cr:60,xp:163,em:"🧲"},
// ── 고스트/독 ──
gastly:     {n:"고오스",id:92,t:["ghost","poison"],s:[30,35,30,100,35,80],ml:{1:["lick","confuseray"],8:["nightshade"],16:["shadowball"]},e:{l:25,to:"haunter"},cr:190,xp:62,em:"👻"},
haunter:    {n:"고우스트",id:93,t:["ghost","poison"],s:[45,50,45,115,55,95],ml:{1:["lick","nightshade","shadowball"],25:["darkpulse"],33:["dreameater"]},e:{l:38,to:"gengar"},cr:90,xp:142,em:"👻"},
gengar:     {n:"팬텀",id:94,t:["ghost","poison"],s:[60,65,60,130,75,110],ml:{1:["shadowball","darkpulse","sludgebomb"],38:["dreameater"],48:["shadowball"]},e:null,cr:45,xp:225,em:"👻"},
// ── 바위 ──
onix:       {n:"롱스톤",id:95,t:["rock","ground"],s:[35,45,160,30,45,70],ml:{1:["tackle","rockthrow"],9:["bind"],15:["rockslide"],23:["earthquake"]},e:{l:36,to:"steelix"},cr:45,xp:77,em:"🐍"},
// ── 에스퍼 ──
drowzee:    {n:"슬리프",id:96,t:["psychic"],s:[60,48,45,43,90,42],ml:{1:["confusion","hypnosis"],12:["psybeam"],22:["psychic"]},e:{l:26,to:"hypno"},cr:190,xp:66,em:"💤"},
hypno:      {n:"슬리퍼",id:97,t:["psychic"],s:[85,73,70,73,115,67],ml:{1:["confusion","psybeam","psychic"],26:["hypnosis"],33:["dreameater"],40:["psychic"]},e:null,cr:75,xp:169,em:"💤"},
// ── 에스퍼 ──
abra:       {n:"캐이시",id:63,t:["psychic"],s:[25,20,15,105,55,90],ml:{1:["confusion"]},e:{l:16,to:"kadabra"},cr:200,xp:62,em:"🔮"},
kadabra:    {n:"윤겔라",id:64,t:["psychic"],s:[40,35,30,120,70,105],ml:{1:["confusion","psybeam"],16:["psychic"],21:["shadowball"]},e:{l:36,to:"alakazam"},cr:100,xp:140,em:"🔮"},
alakazam:   {n:"후딘",id:65,t:["psychic"],s:[55,50,45,135,95,120],ml:{1:["confusion","psychic","shadowball"],36:["calmmind"],42:["psychic"]},e:null,cr:50,xp:225,em:"🔮"},
// ── 물/독 ──
tentacool:  {n:"왕눈해",id:72,t:["water","poison"],s:[40,40,35,50,100,70],ml:{1:["poisonsting","watergun"],8:["acid"],18:["surf"]},e:{l:30,to:"tentacruel"},cr:190,xp:67,em:"🪼"},
tentacruel: {n:"독파리",id:73,t:["water","poison"],s:[80,70,65,80,120,100],ml:{1:["poisonsting","surf","acid"],30:["sludgebomb"],38:["hydropump"]},e:null,cr:60,xp:180,em:"🪼"},
// ── 이브이 계열 ──
eevee:      {n:"이브이",id:133,t:["normal"],s:[55,55,50,45,65,55],ml:{1:["tackle","tailwhip"],8:["quickattack"],16:["bite"]},e:null,cr:45,xp:65,em:"🦊"},
vaporeon:   {n:"샤미드",id:134,t:["water"],s:[130,65,60,110,95,65],ml:{1:["tackle","watergun"],10:["waterpulse"],20:["surf"],30:["icebeam"],40:["hydropump"]},e:null,cr:45,xp:184,em:"💧"},
jolteon:    {n:"쥬피썬더",id:135,t:["electric"],s:[65,65,60,110,95,130],ml:{1:["tackle","thundershock"],10:["quickattack"],20:["thunderbolt"],30:["thunder"],40:["thunderwave"]},e:null,cr:45,xp:184,em:"⚡"},
flareon:    {n:"부스터",id:136,t:["fire"],s:[65,130,60,95,110,65],ml:{1:["tackle","ember"],10:["bite"],20:["flamethrower"],30:["fireblast"],40:["flareblitz"]},e:null,cr:45,xp:184,em:"🔥"},
// ── 특수 ──
snorlax:    {n:"잠만보",id:143,t:["normal"],s:[160,110,65,65,110,30],ml:{1:["tackle","bodyslam"],12:["bite"],20:["rest"],30:["hyperbeam"],40:["earthquake"]},e:null,cr:25,xp:189,em:"😴"},
lapras:     {n:"라프라스",id:131,t:["water","ice"],s:[130,85,80,85,95,60],ml:{1:["watergun","icebeam"],15:["surf"],25:["icebeam"],35:["hydropump"],45:["blizzard"]},e:null,cr:45,xp:187,em:"🐋"},
magikarp:   {n:"잉어킹",id:129,t:["water"],s:[20,10,55,15,20,80],ml:{1:["splash","tackle"]},e:{l:20,to:"gyarados"},cr:255,xp:40,em:"🐟"},
gyarados:   {n:"갸라도스",id:130,t:["water","flying"],s:[95,125,79,60,100,81],ml:{1:["bite","watergun"],20:["surf"],28:["crunch"],36:["hydropump"],44:["hyperbeam"]},e:null,cr:45,xp:189,em:"🐉"},
// ── 드래곤 ──
dratini:    {n:"미뇽",id:147,t:["dragon"],s:[41,64,45,50,50,50],ml:{1:["tackle","dragonrage"],11:["thunderwave"],20:["slam"]},e:{l:30,to:"dragonair"},cr:45,xp:60,em:"🐲"},
dragonair:  {n:"신뇽",id:148,t:["dragon"],s:[61,84,65,70,70,70],ml:{1:["dragonrage","slam"],30:["dragonclaw"],38:["thunderbolt"]},e:{l:55,to:"dragonite"},cr:45,xp:147,em:"🐲"},
dragonite:  {n:"망나뇽",id:149,t:["dragon","flying"],s:[91,134,95,100,100,80],ml:{1:["dragonclaw","slam","thunderbolt"],55:["outrage"],63:["hyperbeam"],70:["fly"]},e:null,cr:45,xp:270,em:"🐲"},
// ── 전설 (Gen 1) ──
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
// ── Gen 2 일반 ──
hoothoot:   {n:"부우부",id:163,t:["normal","flying"],s:[60,30,30,36,56,50],ml:{1:["tackle","confusion"],7:["hypnosis"],16:["psybeam"]},e:{l:20,to:"noctowl"},cr:255,xp:52,em:"🦉"},
noctowl:    {n:"야부엉",id:164,t:["normal","flying"],s:[100,50,50,86,96,70],ml:{1:["confusion","psybeam","hypnosis"],25:["psychic"],33:["aerialace"]},e:null,cr:90,xp:158,em:"🦉"},
sentret:    {n:"꼬리선",id:161,t:["normal"],s:[35,46,34,35,45,20],ml:{1:["tackle","scratch"],4:["quickattack"],7:["bite"]},e:{l:15,to:"furret"},cr:255,xp:43,em:"🐿️"},
furret:     {n:"다꼬리",id:162,t:["normal"],s:[85,76,64,45,55,90],ml:{1:["tackle","quickattack","bite"],15:["slam"],24:["bodyslam"]},e:null,cr:90,xp:145,em:"🐿️"},
// ── 전기 ──
mareep:     {n:"메리프",id:179,t:["electric"],s:[55,40,40,65,45,35],ml:{1:["tackle","thundershock"],9:["thunderwave"],14:["thunderbolt"]},e:{l:15,to:"flaaffy"},cr:235,xp:56,em:"🐑"},
flaaffy:    {n:"보송송",id:180,t:["electric"],s:[70,55,55,80,60,45],ml:{1:["tackle","thundershock","thunderbolt"],18:["thunderwave"],25:["thunder"]},e:{l:30,to:"ampharos"},cr:120,xp:128,em:"🐑"},
ampharos:   {n:"전룡",id:181,t:["electric"],s:[90,75,85,115,90,55],ml:{1:["thundershock","thunderbolt","thunder"],30:["thunderwave"],38:["signalbeam"],45:["thunder"]},e:null,cr:45,xp:230,em:"⚡"},
// ── 페어리 ──
togepi:     {n:"토게피",id:175,t:["fairy"],s:[35,20,65,40,65,20],ml:{1:["tackle","charm"],5:["sweetkiss"],10:["dazzlinggleam"]},e:{l:20,to:"togetic"},cr:190,xp:44,em:"🥚"},
togetic:    {n:"토게틱",id:176,t:["fairy","flying"],s:[55,40,85,80,105,40],ml:{1:["dazzlinggleam","charm"],20:["aerialace"],28:["moonblast"]},e:null,cr:75,xp:142,em:"🧚"},
// ── 이브이 진화 (Gen 2) ──
espeon:     {n:"에브이",id:196,t:["psychic"],s:[65,65,60,130,95,110],ml:{1:["tackle","confusion"],10:["quickattack"],16:["psybeam"],23:["psychic"],30:["calmmind"],36:["shadowball"]},e:null,cr:45,xp:184,em:"🌟"},
umbreon:    {n:"블래키",id:197,t:["dark"],s:[95,65,110,60,130,65],ml:{1:["tackle","bite"],10:["quickattack"],16:["confuseray"],23:["darkpulse"],30:["moonlight"],36:["crunch"]},e:null,cr:45,xp:184,em:"��"},
// ── 악/비행 ──
murkrow:    {n:"니로우",id:198,t:["dark","flying"],s:[60,85,42,85,42,91],ml:{1:["tackle","gust"],8:["bite"],14:["wingattack"],22:["darkpulse"],28:["nightshade"]},e:null,cr:30,xp:81,em:"🐦‍⬛"},
// ── 얼음/악 ──
sneasel:    {n:"포푸니",id:215,t:["dark","ice"],s:[55,95,55,35,75,115],ml:{1:["scratch","bite"],8:["icepunch"],14:["quickattack"],22:["crunch"],28:["icebeam"]},e:null,cr:60,xp:132,em:"❄️"},
// ── 불/악 ──
houndour:   {n:"델빌",id:228,t:["dark","fire"],s:[45,60,30,80,50,65],ml:{1:["tackle","ember"],7:["bite"],13:["flamethrower"],20:["darkpulse"]},e:{l:24,to:"houndoom"},cr:120,xp:66,em:"🐕‍🦺"},
houndoom:   {n:"헬가",id:229,t:["dark","fire"],s:[75,90,50,110,80,95],ml:{1:["ember","flamethrower","darkpulse"],24:["crunch"],30:["fireblast"],38:["flareblitz"]},e:null,cr:45,xp:175,em:"🐕‍🦺"},
// ── 바위/악 ──
larvitar:   {n:"애버라스",id:246,t:["rock","ground"],s:[50,64,50,45,50,41],ml:{1:["tackle","bite"],5:["rockthrow"],10:["mudshot"]},e:{l:30,to:"pupitar"},cr:45,xp:60,em:"🪨"},
pupitar:    {n:"데기라스",id:247,t:["rock","ground"],s:[70,84,70,65,70,51],ml:{1:["tackle","bite","rockthrow"],30:["rockslide"],36:["earthquake"]},e:{l:55,to:"tyranitar"},cr:45,xp:144,em:"🪨"},
tyranitar:  {n:"마기라스",id:248,t:["rock","dark"],s:[100,134,110,95,100,61],ml:{1:["bite","rockslide","earthquake","crunch"],55:["stoneedge"],63:["hyperbeam"]},e:null,cr:45,xp:270,em:"🦖"},
// ── 전설 (Gen 2) ──
lugia:      {n:"루기아",id:249,t:["psychic","flying"],s:[106,90,130,90,154,110],ml:{1:["psychic","aerialace","icebeam","surf"],50:["calmmind"],60:["hyperbeam"]},e:null,cr:3,xp:306,em:"🌊"},
hooh:       {n:"호오",id:250,t:["fire","flying"],s:[106,130,90,110,154,90],ml:{1:["flamethrower","aerialace","earthquake","thunderbolt"],50:["fireblast"],60:["hyperbeam"]},e:null,cr:3,xp:306,em:"🌈"},
// ── 추가 Gen 2 ──
crobat:     {n:"크로뱃",id:169,t:["poison","flying"],s:[85,90,80,70,80,130],ml:{1:["bite","wingattack","crunch","aerialace"],42:["crosspoison"],50:["fly"]},e:null,cr:90,xp:204,em:"🦇"},
steelix:    {n:"강철톤",id:208,t:["steel","ground"],s:[75,85,200,55,65,30],ml:{1:["tackle","rockthrow","earthquake"],36:["irontail"],42:["stoneedge"],50:["flashcannon"]},e:null,cr:25,xp:179,em:"⛓️"}
};

// ═══════════════════════════════════════════════
// ⚔️ 기술 데이터베이스
// ═══════════════════════════════════════════════
// c: physical/special/status, p:위력, a:명중률, pp:PP, ef:효과, ec:효과확률
var MOVES = {
// ── 노말 ──
tackle:      {n:"몸통박치기",t:"normal",c:"physical",p:40,a:100,pp:35},
scratch:     {n:"할퀴기",t:"normal",c:"physical",p:40,a:100,pp:35},
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
// ── 불꽃 ──
ember:       {n:"불꽃세례",t:"fire",c:"special",p:40,a:100,pp:25,ef:"burn",ec:10},
flamewheel:  {n:"화염바퀴",t:"fire",c:"physical",p:60,a:100,pp:25,ef:"burn",ec:10},
flamethrower:{n:"화염방사",t:"fire",c:"special",p:90,a:100,pp:15,ef:"burn",ec:10},
fireblast:   {n:"대문자",t:"fire",c:"special",p:110,a:85,pp:5,ef:"burn",ec:30},
flareblitz:  {n:"플레어드라이브",t:"fire",c:"physical",p:120,a:100,pp:15,ef:"recoil"},
eruption:    {n:"분화",t:"fire",c:"special",p:150,a:100,pp:5},
// ── 물 ──
watergun:    {n:"물대포",t:"water",c:"special",p:40,a:100,pp:25},
waterpulse:  {n:"물의파동",t:"water",c:"special",p:60,a:100,pp:20,ef:"confuse",ec:20},
surf:        {n:"파도타기",t:"water",c:"special",p:90,a:100,pp:15},
hydropump:   {n:"하이드로펌프",t:"water",c:"special",p:110,a:80,pp:5},
waterfall:   {n:"폭포오르기",t:"water",c:"physical",p:80,a:100,pp:15,ef:"flinch",ec:20},
// ── 전기 ──
thundershock:{n:"전기쇼크",t:"electric",c:"special",p:40,a:100,pp:30,ef:"paralyze",ec:10},
thunderbolt: {n:"10만볼트",t:"electric",c:"special",p:90,a:100,pp:15,ef:"paralyze",ec:10},
thunder:     {n:"번개",t:"electric",c:"special",p:110,a:70,pp:10,ef:"paralyze",ec:30},
thunderwave: {n:"전기자석파",t:"electric",c:"status",p:0,a:90,pp:20,ef:"paralyze",ec:100},
sonicboom:   {n:"소닉붐",t:"normal",c:"special",p:20,a:90,pp:20},
// ── 풀 ──
absorb:      {n:"흡수",t:"grass",c:"special",p:20,a:100,pp:25,ef:"drain"},
vinewhip:    {n:"덩굴채찍",t:"grass",c:"physical",p:45,a:100,pp:25},
razorleaf:   {n:"잎날가르기",t:"grass",c:"physical",p:55,a:95,pp:25,ef:"highcrit"},
gigadrain:   {n:"기가드레인",t:"grass",c:"special",p:75,a:100,pp:10,ef:"drain"},
solarbeam:   {n:"솔라빔",t:"grass",c:"special",p:120,a:100,pp:10},
// ── 얼음 ──
icebeam:     {n:"냉동빔",t:"ice",c:"special",p:90,a:100,pp:10,ef:"freeze",ec:10},
blizzard:    {n:"눈보라",t:"ice",c:"special",p:110,a:70,pp:5,ef:"freeze",ec:10},
icepunch:    {n:"냉동펀치",t:"ice",c:"physical",p:75,a:100,pp:15,ef:"freeze",ec:10},
// ── 격투 ──
karatechop:  {n:"태권당수",t:"fighting",c:"physical",p:50,a:100,pp:25,ef:"highcrit"},
crosschop:   {n:"크로스촙",t:"fighting",c:"physical",p:100,a:80,pp:5,ef:"highcrit"},
brickbreak:  {n:"깨트리기",t:"fighting",c:"physical",p:75,a:100,pp:15},
dynamicpunch:{n:"폭발펀치",t:"fighting",c:"physical",p:100,a:50,pp:5,ef:"confuse",ec:100},
closecombat: {n:"인파이팅",t:"fighting",c:"physical",p:120,a:100,pp:5},
focusenergy: {n:"기합모으기",t:"normal",c:"status",p:0,a:100,pp:30,ef:"focusenergy"},
// ── 독 ──
poisonsting: {n:"독침",t:"poison",c:"physical",p:15,a:100,pp:35,ef:"poison",ec:30},
acid:        {n:"용해액",t:"poison",c:"special",p:40,a:100,pp:30},
sludgebomb:  {n:"오물폭탄",t:"poison",c:"special",p:90,a:100,pp:10,ef:"poison",ec:30},
crosspoison: {n:"크로스포이즌",t:"poison",c:"physical",p:70,a:100,pp:20,ef:"poison",ec:10},
poisonpowder:{n:"독가루",t:"poison",c:"status",p:0,a:75,pp:35,ef:"poison",ec:100},
// ── 땅 ──
mudshot:     {n:"머드숏",t:"ground",c:"special",p:55,a:95,pp:15},
dig:         {n:"구멍파기",t:"ground",c:"physical",p:80,a:100,pp:10},
earthquake:  {n:"지진",t:"ground",c:"physical",p:100,a:100,pp:10},
// ── 비행 ──
gust:        {n:"바람일으키기",t:"flying",c:"special",p:40,a:100,pp:35},
wingattack:  {n:"날개치기",t:"flying",c:"physical",p:60,a:100,pp:35},
aerialace:   {n:"제비반환",t:"flying",c:"physical",p:60,a:0,pp:20},
fly:         {n:"공중날기",t:"flying",c:"physical",p:90,a:95,pp:15},
// ── 에스퍼 ──
confusion:   {n:"염동력",t:"psychic",c:"special",p:50,a:100,pp:25,ef:"confuse",ec:10},
psybeam:     {n:"사이코빔",t:"psychic",c:"special",p:65,a:100,pp:20,ef:"confuse",ec:10},
psychic:     {n:"사이코키네시스",t:"psychic",c:"special",p:90,a:100,pp:10},
calmmind:    {n:"명상",t:"psychic",c:"status",p:0,a:100,pp:20,ef:"calmmind"},
hypnosis:    {n:"최면술",t:"psychic",c:"status",p:0,a:60,pp:20,ef:"sleep",ec:100},
dreameater:  {n:"꿈먹기",t:"psychic",c:"special",p:100,a:100,pp:15,ef:"drain"},
// ── 벌레 ──
stringshot:  {n:"실뿜기",t:"bug",c:"status",p:0,a:95,pp:40,ef:"spd_down"},
bugbite:     {n:"벌레먹기",t:"bug",c:"physical",p:60,a:100,pp:20},
signalbeam:  {n:"시그널빔",t:"bug",c:"special",p:75,a:100,pp:15,ef:"confuse",ec:10},
megahorn:    {n:"메가혼",t:"bug",c:"physical",p:120,a:85,pp:10},
// ── 바위 ──
rockthrow:   {n:"돌던지기",t:"rock",c:"physical",p:50,a:90,pp:15},
rockslide:   {n:"락슬라이드",t:"rock",c:"physical",p:75,a:90,pp:10,ef:"flinch",ec:30},
stoneedge:   {n:"스톤에지",t:"rock",c:"physical",p:100,a:80,pp:5,ef:"highcrit"},
// ── 고스트 ──
lick:        {n:"핥기",t:"ghost",c:"physical",p:30,a:100,pp:30,ef:"paralyze",ec:30},
nightshade:  {n:"나이트헤드",t:"ghost",c:"special",p:50,a:100,pp:15},
shadowball:  {n:"섀도볼",t:"ghost",c:"special",p:80,a:100,pp:15},
confuseray:  {n:"도깨비불",t:"ghost",c:"status",p:0,a:100,pp:10,ef:"confuse",ec:100},
// ── 드래곤 ──
dragonrage:  {n:"용의분노",t:"dragon",c:"special",p:40,a:100,pp:10},
dragonclaw:  {n:"드래곤클로",t:"dragon",c:"physical",p:80,a:100,pp:15},
outrage:     {n:"역린",t:"dragon",c:"physical",p:120,a:100,pp:10},
// ── 악 ──
bite:        {n:"물기",t:"dark",c:"physical",p:60,a:100,pp:25,ef:"flinch",ec:30},
crunch:      {n:"깨물어부수기",t:"dark",c:"physical",p:80,a:100,pp:15},
darkpulse:   {n:"악의파동",t:"dark",c:"special",p:80,a:100,pp:15,ef:"flinch",ec:20},
// ── 강철 ──
irontail:    {n:"아이언테일",t:"steel",c:"physical",p:100,a:75,pp:15},
steelwing:   {n:"강철날개",t:"steel",c:"physical",p:70,a:90,pp:25},
metalclaw:   {n:"메탈클로",t:"steel",c:"physical",p:50,a:95,pp:35},
flashcannon: {n:"러스터캐논",t:"steel",c:"special",p:80,a:100,pp:10},
// ── 페어리 ──
moonblast:   {n:"문블라스트",t:"fairy",c:"special",p:95,a:100,pp:15},
dazzlinggleam:{n:"매지컬샤인",t:"fairy",c:"special",p:80,a:100,pp:10},
charm:       {n:"애교부리기",t:"fairy",c:"status",p:0,a:100,pp:20,ef:"atk_down2"},
sweetkiss:   {n:"천사의키스",t:"fairy",c:"status",p:0,a:75,pp:10,ef:"confuse",ec:100},
// ── 상태기 ──
growl:       {n:"울음소리",t:"normal",c:"status",p:0,a:100,pp:40,ef:"atk_down"},
tailwhip:    {n:"꼬리흔들기",t:"normal",c:"status",p:0,a:100,pp:30,ef:"def_down"},
smokescreen: {n:"연막",t:"normal",c:"status",p:0,a:100,pp:20,ef:"acc_down"},
sleeppowder: {n:"수면가루",t:"grass",c:"status",p:0,a:75,pp:15,ef:"sleep",ec:100},
supersonic:  {n:"초음파",t:"normal",c:"status",p:0,a:55,pp:20,ef:"confuse",ec:100},
toxic:       {n:"맹독",t:"poison",c:"status",p:0,a:90,pp:10,ef:"poison",ec:100},
swordsdance: {n:"칼춤",t:"normal",c:"status",p:0,a:100,pp:20,ef:"swordsdance"},
harden:      {n:"단단해지기",t:"normal",c:"status",p:0,a:100,pp:30,ef:"def_up"},
defensecurl: {n:"웅크리기",t:"normal",c:"status",p:0,a:100,pp:40,ef:"def_up"},
moonlight:   {n:"달의빛",t:"fairy",c:"status",p:0,a:100,pp:5,ef:"heal"},
hornattack:  {n:"뿔찌르기",t:"normal",c:"physical",p:65,a:100,pp:25}
};

// ═══════════════════════════════════════════════
// 🗺️ 루트 데이터 (칸토 + 성도)
// ═══════════════════════════════════════════════
var ROUTES = {
kanto: [
    {id:"k1",n:"1번도로",sub:"태초마을 근처",lv:[2,5],pokemon:[{k:"pidgey",w:40},{k:"rattata",w:40},{k:"caterpie",w:20}],hasCenter:true,hasShop:true},
    {id:"k2",n:"상록숲",sub:"벌레잡이의 숲",lv:[3,8],pokemon:[{k:"caterpie",w:30},{k:"oddish",w:30},{k:"pidgey",w:25},{k:"pikachu",w:15}],hasCenter:false,hasShop:false},
    {id:"k3",n:"니비시티",sub:"바위 체육관의 도시",lv:[6,12],pokemon:[{k:"geodude",w:35},{k:"zubat",w:30},{k:"machop",w:20},{k:"onix",w:15}],hasCenter:true,hasShop:true},
    {id:"k4",n:"달맞이산",sub:"어둡고 깊은 동굴",lv:[8,15],pokemon:[{k:"zubat",w:35},{k:"geodude",w:25},{k:"magnemite",w:20},{k:"nidoranm",w:20}],hasCenter:false,hasShop:false},
    {id:"k5",n:"블루시티",sub:"바다가 보이는 항구 도시",lv:[12,20],pokemon:[{k:"tentacool",w:30},{k:"growlithe",w:25},{k:"vulpix",w:20},{k:"drowzee",w:15},{k:"abra",w:10}],hasCenter:true,hasShop:true},
    {id:"k6",n:"무인발전소",sub:"전기 포켓몬의 서식지",lv:[18,28],pokemon:[{k:"magnemite",w:35},{k:"pikachu",w:25},{k:"ponyta",w:20},{k:"machop",w:20}],hasCenter:false,hasShop:false},
    {id:"k7",n:"사파리존",sub:"다양한 포켓몬의 낙원",lv:[22,32],pokemon:[{k:"eevee",w:15},{k:"snorlax",w:5},{k:"lapras",w:10},{k:"ponyta",w:20},{k:"oddish",w:25},{k:"nidoranm",w:25}],hasCenter:true,hasShop:true},
    {id:"k8",n:"챔피언로드",sub:"강력한 포켓몬의 터전",lv:[30,42],pokemon:[{k:"machoke",w:25},{k:"graveler",w:25},{k:"golbat",w:20},{k:"onix",w:15},{k:"haunter",w:15}],hasCenter:false,hasShop:false},
    {id:"k9",n:"쌍둥이섬",sub:"전설이 잠든 동굴",lv:[35,50],pokemon:[{k:"dratini",w:15},{k:"gastly",w:20},{k:"haunter",w:20},{k:"dragonair",w:10},{k:"gengar",w:10},{k:"lapras",w:15},{k:"magikarp",w:10}],hasCenter:true,hasShop:true},
    {id:"k10",n:"포켓몬 저택 (전설)",sub:"전설의 포켓몬이 나타나는 곳",lv:[50,70],pokemon:[{k:"dragonair",w:20},{k:"dragonite",w:10},{k:"gengar",w:15},{k:"alakazam",w:15},{k:"mewtwo",w:3},{k:"mew",w:2},{k:"gyarados",w:20},{k:"snorlax",w:15}],hasCenter:true,hasShop:true}
],
johto: [
    {id:"j1",n:"29번도로",sub:"연두마을 근처",lv:[2,5],pokemon:[{k:"sentret",w:40},{k:"hoothoot",w:35},{k:"pidgey",w:25}],hasCenter:true,hasShop:true},
    {id:"j2",n:"도라지시티",sub:"보라빛 도시",lv:[5,12],pokemon:[{k:"mareep",w:30},{k:"zubat",w:25},{k:"geodude",w:25},{k:"houndour",w:20}],hasCenter:true,hasShop:true},
    {id:"j3",n:"너도밤나무숲",sub:"자연의 힘이 가득한 숲",lv:[10,18],pokemon:[{k:"oddish",w:25},{k:"togepi",w:15},{k:"butterfree",w:20},{k:"caterpie",w:20},{k:"hoothoot",w:20}],hasCenter:false,hasShop:false},
    {id:"j4",n:"금빛시티",sub:"빛나는 대도시",lv:[15,25],pokemon:[{k:"murkrow",w:25},{k:"sneasel",w:20},{k:"houndour",w:25},{k:"machop",w:15},{k:"growlithe",w:15}],hasCenter:true,hasShop:true},
    {id:"j5",n:"분노의 호수",sub:"갸라도스의 전설이 서린 호수",lv:[20,30],pokemon:[{k:"magikarp",w:30},{k:"tentacool",w:20},{k:"golbat",w:15},{k:"gyarados",w:5},{k:"sneasel",w:15},{k:"murkrow",w:15}],hasCenter:false,hasShop:false},
    {id:"j6",n:"담청시티",sub:"약의 도시",lv:[25,35],pokemon:[{k:"mareep",w:15},{k:"flaaffy",w:20},{k:"ponyta",w:20},{k:"machoke",w:15},{k:"houndoom",w:15},{k:"sneasel",w:15}],hasCenter:true,hasShop:true},
    {id:"j7",n:"은빛산",sub:"성도에서 가장 높은 산",lv:[30,45],pokemon:[{k:"larvitar",w:15},{k:"pupitar",w:10},{k:"golbat",w:20},{k:"graveler",w:20},{k:"sneasel",w:20},{k:"crobat",w:15}],hasCenter:false,hasShop:false},
    {id:"j8",n:"소용돌이섬 (전설)",sub:"전설의 포켓몬이 잠든 곳",lv:[40,65],pokemon:[{k:"tyranitar",w:5},{k:"ampharos",w:10},{k:"houndoom",w:15},{k:"crobat",w:15},{k:"steelix",w:10},{k:"lugia",w:2},{k:"hooh",w:2},{k:"dragonite",w:10},{k:"gyarados",w:15},{k:"togetic",w:16}],hasCenter:true,hasShop:true}
]
};

// ═══════════════════════════════════════════════
// 🎒 아이템 데이터
// ═══════════════════════════════════════════════
var ITEMS = {
potion:      {n:"상처약",desc:"HP 20 회복",type:"heal",value:20,buy:200,sell:100},
superpotion: {n:"좋은상처약",desc:"HP 60 회복",type:"heal",value:60,buy:700,sell:350},
hyperpotion: {n:"고급상처약",desc:"HP 120 회복",type:"heal",value:120,buy:1500,sell:750},
fullrestore: {n:"회복약",desc:"HP 전부 + 상태이상 회복",type:"fullheal",value:999,buy:3000,sell:1500},
revive:      {n:"기력의조각",desc:"기절 포켓몬 HP 절반 회복",type:"revive",value:0.5,buy:2000,sell:1000},
antidote:    {n:"해독제",desc:"독 상태 회복",type:"cure",value:"poison",buy:100,sell:50},
paralyzeheal:{n:"마비치료제",desc:"마비 상태 회복",type:"cure",value:"paralyze",buy:200,sell:100},
awakening:   {n:"잠깨는약",desc:"잠듦 상태 회복",type:"cure",value:"sleep",buy:200,sell:100},
pokeball:    {n:"몬스터볼",desc:"야생 포켓몬 포획 (1x)",type:"ball",value:1,buy:200,sell:100},
superball:   {n:"슈퍼볼",desc:"야생 포켓몬 포획 (1.5x)",type:"ball",value:1.5,buy:600,sell:300},
ultraball:   {n:"하이퍼볼",desc:"야생 포켓몬 포획 (2x)",type:"ball",value:2,buy:1200,sell:600},
masterball:  {n:"마스터볼",desc:"100% 포획",type:"ball",value:255,buy:99999,sell:1}
};

// ═══════════════════════════════════════════════
// 🎮 게임 상태 & 유틸
// ═══════════════════════════════════════════════
var player = null;   // {name, party[], pc[], bag{}, gold, region, routeIdx, badges}
var gState = null;   // {phase, battleData, pendingEvo, pendingMoveLearn, eventLog[], log[]}
var isVisible = true;
var _eventLog = [];

function createNewPlayer(name, starterKey) {
    var starter = createPokemonInstance(starterKey, 5);
    return {
        name: name || "레드",
        party: [starter],
        pc: [],
        bag: {pokeball:10, potion:5},
        gold: 3000,
        region: "kanto",
        routeIdx: 0,
        badges: 0
    };
}

function createPokemonInstance(key, level) {
    var data = POKEDEX[key];
    if (!data) return null;
    level = clamp(level || 5, 1, MAX_LEVEL);
    // 개체값 (IV) 0-15
    var iv = [];
    for (var i = 0; i < 6; i++) iv.push(rng(0,15));
    // 실제 스탯 계산
    var stats = calcStats(data.s, level, iv);
    // 레벨에 맞는 기술 결정
    var moves = getMovesAtLevel(data.ml, level);
    return {
        key: key,
        nickname: data.n,
        level: level,
        exp: 0,
        iv: iv,
        stats: stats,
        currentHp: stats[0],
        moves: moves,  // [{key, ppLeft}]
        status: null,   // null, "burn","poison","paralyze","sleep","freeze","confuse"
        statusTurns: 0,
        statStages: {atk:0,def:0,spatk:0,spdef:0,spd:0,acc:0,eva:0}
    };
}

function calcStats(base, level, iv) {
    // HP = ((2*Base+IV)*Level/100) + Level + 10
    // Other = ((2*Base+IV)*Level/100) + 5
    var hp = Math.floor(((2*base[0]+iv[0])*level/100)) + level + 10;
    var stats = [hp];
    for (var i = 1; i < 6; i++) {
        stats.push(Math.floor(((2*base[i]+iv[i])*level/100)) + 5);
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
                // 중복 방지
                var exists = false;
                for (var k = 0; k < pool.length; k++) {
                    if (pool[k] === moves[j]) { exists = true; break; }
                }
                if (!exists) pool.push(moves[j]);
            }
        }
    }
    // 최대 4개, 최근 배운 것 우선
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
    // HP 비례 유지
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
            return true;
        }
    } catch(e) { console.error(PLUGIN, "load fail:", e); }
    return false;
}

// ═══════════════════════════════════════════════
// 📝 로그
// ═══════════════════════════════════════════════
function addLog(msg, type) {
    type = type || "info";
    if (!gState) return;
    gState.log = gState.log || [];
    gState.log.unshift({msg:msg, type:type, t:Date.now()});
    if (gState.log.length > 40) gState.log.pop();
    _eventLog.push({msg:msg, type:type});
}

// ═══════════════════════════════════════════════
// ⚔️ 배틀 시스템
// ═══════════════════════════════════════════════
function startWildBattle() {
    if (!player || !gState) return;
    var routes = ROUTES[player.region];
    var route = routes[player.routeIdx];
    if (!route) return;
    // 야생 포켓몬 선택 (가중 랜덤)
    var totalW = 0;
    for (var i = 0; i < route.pokemon.length; i++) totalW += route.pokemon[i].w;
    var r = Math.random() * totalW;
    var cumW = 0;
    var chosen = route.pokemon[0].k;
    for (var i = 0; i < route.pokemon.length; i++) {
        cumW += route.pokemon[i].w;
        if (r < cumW) { chosen = route.pokemon[i].k; break; }
    }
    var lv = rng(route.lv[0], route.lv[1]);
    var wildPoke = createPokemonInstance(chosen, lv);
    if (!wildPoke) return;
    // 첫 살아있는 파티 포켓몬
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
}

function calcDamage(attacker, defender, moveKey, attackerPoke, defenderPoke) {
    var move = MOVES[moveKey];
    if (!move || move.c === "status" || move.p === 0) return 0;
    var atkData = POKEDEX[attackerPoke.key];
    var defData = POKEDEX[defenderPoke.key];
    if (!atkData || !defData) return 1;
    var level = attackerPoke.level;
    // 물리/특수 분기
    var atkStat, defStat;
    if (move.c === "physical") {
        atkStat = attackerPoke.stats[1] * getStatMult(attackerPoke.statStages.atk);
        defStat = defenderPoke.stats[2] * getStatMult(defenderPoke.statStages.def);
        // 화상 시 물리 공격력 반감
        if (attackerPoke.status === "burn") atkStat *= 0.5;
    } else {
        atkStat = attackerPoke.stats[3] * getStatMult(attackerPoke.statStages.spatk);
        defStat = defenderPoke.stats[4] * getStatMult(defenderPoke.statStages.spdef);
    }
    // 데미지 공식
    var baseDmg = ((2 * level / 5 + 2) * move.p * (atkStat / defStat)) / 50 + 2;
    // STAB
    var stab = 1;
    for (var i = 0; i < atkData.t.length; i++) {
        if (atkData.t[i] === move.t) { stab = 1.5; break; }
    }
    // 타입 상성
    var eff = getTypeEffect(move.t, defData.t);
    // 급소 (1/16, highcrit이면 1/4)
    var critChance = (move.ef === "highcrit") ? 0.25 : 0.0625;
    var crit = (Math.random() < critChance) ? 1.5 : 1;
    // 랜덤 (0.85~1.0)
    var rand = rngf(0.85, 1.0);
    var dmg = Math.max(1, Math.floor(baseDmg * stab * eff * crit * rand));
    return {dmg: dmg, eff: eff, crit: crit > 1};
}

function applyMoveEffects(move, attacker, defender, bd) {
    var mv = MOVES[move];
    if (!mv) return;
    var an = attacker.nickname;
    var dn = defender.nickname;
    // 상태이상 기술
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
    // 순수 상태기
    if (mv.c === "status" && mv.p === 0) {
        if (mv.ef === "atk_down") {
            defender.statStages.atk = Math.max(-6, defender.statStages.atk - 1);
            bd.msg.push(dn + "의 공격이 떨어졌다!");
        } else if (mv.ef === "atk_down2") {
            defender.statStages.atk = Math.max(-6, defender.statStages.atk - 2);
            bd.msg.push(dn + "의 공격이 크게 떨어졌다!");
        } else if (mv.ef === "def_down") {
            defender.statStages.def = Math.max(-6, defender.statStages.def - 1);
            bd.msg.push(dn + "의 방어가 떨어졌다!");
        } else if (mv.ef === "acc_down") {
            defender.statStages.acc = Math.max(-6, defender.statStages.acc - 1);
            bd.msg.push(dn + "의 명중률이 떨어졌다!");
        } else if (mv.ef === "spd_down") {
            defender.statStages.spd = Math.max(-6, defender.statStages.spd - 1);
            bd.msg.push(dn + "의 스피드가 떨어졌다!");
        } else if (mv.ef === "def_up") {
            attacker.statStages.def = Math.min(6, attacker.statStages.def + 1);
            bd.msg.push(an + "의 방어가 올라갔다!");
        } else if (mv.ef === "swordsdance") {
            attacker.statStages.atk = Math.min(6, attacker.statStages.atk + 2);
            bd.msg.push(an + "의 공격이 크게 올라갔다!");
        } else if (mv.ef === "calmmind") {
            attacker.statStages.spatk = Math.min(6, attacker.statStages.spatk + 1);
            attacker.statStages.spdef = Math.min(6, attacker.statStages.spdef + 1);
            bd.msg.push(an + "의 특공과 특방이 올라갔다!");
        } else if (mv.ef === "focusenergy") {
            bd.msg.push(an + "은(는) 기합을 모으고 있다!");
        } else if (mv.ef === "heal" || mv.ef === "rest") {
            var healAmt = Math.floor(attacker.stats[0] / 2);
            if (mv.ef === "rest") { healAmt = attacker.stats[0]; attacker.status = "sleep"; attacker.statusTurns = 2; }
            attacker.currentHp = Math.min(attacker.stats[0], attacker.currentHp + healAmt);
            bd.msg.push(an + "의 HP가 회복되었다!");
        }
    }
    // 드레인
    if (mv.ef === "drain" && mv.p > 0) {
        // 데미지의 50% 회복은 턴 처리에서 함
    }
    // 반동
    if (mv.ef === "recoil") {
        // 반동 데미지는 턴 처리에서
    }
}

function canAct(poke, bd) {
    if (poke.currentHp <= 0) return false;
    if (poke.status === "sleep") {
        poke.statusTurns--;
        if (poke.statusTurns <= 0) {
            poke.status = null;
            bd.msg.push(poke.nickname + "은(는) 눈을 떴다!");
            return true;
        }
        bd.msg.push(poke.nickname + "은(는) 깊이 잠들어 있다...");
        return false;
    }
    if (poke.status === "freeze") {
        if (Math.random() < 0.2) {
            poke.status = null;
            bd.msg.push(poke.nickname + "의 얼음이 풀렸다!");
            return true;
        }
        bd.msg.push(poke.nickname + "은(는) 얼어서 움직일 수 없다!");
        return false;
    }
    if (poke.status === "paralyze") {
        if (Math.random() < 0.25) {
            bd.msg.push(poke.nickname + "은(는) 마비되어 움직일 수 없다!");
            return false;
        }
    }
    if (poke.status === "confuse") {
        poke.statusTurns--;
        if (poke.statusTurns <= 0) {
            poke.status = null;
            bd.msg.push(poke.nickname + "의 혼란이 풀렸다!");
        } else {
            bd.msg.push(poke.nickname + "은(는) 혼란 중이다!");
            if (Math.random() < 0.33) {
                var selfDmg = Math.max(1, Math.floor(poke.stats[1] * 0.1));
                poke.currentHp = Math.max(0, poke.currentHp - selfDmg);
                bd.msg.push("혼란 속에 스스로를 공격했다! " + selfDmg + " 데미지!");
                return false;
            }
        }
    }
    if (poke._flinched) {
        poke._flinched = false;
        bd.msg.push(poke.nickname + "은(는) 풀이 죽어서 기술을 쓸 수 없었다!");
        return false;
    }
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
    // 명중 판정
    if (mv.a > 0 && mv.a < 100) {
        var accMult = getStatMult(attacker.statStages.acc) / getStatMult(defender.statStages.eva);
        if (Math.random() * 100 > mv.a * accMult) {
            bd.msg.push("그러나 빗나갔다!");
            return;
        }
    }
    // aerialace는 필중
    if (mv.a === 0 && moveKey === "aerialace") { /* always hit */ }
    // 데미지 계산
    if (mv.c !== "status" && mv.p > 0) {
        var result = calcDamage(attacker, defender, moveKey, attacker, defender);
        defender.currentHp = Math.max(0, defender.currentHp - result.dmg);
        var effMsg = "";
        if (result.eff >= 2) effMsg = " 효과가 굉장했다!";
        else if (result.eff > 1 && result.eff < 2) effMsg = " 효과가 좋았다!";
        else if (result.eff < 1 && result.eff > 0) effMsg = " 효과가 별로였다...";
        else if (result.eff === 0) effMsg = " 효과가 없는 것 같다...";
        var critMsg = result.crit ? " 급소에 맞았다!" : "";
        bd.msg.push(result.dmg + " 데미지!" + critMsg + effMsg);
        // 드레인
        if (mv.ef === "drain") {
            var heal = Math.max(1, Math.floor(result.dmg / 2));
            attacker.currentHp = Math.min(attacker.stats[0], attacker.currentHp + heal);
            bd.msg.push(attacker.nickname + "은(는) " + heal + " HP를 흡수했다!");
        }
        // 반동
        if (mv.ef === "recoil") {
            var recoil = Math.max(1, Math.floor(result.dmg / 3));
            attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
            bd.msg.push(attacker.nickname + "은(는) 반동으로 " + recoil + " 데미지를 받았다!");
        }
        // 자폭
        if (mv.ef === "selfdestruct") {
            attacker.currentHp = 0;
            bd.msg.push(attacker.nickname + "은(는) 쓰러졌다!");
        }
    }
    // PP 감소
    for (var i = 0; i < attacker.moves.length; i++) {
        if (attacker.moves[i].key === moveKey) {
            attacker.moves[i].ppLeft = Math.max(0, attacker.moves[i].ppLeft - 1);
            break;
        }
    }
    // 효과 적용
    applyMoveEffects(moveKey, attacker, defender, bd);
}

function enemyChooseMove(enemy) {
    // 간단한 AI: 데미지가 가장 높을 것 같은 기술 선택, PP 있는 것만
    var bestMove = null;
    var bestScore = -1;
    for (var i = 0; i < enemy.moves.length; i++) {
        if (enemy.moves[i].ppLeft <= 0) continue;
        var mv = MOVES[enemy.moves[i].key];
        if (!mv) continue;
        var score = mv.p || 0;
        if (mv.c === "status") score = 20; // 상태기는 낮은 점수
        if (Math.random() < 0.3) score += 30; // 약간의 랜덤
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
    // 속도에 따른 선공 결정
    var mySpd = myPoke.stats[5] * getStatMult(myPoke.statStages.spd);
    var enSpd = enemy.stats[5] * getStatMult(enemy.statStages.spd);
    if (myPoke.status === "paralyze") mySpd *= 0.5;
    if (enemy.status === "paralyze") enSpd *= 0.5;
    var playerMove = MOVES[playerMoveKey];
    var enemyMoveKey = enemyChooseMove(enemy);
    var enemyMove = MOVES[enemyMoveKey];
    // 우선도 체크
    var pPri = (playerMove && playerMove.priority) ? playerMove.priority : 0;
    var ePri = (enemyMove && enemyMove.priority) ? enemyMove.priority : 0;
    var playerFirst = (pPri > ePri) || (pPri === ePri && mySpd >= enSpd);
    if (pPri === ePri && mySpd === enSpd) playerFirst = Math.random() < 0.5;
    var first, second, firstMove, secondMove, firstIsPlayer;
    if (playerFirst) {
        first = myPoke; second = enemy; firstMove = playerMoveKey; secondMove = enemyMoveKey; firstIsPlayer = true;
    } else {
        first = enemy; second = myPoke; firstMove = enemyMoveKey; secondMove = playerMoveKey; firstIsPlayer = false;
    }
    // 선공
    if (canAct(first, bd)) {
        executeAttack(first, second, firstMove, bd);
    }
    doStatusDamage(first, bd);
    // 후공 (상대 살아있으면)
    if (second.currentHp > 0 && first.currentHp > 0) {
        if (canAct(second, bd)) {
            executeAttack(second, first, secondMove, bd);
        }
        doStatusDamage(second, bd);
    }
    // 승패 판정
    if (enemy.currentHp <= 0) {
        bd.msg.push("야생 " + enemy.nickname + "을(를) 쓰러뜨렸다!");
        bd.won = true;
        grantExp(myPoke, enemy);
    }
    if (myPoke.currentHp <= 0) {
        bd.msg.push(myPoke.nickname + "이(가) 쓰러졌다!");
        // 살아있는 다른 포켓몬이 있는지 확인
        var alive = false;
        for (var i = 0; i < player.party.length; i++) {
            if (player.party[i].currentHp > 0) { alive = true; break; }
        }
        if (!alive) {
            bd.lost = true;
            bd.msg.push("눈앞이 깜깜해졌다...");
        }
    }
    for (var i = 0; i < bd.msg.length; i++) addLog(bd.msg[i], "battle");
}

// ═══════════════════════════════════════════════
// 🔴 포획 시스템
// ═══════════════════════════════════════════════
function attemptCapture(ballKey) {
    if (!gState || !gState.battleData || gState.battleData.type !== "wild") return;
    var bd = gState.battleData;
    var enemy = bd.enemy;
    var ball = ITEMS[ballKey];
    if (!ball || ball.type !== "ball") return;
    bd.msg = [];
    // 아이템 소모
    player.bag[ballKey] = (player.bag[ballKey] || 0) - 1;
    if (player.bag[ballKey] <= 0) delete player.bag[ballKey];
    var data = POKEDEX[enemy.key];
    if (!data) return;
    bd.msg.push(ball.n + "을(를) 던졌다!");
    // 마스터볼
    if (ball.value >= 255) {
        bd.msg.push("잡았다! " + enemy.nickname + "을(를) 잡았다!");
        bd.caught = true;
        addCapturedPokemon(enemy);
        for (var i = 0; i < bd.msg.length; i++) addLog(bd.msg[i], "capture");
        return;
    }
    // 포획률 공식
    var maxHp = enemy.stats[0];
    var curHp = enemy.currentHp;
    var catchRate = data.cr;
    var ballBonus = ball.value;
    var statusBonus = 1;
    if (enemy.status === "sleep" || enemy.status === "freeze") statusBonus = 2;
    else if (enemy.status === "paralyze" || enemy.status === "burn" || enemy.status === "poison") statusBonus = 1.5;
    var a = ((3 * maxHp - 2 * curHp) * catchRate * ballBonus) / (3 * maxHp) * statusBonus;
    a = Math.min(255, a);
    // 흔들림 체크 (4번)
    var b = 1048560 / Math.sqrt(Math.sqrt(16711680 / a));
    var shakes = 0;
    for (var i = 0; i < 4; i++) {
        if (Math.random() * 65536 < b) shakes++;
        else break;
    }
    if (shakes >= 4) {
        bd.msg.push("잡았다! " + enemy.nickname + "을(를) 잡았다!");
        bd.caught = true;
        addCapturedPokemon(enemy);
    } else {
        var shakeMsg = ["앗! 빠져나왔다!", "아쉽다! 조금만 더!", "흔들 흔들... 탈출!", "거의 다 잡았는데...!"];
        bd.msg.push(shakeMsg[Math.min(shakes, shakeMsg.length - 1)]);
        // 적 턴
        if (enemy.currentHp > 0) {
            var emk = enemyChooseMove(enemy);
            var myPoke = player.party[bd.myIdx];
            if (canAct(enemy, bd)) {
                executeAttack(enemy, myPoke, emk, bd);
            }
            doStatusDamage(enemy, bd);
            if (myPoke.currentHp <= 0) {
                bd.msg.push(myPoke.nickname + "이(가) 쓰러졌다!");
                var alive = false;
                for (var i = 0; i < player.party.length; i++) {
                    if (player.party[i].currentHp > 0) { alive = true; break; }
                }
                if (!alive) { bd.lost = true; bd.msg.push("눈앞이 깜깜해졌다..."); }
            }
        }
    }
    for (var i = 0; i < bd.msg.length; i++) addLog(bd.msg[i], "capture");
}

function addCapturedPokemon(poke) {
    poke.statStages = {atk:0,def:0,spatk:0,spdef:0,spd:0,acc:0,eva:0};
    poke.status = null;
    poke.statusTurns = 0;
    if (player.party.length < MAX_PARTY) {
        player.party.push(poke);
    } else {
        player.pc.push(poke);
        addLog(poke.nickname + "은(는) PC로 보내졌다!", "info");
    }
}

// ═══════════════════════════════════════════════
// 📈 경험치 / 레벨업 / 진화
// ═══════════════════════════════════════════════
function grantExp(myPoke, enemy) {
    var enemyData = POKEDEX[enemy.key];
    if (!enemyData) return;
    var exp = Math.floor((enemyData.xp * enemy.level) / 7);
    if (exp < 1) exp = 1;
    myPoke.exp += exp;
    gState.battleData.msg.push(myPoke.nickname + "은(는) " + exp + " 경험치를 얻었다!");
    addLog(myPoke.nickname + "은(는) " + exp + " 경험치를 얻었다!", "exp");
    // 골드 보상
    var goldReward = Math.floor(enemy.level * 10 + Math.random() * 50);
    player.gold += goldReward;
    gState.battleData.msg.push("₩" + goldReward + "을 획득했다!");
    // 레벨업 체크
    while (myPoke.level < MAX_LEVEL) {
        var needed = getExpForLevel(myPoke.level + 1) - getExpForLevel(myPoke.level);
        if (myPoke.exp >= needed) {
            myPoke.exp -= needed;
            myPoke.level++;
            recalcStats(myPoke);
            myPoke.currentHp = myPoke.stats[0]; // 레벨업 시 전체 회복
            gState.battleData.msg.push("🎉 " + myPoke.nickname + "은(는) Lv." + myPoke.level + "이(가) 되었다!");
            addLog("🎉 " + myPoke.nickname + " Lv." + myPoke.level + "!", "levelup");
            // 새 기술 배우기 체크
            checkNewMoves(myPoke);
            // 진화 체크
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
        // 이미 알고 있는지 확인
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
            // 기술이 4개면 교체 화면으로
            gState.pendingMoveLearn = {pokeIdx: findPartyIdx(poke), moveKey: mk};
        }
    }
}

function findPartyIdx(poke) {
    for (var i = 0; i < player.party.length; i++) {
        if (player.party[i] === poke) return i;
    }
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
    poke.currentHp = poke.stats[0]; // 진화 시 전체 회복
    addLog("🌟 " + oldName + "이(가) " + newData.n + "(으)로 진화했다!", "evolution");
    gState.pendingEvo = null;
    // 진화 후 새 기술 체크
    checkNewMoves(poke);
}

function tryRun() {
    if (!gState || !gState.battleData) return;
    var bd = gState.battleData;
    bd.msg = [];
    var myPoke = player.party[bd.myIdx];
    var mySpd = myPoke.stats[5];
    var enSpd = bd.enemy.stats[5];
    var chance = ((mySpd * 128) / enSpd + 30) / 256;
    if (Math.random() < Math.max(0.2, Math.min(0.95, chance))) {
        bd.msg.push("무사히 도망쳤다!");
        bd.fled = true;
    } else {
        bd.msg.push("도망칠 수 없었다!");
        // 적 턴
        var emk = enemyChooseMove(bd.enemy);
        if (canAct(bd.enemy, bd)) {
            executeAttack(bd.enemy, myPoke, emk, bd);
        }
        doStatusDamage(bd.enemy, bd);
        if (myPoke.currentHp <= 0) {
            bd.msg.push(myPoke.nickname + "이(가) 쓰러졌다!");
            var alive = false;
            for (var i = 0; i < player.party.length; i++) {
                if (player.party[i].currentHp > 0) { alive = true; break; }
            }
            if (!alive) { bd.lost = true; bd.msg.push("눈앞이 깜깜해졌다..."); }
        }
    }
    for (var i = 0; i < bd.msg.length; i++) addLog(bd.msg[i], "battle");
}

// ═══════════════════════════════════════════════
// 🏥 포켓몬센터 & 상점
// ═══════════════════════════════════════════════
function healAllPokemon() {
    for (var i = 0; i < player.party.length; i++) {
        var p = player.party[i];
        p.currentHp = p.stats[0];
        p.status = null;
        p.statusTurns = 0;
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
        player.bag[itemKey]--;
        if (player.bag[itemKey] <= 0) delete player.bag[itemKey];
        addLog(poke.nickname + "에게 " + item.n + " 사용! HP +" + item.value, "item");
        return true;
    }
    if (item.type === "fullheal") {
        if (poke.currentHp <= 0) return false;
        poke.currentHp = poke.stats[0];
        poke.status = null; poke.statusTurns = 0;
        player.bag[itemKey]--;
        if (player.bag[itemKey] <= 0) delete player.bag[itemKey];
        addLog(poke.nickname + "이(가) 완전히 회복되었다!", "item");
        return true;
    }
    if (item.type === "revive") {
        if (poke.currentHp > 0) return false;
        poke.currentHp = Math.floor(poke.stats[0] * item.value);
        poke.status = null; poke.statusTurns = 0;
        player.bag[itemKey]--;
        if (player.bag[itemKey] <= 0) delete player.bag[itemKey];
        addLog(poke.nickname + "이(가) 부활했다!", "item");
        return true;
    }
    if (item.type === "cure") {
        if (poke.status !== item.value) return false;
        poke.status = null; poke.statusTurns = 0;
        player.bag[itemKey]--;
        if (player.bag[itemKey] <= 0) delete player.bag[itemKey];
        addLog(poke.nickname + "의 상태이상이 회복되었다!", "item");
        return true;
    }
    return false;
}

// ═══════════════════════════════════════════════
// 🔊 오디오 (간단)
// ═══════════════════════════════════════════════
var _aCtx = null;
function getACtx() { if (!_aCtx) _aCtx = new (window.AudioContext || window.webkitAudioContext)(); return _aCtx; }
function playBeep(freq, dur, type) {
    try { var c=getACtx(),o=c.createOscillator(),g=c.createGain(); o.connect(g);g.connect(c.destination); o.frequency.value=freq;o.type=type||'square'; var n=c.currentTime; g.gain.setValueAtTime(0.15,n); g.gain.exponentialRampToValueAtTime(0.001,n+(dur||0.1)); o.start(n);o.stop(n+(dur||0.1)); } catch(e){}
}
function sfxAttack() { playBeep(440,0.08,'square'); setTimeout(function(){playBeep(220,0.06,'sawtooth');},80); }
function sfxCrit() { playBeep(880,0.05,'square'); setTimeout(function(){playBeep(660,0.05,'square');},50); setTimeout(function(){playBeep(440,0.08,'sawtooth');},100); }
function sfxCapture() { playBeep(523,0.1,'sine'); setTimeout(function(){playBeep(659,0.1,'sine');},120); setTimeout(function(){playBeep(784,0.15,'sine');},240); }
function sfxLevelUp() { playBeep(523,0.08,'square'); setTimeout(function(){playBeep(659,0.08,'square');},100); setTimeout(function(){playBeep(784,0.08,'square');},200); setTimeout(function(){playBeep(1047,0.15,'square');},300); }
function sfxFail() { playBeep(300,0.15,'sawtooth'); setTimeout(function(){playBeep(200,0.2,'sawtooth');},150); }

// ═══════════════════════════════════════════════
// 🎨 CSS 스타일
// ═══════════════════════════════════════════════
function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = "\
#" + UI_ID + " { position:fixed; top:0; left:0; width:100%; height:100%; background:linear-gradient(135deg,#0f0f23 0%,#1a1a3e 50%,#0f0f23 100%); color:#e0e0e0; font-family:'Segoe UI',sans-serif; font-size:14px; display:flex; flex-direction:column; z-index:99999; overflow:hidden; }\
#" + UI_ID + ".hidden { display:none!important; }\
.pk-header { background:linear-gradient(90deg,#e94560,#c23152); padding:10px 16px; display:flex; justify-content:space-between; align-items:center; flex-shrink:0; box-shadow:0 2px 10px rgba(0,0,0,0.4); }\
.pk-header-title { font-size:18px; font-weight:bold; color:#fff; text-shadow:1px 1px 2px rgba(0,0,0,0.5); }\
.pk-header-btn { background:rgba(255,255,255,0.15); border:none; color:#fff; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:14px; transition:all 0.2s; }\
.pk-header-btn:hover { background:rgba(255,255,255,0.3); transform:scale(1.05); }\
.pk-body { flex:1; overflow-y:auto; padding:12px; }\
.pk-body::-webkit-scrollbar { width:6px; }\
.pk-body::-webkit-scrollbar-thumb { background:#e94560; border-radius:3px; }\
.pk-card { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:14px; margin-bottom:10px; transition:all 0.2s; }\
.pk-card:hover { background:rgba(255,255,255,0.1); border-color:rgba(233,69,96,0.4); }\
.pk-btn { display:inline-block; padding:10px 18px; margin:4px; border:none; border-radius:10px; cursor:pointer; font-size:13px; font-weight:600; color:#fff; transition:all 0.2s; text-align:center; }\
.pk-btn:hover { transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,0.3); }\
.pk-btn:active { transform:translateY(0); }\
.pk-btn-red { background:linear-gradient(135deg,#e94560,#c23152); }\
.pk-btn-blue { background:linear-gradient(135deg,#0f3460,#1a5276); }\
.pk-btn-green { background:linear-gradient(135deg,#27ae60,#219a52); }\
.pk-btn-yellow { background:linear-gradient(135deg,#f5c518,#e6b800); color:#333; }\
.pk-btn-gray { background:linear-gradient(135deg,#555,#444); }\
.pk-btn-purple { background:linear-gradient(135deg,#8e44ad,#7d3c98); }\
.pk-btn-dark { background:linear-gradient(135deg,#2c3e50,#34495e); }\
.pk-btn-sm { padding:6px 12px; font-size:12px; }\
.pk-btn-lg { padding:14px 28px; font-size:16px; }\
.pk-btn[disabled] { opacity:0.4; cursor:not-allowed; transform:none!important; }\
.pk-hp-bar { height:10px; border-radius:5px; background:#333; overflow:hidden; margin:4px 0; }\
.pk-hp-fill { height:100%; border-radius:5px; transition:width 0.4s ease; }\
.pk-hp-green { background:linear-gradient(90deg,#27ae60,#2ecc71); }\
.pk-hp-yellow { background:linear-gradient(90deg,#f39c12,#f1c40f); }\
.pk-hp-red { background:linear-gradient(90deg,#e74c3c,#c0392b); }\
.pk-type { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:bold; color:#fff; margin:1px 2px; text-transform:uppercase; }\
.pk-type-normal { background:#a8a878; } .pk-type-fire { background:#f08030; } .pk-type-water { background:#6890f0; }\
.pk-type-electric { background:#f8d030; color:#333; } .pk-type-grass { background:#78c850; } .pk-type-ice { background:#98d8d8; color:#333; }\
.pk-type-fighting { background:#c03028; } .pk-type-poison { background:#a040a0; } .pk-type-ground { background:#e0c068; color:#333; }\
.pk-type-flying { background:#a890f0; } .pk-type-psychic { background:#f85888; } .pk-type-bug { background:#a8b820; }\
.pk-type-rock { background:#b8a038; } .pk-type-ghost { background:#705898; } .pk-type-dragon { background:#7038f8; }\
.pk-type-dark { background:#705848; } .pk-type-steel { background:#b8b8d0; color:#333; } .pk-type-fairy { background:#ee99ac; }\
.pk-battle-area { display:flex; flex-direction:column; gap:10px; }\
.pk-pokemon-display { display:flex; justify-content:space-between; align-items:stretch; gap:10px; padding:10px 0; }\
.pk-poke-card { flex:1; background:rgba(255,255,255,0.05); border-radius:12px; padding:12px; text-align:center; }\
.pk-poke-emoji { font-size:48px; margin:8px 0; }\
.pk-battle-msg { background:rgba(0,0,0,0.3); border-radius:10px; padding:10px 14px; margin:8px 0; max-height:120px; overflow-y:auto; font-size:13px; line-height:1.6; }\
.pk-battle-msg p { margin:2px 0; }\
.pk-move-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin:8px 0; }\
.pk-action-bar { display:flex; gap:6px; flex-wrap:wrap; justify-content:center; margin:8px 0; }\
.pk-party-slot { display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.05); border-radius:10px; padding:10px; margin:6px 0; cursor:pointer; transition:all 0.2s; }\
.pk-party-slot:hover { background:rgba(255,255,255,0.12); }\
.pk-party-slot.active { border-left:3px solid #e94560; }\
.pk-party-slot.fainted { opacity:0.5; }\
.pk-stat-bar { display:flex; align-items:center; gap:4px; margin:2px 0; font-size:12px; }\
.pk-stat-label { width:40px; text-align:right; color:#aaa; }\
.pk-stat-fill { height:8px; border-radius:4px; }\
.pk-route-card { background:rgba(255,255,255,0.05); border-radius:12px; padding:14px; margin:8px 0; border:1px solid rgba(255,255,255,0.08); }\
.pk-route-card.current { border-color:#e94560; background:rgba(233,69,96,0.1); }\
.pk-shop-item { display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border-bottom:1px solid rgba(255,255,255,0.05); }\
.pk-gold { color:#f5c518; font-weight:bold; }\
.pk-region-switch { display:flex; gap:8px; margin:10px 0; justify-content:center; }\
.pk-toast { position:fixed; top:60px; left:50%; transform:translateX(-50%); background:rgba(233,69,96,0.95); color:#fff; padding:10px 24px; border-radius:20px; font-size:14px; z-index:999999; animation:pkToastIn 0.3s ease; pointer-events:none; }\
@keyframes pkToastIn { from{opacity:0;transform:translateX(-50%) translateY(-20px);} to{opacity:1;transform:translateX(-50%) translateY(0);} }\
.pk-title-screen { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center; }\
.pk-title-logo { font-size:64px; margin-bottom:16px; }\
.pk-title-text { font-size:32px; font-weight:bold; color:#f5c518; text-shadow:2px 2px 4px rgba(0,0,0,0.5); margin-bottom:8px; }\
.pk-starter-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin:16px 0; }\
.pk-starter-card { background:rgba(255,255,255,0.08); border:2px solid rgba(255,255,255,0.1); border-radius:16px; padding:20px; text-align:center; cursor:pointer; transition:all 0.3s; }\
.pk-starter-card:hover { border-color:#f5c518; transform:translateY(-4px); background:rgba(245,197,24,0.1); }\
.pk-starter-emoji { font-size:56px; margin-bottom:8px; }\
.pk-log-entry { padding:3px 0; border-bottom:1px solid rgba(255,255,255,0.03); font-size:12px; }\
.pk-log-battle { color:#f39c12; } .pk-log-capture { color:#27ae60; } .pk-log-levelup { color:#f5c518; } .pk-log-evolution { color:#e94560; } .pk-log-info { color:#aaa; }\
.pk-tab-bar { display:flex; gap:4px; margin-bottom:10px; flex-wrap:wrap; }\
.pk-tab { padding:8px 16px; border-radius:8px 8px 0 0; cursor:pointer; background:rgba(255,255,255,0.05); color:#aaa; font-size:13px; transition:all 0.2s; }\
.pk-tab.active { background:rgba(233,69,96,0.2); color:#fff; border-bottom:2px solid #e94560; }\
.pk-summary-stats { display:grid; grid-template-columns:1fr 1fr; gap:4px; }\
.pk-moves-list { display:grid; grid-template-columns:1fr 1fr; gap:6px; }\
.pk-move-card { background:rgba(255,255,255,0.05); border-radius:8px; padding:8px; font-size:12px; }\
";
    document.head.appendChild(s);
}

// ═══════════════════════════════════════════════
// 🖥️ UI 렌더링
// ═══════════════════════════════════════════════
function createUI() {
    injectStyles();
    if (!document.getElementById(UI_ID)) {
        var w = document.createElement("div");
        w.id = UI_ID;
        if (!isVisible) w.classList.add("hidden");
        w.innerHTML = '<div class="pk-header"><div class="pk-header-title">🎮 포켓몬 배틀</div><div style="display:flex;gap:6px"><button class="pk-header-btn" id="pk-btn-home">🏠</button><button class="pk-header-btn" id="pk-btn-close">✕</button></div></div><div class="pk-body" id="pk-body"></div>';
        document.body.appendChild(w);
        w.querySelector("#pk-btn-close").addEventListener("click", async function() {
            w.classList.add("hidden"); isVisible = false; await lsSet(KEY_VIS,"false");
            if (_hasRisu) await Risuai.hideContainer();
        });
        w.querySelector("#pk-btn-home").addEventListener("click", function() {
            if (gState && gState.phase === "battle") return; // 배틀 중엔 홈 금지
            if (gState) { gState.phase = "overworld"; gState.subScreen = null; }
            render();
        });
    }
    render();
}

function showToast(msg) {
    var old = document.querySelector(".pk-toast");
    if (old) old.remove();
    var t = document.createElement("div");
    t.className = "pk-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function(){ if(t.parentNode) t.remove(); }, 2200);
}

function typeSpan(t) {
    return '<span class="pk-type pk-type-' + t + '">' + t + '</span>';
}

function hpBar(cur, max) {
    var pct = Math.max(0, Math.min(100, (cur/max)*100));
    var cls = pct > 50 ? "pk-hp-green" : (pct > 20 ? "pk-hp-yellow" : "pk-hp-red");
    return '<div class="pk-hp-bar"><div class="pk-hp-fill ' + cls + '" style="width:' + pct + '%"></div></div>';
}

function render() {
    var win = document.getElementById(UI_ID);
    if (!win) return;
    var body = win.querySelector("#pk-body");
    if (!body) return;
    if (!player || !gState) {
        body.innerHTML = renderTitleScreen();
    } else if (gState.pendingEvo) {
        body.innerHTML = renderEvolutionScreen();
    } else if (gState.pendingMoveLearn) {
        body.innerHTML = renderMoveLearnScreen();
    } else if (gState.phase === "battle") {
        body.innerHTML = renderBattleScreen();
    } else if (gState.subScreen === "party") {
        body.innerHTML = renderPartyScreen();
    } else if (gState.subScreen === "pc") {
        body.innerHTML = renderPCScreen();
    } else if (gState.subScreen === "shop") {
        body.innerHTML = renderShopScreen();
    } else if (gState.subScreen === "bag") {
        body.innerHTML = renderBagScreen();
    } else if (gState.subScreen === "summary") {
        body.innerHTML = renderSummaryScreen();
    } else if (gState.subScreen === "log") {
        body.innerHTML = renderLogScreen();
    } else {
        body.innerHTML = renderOverworld();
    }
    bindHandlers(body);
}

// ═══════════════════════════════════════════════
// 📺 화면 렌더 함수들
// ═══════════════════════════════════════════════
function renderTitleScreen() {
    return '<div class="pk-title-screen">' +
        '<div class="pk-title-logo">⚡</div>' +
        '<div class="pk-title-text">포켓몬 배틀</div>' +
        '<div style="color:#aaa;margin-bottom:24px">Gen 1-2 Edition</div>' +
        '<button class="pk-btn pk-btn-red pk-btn-lg" data-action="poke_newGame">새 게임 시작</button>' +
        '<div style="height:12px"></div>' +
        '<button class="pk-btn pk-btn-blue pk-btn-lg" data-action="poke_continue">이어하기</button>' +
        '</div>';
}

function renderStarterSelect() {
    var starters = [
        {region:"kanto", pokemon:[
            {key:"bulbasaur",n:"이상해씨",em:"🌿",desc:"풀/독 타입 - 방어적 밸런스형"},
            {key:"charmander",n:"파이리",em:"🔥",desc:"불꽃 타입 - 공격적 속공형"},
            {key:"squirtle",n:"꼬부기",em:"🐢",desc:"물 타입 - 안정적 방어형"}
        ]},
        {region:"johto", pokemon:[
            {key:"chikorita",n:"치코리타",em:"🍃",desc:"풀 타입 - 든든한 방어형"},
            {key:"cyndaquil",n:"브케인",em:"🔥",desc:"불꽃 타입 - 강력한 화력형"},
            {key:"totodile",n:"리아코",em:"🐊",desc:"물 타입 - 힘 좋은 물리형"}
        ]}
    ];
    var html = '<div style="padding:20px;text-align:center">';
    html += '<h2 style="color:#f5c518;margin-bottom:8px">🌟 지역과 스타터 포켓몬을 선택하세요!</h2>';
    for (var r = 0; r < starters.length; r++) {
        var reg = starters[r];
        html += '<h3 style="color:#e94560;margin:16px 0 8px">' + (reg.region === "kanto" ? "🗾 칸토 지방" : "🏔️ 성도 지방") + '</h3>';
        html += '<div class="pk-starter-grid">';
        for (var i = 0; i < reg.pokemon.length; i++) {
            var p = reg.pokemon[i];
            var data = POKEDEX[p.key];
            html += '<div class="pk-starter-card" data-action="poke_selectStarter" data-args="' + reg.region + '|' + p.key + '">';
            html += '<div class="pk-starter-emoji">' + p.em + '</div>';
            html += '<div style="font-size:16px;font-weight:bold;margin:4px 0">' + p.n + '</div>';
            if (data) { for (var j = 0; j < data.t.length; j++) html += typeSpan(data.t[j]); }
            html += '<div style="color:#aaa;font-size:12px;margin-top:6px">' + p.desc + '</div>';
            html += '</div>';
        }
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function renderOverworld() {
    var routes = ROUTES[player.region];
    var route = routes[player.routeIdx];
    var html = '';
    // 지역 전환 버튼
    html += '<div class="pk-region-switch">';
    html += '<button class="pk-btn ' + (player.region==="kanto"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_switchRegion" data-args="kanto">🗾 칸토</button>';
    html += '<button class="pk-btn ' + (player.region==="johto"?"pk-btn-red":"pk-btn-dark") + ' pk-btn-sm" data-action="poke_switchRegion" data-args="johto">🏔️ 성도</button>';
    html += '</div>';
    // 현재 루트 정보
    html += '<div class="pk-card" style="border-color:rgba(233,69,96,0.4)">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center">';
    html += '<div><div style="font-size:18px;font-weight:bold;color:#f5c518">📍 ' + route.n + '</div>';
    html += '<div style="color:#aaa;font-size:12px">' + route.sub + ' | Lv.' + route.lv[0] + '~' + route.lv[1] + '</div></div>';
    html += '<div style="text-align:right;font-size:12px;color:#aaa">루트 ' + (player.routeIdx+1) + '/' + routes.length + '</div>';
    html += '</div>';
    // 출현 포켓몬 미리보기
    html += '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px">';
    for (var i = 0; i < route.pokemon.length; i++) {
        var pk = POKEDEX[route.pokemon[i].k];
        if (pk) html += '<span style="font-size:11px;background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px" title="' + pk.n + '">' + pk.em + ' ' + pk.n + '</span>';
    }
    html += '</div></div>';
    // 루트 이동 버튼
    html += '<div style="display:flex;gap:6px;justify-content:center;margin:8px 0">';
    if (player.routeIdx > 0) html += '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_moveRoute" data-args="-1">◀ 이전 루트</button>';
    html += '<button class="pk-btn pk-btn-red" data-action="poke_wildBattle">⚔️ 야생 배틀!</button>';
    if (player.routeIdx < routes.length - 1) html += '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_moveRoute" data-args="1">다음 루트 ▶</button>';
    html += '</div>';
    // 시설 버튼
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:8px 0">';
    if (route.hasCenter) html += '<button class="pk-btn pk-btn-blue pk-btn-sm" data-action="poke_center">🏥 포켓몬센터</button>';
    if (route.hasShop) html += '<button class="pk-btn pk-btn-green pk-btn-sm" data-action="poke_openShop">🏪 상점</button>';
    html += '<button class="pk-btn pk-btn-purple pk-btn-sm" data-action="poke_openParty">👥 파티</button>';
    html += '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_openPC">💻 PC</button>';
    html += '<button class="pk-btn pk-btn-yellow pk-btn-sm" data-action="poke_openBag">🎒 가방</button>';
    html += '</div>';
    // 플레이어 상태 요약
    html += '<div class="pk-card">';
    html += '<div style="display:flex;justify-content:space-between;font-size:13px">';
    html += '<span>트레이너: <b>' + player.name + '</b></span>';
    html += '<span class="pk-gold">💰 ₩' + player.gold.toLocaleString() + '</span>';
    html += '</div>';
    // 파티 미니 표시
    html += '<div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap">';
    for (var i = 0; i < player.party.length; i++) {
        var p = player.party[i];
        var pd = POKEDEX[p.key];
        var em = pd ? pd.em : "?";
        var hpPct = Math.round((p.currentHp / p.stats[0]) * 100);
        var hpColor = hpPct > 50 ? "#27ae60" : (hpPct > 20 ? "#f39c12" : "#e74c3c");
        if (p.currentHp <= 0) hpColor = "#555";
        html += '<div style="background:rgba(255,255,255,0.05);padding:4px 8px;border-radius:6px;font-size:11px;text-align:center;border-bottom:2px solid ' + hpColor + '">';
        html += em + ' <span style="color:#aaa">Lv.' + p.level + '</span>';
        html += '</div>';
    }
    html += '</div></div>';
    // 로그 미니
    html += '<div class="pk-card" style="max-height:100px;overflow-y:auto">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span style="font-size:12px;color:#aaa">📋 최근 로그</span>';
    html += '<button class="pk-btn pk-btn-dark pk-btn-sm" style="padding:2px 8px;font-size:11px" data-action="poke_openLog">전체보기</button></div>';
    var logs = gState.log || [];
    for (var i = 0; i < Math.min(5, logs.length); i++) {
        html += '<div class="pk-log-entry pk-log-' + logs[i].type + '">' + logs[i].msg + '</div>';
    }
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
    var html = '<div class="pk-battle-area">';
    // 포켓몬 표시
    html += '<div class="pk-pokemon-display">';
    // 내 포켓몬
    html += '<div class="pk-poke-card" style="border-left:3px solid #3498db">';
    html += '<div style="font-size:12px;color:#3498db;font-weight:bold">나의 포켓몬</div>';
    html += '<div class="pk-poke-emoji">' + (myData?myData.em:"?") + '</div>';
    html += '<div style="font-weight:bold">' + myPoke.nickname + ' <span style="color:#aaa">Lv.' + myPoke.level + '</span></div>';
    if (myData) { for (var i = 0; i < myData.t.length; i++) html += typeSpan(myData.t[i]); }
    html += '<div style="font-size:12px;margin-top:4px">HP: ' + myPoke.currentHp + '/' + myPoke.stats[0] + '</div>';
    html += hpBar(myPoke.currentHp, myPoke.stats[0]);
    if (myPoke.status) html += '<div style="font-size:11px;color:#f39c12">상태: ' + statusName(myPoke.status) + '</div>';
    html += '</div>';
    // 상대 포켓몬
    html += '<div class="pk-poke-card" style="border-left:3px solid #e74c3c">';
    html += '<div style="font-size:12px;color:#e74c3c;font-weight:bold">야생 포켓몬</div>';
    html += '<div class="pk-poke-emoji">' + (enData?enData.em:"?") + '</div>';
    html += '<div style="font-weight:bold">' + enemy.nickname + ' <span style="color:#aaa">Lv.' + enemy.level + '</span></div>';
    if (enData) { for (var i = 0; i < enData.t.length; i++) html += typeSpan(enData.t[i]); }
    html += '<div style="font-size:12px;margin-top:4px">HP: ' + enemy.currentHp + '/' + enemy.stats[0] + '</div>';
    html += hpBar(enemy.currentHp, enemy.stats[0]);
    if (enemy.status) html += '<div style="font-size:11px;color:#f39c12">상태: ' + statusName(enemy.status) + '</div>';
    html += '</div>';
    html += '</div>';
    // 배틀 메시지
    if (bd.msg && bd.msg.length > 0) {
        html += '<div class="pk-battle-msg">';
        for (var i = 0; i < bd.msg.length; i++) {
            html += '<p>' + bd.msg[i] + '</p>';
        }
        html += '</div>';
    }
    // 배틀 종료 상태
    if (bd.won || bd.caught || bd.fled) {
        html += '<div style="text-align:center;margin:12px 0">';
        html += '<button class="pk-btn pk-btn-green pk-btn-lg" data-action="poke_endBattle">✅ 확인</button>';
        html += '</div>';
    } else if (bd.lost) {
        html += '<div style="text-align:center;margin:12px 0">';
        html += '<button class="pk-btn pk-btn-red pk-btn-lg" data-action="poke_blackout">😵 패배 확인</button>';
        html += '</div>';
    } else if (myPoke.currentHp <= 0) {
        // 현재 포켓몬 기절, 교체 필요
        html += '<div style="text-align:center;color:#e74c3c;margin:8px 0"><b>포켓몬을 교체하세요!</b></div>';
        html += renderBattlePartySwitch();
    } else {
        // 기술 선택
        html += '<div style="font-size:12px;color:#aaa;margin:8px 0 4px">⚔️ 기술 선택:</div>';
        html += '<div class="pk-move-grid">';
        for (var i = 0; i < myPoke.moves.length; i++) {
            var m = myPoke.moves[i];
            var mv = MOVES[m.key];
            if (!mv) continue;
            var disabled = m.ppLeft <= 0 ? " disabled" : "";
            html += '<button class="pk-btn pk-btn-dark" data-action="poke_attack" data-args="' + m.key + '"' + disabled + '>';
            html += '<div>' + typeSpan(mv.t) + ' ' + mv.n + '</div>';
            html += '<div style="font-size:10px;color:#aaa">' + (mv.c==="status"?"변화":mv.c==="physical"?"물리":"특수") + ' | ';
            html += (mv.p>0?"위력:"+mv.p:"—") + ' | PP:' + m.ppLeft + '/' + mv.pp + '</div>';
            html += '</button>';
        }
        html += '</div>';
        // 하단 액션
        html += '<div class="pk-action-bar">';
        // 볼 던지기
        var balls = [];
        if (player.bag.masterball) balls.push("masterball");
        if (player.bag.ultraball) balls.push("ultraball");
        if (player.bag.superball) balls.push("superball");
        if (player.bag.pokeball) balls.push("pokeball");
        for (var i = 0; i < balls.length; i++) {
            var b = ITEMS[balls[i]];
            html += '<button class="pk-btn pk-btn-yellow pk-btn-sm" data-action="poke_throwBall" data-args="' + balls[i] + '">🔴 ' + b.n + ' (' + (player.bag[balls[i]]||0) + ')</button>';
        }
        // 포켓몬 교체
        html += '<button class="pk-btn pk-btn-blue pk-btn-sm" data-action="poke_battleParty">🔄 교체</button>';
        // 아이템 사용
        html += '<button class="pk-btn pk-btn-green pk-btn-sm" data-action="poke_battleBag">🎒 아이템</button>';
        // 도주
        html += '<button class="pk-btn pk-btn-gray pk-btn-sm" data-action="poke_run">🏃 도주</button>';
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function renderBattlePartySwitch() {
    var html = '<div>';
    for (var i = 0; i < player.party.length; i++) {
        var p = player.party[i];
        if (p.currentHp <= 0) continue;
        var pd = POKEDEX[p.key];
        html += '<div class="pk-party-slot" data-action="poke_switchInBattle" data-args="' + i + '">';
        html += '<span style="font-size:24px">' + (pd?pd.em:"?") + '</span>';
        html += '<div><b>' + p.nickname + '</b> Lv.' + p.level;
        html += '<div style="font-size:11px;color:#aaa">HP: ' + p.currentHp + '/' + p.stats[0] + '</div></div>';
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function renderPartyScreen() {
    var html = '<div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">';
    html += '<h3 style="color:#f5c518;margin:0">👥 파티 (' + player.party.length + '/' + MAX_PARTY + ')</h3>';
    html += '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 돌아가기</button>';
    html += '</div>';
    for (var i = 0; i < player.party.length; i++) {
        var p = player.party[i];
        var pd = POKEDEX[p.key];
        var fainted = p.currentHp <= 0 ? " fainted" : "";
        html += '<div class="pk-party-slot' + fainted + '" data-action="poke_showSummary" data-args="party|' + i + '">';
        html += '<span style="font-size:32px">' + (pd?pd.em:"?") + '</span>';
        html += '<div style="flex:1">';
        html += '<div style="display:flex;justify-content:space-between"><b>' + p.nickname + '</b> <span style="color:#aaa">Lv.' + p.level + '</span></div>';
        if (pd) { for (var j = 0; j < pd.t.length; j++) html += typeSpan(pd.t[j]); }
        html += '<div style="font-size:11px">HP: ' + p.currentHp + '/' + p.stats[0] + '</div>';
        html += hpBar(p.currentHp, p.stats[0]);
        if (p.status) html += '<span style="font-size:10px;color:#f39c12">' + statusName(p.status) + '</span>';
        html += '</div></div>';
    }
    return html;
}

function renderPCScreen() {
    var html = '<div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">';
    html += '<h3 style="color:#f5c518;margin:0">💻 PC 보관함 (' + player.pc.length + '마리)</h3>';
    html += '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 돌아가기</button>';
    html += '</div>';
    if (player.pc.length === 0) {
        html += '<div class="pk-card" style="text-align:center;color:#aaa">PC에 보관된 포켓몬이 없습니다.</div>';
    }
    for (var i = 0; i < player.pc.length; i++) {
        var p = player.pc[i];
        var pd = POKEDEX[p.key];
        html += '<div class="pk-party-slot">';
        html += '<span style="font-size:24px">' + (pd?pd.em:"?") + '</span>';
        html += '<div style="flex:1"><b>' + p.nickname + '</b> Lv.' + p.level;
        if (pd) { html += ' '; for (var j = 0; j < pd.t.length; j++) html += typeSpan(pd.t[j]); }
        html += '<div style="font-size:11px">HP: ' + p.currentHp + '/' + p.stats[0] + '</div></div>';
        if (player.party.length < MAX_PARTY) {
            html += '<button class="pk-btn pk-btn-blue pk-btn-sm" data-action="poke_withdrawPC" data-args="' + i + '">꺼내기</button>';
        }
        html += '</div>';
    }
    if (player.party.length > 1) {
        html += '<h4 style="color:#aaa;margin:12px 0 6px">파티 → PC 보관:</h4>';
        for (var i = 0; i < player.party.length; i++) {
            var p = player.party[i];
            var pd = POKEDEX[p.key];
            html += '<div class="pk-party-slot">';
            html += '<span style="font-size:20px">' + (pd?pd.em:"?") + '</span>';
            html += '<div style="flex:1"><b>' + p.nickname + '</b> Lv.' + p.level + '</div>';
            html += '<button class="pk-btn pk-btn-gray pk-btn-sm" data-action="poke_depositPC" data-args="' + i + '">보관</button>';
            html += '</div>';
        }
    }
    return html;
}

function renderShopScreen() {
    var html = '<div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">';
    html += '<h3 style="color:#f5c518;margin:0">🏪 상점</h3>';
    html += '<div><span class="pk-gold">💰 ₩' + player.gold.toLocaleString() + '</span> ';
    html += '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 돌아가기</button></div>';
    html += '</div>';
    var shopItems = ["pokeball","superball","ultraball","potion","superpotion","hyperpotion","fullrestore","revive","antidote","paralyzeheal","awakening"];
    for (var i = 0; i < shopItems.length; i++) {
        var k = shopItems[i];
        var item = ITEMS[k];
        if (!item) continue;
        var owned = player.bag[k] || 0;
        var canBuy = player.gold >= item.buy;
        html += '<div class="pk-shop-item">';
        html += '<div><b>' + item.n + '</b> <span style="color:#aaa;font-size:11px">' + item.desc + '</span>';
        html += '<div style="font-size:11px;color:#888">소지: ' + owned + '개</div></div>';
        html += '<div style="display:flex;gap:4px;align-items:center">';
        html += '<span class="pk-gold" style="font-size:12px">₩' + item.buy + '</span>';
        html += '<button class="pk-btn pk-btn-green pk-btn-sm" data-action="poke_buyItem" data-args="' + k + '"' + (canBuy?'':' disabled') + '>구매</button>';
        if (owned > 0) html += '<button class="pk-btn pk-btn-gray pk-btn-sm" data-action="poke_sellItem" data-args="' + k + '">판매</button>';
        html += '</div></div>';
    }
    return html;
}

function renderBagScreen() {
    var html = '<div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">';
    html += '<h3 style="color:#f5c518;margin:0">🎒 가방</h3>';
    html += '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 돌아가기</button>';
    html += '</div>';
    var keys = Object.keys(player.bag);
    if (keys.length === 0) {
        html += '<div class="pk-card" style="text-align:center;color:#aaa">가방이 비어있습니다.</div>';
    }
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var item = ITEMS[k];
        if (!item || player.bag[k] <= 0) continue;
        html += '<div class="pk-shop-item">';
        html += '<div><b>' + item.n + '</b> x' + player.bag[k] + ' <span style="color:#aaa;font-size:11px">' + item.desc + '</span></div>';
        if (item.type === "heal" || item.type === "fullheal" || item.type === "revive" || item.type === "cure") {
            html += '<button class="pk-btn pk-btn-green pk-btn-sm" data-action="poke_useItemSelect" data-args="' + k + '">사용</button>';
        }
        html += '</div>';
    }
    return html;
}

function renderSummaryScreen() {
    var src = gState.summarySource || "party";
    var idx = gState.summaryIdx || 0;
    var poke = (src === "party") ? player.party[idx] : player.pc[idx];
    if (!poke) return '<div>데이터 없음 <button class="pk-btn pk-btn-dark" data-action="poke_back">돌아가기</button></div>';
    var pd = POKEDEX[poke.key];
    var html = '<div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">';
    html += '<h3 style="color:#f5c518;margin:0">📋 ' + poke.nickname + ' 상세</h3>';
    html += '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 돌아가기</button>';
    html += '</div>';
    html += '<div class="pk-card" style="text-align:center">';
    html += '<div style="font-size:56px">' + (pd?pd.em:"?") + '</div>';
    html += '<div style="font-size:20px;font-weight:bold">' + poke.nickname + '</div>';
    html += '<div style="margin:4px 0">Lv.' + poke.level + ' | EXP: ' + poke.exp + '/' + (getExpForLevel(poke.level+1)-getExpForLevel(poke.level)) + '</div>';
    if (pd) { for (var i = 0; i < pd.t.length; i++) html += typeSpan(pd.t[i]); }
    html += '<div style="font-size:12px;margin-top:4px">HP: ' + poke.currentHp + '/' + poke.stats[0] + '</div>';
    html += hpBar(poke.currentHp, poke.stats[0]);
    if (poke.status) html += '<div style="color:#f39c12">상태: ' + statusName(poke.status) + '</div>';
    html += '</div>';
    // 스탯
    var statNames = ["HP","공격","방어","특공","특방","스피드"];
    var statColors = ["#e74c3c","#e67e22","#f1c40f","#3498db","#2ecc71","#e91e90"];
    html += '<div class="pk-card"><h4 style="margin:0 0 8px;color:#aaa">📊 능력치</h4>';
    for (var i = 0; i < 6; i++) {
        var maxW = 200;
        var w = Math.min(maxW, (poke.stats[i] / 255) * maxW);
        html += '<div class="pk-stat-bar"><span class="pk-stat-label">' + statNames[i] + '</span>';
        html += '<div style="flex:1;background:#222;border-radius:4px;height:8px"><div class="pk-stat-fill" style="width:' + w + 'px;background:' + statColors[i] + '"></div></div>';
        html += '<span style="width:32px;text-align:right;font-size:12px;font-weight:bold">' + poke.stats[i] + '</span></div>';
    }
    html += '</div>';
    // 기술
    html += '<div class="pk-card"><h4 style="margin:0 0 8px;color:#aaa">⚔️ 기술</h4><div class="pk-moves-list">';
    for (var i = 0; i < poke.moves.length; i++) {
        var m = poke.moves[i];
        var mv = MOVES[m.key];
        if (!mv) continue;
        html += '<div class="pk-move-card">';
        html += typeSpan(mv.t) + ' <b>' + mv.n + '</b>';
        html += '<div style="color:#aaa;margin-top:2px">' + (mv.c==="status"?"변화":mv.c==="physical"?"물리":"특수");
        html += ' | ' + (mv.p>0?"위력:"+mv.p:"—") + ' | 명중:' + (mv.a>0?mv.a+"":"—") + '</div>';
        html += '<div style="color:#aaa">PP: ' + m.ppLeft + '/' + mv.pp + '</div>';
        html += '</div>';
    }
    html += '</div></div>';
    return html;
}

function renderMoveLearnScreen() {
    var ml = gState.pendingMoveLearn;
    if (!ml) return '';
    var poke = player.party[ml.pokeIdx];
    if (!poke) { gState.pendingMoveLearn = null; return ''; }
    var newMv = MOVES[ml.moveKey];
    if (!newMv) { gState.pendingMoveLearn = null; return ''; }
    var html = '<div style="text-align:center;padding:16px">';
    html += '<h3 style="color:#f5c518">💡 새로운 기술!</h3>';
    html += '<p>' + poke.nickname + '이(가) <b style="color:#e94560">' + newMv.n + '</b>을(를) 배울 수 있다!</p>';
    html += '<p style="color:#aaa">하지만 기술이 이미 4개입니다. 하나를 잊어야 합니다.</p>';
    html += '<div class="pk-card">';
    html += '<div style="font-size:12px;color:#aaa;margin-bottom:6px">새 기술:</div>';
    html += '<div class="pk-move-card" style="border:1px solid #e94560">';
    html += typeSpan(newMv.t) + ' <b>' + newMv.n + '</b>';
    html += '<div style="color:#aaa;font-size:11px">' + (newMv.c==="status"?"변화":newMv.c==="physical"?"물리":"특수") + ' | ' + (newMv.p>0?"위력:"+newMv.p:"—") + ' | 명중:' + (newMv.a>0?newMv.a+"":"—") + '</div>';
    html += '</div></div>';
    html += '<div style="font-size:12px;color:#aaa;margin:8px 0">잊을 기술을 선택하세요:</div>';
    for (var i = 0; i < poke.moves.length; i++) {
        var m = poke.moves[i];
        var mv = MOVES[m.key];
        if (!mv) continue;
        html += '<div class="pk-party-slot" data-action="poke_forgetMove" data-args="' + i + '">';
        html += typeSpan(mv.t) + ' <b>' + mv.n + '</b>';
        html += '<span style="color:#aaa;font-size:11px;margin-left:8px">' + (mv.p>0?"위력:"+mv.p:"—") + '</span>';
        html += '</div>';
    }
    html += '<button class="pk-btn pk-btn-gray" data-action="poke_forgetMove" data-args="skip">배우지 않기</button>';
    html += '</div>';
    return html;
}

function renderEvolutionScreen() {
    var evo = gState.pendingEvo;
    if (!evo) return '';
    var poke = player.party[evo.pokeIdx];
    if (!poke) { gState.pendingEvo = null; return ''; }
    var fromData = POKEDEX[evo.from];
    var toData = POKEDEX[evo.to];
    var html = '<div style="text-align:center;padding:32px">';
    html += '<h2 style="color:#f5c518">✨ 진화!</h2>';
    html += '<div style="font-size:64px;margin:16px">' + (fromData?fromData.em:"?") + '</div>';
    html += '<div style="font-size:20px;margin:8px">' + (fromData?fromData.n:"???") + '</div>';
    html += '<div style="font-size:32px;color:#f5c518;margin:8px">⬇️</div>';
    html += '<div style="font-size:64px;margin:16px">' + (toData?toData.em:"?") + '</div>';
    html += '<div style="font-size:20px;margin:8px">' + (toData?toData.n:"???") + '</div>';
    html += '<div style="margin:20px">';
    html += '<button class="pk-btn pk-btn-red pk-btn-lg" data-action="poke_evolve">🌟 진화하기!</button>';
    html += ' <button class="pk-btn pk-btn-gray pk-btn-lg" data-action="poke_cancelEvolve">진화 취소</button>';
    html += '</div></div>';
    return html;
}

function renderLogScreen() {
    var html = '<div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">';
    html += '<h3 style="color:#f5c518;margin:0">📋 전체 로그</h3>';
    html += '<button class="pk-btn pk-btn-dark pk-btn-sm" data-action="poke_back">◀ 돌아가기</button>';
    html += '</div>';
    var logs = gState.log || [];
    for (var i = 0; i < logs.length; i++) {
        html += '<div class="pk-log-entry pk-log-' + logs[i].type + '">' + logs[i].msg + '</div>';
    }
    if (logs.length === 0) html += '<div style="text-align:center;color:#aaa">로그가 없습니다.</div>';
    return html;
}

function statusName(s) {
    var map = {burn:"화상🔥",poison:"독☠️",paralyze:"마비⚡",sleep:"잠듦💤",freeze:"얼음❄️",confuse:"혼란💫"};
    return map[s] || s || "";
}

// ═══════════════════════════════════════════════
// 🎯 이벤트 핸들러
// ═══════════════════════════════════════════════
window.poke_newGame = function() {
    gState = {phase:"starterSelect",subScreen:null,battleData:null,pendingEvo:null,pendingMoveLearn:null,eventLog:[],log:[],summarySource:null,summaryIdx:0,useItemKey:null};
    _eventLog = [];
    var body = document.querySelector("#pk-body");
    if (body) { body.innerHTML = renderStarterSelect(); bindHandlers(body); }
};

window.poke_continue = async function() {
    if (await loadAll()) {
        showToast("세이브 데이터를 불러왔습니다!");
        render();
    } else {
        showToast("저장된 데이터가 없습니다!");
    }
};

window.poke_selectStarter = async function(args) {
    var parts = args.split("|");
    var region = parts[0];
    var starterKey = parts[1];
    player = createNewPlayer("트레이너", starterKey);
    player.region = region;
    player.routeIdx = 0;
    gState.phase = "overworld";
    gState.subScreen = null;
    var pd = POKEDEX[starterKey];
    addLog("모험 시작! " + (pd?pd.n:starterKey) + "을(를) 선택했다!", "info");
    sfxLevelUp();
    await saveAll();
    render();
};

window.poke_switchRegion = async function(region) {
    if (player.region === region) return;
    player.region = region;
    player.routeIdx = 0;
    addLog("🚢 " + (region==="kanto"?"칸토":"성도") + " 지방으로 이동했다!", "info");
    showToast((region==="kanto"?"칸토":"성도") + " 지방으로 이동!");
    await saveAll();
    render();
};

window.poke_moveRoute = async function(dir) {
    var d = parseInt(dir);
    var routes = ROUTES[player.region];
    player.routeIdx = clamp(player.routeIdx + d, 0, routes.length - 1);
    var route = routes[player.routeIdx];
    addLog("📍 " + route.n + "(으)로 이동했다!", "info");
    await saveAll();
    render();
};

window.poke_wildBattle = function() {
    // 파티에 살아있는 포켓몬 있는지 확인
    var alive = false;
    for (var i = 0; i < player.party.length; i++) {
        if (player.party[i].currentHp > 0) { alive = true; break; }
    }
    if (!alive) {
        showToast("모든 포켓몬이 기절 상태입니다! 포켓몬센터에서 회복하세요.");
        return;
    }
    startWildBattle();
    sfxAttack();
    render();
};

window.poke_attack = async function(moveKey) {
    if (!gState || !gState.battleData) return;
    var bd = gState.battleData;
    if (bd.won || bd.lost || bd.fled || bd.caught) return;
    sfxAttack();
    executeTurn(moveKey);
    await saveAll();
    render();
};

window.poke_throwBall = async function(ballKey) {
    if (!gState || !gState.battleData) return;
    if (!player.bag[ballKey] || player.bag[ballKey] <= 0) {
        showToast(ITEMS[ballKey].n + "이(가) 없습니다!");
        return;
    }
    attemptCapture(ballKey);
    if (gState.battleData.caught) sfxCapture();
    else sfxFail();
    await saveAll();
    render();
};

window.poke_run = async function() {
    tryRun();
    await saveAll();
    render();
};

window.poke_battleParty = function() {
    if (!gState || !gState.battleData) return;
    gState.battleData._showPartySwitch = !gState.battleData._showPartySwitch;
    render();
};

window.poke_switchInBattle = async function(idx) {
    idx = parseInt(idx);
    if (!gState || !gState.battleData) return;
    var bd = gState.battleData;
    var poke = player.party[idx];
    if (!poke || poke.currentHp <= 0) return;
    if (idx === bd.myIdx) return;
    var myPoke = player.party[bd.myIdx];
    // 교체
    bd.myIdx = idx;
    bd.msg = [];
    bd.msg.push(myPoke.nickname + ", 돌아와!");
    bd.msg.push("가라, " + poke.nickname + "!");
    addLog(poke.nickname + "(으)로 교체!", "battle");
    // 기절로 인한 교체가 아니면 적 턴
    if (myPoke.currentHp > 0) {
        var emk = enemyChooseMove(bd.enemy);
        if (canAct(bd.enemy, bd)) {
            executeAttack(bd.enemy, poke, emk, bd);
        }
        doStatusDamage(bd.enemy, bd);
    }
    // 스탯 스테이지 리셋
    poke.statStages = {atk:0,def:0,spatk:0,spdef:0,spd:0,acc:0,eva:0};
    for (var i = 0; i < bd.msg.length; i++) addLog(bd.msg[i], "battle");
    bd._showPartySwitch = false;
    await saveAll();
    render();
};

window.poke_endBattle = async function() {
    gState.phase = "overworld";
    gState.battleData = null;
    gState.subScreen = null;
    // 진화 체크
    if (gState.pendingEvo) {
        render();
        return;
    }
    // 기술 배우기 체크
    if (gState.pendingMoveLearn) {
        render();
        return;
    }
    await saveAll();
    render();
};

window.poke_blackout = async function() {
    // 블랙아웃: 모든 포켓몬 회복, 골드 반감
    healAllPokemon();
    player.gold = Math.floor(player.gold * 0.5);
    player.routeIdx = 0;
    gState.phase = "overworld";
    gState.battleData = null;
    gState.subScreen = null;
    addLog("포켓몬센터에서 깨어났다... (소지금 반감)", "info");
    showToast("포켓몬센터에서 깨어났다...");
    await saveAll();
    render();
};

window.poke_center = async function() {
    healAllPokemon();
    sfxLevelUp();
    showToast("모든 포켓몬이 회복되었습니다! 🏥");
    await saveAll();
    render();
};

window.poke_openShop = function() { gState.subScreen = "shop"; render(); };
window.poke_openParty = function() { gState.subScreen = "party"; render(); };
window.poke_openPC = function() { gState.subScreen = "pc"; render(); };
window.poke_openBag = function() { gState.subScreen = "bag"; render(); };
window.poke_openLog = function() { gState.subScreen = "log"; render(); };
window.poke_back = function() { gState.subScreen = null; render(); };

window.poke_battleBag = function() {
    // 배틀 중 아이템 사용 - 간단하게 포션 종류만
    if (!gState || !gState.battleData) return;
    var bd = gState.battleData;
    var myPoke = player.party[bd.myIdx];
    // 가장 좋은 포션 자동 사용
    var healItems = ["fullrestore","hyperpotion","superpotion","potion"];
    for (var i = 0; i < healItems.length; i++) {
        var k = healItems[i];
        if (player.bag[k] && player.bag[k] > 0) {
            if (useItem(k, bd.myIdx)) {
                bd.msg = [myPoke.nickname + "에게 " + ITEMS[k].n + "을(를) 사용했다!"];
                // 적 턴
                var emk = enemyChooseMove(bd.enemy);
                if (canAct(bd.enemy, bd)) {
                    executeAttack(bd.enemy, myPoke, emk, bd);
                }
                doStatusDamage(bd.enemy, bd);
                for (var j = 0; j < bd.msg.length; j++) addLog(bd.msg[j], "battle");
                saveAll();
                render();
                return;
            }
        }
    }
    showToast("사용할 수 있는 회복 아이템이 없습니다!");
};

window.poke_buyItem = async function(key) {
    var item = ITEMS[key];
    if (!item || player.gold < item.buy) { showToast("골드가 부족합니다!"); return; }
    player.gold -= item.buy;
    player.bag[key] = (player.bag[key] || 0) + 1;
    showToast(item.n + " 구매 완료!");
    await saveAll();
    render();
};

window.poke_sellItem = async function(key) {
    var item = ITEMS[key];
    if (!item || !player.bag[key] || player.bag[key] <= 0) return;
    player.bag[key]--;
    if (player.bag[key] <= 0) delete player.bag[key];
    player.gold += item.sell;
    showToast(item.n + " 판매! ₩" + item.sell + " 획득");
    await saveAll();
    render();
};

window.poke_useItemSelect = function(key) {
    // 아이템 사용할 포켓몬 선택 (간단: 첫 번째 적합한 포켓몬에 자동 적용)
    var item = ITEMS[key];
    if (!item) return;
    for (var i = 0; i < player.party.length; i++) {
        var p = player.party[i];
        if (item.type === "heal" && p.currentHp > 0 && p.currentHp < p.stats[0]) {
            if (useItem(key, i)) { showToast(p.nickname + "에게 사용!"); saveAll(); render(); return; }
        }
        if (item.type === "fullheal" && p.currentHp > 0 && (p.currentHp < p.stats[0] || p.status)) {
            if (useItem(key, i)) { showToast(p.nickname + " 완전 회복!"); saveAll(); render(); return; }
        }
        if (item.type === "revive" && p.currentHp <= 0) {
            if (useItem(key, i)) { showToast(p.nickname + " 부활!"); saveAll(); render(); return; }
        }
        if (item.type === "cure" && p.status === item.value) {
            if (useItem(key, i)) { showToast(p.nickname + " 상태 회복!"); saveAll(); render(); return; }
        }
    }
    showToast("사용할 대상이 없습니다!");
};

window.poke_withdrawPC = async function(idx) {
    idx = parseInt(idx);
    if (player.party.length >= MAX_PARTY) { showToast("파티가 가득 찼습니다!"); return; }
    if (idx < 0 || idx >= player.pc.length) return;
    var poke = player.pc.splice(idx, 1)[0];
    player.party.push(poke);
    showToast(poke.nickname + "을(를) 꺼냈다!");
    await saveAll();
    render();
};

window.poke_depositPC = async function(idx) {
    idx = parseInt(idx);
    if (player.party.length <= 1) { showToast("파티에 최소 1마리는 있어야 합니다!"); return; }
    if (idx < 0 || idx >= player.party.length) return;
    var poke = player.party.splice(idx, 1)[0];
    player.pc.push(poke);
    showToast(poke.nickname + "을(를) PC에 보관했다!");
    await saveAll();
    render();
};

window.poke_showSummary = function(args) {
    var parts = args.split("|");
    gState.summarySource = parts[0];
    gState.summaryIdx = parseInt(parts[1]);
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
    if (gState.pendingEvo) {
        var poke = player.party[gState.pendingEvo.pokeIdx];
        addLog(poke ? poke.nickname + "의 진화가 취소되었다!" : "진화 취소", "info");
        gState.pendingEvo = null;
    }
    await saveAll();
    render();
};

window.poke_forgetMove = async function(args) {
    var ml = gState.pendingMoveLearn;
    if (!ml) { gState.pendingMoveLearn = null; render(); return; }
    var poke = player.party[ml.pokeIdx];
    if (!poke) { gState.pendingMoveLearn = null; render(); return; }
    if (args === "skip") {
        addLog(poke.nickname + "은(는) " + (MOVES[ml.moveKey]?MOVES[ml.moveKey].n:ml.moveKey) + "을(를) 배우지 않았다.", "info");
        gState.pendingMoveLearn = null;
        await saveAll();
        render();
        return;
    }
    var idx = parseInt(args);
    if (idx < 0 || idx >= poke.moves.length) return;
    var oldMv = MOVES[poke.moves[idx].key];
    var newMv = MOVES[ml.moveKey];
    addLog(poke.nickname + "은(는) " + (oldMv?oldMv.n:"???") + "을(를) 잊고 " + (newMv?newMv.n:"???") + "을(를) 배웠다!", "learn");
    poke.moves[idx] = {key: ml.moveKey, ppLeft: newMv ? newMv.pp : 10};
    gState.pendingMoveLearn = null;
    sfxLevelUp();
    await saveAll();
    render();
};

// ═══════════════════════════════════════════════
// 🔗 바인딩 & 초기화
// ═══════════════════════════════════════════════
function bindHandlers(container) {
    var els = container.querySelectorAll("[data-action]");
    for (var i = 0; i < els.length; i++) {
        (function(el) {
            el.addEventListener("click", function(e) {
                e.stopPropagation();
                var action = el.getAttribute("data-action");
                var args = el.getAttribute("data-args");
                if (el.hasAttribute("disabled")) return;
                if (window[action]) {
                    window[action](args);
                }
            });
        })(els[i]);
    }
}

async function initPlugin() {
    isVisible = (await lsGet(KEY_VIS)) !== "false";
    if (_hasRisu) {
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
                    await Risuai.showContainer('fullscreen');
                } else {
                    win.classList.add("hidden");
                    await Risuai.hideContainer();
                }
            }
        });
    }
    createUI();
    // 자동 로드 시도
    if (await loadAll()) {
        console.log(PLUGIN, "세이브 데이터 로드 완료");
    }
    render();
    console.log(PLUGIN, "플러그인 초기화 완료! v1.0");
}

await initPlugin();

} catch (error) {
    console.error("[Pokemon] 초기화 오류:", error);
}
})();
