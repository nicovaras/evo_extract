import { Room, Client } from 'colyseus';
import { GameState, PlayerState, ProjectileState, AdnNode } from '../schemas/GameState';
import { getSpawn, MAP_WALLS } from '../../../shared/src/mapData';
import { InputProcessor, InputPayload } from '../systems/InputProcessor';
import { CargoSystem } from '../systems/CargoSystem';
import { WinLoseChecker } from '../systems/WinLoseChecker';
import { DamageSystem } from '../systems/DamageSystem';
import { ReviveSystem } from '../systems/ReviveSystem';
import { SpawnDirector } from '../systems/SpawnDirector';
import { EnemyManager } from '../systems/EnemyManager';
import { AdnSpawner } from '../systems/AdnSpawner';
import { AdnCollector } from '../systems/AdnCollector';
import { CollapseSystem } from '../systems/CollapseSystem';
import { tickBasicBehavior } from '../systems/behaviors/BasicBehavior';
import { tickRangedBehavior } from '../systems/behaviors/RangedBehavior';
import { tickTankBehavior } from '../systems/behaviors/TankBehavior';
import { separateEnemies } from '../systems/EnemySeparation';
import { EXTRACTION_COUNTDOWN, WIN_CARGO_COUNT, CARGO_COST, rollPartPool } from '@evo/shared';
import { CraftingSystem } from '../systems/CraftingSystem';

const PROJECTILE_HIT_RANGE = 16;
const WORLD_BOUNDS = { min: 0, max: 2000 };

export class ExtractionRoom extends Room<GameState> {
  maxClients = parseInt(process.env.ROOM_MAX_CLIENTS ?? '4', 10);

  private inputProcessor = new InputProcessor();
  private cargoSystem = new CargoSystem();
  private craftingSystem = new CraftingSystem();
  private winLoseChecker = new WinLoseChecker();
  private damageSystem!: DamageSystem;
  private reviveSystem!: ReviveSystem;
  private enemyManager!: EnemyManager;
  private spawnDirector!: SpawnDirector;
  private adnSpawner!: AdnSpawner;
  private adnCollector!: AdnCollector;
  private collapseSystem!: CollapseSystem;
  private lastInputs = new Map<string, InputPayload>();
  private lastTickTime = Date.now();

  /** seconds accumulator for extraction countdown */
  private extractionAccum = 0;
  /** whether gameOver has been broadcast already */
  private gameOverSent = false;

