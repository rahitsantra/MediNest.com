const API_URL = 'http://127.0.0.1:5000/api';

window.addEventListener('load', checkSession);

async function checkSession() {
    try{
        const response = await fetch(`${API_URL}/check-session`);
        const result = await response.json();

        if (result.logged_in) {
            showMainContent(result.username);
        }
    }catch (error) {
        console.error('session check failed:', error);
    }
}

function showAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
            
    if (tab === 'login') {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
    } else {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
    }
}

async function handleSignup(e) {
    e.preventDefault();

    const password = document.getElementById('signup_password').value;
    const confirmPassword = document.getElementById('signup_confirm_password').value;

    if (password !== confirmPassword) {
        showAlert('signup-alert', 'Passwords do not match!', 'error');
        return;
    }

    const data = {
        username: document.getElementById('signup_username').value,
        email: document.getElementById('signup_email').value,
        password: password
    };

    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showAlert('signup-alert', result.message + ' Please login.', 'success');
            setTimeout(() => {
                showAuthTab('login');
                document.querySelector('.auth-tab').click();
            }, 2000);
        } else {
            showAlert('signup-alert', result.message, 'error');
        }
    } catch (error) {
        showAlert('signup-alert', 'Error connecting to server. Make sure Flask is running.', 'error');
    }        
}

async function handleLogin(e) {
    e.preventDefault();

    const data = {
        username: document.getElementById('login_username').value,
        password: document.getElementById('login_password').value
    };

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showAlert('login-alert', result.message, 'success');
            setTimeout(() => {
                showMainContent(data.username);
            }, 1000);
        } else {
            showAlert('login-alert', result.message, 'error');
        }
    } catch (error) {
        showAlert('login-alert', 'Error connecting to server. Make sure Flask is running.', 'error');
    }
}

async function logout() {
    try {
        const response = await fetch(`${API_URL}/logout`, {
            method: 'POST'
        });
                
        const result = await response.json();
        if (result.success) {
            hideMainContent();
        }
    } catch (error) {
        console.error('Logout failed:', error);
    }
}


function showMainContent(username) {
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('mainContent').classList.add('active');
    document.getElementById('userInfo').classList.add('active');
    document.getElementById('usernameDisplay').textContent = username;
}

function hideMainContent() {
    document.getElementById('authContainer').classList.remove('hidden');
    document.getElementById('mainContent').classList.remove('active');
    document.getElementById('userInfo').classList.remove('active');
    document.getElementById('login_password').value = '';
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    ocument.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

function showAlert(containerId, message, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

async function handleRegister(e) {
    e.preventDefault();
            
    const data = {
        patient_id: document.getElementById('reg_patient_id').value,
        name: document.getElementById('reg_name').value,
        age: parseInt(document.getElementById('reg_age').value),
        gender: document.getElementById('reg_gender').value
    };

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });

        const result = await response.json();
                
        if (result.success) {
            showAlert('register-alert', result.message, 'success');
            document.getElementById('registerForm').reset();
        } else {
            showAlert('register-alert', result.message, 'error');
        }
    } catch (error) {
        showAlert('register-alert', 'Error connecting to server. Make sure Flask is running.', 'error');
    }
}

async function handleDiagnose(e) {
    e.preventDefault();
            
    const data = {
        patient_id: document.getElementById('diag_patient_id').value,
        symptoms: document.getElementById('diag_symptoms').value
    };

    try {
        const response = await fetch(`${API_URL}/diagnose`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });

        const result = await response.json();
                
        if (result.success) {
            displayDiagnosisResult(result.data);
            showAlert('diagnose-alert', 'Diagnosis completed successfully!', 'success');
        } else {
            showAlert('diagnose-alert', result.error, 'error');
        }
    } catch (error) {
        showAlert('diagnose-alert', 'Error connecting to server. Make sure Flask is running.', 'error');
    }
}

function displayDiagnosisResult(data) {
    const resultDiv = document.getElementById('diagnosis-result');
            
    let emergencyHtml = '';
    if (data.emergency) {
        emergencyHtml = `<div class="alert alert-warning">⚠️ ${data.emergency_message}</div>`;
    }

    let conditionsHtml = '';
    for (const [condition, score] of Object.entries(data.possible_conditions)) {
        conditionsHtml += `
            <div class="condition-item">
                <span class="condition-name">${condition.replace(/_/g, ' ')}</span>
                <span class="condition-score">Confidence: ${score}</span>
            </div>
        `;
    }

    let treatmentHtml = '';
    data.recommended_treatments.forEach(treatment => {
        treatmentsHtml += `<li>${treatment.replace(/_/g, ' ')}</li>`;
    });


    resultDiv.innerHTML = `
        ${emergencyHtml}
        <div class="result-card">
            <h3>Diagnosis Results for ${data.patient_name}</h3>
                    
            <div class="result-section">
                <h4>Detected Symptoms</h4>
                ${data.symptoms_detected.map(s => `<span class="badge badge-medium">${s.replace(/_/g, ' ')}</span>`).join('')}
            </div>

            <div class="result-section">
                <h4>Severity Level</h4>
                <span class="badge badge-${data.severity}">${data.severity.toUpperCase()}</span>
            </div>

            <div class="result-section">
                <h4>Possible Conditions</h4>
                ${conditionsHtml}
            </div>

            <div class="result-section">
                <h4>Recommended Treatments</h4>
                <ul class="treatment-list">
                    ${treatmentsHtml}
                </ul>
            </div>

            <div class="result-section">
                <h4>Consultation Date</h4>
                <p>${data.consultation_date}</p>
            </div>
        </div>
    `;
}

async function handleHistory(e) {
    e.preventDefault();
            
    const patientId = document.getElementById('hist_patient_id').value;

    try {
        const response = await fetch(`${API_URL}/history/${patientId}`);
        const result = await response.json();
                
        if (result.success) {
            displayHistory(result.data);
        } else {
            showAlert('history-alert', result.error, 'error');
        }
    } catch (error) {
        showAlert('history-alert', 'Error connecting to server. Make sure Flask is running.', 'error');
    }
}


function displayHistory(data) {
    const resultDiv = document.getElementById('history-result');
    const info = data.patient_info;
            
    let consultationsHtml = '';
    if (data.consultation_history.length > 0) {
        data.consultation_history.forEach((consultation, index) => {
            consultationsHtml += `
                <div class="history-card">
                    <div class="history-date">Consultation #${index + 1} - ${consultation.date.split('T')[0]}</div>
                    <p><strong>Symptoms:</strong> ${consultation.symptoms.map(s => s.replace(/_/g, ' ')).join(', ')}</p>
                    <p><strong>Severity:</strong> <span class="badge badge-${consultation.severity}">${consultation.severity.toUpperCase()}</span></p>
                    <p><strong>Diagnosis:</strong> ${Object.keys(consultation.diagnosis).map(d => d.replace(/_/g, ' ')).join(', ')}</p>
                </div>
            `;
        });
    } else {
        consultationsHtml = '<p>No consultation history found.</p>';
    }

    resultDiv.innerHTML = `
        <div class="patient-info">
            <h3>👤 ${info.name}</h3>
                div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Patient ID</div>
                        <div class="info-value">${info.id}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Age</div>
                        <div class="info-value">${info.age} years</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Gender</div>
                        <div class="info-value">${info.gender}</div>
                    </div>
                </div>
            </div>

        <h3 style="margin-bottom: 20px; color: #0369a1;">Recent Consultations</h3>
        ${consultationsHtml}
    `;
}





