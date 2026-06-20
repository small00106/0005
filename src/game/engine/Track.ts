import { GAME_CONFIG } from '../../data/config'
import type { SceneConfig } from '../../types'
import { noise, lerpColor, randomRange } from '../../utils/math'

export interface RoadSegment {
  x: number
  y: number
  width: number
  curve: number
  hill: number
}

export class Track {
  segments: RoadSegment[] = []
  segmentLength: number = 40
  totalLength: number = 5000
  decorations: { x: number; y: number; type: string; side: number; size: number; color: string; seed: number }[] = []
  roadMarkings: { x: number; y: number }[] = []

  constructor() {
    this.generateTrack()
  }

  generateTrack(): void {
    this.segments = []
    this.decorations = []
    this.roadMarkings = []

    let curveValue = 0
    let hillValue = 0

    for (let i = 0; i < this.totalLength; i += this.segmentLength) {
      const n1 = noise(i * 0.001, 0, 1)
      const n2 = noise(i * 0.002, 100, 2)
      curveValue = curveValue * 0.95 + (n1 - 0.5) * 0.1
      hillValue = hillValue * 0.95 + (n2 - 0.5) * 5

      this.segments.push({
        x: 0,
        y: -i,
        width: GAME_CONFIG.ROAD_WIDTH,
        curve: curveValue,
        hill: hillValue,
      })
    }

    let cumulativeOffset = 0
    for (let i = 0; i < this.segments.length; i++) {
      cumulativeOffset += this.segments[i].curve * this.segmentLength
      this.segments[i].x = cumulativeOffset
    }

    for (let i = 0; i < this.totalLength; i += 60) {
      if (Math.random() > 0.4) {
        const seg = this.segments[Math.floor(i / this.segmentLength)] || this.segments[0]
        const side = Math.random() > 0.5 ? 1 : -1
        this.decorations.push({
          x: seg.x + side * (GAME_CONFIG.ROAD_WIDTH / 2 + 40 + Math.random() * 100),
          y: -i + randomRange(-20, 20),
          type: 'building',
          side,
          size: randomRange(60, 180),
          color: '#1a1a3e',
          seed: Math.random() * 1000,
        })
      }
    }

    for (let i = 0; i < this.totalLength; i += 80) {
      const seg = this.segments[Math.floor(i / this.segmentLength)] || this.segments[0]
      this.roadMarkings.push({ x: seg.x, y: -i })
    }
  }

  getPositionAt(distance: number): { x: number; y: number; angle: number } {
    const idx = Math.floor(Math.abs(distance) / this.segmentLength)
    const t = (Math.abs(distance) % this.segmentLength) / this.segmentLength
    const clampedIdx = Math.min(idx, this.segments.length - 1)
    const nextIdx = Math.min(idx + 1, this.segments.length - 1)
    
    const s1 = this.segments[clampedIdx]
    const s2 = this.segments[nextIdx]
    
    return {
      x: s1.x + (s2.x - s1.x) * t,
      y: -Math.abs(distance),
      angle: Math.atan2(s2.curve, 1),
    }
  }

  getRoadCenter(distance: number): { x: number; y: number } {
    const pos = this.getPositionAt(distance)
    return { x: pos.x, y: pos.y }
  }

  getRoadOffset(worldX: number, worldY: number): number {
    const distance = -worldY
    const center = this.getRoadCenter(distance)
    return worldX - center.x
  }

  isOnRoad(worldX: number, worldY: number): boolean {
    const offset = this.getRoadOffset(worldX, worldY)
    return Math.abs(offset) < GAME_CONFIG.ROAD_WIDTH / 2
  }

  draw(ctx: CanvasRenderingContext2D, sceneConfig: SceneConfig, cameraY: number, timeOfDay: number): void {
    const viewDistance = 2000
    const startDist = Math.max(0, -cameraY - 200)
    const endDist = startDist + viewDistance

    ctx.save()

    this.drawRoadside(ctx, sceneConfig, startDist, endDist, timeOfDay)
    this.drawRoad(ctx, sceneConfig, startDist, endDist, timeOfDay)
    this.drawDecorations(ctx, sceneConfig, startDist, endDist, timeOfDay)
    this.drawRoadMarkings(ctx, sceneConfig, startDist, endDist)

    ctx.restore()
  }

  private drawRoadside(ctx: CanvasRenderingContext2D, scene: SceneConfig, startDist: number, endDist: number, timeOfDay: number): void {
    const brightness = this.getTimeBrightness(timeOfDay)
    ctx.fillStyle = lerpColor(scene.roadsideColor, '#000000', 1 - brightness)

    const step = this.segmentLength
    for (let d = startDist; d < endDist; d += step) {
      const seg = this.segments[Math.floor(d / this.segmentLength)]
      if (!seg) continue

      const depth = (d - startDist) / (endDist - startDist)
      const scale = 1 - depth * 0.3

      const hw = GAME_CONFIG.ROAD_WIDTH / 2 * scale
      const roadX = seg.x
      const roadY = -d

      ctx.fillRect(roadX - hw - 500 * scale, roadY - step, 500 * scale, step + 4)
      ctx.fillRect(roadX + hw, roadY - step, 500 * scale, step + 4)
    }
  }

