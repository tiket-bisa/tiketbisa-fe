

export const theme = {
  colors: {
    /** 3. Base Colors */
    base: {
      white: "#FFFFFF",
      inverse: "#0F0B1F",
    },

    /** 3. Primary Surface Colors */
    surface: {
      primary: "#0F0B1F",
      alt: "#17122B",
      hover: "#211A3A",
      inverse: "#FFFFFF",
    },

    /** 4.1 Brand Primary (Identity) */
    brand: {
      primary: {
        default: "#6D5CFF",
        hover: "#5A4AE6",
        active: "#4C3FD1",
        subtle: "#2A2355",
      },
      /** 4.2 Brand Secondary (Supporting Accent) */
      secondary: {
        default: "#22C7A9",
        hover: "#1DAE94",
        subtle: "#163F3A",
      },
    },

    /** 5. Club Dynamic Accent (Runtime — overridden per club) */
    club: {
      accent: "#6D5CFF",
      accentSubtle: "#2A2355",
      accentText: "#FFFFFF",
    },

    /** 6. Semantic Colors */
    success: {
      default: "#22C55E",
      bg: "#0F2A1B",
      text: "#86EFAC",
    },
    warning: {
      default: "#F59E0B",
      bg: "#2A1F0A",
      text: "#FCD34D",
    },
    destructive: {
      default: "#EF4444",
      hover: "#DC2626",
      bg: "#2A1212",
      text: "#FCA5A5",
    },

    /** 7. Button System */
    button: {
      disabled: "#3A355F",
      secondaryBorder: "#3A355F",
      secondaryText: "#C7C2FF",
      ghostText: "#A9A3FF",
    },

    /** 8. Text Colors */
    text: {
      primary: "#F5F3FF",
      secondary: "#C7C2FF",
      tertiary: "#8B85B3",
      inverse: "#0F0B1F",
    },

    /** 9. Border & Divider */
    border: {
      default: "#2B2550",
      subtle: "#221C40",
    },
    divider: "#1C1735",
  },

  /** 10. Brand Gradient */
  gradient: {
    brand: "linear-gradient(135deg, #6D5CFF 0%, #22C7A9 100%)",
  },
} as const;

/** Helper type to extract nested color values */
export type ThemeColors = typeof theme.colors;