  onCreate(options: Record<string, unknown>): void {
    this.setState(new GameState());

    // Init systems that need room reference
    this.damageSystem = new DamageSystem(this);
    this.reviveSystem = new ReviveSystem(this); // registers startRevive/cancelRevive messages

    // Init spawn/enemy systems
    this.enemyManager = new EnemyManager(this.state);
    this.spawnDirector = new SpawnDirector(this.enemyManager);

    // Init ADN systems (AdnSpawner uses setInterval internally)
    this.adnSpawner = new AdnSpawner();
    this.adnSpawner.start(this.state.adnNodes, this.state);
    this.adnCollector = new AdnCollector(this);

    // Init collapse system
    this.collapseSystem = new CollapseSystem();
    this.collapseSystem.init(this.state, this);

    // ── Input ───────────────────────────────────────────────────────────────
    // ── Ready system ────────────────────────────────────────────────────────
    this.onMessage('setReady', (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      player.isReady = true;
      this._checkAllReady();
    });

    this.onMessage<InputPayload>('input', (client, payload) => {
      this.lastInputs.set(client.sessionId, payload);
    });

    // ── Craft part ──────────────────────────────────────────────────────────
    this.onMessage('craft', (client, data: { partId: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      try {
        const result = this.craftingSystem.craft(player, data.partId, this.state);
        client.send('craftResult', result);
      } catch (err) {
        console.error('[craft] error:', err);
        client.send('craftResult', { success: false, reason: 'Error interno' });
      }
    });

    // ── Seal Cargo (Tarea 23) ───────────────────────────────────────────────
    this.onMessage('sealCargo', (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const nextCost = CARGO_COST + this.state.timers.cargoSealed * 10;
      const result = this.cargoSystem.sealCargo(player, this.state);
      client.send('sealResult', {
        success: result.success,
        cargoId: result.cargoId,
        reason: result.reason,
        nextCost: CARGO_COST + this.state.timers.cargoSealed * 10, // cost of NEXT seal
        cost: nextCost, // what this seal cost (or would have cost)
      });
    });

    // ── Deliver Cargo (Tarea 25) ────────────────────────────────────────────
    this.onMessage('deliver', (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const result = this.cargoSystem.deliverCargo(player, this.state);
      if (result.success) {
        // Check win condition immediately after delivery
        this._checkExtractionWin();
      }
      client.send('deliverResult', { success: result.success, reason: result.reason });
    });

    this.onMessage('shoot', (client, data: { vx: number; vy: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || player.isDown || !player.isRanged) return;
      const proj = new ProjectileState();
      proj.id = Math.random().toString(36).slice(2, 9);
      proj.x = player.x;
      proj.y = player.y;
      proj.vx = data.vx * 800;
      proj.vy = data.vy * 800;
      proj.damage = player.attackDamage;
      proj.ownerId = client.sessionId;
      this.state.playerProjectiles.set(proj.id, proj);
    });

    // Melee attack — hits all enemies within range
    const MELEE_RANGE = 80; // reduced melee range
    const MELEE_COOLDOWN_BASE_MS = 600;
    const meleeCooldown = new Map<string, number>();
    this.onMessage('meleeAttack', (client, data: { vx: number; vy: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || player.isDown || player.isRanged) return;
      const now = Date.now();
      const cooldownMs = MELEE_COOLDOWN_BASE_MS / (player.attackRate ?? 1.0);
      if (now - (meleeCooldown.get(client.sessionId) ?? 0) < cooldownMs) return;
      meleeCooldown.set(client.sessionId, now);

      // Hit enemies in a cone in front of the player
      const hits: string[] = [];
      this.state.enemies.forEach((enemy, id) => {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > MELEE_RANGE) return;
        // Dot product check: must be roughly in the direction the player is facing
        if ((dist > 0 && data.vx !== 0) || data.vy !== 0) {
          const dot = (dx / dist) * data.vx + (dy / dist) * data.vy;
          if (dot < 0.2) return; // outside ~78° cone
        }
        // Wall check: no hitting enemies through walls
        if (_wallBetween(player.x, player.y, enemy.x, enemy.y)) return;
        const result = this.damageSystem.applyPlayerAttackToEnemy(enemy, player);
        // Show hit number to everyone (with crit flag)
        this.broadcast('enemyHit', {
          x: enemy.x,
          y: enemy.y,
          damage: result.damage,
          isCrit: result.isCrit,
          killed: result.killed,
          enemyId: id,
        });
        if (result.killed) hits.push(id);
      });

      // Remove killed enemies
      hits.forEach((id) => this._killEnemy(id, 0));

      client.send('meleeHit', { count: hits.length });
    });

    // Use potion — heals 60 HP, max 2 charges, +1 on miniboss kill
    this.onMessage('usePotion', (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || player.isDown) return;
      if (player.potions <= 0) {
        client.send('potionEmpty', {});
        return;
      }
      if (player.hp >= player.maxHp) {
        client.send('potionFull', {});
        return;
      }
      player.potions -= 1;
      player.hp = Math.min(player.maxHp, player.hp + 60);
      client.send('potionUsed', { hp: Math.ceil(player.hp), potions: player.potions });
    });

    // Warp to spawn (panic button — cooldown 30s)
    const warpCooldown = new Map<string, number>();
    this.onMessage('warpToSpawn', (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      const now = Date.now();
      const last = warpCooldown.get(client.sessionId) ?? 0;
      if (now - last < 30_000) {
        client.send('warpDenied', { cooldownLeft: Math.ceil((30_000 - (now - last)) / 1000) });
        return;
      }
      warpCooldown.set(client.sessionId, now);
      const sp = getSpawn('player');
      player.x = (sp?.x ?? 1000) + Math.floor((Math.random() - 0.5) * 80);
      player.y = (sp?.y ?? 1000) + Math.floor((Math.random() - 0.5) * 80);
      player.isDown = false;
      client.send('warped', {});
    });

