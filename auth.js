// SIGNUP
document.getElementById("signup").addEventListener("click", function () {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;

            // Save to Realtime Database
            return db.ref("users/" + user.uid).set({
                email: email
            });
        })
        .then(() => {
            alert("Signup successful! Redirecting...");
            window.location.href = "locationShare.html";
        })
        .catch(error => {
            alert(error.message);
        });
});

// LOGIN
document.getElementById("login").addEventListener("click", function () {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;

            // ✅ Ensure user is stored in database on login too
            return db.ref("users/" + user.uid).set({
                email: email
            });
        })
        .then(() => {
            alert("Login successful!");
            window.location.href = "locationShare.html";
        })
        .catch(error => {
            alert(error.message);
        });
});
