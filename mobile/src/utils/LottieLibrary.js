// Comprehensive Lottie Animation Library for OTTR
// Organized collection of all animation assets for easy management

export const LottieAnimations = {
  // Loading States
  loading: require('../../assets/lottie/loading.json'),
  pullRefresh: require('../../assets/animations/pull-refresh.json'),
  
  // Communication States
  typing: require('../../assets/animations/typing.json'),
  messageSent: require('../../assets/animations/message-sent.json'),
  messageDelivered: require('../../assets/animations/message-delivered.json'),
  
  // Success & Feedback
  success: require('../../assets/animations/success.json'),
  connection: require('../../assets/animations/connection.json'),
  celebration: require('../../assets/animations/celebration.json'),
  blueTick: require('../../assets/lottie/blue tick lottie.json'),
  
  // Empty & Error States
  emptyState: require('../../assets/animations/empty-state.json'),
  error: require('../../assets/animations/error.json'),
  
  // Interactive Elements
  pulse: require('../../assets/animations/pulse.json'),
};

// Animation configurations for consistent usage
export const AnimationConfig = {
  // Standard loading animation
  loading: {
    animation: LottieAnimations.loading,
    autoPlay: true,
    loop: true,
    style: { width: 24, height: 24 },
  },
  
  // Typing indicator in chat
  typing: {
    animation: LottieAnimations.typing,
    autoPlay: true,
    loop: true,
    style: { width: 30, height: 12 },
  },
  
  // Message delivery status
  messageSent: {
    animation: LottieAnimations.messageSent,
    autoPlay: true,
    loop: false,
    style: { width: 12, height: 12 },
  },
  
  messageDelivered: {
    animation: LottieAnimations.messageDelivered,
    autoPlay: true,
    loop: false,
    style: { width: 12, height: 12 },
  },
  
  // Success feedback
  success: {
    animation: LottieAnimations.success,
    autoPlay: true,
    loop: false,
    style: { width: 40, height: 40 },
  },
  
  // Connection established
  connection: {
    animation: LottieAnimations.connection,
    autoPlay: true,
    loop: false,
    style: { width: 100, height: 60 },
  },
  
  // Blue tick for connection accepted
  blueTick: {
    animation: LottieAnimations.blueTick,
    autoPlay: true,
    loop: false,
    style: { width: 60, height: 60 },
  },
  
  // Celebration for special moments
  celebration: {
    animation: LottieAnimations.celebration,
    autoPlay: true,
    loop: false,
    style: { width: 200, height: 200 },
  },
  
  // Empty state placeholder
  emptyState: {
    animation: LottieAnimations.emptyState,
    autoPlay: true,
    loop: true,
    style: { width: 80, height: 80 },
  },
  
  // Error indication
  error: {
    animation: LottieAnimations.error,
    autoPlay: true,
    loop: false,
    style: { width: 40, height: 40 },
  },
  
  // Pull to refresh
  pullRefresh: {
    animation: LottieAnimations.pullRefresh,
    autoPlay: true,
    loop: true,
    style: { width: 40, height: 40 },
  },
  
  // Pulse effect for interactive elements
  pulse: {
    animation: LottieAnimations.pulse,
    autoPlay: true,
    loop: true,
    style: { width: 60, height: 60 },
  },
};

// Helper function to get animation config
export const getAnimationConfig = (type, customStyle = {}) => {
  const config = AnimationConfig[type];
  if (!config) {
    console.warn(`Animation type "${type}" not found in LottieLibrary`);
    return null;
  }
  
  return {
    ...config,
    style: { ...config.style, ...customStyle },
  };
};

// Animation categories for easy browsing
export const AnimationCategories = {
  loading: ['loading', 'pullRefresh'],
  communication: ['typing', 'messageSent', 'messageDelivered'],
  feedback: ['success', 'connection', 'celebration'],
  states: ['emptyState', 'error'],
  interactive: ['pulse'],
};

// Quick access functions
export const LoadingAnimations = {
  default: () => getAnimationConfig('loading'),
  small: () => getAnimationConfig('loading', { width: 16, height: 16 }),
  large: () => getAnimationConfig('loading', { width: 48, height: 48 }),
  pullRefresh: () => getAnimationConfig('pullRefresh'),
};

export const CommunicationAnimations = {
  typing: () => getAnimationConfig('typing'),
  sent: () => getAnimationConfig('messageSent'),
  delivered: () => getAnimationConfig('messageDelivered'),
};

export const FeedbackAnimations = {
  success: () => getAnimationConfig('success'),
  connection: () => getAnimationConfig('connection'),
  celebration: () => getAnimationConfig('celebration'),
  error: () => getAnimationConfig('error'),
  blueTick: () => getAnimationConfig('blueTick'),
};

export const StateAnimations = {
  empty: () => getAnimationConfig('emptyState'),
  error: () => getAnimationConfig('error'),
};

export const InteractiveAnimations = {
  pulse: () => getAnimationConfig('pulse'),
};

export default LottieAnimations;