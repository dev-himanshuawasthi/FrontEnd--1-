# Excel Attachment Functionality - Testing Steps

## Quick Test Steps:

### 1. **Start the Dev Server**
```bash
npm run dev
```

### 2. **Open Browser DevTools**
- Press **F12** or Right-click → Inspect
- Go to **Console** tab
- Clear any existing logs (click the trash icon)

### 3. **Perform the Action**
- Navigate to a chat page
- Click the **Paperclip icon** to attach a file
- Select any **Excel file** (.xlsx, .xls, or CSV)
- Verify **filename appears** in the message box
- Type a **test message** like "Analyze this data"
- Click **Send button**

### 4. **Check Console Logs**
Look for these logs (in this order):
```
[Composer] Submitting with file: <filename>
[ChatPage] handleSend called with file: <filename>  
[useDify] Calling sendMessage with file: <filename>
[sendMessage] Received file: [object File]
[sendMessage] Parsing Excel file: <filename>
[parseExcelFile] Starting parse for file: <filename>
[parseExcelFile] File read successfully
[parseExcelFile] Workbook loaded, sheets: [...]
[parseExcelFile] Parse complete...
```

## Report Format:

When reporting back, please share:

1. **File attachment UI** - Does the filename badge appear?
2. **Console logs** - Which logs appear? Which are missing?
3. **Network tab** - Open DevTools → Network tab
   - Re-do steps 3-4
   - Look for any failed requests
   - Check the request body sent to API
4. **Error messages** - Any red errors in console?
5. **Chat response** - Does Dify respond at all?

## Possible Issues & Solutions:

| Issue | Check | Solution |
|-------|-------|----------|
| File not showing in UI | Step 3 | Click paperclip, select file, should show filename |
| No console logs at all | Step 4 | Check if console is open, refresh page |
| Logs stop at [Composer] | File prop might not pass | Check browser console for errors |
| Logs stop at [parseExcelFile] | File to FileReader issue | Browser might block FileReader |
| Logs complete but no response | API/Network issue | Check Network tab in DevTools |
| Good response but AI didn't use data | Prompt issue | Check if formatted data is in request |

## Quick Fixes:

**If file doesn't show:**
- Delete and re-add the file
- Try different file (CSV, XLSX, XLS)
- Refresh the page

**If still no logs:**
- Make sure DevTools console is open BEFORE sending
- Check if using dark mode/different browser
- Try in incognito/private window

**If logs appear but fail:**
- Check file is valid Excel/CSV
- File size check (in console: `file.size`)
- Check browser FileReader API compatibility

