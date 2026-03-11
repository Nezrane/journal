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

  /* ── Food Library helpers ── */
  function getAllFoods() {
    const base   = (APP_DATA.foodLibrary || []);
    const custom = (STATE.data.nutrition.foodLibrary || []);
    return [...base, ...custom];
  }

  function filterFoods(query, category, type) {
    return getAllFoods().filter(f => {
      if (category && category !== 'All' && f.category !== category) return false;
      if (type && type !== 'all' && f.type !== type) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!f.name.toLowerCase().includes(q) && !(f.brand||'').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  function computeMealTotals(ingredients) {
    return ingredients.reduce((acc, ing) => {
      acc.calories += ing.calories || 0;
      acc.protein  += ing.protein  || 0;
      acc.carbs    += ing.carbs    || 0;
      acc.fats     += ing.fats     || 0;
      return acc;
    }, { calories:0, protein:0, carbs:0, fats:0 });
  }

  let currentPhase  = ns.calcGoal || ns.currentPhase || 'maintain';
  let selectedMeals = ns.selectedMeals[currentPhase]
    ? [...ns.selectedMeals[currentPhase]]
    : [null, null, null, null];

  let activeTab = 'plan';
  let builderMeal = { name:'', slots:[], ingredients:[] };
  let foodLibFilter = { query:'', category:'All', type:'all' };

  const NUTRITION_TABS = [
    { id: 'plan',      label: 'Meal Plan' },
    { id: 'customize', label: 'Customize' },
  ];

  /* ── Page shell ── */
  const inner = document.getElementById('nutrition-inner');
  inner.innerHTML = `
    ${buildPageHeader('Whole Food Influenced', 'Nutrition', 'Dashboard',
      'Select one per meal slot — tap a meal to select, tap again to expand details.'
    )}

    <!-- ── Meal Plan tab ── -->
    <div id="nt-section-plan">

      <!-- Phase + macro progress -->
      <div class="card" id="mealPlanProgress" style="margin-bottom:14px;overflow:hidden">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <div>
            <div class="card-title" style="flex-shrink:0">Daily Macro Summary</div>
            <div id="planPhaseLabel" style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-top:2px"></div>
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

      <!-- Meal slots -->
      <div class="meals-grid" id="mealsGrid"></div>

      <!-- Nutrition Principles -->
      <div class="section-label" style="margin-top:8px">Nutrition Principles</div>
      <div class="grid-2" id="nutritionPrinciplesPlan"></div>

    </div>

    <!-- ── Customize tab ── -->
    <div id="nt-section-customize" style="display:none">

      <!-- Macro Calculator -->
      <div class="card" style="margin-bottom:16px;overflow:hidden" id="ntMacroCalcCard">
        <div style="padding:14px 20px;border-bottom:1px solid var(--border)">
          <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)">Macro Calculator</div>
        </div>
        <div style="padding:18px 20px">

          <!-- Weight + Height + Body Fat -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:24px">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
                <span style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted)">Weight</span>
                <span style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;color:var(--accent)" id="ntCalcWeightDisplay">175 lbs</span>
              </div>
              <input type="range" id="ntCalcWeight" min="100" max="350" value="175" step="1" class="macro-slider" />
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
                <span style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted)">Height</span>
                <span style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;color:var(--accent)" id="ntCalcHeightDisplay">5'10"</span>
              </div>
              <input type="range" id="ntCalcHeight" min="54" max="84" value="70" step="1" class="macro-slider" />
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
                <span style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted)">Body Fat %</span>
                <span style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;color:var(--accent)" id="ntCurrentBodyFatDisplay">18%</span>
              </div>
              <input type="range" id="ntCurrentBodyFat" min="4" max="45" value="18" step="0.5" class="macro-slider" />
            </div>
          </div>

          <!-- Active Phase -->
          <div style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Active Phase</div>
          <div id="ntPhaseSuggestion" style="display:none;font-size:11px;padding:7px 10px;border-radius:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:var(--muted);margin-bottom:10px;line-height:1.4"></div>
          <div class="phase-toggle" id="ntCalcGoalToggle" style="margin-bottom:22px">
            <button class="phase-btn" data-goal="cut">Cut</button>
            <button class="phase-btn active" data-goal="maintain">Maintain</button>
            <button class="phase-btn" data-goal="bulk">Bulk</button>
          </div>

          <!-- Activity Level -->
          <div style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Activity Level</div>
          <div class="phase-toggle" id="ntCalcActivityToggle" style="margin-bottom:22px">
            <button class="phase-btn" data-activity="12">Sedentary</button>
            <button class="phase-btn active" data-activity="14">Light</button>
            <button class="phase-btn" data-activity="15.5">Moderate</button>
            <button class="phase-btn" data-activity="17">Active</button>
          </div>

          <div class="macro-calc-results" id="ntCalcResults"></div>
        </div>
      </div>

      <!-- Meal Builder + Food Library -->
      <div id="mealBuilderSection" style="margin-bottom:24px"></div>
      <div id="foodLibrarySection" style="margin-bottom:24px"></div>

      <!-- Nutrition Principles -->
      <div class="section-label" style="margin-top:8px">Nutrition Principles</div>
      <div class="grid-2" id="nutritionPrinciples"></div>

    </div>
  `;

  /* ── Sub-page tabs ── */
  function showTab(id) {
    activeTab = id;
    document.getElementById('nt-section-plan').style.display      = id === 'plan'      ? '' : 'none';
    document.getElementById('nt-section-customize').style.display = id === 'customize' ? '' : 'none';
    setPageTabs(inner, NUTRITION_TABS, id, showTab);
  }
  setPageTabs(inner, NUTRITION_TABS, activeTab, showTab);

  function catClass(c) {
    return c === 'Simple' ? 'cat-simple' : c === 'Premade' ? 'cat-premade' : 'cat-gourmet';
  }

  /* ── Inline add-custom-meal panel ── */
  let addingMealSlot = null;

  function openAddMealModal(slotIdx) {
    addingMealSlot = slotIdx;
    const slotName = MEAL_TITLES[slotIdx] || `Slot ${slotIdx + 1}`;
    document.getElementById('addMealEyebrow').textContent = slotName;
    document.getElementById('addMealBody').innerHTML = `
      <div style="padding:16px;display:flex;flex-direction:column;gap:10px">
        <input class="form-input" id="cmName"    placeholder="Meal name (e.g. Chicken Rice Bowl)" />
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <input class="form-input" id="cmCuisine" placeholder="Cuisine (e.g. American)" />
          <select class="app-select" id="cmCat">
            <option value="Simple">Simple</option>
            <option value="Premade">Premade</option>
            <option value="Gourmet">Gourmet</option>
          </select>
        </div>
        <div style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-top:4px">Macros</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <input class="form-input" id="cmCal"  type="number" placeholder="Calories (kcal)" />
          <input class="form-input" id="cmPro"  type="number" placeholder="Protein (g)" />
          <input class="form-input" id="cmCarb" type="number" placeholder="Carbs (g)" />
          <input class="form-input" id="cmFat"  type="number" placeholder="Fat (g)" />
        </div>
        <div id="cmError" style="color:var(--danger);font-size:12px;display:none"></div>
        <button class="day-tab active" id="saveCm" style="width:100%;padding:11px;font-size:13px;margin-top:4px">Save & Select Meal</button>
      </div>`;

    const overlay = document.getElementById('addMealOverlay');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    overlay.querySelector('#saveCm').addEventListener('click', () => {
      const name  = overlay.querySelector('#cmName').value.trim();
      const cal   = parseInt(overlay.querySelector('#cmCal').value)  || 0;
      const pro   = parseInt(overlay.querySelector('#cmPro').value)  || 0;
      const carb  = parseInt(overlay.querySelector('#cmCarb').value) || 0;
      const fat   = parseInt(overlay.querySelector('#cmFat').value)  || 0;
      const errEl = overlay.querySelector('#cmError');
      if (!name || !cal) { errEl.textContent = 'Name and calories are required.'; errEl.style.display = 'block'; return; }
      STATE.addCustomMeal(currentPhase, addingMealSlot, {
        name,
        category: overlay.querySelector('#cmCat').value,
        cuisine:  overlay.querySelector('#cmCuisine').value.trim() || 'Custom',
        calories: cal, protein: pro, carbs: carb, fats: fat,
      });
      /* Auto-select the new custom meal (it lands at the end of the slot) */
      const newIdx = getMeals(currentPhase)[addingMealSlot].length - 1;
      STATE.selectMeal(currentPhase, addingMealSlot, newIdx);
      closeAddMealModal();
      renderPhase();
    });
  }

  function closeAddMealModal() {
    const overlay = document.getElementById('addMealOverlay');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('addMealClose').addEventListener('click', closeAddMealModal);
  document.getElementById('addMealOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('addMealOverlay')) closeAddMealModal();
  });

  /* ── Add Custom Food modal wiring ── */
  const addFoodClose = document.getElementById('addFoodClose');
  if (addFoodClose) addFoodClose.addEventListener('click', closeAddFoodModal);

  const addFoodForm = document.getElementById('addFoodForm');
  if (addFoodForm) {
    addFoodForm.addEventListener('submit', e => {
      e.preventDefault();
      STATE.addFoodItem({
        name:        document.getElementById('afName').value.trim(),
        brand:       document.getElementById('afBrand').value.trim() || null,
        category:    document.getElementById('afCategory').value,
        type:        document.getElementById('afType').value,
        servingSize: parseFloat(document.getElementById('afServingSize').value) || 0,
        servingUnit: document.getElementById('afServingUnit').value,
        calories:    parseFloat(document.getElementById('afCalories').value) || 0,
        protein:     parseFloat(document.getElementById('afProtein').value)  || 0,
        carbs:       parseFloat(document.getElementById('afCarbs').value)    || 0,
        fats:        parseFloat(document.getElementById('afFats').value)     || 0,
        fiber:       parseFloat(document.getElementById('afFiber').value)    || 0,
        tags:        [],
      });
      closeAddFoodModal();
      renderFoodLibrary();
    });
  }

  /* ── Meal description generator ── */
  function getMealDesc(opt) {
    const n = opt.name.toLowerCase();
    const c = opt.cuisine;
    const p = opt.protein;
    const cal = opt.calories;

    if (opt.category === 'Premade') {
      if (n.includes('batch') || n.includes('frozen') || n.includes('prep'))
        return `A ${c} meal-prep staple built for consistency. Cook it in bulk on Sunday and you'll have a high-protein, macro-precise option ready to reheat all week — no thinking required on busy days. Great for hitting ${p}g protein without any mid-week cooking.`;
      return `Designed to be made ahead and portioned into containers. This ${c.toLowerCase()} option delivers ${cal} kcal in a format that travels well and reheats cleanly, making it one of the most efficient ways to stay on plan through a busy schedule.`;
    }

    if (opt.category === 'Simple') {
      if (n.includes('bowl') || n.includes('plate'))
        return `A straightforward ${c.toLowerCase()} bowl that comes together in under 20 minutes with minimal equipment. Built around whole-food sources of protein and complex carbs, it's easy to scale, hard to mess up, and delivers a clean ${cal} kcal with ${p}g of protein per serving.`;
      if (n.includes('smoothie') || n.includes('yogurt') || n.includes('cottage'))
        return `A no-cook ${c.toLowerCase()} option that's as fast as it gets. Measure, combine, done — ideal for mornings when time is tight or after a session when you need fast fuel. Packs ${p}g protein into a light, digestible format.`;
      return `A clean, no-fuss ${c.toLowerCase()} meal ready in 15–20 minutes. Built around familiar ingredients and a simple cook method, it keeps prep stress low while still hitting ${p}g protein and staying well within your ${cal} kcal target for this slot.`;
    }

    /* Gourmet */
    if (n.includes('korean') || n.includes('japanese') || n.includes('thai') || n.includes('vietnamese'))
      return `An elevated ${c.toLowerCase()} dish worth the extra effort. The flavour profile runs deep — aromatic bases, layered seasoning, and contrasting textures make this one of the most satisfying meals in the rotation. At ${cal} kcal and ${p}g protein, it delivers on every level: flavour, macros, and satisfaction.`;
    if (n.includes('italian') || n.includes('mediterranean') || n.includes('greek') || n.includes('spanish'))
      return `A refined ${c.toLowerCase()} dish that rewards patience and fresh ingredients. Built on classic technique, it's rich in flavour without being heavy — balanced macros of ${p}g protein and ${cal} kcal make it a gourmet option that still serves your performance goals.`;
    return `A chef-level ${c.toLowerCase()} preparation that elevates the ordinary into something memorable. Takes more active time to prepare but the result — ${cal} kcal, ${p}g protein, genuine flavour — is worth every minute. Best reserved for days when cooking is part of the ritual.`;
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
     MEAL DETAIL MODAL
  ══════════════════════════════════════════════════════════════ */
  const mealOverlay = document.getElementById('modalOverlay');

  function openMealModal(opt) {
    const totalCal = opt.calories || 1;
    const pCal = (opt.protein * 4 / totalCal * 100).toFixed(0);
    const cCal = (opt.carbs   * 4 / totalCal * 100).toFixed(0);
    const fCal = (opt.fats    * 9 / totalCal * 100).toFixed(0);
    const ingredients = getMealIngredients(opt);
    const directions  = getMealDirections(opt);

    document.getElementById('modalEyebrow').textContent  = opt.cuisine;
    document.getElementById('modalTitle').textContent    = opt.name;
    document.getElementById('modalCatBadge').textContent = opt.category;
    document.getElementById('modalCatBadge').className   = `category-badge ${catClass(opt.category)}`;
    document.getElementById('modalCuisineTag').textContent = opt.cuisine;
    document.getElementById('mCalChip').textContent = `${opt.calories} kcal`;
    document.getElementById('mProChip').textContent = `${opt.protein}g P`;
    document.getElementById('mCarbChip').textContent = `${opt.carbs}g C`;
    document.getElementById('mFatChip').textContent  = `${opt.fats}g F`;

    document.getElementById('modalBody').innerHTML = `
      <div style="padding:16px">
        <p style="font-size:13px;color:rgba(226,234,242,0.72);line-height:1.6;margin:0 0 16px">${getMealDesc(opt)}</p>

        <div style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Macro Breakdown</div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:18px;font-size:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="color:#f5a623;min-width:52px">Protein</span>
            <div style="flex:1;height:5px;background:rgba(255,255,255,0.08);border-radius:3px"><div style="height:100%;width:${pCal}%;background:#f5a623;border-radius:3px"></div></div>
            <span style="color:var(--fg)">${opt.protein}g <span style="color:var(--muted)">(${pCal}%)</span></span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="color:#42c4f5;min-width:52px">Carbs</span>
            <div style="flex:1;height:5px;background:rgba(255,255,255,0.08);border-radius:3px"><div style="height:100%;width:${cCal}%;background:#42c4f5;border-radius:3px"></div></div>
            <span style="color:var(--fg)">${opt.carbs}g <span style="color:var(--muted)">(${cCal}%)</span></span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="color:#c97bff;min-width:52px">Fats</span>
            <div style="flex:1;height:5px;background:rgba(255,255,255,0.08);border-radius:3px"><div style="height:100%;width:${fCal}%;background:#c97bff;border-radius:3px"></div></div>
            <span style="color:var(--fg)">${opt.fats}g <span style="color:var(--muted)">(${fCal}%)</span></span>
          </div>
        </div>

        <div style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Ingredients</div>
        <ul class="meal-ingredient-list" style="margin-bottom:18px">
          ${ingredients.map(([name, amt]) => `<li><span>${name}</span><span style="color:var(--muted)">${amt}</span></li>`).join('')}
        </ul>

        <div style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Directions</div>
        <ol class="meal-directions-list">
          ${directions.map(d => `<li>${d}</li>`).join('')}
        </ol>
      </div>`;

    mealOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMealModal() {
    mealOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  mealOverlay.addEventListener('click', e => { if (e.target === mealOverlay) closeMealModal(); });
  document.getElementById('modalClose').addEventListener('click', closeMealModal);

  /* ══════════════════════════════════════════════════════════════
     RENDER PHASE — rebuilds meal grid + updates summary
  ══════════════════════════════════════════════════════════════ */
  function renderPhase() {
    selectedMeals = ns.selectedMeals[currentPhase]
      ? [...ns.selectedMeals[currentPhase]]
      : [null, null, null, null];

    /* Update macro summary */
    updateSummary();

    const allMeals = getMeals(currentPhase);
    const grid     = document.getElementById('mealsGrid');
    grid.innerHTML = '';

    allMeals.forEach((opts, mi) => {
      const visible  = opts;
      const baseLen  = baseCount(currentPhase, mi);
      const card     = document.createElement('div');
      card.className = 'meal-card';
      card.dataset.slotCard = mi;
      card.innerHTML = `
        <div class="meal-card-header" style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div class="meal-card-number">Slot ${mi + 1}</div>
            <div class="meal-card-title">${MEAL_TITLES[mi]}</div>
          </div>
          <button class="day-tab add-meal-btn" data-slot="${mi}" style="font-size:11px;padding:4px 12px;white-space:nowrap">+ Custom</button>
        </div>
        <div class="meal-options-scroll" id="nl-${mi}"></div>`;
      grid.appendChild(card);

      const list = card.querySelector(`#nl-${mi}`);
      /* Horizontal drag-scroll track */
      list.style.cursor = 'grab';
      list.style.userSelect = 'none';
      (function initDragScroll(el) {
        let startX = 0, startSL = 0, active = false;
        el.addEventListener('mousedown', e => {
          active = true; startX = e.pageX; startSL = el.scrollLeft;
          el.style.cursor = 'grabbing';
        });
        el.addEventListener('mousemove', e => {
          if (!active) return;
          el.scrollLeft = startSL - (e.pageX - startX);
        });
        ['mouseup', 'mouseleave'].forEach(evt => el.addEventListener(evt, () => {
          active = false; el.style.cursor = 'grab';
        }));
        // Touch: let CSS touch-action:pan-x handle it natively — no JS needed
      }(list));

      visible.forEach((opt, oi) => {
        const isCustom   = oi >= baseLen;
        const customIdx  = oi - baseLen;
        const isSelected = selectedMeals[mi] === oi;

        const item = document.createElement('div');
        item.className = 'meal-option' + (isSelected ? ' selected' : '');
        const catBgColor = opt.category === 'Simple' ? 'rgba(76,175,158,0.13)' : opt.category === 'Premade' ? 'rgba(124,106,247,0.13)' : 'rgba(240,156,58,0.13)';
        item.style.cssText = `flex:0 0 280px;min-height:160px;display:flex;flex-direction:column;justify-content:space-between`;
        item.innerHTML = `
          <div class="meal-option-top" style="background:${catBgColor};margin:-14px -14px 8px;padding:10px 14px;border-radius:10px 10px 0 0;min-height:58px;align-items:flex-start">
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
          </div>`;

        /* Tap card body → select/deselect (ignore if parent was dragged) */
        let pointerDownX = 0;
        item.addEventListener('pointerdown', e => { pointerDownX = e.clientX; });
        item.addEventListener('click', e => {
          if (Math.abs(e.clientX - pointerDownX) > 6) return; /* dragged, not tapped */
          if (e.target.classList.contains('meal-delete-btn')) return;
          selectMeal(mi, oi, item);
          openMealModal(opt);
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
        openAddMealModal(mi);
      });

      /* Assign from Library row */
      const today = new Date().toISOString().slice(0,10);
      const plan  = STATE.data.nutrition.mealPlan[today] || {};
      const SLOT_KEYS = ['breakfast','lunch','dinner','snack'];
      const slotKey   = SLOT_KEYS[mi] || null;
      const assignedMealId = slotKey ? plan[slotKey] : null;
      const assignedMeal   = assignedMealId ? (STATE.data.nutrition.userMeals||[]).find(m=>m.id===assignedMealId) : null;

      const assignRow = document.createElement('div');
      assignRow.style.cssText = 'padding:6px 12px 10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap';
      if (assignedMeal) {
        assignRow.innerHTML = `
          <span style="font-size:11.5px;color:var(--muted)">Library:</span>
          <span style="font-size:12px;font-weight:600;color:var(--accent)">${assignedMeal.name}</span>
          <span class="mm mm-cal">${assignedMeal.totalCalories}kcal</span>
          <button class="day-tab" data-clear-slot="${mi}" style="margin-left:auto;padding:2px 9px;font-size:11px">Change</button>`;
      } else {
        assignRow.innerHTML = `
          <button class="day-tab" data-assign-slot="${mi}" style="padding:3px 10px;font-size:11px;color:var(--muted)">+ Assign from Library</button>`;
      }
      card.appendChild(assignRow);

      card.querySelectorAll('[data-assign-slot]').forEach(btn => {
        btn.addEventListener('click', () => openUserMealPicker(parseInt(btn.dataset.assignSlot)));
      });
      card.querySelectorAll('[data-clear-slot]').forEach(btn => {
        btn.addEventListener('click', () => {
          const sk = (['breakfast','lunch','dinner','snack'])[parseInt(btn.dataset.clearSlot)];
          STATE.clearMealSlot(today, sk);
          renderPhase();
        });
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

    /* Update plan tab phase label */
    const phaseLabel = document.getElementById('planPhaseLabel');
    if (phaseLabel) {
      const phaseColor = ns.calcGoal === 'bulk' ? 'var(--accent3)' : ns.calcGoal === 'cut' ? 'var(--danger)' : 'var(--accent)';
      const phaseStr   = (ns.calcGoal || 'maintain').charAt(0).toUpperCase() + (ns.calcGoal || 'maintain').slice(1);
      phaseLabel.innerHTML = `Active Phase · <span style="color:${phaseColor}">${phaseStr}</span>`;
    }

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
     FOOD PICKER OVERLAY
  ══════════════════════════════════════════════════════════════ */
  function openFoodPicker(onSelect) {
    let pickerQuery    = '';
    let pickerCategory = 'All';
    const CATS = ['All','Proteins','Vegetables','Fruits','Grains & Breads','Dairy','Fats & Oils','Condiments','Snacks','Beverages'];

    let overlay = document.getElementById('foodPickerOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'foodPickerOverlay';
      overlay.className = 'food-picker-overlay';
      overlay.style.display = 'none';
      document.body.appendChild(overlay);
    }

    function renderPicker() {
      const foods = filterFoods(pickerQuery, pickerCategory, 'all');
      overlay.innerHTML = `
        <div class="food-picker-sheet">
          <div class="food-picker-header">
            <span style="font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700">Add Ingredient</span>
            <button id="fpClose" style="background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;padding:0 4px">×</button>
          </div>
          <div style="padding:10px 16px 0;flex-shrink:0">
            <input id="fpSearch" type="text" class="form-input" placeholder="Search foods…" value="${pickerQuery}" style="margin-bottom:8px">
            <div class="food-lib-filter-pills">
              ${CATS.map(c=>`<button class="food-lib-pill${c===pickerCategory?' active':''}" data-cat="${c}">${c}</button>`).join('')}
            </div>
          </div>
          <div class="food-picker-body" id="fpBody">
            ${foods.length === 0 ? `<div style="text-align:center;color:var(--muted);padding:30px 0;font-size:13px">No foods found</div>` :
              foods.map(f => `
                <div class="food-picker-row" data-id="${f.id}">
                  <div style="flex:1;min-width:0">
                    <div class="food-picker-row-name">${f.name}${f.brand?`<span style="font-size:10px;color:var(--muted);margin-left:5px">${f.brand}</span>`:''}</div>
                    <div style="font-size:10.5px;color:var(--muted)">${f.servingSize}${f.servingUnit} · ${f.calories}kcal · ${f.protein}P ${f.carbs}C ${f.fats}F</div>
                  </div>
                  <span class="food-type-badge food-type-${f.type}">${f.type}</span>
                </div>`).join('')}
          </div>
        </div>`;

      overlay.style.display = 'flex';

      overlay.querySelector('#fpClose').addEventListener('click', () => { overlay.style.display='none'; });
      overlay.addEventListener('click', e => { if(e.target===overlay) overlay.style.display='none'; });

      overlay.querySelector('#fpSearch').addEventListener('input', e => {
        pickerQuery = e.target.value;
        renderPicker();
      });

      overlay.querySelectorAll('.food-lib-pill').forEach(btn => {
        btn.addEventListener('click', () => { pickerCategory = btn.dataset.cat; renderPicker(); });
      });

      overlay.querySelectorAll('.food-picker-row').forEach(row => {
        row.addEventListener('click', () => {
          const food = getAllFoods().find(f => f.id === row.dataset.id);
          if (!food) return;
          showQtyPicker(food);
        });
      });
    }

    function showQtyPicker(food) {
      let qty = 1;
      const body = overlay.querySelector('#fpBody');
      body.innerHTML = `
        <div style="padding:16px 0">
          <div style="font-size:15px;font-weight:600;margin-bottom:4px">${food.name}</div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:16px">${food.servingSize}${food.servingUnit} per serving</div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
            <button id="fpQtyMinus" style="width:36px;height:36px;border-radius:50%;border:1.5px solid var(--border);background:var(--surface2);color:var(--text);font-size:18px;cursor:pointer">−</button>
            <span id="fpQtyVal" style="font-family:'Rajdhani',sans-serif;font-size:22px;font-weight:700;min-width:40px;text-align:center">${qty}</span>
            <button id="fpQtyPlus" style="width:36px;height:36px;border-radius:50%;border:1.5px solid var(--border);background:var(--surface2);color:var(--text);font-size:18px;cursor:pointer">+</button>
            <span style="font-size:12px;color:var(--muted)">serving${qty!==1?'s':''}</span>
          </div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:16px" id="fpQtyMacros">
            ${food.calories * qty}kcal · ${food.protein * qty}g P · ${food.carbs * qty}g C · ${food.fats * qty}g F
          </div>
          <button id="fpQtyConfirm" class="phase-btn active" style="width:100%;padding:11px;font-size:14px">Add to Meal</button>
          <button id="fpQtyBack" style="width:100%;padding:8px;margin-top:8px;background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer">← Back</button>
        </div>`;

      function updateQtyDisplay() {
        overlay.querySelector('#fpQtyVal').textContent = qty;
        overlay.querySelector('#fpQtyMacros').textContent =
          `${Math.round(food.calories*qty)}kcal · ${Math.round(food.protein*qty)}g P · ${Math.round(food.carbs*qty)}g C · ${Math.round(food.fats*qty)}g F`;
      }

      overlay.querySelector('#fpQtyMinus').addEventListener('click', () => { if(qty>0.5) { qty=Math.round((qty-0.5)*2)/2; updateQtyDisplay(); } });
      overlay.querySelector('#fpQtyPlus').addEventListener('click',  () => { qty=Math.round((qty+0.5)*2)/2; updateQtyDisplay(); });
      overlay.querySelector('#fpQtyBack').addEventListener('click',  () => renderPicker());
      overlay.querySelector('#fpQtyConfirm').addEventListener('click', () => {
        const entry = {
          foodId:       food.id,
          _name:        food.name,
          _servingSize: food.servingSize,
          _servingUnit: food.servingUnit,
          quantity:     qty,
          calories:     Math.round(food.calories * qty),
          protein:      Math.round(food.protein  * qty),
          carbs:        Math.round(food.carbs    * qty),
          fats:         Math.round(food.fats     * qty),
        };
        overlay.style.display = 'none';
        onSelect(entry);
      });
    }

    renderPicker();
  }

  /* ══════════════════════════════════════════════════════════════
     FOOD LIBRARY (Customize tab)
  ══════════════════════════════════════════════════════════════ */
  function renderFoodLibrary() {
    const el = document.getElementById('foodLibrarySection');
    if (!el) return;
    const CATS = ['All','Proteins','Vegetables','Fruits','Grains & Breads','Dairy','Fats & Oils','Condiments','Snacks','Beverages'];
    const foods = filterFoods(foodLibFilter.query, foodLibFilter.category, foodLibFilter.type);

    el.innerHTML = `
      <div class="section-label" style="margin-bottom:4px">Food Library</div>
      <div style="font-size:11.5px;color:var(--muted);margin-bottom:12px">Browse ingredients used in Meal Builder.</div>
      <div class="food-lib-filter-pills" id="flCatPills">
        ${CATS.map(c=>`<button class="food-lib-pill${c===foodLibFilter.category?' active':''}" data-cat="${c}">${c}</button>`).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <input id="flSearch" type="text" class="form-input" placeholder="Search foods…" value="${foodLibFilter.query}" style="flex:1;margin:0">
        <select id="flType" class="form-input" style="width:auto;padding:6px 10px;margin:0">
          <option value="all"${foodLibFilter.type==='all'?' selected':''}>All</option>
          <option value="whole"${foodLibFilter.type==='whole'?' selected':''}>Whole</option>
          <option value="brand"${foodLibFilter.type==='brand'?' selected':''}>Brand</option>
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
        ${foods.slice(0,40).map(f=>`
          <div class="food-item-card">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:4px">
              <div class="food-item-card-name">${f.name}</div>
              <span class="food-type-badge food-type-${f.type}">${f.type}</span>
            </div>
            ${f.brand?`<div class="food-item-card-sub">${f.brand}</div>`:''}
            <div class="food-item-card-sub">${f.servingSize}${f.servingUnit}</div>
            <div class="food-item-card-macros">
              <span class="mm mm-cal">${f.calories}kcal</span>
              <span class="mm mm-p">${f.protein}P</span>
              <span class="mm mm-c">${f.carbs}C</span>
              <span class="mm mm-f">${f.fats}F</span>
            </div>
            ${f.createdAt?`<button class="meal-delete-btn" data-fid="${f.id}" style="align-self:flex-end;margin-top:2px">× Remove</button>`:''}
          </div>`).join('')}
      </div>
      ${foods.length>40?`<div style="text-align:center;font-size:12px;color:var(--muted);margin-bottom:10px">Showing 40 of ${foods.length} — refine search to narrow results</div>`:''}
      <button id="flAddCustomBtn" class="day-tab" style="width:100%;padding:8px;font-size:12px">+ Add Custom Food</button>
    `;

    el.querySelector('#flSearch').addEventListener('input', e => { foodLibFilter.query = e.target.value; renderFoodLibrary(); });
    el.querySelector('#flType').addEventListener('change', e => { foodLibFilter.type = e.target.value; renderFoodLibrary(); });
    el.querySelectorAll('#flCatPills .food-lib-pill').forEach(btn => {
      btn.addEventListener('click', () => { foodLibFilter.category = btn.dataset.cat; renderFoodLibrary(); });
    });
    el.querySelectorAll('[data-fid]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); STATE.removeFoodItem(btn.dataset.fid); renderFoodLibrary(); });
    });
    el.querySelector('#flAddCustomBtn').addEventListener('click', () => openAddFoodModal());
  }

  function openAddFoodModal() {
    const overlay = document.getElementById('addFoodOverlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    document.getElementById('addFoodForm').reset();
  }
  function closeAddFoodModal() {
    const overlay = document.getElementById('addFoodOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  /* ══════════════════════════════════════════════════════════════
     MEAL BUILDER (Customize tab)
  ══════════════════════════════════════════════════════════════ */
  function renderMealBuilder() {
    const el = document.getElementById('mealBuilderSection');
    if (!el) return;
    const totals = computeMealTotals(builderMeal.ingredients);
    const SLOTS  = ['breakfast','lunch','dinner','snack'];

    el.innerHTML = `
      <div class="section-label" style="margin-bottom:4px">Meal Builder</div>
      <div style="font-size:11.5px;color:var(--muted);margin-bottom:12px">Build named meals from your food library.</div>
      <div class="card" style="margin-bottom:12px">
        <div class="card-body" style="padding:14px 16px">
          <input id="mbName" type="text" class="form-input" placeholder="Meal name (e.g. Chicken Rice Bowl)" value="${builderMeal.name||''}" style="margin-bottom:12px">
          <div style="font-size:11px;color:var(--muted);font-weight:600;margin-bottom:8px;letter-spacing:0.5px;text-transform:uppercase">Meal Slots</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
            ${SLOTS.map(s=>`
              <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:13px">
                <input type="checkbox" data-slot="${s}" ${builderMeal.slots.includes(s)?'checked':''} style="accent-color:var(--accent)">
                ${s.charAt(0).toUpperCase()+s.slice(1)}
              </label>`).join('')}
          </div>
          <div style="font-size:11px;color:var(--muted);font-weight:600;margin-bottom:8px;letter-spacing:0.5px;text-transform:uppercase">Ingredients</div>
          <div id="mbIngredients">
            ${builderMeal.ingredients.length===0
              ? `<div style="text-align:center;color:var(--muted);padding:14px 0;font-size:12px">No ingredients yet — tap Add Ingredient</div>`
              : builderMeal.ingredients.map((ing,i)=>`
                <div class="builder-ingredient-row">
                  <div class="builder-ingredient-name">${ing._name}</div>
                  <div style="font-size:10.5px;color:var(--muted);white-space:nowrap">${ing.calories}kcal</div>
                  <input class="builder-qty-input" type="number" min="0.5" step="0.5" value="${ing.quantity}" data-ing="${i}">
                  <button class="builder-remove-btn" data-remove="${i}">×</button>
                </div>`).join('')}
          </div>
          <button id="mbAddIngredient" class="day-tab" style="width:100%;padding:8px;font-size:12px;margin-top:8px">+ Add Ingredient</button>
          ${builderMeal.ingredients.length>0?`
          <div class="builder-macro-bar">
            <div class="builder-macro-item"><div class="builder-macro-val" style="color:var(--accent3)">${Math.round(totals.calories)}</div><div class="builder-macro-lbl">kcal</div></div>
            <div class="builder-macro-item"><div class="builder-macro-val" style="color:#f5a623">${Math.round(totals.protein)}g</div><div class="builder-macro-lbl">protein</div></div>
            <div class="builder-macro-item"><div class="builder-macro-val" style="color:#42c4f5">${Math.round(totals.carbs)}g</div><div class="builder-macro-lbl">carbs</div></div>
            <div class="builder-macro-item"><div class="builder-macro-val" style="color:#c97bff">${Math.round(totals.fats)}g</div><div class="builder-macro-lbl">fats</div></div>
          </div>`:''}
          <button id="mbSave" class="phase-btn active" style="width:100%;padding:11px;font-size:14px;margin-top:12px">${builderMeal.id?'Update Meal':'Save Meal'} ✓</button>
          ${builderMeal.id?`<button id="mbCancelEdit" style="width:100%;padding:8px;margin-top:6px;background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer">Cancel Edit</button>`:''}
        </div>
      </div>
      <div class="section-label" style="margin-bottom:8px">Saved Meals</div>
      <div id="userMealsList">
        ${(STATE.data.nutrition.userMeals||[]).length===0
          ? `<div style="text-align:center;color:var(--muted);padding:14px 0;font-size:12px">No saved meals yet</div>`
          : (STATE.data.nutrition.userMeals||[]).map(m=>`
            <div class="user-meal-card">
              <div class="user-meal-card-body">
                <div class="user-meal-card-name">${m.name}</div>
                <div class="user-meal-card-slots">
                  ${(m.slots||[]).map(s=>`<span class="slot-badge">${s}</span>`).join('')}
                </div>
                <div class="food-item-card-macros">
                  <span class="mm mm-cal">${m.totalCalories||0}kcal</span>
                  <span class="mm mm-p">${m.totalProtein||0}P</span>
                  <span class="mm mm-c">${m.totalCarbs||0}C</span>
                  <span class="mm mm-f">${m.totalFats||0}F</span>
                </div>
              </div>
              <div class="user-meal-card-actions">
                <button class="day-tab" data-edit="${m.id}" style="padding:4px 10px;font-size:11px">Edit</button>
                <button class="meal-delete-btn" data-del="${m.id}" style="font-size:18px">×</button>
              </div>
            </div>`).join('')}
      </div>
    `;

    el.querySelector('#mbName').addEventListener('input', e => { builderMeal.name = e.target.value; });

    el.querySelectorAll('[data-slot]').forEach(cb => {
      cb.addEventListener('change', () => {
        const slot = cb.dataset.slot;
        if (cb.checked) { if (!builderMeal.slots.includes(slot)) builderMeal.slots.push(slot); }
        else { builderMeal.slots = builderMeal.slots.filter(s=>s!==slot); }
      });
    });

    el.querySelectorAll('.builder-qty-input').forEach(inp => {
      inp.addEventListener('change', () => {
        const i    = parseInt(inp.dataset.ing);
        const food = getAllFoods().find(f => f.id === builderMeal.ingredients[i].foodId);
        const qty  = parseFloat(inp.value) || 1;
        if (food) {
          builderMeal.ingredients[i].quantity = qty;
          builderMeal.ingredients[i].calories = Math.round(food.calories * qty);
          builderMeal.ingredients[i].protein  = Math.round(food.protein  * qty);
          builderMeal.ingredients[i].carbs    = Math.round(food.carbs    * qty);
          builderMeal.ingredients[i].fats     = Math.round(food.fats     * qty);
        }
        renderMealBuilder();
      });
    });

    el.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        builderMeal.ingredients.splice(parseInt(btn.dataset.remove), 1);
        renderMealBuilder();
      });
    });

    el.querySelector('#mbAddIngredient').addEventListener('click', () => {
      openFoodPicker(entry => {
        builderMeal.ingredients.push(entry);
        renderMealBuilder();
      });
    });

    el.querySelector('#mbSave').addEventListener('click', () => {
      const name = (el.querySelector('#mbName').value || builderMeal.name || '').trim();
      if (!name) { alert('Please enter a meal name.'); return; }
      if (builderMeal.ingredients.length === 0) { alert('Please add at least one ingredient.'); return; }
      const totals = computeMealTotals(builderMeal.ingredients);
      const meal = {
        ...builderMeal,
        name,
        totalCalories: Math.round(totals.calories),
        totalProtein:  Math.round(totals.protein),
        totalCarbs:    Math.round(totals.carbs),
        totalFats:     Math.round(totals.fats),
      };
      STATE.saveUserMeal(meal);
      builderMeal = { name:'', slots:[], ingredients:[] };
      renderMealBuilder();
    });

    const cancelBtn = el.querySelector('#mbCancelEdit');
    if (cancelBtn) cancelBtn.addEventListener('click', () => { builderMeal = { name:'', slots:[], ingredients:[] }; renderMealBuilder(); });

    el.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const meal = (STATE.data.nutrition.userMeals||[]).find(m=>m.id===btn.dataset.edit);
        if (meal) { builderMeal = { ...meal, ingredients: [...meal.ingredients] }; renderMealBuilder(); }
      });
    });

    el.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => { STATE.removeUserMeal(btn.dataset.del); renderMealBuilder(); });
    });
  }

  /* ══════════════════════════════════════════════════════════════
     USER MEAL PICKER (assign to plan slot)
  ══════════════════════════════════════════════════════════════ */
  function openUserMealPicker(slotIdx) {
    const SLOT_KEYS = ['breakfast','lunch','dinner','snack'];
    const slotKey   = SLOT_KEYS[slotIdx];
    const today     = new Date().toISOString().slice(0,10);
    const meals     = (STATE.data.nutrition.userMeals||[]).filter(m => !m.slots || m.slots.length===0 || m.slots.includes(slotKey));

    let overlay = document.getElementById('userMealPickerOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'userMealPickerOverlay';
      overlay.className = 'food-picker-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="food-picker-sheet">
        <div class="food-picker-header">
          <span style="font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700">Assign to ${slotKey.charAt(0).toUpperCase()+slotKey.slice(1)}</span>
          <button id="umpClose" style="background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;padding:0 4px">×</button>
        </div>
        <div class="food-picker-body">
          ${meals.length===0
            ? `<div style="text-align:center;color:var(--muted);padding:30px 0;font-size:13px">No saved meals yet.<br>Build meals in the Customize tab.</div>`
            : meals.map(m=>`
              <div class="food-picker-row" data-meal="${m.id}" style="flex-direction:column;align-items:flex-start;gap:4px">
                <div style="font-weight:600;font-size:13px">${m.name}</div>
                <div style="display:flex;gap:5px">
                  <span class="mm mm-cal">${m.totalCalories}kcal</span>
                  <span class="mm mm-p">${m.totalProtein}P</span>
                  <span class="mm mm-c">${m.totalCarbs}C</span>
                  <span class="mm mm-f">${m.totalFats}F</span>
                </div>
              </div>`).join('')}
        </div>
      </div>`;

    overlay.style.display = 'flex';
    overlay.querySelector('#umpClose').addEventListener('click', () => { overlay.style.display='none'; });
    overlay.addEventListener('click', e => { if(e.target===overlay) overlay.style.display='none'; });
    overlay.querySelectorAll('[data-meal]').forEach(row => {
      row.addEventListener('click', () => {
        STATE.assignMealToSlot(today, slotKey, row.dataset.meal);
        overlay.style.display = 'none';
        renderPhase();
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════
     MACRO CALCULATOR (Customize tab)
  ══════════════════════════════════════════════════════════════ */
  let ntCalcWeight     = ns.calcWeight     || 175;
  let ntCalcHeight     = ns.calcHeight     || 70;
  let ntCalcGoal       = ns.calcGoal       || 'maintain';
  let ntCalcActivity   = ns.calcActivity   || 14;
  let ntCurrentBodyFat = ns.currentBodyFat || 18;

  function fmtHeight(inches) {
    return `${Math.floor(inches / 12)}'${inches % 12}"`;
  }
  function calcBMI(weightLbs, heightIn) {
    return heightIn > 0 ? (weightLbs / (heightIn * heightIn)) * 703 : 0;
  }

  /* Pre-populate sliders */
  inner.querySelector('#ntCalcWeight').value = ntCalcWeight;
  inner.querySelector('#ntCalcWeightDisplay').textContent = ntCalcWeight + ' lbs';
  inner.querySelector('#ntCalcHeight').value = ntCalcHeight;
  inner.querySelector('#ntCalcHeightDisplay').textContent = fmtHeight(ntCalcHeight);
  inner.querySelector('#ntCurrentBodyFat').value = ntCurrentBodyFat;
  inner.querySelector('#ntCurrentBodyFatDisplay').textContent = ntCurrentBodyFat + '%';
  inner.querySelectorAll('#ntCalcGoalToggle [data-goal]').forEach(b => {
    b.classList.toggle('active', b.dataset.goal === ntCalcGoal);
  });
  inner.querySelectorAll('#ntCalcActivityToggle [data-activity]').forEach(b => {
    b.classList.toggle('active', parseFloat(b.dataset.activity) === ntCalcActivity);
  });

  function renderPhaseSuggestion() {
    const el  = document.getElementById('ntPhaseSuggestion');
    if (!el) return;
    const bmi = calcBMI(ntCalcWeight, ntCalcHeight);
    const bf  = ntCurrentBodyFat;
    let phase = null, reason = '';

    if (bmi >= 25 && bf <= 15) {
      /* Upper BMI but lean — likely muscular, don't cut */
      phase  = 'maintain';
      reason = `BMI ${bmi.toFixed(1)} but ${bf}% body fat — you're likely muscular. Maintain to preserve mass.`;
    } else if (bf >= 20 || bmi >= 27) {
      phase  = 'cut';
      reason = bmi >= 27
        ? `BMI ${bmi.toFixed(1)} and ${bf}% body fat — a cut phase will help reduce excess fat.`
        : `${bf}% body fat — a cut is recommended to get back into a leaner range.`;
    } else if (bmi < 18.5 || bf <= 10) {
      phase  = 'bulk';
      reason = bmi < 18.5
        ? `BMI ${bmi.toFixed(1)} — you're underweight. A bulk phase will help you build size and strength.`
        : `${bf}% body fat — you're very lean and in a great position to bulk effectively.`;
    }

    if (!phase) { el.style.display = 'none'; return; }
    const isCurrent  = ntCalcGoal === phase;
    const phaseColor = phase === 'cut' ? 'var(--danger)' : phase === 'bulk' ? 'var(--accent3)' : 'var(--accent)';
    el.style.display = 'block';
    el.innerHTML = `<span style="color:${phaseColor};font-weight:700">${phase.charAt(0).toUpperCase() + phase.slice(1)} suggested</span>${isCurrent ? ' ✓' : ''} — ${reason}`;
  }

  function renderNtCalcResults() {
    const m = computeMacros(ntCalcWeight, ntCalcGoal, ntCalcActivity);
    const pPct = Math.round((m.protein * 4 / m.calories) * 100);
    const cPct = Math.round((m.carbs   * 4 / m.calories) * 100);
    const fPct = Math.round((m.fats    * 9 / m.calories) * 100);
    inner.querySelector('#ntCalcResults').innerHTML = `
      <div class="macro-calc-main">
        <div class="macro-calc-calories">
          <span class="macro-calc-cal-val">${m.calories.toLocaleString()}</span>
          <span class="macro-calc-cal-unit">kcal/day</span>
        </div>
      </div>
      <div class="macro-calc-breakdown">
        <div class="macro-calc-macro" style="--mc:${pPct}%;--col:#f5a623">
          <div class="macro-calc-bar"><div class="macro-calc-bar-fill"></div></div>
          <div class="macro-calc-val">${m.protein}g</div>
          <div class="macro-calc-lbl">Protein (${pPct}%)</div>
        </div>
        <div class="macro-calc-macro" style="--mc:${cPct}%;--col:#42c4f5">
          <div class="macro-calc-bar"><div class="macro-calc-bar-fill"></div></div>
          <div class="macro-calc-val">${m.carbs}g</div>
          <div class="macro-calc-lbl">Carbs (${cPct}%)</div>
        </div>
        <div class="macro-calc-macro" style="--mc:${fPct}%;--col:#c97bff">
          <div class="macro-calc-bar"><div class="macro-calc-bar-fill"></div></div>
          <div class="macro-calc-val">${m.fats}g</div>
          <div class="macro-calc-lbl">Fats (${fPct}%)</div>
        </div>
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:12px;line-height:1.5">
        TDEE ≈ ${m.tdee.toLocaleString()} kcal · ${ntCalcGoal === 'bulk' ? '+300 surplus' : ntCalcGoal === 'cut' ? '−500 deficit' : 'maintenance'}
        · BMI ${calcBMI(ntCalcWeight, ntCalcHeight).toFixed(1)}
      </div>`;
  }

  function ntSaveAndRender() {
    currentPhase = ntCalcGoal;
    STATE.setNutritionPhase(currentPhase);
    STATE.setCalcInputs(ntCalcWeight, ntCalcGoal, ntCalcActivity,
      undefined, undefined, ntCurrentBodyFat, undefined, ntCalcHeight);
    renderNtCalcResults();
    renderPhaseSuggestion();
    updateSummary();
    if (document.getElementById('mealsGrid')) renderPhase();
  }

  inner.querySelector('#ntCalcWeight').addEventListener('input', e => {
    ntCalcWeight = parseInt(e.target.value);
    inner.querySelector('#ntCalcWeightDisplay').textContent = ntCalcWeight + ' lbs';
    ntSaveAndRender();
  });
  inner.querySelector('#ntCalcHeight').addEventListener('input', e => {
    ntCalcHeight = parseInt(e.target.value);
    inner.querySelector('#ntCalcHeightDisplay').textContent = fmtHeight(ntCalcHeight);
    ntSaveAndRender();
  });
  inner.querySelector('#ntCurrentBodyFat').addEventListener('input', e => {
    ntCurrentBodyFat = parseFloat(e.target.value);
    inner.querySelector('#ntCurrentBodyFatDisplay').textContent = ntCurrentBodyFat + '%';
    ntSaveAndRender();
  });

  inner.querySelectorAll('#ntCalcGoalToggle [data-goal]').forEach(btn => {
    btn.addEventListener('click', () => {
      inner.querySelectorAll('#ntCalcGoalToggle [data-goal]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ntCalcGoal = btn.dataset.goal;
      ntSaveAndRender();
    });
  });
  inner.querySelectorAll('#ntCalcActivityToggle [data-activity]').forEach(btn => {
    btn.addEventListener('click', () => {
      inner.querySelectorAll('#ntCalcActivityToggle [data-activity]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ntCalcActivity = parseFloat(btn.dataset.activity);
      ntSaveAndRender();
    });
  });
  renderNtCalcResults();
  renderPhaseSuggestion();

  /* ── Nutrition principles ── */
  const principleHTML = (APP_DATA.healthPrinciples?.nutrition || []).map(p => `
    <div style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
      <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;color:var(--accent);margin-bottom:4px">${p.title}</div>
      <div style="font-size:12px;color:rgba(226,234,242,0.72);line-height:1.6">${p.body}</div>
    </div>`).join('');
  document.getElementById('nutritionPrinciples').innerHTML     = principleHTML;
  document.getElementById('nutritionPrinciplesPlan').innerHTML = principleHTML;

  renderPhase();
  renderMealBuilder();
  renderFoodLibrary();
});
