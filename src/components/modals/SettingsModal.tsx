import { useState, useContext, useCallback } from "react";

import { _ } from "~/lib/i18n";
import {
  getSFXEnabled,
  setSFXEnabled,
  getTTSEnabled,
  setTTSEnabled,
  getPixelFontEnabled,
  setPixelFontEnabled,
  exportBackup,
} from "~/lib/storage";
import { applyPixelFont } from "~/lib/theme";

import MenuPreference from "~/components/MenuPreference";
import MenuButton from "~/components/MenuButton";
import ConfirmModal from "~/components/modals/ConfirmModal";
import { ModalContext } from "~/components/modals/Modal";

interface Props {
  onShowCredits: () => void;
  [key: string]: any;
}

function MenuItem({ children }: { children: React.ReactNode }) {
  return <div style={{ marginTop: "1em" }}>{children}</div>;
}

export default function SettingsModal({ onShowCredits, ...props }: Props) {
  const { setOpen } = useContext(ModalContext);
  const [sfxEnabled, setSFX] = useState(getSFXEnabled());
  const [ttsEnabled, setTTS] = useState(getTTSEnabled());
  const [pixelFontEnabled, setPixelFont] = useState(getPixelFontEnabled());

  const toggleSFX = () => {
    setSFX((enabled) => {
      enabled = !enabled;
      setSFXEnabled(enabled);
      return enabled;
    });
  };
  const toggleTTS = () => {
    setTTS((enabled) => {
      enabled = !enabled;
      setTTSEnabled(enabled);
      return enabled;
    });
  };
  const togglePixelFont = () => {
    setPixelFont((enabled) => {
      enabled = !enabled;
      setPixelFontEnabled(enabled);
      applyPixelFont(enabled);
      return enabled;
    });
  };

  const onBackup = useCallback(async () => {
    const backup = await exportBackup();
    window.webxdc.sendToChat({
      file: {
        name: `babel-dungeon.${backup.lang}.bak`,
        plainText: JSON.stringify(backup),
      },
    });
    setOpen(false);
  }, [setOpen]);

  const sfxState = _(sfxEnabled ? "[ ON]" : "[OFF]");
  const ttsState = _(ttsEnabled ? "[ ON]" : "[OFF]");
  const pixelFontState = _(pixelFontEnabled ? "[ ON]" : "[OFF]");

  return (
    <ConfirmModal {...props}>
      <div>
        <div style={{ marginBottom: "2em" }}>
          {_("SETTINGS")}
          <hr />
        </div>
        <MenuItem>
          <MenuPreference
            name={_("SFX")}
            state={sfxState}
            onClick={toggleSFX}
          />
        </MenuItem>
        <MenuItem>
          <MenuPreference
            name={_("TTS")}
            state={ttsState}
            onClick={toggleTTS}
          />
        </MenuItem>
        <MenuItem>
          <MenuPreference
            name={_("PIXEL FONT")}
            state={pixelFontState}
            onClick={togglePixelFont}
          />
        </MenuItem>
        <MenuItem>
          <MenuButton onClick={onBackup}>{_("Export Game")}</MenuButton>
        </MenuItem>
        <MenuItem>
          <MenuButton onClick={onShowCredits}>{_("Credits")}</MenuButton>
        </MenuItem>
      </div>
    </ConfirmModal>
  );
}
