// IndexedDB Setup
let db;
const DB_NAME = 'educationalMaterialsDB';
const DB_VERSION = 1;
const MATERIALS_STORE = 'materials';
const BOOKS_STORE = 'books';
const FILES_STORE = 'files';

// Initialize the database
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
            console.error('Error opening database:', event.target.error);
            reject(event.target.error);
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Database opened successfully');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create stores for materials and books if they don't exist
            if (!db.objectStoreNames.contains(MATERIALS_STORE)) {
                const materialsStore = db.createObjectStore(MATERIALS_STORE, { keyPath: 'id' });
                materialsStore.createIndex('name', 'name', { unique: false });
            }
            
            if (!db.objectStoreNames.contains(BOOKS_STORE)) {
                const booksStore = db.createObjectStore(BOOKS_STORE, { keyPath: 'id' });
                booksStore.createIndex('name', 'name', { unique: false });
            }
            
            if (!db.objectStoreNames.contains(FILES_STORE)) {
                const filesStore = db.createObjectStore(FILES_STORE, { keyPath: 'id' });
            }
        };
    });
}

// Get all items from a store
function getAllItems(storeName) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }
        
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Get file from IndexedDB
function getFile(fileId) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }
        
        const transaction = db.transaction(FILES_STORE, 'readonly');
        const store = transaction.objectStore(FILES_STORE);
        const request = store.get(fileId);
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Create a material card
function createMaterialCard(material) {
    const card = document.createElement('div');
    card.className = 'material-card';
    
    card.innerHTML = `
        <div class="preview-container">
            <div class="pdf-placeholder" id="preview-${material.id}">معاينة PDF</div>
        </div>
        <div class="details">
            <div class="material-title">${material.name}</div>
            <div class="info-grid">
                <div class="info-label">المدرسة:</div>
                <div class="info-value">${material.school}</div>
                
                <div class="info-label">المعلم:</div>
                <div class="info-value">${material.teacher}</div>
                
                <div class="info-label">الصف:</div>
                <div class="info-value">${material.grade}</div>
                
                <div class="info-label">عدد الأوجه:</div>
                <div class="info-value">${material.sides}</div>
                
                <div class="info-label">السعر:</div>
                <div class="info-value">${material.price} ريال</div>
            </div>
            <a href="#" class="download-link" onclick="downloadFile('${material.fileId}', '${material.fileName}')">تحميل المذكرة</a>
        </div>
    `;
    
    return card;
}

// Create a book card
function createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'book-card';
    
    card.innerHTML = `
        <div class="preview-container">
            <div class="pdf-placeholder" id="preview-${book.id}">معاينة PDF</div>
        </div>
        <div class="details">
            <div class="book-title">${book.name}</div>
            <div class="info-grid">
                <div class="info-label">الصف:</div>
                <div class="info-value">${book.grade}</div>
                
                <div class="info-label">السعر:</div>
                <div class="info-value">${book.price} ريال</div>
            </div>
            <a href="#" class="download-link" onclick="downloadFile('${book.fileId}', '${book.fileName}')">تحميل الكتاب</a>
        </div>
    `;
    
    return card;
}

// Render PDF preview from IndexedDB
async function renderPdfPreviewFromDB(fileId, containerId) {
    try {
        const fileData = await getFile(fileId);
        if (!fileData) {
            console.error('File not found in database');
            return;
        }
        
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Clear current content
        container.innerHTML = '';
        
        // Create canvas element
        const canvas = document.createElement('canvas');
        canvas.className = 'pdf-canvas';
        container.appendChild(canvas);
        
        // Convert ArrayBuffer to Blob
        const blob = new Blob([fileData.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        // Load and display the first page of the PDF
        pdfjsLib.getDocument(url).promise.then(function(pdf) {
            return pdf.getPage(1);
        }).then(function(page) {
            const viewport = page.getViewport({ scale: 1.0 });
            const scale = Math.min(
                container.clientWidth / viewport.width,
                container.clientHeight / viewport.height
            );
            const scaledViewport = page.getViewport({ scale: scale * 0.9 });
            
            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;
            
            const renderContext = {
                canvasContext: canvas.getContext('2d'),
                viewport: scaledViewport
            };
            
            page.render(renderContext);
        }).catch(function(error) {
            console.error('Error loading or rendering PDF:', error);
            container.innerHTML = 'PDF';
        }).finally(() => {
            // Clean up the URL object
            URL.revokeObjectURL(url);
        });
    } catch (error) {
        console.error('Error rendering PDF preview:', error);
    }
}

// Download a file
async function downloadFile(fileId, fileName) {
    try {
        const fileData = await getFile(fileId);
        if (!fileData) {
            alert('الملف غير موجود');
            return;
        }
        
        // Create a blob from the file data
        const blob = new Blob([fileData.data], { type: 'application/pdf' });
        
        // Create a download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'download.pdf';
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    } catch (error) {
        console.error('Error downloading file:', error);
        alert('حدث خطأ أثناء تحميل الملف');
    }
}

// Display items in the UI
function displayItems(items) {
    // Separate materials and books
    const materials = items.filter(item => item.type === 'material');
    const books = items.filter(item => item.type === 'book');
    
    console.log(`Displaying ${materials.length} materials and ${books.length} books`);
    
    // Display materials
    const materialsContainers = document.querySelectorAll('.materials-container');
    const materialsContainer = materialsContainers[0];
    
    if (materialsContainer) {
        materialsContainer.innerHTML = '';
        
        if (materials.length === 0) {
            materialsContainer.innerHTML = '<p>لا توجد مذكرات متاحة حاليًا</p>';
        } else {
            materials.forEach(item => {
                const card = createMaterialCard(item);
                materialsContainer.appendChild(card);
                
                // Render PDF preview if file exists
                if (item.fileId) {
                    renderPdfPreviewFromDB(item.fileId, `preview-${item.id}`);
                }
            });
        }
    }
    
    // Display books
    if (materialsContainers.length > 1) {
        const booksContainer = materialsContainers[1];
        
        if (booksContainer) {
            booksContainer.innerHTML = '';
            
            if (books.length === 0) {
                booksContainer.innerHTML = '<p>لا توجد كتب متاحة حاليًا</p>';
            } else {
                books.forEach(item => {
                    const card = createBookCard(item);
                    booksContainer.appendChild(card);
                    
                    // Render PDF preview if file exists
                    if (item.fileId) {
                        renderPdfPreviewFromDB(item.fileId, `preview-${item.id}`);
                    }
                });
            }
        }
    }
}

// Load and display items when page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing...');
    try {
        await initDB();
        console.log('Database initialized successfully');
        
        const materials = await getAllItems(MATERIALS_STORE);
        const books = await getAllItems(BOOKS_STORE);
        
        console.log(`Loaded ${materials.length} materials and ${books.length} books from database`);
        
        // Combine materials and books
        const items = [
            ...materials.map(m => ({ ...m, type: 'material' })),
            ...books.map(b => ({ ...b, type: 'book' }))
        ];
        
        // Display items
        displayItems(items);
    } catch (error) {
        console.error('Error loading data:', error);
    }
});