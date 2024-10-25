// Esperar a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Crear cada gráfico
    crearGraficoLineas();
    crearGraficoAcordes();
    crearMapaConexiones();
    crearGraficoFrecuencia();
});

// Función para crear el gráfico de líneas
function crearGraficoLineas() {
    // Cargar el archivo JSON con los datos para el gráfico de líneas
    d3.json("https://raw.githubusercontent.com/ccardenas93/herramientas_visualizacion/refs/heads/main/data/route_class_avg_data_clean.json").then(function(data) {
        // Extraer todas las rutas únicas
        const rutas = Array.from(new Set(data.map(d => d.route)));

        // Crear opciones del menú desplegable para las rutas
        const selectorRuta = d3.select('#selectorRuta');
        selectorRuta.selectAll('option')
            .data(rutas)
            .enter()
            .append('option')
            .attr('value', d => d)
            .text(d => d);

        // Configurar el SVG y las dimensiones del gráfico de líneas
        const width = 928;
        const height = 500;
        const marginTop = 30;
        const marginRight = 150; // Margen aumentado para la leyenda
        const marginBottom = 30;
        const marginLeft = 50;

        const svg = d3.select('#grafico-lineas')
            .attr("viewBox", [0, 0, width, height])
            .attr("width", width)
            .attr("height", height)
            .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

        const g = svg.append('g').attr('transform', 'translate(0,0)');

        // Preparar el arreglo de meses
        const parseDate = d3.timeParse("%Y-%m-%d");
        const formatMonth = d3.timeFormat("%b");

        // Extraer meses únicos de los datos y ordenarlos
        const meses = Array.from(new Set(data.map(d => d.month))).sort();

        // Convertir cadenas de meses a objetos Date
        const fechasMeses = meses.map(m => new Date(m));

        // Escalas X e Y
        const x = d3.scaleBand()
            .domain(fechasMeses)
            .range([marginLeft, width - marginRight])
            .padding(0.1);

        const y = d3.scaleLinear()
            .range([height - marginBottom, marginTop]);

        const color = d3.scaleOrdinal()
            .range(d3.schemeCategory10);

        // Crear ejes
        const ejeX = svg.append('g')
            .attr('transform', `translate(0,${height - marginBottom})`)
            .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%b')));

        const ejeY = svg.append('g')
            .attr('transform', `translate(${marginLeft},0)`);

        // Generador de líneas
        const linea = d3.line()
            .x(d => x(new Date(d.month)) + x.bandwidth() / 2)
            .y(d => y(d.avg_price));

        // Grupo para la leyenda
        const grupoLeyenda = svg.append("g")
            .attr("class", "leyenda")
            .attr("transform", `translate(${width - marginRight + 20}, ${marginTop})`);

        // Div del tooltip
        const tooltip = d3.select("#tooltip-lineas");

        // Obtener la posición del contenedor del gráfico
        const containerLineas = d3.select('#contenedor-lineas');

        // Función para actualizar el gráfico basado en la ruta seleccionada
        function actualizarGrafico(ruta) {
            const datosFiltrados = data.filter(d => d.route === ruta);
            
            const clases = Array.from(new Set(datosFiltrados.map(d => d.class)));
            y.domain([0, d3.max(datosFiltrados, d => d.avg_price)]);

            // Actualizar el eje Y
            ejeY.call(d3.axisLeft(y));

            // Remover series anteriores
            g.selectAll('.serie').remove();

            // Remover elementos existentes de la leyenda
            grupoLeyenda.selectAll('.elemento-leyenda').remove();

            // Dibujar líneas para cada clase
            const serie = g.selectAll(".serie")
                .data(d3.group(datosFiltrados, d => d.class))
                .enter()
                .append("g")
                .attr("class", "serie");

            serie.append("path")
                .attr("class", "linea")
                .attr("fill", "none")
                .attr("stroke", d => color(d[0]))
                .attr("stroke-width", 1.5)
                .attr("d", d => linea(d[1]));

            // Agregar marcadores en los puntos de datos con mayor tamaño y funcionalidad de tooltip
            serie.selectAll(".marcador")
                .data(d => d[1])
                .enter()
                .append("circle")
                .attr("class", "marcador")
                .attr("cx", d => x(new Date(d.month)) + x.bandwidth() / 2)
                .attr("cy", d => y(d.avg_price))
                .attr("r", 5) // Aumentado el radio de 3 a 5
                .attr("fill", d => color(d.class))
                .on("mousemove", function(event, d) {
                    // Obtener la posición del contenedor del gráfico
                    const containerRect = containerLineas.node().getBoundingClientRect();
                    tooltip.style("opacity", 1)
                        .html(`Clase: ${d.class}<br>Mes: ${formatMonth(new Date(d.month))}<br>Precio Promedio: ${d.avg_price.toFixed(2)}`)
                        .style("left", (event.clientX - containerRect.left + 10) + "px")
                        .style("top", (event.clientY - containerRect.top - 28) + "px");
                    d3.select(this).attr("stroke", "black").attr("stroke-width", 1.5); // Resaltar punto
                })
                .on("mouseout", function() {
                    tooltip.style("opacity", 0);
                    d3.select(this).attr("stroke", null); // Quitar resalte
                });

            // Crear elementos de la leyenda
            const elementosLeyenda = grupoLeyenda.selectAll('.elemento-leyenda')
                .data(clases)
                .enter()
                .append('g')
                .attr('class', 'elemento-leyenda')
                .attr('transform', (d, i) => `translate(0, ${i * 20})`);

            elementosLeyenda.append('rect')
                .attr('x', 0)
                .attr('y', -10)
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', d => color(d));

            elementosLeyenda.append('text')
                .attr('x', 20)
                .attr('y', 0)
                .text(d => d)
                .attr('font-size', '12px')
                .attr('alignment-baseline', 'middle');
        }

        // Cargar inicialmente la primera ruta
        actualizarGrafico(rutas[0]);

        // Actualizar el gráfico cuando se seleccione una nueva ruta
        selectorRuta.on('change', function() {
            const rutaSeleccionada = d3.select(this).property('value');
            actualizarGrafico(rutaSeleccionada);
        });

    });
}

