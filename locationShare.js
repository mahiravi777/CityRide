// Function to send a location sharing request
document.getElementById("requestShare").addEventListener("click", function () {
    const recipientEmail = document.getElementById("recipientEmail").value;
    const duration = document.getElementById("duration").value;
    const user = auth.currentUser;

    if (!user) {
        alert("User not logged in!");
        return;
    }

    if (recipientEmail && duration) {
        const requestData = {
            requestedBy: user.uid,
            requestedByEmail: user.email,
            recipientEmail: recipientEmail,
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
        alert("Please enter recipient's email and duration!");
    }
});

// Listen for incoming and accepted location sharing requests
auth.onAuthStateChanged(user => {
    if (user) {
        db.ref("locationRequests")
            .orderByChild("recipientEmail")
            .equalTo(user.email)
            .on("value", snapshot => {
                const requestsList = document.getElementById("requestsList");
                requestsList.innerHTML = "";

                snapshot.forEach(childSnapshot => {
                    const request = childSnapshot.val();
                    const key = childSnapshot.key;

                    if (request.status === "pending") {
                        const li = document.createElement("li");
                        li.innerHTML = `
                            ${request.requestedByEmail} wants your location for ${request.duration} minutes.
                            <button onclick="acceptRequest('${key}', '${request.requestedBy}')">Accept</button>
                        `;
                        requestsList.appendChild(li);
                    }

                    // ✅ PLACE THIS BLOCK HERE to handle requester (User A)
                    else if (request.status === "accepted" && request.requestedBy === user.uid) {
                        // Redirect requester (User A) to live tracking
                        window.location.href = `liveTracking.html?with=${request.recipientEmail.replace('.', '_')}`;
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

        // Redirect accepter (User B) to live tracking
        window.location.href = `liveTracking.html?with=${requesterUID}`;
    });
}
