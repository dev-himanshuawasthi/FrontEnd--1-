import * as XLSX from 'xlsx';

export type ParsedFileData = {
  fileName: string;
  fileType: string;
  rawContent: string;
};

/**
 * Parse any supported file type and extract schema/structure instead of full data
 * For CSV/Excel: Extract headers and infer data types from first few rows
 * For code files: Extract just the file as-is since code structure IS the content
 */
export async function parseFileData(file: File): Promise<ParsedFileData> {
  console.log("[parseFileData] Starting parse for file:", file.name, "size:", file.size, "type:", file.type);
  
  const fileName = file.name;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // Handle CSV files - extract headers and sample structure
  if (ext === 'csv' || file.type === 'text/csv') {
    return parseCSVFile(file);
  }
  
  // Handle Excel files - extract headers and sample structure
  if (['xlsx', 'xls', 'xlsm'].includes(ext) || file.type?.includes('spreadsheet')) {
    return parseExcelFile(file);
  }

  // Handle code files - keep as-is since structure matters
  if (['sql', 'py', 'r', 'js', 'ts', 'java', 'cpp'].includes(ext)) {
    return parseCodeFile(file);
  }

  // Handle text-based files
  if (['txt', 'json', 'csv'].includes(ext) || file.type?.startsWith('text/')) {
    return parseCodeFile(file);
  }

  // Default: try as code/text first, fallback to data file
  try {
    return await parseCodeFile(file);
  } catch {
    return parseExcelFile(file);
  }
}

/**
 * Parse CSV file - extract headers and infer structure
 */
async function parseCSVFile(file: File): Promise<ParsedFileData> {
  console.log("[parseCSVFile] Starting parse for:", file.name);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvContent = event.target?.result as string;
        const lines = csvContent.split('\n').slice(0, 5); // First 5 rows for structure
        console.log("[parseCSVFile] CSV file read, extracted headers and sample", lines.length, "rows");
        
        const schemaContent = `File: ${file.name}
Type: CSV Dataset
Structure:
${lines.join('\n')}

[Additional data rows exist but not included for brevity - AI will generate code based on this structure]`;
        
        resolve({
          fileName: file.name,
          fileType: 'CSV',
          rawContent: schemaContent,
        });
      } catch (error) {
        reject(new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read CSV file'));
    reader.readAsText(file);
  });
}

/**
 * Parse code files - keep full content since structure IS the code
 */
async function parseCodeFile(file: File): Promise<ParsedFileData> {
  console.log("[parseCodeFile] Starting parse for:", file.name);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const textContent = event.target?.result as string;
        
        // Truncate very large files
        const maxLength = 8000;
        const truncated = textContent.length > maxLength 
          ? textContent.substring(0, maxLength) + `\n\n[... truncated ${textContent.length - maxLength} characters ...]`
          : textContent;
        
        console.log("[parseCodeFile] File read, length:", textContent.length);
        resolve({
          fileName: file.name,
          fileType: 'Code',
          rawContent: truncated,
        });
      } catch (error) {
        reject(new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Parse Excel file - extract headers and data types from first few rows
 */
async function parseExcelFile(file: File): Promise<ParsedFileData> {
  console.log("[parseExcelFile] Starting parse for file:", file.name, "size:", file.size);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        console.log("[parseExcelFile] File read successfully");
        const data = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(data, { type: 'array' });
        console.log("[parseExcelFile] Workbook loaded, sheets:", workbook.SheetNames);

        const sheets = workbook.SheetNames.map((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const csvData = XLSX.utils.sheet_to_csv(worksheet);
          const lines = csvData.split('\n').slice(0, 4); // Headers + first 3 rows for structure
          
          console.log(`[parseExcelFile] Extracted sheet '${sheetName}' headers and sample`);

          return {
            name: sheetName,
            structure: lines.join('\n'),
          };
        });

        const schemaContent = sheets
          .map((sheet) => {
            return `Sheet: ${sheet.name}
${'='.repeat(50)}
${sheet.structure}
[Additional rows exist - structure shown above for code generation]`;
          })
          .join('\n\n');

        console.log("[parseExcelFile] Parse complete, schema length:", schemaContent.length);
        resolve({
          fileName: file.name,
          fileType: 'Excel',
          rawContent: schemaContent,
        });
      } catch (error) {
        console.error("[parseExcelFile] Parse error:", error);
        reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      console.error("[parseExcelFile] FileReader error");
      reject(new Error('Failed to read file'));
    };

    console.log("[parseExcelFile] Starting FileReader...");
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Format file data for inclusion in a message to Dify
 */
export function formatFileDataForMessage(fileData: ParsedFileData): string {
  return `[ATTACHED FILE: ${fileData.fileType} - ${fileData.fileName}]

${fileData.rawContent}

[END ATTACHED FILE]`;
}
