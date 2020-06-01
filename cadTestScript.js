

//--------------------------------------Constants + Init, etc-------------------------------------


function init() {
  workSpace = document.getElementById('workSpace');

  //zoom and pan
  viewBox = {
    x:0,
    y:0,
    w:workSpace.clientWidth,
    h:workSpace.clientHeight
  };
  setViewBox(viewBox);
  originalSize = {w:workSpace.clientWidth, h:workSpace.clientHeight};
  scale = originalSize.w / viewBox.w;
  shift = {x:0, y:0};
  document.getElementById('scale').innerHTML = ('scale ' + scale);
  panCheck = false;
  startPan = {x:0, y:0};

  //tool palette
  (function() {
    var divs = document.getElementsByClassName("toolBox");
    for (var i=0; i<divs.length; i++) {
      divs[i].style.display = "none";
    }
    divs[0].style.display = "inline";
  })();

  //for selecting which tool is active
  activeTool = null;
  toolType = null;
  drawCheck = false;

  //layer stuff
  layers = document.getElementById('layers');
  temp = document.getElementById('_temp');
  layerSelect = document.getElementById("layerSelect");
  layerName = 'default';
  updateLayers();
  lineWeightSelect = document.getElementById("lineWeightSelect");
  lineTypeSelect = document.getElementById("lineTypeSelect");
}
init();

function hideUnderlay () {
  document.getElementById("underlay").style.zIndex = "-1";
}

//tracks mouse movements
document.onmousemove = getCursorXY;
function getCursorXY(e) {
   x_client = (window.Event) ? e.pageX : event.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);
   y_client = (window.Event) ? e.pageY : event.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);
   document.getElementById('xymouse').innerHTML = ('xymouse ' + x_client + ' ' + y_client);

   document.getElementById('shift').innerHTML = ('shift ' + Math.round(shift.x) + ' ' + Math.round(shift.y));

   x = shift.x + x_client / scale;
   y = shift.y + y_client / scale;

   document.getElementById('xym_actual').innerHTML = ('xym_actual ' + Math.round(x) + ' ' + Math.round(y));

   document.getElementById('scale').innerHTML = ('scale ' + scale);
 }


//----------------------------------onmouse functions--------------------------------------


workSpace.onclick = function(e) {
  if (toolType == 'draw') {
    drawStart(e);
  }
}
workSpace.onmousedown = function(e) {
  panStart(e);
}
workSpace.onmousemove = function(e) {
  if (panCheck) panMove(e);
  if (drawCheck) {
    drawMove(e);
  }
}
workSpace.onmouseup = function(e) {
  panEnd(e);
}
workSpace.onmouseleave = function(e) {
  panCheck = false;
  drawCheck = false;
}

//-------------------------------------------Tool Palette-------------------------------------


//hides all tool palettes and show the selected one
function changeToolPalette(target) {
  var divs = document.getElementsByClassName("toolBox");
  for (var i=0; i<divs.length; i++) {
    divs[i].style.display = "none";
  }
  var palette = target + "Palette"
  document.getElementById(palette).style.display = "inline";
}

function selectTool(target) {
  activeTool = target;
  drawCheck = false;
  if (target == 'circle' ||
      target == 'rect' ||
      target == 'line'
  )toolType = 'draw';
}


//---------------------------------------------layers---------------------------------------------


function newLayer() {
  layerName = prompt("Enter name for new layer:");
  if (layerName != null && layerName != "") {
    var newLayer = document.createElementNS("http://www.w3.org/2000/svg","g");
    newLayer.setAttribute("data-layer", layerName);
    newLayer.setAttribute("style", "stroke:black; stroke-width:0.5; fill:gray; fill-opacity:50%;");
    layers.appendChild(newLayer);

    updateLayers();
  }
}
function updateLayers() {
  for (var i=layerSelect.options.length; i>=0; i--) {
    layerSelect.options[i] = null;
  }
  for (var i=layers.children.length-1; i>=0; i--){
    let c = document.createElement("option");
    let s = layers.children[i].getAttribute("data-layer");
    if (s.charAt(0) != "-") {
      c.text = s;
      layerSelect.options.add(c, 0);
    }
  }
  layer = layers.querySelectorAll("[data-layer='" + layerName + "']")[0];
}
layerSelect.onchange = function() {
  layerName = layerSelect.value;
  layer = layers.querySelectorAll("[data-layer='" + layerName + "']")[0];
}

function layerColor(type) {
  alertDefault();
  input = document.getElementById("layerColorInput");
  input.click();
  document.getElementById("underlay").style.zIndex = "1";

  if (type == "stroke") {
    input.oninput = function() {
      layer.style.stroke = input.value;
    }
  }
  else if (type == "fill") {
    input.oninput = function() {
      layer.style.fill = input.value;
    }
  }

}
lineWeightSelect.onchange = function() {
  var lineWeight = lineWeightSelect.value;
  layer.style.strokeWidth = lineWeight;
}
lineTypeSelect.onchange = function() {
  var lineType = lineTypeSelect.value;
  layer.style.strokeDasharray = lineType;
}
function alertDefault() {
  if (layer.dataset.layer == "default2") {
    alert("Can't change default layer attributes.");
  }
}


//-----------------------------------Zoom/Pan Tools-------------------------------------------


