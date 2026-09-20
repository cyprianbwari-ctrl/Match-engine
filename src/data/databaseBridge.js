// FAMILY 26 — CANONICAL DATABASE GATEWAY
// The injected men's database is authoritative once loaded. Bootstrap seeds are only
// a temporary fallback before the database assets finish loading.
import { players as rosterSeed } from './bootstrap/legacyRosterSeed.js';
import { players as worldSeed, leagues as leagueSeed, wonderkids as wonderkidSeed, transferActivity as transferSeed } from './bootstrap/legacyWorldSeed.js';
import { clubIdentity, stadium as stadiumSeed } from './clubData.js';

const toNumber = (v, fallback = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fallback; };
const uidKey = (v) => { if (v == null || v === '') return ''; const n = Number(v); return Number.isFinite(n) ? String(Math.trunc(n)) : String(v).trim(); };
const money = (v) => { if (typeof v === 'number') return v; const s=String(v??'').replace(/[^0-9.]/g,''); const n=Number(s); if(!Number.isFinite(n)) return 0; return String(v).toUpperCase().includes('M')?n*1e6:String(v).toLowerCase().includes('k')?n*1e3:n; };

export function normalizePlayer(p, source='decoded', namespace=source) {
  const legacyId=p.id ?? p.uid ?? p.playerId;
  const stableId=p.canonicalId ?? (source==='roster'?legacyId:source==='world'?`player:world:${legacyId}`:`player:${legacyId}`);
  const position=p.position ?? p.pos ?? p.displayPos ?? null;
  const attributes=p.attributes ?? p.keyAttributes ?? {};
  return { id:stableId, legacyId, uid:p.uid??legacyId, personId:p.personId??p.person_id??null,
    name:p.name??p.fullName??'Unknown Player', club:p.club??null, clubId:p.clubId??null,
    nation:p.nation??p.nat??p.country??null, nat:p.nat??p.nation??p.country??null, country:p.country??p.nation??p.nat??null,
    position,pos:p.pos??position,positions:p.positions??[position].filter(Boolean),displayPos:p.displayPos??position,
    age:toNumber(p.age),dateOfBirth:p.dateOfBirth??p.date_of_birth??null,height:toNumber(p.height) || null,weight:toNumber(p.weight)||null,
    ca:toNumber(p.ca??p.rating??p.ovr),pa:toNumber(p.pa??p.potential??p.rating??p.ovr),rating:toNumber(p.rating??p.ovr??p.ca),potential:toNumber(p.potential??p.pa??p.rating??p.ovr),
    attributes,keyAttributes:p.keyAttributes??attributes,vector51:Array.isArray(p.vector51)?p.vector51:null,
    contract:p.contract??p.contractExpiry??null,contractExpiry:p.contractExpiry??p.contract??null,wage:p.wage??null,wageValue:money(p.wage),value:p.value ?? p.valueNumber ?? null,valueNumber:Number.isFinite(Number(p.valueNumber)) ? Number(p.valueNumber) : money(p.value),
    reputation:p.reputation??(toNumber(p.rating??p.ovr??p.ca)>=88?'World Class':toNumber(p.rating??p.ovr??p.ca)>=80?'Worldwide':'Continental'),
    fit:toNumber(p.fit,80),rate:toNumber(p.rate,6.8),form:Array.isArray(p.form)?p.form:[7,7,7,7],morale:p.morale??'Good',availability:p.availability??'Available',playTime:p.playTime??'Squad Player',
    role:p.role??null,tacticalRole:p.tacticalRole??p.roleLabel??p.role??null,roleLabel:p.roleLabel??p.tacticalRole??p.role??null,number:p.number??null,league:p.league??null,competitionId:p.competitionId??null,
    source,namespace,squadSeed:Boolean(p.squadSeed),raw:p.raw??p };
}
function normalizeClub(c){ return {id:c.id??`club:${c.name}`,uid:c.uid??null,name:c.name??c.full_name,shortName:c.shortName??c.short_name,country:c.country??null,countryId:c.countryId??c.nation_id??null,league:c.league??null,leagueId:c.leagueId??c.league_id??null,stadiumId:c.stadiumId??c.stadium_id??null,type:c.type??c.raw?.type??null,gender:c.gender??c.raw?.gender??null,reputation:toNumber(c.reputation),raw:c.raw??c}; }
function normalizeCompetition(c){ if(!c)return null; return {id:c.id??`competition:${c.name??c.league}`,uid:c.uid??null,competitionId:c.competitionId??c.competition_id??null,name:c.name??c.league??c.title,shortName:c.shortName??null,country:c.country??null,nationId:c.nationId??c.nation_id??null,type:c.type??'League',level:c.level??c.raw?.level??null,isWomen:c.isWomen??c.raw?.is_women??false,reputation:toNumber(c.reputation),raw:c.raw??c}; }
let runtimeDecoded={players:[],clubs:[],competitions:[],stadiums:[],contracts:[],nations:[],leagues:[],clubSquads:[],loaded:false};
export function setDecodedDatabase(decoded={}){ runtimeDecoded={...runtimeDecoded,...decoded,loaded:Boolean(decoded.loaded??runtimeDecoded.loaded)}; }

