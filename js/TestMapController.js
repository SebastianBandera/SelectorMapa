//const nominatim = 'https://nominatim.openstreetmap.org/';
const nominatim = 'http://localhost:8080/';
//const tile = 'https://tile.openstreetmap.org/';
const tile = 'http://localhost:8081/tile';

let mapController = new MapController({
    id_depto: 'departamento',
    id_calle: 'calle',
    id_calle_numero: 'numero',
    id_calle_esquina: 'esquina',
    id_map: 'map',
    id_status: 'status',
    id_coords: 'coords',
    id_coords_lat: 'coords_lat',
    id_coords_lng: 'coords_lon',
    id_toggle_todos_centros: 'toggle_todos_centros',
    id_overlay: 'overlay',
    id_dir_mapa: 'dir_mapa'
},
nominatim,
tile,
centros.data
);

mapController.startControl();

