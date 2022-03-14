import React, { createContext, useContext, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import './app.css'

import _ from 'lodash'

import DefaultPointerIcon from './assets/default-pointer-icon.png'
import EraserPointerIcon  from './assets/eraser-pointer-icon.png'
import WallIcon           from './assets/wall-icon.png'
import BrushCursor        from './assets/brush-cursor.png'
import EraserCursor       from './assets/eraser-cursor.png'

// ==== Constants ==== //

const DEFAULT_TILE_SIZE = 100
const MIN_TILE_SIZE = 20
const MAX_TILE_SIZE = 200
const TILE_SIZE_STEP = 10

const SELECTED_TOOL_COLOR = '#fdfeff'
const DEFAULT_TILE_COLOR  = '#f8f9fc'
const START_TILE_COLOR    = '#5aad57'
const END_TILE_COLOR      = '#e00404'
const WALL_TILE_COLOR     = '#38030f'
const SEARCH_TILE_COLOR   = '#0c04bc'
const PATH_TILE_COLOR     = '#ffdf00'

const DEFAULT_TILE_STATE = 0
const START_TILE_STATE   = 1
const END_TILE_STATE     = 2
const WALL_TILE_STATE    = 3
const SEARCH_TILE_STATE  = 4
const PATH_TILE_STATE    = 5

const POINTER_TOOL_STATE    = 0
const WALL_BRUSH_TOOL_STATE = 1
const ERASER_TOOL_STATE     = 2

const DEPTH_FIRST_SEARCH_ALGORITHM_STATE  = 0
const BREATH_FIRST_SEARCH_ALGORITHM_STATE = 1
const A_STAR_SEARCH_ALGORITHM_STATE       = 2
const DIJKSTRA_SEARCH_ALGORITHM_STATE     = 3

const ALGORITHMS = [
  'Depth First Search',
  'Breath First Search',
  'A*',
  'Dijkstra',
]

const DEFAULT_APP_CONTEXT = {
  tool: undefined,
  setTool: () => undefined,
  tileSize: undefined,
  setTileSize: () => undefined,
  tilesState: undefined,
  setTilesState: () => undefined,
  tilesStateSetters: undefined,
  setTilesStateSetters: () => undefined,
}

const DEFAULT_PATH_FINDING_WAIT_TIME = 100
const MIN_PATH_FINDING_WAIT_TIME      = 4
const MAX_PATH_FINDING_WAIT_TIME      = 250
const PATH_FINDING_WAIT_TIME_STEP     = 15

const RESIZE_DEBOUCE             = 50

// ==== Mappers ==== //

function toolCursorMap(tool: number) {
  switch (tool) {
  case POINTER_TOOL_STATE:
    return 'default'
  case WALL_BRUSH_TOOL_STATE:
    return `url(${BrushCursor}) 0 32, auto`
  case ERASER_TOOL_STATE:
    return `url(${EraserCursor}) 0 32, auto`
  default:
    return 'default'
  }
}

function tileStateColorMap(state: number) {
  switch (state) {
  case DEFAULT_TILE_STATE:
    return DEFAULT_TILE_COLOR
  case START_TILE_STATE:
    return START_TILE_COLOR
  case END_TILE_STATE:
    return END_TILE_COLOR
  case WALL_TILE_STATE:
    return WALL_TILE_COLOR
  case SEARCH_TILE_STATE:
    return SEARCH_TILE_COLOR
  case PATH_TILE_STATE:
    return PATH_TILE_COLOR
  default:
    return DEFAULT_TILE_COLOR
  }
}

function algorithmNameStateMap(name: string) {
  switch (name) {
  case 'Depth First Search':
    return DEPTH_FIRST_SEARCH_ALGORITHM_STATE
  case 'Breath First Search':
    return BREATH_FIRST_SEARCH_ALGORITHM_STATE
  case 'A*':
    return A_STAR_SEARCH_ALGORITHM_STATE
  case 'Dijkstra':
    return DIJKSTRA_SEARCH_ALGORITHM_STATE
  default:
    return undefined
  }
}

// ==== Interfaces / Types ==== //

declare global {
  interface Window {
    PATH_FINDING_WAIT_TIME: number
  }
}

type TilesState = number[][]
type TilesStateSetters = React.Dispatch<React.SetStateAction<number>>[][]

interface Position {
  x: number
  y: number
}

interface TileProps {
  position: Position
  size: number
}

interface ToolIconProps {
  src: string
  tool: number
}

interface AppContextProps {
  tool: number
  setTool: React.Dispatch<React.SetStateAction<number>>
  tileSize: number
  setTileSize: React.Dispatch<React.SetStateAction<number>>
  tilesState: TilesState
  setTilesState: React.Dispatch<React.SetStateAction<TilesState>>
  tilesStateSetters: TilesStateSetters
  setTilesStateSetters: React.Dispatch<React.SetStateAction<TilesStateSetters>>
}

// ==== Contexts ==== //

const AppContext = createContext<AppContextProps>(DEFAULT_APP_CONTEXT)

// ==== Components ==== //

function App() {
  const [tool,                           setTool] = useState(POINTER_TOOL_STATE)
  const [tileSize,                   setTileSize] = useState(DEFAULT_TILE_SIZE)
  const [tilesState,               setTilesState] = useState([])
  const [tilesStateSetters, setTilesStateSetters] = useState([])

  const contextValue = {
    tool,
    setTool,
    tileSize,
    setTileSize,
    tilesState,
    setTilesState,
    tilesStateSetters,
    setTilesStateSetters,
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className='main'>
        <Grid />
        <Controls />
      </div>
    </AppContext.Provider>
  )
}

function Grid() {
  const [grid,       setGrid] = useState([])
  const [padding, setPadding] = useState('')
  const [cursor,   setCursor] = useState('default')

  const {
    tool,
    tileSize,
    setTilesState,
    setTilesStateSetters,
  } = useContext(AppContext)

  useEffect(() => {
    const element = document.querySelector('div.grid')

    const resize = _.debounce(() => {
      const width   = element.clientWidth  - (element.clientWidth  % tileSize)
      const height  = element.clientHeight - (element.clientHeight % tileSize)
      const horizontalPadding = (element.clientWidth  - width)  / 2  + 'px'
      const verticalPadding   = (element.clientHeight - height) / 2  + 'px'
      const horizontalTilesCount = width  / tileSize
      const verticalTilesCount   = height / tileSize

      setPadding(verticalPadding + ' ' + horizontalPadding)
      setTilesState(createMatrix(horizontalTilesCount, verticalTilesCount))
      setTilesStateSetters(createMatrix(horizontalTilesCount, verticalTilesCount))
      setGrid(createMatrix(horizontalTilesCount, verticalTilesCount, (x, y) => (
        <Tile key={_.uniqueId()} position={{x, y}} size={tileSize}/>
      )))
    }, RESIZE_DEBOUCE)

    resize()

    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [tileSize])

  useEffect(() => {
    setCursor(toolCursorMap(tool))
  }, [tool])

  return (
    <div className='grid-wrapper' style={{ padding, cursor }}>
      <div className='grid'>
        { grid }
      </div>
    </div>
  )
}

function Tile(props: TileProps) {
  const [state, setState] = useState(DEFAULT_TILE_STATE)

  const {
    tool,
    tilesState,
    setTilesState,
    tilesStateSetters,
    setTilesStateSetters,
  } = useContext(AppContext)

  const style: React.CSSProperties = {
    left:            props.position.x * props.size + 'px',
    top:             props.position.y * props.size + 'px',
    width:           props.size + 'px',
    height:          props.size + 'px',
    backgroundColor: tileStateColorMap(state),
  }

  useEffect(() => {
    setTilesStateSetters(tilesStateSetters => {
      tilesStateSetters[props.position.x][props.position.y] = setState
      return tilesStateSetters
    })
  }, [])

  useEffect(() => {
    setTilesState(tilesState => {
      tilesState[props.position.x][props.position.y] = state
      return tilesState
    })
  }, [state])

  const handleMouseOver = (event: React.MouseEvent) => {
    event.preventDefault()

    if (event.buttons === 1) {
      if (tool === WALL_BRUSH_TOOL_STATE) {
        setState(WALL_TILE_STATE)
      } else if (tool === ERASER_TOOL_STATE) {
        setState(DEFAULT_TILE_STATE)
      }
    }
  }

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()

    if (event.button === 2) {
      if (tool === POINTER_TOOL_STATE) {
        const endTilePosition = findTilePosition(tilesState, END_TILE_STATE)

        if (endTilePosition) {
          tilesStateSetters[endTilePosition.x][endTilePosition.y](DEFAULT_TILE_STATE)
        }

        setState(END_TILE_STATE)
      }
    }
  }

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault()

    if (event.button === 0) {
      if (tool === POINTER_TOOL_STATE) {
        const startTilePosition = findTilePosition(tilesState, START_TILE_STATE)

        if (startTilePosition) {
          tilesStateSetters[startTilePosition.x][startTilePosition.y](DEFAULT_TILE_STATE)
        }

        setState(START_TILE_STATE)
      } else if (tool === WALL_BRUSH_TOOL_STATE) {
        setState(WALL_TILE_STATE)
      } else if (tool === ERASER_TOOL_STATE) {
        setState(DEFAULT_TILE_STATE)
      }
    }
  }

  return (
    <div
      className='tile'
      style={style}
      onMouseOver={handleMouseOver}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    />
  )
}