// Función para crear el gráfico de acordes
function crearGraficoAcordes() {
    // Cargar el archivo JSON con los datos para el gráfico de acordes
    d3.json("https://raw.githubusercontent.com/ccardenas93/herramientas_visualizacion/refs/heads/main/data/datos_acordes.json").then(function(datosAcordes) {
        const listaCiudades = datosAcordes.ciudades;
        let matrizConexiones = datosAcordes.matriz;

        // Crear una nueva matriz que contenga la suma de los viajes en ambas direcciones
        const matrizSumaBidireccional = matrizConexiones.map((row, i) =>
            row.map((value, j) => value + matrizConexiones[j][i])
        );

        // Configuración del gráfico de acordes
        const svgAcordes = d3.select('#grafico-acordes'),
            widthAcordes = +svgAcordes.attr("width"),
            heightAcordes = +svgAcordes.attr("height"),
            innerRadius = Math.min(widthAcordes, heightAcordes) * 0.4,
            outerRadius = innerRadius + 10;

        const gAcordes = svgAcordes.append("g")
            .attr("transform", `translate(${widthAcordes / 2},${heightAcordes / 2})`);

        const colorAcordes = d3.scaleOrdinal()
            .domain(d3.range(listaCiudades.length))
            .range(d3.schemeCategory10);

        // Crear el gráfico de acordes con la matriz bidireccional
        const chords = d3.chord()
            .padAngle(0.05)
            .sortSubgroups(d3.descending)(matrizSumaBidireccional);

        // Añadir grupos (arcos exteriores)
        const group = gAcordes
            .datum(chords)
            .append("g")
            .selectAll("g")
            .data(d => d.groups)
            .enter().append("g");

        group.append("path")
            .style("fill", d => colorAcordes(d.index))
            .style("stroke", d => colorAcordes(d.index))
            .attr("d", d3.arc().innerRadius(innerRadius).outerRadius(outerRadius));

        // Añadir etiquetas a los grupos
        group.append("text")
            .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
            .attr("dy", ".35em")
            .attr("class", "group-label")
            .attr("transform", function(d) {
                return `
                    rotate(${(d.angle * 180 / Math.PI - 90)})
                    translate(${outerRadius + 15})
                    ${d.angle > Math.PI ? "rotate(180)" : ""}
                `;
            })
            .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
            .text(d => listaCiudades[d.index]);

        // Div del tooltip del gráfico de acordes
        const tooltipAcordes = d3.select("#tooltip-acordes");

        // Obtener la posición del contenedor del gráfico de acordes
        const containerAcordes = d3.select('#contenedor-acordes');

        // Añadir acordes (conexiones internas)
        gAcordes.datum(chords)
            .append("g")
            .selectAll("path")
            .data(d => d)
            .enter().append("path")
            .attr("d", d3.ribbon().radius(innerRadius))
            .style("fill", d => colorAcordes(d.target.index))
            .style("stroke", "black")
            .style("opacity", 0.7)
            .on("mousemove", function(event, d) {
                d3.select(this).style("opacity", 1);
                const containerRect = containerAcordes.node().getBoundingClientRect();
                tooltipAcordes.style("opacity", 1)
                    .html(`Número total de viajes: ${d.source.value}`)
                    .style("left", (event.clientX - containerRect.left + 10) + "px")
                    .style("top", (event.clientY - containerRect.top - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).style("opacity", 0.7);
                tooltipAcordes.style("opacity", 0);
            });
    });
}

// Función para crear el mapa de conexiones
function crearMapaConexiones() {
    // Definir las dimensiones del SVG
    const width = 800;
    const height = 600;

    // Crear el SVG
    const svg = d3.select('#mapa-espana');

    // Crear un elemento para el tooltip
    const tooltip = d3.select('#tooltip-mapa');

    // Definir la proyección y el path para el mapa
    const projection = d3.geoMercator()
        .center([-3, 40]) // Centrar en España
        .scale(2000)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Cargar los datos del GeoJSON para España y el archivo de datos acordes
    Promise.all([
        d3.json("https://raw.githubusercontent.com/ccardenas93/herramientas_visualizacion/refs/heads/main/data/spain.json"),
        d3.json("https://raw.githubusercontent.com/ccardenas93/herramientas_visualizacion/refs/heads/main/data/datos_acordes.json") // Cargar datos desde el archivo JSON
    ]).then(function([geoData, citiesData]) {

        // Dibujar el mapa de España
        svg.append("g")
            .selectAll("path")
            .data(geoData.features) // Usa el array de features del GeoJSON
            .enter().append("path")
            .attr("d", path)
            .attr("fill", "#e0e0e0")
            .attr("stroke", "#999");

        // Coordenadas de las ciudades desde el JSON
        const citiesCoordinates = {
            "MADRID": [-3.7038, 40.4168],
            "SEVILLA": [-5.9845, 37.3891],
            "VALENCIA": [-0.3757, 39.4699],
            "PONFERRADA": [-6.5887, 42.5464],
            "BARCELONA": [2.1734, 41.3851]
        };

        // Función para obtener las coordenadas de una ciudad
        function getCoordinates(cityName) {
            return projection(citiesCoordinates[cityName]);
        }

        // Dibujar las ciudades como puntos en el mapa
        svg.append("g")
            .selectAll("circle")
            .data(citiesData.ciudades)
            .enter()
            .append("circle")
            .attr("class", "ciudad")
            .attr("cx", d => getCoordinates(d)[0])
            .attr("cy", d => getCoordinates(d)[1])
            .attr("r", 5);

        // Añadir etiquetas de las ciudades
        svg.append("g")
            .selectAll("text")
            .data(citiesData.ciudades)
            .enter()
            .append("text")
            .attr("x", d => getCoordinates(d)[0] + 8)
            .attr("y", d => getCoordinates(d)[1] + 3)
            .text(d => d)
            .attr("font-size", "12px")
            .attr("fill", "black");

        // Crear marcador de flechas para las rutas
        svg.append("defs").append("marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 10)
            .attr("refY", 5)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 Z")
            .attr("fill", "steelblue");

        // Dibujar las rutas
        citiesData.ciudades.forEach((originCity, i) => {
            citiesData.ciudades.forEach((destCity, j) => {
                const trips = citiesData.matriz[i][j];
                if (trips > 0) {
                    const originCoords = getCoordinates(originCity);
                    const destCoords = getCoordinates(destCity);

                    // Ajustar el punto intermedio para separar visualmente las flechas en ambas direcciones
                    const curveOffset = i < j ? -50 : 50; // Elevar una dirección, bajar la otra

                    // Definir un punto intermedio para curvar la línea
                    const midPoint = [
                        (originCoords[0] + destCoords[0]) / 2,
                        (originCoords[1] + destCoords[1]) / 2 + curveOffset // Ajustar la curva
                    ];

                    const routePath = [originCoords, midPoint, destCoords];

                    // Dibujar la ruta como curva
                    const pathLine = d3.line()
                        .x(d => d[0])
                        .y(d => d[1])
                        .curve(d3.curveBasis);

                    svg.append("path")
                        .datum(routePath)
                        .attr("class", "arrow")
                        .attr("stroke-width", 2)  // Grosor constante
                        .attr("d", pathLine)
                        .attr("marker-end", "url(#arrow)")
                        .on("mouseover", function(event) {
                            d3.select(this).classed("highlight", true);
                            const svgBounds = svg.node().getBoundingClientRect();  // Obtener la posición del SVG relativo a la página
                            tooltip.style("opacity", 1)
                                .html(`${originCity} ➝ ${destCity}<br>Viajes: ${trips}`)
                                .style("left", (event.clientX - svgBounds.left + 15) + "px")
                                .style("top", (event.clientY - svgBounds.top - 35) + "px");
                        })
                        .on("mouseout", function() {
                            d3.select(this).classed("highlight", false);
                            tooltip.style("opacity", 0);
                        })
                        .on("mousemove", function(event) {
                            const svgBounds = svg.node().getBoundingClientRect();  // Obtener la posición del SVG relativo a la página
                            tooltip.style("left", (event.clientX - svgBounds.left + 15) + "px")
                                   .style("top", (event.clientY - svgBounds.top - 35) + "px");
                        });
                }
            });
        });
    });
}

// Función para crear el gráfico de frecuencia
function crearGraficoFrecuencia() {
    // Crear el selector para ordenar
    const contenedorFrecuencia = d3.select('#contenedor-frecuencia');
    const selectOrdenar = contenedorFrecuencia.select('#sortOrder');

    // Div para el gráfico
    const divChart = contenedorFrecuencia.select('#chart');

    // Función para crear el gráfico
    function chart(data) {
        const width = 640;
        const height = 400;
        const marginTop = 20;
        const marginRight = 20;
        const marginBottom = 50;
        const marginLeft = 50;

        // Asegurarse de que todas las 24 horas (0-23) están incluidas en los datos
        const fullHours = d3.range(0, 24).map(hour => {
            const found = data.find(d => d.hour === hour);
            return found ? found : { hour: hour, frequency: 0 };
        });

        // Crear la escala x con mayor padding entre barras
        const x = d3.scaleBand()
            .domain(fullHours.map(d => d.hour))
            .range([marginLeft, width - marginRight])
            .padding(0.4);

        const xAxis = d3.axisBottom(x).tickSizeOuter(0).tickFormat(d => d + ":00");

        // Crear la escala y
        const y = d3.scaleLinear()
            .domain([0, d3.max(fullHours, d => d.frequency)]).nice()
            .range([height - marginBottom, marginTop]);

        // Crear el SVG
        const svg = d3.create("svg")
            .attr("viewBox", [0, 0, width, height])
            .attr("style", `max-width: ${width}px; height: auto; font: 12px sans-serif; overflow: visible;`);

        // Crear las barras
        const bar = svg.append("g")
            .attr("fill", "#007aff")
            .selectAll("rect")
            .data(fullHours)
            .join("rect")
            .attr("x", d => x(d.hour))
            .attr("y", d => y(d.frequency))
            .attr("height", d => y(0) - y(d.frequency))
            .attr("width", x.bandwidth())
            .attr("rx", 5); // Esquinas redondeadas

        // Crear el eje x
        const gx = svg.append("g")
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(xAxis);

        // Aplicar rotación y estilo a las etiquetas del eje x
        gx.selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Crear el eje y
        const gy = svg.append("g")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(d3.axisLeft(y).ticks(null, "s"))
            .call(g => g.select(".domain").remove());

        // Devolver el gráfico con una función de actualización
        return Object.assign(svg.node(), {
            update(order) {
                x.domain(fullHours.sort(order).map(d => d.hour));

                const t = svg.transition()
                    .duration(750);

                bar.data(fullHours, d => d.hour)
                    .order()
                    .transition(t)
                    .delay((d, i) => i * 20)
                    .attr("x", d => x(d.hour));

                // Actualizar el eje x
                gx.transition(t)
                    .call(xAxis);

                // Reaplicar rotación y estilo a las etiquetas del eje x después de actualizar
                gx.selectAll("text")
                    .attr("transform", "rotate(-45)")
                    .style("text-anchor", "end");
            }
        });
    }

    // Cargar los datos JSON y crear el gráfico
    d3.json("https://raw.githubusercontent.com/ccardenas93/herramientas_visualizacion/refs/heads/main/data/travel_frequency.json").then(function(data) {
        const chartInstance = chart(data);
        document.getElementById('chart').appendChild(chartInstance);

        // Añadir evento al selector
        document.getElementById('sortOrder').addEventListener('change', function() {
            const selectedOption = this.value;
            let order;

            if (selectedOption === 'frequency-asc') {
                order = (a, b) => d3.ascending(a.frequency, b.frequency); // Ordenar por frecuencia ascendente
            } else if (selectedOption === 'frequency-desc') {
                order = (a, b) => d3.descending(a.frequency, b.frequency); // Ordenar por frecuencia descendente
            } else {
                order = (a, b) => d3.ascending(a.hour, b.hour); // Ordenar por hora del día
            }

            chartInstance.update(order);  // Actualizar el gráfico basado en el orden seleccionado
        });
    });
}
