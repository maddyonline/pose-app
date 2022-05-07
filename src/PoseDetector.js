// Copyright (c) 2018 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/*
PoseNet
The original PoseNet model was ported to TensorFlow.js by Dan Oved.
*/

import EventEmitter from "events";
import * as posedetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs-core";
// Register WebGL backend.
import "@tensorflow/tfjs-backend-webgl";

function callCallback(promise, callback) {
  if (!callback) return promise;
  return new Promise((resolve, reject) => {
    promise
      .then((result) => {
        callback(undefined, result);
        resolve(result);
      })
      .catch((error) => {
        callback(error);
        reject(error);
      });
  });
}

function getModelDetails(poseDetectorModel) {
  const model =
    poseDetectorModel === "movenet"
      ? posedetection.SupportedModels.MoveNet
      : posedetection.SupportedModels.BlazePose;
  const modelConfig =
    poseDetectorModel === "movenet"
      ? {
          modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        }
      : {
          runtime: "tfjs",
          enableSmoothing: true,
          modelType: "full",
        };
  return [model, modelConfig];
}

class PoseDetector extends EventEmitter {
  constructor(video, options, callback) {
    super();
    this.video = video;
    this.poseDetectorModel = options.poseDetectorModel;
    this.ready = callCallback(this.load(), callback);
    this.then = this.ready.then;
  }

  async load() {
    const [model, modelConfig] = getModelDetails(this.poseDetectorModel);

    this.net = await posedetection.createDetector(model, modelConfig);

    if (this.video) {
      if (this.video.readyState === 0) {
        await new Promise((resolve) => {
          this.video.onloadeddata = () => resolve();
        });
      }
      this.detectPose();
    }
    return this;
  }

  getInput(inputOr) {
    let input;
    if (
      inputOr instanceof HTMLImageElement ||
      inputOr instanceof HTMLVideoElement ||
      inputOr instanceof HTMLCanvasElement ||
      inputOr instanceof ImageData
    ) {
      input = inputOr;
    } else if (
      typeof inputOr === "object" &&
      (inputOr.elt instanceof HTMLImageElement ||
        inputOr.elt instanceof HTMLVideoElement ||
        inputOr.elt instanceof ImageData)
    ) {
      input = inputOr.elt; // Handle p5.js image and video
    } else if (
      typeof inputOr === "object" &&
      inputOr.canvas instanceof HTMLCanvasElement
    ) {
      input = inputOr.canvas; // Handle p5.js image
    } else {
      input = this.video;
    }

    return input;
  }

  /**
   * Given an image or video, returns an array of objects containing pose estimations
   *    using single or multi-pose detection.
   * @param {HTMLVideoElement || p5.Video || function} inputOr
   * @param {function} cb
   */
  /* eslint max-len: ["error", { "code": 180 }] */
  async detectPose(inputOr, cb) {
    const input = this.getInput(inputOr);

    const result = await this.net.estimatePoses(input, {
      maxPoses: 1,
      flipHorizontal: false,
    });
    // const poseWithParts = this.mapParts(pose);
    // const result = [{ pose: poseWithParts, skeleton: this.skeleton(pose.keypoints) }];
    this.emit("pose", result);

    if (this.video) {
      return tf.nextFrame().then(() => this.detectPose());
    }

    if (typeof cb === "function") {
      cb(result);
    }

    return result;
  }
}

const makePoseDetector = (video, options, callback) => {
  return new PoseDetector(video, options, callback);
};

export default makePoseDetector;
