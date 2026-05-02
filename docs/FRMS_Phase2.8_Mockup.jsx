import { useState } from "react";

const COLORS = {
  bg: "#101010", surface: "#171717", elevated: "#1e1e1e", border: "#262626",
  text: "#ededed", muted: "#8b8b8b", dimmed: "#555",
  primary: "#4F8EF7", primaryMuted: "rgba(79,142,247,0.12)",
  success: "#22c55e", successMuted: "rgba(34,197,94,0.12)",
  warning: "#f59e0b", warningMuted: "rgba(245,158,11,0.12)",
  danger: "#ef4444", dangerMuted: "rgba(239,68,68,0.12)",
  blue: "#3b82f6", blueMuted: "rgba(59,130,246,0.12)",
};

const fisherfolk = [
  { id: "2025-175205000-08252", name: "Toston, Ambrocio R.", brgy: "Suqui", sex: "M", cat: "Boat Owner, Capture Fishing", status: ["New","Active"], contact: "+639814808928" },
  { id: "2024-175205000-07896", name: "Balmes, Anthony B.", brgy: "Balite", sex: "M", cat: "Boat Owner, Capture Fishing", status: ["Renewed","Active"], contact: "+639099104564" },
  { id: "MR-CL-003484-2017", name: "Padua, Doris R.", brgy: "San Rafael", sex: "F", cat: "Boat Owner/Operator", status: ["Active"], contact: "+639074187728" },
  { id: "MR-CL-001143-2015", name: "Ortega, Maria Leizl M.", brgy: "Maidlang", sex: "F", cat: "Boat Owner, Capture Fishing", status: ["Violation"], contact: "+639517393625" },
  { id: "MR-CL-001239-2015", name: "Aguirre, Renato S.", brgy: "Maidlang", sex: "M", cat: "Boat Owner, Capture Fishing", status: ["Renewed","Active"], contact: "+639706020600" },
  { id: "03-175205000-06226", name: "Padua, Shella C.", brgy: "San Rafael", sex: "F", cat: "Boat Owner/Operator", status: ["Active"], contact: "+639703648341" },
  { id: "2024-175205000-07808", name: "Dimasaca, Eric M.", brgy: "Baruyan", sex: "M", cat: "Capture Fishing", status: ["Inactive"], contact: "+639956578269" },
  { id: "2025-175205000-08254", name: "Delos Santos, Antonio Jr.", brgy: "Canubing II", sex: "M", cat: "Aquaculture", status: ["New","Active"], contact: "+639925811015" },
  { id: "MR-CL-002178-2015", name: "Dela Cruz, Rosalita A.", brgy: "San Rafael", sex: "F", cat: "Capture Fishing, Vendor", status: ["Renewed"], contact: "+639667828821" },
  { id: "MR-CL-000088-2015", name: "Bool, Aldrin F.", brgy: "Silonay", sex: "M", cat: "Boat Owner, Capture Fishing", status: ["Active"], contact: "+639305115103" },
  { id: "MR-CL-000006-2015", name: "Dela Peña, Lorelie B.", brgy: "Tawagan", sex: "F", cat: "Boat Owner, Vendor", status: ["Active"], contact: "+639953865285" },
  { id: "2025-175205000-08255", name: "Caringal, Florencio O.", brgy: "Silonay", sex: "M", cat: "Boat Owner, Capture Fishing", status: ["New","Active"], contact: "+639164570028" },
  { id: "MR-CL-000685-2015", name: "Abac, Fernady S.", brgy: "Wawa", sex: "M", cat: "Boat Owner, Capture Fishing", status: ["Renewed"], contact: "+639266701921" },
  { id: "MR-CL-000947-2015", name: "Corables, Meriam P.", brgy: "Wawa", sex: "F", cat: "Boat Owner, Capture Fishing", status: ["Inactive"], contact: "+639178356654" },
  { id: "2025-175205000-08258", name: "Aceveda, Leian S.", brgy: "Ibaba West", sex: "F", cat: "Boat Owner/Operator", status: ["New","Active"], contact: "+639940859509" },
];

const vessels = [
  { mfvr: "MFVR-CL-000142", name: "San Pedro II", type: "Motorized", mat: "Wood", dim: "3.2×1.1×0.6m", hp: 16, owner: "Toston, Ambrocio", gear: "Hook and Line", status: "Active" },
  { mfvr: "MFVR-CL-000087", name: "Ang Pangarap", type: "Motorized", mat: "Wood", dim: "4.5×1.3×0.8m", hp: 25, owner: "Bool, Aldrin F.", gear: "Gill Net", status: "Active" },
  { mfvr: "MFVR-CL-000201", name: "Tres Marias", type: "Motorized", mat: "Fiberglass", dim: "5.1×1.5×0.9m", hp: 40, owner: "Aguirre, Renato S.", gear: "Pots and Traps", status: "Active" },
  { mfvr: "MFVR-CL-000055", name: "Bagong Silang", type: "Non-motorized", mat: "Wood", dim: "2.8×0.9×0.5m", hp: null, owner: "Dela Cruz, Rosalita", gear: "Hook and Line", status: "Active" },
  { mfvr: "MFVR-CL-000318", name: "Malakas", type: "Motorized", mat: "Wood", dim: "3.8×1.2×0.7m", hp: 16, owner: "Ortega, Maria Leizl", gear: "Gill Net", status: "Impounded" },
  { mfvr: "MFVR-CL-000412", name: "Star of Hope", type: "Motorized", mat: "Composite", dim: "4.2×1.4×0.8m", hp: 25, owner: "Fortu, Julio Jr.", gear: "Scoop Net", status: "Active" },
  { mfvr: "MFVR-CL-000099", name: "Daluyong", type: "Motorized", mat: "Wood", dim: "3.5×1.0×0.6m", hp: 16, owner: "Caringal, Florencio", gear: "Troll Line", status: "Active" },
  { mfvr: "MFVR-CL-000175", name: "Bukang Liwayway", type: "Motorized", mat: "Wood", dim: "3.9×1.1×0.7m", hp: 16, owner: "Ponsones, Florante", gear: "Hook and Line", status: "Inactive" },
];

const violations = [
  { date: "Apr 28, 2025", subj: "Illegal fishing method", fisher: "Ortega, Maria Leizl M.", vessel: "Malakas", by: "Pedro Ramos", status: "Active" },
  { date: "Apr 25, 2025", subj: "Fishing in restricted area", fisher: "Cadacio, Florante C.", vessel: "—", by: "Roberto Ilagan", status: "Active" },
  { date: "Apr 22, 2025", subj: "Unregistered vessel", fisher: "Bacay, Benhur C.", vessel: "—", by: "Pedro Ramos", status: "Active" },
  { date: "Apr 18, 2025", subj: "Use of banned fishing gear", fisher: "Villena, Ronilo A.", vessel: "—", by: "Roberto Ilagan", status: "Lifted" },
  { date: "Apr 10, 2025", subj: "Violation of closed season", fisher: "Monterey, Randy F.", vessel: "Star of Hope", by: "Pedro Ramos", status: "Lifted" },
  { date: "Mar 28, 2025", subj: "Fishing in restricted area", fisher: "Baja, Junver F.", vessel: "—", by: "Roberto Ilagan", status: "Active" },
  { date: "Mar 15, 2025", subj: "Trawling in municipal waters", fisher: "Abac, Frederick S.", vessel: "Bagong Silang", by: "Pedro Ramos", status: "Lifted" },
];

const logs = [
  { time: "Apr 28, 10:32 AM", user: "Pedro Ramos", action: "VIOLATION", entity: "Ortega, Maria Leizl", detail: "Filed: Illegal fishing + vessel impound", ip: "192.168.1.45" },
  { time: "Apr 28, 10:15 AM", user: "Maria Santos", action: "CREATE", entity: "Delos Santos, Antonio Jr.", detail: "New registration — Canubing II", ip: "192.168.1.12" },
  { time: "Apr 28, 9:47 AM", user: "Juan Reyes", action: "RENEW", entity: "Balmes, Anthony B.", detail: "Renewed for 2025 — contact updated", ip: "192.168.1.10" },
  { time: "Apr 28, 9:30 AM", user: "Maria Santos", action: "REQUEST", entity: "Padua, Doris R.", detail: "Edit request: contact number change", ip: "192.168.1.12" },
  { time: "Apr 28, 9:02 AM", user: "Juan Reyes", action: "APPROVE", entity: "Aguirre, Renato S.", detail: "Approved address change", ip: "192.168.1.10" },
  { time: "Apr 28, 8:45 AM", user: "Ana Cruz", action: "CREATE", entity: "Vessel: Ang Pangarap", detail: "New vessel — linked to Bool, Aldrin", ip: "192.168.1.15" },
  { time: "Apr 28, 8:30 AM", user: "Juan Reyes", action: "LOGIN", entity: "—", detail: "Session started", ip: "192.168.1.10" },
  { time: "Apr 27, 4:12 PM", user: "Juan Reyes", action: "LIFT", entity: "Bool, Aldrin F.", detail: "Violation lifted — resolved with warning", ip: "192.168.1.10" },
];

const users = [
  { name: "System Admin", email: "webmaster@frms.app", role: "Super Admin", status: "Active", last: "Today", init: "SA", color: COLORS.danger },
  { name: "Juan Reyes", email: "juan.reyes@calapan.gov.ph", role: "Admin", status: "Active", last: "Today", init: "JR", color: COLORS.primary },
  { name: "Maria Santos", email: "maria.santos@calapan.gov.ph", role: "Encoder", status: "Active", last: "Today", init: "MS", color: COLORS.success },
  { name: "Ana Cruz", email: "ana.cruz@calapan.gov.ph", role: "Encoder", status: "Active", last: "Yesterday", init: "AC", color: COLORS.success },
  { name: "Pedro Ramos", email: "pedro.ramos@calapan.gov.ph", role: "Bantay Dagat", status: "Active", last: "Today", init: "PR", color: COLORS.warning },
  { name: "Roberto Ilagan", email: "roberto.ilagan@calapan.gov.ph", role: "Bantay Dagat", status: "Active", last: "Apr 27", init: "RI", color: COLORS.warning },
  { name: "Lorna Castillo", email: "lorna.castillo@calapan.gov.ph", role: "Viewer", status: "Active", last: "Apr 25", init: "LC", color: COLORS.dimmed },
  { name: "Eduardo Mendoza", email: "eduardo.mendoza@calapan.gov.ph", role: "Encoder", status: "Deactivated", last: "Mar 15", init: "EM", color: COLORS.dimmed },
];

const Badge = ({ type, children }) => {
  const styles = { New: { bg: COLORS.primaryMuted, color: COLORS.primary }, Active: { bg: COLORS.successMuted, color: COLORS.success }, Renewed: { bg: COLORS.blueMuted, color: COLORS.blue }, Inactive: { bg: "rgba(100,100,100,0.15)", color: COLORS.muted }, Violation: { bg: COLORS.dangerMuted, color: COLORS.danger }, Impounded: { bg: COLORS.dangerMuted, color: COLORS.danger }, Lifted: { bg: "rgba(100,100,100,0.2)", color: COLORS.dimmed }, Pending: { bg: COLORS.warningMuted, color: COLORS.warning }, Approved: { bg: COLORS.successMuted, color: COLORS.success }, Rejected: { bg: COLORS.dangerMuted, color: COLORS.danger }, CREATE: { bg: COLORS.successMuted, color: COLORS.success }, RENEW: { bg: COLORS.blueMuted, color: COLORS.blue }, APPROVE: { bg: COLORS.successMuted, color: COLORS.success }, REQUEST: { bg: COLORS.warningMuted, color: COLORS.warning }, VIOLATION: { bg: COLORS.dangerMuted, color: COLORS.danger }, LIFT: { bg: COLORS.successMuted, color: COLORS.success }, LOGIN: { bg: "rgba(100,100,100,0.1)", color: COLORS.dimmed }, Deactivated: { bg: "rgba(100,100,100,0.15)", color: COLORS.dimmed } };
  const s = styles[type] || styles[children] || { bg: COLORS.primaryMuted, color: COLORS.primary };
  return <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 9999, padding: "2px 10px", fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>{children || type}</span>;
};

const MobileBadge = ({ first }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 9999, padding: "2px 8px", fontSize: 11, background: first ? COLORS.primaryMuted : "rgba(100,100,100,0.1)", color: first ? COLORS.primary : COLORS.dimmed }}>
    {first ? "📱 Mobile First" : "🖥️ Mobile Ready"}
  </span>
);

const KPI = ({ val, label, trend, color }) => {
  // Brighter color variants for dark background readability
  const brightMap = {
    [COLORS.primary]: "#70A8FF",
    [COLORS.success]: "#4ADE80",
    [COLORS.blue]: "#60A5FA",
    [COLORS.warning]: "#FBC02D",
    [COLORS.danger]: "#FF6B6B",
  };
  const displayColor = color ? (brightMap[color] || color) : "#FFFFFF";
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "18px 20px" }}>
      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", color: displayColor, lineHeight: 1.1 }}>{val}</div>
      <div style={{ fontSize: 12, color: "#a0a0a0", marginTop: 4, fontWeight: 500 }}>{label}</div>
      {trend && <div style={{ fontSize: 12, marginTop: 5, fontWeight: 600, color: trend.startsWith("↑") ? "#4ADE80" : trend.startsWith("↓") ? "#FBC02D" : "#888" }}>{trend}</div>}
    </div>
  );
};

const Card = ({ children, style }) => (
  <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, ...style }}>{children}</div>
);

const BarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.val));
  return <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{data.map((d, i) => (
    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 12, color: COLORS.muted, minWidth: 90 }}>{d.label}</span>
      <div style={{ flex: 1, background: COLORS.elevated, borderRadius: 3, height: 18 }}>
        <div style={{ height: "100%", width: `${(d.val / max) * 100}%`, background: COLORS.primary, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 12, minWidth: 32, textAlign: "right" }}>{d.val}</span>
    </div>
  ))}</div>;
};

