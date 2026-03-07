/**
 * KOLTYN OS — dashboard page
 * The dashboard is rendered directly in app.js since it's the default page.
 * It shows: morning routine habits, quick links to all pages, daily overview.
 */

window.registerPage('dashboard', function initDashboard() {

  const MORNING_HABITS = [
    'Wake up before 9am',
    'Rinse mouth + drink water / tea',
    '15 minutes of sunlight',
    'Review Daily Journal',
    'Review Investments (crypto, stocks)',
    'Check emails & messages',
    'Quick stretch & maintenance (10 pull-ups, 30 push-ups, 30s L-sit, hip + shoulder + hamstring stretch)',
    'Eat Meal 1 (Breakfast)',
    '2 hours focused work on Envosta',
    '1 hour workout',
  ];

  const QUICK_NAV = [
    { page:'nutrition', icon:'◈', label:'Nutrition',  color:'#3ddc6e' },
    { page:'workout',   icon:'◉', label:'Workout',    color:'#ff6b35' },
    { page:'business',  icon:'◧', label:'Business',   color:'#7c6af7' },
    { page:'wealth',    icon:'◈', label:'Wealth',     color:'#f5c842' },
    { page:'creative',  icon:'♫', label:'Creative',   color:'#f06292' },
    { page:'vision',    icon:'◎', label:'Vision',     color:'#26c6da' },
  ];

  const DAILY_STATS = [
    { label:'Body Weight', value:'176', unit:'lbs',  note:'Goal: 200 lbs' },
    { label:'Body Fat',    value:'16',  unit:'%',    note:'Goal: 15%' },
    { label:'Envosta MRR', value:'$0',  unit:'',     note:'Goal: $50K/mo' },
    { label:'Songs Ready', value:'8',   unit:'',     note:'Setlist: 7 songs' },
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
            ${[
              ['🏗️ Business', 'Build Envosta — talk to users, ship something'],
              ['💪 Workout',  'Recovery Phase — check workout page for today\'s day'],
              ['🎸 Creative', '30 min practice — fingerpicking + vocals'],
              ['📚 Growth',   '15 pages before bed'],
            ].map(([t,d])=>`
              <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
                <div style="font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;color:var(--accent);margin-bottom:2px">${t}</div>
                <div style="font-size:12px;color:rgba(226,234,242,0.72)">${d}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;

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
});
