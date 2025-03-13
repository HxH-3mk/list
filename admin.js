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

// Load saved materials and books from IndexedDB
async function loadSavedItems() {
    try {
        await initDB();
        
        // Load materials
        const materials = await getAllItems(MATERIALS_STORE);
        displayItems('material', materials);
        
        // Load books
        const books = await getAllItems(BOOKS_STORE);
        displayItems('book', books);
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
    }
}

// Get all items from a store
function getAllItems(storeName) {
    return new Promise((resolve, reject) => {
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

// Add an item to a store
function addItem(storeName, item) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(item);
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Update an item in a store
function updateItem(storeName, item) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Delete an item from a store
function deleteItem(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        
        request.onsuccess = () => {
            resolve();
        };
        
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Store a file in IndexedDB
function storeFile(id, file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const transaction = db.transaction(FILES_STORE, 'readwrite');
                const store = transaction.objectStore(FILES_STORE);
                const fileData = {
                    id: id,
                    name: file.name,
                    type: file.type,
                    data: event.target.result
                };
                const request = store.put(fileData);
                
                request.onsuccess = () => {
                    resolve(fileData);
                };
                
                request.onerror = (event) => {
                    reject(event.target.error);
                };
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = (event) => {
            reject(event.target.error);
        };
        
        reader.readAsArrayBuffer(file);
    });
}

// Get a file from IndexedDB
function getFile(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(FILES_STORE, 'readonly');
        const store = transaction.objectStore(FILES_STORE);
        const request = store.get(id);
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Display items in the page
function displayItems(type, items) {
    const container = document.querySelector(`#tab-${type}s .items-list`);
    container.innerHTML = `<h3>${type === 'material' ? 'المذكرات' : 'الكتب'} المضافة</h3>`;
    
    if (items.length === 0) {
        container.innerHTML += `<p>لا توجد ${type === 'material' ? 'مذكرات' : 'كتب'} مضافة حتى الآن</p>`;
    } else {
        items.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            
            const previewId = `preview-${type}-${item.id}`;
            if (type === 'material') {
                itemCard.innerHTML = `
                    <div class="item-thumbnail" id="${previewId}">PDF</div>
                    <div class="item-details">
                        <div class="item-title">${item.name}</div>
                        <div class="item-info">المدرسة: ${item.school} | المعلم: ${item.teacher} | الصف: ${item.grade}</div>
                        <div class="item-info">وجه: ${item.sides} | السعر: ${item.price} ريال</div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-warning" onclick="editMaterial('${item.id}')">تعديل</button>
                        <button class="btn btn-danger" onclick="deleteMaterial('${item.id}')">حذف</button>
                    </div>
                `;
            } else {
                itemCard.innerHTML = `
                    <div class="item-thumbnail" id="${previewId}">PDF</div>
                    <div class="item-details">
                        <div class="item-title">${item.name}</div>
                        <div class="item-info">الصف: ${item.grade} | السعر: ${item.price} ريال</div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-warning" onclick="editBook('${item.id}')">تعديل</button>
                        <button class="btn btn-danger" onclick="deleteBook('${item.id}')">حذف</button>
                    </div>
                `;
            }
            
            container.appendChild(itemCard);
            
            // Display PDF preview
            if (item.fileId) {
                renderPdfPreviewFromDB(item.fileId, previewId);
            }
        });
    }
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

// Update file name and preview when a file is selected
function updateFileName(input, elementId) {
    const fileNameElement = document.getElementById(elementId);
    if (input.files.length > 0) {
        fileNameElement.textContent = `الملف المحدد: ${input.files[0].name}`;
        
        // Display PDF preview
        const file = input.files[0];
        const previewId = elementId === 'materialFileName' ? 'materialPreview' : 'bookPreview';
        
        // Use FileReader to read and display the file
        const reader = new FileReader();
        reader.onload = function(e) {
            const container = document.getElementById(previewId);
            container.innerHTML = '';
            
            const canvas = document.createElement('canvas');
            container.appendChild(canvas);
            
            // Load and display the first page of PDF
            pdfjsLib.getDocument(e.target.result).promise.then(function(pdf) {
                return pdf.getPage(1);
            }).then(function(page) {
                const viewport = page.getViewport({ scale: 1.0 });
                const context = canvas.getContext('2d');
                
                // Set Canvas size based on container size
                const containerWidth = container.clientWidth;
                const scale = containerWidth / viewport.width;
                const scaledViewport = page.getViewport({ scale: scale * 0.9 });
                
                canvas.width = scaledViewport.width;
                canvas.height = scaledViewport.height;
                
                // Render the page
                const renderContext = {
                    canvasContext: context,
                    viewport: scaledViewport
                };
                
                page.render(renderContext);
            }).catch(function(error) {
                console.error('Error displaying PDF preview:', error);
                container.innerHTML = '<p>حدث خطأ في عرض المعاينة</p>';
            });
        };
        reader.readAsDataURL(file);
    } else {
        fileNameElement.textContent = '';
        const previewId = elementId === 'materialFileName' ? 'materialPreview' : 'bookPreview';
        document.getElementById(previewId).innerHTML = '<p>سيتم عرض معاينة للصفحة الأولى من الملف هنا</p>';
    }
}

// Reset form
function resetForm(formId) {
    document.getElementById(formId).reset();
    if (formId === 'materialForm') {
        document.getElementById('materialFileName').textContent = '';
        document.getElementById('materialPreview').innerHTML = '<p>سيتم عرض معاينة للصفحة الأولى من الملف هنا</p>';
        document.getElementById('materialForm').dataset.editId = '';
        
        // Reset submit button text to default
        const submitButton = document.querySelector('#materialForm .btn-success');
        submitButton.textContent = 'حفظ المذكرة';
    } else if (formId === 'bookForm') {
        document.getElementById('bookFileName').textContent = '';
        document.getElementById('bookPreview').innerHTML = '<p>سيتم عرض معاينة للصفحة الأولى من الملف هنا</p>';
        document.getElementById('bookForm').dataset.editId = '';
        
        // Reset submit button text to default
        const submitButton = document.querySelector('#bookForm .btn-success');
        submitButton.textContent = 'حفظ الكتاب';
    }
}

// Show notification
function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block';
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Edit material
async function editMaterial(id) {
    try {
        const material = await getItemById(MATERIALS_STORE, id);
        if (material) {
            document.getElementById('materialName').value = material.name;
            document.getElementById('schoolName').value = material.school;
            document.getElementById('teacherName').value = material.teacher;
            document.getElementById('grade').value = material.grade;
            document.getElementById('sides').value = material.sides;
            document.getElementById('price').value = material.price;
            
            // Display current file name
            if (material.fileName) {
                document.getElementById('materialFileName').textContent = `الملف الحالي: ${material.fileName}`;
                
                // Display preview of current file
                if (material.fileId) {
                    renderPdfPreviewFromDB(material.fileId, 'materialPreview');
                }
            }
            
            // Store the ID of the item being edited
            document.getElementById('materialForm').dataset.editId = id;
            
            // Change submit button text
            const submitButton = document.querySelector('#materialForm .btn-success');
            submitButton.textContent = 'تحديث المذكرة';
            
            // Scroll to edit form
            document.querySelector('#tab-materials .admin-section').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error loading material for edit:', error);
        showNotification('حدث خطأ أثناء تحميل بيانات المذكرة');
    }
}

// Edit book
async function editBook(id) {
    try {
        const book = await getItemById(BOOKS_STORE, id);
        if (book) {
            document.getElementById('bookName').value = book.name;
            document.getElementById('bookGrade').value = book.grade;
            document.getElementById('bookPrice').value = book.price;
            
            // Display current file name
            if (book.fileName) {
                document.getElementById('bookFileName').textContent = `الملف الحالي: ${book.fileName}`;
                
                // Display preview of current file
                if (book.fileId) {
                    renderPdfPreviewFromDB(book.fileId, 'bookPreview');
                }
            }
            
            // Store the ID of the item being edited
            document.getElementById('bookForm').dataset.editId = id;
            
            // Change submit button text
            const submitButton = document.querySelector('#bookForm .btn-success');
            submitButton.textContent = 'تحديث الكتاب';
            
            // Scroll to edit form
            document.querySelector('#tab-books .admin-section').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error loading book for edit:', error);
        showNotification('حدث خطأ أثناء تحميل بيانات الكتاب');
    }
}

// Get item by ID
function getItemById(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Delete material
async function deleteMaterial(id) {
    if (confirm('هل أنت متأكد من حذف هذه المذكرة؟')) {
        try {
            const material = await getItemById(MATERIALS_STORE, id);
            
            // Delete the file if exists
            if (material.fileId) {
                await deleteItem(FILES_STORE, material.fileId);
            }
            
            // Delete the material
            await deleteItem(MATERIALS_STORE, id);
            
            loadSavedItems();
            showNotification('تم حذف المذكرة بنجاح');
        } catch (error) {
            console.error('Error deleting material:', error);
            showNotification('حدث خطأ أثناء الحذف');
        }
    }
}

// Delete book
async function deleteBook(id) {
    if (confirm('هل أنت متأكد من حذف هذا الكتاب؟')) {
        try {
            const book = await getItemById(BOOKS_STORE, id);
            
            // Delete the file if exists
            if (book.fileId) {
                await deleteItem(FILES_STORE, book.fileId);
            }
            
            // Delete the book
            await deleteItem(BOOKS_STORE, id);
            
            loadSavedItems();
            showNotification('تم حذف الكتاب بنجاح');
        } catch (error) {
            console.error('Error deleting book:', error);
            showNotification('حدث خطأ أثناء الحذف');
        }
    }
}

// Handle material form submission
document.getElementById('materialForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('materialFile');
    const editId = this.dataset.editId;
    let fileId = null;
    let fileName = null;
    
    try {
        // Check if updating an existing material
        if (editId) {
            const existingMaterial = await getItemById(MATERIALS_STORE, editId);
            
            // Keep existing file if no new file is selected
            if (fileInput.files.length === 0) {
                fileId = existingMaterial.fileId;
                fileName = existingMaterial.fileName;
            }
        }
        
        // Handle new file upload
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileIdStr = editId || Date.now().toString();
            fileId = fileIdStr;
            fileName = file.name;
            
            // Store the file in IndexedDB
            await storeFile(fileId, file);
        } else if (!editId) {
            // If adding new material, file is required
            showNotification('الرجاء اختيار ملف PDF');
            return;
        }
        
        // Prepare material data
        const materialData = {
            id: editId || Date.now().toString(),
            name: document.getElementById('materialName').value,
            school: document.getElementById('schoolName').value,
            teacher: document.getElementById('teacherName').value,
            grade: document.getElementById('grade').value,
            sides: document.getElementById('sides').value,
            price: document.getElementById('price').value,
            fileId: fileId,
            fileName: fileName,
            dateAdded: editId ? (await getItemById(MATERIALS_STORE, editId)).dateAdded : new Date().toISOString()
        };
        
        // Save to IndexedDB
        if (editId) {
            await updateItem(MATERIALS_STORE, materialData);
            showNotification('تم تحديث المذكرة بنجاح');
        } else {
            await addItem(MATERIALS_STORE, materialData);
            showNotification('تم حفظ المذكرة بنجاح');
        }
        
        // Reset form and reload items
        resetForm('materialForm');
        loadSavedItems();
    } catch (error) {
        console.error('Error saving material:', error);
        showNotification('حدث خطأ أثناء الحفظ');
    }
});

// Handle book form submission
document.getElementById('bookForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('bookFile');
    const editId = this.dataset.editId;
    let fileId = null;
    let fileName = null;
    
    try {
        // Check if updating an existing book
        if (editId) {
            const existingBook = await getItemById(BOOKS_STORE, editId);
            
            // Keep existing file if no new file is selected
            if (fileInput.files.length === 0) {
                fileId = existingBook.fileId;
                fileName = existingBook.fileName;
            }
        }
        
        // Handle new file upload
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileIdStr = editId || Date.now().toString();
            fileId = fileIdStr;
            fileName = file.name;
            
            // Store the file in IndexedDB
            await storeFile(fileId, file);
        } else if (!editId) {
            // If adding new book, file is required
            showNotification('الرجاء اختيار ملف PDF');
            return;
        }
        
        // Prepare book data
        const bookData = {
            id: editId || Date.now().toString(),
            name: document.getElementById('bookName').value,
            grade: document.getElementById('bookGrade').value,
            price: document.getElementById('bookPrice').value,
            fileId: fileId,
            fileName: fileName,
            dateAdded: editId ? (await getItemById(BOOKS_STORE, editId)).dateAdded : new Date().toISOString()
        };
        
        // Save to IndexedDB
        if (editId) {
            await updateItem(BOOKS_STORE, bookData);
            showNotification('تم تحديث الكتاب بنجاح');
        } else {
            await addItem(BOOKS_STORE, bookData);
            showNotification('تم حفظ الكتاب بنجاح');
        }
        
        // Reset form and reload items
        resetForm('bookForm');
        loadSavedItems();
    } catch (error) {
        console.error('Error saving book:', error);
        showNotification('حدث خطأ أثناء الحفظ');
    }
});

// Switch between tabs
function switchTab(tabId) {
    // Hide all content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Activate selected tab and content
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab[onclick="switchTab('${tabId}')"]`).classList.add('active');
}

// Support for drag and drop file upload
const fileDropAreas = document.querySelectorAll('.file-input-container');

fileDropAreas.forEach(area => {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        area.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        area.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        area.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        area.style.backgroundColor = '#e3f2fd';
    }
    
    function unhighlight() {
        area.style.backgroundColor = '';
    }
    
    area.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            // Determine which file input to update based on the drop area
            let fileInput;
            let fileNameElement;
            
            if (area.closest('#materialForm')) {
                fileInput = document.getElementById('materialFile');
                fileNameElement = 'materialFileName';
            } else if (area.closest('#bookForm')) {
                fileInput = document.getElementById('bookFile');
                fileNameElement = 'bookFileName';
            }
            
            // Check file type
            if (files[0].type === 'application/pdf') {
                fileInput.files = files;
                updateFileName(fileInput, fileNameElement);
            } else {
                alert('يرجى تحديد ملف PDF فقط');
            }
        }
    }
});

// Load saved items when the page loads
document.addEventListener('DOMContentLoaded', loadSavedItems);

// إظهار مؤشر التحميل مع رسالة
function showLoading(message) {
    const overlay = document.getElementById('loadingOverlay');
    const messageElement = document.getElementById('loadingMessage');
    
    if (messageElement) {
        messageElement.textContent = message || 'جاري المعالجة...';
    }
    
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

// إخفاء مؤشر التحميل
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// تصدير البيانات كملف XML
async function exportDataAsXML() {
    try {
        showLoading('جاري تصدير البيانات والملفات...');
        
        // إنشاء المجلد sample-pdfs إذا لم يكن موجودًا بالفعل
        let dirHandle;
        try {
            dirHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                id: 'educational-materials'
            });
        } catch (error) {
            console.error('خطأ في اختيار المجلد:', error);
            hideLoading();
            alert('يرجى اختيار مجلد لحفظ البيانات والملفات.');
            return;
        }

        // إنشاء مجلد sample-pdfs إذا لم يكن موجودًا
        let pdfsDirHandle;
        try {
            pdfsDirHandle = await dirHandle.getDirectoryHandle('sample-pdfs', { create: true });
        } catch (error) {
            console.error('خطأ في إنشاء مجلد sample-pdfs:', error);
            hideLoading();
            alert('حدث خطأ في إنشاء مجلد sample-pdfs');
            return;
        }

        // جلب البيانات من IndexedDB
        const materials = await getAllItems(MATERIALS_STORE);
        const books = await getAllItems(BOOKS_STORE);

        // إنشاء XML
        const xmlDoc = document.implementation.createDocument(null, 'data', null);
        const root = xmlDoc.documentElement;

        // إضافة قسم المذكرات
        const materialsElem = xmlDoc.createElement('materials');
        root.appendChild(materialsElem);

        for (const material of materials) {
            const materialElem = xmlDoc.createElement('material');
            materialElem.setAttribute('id', material.id);

            // إضافة حقول المذكرة
            const addField = (name, value) => {
                const elem = xmlDoc.createElement(name);
                elem.textContent = value || '';
                materialElem.appendChild(elem);
            };

            addField('name', material.name);
            addField('school', material.school);
            addField('teacher', material.teacher);
            addField('grade', material.grade);
            addField('sides', material.sides);
            addField('price', material.price);

            // حفظ الملف PDF
            if (material.fileId) {
                const fileData = await getFile(material.fileId);
                if (fileData) {
                    const fileName = `${material.id}_${material.fileName}`;
                    addField('file', fileName);

                    // حفظ ملف PDF في مجلد sample-pdfs
                    await savePDFFile(pdfsDirHandle, fileName, fileData.data);
                }
            }

            materialsElem.appendChild(materialElem);
        }

        // إضافة قسم الكتب
        const booksElem = xmlDoc.createElement('books');
        root.appendChild(booksElem);

        for (const book of books) {
            const bookElem = xmlDoc.createElement('book');
            bookElem.setAttribute('id', book.id);

            // إضافة حقول الكتاب
            const addField = (name, value) => {
                const elem = xmlDoc.createElement(name);
                elem.textContent = value || '';
                bookElem.appendChild(elem);
            };

            addField('name', book.name);
            addField('grade', book.grade);
            addField('price', book.price);

            // حفظ الملف PDF
            if (book.fileId) {
                const fileData = await getFile(book.fileId);
                if (fileData) {
                    const fileName = `${book.id}_${book.fileName}`;
                    addField('file', fileName);

                    // حفظ ملف PDF في مجلد sample-pdfs
                    await savePDFFile(pdfsDirHandle, fileName, fileData.data);
                }
            }

            booksElem.appendChild(bookElem);
        }

        // تحويل XML إلى نص
        const serializer = new XMLSerializer();
        const xmlString = serializer.serializeToString(xmlDoc);

        // حفظ ملف XML
        try {
            const xmlHandle = await dirHandle.getFileHandle('data.xml', { create: true });
            const writable = await xmlHandle.createWritable();
            await writable.write(xmlString);
            await writable.close();
            
            hideLoading();
            alert('تم تصدير البيانات والملفات بنجاح');
        } catch (error) {
            console.error('خطأ في حفظ ملف XML:', error);
            hideLoading();
            alert('حدث خطأ في حفظ ملف البيانات XML');
        }
    } catch (error) {
        console.error('خطأ في تصدير البيانات:', error);
        hideLoading();
        alert('حدث خطأ أثناء تصدير البيانات');
    }
}

// حفظ ملف PDF
async function savePDFFile(dirHandle, fileName, data) {
    try {
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(data);
        await writable.close();
    } catch (error) {
        console.error('خطأ في حفظ ملف PDF:', error, fileName);
        throw error;
    }
}

// استيراد البيانات من ملف XML
async function importDataFromXML() {
    try {
        showLoading('جاري استيراد البيانات والملفات...');
        
        // اختيار المجلد الذي يحتوي على data.xml
        let dirHandle;
        try {
            dirHandle = await window.showDirectoryPicker({
                id: 'educational-materials'
            });
        } catch (error) {
            console.error('خطأ في اختيار المجلد:', error);
            hideLoading();
            alert('يرجى اختيار المجلد الذي يحتوي على ملفات البيانات');
            return;
        }

        // التحقق من وجود ملف data.xml
        let xmlFileHandle;
        try {
            xmlFileHandle = await dirHandle.getFileHandle('data.xml');
        } catch (error) {
            console.error('خطأ: الملف data.xml غير موجود في المجلد المحدد:', error);
            hideLoading();
            alert('الملف data.xml غير موجود في المجلد المحدد');
            return;
        }

        // التحقق من وجود مجلد sample-pdfs
        let pdfsDirHandle;
        try {
            pdfsDirHandle = await dirHandle.getDirectoryHandle('sample-pdfs');
        } catch (error) {
            console.error('خطأ: مجلد sample-pdfs غير موجود:', error);
            hideLoading();
            alert('مجلد sample-pdfs غير موجود في المجلد المحدد');
            return;
        }

        // قراءة ملف XML
        const file = await xmlFileHandle.getFile();
        const xmlText = await file.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        // مسح قواعد البيانات الحالية
        await clearStore(MATERIALS_STORE);
        await clearStore(BOOKS_STORE);
        await clearStore(FILES_STORE);

        // استيراد المذكرات
        const materialNodes = xmlDoc.querySelectorAll('materials > material');
        for (const materialNode of materialNodes) {
            const id = materialNode.getAttribute('id');
            const getField = (fieldName) => {
                const field = materialNode.querySelector(fieldName);
                return field ? field.textContent : '';
            };

            const material = {
                id: id,
                name: getField('name'),
                school: getField('school'),
                teacher: getField('teacher'),
                grade: getField('grade'),
                sides: getField('sides'),
                price: getField('price'),
                fileName: '',
                fileId: id,
                dateAdded: new Date().toISOString()
            };

            // استيراد ملف PDF المرتبط
            const fileName = getField('file');
            if (fileName) {
                material.fileName = fileName.split('_').slice(1).join('_'); // إزالة معرف الملف من اسم الملف
                
                try {
                    const fileData = await readPDFFile(pdfsDirHandle, fileName);
                    await storeFileData(id, material.fileName, fileData);
                } catch (error) {
                    console.error('خطأ في استيراد ملف PDF للمذكرة:', error);
                }
            }

            await addItem(MATERIALS_STORE, material);
        }

        // استيراد الكتب
        const bookNodes = xmlDoc.querySelectorAll('books > book');
        for (const bookNode of bookNodes) {
            const id = bookNode.getAttribute('id');
            const getField = (fieldName) => {
                const field = bookNode.querySelector(fieldName);
                return field ? field.textContent : '';
            };

            const book = {
                id: id,
                name: getField('name'),
                grade: getField('grade'),
                price: getField('price'),
                fileName: '',
                fileId: id,
                dateAdded: new Date().toISOString()
            };

            // استيراد ملف PDF المرتبط
            const fileName = getField('file');
            if (fileName) {
                book.fileName = fileName.split('_').slice(1).join('_'); // إزالة معرف الملف من اسم الملف
                
                try {
                    const fileData = await readPDFFile(pdfsDirHandle, fileName);
                    await storeFileData(id, book.fileName, fileData);
                } catch (error) {
                    console.error('خطأ في استيراد ملف PDF للكتاب:', error);
                }
            }

            await addItem(BOOKS_STORE, book);
        }

        hideLoading();
        alert('تم استيراد البيانات بنجاح');
        
        // إعادة تحميل الصفحة لعرض البيانات المستوردة
        await loadSavedItems();
    } catch (error) {
        console.error('خطأ في استيراد البيانات:', error);
        hideLoading();
        alert('حدث خطأ أثناء استيراد البيانات');
    }
}

// قراءة ملف PDF
async function readPDFFile(dirHandle, fileName) {
    try {
        const fileHandle = await dirHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        return await file.arrayBuffer();
    } catch (error) {
        console.error('خطأ في قراءة ملف PDF:', error, fileName);
        throw error;
    }
}

// تخزين بيانات الملف في IndexedDB
async function storeFileData(id, fileName, data) {
    const fileData = {
        id: id,
        name: fileName,
        type: 'application/pdf',
        data: data
    };
    
    await addItem(FILES_STORE, fileData);
}

// مسح مخزن في IndexedDB
function clearStore(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => {
            resolve();
        };
        
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// تصدير البيانات كملف واحد (ZIP)
async function exportDataAsZip() {
    try {
        showLoading('جاري تصدير البيانات والملفات...');
        
        // تحميل مكتبة JSZip إذا لم تكن محملة بالفعل
        if (typeof JSZip === 'undefined') {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        }
        
        // جلب البيانات من IndexedDB
        const materials = await getAllItems(MATERIALS_STORE);
        const books = await getAllItems(BOOKS_STORE);
        
        // إنشاء XML
        const xmlDoc = document.implementation.createDocument(null, 'data', null);
        const root = xmlDoc.documentElement;
        
        // إنشاء JSZip
        const zip = new JSZip();
        
        // إنشاء مجلد sample-pdfs
        const pdfFolder = zip.folder('sample-pdfs');
        
        // إضافة قسم المذكرات
        const materialsElem = xmlDoc.createElement('materials');
        root.appendChild(materialsElem);
        
        for (const material of materials) {
            const materialElem = xmlDoc.createElement('material');
            materialElem.setAttribute('id', material.id);
            
            // إضافة حقول المذكرة
            const addField = (name, value) => {
                const elem = xmlDoc.createElement(name);
                elem.textContent = value || '';
                materialElem.appendChild(elem);
            };
            
            addField('name', material.name);
            addField('school', material.school);
            addField('teacher', material.teacher);
            addField('grade', material.grade);
            addField('sides', material.sides);
            addField('price', material.price);
            
            // حفظ الملف PDF
            if (material.fileId) {
                const fileData = await getFile(material.fileId);
                if (fileData) {
                    const fileName = `${material.id}_${material.fileName}`;
                    addField('file', fileName);
                    
                    // إضافة PDF إلى ملف الـ ZIP
                    pdfFolder.file(fileName, fileData.data);
                }
            }
            
            materialsElem.appendChild(materialElem);
        }
        
        // إضافة قسم الكتب
        const booksElem = xmlDoc.createElement('books');
        root.appendChild(booksElem);
        
        for (const book of books) {
            const bookElem = xmlDoc.createElement('book');
            bookElem.setAttribute('id', book.id);
            
            // إضافة حقول الكتاب
            const addField = (name, value) => {
                const elem = xmlDoc.createElement(name);
                elem.textContent = value || '';
                bookElem.appendChild(elem);
            };
            
            addField('name', book.name);
            addField('grade', book.grade);
            addField('price', book.price);
            
            // حفظ الملف PDF
            if (book.fileId) {
                const fileData = await getFile(book.fileId);
                if (fileData) {
                    const fileName = `${book.id}_${book.fileName}`;
                    addField('file', fileName);
                    
                    // إضافة PDF إلى ملف الـ ZIP
                    pdfFolder.file(fileName, fileData.data);
                }
            }
            
            booksElem.appendChild(bookElem);
        }
        
        // تحويل XML إلى نص
        const serializer = new XMLSerializer();
        const xmlString = serializer.serializeToString(xmlDoc);
        
        // إضافة ملف XML إلى ZIP
        zip.file('data.xml', xmlString);
        
        // إنشاء ملف ZIP
        const content = await zip.generateAsync({ type: 'blob' });
        
        // تنزيل الملف
        downloadBlob(content, 'educational-materials.zip');
        
        hideLoading();
    } catch (error) {
        console.error('خطأ في تصدير البيانات:', error);
        hideLoading();
        alert('حدث خطأ أثناء تصدير البيانات');
    }
}

// استيراد البيانات من ملف ZIP
async function importDataFromZip() {
    try {
        // تحميل مكتبة JSZip إذا لم تكن محملة بالفعل
        if (typeof JSZip === 'undefined') {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        }
        
        // إنشاء عنصر إدخال ملف مؤقت
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.zip';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        // إنشاء promise للانتظار حتى يتم اختيار ملف
        const filePromise = new Promise((resolve, reject) => {
            fileInput.onchange = () => {
                if (fileInput.files.length > 0) {
                    resolve(fileInput.files[0]);
                } else {
                    reject(new Error('لم يتم اختيار ملف'));
                }
            };
            
            // إلغاء إذا تم النقر خارج مربع الملفات
            setTimeout(() => {
                if (fileInput.files.length === 0) {
                    reject(new Error('تم إلغاء اختيار الملف'));
                }
            }, 100000); // 100 ثانية كحد أقصى
        });
        
        // فتح مربع حوار اختيار الملف
        fileInput.click();
        
        // انتظار اختيار الملف
        const file = await filePromise;
        
        showLoading('جاري استيراد البيانات والملفات...');
        
        // قراءة ملف ZIP
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);
        
        // التحقق من وجود ملف data.xml
        if (!zipContent.files['data.xml']) {
            throw new Error('الملف غير صالح: data.xml غير موجود');
        }
        
        // قراءة ملف XML
        const xmlContent = await zipContent.files['data.xml'].async('text');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
        
        // مسح قواعد البيانات الحالية
        await clearStore(MATERIALS_STORE);
        await clearStore(BOOKS_STORE);
        await clearStore(FILES_STORE);
        
        // استيراد المذكرات
        const materialNodes = xmlDoc.querySelectorAll('materials > material');
        for (const materialNode of materialNodes) {
            const id = materialNode.getAttribute('id');
            const getField = (fieldName) => {
                const field = materialNode.querySelector(fieldName);
                return field ? field.textContent : '';
            };
            
            const material = {
                id: id,
                name: getField('name'),
                school: getField('school'),
                teacher: getField('teacher'),
                grade: getField('grade'),
                sides: getField('sides'),
                price: getField('price'),
                fileName: '',
                fileId: id,
                dateAdded: new Date().toISOString()
            };
            
            // استيراد ملف PDF المرتبط
            const fileName = getField('file');
            if (fileName) {
                material.fileName = fileName.split('_').slice(1).join('_'); // إزالة معرف الملف من اسم الملف
                
                try {
                    // قراءة ملف PDF من الأرشيف
                    const pdfPath = `sample-pdfs/${fileName}`;
                    if (zipContent.files[pdfPath]) {
                        const pdfData = await zipContent.files[pdfPath].async('arraybuffer');
                        await storeFileData(id, material.fileName, pdfData);
                    }
                } catch (error) {
                    console.error('خطأ في استيراد ملف PDF للمذكرة:', error);
                }
            }
            
            await addItem(MATERIALS_STORE, material);
        }
        
        // استيراد الكتب
        const bookNodes = xmlDoc.querySelectorAll('books > book');
        for (const bookNode of bookNodes) {
            const id = bookNode.getAttribute('id');
            const getField = (fieldName) => {
                const field = bookNode.querySelector(fieldName);
                return field ? field.textContent : '';
            };
            
            const book = {
                id: id,
                name: getField('name'),
                grade: getField('grade'),
                price: getField('price'),
                fileName: '',
                fileId: id,
                dateAdded: new Date().toISOString()
            };
            
            // استيراد ملف PDF المرتبط
            const fileName = getField('file');
            if (fileName) {
                book.fileName = fileName.split('_').slice(1).join('_'); // إزالة معرف الملف من اسم الملف
                
                try {
                    // قراءة ملف PDF من الأرشيف
                    const pdfPath = `sample-pdfs/${fileName}`;
                    if (zipContent.files[pdfPath]) {
                        const pdfData = await zipContent.files[pdfPath].async('arraybuffer');
                        await storeFileData(id, book.fileName, pdfData);
                    }
                } catch (error) {
                    console.error('خطأ في استيراد ملف PDF للكتاب:', error);
                }
            }
            
            await addItem(BOOKS_STORE, book);
        }
        
        // حذف عنصر الإدخال المؤقت
        document.body.removeChild(fileInput);
        
        hideLoading();
        alert('تم استيراد البيانات بنجاح');
        
        // إعادة تحميل الصفحة لعرض البيانات المستوردة
        await loadSavedItems();
    } catch (error) {
        console.error('خطأ في استيراد البيانات:', error);
        hideLoading();
        if (error.message === 'تم إلغاء اختيار الملف') {
            // لا شيء - تم إلغاء العملية من قبل المستخدم
        } else {
            alert('حدث خطأ أثناء استيراد البيانات: ' + error.message);
        }
    }
}

// تنزيل ملف كـ blob
function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// تحميل سكريبت خارجي
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// تخزين بيانات الملف في IndexedDB
async function storeFileData(id, fileName, data) {
    const fileData = {
        id: id,
        name: fileName,
        type: 'application/pdf',
        data: data
    };
    
    await addItem(FILES_STORE, fileData);
}