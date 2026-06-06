
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    background-color: #020617;
    font-family: 'Inter', sans-serif;
  }
}

@layer components {
  /* Elite glass container rule used cross-platform */
  .premium-luxury-card {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.45) 0%, rgba(17, 24, 39, 0.45) 100%);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.04);
    box-shadow: 0 20px 50px -12px rgba(2, 6, 23, 0.8),
                inset 0 1px 1px 0 rgba(255, 255, 255, 0.05);
  }

  /* Shimmering animation layer for faith-inspired premium glow */
  .divine-light-shimmer {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.03) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 8s infinite linear;
  }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
