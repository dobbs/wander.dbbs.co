/*
 * Federated Wiki : Force Plugin
 *
 * Licensed under the MIT license.
 * https://github.com/fedwiki/wiki-plugin-force/blob/master/LICENSE.txt
 */

async function emit($item, item) {
  const d3 = await import('https://cdn.jsdelivr.net/npm/d3@7/+esm')
  
  $item.append(`
    <style type="text/css">
      circle.node {
        stroke: #fff;
        stroke-width: 1.5px;
      }
      line.link {
        stroke: #999;
        stroke-opacity: .6;
      }
    </style>
  `)
  const width = 420
  const height = 260

  let data = {}

  const candidates = $(`.item:lt(${$('.item').index($item)})`)
  if ((who = candidates.filter(".force-source:last").length)) {
    data = who.get(0).forceData() 
  } else {
    data = wiki.getData()
  }

  const json = $.extend(true, {}, data)

  const svg = await ForceGraph(json, {
    nodeId: d => json.nodes.findIndex((element => element.name == d.name)),
    nodeGroup: d => d.group,
    nodeTitle: d => d.name,
    nodeStrength: -120,
    linkStrokeWidth: l => Math.sqrt(l.value),
    colors: d3.schemeTableau10,
    width: width,
    height: height,
    div: $item
  })

  $item.append(svg)

}

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/disjoint-force-directed-graph

// modified to load d3, and handle clicks on nodes

async function ForceGraph({
  nodes, // an iterable of node objects (typically [{id}, …])
  links // an iterable of link objects (typically [{source, target}, …])
}, {
  nodeId = d => d.id, // given d in nodes, returns a unique identifier (string)
  nodeGroup, // given d in nodes, returns an (ordinal) value for color
  nodeGroups, // an array of ordinal values representing the node groups
  nodeTitle, // given d in nodes, a title string
  nodeFill = "currentColor", // node stroke fill (if not using a group color encoding)
  nodeStroke = "#fff", // node stroke color
  nodeStrokeWidth = 1.5, // node stroke width, in pixels
  nodeStrokeOpacity = 1, // node stroke opacity
  nodeRadius = 5, // node radius, in pixels
  nodeStrength,
  linkSource = ({source}) => source, // given d in links, returns a node identifier string
  linkTarget = ({target}) => target, // given d in links, returns a node identifier string
  linkStroke = "#999", // link stroke color
  linkStrokeOpacity = 0.6, // link stroke opacity
  linkStrokeWidth = 1.5, // given d in links, returns a stroke width in pixels
  linkStrokeLinecap = "round", // link stroke linecap
  linkStrength,
  colors = d3.schemeTableau10, // an array of color strings, for the node groups
  width = 640, // outer width, in pixels
  height = 400, // outer height, in pixels
  div, // page item
  invalidation // when this promise resolves, stop the simulation
} = {}) {

  const d3 = await import('https://cdn.jsdelivr.net/npm/d3@7/+esm')   // ensure d3 is loaded

  // Compute values.
  const N = d3.map(nodes, nodeId).map(intern);
  const LS = d3.map(links, linkSource).map(intern);
  const LT = d3.map(links, linkTarget).map(intern);
  if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
  const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
  const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
  const W = typeof linkStrokeWidth !== "function" ? null : d3.map(links, linkStrokeWidth);

  // Replace the input nodes and links with mutable objects for the simulation.
  nodes = d3.map(nodes, (_, i) => ({id: N[i]}));
  links = d3.map(links, (_, i) => ({source: LS[i], target: LT[i]}));

  // Compute default domains.
  if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);

  // Construct the scales.
  const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

  // Construct the forces.
  const forceNode = d3.forceManyBody();
  const forceLink = d3.forceLink(links).id(({index: i}) => N[i]);
  if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
  if (linkStrength !== undefined) forceLink.strength(linkStrength);

  const simulation = d3.forceSimulation(nodes)
      .force("link", forceLink)
      .force("charge", forceNode)
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .on("tick", ticked);

  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  
  svg.append("svg:defs").selectAll("marker")
    .data(["arrowhead"])
    .enter()
    .append("svg:marker")
      .attr("id", String)
      .attr("viewBox", "0 0 10 10")
      .attr("refX","20")
      .attr("refY","5")
      .attr("markerUnits","strokeWidth")
      .attr("markerWidth","9")
      .attr("markerHeight","5")
      .attr("orient","auto")
    .append("svg:path")
      .attr("d","M 0 0 L 10 5 L 0 10 z")
      .attr("fill", "#BBBBBB")

  const link = svg.append("g")
      .attr("stroke", linkStroke)
      .attr("stroke-opacity", linkStrokeOpacity)
      .attr("stroke-width", typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null)
      .attr("stroke-linecap", linkStrokeLinecap)
      .attr("marker-end", "url(#arrowhead)")
    .selectAll("line")
    .data(links)
    .join("line");

  if (W) link.attr("stroke-width", ({index: i}) => W[i]);

  const node = svg.append("g")
      .attr("fill", nodeFill)
      .attr("stroke", nodeStroke)
      .attr("stroke-opacity", nodeStrokeOpacity)
      .attr("stroke-width", nodeStrokeWidth)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
      .attr("r", nodeRadius)
      .call(drag(simulation))
    .on("dblclick", function(d) {
      console.log('dblclick', {d})
      let page = null
      if (!d.shiftKey) {
        page = div.parents('.page')
      }
      return wiki.doInternalLink(d.target.firstChild.innerHTML, page)
    });

  if (G) node.attr("fill", ({index: i}) => color(G[i]));
  if (T) node.append("title").text(({index: i}) => T[i]);

  // Handle invalidation.
  if (invalidation != null) invalidation.then(() => simulation.stop());

  function intern(value) {
    return value !== null && typeof value === "object" ? value.valueOf() : value;
  }

  function ticked() {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  }

  function drag(simulation) {    
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  return Object.assign(svg.node(), {scales: {color}});
}

function bind($item, item) {}

if (typeof window !== "undefined" && window !== null) {
  window.plugins.force = {
    emit: emit,
    bind: bind
  }
}
