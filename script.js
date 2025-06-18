const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game Configuration ---
const TILE_SIZE = 20; // Size of each grid tile in pixels
const ROWS = 25;      // Number of rows in the grid
const COLS = 21;      // Number of columns in the grid
const PACMAN_SPEED = 2; // Pixels per frame. Should be a divisor of TILE_SIZE for grid alignment.
const GHOST_SPEED = 1.8; // Ghosts can have slightly different speeds
const GHOST_FRIGHTENED_SPEED = 1;
const GHOST_EATEN_SPEED = 4; // Faster when returning to base

canvas.width = COLS * TILE_SIZE;
canvas.height = ROWS * TILE_SIZE;

// --- Map Definition ---
// 0: Empty Path
// 1: Wall
// 2: Pellet (Food)
// 3: Power Pellet (Placeholder for now)
// 4: Ghost House Door (optional)
const gameMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,2,1],
    [1,3,1,0,1,2,1,0,1,2,1,2,1,0,1,2,1,0,1,3,1], // Using 0 for empty path, 3 for power pellet
    [1,2,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,2,1],
    [1,2,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,2,1],
    [1,1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1,1], // Top of ghost house area
    [0,0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0,0], // Tunnel rows, Ghost house below center
    [1,1,1,1,1,2,1,0,1,1,4,1,1,0,1,2,1,1,1,1,1], // Row 11: Ghost house door (tile 4)
    [1,0,0,0,0,0,0,0,1,4,0,4,1,0,0,0,0,0,0,0,1], // Row 12: Inside ghost house
    [1,1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1,1], // Row 13: Bottom of ghost house area
    [0,0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0,0], // Tunnel rows
    [1,1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1,1], // Ghost box area end
    [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,2,1], // Row 17 Pacman start row
    [1,2,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,2,1],
    [1,3,2,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,2,3,1], // Power pellet
    [1,1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1,1],
    [1,1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1,1],
    [1,2,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// --- Game State ---
let score = 0;
let lives = 3;
let requestedDirection = null; // Stores the next direction requested by the player
let mouthOpen = true; // For Pac-Man animation
let frameCount = 0;   // For animation timing
const PELLET_SCORE = 10;
const POWER_PELLET_SCORE = 50;
let isPowerPelletActive = false;
let powerPelletTimer = 0;
const POWER_PELLET_DURATION = 5000; // 5 seconds in milliseconds

// --- Pac-Man Object ---
const pacman = {
    x: 10 * TILE_SIZE + TILE_SIZE / 2, // Initial pixel X (center of tile 10, 17)
    y: 17 * TILE_SIZE + TILE_SIZE / 2, // Initial pixel Y (center of tile 10, 17)
    radius: TILE_SIZE / 2 * 0.8, // Slightly smaller than tile
    direction: null, // 'left', 'right', 'up', 'down'
    speed: PACMAN_SPEED,
    gridX: 10, // Initial grid X
    gridY: 17, // Initial grid Y
};

// --- Ghost Constants and State ---
const GHOST_STATE = {
    SCATTER: 'scatter',
    CHASE: 'chase',
    FRIGHTENED: 'frightened',
    EATEN: 'eaten'
};

// --- Ghost Objects ---
const ghosts = [
    { // Blinky (Red)
        name: 'blinky',
        x: 10 * TILE_SIZE + TILE_SIZE / 2, // Start near house exit
        y: 11 * TILE_SIZE + TILE_SIZE / 2,
        gridX: 10,
        gridY: 11,
        speed: GHOST_SPEED,
        direction: 'left', // Initial direction
        color: 'red',
        state: GHOST_STATE.SCATTER, // Initial state
        scatterTarget: { x: COLS - 2, y: 0 }, // Top right corner
        targetTile: { x: 0, y: 0 }, // Current target for pathfinding
        radius: TILE_SIZE / 2 * 0.85,
        isExitingHouse: false,
        exitTimer: 0,
    },
    { // Pinky (Pink)
        name: 'pinky',
        x: 10 * TILE_SIZE + TILE_SIZE / 2, // Start in house
        y: 12 * TILE_SIZE + TILE_SIZE / 2,
        gridX: 10,
        gridY: 12,
        speed: GHOST_SPEED,
        direction: 'up',
        color: 'pink',
        state: GHOST_STATE.SCATTER,
        scatterTarget: { x: 1, y: 0 }, // Top left corner
        targetTile: { x: 0, y: 0 },
        radius: TILE_SIZE / 2 * 0.85,
        isExitingHouse: false,
        exitTimer: 60, // Delay before exiting
    },
    { // Inky (Cyan)
        name: 'inky',
        x: 9 * TILE_SIZE + TILE_SIZE / 2, // Start in house
        y: 12 * TILE_SIZE + TILE_SIZE / 2,
        gridX: 9,
        gridY: 12,
        speed: GHOST_SPEED,
        direction: 'up',
        color: 'cyan',
        state: GHOST_STATE.SCATTER,
        scatterTarget: { x: COLS - 2, y: ROWS - 2 }, // Bottom right
        targetTile: { x: 0, y: 0 },
        radius: TILE_SIZE / 2 * 0.85,
        isExitingHouse: false,
        exitTimer: 120, // Longer delay
    },
    { // Clyde (Orange)
        name: 'clyde',
        x: 11 * TILE_SIZE + TILE_SIZE / 2, // Start in house
        y: 12 * TILE_SIZE + TILE_SIZE / 2,
        gridX: 11,
        gridY: 12,
        speed: GHOST_SPEED,
        direction: 'up',
        color: 'orange',
        state: GHOST_STATE.SCATTER,
        scatterTarget: { x: 1, y: ROWS - 2 }, // Bottom left
        targetTile: { x: 0, y: 0 },
        radius: TILE_SIZE / 2 * 0.85,
        isExitingHouse: false,
        exitTimer: 180, // Longest delay
    }
];
const GHOST_HOUSE_EXIT_Y = 11 * TILE_SIZE + TILE_SIZE / 2; // Pixel Y ghosts aim for to exit
const GHOST_HOUSE_DOOR_TARGET = { x: 10, y: 11 }; // Tile above the door

// --- Helper Functions ---
function getGridCoords(pixelX, pixelY) {
    return {
        x: Math.floor(pixelX / TILE_SIZE),
        y: Math.floor(pixelY / TILE_SIZE)
    };
}

function isTileWalkable(gridX, gridY, entity) {
    // Check map boundaries
    if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) {
        return false;
    }
    const tile = gameMap[gridY][gridX];

    // Standard walls block everyone
    if (tile === 1) return false;

    // Ghost house door (4) logic
    if (tile === 4) {
        // Block Pac-Man
        if (entity === pacman) return false;
        // Allow ghosts only if entering/exiting ('eaten' state or 'exiting house' logic handles this)
        if (entity && entity.state === GHOST_STATE.EATEN) return true; // Allow eaten ghosts entry
        if (entity && entity.isExitingHouse) return true; // Allow ghosts exiting
        // Block active ghosts otherwise
        return false;
    }

    // Tiles 0, 2, 3 are walkable
    return true;
}

