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

// Listen for incoming and accepted location sharing requests
auth.onAuthStateChanged(user => {
    if (user) {
        db.ref("locationRequests")
            .on("value", snapshot => {
                const requestsList = document.getElementById("requestsList");
                requestsList.innerHTML = "";

                snapshot.forEach(childSnapshot => {
                    const request = childSnapshot.val();
                    const key = childSnapshot.key;

                    // Show incoming requests
                    if (request.recipientEmail === user.email && request.status === "pending") {
                        const li = document.createElement("li");
                        li.innerHTML = `
                            ${request.requestedByEmail} wants your location for ${request.duration} minutes.
                            <button onclick="acceptRequest('${key}', '${request.requestedBy}')">Accept</button>
                        `;
                        requestsList.appendChild(li);
                    }

                    // If this user is the requester (User A), and it's accepted, redirect
                    if (request.requestedBy === user.uid && request.status === "accepted") {
                        window.location.href = `liveTracking.html?with=${request.recipientUID}`;
                    }

                    // If this user is the accepter (User B), and it's accepted, redirect
                    if (request.recipientUID === user.uid && request.status === "accepted") {
                        window.location.href = `liveTracking.html?with=${request.requestedBy}`;
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
