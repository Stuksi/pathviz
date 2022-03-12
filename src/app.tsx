import React, { createContext, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import './app.css'

const TILE_SIZE = 25

const DEFAULT_TILE_STATE = 0
const START_TILE_STATE   = 1
const END_TILE_STATE     = 2
const WALL_TILE_STATE    = 3

const DEPTH_FIRST_SEARCH_ALGORITHM_STATE = 0

const POINTER_TOOL_STATE = 0

interface TileProps {
  coordinates: {
    x: number
    y: number
  }
}

const AppContext = createContext({})

function App() {
  const [algorithm, setAlgorithm] = useState(DEPTH_FIRST_SEARCH_ALGORITHM_STATE)
  const [tool, setTool] = useState(POINTER_TOOL_STATE)
  const contextValue = { algorithm, tool, setAlgorithm, setTool }

  return (
    <AppContext.Provider value={contextValue}>
      <div className='main'>
        <Header />
        <Grid />
        <Footer />
      </div>
    </AppContext.Provider>
  )
}

function Header() {
  return (
    <div className='header'>HEADER</div>
  )
}

function Footer() {
  return (
    <div className='footer'>FOOTER</div>
  )
}

function Grid() {
  const [dimensions, setDimensions] = useState({width: 0, height: 0})
  const [padding, setPadding] = useState('')

  useEffect(() => {
    const element = document.querySelector('div.grid')
    const width   = element.clientWidth  - (element.clientWidth  % TILE_SIZE)
    const height  = element.clientHeight - (element.clientHeight % TILE_SIZE)
    const horizontalPadding = (element.clientWidth  - width)  / 2  + 'px'
    const verticalPadding   = (element.clientHeight - height) / 2 + 'px'

    setDimensions({width, height})
    setPadding(verticalPadding + ' ' + horizontalPadding)
  }, [])

  return (
    <div className='grid-wrapper' style={{ padding }}>
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
  const [color, setColor] = useState('#f8f9fc')
  const [state, setState] = useState(DEFAULT_TILE_STATE)

  const style: React.CSSProperties = {
    left:            props.coordinates.x * TILE_SIZE + 'px',
    top:             props.coordinates.y * TILE_SIZE + 'px',
    width:           TILE_SIZE + 'px',
    height:          TILE_SIZE + 'px',
    backgroundColor: color,
  }

  const handleMouseOver = (event: React.MouseEvent) => {
    event.preventDefault()

    if (event.buttons === 1) {
      setColor('#141414')
    }
  }

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    console.log(event.button)
  }

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault()
    console.log(event.button)
    if (event.button === 0) {
      setColor('#141414')
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

ReactDOM.render(<App />, document.getElementById('root'))
