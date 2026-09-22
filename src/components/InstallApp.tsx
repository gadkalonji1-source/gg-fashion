"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Platform = "android" | "ios" | "other";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent || "";
  const iOS =
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (iOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function useAppInstall() {
  const [platform, setPlatform] = useState<Platform>("other");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const syncStandalone = () => setStandalone(isStandalone());
    syncStandalone();

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", syncStandalone);
    displayMode.addEventListener("change", syncStandalone);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", syncStandalone);
      displayMode.removeEventListener("change", syncStandalone);
    };
  }, []);

  const canNativeInstall = Boolean(deferred) && !standalone;

  async function installNative() {
    if (!deferred) {
      setManualOpen(true);
      return;
    }
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  return {
    platform,
    canNativeInstall,
    iosOpen,
    setIosOpen,
    manualOpen,
    setManualOpen,
    installNative,
    visible: !standalone,
  };
}

export function InstallAppButton({
  onNative,
  onFallback,
  mode,
}: {
  mode: "native" | "fallback";
  onNative: () => void;
  onFallback: () => void;
}) {
  return (
    <button
      type="button"
      onClick={mode === "native" ? onNative : onFallback}
      className="w-full border border-[#C85A32] bg-[#C85A32] px-4 py-3.5 text-[0.78rem] uppercase tracking-[0.16em] text-white transition hover:border-[#B85028] hover:bg-[#B85028]"
    >
      {mode === "native" ? "Télécharger l'application" : "Ajouter à l'écran d'accueil"}
    </button>
  );
}

export function IosInstallModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-4 sm:items-center">
      <div className="w-full max-w-md border border-[#D4AF37]/70 bg-[#1A1A1A] p-7 text-[#F4E3E5] shadow-2xl">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[#C85A32]">iPhone · Safari</p>
        <h2 className="mt-3 font-serif text-3xl italic text-white">Ajouter à l'écran d'accueil</h2>
        <p className="mt-5 text-base leading-7 text-[#F4E3E5]">
          Appuyez sur le bouton Partager ⎘ puis sur « Sur l'écran d'accueil » ➕.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-7 w-full border border-[#C85A32] bg-[#C85A32] px-4 py-3 text-[0.78rem] uppercase tracking-[0.16em] text-white"
        >
          Compris
        </button>
      </div>
    </div>
  );
}

export function ManualInstallModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-[#D4AF37]/35 bg-[#1A1A1A] p-7 text-[#F4E3E5] shadow-2xl">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[#C85A32]">
          Installation
        </p>
        <h2 className="mt-3 font-serif text-3xl italic text-white">
          Installer G.G FASHION
        </h2>
        <p className="mt-5 text-base leading-7">
          Ouvrez le menu ⋮ de votre navigateur, puis choisissez « Installer
          l'application » ou « Ajouter à l'écran d'accueil ».
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-7 w-full bg-[#C85A32] px-4 py-3 text-[0.78rem] uppercase tracking-[0.16em] text-white"
        >
          Compris
        </button>
      </div>
    </div>
  );
}

export function PWAInstallBanner() {
  const pathname = usePathname();
  const install = useAppInstall();

  if (pathname !== "/" || !install.visible) return null;

  const useNativePrompt = install.canNativeInstall;
  const openFallback = () => {
    if (install.platform === "ios") install.setIosOpen(true);
    else install.setManualOpen(true);
  };
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#D4AF37]/30 bg-[#1A1A1A]/95 px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.18)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="hidden sm:block">
            <p className="font-serif text-lg text-white">G.G FASHION dans votre poche</p>
            <p className="text-sm text-[#F4E3E5]/70">Accès rapide à toute la collection.</p>
          </div>
          <div className="w-full sm:w-auto sm:min-w-72">
            <InstallAppButton
              mode={useNativePrompt ? "native" : "fallback"}
              onNative={() => void install.installNative()}
              onFallback={openFallback}
            />
          </div>
        </div>
      </div>
      <IosInstallModal
        open={install.iosOpen}
        onClose={() => install.setIosOpen(false)}
      />
      <ManualInstallModal
        open={install.manualOpen}
        onClose={() => install.setManualOpen(false)}
      />
    </>
  );
}
