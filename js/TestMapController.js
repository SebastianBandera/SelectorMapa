let mapController = new MapController({
    id_depto: 'departamento',
    id_calle: 'calle',
    id_calle_numero: 'numero',
    id_calle_esquina: 'esquina',
    id_map: 'map',
    id_status: 'status',
    id_coords: 'coords',
    id_coords_lat: 'coords_lat',
    id_coords_lng: 'coords_lon'
},
'https://nominatim.openstreetmap.org/',
'https://tile.openstreetmap.org/'
);

mapController.startControl();

//mapController.setMarkers(centros.data);

