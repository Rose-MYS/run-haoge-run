window.StreetCampaign = (function () {
  'use strict';

  var SAVE_KEY = 'haoge_street_escape_checkpoint_v1';
  var STARS_KEY = 'haoge_street_stars_v1';
  var BLOCK_LENGTH = 340;
  var BLOCK_TURNS = [108, 252];

  // Encounters and turns are written in meters from the start of each stage.
  var STAGES = [
    {
      name: '逃出市集', exit: '市集出口', opening: 220, targetMeters: 1520, speed: 11.5, sprintSpeed: 18.5, gap: 10,
      brief: '收集 15 个西瓜，跑过市集出口。', target: '西瓜', need: 15, metric: 'melons',
      waves: [
        { name: '早市开跑', at: 0, mult: 0.90 },
        { name: '摊档穿行', at: 0.30, mult: 1.00 },
        { name: '冲出牌坊', at: 0.70, mult: 1.08 },
      ],
      turns: [{ distance: 77, direction: 1, practice: true }, { distance: 154, direction: -1 }],
      encounters: [
        [13,'melon',1], [19,'melon',1], [24,'melon',1], [31,'melon',2], [37,'melon',2],
        [49,'cart',1], [54,'gold',0], [59,'melon',0], [63,'melon',2],
        [85,'person',0], [94,'pile',2], [102,'melon',1], [108,'melon',1],
        [127,'cart',0], [135,'melon',1], [142,'gold',2], [173,'pile',1], [182,'melon',0],
        [191,'cert',1], [203,'tricycle',1], [214,'melon',0],
      ],
    },
    {
      name: '穿过老街', exit: '老街出口', opening: 280, targetMeters: 1920, speed: 12.8, sprintSpeed: 20.5, gap: 11.4,
      brief: '确认 4 次路口转向，跑过老街出口。', target: '转向', need: 4, metric: 'turns',
      waves: [
        { name: '临街商铺', at: 0, mult: 0.90 },
        { name: '晒衣窄道', at: 0.30, mult: 1.00 },
        { name: '老街急弯', at: 0.70, mult: 1.08 },
      ],
      turns: [{ distance: 59, direction: -1 }, { distance: 148, direction: 1 },
        { distance: 231, direction: -1 }],
      encounters: [
        [12,'cart',0], [19,'melon',1], [25,'person',2], [34,'pole',1],
        [43,'gold',1], [69,'melon',1], [77,'pile',0], [86,'person',2], [97,'tricycle',1],
        [110,'melon',0], [115,'melon',1], [128,'cart',2], [136,'melon',1], [168,'gold',0],
        [178,'pole',2], [187,'melon',1], [198,'person',0], [212,'cart',1], [220,'cert',2],
        [245,'pile',0], [255,'melon',1], [263,'tricycle',1], [275,'melon',2],
      ],
    },
    {
      name: '甩开华强', exit: '后巷出口', opening: 320, targetMeters: 2260, speed: 14.0, sprintSpeed: 22.5, gap: 11,
      brief: '施放 2 次保熟技能，跑过后巷出口。', target: '保熟技能', need: 2, metric: 'skillsUsed',
      waves: [
        { name: '后巷追击', at: 0, mult: 0.90 },
        { name: '险道冲刺', at: 0.30, mult: 1.00 },
        { name: '终极甩脱', at: 0.70, mult: 1.08 },
      ],
      turns: [{ distance: 64, direction: 1 }, { distance: 162, direction: 1 }, { distance: 261, direction: -1 }],
      encounters: [
        [10,'cert',1], [21,'cert',0], [25,'cart',2], [33,'person',0], [42,'pole',1],
        [52,'cert',2], [73,'melon',0], [80,'pile',0], [88,'tricycle',1], [99,'cert',1],
        [108,'gold',2], [117,'cart',1], [124,'melon',2], [138,'pole',0], [149,'cert',1],
        [181,'pile',1], [194,'gold',2], [205,'person',0], [217,'tricycle',1], [232,'cert',1],
        [244,'cart',2], [278,'pole',0], [293,'pile',1], [306,'gold',2],
      ],
    },
  ];

  // Four distinct 340m block patterns: single-lane weave, double-lane pressure, jump->slide combo, high-risk gold line.
  var WAVE_PATTERNS = [
    // Pattern A: Balanced rhythm with melons and single-lane obstacles
    [
      [18,'melon',1], [24,'melon',1], [38,'cart',0], [54,'melon',2], [68,'person',1],
      [82,'gold',0], [134,'pile',1], [150,'melon',2], [168,'pole',1], [186,'cert',0],
      [204,'melon',1], [222,'tricycle',1], [280,'person',0], [298,'cart',2], [316,'melon',1],
    ],
    // Pattern B: Double-lane pressure (two adjacent lanes blocked, forcing clear read & jump/lane switch)
    [
      [16,'cart',0], [16,'pile',1], [24,'melon',2], [44,'melon',1], [58,'pole',1],
      [76,'cart',1], [76,'cart',2], [84,'gold',0], [138,'tricycle',1], [158,'melon',0],
      [176,'pile',0], [176,'pile',2], [186,'melon',1], [206,'cert',1], [224,'person',2],
      [282,'cart',0], [282,'pile',1], [302,'melon',2], [318,'gold',2],
    ],
    // Pattern C: Jump-then-slide & bystander combo
    [
      [14,'cart',1], [30,'pole',1], [42,'melon',1], [58,'person',0], [74,'melon',2],
      [88,'gold',1], [136,'pile',2], [152,'pole',1], [168,'melon',0], [184,'cert',2],
      [202,'tricycle',1], [220,'melon',1], [278,'cart',1], [294,'pole',1], [312,'melon',1],
    ],
    // Pattern D: High-speed risk line (gold chain behind obstacles + cert supply)
    [
      [18,'melon',0], [26,'gold',0], [34,'gold',0], [48,'cart',0], [66,'tricycle',1],
      [84,'person',2], [134,'pole',1], [148,'cert',1], [166,'pile',0], [166,'cart',1],
      [184,'melon',2], [204,'gold',2], [222,'cart',2], [282,'tricycle',1], [304,'melon',1], [318,'cert',0],
    ],
  ];

  var routeLength = 0;
  var heading = 0;
  STAGES.forEach(function (stage, district) {
    stage.cruiseSpeed = stage.sprintSpeed - 2;
    stage.length = stage.targetMeters;
    stage.from = routeLength;
    routeLength += stage.length;
    stage.to = routeLength;
    stage.turns.forEach(function (turn) { heading += turn.direction; });

    for (var start = stage.opening, block = 0; start < stage.length - 30; start += BLOCK_LENGTH, block++) {
      var progress = start / stage.length;
      var patternIdx = progress < 0.30 ? (block % 2)
        : progress < 0.70 ? ((district + block) % 3)
        : ((district + block + 1) % WAVE_PATTERNS.length);
      var pattern = WAVE_PATTERNS[patternIdx];
      var flipped = block % 2 === 1;
      var variation = (block % 3 - 1) * 4;
      pattern.forEach(function (item) {
        var at = start + item[0] + variation;
        // Keep encounters strictly out of turn windows [BLOCK_TURNS - 14, BLOCK_TURNS + 18]
        var inTurn0 = Math.abs(item[0] - BLOCK_TURNS[0]) < 16;
        var inTurn1 = Math.abs(item[0] - BLOCK_TURNS[1]) < 16;
        if (!inTurn0 && !inTurn1 && at < stage.length - 16) {
          stage.encounters.push([at, item[1], flipped ? 2 - item[2] : item[2]]);
        }
      });
      if (start + BLOCK_TURNS[1] < stage.length - 26) {
        var direction = heading ? -heading : flipped ? -1 : 1;
        stage.turns.push({ distance: start + BLOCK_TURNS[0], direction: direction },
          { distance: start + BLOCK_TURNS[1], direction: -direction });
      }
    }
    stage.encounters.sort(function (a, b) { return a[0] - b[0]; });
    stage.turns.sort(function (a, b) { return a.distance - b.distance; });
  });

  function create() {
    var hud = document.getElementById('chapterHud');
    var title = document.getElementById('chapterHudTitle');
    var goal = document.getElementById('chapterHudGoal');
    var exit = document.getElementById('chapterHudExit');
    var clock = document.getElementById('chapterHudTime');
    var progress = document.getElementById('chapterProgress');
    var result = document.getElementById('chapterScreen');
    var resultTitle = document.getElementById('chapterTitle');
    var resultText = document.getElementById('chapterDetail');
    var nextButton = document.getElementById('chapterNextBtn');
    var restart = document.getElementById('chapterNewRun');
    var startButton = document.getElementById('startBtn');
    var intro = document.querySelector('#startScreen .subtitle');

    var reached = 0;
    try {
      var stored = Number(localStorage.getItem(SAVE_KEY));
      if (Number.isInteger(stored) && stored >= 0 && stored <= STAGES.length) reached = stored;
    } catch (err) {}
    var starsMap = {};
    try {
      starsMap = JSON.parse(localStorage.getItem(STARS_KEY) || '{}') || {};
    } catch (err) { starsMap = {}; }

    var current = reached < STAGES.length ? reached : 0;
    var cursor = 0;
    var turns = 0;
    var missedTurns = 0;
    var waveIndex = 0;
    var pendingIndex = current;

    function stage() { return STAGES[current]; }

    function currentWave(dist) {
      var ch = stage();
      var p = Math.max(0, Math.min(1, (dist - ch.from) / ch.length));
      var idx = 0;
      for (var i = 0; i < ch.waves.length; i++) {
        if (p >= ch.waves[i].at) idx = i;
      }
      return { index: idx, info: ch.waves[idx] };
    }

    function menu() {
      intro.textContent = '东街市集 · 分段逃脱';
      startButton.textContent = current > 0 ? '继续第 ' + (current + 1) + ' 段' : '开始逃脱';
      restart.hidden = current === 0;
      restart.disabled = false;
    }
    menu();

    function reset() {
      cursor = 0;
      turns = 0;
      missedTurns = 0;
      waveIndex = 0;
      pendingIndex = current;
      result.classList.add('hidden');
      hud.hidden = false;
      var ch = stage();
      title.textContent = (current + 1) + ' / ' + STAGES.length + '　' + ch.name + ' · ' + ch.waves[0].name;
    }

    function count(state) {
      return stage().metric === 'turns' ? turns : state[stage().metric];
    }

    function updateHud(state, onWaveChange) {
      if (state.mode !== 'playing') return;
      var chapter = stage();
      var w = currentWave(state.dist);
      if (w.index !== waveIndex) {
        waveIndex = w.index;
        title.textContent = (current + 1) + ' / ' + STAGES.length + '　' + chapter.name + ' · ' + w.info.name;
        if (onWaveChange) onWaveChange(w.index + 1, w.info);
      }
      var left = Math.max(0, Math.ceil(chapter.to - state.dist));
      var done = Math.min(chapter.need, count(state));
      goal.textContent = chapter.target + ' ' + done + '/' + chapter.need;
      goal.classList.toggle('chapter-goal-done', done >= chapter.need);
      exit.textContent = '出口 ' + left + ' m';
      var seconds = Math.floor(state.chapterTime);
      var elapsed = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
      if (clock.textContent !== elapsed) clock.textContent = elapsed;
      progress.value = Math.max(0, Math.min(1, (state.dist - chapter.from) / chapter.length));
    }

    function queue(distance, spawn) {
      var chapter = stage();
      var list = chapter.encounters;
      while (cursor < list.length && chapter.from + list[cursor][0] <= distance + 55) {
        var item = list[cursor];
        spawn(item[1], item[2], distance - chapter.from - item[0], item[3]);
        cursor++;
      }
    }

    function crossing(state) {
      if (state.dist < stage().to) return null;
      return count(state) >= stage().need ? 'cleared' : 'incomplete';
    }

    function computeStars(state) {
      var hits = state.hitCount || 0;
      if (hits === 0 && missedTurns === 0) return 3;
      if (hits <= 2 && missedTurns <= 1) return 2;
      return 1;
    }

    function formatTime(sec) {
      var s = Math.max(0, Math.floor(sec || 0));
      return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }

    function finish(reason, state) {
      var success = reason === 'cleared';
      var chapter = stage();
      var last = current === STAGES.length - 1;
      var stars = success ? computeStars(state) : 0;
      if (success) {
        reached = Math.max(reached, current + 1);
        try { localStorage.setItem(SAVE_KEY, String(reached)); } catch (err) {}
        starsMap[current] = Math.max(starsMap[current] || 0, stars);
        try { localStorage.setItem(STARS_KEY, JSON.stringify(starsMap)); } catch (err) {}
      }
      pendingIndex = success ? (last ? 0 : current + 1) : current;
      resultTitle.textContent = success ? (last ? '逃脱成功！' : '通过 · ' + chapter.name)
        : reason === 'caught' ? '华强追上来了' : '还没完成目标';

      if (success) {
        var starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        var statsLine = '评分 ' + starStr + ' ｜ 用时 ' + formatTime(state.chapterTime) +
          ' ｜ 西瓜 ' + (state.melons || 0) + ' ｜ 失误 ' + (state.hitCount || 0);
        resultText.textContent = (last
          ? '郝哥甩开华强从后巷冲了出去！三段逃脱全部通关。'
          : '下一段：' + STAGES[pendingIndex].name + '（' + STAGES[pendingIndex].brief + '）') +
          '\n' + statsLine;
      } else {
        resultText.textContent = reason === 'caught'
          ? '华强把刀架在瓜摊前：“这瓜保熟吗？”——本段失误过多被追上，再试一次！'
          : chapter.brief + ' 本次进度 ' + Math.min(chapter.need, count(state)) + '/' + chapter.need + '。';
      }
      resultText.style.whiteSpace = 'pre-line';
      nextButton.textContent = success ? (last ? '再跑一轮' : '下一段') : '重试本段';
      hud.hidden = true;
      result.classList.remove('hidden');
      nextButton.focus({ preventScroll: true });
    }

    return {
      stages: STAGES, stage: stage, reset: reset, finish: finish,
      queue: queue, crossing: crossing, updateHud: updateHud,
      currentWave: currentWave,
      turned: function () { turns++; },
      missedTurn: function () { missedTurns++; },
      next: function () { current = pendingIndex; },
      restart: function () { current = 0; },
    };
  }

  return { create: create };
})();
