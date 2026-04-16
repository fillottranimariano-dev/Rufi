import { useState } from "react";

const PADRE_A = "Mamá";
const PADRE_B = "Papá";

const COLOR_A = "#f7824f";
const COLOR_B = "#4f8ef7";
const COLOR_FERIADO = "#a855f7";
const COLOR_VACACIONES = "#10b981";

// Feriados Argentina 2025 y 2026
const FERIADOS_ARG = [
  "2025-01-01","2025-03-03","2025-03-04","2025-03-24","2025-04-02",
  "2025-04-18","2025-04-19","2025-05-01","2025-05-25","2025-06-16",
  "2025-06-20","2025-07-09","2025-08-17","2025-09-15","2025-10-12",
  "2025-11-24","2025-12-08","2025-12-25",
  "2026-01-01","2026-03-23","2026-03-24","2026-04-02","2026-04-03",
  "2026-04-04","2026-05-01","2026-05-25","2026-06-15","2026-06-20",
  "2026-07-09","2026-08-17","2026-10-12","2026-11-23","2026-12-08","2026-12-25"
];

// Vacaciones escolares Buenos Aires (oficiales)
function makeVacDates(startY, startM, startD, count) {
  const dates = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(startY, startM, startD + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

const VACACIONES = [
  // Invierno 2025: 21 jul - 1 ago (12 días)
  ...makeVacDates(2025, 6, 21, 12),
  // Verano 2025-2026: 22 dic 2025 - 2 mar 2026 (72 días)
  ...makeVacDates(2025, 11, 22, 72),
  // Invierno 2026: 20 jul - 31 jul (oficial Prov. Bs.As.)
  ...makeVacDates(2026, 6, 20, 12),
  // Verano 2026-2027: 22 dic 2026 - 1 mar 2027
  ...makeVacDates(2026, 11, 22, 69),
];

function get223Owner(dayIndex) {
  const weekPatternA = [0,0,1,1,0,0,0];
  const weekPatternB = [1,1,0,0,1,1,1];
  const startEpoch = new Date(2025, 0, 6);
  const daysSinceStart = Math.floor((dayIndex - startEpoch) / 86400000);
  if (daysSinceStart < 0) return 0;
  const weekNum = Math.floor(daysSinceStart / 7);
  const dayOfWeek = daysSinceStart % 7;
  return (weekNum % 2 === 0 ? weekPatternA : weekPatternB)[dayOfWeek];
}

function getDayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_ES = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"];

export default function App() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  let countA = 0, countB = 0;
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dt = new Date(year, month, d);
    if (get223Owner(dt) === 0) countA++; else countB++;
  }

  const isCurrentMonth =
    viewDate.getFullYear() === today.getFullYear() &&
    viewDate.getMonth() === today.getMonth();

  function prevMonth() { setViewDate(new Date(year, month - 1, 1)); setSelectedDay(null); }
  function nextMonth() { setViewDate(new Date(year, month + 1, 1)); setSelectedDay(null); }
  function goToToday() {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(null);
  }

  function getDayInfo(date) {
    const key = getDayKey(date);
    const owner = get223Owner(date);
    const isFeriado = FERIADOS_ARG.includes(key);
    const isVacaciones = VACACIONES.includes(key);
    const isToday = getDayKey(date) === getDayKey(today);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    return { owner, isFeriado, isVacaciones, isToday, isWeekend, key };
  }

  // Info de hoy
  const todayInfo = getDayInfo(today);
  const todayOwner = todayInfo.owner === 0 ? PADRE_A : PADRE_B;
  const todayColor = todayInfo.owner === 0 ? COLOR_A : COLOR_B;
  const todayBg = todayInfo.owner === 0 ? "#ffedd5" : "#dbeafe";

  // Generar archivo ICS para un padre (próximos 6 meses) con recordatorio
  function downloadICS(ownerIdx) {
    const padre = ownerIdx === 0 ? PADRE_A : PADRE_B;
    const lines = [];
    lines.push("BEGIN:VCALENDAR");
    lines.push("VERSION:2.0");
    lines.push("PRODID:-//Rufi//Custodia//ES");
    lines.push("X-WR-CALNAME:Rufi - " + padre);
    lines.push("CALSCALE:GREGORIAN");
    lines.push("METHOD:PUBLISH");

    for (let i = 0; i < 180; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      if (get223Owner(d) === ownerIdx) {
        const key = getDayKey(d).replace(/-/g, "");
        const nextD = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        const nd = getDayKey(nextD).replace(/-/g, "");
        const uid = key + "-" + ownerIdx + "@rufi.app";
        lines.push("BEGIN:VEVENT");
        lines.push("UID:" + uid);
        lines.push("DTSTART;VALUE=DATE:" + key);
        lines.push("DTEND;VALUE=DATE:" + nd);
        lines.push("SUMMARY:Rufi con " + padre);
        lines.push("DESCRIPTION:Dia de custodia - esquema 2-2-3");
        lines.push("BEGIN:VALARM");
        lines.push("TRIGGER:-PT8H");
        lines.push("ACTION:DISPLAY");
        lines.push("DESCRIPTION:Hoy es dia de Rufi con " + padre);
        lines.push("END:VALARM");
        lines.push("END:VEVENT");
      }
    }
    lines.push("END:VCALENDAR");

    // Usar \r\n que es el estándar iCal
    const ics = lines.join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rufi-" + padre.toLowerCase() + ".ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0f4ff 0%, #fff7f0 100%)",
      fontFamily: "'Georgia', serif",
      padding: "24px 16px"
    }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h1
            onClick={goToToday}
            style={{
              fontSize: 28, fontWeight: 800, letterSpacing: "-1px",
              color: "#1e293b", margin: 0, cursor: "pointer",
              userSelect: "none", display: "inline-flex", alignItems: "center", gap: 8
            }}
            title="Volver al mes actual"
          >
            ❤️ Rufi
          </h1>
          {!isCurrentMonth && (
            <div style={{ marginTop: 4 }}>
              <span
                onClick={goToToday}
                style={{
                  cursor: "pointer", color: COLOR_B, fontWeight: 700,
                  fontSize: 13, textDecoration: "underline"
                }}
              >
                ← Volver a hoy
              </span>
            </div>
          )}
        </div>

        {/* Banner HOY */}
        <div style={{
          background: todayBg, borderRadius: 16, padding: "14px 20px",
          border: `2px solid ${todayColor}`, marginBottom: 16,
          boxShadow: `0 0 0 3px ${todayColor}22`,
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Hoy</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: todayColor, marginTop: 2 }}>
              📍 Con {todayOwner}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              {today.getDate()} de {MONTHS_ES[today.getMonth()]} {today.getFullYear()}
              {todayInfo.isFeriado && " · 🎉 Feriado"}
              {todayInfo.isVacaciones && " · 🏖 Vacaciones"}
            </div>
          </div>
          <div style={{ fontSize: 36 }}>{todayInfo.owner === 0 ? "🧡" : "💙"}</div>
        </div>

        {/* Exportar a Google Calendar */}
        <div style={{
          background: "white", borderRadius: 16, padding: "14px 20px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16
        }}>
          <p style={{ margin: "0 0 10px", fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
            📲 Agregar al calendario personal
          </p>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#64748b" }}>
            Descargá el archivo .ics e importalo en Google Calendar, Apple Calendar o cualquier app de calendario. Incluye recordatorio a las 8am de cada día.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            {[{ idx: 0, label: PADRE_A, color: COLOR_A, bg: "#ffedd5" },
              { idx: 1, label: PADRE_B, color: COLOR_B, bg: "#dbeafe" }
            ].map(({ idx, label, color, bg }) => (
              <button
                key={idx}
                onClick={() => downloadICS(idx)}
                style={{
                  flex: 1, padding: "10px 8px", borderRadius: 12,
                  border: `2px solid ${color}`, background: bg,
                  cursor: "pointer", fontWeight: 700, fontSize: 13, color,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                }}
              >
                ⬇️ {label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend — una sola línea compacta */}
        <div style={{
          display: "flex", gap: 6, justifyContent: "center",
          flexWrap: "nowrap", marginBottom: 16
        }}>
          {[
            { color: COLOR_A, label: PADRE_A },
            { color: COLOR_B, label: PADRE_B },
            { color: COLOR_VACACIONES, label: "🏖 Vac" },
            { color: COLOR_FERIADO, label: "🎉 Feriado" },
          ].map(({ color, label }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "white", borderRadius: 20, padding: "3px 10px",
              border: `2px solid ${color}`, fontSize: 12, fontWeight: 600,
              color: "#334155", whiteSpace: "nowrap"
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
              {label}
            </div>
          ))}
        </div>

        {/* Calendar card */}
        <div style={{
          background: "white", borderRadius: 18, padding: "16px 20px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.07)", marginBottom: 16
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <button onClick={prevMonth} style={{
              border: "none", background: "#f1f5f9", borderRadius: 10,
              width: 36, height: 36, cursor: "pointer", fontSize: 18, color: "#475569"
            }}>‹</button>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#1e293b" }}>
              {MONTHS_ES[month]} {year}
            </span>
            <button onClick={nextMonth} style={{
              border: "none", background: "#f1f5f9", borderRadius: 10,
              width: 36, height: 36, cursor: "pointer", fontSize: 18, color: "#475569"
            }}>›</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
            {DAYS_ES.map((d, i) => (
              <div key={d} style={{
                textAlign: "center", fontSize: 12, fontWeight: 700,
                color: i >= 5 ? "#94a3b8" : "#64748b", padding: "4px 0"
              }}>{d}</div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {days.map((date, i) => {
              if (!date) return <div key={`e-${i}`} />;
              const info = getDayInfo(date);
              const isSelected = selectedDay && getDayKey(selectedDay) === getDayKey(date);

              // Fondo siempre del color del dueño
              const bg = info.owner === 0 ? "#ffedd5" : "#dbeafe";
              const ownerColor = info.owner === 0 ? COLOR_A : COLOR_B;
              // Borde: verde si es hoy, si no el color del dueño
              const borderColor = info.isToday ? "#22c55e" : ownerColor;

              return (
                <div
                  key={getDayKey(date)}
                  onClick={() => setSelectedDay(isSelected ? null : date)}
                  style={{
                    background: bg,
                    borderRadius: 10,
                    border: `2px solid ${borderColor}`,
                    padding: "5px 2px 4px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "transform 0.1s",
                    transform: isSelected ? "scale(1.08)" : info.isToday ? "scale(1.05)" : "scale(1)",
                    boxShadow: isSelected
                      ? "0 4px 12px rgba(0,0,0,0.15)"
                      : info.isToday
                        ? "0 0 0 3px #22c55e, 0 4px 10px rgba(34,197,94,0.35)"
                        : "none",
                    position: "relative",
                    minHeight: 42
                  }}
                >
                  <div style={{
                    fontSize: 13,
                    fontWeight: info.isToday ? 900 : 600,
                    color: info.isToday ? "#15803d" : "#1e293b"
                  }}>{date.getDate()}</div>

                  {/* Indicadores de feriado (violeta) y vacaciones (verde) */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 2, minHeight: 9 }}>
                    {info.isFeriado && (
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: COLOR_FERIADO, flexShrink: 0
                      }} />
                    )}
                    {info.isVacaciones && (
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: COLOR_VACACIONES, flexShrink: 0
                      }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly stats */}
        <div style={{
          background: "white", borderRadius: 16, padding: "14px 20px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16
        }}>
          <p style={{ margin: "0 0 10px", fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
            Distribución este mes ({lastDay.getDate()} días)
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { name: PADRE_A, count: countA, color: COLOR_A, bg: "#ffedd5" },
              { name: PADRE_B, count: countB, color: COLOR_B, bg: "#dbeafe" }
            ].map(({ name, count, color, bg }) => (
              <div key={name} style={{
                flex: 1, background: bg, borderRadius: 12, padding: "10px 14px",
                border: `2px solid ${color}`
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{count}</div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {Math.round(count / lastDay.getDate() * 100)}%
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, borderRadius: 6, overflow: "hidden", height: 8, display: "flex" }}>
            <div style={{ width: `${countA/lastDay.getDate()*100}%`, background: COLOR_A }} />
            <div style={{ width: `${countB/lastDay.getDate()*100}%`, background: COLOR_B }} />
          </div>
        </div>

        {/* Selected day info */}
        {selectedDay && (() => {
          const info = getDayInfo(selectedDay);
          const owner = info.owner === 0 ? PADRE_A : PADRE_B;
          const color = info.owner === 0 ? COLOR_A : COLOR_B;
          const bg = info.owner === 0 ? "#ffedd5" : "#dbeafe";
          return (
            <div style={{
              background: bg, borderRadius: 16, padding: "16px 20px",
              border: `2px solid ${color}`, boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              marginBottom: 16
            }}>
              <p style={{ margin: 0, fontWeight: 700, color: "#1e293b", fontSize: 15 }}>
                {selectedDay.getDate()} de {MONTHS_ES[selectedDay.getMonth()]} {selectedDay.getFullYear()}
              </p>
              <p style={{ margin: "6px 0 0", color, fontWeight: 700, fontSize: 16 }}>
                📍 Con {owner}
              </p>
              {info.isFeriado && <p style={{ margin: "4px 0 0", fontSize: 13, color: COLOR_FERIADO }}>🎉 Día feriado</p>}
              {info.isVacaciones && <p style={{ margin: "4px 0 0", fontSize: 13, color: COLOR_VACACIONES }}>🏖️ Vacaciones escolares</p>}
              {info.isWeekend && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>🏠 Fin de semana</p>}
            </div>
          );
        })()}

        {/* How it works */}
        <div style={{
          background: "white", borderRadius: 16, padding: "14px 20px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
        }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
            ¿Cómo funciona el 2-2-3?
          </p>
          <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>
            <div>📌 <strong>Semana 1:</strong> Lu-Ma con {PADRE_A} · Mi-Ju con {PADRE_B} · Vi-Sa-Do con {PADRE_A}</div>
            <div>📌 <strong>Semana 2:</strong> Lu-Ma con {PADRE_B} · Mi-Ju con {PADRE_A} · Vi-Sa-Do con {PADRE_B}</div>
            <div style={{ marginTop: 6, fontStyle: "italic" }}>
              El patrón se alterna cada semana. Resultado: ~50/50 al mes.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
