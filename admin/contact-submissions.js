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

let currentSubmissions = null;

// Function to update statistics
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
                            <td class="timestamp">${formatDate(data.timestamp)}</td>
                            <td>${data.name}</td>
                            <td>${data.email}</td>
                            <td>${data.phone}</td>
                            <td>${data.business}</td>
                            <td>${data.location}</td>
                            <td class="message-cell">${data.message}</td>
                            <td>
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

// Function to toggle status
function toggleStatus(submissionId, currentStatus) {
    const db = firebase.database();
    const submissionRef = db.ref(`contact_us/${submissionId}`);

    submissionRef.update({ contacted: !currentStatus })
        .then(() => {
            loadSubmissions(); // Reload the table
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

// Setup event listeners
function setupEventListeners() {
    const searchBox = document.getElementById('searchBox');
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');

    const handleFilterChange = () => {
        if (currentSubmissions) {
            const filteredSubmissions = filterSubmissions(currentSubmissions);
            document.getElementById('submissionsContainer').innerHTML = 
                createSubmissionsTable(filteredSubmissions);
        }
    };

    searchBox.addEventListener('input', handleFilterChange);
    statusFilter.addEventListener('change', handleFilterChange);
    dateFilter.addEventListener('change', handleFilterChange);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadSubmissions();
    setupEventListeners();
});
