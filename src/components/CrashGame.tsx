// src/components/CrashGame.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, database } from '../firebase/config';
import {
  watchGame,
  GameState,
  Player,
  joinGame,
  cashout,
  createNewGame,
  startGameLoop
} from '../game/gameLogic';
import {
  signInAnonymously,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { ref, set, onValue, update, get } from 'firebase/database';
import CrashGraph from './CrashGraph';
import { theme } from '../styles/theme';
import { User, UserBet } from '../models/User';
import styled from 'styled-components';

// Create a variation of motion.button for styled-components integration
const MotionButton = motion.button;

// Styled components
const GameContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  color: #FFFFFF;
  background-color: #1A1A1A;
`;

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const Username = styled.span`
  font-weight: bold;
  font-size: 18px;
`;

const Balance = styled.span`
  color: #CCCCCC;
`;

const RecentResults = styled.div`
  display: flex;
  gap: 5px;
`;

const MessageContainer = styled(motion.div)`
  background-color: #3A3F4B;
  padding: 10px 15px;
  border-radius: 5px;
  margin-bottom: 20px;
  text-align: center;
  font-weight: bold;
  color: #FFFFFF;
`;

const GameArea = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  background-color: #282C34;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  position: relative;
`;

const GraphContainer = styled.div`
  width: 100%;
  height: 300px;
  position: relative;
  margin-bottom: 20px;
`;

const GameStats = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  justify-content: space-between;
  color: #CCCCCC;
  font-size: 14px;
`;

const GreenDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  background-color: #4CAF50;
  border-radius: 50%;
  margin-right: 5px;
`;

const PlayerStatus = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  width: 100%;
  max-width: 400px;
  border-radius: 5px;
  background-color: #3A3F4B;
  text-align: center;
  color: #FFFFFF;
`;

const PlayerStatusWon = styled(PlayerStatus)`
  background-color: rgba(76, 175, 80, 0.25);
  color: #4CAF50;
  border: 1px solid #4CAF50;
`;

const PlayerStatusLost = styled(PlayerStatus)`
  background-color: rgba(244, 67, 54, 0.25);
  color: #F44336;
  border: 1px solid #F44336;
`;

const BetControlsContainer = styled(motion.div)`
  width: 100%;
  max-width: 600px;
`;

const BetSettings = styled.div`
  background-color: #3A3F4B;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
`;

const BetModeToggle = styled.div`
  display: flex;
  margin-bottom: 15px;
  background-color: #282C34;
  border-radius: 8px;
  padding: 5px;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 10px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  color: #FFFFFF;
  font-weight: bold;
  transition: background-color 0.2s;
  background-color: ${props => props.$active ? '#6A30D9' : '#3A3F4B'};
`;

const BetAmountContainer = styled.div`
  margin-bottom: 15px;
`;

const BalanceDisplay = styled.span`
  float: right;
  color: #CCCCCC;
`;

const BetInputContainer = styled.div`
  position: relative;
`;

const BetInput = styled.input`
  width: 100%;
  padding: 10px;
  background-color: #282C34;
  border: 1px solid #4E5563;
  border-radius: 4px;
  color: #FFFFFF;
  font-size: 16px;
  margin-top: 5px;
`;

const CashoutInput = styled(BetInput)``;

const QuickBetControls = styled.div`
  margin-top: 10px;
`;

const BetButtons = styled.div`
  display: flex;
  gap: 5px;
  margin-bottom: 5px;
`;

const QuickBetButton = styled.button<{ $isActive: boolean }>`
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  background-color: ${props => props.$isActive ? '#0078CC' : '#3A3F4B'};
  color: ${props => props.$isActive ? '#FFFFFF' : '#CCCCCC'};
`;

const BetControlsRow = styled.div`
  display: flex;
  gap: 5px;
`;

const HalfButton = styled.button`
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 4px;
  background-color: #3A3F4B;
  color: #FFFFFF;
  cursor: pointer;
  font-weight: bold;
`;

const DoubleButton = styled(HalfButton)``;

const BetButtonsContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const PlaceBetButton = styled(MotionButton)`
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  background-color: #8039FF;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  &:disabled {
    background-color: #4E5563;
    cursor: not-allowed;
  }
