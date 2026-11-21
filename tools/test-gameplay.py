import pathlib
import unittest

from playwright.sync_api import sync_playwright


ROOT = pathlib.Path(__file__).resolve().parents[1]
FRAME_CLOCK = """
(() => {
  let id = 0;
  let time = null;
  const pending = new Map();
  window.requestAnimationFrame = callback => {
    pending.set(++id, callback);
    return id;
  };
  window.cancelAnimationFrame = handle => pending.delete(handle);
  window.advanceGameFrames = count => {
    time ??= performance.now();
    for (let frame = 0; frame < count; frame++) {
      const callbacks = [...pending.values()];
      pending.clear();
      time += 40;
      for (const callback of callbacks) callback(time);
    }
  };
})();
"""
CARDS = "() => __gameDebug.scene.children.filter(o => o.userData.active && o.userData.kind === 'cert').length"


def advance(page, frames=1):
    page.evaluate("advanceGameFrames", frames)


def spawn_at(page, distance):
    page.evaluate("""distance => {
        const { S } = __gameDebug;
        S.dist = distance;
        S.spawnIn = S.nextGap;
        advanceGameFrames(1);
    }""", distance)


class Gameplay(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        playwright = sync_playwright().start()
        cls.addClassCleanup(playwright.stop)
        cls.browser = playwright.chromium.launch(
            channel="chrome", args=["--enable-unsafe-swiftshader"]
        )
        cls.addClassCleanup(cls.browser.close)

    def open_game(self, *, mobile=False):
        page = self.browser.new_page(
            offline=True,
            viewport={"width": 390, "height": 700} if mobile else {"width": 640, "height": 480},
            has_touch=mobile,
            is_mobile=mobile,
        )
        self.addCleanup(page.context.close)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        self.addCleanup(lambda: self.assertEqual(errors, []))
        page.add_init_script(FRAME_CLOCK)
        page.goto((ROOT / "index.html").as_uri() + "?seed=42")
        page.locator("#introSkip").click()
        return page

    def test_same_seed_repeats_opening_on_restart(self):
        page = self.open_game()
        layout = """() => __gameDebug.scene.children
          .filter(o => o.userData.active && o.userData.kind)
          .map(o => [o.userData.kind, ...o.position.toArray()]).sort()"""

        page.evaluate("Math.random = () => 0.2")
        page.locator("#startBtn").click()
        opening = page.evaluate(layout)
        self.assertTrue(opening)
        self.assertTrue(all(item[0] in {"melon", "gold", "cert"} for item in opening))

        page.keyboard.press("Space")
        page.evaluate("Math.random = () => 0.9")
        page.locator("#pauseRestartBtn").click()
        self.assertEqual(page.evaluate(layout), opening)

    def test_skill_stops_new_cards_for_300_meters(self):
        page = self.open_game()
        page.evaluate("""Object.assign(CONFIG, {
            goldLineChance: 0, piguaChance: 0, certSpawnChanceByTier: [0, 0, 0, 0]
        })""")
        page.locator("#startBtn").click()
        page.evaluate("__gameDebug.S.nextGoldLineDist = 2000")
        spawn_at(page, 300)
        page.evaluate("""() => {
            const card = __gameDebug.scene.children.find(o =>
                o.userData.active && o.userData.kind === 'cert');
            card.position.set(0, card.userData.baseY, -1);
        }""")
        advance(page)
        self.assertEqual(page.locator("#score").inner_text(), "40")
        page.locator("#skillBtn").click()
        advance(page)
        self.assertFalse(page.locator("#invulnTag").evaluate("el => el.classList.contains('hidden')"))

        remaining = page.evaluate(CARDS)
        before = page.evaluate("""() => __gameDebug.scene.children
          .filter(o => o.userData.active && o.userData.kind === 'cert').map(o => o.uuid)""")
        page.evaluate("CONFIG.certSpawnChanceByTier = [1, 1, 1, 1]")
        spawn_at(page, 599)
        self.assertEqual(page.evaluate(CARDS), remaining)

        spawn_at(page, 601)
        self.assertGreater(page.evaluate(CARDS), remaining)
        high_cards = page.evaluate("""before => __gameDebug.scene.children
          .filter(o => o.userData.active && o.userData.kind === 'cert' && !before.includes(o.uuid))
          .map(o => o.position.y)""", before)
        self.assertTrue(high_cards)
        self.assertTrue(all(height == 3.2 for height in high_cards))

    def test_first_tier_excludes_later_obstacles(self):
        page = self.open_game()
        page.locator("#startBtn").click()
        for distance in range(45, 245, 20):
            spawn_at(page, distance)
        kinds = page.evaluate("""() => __gameDebug.scene.children
          .filter(o => o.userData.active && o.userData.kind)
          .map(o => o.userData.kind)""")
        self.assertTrue(set(kinds) & {"cart", "pile", "person"})
        self.assertFalse(set(kinds) & {"pole", "stall", "tricycle"})

    def test_spending_a_card_rescues_last_chance(self):
        page = self.open_game()
        page.locator("#startBtn").click()
        page.evaluate("Object.assign(__gameDebug.S, {cards: 1, gap: 5})")
        advance(page)
        self.assertIn("放大招保命", page.locator("#bubble").inner_text())
        page.keyboard.press("e")
        advance(page)
        self.assertGreater(page.evaluate("__gameDebug.S.gap"), 9)
        self.assertEqual(page.evaluate("__gameDebug.S.cards"), 0)
        self.assertEqual(page.evaluate("__gameDebug.S.mode"), "playing")

    def test_pigua_moves_chaser_and_keeps_collision_live(self):
        page = self.open_game()
        page.evaluate("""Object.assign(CONFIG, {
          piguaChance: 1, goldLineChance: 0, goldPickupChance: 0, goldArcChance: 0
        })""")
        page.locator("#startBtn").click()
        spawn_at(page, 60)
        page.evaluate("""() => {
          const { scene, S } = __gameDebug;
          const melon = scene.children.find(o => o.userData.active && o.userData.kind === 'melon');
          melon.position.set(0, melon.userData.baseY, -4);
          S.nextGap = 100000;
        }""")
        advance(page)
        self.assertIn("你劈我瓜是吧", page.locator("#bubble").inner_text())
        snapshot = "() => [__gameDebug.S.dist, __gameDebug.S.gap, __gameDebug.chaser.position.z]"
        before = page.evaluate(snapshot)
        advance(page, 18)
        after = page.evaluate(snapshot)
        self.assertGreater(after[0], before[0])
        self.assertEqual(after[1], before[1])
        self.assertNotEqual(after[2], before[2])

        page.evaluate("""() => {
          const obstacle = __gameDebug.scene.children.find(o =>
            o.userData.active && ['cart', 'pile', 'person'].includes(o.userData.kind));
          obstacle.position.set(0, 0, -1);
        }""")
        advance(page)
        hit = page.evaluate(snapshot)
        self.assertAlmostEqual(hit[1], after[1] - 3.2)
        advance(page, 5)
        self.assertEqual(page.evaluate(snapshot)[1], hit[1])
        page.evaluate("CONFIG.piguaChance = 0")
        advance(page, 90)
        self.assertLess(page.evaluate(snapshot)[1], hit[1])

    def test_touch_buttons_and_running_gestures(self):
        page = self.open_game(mobile=True)
        page.locator("#startBtn").tap()
        page.locator("#pauseBtn").tap()
        self.assertTrue(page.locator("#pauseScreen").is_visible())
        page.locator("#resumeBtn").tap()

        cdp = page.context.new_cdp_session(page)

        def swipe(x, y, target_x, target_y):
            for kind, points in [
                ("touchStart", [{"x": x, "y": y}]),
                ("touchMove", [{"x": target_x, "y": target_y}]),
                ("touchEnd", []),
            ]:
                cdp.send("Input.dispatchTouchEvent", {"type": kind, "touchPoints": points})

        swipe(140, 500, 230, 500)
        advance(page, 5)
        self.assertGreater(page.evaluate("__gameDebug.player.position.x"), 0.3)
        swipe(150, 510, 150, 425)
        advance(page, 4)
        self.assertGreater(page.evaluate("__gameDebug.player.position.y"), 0.3)
        swipe(150, 425, 150, 510)
        advance(page, 4)
        self.assertLess(page.evaluate("__gameDebug.player.position.y"), 0.1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
