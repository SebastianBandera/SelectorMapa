const imap = new NominatimImpl("http://localhost:8080/");
imap.setLog(true);

/*imap.statusResolve((data) => {
    console.log("statusResolve");
    console.log(data);
})


imap.searchResolve((data) => {
    console.log("searchResolve");
    console.log(data);
}, "MONTEVIDEO, juan paullier", "1", "UY", "jsonv2");

//imap.search("MONTEVIDEO, juan paullier", "1", "UY", "jsonv2").then(d=>d.json()).then(console.log);



imap.reverseResolve((data) => {
    console.log("reverseResolve");
    console.log(data);
}, -34.8931833, -56.170223, 20, 1, "jsonv2");
*/

imap.resolveReverseCalcDistance((data)=> {
    if(data.custom_evaluated_distance>1) {
        console.log("Distancia mayor a 1Km !!! -> " + data.custom_evaluated_distance)
    }
}, -34.92816383449365, -56.11610412597657, 20, 1, "jsonv2");

//console.log(imap.cross("MONTEVIDEO, juan paullier", "UY", "jsonv2", "MONTEVIDEO, goes", "UY", "jsonv2"));

//console.log(imap.cross("MONTEVIDEO, juan paullier", "UY", "jsonv2", "MONTEVIDEO, artigas", "UY", "jsonv2"));

imap.crossResolve(console.log, "MONTEVIDEO, juan paullier", "UY", "jsonv2", "MONTEVIDEO, bulevar  artigas", "UY", "jsonv2");

imap.crossResolve(console.log, "MONTEVIDEO, juan paullier", "UY", "jsonv2", "MONTEVIDEO, goes", "UY", "jsonv2");



var map = L.map('map').setView([-34.893299, -56.165160], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png?bar', {
    minZoom: 3,
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);


var myIcon = L.icon({
    iconUrl: 'js/leaflet/images/exterior.png',
    iconSize: [35, 35],
    iconAnchor: null,
    popupAnchor: null
});

var marker = L.marker([-34.893299, -56.165160],
    {
        title: "Marcador en el mapa",
        icon: myIcon
    }
)
.bindTooltip("texto", {
    direction: "right",
    sticky: true,
    offset: [10, 0]
})
.addTo(map);

var mClick = null;
var mClick_lat = null;
var mClick_lng = null;
var tooltip;
var tooltip_params;

map.on("click", function(e) {
    if(mClick!=null) {
        map.removeLayer(mClick)
    }

    mClick_lat=e.latlng.lat;
    mClick_lng=e.latlng.lng;

    tooltip = ()=>"lat:" + mClick_lat + "<br>lng:" + mClick_lng;
    tooltip_params = {
        direction: "right",
        sticky: true,
        offset: [10, 0]
    };
    
    mClick = new L.marker([mClick_lat,mClick_lng], {draggable:true}).bindTooltip(tooltip, tooltip_params).addTo(map);

    mClick.on('dragstart', function(e){
        mClick.unbindTooltip();
    });

    mClick.on('drag', function(e){
        //mClick.unbindTooltip();
        mClick_lat=e.target._latlng.lat;
        mClick_lng=e.target._latlng.lng;
        //mClick.unbindTooltip();
        //mClick.bindTooltip(tooltip, tooltip_params);
    });

    mClick.on('dragend', function(e){
        let latlng = e.target.getLatLng();
        mClick_lat=latlng.lat;
        mClick_lng=latlng.lng;
        var marker = e.target;
        map.panTo([mClick_lat,mClick_lng]);
        mClick.bindTooltip(tooltip, tooltip_params);
        console.log(latlng);
    });
});