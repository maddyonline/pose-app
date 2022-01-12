import logo from './logo.svg';
import './App.css';

import * as mpPose from '@mediapipe/pose';
import * as posedetection from '@tensorflow-models/pose-detection';
import React from 'react';
import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
} from 'recoil';

var rafId;

const isVideoPlaying = video => !!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2);

const posesState = atom({
  key: 'posesState', // unique ID (with respect to other atoms/selectors)
  default: [], // default value (aka initial value)
});


function MyApp() {
  const mediapipePoseDetector = React.useRef(null);
  const [poses, setPoses] = useRecoilState(posesState);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const ctxRef = React.useRef(null);
  React.useEffect(() => {
    if (canvasRef.current) {
      ctxRef.current = canvasRef.current.getContext('2d');
    }

  }, [canvasRef.current])
  React.useEffect(() => {
    const init = async () => {
      console.log(mpPose.VERSION)
      mediapipePoseDetector.current = await posedetection.createDetector(posedetection.SupportedModels.BlazePose, {
        runtime: 'mediapipe',
        modelType: 'heavy',
        solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${mpPose.VERSION}`
      });
      console.log({ current: mediapipePoseDetector.current })
    }
    init()
    return () => mediapipePoseDetector.current ?
      mediapipePoseDetector.current.dispose() : null
  }, [])
  return (
    <div className="App">

      <div style={{ display: "flex", border: "1px solid red" }}>
        <video style={{ width: '400px', height: '225px' }} ref={videoRef} autoPlay>
          <source src="/home-workout.mp4" type="video/mp4" />
        </video>
        <canvas style={{ width: '400px', height: '225px' }} ref={canvasRef} />
      </div>

      <button onClick={() => {
        if (isVideoPlaying(videoRef.current)) {
          videoRef.current.pause();
        } else {
          videoRef.current.play()
        }
      }}>Play/Pause</button>

      <button onClick={async () => {
        async function runFrame() {
          const poses = await mediapipePoseDetector.current.estimatePoses(
            videoRef.current,
            { maxPoses: 1, flipHorizontal: false });
          rafId = requestAnimationFrame(runFrame);
          setPoses(poses);
        }
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        runFrame();
      }}>Start</button>

      <div>{poses?.length > 0 ? JSON.stringify(poses[0]["keypoints"][0].x) : "null"}</div>

    </div>
  );
}

export default () => {
  return (<RecoilRoot>
    <MyApp />
  </RecoilRoot>)
}
