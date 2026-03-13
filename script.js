// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contactForm');
    
    if (form) {
        // Real-time validation
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');
        
        // Add input event listeners for real-time validation
        nameInput.addEventListener('input', () => validateField('name'));
        emailInput.addEventListener('input', () => validateField('email'));
        messageInput.addEventListener('input', () => validateField('message'));
        
        // Form submission handler
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validate all fields
            const isNameValid = validateField('name');
            const isEmailValid = validateField('email');
            const isMessageValid = validateField('message');
            
            if (isNameValid && isEmailValid && isMessageValid) {
                // Get button and show loading state
                const submitBtn = document.getElementById('submitBtn');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                submitBtn.disabled = true;
                
                // Simulate async operation (remove this in production)
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Get form values
                const name = nameInput.value.trim();
                const email = emailInput.value.trim();
                const message = messageInput.value.trim();
                
                // Save to localStorage
                saveSubmission({ name, email, message });
                
                // Show success toast
                showToast('Message sent successfully!', 'success');
                
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Reset form
                form.reset();
                
                // Reset floating labels
                resetFloatingLabels();
            }
        });
    }
    
    // Check if we're on submissions page
    if (window.location.pathname.includes('submissions.html')) {
        displaySubmissions();
    }
});

// Validate individual field
function validateField(fieldId) {
    const input = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    const value = input.value.trim();
    
    // Remove previous error class
    input.classList.remove('error');
    
    if (!value) {
        errorElement.textContent = `${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)} is required`;
        input.classList.add('error');
        return false;
    }
    
    if (fieldId === 'email') {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
            errorElement.textContent = 'Please enter a valid email address';
            input.classList.add('error');
            return false;
        }
    }
    
    errorElement.textContent = '';
    return true;
}

// Save submission to localStorage
function saveSubmission(data) {
    let submissions = JSON.parse(localStorage.getItem('contacts')) || [];
    
    // Add timestamp
    data.timestamp = new Date().toISOString();
    data.id = Date.now() + Math.random().toString(36);
    
    submissions.unshift(data); // Add to beginning of array
    localStorage.setItem('contacts', JSON.stringify(submissions));
    
    // Trigger storage event for other tabs
    window.dispatchEvent(new Event('storage'));
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('successToast');
    if (!toast) return;
    
    toast.querySelector('span').textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Reset floating labels
function resetFloatingLabels() {
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
}

// Display submissions on submissions page
function displaySubmissions() {
    const container = document.getElementById('submissionsContainer');
    if (!container) return;
    
    const submissions = JSON.parse(localStorage.getItem('contacts')) || [];
    
    if (submissions.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-inbox"></i>
                <h3>No submissions yet</h3>
                <p>Be the first to send a message!</p>
            </div>
        `;
        updateStats(0);
        return;
    }
    
    // Update statistics
    updateStats(submissions.length);
    
    // Display submissions
    container.innerHTML = submissions.map(sub => `
        <div class="submission-card" data-id="${sub.id}">
            <div class="card-header">
                <div class="avatar">
                    ${sub.name.charAt(0).toUpperCase()}
                </div>
                <div class="user-info">
                    <h3>${escapeHtml(sub.name)}</h3>
                    <p><i class="fas fa-envelope"></i> ${escapeHtml(sub.email)}</p>
                </div>
                <small class="timestamp">
                    ${formatDate(sub.timestamp)}
                </small>
            </div>
            <div class="message-content">
                <i class="fas fa-quote-left"></i>
                <p>${escapeHtml(sub.message)}</p>
            </div>
        </div>
    `).join('');
}

// Update statistics
function updateStats(count) {
    const statValue = document.querySelector('.stat-value');
    if (statValue) {
        statValue.textContent = count;
    }
}

// Format date
function formatDate(timestamp) {
    if (!timestamp) return 'Recently';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    }
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Clear all submissions (optional feature)
function clearAllSubmissions() {
    if (confirm('Are you sure you want to delete all submissions?')) {
        localStorage.removeItem('contacts');
        displaySubmissions();
        showToast('All submissions cleared', 'success');
    }
}