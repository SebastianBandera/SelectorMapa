class NominatimImpl {
    version = 1;
    url; //string
    log; //boolean
    
    constructor(url) {
        if(url == null) throw new Error("Null URL");
        let tmp_url = new String(url);
        if(tmp_url.endsWith("/")) {
            this.url = tmp_url;
        } else {
            this.url = tmp_url + "/";
        }
        console.log("NominatimImpl: version " + this.version)
    }

    _logIn(data, logOutput) {
        if(this.log && logOutput!=null) {
            logOutput(data);
        }
        return data;
    }

    _getText(data) {
        if(data!=null && data.text!=null && typeof data.text === 'function') {
            return data.text();
        } else {
            return data;
        }
    }

    //log? -> ?json:text -|>catch log?
    _commonResolve(funcCB, promise, resolveToJson) {
        promise.then(data=>this._logIn(data, console.debug))
               .then(d=>{
                    let i = 21;
                    return d.bodyUsed ? d : (!!resolveToJson) ? d.json() : this._getText(d)
                })
               .then(funcCB)
               .catch(data=>this._logIn(data, console.error));
    }

    //
    _commonRequest(service, params) {
        const baseUrl = this.url + service;
        const target = new URL(baseUrl);
        Object.keys(params).forEach(key => target.searchParams.append(key, params[key]));
        return fetch(target);
    }

    setLog(log) {
        this.log = !!log;
    }

    getLog() {
        return this.log;
    }

    getUrl() {
        return this.url;
    }

    status() {
        return fetch(this.url + "status");
    }

    statusResolve(funcCB) {
        this._commonResolve(funcCB, imap.status(), false);
    }

    search(query, countrycodes, format) {
        const params = {
            q: query,
            polygon_geojson: 1,
            countrycodes: countrycodes,
            format: format
        };
        return this._commonRequest("search", params);
    }

    searchResolve(funcCB, query, countrycodes, format) {
        this._commonResolve(funcCB, imap.search(query, countrycodes, format), true);
    }

    reverse(lat, lon, zoom, addressdetails, format) {
        const params = {
            lat: lat,
            lon: lon,
            zoom: zoom,
            addressdetails: addressdetails,
            format: format,
            polygon_geojson: 1
        };
        return this._commonRequest("reverse", params);
    }

    reverseResolve(funcCB, lat, lon, zoom, addressdetails, format) {
        this._commonResolve(funcCB, imap.reverse(lat, lon, zoom, addressdetails, format), true);
    }

    resolveReverseCalcDistance(funcCB, lat, lon, zoom, addressdetails, format) {
        this.reverse(lat, lon, zoom, addressdetails, format)
            .then(d=>d.json())
            .then(j=>{
                j.custom_evaluated_distance = this._getMeters(lon, lat, j.geojson.coordinates[0], j.geojson.coordinates[1]);
                return j;
            })
            .then(funcCB)
    }

    _getLinePoints(data) {
        const min_threshold = 0.02;
        let points = data.flatMap((item)=>item.geojson.coordinates);
        let extendedPoints = [];
        for (let index = 0; index < points.length - 1; index++) {
            let point = points[index];
            extendedPoints.push(point);
            const next_point = points[index + 1];
            let len = this._getMeters(point[0], point[1], next_point[0], next_point[1]);
            if(len >= min_threshold) {
                const count_new_points = Math.floor(len / min_threshold);
                for (let index_new_points = 1; index_new_points <= count_new_points; index_new_points++) {
                    if(count_new_points == 1) {
                        const mid_point = [(point[0]+next_point[0])/2,(point[1]+next_point[1])/2];
                        extendedPoints.push(mid_point);
                    } else {
                        if(count_new_points!=index_new_points) {
                            const r = (index_new_points)/(count_new_points-index_new_points);
                            const mid_point = [(point[0]+r*next_point[0])/(r+1),(point[1]+r*next_point[1])/(r+1)];
                            extendedPoints.push(mid_point);
                        }
                    }
                }
            }
        }
        return extendedPoints;
    }
    
    _radiansFunc(val) {
        return val*Math.PI/180;
    }

    _getMeters(lon1,lat1,lon2,lat2) {
        lat1 = this._radiansFunc(lat1);
        lon1 = this._radiansFunc(lon1);
        lat2 = this._radiansFunc(lat2);
        lon2 = this._radiansFunc(lon2);
        
        const radio = 6371;
        let difLon = (lon2 - lon1);
        let difLat = (lat2 - lat1);
        let a = Math.pow(Math.sin(difLat / 2.0), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(difLon / 2.0), 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return radio * c;
    }

    _recalcSegment(line1, line2, finalPoint1, finalPoint2, finalIndexPoint1, finalIndexPoint2) {
        debugger;
        return false;
    }

    _crossCalc(line1, line2) {
        let minLen = Number.MAX_SAFE_INTEGER;
        let finalPoint1 = null;
        let finalPoint2 = null;
        let finalIndexPoint1 = null;
        let finalIndexPoint2 = null;

        for (const index_point1 in line1) {
            for (const index_point2 in line2) {
                const point1 = line1[index_point1];
                const point2 = line2[index_point2];
                const len = this._getMeters(point1[0], point1[1], point2[0], point2[1]);
                if(len < minLen) {
                    minLen = len;
                    finalPoint1 = point1;
                    finalPoint2 = point2;
                    finalIndexPoint1 = index_point1;
                    finalIndexPoint2 = index_point2;
                }
            }
        }

        if(minLen == Number.MAX_SAFE_INTEGER) {
            return {
                len: -1,
                point1: null,
                point2: null,
                cross: false
            }
        } else {
            return {
                len: minLen,
                point1: finalPoint1,
                point2: finalPoint2,
                cross: (minLen == 0 || minLen <= 0.05) ? true : this._recalcSegment(line1, line2, finalPoint1, finalPoint2, finalIndexPoint1, finalIndexPoint2)
            }
        }

    }

    cross(query1, countrycodes1, format1, query2, countrycodes2, format2) {
        let promise1 = this.search(query1, countrycodes1, format1).then(d=>d.json());
        let promise2 = this.search(query2, countrycodes2, format2).then(d=>d.json());

        return Promise.all([promise1, promise2]).then(data=>{
            let line1 = this._getLinePoints(data[0]);
            let line2 = this._getLinePoints(data[1]);
            let crossInfo = this._crossCalc(line1, line2);
            return crossInfo;
        });
    }

    crossResolve(funcCB, query1, countrycodes1, format1, query2, countrycodes2, format2) {
        this._commonResolve(funcCB, imap.cross(query1, countrycodes1, format1, query2, countrycodes2, format2), false);
    }
}