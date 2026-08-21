import { NavLink, Outlet } from "react-router-dom";
import { logout, getStaff } from "../lib/auth";
import {
  LayoutDashboard, CalendarDays, Users, UserRoundCog, Store, Landmark,
  ClipboardList, Route, MessageCircle, HelpCircle, QrCode, LogOut, Menu, X
} from "lucide-react";
import { useState } from "react";

const items: any[] = [
  ["/admin/dashboard", "Dashboard", LayoutDashboard],
  ["/admin/events", "Nandurbar Event", CalendarDays],
  ["/admin/participants", "Participants", Users],
  ["/admin/volunteers", "Volunteers", UserRoundCog],
  ["/admin/vendors", "Vendors", Store],
  ["/admin/government-schemes", "Government Schemes", Landmark],
  ["/admin/requirements", "Requirements", ClipboardList],
  ["/admin/questions", "Questions", HelpCircle],
  ["/admin/qr", "Registration QR", QrCode],
  ["/admin/journey", "Participant Journey", Route],
  ["/admin/whatsapp", "WhatsApp", MessageCircle],
];

export function AdminLayout() {
  const s = getStaff();
  const [open, setOpen] = useState(false);

  return (
    <div className="shell">
      {open && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="brand-block">
          <div className="brand-mark">S</div>
          <div className="brand-copy">
            <strong>SELCO Foundation</strong>
            <span>Participant Journey</span>
          </div>
          <button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={18}/></button>
        </div>
        <div className="sidebar-event"><span className="live-dot"/> Nandurbar Event <small>20–21 Aug</small></div>
        <nav className="sidebar-nav">
          {items.map(([to, n, I]) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "nav active" : "nav"}>
              <I size={17} strokeWidth={1.9} /><span>{n}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidefoot">
          <div className="staff-card"><div className="avatar">{String(s?.name || "SA").slice(0,1).toUpperCase()}</div><div><strong>{s?.name || "Super Admin"}</strong><small>{s?.email || "Admin account"}</small></div></div>
          <button className="logout-btn" onClick={logout}><LogOut size={16}/> Logout</button>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={20}/></button>
          <div><b>Participant Management</b><span> / Nandurbar Event</span></div>
          <div className="topbar-right"><span className="status-pill"><span className="live-dot"/> System online</span><label>{s?.name || "Super Admin"}</label></div>
        </header>
        <div className="content"><Outlet /></div>
      </main>
    </div>
  );
}
