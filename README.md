# Mega Man Smash

A side-scroller in the style of the original Mega Man. Mega Man wakes up under a
blue tree, frees his brothers from the Evil Mech's capsules, finds a tank, and
drives it into the occupied village to smash the Mech.

Plain ES modules on a 256x240 canvas, with no build step and no assets: the
sprites, tiles, music and sound effects are all generated in code.

## Stages

| Stage | |
|---|---|
| Blue Tree Meadow | Where it begins. Tutorial signs. |
| Homeland | Where the Mega Men come from. Find **the Life**. |
| Ember Caves | Boss: Magma Golem. Frees **Blaze Man**. |
| Wind Cliffs | Boss: Cyclone Bird. Frees **Gale Man**. |
| Volt Plant | Boss: Spark Dynamo. Frees **Volt Man**. |
| Iron Hangar | Find the tank and learn its moves. |
| The Village | In the tank: defeat every robot to open the gate, then fight the Evil Mech. |

The three capsule stages are optional. Each Mega Man you free joins the team,
and you can switch to him at any time, in the tank too, where the pilot picks
the cannon.

| Mega Man | On foot | Tank cannon |
|---|---|---|
| Mega Man | Buster, hold to charge | Shell |
| Blaze Man | Flame shot that pierces and cracks hard hats | Fire shell that pierces |
| Gale Man | Higher jump, hold jump to glide | Twin shells |
| Volt Man | Runs fast, three-way spread | Three-way spread |

**The Life** is a blue box in Homeland with a blue thing inside. Once found it
powers every Mega Man, in every stage:

- **Double, double, double, double, double jump**: five more jumps in the air.
- **Super Mega Man Slam Bash**: the Smash Punch turns blue, and where it lands
  a boom hits everything nearby and throws the Mega Man high into the air.
- Up there, **hold Down and press Shoot** to shoot straight down: every shot
  pushes him back up. Down + Jump slams again.

Each Mega Man has his own energy. When one goes down, the next takes over;
when the whole team is down, you lose a life.

## Controls

| | Keyboard | Gamepad |
|---|---|---|
| Move / climb | Arrows or WASD | D-pad / stick |
| Jump | Z, Space or K | A |
| Shoot | X or J | X / Y |
| Shoot up | Hold Up, press Shoot | |
| Smash Punch (on foot) | In the air: hold Down, press Shoot | |
| Shoot down (after a Slam Bash) | Hold Down, press Shoot | |
| Boost (tank) | Shift, C or L | B / triggers |
| Switch Mega Man | Q / E, or 1-4 | LB / RB |
| Pause | Enter, P or Esc | Start |
| Mute | M | |

The tank's moves:

- **Climb walls**: hold toward a wall; Up and Down move, Jump kicks off.
- **Double jump**: press Jump again in the air.
- **Speed jump**: jump at full boost for a long, low leap.
- **Load-up jump**: hold Down, then hold Jump to charge; let go of Jump to launch.
- **Smash**: land on an enemy to crush it.

Phones and tablets get on-screen buttons.

Progress (stages cleared, Mega Men freed) is saved in the browser.

## Development

- `?debug` exposes `window.game` and adds keys: N jumps to the next checkpoint
  or boss, I toggles invincibility, K destroys the enemies on screen, B leaves
  the boss on 1 HP, G frees every Mega Man and gives the Life.
- `?debug&stage=ember` starts straight in a stage (`meadow`, `homeland`, `ember`, `wind`,
  `volt`, `hangar`, `village`).
- `?preview` draws the Launchpad image. `preview.png` is a 512x512 capture of it.

Stages are ASCII maps in `js/levels.js`: one 16x15-tile screen per block, with
the legend at the top of the file.
