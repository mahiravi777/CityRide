document.getElementById("requestShare").addEventListener("click", function () {
    const recipientEmail = document.getElementById("recipientEmail").value;
    const duration = document.getElementById("duration").value;
    const user = auth.currentUser;

    if (!user) {
        alert("User not logged in!");
        return;
    }

    if (recipientEmail && duration) {
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

auth.onAuthStateChanged(user => {
    if (user) {
        db.ref("locationRequests")
            .once("value")
            .then(snapshot => {
                const requestsList = document.getElementById("requestsList");
                if (requestsList) requestsList.innerHTML = "";

                const continueDiv = document.getElementById("continueDiv");
                if (continueDiv) continueDiv.innerHTML = "";

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
                        if (requestsList) requestsList.appendChild(li);
                    }

                    // Show "Continue" button for active requests
                    const requestAccepted = request.status === "accepted";
                    const isInvolved = request.requestedBy === user.uid || request.recipientUID === user.uid;

                    if (requestAccepted && isInvolved) {
                        const requestStart = request.timestamp;
                        const requestDuration = parseInt(request.duration) * 60 * 1000;
                        const now = Date.now();

                        if ((now - requestStart) <= requestDuration) {
                            const withUID = request.requestedBy === user.uid ? request.recipientUID : request.requestedBy;
                            const btn = document.createElement("button");
                            btn.textContent = "Continue Live Tracking";
                            btn.onclick = () => {
                                window.location.href = `liveTracking.html?with=${withUID}`;
                            };
                            if (continueDiv) continueDiv.appendChild(btn);
                        }
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
        status: "accepted",
        timestamp: Date.now()  // Overwrite with client timestamp for tracking
    }).then(() => {
        alert("Request accepted! Redirecting to live tracking...");
        window.location.href = `liveTracking.html?with=${requesterUID}`;
    });
}
