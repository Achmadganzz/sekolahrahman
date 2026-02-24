const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

const app = express();
const BASE_URL = process.env.URL || 'https://sekolah-ra-alrahman.netlify.app';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Data file path - for Netlify we use a temporary file
const DATA_FILE = path.join('/tmp', 'data.json');

// Initialize data file if not exists
if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
        students: [],
        admin: {
            username: 'admin',
            password: 'admin66'
        }
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

// Helper functions
function readData() {
    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateRegistrationNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `REG-${year}-${random}`;
}

// Email configuration - PASTIKAN APP PASSWORD BENAR (16 karakter TANPA spasi)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'siti.rofiah.17815@gmail.com',
        pass: 'wgnktjsgmwyxnqlp'
    }
});

// Helper function to send email
function sendEmail(mailOptions) {
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Email error:', error);
                reject(error);
            } else {
                console.log('Email sent:', info.response);
                resolve(info);
            }
        });
    });
}

// Routes

// Register new student
app.post('/api/register', async (req, res) => {
    try {
        const data = readData();
        const {
            fullName,
            placeOfBirth,
            dateOfBirth,
            gender,
            nisn,
            address,
            phone,
            fatherName,
            fatherJob,
            motherName,
            motherJob,
            parentPhone,
            email,
            previousSchool,
            schoolAddress,
            program,
            averageGrade,
            hafalan,
            activity,
            motivation
        } = req.body;

        // Validasi input
        if (!fullName || !email || !fatherName || !motherName) {
            return res.status(400).json({
                success: false,
                message: 'Data tidak lengkap. Mohon isi semua kolom wajib.'
            });
        }

        // Check if email already registered
        const existingStudent = data.students.find(s => s.email === email);
        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: 'Email sudah terdaftar'
            });
        }

        // Generate verification token
        const verificationToken = uuidv4();
        const registrationNumber = generateRegistrationNumber();

        const newStudent = {
            id: uuidv4(),
            registrationNumber,
            fullName,
            placeOfBirth: placeOfBirth || '',
            dateOfBirth: dateOfBirth || '',
            gender: gender || '',
            nisn: nisn || '',
            address: address || '',
            phone: phone || '',
            fatherName: fatherName || '',
            fatherJob: fatherJob || '',
            motherName: motherName || '',
            motherJob: motherJob || '',
            parentPhone: parentPhone || '',
            email,
            previousSchool: previousSchool || '',
            schoolAddress: schoolAddress || '',
            program: program || '',
            averageGrade: averageGrade || '',
            hafalan: hafalan || '',
            activity: activity || '',
            motivation: motivation || '',
            status: 'Dalam Proses',
            verified: false,
            verificationToken,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        data.students.push(newStudent);
        writeData(data);

        console.log('Student registered:', registrationNumber);

        // Kirim email verifikasi
        const verifyLink = `${BASE_URL}/verifikasi.html?token=${verificationToken}`;

        const mailOptions = {
            from: 'siti.rofiah.17815@gmail.com',
            to: email,
            subject: 'Verifikasi Email - Pendaftaran Sekolah',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #1e3a8a;">Verifikasi Email Pendaftaran</h2>
                    <p>Halo ${fullName},</p>
                    <p>Terima kasih telah mendaftar di sekolah kami. Berikut adalah detail pendaftaran Anda:</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Nomor Pendaftaran:</strong> ${registrationNumber}</p>
                        <p><strong>Nama:</strong> ${fullName}</p>
                        <p><strong>Email:</strong> ${email}</p>
                    </div>
                    <p>Silakan klik tombol di bawah untuk memverifikasi email Anda:</p>
                    <a href="${verifyLink}" style="display: inline-block; background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0;">Verifikasi Email</a>
                    <p>Atau copy tautan ini: <br>${verifyLink}</p>
                    <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                        Jika Anda tidak mendaftar di sekolah ini, abaikan email ini.
                    </p>
                </div>
            `
        };

        // Kirim email - tidak tunggu agar tidak blocking
        sendEmail(mailOptions)
            .then(() => console.log('Email terkirim ke:', email))
            .catch(err => console.log('Gagal kirim email:', err.message));

        res.json({
            success: true,
            message: 'Pendaftaran berhasil! Silakan verifikasi email Anda.',
            registrationNumber,
            verificationToken
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server: ' + error.message });
    }
});

// Verify email
app.get('/api/verify/:token', (req, res) => {
    try {
        const data = readData();
        const student = data.students.find(s => s.verificationToken === req.params.token);

        if (!student) {
            return res.json({
                success: false,
                message: 'Token verifikasi tidak valid'
            });
        }

        if (student.verified) {
            return res.json({
                success: true,
                message: 'Email sudah terverifikasi sebelumnya',
                student: {
                    registrationNumber: student.registrationNumber,
                    fullName: student.fullName,
                    email: student.email
                }
            });
        }

        student.verified = true;
        student.verificationToken = null;
        student.updatedAt = new Date().toISOString();
        writeData(data);

        res.json({
            success: true,
            message: 'Verifikasi berhasil!',
            student: {
                registrationNumber: student.registrationNumber,
                fullName: student.fullName,
                email: student.email
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Check registration status
app.get('/api/status', (req, res) => {
    try {
        const { query } = req.query;
        const data = readData();

        const student = data.students.find(
            s => s.registrationNumber === query || s.email === query
        );

        if (!student) {
            return res.json({
                success: false,
                message: 'Pendaftaran tidak ditemukan'
            });
        }

        res.json({
            success: true,
            student: {
                registrationNumber: student.registrationNumber,
                fullName: student.fullName,
                email: student.email,
                program: student.program,
                status: student.status,
                verified: student.verified,
                createdAt: student.createdAt
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Admin login
app.post('/api/admin/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const data = readData();

        if (username === data.admin.username && password === data.admin.password) {
            res.json({
                success: true,
                message: 'Login berhasil',
                token: 'admin-session-token'
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Get all students (admin)
app.get('/api/admin/students', (req, res) => {
    try {
        const data = readData();
        res.json({
            success: true,
            students: data.students
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Get student by ID (admin)
app.get('/api/admin/students/:id', (req, res) => {
    try {
        const data = readData();
        const student = data.students.find(s => s.id === req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Siswa tidak ditemukan'
            });
        }

        res.json({ success: true, student });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Add new student (admin)
app.post('/api/admin/students', (req, res) => {
    try {
        const data = readData();
        const {
            fullName,
            placeOfBirth,
            dateOfBirth,
            gender,
            address,
            phone,
            fatherName,
            fatherJob,
            motherName,
            motherJob,
            parentPhone,
            email,
            previousSchool,
            program,
            status
        } = req.body;

        const registrationNumber = generateRegistrationNumber();

        const newStudent = {
            id: uuidv4(),
            registrationNumber,
            fullName,
            placeOfBirth,
            dateOfBirth,
            gender,
            address,
            phone,
            fatherName,
            fatherJob,
            motherName,
            motherJob,
            parentPhone,
            email,
            previousSchool,
            program,
            status: status || 'Dalam Proses',
            verified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        data.students.push(newStudent);
        writeData(data);

        res.json({
            success: true,
            message: 'Siswa berhasil ditambahkan',
            student: newStudent
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Update student (admin)
app.put('/api/admin/students/:id', (req, res) => {
    try {
        const data = readData();
        const studentIndex = data.students.findIndex(s => s.id === req.params.id);

        if (studentIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Siswa tidak ditemukan'
            });
        }

        const updatedStudent = {
            ...data.students[studentIndex],
            ...req.body,
            updatedAt: new Date().toISOString()
        };

        data.students[studentIndex] = updatedStudent;
        writeData(data);

        res.json({
            success: true,
            message: 'Data siswa berhasil diperbarui',
            student: updatedStudent
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Delete student (admin)
app.delete('/api/admin/students/:id', (req, res) => {
    try {
        const data = readData();
        const studentIndex = data.students.findIndex(s => s.id === req.params.id);

        if (studentIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Siswa tidak ditemukan'
            });
        }

        const deletedStudent = data.students[studentIndex];
        data.students.splice(studentIndex, 1);
        writeData(data);

        res.json({
            success: true,
            message: 'Siswa berhasil dihapus',
            student: deletedStudent
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Get statistics (admin)
app.get('/api/admin/stats', (req, res) => {
    try {
        const data = readData();
        const students = data.students;

        const stats = {
            total: students.length,
            verified: students.filter(s => s.verified).length,
            pending: students.filter(s => s.status === 'Dalam Proses').length,
            accepted: students.filter(s => s.status === 'Diterima').length,
            rejected: students.filter(s => s.status === 'Ditolak').length
        };

        res.json({ success: true, stats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Export handler for Netlify Functions
exports.handler = async (event, context) => {
    // Add CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Match API routes
    let path = event.path.replace(/\.netlify\/functions\/server/, '');

    // Create mock request and response for Express
    const mockReq = {
        ...event,
        path: path,
        method: event.httpMethod,
        query: event.queryStringParameters,
        body: event.body ? JSON.parse(event.body) : {}
    };

    // Capture response
    let statusCode = 200;
    let responseBody = '';

    const mockRes = {
        status: function (code) {
            statusCode = code;
            return this;
        },
        json: function (data) {
            responseBody = JSON.stringify(data);
            return this;
        },
        setHeader: function () { }
    };

    // Route the request
    if (event.httpMethod === 'GET' && path.match(/^\/api\/verify\/(.+)/)) {
        const token = path.match(/^\/api\/verify\/(.+)/)[1];
        mockReq.params = { token };
        app._router.stack.forEach(layer => {
            if (layer.route && layer.route.path === '/api/verify/:token' && layer.route.methods.get) {
                layer.route.stack[0].handle(mockReq, mockRes);
            }
        });
    } else if (event.httpMethod === 'GET' && path.match(/^\/api\/admin\/students\/(.+)/)) {
        const id = path.match(/^\/api\/admin\/students\/(.+)/)[1];
        mockReq.params = { id };
        app._router.stack.forEach(layer => {
            if (layer.route && layer.route.path === '/api/admin/students/:id' && layer.route.methods.get) {
                layer.route.stack[0].handle(mockReq, mockRes);
            }
        });
    } else if (event.httpMethod === 'PUT' && path.match(/^\/api\/admin\/students\/(.+)/)) {
        const id = path.match(/^\/api\/admin\/students\/(.+)/)[1];
        mockReq.params = { id };
        app._router.stack.forEach(layer => {
            if (layer.route && layer.route.path === '/api/admin/students/:id' && layer.route.methods.put) {
                layer.route.stack[0].handle(mockReq, mockRes);
            }
        });
    } else if (event.httpMethod === 'DELETE' && path.match(/^\/api\/admin\/students\/(.+)/)) {
        const id = path.match(/^\/api\/admin\/students\/(.+)/)[1];
        mockReq.params = { id };
        app._router.stack.forEach(layer => {
            if (layer.route && layer.route.path === '/api/admin/students/:id' && layer.route.methods.delete) {
                layer.route.stack[0].handle(mockReq, mockRes);
            }
        });
    } else {
        // Find matching route
        let matched = false;
        app._router.stack.forEach(layer => {
            if (layer.route && !matched) {
                const routePath = layer.route.path;
                const method = event.httpMethod.toLowerCase();

                if (routePath === path && layer.route.methods[method]) {
                    matched = true;
                    layer.route.stack[0].handle(mockReq, mockRes);
                }
            }
        });

        if (!matched) {
            statusCode = 404;
            responseBody = JSON.stringify({ error: 'Not found' });
        }
    }

    return {
        statusCode,
        headers,
        body: responseBody
    };
};