function Controls() {
  const [algorithm,                       setAlgorithm] = useState(DEPTH_FIRST_SEARCH_ALGORITHM_STATE)
  const [pathFindingWaitTime,   setPathFindingWaitTime] = useState(DEFAULT_PATH_FINDING_WAIT_TIME)

  const {
    tileSize,
    setTileSize,
    tilesState,
    tilesStateSetters,
  } = useContext(AppContext)

  const simulate = async () => {
    reset()

    const startTilePosition = findTilePosition(tilesState, START_TILE_STATE)
    const endTilePosition   = findTilePosition(tilesState, END_TILE_STATE)

    if (startTilePosition && endTilePosition) {
      switch (algorithm) {
      case DEPTH_FIRST_SEARCH_ALGORITHM_STATE:
        return DepthFirstSearch(startTilePosition, endTilePosition, tilesState, tilesStateSetters)
      case BREATH_FIRST_SEARCH_ALGORITHM_STATE:
        return BreathFirstSearch(startTilePosition, endTilePosition, tilesState, tilesStateSetters)
      default:
        return undefined
      }
    }
  }

  const reset = () => {
    tilesStateSetters.forEach((tilesStateSetterContainers, x) => {
      tilesStateSetterContainers.forEach((tilesStateSetter, y) => {
        if (
          tilesState[x][y] !== START_TILE_STATE &&
          tilesState[x][y] !== END_TILE_STATE   &&
          tilesState[x][y] !== WALL_TILE_STATE
        ) {
          tilesStateSetter(DEFAULT_TILE_STATE)
        }
      })
    })
  }

  const handleAlgorithmChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setAlgorithm(algorithmNameStateMap(event.target.value))
  }

  const handleSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTileSize(parseInt(event.target.value))
  }

  const handleWaitTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const pathFindingWaitTime = parseInt(event.target.value)

    setPathFindingWaitTime(pathFindingWaitTime)
    window.PATH_FINDING_WAIT_TIME = pathFindingWaitTime
  }

  return (
    <div className='controls'>
      <div className='simulation-control'>
        <button onClick={simulate}>Run Simulation</button>
        <select className='algorithms-dropdown' onChange={handleAlgorithmChange}>
          {
            ALGORITHMS.map((algorithm, index) => (
              <option key={index}>{algorithm}</option>
            ))
          }
        </select>
        <button onClick={reset}>Reset</button>
        <input
          type='range'
          min={MIN_TILE_SIZE}
          max={MAX_TILE_SIZE}
          step={TILE_SIZE_STEP}
          value={tileSize}
          onChange={handleSizeChange}
        />
        <input
          type='range'
          min={MIN_PATH_FINDING_WAIT_TIME}
          max={MAX_PATH_FINDING_WAIT_TIME}
          step={PATH_FINDING_WAIT_TIME_STEP}
          value={pathFindingWaitTime}
          onChange={handleWaitTimeChange}
        />
      </div>
      <div className='tools'>
        <ToolIcon src={DefaultPointerIcon} tool={POINTER_TOOL_STATE} />
        <ToolIcon src={WallIcon} tool={WALL_BRUSH_TOOL_STATE} />
        <ToolIcon src={EraserPointerIcon} tool={ERASER_TOOL_STATE} />
      </div>
    </div>
  )
}

