/**
 * KOLTYN OS — pages/nutrition.js
 *
 * DATA FLOW
 *   APP_DATA.nutrition  → base meal options per phase (read-only)
 *   APP_DATA.wholeFoods → whole foods reference categories (read-only)
 *   APP_DATA.healthPrinciples.nutrition → static principles (read-only)
 *
 *   STATE.data.nutrition → currentPhase, selectedMeals, customMeals (read + write)
 *
 * WRITES TO STATE → IDB
 *   STATE.setNutritionPhase(phase)              → nutrition.currentPhase
 *   STATE.selectMeal(phase, slotIdx, mealIdx)   → nutrition.selectedMeals
 *   STATE.addCustomMeal(phase, slotIdx, mealObj) → nutrition.customMeals
 *   STATE.removeCustomMeal(phase, slotIdx, idx)  → nutrition.customMeals
 *   All mutators call save() which writes to IndexedDB asynchronously.
 *
 * REMOVE BUTTONS
 *   Base meals: clicking a selected meal deselects it (toggle already in place).
 *   Custom meals: a permanent × delete button removes the meal from STATE/IDB.
 *
 * WHOLE FOODS
 *   All categories shown in one compact multi-column grid (not separate cards).
 */

window.registerPage('nutrition', function initNutrition() {

  /* ── Base data (read-only) ── */
  const BASE_PHASES = APP_DATA.nutrition.phases;
  const BASE_MEALS  = APP_DATA.nutrition.meals;
  const MEAL_TITLES = APP_DATA.nutrition.mealTitles;
  const ns          = STATE.data.nutrition;

  /* Merge base meals + user-added custom meals for the given phase.
     Base meals are always first; custom meals append at the end.
     The combined index is used for selectedMeals[phase][slotIdx]. */
  function getMeals(phase) {
    const base   = BASE_MEALS[phase];
    const custom = ns.customMeals[phase] || [[], [], [], []];
    return base.map((slot, i) => [...slot, ...(custom[i] || [])]);
  }

  /* Index at which custom meals start for a given phase + slot */
  function baseCount(phase, slotIdx) {
    return BASE_MEALS[phase][slotIdx].length;
  }

  let currentPhase  = ns.currentPhase || 'bulk';
  let selectedMeals = ns.selectedMeals[currentPhase]
    ? [...ns.selectedMeals[currentPhase]]
    : [null, null, null, null];

  const expandedMeals = {}; /* tracks which meal-option is expanded: key = "mi-oi" */

  /* ── Page shell ── */
  const inner = document.getElementById('nutrition-inner');
  inner.innerHTML = `
    ${buildPageHeader('Daily Planner', 'Nutrition', 'Dashboard',
      'Select one option per meal slot — all combinations hit your daily target.',
      `<div class="legend">
         <div class="legend-item"><div class="legend-dot" style="background:var(--simple)"></div>Simple</div>
         <div class="legend-item"><div class="legend-dot" style="background:var(--premade)"></div>Premade</div>
         <div class="legend-item"><div class="legend-dot" style="background:var(--gourmet)"></div>Gourmet</div>
       </div>
       <div class="phase-label">Phase</div>
       <select class="app-select" id="phaseSelect">
         <option value="bulk">Bulk</option>
         <option value="maintain">Maintain</option>
         <option value="cut">Cut</option>
       </select>`
    )}

    <!-- ── Macro summary pinned at top — targets + currently selected side by side ── -->
    <div class="card" id="macroSummaryCard">
      <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
        <div class="card-title">Daily Macro Summary</div>
        <div class="match-badge" id="matchBadge">
          <div class="checkmark"><svg viewBox="0 0 8 8" fill="none"><polyline points="1,4 3,6 7,2" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg></div>
          On target ✓
        </div>
      </div>
      <div class="card-body" style="padding:12px 16px">
        <div class="macro-summary-grid" id="macroSummaryGrid"></div>
      </div>
    </div>

    <!-- ── Meal slots ── -->
    <div>
      <div class="meals-section-title">Select one per meal slot — tap a meal to select, tap again to expand details</div>
      <div class="meals-grid" id="mealsGrid"></div>
    </div>

    <!-- ── Whole Foods reference — compact multi-column layout ── -->
    <div class="section-label">Whole Foods Reference</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:12px">Top nutrient-dense options. Build meals around these.</div>
    <div class="card">
      <div class="card-body" style="padding:12px 16px">
        <div class="whole-foods-compact-grid" id="wholeFoodsCompact"></div>
      </div>
    </div>

    <!-- ── Nutrition Principles ── -->
    <div class="section-label" style="margin-top:8px">Nutrition Principles</div>
    <div class="grid-2" id="nutritionPrinciples"></div>

    <!-- ── Macro Calculator ── -->
    <div class="section-label" style="margin-top:8px">Macro Calculator</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:12px">Manual inputs → auto-calculated targets. Use as a starting point — adjust based on real results.</div>
    <div class="card" id="macroCalcCard">
      <div class="card-body" style="padding:18px 20px">

        <!-- Body weight slider -->
        <div style="margin-bottom:18px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <label class="form-label">Body Weight</label>
            <span style="font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:700;color:var(--accent)" id="calcWeightDisplay">175 lbs</span>
          </div>
          <input type="range" id="calcWeight" min="120" max="280" value="175" step="1" class="macro-slider" />
        </div>

        <!-- Goal toggle -->
        <div style="margin-bottom:18px">
          <div class="form-label" style="margin-bottom:8px">Goal</div>
          <div class="phase-toggle" id="calcGoalToggle">
            <button class="phase-btn" data-goal="cut">Cut</button>
            <button class="phase-btn active" data-goal="maintain">Maintain</button>
            <button class="phase-btn" data-goal="bulk">Bulk</button>
          </div>
        </div>

        <!-- Activity level -->
        <div style="margin-bottom:20px">
          <div class="form-label" style="margin-bottom:8px">Activity Level</div>
          <div class="phase-toggle" id="calcActivityToggle">
            <button class="phase-btn" data-activity="12">Sedentary</button>
            <button class="phase-btn active" data-activity="14">Light</button>
            <button class="phase-btn" data-activity="15.5">Moderate</button>
            <button class="phase-btn" data-activity="17">Active</button>
          </div>
        </div>

        <!-- Results -->
        <div class="macro-calc-results" id="calcResults"></div>
      </div>
    </div>`;

  /* ── Set saved phase ── */
  document.getElementById('phaseSelect').value = currentPhase;

  function catClass(c) {
    return c === 'Simple' ? 'cat-simple' : c === 'Premade' ? 'cat-premade' : 'cat-gourmet';
  }

  /* ── Inline add-custom-meal panel ── */
  let addingMealSlot = null;

  function openAddMealPanel(slotIdx) {
    addingMealSlot = slotIdx;
    /* Close any open add-panels */
    document.querySelectorAll('.add-meal-panel').forEach(p => p.remove());
    const card = document.querySelector(`[data-slot-card="${slotIdx}"]`);
    const panel = document.createElement('div');
    panel.className = 'add-meal-panel';
    panel.style.cssText = 'padding:14px 16px;border-top:1px solid var(--border);background:rgba(255,255,255,0.03)';
    panel.innerHTML = `
      <div style="font-family:'Rajdhani',sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Add Custom Meal</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <input class="form-input" id="cmName"    placeholder="Meal name" />
        <input class="form-input" id="cmCuisine" placeholder="Cuisine (e.g. American)" />
        <select class="app-select" id="cmCat">
          <option value="Simple">Simple</option>
          <option value="Premade">Premade</option>
          <option value="Gourmet">Gourmet</option>
        </select>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <input class="form-input" id="cmCal"  type="number" placeholder="Calories" style="flex:1;min-width:70px" />
          <input class="form-input" id="cmPro"  type="number" placeholder="Protein g" style="flex:1;min-width:70px" />
          <input class="form-input" id="cmCarb" type="number" placeholder="Carbs g" style="flex:1;min-width:70px" />
          <input class="form-input" id="cmFat"  type="number" placeholder="Fat g" style="flex:1;min-width:70px" />
        </div>
        <div style="display:flex;gap:8px">
          <button class="day-tab active" id="saveCm" style="flex:1;padding:9px">Add Meal</button>
          <button class="day-tab" id="cancelCm" style="padding:9px 14px">Cancel</button>
        </div>
        <div id="cmError" style="color:var(--danger);font-size:12px;display:none"></div>
      </div>`;
    card.appendChild(panel);

    panel.querySelector('#cancelCm').addEventListener('click', () => panel.remove());
    panel.querySelector('#saveCm').addEventListener('click', () => {
      const name  = panel.querySelector('#cmName').value.trim();
      const cal   = parseInt(panel.querySelector('#cmCal').value)  || 0;
      const pro   = parseInt(panel.querySelector('#cmPro').value)  || 0;
      const carb  = parseInt(panel.querySelector('#cmCarb').value) || 0;
      const fat   = parseInt(panel.querySelector('#cmFat').value)  || 0;
      const errEl = panel.querySelector('#cmError');
      if (!name || !cal) { errEl.textContent = 'Name and calories are required.'; errEl.style.display = 'block'; return; }
      STATE.addCustomMeal(currentPhase, addingMealSlot, {
        name,
        category: panel.querySelector('#cmCat').value,
        cuisine:  panel.querySelector('#cmCuisine').value.trim() || 'Custom',
        calories: cal, protein: pro, carbs: carb, fats: fat,
      });
      renderPhase();
    });
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER PHASE — rebuilds meal grid + updates summary
  ══════════════════════════════════════════════════════════════ */
  function renderPhase() {
    const ph = BASE_PHASES[currentPhase];
    selectedMeals = ns.selectedMeals[currentPhase]
      ? [...ns.selectedMeals[currentPhase]]
      : [null, null, null, null];

    /* Update macro summary at top */
    updateSummary();

    const allMeals = getMeals(currentPhase);
    const grid     = document.getElementById('mealsGrid');
    grid.innerHTML = '';

    allMeals.forEach((opts, mi) => {
      const visible  = opts.slice(0, 10);
      const baseLen  = baseCount(currentPhase, mi);
      const card     = document.createElement('div');
      card.className = 'meal-card';
      card.dataset.slotCard = mi;
      card.innerHTML = `
        <div class="meal-card-header">
          <div class="meal-card-number">Slot ${mi + 1}</div>
          <div class="meal-card-title">${MEAL_TITLES[mi]}</div>
          <button class="day-tab add-meal-btn" data-slot="${mi}" style="margin-left:auto;font-size:11px;padding:4px 10px">+ Custom</button>
        </div>
        <div class="meal-options-scroll" id="nl-${mi}"></div>`;
      grid.appendChild(card);

      const list = card.querySelector(`#nl-${mi}`);
      visible.forEach((opt, oi) => {
        const isCustom   = oi >= baseLen;
        const customIdx  = oi - baseLen;
        const isSelected = selectedMeals[mi] === oi;
        const expKey     = `${mi}-${oi}`;
        const isExpanded = !!expandedMeals[expKey];

        /* Macro bar widths for inline detail */
        const totalCal = opt.calories || 1;
        const pCal = (opt.protein * 4 / totalCal * 100).toFixed(0);
        const cCal = (opt.carbs   * 4 / totalCal * 100).toFixed(0);
        const fCal = (opt.fats    * 9 / totalCal * 100).toFixed(0);

        const item = document.createElement('div');
        item.className = 'meal-option' + (isSelected ? ' selected' : '');
        item.innerHTML = `
          <div class="meal-option-top">
            <div class="meal-option-name">${opt.name}</div>
            <div style="display:flex;gap:4px;align-items:center">
              <div class="category-badge ${catClass(opt.category)}">${opt.category}</div>
              ${isCustom ? `<button class="meal-delete-btn" title="Remove this custom meal">×</button>` : ''}
            </div>
          </div>
          <div class="meal-option-bottom">
            <span class="cuisine-tag">${opt.cuisine}</span>
            <div class="meal-macros">
              <span class="mm mm-cal">${opt.calories}kcal</span>
              <span class="mm mm-p">${opt.protein}P</span>
              <span class="mm mm-c">${opt.carbs}C</span>
              <span class="mm mm-f">${opt.fats}F</span>
            </div>
            <button class="expand-btn" title="Show details" style="background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;padding:2px 6px;transition:transform .2s;transform:${isExpanded ? 'rotate(180deg)' : 'none'}">▾</button>
          </div>
          <div class="meal-inline-details" style="display:${isExpanded ? 'block' : 'none'};padding:10px 0 4px;border-top:1px solid rgba(255,255,255,0.06);margin-top:8px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;font-size:12px;margin-bottom:10px">
              <div><span style="color:var(--muted)">Cuisine</span><div style="color:var(--text);font-weight:600">${opt.cuisine}</div></div>
              <div><span style="color:var(--muted)">Category</span><div style="color:var(--text);font-weight:600">${opt.category}</div></div>
            </div>
            <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Macro Breakdown</div>
            <div style="display:flex;flex-direction:column;gap:5px;font-size:11px">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="color:#f5a623;min-width:52px">Protein</span>
                <div style="flex:1;height:5px;background:rgba(255,255,255,0.08);border-radius:3px"><div style="height:100%;width:${pCal}%;background:#f5a623;border-radius:3px"></div></div>
                <span style="color:var(--text)">${opt.protein}g <span style="color:var(--muted)">(${pCal}%)</span></span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="color:#42c4f5;min-width:52px">Carbs</span>
                <div style="flex:1;height:5px;background:rgba(255,255,255,0.08);border-radius:3px"><div style="height:100%;width:${cCal}%;background:#42c4f5;border-radius:3px"></div></div>
                <span style="color:var(--text)">${opt.carbs}g <span style="color:var(--muted)">(${cCal}%)</span></span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="color:#c97bff;min-width:52px">Fats</span>
                <div style="flex:1;height:5px;background:rgba(255,255,255,0.08);border-radius:3px"><div style="height:100%;width:${fCal}%;background:#c97bff;border-radius:3px"></div></div>
                <span style="color:var(--text)">${opt.fats}g <span style="color:var(--muted)">(${fCal}%)</span></span>
              </div>
            </div>
          </div>`;

        /* Tap card body → select/deselect */
        item.addEventListener('click', e => {
          if (e.target.classList.contains('expand-btn') ||
              e.target.classList.contains('meal-delete-btn')) return;
          selectMeal(mi, oi, item);
        });

        /* Expand/collapse toggle */
        item.querySelector('.expand-btn').addEventListener('click', e => {
          e.stopPropagation();
          const details = item.querySelector('.meal-inline-details');
          const btn     = item.querySelector('.expand-btn');
          const open    = details.style.display === 'none';
          details.style.display = open ? 'block' : 'none';
          btn.style.transform   = open ? 'rotate(180deg)' : 'none';
          if (open) expandedMeals[expKey] = true;
          else delete expandedMeals[expKey];
        });

        /* Delete custom meal */
        const delBtn = item.querySelector('.meal-delete-btn');
        if (delBtn) {
          delBtn.addEventListener('click', e => {
            e.stopPropagation();
            if (selectedMeals[mi] === oi) STATE.selectMeal(currentPhase, mi, null);
            STATE.removeCustomMeal(currentPhase, mi, customIdx);
            renderPhase();
          });
        }

        list.appendChild(item);
      });

      /* + Custom button */
      card.querySelector('.add-meal-btn').addEventListener('click', () => {
        if (opts.length >= 10) { alert('Maximum 10 meal options per slot reached.'); return; }
        openAddMealPanel(mi);
      });
    });
  }

  function selectMeal(mi, oi, el) {
    document.querySelectorAll(`#nl-${mi} .meal-option`).forEach(o => o.classList.remove('selected'));
    /* Toggle: clicking selected meal deselects it */
    selectedMeals[mi] = selectedMeals[mi] === oi ? null : oi;
    if (selectedMeals[mi] !== null) el.classList.add('selected');
    /* STATE.selectMeal writes to nutrition.selectedMeals[phase][slotIdx] and saves to IDB */
    STATE.selectMeal(currentPhase, mi, selectedMeals[mi]);
    updateSummary();
  }

  /* ══════════════════════════════════════════════════════════════
     MACRO SUMMARY — two-column layout: targets | selected
     Shown at the top of the page (always visible).
  ══════════════════════════════════════════════════════════════ */
  function updateSummary() {
    let cal = 0, pro = 0, carb = 0, fat = 0, cnt = 0;
    const allMeals = getMeals(currentPhase);
    const ph       = BASE_PHASES[currentPhase];
    selectedMeals.forEach((oi, mi) => {
      if (oi !== null && allMeals[mi][oi]) {
        const o = allMeals[mi][oi];
        cal += o.calories; pro += o.protein; carb += o.carbs; fat += o.fats;
        cnt++;
      }
    });

    const grid = document.getElementById('macroSummaryGrid');
    if (!grid) return;

    /* Two-column per macro: target | selected with fill bar */
    const macros = [
      { key:'cal',  label:'Calories', selected:cal,  target:ph.calories, unit:'kcal', color:'var(--accent3)' },
      { key:'pro',  label:'Protein',  selected:pro,  target:ph.protein,  unit:'g',    color:'#f5a623' },
      { key:'carb', label:'Carbs',    selected:carb, target:ph.carbs,    unit:'g',    color:'#42c4f5' },
      { key:'fat',  label:'Fats',     selected:fat,  target:ph.fats,     unit:'g',    color:'#c97bff' },
    ];

    grid.innerHTML = macros.map(m => {
      const pct   = m.target > 0 ? Math.min(100, (m.selected / m.target) * 100) : 0;
      const over  = m.selected > m.target;
      const exact = m.selected === m.target && cnt === 4;
      return `
        <div class="macro-summary-item">
          <div class="macro-summary-label">${m.label}</div>
          <div class="macro-summary-row">
            <span class="macro-summary-sel" style="color:${m.color}">${m.selected}<span class="macro-summary-unit">${m.unit}</span></span>
            <span class="macro-summary-target">/ ${m.target}${m.unit}</span>
          </div>
          <div class="macro-bar-track">
            <div class="macro-bar-fill" style="width:${pct}%;background:${m.color};opacity:${over ? '1' : '0.7'}"></div>
          </div>
        </div>`;
    }).join('');

    /* Match badge */
    const badge = document.getElementById('matchBadge');
    badge.className = 'match-badge';
    if (cnt === 4) {
      if (cal === ph.calories && pro === ph.protein && carb === ph.carbs && fat === ph.fats) {
        badge.classList.add('perfect');
        badge.innerHTML = `<div class="checkmark"><svg viewBox="0 0 8 8" fill="none"><polyline points="1,4 3,6 7,2" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg></div> Macros perfectly matched ✓`;
      } else {
        badge.classList.add('mismatch');
        const d = cal - ph.calories;
        badge.innerHTML = `&#9888; ${d > 0 ? '+' : ''}${d} kcal from target`;
      }
    }
  }

  /* ── Phase selector ── */
  document.getElementById('phaseSelect').addEventListener('change', e => {
    currentPhase = e.target.value;
    /* STATE.setNutritionPhase writes to nutrition.currentPhase and saves to IDB */
    STATE.setNutritionPhase(currentPhase);
    renderPhase();
  });

  /* ══════════════════════════════════════════════════════════════
     WHOLE FOODS — compact multi-column grid (all categories in one card)
  ══════════════════════════════════════════════════════════════ */
  const wfCompact = document.getElementById('wholeFoodsCompact');
  (APP_DATA.wholeFoods || []).forEach(cat => {
    const col = document.createElement('div');
    col.className = 'wf-col';
    col.innerHTML = `
      <div class="wf-col-header">
        <span style="font-size:16px">${cat.icon}</span>
        <span>${cat.category}</span>
      </div>
      ${cat.items.map(item => `
        <div class="wf-item${item.top ? ' wf-top' : ''}">
          <div class="wf-item-name">${item.name}${item.top ? ' ⭐' : ''}</div>
          <div class="wf-item-highlight">${item.highlight}</div>
        </div>`).join('')}`;
    wfCompact.appendChild(col);
  });

  /* ── Nutrition principles ── */
  const prEl = document.getElementById('nutritionPrinciples');
  (APP_DATA.healthPrinciples?.nutrition || []).forEach(p => {
    prEl.innerHTML += `
      <div style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
        <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;color:var(--accent);margin-bottom:4px">${p.title}</div>
        <div style="font-size:12px;color:rgba(226,234,242,0.72);line-height:1.6">${p.body}</div>
      </div>`;
  });

  /* ══════════════════════════════════════════════════════════════
     MACRO CALCULATOR (moved from workout page)
     Pure client-side — no STATE writes.
     Formula:
       TDEE = weight(lbs) × activityFactor
       Bulk: +300 cal | Maintain: +0 | Cut: −500 cal
       Protein: 1.0 g/lb | Fat: 0.35 g/lb | Carbs: remainder
  ══════════════════════════════════════════════════════════════ */
  let calcWeight   = 175;
  let calcGoal     = 'maintain';
  let calcActivity = 14;

  function calcMacros() {
    const tdee    = calcWeight * calcActivity;
    const goalAdj = calcGoal === 'bulk' ? 300 : calcGoal === 'cut' ? -500 : 0;
    const calories = Math.round(tdee + goalAdj);
    const protein  = Math.round(calcWeight * 1.0);
    const fat      = Math.round(calcWeight * 0.35);
    const carbs    = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
    const pPct = Math.round((protein * 4 / calories) * 100);
    const cPct = Math.round((carbs   * 4 / calories) * 100);
    const fPct = Math.round((fat     * 9 / calories) * 100);

    document.getElementById('calcResults').innerHTML = `
      <div class="macro-calc-main">
        <div class="macro-calc-calories">
          <span class="macro-calc-cal-val">${calories.toLocaleString()}</span>
          <span class="macro-calc-cal-unit">kcal/day</span>
        </div>
      </div>
      <div class="macro-calc-breakdown">
        <div class="macro-calc-macro" style="--mc:${pPct}%;--col:#f5a623">
          <div class="macro-calc-bar"><div class="macro-calc-bar-fill"></div></div>
          <div class="macro-calc-val">${protein}g</div>
          <div class="macro-calc-lbl">Protein (${pPct}%)</div>
        </div>
        <div class="macro-calc-macro" style="--mc:${cPct}%;--col:#42c4f5">
          <div class="macro-calc-bar"><div class="macro-calc-bar-fill"></div></div>
          <div class="macro-calc-val">${carbs}g</div>
          <div class="macro-calc-lbl">Carbs (${cPct}%)</div>
        </div>
        <div class="macro-calc-macro" style="--mc:${fPct}%;--col:#c97bff">
          <div class="macro-calc-bar"><div class="macro-calc-bar-fill"></div></div>
          <div class="macro-calc-val">${fat}g</div>
          <div class="macro-calc-lbl">Fats (${fPct}%)</div>
        </div>
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:12px;line-height:1.5">
        TDEE ≈ ${Math.round(tdee).toLocaleString()} kcal · ${calcGoal === 'bulk' ? '+300 surplus' : calcGoal === 'cut' ? '−500 deficit' : 'maintenance'}
      </div>`;
  }

  /* Wire up macro calculator controls */
  document.getElementById('calcWeight').addEventListener('input', e => {
    calcWeight = parseInt(e.target.value);
    document.getElementById('calcWeightDisplay').textContent = calcWeight + ' lbs';
    calcMacros();
  });

  document.querySelectorAll('#calcGoalToggle [data-goal]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#calcGoalToggle [data-goal]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      calcGoal = btn.dataset.goal;
      calcMacros();
    });
  });

  document.querySelectorAll('#calcActivityToggle [data-activity]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#calcActivityToggle [data-activity]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      calcActivity = parseFloat(btn.dataset.activity);
      calcMacros();
    });
  });

  calcMacros(); /* initial render */

  renderPhase();
});
