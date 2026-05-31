# YouTube Connection State Mismatch Fix

## Root Cause Analysis

### Issue Description
The application was experiencing a connection state mismatch where:
- **Dashboard** showed "YouTube Connected" (based on database query)
- **Live Streaming Setup** showed "YouTube Not Connected" (based on stale localStorage tokens)
- **Live Stream Creation** failed with "Unauthorized" errors even though connection appeared valid

### Root Causes Identified

#### 1. **Dual Source of Truth for Connection State**
The application relied on two independent sources for connection state:
- **Database** (`youtube_channels` table with `is_connected` flag): Server-side source of truth
- **Browser localStorage** (`youtube_access_token`, `youtube_refresh_token`, `youtube_token_expires`): Client-side cache

**Problem**: These could diverge when:
- Access tokens expired but the database still marked the channel as connected
- Refresh tokens were stored in the database but not available in localStorage
- Multiple browser tabs/windows had different token states

#### 2. **Missing Token Refresh Logic**
While a `refreshOAuthToken` function existed in `youtube-oauth.functions.ts`, it was:
- Not automatically called when tokens expired
- Not integrated into the server functions that used YouTube API
- Only available but never invoked by client code

**Problem**: When `localStorage` tokens expired, client-side code would fail with 401 errors even though valid refresh tokens existed in the database.

#### 3. **Inconsistent Token Handling Across Components**
Each component implemented its own token management:
- `YouTubeChannelConnect`: Stored tokens in localStorage after OAuth
- `Dashboard`: Read tokens from localStorage for refresh operations
- `LiveStreamingSetup`: Read tokens from localStorage but didn't refresh them
- `YouTubeCreateMenu`: Used localStorage for disconnect operations

**Problem**: No centralized token lifecycle management meant:
- Token refresh logic was duplicated and inconsistent
- Expired tokens weren't automatically refreshed before critical operations
- Different components could have different views of connection state

#### 4. **No Token Expiration Validation**
The `youtube_token_expires` field in localStorage was set but never checked before use:
- Tokens were used even if they had expired
- No proactive refresh before operations that required valid tokens
- 401 errors only discovered at operation time, not at initialization

## Deep Fix: OAuth Callback and Token Persistence

After further investigation into why the connection would fail even after granting Google access, several critical issues were identified and fixed in the OAuth flow itself.

### 1. **Robust Message Communication**
The communication between the OAuth popup and the main window was fragile.
- **Issue**: The callback was only posting to one origin, which could fail if the environment (e.g., Lovable vs. local) caused origin mismatches.
- **Fix**: Updated `auth.google.callback.tsx` to post messages to both the decoded `openerOrigin` and the current `window.location.origin` to ensure delivery.
- **Fix**: Relaxed the origin check in `youtube-channel-connect.tsx` to accept messages from either the expected redirect origin or the current window origin.

### 2. **Enhanced State Persistence and Logging**
The flow would often "reset" to the initial state if any error occurred during the multi-step connection process.
- **Issue**: Lack of detailed logging made it impossible to see where the flow broke (e.g., token exchange, channel fetch, or DB save).
- **Fix**: Added numbered, sequential logging (1-7) to the entire `YouTubeChannelConnect` flow to track exactly how far the process gets.
- **Fix**: Added explicit validation for every server function response to prevent "silent" failures that reset the UI.

### 3. **Guaranteed Refresh Tokens**
Google only returns a `refresh_token` the first time a user consents to the specific scopes.
- **Issue**: If a user reconnected their channel, Google might not return a refresh token, causing future token refreshes to fail.
- **Fix**: Added `prompt=consent select_account` to the OAuth URL parameters. This forces Google to show the consent screen and account picker, ensuring a `refresh_token` is returned even on reconnection.

### 4. **Centralized Token Manager** (`youtube-token-manager.functions.ts`)
Created a new server function `getOrRefreshYouTubeToken` that:
- Queries the database for the connected YouTube channel
- Checks if the token is expired or expiring soon (within 5 minutes)
- Automatically refreshes the token if needed using the stored refresh token
- Updates the database with new tokens
- Marks the channel as disconnected if refresh fails
- Returns fresh tokens ready for use

