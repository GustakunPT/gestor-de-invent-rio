/* 
 * SERVIDOR GOOGLE APPS SCRIPT
 * Copie este código para o ficheiro Code.gs no editor do Google Apps Script
 */

function doGet() {
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('ERP Inventário')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// --- DATABASE CONNECTION ---
function getDb() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    products: ss.getSheetByName('Produtos') || ss.insertSheet('Produtos'),
    users: ss.getSheetByName('Utilizadores') || ss.insertSheet('Utilizadores'),
    sales: ss.getSheetByName('Vendas') || ss.insertSheet('Vendas'),
    customers: ss.getSheetByName('Clientes') || ss.insertSheet('Clientes'),
    suppliers: ss.getSheetByName('Fornecedores') || ss.insertSheet('Fornecedores'),
    history: ss.getSheetByName('Historico') || ss.insertSheet('Historico'),
    purchases: ss.getSheetByName('Compras') || ss.insertSheet('Compras'),
  };
}

// --- HELPER: GENERIC SAVE/DELETE ---

function saveDataToSheet(sheet, id, rowData) {
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  
  // Header check (if empty, add header based on data length logic - simplified here)
  if (data.length === 0) {
     sheet.appendRow(rowData.map((_, i) => `Col ${i+1}`)); // Placeholder headers if new
     data.push([]); // adjust length check
  }

  // Find existing ID in column 0
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex > 0) {
    // Update
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // Create
    sheet.appendRow(rowData);
  }
}

function deleteDataFromSheet(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, message: 'ID not found' };
}


// --- API ENDPOINTS ---

/**
 * Carrega todos os dados iniciais
 */
function getInitialData() {
  const db = getDb();
  
  const sheetToObj = (sheet) => {
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];
    const headers = data[0];
    return data.slice(1).map(row => {
      let obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });
  };

  return {
    products: sheetToObj(db.products),
    users: sheetToObj(db.users),
    customers: sheetToObj(db.customers),
    suppliers: sheetToObj(db.suppliers),
    // Parse JSON fields for Sales and Purchases
    sales: sheetToObj(db.sales).map(s => ({...s, items: s.items ? JSON.parse(s.items) : []})),
    purchaseOrders: sheetToObj(db.purchases).map(p => ({...p, items: p.items ? JSON.parse(p.items) : []})),
    history: sheetToObj(db.history)
  };
}

// --- AUTH ---
function loginUser(id, password) {
  const db = getDb();
  const data = db.users.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    // Col 0: ID, Col 2: Password (adjust based on saveUser order)
    if (String(data[i][0]) === String(id) && String(data[i][2]) === String(password)) {
      const user = {
        id: data[i][0],
        name: data[i][1],
        password: data[i][2],
        role: data[i][3]
      };
      return { success: true, user: user };
    }
  }
  return { success: false, message: 'Credenciais inválidas' };
}

// --- PRODUCTS ---
function saveProduct(product) {
  const db = getDb();
  // Order must match types.ts interface loosely but consistent
  const rowData = [
    product.id, product.sku, product.name, product.category, product.quantity,
    product.minStock, product.maxStock, product.location, product.price, 
    product.costPrice, product.supplierId, product.serialNumber || '', product.batchNumber || '', new Date().toISOString()
  ];
  saveDataToSheet(db.products, product.id, rowData);
  return { success: true };
}

function deleteProduct(id) {
  return deleteDataFromSheet(getDb().products, id);
}

// --- CUSTOMERS ---
function saveCustomer(customer) {
  const db = getDb();
  const rowData = [
    customer.id, customer.name, customer.nif, customer.email, 
    customer.phone, customer.address, customer.postalCode
  ];
  saveDataToSheet(db.customers, customer.id, rowData);
  return { success: true };
}

function deleteCustomer(id) {
  return deleteDataFromSheet(getDb().customers, id);
}

// --- SUPPLIERS ---
function saveSupplier(supplier) {
  const db = getDb();
  const rowData = [
    supplier.id, supplier.name, supplier.email, 
    supplier.phone, supplier.address, supplier.nif
  ];
  saveDataToSheet(db.suppliers, supplier.id, rowData);
  return { success: true };
}

