# User Search API Documentation 🔍

## Overview
Simple and fast user search endpoint for finding users by name, email, or partial matches across the system.

## Features ✨
- **Fast Search** - Efficient database queries with proper indexing
- **Multiple Field Search** - Search across name, surname, email, and full name
- **Case Insensitive** - Smart matching regardless of case
- **Partial Matches** - Find users with incomplete information
- **Result Limiting** - Control result set size for performance
- **Security** - No sensitive data exposed in results

---

## 🎯 Quick Start

### Basic User Search
```http
GET /users/search?q=john
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "users": [
    {
      "id": "user-uuid-1",
      "nombre": "John",
      "apellidos": "Smith",
      "email": "john.smith@example.com",
      "status": "online",
      "fullName": "John Smith"
    }
  ],
  "total": 1,
  "query": "john"
}
```

---

## 📋 Endpoint Details

### Search Users
**URL:** `GET /users/search`

**Authentication:** Required (JWT Bearer Token)

**Query Parameters:**
| Parameter | Type | Required | Description | Default | Max |
|-----------|------|----------|-------------|---------|-----|
| `q` | string | ✅ Yes | Search query (min 2 chars) | - | - |
| `limit` | number | ❌ No | Maximum results | 10 | 50 |

**Search Fields:**
- First name (`nombre`)
- Last name (`apellidos`) 
- Email address
- Full name (concatenated)

**Request Examples:**
```http
GET /users/search?q=john
GET /users/search?q=smith&limit=5
GET /users/search?q=user@example.com
GET /users/search?q=john smith&limit=20
```

---

## 📊 Response Formats

### Success Response (200)
```json
{
  "users": [
    {
      "id": "357b292d-ddbf-4061-89ce-2243f6d9db57",
      "nombre": "John",
      "apellidos": "Smith",
      "email": "john.smith@example.com",
      "status": "online",
      "fullName": "John Smith"
    },
    {
      "id": "8f4e2c1a-5b6d-4e3f-9a8b-7c6d5e4f3a2b",
      "nombre": "Jane",
      "apellidos": "Johnson",
      "email": "jane.johnson@company.com",
      "status": "offline",
      "fullName": "Jane Johnson"
    }
  ],
  "total": 2,
  "query": "john"
}
```

### Empty Results (200)
```json
{
  "users": [],
  "total": 0,
  "query": "nonexistentuser"
}
```

### Query Too Short (200)
```json
{
  "users": [],
  "message": "search-query-too-short"
}
```

---

## ❌ Error Responses

### 401 Unauthorized
**Missing or invalid JWT token**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## 🔍 Search Behavior

### Search Logic
- **Case Insensitive**: Matches regardless of uppercase/lowercase
- **Partial Matching**: Uses `LIKE %query%` pattern matching
- **Multiple Fields**: Searches across all relevant user fields
- **Alphabetical Order**: Results sorted by first name, then last name

### Search Examples
| Query | Matches |
|-------|---------|
| `john` | John Smith, Johnny Doe, john.doe@email.com |
| `smith` | John Smith, Jane Smith-Wilson |
| `user@` | user@example.com, myuser@company.com |
| `john smith` | John Smith, Smith Johnson |

### Validation Rules
- Minimum query length: **2 characters**
- Maximum results: **50 users**
- Query automatically trimmed of whitespace
- Special characters allowed in search

---

## 📋 Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | User's unique UUID |
| `nombre` | string | User's first name |
| `apellidos` | string | User's last name |
| `email` | string | User's email address |
| `status` | string | Current status (`online`, `offline`, `away`, `busy`) |
| `fullName` | string | Computed full name for display |

---

## 🔒 Security & Privacy

### Data Protection
- ✅ **No Passwords**: Password fields completely excluded
- ✅ **JWT Required**: All requests must be authenticated
- ✅ **SQL Injection Protected**: Parameterized queries used
- ✅ **Rate Limiting Ready**: Endpoint designed for rate limiting

### Access Control
- Authenticated users can search all other users
- No special permissions required beyond valid JWT
- Results include users from all projects/teams

---

## 🎯 Common Use Cases

### User Selection for Invitations
Perfect for project invitation dropdowns and member selection.

### Contact Discovery
Find colleagues and team members across the organization.

### Autocomplete Functionality
Ideal for user input fields with real-time search suggestions.

### Direct Messaging
Find users to start direct conversations with.

---

## 💡 Best Practices

### Performance Tips
- Use reasonable `limit` values (10-20 for UI dropdowns)
- Implement client-side debouncing for real-time search
- Cache frequent searches where appropriate

### User Experience
- Show "No results found" for empty result sets
- Display loading states during search requests
- Handle the "search too short" message gracefully

### Error Handling
- Always check for authentication errors
- Provide fallback when search fails
- Validate query length on client side too

---

## 🚀 Integration Examples

### Basic Implementation
```javascript
// Simple search function
const searchUsers = async (query, limit = 10) => {
  const response = await fetch(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  return response.json();
};

// Usage
const results = await searchUsers('john');
console.log(`Found ${results.total} users`);
```

### With Error Handling
```javascript
const searchUsersWithErrorHandling = async (query, limit = 10) => {
  try {
    if (query.length < 2) {
      return { users: [], message: 'Query too short' };
    }
    
    const response = await fetch(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Search failed');
    }
    
    return response.json();
  } catch (error) {
    console.error('User search error:', error);
    return { users: [], error: error.message };
  }
};
```

---

**🎉 Ready to search and discover users across your platform!** 🚀 