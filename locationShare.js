// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA4LG8DwtEGn99KeG1jDBGt82qs3a5C9Cg",
    authDomain: "cityride-6f0ba.firebaseapp.com",
    databaseURL: "https://cityride-6f0ba-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "cityride-6f0ba",
    storageBucket: "cityride-6f0ba.firebasestorage.app",
    messagingSenderId: "12444627870",
    appId: "1:12444627870:web:f3b6b1cea05c14654c1c8f"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

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

// Listen for incoming location sharing requests
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
        alert("Request accepted! Sharing live location.");

        // Start sharing current user's location
        navigator.geolocation.watchPosition(position => {
            const { latitude, longitude } = position.coords;

            db.ref("sharedLocations/" + user.uid).set({
                latitude,
                longitude,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                sharingWith: requesterUID
            });
        }, error => {
            console.error(error);
            alert("Error accessing location: " + error.message);
        }, {
            enableHighAccuracy: true,
            maximumAge: 0
        });

        // Also start listening to the other user's location
        listenToUserLocation(requesterUID);
    });
}

// Listen to another user's shared location
function listenToUserLocation(uid) {
    const locationDiv = document.getElementById("otherUserLocation");
    db.ref("sharedLocations/" + uid).on("value", snapshot => {
        const data = snapshot.val();
        if (data) {
            locationDiv.innerHTML = `
                <h3>User Location:</h3>
                <p>Latitude: ${data.latitude}</p>
                <p>Longitude: ${data.longitude}</p>
                <p>Updated at: ${new Date(data.timestamp).toLocaleTimeString()}</p>
            `;
        }
    });
}
