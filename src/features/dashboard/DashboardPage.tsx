import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Stat, Section } from "../../components/UI";
import { api, errorMessage } from "../../lib/api";

export function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get("/participants/stats");
        setStats(response.data?.data || null);
      } catch (loadError) {
        setError(errorMessage(loadError));
      }
    }
    void load();
  }, []);

  return (
    <>
      <div className="title">
        <div>
          <h1>Dashboard</h1>
          <p>Operational overview for the current Nandurbar event.</p>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="stats">
        <Stat label="Participants" value={stats ? String(stats.total) : "—"} hint={stats ? `${stats.today} registered today` : "Loading / unavailable"} />
        <Stat label="Mobile Provided" value={stats ? String(stats.mobileProvided) : "—"} />
        <Stat label="Volunteer Registrations" value={stats ? String(stats.volunteer) : "—"} />
        <Stat label="Self QR Registrations" value={stats ? String(stats.selfQr) : "—"} />
      </div>

      <Section title="Event">
        <div className="card"><strong>Nandurbar Event</strong><span> 20–21 August</span></div>
      </Section>

      <Section title="Quick actions">
        <div className="cards">
          {["Participants|/admin/participants", "Volunteers|/admin/volunteers", "Vendors|/admin/vendors", "Government Schemes|/admin/government-schemes", "Support Requirements|/admin/requirements", "Participant Journey|/admin/journey", "WhatsApp|/admin/whatsapp"].map((item) => {
            const [label, path] = item.split("|");
            return <Link className="card" to={path} key={path}>{label}</Link>;
          })}
        </div>
      </Section>
    </>
  );
}
