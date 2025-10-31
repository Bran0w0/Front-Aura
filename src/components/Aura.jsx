import { useState, useEffect, useRef } from "react";
import Lottie from "lottie-react";
import "../aura.css";

export default function Aura({
    idleAnimation,
    currentAnimation = null,
    override = false,
    style = {},
    onAnimationComplete = () => { },
}) {
    const [animationData, setAnimationData] = useState(idleAnimation);
    const [isIdle, setIsIdle] = useState(true);
    const lottieRef = useRef();

    // Si llega una animación nueva:
    useEffect(() => {
        if (currentAnimation) {
            // Si override = true, la cambiamos de inmediato
            // Si no, solo si está en idle
            if (override || isIdle) {
                setAnimationData(currentAnimation);
                setIsIdle(false);
            }
        }
    }, [currentAnimation, override, isIdle]);

    // Detectar cuando termina una animación
    const handleComplete = () => {
        onAnimationComplete();
        // Volvemos al idle
        setAnimationData(idleAnimation);
        setIsIdle(true);
    };

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
