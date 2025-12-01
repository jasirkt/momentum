'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type DailyProgressProps = {
    totalHabits: number;
    completedHabits: number;
};

export default function DailyProgress({ totalHabits, completedHabits }: DailyProgressProps) {
    const [percentage, setPercentage] = useState(0);

    useEffect(() => {
        if (totalHabits === 0) {
            setPercentage(0);
        } else {
            setPercentage(Math.round((completedHabits / totalHabits) * 100));
        }
    }, [totalHabits, completedHabits]);

    const getMotivationalMessage = (pct: number) => {
        if (pct === 0) return "Let's get started!";
        if (pct < 50) return "Good start, keep going!";
        if (pct < 100) return "Almost there!";
        return "You're unstoppable!";
    };

    // Circle configuration
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between mb-8 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            <div className="z-10">
                <h2 className="text-2xl font-bold text-white mb-1">Daily Focus</h2>
                <p className="text-gray-400 text-sm mb-4">{getMotivationalMessage(percentage)}</p>
                <div className="text-3xl font-bold text-indigo-400">
                    {completedHabits}<span className="text-gray-500 text-xl font-normal">/{totalHabits}</span>
                </div>
            </div>

            <div className="relative w-32 h-32 flex items-center justify-center z-10">
                {/* Background Circle */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-800"
                    />
                    {/* Progress Circle */}
                    <motion.circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-indigo-500 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{percentage}%</span>
                </div>
            </div>
        </div>
    );
}
