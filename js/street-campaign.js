window.StreetCampaign = (function () {
  'use strict';

  var SAVE_KEY = 'haoge_street_escape_checkpoint_v1';
  var MIN_RUN_SECONDS = 180;
  var BLOCK_LENGTH = 420;
  var BLOCK_TURNS = [126, 318];
  // Encounters and turns are written in meters from the start of each stage.
  var STAGES = [
    {
      name: '逃出市集', exit: '市集出口', opening: 220, speed: 11, sprintSpeed: 19, gap: 10,
      brief: '捡到 3 个西瓜，再跑过市集出口。', target: '西瓜', need: 3, metric: 'melons',
      turns: [{ distance: 77, direction: 1, practice: true }, { distance: 154, direction: -1 }],
      encounters: [
        [13,'melon',1], [19,'melon',1], [24,'melon',1], [31,'melon',2], [37,'melon',2], [42,'melon',2],
        [49,'cart',1], [54,'gold',0], [59,'melon',0], [63,'melon',2],
        [85,'person',0], [94,'pile',2], [102,'melon',1], [108,'melon',1], [112,'melon',1],
        [127,'cart',0], [135,'melon',1], [142,'gold',2], [173,'pile',1], [182,'melon',0],
        [191,'cert',1], [203,'tricycle',1], [214,'melon',0],
      ],
    },
    {
      name: '穿过老街', exit: '老街出口', opening: 280, speed: 12.4, sprintSpeed: 21, gap: 11.4,
      brief: '在第一个路口确认左转，再跑过老街出口。', target: '左转', need: 1, metric: 'turns',
      turns: [{ distance: 59, direction: -1, required: true }, { distance: 148, direction: 1 },
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
      name: '甩开华强', exit: '后巷出口', opening: 350, speed: 13.8, sprintSpeed: 23, gap: 11,
      brief: '拾取保熟卡，使用一次技能，再跑过后巷出口。', target: '保熟技能', need: 1, metric: 'skillsUsed',
      turns: [{ distance: 64, direction: 1 }, { distance: 162, direction: 1 }, { distance: 261, direction: -1 }],
      encounters: [
        [10,'cert',1], [21,'cert',0], [25,'cart',2], [33,'person',0], [42,'pole',1],
        [52,'cert',2], [73,'melon',0], [80,'pile',0], [88,'tricycle',1], [99,'cert',1],
        [108,'gold',2], [117,'cart',1], [124,'melon',2], [138,'pole',0], [149,'cert',1],
        [181,'pile',1], [194,'gold',2], [205,'person',0], [217,'tricycle',1], [232,'cert',1],
        [244,'cart',2], [278,'pole',0], [293,'pile',1], [306,'gold',2], [320,'tricycle',1],
        [333,'cert',2], [344,'melon',1],
      ],
    },
  ];

  // Keep the road clear around each bend and alternate which side carries the obstacles.
  var BLOCK_ENCOUNTERS = [
    [
      [22,'melon',1], [43,'cart',0], [62,'melon',1], [78,'person',2], [97,'gold',0],
      [155,'pile',1], [178,'melon',2], [204,'cart',0], [227,'cert',1], [248,'melon',1],
      [274,'tricycle',1], [348,'person',0], [372,'cart',2], [396,'melon',1],
    ],
    [
      [25,'cart',2], [42,'melon',1], [58,'pole',0], [82,'person',2], [101,'gold',1],
      [156,'cart',1], [179,'melon',0], [205,'cert',1], [224,'tricycle',1], [261,'melon',1],
      [284,'pile',2], [350,'pole',1], [373,'gold',2], [401,'melon',1],
    ],
    [
      [17,'pole',1], [45,'cart',0], [68,'cert',1], [89,'person',2], [101,'melon',0],
      [152,'tricycle',1], [175,'gold',0], [199,'pile',1], [224,'melon',2], [250,'pole',2],
      [278,'cert',1], [348,'cart',1], [374,'tricycle',1], [400,'gold',2],
    ],
  ];

  var routeLength = 0;
  var heading = 0;
  STAGES.forEach(function (stage, district) {
    stage.cruiseSpeed = stage.sprintSpeed - 2;
    stage.length = (MIN_RUN_SECONDS + 1) * stage.sprintSpeed;
    stage.from = routeLength;
    routeLength += stage.length;
    stage.to = routeLength;
    stage.turns.forEach(function (turn) { heading += turn.direction; });

    var pattern = BLOCK_ENCOUNTERS[district];
    for (var start = stage.opening, block = 0; start < stage.length - 30; start += BLOCK_LENGTH, block++) {
      var flipped = block % 2 === 1;
      var variation = (block % 3 - 1) * 5;
      pattern.forEach(function (item) {
        var at = start + item[0] + variation;
        if (at < stage.length - 16) stage.encounters.push([at, item[1], flipped ? 2 - item[2] : item[2]]);
      });
      if (start + BLOCK_TURNS[1] < stage.length - 26) {
        var direction = heading ? -heading : flipped ? -1 : 1;
        stage.turns.push({ distance: start + BLOCK_TURNS[0], direction: direction },
          { distance: start + BLOCK_TURNS[1], direction: -direction });
      }
    }
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
    var current = reached < STAGES.length ? reached : 0;
    var cursor = 0;
    var turns = 0;
    var pendingIndex = current;

    function stage() { return STAGES[current]; }

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
      pendingIndex = current;
      result.classList.add('hidden');
      hud.hidden = false;
      title.textContent = (current + 1) + ' / ' + STAGES.length + '　' + stage().name;
    }

    function count(state) {
      return stage().metric === 'turns' ? turns : state[stage().metric];
    }

    function updateHud(state) {
      if (state.mode !== 'playing') return;
      var chapter = stage();
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

    function finish(reason, state) {
      var success = reason === 'cleared';
      var chapter = stage();
      var last = current === STAGES.length - 1;
      if (success) {
        reached = Math.max(reached, current + 1);
        try { localStorage.setItem(SAVE_KEY, String(reached)); } catch (err) {}
      }
      pendingIndex = success ? (last ? 0 : current + 1) : current;
      resultTitle.textContent = success ? (last ? '逃脱成功' : '通过 · ' + chapter.name)
        : reason === 'caught' ? '华强追上来了' : '还没完成目标';
      resultText.textContent = success
        ? (last ? '郝哥从后巷跑了出去。三段路线全部完成。'
          : '下一段：' + STAGES[pendingIndex].name + '。' + STAGES[pendingIndex].brief)
        : (reason === 'missedTurn' ? '刚才漏了左转。下次等提示变绿，点「左转」、向左滑动或按 ←。'
          : chapter.brief + ' 本次进度 ' + Math.min(chapter.need, count(state)) + '/' + chapter.need + '。');
      nextButton.textContent = success ? (last ? '再跑一轮' : '下一段') : '重试本段';
      hud.hidden = true;
      result.classList.remove('hidden');
      nextButton.focus({ preventScroll: true });
    }

    return {
      stages: STAGES, stage: stage, reset: reset, finish: finish,
      queue: queue, crossing: crossing, updateHud: updateHud,
      turned: function (turn) { if (turn.required) turns++; },
      next: function () { current = pendingIndex; },
      restart: function () { current = 0; },
    };
  }

  return { create: create };
})();
