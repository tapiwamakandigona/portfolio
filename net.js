/* net.js — "Inference": a live neural network, drawn as real geometry in WebGL.
   Three draw calls (edges, travelling signal packets, neurons). No library.
   Geometry is cheap, so unlike a raymarcher this renders at full device
   resolution — hairlines stay crisp. */
(function () {
  "use strict";

  var VERT_NODE = [
    "precision mediump float;",
    "attribute vec3 a_pos; attribute vec3 a_col;",
    "attribute vec2 a_meta;",            // x: layer index, y: seed
    "attribute float a_cluster;",
    "uniform mat4 u_mvp; uniform float u_t, u_sweep, u_size, u_spread, u_px, u_last, u_shift;",
    "varying vec3 v_col; varying float v_act, v_depth, v_boot;",
    "void main(){",
    "  v_boot = smoothstep(a_meta.x*.30, a_meta.x*.30 + 1.05, u_t);",
    "  vec3 p = a_pos;",
    "  p.x += a_cluster * u_spread + u_shift;",
    "  float s = a_meta.y;",
    "  p += vec3(sin(u_t*.55+s*6.3), cos(u_t*.47+s*5.1), sin(u_t*.39+s*7.7)) * .035;",
    "  vec4 cs = u_mvp * vec4(p, 1.);",
    "  gl_Position = cs;",
    "  v_depth = cs.w;",
    // firing sweep: a front crosses the layers, neurons light as it passes
    "  v_act = exp(-pow(u_sweep - a_meta.x, 2.) * 6.5);",
    "  if (a_meta.x > u_last - .5) v_act = min(1., v_act * 1.5);",   // prediction lands
    "  v_col = a_col;",
    "  gl_PointSize = clamp(u_size * u_px * (1. + .42*v_act) * (.35 + .65*v_boot) / max(cs.w, .35), 2., 40.);",
    "}"
  ].join("\n");

  var FRAG_NODE = [
    "precision mediump float;",
    "uniform float u_dark, u_fog0, u_fog1;",
    "varying vec3 v_col; varying float v_act, v_depth, v_boot;",
    "void main(){",
    "  vec2 d = gl_PointCoord - .5;",
    "  float r = length(d) * 2.;",
    "  float core = 1. - smoothstep(.58, .94, r);",
    "  float halo = exp(-r*r*1.7);",
    "  float fog = smoothstep(u_fog1, u_fog0, v_depth);",
    "  float a = (core * (.55 + .45*v_act) + halo * (u_dark > .5 ? .34 : .20) * (.3+.7*v_act)) * fog * v_boot;",
    "  vec3 c = v_col * (u_dark > .5 ? (.85 + .95*v_act) : (.92 + .30*v_act));",
    "  gl_FragColor = vec4(c * a, a);",     // premultiplied
    "}"
  ].join("\n");

  /* Edges are screen-space quads, not gl.LINES: lineWidth is clamped to 1px in
     every modern browser, which leaves hairlines stuck at sub-pixel coverage. */
  var VERT_EDGE = [
    "precision mediump float;",
    "attribute vec3 a_p0; attribute vec3 a_p1; attribute vec3 a_col;",
    "attribute vec2 a_meta; attribute vec2 a_ts;",   // ts.x = along edge, ts.y = side
    "attribute float a_cluster;",
    "uniform mat4 u_mvp; uniform vec2 u_res;",
    "uniform float u_t, u_sweep, u_spread, u_width, u_shift;",
    "varying vec3 v_col; varying float v_depth, v_lit, v_side, v_boot;",
    "void main(){",
    "  v_boot = smoothstep(a_meta.x*.30 + .25, a_meta.x*.30 + 1.35, u_t);",
    "  float s = a_meta.y;",
    "  vec3 drift = vec3(sin(u_t*.55+s*6.3), cos(u_t*.47+s*5.1), sin(u_t*.39+s*7.7)) * .035;",
    "  vec3 pa = a_p0 + drift, pb = a_p1 + drift;",
    "  pa.x += a_cluster * u_spread + u_shift; pb.x += a_cluster * u_spread + u_shift;",
    "  vec4 ca = u_mvp * vec4(pa, 1.), cb = u_mvp * vec4(pb, 1.);",
    "  vec2 na = ca.xy / max(ca.w, .001), nb = cb.xy / max(cb.w, .001);",
    "  vec2 dv = (nb - na) * u_res;",
    "  vec2 dir = length(dv) < .0001 ? vec2(1., 0.) : normalize(dv);",
    "  vec2 nrm = vec2(-dir.y, dir.x) / u_res * u_width;",
    "  vec4 c = mix(ca, cb, a_ts.x);",
    "  vec2 ndc = c.xy / max(c.w, .001) + nrm * a_ts.y;",
    "  gl_Position = vec4(ndc, 0., 1.);",
    "  v_depth = c.w; v_col = a_col; v_side = a_ts.y;",
    "  float l = u_sweep - a_meta.x;",
    "  v_lit = (l > -.15 && l < 1.15) ? sin(clamp(l,0.,1.)*3.14159) : 0.;",
    "}"
  ].join("\n");

  var FRAG_EDGE = [
    "precision mediump float;",
    "uniform float u_dark, u_fog0, u_fog1;",
    "varying vec3 v_col; varying float v_depth, v_lit, v_side, v_boot;",
    "void main(){",
    "  float fog = smoothstep(u_fog1, u_fog0, v_depth);",
    "  float aa = smoothstep(1., .15, abs(v_side));",     // soft edges, no jaggies
    "  float a = ((u_dark > .5 ? .34 : .52) + v_lit * .5) * fog * aa * v_boot;",
    "  vec3 c = v_col * (u_dark > .5 ? (.62 + .9*v_lit) : (.70 + .5*v_lit));",
    "  gl_FragColor = vec4(c * a, a);",
    "}"
  ].join("\n");

  /* signal packets: one point per edge, position interpolated along it in the
     vertex shader, so nothing is uploaded per frame */
  var VERT_PACK = [
    "precision mediump float;",
    "attribute vec3 a_p0; attribute vec3 a_p1; attribute vec3 a_col;",
    "attribute vec2 a_meta;",
    "attribute float a_cluster;",
    "uniform mat4 u_mvp; uniform float u_t, u_sweep, u_size, u_spread, u_px, u_shift;",
    "varying vec3 v_col; varying float v_lit, v_depth, v_boot;",
    "void main(){",
    "  v_boot = smoothstep(a_meta.x*.30 + .6, a_meta.x*.30 + 1.6, u_t);",
    "  float l = u_sweep - a_meta.x;",
    "  float k = clamp(l, 0., 1.);",
    "  vec3 p = mix(a_p0, a_p1, k);",
    "  p.x += a_cluster * u_spread + u_shift;",
    "  float s = a_meta.y;",
    "  p += vec3(sin(u_t*.55+s*6.3), cos(u_t*.47+s*5.1), sin(u_t*.39+s*7.7)) * .035;",
    "  vec4 cs = u_mvp * vec4(p, 1.);",
    "  gl_Position = cs; v_depth = cs.w; v_col = a_col;",
    "  v_lit = (l > 0. && l < 1.) ? sin(l*3.14159) : 0.;",
    "  gl_PointSize = clamp(u_size * u_px * (.45+.55*v_lit) / max(cs.w,.35), 1., 14.);",
    "}"
  ].join("\n");

  var FRAG_PACK = [
    "precision mediump float;",
    "uniform float u_dark, u_fog0, u_fog1;",
    "varying vec3 v_col; varying float v_lit, v_depth, v_boot;",
    "void main(){",
    "  if (v_lit <= .001) discard;",
    "  float r = length(gl_PointCoord - .5) * 2.;",
    "  float core = 1. - smoothstep(.30, .88, r);",
    "  float fog = smoothstep(u_fog1, u_fog0, v_depth);",
    "  float a = core * v_lit * (u_dark > .5 ? .95 : .80) * fog * v_boot;",
    "  gl_FragColor = vec4(v_col * a * (u_dark > .5 ? 1.25 : 1.), a);",
    "}"
  ].join("\n");

  function hex(h) {
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }
  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s) || "compile failed");
    }
    return s;
  }
  function program(gl, vs, fs) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(p) || "link failed");
    }
    return p;
  }

  // deterministic pseudo-random so the graph is identical on every load
  function rng(seed) {
    var s = seed;
    return function () { s = (s * 16807 + 17) % 2147483647; return s / 2147483647; };
  }

  /* ---- the network itself -------------------------------------------------
     Sparse, hand-tuned connectivity: every neuron reaches 2-3 in the next
     layer and none is orphaned. All-to-all reads as noise, not architecture. */
  function buildNet(spec) {
    var rand = rng(spec.seed || 7);
    var L = spec.layers.length, nodes = [], edges = [], byLayer = [];

    for (var i = 0; i < L; i++) {
      var n = spec.layers[i], row = [];
      for (var j = 0; j < n; j++) {
        var y = n === 1 ? 0 : ((j + .5) / n - .5) * spec.spanY;
        row.push(nodes.length);
        nodes.push({
          p: [(L === 1 ? 0 : (i / (L - 1) - .5)) * spec.spanX,
              y + (rand() - .5) * spec.spanY * .06,
              (rand() - .5) * spec.spanZ],
          layer: i, seed: rand(),
          col: spec.palette[i % spec.palette.length]
        });
      }
      byLayer.push(row);
    }

    for (i = 0; i < L - 1; i++) {
      var src = byLayer[i], dst = byLayer[i + 1], hit = {};
      src.forEach(function (a) {
        var order = dst.slice().sort(function (x, y2) {
          return Math.abs(nodes[x].p[1] - nodes[a].p[1]) -
                 Math.abs(nodes[y2].p[1] - nodes[a].p[1]);
        });
        var k = 2 + (rand() < .45 ? 1 : 0);
        order.slice(0, k).forEach(function (b) {
          hit[b] = 1;
          edges.push({ a: a, b: b, layer: i, seed: rand(),
                       col: nodes[b].col });
        });
      });
      dst.forEach(function (b) {                    // nobody is left unconnected
        if (!hit[b]) {
          var a2 = src[Math.floor(rand() * src.length)];
          edges.push({ a: a2, b: b, layer: i, seed: rand(), col: nodes[b].col });
        }
      });
    }
    return { nodes: nodes, edges: edges, depth: L - 1 };
  }

  // 4x4 matrix helpers (column-major, as WebGL wants)
  function mul(a, b) {
    var o = new Float32Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] +
                     a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  }
  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect,0,0,0, 0,f,0,0,
                             0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0]);
  }
  function ortho(w, h, near, far) {
    var nf = 1 / (near - far);
    return new Float32Array([2/w,0,0,0, 0,2/h,0,0, 0,0,2*nf,0, 0,0,(far+near)*nf,1]);
  }
  function trans(x, y, z) {
    return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]);
  }
  function rotY(a) {
    var c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
  }
  function rotX(a) {
    var c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
  }
  function scaleX(sx) {
    return new Float32Array([sx,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  }

  function Field(canvas, opts) {
    var gl = canvas.getContext("webgl", {
      alpha: true, antialias: true, depth: false,
      premultipliedAlpha: true, powerPreference: "low-power"
    });
    if (!gl) throw new Error("no webgl");

    var mobile = Math.min(window.innerWidth, window.innerHeight) < 700;
    var net = buildNet(opts.spec);
    var pal = opts.spec.palette.map(hex);
    var edgeCol = opts.spec.edgeColor ? hex(opts.spec.edgeColor) : null;

    var progs = {
      edge: program(gl, VERT_EDGE, FRAG_EDGE),
      pack: program(gl, VERT_PACK, FRAG_PACK),
      node: program(gl, VERT_NODE, FRAG_NODE)
    };

    // ---- buffers
    function buf(data) {
      var b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
      return b;
    }
    var clusters = opts.spec.clusters || [0];

    var nPos = [], nCol = [], nMeta = [], nClu = [];
    clusters.forEach(function (cx, ci) {
      net.nodes.forEach(function (n) {
        nPos.push(n.p[0], n.p[1], n.p[2]);
        var c = pal[(n.layer + ci) % pal.length];
        if (opts.spec.perCluster) c = pal[ci % pal.length];
        nCol.push(c[0], c[1], c[2]);
        nMeta.push(n.layer, n.seed);
        nClu.push(cx);
      });
    });

    var eP0 = [], eP1 = [], eCol = [], eMeta = [], eClu = [], eTS = [];
    var QUAD = [[0,-1],[0,1],[1,-1], [1,-1],[0,1],[1,1]];
    var pP0 = [], pP1 = [], pCol = [], pMeta = [], pClu = [];
    clusters.forEach(function (cx, ci) {
      net.edges.forEach(function (e) {
        var A = net.nodes[e.a].p, B = net.nodes[e.b].p;
        var c = pal[(e.layer + 1 + ci) % pal.length];
        if (opts.spec.perCluster) c = pal[ci % pal.length];
        var wire = edgeCol || c;                       // line colour vs packet colour
        QUAD.forEach(function (q) {
          eP0.push(A[0],A[1],A[2]); eP1.push(B[0],B[1],B[2]);
          eCol.push(wire[0],wire[1],wire[2]);
          eMeta.push(e.layer, e.seed);
          eTS.push(q[0], q[1]);
          eClu.push(cx);
        });
        pP0.push(A[0],A[1],A[2]); pP1.push(B[0],B[1],B[2]);
        pCol.push(c[0],c[1],c[2]); pMeta.push(e.layer, e.seed); pClu.push(cx);
      });
    });

    var B = {
      nPos: buf(nPos), nCol: buf(nCol), nMeta: buf(nMeta), nClu: buf(nClu),
      eP0: buf(eP0), eP1: buf(eP1), eCol: buf(eCol), eMeta: buf(eMeta),
      eClu: buf(eClu), eTS: buf(eTS),
      pP0: buf(pP0), pP1: buf(pP1), pCol: buf(pCol), pMeta: buf(pMeta), pClu: buf(pClu)
    };
    var nodeCount = nPos.length / 3, edgeVerts = eTS.length / 2, packCount = pP0.length / 3;

    function bind(prog, name, buffer, size) {
      var loc = gl.getAttribLocation(prog, name);
      if (loc < 0) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }
    function uni(prog) {
      var U = {};
      ["u_mvp","u_t","u_sweep","u_size","u_spread","u_px","u_dark","u_fog0","u_fog1",
       "u_last","u_res","u_width","u_shift"]
        .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
      return U;
    }
    var U = { edge: uni(progs.edge), pack: uni(progs.pack), node: uni(progs.node) };

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);   // premultiplied "over"

    var px = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    var w = 0, h = 0, spread = 0, aspect = 1;

    function resize() {
      var r = canvas.getBoundingClientRect();
      var nw = Math.max(2, Math.round(r.width * px));
      var nh = Math.max(2, Math.round(r.height * px));
      if (nw === w && nh === h) return;
      w = nw; h = nh; aspect = w / h;
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
      // clusters must land under their real layout columns, at any width
      if (opts.trackColumns) {
        var oh = opts.orthoH || 3.4, cr = canvas.getBoundingClientRect();
        var perUnit = cr.height / oh;                  // CSS px per world unit
        var cols = [].slice.call(document.querySelectorAll(opts.trackColumns))
          .map(function (el) { var r = el.getBoundingClientRect(); return r.left + r.width / 2; });
        if (cols.length >= 2 && perUnit > 0) {
          var gap = (cols[cols.length - 1] - cols[0]) / (cols.length - 1);
          spread = gap / perUnit;
          var mid = cols.length === 3 ? cols[1] : (cols[0] + cols[cols.length - 1]) / 2;
          shift = (mid - (cr.left + cr.width / 2)) / perUnit;
        } else {
          spread = (aspect / 3) * oh;
        }
      }
    }

    this.ptr = [0, 0];
    this.scroll = 0;
    var shift = 0;
    var self = this;

    this.draw = function (time) {
      resize();
      // A page-hero band is wide and short. Two presets tuned for compact panels fight it:
      // the strong yaw turns the later layers away into depth, and the tight fog then erases
      // them — so the graph reads as half a network shoved left of centre. Face a band more
      // front-on and let its fog reach further back.
      var band = !opts.ortho && aspect > 2.2;
      var yaw = (opts.base || 0) + Math.sin(time * (opts.spin || .05)) * (opts.swing || .34)
                + (opts.ortho ? .18 : .38) * self.ptr[0];
      if (band) yaw *= .42;
      var pitch = (opts.pitch || 0) - .18 * self.ptr[1] + (opts.ortho ? .16 : .10) * self.scroll;
      var model = mul(rotY(yaw), rotX(pitch));
      var proj = opts.ortho
        ? ortho((opts.orthoH || 3.4) * aspect, (opts.orthoH || 3.4), -20, 20)
        : perspective(42 * Math.PI / 180, aspect, .1, 60);
      var dist = (mobile && opts.distMobile) || opts.dist || (mobile ? 6.4 : 5.2);
      // The layer spread runs along X, so the same graph inside a narrow panel (the desktop
      // hero stage, a card) overflows unless the camera pulls back with the aspect ratio.
      if (!opts.ortho && aspect < 1.25) {
        dist *= Math.min(1.35, Math.pow(1.25 / Math.max(.55, aspect), .6));
      }
      var mvp = mul(proj, mul(trans(0, 0, opts.ortho ? 0 : -dist + self.scroll * .35), model));
      // A page-hero band is wide and short (aspect ~5:1): the vertical FOV sets the scale, so
      // the graph fits the height and leaves half the band empty. Widening it in 3D only sends
      // the outer nodes into the depth fog, so stretch the finished image along clip-space X
      // instead — depth, fog and point sizes stay exactly as designed.
      if (band) {
        mvp = mul(scaleX(Math.min(4.2, aspect * .68)), mvp);   // fill scales with the band, since the frustum widens with it too
      }

      var cycle = opts.cycle || 5.5;
      var sweep = ((time % cycle) / cycle) * (net.depth + 1.5) - .55;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      function common(prog, u, size) {
        gl.useProgram(prog);
        gl.uniformMatrix4fv(u.u_mvp, false, mvp);
        gl.uniform1f(u.u_t, time);
        gl.uniform1f(u.u_sweep, sweep);
        gl.uniform1f(u.u_spread, spread);
        gl.uniform1f(u.u_shift, shift);
        gl.uniform1f(u.u_px, px);
        gl.uniform1f(u.u_size, size);
        gl.uniform1f(u.u_last, net.depth);
        gl.uniform1f(u.u_dark, opts.dark ? 1 : 0);
        gl.uniform1f(u.u_fog0, opts.ortho ? .9 : dist - (band ? 3.1 : 1.9));   // near = opaque
        gl.uniform1f(u.u_fog1, opts.ortho ? 0. : dist + (band ? 5.6 : 2.6));  // far  = faded
      }

      common(progs.edge, U.edge, 0);
      gl.uniform2f(U.edge.u_res, w, h);
      gl.uniform1f(U.edge.u_width, (opts.wire || 2.4) * (px / 2));
      bind(progs.edge, "a_p0", B.eP0, 3);
      bind(progs.edge, "a_p1", B.eP1, 3);
      bind(progs.edge, "a_col", B.eCol, 3);
      bind(progs.edge, "a_meta", B.eMeta, 2);
      bind(progs.edge, "a_ts", B.eTS, 2);
      bind(progs.edge, "a_cluster", B.eClu, 1);
      gl.drawArrays(gl.TRIANGLES, 0, edgeVerts);

      common(progs.pack, U.pack, opts.packSize || 7);
      bind(progs.pack, "a_p0", B.pP0, 3);
      bind(progs.pack, "a_p1", B.pP1, 3);
      bind(progs.pack, "a_col", B.pCol, 3);
      bind(progs.pack, "a_meta", B.pMeta, 2);
      bind(progs.pack, "a_cluster", B.pClu, 1);
      gl.drawArrays(gl.POINTS, 0, packCount);

      common(progs.node, U.node, opts.nodeSize || 13);
      bind(progs.node, "a_pos", B.nPos, 3);
      bind(progs.node, "a_col", B.nCol, 3);
      bind(progs.node, "a_meta", B.nMeta, 2);
      bind(progs.node, "a_cluster", B.nClu, 1);
      gl.drawArrays(gl.POINTS, 0, nodeCount);
    };

    this.stats = { nodes: nodeCount, edges: packCount };
  }

  function mobileView() {
    return Math.min(window.innerWidth, window.innerHeight) < 700;
  }

  var CONF = {
    // hero: the signature object. Deep, airy, ink hairlines with warm neurons.
    light: {
      dark: false, dist: 7.0, distMobile: 9.8, spin: .14, swing: .30, base: .52, pitch: -.13,
      cycle: 5.5, nodeSize: 88, packSize: 42, wire: 4.0,
      spec: { layers: [3, 6, 8, 6, 4, 2], spanX: 5.7, spanY: 3.5, spanZ: 1.9, seed: 11,
              edgeColor: "#5c5449",
              palette: ["#cc785c", "#5db8a6", "#c9603f", "#e0a058", "#5db8a6", "#cc785c"] }
    },
    // dark band: same architecture, brighter, reads as instrumentation
    dark: {
      dark: true, dist: 6.6, distMobile: 10.4, spin: .17, swing: .26, base: -.46, pitch: .11,
      cycle: 4.2, nodeSize: 78, packSize: 38, wire: 3.4,
      spec: { layers: [2, 5, 7, 5, 3], spanX: 5.6, spanY: 2.9, spanZ: 1.5, seed: 23,
              palette: ["#e8a55a", "#5db8a6", "#f0916b", "#5db8a6", "#e8a55a"] }
    },
    // subpage hero: one graph, tuned by data-arch / data-accent / data-seed on the canvas
    page: {
      dark: false, dist: 6.4, distMobile: 9.2, spin: .13, swing: .27, base: .47, pitch: -.11,
      cycle: 4.6, nodeSize: 80, packSize: 40, wire: 3.7,
      spec: { layers: [3, 6, 5, 3], spanX: 5.2, spanY: 3.0, spanZ: 1.7, seed: 7,
              edgeColor: "#5c5449",
              palette: ["#cc785c", "#5db8a6", "#e0a058", "#cc785c"] }
    },
    // under the project grid: three tiny nets, one per card, in its own accent
    trio: {
      dark: false, ortho: true, orthoH: 2.5, spin: .1, cycle: 3.6,
      nodeSize: 7.5, packSize: 4, wire: 2.6, trackColumns: ".flag-card", base: .34, swing: .5,
      spec: { layers: [2, 4, 3], spanX: 2.5, spanY: 1.5, spanZ: .8, seed: 5,
              perCluster: true, clusters: [-1, 0, 1],
              palette: ["#c96a44", "#43a794", "#dd9433"] }
    }
  };

  /* "Software that works where bandwidth is scarce" has to apply to this page too:
     phones, data-saver and 2g get the 25 KB poster instead of the 770 KB film. */
  function filmPolicy() {
    var v = document.querySelector(".band-film");
    if (!v) return;
    var c = navigator.connection || {};
    var slow = c.saveData === true || /(^|-)2g/.test(c.effectiveType || "");
    if (mobileView() || slow) {
      var stage = v.parentNode;
      v.removeAttribute("autoplay");
      v.remove();
      if (stage) stage.classList.add("film-poster");
    }
  }

  /* Let markup tune a field: data-arch="3,6,5,3" data-accent="#5db8a6" data-seed="4"
     data-dist="6.8" data-cycle="5". Keeps one engine for the whole site. */
  function tune(conf, el) {
    var arch = el.getAttribute("data-arch");
    var accent = el.getAttribute("data-accent");
    var seed = el.getAttribute("data-seed");
    var dist = el.getAttribute("data-dist");
    var cycle = el.getAttribute("data-cycle");
    if (!arch && !accent && !seed && !dist && !cycle) return conf;

    var out = {}, k;
    for (k in conf) if (conf.hasOwnProperty(k)) out[k] = conf[k];
    out.spec = {};
    for (k in conf.spec) if (conf.spec.hasOwnProperty(k)) out.spec[k] = conf.spec[k];

    if (arch) {
      var layers = arch.split(",").map(function (n) { return Math.max(1, parseInt(n, 10) || 1); });
      if (layers.length >= 2) out.spec.layers = layers;
    }
    if (accent) {
      // accent leads, the two house tones support it, one per layer
      var support = ["#5db8a6", "#e0a058"];
      out.spec.palette = out.spec.layers.map(function (_, i) {
        return i % 2 === 0 ? accent : support[(i >> 1) % 2];
      });
    }
    if (seed) out.spec.seed = parseInt(seed, 10) || out.spec.seed;
    if (dist) out.dist = parseFloat(dist) || out.dist;
    if (cycle) out.cycle = parseFloat(cycle) || out.cycle;
    return out;
  }

  // Module-level state so boot() is re-callable: SPA clients (React/Vue) mount their
  // canvases after DOMContentLoaded and call window.NET_BOOT(). Repeat calls must adopt
  // only new canvases and must never stack a second pointer listener or rAF loop.
  var ALL = [];      // every live field on the page
  var wired = false; // pointer + animation loop attached exactly once
  var io = null;
  var tx = 0, ty = 0;

  // Motion policy. An OS "reduce motion" setting used to freeze the graph on one frame,
  // which reads as a broken site rather than a considered one. Instead we drop to a calm
  // mode: slow drift, no pointer parallax, no scroll dolly, half the frame rate. A visitor
  // can override either way and we remember it.
  function motionPref() {
    try {
      var v = localStorage.getItem("motion");
      if (v === "on") return "full";
      if (v === "off") return "none";
    } catch (e) { /* private mode: fall through to the OS setting */ }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "calm" : "full";
  }
  window.NET_MOTION = motionPref;

  function boot() {
    filmPolicy();
    var nodes = [].slice.call(document.querySelectorAll("canvas[data-field]:not(.gl-on)"));
    if (!nodes.length) return;
    var pref = motionPref();
    var still = pref === "none";
    var calm = pref === "calm";
    var fields = [];

    nodes.forEach(function (c) {
      var kind = c.dataset.field;
      if (kind === "trio" && mobileView()) { c.remove(); return; }  // one GPU context on phones
      try {
        var f = new Field(c, tune(CONF[kind] || CONF.light, c));
        f.node = c; f.live = true;
        fields.push(f); ALL.push(f);
        c.classList.add("gl-on");
        if (window.GL_DEBUG) console.log("field " + kind, f.stats);
      } catch (e) {
        if (window.GL_DEBUG) console.error("field " + kind + ": " + e.message);
      }
    });
    if (!fields.length) return;
    window.NET_FIELDS = ALL.length;

    if (still) { fields.forEach(function (f) { f.draw(1.6); }); return; }

    if (!io) {
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          ALL.forEach(function (f) { if (f.node === e.target) f.live = e.isIntersecting; });
        });
      }, { rootMargin: "120px" });
    }
    fields.forEach(function (f) { io.observe(f.node); });

    if (wired) return;
    wired = true;

    window.addEventListener("pointermove", function (e) {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    // phase offsets so sibling graphs never fire in unison; unknown kinds must not yield NaN
    var OFFSET = { light: 0, dark: 9, trio: 17, page: 4 };
    var start = performance.now(), last = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      if (document.hidden) return;
      if (now - last < 1000 / (calm ? 20 : 40)) return;
      last = now;
      var t = ((now - start) / 1000) * (calm ? .28 : 1);
      ALL.forEach(function (f) {
        if (!f.live) return;
        if (calm) {
          f.ptr[0] = f.ptr[1] = 0; f.scroll = 0;
        } else {
          f.ptr[0] += (tx - f.ptr[0]) * .045;
          f.ptr[1] += (ty - f.ptr[1]) * .045;
          var r = f.node.getBoundingClientRect();
          f.scroll = Math.max(-1, Math.min(1,
            (window.innerHeight * .5 - (r.top + r.height * .5)) / window.innerHeight));
        }
        f.draw(t + (OFFSET[f.node.dataset.field] || 0));
      });
    }
    requestAnimationFrame(frame);
  }

  window.NET_BOOT = boot;  // SPA entry point: call after your canvases are in the DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
