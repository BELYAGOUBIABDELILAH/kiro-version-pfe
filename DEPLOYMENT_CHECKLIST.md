# Firebase Security Rules - Deployment Checklist

## Pre-Deployment Validation ✅

### 1. Rules Files Syntax Check
- [x] `firestore.rules` exists and is properly formatted
- [x] `storage.rules` exists and is properly formatted
- [x] Both files contain `rules_version = '2'`
- [x] Both files have proper service declarations
- [x] Braces are balanced in both files

### 2. Firebase Configuration
- [x] `firebase.json` exists
- [x] Firestore rules path configured: `firestore.rules`
- [x] Storage rules path configured: `storage.rules`
- [x] Firestore indexes configured: `firestore.indexes.json`

### 3. Rules Implementation Verification

#### Firestore Rules
- [x] Providers collection rules (public read, authenticated write)
- [x] Users collection rules (owner read/write, admin read)
- [x] Verifications collection rules (provider create, admin update)
- [x] Ads collection rules (moderation checks, verified providers only)
- [x] Favorites subcollection rules
- [x] Search history subcollection rules
- [x] Helper functions implemented (isAuthenticated, isAdmin, isProvider, isVerifiedProvider, isOwner)

#### Storage Rules
- [x] Provider images rules (public read, owner write)
- [x] Ad images rules (verified provider write)
- [x] Verification documents rules (restricted read)
- [x] User images rules
- [x] File size validation (5MB for images, 10MB for documents)
- [x] File type validation (images only for photos, images/PDFs for documents)

## Deployment Steps

### Step 1: Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```

### Step 3: Initialize Firebase Project (if not already done)
```bash
firebase init
```
Select:
- Firestore
- Storage
- Functions
- Hosting

### Step 4: Test with Firebase Emulator (Recommended)
```bash
firebase emulators:start
```

Access emulator UI at: http://localhost:4000

Test scenarios:
- [ ] Unauthenticated user can read providers
- [ ] Authenticated provider can create profile
- [ ] Provider can upload images
- [ ] Verified provider can create ads
- [ ] Admin can approve verifications
- [ ] Users cannot access other users' data

### Step 5: Deploy Security Rules

#### Deploy All Rules
```bash
firebase deploy --only firestore:rules,storage:rules
```

#### Or Deploy Individually

Deploy Firestore rules only:
```bash
firebase deploy --only firestore:rules
```

Deploy Storage rules only:
```bash
firebase deploy --only storage:rules
```

### Step 6: Verify Deployment

1. Check Firebase Console:
   - Go to Firestore Database > Rules tab
   - Go to Storage > Rules tab
   - Verify rules are active and show correct timestamp

2. Test in production:
   - [ ] Test user registration
   - [ ] Test provider profile creation
   - [ ] Test image upload
   - [ ] Test verification request
   - [ ] Test admin operations

## Post-Deployment Monitoring

### Monitor Access Patterns
1. Go to Firebase Console
2. Navigate to Firestore/Storage
3. Check "Rules" tab for denied requests
4. Review any unexpected denials

### Common Issues to Watch For

#### Issue: Legitimate requests denied
**Symptoms**: Users report errors when performing allowed actions
**Check**: Firebase Console > Rules > Monitor denied requests
**Solution**: Review and adjust rules as needed

#### Issue: Performance degradation
**Symptoms**: Slow database operations
**Check**: Rules using multiple `get()` calls
**Solution**: Consider using custom claims for user roles

#### Issue: Security gaps
**Symptoms**: Unauthorized access to data
**Check**: Review rules for overly permissive patterns
**Solution**: Tighten rules and add validation

## Rollback Procedure

If critical issues are found:

### Option 1: Revert via Console
1. Go to Firebase Console
2. Navigate to Firestore/Storage Rules
3. Click "History" tab
4. Select previous version
5. Click "Restore"

### Option 2: Redeploy Previous Version
```bash
# Checkout previous version from git
git checkout <previous-commit> firestore.rules storage.rules

# Deploy
firebase deploy --only firestore:rules,storage:rules

# Restore current version
git checkout HEAD firestore.rules storage.rules
```

## Security Best Practices

- ✅ Never use `allow read, write: if true` except for truly public data
- ✅ Always validate data types and required fields
- ✅ Use helper functions to keep rules DRY
- ✅ Test rules thoroughly before deployment
- ✅ Monitor denied requests regularly
- ✅ Keep rules version controlled
- ✅ Document any complex rule logic
- ✅ Regular security audits

## Testing Scenarios

### Manual Testing Checklist

#### Authentication & Authorization
- [ ] Unauthenticated users can read public provider data
- [ ] Authenticated users can create their own profiles
- [ ] Users cannot modify other users' data
- [ ] Admins can access all data
- [ ] Role-based access works correctly

#### Provider Operations
- [ ] Providers can create profiles with required fields
- [ ] Providers can update their own profiles
- [ ] Providers cannot change verification status
- [ ] Providers can upload images (under 5MB)
- [ ] Only verified providers can create ads

#### Admin Operations
- [ ] Admins can approve/deny verifications
- [ ] Admins can moderate ads
- [ ] Admins can manage all provider profiles
- [ ] Admin actions are logged

#### File Uploads
- [ ] Image uploads respect size limits (5MB)
- [ ] Only valid image types accepted
- [ ] Verification documents accept PDFs (under 10MB)
- [ ] Users can only upload to their own paths

## Deployment Log

| Date | Version | Deployed By | Changes | Status |
|------|---------|-------------|---------|--------|
| [Date] | 1.0 | [Name] | Initial security rules implementation | ✅ |

## Notes

- Rules are deployed to production Firebase project
- Emulator testing recommended before production deployment
- Monitor Firebase Console for denied requests after deployment
- Keep this checklist updated with any rule changes

## Support

For issues or questions:
- Check Firebase Console for error details
- Review Firebase documentation: https://firebase.google.com/docs/rules
- Contact development team

---

**Status**: Ready for deployment ✅
**Last Updated**: [Current Date]
**Validated By**: Kiro AI Assistant
