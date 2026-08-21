import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="section"><div className="section-head"><div><h2>{title}</h2></div>{action}</div>{children}</section>;
}
export function Empty({ title, text }: { title: string; text: string }) {
  return <div className="empty"><b>{title}</b><p>{text}</p></div>;
}
export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div className="stat"><small>{label}</small><strong>{value}</strong>{hint && <em>{hint}</em>}</div>;
}
export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow || "Participant Journey"}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="page-actions">{action}</div>}</div>;
}
export function Breadcrumb({ children }: { children: ReactNode }) { return <div className="breadcrumb"><ChevronRight size={14}/>{children}</div>; }
