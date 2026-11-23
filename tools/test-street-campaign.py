"""Play through the packaged street campaign and verify its checkpoints, waves, and star rating."""

from pathlib import Path
import runpy
import sys

from playwright.sync_api import sync_playwright


gameplay = runpy.run_path(str(Path(__file__).with_name("test-gameplay.py")))
advance = gameplay["advance"]
CHECK_CAST = """(() => {
  let runners;
  Object.defineProperty(window, 'Runners', {
    configurable: true,
    get: () => runners,
    set: value => {
      runners = value;
      for (const name of ['createHaoGe', 'createHuaQiang']) {
        const create = runners[name];
        runners[name] = (...args) => {
          if (!window.HAOGE_SOURCE_ONLY || window.HAOGE_PUBLISH_CAST) {
            throw new Error('campaign created an old lead model');
          }
          return create(...args);
        };
      }
    },
  });
})();"""


def go_until(page, distance):
    page.evaluate("""distance => {
      for (let i = 0; i < 400 && __gameDebug.S.mode === 'playing' && __gameDebug.S.dist < distance; i++) {
        advanceGameFrames(1);
      }
    }""", distance)
    return page.evaluate("() => [__gameDebug.S.dist,__gameDebug.S.mode,__gameDebug.S.gap]")


def load(page, file):
    page.goto(file.resolve().as_uri() + "?seed=42&campaign=1&models=procedural&style=toon")
    assert page.locator("body").evaluate("e => e.classList.contains('street-campaign')")
    if page.locator("#introSkip").is_visible():
        page.locator("#introSkip").click()
    page.wait_for_function(
        """__gameDebug.haoGe.visible && __gameDebug.huaQiang.visible && (window.HAOGE_SOURCE_ONLY && !window.HAOGE_PUBLISH_CAST
            ? !RunnerModels.usesGltf() && !__gameDebug.haoGe.userData.isGLB && !__gameDebug.huaQiang.userData.isGLB
            : __gameDebug.haoGe.userData.isPureGLB && __gameDebug.huaQiang.userData.refinedChaser &&
              __gameDebug.haoGe.getObjectByName('HaogeReviewed')?.isSkinnedMesh)""",
        polling=100,
    )
    page.evaluate("""() => {
      CONFIG.piguaChance = 0;
      __gameDebug.renderer.render = () => {};
    }""")


def chapter(page, text):
    assert text in page.locator("#chapterHudTitle").inner_text()


def finish_long_route(page):
    result = page.evaluate("""() => {
      const { S, player, campaign, scene } = __gameDebug;
      const stage = campaign.stage();
      const events = stage.turns.map(turn => [
        turn.distance - 10, turn.direction === 1 ? 'ArrowRight' : 'ArrowLeft'
      ]);
      const blockedAt = new Map();
      for (const [distance, kind, lane] of stage.encounters) {
        if (kind === 'pole') events.push([distance - 7, 'ArrowDown']);
        else if (kind === 'tricycle') events.push([distance - 5, 'ArrowUp']);
        else if (['cart', 'pile', 'person'].includes(kind)) {
          const keyD = Math.round(distance);
          if (!blockedAt.has(keyD)) blockedAt.set(keyD, new Set());
          blockedAt.get(keyD).add(lane);
        }
      }
      for (const [d, lanes] of blockedAt.entries()) {
        const safe = [0, 1, 2].find(l => !lanes.has(l));
        if (safe !== undefined) events.push([d - 12, 'MOVE_TO', safe]);
      }
      const remaining = events.filter(event => event[0] > S.dist - stage.from)
        .sort((a, b) => a[0] - b[0]);
      const key = value => window.dispatchEvent(new KeyboardEvent('keydown', { key: value }));
      let next = 0, fastest = 0;
      const wavesSeen = new Set();
      for (let frame = 0; frame < 6000 && S.mode === 'playing'; frame++) {
        wavesSeen.add(campaign.currentWave(S.dist).index);
        while (next < remaining.length && stage.from + remaining[next][0] <= S.dist) {
          const [, action, targetLane] = remaining[next++];
          if (action === 'MOVE_TO') {
            let curLane = 1;
            if (player.position.x < -0.85) curLane = 0;
            else if (player.position.x > 0.85) curLane = 2;
            const dKey = Math.round(remaining[next - 1][0] + 12);
            const blocked = blockedAt.get(dKey);
            if (blocked && blocked.has(curLane)) {
              const diff = targetLane - curLane;
              if (diff > 0) for (let k = 0; k < diff; k++) key('ArrowRight');
              else if (diff < 0) for (let k = 0; k < -diff; k++) key('ArrowLeft');
            }
          } else if (action) {
            key(action);
          }
        }
        if (S.cards > 0 && (stage.metric === 'skillsUsed' || S.gap <= CONFIG.catchGap + 1.5)) key('e');
        const distance = S.dist, time = S.chapterTime;
        advanceGameFrames(1);
        if (S.chapterTime > time) fastest = Math.max(fastest, (S.dist - distance) / (S.chapterTime - time));
      }
      return { mode: S.mode, distance: S.dist, exit: stage.to, hitCount: S.hitCount,
        time: S.chapterTime, fastest, sprint: stage.sprintSpeed, length: stage.length,
        waves: wavesSeen.size };
    }""")
    assert result["mode"] == "chapter" and result["distance"] >= result["exit"], result
    assert 75 <= result["time"] <= 165, result
    assert result["waves"] == 3, result
    assert result["fastest"] <= result["sprint"] + .00001, result
    print(f"Stage {result['length']} m ran for {result['time']:.2f}s across {result['waves']} waves", flush=True)


