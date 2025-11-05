import { useState, useEffect, useRef } from "react";
import Lottie from "lottie-react";
import "../aura.css";

import aura_think_loop from "../animations/aura_think_loop";

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

    // Si llega una animación nueva:
    useEffect(() => {
        if (currentAnimation) {
            // Si override = true, la cambiamos de inmediato
            // Si no, solo si está en idle
            if (override || isIdle) {
                setAnimationData(currentAnimation);
                setAnimationKey((k) => k + 1);
                setIsIdle(false);
                clearInterval(idleTimerRef.current);
            }
        }
    }, [currentAnimation, override, isIdle]);

    // Detectar cuando termina una animación
    const handleComplete = () => {
        onAnimationComplete();
        // Volvemos al idle
        if (thinking) {
            setAnimationData(aura_think_loop);
        } else {
            setAnimationData(idleAnimation);
        }
        setAnimationKey((k) => k + 1);
        setIsIdle(true);
    };

    // Ciclo de animaciones idle alternas
    useEffect(() => {
        if (isIdle && idleAlternates.length > 0) {
            clearInterval(idleTimerRef.current);

            idleTimerRef.current = setInterval(() => {
                let next = idleAnimation;
                if (idleAlternates.length > 0) {
                    do {
                        next = idleAlternates[Math.floor(Math.random() * idleAlternates.length)];
                    } while (next === lastIdleAnimation && idleAlternates.length > 1);
                }

                setLastIdleAnimation(next);
                setAnimationData(next);
                setAnimationKey((k) => k + 1);

                setTimeout(() => {
                    if (isIdle && !thinking) {
                        setAnimationData(idleAnimation);
                        setAnimationKey((k) => k + 1);
                    }
                }, 3000);
            }, idleInterval);
        }

        return () => clearInterval(idleTimerRef.current);
    }, [isIdle, idleAlternates, idleAnimation, idleInterval, animationData, lastIdleAnimation]);

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
                lottieRef={lottieRef}
                animationData={animationData}
                loop={isIdle}
                autoplay
                onComplete={handleComplete}
            />
        </div>
    );
}
