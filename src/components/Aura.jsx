import { useState, useEffect, useRef, useCallback } from "react";
import Lottie from "lottie-react";
import "../aura.css";

import aura_think_loop from "../animations/aura_think_loop";
import aura_think from "../animations/aura_think";

// Debug logging toggle for Aura component
const DEBUG_AURA = false;
const alog = (...args) => { if (DEBUG_AURA) try { console.log(...args) } catch { } };

export default function Aura({
    thinking = false,
    idleAnimation,
    idleAlternates = [],
    currentAnimation = null,
    override = false,
    style = {},
    // Programa alternancias de idle (parpadeo/estiramiento)
    idleAlternateMinDelay = 7000,
    idleAlternateMaxDelay = 12000,
    onAnimationComplete = () => { },
}) {
    const [animationData, setAnimationData] = useState(idleAnimation);
    const [isIdle, setIsIdle] = useState(true);
    const [lastIdleAnimation, setLastIdleAnimation] = useState(null);
    const [animationKey, setAnimationKey] = useState(0);
    
    const lottieRef = useRef();
    const idleTimerRef = useRef();
    const alternateTimeoutRef = useRef();
    const idleCooldownRef = useRef(false);
    
    // Track current state more precisely
    const currentStateRef = useRef({
        isThinking: false,
        hasCurrentAnimation: false,
        isInAlternateIdle: false,
        lastAnimationType: 'idle' // 'idle', 'thinking', 'response', 'alternate'
    });

    // Clear all timers
    const clearAllTimers = useCallback(() => {
        try { clearTimeout(idleTimerRef.current); } catch { }
        try { clearTimeout(alternateTimeoutRef.current); } catch { }
    }, []);

    // Handle thinking state - this should show aura_think first, then aura_think_loop
    useEffect(() => {
        if (thinking && !currentStateRef.current.isThinking) {
            alog("Starting thinking animation");
            clearAllTimers();
            setIsIdle(false);
            currentStateRef.current.isThinking = true;
            currentStateRef.current.lastAnimationType = 'thinking';
            // Don't set think_loop here - let parent control the initial think animation
        } else if (!thinking && currentStateRef.current.isThinking) {
            alog("Stopping thinking animation");
            currentStateRef.current.isThinking = false;
            // Don't reset to idle here - let the response animation or completion handler handle it
        }
    }, [thinking, clearAllTimers]);

    // Handle current animation changes (like aura_think, aura_got_it, aura_error)
    useEffect(() => {
        if (currentAnimation) {
            alog("Setting current animation:", currentAnimation);
            clearAllTimers();
            setAnimationData(currentAnimation);
            setAnimationKey(k => k + 1);
            setIsIdle(false);
            currentStateRef.current.hasCurrentAnimation = true;
            currentStateRef.current.lastAnimationType = 'response';
            // Evita que una alterna arranque durante o inmediatamente después
            idleCooldownRef.current = true;
            try { clearTimeout(alternateTimeoutRef.current); } catch { }
            alternateTimeoutRef.current = setTimeout(() => {
                idleCooldownRef.current = false;
            }, 2000);
            
            // If this is the thinking animation, we should transition to think_loop after it completes
            if (currentAnimation === aura_think) {
                currentStateRef.current.isThinking = true;
            }
        }
    }, [currentAnimation, clearAllTimers]);

    // Handle animation completion
    const handleComplete = useCallback(() => {
        alog("Animation completed, current state:", currentStateRef.current);
        
        onAnimationComplete();
        
        // If we were in thinking mode and just finished the initial think animation,
        // transition to think_loop
        if (currentStateRef.current.isThinking && currentStateRef.current.lastAnimationType === 'response') {
            alog("Transitioning to think loop");
            setAnimationData(aura_think_loop);
            setAnimationKey(k => k + 1);
            setIsIdle(false);
            currentStateRef.current.lastAnimationType = 'thinking';
            currentStateRef.current.hasCurrentAnimation = false; // think_loop is not a "current animation"
            return;
        }
        
        // For all other cases, return to idle
        if (!currentStateRef.current.isThinking) {
            setAnimationData(idleAnimation);
            setAnimationKey(k => k + 1);
            setIsIdle(true);
            currentStateRef.current.hasCurrentAnimation = false;
            currentStateRef.current.lastAnimationType = 'idle';
            currentStateRef.current.isInAlternateIdle = false;
            // Programar próximo alternate tras volver al idle base
            try {
                clearTimeout(idleTimerRef.current);
                const min = Math.max(1000, idleAlternateMinDelay);
                const max = Math.max(min + 1000, idleAlternateMaxDelay);
                const delay = 1200 + Math.floor(Math.random() * (max - min + 1)) + min;
                idleTimerRef.current = setTimeout(() => {
                    if (!currentStateRef.current.isThinking && !currentStateRef.current.hasCurrentAnimation) {
                        let nextAnimation;
                        if (Array.isArray(idleAlternates) && idleAlternates.length > 0) {
                            do {
                                nextAnimation = idleAlternates[Math.floor(Math.random() * idleAlternates.length)];
                            } while (nextAnimation === lastIdleAnimation && idleAlternates.length > 1);
                        } else {
                            nextAnimation = idleAnimation;
                        }
                        setLastIdleAnimation(nextAnimation);
                        setAnimationData(nextAnimation);
                        setAnimationKey(k => k + 1);
                        currentStateRef.current.isInAlternateIdle = true;
                        currentStateRef.current.lastAnimationType = 'alternate';
                    }
                }, delay);
            } catch { }
        }
    }, [onAnimationComplete, idleAnimation, idleAlternates, idleAlternateMinDelay, idleAlternateMaxDelay, lastIdleAnimation]);

    // Programador de alternas centralizado
    const scheduleAlternate = useCallback(() => {
        try { clearTimeout(idleTimerRef.current); } catch {}
        const min = Math.max(500, idleAlternateMinDelay);
        const max = Math.max(min + 500, idleAlternateMaxDelay);
        const base = Math.floor(Math.random() * (max - min + 1)) + min;
        const cooldown = idleCooldownRef.current ? 1200 : 0;
        const delay = base + cooldown;
        idleTimerRef.current = setTimeout(() => {
            if (!isIdle || currentStateRef.current.isThinking || currentStateRef.current.hasCurrentAnimation) return;
            if (!Array.isArray(idleAlternates) || idleAlternates.length === 0) return;

            let nextAnimation;
            do {
                nextAnimation = idleAlternates[Math.floor(Math.random() * idleAlternates.length)];
            } while (nextAnimation === lastIdleAnimation && idleAlternates.length > 1);

            setLastIdleAnimation(nextAnimation);
            setAnimationData(nextAnimation);
            setIsIdle(false);
            setAnimationKey(k => k + 1);
            currentStateRef.current.isInAlternateIdle = true;
            currentStateRef.current.lastAnimationType = 'alternate';
        }, delay);
    }, [isIdle, idleAlternates, idleAnimation, idleAlternateMinDelay, idleAlternateMaxDelay]);

    // Arranca programador cuando entramos a idle
    useEffect(() => {
        if (isIdle && !currentStateRef.current.isThinking && !currentStateRef.current.hasCurrentAnimation) {
            scheduleAlternate();
        }
        return () => clearAllTimers();
    }, [isIdle, scheduleAlternate, clearAllTimers]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearAllTimers();
        };
    }, [clearAllTimers]);

    return (
        <div
            className="aura-float"
            style={{
                position: "absolute",
                width: "600px",
                height: "600px",
                pointerEvents: "none",
                ...style,
            }}
        >
            <Lottie
                key={animationKey}
                lottieRef={lottieRef}
                animationData={animationData}
                loop={(animationData === idleAnimation) || (currentStateRef.current.isThinking && animationData === aura_think_loop)}
                autoplay={true}
                onComplete={handleComplete}
            />
        </div>
    );
}
