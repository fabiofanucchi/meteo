const thingSpeak = { channel: "2232196", apiKey: "M3QPKVAXT18DT3LA" };

$('#fullDB').attr('href', `https://api.thingspeak.com/channels/${thingSpeak.channel}/feed.csv?api_key=${thingSpeak.apiKey}`);

const gradientBYR = new Gradient()
    .setColorGradient("#1fddff", "#FBD786", "#F7797D")
    .setMidpoint(100);

const gradientBlueShades = new Gradient()
    .setColorGradient("#c1e0fa", "#1374c5")
    .setMidpoint(100);

const gradientRYG = new Gradient()
    .setColorGradient("#ff1212", "#fcd610", "#009f08")
    .setMidpoint(100);

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
    `https://api.thingspeak.com/channels/${thingSpeak.channel}/feeds/last.json?api_key=${thingSpeak.apiKey}`, function (data) {
        var temp = parseFloat(data.field1),
            hum = parseFloat(data.field2),
            // press = parseFloat(data.field3);
            batt = parseFloat(data.field4);
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

var now = new Date();
var oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
oneWeekAgo.setMinutes(oneWeekAgo.getMinutes() - 5);

$.getJSON(`https://api.thingspeak.com/channels/${thingSpeak.channel}/field/1.json?api_key=${thingSpeak.apiKey}&start=${oneWeekAgo.toISOString()}&end=${now.toISOString()}&average=30`, function (data) {
    var feeds = data.feeds;

    var canvas = document.getElementById("weeklyChart");
    chart = new Chart(canvas, {
        type: 'line',
        data: {
            datasets: [{
                borderColor: function (context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) {
                        return;
                    }
                    return getGradient(ctx, chartArea);
                },
                tension: 0.4,
                data: feeds,
            }]
        },
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
                        label: (context) => parseFloat(context.formattedValue.replace(',', '.')).toFixed(1) + '°C'
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
                    adapters: {
                        date: {
                            locale: 'it',
                            zone: 'Europe/Rome'
                        },
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
                            return { weight: boldedTicks };
                        }
                    },
                    border: {
                        display: false,
                    },
                },
                y: {
                    ticks: {
                        callback: function (value, index, ticks) {
                            return value.toFixed(1) + '°C';
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
});

$(window).on('resize', function () {
    console.log('resize');
    chart.resize();
});
