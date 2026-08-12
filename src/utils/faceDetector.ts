import {
    FilesetResolver,
    FaceDetector
} from "@mediapipe/tasks-vision";

let detector: FaceDetector | null = null;

export async function loadFaceDetector() {

    if (detector) return detector;

    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
    );

    detector = await FaceDetector.createFromOptions(
        vision,
        {
            baseOptions: {
                modelAssetPath:
                    "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite"
            },
            runningMode: "VIDEO"
        }
    );

    return detector;
}