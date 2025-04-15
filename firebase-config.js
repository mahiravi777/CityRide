// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAlJw5hueg9BJ3xCgvjbPuP46figp6EUhg",
  authDomain: "cityride-6f0ba.firebaseapp.com",
  databaseURL: "https://cityride-6f0ba-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cityride-6f0ba",
  storageBucket: "cityride-6f0ba.firebasestorage.app",
  messagingSenderId: "12444627870",
  appId: "1:12444627870:web:f3b6b1cea05c14654c1c8f",
  measurementId: "G-6D4XLZDR2E"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();
