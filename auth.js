// Basic authentication
const today = new Date();
const dayOfMonth = today.getDate(); // Get current day of the month
const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const dayOfWeek = daysOfWeek[today.getDay()]; // Get current day of the week

const validPassword = `695 4420 ${dayOfMonth} ${dayOfWeek}`; // Generate password

const user = prompt("Enter username:");
const pass = prompt("Enter password:");

if (pass !== validPassword) {
    alert("Access denied");
    window.location.href = "about:blank"; // Redirect to a blank page
} else {
    // Redirect to another page if authentication is successful
    window.location.href = "about:blank"; // Change this to your desired page
}