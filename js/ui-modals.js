window.GameModals = (function () {
  'use strict';

  var EGGS = [
    { id: 'dist100', name: '初出茅庐', desc: '单局跑过 100 米' },
    { id: 'dist500', name: '小有成绩', desc: '单局跑过 500 米' },
    { id: 'noHit300', name: '无伤开局', desc: '前 300 米一次都没撞' },
    { id: 'cards3', name: '卡牌大师', desc: '一局集满 2 张保熟卡' },
    { id: 'skill3', name: '技能达人', desc: '一局释放 3 次保熟技能' },
    { id: 'guard', name: '摔了一跤', desc: '第一次撞到障碍物' },
    { id: 'tricycle', name: '三轮车杀手', desc: '遇到横穿三轮车' },
    { id: 'sarilang', name: '郝哥惊叫', desc: '路过大妈时郝哥喊萨日朗' },
    { id: 'best3000', name: '高分榜', desc: '历史最高分达到 1000' },
    { id: 'dist1000', name: '十里长街', desc: '单局跑过 1000 米' },
    { id: 'dist2000', name: '瓜摊战神', desc: '单局跑过 2000 米' },
    { id: 'hitEarly100', name: '开局不利', desc: '前 100 米撞到 2 个障碍物' },
    { id: 'hitMany5', name: '身经百撞', desc: '一局撞到 5 个障碍物' },
    { id: 'sarilang3', name: '萨日朗大合唱', desc: '一局对 3 位大妈喊萨日朗' },
    { id: 'goldCombo3', name: '金瓜连珠', desc: '一局连续吃到 3 个金西瓜' },
    { id: 'perfectTurn3', name: '秋名山瓜车', desc: '单局完成 3 次绿灯完美转弯' },
    { id: 'campaignClear', name: '东街脱险', desc: '通关分段逃脱全部三段' },
    { id: 'stars9', name: '满星瓜王', desc: '分段逃脱三段全部获得 3 星' },
  ];

  var EGG_KEY = 'haoge_eggs';
  var CAREER_KEY = 'haoge_career_v1';
  var STARS_KEY = 'haoge_street_stars_v1';

  var eggState = {};
  try { eggState = JSON.parse(localStorage.getItem(EGG_KEY) || '{}') || {}; } catch (e) { eggState = {}; }

  var career = {
    bestScore: 0,
    totalDist: 0,
    totalMelons: 0,
    totalPigua: 0,
    totalSkills: 0,
    stagesCleared: 0,
  };
  try {
    var savedCareer = JSON.parse(localStorage.getItem(CAREER_KEY) || '{}');
    if (savedCareer && typeof savedCareer === 'object') {
      for (var k in career) {
        if (typeof savedCareer[k] === 'number' && isFinite(savedCareer[k])) career[k] = savedCareer[k];
      }
    }
    var legacyBest = parseInt(localStorage.getItem('haoge_best'), 10) || 0;
    if (legacyBest > career.bestScore) career.bestScore = legacyBest;
  } catch (e) {}

  function saveEggs() {
    try { localStorage.setItem(EGG_KEY, JSON.stringify(eggState)); } catch (e) {}
  }

  function saveCareer() {
    try { localStorage.setItem(CAREER_KEY, JSON.stringify(career)); } catch (e) {}
  }

  function getCampaignStars() {
    var sum = 0;
    try {
      var map = JSON.parse(localStorage.getItem(STARS_KEY) || '{}') || {};
      for (var i = 0; i < 3; i++) sum += Number(map[i]) || 0;
    } catch (e) {}
    return sum;
  }

  function countUnlockedEggs() {
    var n = 0;
    for (var i = 0; i < EGGS.length; i++) {
      if (eggState[EGGS[i].id]) n++;
    }
    return n;
  }

  function updateStartSummary() {
    var box = document.getElementById('careerSummary');
    if (!box) return;
    var stars = getCampaignStars();
    var eggs = countUnlockedEggs();
    box.textContent = '分段总星 ★ ' + stars + '/9 ｜ 彩蛋 ' + eggs + '/' + EGGS.length + ' ｜ 累计吃瓜 ' + Math.floor(career.totalMelons);
  }

  function recordCareer(delta) {
    if (!delta) return;
    if (typeof delta.bestScore === 'number') career.bestScore = Math.max(career.bestScore, delta.bestScore);
    if (typeof delta.dist === 'number' && delta.dist > 0) career.totalDist += delta.dist;
    if (typeof delta.melons === 'number' && delta.melons > 0) career.totalMelons += delta.melons;
    if (typeof delta.pigua === 'number' && delta.pigua > 0) career.totalPigua += delta.pigua;
    if (typeof delta.skills === 'number' && delta.skills > 0) career.totalSkills += delta.skills;
    if (typeof delta.stagesCleared === 'number' && delta.stagesCleared > 0) career.stagesCleared += delta.stagesCleared;
    saveCareer();
    updateStartSummary();
  }

  var eggToastTimer = null;
  function showEggToast(name) {
    var toast = document.getElementById('eggToast');
    if (!toast) return;
    toast.textContent = '彩蛋解锁：' + name;
    if (eggToastTimer) {
      clearTimeout(eggToastTimer);
      eggToastTimer = null;
    }
    toast.classList.remove('hidden', 'show');
    requestAnimationFrame(function () { toast.classList.add('show'); });
    eggToastTimer = setTimeout(function () {
      toast.classList.remove('show');
      eggToastTimer = setTimeout(function () {
        toast.classList.add('hidden');
        eggToastTimer = null;
      }, 300);
    }, 2200);
  }

  function unlockEgg(id) {
    if (eggState[id]) return false;
    eggState[id] = true;
    saveEggs();
    updateStartSummary();
    for (var i = 0; i < EGGS.length; i++) {
      if (EGGS[i].id === id) {
        showEggToast(EGGS[i].name);
        break;
      }
    }
    return true;
  }

  function renderCareerGrid() {
    var grid = document.getElementById('careerGrid');
    if (!grid) return;
    grid.innerHTML = '';
    var cards = [
      { label: '分段总星', val: '★ ' + getCampaignStars() + ' / 9' },
      { label: '无尽最高分', val: String(Math.floor(career.bestScore)) },
      { label: '累计奔跑', val: Math.floor(career.totalDist) + ' m' },
      { label: '累计吃瓜', val: String(Math.floor(career.totalMelons)) },
      { label: '华强劈瓜', val: career.totalPigua + ' 次' },
      { label: '保熟大招', val: career.totalSkills + ' 次' },
    ];
    for (var i = 0; i < cards.length; i++) {
      var item = document.createElement('div');
      item.className = 'career-card';
      item.innerHTML = '<div class="career-val">' + cards[i].val + '</div>' +
        '<div class="career-label">' + cards[i].label + '</div>';
      grid.appendChild(item);
    }
  }

  function openEggModal() {
    var grid = document.getElementById('eggGrid');
    var progress = document.getElementById('eggProgress');
    var modal = document.getElementById('eggModal');
    if (!grid || !modal) return;
    renderCareerGrid();
    grid.innerHTML = '';
    var unlockedCount = 0;
    for (var i = 0; i < EGGS.length; i++) {
      var e = EGGS[i];
      var unlocked = !!eggState[e.id];
      if (unlocked) unlockedCount++;
      var div = document.createElement('div');
      div.className = 'egg-item' + (unlocked ? '' : ' locked');
      div.innerHTML = '<div class="egg-name">' + (unlocked ? '🍉 ' : '❓ ') + e.name + '</div>' +
        '<div class="egg-desc">' + e.desc + '</div>' +
        '<div class="egg-status">' + (unlocked ? '已收集' : '未收集') + '</div>';
      grid.appendChild(div);
    }
    if (progress) progress.textContent = '已收集 ' + unlockedCount + ' / ' + EGGS.length;
    modal.classList.remove('hidden');
  }

  function drawIcon(kind, streetItems) {
    if (streetItems) return streetItems.icon(kind);
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var x = c.getContext('2d');
    if (kind === 'melon') {
      x.fillStyle = '#2e8b3d';
      x.beginPath(); x.arc(32, 34, 24, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#1d5c28';
      x.lineWidth = 4;
      for (var i = -2; i <= 2; i++) {
        x.beginPath();
        x.moveTo(32 + i * 8 - 20, 34 - 20);
        x.quadraticCurveTo(32 + i * 8, 16, 32 + i * 8 + 20, 34 - 20);
        x.stroke();
      }
      x.fillStyle = '#4caf50';
      x.beginPath(); x.arc(24, 25, 6, 0, Math.PI * 2); x.fill();
    } else if (kind === 'gold') {
      var grad = x.createRadialGradient(24, 24, 4, 32, 32, 26);
      grad.addColorStop(0, '#fff3b0');
      grad.addColorStop(1, '#e0a800');
      x.fillStyle = grad;
      x.beginPath(); x.arc(32, 32, 24, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#b8860b';
      x.lineWidth = 2;
      x.stroke();
      x.fillStyle = '#fff8dc';
      x.beginPath(); x.arc(24, 22, 4, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.arc(44, 43, 3, 0, Math.PI * 2); x.fill();
    } else {
      x.fillStyle = '#c9a227';
      x.fillRect(8, 14, 48, 40);
      x.strokeStyle = '#8a6a14';
      x.lineWidth = 2;
      x.strokeRect(8, 14, 48, 40);
      x.fillStyle = '#d94f4f';
      x.fillRect(8, 8, 48, 10);
      x.fillStyle = '#fff8e1';
      x.font = 'bold 15px "Microsoft YaHei", "SimHei", sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText('保熟', 32, 40);
      x.fillStyle = '#b71c1c';
      x.beginPath(); x.arc(47, 46, 6, 0, Math.PI * 2); x.fill();
    }
    return c.toDataURL('image/png');
  }

  function matchVoiceKey(filename, items) {
    var low = String(filename || '').toLowerCase();
    for (var i = 0; i < items.length; i++) {
      var k = items[i].key.toLowerCase();
      if (low.indexOf(k) >= 0) return items[i].key;
      if (items[i].keywords) {
        for (var j = 0; j < items[i].keywords.length; j++) {
          if (low.indexOf(items[i].keywords[j]) >= 0) return items[i].key;
        }
      }
    }
    return null;
  }

  function renderVoiceList() {
    var list = document.getElementById('voiceList');
    if (!list || !window.AppAudio || !window.AppAudio.listVoices) return;
    list.innerHTML = '';
    var items = window.AppAudio.listVoices();
    for (var i = 0; i < items.length; i++) {
      (function (item) {
        var row = document.createElement('div');
        row.className = 'voice-row';
        var meta = document.createElement('div');
        meta.className = 'voice-meta';
        var name = document.createElement('div');
        name.className = 'voice-name';
        name.textContent = item.label;
        if (item.custom) {
          var badge = document.createElement('span');
          badge.className = 'voice-badge';
          badge.textContent = '已自定义';
          name.appendChild(badge);
        } else if (!item.ready) {
          var miss = document.createElement('span');
          miss.className = 'voice-badge';
          miss.textContent = '未加载';
          name.appendChild(miss);
        }
        var trig = document.createElement('div');
        trig.className = 'voice-trig';
        trig.textContent = item.trigger;
        meta.appendChild(name);
        meta.appendChild(trig);

        var btns = document.createElement('div');
        btns.className = 'voice-btns';
        var playBtn = document.createElement('button');
        playBtn.type = 'button';
        playBtn.className = 'btn btn-small';
        playBtn.textContent = '试听';
        playBtn.addEventListener('click', function () {
          window.AppAudio.previewVoice(item.key);
        });
        var upBtn = document.createElement('button');
        upBtn.type = 'button';
        upBtn.className = 'btn btn-small';
        upBtn.textContent = '替换';
        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'audio/*,.mp3,.wav,.ogg,.m4a';
        fileInput.hidden = true;
        fileInput.addEventListener('change', function () {
          var file = fileInput.files && fileInput.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function () {
            if (typeof reader.result === 'string') {
              window.AppAudio.setCustomVoice(item.key, reader.result);
              renderVoiceList();
            }
          };
          reader.readAsDataURL(file);
        });
        upBtn.addEventListener('click', function () { fileInput.click(); });
        btns.appendChild(playBtn);
        btns.appendChild(upBtn);
        if (item.custom) {
          var rstBtn = document.createElement('button');
          rstBtn.type = 'button';
          rstBtn.className = 'btn btn-small';
          rstBtn.textContent = '恢复';
          rstBtn.addEventListener('click', function () {
            window.AppAudio.resetCustomVoice(item.key);
            renderVoiceList();
          });
          btns.appendChild(rstBtn);
        }
        row.appendChild(meta);
        row.appendChild(btns);
        row.appendChild(fileInput);
        list.appendChild(row);
      })(items[i]);
    }
  }

  function openVoiceModal() {
    renderVoiceList();
    var vm = document.getElementById('voiceModal');
    if (vm) vm.classList.remove('hidden');
  }

  function bindVoiceBatchImport() {
    var batchBtn = document.getElementById('voiceBatchBtn');
    var batchInput = document.getElementById('voiceBatchInput');
    var status = document.getElementById('voiceBatchStatus');
    if (!batchBtn || !batchInput) return;
    batchBtn.addEventListener('click', function () { batchInput.click(); });
    batchInput.addEventListener('change', function () {
      var files = batchInput.files;
      if (!files || !files.length || !window.AppAudio) return;
      var items = window.AppAudio.listVoices();
      var pending = files.length;
      var matched = 0;
      for (var i = 0; i < files.length; i++) {
        (function (file) {
          var key = matchVoiceKey(file.name, items);
          if (!key) {
            if (--pending === 0 && status) status.textContent = '已导入 ' + matched + ' 个匹配文件';
            return;
          }
          var reader = new FileReader();
          reader.onload = function () {
            if (typeof reader.result === 'string') {
              window.AppAudio.setCustomVoice(key, reader.result);
              matched++;
            }
            if (--pending === 0) {
              renderVoiceList();
              if (status) status.textContent = '已导入 ' + matched + ' 个匹配文件';
            }
          };
          reader.readAsDataURL(file);
        })(files[i]);
      }
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindVoiceBatchImport);
    } else {
      bindVoiceBatchImport();
    }
  }

  return {
    EGGS: EGGS,
    unlockEgg: unlockEgg,
    openEggModal: openEggModal,
    drawIcon: drawIcon,
    recordCareer: recordCareer,
    getCareer: function () { return Object.assign({}, career); },
    getCampaignStars: getCampaignStars,
    updateStartSummary: updateStartSummary,
    renderVoiceList: renderVoiceList,
    openVoiceModal: openVoiceModal,
  };
})();
