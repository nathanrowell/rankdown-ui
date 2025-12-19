import { useEffect, useMemo, useState } from "react";
import "./App.css";

const REFRESH_MS = 20000;

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Pill({ children, tone = "neutral" }) {
  return <span className={classNames("pill", `pill-${tone}`)}>{children}</span>;
}

function Card({ title, right, children }) {
  return (
    <div className="card">
      <div className="cardHead">
        <h2 className="cardTitle">{title}</h2>
        <div className="cardRight">{right}</div>
      </div>
      <div className="cardBody">{children}</div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setErr("");
      const res = await fetch(`./state.json?ts=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load state.json (${res.status})`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setErr(e?.message || "Failed to load state.json");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  const round = data?.currentRound;

  const updatedAtPretty = useMemo(() => {
    if (!data?.updatedAt) return "—";
    try {
      return new Date(data.updatedAt).toLocaleString();
    } catch {
      return String(data.updatedAt);
    }
  }, [data?.updatedAt]);

  const nomineeStatus = useMemo(() => {
    if (!round?.nominees) return new Map();
    const saved = new Set(Object.values(round.saves || {}));
    const elim = new Set(Object.values(round.elims || {}));
    const leftover = new Set(round.leftoversEliminated || []);
    const m = new Map();
    for (const n of round.nominees) {
      if (leftover.has(n)) m.set(n, "leftover");
      else if (elim.has(n)) m.set(n, "elim");
      else if (saved.has(n)) m.set(n, "saved");
      else m.set(n, "pending");
    }
    return m;
  }, [round]);

  if (loading) {
    return (
      <div className="page">
        <header className="topbar">
          <div>
            <h1>Rankdown</h1>
            <div className="sub">Loading…</div>
          </div>
        </header>
        <div className="grid">
          <div className="card"><div className="cardBody">Fetching state…</div></div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="page">
        <header className="topbar">
          <div>
            <h1>Rankdown</h1>
            <div className="sub">Couldn’t load the game state</div>
          </div>
          <button className="btn" onClick={load}>Retry</button>
        </header>
        <div className="grid">
          <div className="card">
            <div className="cardBody">
              <div className="error">{err}</div>
              <div className="muted">
                Make sure <code>public/state.json</code> is valid JSON and deployed.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>{data.gameTitle || "Rankdown"}</h1>
          <div className="sub">
            Updated: <strong>{updatedAtPretty}</strong>
            <span className="dot">•</span>
            Auto-refresh: {Math.round(REFRESH_MS / 1000)}s
          </div>
        </div>
        <button className="btn" onClick={load}>Refresh now</button>
      </header>

      <div className="grid">
        <Card title="Players" right={<Pill tone="neutral">{(data.players || []).length} total</Pill>}>
          <div className="chips">
            {(data.players || []).map((p) => (
              <span key={p} className="chip">{p}</span>
            ))}
          </div>
        </Card>

        <Card
          title="Current Round"
          right={round ? <Pill tone="neutral">Round {round.roundNumber}</Pill> : <Pill tone="neutral">—</Pill>}
        >
          {!round ? (
            <div className="muted">No active round in state.json.</div>
          ) : (
            <div className="stack">
              <div className="row">
                <div className="label">Nominator</div>
                <div><Pill tone="neutral">{round.nominator}</Pill></div>
              </div>
              <div className="row">
                <div className="label">Nominees</div>
                <div><Pill tone="neutral">{(round.nominees || []).length}</Pill></div>
              </div>
              <div className="row">
                <div className="label">Saves in</div>
                <div><Pill tone="good">{Object.keys(round.saves || {}).length}</Pill></div>
              </div>
              <div className="row">
                <div className="label">Elims in</div>
                <div><Pill tone="bad">{Object.keys(round.elims || {}).length}</Pill></div>
              </div>
              <div className="row">
                <div className="label">Leftovers eliminated</div>
                <div><Pill tone="warn">{(round.leftoversEliminated || []).length}</Pill></div>
              </div>
            </div>
          )}
        </Card>

        <Card
          title="Nominee Board"
          right={
            round ? (
              <div className="legend">
                <Pill tone="good">Saved</Pill>
                <Pill tone="bad">Eliminated</Pill>
                <Pill tone="warn">Leftover</Pill>
                <Pill tone="neutral">Unresolved</Pill>
              </div>
            ) : null
          }
        >
          {!round ? (
            <div className="muted">Add <code>currentRound</code> to show nominees.</div>
          ) : (
            <div className="board">
              {(round.nominees || []).map((name) => {
                const st = nomineeStatus.get(name) || "pending";
                return (
                  <div key={name} className={classNames("tile", `tile-${st}`)}>
                    <div className="tileName">{name}</div>
                    <div className="tileTag">
                      {st === "saved" && <Pill tone="good">Saved</Pill>}
                      {st === "elim" && <Pill tone="bad">Elim</Pill>}
                      {st === "leftover" && <Pill tone="warn">Leftover</Pill>}
                      {st === "pending" && <Pill tone="neutral">Unresolved</Pill>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Round Actions">
          {!round ? (
            <div className="muted">No round data.</div>
          ) : (
            <div className="twoCol">
              <div>
                <h3 className="h3">Saves</h3>
                <div className="list">
                  {Object.entries(round.saves || {}).map(([voter, target]) => (
                    <div className="listRow" key={voter}>
                      <span className="who">{voter}</span>
                      <span className="arrow">→</span>
                      <span className="target">{target}</span>
                      <Pill tone="good">SAVE</Pill>
                    </div>
                  ))}
                  {Object.keys(round.saves || {}).length === 0 && (
                    <div className="muted">No saves yet.</div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="h3">Eliminations</h3>
                <div className="list">
                  {Object.entries(round.elims || {}).map(([voter, target]) => (
                    <div className="listRow" key={voter}>
                      <span className="who">{voter}</span>
                      <span className="arrow">→</span>
                      <span className="target">{target}</span>
                      <Pill tone="bad">ELIM</Pill>
                    </div>
                  ))}
                  {Object.keys(round.elims || {}).length === 0 && (
                    <div className="muted">No eliminations yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card
          title="Eliminated List"
          right={<Pill tone="bad">{(data.eliminated || []).length} eliminated</Pill>}
        >
          {(data.eliminated || []).length === 0 ? (
            <div className="muted">No eliminated contestants yet.</div>
          ) : (
            <div className="elimGrid">
              {data.eliminated
                .slice()
                .sort((a, b) => (b.round ?? 0) - (a.round ?? 0))
                .map((e, idx) => (
                  <div className="elimCard" key={`${e.name}-${idx}`}>
                    <div className="elimName">{e.name}</div>
                    <div className="elimMeta">
                      <Pill tone="neutral">Round {e.round}</Pill>
                      <Pill tone={e.method === "leftover" ? "warn" : "bad"}>
                        {e.method === "leftover" ? "Leftover" : "Voted Elim"}
                      </Pill>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>

      <footer className="footer">
        <span className="muted">
          Operator model: edit <code>public/state.json</code>, commit/push, then <code>npm run deploy</code>.
        </span>
      </footer>
    </div>
  );
}
