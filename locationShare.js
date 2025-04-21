document.getElementById("requestShare").addEventListener("click", function () {
    const recipientEmail = document.getElementById("recipientEmail").value;
    const duration = document.getElementById("duration").value;
    const user = auth.currentUser;

    if (!user) {
        alert("User not logged in!");
        return;
    }

    if (recipientEmail && duration) {
        // Find recipient UID based on email
        db.ref("users").orderByChild("email").equalTo(recipientEmail).once("value", snapshot => {
            if (snapshot.exists()) {
                const recipientUID = Object.keys(snapshot.val())[0];

                const requestData = {
                    requestedBy: user.uid,
                    requestedByEmail: user.email,
                    recipientEmail: recipientEmail,
                    recipientUID: recipientUID,
                    duration: duration,
                    status: "pending",
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                };

                db.ref("locationRequests").push(requestData)
                    .then(() => {
                        alert("Location sharing request sent!");
                    })
                    .catch(error => {
                        console.error(error);
                        alert("Error sending request: " + error.message);
                    });

            } else {
                alert("Recipient not found!");
            }
        });
    } else {
        alert("Please enter recipient's email and duration!");
    }
});
let redirectedToTracking = false;

auth.onAuthStateChanged(user => {
    if (user) {
        db.ref("locationRequests")
            .orderByChild("recipientEmail")
            .equalTo(user.email)
            .on("value", snapshot => {
                const requestsList = document.getElementById("requestsList");
                if (requestsList) requestsList.innerHTML = "";

                snapshot.forEach(childSnapshot => {
                    const request = childSnapshot.val();
                    const key = childSnapshot.key;

                    if (request.status === "pending") {
                        const li = document.createElement("li");
                        li.innerHTML = `
                            ${request.requestedByEmail} wants your location for ${request.duration} minutes.
                            <button onclick="acceptRequest('${key}', '${request.requestedBy}')">Accept</button>
                        `;
                        if (requestsList) requestsList.appendChild(li);
                    }

                    // ✅ Only redirect if NOT already redirected in this session
                    else if (
                        request.status === "accepted" &&
                        request.requestedBy === user.uid &&
                        !redirectedToTracking
                    ) {
                        redirectedToTracking = true;
                        setTimeout(() => {
                            window.location.href = `liveTracking.html?with=${request.recipientEmail.replace('.', '_')}`;
                        }, 1000); // short delay for smoother UX
                    }
                });
            });
    }
});


// Accept a request
function acceptRequest(requestKey, requesterUID) {
    const user = auth.currentUser;
    if (!user) return;

    db.ref("locationRequests/" + requestKey).update({
        status: "accepted"
    }).then(() => {
        alert("Request accepted! Redirecting to live tracking...");
        // Accepter (User B) redirected
        window.location.href = `liveTracking.html?with=${requesterUID}`;
    });
}
