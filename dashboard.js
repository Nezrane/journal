/**
 * KOLTYN OS — dashboard page
 * Morning routine, daily overview, and vision board (7 life areas).
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

  /* ── Build HTML ── */
  const inner = document.getElementById('dashboard-inner');
  inner.innerHTML = `
    ${buildPageHeader('Personal OS', 'Morning', 'Dashboard', new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}))}

    <!-- Stats row -->
    <div class="grid-4" id="dashStats"></div>

    <!-- North Star goal -->
    <div class="goal-card">
      <div style="font-family:'Rajdhani',sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#4fc3f7;margin-bottom:6px">North Star Goal</div>
      <div class="goal-main">Build Envosta to $50K MRR · Get to 200 lbs and 15% body fat · Unlock Press to Handstand and Muscle Up</div>
      <div class="goal-pillars">
        <span class="goal-pillar">$50K MRR</span>
        <span class="goal-pillar">200 lbs · 15% BF</span>
        <span class="goal-pillar">Press to Handstand</span>
        <span class="goal-pillar">Muscle Up</span>
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
            ${APP_DATA.dashboard.todaysFocus.map(({title:t,detail:d})=>`
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
      <div style="font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:700;line-height:1.4;margin-bottom:12px">Build Envosta to $50K MRR · Get to 200 lbs and 15% body fat · Unlock Press to Handstand and Muscle Up</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${['$50K MRR','200 lbs','15% BF','Press to Handstand','Muscle Up'].map(p=>`<span style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;padding:4px 12px;border-radius:20px;border:1px solid rgba(79,195,247,0.3);color:#4fc3f7;background:rgba(79,195,247,0.08)">${p}</span>`).join('')}
      </div>
    </div>

    <div id="visionAreas"></div>`;

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
