window.StreetCast = (function () {
  'use strict';

  function create() {
    var haoge = new THREE.Group();
    var huaqiang = new THREE.Group();
    haoge.name = 'CampaignHaoge';
    huaqiang.name = 'CampaignHuaqiang';
    haoge.visible = huaqiang.visible = false;
    huaqiang.scale.setScalar(1.12);
    var ready = false;

    function load(models, done) {
      var left = 2;
      var failed = false;
      function attached(primary) {
        failed = failed || primary !== true;
        if (--left > 0) return;
        ready = !failed && haoge.userData.isPureGLB === true && huaqiang.userData.refinedChaser === true;
        haoge.visible = huaqiang.visible = ready;
        done(ready);
      }
      models.loadRunner(haoge, 'haoge', { height: 2.2, onSettled: attached });
      models.loadRunner(huaqiang, 'huaqiang', { height: 2.5, onSettled: attached });
    }

    return {
      haoge: haoge, huaqiang: huaqiang, load: load,
      isReady: function () { return ready; },
    };
  }

  return { create: create };
})();
