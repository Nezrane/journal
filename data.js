/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  KOLTYN OS — data.js                                            ║
 * ║  Single source of truth for all personal data.                  ║
 * ║                                                                  ║
 * ║  To make this app yours, edit the values in this file only.     ║
 * ║  Do not touch any other JS files unless changing app behaviour. ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

window.APP_DATA = {

  /* ── Profile ─────────────────────────────────────────────────── */
  profile: {
    name:       'Koltyn',
    appTitle:   'Koltyn OS',
    appSubtitle:'Life Operating System',
    navGoal:    '$50K MRR · 200 lbs · 15% BF',
    northStar:  'Build Envosta to $50K MRR · Get to 200 lbs and 15% body fat · Unlock Press to Handstand and Muscle Up',
    northStarPillars: ['$50K MRR', '200 lbs · 15% BF', 'Press to Handstand', 'Muscle Up'],
  },

  /* ── Dashboard ───────────────────────────────────────────────── */
  dashboard: {
    stats: [
      { label:'Body Weight', value:'176', unit:'lbs', note:'Goal: 200 lbs' },
      { label:'Body Fat',    value:'16',  unit:'%',   note:'Goal: 15%' },
      { label:'Envosta MRR', value:'$0',  unit:'',    note:'Goal: $50K/mo' },
      { label:'Songs Ready', value:'8',   unit:'',    note:'Setlist: 7 songs' },
    ],
    morningHabits: [
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
    ],
    todaysFocus: [
      { title:'🏗️ Business', detail:"Build Envosta — talk to users, ship something" },
      { title:'💪 Workout',  detail:"Recovery Phase — check workout page for today's day" },
      { title:'🎸 Creative', detail:'30 min practice — fingerpicking + vocals' },
      { title:'📚 Growth',   detail:'15 pages before bed' },
    ],
  },

  /* ── Vision ──────────────────────────────────────────────────── */
  vision: {
    overarchingGoal: 'Build Envosta to $50K MRR · Get to 200 lbs and 15% body fat · Unlock Press to Handstand and Muscle Up',
    goalPillars: ['$50K MRR', '200 lbs', '15% BF', 'Press to Handstand', 'Muscle Up'],
    areas: [
      {
        icon:'💼', name:'Career & Business',
        dream:  ['Envosta is a $50K MRR SaaS company running mostly without me','Known as the founder who built something real from scratch','Multiple successful ventures — not just one'],
        oneYear:['Envosta at $10K MRR (Stage 1 graduation)','First 50 paying customers','Repeatable sales process in place'],
        focus:  ['Build and ship v1 of Envosta','Talk to 10 target users','Close first 3 paying customers manually'],
      },
      {
        icon:'💰', name:'Finance & Wealth',
        dream:  ['Financially free — money works for me, not the other way','Index fund portfolio generating meaningful passive income','Never worry about money again — abundance mindset fully embodied'],
        oneYear:['Envosta paying all personal expenses','Consistent monthly investment into index funds','Emergency fund fully stocked (6 months expenses)'],
        focus:  ['Separate business and personal finances','Set up automatic index fund DCA','Track MRR and net worth weekly'],
      },
      {
        icon:'💪', name:'Health & Fitness',
        dream:  ['200 lbs, 15% body fat — athletic, powerful, lean','Press to handstand and muscle up achieved','Feel the best I\'ve ever felt — energy, strength, mobility'],
        oneYear:['190 lbs, 16% body fat — clear visual progress','Handstand holds for 10 seconds','Consistent Jeff Nippard PPL — no missed weeks'],
        focus:  ['Current: 176 lbs, 16% BF — add clean bulk calories','Complete full Recovery Phase (Weeks 1–5) with no skipped sessions','Nail morning routine: stretch + 10 pull-ups + 30 push-ups daily'],
      },
      {
        icon:'❤️', name:'Relationships & Family',
        dream:  ['Deep, authentic relationships — a small circle of people who truly know me','The kind of partner you don\'t settle for — when it\'s right it\'s obvious','Strong family bonds — present and intentional'],
        oneYear:['Invest in existing friendships deliberately — plan something quarterly','Be fully present when with family — phone down, eyes up','Know what I actually value in a partner (write it out)'],
        focus:  ['Schedule one intentional social thing per week','Call family member each week','Be more present — notice when I\'m distracted and course-correct'],
      },
      {
        icon:'🧠', name:'Personal Growth',
        dream:  ['Think clearly, decide quickly, execute consistently — uncommon self-mastery','Identity: builder, performer, athlete — not just one thing','Read 50+ books — ideas compound just like money'],
        oneYear:['Read 12 books — one per month','Daily journalling habit — 5 min minimum','Meditation practice — 10 min daily'],
        focus:  ['Morning review: journal + vision review + priorities for the day','Read 15 pages before bed every night','Write down 3 things I\'m grateful for each morning'],
      },
      {
        icon:'🎸', name:'Music & Creativity',
        dream:  ['Original songs that make people feel something real','Known locally as the guy worth watching — packed rooms','Album recorded — even if just for me'],
        oneYear:['10 songs ready to perform — covers + originals','5 original songs with demos recorded','Regular bar gig rotation — monthly at minimum'],
        focus:  ['Daily practice: 30 min minimum — fingerpicking + vocals + writing','Add one new song to setlist per month','Record a voice memo demo of "Rodeo Bones" this month'],
      },
      {
        icon:'✈️', name:'Lifestyle & Adventure',
        dream:  ['Surf good waves in multiple countries — Indo, Portugal, Central America','Horses as part of life — riding regularly, maybe own one day','Motorcycle trip across a country — no plan, just ride'],
        oneYear:['One surf trip — even a domestic one counts','Ride a horse at least once','Plan the motorcycle route even if not executing yet'],
        focus:  ['Research one surf destination — cost, season, flights','Find a local spot to ride horses — one session this quarter','Take the motorcycle out more — rides, not just errands'],
      },
    ],
  },

  /* ── Nutrition ───────────────────────────────────────────────── */
  nutrition: {
    phases: {
      bulk:     { name:'Bulk',     calories:3850, protein:241, carbs:481, fats:107 },
      maintain: { name:'Maintain', calories:2850, protein:214, carbs:285, fats:95  },
      cut:      { name:'Cut',      calories:2350, protein:206, carbs:176, fats:91  },
    },
    mealTitles: ['Meal 1 — Breakfast','Meal 2 — Lunch','Meal 3 — Dinner','Meal 4 — Evening'],
    meals: {
      bulk: [
        [{name:"Oat & Egg White Power Bowl",category:"Simple",cuisine:"American",calories:875,protein:55,carbs:109,fats:24},{name:"Banana Greek Yogurt Parfait",category:"Simple",cuisine:"Mediterranean",calories:875,protein:55,carbs:109,fats:24},{name:"Whole Wheat Chicken Breakfast Wrap",category:"Simple",cuisine:"Mexican",calories:875,protein:55,carbs:109,fats:24},{name:"Frozen Breakfast Burrito Batch",category:"Premade",cuisine:"Mexican",calories:875,protein:55,carbs:109,fats:24},{name:"Batch Egg Muffin Cups",category:"Premade",cuisine:"American",calories:875,protein:55,carbs:109,fats:24},{name:"Prepped Overnight Oats with Whey",category:"Premade",cuisine:"American",calories:875,protein:55,carbs:109,fats:24},{name:"Shakshuka with Whole Wheat Pita",category:"Gourmet",cuisine:"Middle Eastern",calories:875,protein:55,carbs:109,fats:24},{name:"Tamagoyaki with Brown Rice",category:"Gourmet",cuisine:"Japanese",calories:875,protein:55,carbs:109,fats:24},{name:"Huevos Rancheros with Black Beans",category:"Gourmet",cuisine:"Mexican",calories:875,protein:55,carbs:109,fats:24},{name:"Greek Egg Scramble with Feta & Pita",category:"Gourmet",cuisine:"Greek",calories:875,protein:55,carbs:109,fats:24}],
        [{name:"Chicken Rice & Avocado Bowl",category:"Simple",cuisine:"American",calories:1100,protein:69,carbs:138,fats:31},{name:"Tuna Whole Wheat Pasta",category:"Simple",cuisine:"Italian",calories:1100,protein:69,carbs:138,fats:31},{name:"Turkey & Sweet Potato Plate",category:"Simple",cuisine:"American",calories:1100,protein:69,carbs:138,fats:31},{name:"Batch Beef & Brown Rice Bowls",category:"Premade",cuisine:"American",calories:1100,protein:69,carbs:138,fats:31},{name:"Frozen Chicken Fried Rice Prep",category:"Premade",cuisine:"Asian",calories:1100,protein:69,carbs:138,fats:31},{name:"Meal-Prep Salmon & Quinoa Boxes",category:"Premade",cuisine:"Mediterranean",calories:1100,protein:69,carbs:138,fats:31},{name:"Bibimbap with Beef & Egg",category:"Gourmet",cuisine:"Korean",calories:1100,protein:69,carbs:138,fats:31},{name:"Chicken Puttanesca over Spaghetti",category:"Gourmet",cuisine:"Italian",calories:1100,protein:69,carbs:138,fats:31},{name:"Lamb Kofta with Bulgur & Tzatziki",category:"Gourmet",cuisine:"Greek",calories:1100,protein:69,carbs:138,fats:31},{name:"Chicken Tikka Masala with Basmati",category:"Gourmet",cuisine:"Indian",calories:1100,protein:69,carbs:138,fats:31}],
        [{name:"Beef & Brown Rice Power Plate",category:"Simple",cuisine:"American",calories:1100,protein:69,carbs:138,fats:31},{name:"Salmon Sweet Potato & Broccoli",category:"Simple",cuisine:"American",calories:1100,protein:69,carbs:138,fats:31},{name:"Cottage Cheese Pasta Bake",category:"Simple",cuisine:"Italian",calories:1100,protein:69,carbs:138,fats:31},{name:"Prepped Turkey Meatball Subs",category:"Premade",cuisine:"Italian",calories:1100,protein:69,carbs:138,fats:31},{name:"Frozen Baked Ziti Prep",category:"Premade",cuisine:"Italian",calories:1100,protein:69,carbs:138,fats:31},{name:"Batch Pulled Chicken & Rice Bowls",category:"Premade",cuisine:"American",calories:1100,protein:69,carbs:138,fats:31},{name:"Pork Bulgogi with Steamed Rice",category:"Gourmet",cuisine:"Korean",calories:1100,protein:69,carbs:138,fats:31},{name:"Chicken Souvlaki with Rice Pilaf",category:"Gourmet",cuisine:"Greek",calories:1100,protein:69,carbs:138,fats:31},{name:"Thai Basil Pork with Jasmine Rice",category:"Gourmet",cuisine:"Thai",calories:1100,protein:69,carbs:138,fats:31},{name:"Grilled Swordfish with Romesco & Potatoes",category:"Gourmet",cuisine:"Spanish",calories:1100,protein:69,carbs:138,fats:31}],
        [{name:"Cottage Cheese Toast & Banana",category:"Simple",cuisine:"American",calories:775,protein:48,carbs:96,fats:21},{name:"Greek Yogurt Protein Bowl",category:"Simple",cuisine:"Greek",calories:775,protein:48,carbs:96,fats:21},{name:"Peanut Butter Oat Protein Smoothie",category:"Simple",cuisine:"American",calories:775,protein:48,carbs:96,fats:21},{name:"Prepped Protein Pancake Stacks",category:"Premade",cuisine:"American",calories:775,protein:48,carbs:96,fats:21},{name:"Batch Lentil & Chicken Soup",category:"Premade",cuisine:"Middle Eastern",calories:775,protein:48,carbs:96,fats:21},{name:"Frozen Beef & Potato Shepherd Prep",category:"Premade",cuisine:"British",calories:775,protein:48,carbs:96,fats:21},{name:"Mushroom Ricotta Crostini",category:"Gourmet",cuisine:"Italian",calories:775,protein:48,carbs:96,fats:21},{name:"Smashed Chickpea Flatbread",category:"Gourmet",cuisine:"Middle Eastern",calories:775,protein:48,carbs:96,fats:21},{name:"Miso Soup with Tofu & Rice Crackers",category:"Gourmet",cuisine:"Japanese",calories:775,protein:48,carbs:96,fats:21},{name:"Patatas Bravas with Aioli & Egg",category:"Gourmet",cuisine:"Spanish",calories:775,protein:48,carbs:96,fats:21}],
      ],
      maintain: [
        [{name:"Egg White Omelette with Whole Toast",category:"Simple",cuisine:"American",calories:600,protein:45,carbs:60,fats:20},{name:"Greek Yogurt & Berry Bowl",category:"Simple",cuisine:"Greek",calories:600,protein:45,carbs:60,fats:20},{name:"Chicken Avocado Rice Cake Stack",category:"Simple",cuisine:"American",calories:600,protein:45,carbs:60,fats:20},{name:"Prepped Spinach Egg Muffins",category:"Premade",cuisine:"Mediterranean",calories:600,protein:45,carbs:60,fats:20},{name:"Batch Overnight Protein Oats",category:"Premade",cuisine:"American",calories:600,protein:45,carbs:60,fats:20},{name:"Frozen Turkey Breakfast Patties & Toast",category:"Premade",cuisine:"American",calories:600,protein:45,carbs:60,fats:20},{name:"Turkish Menemen with Pita",category:"Gourmet",cuisine:"Turkish",calories:600,protein:45,carbs:60,fats:20},{name:"Smoked Salmon Blini",category:"Gourmet",cuisine:"Russian",calories:600,protein:45,carbs:60,fats:20},{name:"Spanish Tortilla with Salad",category:"Gourmet",cuisine:"Spanish",calories:600,protein:45,carbs:60,fats:20},{name:"Japanese Tamago Don",category:"Gourmet",cuisine:"Japanese",calories:600,protein:45,carbs:60,fats:20}],
        [{name:"Grilled Chicken & Quinoa Bowl",category:"Simple",cuisine:"Mediterranean",calories:800,protein:60,carbs:80,fats:27},{name:"Tuna Brown Rice & Edamame Bowl",category:"Simple",cuisine:"Japanese",calories:800,protein:60,carbs:80,fats:27},{name:"Turkey & Sweet Potato Hash",category:"Simple",cuisine:"American",calories:800,protein:60,carbs:80,fats:27},{name:"Batch Grilled Chicken & Farro Boxes",category:"Premade",cuisine:"Mediterranean",calories:800,protein:60,carbs:80,fats:27},{name:"Frozen Salmon Quinoa Prep",category:"Premade",cuisine:"American",calories:800,protein:60,carbs:80,fats:27},{name:"Prepped Chicken & Lentil Stew",category:"Premade",cuisine:"Middle Eastern",calories:800,protein:60,carbs:80,fats:27},{name:"Korean Doenjang Jjigae with Rice",category:"Gourmet",cuisine:"Korean",calories:800,protein:60,carbs:80,fats:27},{name:"Moroccan Chicken Tagine with Couscous",category:"Gourmet",cuisine:"Moroccan",calories:800,protein:60,carbs:80,fats:27},{name:"Pasta e Fagioli with Chicken",category:"Gourmet",cuisine:"Italian",calories:800,protein:60,carbs:80,fats:27},{name:"Thai Green Curry Chicken & Rice",category:"Gourmet",cuisine:"Thai",calories:800,protein:60,carbs:80,fats:27}],
        [{name:"Baked Salmon with Whole Grain Rice",category:"Simple",cuisine:"American",calories:800,protein:60,carbs:80,fats:27},{name:"Steak Strip & Potato Bowl",category:"Simple",cuisine:"American",calories:800,protein:60,carbs:80,fats:27},{name:"Shrimp & Brown Rice Stir-Fry",category:"Simple",cuisine:"Asian",calories:800,protein:60,carbs:80,fats:27},{name:"Batch Turkey Bolognese & Pasta",category:"Premade",cuisine:"Italian",calories:800,protein:60,carbs:80,fats:27},{name:"Frozen Chicken & Vegetable Curry Prep",category:"Premade",cuisine:"Indian",calories:800,protein:60,carbs:80,fats:27},{name:"Prepped Beef & Buckwheat Bowls",category:"Premade",cuisine:"Eastern European",calories:800,protein:60,carbs:80,fats:27},{name:"Chicken Piccata with Orzo",category:"Gourmet",cuisine:"Italian",calories:800,protein:60,carbs:80,fats:27},{name:"Pork Tenderloin with Apple & Lentils",category:"Gourmet",cuisine:"French",calories:800,protein:60,carbs:80,fats:27},{name:"Grilled Branzino with Fregola",category:"Gourmet",cuisine:"Mediterranean",calories:800,protein:60,carbs:80,fats:27},{name:"Adana Kebab with Bulgur Pilaf",category:"Gourmet",cuisine:"Turkish",calories:800,protein:60,carbs:80,fats:27}],
        [{name:"Cottage Cheese & Fruit Bowl",category:"Simple",cuisine:"American",calories:650,protein:49,carbs:65,fats:21},{name:"Protein Smoothie with Oat Base",category:"Simple",cuisine:"American",calories:650,protein:49,carbs:65,fats:21},{name:"Hard Boiled Eggs & Whole Grain Crackers",category:"Simple",cuisine:"American",calories:650,protein:49,carbs:65,fats:21},{name:"Prepped White Bean & Chicken Soup",category:"Premade",cuisine:"Italian",calories:650,protein:49,carbs:65,fats:21},{name:"Frozen Turkey & Barley Casserole",category:"Premade",cuisine:"American",calories:650,protein:49,carbs:65,fats:21},{name:"Batch Tofu & Soba Boxes",category:"Premade",cuisine:"Japanese",calories:650,protein:49,carbs:65,fats:21},{name:"Labneh Flatbread with Za'atar",category:"Gourmet",cuisine:"Middle Eastern",calories:650,protein:49,carbs:65,fats:21},{name:"Catalan Chickpea & Spinach",category:"Gourmet",cuisine:"Spanish",calories:650,protein:49,carbs:65,fats:21},{name:"Tteok-Guk (Rice Cake Soup)",category:"Gourmet",cuisine:"Korean",calories:650,protein:49,carbs:65,fats:21},{name:"Grilled Halloumi & Lentil Plate",category:"Gourmet",cuisine:"Greek",calories:650,protein:49,carbs:65,fats:21}],
      ],
      cut: [
        [{name:"Egg White Scramble with Rye Toast",category:"Simple",cuisine:"American",calories:500,protein:44,carbs:37,fats:19},{name:"Plain Greek Yogurt & Apple Slices",category:"Simple",cuisine:"Greek",calories:500,protein:44,carbs:37,fats:19},{name:"Tuna Rice Cake & Cucumber Stack",category:"Simple",cuisine:"American",calories:500,protein:44,carbs:37,fats:19},{name:"Batch Lean Turkey Egg Muffins",category:"Premade",cuisine:"American",calories:500,protein:44,carbs:37,fats:19},{name:"Prepped Smoked Salmon & Oat Cups",category:"Premade",cuisine:"Scandinavian",calories:500,protein:44,carbs:37,fats:19},{name:"Frozen Egg White Frittata Squares",category:"Premade",cuisine:"Italian",calories:500,protein:44,carbs:37,fats:19},{name:"Steamed Tofu & Edamame Rice Bowl",category:"Gourmet",cuisine:"Japanese",calories:500,protein:44,carbs:37,fats:19},{name:"Lemon Herb Cod with Roasted Veg",category:"Gourmet",cuisine:"Mediterranean",calories:500,protein:44,carbs:37,fats:19},{name:"White Bean Shakshuka",category:"Gourmet",cuisine:"Middle Eastern",calories:500,protein:44,carbs:37,fats:19},{name:"Korean Sundubu Jjigae",category:"Gourmet",cuisine:"Korean",calories:500,protein:44,carbs:37,fats:19}],
        [{name:"Chicken Breast & Roasted Veg",category:"Simple",cuisine:"American",calories:650,protein:57,carbs:48,fats:25},{name:"Shrimp & Cauliflower Rice Bowl",category:"Simple",cuisine:"Asian",calories:650,protein:57,carbs:48,fats:25},{name:"Turkey Lettuce Wraps & Quinoa",category:"Simple",cuisine:"American",calories:650,protein:57,carbs:48,fats:25},{name:"Batch Grilled Chicken & Lentil Prep",category:"Premade",cuisine:"Mediterranean",calories:650,protein:57,carbs:48,fats:25},{name:"Frozen Salmon Patties & Salad",category:"Premade",cuisine:"American",calories:650,protein:57,carbs:48,fats:25},{name:"Prepped Turkey Meatball Zucchini Bowls",category:"Premade",cuisine:"Italian",calories:650,protein:57,carbs:48,fats:25},{name:"Vietnamese Grilled Pork Vermicelli Bowl",category:"Gourmet",cuisine:"Vietnamese",calories:650,protein:57,carbs:48,fats:25},{name:"Grilled Chicken Paillard with Arugula",category:"Gourmet",cuisine:"Italian",calories:650,protein:57,carbs:48,fats:25},{name:"Ceviche with Corn & Sweet Potato",category:"Gourmet",cuisine:"Peruvian",calories:650,protein:57,carbs:48,fats:25},{name:"Chicken Souvlaki with Roasted Cauliflower",category:"Gourmet",cuisine:"Greek",calories:650,protein:57,carbs:48,fats:25}],
        [{name:"Baked Cod & Steamed Broccoli & Rice",category:"Simple",cuisine:"American",calories:650,protein:57,carbs:48,fats:25},{name:"Lean Beef Strip & Veggie Stir-Fry",category:"Simple",cuisine:"Asian",calories:650,protein:57,carbs:48,fats:25},{name:"Egg Whites & Black Bean Burrito",category:"Simple",cuisine:"Mexican",calories:650,protein:57,carbs:48,fats:25},{name:"Prepped Tuna & Chickpea Bowls",category:"Premade",cuisine:"Mediterranean",calories:650,protein:57,carbs:48,fats:25},{name:"Batch Chicken & White Bean Soup",category:"Premade",cuisine:"Italian",calories:650,protein:57,carbs:48,fats:25},{name:"Frozen Turkey Stuffed Pepper Prep",category:"Premade",cuisine:"Mexican",calories:650,protein:57,carbs:48,fats:25},{name:"Chicken Posole Verde",category:"Gourmet",cuisine:"Mexican",calories:650,protein:57,carbs:48,fats:25},{name:"Soy-Ginger Steamed Sea Bass",category:"Gourmet",cuisine:"Chinese",calories:650,protein:57,carbs:48,fats:25},{name:"Turkish Chicken Kofte with Tabbouleh",category:"Gourmet",cuisine:"Turkish",calories:650,protein:57,carbs:48,fats:25},{name:"Branzino a la Plancha with Asparagus",category:"Gourmet",cuisine:"Spanish",calories:650,protein:57,carbs:48,fats:25}],
        [{name:"Cottage Cheese & Cucumber Plate",category:"Simple",cuisine:"American",calories:550,protein:48,carbs:43,fats:22},{name:"Tuna & Whole Grain Crispbread",category:"Simple",cuisine:"Scandinavian",calories:550,protein:48,carbs:43,fats:22},{name:"Chicken Breast & Chickpea Salad",category:"Simple",cuisine:"Mediterranean",calories:550,protein:48,carbs:43,fats:22},{name:"Batch Lean Egg & Veggie Wraps",category:"Premade",cuisine:"American",calories:550,protein:48,carbs:43,fats:22},{name:"Prepped Turkey & Lentil Stuffed Zucchini",category:"Premade",cuisine:"Middle Eastern",calories:550,protein:48,carbs:43,fats:22},{name:"Frozen Edamame & Quinoa Bars",category:"Premade",cuisine:"Japanese",calories:550,protein:48,carbs:43,fats:22},{name:"Nicoise Salad with Tuna",category:"Gourmet",cuisine:"French",calories:550,protein:48,carbs:43,fats:22},{name:"Grilled Prawn & Mango Salsa",category:"Gourmet",cuisine:"Thai",calories:550,protein:48,carbs:43,fats:22},{name:"Acqua Pazza (Italian Poached Fish)",category:"Gourmet",cuisine:"Italian",calories:550,protein:48,carbs:43,fats:22},{name:"Salmon Tataki with Ponzu Salad",category:"Gourmet",cuisine:"Japanese",calories:550,protein:48,carbs:43,fats:22}],
      ],
    },
  },

  /* ── Workout ─────────────────────────────────────────────────── */
  workout: {
    recovery: {
      Upper: { focus:'Strength Focused', exercises:[
        { name:'Barbell Bench Press', muscle:'Chest', rest:'3-5 min', rpe:'~6', reps:'3×5', notes:'Control the negative. Small arch, feet flat. Bar should touch lower chest. 1-second pause option.', swaps:['DB Bench Press','Smith Machine Bench Press'] },
        { name:'Barbell Row (Overhand)', muscle:'Back', rest:'3-5 min', rpe:'~6', reps:'3×5', notes:'Pull to your belly button, not your chest. Hinge to ~45°. Keep lower back tight throughout.', swaps:['Cable Row','Chest-Supported Row'] },
        { name:'Overhead Press', muscle:'Shoulders', rest:'3-5 min', rpe:'~6', reps:'3×5', notes:"Brace your core like you're about to get punched. Press the bar back slightly over your head.", swaps:['DB Shoulder Press','Machine Shoulder Press'] },
        { name:'Lat Pulldown', muscle:'Back', rest:'2-3 min', rpe:'~6', reps:'3×8-10', notes:"Full stretch at top. Pull elbows down and back. Don't lean back excessively.", swaps:['Cable Pulldown','Assisted Pull-Up'] },
        { name:'Incline DB Curl', muscle:'Biceps', rest:'1-2 min', rpe:'~7', reps:'3×10-12', notes:'Sit on 45° incline. Full stretch at bottom. No swinging. Squeeze at top.', swaps:['Preacher Curl','Cable Curl'] },
        { name:'Overhead Triceps Extension', muscle:'Triceps', rest:'1-2 min', rpe:'~7', reps:'3×10-12', notes:'Keep elbows pointing straight up. Full stretch, controlled negative.', swaps:['Cable Overhead Extension','DB Skull Crusher'] },
      ]},
      Lower: { focus:'Strength Focused', exercises:[
        { name:'Barbell Squat', muscle:'Quads', rest:'3-5 min', rpe:'~6', reps:'3×5', notes:'Brace hard, hips back slightly, depth to parallel minimum. Keep knees tracking over toes.', swaps:['Goblet Squat','Leg Press'] },
        { name:'Romanian Deadlift', muscle:'Hamstrings', rest:'3-5 min', rpe:'~6', reps:'3×8', notes:'Push hips back, soft knee bend. Feel hamstring stretch. Bar stays close to legs throughout.', swaps:['Single-Leg RDL','Cable Pull-Through'] },
        { name:'Leg Press', muscle:'Quads', rest:'2-3 min', rpe:'~6', reps:'3×10-12', notes:"Feet shoulder-width, moderate height. Full ROM — don't let hips round at bottom.", swaps:['Hack Squat','Smith Machine Squat'] },
        { name:'Lying Leg Curl', muscle:'Hamstrings', rest:'1-2 min', rpe:'~7', reps:'3×12-15', notes:'Lean forward over machine for extra stretch. Pause and squeeze at top.', swaps:['Seated Leg Curl','Nordic Ham Curl'] },
        { name:'Leg Extension', muscle:'Quads', rest:'1-2 min', rpe:'~7', reps:'3×12-15', notes:'Squeeze quad at top. Control the negative. Avoid locking out aggressively.', swaps:['Terminal Knee Extension','Spanish Squat'] },
        { name:'Standing Calf Raise', muscle:'Calves', rest:'1-2 min', rpe:'~7', reps:'4×12-15', notes:'Full ROM — deep stretch at bottom, full contraction at top. 1-2 second pause at bottom.', swaps:['Seated Calf Raise','Leg Press Calf Raise'] },
      ]},
      Pull: { focus:'Hypertrophy Focused', exercises:[
        { name:'Pull-Up / Chin-Up', muscle:'Back', rest:'2-3 min', rpe:'~6', reps:'3×6-8', notes:'Full dead hang at bottom. Think about driving elbows to hips. Add weight if bodyweight is easy.', swaps:['Lat Pulldown','Assisted Pull-Up'] },
        { name:'Cable Row (Close Grip)', muscle:'Back', rest:'2-3 min', rpe:'~7', reps:'3×10-12', notes:'Sit tall, pull to navel, squeeze shoulder blades together at end range. Full stretch at front.', swaps:['DB Row','Machine Row'] },
        { name:'Face Pull', muscle:'Rear Delts', rest:'1-2 min', rpe:'~7', reps:'3×15-20', notes:"Pull to forehead, external rotate at end. Great for shoulder health — don't neglect it.", swaps:['Rear Delt Fly','Band Pull-Apart'] },
        { name:'Incline DB Curl', muscle:'Biceps', rest:'1-2 min', rpe:'~7', reps:'3×12-15', notes:'Full stretch at bottom. No momentum. Alternate arms or both together — your choice.', swaps:['Cable Curl','Hammer Curl'] },
        { name:'Hammer Curl', muscle:'Biceps', rest:'1-2 min', rpe:'~7', reps:'3×12-15', notes:'Neutral grip targets brachialis and brachioradialis. Helps build that bicep peak thickness.', swaps:['Cross-Body Curl','Reverse Curl'] },
        { name:'Rear Delt Fly', muscle:'Rear Delts', rest:'1-2 min', rpe:'~7', reps:'3×15-20', notes:'Hinge over or use cable. Slight bend in elbows, lead with your elbows not your hands.', swaps:['Reverse Pec Deck','Cable Rear Delt Fly'] },
      ]},
      Push: { focus:'Hypertrophy Focused', exercises:[
        { name:'DB Bench Press', muscle:'Chest', rest:'2-3 min', rpe:'~6', reps:'3×10-12', notes:'1 second pause at the bottom of each rep while maintaining tension on the pecs.', swaps:['Barbell Bench Press','Machine Chest Press'] },
        { name:'Machine Shoulder Press', muscle:'Shoulders', rest:'2-3 min', rpe:'~6', reps:'3×10-12', notes:'Ensure elbows break at least 90°. Mind-muscle connection with delts. Smooth, controlled reps.', swaps:['Cable Shoulder Press','Seated DB Shoulder Press'] },
        { name:'Low-to-High Cable Crossover', muscle:'Chest', rest:'1-2 min', rpe:'~7', reps:'3×12-15', notes:'All reps in the bottom half of ROM. Focus on deep stretch in pecs at bottom of each rep.', swaps:['DB Fly (Bottom Half)','Seated Cable Fly'] },
        { name:'Lean-In Lateral Raise', muscle:'Shoulders', rest:'1-2 min', rpe:'~7', reps:'3×12-15', notes:'Focus on squeezing lateral delt to move the weight. Control both up and down.', swaps:['Cable Lateral Raise','Machine Lateral Raise'] },
        { name:'Katana Triceps Extension', muscle:'Triceps', rest:'1-2 min', rpe:'~7', reps:'3×12-15', notes:'Optionally pause 0.5-1 sec in stretched position. Full ROM.', swaps:['DB Skull Crusher','EZ-Bar Skull Crusher'] },
        { name:'DB Triceps Kickback', muscle:'Triceps', rest:'1-2 min', rpe:'~7', reps:'3×15-20', notes:'Focus on squeezing triceps to move the weight. No swinging.', swaps:['Triceps Pressdown (Rope)','Triceps Pressdown (Bar)'] },
        { name:'Long-Lever Plank', muscle:'Core', rest:'1-2 min', rpe:'~7', reps:'3×30-45s', notes:'Use abs to lower and pull back up. Progressively increase ROM week to week.', swaps:['Ab Wheel Rollout','Swiss Ball Rollout'] },
      ]},
      Legs: { focus:'Hypertrophy Focused', exercises:[
        { name:'DB Walking Lunge', muscle:'Quads', rest:'2-3 min', rpe:'~6', reps:'3×10-12', notes:'Controlled negative, explode on the positive. Minimise contribution from rear leg.', swaps:['Leg Press','Hack Squat'] },
        { name:'Nordic Ham Curl', muscle:'Hamstrings', rest:'1-2 min', rpe:'~7', reps:'3×6-10', notes:'Lean forward to maximise stretch. This is hard — scale appropriately. Explosive negative is fine.', swaps:['Lying Leg Curl','Seated Leg Curl'] },
        { name:'DB Static Lunge', muscle:'Quads/Glutes', rest:'2-3 min', rpe:'~6', reps:'3×10-12', notes:'Medium strides. Minimise contribution from back leg. Chest up throughout.', swaps:['Smith Machine Lunge','Bulgarian Split Squat'] },
        { name:'Lateral Band Walk', muscle:'Glutes', rest:'1-2 min', rpe:'~7', reps:'3×15-20/side', notes:'If possible use pads for more ROM. Lean forward and grab rails to stretch glutes further.', swaps:['Cable Hip Abduction','Machine Hip Abduction'] },
        { name:'Leg Press Calf Press', muscle:'Calves', rest:'1-2 min', rpe:'~7', reps:'4×15-20', notes:'1-2 second pause at the bottom. Roll ankle back and forth on balls of feet.', swaps:['Seated Calf Raise','Standing Calf Raise'] },
      ]},
    },
    ramping: {
      Upper: { focus:'Strength Focused', exercises:[
        { name:'Barbell Bench Press', muscle:'Chest', rest:'3-5 min', rpe:'~7', reps:'4×4', notes:'Progressive overload from recovery phase. Add weight when you can complete all reps cleanly.', swaps:['DB Bench Press','Smith Machine Bench Press'] },
        { name:'Weighted Pull-Up', muscle:'Back', rest:'3-5 min', rpe:'~7', reps:'4×4-6', notes:'Add weight via belt or vest. Full dead hang. Think elbows to hips.', swaps:['Lat Pulldown (Heavy)','Assisted Weighted Pull-Up'] },
        { name:'Overhead Press', muscle:'Shoulders', rest:'3-5 min', rpe:'~7', reps:'4×4', notes:'Progress from recovery. Focus on leg drive and full lockout at top.', swaps:['DB Shoulder Press','Push Press'] },
        { name:'Cable Row (Heavy)', muscle:'Back', rest:'2-3 min', rpe:'~7', reps:'4×8', notes:'Heavier load from recovery. Full stretch, squeeze at contraction.', swaps:['DB Row','Machine Row'] },
        { name:'Incline DB Curl', muscle:'Biceps', rest:'1-2 min', rpe:'~8', reps:'4×10-12', notes:'Increase weight from recovery phase. Still full ROM and controlled.', swaps:['Preacher Curl','Cable Curl'] },
        { name:'Close-Grip Bench Press', muscle:'Triceps', rest:'2-3 min', rpe:'~7', reps:'3×8-10', notes:'Elbows in, wrists straight. Great compound triceps builder.', swaps:['Dips (Weighted)','Triceps Pressdown (Heavy)'] },
      ]},
      Lower: { focus:'Strength Focused', exercises:[
        { name:'Barbell Squat', muscle:'Quads', rest:'3-5 min', rpe:'~7', reps:'4×4', notes:'Progressive overload. Brace harder, stay tighter. Belt optional at heavier weights.', swaps:['Safety Bar Squat','Hack Squat'] },
        { name:'Conventional Deadlift', muscle:'Posterior Chain', rest:'4-5 min', rpe:'~7', reps:'3×4-5', notes:'Now introducing deadlifts in ramping. Flat back, bar close, leg drive into floor.', swaps:['Trap Bar Deadlift','Sumo Deadlift'] },
        { name:'Bulgarian Split Squat', muscle:'Quads/Glutes', rest:'2-3 min', rpe:'~7', reps:'3×8-10', notes:'Rear foot elevated. Front foot far enough forward. Deep stretch in hip flexor.', swaps:['Walking Lunge','Step-Up'] },
        { name:'Leg Curl (Heavy)', muscle:'Hamstrings', rest:'2-3 min', rpe:'~7', reps:'3×10-12', notes:'Increase load from recovery phase. Lean forward for extra stretch.', swaps:['Nordic Ham Curl','Romanian Deadlift'] },
        { name:'Leg Extension (Heavy)', muscle:'Quads', rest:'1-2 min', rpe:'~7', reps:'3×10-12', notes:'Controlled squeeze at top. Increase load progressively week over week.', swaps:['TKE','Spanish Squat'] },
        { name:'Seated Calf Raise', muscle:'Calves', rest:'1-2 min', rpe:'~7', reps:'4×15', notes:'Full ROM. Soleus-focused in seated position. Deep stretch every rep.', swaps:['Standing Calf Raise','Smith Machine Calf Raise'] },
      ]},
      Pull: { focus:'Hypertrophy Focused', exercises:[
        { name:'Weighted Pull-Up', muscle:'Back', rest:'3 min', rpe:'~7', reps:'4×6-8', notes:'Add 5-10% load from recovery. Still full ROM. Elbows drive to hips.', swaps:['Lat Pulldown','Chest-Supported Row'] },
        { name:'Incline DB Row', muscle:'Back', rest:'2-3 min', rpe:'~7', reps:'4×10-12', notes:'Chest on 30-45° pad. Elbow drives back and up. Great for upper back thickness.', swaps:['Cable Row','T-Bar Row'] },
        { name:'Face Pull (Heavy)', muscle:'Rear Delts', rest:'1-2 min', rpe:'~7', reps:'3×15-20', notes:"Increase load. Still focusing on external rotation at end. Don't rush the reps.", swaps:['Rear Delt Fly','Reverse Pec Deck'] },
        { name:'Bayesian Cable Curl', muscle:'Biceps', rest:'1-2 min', rpe:'~8', reps:'3×12-15', notes:'Stand in front of cable, cable pulls arm back. Great peak contraction and stretch.', swaps:['Incline DB Curl','Preacher Curl'] },
        { name:'Hammer Curl (Heavy)', muscle:'Biceps', rest:'1-2 min', rpe:'~7', reps:'3×10-12', notes:'Increase load from recovery. Still no swinging.', swaps:['Cross-Body Curl','Reverse Curl'] },
        { name:'Straight-Arm Pulldown', muscle:'Lats', rest:'1-2 min', rpe:'~7', reps:'3×15', notes:'Great lat isolation. Arms stay straight. Think about pulling the bar to your hips.', swaps:['Pullover','Cable Pullover'] },
      ]},
      Push: { focus:'Hypertrophy Focused', exercises:[
        { name:'Barbell Bench Press (Hypertrophy)', muscle:'Chest', rest:'2-3 min', rpe:'~7', reps:'4×8-10', notes:'Higher reps than lower day. Still controlled, pause optional. Focus on feel.', swaps:['DB Bench Press','Machine Chest Press'] },
        { name:'DB Shoulder Press (Heavy)', muscle:'Shoulders', rest:'2-3 min', rpe:'~7', reps:'4×8-10', notes:'Increase load from recovery. Full ROM — elbows below parallel at bottom.', swaps:['Machine Shoulder Press','Push Press'] },
        { name:'Cable Fly (Mid)', muscle:'Chest', rest:'1-2 min', rpe:'~7', reps:'3×12-15', notes:'Mid-cable position. Focus on peak chest contraction. Slight forward lean.', swaps:['DB Fly','Machine Fly'] },
        { name:'Cable Lateral Raise', muscle:'Shoulders', rest:'1-2 min', rpe:'~7', reps:'3×15-20', notes:'More constant tension than DB version. Control the negative.', swaps:['Lean-In Lateral Raise','Machine Lateral Raise'] },
        { name:'Triceps Pressdown (Heavy)', muscle:'Triceps', rest:'1-2 min', rpe:'~7', reps:'3×10-12', notes:'Use bar for maximum load. Elbows stay pinned to sides. Full lockout.', swaps:['Close-Grip Bench Press','Dips'] },
        { name:'Overhead Triceps Extension (Cable)', muscle:'Triceps', rest:'1-2 min', rpe:'~7', reps:'3×12-15', notes:'Full stretch at bottom. Rope or bar — both work. Keep elbows tight.', swaps:['DB Overhead Extension','EZ Overhead Extension'] },
        { name:'Weighted Plank / Ab Wheel', muscle:'Core', rest:'1-2 min', rpe:'~7', reps:'3×12-15', notes:'Progress from recovery plank to ab wheel. Full extension if able.', swaps:['Long-Lever Plank','Cable Crunch'] },
      ]},
      Legs: { focus:'Hypertrophy Focused', exercises:[
        { name:'Hack Squat', muscle:'Quads', rest:'2-3 min', rpe:'~7', reps:'4×8-10', notes:'Feet lower and narrower for more quad focus. Deep ROM. Control the negative.', swaps:['Leg Press','V-Squat'] },
        { name:'Romanian Deadlift (Heavy)', muscle:'Hamstrings', rest:'2-3 min', rpe:'~7', reps:'3×8-10', notes:'More load than recovery. Feel the hamstring stretch. Slow negative.', swaps:['Single-Leg RDL','Good Morning'] },
        { name:'Bulgarian Split Squat', muscle:'Quads/Glutes', rest:'2-3 min', rpe:'~7', reps:'3×10-12', notes:'Progress from lunges. More stable platform for loading. Deep stretch in hip flexor.', swaps:['Leg Press','Walking Lunge'] },
        { name:'Glute-Ham Raise', muscle:'Hamstrings', rest:'1-2 min', rpe:'~7', reps:'3×8-12', notes:'Advanced hamstring exercise. Use a machine or anchor feet. Control on the way down.', swaps:['Lying Leg Curl','Nordic Ham Curl'] },
        { name:'Seated Calf Raise (Heavy)', muscle:'Calves', rest:'1-2 min', rpe:'~7', reps:'4×12-15', notes:'Deep stretch every rep. Add load from recovery phase.', swaps:['Standing Calf Raise','Leg Press Calf Raise'] },
      ]},
    },
    restDay: { focus:'Active Recovery', exercises:[
      { name:'Light Walk (20-30 min)', muscle:'Cardio', rest:'—', rpe:'~3', reps:'1 session', notes:'Low intensity — keep heart rate conversational. Good for blood flow and recovery.', swaps:['Cycling','Swimming'] },
      { name:'Hip 90/90 Stretch', muscle:'Mobility', rest:'—', rpe:'1', reps:'2 min/side', notes:'Sit on floor with both legs at 90°. Lean into front hip. Great for hip mobility.', swaps:['Pigeon Pose','Hip Flexor Stretch'] },
      { name:'Shoulder Circle + Pass-Through', muscle:'Mobility', rest:'—', rpe:'1', reps:'2-3 sets', notes:'Use band or dowel. Helps maintain shoulder health on heavy upper days.', swaps:['Dislocates','Wall Slides'] },
      { name:'Foam Roll (Full Body)', muscle:'Recovery', rest:'—', rpe:'1', reps:'10 min', notes:'Focus on lats, quads, calves. Slow, steady pressure on tight spots.', swaps:['Massage Gun','Stretching'] },
    ]},
  },

  /* ── Blueprint Templates ─────────────────────────────────────────
     These are the framework options a user can attach to any venture.
     STATE.addBlueprint(ventureId, templateId) creates a live copy with
     per-step completion tracking in IndexedDB.
  ────────────────────────────────────────────────────────────────── */
  blueprintTemplates: [
    {
      id: 'hormozi',
      name: 'Hormozi 9-Stage Roadmap',
      description: "Alex Hormozi's framework for scaling a business from $0 to exit. Each stage has a clear graduation criterion.",
      steps: [
        { name:'Stage 0 — Improvise', description:'Validate the idea. Talk to 20 potential customers. Build something people will pay for. Get your first dollar of revenue.', keyActions:['Talk to 20 target customers face-to-face','Identify 1 core problem you solve better than anyone','Get your first $1 of revenue — any amount counts'] },
        { name:'Stage 1 — Hustle',    description:'Build a predictable, manual sales process. Close 10 customers by doing things that do not scale. Document every objection.', keyActions:['Close 10 paying customers manually','Document objections verbatim from every call','Build a simple 3-stage CRM: prospect → demo → close'] },
        { name:'Stage 2 — Prove',     description:'Prove the business model works repeatedly. Achieve $10K MRR with a clear repeatable motion. Reduce churn below 5%.', keyActions:['Hit $10K MRR with at least 30 paying customers','Document the exact sales script that closes deals','Reduce churn below 5% per month'] },
        { name:'Stage 3 — Optimise',  description:'Make unit economics work. Know your CAC, LTV, and payback period. Cut costs without cutting growth.', keyActions:['Calculate CAC, LTV, and LTV:CAC ratio (target >3:1)','Identify and cut the top 3 wasteful costs','Automate or templatise 80% of customer onboarding'] },
        { name:'Stage 4 — Scale',     description:'Hire to remove yourself from bottlenecks. Build systems that work without you. Aim for $50K MRR.', keyActions:['Make your first key hire (sales or ops)','Document all processes so anyone can run them in one week','Hit $50K MRR'] },
        { name:'Stage 5 — Expand',    description:'Open new customer segments or geographic markets. Double down on the channel that works best.', keyActions:['Identify the top 2 new customer segments to target','Launch in one new market or geography','Hit $100K MRR'] },
        { name:'Stage 6 — Dominate',  description:'Become the category leader. Build a moat through brand, data, or network effects. Outpace all competitors.', keyActions:['Win 30%+ market share in your primary niche','Launch a branded thought leadership content flywheel','Hit $500K MRR'] },
        { name:'Stage 7 — Leverage',  description:'Use your market position to create defensible advantages. Acquire competitors or complementary tools. Build brand equity.', keyActions:['Evaluate 3 acquisition targets','Launch a partner / integration ecosystem','Raise strategic capital or pursue profitability'] },
        { name:'Stage 8 — Exit Ready',description:'Clean up the cap table, metrics, and operations. Know your EBITDA multiple. Be ready to sell or raise at any moment.', keyActions:['Audit financials — clean GAAP books','Calculate valuation at 3× / 5× / 10× revenue multiples','Have a board-ready growth deck updated quarterly'] },
        { name:'Stage 9 — Capitalize',description:'Execute the exit, acqui-hire, or infinite-game reinvestment strategy. Turn your equity into the next venture.', keyActions:['Close exit transaction or Series A/B round','Negotiate earn-out and transition terms','Deploy capital into the next venture or investment portfolio'] },
      ],
    },
    {
      id: 'saas_mvp',
      name: 'SaaS MVP Blueprint',
      description: 'Step-by-step guide to building, launching, and getting first paying customers for a SaaS product.',
      steps: [
        { name:'Define the Problem',       description:'Write a one-sentence problem statement. Identify who has the problem and how urgently they need it solved.', keyActions:['Write a 1-sentence problem statement','List 5 customer personas who have this problem','Rate urgency: do they actively search for a solution?'] },
        { name:'Validate Demand',          description:'Talk to at least 20 people in your target market. Do not build anything yet. Just listen.', keyActions:['Conduct 20 discovery calls — no pitching','Record verbatim quotes about pain points','Identify the #1 problem worth solving'] },
        { name:'Design the Core Loop',     description:'Sketch the one action that delivers value. Every other feature is secondary.', keyActions:['Draw the core user journey in 5 steps or fewer','Define what "aha moment" means for your user','Cut everything that is not the core loop from v1'] },
        { name:'Build v1 MVP',             description:'Build only what is needed to deliver the core value. Ship ugly. Ship fast.', keyActions:['Set a ship date and do not move it','Use existing tools where possible (no custom infra)','Get v1 live in under 4 weeks'] },
        { name:'Get First 10 Users',       description:'Manually recruit the first 10 users. Do not rely on marketing yet — do it by hand.', keyActions:['Personally onboard each of the first 10 users','Watch them use the product live (screen share or in person)','Ask: would you be very disappointed if this went away?'] },
        { name:'Charge From Day 1',        description:'Do not give it away for free. Even $1 validates willingness to pay.', keyActions:['Set a price before the product is done','Close your first paid customer before launch','Never offer free forever — use trials with clear end dates'] },
        { name:'Iterate to Retention',     description:'A product people return to daily is more valuable than one people love once.', keyActions:['Track weekly active users — target 40%+ retention','Interview every churned user within 48 hours of leaving','Ship at least one retention-focused improvement per week'] },
        { name:'Build a Sales Playbook',   description:'Document exactly how you close deals so someone else can repeat it.', keyActions:['Write a sales script with responses to top 5 objections','Record 3 successful sales calls and transcribe key moments','Build a CRM — even a spreadsheet counts'] },
        { name:'Systematise Operations',   description:'Remove yourself from every manual step. Everything should run without your direct involvement.', keyActions:['Automate onboarding with email sequences','Write SOPs for support and common customer questions','Hire or contract for the first task you hate most'] },
        { name:'Hit $10K MRR',             description:'Prove the model works repeatedly. $10K MRR is the proof-of-concept threshold.', keyActions:['Close 30+ paying customers','Churn below 5% monthly','Document the exact repeatable motion that gets customers'] },
      ],
    },
    {
      id: 'content_marketing',
      name: 'Content Marketing Flywheel',
      description: 'Build a compounding content engine that drives inbound leads without paid ads.',
      steps: [
        { name:'Define Your Niche & POV',    description:'Pick one niche and one contrarian point of view. Generalists get ignored.', keyActions:['Write your one-line positioning statement','List 3 beliefs your audience holds that you disagree with','Commit to one primary content channel for 90 days'] },
        { name:'Create Your Content Pillar', description:'Produce one long-form content piece per week that answers the #1 question your target customer is googling.', keyActions:['Research 20 questions your customer Googles','Publish one 1,500+ word post per week for 8 weeks','Track organic traffic and keyword rankings weekly'] },
        { name:'Repurpose Everything',       description:'Turn every long-form piece into 5–10 short-form pieces for social distribution.', keyActions:['Extract 5 key quotes from each long-form post','Post one short-form piece daily across 2 channels','Build a content calendar for the next 30 days'] },
        { name:'Build an Email List',        description:'Email is the only channel you own. Everything else is borrowed.', keyActions:['Create a lead magnet (checklist, guide, or template)','Add opt-in to every content piece','Target 100 subscribers in 30 days, 1,000 in 90 days'] },
        { name:'Launch a Newsletter',        description:'A weekly newsletter turns readers into a community.', keyActions:['Send weekly newsletter every [set day] without exception','Track open rate (target 40%+) and click rate (target 5%+)','Feature one customer story or result every 4 weeks'] },
        { name:'SEO Foundation',             description:'Build the infrastructure for long-term organic discovery.', keyActions:['Optimise all posts with target keyword in title, H1, and meta','Build 5 backlinks per month through guest posts or PR','Fix all technical SEO issues (speed, mobile, indexing)'] },
        { name:'Convert Readers to Leads',   description:'Every piece of content should have a clear next step.', keyActions:['Add a CTA to every post (free trial, demo, or newsletter)','Build a landing page for each core content pillar','Track lead source — know which content drives signups'] },
        { name:'Measure & Double Down',      description:'Cut content types that do not convert. Double the format that does.', keyActions:['Review analytics monthly — top 10 posts by traffic and leads','Cut the 2 lowest-performing content formats','Scale production of the highest-converting format'] },
      ],
    },
  ],

  /* ── Business ────────────────────────────────────────────────── */
  business: {
    companyName: 'Envosta',
    /* Venture seeds — pre-populated ventures for the app.
       Each venture can have defaultBlueprints[] listing templateIds
       to automatically attach on first STATE bootstrap. */
    ventures: [
      {
        id: 'envosta',
        name: 'Envosta',
        icon: '🚀',
        description: 'B2B SaaS — productivity and operations platform.',
        defaultBlueprints: ['hormozi', 'saas_mvp'],
      },
    ],
    stages: [
      { num:0, name:'Improvise',  sub:'Validate the idea',      current:true  },
      { num:1, name:'Hustle',     sub:'First paying customers', current:false },
      { num:2, name:'Prove',      sub:'Repeatable sales',       current:false },
      { num:3, name:'Optimise',   sub:'Unit economics work',    current:false },
      { num:4, name:'Scale',      sub:'Hire & systematise',     current:false },
      { num:5, name:'Expand',     sub:'New channels/markets',   current:false },
      { num:6, name:'Dominate',   sub:'Category leader',        current:false },
      { num:7, name:'Leverage',   sub:'Brand & moat',           current:false },
      { num:8, name:'Exit Ready', sub:'Clean metrics',          current:false },
      { num:9, name:'Capitalize', sub:'Exit or compound',       current:false },
    ],
    departments: [
      { icon:'🧩', name:'Product', stage:'Build MVP', priorities:['Ship a working v1 that solves one problem extremely well','Talk to 10 target users before building any new feature','Define the core loop: what brings users back daily?'] },
      { icon:'📣', name:'Marketing', stage:'Find the Signal', priorities:['Test 3 traffic channels (content, cold outreach, communities)','Document which message resonates — track click-through on each','Build a waitlist or email list of 100+ ideal prospects'] },
      { icon:'💰', name:'Sales', stage:'First Revenue', priorities:['Close 3 paying customers manually — charge from day 1','Document objections verbatim from every call','Build a simple CRM: prospect → demo → close pipeline'] },
      { icon:'🎧', name:'Customer Service', stage:'White Glove', priorities:['Respond to every support message within 2 hours','Build a FAQ from the top 10 questions customers ask','Track NPS or satisfaction score monthly'] },
      { icon:'💻', name:'IT & Infrastructure', stage:'Lean Stack', priorities:['Keep infrastructure costs under $50/mo until 10 paying customers','Set up error monitoring and basic uptime alerting','Automate onboarding flow so new users activate without you'] },
      { icon:'🤝', name:'Recruiting', stage:'Solo Grind', priorities:['Identify the first hire: what bottleneck does it remove?','Build a repeatable process before hiring someone to run it','Document all core tasks so they\'re learnable in one week'] },
      { icon:'📋', name:'HR & Culture', stage:'Culture of One', priorities:['Define 3 core values you\'d hire and fire by','Write a one-page operating playbook for how you work','Habits and standards you want baked in from day one'] },
      { icon:'💵', name:'Finance', stage:'Track Everything', priorities:['Separate business and personal bank accounts now','Track every dollar in and out — weekly P&L review','Know your burn rate and runway at all times'] },
    ],
  },

  /* ── Creative ────────────────────────────────────────────────── */
  creative: {
    genre: 'Acoustic country — bar performances',
    songs: [
      { title:'Wagon Wheel',                artist:'Old Crow Medicine Show / Darius Rucker', key:'G',  status:'ready',    tags:['Crowd Favourite','Opener','Easy Sing-Along'] },
      { title:'Take Me Home, Country Roads', artist:'John Denver',                           key:'G',  status:'ready',    tags:['Crowd Favourite','Closer','High Energy'] },
      { title:'Friends in Low Places',       artist:'Garth Brooks',                           key:'Bb', status:'ready',    tags:['Bar Classic','Singalong'] },
      { title:'The House That Built Me',     artist:'Miranda Lambert',                        key:'C',  status:'ready',    tags:['Emotional','Mid-Set'] },
      { title:'Chicken Fried',               artist:'Zac Brown Band',                         key:'G',  status:'ready',    tags:['Feel Good','Mid-Set'] },
      { title:'Tennessee Whiskey',           artist:'Chris Stapleton',                        key:'A',  status:'ready',    tags:['Show Stopper','Smooth'] },
      { title:'Fast Car',                    artist:'Tracy Chapman',                          key:'C',  status:'ready',    tags:['Crossover','Quiet Moment'] },
      { title:'Jolene',                      artist:'Dolly Parton',                           key:'Dm', status:'ready',    tags:['Classic','Emotional'] },
      { title:'Whiskey Glasses',             artist:'Morgan Wallen',                          key:'C',  status:'learning', tags:['Modern Country','Up-Beat'] },
      { title:'Buy Dirt',                    artist:'Jordan Davis',                           key:'G',  status:'learning', tags:['Modern Country','Story'] },
      { title:'Seven Bridges Road',          artist:'Eagles',                                 key:'D',  status:'learning', tags:['A Cappella Intro','Harmony'] },
      { title:'When the Stars Go Blue',      artist:'Ryan Adams',                             key:'D',  status:'learning', tags:['Late Night Vibe','Slow'] },
      { title:'Rodeo Bones',                 artist:'Original',                               key:'G',  status:'original', tags:['Story Song','Verse-Chorus','Demo Ready'] },
      { title:'Sixty Miles of Nothing',      artist:'Original',                               key:'Am', status:'original', tags:['Fingerpick','Lyric-Heavy','Work In Progress'] },
      { title:'Four Walls and a Flag',       artist:'Original',                               key:'D',  status:'original', tags:['Patriotic','Slow Burn','Needs Bridge'] },
    ],
    setlist: [
      { song:'Wagon Wheel',                 key:'G',  notes:'Opens strong — get the room warmed up' },
      { song:'Chicken Fried',               key:'G',  notes:'Keep energy up, no key change needed' },
      { song:'Tennessee Whiskey',           key:'A',  notes:'Slow it down — let voice carry' },
      { song:'Fast Car',                    key:'C',  notes:'Crossover appeal — quiet and focused' },
      { song:'Friends in Low Places',       key:'Bb', notes:'Bar singalong — get them involved' },
      { song:'Rodeo Bones (Original)',      key:'G',  notes:"Plug original — \"this one's mine\"" },
      { song:'Take Me Home, Country Roads', key:'G',  notes:'Closer — everyone sings, end strong' },
    ],
    practice: [
      { icon:'🎸', title:'Fingerpicking Pattern — Travis Pick',          detail:'12 min daily. Start slow (60 BPM), build to 120. Apply to "Sixty Miles of Nothing".', priority:'high' },
      { icon:'🎤', title:'Vocal Warmup Routine',                         detail:"10 min before every session. Lip trills, sirens, 1-3-5 scales. Don't skip this.", priority:'high' },
      { icon:'🎵', title:'Capo Chord Transitions — Key of D',            detail:'D → G → A → Bm at 80 BPM clean before adding capo shapes. 15 min.', priority:'medium' },
      { icon:'📝', title:'Lyric Writing — 15 min stream of consciousness',detail:'Write without editing. Mine for phrases, images, lines. One session/day minimum.', priority:'medium' },
      { icon:'🔄', title:'Barre Chord F Shape — Clean Tone',             detail:'5 min mute-and-strum drill. First string must ring clean every time.', priority:'low' },
      { icon:'🎙️', title:'Record a Phone Demo',                          detail:'One rough voice memo per original per week. Listen back after 24 hours.', priority:'low' },
    ],
    writingGoals: [
      { label:'Songs in Library',     current:15, target:50, unit:'songs' },
      { label:'Originals',            current:3,  target:10, unit:'originals' },
      { label:'Demo-Ready Originals', current:1,  target:5,  unit:'demos' },
      { label:'Sets Performed',       current:0,  target:20, unit:'gigs' },
    ],
  },

  /* ── Wealth ──────────────────────────────────────────────────── */
  wealth: {
    mrrTarget:      50000,
    netWorthGoal:   1000000,
  },

  /* ── Whole Foods ─────────────────────────────────────────────────
     Top nutrient-dense whole food options per category.
     Each item: { name, highlight (key benefit), tags[] }
     'top' flag = shown pinned at the top of the section.
  ────────────────────────────────────────────────────────────────── */
  wholeFoods: [
    {
      category: 'Protein Sources',
      icon: '🥩',
      items: [
        { name:'Chicken Breast',        highlight:'~31g protein / 165 kcal per 100g. Leanest complete protein.', tags:['High Protein','Low Fat','Complete AA'], top:true },
        { name:'Eggs (Whole)',          highlight:'6g protein + choline, B12, D, and healthy fats per egg.', tags:['Complete Protein','Micronutrients','Versatile'], top:true },
        { name:'Greek Yogurt (Plain)', highlight:'~17g protein per 170g. Probiotics + calcium.', tags:['High Protein','Probiotics','Calcium'], top:true },
        { name:'Salmon (Wild)',         highlight:'~25g protein + omega-3 EPA/DHA. Anti-inflammatory.', tags:['Omega-3','High Protein','Heart Health'] },
        { name:'Beef (Lean, 93%)',      highlight:'High in creatine, iron, zinc, B12. ~26g protein per 100g.', tags:['Creatine','Iron','B12'] },
        { name:'Cottage Cheese',        highlight:'Slow-digesting casein protein. Great before bed.', tags:['Casein','Slow Digesting','Calcium'] },
        { name:'Tuna (Canned)',         highlight:'Convenient, cheap, ~25g protein. Watch sodium.', tags:['Convenient','High Protein','Omega-3'] },
        { name:'Sardines',              highlight:'Calcium from bones + omega-3 + B12. Most nutrient-dense fish.', tags:['Omega-3','Calcium','B12','Top Pick'] },
      ],
    },
    {
      category: 'Complex Carbohydrates',
      icon: '🌾',
      items: [
        { name:'Oats (Rolled)',         highlight:'Beta-glucan for cholesterol + slow carbs + 5g protein / 40g.', tags:['Fibre','Beta-Glucan','Sustained Energy'], top:true },
        { name:'Sweet Potato',          highlight:'Vitamin A, potassium, fibre. 26g carbs per medium potato.', tags:['Vitamin A','Potassium','Anti-inflammatory'], top:true },
        { name:'Brown Rice',            highlight:'Complete whole grain. Pairs with any protein. Easy bulk staple.', tags:['Whole Grain','Versatile','Bulk Friendly'], top:true },
        { name:'Quinoa',                highlight:'Complete protein (8g per cup cooked) + all essential amino acids.', tags:['Complete Protein','Gluten Free','Versatile'] },
        { name:'Lentils',               highlight:'~18g protein + 16g fibre per cooked cup. Cheap and filling.', tags:['Protein','Fibre','Iron','Budget'] },
        { name:'Black Beans',           highlight:'Resistant starch + protein + fibre. Great gut food.', tags:['Fibre','Resistant Starch','Protein'] },
        { name:'Bananas',               highlight:'Fast carbs + potassium. Perfect pre/post workout.', tags:['Potassium','Pre-Workout','Fast Carb'] },
        { name:'Berries (Mixed)',        highlight:'Lowest sugar fruit. Highest antioxidant density of any food.', tags:['Antioxidants','Low Sugar','Vitamin C'] },
      ],
    },
    {
      category: 'Healthy Fats',
      icon: '🥑',
      items: [
        { name:'Avocado',               highlight:'Monounsaturated fats + potassium + folate. 3g fibre per half.', tags:['MUFA','Potassium','Fibre'], top:true },
        { name:'Extra Virgin Olive Oil',highlight:'Oleocanthal — natural anti-inflammatory. Best cooking oil.', tags:['Anti-inflammatory','MUFA','Heart Health'], top:true },
        { name:'Walnuts',               highlight:'Highest plant omega-3 source. 4g per 28g serving.', tags:['Omega-3','Brain Health','ALA'], top:true },
        { name:'Almonds',               highlight:'Vitamin E + magnesium + healthy fats. Fills gaps in most diets.', tags:['Vitamin E','Magnesium','Satiety'] },
        { name:'Chia Seeds',            highlight:'Omega-3, calcium, fibre. Absorbs 10× its weight in liquid.', tags:['Omega-3','Fibre','Calcium'] },
        { name:'Flaxseed (Ground)',     highlight:'Lignans + ALA + fibre. Best added to oats or yogurt.', tags:['Lignans','ALA','Fibre'] },
        { name:'Coconut Oil (sparingly)',highlight:'MCTs for quick energy. Use in moderation — high in saturated fat.', tags:['MCT','Quick Energy','Use Sparingly'] },
      ],
    },
    {
      category: 'Vegetables',
      icon: '🥦',
      items: [
        { name:'Broccoli',              highlight:'Sulforaphane = powerful cancer-fighting compound. Vitamin C + K + folate.', tags:['Sulforaphane','Vitamin C','Anti-cancer'], top:true },
        { name:'Spinach',               highlight:'Iron, folate, K1, magnesium. Most nutrient-dense leafy green.', tags:['Iron','Folate','Magnesium','Lutein'], top:true },
        { name:'Kale',                  highlight:'Vitamin K1 (660% DV per cup raw). Plus C, A, calcium.', tags:['Vitamin K','Calcium','Fibre'], top:true },
        { name:'Bell Peppers (Red)',     highlight:'Highest vitamin C of any vegetable — 3× more than oranges.', tags:['Vitamin C','Antioxidants','Low Calorie'] },
        { name:'Garlic',                highlight:'Allicin = immune + cardiovascular benefits. Eat daily.', tags:['Allicin','Immune','Cardiovascular'] },
        { name:'Beets',                 highlight:'Nitrates boost blood flow and exercise performance.', tags:['Nitrates','Performance','Folate'] },
        { name:'Asparagus',             highlight:'Folate + prebiotic inulin + chromium. Detoxification support.', tags:['Folate','Prebiotic','Detox'] },
        { name:'Carrots',               highlight:'Beta-carotene (Vitamin A precursor). Eye health and immunity.', tags:['Beta-Carotene','Vitamin A','Eye Health'] },
      ],
    },
    {
      category: 'Dairy & Alternatives',
      icon: '🥛',
      items: [
        { name:'Whole Milk',            highlight:'Complete nutrition: protein, fat, carbs + calcium + D.', tags:['Calcium','Vitamin D','Complete'], top:true },
        { name:'Kefir',                 highlight:'More probiotics per serving than yogurt. Fermented milk drink.', tags:['Probiotics','Calcium','Fermented'], top:true },
        { name:'Parmesan Cheese',       highlight:'Highest protein-to-calorie cheese. 10g protein per 28g.', tags:['High Protein','Calcium','B12'] },
        { name:'Cottage Cheese (2%)',   highlight:'Casein protein + phosphorus + B12. Cheap and high volume.', tags:['Casein','B12','Budget'] },
      ],
    },
  ],

  /* ── Health Principles ────────────────────────────────────────── */
  healthPrinciples: {
    nutrition: [
      { title:'Protein First',           body:'Build every meal around a protein source. Aim for 0.8–1g per lb of bodyweight. It fills you up, repairs muscle, and keeps metabolism elevated.' },
      { title:'Whole Foods Over Packaged', body:'If it has more than 5 ingredients or ingredients you cannot pronounce, eat it sparingly. Real food is always more nutrient-dense than processed alternatives.' },
      { title:'Eat the Rainbow',         body:'Different coloured vegetables contain different phytonutrients. Aim for 5+ colours per day — not a rule, a useful target.' },
      { title:'Fibre Is Non-Negotiable', body:'30g fibre per day. It feeds gut bacteria, slows blood sugar spikes, and keeps you full. Eat vegetables, legumes, and whole grains daily.' },
      { title:'Hydration Before Hunger', body:'Drink 500ml of water immediately on waking. Often what feels like hunger is mild dehydration. Target 3–4L daily during a bulk.' },
      { title:'Time Calories Around Training', body:'Most of your carbohydrates should go around your workout window — before for fuel, after for recovery. Keep fats away from your pre-workout meal.' },
      { title:'Track, Even Temporarily', body:'Most people underestimate calories by 20–30%. Track everything for 2–4 weeks to calibrate your intuition. After that, eat by feel.' },
      { title:'Consistency Over Perfection', body:"One bad meal doesn't undo progress. One perfect meal doesn't build it. The pattern over 12 weeks is what matters." },
    ],
    workout: [
      { title:'Progressive Overload Is Everything', body:'Your body adapts to stress. If the weight, reps, or difficulty is not increasing over time, you are not getting stronger. Track every set.' },
      { title:'Technique Before Load',   body:'Bad technique with heavy weight builds injury, not muscle. Master the movement pattern first. Add load only when form is automatic.' },
      { title:'Sleep Is the Workout',    body:'Muscle is not built during training — it is built during sleep. 7–9 hours is not optional. Every night of poor sleep undoes a workout.' },
      { title:'Rest Days Are Training Days', body:'Active recovery — walking, stretching, and light movement — is more productive than full rest. Sedentary rest slows recovery.' },
      { title:'Mind-Muscle Connection',  body:'Studies show that consciously thinking about the muscle you are working increases activation by up to 20%. Slow down, feel each rep.' },
      { title:'Consistency > Intensity', body:'Training 4× per week every week for a year beats training 6× per week for 3 months and burning out. Show up. Even a short session counts.' },
      { title:'Compound Lifts Are the Foundation', body:'Squat, deadlift, bench, overhead press, and row build more muscle and burn more calories than any isolation exercise. Do them first, every session.' },
      { title:'Deload When You Dread the Gym', body:"If you haven't missed a week in 6–8 weeks, take a planned deload week at 60% intensity. It prevents injury and resets motivation." },
    ],
  },

  /* ── Stretching Routine ──────────────────────────────────────── */
  stretchingRoutine: {
    morning: [
      { name:'Cat-Cow', duration:'1 min', instruction:'On all fours. Arch spine up (cat), then dip spine down (cow). Slow and controlled. Wakes up the whole spine.' },
      { name:'Hip Flexor Stretch', duration:'45 sec / side', instruction:'Low lunge position. Push hips forward gently. Feel stretch in front of the rear hip. Hold, do not bounce.' },
      { name:'Thoracic Rotation', duration:'30 sec / side', instruction:'Sit cross-legged. Place hand behind head. Rotate upper body open toward the sky. Pause at end range.' },
      { name:'Shoulder Pass-Through', duration:'1 min', instruction:'Hold a band or towel with wide grip. Pass slowly over head and behind back. Go as far as comfortable, tighten grip over time.' },
      { name:'World\'s Greatest Stretch', duration:'30 sec / side', instruction:'Step forward into a lunge, place same-side hand down. Rotate upper body and reach to sky. Hold. Best single stretch you can do.' },
      { name:'Standing Hamstring', duration:'45 sec / side', instruction:'Stand on one leg, rest other heel on hip-height surface. Hinge at the hips — not the lower back. Feel stretch in the raised leg hamstring.' },
    ],
    postWorkout: [
      { name:'Pigeon Pose', duration:'90 sec / side', instruction:'From a push-up position, bring one knee forward toward same-side wrist. Lower hips. Best stretch for hip external rotation and glutes.' },
      { name:'Lat Stretch', duration:'45 sec / side', instruction:'Hold a pole or rack with one hand. Step back and sit hips down and away. Feel the lat lengthen. Great after pull days.' },
      { name:'Pec Doorway Stretch', duration:'45 sec / side', instruction:'Stand in a doorway. Place forearm on the frame at 90°. Step through gently. Feel the pec and front delt stretch.' },
      { name:'Seated Spinal Twist', duration:'45 sec / side', instruction:'Sit on floor, cross one leg over. Twist toward the raised knee. Use elbow for leverage. Feel mid-spine release.' },
      { name:'Child\'s Pose', duration:'60 sec', instruction:'Kneel and reach arms forward. Relax everything into the floor. Breathe deeply. Decompresses the spine after heavy loading.' },
      { name:'Figure-Four Hip Stretch', duration:'60 sec / side', instruction:'Lie on back. Cross ankle over opposite knee. Pull both legs toward chest. Targets deep glute and piriformis.' },
    ],
  },

  /* ── Morning Routine (Workout Page) ─────────────────────────── */
  morningRoutine: [
    { icon:'💧', step:'Hydrate',     detail:'500ml water immediately — before coffee, before phone.' },
    { icon:'☀️', step:'Sunlight',    detail:'10–15 min outside. Sets circadian rhythm, boosts cortisol and serotonin in the right order.' },
    { icon:'🧘', step:'5 Min Breathwork', detail:'Box breathing: 4 sec in, hold 4, out 4, hold 4. Repeat ×5. Activates parasympathetic nervous system.' },
    { icon:'💪', step:'Activation Drills', detail:'10 pull-ups + 30 push-ups + 30s L-sit + hip/shoulder/hamstring stretch. Takes 8 minutes. Non-negotiable.' },
    { icon:'🥣', step:'Eat Meal 1', detail:'High protein breakfast within 1 hour of waking. Sets the macro trajectory for the day.' },
    { icon:'📓', step:'Journal',    detail:'5 minutes. Write 3 gratitudes, weekly priority, today\'s top 3. Do not start work until this is done.' },
  ],

};
