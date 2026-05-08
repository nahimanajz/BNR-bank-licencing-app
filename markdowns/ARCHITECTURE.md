# Architecture Overview: Backend & Frontend Flow

## Backend: Request → Response → Error Flow

### The Clean Architecture Stack

```
┌─────────────────────────────────────────────────────────────┐
│ HTTP Request (POST /api/applications/:id/approve)           │
│ Headers: { Authorization: Bearer {token} }                  │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ app.js                                                       │
│ - Express setup, CORS, JSON parser                          │
│ - NO business logic here                                    │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ routes/index.js → routes/applications.js                    │
│ - Define endpoints                                          │
│ - Register middleware                                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Middleware Stack (executed in order):                       │
│ 1. authMiddleware        → verify JWT, attach req.user      │
│    throws AuthenticationError if token invalid              │
│ 2. requireRole('APPROVER') → check req.user.role            │
│    throws AuthorizationError if wrong role                  │
│ 3. Route handler calls controller                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ ApplicationController.approve(req, res, next)               │
│ try {                                                       │
│   - Extract params: req.params.id, req.body.notes          │
│   - Call service: this.applicationService.approve()        │
│   - On success: res.json({ data: app, message: '...' })    │
│ } catch (error) {                                           │
│   - next(error) → passes to errorHandler middleware        │
│ }                                                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
              ┌──────────┴──────────┐
              ↓                     ↓
         SUCCESS CASE          ERROR CASE
              ↓                     ↓
    ApplicationService      Service throws:
    - Validate approver     - AuthorizationError
      ≠ reviewer            - InvalidTransitionError
    - Check state machine   - ValidationError
    - Call repository       - etc.
    - Log audit trail       ↓
    - Return app            caught by controller
              ↓              ↓
         Repository      next(error)
         .findById()         ↓
         .update()      errorHandler middleware
              ↓              ↓
         Database       res.status(403).json({
         (Sequelize)      error: '...',
              ↓            statusCode: 403
         models/index.js  })
              ↓
         Data returned      ↓
              │         HTTP Response
              └────────────┬────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ HTTP Response (200 or error status)                         │
│                                                              │
│ Success: { data: {...}, message: '...' }                   │
│ Error:   { error: '...', statusCode: 403 }                 │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend (axios)                                             │
│ - Interceptor attaches Authorization header                │
│ - Minimal error handling (just normalize structure)         │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Hook (useApproveApplication)                               │
│ - useMutation captures response                             │
│ - onError: handle { status, message, data }               │
│ - Can redirect on 401, show toast, etc.                   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Component (StateTransitionButton)                           │
│ - Catches error from hook                                  │
│ - Displays to user: "You cannot approve this"              │
│ - Updates UI state (loading, error, success)               │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### 1. **Models** (`models/Application.js`, `models/index.js`)
- **Only**: Define schema + associations
- **Never**: Business logic, queries

```javascript
// ✅ GOOD
module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define('Application', {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    status: { type: DataTypes.ENUM(...), defaultValue: 'DRAFT' },
    // ...
  });
  return Application;
};

// ❌ BAD
module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define('Application', { /* ... */ });
  
  Application.prototype.approve = async function() {
    // Business logic in model - WRONG
  };
};
```

### 2. **Repository** (`repositories/ApplicationRepository.js`)
- **Only**: Database queries (find, create, update, delete)
- **Never**: Business logic, validation, auth

```javascript
// ✅ GOOD
async findByStatus(status) {
  return this.findAll({ status });
}

async updateWithVersion(id, data, expectedVersion) {
  // Optimistic locking
  const result = await this.model.update(data, {
    where: { id, version: expectedVersion },
  });
  if (result[0] === 0) throw new ConflictError('Version mismatch');
  return this.findById(id);
}

