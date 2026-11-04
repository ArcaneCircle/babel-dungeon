import { useState, useCallback } from "react";
import { LANGUAGES } from "~/lib/constants";
import { TEXT_SECONDARY } from "~/lib/theme";
import { _, langName } from "~/lib/i18n";
import { importGame, selectLanguage } from "~/lib/game";

import NoDragImg from "~/components/NoDragImg";
import MenuButton from "~/components/MenuButton";
import { ModalContext } from "~/components/modals/Modal";
import InvalidBackupModal from "~/components/modals/InvalidBackupModal";

const containerStyle = {
  display: "flex",
  flexDirection: "column" as "column",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  padding: "0 2em",
  gap: "2em",
};

const titleStyle = {
  fontSize: "2em",
  textAlign: "center" as "center",
  marginBottom: "1em",
};

const buttonContainerStyle = {
  display: "flex",
  flexDirection: "column" as "column",
  gap: "1em",
  width: "100%",
  maxWidth: "400px",
};

const buttonStyle = {
  fontSize: "1.2em",
  padding: "1em 2em",
};

const versionStyle = {
  position: "fixed" as "fixed",
  bottom: "1em",
  right: "1em",
  fontSize: "0.75rem",
  color: TEXT_SECONDARY,
};

export default function Welcome() {
  const [stage, setStage] = useState<"initial" | "language" | "known">(
    "initial",
  );
  const [learn, setLearn] = useState("");
  const [showInvalidBackup, setShowInvalidBackup] = useState(false);

  const onNewGame = useCallback(() => {
    setStage("language");
  }, []);

  const onSelectLearn = useCallback((code: string) => {
    setLearn(code);
    setStage("known");
  }, []);

  const onImportGame = useCallback(async () => {
    const [file] = await window.webxdc.importFiles({ extensions: [".bak"] });
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target) {
        if (!importGame(e.target.result as string)) {
          setShowInvalidBackup(true);
        }
      }
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  const setOpen = useCallback((show: boolean) => {
    if (!show) setShowInvalidBackup(false);
  }, []);

  return (
    <>
      <ModalContext.Provider value={{ isOpen: showInvalidBackup, setOpen }}>
        {showInvalidBackup && <InvalidBackupModal />}
      </ModalContext.Provider>
      <div style={containerStyle}>
        {stage === "initial" ? (
          <>
            <NoDragImg src="icon.png" style={{ width: "8em" }} />
            <div style={titleStyle}>Babel Dungeon</div>

            <div style={buttonContainerStyle}>
              <MenuButton style={buttonStyle} onClick={onNewGame}>
                {_("New Game")}
              </MenuButton>
              <MenuButton style={buttonStyle} onClick={onImportGame}>
                {_("Import Game")}
              </MenuButton>
            </div>
            <span style={versionStyle}>{__APP_VERSION__}</span>
          </>
        ) : stage === "language" ? (
          <div style={buttonContainerStyle}>
            <div style={{ textAlign: "center", marginBottom: "1em" }}>
              {_("What language do you want to learn?")}
            </div>
            {Object.keys(LANGUAGES).map((code) => (
              <MenuButton
                key={code}
                style={buttonStyle}
                onClick={() => onSelectLearn(code)}
              >
                {langName(code)}
              </MenuButton>
            ))}
          </div>
        ) : (
          <div style={buttonContainerStyle}>
            <div style={{ textAlign: "center", marginBottom: "1em" }}>
              {_("What language do you already speak?")}
            </div>
            {LANGUAGES[learn].map((code) => (
              <MenuButton
                key={code}
                style={buttonStyle}
                onClick={() => selectLanguage(`${learn}-${code}`)}
              >
                {langName(code)}
              </MenuButton>
            ))}
            <MenuButton
              style={buttonStyle}
              onClick={() => setStage("language")}
            >
              {_("Back")}
            </MenuButton>
          </div>
        )}
      </div>
    </>
  );
}
