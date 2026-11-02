import Vision; import AppKit
let img = NSImage(contentsOfFile: CommandLine.arguments[1])!.cgImage(forProposedRect:nil,context:nil,hints:nil)!
let r = VNRecognizeTextRequest(); r.recognitionLevel = .accurate
try! VNImageRequestHandler(cgImage: img).perform([r])
for o in r.results ?? [] { print(o.topCandidates(1).first!.string) }
