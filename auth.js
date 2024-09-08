// Basic authentication
const today = new Date();
const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const month = monthNames[today.getMonth()]; // Get current month
const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][today.getDay()]; // Get current day of the week

const validPassword = `695 4420 ${month} ${dayOfWeek}`; // Generate password

// Alert the generated password for debugging
alert(`Generated Password: ${validPassword}`);

document.getElementById('authForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission

    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if (pass !== validPassword) {
        alert("Access denied");
        window.location.href = "about:blank"; // Redirect to a blank page
    } else {
        // Redirect to another page if authentication is successful
        window.location.href = "about:blank"; // Change this to your desired page
    }
});