import { GAME_CONFIG } from '../../data/config'
import type { SceneConfig } from '../../types'
import { noise, lerpColor, randomRange } from '../../utils/math'

export interface RoadSegment {
  index: number
  x: number
  y: number
  width: number
  curve: number
}

interface DecorationItem {
  x: number
  y: number
  side: number
  size: number
  seed: number
}

interface RoadMarking {
  x: number
  y: number
}

export class Track {
  segmentLength: number = 30
  segments: Map<number, RoadSegment> = new Map()
  decorations: Map<string, DecorationItem> = new Map()
  roadMarkings: Map<string, RoadMarking> = new Map()
  private curveCache: Map<number, number> = new Map()
  private xOffsetCache: Map<number, number> = new Map()
  private lastCachedIndex: number = -1
  private lastCachedOffset: number = 0

  constructor() {}

  private getCurveValue(index: number): number {
    if (this.curveCache.has(index)) {
      return this.curveCache.get(index)!
    }
    const distance = index * this.segmentLength
    const n1 = noise(distance * 0.0008, 0, 1)
    const n2 = noise(distance * 0.0015, 100, 2)
    const n3 = noise(distance * 0.003, 50, 3)
    const curve = ((n1 - 0.5) * 0.15 + (n2 - 0.5) * 0.08 + (n3 - 0.5) * 0.04)
    this.curveCache.set(index, curve)
    return curve
  }

  private getXOffset(index: number): number {
    if (index <= 0) return 0
    if (this.xOffsetCache.has(index)) {
      return this.xOffsetCache.get(index)!
    }
    let startIdx: number
    let offset: number
    if (index > this.lastCachedIndex) {
      startIdx = this.lastCachedIndex + 1
      offset = this.lastCachedOffset
    } else {
      startIdx = 0
      offset = 0
      for (let i = index - 1; i >= 0; i--) {
        if (this.xOffsetCache.has(i)) {
          startIdx = i + 1
          offset = this.xOffsetCache.get(i)!
          break
        }
      }
    }
    for (let i = startIdx; i <= index; i++) {
      offset += this.getCurveValue(i) * this.segmentLength
      this.xOffsetCache.set(i, offset)
      if (i > this.lastCachedIndex) {
        this.lastCachedIndex = i
        this.lastCachedOffset = offset
      }
    }
    return offset
  }

  getSegment(index: number): RoadSegment {
    if (!this.segments.has(index)) {
      const x = this.getXOffset(index)
      const seg: RoadSegment = {
        index,
        x,
        y: -index * this.segmentLength,
        width: GAME_CONFIG.ROAD_WIDTH,
        curve: this.getCurveValue(index),
      }
      this.segments.set(index, seg)

      if (index % 2 === 0) {
        const decKey = `dec_${index}`
        if (!this.decorations.has(decKey) && Math.random() > 0.35) {
          const side = Math.random() > 0.5 ? 1 : -1
          const hw = GAME_CONFIG.ROAD_WIDTH / 2
          this.decorations.set(decKey, {
            x: x + side * (hw + 50 + Math.random() * 120),
            y: seg.y + randomRange(-10, 10),
            side,
            size: randomRange(70, 200),
            seed: Math.random() * 10000,
          })
        }
      }

      if (index % 3 === 0) {
        const markKey = `mark_${index}`
        if (!this.roadMarkings.has(markKey)) {
          this.roadMarkings.set(markKey, {
            x: x,
            y: seg.y,
          })
        }
      }
    }
    return this.segments.get(index)!
  }

  ensureSegmentsAround(centerIndex: number, range: number): void {
    for (let i = centerIndex - range; i <= centerIndex + range; i++) {
      if (i >= 0) {
        this.getSegment(i)
      }
    }

    const minKeep = Math.max(0, centerIndex - range * 3)
    const maxKeep = centerIndex + range * 3
    const segKeysToDelete: number[] = []
    for (const key of this.segments.keys()) {
      if (key < minKeep || key > maxKeep) {
        segKeysToDelete.push(key)
      }
    }
    for (const key of segKeysToDelete) {
      this.segments.delete(key)
    }
  }

