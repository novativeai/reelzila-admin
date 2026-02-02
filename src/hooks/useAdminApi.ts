"use client";

import { useAuth } from "@/context/AuthContext";
import { useCallback } from "react";

/**
 * A custom hook to simplify making authenticated API requests to the admin backend.
 * It automatically gets the Firebase auth token for the logged-in user and
 * includes it in the 'Authorization' header of every request.
 */
export const useAdminApi = () => {
  const { user } = useAuth();

  const makeRequest = useCallback(async (path: string, options: RequestInit = {}) => {
    // 1. Ensure a user is logged in.
    if (!user) {
      throw new Error("User not authenticated. Cannot make admin request.");
    }

    // 2. Get the user's unique Firebase ID Token. This is the secure credential.
    const token = await user.getIdToken();

    // 3. Prepare the request headers, adding the token as a 'Bearer' token.
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // 4. Make the actual fetch call to the backend.
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
        ...options,
        headers,
    });
    
    // 5. Handle any errors from the backend.
    if (!response.ok) {
        let message = 'An API error occurred.';
        try {
            const errorData = await response.json();
            if (typeof errorData.detail === 'string') {
                message = errorData.detail;
            } else if (Array.isArray(errorData.detail)) {
                // Pydantic validation errors come as an array of objects
                message = errorData.detail
                    .map((err: { loc?: string[]; msg?: string }) => {
                        const field = err.loc?.slice(-1)[0] || 'unknown';
                        return `${field}: ${err.msg || 'invalid'}`;
                    })
                    .join(', ');
            }
        } catch {
            message = `Server error (${response.status})`;
        }
        throw new Error(message);
    }
    
    // 6. Return the JSON response if it exists.
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        return; // Return nothing for responses with no body (like a successful DELETE)
    }
  }, [user]); // The function is memoized and only changes if the user object changes.

  return { makeRequest };
};