function deleteSupplier(id) {
  return deleteDataFromSheet(getDb().suppliers, id);
}

// --- USERS ---
function saveUser(user) {
  const db = getDb();
  const rowData = [
    user.id, user.name, user.password, user.role
  ];
  saveDataToSheet(db.users, user.id, rowData);
  return { success: true };
}

function deleteUser(id) {
  return deleteDataFromSheet(getDb().users, id);
}

// --- HISTORY ---
function saveHistoryEntry(entry) {
  const db = getDb();
  const rowData = [
    entry.id, entry.userId, entry.userName, entry.productId, 
    entry.productName, entry.action, entry.timestamp, entry.details
  ];
  db.history.appendRow(rowData); // History is append-only
  return { success: true };
}

// --- SALES ---
function saveSale(sale) {
  const db = getDb();
  
  // 1. Save Sale
  const saleRow = [
    sale.id, sale.customerName, sale.customerNif, sale.customerEmail,
    sale.customerPhone, sale.customerAddress, sale.customerPostalCode,
    sale.date, JSON.stringify(sale.items), sale.totalAmount, sale.userId
  ];
  db.sales.appendRow(saleRow);
  
  // 2. Update Stock
  const productData = db.products.getDataRange().getValues();
  sale.items.forEach(item => {
    for (let i = 1; i < productData.length; i++) {
      if (String(productData[i][0]) === String(item.productId)) {
        // Assume quantity is index 4 (check saveProduct order)
        const currentQty = Number(productData[i][4]); 
        const newQty = currentQty - item.quantity;
        db.products.getRange(i + 1, 5).setValue(newQty);
        break;
      }
    }
  });
  
  return { success: true };
}

// --- PURCHASE ORDERS ---
function savePurchaseOrder(po) {
  const db = getDb();
  // id, supplierId, supplierName, date, status, items(json), totalAmount
  const rowData = [
    po.id, po.supplierId, po.supplierName, po.date, 
    po.status, JSON.stringify(po.items), po.totalAmount
  ];
  saveDataToSheet(db.purchases, po.id, rowData);
  return { success: true };
}

function updatePurchaseOrderStatus(id, status) {
  const db = getDb();
  const data = db.purchases.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      // Status is index 4 (check savePurchaseOrder)
      db.purchases.getRange(i + 1, 5).setValue(status);
      return { success: true };
    }
  }
  return { success: false };
}

// --- PDF GENERATION ---
function generateInvoicePDF(sale) {
  try {
    const htmlContent = `
      <html>
      <head>
        <style>
          body { font-family: Helvetica, Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { margin-top: 20px; font-size: 1.2em; font-weight: bold; text-align: right; }
        </style>
      </head>
      <body>
        <h1>Fatura #${sale.id}</h1>
        <div class="header">
          <div>
            <strong>Cliente:</strong> ${sale.customerName}<br>
            <strong>NIF:</strong> ${sale.customerNif || 'N/A'}<br>
            <strong>Data:</strong> ${sale.date}
          </div>
        </div>
        <table>
          <tr><th>Item</th><th>Qtd</th><th>Preço Unit.</th><th>Total</th></tr>
          ${sale.items.map(i => `<tr><td>${i.productName}</td><td>${i.quantity}</td><td>${i.unitPrice}€</td><td>${i.total}€</td></tr>`).join('')}
        </table>
        <div class="total">Total: ${sale.totalAmount}€</div>
      </body>
      </html>
    `;
    
    // Create HTML file blob
    const blob = Utilities.newBlob(htmlContent, MimeType.HTML, `Fatura-${sale.id}.html`);
    
    // Convert to PDF (The trick is creating a file, then getting it as PDF)
    // For simplicity in this demo, we create a PDF in root Drive.
    const pdfFile = DriveApp.createFile(blob.getAs(MimeType.PDF));
    
    // Set public or ensure user has access. For internal ERP, user usually has access.
    // Returning the URL to open in new tab.
    return { success: true, url: pdfFile.getUrl() };
    
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}
