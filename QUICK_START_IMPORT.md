# Quick Start: Import Initial Provider Data

## 🚀 Quick Steps

### 1. Sign In as Admin
```
1. Open the CityHealth platform
2. Sign in with your admin account
3. Verify you have admin role
```

### 2. Open Import Tool
```
Open in browser: import-providers.html
```

### 3. Upload CSV File
```
Option A: Drag and drop initial-providers.csv onto the drop zone
Option B: Click the drop zone and browse to select the file
```

### 4. Review and Import
```
1. Check file information (name, size, row count)
2. Click "Import Providers" button
3. Confirm the import action
4. Wait for completion (usually < 10 seconds for 100 providers)
```

### 5. Verify Results
```
✅ Check success count
✅ Review any errors
✅ Go to Admin Dashboard
✅ Verify provider count increased
✅ Test search functionality
```

## 📋 What Gets Imported

The `initial-providers.csv` file contains **101 verified healthcare providers**:

- 🏥 **20 Clinics** - Various specialties
- 🏥 **10 Hospitals** - General and specialized
- 👨‍⚕️ **50 Doctors** - Various specialties  
- 💊 **15 Pharmacies** - Distributed across city
- 🔬 **6 Laboratories** - Diagnostic services

## ✨ Automatic Configuration

All imported providers are automatically set with:
- ✅ **verified: true** - Pre-verified by admin
- ✅ **claimed: false** - Available for claiming
- ✅ **preloaded: true** - Marked as preloaded data
- 📍 **Location data** - Coordinates in Sidi Bel Abbès
- ⭐ **Ratings** - Between 4.2 and 4.9

## 🧪 Testing (Optional)

Before importing production data, test the system:

```
1. Open: test-import.html
2. Click "Run All Tests"
3. Verify all tests pass
4. Test data is automatically cleaned up
```

## 📝 CSV Format

If you want to create your own CSV:

```csv
name,type,phone,specialty,address,city,wilaya,latitude,longitude,accessibility,homevisits,available24_7,rating
Your Clinic,clinic,+213...,General Medicine,Street Address,Sidi Bel Abbès,Sidi Bel Abbès,35.19,0.64,true,false,false,4.5
```

**Required:** name, type  
**Optional:** All other fields

**Valid Types:** clinic, hospital, doctor, pharmacy, lab

## ⚠️ Important Notes

- Only administrators can import data
- Import is permanent (no undo)
- Providers are immediately searchable
- Real providers can claim preloaded profiles
- All imports are logged for audit

## 🆘 Troubleshooting

**Problem:** Import button is disabled  
**Solution:** Make sure you've selected a CSV file

**Problem:** "Only admins can import" error  
**Solution:** Sign in with an admin account

**Problem:** Some providers failed to import  
**Solution:** Check error messages, fix CSV, re-import failed rows

**Problem:** Imported providers don't appear in search  
**Solution:** Refresh the page, check Firestore indexes

## 📚 Full Documentation

For detailed information, see:
- `INITIAL_DATA_IMPORT_GUIDE.md` - Complete guide
- `TASK_20.4_INITIAL_DATA_SUMMARY.md` - Implementation details

## ✅ Success Checklist

After import, verify:
- [ ] Import completed with success message
- [ ] Provider count increased in admin dashboard
- [ ] Providers appear in search results
- [ ] Provider profiles display correctly
- [ ] Claim button appears on preloaded profiles
- [ ] All provider types are represented
- [ ] Geographic data displays on maps

## 🎯 Next Steps

After importing initial data:
1. ✅ Test search and filter functionality
2. ✅ Verify provider profiles display correctly
3. ✅ Enable profile claiming for providers
4. ✅ Monitor claim requests
5. ✅ Launch platform to public

---

**Need Help?** Check the full guide: `INITIAL_DATA_IMPORT_GUIDE.md`
