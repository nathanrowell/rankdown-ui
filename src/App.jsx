import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("./state.json?ts=" + Date.now(), { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load state.json (" + r.status + ")");
        return r.json();
      })
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>{data?.gameTitle ?? "Rankdown UI"}</h1>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {!data && !err && <p>Loading state.json…</p>}
      {data && (
        <pre style={{ background: "#111", color: "#eee", padding: 16, borderRadius: 12, overflowX: "auto" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
