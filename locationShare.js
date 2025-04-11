document.getElementById("requestShare").addEventListener("click", function () {
    const recipientEmail = document.getElementById("recipientEmail").value;
    const duration = document.getElementById("duration").value;
    const user = auth.currentUser;

    if (user && recipientEmail && duration) {
        db.ref("locationRequests/" + recipientUID).set({
            requestedBy: auth.currentUser.displayName, // ✅ Store the requesting user's name (User A)
            duration: duration
            status: "pending"
        }).then(() => {
            alert("Location sharing request sent!");
        }).catch(error => {
            alert("Error: " + error.message);
        });
    }
});

auth.onAuthStateChanged(user => {
    if (user) {
        db.ref("locationRequests/").orderByChild("recipientEmail").equalTo(user.email)
            .on("value", snapshot => {
                document.getElementById("requestsList").innerHTML = "";
                snapshot.forEach(request => {
                    const li = document.createElement("li");
                    li.innerHTML = `${request.val().recipientEmail} wants to share location for ${request.val().duration} mins
                        <button onclick="acceptRequest('${request.key}')">Accept</button>`;
                    document.getElementById("requestsList").appendChild(li);
                });
            });
    }
});

function acceptRequest(requestId) {
    db.ref("locationRequests/" + requestId).update({ status: "accepted" });
}