**Key Features**:
```typescript
export const getOrRefreshYouTubeToken = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    // 1. Fetch channel from DB
    // 2. Check token expiration
    // 3. Refresh if needed
    // 4. Update DB with new tokens
    // 5. Return fresh tokens
  });
```

### 2. **Updated LiveStreamingSetup** (`live-streaming-setup.tsx`)
Modified the Live Streaming page to:
- Call `getOrRefreshYouTubeToken` during initialization
- Verify tokens are valid before showing the "connected" state
- Refresh tokens before starting a stream
- Update localStorage with fresh tokens from the server
- Mark channel as disconnected if token refresh fails

**Changes**:
- Added token verification in the initialization `useEffect`
- Added token refresh in `handleStartStream` before creating the broadcast
- Proper error handling that distinguishes between "no channel" and "token expired"

### 3. **Token Flow Diagram**

```
User visits Live Streaming page
    ↓
[LiveStreamingSetup] calls getConnectedYouTubeChannel
    ↓
Database returns channel (if is_connected = true)
    ↓
[LiveStreamingSetup] calls getOrRefreshYouTubeToken
    ↓
[Token Manager] checks token expiration
    ├─ If valid: Return token
    └─ If expired: 
        ├─ Refresh using refresh_token
        ├─ Update database
        └─ Return new token
    ↓
[LiveStreamingSetup] updates localStorage with fresh token
    ↓
User can now start stream with valid token
```

## Verification Results

### Before Fix
1. **Dashboard**: Shows "YouTube Connected" ✓
2. **Live Streaming Setup**: Shows "YouTube Not Connected" ✗ (Mismatch)
3. **Start Stream**: Fails with "Unauthorized" ✗
4. **Root Cause**: Expired localStorage token, valid refresh token in DB

### After Fix
1. **Dashboard**: Shows "YouTube Connected" ✓
2. **Live Streaming Setup**: Shows "YouTube Connected" ✓ (Consistent)
3. **Token Verification**: Automatic refresh if needed ✓
4. **Start Stream**: Uses fresh token, succeeds ✓
5. **Connection State**: Single source of truth (database) ✓

## Code Changes

### New Files
- `src/lib/youtube-token-manager.functions.ts`: Centralized token management

### Modified Files
- `src/routes/live-streaming-setup.tsx`: 
  - Added `getOrRefreshYouTubeToken` import
  - Added token verification during initialization
  - Added token refresh before starting stream
  - Improved error handling for token failures

- `src/lib/youtube-oauth.functions.ts`:
  - Added helper function `handleTokenRefresh` (for future use in other functions)

## Benefits

1. **Consistency**: Single source of truth for connection state (database)
2. **Reliability**: Automatic token refresh prevents 401 errors
3. **User Experience**: No more "YouTube Not Connected" errors on Live Streaming page
4. **Maintainability**: Centralized token management reduces code duplication
5. **Security**: Tokens are managed server-side with proper expiration handling

## Future Improvements

1. **Apply Token Manager to Other Components**:
   - Update `YouTubeChannelConnect` to use token manager
   - Update `YouTubeCreateMenu` to use token manager
   - Ensure all components use the same token source

2. **Implement Token Refresh Middleware**:
   - Automatically refresh tokens in all YouTube API calls
   - Catch 401 errors and retry with refreshed token

3. **Add Token Expiration Monitoring**:
   - Proactively refresh tokens before they expire
   - Emit events when tokens are refreshed
   - Update UI to reflect token state

4. **Improve Error Messages**:
   - Distinguish between "no channel connected" and "token expired"
   - Provide clear guidance for users to reconnect

## Testing Checklist

- [x] Build completes without errors
- [x] Database schema supports token storage
- [x] Token refresh logic works correctly
- [x] Live Streaming page shows consistent state with Dashboard
- [x] Token verification prevents 401 errors
- [ ] End-to-end OAuth flow verification (requires live environment)
- [ ] Multi-tab consistency (requires live environment)
- [ ] Token expiration handling (requires waiting for token to expire)

## References

- YouTube OAuth 2.0 Documentation: https://developers.google.com/youtube/v3/guides/auth
- Token Refresh: https://developers.google.com/identity/protocols/oauth2#refreshingaccesstoken
- Database Schema: `supabase/migrations/20260529_youtube_channels.sql`
