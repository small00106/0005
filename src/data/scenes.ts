import type { SceneConfig } from '../types'

export const SCENE_CONFIGS: SceneConfig[] = [
  {
    id: 'neon_city',
    name: '霓虹都市',
    duration: 45,
    roadColor: '#1a1a2e',
    roadEdgeColor: '#00D4FF',
    roadsideColor: '#16213e',
    skyColors: ['#0f0c29', '#302b63'],
    buildingColors: ['#1a1a3e', '#2d1b4e', '#1e3a5f'],
    neonColors: ['#FF2D95', '#00D4FF', '#8B5CF6', '#00FF88'],
    decorations: [
      { type: 'building', color: '#1a1a3e', secondaryColor: '#FF2D95' },
      { type: 'building', color: '#2d1b4e', secondaryColor: '#00D4FF' },
      { type: 'building', color: '#1e3a5f', secondaryColor: '#8B5CF6' },
    ]
  },
  {
    id: 'coastal_highway',
    name: '海滨公路',
    duration: 45,
    roadColor: '#2d3436',
    roadEdgeColor: '#FFE600',
    roadsideColor: '#00b894',
    skyColors: ['#74b9ff', '#a29bfe'],
    buildingColors: ['#0984e3', '#00cec9', '#55efc4'],
    neonColors: ['#FFE600', '#00cec9', '#fd79a8'],
    decorations: [
      { type: 'palm', color: '#00b894', secondaryColor: '#6c5ce7' },
      { type: 'tree', color: '#00b894', secondaryColor: '#fdcb6e' },
    ]
  },
  {
    id: 'mountain_road',
    name: '山间赛道',
    duration: 45,
    roadColor: '#3d3d3d',
    roadEdgeColor: '#e17055',
    roadsideColor: '#636e72',
    skyColors: ['#2d3436', '#636e72'],
    buildingColors: ['#636e72', '#b2bec3', '#dfe6e9'],
    neonColors: ['#e17055', '#fdcb6e', '#00b894'],
    decorations: [
      { type: 'mountain', color: '#636e72', secondaryColor: '#2d3436' },
      { type: 'tree', color: '#2d3436', secondaryColor: '#00b894' },
    ]
  },
  {
    id: 'desert_sunset',
    name: '沙漠日落',
    duration: 45,
    roadColor: '#c69c6d',
    roadEdgeColor: '#d35400',
    roadsideColor: '#e67e22',
    skyColors: ['#f39c12', '#c0392b'],
    buildingColors: ['#e67e22', '#d35400', '#f1c40f'],
    neonColors: ['#e74c3c', '#f39c12', '#f1c40f'],
    decorations: [
      { type: 'cactus', color: '#27ae60', secondaryColor: '#16a085' },
      { type: 'mountain', color: '#d35400', secondaryColor: '#c0392b' },
    ]
  }
]

export const WEATHER_CONFIGS = {
  sunny: {
    name: '晴天',
    icon: '☀️',
    particleDensity: 0,
    brightness: 1.0,
    fogDensity: 0,
  },
  cloudy: {
    name: '多云',
    icon: '⛅',
    particleDensity: 0,
    brightness: 0.85,
    fogDensity: 0.2,
  },
  rain: {
    name: '雨天',
    icon: '🌧️',
    particleDensity: 150,
    brightness: 0.7,
    fogDensity: 0.3,
  },
  fog: {
    name: '雾天',
    icon: '🌫️',
    particleDensity: 0,
    brightness: 0.6,
    fogDensity: 0.6,
  }
} as const
