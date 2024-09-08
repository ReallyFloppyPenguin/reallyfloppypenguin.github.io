
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Punjabi Letter Shooter</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: black;
            color: white;
            font-family: Arial, sans-serif;
        }
        canvas {
            border: 1px solid white;
        }
    </style>
</head>
<body>
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        // Game variables
        const player = { x: 375, y: 550, width: 50, height: 50 };
        let bullets = [];
        let letters = [];
        const shootableLetters = ['ਓ', 'ਆ', 'ਏ'];
        const nonShootableLetters = ['ਸ', 'ਕ'];
        let lives = 3;
        let letterSpeed = 2;
        let letterSpawnTime = 100; // frames
        let frameCount = 0;

        // Player movement state
        const keys = {
            left: false,
            right: false,
        };

        // Draw player
        function drawPlayer() {
            ctx.fillStyle = 'white';
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }

        // Draw bullets
        function drawBullets() {
            ctx.fillStyle = 'white';
            bullets.forEach(bullet => {
                ctx.fillRect(bullet.x, bullet.y, 10, 20);
            });
        }

        // Draw letters
        function drawLetters() {
            ctx.fillStyle = 'white';
            letters.forEach(letter => {
                ctx.font = '40px Arial';
                ctx.fillText(letter.char, letter.x, letter.y);
            });
        }

        // Draw lives
        function drawLives() {
            ctx.font = '20px Arial';
            ctx.fillText(`Lives: ${lives}`, 10, 20);
        }

        // Update game state
        function update() {
            // Move letters down
            letters.forEach(letter => {
                letter.y += letterSpeed;
            });

            // Move bullets up
            bullets.forEach(bullet => {
                bullet.y -= 5;
            });

            // Check for collisions
            bullets.forEach((bullet, bulletIndex) => {
                letters.forEach((letter, letterIndex) => {
                    if (bullet.x < letter.x + 40 && bullet.x + 10 > letter.x && bullet.y < letter.y && bullet.y + 20 > letter.y) {
                        if (shootableLetters.includes(letter.char)) {
                            // Remove bullet and letter
                            bullets.splice(bulletIndex, 1);
                            letters.splice(letterIndex, 1);
                        } else {
                            // Lose a life
                            bullets.splice(bulletIndex, 1);
                            lives--;
                            if (lives <= 0) {
                                alert('Game Over!');
                                document.location.reload();
                            }
                        }
                    }
                });
            });

            // Remove off-screen bullets and letters
            bullets = bullets.filter(bullet => bullet.y > 0);
            letters = letters.filter(letter => letter.y < canvas.height);

            // Update player position based on key states
            if (keys.left && player.x > 0) {
                player.x -= 5; // Adjust speed as needed
            }
            if (keys.right && player.x < canvas.width - player.width) {
                player.x += 5; // Adjust speed as needed
            }
        }

        // Spawn letters
        function spawnLetters() {
            if (frameCount % letterSpawnTime === 0) {
                const char = Math.random() < 0.5 ? shootableLetters[Math.floor(Math.random() * shootableLetters.length)] : nonShootableLetters[Math.floor(Math.random() * nonShootableLetters.length)];
                letters.push({ char, x: Math.random() * (canvas.width - 40), y: 0 });
            }
        }

        // Game loop
        function gameLoop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawPlayer();
            drawBullets();
            drawLetters();
            drawLives();
            update();
            spawnLetters();
            frameCount++;
            requestAnimationFrame(gameLoop);
        }

        // Handle keyboard input
        document.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft') {
                keys.left = true;
            } else if (event.key === 'ArrowRight') {
                keys.right = true;
            } else if (event.key === ' ') {
                bullets.push({ x: player.x + player.width / 2 - 5, y: player.y });
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.key === 'ArrowLeft') {
                keys.left = false;
            } else if (event.key === 'ArrowRight') {
                keys.right = false;
            }
        });

        // Start the game
        gameLoop();
    </script>
</body>
</html>