`;

const PlaceNextBetButton = styled(PlaceBetButton)``;

const CashoutButton = styled(MotionButton)`
  width: 100%;
  padding: 15px 20px;
  border: none;
  border-radius: 8px;
  background-color: #4CAF50;
  color: white;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
`;

const PlayersListContainer = styled(motion.div)`
  width: 100%;
  background-color: #282C34;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  
  h3 {
    margin-top: 0;
    color: #FFFFFF;
  }
`;

const TableContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  border-radius: 8px;
  background-color: #3A3F4B;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #4E5563;
  }
  
  th {
    background-color: #3A3F4B;
    color: #CCCCCC;
    font-weight: bold;
  }
  
  tr:hover {
    background-color: #4E5563;
  }
`;

const CashedOut = styled.span`
  color: #4CAF50;
  font-weight: bold;
`;

const Lost = styled.span`
  color: #F44336;
  font-weight: bold;
`;

const InGame = styled.span`
  color: #0096FF;
  font-weight: bold;
`;

const Profit = styled.span`
  color: #4CAF50;
  font-weight: bold;
`;

const Loss = styled.span`
  color: #F44336;
  font-weight: bold;
`;

const LoginContainer = styled(motion.div)`
  max-width: 400px;
  margin: 0 auto;
  padding: 30px;
  background-color: #282C34;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  text-align: center;
  
  h2 {
    color: #FFFFFF;
    margin-bottom: 15px;
  }
  
  p {
    color: #CCCCCC;
    margin-bottom: 25px;
  }
`;

const PlayNowButton = styled(MotionButton)`
  background-color: #8039FF;
  color: white;
  padding: 15px 30px;
  font-size: 18px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
`;

const ErrorMessage = styled(motion.div)`
  background-color: rgba(244, 67, 54, 0.25);
  color: #F44336;
  padding: 20px;
  border-radius: 8px;
  margin: 20px auto;
  max-width: 600px;
  text-align: center;
  border: 1px solid #F44336;
  
  button {
    background-color: #F44336;
    color: white;
    margin-top: 15px;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
`;

const CountdownOverlay = styled(motion.div)`
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #FFFFFF;
  padding: 5px 10px;
  border-radius: 4px;
  font-weight: bold;
`;

const CrashGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [hasBet, setHasBet] = useState(false);
  const [message, setMessage] = useState('');
  const [autoCashout, setAutoCashout] = useState<number | null>(null);
  const [countdownTimer, setCountdownTimer] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [animatedMultiplier, setAnimatedMultiplier] = useState(1);
  const [pendingBet, setPendingBet] = useState(false);
  const [isBettingForNextRound, setIsBettingForNextRound] = useState(false);
  const [recentResults, setRecentResults] = useState<number[]>([]);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const gameIdRef = useRef<string | null>(null);

  // Direct method to start the game after countdown
  const startGameAfterCountdown = useCallback(() => {
    if (gameIdRef.current) {
      console.log(`Starting game ${gameIdRef.current} after countdown`);
      try {
        // Call the startGameLoop directly
        gameLoopRef.current = startGameLoop(gameIdRef.current);
        console.log("Game loop started successfully");
      } catch (error) {
        console.error("Error starting game:", error);
        setMessage("Failed to start the game. Please try again.");
      }
    } else {
      console.error("No game ID available");
      setMessage("Game initialization error. Please refresh the page.");
    }
  }, []);

  // Start countdown function
  const startCountdown = useCallback(() => {
    console.log("Starting countdown");
    // Clear any existing countdown
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    // Set initial countdown time
    let countdown = 10;
    setCountdownTimer(countdown);

    // Create new countdown interval
    countdownRef.current = setInterval(() => {
      countdown -= 1;
      setCountdownTimer(countdown);

      if (countdown <= 0) {
        console.log("Countdown finished, starting game");
        // Clear the interval when countdown reaches zero
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }

        // Reset countdown display
        setCountdownTimer(null);

        // Start the game
        startGameAfterCountdown();
      }
    }, 1000);
  }, [startGameAfterCountdown]);

  // Memoize the cashout handler to avoid recreation on each render
  const handleCashout = useCallback(() => {
    if (!user || !gameState || !gameState.status || gameState.status !== 'running') {
      console.log("Cannot cashout: user or game conditions not met");
      return;
    }

    try {
      // Make sure players object and the specific user entry exist
      if (!gameState.players || !gameState.players[user.uid]) {
        console.log("Cannot cashout: player not found in game");
        return;
      }

      const player = gameState.players[user.uid];
      if (player.cashoutMultiplier) {
        console.log("Cannot cashout: player already cashed out");
        return;
      }

      console.log(`Cashing out at ${gameState.currentMultiplier.toFixed(2)}x`);
      cashout(gameState.gameId, user.uid, gameState.currentMultiplier);

      // Update UI message
      const winAmount = player.bet * gameState.currentMultiplier;
      setMessage(`Cashed out at ${gameState.currentMultiplier.toFixed(2)}x! Won: $${winAmount.toFixed(2)}`);

      // We don't update the balance here as it's handled when game crashes
    } catch (error) {
      console.error("Error during cashout:", error);
      setMessage("Failed to cash out. Please try again.");
    }
  }, [user, gameState]);

  // Handle anonymous sign-in
  const handleAnonymousSignIn = useCallback(async () => {
    try {
      console.log("Attempting anonymous sign-in");
      // Sign in anonymously
      const userCredential = await signInAnonymously(auth);

      // Generate a random username for the anonymous user
      const randomUsername = `Player${Math.floor(Math.random() * 10000)}`;

      // Update the profile with the random username
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: randomUsername
        });

        setUsername(randomUsername);
        setMessage(`Welcome, ${randomUsername}!`);
        console.log(`Anonymous user signed in: ${userCredential.user.uid} as ${randomUsername}`);
      }
    } catch (error: any) {
      console.error("Anonymous sign-in failed:", error);
      setMessage(`Anonymous sign-in failed: ${error.message}`);
    }
  }, []);

  // Handle bet placement and start countdown
  const handlePlaceBet = useCallback((isNextRound = false) => {
    if (!user || !gameState || betAmount <= 0 || !userInfo) {
      console.log("Cannot place bet: missing user, game state, invalid bet amount, or user info");
      return;
    }

    try {
      // Check if user has enough balance
      if (userInfo.balance < betAmount) {
        setMessage('Insufficient balance to place bet');
        return;
      }

      if (isNextRound && gameState.status === 'running') {
        // Store the intent to bet on next round
        setIsBettingForNextRound(true);
        setMessage(`Bet will be placed in next round: $${betAmount}`);
        return;
      }

      if (!isNextRound && gameState.status !== 'waiting') {
        setMessage('Wait for the next round to place a bet');
        return;
      }

      console.log(`Placing bet: $${betAmount}`);

      // Update user balance
      const newBalance = userInfo.balance - betAmount;
      update(ref(database, `users/${user.uid}`), {
        balance: newBalance
      });

      // Join the game
      joinGame(gameState.gameId, user.uid, username, betAmount);
      setHasBet(true);
      setMessage(`Bet placed: $${betAmount}`);

      // Reset betting for next round flag
      setIsBettingForNextRound(false);

      // Start a countdown timer after placing bet if it's the first bet
      const playerCount = Object.keys(gameState.players || {}).length;
      if (playerCount <= 1) {
        startCountdown();
      }
    } catch (error) {
      console.error("Error placing bet:", error);
      setMessage("Failed to place bet. Please try again.");
    }
  }, [user, gameState, betAmount, userInfo, username, startCountdown]);

  // Reset Firebase permissions on mount (for dev purposes)
  useEffect(() => {
    const attemptPermissionFix = async () => {
      try {
        // Write to the root to see if we have proper permissions
        await set(ref(database, 'permission_test'), {
          timestamp: Date.now(),
          message: 'Testing write permissions'
        });
        console.log('Write permission test successful');
      } catch (error) {
        console.error('Failed to write to Firebase:', error);
        setInitError('Firebase write permission denied. Please check Firebase rules.');
      }
    };

    attemptPermissionFix();
  }, []);

  // Authentication effect
  useEffect(() => {
    console.log("Setting up authentication state listener");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? `User: ${user.uid}` : "No user");
      if (user) {
        setUser(user);
        const randomUsername = user.displayName || `Player${Math.floor(Math.random() * 10000)}`;
        setUsername(randomUsername);

        // Load or create user info
        const userRef = ref(database, `users/${user.uid}`);
        get(userRef).then((snapshot) => {
          if (snapshot.exists()) {
            // User exists, load data
            const userData = snapshot.val();
            setUserInfo(userData);
          } else {
            // Create new user with 1000 starting balance
            const newUser: User = {
              id: user.uid,
              username: randomUsername,
              balance: 1000,
              createdAt: Date.now(),
              lastLogin: Date.now()
            };
            set(userRef, newUser);
            setUserInfo(newUser);
          }
        });
      } else {
        setUser(null);
        setUserInfo(null);
      }
    });

    return () => {
      console.log("Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  // Load recent results
  useEffect(() => {
    const resultsRef = ref(database, 'game_results');
    const unsubscribe = onValue(resultsRef, (snapshot) => {
      if (snapshot.exists()) {
        const results = snapshot.val();
        const recentMultipliers = Object.values(results)
          .slice(-5)
          .map((result: any) => result.crashPoint);
        setRecentResults(recentMultipliers as number[]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Watch user balance changes
  useEffect(() => {
    if (!user) return;

    const userRef = ref(database, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserInfo(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Initialize or join game
  useEffect(() => {
    console.log("Initializing or joining game...");
    setIsLoading(true);
    setInitError(null);

    try {
      let gameId = localStorage.getItem('currentGameId');
      console.log("Retrieved gameId from localStorage:", gameId);

      const initializeNewGame = async () => {
        try {
          console.log("Creating new game...");
          const newGameId = await createNewGame();
          console.log("New game created with ID:", newGameId);
          localStorage.setItem('currentGameId', newGameId);
          gameIdRef.current = newGameId;
          return newGameId;
        } catch (error) {
          console.error("Error creating new game:", error);
          setMessage("Failed to create a new game. Please refresh the page.");
          setInitError("Failed to create game");
          return null;
        }
      };

      const setupGameWatcher = async (id: string) => {
        try {
          gameIdRef.current = id;
          console.log("Setting up game watcher for ID:", id);

          return watchGame(id, (state) => {
            console.log("Game state updated:", state);
            setGameState(state);
            setIsLoading(false);

            // Handle pending bets for next round when game is waiting
            if (state && state.status === 'waiting' && pendingBet && user) {
              handlePlaceBet(true);
              setPendingBet(false);
            }

            // Check if the game status is 'crashed'
            if (state && state.status === 'crashed') {
              console.log("Game crashed, resetting state");
              setHasBet(false);
              setCountdownTimer(null);

              // Save result to game_results
              const resultData = {
                gameId: state.gameId,
                crashPoint: state.crashPoint,
                timestamp: Date.now(),
                playerCount: Object.keys(state.players || {}).length,
              };

              set(ref(database, `game_results/${state.gameId}`), resultData);

              // Process payouts for all players
              if (state.players) {
                Object.entries(state.players).forEach(([playerId, player]) => {
                  if (player.cashoutMultiplier) {
                    // Player won
                    const winAmount = player.bet * player.cashoutMultiplier;

                    // Update user balance
                    update(ref(database, `users/${playerId}`), {
                      balance: userInfo && playerId === user?.uid
                        ? (userInfo.balance + winAmount - player.bet)
                        : null
                    });
                  }
                });
              }

              // Clear countdown if it exists
              if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
              }

              // Create a new game after a delay
              setTimeout(async () => {
                try {
                  const newGameId = await createNewGame();
                  console.log("New game created after crash:", newGameId);
                  localStorage.setItem('currentGameId', newGameId);
                  gameIdRef.current = newGameId;

                  // Place pending bet for next round if requested
                  if (isBettingForNextRound && user) {
                    setPendingBet(true);
                  }
                } catch (error) {
                  console.error("Error creating new game after crash:", error);
                  setMessage("Failed to create a new game. Please refresh the page.");
                }
              }, 3000);
            }
          });
        } catch (error) {
          console.error("Error setting up game watcher:", error);
          setMessage("Failed to watch game updates. Please refresh the page.");
          setInitError("Failed to watch game");
          return () => { }; // Return empty cleanup function in case of error
        }
      };

      // Main initialization logic
      const initGame = async () => {
        try {
          if (!gameId) {
            gameId = await initializeNewGame();
            if (!gameId) return () => { };
          }

          return setupGameWatcher(gameId);
        } catch (error) {
          console.error("Error in initGame:", error);
          setMessage("Game initialization error. Please refresh the page.");
          setInitError("Initialization error");
          return () => { };
        }
      };

      // Start the initialization
      let unsubscribeFunc: () => void;
      initGame().then(unsubscribe => {
        unsubscribeFunc = unsubscribe;
      }).catch(error => {
        console.error("Unexpected error in game initialization:", error);
        setMessage("Critical error. Please refresh the page.");
        setInitError("Critical error");
        unsubscribeFunc = () => { };
      });

      // Return cleanup function
      return () => {
        console.log("Cleaning up game subscription and timers");
        if (typeof unsubscribeFunc === 'function') {
          unsubscribeFunc();
        }

        // Clean up timers and intervals
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
          gameLoopRef.current = null;
        }

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      };
    } catch (error) {
      console.error("Fatal error in game initialization:", error);
      setMessage("Fatal game initialization error. Please refresh the page.");
      setInitError("Fatal error");
      setIsLoading(false);
      return () => { }; // Return empty cleanup function in case of error
    }
  }, [user, userInfo, isBettingForNextRound, handlePlaceBet]);

  // Animation frame for updating multiplier in real-time
  useEffect(() => {
    if (gameState && gameState.status === 'running' && gameState.startTime) {
      console.log("Setting up animation frame for real-time multiplier updates");

      const updateMultiplier = () => {
        try {
          const now = Date.now();
          const elapsed = (now - (gameState.startTime || 0)) / 1000;
          const currentMultiplier = 1.0 + 0.1 * Math.pow(elapsed, 1.5);

          // Set the animated multiplier for smoother animation
          setAnimatedMultiplier(currentMultiplier);

          // Update UI with current multiplier
          setGameState(prev =>
            prev ? { ...prev, currentMultiplier } : null
          );

          // Check auto-cashout with thorough null checking
          if (
            autoCashout &&
            currentMultiplier >= autoCashout &&
            user &&
            gameState.players &&
            gameState.players[user.uid] &&
            !gameState.players[user.uid].cashoutMultiplier
          ) {
            handleCashout();
          }

          animationFrameRef.current = requestAnimationFrame(updateMultiplier);
        } catch (error) {
          console.error("Error in animation frame:", error);
          // Don't request another frame in case of error
        }
      };

      animationFrameRef.current = requestAnimationFrame(updateMultiplier);

      return () => {
        console.log("Cleaning up animation frame");
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    }
  }, [gameState, autoCashout, user, handleCashout]);

  // Render quick bet buttons
  const renderQuickBetButtons = useCallback(() => {
    const quickBetAmounts = [5, 10, 25, 50, 100];

    return (
      <QuickBetControls>
        <BetButtons>
          {quickBetAmounts.map(amount => (
            <QuickBetButton
              key={amount}
              $isActive={betAmount === amount}
              onClick={() => setBetAmount(amount)}
            >
              ${amount}
            </QuickBetButton>
          ))}
        </BetButtons>
        <BetControlsRow>
          <HalfButton
            onClick={() => setBetAmount(Math.max(1, Math.floor(betAmount / 2)))}
          >
            ½
          </HalfButton>
          <DoubleButton
            onClick={() => setBetAmount(Math.min(userInfo?.balance || 1000, betAmount * 2))}
          >
            2×
          </DoubleButton>
        </BetControlsRow>
      </QuickBetControls>
    );
  }, [betAmount, userInfo?.balance]);

  // Render recent results
  const renderRecentResults = useCallback(() => {
    return (
      <RecentResults>
        {recentResults.map((result, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            style={{
              backgroundColor: result < 2 ? '#F44336' :
                result < 4 ? '#FF9800' : '#4CAF50',
              color: '#FFFFFF',
              borderRadius: '4px',
              padding: '4px 8px',
              fontWeight: 'bold',
              margin: '0 5px'
            }}
          >
            {result.toFixed(2)}x
          </motion.div>
        ))}
      </RecentResults>
    );
  }, [recentResults]);

  // Render player's current status
  const renderPlayerStatus = useCallback(() => {
    if (!user || !gameState) return <p>Loading game state...</p>;

    // Check if the players object exists
    if (!gameState.players) return <p>Waiting for game data...</p>;

    // Check if the current user is a player in this game
    const player = gameState.players[user.uid];
    if (!player) return <p>Place a bet to join this game</p>;

    if (player.cashoutMultiplier) {
      return (
        <PlayerStatusWon
          as={motion.div}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p>You cashed out at {player.cashoutMultiplier.toFixed(2)}x</p>
          <p>Won: ${(player.bet * player.cashoutMultiplier).toFixed(2)}</p>
        </PlayerStatusWon>
      );
    }

    if (gameState.status === 'crashed') {
      return (
        <PlayerStatusLost
          as={motion.div}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <p>You lost ${player.bet.toFixed(2)}</p>
        </PlayerStatusLost>
      );
    }

    return (
      <PlayerStatus
        as={motion.div}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <p>Your bet: ${player.bet.toFixed(2)}</p>
        {gameState.status === 'running' && (
          <p>Potential win: ${(player.bet * gameState.currentMultiplier).toFixed(2)}</p>
        )}
      </PlayerStatus>
    );
  }, [user, gameState]);

  // Render other players
  const renderPlayers = useCallback(() => {
    if (isLoading) return <p>Loading players...</p>;
    if (!gameState) return <p>Waiting for game data...</p>;
    if (!gameState.players) return <p>No players have joined yet</p>;

    // Check if there are any players
    const playerCount = Object.keys(gameState.players).length;
    if (playerCount === 0) return <p>No players have joined yet</p>;

    return (
      <PlayersListContainer
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h3>Players ({playerCount})</h3>
        <TableContainer>
          <StyledTable>
            <thead>
              <tr>
                <th>Player</th>
                <th>Bet</th>
                <th>Status</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(gameState.players).map((player: any) => {
                const profit = player.cashoutMultiplier
                  ? (player.bet * player.cashoutMultiplier) - player.bet
                  : 0;

                return (
                  <motion.tr
                    key={player.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td>{player.username}</td>
                    <td>${player.bet.toFixed(2)}</td>
                    <td>
                      {player.cashoutMultiplier
                        ? <CashedOut>{player.cashoutMultiplier.toFixed(2)}x</CashedOut>
                        : gameState.status === 'crashed'
                          ? <Lost>Lost</Lost>
                          : <InGame>In game</InGame>}
                    </td>
                    <td>
                      {player.cashoutMultiplier
                        ? <Profit>+${profit.toFixed(2)}</Profit>
                        : gameState.status === 'crashed'
                          ? <Loss>-${player.bet.toFixed(2)}</Loss>
                          : '-'}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </StyledTable>
        </TableContainer>
      </PlayersListContainer>
    );
  }, [isLoading, gameState]);

  // Render bet controls
  const renderBetControls = useCallback(() => {
    const canPlaceBet = gameState && gameState.status === 'waiting' && !hasBet;
    const canPlaceNextBet = gameState && gameState.status === 'running' && !isBettingForNextRound;
    const canCashout = gameState && gameState.status === 'running' && hasBet &&
      user && gameState.players && gameState.players[user.uid] &&
      !gameState.players[user.uid].cashoutMultiplier;

    return (
      <BetControlsContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <BetSettings>
          <BetModeToggle>
            <ToggleButton
              $active={!isBettingForNextRound}
              onClick={() => setIsBettingForNextRound(false)}
            >
              Manual
            </ToggleButton>
            <ToggleButton
              $active={isBettingForNextRound}
              onClick={() => setIsBettingForNextRound(true)}
            >
              Auto
            </ToggleButton>
          </BetModeToggle>

          <BetAmountContainer>
            <label>Bet Amount <BalanceDisplay>{userInfo?.balance.toFixed(2) || '0.00'} USD</BalanceDisplay></label>
            <BetInputContainer>
              <BetInput
                type="number"
                min="1"
                max={userInfo?.balance || 1000}
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                disabled={hasBet}
              />
            </BetInputContainer>

            {renderQuickBetButtons()}
          </BetAmountContainer>

          <div>
            <label>
              Cashout at
              <CashoutInput
                type="number"
                min="1.1"
                step="0.1"
                placeholder="No auto cashout"
                value={autoCashout || ''}
                onChange={(e) => setAutoCashout(e.target.value ? Number(e.target.value) : null)}
                disabled={hasBet && gameState?.status !== 'waiting'}
              />
            </label>
          </div>
        </BetSettings>

        <BetButtonsContainer>
          {canPlaceBet && (
            <PlaceBetButton
              onClick={() => handlePlaceBet(false)}
              disabled={!user || betAmount <= 0 || (userInfo?.balance || 0) < betAmount}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Place Bet
            </PlaceBetButton>
          )}

          {canPlaceNextBet && (
            <PlaceNextBetButton
              onClick={() => handlePlaceBet(true)}
              disabled={!user || betAmount <= 0 || (userInfo?.balance || 0) < betAmount}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Bet (Next round)
            </PlaceNextBetButton>
          )}

          {canCashout && (
            <CashoutButton
              onClick={handleCashout}
              whileHover={{ scale: 1.05, backgroundColor: '#218838' }}
              whileTap={{ scale: 0.95 }}
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: [
                  '0 4px 8px rgba(0, 0, 0, 0.1)',
                  '0 6px 12px rgba(0, 0, 0, 0.2)',
                  '0 4px 8px rgba(0, 0, 0, 0.1)'
                ]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: 'loop'
              }}
            >
              Cash Out ({gameState.currentMultiplier.toFixed(2)}x)
            </CashoutButton>
          )}
        </BetButtonsContainer>
      </BetControlsContainer>
    );
  }, [
    gameState,
    hasBet,
    isBettingForNextRound,
    user,
    userInfo,
    betAmount,
    autoCashout,
    handleCashout,
    handlePlaceBet,
    renderQuickBetButtons
  ]);

  // Error state component
  const renderError = useCallback(() => {
    if (!initError) return null;

    return (
      <ErrorMessage
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h3>Error</h3>
        <p>{initError}</p>
        <p>Please try refreshing the page. If the problem persists, check your network connection and Firebase configuration.</p>
        <motion.button
          onClick={() => window.location.reload()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Refresh Page
        </motion.button>
      </ErrorMessage>
    );
  }, [initError]);

  // Anonymous login component
  const renderAnonymousLoginButton = useCallback(() => {
    return (
      <LoginContainer
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20
        }}
      >
        <h2>Multiplayer Crash Game</h2>
        <p>Start playing immediately - no account needed!</p>
        <PlayNowButton
          onClick={handleAnonymousSignIn}
          whileHover={{ scale: 1.05, backgroundColor: '#9052FF' }}
          whileTap={{ scale: 0.95 }}
          animate={{
            y: [0, -5, 0],
            boxShadow: [
              '0 4px 8px rgba(0, 0, 0, 0.2)',
              '0 8px 16px rgba(0, 0, 0, 0.3)',
              '0 4px 8px rgba(0, 0, 0, 0.2)'
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'loop'
          }}
        >
          Play Now
        </PlayNowButton>
      </LoginContainer>
    );
  }, [handleAnonymousSignIn]);

  return (
    <GameContainer>
      <h1>Multiplayer Crash Game</h1>

      <AnimatePresence>
        {message && (
          <MessageContainer
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {message}
          </MessageContainer>
        )}
      </AnimatePresence>

      {initError && renderError()}

      {user ? (
        <>
          <GameHeader>
            <UserInfo>
              <Username>{username}</Username>
              <Balance>Balance: ${userInfo?.balance.toFixed(2) || '0.00'}</Balance>
            </UserInfo>
            {renderRecentResults()}
          </GameHeader>

          <GameArea
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <GraphContainer>
              <CrashGraph
                gameState={gameState || {
                  status: 'waiting',
                  currentMultiplier: 1,
                  crashPoint: 1,
                  startTime: null
                }}
                width={window.innerWidth > 768 ? 600 : window.innerWidth - 40}
                height={300}
              />

              {countdownTimer !== null && (
                <CountdownOverlay
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Game starting in {countdownTimer}s
                </CountdownOverlay>
              )}

              {gameState?.status === 'waiting' && (
                <GameStats>
                  <div className="player-count">
                    <GreenDot></GreenDot> Players: {gameState?.players ? Object.keys(gameState.players).length : 0}
                  </div>
                  <div className="next-round">
                    {countdownTimer !== null ? `Next round in: ${countdownTimer}s` : 'Waiting for bets'}
                  </div>
                </GameStats>
              )}

              {gameState?.status === 'running' && (
                <GameStats>
                  <div className="player-count">
                    <GreenDot></GreenDot> Players: {gameState?.players ? Object.keys(gameState.players).length : 0}
                  </div>
                </GameStats>
              )}

              {gameState?.status === 'crashed' && (
                <GameStats>
                  <div className="player-count">
                    <GreenDot></GreenDot> Players: {gameState?.players ? Object.keys(gameState.players).length : 0}
                  </div>
                  <div className="cashout-stats">
                    {(() => {
                      const players = gameState?.players || {};
                      const totalPlayers = Object.keys(players).length;

                      if (totalPlayers === 0) return "0% of players cashed out";

                      const cashedOutPlayers = Object.values(players).filter(
                        (p: any) => p.cashoutMultiplier !== null
                      ).length;

                      const percentage = Math.round((cashedOutPlayers / totalPlayers) * 100);
                      return `${percentage}% of players cashed out`;
                    })()}
                  </div>
                </GameStats>
              )}
            </GraphContainer>

            {renderPlayerStatus()}
            {renderBetControls()}
          </GameArea>

          {renderPlayers()}
        </>
      ) : (
        renderAnonymousLoginButton()
      )}
    </GameContainer>
  );
};

export default CrashGame;