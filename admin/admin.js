// Global variables
let currentSubmissions = null;
let currentSubscriptions = null;

// Function to format timestamp
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Function to update contact form statistics
function updateStats(submissions) {
    const stats = {
        total: 0,
        new: 0,
        contacted: 0
    };

    if (submissions) {
        Object.values(submissions).forEach(submission => {
            stats.total++;
            if (submission.contacted) {
                stats.contacted++;
            } else {
                stats.new++;
            }
        });
    }

    document.getElementById('totalSubmissions').textContent = stats.total;
    document.getElementById('newSubmissions').textContent = stats.new;
    document.getElementById('contactedSubmissions').textContent = stats.contacted;
}

// Function to update subscription statistics
function updateSubscriptionStats(subscriptions) {
    const total = subscriptions ? Object.keys(subscriptions).length : 0;
    document.getElementById('totalSubscriptions').textContent = total;
}

// Function to filter submissions
function filterSubmissions(submissions) {
    if (!submissions) return null;

    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;

    return Object.entries(submissions).filter(([key, data]) => {
        const matchesSearch = Object.values(data).some(value => 
            String(value).toLowerCase().includes(searchTerm)
        );

        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'new' && !data.contacted) ||
            (statusFilter === 'contacted' && data.contacted);

        const submissionDate = new Date(data.timestamp);
        const now = new Date();
        const isToday = submissionDate.toDateString() === now.toDateString();
        const isThisWeek = submissionDate > new Date(now - 7 * 24 * 60 * 60 * 1000);
        const isThisMonth = submissionDate.getMonth() === now.getMonth() && 
                          submissionDate.getFullYear() === now.getFullYear();

        const matchesDate = dateFilter === 'all' ||
            (dateFilter === 'today' && isToday) ||
            (dateFilter === 'week' && isThisWeek) ||
            (dateFilter === 'month' && isThisMonth);

        return matchesSearch && matchesStatus && matchesDate;
    });
}

// Function to filter subscriptions
function filterSubscriptions(subscriptions) {
    if (!subscriptions) return null;

    const searchTerm = document.getElementById('subscriptionSearchBox').value.toLowerCase();
    const dateFilter = document.getElementById('subscriptionDateFilter').value;

    return Object.entries(subscriptions).filter(([key, data]) => {
        const matchesSearch = data.email.toLowerCase().includes(searchTerm);

        const submissionDate = new Date(data.timestamp);
        const now = new Date();
        const isToday = submissionDate.toDateString() === now.toDateString();
        const isThisWeek = submissionDate > new Date(now - 7 * 24 * 60 * 60 * 1000);
        const isThisMonth = submissionDate.getMonth() === now.getMonth() && 
                          submissionDate.getFullYear() === now.getFullYear();

        const matchesDate = dateFilter === 'all' ||
            (dateFilter === 'today' && isToday) ||
            (dateFilter === 'week' && isThisWeek) ||
            (dateFilter === 'month' && isThisMonth);

        return matchesSearch && matchesDate;
    });
}