const Table = ({ headers, children }) => (
  <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
    <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
      <thead><tr>{headers.map((h, i) => <th key={i} style={{ textAlign: "left", padding: "10px 12px", color: COLORS.muted, fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

const Td = ({ children, mono, style }) => <td style={{ padding: "10px 12px", borderBottom: `1px solid ${COLORS.elevated}`, fontFamily: mono ? "monospace" : "inherit", fontSize: mono ? 11 : 13, ...style }}>{children}</td>;

const Btn = ({ primary, danger, children, onClick, small, style: s }) => (
  <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: small ? "4px 10px" : "8px 16px", borderRadius: 8, fontSize: small ? 11 : 13, fontWeight: 500, cursor: "pointer", border: danger ? "none" : primary ? "none" : `1px solid ${COLORS.border}`, background: danger ? COLORS.danger : primary ? COLORS.primary : COLORS.elevated, color: danger || primary ? "#fff" : COLORS.text, transition: "all 0.15s", ...s }}>{children}</button>
);

const SideNav = ({ active, onNav }) => {
  const sections = [
    { label: "Main", items: [{ id: "dashboard", icon: "⊞", name: "Dashboard" }, { id: "fisherfolk", icon: "👥", name: "Fisherfolk" }, { id: "vessels", icon: "⛵", name: "Vessels" }] },
    { label: "Operations", items: [{ id: "scanner", icon: "📷", name: "QR Scanner" }, { id: "violations", icon: "⚠", name: "Violations" }, { id: "requests", icon: "✋", name: "Edit Requests", badge: 5 }, { id: "ids", icon: "🪪", name: "ID Generation" }, { id: "renewal", icon: "🔄", name: "Renewal" }] },
    { label: "Programs", items: [{ id: "ayuda", icon: "🤝", name: "Ayuda Programs" }, { id: "reports", icon: "📄", name: "Reports" }] },
    { label: "Analytics", items: [{ id: "kanban", icon: "📋", name: "Tasks" }] },
    { label: "System", items: [{ id: "logs", icon: "📝", name: "Audit Logs" }, { id: "users", icon: "👤", name: "Users" }, { id: "import", icon: "📥", name: "Data Import" }, { id: "settings", icon: "⚙", name: "Settings" }] },
  ];
  return (
    <div style={{ width: 210, minHeight: "100%", borderRight: `1px solid ${COLORS.border}`, padding: 10, flexShrink: 0 }}>
      {sections.map((s, si) => (
        <div key={si}>
          <div style={{ fontSize: 10, color: COLORS.dimmed, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", padding: "12px 10px 4px" }}>{s.label}</div>
          {s.items.map(item => (
            <div key={item.id} onClick={() => onNav(item.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 6, fontSize: 13, cursor: "pointer", color: active === item.id ? COLORS.primary : COLORS.muted, background: active === item.id ? COLORS.primaryMuted : "transparent", fontWeight: active === item.id ? 600 : 400, transition: "all 0.1s", marginBottom: 1 }}>
              <span style={{ fontSize: 13, width: 18, textAlign: "center" }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.name}</span>
              {item.badge && <span style={{ background: COLORS.danger, color: "#fff", fontSize: 10, padding: "1px 6px", borderRadius: 99 }}>{item.badge}</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const [viewMode, setViewMode] = useState("charts");
  const [densityView, setDensityView] = useState("geographic");

  const brgyData = [
    { n: "Lazareto", v: 383, elderly: 68, voters: 312, viol: 5, lat: 13.42, lng: 121.18, hue: "0, 100%, 65%" },
    { n: "Baruyan", v: 342, elderly: 55, voters: 278, viol: 4, lat: 13.41, lng: 121.19, hue: "25, 95%, 55%" },
    { n: "Silonay", v: 266, elderly: 48, voters: 218, viol: 6, lat: 13.39, lng: 121.17, hue: "200, 85%, 55%" },
    { n: "Ibaba West", v: 228, elderly: 39, voters: 185, viol: 2, lat: 13.40, lng: 121.18, hue: "145, 70%, 45%" },
    { n: "Navotas", v: 221, elderly: 41, voters: 180, viol: 3, lat: 13.38, lng: 121.18, hue: "218, 90%, 64%" },
    { n: "Maidlang", v: 163, elderly: 28, voters: 133, viol: 8, lat: 13.43, lng: 121.19, hue: "330, 75%, 55%" },
    { n: "Parang", v: 136, elderly: 22, voters: 110, viol: 1, lat: 13.44, lng: 121.20, hue: "50, 90%, 50%" },
    { n: "Nag-iba II", v: 118, elderly: 19, voters: 96, viol: 1, lat: 13.37, lng: 121.17, hue: "175, 65%, 45%" },
    { n: "Canubing I", v: 105, elderly: 16, voters: 86, viol: 0, lat: 13.36, lng: 121.16, hue: "195, 75%, 55%" },
    { n: "Wawa", v: 101, elderly: 18, voters: 82, viol: 2, lat: 13.41, lng: 121.20, hue: "15, 85%, 50%" },
    { n: "M. Pangalan", v: 99, elderly: 15, voters: 80, viol: 0, lat: 13.42, lng: 121.21, hue: "80, 65%, 45%" },
    { n: "Balite", v: 98, elderly: 17, voters: 79, viol: 1, lat: 13.43, lng: 121.17, hue: "220, 70%, 55%" },
    { n: "Nag-iba I", v: 96, elderly: 14, voters: 78, viol: 0, lat: 13.37, lng: 121.18, hue: "160, 60%, 50%" },
    { n: "Tawagan", v: 95, elderly: 16, voters: 77, viol: 0, lat: 13.45, lng: 121.19, hue: "350, 65%, 50%" },
    { n: "Pachoca", v: 68, elderly: 11, voters: 55, viol: 0, lat: 13.44, lng: 121.21, hue: "110, 55%, 45%" },
    { n: "Canubing II", v: 55, elderly: 8, voters: 45, viol: 0, lat: 13.35, lng: 121.16, hue: "240, 60%, 55%" },
    { n: "Ibaba East", v: 48, elderly: 7, voters: 39, viol: 0, lat: 13.40, lng: 121.19, hue: "60, 70%, 48%" },
    { n: "San Rafael", v: 42, elderly: 6, voters: 34, viol: 0, lat: 13.39, lng: 121.20, hue: "210, 70%, 55%" },
    { n: "Suqui", v: 38, elderly: 5, voters: 31, viol: 0, lat: 13.41, lng: 121.17, hue: "130, 55%, 50%" },
    { n: "Lumang Bayan", v: 27, elderly: 4, voters: 22, viol: 0, lat: 13.40, lng: 121.185, hue: "190, 50%, 48%" },
  ];

  const GeoMiniMap = ({ data, valueKey, label, color }) => {
    const maxVal = Math.max(...data.map(d => d[valueKey]));
    return (
      <div style={{ borderRadius: 10, position: "relative", height: 260, overflow: "hidden" }}>
        <iframe
          src="https://www.openstreetmap.org/export/embed.html?bbox=121.14%2C13.34%2C121.24%2C13.46&layer=mapnik"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", borderRadius: 10, filter: "brightness(0.3) saturate(0.3) hue-rotate(200deg)" }}
          title="Map"
        />
        {data.map((b, i) => {
          const x = ((b.lng - 121.14) / 0.10) * 100;
          const y = ((13.46 - b.lat) / 0.12) * 100;
          const val = b[valueKey];
          const ratio = val / maxVal;
          const r = Math.max(10, ratio * 34);
          return (
            <div key={i} style={{ position: "absolute", left: `${Math.min(92,Math.max(4,x))}%`, top: `${Math.min(92,Math.max(4,y))}%`, transform: "translate(-50%,-50%)", width: r*2, height: r*2, borderRadius: "50%", background: color ? `hsla(${color}, ${0.25 + ratio * 0.5})` : `hsla(${b.hue.split(",")[0]}, 80%, 60%, ${0.25 + ratio * 0.45})`, border: `1.5px solid ${color ? `hsla(${color}, 0.35)` : `hsla(${b.hue.split(",")[0]}, 70%, 55%, 0.35)`}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10 + Math.floor(val), cursor: "pointer", transition: "all 0.3s", boxShadow: `0 0 ${ratio * 8}px ${color ? `hsla(${color}, 0.25)` : `hsla(${b.hue.split(",")[0]}, 60%, 50%, 0.25)`}` }}>
              {r > 12 && <span style={{ fontSize: r > 20 ? 10 : 7, fontWeight: 700, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}>{val}</span>}
              {r > 18 && <span style={{ fontSize: 6, color: "rgba(255,255,255,0.7)", textAlign: "center", lineHeight: 1, textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>{b.n}</span>}
            </div>
          );
        })}
        <div style={{ position: "absolute", bottom: 6, left: 6, background: "rgba(0,0,0,0.7)", borderRadius: 4, padding: "3px 6px", fontSize: 8, color: "#aaa", zIndex: 50 }}>📍 {label}</div>
      </div>
    );
  };

  return (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div><h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>Dashboard</h1><p style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>Calapan City — Registration Year 2025</p></div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <MobileBadge />
        {/* Global view toggle */}
        <div style={{ display: "flex", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div onClick={() => setViewMode("charts")} style={{ padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", background: viewMode === "charts" ? COLORS.primaryMuted : "transparent", color: viewMode === "charts" ? COLORS.primary : COLORS.muted, transition: "all 0.15s" }}>📊 Charts</div>
          <div onClick={() => setViewMode("maps")} style={{ padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", background: viewMode === "maps" ? COLORS.primaryMuted : "transparent", color: viewMode === "maps" ? COLORS.primary : COLORS.muted, transition: "all 0.15s" }}>🗺️ Maps</div>
        </div>
        <select style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, color: COLORS.text }}><option>2025</option><option>2024</option></select>
      </div>
    </div>

    {/* KPI Row — restructured: Total = New + Renewed | Active vs Inactive | Key metrics */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
      {/* Total Registered = New + Renewed */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", color: "#FFFFFF", lineHeight: 1.1 }}>2,937</div>
        <div style={{ fontSize: 12, color: "#a0a0a0", marginTop: 4, fontWeight: 500 }}>Total registered</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10, borderTop: `1px solid ${COLORS.border}`, paddingTop: 10 }}>
          <div><div style={{ fontSize: 18, fontWeight: 800, color: "#70A8FF" }}>532</div><div style={{ fontSize: 10, color: "#888", fontWeight: 500 }}>New</div></div>
          <div><div style={{ fontSize: 18, fontWeight: 800, color: "#60A5FA" }}>487</div><div style={{ fontSize: 10, color: "#888", fontWeight: 500 }}>Renewed</div></div>
        </div>
      </div>
      {/* Active vs Inactive */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", color: "#4ADE80", lineHeight: 1.1 }}>2,568</div>
        <div style={{ fontSize: 12, color: "#a0a0a0", marginTop: 4, fontWeight: 500 }}>Active members</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10, borderTop: `1px solid ${COLORS.border}`, paddingTop: 10 }}>
          <div><div style={{ fontSize: 18, fontWeight: 800, color: "#FBC02D" }}>346</div><div style={{ fontSize: 10, color: "#888", fontWeight: 500 }}>Not renewed</div></div>
          <div><div style={{ fontSize: 18, fontWeight: 800, color: "#FF6B6B" }}>23</div><div style={{ fontSize: 10, color: "#888", fontWeight: 500 }}>Violations</div></div>
        </div>
      </div>
      {/* Sex distribution */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", color: "#FFFFFF", lineHeight: 1.1 }}>2,937</div>
        <div style={{ fontSize: 12, color: "#a0a0a0", marginTop: 4, fontWeight: 500 }}>Gender distribution</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10, borderTop: `1px solid ${COLORS.border}`, paddingTop: 10 }}>
          <div><div style={{ fontSize: 18, fontWeight: 800, color: "#60A5FA" }}>69.4%</div><div style={{ fontSize: 10, color: "#888", fontWeight: 500 }}>Male (2,038)</div></div>
          <div><div style={{ fontSize: 18, fontWeight: 800, color: "#F472B6" }}>30.6%</div><div style={{ fontSize: 10, color: "#888", fontWeight: 500 }}>Female (899)</div></div>
        </div>
      </div>
      {/* Demographics */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", color: "#FF6B6B", lineHeight: 1.1 }}>487</div>
        <div style={{ fontSize: 12, color: "#a0a0a0", marginTop: 4, fontWeight: 500 }}>Senior citizens (60+)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 4, marginTop: 10, borderTop: `1px solid ${COLORS.border}`, paddingTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 10, color: "#888" }}>Eligible voters (18+)</span><span style={{ fontSize: 14, fontWeight: 800, color: "#70A8FF" }}>1,842</span></div>
        </div>
      </div>
      {/* Vessels + Violations */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", color: "#FFFFFF", lineHeight: 1.1 }}>412</div>
        <div style={{ fontSize: 12, color: "#a0a0a0", marginTop: 4, fontWeight: 500 }}>Vessels registered</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 4, marginTop: 10, borderTop: `1px solid ${COLORS.border}`, paddingTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 10, color: "#888" }}>Active violations</span><span style={{ fontSize: 14, fontWeight: 800, color: "#FF6B6B" }}>23</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 10, color: "#888" }}>Impounded vessels</span><span style={{ fontSize: 14, fontWeight: 800, color: "#FBC02D" }}>5</span></div>
        </div>
      </div>
    </div>

    {/* Density map — real OSM tiles for geographic, distinct colored grid for table */}
    <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 16, marginBottom: 16 }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Fisherfolk density by barangay</div>
          <div style={{ display: "flex", gap: 4 }}>
            <Btn small onClick={() => setDensityView("geographic")} style={densityView === "geographic" ? { background: COLORS.primaryMuted, color: COLORS.primary } : {}}>🗺️ Map</Btn>
            <Btn small onClick={() => setDensityView("grid")} style={densityView === "grid" ? { background: COLORS.primaryMuted, color: COLORS.primary } : {}}>🔢 Grid</Btn>
          </div>
        </div>
        {densityView === "geographic" ? (
          <div style={{ borderRadius: 10, position: "relative", height: 340, overflow: "hidden" }}>
            {/* Real OpenStreetMap tile background */}
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=121.14%2C13.34%2C121.24%2C13.46&layer=mapnik"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", borderRadius: 10, filter: "brightness(0.35) saturate(0.4) hue-rotate(200deg)" }}
              title="Calapan City Map"
            />
            {/* Barangay overlay bubbles on real map */}
            {brgyData.map((b, i) => {
              const x = ((b.lng - 121.14) / 0.10) * 100;
              const y = ((13.46 - b.lat) / 0.12) * 100;
              const ratio = b.v / 383;
              const r = Math.max(14, Math.sqrt(ratio) * 46);
              return (
                <div key={i} style={{ position: "absolute", left: `${Math.min(94,Math.max(3,x))}%`, top: `${Math.min(94,Math.max(3,y))}%`, transform: "translate(-50%,-50%)", width: r*2, height: r*2, borderRadius: "50%", background: `hsla(${b.hue}, ${0.25 + ratio * 0.45})`, border: `1.5px solid hsla(${b.hue.split(",")[0]}, 60%, 65%, 0.4)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10 + Math.floor(b.v), transition: "all 0.3s", boxShadow: `0 0 ${ratio * 12}px hsla(${b.hue.split(",")[0]}, 70%, 50%, 0.3)` }}>
                  <span style={{ fontSize: r > 22 ? 11 : r > 14 ? 8 : 6, fontWeight: 700, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}>{b.v}</span>
                  {r > 20 && <span style={{ fontSize: 7, color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: 1, textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}>{b.n}</span>}
                </div>
              );
            })}
            <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.75)", borderRadius: 6, padding: "6px 8px", fontSize: 9, zIndex: 50 }}>
              <div style={{ color: "#aaa", fontWeight: 600, marginBottom: 3 }}>Barangays</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3, maxWidth: 170 }}>
                {brgyData.slice(0, 8).map((b, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: `hsl(${b.hue})`, opacity: 0.8 }} /><span style={{ fontSize: 7, color: "#999" }}>{b.n}</span></div>)}
              </div>
            </div>
            <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.75)", borderRadius: 6, padding: "4px 8px", fontSize: 9, color: "#aaa", zIndex: 50 }}>📍 Calapan City · OpenStreetMap</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
            {brgyData.map((b, i) => (
              <div key={i} style={{ background: `hsla(${b.hue}, 0.2)`, borderRadius: 6, padding: "10px 4px", textAlign: "center", border: `1px solid hsla(${b.hue.split(",")[0]}, 50%, 50%, 0.15)` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: `hsl(${b.hue})` }}>{b.v}</div>
                <div style={{ fontSize: 8, color: COLORS.muted, marginTop: 1 }}>{b.n}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Recent activity</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
          {[{ c: COLORS.success, u: "Maria Santos", a: "registered", t: "Delos Santos, Antonio Jr.", ago: "2m" },
            { c: COLORS.primary, u: "Juan Reyes", a: "renewed", t: "Balmes, Anthony B.", ago: "15m" },
            { c: COLORS.danger, u: "Pedro Ramos", a: "filed violation", t: "Ortega, Maria Leizl", ago: "1h" },
            { c: COLORS.warning, u: "Maria Santos", a: "edit request", t: "Padua, Doris R.", ago: "2h" },
            { c: COLORS.success, u: "Ana Cruz", a: "vessel registered", t: "Ang Pangarap", ago: "4h" },
            { c: COLORS.blue, u: "Juan Reyes", a: "approved edit", t: "Aguirre, Renato S.", ago: "5h" },
            { c: COLORS.success, u: "Juan Reyes", a: "lifted violation", t: "Bool, Aldrin F.", ago: "1d" }
          ].map((e, i) => <div key={i} style={{ display: "flex", gap: 6 }}><span style={{ color: e.c, flexShrink: 0 }}>●</span><div style={{ lineHeight: 1.4 }}><strong>{e.u}</strong> {e.a} <strong>{e.t}</strong><br /><span style={{ color: COLORS.dimmed }}>{e.ago} ago</span></div></div>)}
        </div>
      </Card>
    </div>

    {/* Row: Barangay comparison + Age distribution — toggles between charts and maps */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{viewMode === "maps" ? "🗺️ " : ""}Barangay comparison (top 10)</div>
        {viewMode === "charts" ? (
          <BarChart data={brgyData.slice(0, 10).map(d => ({ label: d.n, val: d.v }))} />
        ) : (
          <GeoMiniMap data={brgyData} valueKey="v" label="Total fisherfolk" />
        )}
      </Card>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{viewMode === "maps" ? "🗺️ " : ""}Age demographics — seniors (60+)</div>
        {viewMode === "charts" ? (
          <>
            {[{ l: "18-29", v: 648, c: COLORS.primary, w: 22 }, { l: "30-39", v: 822, c: COLORS.blue, w: 28 }, { l: "40-49", v: 705, c: COLORS.success, w: 24 }, { l: "50-59", v: 275, c: COLORS.warning, w: 10 }, { l: "60-69", v: 312, c: "#f97316", w: 11 }, { l: "70-79", v: 128, c: COLORS.danger, w: 5 }, { l: "80+", v: 47, c: "#dc2626", w: 2 }].map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: COLORS.muted, minWidth: 42 }}>{d.l}</span>
                <div style={{ flex: 1, background: COLORS.elevated, borderRadius: 3, height: 16 }}><div style={{ height: "100%", width: `${d.w}%`, background: d.c, borderRadius: 3 }} /></div>
                <span style={{ fontSize: 11, minWidth: 28, textAlign: "right" }}>{d.v}</span>
              </div>
            ))}
          </>
        ) : (
          <GeoMiniMap data={brgyData} valueKey="elderly" label="Seniors (60+) by barangay" color="0, 70%, 55%" />
        )}
      </Card>
    </div>

    {/* Row: Voter analysis + Family clusters */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{viewMode === "maps" ? "🗺️ " : "🗳️ "}Potential voters by barangay</div>
        {viewMode === "charts" ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
              {[...brgyData].sort((a, b) => b.voters - a.voters).slice(0, 10).map((b, i) => {
                const intensity = b.voters / 312;
                return <div key={i} style={{ background: `rgba(59,130,246,${0.1 + intensity * 0.5})`, borderRadius: 6, padding: "10px 4px", textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: intensity > 0.5 ? "#fff" : COLORS.text }}>{b.voters}</div>
                  <div style={{ fontSize: 8, color: intensity > 0.5 ? "rgba(255,255,255,0.65)" : COLORS.muted, marginTop: 2 }}>{b.n}</div>
                </div>;
              })}
            </div>
            <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 12, paddingTop: 10, fontSize: 11, color: COLORS.muted }}>💡 Top 3: Lazareto (312), Baruyan (278), Silonay (218)</div>
          </>
        ) : (
          <GeoMiniMap data={brgyData} valueKey="voters" label="Eligible voters (18+)" color="220, 80%, 55%" />
        )}
      </Card>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{viewMode === "maps" ? "🗺️ " : "👨‍👩‍👧‍👦 "}Family clusters (surname)</div>
        {viewMode === "charts" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {[{ s: "Dela Cruz", b: "San Rafael", c: 28 }, { s: "Bool", b: "Silonay", c: 24 }, { s: "Balmes", b: "Silonay", c: 19 }, { s: "Fortu", b: "Silonay", c: 17 }, { s: "Aguirre", b: "Lazareto", c: 15 }, { s: "Ponsones", b: "Silonay", c: 14 }, { s: "Cadacio", b: "Maidlang", c: 12 }].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: COLORS.muted, minWidth: 80 }}>{f.s}</span>
                <div style={{ flex: 1, background: COLORS.elevated, borderRadius: 3, height: 14 }}><div style={{ height: "100%", width: `${(f.c / 28) * 100}%`, background: "#6BA3F7", borderRadius: 3 }} /></div>
                <span style={{ fontSize: 11, minWidth: 24, textAlign: "right" }}>{f.c}</span>
                <span style={{ fontSize: 10, color: COLORS.dimmed, minWidth: 65 }}>{f.b}</span>
              </div>
            ))}
          </div>
        ) : (
          <GeoMiniMap data={[
            { n: "Silonay", lat: 13.39, lng: 121.17, hue: "218, 90%, 64%", fam: 58 },
            { n: "Lazareto", lat: 13.42, lng: 121.18, hue: "0, 100%, 65%", fam: 85 },
            { n: "Baruyan", lat: 13.41, lng: 121.19, hue: "25, 95%, 55%", fam: 72 },
            { n: "San Rafael", lat: 13.39, lng: 121.20, hue: "210, 70%, 55%", fam: 9 },
            { n: "Maidlang", lat: 13.43, lng: 121.19, hue: "330, 75%, 55%", fam: 36 },
            { n: "Ibaba West", lat: 13.40, lng: 121.18, hue: "145, 70%, 45%", fam: 51 },
            { n: "Navotas", lat: 13.38, lng: 121.18, hue: "218, 90%, 64%", fam: 49 },
            { n: "Wawa", lat: 13.41, lng: 121.20, hue: "15, 85%, 50%", fam: 22 },
            { n: "Balite", lat: 13.43, lng: 121.17, hue: "220, 70%, 55%", fam: 20 },
            { n: "Parang", lat: 13.44, lng: 121.20, hue: "50, 90%, 50%", fam: 30 },
          ] } valueKey="fam" label="Family clusters by barangay" color="205, 80%, 58%" />
        )}
      </Card>
    </div>

    {/* Row: Category + Trends + Birthdays */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Category distribution</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[{ n: "Capture Fishing", v: 1025, c: COLORS.primary }, { n: "Boat Owner + Capture", v: 876, c: COLORS.blue }, { n: "Vendor", v: 490, c: COLORS.warning }, { n: "Boat Owner/Operator", v: 179, c: COLORS.success }, { n: "Gleaning", v: 157, c: "#6BA3F7" }, { n: "Aquaculture", v: 27, c: "#06b6d4" }, { n: "Fish Processing", v: 11, c: COLORS.muted }].map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: d.c, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: COLORS.muted, flex: 1 }}>{d.n}</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{d.v}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Registration trend</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140 }}>
          {[{ y: "'20", t: 1842 }, { y: "'21", t: 1904 }, { y: "'22", t: 2022 }, { y: "'23", t: 2202 }, { y: "'24", t: 2405 }, { y: "'25", t: 2937 }].map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 9, fontWeight: 600 }}>{d.t}</span>
              <div style={{ width: "70%", height: `${(d.t / 2937) * 110}px`, background: COLORS.primary, borderRadius: 3, minHeight: 8 }} />
              <span style={{ fontSize: 9, color: COLORS.muted }}>{d.y}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>🎂 Upcoming birthdays</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
          {[{ n: "Caringal, Florencio", b: "Silonay", d: "Apr 29", away: "Tomorrow!" }, { n: "Dela Peña, Romeo", b: "Tawagan", d: "Apr 30", away: "2 days" }, { n: "Aceveda, Leian", b: "Ibaba West", d: "May 3", away: "5 days" }, { n: "Abac, Fernady", b: "Wawa", d: "May 8", away: "10 days" }, { n: "Bool, Aldrin", b: "Silonay", d: "May 12", away: "14 days" }].map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: i < 4 ? `1px solid ${COLORS.elevated}` : "none" }}>
              <div><strong>{p.n}</strong><br /><span style={{ color: COLORS.dimmed, fontSize: 10 }}>{p.b} · {p.d}</span></div>
              <span style={{ background: i === 0 ? COLORS.warningMuted : COLORS.elevated, color: i === 0 ? COLORS.warning : COLORS.muted, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: i === 0 ? 600 : 400 }}>{p.away}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>

    {/* Row: Violation hotspots */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{viewMode === "maps" ? "🗺️ " : "⚠ "}Violation hotspots</div>
        {viewMode === "charts" ? (
          <>
            {[{ b: "Maidlang", v: 8 }, { b: "Silonay", v: 6 }, { b: "Lazareto", v: 5 }, { b: "Baruyan", v: 4 }, { b: "Navotas", v: 3 }].map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: COLORS.muted, minWidth: 75 }}>{d.b}</span>
                <div style={{ flex: 1, background: COLORS.elevated, borderRadius: 3, height: 14 }}><div style={{ height: "100%", width: `${(d.v / 8) * 100}%`, background: COLORS.danger, borderRadius: 3 }} /></div>
                <span style={{ fontSize: 11, minWidth: 20, textAlign: "right", fontWeight: 600 }}>{d.v}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 10, paddingTop: 8, fontSize: 11, color: COLORS.muted }}>⚠ Maidlang leads with 8 violations</div>
          </>
        ) : (
          <GeoMiniMap data={brgyData.filter(b => b.viol > 0)} valueKey="viol" label="Violations by barangay" color="0, 75%, 55%" />
        )}
      </Card>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{viewMode === "maps" ? "🗺️ " : "👴 "}Senior citizens by barangay</div>
        {viewMode === "charts" ? (
          <BarChart data={[...brgyData].sort((a, b) => b.elderly - a.elderly).slice(0, 8).map(d => ({ label: d.n, val: d.elderly }))} />
        ) : (
          <GeoMiniMap data={brgyData} valueKey="elderly" label="Seniors (60+)" color="25, 90%, 50%" />
        )}
      </Card>
    </div>
  </div>
  );
};

