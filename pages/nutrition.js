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

  let currentPhase  = ns.currentPhase || ns.calcGoal || 'bulk';
  let selectedMeals = ns.selectedMeals[currentPhase]
    ? [...ns.selectedMeals[currentPhase]]
    : [null, null, null, null];

  const expandedMeals = {}; /* tracks which meal-option is expanded: key = "mi-oi" */

  /* ── Page shell ── */
  const inner = document.getElementById('nutrition-inner');
  inner.innerHTML = `
    ${buildPageHeader('Daily Planner', 'Nutrition', 'Dashboard')}

    <!-- ── Macro summary + controls combined ── -->
    <div class="card" id="macroSummaryCard">
      <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
        <div class="card-title" style="flex-shrink:0">Daily Macro Summary</div>
        <div class="phase-toggle" id="phaseToggle" style="margin:0">
          <button class="phase-btn${currentPhase === 'bulk'     ? ' active' : ''}" data-phase="bulk">Bulk</button>
          <button class="phase-btn${currentPhase === 'maintain' ? ' active' : ''}" data-phase="maintain">Maintain</button>
          <button class="phase-btn${currentPhase === 'cut'      ? ' active' : ''}" data-phase="cut">Cut</button>
        </div>
        <div class="match-badge" id="matchBadge" style="flex-shrink:0">
          <div class="checkmark"><svg viewBox="0 0 8 8" fill="none"><polyline points="1,4 3,6 7,2" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg></div>
          On target ✓
        </div>
      </div>
      <div class="card-body" style="padding:12px 16px">
        <div class="macro-summary-grid" id="macroSummaryGrid"></div>
        <div class="legend" style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border)">
          <div class="legend-item"><div class="legend-dot" style="background:var(--simple)"></div>Simple</div>
          <div class="legend-item"><div class="legend-dot" style="background:var(--premade)"></div>Premade</div>
          <div class="legend-item"><div class="legend-dot" style="background:var(--gourmet)"></div>Gourmet</div>
        </div>
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

  `;

  /* ── Phase toggle ── */
  inner.querySelectorAll('#phaseToggle [data-phase]').forEach(btn => {
    btn.addEventListener('click', () => {
      inner.querySelectorAll('#phaseToggle [data-phase]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPhase = btn.dataset.phase;
      STATE.setNutritionPhase(currentPhase);
      /* Keep macro calculator goal in sync */
      STATE.setCalcInputs(ns.calcWeight, currentPhase, ns.calcActivity);
      renderPhase();
    });
  });

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

  /* ── Meal description generator ── */
  function getMealDesc(opt) {
    if (opt.category === 'Premade') return `Batch-cook friendly — prep once, eat all week. ${opt.cuisine} style.`;
    if (opt.category === 'Simple')  return `Quick prep, ~15–20 min. ${opt.cuisine} style.`;
    return `Elevated cooking with fresh ingredients. ${opt.cuisine} cuisine.`;
  }

  /* ── Ingredient list generator (derived from macro targets + name) ── */
  function getMealIngredients(opt) {
    const n = opt.name.toLowerCase();
    const items = [];

    /* Protein */
    if      (n.includes('chicken'))                            items.push(['Chicken breast', `${Math.round(opt.protein * 4)}g`]);
    else if (n.includes('salmon'))                             items.push(['Salmon fillet', `${Math.round(opt.protein * 4.2)}g`]);
    else if (n.includes('tuna'))                               items.push(['Tuna', `${Math.round(opt.protein * 4.3)}g`]);
    else if (n.includes('turkey'))                             items.push(['Ground turkey', `${Math.round(opt.protein * 4.5)}g`]);
    else if (n.includes('beef') || n.includes('steak'))        items.push(['Lean beef', `${Math.round(opt.protein * 4)}g`]);
    else if (n.includes('pork'))                               items.push(['Pork', `${Math.round(opt.protein * 4)}g`]);
    else if (n.includes('lamb'))                               items.push(['Lamb', `${Math.round(opt.protein * 4)}g`]);
    else if (n.includes('shrimp') || n.includes('prawn'))      items.push(['Shrimp', `${Math.round(opt.protein * 4)}g`]);
    else if (n.includes('cod') || n.includes('sea bass') || n.includes('branzino') || n.includes('swordfish') || n.includes('fish')) items.push(['Fish fillet', `${Math.round(opt.protein * 4.3)}g`]);
    else if (n.includes('tofu'))                               items.push(['Firm tofu', `${Math.round(opt.protein * 11)}g`]);
    else if (n.includes('egg'))                                items.push(['Eggs / egg whites', `${Math.ceil(opt.protein / 6)} large`]);
    else if (n.includes('greek yogurt') || n.includes('yogurt')) items.push(['Greek yogurt', `${Math.round(opt.protein * 10)}g`]);
    else if (n.includes('cottage cheese'))                     items.push(['Cottage cheese', `${Math.round(opt.protein * 9)}g`]);
    else                                                       items.push(['Lean protein source', `${opt.protein}g protein`]);

    /* Carbs */
    if      (n.includes('rice'))                               items.push(['Rice (cooked)', `${Math.round(opt.carbs * 3.5)}g`]);
    else if (n.includes('pasta') || n.includes('spaghetti') || n.includes('ziti') || n.includes('orzo') || n.includes('fregola')) items.push(['Pasta (cooked)', `${Math.round(opt.carbs * 3.8)}g`]);
    else if (n.includes('oat'))                                items.push(['Rolled oats', `${Math.round(opt.carbs / 0.67)}g dry`]);
    else if (n.includes('potato') || n.includes('patata'))     items.push(['Potato', `${Math.round(opt.carbs * 5.5)}g`]);
    else if (n.includes('quinoa'))                             items.push(['Quinoa (cooked)', `${Math.round(opt.carbs * 5)}g`]);
    else if (n.includes('lentil'))                             items.push(['Lentils (cooked)', `${Math.round(opt.carbs * 4.5)}g`]);
    else if (n.includes('bean') || n.includes('chickpea'))     items.push(['Legumes (cooked)', `${Math.round(opt.carbs * 5)}g`]);
    else if (n.includes('bulgur'))                             items.push(['Bulgur (cooked)', `${Math.round(opt.carbs * 4.5)}g`]);
    else if (n.includes('couscous'))                           items.push(['Couscous (cooked)', `${Math.round(opt.carbs * 4.5)}g`]);
    else if (n.includes('pita') || n.includes('bread') || n.includes('toast') || n.includes('wrap') || n.includes('flatbread') || n.includes('crostini') || n.includes('blini')) items.push(['Bread / pita', `${Math.round(opt.carbs * 2.5)}g`]);
    else if (n.includes('noodle') || n.includes('vermicelli') || n.includes('soba')) items.push(['Noodles (cooked)', `${Math.round(opt.carbs * 3.5)}g`]);
    else                                                       items.push(['Carb source', `${opt.carbs}g carbs`]);

    /* Veg + fats */
    items.push(['Mixed vegetables', '150–200g']);
    if (opt.fats > 15) items.push(['Healthy fats (oil / avocado)', `${Math.round(opt.fats * 0.45)}g`]);
    items.push(['Seasoning & spices', 'to taste']);
    return items;
  }

  /* ── Directions generator (category-based) ── */
  function getMealDirections(opt) {
    if (opt.category === 'Premade') return [
      'Batch-cook proteins and carbs in bulk at the start of the week.',
      'Portion into meal-prep containers alongside veggies.',
      'Refrigerate for up to 4 days or freeze for longer storage.',
      'Reheat in microwave 2–3 min or in a skillet over medium heat.',
      'Season fresh before eating for best flavour.',
    ];
    if (opt.category === 'Simple') return [
      'Weigh and prep all ingredients before cooking.',
      'Cook protein using your preferred method (pan-sear, grill, or oven at 200 °C / 400 °F for 20–25 min).',
      'Cook carb source according to package instructions.',
      'Steam or sauté vegetables until just tender.',
      'Combine, season to taste, and serve immediately.',
    ];
    /* Gourmet */
    return [
      'Gather and weigh all fresh ingredients precisely.',
      'Marinate or season protein at least 15–30 min before cooking.',
      'Cook each component separately using the appropriate technique (sear, braise, steam, or roast).',
      'Build the dish — layer components, adjust seasoning, and plate thoughtfully.',
      'Rest any meat 5 min before serving for optimal texture.',
    ];
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER PHASE — rebuilds meal grid + updates summary
  ══════════════════════════════════════════════════════════════ */
  function renderPhase() {
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

        const ingredients = getMealIngredients(opt);
        const directions  = getMealDirections(opt);

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
          <div class="meal-option-desc">${getMealDesc(opt)}</div>
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
          <div class="meal-expand-section" style="display:${isExpanded ? 'flex' : 'none'}">
            <!-- Macros -->
            <div>
              <div class="meal-expand-heading">Macro Breakdown</div>
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
            </div>
            <!-- Ingredients -->
            <div>
              <div class="meal-expand-heading">Ingredients</div>
              <ul class="meal-ingredient-list">
                ${ingredients.map(([name, amt]) => `<li><span>${name}</span><span style="color:var(--muted)">${amt}</span></li>`).join('')}
              </ul>
            </div>
            <!-- Directions -->
            <div>
              <div class="meal-expand-heading">Directions</div>
              <ol class="meal-directions-list">
                ${directions.map(d => `<li>${d}</li>`).join('')}
              </ol>
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
          const details = item.querySelector('.meal-expand-section');
          const btn     = item.querySelector('.expand-btn');
          const open    = details.style.display === 'none';
          details.style.display = open ? 'flex' : 'none';
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
    selectedMeals.forEach((oi, mi) => {
      if (oi !== null && allMeals[mi][oi]) {
        const o = allMeals[mi][oi];
        cal += o.calories; pro += o.protein; carb += o.carbs; fat += o.fats;
        cnt++;
      }
    });

    /* Targets come from the macro calculator (saved in Settings) */
    const targets = computeMacros(ns.calcWeight, ns.calcGoal, ns.calcActivity);

    const grid = document.getElementById('macroSummaryGrid');
    if (!grid) return;

    const macros = [
      { label:'Calories', eaten:cal,  target:targets.calories, unit:'kcal', color:'var(--accent3)' },
      { label:'Protein',  eaten:pro,  target:targets.protein,  unit:'g',    color:'#f5a623' },
      { label:'Carbs',    eaten:carb, target:targets.carbs,    unit:'g',    color:'#42c4f5' },
      { label:'Fats',     eaten:fat,  target:targets.fats,     unit:'g',    color:'#c97bff' },
    ];

    grid.innerHTML = macros.map(m => {
      const pct  = m.target > 0 ? Math.min(100, (m.eaten / m.target) * 100) : 0;
      const over = m.eaten > m.target;
      return `
        <div class="macro-summary-item">
          <div class="macro-summary-header">
            <span class="macro-summary-label">${m.label}</span>
            <span class="macro-summary-values">
              <span style="color:${m.color};font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700">${m.eaten}</span>
              <span class="macro-summary-sep">/</span>
              <span class="macro-summary-target">${m.target}${m.unit}</span>
            </span>
          </div>
          <div class="macro-bar-track">
            <div class="macro-bar-fill" style="width:${pct}%;background:${m.color};${over ? 'opacity:1' : ''}"></div>
          </div>
          <div class="macro-summary-sub">${Math.round(pct)}% of daily target</div>
        </div>`;
    }).join('');

    /* Match badge */
    const badge = document.getElementById('matchBadge');
    badge.className = 'match-badge';
    if (cnt === 4) {
      const diff = cal - targets.calories;
      if (Math.abs(diff) <= 50) {
        badge.classList.add('perfect');
        badge.innerHTML = `<div class="checkmark"><svg viewBox="0 0 8 8" fill="none"><polyline points="1,4 3,6 7,2" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg></div> On target ✓`;
      } else {
        badge.classList.add('mismatch');
        badge.innerHTML = `&#9888; ${diff > 0 ? '+' : ''}${diff} kcal from target`;
      }
    }
  }

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

  renderPhase();
});
