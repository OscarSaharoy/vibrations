class Matrix {

	// dense matrix class

	constructor(rows, cols) {
		this.rows   = rows;
		this.cols   = cols;
		this.length = rows * cols;
		this.data   = new Float32Array(this.length);
	}
}

class SparseMatrix {

	// sparse matrix class

	constructor(rows, cols) {
		this.rows   = rows;
		this.cols   = cols;
		this.length = rows * cols;
		this.values = [];
		this.index  = [];
		this.r_ind  = [];
		this.c_ind  = [];
	}

	setvalue(row, col, value) {

		// pushes a value into the matrix at row, col

		this.values.push(value);
		this.index.push(row*this.cols + col);
		this.r_ind.push(row);
		this.c_ind.push(col);
	}

	scale(S) {

		// multiplies each element by S

		for(var t=0; t<this.values.length; ++t) {

			this.values[t] *= S;
		}
	}
}

// math functions

function add(M1, M2) {

	// add 2 matrices

	var temp = new Matrix(M1.rows, M1.cols);

	for(var t=0; t<M1.length; ++t) {

		temp.data[t] = M1.data[t] + M2.data[t];
	}

	return temp;
}

function add3(M1, M2, M3) {

	// add 3 matrices

	var temp = new Matrix(M1.rows, M1.cols);

	for(var t=0; t<M1.length; ++t) {

		temp.data[t] = M1.data[t] + M2.data[t] + M3.data[t];
	}

	return temp;
}

function sparsemul(MS, V) {
	
	// multiply vector by sparse matrix returning vector

	var temp = new Matrix(V.rows, V.cols);

	for(var a=0; a<MS.index.length; ++a) {

		temp.data[MS.r_ind[a]] += MS.values[a] * V.data[MS.c_ind[a]];
	}	

	return temp;
}

function mul(M1, S) {

	// multiply matrix by S

	var temp = new Matrix(M1.rows, M1.cols);

	for(var t=0; t<M1.length; ++t) {

		temp.data[t] = M1.data[t] * S;
	}

	return temp;
}

// ui variables

var stiffnessrange  = document.getElementById("stiffnessrange");
var dampingrange    = document.getElementById("dampingrange");
var seperationrange = document.getElementById("seperationrange");
var widthrange      = document.getElementById("widthrange");
var heightrange     = document.getElementById("heightrange");
var strengthrange   = document.getElementById("strengthrange");

var stiffnesslabel  = document.getElementById("stiffnesslabel");
var dampinglabel    = document.getElementById("dampinglabel");
var seperationlabel = document.getElementById("seperationlabel");
var widthlabel      = document.getElementById("widthlabel");
var heightlabel     = document.getElementById("heightlabel");
var strengthlabel   = document.getElementById("strengthlabel");

// functions to set parameters depending on sliders

function setStiffness() {

	k = stiffnessrange.value * 0.08;
	stiffnesslabel.innerHTML = k.toFixed(2);

	ky.scale(k / ky.values[0] * 2);
	kx.scale(k / kx.values[0] * 2);
}

function setDamping() {

	l = dampingrange.value * 0.08;
	dampinglabel.innerHTML = l.toFixed(2);

	ly.scale(l / ly.values[0] * 2);
	lx.scale(l / lx.values[0] * 2);
}

function setSeperation() {

	const value = seperationrange.value;
	d = parseInt(value * 0.3);
	seperationlabel.innerHTML = d;
}

function setWidth() {

	nx = widthrange.value;
	widthlabel.innerHTML = nx;
	n = nx * ny;

	init();
}

function setHeight() {

	ny = heightrange.value;
	heightlabel.innerHTML = ny;
	n = nx * ny;

	init();
}

function setHeight() {

	const value = heightrange.value;
	ny = value;
	heightlabel.innerHTML = ny;
	n = nx * ny;

	init();
}

function setStrength() {

	strength = strengthrange.value;
	strengthlabel.innerHTML = strength;
}

