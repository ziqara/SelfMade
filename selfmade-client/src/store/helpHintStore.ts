import { create } from 'zustand';

const VISITED_KEY = 'selfmade_visited_help';
const DISMISSED_KEY = 'selfmade_dismissed_welcome_tip';

interface HelpHintState {
  hasVisitedHelp: boolean;
  hasDismissedWelcomeTip: boolean;
  markHelpVisited: () => void;
  dismissWelcomeTip: () => void;
}

const readFlag = (key: string) => localStorage.getItem(key) === '1';

// Подсказка "загляни в Как это работает" привязана к браузеру, а не к аккаунту:
// это чисто ознакомительная подсказка, и сбрасывать ее при каждом перелогине
// одного и того же человека было бы навязчиво.
export const useHelpHintStore = create<HelpHintState>((set) => ({
  hasVisitedHelp: readFlag(VISITED_KEY),
  hasDismissedWelcomeTip: readFlag(DISMISSED_KEY),

  markHelpVisited: () => {
    localStorage.setItem(VISITED_KEY, '1');
    set({ hasVisitedHelp: true });
  },

  dismissWelcomeTip: () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    set({ hasDismissedWelcomeTip: true });
  },
}));
