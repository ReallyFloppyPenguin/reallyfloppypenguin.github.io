<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentication</title>
    <script src="auth.js" defer></script>
</head>
<body>
    <h1>Authentication</h1>
    <form id="authForm">
        <label for="username">Username:</label>
        <input type="text" id="username" required>
        <br>
        <label for="password">Password:</label>
        <input type="password" id="password" required>
        <br>
        <button type="submit">Authenticate</button>
    </form>
</body>
</html>