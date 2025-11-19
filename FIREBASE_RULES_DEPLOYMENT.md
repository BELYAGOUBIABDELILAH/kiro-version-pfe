# Firebase Security Rules Deployment Guide

## Overview

This document provides instructions for testing and deploying Firebase Security Rules for the CityHealth Platform.

## Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project initialized
- Authenticated with Firebase (`firebase login`)

## Security Rules Files

### Firestore Rules (`firestore.rules`)

Defines security rules for Firestore collections:
- **Providers collection**: Public read, authenticated provider write with ownership validation
- **Users collection**: Owner read/write, admin read access
- **Verifications collection**: Provider create, admin update
- **Ads collection**: Public read for approved ads, verified provider create, admin moderation

### Storage Rules (`storage.rules`)

Defines security rules for Firebase Storage:
- **Provider images**: Public read, owner write with 5MB limit and image type validation
- **Ad images**: Public read, verified provider write with validation
- **Verification documents**: Restricted read (owner/admin), provider write with 10MB limit
- **User images**: Public read, owner write with validation

## Testing Security Rules

### Option 1: Firebase Emulator (Recommended)

1. Start the Firebase emulators:
```bash
firebase emulators:start
```

2. The emulators will run on:
   - Firestore: http://localhost:8080
   - Storage: http://localhost:9199
   - Emulator UI: http://localhost:4000

3. Test rules using the Emulator UI or by running your application against the emulators.

### Option 2: Firebase Rules Playground

1. Go to Firebase Console
2. Navigate to Firestore Database > Rules
3. Use the "Rules Playground" to test specific scenarios

### Option 3: Manual Testing Checklist

Test the following scenarios:

#### Firestore Rules Tests

**Providers Collection:**
- [ ] Unauthenticated users can read provider profiles
- [ ] Authenticated providers can create their own profiles
- [ ] Providers can update their own profiles
- [ ] Providers cannot change their verification status
- [ ] Admins can update any provider profile
- [ ] Only admins can delete providers

**Users Collection:**
- [ ] Users can read their own profile
- [ ] Users can update their own profile
- [ ] Users cannot change their own role
- [ ] Admins can read any user profile
- [ ] Users cannot read other users' profiles

**Verifications Collection:**
- [ ] Providers can create verification requests
- [ ] Verification requests start with 'pending' status
- [ ] Only admins can update verification status
- [ ] Providers can read their own verification requests
- [ ] Admins can read all verification requests

**Ads Collection:**
- [ ] Only verified providers can create ads
- [ ] Ads start with 'pending' status
- [ ] Only approved ads are publicly readable
- [ ] Only admins can update ad status
- [ ] Admins can read all ads

#### Storage Rules Tests

**Provider Images:**
- [ ] Anyone can read provider images
- [ ] Only the provider owner can upload images
- [ ] Images must be under 5MB
- [ ] Only valid image types are accepted (jpeg, png, webp, gif)

**Ad Images:**
- [ ] Anyone can read ad images
- [ ] Only verified providers can upload ad images
- [ ] Images must be under 5MB
- [ ] Only valid image types are accepted

**Verification Documents:**
- [ ] Only the provider and admins can read verification documents
- [ ] Providers can upload documents under 10MB
- [ ] Accepted types: images and PDFs

## Deploying Security Rules

### Deploy All Rules

Deploy both Firestore and Storage rules:
```bash
firebase deploy --only firestore:rules,storage:rules
```

### Deploy Firestore Rules Only

```bash
firebase deploy --only firestore:rules
```

### Deploy Storage Rules Only

```bash
firebase deploy --only storage:rules
```

## Verification After Deployment

1. Check deployment status in Firebase Console
2. Verify rules are active:
   - Firestore: Console > Firestore Database > Rules
   - Storage: Console > Storage > Rules

3. Test critical paths:
   - User registration and profile creation
   - Provider profile updates
   - Image uploads
   - Verification request submission
   - Admin moderation actions

## Rollback Procedure

If issues are detected after deployment:

1. Revert to previous rules version in Firebase Console
2. Or redeploy previous rules from git history:
```bash
git checkout <previous-commit> firestore.rules storage.rules
firebase deploy --only firestore:rules,storage:rules
```

## Security Best Practices

1. **Never disable security rules** - Always have rules in place
2. **Test before deploying** - Use emulators or staging environment
3. **Monitor access patterns** - Check Firebase Console for denied requests
4. **Regular audits** - Review rules periodically for security gaps
5. **Principle of least privilege** - Grant minimum necessary permissions

## Common Issues and Solutions

### Issue: Rules deployment fails

**Solution**: Check for syntax errors in rules files
```bash
firebase deploy --only firestore:rules --debug
```

### Issue: Legitimate requests are denied

**Solution**: 
1. Check Firebase Console > Firestore/Storage > Rules tab
2. Review denied requests in the monitoring section
3. Adjust rules to allow legitimate access patterns

### Issue: Performance degradation

**Solution**: 
- Minimize `get()` calls in rules (cache user roles in custom claims)
- Use indexes for complex queries
- Consider restructuring data to simplify rules

## Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules Guide](https://firebase.google.com/docs/storage/security)
- [Rules Unit Testing](https://firebase.google.com/docs/rules/unit-tests)

## Contact

For issues or questions about security rules, contact the development team.
