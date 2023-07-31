const gradientBYR = new Gradient()
    .setColorGradient("#1fddff", "#FBD786", "#F7797D")
    .setMidpoint(100);

const gradientBlueShades = new Gradient()
    .setColorGradient("#c1e0fa", "#1374c5")
    .setMidpoint(100);

const gradientRYG = new Gradient()
    .setColorGradient("#ff1212", "#fcd610", "#009f08")
    .setMidpoint(100);

function wait(ms) {
    var start = new Date().getTime();
    var end = start;
    while (end < start + ms) {
        end = new Date().getTime();
    }
}

const normalize01 = (val, min, max) => (val - min) / (max - min);

function updateIconsProgress(temp, hum, batt) {
    temp = normalize01(temp, -10, 50);
    hum /= 100;
    batt = normalize01(batt, 3.1, 3.4);
    $("#lgT > stop").css(
        "stopColor",
        gradientBYR.getColor(Math.pow(temp, 1.1) * 100)
    );
    $("#lgT > stop").attr("offset", String(temp));
    $("#lgT > stop > animate").attr("to", String(temp));
    $("#lgT > stop > animate")[0].beginElement();
    $("#lgT > stop > animate")[1].beginElement();

    $("#lgH > stop").css("stopColor", gradientBlueShades.getColor(hum * 100));
    $("#lgH > stop").attr("offset", String(hum));
    $("#lgH > stop > animate").attr("to", String(hum));
    //$("#lgH > stop > animate")[0].beginElement();
    //$("#lgH > stop > animate")[1].beginElement();

    $("#lgB > stop").css("stopColor", gradientRYG.getColor(batt * 100));
    $("#lgB > stop").attr("offset", String(batt));
    $("#lgB > stop > animate").attr("to", String(batt));
    //$("#lgB > stop > animate")[0].beginElement();
    //$("#lgB > stop > animate")[1].beginElement();
}

function updateNums(temp, hum, batt) {
    $("#numT").text(temp.toFixed(1));
    $("#numH").text(hum.toFixed(1));
    $("#numB").text(batt.toFixed(2));
}

$.getJSON(
    "https://api.thingspeak.com/channels/1626158/feeds/last.json",
    function (data) {
        console.log(data);
        var temp = 22.7,
            hum = 72.3,
            batt = 3.25;
        updateIconsProgress(temp, hum, batt);
        updateNums(temp, hum, batt);
        var time = luxon.DateTime.fromISO(data.created_at);
        $("#numDate").text(time.setLocale("it").toFormat("DDDD T")); // https://moment.github.io/luxon/#/formatting?id=table-of-tokens
    }
);


let width, height, gradient;
function getGradient(ctx, chartArea) {
    const chartWidth = chartArea.right - chartArea.left;
    const chartHeight = chartArea.bottom - chartArea.top;
    if (!gradient || width !== chartWidth || height !== chartHeight) {
        // Create the gradient because this is either the first render
        // or the size of the chart has changed
        width = chartWidth;
        height = chartHeight;
        gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        gradient.addColorStop(0, 'rgb(54, 162, 235)');
        gradient.addColorStop(0.5, 'rgb(255, 205, 86)');
        gradient.addColorStop(1, 'rgb(255, 99, 132)');
    }

    return gradient;
}

Chart.defaults.color = '#7F7F7F';
// Chart.defaults.backgroundColor = '7F7F7F';
// Chart.defaults.borderColor = '7F7F7F';

var chart;

$.getJSON('https://api.thingspeak.com/channels/1626158/fields/1.json?start=2023-06-23T00:00:00Z&end=2023-06-27T23:59:59&average=60',
    function (data) {
        var feeds = data.feeds;
        console.log(feeds);

        var chartData = {
            datasets: [{
                borderColor: function (context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;

                    if (!chartArea) {
                        // This case happens on initial chart load
                        return;
                    }
                    return getGradient(ctx, chartArea);
                },
                tension: 0.4,
                data: feeds,
                // data: [{
                //     x: '2021-11-06T23:39:30Z',
                //     y: 50
                // }, {
                //     x: '2021-11-07T01:00:28Z',
                //     y: 60
                // }, {
                //     x: '2021-11-08T09:00:28Z',
                //     y: 20
                // }],
            }]
        };

        var chLine = document.getElementById("timeserie");
        chart = new Chart(chLine, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    // decimation: {
                    //     enabled: true,
                    //     algorithm: 'lttb',
                    //     samples: 10,
                    // },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        displayColors: false,
                        // xAlign: 'center',
                        // yAlign: 'top',
                        // position: 'nearest',
                        titleAlign: 'center',
                        bodyAlign: 'center',
                        footerAlign: 'center',
                        titleFont: {
                            weight: 'normal',
                        },
                        callbacks: {
                            label: (context) => parseFloat(context.formattedValue.replace(',','.')).toFixed(1) + '°C'
                        },
                    },
                },
                scales: {
                    x: {
                        type: 'time',
                        
                        time: {
                            // unit: 'day',
                            displayFormats: {
                                'hour': 'HH',
                                'day': 'EEE d',
                            },
                            tooltipFormat: "d MMM yyyy HH:mm", // https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
                        },
                        grid: {
                            // display: false,
                            // drawTicks: true,
                        },
                        adapters: {
                            date: {
                                locale: 'it',
                                zone: 'GMT+0'
                            }
                        },
                        ticks: {
                            autoSkip: true,
                            maxRotation: 0,
                            minRotation: 0,
                            major: {
                                enabled: true,
                            },
                            font: (context) => {
                                const boldedTicks = context.tick && context.tick.major ? 'bold' : '';
                                return {weight: boldedTicks};
                            }
                        },
                        border: {
                            display: false,
                        },
                    },
                    y: {
                        ticks: {
                            // Include a dollar sign in the ticks
                            callback: function (value, index, ticks) {
                                return value + '°C';
                            },
                            beginAtZero: false,
                        //     mirror: true,
                        //     align: 'end',
                        },
                        grid: {
                            display: false,
                        },
                        border: {
                            display: false,
                        }
                    }
                },
                parsing: {
                    xAxisKey: 'created_at',
                    yAxisKey: 'field1'
                }
            }
        });
    }
);

$(window).on('resize', function () {
    console.log('resize');
    chart.resize();
});
