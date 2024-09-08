<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game Selection</title>
    <link rel="stylesheet" href="../index.css">
    <style>
        body {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #000;
            color: #fff;
            font-family: Arial, sans-serif;
        }
        button {
            padding: 10px 20px;
            margin: 10px;
            font-size: 16px;
            cursor: pointer;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            transition: background-color 0.3s;
        }
        button:hover {
            background-color: #45a049;
        }
        canvas {
            display: none; /* Hide canvas initially */
            border: 1px solid #fff;
        }
    </style>
</head>
<body>
    <h1>Space Invaders</h1>
    <canvas id="gameCanvas" width="480" height="320"></canvas>
    <script src="./spaceinvaders.js"></script>
</body>
</html>