function init() {

	// create position and derivative vectors
	x2 = new Matrix(n, 1); // x acceleration
	x1 = new Matrix(n, 1); // x velocity
	x  = new Matrix(n, 1); // x position

	y2 = new Matrix(n, 1);
	y1 = new Matrix(n, 1);
	y  = new Matrix(n, 1);

	// force input vectors
	fx = new Matrix(n, 1);
	fy = new Matrix(n, 1);

	// stiffness and damping matrices
	lx = new SparseMatrix(n, n);
	kx = new SparseMatrix(n, n);

	ly = new SparseMatrix(n, n);
	ky = new SparseMatrix(n, n);

	// populate stiffness and damping matrices
	for(var i=0; i<n; ++i) {

		for(var j=0; j<n; ++j) {

			if(i==j) {

				lx.setvalue(i, j, 2*l);
				kx.setvalue(i, j, 2*k);
			}
			else if(Math.abs(i-j) == 1 && (i+j)%(2*nx) != 2*nx-1) {

				lx.setvalue(i, j, -1*l);
				kx.setvalue(i, j, -1*k);
			}
		}
	}

	for(var i=0; i<n; ++i) {

		for(var j=0; j<n; ++j) {

			if(i==j) {

				ly.setvalue(i, j, 2*l);
				ky.setvalue(i, j, 2*k);
			}
			else if(Math.abs(i-j) == nx) {

				ly.setvalue(i, j, -1*l);
				ky.setvalue(i, j, -1*k);
			}
		}
	}
}

function drawdot(x, y) {

	// manually draw to canvas imageData for increased performance
	// loops over each pixel in a 7x7 area around (x, y) and calculate the desired alpha

	var ix = Math.floor(x);
	var iy = Math.floor(y);

	for(var i=-3, j=-3; i<4; j++) {

		var ox = ix + i;
		var oy = iy + j;

		var dx = ox - x;
		var dy = oy - y;
		var dm = dx*dx + dy*dy;

		// calculate alpha based off distance from centre of dot
		var alpha = ( 1.5 - 0.25*dm ) * 255;

		// set alpha and add to alphaindexes to be cleared next frame
		if(alpha > 0) {
			var ind = (ox + oy*w)*4 + 3;
			canvasData.data[ind] += alpha;
			alphaindexes.push(ind);
		}

		if(j==4) {
			j = -3;
			i++;
		}
	}
}

function mouseDown(e) {

	// add force to points around click

	if(e.button == 0 && e.target == canvas) {
		for(var t=0; t<n; ++t) {

			var dx = e.offsetX / canvas.offsetWidth * w - d * (t%nx-nx/2) - w/2;
			var dy = e.offsetY / canvas.offsetHeight * h - d * (Math.floor(t/nx)-ny/2) - h/2;
			var dm = Math.sqrt(dx*dx + dy*dy) + 0.0001;

			var f  = strength/(0.0001*dm*dm + 1);

			fx.data[t] = f * dx/dm;
			fy.data[t] = f * dy/dm;
		}
	}
}

window.addEventListener('mousedown', mouseDown);

function step() {

	// decay forces from click
	fx = mul(fx, 0.7);
	fy = mul(fy, 0.7);

	// apply equation of motion by verlet integration
	var x2s = mul( add3(fx, sparsemul(lx, x1), sparsemul(kx, x)), -0.1 );
	var x1h = add(x1, mul(x2s, 0.5));
	x  = add(x, x1h);
	x2 = mul( add3(fx, sparsemul(lx, x1h), sparsemul(kx, x)), -0.1 );
	x1 = add(x1h, mul(x2, 0.5));

	var y2s = mul( add3(fy, sparsemul(ly, y1), sparsemul(ky, y)), -0.1 );
	var y1h = add(y1, mul(y2s, 0.5));
	y  = add(y, y1h);
	y2 = mul( add3(fy, sparsemul(ly, y1h), sparsemul(ky, y)), -0.1 );
	y1 = add(y1h, mul(y2, 0.5));
}

function draw() {

	// loop over all dots and draw them
	for(var t=0; t<n; ++t) {

		drawdot(d*(t%nx-nx/2) + x.data[t] + w/2, d*(Math.floor(t/nx)-ny/2) + y.data[t] + h/2);
	}
}

function animate() {

	// clear screen
	for(const u of alphaindexes) {
		canvasData.data[u] = 0;
	}

	alphaindexes = [];

	// 4 physics steps then draw to screen
	step();
	step();
	step();
	step();

	draw();
	ctx.putImageData(canvasData, 0, 0);
	
	requestAnimationFrame(animate);
}

// get canvas variables
var canvas  = document.getElementById("canvas");
var w       = canvas.width;
var h       = canvas.height;
var ctx     = canvas.getContext("2d");

var canvasData = ctx.getImageData(0, 0, w, h);
var alphaindexes = [];
var d  = 12; // seperation between points

// set number of rows and columns of elements 
var nx = 40;
var ny = 40;
var n  = nx * ny;

// set stiffness, damping and click strength
var l = 1;
var k = 0.4;
var strength = 20;

var x2, x1, x, fx, lx, kx, y2, y1, y, fy, ly, ky;

// set slider initial values
stiffnessrange.value  = 1/0.08;
dampingrange.value    = 1/0.08;
seperationrange.value = d/0.3;
widthrange.value      = nx;
heightrange.value     = ny;
strengthrange.value   = strength;

init();
animate();