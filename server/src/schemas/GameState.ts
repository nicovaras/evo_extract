import {
  Schema,
  type,
  MapSchema,
  ArraySchema,
} from '@colyseus/schema';

export class PlayerState extends Schema {
  @type('string') id: string = '';
  @type('number') x: number = 1000;
  @type('number') y: number = 1000;
  @type('number') hp: number = 120;
  @type('number') maxHp: number = 120;
  @type('number') adn: number = 0;
  @type('number') speed: number = 6.0;
  @type('number') facing: number = 0;
  @type('boolean') isDown: boolean = false;
  @type('boolean') isCarrying: boolean = false;
  @type('boolean') isReady: boolean = false;
  @type(['string']) equippedParts: ArraySchema<string> = new ArraySchema<string>();
  // Combat stats
  @type('number') armor: number = 2;
  @type('number') critChance: number = 0.05;
  @type('number') critMult: number = 1.6;
  @type('number') attackDamage: number = 15;
  @type('number') lifeSteal: number = 0;
  @type('number') downedAt: number = 0;
}

export class AdnNode extends Schema {
  @type('string') id: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') amount: number = 0;
  @type('boolean') active: boolean = true;
}

export class CargoState extends Schema {
  @type('string') id: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('boolean') isSealed: boolean = false;
  @type('string') carrierId: string = '';
}

export class EnemyState extends Schema {
  @type('string') id: string = '';
  @type('string') type: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') hp: number = 100;
  @type('number') maxHp: number = 100;
  @type('number') damage: number = 10;
  @type('number') speed: number = 4.2;
  @type('number') adnDrop: number = 8;
  @type('boolean') isElite: boolean = false;
  @type('boolean') isBoss: boolean = false;
  @type('boolean') ignoresKnockback: boolean = false;
  // Runtime FSM state (not synced — Colyseus ignores non-decorated fields)
  behaviorState: string = 'IDLE';
  attackCooldown: number = 0;
  shootCooldown: number = 0;
}

export class ProjectileState extends Schema {
  @type('string') id: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') vx: number = 0;
  @type('number') vy: number = 0;
  @type('number') damage: number = 8;
  @type('string') ownerId: string = '';
}

export class ToxicZoneState extends Schema {
  @type('string') id: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') width: number = 0;
  @type('number') height: number = 0;
  @type('boolean') active: boolean = false;
}

export class GameTimers extends Schema {
  @type('number') runTime: number = 0;
  @type('string') phase: string = 'early'; // early | mid | late
  @type('number') cargoDelivered: number = 0;
  @type('number') extractionCountdown: number = 0;
  @type('boolean') isExtracting: boolean = false;
}

export class GameState extends Schema {
  @type('boolean') gameStarted: boolean = false;
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: AdnNode }) adnNodes = new MapSchema<AdnNode>();
  @type({ map: CargoState }) cargo = new MapSchema<CargoState>();
  @type({ map: EnemyState }) enemies = new MapSchema<EnemyState>();
  @type({ map: ProjectileState }) projectiles = new MapSchema<ProjectileState>();
  @type({ map: ProjectileState }) playerProjectiles = new MapSchema<ProjectileState>();
  @type({ map: ToxicZoneState }) toxicZones = new MapSchema<ToxicZoneState>();
  @type(GameTimers) timers: GameTimers = new GameTimers();
}
