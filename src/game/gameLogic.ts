import { ref, onValue, set, push, update, get } from 'firebase/database';
import { database } from '../firebase/config';

export interface Player {
  id: string;
  username: string;
  bet: number;
  cashoutMultiplier: number | null;
  hasWon: boolean;
  profit?: number;
}

export interface GameState {
  status: 'waiting' | 'running' | 'crashed';
  currentMultiplier: number;
  crashPoint: number;
  startTime: number | null;
  endTime: number | null;
  players: Record<string, Player>;
  gameId: string;
}

// Initialize game state with improved crash point generation
export const initGameState = (): GameState => {
  const crashPoint = generateCrashPoint();
  console.log("Generated crash point:", crashPoint);

  return {
    status: 'waiting',
    currentMultiplier: 1.0,
    crashPoint,
    startTime: null,
    endTime: null,
    players: {},
    gameId: generateUniqueId(),
  };
};

// Generate a unique ID for games
export const generateUniqueId = (): string => {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
};

// Generate crash point using provably fair algorithm
// This is a simplified version, in a real game you'd use a more sophisticated algorithm
export const generateCrashPoint = (): number => {
  // The house edge determines the expected value of the game
  const houseEdge = 0.01; // 1% house edge

  // Generate a random value between 0 and 1
  const randomValue = Math.random();

  // Apply a distribution that creates an exponential curve
  // The formula is designed so that:
  // 1. The result is always >= 1.00x
  // 2. Higher multipliers are exponentially less likely
  // 3. The expected value is (1 - houseEdge)
  return Math.max(1.00, (1 / (1 - randomValue)) * (1 - houseEdge));
};

// Create new game in Firebase
export const createNewGame = async (): Promise<string> => {
  try {
    console.log("Creating new game...");
    const gameState = initGameState();
    const gameRef = ref(database, `games/${gameState.gameId}`);

    // First check if a game with this ID already exists
    const snapshot = await get(gameRef);

    if (snapshot.exists()) {
      console.log("Game already exists with ID:", gameState.gameId);
      // Generate a new ID to avoid collision
      const newId = generateUniqueId();
      gameState.gameId = newId;
      console.log("Generated new game ID:", newId);
    }

    // Set the game data
    await set(gameRef, gameState);
    console.log("New game created successfully with ID:", gameState.gameId);
    return gameState.gameId;
  } catch (error) {
    console.error("Error creating new game:", error);
    // In case of error, still return a valid game ID
    // This allows the app to recover gracefully
    return generateUniqueId();
  }
};

// Join game as a player
export const joinGame = async (
  gameId: string,
  playerId: string,
  username: string,
  betAmount: number
): Promise<void> => {
  try {
    console.log(`Player ${username} (${playerId}) joining game ${gameId} with bet ${betAmount}`);
    const playerRef = ref(database, `games/${gameId}/players/${playerId}`);
    const player: Player = {
      id: playerId,
      username,
      bet: betAmount,
      cashoutMultiplier: null,
      hasWon: false,
      profit: 0
    };
    await set(playerRef, player);
  } catch (error) {
    console.error("Error joining game:", error);
    throw error;
  }
};

// Start the game
export const startGame = async (gameId: string): Promise<void> => {
  try {
    console.log(`Starting game ${gameId}...`);
    // Use update instead of set to update specific fields
    await update(ref(database, `games/${gameId}`), {
      status: 'running',
      startTime: Date.now()
    });
  } catch (error) {
    console.error("Error starting game:", error);
    throw error;
  }
};

// Cashout function for a player
export const cashout = async (
  gameId: string,
  playerId: string,
  currentMultiplier: number
): Promise<void> => {
  try {
    console.log(`Player ${playerId} cashing out at ${currentMultiplier}x in game ${gameId}`);

    // Get player info to calculate profit
    const playerRef = ref(database, `games/${gameId}/players/${playerId}`);
    const snapshot = await get(playerRef);

    if (snapshot.exists()) {
      const player = snapshot.val();
      const profit = player.bet * currentMultiplier - player.bet;

      // Update player with cashout info
      await update(playerRef, {
        cashoutMultiplier: currentMultiplier,
        hasWon: true,
        profit: profit
      });
    } else {
      throw new Error("Player not found in game");
    }
  } catch (error) {
    console.error("Error during cashout:", error);
    throw error;
  }
};

