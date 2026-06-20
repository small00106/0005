import type { WeatherType } from '../../types'
import { GAME_CONFIG } from '../../data/config'
import { WEATHER_CONFIGS } from '../../data/scenes'
import { lerp, lerpColor, clamp, randomChoice } from '../../utils/math'

export class Environment {
  timeOfDay: number = 8
  weather: WeatherType = 'sunny'
  private nextWeather: WeatherType = 'sunny'
  private weatherTimer: number = 0
  private weatherTransition: number = 1
  skyColors: [string, string] = ['#0f0c29', '#302b63']
  brightness: number = 1
  fogDensity: number = 0

  private daySkyColors: Record<string, [string, string]> = {
    night: ['#0a0a1a', '#1a1a3e'],
    dawn: ['#ff6b6b', '#feca57'],
    day: ['#74b9ff', '#a29bfe'],
    dusk: ['#d35400', '#8e44ad'],
  }

  update(dt: number): void {
    this.timeOfDay = (this.timeOfDay + dt * 24 / GAME_CONFIG.DAY_DURATION) % 24
    this.updateSkyColors()

    this.brightness = this.calculateBrightness()

    this.weatherTimer += dt
    if (this.weatherTimer >= GAME_CONFIG.WEATHER_CHANGE_INTERVAL) {
      this.weatherTimer = 0
      const weathers: WeatherType[] = ['sunny', 'cloudy', 'rain', 'fog']
      this.nextWeather = randomChoice(weathers.filter(w => w !== this.weather))
      this.weatherTransition = 0
    }

    if (this.weatherTransition < 1) {
      this.weatherTransition = clamp(this.weatherTransition + dt / 10, 0, 1)
      if (this.weatherTransition >= 1) {
        this.weather = this.nextWeather
      }
    }

    const currentFog = WEATHER_CONFIGS[this.weather].fogDensity
    const nextFog = WEATHER_CONFIGS[this.nextWeather].fogDensity
    this.fogDensity = lerp(currentFog, nextFog, this.weatherTransition)
  }

  private updateSkyColors(): void {
    let phase: string
    let t: number

    if (this.timeOfDay >= 5 && this.timeOfDay < 8) {
      phase = 'dawn'
      t = (this.timeOfDay - 5) / 3
    } else if (this.timeOfDay >= 8 && this.timeOfDay < 17) {
      phase = 'day'
      t = 0
    } else if (this.timeOfDay >= 17 && this.timeOfDay < 20) {
      phase = 'dusk'
      t = (this.timeOfDay - 17) / 3
    } else {
      phase = 'night'
      t = 0
    }

    let colors: [string, string]
    if (phase === 'dawn') {
      const night = this.daySkyColors['night']
      const dawn = this.daySkyColors['dawn']
      colors = [
        lerpColor(night[0], dawn[0], t),
        lerpColor(night[1], dawn[1], t),
      ]
    } else if (phase === 'dusk') {
      const day = this.daySkyColors['day']
      const dusk = this.daySkyColors['dusk']
      colors = [
        lerpColor(day[0], dusk[0], t),
        lerpColor(day[1], dusk[1], t),
      ]
    } else {
      colors = this.daySkyColors[phase]
    }

    if (this.weatherTransition < 1) {
      const currentB = WEATHER_CONFIGS[this.weather].brightness
      const nextB = WEATHER_CONFIGS[this.nextWeather].brightness
      const weatherBrightness = lerp(currentB, nextB, this.weatherTransition)
      colors = [
        lerpColor(colors[0], '#1a1a1a', 1 - weatherBrightness),
        lerpColor(colors[1], '#2a2a2a', 1 - weatherBrightness),
      ]
    } else {
      const weatherBrightness = WEATHER_CONFIGS[this.weather].brightness
      colors = [
        lerpColor(colors[0], '#1a1a1a', 1 - weatherBrightness),
        lerpColor(colors[1], '#2a2a2a', 1 - weatherBrightness),
      ]
    }

    this.skyColors = colors
  }

