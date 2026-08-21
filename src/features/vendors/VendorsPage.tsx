import { useEffect, useState } from "react";
import { api, errorMessage } from "../../lib/api";
import { Section } from "../../components/UI";

const emptyVendor = {
  name: "", geography: "", selcoEmpanelled: false, email: "",
  description: "", valueChain: "", secondaryValueChain: "",
  status: "ACTIVE",
  relatedFields: { interests: "", occupations: "", locations: "", participantCategories: "" },
  documents: [] as { name: string; url: string; type: string }[],
  importantLinks: [] as { title: string; url: string }[],
};

const split = (v: string) => v.split(",").map(x => x.trim()).filter(Boolean);

export function VendorsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyVendor);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [doc, setDoc] = useState({ name: "", url: "", type: "OTHER" });
  const [link, setLink] = useState({ title: "", url: "" });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key: string, value: any) =>
    setForm((x: any) => ({ ...x, [key]: value }));

  async function load() {
    try {
      const r = await api.get("/vendors", { params: { page: 1, limit: 100 } });
      setRows(r.data.data?.vendors || []);
    } catch (e) { setError(errorMessage(e)); }
  }
  useEffect(() => { load(); }, []);

  function edit(v: any) {
    setEditingId(v._id);
    setForm({
      ...emptyVendor,
      ...v,
      relatedFields: {
        interests: (v.relatedFields?.interests || []).join(", "),
        occupations: (v.relatedFields?.occupations || []).join(", "),
        locations: (v.relatedFields?.locations || []).join(", "),
        participantCategories: (v.relatedFields?.participantCategories || []).join(", "),
      },
      documents: v.documents || [],
      importantLinks: v.importantLinks || [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function payload() {
    return {
      name: form.name, geography: form.geography,
      selcoEmpanelled: !!form.selcoEmpanelled,
      email: form.email || null, description: form.description || null,
      valueChain: form.valueChain || null,
      secondaryValueChain: form.secondaryValueChain || null,
      status: form.status,
      relatedFields: {
        interests: split(form.relatedFields.interests),
        occupations: split(form.relatedFields.occupations),
        locations: split(form.relatedFields.locations),
        participantCategories: split(form.relatedFields.participantCategories),
      },
      documents: form.documents,
      importantLinks: form.importantLinks,
    };
  }

  async function save(e: any) {
    e.preventDefault(); setLoading(true); setError(""); setMessage("");
    try {
      if (editingId) await api.patch(`/vendors/${editingId}`, payload());
      else await api.post("/vendors", payload());
      setMessage(editingId ? "Vendor updated successfully." : "Vendor created successfully.");
      setEditingId(null); setForm(emptyVendor); await load();
    } catch (e) { setError(errorMessage(e)); } finally { setLoading(false); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this vendor?")) return;
    try { await api.delete(`/vendors/${id}`); await load(); }
    catch (e) { setError(errorMessage(e)); }
  }

  async function importCsv(e: any) {
    e.preventDefault(); if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    try {
      const r = await api.post("/vendors/import/csv", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setMessage(`CSV complete. Imported: ${r.data.data?.importedCount ?? 0}, Failed: ${r.data.data?.failedCount ?? 0}`);
      setFile(null); await load();
    } catch (e) { setError(errorMessage(e)); }
  }

  function addDoc() {
    if (!doc.name || !doc.url) return;
    set("documents", [...form.documents, doc]); setDoc({ name: "", url: "", type: "OTHER" });
  }
  function addLink() {
    if (!link.title || !link.url) return;
    set("importantLinks", [...form.importantLinks, link]); setLink({ title: "", url: "" });
  }

  return <>
    <div className="title"><div><h1>Vendors</h1><p>Complete vendor management using the backend schema.</p></div></div>
    {(error || message) && <div className={error ? "error" : "success"}>{error || message}</div>}

    <Section title={editingId ? "Edit vendor" : "Add vendor"}>
      <form className="grid-form" onSubmit={save}>
        <input required placeholder="Name *" value={form.name} onChange={e => set("name", e.target.value)} />
        <input required placeholder="Geography *" value={form.geography} onChange={e => set("geography", e.target.value)} />
        <input type="email" placeholder="Email" value={form.email || ""} onChange={e => set("email", e.target.value)} />
        <input placeholder="Value chain" value={form.valueChain || ""} onChange={e => set("valueChain", e.target.value)} />
        <input placeholder="Secondary value chain" value={form.secondaryValueChain || ""} onChange={e => set("secondaryValueChain", e.target.value)} />
        <select value={form.status} onChange={e => set("status", e.target.value)}><option>ACTIVE</option><option>INACTIVE</option></select>
        <label><input type="checkbox" checked={!!form.selcoEmpanelled} onChange={e => set("selcoEmpanelled", e.target.checked)} /> SELCO Empanelled</label>
        <textarea placeholder="Description" value={form.description || ""} onChange={e => set("description", e.target.value)} />
        <input placeholder="Related interests (comma separated)" value={form.relatedFields.interests} onChange={e => set("relatedFields", {...form.relatedFields, interests:e.target.value})} />
        <input placeholder="Related occupations (comma separated)" value={form.relatedFields.occupations} onChange={e => set("relatedFields", {...form.relatedFields, occupations:e.target.value})} />
        <input placeholder="Related locations (comma separated)" value={form.relatedFields.locations} onChange={e => set("relatedFields", {...form.relatedFields, locations:e.target.value})} />
        <input placeholder="Participant categories (comma separated)" value={form.relatedFields.participantCategories} onChange={e => set("relatedFields", {...form.relatedFields, participantCategories:e.target.value})} />

        <div className="full">
          <b>Documents</b>
          <div className="inline-form">
            <input placeholder="Document name" value={doc.name} onChange={e=>setDoc({...doc,name:e.target.value})}/>
            <input placeholder="Document URL" value={doc.url} onChange={e=>setDoc({...doc,url:e.target.value})}/>
            <input placeholder="Type" value={doc.type} onChange={e=>setDoc({...doc,type:e.target.value})}/>
            <button type="button" onClick={addDoc}>Add document</button>
          </div>
          {form.documents.map((d:any,i:number)=><div key={i} className="chip-row">{d.name} · {d.type}<button type="button" onClick={()=>set("documents",form.documents.filter((_:any,j:number)=>j!==i))}>Remove</button></div>)}
        </div>

        <div className="full">
          <b>Important links</b>
          <div className="inline-form">
            <input placeholder="Link title" value={link.title} onChange={e=>setLink({...link,title:e.target.value})}/>
            <input placeholder="URL" value={link.url} onChange={e=>setLink({...link,url:e.target.value})}/>
            <button type="button" onClick={addLink}>Add link</button>
          </div>
          {form.importantLinks.map((l:any,i:number)=><div key={i} className="chip-row">{l.title}<button type="button" onClick={()=>set("importantLinks",form.importantLinks.filter((_:any,j:number)=>j!==i))}>Remove</button></div>)}
        </div>

        <div className="full">
          <button className="primary" disabled={loading}>{loading ? "Saving..." : editingId ? "Update vendor" : "Create vendor"}</button>
          {editingId && <button type="button" onClick={()=>{setEditingId(null);setForm(emptyVendor)}}>Cancel</button>}
        </div>
      </form>
    </Section>

    <Section title="CSV import">
      <form className="inline-form" onSubmit={importCsv}>
        <input type="file" accept=".csv,.xlsx,.xls" onChange={e=>setFile(e.target.files?.[0] || null)} />
        <button className="primary">Import vendors</button>
      </form>
      <p className="muted">Backend import fields: name, geography, selcoEmpanelled, email, description, valueChain, secondaryValueChain, interests, occupations, locations, participantCategories, status.</p>
    </Section>

    <Section title="Vendor list">
      {rows.length===0 ? <div className="empty">No vendors.</div> :
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Geography</th><th>Value Chain</th><th>SELCO</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>{rows.map(v=><tr key={v._id}><td>{v.name}</td><td>{v.geography}</td><td>{v.valueChain||"—"}</td><td>{v.selcoEmpanelled?"Yes":"No"}</td><td>{v.status}</td><td><button onClick={()=>edit(v)}>Edit</button> <button onClick={()=>remove(v._id)}>Delete</button></td></tr>)}</tbody></table></div>}
    </Section>
  </>;
}
