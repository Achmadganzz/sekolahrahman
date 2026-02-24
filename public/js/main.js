// Main JavaScript for School Website

// Navigation
document.addEventListener('DOMContentLoaded', function () {
    updateNavigation();
});

function updateNavigation() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    // Add Font Awesome CDN link
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(link);
    }
}

// Registration Form Handler
function initRegistrationForm() {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';

        const formData = {
            fullName: document.getElementById('fullName').value,
            placeOfBirth: document.getElementById('placeOfBirth').value,
            dateOfBirth: document.getElementById('dateOfBirth').value,
            gender: document.getElementById('gender').value,
            address: document.getElementById('address').value,
            phone: document.getElementById('parentPhone').value,
            email: document.getElementById('email').value,
            fatherName: document.getElementById('fatherName').value,
            fatherJob: document.getElementById('fatherJob').value,
            motherName: document.getElementById('motherName').value,
            motherJob: document.getElementById('motherJob').value,
            parentPhone: document.getElementById('parentPhone').value,
            // Optional fields (empty since not in the form)
            nisn: '',
            previousSchool: '',
            schoolAddress: '',
            program: '',
            averageGrade: '',
            hafalan: '',
            activity: '',
            motivation: ''
        };

        try {
            const response = await api.register(formData);

            if (response.success) {
                showAlert('Pendaftaran berhasil! Silakan cek email untuk verifikasi.', 'success');

                // Show verification info
                const resultDiv = document.getElementById('registrationResult');
                if (resultDiv) {
                    resultDiv.innerHTML = `
                        <div class="alert alert-success">
                            <i class="fas fa-check-circle"></i>
                            <div>
                                <strong>Pendaftaran Berhasil!</strong>
                                <p>Nomor Pendaftaran Anda: <strong>${response.registrationNumber}</strong></p>
                                <p>Silakan cek email Anda untuk verifikasi. Link verifikasi telah dikirim ke ${formData.email}</p>
                            </div>
                        </div>
                    `;
                    resultDiv.style.display = 'block';
                    form.reset();
                }
            } else {
                showAlert(response.message || 'Pendaftaran gagal. Silakan coba lagi.', 'error');
            }
        } catch (error) {
            showAlert('Terjadi kesalahan. Silakan coba lagi.', 'error');
            console.error(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Daftar Sekarang';
        }
    });
}

function validateForm() {
    const requiredFields = [
        'fullName', 'placeOfBirth', 'dateOfBirth', 'gender',
        'address', 'email', 'fatherName', 'fatherJob',
        'motherName', 'motherJob', 'parentPhone'
    ];

    let isValid = true;

    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else if (field) {
            field.classList.remove('error');
        }
    });

    // Validate email
    const email = document.getElementById('email');
    if (email && email.value && !isValidEmail(email.value)) {
        email.classList.add('error');
        showAlert('Format email tidak valid', 'error');
        isValid = false;
    }

    // Validate phone
    const parentPhone = document.getElementById('parentPhone');
    if (parentPhone && parentPhone.value && !isValidPhone(parentPhone.value)) {
        parentPhone.classList.add('error');
        showAlert('Nomor telepon tidak valid', 'error');
        isValid = false;
    }

    return isValid;
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidPhone(phone) {
    const re = /^[\d\s\-\+\(\)]{10,}$/;
    return re.test(phone);
}

// Status Check Handler
function initStatusCheck() {
    const form = document.getElementById('statusForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const query = document.getElementById('statusQuery').value.trim();
        if (!query) {
            showAlert('Masukkan nomor pendaftaran atau email', 'warning');
            return;
        }

        const searchBtn = form.querySelector('button[type="submit"]');
        searchBtn.disabled = true;
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mencari...';

        try {
            const response = await api.checkStatus(query);

            if (response.success) {
                displayStatusResult(response.student);
            } else {
                showAlert(response.message || 'Pendaftaran tidak ditemukan', 'error');
                document.getElementById('statusResult').style.display = 'none';
            }
        } catch (error) {
            showAlert('Terjadi kesalahan. Silakan coba lagi.', 'error');
            console.error(error);
        } finally {
            searchBtn.disabled = false;
            searchBtn.innerHTML = '<i class="fas fa-search"></i> Cek Status';
        }
    });
}

