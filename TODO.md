# Auth State Fix - Progress Tracker

## Plan Steps:

### 1. Create AuthContext (frontend/contexts/AuthContext.tsx)
- [x] Create file with Context, Provider, useAuth hook
- [x] Uses jwt-decode for user info from token
- [x] Persists to localStorage

### 2. Update layout.tsx
- [x] Wrap children with AuthProvider

### 3. Update Navbar.tsx & SideDrawer.tsx
- [ ] Import/use useAuth
- [ ] Conditional render: logged-in (Profile/Logout) vs guest (Login/Signup)

### 4. Fix login/page.tsx
- [ ] Use useRouter() for redirect

### 5. Fix signup/page.tsx
- [ ] Auto-login after signup success, then redirect home

### 6. Update home page.tsx
- [ ] Show welcome message for logged-in users

### 7. Test & Install deps
- [x] cd frontend && npm i jwt-decode
- [ ] Test full flow

**Current Progress: AuthContext created, jwt-decode installed. Next: Update layout.tsx (step 2)**
