/**
 * KOLTYN OS — dashboard.js
 * Morning routine, daily overview, priorities, workout day tracker, and vision board.
 *
 * Priority forms and workout day read/write via STATE (state.js).
 * All other display data comes from APP_DATA (data.js).
 */

window.registerPage('dashboard', function initDashboard() {

  /* ── Data from data.js ── */
  const MORNING_HABITS = APP_DATA.dashboard.morningHabits;
  const DAILY_STATS    = APP_DATA.dashboard.stats;
  const VISION_AREAS   = APP_DATA.vision.areas;

  const QUICK_NAV = [
    { page:'nutrition', icon:'◈', label:'Nutrition',  color:'#3ddc6e' },
    { page:'workout',   icon:'◉', label:'Workout',    color:'#ff6b35' },
    { page:'business',  icon:'◧', label:'Business',   color:'#7c6af7' },
    { page:'wealth',    icon:'◈', label:'Wealth',     color:'#f5c842' },
    { page:'creative',  icon:'♫', label:'Creative',   color:'#f06292' },
  ];

  /* ── Live state ── */
  const ds = STATE.data.dashboard;
  const ws = STATE.data.workout;
  const todayWorkoutDay = STATE.currentWorkoutDay;

  /* ── Build HTML ── */
  const inner = document.getElementById('dashboard-inner');
  inner.innerHTML = `
    ${buildPageHeader('Personal OS', 'Morning', 'Dashboard',
      new Date().toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'}))}

    <!-- Stats row -->
    <div class="grid-4" id="dashStats"></div>

    <!-- Priority cards row -->
    <div class="grid-2" style="margin-bottom:0">

      <!-- Weekly top priority -->
      <div class="card">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
          <div class="card-title">Weekly Top Priority</div>
          <span class="badge badge-warn" style="font-size:10px">1 thing</span>
        </div>
        <div class="card-body">
          <div style="font-size:11px;color:var(--muted);margin-bottom:6px">The single most important thing this week. Everything else is secondary.</div>
          <input class="form-input" id="weeklyPriorityInput"
            placeholder="e.g. Close first 3 paying customers for Envosta"
            value="${ds.weeklyTopPriority || ''}" />
          <button class="day-tab active" id="saveWeekly" style="margin-top:10px;padding:7px 16px">Save</button>
          ${ds.weeklyPriorityDate ? `<div style="font-size:10px;color:var(--muted);margin-top:6px">Last updated ${new Date(ds.weeklyPriorityDate).toLocaleDateString()}</div>` : ''}
        </div>
      </div>

      <!-- Today's top 3 -->
      <div class="card">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
          <div class="card-title">Today's Top 3</div>
          <span class="badge badge-accent" style="font-size:10px">daily</span>
        </div>
        <div class="card-body">
          <div style="font-size:11px;color:var(--muted);margin-bottom:8px">Three things. Complete them and the day is a win.</div>
          ${[0,1,2].map(i => `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <span style="font-family:'Rajdhani',sans-serif;font-weight:700;color:var(--accent);font-size:14px;min-width:14px">${i+1}</span>
              <input class="form-input today-p" data-idx="${i}"
                placeholder="Priority ${i+1}…"
                value="${ds.todayPriorities?.[i] || ''}"
                style="flex:1" />
            </div>`).join('')}
          <button class="day-tab active" id="saveToday" style="margin-top:4px;padding:7px 16px">Save</button>
          ${ds.todayPrioritiesDate ? `<div style="font-size:10px;color:var(--muted);margin-top:6px">Last updated ${new Date(ds.todayPrioritiesDate).toLocaleDateString()}</div>` : ''}
        </div>
      </div>

    </div>

    <!-- North Star goal -->
    <div class="goal-card">
      <div style="font-family:'Rajdhani',sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#4fc3f7;margin-bottom:6px">North Star Goal</div>
      <div class="goal-main">${APP_DATA.profile.northStar}</div>
      <div class="goal-pillars">
        ${APP_DATA.profile.northStarPillars.map(p=>`<span class="goal-pillar">${p}</span>`).join('')}
      </div>
    </div>

    <!-- Workout day tracker -->
    <div class="card" style="margin-bottom:0">
      <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
        <div class="card-title">Today's Workout</div>
        <span class="badge badge-${todayWorkoutDay === 'Rest' ? 'muted' : 'warn'}">${ws.currentPhase === 'recovery' ? 'Recovery Phase' : 'Ramping Phase'}</span>
      </div>
      <div class="card-body" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
        <div style="font-family:'Rajdhani',sans-serif;font-size:32px;font-weight:700;color:var(--accent)">${todayWorkoutDay}</div>
        <div>
          <div style="font-size:12px;color:var(--muted)">Day ${ws.currentDayIndex + 1} of ${ws.schedule.length} in cycle</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">Schedule: ${ws.schedule.join(' → ')}</div>
        </div>
        <div style="margin-left:auto">
          <button class="day-tab" onclick="navigateTo('workout')" style="padding:8px 16px">Go to Workout →</button>
        </div>
      </div>
    </div>

    <!-- Morning routine + Quick nav -->
    <div class="dashboard-grid">
      <div class="card">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
          <div class="card-title">Morning Routine</div>
          <span class="badge badge-muted" id="habitCount">0 / ${MORNING_HABITS.length}</span>
        </div>
        <div class="card-body" style="padding:10px 16px">
          <div id="habitList"></div>
        </div>
      </div>

      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-header"><div class="card-title">Navigate</div></div>
          <div class="card-body">
            <div class="quick-nav" id="quickNav"></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Today's Focus</div></div>
          <div class="card-body">
            ${APP_DATA.dashboard.todaysFocus.map(({title:t, detail:d}) => `
              <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
                <div style="font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;color:var(--accent);margin-bottom:2px">${t}</div>
                <div style="font-size:12px;color:rgba(226,234,242,0.72)">${d}</div>
              </div>`).join('')}
          </div>
        </div>
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

  /* ── Weekly priority save ── */
  inner.querySelector('#saveWeekly').addEventListener('click', () => {
    const val = inner.querySelector('#weeklyPriorityInput').value.trim();
    STATE.setWeeklyPriority(val);
    /* Brief visual feedback */
    const btn = inner.querySelector('#saveWeekly');
    btn.textContent = 'Saved ✓';
    setTimeout(() => { btn.textContent = 'Save'; }, 1500);
  });

  /* ── Today's priorities save ── */
  inner.querySelector('#saveToday').addEventListener('click', () => {
    const inputs = inner.querySelectorAll('.today-p');
    const [p1, p2, p3] = [...inputs].map(i => i.value.trim());
    STATE.setTodayPriorities(p1, p2, p3);
    const btn = inner.querySelector('#saveToday');
    btn.textContent = 'Saved ✓';
    setTimeout(() => { btn.textContent = 'Save'; }, 1500);
  });

  /* ── Stats ── */
  const statsEl = document.getElementById('dashStats');
  DAILY_STATS.forEach(s => {
    statsEl.innerHTML += `
      <div class="stat-card">
        <div class="stat-label">${s.label}</div>
        <div style="display:flex;align-items:baseline;gap:2px">
          <span class="stat-value" style="font-size:24px">${s.value}</span>
          ${s.unit ? `<span class="stat-unit">${s.unit}</span>` : ''}
        </div>
        <div class="stat-delta flat">${s.note}</div>
      </div>`;
  });

  /* ── Habits with checkboxes ── */
  let checkedCount = 0;
  const habitList = document.getElementById('habitList');
  MORNING_HABITS.forEach((habit, i) => {
    const item = document.createElement('div');
    item.className = 'habit-item';
    item.innerHTML = `<div class="habit-check" id="hc-${i}"></div><span>${habit}</span>`;
    const check = item.querySelector(`#hc-${i}`);
    check.addEventListener('click', () => {
      const done = !check.classList.contains('done');
      check.classList.toggle('done', done);
      checkedCount = document.querySelectorAll('.habit-check.done').length;
      document.getElementById('habitCount').textContent = `${checkedCount} / ${MORNING_HABITS.length}`;
    });
    habitList.appendChild(item);
  });

  /* ── Quick nav ── */
  const quickNav = document.getElementById('quickNav');
  QUICK_NAV.forEach(item => {
    const el = document.createElement('div');
    el.className = 'quick-nav-item';
    el.innerHTML = `
      <div class="quick-nav-icon" style="color:${item.color}">${item.icon}</div>
      <div class="quick-nav-label">${item.label}</div>`;
    el.addEventListener('click', () => navigateTo(item.page));
    quickNav.appendChild(el);
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