// Function to create the submissions table
function createSubmissionsTable(submissions) {
    if (!submissions || submissions.length === 0) {
        return `
            <div class="no-submissions">
                No submissions found.
            </div>
        `;
    }

    const tableHTML = `
        <table class="submissions-table">
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Business</th>
                    <th>Location</th>
                    <th>Message</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${submissions
                    .sort(([, a], [, b]) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map(([key, data]) => `
                        <tr data-id="${key}">
                            <td data-label="Timestamp" class="timestamp">${formatDate(data.timestamp)}</td>
                            <td data-label="Name">${data.name}</td>
                            <td data-label="Email">${data.email}</td>
                            <td data-label="Phone">${data.phone}</td>
                            <td data-label="Business">${data.business}</td>
                            <td data-label="Location">${data.location}</td>
                            <td data-label="Message" class="message-cell">${data.message}</td>
                            <td data-label="Status">
                                <span class="status-badge ${data.contacted ? 'status-contacted' : 'status-new'}"
                                      onclick="toggleStatus('${key}', ${data.contacted})">
                                    ${data.contacted ? 'Contacted' : 'New'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
            </tbody>
        </table>
    `;

    return tableHTML;
}

// Function to create the subscriptions table
function createSubscriptionsTable(subscriptions) {
    if (!subscriptions || subscriptions.length === 0) {
        return `
            <div class="no-submissions">
                No subscriptions found.
            </div>
        `;
    }

    const tableHTML = `
        <table class="submissions-table">
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>Email</th>
                </tr>
            </thead>
            <tbody>
                ${subscriptions
                    .sort(([, a], [, b]) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map(([key, data]) => `
                        <tr data-id="${key}">
                            <td data-label="Timestamp" class="timestamp">${formatDate(data.timestamp)}</td>
                            <td data-label="Email">${data.email}</td>
                        </tr>
                    `).join('')}
            </tbody>
        </table>
    `;

    return tableHTML;
}

// Function to update a single row's status
function updateRowStatus(submissionId, newStatus) {
    const row = document.querySelector(`tr[data-id="${submissionId}"]`);
    if (row) {
        const statusCell = row.querySelector('[data-label="Status"]');
        if (statusCell) {
            statusCell.innerHTML = `
                <span class="status-badge ${newStatus ? 'status-contacted' : 'status-new'}"
                      onclick="toggleStatus('${submissionId}', ${newStatus})">
                    ${newStatus ? 'Contacted' : 'New'}
                </span>
            `;
        }
    }
}

// Function to toggle status
function toggleStatus(submissionId, currentStatus) {
    const db = firebase.database();
    const submissionRef = db.ref(`contact_us/${submissionId}`);
    const newStatus = !currentStatus;

    submissionRef.update({ contacted: newStatus })
        .then(() => {
            // Update just the status in the UI
            updateRowStatus(submissionId, newStatus);
            
            // Update the stats without refreshing
            if (currentSubmissions) {
                currentSubmissions[submissionId].contacted = newStatus;
                updateStats(currentSubmissions);
            }
        })
        .catch((error) => {
            console.error('Error updating submission:', error);
            alert('Error updating submission status. Please try again.');
        });
}

// Function to load submissions from Firebase
function loadSubmissions() {
    const submissionsContainer = document.getElementById('submissionsContainer');
    submissionsContainer.innerHTML = '<div class="loading">Loading submissions...</div>';

    const db = firebase.database();
    const contactsRef = db.ref('contact_us');

    contactsRef.once('value')
        .then((snapshot) => {
            currentSubmissions = snapshot.val();
            const filteredSubmissions = filterSubmissions(currentSubmissions);
            submissionsContainer.innerHTML = createSubmissionsTable(filteredSubmissions);
            updateStats(currentSubmissions);
        })
        .catch((error) => {
            console.error('Error loading submissions:', error);
            submissionsContainer.innerHTML = `
                <div class="error">
                    Error loading submissions. Please try again.
                </div>
            `;
        });
}

// Function to load subscriptions from Firebase
function loadSubscriptions() {
    const subscriptionsContainer = document.getElementById('subscriptionsContainer');
    subscriptionsContainer.innerHTML = '<div class="loading">Loading subscriptions...</div>';

    const db = firebase.database();
    const subscriptionsRef = db.ref('newsletter_subscribers');

    subscriptionsRef.once('value')
        .then((snapshot) => {
            currentSubscriptions = snapshot.val();
            const filteredSubscriptions = filterSubscriptions(currentSubscriptions);
            subscriptionsContainer.innerHTML = createSubscriptionsTable(filteredSubscriptions);
            updateSubscriptionStats(currentSubscriptions);
        })
        .catch((error) => {
            console.error('Error loading subscriptions:', error);
            subscriptionsContainer.innerHTML = `
                <div class="error">
                    Error loading subscriptions. Please try again.
                </div>
            `;
        });
}

// Function to export data to Excel
function exportToExcel() {
    if (!currentSubmissions) {
        alert('No data to export');
        return;
    }

    const filteredSubmissions = filterSubmissions(currentSubmissions);
    if (!filteredSubmissions || filteredSubmissions.length === 0) {
        alert('No data to export after applying filters');
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
        filteredSubmissions.map(([, data]) => ({
            Timestamp: formatDate(data.timestamp),
            Name: data.name,
            Email: data.email,
            Phone: data.phone,
            Business: data.business,
            Location: data.location,
            Message: data.message,
            Status: data.contacted ? 'Contacted' : 'New'
        }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `contact_submissions_${date}.xlsx`;

    XLSX.writeFile(workbook, filename);
}

// Function to export subscriptions to Excel
function exportSubscribersToExcel() {
    if (!currentSubscriptions) {
        alert('No data to export');
        return;
    }

    const filteredSubscriptions = filterSubscriptions(currentSubscriptions);
    if (!filteredSubscriptions || filteredSubscriptions.length === 0) {
        alert('No data to export after applying filters');
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
        filteredSubscriptions.map(([, data]) => ({
            Timestamp: formatDate(data.timestamp),
            Email: data.email
        }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Subscriptions');

    const date = new Date().toISOString().split('T')[0];
    const filename = `email_subscriptions_${date}.xlsx`;

    XLSX.writeFile(workbook, filename);
}

// Tab switching functionality
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-tab');

            // Update active states
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`${targetId}-tab`).classList.add('active');
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Contact form filters
    const searchBox = document.getElementById('searchBox');
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');

    const handleContactFilterChange = () => {
        if (currentSubmissions) {
            const filteredSubmissions = filterSubmissions(currentSubmissions);
            document.getElementById('submissionsContainer').innerHTML = 
                createSubmissionsTable(filteredSubmissions);
        }
    };

    searchBox.addEventListener('input', handleContactFilterChange);
    statusFilter.addEventListener('change', handleContactFilterChange);
    dateFilter.addEventListener('change', handleContactFilterChange);

    // Subscription filters
    const subscriptionSearchBox = document.getElementById('subscriptionSearchBox');
    const subscriptionDateFilter = document.getElementById('subscriptionDateFilter');

    const handleSubscriptionFilterChange = () => {
        if (currentSubscriptions) {
            const filteredSubscriptions = filterSubscriptions(currentSubscriptions);
            document.getElementById('subscriptionsContainer').innerHTML = 
                createSubscriptionsTable(filteredSubscriptions);
        }
    };

    subscriptionSearchBox.addEventListener('input', handleSubscriptionFilterChange);
    subscriptionDateFilter.addEventListener('change', handleSubscriptionFilterChange);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase
    const firebaseConfig = {
        // Your Firebase config here
    };
    
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    setupTabs();
    setupEventListeners();
    loadSubmissions();
    loadSubscriptions();
});
