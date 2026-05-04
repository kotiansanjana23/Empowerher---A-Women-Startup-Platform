# Visionista Platform API Documentation

## 📋 Overview

This document outlines the planned API structure for the Visionista platform backend integration. The API will support the frontend components with secure, scalable endpoints for user management, mentorship matching, funding applications, and training resources.

## 🔐 Authentication

### JWT Token Structure
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: 'entrepreneur' | 'mentor' | 'investor' | 'admin';
  permissions: string[];
  exp: number;
  iat: number;
}
```

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 👥 User Management

### POST /api/auth/register
Register a new user account.

**Request Body:**
```typescript
interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'entrepreneur' | 'mentor';
  companyName?: string;
  industry?: string;
}
```

**Response:**
```typescript
interface RegisterResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  token: string;
}
```

### POST /api/auth/login
Authenticate user credentials.

**Request Body:**
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Response:**
```typescript
interface LoginResponse {
  success: boolean;
  user: UserProfile;
  token: string;
}
```

### GET /api/users/profile
Get current user profile.

**Response:**
```typescript
interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyName?: string;
  industry?: string;
  bio?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🤝 Mentor Matching

### GET /api/mentors
Get list of available mentors with filtering.

**Query Parameters:**
- `industry`: Filter by industry expertise
- `stage`: Filter by startup stage (seed, series-a, growth, etc.)
- `skills`: Comma-separated list of skills
- `availability`: Filter by availability status
- `page`: Pagination page number
- `limit`: Number of results per page

**Response:**
```typescript
interface MentorsResponse {
  mentors: Mentor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface Mentor {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  industry: string[];
  expertise: string[];
  experience: number;
  rating: number;
  reviewCount: number;
  availability: 'available' | 'busy' | 'unavailable';
  profileImage?: string;
  bio: string;
  specialties: string[];
}
```

### POST /api/mentors/match
Request AI-powered mentor matching.

**Request Body:**
```typescript
interface MatchRequest {
  industry: string;
  stage: string;
  challenges: string[];
  preferredSkills: string[];
  meetingFrequency: 'weekly' | 'biweekly' | 'monthly';
}
```

**Response:**
```typescript
interface MatchResponse {
  matches: {
    mentor: Mentor;
    compatibilityScore: number;
    matchingFactors: string[];
  }[];
  reasoning: string;
}
```

### POST /api/mentors/{mentorId}/connect
Send connection request to a mentor.

**Request Body:**
```typescript
interface ConnectionRequest {
  message: string;
  preferredMeetingTime: string;
  goals: string[];
}
```

---

## 🎯 Pitch Submissions

### GET /api/pitches
Get user's pitch submissions.

**Response:**
```typescript
interface PitchesResponse {
  pitches: Pitch[];
}

interface Pitch {
  id: string;
  title: string;
  description: string;
  industry: string;
  stage: string;
  fundingAmount: number;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  feedback?: PitchFeedback[];
  documents: Document[];
}
```

### POST /api/pitches
Create a new pitch submission.

**Request Body:**
```typescript
interface CreatePitchRequest {
  title: string;
  description: string;
  industry: string;
  stage: string;
  fundingAmount: number;
  businessModel: string;
  marketSize: string;
  competition: string;
  teamInfo: string;
}
```

### PUT /api/pitches/{pitchId}
Update an existing pitch.

### DELETE /api/pitches/{pitchId}
Delete a pitch submission.

### POST /api/pitches/{pitchId}/documents
Upload documents for a pitch.

**Form Data:**
- `file`: Pitch deck PDF or document
- `type`: 'pitch_deck' | 'business_plan' | 'financial_model' | 'other'
- `description`: Optional description

---

## 💰 Funding Opportunities

### GET /api/funding
Get available funding opportunities.

**Query Parameters:**
- `type`: 'grant' | 'investment' | 'government' | 'competition'
- `stage`: Startup stage filter
- `industry`: Industry filter
- `minAmount`: Minimum funding amount
- `maxAmount`: Maximum funding amount
- `location`: Geographic filter
- `deadline`: Filter by application deadline

**Response:**
```typescript
interface FundingResponse {
  opportunities: FundingOpportunity[];
  pagination: PaginationInfo;
}

interface FundingOpportunity {
  id: string;
  title: string;
  organization: string;
  type: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  currency: string;
  deadline: string;
  eligibility: string[];
  requirements: string[];
  applicationUrl?: string;
  contactInfo?: ContactInfo;
  tags: string[];
}
```

### POST /api/funding/{opportunityId}/apply
Apply for a funding opportunity.

**Request Body:**
```typescript
interface FundingApplication {
  pitchId: string;
  coverLetter: string;
  requestedAmount: number;
  additionalDocuments?: string[];
  customFields?: Record<string, any>;
}
```

### GET /api/funding/applications
Get user's funding applications.

**Response:**
```typescript
interface ApplicationsResponse {
  applications: FundingApplication[];
}

interface FundingApplication {
  id: string;
  opportunity: FundingOpportunity;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'pending_documents';
  submittedAt: string;
  lastUpdated: string;
  requestedAmount: number;
  progress: number;
  nextSteps?: string[];
  feedback?: string;
}
```