export function buildDatabaseIndex(decoded={}){
  const authoritative=Boolean(decoded.loaded || decoded.players?.length>0);
  const basePlayers=authoritative ? (decoded.players||[]).map(p=>normalizePlayer(p,'decoded','family26-mens-only')) : [...worldSeed.map(p=>normalizePlayer(p,'world','global-world')), ...rosterSeed.map(p=>normalizePlayer(p,'roster','club-squad'))];
  const players=basePlayers;
  const clubRows=authoritative?(decoded.clubs||[]):[];
  const clubMap=new Map();
  for(const c of clubRows){const n=normalizeClub(c); if(n.name)clubMap.set(String(n.name).toLowerCase(),n);}
  for(const p of players){if(p.club&&!clubMap.has(String(p.club).toLowerCase()))clubMap.set(String(p.club).toLowerCase(),normalizeClub({id:`club:${p.club}`,name:p.club}));}
  if(!authoritative && clubIdentity?.name)clubMap.set(String(clubIdentity.name).toLowerCase(),normalizeClub(clubIdentity));
  const competitions=(authoritative?(decoded.competitions||[]):leagueSeed).map(normalizeCompetition).filter(Boolean);
  const stadiums=authoritative?(decoded.stadiums||[]):(stadiumSeed?[{id:'stadium:primary',name:stadiumSeed.name??stadiumSeed,club:clubIdentity?.name??null,raw:stadiumSeed}]:[]);
  const contracts=authoritative?(decoded.contracts||[]):players.filter(p=>p.contract).map(p=>({playerId:p.id,uid:p.uid,club:p.club,contract:p.contract,wage:p.wage,wageValue:p.wageValue}));
  const nations=authoritative?(decoded.nations||[]):[];
  const leagues=authoritative?(decoded.leagues?.length?decoded.leagues:competitions):leagueSeed;
  const squadIds=new Set((decoded.clubSquads||[]).map(s=>uidKey(s.player_uid??s.playerId)));
  const squadClubByPlayerUid=new Map((decoded.clubSquads||[]).filter(s=>s.player_uid!=null&&s.club_uid!=null).map(s=>[uidKey(s.player_uid),uidKey(s.club_uid)]));
  // Prefer the authoritative club_squads relationship when determining a player's club.
  // This prevents stale club_id values from leaking players into the wrong career squad.
  for(const p of players){ const linked=squadClubByPlayerUid.get(uidKey(p.uid)); if(linked!=null) p.clubId=linked; }
  return {version:authoritative?'family26-canonical-men-db-v2':'family26-canonical-v1',source:authoritative?'decoded-men-database':'bootstrap-seed',players,squadPlayers:authoritative?players.filter(p=>squadIds.has(uidKey(p.uid))):players.filter(p=>p.squadSeed||p.club===clubIdentity?.name),worldPlayers:authoritative?players.filter(p=>!squadIds.has(uidKey(p.uid))):players.filter(p=>!p.squadSeed&&p.club!==clubIdentity?.name),clubs:[...clubMap.values()],competitions,stadiums,contracts,nations,leagues,wonderkids:[],transferActivity:[],clubSquads:decoded.clubSquads||[],byPlayerId:new Map(players.map(p=>[String(p.id),p])),byUid:new Map(players.map(p=>[String(p.uid),p])),byClubName:new Map([...clubMap.values()].map(c=>[String(c.name).toLowerCase(),c]))};
}
export function getPlayerFromDatabase(index,id){return index?.byPlayerId?.get(String(id))??index?.byUid?.get(String(id))??null;}
export function resolveClub(index,club){return index?.byClubName?.get(String(club??'').toLowerCase())??null;}
export function getCanonicalDatabase(){return buildDatabaseIndex(runtimeDecoded);}
export function getCanonicalPlayers(){return getCanonicalDatabase().players;}
