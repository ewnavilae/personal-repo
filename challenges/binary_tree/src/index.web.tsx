import { render } from "react-dom"
import React, { useState, useEffect, useRef } from "react"
import styled from "styled-components"
import { Map } from "immutable"

const AppContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: stretch;
`

const NodeContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  flex: 1;
`

const Value = styled.div`
  padding: 5px;
  border: 1px solid black;
  border-radius: 10px;
  width: 2em;
  height: 2em;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 3px;
`
const ChildNodes = styled.div`
  display: flex;
  justify-content: center;
`

const Svg = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
`

const StyledLine = styled.line`
  stroke-width: 2px;
  stroke: rgb(0, 0, 0);
`

let addToTreeTimeoutId
const addToTreeTimeoutInterval = 1

function Line( { from, to, color } ) {
  return (
    <Svg>
      <StyledLine
        style={ { stroke: color } }
        x1={ from.offsetLeft + from.offsetWidth / 2 }
        x2={ to.offsetLeft + to.offsetWidth / 2 }
        y1={ from.offsetTop + from.offsetHeight }
        y2={ to.offsetTop }
      />
    </Svg>
   )
}

function Node( value, parent ) {
  this.value = value
  this.left = null
  this.right = null
  this.parent = parent
  this.add = ( value ) => {
    const target =
      value < this.value ? "left" : value > this.value ? "right" : "_"
    if ( this[ target ] ) this[ target ].add( value, this.self )
    else this[ target ] = new Node( value, this.self )
  }
  this.search = ( value ) => {
    this.visited[ 1 ]( true )
    setTimeout( () => this.visited[ 1 ]( false ), 2500 )

    const target =
      value < this.value ? "left" : value > this.value ? "right" : "_"
    if ( this[ target ] ) this[ target ].search( value )
  }
  this.render = () => {
    this.self = useRef( null )
    this.visited = useState( false )

    const color = this.visited[ 0 ] ? "red" : "black"

    return (
      <NodeContainer>
        { parent && this.self && parent.current && this.self.current && (
          <Line
            color={ color }
            from={ parent.current }
            to={ this.self.current }
          />
         ) }
        <Value style={ { borderColor: color } } ref={ this.self }>
          { this.value }
        </Value>
        <ChildNodes>
          { this.left && <this.left.render /> }
          { this.right && <this.right.render /> }
        </ChildNodes>
      </NodeContainer>
     )
  }
}

const rand = () => Math.round( Math.random() * 200 )

function Application() {
  const [ size, setSize ] = useState( 1 )
  const [ tree, setTree ] = useState( () => {
    const root = new Node( rand(), null )
    return Map( {
      root,
      size: 1,
    } )
  } )

  const [ search, setSearch ] = useState( null )

  const addToTree = () => {
    const value = rand()
    tree.get( "root" ).add( value )
    setTree( tree.set( "size", size + 1 ) )
    setSize( size + 1 )
  }

  useEffect(
    () => {
      addToTreeTimeoutId = setTimeout( addToTree, addToTreeTimeoutInterval )
      return () => clearTimeout( addToTreeTimeoutId )
    },
    [ size ],
   )

  function doSearch() {
    tree.get( "root" ).search( search )
  }

  const Root = tree.get( "root" ).render
  return (
    <AppContainer>
      <Root />
      <div style={ { padding: 10, zIndex: 100, fontSize: 100 } }>
        <input
          style={ { fontSize: 100 } }
          placeholder="find"
          onChange={ ( e ) => setSearch( e.target.value ) }
          value={ search }
          type="text"
        />
        <button style={ { fontSize: 100 } } onClick={ doSearch }>
          Search
        </button>
      </div>
    </AppContainer>
   )
}

render( <Application />, document.getElementById( "root" ) )

module.hot.accept()
