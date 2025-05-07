import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { theme } from '../styles/theme';

interface CrashCurveProps {
    currentMultiplier: number;
    status: 'waiting' | 'running' | 'crashed';
    startTime: number | null;
    crashPoint?: number;
}

const CrashCurve: React.FC<CrashCurveProps> = ({
    currentMultiplier,
    status,
    startTime,
    crashPoint
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const pathRef = useRef<SVGPathElement>(null);
    const frameRef = useRef<number | null>(null);
    const pointsRef = useRef<{ x: number, y: number }[]>([]);

    // Reset on new game
    useEffect(() => {
        if (status === 'waiting') {
            pointsRef.current = [];
            if (pathRef.current) {
                pathRef.current.setAttribute('d', '');
            }
        }
    }, [status]);

    // Animation effect for curve drawing
    useEffect(() => {
        if (status !== 'running' || !startTime) {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
                frameRef.current = null;
            }
            return;
        }

        const animate = () => {
            if (!svgRef.current || !pathRef.current) {
                frameRef.current = requestAnimationFrame(animate);
                return;
            }

            const svgWidth = svgRef.current.clientWidth;
            const svgHeight = svgRef.current.clientHeight;

            // Calculate maximum display values
            const maxY = 7; // Max multiplier to display
            const maxX = 20; // Seconds

            // Calculate elapsed time
            const now = Date.now();
            const elapsed = (now - startTime) / 1000; // Seconds

            // Calculate point positions relative to SVG
            const x = Math.min((elapsed / maxX) * svgWidth, svgWidth);
            const y = svgHeight - ((currentMultiplier / maxY) * svgHeight);

            // Add new point
            pointsRef.current.push({ x, y });

            // Limit points to keep performance good
            if (pointsRef.current.length > 100) {
                pointsRef.current = pointsRef.current.slice(-100);
            }

            // Generate path data
            let pathData = '';

            if (pointsRef.current.length > 0) {
                pathData = `M ${pointsRef.current[0].x},${svgHeight} `;
                pathData += `L ${pointsRef.current[0].x},${pointsRef.current[0].y} `;

                for (let i = 1; i < pointsRef.current.length; i++) {
                    pathData += `L ${pointsRef.current[i].x},${pointsRef.current[i].y} `;
                }
            }

            // Update path
            pathRef.current.setAttribute('d', pathData);

            // Continue animation
            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
                frameRef.current = null;
            }
        };
    }, [currentMultiplier, status, startTime]);

    // Grid lines for visual reference
    const gridLines = () => {
        const lines = [];
        const maxY = 7; // Max multiplier line to display

        // Horizontal multiplier lines
        for (let i = 0; i <= maxY; i++) {
            const y = 100 - (i / maxY) * 100;
            lines.push(
                <line
                    key={`h-${i}`}
                    x1="0%"
                    y1={`${y}%`}
                    x2="100%"
                    y2={`${y}%`}
                    stroke={theme.colors.lightGrey}
                    strokeWidth="1"
                    strokeDasharray={i === 0 ? "none" : "5,5"}
                />
            );

            // Labels
            lines.push(
                <text
                    key={`h-text-${i}`}
                    x="5"
                    y={`${y - 5}%`}
                    fill={theme.colors.textSecondary}
                    fontSize="12"
                >
                    {i}x
                </text>
            );
        }

        // Vertical time lines
        for (let i = 0; i <= 5; i++) {
            const x = (i / 5) * 100;
            lines.push(
                <line
                    key={`v-${i}`}
                    x1={`${x}%`}
                    y1="0%"
                    x2={`${x}%`}
                    y2="100%"
                    stroke={theme.colors.lightGrey}
                    strokeWidth="1"
                    strokeDasharray="5,5"
                />
            );

            // Labels
            lines.push(
                <text
                    key={`v-text-${i}`}
                    x={`${x + 1}%`}
                    y="98%"
                    fill={theme.colors.textSecondary}
                    fontSize="12"
                >
                    {i * 4}s
                </text>
            );
        }

        return lines;
    };

    return (
        <div className="crash-curve" style={{ width: '100%', height: '100%', position: 'relative' }}>
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{
                    backgroundColor: theme.colors.darkGrey,
                    borderRadius: theme.borderRadius,
                    overflow: 'hidden'
                }}
            >
                {/* Grid */}
                {gridLines()}

                {/* Crash curve */}
                <path
                    ref={pathRef}
                    d=""
                    fill="none"
                    stroke="url(#curveGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Gradient definition */}
                <defs>
                    <linearGradient id="curveGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={theme.colors.primary} />
                        <stop offset="50%" stopColor={theme.colors.warning} />
                        <stop offset="100%" stopColor={theme.colors.danger} />
                    </linearGradient>
                </defs>
            </svg>

            {/* Display elements based on game state */}
            {status === 'waiting' && (
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
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: theme.borderRadius,
                        color: theme.colors.textPrimary,
                        fontSize: '24px',
                        fontWeight: 'bold',
                    }}
                >
                    WAITING FOR NEXT ROUND
                </motion.div>
            )}

            {status === 'running' && (
                <motion.div
                    className="multiplier-display"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: currentMultiplier > 5 ? theme.colors.secondaryLight : theme.colors.primary,
                        fontSize: `${Math.min(80, 40 + currentMultiplier * 2)}px`,
                        fontWeight: 'bold',
                        textShadow: `0 0 10px ${currentMultiplier > 5 ? theme.colors.secondaryLight : theme.colors.primary}40`,
                    }}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{
                        scale: Math.min(1.2, 1 + (currentMultiplier - 1) * 0.05),
                        opacity: 1
                    }}
                >
                    {currentMultiplier.toFixed(2)}x
                </motion.div>
            )}

            {status === 'crashed' && crashPoint && (
                <motion.div
                    className="crashed-display"
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
                            backgroundColor: theme.colors.danger,
                            padding: '10px 20px',
                            borderRadius: theme.borderRadius,
                            color: theme.colors.textPrimary,
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
                            {crashPoint.toFixed(2)}x
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default CrashCurve;