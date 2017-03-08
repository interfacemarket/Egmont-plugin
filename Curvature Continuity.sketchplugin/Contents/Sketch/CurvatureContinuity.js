@import 'helpers.js'

var onRun = function(context) {
  // global vars
  con = context;
  doc = context.document;

  // selection
  var selection = context.selection;
  var count = selection.count();
  var newSelection = [];

  if(count < 1) {
    doc.showMessage('Select a shape to edit.');
    return;
  }
  var radius = null;
  for(var i = 0; i < count; i++) {
    // check if it's a shape
    if(selection[i].className() == 'MSShapeGroup') {
      // get the index of selected layer
      var layers = selection[i].parentGroup().layers();
      var index = null;
      for(var j = 0; j < layers.length; j++) {
        if(selection[i].isEqual(layers[j])) {
          index = j;
          break;
        }
      }
      if(index == null) {
        doc.showMessage('Layer was not found. Please try again.');
        return;
      }
      // get shape frame and radius
      var initialShape = layers[index];
      var shapeFrame = initialShape.frame();
      if(!radius) {
        var settings = showDialog("Curvature Continuity");
      }
      if(settings[0] == 1000) {
        radius = settings[1];
        var shape = makeShape(shapeFrame, radius);
        var styledShape = styleShape(initialShape, shape);
        // replace selected shape with the new one
        selection[i].parentGroup().addLayers([styledShape]);
        selection[i].parentGroup().removeLayer(selection[i]);
        var shapeIndex = layers.length-1;
        layers[shapeIndex].select_byExpandingSelection(true,false);
        while(shapeIndex-- > index) {
          sendAction('moveBackward:');
        }
      }
    }
    else {
      // in case that artboard or text layer is selected
      doc.showMessage('Select a shape.');
    }
  }
}

// Calls menu command to arrange layers
function sendAction(command) {
  try {
    [NSApp sendAction:command to:nil from:doc];
  } catch(err) {
    log(err);
  }
};

function showDialog(title) {
  var configs = getConfig('radius');

  var viewBox = [[NSView alloc] initWithFrame:NSMakeRect(0,0,295,66)];
  var description = createLabel("Enter needed corner radius. You can specify a different value for each corner by using /.", NSMakeRect(0,30,295,40), false)];
  [description setFont:[NSFont systemFontOfSize:12]];
  [viewBox addSubview:description];

  //var inputRadius = createLabel(configs || "0", NSMakeRect(2,0,294,22), true);
  var inputRadius = NSTextField.alloc().initWithFrame(NSMakeRect(0,4,294,22));
  [viewBox addSubview:inputRadius];

  var alert = [[NSAlert alloc] init];

  var iconName = 'Icon.icns';
  var imageFilePath = con.command.pluginBundle().url().URLByAppendingPathComponent("/Contents/Resources/" + iconName).path();
  var icon = NSImage.alloc().initByReferencingFile(imageFilePath);
  alert.setIcon(icon);

  [alert setMessageText:title];
  [alert addButtonWithTitle:"Apply"];
  [alert addButtonWithTitle:"Cancel"];
  [alert setAccessoryView:viewBox];

  var responceCode = [alert runModal];

  var userInput = inputRadius.stringValue().replace(/[^0-9.,./]/g, '');
  var radiusSplit = userInput.split('/');
  var radius = [];

  switch(radiusSplit.length) {
    case 1:
      radius = [radiusSplit[0], radiusSplit[0], radiusSplit[0], radiusSplit[0]];
      break;
    case 2:
      radius = [radiusSplit[0], radiusSplit[1], radiusSplit[1], radiusSplit[1]];
      break;
    case 3:
      radius = [radiusSplit[0], radiusSplit[1], radiusSplit[2], radiusSplit[2]];
      break;
    default:
      radius = [radiusSplit[0], radiusSplit[1], radiusSplit[2], radiusSplit[3]];
  }
  setConfig('radius', userInput);

  return new Array(responceCode, radius);
}

function topLeftX(x) {
	return originX + x;
}
function topLeftY(y) {
  return originY + y;
}
function topRightX(x) {
  return originX + width - x;
}
function topRightY(y) {
  return originY + y;
}
function bottomRightX(x) {
  return originX + width - x;
}
function bottomRightY(y) {
  return originY + height - y;
}
function bottomLeftX(x) {
  return originX + x;
}
function bottomLeftY(y) {
  return originY + height - y;
}

