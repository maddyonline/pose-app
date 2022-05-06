import logo from "./logo.svg";
import "./App.css";

import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs-core";
// Register WebGL backend.
import "@tensorflow/tfjs-backend-webgl";

import { drawPose } from "./draw_utils";

import React from "react";
import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
} from "recoil";

var poseDetectorModel = "movenet";

const MODEL_BLAZEPOSE = poseDetection.SupportedModels.BlazePose;
const DETECTOR_CONFIG_BLAZEPOSE = {
  runtime: "tfjs",
  enableSmoothing: true,
  modelType: "full",
};
const DETECTOR_CONFIG_MOVENET = {
  modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
};
const MODEL_MOVENET = poseDetection.SupportedModels.MoveNet;

const isVideoPlaying = (video) =>
  !!(
    video.currentTime > 0 &&
    !video.paused &&
    !video.ended &&
    video.readyState > 2
  );

const posesState = atom({
  key: "posesState", // unique ID (with respect to other atoms/selectors)
  default: [], // default value (aka initial value)
});

function usePoseTracker({ videoRef, posesState }) {
  const poseDetector = React.useRef(null);
  const [_, setPoses] = useRecoilState(posesState);

  React.useEffect(() => {
    var rafId;
    const runFrame = async () => {
      if (videoRef.current && poseDetector.current) {
        const poses = await poseDetector.current.estimatePoses(
          videoRef.current,
          { maxPoses: 1, flipHorizontal: false }
        );
        setPoses(poses);
      }
      rafId = requestAnimationFrame(runFrame);
    };
    const start = async () => {
      const model =
        poseDetectorModel === "movenet" ? MODEL_MOVENET : MODEL_BLAZEPOSE;
      const detectorConfig =
        poseDetectorModel === "movenet"
          ? DETECTOR_CONFIG_MOVENET
          : DETECTOR_CONFIG_BLAZEPOSE;

      console.log(
        `creating detector with model ${model} and config ${detectorConfig}`
      );
      const detector = await poseDetection.createDetector(
        model,
        detectorConfig
      );
      poseDetector.current = detector;
      await runFrame();
    };
    start();

    return () => {
      // cleanup
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (poseDetector.current) {
        poseDetector.current.dispose();
      }
    };
  }, []);
}

function RenderPosesSimple() {
  const poses = useRecoilValue(posesState);
  return (
    <>
      {poses && poses.length > 0
        ? `${poses[0].keypoints[0].x}`
        : "nothing to show"}
    </>
  );
}

function RenderPose({ videoRef }) {
  const canvasRef = React.useRef(null);
  const poses = useRecoilValue(posesState);
  React.useEffect(() => {
    // var rafId;
    const draw = async () => {
      if (canvasRef.current && poses && poses.length > 0) {
        drawPose(
          poses[0],
          canvasRef.current.getContext("2d"),
          poseDetection.SupportedModels.BlazePose,
          0
        );
      }
    };
    draw();
    // return () => {
    //   if (rafId) {
    //     cancelAnimationFrame(rafId);
    //   }
    // }
  }, [poses]);

  return (
    <div style={{ border: "1px solid red" }}>
      <div>Hello</div>
      <canvas width={600} height={400} ref={canvasRef}></canvas>
    </div>
  );
}

function MyApp() {
  const videoRef = React.useRef(null);

  usePoseTracker({ videoRef, posesState });

  return (
    <>
      <video width={600} height={400} ref={videoRef} autoPlay>
        <source src="/home-workout.mp4" type="video/mp4" />
      </video>
      <button
        onClick={() => {
          if (isVideoPlaying(videoRef.current)) {
            videoRef.current.pause();
          } else {
            videoRef.current.play();
          }
        }}
      >
        Play/Pause
      </button>
      <RenderPosesSimple />
      <RenderPose videoRef={videoRef} />
    </>
  );
}

export default () => {
  return (
    <RecoilRoot>
      <MyApp />
    </RecoilRoot>
  );
};
