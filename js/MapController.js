class MapController {
    //Variables cargadas al inicio
    _objs;
    _url_nominatim;
    _url_tiles;

    //Constantes
    _house_icon = L.icon({
        iconUrl: 'js/leaflet/images/exterior.png',
        iconSize: [35, 35],
        iconAnchor: null,
        popupAnchor: null
    });
    _status_new = 'nuevo';
    _status_edit = 'edicion';

    //Estado
    _status = [];
    _house_marker;
    _coord_lat;
    _coord_lng;

    constructor(obj_ids, url_nominatim, url_tiles) {
        this._objs = {
            depto: new InputWrapper(obj_ids.id_depto),
            calle: new InputWrapper(obj_ids.id_calle),
            calle_numero: new InputWrapper(obj_ids.id_calle_numero),
            calle_esquina: new InputWrapper(obj_ids.id_calle_esquina),
            map_id: obj_ids.id_map,
            map_html: document.getElementById(obj_ids.id_map),
            status: new InputWrapper(obj_ids.id_status),
            coords: new InputWrapper(obj_ids.id_coords),
            coords_lat: new InputWrapper(obj_ids.id_coords_lat),
            coords_lng: new InputWrapper(obj_ids.id_coords_lng)
        };
        this._url_nominatim = url_nominatim;
        this._url_tiles = url_tiles;
        this._url_nominatim = this._url_nominatim.endsWith("/") ? this._url_nominatim : this._url_nominatim + '/';
        this._url_tiles = this._url_tiles.endsWith("/") ? this._url_tiles : this._url_tiles + '/';

        //Leaflet
        this._objs.map = L.map(this._objs.map_id).setView([-34.893299, -56.165160], 13);
        L.tileLayer(this._url_tiles + '{z}/{x}/{y}.png', {
            minZoom: 3,
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this._objs.map);

        //Nominatim
        this._objs.nominatim = new NominatimImpl(this._url_nominatim);
        this._objs.nominatim.setLog(true);
    }

    startControl() {
        if(this._objs.calle.getValue() && this._objs.calle_numero.getValue()) {
            this._status.push(this._status_edit);
        } else {
            this._status.push(this._status_new);
        }

        this._objs.status.setValue(this._getStatus());

        this._getMap().on("click", this._eventMapClick.bind(this));

        this._objs.calle.getObj().addEventListener("keyup", this._eventGeodecode.bind(this));
        this._objs.calle_numero.getObj().addEventListener("keyup", this._eventGeodecode.bind(this));

        //this._objs.calle_esquina.on("keyup", this._eventGeodecode.bind(this));
    }

    _getStatus() {
        return this._status[this._status.length-1];
    }

    _getMap() {
        return this._objs.map;
    }

    _getNominatim() {
        return this._objs.nominatim;
    }

    _eventMapClick(e) {
        this._coord_lat=e.latlng.lat;
        this._coord_lng=e.latlng.lng;
    
        this._setMarker();

        this._reverseGeodecode();
        this._updateCoords();
    }

    _removeMarker() {
        if(this._house_marker!=null) {
            this._getMap().removeLayer(this._house_marker)
        }
    }

    _setMarker() {
        this._removeMarker();

        let tooltip = ()=>"latitud:" + this._coord_lat + "<br>longitud:" + this._coord_lng;
        let tooltip_params = {
            direction: "right",
            sticky: true,
            offset: [10, 0]
        };
        
        this._house_marker = new L.marker([this._coord_lat,this._coord_lng], {
            draggable: true,
            title: "Marcador en el mapa",
            icon: this._house_icon
        }).bindTooltip(tooltip, tooltip_params).addTo(this._getMap());
    
        this._getMap().panTo([this._coord_lat,this._coord_lng]);

        this._house_marker.on('dragstart', e=>{
            this._house_marker.unbindTooltip();
        });
    
        this._house_marker.on('drag', e=>{
            let latlng = e.target.getLatLng();
            this._coord_lat=latlng.lat;
            this._coord_lng=latlng.lng;
        });
    
        this._house_marker.on('dragend', e=>{
            let latlng = e.target.getLatLng();
            this._coord_lat=latlng.lat;
            this._coord_lng=latlng.lng;
            this._getMap().panTo([this._coord_lat,this._coord_lng]);
            this._house_marker.bindTooltip(tooltip, tooltip_params);
            this._reverseGeodecode();
            this._updateCoords();
        });
    }

    _updateCoords() {
        this._objs.coords_lat.setValue(this._coord_lat);
        this._objs.coords_lng.setValue(this._coord_lng);
        this._objs.coords.setValue(this._coord_lat + "," + this._coord_lng);
        this._objs.status.setValue(this._getStatus());
    }

    _reverseGeodecode() {
        const addressdetails = 1;
        const zoom = 20;
        const format = "jsonv2";
        this._getNominatim().resolveReverseCalcDistance((data)=> {
            if(data.custom_evaluated_distance>0.5) {
                console.log("Distancia mayor a 1Km !!! -> " + data.custom_evaluated_distance)
            } else {
                this._objs.calle.setValue(data.address.road);
                let houseNumber = data.address.house_number;
                if(houseNumber.indexOf(",")>=0) {
                    houseNumber = houseNumber.split(",")[0];
                }
                this._objs.calle_numero.setValue(houseNumber);
            }
        }, this._coord_lat, this._coord_lng, zoom, addressdetails, format);
    }

    _eventGeodecode(e) {
        if(e.code == 'Tab' || e.code == 'Enter') {
            let calle = this._objs.calle.getValue();
            let numero = this._objs.calle_numero.getValue();
            if(calle && numero) {
                const countryCode = "UY";
                const format = "jsonv2";
                this._getNominatim().searchResolve((data) => {
                    let coords = data[0].geojson.coordinates;

                    this._coord_lat=coords[1];
                    this._coord_lng=coords[0];

                    this._setMarker();
                    
                    this._getMap().setView(L.latLng(this._coord_lat, this._coord_lng), 15);

                    this._updateCoords();
                }, calle + " " + numero, countryCode, format);
            }
        }
    }

}

class InputWrapper {
    _obj;

    constructor(id) {
        this._obj = document.getElementById(id);
    }

    setValue(value) {
        if(this._obj != null) {
            this._obj.value = value;
            return true;
        } else {
            return false;
        }
    }

    getValue() {
        return this._obj == null ? '' : this._obj.value;
    }

    getObj() {
        return this._obj;
    }
}