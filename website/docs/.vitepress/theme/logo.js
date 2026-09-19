function reducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/**
 * Draw the homepage mark: animated elastic collision between interactive physics bodies,
 * showing kinetic momentum, impact ripples, and penetration resolution.
 */
export function drawLogo(context, state, theme) {
  const { width, height } = state;
  const cx = width * 0.5;
  const cy = height * 0.5;
  const radius = Math.min(width, height) * 0.38;

  if (radius <= 0) return;

  const t = reducedMotion() ? 1.0 : state.time;

  // Outer circular boundary / arena
  context.save();
  context.beginPath();
  context.arc(cx, cy, radius, 0, Math.PI * 2);
  context.strokeStyle = theme.dark ? 'rgba(255, 107, 107, 0.15)' : 'rgba(255, 107, 107, 0.2)';
  context.lineWidth = 1.5;
  context.stroke();

  // Subtle background grid inside arena
  const gridSize = radius / 3;
  context.beginPath();
  for (let x = cx - radius; x <= cx + radius; x += gridSize) {
    context.moveTo(x, cy - radius);
    context.lineTo(x, cy + radius);
  }
  for (let y = cy - radius; y <= cy + radius; y += gridSize) {
    context.moveTo(cx - radius, y);
    context.lineTo(cx + radius, y);
  }
  context.strokeStyle = theme.dark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
  context.lineWidth = 1;
  context.stroke();

  // Simulated collision: Two bodies bouncing off each other and boundaries
  // Phase 1: Body A (Circle)
  const angleA = t * 1.8;
  const distA = Math.sin(t * 2.2) * (radius * 0.55);
  const ax = cx + Math.cos(angleA * 0.7) * distA;
  const ay = cy + Math.sin(angleA * 0.5) * distA;
  const rA = radius * 0.22;

  // Phase 2: Body B (Circle)
  const angleB = t * 1.5 + Math.PI;
  const distB = Math.cos(t * 2.0) * (radius * 0.52);
  const bx = cx + Math.cos(angleB * 0.6) * distB;
  const by = cy + Math.sin(angleB * 0.8) * distB;
  const rB = radius * 0.17;

  // Collision distance check
  const dx = bx - ax;
  const dy = by - ay;
  const d = Math.hypot(dx, dy);
  const isColliding = d < (rA + rB);

  // Impact ripple when colliding
  if (isColliding) {
    const midX = (ax + bx) * 0.5;
    const midY = (ay + by) * 0.5;
    context.beginPath();
    context.arc(midX, midY, (rA + rB - d) * 2.5 + 8, 0, Math.PI * 2);
    context.strokeStyle = theme.accent;
    context.lineWidth = 2;
    context.globalAlpha = 0.6;
    context.stroke();
    context.globalAlpha = 1.0;
  }

  // Draw Body A (Circle)
  const gradA = context.createRadialGradient(ax - rA * 0.3, ay - rA * 0.3, 0, ax, ay, rA);
  gradA.addColorStop(0, theme.accent);
  gradA.addColorStop(1, '#e03131');
  context.beginPath();
  context.arc(ax, ay, rA, 0, Math.PI * 2);
  context.fillStyle = gradA;
  context.fill();
  context.strokeStyle = theme.accentGlow;
  context.lineWidth = 3;
  context.stroke();

  // Draw Body B (Circle)
  const gradB = context.createRadialGradient(bx - rB * 0.3, by - rB * 0.3, 0, bx, by, rB);
  gradB.addColorStop(0, theme.blue);
  gradB.addColorStop(1, '#3b5bdb');
  context.beginPath();
  context.arc(bx, by, rB, 0, Math.PI * 2);
  context.fillStyle = gradB;
  context.fill();
  context.strokeStyle = theme.blue;
  context.lineWidth = 2;
  context.stroke();

  // Central AABB Obstacle (Box)
  const boxSize = radius * 0.32;
  const boxX = cx - boxSize * 0.5;
  const boxY = cy - boxSize * 0.5;
  context.beginPath();
  context.roundRect(boxX, boxY, boxSize, boxSize, 8);
  context.fillStyle = theme.dark ? '#25262b' : '#edf2ff';
  context.fill();
  context.strokeStyle = theme.guide;
  context.lineWidth = 2;
  context.stroke();

  // Center symbol / label "B"
  context.font = `bold ${Math.round(boxSize * 0.5)}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = theme.text;
  context.fillText('B', cx, cy);

  context.restore();
}