---

## 🎓 Training Platform

### GET /api/courses
Get available training courses.

**Query Parameters:**
- `category`: Course category filter
- `level`: 'beginner' | 'intermediate' | 'advanced'
- `duration`: Course duration filter
- `instructor`: Filter by instructor
- `enrolled`: Show only enrolled courses (boolean)

**Response:**
```typescript
interface CoursesResponse {
  courses: Course[];
  categories: string[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  instructor: Instructor;
  rating: number;
  reviewCount: number;
  enrollmentCount: number;
  price: number;
  currency: string;
  modules: CourseModule[];
  prerequisites?: string[];
  learningOutcomes: string[];
  certificateOffered: boolean;
}
```

### POST /api/courses/{courseId}/enroll
Enroll in a training course.

### GET /api/courses/{courseId}/progress
Get course progress for enrolled user.

**Response:**
```typescript
interface CourseProgress {
  courseId: string;
  enrolledAt: string;
  progress: number;
  completedModules: string[];
  currentModule?: string;
  timeSpent: number;
  certificateEarned?: boolean;
  lastAccessed: string;
}
```

### GET /api/webinars
Get upcoming webinars and live sessions.

**Response:**
```typescript
interface WebinarsResponse {
  upcoming: Webinar[];
  past: Webinar[];
}

interface Webinar {
  id: string;
  title: string;
  description: string;
  speaker: Speaker;
  scheduledAt: string;
  duration: number;
  maxAttendees?: number;
  registrationCount: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  registrationUrl?: string;
  meetingUrl?: string;
  recording?: string;
  tags: string[];
}
```

---

## 📊 Analytics & Insights

### GET /api/analytics/dashboard
Get dashboard analytics data.

**Response:**
```typescript
interface DashboardAnalytics {
  userStats: {
    totalMentorConnections: number;
    activePitches: number;
    fundingApplications: number;
    coursesCompleted: number;
    coursesInProgress: number;
  };
  recentActivity: Activity[];
  upcomingDeadlines: Deadline[];
  recommendations: Recommendation[];
  monthlyProgress: ProgressData[];
}
```

### GET /api/analytics/funding-trends
Get funding market trends and insights.

### GET /api/analytics/industry-insights
Get industry-specific insights and benchmarks.

---

## 🔔 Notifications

### GET /api/notifications
Get user notifications.

**Query Parameters:**
- `unread`: Filter unread notifications (boolean)
- `type`: Notification type filter
- `limit`: Number of notifications to return

**Response:**
```typescript
interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

interface Notification {
  id: string;
  type: 'mentor_response' | 'funding_update' | 'course_reminder' | 'deadline_alert';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}
```

### PUT /api/notifications/{notificationId}/read
Mark notification as read.

### PUT /api/notifications/read-all
Mark all notifications as read.

---

## 🔍 Search

### GET /api/search
Global search across platform content.

**Query Parameters:**
- `q`: Search query
- `type`: 'mentors' | 'courses' | 'funding' | 'resources' | 'all'
- `filters`: Additional filters based on type

**Response:**
```typescript
interface SearchResponse {
  results: SearchResult[];
  facets: SearchFacets;
  totalResults: number;
  searchTime: number;
}

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  relevanceScore: number;
  url: string;
  metadata?: Record<string, any>;
}
```

---

## ⚠️ Error Handling

### Standard Error Response
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}
```

### HTTP Status Codes
- `200` - OK
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

### Common Error Codes
- `INVALID_CREDENTIALS` - Login failed
- `USER_NOT_FOUND` - User doesn't exist
- `INSUFFICIENT_PERMISSIONS` - Access denied
- `VALIDATION_ERROR` - Input validation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `RESOURCE_NOT_FOUND` - Requested resource not found
- `DUPLICATE_RESOURCE` - Resource already exists

---

## 🔄 Pagination

### Standard Pagination Response
```typescript
interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### Query Parameters
- `page`: Page number (1-based)
- `limit`: Items per page (max 100)
- `sort`: Sort field
- `order`: 'asc' | 'desc'

---

## 🚀 Rate Limiting

### Limits by Endpoint Category
- **Authentication**: 5 requests per minute
- **User Management**: 30 requests per minute
- **Search**: 60 requests per minute
- **General API**: 100 requests per minute
- **File Uploads**: 10 requests per minute

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1635724800
```

---

## 🔒 Security Considerations

### Input Validation
- All inputs sanitized and validated
- SQL injection prevention
- XSS protection
- File upload restrictions

### Authentication & Authorization
- JWT token expiration (1 hour)
- Refresh token rotation
- Role-based access control
- API key management for external integrations

### Data Protection
- HTTPS only
- Data encryption at rest
- PII data handling compliance
- Audit logging for sensitive operations

---

## 📈 Monitoring & Health

### GET /api/health
Health check endpoint.

**Response:**
```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
    storage: 'up' | 'down';
  };
}
```

### Performance Metrics
- Response time monitoring
- Error rate tracking
- Database performance
- Cache hit rates
- User activity patterns

---

This API documentation provides a comprehensive foundation for the Visionista platform backend development, ensuring scalable, secure, and user-friendly integration with the frontend components.