function ToolIcon({ src, tool: toolState }: ToolIconProps) {
  const { tool, setTool } = useContext(AppContext)
  const backgroundColor = tool === toolState ? SELECTED_TOOL_COLOR : undefined

  const handleClick = () => {
    setTool(toolState)
  }

  return (
    <input
      className='tool-selector'
      type='image'
      src={src}
      onClick={handleClick}
      style={{ backgroundColor }}
      draggable={false}
    />
  )
}

ReactDOM.render(<App />, document.getElementById('root'))

// ==== Algorithms ==== //

async function DepthFirstSearch(
  startTilePosition: Position,
  endTilePosition: Position,
  tileStates: TilesState,
  tilesStateSetters: TilesStateSetters,
) {
  const usedTiles = createMatrix(tileStates.length, tileStates[0].length, () => false)

  const leftTilePosition   = {x: startTilePosition.x - 1, y: startTilePosition.y}
  const bottomTilePosition = {x: startTilePosition.x,     y: startTilePosition.y + 1}
  const rightTilePosition  = {x: startTilePosition.x + 1, y: startTilePosition.y}
  const topTilePosition    = {x: startTilePosition.x,     y: startTilePosition.y - 1}

  usedTiles[startTilePosition.x][startTilePosition.y] = true

  return (
    await RecursiveDepthFirstSearch(leftTilePosition, endTilePosition, tileStates, tilesStateSetters, usedTiles)   ||
    await RecursiveDepthFirstSearch(bottomTilePosition, endTilePosition, tileStates, tilesStateSetters, usedTiles) ||
    await RecursiveDepthFirstSearch(rightTilePosition, endTilePosition, tileStates, tilesStateSetters, usedTiles)  ||
    await RecursiveDepthFirstSearch(topTilePosition, endTilePosition, tileStates, tilesStateSetters, usedTiles)
  )
}

