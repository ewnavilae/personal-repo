import React, { useState } from "react"
import { render } from "react-dom"
import styled from "styled-components"

const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`

const RowContainer = styled.div`
  display: flex;
  flex: 1;
`

const NodeContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  background: white;
  border: 1px solid black;
  font-size: 0.5em;
`
const diagonals = false
const walls = true
const wallChance = 0.425
const expensive = false
const expensiveChance = 0.5
const size = 51
const maze = true
const terrain = false
const incrementalPath = false
const display = false

class Cell {
  x = 0
  y = 0
  index = 0
  neighbors: Cell[] = []
  wall = false
  expensive = 1

  constructor( x, y, index ) {
    this.x = x
    this.y = y
    this.index = index
    if ( Math.random() < wallChance && walls ) {
      this.wall = true
    }
    if ( Math.random() < expensiveChance && expensive ) {
      this.expensive = Math.random() * 5 + 3
    }
    if ( maze ) {
      this.wall = terrain ? x > 0 && y > 0 : y % 2 === 0 ? x % 2 !== 0 : true
    }
  }

  getNeighbors = ( grid: Grid, aStar = false ) => {
    this.neighbors = []
    aStar = terrain ? true : aStar
    const { x, y } = this
    // top left
    const dist = aStar ? 1 : maze ? 2 : 1
    if ( y - dist > 0 && x - dist > 0 && diagonals ) {
      this.neighbors.push( grid.data[ y - dist ][ x - dist ] )
    }
    // top center
    if ( y - dist >= 0 ) {
      this.neighbors.push( grid.data[ y - dist ][ x ] )
    }
    // top right
    if ( y - dist > 0 && x + dist < grid.numColumns && diagonals ) {
      this.neighbors.push( grid.data[ y - dist ][ x + dist ] )
    }
    // left
    if ( x - dist >= 0 ) {
      this.neighbors.push( grid.data[ y ][ x - dist ] )
    }
    // right
    if ( x + dist < grid.numColumns ) {
      this.neighbors.push( grid.data[ y ][ x + dist ] )
    }
    // bottom left
    if ( x - dist > 0 && y + dist < grid.numRows && diagonals ) {
      this.neighbors.push( grid.data[ y + dist ][ x - dist ] )
    }
    // bottom center
    if ( y + dist < grid.numRows ) {
      this.neighbors.push( grid.data[ y + dist ][ x ] )
    }
    // bottom right
    if ( x + dist < grid.numColumns && y + dist < grid.numRows && diagonals ) {
      this.neighbors.push( grid.data[ y + dist ][ x + dist ] )
    }
    return this.neighbors
  }
}

class Grid {
  data: Cell[][]
  numRows: number
  numColumns: number

  constructor( numRows, numColumns ) {
    this.numRows = numRows
    this.numColumns = numColumns

    this.data = new Array( numRows )
    for ( let row = 0; row < numRows; row++ ) {
      this.data[ row ] = new Array( numColumns )
      for ( let column = 0; column < numColumns; column++ ) {
        this.data[ row ][ column ] = new Cell(
          column,
          row,
          row * numRows + column,
        )
      }
    }
    for ( let row = 0; row < numRows; row++ ) {
      for ( let column = 0; column < numColumns; column++ ) {
        this.data[ row ][ column ].getNeighbors( this, false )
      }
    }
  }

  removeWallBetween( from: Cell, to: Cell ) {
    if ( to.x > from.x ) {
      this.data[ to.y ][ to.x - 1 ].wall = false
    } else if ( to.x < from.x ) {
      this.data[ to.y ][ to.x + 1 ].wall = false
    }
    if ( to.y > from.y ) {
      this.data[ to.y - 1 ][ to.x ].wall = false
    } else if ( to.y < from.y ) {
      this.data[ to.y + 1 ][ to.x ].wall = false
    }
  }

  render = ( { openSet, closedSet, path, start } ) => {
    return (
      <GridContainer>
        { this.data.map( ( row, rowIndex ) => (
          <RowContainer key={ rowIndex }>
            { row.map( ( column, columnIndex ) => {
              return (
                <RenderCell
                  wall={ column.wall }
                  key={ columnIndex }
                  expensive={ column.expensive }
                  path={
                    path[ column.index ]
                      ? path[ start.index ] - path[ column.index ]
                      : null
                   }
                  backgroundColor={
                    path[ column.index ]
                      ? "blue"
                      : openSet.find( ( cell ) => cell.index === column.index )
                        ? "green"
                        : closedSet[ column.index ]
                          ? "red"
                          : column.expensive > 1
                            ? "brown"
                            : "white"
                   }
                />
               )
            } ) }
          </RowContainer>
         ) ) }
      </GridContainer>
     )
  }
}

class RenderCell extends React.Component<{
  path: number
  wall: boolean
  backgroundColor: any
  expensive: number
}> {
  shouldComponentUpdate( nextProps ) {
    return (
      nextProps.wall !== this.props.wall ||
      nextProps.backgroundColor !== this.props.backgroundColor
     )
  }
  render() {
    const { backgroundColor, path, wall, expensive } = this.props
    return (
      <NodeContainer
        style={ {
          border: wall ? "1px solid black" : `1px solid ${ backgroundColor }`,
          backgroundColor: wall ? "black" : backgroundColor,
        } }
      >
        { display && ( path || ( !wall && Math.round( expensive ) ) ) }
      </NodeContainer>
     )
  }
}

