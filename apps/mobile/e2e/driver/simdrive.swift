// simdrive: drives the iOS Simulator through macOS Accessibility. It needs the
// Accessibility permission for the terminal app, with no other installs.
// Usage: swift simdrive.swift <command> [args]
//   check                      -> prints "ok" when trusted and Simulator is running
//   find <id>                  -> exit 0 if an element with AXIdentifier==id (or label==id) exists
//   tap <id>                   -> AXPress the element (falls back to a centre click)
//   value <id>                 -> prints the element's value/label
//   enabled <id>               -> prints "true"/"false"
//   tree                       -> dumps identifiers/labels (debugging)
// Text input: the runner copies text with `simctl pbcopy`, taps the field, then runs `paste`.
//   paste                      -> sends Cmd+V to the Simulator
import Cocoa

func fail(_ m: String, _ code: Int32 = 2) -> Never { FileHandle.standardError.write((m + "\n").data(using: .utf8)!); exit(code) }
guard AXIsProcessTrusted() else { fail("Accessibility permission missing for this terminal", 3) }
guard let sim = NSRunningApplication.runningApplications(withBundleIdentifier: "com.apple.iphonesimulator").first else { fail("Simulator not running", 4) }

let root = AXUIElementCreateApplication(sim.processIdentifier)
func attr(_ e: AXUIElement, _ a: String) -> AnyObject? { var v: AnyObject?; AXUIElementCopyAttributeValue(e, a as CFString, &v); return v }
func str(_ e: AXUIElement, _ a: String) -> String? { attr(e, a) as? String }
func children(_ e: AXUIElement) -> [AXUIElement] { (attr(e, "AXChildren") as? [AXUIElement]) ?? [] }

func glob(_ pat: String, _ s: String) -> Bool {
  if !pat.contains("*") { return pat == s }
  let parts = pat.components(separatedBy: "*")
  return s.hasPrefix(parts.first!) && s.hasSuffix(parts.last!) && s.count >= parts.first!.count + parts.last!.count
}
func search(_ e: AXUIElement, _ id: String, _ depth: Int = 0) -> AXUIElement? {
  if depth > 80 { return nil }
  if let ax = str(e, "AXIdentifier"), glob(id, ax) { return e }
  for c in children(e) { if let f = search(c, id, depth + 1) { return f } }
  return nil
}
func searchLabel(_ e: AXUIElement, _ label: String, _ depth: Int = 0) -> AXUIElement? {
  if depth > 80 { return nil }
  if str(e, "AXLabel") == label || str(e, "AXDescription") == label || str(e, "AXTitle") == label { return e }
  for c in children(e) { if let f = searchLabel(c, label, depth + 1) { return f } }
  return nil
}
func find(_ id: String) -> AXUIElement? { search(root, id) ?? searchLabel(root, id) }

func centreClick(_ e: AXUIElement) {
  var p = CGPoint.zero, s = CGSize.zero
  if let pv = attr(e, "AXPosition") { AXValueGetValue(pv as! AXValue, .cgPoint, &p) }
  if let sv = attr(e, "AXSize") { AXValueGetValue(sv as! AXValue, .cgSize, &s) }
  let c = CGPoint(x: p.x + s.width / 2, y: p.y + s.height / 2)
  for t in [CGEventType.leftMouseDown, .leftMouseUp] { CGEvent(mouseEventSource: nil, mouseType: t, mouseCursorPosition: c, mouseButton: .left)?.post(tap: .cghidEventTap); usleep(60_000) }
}

let args = CommandLine.arguments.dropFirst()
guard let cmd = args.first else { fail("missing command") }
let target = args.dropFirst().first ?? ""
switch cmd {
case "check": print("ok")
case "find": exit(find(target) == nil ? 1 : 0)
case "tap":
  guard let e = find(target) else { fail("not found: " + target, 1) }
  sim.activate()
  if AXUIElementPerformAction(e, "AXPress" as CFString) != .success { centreClick(e) }
case "value":
  guard let e = find(target) else { fail("not found: " + target, 1) }
  print((attr(e, "AXValue") as? String) ?? str(e, "AXLabel") ?? str(e, "AXDescription") ?? "")
case "enabled":
  guard let e = find(target) else { fail("not found: " + target, 1) }
  print(((attr(e, "AXEnabled") as? Bool) ?? true) ? "true" : "false")
case "paste":
  sim.activate(); usleep(150_000)
  let src = CGEventSource(stateID: .hidSystemState)
  for down in [true, false] { let ev = CGEvent(keyboardEventSource: src, virtualKey: 9, keyDown: down); ev?.flags = .maskCommand; ev?.post(tap: .cghidEventTap); usleep(50_000) }
case "tree":
  func dump(_ e: AXUIElement, _ d: Int) { if d > 60 { return }
    let id = str(e, "AXIdentifier") ?? "", l = str(e, "AXLabel") ?? str(e, "AXDescription") ?? ""
    if !id.isEmpty || !l.isEmpty { print(String(repeating: " ", count: d) + "[\(id)] \(l)") }
    for c in children(e) { dump(c, d + 1) } }
  dump(root, 0)
default: fail("unknown command " + cmd)
}