function getOppositeDirection(direction) {
    if (direction === 'left') return 'right';
    if (direction === 'right') return 'left';
    if (direction === 'up') return 'down';
    if (direction === 'down') return 'up';
    return null;
}

function calculateDistance(pos1, pos2) {
    // Simple Euclidean distance squared (faster than sqrt)
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return dx * dx + dy * dy;
}

function getPossibleDirections(ghost) {
    const directions = ['up', 'down', 'left', 'right'];
    const oppositeDirection = getOppositeDirection(ghost.direction);

    return directions.filter(dir => {
        // Ghosts cannot reverse direction unless forced (at dead end)
        if (dir === oppositeDirection) return false;

        let nextX = ghost.gridX;
        let nextY = ghost.gridY;
        if (dir === 'left') nextX--;
        else if (dir === 'right') nextX++;
        else if (dir === 'up') nextY--;
        else if (dir === 'down') nextY++;

        // Check if the tile in that direction is walkable *for the ghost*
        return isTileWalkable(nextX, nextY, ghost);
    });
}

function chooseNextDirection(ghost, targetTile) {
    const possibleDirs = getPossibleDirections(ghost);

    if (possibleDirs.length === 0) {
        // At a dead end, must reverse
        return getOppositeDirection(ghost.direction);
    }

    if (possibleDirs.length === 1) {
        // Only one way to go
        return possibleDirs[0];
    }

    // At an intersection: choose direction closest to target
    let bestDir = '';
    let minDistance = Infinity;

    possibleDirs.forEach(dir => {
        let nextX = ghost.gridX;
        let nextY = ghost.gridY;
        if (dir === 'left') nextX--;
        else if (dir === 'right') nextX++;
        else if (dir === 'up') nextY--;
        else if (dir === 'down') nextY--;

        const distance = calculateDistance({ x: nextX, y: nextY }, targetTile);
        if (distance < minDistance) {
            minDistance = distance;
            bestDir = dir;
        }
    });
    return bestDir;
}

function getGhostTargetTile(ghost) {
    // If eaten, target the house door
    if (ghost.state === GHOST_STATE.EATEN) {
        return GHOST_HOUSE_DOOR_TARGET;
    }
    // If frightened, target is irrelevant (random moves at intersections)
    if (ghost.state === GHOST_STATE.FRIGHTENED) {
        // For frightened state, we won't use targeting, just random valid turns.
        // Return current position or null to signify random movement logic needed.
         return null; // Or {x: ghost.gridX, y: ghost.gridY }? Let's use null.
    }
    // If scattering, target the corner
    if (ghost.state === GHOST_STATE.SCATTER) { // Need to add chase/scatter timer later
        return ghost.scatterTarget;
    }
    // If chasing, target depends on personality
    if (ghost.state === GHOST_STATE.CHASE) {
        switch (ghost.name) {
            case 'blinky': // Targets Pac-Man directly
                return { x: pacman.gridX, y: pacman.gridY };
            case 'pinky': // Targets 4 tiles ahead of Pac-Man
                let targetX = pacman.gridX;
                let targetY = pacman.gridY;
                const offset = 4;
                if (pacman.direction === 'up') targetY -= offset;
                else if (pacman.direction === 'down') targetY += offset;
                else if (pacman.direction === 'left') targetX -= offset;
                else if (pacman.direction === 'right') targetX += offset;
                 // Add wrap-around logic if target goes off map? Simplified for now.
                return { x: targetX, y: targetY };
            case 'inky': // Complex: Uses Blinky and Pac-Man's position
                // Target = Vector from Blinky to 2 tiles ahead of Pacman, doubled
                 let aheadX = pacman.gridX;
                 let aheadY = pacman.gridY;
                 const offsetInky = 2;
                 if (pacman.direction === 'up') aheadY -= offsetInky;
                 else if (pacman.direction === 'down') aheadY += offsetInky;
                 else if (pacman.direction === 'left') aheadX -= offsetInky;
                 else if (pacman.direction === 'right') aheadX += offsetInky;

                 const blinky = ghosts.find(g => g.name === 'blinky');
                 if (!blinky) return { x: pacman.gridX, y: pacman.gridY }; // Fallback if Blinky not found

                 const vecX = aheadX - blinky.gridX;
                 const vecY = aheadY - blinky.gridY;

                 return { x: blinky.gridX + vecX * 2, y: blinky.gridY + vecY * 2 };
            case 'clyde': // Targets Pac-Man if far, scatter target if close
                const distToPacman = calculateDistance({x: ghost.gridX, y: ghost.gridY}, {x: pacman.gridX, y: pacman.gridY});
                if (distToPacman > 64) { // 8 tiles squared
                    return { x: pacman.gridX, y: pacman.gridY }; // Chase Pac-Man
                } else {
                    return ghost.scatterTarget; // Run away to corner
                }
        }
    }
    // Default fallback (shouldn't happen)
    return ghost.scatterTarget;
}

