import "./App.css";

import { PoseArtist } from "./draw_utils";
import makePoseDetector, { getModelDetails } from "./PoseDetector";

import React from "react";

var POSE_DETECTOR_MODEL = "movenet";

const isVideoPlaying = (video) =>
  !!(
    video.currentTime > 0 &&
    !video.paused &&
    !video.ended &&
    video.readyState > 2
  );

function RenderPosesSimple({ videoRef, poseDetectorRef }) {
  const onPoses = React.useCallback(
    (poses) => console.log(poses && poses[0] && poses[0].keypoints.length),
    []
  );
  return (
    <>
      <div>Poses Simple</div>
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

function RenderPose({ videoRef, poseDetectorRef }) {
  const canvasRef = React.useRef(null);
  const poseArtist = React.useRef(null);

  React.useEffect(() => {
    if (!poseArtist.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      const [model, modelConfig] = getModelDetails(POSE_DETECTOR_MODEL);
      poseArtist.current = new PoseArtist(ctx, model, modelConfig);
    }
  }, []);

  const drawFunction = React.useCallback(
    async (poses) => {
      if (canvasRef.current && poses && poses.length > 0) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (poseArtist.current) {
          poseArtist.current.drawResults(poses);
        }
      }
    },
    [canvasRef.current, poseArtist.current]
  );

  return (
    <div style={{ border: "1px solid red" }}>
      <div>Hello</div>
      <canvas width={600} height={400} ref={canvasRef}></canvas>
      <button
        onClick={() => {
          if (isVideoPlaying(videoRef.current)) {
            videoRef.current.pause();
            poseDetectorRef.current.removeAllListeners();
          } else {
            if (poseDetectorRef.current) {
              poseDetectorRef.current.removeAllListeners();
              poseDetectorRef.current.on("pose", drawFunction);
            }
            videoRef.current.play();
          }
        }}
      >
        Draw
      </button>
    </div>
  );
}

function MyApp() {
  const videoRef = React.useRef(null);
  const poseDetectorRef = React.useRef(null);

  React.useEffect(() => {
    console.log("here");
    if (videoRef.current && !poseDetectorRef.current) {
      console.log("here2");
      function modelReady() {
        console.log("Model ready");
      }
      const video = videoRef.current;
      const poseDetector = makePoseDetector(
        video,
        { poseDetectorModel: POSE_DETECTOR_MODEL },
        modelReady
      );

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
      <RenderPosesSimple
        videoRef={videoRef}
        poseDetectorRef={poseDetectorRef}
      />
      <RenderPose videoRef={videoRef} poseDetectorRef={poseDetectorRef} />
    </>
  );
}

const FullApp = () => {
  return <MyApp />;
};

export default FullApp;
