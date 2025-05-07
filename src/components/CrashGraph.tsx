// src/components/CrashGraph.tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface CrashGraphProps {
    gameState: {
        status: 'waiting' | 'running' | 'crashed';
        currentMultiplier: number;
        crashPoint: number;
        startTime: number | null;
    };
    width?: number;
    height?: number;
}

const CrashGraph: React.FC<CrashGraphProps> = ({
    gameState,
    width = 600,
    height = 300
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [points, setPoints] = useState<{ x: number, y: number }[]>([]);
    const animationRef = useRef<number | null>(null);

    // Clear graph when game resets
    useEffect(() => {
        if (gameState.status === 'waiting') {
            setPoints([]);
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, width, height);
                }
            }
        }
    }, [gameState.status, width, height]);

    // Update graph when game is running
    useEffect(() => {
        if (gameState.status !== 'running' || !gameState.startTime) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Drawing function
        const drawGraph = () => {
            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Calculate time elapsed
            const now = Date.now();
            const elapsed = (now - gameState.startTime!) / 1000; // time in seconds
            const maxTime = 45; // Max time in seconds (x-axis)
            const maxMultiplier = 15; // Max multiplier (y-axis)

            // Calculate new point
            const x = (elapsed / maxTime) * width;
            const y = height - (gameState.currentMultiplier / maxMultiplier) * height;

            const newPoints = [...points, { x, y }];
            setPoints(newPoints);

            // Draw coordinate system
            ctx.strokeStyle = '#4E5563'; // Light grey
            ctx.lineWidth = 1;

            // Draw horizontal lines (multiplier values)
            const yStep = height / 7; // 7 lines for multipliers
            ctx.beginPath();
            for (let i = 0; i <= 7; i++) {
                const yPos = height - (i * yStep);
                ctx.moveTo(0, yPos);
                ctx.lineTo(width, yPos);

                // Label the multiplier values
                ctx.fillStyle = '#999999'; // Text tertiary
                ctx.font = '12px Arial';
                ctx.fillText(`${(i * maxMultiplier / 7).toFixed(1)}x`, 5, yPos - 5);
            }
            ctx.stroke();

            // Draw vertical lines (time values)
            const xStep = width / 5; // 5 lines for time values
            ctx.beginPath();
            for (let i = 0; i <= 5; i++) {
                const xPos = i * xStep;
                ctx.moveTo(xPos, 0);
                ctx.lineTo(xPos, height);

                // Label the time values
                ctx.fillStyle = '#999999'; // Text tertiary
                ctx.font = '12px Arial';
                ctx.fillText(`${(i * maxTime / 5).toFixed(1)}s`, xPos + 5, height - 5);
            }
            ctx.stroke();

            // Draw crash curve
            if (newPoints.length > 1) {
                ctx.beginPath();
                ctx.moveTo(newPoints[0].x, newPoints[0].y);

                for (let i = 1; i < newPoints.length; i++) {
                    ctx.lineTo(newPoints[i].x, newPoints[i].y);
                }

                // Create gradient from blue to purple
                const gradient = ctx.createLinearGradient(0, height, width, 0);
                gradient.addColorStop(0, '#0078CC'); // primaryDark
                gradient.addColorStop(0.3, '#0096FF'); // primary
                gradient.addColorStop(0.7, '#8039FF'); // secondary
                gradient.addColorStop(1, '#6A30D9'); // secondaryDark

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 3;
                ctx.stroke();
            }

            // Request next frame if game is still running
            if (gameState.status === 'running') {
                animationRef.current = requestAnimationFrame(drawGraph);
            }
        };

        // Start animation
        animationRef.current = requestAnimationFrame(drawGraph);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        };
    }, [gameState, points, width, height]);

    // Draw crashed state
    useEffect(() => {
        if (gameState.status === 'crashed' && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx && points.length > 0) {
                // Add final crash point
                const lastPoint = points[points.length - 1];

                // Draw explosion effect at crash point
                ctx.beginPath();
                ctx.arc(lastPoint.x, lastPoint.y, 10, 0, Math.PI * 2);
                ctx.fillStyle = '#F44336'; // danger
                ctx.fill();

                // Draw 'CRASHED' text
                ctx.fillStyle = '#F44336'; // danger
                ctx.font = 'bold 24px Arial';
                ctx.fillText('CRASHED!', lastPoint.x - 50, lastPoint.y - 20);
            }
        }
    }, [gameState.status, points]);

    return (
        <div className="crash-graph-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{
                    background: '#282C34', // darkGrey
                    borderRadius: '8px',
                }}
            />

            {gameState.status === 'waiting' && (
                <motion.div
                    className="waiting-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: 'rgba(0, 0, 0, 0.5)',
                        borderRadius: '8px',
                        color: '#FFFFFF', // textPrimary
                        fontSize: '24px',
                        fontWeight: 'bold',
                    }}
                >
                    WAITING FOR NEXT ROUND
                </motion.div>
            )}

            {gameState.status === 'running' && (
                <motion.div
                    className="multiplier-display"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: gameState.currentMultiplier > 5 ? '#A66FFF' : '#0096FF', // secondaryLight : primary
                        fontSize: `${Math.min(80, 40 + gameState.currentMultiplier * 2)}px`,
                        fontWeight: 'bold',
                        textShadow: `0 0 10px ${gameState.currentMultiplier > 5 ? 'rgba(166, 111, 255, 0.4)' : 'rgba(0, 150, 255, 0.4)'}`,
                    }}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{
                        scale: Math.min(1.2, 1 + (gameState.currentMultiplier - 1) * 0.05),
                        opacity: 1
                    }}
                >
                    {gameState.currentMultiplier.toFixed(2)}x
                </motion.div>
            )}

            {gameState.status === 'crashed' && (
                <motion.div
                    className="crash-display"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                >
                    <motion.div
                        style={{
                            backgroundColor: '#F44336', // danger
                            padding: '10px 20px',
                            borderRadius: '8px',
                            color: '#FFFFFF', // textPrimary
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ fontSize: '20px' }}>CRASHED!</div>
                        <motion.div
                            style={{ fontSize: '48px', fontWeight: 'bold' }}
                            animate={{
                                scale: [1, 1.2, 1],
                                color: ['#F44336', '#FF9800', '#F44336']
                            }}
                            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                        >
                            {gameState.crashPoint.toFixed(2)}x
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default CrashGraph;