import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    updateDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Konfigurasi Firebase
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
const db = getFirestore(app);
const auth = getAuth(app);

// Variabel global untuk user
let currentUser = null;

// Fungsi untuk memformat status
function getStatusDisplay(status) {
    switch (status) {
        case 'Menunggu': return { text: 'Menunggu Konfirmasi', class: 'status-waiting' };
        case 'Disetujui': return { text: 'Sedang Dipinjam', class: 'status-approved' };
        case 'Selesai': return { text: 'Sudah Dikembalikan', class: 'status-completed' };
        case 'Ditolak': return { text: 'Ditolak', class: 'status-rejected' };
        default: return { text: status, class: 'status-waiting' };
    }
}

// Fungsi untuk memuat riwayat peminjaman
async function fetchUserLoans(filter = 'all') {
    const loansContainer = document.getElementById('loans-container');
    loansContainer.innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i> Memuat riwayat peminjaman...
                </div>
            `;

    try {
        if (!currentUser) {
            throw new Error('User belum login');
        }

        // Buat query berdasarkan filter
        let loansQuery = query(
            collection(db, 'book_loans'),
            where('user.uid', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        if (filter !== 'all') {
            loansQuery = query(loansQuery, where('status', '==', filter));
        }

        const querySnapshot = await getDocs(loansQuery);

        if (querySnapshot.empty) {
            loansContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-book-open"></i>
                            <h3>Tidak ada riwayat peminjaman</h3>
                            <p>Anda belum memiliki riwayat peminjaman buku</p>
                        </div>
                    `;
            return;
        }

        loansContainer.innerHTML = '';

        querySnapshot.forEach((doc, index) => {
            const loan = doc.data();
            const loanId = doc.id;

            // Format nomor peminjaman
            const loanNumber = `PJM-${String(querySnapshot.size - index).padStart(3, '0')}`;

            // Dapatkan tampilan status
            const statusDisplay = getStatusDisplay(loan.status);

            // Buat elemen kartu peminjaman
            const loanCard = document.createElement('div');
            loanCard.className = 'loan-card';
            loanCard.innerHTML = `
                        <h2>Peminjaman ${loanNumber}</h2>
                        
                        <div class="loan-info">
                            <p><strong>Judul Buku:</strong> ${loan.book.title}</p>
                            <p><strong>Pengarang:</strong> ${loan.book.author}</p>
                            <p><strong>Kode Buku:</strong> ${loan.book.code}</p>
                            <p><strong>Tanggal Pinjam:</strong> ${loan.dates.loan}</p>
                            <p><strong>Batas Kembali:</strong> ${loan.dates.return}</p>
                            <p><strong>Status:</strong> 
                                <span class="status ${statusDisplay.class}">${statusDisplay.text}</span>
                            </p>
                            ${loan.dates.returned ? `<p><strong>Dikembalikan:</strong> ${loan.dates.returned}</p>` : ''}
                            ${loan.fine > 0 ? `<p><strong>Denda:</strong> Rp${loan.fine.toLocaleString('id-ID')}</p>` : ''}
                        </div>
                        
                        ${loan.status === 'Menunggu' ? `
                        <div class="loan-actions">
                            <button class="btn-cancel" data-loan-id="${loanId}">
                                <i class="fas fa-times"></i> Batalkan Peminjaman
                            </button>
                        </div>
                        ` : ''}
                    `;

            loansContainer.appendChild(loanCard);

            // Tambahkan event listener untuk tombol batalkan
            if (loan.status === 'Menunggu') {
                loanCard.querySelector('.btn-cancel').addEventListener('click', () => cancelLoan(loanId));
            }
        });

    } catch (error) {
        console.error("Error fetching loans:", error);
        loansContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>Gagal memuat riwayat peminjaman</h3>
                        <p>${error.message}</p>
                    </div>
                `;
    }
}

// Fungsi untuk membatalkan peminjaman
async function cancelLoan(loanId) {
    if (!confirm('Apakah Anda yakin ingin membatalkan peminjaman ini?')) return;

    try {
        // Update status peminjaman di Firestore
        await updateDoc(doc(db, 'book_loans', loanId), {
            status: "Ditolak",
            updatedAt: serverTimestamp()
        });

        alert('Peminjaman berhasil dibatalkan');
        // Refresh tampilan dengan filter yang aktif
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        fetchUserLoans(activeFilter);
    } catch (error) {
        console.error("Error canceling loan:", error);
        alert('Gagal membatalkan peminjaman: ' + error.message);
    }
}

// Event listener untuk filter
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('.filter-btn.active').classList.remove('active');
        btn.classList.add('active');
        fetchUserLoans(btn.dataset.filter);
    });
});

// Cek status autentikasi saat halaman dimuat
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0]
        };
        // Muat data peminjaman awal (semua)
        fetchUserLoans();
    } else {
        // Redirect ke halaman login jika belum login
        window.location.href = "login-user.html";
    }
});

// Search Functionality
document.addEventListener('DOMContentLoaded', function () {
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
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') performSearch();
    });

    // Reset saat input dikosongkan
    searchInput.addEventListener('input', function () {
        if (this.value.trim() === '') {
            hideNotFoundMessage();
            document.querySelectorAll('.book-card').forEach(card => {
                card.style.display = 'block';
                card.style.animation = 'fadeIn 0.3s ease';
            });
        }
    });
});