const FisherfolkList = ({ onSelect }) => {
  const [subTab, setSubTab] = useState("list");

  const dailyNew = [
    { id: "2025-175205000-08260", name: "Salazar, Renzon P.", brgy: "Lazareto", type: "New", photo: true, sig: true, time: "8:15 AM", printed: true },
    { id: "2025-175205000-08261", name: "Montoya, Gina R.", brgy: "Baruyan", type: "New", photo: false, sig: false, time: "9:02 AM", printed: false },
    { id: "2025-175205000-08262", name: "Villaruel, Marco A.", brgy: "Silonay", type: "New", photo: true, sig: true, time: "9:30 AM", printed: true },
    { id: "2025-175205000-08263", name: "Catapang, Liza M.", brgy: "Navotas", type: "New", photo: false, sig: false, time: "10:11 AM", printed: false },
    { id: "MR-CL-001239-2015", name: "Aguirre, Renato S.", brgy: "Maidlang", type: "Renewal", photo: true, sig: true, time: "10:45 AM", printed: false },
    { id: "MR-CL-000088-2015", name: "Bool, Aldrin F.", brgy: "Silonay", type: "Update", photo: true, sig: true, time: "11:20 AM", printed: true },
    { id: "2024-175205000-07896", name: "Balmes, Anthony B.", brgy: "Balite", type: "Renewal", photo: true, sig: true, time: "1:30 PM", printed: false },
    { id: "2025-175205000-08264", name: "Reyes, Danilo T.", brgy: "Wawa", type: "New", photo: true, sig: true, time: "2:15 PM", printed: false },
  ];

  const printQueue = [
    { id: "2025-175205000-08261", name: "Montoya, Gina R.", brgy: "Baruyan", regDate: "Today", photo: false, sig: false, status: "Incomplete" },
    { id: "2025-175205000-08263", name: "Catapang, Liza M.", brgy: "Navotas", regDate: "Today", photo: false, sig: false, status: "Incomplete" },
    { id: "MR-CL-003484-2017", name: "Padua, Doris R.", brgy: "San Rafael", regDate: "Apr 25", photo: true, sig: false, status: "Incomplete" },
    { id: "MR-CL-001239-2015", name: "Aguirre, Renato S.", brgy: "Maidlang", regDate: "Today", photo: true, sig: true, status: "Ready" },
    { id: "2024-175205000-07896", name: "Balmes, Anthony B.", brgy: "Balite", regDate: "Today", photo: true, sig: true, status: "Ready" },
    { id: "2025-175205000-08264", name: "Reyes, Danilo T.", brgy: "Wawa", regDate: "Today", photo: true, sig: true, status: "Ready" },
    { id: "03-175205000-06226", name: "Padua, Shella C.", brgy: "San Rafael", regDate: "Apr 22", photo: true, sig: true, status: "Ready" },
  ];

  return (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <div><h1 style={{ fontSize: 22, fontWeight: 600 }}>Fisherfolk</h1><p style={{ fontSize: 13, color: COLORS.muted }}>2,937 total records</p></div>
      <div style={{ display: "flex", gap: 8 }}><MobileBadge /><Btn primary>+ Register new</Btn></div>
    </div>

    {/* Sub-tabs */}
    <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${COLORS.border}` }}>
      {[{ id: "list", label: "📋 Master List" }, { id: "daily", label: "📅 Today's Operations" }].map(t => (
        <div key={t.id} onClick={() => setSubTab(t.id)} style={{ padding: "8px 16px", fontSize: 13, fontWeight: subTab === t.id ? 600 : 400, color: subTab === t.id ? COLORS.primary : COLORS.muted, borderBottom: subTab === t.id ? `2px solid ${COLORS.primary}` : "2px solid transparent", cursor: "pointer", marginBottom: -1, transition: "all 0.15s" }}>{t.label}</div>
      ))}
    </div>

    {subTab === "list" && <>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input placeholder="Search ID, name, RSBSA..." style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: COLORS.text, maxWidth: 260 }} />
        {["All barangays", "All status", "All categories", "2025"].map((p, i) => <select key={i} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, color: COLORS.text }}><option>{p}</option></select>)}
      </div>
      <Table headers={["ID Number", "Full name", "Barangay", "Sex", "Category", "Status", "Contact"]}>
        {fisherfolk.map((f, i) => (
          <tr key={i} onClick={() => onSelect(f)} style={{ cursor: "pointer" }}>
            <Td mono>{f.id}</Td><Td><strong>{f.name}</strong></Td><Td>{f.brgy}</Td><Td>{f.sex}</Td><Td>{f.cat}</Td>
            <Td><div style={{ display: "flex", gap: 4 }}>{f.status.map((s, j) => <Badge key={j} type={s} />)}</div></Td>
            <Td style={{ fontSize: 12 }}>{f.contact}</Td>
          </tr>
        ))}
      </Table>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", fontSize: 12, color: COLORS.muted }}>
        <span>Showing 1-15 of 2,937</span>
        <div style={{ display: "flex", gap: 4 }}>{["Prev", "1", "2", "3", "…", "196", "Next"].map((p, i) => <Btn key={i} small style={p === "1" ? { background: COLORS.primaryMuted, color: COLORS.primary } : {}}>{p}</Btn>)}</div>
      </div>
    </>}

    {subTab === "daily" && <>
      {/* Daily summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
        <KPI val="8" label="Total today" trend="5 new · 2 renewal · 1 update" />
        <KPI val="5" label="Complete (photo + sig)" color={COLORS.success} />
        <KPI val="3" label="Incomplete (awaiting)" color={COLORS.warning} />
        <KPI val="3" label="IDs printed today" color={COLORS.primary} />
        <KPI val="4" label="In print queue" color={COLORS.blue} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Left: Today's registrations & updates */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>📅 Today's registrations & updates</div>
            <span style={{ fontSize: 11, color: COLORS.dimmed }}>April 28, 2025</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead><tr>
                {["Time", "Name", "Barangay", "Type", "Photo", "Sig", "ID Printed"].map((h, i) => (
                  <th key={i} style={{ textAlign: "left", padding: "8px 8px", color: COLORS.muted, fontWeight: 500, fontSize: 10, textTransform: "uppercase", borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {dailyNew.map((r, i) => (
                  <tr key={i} style={{ background: !r.photo || !r.sig ? "rgba(245,158,11,0.04)" : "transparent" }}>
                    <td style={{ padding: "7px 8px", borderBottom: `1px solid ${COLORS.elevated}`, color: COLORS.dimmed, fontSize: 11 }}>{r.time}</td>
                    <td style={{ padding: "7px 8px", borderBottom: `1px solid ${COLORS.elevated}`, fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: "7px 8px", borderBottom: `1px solid ${COLORS.elevated}`, fontSize: 11 }}>{r.brgy}</td>
                    <td style={{ padding: "7px 8px", borderBottom: `1px solid ${COLORS.elevated}` }}>
                      <span style={{ display: "inline-flex", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                        background: r.type === "New" ? COLORS.primaryMuted : r.type === "Renewal" ? COLORS.blueMuted : COLORS.warningMuted,
                        color: r.type === "New" ? COLORS.primary : r.type === "Renewal" ? COLORS.blue : COLORS.warning
                      }}>{r.type}</span>
                    </td>
                    <td style={{ padding: "7px 8px", borderBottom: `1px solid ${COLORS.elevated}`, textAlign: "center", color: r.photo ? COLORS.success : COLORS.warning }}>{r.photo ? "✅" : "⚠"}</td>
                    <td style={{ padding: "7px 8px", borderBottom: `1px solid ${COLORS.elevated}`, textAlign: "center", color: r.sig ? COLORS.success : COLORS.warning }}>{r.sig ? "✅" : "⚠"}</td>
                    <td style={{ padding: "7px 8px", borderBottom: `1px solid ${COLORS.elevated}`, textAlign: "center" }}>
                      {r.printed ? <span style={{ color: COLORS.success, fontWeight: 600, fontSize: 11 }}>🖨️ Done</span> : <span style={{ color: COLORS.dimmed, fontSize: 11 }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 8, paddingTop: 8, fontSize: 11, color: COLORS.muted }}>
            ⚠ Rows highlighted = incomplete records (no approval needed to add photo/signature)
          </div>
        </Card>

        {/* Right: ID Print Queue */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>🪪 ID print queue</div>
            <Btn primary small>🖨️ Checkout selected</Btn>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead><tr>
                {["", "Name", "Barangay", "Reg. date", "Photo", "Sig", "Status"].map((h, i) => (
                  <th key={i} style={{ textAlign: i === 0 ? "center" : "left", padding: "8px 8px", color: COLORS.muted, fontWeight: 500, fontSize: 10, textTransform: "uppercase", borderBottom: `1px solid ${COLORS.border}`, width: i === 0 ? 32 : "auto" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {printQueue.map((r, i) => (
                  <tr key={i} style={{ opacity: r.status === "Incomplete" ? 0.6 : 1 }}>
                    <td style={{ padding: "7px 8px", borderBottom: `1px solid ${COLORS.elevated}`, textAlign: "center" }}>
                      <input type="checkbox" disabled={r.status === "Incomplete"} defaultChecked={r.status === "Ready"} style={{ width: 14, height: 14, cursor: r.status === "Ready" ? "pointer" : "not-allowed" }} />
                    </td>
                    <td style={{ padding: "7px 8px", borderBottom: `1px solid ${COLORS.elevated}`, fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: "7px 8px", borderBottom: `1px solid ${COLORS.elevated}`, fontSize: 11 }}>{r.brgy}</td>
                    <td style={{ padding: "7px 8px", borderBottom: `1px solid ${COLORS.elevated}`, fontSize: 11, color: COLORS.dimmed }}>{r.regDate}</td>
                    <td style={{ padding: "7px 8px", borderBottom: `1px solid ${COLORS.elevated}`, textAlign: "center", color: r.photo ? COLORS.success : COLORS.warning }}>{r.photo ? "✅" : "⚠"}</td>
                    <td style={{ padding: "7px 8px", borderBottom: `1px solid ${COLORS.elevated}`, textAlign: "center", color: r.sig ? COLORS.success : COLORS.warning }}>{r.sig ? "✅" : "⚠"}</td>
                    <td style={{ padding: "7px 8px", borderBottom: `1px solid ${COLORS.elevated}` }}>
                      {r.status === "Ready" ? <span style={{ background: COLORS.successMuted, color: COLORS.success, padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 600 }}>Ready</span>
                      : <span style={{ background: COLORS.warningMuted, color: COLORS.warning, padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 600 }}>Incomplete</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 8, paddingTop: 8, fontSize: 11, color: COLORS.muted }}>
            Incomplete records can't be checked out. Staff can click to add photo/signature directly (no approval needed).
          </div>
        </Card>
      </div>

      {/* Today's printed summary */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>🖨️ Today's printed IDs</div>
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.primary }}>3 IDs printed today</span>
        </div>
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
          <thead><tr>
            {["#", "ID Number", "Name", "Barangay", "Type", "Printed at", "Printed by"].map((h, i) => (
              <th key={i} style={{ textAlign: "left", padding: "8px 10px", color: COLORS.muted, fontWeight: 500, fontSize: 10, textTransform: "uppercase", borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {[
              { id: "2025-175205000-08260", name: "Salazar, Renzon P.", brgy: "Lazareto", type: "New", time: "8:45 AM", by: "Maria Santos" },
              { id: "2025-175205000-08262", name: "Villaruel, Marco A.", brgy: "Silonay", type: "New", time: "10:05 AM", by: "Maria Santos" },
              { id: "MR-CL-000088-2015", name: "Bool, Aldrin F.", brgy: "Silonay", type: "Update", time: "11:50 AM", by: "Ana Cruz" },
            ].map((r, i) => (
              <tr key={i}>
                <td style={{ padding: "7px 10px", borderBottom: `1px solid ${COLORS.elevated}`, color: COLORS.dimmed }}>{i + 1}</td>
                <td style={{ padding: "7px 10px", borderBottom: `1px solid ${COLORS.elevated}`, fontFamily: "monospace", fontSize: 10 }}>{r.id}</td>
                <td style={{ padding: "7px 10px", borderBottom: `1px solid ${COLORS.elevated}`, fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: "7px 10px", borderBottom: `1px solid ${COLORS.elevated}` }}>{r.brgy}</td>
                <td style={{ padding: "7px 10px", borderBottom: `1px solid ${COLORS.elevated}` }}>
                  <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                    background: r.type === "New" ? COLORS.primaryMuted : COLORS.warningMuted,
                    color: r.type === "New" ? COLORS.primary : COLORS.warning
                  }}>{r.type}</span>
                </td>
                <td style={{ padding: "7px 10px", borderBottom: `1px solid ${COLORS.elevated}`, color: COLORS.dimmed, fontSize: 11 }}>{r.time}</td>
                <td style={{ padding: "7px 10px", borderBottom: `1px solid ${COLORS.elevated}`, fontSize: 11 }}>{r.by}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", gap: 16, marginTop: 10, padding: "8px 10px", background: COLORS.elevated, borderRadius: 6, fontSize: 11, color: COLORS.muted }}>
          <span>New: <strong style={{ color: COLORS.primary }}>2</strong></span>
          <span>Renewal: <strong style={{ color: COLORS.blue }}>0</strong></span>
          <span>Update: <strong style={{ color: COLORS.warning }}>1</strong></span>
          <span style={{ marginLeft: "auto" }}>Total printed today: <strong style={{ color: COLORS.text }}>3</strong></span>
        </div>
      </Card>
    </>}
  </div>
  );
};

const FisherfolkProfile = ({ person, onBack }) => (
  <div>
    <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 8 }}><span onClick={onBack} style={{ cursor: "pointer", color: COLORS.primary }}>Fisherfolk</span> › {person.name}</div>
    <MobileBadge first />
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginTop: 16 }}>
      <div>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ width: 64, height: 64, background: COLORS.elevated, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.dimmed, fontSize: 24, fontWeight: 700 }}>{person.name.charAt(0)}{person.name.split(",")[1]?.trim().charAt(0)}</div>
              <div><h2 style={{ fontSize: 20, fontWeight: 600 }}>{person.name}</h2><p style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>ID: {person.id}</p><div style={{ display: "flex", gap: 6, marginTop: 6 }}>{person.status.map((s, i) => <Badge key={i} type={s} />)}</div></div>
            </div>
            <div style={{ display: "flex", gap: 6 }}><Btn small>Edit</Btn><Btn small>Print ID</Btn><Btn small>QR</Btn></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 13 }}>
            {[["Date of birth", "07/13/1972"], ["Sex", person.sex === "M" ? "Male" : "Female"], ["Address", `${person.brgy}, Calapan City`], ["Contact", person.contact], ["RSBSA #", "—"], ["Categories", person.cat], ["Date joined", "January 15, 2025"], ["Reg. year", "2025"]].map(([l, v], i) => (
              <div key={i}><span style={{ color: COLORS.muted }}>{l}</span><p style={{ marginTop: 2, color: l === "Date joined" ? COLORS.primary : COLORS.text }}>{v}</p></div>
            ))}
          </div>
        </Card>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Linked vessels</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: COLORS.elevated, borderRadius: 8 }}>
            <span style={{ fontSize: 18 }}>⛵</span>
            <div><strong style={{ fontSize: 13 }}>San Pedro II</strong><br /><span style={{ fontSize: 11, color: COLORS.muted }}>MFVR-CL-000142 · Motorized · Wood · 3.2m</span></div>
            <Badge type="Active" />
          </div>
        </Card>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}><span style={{ fontSize: 14, fontWeight: 600 }}>Comments</span><Btn small>+ Add</Btn></div>
          {[{ u: "Maria Santos", r: "Encoder", ago: "2d", text: "Updated contact during renewal. @Juan Reyes please verify." }, { u: "Juan Reyes", r: "Admin", ago: "1d", text: "Verified. New contact correct." }].map((c, i) => (
            <div key={i} style={{ padding: 12, background: COLORS.elevated, borderRadius: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}><strong>{c.u}</strong> <span style={{ color: COLORS.dimmed }}>· {c.r} · {c.ago} ago</span></div>
              <p style={{ fontSize: 13, lineHeight: 1.5 }}>{c.text.split("@Juan Reyes").map((part, j) => j === 0 ? part : <span key={j}><span style={{ color: COLORS.primary }}>@Juan Reyes</span>{part}</span>)}</p>
            </div>
          ))}
        </Card>
      </div>
      <div>
        {/* QR Code card */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📱 QR code</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: 120, height: 120, background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
              {/* Simulated QR code pattern */}
              <div style={{ width: 100, height: 100, position: "relative" }}>
                {[0,1,2,3,4,5,6,7,8,9].map(row => (
                  <div key={row} style={{ display: "flex", gap: 1, marginBottom: 1 }}>
                    {[0,1,2,3,4,5,6,7,8,9].map(col => {
                      const isCorner = (row < 3 && col < 3) || (row < 3 && col > 6) || (row > 6 && col < 3);
                      const isFilled = isCorner || Math.random() > 0.45;
                      return <div key={col} style={{ width: 9, height: 9, background: isFilled ? "#111" : "#fff", borderRadius: 1 }} />;
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 10, color: COLORS.dimmed, textAlign: "center", fontFamily: "monospace" }}>{person.id}</div>
            <div style={{ fontSize: 10, color: COLORS.muted, textAlign: "center" }}>Scan to open profile at<br /><span style={{ color: COLORS.primary, fontSize: 9 }}>frms.powerbyteitsolutions.app/calapan/scan/{person.id}</span></div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <Btn small>📥 Download</Btn>
              <Btn small>🖨️ Print QR</Btn>
            </div>
          </div>
        </Card>
        <Card style={{ marginBottom: 16 }}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Violations</div><div style={{ textAlign: "center", padding: 20, color: COLORS.dimmed, fontSize: 13 }}>✓ No violations on record</div></Card>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🤝 Ayuda received</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { title: "Emergency Typhoon Relief 2024", date: "Nov 8, 2024", status: "Received", statusColor: COLORS.success },
              { title: "Bantay Dagat Fuel Subsidy 2025", date: "Apr 22, 2025", status: "Received", statusColor: COLORS.success },
              { title: "Senior Citizen Rice Distribution Q2", date: "—", status: "Pending", statusColor: COLORS.warning },
            ].map((a, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: COLORS.elevated, borderRadius: 6 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{a.title}</div>
                  <div style={{ fontSize: 10, color: COLORS.dimmed, marginTop: 1 }}>Date: {a.date}</div>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 600, background: `${a.statusColor}18`, color: a.statusColor }}>{a.status}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 10, paddingTop: 8, fontSize: 11, color: COLORS.dimmed }}>
            Total ayuda received: <strong style={{ color: COLORS.text }}>2</strong> programs · 1 pending
          </div>
        </Card>
        <Card><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Change history</div><div style={{ fontSize: 12 }}>{[["Jan 15, 2025", "Record created by Maria Santos"], ["Jan 16, 2025", "Contact updated during renewal"], ["Jan 16, 2025", "Vessel San Pedro II linked"]].map(([d, t], i) => <div key={i} style={{ padding: "6px 0", borderBottom: i < 2 ? `1px solid ${COLORS.elevated}` : "none" }}><span style={{ color: COLORS.dimmed }}>{d}</span> — {t}</div>)}</div></Card>
      </div>
    </div>
  </div>
);

const VesselsList = () => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div><h1 style={{ fontSize: 22, fontWeight: 600 }}>Vessels</h1><p style={{ fontSize: 13, color: COLORS.muted }}>412 registered</p></div>
      <div style={{ display: "flex", gap: 8 }}><MobileBadge /><Btn primary>+ Register vessel</Btn></div>
    </div>
    <Table headers={["MFVR #", "Vessel name", "Type", "Material", "Dimensions", "HP", "Owner", "Gear", "Status"]}>
      {vessels.map((v, i) => <tr key={i}><Td mono>{v.mfvr}</Td><Td><strong>{v.name}</strong></Td><Td>{v.type}</Td><Td>{v.mat}</Td><Td>{v.dim}</Td><Td>{v.hp || "—"}</Td><Td>{v.owner}</Td><Td>{v.gear}</Td><Td><Badge type={v.status} /></Td></tr>)}
    </Table>
  </div>
);

const ViolationsList = ({ onFile }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div><h1 style={{ fontSize: 22, fontWeight: 600 }}>Violations</h1><p style={{ fontSize: 13, color: COLORS.muted }}>23 active · 41 lifted</p></div>
      <div style={{ display: "flex", gap: 8 }}><MobileBadge /><Btn danger onClick={onFile}>+ File violation</Btn></div>
    </div>
    <Table headers={["Date", "Subject", "Fisherfolk", "Vessel", "Filed by", "Status"]}>
      {violations.map((v, i) => <tr key={i}><Td>{v.date}</Td><Td>{v.subj}</Td><Td><strong>{v.fisher}</strong></Td><Td>{v.vessel}</Td><Td>{v.by}</Td><Td><Badge type={v.status} /></Td></tr>)}
    </Table>
  </div>
);

const EditRequests = () => {
  const reqs = [
    { name: "Padua, Doris R.", id: "MR-CL-003484-2017", by: "Maria Santos", ago: "2 hours", field: "Contact number", old: "+639074187728", new_: "+639074188001" },
    { name: "Bool, Aldrin F.", id: "MR-CL-000088-2015", by: "Ana Cruz", ago: "5 hours", field: "Address", old: "Silonay, Calapan City", new_: "Lazareto, Calapan City" },
    { name: "Abac, Fernady S.", id: "MR-CL-000685-2015", by: "Maria Santos", ago: "Yesterday", field: "Category", old: "Boat Owner, Capture Fishing", new_: "Boat Owner, Capture Fishing, Vendor" },
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 600 }}>Edit requests</h1><p style={{ fontSize: 13, color: COLORS.muted }}>5 pending · 42 resolved</p></div>
        <MobileBadge />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {reqs.map((r, i) => (
          <Card key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div><Badge type="Pending" /><h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 6 }}>{r.name} <span style={{ fontWeight: 400, color: COLORS.muted, fontSize: 13 }}>— {r.id}</span></h3><p style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>By {r.by} · {r.ago} ago</p></div>
              <div style={{ display: "flex", gap: 6 }}><Btn primary small>Approve</Btn><Btn small style={{ color: COLORS.danger }}>Reject</Btn></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 13 }}>
              <div><span style={{ color: COLORS.dimmed, fontSize: 11 }}>Field</span><p style={{ fontWeight: 500 }}>{r.field}</p></div>
              <div><span style={{ color: COLORS.dimmed, fontSize: 11 }}>Old value</span><p><span style={{ background: COLORS.dangerMuted, color: COLORS.danger, padding: "2px 6px", borderRadius: 4, textDecoration: "line-through", fontSize: 12 }}>{r.old}</span></p></div>
              <div><span style={{ color: COLORS.dimmed, fontSize: 11 }}>New value</span><p><span style={{ background: COLORS.successMuted, color: COLORS.success, padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>{r.new_}</span></p></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const IDGeneration = () => {
  const [idTab, setIdTab] = useState("select");
  const [selected, setSelected] = useState([0, 1, 2]);
  const [editSide, setEditSide] = useState("front");
  const ids = fisherfolk.filter(f => f.status.includes("New") || f.status.includes("Renewed")).slice(0, 6);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 600 }}>ID generation</h1><p style={{ fontSize: 13, color: COLORS.muted }}>Template design, selection, and PVC printing</p></div>
        <div style={{ display: "flex", gap: 8 }}><MobileBadge /></div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${COLORS.border}` }}>
        {[{ id: "select", label: "🪪 Select & print" }, { id: "template", label: "🎨 Template editor" }, { id: "layout", label: "📐 PVC sheet layout" }].map(t => (
          <div key={t.id} onClick={() => setIdTab(t.id)} style={{ padding: "8px 16px", fontSize: 13, fontWeight: idTab === t.id ? 600 : 400, color: idTab === t.id ? COLORS.primary : COLORS.muted, borderBottom: idTab === t.id ? `2px solid ${COLORS.primary}` : "2px solid transparent", cursor: "pointer", marginBottom: -1 }}>{t.label}</div>
        ))}
      </div>

      {/* SELECT & PRINT TAB */}
      {idTab === "select" && <>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <Btn primary>🖨️ Checkout ({selected.length} selected)</Btn>
        </div>
        <Table headers={["", "ID Number", "Full name", "Barangay", "Status", "Photo", "Signature"]}>
          {ids.map((f, i) => (
            <tr key={i} style={{ background: selected.includes(i) ? COLORS.primaryMuted : "transparent" }}>
              <Td><input type="checkbox" checked={selected.includes(i)} onChange={() => setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])} /></Td>
              <Td mono>{f.id}</Td><Td><strong>{f.name}</strong></Td><Td>{f.brgy}</Td><Td><Badge type={f.status[0]} /></Td>
              <Td style={{ color: COLORS.success }}>✓</Td><Td style={{ color: i === 3 ? COLORS.warning : COLORS.success }}>{i === 3 ? "⚠ Missing" : "✓"}</Td>
            </tr>
          ))}
        </Table>
      </>}

      {/* TEMPLATE EDITOR TAB */}
      {idTab === "template" && <>
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 220px", gap: 16 }}>
          {/* Left: Field palette */}
          <div>
            <Card style={{ padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Data fields</div>
              <p style={{ fontSize: 10, color: COLORS.dimmed, marginBottom: 6 }}>Drag onto canvas</p>
              <div style={{ fontSize: 9, color: COLORS.primary, fontWeight: 600, marginBottom: 4 }}>FISHERFOLK</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 10 }}>
                {["{{photo}}", "{{signature}}", "{{qr_code}}", "{{registration_number}}", "{{full_name}}", "{{last_name}}", "{{first_name}}", "{{middle_name}}", "{{date_of_birth}}", "{{sex}}", "{{address}}", "{{barangay}}", "{{rsbsa_number}}", "{{categories}}", "{{date_joined}}"].map((f, i) => (
                  <div key={i} style={{ padding: "4px 6px", background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 4, fontSize: 9, fontFamily: "monospace", color: COLORS.primary, cursor: "grab" }}>{f}</div>
                ))}
              </div>
              <div style={{ fontSize: 9, color: "#06b6d4", fontWeight: 600, marginBottom: 4 }}>VESSEL</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 10 }}>
                {["{{vessel_photo}}", "{{vessel_qr_code}}", "{{mfvr_number}}", "{{vessel_name}}", "{{vessel_type}}", "{{hull_material}}", "{{dimensions}}", "{{engine_hp}}", "{{homeport}}", "{{fishing_gear}}", "{{owner_name}}", "{{year_built}}", "{{gross_tonnage}}", "{{net_tonnage}}", "{{valid_until}}"].map((f, i) => (
                  <div key={i} style={{ padding: "4px 6px", background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 4, fontSize: 9, fontFamily: "monospace", color: "#06b6d4", cursor: "grab" }}>{f}</div>
                ))}
              </div>
              <div style={{ fontSize: 9, color: COLORS.warning, fontWeight: 600, marginBottom: 4 }}>SHARED</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {["{{mayor_name}}", "{{mayor_signature}}", "{{registration_year}}"].map((f, i) => (
                  <div key={i} style={{ padding: "4px 6px", background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 4, fontSize: 9, fontFamily: "monospace", color: COLORS.warning, cursor: "grab" }}>{f}</div>
                ))}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 16, marginBottom: 10 }}>Static labels</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {["+ Add text label", "+ Add line", "+ Add shape"].map((f, i) => (
                  <div key={i} style={{ padding: "5px 8px", background: COLORS.elevated, border: `1px dashed ${COLORS.border}`, borderRadius: 4, fontSize: 11, color: COLORS.muted, cursor: "pointer", textAlign: "center" }}>{f}</div>
                ))}
              </div>
            </Card>
            <Card style={{ padding: 14, marginTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Templates</div>
              <div style={{ fontSize: 10, color: COLORS.dimmed, marginBottom: 6 }}>FISHERFOLK ID</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                <div style={{ padding: "8px 10px", background: COLORS.primaryMuted, border: `1px solid ${COLORS.primary}30`, borderRadius: 6, fontSize: 12, fontWeight: 600, color: COLORS.primary, cursor: "pointer" }}>🪪 Calapan FMO 2025 ✓</div>
                <div style={{ padding: "8px 10px", background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, color: COLORS.muted, cursor: "pointer" }}>🪪 Calapan FMO 2024</div>
              </div>
              <div style={{ fontSize: 10, color: COLORS.dimmed, marginBottom: 6 }}>VESSEL ID</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                <div style={{ padding: "8px 10px", background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, color: COLORS.muted, cursor: "pointer" }}>⛵ Vessel Registration 2025</div>
              </div>
              <Btn small style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>+ New template</Btn>
            </Card>
          </div>

          {/* Center: Canvas — 86x54mm ID at scale */}
          <div>
            <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
              <Btn small onClick={() => setEditSide("front")} style={editSide === "front" ? { background: COLORS.primaryMuted, color: COLORS.primary } : {}}>Front</Btn>
              <Btn small onClick={() => setEditSide("back")} style={editSide === "back" ? { background: COLORS.primaryMuted, color: COLORS.primary } : {}}>Back</Btn>
              <div style={{ flex: 1 }} />
              <Btn small>Upload background</Btn>
              <Btn small>Undo</Btn>
              <Btn small>Redo</Btn>
              <Btn primary small>💾 Save template</Btn>
            </div>

            {/* Canvas area with bleed guides */}
            <div style={{ background: COLORS.elevated, borderRadius: 8, padding: 20, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                {/* Bleed area (90x58mm scaled to ~450x290px) */}
                <div style={{ width: 450, height: 290, background: "#444", borderRadius: 4, position: "relative", overflow: "hidden" }}>
                  {/* Bleed guide lines */}
                  <div style={{ position: "absolute", inset: 10, border: "1px dashed rgba(255,255,255,0.3)", borderRadius: 2 }}>
                    <span style={{ position: "absolute", top: -14, left: 4, fontSize: 8, color: "rgba(255,255,255,0.4)" }}>Safe area 86×54mm</span>
                  </div>
                  <span style={{ position: "absolute", top: 2, left: 4, fontSize: 8, color: "rgba(255,255,255,0.3)" }}>Bleed 90×58mm</span>

                  {editSide === "front" ? <>
                    {/* Orange gradient background mockup */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #f7a035 0%, #e8733a 50%, #d45a2e 100%)" }} />

                    {/* Header area */}
                    <div style={{ position: "absolute", top: 8, left: 12, right: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 22, height: 22, background: "rgba(255,255,255,0.3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#fff" }}>FMO</div>
                      <div style={{ width: 22, height: 22, background: "rgba(255,255,255,0.3)", borderRadius: "50%", fontSize: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>BFAR</div>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 6, color: "#fff", opacity: 0.9 }}>Republic of the Philippines</div>
                        <div style={{ fontSize: 7, color: "#fff", fontWeight: 700 }}>BUREAU OF FISHERIES AND AQUATIC RESOURCES</div>
                        <div style={{ fontSize: 6, color: "#fff", fontWeight: 600 }}>MUNICIPAL FISHERFOLK I.D.</div>
                        <div style={{ fontSize: 5, color: "#fff", opacity: 0.8 }}>Province of Oriental Mindoro - City of Calapan (Capital)</div>
                      </div>
                      <div style={{ width: 22, height: 22, background: "rgba(255,255,255,0.3)", borderRadius: "50%", fontSize: 5, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>SEAL</div>
                    </div>

                    {/* Registration number */}
                    <div style={{ position: "absolute", top: 62, left: 14 }}>
                      <div style={{ fontSize: 6, color: "#fff", opacity: 0.8 }}>FISHERFOLK REGISTRATION NUMBER</div>
                      <div style={{ fontSize: 12, color: "#fff", fontWeight: 800, border: "1px dashed rgba(79,142,247,0.5)", padding: "2px 4px", borderRadius: 3, background: "rgba(79,142,247,0.1)" }}>{"{{registration_number}}"}</div>
                    </div>

                    {/* Photo placeholder */}
                    <div style={{ position: "absolute", top: 60, right: 14, width: 90, height: 110, background: "rgba(255,255,255,0.9)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed rgba(79,142,247,0.5)" }}>
                      <div style={{ textAlign: "center", color: "#888", fontSize: 8 }}>📷<br />{"{{photo}}"}</div>
                    </div>

                    {/* Name */}
                    <div style={{ position: "absolute", top: 92, left: 14 }}>
                      <div style={{ fontSize: 5, color: "#fff", opacity: 0.7 }}>LAST NAME, FIRST NAME, MIDDLE NAME</div>
                      <div style={{ fontSize: 10, color: "#fff", fontWeight: 700, border: "1px dashed rgba(79,142,247,0.5)", padding: "1px 3px", borderRadius: 2, background: "rgba(79,142,247,0.1)" }}>{"{{full_name}}"}</div>
                    </div>

                    {/* DOB + Sex */}
                    <div style={{ position: "absolute", top: 118, left: 14, display: "flex", gap: 20 }}>
                      <div><div style={{ fontSize: 5, color: "#fff", opacity: 0.7 }}>DATE OF BIRTH</div><div style={{ fontSize: 9, color: "#fff", fontWeight: 700, border: "1px dashed rgba(79,142,247,0.5)", padding: "1px 3px", borderRadius: 2, background: "rgba(79,142,247,0.1)" }}>{"{{date_of_birth}}"}</div></div>
                      <div><div style={{ fontSize: 5, color: "#fff", opacity: 0.7 }}>SEX</div><div style={{ fontSize: 9, color: "#fff", fontWeight: 700, border: "1px dashed rgba(79,142,247,0.5)", padding: "1px 3px", borderRadius: 2, background: "rgba(79,142,247,0.1)" }}>{"{{sex}}"}</div></div>
                    </div>

                    {/* Address */}
                    <div style={{ position: "absolute", top: 146, left: 14 }}>
                      <div style={{ fontSize: 5, color: "#fff", opacity: 0.7 }}>ADDRESS</div>
                      <div style={{ fontSize: 10, color: "#fff", fontWeight: 700, border: "1px dashed rgba(79,142,247,0.5)", padding: "1px 3px", borderRadius: 2, background: "rgba(79,142,247,0.1)" }}>{"{{address}}"}</div>
                    </div>

                    {/* Signature */}
                    <div style={{ position: "absolute", bottom: 16, right: 14, width: 80, height: 40, background: "rgba(255,255,255,0.85)", borderRadius: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed rgba(79,142,247,0.5)" }}>
                      <div style={{ fontSize: 7, color: "#888" }}>{"{{signature}}"}</div>
                      <div style={{ fontSize: 6, color: "#888", marginTop: 2 }}>Signature</div>
                    </div>

                    {/* Footer */}
                    <div style={{ position: "absolute", bottom: 4, left: 14, fontSize: 5, color: "#fff", opacity: 0.6 }}>Visit our website: http://www.bfar.da.gov.ph</div>
                  </> : <>
                    {/* BACK SIDE */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1a5276 0%, #1a3c5e 100%)" }} />

                    {/* RSBSA */}
                    <div style={{ position: "absolute", top: 12, right: 14, textAlign: "right" }}>
                      <div style={{ fontSize: 6, color: "#fff", opacity: 0.7 }}>RSBSA NUMBER:</div>
                      <div style={{ fontSize: 9, color: "#fff", fontWeight: 600, border: "1px dashed rgba(79,142,247,0.5)", padding: "1px 3px", borderRadius: 2, background: "rgba(79,142,247,0.1)", display: "inline-block" }}>{"{{rsbsa_number}}"}</div>
                    </div>

                    {/* Slogan */}
                    <div style={{ position: "absolute", top: 40, left: 0, right: 0, textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", lineHeight: 1.1, textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>MAAYOS NA<br />BAYAN SIGURADO<br />AKSYON AGAD II</div>
                    </div>

                    {/* Mayor */}
                    <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, textAlign: "center" }}>
                      <div style={{ width: 60, borderBottom: "1px solid rgba(255,255,255,0.5)", margin: "0 auto 4px" }} />
                      <div style={{ fontSize: 8, fontWeight: 700, color: "#fff", border: "1px dashed rgba(79,142,247,0.5)", padding: "1px 3px", borderRadius: 2, background: "rgba(79,142,247,0.1)", display: "inline-block" }}>{"{{mayor_name}}"}</div>
                      <div style={{ fontSize: 7, color: "#fff", opacity: 0.7, marginTop: 2 }}>City Mayor</div>
                    </div>

                    {/* QR Code */}
                    <div style={{ position: "absolute", bottom: 12, right: 14, width: 40, height: 40, background: "#fff", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed rgba(79,142,247,0.5)" }}>
                      <div style={{ fontSize: 7, color: "#888" }}>{"{{qr}}"}</div>
                    </div>

                    {/* Fish illustrations */}
                    <div style={{ position: "absolute", bottom: 12, left: 14, fontSize: 10, opacity: 0.4 }}>🐟 🦐 🦗</div>
                  </>}
                </div>

                {/* Size annotation */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 9, color: COLORS.dimmed }}>
                  <span>← 86mm (content) / 90mm (with bleed) →</span>
                  <span>↕ 54mm / 58mm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Properties panel */}
          <div>
            <Card style={{ padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Selected element</div>
              <div style={{ padding: 10, background: COLORS.elevated, borderRadius: 6, marginBottom: 12, textAlign: "center", fontSize: 11, color: COLORS.primary, fontFamily: "monospace" }}>{"{{full_name}}"}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 10, color: COLORS.muted, display: "block", marginBottom: 3 }}>Font family</label>
                  <select style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "5px 8px", fontSize: 11, color: COLORS.text, width: "100%" }}>
                    <option>Arial</option><option>Helvetica</option><option>Times New Roman</option><option>Calibri</option><option>Impact</option>
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <div><label style={{ fontSize: 10, color: COLORS.muted, display: "block", marginBottom: 3 }}>Size (pt)</label><input type="number" defaultValue="14" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "5px 8px", fontSize: 11, color: COLORS.text, width: "100%" }} /></div>
                  <div><label style={{ fontSize: 10, color: COLORS.muted, display: "block", marginBottom: 3 }}>Weight</label><select style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "5px 8px", fontSize: 11, color: COLORS.text, width: "100%" }}><option>Regular</option><option>Bold</option><option>ExtraBold</option></select></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <div><label style={{ fontSize: 10, color: COLORS.muted, display: "block", marginBottom: 3 }}>Color</label><div style={{ display: "flex", gap: 4, alignItems: "center" }}><input type="color" defaultValue="#ffffff" style={{ width: 24, height: 24, padding: 0, border: "none", borderRadius: 4, cursor: "pointer" }} /><span style={{ fontSize: 10, color: COLORS.dimmed }}>#FFFFFF</span></div></div>
                  <div><label style={{ fontSize: 10, color: COLORS.muted, display: "block", marginBottom: 3 }}>Align</label><div style={{ display: "flex", gap: 2 }}>{["L", "C", "R"].map((a, i) => <div key={i} style={{ width: 24, height: 24, background: i === 0 ? COLORS.primaryMuted : COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, cursor: "pointer", color: i === 0 ? COLORS.primary : COLORS.muted }}>{a}</div>)}</div></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <div><label style={{ fontSize: 10, color: COLORS.muted, display: "block", marginBottom: 3 }}>X (mm)</label><input type="number" defaultValue="12" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "5px 8px", fontSize: 11, color: COLORS.text, width: "100%" }} /></div>
                  <div><label style={{ fontSize: 10, color: COLORS.muted, display: "block", marginBottom: 3 }}>Y (mm)</label><input type="number" defaultValue="28" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "5px 8px", fontSize: 11, color: COLORS.text, width: "100%" }} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <div><label style={{ fontSize: 10, color: COLORS.muted, display: "block", marginBottom: 3 }}>Width (mm)</label><input type="number" defaultValue="50" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "5px 8px", fontSize: 11, color: COLORS.text, width: "100%" }} /></div>
                  <div><label style={{ fontSize: 10, color: COLORS.muted, display: "block", marginBottom: 3 }}>Height (mm)</label><input type="number" defaultValue="8" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "5px 8px", fontSize: 11, color: COLORS.text, width: "100%" }} /></div>
                </div>
              </div>
            </Card>
            <Card style={{ padding: 14, marginTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>ID dimensions</div>
              <div style={{ fontSize: 11, color: COLORS.muted, display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Content area:</span><strong style={{ color: COLORS.text }}>86 × 54 mm</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>With bleed:</span><strong style={{ color: COLORS.text }}>90 × 58 mm</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Bleed margin:</span><strong style={{ color: COLORS.text }}>2 mm</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>PVC sheet:</span><strong style={{ color: COLORS.text }}>200 × 300 mm</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Max per sheet:</span><strong style={{ color: COLORS.text }}>4 IDs</strong></div>
              </div>
            </Card>
          </div>
        </div>
      </>}

      {/* PVC SHEET LAYOUT TAB — auto-fills based on selected members */}
      {idTab === "layout" && (() => {
        const selectedData = [
          { name: "ZABATE, ELY JOY", addr: "SALONG, CALAPAN", id: "2026-175205000-08594" },
          { name: "MAÑO, ALLAN PASCUA", addr: "ILAYA, CALAPAN", id: "2026-175205000-08595" },
          { name: "GARAY, NORILYN D.", addr: "BARUYAN, CALAPAN", id: "MR-CL-003176-2017" },
          { name: "PADILLA, ERNESTO M.", addr: "LALUD, CALAPAN", id: "2026-175205000-08596" },
        ].slice(0, selected.length);
        const sheetsNeeded = Math.ceil(selected.length / 4) || 1;
        const completeCount = selectedData.length;
        return <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: COLORS.muted }}>
              <strong style={{ color: COLORS.text }}>{selected.length}</strong> member{selected.length !== 1 ? "s" : ""} selected from the Select & Print tab → auto-laid out below
            </div>
            <Btn primary>🖨️ Print sheet ({sheetsNeeded} sheet{sheetsNeeded > 1 ? "s" : ""})</Btn>
          </div>

          <Card style={{ display: "flex", justifyContent: "center", padding: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: COLORS.dimmed, marginBottom: 8, textAlign: "center" }}>PVC Sheet: 200 × 300mm — {selected.length} of 4 slots filled (mirrored for PVC film back-printing)</div>
              <div style={{ width: 400, height: 600, background: "#f5f5f5", borderRadius: 4, padding: 12, position: "relative", border: "2px solid #ddd" }}>
                {[0, 1, 2, 3].map(row => {
                  const person = selectedData[row];
                  return (
                    <div key={row} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      {/* Front */}
                      {person ? (
                        <div style={{ width: 184, height: 128, background: "linear-gradient(135deg, #f7a035, #d45a2e)", borderRadius: 3, transform: "scaleX(-1)", position: "relative", overflow: "hidden", border: "0.5px solid #ccc" }}>
                          <div style={{ position: "absolute", top: 4, left: 6, right: 6, display: "flex", gap: 3, alignItems: "center" }}>
                            <div style={{ width: 10, height: 10, background: "rgba(255,255,255,0.3)", borderRadius: "50%" }} />
                            <div style={{ flex: 1, textAlign: "center" }}><div style={{ fontSize: 3, color: "#fff" }}>Republic of the Philippines</div><div style={{ fontSize: 3.5, color: "#fff", fontWeight: 700 }}>BFAR - MUNICIPAL FISHERFOLK I.D.</div></div>
                            <div style={{ width: 10, height: 10, background: "rgba(255,255,255,0.3)", borderRadius: "50%" }} />
                          </div>
                          <div style={{ position: "absolute", top: 20, left: 6, fontSize: 3.5, color: "#fff", opacity: 0.7 }}>FISHERFOLK REGISTRATION NUMBER</div>
                          <div style={{ position: "absolute", top: 26, left: 6, fontSize: 6, color: "#fff", fontWeight: 800 }}>{person.id}</div>
                          <div style={{ position: "absolute", top: 38, left: 6, fontSize: 3, color: "#fff", opacity: 0.7 }}>LAST NAME, FIRST NAME, MIDDLE NAME</div>
                          <div style={{ position: "absolute", top: 44, left: 6, fontSize: 6, color: "#fff", fontWeight: 700 }}>{person.name}</div>
                          <div style={{ position: "absolute", top: 22, right: 6, width: 36, height: 44, background: "rgba(255,255,255,0.85)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 12 }}>📷</span>
                          </div>
                          <div style={{ position: "absolute", bottom: 24, left: 6, fontSize: 3, color: "#fff", opacity: 0.7 }}>ADDRESS</div>
                          <div style={{ position: "absolute", bottom: 14, left: 6, fontSize: 5, color: "#fff", fontWeight: 700 }}>{person.addr}</div>
                          <div style={{ position: "absolute", bottom: 6, right: 6, width: 30, height: 20, background: "rgba(255,255,255,0.8)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 3.5, color: "#888" }}>Signature</span>
                          </div>
                          <div style={{ position: "absolute", bottom: 2, left: 6, fontSize: 2.5, color: "#fff", opacity: 0.5 }}>Visit: http://www.bfar.da.gov.ph</div>
                        </div>
                      ) : (
                        <div style={{ width: 184, height: 128, background: "#e8e8e8", borderRadius: 3, border: "1.5px dashed #ccc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ textAlign: "center", color: "#aaa", fontSize: 9 }}>Empty slot<br /><span style={{ fontSize: 7 }}>Front</span></div>
                        </div>
                      )}
                      {/* Back */}
                      {person ? (
                        <div style={{ width: 184, height: 128, background: "linear-gradient(135deg, #1a5276, #1a3c5e)", borderRadius: 3, transform: "scaleX(-1)", position: "relative", overflow: "hidden", border: "0.5px solid #ccc" }}>
                          <div style={{ position: "absolute", top: 8, right: 6, fontSize: 4, color: "#fff", opacity: 0.7 }}>RSBSA NUMBER:</div>
                          <div style={{ position: "absolute", top: 22, left: 0, right: 0, textAlign: "center" }}>
                            <div style={{ fontSize: 8, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>MAAYOS NA<br />BAYAN SIGURADO<br />AKSYON AGAD II</div>
                          </div>
                          <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center" }}>
                            <div style={{ width: 30, borderBottom: "0.5px solid rgba(255,255,255,0.5)", margin: "0 auto 3px" }} />
                            <div style={{ fontSize: 5, fontWeight: 700, color: "#fff" }}>ATTY. DOY C. LEACHON</div>
                            <div style={{ fontSize: 4, color: "#fff", opacity: 0.7 }}>City Mayor</div>
                          </div>
                          <div style={{ position: "absolute", bottom: 6, right: 6, width: 20, height: 20, background: "#fff", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 5, color: "#888" }}>QR</span>
                          </div>
                          <div style={{ position: "absolute", bottom: 8, left: 8, display: "flex", gap: 4, opacity: 0.3 }}>
                            <span style={{ fontSize: 8 }}>🐟</span><span style={{ fontSize: 6 }}>🦐</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ width: 184, height: 128, background: "#e8e8e8", borderRadius: 3, border: "1.5px dashed #ccc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ textAlign: "center", color: "#aaa", fontSize: 9 }}>Empty slot<br /><span style={{ fontSize: 7 }}>Back</span></div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div style={{ position: "absolute", bottom: -18, left: 0, right: 0, textAlign: "center", fontSize: 9, color: COLORS.dimmed }}>← 200mm →</div>
                <div style={{ position: "absolute", top: "50%", right: -30, transform: "translateY(-50%) rotate(90deg)", fontSize: 9, color: COLORS.dimmed }}>← 300mm →</div>
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 12, fontSize: 11, color: COLORS.muted, justifyContent: "center" }}>
                <span>⚠ Content is mirrored (scaleX -1) for PVC film back-printing</span>
              </div>
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginTop: 16 }}>
            <Card style={{ textAlign: "center", padding: 14 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.primary }}>{selected.length}</div>
              <div style={{ fontSize: 11, color: COLORS.muted }}>Selected members</div>
            </Card>
            <Card style={{ textAlign: "center", padding: 14 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{selected.length} / 4</div>
              <div style={{ fontSize: 11, color: COLORS.muted }}>Slots filled</div>
            </Card>
            <Card style={{ textAlign: "center", padding: 14 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.success }}>{completeCount}</div>
              <div style={{ fontSize: 11, color: COLORS.muted }}>Complete (photo + sig)</div>
            </Card>
            <Card style={{ textAlign: "center", padding: 14 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{sheetsNeeded}</div>
              <div style={{ fontSize: 11, color: COLORS.muted }}>Sheet{sheetsNeeded > 1 ? "s" : ""} needed</div>
            </Card>
          </div>

          {selected.length === 0 && (
            <div style={{ marginTop: 16, padding: 20, background: COLORS.elevated, borderRadius: 8, textAlign: "center", color: COLORS.muted, fontSize: 13 }}>
              No members selected. Go to the <strong style={{ color: COLORS.primary, cursor: "pointer" }}>Select & print</strong> tab and check the fisherfolk you want to print IDs for.
            </div>
          )}
        </>;
      })()}
    </div>
  );
};

const Renewal = () => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
      <div><h1 style={{ fontSize: 22, fontWeight: 600 }}>Fisherfolk renewal</h1><p style={{ fontSize: 13, color: COLORS.muted }}>Year 2025 · 487 renewed</p></div>
      <div style={{ display: "flex", gap: 8 }}><MobileBadge /><Btn small style={{ color: COLORS.warning, borderColor: `${COLORS.warning}40` }}>⚙ Start new year</Btn></div>
    </div>
    <Card style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Search fisherfolk to renew</div>
      <div style={{ display: "flex", gap: 8 }}>
        <input placeholder="Enter ID, name, or RSBSA#..." style={{ flex: 1, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.text }} />
        <Btn>📷 Scan QR</Btn><Btn primary>Search</Btn>
      </div>
    </Card>
    <Card>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Match found</div>
      <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16 }}>Review and update details, then click Renew.</p>
      <div style={{ display: "flex", gap: 16, padding: 16, background: COLORS.elevated, borderRadius: 8, marginBottom: 16 }}>
        <div style={{ width: 56, height: 56, background: COLORS.border, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, color: COLORS.dimmed }}>AB</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Balmes, Anthony Bucalan</h3>
          <p style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>2024-175205000-07896 · Balite · <Badge type="Inactive" /> (last active 2024)</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            {[["Contact", "+639099104564"], ["Address", "Balite, Calapan City"], ["Category", "Boat Owner/Operator, Capture Fishing"]].map(([l, v], i) => (
              <div key={i}><label style={{ fontSize: 11, color: COLORS.muted }}>{l}</label><input defaultValue={v} style={{ marginTop: 4, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, color: COLORS.text, width: "100%" }} /></div>
            ))}
            <div><label style={{ fontSize: 11, color: COLORS.muted }}>Photo</label><div style={{ marginTop: 4 }}><Btn small>📷 Update photo</Btn></div></div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}><Btn>Cancel</Btn><Btn primary>✓ Renew for 2025</Btn></div>
    </Card>
  </div>
);

const Reports = () => {
  const [reportType, setReportType] = useState("members");
  const [generating, setGenerating] = useState(false);

  const reportTypes = [
    { id: "members", label: "📋 Member List", desc: "Filtered list of fisherfolk by status, barangay, category" },
    { id: "new", label: "🆕 New Registrations", desc: "All newly registered fisherfolk for selected period" },
    { id: "renewed", label: "🔄 Renewed Members", desc: "All renewed fisherfolk for selected registration year" },
    { id: "inactive", label: "⏸️ Inactive Members", desc: "Members who have not renewed — diminishing report" },
    { id: "senior", label: "👴 Senior Citizens", desc: "All 60+ members per barangay — for senior programs" },
    { id: "voters", label: "🗳️ Voter-Eligible", desc: "All 18+ members per barangay — election planning" },
    { id: "violations", label: "⚠ Violation Report", desc: "Active and lifted violations by barangay" },
    { id: "vessels", label: "⛵ Vessel Inventory", desc: "Registered vessels with owner, type, gear, status" },
    { id: "families", label: "👨‍👩‍👧‍👦 Family Cluster", desc: "Surname and middle name groupings per barangay" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 600 }}>Reports</h1><p style={{ fontSize: 13, color: COLORS.muted }}>Generate printable PDF and Excel reports with official headers</p></div>
        <MobileBadge />
      </div>

      {/* Report header preview */}
      <Card style={{ marginBottom: 20, textAlign: "center", padding: "24px 20px" }}>
        <div style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.05em", textTransform: "uppercase" }}>Report header preview</div>
        <div style={{ marginTop: 12, padding: "16px 24px", background: COLORS.elevated, borderRadius: 8, display: "inline-block" }}>
          <div style={{ fontSize: 11, color: COLORS.muted }}>Republic of the Philippines</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>City Government of Calapan</div>
          <div style={{ fontSize: 12, color: COLORS.primary, marginTop: 1 }}>Fisheries Management Office</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 8, letterSpacing: "0.02em" }}>LIST OF ACTIVE FISHERFOLK — BARANGAY LAZARETO</div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>Registration Year 2025 · Generated Apr 28, 2025</div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
        {/* Left: Report type selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 4 }}>Report type</div>
          {reportTypes.map(r => (
            <div key={r.id} onClick={() => setReportType(r.id)} style={{ padding: "10px 12px", borderRadius: 8, cursor: "pointer", background: reportType === r.id ? COLORS.primaryMuted : "transparent", border: reportType === r.id ? `1px solid ${COLORS.primary}30` : `1px solid ${COLORS.border}`, transition: "all 0.1s" }}>
              <div style={{ fontSize: 13, fontWeight: reportType === r.id ? 600 : 400, color: reportType === r.id ? COLORS.primary : COLORS.text }}>{r.label}</div>
              <div style={{ fontSize: 10, color: COLORS.dimmed, marginTop: 2 }}>{r.desc}</div>
            </div>
          ))}
        </div>

        {/* Right: Filters + preview */}
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Filters</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div><label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>Status</label><select style={{ background: COLORS.surface, border: "1px solid " + COLORS.border, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: COLORS.text, width: "100%" }}><option>All Active</option><option>New</option><option>Renewed</option><option>Active</option><option>Inactive</option></select></div>
              <div><label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>Barangay</label><select style={{ background: COLORS.surface, border: "1px solid " + COLORS.border, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: COLORS.text, width: "100%" }}><option>All barangays</option><option>Lazareto</option><option>Baruyan</option><option>Silonay</option><option>Ibaba West</option><option>Navotas</option><option>Maidlang</option></select></div>
              <div><label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>Category</label><select style={{ background: COLORS.surface, border: "1px solid " + COLORS.border, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: COLORS.text, width: "100%" }}><option>All categories</option><option>Capture Fishing</option><option>Boat Owner/Operator</option><option>Vendor</option><option>Gleaning</option><option>Aquaculture</option></select></div>
              <div><label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>Year</label><select style={{ background: COLORS.surface, border: "1px solid " + COLORS.border, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: COLORS.text, width: "100%" }}><option>2025</option><option>2024</option><option>2023</option></select></div>
              <div><label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>Date from</label><input type="date" style={{ background: COLORS.surface, border: "1px solid " + COLORS.border, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: COLORS.text, width: "100%" }} /></div>
              <div><label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>Date to</label><input type="date" style={{ background: COLORS.surface, border: "1px solid " + COLORS.border, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: COLORS.text, width: "100%" }} /></div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13 }}>Matching records: <strong style={{ color: COLORS.primary }}>383</strong> fisherfolk</div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn small>Preview list</Btn>
                <Btn primary small>📄 Generate PDF</Btn>
                <Btn small style={{ background: "#166534", color: "#fff" }}>📊 Generate Excel</Btn>
              </div>
            </div>
          </Card>

          {/* Preview table */}
          <Card style={{ padding: 0 }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid " + COLORS.border, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Preview — Active fisherfolk, Lazareto, All categories (2025)</div>
              <span style={{ fontSize: 11, color: COLORS.muted }}>Showing first 10 of 383</span>
            </div>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead><tr style={{ background: COLORS.elevated }}><th style={{ textAlign: "left", padding: "8px 12px", color: COLORS.muted, fontWeight: 500, fontSize: 10, textTransform: "uppercase" }}>#</th><th style={{ textAlign: "left", padding: "8px 12px", color: COLORS.muted, fontWeight: 500, fontSize: 10, textTransform: "uppercase" }}>ID Number</th><th style={{ textAlign: "left", padding: "8px 12px", color: COLORS.muted, fontWeight: 500, fontSize: 10, textTransform: "uppercase" }}>Full name</th><th style={{ textAlign: "left", padding: "8px 12px", color: COLORS.muted, fontWeight: 500, fontSize: 10, textTransform: "uppercase" }}>DOB</th><th style={{ textAlign: "left", padding: "8px 12px", color: COLORS.muted, fontWeight: 500, fontSize: 10, textTransform: "uppercase" }}>Sex</th><th style={{ textAlign: "left", padding: "8px 12px", color: COLORS.muted, fontWeight: 500, fontSize: 10, textTransform: "uppercase" }}>Category</th><th style={{ textAlign: "left", padding: "8px 12px", color: COLORS.muted, fontWeight: 500, fontSize: 10, textTransform: "uppercase" }}>Status</th><th style={{ textAlign: "left", padding: "8px 12px", color: COLORS.muted, fontWeight: 500, fontSize: 10, textTransform: "uppercase" }}>Contact</th></tr></thead>
              <tbody>
                {fisherfolk.slice(0, 10).map((f, i) => (
                  <tr key={i}><td style={{ padding: "8px 12px", borderBottom: "1px solid " + COLORS.elevated, color: COLORS.dimmed }}>{i + 1}</td><td style={{ padding: "8px 12px", borderBottom: "1px solid " + COLORS.elevated, fontFamily: "monospace", fontSize: 10 }}>{f.id}</td><td style={{ padding: "8px 12px", borderBottom: "1px solid " + COLORS.elevated, fontWeight: 600 }}>{f.name}</td><td style={{ padding: "8px 12px", borderBottom: "1px solid " + COLORS.elevated }}>07/13/1972</td><td style={{ padding: "8px 12px", borderBottom: "1px solid " + COLORS.elevated }}>{f.sex}</td><td style={{ padding: "8px 12px", borderBottom: "1px solid " + COLORS.elevated }}>{f.cat}</td><td style={{ padding: "8px 12px", borderBottom: "1px solid " + COLORS.elevated }}><span style={{ display: "inline-flex", gap: 4 }}>{f.status.map((s, j) => <Badge key={j} type={s} />)}</span></td><td style={{ padding: "8px 12px", borderBottom: "1px solid " + COLORS.elevated, fontSize: 11 }}>{f.contact}</td></tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
};

const AyudaProgram = () => {
  const [view, setView] = useState("list");
  const [selectedProgram, setSelectedProgram] = useState(null);

  const programs = [
    { id: 1, title: "Bantay Dagat Fuel Subsidy 2025", desc: "Fuel subsidy for all motorized boat owners in coastal barangays", created: "Apr 15, 2025", by: "Juan Reyes", status: "Distributing", beneficiaries: 412, filters: "Category: Boat Owner · Vessel: Motorized · Status: Active", uploads: 3, eventPhotos: 5, completion: 68 },
    { id: 2, title: "Senior Citizen Rice Distribution Q2", desc: "Rice distribution for all senior citizen fisherfolk (60+) across all barangays", created: "Apr 10, 2025", by: "Juan Reyes", status: "Active", beneficiaries: 487, filters: "Age: 60+ · Status: Active", uploads: 0, eventPhotos: 0, completion: 0 },
    { id: 3, title: "Silonay Livelihood Training", desc: "Free aquaculture training for capture fishing members in Silonay", created: "Mar 28, 2025", by: "Juan Reyes", status: "Completed", beneficiaries: 142, filters: "Barangay: Silonay · Category: Capture Fishing", uploads: 8, eventPhotos: 12, completion: 100 },
    { id: 4, title: "Emergency Typhoon Relief 2024", desc: "Emergency relief goods for all active fisherfolk in Lazareto and Baruyan after Typhoon Carina", created: "Nov 5, 2024", by: "Juan Reyes", status: "Completed", beneficiaries: 725, filters: "Barangay: Lazareto, Baruyan · Status: Active, Renewed", uploads: 15, eventPhotos: 24, completion: 100 },
  ];

  const statusColor = { Active: COLORS.success, Distributing: COLORS.blue, Completed: COLORS.muted };

  // PROGRAM DETAIL VIEW
  if (view === "detail" && selectedProgram) {
    const p = selectedProgram;
    return (
      <div>
        <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 8 }}>
          <span onClick={() => { setView("list"); setSelectedProgram(null); }} style={{ cursor: "pointer", color: COLORS.primary }}>Ayuda Programs</span> › {p.title}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <Badge type={p.status === "Completed" ? "Lifted" : p.status === "Distributing" ? "Renewed" : "Active"}>{p.status}</Badge>
              <span style={{ fontSize: 11, color: COLORS.dimmed }}>Created {p.created} by {p.by}</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 600 }}>{p.title}</h1>
            <p style={{ fontSize: 13, color: COLORS.muted, marginTop: 4 }}>{p.desc}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}><MobileBadge /><Btn primary small>📄 Print master list</Btn><Btn small>📊 Export Excel</Btn></div>
        </div>

        {/* Progress bar */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Distribution progress</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: p.completion === 100 ? COLORS.success : COLORS.primary }}>{p.completion}%</span>
          </div>
          <div style={{ width: "100%", height: 8, background: COLORS.elevated, borderRadius: 4 }}>
            <div style={{ height: "100%", width: `${p.completion}%`, background: p.completion === 100 ? COLORS.success : COLORS.primary, borderRadius: 4, transition: "width 0.5s" }} />
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 12, fontSize: 12, color: COLORS.muted }}>
            <span>👥 <strong style={{ color: COLORS.text }}>{p.beneficiaries}</strong> beneficiaries</span>
            <span>📎 <strong style={{ color: COLORS.text }}>{p.uploads}</strong> signed sheets uploaded</span>
            <span>📷 <strong style={{ color: COLORS.text }}>{p.eventPhotos}</strong> event photos</span>
          </div>
        </Card>

        {/* Beneficiary master list with signature columns */}
        <Card style={{ padding: 0, marginBottom: 16 }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Beneficiary master list</div>
            <div style={{ display: "flex", gap: 4 }}>
              <Btn small style={{ background: COLORS.primaryMuted, color: COLORS.primary }}>📄 Print with blank columns</Btn>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", minWidth: 900 }}>
              <thead><tr style={{ background: COLORS.elevated }}>
                {["#", "ID Number", "Full name", "Barangay", "Category", "Contact", "REMARKS", "SIGNATURE", "DATE RECEIVED"].map((h, i) => (
                  <th key={i} style={{ textAlign: "left", padding: "10px 12px", color: COLORS.muted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${COLORS.border}`, whiteSpace: "nowrap", background: i >= 6 ? "rgba(79,142,247,0.06)" : "transparent" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {[
                  ["MR-CL-000088-2015", "Bool, Aldrin F.", "Silonay", "Boat Owner, Capture Fishing", "+639305115103"],
                  ["MR-CL-001239-2015", "Aguirre, Renato S.", "Maidlang", "Boat Owner, Capture Fishing", "+639706020600"],
                  ["MR-CL-000006-2015", "Dela Peña, Lorelie B.", "Tawagan", "Boat Owner, Vendor", "+639953865285"],
                  ["2025-175205000-08252", "Toston, Ambrocio R.", "Suqui", "Boat Owner, Capture Fishing", "+639814808928"],
                  ["2024-175205000-07896", "Balmes, Anthony B.", "Balite", "Boat Owner, Capture Fishing", "+639099104564"],
                  ["MR-CL-003484-2017", "Padua, Doris R.", "San Rafael", "Boat Owner/Operator", "+639074187728"],
                  ["03-175205000-06226", "Padua, Shella C.", "San Rafael", "Boat Owner/Operator", "+639703648341"],
                  ["MR-CL-000685-2015", "Abac, Fernady S.", "Wawa", "Boat Owner, Capture Fishing", "+639266701921"],
                ].map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${COLORS.elevated}`, color: COLORS.dimmed }}>{i + 1}</td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${COLORS.elevated}`, fontFamily: "monospace", fontSize: 10 }}>{r[0]}</td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${COLORS.elevated}`, fontWeight: 600 }}>{r[1]}</td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${COLORS.elevated}` }}>{r[2]}</td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${COLORS.elevated}`, fontSize: 11 }}>{r[3]}</td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${COLORS.elevated}`, fontSize: 11 }}>{r[4]}</td>
                    {/* Blank columns for printing */}
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${COLORS.elevated}`, background: "rgba(79,142,247,0.03)", minWidth: 120 }}><span style={{ color: COLORS.dimmed, fontSize: 10, fontStyle: "italic" }}>—</span></td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${COLORS.elevated}`, background: "rgba(79,142,247,0.03)", minWidth: 120 }}><span style={{ color: COLORS.dimmed, fontSize: 10, fontStyle: "italic" }}>—</span></td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${COLORS.elevated}`, background: "rgba(79,142,247,0.03)", minWidth: 100 }}><span style={{ color: COLORS.dimmed, fontSize: 10, fontStyle: "italic" }}>—</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "10px 16px", borderTop: `1px solid ${COLORS.border}`, fontSize: 11, color: COLORS.dimmed, display: "flex", justifyContent: "space-between" }}>
            <span>Showing 1-8 of {p.beneficiaries} · Columns with blue tint are blank for hand-filling during distribution</span>
            <span>Pagination →</span>
          </div>
        </Card>

        {/* Upload section — signed sheets + event photos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div><div style={{ fontSize: 14, fontWeight: 600 }}>Signed master list uploads</div><p style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>Upload scanned/photographed signed sheets as proof of distribution</p></div>
              <Btn primary small>+ Upload</Btn>
            </div>
            {/* Upload dropzone */}
            <div style={{ border: `2px dashed ${COLORS.border}`, borderRadius: 8, padding: "20px 16px", textAlign: "center", color: COLORS.dimmed, fontSize: 12, cursor: "pointer", marginBottom: 12 }}>
              📎 Drag files here or click to upload<br />
              <span style={{ fontSize: 10, color: COLORS.dimmed }}>PDF or images (JPG, PNG) · Multiple files allowed · Auto-compressed</span>
            </div>
            {/* Uploaded files list */}
            {p.uploads > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { name: "Lazareto_SignedSheet_Page1.jpg", size: "142 KB", by: "Maria Santos", date: "Apr 22" },
                { name: "Lazareto_SignedSheet_Page2.jpg", size: "138 KB", by: "Maria Santos", date: "Apr 22" },
                { name: "Baruyan_SignedSheet_Full.pdf", size: "1.2 MB", by: "Ana Cruz", date: "Apr 24" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: COLORS.elevated, borderRadius: 6, fontSize: 12 }}>
                  <span style={{ fontSize: 16 }}>{f.name.endsWith(".pdf") ? "📄" : "🖼️"}</span>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 500 }}>{f.name}</div><div style={{ fontSize: 10, color: COLORS.dimmed }}>{f.size} · by {f.by} · {f.date}</div></div>
                  <Btn small style={{ padding: "2px 8px", fontSize: 10 }}>View</Btn>
                </div>
              ))}
            </div>}
          </Card>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div><div style={{ fontSize: 14, fontWeight: 600 }}>Event photos</div><p style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>Documentation of the distribution event</p></div>
              <Btn primary small>+ Upload photos</Btn>
            </div>
            <div style={{ border: `2px dashed ${COLORS.border}`, borderRadius: 8, padding: "20px 16px", textAlign: "center", color: COLORS.dimmed, fontSize: 12, cursor: "pointer", marginBottom: 12 }}>
              📷 Drag photos here or click to upload<br />
              <span style={{ fontSize: 10, color: COLORS.dimmed }}>Images only (JPG, PNG) · Multiple files · Auto-compressed to &lt;200KB</span>
            </div>
            {p.eventPhotos > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {Array.from({ length: Math.min(p.eventPhotos, 8) }).map((_, i) => (
                <div key={i} style={{ aspectRatio: "1", background: COLORS.elevated, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.dimmed, fontSize: 20, cursor: "pointer" }}>
                  📷
                </div>
              ))}
              {p.eventPhotos > 8 && <div style={{ aspectRatio: "1", background: COLORS.elevated, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.primary, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                +{p.eventPhotos - 8} more
              </div>}
            </div>}
          </Card>
        </div>

        {/* Post-distribution verification — Admin marks who received */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Post-distribution verification</div>
              <p style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>Check each beneficiary who received the ayuda based on the signed hardcopy. Use "Check all" then uncheck those who did not receive.</p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn small style={{ background: COLORS.successMuted, color: COLORS.success }}>✓ Check all (this page)</Btn>
              <Btn small>Uncheck all</Btn>
              <Btn primary small>💾 Save verification</Btn>
            </div>
          </div>
          <div style={{ background: COLORS.elevated, borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
            <div style={{ display: "flex", gap: 16 }}>
              <span>✅ Verified received: <strong style={{ color: COLORS.success }}>278</strong></span>
              <span>❌ Did not receive: <strong style={{ color: COLORS.danger }}>8</strong></span>
              <span>⏳ Unchecked: <strong style={{ color: COLORS.warning }}>126</strong></span>
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <span style={{ color: COLORS.dimmed }}>Page</span>
              <Btn small style={{ padding: "2px 8px", fontSize: 10, background: COLORS.primaryMuted, color: COLORS.primary }}>1</Btn>
              <Btn small style={{ padding: "2px 8px", fontSize: 10 }}>2</Btn>
              <Btn small style={{ padding: "2px 8px", fontSize: 10 }}>3</Btn>
              <Btn small style={{ padding: "2px 8px", fontSize: 10 }}>…</Btn>
              <Btn small style={{ padding: "2px 8px", fontSize: 10 }}>21</Btn>
              <span style={{ color: COLORS.dimmed, fontSize: 10, marginLeft: 4 }}>20 per page</span>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead><tr style={{ background: COLORS.elevated }}>
                {["✓", "#", "Full name", "Barangay", "Category", "Received?", "Verified by"].map((h, i) => (
                  <th key={i} style={{ textAlign: i === 0 ? "center" : "left", padding: "8px 10px", color: COLORS.muted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", borderBottom: `1px solid ${COLORS.border}`, width: i === 0 ? 40 : "auto" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {[
                  { name: "Bool, Aldrin F.", brgy: "Silonay", cat: "Boat Owner", checked: true, by: "Juan Reyes" },
                  { name: "Aguirre, Renato S.", brgy: "Maidlang", cat: "Boat Owner", checked: true, by: "Juan Reyes" },
                  { name: "Dela Peña, Lorelie B.", brgy: "Tawagan", cat: "Boat Owner", checked: true, by: "Juan Reyes" },
                  { name: "Toston, Ambrocio R.", brgy: "Suqui", cat: "Boat Owner", checked: true, by: "Juan Reyes" },
                  { name: "Balmes, Anthony B.", brgy: "Balite", cat: "Boat Owner", checked: false, by: null },
                  { name: "Padua, Doris R.", brgy: "San Rafael", cat: "Boat Owner", checked: true, by: "Juan Reyes" },
                  { name: "Padua, Shella C.", brgy: "San Rafael", cat: "Boat Owner", checked: true, by: "Juan Reyes" },
                  { name: "Abac, Fernady S.", brgy: "Wawa", cat: "Boat Owner", checked: false, by: null },
                ].map((r, i) => (
                  <tr key={i} style={{ background: r.checked ? "rgba(34,197,94,0.04)" : "transparent" }}>
                    <td style={{ padding: "8px 10px", borderBottom: `1px solid ${COLORS.elevated}`, textAlign: "center" }}>
                      <input type="checkbox" defaultChecked={r.checked} style={{ width: 16, height: 16, cursor: "pointer" }} />
                    </td>
                    <td style={{ padding: "8px 10px", borderBottom: `1px solid ${COLORS.elevated}`, color: COLORS.dimmed }}>{i + 1}</td>
                    <td style={{ padding: "8px 10px", borderBottom: `1px solid ${COLORS.elevated}`, fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: "8px 10px", borderBottom: `1px solid ${COLORS.elevated}` }}>{r.brgy}</td>
                    <td style={{ padding: "8px 10px", borderBottom: `1px solid ${COLORS.elevated}`, fontSize: 11 }}>{r.cat}</td>
                    <td style={{ padding: "8px 10px", borderBottom: `1px solid ${COLORS.elevated}` }}>
                      {r.checked ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: COLORS.successMuted, color: COLORS.success, padding: "2px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 600 }}>✅ Received</span>
                      : <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: COLORS.elevated, color: COLORS.muted, padding: "2px 8px", borderRadius: 9999, fontSize: 11 }}>⏳ Unchecked</span>}
                    </td>
                    <td style={{ padding: "8px 10px", borderBottom: `1px solid ${COLORS.elevated}`, fontSize: 11, color: COLORS.dimmed }}>{r.by || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Print header preview for master list */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Print preview — master list header</div>
          <div style={{ background: "#fff", color: "#111", borderRadius: 8, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#888" }}>Republic of the Philippines</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>City Government of Calapan</div>
            <div style={{ fontSize: 12, color: "#4F8EF7", marginTop: 1 }}>Fisheries Management Office</div>
            <div style={{ fontSize: 14, fontWeight: 800, marginTop: 10, textTransform: "uppercase", letterSpacing: "0.03em" }}>{p.title}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Beneficiary Master List · {p.beneficiaries} members · Generated {p.created}</div>
            <div style={{ marginTop: 16, fontSize: 10, color: "#aaa", display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 2, textAlign: "center", borderTop: "2px solid #333", paddingTop: 8 }}>
              {["#", "ID Number", "Full Name", "Barangay", "Category", "Contact", "REMARKS", "SIGNATURE", "DATE RECEIVED"].map((h, i) => (
                <div key={i} style={{ fontWeight: 600, color: "#555", padding: 4, background: i >= 6 ? "#f0f4ff" : "#f5f5f5", borderRadius: 2 }}>{h}</div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 600 }}>Ayuda programs</h1><p style={{ fontSize: 13, color: COLORS.muted }}>Create and manage beneficiary programs</p></div>
        <div style={{ display: "flex", gap: 8 }}><MobileBadge /><Btn primary onClick={() => setView(view === "create" ? "list" : "create")}>{view === "create" ? "← Back to list" : "+ Create program"}</Btn></div>
      </div>

      {view === "list" && <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
          <KPI val="4" label="Total programs" /><KPI val="1" label="Currently distributing" color={COLORS.blue} /><KPI val="2" label="Completed" color={COLORS.success} /><KPI val="1,766" label="Total beneficiaries served" color={COLORS.primary} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {programs.map(p => (
            <Card key={p.id} style={{ cursor: "pointer" }} onClick={() => { setSelectedProgram(p); setView("detail"); }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <Badge type={p.status === "Completed" ? "Lifted" : p.status === "Distributing" ? "Renewed" : "Active"}>{p.status}</Badge>
                    <span style={{ fontSize: 11, color: COLORS.dimmed }}>Created {p.created} by {p.by}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600 }}>{p.title}</h3>
                  <p style={{ fontSize: 13, color: COLORS.muted, marginTop: 4 }}>{p.desc}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 24 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.primary }}>{p.beneficiaries}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>beneficiaries</div>
                </div>
              </div>
              {/* Completion bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1, height: 6, background: COLORS.elevated, borderRadius: 3 }}><div style={{ height: "100%", width: `${p.completion}%`, background: p.completion === 100 ? COLORS.success : COLORS.primary, borderRadius: 3 }} /></div>
                <span style={{ fontSize: 11, fontWeight: 600, color: p.completion === 100 ? COLORS.success : COLORS.primary }}>{p.completion}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${COLORS.border}`, paddingTop: 10 }}>
                <div style={{ fontSize: 11, color: COLORS.dimmed, display: "flex", gap: 16 }}>
                  <span>🔍 {p.filters}</span>
                  <span>📎 {p.uploads} signed sheets</span>
                  <span>📷 {p.eventPhotos} photos</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn small>View details →</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </>}

      {view === "create" && <>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Program details</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><label style={{ fontSize: 12, color: COLORS.muted, display: "block", marginBottom: 4 }}>Program title *</label><input placeholder="e.g. Senior Citizen Rice Distribution Q2 2025" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.text, width: "100%" }} /></div>
            <div><label style={{ fontSize: 12, color: COLORS.muted, display: "block", marginBottom: 4 }}>Description *</label><textarea placeholder="Describe the program objective and target beneficiaries..." rows={3} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.text, width: "100%", resize: "vertical", fontFamily: "inherit" }} /></div>
          </div>
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Beneficiary criteria — mix and match filters</div>
          <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16 }}>Combine any filters. All conditions apply (AND logic). Leave blank to include all.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div><label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>Status</label><select style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: COLORS.text, width: "100%" }}><option>All Active</option><option>New only</option><option>Renewed only</option><option>Inactive</option></select></div>
            <div><label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>Barangay</label><select multiple style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: COLORS.text, width: "100%", height: 80 }}><option>All</option><option>Lazareto</option><option>Baruyan</option><option>Silonay</option><option>Ibaba West</option><option>Navotas</option><option>Maidlang</option></select><span style={{ fontSize: 10, color: COLORS.dimmed }}>Ctrl+click to multi-select</span></div>
            <div><label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>Category</label><select multiple style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: COLORS.text, width: "100%", height: 80 }}><option>All</option><option>Capture Fishing</option><option>Boat Owner/Operator</option><option>Vendor</option><option>Gleaning</option><option>Aquaculture</option></select><span style={{ fontSize: 10, color: COLORS.dimmed }}>Ctrl+click to multi-select</span></div>
            <div><label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>Age from</label><input type="number" placeholder="e.g. 60" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: COLORS.text, width: "100%" }} /></div>
            <div><label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>Age to</label><input type="number" placeholder="e.g. 100" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: COLORS.text, width: "100%" }} /></div>
            <div><label style={{ fontSize: 11, color: COLORS.muted, display: "block", marginBottom: 4 }}>Sex</label><select style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: COLORS.text, width: "100%" }}><option>All</option><option>Male</option><option>Female</option></select></div>
          </div>
          <div style={{ background: COLORS.elevated, borderRadius: 8, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Matching beneficiaries: <span style={{ color: COLORS.primary, fontSize: 18 }}>487</span></div>
              <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>Filters: Age 60+ · All barangays · All categories · Status: Active</div>
            </div>
            <Btn small>Preview list →</Btn>
          </div>
        </Card>

        <Card style={{ marginBottom: 16, padding: "12px 16px", fontSize: 12, color: COLORS.muted, background: COLORS.elevated, border: `1px solid ${COLORS.border}` }}>
          📋 <strong style={{ color: COLORS.text }}>After creation:</strong> a printable master list will be generated with blank columns for <strong>REMARKS</strong>, <strong>SIGNATURE</strong>, and <strong>DATE RECEIVED</strong>. Print it, distribute the ayuda, then upload the signed sheets (PDF or photos) and event photos back into the program as proof of distribution. All images are auto-compressed to save storage.
        </Card>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn onClick={() => setView("list")}>Cancel</Btn>
          <Btn primary>✓ Create Ayuda program</Btn>
        </div>
      </>}
    </div>
  );
};



const Kanban = () => {
  const cols = [
    { name: "To do", color: COLORS.muted, cards: [{ t: "Verify Padua contact number", d: "From @mention by Maria Santos", date: "Apr 26", badge: "From comment" }, { t: "Review Silonay renewals batch", d: "42 pending renewals", date: "Apr 25" }, { t: "Print IDs for April batch", d: "18 fisherfolk ready", date: "Apr 24" }] },
    { name: "In progress", color: COLORS.primary, cards: [{ t: "Process Lazareto edit requests", d: "5 pending from encoders", date: "Apr 27" }, { t: "Coordinate Bantay Dagat violation", d: "Ortega case — vessel impound", date: "Apr 28", badge: "Urgent" }] },
    { name: "Done", color: COLORS.success, cards: [{ t: "Approve Bool address change", d: "Edit request approved", date: "Apr 26 ✓" }, { t: "Configure SMTP for Calapan", d: "Email notifications active", date: "Apr 22 ✓" }] },
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 600 }}>Task board</h1></div>
        <div style={{ display: "flex", gap: 8 }}><MobileBadge /><Btn primary small>+ Add task</Btn></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {cols.map((col, ci) => (
          <div key={ci} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 12, minHeight: 380 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} /> {col.name}
              <span style={{ color: COLORS.dimmed, fontWeight: 400, fontSize: 12, marginLeft: "auto" }}>{col.cards.length}</span>
            </div>
            {col.cards.map((card, ki) => (
              <div key={ki} style={{ background: COLORS.elevated, border: `1px solid ${ci === 1 ? `${COLORS.primary}30` : COLORS.border}`, borderRadius: 8, padding: 12, marginBottom: 8, cursor: "grab", opacity: ci === 2 ? 0.6 : 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{card.t}</div>
                <p style={{ fontSize: 11, color: COLORS.muted }}>{card.d}</p>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11 }}>
                  <span style={{ color: COLORS.dimmed }}>{card.date}</span>
                  {card.badge && <Badge type={card.badge === "Urgent" ? "Violation" : "Pending"}>{card.badge}</Badge>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const AuditLogs = () => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
      <div><h1 style={{ fontSize: 22, fontWeight: 600 }}>Audit logs</h1><p style={{ fontSize: 13, color: COLORS.muted }}>All system activity</p></div>
      <div style={{ display: "flex", gap: 8 }}><MobileBadge /><Btn small>Export</Btn></div>
    </div>
    <Table headers={["Timestamp", "User", "Action", "Entity", "Details", "IP"]}>
      {logs.map((l, i) => <tr key={i}><Td style={{ fontSize: 11, color: COLORS.muted }}>{l.time}</Td><Td><strong>{l.user}</strong></Td><Td><Badge type={l.action}>{l.action}</Badge></Td><Td>{l.entity}</Td><Td>{l.detail}</Td><Td style={{ fontSize: 11, color: COLORS.dimmed }}>{l.ip}</Td></tr>)}
    </Table>
  </div>
);

const UserMgmt = () => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
      <div><h1 style={{ fontSize: 22, fontWeight: 600 }}>User management</h1><p style={{ fontSize: 13, color: COLORS.muted }}>8 users</p></div>
      <div style={{ display: "flex", gap: 8 }}><MobileBadge /><Btn primary>+ Add user</Btn></div>
    </div>
    <Table headers={["Name", "Email", "Role", "Status", "Last active", ""]}>
      {users.map((u, i) => (
        <tr key={i}><Td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 28, height: 28, background: `${u.color}25`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: u.color }}>{u.init}</div><strong>{u.name}</strong></div></Td>
          <Td style={{ fontSize: 12 }}>{u.email}</Td><Td><Badge>{u.role}</Badge></Td><Td><Badge type={u.status} /></Td><Td style={{ fontSize: 12, color: COLORS.muted }}>{u.last}</Td><Td><Btn small>{u.status === "Deactivated" ? "Reactivate" : "Edit"}</Btn></Td></tr>
      ))}
    </Table>
  </div>
);

const DataImport = () => {
  const [step, setStep] = useState(1);
  const [excelUploaded, setExcelUploaded] = useState(false);
  const [photosUploaded, setPhotosUploaded] = useState(false);
  const [sigsUploaded, setSigsUploaded] = useState(false);

  const validationResults = {
    total: 2937, valid: 2891, warnings: 36, errors: 10,
    duplicateIds: 10, invalidDates: 2, missingRequired: 6, invalidContacts: 18,
  };

  const photoMatch = { total: 2200, matched: 2150, unmatched: 50, missing: 787 };
  const sigMatch = { total: 2100, matched: 2060, unmatched: 40, missing: 877 };

  const sampleRows = [
    { id: "2025-175205000-08252", name: "Toston, Ambrocio R.", brgy: "Suqui", dob: "07/13/1972", sex: "M", cat: "Boat Owner, Capture Fishing", contact: "+639814808928", photo: true, sig: true, status: "valid" },
    { id: "2024-175205000-07896", name: "Balmes, Anthony B.", brgy: "Balite", dob: "03/15/1989", sex: "M", cat: "Boat Owner, Capture Fishing", contact: "+639099104564", photo: true, sig: true, status: "valid" },
    { id: "MR-CL-003484-2017", name: "Padua, Doris R.", brgy: "San Rafael", dob: "08/22/1979", sex: "F", cat: "Boat Owner/Operator", contact: "+639074187728", photo: true, sig: false, status: "warning" },
    { id: "MR-CL-001143-2015", name: "Ortega, Maria Leizl M.", brgy: "Maidlang", dob: "02/145/1965", sex: "F", cat: "Boat Owner, Capture Fishing", contact: "+639517393625", photo: false, sig: false, status: "error" },
    { id: "2025-175205000-08254", name: "Delos Santos, Antonio Jr.", brgy: "Canubing II", dob: "11/05/1983", sex: "M", cat: "Aquaculture", contact: "+639925811015", photo: true, sig: true, status: "valid" },
    { id: "MR-CL-000088-2015", name: "Bool, Aldrin F.", brgy: "Silonay", dob: "05/12/1974", sex: "M", cat: "Boat Owner, Capture Fishing", contact: "+639305115103", photo: true, sig: true, status: "valid" },
    { id: "MR-CL-002178-2015", name: "Dela Cruz, Rosalita A.", brgy: "San Rafael", dob: "09/30/1978", sex: "F", cat: "Capture Fishing, Vendor", contact: "+639667828821", photo: true, sig: true, status: "valid" },
    { id: "MR-CL-000088-2015", name: "Bool, Aldrin F. (DUPLICATE)", brgy: "Silonay", dob: "05/12/1974", sex: "M", cat: "Boat Owner, Capture Fishing", contact: "+639305115103", photo: false, sig: false, status: "error" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 600 }}>Data import</h1><p style={{ fontSize: 13, color: COLORS.muted }}>Bulk import fisherfolk records from Excel with photos and signatures</p></div>
        <MobileBadge />
      </div>

      {/* Stepper */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
        {[{ n: 1, label: "Upload Excel" }, { n: 2, label: "Upload photos" }, { n: 3, label: "Upload signatures" }, { n: 4, label: "Preview & validate" }, { n: 5, label: "Import" }].map((s, i) => (
          <div key={i} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div onClick={() => setStep(s.n)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: step >= s.n ? (step === s.n ? COLORS.primary : COLORS.success) : COLORS.elevated, color: step >= s.n ? "#fff" : COLORS.dimmed, border: `1px solid ${step >= s.n ? "transparent" : COLORS.border}`, transition: "all 0.2s" }}>
                {step > s.n ? "✓" : s.n}
              </div>
              <span style={{ fontSize: 12, fontWeight: step === s.n ? 600 : 400, color: step === s.n ? COLORS.text : COLORS.muted }}>{s.label}</span>
            </div>
            {i < 4 && <div style={{ flex: 1, height: 1, background: step > s.n ? COLORS.success : COLORS.border, marginLeft: 8 }} />}
          </div>
        ))}
      </div>

      {/* STEP 1: Upload Excel */}
      {step === 1 && (
        <div style={{ maxWidth: 700 }}>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Upload fisherfolk masterlist (Excel)</div>
            <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16 }}>Upload a cleaned .xlsx file with the standard format: ID NUMBER, FULL NAME, DATE OF BIRTH (MM/DD/YYYY), ADDRESS, SEX, IMAGE filename, SIGNATURE filename, RSBSA #, CATEGORY, CONTACT NUMBER, REMARKS</p>
            <div onClick={() => setExcelUploaded(true)} style={{ border: `2px dashed ${excelUploaded ? COLORS.success : COLORS.border}`, borderRadius: 12, padding: "40px 20px", textAlign: "center", cursor: "pointer", background: excelUploaded ? `${COLORS.success}08` : "transparent", transition: "all 0.2s" }}>
              {excelUploaded ? (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.success }}>0001__Complete_Masterlist_CLEANED.xlsx</div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>2,937 rows detected · 11 columns · 245 KB</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Drag Excel file here or click to browse</div>
                  <div style={{ fontSize: 12, color: COLORS.dimmed, marginTop: 4 }}>.xlsx format · Max 10MB</div>
                </div>
              )}
            </div>
          </Card>
          {excelUploaded && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Pre-upload validation</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
                <div style={{ padding: 12, background: `${COLORS.success}10`, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.success }}>{validationResults.valid}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>Valid rows</div>
                </div>
                <div style={{ padding: 12, background: `${COLORS.warning}10`, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.warning }}>{validationResults.warnings}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>Warnings</div>
                </div>
                <div style={{ padding: 12, background: `${COLORS.danger}10`, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.danger }}>{validationResults.errors}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>Errors</div>
                </div>
                <div style={{ padding: 12, background: COLORS.elevated, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{validationResults.total}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>Total rows</div>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Issues detected:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { icon: "❌", text: `${validationResults.duplicateIds} duplicate ID numbers — will keep record with most data, skip duplicates`, color: COLORS.danger },
                  { icon: "❌", text: `${validationResults.invalidDates} invalid date formats (02/145/1965, 11/19/990) — auto-corrected`, color: COLORS.danger },
                  { icon: "⚠", text: `${validationResults.missingRequired} records missing required category — will import as blank, flagged for review`, color: COLORS.warning },
                  { icon: "⚠", text: `${validationResults.invalidContacts} contact numbers without +63 prefix — auto-corrected`, color: COLORS.warning },
                  { icon: "✅", text: "All dates standardized to MM/DD/YYYY", color: COLORS.success },
                  { icon: "✅", text: "Categories normalized to match tenant configuration", color: COLORS.success },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "start", padding: "6px 10px", background: COLORS.elevated, borderRadius: 6, fontSize: 12 }}>
                    <span>{item.icon}</span>
                    <span style={{ color: item.color === COLORS.success ? COLORS.muted : item.color }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Btn primary onClick={() => setStep(2)} style={{ opacity: excelUploaded ? 1 : 0.4 }}>Next: Upload photos →</Btn>
          </div>
        </div>
      )}

      {/* STEP 2: Upload Photos */}
      {step === 2 && (
        <div style={{ maxWidth: 700 }}>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Upload fisherfolk photos</div>
            <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Each photo filename must be the fisherfolk's <strong>ID number</strong> in <strong>.jpg</strong> format.</p>
            <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16 }}>Example: <code style={{ background: COLORS.elevated, padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>2025-175205000-08252.jpg</code>, <code style={{ background: COLORS.elevated, padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>MR-CL-000088-2015.jpg</code></p>
            <div onClick={() => setPhotosUploaded(true)} style={{ border: `2px dashed ${photosUploaded ? COLORS.success : COLORS.border}`, borderRadius: 12, padding: "40px 20px", textAlign: "center", cursor: "pointer", background: photosUploaded ? `${COLORS.success}08` : "transparent" }}>
              {photosUploaded ? (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.success }}>2,200 photos uploaded</div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>All .jpg · Auto-compressed to &lt;200KB each</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Drag photo files here or click to browse</div>
                  <div style={{ fontSize: 12, color: COLORS.dimmed, marginTop: 4 }}>.jpg files only · Filename = ID number · Auto-compressed</div>
                </div>
              )}
            </div>
          </Card>
          {photosUploaded && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Photo matching results</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                <div style={{ padding: 12, background: `${COLORS.success}10`, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.success }}>{photoMatch.matched}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>Matched to Excel rows</div>
                </div>
                <div style={{ padding: 12, background: `${COLORS.warning}10`, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.warning }}>{photoMatch.unmatched}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>Photos without matching ID</div>
                </div>
                <div style={{ padding: 12, background: COLORS.elevated, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{photoMatch.missing}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>Records without photo</div>
                </div>
              </div>
              {photoMatch.unmatched > 0 && (
                <div style={{ marginTop: 12, padding: "8px 12px", background: COLORS.warningMuted, borderRadius: 6, fontSize: 12, color: COLORS.warning }}>
                  ⚠ {photoMatch.unmatched} photos could not be matched — filenames don't match any ID in the Excel. These will be skipped.
                </div>
              )}
            </Card>
          )}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Btn onClick={() => setStep(1)}>← Back</Btn>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={() => setStep(3)} style={{ color: COLORS.muted }}>Skip photos</Btn>
              <Btn primary onClick={() => setStep(3)}>Next: Upload signatures →</Btn>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Upload Signatures */}
      {step === 3 && (
        <div style={{ maxWidth: 700 }}>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Upload fisherfolk signatures</div>
            <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Each signature filename must be the fisherfolk's <strong>ID number</strong> in <strong>.png</strong> format.</p>
            <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 16 }}>Example: <code style={{ background: COLORS.elevated, padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>2025-175205000-08252.png</code></p>
            <div onClick={() => setSigsUploaded(true)} style={{ border: `2px dashed ${sigsUploaded ? COLORS.success : COLORS.border}`, borderRadius: 12, padding: "40px 20px", textAlign: "center", cursor: "pointer", background: sigsUploaded ? `${COLORS.success}08` : "transparent" }}>
              {sigsUploaded ? (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.success }}>2,100 signatures uploaded</div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>All .png · Auto-compressed</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✍️</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Drag signature files here or click to browse</div>
                  <div style={{ fontSize: 12, color: COLORS.dimmed, marginTop: 4 }}>.png files only · Filename = ID number · Auto-compressed</div>
                </div>
              )}
            </div>
          </Card>
          {sigsUploaded && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Signature matching results</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                <div style={{ padding: 12, background: `${COLORS.success}10`, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.success }}>{sigMatch.matched}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>Matched</div>
                </div>
                <div style={{ padding: 12, background: `${COLORS.warning}10`, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.warning }}>{sigMatch.unmatched}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>Unmatched</div>
                </div>
                <div style={{ padding: 12, background: COLORS.elevated, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{sigMatch.missing}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>Records without sig</div>
                </div>
              </div>
            </Card>
          )}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Btn onClick={() => setStep(2)}>← Back</Btn>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={() => setStep(4)} style={{ color: COLORS.muted }}>Skip signatures</Btn>
              <Btn primary onClick={() => setStep(4)}>Next: Preview & validate →</Btn>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Preview & Validate */}
      {step === 4 && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 16 }}>
            <KPI val="2,937" label="Total records" /><KPI val="2,891" label="Ready to import" color={COLORS.success} /><KPI val="2,150" label="With photos" color={COLORS.primary} /><KPI val="2,060" label="With signatures" color={COLORS.blue} /><KPI val="10" label="Will be skipped" color={COLORS.danger} />
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <Btn small style={{ background: COLORS.primaryMuted, color: COLORS.primary }}>All (2,937)</Btn>
            <Btn small>✅ Valid (2,891)</Btn>
            <Btn small>⚠ Warnings (36)</Btn>
            <Btn small>❌ Errors (10)</Btn>
            <Btn small>📷 No photo (787)</Btn>
            <Btn small>✍ No signature (877)</Btn>
          </div>

          <Card style={{ padding: 0, marginBottom: 16 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", minWidth: 1000 }}>
                <thead><tr style={{ background: COLORS.elevated }}>
                  {["Status", "#", "ID Number", "Full name", "Barangay", "DOB", "Sex", "Category", "Contact", "📷", "✍️"].map((h, i) => (
                    <th key={i} style={{ textAlign: i === 0 ? "center" : "left", padding: "8px 10px", color: COLORS.muted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", borderBottom: `1px solid ${COLORS.border}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {sampleRows.map((r, i) => (
                    <tr key={i} style={{ background: r.status === "error" ? `${COLORS.danger}08` : r.status === "warning" ? `${COLORS.warning}06` : "transparent" }}>
                      <td style={{ padding: "7px 10px", borderBottom: `1px solid ${COLORS.elevated}`, textAlign: "center" }}>
                        {r.status === "valid" && <span style={{ color: COLORS.success }}>✅</span>}
                        {r.status === "warning" && <span style={{ color: COLORS.warning }}>⚠</span>}
                        {r.status === "error" && <span style={{ color: COLORS.danger }}>❌</span>}
                      </td>
                      <td style={{ padding: "7px 10px", borderBottom: `1px solid ${COLORS.elevated}`, color: COLORS.dimmed }}>{i + 1}</td>
                      <td style={{ padding: "7px 10px", borderBottom: `1px solid ${COLORS.elevated}`, fontFamily: "monospace", fontSize: 10, color: r.status === "error" ? COLORS.danger : COLORS.text }}>{r.id}</td>
                      <td style={{ padding: "7px 10px", borderBottom: `1px solid ${COLORS.elevated}`, fontWeight: 600 }}>{r.name}</td>
                      <td style={{ padding: "7px 10px", borderBottom: `1px solid ${COLORS.elevated}` }}>{r.brgy}</td>
                      <td style={{ padding: "7px 10px", borderBottom: `1px solid ${COLORS.elevated}`, color: r.dob.includes("145") ? COLORS.danger : COLORS.text }}>{r.dob} {r.dob.includes("145") && <span style={{ fontSize: 9, color: COLORS.danger }}>← invalid</span>}</td>
                      <td style={{ padding: "7px 10px", borderBottom: `1px solid ${COLORS.elevated}` }}>{r.sex}</td>
                      <td style={{ padding: "7px 10px", borderBottom: `1px solid ${COLORS.elevated}`, fontSize: 11 }}>{r.cat}</td>
                      <td style={{ padding: "7px 10px", borderBottom: `1px solid ${COLORS.elevated}`, fontSize: 11 }}>{r.contact}</td>
                      <td style={{ padding: "7px 10px", borderBottom: `1px solid ${COLORS.elevated}`, textAlign: "center", color: r.photo ? COLORS.success : COLORS.warning }}>{r.photo ? "✅" : "—"}</td>
                      <td style={{ padding: "7px 10px", borderBottom: `1px solid ${COLORS.elevated}`, textAlign: "center", color: r.sig ? COLORS.success : COLORS.warning }}>{r.sig ? "✅" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "10px 16px", borderTop: `1px solid ${COLORS.border}`, fontSize: 11, color: COLORS.muted, display: "flex", justifyContent: "space-between" }}>
              <span>Showing 1-8 of 2,937 · Red rows = errors (will be skipped) · Yellow rows = warnings (will import with flags)</span>
              <span>Page 1 of 147</span>
            </div>
          </Card>

          <Card style={{ padding: "12px 16px", marginBottom: 16, background: COLORS.elevated }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Import summary</div>
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: COLORS.muted }}>
              <span>✅ <strong style={{ color: COLORS.success }}>2,891</strong> records will be imported</span>
              <span>⚠ <strong style={{ color: COLORS.warning }}>36</strong> with warnings (imported but flagged)</span>
              <span>❌ <strong style={{ color: COLORS.danger }}>10</strong> will be skipped (duplicates + invalid)</span>
              <span>📷 <strong>2,150</strong> photos matched</span>
              <span>✍ <strong>2,060</strong> signatures matched</span>
            </div>
            <p style={{ fontSize: 11, color: COLORS.dimmed, marginTop: 6 }}>Records without photos/signatures will be imported as incomplete — staff can add them later via the Daily Operations board (no approval needed for basic info).</p>
          </Card>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Btn onClick={() => setStep(3)}>← Back</Btn>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn small>📥 Download error report</Btn>
              <Btn primary onClick={() => setStep(5)}>✓ Confirm import (2,891 records)</Btn>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Import Complete */}
      {step === 5 && (
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <Card style={{ padding: "40px 24px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Import complete!</h2>
            <p style={{ fontSize: 14, color: COLORS.muted, marginBottom: 24 }}>Successfully imported 2,891 fisherfolk records into Calapan City tenant.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
              <div style={{ padding: 14, background: `${COLORS.success}10`, borderRadius: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.success }}>2,891</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>Records imported</div>
              </div>
              <div style={{ padding: 14, background: `${COLORS.primary}10`, borderRadius: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.primary }}>2,150</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>Photos linked</div>
              </div>
              <div style={{ padding: 14, background: `${COLORS.blue}10`, borderRadius: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.blue }}>2,060</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>Signatures linked</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24, textAlign: "left" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 10px", background: COLORS.elevated, borderRadius: 6, fontSize: 12 }}>
                <span>✅</span><span>QR codes auto-generated for all {2891} records</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 10px", background: COLORS.elevated, borderRadius: 6, fontSize: 12 }}>
                <span>✅</span><span>All images compressed to &lt;200KB</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 10px", background: COLORS.elevated, borderRadius: 6, fontSize: 12 }}>
                <span>✅</span><span>Status set to "Active" for all imported members</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 10px", background: COLORS.elevated, borderRadius: 6, fontSize: 12 }}>
                <span>⚠</span><span style={{ color: COLORS.warning }}>741 records imported without photo — available in Daily Ops for completion</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 10px", background: COLORS.elevated, borderRadius: 6, fontSize: 12 }}>
                <span>⚠</span><span style={{ color: COLORS.warning }}>831 records imported without signature</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <Btn small>📥 Download import report</Btn>
              <Btn small>📥 Download error log (10 skipped)</Btn>
              <Btn primary>Go to Fisherfolk list →</Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const Settings = () => {
  const [settingsTab, setSettingsTab] = useState("general");
  const categories = [
    { name: "Capture Fishing", icon: "🎣", color: COLORS.primary, members: 1025, status: "Active" },
    { name: "Boat Owner/Operator", icon: "⛵", color: COLORS.blue, members: 876, status: "Active" },
    { name: "Vendor", icon: "🏪", color: COLORS.warning, members: 490, status: "Active" },
    { name: "Gleaning", icon: "🐚", color: "#6BA3F7", members: 157, status: "Active" },
    { name: "Aquaculture", icon: "🐟", color: "#06b6d4", members: 27, status: "Active" },
    { name: "Fish Processing", icon: "🔪", color: COLORS.muted, members: 11, status: "Active" },
  ];

  return (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
      <div><h1 style={{ fontSize: 22, fontWeight: 600 }}>Tenant settings</h1><p style={{ fontSize: 13, color: COLORS.muted }}>Calapan City configuration</p></div>
      <MobileBadge />
    </div>

    <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${COLORS.border}` }}>
      {[{ id: "general", label: "⚙ General" }, { id: "categories", label: "📂 Categories" }, { id: "violations", label: "⚠ Violations" }, { id: "email", label: "📧 Email (SMTP)" }].map(t => (
        <div key={t.id} onClick={() => setSettingsTab(t.id)} style={{ padding: "8px 16px", fontSize: 13, fontWeight: settingsTab === t.id ? 600 : 400, color: settingsTab === t.id ? COLORS.primary : COLORS.muted, borderBottom: settingsTab === t.id ? `2px solid ${COLORS.primary}` : "2px solid transparent", cursor: "pointer", marginBottom: -1 }}>{t.label}</div>
      ))}
    </div>

    {settingsTab === "general" && (
      <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>General</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><label style={{ fontSize: 12, color: COLORS.muted }}>LGU name</label><input defaultValue="City of Calapan" style={{ marginTop: 4, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.text, width: "100%" }} /></div>
            <div><label style={{ fontSize: 12, color: COLORS.muted }}>Registration year</label><input defaultValue="2025" style={{ marginTop: 4, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.text, width: 120 }} /></div>
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>ID printing — mayor</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: 12, color: COLORS.muted }}>Mayor name</label><input defaultValue="HON. ARNAN C. PANALIGAN" style={{ marginTop: 4, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.text, width: "100%" }} /></div>
            <div><label style={{ fontSize: 12, color: COLORS.muted }}>Mayor signature</label><div style={{ marginTop: 4, border: `2px dashed ${COLORS.border}`, borderRadius: 8, padding: 12, textAlign: "center", color: COLORS.dimmed, fontSize: 11, cursor: "pointer" }}>Upload signature image</div></div>
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Accent color</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {["#4F8EF7", "#22c55e", "#ef4444", "#f59e0b", "#06b6d4", "#ec4899"].map((c, i) => (
              <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: i === 0 ? "2px solid #fff" : "2px solid transparent", boxShadow: i === 0 ? "0 0 0 2px #4F8EF7" : "none" }} />
            ))}
            <input type="color" defaultValue="#4F8EF7" style={{ width: 28, height: 28, padding: 0, border: "none", borderRadius: 6, cursor: "pointer", marginLeft: 8 }} />
            <span style={{ fontSize: 12, color: COLORS.muted }}>#4F8EF7</span>
          </div>
        </Card>
        <div style={{ display: "flex", justifyContent: "flex-end" }}><Btn primary>Save settings</Btn></div>
      </div>
    )}

    {settingsTab === "categories" && (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Fisherfolk categories</div>
            <p style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>Manage categories, icons, and display order. Icons appear on fisherfolk ID cards.</p>
          </div>
          <Btn primary>+ Add category</Btn>
        </div>

        {/* Category table */}
        <Card style={{ padding: 0, marginBottom: 16 }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead><tr>
              {["", "Icon", "Category name", "ID card icon", "Members", "Status", "Actions"].map((h, i) => (
                <th key={i} style={{ textAlign: i === 0 ? "center" : "left", padding: "10px 12px", color: COLORS.muted, fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${COLORS.border}`, width: i === 0 ? 40 : i === 1 ? 60 : "auto" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={i}>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${COLORS.elevated}`, textAlign: "center", cursor: "grab", color: COLORS.dimmed }}>⋮⋮</td>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${COLORS.elevated}` }}>
                    <div style={{ width: 36, height: 36, background: `${c.color}18`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{c.icon}</div>
                  </td>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${COLORS.elevated}` }}>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: COLORS.dimmed, marginTop: 1, fontFamily: "monospace" }}>slug: {c.name.toLowerCase().replace(/[^a-z]/g, "_")}</div>
                  </td>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${COLORS.elevated}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, background: COLORS.elevated, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${COLORS.border}` }}>
                        <span style={{ fontSize: 14 }}>{c.icon}</span>
                      </div>
                      <div style={{ fontSize: 10 }}>
                        <div style={{ color: COLORS.muted }}>Emoji</div>
                        <span style={{ color: COLORS.primary, cursor: "pointer", fontSize: 10 }}>Change to image ↗</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${COLORS.elevated}` }}>
                    <span style={{ fontWeight: 600 }}>{c.members}</span>
                    <span style={{ color: COLORS.dimmed, fontSize: 11 }}> members</span>
                  </td>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${COLORS.elevated}` }}>
                    <Badge type={c.status}>{c.status}</Badge>
                  </td>
                  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${COLORS.elevated}` }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Btn small>Edit</Btn>
                      <Btn small style={{ color: COLORS.danger }}>Disable</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Add / Edit form */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Add new category</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: COLORS.muted, display: "block", marginBottom: 4 }}>Category name *</label>
                <input placeholder="e.g. Seaweed Farming" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.text, width: "100%" }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: COLORS.muted, display: "block", marginBottom: 4 }}>Description</label>
                <input placeholder="Brief description of this category" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.text, width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: COLORS.muted, display: "block", marginBottom: 4 }}>Display color</label>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input type="color" defaultValue="#4F8EF7" style={{ width: 28, height: 28, padding: 0, border: "none", borderRadius: 6, cursor: "pointer" }} />
                  <span style={{ fontSize: 11, color: COLORS.dimmed }}>#4F8EF7</span>
                </div>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: COLORS.muted, display: "block", marginBottom: 4 }}>Icon for ID card *</label>
              <p style={{ fontSize: 11, color: COLORS.dimmed, marginBottom: 8 }}>Choose an emoji or upload a custom image icon. This icon will appear on the fisherfolk ID card next to the category name.</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div onClick={() => {}} style={{ padding: "8px 14px", background: COLORS.primaryMuted, border: `1px solid ${COLORS.primary}30`, borderRadius: 6, fontSize: 12, fontWeight: 600, color: COLORS.primary, cursor: "pointer" }}>Emoji</div>
                <div style={{ padding: "8px 14px", background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, color: COLORS.muted, cursor: "pointer" }}>Upload image</div>
              </div>
              {/* Emoji picker mockup */}
              <div style={{ background: COLORS.elevated, borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 10, color: COLORS.dimmed, marginBottom: 6 }}>Select an emoji icon:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {["🎣", "⛵", "🏪", "🐚", "🐟", "🔪", "🦐", "🦑", "🐠", "🌊", "🪝", "🧊", "🥡", "🏗️", "🌿", "🦀", "🐡", "🪸", "⚓", "🛟", "🚤", "🎏", "🧂", "🍤"].map((e, i) => (
                    <div key={i} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, cursor: "pointer", background: i === 0 ? COLORS.primaryMuted : "transparent", border: i === 0 ? `1px solid ${COLORS.primary}30` : `1px solid transparent`, fontSize: 16 }}>{e}</div>
                  ))}
                </div>
              </div>
              {/* Image upload option */}
              <div style={{ marginTop: 8, border: `2px dashed ${COLORS.border}`, borderRadius: 8, padding: "12px 10px", textAlign: "center", color: COLORS.dimmed, fontSize: 11, cursor: "pointer" }}>
                📎 Or drag image icon here (PNG, SVG, max 50KB)<br />
                <span style={{ fontSize: 10 }}>Recommended: 64×64px transparent PNG</span>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 12, color: COLORS.muted, display: "block", marginBottom: 4 }}>Preview on ID card</label>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#fff", borderRadius: 6, color: "#333" }}>
                  <span style={{ fontSize: 16 }}>🎣</span>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>Capture Fishing</span>
                </div>
                <p style={{ fontSize: 10, color: COLORS.dimmed, marginTop: 4 }}>This is how the category + icon will appear on the printed ID</p>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Btn>Cancel</Btn>
            <Btn primary>+ Add category</Btn>
          </div>
        </Card>
      </div>
    )}

    {settingsTab === "violations" && (
      <div style={{ maxWidth: 640 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}><span style={{ fontSize: 14, fontWeight: 600 }}>Violation subjects</span><Btn small>+ Add</Btn></div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["Illegal fishing method", "Fishing in restricted area", "Use of banned fishing gear", "Unregistered vessel", "Violation of closed season", "Dynamite fishing", "Cyanide fishing", "Trawling in municipal waters"].map((s, i) => (
              <span key={i} style={{ padding: "4px 10px", background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer" }}>{s} ✕</span>
            ))}
          </div>
        </Card>
      </div>
    )}

    {settingsTab === "email" && (
      <div style={{ maxWidth: 640 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Email (SMTP)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[["SMTP host", "smtp.gmail.com"], ["SMTP port", "587"], ["Username", "frms@calapan.gov.ph"], ["Password", ""]].map(([l, v], i) => (
              <div key={i}><label style={{ fontSize: 12, color: COLORS.muted }}>{l}</label><input type={l === "Password" ? "password" : "text"} defaultValue={v} placeholder={l === "Password" ? "••••••••" : ""} style={{ marginTop: 4, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.text, width: "100%" }} /></div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}><Btn primary>Save SMTP</Btn></div>
        </Card>
      </div>
    )}
  </div>
  );
};

const Notifications = () => {
  const notifs = [
    { icon: "⚠", color: COLORS.danger, title: "Violation filed", desc: "Pedro Ramos filed a violation on Ortega, Maria Leizl (Illegal fishing method)", ago: "2 min ago", unread: true },
    { icon: "✋", color: COLORS.warning, title: "Edit request pending", desc: "Maria Santos requested contact change for Padua, Doris R.", ago: "2 hrs ago", unread: true },
    { icon: "💬", color: COLORS.primary, title: "@mentioned", desc: "Maria Santos mentioned you: 'please verify on next visit'", ago: "2 days ago", unread: true },
    { icon: "✓", color: COLORS.success, title: "Edit approved", desc: "You approved address change for Aguirre, Renato S.", ago: "3 hrs ago", unread: false },
    { icon: "✓", color: COLORS.success, title: "Violation lifted", desc: "You lifted the violation on Bool, Aldrin F.", ago: "Yesterday", unread: false },
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 600 }}>Notifications</h1><p style={{ fontSize: 13, color: COLORS.muted }}>3 unread</p></div>
        <div style={{ display: "flex", gap: 8 }}><MobileBadge first /><Btn small>Mark all read</Btn></div>
      </div>
      <Card style={{ padding: 0 }}>
        {notifs.map((n, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: 14, borderBottom: `1px solid ${COLORS.elevated}`, borderLeft: n.unread ? `3px solid ${COLORS.primary}` : "3px solid transparent", cursor: "pointer" }}>
            <div style={{ width: 36, height: 36, background: `${n.color}18`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>{n.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: n.unread ? COLORS.text : COLORS.muted }}><strong>{n.title}</strong> — {n.desc}</div>
              <div style={{ fontSize: 11, color: COLORS.dimmed, marginTop: 2 }}>{n.ago}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};

const MyProfile = () => (
  <div>
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 20 }}><h1 style={{ fontSize: 22, fontWeight: 600 }}>My profile</h1><MobileBadge first /></div>
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, background: COLORS.primaryMuted, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: COLORS.primary }}>JR</div>
          <div><h2 style={{ fontSize: 18, fontWeight: 600 }}>Juan Reyes</h2><p style={{ fontSize: 13, color: COLORS.muted }}>Admin · Calapan City</p><p style={{ fontSize: 12, color: COLORS.dimmed }}>juan.reyes@calapan.gov.ph</p></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={{ fontSize: 12, color: COLORS.muted }}>Full name</label><input defaultValue="Juan Reyes" style={{ marginTop: 4, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.text, width: "100%" }} /></div>
          <div><label style={{ fontSize: 12, color: COLORS.muted }}>Email</label><input defaultValue="juan.reyes@calapan.gov.ph" readOnly style={{ marginTop: 4, background: "#0a0a0a", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.dimmed, width: "100%" }} /></div>
        </div>
      </Card>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Change password</div>
        {["Current password", "New password", "Confirm new password"].map((l, i) => (
          <div key={i} style={{ marginBottom: 12 }}><label style={{ fontSize: 12, color: COLORS.muted }}>{l}</label><input type="password" placeholder="••••••••" style={{ marginTop: 4, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.text, width: "100%" }} /></div>
        ))}
      </Card>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>My recent activity</div>
        <div style={{ fontSize: 12 }}>
          {[["Today 10:15", "Renewed Balmes, Anthony B."], ["Today 9:02", "Approved edit: Aguirre, Renato S."], ["Yesterday 4:12", "Lifted violation: Bool, Aldrin F."], ["Yesterday 2:30", "Rejected edit: Monterey, Randy F."]].map(([d, t], i) => (
            <div key={i} style={{ padding: "6px 0", borderBottom: i < 3 ? `1px solid ${COLORS.elevated}` : "none" }}><span style={{ color: COLORS.dimmed }}>{d}</span> — {t}</div>
          ))}
        </div>
      </Card>
      <div style={{ display: "flex", justifyContent: "flex-end" }}><Btn primary>Save changes</Btn></div>
    </div>
  </div>
);

export default function App() {
  const [screen, setScreen] = useState("dashboard");
  const [selectedFish, setSelectedFish] = useState(null);

  const navMap = { "fisherfolk-profile": "fisherfolk", "violation-form": "violations" };
  const activeNav = navMap[screen] || screen;

  const renderScreen = () => {
    switch (screen) {
      case "dashboard": return <Dashboard />;
      case "fisherfolk": return <FisherfolkList onSelect={(f) => { setSelectedFish(f); setScreen("fisherfolk-profile"); }} />;
      case "fisherfolk-profile": return <FisherfolkProfile person={selectedFish || fisherfolk[0]} onBack={() => setScreen("fisherfolk")} />;
      case "vessels": return <VesselsList />;
      case "scanner": return (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <div><h1 style={{ fontSize: 22, fontWeight: 600 }}>QR scanner</h1><p style={{ fontSize: 13, color: COLORS.muted }}>Scan fisherfolk or vessel QR code to view profile</p></div>
            <MobileBadge first />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
              <div style={{ width: 240, height: 240, background: "#000", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ width: 160, height: 160, border: "2px solid " + COLORS.primary, borderRadius: 8, position: "relative" }}>
                  <div style={{ position: "absolute", top: -2, left: -2, width: 20, height: 20, borderTop: `3px solid ${COLORS.primary}`, borderLeft: `3px solid ${COLORS.primary}`, borderRadius: "4px 0 0 0" }} />
                  <div style={{ position: "absolute", top: -2, right: -2, width: 20, height: 20, borderTop: `3px solid ${COLORS.primary}`, borderRight: `3px solid ${COLORS.primary}`, borderRadius: "0 4px 0 0" }} />
                  <div style={{ position: "absolute", bottom: -2, left: -2, width: 20, height: 20, borderBottom: `3px solid ${COLORS.primary}`, borderLeft: `3px solid ${COLORS.primary}`, borderRadius: "0 0 0 4px" }} />
                  <div style={{ position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderBottom: `3px solid ${COLORS.primary}`, borderRight: `3px solid ${COLORS.primary}`, borderRadius: "0 0 4px 0" }} />
                  {/* Scan line animation placeholder */}
                  <div style={{ position: "absolute", top: "40%", left: 4, right: 4, height: 2, background: COLORS.primary, opacity: 0.7, borderRadius: 1 }} />
                </div>
              </div>
              <p style={{ fontSize: 12, color: COLORS.muted, marginTop: 12 }}>Point camera at QR code on fisherfolk ID or vessel plate</p>
              <Btn primary style={{ marginTop: 12 }}>📷 Activate camera</Btn>
            </Card>
            <div>
              <Card style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Or search manually</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input placeholder="Enter ID number, name, or MFVR#..." style={{ flex: 1, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.text }} />
                  <Btn primary>Search</Btn>
                </div>
              </Card>
              <Card style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Recent scans</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { type: "🪪", id: "2025-175205000-08252", name: "Toston, Ambrocio R.", time: "2 min ago", entity: "Fisherfolk" },
                    { type: "⛵", id: "MFVR-CL-000142", name: "San Pedro II", time: "15 min ago", entity: "Vessel" },
                    { type: "🪪", id: "MR-CL-001143-2015", name: "Ortega, Maria Leizl M.", time: "1 hr ago", entity: "Fisherfolk" },
                    { type: "⛵", id: "MFVR-CL-000318", name: "Malakas", time: "2 hrs ago", entity: "Vessel" },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: COLORS.elevated, borderRadius: 6, cursor: "pointer" }}>
                      <span style={{ fontSize: 16 }}>{s.type}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</div>
                        <div style={{ fontSize: 10, color: COLORS.dimmed, fontFamily: "monospace" }}>{s.id}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <Badge type={s.entity === "Fisherfolk" ? "Active" : "Renewed"}>{s.entity}</Badge>
                        <div style={{ fontSize: 9, color: COLORS.dimmed, marginTop: 2 }}>{s.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Scan targets</div>
                <div style={{ display: "flex", gap: 8, fontSize: 12, color: COLORS.muted }}>
                  <div style={{ flex: 1, padding: 10, background: COLORS.elevated, borderRadius: 6, textAlign: "center" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>🪪</div>
                    <div style={{ fontWeight: 600, color: COLORS.text }}>Fisherfolk ID</div>
                    <div style={{ fontSize: 10 }}>PVC card QR code</div>
                  </div>
                  <div style={{ flex: 1, padding: 10, background: COLORS.elevated, borderRadius: 6, textAlign: "center" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>⛵</div>
                    <div style={{ fontWeight: 600, color: COLORS.text }}>Vessel plate</div>
                    <div style={{ fontSize: 10 }}>Registration QR sticker</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      );
      case "violations": return <ViolationsList onFile={() => setScreen("violation-form")} />;
      case "violation-form": return (
        <div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 8 }}><span onClick={() => setScreen("violations")} style={{ cursor: "pointer", color: COLORS.primary }}>Violations</span> › File new</div>
          <MobileBadge first />
          <div style={{ maxWidth: 640, marginTop: 16 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>File violation report</h1>
            <Card>
              <div style={{ marginBottom: 16 }}><label style={{ fontSize: 12, color: COLORS.muted }}>Search fisherfolk *</label><div style={{ display: "flex", gap: 8, marginTop: 4 }}><input placeholder="Scan QR, search ID, name..." style={{ flex: 1, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.text }} /><Btn>📷 QR</Btn></div></div>
              <div style={{ background: COLORS.elevated, borderRadius: 8, padding: 12, marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, background: COLORS.border, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: COLORS.dimmed }}>OM</div>
                <div><strong style={{ fontSize: 13 }}>Ortega, Maria Leizl Matira</strong><br /><span style={{ fontSize: 11, color: COLORS.muted }}>MR-CL-001143-2015 · Maidlang</span></div>
                <Badge type="Active" />
              </div>
              <div style={{ marginBottom: 16 }}><label style={{ fontSize: 12, color: COLORS.muted }}>Violation subject *</label><select style={{ marginTop: 4, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.text, width: "100%" }}><option>Select...</option><option>Illegal fishing method</option><option>Fishing in restricted area</option></select></div>
              <div style={{ marginBottom: 16 }}><label style={{ fontSize: 12, color: COLORS.muted }}>Details *</label><textarea placeholder="Describe violation..." rows={3} style={{ marginTop: 4, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.text, width: "100%", resize: "vertical", fontFamily: "inherit" }} /></div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: COLORS.muted, marginBottom: 8, display: "block" }}>Apply to linked vessel?</label>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", background: COLORS.dangerMuted, border: `1px solid ${COLORS.danger}30`, borderRadius: 6, fontSize: 12, color: COLORS.danger, cursor: "pointer" }}><input type="checkbox" defaultChecked /> ⛵ Malakas (MFVR-CL-000318) — Impound</label>
              </div>
              <div style={{ marginBottom: 16 }}><label style={{ fontSize: 12, color: COLORS.muted }}>Evidence photos</label><div style={{ marginTop: 4, border: `2px dashed ${COLORS.border}`, borderRadius: 8, padding: 20, textAlign: "center", color: COLORS.dimmed, fontSize: 12, cursor: "pointer" }}>📷 Upload evidence · Auto-compressed</div></div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}><Btn onClick={() => setScreen("violations")}>Cancel</Btn><Btn danger>Submit violation</Btn></div>
            </Card>
          </div>
        </div>
      );
      case "requests": return <EditRequests />;
      case "ids": return <IDGeneration />;
      case "renewal": return <Renewal />;
      case "reports": return <Reports />;
      case "ayuda": return <AyudaProgram />;
      case "kanban": return <Kanban />;
      case "logs": return <AuditLogs />;
      case "users": return <UserMgmt />;
      case "import": return <DataImport />;
      case "settings": return <Settings />;
      case "notifications": return <Notifications />;
      case "profile": return <MyProfile />;
      default: return <Dashboard />;
    }
  };

  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14, minHeight: "100vh" }}>
      <div style={{ background: COLORS.warning, color: "#111", padding: "6px 16px", fontSize: 11, fontWeight: 600, textAlign: "center" }}>
        📐 PHASE 2.8 MOCKUP — FRMS — Visual check only. No data persists.
      </div>
      <header style={{ background: "#111", borderBottom: `1px solid ${COLORS.border}`, height: 52, display: "flex", alignItems: "center", padding: "0 16px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 190 }}>
          <div style={{ width: 26, height: 26, background: COLORS.primary, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: "#fff" }}>F</div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>FRMS</span>
          <span style={{ fontSize: 10, color: COLORS.dimmed, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "1px 5px" }}>Calapan</span>
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <input placeholder="Search fisherfolk, vessels, violations..." style={{ maxWidth: 380, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 12, color: COLORS.text, width: "100%" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 190, justifyContent: "flex-end" }}>
          <div onClick={() => setScreen("notifications")} style={{ width: 30, height: 30, background: COLORS.elevated, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", fontSize: 13 }}>🔔<span style={{ position: "absolute", top: -1, right: -1, width: 7, height: 7, background: COLORS.danger, borderRadius: "50%", border: "2px solid #111" }} /></div>
          <div onClick={() => setScreen("profile")} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <div style={{ width: 26, height: 26, background: COLORS.primaryMuted, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: COLORS.primary }}>JR</div>
            <span style={{ fontSize: 12 }}>Juan Reyes</span>
          </div>
        </div>
      </header>
      <div style={{ display: "flex", minHeight: "calc(100vh - 80px)" }}>
        <SideNav active={activeNav} onNav={setScreen} />
        <main style={{ flex: 1, padding: "24px 32px", minWidth: 0 }}>{renderScreen()}</main>
      </div>
      <footer style={{ padding: "16px 32px", borderTop: `1px solid ${COLORS.border}`, fontSize: 11, color: COLORS.dimmed, textAlign: "center", marginLeft: 210 }}>
        Mockup by Spec-Driven Platform V31 · Phase 2.8 · Full React JSX
      </footer>
    </div>
  );
}
