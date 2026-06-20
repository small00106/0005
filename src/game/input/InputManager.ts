import type { InputState } from '../../types'

export class InputManager {
  private keys: Set<string> = new Set()
  private state: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    drift: false,
    nitro: false,
  }
  private keyMap: Record<string, keyof InputState> = {
    'ArrowUp': 'up',
    'KeyW': 'up',
    'ArrowDown': 'down',
    'KeyS': 'down',
    'ArrowLeft': 'left',
    'KeyA': 'left',
    'ArrowRight': 'right',
    'KeyD': 'right',
    'Space': 'drift',
    'ShiftLeft': 'nitro',
    'ShiftRight': 'nitro',
  }

  constructor() {
    this.bindEvents()
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.code)
    const action = this.keyMap[e.code]
    if (action) {
      this.state[action] = true
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault()
      }
    }
  }

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code)
    const action = this.keyMap[e.code]
    if (action) {
      this.state[action] = false
    }
  }

  getState(): InputState {
    return { ...this.state }
  }

  isPressed(code: string): boolean {
    return this.keys.has(code)
  }

  setVirtualInput(action: keyof InputState, value: boolean): void {
    this.state[action] = value
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
  }
}
