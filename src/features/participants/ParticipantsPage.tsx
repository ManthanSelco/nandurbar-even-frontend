import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Filter, RotateCcw, Search, Users, ChevronLeft, ChevronRight, SlidersHorizontal, Trash2 } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { PageHeader, Section, Stat } from "../../components/UI";

const solutionLabels: Record<string,string> = { TECHNOLOGY_MACHINERY:"Technology / Machinery", SOLAR_ENERGY:"Solar / Energy", PRODUCT_DEVELOPMENT:"Product Development", BRANDING_MARKETING:"Branding & Marketing", PACKAGING:"Packaging", FINANCING:"Financing", TRAINING:"Training", MARKET_LINKAGE:"Market Linkage", OTHER:"Other" };
const statusLabel=(v:string)=>String(v||"—").replaceAll("_"," ");
const fmt=(v:any)=>v?new Date(v).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";

export function ParticipantsPage(){
 const [rows,setRows]=useState<any[]>([]),[stats,setStats]=useState<any>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [page,setPage]=useState(1),[totalPages,setTotalPages]=useState(1),[filters,setFilters]=useState({search:"",organizationType:"",sector:"",solution:"",solutionStatus:"",implementationStatus:"",assessmentStatus:"",preferredLanguage:""});
 const load=async(next=1, customFilters=filters)=>{setLoading(true);setError("");try{const params:any={page:next,limit:50};Object.entries(customFilters).forEach(([k,v])=>{if(v)params[k]=v});const [r,s]=await Promise.all([api.get("/participants",{params}),api.get("/participants/stats")]);const d=r.data?.data||{};setRows(d.participants||[]);setPage(d.page||next);setTotalPages(Math.max(d.totalPages||1,1));setStats(s.data?.data||null)}catch(e){setError(errorMessage(e))}finally{setLoading(false)}};
 useEffect(()=>{void load(1)},[]);
 const solutionGroups=useMemo(()=>stats?.bySolution||[],[stats]);
 const set=(k:string,v:string)=>setFilters(f=>({...f,[k]:v}));
 const removeParticipant=async(id:string,name:string)=>{
   if(!window.confirm(`Delete participant "${name||"this participant"}"? This will soft-delete the record and remove it from active participant lists.`))return;
   setError("");
   try{await api.delete(`/participants/${id}`);await load(page>1&&rows.length===1?page-1:page,filters);}
   catch(e){setError(errorMessage(e))}
 };
 const reset=()=>{const next={search:"",organizationType:"",sector:"",solution:"",solutionStatus:"",implementationStatus:"",assessmentStatus:"",preferredLanguage:""};setFilters(next);void load(1,next)};
 return <div className="participants-page">
  <PageHeader eyebrow="Participant Management" title="Participants" description="Search, segment and track every participant from registration to implementation." action={<Link className="button-primary" to="/register"><Users size={16}/> Open registration</Link>} />
  {stats&&<div className="stats"><Stat label="Total participants" value={String(stats.total||0)} hint={`${stats.today||0} registered today`}/><Stat label="Mobile captured" value={String(stats.mobileProvided||0)}/><Stat label="Volunteer assisted" value={String(stats.volunteer||0)}/><Stat label="Self registrations" value={String(stats.selfQr||0)}/></div>}
  <Section title="Demand overview" action={<span className="section-note">Click a solution to filter participants</span>}>
   <div className="solution-grid">{solutionGroups.map((x:any)=><button className={`solution-card ${filters.solution===x._id?"active":""}`} key={x._id} onClick={()=>{const next={...filters,solution:x._id};setFilters(next);void load(1,next)}}><span>{solutionLabels[x._id]||x._id}</span><strong>{x.count}</strong><small>participants</small></button>)}{!solutionGroups.length&&<div className="empty">No solution data yet. Complete post-event tracking to populate this view.</div>}</div>
  </Section>
  <Section title="Find participants" action={<button className="filter-toggle"><SlidersHorizontal size={15}/> Filters</button>}>
   <div className="filter-panel">
    <div className="search-field"><Search size={17}/><input placeholder="Search name, mobile, place or organisation..." value={filters.search} onChange={e=>set("search",e.target.value)}/></div>
    <div className="filter-grid">
      <select value={filters.organizationType} onChange={e=>set("organizationType",e.target.value)}><option value="">All organisation types</option><option value="INDIVIDUAL_ENTREPRENEUR">Individual entrepreneur</option><option value="SHG">SHG</option><option value="FPO_FPC">FPO/FPC</option><option value="COOPERATIVE">Cooperative</option><option value="NGO">NGO</option><option value="GOVERNMENT">Government</option><option value="PRIVATE_COMPANY">Private company</option><option value="OTHER">Other</option></select>
      <select value={filters.sector} onChange={e=>set("sector",e.target.value)}><option value="">All sectors</option><option value="FOOD_PROCESSING">Food processing</option><option value="AGRICULTURE">Agriculture</option><option value="LIVESTOCK">Livestock</option><option value="RETAIL_SERVICES">Retail & Services</option><option value="MANUFACTURING">Manufacturing</option><option value="OTHER">Other</option></select>
      <select value={filters.solutionStatus} onChange={e=>set("solutionStatus",e.target.value)}><option value="">All solution statuses</option>{["IDENTIFIED","RECOMMENDED","MATCHED","PLANNED","IN_PROGRESS","IMPLEMENTED","DEFERRED","REJECTED"].map(x=><option key={x} value={x}>{statusLabel(x)}</option>)}</select>
      <select value={filters.assessmentStatus} onChange={e=>set("assessmentStatus",e.target.value)}><option value="">All assessments</option><option value="NOT_STARTED">Not started</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option></select>
      <select value={filters.implementationStatus} onChange={e=>set("implementationStatus",e.target.value)}><option value="">All implementation</option>{["NOT_STARTED","PLANNED","APPROVED","IN_PROGRESS","IMPLEMENTED","DEFERRED","REJECTED"].map(x=><option key={x} value={x}>{statusLabel(x)}</option>)}</select>
      <select value={filters.preferredLanguage} onChange={e=>set("preferredLanguage",e.target.value)}><option value="">All languages</option><option value="mr">Marathi</option><option value="hi">Hindi</option><option value="en">English</option><option value="gu">Gujarati</option></select>
    </div>
    <div className="filter-actions"><button className="button-primary" onClick={()=>void load(1)}><Filter size={15}/> Apply filters</button><button onClick={reset}><RotateCcw size={15}/> Reset</button></div>
   </div>
  </Section>
  <Section title="Participant directory" action={<span className="section-note">{loading?"Loading…":`${rows.length} shown`}</span>}>
   {error&&<div className="error">{error}</div>}
   {loading?<div className="empty">Loading participants...</div>:!rows.length?<div className="empty">No participants match the selected filters.</div>:<>
    <div className="table-wrap participant-table"><table><thead><tr><th>Participant</th><th>Organisation</th><th>Sector</th><th>Demand / solutions</th><th>Journey</th><th>Language</th><th>Registered</th><th>Actions</th></tr></thead><tbody>{rows.map(p=><tr key={p._id}>
      <td><Link className="participant-name" to={`/admin/participants/${p._id}`}><span className="table-avatar">{String(p.name||"?").slice(0,1).toUpperCase()}</span><span><strong>{p.name||"Unnamed"}</strong><small>{p.mobile||"—"} · {p.location||"—"}</small></span></Link></td>
      <td><strong>{p.organizationName||"—"}</strong><small>{statusLabel(p.organizationType)}</small></td><td>{statusLabel(p.sector)}</td>
      <td><div className="table-chips">{(p.supportSolutions||[]).slice(0,2).map((x:string)=><span key={x}>{solutionLabels[x]||x}</span>)}{(p.supportSolutions||[]).length>2&&<span>+{p.supportSolutions.length-2}</span>}{!(p.supportSolutions||[]).length&&<small>Not captured</small>}</div></td>
      <td><div className="journey-status"><span>{statusLabel(p.assessmentStatus)}</span><span>{statusLabel(p.implementationStatus)}</span></div></td><td><span className="lang-badge">{String(p.preferredLanguage||"mr").toUpperCase()}</span></td><td>{fmt(p.createdAt)}</td>
      <td><button title="Delete participant" onClick={()=>void removeParticipant(p._id,p.name)}><Trash2 size={14}/> Delete</button></td>
    </tr>)}</tbody></table></div>
    <div className="pager"><span>Page <strong>{page}</strong> of <strong>{totalPages}</strong></span><div><button disabled={page<=1||loading} onClick={()=>void load(page-1)}><ChevronLeft size={15}/> Previous</button><button disabled={page>=totalPages||loading} onClick={()=>void load(page+1)}>Next <ChevronRight size={15}/></button></div></div>
   </>}
  </Section>
 </div>
}
