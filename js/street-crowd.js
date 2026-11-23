/* Street-side pedestrians share the route projection and stay outside the obstacle pool. */
(function () {
  'use strict';

  // Distance within district, sidewalk side, model, and offset from the road edge.
  var DISTRICTS = [
    { sampleStart: 0, people: [[12,-1,'elder',.78], [24,1,'mechanic',.90], [36,-1,'commuter',.79],
      [61,1,'commuter',.81], [104,-1,'mechanic',.90]],
      extra: [[129,1,'commuter',.84], [174,-1,'elder',.86], [207,1,'mechanic',.83]] },
    { sampleStart: 118, people: [[15,1,'elder',.88], [33,-1,'commuter',.80], [66,1,'mechanic',.85],
      [90,-1,'elder',1.02], [110,1,'commuter',.79]],
      extra: [[159,-1,'mechanic',.82], [196,1,'elder',.84], [218,-1,'commuter',.76], [264,1,'commuter',.83]] },
    { sampleStart: 242, people: [[16,-1,'commuter',.75], [39,1,'mechanic',.82], [80,-1,'elder',.87],
      [107,1,'commuter',.77], [125,-1,'mechanic',.87]],
      extra: [[174,1,'elder',.82], [205,-1,'commuter',.86], [249,1,'mechanic',.85],
        [283,-1,'elder',.81], [329,1,'commuter',.74]] },
  ];

  function create(parent, project, streetWidth, stages) {
    var crowd = new THREE.Group();
    crowd.name = 'StreetPedestrianCrowd';
    parent.add(crowd);
    var pools = { mechanic: [], elder: [], commuter: [] };
    var roles = Object.keys(pools);
    var placements = [];
    DISTRICTS.forEach(function (district, i) {
      var start = stages ? stages[i].from : district.sampleStart;
      var people = stages ? district.people.concat(district.extra) : district.people;
      people.forEach(function (person) {
        placements.push([start + person[0], person[1], person[2], person[3]]);
      });
      if (stages) {
        var stage = stages[i];
        for (var offset = stage.opening; offset < stage.length - 15; offset += 188) {
          for (var j = 0; j < district.people.length; j += 2) {
            var person = district.people[j];
            var at = offset + person[0];
            if (at < stage.length - 14) placements.push([start + at, -person[1], person[2], person[3]]);
          }
        }
      }
    });

    return function drawCrowd(distance, elapsed) {
      var used = { mechanic: 0, elder: 0, commuter: 0 };
      placements.forEach(function (placement) {
        var d = placement[0], side = placement[1], role = placement[2];
        if (d < distance - 14 || d > distance + 46) return;
        var pool = pools[role], index = used[role]++;
        var actor = pool[index];
        if (!actor) {
          actor = pool[index] = window.StreetPedestrian.createPasserby(role);
          crowd.add(actor);
        }
        var t = (elapsed || 0) + d * .13;
        var walking = role === 'commuter';
        var walkPhase = t * .65;
        if (walking) d += Math.sin(walkPhase) * 1.75;
        var p = project(d, side * (streetWidth(d) + placement[3]));
        actor.visible = true;
        actor.position.set(p.x, .115, p.z);
        var rig = actor.userData;
        if (walking) {
          var pace = Math.cos(walkPhase);
          var step = Math.sin(t * 6.1) * .25 * Math.abs(pace);
          var turn = THREE.MathUtils.smoothstep(pace,-.25,.25);
          actor.rotation.y = p.yaw - side * (Math.PI * turn + .16);
          rig.legs[0].rotation.x = step;
          rig.legs[1].rotation.x = -step;
          rig.arms[0].rotation.x = -.11 - step * .66;
          rig.arms[1].rotation.x = -.06 + step * .36;
          rig.head.rotation.y = side * -.13 + Math.sin(t * .7) * .10;
        } else {
          actor.rotation.y = p.yaw - side * .75;
          rig.head.rotation.y = Math.sin(t * .54) * .24;
          if (role === 'mechanic') {
            rig.arms[1].rotation.x = -.17 + Math.sin(t * .92) * .09;
          }
        }
      });
      roles.forEach(function (role) {
        for (var i = used[role]; i < pools[role].length; i++) pools[role][i].visible = false;
      });
    };
  }

  window.StreetCrowd = { create: create };
})();
