import Foundation
import Vision
import ImageIO

struct OcrObservation: Codable {
    let text: String
    let confidence: Float
    let x: Double
    let y: Double
    let width: Double
    let height: Double
}

struct OcrResult: Codable {
    let text: String
    let observations: [OcrObservation]
}

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(Data(message.utf8))
    exit(1)
}

guard CommandLine.arguments.count >= 2 else {
    fail("image path is required")
}

let imageUrl = URL(fileURLWithPath: CommandLine.arguments[1])

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true
request.minimumTextHeight = 0.005

let handler = VNImageRequestHandler(url: imageUrl, options: [:])
do {
    try handler.perform([request])
} catch {
    let nsError = error as NSError
    fail("vision OCR failed: \(error.localizedDescription) \(nsError.userInfo)")
}

let observations = (request.results ?? [])
    .compactMap { item -> OcrObservation? in
        guard let candidate = item.topCandidates(1).first else { return nil }
        let box = item.boundingBox
        return OcrObservation(
            text: candidate.string,
            confidence: candidate.confidence,
            x: box.origin.x,
            y: box.origin.y,
            width: box.size.width,
            height: box.size.height
        )
    }
    .sorted {
        let dy = abs($0.y - $1.y)
        if dy > 0.012 { return $0.y > $1.y }
        return $0.x < $1.x
    }

let result = OcrResult(
    text: observations.map { $0.text }.joined(separator: "\n"),
    observations: observations
)

let encoder = JSONEncoder()
encoder.outputFormatting = [.withoutEscapingSlashes]
let data = try encoder.encode(result)
FileHandle.standardOutput.write(data)
