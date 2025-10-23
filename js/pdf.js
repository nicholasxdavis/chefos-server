/**
 * PDF Management Module for ChefOS
 * Upload and store PDF files
 */

// PDF Management State
let pdfState = {
    pdfs: []
};

// Load PDFs from storage
function loadPDFs() {
    try {
        const pdfs = storage.get('yieldr_pdfs', []);
        pdfState.pdfs = pdfs;
        return pdfs;
    } catch (error) {
        console.error('Error loading PDFs:', error);
        return [];
    }
}

// Save PDF to storage
function savePDF(pdf) {
    try {
        const sanitizedPDF = {
            id: pdf.id || Date.now().toString(),
            name: sanitizeInput(pdf.name || 'Untitled PDF'),
            fileName: pdf.fileName,
            fileData: pdf.fileData,
            fileSize: pdf.fileSize,
            createdAt: pdf.createdAt || new Date().toISOString()
        };
        
        pdfState.pdfs.push(sanitizedPDF);
        storage.set('yieldr_pdfs', pdfState.pdfs);
        
        return { success: true, pdf: sanitizedPDF };
    } catch (error) {
        console.error('Error saving PDF:', error);
        return { success: false, error: error.message };
    }
}

// Delete PDF
function deletePDF(pdfId) {
    try {
        pdfState.pdfs = pdfState.pdfs.filter(p => p.id !== pdfId);
        storage.set('yieldr_pdfs', pdfState.pdfs);
        return { success: true };
    } catch (error) {
        console.error('Error deleting PDF:', error);
        return { success: false, error: error.message };
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Render PDF Management page
function renderPDFManagement() {
    const grid = getElement('pdf-files-grid');
    const emptyState = getElement('pdf-empty-state');
    
    if (!grid || !emptyState) return;
    
    if (pdfState.pdfs.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        // Update search bar visibility
        if (typeof window.updateSearchBarVisibility === 'function') {
            window.updateSearchBarVisibility();
        }
        return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    grid.innerHTML = pdfState.pdfs.map(pdf => {
        const dateLabel = new Date(pdf.createdAt).toLocaleDateString();
        return `
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <div class="flex items-start justify-between mb-2">
                    <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <use href="#icon-download"></use>
                    </svg>
                    <span class="badge" style="background-color: var(--accent-color); color: white;">${dateLabel}</span>
                </div>
                <h2 class="card-title text-base">${escapeHtml(pdf.fileName)}</h2>
                <div class="space-y-1 text-sm opacity-70">
                    <p><strong>Size:</strong> ${formatFileSize(pdf.fileSize)}</p>
                </div>
                <div class="card-actions justify-end mt-4">
                    <button onclick="downloadPDF('${pdf.id}')" class="btn btn-primary btn-sm">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <use href="#icon-download"></use>
                        </svg>
                        Download
                    </button>
                    <button onclick="deletePDFById('${pdf.id}')" class="btn btn-error btn-sm">Delete</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    // Update search bar visibility after rendering
    if (typeof window.updateSearchBarVisibility === 'function') {
        window.updateSearchBarVisibility();
    }
}

// Handle file upload
function handlePDFUpload() {
    const fileInput = getElement('pdf-file-input');
    if (!fileInput) return;
    
    fileInput.click();
}

// Process uploaded file
function processPDFFile(file) {
    if (!file) return;
    
    // Check file type
    if (file.type !== 'application/pdf') {
        showToast('Please upload a PDF file', 'error');
        return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be less than 10MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const pdf = {
            name: file.name,
            fileName: file.name,
            fileData: e.target.result,
            fileSize: file.size
        };
        
        const result = savePDF(pdf);
        if (result.success) {
            showToast('PDF uploaded successfully!', 'success');
            renderPDFManagement();
        } else {
            showToast('Error uploading PDF', 'error');
        }
    };
    
    reader.readAsDataURL(file);
}

// Download PDF
function downloadPDF(pdfId) {
    const pdf = pdfState.pdfs.find(p => p.id === pdfId);
    if (!pdf) {
        showToast('PDF not found', 'error');
        return;
    }
    
    // Create download link
    const link = document.createElement('a');
    link.href = pdf.fileData;
    link.download = pdf.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('PDF downloaded!', 'success');
}

// Delete PDF by ID
function deletePDFById(pdfId) {
    showConfirmation(
        'Delete PDF',
        'Are you sure you want to delete this PDF? This action cannot be undone.',
        () => {
            const result = deletePDF(pdfId);
            if (result.success) {
                showToast('PDF deleted successfully!', 'success');
                renderPDFManagement();
            } else {
                showToast('Error deleting PDF', 'error');
            }
        }
    );
}

// Initialize PDF Management
function initializePDFManagement() {
    loadPDFs();
    
    // Event listeners
    const uploadPDFBtn = getElement('upload-pdf-btn');
    const uploadPDFBtn2 = getElement('upload-pdf-btn-2');
    const pdfFileInput = getElement('pdf-file-input');
    
    if (uploadPDFBtn) uploadPDFBtn.addEventListener('click', handlePDFUpload);
    if (uploadPDFBtn2) uploadPDFBtn2.addEventListener('click', handlePDFUpload);
    
    if (pdfFileInput) {
        pdfFileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                processPDFFile(e.target.files[0]);
                e.target.value = ''; // Reset input
            }
        });
    }
}

// Make functions globally available
window.downloadPDF = downloadPDF;
window.deletePDFById = deletePDFById;
window.renderPDFManagement = renderPDFManagement;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadPDFs,
        renderPDFManagement,
        initializePDFManagement
    };
}
