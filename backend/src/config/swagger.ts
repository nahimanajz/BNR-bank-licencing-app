import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BNR Bank Licensing Portal API',
      version: '1.0.0',
      description:
        'REST API for managing bank licensing applications submitted to the National Bank of Rwanda (BNR). Supports multi-role workflows: Applicant → Reviewer → Approver.',
      contact: {
        name: 'BNR Portal Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from POST /auth/login',
        },
      },
      schemas: {
        // ── Enums ──────────────────────────────────────────────────────────
        UserRole: {
          type: 'string',
          enum: ['APPLICANT', 'REVIEWER', 'APPROVER'],
          example: 'APPLICANT',
        },
        ApplicationStatus: {
          type: 'string',
          enum: [
            'DRAFT',
            'SUBMITTED',
            'UNDER_REVIEW',
            'CLARIFICATION_REQUESTED',
            'RESUBMITTED',
            'DECISION_PENDING',
            'APPROVED',
            'REJECTED',
          ],
          example: 'DRAFT',
        },

        // ── Auth ───────────────────────────────────────────────────────────
        SignupRequest: {
          type: 'object',
          required: ['email', 'password', 'role'],
          properties: {
            email: { type: 'string', format: 'email', example: 'alice@bank.rw' },
            password: { type: 'string', minLength: 8, example: 'Secret123!' },
            full_name: { type: 'string', example: 'Alice Mutoni' },
            role: { $ref: '#/components/schemas/UserRole' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'alice@bank.rw' },
            password: { type: 'string', example: 'Secret123!' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              description: 'Flat object — token + user fields merged at the top level',
              properties: {
                id: { type: 'integer', example: 1 },
                email: { type: 'string', format: 'email', example: 'alice@bank.rw' },
                full_name: { type: 'string', example: 'Alice Mutoni' },
                role: { $ref: '#/components/schemas/UserRole' },
                token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
              },
            },
          },
        },

        // ── User ───────────────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email', example: 'alice@bank.rw' },
            full_name: { type: 'string', example: 'Alice Mutoni' },
            role: { $ref: '#/components/schemas/UserRole' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },

        // ── Application ────────────────────────────────────────────────────
        Application: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            applicant_id: { type: 'integer', example: 1 },
            institution_name: { type: 'string', example: 'Rwanda Savings Bank' },
            status: { $ref: '#/components/schemas/ApplicationStatus' },
            current_reviewer_id: { type: 'integer', nullable: true, example: null },
            current_approver_id: { type: 'integer', nullable: true, example: null },
            reviewer_feedback: { type: 'string', nullable: true, example: null },
            decision_notes: { type: 'string', nullable: true, example: null },
            version: { type: 'integer', example: 1 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateApplicationRequest: {
          type: 'object',
          required: ['institution_name'],
          properties: {
            institution_name: { type: 'string', example: 'Rwanda Savings Bank' },
          },
        },
        TransitionRequest: {
          type: 'object',
          required: ['newStatus', 'version'],
          properties: {
            newStatus: { $ref: '#/components/schemas/ApplicationStatus' },
            version: {
              type: 'integer',
              description: 'Current version for optimistic concurrency control',
              example: 1,
            },
          },
        },
        DecideRequest: {
          type: 'object',
          required: ['decision', 'notes', 'version'],
          properties: {
            decision: {
              type: 'string',
              enum: ['APPROVE', 'REJECT'],
              example: 'APPROVE',
            },
            notes: { type: 'string', example: 'All requirements met.' },
            version: { type: 'integer', example: 1 },
          },
        },
        FeedbackRequest: {
          type: 'object',
          required: ['feedback', 'version'],
          properties: {
            feedback: {
              type: 'string',
              example: 'Please provide the board resolution document.',
            },
            version: { type: 'integer', example: 1 },
          },
        },

        // ── Document ───────────────────────────────────────────────────────
        Document: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            application_id: { type: 'integer', example: 1 },
            filename: { type: 'string', example: 'v1_1715000000000_board_resolution.pdf', description: 'Internal storage filename' },
            original_name: { type: 'string', example: 'board_resolution.pdf', description: 'Original filename from the upload' },
            file_size: { type: 'integer', example: 204800, description: 'File size in bytes' },
            mime_type: { type: 'string', nullable: true, example: 'application/pdf' },
            uploader_id: { type: 'integer', example: 1 },
            version: { type: 'integer', example: 1, description: 'Upload version for this application' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },

        // ── Audit Log ──────────────────────────────────────────────────────
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            application_id: { type: 'integer', example: 1 },
            user_id: { type: 'integer', example: 2 },
            action: { type: 'string', example: 'APPROVED' },
            before_state: { $ref: '#/components/schemas/ApplicationStatus' },
            after_state: { $ref: '#/components/schemas/ApplicationStatus' },
            details: {
              type: 'object',
              example: { notes: 'All requirements met.' },
            },
            created_at: { type: 'string', format: 'date-time' },
          },
        },

        // ── Shared response wrappers ───────────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Something went wrong' },
          },
        },
      },

      responses: {
        Unauthorized: {
          description: 'Missing or invalid JWT token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'No token provided' },
            },
          },
        },
        Forbidden: {
          description: 'Authenticated but not permitted for this action',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Forbidden' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Application not found' },
            },
          },
        },
        Conflict: {
          description: 'Stale version — resource was updated concurrently',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Application was updated by another user' },
            },
          },
        },
        ValidationError: {
          description: 'Invalid request body',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: '"institution_name" is required' },
            },
          },
        },
        InternalError: {
          description: 'Unexpected server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Internal server error' },
            },
          },
        },
      },
    },

    // ── Path definitions ─────────────────────────────────────────────────
    paths: {
      // ── Health ────────────────────────────────────────────────────────
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          description: 'Returns 200 when the server is up and reachable.',
          responses: {
            200: {
              description: 'Server is running',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Server is running' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ── Auth ──────────────────────────────────────────────────────────
      '/auth/signup': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SignupRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'User created — returns token and user profile',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            400: { $ref: '#/components/responses/ValidationError' },
            409: {
              description: 'Email already registered',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: { success: false, message: 'Email already in use' },
                },
              },
            },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Authenticate and obtain a JWT',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful — returns token and user profile',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            400: { $ref: '#/components/responses/ValidationError' },
            401: {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: { success: false, message: 'Invalid email or password' },
                },
              },
            },
          },
        },
      },
      // ── Applications ──────────────────────────────────────────────────
      '/applications': {
        get: {
          tags: ['Applications'],
          summary: 'List applications',
          description:
            'APPLICANTs see only their own applications. REVIEWERs and APPROVERs see all.',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Array of applications',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Application' },
                      },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
        post: {
          tags: ['Applications'],
          summary: 'Create a new application (APPLICANT only)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateApplicationRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'Application created with status DRAFT',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Application' },
                    },
                  },
                },
              },
            },
            400: { $ref: '#/components/responses/ValidationError' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },
      '/applications/{id}': {
        get: {
          tags: ['Applications'],
          summary: 'Get application by ID',
          description: 'APPLICANTs can only view their own applications.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              example: 1,
            },
          ],
          responses: {
            200: {
              description: 'Application detail',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Application' },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/applications/{id}/transition': {
        patch: {
          tags: ['Applications'],
          summary: 'Transition application state',
          description:
            'Moves an application to a new state. Allowed transitions depend on the caller\'s role (see state machine). Sends the current `version` to prevent concurrent updates.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              example: 1,
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TransitionRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Application updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Application' },
                    },
                  },
                },
              },
            },
            400: { $ref: '#/components/responses/ValidationError' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
            409: { $ref: '#/components/responses/Conflict' },
          },
        },
      },
      '/applications/{id}/decide': {
        patch: {
          tags: ['Applications'],
          summary: 'Approve or reject an application (APPROVER only)',
          description:
            'Application must be in DECISION_PENDING state. The approver cannot be the same user who reviewed the application.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              example: 1,
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DecideRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Decision recorded — status becomes APPROVED or REJECTED',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Application' },
                    },
                  },
                },
              },
            },
            400: { $ref: '#/components/responses/ValidationError' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/applications/{id}/feedback': {
        patch: {
          tags: ['Applications'],
          summary: 'Request clarification from applicant (REVIEWER only)',
          description:
            'Moves the application to CLARIFICATION_REQUESTED and stores the reviewer feedback message.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              example: 1,
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FeedbackRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Feedback stored — status becomes CLARIFICATION_REQUESTED',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Application' },
                    },
                  },
                },
              },
            },
            400: { $ref: '#/components/responses/ValidationError' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },

      // ── Documents ─────────────────────────────────────────────────────
      '/applications/{id}/documents': {
        get: {
          tags: ['Documents'],
          summary: 'List documents for an application',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              example: 1,
            },
          ],
          responses: {
            200: {
              description: 'Array of documents',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Document' },
                      },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        post: {
          tags: ['Documents'],
          summary: 'Upload a document for an application (APPLICANT only)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              example: 1,
            },
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: {
                    file: {
                      type: 'string',
                      format: 'binary',
                      description: 'PDF, PNG, or JPG — max 10 MB',
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Document uploaded',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Document' },
                    },
                  },
                },
              },
            },
            400: { $ref: '#/components/responses/ValidationError' },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
      },

      // ── Audit ─────────────────────────────────────────────────────────
      '/audit/applications/{id}': {
        get: {
          tags: ['Audit'],
          summary: 'Get audit trail for an application (REVIEWER or APPROVER)',
          description: 'Returns all state-change events for an application ordered by time ascending. Accessible to REVIEWER and APPROVER roles.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              example: 1,
            },
          ],
          responses: {
            200: {
              description: 'Array of audit log entries',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/AuditLog' },
                      },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