  private calculateBrightness(): number {
    const normalizedTime = (this.timeOfDay + 6) % 24 / 24
    const angle = normalizedTime * Math.PI * 2
    return 0.25 + 0.75 * Math.max(0, Math.sin(angle))
  }

  drawSky(ctx: CanvasRenderingContext2D, width: number, height: number, sceneSkyColors?: [string, string]): void {
    let colors = this.skyColors
    if (sceneSkyColors) {
      colors = [
        lerpColor(sceneSkyColors[0], this.skyColors[0], 0.4),
        lerpColor(sceneSkyColors[1], this.skyColors[1], 0.4),
      ]
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, height * 0.7)
    gradient.addColorStop(0, colors[0])
    gradient.addColorStop(1, colors[1])
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    if (this.timeOfDay < 6 || this.timeOfDay > 20) {
      this.drawStars(ctx, width, height)
    }

    if (this.timeOfDay >= 6 && this.timeOfDay <= 9) {
      this.drawSun(ctx, width, height, (this.timeOfDay - 6) / 3)
    } else if (this.timeOfDay >= 16 && this.timeOfDay <= 20) {
      this.drawSun(ctx, width, height, 1 - (this.timeOfDay - 16) / 4)
    }

    if (this.fogDensity > 0) {
      ctx.fillStyle = `rgba(200, 200, 220, ${this.fogDensity * 0.4})`
      ctx.fillRect(0, 0, width, height)
    }
  }

  private drawStars(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const starCount = 100
    const nightAlpha = this.timeOfDay < 6
      ? 1 - this.timeOfDay / 6
      : this.timeOfDay > 20
        ? (this.timeOfDay - 20) / 4
        : 0

    ctx.fillStyle = `rgba(255, 255, 255, ${nightAlpha * 0.8})`
    for (let i = 0; i < starCount; i++) {
      const x = (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * width
      const y = (Math.sin(i * 78.233) * 43758.5453 % 1 + 1) % 1 * height * 0.6
      const size = ((i % 3) + 1)
      const twinkle = 0.7 + 0.3 * Math.sin(Date.now() * 0.002 + i)
      ctx.globalAlpha = nightAlpha * twinkle
      ctx.fillRect(x, y, size, size)
    }
    ctx.globalAlpha = 1
  }

  private drawSun(ctx: CanvasRenderingContext2D, width: number, height: number, progress: number): void {
    const sunX = width * 0.5 + (progress - 0.5) * width * 0.6
    const sunY = height * 0.6 - progress * height * 0.4
    const sunSize = 50

    const gradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunSize * 3)
    gradient.addColorStop(0, 'rgba(255, 230, 100, 0.9)')
    gradient.addColorStop(0.3, 'rgba(255, 150, 50, 0.5)')
    gradient.addColorStop(1, 'rgba(255, 100, 50, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(sunX - sunSize * 3, sunY - sunSize * 3, sunSize * 6, sunSize * 6)

    ctx.fillStyle = '#FFE600'
    ctx.shadowColor = '#FF8800'
    ctx.shadowBlur = 40
    ctx.beginPath()
    ctx.arc(sunX, sunY, sunSize, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  getTimeDisplay(): string {
    const hours = Math.floor(this.timeOfDay)
    const minutes = Math.floor((this.timeOfDay - hours) * 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  getWeatherDisplay(): { name: string; icon: string } {
    return WEATHER_CONFIGS[this.weather]
  }

  getRainParticleCount(): number {
    const current = WEATHER_CONFIGS[this.weather].particleDensity
    const next = WEATHER_CONFIGS[this.nextWeather].particleDensity
    return Math.round(lerp(current, next, this.weatherTransition))
  }

  reset(): void {
    this.timeOfDay = 8
    this.weather = 'sunny'
    this.nextWeather = 'sunny'
    this.weatherTimer = 0
    this.weatherTransition = 1
  }
}
