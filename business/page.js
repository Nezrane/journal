/**
 * KOLTYN OS — business/page.js
 * Envosta — 9-Stage Growth Framework
 * Stage 0: Improvise → Stage 9: Capitalize
 */

window.registerPage('business', function initBusiness() {

  /* ── Stage framework ── */
  const STAGES = [
    { num:0, name:'Improvise',  sub:'Validate the idea',        current:true  },
    { num:1, name:'Hustle',     sub:'First paying customers',   current:false },
    { num:2, name:'Prove',      sub:'Repeatable sales',         current:false },
    { num:3, name:'Optimise',   sub:'Unit economics work',      current:false },
    { num:4, name:'Scale',      sub:'Hire & systematise',       current:false },
    { num:5, name:'Expand',     sub:'New channels/markets',     current:false },
    { num:6, name:'Dominate',   sub:'Category leader',          current:false },
    { num:7, name:'Leverage',   sub:'Brand & moat',             current:false },
    { num:8, name:'Exit Ready', sub:'Clean metrics',            current:false },
    { num:9, name:'Capitalize', sub:'Exit or compound',         current:false },
  ];

  /* ── Department priorities — Stage 0 focus ── */
  const DEPARTMENTS = [
    {
      icon:'🧩', name:'Product',
      stage:'Build MVP',
      priorities:[
        'Ship a working v1 that solves one problem extremely well',
        'Talk to 10 target users before building any new feature',
        'Define the core loop: what brings users back daily?',
      ]
    },
    {
      icon:'📣', name:'Marketing',
      stage:'Find the Signal',
      priorities:[
        'Test 3 traffic channels (content, cold outreach, communities)',
        'Document which message resonates — track click-through on each',
        'Build a waitlist or email list of 100+ ideal prospects',
      ]
    },
    {
      icon:'💰', name:'Sales',
      stage:'First Revenue',
      priorities:[
        'Close 3 paying customers manually — charge from day 1',
        'Document objections verbatim from every call',
        'Build a simple CRM: prospect → demo → close pipeline',
      ]
    },
    {
      icon:'🎧', name:'Customer Service',
      stage:'White Glove',
      priorities:[
        'Respond to every support message within 2 hours',
        'Build a FAQ from the top 10 questions customers ask',
        'Track NPS or satisfaction score monthly',
      ]
    },
    {
      icon:'💻', name:'IT & Infrastructure',
      stage:'Lean Stack',
      priorities:[
        'Keep infrastructure costs under $50/mo until 10 paying customers',
        'Set up error monitoring and basic uptime alerting',
        'Automate onboarding flow so new users activate without you',
      ]
    },
    {
      icon:'🤝', name:'Recruiting',
      stage:'Solo Grind',
      priorities:[
        'Identify the first hire: what bottleneck does it remove?',
        'Build a repeatable process before hiring someone to run it',
        'Document all core tasks so they\'re learnable in one week',
      ]
    },
    {
      icon:'📋', name:'HR & Culture',
      stage:'Set the Tone',
      priorities:[
        'Write a one-page culture doc: what you value, what you won\'t tolerate',
        'Default hiring bias: exceptional generalists over narrow specialists',
        'Define what "done" looks like for every recurring task',
      ]
    },
    {
      icon:'📊', name:'Finance',
      stage:'Know the Numbers',
      priorities:[
        'Track MRR, churn, and CAC in a single spreadsheet — update weekly',
        'Separate personal and business finances immediately',
        'Set a runway number: how many months before you need revenue?',
      ]
    },
  ];

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
