import logo from './logo.svg';
import './App.css';

import * as mpPose from '@mediapipe/pose';
import * as posedetection from '@tensorflow-models/pose-detection';
import React from 'react';

function App() {
  const mediapipePoseDetector = React.useRef(null);
  const videoRef = React.useRef(null);
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

      <div style={{ border: "1px solid red" }}>
        <video ref={videoRef} autoPlay>
          <source src="/home-workout.mp4" type="video/mp4" />
        </video>
      </div>
      <button onClick={() => videoRef.current.play()}>Play</button>

      <button onClick={async () => {
        const poses = await mediapipePoseDetector.current.estimatePoses(
          videoRef.current,
          { maxPoses: 1, flipHorizontal: false });
        console.log(poses);
      }}>Click</button>
    </div>
  );
}

export default App;
