import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD6-XALxgW4MM9RE8okNsNwUEOipJJG00g",
    authDomain: "perpustakaan-web.firebaseapp.com",
    projectId: "perpustakaan-web",
    storageBucket: "perpustakaan-web.firebasestorage.app",
    messagingSenderId: "39289548587",
    appId: "1:39289548587:web:6022c2cb01db20a7479f6e",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

//submit buttons
const submit = document.getElementById('submit');
submit.addEventListener("click", function (event) {
    event.preventDefault()

    //inputs
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed up 
            const user = userCredential.user;
            alert("Logging in...")
            window.location.href = "dashboard.html";
            // ...
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert(errorMessage)
            // ..
        });
})