    // 30 ticks/sec simulation loop
    this.setSimulationInterval((deltaTime) => {
      this._tick(deltaTime);
    }, 33);

    // Send state patches at 30 Hz
    this.setPatchRate(33);

    console.log(
      `[ExtractionRoom] onCreate | roomId=${this.roomId} | maxClients=${this.maxClients} | options=${JSON.stringify(options)}`
    );
  }

  onJoin(client: Client, options: Record<string, unknown>): void {
    const player = new PlayerState();
    player.id = client.sessionId;
    const rawName = typeof options?.name === 'string' ? options.name.trim() : '';
    player.name = rawName.slice(0, 20) || 'Jugador';
    const sp = getSpawn('player');
    player.x = (sp?.x ?? 1000) + Math.floor((Math.random() - 0.5) * 100);
    player.y = (sp?.y ?? 1000) + Math.floor((Math.random() - 0.5) * 100);
    this.state.players.set(client.sessionId, player);

    // Enviar zonas tóxicas actuales al nuevo jugador
    const zones = Array.from(this.state.toxicZones.values()).map((z) => ({
      id: z.id,
      x: z.x,
      y: z.y,
      width: z.width,
      height: z.height,
      active: z.active,
    }));
    client.send('toxicZonesUpdate', { zones });

    const total = this.state.players.size;
    console.log(
      `[ExtractionRoom] onJoin  | timestamp=${new Date().toISOString()} | roomId=${this.roomId} | sessionId=${client.sessionId} | totalPlayers=${total}`
    );
  }

  onLeave(client: Client, consented: boolean): void {
    // Drop cargo if player was carrying
    const player = this.state.players.get(client.sessionId);
    if (player?.isCarrying) {
      this.state.cargo.forEach((c) => {
        if (c.carrierId === client.sessionId) {
          c.carrierId = '';
        }
      });
      player.isCarrying = false;
    }

    this.state.players.delete(client.sessionId);
    this.lastInputs.delete(client.sessionId);

    const total = this.state.players.size;
    console.log(
      `[ExtractionRoom] onLeave | timestamp=${new Date().toISOString()} | roomId=${this.roomId} | sessionId=${client.sessionId} | consented=${consented} | totalPlayers=${total}`
    );
  }

  onDispose(): void {
    this.adnSpawner?.stop();
    console.log(`[ExtractionRoom] onDispose | roomId=${this.roomId}`);
  }

  private _tick(delta: number): void {
    if (this.gameOverSent) return;

    const dt = delta / 1000;

    // Update run timer
    this.state.timers.runTime += dt;

    // Passive HP regen: 1 HP/4s base for everyone, +1 HP/s with Núcleo (lifeSteal handled on hit)
    const BASE_REGEN_RATE = 0.25; // HP per second
    this.state.players.forEach((player) => {
      if (!player.isDown && player.hp > 0 && player.hp < player.maxHp) {
        const regenRate =
          BASE_REGEN_RATE + (player.equippedParts.includes('nucleo_regenerativo') ? 1.0 : 0);
        player.hp = Math.min(player.maxHp, player.hp + regenRate * dt);
      }
    });

    // Actualizar phase según runTime
    const rt = this.state.timers.runTime;
    const newPhase = rt < 240 ? 'early' : rt < 510 ? 'mid' : 'late';
    if (newPhase !== this.state.timers.phase) {
      this.state.timers.phase = newPhase;
      console.log(`[Phase] → ${newPhase} at ${Math.floor(rt)}s`);
    }

    // Process player inputs
    this.state.players.forEach((player, sessionId) => {
      const input = this.lastInputs.get(sessionId);
      if (input) {
        this.inputProcessor.process(player, input, delta);
      }
    });

    // Update cargo positions / handle drops
    this.cargoSystem.tick(this.state);

    // ── Spawn Director (only after game starts) ────────────────────────────
    if (this.state.gameStarted) {
      this.spawnDirector.tick(this.state, delta);
    }

    // ── ADN Collector (only after game starts) ─────────────────────────────
    if (this.state.gameStarted) {
      this.adnCollector.tick(this.state, this.state.players, delta / 1000);
    }

    // ── Collapse System (only after game starts) ───────────────────────────
    if (this.state.gameStarted) {
      this.collapseSystem.tick(this.state, this, delta);
    }

    // ── Enemy behaviors ────────────────────────────────────────────────────
    this.state.enemies.forEach((enemy) => {
      switch (enemy.type) {
        case 'basic':
          tickBasicBehavior(enemy, this.state, dt, this.damageSystem);
          break;
        case 'ranged':
          tickRangedBehavior(enemy, this.state, dt, this.damageSystem);
          break;
        case 'tank':
          tickTankBehavior(enemy, this.state, dt, this.damageSystem);
          break;
        case 'elite': {
          // Elite uses the same behavior as its base type stored in a sub-field,
          // defaulting to basic if not specified
          tickBasicBehavior(enemy, this.state, dt, this.damageSystem);
          break;
        }
        default:
          break;
      }
    });

    // ── Enemy separation ───────────────────────────────────────────────────
    separateEnemies(this.state);

    // ── Projectile updates ─────────────────────────────────────────────────
    const toRemove: string[] = [];

    this.state.projectiles.forEach((proj) => {
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;

      // Out of bounds
      if (
        proj.x < WORLD_BOUNDS.min ||
        proj.x > WORLD_BOUNDS.max ||
        proj.y < WORLD_BOUNDS.min ||
        proj.y > WORLD_BOUNDS.max
      ) {
        toRemove.push(proj.id);
        return;
      }

      // Wall collision
      if (_projHitsWall(proj.x, proj.y)) {
        toRemove.push(proj.id);
        return;
      }

      // Collision with players
      this.state.players.forEach((player) => {
        if (player.isDown) return;
        const dx = proj.x - player.x;
        const dy = proj.y - player.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < PROJECTILE_HIT_RANGE) {
          this.damageSystem.applyDamageToPlayer(player, proj.damage);
          toRemove.push(proj.id);
        }
      });
    });

    toRemove.forEach((id) => this.state.projectiles.delete(id));

    // Player projectiles → hit enemies
    const playerProjToRemove: string[] = [];
    this.state.playerProjectiles.forEach((proj) => {
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      if (proj.x < 0 || proj.x > 2000 || proj.y < 0 || proj.y > 2000) {
        playerProjToRemove.push(proj.id);
        return;
      }
      if (_projHitsWall(proj.x, proj.y)) {
        playerProjToRemove.push(proj.id);
        return;
      }
      this.state.enemies.forEach((enemy, enemyId) => {
        const dx = proj.x - enemy.x;
        const dy = proj.y - enemy.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          const shooter = this.state.players.get(proj.ownerId);
          if (shooter) {
            const result = this.damageSystem.applyPlayerAttackToEnemy(enemy, shooter);
            this.broadcast('enemyHit', {
              x: enemy.x,
              y: enemy.y,
              damage: result.damage,
              isCrit: result.isCrit,
              killed: result.killed,
              enemyId,
            });
            if (result.killed) {
              this._killEnemy(enemyId);
            }
          }
          playerProjToRemove.push(proj.id);
        }
      });
    });
    playerProjToRemove.forEach((id) => this.state.playerProjectiles.delete(id));

    // ── Revive system tick ─────────────────────────────────────────────────
    this.reviveSystem.tick();

    // ── Extraction countdown (Tarea 25) ────────────────────────────────────
    if (this.state.timers.isExtracting) {
      this.extractionAccum += dt;
      if (this.extractionAccum >= 1) {
        this.extractionAccum -= 1;
        this.state.timers.extractionCountdown = Math.max(
          0,
          this.state.timers.extractionCountdown - 1
        );
      }
      this._checkExtractionWin();
    } else {
      // Scale required cargo with player count: 6 + playerCount*2 (1p=8, 2p=10, 3p=12, 4p=14)
      const playerCount = Math.max(1, this.state.players.size);
      this.state.timers.cargoRequired = 6 + playerCount * 2;
      if (this.state.timers.cargoDelivered >= this.state.timers.cargoRequired) {
        this.state.timers.isExtracting = true;
        this.state.timers.extractionCountdown = EXTRACTION_COUNTDOWN;
      }
    }

    // ── Win/Lose checks (Tarea 27+28) ─────────────────────────────────────
    const wlResult = this.winLoseChecker.check(this.state);
    if (wlResult.lose) {
      this._broadcastGameOver({ win: false, reason: wlResult.reason });
    }
  }

  private _checkAllReady(): void {
    const players = this.state.players;
    if (players.size === 0) return;
    let allReady = true;
    players.forEach((p) => {
      if (!p.isReady) allReady = false;
    });
    if (allReady) {
      // Assign random part pool to each player
      players.forEach((p) => {
        const pool = rollPartPool();
        p.assignedParts.splice(0, p.assignedParts.length);
        pool.forEach((id) => p.assignedParts.push(id));
      });
      this.state.gameStarted = true;
      this.broadcast('gameStarted', {});
      console.log(`[ExtractionRoom] gameStarted | roomId=${this.roomId}`);
    }
  }

  private _checkExtractionWin(): void {
    if (this.gameOverSent) return;
    if (!this.state.timers.isExtracting) return;
    if (this.state.timers.extractionCountdown > 0) return;

    // Check if at least one player is in extraction zone
    let playerInZone = false;
    this.state.players.forEach((p) => {
      if (this.cargoSystem.isPlayerInExtraction(p)) playerInZone = true;
    });

    if (playerInZone) {
      this._broadcastGameOver({ win: true });
    }
  }

  /** Kill an enemy, drop ADN nodes, broadcast event. Call instead of enemies.delete() directly. */
  private _killEnemy(enemyId: string, _finalDamage: number = 0): void {
    const enemy = this.state.enemies.get(enemyId);
    if (!enemy) return;
    const dropCount = enemy.adnDrop ?? 4;
    for (let i = 0; i < dropCount; i++) {
      const angle = (Math.PI * 2 * i) / dropCount;
      const r = 20 + Math.random() * 20;
      const node = new AdnNode();
      node.id = Math.random().toString(36).slice(2, 9);
      node.x = enemy.x + Math.cos(angle) * r;
      node.y = enemy.y + Math.sin(angle) * r;
      node.amount = 1;
      node.active = true;
      this.state.adnNodes.set(node.id, node);
    }
    // Mini-bosses drop a potion to a random alive player
    if (enemy.isBoss) {
      const alivePlayers: string[] = [];
      this.state.players.forEach((p, sid) => {
        if (!p.isDown) alivePlayers.push(sid);
      });
      if (alivePlayers.length > 0) {
        const sid = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
        const p = this.state.players.get(sid)!;
        p.potions = Math.min(p.potions + 1, 4);
        const client = this.clients.find((c) => c.sessionId === sid);
        client?.send('potionDropped', { potions: p.potions });
      }
    }
    this.broadcast('enemyKilled', { enemyId, x: enemy.x, y: enemy.y });
    this.state.enemies.delete(enemyId);
  }

  private _broadcastGameOver(data: { win: boolean; reason?: string }): void {
    if (this.gameOverSent) return;
    this.gameOverSent = true;
    const playerStats: Record<
      string,
      {
        name: string;
        adnFarmed: number;
        damageDealt: number;
        kills: number;
        cargoSealed: number;
        timesDowned: number;
      }
    > = {};
    this.state.players.forEach((p, sid) => {
      playerStats[sid] = {
        name: p.name,
        adnFarmed: p.statAdnFarmed,
        damageDealt: p.statDamageDealt,
        kills: p.statKills,
        cargoSealed: p.statCargoSealed,
        timesDowned: p.statTimesDowned,
      };
    });

    this.broadcast('gameOver', {
      ...data,
      stats: {
        runTime: Math.floor(this.state.timers.runTime),
        cargoDelivered: this.state.timers.cargoDelivered,
        cargoRequired: this.state.timers.cargoRequired,
        playerStats,
      },
    });
    console.log(`[ExtractionRoom] gameOver | win=${data.win} | reason=${data.reason ?? 'none'}`);
  }
}

function _projHitsWall(x: number, y: number): boolean {
  for (const w of MAP_WALLS) {
    if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h) return true;
  }
  return false;
}

function _wallBetween(ax: number, ay: number, bx: number, by: number): boolean {
  const steps = Math.ceil(Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2) / 8);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (_projHitsWall(ax + (bx - ax) * t, ay + (by - ay) * t)) return true;
  }
  return false;
}
