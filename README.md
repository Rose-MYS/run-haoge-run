# 郝哥快跑 · Run Haoge Run

《郝哥快跑》是一款 3D 三车道追逃游戏。郝哥要从市集一路跑过老街和后巷，完成每段目标并抵达出口。

## 开始游玩

- [GitHub Pages 在线试玩](https://rose-mys.github.io/run-haoge-run/)
- 离线游玩请下载或克隆仓库，双击 `index.html` 或 Windows 下的 `打开游戏.bat`。
- 分为市集、老街、后巷三段逃脱，每段包含 3 个递增波次与独立过关目标，通过后记录检查点并评定 1~3 星；主菜单支持一键切换「分段逃脱 / 无尽模式」。分段版使用郝哥面部精修稿与持砍瓜刀的刘华强原片精修审核稿，搭配纯 WebAudio 动态追逐 BGM。首次打开会下载角色包，两人加载完成后即可开跑。

| 操作 | 键盘 | 触屏 |
| --- | --- | --- |
| 换道 | ← → 或 A / D | 左右滑 |
| 绿灯时确认转弯 | 按对应的 ← 或 → | 向对应方向滑，或点转弯按钮 |
| 跳跃和二段跳 | ↑ 或 W | 上滑 |
| 滑铲和快速落地 | ↓ 或 S | 下滑 |
| 暂停 / 继续 | 空格、Esc 或 P | 暂停按钮 |
| 释放保熟技能 | E | 「保熟！」按钮 |
| 静音 | M | 扬声器按钮 |

## 开发

- 运行 `node tools/serve-dev.js`，打开 `http://127.0.0.1:8787/`。加 `?seed=42` 可复现布局，`?campaign=0` 可进入旧无尽模式。
- 运行 `node tools/build-single-file.js` 可生成 `dist/郝哥快跑.html`。也可以将新路径作为第一个参数。
- 运行 `python tools/test-gameplay.py` 执行玩法回归，或运行 `python tools/test-street-campaign.py index.html` 验证分段流程。需要本机 Chrome 和 Python Playwright。

各段长度、弯道和障碍配置位于 `js/street-campaign.js`，街景位于 `js/street-art.js`，主循环和玩法逻辑位于 `js/game.js`。GitHub Pages 从 `main` 分支根目录发布。

公开版随游戏提供两份现役模型的运行数据及合成音效。独立脸部贴图、录音、参考素材和完整离线成品由作者在本机管理。Three.js 的第三方许可见 [MIT 许可](js/vendor/THREE-LICENSE.txt)。
