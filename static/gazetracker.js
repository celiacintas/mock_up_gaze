(function () {
    var heatmap, canvas, ctx;
    var history_data = [];
    var image, sc, sse;
    var pie_values = [];

    window.GazeTracker = window.GazeTracker || {};

    Array.prototype.unique = function() {
        var o = {}, i, l = this.length, r = [];
        for(i=0; i<l;i+=1) o[this[i]['time']] = this[i]['time'];
        for(i in o) r.push(o[i]);
        return r;
    };

    function draw_sectors (argument) {
        var canvas_2 = document.getElementById("myScreen");
        var ctx_2 = canvas_2.getContext("2d");

        var image = new Image();
        ctx_2.drawImage(canvas, 0, 0, 640, 480);
        image = null;
        var ancho = 640;
        var alto = 480;
        var coords = [ [ancho*0.5, alto*0.5], [ancho*0.1, alto*0.5], [ancho*0.9, alto*0.5],
                     [ancho*0.5, alto*0.1], [ancho*0.5, alto*0.9], [ancho*0.1, alto*0.1],
                     [ancho*0.1, alto*0.9], [ancho*0.9, alto*0.9], [ancho*0.9, alto*0.1],
                     [ancho*0.3, alto*0.3], [ancho*0.3, alto*0.7], [ancho*0.7, alto*0.7],
                     [ancho*0.7, alto*0.3]];
        for(var i = 0; i < coords.length; i++){
            ctx_2.beginPath();
            ctx_2.arc(coords[i][0], coords[i][1], 90, 0, Math.PI * 2, true);
            ctx_2.fillStyle = "rgba(0, 0,255,0.2)";
            ctx_2.fill();
        }
        for(var i = 0; i < coords.length; i++){
            ctx_2.font = '20pt Calibri Bold';
            ctx_2.fillStyle = 'white';
            ctx_2.textAlign = 'center';
            ctx_2.fillText(String(i), coords[i][0], coords[i][1] + 3);
        } 
    }

    $.extend(window.GazeTracker, {

        init: function () {

            // Iniicalizar atributos

        },

        updateReceived: function (event) {
            var data = JSON.parse(event.data);
            var image = new Image();
            image.onload = function() {
                    ctx.drawImage(image, 0, 0, 640, 480);
                    image = null;
            };
            image.src = "data:image/jpeg;base64," + data.screen;

            var x = Number(data.x)
            var y = Number(data.y)
            var heatmapContainer = document.getElementById('heatmapContainerWrapper');
            heatmap.addData({ x: x/2.1343, y: y/1.6, value:40});
            history_data.push({
                    time: Math.floor( Date.now() / 1000 ),
                    target: Number(data.target)
                    });
        },

        saveData: function (event) {        
            var tmp = _.map(pie_values, function(curr_element) {
                    return _.pick(curr_element, "y", "label");
                    });
        //console.log(tmp, pie_values);
            alasql('SELECT * INTO CSV("results.csv", {headers:true}) FROM ?', [tmp]);
        },

        createHeatmap: function() {
            // Listen to the gaze tracker events
            console.log(GazeTracker.updateReceived)
            sse = new EventSource('/events');
            sse.onmessage = GazeTracker.updateReceived;

            // create a heatmap instance
            heatmap = h337.create({
              container: document.getElementById('heatmapContainer'),
              maxOpacity: .7,
              radius: 50,
              blur: .90,
              backgroundColor: 'rgba(1, 1, 1, 0.0)'
            });
            canvas = document.getElementById("img_mjpeg");
            ctx = canvas.getContext("2d");
        },

        drawResults: function () {
            var index, target_index, end_run_time, start_run_time, total_time;
            var tmp_time;
            var tmp_values_filtered = [];
            var tmp_history_data = [];
            var tmp_before, tmp_after;
            pie_values = [];
            tmp_history_data = history_data.reverse();

            for(target_index=0; target_index < 13; target_index++){
                tmp_values_filtered = tmp_history_data.filter(function (el) {
                    return el['target'] == target_index;});
                pie_values.push({
                    y: Number(tmp_values_filtered.length),
                    legendText: String(target_index),
                    label: String(target_index)
                    });
              
            }
           //console.log(pie_values);
           if (typeof pie_values !== 'undefined' && pie_values.length > 1){
               var chart = new CanvasJS.Chart("myChart",
                {
                //width:400,
                height: 400,
                animationEnabled: true,
                theme: "theme2",
                data: [
                {        
                    type: "pie",       
                    showInLegend: true,     
                    indexLabel: "#percent%",
                    startAngle:0,      
                    showInLegend: true,
                    toolTipContent:"{y} times over sector {legendText}",
                    legendText: "{indexLabel}",
                    dataPoints: pie_values
                }
            ]
            });
            chart.render();
            draw_sectors();
            }
        }
    });

})();
