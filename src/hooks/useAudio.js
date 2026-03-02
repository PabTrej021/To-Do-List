import { useRef, useCallback } from 'react';

// Base64 short pop sound for completion
const POP_SOUND = "data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";

/**
 * Custom hook to safely play UI micro-sounds without blocking the thread
 * or throwing unhandled promises in environments that forbid auto-play.
 */
export const useAudio = () => {
    const audioRef = useRef(typeof Audio !== "undefined" ? new Audio(POP_SOUND) : null);

    const playPop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            // Catch error silently if browser blocks audio autoplay
            audioRef.current.play().catch(() => { });
        }
    }, []);

    return { playPop };
};