const grid = new Grid( size, size )

function calculateHeuristicCost( from: Cell, to: Cell ) {
  return (
    Math.sqrt( Math.pow( to.x - from.x, 2 ) + Math.pow( to.y - from.y, 2 ) ) *
    ( from.expensive ? 5 : 1 )
   )
  // return Math.abs( to.x - from.x ) - Math.abs( to.y - from.y )
}

function Application( { grid }: { grid: Grid } ) {
  const [ openSet, setOpenSet ] = useState( [] )
  const [ closedSet, setClosedSet ] = useState( {} )
  const [ path, setPath ] = useState( {} )
  const [ start, setStart ] = useState( {} )

  function amaze() {
    const stack = []
    const visited = {}
    // const start = grid.data[ 0 ][ 0 ]
    const start = grid.data[ grid.numColumns - 1 ][ grid.numRows - 1 ]
    visited[ start.index ] = true

    function update() {
      setOpenSet( [ ...openSet ] )
      setClosedSet( { ...closedSet } )
      setPath( { ...path } )
    }
    const updateId = setInterval( update, 50 * size ) // grid.numColumns * grid.numRows )

    let current = start
    function iterate() {
      if ( !current ) {
        clearInterval( updateId )
        update()
        return
      }
      const neighbors = current
        .getNeighbors( grid )
        .filter( ( neighbor ) => !visited[ neighbor.index ] )
      if ( !neighbors.length ) {
        current = stack.pop()
        setTimeout( iterate, 0 )
        return
      }
      const neighbor =
        neighbors[ Math.round( Math.random() * ( neighbors.length - 1 ) ) ]

      grid.removeWallBetween( current, neighbor )
      stack.push( neighbor )
      visited[ neighbor.index ] = true
      current = neighbor
      if ( Object.keys( visited ).length * 2 < size * size ) {
        setTimeout( iterate, 0 )
      } else {
        setPath( {} )
        clearInterval( updateId )
      }
    }
    iterate()
  }

  function aStar() {
    const start = grid.data[ 0 ][ 0 ]
    const end = grid.data[ size - 1 ][ size - 1 ]
    // const end =
    //   grid.data[ ( grid.numColumns - 1 ) / 2 ][ ( grid.numRows - 1 ) / 2 ]
    // const end =
    //   grid.data[ Math.round( Math.random() * ( grid.numColumns - 1 ) ) ][
    //     Math.round( Math.random() * ( grid.numRows - 1 ) )
    //    ]

    setStart( start )

    start.wall = false
    end.wall = false

    const openSet = [ start ]
    const closedSet = {}
    const totalCost = {}
    const travelCost = {}
    const heuristicCost = {}
    const hops = {}
    let path = {}
    let current
    setPath( {} )

    function update() {
      setOpenSet( [ ...openSet ] )
      setClosedSet( { ...closedSet } )
      if ( incrementalPath ) {
        path = {}
        let hop = current.index
        let counter = 1
        while ( hop !== undefined ) {
          path[ hop ] = counter
          counter++
          hop = hops[ hop ]
        }
      }
      setPath( { ...path } )
    }
    const updateId = setInterval( update, 5 * size ) // grid.numColumns * grid.numRows )

    function iterate() {
      //   update()
      let best = 0
      for ( let i = 0; i < openSet.length; i++ ) {
        if (
          heuristicCost[ openSet[ i ].index ] <
          heuristicCost[ openSet[ best ].index ]
         ) {
          best = i
        }
      }
      current = openSet[ best ]

      if ( current.index === end.index ) {
        openSet.splice( 0, 1 )
        closedSet[ end.index ] = true
        clearInterval( updateId )

        path = {}
        let hop = current.index
        let counter = 1
        while ( hop !== undefined ) {
          path[ hop ] = counter
          counter++
          hop = hops[ hop ]
        }
        setPath( path )

        update()
      } else {
        openSet.splice( best, 1 )
        closedSet[ current.index ] = true

        for ( let neighbor of current.getNeighbors( grid, true ) ) {
          const calculatedCost = travelCost[ current.index ] * 1.3
          const { index } = neighbor
          if ( !closedSet[ index ] && !neighbor.wall ) {
            const inOpenSet = openSet.find( ( cell ) => cell.index === index )
            if ( inOpenSet ) {
              if (
                // !travelCost[ index ] ||
                calculatedCost < travelCost[ index ]
               ) {
                travelCost[ index ] = calculatedCost
              } else {
                continue
              }
            } else {
              travelCost[ index ] = calculatedCost
              openSet.push( neighbor )
            }
            heuristicCost[ index ] = calculateHeuristicCost( neighbor, end )
            totalCost[ index ] = travelCost[ index ] + heuristicCost[ index ]
            hops[ index ] = current.index
          }
        }

        if ( openSet.length ) {
          setTimeout( iterate, 0 )
        } else {
          update()
          clearInterval( updateId )
        }
      }
    }

    iterate()
  }

  return (
    <>
      <grid.render
        closedSet={ closedSet }
        openSet={ openSet }
        path={ path }
        start={ start }
      />
      <button onClick={ aStar }>A*</button>
      <button onClick={ amaze }>Amaze</button>
    </>
   )
}

render( <Application grid={ grid } />, document.getElementById( "root" ) )

module.hot.accept()