// --- Drawing Functions ---
function drawWall(x, y) {
    ctx.fillStyle = 'blue';
    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function drawPellet(x, y) {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    // Draw a small circle in the center of the tile
    ctx.arc(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 5, 0, 2 * Math.PI);
    ctx.fill();
}

function drawPowerPellet(x, y) {
    ctx.fillStyle = 'orange'; // Or another distinct color
    ctx.beginPath();
    // Draw a larger circle than the regular pellet
    ctx.arc(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 3, 0, 2 * Math.PI);
    ctx.fill();
}

function drawMap() {
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const tile = gameMap[y][x];
            if (tile === 1) {
                drawWall(x, y);
            } else if (tile === 2) {
                drawPellet(x, y);
            } else if (tile === 3) {
                drawPowerPellet(x, y);
            }
            // Tile 0 (empty path) doesn't need drawing as the background is black
        }
    }
}

function drawPacman() {
    ctx.fillStyle = 'yellow';
    ctx.beginPath();

    let startAngle = 0.2 * Math.PI;
    let endAngle = 1.8 * Math.PI;
    let rotation = 0;

    // Adjust angles based on direction
    if (pacman.direction === 'right') {
        rotation = 0;
    } else if (pacman.direction === 'left') {
        rotation = Math.PI;
    } else if (pacman.direction === 'up') {
        rotation = -0.5 * Math.PI;
    } else if (pacman.direction === 'down') {
        rotation = 0.5 * Math.PI;
    } else {
        // Default orientation if no direction (e.g., at start)
        rotation = 0;
        // Keep mouth open/closed based on animation state even when still
         if (!mouthOpen) {
             startAngle = 0;
             endAngle = 2 * Math.PI;
         }
    }

    // Mouth animation only if moving
    if (pacman.direction && !mouthOpen) {
        startAngle = 0;
        endAngle = 2 * Math.PI; // Closed mouth
    } else if (!pacman.direction && !mouthOpen) {
         startAngle = 0;
         endAngle = 2 * Math.PI; // Keep mouth closed if stopped and animation says so
    }
     else {
        // Default open mouth angles if moving or stopped with mouth open animation state
        startAngle = 0.2 * Math.PI;
        endAngle = 1.8 * Math.PI;
    }


    ctx.translate(pacman.x, pacman.y); // Move origin to Pac-Man's center
    ctx.rotate(rotation);              // Rotate context
    ctx.arc(0, 0, pacman.radius, startAngle, endAngle);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.rotate(-rotation);             // Rotate back
    ctx.translate(-pacman.x, -pacman.y); // Move origin back
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top'; // Align text from the top-left corner
    ctx.fillText(`Score: ${score}`, 10, 5); // Position score at top-left
}

function drawLives() {
    ctx.fillStyle = 'white';
    ctx.font = '18px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`Lives: ${lives}`, canvas.width - 10, 5); // Position lives at top-right
}

