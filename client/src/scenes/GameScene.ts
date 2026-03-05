/* eslint-disable @typescript-eslint/no-explicit-any */
import Phaser from 'phaser';
import * as Colyseus from 'colyseus.js';
import { NetworkClient } from '../network/ColyseusClient';
import { InputManager } from '../network/InputManager';
import { HUD } from '../ui/HUD';
import { SealFX } from '../fx/SealFX';
import { CargoSprite } from '../objects/CargoSprite';
import { GameOverlay } from '../ui/GameOverlay';
import { EnemySprite } from '../objects/EnemySprite';
import { ProjectileSprite } from '../objects/ProjectileSprite';
import { ToxicZone } from '../objects/ToxicZone';
import { CombatFX } from '../fx/CombatFX';
import { CraftingPanel } from '../ui/CraftingPanel';
import { AdnNodeSprite } from '../objects/AdnNodeSprite';
import { SEAL_TIME, CARGO_COST } from '@evo/shared';
import { getWalls, getZone, inZone, getMapData } from '../mapData';
import { SPRITE_WALL_VARIANTS } from '../assets/spriteKeys';
import { AudioManager } from '../audio/AudioManager';
import { OnboardingSystem } from '../ui/OnboardingSystem';
import { HoldProgressBar } from '../fx/HoldProgressBar';
import { PlayerBody } from '../objects/PlayerBody';

const WORLD_SIZE = 2000;
const DASH_SPEED_MULT = 2;
const DASH_DURATION_MS = 200;
const DASH_COOLDOWN_MS = 1500;
const BASE_SPEED = 100; // px/s — matches server speed 4.2 × 100
const BULLET_SPEED = 800;
const FIRE_RATE_MS = Math.round(1000 / 2.2); // ~454ms between shots

// Zone bounds are read from map JSON via getZone() / inZone() at runtime

// Remote player representation
interface RemotePlayer {
  body: PlayerBody;
  targetX: number;
  targetY: number;
}

export class GameScene extends Phaser.Scene {
  // Network
  private room!: Colyseus.Room;
  private inputManager!: InputManager;
  private hud!: HUD;
  private sealFX!: SealFX;
  private overlay!: GameOverlay;

  // Local player
  private player!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private localBody!: PlayerBody;
  private dashActive = false;
  private dashEndTime = 0;
  private dashCooldownEnd = 0;
  private lastFireTime = 0;

  // Bullets group (local visual only)
  private bullets!: Phaser.Physics.Arcade.Group;

  // Remote players
  private remotePlayers = new Map<string, RemotePlayer>();

  // Cargo sprites
  private cargoSprites = new Map<string, CargoSprite>();

  // Enemy sprites
  private enemySprites = new Map<string, EnemySprite>();

  // Projectile sprites
  private projectileSprites = new Map<string, ProjectileSprite>();

  // Toxic zones
  private toxicZones = new Map<string, ToxicZone>();

  // ADN node sprites
  private adnNodeSprites = new Map<string, AdnNodeSprite>();

  // E key (registered once)
  private eKey!: Phaser.Input.Keyboard.Key;
  private fKey!: Phaser.Input.Keyboard.Key;
  private rKey!: Phaser.Input.Keyboard.Key;
  private tKey!: Phaser.Input.Keyboard.Key;
  private qKey!: Phaser.Input.Keyboard.Key;
  private lastWarpAttempt: number = 0;

  // Wall physics group
  private wallGroup!: Phaser.Physics.Arcade.StaticGroup;

  // Crafting panel
  private craftingPanel!: CraftingPanel;

  // Seal hold state
  private sealHoldStart: number | null = null;
  private sealInProgress = false;
  private lastSealSent = 0;
  private reviveTarget: string | null = null;
  private reviveStartTime: number = 0;
  private reviveDuration: number = 5000;

  // Progress bars for hold actions
  private sealProgressBar?: HoldProgressBar;
  private reviveProgressBar?: HoldProgressBar;

  // Whether we've already sent 'deliver' for the current entry into extraction zone
  private deliverSent = false;

  // Ready overlay elements
  private readyOverlay!: Phaser.GameObjects.Container;
  private readyCountText!: Phaser.GameObjects.Text;
  private gameHasStarted = false;

  // Audio & onboarding
  private audio!: AudioManager;
  private onboarding!: OnboardingSystem;
  private wasExtracting = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    const net = NetworkClient.getInstance();
    const room = net.getRoom();

    if (!room) {
      this.scene.start('LobbyScene');
      return;
    }
    this.room = room;

    // ── World setup ────────────────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
    this._buildMap();

    // ── Local player sprite (32×32 green rect) ─────────────────────────────────
    const startX = 1000;
    const startY = 1000;

    this.player = this.physics.add.image(startX, startY, 'player_base');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.setAlpha(0); // physics body invisible — PlayerBody is the visual

    this.localBody = new PlayerBody(this, startX, startY, 0x00ff66, 10);

