import React,{createContext,useContext,useMemo,useState,useCallback,useEffect}from'react';
import{buildDatabaseIndex,getPlayerFromDatabase,resolveClub,setDecodedDatabase}from'../data/databaseBridge.js';
import{loadInjectedMenDatabase}from'../data/injectedMenDatabase.js';
import{useManagerData}from'./ManagerContext.jsx';
import{getCareerClubId}from'../engine/clubIdentity.js';
const C=createContext(null);
export function DatabaseProvider({children}){
 const manager=useManagerData();
 const[decoded,setDecoded]=useState({players:[],clubs:[],competitions:[],stadiums:[],contracts:[],nations:[],leagues:[],clubSquads:[],loaded:false});
 const[loading,setLoading]=useState(true); const[error,setError]=useState(null);
 useEffect(()=>{let alive=true;(async()=>{try{const data=await loadInjectedMenDatabase();if(alive){setDecoded({...data,loaded:true});setDecodedDatabase({...data,loaded:true});}}catch(e){console.error('FAMILY 26 database load failed',e);if(alive)setError(e);}finally{if(alive)setLoading(false);}})();return()=>{alive=false;};},[]);
 const index=useMemo(()=>buildDatabaseIndex(decoded),[decoded]);
 useEffect(()=>{setDecodedDatabase(decoded);},[decoded]);
 const upsertDecoded=useCallback((incoming={})=>setDecoded(prev=>({...prev,...incoming,loaded:true,players:incoming.players??prev.players,clubs:incoming.clubs??prev.clubs,competitions:incoming.competitions??prev.competitions,stadiums:incoming.stadiums??prev.stadiums,contracts:incoming.contracts??prev.contracts,nations:incoming.nations??prev.nations,leagues:incoming.leagues??prev.leagues,clubSquads:incoming.clubSquads??prev.clubSquads})),[]);
 const getPlayer=useCallback(id=>getPlayerFromDatabase(index,id),[index]); const getClub=useCallback(id=>resolveClub(index,id),[index]);
 // squadPlayers (from buildDatabaseIndex) is every squad-linked player across
 // every club in the database — useful for browsing, wrong for "our roster".
 // careerSquad/careerClub are the actual current club's own players, resolved
 // from the manager's profile, which is what most screens actually mean when
 // they ask for "the squad".
 const careerClubId=useMemo(()=>getCareerClubId(manager.profile,index),[manager.profile,index]);
 const careerClub=useMemo(()=>index.clubs.find(c=>String(c.id)===String(careerClubId)||String(c.uid)===String(careerClubId))||null,[index.clubs,careerClubId]);
 const careerSquad=useMemo(()=>careerClub?index.players.filter(p=>p.clubId!=null&&String(p.clubId)===String(careerClub.uid)):[],[index.players,careerClub]);
 const value=useMemo(()=>({index,players:index.players,squadPlayers:index.squadPlayers,worldPlayers:index.worldPlayers,careerSquad,careerClub,careerClubId,clubs:index.clubs,competitions:index.competitions,stadiums:index.stadiums,contracts:index.contracts,nations:index.nations,leagues:index.leagues,wonderkids:index.wonderkids,transferActivity:index.transferActivity,clubSquads:index.clubSquads,getPlayer,getClub,upsertDecoded,loading,error,getSnapshot:()=>({decoded}),getSourceStatus:()=>({mode:index.source,loading,error:error?.message??null,decodedPlayers:decoded.players.length,canonicalPlayers:index.players.length,canonicalClubs:index.clubs.length,canonicalCompetitions:index.competitions.length,canonicalStadiums:index.stadiums.length,canonicalContracts:index.contracts.length,clubSquadLinks:decoded.clubSquads.length})}),[index,careerSquad,careerClub,careerClubId,getPlayer,getClub,upsertDecoded,decoded,loading,error]);
 return <C.Provider value={value}>{children}</C.Provider>;
}
export function useDatabase(){const c=useContext(C);if(!c)throw new Error('useDatabase must be used within DatabaseProvider');return c;}