function displayStatusResult(student) {
    const resultDiv = document.getElementById('statusResult');
    if (!resultDiv) return;

    let statusClass = 'pending';
    let statusText = 'Dalam Proses';

    if (student.status === 'Diterima') {
        statusClass = 'accepted';
        statusText = 'Diterima';
    } else if (student.status === 'Ditolak') {
        statusClass = 'rejected';
        statusText = 'Ditolak';
    }

    const verifiedBadge = student.verified
        ? '<span class="status-badge verified"><i class="fas fa-check-circle"></i> Terverifikasi</span>'
        : '<span class="status-badge pending"><i class="fas fa-clock"></i> Belum Verifikasi</span>';

    resultDiv.innerHTML = `
        <div class="status-header status-${statusClass}">
            <i class="fas fa-${statusClass === 'accepted' ? 'check-circle' : statusClass === 'rejected' ? 'times-circle' : 'clock'}"></i>
            <h2>${statusText}</h2>
        </div>
        <div class="status-details">
            <div class="status-detail-item">
                <span>Nomor Pendaftaran</span>
                <strong>${student.registrationNumber}</strong>
            </div>
            <div class="status-detail-item">
                <span>Nama Lengkap</span>
                <strong>${student.fullName}</strong>
            </div>
            <div class="status-detail-item">
                <span>Email</span>
                <strong>${student.email}</strong>
            </div>
            <div class="status-detail-item">
                <span>Program/Jurusan</span>
                <strong>${student.program}</strong>
            </div>
            <div class="status-detail-item">
                <span>Status Verifikasi</span>
                <div>${verifiedBadge}</div>
            </div>
            <div class="status-detail-item">
                <span>Tanggal Pendaftaran</span>
                <strong>${formatDate(student.createdAt)}</strong>
            </div>
        </div>
    `;
    resultDiv.style.display = 'block';
}

// Verification Handler
async function initVerification() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        showVerificationError('Token verifikasi tidak valid');
        return;
    }

    const resultDiv = document.getElementById('verificationResult');
    if (!resultDiv) return;

    try {
        const response = await api.verifyEmail(token);

        if (response.success) {
            resultDiv.innerHTML = `
                <div class="verification-icon verification-success">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2>Verifikasi Berhasil!</h2>
                <p>Email Anda telah berhasil diverifikasi.</p>
                <div class="status-details" style="text-align: left; margin-top: 1.5rem;">
                    <div class="status-detail-item">
                        <span>Nomor Pendaftaran</span>
                        <strong>${response.student.registrationNumber}</strong>
                    </div>
                    <div class="status-detail-item">
                        <span>Nama</span>
                        <strong>${response.student.fullName}</strong>
                    </div>
                </div>
                <a href="/status.html" class="btn btn-primary" style="margin-top: 1.5rem;">
                    <i class="fas fa-search"></i> Cek Status Pendaftaran
                </a>
            `;
        } else {
            showVerificationError(response.message);
        }
    } catch (error) {
        showVerificationError('Terjadi kesalahan saat verifikasi');
        console.error(error);
    }
}

function showVerificationError(message) {
    const resultDiv = document.getElementById('verificationResult');
    if (!resultDiv) return;

    resultDiv.innerHTML = `
        <div class="verification-icon verification-error">
            <i class="fas fa-times-circle"></i>
        </div>
        <h2>Verifikasi Gagal</h2>
        <p>${message}</p>
        <a href="/" class="btn btn-primary" style="margin-top: 1.5rem;">
            <i class="fas fa-home"></i> Kembali ke Halaman Utama
        </a>
    `;
}

// Show alert function
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        ${message}
    `;

    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    } else {
        document.body.insertBefore(alertDiv, document.body.firstChild);
    }

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}
