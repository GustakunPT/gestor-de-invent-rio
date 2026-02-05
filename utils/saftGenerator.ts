import { Sale, Product, Customer, Tenant, AppSettings } from '../types';

// SAFT-PT 1.04 XML Generator Utility

// Helper to format dates for SAFT (YYYY-MM-DD)
const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
};

// Helper to format date times for SAFT (YYYY-MM-DDThh:mm:ss)
const formatDateTime = (date: Date | string): string => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('.')[0];
};

// Map tax rate to SAFT Code
const getTaxCode = (rate: number): 'NOR' | 'INT' | 'RED' | 'ISE' => {
    if (rate >= 23) return 'NOR';
    if (rate >= 13) return 'INT';
    if (rate >= 6) return 'RED';
    return 'ISE'; // Isento
};

// Escape special XML characters
const escapeXml = (unsafe: string): string => {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
                return c;
        }
    });
};

interface SaftData {
    company: Tenant;
    sales: Sale[];
    products: Product[];
    customers: Customer[];
    startDate: Date;
    endDate: Date;
    fiscalYear: number;
}

export const generateSaftXml = (data: SaftData): string => {
    const { company, sales, products, customers, startDate, endDate, fiscalYear } = data;

    // Filter sales for the period
    const periodSales = sales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate >= startDate && saleDate <= endDate && s.status === 'COMPLETED';
    });

    const totalDebit = 0; // Usually 0 for invoicing SAFT unless there are corrections
    const totalCredit = periodSales.reduce((acc, s) => acc + s.totalAmount, 0);

    // 1. HEADER
    const header = `
  <Header>
    <AuditFileVersion>1.04_01</AuditFileVersion>
    <CompanyID>${escapeXml(company.nif || '999999990')}</CompanyID>
    <TaxRegistrationNumber>${escapeXml(company.nif || '999999990')}</TaxRegistrationNumber>
    <TaxAccountingBasis>F</TaxAccountingBasis>
    <CompanyName>${escapeXml(company.name)}</CompanyName>
    <BusinessName>${escapeXml(company.name)}</BusinessName>
    <CompanyAddress>
      <AddressDetail>${escapeXml(company.address || 'Desconhecido')}</AddressDetail>
      <City>${escapeXml(company.city || 'Lisboa')}</City>
      <PostalCode>${escapeXml(company.postalCode || '1000-000')}</PostalCode>
      <Country>PT</Country>
    </CompanyAddress>
    <FiscalYear>${fiscalYear}</FiscalYear>
    <StartDate>${formatDate(startDate)}</StartDate>
    <EndDate>${formatDate(endDate)}</EndDate>
    <CurrencyCode>EUR</CurrencyCode>
    <DateCreated>${formatDate(new Date())}</DateCreated>
    <TaxEntity>Global</TaxEntity>
    <ProductCompanyTaxID>${escapeXml(company.nif || '999999990')}</ProductCompanyTaxID>
    <SoftwareCertificateNumber>0000</SoftwareCertificateNumber>
    <ProductID>GestorInventario/1.0</ProductID>
    <ProductVersion>1.0.0</ProductVersion>
  </Header>`;

    // 2. MASTER FILES

    // Customers
    const customerXml = customers.map(c => `
    <Customer>
      <CustomerID>${escapeXml(c.id)}</CustomerID>
      <AccountID>21111</AccountID>
      <CustomerTaxID>${escapeXml(c.nif || '999999990')}</CustomerTaxID>
      <CompanyName>${escapeXml(c.name)}</CompanyName>
      <BillingAddress>
        <AddressDetail>${escapeXml(c.address)}</AddressDetail>
        <City>Lisboa</City>
        <PostalCode>${escapeXml(c.postalCode || '1000-000')}</PostalCode>
        <Country>PT</Country>
      </BillingAddress>
      <SelfBillingIndicator>0</SelfBillingIndicator>
    </Customer>
  `).join('');

    // Products
    const productXml = products.map(p => `
    <Product>
      <ProductType>P</ProductType>
      <ProductCode>${escapeXml(p.id)}</ProductCode>
      <ProductGroup>${escapeXml(p.category || 'Geral')}</ProductGroup>
      <ProductDescription>${escapeXml(p.name)}</ProductDescription>
      <ProductNumberCode>${escapeXml(p.sku || p.id)}</ProductNumberCode>
    </Product>
  `).join('');

    // Tax Table (Simplified - implies we use these rates)
    const taxTableXml = `
    <TaxTable>
      <TaxTableEntry>
        <TaxType>IVA</TaxType>
        <TaxCountryRegion>PT</TaxCountryRegion>
        <TaxCode>NOR</TaxCode>
        <Description>Taxa Normal</Description>
        <TaxPercentage>23.00</TaxPercentage>
      </TaxTableEntry>
      <TaxTableEntry>
        <TaxType>IVA</TaxType>
        <TaxCountryRegion>PT</TaxCountryRegion>
        <TaxCode>INT</TaxCode>
        <Description>Taxa Intermédia</Description>
        <TaxPercentage>13.00</TaxPercentage>
      </TaxTableEntry>
      <TaxTableEntry>
        <TaxType>IVA</TaxType>
        <TaxCountryRegion>PT</TaxCountryRegion>
        <TaxCode>RED</TaxCode>
        <Description>Taxa Reduzida</Description>
        <TaxPercentage>6.00</TaxPercentage>
      </TaxTableEntry>
      <TaxTableEntry>
        <TaxType>IVA</TaxType>
        <TaxCountryRegion>PT</TaxCountryRegion>
        <TaxCode>ISE</TaxCode>
        <Description>Isento</Description>
        <TaxPercentage>0.00</TaxPercentage>
      </TaxTableEntry>
    </TaxTable>
  `;

    // 3. SOURCE DOCUMENTS (SalesInvoices)

    // Totals
    const numberOfEntries = periodSales.length;

    const invoicesXml = periodSales.map(sale => {
        // Determine Invoice Type (Simplified logic)
        // FS = Fatura Simplificada (Used for consumer sales mostly)
        // FT = Fatura (Standard invoice)
        const invoiceType = sale.customerNif ? 'FT' : 'FS';
        const invoiceNo = `FT ${invoiceType}/${fiscalYear}/${sale.id.substring(0, 8)}`; // Just a generation rule

        const linesXml = sale.items.map((item, index) => {
            // Calculate individual line tax
            // Assuming product tax isn't stored in line item yet, we default to setting's standard (23%) 
            // or try to find it. For now using 23 as fallback if not present.
            const taxRate = 23;
            const taxCode = getTaxCode(taxRate);

            return `
      <Line>
        <LineNumber>${index + 1}</LineNumber>
        <ProductCode>${escapeXml(item.productId)}</ProductCode>
        <ProductDescription>${escapeXml(item.productName)}</ProductDescription>
        <Quantity>${item.quantity}</Quantity>
        <UnitOfMeasure>Unid</UnitOfMeasure>
        <UnitPrice>${item.unitPrice.toFixed(2)}</UnitPrice>
        <TaxPointDate>${formatDate(sale.date)}</TaxPointDate>
        <description>${escapeXml(item.productName)}</description>
        <CreditAmount>${(item.quantity * item.unitPrice).toFixed(2)}</CreditAmount>
        <Tax>
          <TaxType>IVA</TaxType>
          <TaxCountryRegion>PT</TaxCountryRegion>
          <TaxCode>${taxCode}</TaxCode>
          <TaxPercentage>${taxRate.toFixed(2)}</TaxPercentage>
        </Tax>
      </Line>`;
        }).join('');

        return `
    <Invoice>
      <InvoiceNo>${invoiceNo}</InvoiceNo>
      <DocumentStatus>
        <InvoiceStatus>N</InvoiceStatus>
        <InvoiceStatusDate>${formatDateTime(sale.date)}</InvoiceStatusDate>
        <SourceID>${currentUserID(sale.userId)}</SourceID>
        <SourceBilling>P</SourceBilling>
      </DocumentStatus>
      <Hash>0</Hash> {/* Hash generation requires private key signature, impossible in frontend-only mock */}
      <HashControl>0</HashControl>
      <Period>${String(new Date(sale.date).getMonth() + 1)}</Period>
      <InvoiceDate>${formatDate(sale.date)}</InvoiceDate>
      <InvoiceType>${invoiceType}</InvoiceType>
      <SpecialRegimes>
        <SelfBillingIndicator>0</SelfBillingIndicator>
        <CashVATSchemeIndicator>0</CashVATSchemeIndicator>
        <ThirdPartiesBillingIndicator>0</ThirdPartiesBillingIndicator>
      </SpecialRegimes>
      <SourceID>${currentUserID(sale.userId)}</SourceID>
      <SystemEntryDate>${formatDateTime(sale.date)}</SystemEntryDate>
      <CustomerID>${escapeXml(sale.customerName ? sale.customerName : 'Consumidor Final')}</CustomerID>
      ${linesXml}
      <DocumentTotals>
        <TaxPayable>${sale.taxAmount.toFixed(2)}</TaxPayable>
        <NetTotal>${(sale.totalAmount - sale.taxAmount).toFixed(2)}</NetTotal>
        <GrossTotal>${sale.totalAmount.toFixed(2)}</GrossTotal>
      </DocumentTotals>
    </Invoice>
    `;
    }).join('');

    const salesInvoices = `
  <SalesInvoices>
    <NumberOfEntries>${numberOfEntries}</NumberOfEntries>
    <TotalDebit>${totalDebit.toFixed(2)}</TotalDebit>
    <TotalCredit>${totalCredit.toFixed(2)}</TotalCredit>
    ${invoicesXml}
  </SalesInvoices>
  `;

    // Final Assembly
    return `<?xml version="1.0" encoding="Windows-1252"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:PT_1.04_01" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  ${header}
  <MasterFiles>
    ${customerXml}
    ${productXml}
    ${taxTableXml}
  </MasterFiles>
  <SourceDocuments>
    ${salesInvoices}
  </SourceDocuments>
</AuditFile>`;
};

// Helper to get consistent user ID format
const currentUserID = (id: string | undefined) => id || 'Sistema';
