document.getElementById("signup").addEventListener("click", function() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.querySelector('input[name="role"]:checked').value;

    auth.createUserWithEmailAndPassword(email, password).then(user => {
        db.ref("users/" + user.user.uid).set({ email, role });
        alert("Account Created! Please log in.");
    }).catch(error => {
        alert(error.message);
    });
});

document.getElementById("login").addEventListener("click", function() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    auth.signInWithEmailAndPassword(email, password).then(user => {
        alert("Login Successful!");
    }).catch(error => {
        alert(error.message);
    });
});
