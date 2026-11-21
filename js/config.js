window.CONFIG = {
  lanes: [-1.7, 0, 1.7],
  laneWidth: 1.7,
  gravity: -28,
  jumpVel: 12.2,
  doubleJumpVel: 10.0,
  slideTime: 0.75,
  airSlideSpeed: 20,
  airSlideTime: 0.4,
  legTuckClearance: 0.5,
  legTuckTime: 0.45,
  slideLean: 1.5,
  slideLift: 0.18,
  baseSpeed: 11,
  maxSpeed: 31,
  accel: 0.13,
  startGap: 10,
  minGap: 4.6,
  catchGap: 5.0,
  hitGapPenalty: 3.2,
  // 正式追逃机制：华强逼近速度随距离/跑动距离动态上升，越接近越危险
  tensionDrift: 0.04,
  tensionDriftGain: 0.0001,
  tensionDriftMax: 0.16,
  tensionDriftCloseBonus: 0.04,
  // 华强距离条的危险区间：小于等于该值进入黄色/红色预警
  dangerGap: 6.5,
  // 保熟卡供应：分档随机率 + 分档保底间隔；2 档起卡片改为高空险位
  certGuaranteeMetersByTier: [200, 260, 360, 480],
  certRiskyFromTier: 2,
  certHighY: 3.2,
  certCooldownAfterSkill: 300,
  dangerWarnCooldown: 8,
  spawnZ: -50,
  killZ: 12,
  fallTime: 0.75,
  invulnTime: 0.4,
  // 计分：距离 1 米 = 0.1 分；普通西瓜 1 分，金西瓜 20 分，保熟卡 10 分
  distScoreDivisor: 10,
  melonScore: 1,
  goldMelonScore: 20,
  certScore: 10,
  certMax: 2,
  certSpawnChanceByTier: [0.22, 0.16, 0.10, 0.06],
  // 安全开场：前 45 米只出奖励道具，不出障碍
  safeOpenDist: 45,
  // 难度分档：0~250 新手 / 250~600 组合 / 600~1200 高压 / 1200+ 高手
  tierAt: [250, 600, 1200],
  tierGap: [
    [18, 28],
    [14, 24],
    [11, 20],
    [9, 16],
  ],
  // 横穿三轮车：横跨三条车道，可看准空隙换道或跳过去
  tricycleCrossTime: 2.6,
  tricycleSpan: 3.4,
  tricycleClearY: 1.37,
  // 极小概率：一列金西瓜连串出现，可连续吃到并叠加金西瓜语音
  goldLineChance: 0.02,
  // 保底：每 300 米至少强制出现一次金西瓜串
  goldLineGuaranteeMeters: 300,
  // 普通收集线和弧形线里单个西瓜变成金西瓜的概率
  goldPickupChance: 0.08,
  goldArcChance: 0.07,
  // 金西瓜串长度无固定上限：至少生成 minCount 个，之后每次有 continueChance 概率继续加一个
  goldLineMinCount: 4,
  goldLineContinueChance: 0.65,
  goldLineSpacing: 2.4,
  // 金西瓜连击窗口：窗口内吃到的多个金西瓜会依次触发多声“金西瓜”
  goldComboWindow: 1.2,
  skillPushGap: 5,
  skillCloseExtra: 1.5,
  skillInvulnTime: 2.5,
  skillBoostTime: 1.5,
  skillBoostSpeed: 6,
  sidekickTime: 1.4,
  // 开场镜头时长：先让郝哥和华强同框，再平滑切回跑酷视角
  camIntroTime: 1.8,
  camIntroBlendTime: 1.0,
  // 华强被大招撞飞：腾空翻滚飞退
  chaserFlyTime: 1.0,
  chaserFlyHeight: 5.5,
  chaserFlyBack: 6.5,
  chaserFlySide: 5,
  chaserFlyLoops: 2,
  chaserHitStun: 0.18,
  chaserReturnTime: 0.8,
  // 首局事件引导
  tipShowTime: 2.4,
  tipStartDelay: 0.8,
  // 晾衣杆：滑铲判定区较宽，进入后滑铲即安全；跳跃只在横杆附近判定
  poleSlideZone: 4.55,
  poleBarZone: 0.78,
  // 横杆中心 1.62、厚 0.09，下沿约 1.575，留一点余量
  poleJumpClear: 2.05,
  // 瓜摊：只能跳跃越过
  stallJumpClear: 1.95,
  stallZone: 2.21,
  // 死亡演出总时长：结束原声(8秒)从 endingAudioAt 播完时，摩托车正好出画并弹结算
  deathTime: 11.2,
  // 惨叫声之后萨日朗的播放时机（避开语音重叠）
  sarilangAt: 1.95,
  // 经过路人触发萨日朗：z 触发窗加宽，用概率替代冷却
  sarilangZone: 2.2,
  sarilangPassChance: 0.6,
  sarilangCooldown: 4,
  sarilangReactionTime: 1.2,
  sarilangHeadTime: 1.3,
  // 郝哥喊萨日朗的夸张反应幅度
  sarilangHeadYaw: 1.4,
  sarilangLean: 0.28,
  sarilangArmLift: -2.2,
  sarilangArmSide: 0.45,
  sarilangPersonJump: 0.6,
  sarilangArmFlail: 0.35,
  sarilangHeadShake: 0.35,
  // 路边一家三口：稀疏出现，华强路过时必喊“哎华强！”
  familySpawnStart: 60,
  familySpawnGap: [150, 200],
  familyTriggerZone: 1.6,
  familyWaveTime: 1.2,
  familySpawnZ: -50,
  familySideX: [3.6, 4.8],
  // 结束原声音频开始播放的时间（游戏死亡演出内秒数，可调）
  endingAudioAt: 3.2,
  // 非首次结尾：镜头切到华强特写后可跳过
  endingSkipAt: 8.4,
  // 第二波喷血：与郝哥惨叫同步
  deathBlood2At: 0.62,
  // 肚子血喷泉：捅刀瞬间持续上喷，总喷血动画至少 9 秒
  bloodFountainTime: 9.0,
  bloodSprayTotal: 9.5,
  bloodFountainPerFrame: 32,
  bloodFountainGravity: 7.5,
  bloodJetHeight: 2.4,
  bloodJetGrow: 0.25,
  // “你劈我瓜是吧？”条件触发 + 华强劈瓜演出
  piguaChance: 0.3,
  piguaRadiusZ: 4.5,
  piguaRadiusX: 2.2,
  piguaGuard: 4.0,
  piguaWarnTime: 0.5,
  piguaAnimTime: 2.4,
  piguaDashTime: 0.45,
  piguaRaiseTime: 0.8,
  piguaSwingTime: 1.05,
  piguaImpactTime: 0.92,
  piguaHoldTime: 1.6,
  piguaHeadTurnIn: 0.35,
  piguaHeadYaw: 1.2,
  piguaHeadLean: 0.12,
  piguaHeadReturn: 0.5,
  // 濒死保护：被必死一击命中且还有大招卡时，进入最后机会窗口（慢动作内秒数）
  lastChanceTime: 1.5,
};
