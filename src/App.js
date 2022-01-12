import logo from './logo.svg';
import './App.css';

import * as mpPose from '@mediapipe/pose';
import * as posedetection from '@tensorflow-models/pose-detection';
import { drawPose } from './draw_utils';

import React from 'react';
import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
} from 'recoil';

const isVideoPlaying = video => !!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2);


const posesState = atom({
  key: 'posesState', // unique ID (with respect to other atoms/selectors)
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
          { maxPoses: 1, flipHorizontal: false });
        setPoses(poses);
      }
      rafId = requestAnimationFrame(runFrame);
    }
    const start = async () => {
      console.log("initializing mediapose", mpPose.VERSION)
      poseDetector.current = await posedetection.createDetector(posedetection.SupportedModels.BlazePose, {
        runtime: 'mediapipe',
        modelType: 'heavy',
        solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${mpPose.VERSION}`
      });
      await runFrame();

    }
    start();

    return () => {
      // cleanup
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (poseDetector.current) {
        poseDetector.current.dispose();
      }
    }
  }, [])


}


function RenderPosesSimple() {
  const poses = useRecoilValue(posesState);
  return <>
    {poses && poses.length > 0 ? `${poses[0].keypoints[0].x}` : "nothing to show"}
  </>
}

function RenderPose({ videoRef }) {
  const canvasRef = React.useRef(null);
  const poses = useRecoilValue(posesState);
  React.useEffect(() => {
    // var rafId;
    const draw = async () => {
      if (canvasRef.current && poses && poses.length > 0) {
        if (videoRef.current) {
          // canvasRef.current.getContext('2d').drawImage(
          //   videoRef.current, 0, 0, videoRef.current.videoWidth, 225);

        }
        drawPose(
          poses[0],
          canvasRef.current.getContext('2d'),
          posedetection.SupportedModels.BlazePose,
          0)
      }

    }
    draw();
    // return () => {
    //   if (rafId) {
    //     cancelAnimationFrame(rafId);
    //   }
    // }

  }, [poses])

  return <div style={{ border: "1px solid red" }}>
    <div>Hello</div>
    <canvas ref={canvasRef}></canvas>
  </div>
}

function MyApp() {
  const videoRef = React.useRef(null);

  usePoseTracker({ videoRef, posesState })

  return <>
    <video ref={videoRef} autoPlay>
      <source src="/home-workout.mp4" type="video/mp4" />
    </video>
    <button onClick={() => {
      if (isVideoPlaying(videoRef.current)) {
        videoRef.current.pause();
      } else {
        videoRef.current.play()
      }
    }}>Play/Pause</button>
    <RenderPosesSimple />
    <RenderPose videoRef={videoRef} />
  </>
}

export default () => {
  return (<RecoilRoot>
    <MyApp />
  </RecoilRoot>)
}
