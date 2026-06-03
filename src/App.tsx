import { useState, useMemo, useEffect } from "react";

import { initGame } from "~/lib/game";
import { getPixelFontEnabled } from "~/lib/storage";
import { applyPixelFont } from "~/lib/theme";

import Home from "~/pages/Home";
import GameSession from "~/pages/GameSession";
import Skills from "~/pages/Skills";
import Welcome from "~/pages/Welcome";

// @ts-ignore
import "@fontsource/press-start-2p";
import "./App.css";

export default function App() {
  const [session, setSession] = useState(null as Session | null);
  const [forceSession, setForceSession] = useState(false);
  const [player, setPlayer] = useState(null as Player | null);
  const [welcomeComplete, setWelcomeCompleteState] = useState(false);
  const [screen, setScreen] = useState("home" as "home" | "skills");
  useMemo(() => initGame(setSession, setPlayer, setWelcomeCompleteState), []);
  useEffect(() => applyPixelFont(getPixelFontEnabled()), []);

  const playing = session && session.pending.length + session.failed.length;

  // don't render anything if initialization hasn't finished
  if (!player) return;

  return (
    <>
      {!welcomeComplete ? (
        <Welcome />
      ) : playing || (session && forceSession) ? (
        <GameSession
          session={session}
          setShowingResults={setForceSession}
          player={player}
        />
      ) : screen === "skills" ? (
        <Skills player={player} onBack={() => setScreen("home")} />
      ) : (
        <Home player={player} onShowSkills={() => setScreen("skills")} />
      )}
    </>
  );
}
