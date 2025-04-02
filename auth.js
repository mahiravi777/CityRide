document.getElementById("signup").addEventListener("click", function () {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;
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

document.getElementById("login").addEventListener("click", function () {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            alert("Login successful!");
            window.location.href = "locationShare.html";
        })
        .catch(error => {
            alert(error.message);
        });
});