// Watch game updates
export const watchGame = (
  gameId: string,
  callback: (gameState: GameState) => void
): (() => void) => {
  try {
    console.log(`Setting up watcher for game: ${gameId}`);
    const gameRef = ref(database, `games/${gameId}`);

    const unsubscribe = onValue(
      gameRef,
      (snapshot) => {
        console.log(`Received update for game ${gameId}, data exists:`, snapshot.exists());

        if (!snapshot.exists()) {
          console.log(`Game ${gameId} data doesn't exist, creating new game data`);
          // Initialize a new game state if it doesn't exist
          const newGameState = initGameState();
          newGameState.gameId = gameId;

          set(gameRef, newGameState)
            .then(() => {
              console.log(`New data for game ${gameId} created successfully`);
            })
            .catch((error) => {
              console.error(`Error creating new data for game ${gameId}:`, error);
            });
          return;
        }

        try {
          const gameState = snapshot.val() as GameState;
          callback(gameState);
        } catch (error) {
          console.error(`Error parsing game ${gameId} data:`, error);
        }
      },
      (error) => {
        console.error(`Error watching game ${gameId}:`, error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up game watcher:", error);
    // Return a no-op unsubscribe function
    return () => {
      console.log("No-op unsubscribe called after watchGame error");
    };
  }
};

// Calculate current multiplier based on time elapsed
export const calculateCurrentMultiplier = (startTime: number, now: number): number => {
  const elapsed = (now - startTime) / 1000; // time in seconds

  // Using a more realistic growth function that starts slow and accelerates
  // This creates a more exciting gameplay experience
  return 1.0 + 0.1 * Math.pow(elapsed, 1.5);
};

// Game loop function - normally this would run on the server
// For this demo, we'll run it on the client which is not secure for a real game
export const startGameLoop = (gameId: string): NodeJS.Timeout => {
  try {
    console.log(`Starting game loop for game ${gameId}`);
    const gameRef = ref(database, `games/${gameId}`);

    // Start the game immediately
    startGame(gameId).catch(error => {
      console.error("Error starting game:", error);
    });

    const gameLoop = () => {
      try {
        get(gameRef).then((snapshot) => {
          if (!snapshot.exists()) {
            console.log(`Game ${gameId} no longer exists, stopping game loop`);
            clearInterval(gameLoopInterval);
            return;
          }

          const gameState = snapshot.val() as GameState;

          if (gameState.status !== 'running') {
            console.log(`Game ${gameId} is not running (status: ${gameState.status}), skipping update`);
            return;
          }

          const now = Date.now();
          const startTime = gameState.startTime || now;
          const currentMultiplier = calculateCurrentMultiplier(startTime, now);

          // Update current multiplier
          update(gameRef, {
            currentMultiplier
          }).catch((error) => {
            console.error(`Error updating multiplier for game ${gameId}:`, error);
          });

          // Check if game should crash
          if (currentMultiplier >= gameState.crashPoint) {
            console.log(`Game ${gameId} crashed at ${currentMultiplier}x (crash point: ${gameState.crashPoint})`);

            // Game crashed
            update(gameRef, {
              status: 'crashed',
              endTime: now
            }).catch((error) => {
              console.error(`Error updating crash status for game ${gameId}:`, error);
            });

            clearInterval(gameLoopInterval);

            // After a delay, create a new game
            setTimeout(() => {
              console.log(`Creating new game after ${gameId} crashed`);
              createNewGame().catch((error) => {
                console.error("Error creating new game after crash:", error);
              });
            }, 5000);
          }
        }).catch((error) => {
          console.error(`Error getting game ${gameId} data in game loop:`, error);
        });
      } catch (error) {
        console.error(`Exception in game loop for ${gameId}:`, error);
      }
    };

    // Run the game loop every 50ms for smooth updates
    const gameLoopInterval = setInterval(gameLoop, 50);
    console.log(`Game loop started for game ${gameId}`);
    return gameLoopInterval;
  } catch (error) {
    console.error("Exception in startGameLoop:", error);
    // Return a dummy interval that we can clear safely
    return setInterval(() => { }, 1000000);
  }
};

// Function to update user balance
export const updateUserBalance = async (
  userId: string,
  amount: number,
  isAddition: boolean = true
): Promise<void> => {
  try {
    console.log(`Updating balance for user ${userId}: ${isAddition ? '+' : '-'}${amount}`);
    const userRef = ref(database, `users/${userId}`);

    // Get current balance
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      throw new Error("User not found");
    }

    const user = snapshot.val();
    const currentBalance = user.balance || 0;
    const newBalance = isAddition
      ? currentBalance + amount
      : Math.max(0, currentBalance - amount);

    // Update balance
    await update(userRef, {
      balance: newBalance,
      lastUpdate: Date.now()
    });

    console.log(`Updated balance for user ${userId} to ${newBalance}`);
  } catch (error) {
    console.error("Error updating user balance:", error);
    throw error;
  }
};