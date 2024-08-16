document.addEventListener('DOMContentLoaded', function() {
    // Initialize EmailJS
    emailjs.init('pTV87sASgMu5Dxtyj'); // Replace with your EmailJS user ID

    const registerForm = document.getElementById('register-form');
    const registerMessage = document.getElementById('register-message');

    registerForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Store user data in localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const existingUser = users.find(u => u.username === username || u.email === email);

        if (existingUser) {
            registerMessage.textContent = 'Username or email already exists.';
        } else {
            users.push({ username, email, password });
            localStorage.setItem('users', JSON.stringify(users));

            // Send email via EmailJS
            emailjs.send('service_k58alx8', 'template_lwr7iea', {
                to_email: email,     // Ensure this matches the placeholder in your template
                username: username   // Ensure this matches the placeholder in your template
            })
            .then(response => {
                console.log('Email sent successfully:', response.status, response.text);
                registerMessage.innerHTML = 'Registration successful! Please <a href="index.html">login</a>.';
            })
            .catch(error => {
                console.error('Error sending email:', error);
                registerMessage.textContent = 'Failed to send registration email.';
            });
        }
    });
});
