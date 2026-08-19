import type { ComponentType, SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const S = ({ children, ...rest }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    {children}
  </svg>
);

export const IcSearch = (p: P) => <S {...p}><circle cx="11" cy="11" r="7" /><path d="m20.5 20.5-4-4" /></S>;
export const IcCart = (p: P) => <S {...p}><path d="M3 4h2.2l2.2 11.2A2 2 0 0 0 9.4 17h8.8a2 2 0 0 0 2-1.6L21.6 8H6" /><circle cx="9.5" cy="20.2" r="1.3" /><circle cx="17.5" cy="20.2" r="1.3" /></S>;
export const IcHeart = (p: P) => <S {...p}><path d="M12 20.5s-7.5-4.6-9.3-9A5.2 5.2 0 0 1 12 6.6a5.2 5.2 0 0 1 9.3 4.9c-1.8 4.4-9.3 9-9.3 9Z" /></S>;
export const IcHeartFill = (p: P) => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}><path d="M12 20.8s-7.8-4.8-9.6-9.3A5.4 5.4 0 0 1 12 6.4a5.4 5.4 0 0 1 9.6 5.1C19.8 16 12 20.8 12 20.8Z" /></svg>;
export const IcUser = (p: P) => <S {...p}><circle cx="12" cy="8" r="3.6" /><path d="M4.8 20a7.4 7.4 0 0 1 14.4 0" /></S>;
export const IcMenu = (p: P) => <S {...p}><path d="M4 7h16M4 12h16M4 17h10" /></S>;
export const IcX = (p: P) => <S {...p}><path d="m6 6 12 12M18 6 6 18" /></S>;
export const IcStar = (p: P) => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9Z" /></svg>;
export const IcTruck = (p: P) => <S {...p}><path d="M2.5 6h11v10h-11zM13.5 9h4.2l2.8 3.4V16h-7" /><circle cx="7" cy="17.6" r="1.7" /><circle cx="16.6" cy="17.6" r="1.7" /></S>;
export const IcShield = (p: P) => <S {...p}><path d="M12 3 5 5.8v5.4c0 4.6 3 7.8 7 9.3 4-1.5 7-4.7 7-9.3V5.8Z" /><path d="m9 11.6 2.1 2.1L15.3 9.5" /></S>;
export const IcLock = (p: P) => <S {...p}><rect x="5" y="10.5" width="14" height="9.5" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /><circle cx="12" cy="15.2" r="1.2" fill="currentColor" stroke="none" /></S>;
export const IcCard = (p: P) => <S {...p}><rect x="2.5" y="5.5" width="19" height="13" rx="2.5" /><path d="M2.5 10h19M6.5 14.5h4" /></S>;
export const IcArrowR = (p: P) => <S {...p}><path d="M4.5 12h15M13.5 6l6 6-6 6" /></S>;
export const IcChevD = (p: P) => <S {...p}><path d="m6 9.5 6 6 6-6" /></S>;
export const IcChevL = (p: P) => <S {...p}><path d="m14.5 6-6 6 6 6" /></S>;
export const IcChevR = (p: P) => <S {...p}><path d="m9.5 6 6 6-6 6" /></S>;
export const IcPlus = (p: P) => <S {...p}><path d="M12 5v14M5 12h14" /></S>;
export const IcMinus = (p: P) => <S {...p}><path d="M5 12h14" /></S>;
export const IcTrash = (p: P) => <S {...p}><path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l1 12.4a1.5 1.5 0 0 0 1.5 1.4h6a1.5 1.5 0 0 0 1.5-1.4l1-12.4" /><path d="M10 11v6M14 11v6" /></S>;
export const IcCheck = (p: P) => <S {...p}><path d="m4.5 12.5 5 5L19.5 7" /></S>;
export const IcSwap = (p: P) => <S {...p}><path d="M7 4.5 3.5 8 7 11.5M3.5 8H16a4.5 4.5 0 0 1 4.5 4.5M17 19.5 20.5 16 17 12.5M20.5 16H8A4.5 4.5 0 0 1 3.5 11.5" /></S>;
export const IcFilter = (p: P) => <S {...p}><path d="M4 6h16M7 12h10M10 18h4" /></S>;
export const IcBox = (p: P) => <S {...p}><path d="M12 3 3.5 7v10L12 21l8.5-4V7Z" /><path d="M3.5 7 12 11l8.5-4M12 11v10" /></S>;
export const IcHeadset = (p: P) => <S {...p}><path d="M4.5 13.5v-2a7.5 7.5 0 0 1 15 0v2" /><rect x="3.5" y="13" width="4" height="6" rx="1.6" /><rect x="16.5" y="13" width="4" height="6" rx="1.6" /><path d="M18.5 19v.8a2.2 2.2 0 0 1-2.2 2.2H13" /></S>;
export const IcMail = (p: P) => <S {...p}><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m3.5 7.5 8.5 6 8.5-6" /></S>;
export const IcChat = (p: P) => <S {...p}><path d="M12 4a8.5 8.5 0 0 0-7.3 12.9L3.5 20.5l3.8-1.1A8.5 8.5 0 1 0 12 4Z" /><path d="M8.5 10.5h7M8.5 13.5h4.5" /></S>;
export const IcPin = (p: P) => <S {...p}><path d="M12 21s-6.5-5.3-6.5-10a6.5 6.5 0 0 1 13 0c0 4.7-6.5 10-6.5 10Z" /><circle cx="12" cy="10.6" r="2.3" /></S>;
export const IcClock = (p: P) => <S {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></S>;
export const IcSpark = (p: P) => <S {...p}><path d="M12 3.5c.6 3.9 2.6 5.9 6.5 6.5-3.9.6-5.9 2.6-6.5 6.5-.6-3.9-2.6-5.9-6.5-6.5 3.9-.6 5.9-2.6 6.5-6.5Z" /><path d="M19 14.5c.3 1.9 1.3 2.9 3.2 3.2-1.9.3-2.9 1.3-3.2 3.2-.3-1.9-1.3-2.9-3.2-3.2 1.9-.3 2.9-1.3 3.2-3.2Z" /></S>;
export const IcBolt = (p: P) => <S {...p}><path d="M13 2.5 4.5 13.5H11l-1 8L18.5 10H12Z" /></S>;
export const IcTag = (p: P) => <S {...p}><path d="m12.5 3 8.5.5.5 8.5-9 9-8.9-8.9Z" /><circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" /></S>;
export const IcRefresh = (p: P) => <S {...p}><path d="M20 12a8 8 0 1 1-2.3-5.6M20 3.5V8h-4.5" /></S>;
export const IcHome = (p: P) => <S {...p}><path d="m4 11 8-7 8 7v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20Z" /><path d="M9.5 21.5v-6h5v6" /></S>;
export const IcGrid = (p: P) => <S {...p}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></S>;
export const IcFlame = (p: P) => <S {...p}><path d="M12 3c.5 3-1 4.5-2.6 6.2C7.8 10.9 7 12.3 7 14a5 5 0 0 0 10 0c0-1.4-.5-2.7-1.3-3.9-.4 1-1 1.7-1.9 2.2.4-3.4-.4-6.8-1.8-9.3Z" /></S>;
export const IcPhone = (p: P) => <S {...p}><path d="M6.5 3.5h3l1.5 4-2 1.5a12.5 12.5 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" /></S>;
export const IcWallet = (p: P) => <S {...p}><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5Z" /><path d="M15 12h5v3h-5a1.5 1.5 0 0 1 0-3Z" /></S>;
export const IcBadge = (p: P) => <S {...p}><circle cx="12" cy="9" r="5.5" /><path d="m8.8 13.5-1.3 6L12 17l4.5 2.5-1.3-6M9.8 9l1.6 1.6L14.6 7.4" /></S>;
export const IcLaptopArt = (p: P) => <S {...p}><rect x="4" y="5.5" width="16" height="10.5" rx="1.8" /><path d="M2.5 19.5h19" /></S>;
export const IcCpu = (p: P) => <S {...p}><rect x="7" y="7" width="10" height="10" rx="1.5" /><rect x="10" y="10" width="4" height="4" /><path d="M9 4v3M15 4v3M9 17v3M15 17v3M4 9h3M4 15h3M17 9h3M17 15h3" /></S>;
export const IcSend = (p: P) => <S {...p}><path d="M20.5 3.5 3.5 10.2l6.2 2.6 2.7 6.7Z" /><path d="M20.5 3.5 9.7 12.8" /></S>;
export const IcEye = (p: P) => <S {...p}><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></S>;
export const IcPercent = (p: P) => <S {...p}><path d="M18.5 5.5 5.5 18.5" /><circle cx="7.5" cy="7.5" r="2.2" /><circle cx="16.5" cy="16.5" r="2.2" /></S>;

// Category line icons (slightly chunkier, drawn for Imara)
export const IcCatLaptop = (p: P) => <S {...p}><rect x="4.5" y="5" width="15" height="10" rx="1.6" /><path d="M3 18.5h18l-1.2-2H4.2Z" /></S>;
export const IcCatPhone = (p: P) => <S {...p}><rect x="8" y="3.5" width="8" height="17" rx="2.2" /><path d="M10.8 17.8h2.4" /></S>;
export const IcCatGame = (p: P) => <S {...p}><path d="M7 8h10a4.5 4.5 0 0 1 4.4 5.4l-.7 3.4a2.3 2.3 0 0 1-4 1L15 16H9l-1.7 1.8a2.3 2.3 0 0 1-4-1l-.7-3.4A4.5 4.5 0 0 1 7 8Z" /><path d="M8.5 11.5v2.4M7.3 12.7h2.4" /><circle cx="15.6" cy="11.6" r="0.4" fill="currentColor" /><circle cx="17.4" cy="13.4" r="0.4" fill="currentColor" /></S>;
export const IcCatAudio = (p: P) => <S {...p}><path d="M5 14.5v-3a7 7 0 0 1 14 0v3" /><rect x="4" y="13.5" width="3.6" height="6" rx="1.5" /><rect x="16.4" y="13.5" width="3.6" height="6" rx="1.5" /></S>;
export const IcCatMonitor = (p: P) => <S {...p}><rect x="3.5" y="4.5" width="17" height="11.5" rx="1.8" /><path d="M12 16v3M8 20h8" /></S>;
export const IcCatNet = (p: P) => <S {...p}><path d="M5 12.5a10 10 0 0 1 14 0M8 15.5a6 6 0 0 1 8 0" /><circle cx="12" cy="18.5" r="1.2" fill="currentColor" stroke="none" /></S>;
export const IcCatPlug = (p: P) => <S {...p}><path d="M9 3.5V8M15 3.5V8M7 8h10v3a5 5 0 0 1-10 0Z" /><path d="M12 16v4.5" /></S>;
export const IcCatWatch = (p: P) => <S {...p}><rect x="7.5" y="7" width="9" height="10" rx="2.6" /><path d="M9.5 7V3.5h5V7M9.5 17v3.5h5V17" /><path d="M12 10v2.3l1.5 1" /></S>;
export const IcCatTablet = (p: P) => <S {...p}><rect x="5" y="3.5" width="14" height="17" rx="2.2" /><path d="M10.8 17.8h2.4" /></S>;

export const CAT_ICONS: Record<string, ComponentType<P>> = {
  laptops: IcCatLaptop, phones: IcCatPhone, tablets: IcCatTablet, gaming: IcCatGame,
  audio: IcCatAudio, monitors: IcCatMonitor, networking: IcCatNet,
  accessories: IcCatPlug, smart: IcCatWatch,
};

export const TRUST_ICONS: Record<string, ComponentType<P>> = {
  shield: IcShield, lock: IcLock, truck: IcTruck, badge: IcBadge, headset: IcHeadset, refresh: IcRefresh,
};
