const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player = {
    x: canvas.width / 2 - 15,
    y: canvas.height - 30,
    width: 30,
    height: 30,
    speed: 5,
    bullets: []
};

let aliens = [];
let alienRows = 5;
let alienCols = 10;
let alienWidth = 30;
let alienHeight = 30;
let alienSpeed = 1;
let alienDirection = 1; // 1 for right, -1 for left

// Create aliens
function createAliens() {
    aliens = []; // Reset aliens
    for (let row = 0; row < alienRows; row++) {
        for (let col = 0; col < alienCols; col++) {
            aliens.push({
                x: col * (alienWidth + 10) + 30,
                y: row * (alienHeight + 10) + 30,
                width: alienWidth,
                height: alienHeight,
                isHit: false // Track if the alien is hit
            });
        }
    }
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawAliens();
    moveAliens();
    updateBullets();
    checkCollisions();
    requestAnimationFrame(gameLoop);
}

// Draw player
function drawPlayer() {
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Draw aliens
function drawAliens() {
    ctx.fillStyle = '#FF0000';
    aliens.forEach(alien => {
        if (!alien.isHit) {
            ctx.fillRect(alien.x, alien.y, alien.width, alien.height);
        }
    });
}

// Move aliens
function moveAliens() {
    let edgeReached = false;
    aliens.forEach(alien => {
        if (alien.x + alien.width >= canvas.width || alien.x <= 0) {
            edgeReached = true;
        }
    });

    if (edgeReached) {
        alienDirection *= -1;
        aliens.forEach(alien => {
            alien.y += 10; // Move down
        });
    }

    aliens.forEach(alien => {
        alien.x += alienSpeed * alienDirection;
    });
}

// Update bullets
function updateBullets() {
    player.bullets.forEach((bullet, index) => {
        bullet.y -= 5; // Move bullet up
        if (bullet.y < 0) {
            player.bullets.splice(index, 1); // Remove bullet if it goes off screen
        }
    });
}

// Check collisions
function checkCollisions() {
    player.bullets.forEach((bullet, bulletIndex) => {
        aliens.forEach((alien, alienIndex) => {
            if (!alien.isHit && bullet.x < alien.x + alien.width && bullet.x + bullet.width > alien.x &&
                bullet.y < alien.y + alien.height && bullet.y + bullet.height > alien.y) {
                alien.isHit = true; // Mark alien as hit
                player.bullets.splice(bulletIndex, 1); // Remove bullet
            }
        });
    });
}

// Shoot bullet
function shoot() {
    const bullet = {
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 10
    };
    player.bullets.push(bullet);
}

// Key controls
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' && player.x > 0) {
        player.x -= player.speed;
    } else if (event.key === 'ArrowRight' && player.x < canvas.width - player.width) {
        player.x += player.speed;
    } else if (event.key === ' ') {
        shoot();
    }
});

// Start Alien Invaders Game
function startAlienInvaders() {
    createAliens(); // Create aliens for the game
    canvas.style.display = 'block'; // Show the canvas
    gameLoop(); // Start the game loop
}

startAlienInvaders();