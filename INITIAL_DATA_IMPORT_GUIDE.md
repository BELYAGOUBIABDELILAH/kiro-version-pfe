# Initial Provider Data Import Guide

This guide explains how to preload the CityHealth platform with initial verified provider data.

## Overview

The platform includes a bulk import tool that allows administrators to load initial provider data from a CSV file. This is useful for:
- Launching the platform with existing healthcare provider data
- Creating verified profiles that real providers can claim
- Populating the platform with comprehensive healthcare directory information

## Files Included

1. **initial-providers.csv** - Sample CSV file with 100 verified healthcare providers in Sidi Bel Abbès
2. **import-providers.html** - Web interface for uploading and importing CSV data
3. **INITIAL_DATA_IMPORT_GUIDE.md** - This guide

## CSV File Format

### Required Fields
- `name` - Provider name (e.g., "Clinique El Amel")
- `type` - Provider type: clinic, hospital, doctor, pharmacy, or lab

### Optional Fields
- `phone` - Contact phone number (e.g., "+213 48 54 12 34")
- `specialty` - Medical specialty (e.g., "Cardiology", "General Medicine")
- `address` - Street address
- `city` - City name (default: "Sidi Bel Abbès")
- `wilaya` - Province/state (default: "Sidi Bel Abbès")
- `latitude` - Geographic latitude (e.g., 35.1908)
- `longitude` - Geographic longitude (e.g., 0.6388)
- `accessibility` - Wheelchair accessible: true/false or 1/0
- `homevisits` - Offers home visits: true/false or 1/0
- `available24_7` - Available 24/7: true/false or 1/0
- `rating` - Initial rating (0-5, e.g., 4.5)

### Example CSV Format

```csv
name,type,phone,specialty,address,city,wilaya,latitude,longitude,accessibility,homevisits,available24_7,rating
Clinique El Amel,clinic,+213 48 54 12 34,General Medicine,Rue de la République,Sidi Bel Abbès,Sidi Bel Abbès,35.1908,0.6388,true,false,false,4.5
Hôpital Dahmani,hospital,+213 48 54 23 45,Emergency,Boulevard de la Liberté,Sidi Bel Abbès,Sidi Bel Abbès,35.1925,0.6402,true,false,true,4.8
Dr. Benali Mohammed,doctor,+213 48 54 34 56,Cardiology,Avenue Pasteur,Sidi Bel Abbès,Sidi Bel Abbès,35.1890,0.6375,false,true,false,4.3
```

## Import Process

### Step 1: Prepare Your CSV File

1. Use the provided `initial-providers.csv` as a template
2. Edit the file to add your provider data
3. Ensure all required fields (name, type) are present
4. Validate provider types are one of: clinic, hospital, doctor, pharmacy, lab
5. Save the file with UTF-8 encoding

### Step 2: Sign In as Administrator

1. Open the CityHealth platform
2. Sign in with an administrator account
3. Ensure you have admin role permissions

### Step 3: Access the Import Tool

1. Open `import-providers.html` in your browser
2. Or navigate to it from the admin dashboard
3. The page will verify your admin credentials

### Step 4: Upload CSV File

1. **Drag and drop** your CSV file onto the drop zone, OR
2. **Click** the drop zone to browse and select your file
3. Review the file information displayed:
   - File name
   - File size
   - Number of providers to import

### Step 5: Import Data

1. Click the **"Import Providers"** button
2. Confirm the import action
3. Wait for the import process to complete
4. Review the import results:
   - Number of successfully imported providers
   - Any errors encountered during import

### Step 6: Verify Import

1. Go to the Admin Dashboard
2. Check the total provider count
3. Browse the provider list to verify data
4. Test search functionality with imported providers

## Import Behavior

### Automatic Settings

All imported providers are automatically configured with:
- ✅ **verified: true** - Marked as verified by admin
- ✅ **claimed: false** - Available for claiming by real providers
- ✅ **preloaded: true** - Flagged as preloaded data
- 📅 **createdAt** - Set to import timestamp
- 👤 **createdBy** - Set to admin user ID

### Validation Rules

The import process validates:
- Required fields are present
- Provider type is valid (clinic, hospital, doctor, pharmacy, lab)
- Data types are correct (numbers for coordinates, booleans for flags)
- CSV format is properly structured

