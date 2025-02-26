document.getElementById("signup").addEventListener("click", function () {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.querySelector('input[name="role"]:checked').value; // Get selected role

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;
            return db.ref("users/" + user.uid).set({
                email: email,
                role: role // Save user role in the database
            });
        })
        .then(() => {
            alert("Signup successful! Redirecting...");
            window.location.href = role === "rider" ? "requestRide.html" : "driverDashboard.html";
        })
        .catch(error => {
            alert(error.message);
        });
});

document.getElementById("login").addEventListener("click", function () {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;
            return db.ref("users/" + user.uid).once("value");
        })
        .then(snapshot => {
            const userData = snapshot.val();
            if (userData && userData.role) {
                alert("Login successful!");
                window.location.href = userData.role === "rider" ? "requestRide.html" : "driverDashboard.html";
            } else {
                alert("Error: User role not found.");
            }
        })
        .catch(error => {
            alert(error.message);
        });
});