//zooming
workSpace.addEventListener("wheel", zoom, false);
function zoom(e) {
  var e = window.event || e; // old IE support
  var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
  var dw = viewBox.w * Math.sign(delta)*0.15;
  var dh = viewBox.h * Math.sign(delta)*0.15;
  var dx = dw * x_client / originalSize.w;
  var dy = dh * y_client / originalSize.h;

  viewBox = {
    x:viewBox.x + dx,
    y:viewBox.y + dy,
    w:viewBox.w - dw,
    h:viewBox.h - dh,
  }
  scale = originalSize.w / viewBox.w;
  shift.x += dx;
  shift.y += dy;
  setViewBox(viewBox);
}

//panning
function panStart(e) {
  e.preventDefault();
  if (e.button == 1){
    startPan = {x:e.x, y:e.y};
    panCheck = true;
  }
}
  function panMove(e) {
    endPan = {x:e.x, y:e.y};
    var dx = (startPan.x - endPan.x) / scale;
    var dy = (startPan.y - endPan.y) / scale;
    shift.x += dx;
    shift.y += dy;
    viewBox = {
      x:viewBox.x + dx,
      y:viewBox.y + dy,
      w:viewBox.w,
      h:viewBox.h,
    }
    setViewBox(viewBox);
    startPan = endPan;
  }
function panEnd(e) {
  e.preventDefault();
  if (e.button == 1){
    if (panCheck) {
      endPan = {x:e.x, y:e.y};
      var dx = (startPan.x - endPan.x) / scale;
      var dy = (startPan.y - endPan.y) / scale;
      shift.x += dx;
      shift.y += dy;

      viewBox = {
        x:viewBox.x + dx,
        y:viewBox.y + dy,
        w:viewBox.w,
        h:viewBox.h,
      }
      setViewBox(viewBox);
      startPan = endPan;
      panCheck = false;
    }
  }
}

//applying pan/zooom
function setViewBox(box) {
  workSpace.viewBox.baseVal.x = Math.round(box.x);
  workSpace.viewBox.baseVal.y = Math.round(box.y);
  workSpace.viewBox.baseVal.width = Math.round(box.w);
  workSpace.viewBox.baseVal.height = Math.round(box.h);
}


// -----------------------------------------Shape Tools----------------------------------------


//checks when to draw and directs to proper function
function drawStart(e) {
  if (!drawCheck) {
    start = {x:0, y:0};
    start.x = x;
    start.y = y;
    drawCheck = true;
  }
  else {
    drawCheck = false;
    layer.appendChild(tempShape);
  }
}
function drawMove() {
  window[activeTool]();
}

function circle() {
  var dx = start.x - x;
  var dy = start.y - y;
  var radius = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

  tempShape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  tempShape.setAttribute("cx", start.x);
  tempShape.setAttribute("cy", start.y);
  tempShape.setAttribute("r", radius);
  temp.appendChild(tempShape);

  for (var i=0; i<temp.children.length-1; i++) {
    temp.removeChild(temp.childNodes[i]);
  }
}

function rect() {
  var dx = x - start.x;
  var dy = y - start.y;

  tempShape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  if (dx > 0) {
    tempShape.setAttribute("x", start.x);
    tempShape.setAttribute("width", dx);
  }
  else {
    tempShape.setAttribute("x", x);
    tempShape.setAttribute("width", -dx);
  }
  if (dy > 0) {
    tempShape.setAttribute("y", start.y);
    tempShape.setAttribute("height", dy);
  }
  else {
    tempShape.setAttribute("y", y);
    tempShape.setAttribute("height", -dy);
  }
  temp.appendChild(tempShape);

  for (var i=0; i<temp.children.length-1; i++) {
    temp.removeChild(temp.childNodes[i]);
  }
}

function line() {
  tempShape = document.createElementNS("http://www.w3.org/2000/svg", "line");
  tempShape.setAttribute("x1", start.x);
  tempShape.setAttribute("y1", start.y);
  tempShape.setAttribute("x2", x);
  tempShape.setAttribute("y2", y);
  temp.appendChild(tempShape);

  for (var i=0; i<temp.children.length-1; i++) {
    temp.removeChild(temp.childNodes[i]);
  }
}


//-----------------------------------selection tools----------------------------------------------


function select() {
  var x = event.srcElement;
  var strokeWidth = window.getComputedStyle(x)['stroke-width'];

}


//---------------------------------saving/loading functions------------------------------------


//moves data to the hidden div
function showSaveData() {
  var saveData = document.getElementById('saveData');
  saveData.innerText = workSpace.innerHTML;
  if (saveData.style.display == 'none') {
    saveData.style.display = '';
  }
  else saveData.style.display = 'none';
}
//exports data to 'data.txt'
function saveData(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(workSpace.innerHTML));
    element.setAttribute('download', 'data.txt');

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
//loads data from .txt
function loadData() {
  var data = prompt("Enter your save data");
  if (data != null && data != ""){
    workSpace.innerHTML = data;
    init();
  }
}

function openFile() {
  var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.multiple = false;

  input.onchange = e => {
    var file = e.target.files[0];
    let reader = new FileReader();
    reader.onload = function(event) {
      var data = event.target.result;
      workSpace.innerHTML = data;
      init();
    };
    reader.readAsText(file);
  }
  input.click();
}