### Error Handling

If errors occur during import:
- Successfully imported providers are saved
- Failed rows are reported with error details
- Row numbers are provided for easy correction
- You can fix errors and re-import failed rows

### Performance

- Batch operations are used for optimal performance
- Maximum 500 providers per batch
- Large imports are automatically chunked
- Progress is displayed during import

## Post-Import Tasks

### 1. Verify Data Quality

- Check provider profiles for accuracy
- Verify contact information
- Confirm geographic coordinates
- Test search and filter functionality

### 2. Enable Profile Claiming

Imported profiles are automatically claimable:
- Real providers can search for their practice
- They can submit a claim request with documentation
- Admins review and approve claims
- Ownership transfers to the provider upon approval

### 3. Monitor Platform Usage

- Track which profiles are being viewed
- Monitor claim requests
- Update provider information as needed
- Add missing details to profiles

## Troubleshooting

### Import Fails Completely

**Problem:** Import button doesn't work or shows error immediately

**Solutions:**
- Verify you're signed in as an administrator
- Check browser console for JavaScript errors
- Ensure Firebase is properly configured
- Verify network connectivity

### Some Providers Fail to Import

**Problem:** Import completes but shows errors for some rows

**Solutions:**
- Review error messages for specific row numbers
- Check CSV formatting (commas, quotes, line breaks)
- Verify required fields are present
- Ensure provider types are valid
- Fix errors and re-import failed rows

### CSV File Not Recognized

**Problem:** File upload doesn't work or shows "invalid file" error

**Solutions:**
- Ensure file has .csv extension
- Save file with UTF-8 encoding
- Check for special characters in data
- Verify CSV structure matches template

### Duplicate Providers

**Problem:** Same provider appears multiple times

**Solutions:**
- Remove duplicate rows from CSV before import
- Use admin dashboard to delete duplicate entries
- Merge duplicate profiles if needed

## Sample Data

The included `initial-providers.csv` contains 100 sample providers:
- 20 Clinics (various specialties)
- 10 Hospitals (general and specialized)
- 50 Doctors (various specialties)
- 15 Pharmacies (distributed across city)
- 5 Laboratories (diagnostic services)

All sample data is for Sidi Bel Abbès, Algeria with:
- Realistic phone numbers
- Geographic coordinates within the city
- Mix of accessibility features
- Varied specialties and services
- Ratings between 4.2 and 4.9

## Security Considerations

### Admin-Only Access

- Only users with admin role can import data
- Authentication is verified before import
- All imports are logged with admin ID
- Audit trail is maintained

### Data Validation

- Input sanitization prevents injection attacks
- File size limits prevent abuse
- CSV parsing is secure
- Firestore security rules enforce permissions

### Audit Trail

All imports are logged with:
- Admin user ID
- Timestamp
- Number of providers imported
- Success/error counts
- Can be reviewed in admin logs collection

## Best Practices

### Before Import

1. ✅ Backup existing data if any
2. ✅ Validate CSV file format
3. ✅ Test with small sample first
4. ✅ Review provider types and specialties
5. ✅ Verify geographic coordinates

### During Import

1. ✅ Monitor progress indicators
2. ✅ Don't close browser during import
3. ✅ Wait for completion confirmation
4. ✅ Review error messages if any

### After Import

1. ✅ Verify import results
2. ✅ Test search functionality
3. ✅ Check provider profiles
4. ✅ Enable profile claiming
5. ✅ Monitor for claim requests

## Support

For issues or questions:
1. Check browser console for errors
2. Review Firebase logs
3. Verify admin permissions
4. Check CSV file format
5. Test with sample data first

## Requirements Reference

This implementation satisfies the following requirements:
- **15.1** - Bulk import provider data capability
- **15.2** - Create profiles marked as preloaded
- **15.3** - Mark preloaded profiles as claimable
- **15.4** - Validate imported data for required fields
- **15.5** - Update status when preloaded profile is claimed

## Next Steps

After importing initial data:
1. Configure profile claiming workflow
2. Set up verification process for claims
3. Enable provider registration
4. Launch platform to public
5. Monitor and maintain data quality
