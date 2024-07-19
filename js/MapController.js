class MapController {
    //Vars
    _objs;
    _url_nominatim;
    _url_tiles;

    //Constants
    threshold = 20.000;
    _house_icon = L.icon({
        iconUrl: 'js/leaflet/images/exterior.png',
        iconSize: [35, 35]
    });
    _center_liceo_icon = L.icon({
        iconUrl: 'js/leaflet/images/liceo3.png',
        iconSize: [25, 25]
    });
    _center_escuela_icon = L.icon({
        iconUrl: 'js/leaflet/images/escuela3.png',
        iconSize: [25, 25]
    });
    _center_utu_icon = L.icon({
        iconUrl: 'js/leaflet/images/utu3.png',
        iconSize: [25, 25]
    });
    _status_new = 'nuevo';
    _status_edit = 'edicion';

    //Status
    _status = [];
    _house_marker;
    _coord_lat;
    _coord_lng;

    _centers = [];
    _circle = null;

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

    setMarkers(list) {
        const tooltip_params = {
            direction: "right",
            sticky: true,
            offset: [10, 0]
        };
        
        for (const c of list) {
            const tooltip = c.consejo_id + ": " + c.nombre;
            new L.marker([c.Lat_dec,c.Long_dec], {
                title: "Centro " + c.nombre,
                icon: this._center_icon,

            }).bindTooltip(tooltip, tooltip_params).addTo(this._getMap());
        }
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

    _selecionarIcono(consejo) {
        if(consejo==2) return this._center_escuela_icon;
        if(consejo==3) return this._center_liceo_icon;
        if(consejo==4) return this._center_utu_icon;
        return null;
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

            this._updateVisibleCenters();
        });

        this._updateVisibleCenters();
    }
    
    _updateVisibleCenters() {
        const list = centros.data;

        const tooltip_params = {
            direction: "right",
            sticky: true,
            offset: [10, 0]
        };

        for (const c of this._centers) {
            this._getMap().removeLayer(c)
        }
        if(this._circle) {
            this._getMap().removeLayer(this._circle);
        }

        let centro_dist = [];

        for (const c of list) {
            const distance = this._getNominatim().calculateDistance(c.Long_dec,c.Lat_dec,this._coord_lng,this._coord_lat);
            if(distance<this.threshold){
                centro_dist.push({
                    centro: c,
                    distance: distance
                });

                /*const tooltip = c.consejo_id + ": " + c.nombre;
                const marker = new L.marker([c.Lat_dec,c.Long_dec], {
                    title: "Centro " + c.nombre,
                    icon: this._selecionarIcono(c.consejo_id),
                }).bindTooltip(tooltip, tooltip_params).addTo(this._getMap());*/
            }
        }

        let count = 5;

        centro_dist = centro_dist.sort((c1,c2)=>c1.distance-c2.distance);

        for (let index = count-1; index < centro_dist.length-1; index++) {
            const item = centro_dist[index];
            const next_item = centro_dist[index+1];
            if(item.distance==next_item.distance) {
                count++;
            } else {
                break;
            }
        }

        for (let index = 0; index < count; index++) {
            const centro_obj = centro_dist[index];

            let marker;
            if(index>0 && centro_obj.distance == centro_dist[index-1].distance) {
                this._getMap().removeLayer(this._centers[this._centers.length-1]);
                const tooltipSingleGenerator = (id, name)=>centro_tipo[id] + ": " + name;
                let tooltipList = [];
                for (let inner_index = index; inner_index>=0; inner_index--) {
                    const center = centro_dist[inner_index];
                    if(center.distance == centro_obj.distance) {
                        tooltipList.push(tooltipSingleGenerator(center.centro.consejo_id, center.centro.nombre));
                    } else {
                        break;
                    }
                } 
                const tooltip = tooltipList.join(" <br> ");
                marker = new L.marker([centro_obj.centro.Lat_dec,centro_obj.centro.Long_dec], {
                    title: "Centros " + centro_obj.centro.nombre + " y " + centro_dist[index-1].centro.nombre,
                    icon: this._selecionarIcono(centro_obj.centro.consejo_id),
                }).bindTooltip(tooltip, tooltip_params).addTo(this._getMap());
            } else {
                const tooltip = centro_tipo[centro_obj.centro.consejo_id] + ": " + centro_obj.centro.nombre;
                marker = new L.marker([centro_obj.centro.Lat_dec,centro_obj.centro.Long_dec], {
                    title: "Centro " + centro_obj.centro.nombre,
                    icon: this._selecionarIcono(centro_obj.centro.consejo_id),
                }).bindTooltip(tooltip, tooltip_params).addTo(this._getMap());
            }
            
            this._centers.push(marker);
        }

        this._circle = L.circle([this._coord_lat, this._coord_lng], centro_dist[count-1].distance*1000+50).addTo(this._getMap());
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
                if(houseNumber!=null && houseNumber.indexOf(",")>=0) {
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