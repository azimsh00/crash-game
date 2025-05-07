import { database } from './config';
import { ref, set } from 'firebase/database';

// Function to initialize Firebase with proper permissions
export const initializeFirebaseRules = async () => {
  console.log("Initializing Firebase rules by writing to test paths...");
  
  try {
    // Attempt to write to root path
    await set(ref(database, '_test_init'), { 
      timestamp: Date.now(),
      message: "Initializing Firebase rules"
    });
    console.log("Successfully wrote to root path");
    
    // Attempt to write to games path
    await set(ref(database, 'games/_test_init'), { 
      timestamp: Date.now(),
      message: "Initializing Firebase rules" 
    });
    console.log("Successfully wrote to games path");
    
    // Attempt to write to debug path
    await set(ref(database, 'debug/_test_init'), { 
      timestamp: Date.now(),
      message: "Initializing Firebase rules"
    });
    console.log("Successfully wrote to debug path");
    
    return { success: true, message: "Firebase rules initialized successfully" };
  } catch (error: any) {
    console.error("Error initializing Firebase rules:", error);
    return { 
      success: false, 
      message: `Firebase rules initialization failed: ${error.message}`,
      error
    };
  }
};

// Export a function to test rules in real-time
export const testFirebaseRules = async (path: string) => {
  try {
    console.log(`Testing write to path: ${path}`);
    await set(ref(database, `${path}/test_${Date.now()}`), {
      timestamp: Date.now(),
      message: "Testing Firebase rules"
    });
    return { success: true, path };
  } catch (error: any) {
    console.error(`Error writing to path ${path}:`, error);
    return { success: false, path, error: error.message };
  }
};