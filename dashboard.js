document.addEventListener('DOMContentLoaded', function() {
    const previewModal = document.getElementById('preview-modal');
    const previewContent = document.getElementById('modal-preview-content');
    const closeBtn = document.querySelector('.close-btn');
    const whatsappShareBtn = document.getElementById('whatsapp-share-btn');
    const downloadBtn = document.getElementById('download-btn');
    const documentsList = document.getElementById('documents-list');
    const uploadStatus = document.getElementById('upload-status');

    let db;

    // Initialize IndexedDB
    function initDB() {
        const request = indexedDB.open('DigiLockerDB', 1);

        request.onupgradeneeded = function(event) {
            db = event.target.result;
            db.createObjectStore('documents', { keyPath: 'name' });
        };

        request.onsuccess = function(event) {
            db = event.target.result;
            loadDocuments();
        };

        request.onerror = function(event) {
            console.error('Database error:', event.target.errorCode);
        };
    }

    initDB();

    // Load documents from IndexedDB and display them
    function loadDocuments() {
        const transaction = db.transaction(['documents'], 'readonly');
        const objectStore = transaction.objectStore('documents');
        const request = objectStore.openCursor();

        request.onsuccess = function(event) {
            const cursor = event.target.result;
            if (cursor) {
                addDocumentToList(cursor.value.name, cursor.value.type, cursor.value.content, cursor.value.fileType);
                cursor.continue();
            }
        };

        request.onerror = function(event) {
            console.error('Error loading documents:', event.target.errorCode);
        };
    }

    // Store document in IndexedDB
    function storeDocument(doc) {
        const transaction = db.transaction(['documents'], 'readwrite');
        const objectStore = transaction.objectStore('documents');
        objectStore.put(doc);

        transaction.oncomplete = function() {
            console.log('Document stored successfully');
        };

        transaction.onerror = function(event) {
            console.error('Error storing document:', event.target.errorCode);
        };
    }

    // Handle document upload
    function uploadDocument(type) {
        const fileInput = document.querySelector(`.upload-card[data-type="${type}"] input[type="file"]`);
        fileInput.click();

        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                const fileContent = e.target.result;
                storeDocument({
                    name: file.name,
                    type: type,
                    content: fileContent,
                    fileType: file.type
                });
                addDocumentToList(file.name, type, fileContent, file.type);
                showUploadStatus(`${getHeadingByType(type)} uploaded successfully!`);
            };
            reader.readAsArrayBuffer(file);
        }, { once: true });
    }

    // Add document to the list with the correct heading
    function addDocumentToList(name, type, content, fileType) {
        const existingPreview = document.getElementById(`${type}-preview`);
        if (existingPreview) {
            existingPreview.remove();
        }

        const previewBox = document.createElement('div');
        previewBox.classList.add('preview-box');
        previewBox.id = `${type}-preview`;

        let previewContent = '';
        if (fileType.startsWith('image/')) {
            previewContent = `<img src="${URL.createObjectURL(new Blob([content], { type: fileType }))}" class="preview-img" />`;
        } else if (fileType === 'application/pdf') {
            previewContent = `<iframe src="${URL.createObjectURL(new Blob([content], { type: fileType }))}" class="preview-pdf"></iframe>`;
        } else {
            previewContent = `<p>Unsupported file type</p>`;
        }

        previewBox.innerHTML = `
            <h2>${getHeadingByType(type)}</h2>
            ${previewContent}
            <div class="preview-actions">
                <button onclick="viewDocument('${name}', '${type}')">View</button>
                <button onclick="downloadDocument('${name}', '${type}')">Download</button>
                <button onclick="shareDocument('${name}', '${type}')">Share on WhatsApp</button>
                <button class="delete-btn" onclick="deleteDocument('${name}', '${type}')">Delete</button>
            </div>
        `;
        documentsList.appendChild(previewBox);
    }

    // Get the correct heading based on document type
    function getHeadingByType(type) {
        const headings = {
            'aadhaar': 'Aadhaar Card',
            'pan': 'PAN Card',
            'driving-license': 'Driving License',
            'voting-card': 'Voting Card',
            'hsc-marksheet': 'HSC Marksheet',
            'ssc-marksheet': 'SSC Marksheet',
            'other': 'Other Document'
        };
        return headings[type] || 'Document';
    }

    // Show upload status
    function showUploadStatus(message) {
        uploadStatus.textContent = message;
        uploadStatus.classList.add('show');
        setTimeout(() => {
            uploadStatus.classList.remove('show');
        }, 3000); // Message disappears after 3 seconds
    }

    // View document in modal
    window.viewDocument = function(name, type) {
        getDocument(name, function(doc) {
            previewContent.innerHTML = '';
            const blob = new Blob([doc.content], { type: doc.fileType });
            const url = URL.createObjectURL(blob);
            if (doc.fileType.startsWith('image/')) {
                previewContent.innerHTML = `<img src="${url}" class="modal-img ${doc.type === 'image' ? 'small-img' : ''}" />`;
                previewModal.style.maxWidth = '80%';
            } else if (doc.fileType === 'application/pdf') {
                previewContent.innerHTML = `<iframe src="${url}" class="modal-pdf"></iframe>`;
                previewModal.style.maxWidth = '90%';
            } else {
                previewContent.innerHTML = `<p>Unsupported file type</p>`;
                previewModal.style.maxWidth = '70%';
            }
            previewModal.style.display = 'flex';
            downloadBtn.onclick = function() {
                const a = document.createElement('a');
                a.href = url;
                a.download = name;
                a.click();
            };
            whatsappShareBtn.onclick = function() {
                const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent('Check out this document: ' + url)}`;
                window.open(whatsappUrl, '_blank');
            };
        });
    }

    // Download document
    window.downloadDocument = function(name, type) {
        getDocument(name, function(doc) {
            const blob = new Blob([doc.content], { type: doc.fileType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = name;
            a.click();
        });
    }

    // Share document on WhatsApp
    window.shareDocument = function(name, type) {
        getDocument(name, function(doc) {
            const blob = new Blob([doc.content], { type: doc.fileType });
            const url = URL.createObjectURL(blob);
            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent('Check out this document: ' + url)}`;
            window.open(whatsappUrl, '_blank');
        });
    }

    // Delete document with confirmation
    window.deleteDocument = function(name, type) {
        if (confirm(`Are you sure you want to delete the document "${name}"?`)) {
            const transaction = db.transaction(['documents'], 'readwrite');
            const objectStore = transaction.objectStore('documents');
            objectStore.delete(name);

            transaction.oncomplete = function() {
                console.log('Document deleted successfully');
                const previewBox = document.getElementById(`${type}-preview`);
                if (previewBox) {
                    previewBox.remove();
                }
            };

            transaction.onerror = function(event) {
                console.error('Error deleting document:', event.target.errorCode);
            };
        }
    }

    function getDocument(name, callback) {
        const transaction = db.transaction(['documents'], 'readonly');
        const objectStore = transaction.objectStore('documents');
        const request = objectStore.get(name);

        request.onsuccess = function(event) {
            const doc = event.target.result;
            if (doc) {
                callback(doc);
            } else {
                console.error('Document not found');
            }
        };

        request.onerror = function(event) {
            console.error('Error getting document:', event.target.errorCode);
        };
    }

    // Close modal when clicking outside of it
    window.onclick = function(event) {
        if (event.target == previewModal) {
            previewModal.style.display = 'none';
        }
    }

    closeBtn.addEventListener('click', function() {
        previewModal.style.display = 'none';
    });

    document.querySelectorAll('.upload-button').forEach(button => {
        button.addEventListener('click', function() {
            const type = this.parentElement.getAttribute('data-type');
            uploadDocument(type);
        });
    });

    const closeModalBtn = document.getElementById('close-modal-btn');
    closeModalBtn.addEventListener('click', function() {
        previewModal.style.display = 'none';
    });
});
