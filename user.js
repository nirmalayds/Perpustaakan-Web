import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    query, 
    orderBy,
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD6-XALxgW4MM9RE8okNsNwUEOipJJG00g",
    authDomain: "perpustakaan-web.firebaseapp.com",
    databaseURL: "https://perpustakaan-web-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "perpustakaan-web",
    storageBucket: "perpustakaan-web.appspot.com",
    messagingSenderId: "39289548587",
    appId: "1:39289548587:web:6022c2cb01db20a7479f6e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Format tanggal dari ISO string
function formatDate(isoString) {
    if (!isoString) return '-';
    
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error("Error formatting date:", error);
        return '-';
    }
}

// Fungsi untuk memuat data user
async function loadUsers() {
    const usersTable = document.getElementById('users-table');
    const loadingRow = document.createElement('tr');
    loadingRow.innerHTML = '<td colspan="7" class="loading">Memuat data user...</td>';
    usersTable.innerHTML = '';
    usersTable.appendChild(loadingRow);

    try {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        // Clear loading row
        usersTable.innerHTML = `
            <tr>
                <th>No</th>
                <th>Nama Lengkap</th>
                <th>Username</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
            </tr>
        `;

        if (querySnapshot.empty) {
            usersTable.innerHTML += `
                <tr>
                    <td colspan="7" class="no-data">Belum ada data user</td>
                </tr>
            `;
            return;
        }

        let counter = 1;
        querySnapshot.forEach(doc => {
            const userData = doc.data();
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${counter++}</td>
                <td>${userData.name || '-'}</td>
                <td>${userData.username || '-'}</td>
                <td>${userData.email || '-'}</td>
                <td>${userData.phoneNumber || '-'}</td>
                <td>${formatDate(userData.createdAt)}</td>
            `;
            
            usersTable.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading users:", error);
        usersTable.innerHTML = `
            <tr>
                <th>No</th>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Phone HP</th>
                <th>Joined</th>
            </tr>
            <tr>
                <td colspan="7" class="error">Gagal memuat data user: ${error.message}</td>
            </tr>
        `;
    }
}

// Check auth state before loading users
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, load data
        loadUsers();
        
        // Refresh data every 30 seconds (optional)
        setInterval(loadUsers, 30000);
    } else {
        // User is signed out, redirect to login
        window.location.href = 'login.html';
    }
});

// Export function untuk keperluan testing atau penggunaan lainnya
export { loadUsers, formatDate };

// Fungsi Logout
document.getElementById('logout').addEventListener("click", (e) => {
    e.preventDefault();
    signOut(auth).then(() => {
        sessionStorage.removeItem('currentUser');
        window.location.href = "login.html";
    }).catch((error) => {
        console.error("Gagal logout:", error);
        alert("Gagal logout: " + error.message);
      });
})