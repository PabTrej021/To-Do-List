import { useCallback } from 'react';

/**
 * Custom Hook to trigger cross-platform tactile device vibrations
 * using the HTML5 Navigator API without stalling the JS thread.
 */
export const useHaptics = () => {
    const triggerPattern = useCallback((pattern) => {
        if (window.navigator && window.navigator.vibrate) {
            try {
                window.navigator.vibrate(pattern);
            } catch (e) {
                console.warn('Haptics blocked by device', e);
            }
        }
    }, []);

    const triggerSuccess = useCallback(() => triggerPattern([15, 50, 15]), [triggerPattern]);
    const triggerPop = useCallback(() => triggerPattern(20), [triggerPattern]);
    const triggerDelete = useCallback(() => triggerPattern([50, 50, 50]), [triggerPattern]);
    const triggerWarning = useCallback(() => triggerPattern([40, 40, 40, 40]), [triggerPattern]);

    return { triggerPattern, triggerSuccess, triggerPop, triggerDelete, triggerWarning };
};