def main(file):
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome", args=["--enable-unsafe-swiftshader"])
        context = browser.new_context(offline=True, viewport={"width": 720, "height": 480})
        context.add_init_script(gameplay["FRAME_CLOCK"] + chr(10) + CHECK_CAST)
        page = context.new_page()
        errors = []
        requests = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("request", lambda request: requests.append(request.url)
                if request.url.startswith(("http:", "https:")) else None)
        load(page, file)
        page.locator("#startBtn").click()
        chapter(page, "逃出市集")
        assert page.locator("#chapterTurnGuide .street-turn").is_visible()
        assert page.locator("#chapterHudTime").inner_text() == "0:00"
        starts = page.evaluate("__gameDebug.campaign.stages.map(stage => stage.from)")

        # An exit without the chapter objective returns to the same chapter.
        page.evaluate("__gameDebug.S.dist = __gameDebug.campaign.stage().to")
        advance(page)
        assert page.locator("#chapterTitle").inner_text() == "还没完成目标"
        page.locator("#chapterNextBtn").click()
        assert page.evaluate("__gameDebug.S.dist") == 0

        assert go_until(page, 43)[1] == "playing"
        assert page.locator("#tipBox").filter(visible=True).count() == 0
        finish_long_route(page)
        assert "通过" in page.locator("#chapterTitle").inner_text()
        assert "★" in page.locator("#chapterDetail").inner_text()

        load(page, file)
        assert "继续第 2 段" in page.locator("#startBtn").inner_text()
        page.locator("#startBtn").click()
        chapter(page, "穿过老街")
        assert page.evaluate("__gameDebug.S.dist") == starts[1]
        finish_long_route(page)
        assert "通过" in page.locator("#chapterTitle").inner_text()
        assert "★" in page.locator("#chapterDetail").inner_text()
        page.locator("#chapterNextBtn").click()
        chapter(page, "甩开华强")

        finish_long_route(page)
        assert "逃脱成功" in page.locator("#chapterTitle").inner_text()
        assert "★" in page.locator("#chapterDetail").inner_text()
        assert page.evaluate("localStorage.getItem('haoge_street_escape_checkpoint_v1')") == "3"
        page.locator("#chapterNextBtn").click()
        assert page.evaluate("__gameDebug.S.dist") == 0
        assert not requests and not errors, (requests, errors)
        browser.close()
    print("Campaign used the selected cast, passed all three multi-wave stages, saved/resumed and rated stars.")


if __name__ == "__main__":
    main(Path(sys.argv[1]))
