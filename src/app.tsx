import React, { createContext, useContext, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import './app.css'

import DefaultPointerIcon from './assets/default-pointer-icon.png'
import EraserPointerIcon  from './assets/eraser-pointer-icon.png'
import WallIcon           from './assets/wall-icon.png'
import BrushCursor        from './assets/brush-cursor.png'
import EraserCursor       from './assets/eraser-cursor.png'

// ==== Constants ==== //

const TILE_SIZE = 50

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
  'Breath FIrst Search',
  'A*',
  'Dijkstra',
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
  default:
    return DEFAULT_TILE_COLOR
  }
}

// ==== Interfaces / Types ==== //

type TilesState = number[][]
type TilesStateSetters = React.Dispatch<React.SetStateAction<number>>[][]

interface TileProps {
  coordinates: {
    x: number
    y: number
  }
}

interface ToolIconProps {
  src: string
  tool: number
}

interface AppContextProps {
  tool: number
  setTool: React.Dispatch<React.SetStateAction<number>>
  tilesState: TilesState
  setTilesState: React.Dispatch<React.SetStateAction<TilesState>>
  tilesStateSetters: TilesStateSetters
  setTilesStateSetters: React.Dispatch<React.SetStateAction<TilesStateSetters>>
}

// ==== Contexts ==== //

const AppContext = createContext<AppContextProps>({
  tool: undefined,
  setTool: () => undefined,
  tilesState: undefined,
  setTilesState: () => undefined,
  tilesStateSetters: undefined,
  setTilesStateSetters: () => undefined,
})

// ==== Components ==== //

function App() {
  const [tool, setTool] = useState(POINTER_TOOL_STATE)
  const [tilesState, setTilesState] = useState([])
  const [tilesStateSetters, setTilesStateSetters] = useState([])
  const contextValue = {
    tool,
    setTool,
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
  const [dimensions, setDimensions] = useState({width: 0, height: 0})
  const [padding,       setPadding] = useState('')
  const [cursor,         setCursor] = useState('')
  const { tool, setTilesStateSetters, setTilesState } = useContext(AppContext)

  useEffect(() => {
    const element = document.querySelector('div.grid')
    const width   = element.clientWidth  - (element.clientWidth  % TILE_SIZE)
    const height  = element.clientHeight - (element.clientHeight % TILE_SIZE)
    const horizontalPadding = (element.clientWidth  - width)  / 2  + 'px'
    const verticalPadding   = (element.clientHeight - height) / 2  + 'px'

    setDimensions({width, height})
    setPadding(verticalPadding + ' ' + horizontalPadding)
    setCursor('default')
    setTilesStateSetters(new Array(width / TILE_SIZE).fill([]).map(() => new Array(height / TILE_SIZE).fill([])))
    setTilesState(new Array(width / TILE_SIZE).fill([]).map(() => new Array(height / TILE_SIZE).fill([])))
  }, [])

  useEffect(() => {
    setCursor(toolCursorMap(tool))
  }, [tool])

  return (
    <div className='grid-wrapper' style={{ padding, cursor }}>
      <div className='grid'>
        {
          new Array(dimensions.width / TILE_SIZE).fill(0).map((_, x) => (
            new Array(dimensions.height / TILE_SIZE).fill(0).map((_, y) => (
              <Tile key={x + y} coordinates={{x, y}}/>
            ))
          ))
        }
      </div>
    </div>
  )
}

function Tile(props: TileProps) {
  const [state, setState] = useState(DEFAULT_TILE_STATE)
  const { tool, tilesState, setTilesState, tilesStateSetters, setTilesStateSetters } = useContext(AppContext)

  const style: React.CSSProperties = {
    left:            props.coordinates.x * TILE_SIZE + 'px',
    top:             props.coordinates.y * TILE_SIZE + 'px',
    width:           TILE_SIZE + 'px',
    height:          TILE_SIZE + 'px',
    backgroundColor: tileStateColorMap(state),
  }

  useEffect(() => {
    setTilesStateSetters(tilesStateSetters => {
      tilesStateSetters[props.coordinates.x][props.coordinates.y] = setState
      return tilesStateSetters
    })
  }, [])

  useEffect(() => {
    setTilesState(tilesState => {
      tilesState[props.coordinates.x][props.coordinates.y] = state
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
        tilesState.forEach((stateArray, x) => {
          stateArray.forEach((s, y) => {
            if (s === END_TILE_STATE) {
              tilesStateSetters[x][y](DEFAULT_TILE_STATE)
            }
          })
        })

        setState(END_TILE_STATE)
      }
    }
  }

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault()

    if (event.button === 0) {
      if (tool === POINTER_TOOL_STATE) {
        tilesState.forEach((stateArray, x) => {
          stateArray.forEach((s, y) => {
            if (s === START_TILE_STATE) {
              tilesStateSetters[x][y](DEFAULT_TILE_STATE)
            }
          })
        })

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
  return (
    <div className='controls'>
      <div className='simulation-control'>
        <button>Run Simulation</button>
        <select className='algorithms-dropdown'>
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