function drawGhost(ghost) {
    const ghostRadius = ghost.radius * 0.9; // Make ghost body slightly smaller
    const eyeRadius = ghostRadius * 0.2;
    const pupilRadius = eyeRadius * 0.5;
    const bodyBottomY = ghost.y + ghostRadius * 0.6; // Where the jagged bottom starts

    // Determine color based on state
    let primaryColor = ghost.color;
    let eyeColor = 'white';
    let pupilColor = 'black';

    if (ghost.state === GHOST_STATE.FRIGHTENED) {
        primaryColor = 'blue'; // Standard frightened color
        eyeColor = 'pink';     // Frightened eyes
        pupilColor = 'red';
         // Optional: Flash white near end of frightened state
         if (powerPelletTimer < 1500 && Math.floor(powerPelletTimer / 250) % 2 === 0) { // Flash white in last 1.5s
            primaryColor = 'white';
         }

    } else if (ghost.state === GHOST_STATE.EATEN) {
        primaryColor = 'transparent'; // Only draw eyes when eaten
        eyeColor = 'white';
        pupilColor = 'black';
    }

    ctx.fillStyle = primaryColor;

    // Draw body (semicircle + rectangle + jagged bottom) only if not eaten
    if (ghost.state !== GHOST_STATE.EATEN) {
        ctx.beginPath();
        ctx.arc(ghost.x, ghost.y, ghostRadius, Math.PI, 0); // Top semicircle
        ctx.lineTo(ghost.x + ghostRadius, bodyBottomY); // Right side down

        // Jagged bottom
        const numJaggedPoints = 4;
        for (let i = 0; i <= numJaggedPoints; i++) {
            const pointX = (ghost.x + ghostRadius) - (i * (2 * ghostRadius) / numJaggedPoints);
            const pointY = bodyBottomY + (i % 2 === 0 ? 0 : ghostRadius * 0.3); // Alternating up/down
            ctx.lineTo(pointX, pointY);
        }

        ctx.lineTo(ghost.x - ghostRadius, ghost.y); // Connect back to start of arc
        ctx.closePath();
        ctx.fill();
    }


    // Draw Eyes (always visible)
    // Eye positions relative to ghost center
    const eyeOffsetX = ghostRadius * 0.35;
    const eyeOffsetY = -ghostRadius * 0.1; // Slightly up
    const leftEyeX = ghost.x - eyeOffsetX;
    const rightEyeX = ghost.x + eyeOffsetX;
    const eyeY = ghost.y + eyeOffsetY;

    // Draw whites of eyes
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(leftEyeX, eyeY, eyeRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX, eyeY, eyeRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Draw pupils (direction based)
    let pupilOffsetX = 0;
    let pupilOffsetY = 0;
    const pupilShift = eyeRadius * 0.4; // How much pupil moves

     if (ghost.state !== GHOST_STATE.FRIGHTENED) { // Pupils look in movement direction
         if (ghost.direction === 'left') pupilOffsetX = -pupilShift;
         else if (ghost.direction === 'right') pupilOffsetX = pupilShift;
         else if (ghost.direction === 'up') pupilOffsetY = -pupilShift;
         else if (ghost.direction === 'down') pupilOffsetY = pupilShift;
     } // Frightened pupils stay centered (or could look random)

    ctx.fillStyle = pupilColor;
    ctx.beginPath();
    ctx.arc(leftEyeX + pupilOffsetX, eyeY + pupilOffsetY, pupilRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX + pupilOffsetX, eyeY + pupilOffsetY, pupilRadius, 0, 2 * Math.PI);
    ctx.fill();
}

function drawGhosts() {
    ghosts.forEach(drawGhost);
}

// --- Update Functions ---
function updatePacman() {
    // Update grid coordinates based on center pixel
    const currentGridX = Math.floor(pacman.x / TILE_SIZE);
    const currentGridY = Math.floor(pacman.y / TILE_SIZE);

     // Only update pacman's stored grid coords if they changed
     if (currentGridX !== pacman.gridX || currentGridY !== pacman.gridY) {
        pacman.gridX = currentGridX;
        pacman.gridY = currentGridY;

         // --- Pellet Eating Logic ---
         if (pacman.gridY >= 0 && pacman.gridY < ROWS && pacman.gridX >=0 && pacman.gridX < COLS) {
             const currentTile = gameMap[pacman.gridY][pacman.gridX];
             if (currentTile === 2) {
                 gameMap[pacman.gridY][pacman.gridX] = 0;
                 score += PELLET_SCORE;
             } else if (currentTile === 3) {
                 gameMap[pacman.gridY][pacman.gridX] = 0;
                 score += POWER_PELLET_SCORE;
                 activatePowerPellet();
             }
         }
     }

    // Check if Pac-Man is centered in a tile
    const centeredX = Math.abs((pacman.x % TILE_SIZE) - TILE_SIZE / 2) < pacman.speed / 2;
    const centeredY = Math.abs((pacman.y % TILE_SIZE) - TILE_SIZE / 2) < pacman.speed / 2;

    let canMoveInCurrentDir = false;

     // --- Tunnel Logic ---
     if (pacman.x < TILE_SIZE / 2 && pacman.direction === 'left') {
        pacman.x = (COLS - 1) * TILE_SIZE + TILE_SIZE / 2;
        pacman.gridX = COLS - 1;
    } else if (pacman.x > (COLS - 1) * TILE_SIZE + TILE_SIZE / 2 && pacman.direction === 'right') {
        pacman.x = TILE_SIZE / 2;
        pacman.gridX = 0;
    }

    // --- Turning Logic ---
    if (centeredX && centeredY && requestedDirection) {
        let reqNextX = pacman.gridX;
        let reqNextY = pacman.gridY;
        if (requestedDirection === 'left') reqNextX--;
        else if (requestedDirection === 'right') reqNextX++;
        else if (requestedDirection === 'up') reqNextY--;
        else if (requestedDirection === 'down') reqNextY++;

        let checkX = reqNextX;
        let checkY = reqNextY;
         if (checkX < 0) checkX = COLS -1;
         else if (checkX >= COLS) checkX = 0;

        if (isTileWalkable(checkX, checkY, pacman)) { // Use helper function with Pac-Man entity
            pacman.direction = requestedDirection;
            // Keep requestedDirection - allow holding key
        }
    }


    // --- Collision & Movement Logic ---
    let collisionCheckX = pacman.gridX;
    let collisionCheckY = pacman.gridY;
    if (pacman.direction === 'left') collisionCheckX--;
    else if (pacman.direction === 'right') collisionCheckX++;
    else if (pacman.direction === 'up') collisionCheckY--;
    else if (pacman.direction === 'down') collisionCheckY++;

     let checkX = collisionCheckX;
     let checkY = collisionCheckY;
     if (checkX < 0) checkX = COLS -1;
     else if (checkX >= COLS) checkX = 0;

    // Check for wall collision only when centered
    if (centeredX && centeredY) {
        if (isTileWalkable(checkX, checkY, pacman)) {
            canMoveInCurrentDir = true;
        } else {
             canMoveInCurrentDir = false; // Cannot move into a wall when centered
        }
    } else {
        canMoveInCurrentDir = true; // Can continue moving if not centered
    }

    // Move Pac-Man
    if (canMoveInCurrentDir && pacman.direction) {
         if (pacman.direction === 'left') pacman.x -= pacman.speed;
         else if (pacman.direction === 'right') pacman.x += pacman.speed;
         else if (pacman.direction === 'up') pacman.y -= pacman.speed;
         else if (pacman.direction === 'down') pacman.y += pacman.speed;

         // Snap to grid centers when changing perpendicular direction
         if (centeredX && (pacman.direction === 'up' || pacman.direction === 'down')) {
             pacman.x = currentGridX * TILE_SIZE + TILE_SIZE / 2; // Use current grid pos for snapping
         }
         if (centeredY && (pacman.direction === 'left' || pacman.direction === 'right')) {
              pacman.y = currentGridY * TILE_SIZE + TILE_SIZE / 2;
         }
    } else if (centeredX && centeredY && !canMoveInCurrentDir) {
        // Snap position to exact center if stopped by a wall while centered
        pacman.x = pacman.gridX * TILE_SIZE + TILE_SIZE / 2;
        pacman.y = pacman.gridY * TILE_SIZE + TILE_SIZE / 2;
    }

    // Animation
    frameCount++;
    if (frameCount % 10 === 0) {
        mouthOpen = !mouthOpen;
    }
}

function updateGhosts(deltaTime) {
    ghosts.forEach(ghost => {
        // --- State-based Speed ---
        if (ghost.state === GHOST_STATE.FRIGHTENED) ghost.speed = GHOST_FRIGHTENED_SPEED;
        else if (ghost.state === GHOST_STATE.EATEN) ghost.speed = GHOST_EATEN_SPEED;
        else ghost.speed = GHOST_SPEED; // Chase or Scatter

        // --- Ghost House Logic (Exit & Enter) ---
        if (ghost.exitTimer > 0) {
            ghost.exitTimer--;
            return; // Still waiting in house
        }
        const isInHouse = ghost.gridY === 12 && (ghost.gridX >= 9 && ghost.gridX <= 11);
        const isAtHouseDoor = ghost.gridX === GHOST_HOUSE_DOOR_TARGET.x && ghost.gridY === GHOST_HOUSE_DOOR_TARGET.y;

        // --- Eaten Logic: Returning to House & Resetting ---
        if (ghost.state === GHOST_STATE.EATEN) {
            const targetPixelYInside = 12 * TILE_SIZE + TILE_SIZE / 2;
            const targetPixelXInside = 10 * TILE_SIZE + TILE_SIZE / 2; // Center X inside house

            // Check if the ghost has arrived *inside* the house center tile (10, 12)
            if (ghost.gridY === 12 && Math.abs(ghost.y - targetPixelYInside) < ghost.speed / 2) {
                 console.log(`${ghost.name} arrived inside house center at y=${ghost.y.toFixed(1)}. Resetting state.`);

                 ghost.y = targetPixelYInside; // Snap position precisely
                 ghost.x = targetPixelXInside; // Snap X too
                 ghost.gridX = 10;
                 ghost.gridY = 12;
                 ghost.state = GHOST_STATE.SCATTER; // Reset state (or Chase?)
                 ghost.speed = GHOST_SPEED;
                 ghost.isExitingHouse = false;
                 ghost.exitTimer = 120; // Respawn delay
                 ghost.direction = 'up'; // Prepare to move towards door when timer is up
                 return; // Finished processing for this frame after reset
            }

            // Check if ghost has arrived exactly *at* the door target tile (10, 11)
            // Use centering check for precision before forcing direction change
            const centeredX = Math.abs((ghost.x % TILE_SIZE) - TILE_SIZE / 2) < ghost.speed / 2;
            const centeredY = Math.abs((ghost.y % TILE_SIZE) - TILE_SIZE / 2) < ghost.speed / 2;

            if (isAtHouseDoor && centeredX && centeredY) {
                console.log(`${ghost.name} reached door target (${ghost.gridX},${ghost.gridY}). Forcing down.`);
                ghost.direction = 'down'; // Force direction down into the house
                // The normal movement logic below will now move it downwards
            }
             // If not yet at door or already moving down, let normal pathfinding/movement handle it
             // Normal pathfinding should target GHOST_HOUSE_DOOR_TARGET until it arrives
        }

        // --- Exit Logic (Only if NOT Eaten) ---
        if (ghost.state !== GHOST_STATE.EATEN) {
            if (isInHouse && !ghost.isExitingHouse) {
                ghost.isExitingHouse = true;
                ghost.targetTile = GHOST_HOUSE_DOOR_TARGET; // Target the tile above the door
                 console.log(`${ghost.name} starting exit sequence. Target: ${ghost.targetTile.x},${ghost.targetTile.y}`);
            }
            if (ghost.isExitingHouse) {
                const targetPixelX = ghost.targetTile.x * TILE_SIZE + TILE_SIZE / 2;
                const targetPixelY = ghost.targetTile.y * TILE_SIZE + TILE_SIZE / 2;

                // Move horizontally first to center if needed
                if (Math.abs(ghost.x - targetPixelX) > ghost.speed / 2) {
                    ghost.direction = (ghost.x < targetPixelX) ? 'right' : 'left';
                    ghost.x += (ghost.direction === 'right' ? ghost.speed : -ghost.speed);
                } else {
                    ghost.x = targetPixelX; // Snap horizontally
                    // Now move vertically
                    if (Math.abs(ghost.y - targetPixelY) > ghost.speed / 2) {
                        ghost.direction = (ghost.y < targetPixelY) ? 'down' : 'up'; // Should be 'up' to exit
                        ghost.y += (ghost.direction === 'down' ? ghost.speed : -ghost.speed);
                    } else {
                        // Reached the exit tile
                        ghost.y = targetPixelY; // Snap vertically
                        ghost.gridX = ghost.targetTile.x;
                        ghost.gridY = ghost.targetTile.y;
                        ghost.isExitingHouse = false; // Officially exited
                        ghost.direction = 'left'; // Force initial direction outside house
                        console.log(`${ghost.name} exited house.`);
                    }
                }
                return; // Skip normal movement during exit sequence
            }
        }


        // --- Normal Movement / Pathfinding Logic (Includes EATEN state pathfinding to door) ---
        const centeredX = Math.abs((ghost.x % TILE_SIZE) - TILE_SIZE / 2) < ghost.speed / 2;
        const centeredY = Math.abs((ghost.y % TILE_SIZE) - TILE_SIZE / 2) < ghost.speed / 2;

        // Update grid position based on center pixel
        // Only update if actually moved significantly (helps prevent minor jitter issues)
        const newGridX = Math.floor(ghost.x / TILE_SIZE);
        const newGridY = Math.floor(ghost.y / TILE_SIZE);
        if (newGridX !== ghost.gridX || newGridY !== ghost.gridY) {
             ghost.gridX = newGridX;
             ghost.gridY = newGridY;
        }

        // --- Decision Making at Intersections (Only when centered) ---
        if (centeredX && centeredY) {
             const possibleDirs = getPossibleDirections(ghost);

             // Decide on new direction if at intersection OR if forced turn needed (like a corridor end)
             // Check if the current tile offers more than just forward/backward, or if forward is blocked
             let forceDecision = false;
             if (possibleDirs.length > 1) { // Standard intersection
                 forceDecision = true;
             } else if (possibleDirs.length === 0) { // Dead end
                 forceDecision = true;
             } else if (possibleDirs.length === 1 && possibleDirs[0] !== ghost.direction) { // Forced turn in corridor
                  forceDecision = true;
             } else {
                 // Check if moving forward is blocked (even if other options exist)
                 let forwardX = ghost.gridX; let forwardY = ghost.gridY;
                 if (ghost.direction === 'left') forwardX--; else if (ghost.direction === 'right') forwardX++;
                 else if (ghost.direction === 'up') forwardY--; else if (ghost.direction === 'down') forwardY++;
                 if (!isTileWalkable(forwardX, forwardY, ghost)) {
                     forceDecision = true; // Hit a wall, need to decide
                 }
             }


             if (forceDecision) {
                  ghost.targetTile = getGhostTargetTile(ghost); // Update target based on state

                  if (ghost.state === GHOST_STATE.FRIGHTENED) {
                     // Choose a random valid direction
                     if (possibleDirs.length > 0) {
                          ghost.direction = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
                     } else { // Dead end
                          ghost.direction = getOppositeDirection(ghost.direction);
                     }
                  } else { // Chase/Scatter/Eaten logic
                      if (ghost.targetTile) {
                          ghost.direction = chooseNextDirection(ghost, ghost.targetTile);
                      } else { // Fallback if target is null
                            if (possibleDirs.length > 0) {
                                ghost.direction = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
                            } else { // Dead end
                                ghost.direction = getOppositeDirection(ghost.direction);
                            }
                      }
                  }

                 // --- Sanity Check: Prevent choosing an immediately invalid direction ---
                 let nextX = ghost.gridX; let nextY = ghost.gridY;
                 if (ghost.direction === 'left') nextX--; else if (ghost.direction === 'right') nextX++;
                 else if (ghost.direction === 'up') nextY--; else if (ghost.direction === 'down') nextY++;

                 if (!isTileWalkable(nextX, nextY, ghost)) {
                      console.warn(`${ghost.name} chose invalid direction ${ghost.direction} at (${ghost.gridX},${ghost.gridY}). Target: (${ghost.targetTile?.x},${ghost.targetTile?.y}). State: ${ghost.state}. Reversing.`);
                      // If the chosen direction is bad, just reverse (simplest fallback)
                      const opposite = getOppositeDirection(ghost.direction);
                      if(opposite && isTileWalkable(ghost.gridX + (opposite === 'left' ? -1 : opposite === 'right' ? 1 : 0), ghost.gridY + (opposite === 'up' ? -1 : opposite === 'down' ? 1 : 0), ghost)) {
                         ghost.direction = opposite;
                      } else if (possibleDirs.length > 0){
                          // If reverse is also blocked, pick any possible dir
                           ghost.direction = possibleDirs[0];
                      } else {
                          // Truly stuck? Should not happen in valid map.
                          console.error(`${ghost.name} is TRULY STUCK at (${ghost.gridX},${ghost.gridY})`);
                      }
                 }
             }
             // If not forceDecision, continue in the current direction
        }

        // --- Execute Movement ---
        if (ghost.direction === 'left') ghost.x -= ghost.speed;
        else if (ghost.direction === 'right') ghost.x += ghost.speed;
        else if (ghost.direction === 'up') ghost.y -= ghost.speed;
        else if (ghost.direction === 'down') ghost.y += ghost.speed;

        // --- Ghost Tunnel Logic ---
        if (ghost.x < TILE_SIZE / 2 && ghost.direction === 'left') {
            ghost.x = (COLS - 1) * TILE_SIZE + TILE_SIZE / 2;
            ghost.gridX = COLS - 1;
        } else if (ghost.x > (COLS - 1) * TILE_SIZE + TILE_SIZE / 2 && ghost.direction === 'right') {
            ghost.x = TILE_SIZE / 2;
            ghost.gridX = 0;
        }

        // Snap to grid centers when moving perpendicular to tile axis (helps alignment)
        // Re-calculate centering for snapping accuracy *after* movement
         const currentGridXAfterMove = Math.floor(ghost.x / TILE_SIZE);
         const currentGridYAfterMove = Math.floor(ghost.y / TILE_SIZE);
         const centeredXAfterMove = Math.abs((ghost.x % TILE_SIZE) - TILE_SIZE / 2) < ghost.speed / 2;
         const centeredYAfterMove = Math.abs((ghost.y % TILE_SIZE) - TILE_SIZE / 2) < ghost.speed / 2;

         if (centeredXAfterMove && (ghost.direction === 'up' || ghost.direction === 'down')) {
             ghost.x = currentGridXAfterMove * TILE_SIZE + TILE_SIZE / 2;
         }
         if (centeredYAfterMove && (ghost.direction === 'left' || ghost.direction === 'right')) {
              ghost.y = currentGridYAfterMove * TILE_SIZE + TILE_SIZE / 2;
         }
    });
}

function checkCollisions() {
    ghosts.forEach(ghost => {
        if (ghost.state === GHOST_STATE.EATEN) return;

        const dx = pacman.x - ghost.x;
        const dy = pacman.y - ghost.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const collisionDistance = pacman.radius + ghost.radius * 0.7;

        if (distance < collisionDistance) {
            if (ghost.state === GHOST_STATE.FRIGHTENED) {
                console.log(`Ate ${ghost.name}!`);
                score += 200; // Simplistic score, could increase per ghost eaten
                ghost.state = GHOST_STATE.EATEN;
                ghost.speed = GHOST_EATEN_SPEED;
                ghost.targetTile = GHOST_HOUSE_DOOR_TARGET; // Target entrance of ghost house
                console.log(`${ghost.name} is now EATEN, heading home.`);
            } else {
                console.log(`Caught by ${ghost.name}!`);
                handlePacmanCaught();
            }
        }
    });
}

function handlePacmanCaught() {
    lives--;
    console.log(`Lives remaining: ${lives}`);
    // Could add a pause or animation here
    if (lives <= 0) {
        // Game over handled in game loop now
    } else {
        // Reset positions after a short delay maybe? For now, instant.
        resetPositions();
    }
}

function resetPositions() {
    // Reset Pac-Man
    pacman.x = 10 * TILE_SIZE + TILE_SIZE / 2;
    pacman.y = 17 * TILE_SIZE + TILE_SIZE / 2;
    pacman.gridX = 10;
    pacman.gridY = 17;
    pacman.direction = null;
    requestedDirection = null;

    // Reset Ghosts (ensure state/timers are reset correctly)
    ghosts.forEach((ghost, index) => {
         // Initial positions
         if (ghost.name === 'blinky') {
             ghost.x = 10 * TILE_SIZE + TILE_SIZE / 2; ghost.y = 11 * TILE_SIZE + TILE_SIZE / 2;
             ghost.gridX = 10; ghost.gridY = 11; ghost.direction = 'left'; ghost.exitTimer = 0;
         } else if (ghost.name === 'pinky') {
             ghost.x = 10 * TILE_SIZE + TILE_SIZE / 2; ghost.y = 12 * TILE_SIZE + TILE_SIZE / 2;
             ghost.gridX = 10; ghost.gridY = 12; ghost.direction = 'up'; ghost.exitTimer = 60;
         } else if (ghost.name === 'inky') {
             ghost.x = 9 * TILE_SIZE + TILE_SIZE / 2; ghost.y = 12 * TILE_SIZE + TILE_SIZE / 2;
             ghost.gridX = 9; ghost.gridY = 12; ghost.direction = 'up'; ghost.exitTimer = 120;
         } else { // Clyde
             ghost.x = 11 * TILE_SIZE + TILE_SIZE / 2; ghost.y = 12 * TILE_SIZE + TILE_SIZE / 2;
             ghost.gridX = 11; ghost.gridY = 12; ghost.direction = 'up'; ghost.exitTimer = 180;
         }
         // Reset state variables
         ghost.state = GHOST_STATE.SCATTER; // Start in scatter mode usually
         ghost.speed = GHOST_SPEED;
         ghost.isExitingHouse = false;
         ghost.targetTile = ghost.scatterTarget; // Set initial target
    });

     // Reset game state variables
     isPowerPelletActive = false;
     powerPelletTimer = 0;
     // Reset scatter/chase timer here if implemented
}

function gameOver() {
    console.log("Game Over!");
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'red';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    // Consider stopping the loop here: cancelAnimationFrame(animationFrameId);
}

function activatePowerPellet() {
    console.log("Power Pellet Activated!");
    isPowerPelletActive = true;
    powerPelletTimer = POWER_PELLET_DURATION;
    ghosts.forEach(ghost => {
        if (ghost.state !== GHOST_STATE.EATEN) {
             // Reverse direction if possible and not in house/exiting
             const opposite = getOppositeDirection(ghost.direction);
             if (opposite) {
                 let nextX = ghost.gridX; let nextY = ghost.gridY;
                  if (opposite === 'left') nextX--; else if (opposite === 'right') nextX++;
                  else if (opposite === 'up') nextY--; else if (opposite === 'down') nextY++;
                 if (isTileWalkable(nextX, nextY, ghost)) {
                     ghost.direction = opposite;
                 }
             }
            ghost.state = GHOST_STATE.FRIGHTENED;
            ghost.speed = GHOST_FRIGHTENED_SPEED;
        }
    });
}

function updatePowerPellet(deltaTime) {
    if (isPowerPelletActive) {
        powerPelletTimer -= deltaTime;
        if (powerPelletTimer <= 0) {
            console.log("Power Pellet Wore Off!");
            isPowerPelletActive = false;
            powerPelletTimer = 0;
            ghosts.forEach(ghost => {
                if (ghost.state === GHOST_STATE.FRIGHTENED) {
                    ghost.state = GHOST_STATE.CHASE; // Switch back to chase (or scatter based on timer)
                    ghost.speed = GHOST_SPEED;
                }
            });
        }
    }
}

// --- Event Listeners ---
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
            requestedDirection = 'up';
            break;
        case 'ArrowDown':
        case 's':
            requestedDirection = 'down';
            break;
        case 'ArrowLeft':
        case 'a':
            requestedDirection = 'left';
            break;
        case 'ArrowRight':
        case 'd':
            requestedDirection = 'right';
            break;
    }
});