// ❌ BAD
async approve(applicationId, userId, notes) {
  // Business logic in repository - WRONG
  const app = this.findById(applicationId);
  if (app.current_reviewer_id === userId) throw new Error(...);
  app.status = 'APPROVED';
  await app.save();
}
```

### 3. **Service** (`services/ApplicationService.js`)
- **Only**: Business logic, validation, coordination
- **Never**: HTTP handling, direct database access

```javascript
// ✅ GOOD
async approve(applicationId, userId, decisionNotes) {
  // Validate: reviewer ≠ approver
  const app = await this.appRepository.findById(applicationId);
  this.validateApproverNotReviewer(app, userId);
  
  // Validate: state machine
  this.stateMachine.validateTransition(app.status, 'APPROVED', 'APPROVER');
  
  // Execute: update + audit
  const beforeState = app.status;
  await this.appRepository.update(applicationId, { status: 'APPROVED' });
  await this.auditService.logAction({ /* ... */ });
  
  return app;
}

// ❌ BAD
async approve(applicationId, userId, notes) {
  // HTTP handling in service - WRONG
  if (!userId) return res.status(401).json(...);
  
  // Direct DB access in service - WRONG
  const app = await Application.findByPk(applicationId);
}
```

### 4. **Controller** (`controllers/ApplicationController.js`)
- **Only**: Parse request, call service, catch errors, return response
- **Never**: Business logic, direct DB access, validation logic

```javascript
// ✅ GOOD
async approve(req, res, next) {
  try {
    const app = await this.applicationService.approve(
      req.params.id,
      req.user.id,
      req.body.notes
    );
    res.json({ data: app, message: 'Approved' });
  } catch (error) {
    next(error); // Let error handler deal with it
  }
}

// ❌ BAD
async approve(req, res, next) {
  // Validation in controller - WRONG (belongs in service)
  if (!req.body.notes) return res.status(400).json({ error: '...' });
  
  // Auth logic in controller - WRONG (belongs in middleware)
  if (req.user.role !== 'APPROVER') return res.status(403);
  
  // Business logic in controller - WRONG (belongs in service)
  const app = await Application.findByPk(req.params.id);
  if (app.current_reviewer_id === req.user.id) throw new Error(...);
}
```

### 5. **Middleware** (`middlewares/authMiddleware.js`, `middlewares/roleMiddleware.js`)
- **Only**: Check authentication/authorization, pass control or error
- **Never**: Business logic

```javascript
// ✅ GOOD
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new AuthenticationError('No token');
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    throw new AuthenticationError('Invalid token');
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new AuthorizationError('Forbidden');
  }
  next();
};

// ❌ BAD
const authMiddleware = (req, res, next) => {
  // Business logic in middleware - WRONG
  const app = await Application.findByPk(req.params.id);
  if (app.current_reviewer_id !== req.user.id) {
    throw new Error(...);
  }
};
```

### 6. **Route** (`routes/applications.js`)
- **Only**: Define endpoint path, register middleware, call controller
- **Never**: Any logic

```javascript
// ✅ GOOD
router.patch('/:id/approve',
  authMiddleware,
  requireRole('APPROVER'),
  (req, res, next) => controller.approve(req, res, next)
);

// ❌ BAD
router.patch('/:id/approve', async (req, res) => {
  // All logic in route - WRONG
  const app = await Application.findByPk(req.params.id);
  if (app.status !== 'DECISION_PENDING') return res.status(400);
  // ... 100 lines of logic
});
```

---

## Error Flow Example

**Scenario**: Reviewer tries to approve their own review

```javascript
// 1. MIDDLEWARE - authMiddleware
//    ↓ (attaches req.user from JWT)
//    ✅ Token valid
//    ↓

// 2. MIDDLEWARE - requireRole('APPROVER')
//    ✅ User role is APPROVER
//    ↓

// 3. ROUTE HANDLER - calls controller
//    ↓

// 4. CONTROLLER.approve()
//    try {
//      ↓
//    } catch (error) {
//      next(error) // Catches ANY error from service
//    }
//    ↓

// 5. SERVICE.approve() - THROWS ERROR
//    - Fetches app via repository
//    - Checks: app.current_reviewer_id === userId
//    - THROWS: new AuthorizationError('Cannot approve own review')
//    ↓

// 6. ERROR caught by controller try/catch
//    next(error) passes to errorHandler
//    ↓

