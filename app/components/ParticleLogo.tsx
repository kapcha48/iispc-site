"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import OriginkitSvgParticles from "./OriginkitSvgParticles";

const ANIMATED_LOGO_SOURCE = "/iispc-symbol-profile.png";
const STATIC_LOGO_SOURCE = "/iispc-symbol-approved-original.png";

export function ParticleLogo() {
  const [staticLogo, setStaticLogo] = useState(true);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce), (max-width: 760px)",
    );
    const syncMotionPreference = () => {
      setStaticLogo(reducedMotion.matches);
    };

    syncMotionPreference();
    reducedMotion.addEventListener("change", syncMotionPreference);

    return () => {
      reducedMotion.removeEventListener("change", syncMotionPreference);
    };
  }, []);

  return (
    <div
      className="particle-logo"
      role="img"
      aria-label="Графический знак IISPC"
    >
      {staticLogo ? (
        <Image
          className="particle-logo-static"
          src={STATIC_LOGO_SOURCE}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          width={800}
          height={800}
          sizes="(max-width: 760px) 70vw, 320px"
          unoptimized
        />
      ) : (
        <div className="particle-logo-motion" aria-hidden="true">
          <OriginkitSvgParticles
            backgroundColor="transparent"
            imageConfig={{
              image: ANIMATED_LOGO_SOURCE,
              mode: "fit",
              sizeUnit: "%",
              widthPx: 800,
              heightPx: 460,
              widthPct: 100,
              heightPct: 100,
              scale: 6.7,
            }}
            particleCount={90}
            particleSize={4}
            particleShape="circle"
            particleColor="gradient"
            gradientColors={["#c43a9f", "#62656c"]}
            hoverEnabled
            hoverConfig={{
              hoverType: "roam",
              transition: { duration: 0.9, ease: "easeInOut" },
              roamWidth: 0,
              roamHeight: 0,
              roamShape: "oval",
              roamOpacity: 0.34,
              hideType: "scatter",
            }}
            repulsionEnabled
            repulsionConfig={{
              repulsionMode: "outside",
              repulsionForce: 8,
              repulsionRadius: 58,
            }}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      )}
      <noscript>
        <Image src={STATIC_LOGO_SOURCE} alt="Графический знак IISPC" width={800} height={800} unoptimized />
      </noscript>
    </div>
  );
}
