"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export default function HomeIntroOverlay() {
  const { language } = useLanguage();
  const [phase, setPhase] = useState("enter");
  const [visible, setVisible] = useState(true);
  const isEnglish = language === "EN";

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealDelay = reduceMotion ? 250 : 1900;
    const exitDelay = reduceMotion ? 120 : 850;

    document.body.classList.add("intro-lock");
    const revealTimer = window.setTimeout(() => setPhase("exit"), revealDelay);
    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      document.body.classList.remove("intro-lock");
    }, revealDelay + exitDelay);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(hideTimer);
      document.body.classList.remove("intro-lock");
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`home-intro ${phase === "exit" ? "is-exit" : ""}`} aria-hidden="true">
      <div className="home-intro-panel">
        <div className="home-intro-crest">
          <div className="home-intro-ring">
            <span className="home-intro-mark">A</span>
          </div>
          <div className="home-intro-line left" />
          <div className="home-intro-line right" />
          <div className="home-intro-ornament top" />
          <div className="home-intro-ornament bottom" />
        </div>

        <p className="home-intro-kicker">{isEnglish ? "Hotel & Spa" : "Hotel & Spa"}</p>
        <h1 className="home-intro-title">HOTEL ATLAS</h1>

        <div className="home-intro-stars">
          <span>{"\u2605"}</span>
          <span>{"\u2605"}</span>
          <span>{"\u2605"}</span>
          <span>{"\u2605"}</span>
          <span>{"\u2605"}</span>
        </div>

        <p className="home-intro-subtitle">
          {isEnglish ? "A refined retreat by the sea" : "Un refuge de caractere en bord de mer"}
        </p>
      </div>
    </div>
  );
}
