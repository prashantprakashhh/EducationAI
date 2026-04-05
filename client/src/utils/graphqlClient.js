/**
 * This file provides a centralized way to handle GraphQL API requests.
 * It accomplishes two things:
 * 1. It overrides the global `window.fetch` to automatically fix relative API paths
 *    and inject the JWT Authorization header into every API request.
 * 2. It exports a `graphqlRequest` helper function for a consistent way to make
 *    GraphQL calls, although using `fetch('/graphql', ...)` will now also work.
 */

// Use an environment variable for your API URL for flexibility.
// In a .env.local file at the root of your /client folder, you would have:
// VITE_API_BASE_URL=http://localhost:8080
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const originalFetch = window.fetch;

// 1. Global fetch override
window.fetch = async (url, options) => {
  let newUrl = url;
  
  // If the URL is a relative path to our API endpoints, make it absolute.
  if (typeof url === 'string' && (url.startsWith('/graphql') || url.startsWith('/api/'))) {
    newUrl = `${API_URL}${url}`;
  }

  const newOptions = { ...options };

  // Only add the Authorization header to our own API calls
  if (String(newUrl).startsWith(API_URL)) {
    const token = localStorage.getItem('eduai-token');
    if (token) {
      newOptions.headers = {
        ...newOptions.headers,
        'Authorization': `Bearer ${token}`,
      };
    }
  }

  return originalFetch(newUrl, newOptions);
};

// 2. Exported graphqlRequest helper function
export async function graphqlRequest(query, variables = {}) {
  try {
    // This call will now be intercepted by the fetch override above.
    const response = await window.fetch('/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API Error Response:", errorBody);
      throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    return responseText ? JSON.parse(responseText) : {};

  } catch (error) {
    console.error("GraphQL request failed:", error);
    throw error;
  }
}