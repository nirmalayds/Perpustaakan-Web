import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
// Ganti import database dengan firestore
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD6-XALxgW4MM9RE8okNsNwUEOipJJG00g",
    authDomain: "perpustakaan-web.firebaseapp.com",
    databaseURL: "https://perpustakaan-web-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "perpustakaan-web",
    storageBucket: "perpustakaan-web.appspot.com",
    messagingSenderId: "39289548587",
    appId: "1:39289548587:web:6022c2cb01db20a7479f6e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Ganti getDatabase dengan getFirestore
const db = getFirestore(app);

const submit = document.getElementById('submit')?.addEventListener("click", function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('nd').value;
    const username = document.getElementById('username').value;
    const phone = document.getElementById('phone').value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            // Simpan data users ke Firestore (bukan Realtime Database)
            return setDoc(doc(db, 'users', user.uid), {
                name: name,
                username: username,
                email: email,
                phoneNumber: phone,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString() // Tambahkan field updatedAt
            });
        })
        .then(() => {
            alert("Akun berhasil dibuat!");
            window.location.href = "login-user.html";
        })
        .catch((error) => {
            let errorMessage = "Terjadi error: " + error.message;
            
            if (error.code === "auth/email-already-in-use") {
                errorMessage = "Email sudah terdaftar!";
            } else if (error.code === "auth/weak-password") {
                errorMessage = "Password minimal 6 karakter!";
            } else if (error.code === "auth/invalid-email") {
                errorMessage = "Format email tidak valid!";
            }
            
            alert(errorMessage);
        });
});