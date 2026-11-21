window.RunnerAnim = (function () {
  'use strict';

  var MAP = {
    idle: 'idle',
    run: 'run',
    jump: 'jump',
    doubleJump: 'jumpup',
    slide: 'roll',
    fall: 'fall',
    die: 'die',
    hurt: 'fall',
    fly: 'die',
    push: 'jump',
    pigua: 'lookback',
    lastchance: 'runlookback',
    hug: 'idle',
    lookback: 'lookback',
    scooter: 'idle',
  };

  var ALIASES = {
    idle: ['idle', 'idleloop', 'standing'],
    run: ['run', 'running', 'runloop', 'runforward', 'sprint'],
    jump: ['jump', 'jumpup', 'jump_loop', 'jumpstart'],
    jumpup: ['jumpup', 'doublejump', 'jump'],
    doublejump: ['jumpup', 'doublejump', 'jump'],
    roll: ['roll', 'slide', 'groundroll'],
    slide: ['roll', 'slide', 'groundroll'],
    fall: ['fall', 'falling', 'fallidle', 'fallloop'],
    die: ['die', 'death', 'dead', 'dizzy'],
    hurt: ['hurt', 'fall', 'die'],
    fly: ['fly', 'die', 'fall'],
    push: ['push', 'jump', 'run'],
    pigua: ['lookback', 'runlookback', 'run'],
    lookback: ['lookback', 'runlookback', 'run'],
    runlookback: ['runlookback', 'lookback', 'run'],
    lastchance: ['runlookback', 'lookback', 'run'],
    scooter: ['scooter', 'idle', 'run'],
  };

  function normKey(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  function pickAction(actions, primary, logical) {
    if (!actions) return null;
    if (actions[primary]) return actions[primary];
    var primaryNorm = normKey(primary);
    if (actions[primaryNorm]) return actions[primaryNorm];
    var keys = ALIASES[normKey(logical || primary)] || [];
    for (var i = 0; i < keys.length; i++) {
      if (actions[keys[i]]) return actions[keys[i]];
      var k = normKey(keys[i]);
      if (actions[k]) return actions[k];
    }
    return null;
  }

  function play(runner, name, opts) {
    var u = runner && runner.userData;
    if (!u || !u.isGLB || !u.mixer || !u.actions) return false;
    var clipName = MAP[name] || name;
    var action = pickAction(u.actions, clipName, name);
    if (!action) return false;
    var looping = name === 'run' || name === 'idle' || name === 'slide';
    if (u.currentAction === clipName) {
      action.play();
    } else {
      u.mixer.stopAllAction();
      action.reset();
      action.play();
      u.currentAction = clipName;
    }
    if (looping) {
      action.loop = THREE.LoopRepeat;
      action.clampWhenFinished = false;
    } else {
      action.loop = THREE.LoopOnce;
      action.clampWhenFinished = true;
    }
    action.timeScale = (opts && opts.timeScale) || 1;
    return true;
  }

  function freeze(runner) {
    var u = runner && runner.userData;
    if (u && u.mixer) {
      u.mixer.stopAllAction();
      u.currentAction = null;
    }
  }

  return {
    play: play,
    freeze: freeze,
  };
})();
