import { useState, useEffect, useRef, useCallback } from "react";
import Lottie from "lottie-react";
import "../aura.css";

import aura_think_loop from "../animations/aura_think_loop";
import aura_think from "../animations/aura_think";

export default function Aura({
    thinking = false,
    idleAnimation,
    idleAlternates = [],
    currentAnimation = null,
    override = false,
    style = {},
    idleInterval = 5000,
    onAnimationComplete = () => { },
}) {
    const [animationData, setAnimationData] = useState(idleAnimation);
    const [isIdle, setIsIdle] = useState(true);
    const [lastIdleAnimation, setLastIdleAnimation] = useState(null);
    const [animationKey, setAnimationKey] = useState(0);
    
    const lottieRef = useRef();
    const idleTimerRef = useRef();
    const alternateTimeoutRef = useRef();
    
    // Track current state more precisely
    const currentStateRef = useRef({
        isThinking: false,
        hasCurrentAnimation: false,
        isInAlternateIdle: false,
        lastAnimationType: 'idle' // 'idle', 'thinking', 'response', 'alternate'
    });

    // Clear all timers
    const clearAllTimers = useCallback(() => {
        clearInterval(idleTimerRef.current);
        clearTimeout(alternateTimeoutRef.current);
    }, []);

    // Handle thinking state - this should show aura_think first, then aura_think_loop
    useEffect(() => {
        if (thinking && !currentStateRef.current.isThinking) {
            console.log("Starting thinking animation");
            clearAllTimers();
            setIsIdle(false);
            currentStateRef.current.isThinking = true;
            currentStateRef.current.lastAnimationType = 'thinking';
            // Don't set think_loop here - let parent control the initial think animation
        } else if (!thinking && currentStateRef.current.isThinking) {
            console.log("Stopping thinking animation");
            currentStateRef.current.isThinking = false;
            // Don't reset to idle here - let the response animation or completion handler handle it
        }
    }, [thinking, clearAllTimers]);

    // Handle current animation changes (like aura_think, aura_got_it, aura_error)
    useEffect(() => {
        if (currentAnimation) {
            console.log("Setting current animation:", currentAnimation);
            clearAllTimers();
            setAnimationData(currentAnimation);
            setAnimationKey(k => k + 1);
            setIsIdle(false);
            currentStateRef.current.hasCurrentAnimation = true;
            currentStateRef.current.lastAnimationType = 'response';
            
            // If this is the thinking animation, we should transition to think_loop after it completes
            if (currentAnimation === aura_think) {
                currentStateRef.current.isThinking = true;
            }
        }
    }, [currentAnimation, clearAllTimers]);

    // Handle animation completion
    const handleComplete = useCallback(() => {
        console.log("Animation completed, current state:", currentStateRef.current);
        
        onAnimationComplete();
        
        // If we were in thinking mode and just finished the initial think animation,
        // transition to think_loop
        if (currentStateRef.current.isThinking && currentStateRef.current.lastAnimationType === 'response') {
            console.log("Transitioning to think loop");
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
        }
    }, [onAnimationComplete, idleAnimation]);

    // Idle alternates system - only runs when truly idle and not thinking
    useEffect(() => {
        const shouldRunIdleAlternates = 
            isIdle && 
            !currentStateRef.current.isThinking && 
            !currentStateRef.current.hasCurrentAnimation &&
            idleAlternates.length > 0;

        console.log("Idle alternates check:", { 
            isIdle, 
            isThinking: currentStateRef.current.isThinking,
            hasCurrentAnimation: currentStateRef.current.hasCurrentAnimation,
            shouldRun: shouldRunIdleAlternates 
        });

        if (!shouldRunIdleAlternates) {
            clearAllTimers();
            return;
        }

        // Start with base idle
        setAnimationData(idleAnimation);
        setAnimationKey(k => k + 1);

        idleTimerRef.current = setInterval(() => {
            // Double-check we're still in idle state
            if (isIdle && 
                !currentStateRef.current.isThinking && 
                !currentStateRef.current.hasCurrentAnimation) {
                
                let nextAnimation;
                if (idleAlternates.length > 0) {
                    do {
                        nextAnimation = idleAlternates[Math.floor(Math.random() * idleAlternates.length)];
                    } while (nextAnimation === lastIdleAnimation && idleAlternates.length > 1);
                } else {
                    nextAnimation = idleAnimation;
                }

                console.log("Playing alternate idle:", nextAnimation);
                setLastIdleAnimation(nextAnimation);
                setAnimationData(nextAnimation);
                setAnimationKey(k => k + 1);
                currentStateRef.current.isInAlternateIdle = true;
                currentStateRef.current.lastAnimationType = 'alternate';

                // Set timeout to return to base idle after alternate animation
                alternateTimeoutRef.current = setTimeout(() => {
                    if (currentStateRef.current.isInAlternateIdle && 
                        !currentStateRef.current.isThinking && 
                        !currentStateRef.current.hasCurrentAnimation) {
                        console.log("Returning to base idle");
                        setAnimationData(idleAnimation);
                        setAnimationKey(k => k + 1);
                        currentStateRef.current.isInAlternateIdle = false;
                        currentStateRef.current.lastAnimationType = 'idle';
                    }
                }, 3000);
            }
        }, idleInterval);

        return () => {
            clearAllTimers();
        };
    }, [isIdle, idleAlternates, idleAnimation, idleInterval, lastIdleAnimation, clearAllTimers]);

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
                loop={currentStateRef.current.isThinking && animationData === aura_think_loop}
                autoplay={true}
                onComplete={handleComplete}
            />
        </div>
    );
}