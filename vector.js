	"use strict";
    var L = L || {};
 
	/**
	 * Generic namespace with constants and helper functions
	 */
	L.trackmyrace = {
		PRECISION: 1e-10,
		EARTH_RADIUS: 6378.137,

		lerp: function(a, b, s, clamp) {
			if (clamp) {
				if (s > 1) return b;
				if (s < 0) return a;
			}

			return (a + (b - a) * s);
		},

		amin: function(a,b) {
			return Math.abs(a) < Math.abs(b) ? a : b;
		},

		lerp360: function(a, b, s, clamp) {
			if (typeof(a) != 'number' || typeof(b) != 'number' || typeof(s) != 'number') return a;

			if (clamp) {
				if (s > 1) return b;
				if (s < 0) return a;
			}

			var d1 = b - a;
			var d2 = d1 - 360;
			var d3 = d1 + 360;

			var d = this.amin(d1, this.amin(d2, d3));

			return (a + d * s) % 360;
		},

		rad: function(deg) {
			return deg * Math.PI / 180.0;
		},

		deg: function(rad) {
			return rad * 180.0 / Math.PI;
		}

	};

	/**
	 * A twodimensional vector that represents a geolocation for calculation purposes
	 *
	 * @param latLng {L.LatLng | number}
	 * @param lng {?number}
	 * @param alt {?number}
	 * @constructor
	 */
	L.trackmyrace.Vector = function(latLng, lng, alt) {
		if (!latLng) {
			this.x = this.y = this.z = 0.0;
		} else if (typeof latLng === 'number') {
			this.x = latLng || 0.0;
			this.y = lng || 0.0;
			this.z = alt || 0.0;
		} else if ('lat' in latLng && 'lng' in latLng) {
			this.x = latLng.lat;
			this.y = latLng.lng;
			this.z = latLng.alt || 0.0;
		} else if (latLng instanceof Array) {
			this.x = latLng[0];
			this.y = latLng[1];
			this.z = latLng[2];
		}
	}
	L.trackmyrace.Vector.prototype = {
		lat: function() {
			return this.x;
		},
		lng: function() {
			return this.y;
		},
		alt: function() {
			return this.z;
		},
		head: function() {
			return this.x;
		},
		tilt: function() {
			return this.y;
		},
		rot: function() {
			return this.z;
		},
		add: function(p) {
			if (typeof(p) === 'object')
				return new L.trackmyrace.Vector(this.x + p.x, this.y + p.y, this.z + p.z);
			else
				return new L.trackmyrace.Vector(this.x + p, this.y + p, this.z + p);
		},
		sub: function(p) {
			if (typeof(p) === 'object')
				return new L.trackmyrace.Vector(this.x - p.x, this.y - p.y, this.z - p.z);
			else
				return new L.trackmyrace.Vector(this.x - p, this.y - p, this.z - p);
		},
		mul: function(s) {
			return new L.trackmyrace.Vector(this.x * s, this.y * s, this.z * s);
		},
		div: function(s) {
			if (Math.abs(s) < L.trackmyrace.PRECISION) return new L.trackmyrace.Vector();
	
			return this.mul(1.0 / s);
		},
		mod: function(s) {
			return new L.trackmyrace.Vector( (this.x + s) % s, (this.y + s) % s, (this.z + s) % s );
		},
		abs: function() {
			return new L.trackmyrace.Vector( Math.abs(this.x), Math.abs(this.y), Math.abs(this.z) );
		},
		min: function(p) {
			return new L.trackmyrace.Vector( Math.min(this.x, p.x), Math.min(this.y, p.y), Math.min(this.z, p.z) );
		},
		max: function(p) {
			return new L.trackmyrace.Vector( Math.max(this.x, p.x), Math.max(this.y, p.y), Math.max(this.z, p.z) );
		},
		amin: function(p) {
			return new L.trackmyrace.Vector( Math.abs(this.x) < Math.abs(p.x) ? this.x : p.x,
					Math.abs(this.y) < Math.abs(p.y) ? this.y : p.y,
					Math.abs(this.z) < Math.abs(p.z) ? this.z : p.z );
		},
		amax: function(p) {
			return new L.trackmyrace.Vector( Math.abs(this.x) > Math.abs(p.x) ? this.x : p.x,
					Math.abs(this.y) > Math.abs(p.y) ? this.y : p.y,
					Math.abs(this.z) > Math.abs(p.z) ? this.z : p.z );
		},
		lt: function(p) {
			if (typeof(p) === 'object')
			{
				return this.x < p.x && this.y < p.y && this.z < p.z;
			}
			else
			{
				return this.x < p && this.y < p && this.z < p;
			}
		},
		gt: function(p) {
			if (typeof(p) === 'object')
			{
				return this.x > p.x && this.y > p.y && this.z > p.z;
			}
			else
			{
				return this.x > p && this.y > p && this.z > p;
			}
		},
		eq: function(p) {
			return (Math.abs(this.x - p.x) < L.trackmyrace.PRECISION
				 && Math.abs(this.y - p.y) < L.trackmyrace.PRECISION
				 && Math.abs(this.z - p.z) < L.trackmyrace.PRECISION);
		},
		distance: function(p) {
			var dLat = Math.sin(L.trackmyrace.rad(p.x - this.x) / 2);
			var dLng = Math.sin(L.trackmyrace.rad(p.y - this.y) / 2);

			var a = dLat * dLat +
				Math.cos(L.trackmyrace.rad(this.x)) * Math.cos(L.trackmyrace.rad(p.x)) *
				dLng * dLng;

			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

			return c * L.trackmyrace.EARTH_RADIUS;
		},
		project: function(zoom = 10) {
            var scale = 128.0 / Math.PI * Math.pow(2, zoom);
            var x = scale * (L.trackmyrace.rad(this.y) + Math.PI);
            var y = scale * (Math.PI - Math.log(Math.tan(Math.PI / 4 + L.trackmyrace.rad(this.x) / 2)));
            return [x, y];
		},
		unproject: function(zoom = 10) {
            var scale = Math.PI / (128.0 * Math.pow(2, zoom));
            var lng = L.trackmyrace.deg((scale * this.x) - Math.PI);
            var lat = L.trackmyrace.deg((Math.atan(Math.exp((scale * -this.y) + Math.PI)) - Math.PI / 4) * 2);
            return [lat, lng];
		},
		heading: function(p) {
			var dLng = L.trackmyrace.rad(p.y - this.y);
	
			var lat1 = L.trackmyrace.rad(this.x);
			var lat2 = L.trackmyrace.rad(p.x);
	
			var y = Math.sin(dLng) * Math.cos(lat2);
			var x = Math.cos(lat1) * Math.sin(lat2) -
				Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
	
			var head = (L.trackmyrace.deg(Math.atan2(y, x)) + 360) % 360;
	
			return head;
		},
		isvalid: function() {
			return !isNaN(this.x) && !isNaN(this.y) && !isNaN(this.z);
		},
		iszero: function() {
			return this.x == 0 && this.y == 0;
		},
		lerp: function(p, t) {
			return this.add(p.sub(this).mul(t));
		},
		hermite: function(p, m0, m1, t) {
			var t2 = t*t;
			var t3 = t2*t;
			return this.mul(2*t3 - 3*t2 + 1).add(m0.mul(t3 - 2*t2 + t)).add(p.mul(-2*t3 + 3*t2)).add(m1.mul(t3-t2));
		},

		/**
		 * The following functions disregard the z component on purpose, since we approximate the polyline as lying in the z=0 plane
		 * for all distance calculations
		 */
		dot: function(p) {
			return this.x * p.x + this.y * p.y;
		},
		perpendicular: function() {
			return new L.trackmyrace.Vector(this.y, -this.x);
		},
		unit: function() {
			var l = this.length();
			if (Math.abs(l) < L.trackmyrace.PRECISION) return new L.trackmyrace.Vector();
			l = 1.0 / l;
			return new L.trackmyrace.Vector(this.x * l, this.y * l);
		},
		normaleTo: function(p) {
            return this.sub(p).perpendicular().unit();
		},
		length: function() {
			return Math.sqrt(this.x * this.x + this.y * this.y);
		},
		sqlength: function() {
			return this.x * this.x + this.y * this.y;
		},
		projectOnto: function(p) {
            return p.mul(this.dot(p));
		},

		latLng: function() {
			return new L.LatLng(this.x, this.y, this.z);
		},

		/**
		 * Check if this Vector lies within a polyon of Vectors.
		 * @see https://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
		 * @param {array} poly Array of Vectors (or any object with x, y properties) making up a polygon
		 * @returns {boolean}
		 */
		inside: function(poly) {
			var c = false;
			for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
				if (((poly[i].y > this.y) != (poly[j].y > this.y)) &&
					(this.x < (poly[j].x - poly[i].x) * (this.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)) {
					c = !c;
				}
			}
			return c;
		}
	};