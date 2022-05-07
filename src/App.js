import "./App.css";

import { PoseArtist } from "./draw_utils";
import makePoseDetector from "./PoseDetector";

import React from "react";

var POSE_DETECTOR_MODEL = "movenet"; // "blazepose"

const isVideoPlaying = (video) =>
  !!(
    video.currentTime > 0 &&
    !video.paused &&
    !video.ended &&
    video.readyState > 2
  );

function RenderPosesSimple({ poseDetectorRef }) {
  const listener = React.useCallback((poses) => console.log(poses), []);
  React.useEffect(() => {
    poseDetectorRef.addListener("poses", listener);
    return () => poseDetectorRef.removeListener("poses", listener);
  }, []);
  return (
    <>
      <div>Poses Simple</div>
    </>
  );
}

// function RenderPose({ model, modelConfig }) {
//   const canvasRef = React.useRef(null);
//   const poses = useRecoilValue(posesState);
//   const poseArtist = React.useRef(null);

//   React.useEffect(() => {
//     if (!poseArtist.current && canvasRef.current) {
//       const ctx = canvasRef.current.getContext("2d");
//       const [model, modelConfig] = getModelDetails(POSE_DETECTOR_MODEL);
//       poseArtist.current = new PoseArtist(ctx, model, modelConfig);
//     }
//   }, []);

//   React.useEffect(() => {
//     // var rafId;
//     const draw = async () => {
//       if (canvasRef.current && poses && poses.length > 0) {
//         const canvas = canvasRef.current;
//         const ctx = canvas.getContext("2d");
//         ctx.clearRect(0, 0, canvas.width, canvas.height);
//         if (poseArtist.current) {
//           // console.log("drawing..", canvas.width, canvas.height);
//           poseArtist.current.drawResults(poses);
//         }
//         // drawPose(
//         //   poses[0],
//         //   canvasRef.current.getContext("2d"),
//         //   poseDetection.SupportedModels.BlazePose,
//         //   0
//         // );
//       }
//     };
//     draw();
//     // return () => {
//     //   if (rafId) {
//     //     cancelAnimationFrame(rafId);
//     //   }
//     // }
//   }, [poses]);

//   return (
//     <div style={{ border: "1px solid red" }}>
//       <div>Hello</div>
//       <canvas width={600} height={400} ref={canvasRef}></canvas>
//     </div>
//   );
// }

function MyApp() {
  const videoRef = React.useRef(null);
  const poseDetectorRef = React.useRef(null);

  const modelReady = React.useCallback(() => console.log("Model Ready"));
  const onPoses = React.useCallback((poses) =>
    console.log("poses", poses && poses.length)
  );
  const onPoses2 = React.useCallback((poses) =>
    console.log("poses", poses && poses[0].keypoints)
  );

  React.useEffect(() => {
    console.log("here");
    if (videoRef.current && !poseDetectorRef.current) {
      console.log("here2");
      const video = videoRef.current;
      const poseDetector = makePoseDetector(video, modelReady);

      poseDetectorRef.current = poseDetector;
      window.poseDetectorRef = poseDetectorRef;
    }
    return () =>
      poseDetectorRef.current && poseDetectorRef.current.removeAllListeners();
  }, [videoRef.current]);

  return (
    <>
      <video width={600} height={400} ref={videoRef} autoPlay>
        <source src="/home-workout.mp4" type="video/mp4" />
      </video>
      <button
        onClick={() => {
          if (isVideoPlaying(videoRef.current)) {
            videoRef.current.pause();
            poseDetectorRef.current.removeAllListeners();
          } else {
            if (poseDetectorRef.current) {
              poseDetectorRef.current.removeAllListeners();
              poseDetectorRef.current.on("pose", onPoses);
            }
            videoRef.current.play();
          }
        }}
      >
        Play/Pause
      </button>
    </>
  );
}

const FullApp = () => {
  return <MyApp />;
};

export default FullApp;
