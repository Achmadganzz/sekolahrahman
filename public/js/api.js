// Dynamic API base URL - uses environment variable or empty for same-origin
const API_BASE = window.location.origin;

// API Functions
const api = {
    // Register new student
    async register(studentData) {
        const response = await fetch(`${API_BASE}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
        });
        return await response.json();
    },

    // Verify email
    async verifyEmail(token) {
        const response = await fetch(`${API_BASE}/api/verify/${token}`);
        return await response.json();
    },

    // Check status
    async checkStatus(query) {
        const response = await fetch(`${API_BASE}/api/status?query=${encodeURIComponent(query)}`);
        return await response.json();
    },

    // Admin login
    async adminLogin(username, password) {
        const response = await fetch(`${API_BASE}/api/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        return await response.json();
    },

    // Get all students (admin)
    async getStudents() {
        const response = await fetch(`${API_BASE}/api/admin/students`);
        return await response.json();
    },

    // Get student by ID (admin)
    async getStudent(id) {
        const response = await fetch(`${API_BASE}/api/admin/students/${id}`);
        return await response.json();
    },

    // Add student (admin)
    async addStudent(studentData) {
        const response = await fetch(`${API_BASE}/api/admin/students`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
        });
        return await response.json();
    },

    // Update student (admin)
    async updateStudent(id, studentData) {
        const response = await fetch(`${API_BASE}/api/admin/students/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
        });
        return await response.json();
    },

    // Delete student (admin)
    async deleteStudent(id) {
        const response = await fetch(`${API_BASE}/api/admin/students/${id}`, {
            method: 'DELETE'
        });
        return await response.json();
    },

    // Get stats (admin)
    async getStats() {
        const response = await fetch(`${API_BASE}/api/admin/stats`);
        return await response.json();
    }
};

// Utility Functions
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;

    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function showLoading(show = true) {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.classList.toggle('show', show);
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

function formatDateTime(dateString) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Session management for admin
const adminSession = {
    isLoggedIn() {
        return localStorage.getItem('adminToken') !== null;
    },

    login(token) {
        localStorage.setItem('adminToken', token);
    },

    logout() {
        localStorage.removeItem('adminToken');
    },

    getToken() {
        return localStorage.getItem('adminToken');
    }
};
