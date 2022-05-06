import * as posedetection from "@tensorflow-models/pose-detection";

export const DEFAULT_LINE_WIDTH = 1;
export const DEFAULT_RADIUS = 4;

const DEFAULT_KEYPOINT_FILL_STYLE = "Black";
const DEFAULT_KEYPOINT_STROKE_STYLE = "Blue";
const DEFAULT_SKELTON_FILL_STYLE = "Magenta";
const DEFAULT_SKELTON_STROKE_STYLE = "Violet";
const DEFAULT_SKELTON_LINE_WIDTH = 3;

export class PoseArtist {
  ctx = null;
  modelDetails = {
    modelConfig: null,
    model: null,
  };

  constructor(
    ctx,
    model,
    modelConfig,
    scaleFactor = 2,
    defaultLineWidth = DEFAULT_LINE_WIDTH,
    defaultRadius = DEFAULT_RADIUS,
    keypointFillStyle = DEFAULT_KEYPOINT_FILL_STYLE,
    keypointStrokeStyle = DEFAULT_KEYPOINT_STROKE_STYLE,
    skeltonFillStyle = DEFAULT_SKELTON_FILL_STYLE,
    skeltonStrokeStyle = DEFAULT_SKELTON_STROKE_STYLE,
    skeltonLineWidth = DEFAULT_SKELTON_LINE_WIDTH
  ) {
    this.ctx = ctx;
    this.modelDetails.model = model;
    this.modelDetails.modelConfig = { ...modelConfig };
    this.scaleFactor = scaleFactor;
    this.defaultLineWidth = defaultLineWidth;
    this.defaultRadius = defaultRadius;
    this.keypointFillStyle = keypointFillStyle;
    this.keypointStrokeStyle = keypointStrokeStyle;
    this.skeltonFillStyle = skeltonFillStyle;
    this.skeltonStrokeStyle = skeltonStrokeStyle;
    this.skeltonLineWidth = skeltonLineWidth;
  }
  drawResults(poses) {
    for (const pose of poses) {
      this.drawResult(pose);
    }
  }

  /**
   * Draw the keypoints and skeleton on the video.
   * @param pose A pose with keypoints to render.
   */
  drawResult(pose) {
    if (pose.keypoints != null) {
      this.drawKeypoints(pose.keypoints);
      this.drawSkeleton(pose.keypoints);
    }
  }

  /**
   * Draw the keypoints on the video.
   * @param keypoints A list of keypoints.
   */
  drawKeypoints(keypoints) {
    const keypointInd = posedetection.util.getKeypointIndexBySide(
      this.modelDetails.model
    );
    this.ctx.fillStyle = this.keypointFillStyle;
    this.ctx.strokeStyle = this.keypointStrokeStyle;
    this.ctx.lineWidth = this.defaultLineWidth;

    for (const i of keypointInd.middle) {
      this.drawKeypoint(keypoints[i]);
    }

    this.ctx.fillStyle = "Green";
    for (const i of keypointInd.left) {
      this.drawKeypoint(keypoints[i]);
    }

    this.ctx.fillStyle = "Orange";
    for (const i of keypointInd.right) {
      this.drawKeypoint(keypoints[i]);
    }
  }

  drawKeypoint(keypoint) {
    // If score is null, just show the keypoint.
    const score = keypoint.score != null ? keypoint.score : 1;
    const scoreThreshold = this.modelDetails.modelConfig.scoreThreshold || 0;

    if (score >= scoreThreshold) {
      const circle = new Path2D();
      console.log(keypoint.x, keypoint.y, this.defaultRadius);
      circle.arc(
        keypoint.x / this.scaleFactor,
        keypoint.y / this.scaleFactor,
        this.defaultRadius,
        0,
        2 * Math.PI
      );
      this.ctx.fill(circle);
      this.ctx.stroke(circle);
    }
  }

  /**
   * Draw the skeleton of a body on the video.
   * @param keypoints A list of keypoints.
   */
  drawSkeleton(keypoints) {
    this.ctx.skeltonFillStyle = this.skeltonFillStyle;
    this.ctx.strokeStyle = this.skeltonStrokeStyle;
    this.ctx.skeltonLineWidth = this.skeltonLineWidth;

    posedetection.util
      .getAdjacentPairs(this.modelDetails.model)
      .forEach(([i, j]) => {
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];

        // If score is null, just show the keypoint.
        const score1 = kp1.score != null ? kp1.score : 1;
        const score2 = kp2.score != null ? kp2.score : 1;
        const scoreThreshold =
          this.modelDetails.modelConfig.scoreThreshold || 0;

        if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
          this.ctx.beginPath();
          this.ctx.moveTo(kp1.x / this.scaleFactor, kp1.y / this.scaleFactor);
          this.ctx.lineTo(kp2.x / this.scaleFactor, kp2.y / this.scaleFactor);
          this.ctx.stroke();
        }
      });
  }
}
