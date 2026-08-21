import { useEffect, useMemo, useState } from "react";
import { api, errorMessage } from "../../lib/api";
import { Section } from "../../components/UI";

type Participant = {
  _id: string;
  name: string;
  mobile?: string | null;
  whatsappAvailable: boolean;
  whatsappStatus?: string;
  participantStatus?: string;
  preferredLanguage?: string;
};

function statusLabel(value: string) {
  return String(value || "REGISTERED").replaceAll("_", " ");
}

export function WhatsAppPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [interactions, setInteractions] = useState<any[]>([]);

  async function loadParticipants() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/participants", {
        params: { search: search.trim() || undefined, limit: 100 },
      });
      setParticipants(response.data?.data?.participants || []);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadParticipants();
    // Search is intentionally applied by the Search button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eligible = useMemo(
    () => participants.filter((item) => item.mobile && item.whatsappAvailable),
    [participants]
  );

  const allSelected = eligible.length > 0 && eligible.every((item) => selected.includes(item._id));

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAll() {
    setSelected(allSelected ? [] : eligible.map((item) => item._id));
  }

  async function send() {
    if (!selected.length) {
      window.alert("Select at least one participant.");
      return;
    }
    if (!message.trim()) {
      window.alert("Enter a message.");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");
    try {
      if (selected.length === 1) {
        await api.post(`/whatsapp/participants/${selected[0]}/message`, { message: message.trim() });
      } else {
        await api.post("/whatsapp/bulk-send", { participantIds: selected, message: message.trim() });
      }
      setSuccess("WhatsApp message request completed.");
      setMessage("");
      setSelected([]);
      await loadParticipants();
    } catch (sendError) {
      const text = errorMessage(sendError);
      setError(text);
      window.alert(text);
    } finally {
      setSending(false);
    }
  }

  async function loadInteractions(participantId: string) {
    try {
      const response = await api.get(`/whatsapp/participants/${participantId}/interactions`);
      setInteractions(response.data?.data || []);
    } catch (loadError) {
      const text = errorMessage(loadError);
      setError(text);
      window.alert(text);
    }
  }

  return (
    <>
      <div className="title">
        <div>
          <h1>WhatsApp Communication</h1>
          <p>Monitor participant WhatsApp status and send operational messages.</p>
        </div>
      </div>

      <Section title="Participants">
        <div className="toolbar">
          <input placeholder="Search participant..." value={search} onChange={(event) => setSearch(event.target.value)} />
          <button onClick={() => void loadParticipants()}>Search</button>
          <button onClick={toggleAll}>{allSelected ? "Clear All" : "Select All"}</button>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {loading ? <div className="empty">Loading participants...</div> : participants.length === 0 ? <div className="empty">No participants found.</div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Select</th><th>Participant</th><th>Mobile</th><th>WhatsApp</th><th>Journey Status</th><th>Conversation</th><th>Language</th><th>Action</th></tr></thead>
              <tbody>
                {participants.map((participant) => {
                  const canMessage = Boolean(participant.mobile && participant.whatsappAvailable);
                  return <tr key={participant._id}>
                    <td><input type="checkbox" disabled={!canMessage} checked={selected.includes(participant._id)} onChange={() => toggle(participant._id)} /></td>
                    <td>{participant.name}</td>
                    <td>{participant.mobile || "—"}</td>
                    <td>{participant.whatsappStatus || (canMessage ? "PENDING" : "NOT_AVAILABLE")}</td>
                    <td>{statusLabel(participant.participantStatus || "REGISTERED")}</td>
                    <td>{statusLabel((participant as any).postEventStep || "NONE")}</td>
                    <td>{String(participant.preferredLanguage || "en").toUpperCase()}</td>
                    <td><button type="button" onClick={() => void loadInteractions(participant._id)}>History</button></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Send WhatsApp message">
        <textarea rows={5} placeholder="Write the message..." value={message} onChange={(event) => setMessage(event.target.value)} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, gap: 12 }}>
          <span>{selected.length} participant(s) selected</span>
          <button className="primary" disabled={sending || !selected.length} onClick={() => void send()}>{sending ? "Sending..." : "Send message"}</button>
        </div>
      </Section>

      <Section title="Selected participant WhatsApp history">
        {interactions.length === 0 ? <div className="empty">Select History on a participant to view WhatsApp interactions.</div> : interactions.map((item) => (
          <div className="answer" key={item._id}>
            <b>{item.direction} · {item.status}</b>
            <p>{item.message || "—"}</p>
            <small>{item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN") : "—"}</small>
          </div>
        ))}
      </Section>
    </>
  );
}
