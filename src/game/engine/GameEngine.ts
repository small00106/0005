import { Car } from './Car'
import { Track } from './Track'
import { Camera } from './Camera'
import { ParticleSystem } from '../effects/ParticleSystem'
import { Environment } from '../environment/Environment'
import { SceneManager } from '../environment/SceneManager'
import { InputManager } from '../input/InputManager'
import { GAME_CONFIG } from '../../data/config'
import type { GameState, GameSave, SceneType, WeatherType, InputState } from '../../types'
import { clamp, randomRange } from '../../utils/math'

export interface GameCallbacks {
  onStateChange?: (state: GameState) => void
  onExit?: () => void
}

export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private car: Car
  private track: Track
  private camera: Camera
  private particles: ParticleSystem
  private environment: Environment
  private sceneManager: SceneManager
  private input: InputManager
  private callbacks: GameCallbacks

  private running: boolean = false
  private paused: boolean = false
  private animationId: number | null = null
  private lastTime: number = 0
  private accumulator: number = 0
  private fixedDt: number = 1 / 60

  private playTime: number = 0
  private nitroSmokeTimer: number = 0
  private driftSmokeTimer: number = 0
  private trailTimer: number = 0
  private speedLines: { x: number; y: number; length: number; alpha: number }[] = []
  private tireMarks: { x: number; y: number; angle: number; alpha: number }[] = []

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks = {}) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2D context')
    this.ctx = ctx
    this.callbacks = callbacks

    this.car = new Car(0, 0)
    this.track = new Track()
    this.camera = new Camera()
    this.particles = new ParticleSystem()
    this.environment = new Environment()
    this.sceneManager = new SceneManager()
    this.input = new InputManager()

    this.resize()
    window.addEventListener('resize', this.handleResize)
  }

  private handleResize = (): void => {
    this.resize()
  }

  private resize(): void {
    const container = this.canvas.parentElement
    if (container) {
      const rect = container.getBoundingClientRect()
      const aspect = GAME_CONFIG.CANVAS_WIDTH / GAME_CONFIG.CANVAS_HEIGHT
      let width = rect.width
      let height = rect.width / aspect
      if (height > rect.height) {
        height = rect.height
        width = rect.height * aspect
      }
      this.canvas.style.width = `${width}px`
      this.canvas.style.height = `${height}px`
    }
    this.canvas.width = GAME_CONFIG.CANVAS_WIDTH
    this.canvas.height = GAME_CONFIG.CANVAS_HEIGHT
    this.ctx.imageSmoothingEnabled = false
  }

  start(saveData?: GameSave): void {
    if (this.running) return

    if (saveData) {
      this.loadFromSave(saveData)
    } else {
      this.reset()
    }

    this.running = true
    this.paused = false
    this.lastTime = performance.now()
    this.accumulator = 0
    this.loop()
    this.emitState()
  }

  stop(): void {
    this.running = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    this.paused = false
    if (this.running) {
      this.lastTime = performance.now()
      this.loop()
    }
  }

  reset(): void {
    this.car.reset(0, 0)
    this.camera.reset(0, 0)
    this.particles.clear()
    this.track.clear()
    this.environment.reset()
    this.sceneManager.reset()
    this.speedLines = []
    this.tireMarks = []
    this.playTime = 0
    this.nitroSmokeTimer = 0
    this.driftSmokeTimer = 0
    this.trailTimer = 0
  }

  private loadFromSave(save: GameSave): void {
    this.car.x = 0
    this.car.y = -save.totalDistance
    this.car.speed = save.currentSpeed
    this.car.nitro = save.nitro
    this.car.totalDistance = save.totalDistance
    this.car.angle = -Math.PI / 2
    this.environment.timeOfDay = save.timeOfDay
    this.environment.weather = save.weather
    this.sceneManager.setScene(save.currentScene)
    this.sceneManager.sceneTimer = save.sceneProgress * this.sceneManager.getCurrentSceneConfig().duration
    this.playTime = save.playTime
    this.camera.reset(0, save.totalDistance)
  }

  private loop = (): void => {
    if (!this.running) return
    if (this.paused) return

    const now = performance.now()
    let dt = (now - this.lastTime) / 1000
    this.lastTime = now
    dt = Math.min(dt, 0.1)

    this.accumulator += dt
    while (this.accumulator >= this.fixedDt) {
      this.update(this.fixedDt)
      this.accumulator -= this.fixedDt
    }

    this.render()
    this.emitState()

    this.animationId = requestAnimationFrame(this.loop)
  }

  private update(dt: number): void {
    const input = this.input.getState()
    
    this.playTime += dt
    this.car.update(dt, input)
    if (this.car.y > 500) {
      this.car.y = 500
      if (this.car.speed < 0) this.car.speed = 0
    }
    this.environment.update(dt)
    this.sceneManager.update(dt)

    this.keepCarOnRoad(dt)

    this.camera.follow(
      this.car.x,
      this.car.y,
      this.car.speed,
      this.car.usingNitro
    )
    this.camera.update(dt)

    this.updateParticles(dt, input)
    this.updateSpeedLines(dt)
    this.updateTireMarks(dt)
    this.updateRain(dt)
  }

  private keepCarOnRoad(dt: number): void {
    const roadCenter = this.track.getRoadCenter(-this.car.y)
    const offset = this.car.x - roadCenter.x
    const halfRoad = GAME_CONFIG.ROAD_WIDTH / 2 - this.car.width / 2

    if (Math.abs(offset) > halfRoad) {
      if (Math.abs(offset) > halfRoad + 50) {
        this.car.x = roadCenter.x + Math.sign(offset) * (halfRoad + 50)
        this.car.speed *= 0.88
      } else {
        this.car.speed *= 0.96
      }
      this.camera.addShake(0.35)
    }
  }

  private updateParticles(dt: number, input: InputState): void {
    const wheelPositions = this.car.getWheelWorldPositions()

    if (this.car.drifting) {
      this.driftSmokeTimer += dt
      if (this.driftSmokeTimer >= GAME_CONFIG.DRIFT_SMOKE_EMIT_RATE) {
        this.driftSmokeTimer = 0
        for (const wheel of wheelPositions.slice(2)) {
          if (wheel.skidding) {
            this.particles.emitSmoke(wheel.x, wheel.y, this.car.angle, 2)
          }
        }
      }
    }

    if (this.car.usingNitro) {
      this.nitroSmokeTimer += dt
      if (this.nitroSmokeTimer >= GAME_CONFIG.NITRO_FLAME_EMIT_RATE) {
        this.nitroSmokeTimer = 0
        const hw = this.car.width / 2
        const hh = this.car.height / 2
        const cos = Math.cos(this.car.angle)
        const sin = Math.sin(this.car.angle)
        const rearY = hh
        const leftExhaust = {
          x: this.car.x + (-hw + 10) * cos - rearY * sin,
          y: this.car.y + (-hw + 10) * sin + rearY * cos,
        }
        const rightExhaust = {
          x: this.car.x + (hw - 10) * cos - rearY * sin,
          y: this.car.y + (hw - 10) * sin + rearY * cos,
        }
        this.particles.emitNitroFlame(leftExhaust.x, leftExhaust.y, this.car.angle, 3)
        this.particles.emitNitroFlame(rightExhaust.x, rightExhaust.y, this.car.angle, 3)
      }
    }

    if (Math.abs(this.car.speed) > GAME_CONFIG.MAX_SPEED * 0.4) {
      this.trailTimer += dt
      if (this.trailTimer >= GAME_CONFIG.TRAIL_EMIT_RATE) {
        this.trailTimer = 0
        const hw = this.car.width / 2
        const hh = this.car.height / 2
        const cos = Math.cos(this.car.angle)
        const sin = Math.sin(this.car.angle)
        const rearY = hh
        this.particles.emitSpeedTrail(
          this.car.x - hw * cos - rearY * sin,
          this.car.y - hw * sin + rearY * cos,
          this.car.angle
        )
        this.particles.emitSpeedTrail(
          this.car.x + hw * cos - rearY * sin,
          this.car.y + hw * sin + rearY * cos,
          this.car.angle
        )
      }
    }

    this.particles.update(dt, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT)
  }

  private updateSpeedLines(dt: number): void {
    const speedFactor = Math.min(this.car.speed / GAME_CONFIG.MAX_SPEED, 1)
    const targetCount = Math.floor(speedFactor * 40)

    while (this.speedLines.length < targetCount) {
      this.speedLines.push({
        x: randomRange(0, GAME_CONFIG.CANVAS_WIDTH),
        y: randomRange(0, GAME_CONFIG.CANVAS_HEIGHT),
        length: randomRange(30, 80) * speedFactor,
        alpha: 0,
      })
    }
    while (this.speedLines.length > targetCount) {
      this.speedLines.pop()
    }

    for (const line of this.speedLines) {
      line.alpha = speedFactor * 0.55
      line.y += 25 * speedFactor * dt * 60
      if (line.y > GAME_CONFIG.CANVAS_HEIGHT) {
        line.y = -line.length
        line.x = randomRange(0, GAME_CONFIG.CANVAS_WIDTH)
      }
    }
  }

  private updateTireMarks(dt: number): void {
    if (this.car.drifting || (this.input.getState().down && Math.abs(this.car.speed) > 2)) {
      if (Math.random() > 0.4) {
        const wheelPositions = this.car.getWheelWorldPositions()
        for (const wheel of wheelPositions.slice(2)) {
          this.tireMarks.push({
            x: wheel.x,
            y: wheel.y,
            angle: this.car.angle,
            alpha: 0.55,
          })
        }
      }
    }

    if (this.tireMarks.length > 250) {
      this.tireMarks.splice(0, this.tireMarks.length - 250)
    }

    for (let i = this.tireMarks.length - 1; i >= 0; i--) {
      this.tireMarks[i].alpha -= dt * 0.04
      if (this.tireMarks[i].alpha <= 0) {
        this.tireMarks.splice(i, 1)
      }
    }
  }

  private updateRain(dt: number): void {
    const count = this.environment.getRainParticleCount()
    if (count > 0) {
      this.particles.emitRain(Math.ceil(count / 25), GAME_CONFIG.CANVAS_WIDTH)
    }
  }

  private render(): void {
    const { ctx } = this
    const W = GAME_CONFIG.CANVAS_WIDTH
    const H = GAME_CONFIG.CANVAS_HEIGHT

    ctx.clearRect(0, 0, W, H)

    const sceneColors = this.sceneManager.getBlendedSceneColors()
    this.environment.drawSky(ctx, W, H, sceneColors.skyColors as [string, string])

    this.drawMountains(ctx, W, H)

    this.camera.apply(ctx, W, H)

    this.drawTireMarks(ctx)

    const tempSceneConfig = {
      ...this.sceneManager.getCurrentSceneConfig(),
      roadColor: sceneColors.roadColor,
      roadEdgeColor: sceneColors.roadEdgeColor,
      roadsideColor: sceneColors.roadsideColor,
    }
    this.track.draw(ctx, tempSceneConfig, this.camera.y, this.environment.timeOfDay)

    this.particles.draw(ctx)

    this.car.draw(ctx)

    ctx.restore()

    this.drawSpeedLines(ctx)

    this.drawVignette(ctx, W, H)

    this.sceneManager.drawTransitionOverlay(ctx, W, H)
  }

  private drawMountains(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    const parallax = -this.camera.y * 0.015
    
    for (let layer = 0; layer < 3; layer++) {
      const baseY = H * 0.45 + layer * 45
      const amplitude = 90 - layer * 25
      const offset = parallax * (1 + layer * 0.6)
      
      const colors = ['rgba(30, 25, 50, 0.75)', 'rgba(50, 40, 75, 0.55)', 'rgba(70, 60, 100, 0.35)']
      
      ctx.fillStyle = colors[layer]
      ctx.beginPath()
      ctx.moveTo(0, H)
      for (let x = 0; x <= W; x += 18) {
        const y = baseY + Math.sin((x + offset + layer * 120) * 0.0045) * amplitude
          + Math.sin((x + offset * 0.5) * 0.011) * (amplitude * 0.3)
        ctx.lineTo(x, y)
      }
      ctx.lineTo(W, H)
      ctx.closePath()
      ctx.fill()
    }
  }

  private drawSpeedLines(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.strokeStyle = '#ffffff'
    for (const line of this.speedLines) {
      ctx.globalAlpha = line.alpha
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(line.x, line.y)
      ctx.lineTo(line.x, line.y + line.length)
      ctx.stroke()
    }
    ctx.restore()
  }

  private drawTireMarks(ctx: CanvasRenderingContext2D): void {
    for (const mark of this.tireMarks) {
      ctx.save()
      ctx.translate(mark.x, mark.y)
      ctx.rotate(mark.angle + Math.PI / 2)
      ctx.fillStyle = `rgba(0, 0, 0, ${mark.alpha})`
      ctx.fillRect(-4, -3, 8, 14)
      ctx.restore()
    }
  }

  private drawVignette(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    const gradient = ctx.createRadialGradient(W / 2, H / 2, W * 0.32, W / 2, H / 2, W * 0.72)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.45)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, W, H)
  }

  private emitState(): void {
    if (!this.callbacks.onStateChange) return

    const state: GameState = {
      running: this.running,
      paused: this.paused,
      speed: Math.abs(this.car.speed / GAME_CONFIG.MAX_SPEED * 320),
      nitro: this.car.nitro,
      maxNitro: this.car.maxNitro,
      currentScene: this.sceneManager.currentScene,
      sceneName: this.sceneManager.getCurrentSceneConfig().name,
      sceneProgress: this.sceneManager.getSceneProgress(),
      timeOfDay: this.environment.timeOfDay,
      weather: this.environment.weather,
      playTime: this.playTime,
      totalDistance: this.car.totalDistance,
      highScore: this.car.totalDistance,
      drifting: this.car.drifting,
      usingNitro: this.car.usingNitro,
    }

    this.callbacks.onStateChange(state)
  }

  createSave(): Omit<GameSave, 'id' | 'timestamp'> {
    return {
      playTime: this.playTime,
      currentScene: this.sceneManager.currentScene,
      currentSpeed: this.car.speed,
      nitro: this.car.nitro,
      timeOfDay: this.environment.timeOfDay,
      weather: this.environment.weather,
      totalDistance: this.car.totalDistance,
      highScore: this.car.totalDistance,
      sceneProgress: this.sceneManager.getSceneProgress(),
    }
  }

  getVirtualInput(): { setInput: (action: keyof InputState, value: boolean) => void } {
    return {
      setInput: (action, value) => this.input.setVirtualInput(action, value),
    }
  }

  destroy(): void {
    this.stop()
    window.removeEventListener('resize', this.handleResize)
    this.input.destroy()
  }
}
