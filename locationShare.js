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
        const userUID = user.uid;
        const userEmail = user.email;

        db.ref("locationRequests")
            .on("value", snapshot => {
                const requestsList = document.getElementById("requestsList");
                const continueDiv = document.getElementById("continueDiv");

                if (requestsList) requestsList.innerHTML = "";
                if (continueDiv) continueDiv.innerHTML = "";

                snapshot.forEach(childSnapshot => {
                    const request = childSnapshot.val();
                    const key = childSnapshot.key;

                    // --- SHOW INCOMING REQUESTS ---
                    if (request.recipientEmail === userEmail && request.status === "pending") {
                        const li = document.createElement("li");
                        li.innerHTML = `
                            ${request.requestedByEmail} wants your location for ${request.duration} minutes.
                            <button onclick="acceptRequest('${key}', '${request.requestedBy}')">Accept</button>
                        `;
                        requestsList.appendChild(li);
                    }

                    // --- SHOW "CONTINUE" BUTTON FOR ACTIVE REQUESTS ---
                    const requestAccepted = request.status === "accepted";
                    const isInvolved = request.requestedBy === userUID || request.recipientUID === userUID;

                    if (requestAccepted && isInvolved) {
                        const requestStart = request.timestamp;
                        const requestDuration = parseInt(request.duration) * 60 * 1000;
                        const now = Date.now();

                        if ((now - requestStart) <= requestDuration) {
                            const withUID = request.requestedBy === userUID ? request.recipientUID : request.requestedBy;

                            // If still on locationShare.html and not already on liveTracking, show continue button
                            const continueButton = document.createElement("button");
                            continueButton.textContent = "Continue Live Tracking";
                            continueButton.onclick = () => {
                                window.location.href = `liveTracking.html?with=${withUID}`;
                            };
                            continueDiv.appendChild(continueButton);

                            // --- Auto-Redirect Requester if Request Got Accepted ---
                            if (request.requestedBy === userUID && !window.alreadyRedirected) {
                                window.alreadyRedirected = true; // prevent infinite loop
                                setTimeout(() => {
                                    window.location.href = `liveTracking.html?with=${request.recipientUID}`;
                                }, 1000);
                            }
                        }
                    }
                });
            });
    }
});

// Accept a request
function acceptRequest(requestKey, requesterUID) {
    const acceptedAt = Date.now();

    db.ref("locationRequests/" + requestKey).update({
        status: "accepted",
        acceptedAt: acceptedAt
    }).then(() => {
        alert("Request accepted! Redirecting to live tracking...");

        // Redirect both users (requester and recipient) to liveTracking.html
        // with the UID of the other participant in the query param
        window.location.href = `liveTracking.html?with=${requesterUID}`;
    }).catch(error => {
        console.error("Error accepting request:", error);
        alert("Failed to accept the request. Please try again.");
    });
}