async function RecursiveDepthFirstSearch(
  startTilePosition: Position,
  endTilePosition: Position,
  tileStates: TilesState,
  tilesStateSetters: TilesStateSetters,
  usedTiles: boolean[][],
) {
  if (
    startTilePosition.x < 0                             ||
    startTilePosition.x >= tileStates.length            ||
    startTilePosition.y < 0                             ||
    startTilePosition.y >= tileStates[0].length         ||
    usedTiles[startTilePosition.x][startTilePosition.y] ||
    tileStates[startTilePosition.x][startTilePosition.y] === WALL_TILE_STATE
  ) {
    return false
  }

  if (startTilePosition.x === endTilePosition.x && startTilePosition.y === endTilePosition.y) {
    return true
  }

  usedTiles[startTilePosition.x][startTilePosition.y] = true
  tilesStateSetters[startTilePosition.x][startTilePosition.y](SEARCH_TILE_STATE)

  await wait(window.PATH_FINDING_WAIT_TIME)

  const leftTilePosition   = {x: startTilePosition.x - 1, y: startTilePosition.y}
  const bottomTilePosition = {x: startTilePosition.x,     y: startTilePosition.y + 1}
  const rightTilePosition  = {x: startTilePosition.x + 1, y: startTilePosition.y}
  const topTilePosition    = {x: startTilePosition.x,     y: startTilePosition.y - 1}

  const leftSearch = await RecursiveDepthFirstSearch(leftTilePosition, endTilePosition, tileStates, tilesStateSetters, usedTiles)
  if (leftSearch) {
    tilesStateSetters[startTilePosition.x][startTilePosition.y](PATH_TILE_STATE)
    return true
  }

  const bottomSearch = await RecursiveDepthFirstSearch(bottomTilePosition, endTilePosition, tileStates, tilesStateSetters, usedTiles)
  if (bottomSearch) {
    tilesStateSetters[startTilePosition.x][startTilePosition.y](PATH_TILE_STATE)
    return true
  }

  const rightSearch = await RecursiveDepthFirstSearch(rightTilePosition, endTilePosition, tileStates, tilesStateSetters, usedTiles)
  if (rightSearch) {
    tilesStateSetters[startTilePosition.x][startTilePosition.y](PATH_TILE_STATE)
    return true
  }

  const topSearch = await RecursiveDepthFirstSearch(topTilePosition, endTilePosition, tileStates, tilesStateSetters, usedTiles)
  if (topSearch) {
    tilesStateSetters[startTilePosition.x][startTilePosition.y](PATH_TILE_STATE)
    return true
  }

  tilesStateSetters[startTilePosition.x][startTilePosition.y](DEFAULT_TILE_STATE)
  await wait(window.PATH_FINDING_WAIT_TIME)

  return false
}

