import React, { createContext, useContext, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import './app.css'

import _, { max } from 'lodash'

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

const RESIZE_DEBOUCE = 50

const PATH_MOVES = [
  [-1,  0],
  [ 0,  1],
  [ 1,  0],
  [ 0, -1],
]

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
  const [isSimulating,                 setIsSimulating] = useState(false)

  const {
    tileSize,
    setTileSize,
    tilesState,
    tilesStateSetters,
  } = useContext(AppContext)

  const simulate = async () => {
    const startTilePosition = findTilePosition(tilesState, START_TILE_STATE)
    const endTilePosition   = findTilePosition(tilesState, END_TILE_STATE)

    if (startTilePosition && endTilePosition) {
      if (!isSimulating) {
        reset()
        setIsSimulating(true)

        console.log(await AStar(startTilePosition, endTilePosition, tilesState, tilesStateSetters))

        switch (algorithm) {
        case DEPTH_FIRST_SEARCH_ALGORITHM_STATE:
          return DepthFirstSearch(startTilePosition, endTilePosition, tilesState, tilesStateSetters)
            .then(() => setIsSimulating(false))
        case BREATH_FIRST_SEARCH_ALGORITHM_STATE:
          return BreathFirstSearch(startTilePosition, endTilePosition, tilesState, tilesStateSetters)
            .then(() => setIsSimulating(false))
        case A_STAR_SEARCH_ALGORITHM_STATE:
          return AStar(startTilePosition, endTilePosition, tilesState, tilesStateSetters)
            .then(() => setIsSimulating(false))
        default:
          return undefined
        }
      }
    }
  }

  const reset = () => {
    if (!isSimulating) {
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
  tilesState: TilesState,
  tilesStateSetters: TilesStateSetters,
) {
  const usedTiles = createMatrix(tilesState.length, tilesState[0].length, () => false)

  usedTiles[startTilePosition.x][startTilePosition.y] = true

  for (const [xOffset, yOffset] of PATH_MOVES) {
    const tilePosition = {x: startTilePosition.x + xOffset, y: startTilePosition.y + yOffset}
    const search = await RecursiveDepthFirstSearch(tilePosition, endTilePosition, tilesState, tilesStateSetters, usedTiles)

    if (search) {
      tilesStateSetters[tilePosition.x][tilePosition.y](PATH_TILE_STATE)
      return true
    }
  }
}

async function RecursiveDepthFirstSearch(
  startTilePosition: Position,
  endTilePosition: Position,
  tilesState: TilesState,
  tilesStateSetters: TilesStateSetters,
  usedTiles: boolean[][],
) {
  if (
    startTilePosition.x < 0                             ||
    startTilePosition.x >= tilesState.length            ||
    startTilePosition.y < 0                             ||
    startTilePosition.y >= tilesState[0].length         ||
    usedTiles[startTilePosition.x][startTilePosition.y] ||
    tilesState[startTilePosition.x][startTilePosition.y] === WALL_TILE_STATE
  ) {
    return false
  }

  if (startTilePosition.x === endTilePosition.x && startTilePosition.y === endTilePosition.y) {
    return true
  }

  usedTiles[startTilePosition.x][startTilePosition.y] = true
  tilesStateSetters[startTilePosition.x][startTilePosition.y](SEARCH_TILE_STATE)

  await wait(window.PATH_FINDING_WAIT_TIME)

  for (const [xOffset, yOffset] of PATH_MOVES) {
    const tilePosition = {x: startTilePosition.x + xOffset, y: startTilePosition.y + yOffset}
    const search = await RecursiveDepthFirstSearch(tilePosition, endTilePosition, tilesState, tilesStateSetters, usedTiles)

    if (search) {
      tilesStateSetters[startTilePosition.x][startTilePosition.y](PATH_TILE_STATE)
      return true
    }
  }

  tilesStateSetters[startTilePosition.x][startTilePosition.y](DEFAULT_TILE_STATE)
  await wait(window.PATH_FINDING_WAIT_TIME)

  return false
}

async function BreathFirstSearch(
  startTilePosition: Position,
  endTilePosition: Position,
  tilesState: TilesState,
  tilesStateSetters: TilesStateSetters,
) {
  const pathsQueue: Position[][] = []
  const usedTiles = createMatrix(tilesState.length, tilesState[0].length, () => false)

  usedTiles[startTilePosition.x][startTilePosition.y] = true

  for (const [xOffset, yOffset] of PATH_MOVES) {
    const tilePosition = {x: startTilePosition.x + xOffset, y: startTilePosition.y + yOffset}

    if (
      tilePosition.x >= 0                &&
      tilePosition.x < tilesState.length &&
      tilePosition.y >= 0                &&
      tilePosition.y < tilesState[0].length
    ) {
      usedTiles[tilePosition.x][tilePosition.y] = true
      pathsQueue.push([tilePosition])
      tilesStateSetters[tilePosition.x][tilePosition.y](SEARCH_TILE_STATE)
    }
  }

  while (pathsQueue.length > 0) {
    const path = pathsQueue.shift()
    const lastTilePosition = _.last(path)

    for (const [xOffset, yOffset] of PATH_MOVES) {
      const tilePosition = {x: lastTilePosition.x + xOffset, y: lastTilePosition.y + yOffset}

      if (
        tilePosition.x >= 0                &&
        tilePosition.x < tilesState.length &&
        tilePosition.y >= 0                &&
        tilePosition.y < tilesState[0].length
      ) {
        if (tilePosition.x === endTilePosition.x && tilePosition.y === endTilePosition.y) {
          _.reverse(path).forEach(tilePosition => {
            tilesStateSetters[tilePosition.x][tilePosition.y](PATH_TILE_STATE)
          })

          return true
        }

        if (
          !usedTiles[tilePosition.x][tilePosition.y] &&
          tilesState[tilePosition.x][tilePosition.y] !== WALL_TILE_STATE
        ) {
          usedTiles[tilePosition.x][tilePosition.y] = true
          pathsQueue.push(path.concat([tilePosition]))
          tilesStateSetters[tilePosition.x][tilePosition.y](SEARCH_TILE_STATE)
        }
      }
    }

    await wait(window.PATH_FINDING_WAIT_TIME)
  }

  return false
}

async function AStar(
  startTilePosition: Position,
  endTilePosition: Position,
  tileStates: TilesState,
  tilesStateSetters: TilesStateSetters,
) {
  function h(tilePosition: Position) {
    return Math.abs(tilePosition.x - endTilePosition.x) + Math.abs(tilePosition.y - endTilePosition.y)
  }

  function d(t1: Position, t2: Position) {
    return Math.sqrt(Math.pow(Math.abs(t1.x - t2.x), 2) + Math.pow(Math.abs(t1.y - t2.y), 2))
  }

  let openSet  = []
  const cameFrom = []
  const gScore   = createMatrix(tileStates.length, tileStates[0].length, () => Infinity)
  const fScore   = createMatrix(tileStates.length, tileStates[0].length, () => Infinity)

  openSet.push(startTilePosition)
  gScore[startTilePosition.x][startTilePosition.y] = 0
  fScore[startTilePosition.x][startTilePosition.y] = h(startTilePosition)

  while (openSet.length > 0) {
    const smallest = _.min(_.map(fScore, (el) => _.min(el)))
    let closestTilePosition
    for (let x = 0; x < fScore.length; x++) {
      for (let y = 0; y < fScore[0].length; y++) {
        if (fScore[x][y] === smallest) {
          closestTilePosition = {x, y}
        }
      }
    }

    if (closestTilePosition.x === endTilePosition.x && closestTilePosition.y == endTilePosition.y) {
      return true
    }

    tilesStateSetters[closestTilePosition.x][closestTilePosition.y](SEARCH_TILE_STATE)

    let index = -1
    for (let i = 0; i < openSet.length; i++) {
      if (openSet[i].x === closestTilePosition.x && openSet[i].y === closestTilePosition.y) {
        index = i
        break
      }
    }

    openSet = openSet.slice(index, 1)

    for (const [xOffset, yOffset] of PATH_MOVES) {
      const neighbourTilePosition = {x: closestTilePosition.x + xOffset, y: closestTilePosition.y + yOffset}
      const tgScore = gScore[closestTilePosition.x][closestTilePosition.y] + d(closestTilePosition, neighbourTilePosition)

      if (tgScore < gScore[neighbourTilePosition.x][neighbourTilePosition.y]) {
        gScore[neighbourTilePosition.x][neighbourTilePosition.y] = tgScore
        fScore[neighbourTilePosition.x][neighbourTilePosition.y] = tgScore + h(neighbourTilePosition)

        let index2 = -1
        for (let i = 0; i < openSet.length; i++) {
          if (openSet[i].x === neighbourTilePosition.x && openSet[i].y === neighbourTilePosition.y) {
            index2 = i
            break
          }
        }
        if (index2 === -1) {
          openSet.push(neighbourTilePosition)
        }
      }
    }
  }

  return false
}

// ==== Utils ==== //

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createMatrix<T>(width: number, height: number, fill?: (x: number, y: number) => T) {
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

