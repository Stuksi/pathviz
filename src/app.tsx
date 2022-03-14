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

const DEFAULT_TILE_SIZE = 200

const SELECTED_TOOL_COLOR = '#fdfeff'
const DEFAULT_TILE_COLOR  = '#f8f9fc'
const START_TILE_COLOR    = '#5aad57'
const END_TILE_COLOR      = '#e00404'
const WALL_TILE_COLOR     = '#38030f'
const SEARCH_TILE_COLOR   = '#0c04bc'

const DEFAULT_TILE_STATE = 0
const START_TILE_STATE   = 1
const END_TILE_STATE     = 2
const WALL_TILE_STATE    = 3
const SEARCH_TILE_STATE  = 4

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
        <Tile key={x + y} position={{x, y}} size={tileSize}/>
      )))
    }, 50)

    resize()
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [])

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
  const { tilesState, tilesStateSetters } = useContext(AppContext)
  const [algorithm, setAlgorithm] = useState(DEPTH_FIRST_SEARCH_ALGORITHM_STATE)

  const handleClick = async () => {
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

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setAlgorithm(algorithmNameStateMap(event.target.value))
  }

  return (
    <div className='controls'>
      <div className='simulation-control'>
        <button onClick={handleClick}>Run Simulation</button>
        <select className='algorithms-dropdown' onChange={handleChange}>
          {
            ALGORITHMS.map((algorithm, index) => (
              <option key={index}>{algorithm}</option>
            ))
          }
        </select>
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
    />
  )
}

ReactDOM.render(<App />, document.getElementById('root'))

// ==== ALgorithms ==== //

async function DepthFirstSearch(
  startTilePosition: Position,
  endTilePosition: Position,
  tileStates: TilesState,
  tilesStateSetters: TilesStateSetters
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
    startTilePosition.x < 0 ||
    startTilePosition.x >= tileStates.length ||
    startTilePosition.y < 0 ||
    startTilePosition.y >= tileStates[0].length ||
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

  const leftTilePosition   = {x: startTilePosition.x - 1, y: startTilePosition.y}
  const bottomTilePosition = {x: startTilePosition.x,     y: startTilePosition.y + 1}
  const rightTilePosition  = {x: startTilePosition.x + 1, y: startTilePosition.y}
  const topTilePosition    = {x: startTilePosition.x,     y: startTilePosition.y - 1}

  const leftSearch   = RecursiveDepthFirstSearch(leftTilePosition, endTilePosition, tileStates, tilesStateSetters, usedTiles)
  const bottomSearch = RecursiveDepthFirstSearch(bottomTilePosition, endTilePosition, tileStates, tilesStateSetters, usedTiles)
  const rightSearch  = RecursiveDepthFirstSearch(rightTilePosition, endTilePosition, tileStates, tilesStateSetters, usedTiles)
  const topSearch    = RecursiveDepthFirstSearch(topTilePosition, endTilePosition, tileStates, tilesStateSetters, usedTiles)

  if (
    await leftSearch   ||
    await bottomSearch ||
    await rightSearch  ||
    await topSearch
  ) {
    tilesStateSetters[startTilePosition.x][startTilePosition.y](START_TILE_STATE)
    return true
  }

  tilesStateSetters[startTilePosition.x][startTilePosition.y](DEFAULT_TILE_STATE)
  return false
}

async function BreathFirstSearch(startTile: Position, endTile: Position, tileStates: TilesState, tilesStateSetters: TilesStateSetters) {
  const queue = [startTile]
  const used = createMatrix(tileStates.length, tileStates[0].length, () => false)

  while (queue.length > 0) {
    const front = queue.shift()

    await new Promise(resolve => setTimeout(resolve, 0))

    if (front.x - 1 >= 0) {
      const tile = {
        x: front.x - 1,
        y: front.y,
      }

      if (!used[tile.x][tile.y] && tileStates[tile.x][tile.y] !== WALL_TILE_STATE) {
        if (tile.x === endTile.x && tile.y === endTile.y) {
          return true
        }

        used[tile.x][tile.y] = true

        queue.push(tile)

        tilesStateSetters[tile.x][tile.y](SEARCH_TILE_STATE)
      }
    }

    if (front.x + 1 < tileStates.length) {
      const tile = {
        x: front.x + 1,
        y: front.y,
      }

      if (!used[tile.x][tile.y] && tileStates[tile.x][tile.y] !== WALL_TILE_STATE) {
        if (tile.x === endTile.x && tile.y === endTile.y) {
          return true
        }

        used[tile.x][tile.y] = true

        queue.push(tile)

        tilesStateSetters[tile.x][tile.y](SEARCH_TILE_STATE)
      }
    }

    if (front.y - 1 >= 0) {
      const tile = {
        x: front.x,
        y: front.y - 1,
      }

      if (!used[tile.x][tile.y] && tileStates[tile.x][tile.y] !== WALL_TILE_STATE) {
        if (tile.x === endTile.x && tile.y === endTile.y) {
          return true
        }

        used[tile.x][tile.y] = true

        queue.push(tile)

        tilesStateSetters[tile.x][tile.y](SEARCH_TILE_STATE)
      }
    }

    if (front.y + 1 < tileStates[0].length) {
      const tile = {
        x: front.x,
        y: front.y + 1,
      }

      if (!used[tile.x][tile.y] && tileStates[tile.x][tile.y] !== WALL_TILE_STATE) {
        if (tile.x === endTile.x && tile.y === endTile.y) {
          return true
        }

        used[tile.x][tile.y] = true

        queue.push(tile)

        tilesStateSetters[tile.x][tile.y](SEARCH_TILE_STATE)
      }
    }
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