// 7. ERROR HANDLER MIDDLEWARE
//    if (err instanceof AuthorizationError) {
//      return res.status(403).json({
//        error: 'Cannot approve own review',
//        statusCode: 403,
//      });
//    }
//    ↓

// 8. HTTP RESPONSE
//    Status: 403
//    Body: { error: '...', statusCode: 403 }
//    ↓

// 9. FRONTEND - axios interceptor
//    normalizedError = {
//      status: 403,
//      message: 'Cannot approve own review',
//      data: { /* ... */ },
//    }
//    returns Promise.reject(normalizedError)
//    ↓

// 10. HOOK - useMutation.onError
//    error = { status: 403, message: '...', ... }
//    setError('Cannot approve own review')
//    ↓

// 11. COMPONENT - ErrorAlert
//    Displays: "You cannot approve own review"
```

---

## Frontend: Minimal Axios, Smart Hooks

### Axios Interceptor (Minimal)

```javascript
// ✅ Request Interceptor - ONLY attach JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ Response Interceptor - ONLY normalize error structure
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = {
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
      data: error.response?.data,
    };
    return Promise.reject(normalized);
  }
);
```

### Hook (Handles Errors)

```javascript
// ✅ Hook - HANDLES errors, decides what to do
export const useLogin = () => {
  const router = useRouter();
  const { login } = useAuth();

  return useMutation({
    mutationFn: (creds) => authService.login(creds),
    onSuccess: (data) => {
      login(data);
      router.push('/dashboard'); // Success path
    },
    onError: (error) => {
      // Error from backend: { status, message, data }
      if (error.status === 401) {
        logout();
        router.push('/login'); // 401 path
      }
      if (error.status === 400) {
        setValidationError(error.message); // Validation path
      }
    },
  });
};
```

### Component (Uses Hook)

```javascript
// ✅ Component - USES hook, displays UI
export const LoginForm = () => {
  const { mutate, isPending, error } = useLogin();

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutate({ email, password });
    }}>
      {error && <ErrorAlert message={error.message} />}
      <button disabled={isPending}>
        {isPending ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

---

## Key Rules

| Rule | Why |
|---|---|
| **One responsibility per layer** | Easy to test, easy to modify |
| **Errors thrown in service, caught in controller** | Centralized error handling |
| **Controller catches all errors** | Guarantees error response sent |
| **Middleware only for auth/authz** | Clean separation of concerns |
| **Minimal interceptor** | Error handling lives in hooks |
| **Hooks handle 401/403/etc.** | Components don't know about auth |
| **Component displays, doesn't fetch** | Reusable components |
| **Service validates everything** | No business logic in controller |

---

## Example: Complete Flow (Approve Application)

**Request:**
```javascript
PATCH /api/applications/5/approve
Authorization: Bearer {token}
Content-Type: application/json

{ "notes": "Approved - meets all requirements" }
```

**Backend Flow:**
1. authMiddleware verifies JWT → req.user = { id: 3, role: 'APPROVER' }
2. requireRole('APPROVER') checks role → ✅ pass
3. ApplicationController.approve() called
4. Calls ApplicationService.approve(5, 3, 'Approved...')
5. Service validates: app.reviewer_id (2) ≠ userId (3) → ✅
6. Service checks state: 'DECISION_PENDING' → ✅ valid
7. Service calls ApplicationRepository.update(5, { status: 'APPROVED' })
8. Service calls AuditService.logAction(...)
9. Controller returns: `res.json({ data: {...}, message: '...' })`

**Response:**
```json
200 OK
{
  "data": {
    "id": 5,
    "status": "APPROVED",
    "decision_notes": "Approved - meets all requirements",
    "updated_at": "2025-05-07T15:30:00Z"
  },
  "message": "Application approved"
}
```

**Frontend Flow:**
1. Component calls `mutate({ id: 5, notes: '...' })`
2. Hook calls `applicationService.approveApplication()`
3. Service calls axios: `PATCH /api/applications/5/approve`
4. Axios attaches JWT, sends request
5. Gets 200 response
6. Hook's onSuccess: `queryClient.invalidateQueries()`
7. Component sees new data, renders updated app

---

This is the architecture. Follow it. It scales.
