/**
 * KOLTYN OS — dashboard.js
 *
 * DATA FLOW
 *   APP_DATA.dashboard.stats          → stat ring data (current/goal/color)
 *   APP_DATA.dashboard.morningHabits  → static reference list (no checkboxes)
 *   APP_DATA.profile.northStar        → north star goal text
 *   APP_DATA.vision.areas             → vision board sections
 *
 *   STATE.data.dashboard → weeklyTopPriority, todayPriorities (read + write)
 *   STATE.data.workout   → currentDayIndex, schedule, currentPhase, weekNumber
 *
 * WRITES TO STATE → IDB
 *   STATE.setWeeklyPriority(text)       → dashboard.weeklyTopPriority → IDB
 *   STATE.setTodayPriorities(p1,p2,p3) → dashboard.todayPriorities   → IDB
 *   Both are fire-and-forget (save() writes IDB asynchronously after mutating).
 *
 * INCLUDED IN EXPORT/IMPORT
 *   All STATE.data is exported/imported as one JSON blob via the business page.
 */

window.registerPage('dashboard', function initDashboard() {

  /* ── Data from data.js (read-only) ── */
  const STATS        = APP_DATA.dashboard.stats;
  const MORNING_LIST = APP_DATA.dashboard.morningHabits;
  const VISION_AREAS = APP_DATA.vision.areas;

  /* ── Live state ── */
  const ds              = STATE.data.dashboard;
  const ws              = STATE.data.workout;
  const todayWorkoutDay = STATE.currentWorkoutDay;

  /* ── Build page HTML ── */
  const inner = document.getElementById('dashboard-inner');
  inner.innerHTML = `
    ${buildPageHeader('Personal OS', 'Morning', 'Dashboard',
      new Date().toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'}))}

    <!-- ══ COMMAND CENTER — North Star + Rings + Focus in one unified card ══ -->
    <div class="card" style="overflow:hidden">

      <!-- Zone 1: North Star — full-width banner at top -->
      <div style="background:linear-gradient(135deg,rgba(79,195,247,0.1) 0%,rgba(2,136,209,0.05) 100%);border-bottom:1px solid rgba(79,195,247,0.2);padding:16px 20px">
        <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#4fc3f7;margin-bottom:5px">North Star</div>
        <div style="font-family:'Rajdhani',sans-serif;font-size:17px;font-weight:700;line-height:1.35;margin-bottom:8px">${APP_DATA.profile.northStar}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${APP_DATA.profile.northStarPillars.map(p=>`<span style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:1px;padding:3px 10px;border-radius:20px;border:1px solid rgba(79,195,247,0.3);color:#4fc3f7;background:rgba(79,195,247,0.08)">${p}</span>`).join('')}
        </div>
      </div>

      <!-- Zone 2: Stat rings — progress visualizations -->
      <div style="padding:16px 20px;border-bottom:1px solid var(--border)">
        <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted);margin-bottom:12px">Progress</div>
        <div class="stat-rings-row" id="statRings"></div>
      </div>

      <!-- Zone 3: Today's Focus — weekly priority + top 3 + workout day -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">

        <!-- Left: priorities -->
        <div style="padding:16px 20px;border-right:1px solid var(--border)">
          <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Today's Focus</div>

          <div style="font-size:10px;font-family:'Rajdhani',sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Weekly Priority</div>
          <input class="form-input" id="weeklyPriorityInput"
            placeholder="The single most important thing this week…"
            value="${(ds.weeklyTopPriority || '').replace(/"/g, '&quot;')}"
            style="margin-bottom:10px" />

          <div style="font-size:10px;font-family:'Rajdhani',sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Today's Top 3</div>
          ${[0,1,2].map(i => `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <span style="font-family:'Rajdhani',sans-serif;font-weight:700;color:var(--accent);font-size:13px;min-width:14px;flex-shrink:0">${i+1}</span>
              <input class="form-input today-p" data-idx="${i}"
                placeholder="Priority ${i+1}…"
                value="${(ds.todayPriorities?.[i] || '').replace(/"/g, '&quot;')}"
                style="flex:1" />
            </div>`).join('')}

          <button class="day-tab active" id="saveFocus" style="margin-top:6px;padding:7px 16px">Save</button>
          ${ds.todayPrioritiesDate ? `<div style="font-size:10px;color:var(--muted);margin-top:5px">Saved ${new Date(ds.todayPrioritiesDate).toLocaleDateString()}</div>` : ''}
        </div>

        <!-- Right: today's workout -->
        <div style="padding:16px 20px">
          <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Today's Workout</div>
          <span class="badge badge-${todayWorkoutDay === 'Rest' ? 'muted' : 'warn'}" style="margin-bottom:10px;display:inline-flex">${ws.currentPhase === 'recovery' ? 'Recovery' : 'Ramping'} · Wk ${ws.weekNumber || 1}</span>
          <div style="font-family:'Rajdhani',sans-serif;font-size:42px;font-weight:700;color:var(--accent);line-height:1;margin-bottom:6px">${todayWorkoutDay}</div>
          <div style="font-size:11px;color:var(--muted);line-height:1.7;margin-bottom:14px">${ws.schedule.join(' → ')}</div>
          <button class="day-tab" onclick="navigateTo('workout')" style="padding:8px 16px">Open Workout →</button>
        </div>

      </div>
    </div>
    <!-- ══ END COMMAND CENTER ══ -->

    <!-- Morning Routine — static reference list (no checkboxes, purely informational) -->
    <div class="card">
      <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
        <div class="card-title">Morning Routine</div>
        <span class="badge badge-muted">${MORNING_LIST.length} steps · reference</span>
      </div>
      <div class="card-body" style="padding:4px 16px">
        ${MORNING_LIST.map((habit, i) => `
          <div style="display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
            <span style="font-family:'Rajdhani',sans-serif;font-weight:700;color:var(--accent);font-size:13px;min-width:20px;flex-shrink:0">${i + 1}.</span>
            <span style="font-size:12.5px;color:rgba(226,234,242,0.85);line-height:1.4">${habit}</span>
          </div>`).join('')}
      </div>
    </div>

    <!-- Vision Board -->
    <div class="section-label">Vision Board</div>

    <div style="background:linear-gradient(135deg,rgba(79,195,247,0.08) 0%,rgba(2,136,209,0.04) 100%);border:1px solid rgba(79,195,247,0.2);border-radius:var(--radius);padding:18px 22px">
      <div style="font-family:'Rajdhani',sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#4fc3f7;margin-bottom:8px">Overarching Goal</div>
      <div style="font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:700;line-height:1.4;margin-bottom:12px">${APP_DATA.vision.overarchingGoal}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${APP_DATA.vision.goalPillars.map(p=>`<span style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;padding:4px 12px;border-radius:20px;border:1px solid rgba(79,195,247,0.3);color:#4fc3f7;background:rgba(79,195,247,0.08)">${p}</span>`).join('')}
      </div>
    </div>

    <div id="visionAreas"></div>`;

  /* ══════════════════════════════════════════════════════════════
     STAT RINGS — SVG radial progress rings
     Circumference = 2π × r = 2π × 32 ≈ 201.06.
     Rings start at 12 o'clock via rotate(-90deg) on the fill circle.
     For invert:true stats (body fat), progress = goal/current,
     so reaching the target reads as 100%.
  ══════════════════════════════════════════════════════════════ */
  const CIRC = 201.06; /* 2π × 32 */
  const ringsEl = document.getElementById('statRings');

  STATS.forEach(s => {
    let pct;
    if (s.invert) {
      pct = s.current <= s.goal ? 1 : Math.max(0, s.goal / s.current);
    } else {
      pct = s.goal > 0 ? Math.min(1, s.current / s.goal) : 0;
    }
    const fillArc = (pct * CIRC).toFixed(2);

    ringsEl.innerHTML += `
      <div class="stat-ring-card">
        <div class="stat-ring-wrap">
          <svg class="stat-ring-svg" viewBox="0 0 80 80" aria-hidden="true">
            <circle class="stat-ring-track" cx="40" cy="40" r="32" />
            <circle class="stat-ring-fill" cx="40" cy="40" r="32"
              style="stroke:${s.color};stroke-dasharray:${fillArc} ${CIRC}" />
          </svg>
          <div class="stat-ring-inner">
            <span class="stat-ring-value">${s.value}</span>
            <span class="stat-ring-unit">${s.unit}</span>
          </div>
        </div>
        <div class="stat-ring-label">${s.label}</div>
        <div class="stat-ring-note">${s.note}</div>
      </div>`;
  });

  /* ══════════════════════════════════════════════════════════════
     COMBINED SAVE — weekly priority + today's top 3 in one click.
     Both mutators write to STATE.data.dashboard then call save()
     which persists to IndexedDB asynchronously.
  ══════════════════════════════════════════════════════════════ */
  inner.querySelector('#saveFocus').addEventListener('click', () => {
    const weekly = inner.querySelector('#weeklyPriorityInput').value.trim();
    const inputs = inner.querySelectorAll('.today-p');
    const [p1, p2, p3] = [...inputs].map(inp => inp.value.trim());
    STATE.setWeeklyPriority(weekly);
    STATE.setTodayPriorities(p1, p2, p3);
    const btn = inner.querySelector('#saveFocus');
    btn.textContent = 'Saved ✓';
    setTimeout(() => { btn.textContent = 'Save'; }, 1500);
  });

  /* ── Vision areas ── */
  const areasEl = document.getElementById('visionAreas');
  VISION_AREAS.forEach(area => {
    areasEl.innerHTML += `
      <div class="vision-area" style="margin-bottom:14px">
        <div class="vision-area-header">
          <div class="vision-area-icon">${area.icon}</div>
          <div class="vision-area-title">${area.name}</div>
        </div>
        <div class="vision-columns">
          <div class="vision-col">
            <div class="vision-col-label">Dream Big</div>
            ${area.dream.map(d=>`<div class="vision-item">${d}</div>`).join('')}
          </div>
          <div class="vision-col">
            <div class="vision-col-label">1-Year Goal</div>
            ${area.oneYear.map(g=>`<div class="vision-item">${g}</div>`).join('')}
          </div>
          <div class="vision-col">
            <div class="vision-col-label">90-Day Focus</div>
            ${area.focus.map(f=>`<div class="vision-item">${f}</div>`).join('')}
          </div>
        </div>
      </div>`;
  });
});