  private drawRoad(ctx: CanvasRenderingContext2D, scene: SceneConfig, startDist: number, endDist: number, timeOfDay: number): void {
    const brightness = this.getTimeBrightness(timeOfDay)
    const roadColor = lerpColor(scene.roadColor, '#000000', 1 - brightness)
    const edgeColor = lerpColor(scene.roadEdgeColor, '#000000', (1 - brightness) * 0.5)

    const step = this.segmentLength
    for (let d = startDist; d < endDist; d += step) {
      const seg = this.segments[Math.floor(d / this.segmentLength)]
      if (!seg) continue

      const depth = (d - startDist) / (endDist - startDist)
      const scale = 1 - depth * 0.3

      const hw = GAME_CONFIG.ROAD_WIDTH / 2 * scale
      const roadX = seg.x
      const roadY = -d

      ctx.fillStyle = roadColor
      ctx.fillRect(roadX - hw, roadY - step, hw * 2, step + 4)

      ctx.fillStyle = edgeColor
      ctx.shadowColor = edgeColor
      ctx.shadowBlur = 10 * (1 - depth * 0.5)
      ctx.fillRect(roadX - hw - 4, roadY - step, 4, step + 4)
      ctx.fillRect(roadX + hw, roadY - step, 4, step + 4)
      ctx.shadowBlur = 0
    }
  }

  private drawRoadMarkings(ctx: CanvasRenderingContext2D, scene: SceneConfig, startDist: number, endDist: number): void {
    ctx.fillStyle = '#ffffff'
    
    for (const mark of this.roadMarkings) {
      if (-mark.y < startDist - 100 || -mark.y > endDist) continue
      
      const depth = Math.max(0, Math.min(1, (-mark.y - startDist) / (endDist - startDist)))
      const scale = 1 - depth * 0.3
      const alpha = 1 - depth * 0.7
      
      ctx.globalAlpha = alpha
      const w = 8 * scale
      const h = 30 * scale
      ctx.fillRect(mark.x - w / 2, mark.y - h / 2, w, h)
    }
    ctx.globalAlpha = 1
  }

  private drawDecorations(ctx: CanvasRenderingContext2D, scene: SceneConfig, startDist: number, endDist: number, timeOfDay: number): void {
    const brightness = this.getTimeBrightness(timeOfDay)

    for (const dec of this.decorations) {
      if (-dec.y < startDist - 200 || -dec.y > endDist) continue

      const depth = Math.max(0, Math.min(1, (-dec.y - startDist) / (endDist - startDist)))
      const scale = (1 - depth * 0.4) * (dec.size / 100)
      const alpha = 1 - depth * 0.8

      ctx.globalAlpha = alpha
      this.drawBuilding(ctx, dec.x, dec.y, scale, scene, brightness, dec.seed)
    }
    ctx.globalAlpha = 1
  }

  private drawBuilding(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    scene: SceneConfig,
    brightness: number,
    seed: number
  ): void {
    const w = 60 * scale
    const h = 120 * scale
    const colorIdx = Math.floor(seed) % scene.buildingColors.length
    const neonIdx = Math.floor(seed * 1.7) % scene.neonColors.length
    const baseColor = lerpColor(scene.buildingColors[colorIdx], '#000000', 1 - brightness)
    const neonColor = scene.neonColors[neonIdx]

    ctx.fillStyle = baseColor
    ctx.fillRect(x - w / 2, y - h, w, h)

    ctx.fillStyle = lerpColor(baseColor, '#000000', 0.3)
    ctx.fillRect(x - w / 2, y - h, w * 0.3, h)

    if (brightness < 0.7) {
      const windowRows = Math.floor(h / (15 * scale))
      const windowCols = Math.floor(w / (18 * scale))
      for (let r = 0; r < windowRows; r++) {
        for (let c = 0; c < windowCols; c++) {
          if (noise(c, r, seed) > 0.4) {
            const wx = x - w / 2 + 6 * scale + c * 18 * scale
            const wy = y - h + 10 * scale + r * 15 * scale
            ctx.fillStyle = neonColor
            ctx.shadowColor = neonColor
            ctx.shadowBlur = 5 * scale
            ctx.fillRect(wx, wy, 8 * scale, 6 * scale)
            ctx.shadowBlur = 0
          }
        }
      }
    }

    if (brightness < 0.8) {
      ctx.fillStyle = neonColor
      ctx.shadowColor = neonColor
      ctx.shadowBlur = 15 * scale
      const signY = y - h + 20 * scale
      ctx.fillRect(x - w * 0.35, signY, w * 0.7, 8 * scale)
      ctx.shadowBlur = 0
    }
  }

  private getTimeBrightness(timeOfDay: number): number {
    const normalizedTime = (timeOfDay + 6) % 24 / 24
    const angle = normalizedTime * Math.PI * 2
    return 0.3 + 0.7 * Math.max(0, Math.sin(angle))
  }
}
