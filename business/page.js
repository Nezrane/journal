/**
 * KOLTYN OS — business/page.js
 *
 * HIERARCHY
 *   Master Hormozi Roadmap (always visible in Overview tab)
 *     └── Ventures  (STATE.data.business.ventures[])
 *           └── Blueprints  (venture.blueprints[])
 *                 └── Steps  (blueprint.steps[])  ← checkable
 *
 * ALL mutations go through STATE mutators (state.js) which keep
 * in-memory data and IndexedDB in sync. This page never writes
 * to localStorage or any storage directly.
 *
 * TABS: Overview | Ventures | + New Venture
 */

window.registerPage('business', function initBusiness() {

  /* ── Shorthand refs ── */
  const biz      = () => STATE.data.business;
  const ventures = () => biz().ventures;

  /* ── Build shell HTML ── */
  const inner = document.getElementById('business-inner');
  inner.innerHTML = `
    ${buildPageHeader('Envosta HQ', 'Business', 'OS',
      'Master Hormozi roadmap · Multi-venture · Blueprint step tracking.',
      `<div style="display:flex;gap:8px">
         <button class="day-tab" id="bizExport" title="Download state as JSON">⬇ Export</button>
         <button class="day-tab" id="bizImport" title="Restore state from JSON">⬆ Import</button>
       </div>`
    )}

    <!-- Tab bar -->
    <div class="day-tabs" style="margin-bottom:18px" id="bizTabs">
      <button class="day-tab active" data-biztab="overview">Overview</button>
      <button class="day-tab"        data-biztab="ventures">Ventures</button>
      <button class="day-tab"        data-biztab="new">+ New Venture</button>
    </div>

    <!-- Tab panels -->
    <div id="bizPanel"></div>`;

  /* ── Tab wiring ── */
  let activeTab = 'overview';
  inner.querySelectorAll('[data-biztab]').forEach(btn => {
    btn.addEventListener('click', () => {
      inner.querySelectorAll('[data-biztab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.biztab;
      renderPanel();
    });
  });

  /* ── Export / Import ── */
  inner.querySelector('#bizExport').addEventListener('click', () => STATE.exportJSON());
  inner.querySelector('#bizImport').addEventListener('click', async () => {
    try {
      await STATE.importFromFile();
      renderPanel();
      alert('State imported successfully. Page refreshed.');
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  });

  /* ══════════════════════════════════════════════════════════════
     RENDER DISPATCHER
  ══════════════════════════════════════════════════════════════ */
  function renderPanel() {
    const panel = document.getElementById('bizPanel');
    if (activeTab === 'overview')  renderOverview(panel);
    else if (activeTab === 'ventures') renderVentures(panel);
    else if (activeTab === 'new') renderNewVentureForm(panel);
  }

  /* ══════════════════════════════════════════════════════════════
     OVERVIEW TAB — Master Hormozi Roadmap
  ══════════════════════════════════════════════════════════════ */
  function renderOverview(panel) {
    const STAGES = APP_DATA.business.stages;
    /* Compute the highest Hormozi stage across all ventures */
    const maxStage = Math.max(0, ...ventures().map(v => v.hormozi_stage || 0));

    panel.innerHTML = `
      <!-- Master Hormozi Roadmap -->
      <div class="card" style="margin-bottom:18px">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
          <div class="card-title">Master Hormozi Roadmap</div>
          <span class="badge badge-warn">Stage ${maxStage} — ${STAGES[maxStage]?.name || 'Improvise'}</span>
        </div>
        <div class="card-body">
          <div class="stage-timeline" id="masterTimeline"></div>
          <div id="stageDetail" style="margin-top:16px;padding:14px 16px;background:rgba(124,106,247,0.06);border:1px solid rgba(124,106,247,0.2);border-radius:10px">
            <div style="font-family:'Rajdhani',sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);margin-bottom:6px">
              Current Focus — ${STAGES[maxStage]?.name}
            </div>
            <div style="font-size:13px;color:rgba(226,234,242,0.82);line-height:1.6">${STAGES[maxStage]?.sub}</div>
          </div>
        </div>
      </div>

      <!-- Venture summary cards -->
      <div class="section-label">Ventures at a Glance</div>
      <div class="grid-2" id="ventureSummaryGrid"></div>

      <!-- KPIs -->
      <div class="grid-4" style="margin-top:18px" id="overviewKpis"></div>

      <!-- North Star Milestones -->
      <div class="card" style="margin-top:18px">
        <div class="card-header"><div class="card-title">North Star Milestones</div></div>
        <div class="card-body" id="milestones"></div>
      </div>

      <!-- Department Priorities (from APP_DATA — static) -->
      <div class="section-label" style="margin-top:18px">Department Priorities — Stage ${maxStage}</div>
      <div class="dept-grid" id="deptGrid"></div>`;

    /* Stage timeline */
    const tl = document.getElementById('masterTimeline');
    STAGES.forEach((s, i) => {
      const div = document.createElement('div');
      const cls = i < maxStage ? 'completed' : i === maxStage ? 'current' : '';
      div.className = `stage-step ${cls}`;
      div.innerHTML = `<div class="stage-node">${s.num}</div><div class="stage-name">${s.name}</div>`;
      div.title = s.sub;
      div.style.cursor = 'pointer';
      div.addEventListener('click', () => {
        /* Click a stage to see its detail */
        document.getElementById('stageDetail').innerHTML = `
          <div style="font-family:'Rajdhani',sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);margin-bottom:6px">Stage ${s.num} — ${s.name}</div>
          <div style="font-size:13px;color:rgba(226,234,242,0.82);line-height:1.6">${s.sub}</div>`;
      });
      tl.appendChild(div);
    });

    /* Venture summary cards */
    const summaryGrid = document.getElementById('ventureSummaryGrid');
    if (ventures().length === 0) {
      summaryGrid.innerHTML = `<div style="color:var(--muted);font-size:13px;padding:16px">No ventures yet. Click "Ventures" tab to create one.</div>`;
    } else {
      ventures().forEach(v => {
        const stage = STAGES[v.hormozi_stage] || STAGES[0];
        const totalSteps = v.blueprints.reduce((s, b) => s + b.steps.length, 0);
        const doneSteps  = v.blueprints.reduce((s, b) => s + b.steps.filter(st => st.completed).length, 0);
        const pct = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;
        summaryGrid.innerHTML += `
          <div class="venture-card" data-venture-id="${v.id}">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
              <span style="font-size:22px">${v.icon}</span>
              <div>
                <div style="font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700">${v.name}</div>
                <div style="font-size:11px;color:var(--muted)">${v.description}</div>
              </div>
              <span class="badge badge-accent" style="margin-left:auto">Stage ${v.hormozi_stage}</span>
            </div>
            <div style="display:flex;gap:16px;margin-bottom:10px">
              <div><div style="font-size:11px;color:var(--muted)">MRR</div><div style="font-family:'Rajdhani',sans-serif;font-weight:700;color:var(--warn)">${formatCurrency(v.mrr||0)}</div></div>
              <div><div style="font-size:11px;color:var(--muted)">Users</div><div style="font-family:'Rajdhani',sans-serif;font-weight:700">${v.users||0}</div></div>
              <div><div style="font-size:11px;color:var(--muted)">Blueprints</div><div style="font-family:'Rajdhani',sans-serif;font-weight:700">${v.blueprints.length}</div></div>
            </div>
            <div style="font-size:11px;color:var(--muted);margin-bottom:4px">Blueprint progress — ${doneSteps}/${totalSteps} steps (${pct}%)</div>
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
          </div>`;
      });
      /* Click venture card → switch to ventures tab and focus that venture */
      summaryGrid.querySelectorAll('.venture-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
          STATE.data.business.activeVentureId = card.dataset.ventureId;
          inner.querySelectorAll('[data-biztab]').forEach(b => b.classList.remove('active'));
          inner.querySelector('[data-biztab="ventures"]').classList.add('active');
          activeTab = 'ventures';
          renderPanel();
        });
      });
    }

    /* KPIs */
    const totalMrr = ventures().reduce((s, v) => s + (v.mrr || 0), 0);
    const totalUsers = ventures().reduce((s, v) => s + (v.users || 0), 0);
    const kpis = [
      { label:'Total MRR',    value: formatCurrency(totalMrr), unit:'',    delta:'All ventures', dir:'flat' },
      { label:'Target MRR',   value:'$50K',                    unit:'/mo', delta:'North star',   dir:'up'   },
      { label:'Hormozi Stage',value: maxStage,                 unit:'/9',  delta: STAGES[maxStage]?.name, dir:'flat' },
      { label:'Total Users',  value: totalUsers,               unit:'',    delta:'All ventures', dir:'flat' },
    ];
    const kpiEl = document.getElementById('overviewKpis');
    kpis.forEach(k => {
      kpiEl.innerHTML += `
        <div class="stat-card">
          <div class="stat-label">${k.label}</div>
          <div style="display:flex;align-items:baseline;gap:3px">
            <span class="stat-value">${k.value}</span>
            ${k.unit ? `<span class="stat-unit">${k.unit}</span>` : ''}
          </div>
          <div class="stat-delta ${k.dir}">${k.delta}</div>
        </div>`;
    });

    /* Milestones */
    const milestones = [
      { label:'First $1 of revenue',           target:'Any amount', done: totalMrr > 0 },
      { label:'First 10 paying customers',      target:'Manual sales', done: totalUsers >= 10 },
      { label:'$1,000 MRR',                     target:'$1K/mo', done: totalMrr >= 1000 },
      { label:'$10,000 MRR → Stage 2',          target:'$10K/mo', done: totalMrr >= 10000 },
      { label:'$50,000 MRR → North Star',       target:'$50K/mo', done: totalMrr >= 50000 },
    ];
    const msEl = document.getElementById('milestones');
    milestones.forEach(m => {
      msEl.innerHTML += `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--card2);border:1px solid ${m.done ? 'rgba(61,220,110,0.3)' : 'var(--border)'};border-radius:var(--radius-sm);margin-bottom:8px">
          <div style="width:18px;height:18px;border-radius:50%;border:2px solid ${m.done ? '#3ddc6e' : 'var(--border)'};background:${m.done ? '#3ddc6e' : 'transparent'};flex-shrink:0;display:flex;align-items:center;justify-content:center">
            ${m.done ? '<span style="color:#000;font-size:10px;font-weight:900">✓</span>' : ''}
          </div>
          <div style="flex:1;font-size:13px;color:rgba(226,234,242,${m.done ? '0.5' : '0.82'});${m.done ? 'text-decoration:line-through' : ''}">${m.label}</div>
          <span class="badge badge-muted">${m.target}</span>
        </div>`;
    });

    /* Departments */
    const DEPTS = APP_DATA.business.departments;
    const deptGrid = document.getElementById('deptGrid');
    DEPTS.forEach(dept => {
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
            ${dept.priorities.map((p, i) => `
              <div class="priority-item">
                <div class="priority-dot p${i+1}"></div>
                <span>${p}</span>
              </div>`).join('')}
          </div>
        </div>`;
    });
  }

  /* ══════════════════════════════════════════════════════════════
     VENTURES TAB
  ══════════════════════════════════════════════════════════════ */
  function renderVentures(panel) {
    if (ventures().length === 0) {
      panel.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align:center;padding:40px">
            <div style="font-size:32px;margin-bottom:12px">🚀</div>
            <div style="font-size:15px;font-weight:600;margin-bottom:6px">No ventures yet</div>
            <div style="font-size:13px;color:var(--muted)">Click "+ New Venture" to create your first one.</div>
          </div>
        </div>`;
      return;
    }

    /* Venture selector tabs */
    let activeVId = biz().activeVentureId || ventures()[0]?.id;
    if (!ventures().find(v => v.id === activeVId)) activeVId = ventures()[0]?.id;
    STATE.data.business.activeVentureId = activeVId;

    const vtabs = ventures().map(v => `
      <button class="day-tab${v.id === activeVId ? ' active' : ''}" data-vid="${v.id}">${v.icon} ${v.name}</button>`).join('');

    panel.innerHTML = `
      <div class="day-tabs" style="margin-bottom:16px;flex-wrap:wrap" id="ventureTabs">${vtabs}</div>
      <div id="ventureDetail"></div>`;

    panel.querySelectorAll('[data-vid]').forEach(btn => {
      btn.addEventListener('click', () => {
        STATE.data.business.activeVentureId = btn.dataset.vid;
        activeVId = btn.dataset.vid;
        panel.querySelectorAll('[data-vid]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderVentureDetail(document.getElementById('ventureDetail'), activeVId);
      });
    });

    renderVentureDetail(document.getElementById('ventureDetail'), activeVId);
  }

  function renderVentureDetail(container, ventureId) {
    const v = ventures().find(v => v.id === ventureId);
    if (!v) return;

    const STAGES = APP_DATA.business.stages;
    const TEMPLATES = APP_DATA.blueprintTemplates || [];

    /* Active blueprint id */
    let activeBpId = biz().activeBlueprintId;
    if (!v.blueprints.find(b => b.id === activeBpId)) {
      activeBpId = v.blueprints[0]?.id || null;
      STATE.data.business.activeBlueprintId = activeBpId;
    }

    container.innerHTML = `
      <!-- Venture header -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:flex-start">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:28px">${v.icon}</span>
            <div>
              <div style="font-family:'Rajdhani',sans-serif;font-size:20px;font-weight:700">${v.name}</div>
              <div style="font-size:12px;color:var(--muted)">${v.description || 'No description'}</div>
            </div>
          </div>
          <span class="badge badge-warn">Hormozi Stage ${v.hormozi_stage}</span>
        </div>
        <div class="card-body">
          <!-- Editable metrics row -->
          <div style="display:flex;gap:24px;margin-bottom:16px;flex-wrap:wrap">
            <div>
              <div style="font-size:11px;color:var(--muted);margin-bottom:2px">MRR</div>
              <input class="venture-metric-input" data-field="mrr" type="number" value="${v.mrr||0}" placeholder="0" />
            </div>
            <div>
              <div style="font-size:11px;color:var(--muted);margin-bottom:2px">Paying Users</div>
              <input class="venture-metric-input" data-field="users" type="number" value="${v.users||0}" placeholder="0" />
            </div>
            <div>
              <div style="font-size:11px;color:var(--muted);margin-bottom:2px">Hormozi Stage</div>
              <select class="app-select" id="hormozi-stage-sel" style="width:auto">
                ${STAGES.map((s, i) => `<option value="${i}"${i === v.hormozi_stage ? ' selected' : ''}>${i} — ${s.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <!-- Notes -->
          <div style="font-size:11px;color:var(--muted);margin-bottom:4px">Venture Notes</div>
          <textarea class="venture-notes-input" id="ventureNotes" placeholder="Key decisions, blockers, observations…">${v.notes||''}</textarea>
        </div>
      </div>

      <!-- Blueprints -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div class="section-label" style="margin-bottom:0">Blueprints</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select class="app-select" id="addBpSel">
            <option value="">+ Add Blueprint…</option>
            ${TEMPLATES.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
          </select>
          <button class="day-tab" id="addBpBtn">Add</button>
        </div>
      </div>

      ${v.blueprints.length === 0 ? `
        <div class="card">
          <div class="card-body" style="text-align:center;padding:32px;color:var(--muted);font-size:13px">
            No blueprints yet. Select a framework above and click Add.
          </div>
        </div>` : `
        <!-- Blueprint tabs -->
        <div class="day-tabs" style="margin-bottom:14px;flex-wrap:wrap" id="bpTabs">
          ${v.blueprints.map(b => `
            <button class="day-tab${b.id === activeBpId ? ' active' : ''}" data-bpid="${b.id}">${b.name}</button>`).join('')}
        </div>
        <div id="bpDetail"></div>`}`;

    /* Metric inputs */
    container.querySelectorAll('.venture-metric-input').forEach(inp => {
      inp.addEventListener('change', () => {
        STATE.updateVenture(ventureId, { [inp.dataset.field]: parseFloat(inp.value) || 0 });
      });
    });

    /* Hormozi stage selector */
    container.querySelector('#hormozi-stage-sel')?.addEventListener('change', e => {
      STATE.setHormoziStage(ventureId, parseInt(e.target.value));
    });

    /* Notes textarea */
    const notesEl = container.querySelector('#ventureNotes');
    let notesTimer;
    notesEl?.addEventListener('input', () => {
      clearTimeout(notesTimer);
      notesTimer = setTimeout(() => STATE.updateVenture(ventureId, { notes: notesEl.value }), 600);
    });

    /* Add blueprint */
    container.querySelector('#addBpBtn')?.addEventListener('click', () => {
      const sel = container.querySelector('#addBpSel');
      const tplId = sel.value;
      if (!tplId) return;
      const newId = STATE.addBlueprint(ventureId, tplId);
      STATE.data.business.activeBlueprintId = newId;
      renderVentureDetail(container, ventureId);
    });

    /* Blueprint tabs */
    if (v.blueprints.length > 0) {
      container.querySelectorAll('[data-bpid]').forEach(btn => {
        btn.addEventListener('click', () => {
          STATE.data.business.activeBlueprintId = btn.dataset.bpid;
          activeBpId = btn.dataset.bpid;
          container.querySelectorAll('[data-bpid]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          renderBlueprintDetail(document.getElementById('bpDetail'), ventureId, activeBpId);
        });
      });
      if (activeBpId) renderBlueprintDetail(document.getElementById('bpDetail'), ventureId, activeBpId);
    }
  }

  /* ── Blueprint step list ── */
  function renderBlueprintDetail(container, ventureId, blueprintId) {
    const v  = ventures().find(v => v.id === ventureId);
    const bp = v?.blueprints.find(b => b.id === blueprintId);
    if (!bp) return;

    const tpl = (APP_DATA.blueprintTemplates || []).find(t => t.id === bp.templateId);
    const doneCount = bp.steps.filter(s => s.completed).length;
    const pct       = bp.steps.length ? Math.round((doneCount / bp.steps.length) * 100) : 0;

    container.innerHTML = `
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div class="card-title">${bp.name}</div>
            ${tpl ? `<div style="font-size:11px;color:var(--muted);margin-top:2px">${tpl.description}</div>` : ''}
          </div>
          <span class="badge badge-accent">${doneCount}/${bp.steps.length} steps · ${pct}%</span>
        </div>
        <div class="card-body" style="padding:8px 0">
          <div class="progress-track" style="margin:0 16px 16px"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div id="stepList"></div>
        </div>
      </div>`;

    const stepList = container.querySelector('#stepList');
    bp.steps.forEach((step, idx) => {
      const tplStep = tpl?.steps[idx] || {};
      const row = document.createElement('div');
      row.className = 'bp-step-row' + (step.completed ? ' done' : '');
      row.innerHTML = `
        <div class="bp-step-check${step.completed ? ' checked' : ''}" data-step="${idx}" title="Toggle complete"></div>
        <div class="bp-step-content">
          <div class="bp-step-name">${tplStep.name || 'Step ' + (idx+1)}</div>
          ${tplStep.description ? `<div class="bp-step-desc">${tplStep.description}</div>` : ''}
          ${tplStep.keyActions?.length ? `
            <div class="bp-step-actions">
              ${tplStep.keyActions.map(a => `<div class="bp-step-action">→ ${a}</div>`).join('')}
            </div>` : ''}
          <textarea class="bp-step-notes" data-step="${idx}" placeholder="Notes for this step…">${step.notes||''}</textarea>
          ${step.completedAt ? `<div class="bp-step-date">Completed ${new Date(step.completedAt).toLocaleDateString()}</div>` : ''}
        </div>`;

      /* Toggle completion */
      row.querySelector('.bp-step-check').addEventListener('click', () => {
        const done = !step.completed;
        STATE.completeStep(ventureId, blueprintId, idx, done);
        renderBlueprintDetail(container, ventureId, blueprintId);
      });

      /* Notes autosave */
      const notesEl = row.querySelector('.bp-step-notes');
      let t;
      notesEl.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => STATE.setStepNotes(ventureId, blueprintId, idx, notesEl.value), 600);
      });

      stepList.appendChild(row);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     NEW VENTURE FORM
  ══════════════════════════════════════════════════════════════ */
  function renderNewVentureForm(panel) {
    const TEMPLATES = APP_DATA.blueprintTemplates || [];
    panel.innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-title">Create New Venture</div></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Venture Name</label>
              <input class="form-input" id="nvName" type="text" placeholder="e.g. Envosta, Side Hustle 2…" />
            </div>
            <div class="form-field" style="max-width:80px">
              <label class="form-label">Icon</label>
              <input class="form-input" id="nvIcon" type="text" placeholder="🚀" maxlength="4" />
            </div>
          </div>
          <div class="form-field" style="margin-top:12px">
            <label class="form-label">Description</label>
            <input class="form-input" id="nvDesc" type="text" placeholder="One line — what does this venture do?" />
          </div>
          <div class="form-field" style="margin-top:12px">
            <label class="form-label">Starting Blueprints (select any to attach)</label>
            <div id="bpCheckboxes" style="display:flex;flex-direction:column;gap:8px;margin-top:6px">
              ${TEMPLATES.map(t => `
                <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer">
                  <input type="checkbox" value="${t.id}" style="margin-top:3px;accent-color:var(--accent)" />
                  <div>
                    <div style="font-size:13px;font-weight:500">${t.name}</div>
                    <div style="font-size:11px;color:var(--muted)">${t.description}</div>
                  </div>
                </label>`).join('')}
            </div>
          </div>
          <button class="phase-btn active" id="createVenture" style="margin-top:20px;padding:10px 24px;font-size:14px">Create Venture</button>
          <div id="nvError" style="color:var(--danger);font-size:12px;margin-top:8px;display:none"></div>
        </div>
      </div>`;

    panel.querySelector('#createVenture').addEventListener('click', () => {
      const name = panel.querySelector('#nvName').value.trim();
      const icon = panel.querySelector('#nvIcon').value.trim() || '🚀';
      const desc = panel.querySelector('#nvDesc').value.trim();
      const errEl = panel.querySelector('#nvError');

      if (!name) { errEl.textContent = 'Venture name is required.'; errEl.style.display = 'block'; return; }
      errEl.style.display = 'none';

      const newId = STATE.addVenture(name, icon, desc);

      /* Attach selected blueprints */
      panel.querySelectorAll('#bpCheckboxes input:checked').forEach(cb => {
        STATE.addBlueprint(newId, cb.value);
      });

      /* Switch to ventures tab */
      inner.querySelectorAll('[data-biztab]').forEach(b => b.classList.remove('active'));
      inner.querySelector('[data-biztab="ventures"]').classList.add('active');
      activeTab = 'ventures';
      renderPanel();
    });
  }

  /* ── Initial render ── */
  renderPanel();
});
