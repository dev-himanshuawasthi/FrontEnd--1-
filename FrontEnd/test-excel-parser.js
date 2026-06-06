// Quick test to verify xlsx library works
import XLSX from 'xlsx';

console.log("✅ XLSX library imported successfully");

// Create test data
const testData = [
  { Name: 'John', Age: 28, Department: 'Engineering' },
  { Name: 'Jane', Age: 32, Department: 'Sales' },
  { Name: 'Bob', Age: 25, Department: 'Engineering' },
];

// Create workbook
const ws = XLSX.utils.json_to_sheet(testData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'TestData');

// Write to buffer
const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
console.log("✅ Test Excel file created, size:", buffer.length, "bytes");

// Try to read it back
try {
  const workbook = XLSX.read(buffer, { type: 'array' });
  console.log("✅ Excel file read successfully");
  console.log("✅ Sheets found:", workbook.SheetNames);
  
  const csvData = XLSX.utils.sheet_to_csv(workbook.Sheets['TestData']);
  console.log("✅ CSV conversion successful");
  console.log("CSV Data:\n", csvData);
} catch (error) {
  console.error("❌ Error reading Excel file:", error.message);
}

console.log("\n🎉 XLSX library is working correctly!");
