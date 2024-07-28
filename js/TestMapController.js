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
'https://nominatim.openstreetmap.org/',
'https://tile.openstreetmap.org/',
centros.data
);

/*let mapController = new MapController({
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
'http://localhost:8080/',
'http://localhost:8081/tile',
centros.data
);*/

mapController.startControl();

