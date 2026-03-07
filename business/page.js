/**
 * KOLTYN OS — business/page.js
 * Envosta — 9-Stage Growth Framework
 * Stage 0: Improvise → Stage 9: Capitalize
 */

window.registerPage('business', function initBusiness() {

  /* ── Data from data.js ── */
  const STAGES      = APP_DATA.business.stages;
  const DEPARTMENTS = APP_DATA.business.departments;

  /* ── KPIs ── */
  const KPIS = [
    { label:'Current MRR',    value:'$0',      unit:'',     delta:'Starting',  dir:'flat' },
    { label:'Target MRR',     value:'$50K',    unit:'/mo',  delta:'Goal',      dir:'up'   },
    { label:'Stage',          value:'0',       unit:'/9',   delta:'Improvise', dir:'flat' },
    { label:'Paying Users',   value:'0',       unit:'',     delta:'Pre-revenue',dir:'flat' },
  ];

  /* ── Build HTML ── */
  const inner = document.getElementById('business-inner');
  inner.innerHTML = `
    ${buildPageHeader('Envosta', 'Business', 'OS', 'Stage 0 — Improvise. Build, validate, sell. In that order.',
      `<span class="badge badge-warn">Stage 0 · Improvise</span>`
    )}

    <!-- KPI row -->
    <div class="grid-4" id="businessKpis"></div>

    <!-- Stage timeline -->
    <div class="card">
      <div class="card-header"><div class="card-title">9-Stage Growth Framework</div></div>
      <div class="card-body">
        <div class="stage-timeline" id="stageTimeline"></div>
        <div style="margin-top:16px;padding:14px 16px;background:rgba(124,106,247,0.06);border:1px solid rgba(124,106,247,0.2);border-radius:10px">
          <div style="font-family:'Rajdhani',sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);margin-bottom:6px">Current Stage — Improvise</div>
          <div style="font-size:13px;color:rgba(226,234,242,0.82);line-height:1.6">You are pre-revenue. The job is simple: talk to customers, build something they\'ll pay for, and close the first 3 sales manually. Don\'t hire, don\'t scale infrastructure, don\'t optimise. Just prove the core value exists.</div>
        </div>
      </div>
    </div>

    <!-- Department priorities -->
    <div>
      <div class="section-label">Department Priorities — Stage 0</div>
      <div class="dept-grid" id="deptGrid"></div>
    </div>

    <!-- North Star goals -->
    <div class="card">
      <div class="card-header"><div class="card-title">North Star Milestones</div></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:10px" id="milestones"></div>
    </div>`;

  /* ── KPIs ── */
  const kpiContainer = document.getElementById('businessKpis');
  KPIS.forEach(k => {
    kpiContainer.innerHTML += `
      <div class="stat-card">
        <div class="stat-label">${k.label}</div>
        <div style="display:flex;align-items:baseline;gap:3px">
          <span class="stat-value">${k.value}</span>
          ${k.unit ? `<span class="stat-unit">${k.unit}</span>` : ''}
        </div>
        <div class="stat-delta ${k.dir}">${k.delta}</div>
      </div>`;
  });

  /* ── Timeline ── */
  const timeline = document.getElementById('stageTimeline');
  STAGES.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'stage-step' + (s.current ? ' current' : i < STAGES.findIndex(x=>x.current) ? ' completed' : '');
    div.innerHTML = `
      <div class="stage-node">${s.num}</div>
      <div class="stage-name">${s.name}</div>`;
    div.title = s.sub;
    timeline.appendChild(div);
  });

  /* ── Departments ── */
  const deptGrid = document.getElementById('deptGrid');
  DEPARTMENTS.forEach(dept => {
    deptGrid.innerHTML += `
      <div class="dept-card">
        <div class="dept-header">
          <div class="dept-icon">${dept.icon}</div>
          <div>
            <div class="dept-name">${dept.name}</div>
            <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)">${dept.stage}</div>
          </div>
        </div>
        <div class="dept-body">
          ${dept.priorities.map((p,i)=>`
            <div class="priority-item">
              <div class="priority-dot p${i+1}"></div>
              <span>${p}</span>
            </div>`).join('')}
        </div>
      </div>`;
  });

  /* ── Milestones ── */
  const milestones = [
    { label:'First 3 paying customers',    target:'$1 revenue',  status:'open' },
    { label:'$1,000 MRR',                  target:'$1K/mo',      status:'open' },
    { label:'$5,000 MRR',                  target:'$5K/mo',      status:'open' },
    { label:'$10,000 MRR → Stage 1',       target:'$10K/mo',     status:'open' },
    { label:'$50,000 MRR → North Star',    target:'$50K/mo',     status:'open' },
  ];

  const msContainer = document.getElementById('milestones');
  milestones.forEach(m => {
    msContainer.innerHTML += `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--card2);border:1px solid var(--border);border-radius:var(--radius-sm)">
        <div style="width:18px;height:18px;border-radius:50%;border:2px solid var(--border);flex-shrink:0"></div>
        <div style="flex:1;font-size:13px;color:rgba(226,234,242,0.82)">${m.label}</div>
        <span class="badge badge-muted">${m.target}</span>
      </div>`;
  });
});
