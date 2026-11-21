/* ============================================================
 * 开发期郝哥模型切换开关（临时调试用，定稿后可整文件删除）
 * - 可切换郝哥 GLB 模型包，以及独立预览表现层方案。
 * - 选择后点击“应用并刷新”，刷新后进入游戏对比即可；
 *   localStorage 键：haogeModelPack。
 * ============================================================ */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function build() {
    if (window.HAOGE_SOURCE_ONLY) return;
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
    var RM = window.RunnerModels;
    if (!RM || !RM.getHaogePacks || !RM.getActiveHaogePack) return;
    var packs = RM.getHaogePacks();
    if (!packs || !packs.length) return;

    var startScreen = document.getElementById('startScreen');
    if (!startScreen) return;
    var holder = startScreen.querySelector('.panel');
    if (!holder) return;

    // 防重复注入
    if (document.getElementById('devModelPanel')) return;

    var style = document.createElement('style');
    style.textContent =
      '#devModelPanel{position:relative;margin:14px auto 0;max-width:340px;padding:10px 12px;' +
      'border:1px dashed #b48a3e;border-radius:8px;background:rgba(20,16,10,.55);' +
      'color:#f5e6c8;font-size:12px;text-align:left;backdrop-filter:blur(2px);}' +
      '#devModelPanel .dmp-title{font-size:12px;font-weight:bold;color:#ffd97a;margin-bottom:6px;}' +
      '#devModelPanel label{display:block;margin:2px 0;cursor:pointer;line-height:1.5;}' +
      '#devModelPanel .dmp-note{color:#cbb585;margin:6px 0 2px;line-height:1.5;}' +
      '#devModelPanel .dmp-actions{margin-top:6px;text-align:right;}' +
      '#devModelPanel button{font-size:12px;padding:3px 10px;margin-left:6px;cursor:pointer;' +
      'border:1px solid #b48a3e;border-radius:5px;background:#3a2f1c;color:#ffe9b0;}' +
      '#devModelPanel button:disabled{opacity:.45;cursor:default;}';

    var active = RM.getActiveHaogePack();
    var panel = document.createElement('div');
    panel.id = 'devModelPanel';
    panel.className = 'dev-model';

    var title = document.createElement('div');
    title.className = 'dmp-title';
    title.textContent = '🧪 郝哥模型调试（临时，勿外发）';

    var body = document.createElement('div');
    packs.forEach(function (p, i) {
      var lab = document.createElement('label');
      var radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'haogePack';
      radio.value = p.id;
      if (p.id === active) radio.checked = true;
      if (p.desc) {
        radio.title = p.desc;
      }
      lab.appendChild(radio);
      lab.appendChild(document.createTextNode(' ' + p.label + (p.id === active ? '（现默认）' : '')));
      lab.addEventListener('click', function () { mark(p.id); });
      body.appendChild(lab);
    });

    var note = document.createElement('div');
    note.className = 'dmp-note';
    note.textContent = '选完点“应用并刷新”，再按“开始跑！”对比。仅郝哥生效；华强/小弟/大妈不受影响。';

    var actions = document.createElement('div');
    actions.className = 'dmp-actions';
    var btnApply = document.createElement('button');
    btnApply.textContent = '应用并刷新';
    btnApply.disabled = true;
    btnApply.addEventListener('click', function () {
      try { localStorage.setItem('haogeModelPack', chosen); } catch (e) {}
      location.reload();
    });
    var btnReset = document.createElement('button');
    btnReset.textContent = '恢复默认(v1)并刷新';
    btnReset.addEventListener('click', function () {
      try { localStorage.removeItem('haogeModelPack'); } catch (e) {}
      location.reload();
    });
    actions.appendChild(btnApply);
    actions.appendChild(btnReset);
    var styleUrl = new URL(location.href);
    var toon = styleUrl.searchParams.get('style') === 'toon';
    var procedural = styleUrl.searchParams.get('models') === 'procedural';
    var refinedChaser = styleUrl.searchParams.get('chaser') === 'refined';
    var btnCharacters = document.createElement('button');
    btnCharacters.textContent = procedural ? '返回 GLB 模型' : '预览新角色';
    btnCharacters.addEventListener('click', function () {
      if (procedural) styleUrl.searchParams.delete('models');
      else styleUrl.searchParams.set('models', 'procedural');
      location.href = styleUrl.href;
    });
    var btnStyle = document.createElement('button');
    btnStyle.textContent = toon ? '切回现行材质' : '预览郝哥 toon';
    btnStyle.addEventListener('click', function () {
      if (toon) styleUrl.searchParams.delete('style');
      else styleUrl.searchParams.set('style', 'toon');
      location.href = styleUrl.href;
    });
    var btnChaser = document.createElement('button');
    btnChaser.textContent = refinedChaser ? '切回旧版华强' : '试玩精修版华强';
    btnChaser.addEventListener('click', function () {
      if (refinedChaser) styleUrl.searchParams.delete('chaser');
      else styleUrl.searchParams.set('chaser', 'refined');
      location.href = styleUrl.href;
    });
    actions.appendChild(btnStyle);
    actions.appendChild(btnCharacters);
    actions.appendChild(btnChaser);
    if (procedural) {
      title.textContent = '程序化角色预览';
      note.textContent = '开跑查看郝哥和华强的新外观。';
      body.hidden = btnApply.hidden = btnReset.hidden = btnStyle.hidden = btnChaser.hidden = true;
    }

    var chosen = active;
    function mark(id) {
      chosen = id;
      btnApply.disabled = (id === active);
    }

    panel.appendChild(title);
    panel.appendChild(body);
    panel.appendChild(note);
    panel.appendChild(actions);
    document.head.appendChild(style);
    holder.appendChild(panel);
  }

  ready(build);
})();
