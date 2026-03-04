enemigo ranged transpasa paredes
melee transpasa pared

top-down post-apocalyptic lab floor, 2000x2000, dark concrete with green stains, cracks, worn tiles

---

Lista de archivos que tenés que poner en **`client/public/sprites/`**:

### 👤 Jugador

| Archivo           | Descripción             | Tamaño sugerido |
| ----------------- | ----------------------- | --------------- |
| `player_base.png` | Cuerpo base del jugador | 32×32           |

### 🦾 Partes equipadas (attachments)

| Archivo              | Descripción         | Tamaño sugerido |
| -------------------- | ------------------- | --------------- |
| `part_head_t1.png`   | Cráneo Cazador      | 20×12           |
| `part_head_t2.png`   | Ojo Compuesto       | 20×12           |
| `part_head_t3.png`   | Bulbo Neural        | 20×12           |
| `part_arms_t1.png`   | Garras Rápidas      | 12×20           |
| `part_arms_t2.png`   | Martillos Óseos     | 12×20           |
| `part_arms_t3.png`   | Látigos Tendinosos  | 12×20           |
| `part_legs_t1.png`   | Patas Felinas       | 20×12           |
| `part_legs_t2.png`   | Piernas Saltador    | 20×12           |
| `part_legs_t3.png`   | Zancos Queratinosos | 20×12           |
| `part_torso_t1.png`  | Caparazón Ligero    | 12×20           |
| `part_torso_t2.png`  | Masa Muscular       | 12×20           |
| `part_torso_t3.png`  | Núcleo Regenerativo | 12×20           |
| `part_ranged_t1.png` | Módulo de Disparo   | 10×10           |

### 👾 Enemigos

| Archivo                  | Descripción                       | Tamaño sugerido |
| ------------------------ | --------------------------------- | --------------- |
| `enemy_basic.png`        | Básico                            | 32×32           |
| `enemy_basic_elite.png`  | Básico élite (variante brillante) | 32×32           |
| `enemy_ranged.png`       | Ranged (dispara)                  | 28×28           |
| `enemy_ranged_elite.png` | Ranged élite                      | 28×28           |
| `enemy_tank.png`         | Tank (lento, duro)                | 40×40           |
| `enemy_tank_elite.png`   | Tank élite                        | 40×40           |
| `enemy_boss_a.png`       | Mini-Boss A                       | 56×56           |
| `enemy_boss_b.png`       | Mini-Boss B                       | 56×56           |

### 🌍 Mundo

| Archivo        | Descripción           | Notas                                  |
| -------------- | --------------------- | -------------------------------------- |
| `bg_floor.png` | Suelo / fondo         | Se repite en tile, hacelo sin costuras |
| `wall.png`     | Textura de pared      | Se repite en tile, sin costuras        |
| `adn_node.png` | Nodo de ADN (recurso) | 16×16                                  |
| `cargo.png`    | Carga sellada         | 24×24                                  |
| `bullet.png`   | Proyectil             | 10×10                                  |

**Total: 30 archivos.** Los más importantes para que se vea bien: `bg_floor`, `wall`, `player_base`, y los 8 enemigos. Las partes pueden ser simples formas si querés empezar rápido.
