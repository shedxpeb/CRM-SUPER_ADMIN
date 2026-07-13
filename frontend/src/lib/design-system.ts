/**
 * PEB CRM Design System
 * Consistent UI/UX standards across all modules
 */

// Text Size Scale
export const textSizes = {
  // Micro text - for badges, labels, metadata
  micro: 'text-[10px]', // 10px - for badges, labels, metadata
  // Extra small - for captions, hints
  xs: 'text-xs', // 12px - for captions, hints
  // Small - for body text, secondary information
  sm: 'text-sm', // 14px - for body text, secondary information
  // Base - for standard content
  base: 'text-base', // 16px - for standard content
  // Large - for headings, emphasis
  lg: 'text-lg', // 18px - for headings, emphasis
  // Extra large - for page titles
  xl: 'text-xl', // 20px - for page titles
  // 2X large - for hero text, main headings
  '2xl': 'text-2xl', // 24px - for hero text, main headings
  // 3X large - for display text
  '3xl': 'text-3xl', // 30px - for display text
} as const;

// Font Weights
export const fontWeights = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
} as const;

// Spacing Scale
export const spacing = {
  xs: 'space-x-1 space-y-1',
  sm: 'space-x-2 space-y-2',
  md: 'space-x-3 space-y-3',
  lg: 'space-x-4 space-y-4',
  xl: 'space-x-6 space-y-6',
} as const;

// Component-specific text sizes
export const componentTextSizes = {
  // KPI Cards
  kpiCard: {
    label: 'text-[10px] sm:text-xs',
    value: 'text-lg sm:text-2xl',
    change: 'text-[10px] sm:text-xs',
    hint: 'text-[10px] sm:text-xs',
  },
  // Page Headers
  pageHeader: {
    title: 'text-xl sm:text-2xl',
    subtitle: 'text-sm text-muted-foreground',
  },
  // Card Headers
  cardHeader: {
    title: 'text-base sm:text-lg',
    subtitle: 'text-xs text-muted-foreground',
  },
  // Table Cells
  table: {
    cell: 'text-xs sm:text-sm',
    header: 'text-xs font-medium',
    monospace: 'text-[10px] sm:text-xs font-mono',
  },
  // Badges
  badge: 'text-[10px] sm:text-xs',
  // Buttons
  button: {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  },
  // Form Labels
  form: {
    label: 'text-[10px] sm:text-xs font-medium',
    input: 'text-xs sm:text-sm',
    helper: 'text-[10px] text-muted-foreground',
  },
  // Navigation
  nav: {
    item: 'text-sm',
    subitem: 'text-xs',
  },
  // Tabs
  tab: 'text-xs sm:text-sm',
  // Timeline
  timeline: {
    date: 'text-[10px] text-muted-foreground',
    content: 'text-sm',
  },
} as const;

// Icon Sizes
export const iconSizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
} as const;

// Border Radius
export const borderRadius = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
} as const;

// Shadow Scale
export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
} as const;

// Transition
export const transitions = {
  default: 'transition-all duration-200',
  slow: 'transition-all duration-300',
  fast: 'transition-all duration-150',
} as const;
