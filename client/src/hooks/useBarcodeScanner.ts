import { useEffect, useRef, useState } from 'react';

/**
 * Hook to listen for barcode scanner input.
 * Scanners usually act as keyboards: they type characters rapidly and end with 'Enter'.
 */
export const useBarcodeScanner = (
    onScan: (code: string) => void,
    options: {
        minChars?: number;
        maxDelay?: number; // Max delay between keystrokes to consider it a scan
    } = {}
) => {
    const { minChars = 3, maxDelay = 100 } = options;
    const buffer = useRef<string>('');
    const lastKeyTime = useRef<number>(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const now = Date.now();

            // If too much time passed since last keystroke, reset buffer
            // unless logic indicates we should keep it? 
            // Usually scanners are super fast. < 50-100ms per char.
            if (now - lastKeyTime.current > maxDelay && buffer.current.length > 0) {
                // Reset buffer if typing is too slow (probably manual typing)
                // But wait, if user is typing manually in an input, we shouldn't interfere?
                // Usually we want to ignore events if an input is focused, UNLESS we specifically want global scan.
                // Let's assume global scan acts ANYWHERE unless preventDefault logic is used.
                // However, distinguishing manual typing vs scanner is done via speed.
                buffer.current = '';
            }

            lastKeyTime.current = now;

            if (e.key === 'Enter') {
                if (buffer.current.length >= minChars) {
                    // It's likely a scan
                    e.preventDefault(); // Prevent submitting forms if any
                    onScan(buffer.current);
                    buffer.current = '';
                } else {
                    buffer.current = ''; // Reset if too short
                }
            } else if (e.key.length === 1) {
                // Printable characters
                buffer.current += e.key;
            } else {
                // Non-printable might reset?
                // buffer.current = ''; 
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onScan, minChars, maxDelay]);
};