    // Collide local player with static wall group
    this.physics.add.collider(this.player, this.wallGroup);

    // ── Bullets ────────────────────────────────────────────────────────────────
    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 50,
    });

    // ── Camera ─────────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // ── Systems ────────────────────────────────────────────────────────────────
    this.inputManager = new InputManager(this, this.room);
    const displayCode = net.getRoomCode() || this.room.roomId || '';
    this.hud = new HUD(this, this.room, displayCode);
    this.sealFX = new SealFX(this);
    this.overlay = new GameOverlay(this);

    // ── Remote players ─────────────────────────────────────────────────────────
    this._setupRemotePlayers();

    // ── Cargo sprites ──────────────────────────────────────────────────────────
    this._setupCargoSprites();

    // ── Enemy sprites ──────────────────────────────────────────────────────────
    this._setupEnemySprites();

    // ── Projectile sprites ─────────────────────────────────────────────────────
    this._setupProjectileSprites();

    // ── Server messages ────────────────────────────────────────────────────────
    this._setupServerMessages();

    // ── E key (registered once) ────────────────────────────────────────────────
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.fKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.rKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.tKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    this.qKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

    // ── Crafting panel ─────────────────────────────────────────────────────────
    this.craftingPanel = new CraftingPanel(this, this.room);

    // ── ADN node sprites ───────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.room.state.adnNodes.onAdd((node: any, id: string) => {
      const sprite = new AdnNodeSprite(this, node.x as number, node.y as number);
      this.adnNodeSprites.set(id, sprite);

      node.onChange(() => {
        const s = this.adnNodeSprites.get(id);
        if (s) s.setPosition(node.x as number, node.y as number);
      });
    });

    this.room.state.adnNodes.onRemove((_node: unknown, id: string) => {
      const sprite = this.adnNodeSprites.get(id);
      if (sprite) {
        sprite.destroy();
        this.adnNodeSprites.delete(id);
      }
    });

    // ── Mouse click → attack (melee or ranged depending on build) ─────────────
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (!ptr.leftButtonDown()) return;
      const serverMe = this.room?.state?.players?.get(this.room.sessionId);
      if (serverMe?.isRanged) this._tryShoot();
      else this._tryMelee();
    });

    // ── Audio & Onboarding ─────────────────────────────────────────────────────
    this.audio = new AudioManager();
    this.onboarding = new OnboardingSystem(this);
    // onboarding disabled

    // ── Ready overlay ──────────────────────────────────────────────────────────
    this._setupReadyOverlay();
  }

  update(_time: number, delta: number): void {
    if (!this.player || !this.inputManager) return;

    const input = this.inputManager.update(this.player.x, this.player.y);

    // ── Dash ───────────────────────────────────────────────────────────────────
    const now = Date.now();
    if (input.dash && !this.dashActive && now >= this.dashCooldownEnd) {
      this.dashActive = true;
      this.dashEndTime = now + DASH_DURATION_MS;
      this.dashCooldownEnd = now + DASH_COOLDOWN_MS;
    }
    if (this.dashActive && now >= this.dashEndTime) {
      this.dashActive = false;
    }

    const localPlayer = this.room.state.players.get(this.room.sessionId);
    const amDowned = localPlayer?.isDown ?? false;

    const speedMult = this.dashActive ? DASH_SPEED_MULT : 1;

    // ── Movement (bloqueado si downed) ────────────────────────────────────────
    const serverPlayerForMove = this.room.state.players.get(this.room.sessionId);
    const isCarrying = serverPlayerForMove?.isCarrying ?? false;
    const carryMult = isCarrying ? 0.45 : 1;

    if (amDowned) {
      this.player.setVelocity(0, 0);
    } else {
      let dx = input.dx;
      let dy = input.dy;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        dx /= len;
        dy /= len;
      }
      const targetVx = dx * BASE_SPEED * speedMult * carryMult;
      const targetVy = dy * BASE_SPEED * speedMult * carryMult;
      this.player.setVelocity(targetVx, targetVy);
      this.player.setRotation(input.facing);
    }

    if (input.shooting && this.gameHasStarted && !amDowned && !isCarrying) {
      const serverMe = this.room.state.players.get(this.room.sessionId);
      if (serverMe?.isRanged) {
        this._tryShoot();
      } else {
        this._tryMelee();
      }
    }

    // ── Remote players (interpolate) ─────────────────────────────────────────
    const lerpFactor = 0.2;
    this.remotePlayers.forEach((rp) => {
      const cx = Phaser.Math.Linear(rp.body.container.x, rp.targetX, lerpFactor);
      const cy = Phaser.Math.Linear(rp.body.container.y, rp.targetY, lerpFactor);
      rp.body.setPosition(cx, cy);
    });

    // ── HUD ────────────────────────────────────────────────────────────────────
    this.hud.update(this.room.sessionId);

    // ── Server reconcile ──────────────────────────────────────────────────────
    // Client-side prediction: only hard-snap when the server disagrees significantly.
    // For small diffs, gently lerp — this hides network latency for the local player.
    const RECONCILE_SNAP_THRESHOLD = 120; // px — hard snap if too far off
    const RECONCILE_LERP = 0.12; // gentle correction factor per frame
    const serverPlayer = this.room.state.players.get(this.room.sessionId);
    if (serverPlayer) {
      const inWall = getWalls().some(
        (w) =>
          serverPlayer.x >= w.x &&
          serverPlayer.x <= w.x + w.w &&
          serverPlayer.y >= w.y &&
          serverPlayer.y <= w.y + w.h
      );
      if (!inWall) {
        const diffX = serverPlayer.x - this.player.x;
        const diffY = serverPlayer.y - this.player.y;
        const dist = Math.sqrt(diffX * diffX + diffY * diffY);
        if (dist > RECONCILE_SNAP_THRESHOLD) {
          // Too far off — hard snap
          this.player.x = serverPlayer.x;
          this.player.y = serverPlayer.y;
        } else if (dist > 2) {
          // Small drift — nudge gently toward server
          this.player.x += diffX * RECONCILE_LERP;
          this.player.y += diffY * RECONCILE_LERP;
        }
      }

      // Sync visual body position + rotation
      this.localBody.setPosition(this.player.x, this.player.y);
      this.localBody.setRotation(this.player.rotation);

      // ── Auto-deliver when in extraction zone ──────────────────────────────
      const inExtraction = inZone('extraction', serverPlayer.x, serverPlayer.y);

      if (inExtraction && serverPlayer.isCarrying && !this.deliverSent) {
        this.deliverSent = true;
        this.room.send('deliver', {});
      }
      if (!inExtraction) {
        this.deliverSent = false;
      }

      // ── E key logic ───────────────────────────────────────────────────────
      const inHub = inZone('hub', serverPlayer.x, serverPlayer.y);

      // Q → usar poción
      if (Phaser.Input.Keyboard.JustDown(this.qKey)) {
        this.room.send('usePotion', {});
      }

      // T → warp to spawn (panic button, 30s cooldown)
      if (Phaser.Input.Keyboard.JustDown(this.tKey) && now - this.lastWarpAttempt > 1000) {
        this.lastWarpAttempt = now;
        this.room.send('warpToSpawn', {});
      }

      const eJustDown = Phaser.Input.Keyboard.JustDown(this.eKey);
      const eDown = this.eKey?.isDown ?? false;

      // Toggle crafting panel with E (JustDown) when in hub
      if (inHub && eJustDown && this.gameHasStarted) {
        this.craftingPanel.toggle();
      }

      // Pickup dropped cargo with E (JustDown) when not carrying and near a dropped box
      if (!inHub && eJustDown && !serverPlayer.isCarrying && !amDowned) {
        const PICKUP_RANGE = 48;
        let nearestDist = PICKUP_RANGE;
        let hasNearby = false;
        this.room.state.cargo.forEach((c: any) => {
          if (c.carrierId !== '') return;
          const dx = serverPlayer.x - c.x;
          const dy = serverPlayer.y - c.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < nearestDist) {
            nearestDist = d;
            hasNearby = true;
          }
        });
        if (hasNearby) {
          this.room.send('pickupCargo', {});
        }
      }

      // Seal cargo hold (F held, in hub, panel closed, has enough ADN)
      const currentSealCost = CARGO_COST + (this.room.state.timers?.cargoSealed ?? 0) * 10;
      const globalAdn = (this.room.state.timers as any)?.adn ?? 0;
      if (
        this.fKey.isDown &&
        inHub &&
        !this.craftingPanel.isVisible() &&
        !serverPlayer.isCarrying &&
        globalAdn < currentSealCost
      ) {
        // No tiene ADN suficiente — mostrar hint (una vez por segundo)
        if (this.sealHoldStart === null) {
          this.sealHoldStart = now; // reuse para throttle
          const txt = this.add
            .text(
              serverPlayer.x,
              serverPlayer.y - 20,
              `ADN insuficiente (${globalAdn}/${currentSealCost})`,
              {
                fontSize: '13px',
                color: '#ff8800',
                fontFamily: 'monospace',
                backgroundColor: '#00000088',
                padding: { x: 6, y: 3 },
              }
            )
            .setOrigin(0.5)
            .setDepth(50);
          this.tweens.add({
            targets: txt,
            y: serverPlayer.y - 60,
            alpha: 0,
            duration: 1500,
            onComplete: () => txt.destroy(),
          });
        }
      } else if (
        this.fKey.isDown &&
        inHub &&
        !this.craftingPanel.isVisible() &&
        !serverPlayer.isCarrying &&
        globalAdn >= currentSealCost
      ) {
        if (this.sealHoldStart === null) {
          this.sealHoldStart = now;
          this.sealInProgress = true;
          this.sealProgressBar = new HoldProgressBar(this, 'Sellando...');
        } else if (
          this.sealInProgress &&
          now - this.sealHoldStart >=
            (SEAL_TIME / ((serverPlayer as any).interactSpeed ?? 1.0)) * 1000 &&
          now - this.lastSealSent > 2000
        ) {
          this.sealInProgress = false;
          this.lastSealSent = now;
          this.sealProgressBar?.destroy();
          this.sealProgressBar = undefined;
          this.room.send('sealCargo', {});
        }
        if (this.sealInProgress && this.sealProgressBar && this.sealHoldStart !== null) {
          this.sealProgressBar.update(
            this.player.x,
            this.player.y,
            (now - this.sealHoldStart) / (SEAL_TIME * 1000)
          );
        }
      } else if (!this.fKey.isDown || !inHub || this.craftingPanel.isVisible()) {
        this.sealHoldStart = null;
        this.sealInProgress = false;
        this.sealProgressBar?.destroy();
        this.sealProgressBar = undefined;
      }

      // ── Revive con R (hold, cerca de aliado downed) ───────────────────────
      if (!amDowned && this.rKey.isDown) {
        let nearestDowned: string | null = null;
        let nearestDist = 48; // px máximo para revivir (igual que servidor REVIVE_RANGE)
        this.room.state.players.forEach((p: any, sid: string) => {
          if (sid === this.room.sessionId || !p.isDown) return;
          const dx = this.player.x - p.x;
          const dy = this.player.y - p.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < nearestDist) {
            nearestDist = d;
            nearestDowned = sid;
          }
        });
        if (nearestDowned && !this.reviveTarget) {
          this.reviveTarget = nearestDowned;
          this.room.send('startRevive', { targetId: nearestDowned });
        }
        if (this.reviveTarget && this.reviveProgressBar) {
          const reviveProgress = Math.min(
            1,
            (Date.now() - this.reviveStartTime) / this.reviveDuration
          );
          this.reviveProgressBar.update(this.player.x, this.player.y, reviveProgress);
        }
      } else if (!this.rKey.isDown && this.reviveTarget) {
        this.room.send('cancelRevive', {});
        this.reviveTarget = null;
      }
    }

    // ── Onboarding update ─────────────────────────────────────────────────────
    if (serverPlayer) {
      const isExtracting = this.room.state.timers?.isExtracting ?? false;
      if (isExtracting && !this.wasExtracting) {
        this.audio.playCountdownStart();
      }
      this.wasExtracting = isExtracting;

      this.onboarding.update(
        {
          adn: serverPlayer.adn,
          x: serverPlayer.x,
          y: serverPlayer.y,
          isCarrying: serverPlayer.isCarrying,
        },
        { cargoDelivered: this.room.state.cargoDelivered ?? 0, timers: { isExtracting } }
      );
    }

    // ── Update cargo sprites ──────────────────────────────────────────────────
    this.room.state.cargo.forEach((c: { x: number; y: number; carrierId: string }, id: string) => {
      const sprite = this.cargoSprites.get(id);
      if (sprite) sprite.update(c.x, c.y, c.carrierId);
    });

    // ── Colisión visual balas↔enemigos ────────────────────────────────────────
    this.bullets.getChildren().forEach((b) => {
      const bullet = b as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
      if (!bullet.active) return;
      this.enemySprites.forEach((sprite) => {
        const pos = sprite.getPosition();
        const dx = bullet.x - pos.x;
        const dy = bullet.y - pos.y;
        if (Math.sqrt(dx * dx + dy * dy) < 24) {
          bullet.setActive(false).setVisible(false);
          bullet.setVelocity(0, 0);
        }
      });
    });
  }

  // ─── Map (placeholder geometry) ──────────────────────────────────────────────

  private _buildMap(): void {
    const g = this.add.graphics();

    // Background: tiled floor texture
    this.add
      .tileSprite(0, 0, WORLD_SIZE, WORLD_SIZE, 'bg_floor')
      .setOrigin(0, 0)
      .setDepth(0)
      .setTint(0x8ab89a); // slight greenish tint for lab feel

    // Second floor layer: rotated + offset to break tile repetition
    this.add
      .tileSprite(0, 0, WORLD_SIZE * 1.5, WORLD_SIZE * 1.5, 'bg_floor')
      .setOrigin(0, 0)
      .setDepth(0)
      .setTilePosition(180, 180)
      .setAlpha(0.18)
      .setTint(0x446644)
      .setAngle(22);

    // Draw zones from map JSON
    const zoneStyles: Record<string, { color: number; label: string; textColor: string }> = {
      hub: {
        color: 0x1a4a1a,
        label: '\nHUB\nE → Evolucionar\nF → Sellar Carga',
        textColor: '#2aff6a',
      },
      zoneA: { color: 0x4a1a1a, label: '', textColor: '#ff4a4a' },
      zoneB: { color: 0x1a1a4a, label: '', textColor: '#4a8aff' },
      extraction: { color: 0x4a4a00, label: 'EXTRACCIÓN\nEntregá aquí', textColor: '#ffff44' },
    };
    // ── Zone overlays (depth 1, above floor) ─────────────────────────────────
    const zoneG = this.add.graphics().setDepth(1);
    for (const zone of getMapData().zones) {
      const style = zoneStyles[zone.name];
      if (!style) continue;

      // Filled tint — subtle, mostly transparent
      zoneG.fillStyle(style.color, 0.5);
      zoneG.fillRect(zone.x, zone.y, zone.w, zone.h);

      // Solid border so the boundary is unmistakable
      zoneG.lineStyle(3, style.color, 0.85);
      zoneG.strokeRect(zone.x, zone.y, zone.w, zone.h);

      // Zone label (only for hub and extraction)
      if (style.label) {
        this._label(zone.x + zone.w / 2, zone.y + 50, style.label, style.textColor);
      }
    }

    // Grid (very faint, above floor below zones)
    g.lineStyle(1, 0xffffff, 0.03);
    for (let x = 0; x <= WORLD_SIZE; x += 100) g.lineBetween(x, 0, x, WORLD_SIZE);
    for (let y = 0; y <= WORLD_SIZE; y += 100) g.lineBetween(0, y, WORLD_SIZE, y);
    g.setDepth(1);

    // ── Static walls ───────────────────────────────────────────────────────
    this.wallGroup = this.physics.add.staticGroup();
    for (const w of getWalls()) {
      const wallKey = SPRITE_WALL_VARIANTS[Math.floor(Math.random() * SPRITE_WALL_VARIANTS.length)];
      const wallRect = this.add.tileSprite(w.x, w.y, w.w, w.h, wallKey).setOrigin(0, 0);
      wallRect.setDepth(2);
      this.physics.add.existing(wallRect, true);
      this.wallGroup.add(wallRect);
    }
  }

  private showToast(message: string, color = '#ffffff'): void {
    const cam = this.cameras.main;
    const x = cam.scrollX + cam.width / 2;
    const y = cam.scrollY + cam.height * 0.2;
    const txt = this.add
      .text(x, y, message, {
        fontSize: '15px',
        color,
        fontFamily: 'monospace',
        backgroundColor: '#00000099',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(200);
    this.tweens.add({
      targets: txt,
      y: y - 40,
      alpha: 0,
      duration: 2000,
      onComplete: () => txt.destroy(),
    });
  }

  private _label(x: number, y: number, text: string, color: string): void {
    this.add
      .text(x, y, text, {
        fontSize: '14px',
        color,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        backgroundColor: '#00000055',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(1);
  }

  // ─── Remote players ───────────────────────────────────────────────────────────

  private _setupRemotePlayers(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.room.state.players.onAdd((playerState: any, sessionId: string) => {
      if (sessionId === this.room.sessionId) return;

      const body = new PlayerBody(
        this,
        playerState.x as number,
        playerState.y as number,
        0x4488ff,
        10
      );

      const remote: RemotePlayer = {
        body,
        targetX: playerState.x as number,
        targetY: playerState.y as number,
      };
      this.remotePlayers.set(sessionId, remote);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      playerState.onChange(() => {
        const rp = this.remotePlayers.get(sessionId);
        if (rp) {
          rp.targetX = playerState.x as number;
          rp.targetY = playerState.y as number;
          const ids: string[] = [];
          for (let i = 0; i < playerState.equippedParts.length; i++)
            ids.push(playerState.equippedParts[i]);
          rp.body.updateEquipped(ids);
        }
      });
    });

    this.room.state.players.onRemove((_playerState: unknown, sessionId: string) => {
      const rp = this.remotePlayers.get(sessionId);
      if (rp) {
        rp.body.destroy();
        this.remotePlayers.delete(sessionId);
      }
    });
  }

  // ─── Cargo sprites ────────────────────────────────────────────────────────────

  private _setupCargoSprites(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.room.state.cargo.onAdd((c: any, id: string) => {
      const sprite = new CargoSprite(this, id, c.x as number, c.y as number);
      this.cargoSprites.set(id, sprite);
    });

    this.room.state.cargo.onRemove((_c: unknown, id: string) => {
      const sprite = this.cargoSprites.get(id);
      if (sprite) {
        sprite.destroy();
        this.cargoSprites.delete(id);
      }
    });
  }

  // ─── Enemy sprites ────────────────────────────────────────────────────────────

  private _setupEnemySprites(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.room.state.enemies.onAdd((enemy: any, id: string) => {
      const sprite = new EnemySprite(this, enemy);
      this.enemySprites.set(id, sprite);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enemy.onChange(() => {
        const s = this.enemySprites.get(id);
        if (s) s.update(enemy);
      });
    });

    this.room.state.enemies.onRemove((enemy: any, id: string) => {
      const sprite = this.enemySprites.get(id);
      if (sprite) {
        const pos = sprite.getPosition();
        CombatFX.showEnemyDeath(this, pos.x, pos.y);
        sprite.destroy();
        this.enemySprites.delete(id);
      }
    });
  }

  // ─── Projectile sprites ───────────────────────────────────────────────────────

  private _setupProjectileSprites(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.room.state.projectiles.onAdd((proj: any, id: string) => {
      const sprite = new ProjectileSprite(this, proj.x as number, proj.y as number);
      this.projectileSprites.set(id, sprite);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      proj.onChange(() => {
        const s = this.projectileSprites.get(id);
        if (s) s.update(proj.x as number, proj.y as number);
      });
    });

    this.room.state.projectiles.onRemove((_proj: unknown, id: string) => {
      const sprite = this.projectileSprites.get(id);
      if (sprite) {
        sprite.destroy();
        this.projectileSprites.delete(id);
      }
    });
  }

  // ─── Server messages ──────────────────────────────────────────────────────────

  private _setupServerMessages(): void {
    // Seal result
    this.room.onMessage(
      'sealResult',
      (msg: {
        success: boolean;
        cargoId?: string;
        reason?: string;
        cost?: number;
        nextCost?: number;
      }) => {
        const serverPlayer = this.room.state.players.get(this.room.sessionId);
        const px = serverPlayer?.x ?? this.player.x;
        const py = serverPlayer?.y ?? this.player.y;
        if (msg.success) {
          this.sealFX.showSealSuccess(px, py);
          if (msg.nextCost) this.showToast(`Próxima carga: ${msg.nextCost} ADN`, '#ffdd44');
        } else if (msg.reason) {
          const reasonMap: Record<string, string> = {
            insufficient_adn: `ADN insuficiente (necesitás ${msg.cost ?? '?'})`,
            not_in_hub: 'Tenés que estar en el Hub',
            already_carrying: 'Ya llevás una carga',
            rate_limited: 'Esperá un momento',
          };
          const label = reasonMap[msg.reason] ?? msg.reason;
          const txt = this.add
            .text(px, py - 20, `✗ ${label}`, {
              fontSize: '13px',
              color: '#ff4444',
              fontFamily: 'monospace',
              backgroundColor: '#00000088',
              padding: { x: 6, y: 3 },
            })
            .setOrigin(0.5)
            .setDepth(50);
          this.tweens.add({
            targets: txt,
            y: py - 60,
            alpha: 0,
            duration: 2200,
            onComplete: () => txt.destroy(),
          });
        }
      }
    );

    // Game over
    this.room.onMessage(
      'gameOver',
      (msg: {
        win: boolean;
        reason?: 'wipe' | 'timeout';
        stats?: { runTime: number; cargoDelivered: number };
      }) => {
        this.overlay.show(msg);
      }
    );

    // ADN pickup
    this.room.onMessage('adnPickup', () => {
      this.audio.playPickup();
    });

    // Craft result
    // ── Equip changes → update local PlayerBody visuals ──────────────────────
    this.room.state.players.onAdd((playerState: any, sessionId: string) => {
      if (sessionId !== this.room.sessionId) return;
      // Listen for equippedParts changes on local player
      playerState.equippedParts.onChange(() => {
        const ids: string[] = [];
        for (let i = 0; i < playerState.equippedParts.length; i++)
          ids.push(playerState.equippedParts[i]);
        this.localBody.updateEquipped(ids);
      });
      // Also apply current state immediately (on reconnect)
      const ids: string[] = [];
      for (let i = 0; i < playerState.equippedParts.length; i++)
        ids.push(playerState.equippedParts[i]);
      this.localBody.updateEquipped(ids);
    });

    this.room.onMessage('craftResult', (msg: { success: boolean }) => {
      if (msg.success) this.audio.playCraft();
    });

    // Player hit by enemy or toxic
    this.room.onMessage(
      'playerHit',
      (msg: {
        sessionId?: string;
        damage: number;
        source?: string;
        hp: number;
        maxHp: number;
        knockbackX?: number;
        knockbackY?: number;
      }) => {
        // Determine which player was hit
        const isLocalPlayer = !msg.sessionId || msg.sessionId === this.room.sessionId;
        let px: number;
        let py: number;

        if (isLocalPlayer) {
          const serverPlayer = this.room.state.players.get(this.room.sessionId);
          px = serverPlayer?.x ?? this.player.x;
          py = serverPlayer?.y ?? this.player.y;
          this.audio.playHurt();
          // Apply knockback visual
          if (msg.knockbackX || msg.knockbackY) {
            this.player.setVelocity(
              this.player.body.velocity.x + (msg.knockbackX ?? 0) * 8,
              this.player.body.velocity.y + (msg.knockbackY ?? 0) * 8
            );
          }
        } else {
          const remote = this.remotePlayers.get(msg.sessionId!);
          if (!remote) return; // unknown player, ignore
          px = remote.body.container.x;
          py = remote.body.container.y;
        }

        if (msg.source === 'toxic') {
          CombatFX.showToxicHit(this, px, py);
        } else {
          CombatFX.showPlayerHit(this, px, py);
        }
        // Show floating damage number in red
        if (msg.damage > 0) {
          CombatFX.showHitNumber(this, px, py - 10, msg.damage, false, '#ff4444');
        }
      }
    );

    // Revive progress bar messages
    this.room.onMessage(
      'reviveStarted',
      (msg: { reviverId: string; targetId: string; duration: number }) => {
        if (msg.reviverId === this.room.sessionId) {
          this.reviveProgressBar?.destroy();
          this.reviveProgressBar = new HoldProgressBar(this, 'Reviviendo...');
          this.reviveStartTime = Date.now();
          this.reviveDuration = msg.duration;
        }
      }
    );

    this.room.onMessage('reviveCancelled', (msg: { reviverId: string }) => {
      if (msg.reviverId === this.room.sessionId) {
        this.reviveProgressBar?.destroy();
        this.reviveProgressBar = undefined;
      }
    });

    this.room.onMessage(
      'reviveComplete',
      (msg: { reviverId: string; targetId: string; hp: number }) => {
        if (msg.reviverId === this.room.sessionId) {
          this.reviveProgressBar?.destroy();
          this.reviveProgressBar = undefined;
          this.reviveTarget = null;
        }
      }
    );

    // Per-hit damage numbers (melee + ranged, with crit)
    this.room.onMessage(
      'enemyHit',
      (msg: {
        x: number;
        y: number;
        damage: number;
        isCrit: boolean;
        killed: boolean;
        enemyId: string;
      }) => {
        if (!msg.killed) {
          CombatFX.showHitNumber(this, msg.x, msg.y - 10, msg.damage, msg.isCrit);
        }
      }
    );

    // Enemy killed — play death FX (damage number shown by enemyHit)
    this.room.onMessage('enemyKilled', (msg: { enemyId: string; x: number; y: number }) => {
      this.audio.playEnemyDeath();
      CombatFX.showEnemyDeath(this, msg.x, msg.y);
    });

    // Toxic zones initial update
    this.room.onMessage('potionUsed', (msg: { hp: number; potions: number }) => {
      this.showToast(`💊 +60 HP  (${msg.potions} left)`, '#88ff88');
    });
    this.room.onMessage('potionEmpty', () => this.showToast('💊 Sin pociones', '#ff8844'));
    this.room.onMessage('potionFull', () => this.showToast('💊 Ya tenés HP máximo', '#aaaaaa'));
    this.room.onMessage('potionDropped', (msg: { potions: number }) => {
      this.showToast(`💊 ¡Poción del boss! (${msg.potions} total)`, '#ffff44');
    });

    this.room.onMessage('warped', () => {
      this.showToast('⚡ Teletransportado al spawn', '#7af');
    });
    this.room.onMessage('warpDenied', (msg: { cooldownLeft: number }) => {
      this.showToast(`T — cooldown ${msg.cooldownLeft}s`, '#f84');
    });

    this.room.onMessage(
      'toxicZonesUpdate',
      (msg: {
        zones: Array<{
          id: string;
          x: number;
          y: number;
          width: number;
          height: number;
          activatesAt: string;
          active: boolean;
        }>;
      }) => {
        for (const z of msg.zones) {
          if (!this.toxicZones.has(z.id)) {
            const zone = new ToxicZone(this, z);
            this.toxicZones.set(z.id, zone);
            if (z.active) zone.activate(false);
          }
        }
      }
    );

    // Toxic zone activated
    this.room.onMessage(
      'toxicZoneActivated',
      (msg: { id: string; x?: number; y?: number; width?: number; height?: number }) => {
        if (this.toxicZones.has(msg.id)) {
          this.toxicZones.get(msg.id)!.activate(true);
        } else if (msg.x !== undefined) {
          // Zona nueva generada dinámicamente
          const zone = new ToxicZone(this, {
            id: msg.id,
            x: msg.x,
            y: msg.y!,
            width: msg.width!,
            height: msg.height!,
            active: true,
          });
          this.toxicZones.set(msg.id, zone);
          zone.activate(false); // ya activa, sin animación de fade
        }
      }
    );
  }

  // ─── Ready Overlay ────────────────────────────────────────────────────────────

  private _setupReadyOverlay(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.65).setOrigin(0);
    bg.setScrollFactor(0);

    const roomCode = NetworkClient.getInstance().getRoomCode() || this.room.roomId || '';
    const titleText = this.add
      .text(cx, cy - 80, `Sala: ${roomCode}`, {
        fontSize: '28px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.readyCountText = this.add
      .text(cx, cy - 30, '0/0 listos', {
        fontSize: '20px',
        color: '#aaffaa',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    const tutorialLines = [
      '🧬 OBJETIVO: Sellar 8 Cargas y extraerlas',
      '─────────────────────────────────────────',
      'WASD  Moverse        SHIFT  Dash',
      'CLICK Atacar         E      Evolucionar (Hub)',
      'F     Sellar Carga   R      Revivir aliado',
      'Q     Poción (💊x2)  T      Volver al Spawn',
      '─────────────────────────────────────────',
      '📦 Farm ADN → Sella Carga (30 ADN) → Lleva a Extracción',
      '⚠️  El mapa colapsa con el tiempo. ¡Escapá antes de 13:00!',
    ].join('\n');

    const tutorialText = this.add
      .text(cx, cy + 20, tutorialLines, {
        fontSize: '13px',
        color: '#aaaaaa',
        fontFamily: 'monospace',
        align: 'center',
        lineSpacing: 4,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(200);

    const tutorialHeight = tutorialText.height + 20;

    const btnBg = this.add
      .rectangle(cx, cy + 30 + tutorialHeight, 180, 50, 0x22aa55)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    const btnText = this.add
      .text(cx, cy + 30 + tutorialHeight, 'Listo ✓', {
        fontSize: '22px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.readyOverlay = this.add.container(0, 0, [
      bg,
      titleText,
      this.readyCountText,
      tutorialText,
      btnBg,
      btnText,
    ]);
    this.readyOverlay.setDepth(200);
    this.readyOverlay.setScrollFactor(0);

    btnBg.once('pointerdown', () => {
      this.room.send('setReady', {});
      btnBg.setVisible(false);
      btnText.setVisible(false);
    });

    // Track ready count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.room.state.players.onChange((playerState: any) => {
      void playerState; // trigger update
      this._updateReadyCount();
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.room.state.players.onAdd((_ps: any) => {
      this._updateReadyCount();
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.room.state.players.onRemove((_ps: any) => {
      this._updateReadyCount();
    });

    // Hide overlay when game starts
    this.room.onMessage('gameStarted', () => {
      this.gameHasStarted = true;
      this.readyOverlay.setVisible(false);
    });
  }

  private _updateReadyCount(): void {
    let ready = 0;
    let total = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.room.state.players.forEach((p: any) => {
      total++;
      if (p.isReady) ready++;
    });
    if (this.readyCountText) {
      this.readyCountText.setText(`${ready}/${total} listos`);
    }
  }

  // ─── Shooting ─────────────────────────────────────────────────────────────────

  private lastMeleeTime = 0;
  private _tryMelee(): void {
    const now = Date.now();
    const serverMe = this.room?.state?.players?.get(this.room.sessionId);
    const attackRate = serverMe?.attackRate ?? 1.0;
    const meleeCooldown = Math.round(600 / attackRate);
    if (now - this.lastMeleeTime < meleeCooldown) return;
    this.lastMeleeTime = now;

    const facing = this.player.rotation;
    const vx = Math.cos(facing);
    const vy = Math.sin(facing);
    this.room.send('meleeAttack', { vx, vy });

    // Visual slash effect
    const slashX = this.player.x + vx * 50;
    const slashY = this.player.y + vy * 50;
    const slash = this.add
      .text(slashX, slashY, '⚔', { fontSize: '24px' })
      .setOrigin(0.5)
      .setDepth(20)
      .setRotation(facing);
    this.tweens.add({
      targets: slash,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => slash.destroy(),
    });
  }

  private _tryShoot(): void {
    const now = Date.now();
    const serverMe2 = this.room?.state?.players?.get(this.room.sessionId);
    const fireRate = serverMe2?.attackRate ?? 1.0;
    const fireCooldown = Math.round(FIRE_RATE_MS / fireRate);
    if (now - this.lastFireTime < fireCooldown) return;
    this.lastFireTime = now;

    const bullet = this.bullets.get(
      this.player.x,
      this.player.y
    ) as Phaser.Types.Physics.Arcade.ImageWithDynamicBody | null;
    if (!bullet) return;

    bullet.setActive(true).setVisible(true).setDepth(9);
    const facing = this.player.rotation;
    const vx = Math.cos(facing) * BULLET_SPEED;
    const vy = Math.sin(facing) * BULLET_SPEED;
    bullet.setVelocity(vx, vy);

    this.time.delayedCall(1500, () => {
      if (bullet.active) {
        bullet.setActive(false).setVisible(false);
        bullet.setVelocity(0, 0);
      }
    });

    this.audio.playShoot();
    this.room.send('shoot', {
      vx: Math.cos(this.player.rotation),
      vy: Math.sin(this.player.rotation),
    });
  }

  shutdown(): void {
    this.onboarding?.destroy();
    this.inputManager?.destroy();
    this.hud?.destroy();
    this.overlay?.destroy();
    this.craftingPanel?.destroy();
    this.remotePlayers.forEach((rp) => rp.body.destroy());
    this.remotePlayers.clear();
    this.cargoSprites.forEach((s) => s.destroy());
    this.cargoSprites.clear();
    this.enemySprites.forEach((s) => s.destroy());
    this.enemySprites.clear();
    this.projectileSprites.forEach((s) => s.destroy());
    this.projectileSprites.clear();
    this.toxicZones.forEach((z) => z.destroy());
    this.toxicZones.clear();
    this.adnNodeSprites.forEach((s) => s.destroy());
    this.adnNodeSprites.clear();
  }
}
