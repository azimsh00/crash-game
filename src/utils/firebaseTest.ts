// Firebase Test Utility
// src/utils/firebaseTest.ts
import { ref, set, get, remove } from 'firebase/database';
import { auth, database } from '../firebase/config';
import { signInAnonymously } from 'firebase/auth';

/**
 * Tests Firebase Realtime Database connectivity
 * @returns Promise with test results
 */
export const testFirebaseDatabase = async (): Promise<{ success: boolean; message: string }> => {
  console.log("Starting Firebase Database connectivity test...");
  
  try {
    // Generate a test path
    const testId = `test_${Date.now()}`;
    const testRef = ref(database, `connectivity_tests/${testId}`);
    
    // Test data
    const testData = {
      timestamp: Date.now(),
      message: "Firebase connectivity test"
    };
    
    // Try to write data
    console.log("Attempting to write test data...");
    await set(testRef, testData);
    console.log("Test data written successfully");
    
    // Try to read the data back
    console.log("Attempting to read test data...");
    const snapshot = await get(testRef);
    
    if (!snapshot.exists()) {
      throw new Error("Data was written but could not be read back");
    }
    
    const readData = snapshot.val();
    console.log("Test data read successfully:", readData);
    
    // Verify the data matches
    if (readData.timestamp !== testData.timestamp || readData.message !== testData.message) {
      throw new Error("Data read does not match data written");
    }
    
    // Clean up the test data
    console.log("Cleaning up test data...");
    await remove(testRef);
    console.log("Test data removed successfully");
    
    return {
      success: true,
      message: "Firebase Realtime Database connection is working correctly"
    };
  } catch (error: any) {
    console.error("Firebase Database test failed:", error);
    return {
      success: false,
      message: `Firebase Database test failed: ${error.message}`
    };
  }
};

/**
 * Tests Firebase Authentication
 * @returns Promise with test results
 */
export const testFirebaseAuth = async (): Promise<{ success: boolean; message: string }> => {
  console.log("Starting Firebase Authentication test...");
  
  try {
    // Try to sign in anonymously
    console.log("Attempting anonymous sign-in...");
    const userCredential = await signInAnonymously(auth);
    
    if (!userCredential || !userCredential.user) {
      throw new Error("Anonymous sign-in did not return a user");
    }
    
    console.log("Successfully signed in anonymously with user ID:", userCredential.user.uid);
    
    return {
      success: true,
      message: "Firebase Authentication is working correctly"
    };
  } catch (error: any) {
    console.error("Firebase Authentication test failed:", error);
    return {
      success: false,
      message: `Firebase Authentication test failed: ${error.message}`
    };
  }
};

/**
 * Run all Firebase tests
 * @returns Promise with combined test results
 */
export const testFirebaseConnection = async (): Promise<{ database: { success: boolean; message: string }; auth: { success: boolean; message: string } }> => {
  console.log("Starting comprehensive Firebase connectivity tests...");
  
  const dbResult = await testFirebaseDatabase();
  const authResult = await testFirebaseAuth();
  
  console.log("Firebase tests completed:", { database: dbResult, auth: authResult });
  
  return {
    database: dbResult,
    auth: authResult
  };
};

export default testFirebaseConnection;