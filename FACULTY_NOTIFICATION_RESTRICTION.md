# Faculty Notification Restriction Implementation

## Overview
This implementation ensures that unapproved faculty members can only send notifications to administrators. The changes include both backend validation and frontend UI updates to enforce this restriction.

## Changes Made

### Backend Changes

#### 1. Notification Controller (`backend/controllers/notifications.js`)
- **File**: `backend/controllers/notifications.js`
- **Change**: Added faculty approval check in the `sendNotification` function
- **Details**: 
  - Before processing any notification, the system now checks if the faculty's account is approved
  - For unapproved faculty, only allows sending to individual administrators
  - Validates that all recipients are administrators for unapproved faculty
  - Returns a 403 status with a clear error message if the restriction is violated
  - Error message: "Unapproved faculty can only send notifications to administrators. Please contact an administrator for approval."

#### 2. Notification Routes (`backend/routes/notifications.js`)
- **File**: `backend/routes/notifications.js`
- **Change**: Added `getAllAdmins` route for faculty to access admin list
- **Details**:
  - Added `getAllAdmins` function import
  - Added route `/api/notifications/admins` accessible by faculty
  - Allows faculty to get the list of administrators for notification targeting

#### 3. Admin Controller (`backend/controllers/admin.js`)
- **File**: `backend/controllers/admin.js`
- **Change**: Added `getAllAdmins` function
- **Details**:
  - Created function to fetch all admin users with their details
  - Formats admin data for frontend consumption
  - Includes user ID mapping for notification targeting

### Frontend Changes

#### 1. SendNotificationModal Component (`frontend/src/components/SendNotificationModal.js`)
- **File**: `frontend/src/components/SendNotificationModal.js`
- **Changes**:
  - Added warning alert for unapproved faculty
  - Restricted recipient type options for unapproved faculty
  - Added admin selection interface for unapproved faculty
  - Updated recipient count display for admin selection
  - Added automatic recipient type setting for unapproved faculty

#### 2. Notification Service (`frontend/src/services/notificationService.js`)
- **File**: `frontend/src/services/notificationService.js`
- **Change**: Added `getAllAdmins` method
- **Details**:
  - Added method to fetch all administrators from the backend
  - Uses the new `/api/notifications/admins` endpoint
  - Handles errors appropriately

## User Experience

### For Unapproved Faculty:
1. **Warning Banner**: A prominent warning banner appears at the top of the notification modal
2. **Restricted Options**: Only "Administrators Only" option is available in recipient type dropdown
3. **Admin Selection**: A dedicated admin selection interface allows choosing specific administrators
4. **Clear Messaging**: All UI elements clearly indicate the restriction and guide the user
5. **Automatic Setup**: Recipient type is automatically set to "individual" for admin selection

### For Approved Faculty:
- No changes to existing functionality
- All notification features work as before

### For Administrators:
- No changes to existing functionality
- Can still send notifications to any recipients

## Security Features

### Backend Validation:
- **Server-side Check**: Faculty approval status is verified on the server before processing notifications
- **Recipient Validation**: Ensures unapproved faculty can only send to administrators
- **Clear Error Messages**: Provides helpful error messages without exposing sensitive information

### Frontend Validation:
- **UI Restrictions**: Prevents unapproved faculty from selecting inappropriate recipient types
- **Client-side Checks**: Validates form data before submission
- **User Guidance**: Clear messaging helps users understand restrictions

## API Endpoints

### New Endpoints:
- `GET /api/notifications/admins` - Get all administrators (faculty access)
- Enhanced `POST /api/notifications/send` - Now includes faculty approval validation

### Modified Endpoints:
- `POST /api/notifications/send` - Added faculty approval check

## Database Schema
The implementation uses the existing `approved` field in the Faculty model:
```javascript
{
  approved: { type: Boolean, default: false }
}
```

## Error Handling

### Backend Errors:
- **403 Forbidden**: When unapproved faculty tries to send to non-admin recipients
- **400 Bad Request**: When no valid recipients are found
- **404 Not Found**: When sender or recipients are not found

### Frontend Errors:
- **User-friendly Messages**: Clear error messages displayed in the UI
- **Form Validation**: Prevents submission of invalid data
- **Loading States**: Proper loading indicators during API calls

## Testing Scenarios

### Test Cases:
1. **Unapproved Faculty**: Should only be able to send notifications to administrators
2. **Approved Faculty**: Should have full notification functionality
3. **Administrators**: Should have no restrictions
4. **Error Handling**: Should display appropriate error messages
5. **UI Restrictions**: Should prevent inappropriate selections

## Files Modified
1. `backend/controllers/notifications.js` - Added approval check and getAllAdmins function
2. `backend/routes/notifications.js` - Added admin route
3. `backend/controllers/admin.js` - Added getAllAdmins function
4. `frontend/src/components/SendNotificationModal.js` - Updated UI for restrictions
5. `frontend/src/services/notificationService.js` - Added getAllAdmins method

## Example Usage

### Unapproved Faculty Flow:
1. Faculty opens notification modal
2. Warning banner appears explaining restriction
3. Recipient type is automatically set to "Administrators Only"
4. Faculty selects specific administrators from dropdown
5. Faculty composes and sends notification
6. Backend validates faculty approval and recipient types
7. Notification is sent only to selected administrators

### Error Handling Example:
```javascript
// Backend response for unapproved faculty trying to send to students
{
  "success": false,
  "message": "Unapproved faculty can only send notifications to administrators. Please contact an administrator for approval."
}
```

## Security Considerations
- Backend validation ensures that even if frontend restrictions are bypassed, unapproved faculty cannot send inappropriate notifications
- Clear error messages help faculty understand why their notification was rejected
- No sensitive information is exposed in error messages
- Proper authorization checks on all endpoints

## Future Enhancements
- Add notification templates for common admin communication scenarios
- Implement notification approval workflow for unapproved faculty
- Add notification history tracking for audit purposes
- Consider adding notification categories specific to admin communication 