  getPositionAt(distance: number): { x: number; y: number; angle: number } {
    const idx = Math.max(0, Math.floor(Math.abs(distance) / this.segmentLength))
    const t = (Math.abs(distance) % this.segmentLength) / this.segmentLength
    
    const s1 = this.getSegment(idx)
    const s2 = this.getSegment(idx + 1)
    
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
    const cameraDistance = Math.max(0, -cameraY)
    const cameraIndex = Math.floor(cameraDistance / this.segmentLength)
    const viewRange = 80
    this.ensureSegmentsAround(cameraIndex, viewRange + 10)

    const startIndex = Math.max(0, cameraIndex - 5)
    const endIndex = cameraIndex + viewRange

    ctx.save()

    this.drawRoadside(ctx, sceneConfig, startIndex, endIndex, timeOfDay)
    this.drawRoad(ctx, sceneConfig, startIndex, endIndex, timeOfDay)
    this.drawDecorations(ctx, sceneConfig, startIndex, endIndex, timeOfDay, cameraDistance)
    this.drawRoadMarkings(ctx, startIndex, endIndex, cameraDistance)

    ctx.restore()
  }

  private drawRoadside(
    ctx: CanvasRenderingContext2D,
    scene: SceneConfig,
    startIndex: number,
    endIndex: number,
    timeOfDay: number
  ): void {
    const brightness = this.getTimeBrightness(timeOfDay)
    ctx.fillStyle = lerpColor(scene.roadsideColor, '#000000', 1 - brightness)

    const step = this.segmentLength
    for (let i = startIndex; i <= endIndex; i++) {
      const seg = this.getSegment(i)
      const distFromCamera = -seg.y - (startIndex * this.segmentLength)
      const viewDist = (endIndex - startIndex) * step
      const depth = Math.max(0, Math.min(1, distFromCamera / viewDist))
      const scale = 1 - depth * 0.25

      const hw = GAME_CONFIG.ROAD_WIDTH / 2 * scale
      const roadX = seg.x
      const roadY = seg.y

      ctx.fillRect(roadX - hw - 800 * scale, roadY - step, 800 * scale, step + 4)
      ctx.fillRect(roadX + hw, roadY - step, 800 * scale, step + 4)
    }
  }

  private drawRoad(
    ctx: CanvasRenderingContext2D,
    scene: SceneConfig,
    startIndex: number,
    endIndex: number,
    timeOfDay: number
  ): void {
    const brightness = this.getTimeBrightness(timeOfDay)
    const roadColor = lerpColor(scene.roadColor, '#000000', 1 - brightness)
    const edgeColor = lerpColor(scene.roadEdgeColor, '#000000', (1 - brightness) * 0.5)

    const step = this.segmentLength
    for (let i = startIndex; i <= endIndex; i++) {
      const seg = this.getSegment(i)
      const distFromCamera = -seg.y - (startIndex * this.segmentLength)
      const viewDist = (endIndex - startIndex) * step
      const depth = Math.max(0, Math.min(1, distFromCamera / viewDist))
      const scale = 1 - depth * 0.25

      const hw = GAME_CONFIG.ROAD_WIDTH / 2 * scale
      const roadX = seg.x
      const roadY = seg.y

      ctx.fillStyle = roadColor
      ctx.fillRect(roadX - hw, roadY - step, hw * 2, step + 4)

      ctx.fillStyle = edgeColor
      ctx.shadowColor = edgeColor
      ctx.shadowBlur = 12 * (1 - depth * 0.4)
      ctx.fillRect(roadX - hw - 4, roadY - step, 4, step + 4)
      ctx.fillRect(roadX + hw, roadY - step, 4, step + 4)
      ctx.shadowBlur = 0
    }
  }

