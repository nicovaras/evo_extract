import Phaser from 'phaser';
import { LobbyScene } from './scenes/LobbyScene';
import { GameScene } from './scenes/GameScene';
import { initMapData } from './mapData';

// Load map JSON first, then start the game
initMapData().then(() => {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1a1a2e',
    parent: 'game-container',
    scene: [LobbyScene, GameScene],
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
  };

  new Phaser.Game(config);
});
