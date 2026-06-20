import type { SceneType, SceneConfig } from '../../types'
import { SCENE_CONFIGS } from '../../data/scenes'
import { GAME_CONFIG } from '../../data/config'
import { lerp, clamp, lerpColor } from '../../utils/math'

export class SceneManager {
  currentScene: SceneType = 'neon_city'
  private nextScene: SceneType = 'coastal_highway'
  sceneTimer: number = 0
  transitionProgress: number = 1
  transitionState: 'idle' | 'transitioning' = 'idle'
  transitionAlpha: number = 0
  scenes: SceneConfig[] = SCENE_CONFIGS

  update(dt: number): void {
    this.sceneTimer += dt

    if (this.transitionState === 'transitioning') {
      this.transitionProgress += dt / GAME_CONFIG.SCENE_TRANSITION_TIME
      if (this.transitionProgress >= 1) {
        this.transitionProgress = 1
        this.transitionState = 'idle'
        this.currentScene = this.nextScene
        this.sceneTimer = 0
      }
    }

    if (this.transitionState === 'idle' && this.sceneTimer >= this.getCurrentSceneConfig().duration) {
      this.startTransition()
    }

    if (this.transitionState === 'transitioning') {
      const t = this.transitionProgress
      this.transitionAlpha = t < 0.5 ? t * 2 : 2 - t * 2
    } else {
      this.transitionAlpha = 0
    }
  }

  private startTransition(): void {
    const currentIndex = this.scenes.findIndex(s => s.id === this.currentScene)
    const nextIndex = (currentIndex + 1) % this.scenes.length
    this.nextScene = this.scenes[nextIndex].id
    this.transitionState = 'transitioning'
    this.transitionProgress = 0
  }

  getCurrentSceneConfig(): SceneConfig {
    return this.scenes.find(s => s.id === this.currentScene) || this.scenes[0]
  }

  getNextSceneConfig(): SceneConfig {
    return this.scenes.find(s => s.id === this.nextScene) || this.scenes[1]
  }

  getBlendedSceneColors(): {
    roadColor: string
    roadEdgeColor: string
    roadsideColor: string
    skyColors: [string, string]
    buildingColors: string[]
    neonColors: string[]
  } {
    const current = this.getCurrentSceneConfig()
    const next = this.getNextSceneConfig()
    let t = 0

    if (this.transitionState === 'transitioning') {
      t = this.transitionProgress
    }

    return {
      roadColor: lerpColor(current.roadColor, next.roadColor, t),
      roadEdgeColor: lerpColor(current.roadEdgeColor, next.roadEdgeColor, t),
      roadsideColor: lerpColor(current.roadsideColor, next.roadsideColor, t),
      skyColors: [
        lerpColor(current.skyColors[0], next.skyColors[0], t),
        lerpColor(current.skyColors[1], next.skyColors[1], t),
      ],
      buildingColors: current.buildingColors,
      neonColors: current.neonColors,
    }
  }

  drawTransitionOverlay(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.transitionAlpha <= 0) return

    const nextScene = this.getNextSceneConfig()
    
    ctx.save()
    ctx.globalAlpha = this.transitionAlpha * 0.9
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)

    if (this.transitionProgress > 0.3 && this.transitionProgress < 0.7) {
      const textAlpha = 1 - Math.abs(this.transitionProgress - 0.5) * 4
      ctx.globalAlpha = Math.max(0, textAlpha)
      ctx.fillStyle = '#00D4FF'
      ctx.shadowColor = '#00D4FF'
      ctx.shadowBlur = 30
      ctx.font = 'bold 48px "Press Start 2P", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(nextScene.name, width / 2, height / 2)
      ctx.shadowBlur = 0
    }

    ctx.restore()
  }

  getSceneProgress(): number {
    return clamp(this.sceneTimer / this.getCurrentSceneConfig().duration, 0, 1)
  }

  getRemainingTime(): number {
    return Math.max(0, this.getCurrentSceneConfig().duration - this.sceneTimer)
  }

  setScene(sceneType: SceneType): void {
    this.currentScene = sceneType
    this.sceneTimer = 0
    this.transitionState = 'idle'
    this.transitionProgress = 1
    this.transitionAlpha = 0
    const currentIndex = this.scenes.findIndex(s => s.id === this.currentScene)
    const nextIndex = (currentIndex + 1) % this.scenes.length
    this.nextScene = this.scenes[nextIndex].id
  }

  reset(): void {
    this.currentScene = 'neon_city'
    this.nextScene = 'coastal_highway'
    this.sceneTimer = 0
    this.transitionState = 'idle'
    this.transitionProgress = 1
    this.transitionAlpha = 0
  }
}