  private drawRoadMarkings(
    ctx: CanvasRenderingContext2D,
    startIndex: number,
    endIndex: number,
    cameraDistance: number
  ): void {
    ctx.fillStyle = '#ffffff'
    const viewStart = Math.max(0, cameraDistance - 100)
    const viewEnd = cameraDistance + endIndex * this.segmentLength

    for (const [key, mark] of this.roadMarkings) {
      const markDist = -mark.y
      if (markDist < viewStart || markDist > viewEnd) continue

      const depth = Math.max(0, Math.min(1, (markDist - viewStart) / (viewEnd - viewStart)))
      const scale = 1 - depth * 0.3
      const alpha = 1 - depth * 0.7

      ctx.globalAlpha = alpha
      const w = 8 * scale
      const h = 28 * scale
      ctx.fillRect(mark.x - w / 2, mark.y - h / 2, w, h)
    }
    ctx.globalAlpha = 1
  }

  private drawDecorations(
    ctx: CanvasRenderingContext2D,
    scene: SceneConfig,
    startIndex: number,
    endIndex: number,
    timeOfDay: number,
    cameraDistance: number
  ): void {
    const brightness = this.getTimeBrightness(timeOfDay)
    const viewStart = Math.max(0, cameraDistance - 100)
    const viewEnd = cameraDistance + endIndex * this.segmentLength

    const sortedDecs: { depth: number; dec: DecorationItem }[] = []
    for (const [, dec] of this.decorations) {
      const decDist = -dec.y
      if (decDist >= viewStart - 50 && decDist <= viewEnd) {
        const depth = Math.max(0, Math.min(1, (decDist - viewStart) / (viewEnd - viewStart)))
        sortedDecs.push({ depth, dec })
      }
    }
    sortedDecs.sort((a, b) => b.depth - a.depth)

    for (const { depth, dec } of sortedDecs) {
      const scale = (1 - depth * 0.45) * (dec.size / 100)
      const alpha = 1 - depth * 0.85

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
    const w = 55 * scale
    const h = 130 * scale
    const colorIdx = Math.floor(seed) % scene.buildingColors.length
    const neonIdx = Math.floor(seed * 1.7) % scene.neonColors.length
    const baseColor = lerpColor(scene.buildingColors[colorIdx], '#000000', 1 - brightness)
    const neonColor = scene.neonColors[neonIdx]

    ctx.fillStyle = baseColor
    ctx.fillRect(x - w / 2, y - h, w, h)

    ctx.fillStyle = lerpColor(baseColor, '#000000', 0.35)
    ctx.fillRect(x - w / 2, y - h, w * 0.32, h)

    if (brightness < 0.75) {
      const windowRows = Math.floor(h / (14 * scale))
      const windowCols = Math.floor(w / (17 * scale))
      for (let r = 0; r < windowRows; r++) {
        for (let c = 0; c < windowCols; c++) {
          if (noise(c, r, seed) > 0.42) {
            const wx = x - w / 2 + 5 * scale + c * 17 * scale
            const wy = y - h + 9 * scale + r * 14 * scale
            ctx.fillStyle = neonColor
            ctx.shadowColor = neonColor
            ctx.shadowBlur = 6 * scale
            ctx.fillRect(wx, wy, 7 * scale, 5 * scale)
            ctx.shadowBlur = 0
          }
        }
      }
    }

    if (brightness < 0.85) {
      ctx.fillStyle = neonColor
      ctx.shadowColor = neonColor
      ctx.shadowBlur = 18 * scale
      const signY = y - h + 18 * scale
      ctx.fillRect(x - w * 0.38, signY, w * 0.76, 8 * scale)
      ctx.shadowBlur = 0
    }
  }

  private getTimeBrightness(timeOfDay: number): number {
    const normalizedTime = (timeOfDay + 6) % 24 / 24
    const angle = normalizedTime * Math.PI * 2
    return 0.28 + 0.72 * Math.max(0, Math.sin(angle))
  }

  clear(): void {
    this.segments.clear()
    this.decorations.clear()
    this.roadMarkings.clear()
    this.curveCache.clear()
    this.xOffsetCache.clear()
  }
}
