import "./App.css";

import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs-core";
// Register WebGL backend.
import "@tensorflow/tfjs-backend-webgl";

import { PoseArtist } from "./draw_utils";

import React from "react";
import { RecoilRoot, atom, useRecoilState, useRecoilValue } from "recoil";

var POSE_DETECTOR_MODEL = "movenet"; // "blazepose"

function getModelDetails(poseDetectorModel) {
  const model =
    poseDetectorModel === "movenet"
      ? poseDetection.SupportedModels.MoveNet
      : poseDetection.SupportedModels.BlazePose;
  const modelConfig =
    poseDetectorModel === "movenet"
      ? {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        }
      : {
          runtime: "tfjs",
          enableSmoothing: true,
          modelType: "full",
        };
  return [model, modelConfig];
}

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
      const [model, modelConfig] = getModelDetails(POSE_DETECTOR_MODEL);
      console.log(
        `creating detector with model ${model} and config ${JSON.stringify(
          modelConfig
        )}`
      );
      const detector = await poseDetection.createDetector(model, modelConfig);
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
  }, [setPoses, videoRef]);
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

function RenderPose({ model, modelConfig }) {
  const canvasRef = React.useRef(null);
  const poses = useRecoilValue(posesState);
  const poseArtist = React.useRef(null);

  React.useEffect(() => {
    if (!poseArtist.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      const [model, modelConfig] = getModelDetails(POSE_DETECTOR_MODEL);
      poseArtist.current = new PoseArtist(ctx, model, modelConfig);
    }
  }, []);

  React.useEffect(() => {
    // var rafId;
    const draw = async () => {
      if (canvasRef.current && poses && poses.length > 0) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (poseArtist.current) {
          // console.log("drawing..", canvas.width, canvas.height);
          poseArtist.current.drawResults(poses);
        }
        // drawPose(
        //   poses[0],
        //   canvasRef.current.getContext("2d"),
        //   poseDetection.SupportedModels.BlazePose,
        //   0
        // );
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

const FullApp = () => {
  return (
    <RecoilRoot>
      <MyApp />
    </RecoilRoot>
  );
};

export default FullApp;
