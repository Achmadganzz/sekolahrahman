// Admin JavaScript

// Check if user is logged in
function checkAuth() {
    if (!adminSession.isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Admin Login
function initLogin() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            showAlert('Masukkan username dan password', 'warning');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

        try {
            const response = await api.adminLogin(username, password);

            if (response.success) {
                adminSession.login(response.token);
                showAlert('Login berhasil!', 'success');
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
            } else {
                showAlert(response.message || 'Login gagal', 'error');
            }
        } catch (error) {
            showAlert('Terjadi kesalahan. Silakan coba lagi.', 'error');
            console.error(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        }
    });
}

// Logout
function logout() {
    adminSession.logout();
    window.location.href = 'login.html';
}

// Initialize Admin Dashboard
async function initDashboard() {
    if (!checkAuth()) return;

    await loadStats();
    await loadStudents();
    initStudentFilters();
}

// Load Statistics
async function loadStats() {
    try {
        const response = await api.getStats();

        if (response.success) {
            const stats = response.stats;

            document.getElementById('totalStudents').textContent = stats.total;
            document.getElementById('verifiedStudents').textContent = stats.verified;
            document.getElementById('pendingStudents').textContent = stats.pending;
            document.getElementById('acceptedStudents').textContent = stats.accepted;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load Students
let allStudents = [];

async function loadStudents() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8" class="text-center"><i class="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>';

    try {
        const response = await api.getStudents();

        if (response.success) {
            allStudents = response.students;
            displayStudents(allStudents);
        } else {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">Gagal memuat data</td></tr>';
        }
    } catch (error) {
        console.error('Error loading students:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Terjadi kesalahan</td></tr>';
    }
}

function displayStudents(students) {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada data siswa</td></tr>';
        return;
    }

    tbody.innerHTML = students.map(student => {
        let statusClass = 'pending';
        if (student.status === 'Diterima') statusClass = 'accepted';
        if (student.status === 'Ditolak') statusClass = 'rejected';

        const verifiedBadge = student.verified
            ? '<span class="status-badge verified"><i class="fas fa-check"></i></span>'
            : '<span class="status-badge pending"><i class="fas fa-times"></i></span>';

        const studentId = student.id || '';

        return `
            <tr>
                <td>${student.registrationNumber || '-'}</td>
                <td>${student.fullName || '-'}</td>
                <td>${student.email || '-'}</td>
                <td>${student.parentPhone || student.phone || '-'}</td>
                <td><span class="status-badge ${statusClass}">${student.status || 'Dalam Proses'}</span></td>
                <td>${verifiedBadge}</td>
                <td>${formatDate(student.createdAt)}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-info" onclick="viewStudent('${studentId}')" title="Lihat">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editStudent('${studentId}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteStudent('${studentId}')" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function initStudentFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');

    if (searchInput) {
        searchInput.addEventListener('input', filterStudents);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', filterStudents);
    }
}

function filterStudents() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusValue = statusFilter ? statusFilter.value : '';

    let filtered = allStudents.filter(student => {
        const matchesSearch =
            (student.fullName || '').toLowerCase().includes(searchTerm) ||
            (student.registrationNumber || '').toLowerCase().includes(searchTerm) ||
            (student.email || '').toLowerCase().includes(searchTerm);

        const matchesStatus = !statusValue || student.status === statusValue;

        return matchesSearch && matchesStatus;
    });

    displayStudents(filtered);
}

// View Student
async function viewStudent(id) {
    try {
        console.log('Viewing student:', id);
        const response = await api.getStudent(id);

        if (response.success) {
            const student = response.student;

            // Basic info
            document.getElementById('viewRegistrationNumber').textContent = student.registrationNumber || '-';

            let statusClass = 'pending';
            if (student.status === 'Diterima') statusClass = 'accepted';
            if (student.status === 'Ditolak') statusClass = 'rejected';
            document.getElementById('viewStatus').innerHTML = `<span class="status-badge ${statusClass}">${student.status || 'Dalam Proses'}</span>`;

            // Data Anak
            document.getElementById('viewFullName').textContent = student.fullName || '-';
            document.getElementById('viewPlaceOfBirth').textContent = student.placeOfBirth || '-';
            document.getElementById('viewDOB').textContent = student.dateOfBirth ? formatDate(student.dateOfBirth) : '-';
            document.getElementById('viewGender').textContent = student.gender || '-';
            document.getElementById('viewAddress').textContent = student.address || '-';

            // Data Orang Tua
            document.getElementById('viewFatherName').textContent = student.fatherName || '-';
            document.getElementById('viewFatherJob').textContent = student.fatherJob || '-';
            document.getElementById('viewMotherName').textContent = student.motherName || '-';
            document.getElementById('viewMotherJob').textContent = student.motherJob || '-';
            document.getElementById('viewParentPhone').textContent = student.parentPhone || student.phone || '-';
            document.getElementById('viewEmail').textContent = student.email || '-';

            // Verification and date
            document.getElementById('viewVerified').innerHTML = student.verified
                ? '<span class="status-badge verified"><i class="fas fa-check"></i> Terverifikasi</span>'
                : '<span class="status-badge pending"><i class="fas fa-times"></i> Belum</span>';
            document.getElementById('viewCreatedAt').textContent = student.createdAt ? formatDateTime(student.createdAt) : '-';

            openModal('viewModal');
        } else {
            showAlert('Gagal memuat data siswa', 'error');
        }
    } catch (error) {
        showAlert('Gagal memuat data siswa: ' + error.message, 'error');
        console.error(error);
    }
}

// Add Student
function initAddStudent() {
    const form = document.getElementById('addStudentForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        e.stopPropagation();

        console.log('Add student form submitted');

        const formData = {
            fullName: document.getElementById('addFullName').value,
            placeOfBirth: document.getElementById('addPlaceOfBirth').value,
            dateOfBirth: document.getElementById('addDateOfBirth').value,
            gender: document.getElementById('addGender').value,
            address: document.getElementById('addAddress').value,
            fatherName: document.getElementById('addFatherName').value,
            fatherJob: document.getElementById('addFatherJob').value,
            motherName: document.getElementById('addMotherName').value,
            motherJob: document.getElementById('addMotherJob').value,
            parentPhone: document.getElementById('addParentPhone').value,
            phone: document.getElementById('addParentPhone').value,
            email: document.getElementById('addEmail').value,
            status: document.getElementById('addStatus').value
        };

        console.log('Form data:', formData);

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

        try {
            const response = await api.addStudent(formData);
            console.log('Add student response:', response);

            if (response.success) {
                showAlert('Siswa berhasil ditambahkan', 'success');
                closeModal('addModal');
                form.reset();
                await loadStudents();
                await loadStats();
            } else {
                showAlert(response.message || 'Gagal menambahkan siswa', 'error');
            }
        } catch (error) {
            showAlert('Terjadi kesalahan: ' + error.message, 'error');
            console.error(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Simpan';
        }
    });
}

// Edit Student
let currentEditId = null;

async function editStudent(id) {
    try {
        console.log('Editing student:', id);
        const response = await api.getStudent(id);

        if (response.success) {
            const student = response.student;
            currentEditId = id;

            // Basic info
            document.getElementById('editFullName').value = student.fullName || '';
            document.getElementById('editPlaceOfBirth').value = student.placeOfBirth || '';
            document.getElementById('editDateOfBirth').value = student.dateOfBirth || '';
            document.getElementById('editGender').value = student.gender || '';
            document.getElementById('editAddress').value = student.address || '';

            // Data Orang Tua
            document.getElementById('editFatherName').value = student.fatherName || '';
            document.getElementById('editFatherJob').value = student.fatherJob || '';
            document.getElementById('editMotherName').value = student.motherName || '';
            document.getElementById('editMotherJob').value = student.motherJob || '';
            document.getElementById('editParentPhone').value = student.parentPhone || student.phone || '';
            document.getElementById('editEmail').value = student.email || '';

            // Status
            document.getElementById('editStatus').value = student.status || 'Dalam Proses';

            openModal('editModal');
        } else {
            showAlert('Gagal memuat data siswa', 'error');
        }
    } catch (error) {
        showAlert('Gagal memuat data siswa: ' + error.message, 'error');
        console.error(error);
    }
}

function initEditStudent() {
    const form = document.getElementById('editStudentForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        e.stopPropagation();

        console.log('Edit student form submitted, currentEditId:', currentEditId);

        if (!currentEditId) {
            showAlert('ID siswa tidak ditemukan', 'error');
            return;
        }

        const formData = {
            fullName: document.getElementById('editFullName').value,
            placeOfBirth: document.getElementById('editPlaceOfBirth').value,
            dateOfBirth: document.getElementById('editDateOfBirth').value,
            gender: document.getElementById('editGender').value,
            address: document.getElementById('editAddress').value,
            fatherName: document.getElementById('editFatherName').value,
            fatherJob: document.getElementById('editFatherJob').value,
            motherName: document.getElementById('editMotherName').value,
            motherJob: document.getElementById('editMotherJob').value,
            parentPhone: document.getElementById('editParentPhone').value,
            phone: document.getElementById('editParentPhone').value,
            email: document.getElementById('editEmail').value,
            status: document.getElementById('editStatus').value
        };

        console.log('Edit form data:', formData);

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

        try {
            const response = await api.updateStudent(currentEditId, formData);
            console.log('Update student response:', response);

            if (response.success) {
                showAlert('Data siswa berhasil diperbarui', 'success');
                closeModal('editModal');
                await loadStudents();
                await loadStats();
            } else {
                showAlert(response.message || 'Gagal memperbarui siswa', 'error');
            }
        } catch (error) {
            showAlert('Terjadi kesalahan: ' + error.message, 'error');
            console.error(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
        }
    });
}

// Delete Student
async function deleteStudent(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) {
        return;
    }

    try {
        console.log('Deleting student:', id);
        const response = await api.deleteStudent(id);
        console.log('Delete response:', response);

        if (response.success) {
            showAlert('Siswa berhasil dihapus', 'success');
            await loadStudents();
            await loadStats();
        } else {
            showAlert(response.message || 'Gagal menghapus siswa', 'error');
        }
    } catch (error) {
        showAlert('Terjadi kesalahan: ' + error.message, 'error');
        console.error(error);
    }
}

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

// Close modal on outside click
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
        document.body.style.overflow = '';
    }
});

// Close modal on close button click
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal-close')) {
        const modal = e.target.closest('.modal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
});

// Show alert
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        ${message}
    `;

    const container = document.querySelector('.admin-main') || document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    }

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('id-ID', options);
    } catch (e) {
        return '-';
    }
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('id-ID', options);
    } catch (e) {
        return '-';
    }
}