// --- Game Loop ---
let lastTime = 0;
let animationFrameId = null; // Store the request ID
let gameRunning = true; // Flag to stop the loop

function gameLoop(timestamp) {
    if (!gameRunning) return; // Exit if game stopped

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // 1. Update game state
    updatePacman();
    updateGhosts(deltaTime); // Now uses new AI logic
    updatePowerPellet(deltaTime);
    checkCollisions();

    if (lives <= 0) {
         gameOver();
         gameRunning = false; // Stop the game loop
         // Optional: cancelAnimationFrame(animationFrameId);
         return;
    }

    // 2. Clear the canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Draw game elements
    drawMap();
    drawPacman();
    drawGhosts();
    drawScore();
    drawLives();

    // Request the next frame
    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Start the game ---
resetPositions();
lastTime = performance.now();
gameRunning = true; // Make sure flag is true initially
animationFrameId = requestAnimationFrame(gameLoop);

console.log("Pac-Man game running with updated Ghost AI");

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }));

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideNav = navMenu.contains(event.target) || hamburger.contains(event.target);
            
            if (!isClickInsideNav && navMenu.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Header scroll effect
    const header = document.querySelector('.header');
    if (header) {
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            lastScrollY = window.scrollY;
        });
    }

    // Reading time calculator for blog posts
    function calculateReadingTime() {
        const content = document.querySelector('.post-content, .blog-content');
        if (content) {
            const text = content.textContent || content.innerText || '';
            const wordsPerMinute = 200;
            const words = text.trim().split(/\s+/).length;
            const minutes = Math.ceil(words / wordsPerMinute);
            
            const readingTimeElement = document.querySelector('.reading-time');
            if (readingTimeElement) {
                readingTimeElement.textContent = `${minutes} min read`;
            }
        }
    }

    // Initialize reading time calculation
    calculateReadingTime();

    // Add loading animation for external links
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        link.addEventListener('click', function() {
            // Add a small loading indicator
            this.style.opacity = '0.7';
            setTimeout(() => {
                this.style.opacity = '1';
            }, 1000);
        });
    });

    // Progressive enhancement for form submissions (if any)
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Submitting...';
                
                // Re-enable after a delay (this would normally be handled by actual form processing)
                setTimeout(() => {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Submit';
                }, 3000);
            }
        });
    });

    // Blog post filtering and search (for blog listing page)
    const searchInput = document.querySelector('.blog-search');
    const categoryFilters = document.querySelectorAll('.category-filter');
    const postCards = document.querySelectorAll('.post-card');

    if (searchInput && postCards.length > 0) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterPosts(searchTerm);
        });
    }

    if (categoryFilters.length > 0) {
        categoryFilters.forEach(filter => {
            filter.addEventListener('click', function() {
                const category = this.dataset.category;
                
                // Update active state
                categoryFilters.forEach(f => f.classList.remove('active'));
                this.classList.add('active');
                
                // Filter posts
                filterPostsByCategory(category);
            });
        });
    }

    function filterPosts(searchTerm = '') {
        postCards.forEach(card => {
            const title = card.querySelector('.post-title').textContent.toLowerCase();
            const excerpt = card.querySelector('.post-excerpt').textContent.toLowerCase();
            const category = card.querySelector('.post-category').textContent.toLowerCase();
            
            const matchesSearch = title.includes(searchTerm) || 
                                excerpt.includes(searchTerm) || 
                                category.includes(searchTerm);
            
            if (matchesSearch) {
                card.style.display = 'block';
                card.style.animation = 'fadeIn 0.3s ease-in';
            } else {
                card.style.display = 'none';
            }
        });
    }

    function filterPostsByCategory(category) {
        postCards.forEach(card => {
            const postCategory = card.querySelector('.post-category').textContent.toLowerCase();
            
            if (category === 'all' || postCategory === category.toLowerCase()) {
                card.style.display = 'block';
                card.style.animation = 'fadeIn 0.3s ease-in';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Add CSS for fade-in animation if not already present
    if (!document.querySelector('#fadeInStyles')) {
        const style = document.createElement('style');
        style.id = 'fadeInStyles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .header.scrolled {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize any other interactive elements
    initializeInteractiveElements();
});

function initializeInteractiveElements() {
    // Add hover effects to cards
    const cards = document.querySelectorAll('.post-card, .feature-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add copy-to-clipboard functionality for code blocks
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach(block => {
        const button = document.createElement('button');
        button.className = 'copy-button';
        button.textContent = 'Copy';
        button.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #2563eb;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        
        const pre = block.parentElement;
        if (pre.tagName === 'PRE') {
            pre.style.position = 'relative';
            pre.appendChild(button);
            
            button.addEventListener('click', function() {
                navigator.clipboard.writeText(block.textContent).then(() => {
                    button.textContent = 'Copied!';
                    setTimeout(() => {
                        button.textContent = 'Copy';
                    }, 2000);
                });
            });
        }
    });
}