function makeShape(frame, radius) {
  originX = frame.x();
  originY = frame.y();
  width = frame.width();
  height = frame.height();

  var limit = Math.min(width, height) / 2;
  for(var i= 0; i < radius.length; i++) {
    radius[i] = Math.max((Math.min(radius[i], limit)), 0);
  }

  var magicNumber = 1.64864;
  var path = NSBezierPath.bezierPath();

  path.moveToPoint(NSMakePoint(topRightX(radius[1]), topRightY(0.0)));
  if(radius[1] != 0) {
    [path
      curveToPoint:NSMakePoint(topRightX(0.0), topRightY(radius[1]))
      controlPoint1:NSMakePoint((topRightX(radius[1]) + (radius[1] / magicNumber)), topRightY(0.0))
      controlPoint2:NSMakePoint(topRightX(0.0), (topRightY(radius[1]) - (radius[1] / magicNumber)))
    ];
  }
  path.lineToPoint(NSMakePoint(bottomRightX(0.0), bottomRightY(radius[2])));
  if(radius[2] != 0) {
    [path
      curveToPoint:NSMakePoint(bottomRightX(radius[2]), bottomRightY(0.0))
      controlPoint1:NSMakePoint(bottomRightX(0.0), (bottomRightY(radius[2]) + (radius[2] / magicNumber)))
      controlPoint2:NSMakePoint((bottomRightX(radius[2]) + (radius[2] / magicNumber)), bottomRightY(0.0))
    ];
  }
  path.lineToPoint(NSMakePoint(bottomLeftX(radius[3]), bottomLeftY(0.0)));
  if(radius[3] != 0) {
    [path
      curveToPoint:NSMakePoint(bottomLeftX(0.0), bottomLeftY(radius[3]))
      controlPoint1:NSMakePoint((bottomLeftX(radius[3]) - (radius[3] / magicNumber)), bottomLeftY(0.0))
      controlPoint2:NSMakePoint(bottomLeftX(0.0), (bottomLeftY(radius[3]) + (radius[3] / magicNumber)))
    ];
  }
  path.lineToPoint(NSMakePoint(topLeftX(0.0), topLeftY(radius[0])));
  if(radius[0] != 0) {
    [path
      curveToPoint:NSMakePoint(topLeftX(radius[0]), topLeftY(0.0))
      controlPoint1:NSMakePoint(topLeftX(0.0), (topLeftY(radius[0]) - (radius[0] / magicNumber)))
      controlPoint2:NSMakePoint((topLeftX(radius[0]) - (radius[0] / magicNumber)), topLeftY(0.0))
    ];
  }
  path.closePath();

  return MSShapeGroup.shapeWithBezierPath(path);
}

function styleShape(initialShape, shape) {
  // copy properties
  shape.setName(initialShape.name());
  shape.rotation = initialShape.rotation();

  // flips
  shape.setIsFlippedHorizontal(initialShape.isFlippedHorizontal());
  shape.setIsFlippedVertical(initialShape.isFlippedVertical());

  // styles
  var shapeStyle = initialShape.style();
  // fills, borders and shadows
  var fills = shapeStyle.fills();
  for(var i = 0; i < fills.count(); i++) {
    var initialFill = fills[i];
    var fill = shape.style().addStylePartOfType(0); // fill
    fill.isEnabled = initialFill.isEnabled();
    fill.fillType = initialFill.fillType();
    fill.color = initialFill.color();
    fill.gradient = initialFill.gradient();
    fill.image = initialFill.image();
    fill.noiseIntensity = initialFill.noiseIntensity();
    fill.patternFillType = initialFill.patternFillType();
    var contextSettings = initialFill.contextSettings();
    fill.contextSettings().opacity = contextSettings.opacity();
    fill.contextSettings().blendMode = contextSettings.blendMode();
  }
  var borders = shapeStyle.borders();
  for(var i = 0; i < borders.count(); i++) {
    var initialBorder = borders[i];
    var border = shape.style().addStylePartOfType(1); // border
    border.isEnabled = initialBorder.isEnabled();
    border.thickness = initialBorder.thickness();
    border.color = initialBorder.color();
    border.fillType = initialBorder.fillType();
    border.gradient = initialBorder.gradient();
    var contextSettings = initialBorder.contextSettings();
    border.contextSettings().opacity = contextSettings.opacity();
    border.contextSettings().blendMode = contextSettings.blendMode();
  }
  var shadows = shapeStyle.shadows();
  for(var i = 0; i < shadows.count(); i++) {
    var initialShadow = shadows[i];
    var shadow = shape.style().addStylePartOfType(2); // shadow
    shadow.isEnabled = initialShadow.isEnabled();
    shadow.color = initialShadow.color();
    shadow.offsetX = initialShadow.offsetX();
    shadow.offsetY = initialShadow.offsetY();
    shadow.blurRadius = initialShadow.blurRadius();
    shadow.spread = initialShadow.spread();
    var contextSettings = initialShadow.contextSettings();
    shadow.contextSettings().opacity = contextSettings.opacity();
    shadow.contextSettings().blendMode = contextSettings.blendMode();
  }
  var innerShadows = shapeStyle.innerShadows();
  for(var i = 0; i < innerShadows.count(); i++) {
    var initialInnerShadow = innerShadows[i];
    var innerShadow = shape.style().addStylePartOfType(3) // inner shadow
    innerShadow.isEnabled = initialInnerShadow.isEnabled();
    innerShadow.color = initialInnerShadow.color();
    innerShadow.offsetX = initialInnerShadow.offsetX();
    innerShadow.offsetY = initialInnerShadow.offsetY();
    innerShadow.blurRadius = initialInnerShadow.blurRadius();
    innerShadow.spread = initialInnerShadow.spread();
    var contextSettings = initialInnerShadow.contextSettings();
    innerShadow.contextSettings().opacity = contextSettings.opacity();
    innerShadow.contextSettings().blendMode = contextSettings.blendMode();
  }

  // context settings
  var contextSettings = shapeStyle.contextSettings();
  shape.style().contextSettings().opacity = contextSettings.opacity();
  shape.style().contextSettings().blendMode = contextSettings.blendMode();
  
  return shape;
}
