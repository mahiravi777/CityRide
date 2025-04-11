document.getElementById("requestShare").addEventListener("click", function () {
    const recipientEmail = document.getElementById("recipientEmail").value;
    const duration = document.getElementById("duration").value;
    const user = auth.currentUser;

    if (user && recipientEmail && duration) {
        // Create a new location sharing request
        const newRequestRef = db.ref("locationRequests/").push(); // Push generates unique key

        newRequestRef.set({
            requestedByName: user.displayName || "Anonymous",
            requestedByEmail: user.email,
            recipientEmail: recipientEmail,
            duration: duration,
            status: "pending"
        }).then(() => {
            alert("Location sharing request sent!");
        }).catch(error => {
            alert("Error: " + error.message);
        });
    } else {
        alert("Please fill in all fields.");
    }
});

auth.onAuthStateChanged(user => {
    if (user) {
        // Listen for incoming requests where current user's email matches recipientEmail
        db.ref("locationRequests/")
            .orderByChild("recipientEmail")
            .equalTo(user.email)
            .on("value", snapshot => {
                const requestsList = document.getElementById("requestsList");
                requestsList.innerHTML = ""; // Clear previous list

                snapshot.forEach(requestSnapshot => {
                    const request = requestSnapshot.val();
                    const li = document.createElement("li");

                    li.innerHTML = `
                        ${request.requestedByName} (${request.requestedByEmail}) wants to share location with you for ${request.duration} mins.
                        <button onclick="acceptRequest('${requestSnapshot.key}')">Accept</button>
                    `;

                    requestsList.appendChild(li);
                });
            });
    }
});

function acceptRequest(requestID) {
    // Update the status of the selected request to "accepted"
    db.ref("locationRequests/" + requestID).update({
        status: "accepted"
    }).then(() => {
        console.log("Request accepted!");
        alert("You accepted the location sharing request!");
    }).catch(error => {
        console.error("Error updating request: ", error);
    });
}