async function BreathFirstSearch(
  startTilePosition: Position,
  endTilePosition: Position,
  tileStates: TilesState,
  tilesStateSetters: TilesStateSetters,
) {
  const pathsQueue: Position[][] = []
  const usedTiles = createMatrix(tileStates.length, tileStates[0].length, () => false)

  usedTiles[startTilePosition.x][startTilePosition.y] = true

  if (startTilePosition.x - 1 >= 0) {
    const leftTilePosition = {x: startTilePosition.x - 1, y: startTilePosition.y}

    usedTiles[leftTilePosition.x][leftTilePosition.y] = true
    pathsQueue.push([leftTilePosition])
    tilesStateSetters[leftTilePosition.x][leftTilePosition.y](SEARCH_TILE_STATE)
  }

  if (startTilePosition.y + 1 < tileStates[0].length) {
    const bottomTilePosition = {x: startTilePosition.x, y: startTilePosition.y + 1}

    usedTiles[bottomTilePosition.x][bottomTilePosition.y] = true
    pathsQueue.push([bottomTilePosition])
    tilesStateSetters[bottomTilePosition.x][bottomTilePosition.y](SEARCH_TILE_STATE)
  }

  if (startTilePosition.x + 1 < tileStates.length) {
    const rightTilePosition = {x: startTilePosition.x + 1, y: startTilePosition.y}

    usedTiles[rightTilePosition.x][rightTilePosition.y] = true
    pathsQueue.push([rightTilePosition])
    tilesStateSetters[rightTilePosition.x][rightTilePosition.y](SEARCH_TILE_STATE)
  }

  if (startTilePosition.y - 1 >= 0) {
    const topTilePosition = {x: startTilePosition.x, y: startTilePosition.y - 1}

    usedTiles[topTilePosition.x][topTilePosition.y] = true
    pathsQueue.push([topTilePosition])
    tilesStateSetters[topTilePosition.x][topTilePosition.y](SEARCH_TILE_STATE)
  }

  while (pathsQueue.length > 0) {
    const path = pathsQueue.shift()
    const lastTilePosition = _.last(path)

    if (lastTilePosition.x - 1 >= 0) {
      const leftTilePosition = {x: lastTilePosition.x - 1, y: lastTilePosition.y}

      if (leftTilePosition.x === endTilePosition.x && leftTilePosition.y === endTilePosition.y) {
        _.reverse(path).forEach(tilePosition => {
          tilesStateSetters[tilePosition.x][tilePosition.y](PATH_TILE_STATE)
        })

        return true
      }

      if (
        !usedTiles[leftTilePosition.x][leftTilePosition.y] &&
        tileStates[leftTilePosition.x][leftTilePosition.y] !== WALL_TILE_STATE
      ) {
        usedTiles[leftTilePosition.x][leftTilePosition.y] = true
        pathsQueue.push(path.concat([leftTilePosition]))
        tilesStateSetters[leftTilePosition.x][leftTilePosition.y](SEARCH_TILE_STATE)
      }
    }

    if (lastTilePosition.y + 1 < tileStates[0].length) {
      const bottomTilePosition = {x: lastTilePosition.x, y: lastTilePosition.y + 1}

      if (bottomTilePosition.x === endTilePosition.x && bottomTilePosition.y === endTilePosition.y) {
        _.reverse(path).forEach(tilePosition => {
          tilesStateSetters[tilePosition.x][tilePosition.y](PATH_TILE_STATE)
        })

        return true
      }

      if (
        !usedTiles[bottomTilePosition.x][bottomTilePosition.y] &&
        tileStates[bottomTilePosition.x][bottomTilePosition.y] !== WALL_TILE_STATE
      ) {
        usedTiles[bottomTilePosition.x][bottomTilePosition.y] = true
        pathsQueue.push(path.concat([bottomTilePosition]))
        tilesStateSetters[bottomTilePosition.x][bottomTilePosition.y](SEARCH_TILE_STATE)
      }
    }

    if (lastTilePosition.x + 1 < tileStates.length) {
      const rightTilePosition = {x: lastTilePosition.x + 1, y: lastTilePosition.y}

      if (rightTilePosition.x === endTilePosition.x && rightTilePosition.y === endTilePosition.y) {
        _.reverse(path).forEach(tilePosition => {
          tilesStateSetters[tilePosition.x][tilePosition.y](PATH_TILE_STATE)
        })

        return true
      }

      if (
        !usedTiles[rightTilePosition.x][rightTilePosition.y] &&
        tileStates[rightTilePosition.x][rightTilePosition.y] !== WALL_TILE_STATE
      ) {
        usedTiles[rightTilePosition.x][rightTilePosition.y] = true
        pathsQueue.push(path.concat([rightTilePosition]))
        tilesStateSetters[rightTilePosition.x][rightTilePosition.y](SEARCH_TILE_STATE)
      }
    }

    if (lastTilePosition.y - 1 >= 0) {
      const topTilePosition = {x: lastTilePosition.x, y: lastTilePosition.y - 1}

      if (topTilePosition.x === endTilePosition.x && topTilePosition.y === endTilePosition.y) {
        _.reverse(path).forEach(tilePosition => {
          tilesStateSetters[tilePosition.x][tilePosition.y](PATH_TILE_STATE)
        })

        return true
      }

      if (
        !usedTiles[topTilePosition.x][topTilePosition.y] &&
        tileStates[topTilePosition.x][topTilePosition.y] !== WALL_TILE_STATE
      ) {
        usedTiles[topTilePosition.x][topTilePosition.y] = true
        pathsQueue.push(path.concat([topTilePosition]))
        tilesStateSetters[topTilePosition.x][topTilePosition.y](SEARCH_TILE_STATE)
      }
    }

    await wait(window.PATH_FINDING_WAIT_TIME)
  }

  return false
}

// ==== Utils ==== //

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createMatrix(width: number, height: number, fill?: (x: number, y: number) => any) {
  return new Array(width).fill(0).map((_, x) => (
    new Array(height).fill(0).map((_, y) => (
      fill ? fill(x, y) : undefined
    ))
  ))
}

function findTilePosition(tilesState: TilesState, tileStateType: number): Position {
  for (let x = 0; x < tilesState.length; x++) {
    for (let y = 0; y < tilesState[0].length; y++) {
      if (tilesState[x][y] === tileStateType) {
        return {x, y}
      }
    }
  }
}

function wait(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

