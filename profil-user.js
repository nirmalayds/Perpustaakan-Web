import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  deleteDoc 
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut, 
  deleteUser 
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD6-XALxgW4MM9RE8okNsNwUEOipJJG00g",
  authDomain: "perpustakaan-web.firebaseapp.com",
  projectId: "perpustakaan-web",
  storageBucket: "perpustakaan-web.appspot.com",
  messagingSenderId: "39289548587",
  appId: "1:39289548587:web:6022c2cb01db20a7479f6e"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Gunakan app yang sudah diinisialisasi
const db = getFirestore(app);

// Fungsi untuk update UI
function updateUserUI(userData) {
  const userNameElement = document.querySelector(".user-name");
  const userAvatarElement = document.getElementById("user-avatar");
  
  if (userNameElement) {
    userNameElement.textContent = userData.name || "Pengguna";
  }
  
  if (userAvatarElement) {
    const name = userData.name || "Pengguna";
    userAvatarElement.textContent = name.charAt(0).toUpperCase();
    
    // Tambahkan warna background berdasarkan inisial
    const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'];
    const colorIndex = name.charCodeAt(0) % colors.length;
    userAvatarElement.style.backgroundColor = colors[colorIndex];
  }
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        updateUserUI(userData);
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
      } else {
        console.log("Dokumen tidak ditemukan");
        updateUserUI({ name: "Pengguna" }); // Default UI
      }
    } catch (error) {
      console.error("Error mengambil data:", error);
      updateUserUI({ name: "Pengguna" }); // Default UI jika error
    }
  } else {
    console.log("Tidak ada user yang login");
    window.location.href = "login-user.html";
  }
});

// Load data dari sessionStorage saat pertama kali load
document.addEventListener('DOMContentLoaded', () => {
  const savedUser = sessionStorage.getItem('currentUser');
  if (savedUser) {
    updateUserUI(JSON.parse(savedUser));
  }
});

// Fungsi logout
document.getElementById("logout-btn")?.addEventListener("click", (e) => {
  e.preventDefault();
  signOut(auth).then(() => {
    sessionStorage.removeItem('currentUser');
    window.location.href = "index.html";
  }).catch((error) => {
    console.error("Gagal logout:", error);
    alert("Gagal logout: " + error.message);
  });
});

// Fungsi hapus akun
document.getElementById("delete-account-btn")?.addEventListener("click", async (e) => {
  e.preventDefault();
  if (confirm("Apakah Anda yakin ingin menghapus akun ini? Tindakan ini tidak dapat dibatalkan!")) {
    try {
      const user = auth.currentUser;
      
      if (!user) throw new Error("Tidak ada user yang login");
      
      // Hapus dari Firestore terlebih dahulu
      await deleteDoc(doc(db, "users", user.uid));
      
      // Hapus user dari Authentication
      await deleteUser(user);
      
      // Bersihkan storage dan redirect
      sessionStorage.removeItem('currentUser');
      window.location.href = "index.html";
    } catch (error) {
      console.error("Gagal menghapus akun:", error);
      alert("Gagal menghapus akun: " + error.message);
    }
  }
});

// Hamburger menu
function initEventListeners() {
  
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('.nav-links');
  
  if (hamburger) {
      hamburger.addEventListener('click', (e) => {
          e.preventDefault();
          // Toggle class 'active' pada navLinks
          navLinks.classList.toggle('active');
          // Ganti icon antara bars dan times
          const icon = hamburger.querySelector('i');
          if (navLinks.classList.contains('active')) {
              icon.classList.remove('fa-bars');
              icon.classList.add('fa-times');
          } else {
              icon.classList.remove('fa-times');
              icon.classList.add('fa-bars');
          }
      });
  }
}
// Panggil fungsi init
initEventListeners();


// Search Functionality
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('search-bar-input');
  const searchButton = document.getElementById('search-button');
  const bookGrid = document.querySelector('.book-grid');
  
  // Buat elemen pesan tidak ditemukan dengan animasi
  const notFoundMessage = document.createElement('div');
  notFoundMessage.className = 'not-found-message';
  notFoundMessage.style.cssText = `
      display: none;
      text-align: center;
      padding: 30px;
      background: #f9f9f9;
      border-radius: 10px;
      margin: 20px auto;
      max-width: 500px;
      opacity: 0;
      transition: opacity 0.3s ease;
  `;
  notFoundMessage.innerHTML = `
      <i class="fas fa-search" style="font-size: 50px; color: #ff6b6b; margin-bottom: 15px;"></i>
      <h3 style="color: #333; margin-bottom: 10px;">Hasil Tidak Ditemukan</h3>
      <p style="color: #666;">Kami tidak menemukan buku dengan kata kunci "<span id="search-keyword" style="font-weight: bold;"></span>"</p>
      <p style="color: #888; margin-top: 10px;">Coba cari dengan kata kunci lain atau periksa ejaan Anda.</p>
  `;
  bookGrid.parentNode.insertBefore(notFoundMessage, bookGrid.nextSibling);

  function scrollToResults() {
    let targetElement;
    const anyResults = document.querySelector('.book-card[style*="display: block"]');
    
    if (notFoundMessage.style.display === 'block') {
        targetElement = notFoundMessage;
    } else if (anyResults) {
        targetElement = bookGrid;
    } else {
        targetElement = searchInput; // Fallback ke search input
    }

    const offset = 100; // Sesuaikan dengan tinggi navbar/header
    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;
    
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

  function showNotFoundMessage(keyword) {
      document.getElementById('search-keyword').textContent = keyword;
      notFoundMessage.style.display = 'block';
      setTimeout(() => {
          notFoundMessage.style.opacity = '1';
          scrollToResults();
      }, 10);
      bookGrid.style.opacity = '0.5';
  }

  function hideNotFoundMessage() {
      notFoundMessage.style.opacity = '0';
      setTimeout(() => {
          notFoundMessage.style.display = 'none';
      }, 300);
      bookGrid.style.opacity = '1';
  }

  function performSearch() {
      const searchTerm = searchInput.value.trim().toLowerCase();
      let foundCount = 0;

      // Animasi loading
      bookGrid.style.opacity = '0.5';
      bookGrid.style.transition = 'opacity 0.2s ease';

      setTimeout(() => {
          document.querySelectorAll('.book-card').forEach(card => {
              const title = card.querySelector('h3').textContent.toLowerCase();
              const author = card.querySelector('p').textContent.toLowerCase();
              
              if (searchTerm === '' || title.includes(searchTerm) || author.includes(searchTerm)) {
                  card.style.display = 'block';
                  card.style.animation = 'fadeIn 0.3s ease';
                  foundCount++;
              } else {
                  card.style.display = 'none';
              }
          });

          if (foundCount === 0 && searchTerm !== '') {
            showNotFoundMessage(searchTerm);
            // Scroll ke notFoundMessage sudah dipanggil di dalam showNotFoundMessage
        } else {
            hideNotFoundMessage();
            if (searchTerm !== '') {
                // Hanya scroll jika ada action pencarian (bukan saat load awal)
                setTimeout(scrollToResults, 300);
            }
        }

        bookGrid.style.opacity = '1';
    }, 200);
  }

  // Event listeners
  searchButton.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') performSearch();
  });

  // Reset saat input dikosongkan
  searchInput.addEventListener('input', function() {
      if (this.value.trim() === '') {
          hideNotFoundMessage();
          document.querySelectorAll('.book-card').forEach(card => {
              card.style.display = 'block';
              card.style.animation = 'fadeIn 0.3s ease';
          });
      }
  });
});
