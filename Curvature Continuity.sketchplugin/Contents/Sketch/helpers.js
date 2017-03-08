const radiusKey = 'CurvatureContinuity';

function getConfig(key) {
  var defaults = [NSUserDefaults standardUserDefaults];
  return [defaults objectForKey: '-' + radiusKey + '-' + key];
}

function setConfig(key, value) {
  var defaults = [NSUserDefaults standardUserDefaults],
      configs  = [NSMutableDictionary dictionary];
  [configs setObject: value forKey: '-' + radiusKey + '-' + key]
  return [defaults registerDefaults: configs];
}

function createLabel(text, frame, editable) {
  editable = editable || false;
  var label = [[NSTextField alloc] initWithFrame:frame];
  [label setStringValue:text];
  [label setFont:[NSFont systemFontOfSize:12]];
  [label setBezeled:false];
  [label setDrawsBackground:editable];
  [label setEditable:editable];
  [label setSelectable:editable];
  return label;
}
