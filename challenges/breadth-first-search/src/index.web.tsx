import React, { useState } from "react"
import { render } from "react-dom"

import faker from "faker"

const numMovies = 10000,
  numActors = 10000,
  actorsPerMovie = 5

const movies = [],
  actors = []

for ( let i = 0; i < numActors; i++ ) {
  actors.push( `${ faker.name.findName() }` )
}

for ( let i = 0; i < numMovies; i++ ) {
  movies.push( `The ${ faker.commerce.productName() }` )
}

type NodeType = "actor" | "movie"

class Node {
  value: string = null
  type: NodeType = null
  edges: Node[] = []

  searchedFrom: Node = null

  constructor( value, type: NodeType ) {
    this.value = value
    this.type = type
  }

  addEdge( node: Node ) {
    this.edges.push( node )
    node.edges.push( this )
  }
}

class Graph {
  nodes: Node[] = []
  map: { [ key: string]: Node } = {}
  addNode = ( node: Node ) => {
    this.nodes.push( node )
    this.map[ node.value ] = node
    return node
  }
}

const graph = new Graph()
actors.forEach( ( actor ) => graph.addNode( new Node( actor, "actor" ) ) )
movies.forEach( ( movie ) => graph.addNode( new Node( movie, "movie" ) ) )

graph.nodes.filter( ( node ) => node.type === "movie" ).forEach( ( movie ) => {
  const movieActors = []
  while ( movieActors.length < actorsPerMovie ) {
    const randomActor =
      actors[ Math.round( Math.random() * ( actors.length - 1 ) ) ]
    if ( !~movieActors.indexOf( randomActor ) ) movieActors.push( randomActor )
  }
  movieActors.forEach( ( actor ) => movie.addEdge( graph.map[ actor ] ) )
} )

console.log( graph )

function Application() {
  const [ start, _setStart ] = useState( graph.map[ actors[ 0 ] ] )
  function setStart( event ) {
    _setStart( graph.map[ event.target.value ] )
  }
  const [ end, _setEnd ] = useState( graph.map[ actors[ 0 ] ] )
  function setEnd( event ) {
    _setEnd( graph.map[ event.target.value ] )
  }

  const [ path, setPath ] = useState<Node[]>( [] )
  function find() {
    let found = false
    const searched = { [ start.value ]: true }
    const queue = [ start ]
    const newPath = []
    while ( queue.length ) {
      const current = queue.shift()
      if ( current.value === end.value ) {
        found = true
        let parent = current
        newPath.push( parent )

        while ( parent.searchedFrom ) {
          let newParent = parent.searchedFrom
          parent.searchedFrom = null
          parent = newParent
          newPath.push( parent )
        }

        break
      } else {
        current.edges
          .filter( ( edge ) => !searched[ edge.value ] )
          .forEach( ( edge ) => {
            searched[ edge.value ] = true
            edge.searchedFrom = current
            queue.push( edge )
          } )
      }
    }
    if ( !found ) {
      setPath( [ { value: "not found" } ] as any )
    } else {
      setPath( newPath )
    }
  }

  return (
    <div>
      <div>
        <legend>Start</legend>
        <select onChange={ setStart }>
          { actors.map( ( value ) => (
            <option value={ value }>{ value }</option>
           ) ) }
        </select>
      </div>
      <div>
        <legend>End</legend>
        <select onChange={ setEnd }>
          { actors.map( ( value ) => (
            <option value={ value }>{ value }</option>
           ) ) }
        </select>
      </div>
      <button onClick={ find }>Find</button>
      <div>
        { path.length
          ? path.length === 1
            ? "Same person"
            : [ ...path ].reverse().map( ( item, index ) => (
                <div>
                  { index === 0
                    ? ""
                    : item.type === "actor"
                      ? "with "
                      : "which is in " }
                  { item.value }
                </div>
               ) )
          : "No search" }
      </div>
    </div>
   )
}

render( <Application />, document.getElementById( "root" ) )

module.hot.accept()
