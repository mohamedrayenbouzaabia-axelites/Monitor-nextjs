# Demo Password Override Feature

## Overview
This feature provides a demo interface that allows overriding the admin password without requiring the current password verification. This is specifically designed for demonstration purposes only.

## Components Created

### 1. Backend Endpoint
- **File**: `backend/routes/api.py`
- **Endpoint**: `POST /api/auth/demo-override-password`
- **Description**: Allows password override without old password verification
- **Security**: This endpoint is marked as demo-only with clear warnings

### 2. Frontend Component
- **File**: `frontend/components/admin/DemoPasswordOverride.tsx`
- **Features**:
  - Modal interface with warning about demo mode
  - Password validation (minimum 6 characters)
  - Password confirmation matching
  - Loading states and error handling
  - Auto-close on success

### 3. Admin Dashboard Integration
- **File**: `frontend/pages/admin/index.tsx`
- **Changes**:
  - Added "Demo Override" button in the admin header
  - Integrated the modal component
  - Added proper state management

## How to Use

1. **Access the Admin Dashboard**
   - Navigate to the admin dashboard after logging in
   - Look for the orange "Demo Override" button in the top-right header

2. **Open Demo Override Modal**
   - Click the "Demo Override" button
   - A modal will appear with a clear warning about demo mode

3. **Override Password**
   - Enter the new password (minimum 6 characters)
   - Confirm the password
   - Click "Override Password" button
   - The password will be updated without requiring the current password

## Security Considerations

⚠️ **WARNING**: This feature is designed for demonstration purposes only. In a production environment:
- Remove or disable this feature
- Use proper authentication and authorization
- Implement proper password policies
- Add audit logging for password changes

## API Response Examples

### Success Response
```json
{
  "success": true,
  "message": "Password successfully overridden for demo purposes"
}
```

### Error Response
```json
{
  "error": "Password must be at least 6 characters long"
}
```

## Technical Details

### Backend Implementation
- Uses the existing `set_admin_password()` method from the Server model
- Bypasses password verification by calling the method directly
- Includes proper error handling and validation

### Frontend Implementation
- React component with TypeScript
- Uses existing authentication context
- Integrates with the current UI/UX patterns
- Includes loading states and user feedback

## Testing the Feature

To test this feature:

1. Start the backend server
2. Start the frontend development server
3. Login to the admin dashboard
4. Click the "Demo Override" button
5. Try overriding the password with different scenarios:
   - Valid passwords (6+ characters)
   - Short passwords (should show error)
   - Non-matching confirmations (should show error)

## Files Modified

1. `backend/routes/api.py` - Added demo override endpoint
2. `frontend/pages/admin/index.tsx` - Added button and modal integration
3. `frontend/components/admin/DemoPasswordOverride.tsx` - New component created

This feature is now ready for demonstration purposes.