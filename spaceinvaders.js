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
for (let row = 0; row < alienRows; row++) {
    for (let col = 0; col < alienCols; col++) {
        aliens.push({
            x: col * (alienWidth + 10) + 30,
            y: row * (alienHeight + 10) + 30,
            width: alienWidth,
            height: alienHeight
        });
    }
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawAliens();
    moveAliens();
    updateBullets();
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
        ctx.fillRect(alien.x, alien.y, alien.width, alien.height);
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

// Start the game
gameLoop();