import { useEffect, useState } from "react";
import { api, errorMessage } from "../../lib/api";
import { Section } from "../../components/UI";

const empty = {
  schemeName:"", shortDescription:"", detailedDescription:"", department:"", ministry:"",
  schemeType:"", category:"", status:"ACTIVE", officialWebsite:"", applicationLink:"",
  helplineNumber:"", contactEmail:"",
  eligibility:{genders:"",minAge:"",maxAge:"",occupations:"",locations:"",incomeMin:"",incomeMax:"",categories:"",beneficiaryTypes:"",requiredDocuments:"",otherCriteria:""},
  relatedFields:{occupations:"",interests:"",locations:"",participantCategories:"",eventTypes:""},
  documents:[] as any[], importantLinks:[] as any[],
};
const split=(v:string)=>v.split(",").map(x=>x.trim()).filter(Boolean);

export function GovernmentSchemesPage(){
  const [rows,setRows]=useState<any[]>([]),[form,setForm]=useState<any>(empty),[editingId,setEditingId]=useState<string|null>(null);
  const [doc,setDoc]=useState({name:"",url:"",type:"OTHER"}),[link,setLink]=useState({title:"",url:"",type:"OTHER"});
  const [error,setError]=useState(""),[message,setMessage]=useState(""),[loading,setLoading]=useState(false);
  const set=(k:string,v:any)=>setForm((x:any)=>({...x,[k]:v}));
  const setNested=(group:string,k:string,v:any)=>setForm((x:any)=>({...x,[group]:{...x[group],[k]:v}}));

  async function load(){try{const r=await api.get("/government-schemes",{params:{page:1,limit:100}});setRows(r.data.data?.schemes||[])}catch(e){setError(errorMessage(e))}}
  useEffect(()=>{load()},[]);

  function edit(s:any){
    const el=s.eligibility||{}, rf=s.relatedFields||{};
    setEditingId(s._id); setForm({
      ...empty,...s,
      eligibility:{genders:(el.genders||[]).join(", "),minAge:el.minAge??"",maxAge:el.maxAge??"",occupations:(el.occupations||[]).join(", "),locations:(el.locations||[]).join(", "),incomeMin:el.incomeRange?.min??"",incomeMax:el.incomeRange?.max??"",categories:(el.categories||[]).join(", "),beneficiaryTypes:(el.beneficiaryTypes||[]).join(", "),requiredDocuments:(el.requiredDocuments||[]).join(", "),otherCriteria:el.otherCriteria||""},
      relatedFields:{occupations:(rf.occupations||[]).join(", "),interests:(rf.interests||[]).join(", "),locations:(rf.locations||[]).join(", "),participantCategories:(rf.participantCategories||[]).join(", "),eventTypes:(rf.eventTypes||[]).join(", ")},
      documents:s.documents||[],importantLinks:s.importantLinks||[]
    });
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function payload(){
    const e=form.eligibility, r=form.relatedFields;
    const num=(v:any)=>v===""||v===null||v===undefined?null:Number(v);
    return {
      schemeName:form.schemeName,shortDescription:form.shortDescription,detailedDescription:form.detailedDescription,
      department:form.department,ministry:form.ministry,schemeType:form.schemeType,category:form.category,status:form.status,
      officialWebsite:form.officialWebsite,applicationLink:form.applicationLink,helplineNumber:form.helplineNumber,contactEmail:form.contactEmail,
      eligibility:{genders:split(e.genders),minAge:num(e.minAge),maxAge:num(e.maxAge),occupations:split(e.occupations),locations:split(e.locations),incomeRange:{min:num(e.incomeMin),max:num(e.incomeMax)},categories:split(e.categories),beneficiaryTypes:split(e.beneficiaryTypes),requiredDocuments:split(e.requiredDocuments),otherCriteria:e.otherCriteria},
      relatedFields:{occupations:split(r.occupations),interests:split(r.interests),locations:split(r.locations),participantCategories:split(r.participantCategories),eventTypes:split(r.eventTypes)},
      documents:form.documents,importantLinks:form.importantLinks
    };
  }

  async function save(e:any){e.preventDefault();setLoading(true);setError("");setMessage("");
    try{if(editingId)await api.patch(`/government-schemes/${editingId}`,payload());else await api.post("/government-schemes",payload());
      setMessage(editingId?"Government scheme updated.":"Government scheme created.");setEditingId(null);setForm(empty);await load();
    }catch(e){setError(errorMessage(e))}finally{setLoading(false)}
  }
  async function remove(id:string){if(!confirm("Delete this government scheme?"))return;try{await api.delete(`/government-schemes/${id}`);await load()}catch(e){setError(errorMessage(e))}}
  function addDoc(){if(!doc.name||!doc.url)return;set("documents",[...form.documents,doc]);setDoc({name:"",url:"",type:"OTHER"})}
  function addLink(){if(!link.title||!link.url)return;set("importantLinks",[...form.importantLinks,link]);setLink({title:"",url:"",type:"OTHER"})}

  return <><div className="title"><div><h1>Government Schemes</h1><p>Complete government scheme management using the backend schema.</p></div></div>
  {(error||message)&&<div className={error?"error":"success"}>{error||message}</div>}
  <Section title={editingId?"Edit government scheme":"Add government scheme"}>
  <form className="grid-form" onSubmit={save}>
    <input required placeholder="Scheme name *" value={form.schemeName} onChange={e=>set("schemeName",e.target.value)}/>
    <input placeholder="Ministry" value={form.ministry} onChange={e=>set("ministry",e.target.value)}/>
    <input placeholder="Department" value={form.department} onChange={e=>set("department",e.target.value)}/>
    <input placeholder="Scheme type" value={form.schemeType} onChange={e=>set("schemeType",e.target.value)}/>
    <input placeholder="Category" value={form.category} onChange={e=>set("category",e.target.value)}/>
    <select value={form.status} onChange={e=>set("status",e.target.value)}><option>ACTIVE</option><option>INACTIVE</option><option>DRAFT</option></select>
    <input placeholder="Official website" value={form.officialWebsite} onChange={e=>set("officialWebsite",e.target.value)}/>
    <input placeholder="Application link" value={form.applicationLink} onChange={e=>set("applicationLink",e.target.value)}/>
    <input placeholder="Helpline number" value={form.helplineNumber} onChange={e=>set("helplineNumber",e.target.value)}/>
    <input type="email" placeholder="Contact email" value={form.contactEmail} onChange={e=>set("contactEmail",e.target.value)}/>
    <textarea placeholder="Short description" value={form.shortDescription} onChange={e=>set("shortDescription",e.target.value)}/>
    <textarea placeholder="Detailed description" value={form.detailedDescription} onChange={e=>set("detailedDescription",e.target.value)}/>

    <div className="full"><h3>Eligibility</h3><div className="grid-form">
      <input placeholder="Genders (comma separated)" value={form.eligibility.genders} onChange={e=>setNested("eligibility","genders",e.target.value)}/>
      <input type="number" placeholder="Minimum age" value={form.eligibility.minAge} onChange={e=>setNested("eligibility","minAge",e.target.value)}/>
      <input type="number" placeholder="Maximum age" value={form.eligibility.maxAge} onChange={e=>setNested("eligibility","maxAge",e.target.value)}/>
      <input placeholder="Occupations (comma separated)" value={form.eligibility.occupations} onChange={e=>setNested("eligibility","occupations",e.target.value)}/>
      <input placeholder="Locations (comma separated)" value={form.eligibility.locations} onChange={e=>setNested("eligibility","locations",e.target.value)}/>
      <input type="number" placeholder="Income minimum" value={form.eligibility.incomeMin} onChange={e=>setNested("eligibility","incomeMin",e.target.value)}/>
      <input type="number" placeholder="Income maximum" value={form.eligibility.incomeMax} onChange={e=>setNested("eligibility","incomeMax",e.target.value)}/>
      <input placeholder="Categories (comma separated)" value={form.eligibility.categories} onChange={e=>setNested("eligibility","categories",e.target.value)}/>
      <input placeholder="Beneficiary types (comma separated)" value={form.eligibility.beneficiaryTypes} onChange={e=>setNested("eligibility","beneficiaryTypes",e.target.value)}/>
      <input placeholder="Required documents (comma separated)" value={form.eligibility.requiredDocuments} onChange={e=>setNested("eligibility","requiredDocuments",e.target.value)}/>
      <textarea placeholder="Other eligibility criteria" value={form.eligibility.otherCriteria} onChange={e=>setNested("eligibility","otherCriteria",e.target.value)}/>
    </div></div>

    <div className="full"><h3>Related fields</h3><div className="grid-form">
      <input placeholder="Occupations" value={form.relatedFields.occupations} onChange={e=>setNested("relatedFields","occupations",e.target.value)}/>
      <input placeholder="Interests" value={form.relatedFields.interests} onChange={e=>setNested("relatedFields","interests",e.target.value)}/>
      <input placeholder="Locations" value={form.relatedFields.locations} onChange={e=>setNested("relatedFields","locations",e.target.value)}/>
      <input placeholder="Participant categories" value={form.relatedFields.participantCategories} onChange={e=>setNested("relatedFields","participantCategories",e.target.value)}/>
      <input placeholder="Event types" value={form.relatedFields.eventTypes} onChange={e=>setNested("relatedFields","eventTypes",e.target.value)}/>
    </div></div>

    <div className="full"><h3>Documents</h3><div className="inline-form">
      <input placeholder="Document name" value={doc.name} onChange={e=>setDoc({...doc,name:e.target.value})}/>
      <input placeholder="Document URL" value={doc.url} onChange={e=>setDoc({...doc,url:e.target.value})}/>
      <input placeholder="Type" value={doc.type} onChange={e=>setDoc({...doc,type:e.target.value})}/>
      <button type="button" onClick={addDoc}>Add document</button>
    </div>{form.documents.map((d:any,i:number)=><div className="chip-row" key={i}>{d.name} · {d.type}<button type="button" onClick={()=>set("documents",form.documents.filter((_:any,j:number)=>i!==j))}>Remove</button></div>)}</div>

    <div className="full"><h3>Important links</h3><div className="inline-form">
      <input placeholder="Link title" value={link.title} onChange={e=>setLink({...link,title:e.target.value})}/>
      <input placeholder="URL" value={link.url} onChange={e=>setLink({...link,url:e.target.value})}/>
      <select value={link.type} onChange={e=>setLink({...link,type:e.target.value})}><option>OFFICIAL</option><option>APPLICATION</option><option>GUIDELINE</option><option>INFORMATION</option><option>OTHER</option></select>
      <button type="button" onClick={addLink}>Add link</button>
    </div>{form.importantLinks.map((l:any,i:number)=><div className="chip-row" key={i}>{l.title} · {l.type}<button type="button" onClick={()=>set("importantLinks",form.importantLinks.filter((_:any,j:number)=>i!==j))}>Remove</button></div>)}</div>

    <div className="full"><button className="primary" disabled={loading}>{loading?"Saving...":editingId?"Update scheme":"Create scheme"}</button>{editingId&&<button type="button" onClick={()=>{setEditingId(null);setForm(empty)}}>Cancel</button>}</div>
  </form></Section>

  <Section title="Government scheme list">{rows.length===0?<div className="empty">No schemes.</div>:<div className="table-wrap"><table><thead><tr><th>Scheme</th><th>Ministry</th><th>Department</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(s=><tr key={s._id}><td>{s.schemeName}</td><td>{s.ministry||"—"}</td><td>{s.department||"—"}</td><td>{s.category||"—"}</td><td>{s.status}</td><td><button onClick={()=>edit(s)}>Edit</button> <button onClick={()=>remove(s._id)}>Delete</button></td></tr>)}</tbody></table></div>}</Section>
  </>;
}
