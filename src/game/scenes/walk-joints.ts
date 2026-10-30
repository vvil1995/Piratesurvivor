// Geometría de articulación en coordenadas del atlas. Sin Phaser ni DOM.
export interface Joint { x: number; y: number }
export interface LegJoints { hip: Joint; knee: Joint; left: number }
export interface RigBody { x: number; y: number; scaleX: number; scaleY: number; angle: number; originX: number; originY: number }
export function detectLegJoints(alpha: Uint8ClampedArray, width = 96, height = 96): LegJoints[] | undefined {
  const point = (left: number, target: number): Joint | undefined => {
    // Buscar una sección opaca real; nunca usar el centro del lienzo como rodilla.
    for (let offset = 0; offset <= 3; offset++) for (const y of offset ? [target - offset, target + offset] : [target]) {
      if (y < 0 || y >= height) continue;
      let bestStart = -1, bestLength = 0, start = -1;
      for (let x = left; x <= left + width / 2; x++) {
        const solid = x < left + width / 2 && alpha[(y * width + x) * 4 + 3] > 96;
        if (solid && start < 0) start = x;
        if (!solid && start >= 0) { if (x - start > bestLength) { bestStart = start; bestLength = x - start; } start = -1; }
      }
      if (bestLength >= 2) return { x: Math.floor(bestStart + (bestLength - 1) / 2), y };
    }
  };
  const legs: LegJoints[] = [];
  for (const left of [0, width / 2]) {
    const hip = point(left, 64), knee = point(left, 77);
    if (!hip || !knee) return;
    legs.push({ hip, knee, left });
  }
  return legs;
}
export function legTransform(body: RigBody, joints: LegJoints, thigh: number) {
  const rotate = (x: number, y: number, angle: number) => {
    const a = angle * Math.PI / 180; return { x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) };
  };
  const hip = rotate((joints.hip.x - 96 * body.originX) * body.scaleX, (joints.hip.y - 96 * body.originY) * body.scaleY, body.angle);
  const root = { x: body.x + hip.x, y: body.y + hip.y };
  const angle = body.angle + thigh;
  const offset = rotate((joints.knee.x - joints.hip.x) * body.scaleX, (joints.knee.y - joints.hip.y) * body.scaleY, angle);
  return { root, knee: { x: root.x + offset.x, y: root.y + offset.y }, angle };
}
