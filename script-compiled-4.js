/*eslint no-undef: 0*/

function createChart (svg, data) {

  // //normalize data
  // Object.keys(data).forEach((d)=>{
  //   ["0", "1", "2", "3", "4", "5", "6"].forEach(k=>{
  //     if (d[k] === undefined) d[k] =
  //   })
  // })

  //var colors = ["#ccebc5", "#a8ddb5", "#7bccc4", "#4eb3d3", "#2b8cbe", "#0868ac", "#084081"]

//@fariza modifique la definición del svg para que lo tome como aributos del svg y no como variables independientes.
  svg = d3.select(svg),
    margin = {top: 20, right: 90, bottom: 30, left: 130},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    g = svg.append('g').attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      //  .attr("width", width)
        //.attr("height", height)

  var y0 = d3.scaleBand()
    //.rangeRound([0,460-height])
    .rangeRound([0,height])
    .paddingInner(0.1)

  var y1 = d3.scaleBand()
    .padding(0.30)

  var x = d3.scaleLinear()
    .rangeRound([0,width])
    //.rangeRound([960,960 - width])

  var z = d3.scaleOrdinal(d3.schemeCategory20)

  // check each subset of data for possible sections, since not all subsets have every possible section.
  var nameKeys = data[Object.keys(data)[0]].map(function (obj) { return obj.name; })
  var valueKeys =   ["MAESTRIA","UNIVERSITARIO","TECNICO PROFESIONAL","TECNICO LABORAL","TECNOLOGIA"]

    //fill in empty data entries
    Object.keys(data).forEach(function (d){
      data[d].forEach(function (section){
        valueKeys.forEach(function (k){
          if (section.values[k] === undefined) { section.values[k] = 0 }
        })
      })
    })

  y0.domain(nameKeys)
  //y1.domain(valueKeys).rangeRound([y0.bandwidth(),0])
  y1.domain(valueKeys).rangeRound([y0.bandwidth(),0])

  var barContainer = g.append('g')

  var yAxis = g.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(0,0)')//@fariza se centra el eje y
      .call(d3.axisLeft(y0))
      //.attr("transform", "rotate(90)")

  var xAxis = g.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(x))

  xAxis
    .append('text')
      .attr('y', 2)
      .attr('x', x(x.ticks().pop())+0.5)
      .attr('dx', '0.32em')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'start')
      .text('Beneficiados')
      //.attr('transform', 'translate(40' + width + ')')
      //.attr('transform', 'translate(' + margin.right + ',0)')



// leyenda de los niveles de programa
  var legend = g.append('g')
  .attr('font-size', 10)
  .attr('text-anchor', 'end')

  legend.append('text')
  .text('Nivel del programa')
  .attr('x', width - 19)
  .style('font-weight', 'bold')
  .attr('dy', -10)
  .attr('dx', 20)

  var legendEnter = legend
    .selectAll('g')
    .data(valueKeys)
    .enter().append('g')
      .attr('transform', function (d, i) { return 'translate(50,' + i * 20 + ')' })

  legendEnter.append('rect')
      .attr('x', width -19)
      .attr('width', 19)
      .attr('height', 19)
      .attr('fill', z)

  legendEnter.append('text')
      .attr('x', width -24)
      .attr('y', 9.5)
      .attr('dy', '0.32em')
      .text(function (d) { return d; })


  var stack = d3.stack()
      .keys(valueKeys)

  function updateChart (data, chartType) {
    if ( chartType === void 0 ) chartType='group';


    if (chartType === 'group'){

      //find max value of a section
      var maxValue = d3.max(data.map(function (d) { return Object.values(d.values); }).reduce(function (a, b) { return a.concat(b); }, []))
      x.domain([0,maxValue]).nice()
     // x.domain([maxValue,0]).nice()


      xAxis.transition()
      .call(d3.axisBottom(x))

      var barsWithData = barContainer
      .selectAll('g')
      .data(data)

      barsWithData.exit().remove()

      var bars = barsWithData
      .enter()
      .append('g')
      //@fariza debes revisar esta parte porque está dejando datos en categorías a las que no pertenecen los datos ej:
      //para el año 2012-2 EXT existen registros para TOLIMA y SANTANDER sin embargo se visualizan en CESAR y CAUCA.
      .attr('transform', function (d) { return 'translate(0,' + y0(d.name) + ')' })
      //.attr("transform", "rotate(180)")
      .merge(barsWithData)
      .selectAll('rect')
      .data(function (d) {
        return Object.keys(d.values).map(function (k) { return ({ key: k, value: d.values[k] }); })
      })

      bars.exit().transition().style(0,'opacity').remove()

      bars
      .enter()
      .append('rect')
      .attr('fill', function (d) {
        return z(d.key)
      })
      // start y at height (0) so animation in looks like bars are growing upwards
      .attr('x', width)
      .merge(bars)
      .transition()
      .attr('y', function (d) { return y1(d.key) })
      .attr('x', function (d) { return x([0]); }) //@fariza se corrige la coordenada x
    //  .attr('x', function (d) { return x(d.value); })
      //.attr('x', (margin.right+margin.lef) )
      //.attr('width', function (d) { return width - (x(d.value)+margin.right); })
      .attr('width', function (d) { return (x(d.value)); })  //@fariza se corrige el valor de width
      .attr('height', y1.bandwidth())
    }

  }


  return {
    updateChart: updateChart
  }
}
//d3.csv("completo2.csv", function(error, data) {

d3.json('./beneficiarios.json', function(error, data){

  //start with the first year selected
  var chart = createChart(document.querySelector('svg'), data)

  // Filtro de convocatoria
  var fieldset1 = d3.select('.controls').append('fieldset')
  fieldset1.append('legend').text('Convocatoria')

  Object.keys(data).forEach(function (convocatoria, index ){

    var label = fieldset1.append('label')

    label
    .append('input')
    .attr('type', 'radio')
    .attr('name', 'convocatoria')
    .attr('value', convocatoria)
    .attr('checked', function(){
      if (index === 0) { return true }
      return null
    })

    label.append('span')
    .text(convocatoria)

    label.on('click', function(){
      chart.updateChart(data[document.querySelector('input[name="convocatoria"]:checked').value])
    })
  })


  // render initial chart
  chart.updateChart(data[Object.keys(data)[0]])

})
